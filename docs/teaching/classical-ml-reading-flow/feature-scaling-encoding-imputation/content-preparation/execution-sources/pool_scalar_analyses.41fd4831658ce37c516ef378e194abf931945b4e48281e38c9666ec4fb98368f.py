"""Pool scalar ANALYSES: U contains variances, not standard errors."""
import numpy as np


def pool_scalar(estimates, variances):
    Q, U = np.asarray(estimates, float), np.asarray(variances, float)
    if Q.ndim != 1 or U.shape != Q.shape or len(Q) < 2:
        raise ValueError('at least two paired scalar estimates/variances')
    if not np.isfinite(Q).all() or not np.isfinite(U).all() or np.any(U < 0):
        raise ValueError('finite estimates and nonnegative variances')
    with np.errstate(over='raise', invalid='raise'):
        mean, within, between = Q.mean(), U.mean(), Q.var(ddof=1)
        simulation = between/len(Q)
        total = within+between+simulation
    if not np.isfinite(total):
        raise ValueError('variance arithmetic overflow')
    return dict(m=len(Q), estimate=float(mean), within=float(within),
                between=float(between), simulation=float(simulation),
                total=float(total), standard_error=float(np.sqrt(total)))


if __name__ == '__main__':
    for Q, U in [([9., 10., 11.], [4., 4., 4.]),
                  ([8., 10., 10., 12.], [1., 1., 1., 1.]),
                  ([10., 10.], [4., 4.]), ([0., 0.], [0., 0.])]:
        print(pool_scalar(Q, U))
    assert np.isclose(pool_scalar([9, 10, 11], [4, 4, 4])['total'], 16/3)
    assert np.isclose(pool_scalar([8, 10, 10, 12], [1]*4)['total'], 13/3)
    print('analyse squares first:', np.mean(np.array([0., 2.])**2),
          'square averaged input:', np.mean([0., 2.])**2)
    for Q, U in [([1.], [1.]), ([1., 2.], [1., -1.])]:
        try:
            pool_scalar(Q, U)
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
