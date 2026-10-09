"""Weighted Lloyd with bounded temporary storage and an explicit return contract."""
import numpy as np
from sklearn.cluster import KMeans
from clustering_core import (
    assign_chunked,
    points_array,
    squared_to_center,
    weighted_centers,
    weighted_d2,
    weighted_objective,
    weights_array,
)


def lloyd(points, k=2, weights=None, initial=None, seed=7,
          max_updates=100, tolerance=0.0, block_size=256):
    """Fit means, retaining empty positive-mass groups' previous centers.

    A fixed point requires unchanged nearest labels after a mean update. A finite
    budget/tolerance can return another state; labels are still nearest to the
    returned centers, though those centers need not be their labels' means.
    """
    points = points_array(points)
    weights = weights_array(weights, len(points))
    if not isinstance(k, (int, np.integer)) or not 1 <= k <= len(points):
        raise ValueError("k must be between one and the row count.")
    if not isinstance(max_updates, (int, np.integer)) or max_updates < 0:
        raise ValueError("max_updates must be a nonnegative integer.")
    if not np.isfinite(tolerance) or tolerance < 0:
        raise ValueError("tolerance must be a finite nonnegative center movement.")
    if initial is None:
        centers, seed_rows = weighted_d2(points, weights, k, seed)
    else:
        centers = points_array(initial).copy()
        if centers.shape != (k, points.shape[1]):
            raise ValueError("initial must have k rows and the input feature dimension.")
        seed_rows = None
    labels, lengths = assign_chunked(points, centers, block_size)
    trace = []
    fixed_point = False
    reason = "budget"
    for update in range(1, max_updates + 1):
        before = weighted_objective(weights, lengths)
        moved, masses = weighted_centers(points, labels, weights, centers, block_size)
        fixed_label_lengths = np.empty(len(points))
        for start in range(0, len(points), block_size):
            stop = min(start + block_size, len(points))
            for group in np.unique(labels[start:stop]):
                members = labels[start:stop] == group
                fixed_label_lengths[start:stop][members] = squared_to_center(
                    points[start:stop][members], moved[group]
                )
        after_means = weighted_objective(weights, fixed_label_lengths)
        next_labels, next_lengths = assign_chunked(points, moved, block_size)
        displacement = float(np.sqrt(np.sum((moved - centers) ** 2, axis=1)).max())
        fixed_point = bool(np.array_equal(labels, next_labels))
        trace.append({"update": update, "before": before, "after_means": after_means,
                      "after_assignment": weighted_objective(weights, next_lengths),
                      "labels_changed": int(np.count_nonzero(labels != next_labels))})
        centers, labels, lengths = moved, next_labels, next_lengths
        if fixed_point:
            reason = "fixed_point"
            break
        if displacement <= tolerance:
            reason = "tolerance"
            break
    return {"centers": centers, "labels": labels, "distances": lengths,
            "inertia": weighted_objective(weights, lengths), "fixed_point": fixed_point,
            "updates": len(trace), "stop_reason": reason, "trace": trace,
            "seed_rows": seed_rows}


def main():
    points = np.array([[0.0], [1.0], [3.0], [8.0], [9.0]])
    weights = np.array([1.0, 2.0, 1.0, 1.0, 3.0])
    initial = np.array([[0.0], [9.0]])
    fitted = lloyd(points, weights=weights, initial=initial, block_size=2)
    ordinary = KMeans(n_clusters=2, init=initial, n_init=1, tol=0,
                      algorithm="lloyd", random_state=7).fit(points, sample_weight=weights)
    print("trace:", fitted["trace"])
    print("scratch centers:", fitted["centers"].ravel().tolist())
    print("ordinary centers:", ordinary.cluster_centers_.ravel().tolist())
    print("scratch labels:", fitted["labels"].tolist())
    print("inertia / fixed point / updates / stop:", fitted["inertia"],
          fitted["fixed_point"], fitted["updates"], fitted["stop_reason"])
    repeated = np.repeat(points, weights.astype(int), axis=0)
    print("weighted / repeated fixed-center objective:", fitted["inertia"],
          lloyd(repeated, initial=initial, block_size=1)["inertia"])
    duplicates = lloyd(np.ones((4, 1)), k=3)
    print("duplicate seed rows / occupied groups:", duplicates["seed_rows"],
          len(np.unique(duplicates["labels"])))
    limited = lloyd([[0.0], [2.0], [3.0], [9.0]], initial=[[0.0], [3.0]], max_updates=1)
    print("one-update labels / fixed point / stop:", limited["labels"].tolist(),
          limited["fixed_point"], limited["stop_reason"])


if __name__ == "__main__":
    main()
