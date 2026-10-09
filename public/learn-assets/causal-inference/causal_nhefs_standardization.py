"""Standardize a fitted outcome model over the public NHEFS teaching cohort.

Download nhefs.csv from https://miguelhernan.org/s/nhefs.csv.
Run: python causal_nhefs_standardization.py nhefs.csv
Dependencies: NumPy and scikit-learn. See the lesson for identification,
censoring, target-population and working iid bootstrap assumptions.
"""

import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from sklearn.linear_model import LinearRegression


CONTINUOUS = ("age", "wt71", "smokeintensity", "smokeyrs")
CATEGORIES = {"education": (1, 2, 3, 4, 5),
              "exercise": (0, 1, 2), "active": (0, 1, 2)}
REQUIRED = ("qsmk", "sex", "race", *CONTINUOUS, *CATEGORIES)


def read_cohort(path):
    with Path(path).open(newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    if not rows:
        raise ValueError("The cohort must contain records.")
    columns = {key: np.array([float(row[key]) for row in rows])
               for key in REQUIRED}
    outcome = np.array([float(row["wt82_71"]) if row["wt82_71"] else np.nan
                        for row in rows])
    if not all(np.isfinite(values).all() for values in columns.values()):
        raise ValueError("Baseline covariates and treatment must be observed.")
    for key in ("qsmk", "sex", "race"):
        if not np.isin(columns[key], (0, 1)).all():
            raise ValueError(f"Unexpected binary code in {key}.")
    for key, levels in CATEGORIES.items():
        if not np.isin(columns[key], levels).all():
            raise ValueError(f"Unexpected category in {key}.")
    if np.isinf(outcome).any():
        raise ValueError("An observed outcome must be finite.")
    return columns, outcome


def design(columns, treatment=None, quadratic=True):
    """Keep the same covariates; replace only treatment and its interaction."""
    a = columns["qsmk"] if treatment is None else np.full_like(
        columns["qsmk"], float(treatment))
    values = [np.ones(len(a)), a, columns["sex"], columns["race"]]
    names = ["intercept", "qsmk", "sex", "race"]
    for key in CONTINUOUS:
        # Fixed units improve conditioning; this is not a learned transformation.
        scaled = columns[key] / 10
        values.append(scaled)
        names.append(key + "/10")
        if quadratic:
            values.append(scaled ** 2)
            names.append("(" + key + "/10)^2")
    for key, levels in CATEGORIES.items():
        for level in levels[1:]:
            values.append((columns[key] == level).astype(float))
            names.append(f"{key}={level}")
    values.append(a * columns["smokeintensity"] / 10)
    names.append("qsmk * smokeintensity/10")
    return np.column_stack(values), names


def fit_and_standardize(actual, zero, one, outcome, target_rows=None):
    """Fit observed outcomes, then average two fitted means over the target."""
    observed = np.isfinite(outcome)
    if observed.sum() <= actual.shape[1]:
        raise ValueError("Too few observed outcomes for this design.")
    beta, _, rank, singular = np.linalg.lstsq(
        actual[observed], outcome[observed], rcond=None)
    if rank != actual.shape[1]:
        raise ValueError("The outcome design is not full column rank.")
    predictions = np.column_stack((zero @ beta, one @ beta))
    target = predictions if target_rows is None else predictions[target_rows]
    means = target.mean(axis=0)
    return {"beta": beta, "predictions": predictions, "means": means,
            "difference": float(means[1] - means[0]), "rank": int(rank),
            "condition": float(singular[0] / singular[-1])}


def bootstrap(actual, zero, one, outcome, repetitions=1000, seed=20261009):
    """Resample complete records, refit, and average over each resampled cohort."""
    rng = np.random.default_rng(seed)
    estimates = np.empty(repetitions)
    for b in range(repetitions):
        ids = rng.integers(0, len(outcome), size=len(outcome))
        estimates[b] = fit_and_standardize(
            actual[ids], zero[ids], one[ids], outcome[ids])["difference"]
    return estimates


def analyze(path):
    columns, outcome = read_cohort(path)
    observed = np.isfinite(outcome)
    actual, names = design(columns)
    zero, _ = design(columns, treatment=0)
    one, _ = design(columns, treatment=1)
    fitted = fit_and_standardize(actual, zero, one, outcome)
    library = LinearRegression(fit_intercept=False).fit(
        actual[observed], outcome[observed])
    library_predictions = np.column_stack((library.predict(zero), library.predict(one)))
    difference = float(np.max(np.abs(library_predictions - fitted["predictions"])))
    if difference > 1e-8:
        raise ArithmeticError("The two regression routes disagree.")
    linear, _ = design(columns, quadratic=False)
    linear_zero, _ = design(columns, treatment=0, quadratic=False)
    linear_one, _ = design(columns, treatment=1, quadratic=False)
    changed = fit_and_standardize(linear, linear_zero, linear_one, outcome)
    estimates = bootstrap(actual, zero, one, outcome)
    by_treatment = []
    for a in (0, 1):
        group = columns["qsmk"] == a
        measured = group & observed
        by_treatment.append({"qsmk": a, "records": int(group.sum()),
                             "observed": int(measured.sum()),
                             "missing": int((group & ~observed).sum()),
                             "observed_mean": float(outcome[measured].mean())})
    # These are model means for a selected covariate row, not two observed outcomes.
    row = 0
    return {
        "data_sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest(),
        "records": len(outcome), "observed_outcomes": int(observed.sum()),
        "missing_outcomes": int((~observed).sum()), "by_treatment": by_treatment,
        "features": names, "rank": fitted["rank"], "condition": fitted["condition"],
        "standardized_means_all_rows": fitted["means"].tolist(),
        "standardized_difference": fitted["difference"],
        "standardized_means_complete_rows": fitted["predictions"][observed].mean(axis=0).tolist(),
        "linear_only_difference": changed["difference"],
        "library_max_prediction_error": difference,
        "first_row": {key: float(columns[key][row]) for key in REQUIRED},
        "first_row_model_means": fitted["predictions"][row].tolist(),
        "bootstrap": {"seed": 20261009, "repetitions": len(estimates),
                      "standard_error": float(estimates.std(ddof=1)),
                      "percentile_95": np.quantile(estimates, [.025, .975]).tolist(),
                      "estimates": estimates.tolist()},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv", type=Path)
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()
    result = analyze(args.csv)
    print("records / observed / missing:", result["records"],
          result["observed_outcomes"], result["missing_outcomes"])
    for group in result["by_treatment"]:
        print("qsmk", group["qsmk"], "records", group["records"],
              "observed", group["observed"], "missing", group["missing"],
              "observed mean", round(group["observed_mean"], 6))
    print("design columns / rank:", len(result["features"]), result["rank"])
    print("standardized means:", np.round(result["standardized_means_all_rows"], 6).tolist())
    print("standardized difference:", round(result["standardized_difference"], 6))
    print("complete-row target means:", np.round(result["standardized_means_complete_rows"], 6).tolist())
    print("linear-only difference:", round(result["linear_only_difference"], 6))
    print("first-row model means:", np.round(result["first_row_model_means"], 6).tolist())
    print("NumPy/sklearn predictions agree:", result["library_max_prediction_error"] < 1e-8)
    print("bootstrap seed / refits:", result["bootstrap"]["seed"], result["bootstrap"]["repetitions"])
    print("bootstrap SE:", round(result["bootstrap"]["standard_error"], 6))
    print("percentile interval:", np.round(result["bootstrap"]["percentile_95"], 6).tolist())
    if args.json_output:
        args.json_output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
