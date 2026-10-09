import math

p_star = [1 / 7, 2 / 7, 4 / 7]
mean = 10 / 7


def entropy(p):
    return -sum(x * math.log2(x) for x in p if x)


for t in (3 / 7, 4 / 7, 5 / 7):
    q = [1 - mean + t, mean - 2 * t, t]
    # Exact boundaries may accumulate tiny floating subtraction noise.
    q = [0.0 if abs(x) < 1e-14 else x for x in q]
    assert min(q) >= 0 and math.isclose(sum(q), 1)
    assert math.isclose(q[1] + 2 * q[2], mean)
    kl = sum(x * math.log2(x / y) for x, y in zip(q, p_star) if x)
    gap = entropy(p_star) - entropy(q)
    assert math.isclose(kl, gap, abs_tol=1e-12)
    print(f"q={[round(x,6) for x in q]}, H={entropy(q):.6f}, KL gap={kl:.6f}")
base_tilt = [0.25, 0.5, 0.25]
uniform = [1 / 3] * 3
print(f"Nonuniform base at eta=0: H={entropy(base_tilt):.6f}")
print(f"Same mean, uniform: H={entropy(uniform):.6f}")