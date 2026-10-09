"""Censor-aware numeric survival trees and bootstrap forests from scratch.

Imports the taught log-rank sweep and grouped KM/NA estimators. Node fitting
uses occurrence counts; finite float64 numeric data, no entry or weights.
No pruning, missing-value routing or claim of scikit-survival seed parity.
Curve queries hold a leaf's final step through global training follow-up;
local-support fractions expose that extension rather than implying new data.
"""

from bisect import bisect_right
from dataclasses import dataclass
from math import isqrt
from numbers import Integral

import numpy as np

from survival_estimators import kaplan_meier
from survival_rates import nelson_aalen
from survival_metric_inputs import observations
from survival_tree_splits import best_split, numeric_features, positive_integer


@dataclass(frozen=True)
class Leaf:
    times: tuple[float, ...]
    survival: tuple[float, ...]
    cumulative_hazard: tuple[float, ...]
    followup_end: float
    subject_ids: tuple[int, ...]
    failures: int


@dataclass
class Node:
    feature: int | None = None
    threshold: float | None = None
    statistic: float | None = None
    left: int | None = None
    right: int | None = None
    leaf: Leaf | None = None


@dataclass(frozen=True)
class Curves:
    survival: np.ndarray
    cumulative_hazard: np.ndarray
    local_support_fraction: np.ndarray
    members: np.ndarray


def _seed(value):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Integral) or value < 0:
        raise ValueError("random_state must be a nonnegative integer.")
    return int(value)


def _depth(value):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Integral) or value < 0:
        raise ValueError("max_depth must be a nonnegative integer; root depth is zero.")
    return int(value)


class SurvivalTree:
    def __init__(self, *, min_leaf=2, max_depth=5, max_features=None, random_state=0):
        self.min_leaf = positive_integer(min_leaf, "min_leaf")
        self.max_depth = _depth(max_depth)
        self.max_features = None if max_features is None else positive_integer(max_features, "max_features")
        self.random_state = _seed(random_state)

    def fit(self, x, times, events, *, subject_ids=None):
        t, d = observations(times, events)
        x = numeric_features(x, len(t))
        self.n_features = x.shape[1]
        count = self.n_features if self.max_features is None else self.max_features
        if count > self.n_features:
            raise ValueError("max_features exceeds the number of columns.")
        ids = np.arange(len(t)) if subject_ids is None else np.asarray(subject_ids)
        if ids.shape != t.shape or ids.dtype.kind not in "iu" or (ids < 0).any():
            raise ValueError("subject_ids must be one nonnegative integer per occurrence.")
        self.followup_end = float(t.max())
        self.nodes = [Node()]
        rng = np.random.default_rng(self.random_state)
        stack = [(0, np.arange(len(t)), 0)]
        while stack:
            position, rows, depth = stack.pop()
            split = None
            if depth < self.max_depth and len(rows) >= 2 * self.min_leaf:
                features = (np.arange(self.n_features) if count == self.n_features
                            else np.sort(rng.choice(self.n_features, count, replace=False)))
                split = best_split(x[rows], t[rows], d[rows], min_leaf=self.min_leaf, features=features)
            if split is None:
                km = kaplan_meier(t[rows].tolist(), d[rows].tolist())
                na = nelson_aalen(km)
                self.nodes[position].leaf = Leaf(km.times, tuple(p.survival for p in km.points),
                                                na.cumulative, km.followup_end,
                                                tuple(map(int, ids[rows])), int(d[rows].sum()))
                continue
            mask = x[rows, split.feature] <= split.threshold
            left, right = len(self.nodes), len(self.nodes) + 1
            self.nodes[position] = Node(split.feature, split.threshold, split.statistic, left, right)
            self.nodes.extend([Node(), Node()])
            stack.extend([(right, rows[~mask], depth + 1), (left, rows[mask], depth + 1)])
        return self

    def _queries(self, x, horizons):
        if not hasattr(self, "nodes"):
            raise ValueError("Fit before querying a tree.")
        x = numeric_features(x)
        h = np.asarray(horizons, dtype=float)
        if x.shape[1] != self.n_features or h.ndim != 1 or not len(h) or not np.isfinite(h).all():
            raise ValueError("Query columns must match; horizons must be a finite nonempty vector.")
        if (h < 0).any() or (h > self.followup_end).any():
            raise ValueError("Horizons must remain within global training follow-up.")
        return x, h

    def apply(self, x):
        if not hasattr(self, "nodes"):
            raise ValueError("Fit before routing queries.")
        x = numeric_features(x)
        if x.shape[1] != self.n_features:
            raise ValueError("Query columns must match fitted columns.")
        result = np.empty(len(x), dtype=int)
        for row, values in enumerate(x):
            current = 0
            while self.nodes[current].leaf is None:
                node = self.nodes[current]
                current = node.left if values[node.feature] <= node.threshold else node.right
            result[row] = current
        return result

    def predict_curves(self, x, horizons):
        x, h = self._queries(x, horizons)
        survival = np.ones((len(x), len(h)))
        hazard = np.zeros_like(survival)
        support = np.zeros_like(survival)
        for row, index in enumerate(self.apply(x)):
            leaf = self.nodes[index].leaf
            for column, time in enumerate(h):
                step = bisect_right(leaf.times, time) - 1
                if step >= 0:
                    survival[row, column] = leaf.survival[step]
                    hazard[row, column] = leaf.cumulative_hazard[step]
                support[row, column] = time <= leaf.followup_end
        return Curves(survival, hazard, support, np.ones(len(x), dtype=int))


