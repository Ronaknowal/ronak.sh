"""Fit chains, restore output identity and compare three decoding operations.

Download chain_core.py and the exact multioutput_newton.py dependency beside
this file. They have no executed import-time demo. This new fully specified
sample is a mechanism experiment, not the held-out Energy study.
"""

from itertools import product

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import ClassifierChain
from sklearn.preprocessing import StandardScaler

from chain_core import (
    exact_joint,
    fit_chain,
    fit_strict_prefix_chain,
    gate_witness,
    joint_actions,
    path_probability,
    prefix_fold_inputs,
    serve_greedy,
    stage_probability,
    transform_inputs,
)


def library_teacher_chain(x, y, order, strength):
    """All true prefix bits at fit; ordinary hard predictions at serving.

    ClassifierChain's binary estimator predicts class 1 only above its cutoff;
    our hand mechanism uses p >= .5. Equality is explicitly a different tie
    convention. The worked fitted query is checked away from that boundary.
    """
    scaler = StandardScaler().fit(x)
    estimator = LogisticRegression(
        C=1 / (len(x) * strength), solver="lbfgs", l1_ratio=0, max_iter=3000, tol=1e-12
    )
    model = ClassifierChain(
        estimator=estimator, order=list(order), cv=None, chain_method="predict"
    ).fit(scaler.transform(x), y)
    return scaler, model


def compare_library_stages(scratch, scaler, ordinary, x, query):
    np.testing.assert_allclose(scratch["scaler"]["mean"], scaler.mean_)
    np.testing.assert_allclose(scratch["scaler"]["scale"], scaler.scale_)
    differences = []
    for stage, estimator in zip(scratch["stages"], ordinary.estimators_):
        if stage["kind"] != "logistic" or not np.array_equal(
            estimator.classes_, [0, 1]
        ):
            raise ValueError("This parity fixture requires both classes at every stage")
        coefficients = np.concatenate((estimator.intercept_, estimator.coef_.ravel()))
        np.testing.assert_allclose(stage["weights"], coefficients, rtol=0, atol=3e-7)
        differences.append(float(np.max(abs(stage["weights"] - coefficients))))
    served = serve_greedy(scratch, query)
    if np.any(np.abs(served["conditionals"] - 0.5) < 1e-7):
        raise ValueError(
            "Library parity query reaches the distinct hard tie conventions"
        )
    np.testing.assert_array_equal(
        served["prediction"], ordinary.predict(scaler.transform(query))
    )
    # Ordinary predict_proba reports the probabilities on its served prefix,
    # not unconditional marginals. Both models have the same hard path here.
    restored = np.empty_like(served["conditionals"])
    restored[:, scratch["order"]] = served["conditionals"]
    np.testing.assert_allclose(
        restored, ordinary.predict_proba(scaler.transform(query)), atol=3e-7
    )
    return differences


def fit_order_bag_ensemble(x, y, row_ids, orders, seed=19, strength=0.2):
    """Three fixed bags; no resampling until a preferred support/result appears."""
    if len(orders) != 3:
        raise ValueError("This declared ECC experiment has exactly three orders")
    rng = np.random.default_rng(seed)
    members = []
    for member_index, order in enumerate(orders):
        indices = rng.integers(0, len(x), size=len(x))
        # A bootstrap draw is an observation in the fitted bag. Preserve both
        # its distinct draw ID and its possibly repeated ORIGINAL source ID.
        draw_ids = tuple(
            f"member{member_index}/draw{draw}" for draw in range(len(indices))
        )
        source_ids = tuple(row_ids[index] for index in indices)
        model = fit_chain(x[indices], y[indices], draw_ids, order, strength)
        members.append(
            dict(
                order=tuple(order),
                indices=indices,
                source_ids=source_ids,
                draw_ids=draw_ids,
                model=model,
            )
        )
    return members


