"""Dirichlet-multinomial count events with positive real shapes."""
import json
import math
from fractions import Fraction
import numpy as np
from scipy.special import gammaln, logsumexp
from scipy.stats import dirichlet_multinomial


def log_mass(counts, shapes):
    x, a = np.asarray(counts, dtype=float), np.asarray(shapes, dtype=float)
    if (x.ndim != 1 or len(x) < 2 or a.shape != x.shape or not np.isfinite(x).all()
            or not np.isfinite(a).all() or (x < 0).any() or not np.equal(x, np.floor(x)).all()
            or (a <= 0).any() or (a > 1e6).any() or (x > 1e6).any()):
        raise ValueError("Use matching integer counts in [0,1e6] and positive shapes at most 1e6")
    n, total = x.sum(), a.sum()
    return float(gammaln(n + 1) - gammaln(x + 1).sum() + gammaln(total) - gammaln(total + n)
                 + (gammaln(a + x) - gammaln(a)).sum())


def exact_mass(counts, shapes):
    if any(type(k) is not int or not 0 <= k <= 100 for k in counts):
        raise ValueError("Exact reference supports small nonnegative integer counts")
    if len(shapes) != len(counts) or any(Fraction(a) <= 0 for a in shapes):
        raise ValueError("Use positive rational shapes for the exact reference")
    result = Fraction(math.factorial(sum(counts)))
    for count, shape in zip(counts, shapes):
        result /= math.factorial(count)
        for j in range(count):
            result *= Fraction(shape) + j
    for j in range(sum(counts)):
        result /= sum(map(Fraction, shapes)) + j
    return result


class IntegratedPredictive:
    def __init__(self, classes, schema, shapes, priors):
        self.classes = list(classes)
        self.schema = list(schema)
        self.shapes = np.asarray(shapes, dtype=float)
        self.priors = np.asarray(priors, dtype=float)
        if (len(set(self.classes)) != len(self.classes) or len(set(self.schema)) != len(self.schema)
                or self.shapes.shape != (len(self.classes), len(self.schema))
                or self.priors.shape != (len(self.classes),) or not np.isfinite(self.priors).all()
                or (self.priors <= 0).any() or not np.isclose(self.priors.sum(), 1, atol=1e-12, rtol=0)):
            raise ValueError("Name every class/category and normalized positive priors")
        for shape in self.shapes:
            log_mass(np.zeros(len(self.schema)), shape)

    def predict_log_proba(self, counts, schema=None):
        if schema is not None and list(schema) != self.schema:
            raise ValueError("Category identity/order differs from the saved shapes")
        scores = np.array([np.log(p) + log_mass(counts, a) for p, a in zip(self.priors, self.shapes)])
        if not np.isfinite(scores).all():
            raise ValueError("Predictive scores exceed arithmetic range")
        return scores - logsumexp(scores)

    def export_state(self):
        return {"format": "nb-integrated-v1", "classes": self.classes, "schema": self.schema,
                "shapes": self.shapes.tolist(), "priors": self.priors.tolist()}

    @classmethod
    def from_state(cls, state, expected_schema=None):
        if state.get("format") != "nb-integrated-v1":
            raise ValueError("Unknown integrated event convention")
        if expected_schema is not None and list(expected_schema) != state["schema"]:
            raise ValueError("Stale category schema")
        return cls(state["classes"], state["schema"], state["shapes"], state["priors"])


def main():
    cases = [([2, 0], [4, 1]), ([1, 1], [4, 1]), ([3, 2], [.5, 1.25]),
             ([100, 80, 20], [.5, 1.25, 2.75]), ([1000, 2000, 3000], [.1, .2, .3])]
    outcomes = []
    for x, a in cases:
        own = log_mass(x, a)
        ordinary = float(dirichlet_multinomial.logpmf(x, a, sum(x)))
        assert np.isclose(own, ordinary, atol=2e-10, rtol=1e-12)
        row = {"counts": x, "shapes": a, "log_mass": own,
               "library_log_mass": ordinary, "probability": float(np.exp(own))}
        if max(x) <= 100:
            exact = exact_mass(x, [Fraction(str(v)) for v in a])
            row["exact_mass"] = str(exact)
            assert np.isclose(float(exact), np.exp(own), atol=1e-12, rtol=1e-10)
        outcomes.append(row)
    model = IntegratedPredictive([0, 1], ["A", "B"], [[4, 1], [1, 4]], [.5, .5])
    restored = IntegratedPredictive.from_state(json.loads(json.dumps(model.export_state())), ["A", "B"])
    p = np.exp(model.predict_log_proba([2, 0]))
    assert np.allclose(p, np.exp(restored.predict_log_proba([2, 0])))
    print(json.dumps({"cases": outcomes, "class_posterior_AA": p.tolist(),
                     "plugin_class0_posterior": 16 / 17,
                     "one_token_mean": 4 / 5, "one_token_integrated": np.exp(log_mass([1, 0], [4, 1])),
                     "state": model.export_state(), "roundtrip_equal": True}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
