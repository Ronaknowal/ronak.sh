"""Spherical updates and implicit coefficient means with explicit tool bridges."""
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity
from clustering_core import points_array, same_partition


def unit_rows(points):
    points = points_array(points)
    norms = np.linalg.norm(points, axis=1)
    if (norms == 0).any() or not np.isfinite(norms).all():
        raise ValueError("Every direction needs a finite positive norm.")
    return points / norms[:, None]


def spherical_update(points, labels, previous, norm_tolerance=1e-12):
    points = unit_rows(points)
    previous = unit_rows(previous)
    labels = np.asarray(labels)
    if labels.shape != (len(points),) or not np.issubdtype(labels.dtype, np.integer):
        raise ValueError("Supply one integer group ID per direction.")
    if (labels < 0).any() or (labels >= len(previous)).any():
        raise ValueError("Group ID is outside the previous-center range.")
    if not np.isfinite(norm_tolerance) or norm_tolerance < 0:
        raise ValueError("norm_tolerance must be finite and nonnegative.")
    centers = previous.copy()
    for group in range(len(previous)):
        members = points[labels == group]
        if not len(members):
            continue
        mean = members.mean(axis=0)
        norm = np.linalg.norm(mean)
        if norm > norm_tolerance:
            centers[group] = mean / norm
    return centers


def spherical(points, initial, max_updates=100):
    points, centers = unit_rows(points), unit_rows(initial)
    if points.shape[1] != centers.shape[1] or not isinstance(max_updates, int) or max_updates < 0:
        raise ValueError("Supply matching dimensions and a nonnegative update budget.")
    labels = np.argmax(points @ centers.T, axis=1)
    fixed = False
    for _ in range(max_updates):
        centers = spherical_update(points, labels, centers)
        following = np.argmax(points @ centers.T, axis=1)
        fixed = bool(np.array_equal(labels, following))
        labels = following
        if fixed:
            break
    return {"centers": centers, "labels": labels, "fixed_point": fixed}


def checked_gram(gram, tolerance=1e-10):
    gram = np.asarray(gram, dtype=float)
    if gram.ndim != 2 or gram.shape[0] != gram.shape[1] or not len(gram) or not np.isfinite(gram).all():
        raise ValueError("Supply a finite, nonempty square Gram matrix.")
    if not np.isfinite(tolerance) or tolerance < 0:
        raise ValueError("tolerance must be finite and nonnegative.")
    scale = max(1.0, float(np.max(np.abs(gram))))
    margin = tolerance * scale
    if np.max(np.abs(gram - gram.T)) > margin:
        raise ValueError("Gram matrix is not symmetric within the stated tolerance.")
    gram = (gram + gram.T) / 2
    if np.linalg.eigvalsh(gram).min() < -margin:
        raise ValueError("Gram matrix is not positive semidefinite within tolerance.")
    return gram


def kernel_distances(query_rows, query_self, gram, coefficients, tolerance=1e-10):
    query_rows = np.asarray(query_rows, dtype=float)
    query_self = np.asarray(query_self, dtype=float)
    if (query_rows.ndim != 2 or query_rows.shape[1] != len(gram)
            or query_self.shape != (len(query_rows),)
            or not np.isfinite(query_rows).all() or not np.isfinite(query_self).all()):
        raise ValueError("Supply finite query kernel rows and one self-kernel per query.")
    center_self = np.einsum("ki,ij,kj->k", coefficients, gram, coefficients)
    cross = query_rows @ coefficients.T
    distances = query_self[:, None] - 2 * cross + center_self
    scale = np.maximum(1.0, np.abs(query_self[:, None]) + 2 * np.abs(cross) + np.abs(center_self))
    if (distances < -tolerance * scale).any():
        raise ValueError("Materially negative squared feature distance; check the kernel and query ordering.")
    return np.maximum(distances, 0)


def kernel_lloyd(gram, initial_indices, max_updates=100, tolerance=1e-10):
    gram = checked_gram(gram, tolerance)
    initial_indices = np.asarray(initial_indices)
    if (initial_indices.ndim != 1 or not len(initial_indices)
            or not np.issubdtype(initial_indices.dtype, np.integer)
            or (initial_indices < 0).any() or (initial_indices >= len(gram)).any()):
        raise ValueError("Supply valid initial training-row indices.")
    if not isinstance(max_updates, int) or max_updates < 0:
        raise ValueError("max_updates must be nonnegative.")
    coefficients = np.eye(len(gram))[initial_indices]
    distances = kernel_distances(gram, np.diag(gram), gram, coefficients, tolerance)
    labels = np.argmin(distances, axis=1)
    fixed = False
    for _ in range(max_updates):
        following_coefficients = coefficients.copy()
        for group in range(len(coefficients)):
            members = np.flatnonzero(labels == group)
            if len(members):
                following_coefficients[group] = 0
                following_coefficients[group, members] = 1 / len(members)
        coefficients = following_coefficients
        distances = kernel_distances(gram, np.diag(gram), gram, coefficients, tolerance)
        following = np.argmin(distances, axis=1)
        fixed = bool(np.array_equal(labels, following))
        labels = following
        if fixed:
            break
    return {"coefficients": coefficients, "labels": labels, "fixed_point": fixed,
            "inertia": float(distances[np.arange(len(gram)), labels].sum()),
            "tolerance": tolerance}


def polynomial_kernel(left, right):
    products = np.asarray(left, dtype=float).reshape(-1, 1) * np.asarray(right, dtype=float).reshape(1, -1)
    return products + products ** 2


def main():
    members = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 0.0]])
    labels = np.array([0, 0, 1])
    previous = np.array([[1.0, 0.0], [1.0, 0.0]])
    centers = spherical_update(members, labels, previous)
    query = np.array([[12 / 13, 5 / 13]])
    ordinary_means = np.array([[0.5, 0.5], [1.0, 0.0]])
    print("ordinary mean squared distances:", np.sum((ordinary_means - query) ** 2, axis=1).tolist())
    print("scratch cosine scores:", (unit_rows(query) @ centers.T).tolist())
    print("ordinary normalize / cosine scores:", cosine_similarity(normalize(query), normalize(centers)).tolist())
    cancelled = spherical_update([[1.0, 0.0], [-1.0, 0.0]], [0, 0], [[1.0, 0.0]])
    print("cancelled mean retained direction:", cancelled.tolist())
    x = np.array([-2.0, -1.0, 1.0, 2.0])
    mapped = np.column_stack([x, x ** 2])
    gram = polynomial_kernel(x, x)
    implicit = kernel_lloyd(gram, [0, 3])
    ordinary = KMeans(n_clusters=2, init=mapped[[0, 3]], n_init=1, tol=0,
                      algorithm="lloyd", random_state=7).fit(mapped)
    print("kernel coefficients / labels:", implicit["coefficients"].tolist(), implicit["labels"].tolist())
    print("explicit centers / same partition:", ordinary.cluster_centers_.tolist(),
          same_partition(implicit["labels"], ordinary.labels_))
    query_distance = kernel_distances(polynomial_kernel([0], x), [0], gram, implicit["coefficients"])
    print("implicit / explicit zero-query squared distances:", query_distance.tolist(), ordinary.transform([[0, 0]]) ** 2)


if __name__ == "__main__":
    main()
