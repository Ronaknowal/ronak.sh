"""Run beside both quiet helpers: per-feature masks and one shared prior."""
import json
import numpy as np
from sklearn.naive_bayes import CategoricalNB, BernoulliNB, GaussianNB
from nb_discrete_core import CategoricalModel, BernoulliModel, normalize
from nb_gaussian_online import GaussianOnline


class MixedModel:
    def __init__(self, alpha=1., variance_floor=1e-9, priors=None):
        self.alpha, self.variance_floor, self.priors = alpha, variance_floor, priors

    @staticmethod
    def record(X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not len(X) or X.shape[1] != 3 or not np.isfinite(X).all()
                or not np.isin(X[:, 0], [0, 1]).all() or not np.isin(X[:, 1], [0, 1]).all()
                or (np.abs(X[:, 2]) > 1e6).any()):
            raise ValueError("Use (status code 0/1, alarm 0/1, finite reading within +/-1e6)")
        return X

    def fit(self, X, y, sample_weight=None):
        X = self.record(X)
        self.category = CategoricalModel([["idle", "busy"]], self.alpha, ["status"], self.priors)
        self.binary = BernoulliModel(self.alpha, ["alarm"], self.priors)
        self.gaussian = GaussianOnline(self.variance_floor, ["reading"], ["mV"], self.priors)
        self.category.fit(X[:, :1], y, sample_weight)
        self.binary.fit(X[:, 1:2], y, sample_weight)
        self.gaussian.fit(X[:, 2:3], y, sample_weight)
        self.classes_ = self.category.classes_.copy()
        if not (np.array_equal(self.classes_, self.binary.classes_) and
                np.array_equal(self.classes_, self.gaussian.classes_) and
                np.allclose(self.category.prior_, self.gaussian.prior_)):
            raise ValueError("Every family must use the same labels, rows, weights and class prior")
        self.prior_ = self.category.prior_.copy()
        return self

    def components(self, X):
        X = self.record(X)
        category = self.category.feature_log_prob_[0][:, X[:, 0].astype(int)].T
        phi = self.binary.theta_[:, 0]
        binary = np.where(X[:, 1, None] == 1, np.log(phi), np.log1p(-phi))
        gaussian = self.gaussian.log_likelihood(X[:, 2:3])
        return [category, binary, gaussian]  # Likelihoods without three duplicated priors.

    def log_joint(self, X, mask=None):
        pieces = self.components(X)
        n = pieces[0].shape[0]
        mask = np.ones((n, 3), dtype=bool) if mask is None else np.asarray(mask)
        if mask.shape != (n, 3) or mask.dtype.kind != "b":
            raise ValueError("Use one Boolean observed flag per feature and row")
        scores = np.tile(self.category.class_log_prior_, (n, 1))
        for j, term in enumerate(pieces):
            scores += np.where(mask[:, j, None], term, 0.)
        return scores

    def predict_proba(self, X, mask=None):
        return np.exp(normalize(self.log_joint(X, mask)))

    def export_state(self):
        return {"format": "nb-mixed-v1", "feature_order": ["status", "alarm", "reading"],
                "mask_meaning": "observed Boolean; missing process assumed ignorable",
                "category": self.category.export_state(), "binary": self.binary.export_state(),
                "gaussian": self.gaussian.export_state()}

    @classmethod
    def from_state(cls, state):
        if state.get("format") != "nb-mixed-v1" or state["feature_order"] != ["status", "alarm", "reading"]:
            raise ValueError("Stale mixed feature order or convention")
        obj = cls()
        obj.category = CategoricalModel.from_state(state["category"], ["status"])
        obj.binary = BernoulliModel.from_state(state["binary"], ["alarm"])
        obj.gaussian = GaussianOnline.from_state(state["gaussian"], ["reading"], ["mV"])
        obj.classes_ = obj.category.classes_.copy()
        if not (np.array_equal(obj.classes_, obj.binary.classes_) and np.array_equal(obj.classes_, obj.gaussian.classes_)
                and np.array_equal(obj.category.prior_, obj.binary.prior_)
                and np.array_equal(obj.category.prior_, obj.gaussian.prior_)):
            raise ValueError("Families do not share class order/prior")
        obj.prior_ = obj.category.prior_.copy()
        return obj


def library_components(X, category, binary, gaussian, classes):
    """Use actual fitted per-feature parameters and explicit semantic class order."""
    def align(term, model):
        positions = [list(model.classes_).index(c) for c in classes]
        return term[:, positions]
    status = align(category.feature_log_prob_[0][:, X[:, 0].astype(int)].T, category)
    phi = np.exp(binary.feature_log_prob_[:, 0])
    alarm = align(np.where(X[:, 1, None] == 1, np.log(phi), np.log1p(-phi)), binary)
    reading = -.5 * (np.log(2 * np.pi * gaussian.var_[:, 0])
                       + (X[:, 2, None] - gaussian.theta_[:, 0]) ** 2 / gaussian.var_[:, 0])
    return [status, alarm, align(reading, gaussian)]


def main():
    X = np.array([[0, 1, -1], [0, 1, 0], [1, 0, 1], [0, 1, 2],
                  [1, 0, 0], [1, 0, 1], [0, 1, 2], [1, 0, 3]], dtype=float)
    y = np.repeat([0, 1], 4)
    query = np.array([[0, 1, .5], [1, 0, 2.], [0, 0, -1.]])
    model = MixedModel().fit(X, y)
    c = CategoricalNB(alpha=1, force_alpha=True, min_categories=[2]).fit(X[:, :1], y)
    b = BernoulliNB(alpha=1, force_alpha=True, binarize=None).fit(X[:, 1:2], y)
    # Match the scratch absolute floor for this batch instead of claiming default parity.
    smoothing = 1e-9 / X[:, 2].var()
    g = GaussianNB(var_smoothing=smoothing).fit(X[:, 2:3], y)
    likelihoods = library_components(query, c, b, g, model.classes_)
    rows = []
    for mask in ([True, True, True], [True, False, True], [False, False, False]):
        observed = np.tile(mask, (len(query), 1))
        scores = np.tile(c.class_log_prior_, (len(query), 1))
        for j, term in enumerate(likelihoods):
            scores += np.where(observed[:, j, None], term, 0.)
        p = model.predict_proba(query, observed)
        assert np.allclose(p, np.exp(normalize(scores)), atol=1e-12)
        rows.append({"mask": mask, "probabilities": p.tolist(),
                     "max_library_difference": float(np.max(np.abs(p - np.exp(normalize(scores)))))})
    restored = MixedModel.from_state(json.loads(json.dumps(model.export_state())))
    assert np.allclose(restored.predict_proba(query), model.predict_proba(query))
    changed = MixedModel(priors=[.25, .75]).fit(X, y)
    honest = changed.predict_proba(query)
    wrong = np.exp(normalize(changed.log_joint(query) + changed.category.class_log_prior_))
    print(json.dumps({"fixture": X.tolist(), "classes": model.classes_.tolist(), "query": query.tolist(),
                     "likelihood_terms": [term.tolist() for term in model.components(query)],
                     "mask_results": rows, "roundtrip_equal": True, "state": model.export_state(),
                     "library_matched_var_smoothing": smoothing, "library_epsilon": float(g.epsilon_),
                     "changed_prior_probabilities": honest.tolist(), "duplicated_prior_bug": wrong.tolist()},
                     indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
