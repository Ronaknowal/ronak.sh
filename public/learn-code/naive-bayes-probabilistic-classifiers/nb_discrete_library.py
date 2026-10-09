"""Run beside nb_discrete_core.py. New fixtures; no historical lesson replay."""
import json
import warnings
import numpy as np
import scipy
import sklearn
from scipy import sparse
from sklearn.naive_bayes import MultinomialNB, BernoulliNB, CategoricalNB, ComplementNB
from nb_discrete_core import (
    MultinomialModel, BernoulliModel, CategoricalModel, ComplementModel,
)


def compare(name, scratch, ordinary, X, y, query, weights=None):
    scratch.fit(X, y, sample_weight=weights)
    ordinary.fit(X, y, sample_weight=weights)
    p = scratch.predict_log_proba(query)
    reference = ordinary.predict_log_proba(query)
    restored = type(scratch).from_state(json.loads(json.dumps(scratch.export_state())),
                                       expected_schema=scratch.schema_)
    assert np.array_equal(scratch.classes_, ordinary.classes_)
    assert np.allclose(p, reference, atol=2e-12, rtol=1e-12)
    assert np.allclose(p, restored.predict_log_proba(query), atol=1e-13, rtol=1e-13)
    return {"family": name, "classes": scratch.classes_.tolist(),
            "probabilities": np.exp(p).tolist(),
            "max_library_log_difference": float(np.max(np.abs(p - reference))),
            "state_reload_equal": True,
            "class_mass": scratch.class_count_.tolist()}


def main():
    X = sparse.csr_matrix([[2, 0, 1], [0, 1, 0], [1, 0, 0],
                          [0, 2, 1], [1, 1, 0], [0, 0, 2]])
    y = np.array([0, 1, 0, 1, 0, 1])
    query = sparse.csr_matrix([[1, 0, 1], [0, 0, 0], [0, 2, 0]])
    schema = ["A", "B", "C"]
    batch = MultinomialModel(alpha=.5, schema=schema).fit(X, y)
    online = MultinomialModel(alpha=.5, schema=schema)
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1])
    assert np.array_equal(batch.feature_count_, online.feature_count_)
    assert np.allclose(batch.predict_proba(query), online.predict_proba(query))
    results = {"versions": {"numpy": np.__version__, "scipy": scipy.__version__,
                             "sklearn": sklearn.__version__},
               "sparse_arrays": {"data": X.data.tolist(), "indices": X.indices.tolist(),
                                 "indptr": X.indptr.tolist()},
               "chunks": [2, 3, 1], "raw_counts": batch.feature_count_.tolist(),
               "theta": batch.theta_.tolist(),
               "query_probabilities": batch.predict_proba(query).tolist(),
               "batch_online_equal": True, "comparisons": []}
    w = np.array([.5, 2., 1., .75, 1.25, 1.5])
    for weights in (None, w):
        label = "unweighted" if weights is None else "weighted"
        results["comparisons"].append(compare("multinomial_" + label,
            MultinomialModel(alpha=.5, schema=schema),
            MultinomialNB(alpha=.5, force_alpha=True), X, y, query, weights))
        B = X.copy()
        B.data[:] = 1
        Q = query.copy()
        Q.data[:] = 1
        results["comparisons"].append(compare("bernoulli_" + label,
            BernoulliModel(alpha=.5, schema=schema),
            BernoulliNB(alpha=.5, force_alpha=True, binarize=None), B, y, Q, weights))
        for norm in (False, True):
            results["comparisons"].append(compare("complement_" + label + "_norm_" + str(norm),
                ComplementModel(alpha=.5, schema=schema, norm=norm),
                ComplementNB(alpha=.5, force_alpha=True, norm=norm), X, y, query, weights))
    categories = [["idle", "busy", "other"], ["wired", "radio"]]
    C = np.array([[0, 0], [1, 1], [0, 1], [1, 0], [2, 0], [1, 1]])
    for weights in (None, w):
        results["comparisons"].append(compare("categorical_" + ("unweighted" if weights is None else "weighted"),
            CategoricalModel(categories, alpha=.5, schema=["status", "link"]),
            CategoricalNB(alpha=.5, force_alpha=True, min_categories=[3, 2]),
            C, y, [[2, 1], [0, 0]], weights))
    unsupported = MultinomialModel(alpha=0, schema=["left", "right"]).fit([[1, 0], [0, 1]], [0, 1])
    results["alpha_zero_empty"] = unsupported.predict_proba([[0, 0]]).tolist()
    results["alpha_zero_supported"] = unsupported.predict_log_proba([[1, 0]]).tolist()
    # JSON encodes zero-probability log output with an explicit string, not null.
    results["alpha_zero_supported"] = [["-inf" if np.isneginf(v) else v
                                         for v in row] for row in results["alpha_zero_supported"]]
    try:
        unsupported.predict_proba([[1, 1]])
    except ValueError:
        results["alpha_zero_unsupported"] = "undefined"
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        native = MultinomialNB(alpha=0, force_alpha=True).fit([[1, 0], [0, 1]], [0, 1])
        raw = native.predict_proba([[1, 0], [0, 0]])
    results["alpha_zero_library"] = {"finite": np.isfinite(raw).tolist(),
                                      "warnings": [str(c.message) for c in caught]}
    one = ComplementModel(alpha=1, norm=True, schema=["only"]).fit([[1], [2]], [0, 1])
    results["one_word_norm_policy"] = {"weights": one.feature_log_prob_.tolist(),
                                        "probabilities": one.predict_proba([[1]]).tolist()}
    results["changed_alpha_2"] = MultinomialModel(alpha=2, schema=schema).fit(X, y).predict_proba(query).tolist()
    print(json.dumps(results, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
