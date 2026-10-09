import numpy as np

gradients = [np.array(value, dtype=float) for value in
             [[[1, 2], [0, 1]], [[2, 0], [1, -1]], [[0.5, -1], [2, 0.5]]]]

def inverse_quarter(matrix):
    values, vectors = np.linalg.eigh(matrix)
    if values.min() <= 0:
        raise ValueError("Positive definite accumulators are required.")
    return (vectors * values**(-0.25)) @ vectors.T

def replay(sequence, epsilon=0.1):
    rows, columns = sequence[0].shape
    left, right = epsilon*np.eye(rows), epsilon*np.eye(columns)
    parameter = np.zeros((rows, columns))
    directions = []
    for gradient in sequence:
        left += gradient @ gradient.T
        right += gradient.T @ gradient
        direction = inverse_quarter(left) @ gradient @ inverse_quarter(right)
        parameter -= 0.1 * direction
        directions.append(direction)
    return parameter, directions, left, right

parameter, directions, left, right = replay(gradients)
angle = np.pi / 5
rotation = np.array([[np.cos(angle), -np.sin(angle)],
                     [np.sin(angle), np.cos(angle)]])
rotated_parameter, rotated_directions, _, _ = replay([rotation @ g for g in gradients])
assert all(np.allclose(actual, rotation @ original, atol=1e-12)
           for actual, original in zip(rotated_directions, directions))
print("first preconditioned gradient:", np.round(directions[0], 6))
print("final left accumulator:", np.round(left, 6))
print("final right accumulator:", np.round(right, 6))
print("parameter after three replay updates:", np.round(parameter, 6))
print("row rotation commutes with the update:", np.allclose(rotated_parameter, rotation @ parameter))
