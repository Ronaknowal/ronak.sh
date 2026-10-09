"""Finite-law Bayes error and Fano, with the same law in both implementations."""
import math
import numpy as np


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def fano(joint):
    # Rows are observed Z; columns are labels Y. Ties choose the first label.
    if not joint or len(joint[0]) < 2:
        raise ValueError('at least one Z and two possible Y labels required')
    k = len(joint[0])
    if any(len(row) != k for row in joint):
        raise ValueError('rectangular joint required')
    if any(not math.isfinite(p) or p < 0 for row in joint for p in row):
        raise ValueError('finite nonnegative masses required')
    if not math.isclose(sum(map(sum, joint)), 1, abs_tol=1e-12, rel_tol=0):
        raise ValueError('joint must sum to one')
    decisions, error, conditional = [], 0., 0.
    for row in joint:
        mass = sum(row)
        if mass == 0:
            decisions.append(None)  # No conditional law at this zero-mass observation.
            continue
        selected = max(range(k), key=lambda y: row[y])
        decisions.append(selected)
        error += mass - row[selected]
        conditional += mass * entropy([p / mass for p in row])
    upper = entropy([error, 1-error]) + error * math.log2(k-1)
    return decisions, error, conditional, upper


def numpy_fano(joint):
    joint = np.asarray(joint, dtype=np.float64)
    masses = joint.sum(axis=1)
    active = joint[masses > 0]
    conditional = active / masses[masses > 0, None]
    log_conditional = np.zeros_like(conditional)
    np.log2(conditional, out=log_conditional, where=conditional > 0)
    h = -float((active * log_conditional).sum())
    error = float((active.sum(axis=1)-active.max(axis=1)).sum())
    return error, h, entropy([error, 1-error])+error*math.log2(joint.shape[1]-1)


def main():
    for name, joint in [
        ('binary', [[.4, .1], [.1, .4]]),
        ('three-class', [[.30, .10, .10], [.05, .25, .20]]),
        ('perfect-with-empty-row', [[.5, 0], [0, .5], [0, 0]]),
        ('tie', [[.25, .25], [.25, .25]]),
    ]:
        decisions, error, h, upper = fano(joint)
        actual = numpy_fano(joint)
        assert np.allclose([error, h, upper], actual, atol=1e-12, rtol=0)
        assert h <= upper + 1e-12
        print(name, 'decisions', decisions)
        print('Pe / H(Y|Z) / Fano upper bits', *[f'{v:.9f}' for v in [error, h, upper]])


if __name__ == '__main__':
    main()
