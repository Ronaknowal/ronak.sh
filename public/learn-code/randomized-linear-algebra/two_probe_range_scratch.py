"""Two-probe randomized range/SVD, Python standard library plus earlier owner.

Download matrix_decomposition_scratch.py from Matrix Decompositions alongside
this file, then run: python two_probe_range_scratch.py --factor-program PATH
The imported earlier lesson owns Householder QR and the two-column Jacobi SVD;
this programme implements the probing, compression, lifting and loss accounting.

Inputs: real finite rectangular A, m,n >= 2 and <= 32; exactly two columns of
Omega with n rows; entry magnitudes <= 1e6. q is an integer 0..3; final k is 1
or 2. The sampled/intermediate blocks must have two numerically independent
columns. This bounded full-rank branch rejects a deficient block; the separate
rank-aware NumPy programme owns the zero/rank-deficient general route. Its QR
pivot threshold is a numerical admission policy, not a rank-revealing theorem.
The fixed pseudo-Gaussian draw illustrates the mechanism, not a per-seed bound.
"""
import argparse
import importlib.util
import math
import random
import sys


def checked_matrix(a, name):
    if not isinstance(a, list) or not 2 <= len(a) <= 32:
        raise ValueError(name + ' needs 2..32 rows.')
    if not isinstance(a[0], list) or not 2 <= len(a[0]) <= 32:
        raise ValueError(name + ' needs 2..32 columns.')
    n = len(a[0])
    if any(not isinstance(row, list) or len(row) != n for row in a):
        raise ValueError(name + ' must be rectangular.')
    if any(not isinstance(x, (int, float)) or isinstance(x, bool)
           or not math.isfinite(x) or abs(x) > 1e6 for row in a for x in row):
        raise ValueError(name + ' needs finite real entries with |x| <= 1e6.')
    return [[float(x) for x in row] for row in a]


def transpose(a):
    return [list(column) for column in zip(*a)]


def multiply(a, b):
    if len(a[0]) != len(b):
        raise ValueError('Matrix product dimensions must match.')
    columns = transpose(b)
    return [[sum(x * y for x, y in zip(row, column))
             for column in columns] for row in a]


def difference(a, b):
    return [[x - y for x, y in zip(left, right)]
            for left, right in zip(a, b)]


def squared_frobenius(a):
    return sum(x * x for row in a for x in row)


def orthogonal_pair(y, owner):
    """Use the exact earlier implicit-Q mechanism, keeping two real directions."""
    r, reflectors = owner.householder_qr(y)
    norm = math.sqrt(squared_frobenius(y))
    threshold = sys.float_info.epsilon * max(len(y), 2) * norm
    if norm == 0 or any(abs(r[j][j]) <= threshold for j in range(2)):
        raise ValueError('This two-probe QR branch needs independent columns.')
    # Q's first columns are Q e0 and Q e1: reverse the earlier reflectors.
    return transpose([owner.apply_reflectors(
        reflectors, [float(i == j) for i in range(len(y))], transpose=False)
        for j in range(2)])


def range_svd_two_probe(a, omega, owner, k=1, q=0):
    a = checked_matrix(a, 'A')
    omega = checked_matrix(omega, 'Omega')
    if len(omega) != len(a[0]) or len(omega[0]) != 2:
        raise ValueError('Omega must have n rows and exactly two columns.')
    if isinstance(k, bool) or not isinstance(k, int) or k not in (1, 2):
        raise ValueError('k must be integer 1 or 2.')
    if isinstance(q, bool) or not isinstance(q, int) or not 0 <= q <= 3:
        raise ValueError('q must be integer 0..3.')
    basis = orthogonal_pair(multiply(a, omega), owner)
    for _ in range(q):
        dual_basis = orthogonal_pair(multiply(transpose(a), basis), owner)
        basis = orthogonal_pair(multiply(a, dual_basis), owner)
    core = multiply(transpose(basis), a)  # two rows, original n columns
    # Earlier owner accepts two columns, so factor core.T = V s W.T.
    # Transposing gives core = W s V.T, then lift U = Q W.
    right, singular, small_left, rotations = owner.two_column_svd(transpose(core))
    lifted = multiply(basis, small_left)
    approximation = [[sum(lifted[i][j] * singular[j] * right[t][j]
                          for j in range(k)) for t in range(len(a[0]))]
                     for i in range(len(a))]
    core_k = [[sum(small_left[i][j] * singular[j] * right[t][j]
                   for j in range(k)) for t in range(len(a[0]))] for i in range(2)]
    projected = multiply(basis, core)
    return {
        'Q': basis, 'B': core, 's': singular, 'U': lifted, 'V': right,
        'approximation': approximation, 'rotations': rotations,
        'range_squared': squared_frobenius(difference(a, projected)),
        'truncation_squared': squared_frobenius(difference(core, core_k)),
        'final_squared': squared_frobenius(difference(a, approximation)),
        'passes': 2 * q + 2,
    }


def load_owner(path):
    spec = importlib.util.spec_from_file_location('earlier_matrix_owner', path)
    if spec is None or spec.loader is None:
        raise ValueError('Supply the downloaded earlier Matrix programme path.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--factor-program', required=True)
    args = parser.parse_args()
    owner = load_owner(args.factor_program)
    a = [[4, 0, 0], [0, 2, 0], [0, 0, 1], [1, 1, 0]]
    rng = random.Random(7)
    omega = [[rng.gauss(0, 1) for _ in range(2)] for _ in range(3)]
    print('A shape / probe shape / retained k:', [4, 3], [3, 2], 1)
    print('fixed pseudo-Gaussian probe:', [[round(x, 6) for x in row] for row in omega])
    for q in (0, 1):
        result = range_svd_two_probe(a, omega, owner, k=1, q=q)
        print('q / compressed singular values:', q, [round(x, 9) for x in result['s']])
        print('range / truncation / final squared:',
              *[round(result[name], 9) for name in
                ('range_squared', 'truncation_squared', 'final_squared')])
        print('orthogonal loss difference / matrix passes:',
              round(result['final_squared'] - result['range_squared']
                    - result['truncation_squared'], 12), result['passes'])


if __name__ == '__main__':
    main()
