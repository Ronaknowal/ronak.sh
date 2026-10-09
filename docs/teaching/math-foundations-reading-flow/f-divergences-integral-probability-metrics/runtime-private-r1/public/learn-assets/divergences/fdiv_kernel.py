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



x, y = [-2, -2, 2, 2], [-1, -1, 1, 1]
print("Raw means:", sum(x) / len(x), sum(y) / len(y))
for bandwidth in [0.5, 1, 3]:
    biased, unbiased = mmd_squared(x, y, bandwidth)
    print("Bandwidth:", bandwidth, "biased / unbiased squared:", round(biased, 6), round(unbiased, 6))
def witness(t):
    return sum(math.exp(-0.5 * (a - t)**2) for a in x) / len(x) - sum(math.exp(-0.5 * (b - t)**2) for b in y) / len(y)
gap = sum(witness(t) for t in x) / len(x) - sum(witness(t) for t in y) / len(y)
print("Witness expectation gap:", round(gap, 6))
print("Identical empirical laws:", [round(v, 6) for v in mmd_squared([-1, 1], [-1, 1])])
