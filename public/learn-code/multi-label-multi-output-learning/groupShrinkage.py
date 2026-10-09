import numpy as np
from sklearn.linear_model import MultiTaskLasso, Lasso

# X.T X / n = I, so each feature-row objective separates exactly.
X = np.sqrt(3) * np.eye(3)
Z = np.array([[3.0, 4.0], [0.5, 2.0], [0.0, 0.0]])
Y = X @ Z
penalty = 2.0
norms = np.linalg.norm(Z, axis=1)
factors = np.maximum(0, 1 - penalty / np.maximum(norms, 1e-30))
expected = Z * factors[:, None]
group = (
    MultiTaskLasso(alpha=penalty, fit_intercept=False, tol=1e-12, max_iter=10000)
    .fit(X, Y)
    .coef_.T
)
separate = np.column_stack(
    [
        Lasso(alpha=penalty, fit_intercept=False, tol=1e-12).fit(X, Y[:, j]).coef_
        for j in range(2)
    ]
)
assert np.allclose(group, expected)
print("Grouped coefficients:", np.round(group, 6).tolist())
print("Separate coefficients:", np.round(separate, 6).tolist())
print("Grouped formula matches actual estimator:", bool(np.allclose(group, expected)))
