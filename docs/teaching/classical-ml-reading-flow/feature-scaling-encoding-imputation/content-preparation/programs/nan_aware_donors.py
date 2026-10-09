"""Target-eligible donors; distances always use the original query row."""
from dataclasses import dataclass
import numpy as np
from sklearn.impute import KNNImputer
from sklearn.metrics.pairwise import nan_euclidean_distances
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Donors:
    X: np.ndarray
    means: np.ndarray
    counts: np.ndarray


def fit_donors(X, empty='reject', constant=0.):
    X = matrix(X)
    counts = (~np.isnan(X)).sum(axis=0)
    if empty not in ['reject', 'constant'] or not np.isfinite(constant):
        raise ValueError('declare reject or finite constant empty policy')
    if (counts == 0).any() and empty == 'reject':
        raise ValueError('all-target-missing column has no donor evidence')
    means = np.full(X.shape[1], float(constant))
    for j in np.flatnonzero(counts):
        means[j] = X[~np.isnan(X[:, j]), j].mean()
    if not np.isfinite(means).all():
        raise ValueError('mean overflow')
    return Donors(frozen(X), frozen(means), frozen(counts))


def distances(state, query):
    # q differs by donor. The factor d/q uses the original total width d.
    common = ~np.isnan(state.X) & ~np.isnan(query)[None, :]
    count = common.sum(axis=1)
    with np.errstate(over='raise', invalid='raise'):
        delta = np.where(common, state.X-query, 0.)
        squares = (delta*delta).sum(axis=1)
        result = np.sqrt(squares*state.X.shape[1]/np.where(count, count, 1))
    result[count == 0] = np.nan
    return result


def complete(state, X, k=2, weights='uniform'):
    X = matrix(X, state.X.shape[1])
    if not isinstance(k, int) or isinstance(k, bool) or k < 1 or weights not in ['uniform', 'distance']:
        raise ValueError('positive integer k and uniform/distance weights')
    result = X.copy()
    traces = []
    for i, query in enumerate(X):
        dist = distances(state, query)  # once per row, reused for each target
        for j in np.flatnonzero(np.isnan(query)):
            eligible = np.flatnonzero(~np.isnan(state.X[:, j]) & np.isfinite(dist))
            chosen = eligible[np.argsort(dist[eligible], kind='stable')[:k]]
            if len(chosen) == 0:
                result[i, j] = state.means[j]
                reason = 'observed target mean' if state.counts[j] else 'declared empty constant'
            else:
                d = dist[chosen]
                if weights == 'uniform':
                    w = np.ones(len(chosen))
                elif np.any(d == 0):
                    w = (d == 0).astype(float)
                else:
                    w = d.min()/d
                result[i, j] = (w/w.sum()) @ state.X[chosen, j]
                reason = 'selected target-observed donors'
            traces.append({'row': i, 'target': int(j), 'donors': chosen.tolist(),
                           'distance': dist.tolist(), 'reason': reason,
                           'value': float(result[i, j])})
    if not np.isfinite(result).all():
        raise ValueError('completion produced nonfinite value')
    return result, traces


if __name__ == '__main__':
    X = np.array([[1., 10., 100.], [3., np.nan, 300.], [np.nan, 14., 500.]])
    query = [[2., 12., np.nan]]
    state = fit_donors(X)
    print('squared distances:', (distances(state, np.array(query[0]))**2).tolist())
    np.testing.assert_allclose(distances(state, np.array(query[0])), nan_euclidean_distances(query, X)[0])
    for name, donors in [('baseline', X), ('remove D2 target', np.array([[1, 10, 100], [3, np.nan, np.nan], [np.nan, 14, 500]], float)),
                          ('D1 target140', np.array([[1, 10, 140], [3, np.nan, 300], [np.nan, 14, 500]], float))]:
        got, trace = complete(fit_donors(donors), query)
        expected = KNNImputer(n_neighbors=2, weights='uniform', keep_empty_features=True).fit(donors).transform(query)
        np.testing.assert_allclose(got, expected)
        print(name, got.tolist(), 'donors', trace[0]['donors'])
    print('no overlap fallback:', complete(state, [[np.nan, np.nan, np.nan]])[0].tolist())
    multi = np.array([[0., 10., 100.], [2., 20., 200.], [4., 40., 400.]])
    got, trace = complete(fit_donors(multi), [[1., np.nan, np.nan]], k=2)
    print('two missing targets:', got.tolist(), 'donor sets:', [t['donors'] for t in trace])
    assert [t['donors'] for t in trace] == [[0, 1], [0, 1]]
    # A target-specific missing donor exposes why completed coordinates must
    # not feed back into later distances in this algorithm.
    trap = fit_donors([[0., 0., np.nan], [2., 100., 100.], [3., 0., 200.]])
    original, trace = complete(trap, [[1., np.nan, np.nan]], k=1)
    fed_back, _ = complete(trap, [[1., original[0, 1], np.nan]], k=1)
    assert original[0, 2] == 100. and fed_back[0, 2] == 200.
    print('original query versus forbidden feedback:', original.tolist(), fed_back.tolist())
    print('exact zero distance weighted:', complete(fit_donors([[0., 10.], [0., 20.], [1., 100.]]), [[0., np.nan]], k=3, weights='distance')[0].tolist())
    np.testing.assert_array_equal(state.X, X)
    try:
        fit_donors([[1., np.nan]])
    except ValueError as exc:
        print('refused:', exc)
