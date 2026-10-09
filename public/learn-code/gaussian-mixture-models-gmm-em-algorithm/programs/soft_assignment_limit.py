"""Fixed-variance distance softmax and an explicit hard one-step update."""
import numpy as np
from gaussian_mixture import logsumexp_rows


def distance_shares(rows, centers, variance, weights=None):
    rows = np.asarray(rows, dtype=float)
    centers = np.asarray(centers, dtype=float)
    if rows.ndim != 2 or centers.ndim != 2 or rows.shape[1] != centers.shape[1] or not np.isfinite(rows).all() or not np.isfinite(centers).all():
        raise ValueError("finite same-width row and center arrays required")
    if not np.isfinite(variance) or variance <= 0:
        raise ValueError("positive finite shared variance required")
    weights = np.ones(len(centers)) / len(centers) if weights is None else np.asarray(weights, dtype=float)
    if weights.shape != (len(centers),) or np.any(weights <= 0) or not np.isclose(weights.sum(), 1):
        raise ValueError("positive unit-sum weights required")
    logs = np.empty((len(rows), len(centers)))
    for k, center in enumerate(centers):
        logs[:, k] = np.log(weights[k]) - np.sum((rows - center) ** 2, axis=1) / (2 * variance)
    return np.exp(logs - logsumexp_rows(logs)[:, None])


def hard_update(rows, centers):
    rows = np.asarray(rows, dtype=float)
    centers = np.asarray(centers, dtype=float)
    distances = np.column_stack([np.sum((rows - center) ** 2, axis=1) for center in centers])
    labels = np.argmin(distances, axis=1)
    updated = []
    for k in range(len(centers)):
        members = rows[labels == k]
        if len(members) == 0:
            raise ValueError("empty hard component ID " + str(k))
        updated.append(members.mean(axis=0))
    return labels, np.array(updated)


def main():
    for query, variances in [(1, [4, 1, .25]), (.5, [1, .25]), (1.5, [1, .05])]:
        for variance in variances:
            print("finite first share", query, variance, float(distance_shares([[query]], [[0], [3]], variance)[0, 0]))
    print("weighted exact tie", distance_shares([[1.5]], [[0], [3]], .05, [.2, .8]).tolist())
    rows = np.array([-2, -1, 1, 2])[:, None]
    labels, updated = hard_update(rows, [[-1], [1]])
    print("hard labels/new means", labels.tolist(), updated.tolist())
    shares = distance_shares(rows, [[-1], [1]], 1)
    print("soft new means", ((shares.T @ rows) / shares.sum(axis=0)[:, None]).tolist())


if __name__ == "__main__":
    main()
