import math
import numpy as np


def correction(n):
    if n <= 1:
        return 0.0
    return 2 * sum(1 / j for j in range(1, n)) - 2 * (n - 1) / n


def grow(values, depth, limit, rng):
    lo, hi = float(values.min()), float(values.max())
    if len(values) <= 1 or depth == limit or lo == hi:
        return {"size": len(values)}
    cut = rng.uniform(lo, hi)
    left = values < cut
    if not left.any() or left.all():
        return {"size": len(values)}
    return {
        "cut": cut,
        "left": grow(values[left], depth + 1, limit, rng),
        "right": grow(values[~left], depth + 1, limit, rng),
    }


def path(tree, query, depth=0):
    if "size" in tree:
        return depth + correction(tree["size"])
    child = "left" if query < tree["cut"] else "right"
    return path(tree[child], query, depth + 1)


def fit_forest(values, n_trees=200, max_samples=256, seed=17):
    values = np.asarray(values, dtype=float)
    if values.ndim != 1 or len(values) < 2 or not np.isfinite(values).all():
        raise ValueError("Use at least two finite one-dimensional observations.")
    if type(max_samples) is not int or max_samples < 2:
        raise ValueError("Use an integer max_samples >= 2.")
    if type(n_trees) is not int or n_trees < 1:
        raise ValueError("Use a positive integer number of trees.")
    size = min(max_samples, len(values))
    rng = np.random.default_rng(seed)
    trees = [grow(rng.choice(values, size, replace=False), 0,
                  math.ceil(math.log2(size)), rng) for _ in range(n_trees)]
    return trees, size


def anomaly_scores(fitted, queries):
    trees, size = fitted
    mean_paths = [np.mean([path(tree, x) for tree in trees]) for x in queries]
    return 2 ** (-np.asarray(mean_paths) / correction(size))


x = np.array([0., 1., 2., 3., 12.])
fitted = fit_forest(x)
scores = anomaly_scores(fitted, x)
print("Fitted sample size:", fitted[1])
print("Most easily isolated position:", x[np.argmax(scores)])
print("Scores:", np.round(scores, 4))
print("Duplicate-only scores:", anomaly_scores(fit_forest([2., 2., 2.]), [2., 2.]))