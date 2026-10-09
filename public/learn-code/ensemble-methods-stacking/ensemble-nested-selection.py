"""Selection inside OOF, with outer assessment of the complete workflow.

Run: python ensemble-nested-selection.py
Dependencies: NumPy, scikit-learn. Twelve constructed observations, not a study
of general superiority. Every search-label and coefficient-fit row is logged.
"""
import numpy as np
from sklearn.base import clone
from sklearn.ensemble import StackingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import GridSearchCV, KFold, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def select_ridge(x, y, ids, audit, owner):
    splits = list(KFold(2, shuffle=True, random_state=113).split(x))
    scores = []
    for alpha in [.1, 1.]:
        fold_scores = []
        for fold, (fit, choice) in enumerate(splits):
            rule = make_pipeline(StandardScaler(), Ridge(alpha=alpha)).fit(x[fit], y[fit])
            fold_scores.append(mean_squared_error(y[choice], rule.predict(x[choice])))
            audit.append({"owner": owner, "action": "inner candidate", "alpha": alpha, "inner_fold": fold,
                          "coefficient_fit_ids": ids[fit].tolist(), "selection_label_ids": ids[choice].tolist()})
        scores.append((float(np.mean(fold_scores)), alpha))
    score, chosen = min(scores)
    rule = make_pipeline(StandardScaler(), Ridge(alpha=chosen)).fit(x, y)
    audit.append({"owner": owner, "action": "selected refit", "alpha": chosen,
                  "coefficient_fit_ids": ids.tolist(), "selection_label_ids": ids.tolist(), "inner_mse": score})
    return rule, chosen


def fit_complete_stack(x, y, ids, audit, owner):
    splits = list(KFold(3, shuffle=True, random_state=109).split(x))
    oof = np.empty((len(x), 2))
    choices = []
    for fold, (fit, held) in enumerate(splits):
        child = f"{owner}/OOF-{fold}"
        ridge, chosen = select_ridge(x[fit], y[fit], ids[fit], audit, child)
        line = LinearRegression().fit(x[fit], y[fit])
        audit.append({"owner": child, "action": "line fit", "coefficient_fit_ids": ids[fit].tolist(), "selection_label_ids": []})
        oof[held, 0], oof[held, 1] = ridge.predict(x[held]), line.predict(x[held])
        choices.append(chosen)
        # Every child fit AND search is checked against its own held rows.
        for event in [event for event in audit if event["owner"] == child]:
            accessed = set(event["coefficient_fit_ids"]) | set(event["selection_label_ids"])
            if accessed & set(ids[held]):
                raise AssertionError("OOF held row entered a fit or setting selection")
    meta = Ridge(alpha=1.).fit(oof, y)
    audit.append({"owner": owner, "action": "meta fit", "coefficient_fit_ids": ids.tolist(), "selection_label_ids": []})
    ridge, chosen = select_ridge(x, y, ids, audit, f"{owner}/full-base")
    line = LinearRegression().fit(x, y)
    audit.append({"owner": f"{owner}/full-base", "action": "line fit", "coefficient_fit_ids": ids.tolist(), "selection_label_ids": []})
    return {"ridge": ridge, "line": line, "meta": meta, "oof": oof, "oof_choices": choices, "full_choice": chosen}


def forward(state, x):
    columns = np.column_stack((state["ridge"].predict(x), state["line"].predict(x)))
    return state["meta"].predict(columns)


def ordinary_stack():
    search = GridSearchCV(make_pipeline(StandardScaler(), Ridge()), {"ridge__alpha": [.1, 1.]},
                          cv=KFold(2, shuffle=True, random_state=113), scoring="neg_mean_squared_error", refit=True)
    return StackingRegressor(estimators=[("selected-ridge", search), ("line", LinearRegression())],
                             cv=KFold(3, shuffle=True, random_state=109), final_estimator=Ridge(alpha=1.))


def main():
    np.set_printoptions(precision=9, suppress=True)
    ids = np.arange(12)
    x = ids.astype(float)[:, None]
    y = 2 + .4 * ids + np.array([0, .2, -.1, .3, 0, -.2, .1, 0, .2, -.1, .1, -.2])
    outer_splits = list(KFold(3, shuffle=True, random_state=107).split(x))
    audit, manual_mse = [], []
    for fold, (fit, held) in enumerate(outer_splits):
        start = len(audit)
        state = fit_complete_stack(x[fit], y[fit], ids[fit], audit, f"outer-{fold}")
        forecast = forward(state, x[held])
        score = mean_squared_error(y[held], forecast)
        manual_mse.append(score)
        for event in audit[start:]:
            accessed = set(event["coefficient_fit_ids"]) | set(event["selection_label_ids"])
            if accessed & set(ids[held]):
                raise AssertionError("outer assessment row entered the complete fitting workflow")
        print("outer", fold, "fit", ids[fit], "assessment", ids[held], "choices", state["oof_choices"], state["full_choice"])
        print("forecast", forecast, "targets", y[held], "MSE", score)
    library = cross_validate(ordinary_stack(), x, y, cv=outer_splits, scoring="neg_mean_squared_error", return_estimator=True)
    print("manual outer MSE", np.array(manual_mse))
    print("ordinary outer MSE", -library["test_score"], "max difference", np.max(np.abs(np.array(manual_mse) + library["test_score"])))
    print("ordinary full-base choices", [est.named_estimators_["selected-ridge"].best_params_ for est in library["estimator"]])
    print("all fit/search ownership events", audit)
    global_audit = []
    _, setting = select_ridge(x, y, ids, global_audit, "rejected-global-choice")
    print("globally chosen diagnostic setting", setting, "selection label access", ids)
    for fold, (fit, held) in enumerate(outer_splits):
        print("reject global setting for outer", fold, "because choice accessed assessment IDs", ids[held])
    print("The diagnostic global search is not used in any outer score above.")


if __name__ == "__main__":
    main()
