from math import isclose, isfinite


def mixture_metrics(atoms, arrival):
    if not isfinite(arrival) or not 1e-6 <= arrival <= 1e6:
        raise ValueError("Use a finite positive supported rate")
    if not 1 <= len(atoms) <= 32 or any(
        not isfinite(p)
        or not 0 <= p <= 1
        or not isfinite(duration)
        or not (duration == 0 or 1e-6 <= duration <= 1e4)
        for p, duration in atoms
    ):
        raise ValueError("Use bounded nonnegative probabilities and durations")
    if not isclose(sum(p for p, _ in atoms), 1, abs_tol=1e-12):
        raise ValueError("Probabilities must sum to one")
    mean = sum(p * duration for p, duration in atoms)
    second = sum(p * duration**2 for p, duration in atoms)
    rho = arrival * mean
    if mean <= 0 or rho >= 1:
        raise ValueError("Need positive mean service and load below one")
    busy_shares = [p * duration / mean for p, duration in atoms]
    residual_busy = second / (2 * mean)
    residual_time = arrival * second / 2
    wait = residual_time / (1 - rho)
    return mean, second, busy_shares, residual_busy, residual_time, wait


for name, atoms in [
    ("constant", [(1.0, 0.1)]),
    ("two sizes", [(0.5, 0.05), (0.5, 0.15)]),
    ("rare long", [(0.95, 0.05), (0.05, 1.05)]),
]:
    mean, second, shares, residual_busy, residual_time, wait = mixture_metrics(atoms, 8)
    print(name, "mean", round(mean, 6), "second", round(second, 6))
    print("busy-time shares:", [round(x, 6) for x in shares])
    print(
        "residual if busy / at random time:",
        round(residual_busy, 6),
        round(residual_time, 6),
    )
    print("mean wait / total:", round(wait, 6), round(wait + mean, 6))