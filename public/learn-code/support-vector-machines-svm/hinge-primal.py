"""Mean hinge/squared-hinge pullback, atomic steps and a controlled SGD bridge."""
import json
import numpy as np
import sklearn
from sklearn.linear_model import SGDClassifier


def data(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 2..100 rows and 1..20 features.')
    if y.shape != (len(x),) or not np.isin(y, [-1., 1.]).all():
        raise ValueError('One -1 or +1 label is required per row.')
    if not np.isfinite(x).all() or np.max(np.abs(x)) > 1000:
        raise ValueError('Features must be finite with magnitude at most 1000.')
    return x, y


def objective_pullback(x, y, w, b, regularization=.5, loss='hinge'):
    x, y = data(x, y)
    w = np.asarray(w, dtype=float)
    if w.shape != (x.shape[1],) or not np.isfinite(w).all() or not np.isfinite(b):
        raise ValueError('Use one finite weight per feature and a finite bias.')
    if not np.isfinite(regularization) or not 0 <= regularization <= 100:
        raise ValueError('Lambda must be finite in [0,100].')
    if loss not in ('hinge', 'squared_hinge'):
        raise ValueError('Choose hinge or squared_hinge.')
    scores = x @ w + b
    margins = y * scores
    shortfalls = np.maximum(0., 1 - margins)
    # At m=1 choose the valid zero loss subgradient.
    factors = (margins < 1).astype(float)
    losses = shortfalls
    if loss == 'squared_hinge':
        factors = 2 * shortfalls
        losses = shortfalls ** 2
    gradient_w = regularization * w - x.T @ (y * factors) / len(y)
    gradient_b = -float(np.sum(y * factors)) / len(y)
    objective = regularization * float(w @ w) / 2 + float(np.mean(losses))
    if not all(np.isfinite(v).all() for v in (objective, gradient_w, gradient_b,
                                               scores, margins, shortfalls)):
        raise ArithmeticError('The objective or pullback exceeded finite arithmetic.')
    return objective, gradient_w, gradient_b, scores, margins, shortfalls


def atomic_step(x, y, w, b, regularization=.5, eta=.1, loss='hinge'):
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    value, gw, gb, scores, margins, shortfalls = objective_pullback(
        x, y, w, b, regularization, loss)
    new_w = np.asarray(w, dtype=float) - eta * gw
    new_b = float(b - eta * gb)
    return new_w, new_b, {'objective': value, 'gradient_w': gw.tolist(),
                         'gradient_b': gb, 'scores': scores.tolist(),
                         'margins': margins.tolist(), 'shortfalls': shortfalls.tolist()}


def optimize(x, y, regularization=.5, eta=.1, steps=2000, loss='hinge'):
    x, y = data(x, y)
    if not isinstance(steps, int) or not 1 <= steps <= 10000:
        raise ValueError('Use 1..10000 iterations.')
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    w, b = np.zeros(x.shape[1]), 0.
    value = objective_pullback(x, y, w, b, regularization, loss)[0]
    best_w, best_b, best_value = w.copy(), b, value
    trace = [{'step': 0, 'objective': value}]
    status = 'iteration cap'
    for step in range(1, steps + 1):
        rate = eta / np.sqrt(step)
        with np.errstate(over='ignore', invalid='ignore'):
            try:
                new_w, new_b, details = atomic_step(x, y, w, b, regularization, rate, loss)
                if not np.isfinite(new_w).all() or not np.isfinite(new_b):
                    raise ArithmeticError('The atomic step exceeded finite arithmetic.')
                current = objective_pullback(x, y, new_w, new_b, regularization, loss)
            except ArithmeticError:
                status = 'numerical limit'
                trace.append({'step': step, 'status': status, 'rate': float(rate)})
                break
        w, b = new_w, new_b
        value, gw, gb = current[:3]
        if value < best_value:
            best_w, best_b, best_value = w.copy(), b, value
        if step <= 3 or step % 100 == 0 or step == steps:
            trace.append({'step': step, 'objective': value, 'rate': float(rate)})
        if np.linalg.norm(np.r_[gw, gb]) <= 1e-10:
            status = 'selected subgradient stationary'
            break
        if np.linalg.norm(rate * np.r_[details['gradient_w'], details['gradient_b']]) <= 1e-12:
            status = 'step small'
            break
    return {'w': best_w.tolist(), 'b': best_b, 'objective': best_value,
            'steps': step, 'status': status, 'trace': trace}


def library_row_bridge(x, y, w, b, regularization=.5, eta=.1, loss='hinge'):
    """Match one row update; a library row epoch is not the batch update."""
    x, y = data(x, y)
    objective_pullback(x, y, w, b, regularization, loss)
    if not 0 < eta <= 1 or eta * regularization > 1:
        raise ValueError('For exact shrink mapping use eta*lambda <= 1.')
    classifier = SGDClassifier(loss=loss, penalty='l2', alpha=regularization,
                               learning_rate='constant', eta0=eta,
                               shuffle=False, average=False, random_state=19)
    # Establish ordinary estimator classes/shapes, then map the specified state.
    classifier.partial_fit(x[:1], y[:1], classes=np.array([-1., 1.]))
    classifier.coef_[:] = np.asarray(w, dtype=float)
    classifier.intercept_[:] = b
    old_counter = float(classifier.t_)
    row, label = x[1], y[1]
    margin = float(label * (row @ w + b))
    factor = float(margin < 1) if loss == 'hinge' else 2 * max(0., 1 - margin)
    expected_w = np.asarray(w) - eta * (regularization * np.asarray(w) - label * row * factor)
    expected_b = b + eta * label * factor
    classifier.partial_fit(x[1:2], y[1:2])
    np.testing.assert_allclose(classifier.coef_[0], expected_w, atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(classifier.intercept_[0], expected_b, atol=1e-12, rtol=1e-12)
    return {'row': 1, 'margin_before': margin, 'w': classifier.coef_[0].tolist(),
            'b': float(classifier.intercept_[0]), 'counter_before': old_counter,
            'counter_after': float(classifier.t_), 'loss': loss}


def main():
    # New declared mechanism fixture; none of the historical mains is called.
    x = np.array([[-1., 0.], [1., 1.], [2., -1.]])
    y = np.array([-1., 1., 1.])
    w, b = np.array([.2, -.1]), .1
    new_w, new_b, before = atomic_step(x, y, w, b)
    after = objective_pullback(x, y, new_w, new_b)[0]
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'hand_before': before, 'hand_after': {'w': new_w.tolist(), 'b': new_b,
                                                  'objective': after},
              'row_bridges': [library_row_bridge(x, y, w, b, loss=name)
                              for name in ('hinge', 'squared_hinge')],
              'bounded_optimizations': {name: optimize(x, y, loss=name)
                                        for name in ('hinge', 'squared_hinge')}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
