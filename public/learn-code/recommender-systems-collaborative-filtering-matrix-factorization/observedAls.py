import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)


def als(ratings, rank=2, penalty=0.3, sweeps=12, seed=4):
    observed = np.isfinite(ratings)
    users, items = ratings.shape
    rng = np.random.default_rng(seed)
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))

    # Once-per-entity regularization; this example has no bias terms.
    def objective():
        return float(
            ((ratings[observed] - (p @ q.T)[observed]) ** 2).sum()
            + penalty * ((p * p).sum() + (q * q).sum())
        )

    values = [objective()]
    for _ in range(sweeps):
        for user in range(users):
            selected = observed[user]
            design = q[selected]
            p[user] = np.linalg.solve(
                design.T @ design + penalty * np.eye(rank),
                design.T @ ratings[user, selected],
            )
        values.append(objective())
        for item in range(items):
            selected = observed[:, item]
            design = p[selected]
            q[item] = np.linalg.solve(
                design.T @ design + penalty * np.eye(rank),
                design.T @ ratings[selected, item],
            )
        values.append(objective())
    assert np.all(np.diff(values) <= 1e-8)
    return p, q, values


p, q, objectives = als(ratings)
print("first four objective values:", [round(x, 6) for x in objectives[:4]])
print("final objective:", round(objectives[-1], 6))
print("user 0 unseen scores:", np.round((p @ q.T)[0, [2, 4, 6]], 6).tolist())
# Both rank-one matrices agree on the two observed diagonal entries.
first = np.array([[1.0, 0.5], [2.0, 1.0]])
second = np.array([[1.0, 2.0], [0.5, 1.0]])
print("same observations, different completions:", first.tolist(), second.tolist())
assert np.linalg.matrix_rank(first) == np.linalg.matrix_rank(second) == 1