"""Static positive-time Weibull AFT likelihood and analytic parameter derivatives.

Parameters are p log-time-scale coefficients followed by one log shape.
The design explicitly includes an intercept if wanted. No fitting occurs on
import. Density/tail contributions follow the locally taught observation law.
One dense information evaluation costs O(np²), with O(np+p²) working storage.
This is not a delayed-entry, interval-censor or varying-shape regression engine.
"""

import numpy as np

from survival_metric_inputs import observations, vector


def weibull_aft_terms(times, events, design, parameters):
    t, d = observations(times, events)
    x = np.asarray(design, dtype=float)
    if (t <= 0).any() or x.ndim != 2 or x.shape[0] != len(t) or not x.shape[1] or not np.isfinite(x).all():
        raise ValueError("Supply positive times and a finite n×p design.")
    theta = vector(parameters, x.shape[1]+1, "Scale coefficients and log shape")
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        shape = float(np.exp(theta[-1]))
        eta = x@theta[:-1]
        log_time = np.log(t)
        log_cumulative = shape*(log_time-eta)
        cumulative = np.exp(log_cumulative)
        log_density = theta[-1]-log_time+log_cumulative-cumulative
        contributions = np.where(d, log_density, -cumulative)
        scale_score = shape*x.T@(cumulative-d)
        shape_score = np.sum(d+log_cumulative*(d-cumulative))
        # Positive weighted outer products avoid subtracting raw second moments.
        scale_information = shape**2*x.T@(cumulative[:, None]*x)
        cross_information = -shape*x.T@(cumulative-d+log_cumulative*cumulative)
        shape_information = np.sum(log_cumulative**2*cumulative-log_cumulative*(d-cumulative))
    if not np.isfinite(shape) or shape <= 0 or not np.isfinite(log_cumulative).all() or not np.isfinite(cumulative).all() or (cumulative <= 0).any():
        raise FloatingPointError("AFT state exceeds the supported float range.")
    score = np.r_[scale_score, shape_score]
    information = np.empty((len(theta), len(theta)))
    information[:-1, :-1] = scale_information
    information[:-1, -1] = information[-1, :-1] = cross_information
    information[-1, -1] = shape_information
    total = float(contributions.sum())
    if not np.isfinite(total) or not np.isfinite(contributions).all() or not np.isfinite(score).all() or not np.isfinite(information).all():
        raise FloatingPointError("AFT likelihood derivatives exceed the float range.")
    return {"log_likelihood": total, "contributions": contributions,
            "score": score, "information": information,
            "log_cumulative_hazard": log_cumulative, "cumulative_hazard": cumulative}


def weibull_failure_quantile(probability, log_scale, shape):
    """Interior failure-CDF quantile, including a log result before exponentiation.

    Endpoints return 0 and infinity as model endpoints, not observed lifetimes.
    `probability` means P(T≤q), unlike lifelines' survival-percentile p.
    """
    p, eta, k = float(probability), float(log_scale), float(shape)
    if not np.isfinite([p, eta, k]).all() or not 0 <= p <= 1 or k <= 0:
        raise ValueError("Require probability in [0,1], finite log scale and positive shape.")
    if p == 0:
        return {"value": 0., "log_value": -np.inf}
    if p == 1:
        return {"value": np.inf, "log_value": np.inf}
    log_value = eta+float(np.log(-np.log1p(-p)))/k
    with np.errstate(over="ignore", under="ignore"):
        value = float(np.exp(log_value))
    if not np.isfinite(value) or value == 0:
        raise FloatingPointError("Interior quantile exceeds the supported float range.")
    return {"value": value, "log_value": log_value}
