from fractions import Fraction as F
from itertools import combinations


def inspect_design(values, weights):
    values = list(map(F, values))
    subsets = list(combinations(range(len(values)), 2))
    if len(weights) != len(subsets) or any(w < 0 for w in weights) or sum(weights) <= 0:
        raise ValueError("One nonnegative weight per subset and positive total required")
    probabilities = [F(w) / sum(weights) for w in weights]
    inclusion = [sum(p for s, p in zip(subsets, probabilities) if i in s)
                 for i in range(len(values))]
    if any(pi <= 0 for pi in inclusion):
        raise ValueError("Every target unit needs positive inclusion")
    pair = [[sum(p for s, p in zip(subsets, probabilities) if i in s and j in s)
             for j in range(len(values))] for i in range(len(values))]
    coefficient = [[(pair[i][j] - inclusion[i] * inclusion[j])
                    / (inclusion[i] * inclusion[j])
                    for j in range(len(values))] for i in range(len(values))]
    total_variance = sum(coefficient[i][j] * values[i] * values[j]
                         for i in range(len(values)) for j in range(len(values)))
    totals = [sum(values[i] / inclusion[i] for i in s) for s in subsets]
    expected = sum(p * t for p, t in zip(probabilities, totals))
    enumerated = sum(p * (t - expected) ** 2 for p, t in zip(probabilities, totals))
    assert total_variance == enumerated
    zero_pairs = [(i, j) for i, j in combinations(range(len(values)), 2)
                  if pair[i][j] == 0]
    # This contract requires every population pair to have positive joint inclusion.
    # The known-law variance above does not have this additional denominator.
    sample_variances = None
    if not zero_pairs:
        sample_variances = [sum(coefficient[i][j] * values[i] * values[j] / pair[i][j]
                                for i in s for j in s) for s in subsets]
        assert sum(p * v for p, v in zip(probabilities, sample_variances)) == total_variance
    return expected, total_variance, total_variance / len(values) ** 2, zero_pairs, sample_variances


for name, weights in [("unequal", [4, 2, 1, 1, 1, 1]),
                      ("random-start alternating", [0, 1, 0, 0, 1, 0])]:
    expectation, variance, mean_variance, zero_pairs, sample_variances = inspect_design([2, 4, 8, 10], weights)
    print(f"{name}: E(total)={expectation}, Var(total)={variance}, Var(mean)={mean_variance}")
    print("zero joint-inclusion pairs:", len(zero_pairs))
    if sample_variances is not None:
        print("observed-pair variance estimates:", ", ".join(map(str, sample_variances)))
        print("E(observed-pair variance estimate):", variance)
    else:
        print("observed-pair variance formula admitted:", False)
