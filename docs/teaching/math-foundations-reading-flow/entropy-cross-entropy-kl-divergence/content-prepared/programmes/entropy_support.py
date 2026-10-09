import math


def information(p, q, base=2):
    if len(p) != len(q) or not p:
        raise ValueError("Use the same nonempty labeled alphabet.")
    if not math.isfinite(base) or base <= 1:
        raise ValueError("Log base must be finite and greater than one.")
    for distribution in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in distribution):
            raise ValueError("Probabilities must be finite and nonnegative.")
        if not math.isclose(sum(distribution), 1, rel_tol=0, abs_tol=1e-12):
            raise ValueError("Each distribution must sum to one.")
    entropy = cross_entropy = kl = 0.0
    for mass, model in zip(p, q):
        if mass == 0:
            continue
        entropy -= mass * math.log(mass, base)
        if model == 0:
            cross_entropy = kl = math.inf
        else:
            cross_entropy -= mass * math.log(model, base)
            kl += mass * (math.log(mass, base) - math.log(model, base))
    return entropy, cross_entropy, kl


for p, q in [
    ([0.5, 0.25, 0.125, 0.125], [0.125, 0.125, 0.25, 0.5]),
    ([1, 0], [0.5, 0.5]),
    ([0.5, 0.5], [1, 0]),
    ([1, 0], [1, 0]),
]:
    print(tuple(round(value, 6) for value in information(p, q)))