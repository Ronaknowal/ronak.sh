"""One-server FCFS recurrence and SimPy resource scheduling on identical jobs.

Run: python fcfs-simpy-bridge.py
Dependencies: numpy==2.3.5, simpy==4.1.2.
Finite complete cohort: 0–32 jobs, arrivals 0–1000000s, services 0–10000s.
Times are exact multiples of 1/8 second, calculated as integer ticks internally.
Arrivals are nondecreasing. Returned columns use seconds, including empty (0,3).
Input order breaks equal-arrival ties. O(N) recurrence, O(N) returned trace.
SimPy's event scheduler supports richer resources; it is not faster than the
specialized recurrence and requires event-queue management.
"""
import numpy as np
import simpy


def validate(arrivals, service):
    arrivals, service = np.asarray(arrivals, float), np.asarray(service, float)
    if (arrivals.ndim != 1 or service.shape != arrivals.shape or arrivals.size > 32
            or not np.isfinite(arrivals).all() or not np.isfinite(service).all()
            or np.any(arrivals < 0) or np.any(arrivals > 1_000_000)
            or np.any(np.diff(arrivals) < 0) or np.any(service < 0)
            or np.any(service > 10_000)):
        raise ValueError("Use 0–32 sorted arrivals in [0,1000000] and matching services in [0,10000] seconds")
    arrival_ticks, service_ticks = arrivals * 8, service * 8
    if (not np.array_equal(arrival_ticks, np.rint(arrival_ticks))
            or not np.array_equal(service_ticks, np.rint(service_ticks))):
        raise ValueError("Every time must be an exact multiple of 1/8 second; inputs are not rounded")
    return arrival_ticks.astype(np.int64), service_ticks.astype(np.int64)


def fcfs(arrivals, service):
    arrivals, service = validate(arrivals, service)
    trace = np.empty((len(arrivals), 3), dtype=np.int64)
    previous = 0
    for i, (arrival, duration) in enumerate(zip(arrivals, service)):
        start = max(int(arrival), previous)
        previous = start + int(duration)
        trace[i] = arrival, start, previous
    return trace / 8


def simulate(arrivals, service):
    arrivals, service = validate(arrivals, service)
    environment = simpy.Environment()
    server = simpy.Resource(environment, capacity=1)
    trace = np.empty((len(arrivals), 3), dtype=np.int64)

    def job(index):
        with server.request() as request:
            yield request
            start = environment.now
            yield environment.timeout(int(service[index]))
            trace[index] = arrivals[index], start, environment.now

    def source():
        previous = 0
        for index, arrival in enumerate(arrivals):
            yield environment.timeout(int(arrival) - previous)
            environment.process(job(index))
            previous = int(arrival)

    environment.process(source())
    environment.run()  # Drain the entire cohort, including equal-time endpoint events.
    return trace / 8


def occupancy_area(trace, horizon):
    if not np.isfinite(horizon) or horizon <= 0:
        raise ValueError("A positive finite observation horizon is required")
    return float(np.maximum(0., np.minimum(trace[:, 2], horizon) - np.minimum(trace[:, 0], horizon)).sum())


def main():
    for arrivals, service in [([0, 1, 2, 6], [3, 2, 1, 1]),
                               ([0, 0, 0, 1, 4], [0, 2, 0, 1, 0])]:
        manual, library = fcfs(arrivals, service), simulate(arrivals, service)
        np.testing.assert_array_equal(manual, library)
        print("arrival/start/departure", manual.tolist())
        waits = manual[:, 1] - manual[:, 0]
        totals = manual[:, 2] - manual[:, 0]
        horizon = float(manual[-1, 2])
        area = occupancy_area(manual, horizon)
        np.testing.assert_allclose(area, totals.sum())
        np.testing.assert_allclose(area/horizon, len(manual)/horizon * totals.mean())
        print("mean wait / sojourn / time-average N", np.round([waits.mean(), totals.mean(), area/horizon], 6).tolist())
    trace = fcfs([0, 1, 2, 6], [3, 2, 1, 1])
    print("horizon 4 censored occupancy area", occupancy_area(trace, 4.))
    print("full cohort sojourn sum", float((trace[:, 2]-trace[:, 0]).sum()))


if __name__ == "__main__":
    main()
