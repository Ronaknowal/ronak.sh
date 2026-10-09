from math import exp, isfinite, log1p


def stationary_mm1(arrival, service, probability=0.99):
    if not all(isfinite(x) for x in [arrival, service, probability]):
        raise ValueError("Inputs must be finite")
    if not 0 < arrival < service or not 0 < probability < 1:
        raise ValueError("Need 0 < arrival < service and 0 < probability < 1")
    gap = service - arrival
    rho = arrival / service
    idle = gap / service
    queue_quantile = (
        0.0
        if probability <= idle
        else log1p((probability - idle) / (1 - probability)) / gap
    )
    total_quantile = -log1p(-probability) / gap
    result = {
        "idle": idle,
        "mean_total": 1 / gap,
        "mean_wait": rho / gap,
        "queue_quantile": queue_quantile,
        "total_quantile": total_quantile,
    }
    if not all(isfinite(x) for x in result.values()):
        raise ValueError("Arithmetic range exceeded; rescale the rates")
    return result


result = stationary_mm1(0.9, 1)
for name, value in result.items():
    print(name, round(value, 6))
time = 10
print("P(total > 10):", round(exp(-(1 - 0.9) * time), 6))
print("P(queue > 10):", round(0.9 * exp(-(1 - 0.9) * time), 6))
print("queue median at load 0.2:", stationary_mm1(0.2, 1, 0.5)["queue_quantile"])
try:
    stationary_mm1(1, 1)
except ValueError as error:
    print(error)