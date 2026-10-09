import numpy as np


def pair_loss(state, penalty):
    user, positive, negative = state.reshape(3, 2)
    gap = user @ (positive - negative)
    return float(np.logaddexp(0.0, -gap) + 0.5 * penalty * (state @ state))


def pair_gradient(state, penalty):
    user, positive, negative = state.reshape(3, 2)
    gap = user @ (positive - negative)
    signal = np.exp(-np.logaddexp(0.0, gap))
    return np.r_[
        -signal * (positive - negative) + penalty * user,
        -signal * user + penalty * positive,
        signal * user + penalty * negative,
    ]


state, penalty, rate = np.array([1.0, 0.5, 0.5, 1.0, 1.0, 0.0]), 0.1, 0.1
step = 1e-6
numeric = np.array(
    [
        (
            pair_loss(state + step * row, penalty)
            - pair_loss(state - step * row, penalty)
        )
        / (2 * step)
        for row in np.eye(6)
    ]
)
assert np.allclose(numeric, pair_gradient(state, penalty), atol=1e-8)
for iteration in range(6):
    user, positive, negative = state.reshape(3, 2)
    print(
        f"step={iteration}: gap={user@(positive-negative):.6f}, local loss={pair_loss(state, penalty):.6f}"
    )
    state -= rate * pair_gradient(state, penalty)
# This repeated pair illustrates its objective; a recommender samples many valid triples.