"""Vertical epsilon loss, atomic primal steps and consistent target units."""
import json
import numpy as np
import sklearn
from sklearn.svm import SVR


def objective_pullback(x, y, w, b, c=.7, epsilon=.2, regularization=1.):
    x, y, w = np.asarray(x, float), np.asarray(y, float), np.asarray(w, float)
    if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 2..100 observations and 1..20 features.')
    if y.shape != (len(x),) or w.shape != (x.shape[1],):
        raise ValueError('Target and weight dimensions must match the data.')
    if not all(np.isfinite(v).all() for v in (x, y, w)) or not np.isfinite(b):
        raise ValueError('Inputs and state must be finite.')
    if max(np.max(np.abs(x)), np.max(np.abs(y))) > 1000:
        raise ValueError('Feature/target magnitudes must be at most 1000.')
    if not np.isfinite([c, epsilon, regularization]).all() or not (.001 <= c <= 100 and 0 <= epsilon <= 100 and 0 <= regularization <= 100):
        raise ValueError('Use C in [.001,100], epsilon/lambda in [0,100].')
    prediction = x @ w + b
    residual = y - prediction
    excess = np.maximum(0., np.abs(residual) - epsilon)
    # Choose zero at either loss boundary, including residual zero when eps=0.
    signed = np.sign(residual) * (np.abs(residual) > epsilon)
    gw = regularization * w - c * (x.T @ signed)
    gb = -c * float(signed.sum())
    value = regularization * float(w @ w) / 2 + c * float(excess.sum())
    return value, gw, gb, prediction, residual, excess


def atomic_step(x, y, w, b, c=.7, epsilon=.2, regularization=1., eta=.02):
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    value, gw, gb, prediction, residual, excess = objective_pullback(
        x, y, w, b, c, epsilon, regularization)
    return np.asarray(w) - eta * gw, b - eta * gb, {
        'objective': value, 'gradient_w': gw.tolist(), 'gradient_b': gb,
        'prediction': prediction.tolist(), 'residual': residual.tolist(), 'excess': excess.tolist()}


def optimize(x, y, c=.7, epsilon=.2, eta=.02, steps=4000, regularization=1.):
    if not isinstance(steps, int) or not 1 <= steps <= 10000:
        raise ValueError('Use 1..10000 iterations.')
    x = np.asarray(x, float)
    w, b = np.zeros(x.shape[1]), 0.
    best_value = objective_pullback(x, y, w, b, c, epsilon, regularization)[0]
    best_w, best_b = w.copy(), b
    status = 'iteration cap'
    for step in range(1, steps + 1):
        with np.errstate(over='ignore', invalid='ignore'):
            new_w, new_b, details = atomic_step(x, y, w, b, c, epsilon, regularization,
                                               eta / np.sqrt(step))
            if not np.isfinite(new_w).all() or not np.isfinite(new_b):
                status = 'numerical limit'
                break
            value = objective_pullback(x, y, new_w, new_b, c, epsilon, regularization)[0]
            if not np.isfinite(value):
                status = 'numerical limit'
                break
        w, b = new_w, float(new_b)
        if value < best_value:
            best_value, best_w, best_b = value, w.copy(), b
        if np.linalg.norm(np.r_[details['gradient_w'], details['gradient_b']]) <= 1e-10:
            status = 'selected subgradient stationary'
            break
    return {'w': best_w.tolist(), 'b': best_b, 'objective': best_value,
            'steps': step, 'status': status}


def convert_units(y, w, b, c, epsilon, offset, scale):
    if not np.isfinite([offset, scale]).all() or scale <= 0:
        raise ValueError('Target offset must be finite and scale strictly positive.')
    y, w = np.asarray(y, float), np.asarray(w, float)
    if not all(np.isfinite(v).all() for v in (y, w, b, c, epsilon)) or c <= 0 or epsilon < 0:
        raise ValueError('Use finite state, a positive C and nonnegative epsilon.')
    with np.errstate(over='ignore', invalid='ignore', divide='ignore'):
        converted = ((y - offset) / scale, w / scale, (b - offset) / scale,
                     c / scale, epsilon / scale)
    underflow = (converted[3] <= 0 or (epsilon > 0 and converted[4] == 0)
                 or np.any((w != 0) & (converted[1] == 0)))
    if underflow or not all(np.isfinite(v).all() for v in converted):
        raise ArithmeticError('Unit conversion exceeded finite arithmetic; keep the old state.')
    return converted


def main():
    x = np.array([[-1., 0.], [.5, 1.], [1.5, -.5], [.3, -.8]])
    y = np.array([-.4, .6, 1.3, .2])
    w, b = np.array([.35, -.12]), .08
    c, epsilon = .7, .2
    new_w, new_b, details = atomic_step(x, y, w, b, c, epsilon)
    fitted = SVR(kernel='linear', C=c, epsilon=epsilon, tol=1e-9).fit(x, y)
    q = np.array([[-.3, .9], [1.1, -.7], [.6, .2]])
    reconstructed = q @ fitted.support_vectors_.T @ fitted.dual_coef_[0] + fitted.intercept_[0]
    np.testing.assert_allclose(reconstructed, fitted.predict(q), atol=1e-12, rtol=1e-12)
    offset, scale = -.3, 10.
    scaled_y, scaled_w, scaled_b, scaled_c, scaled_epsilon = convert_units(y, w, b, c, epsilon, offset, scale)
    original_objective = objective_pullback(x, y, w, b, c, epsilon)[0]
    scaled_objective = objective_pullback(x, scaled_y, scaled_w, scaled_b, scaled_c, scaled_epsilon)[0]
    np.testing.assert_allclose(scaled_objective, original_objective / scale ** 2, atol=1e-12, rtol=1e-12)
    scaled_fit = SVR(kernel='linear', C=scaled_c, epsilon=scaled_epsilon, tol=1e-10).fit(x, scaled_y)
    restored_predictions = offset + scale * scaled_fit.predict(q)
    np.testing.assert_allclose(restored_predictions, fitted.predict(q), atol=1e-6, rtol=1e-6)
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'inputs': {'x': x.tolist(), 'y': y.tolist(), 'C': c, 'epsilon': epsilon},
              'before': details, 'after': {'w': new_w.tolist(), 'b': new_b,
                                          'objective': objective_pullback(x, y, new_w, new_b, c, epsilon)[0]},
              'scratch': optimize(x, y, c, epsilon),
              'library': {'queries': q.tolist(), 'predictions': fitted.predict(q).tolist(),
                          'signed_coefficients': fitted.dual_coef_[0].tolist(),
                          'intercept': float(fitted.intercept_[0]), 'fit_status': int(fitted.fit_status_),
                          'iterations': int(fitted.n_iter_)},
              'unit_conversion': {'offset': offset, 'scale': scale, 'C_new': scaled_c,
                                  'epsilon_new': scaled_epsilon, 'objective_before': original_objective,
                                  'objective_scaled': scaled_objective,
                                  'restored_predictions': restored_predictions.tolist()}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
