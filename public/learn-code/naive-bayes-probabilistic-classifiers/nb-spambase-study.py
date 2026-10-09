"""One predeclared offline Spambase study. Run beside the two quiet helpers.

Selection uses validation log loss, then a saved lock precedes all test reports.
No train+validation refit occurs. Existing output files prevent accidental replay.
"""
import hashlib
import json
from pathlib import Path
import warnings
import numpy as np
import scipy
import sklearn
from sklearn.exceptions import ConvergenceWarning
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import GroupShuffleSplit
from sklearn.naive_bayes import BernoulliNB, GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from nb_discrete_core import BernoulliModel
from nb_gaussian_online import GaussianOnline


FILES = {
    "spambase.data": "b1ef93de71f97714d3d7d4f58fc9f718da7bbc8ac8a150eff2778616a8097b12",
    "spambase.names": "df418fab7923f929237b81efa0987ddfaf2d68cf61291243625aadc684d5ab6a",
    "spambase.DOCUMENTATION": "462e4ffba1241a5962d528364708d188dc75931d56a25a8e9b6c8bb25e094cfd",
}
ROLE_HASHES = {
    "train": "38f7b8e9e582114f5432c48df04a7f70731172b692f008fd4c0f069c69808d05",
    "validation": "9a3f6e12d3f71e9edb46f7785a6d51b28c86f163806b63938ddb2abc64862c3d",
    "test": "e057b4cdd8d3f97990c4031925635179b22142f44789f14fb4205d100cfe242a",
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    # Exclusive creation preserves a completed or interrupted scientific run.
    with path.open("x", encoding="utf-8") as output:
        json.dump(value, output, indent=2, allow_nan=False)
        output.write("\n")


def load_offline(directory):
    for name, expected in FILES.items():
        if digest((directory / name).read_bytes()) != expected:
            raise ValueError("Official input identity differs: " + name)
    for name in ("spambase-provenance.md", "SPAMBASE-LICENSE.txt"):
        if not (directory / name).is_file():
            raise FileNotFoundError(name)
    rows = np.loadtxt(directory / "spambase.data", delimiter=",")
    if rows.shape != (4601, 58) or not np.isfinite(rows).all() or (rows < 0).any():
        raise ValueError("Expected the finite, nonnegative official payload")
    X, y = rows[:, :57], rows[:, 57].astype(int)
    if not np.array_equal(rows[:, 57], y) or set(y) != {0, 1}:
        raise ValueError("Labels must be ham=0 and spam=1")
    names = [line.split(":")[0].strip() for line in (directory / "spambase.names").read_text().splitlines()
             if not line.lstrip().startswith("|") and ":" in line and line.split(":", 1)[1].strip() == "continuous."]
    if len(names) != 57 or len(set(names)) != 57:
        raise ValueError("Expected 57 named numeric columns in official order")
    return X, y, names


def grouped_roles(X, y):
    _, groups = np.unique(X, axis=0, return_inverse=True)
    development, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=71).split(X, y, groups))
    ti, vi = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=73).split(
        X[development], y[development], groups[development]))
    roles = {"train": development[ti], "validation": development[vi], "test": test}
    for name, indices in roles.items():
        if digest(np.asarray(indices, dtype="<i8").tobytes()) != ROLE_HASHES[name]:
            raise ValueError("Predeclared split identity differs: " + name)
        if set(y[indices]) != {0, 1}:
            raise ValueError("Both classes are required in every role")
    sets = [set(groups[i]) for i in roles.values()]
    if any(sets[a] & sets[b] for a, b in ((0, 1), (0, 2), (1, 2))):
        raise ValueError("An exact feature group crosses roles")
    if sorted(np.concatenate(list(roles.values()))) != list(range(len(X))):
        raise ValueError("Rows must be retained exactly once")
    conflicts = sum(len(set(y[groups == g])) > 1 for g in range(groups.max() + 1))
    return roles, {"unique_feature_groups": int(groups.max() + 1), "conflicting_label_groups": conflicts,
                   "roles": {name: {"rows": len(i), "class_counts": np.bincount(y[i]).tolist(),
                                    "indices_sha256": ROLE_HASHES[name]} for name, i in roles.items()}}


