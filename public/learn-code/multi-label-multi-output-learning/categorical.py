import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier

X = np.array([[a, b] for a in [-2, -1, 0, 1, 2] for b in [-1, 1]])
Y = np.column_stack(
    [
        np.where(X[:, 0] < 0, "low", np.where(X[:, 0] > 0, "high", "middle")),
        np.where(X[:, 1] < 0, "cool", "warm"),
    ]
)
model = MultiOutputClassifier(LogisticRegression(C=2, max_iter=500)).fit(X, Y)
query = np.array([[-1, 1], [0, -1]])
print(
    "Per-output classes:",
    [estimator.classes_.tolist() for estimator in model.estimators_],
)
print("Predictions:", model.predict(query).tolist())
print(
    "Probability shapes:", [list(array.shape) for array in model.predict_proba(query)]
)
