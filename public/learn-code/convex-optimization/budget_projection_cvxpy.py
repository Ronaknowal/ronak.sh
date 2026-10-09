"""Compare the same budget projection with an ordinary convex solver.

Run beside budget_projection_scratch.py. Dependencies: Python 3.12,
NumPy 2.3.5, CVXPY 1.9.2 and Clarabel 0.11.1 in the recorded environment.
Both routes minimize half the squared Euclidean distance, with the same
nonnegative coordinates and sum <= budget. Solver status and the supporting
plane certificate are reported separately; a solver result is approximate.
This small comparison is not a speed benchmark.
"""

import cvxpy as cp
import numpy as np
from budget_projection_scratch import certificate, project_budget


def solve_projection(target, budget):
    """Validate through the scratch contract, then solve the identical model."""
    exact = project_budget(target, budget)
    values = np.asarray(target, dtype=float)
    w = cp.Variable(values.size)
    constraints = [w >= 0, cp.sum(w) <= float(budget)]
    problem = cp.Problem(cp.Minimize(0.5 * cp.sum_squares(w - values)), constraints)
    assert problem.is_dcp()
    problem.solve(solver=cp.CLARABEL, tol_gap_abs=1e-10, tol_gap_rel=1e-10,
                  tol_feas=1e-10)
    if problem.status != cp.OPTIMAL or w.value is None:
        raise RuntimeError(f"projection did not return optimal status: {problem.status}")
    candidate = np.asarray(w.value, dtype=float)
    if not np.all(np.isfinite(candidate)):
        raise RuntimeError("solver returned a nonfinite candidate")
    return exact, candidate, problem.status, certificate(values, candidate, budget)


def main():
    target = [4.0, 3.0, -2.0]
    for budget in [0.0, 1.0, 4.0, 10.0]:
        exact, candidate, status, diagnostic = solve_projection(target, budget)
        difference = np.max(np.abs(candidate - exact['weights']))
        print(f"budget {budget:g}; status {status}")
        print("scratch:", np.round(exact['weights'], 6).tolist())
        print("solver:", np.round(candidate, 6).tolist())
        print("maximum coordinate difference:", f"{difference:.3e}")
        print("objective/lower/gap/feasibility:", [f"{v:.8g}" for v in diagnostic])
        # A tiny objective gap need not imply equally tiny coordinates near
        # an active-set boundary: squared distance controls that comparison.
        assert difference < 1e-4
        assert abs(diagnostic[2]) < 1e-7 and diagnostic[3] < 1e-7


if __name__ == '__main__':
    main()
