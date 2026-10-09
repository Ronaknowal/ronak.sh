"""Sparse sufficient-count NB references. Importing this module runs no fits.

Counts may be fractional for a declared scoring extension; integer inputs have
the event interpretation. Weights change training mass, not physical events.
"""
import numpy as np
from scipy import sparse


def normalize(scores):
    scores = np.asarray(scores, dtype=float)
    if scores.ndim != 2 or np.isnan(scores).any() or np.isposinf(scores).any():
        raise ValueError("Use a row-by-class matrix of finite scores or -inf")
    maximum = scores.max(axis=1, keepdims=True)
    if np.isneginf(maximum).any():
        raise ValueError("Every class has zero support for a query row")
    with np.errstate(over="ignore", invalid="ignore"):
        shifted = scores - maximum
    if np.isneginf(shifted[np.isfinite(scores)]).any():
        raise ValueError("Finite score difference exceeds arithmetic range")
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))


def count_matrix(X, binary=False):
    X = sparse.csr_matrix(X, dtype=float, copy=True)
    X.sum_duplicates()
    X.sort_indices()
    X.eliminate_zeros()
    if not X.shape[0] or not X.shape[1] or not np.isfinite(X.data).all():
        raise ValueError("Use a nonempty finite sample-by-feature matrix")
    if (X.data < 0).any() or (X.data > 1e6).any():
        raise ValueError("Count/scoring entries must lie in [0, 1e6]")
    if binary and not np.isin(X.data, [0, 1]).all():
        raise ValueError("Bernoulli input must already be binary")
    return X


def weights_and_labels(y, n, sample_weight):
    y = np.asarray(y)
    w = np.ones(n) if sample_weight is None else np.asarray(sample_weight, dtype=float)
    if y.ndim != 1 or len(y) != n or w.shape != (n,):
        raise ValueError("One label and weight are required per row")
    if not np.isfinite(w).all() or (w < 0).any() or (w > 1e6).any() or w.sum() <= 0:
        raise ValueError("Use finite nonnegative weights with positive total")
    if y.dtype.kind not in "biuUS" or (y.dtype.kind in "US" and (y == "").any()):
        raise ValueError("Class labels must be integers or nonempty strings")
    return y, w