def serve_ensemble(members, query):
    if not members:
        raise ValueError("An ensemble needs at least one fitted member")
    greedy = [serve_greedy(member["model"], query) for member in members]
    joints = [exact_joint(member["model"], query) for member in members]
    for law in joints[1:]:
        np.testing.assert_array_equal(law["leaves"], joints[0]["leaves"])
    hard_votes = np.mean([result["prediction"] for result in greedy], axis=0)
    joint_mean = dict(
        leaves=joints[0]["leaves"],
        probabilities=np.mean([law["probabilities"] for law in joints], axis=0),
    )
    joint_mean["marginals"] = joint_mean["probabilities"] @ joint_mean["leaves"]
    joint_mean["map_prediction"] = joint_mean["leaves"][
        np.argmax(joint_mean["probabilities"], axis=1)
    ]
    return dict(
        member_predictions=[result["prediction"] for result in greedy],
        hard_votes=hard_votes,
        hard_prediction=(hard_votes >= 0.5).astype(int),
        mean_chosen_path_probability=np.mean(
            [result["path_probability"] for result in greedy], axis=0
        ),
        joint_mean=joint_mean,
    )


def fitted_state(model):
    """Complete finite parameters; printing does not serialize a fake refit."""
    stages = []
    for stage in model["stages"]:
        record = dict(
            kind=stage["kind"],
            column=stage["column"],
            feature_width=stage["feature_width"],
            training_ids=list(stage["training_ids"]),
        )
        if stage["kind"] == "constant":
            record["value"] = stage["value"]
        else:
            record.update(weights=stage["weights"].tolist(), steps=stage["steps"])
        stages.append(record)
    return dict(
        order=list(model["order"]),
        recipe=model["recipe"],
        scaler_mean=model["scaler"]["mean"].tolist(),
        scaler_scale=model["scaler"]["scale"].tolist(),
        scaler_training_ids=list(model["scaler_training_ids"]),
        stages=stages,
    )


