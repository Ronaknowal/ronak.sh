"""Complete weighted Lloyd using conservative ordinary-length Elkan bounds."""
import numpy as np
from sklearn.cluster import KMeans
from clustering_core import (
    points_array, weights_array, squared_to_center, weighted_centers,
    weighted_d2, weighted_objective,
)


def length_upper(value):
    return np.nextafter(value, np.inf)


def length_lower(value):
    return np.maximum(0.0, np.nextafter(value, -np.inf))


def separation_half(centers):
    half = np.empty((len(centers), len(centers)))
    for group, center in enumerate(centers):
        half[group] = length_lower(np.sqrt(squared_to_center(centers, center)) / 2)
    np.fill_diagonal(half, np.inf)
    return half


def strictly_safe(upper, lower):
    """Near any bound, measure instead of relying on a floating triangle test."""
    margin = 32 * np.finfo(float).eps * max(1.0, abs(upper), abs(lower))
    return upper + margin < lower


def assigned_squared(points, centers, labels):
    # One row at a time avoids an n-by-d temporary and counts exactly n lengths.
    return np.array([squared_to_center(points[i:i + 1], centers[a])[0]
                     for i, a in enumerate(labels)])


def assign_with_bounds(points, centers, labels, upper, lower, tight):
    half = separation_half(centers)
    evaluations = 0
    for i in range(len(points)):
        assigned = int(labels[i])
        if strictly_safe(upper[i], half[assigned].min()):
            continue
        best_squared = None
        for candidate in range(len(centers)):
            assigned = int(labels[i])
            if candidate == assigned:
                continue
            bound = max(lower[i, candidate], half[assigned, candidate])
            if strictly_safe(upper[i], bound):
                continue
            if not tight[i] or best_squared is None:
                best_squared = squared_to_center(points[i:i + 1], centers[assigned])[0]
                evaluations += 1
                exact = np.sqrt(best_squared)
                upper[i] = length_upper(exact)
                lower[i, assigned] = length_lower(exact)
                tight[i] = True
                if strictly_safe(upper[i], bound):
                    continue
            candidate_squared = squared_to_center(points[i:i + 1], centers[candidate])[0]
            evaluations += 1
            lower[i, candidate] = length_lower(np.sqrt(candidate_squared))
            # Equality must visit a lower-index center; bounds never hide that tie.
            if candidate_squared < best_squared or (
                candidate_squared == best_squared and candidate < labels[i]
            ):
                labels[i] = candidate
                best_squared = candidate_squared
                upper[i] = length_upper(np.sqrt(best_squared))
    return evaluations


def elkan(points, k=2, weights=None, initial=None, seed=7,
          max_updates=100, tolerance=0.0):
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
    exact_squared = np.empty((len(points), k))
    for start in range(0, len(points), 256):
        stop = min(start + 256, len(points))
        for group, center in enumerate(centers):
            exact_squared[start:stop, group] = squared_to_center(points[start:stop], center)
    labels = exact_squared.argmin(axis=1)
    lengths = exact_squared[np.arange(len(points)), labels].copy()
    lower = length_lower(np.sqrt(exact_squared))
    del exact_squared
    upper = length_upper(np.sqrt(lengths))
    tight = np.ones(len(points), dtype=bool)
    evaluations = len(points) * k
    trace = []
    fixed_point = False
    reason = "budget"
    for update in range(1, max_updates + 1):
        previous_labels = labels.copy()
        moved, _ = weighted_centers(points, labels, weights, centers)
        movement = np.sqrt(np.sum((moved - centers) ** 2, axis=1))
        upper = length_upper(upper + movement[labels])
        lower = length_lower(np.maximum(0.0, lower - movement[None, :]))
        tight[:] = False
        centers = moved
        measured = assign_with_bounds(points, centers, labels, upper, lower, tight)
        # Bounds return labels. The objective still needs each assigned length,
        # counted here independently from candidates skipped by triangle tests.
        lengths = assigned_squared(points, centers, labels)
        evaluations += measured + len(points)
        fixed_point = bool(np.array_equal(previous_labels, labels))
        trace.append({"update": update, "inertia": weighted_objective(weights, lengths),
                      "labels_changed": int(np.count_nonzero(previous_labels != labels)),
                      "candidate_or_refresh_evaluations": measured,
                      "objective_evaluations": len(points)})
        if fixed_point:
            reason = "fixed_point"
            break
        if movement.max() <= tolerance:
            reason = "tolerance"
            break
    return {"centers": centers, "labels": labels, "inertia": weighted_objective(weights, lengths),
            "fixed_point": fixed_point, "updates": len(trace), "stop_reason": reason,
            "point_center_evaluations": evaluations, "trace": trace, "seed_rows": seed_rows,
            "upper": upper, "lower": lower}


def main():
    points = np.array([[0.0], [1.0], [3.0], [8.0], [9.0]])
    weights = np.array([1.0, 2.0, 1.0, 1.0, 3.0])
    initial = np.array([[0.0], [9.0]])
    result = elkan(points, weights=weights, initial=initial)
    ordinary = KMeans(n_clusters=2, init=initial, n_init=1, tol=0,
                      algorithm="elkan", random_state=7).fit(points, sample_weight=weights)
    print("centers / labels:", result["centers"].ravel().tolist(), result["labels"].tolist())
    print("scratch / ordinary inertia:", result["inertia"], ordinary.inertia_)
    print("trace:", result["trace"])
    print("point-center evaluations:", result["point_center_evaluations"])
    tie = elkan([[1.0], [1.0]], k=2, initial=[[0.0], [2.0]], max_updates=0)
    print("exact midpoint labels:", tie["labels"].tolist())


if __name__ == "__main__":
    main()
