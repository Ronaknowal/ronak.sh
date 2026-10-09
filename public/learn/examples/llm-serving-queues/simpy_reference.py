"""Ordinary-library FCFS reference using real SimPy 4.1.2 on the CPU.

Setup: python -m pip install simpy==4.1.2 numpy==2.3.5
Run: python simpy_reference.py --servers 1
Run tied fixture: python simpy_reference.py --ties --servers 2
Simulated seconds are event coordinates, not CPU benchmark duration or GPU time.
Resource manages capacity and queued request events; with releases automatically.
"""
from __future__ import annotations

import argparse
import json
import math

import simpy

from event_queues import simulate
from queue_trace import DEFAULT_REQUESTS, Request, validate_requests


def delta_area(changes: list[tuple[float, int]], horizon: float) -> dict:
    """Independent time monitor over observed library events."""
    grouped = {}
    for time, delta in changes:
        grouped[time] = grouped.get(time, 0)+delta
    count, previous, area = 0, 0.0, 0.0
    segments = []
    for time in sorted(grouped):
        if time > previous:
            area += count*(time-previous)
            segments.append({"start": previous, "end": time, "count": count})
        count += grouped[time]
        if count < 0:
            raise AssertionError("Observed population became negative.")
        previous = time
    if horizon > previous:
        area += count*(horizon-previous)
        segments.append({"start": previous, "end": horizon, "count": count})
    return {"area": area, "segments": segments,
            "mean_population": area/horizon if horizon > 0 else None}


def library_trace(requests: list[Request], servers: int = 1) -> dict:
    validate_requests(requests)
    if isinstance(servers, bool) or not isinstance(servers, int) or servers < 1:
        raise ValueError("Resource capacity must be a positive integer.")
    environment = simpy.Environment()
    resource = simpy.Resource(environment, capacity=servers)
    rows, history, system_deltas, queue_deltas = {}, [], [], []

    def serve(request: Request):
        # Each process waits to its absolute arrival coordinate from time zero.
        yield environment.timeout(request.arrival)
        arrival = environment.now
        system_deltas.append((arrival, 1))
        queue_deltas.append((arrival, 1))
        history.append({"time": arrival, "event": "arrival", "id": request.id})
        with resource.request() as access:
            # Yield the request event: resume only once a resource slot is acquired.
            yield access
            start = environment.now
            queue_deltas.append((start, -1))
            history.append({"time": start, "event": "start", "id": request.id,
                            "resource_users": resource.count, "queued_events": len(resource.queue)})
            yield environment.timeout(request.service)
            departure = environment.now
            system_deltas.append((departure, -1))
            history.append({"time": departure, "event": "complete", "id": request.id})
            rows[request.id] = {"id": request.id, "arrival": arrival, "start": start,
                                "service": request.service, "departure": departure,
                                "wait": start-arrival, "residence": departure-arrival}
        # Context manager releases even if the process leaves by an exception.

    for request in requests:
        environment.process(serve(request))
    environment.run()
    horizon = environment.now
    return {"library": "SimPy", "version": simpy.__version__, "servers": servers,
            "horizon": horizon, "records": [rows[request.id] for request in requests],
            "events": history, "system_monitor": delta_area(system_deltas, horizon),
            "queue_monitor": delta_area(queue_deltas, horizon),
            "tie_note": "SimPy handles equal-time events in insertion order; this unbounded FCFS fixture agrees in starts/departures despite zero-duration scheduling microsteps."}


def compare(requests: list[Request], servers: int) -> dict:
    library = library_trace(requests, servers)
    scratch = simulate(requests, servers)
    comparisons = []
    for actual, expected in zip(library["records"], scratch["records"]):
        differences = {name: actual[name]-expected[name] for name in ("start", "departure", "wait", "residence")}
        comparisons.append({"id": actual["id"], "differences": differences})
    for population in ("system", "queue"):
        monitor = library[f"{population}_monitor"]["area"]
        expected = scratch["measurements"][population]["area"] if scratch["measurements"] else 0
        comparisons.append({"quantity": population+"_area", "difference": monitor-expected})
    passed = all(all(abs(value) <= 1e-9 for value in row.get("differences", {}).values())
                 and abs(row.get("difference", 0)) <= 1e-9 for row in comparisons)
    # Return observations before a caller chooses whether failure should be fatal.
    return {"library": library, "scratch": scratch, "comparisons": comparisons, "matched": passed}


def canceled_waiting_example() -> dict:
    """A request context manager cancels a timed-out pending resource request."""
    environment = simpy.Environment()
    resource = simpy.Resource(environment, capacity=1)
    events = []

    def holder():
        with resource.request() as access:
            yield access
            yield environment.timeout(3)

    def impatient():
        yield environment.timeout(.5)
        with resource.request() as access:
            outcome = yield access | environment.timeout(1)
            if access not in outcome:
                events.append({"time": environment.now, "event": "pending-request-canceled"})
                return
            events.append({"time": environment.now, "event": "unexpectedly-acquired"})

    environment.process(holder())
    environment.process(impatient())
    environment.run()
    return {"events": events, "remaining_queue": len(resource.queue), "remaining_users": resource.count}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--servers", type=int, default=1)
    parser.add_argument("--ties", action="store_true")
    args = parser.parse_args()
    requests = [Request("A", 0, 2), Request("B", 1, 1), Request("C", 2, 1)] if args.ties else DEFAULT_REQUESTS
    report = {"matched_fixture": compare(requests, args.servers),
              "pending_cancellation": canceled_waiting_example()}
    print(json.dumps(report, indent=2, allow_nan=False))
    if not report["matched_fixture"]["matched"]:
        raise SystemExit("Library and scratch fixture disagree; observations printed above.")


if __name__ == "__main__":
    main()
