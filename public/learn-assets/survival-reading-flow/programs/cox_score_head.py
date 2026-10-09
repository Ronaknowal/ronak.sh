"""Full-risk, single-event Cox score loss and its score gradient.

No delayed entry, subject weights, strata or time-varying scores here.
Equal stop times share one complete risk denominator (Breslow ties).
Sort the fixed observation roster once; score evaluations use linear storage.
"""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class CoxRiskIndex:
    order: np.ndarray
    group: np.ndarray
    starts: np.ndarray
    deaths: np.ndarray
    event: np.ndarray


def prepare_risk_index(time, event):
    time, event = np.asarray(time, float), np.asarray(event)
    if (time.ndim != 1 or len(time) == 0 or event.shape != time.shape
            or not np.all(np.isfinite(time)) or np.any(time < 0)
            or not np.all((event == 0) | (event == 1))):
        raise ValueError("Use matching nonempty stop times and binary event indicators.")
    order = np.argsort(time, kind="stable")
    ordered_time, ordered_event = time[order], event[order].astype(float)
    starts = np.r_[0, np.flatnonzero(np.diff(ordered_time)) + 1]
    lengths = np.diff(np.r_[starts, len(time)])
    group = np.repeat(np.arange(len(starts)), lengths)
    deaths = np.bincount(group, weights=ordered_event, minlength=len(starts))
    return CoxRiskIndex(order, group, starts, deaths, ordered_event)


def cox_score_loss(scores, index, reduction="mean"):
    """Return negative partial log likelihood and d(loss)/d(original scores).

    Mean divides by observed event count, not subject count. Full suffixes
    include every eligible subject, including censoring at the event time.
    Common score shifts are removed before log-domain suffix/prefix scans.
    """
    scores = np.asarray(scores, float)
    if scores.shape != index.order.shape or not np.all(np.isfinite(scores)):
        raise ValueError("Supply one finite scalar score per indexed subject.")
    if reduction not in {"sum", "mean"}:
        raise ValueError("reduction must be sum or mean.")
    event_count = float(index.deaths.sum())
    if reduction == "mean" and event_count == 0:
        raise ValueError("Mean event loss needs at least one observed event.")
    ordered_scores = scores[index.order] - scores.max()
    # Each stop-time group begins before ALL subjects at that time.
    suffix = np.logaddexp.accumulate(ordered_scores[::-1])[::-1]
    log_risk = suffix[index.starts]
    loss = float(index.deaths @ log_risk - index.event @ ordered_scores)
    log_coefficient = np.full(len(index.starts), -np.inf)
    observed = index.deaths > 0
    log_coefficient[observed] = np.log(index.deaths[observed]) - log_risk[observed]
    # A subject receives contributions from all events at/before its stop.
    accumulated = np.logaddexp.accumulate(log_coefficient)
    ordered_gradient = np.exp(ordered_scores + accumulated[index.group]) - index.event
    gradient = np.empty_like(scores)
    gradient[index.order] = ordered_gradient
    divisor = event_count if reduction == "mean" else 1.0
    return loss / divisor, gradient / divisor


def attach_cox_head(score_tensor, index, tensor_class):
    """Connect the locally derived scalar head to the earlier teaching engine.

    The network returns (N,1). Its reused reverse pass receives the
    locally derived score gradient in that same shape.
    """
    if score_tensor.data.ndim != 2 or score_tensor.data.shape[1] != 1:
        raise ValueError("The Cox network must return one scalar per subject: (N,1).")
    value, local_gradient = cox_score_loss(score_tensor.data[:, 0], index)
    result = tensor_class.result(value, (score_tensor,), "cox_full_risk_mean")
    result.pullback = lambda: score_tensor.add_gradient(result.grad * local_gradient[:, None])
    return result
