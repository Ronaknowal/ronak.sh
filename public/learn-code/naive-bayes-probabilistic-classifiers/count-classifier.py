import numpy as np
from scipy.special import logsumexp


class CountNaiveBayes:
    """Integer-count plug-in MNB; bounded educational input, not a full sklearn estimator."""

    def __init__(self, alpha=1.0):
        if not np.isfinite(alpha) or not 0 <= alpha <= 100:
            raise ValueError("Use finite alpha from 0 to 100")
        self.alpha = float(alpha)

    @staticmethod
    def _counts(X):
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or not X.shape[0] or not X.shape[1]:
            raise ValueError("Use a nonempty sample-by-feature matrix")
        if not np.isfinite(X).all() or (X < 0).any() or (X > 1e6).any():
            raise ValueError("Counts must be finite and between 0 and 1e6")
        if not np.equal(X, np.floor(X)).all():
            raise ValueError("This event-model implementation uses integer counts")
        return X

    def fit(self, X, y):
        X = self._counts(X)
        y = np.asarray(y)
        if y.ndim != 1 or len(y) != len(X):
            raise ValueError("One label is required per row")
        self.classes_, inverse = np.unique(y, return_inverse=True)
        self.class_count_ = np.bincount(inverse).astype(float)
        self.feature_count_ = np.zeros((len(self.classes_), X.shape[1]))
        np.add.at(self.feature_count_, inverse, X)
        smoothed = self.feature_count_ + self.alpha
        total = smoothed.sum(axis=1, keepdims=True)
        if (total == 0).any() or not np.isfinite(total).all():
            raise ValueError("A class has no token mass; use positive smoothing")
        self.theta_ = smoothed / total
        with np.errstate(divide="ignore"):
            self.feature_log_prob_ = np.log(self.theta_)
        self.class_log_prior_ = np.log(self.class_count_ / len(X))
        return self

    def log_joint(self, X):
        X = self._counts(X)
        if X.shape[1] != self.feature_count_.shape[1]:
            raise ValueError("Use the fitted vocabulary in the same column order")
        scores = []
        for row in X:
            active = row > 0  # Prevent the undefined floating-point operation 0 * -inf.
            scores.append(
                self.class_log_prior_
                + (self.feature_log_prob_[:, active] * row[active]).sum(axis=1)
            )
        return np.asarray(scores)

    def predict_log_proba(self, X):
        scores = self.log_joint(X)
        normalizer = logsumexp(scores, axis=1, keepdims=True)
        if not np.isfinite(normalizer).all():
            raise ValueError("Every class has zero likelihood for at least one row")
        return scores - normalizer

    def predict_proba(self, X):
        return np.exp(self.predict_log_proba(X))

    def predict(self, X):
        return self.classes_[self.predict_log_proba(X).argmax(axis=1)]


vocabulary = ["free", "money", "win", "prize", "meeting", "agenda", "report", "quarter"]
X = np.array(
    [
        [3, 2, 1, 1, 0, 0, 0, 0],
        [2, 3, 2, 0, 0, 0, 0, 0],
        [1, 1, 3, 2, 0, 0, 0, 0],
        [4, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 3, 1, 1],
        [0, 0, 0, 0, 1, 1, 3, 2],
        [0, 1, 0, 0, 3, 2, 1, 0],
        [0, 0, 0, 0, 2, 1, 2, 3],
    ]
)
y = np.array([1, 1, 1, 1, 0, 0, 0, 0])

model = CountNaiveBayes(alpha=1).fit(X, y)
query = np.array([[2, 1, 0, 0, 0, 0, 0, 0], [0] * 8])
print("class order:", model.classes_.tolist())
print("token totals:", model.feature_count_.sum(axis=1).astype(int).tolist())
print("class word counts:", model.feature_count_.astype(int).tolist())
print("log word probabilities:", model.feature_log_prob_.round(4).tolist())
print("query joint scores:", model.log_joint(query).round(6).tolist())
print("query probabilities:", model.predict_proba(query).round(6).tolist())
print("training accuracy:", float(np.mean(model.predict(X) == y)))
from sklearn.naive_bayes import MultinomialNB

reference = MultinomialNB(alpha=1).fit(X, y)
print(
    "matches sklearn:",
    np.allclose(model.predict_proba(query), reference.predict_proba(query)),
)
