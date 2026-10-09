import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def inputs(numeric, categories):
    numeric = np.asarray(numeric, dtype=float)
    if numeric.ndim != 2 or 0 in numeric.shape or np.isinf(numeric).any():
        raise ValueError("Use a nonempty numeric matrix: finite values or NaN.")
    if len(categories) != len(numeric) or any(
        value is not None and not isinstance(value, str) for value in categories
    ):
        raise ValueError("Use one string or None category per row.")
    if "not_recorded" in categories:
        raise ValueError("not_recorded is reserved; use None for a missing category.")
    category = np.array(["not_recorded" if value is None else value
                         for value in categories])
    return numeric, category

def fit_preparation(numeric, categories):
    numeric, category = inputs(numeric, categories)
    if np.isnan(numeric).all(axis=0).any():
        raise ValueError("This teaching fit requires an observation in every column.")
    with np.errstate(over="raise", invalid="raise"):
        median = np.nanmedian(numeric, axis=0)
        filled = np.where(np.isnan(numeric), median, numeric)
        scale = filled.std(axis=0, ddof=0)
        mean = filled.mean(axis=0)
    return {"median": median, "mean": mean,
            "scale": np.where(scale == 0, 1.0, scale),
            "categories": np.unique(category)}

def transform_preparation(state, numeric, categories):
    numeric, category = inputs(numeric, categories)
    if numeric.shape[1] != len(state["median"]):
        raise ValueError("Keep the fitted numeric feature schema.")
    filled = np.where(np.isnan(numeric), state["median"], numeric)
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        scaled = (filled - state["mean"]) / state["scale"]
    indicators = (category[:, None] == state["categories"]).astype(float)
    return np.column_stack([scaled, indicators])

train = np.array([[10., 100., 7.], [20., np.nan, 7.],
                  [30., 300., 7.], [np.nan, 500., 7.]])
train_categories = ["b", "a", None, "a"]
query = np.array([[25., np.nan, 9.], [np.nan, 700., 7.]])
query_categories = ["new", None]
state = fit_preparation(train, train_categories)
snapshot = {key: value.copy() for key, value in state.items()}
manual = transform_preparation(state, query, query_categories)

imputer = SimpleImputer(strategy="median").fit(train)
scaler = StandardScaler().fit(imputer.transform(train))
encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
encoder.fit(inputs(train, train_categories)[1][:, None])
library = np.column_stack([
    scaler.transform(imputer.transform(query)),
    encoder.transform(inputs(query, query_categories)[1][:, None]),
])
np.testing.assert_allclose(manual, library, rtol=0, atol=1e-12)
np.testing.assert_allclose(state["median"], imputer.statistics_)
np.testing.assert_allclose(state["mean"], scaler.mean_)
np.testing.assert_allclose(state["scale"], scaler.scale_)
np.testing.assert_array_equal(state["categories"], encoder.categories_[0])

changed = query.copy()
changed[1, 1] = 1000.
edited = transform_preparation(state, changed, query_categories)
assert all(np.array_equal(state[key], before) for key, before in snapshot.items())
assert np.array_equal(edited[0], manual[0])
print("category columns:", state["categories"].tolist())
print("medians:", state["median"].tolist())
print("new rows:", np.round(manual, 6).tolist())
print("library parity:", np.allclose(manual, library, rtol=0, atol=1e-12))
print("edited second coordinate:", round(edited[1, 1], 6))