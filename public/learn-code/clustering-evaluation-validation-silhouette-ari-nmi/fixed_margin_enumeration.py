from itertools import combinations
import numpy as np
from sklearn.metrics import (adjusted_rand_score,
                             normalized_mutual_info_score,
                             adjusted_mutual_info_score)

reference = np.array([0, 0, 0, 0, 1, 1, 1, 1])
results = []
overlaps = np.zeros(5, dtype=int)
for chosen in combinations(range(8), 4):
    candidate = np.ones(8, dtype=int)
    candidate[list(chosen)] = 0
    overlaps[np.sum(candidate[:4] == 0)] += 1
    results.append([
        adjusted_rand_score(reference, candidate),
        normalized_mutual_info_score(reference, candidate, average_method="arithmetic"),
        adjusted_mutual_info_score(reference, candidate, average_method="arithmetic")
    ])
means = np.mean(results, axis=0)
print("assignments:", len(results))
print("overlap counts:", overlaps.tolist())
print("mean NMI:", round(float(means[1]), 6))
print("adjusted means close to zero:", np.allclose(means[[0, 2]], 0, atol=1e-12))