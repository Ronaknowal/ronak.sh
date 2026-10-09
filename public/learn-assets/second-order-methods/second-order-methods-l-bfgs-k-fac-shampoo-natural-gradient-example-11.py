import itertools
import numpy as np

inputs = np.array([[1., -1.], [1., 2.]])
labels = np.array([[1., 0.], [0., 1.]])
weights = np.array([[0.8, -0.5], [-0.4, 0.6]])
input_factor = np.zeros((2, 2))
output_factor = np.zeros((2, 2))
fisher = np.zeros((4, 4))
enumerated = np.zeros_like(fisher)
gradient = np.zeros_like(weights)
for input_vector, label in zip(inputs, labels):
    probabilities = 1 / (1 + np.exp(-(weights @ input_vector)))
    input_outer = np.outer(input_vector, input_vector)
    covariance = np.diag(probabilities*(1-probabilities))
    input_factor += input_outer / 2
    output_factor += covariance / 2
    fisher += np.kron(input_outer, covariance) / 2
    gradient += np.outer(probabilities-label, input_vector) / 2
    for outcome in itertools.product([0, 1], repeat=2):
        outcome = np.array(outcome)
        mass = np.prod(np.where(outcome, probabilities, 1-probabilities))
        score = np.outer(outcome-probabilities, input_vector).ravel(order="F")
        enumerated += mass * np.outer(score, score) / 2
factored = np.kron(input_factor, output_factor)
assert np.allclose(fisher, enumerated, atol=1e-14)
flat_gradient = gradient.ravel(order="F")
damping = 0.1
exact_direction = np.linalg.solve(fisher + damping*np.eye(4), -flat_gradient)
factored_direction = np.linalg.solve(factored + damping*np.eye(4), -flat_gradient)
factor_damped = np.kron(input_factor + np.sqrt(damping)*np.eye(2),
                       output_factor + np.sqrt(damping)*np.eye(2))
print("model-outcome enumeration agrees:", np.allclose(fisher, enumerated))
print("factorization error:", round(np.linalg.norm(factored-fisher), 6))
print("exact damped direction:", np.round(exact_direction, 6))
print("factored damped direction:", np.round(factored_direction, 6))
print("factor-damping is a different matrix:", not np.allclose(factor_damped, factored+damping*np.eye(4)))
# With no damping, factors can be applied by two smaller solves.
left_solved = np.linalg.solve(output_factor, gradient)
matrix_result = np.linalg.solve(input_factor, left_solved.T).T
assert np.allclose(matrix_result.ravel(order="F"), np.linalg.solve(factored, flat_gradient))
print("two factor solves agree with Kronecker solve:", True)
