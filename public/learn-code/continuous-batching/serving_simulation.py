"""Finite request scheduling, real allocation and explicitly modeled clocks.

Run: python serving_simulation.py
No language model is executed here. Cache coordinates are deterministic storage
fixtures; emissions are supplied completion events. Costs are illustrative,
not measured GPU times. PackedDecoder supplies the separate model comparison.
"""

from dataclasses import dataclass
import json
import math
import numpy as np
from shared_pool import SharedPool


@dataclass(frozen=True)
class Request:
    identity: str
    arrival: float
    prompt: int
    cap: int
    cancel_at: float | None = None


def simulate(
    requests,
    budget=6,
    pages=10,
    page_size=4,
    slots=3,
    chunk=4,
    reservation=False,
    fixed=0.2,
    linear=0.05,
    attention=0.001,
):
    requests = list(requests)
    if len({r.identity for r in requests}) != len(requests):
        raise ValueError("Duplicate ID.")
    if any(not isinstance(v, int) or v < 1 for v in [budget, pages, page_size, slots, chunk]):
        raise ValueError("Budgets and storage dimensions must be positive integers.")
    if (
        any(not math.isfinite(v) or v < 0 for v in [fixed, linear, attention])
        or fixed + linear <= 0
    ):
        raise ValueError(
            "Use finite nonnegative costs with positive per-iteration progress time."
        )
    for r in requests:
        if (
            r.prompt < 1
            or r.cap < 1
            or not isinstance(r.prompt, int)
            or not isinstance(r.cap, int)
        ):
            raise ValueError("Prompts and output caps must be positive integers.")
        if (
            not math.isfinite(r.arrival)
            or r.arrival < 0
            or (
                r.cancel_at is not None and (not math.isfinite(r.cancel_at) or r.cancel_at < 0)
            )
        ):
            raise ValueError("Arrival and cancellation times must be finite and nonnegative.")
    ordered = sorted(enumerate(requests), key=lambda pair: (pair[1].arrival, pair[0]))
    future = [r for _, r in ordered]
    waiting = []
    active = []
    pool = SharedPool(pages, page_size, layers=1, heads=1, width=1)
    states = {
        r.identity: {
            "request": r,
            "generated": 0,
            "emissions": [],
            "status": "future",
            "useful_rows": 0,
            "repeated_rows": 0,
            "high_water": 0,
            "preemptions": 0,
        }
        for r in requests
    }
    events = []
    iterations = []
    now = 0.0

    def finish(identity, status):
        state = states[identity]
        state["status"] = status
        state["finished"] = now
        if identity in active:
            active.remove(identity)
        if identity in waiting:
            waiting.remove(identity)
        if identity in pool.tables:
            pool.release(identity)
        events.append({"time": now, "event": status, "id": identity})

    def required_cap(identity):
        r = states[identity]["request"]
        return math.ceil((r.prompt + r.cap - 1) / page_size)

    def preempt(identity):
        pool.release(identity)
        active.remove(identity)
        waiting.append(identity)
        states[identity]["status"] = "waiting-rebuild"
        states[identity]["preemptions"] += 1
        events.append({"time": now, "event": "preempt", "id": identity})

    guard = 0
    while future or waiting or active:
        guard += 1
        if guard > 10000:
            raise RuntimeError(
                "Progress invariant failed; retained a bounded guard, not a silent spin."
            )
        if not active and not waiting and future and future[0].arrival > now:
            now = future[0].arrival
        while future and future[0].arrival <= now:
            r = future.pop(0)
            waiting.append(r.identity)
            states[r.identity]["status"] = "waiting"
            events.append({"time": now, "event": "arrive", "id": r.identity})
        for identity in list(active) + list(waiting):
            r = states[identity]["request"]
            if r.cancel_at is not None and r.cancel_at <= now:
                finish(identity, "canceled")
        while waiting and len(active) < slots:
            identity = waiting[0]
            if reservation:
                need = required_cap(identity)
                if need > pages:
                    finish(identity, "infeasible-cap-reservation")
                    continue
                if sum(required_cap(key) for key in active) + need > pages:
                    break
            waiting.pop(0)
            pool.create(identity)
            active.append(identity)
            states[identity]["status"] = "active"
            events.append({"time": now, "event": "admit", "id": identity})
        if not active:
            continue
        # The oldest admitted feasible request is protected until it progresses.
        protected = active[0]
        decode = []
        prefill = []
        for identity in active:
            state = states[identity]
            target = state["request"].prompt + max(0, state["generated"] - 1)
            (
                decode if state["generated"] and pool.lengths[identity] == target else prefill
            ).append(identity)
        order = decode + prefill
        # If decode-first would starve a protected rebuild, give it one row first.
        if protected not in decode and len(decode) >= budget:
            order = [protected] + [identity for identity in order if identity != protected]
        available = budget
        work = []
        emissions = []
        processed = set()
        for identity in order:
            if identity not in active or available == 0:
                continue
            state = states[identity]
            r = state["request"]
            old = pool.lengths[identity]
            target = r.prompt + max(0, state["generated"] - 1)
            kind = (
                "decode"
                if state["generated"] and old == target
                else ("recompute" if state["generated"] else "prefill")
            )
            rows = 1 if kind == "decode" else min(chunk, target - old, available)
            if old + 1 > pages * page_size:
                finish(identity, "infeasible-next-row")
                continue
            rows = min(rows, pages * page_size - old)
            need = math.ceil((old + rows) / page_size) - len(pool.tables[identity])
            if not reservation and identity == protected:
                while need > len(pool.free):
                    victims = [
                        key
                        for key in reversed(active)
                        if key != protected and key not in processed
                    ]
                    if not victims:
                        break
                    preempt(victims[0])
            if need > len(pool.free):
                continue
            # Storage fixtures preserve the same value for every logical position
            # across recomputation. They do not claim to predict model tokens.
            base = requests.index(r) * 1000
            keys = (base + np.arange(old, old + rows)).reshape(1, 1, rows, 1).astype(float)
            pool.append(identity, keys, -keys)
            # A preempted prompt can repeat positions before producing its first
            # token. Count by logical position, rather than by the stage label.
            repeated = max(0, min(old + rows, state["high_water"]) - old)
            state["repeated_rows"] += repeated
            state["useful_rows"] += rows - repeated
            state["high_water"] = max(state["high_water"], old + rows)
            processed.add(identity)
            available -= rows
            work.append(
                {
                    "id": identity,
                    "kind": kind,
                    "begin": old,
                    "rows": rows,
                    "new_rows": rows - repeated,
                    "repeated_rows": repeated,
                    "attention_pairs": rows * old + rows * (rows + 1) // 2,
                }
            )
            if kind == "decode" or (kind == "prefill" and pool.lengths[identity] == r.prompt):
                emissions.append(identity)
        if not work:
            # A protected one-row append fits after all other owners are released,
            # or the explicit infeasibility branch above terminates that owner.
            if active:
                raise RuntimeError("No progress despite a feasible protected request.")
            continue
        duration = (
            fixed
            + linear * sum(row["rows"] for row in work)
            + attention * sum(row["attention_pairs"] for row in work)
        )
        begin = now
        now += duration
        for identity in emissions:
            state = states[identity]
            state["generated"] += 1
            state["emissions"].append(now)
            events.append(
                {"time": now, "event": "emit", "id": identity, "output": state["generated"]}
            )
            if state["generated"] == state["request"].cap:
                finish(identity, "finished")
        pool.check_invariants()
        iterations.append(
            {
                "begin": begin,
                "end": now,
                "work": work,
                "resident_pages": int((pool.refs > 0).sum()),
                "pool": pool.snapshot(),
            }
        )
    results = {}
    for identity, state in states.items():
        emissions = state["emissions"]
        r = state["request"]
        results[identity] = {key: value for key, value in state.items() if key != "request"}
        results[identity].update(
            arrival=r.arrival,
            prompt=r.prompt,
            cap=r.cap,
            ttft=None if not emissions else emissions[0] - r.arrival,
            inter_token_gaps=[b - a for a, b in zip(emissions, emissions[1:])],
            response_elapsed=(
                (emissions[-1] - r.arrival) if state["status"] == "finished" else None
            ),
        )
    return {
        "scope": "Deterministic storage fixtures and supplied cost model; no language model or hardware benchmark.",
        "settings": {
            "budget": budget,
            "pages": pages,
            "page_size": page_size,
            "slots": slots,
            "chunk": chunk,
            "reservation": reservation,
            "fixed": fixed,
            "linear": linear,
            "attention": attention,
        },
        "requests": results,
        "events": events,
        "iterations": iterations,
        "finish": now,
    }


