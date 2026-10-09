"""Analytic factor, gradient, penalty and solve examples; no training fit.

Run: python recommender-factor-structure.py
Requires NumPy and SciPy. Matrices are float64; ratings are finite or NaN.
"""
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def finite_array(value, name, ndim=None):
    result = np.asarray(value, dtype=np.float64)
    if ndim is not None and result.ndim != ndim:
        raise ValueError(f'{name} must have {ndim} dimensions')
    if not np.isfinite(result).all():
        raise ValueError(f'{name} must be finite')
    return result


def score(mean, user_bias, item_bias, p, q):
    p, q = finite_array(p, 'p', 1), finite_array(q, 'q', 1)
    if p.shape != q.shape or not p.size:
        raise ValueError('p and q need the same positive factor width')
    scalar = finite_array([mean, user_bias, item_bias], 'intercepts')
    return float(scalar.sum() + p @ q)


def local_loss(theta, rating, mean, penalty):
    """theta=[p coordinates,q coordinates,user bias,item bias]."""
    theta = finite_array(theta, 'theta', 1)
    if len(theta) < 4 or (len(theta) - 2) % 2:
        raise ValueError('theta needs two equal factor vectors and two biases')
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be finite and nonnegative')
    finite_array([rating, mean], 'rating/mean')
    d = (len(theta) - 2) // 2
    error = rating - score(mean, theta[-2], theta[-1], theta[:d], theta[d:2*d])
    return float(.5 * error ** 2 + .5 * penalty * (theta @ theta))


def local_gradient(theta, rating, mean, penalty):
    theta = finite_array(theta, 'theta', 1)
    local_loss(theta, rating, mean, penalty)  # Same validation/objective.
    d = (len(theta) - 2) // 2
    p, q = theta[:d].copy(), theta[d:2*d].copy()
    error = rating - score(mean, theta[-2], theta[-1], p, q)
    return np.concatenate((-error*q + penalty*p,
                           -error*p + penalty*q,
                           -error + penalty*theta[-2:]))


def simultaneous_step(theta, rating, mean, penalty, rate):
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('rate must be finite and nonnegative')
    old = finite_array(theta, 'old theta', 1).copy()
    derivative = local_gradient(old, rating, mean, penalty)
    after = old - rate * derivative
    if not np.isfinite(after).all():
        raise FloatingPointError('step produced an unavailable nonfinite state')
    return after, derivative


def central_difference(function, theta, epsilon=1e-6):
    theta = finite_array(theta, 'theta', 1)
    if not math.isfinite(epsilon) or epsilon <= 0:
        raise ValueError('epsilon must be positive and finite')
    result = np.empty_like(theta)
    for coordinate in range(len(theta)):
        delta = np.zeros_like(theta)
        delta[coordinate] = epsilon
        result[coordinate] = (function(theta+delta)-function(theta-delta))/(2*epsilon)
    return result


def quadratic_coordinate(a, b, coordinate, current):
    """Minimize p.T A p - 2 b.T p while other coordinates stay fixed."""
    a, b = finite_array(a, 'A', 2), finite_array(b, 'b', 1)
    current = finite_array(current, 'current', 1)
    if a.shape != (b.size, b.size) or current.shape != b.shape:
        raise ValueError('A/b/current shapes disagree')
    if not 0 <= coordinate < b.size:
        raise ValueError('coordinate is outside the actual vector')
    curvature = float(a[coordinate, coordinate])
    numerator = float(b[coordinate] - a[coordinate] @ current + curvature*current[coordinate])
    if curvature < 0:
        return {'available': False, 'reason': 'negative curvature is not a bounded minimum'}
    if curvature == 0:
        return {'available': False, 'reason': 'flat nonunique coordinate' if numerator == 0 else 'unbounded linear coordinate'}
    return {'available': True, 'numerator': numerator, 'curvature': curvature,
            'value': numerator / curvature}


def observed_block(q, ratings, penalty):
    """Biasless once-entity ridge block, including empty observed rows."""
    q, ratings = finite_array(q, 'Q', 2), finite_array(ratings, 'ratings', 1)
    if q.shape[0] != len(ratings) or not q.shape[1]:
        raise ValueError('one finite rating per provided Q row is required')
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be nonnegative and finite')
    a = q.T @ q + penalty*np.eye(q.shape[1])
    b = q.T @ ratings
    eigenvalues = np.linalg.eigvalsh(a)
    scale = max(1.0, float(np.linalg.norm(a, ord=2)))
    tolerance = np.finfo(np.float64).eps * scale * max(1, len(b)) * 16
    if eigenvalues[0] <= tolerance:
        return {'available': False, 'reason': 'singular or numerically non-SPD block',
                'A': a, 'b': b, 'eigenvalues': eigenvalues, 'tolerance': tolerance}
    by_numpy = np.linalg.solve(a, b)
    by_scipy = scipy_solve(a, b, assume_a='pos')
    residual = float(np.linalg.norm(a @ by_numpy - b, ord=np.inf))
    return {'available': True, 'A': a, 'b': b, 'p': by_numpy,
            'scipyP': by_scipy, 'residualInfinity': residual,
            'eigenvalues': eigenvalues, 'tolerance': tolerance}


