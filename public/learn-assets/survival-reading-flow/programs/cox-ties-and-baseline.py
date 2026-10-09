import numpy as np
from itertools import combinations
from lifelines import CoxPHFitter
from sksurv.linear_model import CoxPHSurvivalAnalysis
from sksurv.util import Surv
import pandas as pd

x = np.array([-1, 0, 1, -1, 0, 1], dtype=float)
time = np.array([1, 2, 2, 3, 4, 5], dtype=float)
event = np.array([1, 1, 1, 0, 1, 0], dtype=bool)
weight = np.exp(np.log(2) * x[time >= 2])
print("day 2 risk weights:", weight.tolist())
print(
    "Breslow / Efron contributions:",
    round(2 / weight.sum() ** 2, 8),
    round(2 / (weight.sum() * (weight.sum() - 1.5)), 8),
)
print(
    "discrete unordered subset probability:",
    round(2 / sum(a * b for a, b in combinations(weight, 2)), 8),
)
frame = pd.DataFrame({"x": x, "time": time, "event": event})
fit = CoxPHFitter(baseline_estimation_method="breslow").fit(frame, "time", "event")
other = CoxPHSurvivalAnalysis(ties="efron").fit(
    x[:, None], Surv.from_arrays(event, time)
)
print(
    "Efron fitted beta, lifelines / sksurv:",
    round(fit.params_["x"], 6),
    round(other.coef_[0], 6),
)
beta = fit.params_["x"]
center = frame.x.mean()
baseline = 0.0
for at in sorted(set(time[event])):
    baseline += (
        np.sum((time == at) & event) / np.exp(beta * (x[time >= at] - center)).sum()
    )
    actual = fit.baseline_cumulative_hazard_.loc[at].iloc[0]
    assert np.isclose(baseline, actual)
print("centered baseline cumulative hazard at 4:", round(baseline, 6))
print(
    "predicted S(4) for x=-1,0,1:",
    np.round(
        fit.predict_survival_function(pd.DataFrame({"x": [-1.0, 0.0, 1.0]}), times=[4])
        .iloc[0]
        .to_numpy(),
        6,
    ).tolist(),
)