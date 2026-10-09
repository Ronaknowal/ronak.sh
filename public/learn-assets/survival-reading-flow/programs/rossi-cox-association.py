from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.datasets import load_rossi
from lifelines.statistics import proportional_hazard_test

data = load_rossi()
fit = CoxPHFitter().fit(data, "week", "arrest")
km = KaplanMeierFitter().fit(data.week, data.arrest)
print("rows / events:", len(data), int(data.arrest.sum()))
print("KM S(26), median:", round(float(km.predict(26)), 6), km.median_survival_time_)
print(
    fit.summary[["coef", "exp(coef)", "coef lower 95%", "coef upper 95%"]]
    .round(6)
    .to_string()
)
test = proportional_hazard_test(fit, data, time_transform="rank")
print("rank-time PH diagnostic:")
print(test.summary[["test_statistic", "p"]].round(6).to_string())
print("first event record's Schoenfeld residual:")
print(
    fit.compute_residuals(data, kind="schoenfeld")
    .sort_index()
    .iloc[0]
    .round(6)
    .to_dict()
)
print("training concordance:", round(fit.concordance_index_, 6))
print(
    "Historical randomized-aid dataset; this fit alone is not a complete causal analysis or held-out prediction assessment."
)