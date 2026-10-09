"""Static right-censored Cox terms using positive, centered risk moments.

Subjects start at zero, features are fixed, and observations are independent
first-event records. There are no entry times, case weights or strata in this
API. Preparing costs O(n log n + np). A dense evaluation costs O(np**2 + ep**2)
and normally retains O(np + p**2) state. Optional diagnostic traces additionally
retain O(ep**2) state. No fit or work on data occurs when this module is imported.
"""

from dataclasses import dataclass
from math import exp, fsum, isfinite, log

import numpy as np


@dataclass(frozen=True)
class CoxData:
    times: np.ndarray
    events: np.ndarray
    features: np.ndarray
    feature_origin: np.ndarray
    groups: tuple[tuple[int, int], ...]


@dataclass(frozen=True)
class RiskMoments:
    log_scale: float
    mass: float
    mean: np.ndarray
    covariance: np.ndarray


@dataclass(frozen=True)
class CoxStep:
    time: float
    failures: int
    substep: int
    log_denominator: float
    mean: np.ndarray
    covariance: np.ndarray


@dataclass(frozen=True)
class CoxTerms:
    log_likelihood: float
    score: np.ndarray
    information: np.ndarray
    steps: tuple[CoxStep, ...]


def prepare_cox(times, events, features):
    """Copy, validate and sort once; remove a common feature origin internally."""
    raw_times = np.asarray(times)
    raw_events = np.asarray(events)
    raw_features = np.asarray(features)
    if raw_times.dtype.kind not in "iuf" or raw_features.dtype.kind not in "iuf":
        raise TypeError("Times and features must be real numeric arrays.")
    if raw_events.dtype.kind != "b":
        raise TypeError("Event indicators must be Boolean.")
    time = np.array(raw_times, dtype=float, copy=True)
    event = np.array(raw_events, dtype=bool, copy=True)
    x = np.array(raw_features, dtype=float, copy=True)
    if time.ndim != 1 or len(time) == 0 or event.shape != time.shape:
        raise ValueError("Require one nonempty time and Boolean event per subject.")
    if x.ndim != 2 or x.shape[0] != len(time) or x.shape[1] == 0:
        raise ValueError("Features must have shape (subjects, positive feature count).")
    if not np.isfinite(time).all() or (time < 0).any() or not np.isfinite(x).all():
        raise ValueError("Times must be finite and nonnegative; features finite.")
    origin = x[0].copy()
    with np.errstate(over="ignore", invalid="ignore"):
        centered = x - origin
    if not np.isfinite(centered).all():
        raise FloatingPointError("Feature differences exceed the numeric range.")
    order = np.argsort(-time, kind="stable")
    time, event, centered = time[order], event[order], centered[order]
    ends = np.r_[np.flatnonzero(time[1:] != time[:-1]) + 1, len(time)]
    starts = np.r_[0, ends[:-1]]
    groups = tuple((int(start), int(end)) for start, end in zip(starts, ends))
    for array in (time, event, centered, origin):
        array.setflags(write=False)
    return CoxData(time, event, centered, origin, groups)


def merge_moments(left, right):
    """Merge positive masses, never subtract uncentered second moments."""
    if left is None:
        return right
    if right is None:
        return left
    scale = max(left.log_scale, right.log_scale)
    a = left.mass * exp(left.log_scale - scale)
    b = right.mass * exp(right.log_scale - scale)
    mass = a + b
    fraction_a, fraction_b = a / mass, b / mass
    difference = right.mean - left.mean
    with np.errstate(over="ignore", invalid="ignore"):
        mean = left.mean + fraction_b * difference
        covariance = (
            fraction_a * left.covariance
            + fraction_b * right.covariance
            + fraction_a * fraction_b * np.outer(difference, difference)
        )
    if not np.isfinite(mean).all() or not np.isfinite(covariance).all():
        raise FloatingPointError("Risk moments exceed the numeric range.")
    return RiskMoments(scale, mass, mean, covariance)


def _row_moments(score, features):
    p = len(features)
    return RiskMoments(float(score), 1.0, features, np.zeros((p, p)))


def _fractional_moments(moments, fraction):
    return RiskMoments(
        moments.log_scale,
        moments.mass * fraction,
        moments.mean,
        moments.covariance,
    )


def cox_terms(beta, data, *, ties="efron", trace=False):
    """Return SUM log partial likelihood, its gradient and negative Hessian.

    Breslow/Efron coefficient denominators are supported. Baseline estimation
    is a separate operation; this function never supplies absolute survival.
    Floating-point errors are explicit failures, not silently clipped curvature.
    """
    if ties not in ("breslow", "efron"):
        raise ValueError("Ties must be 'breslow' or 'efron'.")
    beta = np.asarray(beta, dtype=float)
    p = data.features.shape[1]
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError("Require one finite coefficient per feature.")
    with np.errstate(over="ignore", invalid="ignore"):
        scores = data.features @ beta
    if not np.isfinite(scores).all():
        raise FloatingPointError("Linear scores exceed the numeric range.")
    suffix = None
    likelihood_parts = []
    score = np.zeros(p)
    information = np.zeros((p, p))
    steps = []
    for start, end in data.groups:
        nondeath = suffix
        death = None
        deaths = []
        for index in range(start, end):
            row = _row_moments(scores[index], data.features[index])
            if data.events[index]:
                death = merge_moments(death, row)
                deaths.append(index)
            else:
                nondeath = merge_moments(nondeath, row)
        suffix = merge_moments(nondeath, death)
        d = len(deaths)
        if not d:
            continue
        # Pair the numerator with the same local scale as its denominators.
        # This cancels common score shifts without subtracting two huge totals.
        local_likelihood = fsum(float(scores[i] - suffix.log_scale) for i in deaths)
        score += np.sum(data.features[deaths], axis=0)
        for substep in range(d):
            fraction = 1.0 - substep / d if ties == "efron" else 1.0
            pool = merge_moments(nondeath, _fractional_moments(death, fraction))
            local_likelihood -= (
                pool.log_scale - suffix.log_scale + log(pool.mass)
            )
            score -= pool.mean
            information += pool.covariance
            if trace:
                steps.append(
                    CoxStep(
                        float(data.times[start]),
                        d,
                        substep,
                        pool.log_scale + log(pool.mass),
                        pool.mean.copy(),
                        pool.covariance.copy(),
                    )
                )
        likelihood_parts.append(local_likelihood)
    likelihood = fsum(likelihood_parts)
    if not isfinite(likelihood) or not np.isfinite(score).all() or not np.isfinite(information).all():
        raise FloatingPointError("Partial likelihood derivatives exceed the numeric range.")
    return CoxTerms(likelihood, score, information, tuple(steps))
