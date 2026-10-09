"""Same symmetric 3-by-3 task with NumPy 2.3.5 and the scratch solver.
Install NumPy; put symmetric_eigen_scratch.py beside this file.
Input/output orientation: eigenvectors are columns paired with ascending values.
"""
import numpy as np
from symmetric_eigen_scratch import symmetric_eigen, diagnostics

matrix = np.array([[2., 1., 0.], [1., 2., 1.], [0., 1., 2.]])
if not np.isfinite(matrix).all() or not np.array_equal(matrix, matrix.T):
    raise ValueError('eigh requires the announced finite symmetric input')
values, q = np.linalg.eigh(matrix)
scratch_values, scratch_q, rotations, _ = symmetric_eigen(matrix.tolist())
scratch_q = np.array(scratch_q)
print('ascending values', np.round(values, 6).tolist())
print('value agreement', np.allclose(values, scratch_values, rtol=1e-10, atol=1e-12))
# A sign change leaves a column's projector unchanged.
projector_errors = [np.linalg.norm(np.outer(q[:, j], q[:, j])
                      - np.outer(scratch_q[:, j], scratch_q[:, j]))
                    for j in range(matrix.shape[0])]
print('individual projector agreement', max(projector_errors) < 1e-10)
print('library error norms below 1e-10', all(v < 1e-10 for v in
      diagnostics(matrix.tolist(), values.tolist(), q.tolist()).values()))
print('scratch rotations', rotations)
# A repeated eigenvalue permits any orthonormal basis of its whole subspace.
changed = np.diag([1., 1., 3.])
changed_values, changed_q = np.linalg.eigh(changed)
block = changed_q[:, :2] @ changed_q[:, :2].T
print('tied block projector', np.round(block, 6).tolist())
