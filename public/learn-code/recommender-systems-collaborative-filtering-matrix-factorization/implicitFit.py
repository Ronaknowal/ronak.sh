import numpy as np

counts = np.array(
    [
        [10, 3, 0, 1, 0, 15, 0],
        [8, 0, 5, 1, 2, 0, 4],
        [0, 6, 0, 0, 9, 12, 0],
        [1, 0, 0, 20, 7, 0, 3],
        [0, 1, 14, 8, 0, 0, 6],
    ],
    dtype=float,
)


def fit_implicit(counts, rank=3, alpha=10.0, penalty=0.1, sweeps=10, seed=5):
    users, items = counts.shape
    target, confidence = (counts > 0).astype(float), 1.0 + alpha * counts
    rng = np.random.default_rng(seed)
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))

    def objective():
        return float(
            (confidence * (target - p @ q.T) ** 2).sum()
            + penalty * ((p * p).sum() + (q * q).sum())
        )

    history = [objective()]
    for _ in range(sweeps):
        for factors, other, data in ((p, q, counts), (q, p, counts.T)):
            gram = other.T @ other
            for row in range(len(factors)):
                selected = data[row] > 0
                design = other[selected]
                conf = 1.0 + alpha * data[row, selected]
                normal = (
                    gram
                    + design.T @ ((conf - 1)[:, None] * design)
                    + penalty * np.eye(rank)
                )
                factors[row] = np.linalg.solve(normal, design.T @ conf)
            history.append(objective())
    assert np.all(np.diff(history) <= 1e-7)
    return p, q, history


p, q, history = fit_implicit(counts)
print(
    "objective initially / after first sweep / finally:",
    [round(history[j], 6) for j in (0, 2, -1)],
)
unseen = np.flatnonzero(counts[0] == 0)
print(
    "unseen scores:", [(int(item), round(float(p[0] @ q[item]), 6)) for item in unseen]
)
print("Scores are unconstrained factor products, not calibrated probabilities.")