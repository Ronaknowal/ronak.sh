"""A full real symmetric eigenbasis by maximum-pivot Jacobi rotations.

Input: a finite, exactly symmetric square matrix, 1 <= n <= 64.
Return: ascending eigenvalues, matching eigenvectors as columns of Q,
rotation count, and an optional trace. tolerance is relative to the full
Frobenius norm, in [1e-14, 0.1]. A nonnegative integer rotation budget may
be supplied; exhaustion raises RuntimeError. record_trace=True is limited
to n <= 4 and records the actual working matrix and accumulated basis.

The default working storage is O(n^2). Maximum-pivot search costs O(n^2)
per rotation; row/column and basis updates cost O(n). r rotations therefore
cost O(r*n^2). Requested snapshots add O(r*n^2) storage. This teaching
algorithm does not promise high relative accuracy for a tiny eigenvalue.
"""

from math import copysign, hypot, isfinite
from numbers import Real


def checked_matrix(matrix, tolerance, max_rotations, record_trace):
    n = len(matrix)
    if not 1 <= n <= 64 or any(len(row) != n for row in matrix):
        raise ValueError('matrix must be square with 1 through 64 rows')
    if any(not isinstance(x, Real) or isinstance(x, bool) or not isfinite(x)
           for row in matrix for x in row):
        raise ValueError('entries must be finite real numbers')
    if any(matrix[i][j] != matrix[j][i] for i in range(n) for j in range(i)):
        raise ValueError('matrix must be exactly symmetric')
    if not isinstance(tolerance, Real) or not 1e-14 <= tolerance <= 0.1:
        raise ValueError('tolerance must be finite and in [1e-14, 0.1]')
    if max_rotations is not None and (isinstance(max_rotations, bool)
            or not isinstance(max_rotations, int) or max_rotations < 0):
        raise ValueError('max_rotations must be a nonnegative integer or None')
    if not isinstance(record_trace, bool) or record_trace and n > 4:
        raise ValueError('record_trace must be Boolean; snapshots require n <= 4')
    return [[float(x) for x in row] for row in matrix]


def symmetric_eigen(matrix, tolerance=1e-12, max_rotations=None,
                    record_trace=False):
    """Return (values, Q, rotations, trace); Q columns match sorted values."""
    original = checked_matrix(matrix, tolerance, max_rotations, record_trace)
    n = len(original)
    scale = max(abs(x) for row in original for x in row)
    q = [[float(i == j) for j in range(n)] for i in range(n)]
    b = [[x / scale if scale else 0.0 for x in row] for row in original]
    norm = hypot(*(x for row in b for x in row))
    budget = 50 * n * n if max_rotations is None else max_rotations
    rotations, trace = 0, []

    def off_norm():
        return hypot(*(b[i][j] for i in range(n) for j in range(n) if i != j))

    def snapshot(pair=None, gamma=None):
        if record_trace:
            trace.append({'rotation': rotations, 'pair': pair,
                          'gamma_scaled': gamma, 'scale': scale,
                          'off_frobenius_squared_scaled': off_norm() ** 2,
                          'B_scaled': [row[:] for row in b],
                          'Q': [row[:] for row in q]})

    snapshot()
    while off_norm() > tolerance * norm:
        if rotations >= budget:
            raise RuntimeError('Jacobi rotation budget exhausted before convergence')
        p, j = max(((p, j) for p in range(n) for j in range(p + 1, n)),
                   key=lambda pair: abs(b[pair[0]][pair[1]]))
        alpha, beta, gamma = b[p][p], b[j][j], b[p][j]
        tau = (beta - alpha) / (2.0 * gamma)
        # Equal diagonals with nonzero coupling need a 45-degree rotation.
        t = 1.0 if tau == 0.0 else copysign(1.0, tau) / (abs(tau) + hypot(1.0, tau))
        c, s = 1.0 / hypot(1.0, t), t / hypot(1.0, t)
        for k in range(n):
            if k != p and k != j:
                old_p, old_j = b[k][p], b[k][j]
                b[k][p] = b[p][k] = c * old_p - s * old_j
                b[k][j] = b[j][k] = s * old_p + c * old_j
            old_p, old_j = q[k][p], q[k][j]
            q[k][p], q[k][j] = c * old_p - s * old_j, s * old_p + c * old_j
        b[p][p], b[j][j] = alpha - t * gamma, beta + t * gamma
        b[p][j] = b[j][p] = 0.0
        rotations += 1
        snapshot([p, j], gamma)

    order = sorted(range(n), key=lambda j: b[j][j])
    values = [b[j][j] * scale for j in order]
    if any(not isfinite(value) for value in values):
        raise OverflowError('an eigenvalue is not representable as a finite float')
    vectors = [[row[j] for j in order] for row in q]
    return values, vectors, rotations, trace


def diagnostics(matrix, values, q):
    """Original-coordinate residual, orthogonality and reconstruction norms."""
    n = len(matrix)
    residual = [[sum(matrix[i][k] * q[k][j] for k in range(n))
                 - values[j] * q[i][j] for j in range(n)] for i in range(n)]
    orthogonality = [[sum(q[k][i] * q[k][j] for k in range(n)) - (i == j)
                      for j in range(n)] for i in range(n)]
    reconstruction = [[matrix[i][j] - sum(q[i][k] * values[k] * q[j][k]
                         for k in range(n)) for j in range(n)] for i in range(n)]
    frobenius = lambda a: hypot(*(x for row in a for x in row))
    return {'residual': frobenius(residual),
            'orthogonality': frobenius(orthogonality),
            'reconstruction': frobenius(reconstruction)}


if __name__ == '__main__':
    matrix = [[2.0, 1.0, 0.0], [1.0, 2.0, 1.0], [0.0, 1.0, 2.0]]
    values, q, rotations, trace = symmetric_eigen(matrix, record_trace=True)
    print('values', [round(value, 6) for value in values])
    print('Q rows', [[round(value, 6) for value in row] for row in q])
    print('rotations', rotations)
    print('off-norm squared', [float(f"{step['off_frobenius_squared_scaled']:.6g}")
                               for step in trace])
    errors = diagnostics(matrix, values, q)
    print('all three error norms below 1e-10', all(x < 1e-10 for x in errors.values()))
    for changed in [[[1, 1], [1, 1]], [[1, 0], [0, 1]], [[0, 0], [0, 0]]]:
        values, q, rotations, _ = symmetric_eigen(changed)
        print('changed values', [round(value, 6) for value in values], 'rotations', rotations)
