"""Squared-loss boosting composed with the published sorted mean-leaf tree.

Keep the exact supplied regression-tree.py beside this file. NumPy is required;
the runnable ordinary comparison additionally uses scikit-learn.
"""
import importlib.util
from pathlib import Path
import sys
import numpy as np

spec = importlib.util.spec_from_file_location(
    'boosting_regression_tree', Path(__file__).with_name('regression-tree.py'))
tree_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = tree_module
spec.loader.exec_module(tree_module)
RegressionTree = tree_module.RegressionTree
checked_matrix = tree_module.checked_matrix


class ResidualEnsemble:
    def __init__(self, rounds=2, rate=.5, depth=1, minimum_leaf=1):
        if type(rounds) is not int or rounds < 0:
            raise ValueError('rounds must be a nonnegative integer')
        if not np.isfinite(rate) or rate < 0:
            raise ValueError('rate must be finite and nonnegative')
        self.rounds, self.rate = rounds, float(rate)
        self.depth, self.minimum_leaf = depth, minimum_leaf

    def fit(self, X, y):
        X = checked_matrix(X)
        y = np.asarray(y, dtype=np.float64)
        if y.shape != (len(X),) or not np.isfinite(y).all():
            raise ValueError('one finite target per row is required')
        intercept = float(y.mean())
        current = np.full(len(y), intercept)
        trees, history = [], [float(np.mean((y-current)**2))]
        for _ in range(self.rounds):
            tree = RegressionTree(max_depth=self.depth,
                                  minimum_leaf=self.minimum_leaf).fit(X, y-current)
            current += self.rate * tree.predict(X)
            trees.append(tree)
            history.append(float(np.mean((y-current)**2)))
        if not np.isfinite(current).all():
            raise ValueError('ensemble arithmetic overflowed')
        # A successful refit replaces the complete predictor, never appends.
        self.columns, self.intercept = X.shape[1], intercept
        self.trees, self.history = trees, history
        return self

    def predict(self, X, prefix=None):
        if not hasattr(self, 'trees'):
            raise ValueError('fit before predicting')
        X = checked_matrix(X, self.columns, allow_empty=True)
        prefix = len(self.trees) if prefix is None else prefix
        if type(prefix) is not int or not 0 <= prefix <= len(self.trees):
            raise ValueError('prefix must be a saved count in 0..rounds')
        answer = np.full(len(X), self.intercept)
        for tree in self.trees[:prefix]:
            answer += self.rate * tree.predict(X)
        return answer


def main():
    from sklearn.ensemble import GradientBoostingRegressor
    X = np.arange(1., 7.).reshape(-1, 1)
    y = np.array([2., 2., 3., 7., 8., 8.])
    model = ResidualEnsemble().fit(X, y)
    native = GradientBoostingRegressor(loss='squared_error', n_estimators=2,
        learning_rate=.5, max_depth=1, random_state=73).fit(X, y)
    query = np.array([[-2.], [2.5], [4.5], [8.]])
    print('mean intercept:', model.intercept)
    print('MSE at prefixes 0, 1, 2:', np.round(model.history, 6).tolist())
    print('saved query predictions:', np.round(model.predict(query), 6).tolist())
    print('ordinary query predictions:', np.round(native.predict(query), 6).tolist())
    print('maximum comparison difference:', float(np.max(np.abs(model.predict(query)-native.predict(query)))))


if __name__ == '__main__':
    main()
