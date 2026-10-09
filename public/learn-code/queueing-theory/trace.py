from math import isfinite


def trace_jobs(jobs):
    if len(jobs) > 32:
        raise ValueError("Use at most 32 jobs")
    available = 0
    previous_arrival = 0
    seen = set()
    trace = []
    for name, arrival, service in jobs:
        if not isinstance(name, str) or not name.strip() or name in seen:
            raise ValueError("Each job needs a distinct nonempty text ID")
        if not isfinite(arrival) or not previous_arrival <= arrival <= 1e6:
            raise ValueError("Use finite nonnegative arrivals in listed order")
        if not isfinite(service) or not 0 <= service <= 1e4:
            raise ValueError("Use finite nonnegative bounded service durations")
        seen.add(name)
        previous_arrival = arrival
        start = max(arrival, available)
        departure = start + service
        if service > 0 and departure == start:
            raise ValueError(
                "Positive service is too small at this time origin; rescale"
            )
        trace.append((name, arrival, start, departure))
        available = departure
    return trace


def window_metrics(trace, horizon):
    if not isfinite(horizon) or not 1e-6 <= horizon <= 1e6:
        raise ValueError("A measurement window needs a finite positive duration")
    area = sum(
        max(0, min(departure, horizon) - arrival) for _, arrival, _, departure in trace
    )
    completed = [
        (arrival, departure)
        for _, arrival, _, departure in trace
        if departure <= horizon
    ]
    complete_sum = sum(departure - arrival for arrival, departure in completed)
    return area, complete_sum, area / horizon


jobs = [("A", 0, 3), ("B", 1, 1), ("C", 2, 2), ("D", 6, 1)]
trace = trace_jobs(jobs)  # Already in arrival order; tied arrivals keep this order.
for name, arrival, start, departure in trace:
    print(
        name,
        "start",
        start,
        "depart",
        departure,
        "wait",
        start - arrival,
        "total",
        departure - arrival,
    )
for horizon in [5, 7]:
    area, complete_sum, mean_number = window_metrics(trace, horizon)
    print(
        "horizon",
        horizon,
        "area",
        area,
        "completed residence",
        complete_sum,
        "mean number",
        round(mean_number, 6),
    )
print("complete-cohort Little product:", round((4 / 7) * (11 / 4), 6))