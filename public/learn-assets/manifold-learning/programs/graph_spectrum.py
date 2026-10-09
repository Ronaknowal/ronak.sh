"""Graph energies, three Laplacian conventions and diffusion coordinates.

Run: python graph_spectrum.py (NumPy, SciPy); no embedding estimator fit.
"""
import numpy as np
from scipy.linalg import eigh


def spectrum(adjacency):
    a = np.asarray(adjacency, float)
    if (a.ndim != 2 or a.shape[0] != a.shape[1] or not np.isfinite(a).all()
            or np.any(a < 0) or not np.allclose(a, a.T) or np.any(np.diag(a) != 0)):
        raise ValueError("Need finite symmetric nonnegative loop-free weights")
    degree = a.sum(axis=1)
    if np.any(degree == 0):
        raise ValueError("Separate isolated vertices before normalized division")
    d = np.diag(degree)
    l = d - a
    invroot = np.diag(1 / np.sqrt(degree))
    symmetric = invroot @ l @ invroot
    plain_values, plain_vectors = np.linalg.eigh(l)
    norm_values, norm_vectors = np.linalg.eigh(symmetric)
    generalized_values, generalized_vectors = eigh(l, d)
    return dict(A=a, degree=degree, L=l, plain=(plain_values, plain_vectors),
                symmetric=(norm_values, norm_vectors),
                generalized=(generalized_values, generalized_vectors), P=a / degree[:, None])


def diffusion_coordinates(adjacency, time=1, q=1):
    if not isinstance(time, int) or time < 0:
        raise ValueError("Use a nonnegative integer time")
    result = spectrum(adjacency)
    values, vectors = result["symmetric"]
    walk_values = 1 - values
    # For this teaching route remove all stationary modes; disconnected
    # components need separate interpretation rather than one global map.
    candidates = np.flatnonzero(np.abs(walk_values - 1) > 1e-10)
    selected = candidates[np.argsort(-np.abs(walk_values[candidates]), kind="stable")[:q]]
    right_vectors = vectors[:, selected] / np.sqrt(result["degree"])[:, None]
    return right_vectors * walk_values[selected] ** time, walk_values


def ordinary_spectral(adjacency, q=1):
    from sklearn.manifold import SpectralEmbedding
    return SpectralEmbedding(n_components=q, affinity="precomputed",
                             eigen_solver="arpack", random_state=7).fit_transform(adjacency)


if __name__ == "__main__":
    a = np.array([[0., 1., 0.], [1., 0., 1.], [0., 1., 0.]])
    result = spectrum(a)
    y = np.array([0., 1., 3.])
    start = np.array([1., 0., 0.])
    print("energy", float(y @ result["L"] @ y))
    print("one step", (start @ result["P"]).tolist())
    print("two steps", (start @ result["P"] @ result["P"]).tolist())
    print("plain eigenvalues", result["plain"][0].tolist())
    print("walk eigenvalues", diffusion_coordinates(a)[1].tolist())
