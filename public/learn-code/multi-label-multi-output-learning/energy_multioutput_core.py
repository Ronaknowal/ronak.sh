"""Portable Energy recipe operations: ordinary APIs and saved-array inference.

These operations have the same function bodies as the measured recorder. No
workspace release, preparation writer, execution marker or campaign main is
imported. The learner entry point chooses its own explicit data directory.
"""

import numpy as np
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import MultiTaskLasso, Ridge
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC = [0, 1, 2, 3, 4, 6]
CATEGORICAL = [5, 7]
CATEGORIES = [[2.0, 3.0, 4.0, 5.0], [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]]


def candidate_table():
    rows = []
    for family, settings in [
        ("R", [0.1, 1.0, 10.0]),
        ("S", [1, 4, 12]),
        ("I", [1, 4, 12]),
        ("G", [0.01, 0.1, 1.0]),
    ]:
        for number, value in enumerate(settings, 1):
            params = (
                {"alpha": value, "fit_intercept": True, "solver": "svd"}
                if family == "R"
                else (
                    {
                        "alpha": value,
                        "fit_intercept": True,
                        "selection": "cyclic",
                        "tol": 1e-8,
                        "max_iter": 20000,
                    }
                    if family == "G"
                    else {
                        "min_samples_leaf": value,
                        "n_estimators": 300,
                        "max_depth": None,
                        "max_features": 1.0,
                        "bootstrap": True,
                        "min_samples_split": 2,
                        "random_state": 19,
                        "n_jobs": 1,
                    }
                )
            )
            rows.append(
                {"id": family + str(number), "family": family, "parameters": params}
            )
    return rows


def estimator(spec):
    family, params = spec["family"], spec["parameters"]
    base = (
        Ridge(**params)
        if family == "R"
        else (
            MultiTaskLasso(**params)
            if family == "G"
            else RandomForestRegressor(**params)
        )
    )
    if family == "I":
        base = MultiOutputRegressor(base, n_jobs=1)
    encoder = ColumnTransformer(
        [
            ("numeric", "passthrough", NUMERIC),
            (
                "codes",
                OneHotEncoder(
                    categories=CATEGORIES, handle_unknown="error", sparse_output=False
                ),
                CATEGORICAL,
            ),
        ],
        remainder="drop",
        sparse_threshold=0,
    )
    steps = [("encoder", encoder)]
    if family in ("R", "G"):
        steps.append(("scale", StandardScaler()))
    steps.append(("model", base))
    return TransformedTargetRegressor(
        regressor=Pipeline(steps), transformer=StandardScaler()
    )


def error_report(truth, prediction, scale, ranks):
    truth, prediction, scale = map(
        lambda v: np.asarray(v, dtype=float), (truth, prediction, scale)
    )
    ranks = np.asarray(ranks)
    if (
        truth.ndim != 2
        or truth.shape != prediction.shape
        or truth.shape[1] != 2
        or len(truth) == 0
    ):
        raise ValueError("error report requires paired nonempty two-output matrices")
    if scale.shape != (2,) or np.any(scale <= 0) or ranks.shape != (len(truth),):
        raise ValueError(
            "error report needs positive training scales and one geometry rank per row"
        )
    if not all(np.isfinite(v).all() for v in (truth, prediction, scale)):
        raise ValueError("nonfinite values cannot become an eligible score")
    residual = prediction - truth
    rmse = np.sqrt(np.mean(residual**2, axis=0))
    mae = np.mean(np.abs(residual), axis=0)
    if not np.isfinite(rmse).all() or not np.isfinite(mae).all():
        raise ValueError("error arithmetic overflow")
    groups = {
        f"G{int(g):02d}": {
            "rows": int(np.sum(ranks == g)),
            "mean_residual": np.mean(residual[ranks == g], axis=0).tolist(),
            "rmse": np.sqrt(np.mean(residual[ranks == g] ** 2, axis=0)).tolist(),
            "mae": np.mean(np.abs(residual[ranks == g]), axis=0).tolist(),
        }
        for g in np.unique(ranks)
    }
    return {
        "rmse": rmse.tolist(),
        "mae": mae.tolist(),
        "mean_training_std_normalized_rmse": float(np.mean(rmse / scale)),
        "geometry_errors": groups,
    }


