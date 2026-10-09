"""Bounded observation/count and transition arithmetic, without fitting.

Entry KM uses one independent first-event row per subject. Landmark selection
uses the endpoint convention declared here. Transition arithmetic consumes
supplied row-stochastic matrices; it does not estimate a recurrent-event model.
"""

from bisect import bisect_left
from math import isfinite
import numpy as np


def entry_kaplan_meier(entry, exit_time, event):
    """L<t<=Y: sort once, count strictly earlier starts/removals, then product.

    O(n log n + g log n) time, O(n+g) retained state. No confidence intervals.
    Event/censor ties share their pre-event roster. No absolute level before
    unobserved early support is identified merely by initializing the product.
    """
    a, b = (np.asarray(v, dtype=float) for v in (entry, exit_time))
    d = np.asarray(event)
    if a.ndim != 1 or not len(a) or b.shape != a.shape or d.shape != a.shape or d.dtype.kind != 'b':
        raise ValueError('Require nonempty matching bounds and Boolean events.')
    if not np.isfinite(a).all() or not np.isfinite(b).all() or (a < 0).any() or (b <= a).any():
        raise ValueError('Require finite nonnegative entry < exit.')
    starts, stops = sorted(a), sorted(b)
    times, count = np.unique(b[d], return_counts=True)
    survival, result = 1., []
    for t, deaths in zip(times, count):
        risk = bisect_left(starts, t) - bisect_left(stops, t)
        if not 0 < deaths <= risk:
            raise ValueError('Failure group exceeds its declared active roster.')
        survival *= 1. - deaths / risk
        result.append((float(t), int(risk), int(deaths), float(survival)))
    return tuple(result)


def landmark_rows(ids, time, event, maintenance_time, landmark):
    """Known event-free THROUGH L, including an exact-L censor under T>C.

    Features are maintenance known by L; rows with earlier censoring leave the
    target population. Subsequent modeling must retain conditional observation
    assumptions. This selection/count routine fits no maintenance coefficient.
    """
    ids = tuple(ids)
    t, m = (np.asarray(v, dtype=float) for v in (time, maintenance_time))
    d = np.asarray(event)
    landmark = float(landmark)
    if t.shape != (len(ids),) or m.shape != t.shape or d.shape != t.shape or d.dtype.kind != 'b':
        raise ValueError('Match IDs, endpoints, Boolean events and maintenance clocks.')
    if not len(ids) or not isfinite(landmark) or landmark < 0 or not np.isfinite(t).all() or (t < 0).any() or np.isnan(m).any() or (m < 0).any():
        raise ValueError('Use finite endpoints, nonnegative landmark and known maintenance/inf.')
    known_survivor = (t > landmark) | ((t == landmark) & ~d)
    return tuple({'id': ids[i], 'remaining_observed': float(t[i] - landmark),
                  'event': bool(d[i]), 'maintained_by_landmark': bool(m[i] <= landmark)}
                 for i in np.flatnonzero(known_survivor))


def transition_from_counts(risk, transitions):
    """I+Delta A from state-specific pre-transition risk counts and off-diagonal d.

    Zero-risk rows may have no departures and retain an identity row; they
    contain no evidence for that state's future rate. Dense O(k²) arithmetic.
    """
    risk = np.asarray(risk, dtype=float)
    count = np.asarray(transitions, dtype=float)
    k = len(risk)
    if not k or risk.shape != (k,) or count.shape != (k, k) or not np.isfinite(risk).all() or not np.isfinite(count).all():
        raise ValueError('Use a finite risk vector and square transition-count matrix.')
    if (risk < 0).any() or (count < 0).any() or (risk != np.floor(risk)).any() or (count != np.floor(count)).any() or np.diag(count).any():
        raise ValueError('Counts must be nonnegative integers; diagonal counts are zero.')
    departures = count.sum(axis=1)
    if (departures > risk).any():
        raise ValueError('Each subject can depart its starting state once per endpoint.')
    matrix = np.eye(k)
    for i in range(k):
        if risk[i]:
            matrix[i] += count[i] / risk[i]
            matrix[i, i] -= departures[i] / risk[i]
    return matrix


def advance_occupancy(probability, transition):
    """Explicit scratch row-vector multiplication, compared separately with NumPy.

    Probability has one entry per state; rows describe FROM and columns TO.
    O(k²) work, O(k) returned state. No clipping/renormalizing invalid inputs.
    """
    p, matrix = np.asarray(probability, dtype=float), np.asarray(transition, dtype=float)
    if p.ndim != 1 or not len(p) or matrix.shape != (len(p), len(p)):
        raise ValueError('Match a probability row to a square state matrix.')
    if not np.isfinite(p).all() or not np.isfinite(matrix).all() or (p < 0).any() or (matrix < 0).any():
        raise ValueError('Probabilities and transition entries must be finite/nonnegative.')
    if abs(float(p.sum()) - 1.) > 1e-12 or not np.allclose(matrix.sum(axis=1), 1., atol=1e-12, rtol=0):
        raise ValueError('Probability and every transition row must sum to one.')
    return np.array([sum(float(p[i] * matrix[i, j]) for i in range(len(p))) for j in range(len(p))])
