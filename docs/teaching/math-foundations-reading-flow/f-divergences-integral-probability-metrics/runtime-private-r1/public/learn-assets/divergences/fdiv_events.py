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



from itertools import product

p, q = [0.7, 0.2, 0.1, 0], [0.4, 0.5, 0.1, 0]
events = list(product([0, 1], repeat=4))
gap = lambda mask: math.fsum((a - b) * take for a, b, take in zip(p, q, mask))
best = max(events, key=gap)
tv = comparisons(p, q)["TV"]
accuracy = 0.5 * math.fsum(a if a >= b else b for a, b in zip(p, q))
print("Best event mask:", best)
print("Event gap / TV:", round(gap(best), 6), round(tv, 6))
print("Best equal-prior accuracy:", round(accuracy, 6))
for mapping in ([0, 0, 1, 1], [0, 1, 1, 1]):
    pushed_p = [sum(p[i] for i in range(4) if mapping[i] == group) for group in [0, 1]]
    pushed_q = [sum(q[i] for i in range(4) if mapping[i] == group) for group in [0, 1]]
    values = comparisons(pushed_p, pushed_q)
    print("Map:", mapping, "KL / TV:", round(values["KL"], 6), round(values["TV"], 6))
print("Pinsker lower bound / KL:", round(2 * tv**2, 6), round(kl(p, q), 6))
