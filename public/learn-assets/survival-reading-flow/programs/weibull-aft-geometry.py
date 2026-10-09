"""One supplied AFT law and fixed-state likelihood; no predictive fit or dataset load."""

import json
from math import log

import numpy as np

from survival_rates import conditional_weibull
from weibull_aft_likelihood import weibull_aft_terms, weibull_failure_quantile


def main():
    shape, scale, multiplier = 2., 12., 2.
    rows = []
    for probability in [.25, .5, .75]:
        baseline = weibull_failure_quantile(probability, log(scale), shape)
        stretched = weibull_failure_quantile(probability, log(scale)+log(multiplier), shape)
        rows.append({"failure_probability": probability, "baseline_day": baseline["value"],
                     "stretched_day": stretched["value"], "time_ratio": stretched["value"]/baseline["value"]})
    print(json.dumps({"quantiles": rows, "hazard_ratio": multiplier**(-shape),
                      "baseline_at_scale": conditional_weibull(shape, scale, 0., scale).__dict__,
                      "stretched_at_baseline_scale": conditional_weibull(shape, scale*multiplier, 0., scale).__dict__}, sort_keys=True))
    # Same untied six-subject coefficient fixture already taught in section10.
    times = np.array([1., 2., 2.5, 3., 4., 5.])
    events = np.array([True, True, True, False, True, False])
    feature = np.array([-1., 0., 1., -1., 0., 1.])
    design = np.column_stack([np.ones(len(times)), feature])
    supplied = np.array([log(scale), log(multiplier), log(shape)])
    terms = weibull_aft_terms(times, events, design, supplied)
    print(json.dumps({"parameter_order": ["log scale intercept", "feature log time multiplier", "log shape"],
                      "parameters": supplied.tolist(), "log_likelihood": terms["log_likelihood"],
                      "contributions": terms["contributions"].tolist(), "score": terms["score"].tolist(),
                      "information": terms["information"].tolist()}, sort_keys=True))


if __name__ == "__main__":
    main()
