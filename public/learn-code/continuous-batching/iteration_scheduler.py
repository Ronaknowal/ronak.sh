"""Finite FIFO iteration scheduling with arrivals and boundary cancellation.

Run: python iteration_scheduler.py
Lengths are simulator completion events, never admission priorities. Every
active request gets one work unit per step. These steps are not milliseconds.
"""

from collections import deque
from dataclasses import dataclass
import json


@dataclass(frozen=True)
class Job:
    identity: str
    arrival: int
    length: int
    cancel_at: int | None = None


def schedule(jobs, slots=4, policy="continuous"):
    if slots < 1 or policy not in ("continuous", "static"):
        raise ValueError("Positive slots and continuous/static policy required.")
    jobs = list(jobs)
    if len({job.identity for job in jobs}) != len(jobs):
        raise ValueError("Duplicate request ID; no scheduling state was mutated.")
    for job in jobs:
        values = [job.arrival, job.length]
        if job.cancel_at is not None:
            values.append(job.cancel_at)
        if any(not isinstance(v, int) or v < 0 for v in values):
            raise ValueError(
                "Arrivals, lengths and cancellation boundaries are nonnegative integers."
            )
    ordered = sorted(enumerate(jobs), key=lambda pair: (pair[1].arrival, pair[0]))
    future = deque(job for _, job in ordered)
    waiting, active = deque(), [None] * slots
    remaining = {job.identity: job.length for job in jobs}
    result = {
        job.identity: {
            "arrival": job.arrival,
            "start": None,
            "finish": None,
            "status": None,
            "work": 0,
            "slot": None,
        }
        for job in jobs
    }
    events, intervals = [], []
    now = 0

    def terminal(job, status):
        result[job.identity].update(finish=now, status=status)
        events.append({"time": now, "event": status, "id": job.identity})

    while future or waiting or any(job is not None for job in active):
        if (
            not waiting
            and not any(job is not None for job in active)
            and future[0].arrival > now
        ):
            now = future[0].arrival
        while future and future[0].arrival <= now:
            job = future.popleft()
            events.append({"time": now, "event": "arrive", "id": job.identity})
            waiting.append(job)
        retained = deque()
        while waiting:
            job = waiting.popleft()
            if job.cancel_at is not None and job.cancel_at <= now:
                terminal(job, "canceled")
            elif job.length == 0:
                terminal(job, "empty")
            else:
                retained.append(job)
        waiting = retained
        for slot, job in enumerate(active):
            if job is not None and job.cancel_at is not None and job.cancel_at <= now:
                terminal(job, "canceled")
                active[slot] = None
        may_admit = policy == "continuous" or all(job is None for job in active)
        if may_admit:
            for slot, current in enumerate(active):
                if current is None and waiting:
                    job = waiting.popleft()
                    active[slot] = job
                    result[job.identity].update(start=now, slot=slot)
                    events.append(
                        {"time": now, "event": "admit", "id": job.identity, "slot": slot}
                    )
        if not any(job is not None for job in active):
            continue
        for slot, job in enumerate(active):
            if job is None:
                continue
            # This counter is the workload's completion oracle, not a policy input.
            remaining[job.identity] -= 1
            result[job.identity]["work"] += 1
        now += 1
        for slot, job in enumerate(active):
            if job is not None and remaining[job.identity] == 0:
                terminal(job, "finished")
                active[slot] = None
    for identity, row in result.items():
        if row["start"] is not None:
            intervals.append(
                {
                    "id": identity,
                    "slot": row["slot"],
                    "begin": row["start"],
                    "end": row["finish"],
                }
            )
    return {
        "policy": policy,
        "slots": slots,
        "finish": now,
        "requests": result,
        "events": events,
        "intervals": intervals,
        "useful_work": sum(row["work"] for row in result.values()),
    }


def verify():
    original = [
        Job(chr(65 + i), 0, length)
        for i, length in enumerate([30, 500, 25, 480, 40, 450, 20, 510])
    ]
    dynamic, static = schedule(original), schedule(original, policy="static")
    assert dynamic["finish"] == 595 and static["finish"] == 1010
    assert dynamic["useful_work"] == static["useful_work"] == 2055
    assert {key: row["finish"] for key, row in dynamic["requests"].items()} == {
        "A": 30,
        "B": 500,
        "C": 25,
        "D": 480,
        "E": 65,
        "F": 480,
        "G": 85,
        "H": 595,
    }
    assert schedule([])["finish"] == 0
    assert schedule([Job("empty", 3, 0)])["requests"]["empty"]["status"] == "empty"
    single = [Job("A", 5, 4)]
    assert schedule(single)["intervals"] == schedule(single, policy="static")["intervals"]
    cancel = schedule([Job("A", 0, 9, 2), Job("B", 1, 3)], slots=1)
    assert cancel["requests"]["A"]["work"] == 2
    assert cancel["requests"]["B"]["start"] == 2
    assert cancel["finish"] == 5
    changed = [
        Job(str(i), arrival, length)
        for i, (arrival, length) in enumerate(zip([0, 0, 1, 5], [3, 7, 2, 1]))
    ]
    outputs = {
        "main": {"continuous": dynamic, "static": static},
        "transfer": {mode: schedule(changed, 2, mode) for mode in ["continuous", "static"]},
        "cancel": cancel,
    }
    # Independently reconstruct capacity and exact completed work from intervals.
    for case in [dynamic, static, cancel, *outputs["transfer"].values()]:
        assert (
            sum(row["end"] - row["begin"] for row in case["intervals"]) == case["useful_work"]
        )
        boundaries = sorted(
            {point for row in case["intervals"] for point in [row["begin"], row["end"]]}
        )
        for point in boundaries:
            live = [row for row in case["intervals"] if row["begin"] <= point < row["end"]]
            assert len(live) <= case["slots"]
            assert len({row["slot"] for row in live}) == len(live)
    return outputs


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
