"""Fresh-clone OOF orchestration, typed columns and full-refit inference.

Run: python ensemble-oof-state.py
Keep the exact local newton-logistic.py alongside this file. NumPy/SciPy/sklearn
are dependencies. Base learners/preprocessing are ordinary library primitives;
the row orchestration and binary meta optimizer are explicitly exposed.
"""
from pathlib import Path
import importlib.util
import numpy as np
from sklearn.base import clone
from sklearn.ensemble import StackingClassifier, StackingRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge
from sklearn.model_selection import KFold, StratifiedKFold
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC


def load_dependency(filename):
    path = Path(__file__).with_name(filename)
    spec = importlib.util.spec_from_file_location(filename.replace("-", "_"), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # Guarded module import; never its historical main.
    return module


newton = load_dependency("newton-logistic.py")
combination = load_dependency("ensemble-combination-core.py")


def selected_method(estimator, requested="auto"):
    if requested != "auto":
        if requested not in {"predict_proba", "decision_function", "predict"} or not hasattr(estimator, requested):
            raise ValueError(f"unsupported requested output: {requested}")
        return requested
    for method in ["predict_proba", "decision_function", "predict"]:
        if hasattr(estimator, method):
            return method
    raise ValueError("base has no supported prediction method")


def typed_columns(estimator, features, method, class_order=None, member="base"):
    values = np.asarray(getattr(estimator, method)(features))
    if class_order is None:
        columns = np.asarray(values, dtype=float).reshape(len(features), -1)
        names = [f"{member}:prediction:{i}" for i in range(columns.shape[1])]
    elif method == "predict_proba":
        aligned = combination.align_probabilities(values, estimator.classes_, class_order)
        keep = list(range(1, len(class_order))) if len(class_order) == 2 else list(range(len(class_order)))
        columns = aligned[:, keep]
        names = [f"{member}:P(class={class_order[i]})" for i in keep]
    elif method == "decision_function":
        fitted = list(estimator.classes_)
        if set(fitted) != set(class_order):
            raise ValueError("missing-class margin has no declared fallback")
        # A three-class OVO output has three PAIR columns, just as a per-class
        # output has three CLASS columns. Width cannot determine their meaning.
        # Pipelines delegate predictions to their final estimator; inspect that
        # same output contract before assigning any named class columns.
        output_estimator = estimator
        while isinstance(output_estimator, Pipeline):
            output_estimator = output_estimator.steps[-1][1]
        if len(class_order) > 2 and getattr(output_estimator, "decision_function_shape", None) == "ovo":
            raise ValueError("multiclass pairwise OVO margins require an explicitly taught pair mapping")
        if values.ndim == 1 and len(class_order) == 2:
            sign = 1 if fitted[1] == class_order[1] else -1
            columns = (sign * values)[:, None]
            names = [f"{member}:margin(toward class={class_order[1]})"]
        elif values.ndim == 2 and values.shape[1] == len(class_order):
            columns = values[:, [fitted.index(identity) for identity in class_order]]
            names = [f"{member}:margin(class={identity})" for identity in class_order]
        else:
            raise ValueError("multiclass pairwise/unavailable margins require an explicitly taught mapping")
    else:
        # A hard label becomes its declared numeric class index, never a probability.
        lookup = {identity: index for index, identity in enumerate(class_order)}
        try:
            columns = np.array([lookup[value] for value in values], dtype=float)[:, None]
        except KeyError as error:
            raise ValueError("predicted label outside the class schema") from error
        names = [f"{member}:hard-class-index"]
    if not np.isfinite(columns).all():
        raise ValueError("base output contains unavailable/nonfinite values")
    return columns, names


def build_oof(features, targets, bases, splits, row_ids=None, class_order=None, methods=None, passthrough=False):
    x, y = np.asarray(features, dtype=float), np.asarray(targets)
    if x.ndim != 2 or not len(x) or not np.isfinite(x).all() or y.shape != (len(x),):
        raise ValueError("finite feature rows and matching targets required")
    ids = np.arange(len(x)) if row_ids is None else np.asarray(row_ids)
    if ids.shape != y.shape or len(set(ids.tolist())) != len(ids):
        raise ValueError("unique row IDs required")
    if not bases or len(set(name for name, _ in bases)) != len(bases):
        raise ValueError("base names must be nonempty and unique")
    folds = [(np.asarray(fit, dtype=int), np.asarray(held, dtype=int)) for fit, held in splits]
    coverage = np.zeros(len(x), dtype=int)
    for fit, held in folds:
        if not len(fit) or not len(held) or np.any(np.r_[fit, held] < 0) or np.any(np.r_[fit, held] >= len(x)):
            raise ValueError("fold indices must be nonempty and in range")
        if len(np.unique(fit)) != len(fit) or len(np.unique(held)) != len(held) or np.intersect1d(fit, held).size:
            raise ValueError("fold fit/held IDs must be unique and disjoint")
        coverage[held] += 1
    if not np.all(coverage == 1):
        raise ValueError("this completed OOF route requires exactly one held prediction for every row")
    chosen = [selected_method(base, "predict" if class_order is None else (methods or {}).get(name, "auto")) for name, base in bases]
    matrices, all_names, audit = [], [], []
    for (name, base), method in zip(bases, chosen):
        matrix, expected_names = None, None
        for fold_id, (fit, held) in enumerate(folds):
            fitted = clone(base).fit(x[fit], y[fit])
            columns, names = typed_columns(fitted, x[held], method, class_order, name)
            if matrix is None:
                matrix = np.empty((len(x), columns.shape[1]))
                expected_names = names
            if names != expected_names:
                raise ValueError("fold output schema changed")
            matrix[held] = columns
            audit.append({"member": name, "fold": fold_id, "fit_ids": ids[fit].tolist(), "held_ids": ids[held].tolist(), "method": method})
        matrices.append(matrix)
        all_names.extend(expected_names)
    if passthrough:
        matrices.append(x.copy())
        all_names.extend(f"raw-feature:{i}" for i in range(x.shape[1]))
    return {"matrix": np.column_stack(matrices), "column_order": all_names, "coverage": coverage,
            "row_ids": ids, "class_order": class_order, "methods": chosen, "audit": audit,
            "feature_count": x.shape[1], "passthrough": bool(passthrough)}


def full_refit_state(features, targets, bases, oof):
    x, y = np.asarray(features, dtype=float), np.asarray(targets)
    return {"bases": [(name, clone(base).fit(x, y)) for name, base in bases],
            "class_order": oof["class_order"], "methods": oof["methods"], "column_order": oof["column_order"],
            "feature_count": oof["feature_count"], "passthrough": oof["passthrough"], "fit_ids": oof["row_ids"].tolist()}


def full_refit_columns(state, queries):
    x = np.asarray(queries, dtype=float)
    if x.ndim != 2 or x.shape[1] != state["feature_count"] or not np.isfinite(x).all():
        raise ValueError("query feature schema differs from saved state")
    matrices, names = [], []
    for (name, base), method in zip(state["bases"], state["methods"]):
        columns, labels = typed_columns(base, x, method, state["class_order"], name)
        matrices.append(columns)
        names.extend(labels)
    if state["passthrough"]:
        matrices.append(x)
        names.extend(f"raw-feature:{i}" for i in range(x.shape[1]))
    if names != state["column_order"]:
        raise ValueError("stale meta column order")
    return np.column_stack(matrices)


def fit_binary_meta(matrix, labels, strength=.1):
    design = np.column_stack((np.ones(len(matrix)), matrix))
    theta, steps = newton.fit_newton(design, labels, strength)
    loss, gradient, hessian = newton.objective(design, np.asarray(labels), theta, strength)
    return {"theta": theta, "steps": steps, "loss": loss, "gradient": gradient, "hessian": hessian, "strength": strength}


def binary_forward(state, meta, queries):
    matrix = full_refit_columns(state, queries)
    scores = np.column_stack((np.ones(len(matrix)), matrix)) @ meta["theta"]
    positive = newton.sigmoid(scores)
    return {"meta_columns": matrix, "scores": scores, "probabilities": np.column_stack((1 - positive, positive))}


def main():
    np.set_printoptions(precision=9, suppress=True)
    i = np.arange(24)
    x = np.column_stack(((i % 6 - 2.5) / 2, (i // 6 - 1.5) / 2))
    y = ((x[:, 0] + .4 * x[:, 1] + .2 * np.sin(i)) > 0).astype(int)
    bases = [("line", make_pipeline(StandardScaler(), LogisticRegression(C=1, l1_ratio=0, max_iter=5000, tol=1e-12))), ("bayes", GaussianNB())]
    splits = list(StratifiedKFold(3, shuffle=True, random_state=97).split(x, y))
    oof = build_oof(x, y, bases, splits, class_order=[0, 1])
    meta = fit_binary_meta(oof["matrix"], y)
    state = full_refit_state(x, y, bases, oof)
    ordinary = StackingClassifier(estimators=bases, cv=splits, final_estimator=LogisticRegression(C=1/(len(y)*.1), l1_ratio=0, max_iter=5000, tol=1e-12)).fit(x, y)
    queries = np.array([[-.6, .2], [.7, -.3]])
    forward = binary_forward(state, meta, queries)
    print("binary column order", oof["column_order"], "coverage", oof["coverage"])
    print("OOF matrix", oof["matrix"].tolist())
    print("fit/held audit", oof["audit"])
    print("meta theta/steps/loss", meta["theta"], meta["steps"], meta["loss"])
    print("gradient infinity norm", np.max(np.abs(meta["gradient"])), "Hessian", meta["hessian"].tolist())
    print("saved changed queries", forward)
    print("ordinary binary difference", np.max(np.abs(ordinary.predict_proba(queries) - forward["probabilities"])))
    print("transform is full-refit, not OOF", np.max(np.abs(ordinary.transform(x) - oof["matrix"])))
    multi_y = i % 3
    multi_splits = list(StratifiedKFold(3, shuffle=True, random_state=19).split(x, multi_y))
    multi = build_oof(x, multi_y, bases, multi_splits, class_order=[0, 1, 2], passthrough=True)
    multi_state = full_refit_state(x, multi_y, bases, multi)
    multi_lib = StackingClassifier(estimators=bases, cv=multi_splits, passthrough=True).fit(x, multi_y)
    print("multiclass/raw order", multi["column_order"], "OOF shape", multi["matrix"].shape)
    print("ordinary multiclass transform difference", np.max(np.abs(multi_lib.transform(queries) - full_refit_columns(multi_state, queries))))
    mixed_bases = [bases[0], ("margin", make_pipeline(StandardScaler(), LinearSVC(C=1, random_state=3, tol=1e-10)))]
    mixed = build_oof(x, y, mixed_bases, splits, class_order=[0, 1], passthrough=True)
    print("mixed typed columns", mixed["column_order"], "shape", mixed["matrix"].shape)
    regression_y = 2 + .4 * i + .1 * np.sin(i)
    regression_bases = [("ridge", make_pipeline(StandardScaler(), Ridge(alpha=.1))), ("line", LinearRegression())]
    reg_splits = list(KFold(3, shuffle=True, random_state=109).split(x))
    reg = build_oof(x, regression_y, regression_bases, reg_splits)
    reg_state = full_refit_state(x, regression_y, regression_bases, reg)
    fitted_meta = Ridge(alpha=.2).fit(reg["matrix"], regression_y)
    reg_lib = StackingRegressor(estimators=regression_bases, cv=reg_splits, final_estimator=Ridge(alpha=.2)).fit(x, regression_y)
    print("regression column order", reg["column_order"], "ordinary prediction difference", np.max(np.abs(reg_lib.predict(queries) - fitted_meta.predict(full_refit_columns(reg_state, queries)))))
    missing_class = GaussianNB().fit([[0], [1]], [0, 0])
    print("missing probability class aligned", typed_columns(missing_class, [[.5]], "predict_proba", [0, 1], "single-class")[0])


if __name__ == "__main__":
    main()
