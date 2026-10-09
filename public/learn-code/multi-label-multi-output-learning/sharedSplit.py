import numpy as np
from sklearn.tree import DecisionTreeRegressor
from sklearn.multioutput import MultiOutputRegressor

X = np.arange(4)[:, None]
Y = np.array([[0, 0], [0, 100], [2, 100], [2, 100]], dtype=float)
for energy_scale in [1, 100]:
    scales = np.array([1, energy_scale])
    shared = DecisionTreeRegressor(max_depth=1, random_state=0).fit(X, Y / scales)
    prediction = shared.predict(X) * scales
    print(
        "Energy scale",
        energy_scale,
        "shared cut",
        shared.tree_.threshold[0],
        "raw SSE",
        np.round(((Y - prediction) ** 2).sum(axis=0), 6).tolist(),
    )
separate = MultiOutputRegressor(DecisionTreeRegressor(max_depth=1, random_state=0)).fit(
    X, Y
)
print(
    "Separate cuts:",
    [float(model.tree_.threshold[0]) for model in separate.estimators_],
)
print("Separate training SSE:", ((Y - separate.predict(X)) ** 2).sum(axis=0).tolist())
