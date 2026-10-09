"""Training-only mixed preparation and uniform KNN, with explicit row lineage.

NumPy implements arrays and arithmetic, not the fit/predict operation.  The
ordinary comparison in main uses exactly the same legal input and fold plan.
"""
from dataclasses import dataclass
from collections import Counter
import json
import numpy as np

MISSING_CATEGORY = "__missing__"


def numeric_table(values):
    table = np.asarray(values, dtype=float)
    if table.ndim != 2 or not table.shape[1] or np.isinf(table).any():
        raise ValueError("Expected a numeric matrix with finite observations or NaN.")
    return table


def category_table(values, rows):
    if values is None:
        return np.empty((rows, 0), dtype=object)
    table = np.asarray(values, dtype=object)
    if table.ndim != 2 or len(table) != rows:
        raise ValueError("Category rows must align with numeric rows.")
    clean = np.empty(table.shape, dtype=object)
    for index in np.ndindex(table.shape):
        value = table[index]
        missing = value is None or isinstance(value, (float, np.floating)) and np.isnan(value)
        if missing:
            clean[index] = MISSING_CATEGORY
        elif not isinstance(value, str) or value == MISSING_CATEGORY:
            raise ValueError("Observed categories must be strings other than the reserved missing marker.")
        else:
            clean[index] = value
    return clean


@dataclass(frozen=True)
class Preparation:
    medians: tuple
    means: tuple
    variances: tuple
    scales: tuple
    vocabularies: tuple


def fit_prepare(numeric, categories=None):
    table = numeric_table(numeric)
    if not len(table) or np.isnan(table).all(axis=0).any():
        raise ValueError("Need training rows and an observed value in each numeric column.")
    category = category_table(categories, len(table))
    median = np.nanmedian(table, axis=0)
    filled = np.where(np.isnan(table), median, table)
    mean = filled.mean(axis=0)
    variance = ((filled - mean) ** 2).mean(axis=0)
    scale = np.where(variance > 0, np.sqrt(variance), 1.0)
    vocabulary = tuple(tuple(sorted(set(category[:, j]))) for j in range(category.shape[1]))
    return Preparation(tuple(map(float, median)), tuple(map(float, mean)),
                       tuple(map(float, variance)), tuple(map(float, scale)), vocabulary)


def transform(state, numeric, categories=None):
    table = numeric_table(numeric)
    category = category_table(categories, len(table))
    if table.shape[1] != len(state.medians) or category.shape[1] != len(state.vocabularies):
        raise ValueError("The fitted numeric/category schema must stay fixed.")
    filled = np.where(np.isnan(table), state.medians, table)
    blocks = [(filled - state.means) / state.scales]
    for j, vocabulary in enumerate(state.vocabularies):
        # An unknown held category has no matching vocabulary column: all zeros.
        blocks.append((category[:, j, None] == np.asarray(vocabulary)[None, :]).astype(float))
    return np.concatenate(blocks, axis=1)


@dataclass(frozen=True)
class Neighbours:
    preparation: Preparation
    features: np.ndarray
    numeric_values: np.ndarray
    targets: tuple
    source_ids: tuple
    copy_ordinals: tuple
    classes: tuple
    k: int


def fit_knn(numeric, targets, source_ids, k=1, categories=None, copy_ordinals=None, classes=None):
    table = numeric_table(numeric)
    y, ids = tuple(targets), tuple(source_ids)
    copies = tuple(0 for _ in ids) if copy_ordinals is None else tuple(copy_ordinals)
    if len(table) != len(y) or len(ids) != len(y) or len(copies) != len(y):
        raise ValueError("Features, targets and occurrence metadata must align.")
    if any(not isinstance(value, (str, int, np.integer)) for value in y):
        raise ValueError("Classification targets must be observed integer or string labels.")
    if type(k) is not int or not 1 <= k <= len(y):
        raise ValueError("Require integer 1 <= k <= training occurrences.")
    if any(type(i) is not int or i < 0 for i in ids + copies) or len(set(zip(ids, copies))) != len(ids):
        raise ValueError("Each occurrence needs a unique nonnegative (source ID, copy ordinal).")
    labels = tuple(sorted(set(y))) if classes is None else tuple(classes)
    if not labels or len(set(labels)) != len(labels) or any(value not in labels for value in y):
        raise ValueError("The declared class vocabulary must contain every target.")
    state = fit_prepare(table, categories)
    filled = np.where(np.isnan(table), state.medians, table)
    return Neighbours(state, transform(state, table, categories), filled, y, ids, copies, labels, k)


def predict(model, numeric, categories=None):
    queries = transform(model.preparation, numeric, categories)
    filled = np.where(np.isnan(numeric_table(numeric)), model.preparation.medians, numeric_table(numeric))
    width = len(model.preparation.medians)
    records = []
    for index, query in enumerate(queries):
        # The shared mean cancels. Subtract before dividing, so integer-line
        # equal distances do not acquire unequal rounding from two centerings.
        delta = (model.numeric_values - filled[index]) / model.preparation.scales
        squared = np.sum(delta ** 2, axis=1)
        squared += np.sum((model.features[:, width:] - query[width:]) ** 2, axis=1)
        order = sorted(range(len(squared)), key=lambda j: (float(squared[j]), model.source_ids[j], model.copy_ordinals[j]))
        chosen = order[:model.k]
        votes = Counter(model.targets[j] for j in chosen)
        winner = max(model.classes, key=lambda label: votes[label])
        records.append({"prediction": winner,
                        "votes": [votes[label] for label in model.classes],
                        "fractions": [votes[label] / model.k for label in model.classes],
                        "neighbours": [(model.source_ids[j], model.copy_ordinals[j]) for j in chosen],
                        "squared_distances": [float(squared[j]) for j in chosen]})
    return records


