"""N11: explicit finite-grid metric and alternative representation objectives."""

import numpy as np

from centered_pca import CenteredPCA


def weighted_grid_pca(curves, weights, k):
    rows = np.asarray(curves, dtype=float)
    w = np.asarray(weights, dtype=float)
    if (
        rows.ndim != 2
        or w.shape != (rows.shape[1],)
        or not np.isfinite(w).all()
        or np.any(w <= 0)
    ):
        raise ValueError("Use one finite positive quadrature weight per grid position")
    root_weights = np.sqrt(w)
    state = CenteredPCA.fit(rows * root_weights, k)
    scores = state.transform(rows * root_weights)
    recovered = state.inverse_transform(scores) / root_weights
    return state, scores, recovered


def main():
    from scipy.sparse import csr_matrix
    from sklearn.decomposition import PCA, TruncatedSVD
    from sklearn.linear_model import LinearRegression
    from sklearn.random_projection import GaussianRandomProjection

    np.set_printoptions(precision=6, suppress=True)
    grid = np.array([0.0, 1.0, 3.0])
    weights = np.array([0.5, 1.5, 1.0])
    curves = np.array([[0, 0, 0], [1, 1, 2], [-1, 2, 1], [2, -1, 0]], dtype=float)
    state, scores, recovered = weighted_grid_pca(curves, weights, 1)
    ordinary = PCA(n_components=1, svd_solver="full").fit(curves * np.sqrt(weights))
    library_recovered = ordinary.inverse_transform(
        ordinary.transform(curves * np.sqrt(weights))
    ) / np.sqrt(weights)
    print("grid_and_weights", grid, weights)
    print("weighted_library_decoder_equal", np.allclose(recovered, library_recovered))
    print("weighted_reconstruction_loss", np.sum(weights * (curves - recovered) ** 2))
    residual = np.array([1.0, 0.0, 1.0])
    print(
        "unweighted_weighted_changed_error",
        np.sum(residual**2),
        np.sum(weights * residual**2),
    )
    paired = np.array([[-2, -1], [-1, -2], [1, 2], [2, 1]], dtype=float)
    pca = CenteredPCA.fit(paired, 1)
    ols = LinearRegression().fit(paired[:, :1], paired[:, 1])
    print(
        "pca_ols_line_slopes", pca.directions[0, 1] / pca.directions[0, 0], ols.coef_[0]
    )
    print(
        "pca_perpendicular_loss",
        np.sum((paired - pca.inverse_transform(pca.transform(paired))) ** 2),
    )
    print("ols_vertical_loss", np.sum((paired[:, 1] - ols.predict(paired[:, :1])) ** 2))
    offset = np.array([[10.0, -1], [10.0, 1]])
    centered = PCA(n_components=1, svd_solver="full").fit(offset)
    uncentered = TruncatedSVD(
        n_components=1, algorithm="randomized", random_state=0
    ).fit(csr_matrix(offset))
    print("centered_uncentered_axes", centered.components_, uncentered.components_)
    print("uncentered_mean_was_not_removed", offset.mean(axis=0))
    random_rows = np.array([[1.0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 1]])
    ordinary_projection = GaussianRandomProjection(n_components=2, random_state=17).fit(
        random_rows
    )
    scratch_weights = np.random.RandomState(17).normal(0, 1 / np.sqrt(2), size=(2, 4))
    transformed = random_rows @ scratch_weights.T
    print(
        "random_projection_same_draw_equal",
        np.allclose(transformed, ordinary_projection.transform(random_rows)),
    )
    print(
        "original_projected_pair_distances",
        np.linalg.norm(random_rows[0] - random_rows[1]),
        np.linalg.norm(transformed[0] - transformed[1]),
    )
    print("selected_original_feature", random_rows[:, 0])


if __name__ == "__main__":
    main()
