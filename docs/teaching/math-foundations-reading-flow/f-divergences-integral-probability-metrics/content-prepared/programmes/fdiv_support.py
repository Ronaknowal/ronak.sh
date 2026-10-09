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



for p, q in [([0.7, 0.2, 0.1], [0.4, 0.5, 0.1]), ([1, 0], [0, 1])]:
    print("P, Q:", p, q)
    print({name: round(value, 6) for name, value in comparisons(p, q).items()})
left, middle, right = [1, 0], [0.5, 0.5], [0, 1]
direct = comparisons(left, right)["JS"]
leg = comparisons(left, middle)["JS"]
print("JS direct / two legs:", round(direct, 6), round(2 * leg, 6))
print("sqrt(JS) direct / two legs:", round(math.sqrt(direct), 6), round(2 * math.sqrt(leg), 6))
