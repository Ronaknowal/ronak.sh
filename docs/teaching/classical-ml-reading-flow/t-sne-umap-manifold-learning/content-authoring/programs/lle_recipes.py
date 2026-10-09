"""Local affine recipes and a small centered LLE eigenproblem.

Run: python lle_recipes.py (NumPy, SciPy). Full eigenproblem is small/dense.
"""
import numpy as np
from scipy.sparse import csr_matrix


def recipe(query, neighbors, reg=1e-3):
    z = np.asarray(neighbors, float) - np.asarray(query, float)
    if z.ndim != 2 or not len(z) or not np.isfinite(z).all() or reg < 0:
        raise ValueError("Use a finite nonempty neighbor matrix and reg >= 0")
    gram = z @ z.T
    trace = float(np.trace(gram))
    if trace == 0:
        return np.full(len(z), 1 / len(z)), 0.0, "duplicate-uniform"
    regularized = gram + reg * trace * np.eye(len(z))
    u = np.linalg.solve(regularized, np.ones(len(z)))
    if abs(u.sum()) < np.finfo(float).eps * np.linalg.norm(u):
        raise ValueError("Cannot normalize this local recipe")
    weights = u / u.sum()
    return weights, float(np.linalg.norm(weights @ z) ** 2), "regularized" if reg else "unregularized"


def affine_line(query, left, right):
    if left == right:
        raise ValueError("Distinct line neighbors required")
    right_weight = (query - left) / (right - left)
    return np.array([1 - right_weight, right_weight])


def lle(x, k, q=1, reg=1e-3):
    x = np.asarray(x, float)
    n = len(x)
    if x.ndim != 2 or not np.isfinite(x).all() or not q < k < n or q < 1:
        raise ValueError("Need finite rows and 1 <= q < k < n")
    columns, values = [], []
    residuals = []
    for i in range(n):
        squared = np.sum((x - x[i]) ** 2, axis=1)
        order = np.lexsort((np.arange(n), squared))
        neighbors = order[order != i][:k]
        weights, residual, _ = recipe(x[i], x[neighbors], reg)
        columns.extend(neighbors)
        values.extend(weights)
        residuals.append(residual)
    w = csr_matrix((values, (np.repeat(np.arange(n), k), columns)), shape=(n, n))
    difference = np.eye(n) - w.toarray()
    m = difference.T @ difference
    # Project out the constant direction before selecting q modes.
    centering = np.eye(n) - np.ones((n, n)) / n
    # QR of a nonredundant centered basis avoids guessing which eigenvector
    # among repeated zeros is the constant vector.
    basis, _ = np.linalg.qr(centering[:, :-1], mode="reduced")
    eigenvalues, eigenvectors = np.linalg.eigh(basis.T @ m @ basis)
    y = np.sqrt(n) * basis @ eigenvectors[:, :q]
    return y, w, eigenvalues, np.array(residuals)


def ordinary(x, k=3, q=1, reg=1e-3):
    from sklearn.manifold import LocallyLinearEmbedding
    return LocallyLinearEmbedding(n_neighbors=k, n_components=q, reg=reg,
                                 method="standard", eigen_solver="dense",
                                 neighbors_algorithm="brute", n_jobs=1).fit_transform(x)


if __name__ == "__main__":
    print("interior", affine_line(1, 0, 3).tolist())
    print("extrapolated", affine_line(4, 0, 3).tolist())
    x = np.array([[0, 0], [1, 0.1], [2, 0.5], [3, 1.2], [4, 2.2]], float)
    y, w, values, residuals = lle(x, 3)
    print("row sums", np.asarray(w.sum(axis=1)).ravel().tolist())
    print("eigenvalues", values.tolist())
    print("centroid,covariance", y.mean(axis=0).tolist(), (y.T @ y / len(y)).tolist())
    print("local residuals", residuals.tolist())
