"""Weighted least squares, using a stable linear-algebra primitive.

The estimator constructs the weighted design and objective explicitly.
numpy.linalg.lstsq supplies the QR/SVD-class least-squares primitive; this
programme does not claim to implement that factorization itself.
"""
import numpy as np
from sklearn.linear_model import LinearRegression


def weighted_least_squares(x, y, importance):
    """Return minimum-norm [intercept, slope] and weighted mean error.

    importance is fixed observation importance, not an optimizer's Hessian.
    A zero-weight row contributes no loss. Rank is returned because coefficients
    need not be uniquely identified, even though least-squares minimizers exist.
    """
    x, y, importance = (np.asarray(value, dtype=np.float64)
                        for value in (x, y, importance))
    if (x.ndim != 1 or x.shape != y.shape or x.shape != importance.shape
            or not all(np.isfinite(value).all() for value in (x, y, importance))
            or np.any(importance < 0) or not np.any(importance > 0)):
        raise ValueError("Use matching finite vectors and nonnegative, nonzero weights.")
    # Common scaling preserves the optimum and prevents the weight total from
    # overflowing merely because all otherwise valid weights are large.
    scaled_importance = importance / importance.max()
    normalized_importance = scaled_importance / scaled_importance.sum()
    design = np.column_stack((np.ones_like(x), x))
    root_weight = np.sqrt(normalized_importance)
    weighted_design = root_weight[:, None] * design
    weighted_target = root_weight * y
    coefficients, _, rank, _ = np.linalg.lstsq(
        weighted_design, weighted_target, rcond=None)
    if not np.isfinite(coefficients).all():
        raise FloatingPointError("The coefficient solution is not representable.")
    with np.errstate(over="raise", invalid="raise"):
        residual = y - design @ coefficients
        weighted_mse = np.dot(normalized_importance, residual ** 2)
    if not np.isfinite(weighted_mse):
        raise FloatingPointError("The residual objective is not representable.")
    return coefficients, weighted_mse, rank


def main():
    x = np.array([0., 1., 2., 3.])
    y = np.array([1., 2., 2., 4.])
    importance = np.array([1., 1., 1., .25])
    coefficients, mse, rank = weighted_least_squares(x, y, importance)
    library = LinearRegression().fit(x[:, None], y, sample_weight=importance)
    library_coefficients = np.r_[library.intercept_, library.coef_[0]]
    np.testing.assert_allclose(coefficients, library_coefficients, atol=1e-12)
    np.testing.assert_allclose(
        weighted_least_squares(x, y, np.ones(4))[0], [.9, .9], atol=1e-12)
    np.testing.assert_allclose(
        weighted_least_squares(x, y, 7 * importance)[0], coefficients, atol=1e-12)
    np.testing.assert_allclose(
        weighted_least_squares(x, y, 1e308 * importance)[0], coefficients,
        atol=1e-12)
    # Removing D's contribution still leaves a full-rank three-row fit.
    np.testing.assert_allclose(
        weighted_least_squares(x, y, [1., 1., 1., 0.])[0],
        [7 / 6, .5], atol=1e-12)
    minimum_norm, _, deficient_rank = weighted_least_squares(
        np.ones(4), y, importance)
    assert deficient_rank == 1
    expected_mean = np.average(y, weights=importance)
    np.testing.assert_allclose(minimum_norm.sum(), expected_mean, atol=1e-12)
    design = np.column_stack((np.ones_like(x), x))
    np.testing.assert_allclose(design.T @ (importance * (y - design @ coefficients)),
                               np.zeros(2), atol=1e-12)
    print(f"coefficients {np.array2string(coefficients, precision=9)}")
    print(f"weighted MSE {mse:.12f}")
    print(f"design rank {rank}; scratch/library parity passed")


if __name__ == "__main__":
    main()
