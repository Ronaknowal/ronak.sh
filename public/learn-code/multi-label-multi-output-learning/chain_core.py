"""Reusable chain fitting and inference; no main, file writes or study access.

The exact Newton dependency fits regularized observed binary heads. Scaling
uses training X only. Output order is metadata, never a change of identity.
Teacher-forced prefixes and strict fold-isolated prefixes are different fits.
"""

from itertools import product

import numpy as np

from multioutput_newton import fit_newton, sigmoid


def training_arrays(x, y, row_ids, order):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    row_ids, order = tuple(row_ids), tuple(order)
    if (
        x.ndim != 2
        or not x.size
        or not np.isfinite(x).all()
        or y.ndim != 2
        or y.shape[0] != len(x)
        or y.shape[1] == 0
        or not np.isin(y, (0, 1)).all()
    ):
        raise ValueError(
            "Use aligned finite input rows and complete known binary outputs"
        )
    if (
        len(row_ids) != len(x)
        or any(not isinstance(value, str) or not value for value in row_ids)
        or len(set(row_ids)) != len(row_ids)
    ):
        raise ValueError("Use one distinct nonempty string ID per training row")
    if (
        len(order) != y.shape[1]
        or any(
            isinstance(j, (bool, np.bool_)) or not isinstance(j, (int, np.integer))
            for j in order
        )
        or sorted(order) != list(range(y.shape[1]))
    ):
        raise ValueError("Chain order must be a full output-column permutation")
    return x, y.astype(int), row_ids, tuple(int(j) for j in order)


def training_scaler(x):
    mean = x.mean(axis=0)
    scale = x.std(axis=0)
    if not np.isfinite(mean).all() or not np.isfinite(scale).all():
        raise ValueError("Training scale calculation exceeds finite arithmetic")
    scale = np.where(scale == 0, 1.0, scale)
    return dict(mean=mean, scale=scale)


