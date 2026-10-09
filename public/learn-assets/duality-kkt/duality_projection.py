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

target, normal = np.array([3.0, 4.0]), np.ones(2)
for budget in [5.0, 7.0, 9.0]:
    point, multiplier = project_halfspace(target, normal, budget)
    objective = float(np.sum((point - target)**2))
    print("budget", budget, "point", point.tolist(),
          "objective", objective, "multiplier", multiplier)
    assert np.allclose(2 * (point - target) + multiplier * normal, 0)
    assert np.isclose(objective, dual_value(target, normal, budget, multiplier))