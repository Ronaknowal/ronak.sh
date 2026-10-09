"""Two unequal masses, three unit springs; SciPy 1.18.1 generalized eigh.
Units: M kilograms, K newtons/metre, values seconds^-2, positions metres.
SciPy returns columns V with V.T @ M @ V = I, not V.T @ V = I.
"""
import numpy as np
from scipy.linalg import eigh

m = np.diag([2., 1.])
k = np.array([[2., -1.], [-1., 2.]])
cholesky = np.linalg.cholesky(m)
values, modes = eigh(k, m)
white = np.linalg.solve(cholesky, np.linalg.solve(cholesky, k).T).T
white_values, white_modes = np.linalg.eigh(white)
original_modes = np.linalg.solve(cholesky.T, white_modes)
print('squared frequencies', np.round(values, 6).tolist())
print('analytic roots agreement', np.allclose(values, [(3 - np.sqrt(3)) / 2, (3 + np.sqrt(3)) / 2]))
print('generalized residual below 1e-12', np.linalg.norm(k @ modes - m @ modes * values) < 1e-12)
print('mass orthogonality', np.round(modes.T @ m @ modes, 6).tolist())
print('whitened matrix', np.round(white, 6).tolist())
print('whitening values agreement', np.allclose(white_values, values))
print('whitening column-projector agreement', all(np.linalg.norm(np.outer(original_modes[:, i], original_modes[:, i])
      - np.outer(modes[:, i], modes[:, i])) < 1e-12 for i in range(2)))
q0 = np.array([0.2, 0.1])
coefficients = modes.T @ m @ q0
print('initial-position reconstruction', np.allclose(modes @ coefficients, q0))
for time in [0., 0.5, 1.]:
    oscillation = np.cos(np.sqrt(values) * time)
    position = modes @ (coefficients * oscillation)
    acceleration = modes @ (-values * coefficients * oscillation)
    print('time', time, 'position m', np.round(position, 6).tolist(),
          'Newton residual below 1e-12', np.linalg.norm(m @ acceleration + k @ position) < 1e-12)