def transform_inputs(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Predict using finite rows with the trained feature width")
    transformed = (x - model["scaler"]["mean"]) / model["scaler"]["scale"]
    if not np.isfinite(transformed).all():
        raise ValueError("Transformed query exceeds finite arithmetic")
    return transformed


def fit_stage(features, truth, strength, row_ids, column):
    """One supported class is a constant, not an infinite logistic intercept."""
    features, truth = np.asarray(features, dtype=float), np.asarray(truth)
    if (
        features.ndim != 2
        or not features.size
        or truth.shape != (len(features),)
        or not np.isfinite(features).all()
        or not np.isin(truth, (0, 1)).all()
        or len(row_ids) != len(features)
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError(
            "Align finite stage rows, known bits, IDs and positive penalty"
        )
    if len(np.unique(truth)) == 1:
        return dict(
            kind="constant",
            value=int(truth[0]),
            column=int(column),
            feature_width=features.shape[1],
            training_ids=tuple(row_ids),
        )
    design = np.column_stack((np.ones(len(features)), features))
    weights, steps = fit_newton(design, truth, strength=strength)
    return dict(
        kind="logistic",
        weights=weights,
        steps=steps,
        column=int(column),
        feature_width=features.shape[1],
        training_ids=tuple(row_ids),
    )


def stage_probability(stage, features):
    features = np.asarray(features, dtype=float)
    if (
        features.ndim != 2
        or features.shape[1] != stage["feature_width"]
        or not np.isfinite(features).all()
    ):
        raise ValueError("Stage features must match the actual fitted prefix width")
    if stage["kind"] == "constant":
        return np.full(len(features), stage["value"], dtype=float)
    if stage["kind"] != "logistic":
        raise ValueError("Unknown fitted stage kind")
    weights = stage["weights"]
    return sigmoid(weights[0] + features @ weights[1:])


def fit_prefix(x, y, row_ids, order, stage_count, strength=0.1):
    x, y, row_ids, order = training_arrays(x, y, row_ids, order)
    if (
        isinstance(stage_count, bool)
        or not isinstance(stage_count, int)
        or not 1 <= stage_count <= y.shape[1]
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError("Use a supported prefix length and positive slope penalty")
    scaler = training_scaler(x)
    scaled = (x - scaler["mean"]) / scaler["scale"]
    stages = []
    for position, column in enumerate(order[:stage_count]):
        features = np.column_stack((scaled, y[:, order[:position]]))
        stages.append(fit_stage(features, y[:, column], strength, row_ids, column))
    return dict(
        order=order,
        label_count=y.shape[1],
        feature_width=x.shape[1],
        scaler=scaler,
        scaler_training_ids=row_ids,
        stages=stages,
        training_ids=row_ids,
        strength=strength,
        recipe="teacher-forced",
    )


def fit_chain(x, y, row_ids, order, strength=0.1):
    x, y, row_ids, order = training_arrays(x, y, row_ids, order)
    return fit_prefix(x, y, row_ids, order, y.shape[1], strength)


def serve_prefix(model, x):
    """Serving takes no Y argument: only the current predicted bits are appended."""
    scaled = transform_inputs(model, x)
    bits = np.zeros((len(scaled), len(model["stages"])), dtype=int)
    conditionals = np.zeros_like(bits, dtype=float)
    for position, stage in enumerate(model["stages"]):
        features = np.column_stack((scaled, bits[:, :position]))
        p = stage_probability(stage, features)
        bits[:, position] = (p >= 0.5).astype(int)
        conditionals[:, position] = p
    factors = np.where(bits, conditionals, 1 - conditionals)
    return dict(
        ordered_bits=bits,
        conditionals=conditionals,
        chosen_factors=factors,
        path_probability=factors.prod(axis=1),
    )


def serve_greedy(model, x):
    if len(model["stages"]) != model["label_count"]:
        raise ValueError("Greedy whole-vector serving requires every stage")
    result = serve_prefix(model, x)
    restored = np.empty_like(result["ordered_bits"])
    restored[:, model["order"]] = result["ordered_bits"]
    result["prediction"] = restored
    return result


def path_probability(model, x, vectors):
    """Probability of supplied actions, with no division by prefix mass."""
    scaled = transform_inputs(model, x)
    vectors = np.asarray(vectors)
    if (
        len(model["stages"]) != model["label_count"]
        or vectors.shape != (len(scaled), model["label_count"])
        or not np.isin(vectors, (0, 1)).all()
    ):
        raise ValueError("Supply one complete original-order binary vector per query")
    ordered = vectors[:, model["order"]]
    probability = np.ones(len(scaled))
    factors = []
    for position, stage in enumerate(model["stages"]):
        p = stage_probability(stage, np.column_stack((scaled, ordered[:, :position])))
        factor = np.where(ordered[:, position], p, 1 - p)
        probability *= factor
        factors.append(factor)
    return probability, np.column_stack(factors)


def exact_joint(model, x, max_leaves=4096, max_operations=10000000):
    """Enumerate bounded leaves; branching always multiplies p or 1-p.

    A conservative arithmetic budget includes each query, leaf, stage and
    feature/prefix coefficient. These are resource policies, not statistical
    limits on the number of labels. There is no 0/0 at an impossible prefix.
    """
    scaled = transform_inputs(model, x)
    labels = model["label_count"]
    if len(model["stages"]) != labels:
        raise ValueError("Exact whole-vector inference requires every stage")
    for budget in (max_leaves, max_operations):
        if isinstance(budget, bool) or not isinstance(budget, int) or budget < 1:
            raise ValueError("Use positive integer inference resource budgets")
    if labels > max_leaves.bit_length() - 1:
        raise ValueError("Unsupported exact inference: leaf budget exceeded")
    leaf_count = 1 << labels
    estimate = len(scaled) * leaf_count * labels * (model["feature_width"] + labels + 1)
    if estimate > max_operations:
        raise ValueError(
            f"Unsupported exact inference: estimated operations {estimate}"
        )
    # Evaluate each distinct prefix once, rather than re-evaluating shared
    # prefixes for every final leaf. At each level append 0 then 1 children.
    prefixes = np.zeros((1, 0), dtype=int)
    probabilities = np.ones((len(scaled), 1))
    for position, stage in enumerate(model["stages"]):
        count = len(prefixes)
        features = np.column_stack(
            (np.repeat(scaled, count, axis=0), np.tile(prefixes, (len(scaled), 1)))
        )
        p = stage_probability(stage, features).reshape(len(scaled), count)
        probabilities = np.stack((probabilities * (1 - p), probabilities * p), axis=2)
        probabilities = probabilities.reshape(len(scaled), count * 2)
        prefixes = np.column_stack(
            (np.repeat(prefixes, 2, axis=0), np.tile([0, 1], count))
        )
    leaves = np.empty_like(prefixes)
    leaves[:, model["order"]] = prefixes
    # Original-schema lexicographic order, independent of fitted chain order.
    key = leaves @ (1 << np.arange(labels - 1, -1, -1))
    restore = np.argsort(key)
    leaves, probabilities = leaves[restore], probabilities[:, restore]
    np.testing.assert_allclose(probabilities.sum(axis=1), 1.0, rtol=0, atol=1e-12)
    marginals = probabilities @ leaves
    map_indices = np.argmax(probabilities, axis=1)
    return dict(
        leaves=leaves,
        probabilities=probabilities,
        marginals=marginals,
        map_prediction=leaves[map_indices],
        leaf_count=leaf_count,
        estimated_operations=estimate,
    )


def joint_actions(joint, loss="hamming", false_positive=1.0, false_negative=1.0):
    """Exact risk over original-schema actions; ties select lexicographic first."""
    leaves = joint["leaves"]
    probabilities = joint["probabilities"]
    if (
        not np.isfinite(false_positive)
        or false_positive < 0
        or not np.isfinite(false_negative)
        or false_negative < 0
    ):
        raise ValueError("Use finite nonnegative mistake costs")
    actions = []
    risks = []
    for action in leaves:
        if loss == "hamming":
            value = ((action == 1) & (leaves == 0)) * false_positive
            value = value + ((action == 0) & (leaves == 1)) * false_negative
            vector_loss = value.mean(axis=1)
        elif loss == "subset":
            vector_loss = np.any(leaves != action, axis=1).astype(float)
        else:
            raise ValueError("Use the taught Hamming or subset loss")
        risks.append(probabilities @ vector_loss)
    risks = np.column_stack(risks)
    indices = np.argmin(risks, axis=1)
    actions = leaves[indices]
    return dict(
        prediction=actions,
        risks=risks,
        minimum_risk=risks[np.arange(len(indices)), indices],
    )


def prefix_fold_inputs(x, y, row_ids, order, fold_assignment, fold):
    """Isolation boundary: no held feature or target enters a prefix fit."""
    x, y, row_ids, order = training_arrays(x, y, row_ids, order)
    assignment = np.asarray(fold_assignment)
    if assignment.shape != (len(x),) or not np.issubdtype(assignment.dtype, np.integer):
        raise ValueError("Give each row one integer fold assignment")
    held = np.flatnonzero(assignment == fold)
    train = np.flatnonzero(assignment != fold)
    if not len(held) or not len(train):
        raise ValueError("Every held fold needs a nonempty training complement")
    return dict(
        x=x[train],
        y=y[train],
        row_ids=tuple(row_ids[i] for i in train),
        held_x=x[held],
        held_ids=tuple(row_ids[i] for i in held),
        train_indices=train,
        held_indices=held,
        order=order,
    )


def fit_strict_prefix_chain(x, y, row_ids, order, fold_assignment, strength=0.1):
    """K sum(j) teacher-forced prefix fits + L final stage fits.

    Every prefix used for held rows has its own complement-only scaler and
    stages. Final stage j uses these OOF HARD prefix bits. Inner prefixes are
    teacher-forced; this recipe does not promise recursive inner cross-fitting.
    """
    x, y, row_ids, order = training_arrays(x, y, row_ids, order)
    assignment = np.asarray(fold_assignment)
    if (
        assignment.shape != (len(x),)
        or not np.issubdtype(assignment.dtype, np.integer)
        or len(np.unique(assignment)) < 2
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError("Use two or more integer folds and positive slope penalty")
    scaler = training_scaler(x)
    scaled = (x - scaler["mean"]) / scaler["scale"]
    stages = []
    provenance = []
    oof_features = []
    for position, column in enumerate(order):
        oof = np.zeros((len(x), position), dtype=int)
        if position:
            for fold in np.unique(assignment):
                inputs = prefix_fold_inputs(x, y, row_ids, order, assignment, fold)
                prefix = fit_prefix(
                    inputs["x"],
                    inputs["y"],
                    inputs["row_ids"],
                    order,
                    position,
                    strength,
                )
                predicted = serve_prefix(prefix, inputs["held_x"])["ordered_bits"]
                oof[inputs["held_indices"]] = predicted
                provenance.append(
                    dict(
                        final_position=position,
                        fold=int(fold),
                        held_ids=inputs["held_ids"],
                        prefix=prefix,
                    )
                )
        stages.append(
            fit_stage(
                np.column_stack((scaled, oof)), y[:, column], strength, row_ids, column
            )
        )
        oof_features.append(oof)
    return dict(
        order=order,
        label_count=y.shape[1],
        feature_width=x.shape[1],
        scaler=scaler,
        scaler_training_ids=row_ids,
        stages=stages,
        training_ids=row_ids,
        strength=strength,
        recipe="strict-fold-isolated-prefix",
        provenance=provenance,
        oof_features=oof_features,
    )


def gate_witness(a, b, flip="none"):
    """Fixed restricted-class OR/AND features followed by a linear XOR head.

    This is an expressiveness witness, not fitted data or new information.
    The second head ignores the first; the final head uses the two outputs.
    """
    if a not in (0, 1) or b not in (0, 1) or flip not in ("none", "OR", "AND"):
        raise ValueError("Choose two input bits and none/OR/AND prefix flip")
    first_score = a + b - 0.5
    second_score = a + b - 1.5
    first = int(first_score >= 0)
    second = int(second_score >= 0)
    if flip == "OR":
        first = 1 - first
    if flip == "AND":
        second = 1 - second
    last_score = first - second - 0.5
    return dict(
        input=[a, b],
        prefix=[first, second],
        scores=[first_score, second_score, last_score],
        prediction=int(last_score >= 0),
        truth=int(a != b),
        flip=flip,
    )
