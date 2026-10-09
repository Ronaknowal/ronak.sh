"""Portable CSV task protocol; default is a declared deterministic teaching fixture."""
import argparse
import csv
from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, adjusted_rand_score


def load_csv(path, features, id_column="row_id", reference_column=None):
    if not features or len(set(features)) != len(features) or id_column in features or reference_column in features:
        raise ValueError("Declare distinct feature columns, excluding ID/reference.")
    with Path(path).open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {id_column, *features}
        if reference_column:
            required.add(reference_column)
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("CSV lacks a declared column.")
        rows = list(reader)
    ids = [row[id_column] for row in rows]
    if not ids or any(not value for value in ids) or len(set(ids)) != len(ids):
        raise ValueError("IDs must be nonempty and unique.")
    x = np.array([[float(row[name]) for name in features] for row in rows])
    if not np.isfinite(x).all():
        raise ValueError("Features must be finite; choose a missing-data policy first.")
    reference = [row[reference_column] for row in rows] if reference_column else None
    if reference is not None and any(value is None or value == "" for value in reference):
        raise ValueError("Reference annotations must be complete or explicitly excluded.")
    return ids, x, reference


def constructed_fixture():
    # Forty deterministic rows, two coordinate neighborhoods; reference is optional annotation.
    x = np.array([[center + offset, center - .3 * offset]
                  for center in (-4.0, 4.0) for offset in np.linspace(-.9, .9, 20)])
    return [f"toy-{i:02d}" for i in range(len(x))], x, ["left"] * 20 + ["right"] * 20


def center_distortion(features, centers):
    # Small-file scratch reduction: rows x centers x coordinates, then nearest center.
    squared = np.sum((features[:, None, :] - centers[None, :, :]) ** 2, axis=2)
    return float(np.mean(squared.min(axis=1)))


def report(ids, features, reference=None, candidates=(2, 3), minimum_fit_size=2, seed=23):
    x = np.asarray(features, dtype=float)
    if x.ndim != 2 or x.shape[1] == 0 or not np.isfinite(x).all() or len(x) != len(ids) or len(set(ids)) != len(ids):
        raise ValueError("Use finite feature rows aligned to unique IDs.")
    if len(x) < 10 or reference is not None and len(reference) != len(x):
        raise ValueError("Need at least ten rows and aligned optional reference labels.")
    if not isinstance(minimum_fit_size, int) or minimum_fit_size < 1:
        raise ValueError("Minimum fitting-group size must be a positive integer.")
    order = np.random.default_rng(seed).permutation(len(x))
    fit_end, selection_end = int(.6 * len(x)), int(.8 * len(x))
    fit, selection, final = order[:fit_end], order[fit_end:selection_end], order[selection_end:]
    scaler = StandardScaler().fit(x[fit])
    fit_x, selection_x, final_x = scaler.transform(x[fit]), scaler.transform(x[selection]), scaler.transform(x[final])
    outcomes = []
    eligible = []
    for k in candidates:
        if not isinstance(k, int) or isinstance(k, bool) or not 1 <= k <= len(fit):
            raise ValueError("Each candidate k must be an integer within the fit-set size.")
        model = KMeans(n_clusters=k, n_init=20, random_state=17).fit(fit_x)
        assigned = model.predict(selection_x)
        sizes = np.bincount(model.labels_, minlength=k)
        occupied = len(np.unique(assigned))
        valid = sizes.min() >= minimum_fit_size and 2 <= occupied < len(selection)
        score = float(silhouette_score(selection_x, assigned)) if valid else None
        outcomes.append({"k": k, "fit_sizes": sizes.tolist(), "eligible": bool(valid), "selection_silhouette": score})
        if valid:
            eligible.append((score, -k, model))
    if not eligible:
        raise ValueError("No eligible candidate under the declared development rule.")
    score, negative_k, model = max(eligible, key=lambda item: item[:2])
    # Freeze scaler, model, candidate rule and comparison geometry here.
    assigned_final = model.predict(final_x)
    baseline = KMeans(n_clusters=1, n_init=1, random_state=17).fit(fit_x)
    distortion = center_distortion(final_x, model.cluster_centers_)
    baseline_distortion = center_distortion(final_x, baseline.cluster_centers_)
    assert np.isclose(distortion, np.mean(model.transform(final_x).min(axis=1) ** 2))
    assert np.isclose(baseline_distortion, np.mean(baseline.transform(final_x).min(axis=1) ** 2))
    agreement = float(adjusted_rand_score([reference[i] for i in final], assigned_final)) if reference is not None else None
    return {"fit_ids": [ids[i] for i in fit], "selection_ids": [ids[i] for i in selection],
            "report_ids": [ids[i] for i in final], "fit_mean": scaler.mean_.tolist(), "fit_scale": scaler.scale_.tolist(),
            "selected_centers": model.cluster_centers_.tolist(), "baseline_center": baseline.cluster_centers_.tolist(),
            "candidates": outcomes, "selected_k": -negative_k, "selection_silhouette": score,
            "report_distortion": distortion, "same_geometry_baseline": baseline_distortion,
            "report_reference_ARI": agreement, "report_coverage": 1.0}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--features", nargs="+")
    parser.add_argument("--id-column", default="row_id")
    parser.add_argument("--reference-column")
    parser.add_argument("--candidates", type=int, nargs="+", default=[2, 3])
    parser.add_argument("--minimum-fit-size", type=int, default=2)
    args = parser.parse_args()
    if args.csv is not None:
        if not args.features:
            parser.error("--csv requires explicitly named --features")
        ids, x, reference = load_csv(args.csv, args.features, args.id_column, args.reference_column)
        print("Declared learner CSV", args.csv, "features", args.features)
    else:
        ids, x, reference = constructed_fixture()
        print("Input: constructed_fixture (40 rows, 2 features)")
    print(report(ids, x, reference, tuple(args.candidates), args.minimum_fit_size))