def choose(rows, eligible_ids):
    """Minimum-first absolute tie band; input order is declared table order."""
    valid = [r for r in rows if r["id"] in eligible_ids and r["status"] == "valid"]
    if not valid:
        raise ValueError("selection set has no valid candidate")
    scores = [r["validation"]["mean_training_std_normalized_rmse"] for r in valid]
    if not np.isfinite(scores).all():
        raise ValueError("eligible candidate has a nonfinite validation score")
    minimum = min(scores)
    return next(r["id"] for r, score in zip(valid, scores) if score <= minimum + 1e-12)


def tree_state(tree):
    t = tree.tree_
    return {
        "children_left": t.children_left.tolist(),
        "children_right": t.children_right.tolist(),
        "feature": t.feature.tolist(),
        "threshold": t.threshold.tolist(),
        "values": t.value[:, :, 0].tolist(),
        "n_outputs": int(tree.n_outputs_),
    }


def serialize_model(fitted, spec):
    pipe, target = fitted.regressor_, fitted.transformer_
    encoder = pipe.named_steps["encoder"]
    codes = encoder.named_transformers_["codes"]
    state = {
        "id": spec["id"],
        "family": spec["family"],
        "numeric_columns": NUMERIC,
        "categorical_columns": CATEGORICAL,
        "categories": [v.tolist() for v in codes.categories_],
        "feature_names": encoder.get_feature_names_out().tolist(),
        "target_mean": target.mean_.tolist(),
        "target_scale": target.scale_.tolist(),
        "target_schema": ["heating", "cooling"],
        "training_rows": 512,
    }
    if "scale" in pipe.named_steps:
        scale = pipe.named_steps["scale"]
        state["input_mean"], state["input_scale"] = (
            scale.mean_.tolist(),
            scale.scale_.tolist(),
        )
    model = pipe.named_steps["model"]
    if spec["family"] in ("R", "G"):
        state.update(
            {
                "coef_output_by_feature": model.coef_.tolist(),
                "intercept": model.intercept_.tolist(),
            }
        )
    else:
        forests = model.estimators_ if spec["family"] == "I" else [model]
        state["forests"] = [
            {
                "output_index": i if spec["family"] == "I" else None,
                "trees": [
                    {"member_id": j, **tree_state(t)}
                    for j, t in enumerate(forest.estimators_)
                ],
            }
            for i, forest in enumerate(forests)
        ]
        state["comparison"] = (
            "encoded input cast to IEEE float32 before each <= float64 threshold comparison"
        )
    return state


def predict_saved(state, X):
    """Reconstruct this exact declared preprocessing and fitted numerical state."""
    X = np.asarray(X, dtype=float)
    if X.ndim != 2 or X.shape[1] != 8 or not np.isfinite(X).all():
        raise ValueError(
            "saved-model input requires finite rows with eight original features"
        )
    parts = [X[:, state["numeric_columns"]]]
    for column, categories in zip(state["categorical_columns"], state["categories"]):
        if not np.isin(X[:, column], categories).all():
            raise ValueError("saved-model query contains an unsupported category")
        parts.append(
            np.column_stack([X[:, column] == code for code in categories]).astype(float)
        )
    encoded = np.column_stack(parts)
    if "input_mean" in state:
        encoded = (encoded - np.asarray(state["input_mean"])) / np.asarray(
            state["input_scale"]
        )
    if state["family"] in ("R", "G"):
        standardized = encoded @ np.asarray(
            state["coef_output_by_feature"]
        ).T + np.asarray(state["intercept"])
    else:
        encoded = encoded.astype(np.float32)
        columns = []
        for forest in state["forests"]:
            total = np.zeros((len(X), 1 if forest["output_index"] is not None else 2))
            for tree in forest["trees"]:
                for row, point in enumerate(encoded):
                    node = 0
                    while tree["children_left"][node] != -1:
                        feature = tree["feature"][node]
                        node = (
                            tree["children_left"][node]
                            if float(point[feature]) <= tree["threshold"][node]
                            else tree["children_right"][node]
                        )
                    total[row] += tree["values"][node]
            columns.append(total / len(forest["trees"]))
        standardized = np.column_stack(columns)
    prediction = standardized * np.asarray(state["target_scale"]) + np.asarray(
        state["target_mean"]
    )
    if not np.isfinite(prediction).all():
        raise ValueError("saved prediction arithmetic is nonfinite")
    return prediction
