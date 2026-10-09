"""Inspect all recorded Wine features against a finite column-permutation reference.

Save the official wine-data.csv beside this file, or pass --csv PATH.
Requires NumPy. No network, classifier or fitted cultivar labels are used.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np

CSV_SHA256 = '70ba539f750faef04eb4859f68cf67f13676d42fafce8e4f85982705953c219a'


def load_wine(path):
    raw = Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != CSV_SHA256:
        raise ValueError('Use the exact documented official 178-row Wine CSV.')
    rows = list(csv.reader(raw.decode('utf-8-sig').splitlines()))
    names = rows[0][:-1]
    if len(names) != 13 or rows[0][-1] != 'class' or len(rows) != 179:
        raise ValueError('Expected thirteen features and one class column.')
    if any(len(row) != 14 for row in rows[1:]):
        raise ValueError('Every record needs all fourteen fields.')
    x = np.array([[float(cell) for cell in row[:-1]] for row in rows[1:]])
    classes = np.array([int(row[-1]) for row in rows[1:]])
    if not np.isfinite(x).all() or not np.isin(classes, [1, 2, 3]).all():
        raise ValueError('Expected finite features and documented class metadata.')
    return x, names, classes


def correlation_state(x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or not 2 <= x.shape[0] <= 10000 or not 1 <= x.shape[1] <= 64:
        raise ValueError('Expected a bounded observation-by-feature matrix.')
    if not np.isfinite(x).all() or np.max(np.abs(x)) > 1e6:
        raise ValueError('Feature entries must be finite and at most 1e6 in magnitude.')
    mean = x.mean(axis=0)
    centered = x - mean
    sample_sd = np.sqrt(np.sum(centered * centered, axis=0) / (len(x) - 1))
    if np.any(sample_sd <= 1e-12):
        raise ValueError('Constant or near-constant features cannot be standardized.')
    z = centered / sample_sd
    correlation = z.T @ z / (len(x) - 1)
    values, vectors = np.linalg.eigh(correlation)
    residual = np.linalg.norm(correlation @ vectors - vectors * values, ord='fro')
    if not np.isfinite(values).all() or residual > 1e-9:
        raise ArithmeticError('The computed symmetric basis failed its residual check.')
    return {'mean': mean, 'sample_sd': sample_sd, 'standardized': z,
            'correlation': correlation, 'values': values, 'vectors': vectors,
            'residual': float(residual)}


def diagnostic(x, permutations=59, seed=2026):
    if isinstance(permutations, bool) or not isinstance(permutations, int) or not 1 <= permutations <= 199:
        raise ValueError('Use an integer number of permutations between 1 and 199.')
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= 2**32 - 1:
        raise ValueError('Use an integer seed in [0, 2**32-1].')
    state = correlation_state(x)
    z = state['standardized']
    rng = np.random.default_rng(seed)
    maxima = []
    first = None
    for _ in range(permutations):
        # axis=0 independently shuffles each feature's observation order.
        shuffled = rng.permuted(z, axis=0)
        matrix = shuffled.T @ shuffled / (len(z) - 1)
        values = np.linalg.eigvalsh(matrix)
        if not np.allclose(np.diag(matrix), 1, atol=1e-12):
            raise ArithmeticError('Permutation changed a feature variance.')
        maxima.append(float(values[-1]))
        if first is None:
            first = {'standardized': shuffled, 'correlation': matrix, 'values': values}
    observed = float(state['values'][-1])
    exceedances = sum(value >= observed for value in maxima)
    gamma = z.shape[1] / (len(z) - 1)
    return {'observed': state, 'first_permutation': first, 'maxima': maxima,
            'exceedances': exceedances, 'rank_fraction': (1 + exceedances) / (1 + permutations),
            'gamma': gamma, 'mp_edges': [(1 - np.sqrt(gamma))**2, (1 + np.sqrt(gamma))**2]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv', type=Path, default=Path(__file__).with_name('wine-data.csv'))
    parser.add_argument('--permutations', type=int, default=59)
    parser.add_argument('--seed', type=int, default=2026)
    args = parser.parse_args()
    x, names, classes = load_wine(args.csv)
    result = diagnostic(x, args.permutations, args.seed)
    state = result['observed']
    report = {
        'records': len(x), 'features': len(names), 'sample_denominator': len(x) - 1,
        'class_metadata_counts': {str(k): int(np.sum(classes == k)) for k in [1, 2, 3]},
        'correlation_trace': round(float(np.trace(state['correlation'])), 9),
        'recorded_eigenvalues_descending': [round(float(v), 9) for v in state['values'][::-1]],
        'first_permutation_eigenvalues_descending': [round(float(v), 9) for v in result['first_permutation']['values'][::-1]],
        'permutations': args.permutations, 'seed': args.seed,
        'permuted_maximum_range': [round(min(result['maxima']), 9), round(max(result['maxima']), 9)],
        'exceedances': result['exceedances'], 'rank_fraction': round(result['rank_fraction'], 9),
        'mp_reference_gamma': round(result['gamma'], 9),
        'mp_reference_edges': [round(float(v), 9) for v in result['mp_edges']],
        'basis_residual': round(state['residual'], 12),
    }
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
