import math


def mmd_squared(x, y, bandwidth=1):
    if min(len(x), len(y)) < 2:
        raise ValueError("Both groups need at least two observations.")
    if not math.isfinite(bandwidth) or bandwidth <= 0:
        raise ValueError("Bandwidth must be positive and finite.")
    if any(not math.isfinite(value) for value in list(x) + list(y)):
        raise ValueError("Observations must be finite.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a - b) / bandwidth) ** 2)
    xx = math.fsum(kernel(a, b) for a in x for b in x)
    yy = math.fsum(kernel(a, b) for a in y for b in y)
    xy = math.fsum(kernel(a, b) for a in x for b in y)
    n, m = len(x), len(y)
    biased = xx / n**2 + yy / m**2 - 2 * xy / (n * m)
    # Every diagonal RBF similarity is exactly one. All cross pairs stay.
    unbiased = (xx - n) / (n * (n - 1)) + (yy - m) / (m * (m - 1)) - 2 * xy / (n * m)
    return biased, unbiased



from itertools import combinations


def exact_test(x, y, bandwidths=(1,)):
    if min(len(x), len(y)) < 2 or len(x) + len(y) > 10:
        raise ValueError("Use at least two per group and at most ten total for enumeration.")
    if not bandwidths:
        raise ValueError("Specify the complete bandwidth selection rule.")
    pool, n = list(x) + list(y), len(x)
    statistics = []
    for allocation in combinations(range(len(pool)), n):
        group_x = [pool[i] for i in allocation]
        group_y = [pool[i] for i in range(len(pool)) if i not in allocation]
        statistics.append(max(mmd_squared(group_x, group_y, sigma)[0] for sigma in bandwidths))
    observed = statistics[0]
    tail = sum(value >= observed - 1e-12 for value in statistics)
    return observed, tail, len(statistics), tail / len(statistics)


x, y = [-1, -0.5, 0], [0.5, 1, 1.5]
score, tail, count, p_value = exact_test(x, y, (0.75,))
print("Statistic:", round(score, 6))
print("Tail / allocations / p-value:", tail, count, round(p_value, 6))
print("Reject at level 0.05:", p_value <= 0.05)
assert count == 20 and tail == 2
assert exact_test(y, x, (0.75,))[-1] == p_value
assert exact_test(x, y, (0.75,)) == exact_test(x, y, (0.75,))
print("Swap invariance and deterministic rerun: passed")
