"""Untied first-event Schoenfeld residuals.

Consume the static CoxData taught earlier. There are no entry times, weights,
strata, penalties or tied failures here. Neither function fits coefficients.
Raw residual extraction costs O(np), after preparation.
"""

from dataclasses import dataclass
from math import exp

import numpy as np

@dataclass(frozen=True)
class SchoenfeldRows:
    times: np.ndarray
    observed_features: np.ndarray
    weighted_means: np.ndarray
    residuals: np.ndarray


def untied_schoenfeld(beta, data):
    """One observed-minus-weighted feature vector per event, in time order."""
    beta = np.asarray(beta, dtype=float)
    p = data.features.shape[1]
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError("Require one finite coefficient per feature.")
    scores = data.features @ beta
    if not np.isfinite(scores).all():
        raise FloatingPointError("Linear scores exceed the numeric range.")
    log_mass = -np.inf
    mean = np.zeros(p)
    rows = []
    for start, end in data.groups:
        # Add the complete same-time group before observing its one failure.
        for index in range(start, end):
            combined = float(np.logaddexp(log_mass, scores[index]))
            fraction = exp(float(scores[index]) - combined)
            mean = mean + fraction * (data.features[index] - mean)
            log_mass = combined
        deaths = np.flatnonzero(data.events[start:end]) + start
        if len(deaths) > 1:
            raise ValueError("This residual contract requires untied failures.")
        if len(deaths) == 1:
            observed = data.features[int(deaths[0])].copy()
            rows.append((float(data.times[start]), observed, mean.copy(), observed - mean))
    rows.reverse()
    times = np.array([row[0] for row in rows])
    observed = np.array([row[1] for row in rows]).reshape(-1, p) + data.feature_origin
    means = np.array([row[2] for row in rows]).reshape(-1, p) + data.feature_origin
    residuals = np.array([row[3] for row in rows]).reshape(-1, p)
    if not np.isfinite(means).all() or not np.isfinite(residuals).all():
        raise FloatingPointError("Residual feature differences exceed the numeric range.")
    for array in (times, observed, means, residuals):
        array.setflags(write=False)
    return SchoenfeldRows(times, observed, means, residuals)

