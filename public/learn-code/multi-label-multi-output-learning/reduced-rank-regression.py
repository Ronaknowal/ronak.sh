"""Reduced-rank regression truncates fitted response, not raw target energy.

NumPy QR/SVD/solve supply linear algebra. LinearRegression is the full-rank
ordinary reference; PCA followed by regression is a different complete route.
Output scales/weights are fitted or declared using training rows only.
"""

import numpy as np
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression


def numeric_rows(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    if (
        x.ndim != 2
        or not x.size
        or y.ndim != 2
        or y.shape[0] != len(x)
        or not y.shape[1]
        or not np.isfinite(x).all()
        or not np.isfinite(y).all()
    ):
        raise ValueError("Use aligned nonempty finite feature and output matrices")
    return x, y


def fit_rrr(x, y, rank, output_weights=None, standardize_targets=False):
    x, y = numeric_rows(x, y)
    d, q = x.shape[1], y.shape[1]
    if (
        isinstance(rank, bool)
        or not isinstance(rank, int)
        or not 0 <= rank <= min(d, q)
    ):
        raise ValueError("Choose rank 0..min(d,q) using development information")
    if not isinstance(standardize_targets, bool):
        raise ValueError("Declare whether training target standardization is used")
    weights = (
        np.ones(q)
        if output_weights is None
        else np.asarray(output_weights, dtype=float)
    )
    if weights.shape != (q,) or not np.isfinite(weights).all() or np.any(weights <= 0):
        raise ValueError("Use one positive finite declared objective weight per output")
    mean_x, mean_y = x.mean(axis=0), y.mean(axis=0)
    scale = y.std(axis=0) if standardize_targets else np.ones(q)
    if (
        not np.isfinite(mean_x).all()
        or not np.isfinite(mean_y).all()
        or not np.isfinite(scale).all()
        or np.any(scale <= 0)
    ):
        raise ValueError("Training target scaling needs positive finite scales")
    xc = x - mean_x
    yc = (y - mean_y) / scale * np.sqrt(weights)
    if not np.isfinite(xc).all() or not np.isfinite(yc).all():
        raise ValueError("Centered/transformed rows exceed finite arithmetic")
    numerical_rank = int(np.linalg.matrix_rank(xc))
    if numerical_rank != d:
        raise ValueError(
            "This QR/triangular-solve route requires full centered column rank"
        )
    basis, triangular = np.linalg.qr(xc, mode="reduced")
    # Choose positive R diagonal solely for readable coordinates. QR signs do
    # not change fitted predictions or the reduced-rank objective.
    signs = np.where(np.diag(triangular) < 0, -1.0, 1.0)
    basis *= signs[None, :]
    triangular = signs[:, None] * triangular
    fitted_coordinates = basis.T @ yc
    left, singular, right = np.linalg.svd(fitted_coordinates, full_matrices=False)
    retained = (left[:, :rank] * singular[:rank]) @ right[:rank]
    transformed_weights = np.linalg.solve(triangular, retained)
    coefficients = transformed_weights * scale / np.sqrt(weights)
    intercept = mean_y - mean_x @ coefficients
    if not np.isfinite(coefficients).all() or not np.isfinite(intercept).all():
        raise ValueError("Coefficient reconstruction exceeds finite arithmetic")
    return dict(
        weights=coefficients,
        intercept=intercept,
        feature_width=d,
        output_width=q,
        rank_requested=rank,
        rank_actual=int(np.linalg.matrix_rank(coefficients)),
        mean_x=mean_x,
        mean_y=mean_y,
        target_scale=scale,
        output_weights=weights,
        basis=basis,
        triangular=triangular,
        fitted_coordinates=fitted_coordinates,
        singular=singular,
        retained_coordinates=retained,
        unfit_noise=yc - basis @ fitted_coordinates,
        transformed_weights=transformed_weights,
    )


def predict_rrr(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Use finite queries with the trained feature width")
    result = x @ model["weights"] + model["intercept"]
    if not np.isfinite(result).all():
        raise ValueError("Prediction exceeds finite arithmetic")
    return result


def pca_then_regression(x, y, rank):
    x, y = numeric_rows(x, y)
    if (
        isinstance(rank, bool)
        or not isinstance(rank, int)
        or not 1 <= rank <= min(y.shape)
    ):
        raise ValueError("Choose a supported positive raw-target PCA rank")
    pca = PCA(n_components=rank, svd_solver="full").fit(y)
    regressor = LinearRegression().fit(x, pca.transform(y))
    return dict(pca=pca, regressor=regressor, feature_width=x.shape[1])


def predict_pca_route(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Match finite raw-target PCA route query dimensions")
    return model["pca"].inverse_transform(model["regressor"].predict(x))


def original_unit_errors(y, prediction):
    y, prediction = np.asarray(y, dtype=float), np.asarray(prediction, dtype=float)
    if (
        y.ndim != 2
        or not y.size
        or prediction.shape != y.shape
        or not np.isfinite(y).all()
        or not np.isfinite(prediction).all()
    ):
        raise ValueError("Evaluate finite aligned original-unit output rows")
    error = prediction - y
    return dict(
        sse=np.sum(error**2, axis=0),
        rmse=np.sqrt(np.mean(error**2, axis=0)),
        mae=np.mean(abs(error), axis=0),
    )


def main():
    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[-1, 0], [1, 0], [0, -1], [0, 1]], dtype=float)
    y = np.column_stack(([-2, 2, 0, 0], [10, 10, -11, -9]))
    low = fit_rrr(x, y, 1)
    full = fit_rrr(x, y, 2)
    zero = fit_rrr(x, y, 0)
    np.testing.assert_allclose(low["basis"], x / np.sqrt(2))
    np.testing.assert_allclose(low["triangular"], np.sqrt(2) * np.eye(2))
    np.testing.assert_allclose(
        low["fitted_coordinates"], np.diag([2 * np.sqrt(2), np.sqrt(2)]), atol=1e-14
    )
    np.testing.assert_allclose(low["singular"], [2 * np.sqrt(2), np.sqrt(2)])
    low_prediction = predict_rrr(low, x)
    full_prediction = predict_rrr(full, x)
    pca_model = pca_then_regression(x, y, 1)
    pca_prediction = predict_pca_route(pca_model, x)
    low_sse = float(original_unit_errors(y, low_prediction)["sse"].sum())
    full_sse = float(original_unit_errors(y, full_prediction)["sse"].sum())
    pca_sse = float(original_unit_errors(y, pca_prediction)["sse"].sum())
    np.testing.assert_allclose([low_sse, pca_sse, full_sse], [402, 408, 400])
    ordinary = LinearRegression().fit(x, y)
    np.testing.assert_allclose(full_prediction, ordinary.predict(x), atol=1e-12)
    print("Centered reference X / original targets:", x.tolist(), y.tolist())
    print(
        "Actual Q / R / fitted-response Z:",
        low["basis"].tolist(),
        low["triangular"].tolist(),
        low["fitted_coordinates"].tolist(),
    )
    print(
        "Unfit response noise / fitted-response singular values:",
        low["unfit_noise"].tolist(),
        low["singular"].tolist(),
    )
    print(
        "Rank 1 retained coordinates / reconstructed coefficient matrix / predictions:",
        low["retained_coordinates"].tolist(),
        low["weights"].tolist(),
        low_prediction.tolist(),
    )
    print(
        "Raw-target PCA component / its regression predictions:",
        pca_model["pca"].components_.tolist(),
        pca_prediction.tolist(),
    )
    print(
        "RRR rank1 / raw-target PCA-regression rank1 / RRR rank2 SSE:",
        low_sse,
        pca_sse,
        full_sse,
    )
    print("Rank zero keeps target means:", predict_rrr(zero, x).tolist())
    # An invertible output rotation preserves the unweighted Frobenius objective
    # and rank constraint. A nonorthogonal rescaling changes that objective.
    rotation = np.array([[0, -1], [1, 0]], dtype=float)
    rotated = fit_rrr(x, y @ rotation, 1)
    np.testing.assert_allclose(
        predict_rrr(rotated, x) @ rotation.T, low_prediction, atol=1e-12
    )
    print(
        "Orthogonal output rotation restored predictions:",
        (predict_rrr(rotated, x) @ rotation.T).tolist(),
    )
    weighted = fit_rrr(x, y, 1, output_weights=[1, 10])
    print(
        "Declared output weight 1/10 changes retained direction:",
        weighted["weights"].tolist(),
        predict_rrr(weighted, x).tolist(),
    )
    normalized = fit_rrr(x, y, 1, standardize_targets=True)
    print(
        "Training-only target scales / restored original-unit predictions:",
        normalized["target_scale"].tolist(),
        predict_rrr(normalized, x).tolist(),
    )
    shifted = fit_rrr(x + [3, -2], y + [7, 4], 1)
    np.testing.assert_allclose(
        predict_rrr(shifted, x + [3, -2]), low_prediction + [7, 4], atol=1e-12
    )
    print(
        "Shifted input/output means preserve the same centered mechanism:",
        shifted["intercept"].tolist(),
    )


if __name__ == "__main__":
    main()
