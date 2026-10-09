"""Indexed finite dense isolation forest; exact finite harmonic correction."""
import math
import numpy as np


def finite_matrix(values, columns=None):
    x = np.asarray(values, dtype=np.float64)
    if x.ndim != 2 or x.shape[1] == 0 or not np.isfinite(x).all():
        raise ValueError('Supply a finite two-dimensional feature matrix.')
    if columns is not None and x.shape[1] != columns:
        raise ValueError('Query feature columns must match the fitted reference.')
    return x


def correction_table(size, convention='exact'):
    if convention not in ('exact', 'library'):
        raise ValueError('Choose exact or library correction.')
    c = np.zeros(size + 1)
    harmonic = 0.
    for m in range(2, size + 1):
        harmonic += 1 / (m - 1)
        h = harmonic if convention == 'exact' else math.log(m - 1) + np.euler_gamma
        c[m] = 1. if m == 2 else 2*h - 2*(m-1)/m
    return c


def sample_ids(n, size, rng):
    # Sparse partial Fisher-Yates: choose only size entries, not an n-row shuffle.
    swaps, selected = {}, np.empty(size, dtype=np.intp)
    for i in range(size):
        j = int(rng.integers(i, n))
        selected[i] = swaps.get(j, j)
        swaps[j] = swaps.get(i, i)
        swaps.pop(i, None)
    return selected


def grow_indexed(x, ids, limit, rng):
    ids = ids.copy()
    feature, cut, left, right, population = [], [], [], [], []
    stack = [(0, len(ids), 0, -1, '')]
    while stack:
        start, end, depth, parent, side = stack.pop()
        node = len(feature)
        feature.append(-1)
        cut.append(np.nan)
        left.append(-1)
        right.append(-1)
        population.append(end-start)
        if parent >= 0:
            (left if side == 'left' else right)[parent] = node
        if end-start <= 1 or depth == limit:
            continue
        varying = []
        for f in range(x.shape[1]):
            values = x[ids[start:end], f]
            lo, hi = float(values.min()), float(values.max())
            if lo < hi:
                varying.append((f, lo, hi))
        if not varying:
            continue
        f, lo, hi = varying[int(rng.integers(len(varying)))]
        u = float(rng.random())
        threshold = (1-u)*lo + u*hi
        # Floating endpoints: retain two nonempty children when lo < hi.
        threshold = min(hi, max(np.nextafter(lo, hi), threshold))
        current = ids[start:end]
        goes_left = x[current, f] < threshold
        count = int(goes_left.sum())
        if not 0 < count < end-start:
            continue
        ids[start:end] = np.concatenate((current[goes_left], current[~goes_left]))
        feature[node], cut[node] = f, threshold
        middle = start + count
        stack.append((middle, end, depth+1, node, 'right'))
        stack.append((start, middle, depth+1, node, 'left'))
    return {'feature': np.asarray(feature, dtype=np.intp), 'cut': np.asarray(cut),
            'left': np.asarray(left, dtype=np.intp), 'right': np.asarray(right, dtype=np.intp),
            'population': np.asarray(population, dtype=np.intp)}


def corrected_paths(tree, queries, correction):
    paths = np.empty(len(queries))
    for i, row in enumerate(queries):
        node, depth = 0, 0
        while tree['feature'][node] >= 0:
            f = tree['feature'][node]
            node = tree['left'][node] if row[f] < tree['cut'][node] else tree['right'][node]
            depth += 1
        paths[i] = depth + correction[tree['population'][node]]
    return paths


class IndexedIsolation:
    def __init__(self, trees=32, max_samples=256, seed=17, convention='exact'):
        if type(trees) is not int or trees < 1:
            raise ValueError('Use a positive integer tree count.')
        if type(max_samples) is not int or max_samples < 2:
            raise ValueError('Requested sample size must be an integer at least two.')
        self.trees, self.max_samples, self.seed, self.convention = trees, max_samples, seed, convention

    def fit(self, reference, feature_order=None):
        x = finite_matrix(reference)
        if len(x) < 2:
            raise ValueError('At least two reference rows are required.')
        order = list(feature_order) if feature_order is not None else [f'x{i}' for i in range(x.shape[1])]
        if len(order) != x.shape[1] or len(set(order)) != len(order):
            raise ValueError('Feature names must be unique and match the columns.')
        if type(self.trees) is not int or self.trees < 1:
            raise ValueError('Use a positive integer tree count.')
        if type(self.max_samples) is not int or self.max_samples < 2:
            raise ValueError('Requested sample size must be an integer at least two.')
        actual_sample = min(self.max_samples, len(x))
        correction = correction_table(actual_sample, self.convention)
        depth_limit = math.ceil(math.log2(actual_sample))
        rng = np.random.default_rng(self.seed)
        nodes = [grow_indexed(x, sample_ids(len(x), actual_sample, rng),
                              depth_limit, rng) for _ in range(self.trees)]
        # Publish only a complete forest; any rejected refit retains the old one.
        self.feature_order, self.columns = order, x.shape[1]
        self.actual_sample, self.correction = actual_sample, correction
        self.depth_limit, self.nodes = depth_limit, nodes
        return self

    def score(self, queries, batch_size=32, feature_order=None):
        if not hasattr(self, 'nodes'):
            raise ValueError('Fit the reference first.')
        q = finite_matrix(queries, self.columns)
        if feature_order is not None and list(feature_order) != self.feature_order:
            raise ValueError('Query feature order differs from the fitted state.')
        if type(batch_size) is not int or batch_size < 1:
            raise ValueError('Batch size must be positive.')
        result = np.empty(len(q))
        for start in range(0, len(q), batch_size):
            block = q[start:start+batch_size]
            total = np.zeros(len(block))
            for tree in self.nodes:
                total += corrected_paths(tree, block, self.correction)
            result[start:start+len(block)] = np.exp2(-total / (len(self.nodes)*self.correction[self.actual_sample]))
        return result
