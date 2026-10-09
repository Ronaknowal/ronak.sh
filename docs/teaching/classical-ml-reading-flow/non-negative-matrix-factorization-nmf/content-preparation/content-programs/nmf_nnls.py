"""Fixed-dictionary and alternating NNLS using the maintained convex primitive."""

import numpy as np
from scipy.optimize import nnls

from nmf_arrays import frobenius_metrics, nonnegative_table, positive_integer, require_finite
from nmf_coordinate import encode_coordinates


def encode_nnls(values, dictionary, *, max_iter=1000):
    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    max_iter = positive_integer(max_iter, "max_iter")
    amounts = np.empty((x.shape[0], h.shape[0]))
    norms = np.empty(x.shape[0])
    for i, row in enumerate(x):
        amounts[i], norms[i] = nnls(h.T, row, maxiter=max_iter)
    require_finite(amounts, "NNLS amounts")
    require_finite(norms, "NNLS residual norms")
    return amounts, norms


def alternating_nnls(values, initial_w, initial_h, *, sweeps=10, max_iter=1000):
    x = nonnegative_table(values, require_rows=True)
    w = nonnegative_table(initial_w, require_rows=True)
    h = nonnegative_table(initial_h, x.shape[1], require_rows=True)
    sweeps = positive_integer(sweeps, "sweeps")
    if w.shape != (x.shape[0], h.shape[0]):
        raise ValueError("Initial factors do not match the observations")
    history = [frobenius_metrics(x, w, h).half_square]
    for _ in range(sweeps):
        w, _ = encode_nnls(x, h, max_iter=max_iter)
        transposed_h, _ = encode_nnls(x.T, w.T, max_iter=max_iter)
        h = transposed_h.T
        history.append(frobenius_metrics(x, w, h).half_square)
    return w, h, tuple(history)


def main():
    h, query = np.array([[1, 0], [1, 1]], dtype=float), np.array([[0, 1]], dtype=float)
    unconstrained = np.linalg.lstsq(h.T, query[0], rcond=None)[0]
    clipped = np.maximum(unconstrained, 0)[None, :]
    ordinary, norms = encode_nnls(query, h)
    scratch, status = encode_coordinates(query, h, tol=1e-10)
    print("unconstrained", unconstrained.tolist())
    print("clipped", clipped.tolist(), "half_loss", frobenius_metrics(query, clipped, h).half_square)
    print("nnls", ordinary.tolist(), "residual_norm", norms.tolist())
    print("scratch", scratch.tolist(), "diagnostic", status)
    print("same_prediction", np.allclose(scratch @ h, ordinary @ h))


if __name__ == "__main__":
    main()
