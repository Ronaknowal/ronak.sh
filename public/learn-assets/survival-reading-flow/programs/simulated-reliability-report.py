import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from lifelines import KaplanMeierFitter
from sksurv.ensemble import RandomSurvivalForest
from sksurv.linear_model import CoxPHSurvivalAnalysis
from sksurv.metrics import (
    integrated_brier_score,
    concordance_index_censored,
    concordance_index_ipcw,
    cumulative_dynamic_auc,
)
from sksurv.nonparametric import CensoringDistributionEstimator
from sksurv.util import Surv


def report(seed=73, shape=1.5, nonlinear=True):
    rng = np.random.default_rng(seed)
    features = np.column_stack(
        [rng.normal(size=900), rng.binomial(1, 0.5, 900), rng.normal(size=900)]
    )
    score = 0.6 * features[:, 0] - 0.7 * features[:, 1]
    if nonlinear:
        score += 0.5 * (features[:, 2] ** 2 - 1)
    lifetime = 12 * (rng.exponential(size=900) / np.exp(score)) ** (1 / shape)
    followup = rng.uniform(8, 25, 900)
    time, event = np.minimum(lifetime, followup), lifetime <= followup
    target = Surv.from_arrays(event, time)
    train, validation, test = np.arange(600), np.arange(600, 750), np.arange(750, 900)

    def cap(indices):
        return Surv.from_arrays(
            event[indices] & (time[indices] <= 12), np.minimum(time[indices], 12)
        )

    valid_y, test_y = cap(validation), cap(test)
    grid = np.array([2.0, 4.0, 6.0, 8.0, 10.0])
    censor = CensoringDistributionEstimator().fit(target[train])
    assert time[train].max() > 12
    assert np.all(
        censor.predict_proba(np.r_[grid, valid_y["time"], test_y["time"]]) > 0
    )
    expanded = np.column_stack([features, features[:, 2] ** 2])
    km = KaplanMeierFitter().fit(time[train], event[train])
    baseline = km.predict(grid).to_numpy()

    def curves(model, matrix, indices):
        return np.array(
            [fn(grid) for fn in model.predict_survival_function(matrix[indices])]
        )

    candidates = [
        (
            "linear Cox",
            features,
            make_pipeline(
                StandardScaler(), CoxPHSurvivalAnalysis(alpha=0.1, ties="efron")
            ),
        ),
        (
            "quadratic Cox",
            expanded,
            make_pipeline(
                StandardScaler(), CoxPHSurvivalAnalysis(alpha=0.1, ties="efron")
            ),
        ),
        (
            "forest leaf10",
            features,
            RandomSurvivalForest(
                n_estimators=60,
                min_samples_leaf=10,
                max_features=1.0,
                random_state=seed,
                n_jobs=1,
            ),
        ),
        (
            "forest leaf25",
            features,
            RandomSurvivalForest(
                n_estimators=60,
                min_samples_leaf=25,
                max_features=1.0,
                random_state=seed,
                n_jobs=1,
            ),
        ),
    ]

    # Pipeline does not forward survival-specific methods; transform explicitly.
    def survival_curves(model, matrix, indices):
        if hasattr(model, "steps"):
            transformed = model[:-1].transform(matrix[indices])
            return np.array(
                [fn(grid) for fn in model[-1].predict_survival_function(transformed)]
            )
        return curves(model, matrix, indices)

    fitted = []
    for name, matrix, model in candidates:
        model.fit(matrix[train], target[train])
        value = integrated_brier_score(
            target[train], valid_y, survival_curves(model, matrix, validation), grid
        )
        fitted.append((value, name, matrix, model))
        print("validation IBS", name, round(value, 6))
    value, name, matrix, model = min(fitted, key=lambda row: row[0])
    predicted = survival_curves(model, matrix, test)
    baseline_predictions = np.tile(baseline, (len(test), 1))
    risk = model.predict(matrix[test])
    print("selected:", name)
    print("test subjects/events:", len(test), int(test_y["event"].sum()))
    print(
        "minimum training censor survival through12:",
        round(float(censor.predict_proba([12])[0]), 6),
    )
    print(
        "test IBS model/KM:",
        round(integrated_brier_score(target[train], test_y, predicted, grid), 6),
        round(
            integrated_brier_score(target[train], test_y, baseline_predictions, grid), 6
        ),
    )
    print(
        "test Harrell C / Uno C truncated at10:",
        round(concordance_index_censored(test_y["event"], test_y["time"], risk)[0], 6),
        round(concordance_index_ipcw(target[train], test_y, risk, tau=10)[0], 6),
    )
    auc, mean_auc = cumulative_dynamic_auc(target[train], test_y, risk, grid)
    print("dynamic AUC at2,4,6,8,10:", np.round(auc, 6).tolist())
    true_survival = np.exp(-np.exp(score[test, None]) * (grid[None, :] / 12) ** shape)
    print(
        "synthetic oracle probability MSE:",
        round(float(np.mean((predicted - true_survival) ** 2)), 6),
    )
    print("This is one generated split, not an industrial or clinical benchmark.")
    return {
        "selected": name,
        "probabilities": predicted,
        "baseline": baseline_predictions,
        "test": test_y,
    }


result = report()