"""A bounded Gaussian sketch as a coordinate preconditioner for original least squares.

Run with Python 3.12, NumPy 2.3.5 and SciPy 1.18.1. The declared fixture is
real, tall and full column rank. This uses ordinary library QR and triangular
solves; the earlier Matrix Decompositions lesson explains those mechanisms.
No inverse is formed. The sketch changes coordinates, not the fitting target.
This small exact-reference study measures no runtime or speed improvement.
"""

import numpy as np
from scipy.linalg import qr, solve_triangular
from scipy.sparse.linalg import LinearOperator, lsqr


def preconditioned_least_squares(A, b, S):
    """Return x and the actual LSQR diagnostics for min ||Ax-b||_2.

    Inputs are finite real two-dimensional A/S and one-dimensional b. A is tall,
    S has at least n rows and exactly m columns, and SA must have a numerically
    nonsingular n-by-n triangular factor. This is an unregularized route:
    damp=0. Adding damping in y coordinates would change the original penalty.
    """
    A, b, S = (np.asarray(x, dtype=float) for x in (A, b, S))
    if A.ndim != 2 or b.ndim != 1 or S.ndim != 2:
        raise ValueError("A and S must be matrices; b must be a vector")
    m, n = A.shape
    if not n or m < n or b.shape != (m,) or S.shape[1] != m or S.shape[0] < n:
        raise ValueError("require tall A, matching b, and a sketch with at least n rows")
    if not all(np.isfinite(x).all() for x in (A, b, S)):
        raise ValueError("all inputs must be finite")
    with np.errstate(over="ignore", invalid="ignore"):
        sketch = S @ A
    if not np.isfinite(sketch).all():
        raise ValueError("sketch multiplication exceeded finite floating-point range")
    _, R = qr(sketch, mode="economic")
    cutoff = np.finfo(float).eps * max(S.shape[0], n) * np.linalg.norm(R, 2)
    if np.any(np.abs(np.diag(R)) <= cutoff):
        raise ValueError("sketched triangular factor is numerically singular")

    # y=Rx and x=R^{-1}y. B=AR^{-1}; B.T=R^{-T}A.T.
    def action(y):
        return A @ solve_triangular(R, y, lower=False)

    def adjoint(v):
        return solve_triangular(R.T, A.T @ v, lower=True)

    B = LinearOperator((m, n), matvec=action, rmatvec=adjoint, dtype=float)
    fit = lsqr(B, b, damp=0, atol=1e-12, btol=1e-12, iter_lim=10 * n)
    x = solve_triangular(R, fit[0], lower=False)
    return x, fit, B, R


if __name__ == "__main__":
    A = np.column_stack([np.ones(6), np.arange(6, dtype=float)])
    b = np.array([1.1, 2.9, 5.2, 6.8, 9.1, 10.9])
    rng = np.random.RandomState(7)
    S = rng.standard_normal((4, 6)) / np.sqrt(4)
    x, fit, B, R = preconditioned_least_squares(A, b, S)
    reference = np.linalg.lstsq(A, b, rcond=None)[0]
    sketch_only = np.linalg.lstsq(S @ A, S @ b, rcond=None)[0]
    assert fit[1] in (1, 2), "LSQR did not report converged compatible/least-squares status"
    assert np.allclose(x, reference, rtol=1e-10, atol=1e-10)
    # Test the actual adjoint and original stationarity independently of lsqr.
    y = np.array([.4, -.7])
    v = np.array([1, -2, 3, -4, 5, -6], dtype=float)
    assert np.isclose(np.dot(B @ y, v), np.dot(y, B.rmatvec(v)))
    assert np.allclose(A.T @ (A @ x - b), 0, atol=1e-10)
    print("original-objective coefficients:", np.round(x, 9).tolist())
    print("full-reference coefficients:", np.round(reference, 9).tolist())
    print("sketch-only coefficients:", np.round(sketch_only, 9).tolist())
    print("original residual / sketch-only original residual:",
          round(float(np.linalg.norm(A @ x - b)), 9),
          round(float(np.linalg.norm(A @ sketch_only - b)), 9))
    print("LSQR stop code / iterations:", fit[1], fit[2])
    print("original normal-equation residual:", round(float(np.linalg.norm(A.T @ (A @ x - b))), 12))
