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


# Integer time is an invented event order, not a benchmark timestamp.
base = [
    (int(user), int(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
validation = [(0, 2, 4.0), (1, 1, 2.0), (2, 0, 4.0), (3, 2, 2.0), (4, 4, 2.0)]
test = [(0, 6, 4.0), (1, 5, 3.0), (2, 3, 1.0), (3, 1, 2.0), (4, 0, 2.0), (5, 0, 4.0)]
events = [(*row, time) for time, row in enumerate(base + validation + test, 1)]


def evaluate(cutoff=20, test_start=26):
    train = [row for row in events if row[3] <= cutoff]
    valid = [row for row in events if cutoff < row[3] < test_start]
    held = [row for row in events if row[3] >= test_start]
    if not train or not valid or not held:
        raise ValueError("All three time partitions must be nonempty.")
    configurations = [(rank, penalty) for rank in (1, 2, 3) for penalty in (0.05, 0.2)]
    validation_scores = []
    for rank, penalty in configurations:
        fitted = fit_mf(train, 6, 7, rank=rank, penalty=penalty)
        rmse = np.sqrt(
            np.mean([(score(fitted, u, i) - r) ** 2 for u, i, r, t in valid])
        )
        validation_scores.append((float(rmse), rank, penalty))
    # Ties are resolved by rank, then penalty. Test ratings have not been inspected.
    best_rmse, rank, penalty = min(validation_scores)
    final_train = train + valid
    fitted = fit_mf(final_train, 6, 7, rank=rank, penalty=penalty)
    mean = np.mean([row[2] for row in final_train])

    def item_baseline(item):
        values = [r for u, i, r, t in final_train if i == item]
        return (sum(values) + 3 * mean) / (len(values) + 3)

    print(
        f"split sizes={len(train)}/{len(valid)}/{len(held)}; selected rank={rank}, penalty={penalty}, validation RMSE={best_rmse:.6f}"
    )
    for name, subset in (
        ("all", held),
        ("warm users", [row for row in held if row[0] in fitted["seen_users"]]),
        ("cold users", [row for row in held if row[0] not in fitted["seen_users"]]),
    ):
        if not subset:
            print(name, "n=0; RMSE undefined")
            continue
        baseline = np.sqrt(
            np.mean([(item_baseline(i) - r) ** 2 for u, i, r, t in subset])
        )
        mf = np.sqrt(np.mean([(score(fitted, u, i) - r) ** 2 for u, i, r, t in subset]))
        print(
            f"{name}: n={len(subset)}, shrunk item RMSE={baseline:.6f}, MF RMSE={mf:.6f}"
        )
    # Popularity ranking uses only pre-test events; no test feedback is folded back in.
    history = {(u, i) for u, i, r, t in final_train}
    popular = {i: sum(1 for u, j, r, t in final_train if j == i) for i in range(7)}
    eligible = [i for i in range(7) if (0, i) not in history]
    print("user 0 eligible unseen:", eligible)
    print("popularity order:", sorted(eligible, key=lambda i: (-popular[i], i)))
    print("MF order:", sorted(eligible, key=lambda i: (-score(fitted, 0, i), i)))
    print(
        "Release times are 0 for these seven items; changing that assumption requires request-time eligibility."
    )


evaluate()
print("Changed cutoff, same untouched test period:")
evaluate(cutoff=18)