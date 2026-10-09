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

pool = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]
allocations = list(combinations(range(8), 4))
for bandwidths in [(1,), (0.3, 1, 3)]:
    statistics = []
    for allocation in allocations:
        x = [pool[i] for i in allocation]
        y = [pool[i] for i in range(8) if i not in allocation]
        # The complete rule, including maximization, is repeated for every split.
        statistic = max(mmd_squared(x, y, bandwidth)[0] for bandwidth in bandwidths)
        statistics.append(statistic)
    observed = statistics[0]
    tail = sum(value >= observed - 1e-12 for value in statistics)
    print("Bandwidth candidates:", bandwidths)
    print("Observed statistic:", round(observed, 6))
    print("Tail / allocations:", tail, len(statistics))
    print("Exact permutation p-value:", round(tail / len(statistics), 6))
