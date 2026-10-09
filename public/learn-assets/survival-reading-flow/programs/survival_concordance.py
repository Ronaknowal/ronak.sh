"""Exact declared comparable pairs in O(n log n) time and O(n) extra state.

Larger scores mean earlier failure risk. Equal-time event/censor pairs compare;
equal-time event/event pairs do not. Score ties use absolute pair tolerance.
The finite-support IPCW wrapper supplies squared weights and strict event tau.
"""

import numpy as np

from survival_metric_inputs import observations, positive_observation_probability, tolerance, vector


class FenwickCounts:
    """Count occupied score coordinates; prefix(end) excludes coordinate end."""

    def __init__(self, size):
        self.tree = [0] * (size + 1)

    def add(self, coordinate):
        index = coordinate + 1
        while index < len(self.tree):
            self.tree[index] += 1
            index += index & -index

    def prefix(self, end):
        result = 0
        while end:
            result += self.tree[end]
            end -= end & -end
        return result


def _tie_bounds(coordinates, score, tol):
    """Binary ranges, corrected at rounded floating-point threshold endpoints."""
    lower = int(np.searchsorted(coordinates, score-tol, side="left"))
    upper = int(np.searchsorted(coordinates, score+tol, side="right"))
    # The exact contract compares the rounded pair difference, not rounded s±tol.
    while lower and abs(float(coordinates[lower-1])-score) <= tol:
        lower -= 1
    while lower < len(coordinates) and float(coordinates[lower]) < score and abs(float(coordinates[lower])-score) > tol:
        lower += 1
    while upper < len(coordinates) and abs(float(coordinates[upper])-score) <= tol:
        upper += 1
    while upper and float(coordinates[upper-1]) > score and abs(float(coordinates[upper-1])-score) > tol:
        upper -= 1
    return lower, upper


def concordance(times, events, scores, *, event_weights=None, tied_tol=1e-8):
    t, d = observations(times, events)
    s = vector(scores, len(t), "Scores")
    tol = tolerance(tied_tol)
    w = np.ones(len(t)) if event_weights is None else vector(event_weights, len(t), "Event weights")
    if (w < 0).any():
        raise ValueError("Event weights must be nonnegative.")
    coordinates, ranks = np.unique(s, return_inverse=True)
    counts = FenwickCounts(len(coordinates))
    order = np.argsort(t, kind="stable")[::-1]
    numerator = denominator = 0.
    con = dis = risk_ties = time_ties = eligible = 0
    start = 0
    while start < len(order):
        end = start + 1
        while end < len(order) and t[order[end]] == t[order[start]]:
            end += 1
        group = order[start:end]
        censored = group[~d[group]]
        for index in censored:
            counts.add(int(ranks[index]))
            eligible += 1
        for index in group[d[group]]:
            lower, upper = _tie_bounds(coordinates, float(s[index]), tol)
            lower_count = counts.prefix(lower)
            tied_count = counts.prefix(upper)-lower_count
            higher_count = eligible-lower_count-tied_count
            numerator += float(w[index])*(lower_count+.5*tied_count)
            denominator += float(w[index])*eligible
            con += lower_count
            dis += higher_count
            risk_ties += tied_count
            time_ties += len(censored)
        # Same-time failures enter only after every event at this time is queried.
        for index in group[d[group]]:
            counts.add(int(ranks[index]))
            eligible += 1
        start = end
    if not np.isfinite(numerator) or not np.isfinite(denominator):
        raise FloatingPointError("Weighted totals exceed the supported numeric range.")
    return {"status": "defined" if denominator > 0 else "no-weighted-comparable-pairs",
            "value": numerator/denominator if denominator > 0 else None,
            "numerator": numerator, "denominator": denominator,
            "concordant": con, "discordant": dis, "risk_ties": risk_ties, "time_ties": time_ties}


def ipcw_concordance(times, events, scores, censor_survival, *, tau, tied_tol=1e-8):
    t, d = observations(times, events)
    tau = float(tau)
    if not np.isfinite(tau) or tau <= 0:
        raise ValueError("Supply a positive finite event truncation time tau.")
    selected = d & (t < tau)
    weights = np.zeros(len(t))
    g = positive_observation_probability(censor_survival, t[selected])
    with np.errstate(over="ignore", divide="ignore"):
        weights[selected] = (1/g)**2
    if not np.isfinite(weights).all():
        raise FloatingPointError("Squared inverse weights exceed the numeric range.")
    return concordance(t, d, scores, event_weights=weights, tied_tol=tied_tol)
