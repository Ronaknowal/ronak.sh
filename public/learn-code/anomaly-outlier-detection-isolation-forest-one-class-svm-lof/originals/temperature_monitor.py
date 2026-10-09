from pathlib import Path
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

base = Path(__file__).resolve().parent
raw = pd.read_csv(base / "machine_temperature_system_failure.csv",
                  parse_dates=["timestamp"])
level = raw.groupby("timestamp", sort=True)["value"].mean()
previous = level.reindex(level.index - pd.Timedelta(hours=1))
features = pd.DataFrame({
    "level": level.to_numpy(),
    "one_hour_change": level.to_numpy() - previous.to_numpy(),
}, index=level.index).dropna()

fit = features.index < "2013-12-06"
cal = (features.index >= "2013-12-06") & (features.index < "2013-12-10")
test = features.index >= "2013-12-10"
scaler = StandardScaler().fit(features.loc[fit])
x_fit, x_cal, x_test = [scaler.transform(features.loc[m]) for m in [fit, cal, test]]

median = features.loc[fit, "level"].median()
mad = (features.loc[fit, "level"] - median).abs().median()
if mad <= 0:
    raise ValueError("This baseline requires a positive reference MAD.")
scores = {"Baseline": (
    abs(features.loc[cal, "level"].to_numpy() - median) / mad,
    abs(features.loc[test, "level"].to_numpy() - median) / mad,
)}
models = {
    "Isolation Forest": IsolationForest(n_estimators=100, max_samples=256,
        contamination="auto", random_state=17, n_jobs=1),
    "One-Class SVM": OneClassSVM(kernel="rbf", gamma=0.5, nu=0.05),
    "LOF novelty": LocalOutlierFactor(n_neighbors=20, novelty=True,
                                     contamination="auto"),
}
for name, model in models.items():
    model.fit(x_fit)
    scores[name] = (-model.score_samples(x_cal), -model.score_samples(x_test))

windows = json.loads((base / "nab-event-windows.json").read_text())[
    "realKnownCause/machine_temperature_system_failure.csv"]
times = features.index[test]
window_masks = [(times >= pd.Timestamp(a)) & (times <= pd.Timestamp(b))
                for a, b in windows]
inside = np.logical_or.reduce(window_masks)
print("fit/cal/test:", int(fit.sum()), int(cal.sum()), int(test.sum()))
for name, (cal_score, test_score) in scores.items():
    for q in [0.95, 0.99]:
        threshold = np.quantile(cal_score, q, method="higher")
        alert = test_score > threshold
        hits = sum(bool((alert & mask).any()) for mask in window_masks)
        print(f"{name:16s} q={q:.2f} alerts={alert.sum():5d} "
              f"inside={np.sum(alert & inside):4d} "
              f"outside={np.sum(alert & ~inside):4d} windows={hits}/4")