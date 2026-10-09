"""One uncapped Newton proposal on the six-row untied Cox witness.

This is a manual objective-checked trial trace.
The normal fitter caps its direction first; this example deliberately does not,
so that the objective's rejection and halving rule can be seen directly.
"""

import json

import numpy as np

from cox_risk_moments import cox_terms, prepare_cox


def main():
    data = prepare_cox(
        [1, 2, 2.5, 3, 4, 5],
        [True, True, True, False, True, False],
        [[-1], [0], [1], [-1], [0], [1]],
    )
    beta = np.array([3.0])
    terms = cox_terms(beta, data)
    objective = -terms.log_likelihood
    direction = np.linalg.solve(terms.information, terms.score)
    slope = float((-terms.score) @ direction)
    fraction = 1.0
    trials = []
    for _ in range(40):
        candidate = beta + fraction * direction
        candidate_objective = -cox_terms(candidate, data).log_likelihood
        allowed = objective + 1e-4 * fraction * slope
        accepted = candidate_objective <= allowed
        trials.append(
            {
                "fraction": fraction,
                "candidate_beta": float(candidate[0]),
                "candidate_objective": candidate_objective,
                "allowed_objective": allowed,
                "accepted": accepted,
            }
        )
        if accepted:
            break
        fraction /= 2
    else:
        raise RuntimeError("The declared manual trace exhausted its trial budget.")
    print(
        json.dumps(
            {
                "initial_beta": float(beta[0]),
                "initial_objective": objective,
                "score": float(terms.score[0]),
                "information": float(terms.information[0, 0]),
                "uncapped_direction": float(direction[0]),
                "trials": trials,
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
