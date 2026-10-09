"""Fitted landmarks, bidirectional tie interpolation and explicit endpoints."""
from dataclasses import dataclass
import numpy as np
from scipy.special import ndtri, ndtr
from sklearn.preprocessing import QuantileTransformer
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Quantiles:
    names: tuple
    landmarks: np.ndarray
    references: np.ndarray


def fit_quantiles(X, names, n_landmarks=5):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('distinct names matching width')
    if not isinstance(n_landmarks, int) or isinstance(n_landmarks, bool) or n_landmarks < 2:
        raise ValueError('at least two requested landmarks')
    if np.isnan(X).all(axis=0).any():
        raise ValueError('no observed value for quantile fit')
    references = np.linspace(0., 1., min(n_landmarks, len(X)))
    landmarks = np.nanquantile(X, references, axis=0, method='linear')
    return Quantiles(names, frozen(landmarks), frozen(references))


def apply(state, X, names, output='uniform', epsilon=1e-7, inverse=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names or output not in ['uniform', 'normal'] or not 0 < epsilon < .5:
        raise ValueError('same schema, uniform/normal output and 0<epsilon<.5')
    result = X.copy()
    for j in range(X.shape[1]):
        finite = ~np.isnan(X[:, j])
        values = X[finite, j]
        q = state.landmarks[:, j]
        p = state.references
        if inverse:
            u = ndtr(values) if output == 'normal' else values
            result[finite, j] = np.interp(u, p, q)
            continue
        if q[0] == q[-1]:
            u = np.where(values < q[0], 0., np.where(values > q[0], 1., .5))
        else:
            u = .5*(np.interp(values, q, p)-np.interp(-values, -q[::-1], -p[::-1]))
            u[values <= q[0]] = 0.
            u[values >= q[-1]] = 1.
        result[finite, j] = ndtri(np.clip(u, epsilon, 1-epsilon)) if output == 'normal' else u
    return result


if __name__ == '__main__':
    X = np.array([[1.], [2.], [2.], [4.], [100.]])
    state = fit_quantiles(X, ['amount'])
    query = np.array([[0.], [1.], [2.], [3.], [1000.], [np.nan]])
    print('landmarks:', state.landmarks.ravel().tolist(), 'probabilities:', state.references.tolist())
    for distribution in ['uniform', 'normal']:
        got = apply(state, query, ['amount'], distribution)
        ordinary = QuantileTransformer(n_quantiles=5, subsample=None,
                                       output_distribution=distribution, random_state=20).fit(X)
        expected = ordinary.transform(query)
        # Interior comparisons are shared; custom normal clipping differs in
        # last digits from sklearn's 1e-7 minus spacing(1) endpoint convention.
        np.testing.assert_allclose(got[2:4], expected[2:4], atol=1e-12)
        print(distribution, np.round(got.ravel(), 6).tolist())
        print('ordinary:', np.round(expected.ravel(), 6).tolist())
    constant = fit_quantiles([[7.], [7.], [7.]], ['constant'], 3)
    print('custom constant:', apply(constant, [[6.], [7.], [8.]], ['constant']).ravel().tolist())
    ordinary = QuantileTransformer(n_quantiles=3, subsample=None).fit([[7.], [7.], [7.]])
    print('ordinary constant:', ordinary.transform([[6.], [7.], [8.]]).ravel().tolist())
    print('saturated inverse:', apply(state, [[1.]], ['amount'], inverse=True).ravel().tolist())
    assert apply(state, [[3.]], ['amount'])[0, 0] == apply(state, [[3.], [10000.]], ['amount'])[0, 0]
    assert state.landmarks[0, 0] == 1.
