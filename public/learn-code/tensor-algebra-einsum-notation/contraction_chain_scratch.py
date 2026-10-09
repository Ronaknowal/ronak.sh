"""Choose the lower multiplication count for three compatible matrices.
Python 3 + NumPy 2.3.5; explicit_einsum_scratch.py beside this file.
Both parenthesizations are explicitly computed through the taught sum.
The chosen count is optimal among these two dense parenthesizations only.
Each multiply stores just its output, never an a*b*c*d product array.
Counts omit additions, input/output residency and hardware performance.
"""
import numpy as np
from explicit_einsum_scratch import einsum, shape


def chain(a, b, c):
    a_shape, b_shape, c_shape = map(shape, (a, b, c))
    if any(len(s) != 2 for s in (a_shape, b_shape, c_shape)):
        raise ValueError('use three matrices')
    if a_shape[1] != b_shape[0] or b_shape[1] != c_shape[0]:
        raise ValueError('adjacent inner dimensions must match')
    m, k = a_shape
    _, n = b_shape
    _, p = c_shape
    left_cost, right_cost = m*k*n + m*n*p, k*n*p + m*k*p
    if left_cost <= right_cost:
        temporary = einsum('ik,kj->ij', a, b)
        result = einsum('ij,jl->il', temporary, c)
        return result, 'left', left_cost, (m, n)
    temporary = einsum('kj,jl->kl', b, c)
    result = einsum('ik,kl->il', a, temporary)
    return result, 'right', right_cost, (k, p)


if __name__ == '__main__':
    def matrix(rows, columns):
        return [[((i*7+j) % 5 - 2)/10 for j in range(columns)] for i in range(rows)]

    for dimensions in [(5, 40, 2, 30), (30, 2, 40, 5)]:
        m, k, n, p = dimensions
        a, b, c = matrix(m, k), matrix(k, n), matrix(n, p)
        result, order, cost, temporary = chain(a, b, c)
        print('dimensions', dimensions, 'order', order, 'multiplications', cost, 'temporary', temporary)
        print('matrix operator agreement', np.allclose(result, np.array(a) @ b @ c))
        path, report = np.einsum_path('ab,bc,cd->ad', a, b, c, optimize='greedy')
        print('current-list path', path)
        print('reused path agreement', np.allclose(result,
              np.einsum('ab,bc,cd->ad', a, b, c, optimize=path)))
