"""Recover a baseline for supplied beta; this program fits no coefficient."""

from math import log

import numpy as np

from cox_baseline import estimate_cox_baseline, predict_cox_survival
from cox_risk_moments import prepare_cox


def main():
    times = np.array([1, 2, 2, 3, 4, 5], dtype=float)
    events = np.array([True, True, True, False, True, False])
    features = np.array([[-1], [0], [1], [-1], [0], [1]], dtype=float)
    data = prepare_cox(times, events, features)
    coefficient = np.array([log(2)])
    baseline = estimate_cox_baseline(coefficient, data, feature_names=("x",),
                                    reference=np.array([0.0]), ties="breslow")
    prediction = predict_cox_survival(baseline, np.array([[-1], [0], [1]]), [4],
                                      feature_names=("x",))
    print("supplied beta: log(2); reference x=0; baseline: Breslow")
    print("failure times:", baseline.event_times.tolist())
    print("reference increments:", np.round(np.exp(baseline.log_increments), 12).tolist())
    print(f"reference cumulative hazard at4: {np.exp(baseline.log_cumulative_hazard[-1]):.12f}")
    print("S(4), profiles x=-1,0,1:", np.round(prediction.survival[:, 0], 12).tolist())
    alternative = estimate_cox_baseline(coefficient, data, feature_names=("x",),
                                       reference=np.array([1.0]), ties="breslow")
    same_profiles = predict_cox_survival(alternative, np.array([[-1], [0], [1]]), [4],
                                        feature_names=("x",))
    print(f"reference x=1 cumulative hazard at4: {np.exp(alternative.log_cumulative_hazard[-1]):.12f}")
    print("same physical profiles after reference change:",
          np.round(same_profiles.survival[:, 0], 12).tolist())
    corrected = estimate_cox_baseline(coefficient, data, feature_names=("x",),
                                     reference=np.array([0.0]), ties="efron")
    print(f"Efron baseline day2 increment: {np.exp(corrected.log_increments[1]):.12f}")


if __name__ == "__main__":
    main()
