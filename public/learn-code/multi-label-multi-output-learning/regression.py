import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.multioutput import MultiOutputRegressor, RegressorChain

rng = np.random.default_rng(23)
X = rng.normal(size=(120, 3))
noise = rng.normal(size=(120, 2)) @ np.array([[0.2, 3.0], [0, 4.0]])
Y = np.c_[1 + 2 * X[:, 0] - X[:, 1], 30 + 15 * X[:, 0] + 5 * X[:, 2]] + noise
train, test = slice(0, 90), slice(90, None)
design = np.c_[np.ones(90), X[train]]
coefficients = np.linalg.lstsq(design, Y[train], rcond=None)[0]
columns = np.column_stack(
    [np.linalg.lstsq(design, Y[train, j], rcond=None)[0] for j in range(2)]
)
assert np.allclose(coefficients, columns)
vector = LinearRegression().fit(X[train], Y[train])
wrapper = MultiOutputRegressor(LinearRegression()).fit(X[train], Y[train])
assert np.allclose(vector.predict(X[test]), wrapper.predict(X[test]))
scales = Y[train].std(axis=0)  # Frozen from training only.
for name, prediction in [
    ("mean", np.broadcast_to(Y[train].mean(axis=0), Y[test].shape)),
    ("OLS", vector.predict(X[test])),
    ("ridge", Ridge(alpha=1).fit(X[train], Y[train]).predict(X[test])),
    (
        "linear chain",
        RegressorChain(LinearRegression(), order=[0, 1])
        .fit(X[train], Y[train])
        .predict(X[test]),
    ),
]:
    errors = prediction - Y[test]
    rmse = np.sqrt((errors**2).mean(axis=0))
    print(
        name,
        "RMSE [C,Wh]",
        np.round(rmse, 6).tolist(),
        "scaled MSE",
        round(float(np.mean((errors / scales) ** 2)), 6),
    )
print("OLS column solutions agree:", bool(np.allclose(coefficients, columns)))
