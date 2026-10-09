"""Observed-label logistic heads, support-aware folds and joined pullbacks.

Download multioutput_newton.py beside this file. Its complete Newton optimizer
is the exact prerequisite implementation; importing it does not run its demo.
This new constructed mechanism program is separate from the Energy study.
"""

import numpy as np
from scipy.special import expit
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.tree import DecisionTreeClassifier

from multioutput_newton import fit_newton, objective, sigmoid


def binary_schema(names):
    names = tuple(names)
    if not names or any(not isinstance(name, str) or not name for name in names):
        raise ValueError("Use nonempty named output columns")
    if len(set(names)) != len(names):
        raise ValueError("Output names must be distinct")
    return names


def encode_collections(collections, names, sparse=False):
    """Known collection: omitted labels mean observed absence, not unknown."""
    names = binary_schema(names)
    rows = [tuple(row) for row in collections]
    if any(any(label not in names for label in row) for row in rows):
        raise ValueError("A collection contains an unknown output name")
    encoder = MultiLabelBinarizer(classes=names, sparse_output=sparse)
    encoded = encoder.fit_transform(rows)
    return encoded, encoder


def observed_arrays(x, y, mask):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = np.asarray(mask)
    if x.ndim != 2 or not x.size or not np.isfinite(x).all():
        raise ValueError("Use a nonempty finite row-by-feature matrix")
    if y.ndim != 2 or y.shape[0] != len(x) or y.shape[1] == 0:
        raise ValueError("Use one nonempty output row per observation")
    if mask.shape != y.shape or not np.isin(mask, (0, 1)).all():
        raise ValueError("Mask must have the output shape and contain only 0/1")
    mask = mask.astype(bool)
    if not np.isin(y[mask], (0, 1)).all():
        raise ValueError("Every observed target must be exactly 0 or 1")
    support = mask.sum(axis=0)
    if np.any(support == 0):
        raise ValueError("An output has no observed rows: its fit is unsupported")
    return x, y, mask, support


def masked_objective(x, y, mask, weights, strength):
    """Sum of output-specific observed means; leading intercept is unpenalized."""
    x, y, mask, support = observed_arrays(x, y, mask)
    weights = np.asarray(weights, dtype=float)
    if weights.shape != (x.shape[1] + 1, y.shape[1]):
        raise ValueError("Weights have one intercept and d slopes per output")
    if not np.isfinite(weights).all() or not np.isfinite(strength) or strength <= 0:
        raise ValueError("Use finite weights and positive slope penalty")
    design = np.column_stack((np.ones(len(x)), x))
    loss, gradient = 0.0, np.zeros_like(weights)
    for column in range(y.shape[1]):
        keep = mask[:, column]
        local_loss, local_gradient, _ = objective(
            design[keep], y[keep, column], weights[:, column], strength
        )
        loss += local_loss
        gradient[:, column] = local_gradient
    return loss, gradient, support


def fit_observed_heads(x, y, mask, names, strength=0.1):
    """Constant supported columns use a named baseline, not infinite logits."""
    x, y, mask, support = observed_arrays(x, y, mask)
    names = binary_schema(names)
    if len(names) != y.shape[1] or not np.isfinite(strength) or strength <= 0:
        raise ValueError("Match output names to columns; use positive strength")
    heads = []
    for column, name in enumerate(names):
        keep = mask[:, column]
        local_x, local_y = x[keep], y[keep, column]
        if len(np.unique(local_y)) == 1:
            constant = int(local_y[0])
            library = DummyClassifier(strategy="constant", constant=constant)
            library.fit(local_x, local_y)
            heads.append(
                dict(
                    name=name,
                    kind="constant",
                    value=constant,
                    support=int(support[column]),
                    feature_width=x.shape[1],
                    library=library,
                )
            )
            continue
        design = np.column_stack((np.ones(len(local_x)), local_x))
        weights, steps = fit_newton(design, local_y, strength=strength)
        # sklearn sums its data loss: C * sum(BCE) + ||slopes||²/2.
        # Dividing by C*n_j gives our mean(BCE) + lambda*||slopes||²/2.
        library = LogisticRegression(
            C=1 / (len(local_y) * strength),
            solver="lbfgs",
            l1_ratio=0,
            max_iter=3000,
            tol=1e-12,
        )
        library.fit(local_x, local_y)
        heads.append(
            dict(
                name=name,
                kind="logistic",
                weights=weights,
                support=int(support[column]),
                steps=steps,
                feature_width=x.shape[1],
                library=library,
            )
        )
    return heads


