"""Double-centering and metric SMACOF for small dense dissimilarities.

Run: python classical_geometry.py. NumPy; ordinary route needs sklearn 1.9.1.
The ordinary route is callable, never run implicitly by the scratch example.
"""
import numpy as np


def dissimilarities(d):
    d = np.asarray(d, dtype=float)
    if (d.ndim != 2 or d.shape[0] != d.shape[1] or len(d) < 2
            or not np.isfinite(d).all() or np.any(d < 0)
            or not np.allclose(d, d.T, rtol=0, atol=1e-12)
            or not np.allclose(np.diag(d), 0, rtol=0, atol=1e-12)):
        raise ValueError("Need finite symmetric nonnegative distances, zero diagonal")
    return d


def classical_mds(d, q=2):
    d = dissimilarities(d)
    if not 1 <= q < len(d):
        raise ValueError("q must be between 1 and n-1")
    squared = d * d
    b = -0.5 * (squared - squared.mean(axis=0)[None, :]
                - squared.mean(axis=1)[:, None] + squared.mean())
    values, vectors = np.linalg.eigh(b)
    order = np.argsort(values)[::-1]
    values, vectors = values[order], vectors[:, order]
    cutoff = np.finfo(float).eps * len(d) * max(1.0, np.max(np.abs(values)))
    chosen = np.flatnonzero(values > cutoff)[:q]
    y = vectors[:, chosen] * np.sqrt(values[chosen])
    return y, values, b


def distances(y):
    # Dense output is required here; avoid an n x n x q offset tensor.
    squared = (y * y).sum(axis=1)
    return np.sqrt(np.maximum(squared[:, None] + squared[None, :] - 2 * y @ y.T, 0))


def stress(d, y):
    mapped = distances(y)
    upper = np.triu_indices(len(d), 1)
    raw = float(np.sum((mapped[upper] - d[upper]) ** 2))
    denom = float(np.sum(mapped[upper] ** 2))
    return raw, np.sqrt(raw / denom) if denom > 0 else np.nan


def metric_smacof(d, initial, max_iter=300, tolerance=1e-9):
    d, y = dissimilarities(d), np.asarray(initial, dtype=float).copy()
    if y.ndim != 2 or len(y) != len(d) or not np.isfinite(y).all():
        raise ValueError("Initial coordinates need one finite row per distance row")
    y -= y.mean(axis=0)
    previous, _ = stress(d, y)
    history = [previous]
    for _ in range(max_iter):
        mapped = distances(y)
        # The zero rule keeps this majorization step finite; it is not a
        # promise that a coincident start can separate every positive target.
        ratios = np.divide(d, mapped, out=np.zeros_like(d), where=mapped > 0)
        b = -ratios
        np.fill_diagonal(b, 0)
        np.fill_diagonal(b, -b.sum(axis=1))
        candidate = b @ y / len(d)
        candidate -= candidate.mean(axis=0)
        value, _ = stress(d, candidate)
        history.append(value)
        y = candidate
        if abs(previous - value) <= tolerance * max(1.0, previous):
            return y, np.array(history), "converged"
        previous = value
    return y, np.array(history), "iteration-limit"


def ordinary(d, initial):
    from sklearn.manifold import ClassicalMDS, MDS
    d = dissimilarities(d)
    classical = ClassicalMDS(n_components=1, metric="precomputed").fit_transform(d)
    reducer = MDS(n_components=1, metric_mds=True, metric="precomputed",
                  init="random", n_init=1, random_state=7, max_iter=300,
                  eps=1e-6, normalized_stress=False, n_jobs=1)
    metric = reducer.fit_transform(d, init=np.asarray(initial, dtype=float))
    nonmetric = MDS(n_components=1, metric_mds=False, metric="precomputed",
                   init="random", n_init=1, random_state=7, max_iter=300,
                   eps=1e-6, normalized_stress=True, n_jobs=1)
    return classical, metric, reducer.stress_, nonmetric


if __name__ == "__main__":
    x = np.array([[0.], [2.], [5.]])
    d = distances(x)
    y, eigenvalues, b = classical_mds(d, 1)
    fitted, history, status = metric_smacof(d, [[-1.], [0.], [1.]])
    print("B", b.tolist())
    print("eigenvalues", eigenvalues.tolist())
    print("classical distances", distances(y).tolist())
    print("metric stress,status", stress(d, fitted), status)
