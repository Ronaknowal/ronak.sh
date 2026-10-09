"""Known-law comparisons and residuals at the section-8 fitted coefficient."""

import json

import numpy as np

from cox_risk_moments import prepare_cox
from cox_diagnostics import untied_schoenfeld
from cox_time_score import time_interaction_score
from survival_population import changed_rate_curve, mixture_exponentials


def main():
    crossing = changed_rate_curve([0, 4, 6, 8], 4)
    print(json.dumps({key: value.tolist() if isinstance(value, np.ndarray) else value
                      for key, value in crossing.items()}, sort_keys=True))
    # Coefficient from the untied example in section 8.
    beta = np.array([-0.43257419544250714])
    data = prepare_cox([1, 2, 2.5, 3, 4, 5],
                       [True, True, True, False, True, False],
                       [[-1], [0], [1], [-1], [0], [1]])
    residuals = untied_schoenfeld(beta, data)
    print(json.dumps({"event_times": residuals.times.tolist(),
                      "observed_features": residuals.observed_features[:, 0].tolist(),
                      "weighted_means": residuals.weighted_means[:, 0].tolist(),
                      "residuals": residuals.residuals[:, 0].tolist(),
                      "residual_sum": float(residuals.residuals.sum()),
                      "identity_time_score": time_interaction_score(beta, data)}, sort_keys=True))
    reference = mixture_exponentials([0, 5, 20], [.1, .4], [.5, .5])
    comparison = mixture_exponentials([0, 5, 20], [.1, .4], [.5, .5], multiplier=.5)
    print(json.dumps({"times": [0, 5, 20],
                      "reference_weights": reference.survivor_weights.tolist(),
                      "comparison_weights": comparison.survivor_weights.tolist(),
                      "reference_hazard": reference.hazard.tolist(),
                      "comparison_hazard": comparison.hazard.tolist(),
                      "marginal_hazard_ratio": (comparison.hazard / reference.hazard).tolist()}, sort_keys=True))


if __name__ == "__main__":
    main()
