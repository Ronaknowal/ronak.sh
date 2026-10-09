import math


def logsumexp(values):
    maximum = max(values)
    if maximum == -math.inf:
        return maximum
    return maximum + math.log(sum(math.exp(v - maximum) for v in values))


def solve(source, costs, weight, initial, maximum_steps=5000, tolerance=1e-9):
    # Natural logs inside; weight and returned objectives use bits.
    log_source = [math.log(p) if p else -math.inf for p in source]
    log_output = [math.log(p) if p else -math.inf for p in initial]
    scaled = [[weight * math.log(2) * cost for cost in row] for row in costs]
    columns = len(initial)
    for step in range(maximum_steps + 1):
        normalizers = [
            logsumexp([log_output[j] - cost for j, cost in enumerate(row)])
            for row in scaled
        ]
        log_channel = [
            [log_output[j] - cost - normalizers[i] for j, cost in enumerate(row)]
            for i, row in enumerate(scaled)
        ]
        channel = [[math.exp(v) for v in row] for row in log_channel]
        log_marginal = [
            logsumexp([log_source[i] + log_channel[i][j] for i in range(len(source))])
            for j in range(columns)
        ]
        distortion = information = 0.0
        for i, p in enumerate(source):
            for j, conditional in enumerate(channel[i]):
                mass = p * conditional
                if mass:
                    distortion += mass * costs[i][j]
                    information += (
                        mass * (log_channel[i][j] - log_marginal[j]) / math.log(2)
                    )
        f = -sum(p * z for p, z in zip(source, normalizers))
        log_g = [
            logsumexp(
                [
                    log_source[i] - scaled[i][j] - normalizers[i]
                    for i in range(len(source))
                ]
            )
            for j in range(columns)
        ]
        lower = (f - max(log_g)) / math.log(2)
        upper = information + weight * distortion
        gap = max(0.0, upper - lower)
        if gap <= tolerance or step == maximum_steps:
            return distortion, information, lower, upper, gap
        log_output = log_marginal


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
