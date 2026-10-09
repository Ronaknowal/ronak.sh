"""Fit a convex ridge objective to all 150 corrected recorded Iris rows.

Pass the canonical iris-corrected.csv path. Predict sepal width in cm from an
intercept and sepal length in cm. Species and petal measurements are unused.
Objective: 0.5*||Xw-y||^2 + 0.5*lambda*||w||^2, lambda=0.5; BOTH coefficients,
including the intercept, are penalized. No centering or standardization is
performed. Compare the direct SPD system with CVXPY/Clarabel on the SAME
objective and all the SAME rows. Residuals describe this fitted sample;
there is no held-out accuracy or causal interpretation.
Dependencies: Python 3.12, NumPy 2.3.5, CVXPY 1.9.2, Clarabel 0.11.1.
Data provenance/license is supplied beside the canonical CSV by its lesson.
"""

import csv
from pathlib import Path
import sys
import cvxpy as cp
import numpy as np


def read_features(csv_path):
    with Path(csv_path).open(newline='', encoding='utf-8') as stream:
        rows = list(csv.DictReader(stream))
    if len(rows) != 150:
        raise ValueError('the recorded fixture must contain all 150 rows')
    lengths = np.array([float(r['sepal length']) for r in rows])
    widths = np.array([float(r['sepal width']) for r in rows])
    if not np.all(np.isfinite(lengths)) or not np.all(np.isfinite(widths)):
        raise ValueError('measurements must be finite')
    return np.column_stack((np.ones(len(rows)), lengths)), widths


def ridge_comparison(X, y, penalty):
    """Return direct/solver weights, objective diagnostics and curvature.

    X is a finite real n-by-d matrix, y a finite real n-vector, n,d positive,
    and penalty finite and positive. Positive penalty makes H positive
    definite even when columns are dependent. This route forms X.T@X;
    the earlier QR/SVD lesson explains alternatives when conditioning matters.
    """
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    if (X.ndim != 2 or min(X.shape) == 0 or y.shape != (X.shape[0],)
            or not np.all(np.isfinite(X)) or not np.all(np.isfinite(y))
            or isinstance(penalty, bool) or not np.isfinite(penalty) or penalty <= 0):
        raise ValueError('finite matching arrays and positive penalty required')
    H = X.T @ X + penalty * np.eye(X.shape[1])
    rhs = X.T @ y
    direct = np.linalg.solve(H, rhs)
    w = cp.Variable(X.shape[1])
    problem = cp.Problem(cp.Minimize(0.5 * cp.sum_squares(X @ w - y)
                                    + 0.5 * penalty * cp.sum_squares(w)))
    assert problem.is_dcp()
    problem.solve(solver=cp.CLARABEL, tol_gap_abs=1e-10, tol_gap_rel=1e-10,
                  tol_feas=1e-10)
    if problem.status != cp.OPTIMAL or w.value is None:
        raise RuntimeError(f'ridge solver status: {problem.status}')
    solver = np.asarray(w.value)
    objective = lambda weights: 0.5 * np.sum((X @ weights - y)**2) + 0.5 * penalty * np.sum(weights**2)
    return {'direct': direct, 'solver': solver, 'status': problem.status,
            'objective': (objective(direct), objective(solver)),
            'stationarity': (np.linalg.norm(H @ direct - rhs), np.linalg.norm(H @ solver - rhs)),
            'curvature': np.linalg.eigvalsh(H), 'residuals': X @ direct - y}


def main():
    if len(sys.argv) != 2:
        raise SystemExit('usage: python recorded_iris_ridge.py iris-corrected.csv')
    X, y = read_features(sys.argv[1])
    result = ridge_comparison(X, y, 0.5)
    print('rows/features:', X.shape)
    print('penalty: 0.5 on both coefficients; width/length: cm')
    print('direct intercept/slope:', np.round(result['direct'], 8).tolist())
    print('solver intercept/slope:', np.round(result['solver'], 8).tolist())
    print('status:', result['status'])
    print('objectives:', [round(float(v), 8) for v in result['objective']])
    print('stationarity norms:', [f'{v:.3e}' for v in result['stationarity']])
    print('H eigenvalues:', np.round(result['curvature'], 8).tolist())
    print('sample residual min/max:', np.round([result['residuals'].min(), result['residuals'].max()], 8).tolist())
    assert np.max(np.abs(result['direct'] - result['solver'])) < 1e-6


if __name__ == '__main__':
    main()
