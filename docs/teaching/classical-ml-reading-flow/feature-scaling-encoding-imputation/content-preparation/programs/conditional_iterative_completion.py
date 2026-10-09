"""Deterministic conditional ridge cycles and saved inference sequence.

The intercept is unpenalized. Solve an augmented least-squares system rather
than forming an inverse of X.T@X. Observed input cells never change.
"""
from dataclasses import dataclass
import warnings
import numpy as np
from sklearn.experimental import enable_iterative_imputer  # noqa: F401
from sklearn.impute import IterativeImputer
from sklearn.linear_model import Ridge
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Conditional:
    target: int
    others: np.ndarray
    coefficient: np.ndarray
    intercept: float


@dataclass(frozen=True)
class Iteration:
    medians: np.ndarray
    sequence: tuple
    sweeps: int
    change: float
    status: str


def ridge_fit(A, y, alpha):
    mean, ymean = A.mean(axis=0), y.mean()
    centered = A-mean
    if alpha > 0:
        augmented = np.vstack([centered, np.sqrt(alpha)*np.eye(A.shape[1])])
        rhs = np.r_[y-ymean, np.zeros(A.shape[1])]
    else:
        augmented, rhs = centered, y-ymean
    coefficient = np.linalg.lstsq(augmented, rhs, rcond=None)[0]
    return coefficient, float(ymean-mean@coefficient)


def fit_completion(X, alpha=1., max_iter=3, tol=1e-10):
    X = matrix(X)
    if X.shape[1] < 2 or np.isnan(X).all(axis=0).any():
        raise ValueError('at least two columns, each with an observed target')
    if not np.isfinite(alpha) or alpha < 0 or not isinstance(max_iter, int) or max_iter < 1 or not np.isfinite(tol) or tol < 0:
        raise ValueError('nonnegative alpha/tol and positive sweep cap')
    mask = np.isnan(X)
    medians = np.nanmedian(X, axis=0)
    current = np.where(mask, medians, X)
    threshold = tol*float(abs(X[~mask]).max())
    sequence, trace = [], []
    status = 'iteration cap'
    for sweep in range(max_iter):
        previous = current.copy()
        for j in range(X.shape[1]):
            others = np.array([k for k in range(X.shape[1]) if k != j])
            observed = ~mask[:, j]
            A, y = current[observed][:, others], X[observed, j]
            coefficient, intercept = ridge_fit(A, y, alpha)
            model = Conditional(j, frozen(others), frozen(coefficient), intercept)
            current[mask[:, j], j] = current[mask[:, j]][:, others]@coefficient+intercept
            sequence.append(model)
            trace.append({'sweep': sweep+1, 'target': j,
                          'observed_rows': np.flatnonzero(observed).tolist(),
                          'design': A.tolist(), 'target_values': y.tolist(),
                          'coefficient': coefficient.tolist(), 'intercept': intercept,
                          'completed': current.copy().tolist()})
        if not np.isfinite(current).all():
            raise ValueError('conditional completion overflow')
        # np.linalg.norm(matrix, ord=inf) is max ROW SUM, matching this
        # configured sklearn stopping criterion, not max individual cell.
        change = float(np.linalg.norm(current-previous, ord=np.inf))
        if change < threshold:
            status = 'relative observed-scale tolerance'
            break
    np.testing.assert_array_equal(current[~mask], X[~mask])
    return Iteration(frozen(medians), tuple(sequence), sweep+1, change, status), current, trace


def transform_completion(state, X):
    X = matrix(X, len(state.medians))
    mask = np.isnan(X)
    result = np.where(mask, state.medians, X)
    for model in state.sequence:
        rows = mask[:, model.target]
        result[rows, model.target] = result[rows][:, model.others]@model.coefficient+model.intercept
    if not np.isfinite(result).all():
        raise ValueError('query completion overflow')
    np.testing.assert_array_equal(result[~mask], X[~mask])
    return result


if __name__ == '__main__':
    X = np.array([[1., 2.], [2., 4.], [3., np.nan], [np.nan, 8.], [5., 10.]])
    state, result, trace = fit_completion(X, alpha=1., max_iter=3, tol=1e-10)
    with warnings.catch_warnings(record=True) as notices:
        ordinary = IterativeImputer(estimator=Ridge(alpha=1., fit_intercept=True, solver='svd'),
                                    initial_strategy='median', imputation_order='roman',
                                    skip_complete=False, sample_posterior=False,
                                    max_iter=3, tol=1e-10, random_state=20)
        expected = ordinary.fit_transform(X)
    np.testing.assert_allclose(result, expected, atol=1e-10)
    print('training status:', state.sweeps, state.status, 'last change:', round(state.change, 8))
    for turn in trace:
        print('turn:', turn)
    query = np.array([[3., np.nan], [np.nan, 6.], [np.nan, np.nan]])
    got = transform_completion(state, query)
    np.testing.assert_allclose(got, ordinary.transform(query), atol=1e-10)
    print('new rows:', np.round(got, 6).tolist())
    print('ordinary notices:', [str(w.message) for w in notices])
    np.testing.assert_array_equal(transform_completion(state, query), got)
    try:
        fit_completion([[1., np.nan], [2., np.nan]])
    except ValueError as exc:
        print('refused:', exc)
