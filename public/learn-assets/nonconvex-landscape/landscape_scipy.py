"""Local SciPy diagnostics for one completely specified quartic.

Run: python landscape_scipy.py
Requires NumPy and SciPy. No random starts or global-search claim.
The three known brackets are valid for the fixed tilt delta=0.15 only.
Analytic derivatives cost O(1); iteration budgets bound each solve.
"""
import numpy as np
from scipy.optimize import brentq, minimize

DELTA = 0.15


def value(x):
    return 0.25 * (x * x - 1) ** 2 + DELTA * x


def derivative(x):
    return x ** 3 - x + DELTA


def main():
    roots = []
    for lo, hi in [(-1.5, -0.6), (-0.5, 0.5), (0.6, 1.5)]:
        root, info = brentq(derivative, lo, hi, xtol=1e-13,
                           maxiter=100, full_output=True)
        curvature = 3 * root * root - 1
        assert info.converged and abs(derivative(root)) < 1e-11
        roots.append(root)
        print(f"root={root:.9f} value={value(root):.9f} curvature={curvature:.9f}")
    print("local solves:")
    for start in [-1.4, 1.4, roots[1]]:
        result = minimize(lambda z: value(z[0]), np.array([start]),
                          jac=lambda z: np.array([derivative(z[0])]),
                          method="BFGS", options={"gtol": 1e-9, "maxiter": 100})
        x = float(result.x[0])
        print(f"start={start:.9f} success={bool(result.success)} x={x:.9f} "
              f"value={value(x):.9f} |gradient|={abs(derivative(x)):.3e} "
              f"curvature={3*x*x-1:.9f}")
        assert result.success and abs(derivative(x)) < 1e-8
    # On each monotonic interval of derivative, these are all its roots.
    # Coercivity supplies existence; comparison of both minima supplies globality.
    assert value(roots[0]) < value(roots[2])
    assert 3 * roots[1] ** 2 - 1 < 0


if __name__ == "__main__":
    main()
