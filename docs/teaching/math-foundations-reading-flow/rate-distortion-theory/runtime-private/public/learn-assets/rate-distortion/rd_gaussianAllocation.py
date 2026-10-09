import math


def allocate(variances, budget):
    if not variances or any(not math.isfinite(v) or v < 0 for v in variances):
        raise ValueError("Variances must be finite and nonnegative.")
    if not math.isfinite(budget) or budget < 0:
        raise ValueError("Budget must be finite and nonnegative.")
    total = math.fsum(variances)
    if not math.isfinite(total):
        raise ValueError("Rescale the variances and budget to a finite total.")
    target = min(budget, total)
    if target == 0:
        errors = [0.0] * len(variances)
    elif target == total:
        errors = list(variances)
    else:
        sorted_variances = sorted(variances)
        exhausted = 0.0
        for index, variance in enumerate(sorted_variances):
            if variance == 0:
                continue
            level = (target - exhausted) / (len(variances) - index)
            if level <= variance:
                break
            exhausted += variance
        errors = [min(v, level) for v in variances]
        if level == 0 or abs(math.fsum(errors) / target - 1) > 1e-12:
            raise ValueError(
                "Rescale variances and budget: positive errors are not representable accurately."
            )
    rates = [
        (
            0.5 * (math.log2(v) - math.log2(d))
            if 0 < d < v
            else (math.inf if d == 0 < v else 0.0)
        )
        for v, d in zip(variances, errors)
    ]
    return errors, rates


for budget in (0.5, 2.0, 3.0, 10.0):
    errors, rates = allocate([9.0, 1.0], budget)
    print(
        "budget",
        budget,
        "errors",
        [round(x, 6) for x in errors],
        "total bits",
        round(sum(rates), 6),
    )