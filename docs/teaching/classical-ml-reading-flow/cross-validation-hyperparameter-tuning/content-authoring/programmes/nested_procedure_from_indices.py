"""Every select/refit state in a small nested experiment, without hidden helpers."""
import json
import numpy as np
from fold_fitted_pipeline import evaluate_folds, fit_knn, predict, validate_split, ordinary_pipeline


def alternating_splits(n):
    for parity in [0, 1]:
        held = np.arange(parity, n, 2)
        train = np.arange(1 - parity, n, 2)
        validate_split(train, held, n)
        yield train, held


def select_refit(x, y, source_ids, candidates=(1, 3)):
    x, y, source_ids = np.asarray(x, float), np.asarray(y), np.asarray(source_ids)
    inner = list(alternating_splits(len(x)))
    results = [evaluate_folds(x, y, inner, k=k, source_ids=source_ids) for k in candidates]
    winner = max(range(len(candidates)), key=lambda i: results[i]["pooled"])
    model = fit_knn(x, y.tolist(), source_ids.tolist(), k=candidates[winner])
    return model, {"candidate_order": list(candidates), "scores": [row["pooled"] for row in results],
                   "selected_k": candidates[winner], "inner": results,
                   "refit_ids": source_ids.tolist(), "refit_state": model.preparation.__dict__}


def nested(x, y):
    x, y = np.asarray(x, float), np.asarray(y)
    records = []
    for train, held in alternating_splits(len(x)):
        model, record = select_refit(x[train], y[train], train)
        prediction = predict(model, x[held])
        record.update({"assessment_ids": held.tolist(), "assessment_predictions": prediction,
                       "correct": sum(row["prediction"] == int(target) for row, target in zip(prediction, y[held]))})
        records.append(record)
    final_model, final = select_refit(x, y, np.arange(len(x)))
    return records, final_model, final


def ordinary_outer(x, y):
    from sklearn.model_selection import GridSearchCV, cross_validate
    records = []
    for train, held in alternating_splits(len(x)):
        inner = list(alternating_splits(len(train)))
        search = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                              scoring="accuracy", cv=inner, error_score="raise", n_jobs=1)
        search.fit(x[train], y[train])
        records.append({"selected_k": search.best_params_["classify__n_neighbors"],
                        "scores": search.cv_results_["mean_test_score"].tolist(),
                        "predictions": search.predict(x[held]).tolist()})
    # The composite search itself is the estimator cloned by the outer helper.
    composite = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                             cv=list(alternating_splits(len(x) // 2)), scoring="accuracy",
                             error_score="raise", n_jobs=1)
    summary = cross_validate(composite, x, y, cv=list(alternating_splits(len(x))),
                             scoring="accuracy", return_estimator=True, return_indices=True,
                             error_score="raise", n_jobs=1)
    return records, summary["test_score"].tolist()


def main():
    x = np.arange(16, dtype=float)[:, None]
    y = np.array([0] * 8 + [1] * 8)
    for name, target in [("default", y), ("training row3", np.where(np.arange(16) == 3, 1, y)),
                         ("assessment row2", np.where(np.arange(16) == 2, 1, y))]:
        rows, model, final = nested(x, target)
        first = rows[0]
        print(name, "scores", first["scores"], "selected", first["selected_k"],
              "assessment", [row["prediction"] for row in first["assessment_predictions"]],
              "correct", first["correct"], "/", len(first["assessment_ids"]))
        print(name, "inner lineage", json.dumps(first["inner"]))
        print(name, "outer refit", first["refit_ids"], first["refit_state"],
              "final selection", final["selected_k"], final["scores"], "final refit", final["refit_ids"])
    ordinary, composite = ordinary_outer(x, y)
    print("ordinary explicit", json.dumps(ordinary), "composite assessment", composite)
    # Group-aware adaptation uses outer-subset groups, then maps local positions.
    from sklearn.model_selection import GroupKFold
    groups = np.repeat(np.arange(8), 2)
    train, held = next(GroupKFold(2).split(x, y, groups))
    inner = list(GroupKFold(2).split(x[train], y[train], groups[train]))
    print("group mapping", [(train[a].tolist(), train[b].tolist()) for a, b in inner],
          "outer held", held.tolist())


if __name__ == "__main__":
    main()
