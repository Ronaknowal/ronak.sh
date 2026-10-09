"""Same implicit operator via SciPy factor reuse and PyTorch float64 AD.

Keep solve_derivative_scratch.py and its unchanged Matrix Decompositions
matrix_decomposition_scratch.py dependency adjacent. NumPy2.3.5, SciPy1.18.1,
PyTorch2.14.0 CPU were tested. A is finite, square, invertible and moderate.
SciPy trans=1 solves A^T; real transpose is distinct from conjugate transpose.
"""
import numpy as np
from scipy.linalg import lu_factor, lu_solve
import torch
from solve_derivative_scratch import solve_sensitivities


if __name__ == '__main__':
    torch.set_num_threads(1)
    a = np.array([[2., 1.], [-1., 3.]])
    b, c, q = np.array([1., 2.]), np.array([0., 1.]), np.array([1., -2.])
    e = np.array([[1., 0.], [0., 0.]])
    factors = lu_factor(a)
    u = lu_solve(factors, b)
    rate = lu_solve(factors, c - e @ u)
    adjoint = lu_solve(factors, q, trans=1)
    grad_a = -np.outer(adjoint, u)
    original = solve_sensitivities(a.tolist(), b.tolist(), e.tolist(), c.tolist(), q.tolist())
    for actual, expected in zip(original[:4], [u, rate, adjoint, grad_a]):
        np.testing.assert_allclose(actual, expected, rtol=1e-12, atol=1e-12)
    ta = torch.tensor(a, requires_grad=True)
    tb = torch.tensor(b, requires_grad=True)
    objective = torch.tensor(q) @ torch.linalg.solve(ta, tb)
    objective.backward()
    np.testing.assert_allclose(ta.grad.numpy(), grad_a, rtol=1e-12, atol=1e-12)
    np.testing.assert_allclose(tb.grad.numpy(), adjoint, rtol=1e-12, atol=1e-12)
    h = 1e-5
    numeric = (np.linalg.solve(a+h*e, b+h*c)-np.linalg.solve(a-h*e, b-h*c))/(2*h)
    np.testing.assert_allclose(numeric, rate, rtol=1e-8, atol=1e-10)
    print('reused LU u', np.round(u, 6).tolist())
    print('reused LU rate', np.round(rate, 6).tolist())
    print('transpose solve adjoint', np.round(adjoint, 6).tolist())
    print('matrix gradient', np.round(grad_a, 6).tolist())
    print('scalar slope', round(float(q @ rate), 6))
    print('scratch, SciPy, autograd and finite-change checks', True)
