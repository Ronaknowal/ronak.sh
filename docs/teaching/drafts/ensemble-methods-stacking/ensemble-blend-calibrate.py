"""Disjoint base/meta/calibration/evaluation roles for a frozen whole rule.

Run: python ensemble-blend-calibrate.py
Keep ensemble-oof-state.py, ensemble-combination-core.py and newton-logistic.py
alongside this file. Dependencies: NumPy, SciPy, scikit-learn.
"""
from pathlib import Path
import importlib.util
import numpy as np
from scipy.optimize import minimize
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import StackingClassifier
from sklearn.frozen import FrozenEstimator
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


spec = importlib.util.spec_from_file_location("oof", Path(__file__).with_name("ensemble-oof-state.py"))
oof = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oof)


def calibration_objective(theta, design, labels, strength=.01):
    score = design @ theta
    p = oof.newton.sigmoid(score)
    loss = np.mean(np.logaddexp(0, (1 - 2 * labels) * score)) + strength * (theta @ theta) / 2
    gradient = design.T @ (p - labels) / len(labels) + strength * theta
    hessian = design.T @ ((p * (1 - p))[:, None] * design) / len(labels) + strength * np.eye(2)
    return float(loss), gradient, hessian


def fit_score_calibration(scores, labels, strength=.01, tolerance=1e-10, max_steps=50):
    score, y = np.asarray(scores, dtype=float), np.asarray(labels, dtype=float)
    if score.ndim != 1 or not len(score) or y.shape != score.shape or not np.isfinite(score).all():
        raise ValueError("finite saved scores and one binary target per score required")
    if not np.array_equal(np.unique(y), [0, 1]) or not np.isfinite(strength) or strength <= 0:
        raise ValueError("both classes and positive finite calibration ridge required")
    design = np.column_stack((np.ones(len(score)), score))
    theta = np.zeros(2)
    for step in range(max_steps + 1):
        loss, gradient, hessian = calibration_objective(theta, design, y, strength)
        if np.max(np.abs(gradient)) <= tolerance:
            return {"theta": theta, "steps": step, "loss": loss, "gradient": gradient, "hessian": hessian,
                    "strength": strength, "objective": "mean hard-label log loss + ridge on intercept AND slope"}
        if step == max_steps:
            break
        direction = np.linalg.solve(hessian, gradient)
        rate = 1.
        for _ in range(30):
            candidate = theta - rate * direction
            candidate_loss = calibration_objective(candidate, design, y, strength)[0]
            if candidate_loss <= loss - 1e-4 * rate * (gradient @ direction):
                theta = candidate
                break
            rate /= 2
        else:
            raise RuntimeError("calibration damping found no decreasing step")
    raise RuntimeError("calibration gradient tolerance not reached")


def calibrate_saved_scores(state, scores):
    score = np.asarray(scores, dtype=float)
    if score.ndim != 1 or not np.isfinite(score).all():
        raise ValueError("saved scores must be a finite vector")
    return oof.newton.sigmoid(state["theta"][0] + state["theta"][1] * score)


def probability_bins(probabilities, labels):
    p, y = np.asarray(probabilities), np.asarray(labels)
    # Fixed bins, including exactly one in the final bin. Empty bins are explicit.
    index = np.minimum((p * 4).astype(int), 3)
    return [{"interval": [i / 4, (i + 1) / 4], "count": int(np.sum(index == i)),
             "mean_probability": float(p[index == i].mean()) if np.any(index == i) else None,
             "observed_fraction": float(y[index == i].mean()) if np.any(index == i) else None} for i in range(4)]


