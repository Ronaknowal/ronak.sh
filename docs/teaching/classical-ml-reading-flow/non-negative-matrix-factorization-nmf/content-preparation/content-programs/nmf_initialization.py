"""Uncentred NNDSVD assembly, explicit zero fills, and positive random starts."""

import numpy as np

from nmf_arrays import (
    frobenius_metrics, nonnegative_scalar, nonnegative_table, positive_integer,
    reconstruction, require_finite, stable_norm,
)


def paired_component(singular_value, left, right):
    """One nonnegative component of a supplied signed outer product.

    Return W column, H row, selected sign, and the two paired norm products.
    An exact floating-point tie chooses positive. Zero terms skip division.
    """
    sigma = nonnegative_scalar(singular_value, "singular_value")
    u, v = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
    if u.ndim != 1 or v.ndim != 1 or not u.size or not v.size:
        raise ValueError("A singular pair needs two nonempty vectors")
    require_finite(u, "Left vector")
    require_finite(v, "Right vector")
    up, un = np.maximum(u, 0), np.maximum(-u, 0)
    vp, vn = np.maximum(v, 0), np.maximum(-v, 0)
    nu, nv = (stable_norm(up), stable_norm(un)), (stable_norm(vp), stable_norm(vn))
    with np.errstate(over="ignore", under="ignore"):
        scores = np.array([nu[0] * nv[0], nu[1] * nv[1]])
    require_finite(scores, "Sign-pair norm products")
    if any(nu[j] > 0 and nv[j] > 0 and scores[j] == 0 for j in (0, 1)):
        raise ValueError("Sign-pair arithmetic underflowed; rescale the vectors")
    choice = 0 if scores[0] >= scores[1] else 1
    if sigma == 0 or scores[choice] == 0:
        return np.zeros_like(u), np.zeros_like(v), "zero", tuple(scores)
    scale = np.sqrt(sigma) * np.sqrt(scores[choice])
    w = scale * ((up if choice == 0 else un) / nu[choice])
    h = scale * ((vp if choice == 0 else vn) / nv[choice])
    require_finite(w, "Component amounts")
    require_finite(h, "Component pattern")
    return w, h, ("positive" if choice == 0 else "negative"), tuple(scores)


def fill_zeros(w, h, value):
    """Copy both factors and replace only their exact zeros by one amount."""
    value = nonnegative_scalar(value, "fill value")
    return np.where(w == 0, value, w), np.where(h == 0, value, h)


def table_mean(x):
    """Mean without overflowing a sum of large finite nonnegative entries."""
    scale = float(np.max(x))
    return 0.0 if scale == 0 else float(scale * np.mean(x / scale))


def initialize_nndsvd(values, n_components, *, variant="plain", seed=0, zero_threshold=0.0):
    """Return fresh W(n,k), H(k,d), using dense economy SVD of UNCENTRED X.

    variant: plain, mean, or small-random (uniform on [0, mean(X)/100)).
    zero_threshold is an explicit absolute factor-entry cutoff, not rank selection.
    """
    x = nonnegative_table(values, require_rows=True)
    k = positive_integer(n_components, "n_components")
    threshold = nonnegative_scalar(zero_threshold, "zero_threshold")
    if k > min(x.shape):
        raise ValueError("NNDSVD needs k <= min(n_rows, n_features)")
    if variant not in ("plain", "mean", "small-random"):
        raise ValueError("Choose plain, mean or small-random")
    u, s, vh = np.linalg.svd(x, full_matrices=False)
    require_finite(s, "Singular values")
    w, h = np.zeros((x.shape[0], k)), np.zeros((k, x.shape[1]))
    w[:, 0], h[0] = np.sqrt(s[0]) * np.abs(u[:, 0]), np.sqrt(s[0]) * np.abs(vh[0])
    for component in range(1, k):
        w[:, component], h[component], _, _ = paired_component(s[component], u[:, component], vh[component])
    w[w < threshold], h[h < threshold] = 0.0, 0.0
    if variant == "mean":
        w, h = fill_zeros(w, h, table_mean(x))
    elif variant == "small-random":
        rng, scale = np.random.default_rng(seed), table_mean(x) / 100
        for factor in (w, h):
            zeros = factor == 0
            factor[zeros] = scale * rng.random(np.count_nonzero(zeros))
    return require_finite(w, "Initial amounts"), require_finite(h, "Initial patterns")


def initialize_positive_random(values, n_components, *, seed=0):
    """A separate overcomplete-capable start; bounded uniform factors are positive.

    Each entry is sqrt(mean(X)/k) * Uniform[0.5,1.5). This is not NNDSVD,
    nor the library's absolute-normal distribution. An all-zero table is refused.
    """
    x = nonnegative_table(values, require_rows=True)
    k = positive_integer(n_components, "n_components")
    mean = table_mean(x)
    if mean == 0:
        raise ValueError("A data-scaled positive random start needs some positive data")
    scale, rng = np.sqrt(mean) / np.sqrt(k), np.random.default_rng(seed)
    w = scale * rng.uniform(0.5, 1.5, size=(x.shape[0], k))
    h = scale * rng.uniform(0.5, 1.5, size=(k, x.shape[1]))
    require_finite(w, "Random amounts")
    require_finite(h, "Random patterns")
    if np.any(w == 0) or np.any(h == 0):
        raise ValueError("Positive random arithmetic underflowed; rescale the data")
    return w, h


def main():
    from sklearn.decomposition import NMF
    from nmf_multiplicative import multiplicative_sweep, update_amounts

    x = np.array([[8.2, 2.4], [2.4, 6.8]])
    w, h = initialize_nndsvd(x, 2)
    print("initial_w", w.tolist())
    print("initial_h", h.tolist())
    print("residual_x_minus_wh", (x - reconstruction(w, h)).tolist())
    for delta in (0.0, 0.1, 2.0):
        start_w, start_h = fill_zeros(w, h, delta)
        new_w, new_h = multiplicative_sweep(x, start_w, start_h)
        print("fill", delta, "initial_half_loss", frobenius_metrics(x, start_w, start_h).half_square,
              "one_sweep_half_loss", frobenius_metrics(x, new_w, new_h).half_square,
              "changed_entries", new_h[1, 0], new_w[0, 1])
    # Same CUSTOM start isolates solver conventions; sklearn uses W-first order.
    ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss="frobenius",
                   max_iter=1, tol=0, alpha_W=0, alpha_H=0, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w.copy(), H=h.copy())
    print("ordinary_custom_one_sweep_half_loss", frobenius_metrics(x, ordinary_w, ordinary.components_).half_square)
    reference_w = update_amounts(x, w, h, "frobenius")
    reference_h = update_amounts(x.T, h.T, reference_w.T, "frobenius").T
    print("same_W_first_factor_max_differences", np.max(np.abs(ordinary_w - reference_w)),
          np.max(np.abs(ordinary.components_ - reference_h)))
    # Usual public initialization route: independently initialized, not a parity test.
    usual = NMF(n_components=2, init="nndsvda", solver="cd", beta_loss="frobenius",
                max_iter=100, tol=1e-7, alpha_W=0, alpha_H=0, random_state=0)
    usual_w = usual.fit_transform(x)
    print("ordinary_nndsvda_iterations", usual.n_iter_, "half_loss", frobenius_metrics(x, usual_w, usual.components_).half_square)
    random_w, random_h = initialize_positive_random(x, 3, seed=19)
    print("overcomplete_shapes", random_w.shape, random_h.shape)


if __name__ == "__main__":
    main()
