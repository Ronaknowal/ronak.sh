"""Thin local SVD, patch overlap and a second-order curvature stencil.

Run: python local_tangent_patch.py (NumPy). Ordinary variants are source-only.
"""
import numpy as np


def patch(points, q):
    points = np.asarray(points, float)
    if points.ndim != 2 or not np.isfinite(points).all() or not 1 <= q < min(points.shape):
        raise ValueError("Need a finite patch with 1 <= q < min(rows, columns)")
    center = points.mean(axis=0)
    centered = points - center
    _, singular, right = np.linalg.svd(centered, full_matrices=False)
    threshold = np.finfo(float).eps * max(centered.shape) * singular[0]
    if singular[q - 1] <= threshold:
        raise ValueError("Patch has fewer than q resolved tangent directions")
    axes = right[:q].T
    coordinates = centered @ axes
    reconstruction = coordinates @ axes.T + center
    return dict(center=center, axes=axes, singular=singular,
                coordinates=coordinates, residuals=np.linalg.norm(points - reconstruction, axis=1))


def overlap(first_coordinates, second_coordinates, first_ids, second_ids):
    shared = sorted(set(first_ids) & set(second_ids))
    if not shared:
        raise ValueError("Patches need shared source IDs")
    first = np.array([first_coordinates[list(first_ids).index(i)] for i in shared])
    second = np.array([second_coordinates[list(second_ids).index(i)] for i in shared])
    first -= first.mean(axis=0)
    second -= second.mean(axis=0)
    u, singular, vt = np.linalg.svd(first.T @ second, full_matrices=False)
    rotation = u @ vt
    return shared, rotation, np.linalg.norm(first @ rotation - second), singular


def second_difference(values, spacing):
    if spacing <= 0:
        raise ValueError("Spacing must be positive")
    left, center, right = np.asarray(values, float)
    return (left - 2 * center + right) / spacing ** 2


def ordinary_variant(points, method="ltsa", q=2, neighbors=8):
    from sklearn.manifold import LocallyLinearEmbedding
    if method not in {"ltsa", "hessian", "modified"}:
        raise ValueError("Choose a taught local variant")
    minimum = q * (q + 3) / 2 if method == "hessian" else q
    if not minimum < neighbors < len(points):
        raise ValueError("Neighborhood is too small for the requested local basis")
    return LocallyLinearEmbedding(n_neighbors=neighbors, n_components=q,
                                 method=method, eigen_solver="dense",
                                 random_state=7, n_jobs=1).fit_transform(points)


if __name__ == "__main__":
    # Coordinates span two axes; height is a declared curved surface.
    uv = np.array([[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]], float)
    points = np.column_stack((uv, 0.1 * np.sum(uv * uv, axis=1)))
    result = patch(points, 2)
    print("center", result["center"].tolist())
    print("singular", result["singular"].tolist())
    print("residuals", result["residuals"].tolist())
    print("quadratic second derivative", second_difference([0.1, 0, 0.1], 1))
