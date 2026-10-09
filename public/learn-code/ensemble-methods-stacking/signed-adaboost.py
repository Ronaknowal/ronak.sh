import numpy as np


def train_adaboost(x, labels, rounds=8):
    x = np.asarray(x, dtype=float)
    y = np.asarray(labels, dtype=float)
    if x.ndim != 1 or y.shape != x.shape or not len(x):
        raise ValueError("Use equally sized, nonempty one-dimensional inputs.")
    if not np.isfinite(x).all() or not np.isin(y, [-1, 1]).all():
        raise ValueError("Finite inputs and signed labels -1/+1 are required.")
    if type(rounds) is not int or not 1 <= rounds <= 50:
        raise ValueError("Use 1-50 rounds in this teaching implementation.")
    if np.max(np.abs(x)) > 1e6:
        raise ValueError("Input exceeds this example's supported numeric scale.")
    unique = np.unique(x)
    thresholds = np.r_[unique[0] - 1, unique[:-1] / 2 + unique[1:] / 2, unique[-1] + 1]
    weights = np.full(len(y), 1 / len(y))
    scores = np.zeros(len(y))
    history = []
    fitted = []
    for round_index in range(rounds):
        candidates = []
        for threshold in thresholds:
            for polarity in [-1, 1]:
                prediction = np.where(x <= threshold, polarity, -polarity)
                error = float(weights[prediction != y].sum())
                candidates.append((error, float(threshold), polarity, prediction))
        # Sort traversal is fixed; tiny arithmetic ties keep the first candidate.
        best = candidates[0]
        for candidate in candidates[1:]:
            if candidate[0] < best[0] - 1e-14:
                best = candidate
        error, threshold, polarity, prediction = best
        if error == 0:
            return {
                "status": "perfect",
                "perfect": (threshold, polarity),
                "fitted": fitted,
                "history": history,
            }
        if error >= 0.5 - 1e-14:
            return {
                "status": "no-edge",
                "perfect": None,
                "fitted": fitted,
                "history": history,
            }
        alpha = 0.5 * (np.log1p(-error) - np.log(error))
        before = weights.copy()
        updated = weights * np.exp(-alpha * y * prediction)
        normalizer = float(updated.sum())
        weights = updated / normalizer
        scores += alpha * prediction
        fitted.append((threshold, polarity, float(alpha)))
        history.append(
            {
                "error": error,
                "alpha": float(alpha),
                "before": before,
                "after": weights.copy(),
                "normalizer": normalizer,
                "loss": float(np.mean(np.exp(-y * scores))),
            }
        )
    return {
        "status": "round-limit",
        "perfect": None,
        "fitted": fitted,
        "history": history,
    }


def predict(model, x):
    x = np.asarray(x, dtype=float)
    if model["perfect"] is not None:
        threshold, polarity = model["perfect"]
        return np.where(x <= threshold, polarity, -polarity)
    scores = np.zeros(x.shape)
    for threshold, polarity, alpha in model["fitted"]:
        scores += alpha * np.where(x <= threshold, polarity, -polarity)
    return np.where(scores >= 0, 1, -1)


model = train_adaboost([0, 1, 2, 3, 4, 5], [-1, -1, 1, 1, -1, 1], rounds=3)
for index, row in enumerate(model["history"], 1):
    print(
        f"round {index}: error={row['error']:.6f}, alpha={row['alpha']:.6f}, loss={row['loss']:.6f}"
    )
    print("  next weights:", np.round(row["after"], 6).tolist())
print("new-query labels:", predict(model, [0.5, 2.5, 4.5]).tolist())
print("perfect fixture:", train_adaboost([0, 1, 2, 3], [-1, -1, 1, 1])["status"])
print("contradictory fixture:", train_adaboost([0, 0, 1, 1], [-1, 1, -1, 1])["status"])
