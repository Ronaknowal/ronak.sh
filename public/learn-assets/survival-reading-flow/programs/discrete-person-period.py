import numpy as np
from scipy.special import expit
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(17)
features = rng.binomial(1, 0.5, 500)
intercepts = np.array([-2.0, -1.5, -1.0, -0.5])
subject_rows, interval_rows, x_rows, labels = [], [], [], []
for subject, x in enumerate(features):
    observed_intervals = int(rng.choice([2, 4], p=[0.3, 0.7]))
    for interval in range(observed_intervals):
        failed = int(rng.random() < expit(intercepts[interval] + 0.8 * x))
        subject_rows.append(subject)
        interval_rows.append(interval)
        x_rows.append(x)
        labels.append(failed)
        if failed:
            break
subject_rows = np.array(subject_rows)
design = np.column_stack([np.eye(4)[interval_rows], x_rows])
training_rows = subject_rows < 400
fit = LogisticRegression(fit_intercept=False, C=100, max_iter=1000).fit(
    design[training_rows], np.array(labels)[training_rows]
)
print("subjects / person-period rows:", len(features), len(labels))
print(
    "fitted interval intercepts and x coefficient:", np.round(fit.coef_[0], 5).tolist()
)
for x in [0, 1]:
    probability = fit.predict_proba(np.column_stack([np.eye(4), np.full(4, x)]))[:, 1]
    print(
        "x",
        x,
        "hazards:",
        np.round(probability, 5).tolist(),
        "survival:",
        np.round(np.cumprod(1 - probability), 5).tolist(),
    )
q = np.array([0.2, 0.3, 0.4])
print("event in interval3 likelihood:", round((1 - q[0]) * (1 - q[1]) * q[2], 6))
print("censored after interval2 likelihood:", round((1 - q[0]) * (1 - q[1]), 6))
print(
    "Conditional likelihood factorization does not make one subject's rows independent subjects."
)