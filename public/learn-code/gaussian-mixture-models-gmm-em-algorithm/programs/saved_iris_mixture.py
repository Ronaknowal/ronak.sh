"""Portable original-outcome reporting and separately attributed unlabelled queries."""
import argparse
import json
from pathlib import Path
import numpy as np
from gaussian_mixture import GaussianMixtureState


def load_saved(path=None):
    path = Path(path) if path else Path(__file__).with_name("gmm_saved_iris.json")
    saved = json.loads(path.read_text(encoding="utf-8"))
    iris = saved["iris"]
    family, components = iris["selected"]
    selected = next(row for row in iris["candidates"] if row["covariance_type"] == family and row["components"] == components)
    model = GaussianMixtureState(selected["weights"], selected["means"], selected["covariances"], family)
    return saved, model


def query_raw(coordinates, saved, model):
    raw = np.asarray(coordinates, dtype=float)
    if raw.shape != (2,) or not np.isfinite(raw).all():
        raise ValueError("two finite raw sepal coordinates required")
    mean = np.asarray(saved["iris"]["scale_mean"])
    scale = np.asarray(saved["iris"]["scale"])
    standardized = (raw - mean) / scale
    log_density = float(model.score_samples([standardized])[0])
    return {"raw_cm": raw.tolist(), "standardized": standardized.tolist(),
            "log_density_standardized": log_density, "negative_log_density": -log_density,
            "responsibilities": model.predict_proba([standardized])[0].tolist(),
            "component_id": int(model.predict([standardized])[0])}


def report(saved):
    iris = saved["iris"]
    for row in iris["candidates"]:
        print("saved candidate", row["covariance_type"], row["components"],
              "train", row["train_mean_log_density"], "validation", row["validation_mean_log_density"],
              "AIC", row["aic"], "BIC", row["bic"], "converged", row["converged"], "iterations", row["iterations"])
    print("saved selected", iris["selected"])
    print("saved selected test", iris["test_mean_log_density"])
    print("saved baseline test", iris["baseline_test_mean_log_density"])
    print("saved test difference", iris["test_mean_log_density"] - iris["baseline_test_mean_log_density"])
    print("saved test ARI", iris["test_ari"])
    print("saved Bayesian sensitivity", saved["bayesian_sensitivity"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", type=Path)
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--query", nargs=2, type=float, metavar=("LENGTH_CM", "WIDTH_CM"))
    args = parser.parse_args()
    saved, model = load_saved(args.state)
    if args.report or args.query is None:
        report(saved)
    if args.query is not None:
        print("unlabelled query", json.dumps(query_raw(args.query, saved, model), sort_keys=True))


if __name__ == "__main__":
    main()