def verify():
    requests = [Request("A", 0, 3, 8), Request("B", 0, 3, 8), Request("long", 0.6, 12, 3)]
    cases = {
        name: simulate(requests, **settings)
        for name, settings in {
            "chunks4": {"chunk": 4},
            "whole_prefill": {"chunk": 64},
            "tight_incremental": {"pages": 5, "chunk": 4},
            "rebuild_after_output": {"pages": 8, "chunk": 4},
            "cap_reservation": {"pages": 5, "chunk": 4, "reservation": True},
        }.items()
    }
    cases["infeasible"] = simulate([Request("too-long", 0, 9, 2)], pages=2, page_size=4)
    cases["cancel"] = simulate([Request("A", 0, 4, 9, 0.4), Request("B", 0, 2, 1)], slots=2)
    for case in cases.values():
        settings = case["settings"]
        for iteration in case["iterations"]:
            assert sum(row["rows"] for row in iteration["work"]) <= settings["budget"]
            assert iteration["resident_pages"] <= settings["pages"]
            assert iteration["end"] > iteration["begin"]
        for identity, row in case["requests"].items():
            assert row["status"] in [
                "finished",
                "canceled",
                "infeasible-next-row",
                "infeasible-cap-reservation",
            ]
            assert len(row["emissions"]) == row["generated"]
            if row["status"] == "finished":
                assert row["generated"] == row["cap"]
                assert row["useful_rows"] == row["prompt"] + row["cap"] - 1
    assert cases["infeasible"]["requests"]["too-long"]["status"] == "infeasible-next-row"
    assert cases["cancel"]["requests"]["B"]["inter_token_gaps"] == []
    assert cases["cancel"]["requests"]["A"]["status"] == "canceled"
    assert all(row["preemptions"] == 0 for row in cases["chunks4"]["requests"].values())
    assert any(
        row["preemptions"] > 0 for row in cases["tight_incremental"]["requests"].values()
    )
    assert cases["tight_incremental"]["requests"]["long"]["repeated_rows"] == 4
    assert cases["rebuild_after_output"]["requests"]["long"]["repeated_rows"] == 13
    return cases


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
