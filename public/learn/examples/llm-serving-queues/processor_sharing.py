"""Event-driven ideal processor sharing at fixed aggregate work capacity.

Run: python processor_sharing.py --capacity 1
Work sizes are work units. Capacity is work units/second. No timestep grid.
The server equally shares capacity among active jobs with costless preemption.
Real token batching has a different state-dependent cost and is not this model.
"""
from __future__ import annotations

import argparse
import json
import math

from queue_trace import Request, fcfs, occupancy_sweep, validate_requests


def simulate_ps(requests: list[Request], capacity: float = 1) -> dict:
    validate_requests(requests)
    if not math.isfinite(capacity) or capacity <= 0:
        raise ValueError("Capacity must be finite positive work units/second.")
    active = {}
    records = [{"id": request.id, "arrival": request.arrival, "work": request.service,
                "departure": None, "residence": None} for request in requests]
    history, segments = [], []
    index, time, processed_work = 0, 0.0, 0.0
    attained_work, completion_roundoff_work = 0.0, 0.0
    event_count = 0
    while index < len(requests) or active:
        event_count += 1
        if event_count > 2*len(requests)+1:
            raise RuntimeError("Event progress failed; refuse unbounded history growth.")
        if not active:
            time = requests[index].arrival
        next_arrival = requests[index].arrival if index < len(requests) else math.inf
        if active:
            share = capacity/len(active)
            minimum_remaining = min(active.values())
            completion_delta = minimum_remaining/share
            arrival_delta = next_arrival-time
            completion_selected = completion_delta <= arrival_delta
            duration = min(arrival_delta, completion_delta)
            next_time = time+duration if completion_selected else next_arrival
            before = dict(active)
            for job in active:
                active[job] = max(0.0, active[job]-duration*share)
            # Dispatch the selected event even if an absolute timestamp rounds
            # back to time. Completion wins a tie with an arrival. Exact equal
            # remaining-work minima complete together; no enlarged tolerance.
            finished = ([job for job, work in before.items()
                         if work == minimum_remaining] if completion_selected else [])
            dispatched_residual = math.fsum(active[job] for job in finished)
            for job in finished:
                active[job] = 0.0
            delivered = math.fsum(before[job]-active[job] for job in active)
            processed_work += duration*capacity
            attained_work += delivered
            completion_roundoff_work += dispatched_residual
            segments.append({"start": time, "end": next_time, "count": len(active),
                             "share_per_request": share,
                             "elapsed_operand": duration,
                             "represented_elapsed": next_time-time,
                             "completion_selected": completion_selected,
                             "completion_roundoff_work": dispatched_residual,
                             "attained_work": delivered,
                             "remaining_before": {records[job]["id"]: work for job, work in before.items()},
                             "remaining_after": {records[job]["id"]: work for job, work in active.items()}})
            time = next_time
            for job in finished:
                active.pop(job)
                records[job].update(departure=time, residence=time-records[job]["arrival"])
                history.append({"time": time, "event": "complete", "id": records[job]["id"]})
        while index < len(requests) and requests[index].arrival <= time:
            request = requests[index]
            if request.service == 0:
                records[index].update(departure=time, residence=0.0)
                history.append({"time": time, "event": "zero-work-complete", "id": request.id})
            else:
                active[index] = request.service
                history.append({"time": time, "event": "arrive", "id": request.id})
            index += 1
    horizon = max((row["departure"] for row in records), default=0)
    population = occupancy_sweep([(row["arrival"], row["departure"]) for row in records], 0, horizon) if horizon > 0 else None
    expected_work = sum(request.service for request in requests)
    if not math.isclose(processed_work, expected_work, rel_tol=1e-9, abs_tol=1e-9):
        raise AssertionError("Aggregate attained work does not equal submitted work.")
    if not math.isclose(attained_work, expected_work, rel_tol=1e-9, abs_tol=1e-9):
        raise AssertionError("Remaining-work accounting differs from submitted work.")
    return {"capacity_work_per_second": capacity, "records": records, "events": history,
            "segments": segments, "submitted_work": expected_work,
            "processed_work": processed_work, "population": population,
            "attained_work": attained_work,
            "completion_roundoff_work": completion_roundoff_work,
            "nominal_minus_attained_work": processed_work-attained_work,
            "event_count": event_count,
            "clock_note": "Advance relative event work; absolute timestamps may quantize sub-ULP intervals.",
            "model": "Ideal equal sharing, fixed aggregate capacity, zero preemption overhead."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capacity", type=float, default=1)
    args = parser.parse_args()
    requests = [Request("A", 0, 4), Request("B", 1, 1)]
    fcfs_seconds = [Request(row.id, row.arrival, row.service/args.capacity) for row in requests]
    print(json.dumps({"ps": simulate_ps(requests, args.capacity),
                      "matched_fcfs": fcfs(fcfs_seconds)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
