import numpy as np
from scipy.special import logsumexp


class DiagonalGaussianNB:
    """Absolute variance floor in the declared squared feature units."""

    def __init__(self, variance_floor=1e-9):
        if not np.isfinite(variance_floor) or variance_floor <= 0:
            raise ValueError("Use a positive finite variance floor")
        self.variance_floor = variance_floor

    def fit(self, X, y):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y)
        if X.ndim != 2 or y.ndim != 1 or len(y) != len(X) or not len(X):
            raise ValueError("Use a nonempty matrix and one label per row")
        if not np.isfinite(X).all() or np.max(np.abs(X)) > 1e100:
            raise ValueError("Input exceeds the supported arithmetic range")
        self.classes_, counts = np.unique(y, return_counts=True)
        self.prior_ = counts / len(y)
        self.mean_ = np.array([X[y == c].mean(axis=0) for c in self.classes_])
        self.variance_ = (
            np.array([X[y == c].var(axis=0, ddof=0) for c in self.classes_])
            + self.variance_floor
        )
        return self

    def log_joint(self, X):
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[1] != self.mean_.shape[1] or not np.isfinite(X).all():
            raise ValueError("Use finite rows in the fitted feature schema")
        with np.errstate(over="ignore", invalid="ignore"):
            scores = np.log(self.prior_) - 0.5 * (
                np.log(2 * np.pi)
                + np.log(self.variance_)
                + (X[:, None, :] - self.mean_) ** 2 / self.variance_
            ).sum(axis=2)
        if not np.isfinite(scores).all():
            raise ValueError("Gaussian scores exceed the supported arithmetic range")
        return scores

    def predict_log_proba(self, X):
        scores = self.log_joint(X)
        return scores - logsumexp(scores, axis=1, keepdims=True)

    def predict(self, X):
        return self.classes_[self.predict_log_proba(X).argmax(axis=1)]


# Preserve the original lesson's RandomState draw sequence.
rng = np.random.RandomState(42)
X = np.vstack([rng.randn(100, 2) + [-2, -2], rng.randn(100, 2) + [2, 2]])
y = np.repeat([0, 1], 100)
model = DiagonalGaussianNB().fit(X, y)
print("priors:", model.prior_.tolist())
print("means:", model.mean_.round(4).tolist())
print("variances:", model.variance_.round(4).tolist())
print("training accuracy:", format(np.mean(model.predict(X) == y), ".4f"))
print("P(class | origin):", np.exp(model.predict_log_proba([[0, 0]])).round(6).tolist())
print(
    "normalization:",
    np.exp(model.predict_log_proba([[0, 0]])).sum(axis=1).round(12).tolist(),
)
