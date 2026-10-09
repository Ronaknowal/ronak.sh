"""Event-driven pooled FCFS servers with optional finite total population.

Run: python event_queues.py --servers 2 --capacity 3
Run stationary example: python event_queues.py --count 30000 --load .8 --seed 17
Units: arrival/service/departure in seconds; one server works at one unit/second.
The engine is simulated; these are not measured GPU or Azure latencies.
"""
from __future__ import annotations

import argparse
import heapq
import itertools
import json
import math
from collections import deque

import numpy as np

from queue_trace import DEFAULT_REQUESTS, Request, occupancy_sweep, validate_requests


def generate_requests(count: int, arrival_rate: float, seed: int,
                      distribution: str = "exponential", mean_service: float = 1) -> list[Request]:
    if count < 0 or arrival_rate <= 0 or mean_service <= 0:
        raise ValueError("Count nonnegative; arrival rate and mean service positive.")
    if not all(math.isfinite(value) for value in (arrival_rate, mean_service)):
        raise ValueError("Finite rates/durations required.")
    arrival_seed, service_seed = np.random.SeedSequence(seed).spawn(2)
    arrival_rng = np.random.default_rng(arrival_seed)
    service_rng = np.random.default_rng(service_seed)
    arrivals = np.cumsum(arrival_rng.exponential(1/arrival_rate, count))
    if distribution == "exponential":
        services = service_rng.exponential(mean_service, count)
    elif distribution == "constant":
        services = np.full(count, mean_service)
    elif distribution == "mixture":
        services = np.where(service_rng.random(count) < .9, .5, 5.5)*mean_service
    else:
        raise ValueError("Distribution is exponential, constant or mixture.")
    return [Request(str(index), float(arrival), float(service))
            for index, (arrival, service) in enumerate(zip(arrivals, services))]


def simulate(requests: list[Request], servers: int = 1, capacity: int | None = None,
             stop_time: float | None = None) -> dict:
    validate_requests(requests)
    if isinstance(servers, bool) or not isinstance(servers, int) or servers < 1:
        raise ValueError("Need a positive integer server count.")
    if capacity is not None and (not isinstance(capacity, int) or capacity < servers):
        raise ValueError("K counts total residents and must be at least the server count.")
    if stop_time is not None and (not math.isfinite(stop_time) or stop_time < 0):
        raise ValueError("Stop time must be finite nonnegative seconds.")
    serial = itertools.count()
    events = []
    for index, request in enumerate(requests):
        heapq.heappush(events, (request.arrival, 1, next(serial), "arrival", index))
    # Departures precede arrivals at a tie. Arrivals retain source order.
    idle_servers = list(range(servers))
    heapq.heapify(idle_servers)
    waiting = deque()
    running = {}
    records = [{"id": item.id, "arrival": item.arrival, "service": item.service,
                "status": "not-arrived", "start": None, "departure": None,
                "planned_departure": None, "server": None} for item in requests]
    history = []
    last_time = 0.0

    def start_waiting(time: float) -> None:
        while idle_servers and waiting:
            index = waiting.popleft()
            server = heapq.heappop(idle_servers)
            row = records[index]
            row.update(status="running", start=time, server=server,
                       planned_departure=time+row["service"])
            running[index] = server
            heapq.heappush(events, (row["planned_departure"], 0, next(serial), "departure", index))
            history.append({"time": time, "event": "start", "id": row["id"], "server": server})

    while events:
        time, _, _, kind, index = heapq.heappop(events)
        if stop_time is not None and time > stop_time:
            break
        last_time = time
        row = records[index]
        if kind == "arrival":
            if capacity is not None and len(waiting)+len(running) >= capacity:
                row["status"] = "rejected"
                history.append({"time": time, "event": "reject", "id": row["id"]})
            else:
                row["status"] = "waiting"
                waiting.append(index)
                history.append({"time": time, "event": "admit", "id": row["id"]})
                start_waiting(time)
        else:
            server = running.pop(index)
            heapq.heappush(idle_servers, server)
            row.update(status="completed", departure=time,
                       wait=row["start"]-row["arrival"], residence=time-row["arrival"])
            history.append({"time": time, "event": "complete", "id": row["id"], "server": server})
            start_waiting(time)
    horizon = stop_time if stop_time is not None else last_time
    accepted = [row for row in records if row["status"] in {"waiting", "running", "completed"}]
    completed = [row for row in accepted if row["status"] == "completed"]
    if horizon > 0:
        system_intervals = [(row["arrival"], row["departure"] if row["departure"] is not None else horizon)
                            for row in accepted]
        queue_intervals = [(row["arrival"], row["start"] if row["start"] is not None else horizon)
                           for row in accepted]
        service_intervals = [(row["start"], row["departure"] if row["departure"] is not None else horizon)
                             for row in accepted if row["start"] is not None]
        measurements = {
            "system": occupancy_sweep(system_intervals, 0, horizon),
            "queue": occupancy_sweep(queue_intervals, 0, horizon),
            "service": occupancy_sweep(service_intervals, 0, horizon),
        }
    else:
        measurements = None
    return {"servers": servers, "capacity_total": capacity, "horizon": horizon,
            "records": records, "events": history, "measurements": measurements,
            "counts": {"offered": sum(row["status"] != "not-arrived" for row in records),
                       "accepted": len(accepted), "completed": len(completed),
                       "rejected": sum(row["status"] == "rejected" for row in records)},
            "boundary_note": "Planned departures beyond cutoff are not observed completions."}


