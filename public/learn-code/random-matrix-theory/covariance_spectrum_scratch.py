"""Form a covariance and inspect every mode using the earlier Jacobi owner.

Python standard library only. Pass --eigen symmetric_eigen_scratch.py,
downloaded from the Eigenvalues lesson, or keep it beside this file.
The imported owner returns (values, Q, rotations, trace), with Q columns.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path


def covariance(rows, centered=False):
    if not isinstance(centered, bool):
        raise ValueError('centered must be a boolean.')
    if not isinstance(rows, (list, tuple)) or not 2 <= len(rows) <= 192:
        raise ValueError('Use between two and192 observations.')
    if not isinstance(rows[0], (list, tuple)) or not 1 <= len(rows[0]) <= 64:
        raise ValueError('Use between one and64 features.')
    p = len(rows[0])
    if any(not isinstance(row, (list, tuple)) or len(row) != p for row in rows):
        raise ValueError('All observation rows must have the same width.')
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or abs(v) > 100 for row in rows for v in row):
        raise ValueError('Use finite real entries in[-100,100].')
    n = len(rows)
    means = [math.fsum(row[j] for row in rows) / n for j in range(p)]
    applied_mean = means if centered else [0.0] * p
    working = [[row[j]-applied_mean[j] for j in range(p)] for row in rows]
    denominator = n-1 if centered else n
    matrix = [[math.fsum(row[j]*row[k] for row in working)/denominator for k in range(p)] for j in range(p)]
    return working, matrix, denominator


def load_solver(path):
    spec = importlib.util.spec_from_file_location('earlier_symmetric_eigen', path)
    if spec is None or spec.loader is None:
        raise ValueError('Cannot load the earlier full Jacobi programme.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.symmetric_eigen


def spectrum(rows, solver, centered=False):
    working, matrix, denominator = covariance(rows, centered)
    values, q, rotations, trace = solver(matrix)
    p = len(matrix)
    residual = math.sqrt(math.fsum((math.fsum(matrix[i][j]*q[j][k] for j in range(p))-values[k]*q[i][k])**2 for i in range(p) for k in range(p)))
    scale = max(1.0, max(abs(v) for v in values))
    numerical_zero_count = sum(abs(v) <= 1e-9*scale for v in values)
    return {'rows':working, 'covariance':matrix, 'denominator':denominator,
            'values':values, 'vectorsInColumns':q, 'rotations':rotations,
            'residual':residual, 'numericalZeroCount':numerical_zero_count,
            'algebraicRankUpperBound':min(len(rows)-int(centered), p),
            'empiricalSecondMoment':math.fsum(v*v for v in values)/p,
            'traceMean':math.fsum(matrix[i][i] for i in range(p))/p}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--eigen', type=Path, default=Path(__file__).with_name('symmetric_eigen_scratch.py'))
    args = parser.parse_args()
    solver = load_solver(args.eigen)
    counted = [[1,1]]*3 + [[-1,-1]]*3 + [[1,-1],[-1,1]]
    shifted = [[x+4,y-2] for x,y in counted]
    wide = [[1,0,1,0],[-1,0,-1,0],[0,1,0,1]]
    report = {}
    for name, rows, center in [('countedSign',counted,False),('translatedUncentered',shifted,False),('translatedCentered',shifted,True),('wideCentered',wide,True)]:
        state = spectrum(rows,solver,center)
        report[name] = {key:value for key,value in state.items() if key not in ['rows','vectorsInColumns']}
        report[name]['residual'] = round(state['residual'],12)
        report[name]['values'] = [round(v,9) for v in state['values']]
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
