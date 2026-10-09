import numpy as np
from sklearn.metrics import silhouette_samples


def silhouettes(points, labels):
    points = np.asarray(points, dtype=float)
    labels = np.asarray(labels)
    groups = np.unique(labels)
    if not 2 <= len(groups) < len(points):
        raise ValueError("Use 2 to n-1 nonempty groups.")
    distance = np.linalg.norm(points[:, None] - points[None, :], axis=2)
    result = np.zeros(len(points))
    for i, group in enumerate(labels):
        own = labels == group
        own[i] = False
        if not own.any():
            continue
        a = distance[i, own].mean()
        b = min(distance[i, labels == other].mean()
                for other in groups if other != group)
        result[i] = (b - a) / max(a, b) if max(a, b) > 0 else 0
    return result


x = np.array([0, 1, 2, 7, 8, 9.0])[:, None]
groups = np.array([0, 0, 0, 1, 1, 1])
scores = silhouettes(x, groups)
print("scores:", np.round(scores, 6).tolist())
print("mean:", round(float(scores.mean()), 6))
print("matches library:", np.allclose(scores, silhouette_samples(x, groups)))
print("common scale unchanged:", np.allclose(scores, silhouettes(10*x, groups)))
changed = np.array([0, 0, 1, 1, 1, 1])
print("changed C:", round(float(silhouettes(x, changed)[2]), 6))
print("changed mean:", round(float(silhouettes(x, changed).mean()), 6))