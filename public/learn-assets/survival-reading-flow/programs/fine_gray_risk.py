"""Static Fine–Gray weighted terms for a supplied continuous censoring law.

Right-censored independent first-event subjects enter at zero. Features are fixed,
cause0 is censoring, target is a positive cause code; tied targets use Breslow.
The common positive continuous law is supplied as log G(t), not estimated here.
Reuse section8's centered positive moment merge; do not build n×event weights.
"""

from dataclasses import dataclass
from math import fsum, isfinite, log

import numpy as np

from cox_risk_moments import CoxData, RiskMoments, merge_moments, prepare_cox


@dataclass(frozen=True)
class FineGrayData:
    cox: CoxData
    competing: np.ndarray
    log_censor_survival: np.ndarray


@dataclass(frozen=True)
class FineGrayStep:
    time: float
    failures: int
    log_denominator: float
    mean: np.ndarray
    covariance: np.ndarray
    log_baseline_increment: float


@dataclass(frozen=True)
class FineGrayTerms:
    log_likelihood: float
    score: np.ndarray
    information: np.ndarray
    steps: tuple[FineGrayStep, ...]


def prepare_fine_gray(times, causes, features, target, log_censor_survival):
    causes = np.asarray(causes)
    if causes.dtype.kind not in "iu" or np.any(causes < 0) or isinstance(target, (bool, np.bool_)) or not isinstance(target, (int, np.integer)) or target < 1:
        raise ValueError("Use nonnegative integer cause codes and a positive target.")
    data = prepare_cox(times, causes == target, features)
    order = np.argsort(-np.asarray(times, dtype=float), kind="stable")
    competing = (causes[order] != 0) & (causes[order] != target)
    log_g = np.asarray(log_censor_survival(data.times), dtype=float).copy()
    if log_g.shape != data.times.shape or not np.isfinite(log_g).all() or (log_g > 0).any():
        raise ValueError("Supply finite log observation probabilities, at most zero.")
    if (np.diff(log_g) < 0).any() or np.any(log_g[1:][data.times[1:] == data.times[:-1]] != log_g[:-1][data.times[1:] == data.times[:-1]]):
        raise ValueError("The common censor-survival law must be nonincreasing with time.")
    for array in (competing, log_g):
        array.setflags(write=False)
    return FineGrayData(data, competing, log_g)


def contribution_weights(time, times, causes, target, log_censor_survival):
    """O(n) inspection of ONE event roster; not the evaluator's inner loop."""
    times, causes = np.asarray(times, dtype=float), np.asarray(causes)
    physical = times >= time
    retained = (times < time) & (causes != 0) & (causes != target)
    weights = physical.astype(float)
    weights[retained] = np.exp(log_censor_survival(np.asarray([time]))[0] - log_censor_survival(times[retained]))
    return physical, retained, weights


def shift_moments(moments, log_weight):
    if moments is None:
        return None
    scale = moments.log_scale + log_weight
    if not isfinite(scale):
        raise FloatingPointError("Weighted risk scale exceeds the numeric range.")
    return RiskMoments(scale, moments.mass, moments.mean, moments.covariance)


def fine_gray_terms(beta, prepared):
    """SUM log likelihood, gradient, negative Hessian and log baseline jumps.

    Evaluation O(n p² + e p²), retained O(np + e p²), for e target endpoints.
    Common continuous G makes retained contributions factor into G(t)/G(Y).
    """
    data = prepared.cox
    beta = np.asarray(beta, dtype=float)
    p = data.features.shape[1]
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError("Supply one finite coefficient per feature.")
    with np.errstate(over="ignore", invalid="ignore"):
        scores = data.features @ beta
        retained_scores = scores - prepared.log_censor_survival
    if not np.isfinite(scores).all() or not np.isfinite(retained_scores).all():
        raise FloatingPointError("Weighted scores exceed the numeric range.")

    zero_covariance = np.zeros((p, p))
    zero_covariance.setflags(write=False)

    def row(index, value):
        return RiskMoments(float(value), 1., data.features[index], zero_covariance)

    # Ascending-time pass stores only strictly earlier competing-event moments.
    earlier, prefix = {}, None
    for group in reversed(data.groups):
        start, end = group
        if data.events[start:end].any():
            earlier[group] = prefix
        for index in range(start, end):
            if prepared.competing[index]:
                prefix = merge_moments(prefix, row(index, retained_scores[index]))

    # Descending-time pass accumulates physical risk without subtracting moments.
    physical = None
    likelihood_parts, steps = [], []
    score, information = np.zeros(p), np.zeros((p, p))
    for group in data.groups:
        start, end = group
        for index in range(start, end):
            physical = merge_moments(physical, row(index, scores[index]))
        deaths = np.flatnonzero(data.events[start:end]) + start
        d = len(deaths)
        if not d:
            continue
        retained = shift_moments(earlier[group], float(prepared.log_censor_survival[start]))
        pool = merge_moments(physical, retained)
        log_denominator = pool.log_scale + log(pool.mass)
        local = fsum(float(scores[index] - pool.log_scale) for index in deaths) - d * log(pool.mass)
        likelihood_parts.append(local)
        score += data.features[deaths].sum(axis=0) - d * pool.mean
        information += d * pool.covariance
        steps.append(FineGrayStep(
            float(data.times[start]), d, log_denominator,
            pool.mean.copy(), pool.covariance.copy(), log(d) - log_denominator,
        ))
    likelihood = fsum(likelihood_parts)
    if not isfinite(likelihood) or not np.isfinite(score).all() or not np.isfinite(information).all():
        raise FloatingPointError("Weighted terms exceed the numeric range.")
    return FineGrayTerms(likelihood, score, information, tuple(reversed(steps)))