def representation(X, name):
    if name == "presence54":
        return (X[:, :54] > 0).astype(float)
    return np.log1p(X) if name == "log1p57" else X


def metrics(y, logp):
    if logp.shape != (len(y), 2) or not np.isfinite(logp).all():
        raise ValueError("Use finite normalized log probabilities in [ham, spam] order")
    p = np.exp(logp)
    if not np.allclose(p.sum(axis=1), 1, atol=1e-10):
        raise ValueError("Probabilities are not normalized")
    prediction = logp.argmax(axis=1)  # Exact ties choose ham.
    precision, recall, f1, support = precision_recall_fscore_support(y, prediction, labels=[0, 1], zero_division=0)
    action = p[:, 1] > .8  # Equal costs at the threshold choose the negative action.
    return {"log_loss": float(-logp[np.arange(len(y)), y].mean()),
            "accuracy": float(accuracy_score(y, prediction)),
            "balanced_accuracy": float(balanced_accuracy_score(y, prediction)),
            "Brier": float(np.mean((p[:, 1] - y) ** 2)),
            "confusion_ham_spam": confusion_matrix(y, prediction, labels=[0, 1]).tolist(),
            "precision": precision.tolist(), "recall": recall.tolist(), "f1": f1.tolist(),
            "support": support.tolist(), "positive_actions_at_08": int(action.sum()),
            "cost_4_to_1_at_08": float(np.mean(4 * (action & (y == 0)) + (~action & (y == 1))))}


def candidates():
    configurations = []
    for rep in ("raw57", "log1p57"):
        for smoothing in (1e-11, 1e-9, 1e-7):
            configurations.append({"family": "Gaussian", "representation": rep, "var_smoothing": smoothing})
    for alpha in (.1, 1., 10.):
        configurations.append({"family": "Bernoulli", "representation": "presence54", "alpha": alpha})
    for C in (.1, 1., 10.):
        configurations.append({"family": "logistic", "representation": "raw57", "C": C})
    return [{"id": "candidate_" + str(j + 1).zfill(2), **c} for j, c in enumerate(configurations)]


def estimator(configuration):
    if configuration["family"] == "Gaussian":
        return Pipeline([("scale", StandardScaler()), ("model", GaussianNB(var_smoothing=configuration["var_smoothing"]))])
    if configuration["family"] == "Bernoulli":
        return BernoulliNB(alpha=configuration["alpha"], force_alpha=True, binarize=None)
    # sklearn 1.9: l1_ratio=0 selects L2; the old penalty parameter is deprecated.
    return Pipeline([("scale", StandardScaler()), ("model", LogisticRegression(
        C=configuration["C"], l1_ratio=0., solver="lbfgs", max_iter=2000, tol=1e-6))])


def choose(outcomes, family=None):
    eligible = [r for r in outcomes if r["eligible"] and (family is None or r["configuration"]["family"] == family)]
    if not eligible:
        raise ValueError("No eligible candidate for " + str(family))
    winner = eligible[0]
    for row in eligible[1:]:
        if row["validation"]["log_loss"] < winner["validation"]["log_loss"] - 1e-12:
            winner = row
    return winner["configuration"]["id"]


