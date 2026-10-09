"""N5: normalized randomized range finding on a centered table."""

import numpy as np


def randomized_pca(values, k, oversampling=2, powers=1, seed=7):
    x = np.asarray(values, dtype=float)
    if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] < 1 or not np.isfinite(x).all():
        raise ValueError("Use a finite n-by-d table, n>=2 and d>=1")
    n, d = x.shape
    for name, value in (("k", k), ("oversampling", oversampling), ("powers", powers)):
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, np.integer))
            or value < 0
        ):
            raise ValueError(name + " must be a nonnegative integer")
    if k > min(n, d):
        raise ValueError("Kept count exceeds the thin-factor size")
    mean = x.mean(axis=0)
    a = x - mean
    if not np.isfinite(a).all():
        raise ValueError("Centering overflowed")
    if k == 0 or not np.any(a):
        return {
            "mean": mean,
            "directions": np.empty((0, d)),
            "singular_values": np.empty(0),
            "requested_k": k,
            "effective_k": 0,
            "range_rank": 0,
            "relative_residual": 0.0 if not np.any(a) else 1.0,
            "orthogonality_error": 0.0,
            "passes": 0,
        }
    ell = min(k + oversampling, min(n, d))
    omega = np.random.default_rng(seed).standard_normal((d, ell))
    q, _ = np.linalg.qr(a @ omega, mode="reduced")
    for _ in range(powers):
        # Normalize each multiplication, rather than forming (A A.T)**powers.
        qz, _ = np.linalg.qr(a.T @ q, mode="reduced")
        q, _ = np.linalg.qr(a @ qz, mode="reduced")
    b = q.T @ a
    u_small, singular_values, vh = np.linalg.svd(b, full_matrices=False)
    floor = np.finfo(float).eps * max(n, d) * singular_values[0]
    rank = int(np.count_nonzero(singular_values > floor))
    kept = min(k, rank)
    directions = vh[:kept].copy()
    recovered = (a @ directions.T) @ directions
    norm = np.linalg.norm(a)
    return {
        "mean": mean,
        "directions": directions,
        "singular_values": singular_values[:kept],
        "approximate_left_vectors": q @ u_small[:, :kept],
        "requested_k": k,
        "effective_k": kept,
        "range_rank": rank,
        "relative_residual": float(np.linalg.norm(a - recovered) / norm),
        "orthogonality_error": float(
            np.linalg.norm(directions @ directions.T - np.eye(kept))
        ),
        "passes": 2 * powers + 2,
    }


def transform(values, state):
    rows = np.asarray(values, dtype=float)
    if (
        rows.ndim != 2
        or rows.shape[1] != state["mean"].size
        or not np.isfinite(rows).all()
    ):
        raise ValueError("Query rows must retain the fitted feature count")
    return (rows - state["mean"]) @ state["directions"].T


def inverse_transform(scores, state):
    z = np.asarray(scores, dtype=float)
    if z.ndim != 2 or z.shape[1] != state["effective_k"] or not np.isfinite(z).all():
        raise ValueError("Query scores must have the effective kept count")
    return z @ state["directions"] + state["mean"]


def main():
    from sklearn.decomposition import PCA
    from sklearn.utils.extmath import randomized_svd

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1, 0], [2, 0, 1], [4, 4, -1], [5, 3, 0], [3, 2, 2]], dtype=float)
    centered = x - x.mean(axis=0)
    exact = PCA(n_components=1, svd_solver="full").fit(x)
    for powers in (0, 2):
        state = randomized_pca(x, 1, oversampling=2, powers=powers, seed=7)
        _, _, vh = randomized_svd(
            centered,
            n_components=1,
            n_oversamples=2,
            n_iter=powers,
            power_iteration_normalizer="QR",
            random_state=7,
        )
        projector = state["directions"].T @ state["directions"]
        print(
            "powers_passes_effective_k", powers, state["passes"], state["effective_k"]
        )
        print(
            "residual_orthogonality",
            state["relative_residual"],
            state["orthogonality_error"],
        )
        print(
            "full_range_exact_projector_equal",
            np.allclose(projector, exact.components_.T @ exact.components_),
        )
        print("ordinary_randomized_projector_equal", np.allclose(projector, vh.T @ vh))
    limited = randomized_pca(x, 1, oversampling=0, powers=0, seed=7)
    print("limited_range_relative_residual", limited["relative_residual"])
    print(
        "exact_relative_residual",
        np.linalg.norm(
            centered - exact.inverse_transform(exact.transform(x)) + exact.mean_
        )
        / np.linalg.norm(centered),
    )
    collinear = randomized_pca([[0, 0], [1, 1], [2, 2]], 2)
    print(
        "collinear_requested_effective",
        collinear["requested_k"],
        collinear["effective_k"],
    )
    zero = randomized_pca(np.ones((3, 2)), 2)
    print(
        "constant_effective_and_query",
        zero["effective_k"],
        inverse_transform(transform([[2, 4]], zero), zero),
    )
    empty = randomized_pca(x, 0)
    print("k0_score_shape", transform(x, empty).shape)


if __name__ == "__main__":
    main()
