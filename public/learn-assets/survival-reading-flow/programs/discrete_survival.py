"""Whole-subject interval observations and stable logit/cloglog likelihoods.

Intervals are (edge[j], edge[j+1]]. Features are measured before time zero.
The recommended Newton step uses the diagonal interval block, not a dense
one-hot design. Positive ridge penalizes ALL interval and feature parameters.
This is a single-event, fixed-grid, independent-subject model, not a history,
partial-exposure, competing-event or cluster-inference implementation.
"""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class PeriodRows:
    subject: np.ndarray
    interval: np.ndarray
    event: np.ndarray
    n_subjects: int
    n_intervals: int


def expand_subjects(time, event, edges):
    """Keep complete no-event intervals and an observed event interval.

    A partial censor interval supplies no binary row. Events at an upper
    boundary belong to that interval; censoring there completes it. Reject
    stops outside the declared grid rather than silently extending support.
    Returned subject indices refer to the supplied cohort, so split first.
    """
    time = np.asarray(time, dtype=float)
    event = np.asarray(event)
    edges = np.asarray(edges, dtype=float)
    if (time.ndim != 1 or event.shape != time.shape
            or not np.all(np.isfinite(time)) or not np.all((event == 0) | (event == 1))
            or edges.ndim != 1 or len(edges) < 2 or edges[0] != 0
            or not np.all(np.isfinite(edges)) or not np.all(np.diff(edges) > 0)
            or np.any(time < 0) or np.any(time > edges[-1])
            or np.any((time == 0) & event.astype(bool))):
        raise ValueError("Use finite ordered positive intervals and valid stop/event records.")
    event = event.astype(bool)
    completed = np.searchsorted(edges[1:], time, side="right")
    event_interval = np.searchsorted(edges[1:], time, side="left")
    count = np.where(event, event_interval + 1, completed)
    stop = np.cumsum(count)
    subject = np.repeat(np.arange(len(time)), count)
    interval = np.arange(int(stop[-1]) if len(stop) else 0) - np.repeat(stop - count, count)
    outcome = np.zeros(len(subject), dtype=float)
    outcome[stop[event] - 1] = 1
    return PeriodRows(subject, interval, outcome, len(time), len(edges) - 1)


def row_terms(eta, event, link):
    """Return row NLL, dNLL/deta, d²NLL/deta², log(1-q), and q.

    Log-domain event losses remain finite when exp(eta) underflows. A
    no-event cloglog contribution whose exp(eta) overflows is refused.
    Rounded probabilities are NEVER passed back into the loss calculation.
    """
    eta, event = np.broadcast_arrays(np.asarray(eta, float), np.asarray(event, float))
    if not np.all(np.isfinite(eta)) or not np.all((event == 0) | (event == 1)):
        raise ValueError("Predictors must be finite and event indicators binary.")
    if link == "logit":
        q = np.exp(-np.logaddexp(0, -eta))
        complement = np.exp(-np.logaddexp(0, eta))
        loss = np.logaddexp(0, np.where(event == 1, -eta, eta))
        gradient = np.where(event == 1, -complement, q)
        return loss, gradient, q * complement, -np.logaddexp(0, eta), q
    if link != "cloglog":
        raise ValueError("link must be logit or cloglog.")
    with np.errstate(over="ignore", under="ignore"):
        a = np.exp(eta)
    if np.any(~np.isfinite(a) & (event == 0)):
        raise OverflowError("A no-event interval has an unrepresentable cumulative hazard.")
    q = -np.expm1(-a)
    event_loss = np.zeros_like(eta)
    ratio = np.zeros_like(eta)
    curvature = np.zeros_like(eta)
    small = a < 1e-4
    middle = (a >= 1e-4) & (a < 50)
    large_finite = (a >= 50) & np.isfinite(a)
    z = a[small]
    event_loss[small] = -eta[small] + z / 2 - z**2 / 24 + z**4 / 2880
    ratio[small] = 1 - z / 2 + z**2 / 12 - z**4 / 720
    curvature[small] = z / 2 - z**2 / 6 + z**4 / 180
    z = a[middle]
    event_loss[middle] = -np.log(-np.expm1(-z))
    ratio[middle] = z / np.expm1(z)
    curvature[middle] = ratio[middle] * (z + ratio[middle] - 1)
    z = a[large_finite]
    tail = np.exp(-z)
    event_loss[large_finite] = -np.log1p(-tail)
    ratio[large_finite] = z * tail / (-np.expm1(-z))
    # Form z*ratio before multiplication can overflow at a very large z.
    curvature[large_finite] = (z * tail) * z + ratio[large_finite] * (ratio[large_finite] - 1)
    return (np.where(event == 1, event_loss, a),
            np.where(event == 1, -ratio, a),
            np.where(event == 1, curvature, a), -a, q)


