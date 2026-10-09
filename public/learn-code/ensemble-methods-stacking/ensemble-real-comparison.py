"""The declared, once-only eight-candidate WDBC experiment and portable state.

Default: preflight only. Execute the fixed study with --run-study --output DIR.
An existing execution-started.json blocks another run, including failed runs.
Supply --csv and --protocol when downloading outside this repository. Keep
ensemble-oof-state.py, ensemble-combination-core.py and newton-logistic.py beside
this file. Dependencies: NumPy, SciPy, scikit-learn. No historical main runs.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import platform
import warnings
import numpy as np
import scipy
import sklearn
from scipy.special import logsumexp
from sklearn.base import clone
from sklearn.ensemble import StackingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, confusion_matrix, log_loss
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler


spec = importlib.util.spec_from_file_location("oof", Path(__file__).with_name("ensemble-oof-state.py"))
oof = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oof)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def json_ready(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {key: json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    return value


def save_json(path, value):
    Path(path).write_text(json.dumps(json_ready(value), indent=2, allow_nan=False) + "\n", encoding="utf8")


def preflight(csv_path, protocol_path):
    protocol = json.loads(Path(protocol_path).read_text(encoding="utf-8-sig"))
    if digest(csv_path) != protocol["offlineCSV"]["sha256"]:
        raise ValueError("CSV identity differs from the frozen protocol")
    data = np.loadtxt(csv_path, delimiter=",", skiprows=1)
    x, y = data[:, :-1], 1 - data[:, -1].astype(np.int64)
    if x.shape != (569, 30) or not np.isfinite(x).all() or not np.array_equal(np.unique(y), [0, 1]):
        raise ValueError("WDBC dimensions, finite schema or inverted class labels differ")
    if hashlib.sha256(x.copy(order="C").tobytes()).hexdigest() != protocol["dataMatrixSHA256"] or hashlib.sha256(y.tobytes()).hexdigest() != protocol["labelsSHA256"]:
        raise ValueError("matrix/label identity differs")
    ids = np.arange(len(x))
    train, rest = train_test_split(ids, test_size=.4, stratify=y, random_state=83)
    validation, test = train_test_split(rest, test_size=.5, stratify=y[rest], random_state=89)
    base, meta = train_test_split(train, test_size=.4, stratify=y[train], random_state=101)
    regenerated = {"train": train, "validation": validation, "test": test, "blendBase": base, "blendMeta": meta}
    if any(not np.array_equal(value, protocol[key]) for key, value in regenerated.items()):
        raise ValueError("split identities differ from the accepted protocol")
    return x, y, protocol, regenerated


def base_prototypes():
    return [("line", make_pipeline(StandardScaler(), LogisticRegression(C=1, l1_ratio=0, solver="lbfgs", max_iter=5000, tol=1e-9))),
            ("bayes", GaussianNB(var_smoothing=1e-9)),
            ("neighbor", make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=9, weights="uniform", algorithm="brute", n_jobs=1)))]


def snapshot_bases(fitted, fit_ids, raw_labels):
    states = []
    for name, estimator in fitted:
        rule = estimator[-1] if hasattr(estimator, "steps") else estimator
        state = {"name": name, "classes": rule.classes_.tolist(), "fit_ids": np.asarray(fit_ids).tolist()}
        if hasattr(estimator, "steps"):
            scaler = estimator[0]
            state["scaler"] = {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist()}
        if name == "line":
            state.update(kind="binary-logistic", coefficients=rule.coef_[0].tolist(), intercept=float(rule.intercept_[0]), iterations=rule.n_iter_.tolist())
        elif name == "bayes":
            state.update(kind="gaussian", mean=rule.theta_.tolist(), variance=rule.var_.tolist(), prior=rule.class_prior_.tolist(), epsilon=float(rule.epsilon_))
        elif name == "neighbor":
            state.update(kind="uniform-neighbor", training_features=rule._fit_X.tolist(), training_labels=np.asarray(raw_labels).tolist(),
                         neighbors=9, tie_order="squared distance, original row ID")
        else:
            raise ValueError("unknown fixed base")
        states.append(state)
    return states


def portable_base(state, features):
    x = np.asarray(features, dtype=float)
    if "scaler" in state:
        x = (x - np.asarray(state["scaler"]["mean"])) / np.asarray(state["scaler"]["scale"])
    details = {}
    if state["kind"] == "binary-logistic":
        score = x @ np.asarray(state["coefficients"]) + state["intercept"]
        positive = oof.newton.sigmoid(score)
        native = np.column_stack((1-positive, positive))
        details["scores"] = score
    elif state["kind"] == "gaussian":
        mean, variance, prior = np.asarray(state["mean"]), np.asarray(state["variance"]), np.asarray(state["prior"])
        if np.any(variance <= 0) or np.any(prior <= 0):
            raise ValueError("saved Gaussian variance/prior must be positive")
        joint = np.log(prior)[None, :] - .5 * (np.log(2*np.pi*variance).sum(axis=1)[None, :] + ((x[:, None, :] - mean[None, :, :])**2 / variance[None, :, :]).sum(axis=2))
        native = np.exp(joint - logsumexp(joint, axis=1)[:, None])
        details["joint_log_scores"] = joint
    else:
        train, labels, ids = np.asarray(state["training_features"]), np.asarray(state["training_labels"]), np.asarray(state["fit_ids"])
        selected, native = [], []
        for query in x:
            distances = ((train - query)**2).sum(axis=1)
            order = np.lexsort((ids, distances))[:state["neighbors"]]
            selected.append(ids[order].tolist())
            native.append([np.mean(labels[order] == identity) for identity in state["classes"]])
        native = np.asarray(native)
        details["selected_neighbor_ids"] = selected
    return oof.combination.align_probabilities(native, state["classes"], [0, 1])[:, 1], details


def bundle_checksum(bundle):
    payload = {key: value for key, value in bundle.items() if key != "checksum"}
    return hashlib.sha256(json.dumps(json_ready(payload), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def validate_bundle(bundle):
    if bundle.get("schema_version") != 1:
        raise ValueError("unknown saved schema version")
    if bundle.get("checksum") != bundle_checksum(bundle):
        raise ValueError("whole-state checksum differs")
    if bundle["class_order"] != [0, 1] or bundle["meta_column_order"] != ["line:P(class=1)", "bayes:P(class=1)", "neighbor:P(class=1)"]:
        raise ValueError("stale class/meta schema")
    if len(bundle["feature_order"]) != 30 or len(set(bundle["feature_order"])) != 30:
        raise ValueError("feature schema must name 30 unique columns")
    schema_hash = hashlib.sha256(json.dumps(bundle["feature_order"], separators=(",", ":")).encode()).hexdigest()
    if schema_hash != bundle["feature_schema_sha256"]:
        raise ValueError("feature columns changed without a corresponding saved parameter schema")
    for group in ["full_bases", "blend_bases"]:
        if [state["name"] for state in bundle[group]] != ["line", "bayes", "neighbor"]:
            raise ValueError("saved member order differs")
        for state in bundle[group]:
            if state["classes"] != [0, 1] or len(set(state["fit_ids"])) != len(state["fit_ids"]):
                raise ValueError("saved class/row identities differ")
            if "scaler" in state:
                mean, scale = np.asarray(state["scaler"]["mean"]), np.asarray(state["scaler"]["scale"])
                if mean.shape != (30,) or scale.shape != (30,) or not np.isfinite(mean).all() or not np.isfinite(scale).all() or np.any(scale <= 0):
                    raise ValueError("invalid saved scaler")
            if state["kind"] == "binary-logistic":
                if np.asarray(state["coefficients"]).shape != (30,) or not np.isfinite(np.r_[state["coefficients"], state["intercept"]]).all():
                    raise ValueError("invalid saved linear coefficients")
            elif state["kind"] == "gaussian":
                mean, variance = np.asarray(state["mean"]), np.asarray(state["variance"])
                if mean.shape != (2, 30) or variance.shape != (2, 30) or not np.isfinite(mean).all() or not np.isfinite(variance).all() or np.any(variance <= 0):
                    raise ValueError("invalid saved Gaussian arrays")
                prior = np.asarray(state["prior"])
                if prior.shape != (2,) or not np.isfinite(prior).all() or np.any(prior <= 0) or abs(prior.sum()-1) > 1e-10:
                    raise ValueError("invalid saved Gaussian priors")
            elif state["kind"] == "uniform-neighbor":
                train, labels = np.asarray(state["training_features"]), np.asarray(state["training_labels"])
                if train.shape != (len(state["fit_ids"]), 30) or len(train) < 9 or labels.shape != (len(train),) or not np.isfinite(train).all() or not np.isin(labels, [0, 1]).all() or state["neighbors"] != 9:
                    raise ValueError("invalid saved neighbor arrays")
            else:
                raise ValueError("unknown saved base kind")
    if not 0 <= bundle["prior"] <= 1 or not 0 <= bundle["threshold"] <= 1:
        raise ValueError("invalid prior/threshold")
    if np.asarray(bundle["simplex_weights"]).shape != (3,) or not np.isfinite(bundle["simplex_weights"]).all() or np.min(bundle["simplex_weights"]) < 0 or abs(sum(bundle["simplex_weights"])-1) > 1e-10:
        raise ValueError("invalid simplex weights")
    for key in ["stack_theta", "blend_theta"]:
        if np.asarray(bundle[key]).shape != (4,) or not np.isfinite(bundle[key]).all():
            raise ValueError("invalid saved meta parameters")


def portable_forward(bundle, features, feature_order):
    validate_bundle(bundle)
    x = np.asarray(features, dtype=float)
    if list(feature_order) != bundle["feature_order"] or x.ndim != 2 or x.shape[1] != 30 or not np.isfinite(x).all():
        raise ValueError("query feature order/values differ from the saved contract")
    full = [portable_base(state, x) for state in bundle["full_bases"]]
    blend = [portable_base(state, x) for state in bundle["blend_bases"]]
    p, holdout_p = np.column_stack([row[0] for row in full]), np.column_stack([row[0] for row in blend])
    result = {"prior": np.full(len(x), bundle["prior"]), "line": p[:, 0], "bayes": p[:, 1], "neighbor": p[:, 2],
              "soft": p.mean(axis=1), "simplex": p @ bundle["simplex_weights"],
              "stack": oof.newton.sigmoid(np.column_stack((np.ones(len(x)), p)) @ bundle["stack_theta"]),
              "blend": oof.newton.sigmoid(np.column_stack((np.ones(len(x)), holdout_p)) @ bundle["blend_theta"])}
    return {"predictions": result, "full_intermediates": [row[1] for row in full], "blend_intermediates": [row[1] for row in blend]}


def metrics(y, p):
    p = np.asarray(p)
    return {"log_loss": log_loss(y, np.column_stack((1-p, p)), labels=[0, 1]), "Brier": brier_score_loss(y, p),
            "accuracy_at_half": accuracy_score(y, p >= .5), "confusion_at_half": confusion_matrix(y, p >= .5, labels=[0, 1]),
            "exact_zero_count": int(np.sum(p == 0)), "exact_one_count": int(np.sum(p == 1)), "log_loss_clip_epsilon": np.finfo(p.dtype).eps}


def threshold_choice(y, p):
    candidates = np.unique(np.r_[0., p, 1.])
    scores = []
    for threshold in candidates:
        tn, fp, fn, tp = confusion_matrix(y, p >= threshold, labels=[0, 1]).ravel()
        scores.append((int(fp + 4*fn), float(threshold)))
    return min(scores)


def library_serving_contract(fitted, theta, query):
    """Use ordinary prediction methods with captured fitted state; no refits.

    N2 separately demonstrates actual StackingClassifier.fit with matched OOF.
    Here restoration is explicit rather than disguising in-sample prefit training
    as the measured OOF stack, or rerunning the real-data fitting campaign.
    """
    vote = VotingClassifier(estimators=fitted, voting="soft")
    vote.estimators_ = [base for _, base in fitted]
    vote.le_ = LabelEncoder().fit([0, 1])
    vote.classes_ = np.array([0, 1])
    stack = StackingClassifier(estimators=fitted)
    stack.estimators_ = vote.estimators_
    stack.stack_method_ = ["predict_proba"] * 3
    stack.classes_ = np.array([0, 1])
    stack._label_encoder = vote.le_
    final = LogisticRegression()
    final.classes_, final.coef_, final.intercept_, final.n_features_in_ = np.array([0, 1]), np.asarray(theta[1:])[None, :], np.array([theta[0]]), 3
    stack.final_estimator_ = final
    return vote.predict_proba(query)[:, 1], stack.predict_proba(query)[:, 1], stack.transform(query)


def run_study(csv_path, protocol_path, output):
    x, y, protocol, roles = preflight(csv_path, protocol_path)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    started = output / "execution-started.json"
    # Exclusive creation is the once-only guard. Retain a failure instead of replay.
    with started.open("x", encoding="utf8") as stream:
        json.dump({"program_sha256": digest(__file__), "csv_sha256": digest(csv_path), "protocol_sha256": digest(protocol_path)}, stream, indent=2)
    train, validation, test = roles["train"], roles["validation"], roles["test"]
    base_rows, meta_rows = roles["blendBase"], roles["blendMeta"]
    bases = base_prototypes()
    with warnings.catch_warnings(record=True) as notices:
        warnings.simplefilter("always")
        splits = list(StratifiedKFold(3, shuffle=True, random_state=97).split(x[train], y[train]))
        honest = oof.build_oof(x[train], y[train], bases, splits, row_ids=train, class_order=[0, 1])
        simplex = oof.combination.fit_square_combiner(honest["matrix"], y[train], strength=.01)
        stack_meta = oof.fit_binary_meta(honest["matrix"], y[train], strength=.1)
        full_state = oof.full_refit_state(x[train], y[train], bases, honest)
        kept_bases = [(name, clone(base).fit(x[base_rows], y[base_rows])) for name, base in bases]
        kept = {**full_state, "bases": kept_bases, "fit_ids": base_rows.tolist()}
        blend_meta = oof.fit_binary_meta(oof.full_refit_columns(kept, x[meta_rows]), y[meta_rows], strength=.1)
        prior = float(y[train].mean())
        bundle = {"schema_version": 1, "feature_order": protocol["featureNames"], "class_order": [0, 1], "positive_class": "malignant",
                  "feature_schema_sha256": hashlib.sha256(json.dumps(protocol["featureNames"], separators=(",", ":")).encode()).hexdigest(),
                  "meta_column_order": honest["column_order"], "full_bases": snapshot_bases(full_state["bases"], train, y[train]),
                  "blend_bases": snapshot_bases(kept_bases, base_rows, y[base_rows]), "prior": prior,
                  "simplex_weights": simplex["weights"], "stack_theta": stack_meta["theta"], "blend_theta": blend_meta["theta"],
                  "threshold": .5, "selected_id": None, "source": {"program_sha256": digest(__file__), "csv_sha256": digest(csv_path)},
                  "versions": {"python": platform.python_version(), "numpy": np.__version__, "scipy": scipy.__version__, "sklearn": sklearn.__version__}}
        def measured_predictions(rows):
            p = oof.full_refit_columns(full_state, x[rows])
            return {"prior": np.full(len(rows), prior), "line": p[:, 0], "bayes": p[:, 1], "neighbor": p[:, 2], "soft": p.mean(axis=1),
                    "simplex": p @ simplex["weights"], "stack": oof.binary_forward(full_state, stack_meta, x[rows])["probabilities"][:, 1],
                    "blend": oof.binary_forward(kept, blend_meta, x[rows])["probabilities"][:, 1]}
        valid_predictions = measured_predictions(validation)
        valid_results = {name: metrics(y[validation], p) for name, p in valid_predictions.items()}
        selected = min(valid_results, key=lambda name: (valid_results[name]["log_loss"], name))
        cost, threshold = threshold_choice(y[validation], valid_predictions[selected])
        bundle.update(selected_id=selected, threshold=threshold)
        bundle = json_ready(bundle)
        bundle["checksum"] = bundle_checksum(bundle)
        validate_bundle(bundle)
        save_json(output / "selection-frozen-before-test.json", {"selected_id": selected, "threshold": threshold, "validation_cost": cost, "bundle": bundle, "validation": valid_results})
        # The fitted rule and threshold are frozen before test predictions/metrics.
        test_predictions = measured_predictions(test)
        test_results = {name: metrics(y[test], p) for name, p in test_predictions.items()}
        chosen_confusion = confusion_matrix(y[test], test_predictions[selected] >= threshold, labels=[0, 1])
        tn, fp, fn, tp = chosen_confusion.ravel()
        save_json(output / "serving-bundle.json", bundle)
        reloaded = json.loads((output / "serving-bundle.json").read_text())
        query = np.vstack((x[train[0]], x[train[0]].copy(), np.zeros(30), np.full(30, 1e6), np.full(30, -1e6)))
        query[1, 0] += .123
        portable = portable_forward(reloaded, query, protocol["featureNames"])
        native_on_query_full = oof.full_refit_columns(full_state, query)
        vote_p, stack_p, stack_columns = library_serving_contract(full_state["bases"], stack_meta["theta"], query)
        contract = {"ordinary_vote_difference": float(np.max(np.abs(vote_p - native_on_query_full.mean(axis=1)))),
                    "ordinary_stack_difference": float(np.max(np.abs(stack_p - oof.newton.sigmoid(np.column_stack((np.ones(len(query)), native_on_query_full)) @ stack_meta["theta"])))),
                    "ordinary_transform_difference": float(np.max(np.abs(stack_columns - native_on_query_full))),
                    "portable_base_query_differences": {name: float(np.max(np.abs(portable["predictions"][name] - native_on_query_full[:, i]))) for i, name in enumerate(["line", "bayes", "neighbor"])},
                    "portable_neighbor_ties": "row-ID tie convention; divergences are retained, measured outcomes stay library outcomes"}
        invalid_schema_rejected = False
        try:
            portable_forward(reloaded, query, list(reversed(protocol["featureNames"])))
        except ValueError:
            invalid_schema_rejected = True
        receipt = {"program_sha256": digest(__file__), "dependencies": {name: digest(Path(__file__).with_name(name)) for name in ["ensemble-oof-state.py", "ensemble-combination-core.py", "newton-logistic.py"]},
                   "versions": bundle["versions"], "CSV": protocol["offlineCSV"], "matrix_sha256": protocol["dataMatrixSHA256"], "labels_sha256": protocol["labelsSHA256"],
                   "roles": roles, "OOF_audit": honest["audit"], "OOF_coverage": honest["coverage"], "OOF_matrix": honest["matrix"],
                   "full_fit_ids": train, "blend_base_fit_ids": base_rows, "blend_meta_fit_ids": meta_rows, "simplex_solver": simplex,
                   "stack_solver": stack_meta, "blend_solver": blend_meta, "validation_predictions": valid_predictions, "validation": valid_results,
                   "test_predictions": test_predictions, "test": test_results, "selected_id": selected, "threshold": threshold,
                   "selected_test_confusion": chosen_confusion, "selected_test_cost": int(fp + 4*fn), "contract": contract,
                   "changed_queries": query, "portable_changed_query_forward": portable, "invalid_schema_rejected": invalid_schema_rejected,
                   "warnings": [{"category": item.category.__name__, "message": str(item.message)} for item in notices],
                   "limits": "one random-row split; no entity/time or clinical validation; no uncertainty interval; portable queries are computations, not specimens"}
        save_json(output / "execution-receipt.json", receipt)
        np.savez_compressed(output / "prediction-arrays.npz", OOF=honest["matrix"], **{f"validation_{name}": p for name, p in valid_predictions.items()}, **{f"test_{name}": p for name, p in test_predictions.items()})
        strongest = min(["line", "bayes", "neighbor"], key=lambda name: (valid_results[name]["log_loss"], name))
        print("roles", {name: len(ids) for name, ids in roles.items()}, "positive class malignant=1")
        for name in sorted(valid_results):
            print(name, "validation", json_ready(valid_results[name]), "test", json_ready(test_results[name]))
        print("validation winner", selected, "strongest single", strongest, "prior", prior)
        print("threshold", threshold, "validation cost", cost, "test confusion", chosen_confusion.tolist(), "test cost", int(fp + 4*fn))
        print("simplex weights/mapping", simplex["weights"], simplex["gradient_mapping_inf"])
        print("stack theta/gradient", stack_meta["theta"], stack_meta["gradient"])
        print("blend theta/gradient", blend_meta["theta"], blend_meta["gradient"])
        print("serving contract", contract, "schema rejected", invalid_schema_rejected)
        print("warnings", receipt["warnings"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    owner = Path(__file__).resolve().parents[2] / "classical-ml-reading-flow/ensemble-methods-stacking"
    parser.add_argument("--csv", type=Path, default=owner / "proposed-data/wdbc-sklearn-1.9.1.csv")
    parser.add_argument("--protocol", type=Path, default=owner / "reading-flow-proposed-data.json")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--run-study", action="store_true")
    args = parser.parse_args()
    if args.run_study:
        if args.output is None:
            parser.error("--run-study requires a fresh explicit --output directory")
        run_study(args.csv, args.protocol, args.output)
    else:
        x, y, protocol, roles = preflight(args.csv, args.protocol)
        print("preflight only: no fit", x.shape, "class counts", np.bincount(y), "roles", {name: len(ids) for name, ids in roles.items()})


if __name__ == "__main__":
    main()
