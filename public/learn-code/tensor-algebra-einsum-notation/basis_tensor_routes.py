"""One vector/functional/map/metric, two bases; Python 3 + NumPy 2.3.5.
Save explicit_einsum_scratch.py and Matrix Decompositions' canonical
matrix_decomposition_scratch.py beside this file. The QR/back-substitution
mechanism is reused, not reimplemented. S is finite square and invertible.
QR factors S once; each coordinate conversion then reuses those factors.
Square factorization O(d^3); each vector conversion O(d^2).
"""
import numpy as np
from explicit_einsum_scratch import einsum
from matrix_decomposition_scratch import householder_qr, apply_reflectors, back_solve

s = [[1., 1.], [0., 1.]]
v, f, a = [3., 2.], [2., -1.], [[2., 1.], [0., 1.]]
r, reflectors = householder_qr(s)


def coordinates(vector):
    return back_solve(r, apply_reflectors(reflectors, vector))


new_v = coordinates(v)
new_f = einsum('ij,i->j', s, f)
as_matrix = einsum('ij,jk->ik', a, s)
new_a = list(map(list, zip(*(coordinates(column) for column in zip(*as_matrix)))))
new_metric = einsum('ki,kj->ij', s, s)
print('new vector', [round(value, 6) for value in new_v])
print('new functional', new_f)
print('new map', [[round(value, 6) + 0.0 for value in row] for row in new_a])
print('new metric', new_metric)
print('measurement', einsum('i,i->', f, v), round(einsum('i,i->', new_f, new_v), 6))
print('coordinate square sum', round(einsum('i,i->', new_v, new_v), 6))
print('metric squared length', round(einsum('i,ij,j->', new_v, new_metric, new_v), 6))
print('numpy coordinate agreement', np.allclose(new_v, np.linalg.solve(s, v)))
print('numpy map agreement', np.allclose(new_a, np.linalg.solve(s, np.array(a) @ s)))
u = [-1., 2.]
tensor = einsum('i,j->ij', u, v)
new_tensor = einsum('i,j->ij', coordinates(u), new_v)
# Apply inverse action separately to both vector-type slots.
inverse = np.linalg.solve(s, np.eye(2))
print('two-upper-slot agreement', np.allclose(new_tensor, inverse @ tensor @ inverse.T))
