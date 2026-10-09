import numpy as np
from scipy.linalg import expm


def linear_state(matrix, initial, time):
    matrix = np.asarray(matrix, dtype=float)
    initial = np.asarray(initial, dtype=float)
    if matrix.shape != (2, 2) or initial.shape != (2,):
        raise ValueError("Use a 2 by 2 matrix and a two-component initial state.")
    if not np.isfinite(matrix).all() or not np.isfinite(initial).all():
        raise ValueError("Use finite entries.")
    if np.max(np.abs(matrix)) > 8 or np.max(np.abs(initial)) > 2:
        raise ValueError(
            "Use matrix entries of magnitude at most 8 and initial entries at most 2."
        )
    if not np.isfinite(time) or not 0 <= time <= 20:
        raise ValueError("This example supports time from zero to twenty.")
    result = expm(time * matrix) @ initial
    if not np.isfinite(result).all():
        raise ValueError("The result exceeded the supported arithmetic range.")
    return result


matrix = np.array([[-1.0, 6.0], [0.0, -2.0]])
print("eigenvalues", np.linalg.eigvals(matrix).tolist())
for time in (0, np.log(2), 6):
    state = linear_state(matrix, [0, 1], time)
    print(
        f"t={time:.6f}: ({state[0]:.6f}, {state[1]:.6f}), norm={np.linalg.norm(state):.6f}"
    )
