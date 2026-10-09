import numpy as np

def two_loop(gradient, pairs, gamma):
    q = gradient.copy()
    coefficients = []
    for step, change in reversed(pairs):
        curvature = step @ change
        if curvature <= 1e-12:
            raise ValueError("This teaching implementation requires positive curvature.")
        alpha = (step @ q) / curvature
        coefficients.append(alpha)
        q -= alpha * change
    result = gamma * q
    for (step, change), alpha in zip(pairs, reversed(coefficients)):
        beta = (change @ result) / (step @ change)
        result += step * (alpha - beta)
    return result

def dense_reference(pairs, gamma, size):
    inverse = gamma * np.eye(size)
    for step, change in pairs:
        rho = 1 / (step @ change)
        correction = np.eye(size) - rho * np.outer(step, change)
        inverse = correction @ inverse @ correction.T + rho * np.outer(step, step)
    return inverse

hessian = np.array([[4., 1.], [1., 2.]])
steps = [np.array(value, dtype=float) for value in [[1, 0], [0, 1], [1, -1]]]
history = [(step, hessian @ step) for step in steps]
gradient = np.array([3., 1.])
for memory in [1, 2, 3]:
    pairs = history[-memory:]
    step, change = pairs[-1]
    gamma = (step @ change) / (change @ change)
    transformed = two_loop(gradient, pairs, gamma)
    inverse = dense_reference(pairs, gamma, 2)
    assert np.allclose(transformed, inverse @ gradient, atol=1e-12)
    assert np.allclose(inverse @ change, step, atol=1e-12)
    print("memory:", memory, "direction:", np.round(-transformed, 6))
print("exact Newton:", np.round(np.linalg.solve(hessian, -gradient), 6))
try:
    two_loop(gradient, [(steps[-1], -history[-1][1])], 1)
except ValueError:
    print("negative-curvature pair: rejected")
