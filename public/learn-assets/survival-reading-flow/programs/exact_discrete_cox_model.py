"""Sum exact discrete tied terms over prepared static first-event records.

Each event group conditions on that group's observed failure count. This is
an objective/derivative evaluator, not a coefficient fitter or absolute curve.
It deliberately rebuilds the subset DP for each event group. Dense work is
O(sum_j(r_j*d_j*p**2)); peak extra state is O(max_j(r_j*p + d_j*p**2)).
The input prepared table itself retains O(n*p) data. A small scalar DP cost
for one group is not the cost of fitting an entire model.
"""

from dataclasses import dataclass
from math import fsum

import numpy as np

from cox_risk_moments import CoxData
from discrete_cox_ties import discrete_tied_terms


@dataclass(frozen=True)
class ExactDiscreteCoxTerms:
    log_likelihood: float
    score: np.ndarray
    information: np.ndarray


def exact_discrete_cox_terms(beta, data):
    """Use every complete risk set; no hidden continuous tie approximation."""
    if not isinstance(data, CoxData):
        raise TypeError("Use data returned by prepare_cox.")
    raw = np.asarray(beta)
    if raw.dtype.kind not in "iuf":
        raise TypeError("Coefficients must be real numeric values.")
    coefficient = np.array(raw, dtype=float, copy=True)
    p = data.features.shape[1]
    if coefficient.shape != (p,) or not np.isfinite(coefficient).all():
        raise ValueError("Require one finite coefficient per feature.")
    parts = []
    score = np.zeros(p)
    information = np.zeros((p, p))
    for start, end in data.groups:
        if not data.events[start:end].any():
            continue
        # Descending times make this prefix the entire current risk set.
        deaths = np.zeros(end, dtype=bool)
        deaths[start:end] = data.events[start:end]
        terms = discrete_tied_terms(coefficient, data.features[:end], deaths)
        parts.append(terms.log_likelihood)
        score += terms.score
        information += terms.information
    if not np.isfinite(score).all() or not np.isfinite(information).all():
        raise FloatingPointError("Accumulated derivatives exceed the numeric range.")
    score.setflags(write=False)
    information.setflags(write=False)
    return ExactDiscreteCoxTerms(fsum(parts), score, information)