def degree_penalties(events, users, items, penalty):
    """Each event charges its participating entity in the local objective."""
    if users < 1 or items < 1 or penalty < 0:
        raise ValueError('positive dimensions/nonnegative penalty required')
    user_degrees, item_degrees = np.zeros(users, dtype=int), np.zeros(items, dtype=int)
    for user, item, _ in events:
        if not 0 <= user < users or not 0 <= item < items:
            raise ValueError('event ID is outside its entity table')
        user_degrees[user] += 1
        item_degrees[item] += 1
    return {'userDegree': user_degrees, 'itemDegree': item_degrees,
            'perRecordUserCoefficients': penalty*user_degrees,
            'onceEntityUserCoefficients': np.full(users, penalty)}


def serial(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    # New analytic witness; this never invokes the retained factor trainers.
    completion = np.array([[1., 3.], [1/3, 1.]])
    p, q = np.array([1., 0.]), np.array([1., 0.])
    angle = math.radians(37)
    rotation = np.array([[math.cos(angle), -math.sin(angle)],
                         [math.sin(angle), math.cos(angle)]])
    change = np.diag([2., 1.])
    p_changed, q_changed = change @ p, np.linalg.solve(change.T, q)
    theta = np.array([.2, .4, -.3, .5, .05, .1])
    gradient = local_gradient(theta, 2., 3., .2)
    numerical = central_difference(lambda x: local_loss(x, 2., 3., .2), theta)
    after, _ = simultaneous_step(theta, 2., 3., .2, .1)
    gradient_error = float(np.max(np.abs(gradient-numerical)))
    if gradient_error > 2e-8:
        raise AssertionError('changed analytic gradient exceeds declared finite-difference tolerance')
    block = observed_block([[1., 0.], [1., 1.]], [4., 2.], 1.)
    if not block['available'] or not np.allclose(block['p'], [2., 0.], rtol=0, atol=1e-13):
        raise AssertionError('direct worked block failed')
    # X.T X + I = [[3,1],[1,2]], X.T r = [6,2].
    report = {
        'scope': 'Analytic arrays and one changed local step; no factor training fit',
        'rankOneCompletion': completion, 'determinant': float(np.linalg.det(completion)),
        'orthogonalDot': float((rotation@p) @ (rotation@q)),
        'orthogonalNormSum': float(np.sum((rotation@p)**2)+np.sum((rotation@q)**2)),
        'rescaledP': p_changed, 'rescaledQ': q_changed,
        'rescaledDot': float(p_changed@q_changed),
        'oldNormSum': float(p@p+q@q), 'newNormSum': float(p_changed@p_changed+q_changed@q_changed),
        'changedGradient': gradient, 'centralDifference': numerical,
        'differenceInfinity': gradient_error, 'differenceStep': 1e-6,
        'after': after, 'beforeLoss': local_loss(theta, 2., 3., .2),
        'afterLoss': local_loss(after, 2., 3., .2),
        'degreeCounts': degree_penalties([(0, 0, 1), (0, 1, 2), (0, 0, 3), (0, 1, 4)], 2, 2, .2),
        'MAPLambda': .5**2 / 2.**2,
        'coordinate': quadratic_coordinate([[3., 1.], [1., 2.]], [6., 2.], 0, [0., 1.]),
        'directBlock': block,
        'positivePenaltyEmpty': observed_block(np.empty((0, 2)), [], 1.),
        'unpenalizedEmpty': observed_block(np.empty((0, 2)), [], 0.),
        'flatCoordinate': quadratic_coordinate([[0.]], [0.], 0, [2.]),
        'unboundedCoordinate': quadratic_coordinate([[0.]], [1.], 0, [2.]),
        'cost': 'score O(d); block assembly O(n*d^2), direct solve O(d^3); no inverse needed to solve one b',
    }
    print(json.dumps(report, indent=2, default=serial, allow_nan=False))


if __name__ == '__main__':
    main()
