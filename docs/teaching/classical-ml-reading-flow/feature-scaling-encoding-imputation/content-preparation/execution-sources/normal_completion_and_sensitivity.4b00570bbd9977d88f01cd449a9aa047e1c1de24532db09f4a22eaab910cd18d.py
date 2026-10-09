"""Bounded scalar normal/MCAR model; posterior draws and assumed delta shifts.

This is an explicit marginal model with no MAR covariates. It neither identifies
MNAR nor establishes frequentist coverage of arbitrary pooled intervals.
"""
import numpy as np
from scipy.stats import invgamma, normal_inverse_gamma
from pool_scalar_analyses import pool_scalar


def posterior(values, mu0=0., kappa0=1., alpha0=2., beta0=2., prior_only=False):
    x = np.asarray(values, float)
    if x.ndim != 1 or len(x) < 2 or np.isinf(x).any():
        raise ValueError('one scalar column, at least two total rows, finite or NaN')
    parameters = np.array([mu0, kappa0, alpha0, beta0], float)
    if not np.isfinite(parameters).all() or min(kappa0, alpha0, beta0) <= 0:
        raise ValueError('finite mu0; kappa0, alpha0, beta0 positive')
    observed = x[~np.isnan(x)]
    n = len(observed)
    if n == 0:
        if not prior_only:
            raise ValueError('no observed values; explicit prior-only opt-in required')
        return float(mu0), float(kappa0), float(alpha0), float(beta0)
    mean = observed.mean()
    kappa = kappa0+n
    mu = (kappa0*mu0+n*mean)/kappa
    alpha = alpha0+n/2
    beta = beta0+np.sum((observed-mean)**2)/2+kappa0*n*(mean-mu0)**2/(2*kappa)
    if not np.isfinite([mu, kappa, alpha, beta]).all():
        raise ValueError('posterior arithmetic overflow')
    return float(mu), float(kappa), float(alpha), float(beta)


def complete_normal(values, m=5, seed=20, delta=0., ordinary_joint=False, **prior):
    x = np.asarray(values, float)
    if not isinstance(m, int) or isinstance(m, bool) or m < 2 or m > 10000 or not np.isfinite(delta):
        raise ValueError('bounded integer m >= 2 and finite assumed delta')
    mu_n, kappa_n, alpha_n, beta_n = posterior(x, **prior)
    rng = np.random.default_rng(seed)
    mask = np.isnan(x)
    tables, estimates, variances, parameters = [], [], [], []
    for _ in range(m):
        if ordinary_joint:
            mu, variance = normal_inverse_gamma(mu_n, kappa_n, alpha_n, beta_n).rvs(random_state=rng)
        else:
            variance = invgamma.rvs(alpha_n, scale=beta_n, random_state=rng)
            mu = rng.normal(mu_n, np.sqrt(variance/kappa_n))
        completed = x.copy()
        completed[mask] = rng.normal(mu, np.sqrt(variance), size=mask.sum())+delta
        np.testing.assert_array_equal(completed[~mask], x[~mask])
        estimates.append(float(completed.mean()))
        variances.append(float(completed.var(ddof=1)/len(completed)))
        parameters.append((float(mu), float(variance)))
        tables.append(completed)
    return dict(posterior=(mu_n, kappa_n, alpha_n, beta_n),
                tables=np.array(tables), draws=parameters,
                Q=estimates, U=variances, pooled=pool_scalar(estimates, variances))


if __name__ == '__main__':
    x = np.array([8., 10., np.nan, 12., np.nan])
    baseline = complete_normal(x)
    print('posterior mu/kappa/alpha/beta:', baseline['posterior'])
    print('completed tables:', np.round(baseline['tables'], 6).tolist())
    print('analysis Q:', np.round(baseline['Q'], 6).tolist(), 'U:', np.round(baseline['U'], 6).tolist())
    print('pooled:', baseline['pooled'])
    other = complete_normal(x, seed=21, m=3)
    print('changed seed/m estimates:', np.round(other['Q'], 6).tolist())
    joint = complete_normal(x, ordinary_joint=True)
    print('ordinary joint posterior:', joint['posterior'], 'estimates:', np.round(joint['Q'], 6).tolist())
    assert joint['posterior'] == baseline['posterior']
    for delta in [-2., 0., 2.]:
        shifted = complete_normal(x, delta=delta)
        np.testing.assert_allclose(shifted['tables'][:, ~np.isnan(x)], baseline['tables'][:, ~np.isnan(x)])
        np.testing.assert_allclose(shifted['tables'][:, np.isnan(x)], baseline['tables'][:, np.isnan(x)]+delta)
        print('assumed delta/pooled mean:', delta, round(shifted['pooled']['estimate'], 6))
    no_missing = complete_normal([8., 10., 12.], delta=100.)
    assert no_missing['pooled']['between'] == 0.
    print('no-missing null:', no_missing['pooled'])
    print('prior-only posterior:', posterior([np.nan, np.nan], prior_only=True))
