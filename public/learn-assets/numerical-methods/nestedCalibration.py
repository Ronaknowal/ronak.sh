import math


def rate(t):
    return t * math.exp(-t)


def volume(t):
    return -math.expm1(-t) - t * math.exp(-t)


def locate_target(target, time_tolerance=0.01, max_panels=128):
    if not (volume(2) < target < volume(4)):
        raise ValueError(
            "Target must be strictly inside the known bracket"
        )
    if not math.isfinite(time_tolerance) or time_tolerance <= 0:
        raise ValueError("Use a positive finite time tolerance")
    if not isinstance(max_panels, int) or max_panels < 8:
        raise ValueError("Allow at least eight panels")
    lower, upper = 2.0, 4.0
    minimum_slope = 4 * math.exp(-4)
    trace = []
    for _ in range(60):
        candidate = lower + (upper - lower) / 2
        radius = (upper - lower) / 2
        if radius <= time_tolerance:
            return candidate, radius, "bracket time tolerance", trace
        if candidate == lower or candidate == upper:
            return candidate, radius, "arithmetic stagnation", trace
        panels = 8
        while True:
            h = candidate / panels
            estimate = h * (
                rate(0) / 2
                + math.fsum(rate(i * h) for i in range(1, panels))
                + rate(candidate) / 2
            )
            error_bound = candidate**3 / (6 * panels**2)
            residual = estimate - target
            time_bound = (abs(residual) + error_bound) / minimum_slope
            trace.append(
                (lower, upper, candidate, panels, estimate, error_bound)
            )
            if time_bound <= time_tolerance:
                return (
                    candidate,
                    time_bound,
                    "conditional time tolerance",
                    trace,
                )
            if residual > error_bound:
                upper = candidate
                break
            if residual < -error_bound:
                lower = candidate
                break
            if panels == max_panels:
                return (
                    candidate,
                    time_bound,
                    "unresolved integral sign",
                    trace,
                )
            panels = min(2 * panels, max_panels)
    return candidate, radius, "outer step limit", trace


for budget in [8, 128]:
    time, bound, status, trace = locate_target(0.8, max_panels=budget)
    print("max panels:", budget, status)
    print(
        "time:",
        round(time, 6),
        "bound:",
        round(bound, 6),
        "integral calls:",
        len(trace),
    )
    print(
        "first candidate panel counts:",
        [row[3] for row in trace if row[2] == 3.0],
    )