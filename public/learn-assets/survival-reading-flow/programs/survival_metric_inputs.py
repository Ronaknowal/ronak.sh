"""Shared validation for the lesson's static first-event metric contracts."""

import numpy as np


def observations(times, events):
    t = np.asarray(times, dtype=float)
    d = np.asarray(events)
    if t.ndim != 1 or not len(t) or d.shape != t.shape or d.dtype.kind != "b":
        raise ValueError("Require nonempty times and equally sized Boolean events.")
    if not np.isfinite(t).all() or (t < 0).any():
        raise ValueError("Observation times must be finite and nonnegative.")
    return t, d


def vector(values, size, name):
    a = np.asarray(values, dtype=float)
    if a.shape != (size,) or not np.isfinite(a).all():
        raise ValueError(f"{name} must have one finite value per subject.")
    return a


def tolerance(value):
    value = float(value)
    if not np.isfinite(value) or value < 0:
        raise ValueError("Tie tolerance must be finite and nonnegative.")
    return value


def positive_observation_probability(censor_survival, times):
    times = np.asarray(times, dtype=float)
    values = np.asarray(censor_survival(times), dtype=float)
    if values.shape != times.shape or not np.isfinite(values).all():
        raise ValueError("Supply one finite censor-survival probability per query.")
    if (values <= 0).any() or (values > 1).any():
        raise ValueError("Evaluation requires positive observation support, at most one.")
    return values
