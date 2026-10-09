"""Reconstruct a FCFS queue in seconds, including independent occupancy area.

Run: python queue_trace.py --left 0 --right 7
CSV input: id,arrival,service (chronological arrival order, seconds).
Output: JSON request records and clipped system/queue/busy-time measurements.
This is a fixed-rate, nonpreemptive single-server model, not a GPU benchmark.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class Request:
    id: str
    arrival: float
    service: float


DEFAULT_REQUESTS = [
    Request("A", 0.0, 3.0),
    Request("B", 1.0, 1.0),
    Request("C", 2.0, 2.0),
    Request("D", 6.0, 1.0),
]


def validate_requests(requests: list[Request]) -> None:
    seen = set()
    previous = -math.inf
    for request in requests:
        if not request.id or request.id in seen:
            raise ValueError("Every request needs a distinct nonempty id.")
        seen.add(request.id)
        if not all(math.isfinite(x) and x >= 0 for x in (request.arrival, request.service)):
            raise ValueError("Arrival and service must be finite nonnegative seconds.")
        if request.arrival < previous:
            raise ValueError("Requests must be chronological; ties keep input order.")
        previous = request.arrival


def fcfs(requests: list[Request]) -> list[dict]:
    validate_requests(requests)
    previous_departure = 0.0
    records = []
    for request in requests:
        start = max(request.arrival, previous_departure)
        departure = start + request.service
        records.append({
            **asdict(request),
            "start": start,
            "departure": departure,
            "wait": start - request.arrival,
            "residence": departure - request.arrival,
        })
        previous_departure = departure
    return records


def clipped_duration(start: float, end: float, left: float, right: float) -> float:
    return max(0.0, min(end, right) - max(start, left))


def occupancy_sweep(intervals: list[tuple[float, float]], left: float, right: float) -> dict:
    """Integrate counts from event deltas; do not use the residence-time sum."""
    if not (math.isfinite(left) and math.isfinite(right) and 0 <= left < right):
        raise ValueError("Measurement window must satisfy 0 <= left < right.")
    events = {left: 0, right: 0}
    initial = 0
    for start, end in intervals:
        if end <= start or end <= left or start >= right:
            continue
        if start < left < end:
            initial += 1
        if left <= start < right:
            events[start] = events.get(start, 0) + 1
        if left <= end <= right and start < end:
            events[end] = events.get(end, 0) - 1
    count, previous, area = initial, left, 0.0
    segments = []
    for time in sorted(events):
        if time > previous:
            duration = time - previous
            area += count * duration
            segments.append({"start": previous, "end": time, "count": count})
        count += events[time]
        previous = time
    if any(segment["count"] < 0 for segment in segments):
        raise AssertionError("Occupancy became negative.")
    return {"area": area, "mean_population": area / (right - left), "segments": segments}


def measure(records: list[dict], left: float, right: float) -> dict:
    system_intervals = [(row["arrival"], row["departure"]) for row in records]
    queue_intervals = [(row["arrival"], row["start"]) for row in records]
    service_intervals = [(row["start"], row["departure"]) for row in records]
    system = occupancy_sweep(system_intervals, left, right)
    queue = occupancy_sweep(queue_intervals, left, right)
    busy = occupancy_sweep(service_intervals, left, right)
    independent_system_area = sum(clipped_duration(a, d, left, right) for a, d in system_intervals)
    independent_queue_area = sum(clipped_duration(a, b, left, right) for a, b in queue_intervals)
    if not math.isclose(system["area"], independent_system_area, abs_tol=1e-9):
        raise AssertionError("Independent clipped residence and event area disagree.")
    if not math.isclose(queue["area"], independent_queue_area, abs_tol=1e-9):
        raise AssertionError("Independent clipped wait and event area disagree.")
    completed = [row for row in records if left < row["departure"] <= right]
    unfinished = [row["id"] for row in records if row["arrival"] < right < row["departure"]]
    mean_completed = sum(row["residence"] for row in completed) / len(completed) if completed else None
    return {
        "left": left, "right": right, "system": system, "queue": queue,
        "busy_server_seconds": busy["area"],
        "busy_fraction": busy["area"] / (right - left),
        "independent_clipped_system_area": independent_system_area,
        "independent_clipped_queue_area": independent_queue_area,
        "completions_in_window": len(completed),
        "completion_rate": len(completed) / (right - left),
        "completed_cohort_mean_residence": mean_completed,
        "unfinished_at_right": unfinished,
        "boundary_note": "Completion cohort mean need not match clipped time-population accounting.",
    }


def token_clocks(arrival: float, scheduled: float, outputs: list[float]) -> dict:
    values = [arrival, scheduled, *outputs]
    if not all(math.isfinite(value) for value in values):
        raise ValueError("Clock readings must be finite.")
    if arrival < 0 or scheduled < arrival or any(a > b for a, b in zip(values, values[1:])):
        raise ValueError("Clock readings must be nonnegative and chronological.")
    gaps = [b - a for a, b in zip(outputs, outputs[1:])]
    return {
        "queue_wait": scheduled - arrival,
        "ttft": outputs[0] - arrival if outputs else None,
        "inter_token_gaps": gaps,
        "request_average_tpot": sum(gaps) / len(gaps) if gaps else None,
        "e2e_to_last_output": outputs[-1] - arrival if outputs else None,
    }


def load_csv(path: Path) -> list[Request]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return [Request(row["id"], float(row["arrival"]), float(row["service"]))
                for row in csv.DictReader(handle)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--left", type=float, default=0.0)
    parser.add_argument("--right", type=float, default=7.0)
    args = parser.parse_args()
    records = fcfs(load_csv(args.csv) if args.csv else DEFAULT_REQUESTS)
    report = {"units": "seconds and requests", "records": records,
              "measurement": measure(records, args.left, args.right),
              "stream_example": token_clocks(0, 1, [3, 3.4, 4])}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
