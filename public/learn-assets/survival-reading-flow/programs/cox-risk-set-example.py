"""Declared six-row Cox hand trace and separate tiny untied fitted witness."""

import json
from math import log

import numpy as np
from sksurv.linear_model import CoxPHSurvivalAnalysis
from sksurv.util import Surv

from cox_risk_moments import cox_terms, prepare_cox
from cox_regression import fit_cox


def main():
    # The original A-F fixture: B/C really share day 2.
    time = np.array([1, 2, 2, 3, 4, 5], dtype=float)
    event = np.array([True, True, True, False, True, False])
    x = np.array([-1, 0, 1, -1, 0, 1], dtype=float)[:, None]
    prepared = prepare_cox(time, event, x)
    beta = np.array([log(2)])
    first = next(step for step in cox_terms(beta, prepared, trace=True).steps if step.time == 1)
    # The core stores the common origin separately; report ORIGINAL coordinates.
    mean = float(first.mean[0] + prepared.feature_origin[0])
    first_event = {
        "coefficient": float(beta[0]),
        "weights": [0.5, 1.0, 2.0, 0.5, 1.0, 2.0],
        "total_weight": 7.0,
        "probability_A": 1 / 14,
        "weighted_feature_mean": mean,
        "score": -1 - mean,
        "information": float(first.covariance[0, 0]),
    }
    print(json.dumps({"original_first_event": first_event}, sort_keys=True))
    # For the optimizer example, change C's day 2 to day 2.5 so the four
    # failure endpoints are distinct; all other observations stay fixed.
    untied_time = np.array([1, 2, 2.5, 3, 4, 5], dtype=float)
    untied = prepare_cox(untied_time, event, x)
    fit = fit_cox(untied, initial=[3.0])
    ordinary = CoxPHSurvivalAnalysis(ties="efron", n_iter=100, tol=1e-12).fit(
        x, Surv.from_arrays(event, untied_time)
    )
    print(
        json.dumps(
            {
                "new_untied_witness": {
                    "time": untied_time.tolist(),
                    "scratch_beta": fit.beta.tolist(),
                    "status": fit.status,
                    "negative_log_likelihood": fit.objective,
                    "score_norm": fit.score_norm,
                    "ordinary_beta": ordinary.coef_.tolist(),
                    "trace": [
                        {
                            "iteration": step.iteration,
                            "beta": step.beta,
                            "objective": step.objective,
                            "score_norm": step.score_norm,
                            "direction": step.direction,
                            "accepted_fraction": step.accepted_fraction,
                            "rejected_trials": step.rejected_trials,
                        }
                        for step in fit.iterations
                    ],
                }
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
