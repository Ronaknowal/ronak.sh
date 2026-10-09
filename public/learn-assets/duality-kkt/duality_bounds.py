import numpy as np

def project_halfspace(target, normal, budget):
    target = np.asarray(target, dtype=float)
    normal = np.asarray(normal, dtype=float)
    if target.ndim != 1 or target.size == 0 or normal.shape != target.shape:
        raise ValueError("Use matching nonempty vectors")
    if not np.isfinite(target).all() or not np.isfinite(normal).all() or not np.isfinite(budget):
        raise ValueError("Inputs must be finite")
    squared_norm = float(normal @ normal)
    if squared_norm == 0:
        raise ValueError("This half-space example requires a nonzero normal")
    excess = max(0.0, float(normal @ target) - budget)
    point = target - (excess / squared_norm) * normal
    multiplier = 2 * excess / squared_norm
    return point, multiplier

def dual_value(target, normal, budget, multiplier):
    return (multiplier * (normal @ target - budget)
            - multiplier**2 * (normal @ normal) / 4)

target, normal, budget = np.array([3.0, 4.0]), np.ones(2), 5.0
for point, multiplier in [(np.array([2.0, 2.0]), 1.0),
                          (np.array([4.0, 4.0]), 2.0),
                          (np.array([2.0, 3.0]), -1.0)]:
    cost = float(np.sum((point - target)**2))
    residual = float(normal @ point - budget)
    lower = float(dual_value(target, normal, budget, multiplier))
    lagrangian = cost + multiplier * residual
    minimizer = target - multiplier * normal / 2
    decomposition = (-multiplier * residual + np.sum((point - minimizer)**2))
    assert np.isclose(cost - lower, decomposition)
    valid = residual <= 0 and multiplier >= 0
    print("x", point.tolist(), "lambda", multiplier, "L", lagrangian, "q", lower)
    print("valid certificate", valid, "gap", cost - lower if valid else None)