from math import isfinite, sqrt


def truncated_pareto_moments(cap, minimum=1 / 30):
    # P(S > t) = (minimum/t)^(3/2) for t >= minimum.
    # For Y=min(S, cap), integrate P(Y>t) and 2t P(Y>t).
    if (
        not all(isfinite(x) and 1e-6 <= x <= 1e6 for x in [cap, minimum])
        or cap < minimum
    ):
        raise ValueError("Use a finite cap at least as large as the positive minimum")
    mean = 3 * minimum - 2 * minimum**1.5 / sqrt(cap)
    second = 4 * minimum**1.5 * sqrt(cap) - 3 * minimum**2
    return mean, second


arrival = 8
for cap in [1, 10, 100, 1000]:
    mean, second = truncated_pareto_moments(cap)
    rho = arrival * mean
    wait = arrival * second / (2 * (1 - rho))
    print(
        "cap",
        cap,
        "mean",
        round(mean, 6),
        "load",
        round(rho, 6),
        "mean wait",
        round(wait, 6),
    )
