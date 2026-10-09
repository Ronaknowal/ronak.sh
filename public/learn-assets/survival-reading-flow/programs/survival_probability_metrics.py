"""Supported horizon probability error, threshold AUC and declared grid summaries.

Brier uses O(nq) score work and O(n+q) extra state beyond its n×q forecasts;
the supplied observation-probability object's query cost is additional.
One horizon ROC sorts O(n log n) with O(n) state; q calls cost O(q n log n).
Unknown rows have zero contributions, not invented binary outcomes.
"""

import numpy as np

from survival_metric_inputs import observations, positive_observation_probability, tolerance, vector


def brier_grid(times, events, survival_probabilities, horizons, censor_survival):
    t, d = observations(times, events)
    h = np.asarray(horizons, dtype=float)
    s = np.asarray(survival_probabilities, dtype=float)
    if h.ndim != 1 or not len(h) or not np.isfinite(h).all() or (h < 0).any() or (np.diff(h) <= 0).any():
        raise ValueError("Horizons must be finite, nonnegative and strictly increasing.")
    if s.shape != (len(t), len(h)) or not np.isfinite(s).all() or (s < 0).any() or (s > 1).any():
        raise ValueError("Supply an n×q matrix of survival probabilities in [0,1].")
    if (np.diff(s, axis=1) > 1e-12).any():
        raise ValueError("Each supplied survival curve must be nonincreasing.")
    result = np.empty(len(h))
    contributing_events = d & (t <= h[-1])
    g_events = np.ones(len(t))
    g_events[contributing_events] = positive_observation_probability(censor_survival, t[contributing_events])
    # Query each eligible event and horizon once, outside the horizon loop.
    g_horizons = positive_observation_probability(censor_survival, h)
    for column, horizon in enumerate(h):
        cases = d & (t <= horizon)
        controls = t > horizon
        g_cases = g_events[cases]
        # Horizon support is required even when the realized control count is zero.
        g_horizon = float(g_horizons[column])
        loss = np.zeros(len(t))
        with np.errstate(over="ignore", divide="ignore"):
            loss[cases] = s[cases, column]**2/g_cases
            loss[controls] = (1-s[controls, column])**2/g_horizon
        if not np.isfinite(loss).all():
            raise FloatingPointError("Inverse-weighted losses exceed the numeric range.")
        result[column] = float(loss.mean())
    return result


def integrated_brier(horizons, brier_values):
    h = np.asarray(horizons, dtype=float)
    b = np.asarray(brier_values, dtype=float)
    if h.ndim != 1 or len(h) < 2 or b.shape != h.shape or not np.isfinite(h).all() or (h < 0).any() or (np.diff(h) <= 0).any():
        raise ValueError("Supply at least two strictly increasing supported grid nodes.")
    if not np.isfinite(b).all() or (b < 0).any():
        raise ValueError("Supply finite nonnegative Brier values.")
    # Mean over precisely [first node,last node], not an implicit [0,last node].
    return float(np.trapezoid(b, h)/(h[-1]-h[0]))