def closed_client_arrivals(service_sizes: list[float], clients: int = 2) -> list[Request]:
    """Fixed-concurrency clients submit their next job only after prior completion.

    This fixture uses one FCFS server and zero client think time. It builds an
    offered schedule different from an externally fixed open timestamp plan.
    """
    if clients < 1 or any(not math.isfinite(size) or size < 0 for size in service_sizes):
        raise ValueError("Clients positive and service sizes finite nonnegative.")
    ready = [(0.0, client) for client in range(min(clients, len(service_sizes)))]
    heapq.heapify(ready)
    previous_departure = 0.0
    requests = []
    for index, size in enumerate(service_sizes):
        arrival, client = heapq.heappop(ready)
        departure = max(arrival, previous_departure)+size
        requests.append(Request(f"client{client}-job{index}", arrival, size))
        previous_departure = departure
        heapq.heappush(ready, (departure, client))
    return requests


def route_snapshot(states: list[list[dict]], new_work: float, policy: str = "count") -> dict:
    """One FCFS routing decision with explicitly known remaining work.

    Work-based selection is an oracle demonstration, not an output-length
    estimator for a production LLM. Each replica has unit work capacity.
    """
    if not states or not math.isfinite(new_work) or new_work < 0:
        raise ValueError("Need replicas and finite nonnegative new work.")
    for queue in states:
        if any(not math.isfinite(job["remaining"]) or job["remaining"] < 0 for job in queue):
            raise ValueError("Remaining work must be finite nonnegative.")
    if policy not in {"count", "known-work"}:
        raise ValueError("Policy is count or known-work.")
    scores = [len(queue) if policy == "count" else sum(job["remaining"] for job in queue)
              for queue in states]
    selected = min(range(len(states)), key=lambda index: (scores[index], index))
    after = [[dict(job) for job in queue] for queue in states]
    after[selected].append({"id": "new", "remaining": new_work})
    return {"policy": policy, "scores": scores, "selected_replica": selected,
            "queues_after": after,
            "new_fcfs_response_at_unit_capacity": sum(job["remaining"] for job in after[selected]),
            "knowledge": "Actual remaining work supplied; real future output length need not be known."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--servers", type=int, default=1)
    parser.add_argument("--capacity", type=int)
    parser.add_argument("--count", type=int)
    parser.add_argument("--load", type=float, default=.8)
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--distribution", choices=["constant", "exponential", "mixture"], default="exponential")
    parser.add_argument("--stop-time", type=float)
    args = parser.parse_args()
    requests = (generate_requests(args.count, args.load*args.servers, args.seed, args.distribution)
                if args.count is not None else DEFAULT_REQUESTS)
    print(json.dumps(simulate(requests, args.servers, args.capacity, args.stop_time),
                     indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
