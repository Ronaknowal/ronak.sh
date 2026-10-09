"""Strictly positive dense beta-MM NMF, with beta restricted to [0, 3]."""

from dataclasses import dataclass
from decimal import Decimal, localcontext
from numbers import Real
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, generalized_kl, nonnegative_scalar,
    nonnegative_table, positive_integer, read_only, reconstruction,
    require_finite, stable_norm,
)
from nmf_coordinate import stopping_threshold
from nmf_multiplicative import MultiplicativeFit


def beta_parameter(value):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Real):
        raise ValueError("beta must be a finite real number in [0, 3]")
    try:
        result = float(value)
    except (ValueError, TypeError, OverflowError) as error:
        raise ValueError("beta must be a finite real number in [0, 3]") from error
    if not np.isfinite(result) or not 0 <= result <= 3:
        raise ValueError("beta must be a finite real number in [0, 3]")
    return result


def positive_table(values, features=None, *, require_rows=False):
    table = nonnegative_table(values, features, require_rows=require_rows)
    if np.any(table <= 0):
        raise ValueError("This beta-MM route requires strictly positive cells")
    return table


def mm_exponent(beta):
    beta = beta_parameter(beta)
    return 1 / (2 - beta) if beta < 1 else (1 if beta <= 2 else 1 / (beta - 1))


def decimal_cell(x, y, beta):
    """Rare high-precision fallback near removable beta=0/1 singularities."""
    distance = min(abs(beta), abs(beta - 1))
    precision = max(70, int(-np.log10(distance)) + 40)
    with localcontext() as context:
        context.prec = precision
        a, b, p = (Decimal.from_float(float(v)) for v in (x, y, beta))
        value = ((p * a.ln()).exp() + (p - 1) * (p * b.ln()).exp()
                 - p * a * ((p - 1) * b.ln()).exp()) / (p * (p - 1))
        return float(value)


def beta_loss(values, predicted, beta):
    """Sum, not a norm; exact beta=2/1/0 branches and close-ratio series."""
    beta = beta_parameter(beta)
    x, y = positive_table(values), positive_table(predicted)
    if x.shape != y.shape:
        raise ValueError("Observation and prediction shapes must agree")
    if beta == 2:
        with np.errstate(over="ignore", invalid="ignore"):
            return float(require_finite(np.sum((x - y) ** 2) / 2, "Squared beta loss"))
    if beta == 1:
        return generalized_kl(x, y)
    with np.errstate(over="ignore", under="ignore", invalid="ignore", divide="ignore"):
        delta = (x - y) / y
        require_finite(delta, "Relative cell difference")
        close = np.abs(delta) < 1e-3
        terms = np.empty_like(x)
        # d_beta = y**beta * [delta²/2 + (beta-2)delta³/6 + ...].
        d = delta[close]
        term = d * d / 2
        series = term.copy()
        for degree in range(3, 11):
            term = term * d * (beta - degree + 1) / degree
            series += term
        terms[close] = np.power(y[close], beta) * series
        if beta == 0:
            ratio = x[~close] / y[~close]
            terms[~close] = ratio - 1 - np.log(ratio)
        elif min(abs(beta), abs(beta - 1)) < 1e-5:
            terms[~close] = [decimal_cell(a, b, beta) for a, b in zip(x[~close], y[~close])]
        else:
            a, b = x[~close], y[~close]
            terms[~close] = (np.power(a, beta) + (beta - 1) * np.power(b, beta)
                            - beta * a * np.power(b, beta - 1)) / (beta * (beta - 1))
        require_finite(terms, "Beta loss cells")
        if np.any(terms < 0) or np.any((x != y) & (terms == 0)):
            raise ValueError("Beta loss lost nonnegative finite resolution; rescale the data")
        return float(require_finite(np.sum(terms), "Beta loss reduction"))


def positive_power(values, power):
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        result = np.power(values, power)
    require_finite(result, "Positive power")
    if np.any(result <= 0):
        raise ValueError("Positive power underflowed; rescale the data")
    return result


def amount_products(x, w, h, beta):
    """Return numerator then denominator, both row-by-component."""
    if beta == 2:
        with np.errstate(over="ignore", invalid="ignore"):
            numerator, denominator = x @ h.T, w @ (h @ h.T)
    else:
        prediction = reconstruction(w, h)
        if np.any(prediction <= 0):
            raise ValueError("Positive reconstruction was lost")
        with np.errstate(over="ignore", under="ignore", invalid="ignore"):
            weighted = x * positive_power(prediction, beta - 2)
            if np.any(weighted <= 0):
                raise ValueError("Positive weighted observations underflowed")
            numerator = weighted @ h.T
            denominator = positive_power(prediction, beta - 1) @ h.T
    for product in (numerator, denominator):
        require_finite(product, "Beta update contraction")
        if np.any(product <= 0):
            raise ValueError("Beta update needs positive contractions")
    return numerator, denominator