class DiscreteModel:
    family = "abstract"

    def __init__(self, alpha=1., schema=None, priors=None):
        if not np.isfinite(alpha) or not 0 <= alpha <= 100:
            raise ValueError("Use alpha in [0, 100]")
        self.alpha = float(alpha)
        self.schema = None if schema is None else list(schema)
        self.priors = None if priors is None else np.asarray(priors, dtype=float)

    def _matrix(self, X):
        return count_matrix(X, binary=self.family == "bernoulli")

    def _allocate(self, k, d):
        self.feature_count_ = np.zeros((k, d))

    def _start(self, X, classes):
        self.classes_ = np.unique(np.asarray(classes))
        if len(self.classes_) == 0:
            raise ValueError("Supply the full nonempty class list on first partial_fit")
        weights_and_labels(self.classes_, len(self.classes_), None)
        self.schema_ = list(self.schema if self.schema is not None else
                            ["feature_" + str(j) for j in range(X.shape[1])])
        if (len(self.schema_) != X.shape[1] or len(set(self.schema_)) != X.shape[1]
                or any(not isinstance(s, str) or not s for s in self.schema_)):
            raise ValueError("Supply one distinct nonempty name per feature")
        self.class_count_ = np.zeros(len(self.classes_))
        self._allocate(len(self.classes_), X.shape[1])

    def _check_schema(self, X, schema=None):
        if X.shape[1] != len(self.schema_) or (schema is not None and list(schema) != self.schema_):
            raise ValueError("Feature identity/order differs from the fitted schema")

    def _refresh_prior(self):
        if self.priors is None:
            self.prior_ = self.class_count_ / self.class_count_.sum()
        else:
            p = self.priors
            if (p.shape != self.class_count_.shape or not np.isfinite(p).all()
                    or (p < 0).any() or not np.isclose(p.sum(), 1., atol=1e-12, rtol=0)):
                raise ValueError("One normalized nonnegative prior per sorted class")
            self.prior_ = p.copy()
        with np.errstate(divide="ignore"):
            self.class_log_prior_ = np.log(self.prior_)

    def fit(self, X, y, sample_weight=None):
        if hasattr(self, "classes_"):
            del self.classes_
        return self.partial_fit(X, y, classes=np.unique(y), sample_weight=sample_weight)

    def partial_fit(self, X, y, classes=None, sample_weight=None):
        X = self._matrix(X)
        y, w = weights_and_labels(y, X.shape[0], sample_weight)
        if not hasattr(self, "classes_"):
            if classes is None:
                raise ValueError("First partial_fit requires the complete class list")
            self._start(X, classes)
        self._check_schema(X)
        if classes is not None and not np.array_equal(np.unique(classes), self.classes_):
            raise ValueError("The class schema is fixed after initialization")
        mapping = {c: i for i, c in enumerate(self.classes_)}
        if not all(c in mapping for c in y):
            raise ValueError("A training label is outside the declared classes")
        inverse = np.array([mapping[c] for c in y])
        increment = np.bincount(inverse, weights=w, minlength=len(self.classes_))
        membership = sparse.csr_matrix((w, (inverse, np.arange(len(y)))),
                                       shape=(len(self.classes_), len(y)))
        self._accumulate(X, membership, inverse, w)
        self.class_count_ += increment
        self._refresh_prior()
        self._refresh()
        return self

    def _accumulate(self, X, membership, inverse, w):
        self.feature_count_ += (membership @ X).toarray()
        if not np.isfinite(self.feature_count_).all():
            raise ValueError("Sufficient counts exceed floating-point range")

    def predict_log_proba(self, X, schema=None):
        return normalize(self.log_joint(X, schema=schema))

    def predict_proba(self, X, schema=None):
        return np.exp(self.predict_log_proba(X, schema=schema))

    def predict(self, X, schema=None):
        # Sorted-class argmax chooses the first class on an exact tie.
        return self.classes_[self.predict_log_proba(X, schema=schema).argmax(axis=1)]

    def export_state(self):
        state = {"format": "nb-discrete-v1", "family": self.family,
                 "alpha": self.alpha, "schema": self.schema_, "classes": self.classes_.tolist(),
                 "class_count": self.class_count_.tolist(),
                 "priors": None if self.priors is None else self.priors.tolist()}
        if self.family == "categorical":
            state.update(categories=self.categories,
                         category_count=[a.tolist() for a in self.category_count_])
        else:
            state["feature_count"] = self.feature_count_.tolist()
        if self.family == "complement":
            state["norm"] = self.norm
        return state

    @classmethod
    def from_state(cls, state, expected_schema=None):
        if state.get("format") != "nb-discrete-v1" or state.get("family") != cls.family:
            raise ValueError("State format/family does not match the estimator")
        names = state["schema"]
        if expected_schema is not None and list(expected_schema) != names:
            raise ValueError("State has stale feature identity/order")
        extras = {"categories": state["categories"]} if cls.family == "categorical" else {}
        if cls.family == "complement":
            extras["norm"] = state["norm"]
        obj = cls(alpha=state["alpha"], schema=names, priors=state["priors"], **extras)
        d = len(names)
        obj._start(obj._matrix(np.zeros((1, d))), state["classes"])
        if obj.classes_.tolist() != state["classes"]:
            raise ValueError("Saved classes must retain sorted unique order")
        count = np.asarray(state["class_count"], dtype=float)
        if (count.shape != obj.class_count_.shape or not np.isfinite(count).all()
                or (count < 0).any() or count.sum() <= 0):
            raise ValueError("Invalid raw class counts")
        obj.class_count_ = count.copy()
        if cls.family == "categorical":
            arrays = [np.asarray(a, dtype=float) for a in state["category_count"]]
            if len(arrays) != d or any(a.shape != b.shape for a, b in zip(arrays, obj.category_count_)):
                raise ValueError("Invalid category shapes")
            if any(not np.isfinite(a).all() or (a < 0).any() or
                   not np.allclose(a.sum(axis=1), count, atol=1e-9, rtol=1e-12) for a in arrays):
                raise ValueError("Category counts must sum to class mass")
            obj.category_count_ = [a.copy() for a in arrays]
        else:
            a = np.asarray(state["feature_count"], dtype=float)
            if a.shape != obj.feature_count_.shape or not np.isfinite(a).all() or (a < 0).any():
                raise ValueError("Invalid feature counts")
            if cls.family == "bernoulli" and (a > count[:, None] + 1e-9).any():
                raise ValueError("Presence counts exceed document mass")
            obj.feature_count_ = a.copy()
        obj._refresh_prior()
        obj._refresh()
        return obj


