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



p, q = [0.7, 0.2, 0.1], [0.4, 0.5, 0.1]
truth = kl(p, q)
for scale, offset in [(0, 0), (1, 0), (1, 0.5), (0.5, -1)]:
    scores = [1 + scale * math.log(a / b) + offset for a, b in zip(p, q)]
    bound = math.fsum(a * t - b * math.exp(t - 1) for a, b, t in zip(p, q, scores))
    print("Scale / offset:", scale, offset, "bound / gap:", round(bound, 6), round(truth - bound, 6))
    assert bound <= truth + 1e-12
discriminator = [a / (a + b) for a, b in zip(p, q)]
objective = math.fsum(a * math.log(d) + b * math.log(1 - d) for a, b, d in zip(p, q, discriminator))
reference = -math.log(4) + 2 * comparisons(p, q)["JS"]
print("Optimal discriminator:", [round(d, 6) for d in discriminator])
print("GAN log objective / -ln4+2JS:", round(objective, 6), round(reference, 6))
assert math.isclose(objective, reference, abs_tol=1e-12)
