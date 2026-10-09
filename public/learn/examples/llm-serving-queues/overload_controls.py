"""Inspect deadlines, bounded retries and delayed capacity in toy queues.

Run: python overload_controls.py --retry-policy jitter --startup-delay 5
Seconds/work units are supplied simulation inputs, not measured startup times.
Logical request identity is distinct from its offered attempt identities.
"""
from __future__ import annotations

import argparse
import heapq
import itertools
import json
import math
import random
from collections import deque

from queue_trace import occupancy_sweep


def deadline_trace(requests: list[dict], respect_waiting_cancel: bool = True,
                   cancel_running: bool = False) -> dict:
    previous, last_arrival, identities = 0.0, -math.inf, set()
    records = []
    for request in requests:
        arrival, service, deadline = (request[name] for name in ("arrival", "service", "deadline"))
        if not all(math.isfinite(value) for value in (arrival, service, deadline)):
            raise ValueError("Deadline inputs must be finite seconds.")
        if min(arrival, service) < 0 or deadline < arrival or arrival < last_arrival:
            raise ValueError("Chronological nonnegative arrivals/service and deadline>=arrival required.")
        if request["id"] in identities:
            raise ValueError("Request ids must be distinct.")
        identities.add(request["id"])
        last_arrival = arrival
        start = max(arrival, previous)
        if (respect_waiting_cancel or cancel_running) and start >= deadline:
            records.append({**request, "status": "canceled-before-start", "start": None,
                            "finish": deadline, "work_spent": 0})
            continue
        full_finish = start+service
        if cancel_running and deadline < full_finish:
            finish, status = deadline, "canceled-in-service"
        else:
            finish = full_finish
            status = "completed-in-time" if finish <= deadline else "completed-after-deadline"
        records.append({**request, "status": status, "start": start, "finish": finish,
                        "work_spent": finish-start, "estimated_margin_at_start": deadline-full_finish})
        previous = finish
    return {"records": records, "total_work_spent": sum(row["work_spent"] for row in records),
            "respect_waiting_cancel": respect_waiting_cancel, "cancel_running": cancel_running,
            "scope": "Known fixed service work. Cancellation at a boundary is a supplied policy."}


def retry_trace(policy: str = "jitter", max_attempts: int = 2,
                delay: float = .4, seed: int = 17) -> dict:
    if policy not in {"none", "synchronized", "jitter"} or max_attempts < 1:
        raise ValueError("Policy none/synchronized/jitter; positive attempt cap.")
    if not math.isfinite(delay) or delay < 0:
        raise ValueError("Retry delay must be finite nonnegative seconds.")
    rng, serial = random.Random(seed), itertools.count()
    heap, waiting, attempts, events = [], deque(), [], []
    logical = {identity: {"id": identity, "deadline": 2.0, "outcome": None,
                          "attempts": []} for identity in ["A", "B", "C", "D"]}
    for identity in logical:
        heapq.heappush(heap, (0.0, 1, next(serial), "offer", identity, 1))
    running = None

    def start(time: float) -> None:
        nonlocal running
        while running is None and waiting:
            attempt_index = waiting.popleft()
            attempt = attempts[attempt_index]
            request = logical[attempt["logical_id"]]
            if time >= request["deadline"]:
                attempt.update(status="expired-waiting", finish=request["deadline"])
                request["outcome"] = "deadline-expired"
                continue
            attempt.update(status="running", start=time)
            running = attempt_index
            heapq.heappush(heap, (time+.3, 0, next(serial), "complete", attempt_index, 0))

    while heap:
        time, _, _, kind, identity, number = heapq.heappop(heap)
        if kind == "complete":
            attempt = attempts[identity]
            attempt.update(status="completed", finish=time)
            request = logical[attempt["logical_id"]]
            request["outcome"] = "success" if time <= request["deadline"] else "late-completion"
            events.append({"time": time, "event": "complete", "attempt": attempt["id"]})
            running = None
            start(time)
            continue
        request = logical[identity]
        attempt_id = f"{identity}-attempt-{number}"
        attempt = {"id": attempt_id, "logical_id": identity, "number": number,
                   "arrival": time, "start": None, "finish": None, "parent":
                   f"{identity}-attempt-{number-1}" if number > 1 else None}
        request["attempts"].append(attempt_id)
        attempts.append(attempt)
        attempt_index = len(attempts)-1
        if time >= request["deadline"]:
            attempt["status"] = "expired-before-offer"
            request["outcome"] = "deadline-expired"
        elif len(waiting)+(running is not None) >= 2:
            attempt["status"] = "rejected"
            if policy != "none" and number < max_attempts:
                backoff = delay if policy == "synchronized" else delay*rng.uniform(.5, 1.5)
                heapq.heappush(heap, (time+backoff, 1, next(serial), "offer", identity, number+1))
                attempt["next_retry"] = time+backoff
            else:
                request["outcome"] = "rejected-no-retry" if policy == "none" else "rejected-at-cap"
        else:
            attempt["status"] = "waiting"
            waiting.append(attempt_index)
            start(time)
        events.append({"time": time, "event": "offer", "attempt": attempt_id,
                       "status_after_offer": attempt["status"]})
    return {"policy": policy, "max_attempts": max_attempts, "seed": seed,
            "attempts": attempts, "events": events, "logical_requests": list(logical.values()),
            "offered_attempts": len(attempts),
            "logical_successes": sum(row["outcome"] == "success" for row in logical.values()),
            "scope": "Four simultaneous requests, one unit server, service .3s, total capacity2; illustrative."}


