import numpy as np
from sklearn.datasets import make_blobs


def check_points(values):
    # Accept a nonempty finite numeric row-by-feature matrix.
    points = np.asarray(values, dtype=float)
    if points.ndim != 2 or 0 in points.shape or not np.isfinite(points).all():
        raise ValueError("Use a nonempty finite numeric row-by-feature matrix.")
    return points


def squared_distances(points, centers):
    # Return the n × k matrix of squared Euclidean distances.
    return ((points[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)


def d2_seed(points, k, seed=0):
    # Vanilla k-means++: a uniform first row, then D²-proportional draws.
    points = check_points(points)
    rng = np.random.default_rng(seed)
    chosen = [int(rng.integers(len(points)))]
    while len(chosen) < k:
        nearest = squared_distances(points, points[chosen]).min(axis=1)
        if nearest.max() == 0:  # every distinct location is already a center
            chosen.append(next(i for i in range(len(points)) if i not in chosen))
        else:
            chosen.append(int(rng.choice(len(points), p=nearest / nearest.sum())))
    return points[chosen].copy(), chosen


def lloyd(points, k=3, seed=0, max_iter=100, initial=None):
    points = check_points(points)
    if type(max_iter) is not int or max_iter < 1:
        raise ValueError("Use a positive integer iteration budget.")
    if type(k) is not int or not 1 <= k <= len(points):
        raise ValueError("Choose an integer k between 1 and the number of rows.")
    if initial is None:
        centers, seed_rows = d2_seed(points, k, seed)
    else:
        centers, seed_rows = check_points(initial).copy(), None
        if centers.shape != (k, points.shape[1]):
            raise ValueError("Initial centers must have shape (k, number of features).")
    history = []
    for iteration in range(1, max_iter + 1):
        distances = squared_distances(points, centers)
        labels_for_means = distances.argmin(axis=1)  # lowest index wins an exact tie
        before = float(distances[np.arange(len(points)), labels_for_means].sum())
        updated = centers.copy()
        for cluster in range(k):
            members = points[labels_for_means == cluster]
            if len(members):  # an empty slot keeps its previous center
                updated[cluster] = members.mean(axis=0)
        updated_distances = squared_distances(points, updated)
        after_means = float(
            updated_distances[np.arange(len(points)), labels_for_means].sum()
        )
        labels = updated_distances.argmin(axis=1)
        inertia = float(updated_distances[np.arange(len(points)), labels].sum())
        converged = bool(np.array_equal(labels, labels_for_means))
        history.append(
            (before, after_means, inertia, int(np.sum(labels != labels_for_means)))
        )
        centers = updated
        if converged:
            break
    return {
        "centers": centers,
        "labels": labels,
        "inertia": inertia,
        "converged": converged,
        "iterations": iteration,
        "history": history,
        "seed_rows": seed_rows,
    }


points, _ = make_blobs(n_samples=150, centers=3, cluster_std=0.8, random_state=42)
result = lloyd(points)
print("data:", points.shape, "seed rows:", result["seed_rows"])
print("SSE before update / after moving means / after reassigning / labels changed")
for before, after, reassigned, changed in result["history"]:
    print(f"{before:.6f} / {after:.6f} / {reassigned:.6f} / {changed}")
print(
    "fixed point:", result["converged"], "after", result["iterations"], "mean update(s)"
)
for cluster in np.argsort(result["centers"][:, 0]):
    print(
        "center:",
        np.round(result["centers"][cluster], 4).tolist(),
        "size:",
        int(np.sum(result["labels"] == cluster)),
    )
print("inertia:", round(result["inertia"], 6))

duplicates = lloyd(np.ones((4, 2)), k=3)
print(
    "four identical rows, k=3: occupied clusters =",
    len(np.unique(duplicates["labels"])),
)
changed = np.array([[0.0], [1.0], [4.0], [5.0], [10.0]])
limited = lloyd(changed, k=2, initial=[[0.0], [1.0]], max_iter=1)
print(
    "budget of one update: fixed point =",
    limited["converged"],
    "returned labels =",
    limited["labels"].tolist(),
)
for initial in [[[0.0], [4.0]], [[0.0], [10.0]]]:
    local = lloyd(changed, k=2, initial=initial)
    print(
        "start",
        np.ravel(initial).tolist(),
        "-> fixed point",
        local["converged"],
        "inertia",
        round(local["inertia"], 6),
    )