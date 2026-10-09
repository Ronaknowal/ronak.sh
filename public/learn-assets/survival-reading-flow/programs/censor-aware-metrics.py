"""Complete fixed evaluation inputs and scratch/ordinary-library routes.

No predictive model is fitted; the forecasts are declared exponential laws.
The training censoring estimate is a separate grouped observation calculation.
"""

import json

import numpy as np
from lifelines.utils import concordance_index
from sksurv.metrics import (brier_score, concordance_index_censored,
                           concordance_index_ipcw, cumulative_dynamic_auc,
                           integrated_brier_score)
from sksurv.util import Surv

from survival_censoring import estimate_censoring
from survival_concordance import concordance, ipcw_concordance
from survival_probability_metrics import (brier_grid, event_mass_auc_summary,
                                          horizon_auc, integrated_brier)
from survival_estimators import kaplan_meier


def main():
    test_times = np.array([1., 2., 2., 4.])
    test_events = np.array([True, False, True, True])
    risks = np.array([3., 2., 2., 0.])
    train_times = np.array([1., 1.5, 3., 4., 5.])
    train_events = np.array([True, False, True, False, True])
    train = Surv.from_arrays(train_events, train_times)
    test = Surv.from_arrays(test_events, test_times)
    censor = estimate_censoring(train_times, train_events)
    print(json.dumps({"training_censor_times": censor.times.tolist(),
                      "training_censor_probabilities": censor.probabilities.tolist(),
                      "scratch_concordance": concordance(test_times, test_events, risks),
                      "ordinary_concordance": [float(x) for x in concordance_index_censored(test_events, test_times, risks)],
                      "ordinary_lifelines_negated_risk": float(concordance_index(test_times, -risks, test_events)),
                      "scratch_uno_tau4": ipcw_concordance(test_times, test_events, risks, censor, tau=4.),
                      "ordinary_uno_tau4": [float(x) for x in concordance_index_ipcw(train, test, risks, tau=4.)]}, sort_keys=True))
    horizons = np.array([1.5, 2.5, 3.5])
    # Each row is one declared survival law evaluated at every named horizon.
    forecasts = np.exp(-np.array([.3, .2, .2, .1])[:, None]*horizons)
    scratch_brier = brier_grid(test_times, test_events, forecasts, horizons, censor)
    _, ordinary_brier = brier_score(train, test, forecasts, horizons)
    print(json.dumps({"horizons": horizons.tolist(), "survival_forecasts": forecasts.tolist(),
                      "scratch_brier": scratch_brier.tolist(), "ordinary_brier": ordinary_brier.tolist(),
                      "scratch_ibs": integrated_brier(horizons, scratch_brier),
                      "ordinary_ibs": float(integrated_brier_score(train, test, forecasts, horizons))}, sort_keys=True))
    changed_scores = np.array([3., 2., 2., 2.5])
    scratch_auc = [horizon_auc(test_times, test_events, changed_scores, h, censor) for h in horizons]
    ordinary_auc, ordinary_mean = cumulative_dynamic_auc(train, test, changed_scores, horizons)
    km = kaplan_meier(test_times.tolist(), test_events.tolist())
    survival_grid = np.array([km.value(float(h)) for h in horizons])
    print(json.dumps({"changed_auc_scores": changed_scores.tolist(), "scratch_auc": scratch_auc,
                      "ordinary_auc": ordinary_auc.tolist(), "survival_at_grid": survival_grid.tolist(),
                      "scratch_event_mass_mean_auc": event_mass_auc_summary([a["value"] for a in scratch_auc], survival_grid),
                      "ordinary_event_mass_mean_auc": float(ordinary_mean)}, sort_keys=True))


if __name__ == "__main__":
    main()