def objective_parts(rows, features, parameters, link, ridge=0.0):
    """Sum NLL + ridge/2 * ||parameters||² and its structured derivatives."""
    features = np.asarray(features, float)
    parameters = np.asarray(parameters, float)
    k = rows.n_intervals
    if (features.ndim != 2 or features.shape[0] != rows.n_subjects
            or not np.all(np.isfinite(features))
            or parameters.shape != (k + features.shape[1],)
            or not np.all(np.isfinite(parameters)) or not np.isfinite(ridge) or ridge < 0):
        raise ValueError("Match cohort features, interval/feature parameters and nonnegative ridge.")
    x = features[rows.subject]
    eta = parameters[rows.interval] + x @ parameters[k:]
    loss, derivative, weight, _, _ = row_terms(eta, rows.event, link)
    gradient = np.r_[np.bincount(rows.interval, weights=derivative, minlength=k),
                     x.T @ derivative] + ridge * parameters
    diagonal = np.bincount(rows.interval, weights=weight, minlength=k) + ridge
    cross = np.zeros((k, x.shape[1]))
    np.add.at(cross, rows.interval, weight[:, None] * x)
    feature_block = x.T @ (weight[:, None] * x) + ridge * np.eye(x.shape[1])
    value = float(np.sum(loss) + ridge * (parameters @ parameters) / 2)
    if not np.isfinite(value) or not np.all(np.isfinite(gradient)):
        raise OverflowError("Rescale the design or shorten the proposed Newton step.")
    return value, gradient, diagonal, cross, feature_block


def newton_direction(gradient, diagonal, cross, feature_block):
    """Solve the arrowhead system by eliminating the diagonal interval block."""
    k = len(diagonal)
    if np.any(diagonal <= 0):
        raise ValueError("An unpenalized empty/saturated interval has no invertible block.")
    scaled_cross = cross / diagonal[:, None]
    schur = feature_block - cross.T @ scaled_cross
    rhs = gradient[k:] - cross.T @ (gradient[:k] / diagonal)
    feature_step = np.linalg.solve(schur, rhs) if len(rhs) else rhs.copy()
    interval_step = (gradient[:k] - cross @ feature_step) / diagonal
    return np.r_[interval_step, feature_step]


def fit_intervals(rows, features, link, ridge=0.5, tolerance=1e-8, max_iterations=100):
    """Penalized convex fit; report convergence, never promise unseen support.

    A positive ridge regularizes interval AND feature parameters. Empty
    training bins are rejected even though the penalty could assign a value.
    """
    features = np.asarray(features, float)
    if (not np.isfinite(ridge) or ridge <= 0 or not np.isfinite(tolerance)
            or tolerance <= 0 or not isinstance(max_iterations, int) or max_iterations < 1):
        raise ValueError("Use positive ridge/tolerance and at least one iteration.")
    if np.any(np.bincount(rows.interval, minlength=rows.n_intervals) == 0):
        raise ValueError("Every fitted interval needs observed training rows.")
    parameters = np.zeros(rows.n_intervals + features.shape[1])
    row_features = features[rows.subject]
    history = []
    for iteration in range(max_iterations + 1):
        value, gradient, diagonal, cross, block = objective_parts(rows, features, parameters, link, ridge)
        history.append(value)
        if np.max(np.abs(gradient)) <= tolerance:
            return {"parameters": parameters, "converged": True,
                    "iterations": iteration, "objective": value, "history": np.array(history)}
        if iteration == max_iterations:
            break
        direction = newton_direction(gradient, diagonal, cross, block)
        decrement = gradient @ direction
        step = 1.0
        for _ in range(40):
            trial = parameters - step * direction
            try:
                trial_eta = trial[rows.interval] + row_features @ trial[rows.n_intervals:]
                trial_loss = row_terms(trial_eta, rows.event, link)[0]
                trial_value = float(np.sum(trial_loss) + ridge * (trial @ trial) / 2)
            except OverflowError:
                trial_value = np.inf
            if trial_value <= value - 1e-4 * step * decrement:
                parameters = trial
                break
            step *= 0.5
        else:
            raise ArithmeticError("Backtracking failed; inspect scaling and conditioning.")
    return {"parameters": parameters, "converged": False,
            "iterations": max_iterations, "objective": value, "history": np.array(history)}


def survival_from_predictors(eta, link):
    """One declared interval grid per last axis; return log survival and S."""
    _, _, _, log_complement, _ = row_terms(eta, np.ones_like(eta), link)
    log_survival = np.cumsum(log_complement, axis=-1)
    return log_survival, np.exp(log_survival)
