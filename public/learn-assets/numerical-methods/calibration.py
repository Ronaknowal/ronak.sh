import math


def rate(t):
    return t * math.exp(-t)


def volume(t):
    return -math.expm1(-t) - t * math.exp(-t)


def estimate_volume(t, n):
    h = t / n
    return h * (
        rate(0) / 2
        + sum(rate(i * h) for i in range(1, n))
        + rate(t) / 2
    )


target, candidate = 0.8, 3.0
minimum_slope = 4 * math.exp(-4)
for n in [8, 32, 128]:
    estimate = estimate_volume(candidate, n)
    integral_bound = candidate**3 / (6 * n * n)
    time_bound = (
        abs(estimate - target) + integral_bound
    ) / minimum_slope
    sign = (
        "above"
        if estimate - target > integral_bound
        else (
            "below"
            if estimate - target < -integral_bound
            else "unresolved"
        )
    )
    print(
        n, round(estimate, 7), sign, "time bound:", round(time_bound, 6)
    )

# Independent analytic volume is used only to validate the exercise.
lower, upper = 2.0, 4.0
for _ in range(50):
    mid = lower + (upper - lower) / 2
    if volume(mid) < target:
        lower = mid
    else:
        upper = mid
reference = lower + (upper - lower) / 2
print("reference time:", round(reference, 9))
print("candidate time error:", round(abs(candidate - reference), 9))