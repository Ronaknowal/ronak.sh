import numpy as np

# Minimize ||x||^2 with A x = b. Here A has independent rows.
A = np.array([[1.0, 1.0]])
b = np.array([2.0])
n, m = A.shape[1], A.shape[0]
K = np.block([[2 * np.eye(n), A.T], [A, np.zeros((m, m))]])
solution = np.linalg.solve(K, np.concatenate([np.zeros(n), b]))
x, nu = solution[:n], solution[n:]
dual = float(-0.25 * nu @ A @ A.T @ nu - b @ nu)
print("equality point", x.tolist(), "nu", nu.tolist(), "value", float(x @ x))
print("dual", dual, "stationarity", np.allclose(2 * x + A.T @ nu, 0))

# Changed contract: x1+x2 >= 2 is g(x)=2-x1-x2 <= 0.
lam = 2.0
print("inequality lambda", lam,
      "stationarity", np.allclose(2 * x - lam * np.ones(2), 0),
      "slack", float(x.sum() - 2))