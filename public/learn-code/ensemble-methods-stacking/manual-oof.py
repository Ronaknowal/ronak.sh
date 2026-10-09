import numpy as np
from sklearn.base import clone
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor


def convex_weight(predictions, target):
    errors = predictions - target[:, None]
    difference = errors[:, 0] - errors[:, 1]
    denominator = float(difference @ difference)
    return (
        0.5
        if denominator == 0
        else float(np.clip(errors[:, 1] @ (-difference) / denominator, 0, 1))
    )


x = np.arange(6.0, dtype=float).reshape(-1, 1)
y = np.array([1.0, 2.0, 2.0, 6.0, 7.0, 8.0])
bases = [KNeighborsRegressor(1), LinearRegression()]
held_out = [np.array([0, 3]), np.array([1, 4]), np.array([2, 5])]
oof = np.full((len(y), len(bases)), np.nan)
coverage = np.zeros(len(y), dtype=int)
for held in held_out:
    train = np.setdiff1d(np.arange(len(y)), held)
    assert not set(train) & set(held)
    coverage[held] += 1
    for column, base in enumerate(bases):
        oof[held, column] = clone(base).fit(x[train], y[train]).predict(x[held])
assert np.all(coverage == 1) and np.isfinite(oof).all()
weight = convex_weight(oof, y)
full_bases = [clone(base).fit(x, y) for base in bases]
queries = np.array([0.5, 2.5, 4.5]).reshape(-1, 1)
new_predictions = np.column_stack([model.predict(queries) for model in full_bases])
prediction = new_predictions @ np.array([weight, 1 - weight])
print("OOF matrix:", np.round(oof, 6).tolist())
print(f"honest nearest weight: {weight:.6f}")
leaked = np.column_stack([model.predict(x) for model in full_bases])
print(f"in-sample nearest weight: {convex_weight(leaked,y):.6f}")
print("new predictions:", np.round(prediction, 6).tolist())
# These are explicitly NEW observed outcomes for a small worked check.
new_y = np.array([1.5, 4.0, 7.5])
print(f"worked new-row stack MSE: {np.mean((prediction-new_y)**2):.6f}")
print(f"worked new-row nearest MSE: {np.mean((new_predictions[:,0]-new_y)**2):.6f}")