def export_model(configuration, fitted, names):
    rep = configuration["representation"]
    state = {"format": "spambase-frozen-v1", "configuration": configuration,
             "raw_schema": names, "classes": [0, 1], "representation": rep}
    model = fitted.named_steps["model"] if isinstance(fitted, Pipeline) else fitted
    if isinstance(fitted, Pipeline):
        scaler = fitted.named_steps["scale"]
        state["scaler"] = {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
                           "variance": scaler.var_.tolist(), "training_rows": int(scaler.n_samples_seen_)}
    if configuration["family"] == "Gaussian":
        raw_var = model.var_ - model.epsilon_
        scratch = {"format": "nb-gaussian-M2-v1", "classes": model.classes_.tolist(), "schema": names,
                   "units": ["standardized " + rep] * 57, "variance_floor": [float(model.epsilon_)] * 57,
                   "class_count": model.class_count_.tolist(), "mean": model.theta_.tolist(),
                   "M2": (raw_var * model.class_count_[:, None]).tolist(), "priors": model.class_prior_.tolist()}
        state["scratch"] = scratch
        state["library"] = {"theta": model.theta_.tolist(), "variance": model.var_.tolist(),
                            "epsilon": float(model.epsilon_), "class_prior": model.class_prior_.tolist()}
    elif configuration["family"] == "Bernoulli":
        state["scratch"] = {"format": "nb-discrete-v1", "family": "bernoulli", "alpha": model.alpha,
                            "schema": names[:54], "classes": model.classes_.tolist(),
                            "class_count": model.class_count_.tolist(), "priors": None,
                            "feature_count": model.feature_count_.tolist()}
        state["library"] = {"feature_log_prob": model.feature_log_prob_.tolist(), "class_log_prior": model.class_log_prior_.tolist()}
    else:
        state["coefficients"] = model.coef_.tolist()
        state["intercept"] = model.intercept_.tolist()
        state["iterations"] = model.n_iter_.tolist()
    return state


def saved_log_proba(state, raw, names):
    raw = np.asarray(raw, dtype=float)
    if names != state["raw_schema"] or raw.ndim != 2 or raw.shape[1] != 57 or not np.isfinite(raw).all() or (raw < 0).any():
        raise ValueError("Use finite nonnegative raw features in the exact saved schema")
    X = representation(raw, state["representation"])
    if "scaler" in state:
        X = (X - np.array(state["scaler"]["mean"])) / np.array(state["scaler"]["scale"])
    family = state["configuration"]["family"]
    if family == "Gaussian":
        return GaussianOnline.from_state(state["scratch"], names).predict_log_proba(X)
    if family == "Bernoulli":
        return BernoulliModel.from_state(state["scratch"], names[:54]).predict_log_proba(X)
    odds = X @ np.array(state["coefficients"])[0] + state["intercept"][0]
    return np.column_stack((-np.logaddexp(0, odds), -np.logaddexp(0, -odds)))


def report_log_proba(model, X, family):
    # Some logistic probability implementations round a saturated probability
    # to zero before logging. Its decision score still defines finite log odds.
    if family == "logistic":
        odds = model.decision_function(X)
        return np.column_stack((-np.logaddexp(0, odds), -np.logaddexp(0, -odds)))
    return model.predict_log_proba(X)


