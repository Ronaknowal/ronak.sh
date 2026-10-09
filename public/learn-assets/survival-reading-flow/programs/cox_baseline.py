"""Reference cumulative hazard and supported static Cox survival prediction.

Use data prepared by cox_risk_moments.prepare_cox and supplied coefficients.
Baseline tie choice is separate from the coefficient-fitting tie choice.
Subjects start at zero; there are no entry times, case weights or strata.
Given prepared data, work is O(n*p + n + e), with O(n + p) extra working
storage. Query work is O(q*log(m) + a*p + a*q) for q times, a profiles and
m failure groups; returned matrices themselves require O(a*q) storage.
No fitting, data loading or work on inputs occurs when this module is imported.
"""

from dataclasses import dataclass
from math import log

import numpy as np

from cox_risk_moments import CoxData


@dataclass(frozen=True)
class CoxBaseline:
    event_times: np.ndarray
    log_increments: np.ndarray
    log_cumulative_hazard: np.ndarray
    beta: np.ndarray
    reference: np.ndarray
    feature_names: tuple[str, ...]
    support_end: float
    baseline_ties: str


@dataclass(frozen=True)
class CoxSurvivalPrediction:
    log_cumulative_hazard: np.ndarray
    log_survival: np.ndarray
    survival: np.ndarray
    rounded_to_zero: np.ndarray


def _numeric_copy(values, name):
    raw = np.asarray(values)
    if raw.dtype.kind not in "iuf":
        raise TypeError(f"{name} must be real numeric values.")
    copied = np.array(raw, dtype=float, copy=True)
    if not np.isfinite(copied).all():
        raise ValueError(f"{name} must be finite.")
    return copied


def estimate_cox_baseline(beta, data, *, feature_names, reference=None, ties="breslow"):
    """Build an event-time baseline at a named feature reference.

    Breslow uses d / total risk weight. Efron uses the sum of d reciprocal
    progressively depleted risk denominators. The reference defaults to the
    data's centering origin, not necessarily zero or a mean-valued subject.
    Arrays are copied/read-only; a baseline name never determines a coefficient
    fit already supplied by the caller.
    """
    if not isinstance(data, CoxData):
        raise TypeError("Use data returned by prepare_cox.")
    if ties not in ("breslow", "efron"):
        raise ValueError("Baseline ties must be 'breslow' or 'efron'.")
    coefficient = _numeric_copy(beta, "Coefficients")
    p = data.features.shape[1]
    names = tuple(feature_names)
    if coefficient.shape != (p,):
        raise ValueError("Require one coefficient per feature.")
    if len(names) != p or len(set(names)) != p or any(
        not isinstance(name, str) or not name for name in names
    ):
        raise ValueError("Require unique nonempty feature names in column order.")
    ref = data.feature_origin.copy() if reference is None else _numeric_copy(reference, "Reference")
    if ref.shape != (p,):
        raise ValueError("Reference must contain one value per feature.")
    with np.errstate(over="ignore", invalid="ignore"):
        scores = data.features @ coefficient
        reference_shift = float((ref - data.feature_origin) @ coefficient)
    if not np.isfinite(scores).all() or not np.isfinite(reference_shift):
        raise FloatingPointError("Feature scores exceed the numeric range.")
    log_suffix = -np.inf
    event_times = []
    log_increments = []
    for start, end in data.groups:
        log_nondeath = log_suffix
        log_death = -np.inf
        deaths = 0
        for index in range(start, end):
            if data.events[index]:
                log_death = float(np.logaddexp(log_death, scores[index]))
                deaths += 1
            else:
                log_nondeath = float(np.logaddexp(log_nondeath, scores[index]))
        log_suffix = float(np.logaddexp(log_nondeath, log_death))
        if deaths == 0:
            continue
        if ties == "breslow":
            log_increment = log(deaths) - log_suffix
        else:
            log_increment = -np.inf
            for substep in range(deaths):
                log_fraction = log(1.0 - substep / deaths)
                log_denominator = float(np.logaddexp(
                    log_nondeath, log_death + log_fraction
                ))
                log_increment = float(np.logaddexp(log_increment, -log_denominator))
        event_times.append(float(data.times[start]))
        log_increments.append(log_increment + reference_shift)
    times = np.array(event_times[::-1])
    increments = np.array(log_increments[::-1])
    cumulative = np.empty(len(increments))
    total = -np.inf
    for index, value in enumerate(increments):
        total = float(np.logaddexp(total, value))
        cumulative[index] = total
    if not np.isfinite(increments).all() or not np.isfinite(cumulative).all():
        raise FloatingPointError("Log baseline exceeds the numeric range.")
    for array in (times, increments, cumulative, coefficient, ref):
        array.setflags(write=False)
    return CoxBaseline(times, increments, cumulative, coefficient, ref, names,
                       float(data.times[0]), ties)


def predict_cox_survival(baseline, profiles, query_times, *, feature_names):
    """Return profile-by-time arrays within the recorded follow-up support.

    Right-continuous steps include a failure at an equal query time. Before
    the first failure, cumulative hazard is zero and survival is one. A floating
    zero survival is flagged; it is not a claim of exact population extinction.
    This function supplies point estimates, not standard errors or confidence
    bands. Queries beyond the last observed endpoint are rejected.
    """
    x = _numeric_copy(profiles, "Profiles")
    times = _numeric_copy(query_times, "Query times")
    p = len(baseline.beta)
    if tuple(feature_names) != baseline.feature_names:
        raise ValueError("Query feature names/order must match the stored schema.")
    if x.ndim != 2 or x.shape[1] != p or len(x) == 0:
        raise ValueError("Profiles must have shape (positive profile count, features).")
    if times.ndim != 1 or len(times) == 0 or (times < 0).any():
        raise ValueError("Require nonempty nonnegative query times.")
    if (times > baseline.support_end).any():
        raise ValueError("Query time exceeds recorded follow-up support.")
    positions = np.searchsorted(baseline.event_times, times, side="right") - 1
    log_base = np.full(len(times), -np.inf)
    known = positions >= 0
    log_base[known] = baseline.log_cumulative_hazard[positions[known]]
    with np.errstate(over="ignore", invalid="ignore"):
        log_relative_weight = (x - baseline.reference) @ baseline.beta
        log_hazard = log_relative_weight[:, None] + log_base[None, :]
    if not np.isfinite(log_relative_weight).all() or np.isnan(log_hazard).any():
        raise FloatingPointError("Profile scores exceed the numeric range.")
    if not np.isfinite(log_hazard[:, known]).all():
        raise FloatingPointError("Log cumulative hazard exceeds the numeric range.")
    with np.errstate(over="ignore", under="ignore"):
        log_survival = -np.exp(log_hazard)
        survival = np.exp(log_survival)
    rounded_to_zero = survival == 0
    for array in (log_hazard, log_survival, survival, rounded_to_zero):
        array.setflags(write=False)
    return CoxSurvivalPrediction(log_hazard, log_survival, survival, rounded_to_zero)
