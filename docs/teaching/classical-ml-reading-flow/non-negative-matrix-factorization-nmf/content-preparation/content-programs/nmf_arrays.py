"""Array contracts and reductions used by the NMF lesson's dense algorithms."""

from dataclasses import dataclass
from numbers import Real
import numpy as np

from centered_pca import real_table


def nonnegative_table(values, features=None, *, require_rows=False):
    table = real_table(values, features)
    if (table < 0).any() or (require_rows and table.shape[0] == 0):
        raise ValueError("Expected nonnegative values and a nonempty fitting table")
    return table


def positive_integer(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def nonnegative_scalar(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite nonnegative real number")
    try:
        result = float(value)
    except (ValueError, TypeError, OverflowError) as error:
        raise ValueError(f"{name} must be a finite nonnegative real number") from error
    if not np.isfinite(result) or result < 0:
        raise ValueError(f"{name} must be a finite nonnegative real number")
    return result


def feature_ids(names, count):
    result = tuple(f"F{j}" for j in range(count)) if names is None else tuple(names)
    if len(result) != count or any(not isinstance(name, str) or not name for name in result):
        raise ValueError("Supply one nonempty string ID per feature")
    if len(set(result)) != count:
        raise ValueError("Feature IDs must be unique and ordered")
    return result


def require_finite(values, operation):
    if not np.isfinite(values).all():
        raise ValueError(f"{operation} exceeded finite arithmetic; rescale the data")
    return values


def read_only(values):
    result = np.array(values, dtype=np.float64, copy=True)
    result.setflags(write=False)
    return result


def stable_norm(values):
    """Euclidean norm without squaring the largest unscaled entry."""
    values = np.asarray(values, dtype=np.float64)
    require_finite(values, "Norm input")
    scale = float(np.max(np.abs(values), initial=0.0))
    if scale == 0:
        return 0.0
    scaled = values / scale
    with np.errstate(over="ignore", invalid="ignore"):
        result = scale * np.sqrt(np.sum(scaled * scaled))
    require_finite(result, "Norm reduction")
    return float(result)


def factor_shapes(x, w, h):
    if w.ndim != 2 or h.ndim != 2 or w.shape[1] == 0:
        raise ValueError("Factors must be row-by-component and component-by-feature")
    if w.shape[0] != x.shape[0] or h.shape != (w.shape[1], x.shape[1]):
        raise ValueError("Factor dimensions do not contract to the observation table")
    for factor in (w, h):
        require_finite(factor, "Factor")
        if (factor < 0).any():
            raise ValueError("Factors must be nonnegative")


def reconstruction(w, h):
    with np.errstate(over="ignore", invalid="ignore"):
        result = w @ h
    return require_finite(result, "Reconstruction")


@dataclass(frozen=True)
class FrobeniusMetrics:
    half_square: float
    squared_norm: float
    norm: float
    mse: float
    rmse: float
    cells: int


def frobenius_metrics(x, w, h, block_rows=256):
    """Unweighted observed cells; a mask needs its own stated denominator."""
    factor_shapes(x, w, h)
    block_rows = positive_integer(block_rows, "block_rows")
    cells = int(x.size)
    if cells == 0:
        raise ValueError("An empty observation table has no reconstruction-quality mean")
    squared = 0.0
    for start in range(0, x.shape[0], block_rows):
        stop = start + block_rows
        residual = x[start:stop] - reconstruction(w[start:stop], h)
        with np.errstate(over="ignore", invalid="ignore"):
            squared += float(np.sum(residual * residual))
        require_finite(squared, "Squared residual reduction")
    mean = squared / cells
    return FrobeniusMetrics(squared / 2, squared, float(np.sqrt(squared)), mean, float(np.sqrt(mean)), cells)


def weighted_half_square(x, w, h, mask, block_rows=256):
    """Sum of weighted squared residuals / 2, without a quality-mean claim."""
    factor_shapes(x, w, h)
    weights = nonnegative_table(mask, x.shape[1])
    if weights.shape != x.shape:
        raise ValueError("Mask weights need exactly the observation-table shape")
    block_rows = positive_integer(block_rows, "block_rows")
    total = 0.0
    for start in range(0, x.shape[0], block_rows):
        stop = start + block_rows
        for i in range(start, min(stop, x.shape[0])):
            included = weights[i] > 0
            if not included.any():
                continue
            # Omitted cells are not computed: even their products may overflow.
            residual = x[i, included] - reconstruction(w[i:i + 1], h[:, included])[0]
            with np.errstate(over="ignore", invalid="ignore"):
                selected = residual * np.sqrt(weights[i, included])
                total += float(np.sum(selected * selected)) / 2
            require_finite(total, "Weighted residual reduction")
    return total


def generalized_kl(x, prediction):
    """Generalized KL with its exact zero-count/support conventions."""
    x = nonnegative_table(x)
    prediction = nonnegative_table(prediction, x.shape[1])
    if x.shape != prediction.shape:
        raise ValueError("Observation and prediction shapes must agree")
    positive = x > 0
    if (prediction[positive] == 0).any():
        raise ValueError("Positive observations require positive predicted rates")
    terms = prediction.copy()  # x=0 contributes y, including 0 when y=0.
    a, b = x[positive], prediction[positive]
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        delta = (a - b) / b
        close = np.abs(delta) < 1e-3
        part = np.empty_like(a)
        # (1+d)log(1+d)-d = d²/2-d³/6+d⁴/12-... avoids cancellation.
        d = delta[close]
        phi = d * d * (0.5 + d * (-1 / 6 + d * (1 / 12 + d * (-1 / 20 + d / 30))))
        part[close] = b[close] * phi
        part[~close] = a[~close] * (np.log(a[~close]) - np.log(b[~close])) - (a[~close] - b[~close])
        terms[positive] = part
        result = float(np.sum(terms))
    require_finite(result, "KL reduction")
    return result


def projected_gradient(values, gradient):
    require_finite(gradient, "Gradient")
    if values.shape != gradient.shape:
        raise ValueError("A gradient needs the same shape as its factor")
    return np.where(values > 0, gradient, np.minimum(gradient, 0.0))


def main():
    x = nonnegative_table([[2, 1, 3], [1, 3, 4], [0, 2, 2]], require_rows=True)
    w, h = np.ones((3, 2)), np.array([[1, 0, 1], [0, 1, 1]], dtype=float)
    result = frobenius_metrics(x, w, h, block_rows=2)
    print("reconstruction", reconstruction(w, h).tolist())
    print("half_square", result.half_square, "squared_norm", result.squared_norm)
    print("norm", result.norm, "mse", result.mse, "rmse", result.rmse)
    print("kl_zero_count", generalized_kl([[0, 0]], [[2, 0]]))
    print("masked_half_square", weighted_half_square(x, w, h, np.ones_like(x)))


if __name__ == "__main__":
    main()
