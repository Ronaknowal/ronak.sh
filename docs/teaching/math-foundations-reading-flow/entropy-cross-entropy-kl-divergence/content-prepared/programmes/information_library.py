import math

import numpy as np
from scipy.stats import entropy


def probability_vector(values):
    values = np.asarray(values, dtype=np.float64)
    if (values.ndim != 1 or len(values) == 0
            or not np.isfinite(values).all() or (values < 0).any()
            or not math.isclose(float(values.sum()), 1.0, abs_tol=1e-12, rel_tol=0)):
        raise ValueError("Expected a finite, normalized probability vector.")
    return values


def direct_costs(p, q):
    p, q = probability_vector(p), probability_vector(q)
    if p.shape != q.shape:
        raise ValueError("Both distributions must use the same outcomes.")
    active = p > 0
    h = -math.fsum(float(a) * math.log2(float(a)) for a in p[active])
    if (q[active] == 0).any():
        return h, math.inf, math.inf
    ce = -math.fsum(float(a) * math.log2(float(b))
                   for a, b in zip(p[active], q[active]))
    kl = math.fsum(float(a) * (math.log2(float(a)) - math.log2(float(b)))
                   for a, b in zip(p[active], q[active]))
    return h, ce, kl


def main():
    p = probability_vector([0.5, 0.25, 0.125, 0.125])
    q = probability_vector([0.125, 0.125, 0.25, 0.5])
    manual = direct_costs(p, q)
    h, kl = entropy(p, base=2), entropy(p, q, base=2)
    library = (h, h + kl, kl)
    assert np.allclose(manual, library, atol=1e-12, rtol=0)
    print("manual H CE KL bits", [round(float(x), 9) for x in manual])
    print("SciPy H CE KL bits", [round(float(x), 9) for x in library])

    conditional = np.array([[0.9, 0.1], [0.5, 0.5]])
    for row in conditional:
        probability_vector(row)
    row_costs = entropy(conditional, base=2, axis=1)
    print("truthful conditional row costs", [round(float(x), 9) for x in row_costs])
    for context in ([0.75, 0.25], [0.5, 0.5], [1.0, 0.0]):
        context = probability_vector(context)
        joint = context[:, None] * conditional
        direct = -math.fsum(float(joint[i, j]) * math.log2(conditional[i, j])
                            for i in range(2) for j in range(2)
                            if joint[i, j] > 0)
        weighted = float(context @ row_costs)
        assert math.isclose(direct, weighted, abs_tol=1e-12)
        print("context / weighted / uniform", context.tolist(),
              round(weighted, 9), round(float(row_costs.mean()), 9))

    support = direct_costs([0.5, 0.5, 0], [1, 0, 0])
    assert math.isinf(entropy([0.5, 0.5, 0], [1, 0, 0], base=2))
    print("missing-support H CE KL", support)
    print("SciPy entropy of weights [2, 1] bits",
          round(float(entropy([2, 1], base=2)), 9))
    try:
        probability_vector([2, 1])
    except ValueError:
        rejected = True
    else:
        rejected = False
    assert rejected
    print("strict probability input rejected", rejected)


if __name__ == "__main__":
    main()