def update_amounts(x, w, h, beta):
    numerator, denominator = amount_products(x, w, h, beta)
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        ratio = numerator / denominator
        result = w * positive_power(ratio, mm_exponent(beta))
    require_finite(result, "Beta-MM update")
    if np.any(result <= 0):
        raise ValueError("Beta-MM update left the finite positive domain")
    return result


def beta_sweep(x, w, h, beta):
    """New H first, then W using new H; caller-owned arrays are not changed."""
    beta = beta_parameter(beta)
    x, w, h = positive_table(x), positive_table(w), positive_table(h)
    factor_shapes(x, w, h)
    new_h = update_amounts(x.T, h.T, w.T, beta).T
    return update_amounts(x, w, new_h, beta), new_h


def gradient_norm(x, w, h, beta):
    numerator_w, denominator_w = amount_products(x, w, h, beta)
    numerator_h, denominator_h = amount_products(x.T, h.T, w.T, beta)
    # All factor entries are positive: the interior gradient is the diagnostic.
    value = np.hypot(stable_norm(denominator_w - numerator_w),
                     stable_norm(denominator_h - numerator_h))
    return float(require_finite(value, "Beta gradient norm"))


@dataclass(frozen=True)
class BetaFit:
    amounts: np.ndarray
    patterns: np.ndarray
    features: tuple
    beta: float
    max_iter: int
    tol: float
    diagnostics: tuple
    status: str

    def transform(self, values, *, features=None):
        x = positive_table(values, self.patterns.shape[1])
        if features is not None and feature_ids(features, x.shape[1]) != self.features:
            raise ValueError("Query feature IDs/order differ from the fitted dictionary")
        if self.beta in (1, 2):
            # Reuse the already explained KL/Gram-cached fixed-H encoder.
            loss = "kl" if self.beta == 1 else "frobenius"
            return MultiplicativeFit(self.amounts, self.patterns, self.features, loss,
                                     self.max_iter, self.tol, (), self.status).transform(x)
        w = np.ones((x.shape[0], self.patterns.shape[0]))
        if len(x) == 0:
            return w, {"status": "empty-query", "iterations": 0}
        def norm(amounts):
            numerator, denominator = amount_products(x, amounts, self.patterns, self.beta)
            return stable_norm(denominator - numerator)
        baseline = norm(w)
        threshold = stopping_threshold(self.tol, baseline)
        current, iterations = baseline, 0
        for _ in range(self.max_iter):
            if current <= threshold:
                break
            w = update_amounts(x, w, self.patterns, self.beta)
            iterations += 1
            current = norm(w)
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        return w, {"status": status, "iterations": iterations, "gradient": current}

    def inverse_transform(self, values):
        return reconstruction(nonnegative_table(values, self.patterns.shape[0]), self.patterns)


def fit_beta(values, initial_w, initial_h, *, beta=2, max_iter=100, tol=1e-7, features=None):
    beta = beta_parameter(beta)
    x = positive_table(values, require_rows=True)
    w, h = positive_table(initial_w), positive_table(initial_h)
    factor_shapes(x, w, h)
    cap, tolerance = positive_integer(max_iter, "max_iter"), nonnegative_scalar(tol, "tol")
    names = feature_ids(features, x.shape[1])
    current = gradient_norm(x, w, h, beta)
    threshold = stopping_threshold(tolerance, current)
    history = [(0, beta_loss(x, reconstruction(w, h), beta), current)]
    for iteration in range(1, cap + 1):
        if current <= threshold:
            break
        w, h = beta_sweep(x, w, h, beta)
        current = gradient_norm(x, w, h, beta)
        history.append((iteration, beta_loss(x, reconstruction(w, h), beta), current))
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    return BetaFit(read_only(w), read_only(h), names, beta, cap, tolerance, tuple(history), status)


def main():
    from sklearn.decomposition import NMF
    truth_w = np.array([[2, 1], [1, 3], [.5, 2.]])
    truth_h = np.array([[1, .2, 1], [.2, 1, 1.]])
    x = truth_w @ truth_h
    w0 = np.array([[1, .7], [.8, 1.2], [.5, 1.]])
    h0 = np.array([[1, .25, 1], [.25, 1, 1.]])
    print("positive_observations", x.tolist())
    for beta in (0, 1, 2):
        fitted = fit_beta(x, w0, h0, beta=beta, max_iter=100)
        ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss=beta,
                       alpha_W=0, alpha_H=0, tol=1e-7, max_iter=100, random_state=0)
        ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
        print("beta", beta, "gamma", mm_exponent(beta), "scratch", fitted.status, fitted.diagnostics[-1])
        print("ordinary_loss", beta_loss(x, ordinary_w @ ordinary.components_, beta))
        print("empty_query", fitted.transform(np.empty((0, 3)))[0].shape)


if __name__ == "__main__":
    main()