def main():
    np.set_printoptions(precision=9, suppress=True)
    i = np.arange(96)
    x = np.column_stack((((i % 12) - 5.5) / 2, (i // 12 - 3.5) / 2))
    y = (x[:, 0] + .7 * x[:, 1] + .4 * np.sin(i) > .2).astype(int)
    roles = {"base": i[np.isin(i % 8, [0, 1, 2])], "meta": i[np.isin(i % 8, [3, 4])],
             "calibration": i[i % 8 == 5], "evaluation": i[np.isin(i % 8, [6, 7])]}
    for role, rows in roles.items():
        if not np.array_equal(np.unique(y[rows]), [0, 1]):
            raise AssertionError("every declared role must contain both classes")
        print(role, "IDs", rows, "class counts", np.bincount(y[rows], minlength=2))
    if len(set(np.concatenate(list(roles.values())))) != 96:
        raise AssertionError("roles overlap or omit observations")
    base_rows, meta_rows = roles["base"], roles["meta"]
    prototypes = [("line", make_pipeline(StandardScaler(), LogisticRegression(C=1, l1_ratio=0, max_iter=5000, tol=1e-12))), ("bayes", GaussianNB())]
    # Bases stay on these 36 rows; this is not an OOF/full-refit workflow.
    fitted = [(name, base.fit(x[base_rows], y[base_rows])) for name, base in prototypes]
    state = {"bases": fitted, "class_order": [0, 1], "methods": ["predict_proba", "predict_proba"],
             "column_order": ["line:P(class=1)", "bayes:P(class=1)"], "feature_count": 2,
             "passthrough": False, "fit_ids": base_rows.tolist()}
    matrix = oof.full_refit_columns(state, x[meta_rows])
    meta = oof.fit_binary_meta(matrix, y[meta_rows], strength=.1)
    ordinary = StackingClassifier(estimators=fitted, cv="prefit", final_estimator=LogisticRegression(
        C=1/(len(meta_rows)*.1), l1_ratio=0, max_iter=5000, tol=1e-12)).fit(x[meta_rows], y[meta_rows])
    calibration_rows, evaluation_rows = roles["calibration"], roles["evaluation"]
    calibration_scores = oof.binary_forward(state, meta, x[calibration_rows])["scores"]
    calibrated = fit_score_calibration(calibration_scores, y[calibration_rows])
    design = np.column_stack((np.ones(len(calibration_scores)), calibration_scores))
    reference = minimize(lambda theta: calibration_objective(theta, design, y[calibration_rows])[:2],
                         np.zeros(2), jac=True, method="BFGS", options={"gtol": 1e-10, "maxiter": 1000})
    if np.max(np.abs(calibration_objective(reference.x, design, y[calibration_rows])[1])) > 1e-7:
        raise RuntimeError(f"matching calibration reference failed: {reference.message}")
    platt = CalibratedClassifierCV(FrozenEstimator(ordinary), method="sigmoid").fit(x[calibration_rows], y[calibration_rows])
    before = oof.binary_forward(state, meta, x[evaluation_rows])
    after = calibrate_saved_scores(calibrated, before["scores"])
    library_calibrated = platt.predict_proba(x[evaluation_rows])[:, 1]
    print("kept base ownership", state["fit_ids"], "meta ownership", meta_rows)
    print("meta theta/steps/gradient", meta["theta"], meta["steps"], meta["gradient"])
    print("ordinary prefit stack probability max difference", np.max(np.abs(ordinary.predict_proba(x[evaluation_rows]) - before["probabilities"])))
    print("scratch calibration", calibrated)
    print("matching SciPy coefficients", reference.x, "coefficient max difference", np.max(np.abs(reference.x - calibrated["theta"])))
    prior0, prior1 = np.bincount(y[calibration_rows], minlength=2)
    print("ordinary sigmoid convention: no ridge; negative targets", 1/(prior0+2), "positive targets", (prior1+1)/(prior1+2))
    print("ordinary score source: whole-rule decision_function; sigmoid(-(a*score+b))")
    print("ordinary sigmoid a/b", platt.calibrated_classifiers_[0].calibrators[0].a_, platt.calibrated_classifiers_[0].calibrators[0].b_)
    for name, p in [("frozen uncalibrated", before["probabilities"][:, 1]), ("hard-target ridge calibration", after), ("ordinary smoothed-target sigmoid", library_calibrated)]:
        print(name, "evaluation probabilities", p)
        print("Brier/log loss", brier_score_loss(y[evaluation_rows], p), log_loss(y[evaluation_rows], np.column_stack((1-p, p)), labels=[0, 1]))
        print("evaluation bins", probability_bins(p, y[evaluation_rows]))


if __name__ == "__main__":
    main()
