import cvxpy as cp
import numpy as np

X = np.array([[-2.0, 0.0], [-1.0, 1.0], [1.0, 1.0], [2.0, 0.0]])
y = np.array([-1.0, -1.0, 1.0, 1.0])
w, offset = cp.Variable(2), cp.Variable()
margin = cp.multiply(y, X @ w + offset) >= 1
primal = cp.Problem(cp.Minimize(0.5 * cp.sum_squares(w)), [margin])
options = dict(solver="CLARABEL", tol_gap_abs=1e-10,
               tol_gap_rel=1e-10, tol_feas=1e-10)
primal.solve(**options)

alpha = cp.Variable(len(y))
recovered = X.T @ cp.multiply(y, alpha)
dual = cp.Problem(cp.Maximize(cp.sum(alpha) - 0.5 * cp.sum_squares(recovered)),
                  [alpha >= 0, y @ alpha == 0])
dual.solve(**options)
if primal.status != cp.OPTIMAL or dual.status != cp.OPTIMAL:
    raise RuntimeError("Both problems must report an inspected optimal result")
weights_from_dual = X.T @ (y * alpha.value)
slack = y * (X @ w.value + offset.value) - 1
def display(values):
    result = np.round(np.asarray(values), 6)
    result[result == 0] = 0  # Normalize only displayed signed zero.
    return result.tolist()
print("weight", display(w.value), "offset", round(float(offset.value), 6))
print("dual coefficients", display(alpha.value))
print("margin slack", display(slack))
print("primal and dual values", round(primal.value, 6), round(dual.value, 6))
print("weight reconstruction", bool(np.allclose(w.value, weights_from_dual, atol=1e-7)))
print("complementarity", bool(np.max(np.abs(alpha.value * slack)) < 1e-7))
assert np.max(-slack) < 1e-7 and np.min(alpha.value) > -1e-7
assert abs(float(y @ alpha.value)) < 1e-7
assert np.allclose(w.value, [1.0, 0.0], atol=1e-7)