class MultinomialModel(DiscreteModel):
    family = "multinomial"

    def _refresh(self):
        smoothed = self.feature_count_ + self.alpha
        totals = smoothed.sum(axis=1, keepdims=True)
        if (totals <= 0).any() or not np.isfinite(totals).all():
            raise ValueError("No token mass in a class: positive smoothing is required")
        self.theta_ = smoothed / totals
        with np.errstate(divide="ignore"):
            self.feature_log_prob_ = np.log(self.theta_)

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        if np.isfinite(self.feature_log_prob_).all():
            return np.asarray(X @ self.feature_log_prob_.T) + self.class_log_prior_
        # At alpha=0, only positive stored entries multiply log(theta).
        scores = np.empty((X.shape[0], len(self.classes_)))
        for row in range(X.shape[0]):
            start, stop = X.indptr[row:row + 2]
            scores[row] = self.class_log_prior_ + (
                self.feature_log_prob_[:, X.indices[start:stop]] * X.data[start:stop]).sum(axis=1)
        return scores


class BernoulliModel(DiscreteModel):
    family = "bernoulli"

    def __init__(self, alpha=1., schema=None, priors=None):
        super().__init__(alpha, schema, priors)
        if alpha <= 0:
            raise ValueError("This sparse absence implementation requires positive alpha")

    def _refresh(self):
        self.theta_ = (self.feature_count_ + self.alpha) / (self.class_count_[:, None] + 2 * self.alpha)
        if not ((self.theta_ > 0) & (self.theta_ < 1)).all():
            raise ValueError("Presence probabilities rounded to an unsupported endpoint")
        self.feature_log_prob_ = np.log(self.theta_)
        self.absent_log_ = np.log1p(-self.theta_)
        self.bias_ = self.class_log_prior_ + self.absent_log_.sum(axis=1)
        self.log_ratio_ = self.feature_log_prob_ - self.absent_log_

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        return np.asarray(X @ self.log_ratio_.T) + self.bias_


class CategoricalModel(DiscreteModel):
    family = "categorical"

    def __init__(self, categories, alpha=1., schema=None, priors=None):
        super().__init__(alpha, schema, priors)
        self.categories = [list(c) for c in categories]
        if not self.categories or any(not c or len(set(c)) != len(c) or
                                     any(not isinstance(t, str) or not t for t in c) for c in self.categories):
            raise ValueError("Name each feature's distinct category labels in code order")

    def _matrix(self, X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not X.shape[0] or X.shape[1] != len(self.categories)
                or not np.isfinite(X).all() or not np.equal(X, np.floor(X)).all()):
            raise ValueError("Use finite integer category codes in a rectangular matrix")
        if any((X[:, j] < 0).any() or (X[:, j] >= len(c)).any() for j, c in enumerate(self.categories)):
            raise ValueError("Category outside declared support; map to reserved other explicitly")
        return X.astype(int)

    def _allocate(self, k, d):
        self.category_count_ = [np.zeros((k, len(c))) for c in self.categories]

    def _accumulate(self, X, membership, inverse, w):
        for j, counts in enumerate(self.category_count_):
            np.add.at(counts, (inverse, X[:, j]), w)

    def _refresh(self):
        self.feature_log_prob_ = []
        for counts in self.category_count_:
            denominator = self.class_count_[:, None] + self.alpha * counts.shape[1]
            if (denominator <= 0).any():
                raise ValueError("No categorical observations: use positive smoothing")
            with np.errstate(divide="ignore"):
                self.feature_log_prob_.append(np.log((counts + self.alpha) / denominator))

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        scores = np.tile(self.class_log_prior_, (len(X), 1))
        for j, table in enumerate(self.feature_log_prob_):
            scores += table[:, X[:, j]].T
        return scores


class ComplementModel(MultinomialModel):
    family = "complement"

    def __init__(self, alpha=1., schema=None, priors=None, norm=False):
        super().__init__(alpha, schema, priors)
        if alpha <= 0 or not isinstance(norm, bool):
            raise ValueError("Use positive smoothing and a Boolean norm policy")
        self.norm = norm

    def _refresh(self):
        complement = self.feature_count_.sum(axis=0) - self.feature_count_
        smoothed = complement + self.alpha
        self.theta_ = smoothed / smoothed.sum(axis=1, keepdims=True)
        self.feature_log_prob_ = -np.log(self.theta_)
        if self.norm:
            total = self.feature_log_prob_.sum(axis=1, keepdims=True)
            # One-word support: all-zero weights stay zero, not 0/0.
            self.feature_log_prob_ = np.divide(self.feature_log_prob_, total,
                out=np.zeros_like(self.feature_log_prob_), where=total > 0)

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        scores = np.asarray(X @ self.feature_log_prob_.T)
        if len(self.classes_) == 1:
            scores += self.class_log_prior_
        return scores  # Complement scores; normalized output is not a generative posterior.
