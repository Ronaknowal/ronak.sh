"""NumPy 2.3.5 on identical explicit sums; Python 3.
Keep explicit_einsum_scratch.py beside this file. No BLAS timing claim.
"""
import numpy as np
from explicit_einsum_scratch import einsum

a = np.array([[1, 2, 3], [-1, 0, 2]])
b = np.array([[2, 1], [0, 4], [1, -1]])
for expression, operands in [
    ('ik,kj->ij', (a, b)), ('ik,kj->ikj', (a, b)),
    ('ij->ji', (a,)), ('ij->j', (a,)),
    ('ii->', (np.array([[1, 2], [3, 4]]),)),
    ('bi,bi->b', (np.array([[2, 3]]), np.array([[1, 0], [0, 1]]))),
]:
    reference = einsum(expression, *(x.tolist() for x in operands))
    result = np.einsum(expression, *operands)
    print(expression, result.tolist(), 'scratch agrees', np.array_equal(result, reference))

# The scratch parser deliberately has no ellipsis or implicit-output mode.
x = np.arange(6).reshape(2, 1, 3)
y = np.arange(12).reshape(4, 3)
print('ellipsis shape', np.einsum('...i,...i->...', x, y).shape)
matrix = np.array([[1, 2], [3, 4]])
print('implicit ji', np.einsum('ji', matrix).tolist())
print('explicit ji->ji', np.einsum('ji->ji', matrix).tolist())
diagonal = np.einsum('ii->i', matrix)
diagonal[0] = 9
print('view source edit', np.shares_memory(diagonal, matrix), matrix.tolist())
independent = np.einsum('ij->ji', matrix).copy()
independent[0, 0] = -1
print('copy source preserved', int(matrix[0, 0]))
wide = np.array([100, 100], dtype=np.int8)
print('int8 total', int(np.einsum('i->', wide)))
print('int64 accumulation', int(np.einsum('i->', wide, dtype=np.int64)))
