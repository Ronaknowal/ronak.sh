import numpy as np

first_step = np.array([[0.0, 2.0], [0.0, 0.0]])
second_step = np.array([[0.0, 0.0], [2.0, 0.0]])
two_step = second_step @ first_step
print(
    "each step's eigenvalues:",
    np.linalg.eigvals(first_step).tolist(),
    np.linalg.eigvals(second_step).tolist(),
)
print("two-step eigenvalues:", np.linalg.eigvals(two_step).tolist())
state = np.array([0.0, 1.0])
for cycle in range(4):
    print("cycle", cycle, "state", state.tolist(), "norm", float(np.linalg.norm(state)))
    state = two_step @ state
print(
    "The ordered product controls repeated evolution; separate eigenvalue lists lose that information."
)
