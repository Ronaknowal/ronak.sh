"""One finite 2D LP: exact certificate and ordinary SciPy/HiGHS solve.

The corner helper enumerates pairwise boundary intersections in two dimensions.
It does not detect recession directions, unboundedness or optima without vertices.
Its callers supply a finite optimum proved by the matching exact certificate.
"""
from fractions import Fraction as F
from itertools import combinations
import numpy as np
import scipy
from scipy.optimize import linprog


def corners(rows):
    """Feasible vertices for exact rows (a, b, c) meaning a*x+b*y <= c.

O(m^3) exact arithmetic operations and O(m^2) stored candidate vertices;
bit complexity additionally depends on input rational numerators/denominators.
"""
    if len(rows) < 2 or any(len(row) != 3 for row in rows):
        raise ValueError("Use at least two three-entry half-plane rows")
    if any(not isinstance(v, (int, F)) or isinstance(v, bool) for row in rows for v in row):
        raise ValueError("Use exact integer or Fraction coefficients")
    rows = [tuple(map(F, row)) for row in rows]
    points = set()
    for (a, b, c), (d, e, f) in combinations(rows, 2):
        determinant = a * e - b * d
        if determinant == 0:
            continue
        point = ((c * e - b * f) / determinant, (a * f - c * d) / determinant)
        if all(r * point[0] + s * point[1] <= t for r, s, t in rows):
            points.add(point)
    return sorted(points)


def original_feasibility(point, demands):
    x, y = point
    return x >= 0 and y >= 0 and x + y >= demands[0] and x + 3 * y >= demands[1]


def exact_certificate(demands):
    primal_rows = [(-1, -1, -demands[0]), (-1, -3, -demands[1]), (-1, 0, 0), (0, -1, 0)]
    dual_rows = [(1, 1, 3), (1, 3, 5), (-1, 0, 0), (0, -1, 0)]
    primal = corners(primal_rows)
    dual = corners(dual_rows)
    assert primal and dual
    point = min(primal, key=lambda z: 3 * z[0] + 5 * z[1])
    price = max(dual, key=lambda z: demands[0] * z[0] + demands[1] * z[1])
    upper = 3 * point[0] + 5 * point[1]
    lower = demands[0] * price[0] + demands[1] * price[1]
    # Weak duality plus these feasible equal values proves global optimality.
    assert original_feasibility(point, demands)
    assert price[0] >= 0 and price[1] >= 0
    assert price[0] + price[1] <= 3 and price[0] + 3 * price[1] <= 5
    assert upper == lower
    return primal, dual, point, price, upper


def library_certificate(demands, exact_point, exact_price, exact_value):
    result = linprog([3.0, 5.0], A_ub=[[-1.0, -1.0], [-1.0, -3.0]],
                     b_ub=-np.asarray(demands, dtype=float),
                     bounds=[(0.0, None), (0.0, None)], method="highs")
    if not result.success or result.status != 0:
        raise RuntimeError(f"HiGHS did not return an optimum: {result.message}")
    # HiGHS reports derivatives with respect to the TRANSFORMED <= RHS.
    price = -np.asarray(result.ineqlin.marginals)
    point = np.asarray(result.x)
    A = np.array([[1.0, 1.0], [1.0, 3.0]])
    b = np.asarray(demands, dtype=float)
    c = np.array([3.0, 5.0])
    tol = 1e-8
    assert np.min(point) >= -tol and np.min(A @ point - b) >= -tol
    assert np.min(price) >= -tol and np.min(c - A.T @ price) >= -tol
    assert np.max(np.abs(price * (A @ point - b))) < tol
    assert np.max(np.abs(point * (c - A.T @ price))) < tol
    assert abs(c @ point - b @ price) < tol
    np.testing.assert_allclose(point, np.asarray(exact_point, dtype=float), atol=tol, rtol=0)
    np.testing.assert_allclose(price, np.asarray(exact_price, dtype=float), atol=tol, rtol=0)
    assert abs(result.fun - float(exact_value)) < tol
    return result.status, point, price


def main():
    print("scipy", scipy.__version__, "numpy", np.__version__)
    for demands in ((F(4), F(6)), (F(21, 5), F(6))):
        primal, dual, point, price, value = exact_certificate(demands)
        print("demands", tuple(map(str, demands)))
        print("primal_vertices", [tuple(map(str, z)) for z in primal])
        print("dual_vertices", [tuple(map(str, z)) for z in dual])
        print("exact_point", tuple(map(str, point)), "price", tuple(map(str, price)), "value", value)
        status, approx_point, approx_price = library_certificate(demands, point, price, value)
        print("highs_status", status, "point", np.round(approx_point, 6).tolist(),
              "price", np.round(approx_price, 6).tolist())
    assert F(72, 5) - 14 == F(2) * F(1, 5)
    print("exact_changed_value_minus_baseline", F(2, 5))
    print("certificate_checks", "passed")


if __name__ == "__main__":
    main()
