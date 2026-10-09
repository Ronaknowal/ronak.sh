"""Ordinary right-censor routes on the declared eight-pump calculation.

Requires lifelines 0.30.3 and scikit-survival 0.28.0 for the recorded comparison.
This is a deterministic estimator example, not a fitted predictive experiment.
"""

import numpy as np
from lifelines import KaplanMeierFitter
from lifelines.utils import restricted_mean_survival_time
from sksurv.nonparametric import kaplan_meier_estimator


def main():
    times = np.array([2, 3, 4, 4, 6, 7, 8, 9], dtype=float)
    events = np.array([True, False, True, False, True, False, True, False])
    horizon, alpha = 9.0, 0.05
    # The lesson refuses unsupported horizons even when a tool extends a step.
    if not 0 <= horizon <= times.max():
        raise ValueError("Choose a horizon within recorded follow-up.")
    estimate = KaplanMeierFitter(alpha=alpha).fit(times, event_observed=events)
    print("lifelines S(4), S(5):", estimate.predict(4), estimate.predict(5))
    print("lifelines pointwise95 at4:", estimate.confidence_interval_.loc[4].to_list())
    print("lifelines median:", estimate.median_survival_time_)
    print("lifelines supported RMST9:", restricted_mean_survival_time(estimate, t=horizon))
    step_times, probabilities, interval = kaplan_meier_estimator(events, times, conf_level=1 - alpha, conf_type="log-log")
    at_four = np.flatnonzero(step_times == 4)[0]
    print("scikit-survival at4:", probabilities[at_four], interval[:, at_four].tolist())
    print("scikit-survival steps:", list(zip(step_times.tolist(), probabilities.tolist())))


if __name__ == "__main__":
    main()
