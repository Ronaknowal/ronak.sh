import numpy as np

def soft_threshold(value, threshold):
    return np.sign(value) * np.maximum(np.abs(value) - threshold, 0.0)

def fit_coordinates(X, y, strength, ratio, tolerance=1e-10, max_sweeps=10000):
    X, y = np.asarray(X, float), np.asarray(y, float)
    if X.ndim != 2 or y.shape != (len(X),) or len(X) == 0:
        raise ValueError("X must be nonempty rows by features, y one target per row")
    if not (np.isfinite(X).all() and np.isfinite(y).all()):
        raise ValueError("Use finite data; handle missing observations before fitting")
    if not np.isfinite([strength, ratio]).all() or strength < 0 or not 0 <= ratio <= 1:
        raise ValueError("Use nonnegative strength and a mixing ratio in [0, 1]")
    n, p = X.shape
    mean_x, mean_y = X.mean(axis=0), y.mean()
    Z, target = X - mean_x, y - mean_y
    curvature = np.mean(Z * Z, axis=0)
    weight = np.zeros(p)
    residual = target.copy()
    for sweep in range(1, max_sweeps + 1):
        for j in range(p):
            partial = residual + Z[:, j] * weight[j]
            association = Z[:, j] @ partial / n
            denominator = curvature[j] + strength * (1 - ratio)
            weight[j] = (soft_threshold(association, strength * ratio)
                         / denominator) if denominator > 0 else 0.0
            residual = partial - Z[:, j] * weight[j]
        gradient = -(Z.T @ residual) / n + strength * (1 - ratio) * weight
        violation = np.where(
            weight != 0,
            np.abs(gradient + strength * ratio * np.sign(weight)),
            np.maximum(np.abs(gradient) - strength * ratio, 0),
        )
        optimality_residual = float(violation.max(initial=0))
        if optimality_residual <= tolerance:
            intercept = float(mean_y - mean_x @ weight)
            return weight, intercept, sweep, optimality_residual
    raise RuntimeError("Coordinate fit did not meet the requested optimality tolerance")

X = np.array([[1, 1], [1, -1], [-1, 1], [-1, -1]], float)
y = np.array([3.4, 2.6, -2.6, -3.4])
for name, ratio in [("ridge", 0), ("lasso", 1), ("elastic_net", .5)]:
    weight, intercept, sweeps, residual = fit_coordinates(X, y, 1, ratio)
    print(name, np.round(weight, 6), round(intercept, 6), sweeps)