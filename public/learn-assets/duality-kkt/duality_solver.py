import cvxpy as cp
import numpy as np

target, normal, budget = np.array([3.0, 4.0]), np.ones(2), 5.0
x = cp.Variable(2)
limit = normal @ x <= budget
problem = cp.Problem(cp.Minimize(cp.sum_squares(x - target)), [limit])
problem.solve(solver="CLARABEL", tol_gap_abs=1e-10,
              tol_gap_rel=1e-10, tol_feas=1e-10)
if problem.status != cp.OPTIMAL:
    raise RuntimeError(f"Inspect solver status: {problem.status}")
point, multiplier = x.value, float(limit.dual_value)
primal_residual = max(0.0, float(normal @ point - budget))
stationarity = np.linalg.norm(2 * (point - target) + multiplier * normal)
complementarity = abs(multiplier * float(normal @ point - budget))
print("status", problem.status)
print("point", np.round(point, 6).tolist(), "lambda", round(multiplier, 6))
print("residuals below 1e-7", bool(max(primal_residual, stationarity, complementarity) < 1e-7))

# Validate a known exact feasible reconstruction separately from floating residuals.
feasible = np.array([2.0, 3.0])
lam = max(0.0, multiplier)
upper = float(np.sum((feasible - target)**2))
# Completed-square form avoids cancellation around the optimum lambda=2.
lower = 2.0 - 0.5 * (lam - 2.0)**2
print("reconstructed feasible", bool(normal @ feasible <= budget))
print("upper", upper, "lower", round(lower, 8), "gap", round(upper - lower, 8))
assert upper - lower >= 0 and np.allclose(point, feasible, atol=1e-7)