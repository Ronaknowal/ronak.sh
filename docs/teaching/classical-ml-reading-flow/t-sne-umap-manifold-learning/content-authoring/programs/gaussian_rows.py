"""Gaussian conditional rows and symmetric t-SNE P; no embedding fit.

Run: python gaussian_rows.py (NumPy). Distances exclude the row itself.
"""
import numpy as np


def row_at_beta(distances, beta):
    d = np.asarray(distances, dtype=float)
    if d.ndim != 1 or not len(d) or not np.isfinite(d).all() or np.any(d < 0):
        raise ValueError("Use a nonempty finite nonnegative distance row")
    if not np.isfinite(beta) or beta < 0:
        raise ValueError("beta must be finite and nonnegative")
    # Subtract the nearest squared distance before scaling, not after exp.
    with np.errstate(over="raise", invalid="raise"):
        offsets = d * d - np.min(d * d)
        logits = -beta * offsets
    weights = np.exp(logits)
    p = weights / weights.sum()
    positive = p > 0
    entropy_nats = -float(p[positive] @ np.log(p[positive]))
    return p, entropy_nats


def solve_row(distances, perplexity, tolerance=1e-10, max_iter=100):
    d = np.asarray(distances, dtype=float)
    row_at_beta(d, 0)  # Validate even when the answer lies at a boundary.
    minimum_count = int(np.count_nonzero(d == d.min()))
    if not minimum_count <= perplexity <= len(d):
        raise ValueError("Target lies outside the nearest-tie/count interval")
    if perplexity == len(d):
        return np.full(len(d), 1 / len(d)), 0.0, "uniform-limit"
    if perplexity == minimum_count:
        p = (d == d.min()).astype(float) / minimum_count
        return p, np.inf, "nearest-tie-limit"
    target, low, high, beta = np.log(perplexity), 0.0, np.inf, 1.0
    for _ in range(max_iter):
        p, entropy = row_at_beta(d, beta)
        if abs(entropy - target) <= tolerance:
            return p, beta, "converged"
        if entropy > target:
            low = beta
        else:
            high = beta
        beta = 2 * beta if np.isinf(high) else (low + high) / 2
    return p, beta, "iteration-limit"


def conditional_and_joint(x, perplexity):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or len(x) < 2 or not np.isfinite(x).all():
        raise ValueError("Use at least two finite observation rows")
    n = len(x)
    conditional = np.zeros((n, n))
    states = []
    for i in range(n):
        others = np.arange(n) != i
        distances = np.linalg.norm(x[others] - x[i], axis=1)
        p, beta, status = solve_row(distances, perplexity)
        conditional[i, others] = p
        states.append((beta, status))
    return conditional, (conditional + conditional.T) / (2 * n), states


if __name__ == "__main__":
    for sigma in (0.5, 1.0, 2.0):
        p, h = row_at_beta([1, 2, 3], 1 / (2 * sigma * sigma))
        print("sigma,row,perplexity", sigma, p.tolist(), float(np.exp(h)))
    rows, joint, states = conditional_and_joint(np.array([[0.], [1.], [3.], [7.]]), 2)
    print("conditional", rows.tolist())
    print("P", joint.tolist())
    print("states", states)
