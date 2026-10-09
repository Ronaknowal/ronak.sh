"""H-first multiplicative NMF for Frobenius and generalized KL objectives."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, generalized_kl,
    nonnegative_scalar, nonnegative_table, positive_integer, projected_gradient,
    read_only, reconstruction, require_finite, stable_norm,
)
from nmf_coordinate import joint_stationarity, stopping_threshold


def multiply_ratio(values, numerator, denominator):
    """Elementwise update; 0/0 is flat and retains the old value, not an epsilon."""
    if values.shape != numerator.shape or values.shape != denominator.shape:
        raise ValueError("Value, numerator and denominator shapes must agree")
    for array in (values, numerator, denominator):
        require_finite(array, "Multiplicative operand")
        if (array < 0).any():
            raise ValueError("Multiplicative operands must be nonnegative")
    if np.any((denominator == 0) & (numerator > 0)):
        raise ValueError("A positive numerator needs a positive denominator")
    ratio = np.ones_like(values)
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        np.divide(numerator, denominator, out=ratio, where=denominator > 0)
        result = values * ratio
    require_finite(ratio, "Multiplicative ratio")
    require_finite(result, "Multiplicative update")
    if np.any((numerator > 0) & (ratio == 0)) or np.any((values > 0) & (ratio > 0) & (result == 0)):
        raise ValueError("Multiplicative arithmetic underflowed; rescale the data")
    return result


def count_ratio(x, prediction):
    if np.any((x > 0) & (prediction == 0)):
        raise ValueError("Positive counts need positive predicted rates")
    ratio = np.zeros_like(x)  # Includes the observed0/predicted0 convention.
    with np.errstate(over="ignore", invalid="ignore"):
        np.divide(x, prediction, out=ratio, where=prediction > 0)
    require_finite(ratio, "Count/rate ratio")
    if np.any((x > 0) & (ratio == 0)):
        raise ValueError("Count/rate ratio underflowed; rescale the data")
    return ratio


def update_amounts(x, w, h, loss):
    """One simultaneous W block with the dictionary held fixed."""
    with np.errstate(over="ignore", invalid="ignore"):
        if loss == "frobenius":
            numerator, denominator = x @ h.T, w @ (h @ h.T)
        elif loss == "kl":
            ratio = count_ratio(x, reconstruction(w, h))
            numerator = ratio @ h.T
            denominator = np.broadcast_to(h.sum(axis=1), w.shape)
        else:
            raise ValueError("Choose frobenius or kl")
    return multiply_ratio(w, numerator, denominator)


def multiplicative_sweep(x, w, h, loss="frobenius"):
    """Return new factors: H first, then W using that new H."""
    factor_shapes(x, w, h)
    new_h = update_amounts(x.T, h.T, w.T, loss).T
    new_w = update_amounts(x, w, new_h, loss)
    return new_w, new_h


def objective(x, w, h, loss):
    if loss == "frobenius":
        return frobenius_metrics(x, w, h).half_square
    if loss == "kl":
        return generalized_kl(x, reconstruction(w, h))
    raise ValueError("Choose frobenius or kl")


def stationarity(x, w, h, loss):
    if loss == "frobenius":
        return joint_stationarity(x, w, h)
    if loss != "kl":
        raise ValueError("Choose frobenius or kl")
    ratio = count_ratio(x, reconstruction(w, h))
    with np.errstate(over="ignore", invalid="ignore"):
        grad_w = h.sum(axis=1)[None, :] - ratio @ h.T
        grad_h = w.sum(axis=0)[:, None] - w.T @ ratio
        norm = np.hypot(stable_norm(projected_gradient(w, grad_w)), stable_norm(projected_gradient(h, grad_h)))
    return float(require_finite(norm, "KL stationarity"))


@dataclass(frozen=True)
class MultiplicativeFit:
    amounts: np.ndarray
    patterns: np.ndarray
    features: tuple
    loss: str
    max_iter: int
    tol: float
    diagnostics: tuple
    status: str

    def transform(self, values, *, features=None):
        x = nonnegative_table(values, self.patterns.shape[1])
        if features is not None and feature_ids(features, x.shape[1]) != self.features:
            raise ValueError("Query feature IDs/order differ from the dictionary")
        w = np.ones((x.shape[0], self.patterns.shape[0]))
        if len(x) == 0:
            return w, {"status": "empty-query", "iterations": 0}
        # The dictionary and all snapshot fields remain unchanged.
        def gradient_norm(amounts):
            if self.loss == "frobenius":
                gradient = amounts @ gram - cross
            else:
                ratio = count_ratio(x, reconstruction(amounts, self.patterns))
                gradient = self.patterns.sum(axis=1)[None, :] - ratio @ self.patterns.T
            return stable_norm(projected_gradient(amounts, gradient))
        if self.loss == "frobenius":
            with np.errstate(over="ignore", invalid="ignore"):
                gram, cross = self.patterns @ self.patterns.T, x @ self.patterns.T
            require_finite(gram, "Encoding Gram product")
            require_finite(cross, "Encoding cross product")
        baseline = gradient_norm(w)
        threshold = stopping_threshold(self.tol, baseline)
        current, iterations = baseline, 0
        for _ in range(self.max_iter):
            if current <= threshold:
                break
            if self.loss == "frobenius":
                with np.errstate(over="ignore", invalid="ignore"):
                    denominator = w @ gram
                w = multiply_ratio(w, cross, denominator)
            else:
                w = update_amounts(x, w, self.patterns, self.loss)
            iterations += 1
            current = gradient_norm(w)
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        return w, {"status": status, "iterations": iterations, "projected_gradient": current}

    def inverse_transform(self, values):
        w = nonnegative_table(values, self.patterns.shape[0])
        return reconstruction(w, self.patterns)


def fit_multiplicative(values, initial_w, initial_h, *, loss="frobenius", max_iter=1000, tol=1e-7, features=None):
    x = nonnegative_table(values, require_rows=True)
    w = nonnegative_table(initial_w, require_rows=True)
    h = nonnegative_table(initial_h, x.shape[1], require_rows=True)
    factor_shapes(x, w, h)
    cap, tolerance = positive_integer(max_iter, "max_iter"), nonnegative_scalar(tol, "tol")
    names = feature_ids(features, x.shape[1])
    baseline = stationarity(x, w, h, loss)
    threshold = stopping_threshold(tolerance, baseline)
    current = baseline
    history = [(0, objective(x, w, h, loss), current)]
    for iteration in range(1, cap + 1):
        if current <= threshold:
            break
        w, h = multiplicative_sweep(x, w, h, loss)
        current = stationarity(x, w, h, loss)
        history.append((iteration, objective(x, w, h, loss), current))
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    # This pure function returns one complete read-only snapshot; failure returns none.
    return MultiplicativeFit(read_only(w), read_only(h), names, loss, cap, tolerance, tuple(history), status)


def main():
    import argparse
    from sklearn.decomposition import NMF

    parser = argparse.ArgumentParser()
    parser.add_argument("--loss", choices=("all", "frobenius", "kl"), default="all")
    selected = parser.parse_args().loss
    x = np.array([[2, 1, 3], [1, 3, 4], [0, 2, 2]], dtype=float)
    w0, h0 = np.ones((3, 2)), np.array([[1, 0, 1], [0, 1, 1]], dtype=float)
    if selected != "kl":
        w1, h1 = multiplicative_sweep(x, w0, h0)
        print("H_first", h1.tolist())
        print("W_using_new_H", w1.tolist())
        print("one_sweep_half_loss", objective(x, w1, h1, "frobenius"))
        print("locked_zero", multiply_ratio(np.array([0.]), np.array([2.]), np.array([1.])).tolist())
    for loss, ordinary_loss in (("frobenius", "frobenius"), ("kl", "kullback-leibler")):
        if selected not in ("all", loss):
            continue
        # KL comparison adds .5*C0+.25*C1 to every row: all measurements are positive.
        comparison_x = x if loss == "frobenius" else x + np.array([.5, .25, .75])
        if loss == "kl":
            print("kl_observations", comparison_x.tolist())
        fit = fit_multiplicative(comparison_x, w0, h0, loss=loss, max_iter=2000, tol=1e-7)
        ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss=ordinary_loss,
                       alpha_W=0, alpha_H=0, max_iter=2000, tol=1e-7, random_state=0)
        ordinary_w = ordinary.fit_transform(comparison_x, W=w0.copy(), H=h0.copy())
        print(loss, "scratch", fit.status, fit.diagnostics[-1])
        print(loss, "ordinary_objective", objective(comparison_x, ordinary_w, ordinary.components_, loss))
        print(loss, "empty_shape", fit.transform(np.empty((0, 3)))[0].shape)


if __name__ == "__main__":
    main()
