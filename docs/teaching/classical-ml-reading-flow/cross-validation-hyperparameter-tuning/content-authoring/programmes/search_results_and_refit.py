"""Predeclared eligibility, multiple metrics, actual failures and fresh refit."""
import numpy as np


def select_table(rows, cost_cap=5):
    if not np.isfinite(cost_cap) or cost_cap < 0:
        raise ValueError("Cost cap must be finite and nonnegative.")
    eligible = []
    audit = []
    for i, row in enumerate(rows):
        scores, costs = row["accuracy"], row["cost"]
        complete = len(scores) == len(costs) > 0 and all(value is not None and np.isfinite(value) for value in scores + costs)
        mean = float(np.mean(scores)) if complete else None
        mean_cost = float(np.mean(costs)) if complete else None
        legal = complete and all(value >= 0 for value in costs) and mean_cost <= cost_cap
        audit.append({"index": i, "candidate": row["candidate"], "mean_accuracy": mean,
                      "mean_cost": mean_cost, "eligible": bool(legal)})
        if legal:
            eligible.append(i)
    if not eligible:
        raise ValueError("No candidate has all finite fold scores and acceptable mean cost.")
    winner = max(eligible, key=lambda i: audit[i]["mean_accuracy"])
    return winner, audit


def constructed_table():
    return [{"candidate": "A", "accuracy": [.80, .90, .70], "cost": [9, 11, 10]},
            {"candidate": "B", "accuracy": [.85, .80, .90], "cost": [2, 3, 4]},
            {"candidate": "C", "accuracy": [.95, .94, None], "cost": [1, 1, 1]}]


def ordinary_refit(results):
    rows = []
    costs = {0: 1, 1: 9, 3: 3}
    for i, parameter in enumerate(results["params"]):
        k = parameter["classify__n_neighbors"]
        scores = [float(results[f"split{j}_test_accuracy"][i]) for j in range(3)]
        rows.append({"candidate": k, "accuracy": scores, "cost": [costs[k]] * 3})
    return select_table(rows, cost_cap=5)[0]


def main():
    table = constructed_table()
    for cap in [5, 2, 10]:
        try:
            print("constructed cap", cap, select_table(table, cap))
        except ValueError as error:
            print("constructed cap", cap, "refusal", str(error))
    table[0]["accuracy"] = [.90, .95, .85]
    print("changed A cap10", select_table(table, 10))
    from sklearn.model_selection import GridSearchCV, StratifiedKFold
    from fold_fitted_pipeline import ordinary_pipeline
    x = np.arange(24, dtype=float)[:, None]
    y = (x[:, 0] >= 12).astype(int)
    train, held = np.arange(0, 24, 2), np.arange(1, 24, 2)
    folds = list(StratifiedKFold(3, shuffle=True, random_state=7).split(x[train], y[train]))
    scoring = {"accuracy": "accuracy", "balanced": "balanced_accuracy"}
    # k=0 deliberately fails inside candidate fits. Keep all warning diagnostics.
    search = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3, 0]},
                          scoring=scoring, cv=folds, refit=ordinary_refit,
                          error_score=np.nan, n_jobs=1)
    search.fit(x[train], y[train])
    print("ordinary training IDs", train.tolist(), "protected IDs", held.tolist())
    for i, parameters in enumerate(search.cv_results_["params"]):
        print("ordinary candidate", parameters,
              "accuracy", [float(search.cv_results_[f"split{j}_test_accuracy"][i]) for j in range(3)],
              "balanced", [float(search.cv_results_[f"split{j}_test_balanced"][i]) for j in range(3)])
    print("best_index", search.best_index_, "best_params", search.best_params_,
          "best_score exists", hasattr(search, "best_score_"))
    chosen_accuracy = search.cv_results_["mean_test_accuracy"][search.best_index_]
    protected_accuracy = float(np.mean(search.predict(x[held]) == y[held]))
    print("selected accuracy", float(chosen_accuracy), "protected accuracy", protected_accuracy)
    print("refit numeric state", search.best_estimator_["prepare"].named_transformers_["numeric"]["scale"].mean_.tolist())
    print("attempted fits", 3 * 3 + 1, "failed candidate fits", 3)
    # Repair the candidate space, then require all remaining fits to succeed.
    repaired = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                            scoring=scoring, cv=folds, refit=ordinary_refit,
                            error_score="raise", n_jobs=1)
    repaired.fit(x[train], y[train])
    print("repaired index", repaired.best_index_, "selected accuracy",
          float(repaired.cv_results_["mean_test_accuracy"][repaired.best_index_]),
          "repair fits", 2 * 3 + 1)


if __name__ == "__main__":
    main()