def head_probabilities(heads, x, library=False):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or not np.isfinite(x).all():
        raise ValueError("Predict on finite rows with the fitted feature width")
    result = np.empty((len(x), len(heads)))
    for column, head in enumerate(heads):
        if x.shape[1] != head["feature_width"]:
            raise ValueError("Predictor feature width differs from training")
        if head["kind"] == "constant":
            result[:, column] = head["library"].predict(x) if library else head["value"]
        elif library:
            estimator = head["library"]
            positive = np.flatnonzero(estimator.classes_ == 1).item()
            result[:, column] = estimator.predict_proba(x)[:, positive]
        else:
            weights = head["weights"]
            if len(weights) != x.shape[1] + 1:
                raise ValueError("Predictor feature width differs from training")
            result[:, column] = sigmoid(weights[0] + x @ weights[1:])
    return result


def iterative_folds(y, row_ids, folds=3, seed=17):
    """Greedy rarest-label allocation under exact fold capacities.

    This splitter has no group/time constraint and makes no perfect-balance
    guarantee. Desired positive counts can be fractional. A selected row
    updates EVERY label quota, preventing incompatible per-label row splits.
    """
    y = np.asarray(y)
    row_ids = tuple(row_ids)
    if y.ndim != 2 or not y.size or not np.isin(y, (0, 1)).all():
        raise ValueError("Use a complete known binary target matrix")
    if (
        len(row_ids) != len(y)
        or any(not isinstance(value, str) or not value for value in row_ids)
        or len(set(row_ids)) != len(row_ids)
    ):
        raise ValueError("Give every observation one distinct nonempty string row ID")
    if (
        isinstance(folds, bool)
        or not isinstance(folds, int)
        or not 2 <= folds <= len(y)
    ):
        raise ValueError("Use 2..n folds")
    capacity = np.full(folds, len(y) // folds, dtype=int)
    capacity[: len(y) % folds] += 1
    desired = np.tile(y.sum(axis=0) / folds, (folds, 1))
    rng = np.random.default_rng(seed)
    row_priority = np.empty(len(y), dtype=int)
    row_priority[rng.permutation(len(y))] = np.arange(len(y))
    fold_priority = np.empty(folds, dtype=int)
    fold_priority[rng.permutation(folds)] = np.arange(folds)
    remaining = set(range(len(y)))
    assignment = np.full(len(y), -1, dtype=int)
    trace = []
    while remaining:
        ordered = sorted(remaining)
        remaining_counts = y[ordered].sum(axis=0)
        labels = np.flatnonzero(remaining_counts > 0)
        label = (
            min(labels, key=lambda j: (remaining_counts[j], j)) if len(labels) else None
        )
        candidates = [i for i in ordered if label is None or y[i, label]]
        row = min(candidates, key=lambda i: (-int(y[i].sum()), row_priority[i]))
        eligible = np.flatnonzero(capacity > 0)
        fold = max(
            eligible,
            key=lambda f: (
                desired[f, label] if label is not None else 0,
                capacity[f],
                -fold_priority[f],
            ),
        )
        assignment[row] = fold
        capacity[fold] -= 1
        desired[fold] -= y[row]  # all positive labels move with this one row
        trace.append(
            dict(
                row_id=row_ids[row],
                rare_label=None if label is None else int(label),
                fold=int(fold),
                remaining_capacity=capacity.tolist(),
            )
        )
        remaining.remove(row)
    return assignment, trace


def entropy_of_bits(y):
    y = np.asarray(y)
    if y.ndim != 2 or len(y) == 0 or not np.isin(y, (0, 1)).all():
        raise ValueError("Entropy needs nonempty complete binary rows")
    p = y.mean(axis=0)

    def entropy(probabilities):
        positive = probabilities[probabilities > 0]
        return float(-np.sum(positive * np.log2(positive)))

    summed = sum(entropy(np.array([value, 1 - value])) for value in p)
    _, counts = np.unique(y, axis=0, return_counts=True)
    joint = entropy(counts / len(y))
    return summed, joint


def entropy_split(x, y, threshold):
    x, y = np.asarray(x), np.asarray(y)
    left = x <= threshold
    if not left.any() or left.all():
        raise ValueError("This threshold must create two nonempty children")
    parent = np.array(entropy_of_bits(y))
    child = left.mean() * np.array(entropy_of_bits(y[left])) + (
        ~left
    ).mean() * np.array(entropy_of_bits(y[~left]))
    return parent, child, parent - child


def shared_output_pullback(hidden, weights, bias, targets):
    """Mean BCE over all n*L cells; hidden coordinates are supplied, not fitted."""
    hidden, weights, bias, targets = [
        np.asarray(value, dtype=float) for value in (hidden, weights, bias, targets)
    ]
    if (
        hidden.ndim != 2
        or not hidden.size
        or weights.ndim != 2
        or weights.shape[1] == 0
        or hidden.shape[1] != weights.shape[0]
        or bias.shape != (weights.shape[1],)
    ):
        raise ValueError("Hidden rows and output weight columns must align")
    logits = hidden @ weights + bias
    if targets.shape != logits.shape or not np.isin(targets, (0, 1)).all():
        raise ValueError("Supply one known target bit per output socket")
    if not all(np.isfinite(v).all() for v in (hidden, weights, bias, logits)):
        raise ValueError("Use finite model arrays")
    probabilities = sigmoid(logits)
    loss = np.logaddexp(0, (1 - 2 * targets) * logits).mean()
    delta = (probabilities - targets) / targets.size
    return dict(
        logits=logits,
        probabilities=probabilities,
        loss=float(loss),
        delta=delta,
        hidden_gradient=delta @ weights.T,
        weight_gradient=hidden.T @ delta,
        bias_gradient=delta.sum(axis=0),
    )


def main():
    np.set_printoptions(precision=6, suppress=True)
    names = ("Billing", "Access")
    dense, _ = encode_collections([("Billing",), (), ("Access",)], names)
    sparse, _ = encode_collections([("Billing",), (), ("Access",)], names, sparse=True)
    assert np.array_equal(dense, sparse.toarray())
    print("Known collections, including known empty:", dense.tolist())
    try:
        encode_collections([("Unlisted",)], names)
    except ValueError as error:
        print("Unknown schema rejected:", str(error))

    x = np.array([[-1.0], [0.0], [1.0], [2.0]])
    y = np.array([[0.0, 1.0], [0.0, 0.0], [1.0, 1.0], [1.0, 0.0]])
    mask = np.array([[1, 1], [1, 0], [1, 1], [0, 1]])
    weights = np.zeros((2, 2))
    loss, gradient, support = masked_objective(x, y, mask, weights, 0.1)
    np.testing.assert_allclose(gradient, [[1 / 6, -1 / 6], [-1 / 3, 1 / 3]])
    print(
        "Observed supports and zero-weight gradients:",
        support.tolist(),
        gradient.tolist(),
    )
    changed = np.array([[0.2, -0.1], [0.3, -0.2]])
    _, analytic, _ = masked_objective(x, y, mask, changed, 0.1)
    numeric = np.empty_like(changed)
    for index in np.ndindex(changed.shape):
        plus, minus = changed.copy(), changed.copy()
        plus[index] += 1e-6
        minus[index] -= 1e-6
        numeric[index] = (
            masked_objective(x, y, mask, plus, 0.1)[0]
            - masked_objective(x, y, mask, minus, 0.1)[0]
        ) / 2e-6
    np.testing.assert_allclose(analytic, numeric, atol=1e-9)
    print(
        "Changed masked gradient finite-difference maximum error:",
        float(np.max(abs(analytic - numeric))),
    )

    fit_x = np.array([[-2.0], [-1.0], [-1.0], [0.0], [0.0], [1.0], [1.0], [2.0]])
    fit_y = np.array(
        [[0, 0], [0, 0], [1, 1], [0, 1], [1, 0], [0, 1], [1, 0], [1, 1]], dtype=float
    )
    fit_mask = np.ones_like(fit_y, dtype=bool)
    fit_mask[1, 0] = False
    fit_mask[4, 1] = False
    fit_y[~fit_mask] = np.nan  # genuinely unobserved, not invented negatives
    heads = fit_observed_heads(fit_x, fit_y, fit_mask, names)
    probabilities = head_probabilities(heads, fit_x)
    ordinary = head_probabilities(heads, fit_x, library=True)
    np.testing.assert_allclose(probabilities, ordinary, atol=3e-7)
    print(
        "Fitted observed means, support and C:",
        [(h["name"], h["support"], h["library"].C) for h in heads],
    )
    print("Scratch probabilities:", np.round(probabilities, 6).tolist())
    print(
        "Ordinary probability maximum difference:",
        float(np.max(abs(probabilities - ordinary))),
    )
    constant_y = np.ones((len(fit_x), 1))
    constant = fit_observed_heads(
        fit_x, constant_y, np.ones_like(constant_y), ("SupportedConstant",)
    )
    np.testing.assert_array_equal(
        head_probabilities(constant, fit_x, library=True),
        head_probabilities(constant, fit_x),
    )
    print(
        "Named supported constant branch:",
        head_probabilities(constant, fit_x[:1]).tolist(),
    )
    try:
        fit_observed_heads(
            fit_x, constant_y, np.zeros_like(constant_y), ("Unobserved",)
        )
    except ValueError as error:
        print("All-unobserved output rejected:", str(error))

    split_y = np.array(
        [[1, 1, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 1], [0, 0, 0]]
    )
    row_ids = ("r0", "r1", "r2", "r3", "r4", "r5")
    fold, trace = iterative_folds(split_y, row_ids, folds=3)
    assert sorted(np.bincount(fold).tolist()) == [2, 2, 2]
    print("Iterative fold memberships:", fold.tolist())
    print(
        "Fold positive supports:",
        [split_y[fold == j].sum(axis=0).tolist() for j in range(3)],
    )
    print("Allocation trace:", trace)
    print("Impossible everywhere-positive support:", (split_y.sum(axis=0) < 3).tolist())
    groups = np.array(["case0", "case0", "case1", "case1", "case2", "case2"])
    group_folds = list(GroupKFold(n_splits=3).split(np.zeros((6, 1)), split_y, groups))
    assert all(
        set(groups[train]).isdisjoint(groups[test]) for train, test in group_folds
    )
    train, test = next(
        GroupShuffleSplit(n_splits=1, test_size=1 / 3, random_state=17).split(
            np.zeros((6, 1)), groups=groups
        )
    )
    print(
        "Ordinary indivisible group split IDs:",
        [row_ids[i] for i in train],
        [row_ids[i] for i in test],
    )

    entropy_y = np.array([[0, 0], [0, 0], [1, 1], [1, 1]])
    for threshold in (0.5, 1.5, 2.5):
        parent, child, gain = entropy_split(np.arange(4), entropy_y, threshold)
        print(
            "Split threshold, summed/joint parent, child, gain:",
            threshold,
            parent.tolist(),
            child.tolist(),
            gain.tolist(),
        )
    tree = DecisionTreeClassifier(
        criterion="entropy", max_depth=1, random_state=17
    ).fit(np.arange(4)[:, None], entropy_y)
    np.testing.assert_allclose(tree.tree_.threshold[0], 1.5)
    np.testing.assert_allclose(tree.tree_.impurity[0], 1.0)  # average over L=2
    print(
        "Ordinary entropy tree threshold/mean impurity:",
        float(tree.tree_.threshold[0]),
        float(tree.tree_.impurity[0]),
    )

    hidden = np.array([[1.0, 2.0]])
    output_weights = np.array([[1.0, 0.0, -1.0], [0.0, 1.0, 1.0]])
    targets = np.array([[1.0, 0.0, 1.0]])
    joined = shared_output_pullback(hidden, output_weights, np.zeros(3), targets)
    library_delta = (expit(hidden @ output_weights) - targets) / targets.size
    np.testing.assert_allclose(joined["delta"], library_delta, atol=1e-15)
    np.testing.assert_allclose(
        joined["hidden_gradient"], library_delta @ output_weights.T, atol=1e-15
    )
    print(
        "Shared logits / mean-cell BCE delta / hidden pullback:",
        joined["logits"].tolist(),
        joined["delta"].tolist(),
        joined["hidden_gradient"].tolist(),
    )
    changed_targets = targets.copy()
    changed_targets[0, 2] = 0
    print(
        "Change output C truth to 0, joined hidden pullback:",
        shared_output_pullback(hidden, output_weights, np.zeros(3), changed_targets)[
            "hidden_gradient"
        ].tolist(),
    )


if __name__ == "__main__":
    main()
