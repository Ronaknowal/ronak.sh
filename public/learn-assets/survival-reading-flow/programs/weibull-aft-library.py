import numpy as np
import pandas as pd
from lifelines import WeibullAFTFitter
from lifelines.datasets import load_rossi

shape, scale, time_ratio = 2, 12, 2
print("S at scale:", round(np.exp(-1), 6), "failed:", round(1 - np.exp(-1), 6))
print(
    "baseline / doubled median:",
    round(scale * np.log(2) ** (1 / shape), 6),
    round(time_ratio * scale * np.log(2) ** (1 / shape), 6),
)
print("hazard ratio:", time_ratio ** (-shape))
data = load_rossi()
fit = WeibullAFTFitter().fit(data, "week", "arrest")
rho = np.exp(fit.params_.loc[("rho_", "Intercept")])
coefficient = fit.params_.loc[("lambda_", "fin")]
print("Rossi shape / fin time ratio:", round(rho, 6), round(np.exp(coefficient), 6))
print("training concordance:", round(fit.concordance_index_, 6))
profiles = data.drop(columns=["week", "arrest"]).iloc[[0]].copy()
print(
    "first profile S(26):",
    round(float(fit.predict_survival_function(profiles, times=[26]).iloc[0, 0]), 6),
)
print(
    "If shape also depends on features, one common time multiplier no longer describes the change."
)