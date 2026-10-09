import numpy as np
from scipy.optimize import linprog

a = np.array([0.2, 0.5, 0.3])
b = np.array([0.4, 0.1, 0.5])
costs = np.array([[0.0, 4.0, 1.0], [2.0, 1.0, 3.0], [3.0, 0.0, 2.0]])
rows, columns = costs.shape
constraints = np.zeros((rows + columns, rows * columns))
for i in range(rows):
    constraints[i, i * columns : (i + 1) * columns] = 1
for j in range(columns):
    constraints[rows + j, j::columns] = 1
result = linprog(
    costs.ravel(), A_eq=constraints, b_eq=np.r_[a, b], bounds=(0, None), method="highs"
)
if not result.success:
    raise RuntimeError(result.message)
plan = result.x.reshape(rows, columns)
f = result.eqlin.marginals[:rows]
g = result.eqlin.marginals[rows:]
slack = costs - f[:, None] - g[None, :]
dual = a @ f + b @ g
assert np.max(np.abs(plan.sum(axis=1) - a)) < 1e-10
assert np.max(np.abs(plan.sum(axis=0) - b)) < 1e-10
assert slack.min() >= -1e-10
assert abs(result.fun - dual) < 1e-10
print("transport cost:", f"{result.fun:.6f}")
print("dual lower bound:", f"{dual:.6f}")
print("maximum weighted slack:", f"{np.max(np.abs(plan * slack)):.6f}")
print("feasible:", True)
# An optimizer/certificate need not be unique. Check these invariants instead
# of promising identical chosen entries across every solver version.