"""One new constructed ordinary halving run; resource count is not wall time."""
from sklearn.experimental import enable_halving_search_cv  # noqa: F401
from sklearn.model_selection import HalvingGridSearchCV, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification


def main():
    x, y = make_classification(n_samples=90, n_features=4, n_informative=3,
                               n_redundant=0, n_clusters_per_class=1, flip_y=0,
                               class_sep=1, random_state=19)
    folds = list(StratifiedKFold(3, shuffle=True, random_state=7).split(x, y))
    estimator = RandomForestClassifier(random_state=11, n_jobs=1)
    # Tree count is the resource, so it is absent from the candidate grid.
    grid = {"max_depth": [1, 2, 3], "min_samples_leaf": [1, 2, 4]}
    search = HalvingGridSearchCV(estimator, grid, resource="n_estimators",
                                 min_resources=1, max_resources=9, factor=3,
                                 cv=folds, scoring="accuracy", random_state=13,
                                 n_jobs=1, error_score="raise", refit=True,
                                 return_train_score=False)
    search.fit(x, y)
    print("constructed data shape", x.shape, "class counts", [(int(label), int(sum(y == label))) for label in [0, 1]])
    print("fold sizes", [(len(train), len(held)) for train, held in folds])
    print("n_candidates", search.n_candidates_, "n_resources", search.n_resources_)
    for i, params in enumerate(search.cv_results_["params"]):
        print("result", i, "iteration", int(search.cv_results_["iter"][i]),
              "resource", int(search.cv_results_["n_resources"][i]), "params", params,
              "fold scores", [float(search.cv_results_[f"split{j}_test_score"][i]) for j in range(3)],
              "mean selection accuracy", float(search.cv_results_["mean_test_score"][i]))
    print("selected", search.best_index_, search.best_params_, "selection accuracy", search.best_score_)
    print("maximum reached", max(search.n_resources_) == search.max_resources,
          "final trees", search.best_estimator_.n_estimators)
    print("candidate fold fits", sum(search.n_candidates_) * len(folds), "final refits", 1,
          "fresh tree units", sum(n * r * len(folds) for n, r in zip(search.n_candidates_, search.n_resources_)) + search.best_estimator_.n_estimators)
    print("warm_start", search.best_estimator_.warm_start, "timing measured", False)


if __name__ == "__main__":
    main()
