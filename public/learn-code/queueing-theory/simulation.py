import random
import statistics
from math import isfinite


def simulate_fcfs(arrival_rate, service_rate, seed, warmup=5000, measured=50000):
    if (
        not all(isfinite(x) and 1e-6 <= x <= 1e6 for x in [arrival_rate, service_rate])
        or not arrival_rate < service_rate
        or type(warmup) is not int
        or type(measured) is not int
        or not 0 <= warmup <= 1000000
        or not 2 <= measured <= 1000000
    ):
        raise ValueError("Use stable positive rates and a nonempty measured cohort")
    rng = random.Random(seed)
    previous_total = 0.0
    waits, totals = [], []
    for index in range(warmup + measured):
        gap = rng.expovariate(arrival_rate)
        service = rng.expovariate(service_rate)
        # Lindley's workload recursion avoids subtracting large calendar times.
        wait = max(0.0, previous_total - gap)
        total = wait + service
        previous_total = total
        if index >= warmup:
            waits.append(wait)
            totals.append(total)
    return statistics.mean(waits), statistics.mean(totals)


results = [simulate_fcfs(8, 10, seed) for seed in range(101, 109)]
means = [total for wait, total in results]
print("total-time means by independent run:", [round(x, 6) for x in means])
print("mean across runs:", round(statistics.mean(means), 6))
print(
    "estimated Monte Carlo standard error:",
    round(statistics.stdev(means) / len(means) ** 0.5, 6),
)
print("stationary theoretical total mean:", 0.5)
print("theory minus finite estimate:", round(0.5 - statistics.mean(means), 6))