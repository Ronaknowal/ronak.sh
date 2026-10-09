from math import isfinite


def repeated_vacation_wait(
    arrival, service_mean, service_second, vacation_mean, vacation_second
):
    if not all(
        isfinite(x)
        for x in [arrival, service_mean, service_second, vacation_mean, vacation_second]
    ):
        raise ValueError("All inputs must be finite")
    if arrival <= 0 or service_mean <= 0 or vacation_mean <= 0:
        raise ValueError("Rates and means must be positive")
    if service_second < service_mean**2 or vacation_second < vacation_mean**2:
        raise ValueError("A second moment cannot be smaller than the squared mean")
    rho = arrival * service_mean
    if rho >= 1:
        raise ValueError("The service load must be below one")
    congestion = arrival * service_second / (2 * (1 - rho))
    vacation_residual = vacation_second / (2 * vacation_mean)
    if not all(
        isfinite(x)
        for x in [congestion, vacation_residual, congestion + vacation_residual]
    ):
        raise ValueError("Arithmetic range exceeded; rescale the inputs")
    return congestion, vacation_residual, congestion + vacation_residual


for arrival in [8, 1, 0.01]:
    terms = repeated_vacation_wait(arrival, 0.1, 0.1**2, 0.4, 0.4**2)
    print(
        "arrival",
        arrival,
        "congestion / vacation / total wait:",
        tuple(round(x, 6) for x in terms),
    )