def kfold_indices(n, k, shuffle=False, seed=0):
    if type(k) is not int or not 2 <= k <= n:
        raise ValueError("Require integer 2 <= folds <= rows.")
    indices = np.arange(n)
    if shuffle:
        np.random.default_rng(seed).shuffle(indices)
    folds = np.array_split(indices, k)
    for held in range(k):
        yield np.sort(np.concatenate([folds[j] for j in range(k) if j != held])), folds[held]


def validate_split(train, held, n):
    train, held = tuple(train), tuple(held)
    if not train or not held or any(not isinstance(i, (int, np.integer)) or not 0 <= i < n for i in train + held):
        raise ValueError("Need nonempty in-bounds integer train/held indices.")
    if len(set(train)) != len(train) or len(set(held)) != len(held) or set(train) & set(held):
        raise ValueError("Ordinary split positions must be distinct and disjoint.")


def evaluate_folds(numeric, targets, splits, k=1, categories=None, source_ids=None):
    table = numeric_table(numeric)
    y = np.asarray(targets)
    category_table(categories, len(table))
    # Pass original missing values to fit_prepare; do not treat its sentinel as observed input.
    original_category = None if categories is None else np.asarray(categories, dtype=object)
    ids = np.arange(len(table)) if source_ids is None else np.asarray(source_ids)
    if len(y) != len(table) or len(ids) != len(table) or len(set(ids.tolist())) != len(ids):
        raise ValueError("Ordinary evaluation needs aligned, distinct source IDs.")
    records = []
    for train, held in splits:
        validate_split(train, held, len(table))
        train, held = np.asarray(train), np.asarray(held)
        model = fit_knn(table[train], y[train].tolist(), ids[train].tolist(), k,
                        None if original_category is None else original_category[train])
        predictions = predict(model, table[held], None if original_category is None else original_category[held])
        correct = sum(row["prediction"] == target for row, target in zip(predictions, y[held]))
        records.append({"train_ids": ids[train].tolist(), "held_ids": ids[held].tolist(),
                        "state": model.preparation.__dict__, "predictions": predictions,
                        "correct": int(correct), "assessed": len(held)})
    if not records:
        raise ValueError("At least one split is required.")
    return {"folds": records,
            "fold_mean": float(np.mean([row["correct"] / row["assessed"] for row in records])),
            "pooled": sum(row["correct"] for row in records) / sum(row["assessed"] for row in records)}


def ordinary_pipeline(k=1, numeric_columns=1, category_columns=0):
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler, OneHotEncoder
    branches = [("numeric", Pipeline([("fill", SimpleImputer(strategy="median")),
                                      ("scale", StandardScaler())]), list(range(numeric_columns)))]
    if category_columns:
        branches.append(("category", Pipeline([
            ("fill", SimpleImputer(strategy="constant", fill_value=MISSING_CATEGORY)),
            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]),
            list(range(numeric_columns, numeric_columns + category_columns))))
    return Pipeline([("prepare", ColumnTransformer(branches)),
                     ("classify", KNeighborsClassifier(n_neighbors=k, weights="uniform", metric="euclidean", algorithm="brute"))])


def main():
    train = np.array([[0.], [2.], [np.nan], [4.]])
    held = np.array([[10.], [np.nan]])
    categories = np.array([["a"], ["b"], ["a"], [None]], dtype=object)
    query_categories = np.array([["a"], ["new"]], dtype=object)
    state = fit_prepare(train, categories)
    print("state", json.dumps(state.__dict__))
    print("held transform", transform(state, held, query_categories).round(10).tolist())
    tool = ordinary_pipeline(1, 1, 1)
    ordinary_train = np.concatenate([train.astype(object), np.where(categories == None, np.nan, categories)], axis=1)
    ordinary_held = np.concatenate([held.astype(object), query_categories], axis=1)
    tool.fit(ordinary_train, [0, 0, 1, 1])
    # Library sorts the same observed categories and uses population variance.
    print("ordinary transform", tool["prepare"].transform(ordinary_held).round(10).tolist())
    x = np.arange(7, dtype=float)[:, None]
    y = [0, 0, 0, 1, 1, 1, 1]
    result = evaluate_folds(x, y, list(kfold_indices(7, 3)))
    for row in result["folds"]:
        print("fold", row["train_ids"], row["held_ids"],
              [r["prediction"] for r in row["predictions"]], row["correct"], row["assessed"],
              "mean", row["state"]["means"], "variance", row["state"]["variances"])
    from sklearn.model_selection import cross_val_score
    scores = cross_val_score(ordinary_pipeline(), x, y, cv=list(kfold_indices(7, 3)), error_score="raise")
    print("fold mean", result["fold_mean"], "pooled", result["pooled"], "ordinary fold scores", scores.tolist())


if __name__ == "__main__":
    main()
