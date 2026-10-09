"""Fitted bin edges, complete 1D Lloyd loop, monomials and cyclic pairs."""
from itertools import combinations_with_replacement, combinations
import math
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import KBinsDiscretizer, PolynomialFeatures, FunctionTransformer


def finite_vector(x):
    x = np.asarray(x, float)
    if x.ndim != 1 or not len(x) or not np.isfinite(x).all():
        raise ValueError('nonempty finite vector required')
    return x


def fit_bins(x, n_bins=3, strategy='uniform'):
    x = finite_vector(x)
    if not isinstance(n_bins, int) or isinstance(n_bins, bool) or n_bins < 2:
        raise ValueError('integer n_bins >= 2')
    if np.ptp(x) == 0:
        return np.array([x[0], x[0]])  # one effective constant bin
    if strategy == 'uniform':
        return np.linspace(x.min(), x.max(), n_bins+1)
    if strategy == 'quantile':
        return np.unique(np.quantile(x, np.linspace(0, 1, n_bins+1), method='linear'))
    raise ValueError('uniform or quantile strategy')


def membership(x, edges):
    x, edges = finite_vector(x), finite_vector(edges)
    if len(edges) < 2 or np.any(np.diff(edges) < 0):
        raise ValueError('ordered edges required')
    return np.searchsorted(edges[1:-1], x, side='right')


def lloyd_bins(x, centres, max_iter=50, tol=1e-10):
    x, centres = finite_vector(x), finite_vector(centres).copy()
    if np.any(np.diff(centres) <= 0) or not isinstance(max_iter, int) or max_iter < 1 or tol < 0 or not np.isfinite(tol):
        raise ValueError('distinct ordered centres, positive cap and finite tolerance')
    trace = []
    status = 'iteration cap'
    for turn in range(max_iter):
        # argmin selects the earlier supplied centre at an exact tie.
        assignment = np.argmin(abs(x[:, None]-centres), axis=1)
        updated = np.array([x[assignment == j].mean() if np.any(assignment == j) else centres[j]
                            for j in range(len(centres))])
        trace.append({'assignment': assignment.tolist(), 'centres': updated.tolist()})
        change = float(abs(updated-centres).max())
        centres = updated
        if change <= tol:
            status = 'absolute centre tolerance'
            break
    centres = np.unique(np.sort(centres))
    edges = np.r_[x.min(), (centres[:-1]+centres[1:])/2, x.max()]
    # Empty retained centres can lie outside the observation extent. Refuse an
    # invalid bin partition rather than silently relabel such an exceptional fit.
    if np.any(np.diff(edges) < 0):
        raise ValueError('empty-centre configuration produces invalid outer edges')
    return {'centres': centres, 'edges': edges, 'trace': trace, 'status': status}


def monomials(X, degree=2, interaction_only=False, include_bias=True, max_features=10000):
    X = np.asarray(X, float)
    if X.ndim != 2 or 0 in X.shape or not np.isfinite(X).all():
        raise ValueError('finite nonempty feature matrix')
    if not isinstance(degree, int) or isinstance(degree, bool) or degree < 0 or degree > 20:
        raise ValueError('bounded integer degree 0..20')
    d = X.shape[1]
    count = sum(math.comb(d, k) if interaction_only else math.comb(d+k-1, k)
                for k in range(0 if include_bias else 1, degree+1)
                if not interaction_only or k <= d)
    if count > max_features or count == 0:
        raise ValueError('output width outside allowed nonempty allocation')
    powers = []
    choose = combinations if interaction_only else combinations_with_replacement
    for k in range(0 if include_bias else 1, degree+1):
        for indices in choose(range(d), k):
            powers.append(np.bincount(indices, minlength=d))
    powers = np.array(powers, int)
    with np.errstate(over='raise', invalid='raise'):
        result = np.column_stack([np.prod(X**p, axis=1) for p in powers])
    return result, powers


def cycle(x, period=360.):
    x = finite_vector(x)
    if not np.isfinite(period) or period <= 0:
        raise ValueError('positive finite period')
    radians = 2*np.pi*np.remainder(x, period)/period
    return np.column_stack([np.cos(radians), np.sin(radians)])


if __name__ == '__main__':
    x = np.array([1., 2., 2., 4., 100.])
    for strategy in ['uniform', 'quantile']:
        edges = fit_bins(x, 4, strategy)
        q = np.array([-20., edges[1], 1000.])
        got = membership(q, edges)
        lib = KBinsDiscretizer(n_bins=4, strategy=strategy, encode='ordinal',
                              quantile_method='linear', subsample=None).fit(x[:, None])
        np.testing.assert_array_equal(got, lib.transform(q[:, None]).ravel())
        print(strategy, 'edges:', edges.tolist(), 'effective:', len(edges)-1, 'query:', got.tolist())
    data = np.array([0., 1., 2., 8., 9., 10.])
    fit = lloyd_bins(data, [0., 10.])
    lib = KMeans(n_clusters=2, init=np.array([[0.], [10.]]), n_init=1,
                 algorithm='lloyd', max_iter=50, tol=1e-10).fit(data[:, None])
    np.testing.assert_allclose(fit['centres'], np.sort(lib.cluster_centers_.ravel()))
    print('Lloyd:', fit['centres'].tolist(), fit['edges'].tolist(), fit['status'], fit['trace'])
    native = KBinsDiscretizer(n_bins=2, strategy='kmeans', encode='ordinal', subsample=None).fit(data[:, None])
    print('separate KBins kmeans edges:', native.bin_edges_[0].tolist())
    for interaction in [False, True]:
        got, powers = monomials([[2., 3.]], interaction_only=interaction)
        lib = PolynomialFeatures(degree=2, include_bias=True, interaction_only=interaction).fit([[2., 3.]])
        np.testing.assert_array_equal(powers, lib.powers_)
        np.testing.assert_array_equal(got, lib.transform([[2., 3.]]))
        print('polynomial interaction_only', interaction, got.tolist(), 'powers:', powers.tolist())
    angles = np.array([350., 10., 30., 150., 0., 360.])
    got = cycle(angles)
    ordinary = FunctionTransformer(lambda X: cycle(X[:, 0], 360.), validate=True)
    np.testing.assert_allclose(got, ordinary.transform(angles[:, None]))
    print('cycle coordinates:', np.round(got, 6).tolist(), 'seam chord:', round(np.linalg.norm(got[0]-got[1]), 6))
    np.testing.assert_allclose(got[-2], got[-1], atol=1e-14)
