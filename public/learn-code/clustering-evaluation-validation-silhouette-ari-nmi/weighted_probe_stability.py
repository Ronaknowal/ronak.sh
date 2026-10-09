from itertools import combinations
import numpy as np
from sklearn.metrics import adjusted_rand_score


def exact_line_centers(x, weight, k):
    # x is sorted; this small example has strictly positive weights.
    best = None
    for cuts in combinations(range(1, len(x)), k-1):
        groups = np.split(np.arange(len(x)), cuts)
        centers = tuple(np.average(x[g], weights=weight[g]) for g in groups)
        cost = sum(np.sum(weight[g] * (x[g]-center)**2)
                   for g, center in zip(groups, centers))
        candidate = (float(cost), centers)
        if best is None or candidate < best:
            best = candidate
    return np.array(best[1])


x = np.array([0, 1, 4, 5, 8, 9.0])
weights = [np.array([3, 3, 1, 1, 1, 1]), np.array([1, 1, 1, 1, 3, 3])]
predictions = []
for weight in weights:
    centers = exact_line_centers(x, weight, 2)
    labels = np.abs(x[:, None] - centers).argmin(axis=1)
    predictions.append(labels)
    print("centers:", centers.tolist(), "probe labels:", labels.tolist())
print("probe ARI:", round(adjusted_rand_score(*predictions), 6))
print("one-group ARI:", adjusted_rand_score(np.zeros(6), np.zeros(6)))