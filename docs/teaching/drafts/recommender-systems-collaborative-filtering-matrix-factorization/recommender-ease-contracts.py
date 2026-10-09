"""Complete constrained item-ridge reconstruction and ordinary solve checks.

Run: python recommender-ease-contracts.py
X is a binary user-by-item matrix. No factor training or hidden ridge epsilon.
"""
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def binary_matrix(value):
    x = np.asarray(value, dtype=np.float64)
    if x.ndim != 2 or min(x.shape) < 1 or not np.isfinite(x).all():
        raise ValueError('X must be a nonempty finite user-by-item matrix')
    if not np.isin(x, [0., 1.]).all():
        raise ValueError('this EASE construction declares binary pair targets')
    return x


def constrained_item_weights(value, penalty):
    x = binary_matrix(value)
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be finite and nonnegative')
    items = x.shape[1]
    gram = x.T @ x + penalty*np.eye(items)
    eigenvalues = np.linalg.eigvalsh(gram)
    tolerance = 16 * np.finfo(np.float64).eps * max(1., float(np.linalg.norm(gram, 2))) * items
    if eigenvalues[0] <= tolerance:
        return {'available': False, 'reason': 'singular or numerically non-SPD full Gram',
                'G': gram, 'eigenvalues': eigenvalues, 'tolerance': tolerance}
    # All inverse column actions are required for full B. A single new-user
    # vector does not, by itself, justify forming an inverse in ordinary ridge.
    inverse_actions = np.linalg.solve(gram, np.eye(items))
    diagonal = np.diag(inverse_actions)
    if not (diagonal > 0).all():
        raise FloatingPointError('positive definite inverse lost positive diagonal')
    weights = -inverse_actions / diagonal[np.newaxis, :]
    np.fill_diagonal(weights, 0.)
    return {'available': True, 'G': gram, 'P': inverse_actions, 'B': weights,
            'predictions': x @ weights,
            'objective': float(np.sum((x-x@weights)**2)+penalty*np.sum(weights**2)),
            'inverseResidualInfinity': float(np.linalg.norm(gram@inverse_actions-np.eye(items), np.inf)),
            'eigenvalues': eigenvalues, 'tolerance': tolerance}


def excluded_column_solution(value, target, penalty):
    """Independent direct constrained solve: self coefficient never enters X."""
    x = binary_matrix(value)
    if not 0 <= target < x.shape[1] or penalty < 0 or not math.isfinite(penalty):
        raise ValueError('valid target and nonnegative finite penalty required')
    others = [item for item in range(x.shape[1]) if item != target]
    if not others:
        return {'available': True, 'column': np.zeros(1), 'others': [], 'residualInfinity': 0.}
    features = x[:, others]
    a = features.T@features + penalty*np.eye(len(others))
    b = features.T@x[:, target]
    if np.linalg.matrix_rank(a) < len(others):
        return {'available': False, 'reason': 'nonunique excluded-column problem', 'A': a, 'b': b}
    ordinary = scipy_solve(a, b, assume_a='pos')
    augmented_x = np.vstack((features, math.sqrt(penalty)*np.eye(len(others))))
    augmented_y = np.concatenate((x[:, target], np.zeros(len(others))))
    least_squares, _, rank, singular_values = np.linalg.lstsq(augmented_x, augmented_y, rcond=None)
    column = np.zeros(x.shape[1])
    column[others] = ordinary
    return {'available': True, 'others': others, 'A': a, 'b': b,
            'column': column, 'augmentedLeastSquares': least_squares,
            'augmentedRank': int(rank), 'augmentedSingularValues': singular_values,
            'solverDifferenceInfinity': float(np.max(np.abs(ordinary-least_squares))),
            'residualInfinity': float(np.linalg.norm(a@ordinary-b, np.inf))}


def score_history(history, weights):
    history = np.asarray(history, dtype=np.float64)
    weights = np.asarray(weights, dtype=np.float64)
    if history.ndim != 1 or weights.shape != (history.size, history.size):
        raise ValueError('history and actual item table shapes disagree')
    if not np.isfinite(history).all() or not np.isfinite(weights).all():
        raise ValueError('score operands must be finite')
    return history @ weights


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    x = np.array([[1., 1., 0.], [0., 1., 1.], [1., 0., 0.]])
    result = constrained_item_weights(x, 1.)
    if not result['available']:
        raise AssertionError('declared positive-penalty block is unavailable')
    columns = [excluded_column_solution(x, item, 1.) for item in range(x.shape[1])]
    independent = np.column_stack([row['column'] for row in columns])
    difference = float(np.max(np.abs(result['B']-independent)))
    if difference > 1e-13:
        raise AssertionError('constrained inverse actions and excluded-column solves disagree')
    expected = np.array([[0., 1/3, -1/8], [2/5, 0., 3/8], [-1/5, 1/2, 0.]])
    if not np.allclose(result['B'], expected, rtol=0, atol=1e-13):
        raise AssertionError('worked asymmetric weights disagree')
    zero = constrained_item_weights(np.zeros((2, 3)), 1.)
    singular = constrained_item_weights([[1., 1.], [0., 0.]], 0.)
    duplicate = constrained_item_weights([[1., 1.], [0., 0.]], 1.)
    report = {
        'X': x, 'penalty': 1., 'constrained': result,
        'independentColumns': columns, 'differenceInfinity': difference,
        'selectedHistory': x[0], 'selectedScores': score_history(x[0], result['B']),
        'asymmetryInfinity': float(np.max(np.abs(result['B']-result['B'].T))),
        'allZeroPositivePenalty': zero,
        'duplicateColumnPositivePenalty': duplicate,
        'zeroPenaltySingular': singular,
        'derivation': 'G B_j = G_j - (lambda+gamma_j)e_j; self 0 sets lambda+gamma_j=1/P_jj',
        'cost': 'Gram O(U*I^2), full factorization/actions O(I^3), dense B memory O(I^2)',
    }
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
