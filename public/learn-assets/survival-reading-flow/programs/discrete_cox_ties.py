"""Exact unordered tied-subset terms for a supplied static Cox risk set.

Each member can appear in the failing subset once. This is the discrete tied
likelihood, not an exact integration over unobserved continuous event order.
There are no case weights, entry times, recurrent events or coefficient fitter.
NumPy supplies arrays; the descending-degree recurrence is implemented here.
Scalar work is O(r*d), with O(d) working state. Dense derivative work is
O(r*d*p**2), with O(d*p**2 + r*p) state including copied input features.
Importing this module never fits a model or processes a supplied dataset.
"""

from dataclasses import dataclass
from math import exp, fsum, isfinite
from numbers import Integral

import numpy as np


@dataclass(frozen=True)
class DiscreteTiedTerms:
    log_likelihood: float
    score: np.ndarray
    information: np.ndarray
    log_scaled_denominator: float
    score_shift: float


@dataclass(frozen=True)
class _SubsetMoments:
    log_mass: float
    mean: np.ndarray
    covariance: np.ndarray


def _real_array(values, name):
    raw = np.asarray(values)
    if raw.dtype.kind not in "iuf":
        raise TypeError(f"{name} must contain real numeric values.")
    result = np.array(raw, dtype=float, copy=True)
    if not np.isfinite(result).all():
        raise ValueError(f"{name} must be finite.")
    return result


def _shift_scores(log_weights):
    shift = float(np.max(log_weights))
    with np.errstate(over="ignore", invalid="ignore"):
        shifted = log_weights - shift
    if not np.isfinite(shifted).all():
        raise FloatingPointError("Score differences exceed the numeric range.")
    return shifted, shift


def log_subset_denominator(log_weights, degree):
    """Return log of the sum of products over all size-degree subsets.

    The inputs are log weights. A common maximum is removed before the DP,
    and degree times that maximum is restored only to the returned scalar.
    Degree zero is the internal base coefficient, not a permitted event group.
    """
    weights = _real_array(log_weights, "Log weights")
    if weights.ndim != 1 or len(weights) == 0:
        raise ValueError("Require a nonempty vector of log weights.")
    if isinstance(degree, bool) or not isinstance(degree, Integral):
        raise TypeError("Subset size must be an integer.")
    degree = int(degree)
    if not 1 <= degree <= len(weights):
        raise ValueError("Subset size must be between one and risk-set size.")
    shifted, shift = _shift_scores(weights)
    coefficients = np.full(degree + 1, -np.inf)
    coefficients[0] = 0.0
    for processed, log_weight in enumerate(shifted, start=1):
        for size in range(min(processed, degree), 0, -1):
            coefficients[size] = np.logaddexp(
                coefficients[size], log_weight + coefficients[size - 1]
            )
    result = float(coefficients[degree]) + degree * shift
    if not isfinite(result):
        raise FloatingPointError("Log denominator exceeds the numeric range.")
    return result


def _merge_subsets(excluded, included):
    """Merge positive subset masses using means and centered covariances."""
    if excluded is None:
        return included
    total = float(np.logaddexp(excluded.log_mass, included.log_mass))
    a = exp(excluded.log_mass - total)
    b = exp(included.log_mass - total)
    difference = included.mean - excluded.mean
    with np.errstate(over="ignore", invalid="ignore"):
        mean = excluded.mean + b * difference
        covariance = (
            a * excluded.covariance
            + b * included.covariance
            + a * b * np.outer(difference, difference)
        )
    if not np.isfinite(mean).all() or not np.isfinite(covariance).all():
        raise FloatingPointError("Subset moments exceed the numeric range.")
    return _SubsetMoments(total, mean, covariance)


def discrete_tied_terms(beta, features, deaths):
    """Return one tied-group log likelihood, score and negative Hessian.

    features has shape (risk members, features); deaths is a Boolean vector
    identifying the observed failing subset. All current event/censor members
    must already be present under the caller's declared risk-set convention.
    Features are centered at the first member, and log weights are shifted at
    their maximum. Neither change alters the likelihood or its derivatives.
    Returned score/information arrays are read-only. No inverse is formed.
    """
    x = _real_array(features, "Features")
    coefficient = _real_array(beta, "Coefficients")
    event = np.asarray(deaths)
    if x.ndim != 2 or len(x) == 0 or x.shape[1] == 0:
        raise ValueError("Require a nonempty risk-by-feature matrix.")
    if coefficient.shape != (x.shape[1],):
        raise ValueError("Require one coefficient per feature.")
    if event.dtype.kind != "b":
        raise TypeError("Death indicators must be Boolean.")
    if event.shape != (len(x),):
        raise ValueError("Require one death indicator per risk member.")
    degree = int(np.count_nonzero(event))
    if degree == 0:
        raise ValueError("This function requires at least one observed death.")
    with np.errstate(over="ignore", invalid="ignore"):
        centered = x - x[0]
        scores = centered @ coefficient
    if not np.isfinite(centered).all() or not np.isfinite(scores).all():
        raise FloatingPointError("Centered features or scores exceed the numeric range.")
    shifted, shift = _shift_scores(scores)
    p = x.shape[1]
    moments = [None] * (degree + 1)
    moments[0] = _SubsetMoments(0.0, np.zeros(p), np.zeros((p, p)))
    for processed, (log_weight, row) in enumerate(zip(shifted, centered), start=1):
        for size in range(min(processed, degree), 0, -1):
            previous = moments[size - 1]
            included = _SubsetMoments(
                previous.log_mass + float(log_weight),
                previous.mean + row,
                previous.covariance,
            )
            moments[size] = _merge_subsets(moments[size], included)
    denominator = moments[degree]
    observed = np.array(
        [fsum(float(value) for value in centered[event, j]) for j in range(p)]
    )
    log_likelihood = (
        fsum(float(value) for value in shifted[event]) - denominator.log_mass
    )
    score = observed - denominator.mean
    information = denominator.covariance.copy()
    if (
        not isfinite(log_likelihood)
        or not np.isfinite(score).all()
        or not np.isfinite(information).all()
    ):
        raise FloatingPointError("Likelihood derivatives exceed the numeric range.")
    score.setflags(write=False)
    information.setflags(write=False)
    return DiscreteTiedTerms(
        log_likelihood, score, information, denominator.log_mass, shift
    )
