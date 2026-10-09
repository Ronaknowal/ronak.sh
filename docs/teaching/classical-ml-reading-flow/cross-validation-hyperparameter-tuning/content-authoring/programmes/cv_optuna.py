import optuna
from sklearn.model_selection import StratifiedKFold, cross_val_score
from cv_penguins import load_data, make_model

X, y = load_data()
splitter = StratifiedKFold(n_splits=3, shuffle=True, random_state=73)
splits = list(splitter.split(X, y))

def objective(trial):
    model = make_model()
    model.set_params(
        classify__n_neighbors=trial.suggest_int("neighbors", 1, 21, step=2),
        classify__p=trial.suggest_int("distance_power", 1, 2),
        classify__weights=trial.suggest_categorical("weights", ["uniform", "distance"]),
    )
    scores = cross_val_score(
        model, X, y, cv=splits, scoring="accuracy", n_jobs=1,
        error_score="raise",
    )
    return float(scores.mean())

study = optuna.create_study(
    direction="maximize",
    sampler=optuna.samplers.TPESampler(seed=29, n_startup_trials=10),
)
study.optimize(objective, n_trials=20, n_jobs=1)
print("selection score", study.best_value)
print("selected settings", study.best_params)