"""Four fitted column rulers and three stateless row normalizations.

NaN is skipped during fit and preserved during transform; infinity is refused.
The exact-zero spread rule is deliberately simpler than sklearn near-constant
detection. Named columns must have the same order during later transformation.
"""
from dataclasses import dataclass
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.preprocessing import (StandardScaler, MinMaxScaler, RobustScaler,
                                   MaxAbsScaler, Normalizer)


def matrix(X, width=None):
    X = np.asarray(X, dtype=float)
    if X.ndim != 2 or 0 in X.shape or np.isinf(X).any():
        raise ValueError('nonempty rows × features; finite numbers or NaN')
    if width is not None and X.shape[1] != width:
        raise ValueError('changed feature count')
    return X


def frozen(a):
    a = np.asarray(a).copy()
    a.flags.writeable = False
    return a


@dataclass(frozen=True)
class Ruler:
    kind: str
    names: tuple
    center: np.ndarray
    scale: np.ndarray
    zero_spread: np.ndarray


def fit_ruler(X, names, kind='standard'):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('one distinct feature name per column')
    if np.isnan(X).all(axis=0).any():
        raise ValueError('no observed fitting value in a column')
    with np.errstate(over='raise', invalid='raise'):
        if kind == 'standard':
            center, scale = np.nanmean(X, axis=0), np.nanstd(X, axis=0)
        elif kind == 'minmax':
            center = np.nanmin(X, axis=0)
            scale = np.nanmax(X, axis=0) - center
        elif kind == 'robust':
            q1, center, q3 = np.nanpercentile(X, [25, 50, 75], axis=0,
                                             method='linear')
            scale = q3 - q1
        elif kind == 'maxabs':
            center, scale = np.zeros(X.shape[1]), np.nanmax(abs(X), axis=0)
        else:
            raise ValueError('unknown ruler')
    zero = scale == 0
    if not np.isfinite(center).all() or not np.isfinite(scale).all():
        raise ValueError('nonfinite fitted arithmetic; rescale input')
    return Ruler(kind, names, frozen(center), frozen(np.where(zero, 1., scale)),
                 frozen(zero))


def transform(state, X, names, inverse=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names:
        raise ValueError('feature names/order differ from fit')
    with np.errstate(over='raise', invalid='raise', divide='raise'):
        return X * state.scale + state.center if inverse else (X-state.center)/state.scale


def normalize_rows(X, norm='l2'):
    X = matrix(X)
    if not np.isfinite(X).all():
        raise ValueError('row normalization here requires finite input')
    # Divide first by the largest magnitude to avoid overflow in the norm.
    largest = abs(X).max(axis=1, keepdims=True)
    scaled = X / np.where(largest == 0, 1., largest)
    if norm == 'l1':
        divisor = abs(scaled).sum(axis=1, keepdims=True)
    elif norm == 'l2':
        divisor = np.sqrt((scaled*scaled).sum(axis=1, keepdims=True))
    elif norm == 'max':
        divisor = abs(scaled).max(axis=1, keepdims=True)
    else:
        raise ValueError('norm must be l1, l2 or max')
    return scaled / np.where(divisor == 0, 1., divisor)


if __name__ == '__main__':
    X = np.array([[1.], [2.], [3.], [4.], [100.]])
    for kind, estimator in [('standard', StandardScaler()),
                            ('minmax', MinMaxScaler(clip=False)),
                            ('robust', RobustScaler(quantile_range=(25, 75))),
                            ('maxabs', MaxAbsScaler())]:
        state = fit_ruler(X, ['amount'], kind)
        query = np.array([[150.], [np.nan]])
        actual = transform(state, query, ['amount'])
        expected = estimator.fit(X).transform(query)
        np.testing.assert_allclose(actual, expected, equal_nan=True, atol=1e-12)
        np.testing.assert_allclose(transform(state, actual, ['amount'], True), query,
                                   equal_nan=True, atol=1e-12)
        print(kind, 'center/scale', state.center.tolist(), state.scale.tolist(),
              'later150', round(actual[0, 0], 6))
    constant = fit_ruler([[7.], [7.], [7.]], ['constant'])
    print('constant later7/9:', transform(constant, [[7.], [9.]], ['constant']).ravel().tolist())
    for norm in ['l1', 'l2', 'max']:
        rows = np.array([[3., 4.], [6., 8.], [0., 0.]])
        result = normalize_rows(rows, norm)
        np.testing.assert_allclose(result, Normalizer(norm=norm).transform(rows))
        print('row', norm, np.round(result, 6).tolist())
    sparse = csr_matrix([[0., 0., 3.], [1., 0., 0.], [0., 2., 0.]])
    result = StandardScaler(with_mean=False).fit_transform(sparse)
    print('sparse scale-only nnz:', sparse.nnz, result.nnz)
    dense_centered = sparse.toarray() - sparse.toarray().mean(axis=0)
    print('centered dense nnz:', int(np.count_nonzero(dense_centered)))
    q, a, b = np.array([40., 4000.]), np.array([41., 4100.]), np.array([43., 4001.])
    baseline = np.array([np.sum(((p-q)/[1, 100])**2) for p in [a, b]])
    shifted = np.array([np.sum((((p+7)-(q+7))/[1, 100])**2) for p in [a, b]])
    doubled = np.array([np.sum(((p-q)/[2, 200])**2) for p in [a, b]])
    np.testing.assert_allclose(baseline, shifted)
    np.testing.assert_allclose(baseline/4, doubled)
    print('metric baseline/doubled:', baseline.tolist(), doubled.tolist())
    for bad in [lambda: fit_ruler([[np.nan]], ['x']),
                lambda: transform(constant, [[9]], ['wrong']),
                lambda: fit_ruler([[np.inf]], ['x'])]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', str(exc))
