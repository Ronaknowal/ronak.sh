"""Full-fit inference state, full-coverage OOF and past-only aligned subsets."""
from dataclasses import dataclass
import numpy as np
from sklearn.preprocessing import TargetEncoder
from sklearn.model_selection import GroupKFold, TimeSeriesSplit
from category_policies import labels


def data(categories, target):
    c = np.array(labels(categories))
    y = np.asarray(target, float)
    if y.ndim != 1 or len(y) != len(c) or not len(y) or not np.isfinite(y).all():
        raise ValueError('nonempty labels and one finite target per row')
    return c, y


@dataclass(frozen=True)
class TargetState:
    aggregates: tuple
    prior: float
    alpha: float


def fit_target(categories, target, alpha=2.):
    c, y = data(categories, target)
    if not np.isfinite(alpha) or alpha < 0:
        raise ValueError('nonnegative finite smoothing')
    # labels() reserves @; internal labels must not pass through it again.
    aggregates = tuple((value, int(np.sum(c == value)), float(y[c == value].sum()))
                       for value in np.unique(c))
    return TargetState(aggregates, float(y.mean()), float(alpha))


def transform_target(state, categories):
    lookup = {c: (n, total) for c, n, total in state.aggregates}
    result = []
    for c in labels(categories):
        n, total = lookup.get(c, (0, 0.))
        result.append(state.prior if n == 0 else (total+state.alpha*state.prior)/(n+state.alpha))
    return np.array(result)


def index_array(values, n):
    result = np.asarray(values)
    if result.ndim != 1 or result.dtype.kind not in 'iu' or len(np.unique(result)) != len(result):
        raise ValueError('distinct integer row indices')
    if np.any(result < 0) or np.any(result >= n):
        raise ValueError('index outside data')
    return result.astype(int)


def cross_encode(categories, target, splits, alpha=2., groups=None, times=None,
                 require_full=True):
    # Keep raw values so reserved internal missing markers are never revalidated
    # as real labels when selecting donor subsets.
    c = list(categories)
    _, y = data(c, target)
    n = len(y)
    groups = None if groups is None else np.asarray(groups)
    times = None if times is None else np.asarray(times, float)
    if groups is not None and groups.shape != (n,):
        raise ValueError('one group per row')
    if times is not None and (times.shape != (n,) or not np.isfinite(times).all()):
        raise ValueError('one finite time per row')
    output = np.full(n, np.nan)
    coverage = np.zeros(n, int)
    trace = []
    for train, valid in splits:
        train, valid = index_array(train, n), index_array(valid, n)
        if len(train) == 0 or len(valid) == 0 or np.intersect1d(train, valid).size:
            raise ValueError('nonempty disjoint fitting/validation sets')
        if groups is not None and np.intersect1d(groups[train], groups[valid]).size:
            raise ValueError('same group appears on both sides')
        if times is not None and np.max(times[train]) >= np.min(times[valid]):
            raise ValueError('chronological donors must be strictly earlier')
        if np.any(coverage[valid]):
            raise ValueError('validation row occurs more than once')
        state = fit_target([c[i] for i in train], y[train], alpha)
        output[valid] = transform_target(state, [c[i] for i in valid])
        coverage[valid] += 1
        trace.append({'train': train.tolist(), 'valid': valid.tolist(), 'prior': state.prior})
    if require_full and np.any(coverage != 1):
        raise ValueError('full OOF contract requires each row exactly once')
    retained = np.flatnonzero(coverage == 1)
    return {'encoded': output[retained], 'rows': retained, 'target': y[retained],
            'coverage': coverage, 'trace': trace,
            'inference_state': fit_target(c, y, alpha)}


if __name__ == '__main__':
    c = ['A', 'A', 'B', 'B', 'C', 'C']
    y = np.array([1., 1., 0., 0., 1., 0.])
    folds = np.array([0, 1, 0, 1, 0, 1])
    splits = [(np.flatnonzero(folds != f), np.flatnonzero(folds == f)) for f in [0, 1]]
    result = cross_encode(c, y, splits)
    ordinary = TargetEncoder(target_type='continuous', smooth=2., cv=splits)
    library = ordinary.fit_transform(np.array(c)[:, None], y).ravel()
    np.testing.assert_allclose(result['encoded'], library)
    print('OOF:', np.round(result['encoded'], 6).tolist())
    print('full-fit:', np.round(transform_target(result['inference_state'], c), 6).tolist())
    changed = y.copy()
    changed[0] = 0.
    edited = cross_encode(c, changed, splits)['encoded']
    assert edited[0] == result['encoded'][0]
    print('own target edit:', np.round(edited, 6).tolist())
    print('alpha0 unseen:', transform_target(fit_target(['a'], [1.], 0), ['new', None]).tolist())
    groups = np.repeat([0, 1, 2], 2)
    grouped = list(GroupKFold(n_splits=3).split(np.zeros((6, 1)), y, groups))
    print('group OOF:', np.round(cross_encode(c, y, grouped, groups=groups)['encoded'], 6).tolist())
    chronological = list(TimeSeriesSplit(n_splits=2, test_size=2).split(np.zeros((6, 1))))
    past = cross_encode(c, y, chronological, times=np.arange(6), require_full=False)
    print('time retained rows/targets:', past['rows'].tolist(), past['target'].tolist())
    print('time encodings:', np.round(past['encoded'], 6).tolist(), 'coverage:', past['coverage'].tolist())
    manual = []
    for train, valid in chronological:
        enc = TargetEncoder(target_type='continuous', smooth=2.)
        enc.fit(np.array(c)[train, None], y[train])
        manual.extend(enc.transform(np.array(c)[valid, None]).ravel())
    np.testing.assert_allclose(past['encoded'], manual)
    for bad in [lambda: cross_encode(c, y, chronological),
                lambda: cross_encode(c, y, splits+splits),
                lambda: cross_encode(c, y, splits, groups=groups),
                lambda: fit_target([], [], 0.)]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