def delayed_capacity(startup_delay: float = 5, initial_servers: int = 2) -> dict:
    if not math.isfinite(startup_delay) or startup_delay < 0 or initial_servers < 1:
        raise ValueError("Nonnegative finite startup delay and positive initial server count required.")
    trigger, ready_time = 10.0, 10.0+startup_delay
    arrivals = [10+index/3 for index in range(30)]
    rows = [{"id": f"burst-{index}", "arrival": time, "start": None, "departure": None}
            for index, time in enumerate(arrivals)]
    serial, heap, waiting = itertools.count(), [], deque()
    for index, time in enumerate(arrivals):
        heapq.heappush(heap, (time, 1, next(serial), "arrival", index))
    heapq.heappush(heap, (ready_time, 0, next(serial), "ready", initial_servers))
    idle = list(range(initial_servers))
    heapq.heapify(idle)
    running, history = {}, [{"time": trigger, "event": "scale-requested",
                            "pending_servers": 1, "ready_time": ready_time}]
    installed = initial_servers

    def dispatch(time: float) -> None:
        while idle and waiting:
            job, server = waiting.popleft(), heapq.heappop(idle)
            rows[job].update(start=time, server=server)
            running[job] = server
            heapq.heappush(heap, (time+1, 0, next(serial), "departure", job))

    while heap:
        time, _, _, kind, index = heapq.heappop(heap)
        if kind == "ready":
            installed += 1
            heapq.heappush(idle, index)
        elif kind == "arrival":
            waiting.append(index)
        else:
            rows[index]["departure"] = time
            heapq.heappush(idle, running.pop(index))
        dispatch(time)
        history.append({"time": time, "event": kind, "installed_servers": installed,
                        "pending_servers": int(time < ready_time), "waiting": len(waiting),
                        "running": len(running)})
    drain_time = max(row["departure"] for row in rows)
    horizon = max(drain_time, ready_time)
    queue_area = occupancy_sweep([(row["arrival"], row["start"]) for row in rows], 0, horizon)
    return {"startup_delay": startup_delay, "trigger": trigger, "ready_time": ready_time,
            "initial_servers": initial_servers, "records": rows, "events": history,
            "queue_area": queue_area, "drain_time": drain_time, "controller_horizon": horizon,
            "controller": "One prescribed scale-out; pending capacity is not installed capacity. No scale-in.",
            "scope": "Burst of30 unit-work jobs at3/s, supplied startup delay; no measured platform startup."}


def hysteresis_trace(samples: list[dict], startup_delay: float = 5,
                     scale_in_hold: float = 10, high_queue: int = 4,
                     low_queue: int = 0) -> dict:
    """Sampled controller: two warm servers, at most three, remove idle only.

    Queue/busy observations are supplied, not predicted. Scale-in needs consecutive
    low samples spanning the hold. Actions occur at sample times, not interpolated.
    """
    if not all(math.isfinite(value) and value >= 0 for value in (startup_delay, scale_in_hold)):
        raise ValueError("Startup and hold durations finite nonnegative.")
    if not 0 <= low_queue < high_queue:
        raise ValueError("Nonnegative low threshold strictly below high threshold required.")
    installed, pending_ready, low_since = 2, None, None
    previous, rows = -math.inf, []
    for sample in samples:
        time, queue, busy = sample["time"], sample["queue"], sample["busy"]
        if not math.isfinite(time) or time < 0 or time <= previous or min(queue, busy) < 0:
            raise ValueError("Strict chronological nonnegative samples required.")
        previous = time
        actions = []
        if pending_ready is not None and time >= pending_ready:
            installed += 1
            actions.append({"action": "capacity-ready", "actual_ready_time": pending_ready})
            pending_ready = None
        if busy > installed:
            raise ValueError("Observed busy servers exceed installed servers.")
        if queue >= high_queue and installed < 3 and pending_ready is None:
            pending_ready = time+startup_delay
            actions.append({"action": "request-scale-out", "ready_time": pending_ready})
            if startup_delay == 0:
                installed += 1
                pending_ready = None
                actions.append({"action": "capacity-ready", "actual_ready_time": time})
        if queue <= low_queue:
            low_since = time if low_since is None else low_since
            if installed > 2 and pending_ready is None and busy < installed and time-low_since >= scale_in_hold:
                installed -= 1
                actions.append({"action": "remove-idle-server", "low_observed_since": low_since})
        else:
            low_since = None
        rows.append({**sample, "installed": installed, "pending_ready": pending_ready,
                     "low_since": low_since, "actions": actions})
    return {"samples": rows, "warm_floor": 2, "maximum_servers": 3,
            "startup_delay": startup_delay, "scale_in_hold": scale_in_hold,
            "scope": "Supplied sampled observations; no measured autoscaler or universal timings."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--retry-policy", choices=["none", "synchronized", "jitter"], default="jitter")
    parser.add_argument("--startup-delay", type=float, default=5)
    args = parser.parse_args()
    requests = [{"id": "A", "arrival": 0, "service": 4, "deadline": 10},
                {"id": "B", "arrival": .5, "service": 1, "deadline": 2},
                {"id": "C", "arrival": 1, "service": 2, "deadline": 5}]
    print(json.dumps({"deadline_cancel": deadline_trace(requests),
                      "deadline_ignore_cancel": deadline_trace(requests, False),
                      "retries": retry_trace(args.retry_policy),
                      "capacity": delayed_capacity(args.startup_delay),
                      "hysteresis": hysteresis_trace([
                          {"time": 0, "queue": 0, "busy": 1},
                          {"time": 10, "queue": 5, "busy": 2},
                          {"time": 12, "queue": 6, "busy": 2},
                          {"time": 15, "queue": 4, "busy": 2},
                          {"time": 20, "queue": 0, "busy": 2},
                          {"time": 25, "queue": 0, "busy": 1},
                          {"time": 30, "queue": 0, "busy": 1},
                      ], args.startup_delay)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
