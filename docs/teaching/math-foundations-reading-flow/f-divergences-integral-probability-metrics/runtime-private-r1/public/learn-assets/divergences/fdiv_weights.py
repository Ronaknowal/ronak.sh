import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



p = [0.9, 0.1]
for q in ([0.9, 0.1], [0.99, 0.01], [0.999, 0.001]):
    weights = [a / b for a, b in zip(p, q)]
    mean = math.fsum(b * w for b, w in zip(q, weights))
    variance = math.fsum(b * (w - mean)**2 for b, w in zip(q, weights))
    print("Proposal:", q, "weights:", [round(w, 6) for w in weights])
    print("Mean / variance / chi-squared:", round(mean, 6), round(variance, 6), round(comparisons(p, q)["chi squared"], 6))
    assert math.isclose(variance, comparisons(p, q)["chi squared"], abs_tol=1e-12)
q = [0.5, 0.3, 0.2]
direction = [1, -1, 0]
quadratic = sum(v*v / mass for v, mass in zip(direction, q))
for epsilon in [0.02, 0.01, 0.001]:
    nearby = [mass + epsilon * v for mass, v in zip(q, direction)]
    ratio = kl(nearby, q) / (epsilon**2 * quadratic / 2)
    print("Local KL / half chi-square at epsilon:", epsilon, round(ratio, 6))