def conditional_brier_grid(times, events, survival_probabilities, horizons, g_at_events, g_at_horizons):
    """Explicit conditional-G inputs, not a marginal curve masquerading as one.

    g_at_events[i] is G(Yi | Xi); g_at_horizons[i,j] is G(hj | Xi).
    The separately estimated censor model must supply supported out-of-fold
    or training-only probabilities for the declared evaluation population.
    This evaluator does not estimate that model or justify its assumptions.
    """
    t, d = observations(times, events)
    h = np.asarray(horizons, dtype=float)
    s = np.asarray(survival_probabilities, dtype=float)
    ge = vector(g_at_events, len(t), "Event observation probabilities")
    gh = np.asarray(g_at_horizons, dtype=float)
    if h.ndim != 1 or not len(h) or not np.isfinite(h).all() or (h < 0).any() or (np.diff(h) <= 0).any():
        raise ValueError("Supply a finite nonnegative strictly increasing horizon grid.")
    if s.shape != (len(t), len(h)) or gh.shape != s.shape or not np.isfinite(s).all() or (s < 0).any() or (s > 1).any():
        raise ValueError("Supply matching n×q forecast and conditional-G matrices.")
    if not np.isfinite(gh).all() or (gh <= 0).any() or (gh > 1).any() or (ge < 0).any() or (ge > 1).any():
        raise ValueError("Conditional horizon support must be positive for every subject.")
    if (np.diff(s, axis=1) > 1e-12).any() or (np.diff(gh, axis=1) > 1e-12).any():
        raise ValueError("Fixed-profile survival and censor-survival curves must not increase.")
    if (ge[d & (t <= h[-1])] <= 0).any():
        raise ValueError("Every contributing event requires positive conditional support.")
    result = np.empty(len(h))
    for column, horizon in enumerate(h):
        cases = d & (t <= horizon)
        controls = t > horizon
        loss = np.zeros(len(t))
        with np.errstate(over="ignore", divide="ignore"):
            loss[cases] = s[cases, column]**2/ge[cases]
            loss[controls] = (1-s[controls, column])**2/gh[controls, column]
        if not np.isfinite(loss).all():
            raise FloatingPointError("Conditional inverse losses exceed the numeric range.")
        result[column] = float(loss.mean())
    return result


def horizon_auc(times, events, scores, horizon, censor_survival, *, tied_tol=1e-8):
    """Weighted ROC with adjacent-score groups, matching the inspected tool route.

Adjacent near-ties join one threshold block, including unscored rows; this is
not the absolute pairwise tolerance used by the concordance function.
"""
    t, d = observations(times, events)
    s = vector(scores, len(t), "Scores")
    horizon = float(horizon)
    if not np.isfinite(horizon) or horizon < 0:
        raise ValueError("Horizon must be finite and nonnegative.")
    tol = tolerance(tied_tol)
    cases = d & (t <= horizon)
    controls = t > horizon
    positive_observation_probability(censor_survival, np.array([horizon]))
    weights = np.zeros(len(t))
    with np.errstate(over="ignore", divide="ignore"):
        weights[cases] = 1/positive_observation_probability(censor_survival, t[cases])
    case_mass = float(weights.sum())
    control_count = int(controls.sum())
    if not np.isfinite(weights).all() or not np.isfinite(case_mass):
        raise FloatingPointError("Case inverse weights exceed the numeric range.")
    if not case_mass or not control_count:
        return {"status": "missing-cases-or-controls", "value": None}
    order = np.argsort(-s, kind="stable")
    true_positive = false_positive = 0.
    tp, fp, thresholds = [0.], [0.], []
    start = 0
    while start < len(order):
        end = start + 1
        while end < len(order) and abs(float(s[order[end-1]])-float(s[order[end]])) <= tol:
            end += 1
        members = order[start:end]
        true_positive += float(weights[members].sum())
        false_positive += int(controls[members].sum())
        tp.append(true_positive/case_mass)
        fp.append(false_positive/control_count)
        thresholds.append(float(s[order[end-1]]))
        start = end
    return {"status": "defined", "value": float(np.trapezoid(tp, fp)),
            "true_positive_rates": tp, "false_positive_rates": fp,
            "thresholds": thresholds, "case_mass": case_mass, "controls": control_count}


def event_mass_auc_summary(auc_values, survival_at_horizons):
    """Tool-style summary: first weight includes all failure mass before first node."""
    a = np.asarray(auc_values, dtype=float)
    s = np.asarray(survival_at_horizons, dtype=float)
    if a.ndim != 1 or not len(a) or s.shape != a.shape or not np.isfinite(a).all() or (a < 0).any() or (a > 1).any():
        raise ValueError("Supply one finite AUC in [0,1] per grid node.")
    if not np.isfinite(s).all() or (s < 0).any() or (s > 1).any() or (np.diff(s) > 0).any():
        raise ValueError("Supply a nonincreasing survival sequence in [0,1].")
    if len(a) == 1:
        return float(a[0])
    weights = -np.diff(np.r_[1., s])
    mass = 1-s[-1]
    return float(a@weights/mass) if mass > 0 else None
