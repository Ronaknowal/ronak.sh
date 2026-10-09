"""Small transparent real-matrix decompositions; Python 3, standard library.

Inputs are finite, nonempty rectangular lists with moderate magnitudes.
QR: m >= n; least-squares solve requires independent columns.
Cholesky: symmetric positive-definite input.
Jacobi SVD: exactly two columns, m >= 2; this is not a general LAPACK SVD.
"""
from math import copysign, hypot, isfinite, sqrt


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def matvec(a, x):
    return [dot(row, x) for row in a]


def forward_solve(l, b):
    x = [0.0] * len(b)
    for i in range(len(b)):
        x[i] = (b[i] - dot(l[i][:i], x[:i])) / l[i][i]
    return x


def back_solve(r, b):
    x = [0.0] * len(b)
    for i in reversed(range(len(b))):
        if r[i][i] == 0:
            raise ValueError("Back substitution needs nonzero pivots.")
        x[i] = (b[i] - dot(r[i][i + 1:], x[i + 1:])) / r[i][i]
    return x


def householder_qr(a):
    """Return n-by-n R and implicit reflectors; O(m n^2) work."""
    m, n = len(a), len(a[0])
    if m < n:
        raise ValueError("This QR route requires m >= n.")
    work = [list(map(float, row)) for row in a]
    reflectors = []
    for k in range(n):
        v = [work[i][k] for i in range(k, m)]
        length = hypot(*v)
        if length == 0:
            continue
        # Opposite sign avoids subtracting nearly equal positive values.
        alpha = -copysign(length, v[0])
        v[0] -= alpha
        beta = 2.0 / dot(v, v)
        for j in range(k, n):
            amount = beta * sum(v[i - k] * work[i][j] for i in range(k, m))
            for i in range(k, m):
                work[i][j] -= amount * v[i - k]
        work[k][k] = alpha
        for i in range(k + 1, m):
            work[i][k] = 0.0
        reflectors.append((k, v, beta))
    return [row[:n] for row in work[:n]], reflectors


def apply_reflectors(reflectors, x, transpose=True):
    """Apply Q^T forward, or Q in reverse; never form an m-by-m H."""
    result = list(map(float, x))
    order = reflectors if transpose else reversed(reflectors)
    for k, v, beta in order:
        amount = beta * dot(v, result[k:])
        for i, value in enumerate(v):
            result[k + i] -= amount * value
    return result


def qr_least_squares(a, b):
    r, reflectors = householder_qr(a)
    transformed = apply_reflectors(reflectors, b)
    # Numerical rank decisions need a scale/tolerance policy in real software.
    return back_solve(r, transformed[:len(r)])


def cholesky(a):
    """Compute A = L L^T by entry recurrence; O(n^3) work."""
    n = len(a)
    l = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1):
            remainder = a[i][j] - dot(l[i][:j], l[j][:j])
            if i == j:
                if remainder <= 0:
                    raise ValueError("Strict Cholesky requires a positive diagonal remainder.")
                l[i][j] = sqrt(remainder)
            else:
                l[i][j] = remainder / l[j][j]
    return l


def cholesky_solve(l, b):
    y = forward_solve(l, b)
    return back_solve([list(column) for column in zip(*l)], y)


