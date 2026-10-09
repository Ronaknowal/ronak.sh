"""Centered fractional sufficient statistics; scalar floor is a separate policy."""
import numpy as np


def allocated_rows(values, responsibilities):
    values = np.asarray(values, dtype=np.float64)
    responsibilities = np.asarray(responsibilities, dtype=np.float64)
    if values.ndim != 2 or min(values.shape) == 0 or not np.isfinite(values).all():
        raise ValueError("nonempty finite n-by-d data required")
    if responsibilities.ndim != 2 or responsibilities.shape[0] != len(values) or responsibilities.shape[1] == 0:
        raise ValueError("n-by-K responsibilities required")
    if not np.isfinite(responsibilities).all() or np.any(responsibilities < 0) or not np.allclose(responsibilities.sum(axis=1), 1, rtol=0, atol=1e-12):
        raise ValueError("normalized nonnegative responsibility rows required")
    return values, responsibilities


def restrict_scatter(scatter, counts, dimension, family, regularization=0):
    if not np.isfinite(regularization) or regularization < 0:
        raise ValueError("nonnegative finite regularization required")
    if family == "full":
        covariance = scatter / counts[:, None, None]
        covariance[:, np.arange(dimension), np.arange(dimension)] += regularization
    elif family == "tied":
        covariance = scatter.sum(axis=0) / counts.sum()
        covariance[np.arange(dimension), np.arange(dimension)] += regularization
    elif family == "diag":
        covariance = scatter / counts[:, None] + regularization
    elif family == "spherical":
        covariance = scatter / (dimension * counts) + regularization
    else:
        raise ValueError("unknown covariance family")
    if not np.isfinite(covariance).all():
        raise ArithmeticError("scatter exceeds representable range")
    return covariance


def sufficient_update(values, responsibilities, family="full", regularization=0, empty_threshold=0):
    values, responsibilities = allocated_rows(values, responsibilities)
    n, dimension = values.shape
    counts = responsibilities.sum(axis=0)
    empty = np.flatnonzero(counts <= empty_threshold)
    if len(empty):
        raise ValueError("unidentified empty component IDs " + str(empty.tolist()))
    # Local-origin weighted means avoid large raw-coordinate products.
    origin = values[0]
    means = origin + responsibilities.T @ (values - origin) / counts[:, None]
    if family in ("full", "tied"):
        scatter = np.empty((len(counts), dimension, dimension))
    elif family == "diag":
        scatter = np.empty((len(counts), dimension))
    else:
        scatter = np.empty(len(counts))
    for k in range(len(counts)):
        residual = values - means[k]
        weighted = responsibilities[:, k, None] * residual
        if family in ("full", "tied"):
            scatter[k] = weighted.T @ residual
        elif family == "diag":
            scatter[k] = np.sum(weighted * residual, axis=0)
        else:
            scatter[k] = np.sum(weighted * residual)
    covariance = restrict_scatter(scatter, counts, dimension, family, regularization)
    return counts / n, means, covariance


def scalar_step(values, responsibilities, floor=0):
    if not np.isfinite(floor) or floor < 0:
        raise ValueError("nonnegative finite floor required")
    weights, means, covariance = sufficient_update(np.asarray(values)[:, None], responsibilities)
    raw_variances = covariance[:, 0, 0]
    return weights, means[:, 0], np.maximum(raw_variances, floor), raw_variances


def main():
    from gaussian_mixture import GaussianMixtureState
    x = np.array([-2, -1, 1, 2])
    state = GaussianMixtureState([.5, .5], [[-1], [1]], [[[1]], [[1]]])
    r = state.predict_proba(x[:, None])
    print("used responsibilities", r.tolist())
    print("counts", r.sum(axis=0).tolist())
    weights, means, variances, raw = scalar_step(x, r)
    print("new scalar state", weights.tolist(), means.tolist(), variances.tolist())
    xy = np.array([[0, 0], [2, 0], [0, 2]])
    shares = np.array([.8, .4, .1])
    weights, means, covariance = sufficient_update(xy, np.column_stack([shares, 1 - shares]))
    print("two-dimensional means", means.tolist())
    print("two-dimensional covariance", covariance.tolist())
    changed = np.array([0, 2, 5])
    result = scalar_step(changed, np.column_stack([shares, 1 - shares]), floor=3)
    print("changed scalar mean/raw/floored", result[1].tolist(), result[3].tolist(), result[2].tolist())


if __name__ == "__main__":
    main()
