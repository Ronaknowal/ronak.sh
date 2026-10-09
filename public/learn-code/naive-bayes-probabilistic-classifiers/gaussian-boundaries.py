import numpy as np
from scipy.stats import multivariate_normal
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss

center = np.array([-10 / 3, -10 / 3])
radius = np.sqrt(200 / 9 - (6 - np.log(4)) / 0.75)
angles = np.linspace(0, 2 * np.pi, 101)
boundary = center + radius * np.column_stack([np.cos(angles), np.sin(angles)])
difference = multivariate_normal.logpdf(
    boundary, [2, 2], 2 * np.eye(2)
) - multivariate_normal.logpdf(boundary, [-2, -2], 0.5 * np.eye(2))
print("analytic circle center/radius:", center.round(6).tolist(), round(radius, 6))
print("equal-score residual below 1e-12:", bool(np.max(np.abs(difference)) < 1e-12))

# Retained original 500-row fixture; one held-out split, not a benchmark.
X, y = make_classification(
    n_samples=500, n_features=10, n_informative=5, n_redundant=2, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(
    "test rows:",
    len(y_test),
    "majority baseline:",
    round(np.mean(y_test == np.bincount(y_train).argmax()), 4),
)
for model in [
    GaussianNB(),
    GaussianNB(var_smoothing=1e-8),
    LogisticRegression(C=1.0, max_iter=2000),
]:
    model.fit(X_train, y_train)
    prediction = model.predict(X_test)
    print(
        type(model).__name__,
        "accuracy",
        format(accuracy_score(y_test, prediction), ".4f"),
        "log loss",
        format(log_loss(y_test, model.predict_proba(X_test)), ".6f"),
    )
