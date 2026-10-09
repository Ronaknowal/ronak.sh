"""Weighted centered-M2 Gaussian NB; an absolute additive squared-unit floor.

Run directly for a new small comparison; ordinary imports remain quiet.
"""
import json
import numpy as np


def normalize(scores):
    maximum = scores.max(axis=1, keepdims=True)
    if np.isnan(scores).any() or np.isposinf(scores).any() or np.isneginf(maximum).any():
        raise ValueError("Invalid or wholly unsupported Gaussian score row")
    shifted = scores - maximum
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))


def weights_and_labels(y, n, sample_weight):
    y = np.asarray(y)
    w = np.ones(n) if sample_weight is None else np.asarray(sample_weight, dtype=float)
    if (y.ndim != 1 or len(y) != n or w.shape != (n,) or y.dtype.kind not in "biuUS"
            or not np.isfinite(w).all() or (w < 0).any() or (w > 1e6).any() or w.sum() <= 0):
        raise ValueError("One integer/string label and finite nonnegative weight per row")
    return y, w


class GaussianOnline:
    def __init__(self, variance_floor=1e-9, schema=None, units=None, priors=None):
        floor = np.asarray(variance_floor, dtype=float)
        if floor.ndim > 1 or not np.isfinite(floor).all() or (floor <= 0).any() or (floor > 1e12).any():
            raise ValueError("Use positive finite squared-unit floor(s), at most 1e12")
        self.floor = floor.copy()
        self.schema = None if schema is None else list(schema)
        self.units = None if units is None else list(units)
        self.priors = None if priors is None else np.asarray(priors, dtype=float)

    @staticmethod
    def _matrix(X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not X.shape[0] or not X.shape[1]
                or not np.isfinite(X).all() or (np.abs(X) > 1e6).any()):
            raise ValueError("Use finite nonempty rows with readings within +/-1e6")
        return X

    def _start(self, d, classes):
        self.classes_ = np.unique(np.asarray(classes))
        weights_and_labels(self.classes_, len(self.classes_), None)
        self.schema_ = list(self.schema if self.schema is not None else ["feature_" + str(j) for j in range(d)])
        self.units_ = list(self.units if self.units is not None else ["declared units"] * d)
        if (len(self.schema_) != d or len(set(self.schema_)) != d or len(self.units_) != d
                or any(not isinstance(s, str) or not s for s in self.schema_ + self.units_)):
            raise ValueError("Name each feature and its measurement unit")
        self.floor_ = np.broadcast_to(self.floor, (d,)).copy()
        self.class_count_ = np.zeros(len(self.classes_))
        self.mean_ = np.zeros((len(self.classes_), d))
        self.M2_ = np.zeros_like(self.mean_)

    @staticmethod
    def merge(n_a, mean_a, M2_a, n_b, mean_b, M2_b):
        if n_b == 0:
            return n_a, mean_a.copy(), M2_a.copy()
        if n_a == 0:
            return n_b, mean_b.copy(), M2_b.copy()
        total = n_a + n_b
        delta = mean_b - mean_a
        mean = mean_a + delta * (n_b / total)
        M2 = M2_a + M2_b + delta ** 2 * (n_a * n_b / total)
        return total, mean, M2

    def fit(self, X, y, sample_weight=None):
        if hasattr(self, "classes_"):
            del self.classes_
        return self.partial_fit(X, y, classes=np.unique(y), sample_weight=sample_weight)

    def partial_fit(self, X, y, classes=None, sample_weight=None):
        X = self._matrix(X)
        y, w = weights_and_labels(y, len(X), sample_weight)
        if not hasattr(self, "classes_"):
            if classes is None:
                raise ValueError("First partial_fit requires the complete class list")
            self._start(X.shape[1], classes)
        if X.shape[1] != len(self.schema_):
            raise ValueError("The feature schema is fixed")
        if classes is not None and not np.array_equal(np.unique(classes), self.classes_):
            raise ValueError("The class schema is fixed")
        if not np.isin(y, self.classes_).all():
            raise ValueError("Training label outside the declared classes")
        for c, label in enumerate(self.classes_):
            selected = y == label
            xb, wb = X[selected], w[selected]
            mass = wb.sum()
            if mass == 0:
                continue
            mean = np.sum(xb * wb[:, None], axis=0) / mass
            M2 = np.sum(wb[:, None] * (xb - mean) ** 2, axis=0)
            self.class_count_[c], self.mean_[c], self.M2_[c] = self.merge(
                self.class_count_[c], self.mean_[c], self.M2_[c], mass, mean, M2)
        self._refresh()
        return self

    def _refresh(self):
        if not np.isfinite(self.M2_).all() or not np.isfinite(self.mean_).all():
            raise ValueError("Raw Gaussian statistics exceed arithmetic range")
        self.raw_variance_ = np.divide(self.M2_, self.class_count_[:, None],
                                      out=np.zeros_like(self.M2_), where=self.class_count_[:, None] > 0)
        self.variance_ = self.raw_variance_ + self.floor_[None, :]
        p = self.class_count_ / self.class_count_.sum() if self.priors is None else self.priors
        if (p.shape != self.class_count_.shape or not np.isfinite(p).all() or (p < 0).any()
                or not np.isclose(p.sum(), 1, atol=1e-12, rtol=0)):
            raise ValueError("Supply normalized priors in sorted class order")
        if ((p > 0) & (self.class_count_ <= 0)).any():
            raise ValueError("A positive-prior Gaussian class needs fitted observations")
        self.prior_ = p.copy()
        with np.errstate(divide="ignore"):
            self.class_log_prior_ = np.log(p)

    def log_likelihood(self, X, mask=None, schema=None, units=None):
        X = self._matrix(X)
        if X.shape[1] != len(self.schema_) or (schema is not None and list(schema) != self.schema_):
            raise ValueError("Feature identity/order differs from the fitted schema")
        if units is not None and list(units) != self.units_:
            raise ValueError("Convert model parameters and floor with the measurement units")
        mask = np.ones(X.shape, dtype=bool) if mask is None else np.asarray(mask)
        if mask.shape != X.shape or mask.dtype.kind != "b":
            raise ValueError("Use one Boolean observed mask per feature and row")
        scores = np.zeros((len(X), len(self.classes_)))
        for j in range(X.shape[1]):
            term = -.5 * (np.log(2 * np.pi) + np.log(self.variance_[:, j])[None, :]
                          + (X[:, j, None] - self.mean_[:, j]) ** 2 / self.variance_[:, j][None, :])
            scores += np.where(mask[:, j, None], term, 0.)
        if not np.isfinite(scores).all():
            raise ValueError("Gaussian likelihood exceeds arithmetic range")
        return scores

    def log_joint(self, X, mask=None, schema=None, units=None):
        return self.log_likelihood(X, mask, schema, units) + self.class_log_prior_

    def predict_log_proba(self, X, mask=None, schema=None, units=None):
        return normalize(self.log_joint(X, mask, schema, units))

    def predict_proba(self, X, mask=None, schema=None, units=None):
        return np.exp(self.predict_log_proba(X, mask, schema, units))

    def predict(self, X, mask=None, schema=None, units=None):
        return self.classes_[self.predict_log_proba(X, mask, schema, units).argmax(axis=1)]

    def export_state(self):
        return {"format": "nb-gaussian-M2-v1", "classes": self.classes_.tolist(),
                "schema": self.schema_, "units": self.units_, "variance_floor": self.floor_.tolist(),
                "class_count": self.class_count_.tolist(), "mean": self.mean_.tolist(),
                "M2": self.M2_.tolist(), "priors": None if self.priors is None else self.priors.tolist()}

    @classmethod
    def from_state(cls, state, expected_schema=None, expected_units=None):
        if state.get("format") != "nb-gaussian-M2-v1":
            raise ValueError("Unknown Gaussian state convention")
        if expected_schema is not None and list(expected_schema) != state["schema"]:
            raise ValueError("State has stale feature identity/order")
        if expected_units is not None and list(expected_units) != state["units"]:
            raise ValueError("State has different measurement units")
        obj = cls(state["variance_floor"], state["schema"], state["units"], state["priors"])
        obj._start(len(state["schema"]), state["classes"])
        if obj.classes_.tolist() != state["classes"]:
            raise ValueError("Saved classes must retain sorted unique order")
        count, mean, M2 = [np.asarray(state[key], dtype=float) for key in ("class_count", "mean", "M2")]
        if (count.shape != obj.class_count_.shape or mean.shape != obj.mean_.shape or M2.shape != obj.M2_.shape
                or not all(np.isfinite(a).all() for a in (count, mean, M2))
                or (count < 0).any() or count.sum() <= 0 or (M2 < 0).any()
                or (np.abs(mean) > 1e6).any() or (M2[count == 0] != 0).any()):
            raise ValueError("Invalid raw Gaussian statistics")
        obj.class_count_, obj.mean_, obj.M2_ = count.copy(), mean.copy(), M2.copy()
        obj._refresh()
        return obj


