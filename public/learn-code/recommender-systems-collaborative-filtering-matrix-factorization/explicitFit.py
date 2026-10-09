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


def fit_mf(records, users, items, rank=2, penalty=0.1, rate=0.02, epochs=160, seed=7):
    # This objective sums a regularized local term for every observed record.
    # A user/item with d records therefore has its penalty counted d times.
    rng = np.random.default_rng(seed)
    mean = float(np.mean([row[2] for row in records]))
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))
    bu, bi = np.zeros(users), np.zeros(items)
    seen_users, seen_items = {row[0] for row in records}, {row[1] for row in records}
    for user in set(range(users)) - seen_users:
        p[user] = 0.0
    for item in set(range(items)) - seen_items:
        q[item] = 0.0
    history = []
    for epoch in range(epochs):
        rolling_sse = 0.0
        for position in rng.permutation(len(records)):
            user, item, rating = records[position][:3]
            old_p, old_q = p[user].copy(), q[item].copy()
            old_bu, old_bi = bu[user], bi[item]
            error = rating - mean - old_bu - old_bi - old_p @ old_q
            rolling_sse += error**2
            p[user] += rate * (error * old_q - penalty * old_p)
            q[item] += rate * (error * old_p - penalty * old_q)
            bu[user] += rate * (error - penalty * old_bu)
            bi[item] += rate * (error - penalty * old_bi)
        fixed_errors, objective = [], 0.0
        for user, item, rating, *rest in records:
            error = rating - mean - bu[user] - bi[item] - p[user] @ q[item]
            fixed_errors.append(error**2)
            objective += 0.5 * (
                error**2
                + penalty
                * (
                    p[user] @ p[user]
                    + q[item] @ q[item]
                    + bu[user] ** 2
                    + bi[item] ** 2
                )
            )
        if not np.isfinite(objective):
            raise ArithmeticError("Training left the finite numerical range.")
        history.append(
            (
                np.sqrt(rolling_sse / len(records)),
                np.sqrt(np.mean(fixed_errors)),
                objective,
            )
        )
    return dict(
        mean=mean,
        p=p,
        q=q,
        bu=bu,
        bi=bi,
        seen_users=seen_users,
        seen_items=seen_items,
        history=history,
    )


def score(model, user, item):
    known_user = user in model["seen_users"]
    known_item = item in model["seen_items"]
    value = model["mean"]
    if known_user:
        value += model["bu"][user]
    if known_item:
        value += model["bi"][item]
    if known_user and known_item:
        value += model["p"][user] @ model["q"][item]
    return float(value)


records = [
    (int(user), int(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
model = fit_mf(records, 5, 7)
for epoch in (0, 39, 79, 159):
    rolling, fixed, objective = model["history"][epoch]
    print(
        f"epoch={epoch+1}: rolling={rolling:.6f}, fixed training={fixed:.6f}, objective={objective:.6f}"
    )
ranking = sorted(
    (score(model, 0, item), item) for item in range(7) if not observed[0, item]
)
print(
    "user 0 unseen, descending:",
    [
        (item, round(value, 6))
        for value, item in sorted(ranking, key=lambda row: (-row[0], row[1]))
    ],
)
print("No held-out score was computed in this mechanism demonstration.")