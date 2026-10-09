"""Python 3 and NumPy 2.3.5; keep explicit_einsum_scratch.py beside this.
Matricization uses a stated bijection, not an assumed reshape convention.
All one-mode computations use the explained index contraction.
"""
import numpy as np
from explicit_einsum_scratch import einsum

x = np.arange(24).reshape(2, 3, 4)
# Mode b becomes the row. Flatten the remaining (n,d) in n-major order.
unfold_b = [[int(x[b, n, d]) for n in range(3) for d in range(4)] for b in range(2)]
# Mode n becomes the row. Flatten the remaining (b,d) in b-major order.
unfold_n = [[int(x[b, n, d]) for b in range(2) for d in range(4)] for n in range(3)]
print('b unfolding row1', unfold_b[1])
print('n unfolding row0', unfold_n[0])
print('b unfolding agrees', np.array_equal(unfold_b, x.reshape(2, 12)))
print('n unfolding agrees', np.array_equal(unfold_n, x.transpose(1, 0, 2).reshape(3, 8)))
print('plain reshape is n unfolding', np.array_equal(unfold_n, x.reshape(3, 8)))

w = [[1, 0], [0, 1], [1, -1], [2, 0]]
y = einsum('bnd,df->bnf', x.tolist(), w)
print('input fiber X[1,0,:]', x[1, 0].tolist())
print('output fiber Y[1,0,:]', y[1][0])
print('mode product agrees', np.array_equal(y, np.einsum('bnd,df->bnf', x, w)))
u, v, z = [1, 2], [3, -1], [2, 0, 4]
rank_one = einsum('i,j,k->ijk', u, v, z)
print('rank-one fiber [1,0,:]', rank_one[1][0])
print('rank-one whole shape', np.shape(rank_one))
print('outer-product agreement', np.array_equal(rank_one, np.einsum('i,j,k->ijk', u, v, z)))
