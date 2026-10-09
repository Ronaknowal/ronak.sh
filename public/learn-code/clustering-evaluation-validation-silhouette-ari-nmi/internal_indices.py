"""Three Euclidean internal indices, with separately declared scatter conventions."""
import numpy as np
from scipy.spatial.distance import cdist
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score


def internal_indices(features, labels):
    x = np.asarray(features, dtype=float)
    labels = list(labels)
    if x.ndim != 2 or x.shape[1] == 0 or not np.isfinite(x).all() or len(labels) != len(x):
        raise ValueError("Use finite n-by-d features and n labels.")
    names = list(dict.fromkeys(labels))
    n, k = len(x), len(names)
    if not 2 <= k < n:
        raise ValueError("Use 2 to n-1 occupied groups.")
    groups = [x[[i for i, label in enumerate(labels) if label == name]] for name in names]
    centers = np.array([group.mean(axis=0) for group in groups])
    grand_mean = x.mean(axis=0)
    within = sum(float(np.sum((group - center) ** 2)) for group, center in zip(groups, centers))
    between = sum(len(group) * float(np.sum((center - grand_mean) ** 2))
                  for group, center in zip(groups, centers))
    radius = np.array([np.linalg.norm(group - center, axis=1).mean()
                       for group, center in zip(groups, centers)])
    center_distances = cdist(centers, centers)
    diameters = [float(cdist(group, group).max()) for group in groups]
    nearest_cross = min(float(cdist(groups[a], groups[b]).min())
                        for a in range(k) for b in range(a + 1, k))
    ch = (between / (k - 1)) / (within / (n - k)) if within > 0 else None
    if any(center_distances[a, b] == 0 for a in range(k) for b in range(a + 1, k)):
        db = None
    else:
        worst = [max((radius[a] + radius[b]) / center_distances[a, b]
                     for b in range(k) if b != a) for a in range(k)]
        db = float(np.mean(worst))
    largest_diameter = max(diameters)
    dunn = nearest_cross / largest_diameter if largest_diameter > 0 else None
    return {"W": within, "B": between, "mean_radii": radius.tolist(),
            "CH": ch, "DB": db, "Dunn_min_point_max_diameter": dunn}


if __name__ == "__main__":
    x = np.array([0, 1, 2, 7, 8, 9.0])[:, None]
    labels = [0, 0, 0, 1, 1, 1]
    result = internal_indices(x, labels)
    print(result)
    assert np.isclose(result["CH"], calinski_harabasz_score(x, labels))
    assert np.isclose(result["DB"], davies_bouldin_score(x, labels))
    print("ordinary CH/DB correspondence: passed")
