"""Train-only labelset vocabularies and genuinely fitted subset ensembles.

Encoding/grouping/decoding/voting are written here. LogisticRegression owns
multiclass optimization; this is not a new scratch multiclass solver. New
RAkEL votes use strict > .5, unlike the retained old >= .5 toy illustration.
"""

from itertools import combinations, product
from math import comb
import pickle

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder


def arrays(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    if (
        x.ndim != 2
        or not x.size
        or not np.isfinite(x).all()
        or y.ndim != 2
        or y.shape[0] != len(x)
        or not y.shape[1]
        or not np.isin(y, (0, 1)).all()
    ):
        raise ValueError("Use aligned finite inputs and complete known binary rows")
    return x, y.astype(int)


def powerset_encoding(y):
    y = np.asarray(y)
    if y.ndim != 2 or not y.size or not np.isin(y, (0, 1)).all():
        raise ValueError(
            "Encode nonempty known binary vectors, including empty labelsets"
        )
    vocabulary, codes = np.unique(y, axis=0, return_inverse=True)
    return vocabulary.astype(int), codes


def fit_powerset(x, y, C=1.0):
    x, y = arrays(x, y)
    if not np.isfinite(C) or C <= 0:
        raise ValueError("Use a positive finite inverse penalty")
    vocabulary, codes = powerset_encoding(y)
    if len(vocabulary) == 1:
        estimator = DummyClassifier(strategy="constant", constant=0)
        branch = "supported-constant"
    else:
        estimator = LogisticRegression(
            C=C, solver="lbfgs", l1_ratio=0, tol=1e-10, max_iter=3000
        )
        branch = "multiclass-logistic"
    estimator.fit(x, codes)
    return dict(
        vocabulary=vocabulary,
        estimator=estimator,
        branch=branch,
        training_codes=codes,
        feature_width=x.shape[1],
        output_width=y.shape[1],
    )


def predict_powerset(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Use finite queries with the trained feature width")
    codes = model["estimator"].predict(x)
    if (
        not np.issubdtype(codes.dtype, np.integer)
        or np.any(codes < 0)
        or np.any(codes >= len(model["vocabulary"]))
    ):
        raise ValueError("Classifier produced a code outside its training vocabulary")
    return model["vocabulary"][codes], codes


def label_dimensions(labels, k):
    if (
        isinstance(labels, bool)
        or not isinstance(labels, int)
        or labels < 1
        or isinstance(k, bool)
        or not isinstance(k, int)
        or not 1 <= k <= labels
    ):
        raise ValueError("Use an integer label count and 1 <= k <= L")


def disjoint_groups(labels, k, seed=29):
    """A seeded partition, including the genuine last short group."""
    label_dimensions(labels, k)
    permutation = np.random.default_rng(seed).permutation(labels)
    return [
        tuple(sorted(int(j) for j in permutation[start : start + k]))
        for start in range(0, labels, k)
    ]


def overlapping_groups(labels, k, m, seed=29, max_pool=100000):
    """Coverage first, then distinct k-subsets without replacement.

    Schema/seed alone choose groups. No validation/test labels choose members.
    Enumerating combinations is explicitly bounded before allocating the pool.
    A coverage budget smaller than ceil(L/k) is impossible and is rejected.
    """
    label_dimensions(labels, k)
    if (
        isinstance(m, bool)
        or not isinstance(m, int)
        or not 1 <= m <= comb(labels, k)
        or m * k < labels
    ):
        raise ValueError("Distinct groups must fit choose(L,k) and cover all labels")
    if (
        isinstance(max_pool, bool)
        or not isinstance(max_pool, int)
        or max_pool < 1
        or comb(labels, k) > max_pool
    ):
        raise ValueError("Combination pool exceeds the declared materialization budget")
    rng = np.random.default_rng(seed)
    permutation = rng.permutation(labels)
    selected = []
    for start in range(0, labels, k):
        remaining = list(permutation[start : start + k])
        if len(remaining) < k:
            # Fill only the last group from prior labels; its newly covered
            # labels guarantee that it is distinct from every previous group.
            prior = list(permutation[:start])
            remaining += list(rng.choice(prior, size=k - len(remaining), replace=False))
        selected.append(tuple(sorted(int(j) for j in remaining)))
    selected_set = set(selected)
    pool = [
        group for group in combinations(range(labels), k) if group not in selected_set
    ]
    if m > len(selected):
        chosen = rng.choice(len(pool), size=m - len(selected), replace=False)
        selected += [pool[int(index)] for index in chosen]
    return selected


def validate_groups(groups, labels):
    label_dimensions(labels, 1)
    groups = tuple(tuple(group) for group in groups)
    if not groups:
        raise ValueError("Provide at least one subset member")
    canonical = []
    for group in groups:
        if (
            not group
            or any(
                isinstance(j, bool)
                or not isinstance(j, (int, np.integer))
                or not 0 <= j < labels
                for j in group
            )
            or len(set(group)) != len(group)
        ):
            raise ValueError("Each subset uses distinct original output indices")
        canonical.append(tuple(sorted(int(j) for j in group)))
    if len(set(canonical)) != len(canonical):
        raise ValueError("Duplicate subset members are not distinct labelsets")
    coverage = np.zeros(labels, dtype=int)
    for group in groups:
        coverage[list(group)] += 1
    if np.any(coverage == 0):
        raise ValueError("Every output requires positive member coverage")
    return groups, coverage


def fit_labelset_ensemble(x, y, groups, names, C=1.0):
    x, y = arrays(x, y)
    names = tuple(names)
    if (
        len(names) != y.shape[1]
        or any(not isinstance(name, str) or not name for name in names)
        or len(set(names)) != len(names)
    ):
        raise ValueError("Match distinct named outputs to target columns")
    groups, coverage = validate_groups(groups, y.shape[1])
    members = [
        dict(group=group, model=fit_powerset(x, y[:, group], C)) for group in groups
    ]
    return dict(
        members=members, coverage=coverage, names=names, feature_width=x.shape[1]
    )


def vote_contributions(model, local_predictions):
    if len(local_predictions) != len(model["members"]):
        raise ValueError("Supply one actual decoded vector per member")
    rows = len(local_predictions[0])
    labels = len(model["names"])
    votes = np.zeros((rows, labels))
    trace = []
    for member, local in zip(model["members"], local_predictions):
        local = np.asarray(local)
        group = member["group"]
        if local.shape != (rows, len(group)) or not np.isin(local, (0, 1)).all():
            raise ValueError(
                "Each decoded member retains its actual local output order"
            )
        votes[:, group] += local
        trace.append(
            dict(
                group=list(group),
                names=[model["names"][j] for j in group],
                local_bits=local.tolist(),
            )
        )
    if np.any(model["coverage"] <= 0):
        raise ValueError("Voting cannot invent a denominator for uncovered outputs")
    means = votes / model["coverage"]
    return dict(
        votes=votes,
        coverage=model["coverage"].copy(),
        means=means,
        prediction=(means > 0.5).astype(int),
        contributions=trace,
    )


def predict_ensemble(model, x):
    local = [predict_powerset(member["model"], x)[0] for member in model["members"]]
    return vote_contributions(model, local)


def main():
    np.set_printoptions(precision=6, suppress=True)
    rng = np.random.default_rng(31)
    x = rng.normal(size=(16, 2))
    base = np.tile(np.array(list(product((0, 1), repeat=3))), (2, 1))
    y = np.column_stack((base, base[:, 0] ^ base[:, 1], base[:, 2], 1 - base[:, 0]))
    y[0] = 0  # a genuinely known empty labelset, not an unobserved row
    names = tuple("ABCDEF")
    query = np.array([[0.3, -0.4], [-0.6, 0.1]])
    full = fit_powerset(x, y)
    encoded = LabelEncoder().fit_transform(["".join(map(str, row)) for row in y])
    np.testing.assert_array_equal(encoded, full["training_codes"])
    np.testing.assert_array_equal(full["vocabulary"][full["training_codes"]], y)
    prediction, codes = predict_powerset(full, query)
    print("Constructed finite X / known output rows:", x.tolist(), y.tolist())
    print(
        "Train-only vocabulary / codes / fitted classes:",
        full["vocabulary"].tolist(),
        full["training_codes"].tolist(),
        full["estimator"].classes_.tolist(),
    )
    print(
        "Full LP query class codes / decoded original-schema bits:",
        codes.tolist(),
        prediction.tolist(),
    )
    print(
        "Ordinary multiclass coefficient/intercept arrays:",
        full["estimator"].coef_.tolist(),
        full["estimator"].intercept_.tolist(),
    )
    absent = not np.any(np.all(full["vocabulary"] == 1, axis=1))
    assert absent
    print("Unseen 111111 is absent from the trained vocabulary:", absent)
    for title, groups in [
        ("disjoint with a last short group", disjoint_groups(6, 4)),
        ("coverage-first distinct overlapping groups", overlapping_groups(6, 3, 4)),
    ]:
        fitted = fit_labelset_ensemble(x, y, groups, names)
        result = predict_ensemble(fitted, query)
        restored = pickle.loads(pickle.dumps(fitted))  # own trusted bytes only
        np.testing.assert_array_equal(
            predict_ensemble(restored, query)["prediction"], result["prediction"]
        )
        print("Subset route:", title, "groups:", groups)
        print(
            "Every actual trained local vocabulary/coefficient/intercept:",
            [
                dict(
                    group=member["group"],
                    vocabulary=member["model"]["vocabulary"].tolist(),
                    branch=member["model"]["branch"],
                    coefficients=getattr(
                        member["model"]["estimator"], "coef_", np.array([])
                    ).tolist(),
                    intercept=getattr(
                        member["model"]["estimator"], "intercept_", np.array([])
                    ).tolist(),
                )
                for member in fitted["members"]
            ],
        )
        print(
            "Query member contributions / per-output coverage / means / strict outputs:",
            result["contributions"],
            result["coverage"].tolist(),
            result["means"].tolist(),
            result["prediction"].tolist(),
        )
    constant = fit_powerset([[0], [1]], [[0, 0], [0, 0]])
    print(
        "Single known-empty class branch:",
        constant["branch"],
        predict_powerset(constant, [[0.5]])[0].tolist(),
    )
    # Exact six-output identity/coverage mechanism, separate from fitted query.
    groups = [(0, 1, 5), (1, 2, 3), (2, 4, 5)]
    groups, coverage = validate_groups(groups, 6)
    witness = dict(
        members=[dict(group=group) for group in groups], coverage=coverage, names=names
    )
    result = vote_contributions(
        witness, [np.array([[1, 0, 1]]), np.array([[0, 1, 0]]), np.array([[1, 0, 1]])]
    )
    np.testing.assert_array_equal(result["prediction"], [[1, 0, 1, 0, 0, 1]])
    changed = vote_contributions(
        witness, [np.array([[1, 0, 1]]), np.array([[0, 1, 0]]), np.array([[1, 0, 0]])]
    )
    assert changed["means"][0, 5] == 0.5 and changed["prediction"][0, 5] == 0
    print(
        "ABF / BCD / CEF identity witness:",
        result["contributions"],
        result["means"].tolist(),
    )
    print(
        "Changed CEF third socket: F mean .5 excluded by strict vote:",
        changed["means"].tolist(),
        changed["prediction"].tolist(),
    )


if __name__ == "__main__":
    main()
