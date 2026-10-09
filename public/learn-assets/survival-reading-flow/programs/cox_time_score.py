"""One untied unpenalized Cox time-interaction score calculation, without fitting.

The earlier positive covariance core supplies O(np**2 + ep**2) dense work.
Retaining its event traces and evaluating the efficient quadratic forms needs
O(ep**2) extra state/work. This is not a generic stratified/weighted/tied test.
"""

import numpy as np

from cox_diagnostics import untied_schoenfeld
from cox_risk_moments import cox_terms


def time_interaction_score(beta, data, *, feature=0, transform=lambda t: t):
    """Score for beta_feature(t) = beta_feature + theta*g(t), at theta=0.

    Supply the stationary unpenalized null coefficient. Other coefficients are
    nuisance parameters; the Schur complement adjusts information for them.
    A zero-information or singular case has no statistic, not a hidden ridge.
    """
    rows = untied_schoenfeld(beta, data)
    p = data.features.shape[1]
    if not isinstance(feature, int) or not 0 <= feature < p:
        raise ValueError("Feature must be a valid integer column.")
    terms = cox_terms(beta, data, trace=True)
    if np.linalg.norm(terms.score, ord=np.inf) > 1e-7:
        raise ValueError("Supply a stationary unpenalized null-model coefficient.")
    if len(rows.times) == 0:
        return {"status": "no-events", "statistic": None}
    g = np.asarray(transform(rows.times.copy()), dtype=float)
    if g.shape != rows.times.shape or not np.isfinite(g).all():
        raise ValueError("Transform must return one finite value per event time.")
    g = g - g.mean()
    variances = np.array([step.covariance for step in reversed(terms.steps)])
    cross = np.sum(g[:, None] * variances[:, :, feature], axis=0)
    time_information = float(np.sum(g**2 * variances[:, feature, feature]))
    score = float(g @ rows.residuals[:, feature])
    try:
        adjustment = np.linalg.solve(terms.information, cross)
    except np.linalg.LinAlgError:
        return {"status": "singular-null-information", "statistic": None}
    # This equals the Schur complement, without subtracting two large totals.
    unit = np.eye(p)[feature]
    directions = g[:, None] * unit - adjustment[None, :]
    effective = float(np.einsum("ei,eij,ej->", directions, variances, directions))
    tolerance = 64 * np.finfo(float).eps * max(time_information, float(cross @ adjustment))
    if effective < -tolerance:
        raise FloatingPointError("Efficient information is materially negative.")
    if effective <= tolerance:
        return {"status": "no-time-information", "statistic": None}
    return {"status": "defined", "score": score, "efficient_information": effective,
            "statistic": score**2 / effective, "degrees_of_freedom": 1}
