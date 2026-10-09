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


def predict(
    user, item, centered=True, minimum_overlap=2, shrinkage=2.0, k=3, signed=False
):
    if observed[user, item]:
        raise ValueError("This example predicts an unobserved pair.")
    prior = 3.0  # Declared rating prior when the entire training matrix is empty.
    global_mean = float(ratings[observed].mean()) if observed.any() else prior
    counts = observed.sum(axis=1)
    user_means = np.divide(
        np.where(observed, ratings, 0.0).sum(axis=1),
        counts,
        out=np.full(len(ratings), global_mean),
        where=counts > 0,
    )
    fallback = float(user_means[user])
    evidence = []
    for other in np.flatnonzero(observed[user]):
        shared = observed[:, item] & observed[:, other]
        count = int(shared.sum())
        center = user_means[shared] if centered else 0.0
        left, right = ratings[shared, item] - center, ratings[shared, other] - center
        norm_product = np.linalg.norm(left) * np.linalg.norm(right)
        cosine = float(left @ right / norm_product) if norm_product else 0.0
        weight = (
            cosine * count / (count + shrinkage)
            if count >= minimum_overlap and norm_product
            else 0.0
        )
        signal = ratings[user, other] - (fallback if centered else 0.0)
        if weight > 0 or (signed and weight != 0):
            evidence.append((int(other), count, weight, float(signal)))
    evidence.sort(key=lambda row: (-abs(row[2]), row[0]))
    selected = evidence[:k]
    denominator = sum(abs(row[2]) for row in selected)
    value = (
        (fallback if centered else 0.0)
        + sum(row[2] * row[3] for row in selected) / denominator
        if denominator
        else fallback
    )
    return value, selected


for centered, support, shrinkage in [(False, 1, 0.0), (True, 2, 2.0), (True, 4, 2.0)]:
    value, selected = predict(0, 2, centered, support, shrinkage)
    print(f"centered={centered}, minimum={support}, score={value:.6f}")
    print(
        "  selected (item, overlap, weight, signal):",
        [
            tuple(round(x, 6) if isinstance(x, float) else x for x in row)
            for row in selected
        ],
    )