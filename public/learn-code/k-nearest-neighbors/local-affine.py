"""Query-centered Gaussian local regression; NumPy2.3.5/sklearn1.9.1."""
import numpy as np
from sklearn.linear_model import LinearRegression


def local_affine(x, y, query, bandwidth):
    x = np.asarray(x, dtype=np.float64); y = np.asarray(y, dtype=np.float64)
    if (x.ndim != 1 or not len(x) or y.shape != x.shape
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not np.isfinite(query) or not np.isfinite(bandwidth) or bandwidth <= 0):
        raise ValueError('matching finite vectors, finite query and positive finite bandwidth required')
    with np.errstate(over='raise', invalid='raise'):
        centered = x-query
        log_weight = -.5*(centered/bandwidth)**2
    # A common factor does not change the optimum. Removing the largest log
    # prevents all-zero weights caused only by a common distant-query scale.
    mass = np.exp(log_weight-log_weight.max())
    weight = mass/mass.sum()
    design = np.column_stack((np.ones_like(x), centered))
    root = np.sqrt(weight)
    # Reuse the published square-root weighted-design mechanism; lstsq is
    # the library factorization primitive, not a claimed handwritten SVD.
    coefficients, _, rank, singular = np.linalg.lstsq(root[:, None]*design, root*y, rcond=1e-12)
    constant = float(weight@y)
    identified = len(singular) == 2 and singular[1] > 1e-12*singular[0] and rank == 2
    if not np.isfinite(constant) or not np.isfinite(coefficients).all():
        raise ValueError('prediction is not representable')
    return dict(weights=weight, constant=constant,
                coefficients=coefficients if identified else None,
                affine=float(coefficients[0]) if identified else None,
                rank=int(rank), singular=singular, centered=centered)


def main():
    cases = [('curved', np.arange(4.), np.arange(4.)**2, 3.5, 1.),
             ('symmetric affine', np.array([-1.,0.,1.]), np.array([-1.,2.,5.]), 0., 1.),
             ('moved affine', np.array([-1.,0.,1.]), np.array([-1.,2.,5.]), .5, 1.),
             ('repeated x', np.ones(3), np.array([1.,2.,4.]), 1., 1.)]
    for label, x, y, query, bandwidth in cases:
        result = local_affine(x, y, query, bandwidth)
        print(label, 'query=', query, 'weights=', np.round(result['weights'], 9).tolist())
        print('  constant=', round(result['constant'], 9), 'affine=',
              None if result['affine'] is None else round(result['affine'], 9), 'rank=', result['rank'])
        if result['affine'] is not None:
            native = LinearRegression().fit(result['centered'][:,None], y, sample_weight=result['weights'])
            np.testing.assert_allclose(result['coefficients'], [native.intercept_, native.coef_[0]], atol=1e-10)
            residual = y-np.column_stack((np.ones_like(x),result['centered']))@result['coefficients']
            np.testing.assert_allclose(np.column_stack((np.ones_like(x),result['centered'])).T@(result['weights']*residual), [0.,0.], atol=1e-10)
    np.testing.assert_allclose(local_affine([-1,0,1],[-1,2,5],.5,1)['affine'], 3.5)
    assert local_affine([1,1,1],[1,2,4],1,1)['affine'] is None
    far = local_affine([0,1,2],[0,1,4],8,.05)
    assert np.isfinite(far['constant']) and np.isclose(far['weights'].sum(),1)
    print('Conditioned sklearn parity, weighted normal equations and explicit rank-failure checks passed.')


if __name__ == '__main__':
    main()
