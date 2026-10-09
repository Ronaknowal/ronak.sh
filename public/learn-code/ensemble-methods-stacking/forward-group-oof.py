import numpy as np
from sklearn.base import clone
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import GroupKFold, TimeSeriesSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

x = np.arange(12.0, dtype=float).reshape(-1, 1)
y = (
    2
    + 0.4 * x[:, 0]
    + np.array([0, 0.2, -0.1, 0.3, 0, -0.2, 0.1, 0, 0.2, -0.1, 0.1, -0.2])
)
bases = [make_pipeline(StandardScaler(), Ridge(alpha=1)), LinearRegression()]
oof = np.full((len(y), 2), np.nan)
for train, held in TimeSeriesSplit(n_splits=3).split(x):
    assert max(train) < min(held)
    for column, base in enumerate(bases):
        oof[held, column] = clone(base).fit(x[train], y[train]).predict(x[held])
    print("time fit:", train.tolist(), "predict:", held.tolist())
covered = np.isfinite(oof).all(axis=1)
meta = Ridge(alpha=1).fit(oof[covered], y[covered])
refits = [clone(base).fit(x, y) for base in bases]
next_x = np.array([[12.0]])
next_meta = np.column_stack([model.predict(next_x) for model in refits])
print("uncovered prefix:", np.flatnonzero(~covered).tolist())
print(f"next-time prediction: {meta.predict(next_meta)[0]:.6f}")

groups = np.repeat(np.arange(6), 2)
group_oof = np.full((len(y), 2), np.nan)
for train, held in GroupKFold(3).split(x, y, groups):
    assert not set(groups[train]) & set(groups[held])
    for column, base in enumerate(bases):
        group_oof[held, column] = clone(base).fit(x[train], y[train]).predict(x[held])
assert np.isfinite(group_oof).all()
print("group-safe covered rows:", int(np.isfinite(group_oof).all(axis=1).sum()))
print("These are DIFFERENT evaluation targets: future rows versus new groups.")
