"""Portable CSV clustering: training-owned geometry, validation selection, test once."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from clustering_core import assign_chunked


def read_csv(path, features, id_column="row_id", split_column="split", excluded=()):
    if not features or len(set(features)) != len(features):
        raise ValueError("Declare a nonempty list of distinct feature columns.")
    forbidden = {id_column, split_column, *excluded}
    if forbidden.intersection(features):
        raise ValueError("ID, split-role and explicitly excluded target columns cannot be features.")
    with Path(path).open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {id_column, split_column, *features}
        if reader.fieldnames is None or len(set(reader.fieldnames)) != len(reader.fieldnames):
            raise ValueError("Supply a header with unique column names.")
        missing = required - set(reader.fieldnames)
        if missing:
            raise ValueError("Missing CSV columns: " + ", ".join(sorted(missing)))
        records = list(reader)
    ids, roles, values = [], [], []
    for line, record in enumerate(records, start=2):
        if None in record or any(record[name] is None for name in required):
            raise ValueError(f"CSV row {line} has an inconsistent field count.")
        identity = record[id_column].strip()
        role = record[split_column].strip()
        if not identity or role not in {"train", "validation", "test"}:
            raise ValueError(f"CSV row {line} needs a nonempty ID and train/validation/test role.")
        try:
            row = [float(record[name]) for name in features]
        except ValueError as error:
            raise ValueError(f"CSV row {line} has a nonnumeric declared feature.") from error
        if not np.isfinite(row).all():
            raise ValueError(f"CSV row {line} has a nonfinite declared feature.")
        ids.append(identity)
        roles.append(role)
        values.append(row)
    if not records or len(set(ids)) != len(ids):
        raise ValueError("CSV IDs must be unique and at least one row must exist.")
    values = np.array(values, dtype=float)
    result = {}
    for role in ["train", "validation", "test"]:
        indices = [i for i, value in enumerate(roles) if value == role]
        if not indices:
            raise ValueError("Every declared split must contain at least one row.")
        result[role] = {"ids": [ids[i] for i in indices], "values": values[indices]}
    return result


def select_candidate(training, validation, candidates, seed=7, min_group=2):
    if (not candidates or len(set(candidates)) != len(candidates)
            or any(not isinstance(k, int) or not 2 <= k <= len(training) for k in candidates)):
        raise ValueError("Declare distinct integer k values between two and the training-row count.")
    if len(validation) < 3 or not isinstance(min_group, int) or min_group < 1:
        raise ValueError("Use at least three validation rows and a positive minimum training-group size.")
    outcomes, systems = [], {}
    for k in sorted(candidates):
        pipeline = make_pipeline(StandardScaler(), KMeans(
            n_clusters=k, random_state=seed, n_init=10, algorithm="lloyd", max_iter=300, tol=1e-4))
        pipeline.fit(training)
        scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
        transformed = scaler.transform(validation)
        labels, distances = assign_chunked(transformed, model.cluster_centers_)
        train_counts = np.bincount(model.labels_, minlength=k)
        valid_count = len(np.unique(labels))
        silhouette = (float(silhouette_score(transformed, labels))
                      if 2 <= valid_count < len(validation) else None)
        eligible = bool((train_counts >= min_group).all() and silhouette is not None)
        outcomes.append({"k": k, "training_counts": train_counts.tolist(),
                         "validation_counts": np.bincount(labels, minlength=k).tolist(),
                         "validation_mean_squared_distance": float(distances.mean()),
                         "validation_silhouette": silhouette, "eligible": eligible})
        systems[k] = pipeline
    eligible = [row for row in outcomes if row["eligible"]]
    if not eligible:
        raise ValueError("No eligible candidate; declare a revised protocol before using test evidence.")
    chosen = max(eligible, key=lambda row: (row["validation_silhouette"], -row["k"]))
    # Selection is complete before any test row enters the scoring function.
    return {"selected_k": chosen["k"], "outcomes": outcomes,
            "pipeline": systems[chosen["k"]], "seed": seed, "min_group": min_group}


def evaluate_locked(selection, training, test):
    pipeline = selection["pipeline"]
    scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
    transformed = scaler.transform(test)
    labels, distances = assign_chunked(transformed, model.cluster_centers_)
    training_center = scaler.transform(training).mean(axis=0)
    baseline = np.sum((transformed - training_center) ** 2, axis=1)
    return {"test_mean_squared_distance": float(distances.mean()),
            "training_centroid_baseline": float(baseline.mean()),
            "test_group_counts": np.bincount(labels, minlength=selection["selected_k"]).tolist(),
            "test_labels": labels.tolist(),
            "centers_original_units": scaler.inverse_transform(model.cluster_centers_).tolist()}


def report(selection, evaluation, splits, input_path, features):
    scaler, model = selection["pipeline"].steps[0][1], selection["pipeline"].steps[1][1]
    return {"schema": 1, "input_sha256": hashlib.sha256(Path(input_path).read_bytes()).hexdigest(),
            "features": features, "split_ids": {role: part["ids"] for role, part in splits.items()},
            "settings": {"candidates": [row["k"] for row in selection["outcomes"]],
                         "seed": selection["seed"], "n_init": 10, "algorithm": "lloyd",
                         "max_iter": 300, "tol": 1e-4, "minimum_training_group": selection["min_group"],
                         "selection": "maximum eligible validation silhouette, then smaller k",
                         "refit_after_selection": False},
            "candidate_outcomes": selection["outcomes"], "selected_k": selection["selected_k"],
            "training_state": {"scaler_mean": scaler.mean_.tolist(), "scaler_scale": scaler.scale_.tolist(),
                               "centers_scaled": model.cluster_centers_.tolist()},
            "evaluation": evaluation}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--features", nargs="+", required=True)
    parser.add_argument("--features-known-before-outcome", action="store_true", required=True)
    parser.add_argument("--id-column", default="row_id")
    parser.add_argument("--split-column", default="split")
    parser.add_argument("--exclude", nargs="*", default=[])
    parser.add_argument("--k", nargs="+", type=int, default=[2, 3, 4])
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--min-group", type=int, default=2)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if args.output is not None:
        if args.output.resolve() == args.input.resolve():
            parser.error("Output must differ from the input CSV.")
        if args.output.exists() and not args.overwrite:
            parser.error("Output already exists; choose another path or explicitly use --overwrite.")
    try:
        splits = read_csv(args.input, args.features, args.id_column, args.split_column, args.exclude)
        selected = select_candidate(splits["train"]["values"], splits["validation"]["values"],
                                    args.k, args.seed, args.min_group)
        print("validation outcomes:", json.dumps(selected["outcomes"], sort_keys=True))
        print("locked k:", selected["selected_k"])
        evaluated = evaluate_locked(selected, splits["train"]["values"], splits["test"]["values"])
        result = report(selected, evaluated, splits, args.input, args.features)
    except ValueError as error:
        parser.error(str(error))
    if args.output is not None:
        with args.output.open("w" if args.overwrite else "x", encoding="utf-8") as stream:
            json.dump(result, stream, indent=2, sort_keys=True, allow_nan=False)
            stream.write("\n")
    print("final evaluation:", json.dumps(evaluated, sort_keys=True))


if __name__ == "__main__":
    main()
