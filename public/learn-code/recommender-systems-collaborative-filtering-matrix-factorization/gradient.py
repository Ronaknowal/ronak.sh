import numpy as np

mean, rating, penalty, rate = 3.0, 5.0, 0.1, 0.05
state = np.array([0.4, -0.2, 0.5, 0.3, 0.1, -0.1])


def objective(values):
    p, q, bu, bi = values[:2], values[2:4], values[4], values[5]
    error = rating - mean - bu - bi - p @ q
    return 0.5 * (error**2 + penalty * (values @ values))


def gradient(values):
    p, q, bu, bi = values[:2], values[2:4], values[4], values[5]
    error = rating - mean - bu - bi - p @ q
    return np.r_[
        -error * q + penalty * p,
        -error * p + penalty * q,
        -error + penalty * bu,
        -error + penalty * bi,
    ]


analytic = gradient(state)
step = 1e-6
numeric = np.array(
    [
        (objective(state + step * row) - objective(state - step * row)) / (2 * step)
        for row in np.eye(6)
    ]
)
assert np.allclose(analytic, numeric, atol=1e-8)
updated = state - rate * analytic
print("gradient:", np.round(analytic, 6).tolist())
print("new state:", np.round(updated, 6).tolist())
print(f"local objective: {objective(state):.6f} -> {objective(updated):.6f}")
for changed_rate in (0.05, 0.5, 1.0):
    print(
        f"rate={changed_rate}: objective={objective(state-changed_rate*analytic):.6f}"
    )