class SurvivalForest:
    def __init__(self, *, n_estimators=100, min_leaf=2, max_depth=5, max_features=None, random_state=0):
        self.n_estimators = positive_integer(n_estimators, "n_estimators")
        self.min_leaf = positive_integer(min_leaf, "min_leaf")
        self.max_depth = _depth(max_depth)
        self.max_features = None if max_features is None else positive_integer(max_features, "max_features")
        self.random_state = _seed(random_state)

    def fit(self, x, times, events):
        t, d = observations(times, events)
        x = numeric_features(x, len(t))
        count = max(1, isqrt(x.shape[1])) if self.max_features is None else self.max_features
        if count > x.shape[1]:
            raise ValueError("max_features exceeds the number of columns.")
        self.training_x = x.copy()
        self.followup_end = float(t.max())
        self.trees, self.bootstrap_indices = [], []
        rng = np.random.default_rng(self.random_state)
        for _ in range(self.n_estimators):
            rows = rng.integers(0, len(t), size=len(t))
            tree = SurvivalTree(min_leaf=self.min_leaf, max_depth=self.max_depth,
                                max_features=count, random_state=int(rng.integers(0, 2**32)))
            tree.fit(x[rows], t[rows], d[rows], subject_ids=rows)
            # Forest queries share the original training horizon; support remains leaf-local.
            tree.followup_end = self.followup_end
            self.bootstrap_indices.append(rows)
            self.trees.append(tree)
        return self

    def predict_curves(self, x, horizons):
        if not hasattr(self, "trees"):
            raise ValueError("Fit before querying a forest.")
        total = None
        for tree in self.trees:
            current = tree.predict_curves(x, horizons)
            if total is None:
                total = [current.survival.copy(), current.cumulative_hazard.copy(),
                         current.local_support_fraction.copy()]
            else:
                for accumulator, values in zip(total, (current.survival, current.cumulative_hazard,
                                                       current.local_support_fraction)):
                    accumulator += values
        return Curves(*(values / len(self.trees) for values in total),
                      np.full(len(current.members), len(self.trees), dtype=int))

    def oob_curves(self, horizons):
        """Each training identity uses only trees whose bootstrap omitted it.

No members means unavailable NaN, not an S=1 or H=0 model prediction.
It is not an independently selected/tuned test set or a censor-aware score.
"""
        if not hasattr(self, "trees"):
            raise ValueError("Fit before querying out-of-bag curves.")
        _, h = self.trees[0]._queries(self.training_x, horizons)
        n = len(self.training_x)
        survival = np.zeros((n, len(h)))
        hazard = np.zeros_like(survival)
        support = np.zeros_like(survival)
        members = np.zeros(n, dtype=int)
        for tree, bag in zip(self.trees, self.bootstrap_indices):
            omitted = np.flatnonzero(np.bincount(bag, minlength=n) == 0)
            if not len(omitted):
                continue
            current = tree.predict_curves(self.training_x[omitted], h)
            survival[omitted] += current.survival
            hazard[omitted] += current.cumulative_hazard
            support[omitted] += current.local_support_fraction
            members[omitted] += 1
        for values in (survival, hazard, support):
            np.divide(values, members[:, None], out=values, where=members[:, None] > 0)
            values[members == 0] = np.nan
        return Curves(survival, hazard, support, members)
