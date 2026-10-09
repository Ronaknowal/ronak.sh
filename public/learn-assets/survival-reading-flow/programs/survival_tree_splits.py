"""Dense numeric, static right-censor log-rank split search; no import work.

Failure times index endpoint histograms. Each sorted feature sweep moves an
occurrence once, updating weighted event-time prefixes in O(log(e)) time.
For m features and n occurrences the usual cost is
O(n*log(n) + m*(n*log(n) + e + n*log(e))), O(n+e) extra state.
Numerically near-zero variances use an O(e) positive-form check; worst-case
work with that fallback is O(m*n*e). No n-by-e risk matrix or fit per cut.
Event/censor ties use the earlier failure-before-removal convention.
"""

from dataclasses import dataclass
from math import fsum, sqrt
from numbers import Integral

import numpy as np

from survival_metric_inputs import observations


def positive_integer(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Integral) or value < 1:
        raise ValueError(f"{name} must be a positive integer.")
    return int(value)


def numeric_features(values, rows=None):
    x = np.asarray(values, dtype=float)
    if x.ndim != 2 or not x.shape[0] or not x.shape[1] or not np.isfinite(x).all():
        raise ValueError("Require a nonempty finite dense numeric feature matrix.")
    if rows is not None and len(x) != rows:
        raise ValueError("Features and outcomes must have the same row count.")
    return x


@dataclass(frozen=True)
class Split:
    feature: int
    threshold: float
    left_count: int
    right_count: int
    score: float
    variance: float
    statistic: float | None


class _CompensatedSum:
    def __init__(self):
        self.total = self.correction = 0.

    def add(self, value):
        adjusted = value - self.correction
        updated = self.total + adjusted
        self.correction = (updated - self.total) - adjusted
        self.total = updated


class _WeightedPrefix:
    """Lazy segment tree for sum_j c_j*r_left,j and prefix count increments."""
    def __init__(self, weights):
        self.capacity = 1 << (max(1, len(weights)) - 1).bit_length()
        size = 2 * self.capacity
        self.weights = np.zeros(size)
        self.weights[self.capacity:self.capacity + len(weights)] = weights
        for node in range(self.capacity - 1, 0, -1):
            self.weights[node] = self.weights[2*node] + self.weights[2*node+1]
        self.left = np.zeros(size)
        self.lazy = np.zeros(size, dtype=np.int64)

    def _increment(self, node, amount):
        self.left[node] += amount * self.weights[node]
        self.lazy[node] += amount

    def _push(self, node):
        amount = self.lazy[node]
        if amount:
            self._increment(2*node, amount)
            self._increment(2*node+1, amount)
            self.lazy[node] = 0

    def query_and_increment(self, end):
        """Return the OLD weighted prefix, then add one to its risk counts."""
        def visit(node, low, high):
            if end <= low:
                return 0.
            if high <= end:
                before = self.left[node]
                self._increment(node, 1)
                return before
            self._push(node)
            middle = (low + high)//2
            before = visit(2*node, low, middle) + visit(2*node+1, middle, high)
            self.left[node] = self.left[2*node] + self.left[2*node+1]
            return before
        return visit(1, 0, self.capacity)


def candidate_splits(x, times, events, *, min_leaf=2, features=None):
    """Yield each legal distinct-value cut, including zero-information cuts.

Rows are occurrences, so bootstrap duplicates contribute repeatedly. No test
p-value is attached to a statistic maximized over candidate cuts.
"""
    t, d = observations(times, events)
    x = numeric_features(x, len(t))
    min_leaf = positive_integer(min_leaf, "min_leaf")
    if features is None:
        features = tuple(range(x.shape[1]))
    else:
        features = tuple(features)
        if any(isinstance(j, (bool, np.bool_)) or not isinstance(j, Integral)
               or not 0 <= j < x.shape[1] for j in features) or len(set(features)) != len(features):
            raise ValueError("Feature indices must be distinct valid integer columns.")
    event_times = np.unique(t[d])
    e = len(event_times)
    if not e or len(t) < 2 * min_leaf:
        return
    # stop_bin is the number of failure-time rosters this row participates in.
    stop_bin = np.searchsorted(event_times, t, side="right")
    stops = np.bincount(stop_bin, minlength=e + 1)
    risk = np.cumsum(stops[:0:-1])[::-1]
    deaths = np.bincount(stop_bin[d] - 1, minlength=e)
    expected_prefix = np.r_[0., np.cumsum(deaths / risk)]
    row_score = d.astype(float) - expected_prefix[stop_bin]
    c = np.zeros(e)
    active = risk > 1
    fraction = deaths[active] / risk[active]
    c[active] = fraction * (1 - fraction) / (risk[active] - 1)
    variance_prefix = np.r_[0., np.cumsum(c * (risk - 1))]
    for feature in features:
        order = np.argsort(x[:, feature], kind="stable")
        left_stops = np.zeros(e + 1, dtype=np.int64)
        weighted_prefix = _WeightedPrefix(c)
        score_sum, variance_sum = _CompensatedSum(), _CompensatedSum()
        for moved, index in enumerate(order[:-1], start=1):
            slot = stop_bin[index]
            left_stops[slot] += 1
            score_sum.add(row_score[index])
            previous = weighted_prefix.query_and_increment(int(slot))
            variance_sum.add(variance_prefix[slot] - 2 * previous)
            low, high = x[index, feature], x[order[moved], feature]
            if low == high or moved < min_leaf or len(t) - moved < min_leaf:
                continue
            score, variance = score_sum.total, variance_sum.total
            # A near-zero subtraction needs the nonnegative risk-count form.
            # This explicit fallback is not arbitrary clipping of negative values.
            if variance <= 64 * np.finfo(float).eps * len(t):
                left_risk = np.cumsum(left_stops[:0:-1])[::-1]
                variance = fsum((c * left_risk * (risk - left_risk)).tolist())
            statistic = None if variance == 0 else (score / sqrt(variance)) ** 2
            midpoint = low / 2 + high / 2
            # Adjacent floats may have no interior float; <=low is the same cut.
            threshold = float(midpoint if low <= midpoint < high else low)
            yield Split(int(feature), threshold, moved, len(t) - moved,
                        score, variance, statistic)


def best_split(x, times, events, *, min_leaf=2, features=None):
    """Maximize the log-rank statistic; first encountered tied maximum wins."""
    best = None
    for candidate in candidate_splits(x, times, events, min_leaf=min_leaf, features=features):
        if candidate.statistic is not None and (best is None or candidate.statistic > best.statistic):
            best = candidate
    return best
