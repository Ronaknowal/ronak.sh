from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    MinMaxScaler, OneHotEncoder, RobustScaler, StandardScaler,
)

data = pd.read_csv(Path(__file__).with_name("penguins.csv"))
numeric = [
    "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g",
]
categorical = ["sex"]
X = data[numeric + categorical]
y = data["species"]
train, test = train_test_split(
    np.arange(len(data)), test_size=0.25, random_state=20, stratify=y,
)

def make_model(scaler):
    numeric_steps = Pipeline([
        ("impute", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("scale", scaler),
    ])
    category_steps = Pipeline([
        ("impute", SimpleImputer(
            strategy="constant", fill_value="not_recorded",
            keep_empty_features=True,
        )),
        ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    prepare = ColumnTransformer([
        ("numeric", numeric_steps, numeric),
        ("category", category_steps, categorical),
    ])
    return Pipeline([
        ("prepare", prepare),
        ("classify", KNeighborsClassifier(n_neighbors=5)),
    ])

baseline = DummyClassifier(strategy="most_frequent")
baseline.fit(np.zeros((len(train), 1)), y.iloc[train])
baseline_prediction = baseline.predict(np.zeros((len(test), 1)))
print("majority", int(np.sum(baseline_prediction == y.iloc[test])), "/", len(test))

models = {}
for name, scaler in [
    ("raw", "passthrough"),
    ("standard", StandardScaler()),
    ("minmax", MinMaxScaler()),
    ("robust", RobustScaler()),
]:
    model = make_model(scaler)
    model.fit(X.iloc[train], y.iloc[train])
    prediction = model.predict(X.iloc[test])
    correct = int(np.sum(prediction == y.iloc[test]))
    print(name, correct, "/", len(test), f"{correct / len(test):.4f}")
    models[name] = model

prepare = models["standard"].named_steps["prepare"]
print(prepare.get_feature_names_out())
print(np.round(prepare.transform(X.iloc[test[:1]]), 4))