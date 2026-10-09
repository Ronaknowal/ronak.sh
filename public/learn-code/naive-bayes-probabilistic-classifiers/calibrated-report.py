import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import brier_score_loss, log_loss, accuracy_score


def draw_cases(rng, count):
    y = rng.binomial(1, 0.3, size=count)
    reading = 1.5 * y + rng.normal(size=count)
    return np.column_stack([reading, reading]), y  # Exact copies, not two measurements.


def report(name, y, p):
    print(
        name,
        "accuracy",
        format(accuracy_score(y, p > 0.5), ".4f"),
        "Brier",
        format(brier_score_loss(y, p), ".6f"),
        "log loss",
        format(log_loss(y, p), ".6f"),
    )


rng = np.random.default_rng(2026)
X_fit, y_fit = draw_cases(rng, 800)
X_cal, y_cal = draw_cases(rng, 800)
X_test, y_test = draw_cases(rng, 1200)
base = GaussianNB().fit(X_fit, y_fit)
calibrated = CalibratedClassifierCV(FrozenEstimator(base), method="sigmoid")
calibrated.fit(X_cal, y_cal)  # No refit of frozen base; these rows fit the calibrator.
raw = base.predict_proba(X_test)[:, 1]
adjusted = calibrated.predict_proba(X_test)[:, 1]
report("prior-only", y_test, np.full(len(y_test), y_fit.mean()))
report("raw duplicate GNB", y_test, raw)
report("sigmoid calibrated", y_test, adjusted)
print("changed .5 decisions:", int(np.sum((raw > 0.5) != (adjusted > 0.5))))
observed, predicted = calibration_curve(y_test, adjusted, n_bins=5, strategy="uniform")
print("mean prediction by nonempty bin:", predicted.round(4).tolist())
print("observed positive fractions:", observed.round(4).tolist())
counts, _ = np.histogram(adjusted, bins=np.linspace(0, 1, 6))
print("bin sizes:", counts.tolist())
false_positive_cost, false_negative_cost = 4, 1
threshold = false_positive_cost / (false_positive_cost + false_negative_cost)
actions = adjusted > threshold  # Ties choose class0.
realized = np.where(
    actions & (y_test == 0),
    false_positive_cost,
    np.where(~actions & (y_test == 1), false_negative_cost, 0),
)
print(
    "declared-cost threshold:",
    threshold,
    "realized test cost per case:",
    format(realized.mean(), ".6f"),
)
print(
    "Fixed synthetic law and seed; finite test metrics do not guarantee future calibration."
)
