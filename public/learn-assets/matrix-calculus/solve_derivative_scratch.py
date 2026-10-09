"""Implicit solve sensitivities, reusing the Matrix Decompositions QR owner.

Keep the unchanged matrix_decomposition_scratch.py beside this file.
Inputs: finite moderate real square invertible A; matching b,c,q and E.
One O(n^3) factorization, then O(n^2) forward, tangent and adjoint solves;
O(n^2) factors and matrix-gradient storage. No dense four-index Jacobian.
This computes derivatives of the solved equation, not of truncated iterations.
"""
from matrix_decomposition_scratch import (
    apply_reflectors, back_solve, forward_solve, householder_qr, matvec,
)


def solve_with_factors(r, reflectors, right):
    return back_solve(r, apply_reflectors(reflectors, right))


def transpose_solve(r, reflectors, right):
    # A=QR: R^T w=q, then lambda=Qw, so A^T lambda=q.
    lower = [list(column) for column in zip(*r)]
    return apply_reflectors(reflectors, forward_solve(lower, right), transpose=False)


def solve_sensitivities(a, b, coefficient_rate, rhs_rate, output_weights):
    r, reflectors = householder_qr(a)
    solution = solve_with_factors(r, reflectors, b)
    effect = matvec(coefficient_rate, solution)
    tangent_rhs = [rate - moving for rate, moving in zip(rhs_rate, effect)]
    tangent = solve_with_factors(r, reflectors, tangent_rhs)
    adjoint = transpose_solve(r, reflectors, output_weights)
    grad_matrix = [[-left * right for right in solution] for left in adjoint]
    scalar_rate = sum(weight * rate for weight, rate in zip(output_weights, tangent))
    pairing = (sum(left * right for left, right in zip(adjoint, rhs_rate))
               + sum(grad_matrix[i][j] * coefficient_rate[i][j]
                     for i in range(len(a)) for j in range(len(a))))
    return solution, tangent, adjoint, grad_matrix, scalar_rate, pairing


if __name__ == '__main__':
    a = [[2., 1.], [-1., 3.]]  # Nonsymmetric: A^T is a distinct solve.
    b = [1., 2.]
    e = [[1., 0.], [0., 0.]]
    c = [0., 1.]
    q = [1., -2.]
    u, du, adjoint, grad_a, slope, pairing = solve_sensitivities(a, b, e, c, q)
    print('u', [round(value, 6) for value in u])
    print('solution rate', [round(value, 6) for value in du])
    print('adjoint', [round(value, 6) for value in adjoint])
    print('grad_A', [[round(value, 6) for value in row] for row in grad_a])
    print('scalar rate', round(slope, 6), 'Frobenius pairing', round(pairing, 6))
