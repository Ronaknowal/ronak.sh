"""Cox-de Boor recurrence with explicit extended knots and saved boundaries."""
from dataclasses import dataclass
import numpy as np
from scipy.interpolate import BSpline
from sklearn.preprocessing import SplineTransformer
from fitted_rulers import frozen


def recurrence(x, knots, degree):
    x = np.asarray(x, float).reshape(-1)
    t = np.asarray(knots, float)
    if t.ndim != 1 or not np.isfinite(t).all() or np.any(np.diff(t) < 0):
        raise ValueError('finite nondecreasing full knots')
    if not isinstance(degree, int) or degree < 0 or len(t) < 2*degree+2 or not np.isfinite(x).all():
        raise ValueError('valid degree, sufficient knots, finite queries')
    basis = ((x[:, None] >= t[:-1]) & (x[:, None] < t[1:])).astype(float)
    # Closed supported right endpoint: evaluate the left limit there. This is
    # needed only when that boundary is the last full knot (degree zero).
    right = t[-degree-1]
    if degree == 0:
        basis[x == right, -1] = 1.
    for p in range(1, degree+1):
        next_basis = np.zeros((len(x), len(t)-p-1))
        for i in range(next_basis.shape[1]):
            left_width = t[i+p]-t[i]
            right_width = t[i+p+1]-t[i+1]
            if left_width != 0:
                next_basis[:, i] += (x-t[i])/left_width*basis[:, i]
            if right_width != 0:
                next_basis[:, i] += (t[i+p+1]-x)/right_width*basis[:, i+1]
        basis = next_basis
    return basis


@dataclass(frozen=True)
class Splines:
    base: np.ndarray
    full: np.ndarray
    degree: int
    extrapolation: str


def fit_splines(training, n_knots=3, degree=1, base=None, extrapolation='constant'):
    x = np.asarray(training, float).reshape(-1)
    if not len(x) or not np.isfinite(x).all() or not isinstance(degree, int) or degree < 0 or degree > 5:
        raise ValueError('finite training values and bounded degree 0..5')
    if extrapolation not in ['constant', 'error', 'linear'] or (degree == 0 and extrapolation == 'linear'):
        raise ValueError('constant/error; linear requires positive degree')
    if base is None:
        if not isinstance(n_knots, int) or n_knots < 2 or np.ptp(x) == 0:
            raise ValueError('nonconstant fit and at least two base knots')
        base = np.linspace(x.min(), x.max(), n_knots)
    base = np.asarray(base, float)
    if base.ndim != 1 or len(base) < 2 or not np.isfinite(base).all() or np.any(np.diff(base) <= 0):
        raise ValueError('strictly increasing finite base knots')
    full = np.r_[base[0]-(base[1]-base[0])*np.arange(degree, 0, -1), base,
                 base[-1]+(base[-1]-base[-2])*np.arange(1, degree+1)]
    return Splines(frozen(base), frozen(full), degree, extrapolation)


def derivative_at(state, x):
    p, t = state.degree, state.full
    # At the right base boundary use the interior (left) derivative; degree1
    # has a derivative jump at that knot and a right interval is another piece.
    inside = np.nextafter(x, -np.inf) if x == state.base[-1] else x
    lower = recurrence([inside], t, p-1)[0]
    values = np.zeros(len(t)-p-1)
    for i in range(len(values)):
        if t[i+p] != t[i]:
            values[i] += p*lower[i]/(t[i+p]-t[i])
        if t[i+p+1] != t[i+1]:
            values[i] -= p*lower[i+1]/(t[i+p+1]-t[i+1])
    return values


def design(state, x):
    x = np.asarray(x, float).reshape(-1)
    if not np.isfinite(x).all():
        raise ValueError('missing/nonfinite input is not a spline zero')
    lo, hi = state.base[[0, -1]]
    outside = (x < lo) | (x > hi)
    if outside.any() and state.extrapolation == 'error':
        raise ValueError('outside fitted base interval')
    clipped = np.clip(x, lo, hi)
    result = recurrence(clipped, state.full, state.degree)
    if state.extrapolation == 'linear':
        for end, mask in [(lo, x < lo), (hi, x > hi)]:
            result[mask] += (x[mask]-end)[:, None]*derivative_at(state, end)
    return result


if __name__ == '__main__':
    for degree in [0, 1, 2]:
        for policy in ['constant', 'error']+(['linear'] if degree else []):
            state = fit_splines([0., 1., 2.], degree=degree, base=[0., 1., 2.], extrapolation=policy)
            query = np.array([0., .5, 1., 2.]) if policy == 'error' else np.array([-.5, 0., .5, 1., 2., 2.5])
            got = design(state, query)
            ordinary = SplineTransformer(knots=np.array([[0.], [1.], [2.]]), degree=degree,
                                         include_bias=True, extrapolation=policy, handle_missing='error').fit([[0.], [1.], [2.]])
            interior = (query >= 0) & (query <= 2)
            # sklearn 1.9.1 degree-zero constant extrapolation raises a shape
            # error outside its base interval. Preserve that observed failure in
            # the author receipt; compare its supported interior only here.
            compared = interior if degree == 0 else np.ones(len(query), bool)
            np.testing.assert_allclose(got[compared], ordinary.transform(query[compared, None]), atol=1e-12)
            scipy_basis = BSpline(state.full, np.eye(len(state.full)-degree-1), degree)(query[interior])
            np.testing.assert_allclose(got[interior], scipy_basis, atol=1e-12)
            np.testing.assert_allclose(got.sum(axis=1), 1., atol=1e-12)
            print('degree/policy', degree, policy, 'full knots:', state.full.tolist(),
                  'rows:', np.round(got, 6).tolist())
    state = fit_splines([0., 1., 2.], degree=1)
    row = design(state, [.5, 2.])
    print('given coefficient sum:', (row @ np.array([2., 4., 1.])).tolist())
    try:
        design(fit_splines([0., 2.], extrapolation='error'), [3.])
    except ValueError as exc:
        print('refused:', exc)
