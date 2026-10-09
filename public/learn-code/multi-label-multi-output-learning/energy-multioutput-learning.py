"""Inspect the recorded Energy result, or fit a separately declared own task.

Put energy_multioutput_core.py beside this file. --report/--query read the five
recorded assets bound by energy-recorded-assets.json; they never fit or write.
--fit-own uses a new CSV/task declaration and an absent output directory. It
refuses the published Energy CSV, so it cannot replay the recorded campaign.
"""

import argparse
import csv
import hashlib
import json
import warnings
from pathlib import Path

import numpy as np
from sklearn.exceptions import ConvergenceWarning

from energy_multioutput_core import (
    CATEGORICAL,
    CATEGORIES,
    candidate_table,
    choose,
    error_report,
    estimator,
    predict_saved,
    serialize_model,
)

HEADERS = [f"X{i}" for i in range(1, 9)] + ["Y1", "Y2"]
RECORDED_CSV_SHA256 = "e3a41dd2be081b420709f448fc1947e838aeb0f3e3994d8f396cedfa788fe1c3"


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8", errors="strict"))


def load_rows(path):
    """Read finite named rows without assuming the recorded 768-row layout."""
    with Path(path).open(encoding="utf-8", errors="strict", newline="") as stream:
        rows = list(csv.reader(stream))
    if not rows or rows[0] != HEADERS or len(rows) < 2:
        raise ValueError("CSV requires X1–X8/Y1–Y2 and at least one data row")
    if any(len(row) != 10 for row in rows[1:]):
        raise ValueError("every data row must have ten complete fields")
    values = np.asarray(rows[1:], dtype=float)
    if not np.isfinite(values).all():
        raise ValueError("CSV values must be finite")
    X, Y = values[:, :8], values[:, 8:]
    for column, legal in zip(CATEGORICAL, CATEGORIES):
        if not np.isin(X[:, column], legal).all():
            raise ValueError(f"X{column + 1} contains an unsupported category")
    if any(np.array_equal(X[:, j], Y[:, k]) for j in range(8) for k in range(2)):
        raise ValueError("an input duplicates a target")
    return X, Y


def load_bundle(directory):
    """Check the exact supplied files before reading a saved report or query."""
    directory = Path(directory)
    manifest = read_json(directory / "energy-recorded-assets.json")
    required = {
        "energy-efficiency.csv",
        "energy-efficiency-provenance.json",
        "energy-multioutput-results.json",
        "energy-multioutput-models.json",
        "energy-multioutput-selection-lock.json",
    }
    if set(manifest["files"]) != required:
        raise ValueError("recorded asset manifest must name exactly five files")
    for filename, expected in manifest["files"].items():
        if Path(filename).name != filename:
            raise ValueError("asset names must be flat filenames")
        if sha256(directory / filename) != expected:
            raise ValueError(f"recorded asset changed: {filename}")
    result = read_json(directory / "energy-multioutput-results.json")
    state = read_json(directory / "energy-multioutput-models.json")
    lock = read_json(directory / "energy-multioutput-selection-lock.json")
    provenance = read_json(directory / "energy-efficiency-provenance.json")
    if (
        result["lock"]["sha256"]
        != manifest["files"]["energy-multioutput-selection-lock.json"]
    ):
        raise ValueError("recorded result and selection lock disagree")
    if (
        result["model_state"]["sha256"]
        != manifest["files"]["energy-multioutput-models.json"]
    ):
        raise ValueError("recorded result and saved model state disagree")
    if state["roles"]["overall"] != lock["overall_fitted"] or lock["refit"]:
        raise ValueError("recorded roles or no-refit boundary disagree")
    if provenance["csv"]["sha256"] != manifest["files"]["energy-efficiency.csv"]:
        raise ValueError("CSV no longer matches its source provenance")
    return result, state, lock


def saved_report(bundle):
    """Read every measured outcome; no test-based reselection or new scoring."""
    result, _, lock = bundle
    rows = []
    for row in result["candidate_outcomes"] + [result["baseline"]]:
        rows.append(
            {
                "id": row["id"],
                "status": row["status"],
                "validation": row.get("validation"),
                "test": row.get("test"),
                "warnings": row.get("warnings", []),
                "failure": row.get("failure"),
            }
        )
    return {"locked_roles": lock, "recorded_outcomes": rows, "new_fits": 0}


def query_saved(bundle, directory, model_name, row_id, features):
    """One legal saved forward; observed truth stays outside the prediction."""
    _, state, _ = bundle
    model_id = state["roles"].get(model_name, model_name)
    if model_id not in state["models"]:
        raise ValueError("model must be a supplied saved ID or locked role")
    if features is None:
        X, _ = load_rows(Path(directory) / "energy-efficiency.csv")
        if row_id < 0 or row_id >= len(X):
            raise ValueError("source row ID is outside the recorded CSV")
        point = X[row_id : row_id + 1]
    else:
        point = np.asarray([[float(value) for value in features.split(",")]])
    prediction = predict_saved(state["models"][model_id], point)
    return {
        "model_id": model_id,
        "features_X1_to_X8": point[0].tolist(),
        "prediction_heating_cooling": prediction[0].tolist(),
        "new_fits": 0,
    }