def main():
    directory = Path(__file__).resolve().parent
    outputs = [directory / n for n in ("spambase-study-start.json", "spambase-validation-lock.json",
                                       "spambase-study-results.json", "spambase-frozen-state.json")]
    if any(p.exists() for p in outputs):
        raise FileExistsError("Study output already exists; inspect it instead of repeating this run")
    X, y, names = load_offline(directory)
    roles, grouping = grouped_roles(X, y)
    train, validation = roles["train"], roles["validation"]
    configurations = candidates()
    source_hashes = {n: digest((directory / n).read_bytes()) for n in
                     ("nb-spambase-study.py", "nb_discrete_core.py", "nb_gaussian_online.py")}
    protocol = {"candidate_order": configurations, "selection": "validation mean negative log probability; tie tolerance 1e-12, first",
                "refit": False, "class_order": [0, 1], "loss": "unclipped finite native log probabilities",
                "versions": {"numpy": np.__version__, "scipy": scipy.__version__, "sklearn": sklearn.__version__},
                "data_hashes": FILES, "sources": source_hashes, "grouping": grouping}
    save_new(outputs[0], protocol)
    outcomes, fitted = [], {}
    for c in configurations:
        record = {"configuration": c, "warnings": [], "eligible": False}
        caught = []
        try:
            model = estimator(c)
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                model.fit(representation(X[train], c["representation"]), y[train])
                logp = model.predict_log_proba(representation(X[validation], c["representation"]))
            record["warnings"] = [{"type": w.category.__name__, "message": str(w.message)} for w in caught]
            record["validation"] = metrics(y[validation], logp)
            terminal = model.named_steps["model"] if isinstance(model, Pipeline) else model
            record["iterations"] = terminal.n_iter_.tolist() if hasattr(terminal, "n_iter_") else None
            record["eligible"] = not any(issubclass(w.category, ConvergenceWarning) for w in caught)
            if record["iterations"] is not None and max(record["iterations"]) >= 2000:
                record["eligible"] = False
            fitted[c["id"]] = model
        except Exception as error:
            record["failure"] = {"type": type(error).__name__, "message": str(error)}
        record["warnings"] = [{"type": w.category.__name__, "message": str(w.message)} for w in caught]
        outcomes.append(record)
    lock = {"protocol": protocol, "all_validation_outcomes": outcomes,
            "overall_winner": choose(outcomes),
            "family_winners": {family: choose(outcomes, family) for family in ("Gaussian", "Bernoulli", "logistic")}}
    save_new(outputs[1], lock)  # This file exists before any test predictions or metrics.
    lock_hash = digest(outputs[1].read_bytes())
    states = {identifier: export_model(next(c for c in configurations if c["id"] == identifier), fitted[identifier], names)
              for identifier in lock["family_winners"].values()}
    save_new(outputs[3], {"validation_lock_sha256": lock_hash, "models": states})
    reloaded = json.loads(outputs[3].read_text())["models"]
    test = roles["test"]
    prior = np.bincount(y[train], minlength=2) / len(train)
    reports = {"prior": metrics(y[test], np.tile(np.log(prior), (len(test), 1)))}
    predictions, parity = {}, {}
    # Legal edited raw vector: supplied feature statistics, no observed outcome.
    edited = np.zeros((1, 57)); edited[0, 0] = 1.; edited[0, 54:] = [2., 4., 8.]
    for family, identifier in lock["family_winners"].items():
        model = fitted[identifier]
        c = states[identifier]["configuration"]
        native = report_log_proba(model, representation(X[test], c["representation"]), family)
        restored = saved_log_proba(reloaded[identifier], X[test], names)
        delta = float(np.max(np.abs(native - restored)))
        if not np.allclose(native, restored, atol=2e-9, rtol=2e-12):
            raise AssertionError("Saved inference mismatch: " + identifier)
        edited_native = report_log_proba(model, representation(edited, c["representation"]), family)
        edited_saved = saved_log_proba(reloaded[identifier], edited, names)
        if not np.allclose(edited_native, edited_saved, atol=2e-9, rtol=2e-12):
            raise AssertionError("Edited saved inference mismatch")
        reports[family] = {"candidate": identifier, **metrics(y[test], native)}
        predictions[family] = {"row_indices": test.tolist(), "labels": y[test].tolist(), "log_probabilities": native.tolist()}
        parity[family] = {"max_test_log_difference": delta,
                          "edited_raw_case": edited[0].tolist(), "edited_probabilities": np.exp(edited_saved).tolist()}
    results = {**lock, "validation_lock_sha256": lock_hash, "test_reports": reports,
               "test_predictions": predictions, "reload_parity": parity,
               "state_sha256": digest(outputs[3].read_bytes()), "train_only_models_retained": True}
    save_new(outputs[2], results)
    print(json.dumps({"all_validation_outcomes": outcomes, "overall_winner": lock["overall_winner"],
                      "family_winners": lock["family_winners"], "test_reports": reports,
                      "reload_parity": parity, "validation_lock_sha256": lock_hash,
                      "results_sha256": digest(outputs[2].read_bytes()),
                      "state_sha256": results["state_sha256"]}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
