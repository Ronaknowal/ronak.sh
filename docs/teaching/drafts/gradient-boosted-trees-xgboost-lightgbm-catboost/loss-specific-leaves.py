"""Desired change and actual residual-leaf minimization are separate operations."""
import numpy as np


def residuals(values):
    r = np.asarray(values, dtype=np.float64)
    if r.ndim != 1 or len(r) == 0 or not np.isfinite(r).all():
        raise ValueError('a nonempty finite residual vector is required')
    return r


def absolute_leaf(values):
    return float(np.median(residuals(values)))


def huber_loss(errors, delta):
    absolute = np.abs(errors)
    return np.where(absolute <= delta, .5 * errors**2,
                    delta * (absolute - .5 * delta))


def huber_leaf(values, delta=2., tolerance=1e-12):
    r = residuals(values)
    if not np.isfinite(delta) or delta <= 0:
        raise ValueError('delta must be finite and positive')
    lower, upper = float(r.min()), float(r.max())
    for _ in range(100):
        middle = lower/2 + upper/2
        derivative = float(np.clip(middle-r, -delta, delta).sum())
        if derivative == 0 or upper-lower <= tolerance:
            return middle
        if derivative < 0:
            lower = middle
        else:
            upper = middle
    return lower/2 + upper/2


def main():
    from scipy.optimize import minimize_scalar
    from sklearn.ensemble import GradientBoostingRegressor
    for values, delta in [([-2., -1., 10.], 2.), ([-4., 0., 7.], 2.),
                          ([-4., 4.], 1.)]:
        r = residuals(values)
        square, absolute, fixed_huber = float(r.mean()), absolute_leaf(r), huber_leaf(r, delta)
        ordinary = minimize_scalar(lambda leaf: float(huber_loss(r-leaf, delta).sum()),
            bounds=(float(r.min()), float(r.max())), method='bounded',
            options={'xatol': 1e-12})
        print('residuals / fixed delta:', values, delta)
        print('desired LAD / Huber change:', np.sign(r).tolist(), np.clip(r, -delta, delta).tolist())
        print('square / absolute / fixed-Huber leaves:', square, absolute, round(fixed_huber, 10))
        print('achieved Huber objectives:', round(float(huber_loss(r-fixed_huber,delta).sum()),10), round(float(ordinary.fun),10))
    X=np.arange(6.,dtype=float).reshape(-1,1)
    y=np.array([0.,1.,2.,5.,6.,20.])
    for loss in ['absolute_error','huber']:
        model=GradientBoostingRegressor(loss=loss,alpha=.9,n_estimators=2,
            learning_rate=.5,max_depth=1,random_state=73).fit(X,y)
        print('ordinary',loss,'two-tree predictions:',np.round(model.predict(X),6).tolist())


if __name__ == '__main__':
    main()
