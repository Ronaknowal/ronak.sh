"""Centered PCA with standard-library loops and the taught Jacobi solver.

Read the offline corrected UCI Iris CSV beside this file. Four features are
centimetres; the species column is excluded from every fitted operation.
PCA returns leading directions, row scores and a centered reconstruction.
Covariance uses sample divisor N-1. For N rows and d features, covariance
costs O(N*d^2); the reused eigensolver costs O(r*d^2); projection and
reconstruction cost O(N*d*k). Stored input/centered data cost O(N*d).
"""
import csv
from pathlib import Path
from symmetric_eigen_scratch import symmetric_eigen


def read_features(filename):
    with Path(filename).open(newline='', encoding='utf8') as stream:
        rows = list(csv.reader(stream))
    return [[float(value) for value in row[:4]] for row in rows[1:]]


def fit_pca(rows, components=2):
    """Finite rectangular observations, N>=2; retain integer 1<=k<=d."""
    from math import isfinite
    n, d = len(rows), len(rows[0]) if rows else 0
    if n < 2 or d == 0 or any(len(row) != d for row in rows):
        raise ValueError('at least two rows with equal nonzero feature counts')
    if isinstance(components, bool) or not isinstance(components, int) or not 1 <= components <= d:
        raise ValueError('components must be an integer from 1 through feature count')
    if any(not isfinite(value) for row in rows for value in row):
        raise ValueError('all observations must be finite')
    mean = [sum(row[j] for row in rows) / n for j in range(d)]
    centered = [[row[j] - mean[j] for j in range(d)] for row in rows]
    covariance = [[sum(row[i] * row[j] for row in centered) / (n - 1)
                   for j in range(d)] for i in range(d)]
    ascending, q, rotations, _ = symmetric_eigen(covariance)
    order = list(range(d - 1, -1, -1))
    values = [ascending[j] for j in order]
    directions = [[q[i][j] for j in order[:components]] for i in range(d)]
    scores = [[sum(row[j] * directions[j][k] for j in range(d))
               for k in range(components)] for row in centered]
    reconstructed = [[sum(score[k] * directions[j][k] for k in range(components))
                      for j in range(d)] for score in scores]
    sse = sum((centered[i][j] - reconstructed[i][j]) ** 2
              for i in range(n) for j in range(d))
    return {'mean': mean, 'centered': centered, 'covariance': covariance,
            'values': values, 'directions': directions, 'scores': scores,
            'reconstructed': reconstructed, 'sse': sse, 'rotations': rotations}


if __name__ == '__main__':
    rows = read_features(Path(__file__).with_name('iris-corrected.csv'))
    fit = fit_pca(rows)
    print('observations/features', len(rows), len(rows[0]))
    print('mean cm', [round(x, 6) for x in fit['mean']])
    print('values cm squared', [round(x, 6) for x in fit['values']])
    total = sum(fit['values'])
    print('two-component retained fraction', round(sum(fit['values'][:2]) / total, 6))
    print('residual SSE cm squared', round(fit['sse'], 6))
    discarded = (len(rows) - 1) * sum(fit['values'][2:])
    print('discarded-spectrum SSE agreement', abs(fit['sse'] - discarded) < 1e-9)
    shifted = [[x + shift for x, shift in zip(row, [4, 2, -1, 3])] for row in rows]
    shift_fit = fit_pca(shifted)
    print('translated covariance unchanged', all(abs(fit['covariance'][i][j]
          - shift_fit['covariance'][i][j]) < 1e-12 for i in range(4) for j in range(4)))
