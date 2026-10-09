from itertools import combinations
import numpy as np

values = np.array([2.0, 4.0, 8.0, 10.0])
subsets = np.array(list(combinations(range(len(values)), 2)))
probability = np.array([4, 2, 1, 1, 1, 1], dtype=float)
probability /= probability.sum()
# One row per possible sample, one column per population unit.
included = (subsets[:, :, None] == np.arange(len(values))).any(axis=1)
pi = probability @ included
if np.any(pi <= 0):
    raise ValueError("Every target unit needs positive inclusion")
expanded_total = (included * (values / pi)).sum(axis=1)
ht_mean = expanded_total / len(values)
raw_mean = values[subsets].mean(axis=1)
# average normalizes by the selected weights; this is a different estimator.
ratio_mean = np.average(values[subsets], weights=1 / pi[subsets], axis=1)
print("sample-by-unit incidence shape:", included.shape)
print("inclusion:", ", ".join(f"{p:.8f}" for p in pi))
for name, estimates in [("raw", raw_mean), ("fixed-N HT", ht_mean),
                        ("normalized ratio", ratio_mean)]:
    expectation = np.average(estimates, weights=probability)
    variance = np.average((estimates - expectation) ** 2, weights=probability)
    print(f"{name}: expectation={expectation:.8f}, variance={variance:.8f}")
print("finite target:", f"{values.mean():.8f}")
