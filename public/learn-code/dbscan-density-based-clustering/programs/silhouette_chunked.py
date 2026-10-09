"""Exact focal-to-full Euclidean silhouette with bounded distance blocks."""
import numpy as np
from scipy.spatial.distance import cdist
from sklearn.metrics import silhouette_samples


def validate_partition(features, labels):
    x = np.asarray(features, dtype=float)
    labels = list(labels)
    if x.ndim != 2 or x.shape[1] == 0 or not np.isfinite(x).all() or len(x) != len(labels):
        raise ValueError("Use finite n-by-d features and n labels.")
    names = list(dict.fromkeys(labels))
    if not 2 <= len(names) < len(x):
        raise ValueError("Silhouette needs 2 to n-1 occupied groups.")
    codes = {name: i for i, name in enumerate(names)}
    encoded = np.array([codes[name] for name in labels])
    members = [np.flatnonzero(encoded == group) for group in range(len(names))]
    return x, encoded, members


def focal_silhouettes(features, labels, focal_indices, chunk_size=2):
    x, encoded, members = validate_partition(features, labels)
    if not isinstance(chunk_size, int) or isinstance(chunk_size, bool) or chunk_size < 1:
        raise ValueError("chunk_size must be a positive integer.")
    focal = np.asarray(list(focal_indices))
    if focal.size == 0:
        return np.array([], dtype=float)
    if not np.issubdtype(focal.dtype, np.integer) or np.any(focal < 0) or np.any(focal >= len(x)):
        raise ValueError("Use valid integer row indices.")
    result = np.zeros(len(focal))
    for start in range(0, len(focal), chunk_size):
        current = focal[start:start + chunk_size]
        distance = cdist(x[current], x, metric="euclidean")
        group_sums = np.column_stack([distance[:, group].sum(axis=1) for group in members])
        for row, i in enumerate(current):
            own = encoded[i]
            own_size = len(members[own])
            if own_size == 1:
                continue
            a = (group_sums[row, own] - distance[row, i]) / (own_size - 1)
            b = min(group_sums[row, group] / len(members[group])
                    for group in range(len(members)) if group != own)
            result[start + row] = (b - a) / max(a, b) if max(a, b) > 0 else 0.0
        del distance, group_sums
    return result


if __name__ == "__main__":
    x = np.array([0, 1, 2, 7, 8, 9.0])[:, None]
    labels = ["L", "L", "L", "R", "R", "R"]
    actual = focal_silhouettes(x, labels, range(len(x)), chunk_size=2)
    print("scores", np.round(actual, 6).tolist())
    print("mean", round(float(actual.mean()), 6))
    assert np.allclose(actual, silhouette_samples(x, labels))
    print("ordinary full-score correspondence: passed")
