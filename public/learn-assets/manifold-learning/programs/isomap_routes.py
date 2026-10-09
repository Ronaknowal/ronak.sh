"""Radius/k-neighbor graph, shortest paths and finite classical embedding.

Run: python isomap_routes.py (NumPy, SciPy). Small dense graph storage O(n²).
"""
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import shortest_path, connected_components
from classical_geometry import classical_mds


def graph(x, *, radius=None, k=None, mutual=False):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or len(x) < 2 or not np.isfinite(x).all():
        raise ValueError("Use at least two finite rows")
    if (radius is None) == (k is None):
        raise ValueError("Choose radius or k")
    if radius is not None and (not np.isfinite(radius) or radius < 0):
        raise ValueError("Radius must be finite and nonnegative")
    if k is not None and not 1 <= k < len(x):
        raise ValueError("k excludes self and must lie in 1..n-1")
    n = len(x)
    weights = np.full((n, n), np.inf)
    for i in range(n):
        d = np.linalg.norm(x - x[i], axis=1)
        d[i] = np.inf
        chosen = np.flatnonzero(d <= radius) if radius is not None else np.lexsort((np.arange(n), d))[:k]
        weights[i, chosen] = d[chosen]
    weights = np.maximum(weights, weights.T) if mutual else np.minimum(weights, weights.T)
    np.fill_diagonal(weights, 0)
    return weights


def floyd_warshall(weights):
    result = np.array(weights, dtype=float, copy=True)
    for via in range(len(result)):
        result = np.minimum(result, result[:, via, None] + result[None, via, :])
    return result


def finite_embedding(weights, q=1):
    routed = floyd_warshall(weights)
    if not np.isfinite(routed).all():
        raise ValueError("Disconnected graph: choose a component or change graph semantics")
    return classical_mds(routed, q)[0], routed


def ordinary_paths(weights):
    # Explicit stored zeros preserve duplicate-point edges in SciPy sparse input.
    row, col = np.where(np.isfinite(weights) & ~np.eye(len(weights), dtype=bool))
    sparse = csr_matrix((weights[row, col], (row, col)), shape=weights.shape)
    return shortest_path(sparse, directed=False, method="D"), connected_components(sparse, directed=False)


def ordinary_isomap(x, neighbors=2):
    from sklearn.manifold import Isomap
    return Isomap(n_neighbors=neighbors, n_components=1, eigen_solver="dense",
                  path_method="D", neighbors_algorithm="brute", n_jobs=1).fit_transform(x)


if __name__ == "__main__":
    u = np.array([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]], float)
    for radius in (0.75, 1, 1.5, 2):
        weights = graph(u, radius=radius)
        routed = floyd_warshall(weights)
        print("radius,A-to-G", radius, float(routed[0, -1]))
    y, d = finite_embedding(graph(u, radius=1))
    print("route matrix", d.tolist())
    print("map distances from A", np.abs(y[:, 0] - y[0, 0]).tolist())