def two_column_svd(a, tolerance=1e-12, max_rotations=8):
    """One-sided Jacobi: rotate A's two columns directly, tracking V.

    Returns U (m-by-2), s (descending length 2), V (2-by-2), rotations.
    A = U diag(s) V^T. One column-pair rotation costs O(m).
    The bounded loop reports nonconvergence rather than returning silent factors.
    """
    m = len(a)
    if m < 2 or any(len(row) != 2 for row in a):
        raise ValueError("Supply an m-by-2 real matrix with m >= 2.")
    columns = [[float(row[j]) for row in a] for j in range(2)]
    v_columns = [[1.0, 0.0], [0.0, 1.0]]
    rotations = 0
    for _ in range(max_rotations):
        left, right = columns
        alpha, beta, gamma = dot(left, left), dot(right, right), dot(left, right)
        if abs(gamma) <= tolerance * sqrt(alpha) * sqrt(beta):
            break
        tau = (beta - alpha) / (2 * gamma)
        t = copysign(1.0, tau) / (abs(tau) + hypot(1.0, tau))
        c = 1.0 / hypot(1.0, t)
        s = t * c
        columns = [[c * x - s * y for x, y in zip(left, right)],
                   [s * x + c * y for x, y in zip(left, right)]]
        vl, vr = v_columns
        v_columns = [[c * x - s * y for x, y in zip(vl, vr)],
                     [s * x + c * y for x, y in zip(vl, vr)]]
        rotations += 1
    else:
        raise ValueError("Jacobi rotation budget exhausted; inspect scale and tolerance.")
    lengths = [hypot(*column) for column in columns]
    order = sorted(range(2), key=lambda j: lengths[j], reverse=True)
    singular_values = [lengths[j] for j in order]
    u_columns = [[value / lengths[j] for value in columns[j]] if lengths[j] else None
                 for j in order]
    # Zero singular directions still need orthonormal U columns, even though
    # they contribute nothing to reconstruction. Choose a deterministic basis.
    if singular_values[0] == 0:
        u_columns = [[float(i == j) for i in range(m)] for j in range(2)]
    elif singular_values[1] == 0:
        first = u_columns[0]
        pivot = min(range(m), key=lambda i: abs(first[i]))
        candidate = [float(i == pivot) - first[pivot] * first[i] for i in range(m)]
        length = hypot(*candidate)
        u_columns[1] = [value / length for value in candidate]
    u = [list(row) for row in zip(*u_columns)]
    v = [list(row) for row in zip(*(v_columns[j] for j in order))]
    return u, singular_values, v, rotations


def svd_action(u, s, v, x, rank=2):
    """Rotate, scale and rotate back; O(m r), with integer rank from 0 to 2."""
    if type(rank) is not int or not 0 <= rank <= 2:
        raise ValueError("Retained rank must be an integer from 0 to 2.")
    coordinates = [sum(v[i][j] * x[i] for i in range(2)) for j in range(2)]
    return [sum(row[j] * s[j] * coordinates[j] for j in range(rank)) for row in u]


def svd_minimum_norm(u, s, v, b, cutoff=1e-12):
    """Use a finite nonnegative absolute singular-value cutoff, in input units."""
    if not isinstance(cutoff, (int, float)) or not isfinite(cutoff) or cutoff < 0:
        raise ValueError("Singular-value cutoff must be finite and nonnegative.")
    coefficients = [sum(u[i][j] * b[i] for i in range(len(u))) / s[j]
                    if s[j] > cutoff else 0.0 for j in range(2)]
    return [dot(row, coefficients) for row in v]


def rounded(x):
    return [round(value, 6) for value in x]


if __name__ == "__main__":
    design = [[1, t] for t in [0, 1, 2, 3]]
    print("QR [intercept, slope]:", rounded(qr_least_squares(design, [.1, 1, 2.2, 2.9])))
    l = cholesky([[4, 2], [2, 2]])
    print("Cholesky L:", [rounded(row) for row in l])
    print("Cholesky solve:", rounded(cholesky_solve(l, [6, 4])))
    u, s, v, count = two_column_svd([[3, 1], [1, 3]])
    print("Singular values:", rounded(s), "rotations:", count)
    print("Full action:", rounded(svd_action(u, s, v, [1, 0])))
    print("Rank-one action:", rounded(svd_action(u, s, v, [1, 0], rank=1)))
    u, s, v, _ = two_column_svd([[1, 1], [2, 2], [3, 3]])
    print("Minimum-norm solution:", rounded(svd_minimum_norm(u, s, v, [2, 4, 6])))