def main():
    np.set_printoptions(precision=6, suppress=True)
    # All eight binary patterns appear twice. X is a fixed seeded constructed
    # fixture, not generated again until a desirable result is obtained.
    rng = np.random.default_rng(23)
    x = rng.normal(size=(16, 2))
    y = np.tile(np.array(list(product((0, 1), repeat=3))), (2, 1))
    row_ids = tuple(f"constructed-{i}" for i in range(len(x)))
    order = (2, 0, 1)
    strength = 0.2
    query = np.array([[0.35, -0.2], [-0.7, 0.4]])
    model = fit_chain(x, y, row_ids, order, strength)
    scaler, ordinary = library_teacher_chain(x, y, order, strength)
    differences = compare_library_stages(model, scaler, ordinary, x, query)
    print(
        "Constructed X / known Y / source IDs:", x.tolist(), y.tolist(), list(row_ids)
    )
    print("Complete teacher-forced fitted state:", fitted_state(model))
    print("Ordinary matched stage coefficient max differences:", differences)
    greedy = serve_greedy(model, query)
    joint = exact_joint(model, query)
    scored, factors = path_probability(model, query, greedy["prediction"])
    np.testing.assert_allclose(scored, greedy["path_probability"])
    print(
        "Queries / greedy original-order bits / ordered conditionals / branch factors:",
        query.tolist(),
        greedy["prediction"].tolist(),
        greedy["conditionals"].tolist(),
        factors.tolist(),
    )
    print(
        "Lexicographic original-schema leaves / full probabilities:",
        joint["leaves"].tolist(),
        joint["probabilities"].tolist(),
    )
    print(
        "Exact MAP / unconditional marginals / Hamming action / subset action:",
        joint["map_prediction"].tolist(),
        joint["marginals"].tolist(),
        joint_actions(joint)["prediction"].tolist(),
        joint_actions(joint, "subset")["prediction"].tolist(),
    )
    print(
        "Exact asymmetric-cost Hamming action, FP 1 / FN 3:",
        joint_actions(joint, false_positive=1, false_negative=3)["prediction"].tolist(),
    )

    assignment = np.arange(len(x)) % 3
    strict = fit_strict_prefix_chain(x, y, row_ids, order, assignment, strength)
    for record in strict["provenance"]:
        held = set(record["held_ids"])
        prefix = record["prefix"]
        assert held.isdisjoint(prefix["scaler_training_ids"])
        assert all(held.isdisjoint(stage["training_ids"]) for stage in prefix["stages"])
    # Poison every held target, then compare the ACTUAL complement extraction.
    # No prefix fitter can see those targets because its input arrays exclude
    # them. The final stage legitimately uses all original training targets.
    original = prefix_fold_inputs(x, y, row_ids, order, assignment, 0)
    poisoned = y.copy()
    poisoned[assignment == 0] = 1 - poisoned[assignment == 0]
    changed = prefix_fold_inputs(x, poisoned, row_ids, order, assignment, 0)
    np.testing.assert_array_equal(original["y"], changed["y"])
    np.testing.assert_array_equal(original["x"], changed["x"])
    print("Strict prefix final fitted state:", fitted_state(strict))
    print(
        "OOF hard-prefix matrices by final stage:",
        [array.tolist() for array in strict["oof_features"]],
    )
    print(
        "Every actual held/complement prefix state:",
        [
            dict(
                final_position=record["final_position"],
                fold=record["fold"],
                held_ids=list(record["held_ids"]),
                prefix=fitted_state(record["prefix"]),
            )
            for record in strict["provenance"]
        ],
    )
    print(
        "Strict-fold query predictions:",
        serve_greedy(strict, query)["prediction"].tolist(),
    )
    print("Ordinary cv=3 is a separately fitted stage-wise recipe:")
    cv_recipe = ClassifierChain(
        estimator=LogisticRegression(
            C=1 / (len(x) * strength),
            solver="lbfgs",
            l1_ratio=0,
            tol=1e-12,
            max_iter=3000,
        ),
        order=list(order),
        cv=3,
        chain_method="predict",
    ).fit(scaler.transform(x), y)
    print(
        "Its query hard bits:",
        cv_recipe.predict(scaler.transform(query)).astype(int).tolist(),
    )
    probability_recipe = ClassifierChain(
        estimator=LogisticRegression(
            C=1 / (len(x) * strength),
            solver="lbfgs",
            l1_ratio=0,
            tol=1e-12,
            max_iter=3000,
        ),
        order=list(order),
        cv=None,
        chain_method="predict_proba",
    ).fit(scaler.transform(x), y)
    print(
        "Probability-prefix serving is another recipe:",
        probability_recipe.predict(scaler.transform(query)).astype(int).tolist(),
    )

    orders = ((0, 1, 2), (2, 0, 1), (1, 2, 0))
    members = fit_order_bag_ensemble(x, y, row_ids, orders, strength=strength)
    served = serve_ensemble(members, query)
    print(
        "ECC actual bags/orders/fitted parameters:",
        [
            dict(
                indices=member["indices"].tolist(),
                source_ids=list(member["source_ids"]),
                draw_ids=list(member["draw_ids"]),
                state=fitted_state(member["model"]),
            )
            for member in members
        ],
    )
    print(
        "ECC restored member hard bits / hard vote means / hard-vote prediction:",
        [array.tolist() for array in served["member_predictions"]],
        served["hard_votes"].tolist(),
        served["hard_prediction"].tolist(),
    )
    print(
        "ECC mean score of each member's OWN chosen path:",
        served["mean_chosen_path_probability"].tolist(),
    )
    print(
        "ECC complete-joint mean probabilities / MAP / marginals:",
        served["joint_mean"]["probabilities"].tolist(),
        served["joint_mean"]["map_prediction"].tolist(),
        served["joint_mean"]["marginals"].tolist(),
    )

    print(
        "Fixed restricted-class OR/AND/XOR bridge, every input and score:",
        [gate_witness(a, b) for a, b in product((0, 1), repeat=2)],
    )
    changed = gate_witness(1, 1, "AND")
    assert changed["prediction"] == 1 and changed["truth"] == 0
    print("Changed served AND bit at 11:", changed)
    corner = np.array(list(product((0, 1), repeat=2)))
    raw_design = np.column_stack((np.ones(4), corner))
    first = (raw_design @ np.array([-0.5, 1, 1]) >= 0).astype(int)
    second = (raw_design @ np.array([-1.5, 1, 1]) >= 0).astype(int)
    transformed = np.column_stack((np.ones(4), first, second))
    ordinary_gate = (transformed @ np.array([-0.5, 1, -1]) >= 0).astype(int)
    np.testing.assert_array_equal(ordinary_gate, [0, 1, 1, 0])
    print(
        "Ordinary array transformation of the SAME fixed witness:",
        corner.tolist(),
        transformed[:, 1:].tolist(),
        ordinary_gate.tolist(),
    )


if __name__ == "__main__":
    main()
