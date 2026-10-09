"""Stable scalar power families, inverses and bounded likelihood fitting."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import minimize_scalar
from sklearn.preprocessing import PowerTransformer


def checked(values):
    x = np.asarray(values, float)
    if x.size == 0 or not np.isfinite(x).all():
        raise ValueError('nonempty finite values required')
    return x


def quotient(log_v, power):
    return log_v if power == 0 else np.expm1(power*log_v)/power


def inverse_quotient(z, power):
    if power == 0:
        return z
    if np.any(1+power*z <= 0):
        raise ValueError('value outside inverse power domain')
    return np.log1p(power*z)/power


def forward(x, lam, method='yeo-johnson'):
    x = checked(x)
    if not np.isfinite(lam) or method not in ['box-cox', 'yeo-johnson']:
        raise ValueError('finite lambda and known family required')
    try:
        with np.errstate(over='raise', invalid='raise', divide='raise'):
            if method == 'box-cox':
                if np.any(x <= 0):
                    raise ValueError('Box-Cox requires strictly positive inputs')
                y = quotient(np.log(x), lam)
            else:
                y = np.empty_like(x)
                positive = x >= 0
                y[positive] = quotient(np.log1p(x[positive]), lam)
                y[~positive] = -quotient(np.log1p(-x[~positive]), 2-lam)
    except FloatingPointError as exc:
        raise ValueError('power arithmetic overflow/domain failure') from exc
    if not np.isfinite(y).all():
        raise ValueError('nonfinite power result')
    return y


def inverse(y, lam, method='yeo-johnson'):
    y = checked(y)
    if not np.isfinite(lam) or method not in ['box-cox', 'yeo-johnson']:
        raise ValueError('finite lambda and known family required')
    try:
        with np.errstate(over='raise', invalid='raise', divide='raise'):
            if method == 'box-cox':
                x = np.exp(inverse_quotient(y, lam))
            else:
                x = np.empty_like(y)
                positive = y >= 0
                x[positive] = np.expm1(inverse_quotient(y[positive], lam))
                x[~positive] = -np.expm1(inverse_quotient(-y[~positive], 2-lam))
    except FloatingPointError as exc:
        raise ValueError('inverse arithmetic overflow/domain failure') from exc
    if not np.isfinite(x).all():
        raise ValueError('nonfinite inverse')
    return x


def likelihood(x, lam, method):
    x = checked(x).ravel()
    y = forward(x, lam, method)
    with np.errstate(over='raise', invalid='raise'):
        variance = y.var(ddof=0)
        jacobian = (lam-1)*np.sum(np.log(x) if method == 'box-cox' else np.sign(x)*np.log1p(abs(x)))
    if not np.isfinite(variance) or variance <= 0:
        raise ValueError('degenerate transformed variance')
    return float(-len(x)*np.log(variance)/2), float(jacobian)


@dataclass(frozen=True)
class PowerState:
    method: str
    name: str
    lam: float
    center: float
    scale: float
    objective: float
    bounds: tuple
    status: str
    evaluations: int


def fit_power(x, name='amount', method='yeo-johnson', bounds=(-3., 3.), standardize=False):
    x = checked(x).ravel()
    if len(x) < 2 or np.ptp(x) == 0:
        raise ValueError('at least two nonconstant observed fitting values')
    if len(bounds) != 2 or not np.isfinite(bounds).all() or bounds[0] >= bounds[1]:
        raise ValueError('finite increasing search bounds')
    # Validate the data domain separately from optimizer-candidate failure.
    forward(x, 1., method)
    def objective(lam):
        try:
            return -sum(likelihood(x, lam, method))
        except (ValueError, FloatingPointError):
            return np.inf
    fit = minimize_scalar(objective, bounds=bounds, method='bounded',
                          options={'maxiter': 200, 'xatol': 1e-8})
    candidates = [(objective(float(lam)), float(lam)) for lam in [fit.x, *bounds]]
    value, lam = min(candidates)
    if not np.isfinite(value):
        raise ValueError('no finite objective in search')
    y = forward(x, lam, method)
    center, scale = (float(y.mean()), float(y.std())) if standardize else (0., 1.)
    status = 'boundary' if lam in bounds else ('interior' if fit.success else 'iteration cap')
    return PowerState(method, name, lam, center, scale, -value, tuple(bounds), status, fit.nfev+3)


def apply(state, x, name='amount', undo=False):
    if name != state.name:
        raise ValueError('feature name changed')
    return inverse(checked(x)*state.scale+state.center, state.lam, state.method) if undo else (
        forward(x, state.lam, state.method)-state.center)/state.scale


if __name__ == '__main__':
    for method, x in [('box-cox', np.array([1., 2., 4., 10., 30.])),
                       ('yeo-johnson', np.array([-3., -1., 0., 2., 8.]))]:
        for lam in [0., 1e-9, 1., 2.-1e-9, 2.]:
            y = forward(x, lam, method)
            np.testing.assert_allclose(inverse(y, lam, method), x, atol=1e-10)
            # The public estimator fits lambda; inspect same-lambda values via
            # SciPy's public family functions rather than changing learned state.
            from scipy.special import boxcox
            from scipy.stats import yeojohnson
            primitive = boxcox if method == 'box-cox' else yeojohnson
            np.testing.assert_allclose(y, primitive(x, lam), rtol=1e-9, atol=1e-9)
        state = fit_power(x, method=method)
        ordinary = PowerTransformer(method=method, standardize=False).fit(x[:, None])
        same_lambda = forward(x, float(ordinary.lambdas_[0]), method)
        np.testing.assert_allclose(same_lambda, ordinary.transform(x[:, None])[:, 0], atol=1e-10)
        print(method, 'bounded lambda/status:', round(state.lam, 6), state.status,
              'terms:', np.round(likelihood(x, state.lam, method), 6).tolist())
        print('ordinary lambda/objective:', round(float(ordinary.lambdas_[0]), 6),
              round(sum(likelihood(x, float(ordinary.lambdas_[0]), method)), 6))
        print('later:', np.round(apply(state, [3., 12.]), 6).tolist())
    print('YJ -3 at lambda0/1/2:', [float(forward([-3.], l)[0]) for l in [0., 1., 2.]])
    for bad in [lambda: forward([0.], 0., 'box-cox'), lambda: fit_power([7., 7.]),
                lambda: inverse([-2.], 1., 'box-cox'), lambda: forward([1e300], 5., 'box-cox')]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