def declared_task(task_path):
    """Set ownership and candidate choices before any estimator can fit."""
    task_path = Path(task_path)
    task = read_json(task_path)
    csv_path = task_path.parent / task["csv"]
    if sha256(csv_path) != task["csv_sha256"]:
        raise ValueError("own CSV differs from its declared byte identity")
    if sha256(csv_path) == RECORDED_CSV_SHA256:
        raise ValueError("fit-own cannot replay the recorded Energy dataset")
    if not task.get("source_meaning") or not task.get("licence"):
        raise ValueError("own data declaration requires source meaning and licence")
    X, Y = load_rows(csv_path)
    indices = {}
    for name in ("train", "validation", "test"):
        ids = task["row_ids"][name]
        if not ids or any(type(i) is not int or i < 0 or i >= len(X) for i in ids):
            raise ValueError("each partition requires valid nonempty integer row IDs")
        if len(set(ids)) != len(ids):
            raise ValueError("row IDs may not repeat inside a partition")
        indices[name] = np.asarray(ids)
    combined = np.concatenate(list(indices.values()))
    if len(combined) != len(X) or len(set(combined.tolist())) != len(X):
        raise ValueError("partitions must cover every row exactly once")
    _, ranks = np.unique(X[:, :5], axis=0, return_inverse=True)
    groups = {name: set(ranks[ids].tolist()) for name, ids in indices.items()}
    if any(
        groups[a] & groups[b]
        for a, b in [("train", "validation"), ("train", "test"), ("validation", "test")]
    ):
        raise ValueError("a geometry group crosses own-task partitions")
    scale = Y[indices["train"]].std(axis=0, ddof=0)
    if not np.isfinite(scale).all() or np.any(scale <= 0):
        raise ValueError("own-task training target scales must be positive")
    declared = task["candidate_ids"]
    table = {spec["id"]: spec for spec in candidate_table()}
    if (
        not declared
        or len(set(declared)) != len(declared)
        or any(i not in table for i in declared)
    ):
        raise ValueError("declare distinct IDs from the supplied fixed recipe table")
    return task, X, Y, indices, ranks, scale, [table[i] for i in declared]


def write_new(path, value):
    with Path(path).open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write("\n")


def fit_own(task_path, destination):
    """Ordinary independent-task fitting; validation locks before test scoring."""
    task, X, Y, indices, ranks, scale, specs = declared_task(task_path)
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=False)
    write_new(destination / "declared-task.json", task)
    train, validation, test = [
        indices[name] for name in ("train", "validation", "test")
    ]
    outcomes, fitted = [], {}
    for spec in specs:
        row = {**spec, "status": "failed", "validation": None, "test": None}
        try:
            model = estimator(spec)
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                model.fit(X[train], Y[train])
            row["warnings"] = [str(item.message) for item in caught]
            if any(issubclass(item.category, ConvergenceWarning) for item in caught):
                raise ValueError("own candidate emitted a convergence warning")
            row["train"] = error_report(
                Y[train], model.predict(X[train]), scale, ranks[train]
            )
            row["validation"] = error_report(
                Y[validation], model.predict(X[validation]), scale, ranks[validation]
            )
            row["status"] = "valid"
            fitted[spec["id"]] = model
        except Exception as error:
            row["failure"] = {"type": type(error).__name__, "message": str(error)}
        outcomes.append(row)
        write_new(destination / f"validation-{spec['id']}.json", row)
    winner = choose(outcomes, task["candidate_ids"])
    lock = {
        "overall": winner,
        "candidate_order": task["candidate_ids"],
        "objective": "mean output RMSE / own raw training standard deviation",
        "tie_absolute": 1e-12,
        "test_scored": False,
        "refit": False,
    }
    write_new(destination / "selection-lock.json", lock)
    # Test truths reach scoring only after the exclusive selection lock exists.
    for row in outcomes:
        if row["status"] == "valid":
            row["test"] = error_report(
                Y[test], fitted[row["id"]].predict(X[test]), scale, ranks[test]
            )
    selected = next(spec for spec in specs if spec["id"] == winner)
    state = serialize_model(fitted[winner], selected)
    state["training_rows"] = len(train)
    write_new(destination / "selected-state.json", state)
    result = {
        "task": task,
        "lock": lock,
        "outcomes": outcomes,
        "raw_training_target_scale": scale.tolist(),
        "refit": False,
    }
    write_new(destination / "results.json", result)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets", type=Path, default=Path(__file__).resolve().parent)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--report", action="store_true")
    modes.add_argument("--query", action="store_true")
    modes.add_argument("--fit-own", type=Path, metavar="TASK_JSON")
    parser.add_argument("--model", default="overall")
    parser.add_argument("--row", type=int, default=4)
    parser.add_argument("--features", help="eight X1–X8 values, comma separated")
    parser.add_argument("--output", type=Path, help="absent new directory for fit-own")
    args = parser.parse_args(argv)
    if args.fit_own:
        if args.output is None:
            parser.error("fit-own requires --output with an absent directory")
        result = fit_own(args.fit_own, args.output)
    else:
        bundle = load_bundle(args.assets)
        result = (
            saved_report(bundle)
            if args.report
            else query_saved(bundle, args.assets, args.model, args.row, args.features)
        )
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
