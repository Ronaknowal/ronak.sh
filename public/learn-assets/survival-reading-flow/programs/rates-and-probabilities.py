"""Supplied-law and grouped-estimator worked examples.

The ordinary comparisons use SciPy 1.18.1, lifelines 0.30.3 and
scikit-survival 0.28.0.
"""

import json
from math import exp

import numpy as np
from scipy.stats import expon, weibull_min
from lifelines import NelsonAalenFitter
from sksurv.nonparametric import nelson_aalen_estimator

from survival_estimators import kaplan_meier
from survival_rates import (
    constant_rate_window,
    conditional_weibull,
    weibull_rate,
    nelson_aalen,
)


def main():
    model = constant_rate_window(0.2, 3)
    scipy_log = float(expon(scale=1 / 0.2).logsf(3))
    constant_result = {
        "H": model.integrated_rate,
        "survival": model.survival,
        "failure": model.failure_probability,
        "scipy_log_survival": scipy_log,
    }
    print("constant three-day model:", json.dumps(constant_result))
    tiny = constant_rate_window(0.2, 1e-18)
    print("tiny interval:", json.dumps({
        "stable_failure": tiny.failure_probability,
        "naive_subtraction": 1 - exp(-0.2e-18),
    }))
    for shape, age in [(1, 4), (1, 10), (2, 4), (2, 10), (0.5, 0)]:
        window = conditional_weibull(shape, 12, age, 3)
        ordinary = weibull_min(c=shape, scale=12)
        scipy_increment = float(ordinary.logsf(age) - ordinary.logsf(age + 3))
        result = {
            "shape": shape,
            "age": age,
            "extra": 3,
            "H_increment": window.integrated_rate,
            "failure": window.failure_probability,
            "scipy_H_increment": scipy_increment,
        }
        print("Weibull window:", json.dumps(result))
    print("shape2 age4 instantaneous rate:", weibull_rate(2, 12, 4))
    times = [2, 3, 4, 4, 6, 7, 8, 9]
    events = [True, False, True, False, True, False, True, False]
    km = kaplan_meier(times, events)
    na = nelson_aalen(km)
    rows = []
    for point, increment, total in zip(km.points, na.increments, na.cumulative):
        rows.append({
            "time": point.group.time,
            "risk": point.group.at_risk,
            "d": point.group.failures,
            "NA_increment": increment,
            "NA_total": total,
            "exp_minus_NA": exp(-total),
            "KM": point.survival,
        })
    print("grouped pump estimates:", json.dumps(rows))
    # Explicitly match grouped d/n rather than the tool's smoothed tie option.
    ordinary = NelsonAalenFitter(nelson_aalen_smoothing=False).fit(
        times, event_observed=events
    )
    step_times, cumulative = nelson_aalen_estimator(
        np.array(events), np.array(times, dtype=float)
    )
    print("ordinary NA:", json.dumps({
        "lifelines_at8": float(ordinary.cumulative_hazard_at_times(8).iloc[0]),
        "scikit_times": step_times.tolist(),
        "scikit_cumulative": cumulative.tolist(),
    }))


if __name__ == "__main__":
    main()