def main():
    from sklearn.naive_bayes import GaussianNB
    X = np.array([[1., -2.], [2., -1.], [3., 0.], [0., 2.], [1., 3.], [2., 4.]])
    y = np.array([0, 0, 0, 1, 1, 1])
    weights = np.array([.5, 1.5, 1., 1., 2., .5])
    query = [[1.5, .5], [0., 0.]]
    batch = GaussianOnline(schema=["reading", "offset"], units=["mV", "mV"]).fit(X, y, weights)
    online = GaussianOnline(schema=["reading", "offset"], units=["mV", "mV"])
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1], sample_weight=weights[start:stop])
    assert np.allclose(batch.mean_, online.mean_) and np.allclose(batch.M2_, online.M2_)
    restored = GaussianOnline.from_state(json.loads(json.dumps(online.export_state())),
                                        expected_schema=["reading", "offset"], expected_units=["mV", "mV"])
    assert np.allclose(restored.predict_proba(query), batch.predict_proba(query))
    ordinary = GaussianNB(var_smoothing=1e-9).fit(X, y, sample_weight=weights)
    ordinary_online = GaussianNB(var_smoothing=1e-9)
    epsilons = []
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        ordinary_online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1], sample_weight=weights[start:stop])
        epsilons.append(float(ordinary_online.epsilon_))
    assert np.allclose(batch.mean_, ordinary.theta_, atol=1e-12)
    assert np.allclose(batch.raw_variance_, ordinary.var_ - ordinary.epsilon_, atol=1e-12)
    merged = GaussianOnline.merge(2., np.array([1.5]), np.array([.5]), 1., np.array([3.]), np.array([0.]))
    print(json.dumps({"merged_n_mean_M2": [merged[0], merged[1].tolist(), merged[2].tolist()],
                     "weighted_state": batch.export_state(), "chunks": [2, 3, 1],
                     "probabilities": batch.predict_proba(query).tolist(), "roundtrip_equal": True,
                     "library_epsilon_batch": float(ordinary.epsilon_), "library_epsilon_chunks": epsilons,
                     "library_variance_batch": ordinary.var_.tolist(),
                     "library_variance_chunks": ordinary_online.var_.tolist(),
                     "library_probability_batch": ordinary.predict_proba(query).tolist(),
                     "library_probability_chunks": ordinary_online.predict_proba(query).tolist()},
                     indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
