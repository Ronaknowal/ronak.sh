from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler, StandardScaler

def load_data():
    data = pd.read_csv(Path(__file__).with_name("penguins.csv"))
    columns = [
        "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g", "sex",
    ]
    return data[columns], data["species"]

def make_model():
    numeric = [
        "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g",
    ]
    prepare = ColumnTransformer([
        ("numeric", Pipeline([
            ("impute", SimpleImputer(strategy="median", keep_empty_features=True)),
            ("scale", StandardScaler()),
        ]), numeric),
        ("category", Pipeline([
            ("impute", SimpleImputer(
                strategy="constant", fill_value="not_recorded",
                keep_empty_features=True,
            )),
            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]), ["sex"]),
    ])
    return Pipeline([
        ("prepare", prepare),
        ("classify", KNeighborsClassifier()),
    ])

def main():
    X, y = load_data()
    grid = {
        "prepare__numeric__scale": [StandardScaler(), RobustScaler()],
        "classify__n_neighbors": [3, 5, 11],
    }
    outer = StratifiedKFold(n_splits=3, shuffle=True, random_state=41)
    held_out_predictions = np.empty(len(y), dtype=object)
    fold_scores = []
    for fold, (train, test) in enumerate(outer.split(X, y), start=1):
        inner = StratifiedKFold(n_splits=3, shuffle=True, random_state=73)
        search = GridSearchCV(
            make_model(), grid, cv=inner, scoring="accuracy",
            n_jobs=1, error_score="raise",
        )
        search.fit(X.iloc[train], y.iloc[train])
        prediction = search.predict(X.iloc[test])
        held_out_predictions[test] = prediction
        correct = int(np.sum(prediction == y.iloc[test]))
        fold_scores.append(correct / len(test))
        baseline = DummyClassifier(strategy="most_frequent")
        baseline.fit(np.zeros((len(train), 1)), y.iloc[train])
        base_prediction = baseline.predict(np.zeros((len(test), 1)))
        base_correct = int(np.sum(base_prediction == y.iloc[test]))
        chosen_k = search.best_params_["classify__n_neighbors"]
        chosen_scaler = type(search.best_params_["prepare__numeric__scale"]).__name__
        print(fold, chosen_k, chosen_scaler, correct, "/", len(test),
              "baseline", base_correct)

    print("outer fold mean", f"{np.mean(fold_scores):.7f}")
    print("outer pooled", f"{np.mean(held_out_predictions == y):.7f}")
    final = GridSearchCV(
        make_model(), grid,
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=73),
        scoring="accuracy", n_jobs=1, error_score="raise",
    )
    final.fit(X, y)
    print("final settings", final.best_params_)
    print("final selection score", f"{final.best_score_:.7f}")

if __name__ == "__main__":
    main()