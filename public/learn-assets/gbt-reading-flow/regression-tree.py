"""Numeric mean-leaf tree/forest. Python 3.12, NumPy; run this file directly."""
from dataclasses import dataclass
import numpy as np


def checked_matrix(X, columns=None, allow_empty=False):
    X = np.asarray(X, dtype=np.float64)
    if X.ndim != 2 or X.shape[1] < 1 or (not allow_empty and len(X) == 0):
        raise ValueError('expected a nonempty two-dimensional numeric matrix')
    if columns is not None and X.shape[1] != columns:
        raise ValueError('query columns must match fitted columns')
    if not np.isfinite(X).all():
        raise ValueError('all features must be finite')
    return X


def moments(values):
    """Each prefix gets count, mean and centered sum of squares (M2)."""
    means = np.empty(len(values)); squares = np.empty(len(values))
    mean = m2 = 0.0
    with np.errstate(over='raise', invalid='raise'):
        for index, value in enumerate(values):
            count = index + 1
            delta = value - mean
            mean += delta / count
            m2 += delta * (value - mean)
            if not np.isfinite(mean) or not np.isfinite(m2):
                raise ValueError('target moments overflowed')
            means[index], squares[index] = mean, max(0.0, m2)
    return means, squares


@dataclass
class Node:
    count: int
    mean: float
    sse: float
    feature: int | None = None
    threshold: float | None = None
    left: object = None
    right: object = None


class RegressionTree:
    def __init__(self, max_depth=3, minimum_leaf=1, max_features=None, seed=0):
        if max_depth is not None and (type(max_depth) is not int or max_depth < 0):
            raise ValueError('depth must be None or a nonnegative integer')
        if type(minimum_leaf) is not int or minimum_leaf < 1:
            raise ValueError('minimum leaf must be a positive integer')
        self.max_depth, self.minimum = max_depth, minimum_leaf
        self.max_features, self.seed = max_features, seed

    def fit(self, X, y):
        X = checked_matrix(X); y = np.asarray(y, dtype=np.float64)
        if y.shape != (len(X),) or not np.isfinite(y).all():
            raise ValueError('one finite numerical target per row is required')
        d = X.shape[1]
        m = d if self.max_features is None else self.max_features
        if type(m) is not int or not 1 <= m <= d:
            raise ValueError('candidate-feature count must be in 1..d')
        self.columns = d
        rng = np.random.default_rng(self.seed)

        def grow(indices, depth):
            # Translation removes a large shared target offset before Welford.
            origin = y[indices[0]]
            with np.errstate(over='raise', invalid='raise'):
                centered = y[indices] - origin
            means, squares = moments(centered)
            mean = origin + means[-1]
            if not np.isfinite(mean):
                raise ValueError('leaf mean overflowed')
            node = Node(len(indices), float(mean), float(squares[-1]))
            if (self.max_depth is not None and depth >= self.max_depth) or node.sse == 0 or len(indices) < 2 * self.minimum:
                return node
            best = None
            features = sorted(rng.choice(d, m, replace=False))
            for feature in features:
                order = np.argsort(X[indices, feature], kind='stable')
                sorted_indices = indices[order]
                values = X[sorted_indices, feature]
                targets = centered[order]
                _, prefix = moments(targets)
                _, reverse = moments(targets[::-1])
                suffix = reverse[::-1]
                for cut in range(self.minimum, len(indices) - self.minimum + 1):
                    if values[cut - 1] == values[cut]:
                        continue
                    cost = prefix[cut - 1] + suffix[cut]
                    if best is None or cost < best[0]:
                        lower, upper = values[cut - 1], values[cut]
                        threshold = lower / 2 + upper / 2
                        if not lower <= threshold < upper:
                            threshold = lower
                        best = cost, int(feature), float(threshold), sorted_indices[:cut], sorted_indices[cut:]
            if best is not None and best[0] < node.sse:
                _, node.feature, node.threshold, left, right = best
                node.left, node.right = grow(left, depth + 1), grow(right, depth + 1)
            return node

        self.root = grow(np.arange(len(X)), 0)
        return self

    def predict(self, X):
        if not hasattr(self, 'root'):
            raise ValueError('fit the tree before predicting')
        X = checked_matrix(X, self.columns, allow_empty=True)
        answers = []
        for row in X:
            node = self.root
            while node.left is not None:
                node = node.left if row[node.feature] <= node.threshold else node.right
            answers.append(node.mean)
        return np.asarray(answers)


class RegressionForest:
    def __init__(self, members=10, seed=0, **tree_settings):
        if type(members) is not int or members < 1:
            raise ValueError('positive member count required')
        self.members, self.seed, self.settings = members, seed, tree_settings

    def fit(self, X, y):
        X = checked_matrix(X); y = np.asarray(y, dtype=float)
        if y.shape != (len(X),) or not np.isfinite(y).all():
            raise ValueError('one finite numerical target per row is required')
        rng = np.random.default_rng(self.seed)
        self.trees, self.draws = [], []
        self.columns = X.shape[1]
        for _ in range(self.members):
            draws = rng.integers(len(X), size=len(X))
            tree = RegressionTree(seed=int(rng.integers(2**31)), **self.settings).fit(X[draws], y[draws])
            self.trees.append(tree); self.draws.append(draws)
        return self

    def predict(self, X):
        if not hasattr(self, 'trees'):
            raise ValueError('fit the forest before predicting')
        X = checked_matrix(X, self.columns, allow_empty=True)
        # Incremental average avoids a B-by-query prediction matrix.
        average = np.zeros(len(X))
        for count, tree in enumerate(self.trees, 1):
            average += (tree.predict(X) - average) / count
        if not np.isfinite(average).all():
            raise ValueError('ensemble average overflowed')
        return average


if __name__ == '__main__':
    from sklearn.tree import DecisionTreeRegressor
    X = np.arange(6, dtype=float).reshape(-1, 1)
    y = np.array([1, 1.5, 2, 4, 4.5, 5])
    query = np.array([[-10], [2.5], [4], [20]])
    tree = RegressionTree(max_depth=1).fit(X, y)
    native = DecisionTreeRegressor(max_depth=1, random_state=0).fit(X, y)
    forest = RegressionForest(members=10, max_depth=2, seed=4).fit(X, y)
    print('scratch:', tree.predict(query).tolist())
    print('library:', native.predict(query).tolist())
    print('root SSE:', tree.root.sse, 'child SSE:', tree.root.left.sse + tree.root.right.sse)
    print('forest:', np.round(forest.predict(query), 6).tolist())
