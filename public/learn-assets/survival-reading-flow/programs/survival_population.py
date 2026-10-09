"""Known-rate illustrations: a rate change and selection among latent types.

These functions evaluate declared probability laws; they do not fit observations.
The mixture takes O(qk) work/output state for q times and k types. Log survival
and survivor weights remain useful when displayed survival rounds to zero.
"""

from dataclasses import dataclass
from math import fsum, isfinite

import numpy as np


@dataclass(frozen=True)
class MixtureCurve:
    log_survival: np.ndarray
    survival: np.ndarray
    survivor_weights: np.ndarray
    hazard: np.ndarray
    hazard_derivative: np.ndarray
    rounded_positive_tail: np.ndarray


def _times(values):
    times = np.asarray(values, dtype=float)
    if times.ndim != 1 or not np.isfinite(times).all() or (times < 0).any():
        raise ValueError("Times must be a finite nonnegative one-dimensional array.")
    return times


def changed_rate_curve(values, change_time):
    """Reference .1/day; comparison .05/day before c, .2/day from c onward."""
    times = _times(values)
    change_time = float(change_time)
    if not isfinite(change_time) or change_time < 0:
        raise ValueError("Change time must be finite and nonnegative.")
    reference_hazard = np.full(times.shape, 0.1)
    comparison_hazard = np.where(times < change_time, 0.05, 0.2)
    reference_cumulative = 0.1 * times
    comparison_cumulative = (
        0.05 * np.minimum(times, change_time)
        + 0.2 * np.maximum(times - change_time, 0.0)
    )
    return {
        "reference_hazard": reference_hazard,
        "comparison_hazard": comparison_hazard,
        "reference_cumulative": reference_cumulative,
        "comparison_cumulative": comparison_cumulative,
        "reference_survival": np.exp(-reference_cumulative),
        "comparison_survival": np.exp(-comparison_cumulative),
        "later_crossing_time": 1.5 * change_time if change_time > 0 else None,
    }


def mixture_exponentials(values, rates, initial_weights, *, multiplier=1.0):
    """Return one joint survivor law and its survivor-conditioned type weights."""
    times = _times(values)
    rates = np.asarray(rates, dtype=float)
    weights = np.asarray(initial_weights, dtype=float)
    multiplier = float(multiplier)
    if rates.ndim != 1 or not len(rates) or weights.shape != rates.shape:
        raise ValueError("Require one initial weight for each of at least one type.")
    if not np.isfinite(rates).all() or (rates < 0).any():
        raise ValueError("Rates must be finite and nonnegative.")
    if not np.isfinite(weights).all() or (weights < 0).any():
        raise ValueError("Weights must be finite and nonnegative.")
    if abs(fsum(float(v) for v in weights) - 1.0) > 1e-12:
        raise ValueError("Initial type probabilities must sum to one.")
    if not isfinite(multiplier) or multiplier < 0:
        raise ValueError("The common rate multiplier must be finite and nonnegative.")
    with np.errstate(over="ignore", invalid="ignore"):
        effective_rates = multiplier * rates
        accumulated = times[:, None] * effective_rates[None, :]
    if not np.isfinite(effective_rates).all() or not np.isfinite(accumulated).all():
        raise FloatingPointError("Integrated rates exceed the supported numeric range.")
    # A zero initial type retains zero weight, without inventing a small epsilon.
    with np.errstate(divide="ignore"):
        log_mass = np.log(weights)[None, :] - accumulated
    log_survival = np.logaddexp.reduce(log_mass, axis=1)
    survivor_weights = np.exp(log_mass - log_survival[:, None])
    survival = np.exp(log_survival)
    hazard = survivor_weights @ effective_rates
    # Center before squaring: this is minus a variance, not raw second moments.
    with np.errstate(over="ignore", invalid="ignore"):
        deviations = effective_rates[None, :] - hazard[:, None]
        derivative = -np.sum(survivor_weights * deviations**2, axis=1)
    if not np.isfinite(hazard).all() or not np.isfinite(derivative).all():
        raise FloatingPointError("Hazard moments exceed the supported numeric range.")
    rounded = survival == 0
    arrays = (log_survival, survival, survivor_weights, hazard, derivative, rounded)
    for array in arrays:
        array.setflags(write=False)
    return MixtureCurve(*arrays)
