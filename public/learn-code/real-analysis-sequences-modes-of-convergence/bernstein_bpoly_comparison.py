"""Compare the same Bernstein polynomial using scratch weights and SciPy BPoly.

One segment [0, 1], degree 1..100, corner 0..1, finite nonnegative slope.
Scientific checks in main use degrees 4/16/64/100 and complete positive weights.
"""
from fractions import Fraction
from math import comb, isfinite, sqrt

import numpy as np
import scipy
from scipy.interpolate import BPoly


def validate(n, corner, slope):
    if type(n) is not int or not 1 <= n <= 100:
        raise ValueError('Use an integer degree in 1..100')
    if isinstance(corner, bool) or isinstance(slope, bool):
        raise ValueError('Corner and slope must be numeric, not boolean')
    corner, slope = float(corner), float(slope)
    if not isfinite(corner) or not 0 <= corner <= 1:
        raise ValueError('Use a finite corner in [0, 1]')
    if not isfinite(slope) or not 0 <= slope <= 100:
        raise ValueError('Use a finite slope in [0, 100]')
    return corner, slope


def weights(n, x):
    if type(n) is not int or not 1 <= n <= 100:
        raise ValueError('Use an integer degree in 1..100')
    if isinstance(x, bool) or not isfinite(float(x)) or not 0 <= x <= 1:
        raise ValueError('Evaluate within [0, 1]')
    if x == 0:
        return [1.0] + [0.0] * n
    if x == 1:
        return [0.0] * n + [1.0]
    return [comb(n, k) * x**k * (1 - x)**(n - k) for k in range(n + 1)]


def construct(n, corner, slope=1):
    corner, slope = validate(n, corner, slope)
    nodes = np.arange(n + 1, dtype=float) / n
    coefficients = slope * np.abs(nodes - corner)
    # BPoly expects (degree+1, number_of_intervals), not sampled value pairs.
    polynomial = BPoly(coefficients[:, None], [0.0, 1.0], extrapolate=False)
    return nodes, coefficients, polynomial


def exact_area(n, corner, slope=1):
    validate(n, corner, slope)
    corner, slope = Fraction(corner), Fraction(slope)
    coefficients = [slope * abs(Fraction(k, n) - corner) for k in range(n + 1)]
    return sum(coefficients) / (n + 1), slope * (corner**2 + (1 - corner)**2) / 2


def main():
    tolerance = 2e-12
    cases = 0
    max_value_error = max_area_error = 0.0
    for n in [4, 16, 64, 100]:
        for corner in [Fraction(3, 10), Fraction(1, 2), Fraction(7, 10)]:
            nodes, coefficients, polynomial = construct(n, corner)
            area, target_area = exact_area(n, corner)
            error = abs(float(polynomial.integrate(0, 1)) - float(area))
            max_area_error = max(max_area_error, error)
            assert error <= tolerance
            _, _, reflected = construct(n, 1 - corner)
            for x in [0, .25, .4, .5, .75, 1]:
                mass = weights(n, x)
                scratch = sum(p * value for p, value in zip(mass, coefficients))
                tool = float(polynomial(x))
                error = abs(scratch - tool)
                max_value_error = max(max_value_error, error)
                assert error <= tolerance
                assert abs(sum(mass) - 1) <= tolerance
                mean = sum(p * node for p, node in zip(mass, nodes))
                spread = sum(p * (node - x)**2 for p, node in zip(mass, nodes))
                assert abs(mean - x) <= tolerance
                assert abs(spread - x * (1 - x) / n) <= tolerance
                assert abs(tool - float(reflected(1 - x))) <= tolerance
                assert abs(tool - abs(x - float(corner))) <= 1 / (2 * sqrt(n)) + tolerance
                if x in (0, 1):
                    assert abs(tool - abs(x - float(corner))) <= tolerance
                cases += 1
            assert np.isnan(polynomial(-.01)) and np.isnan(polynomial(1.01))
    n, corner, x = 16, Fraction(3, 10), Fraction(1, 4)
    exact_weights = [Fraction(comb(n, k)) * x**k * (1 - x)**(n-k) for k in range(n+1)]
    exact_value = sum(p * abs(Fraction(k, n) - corner) for k, p in enumerate(exact_weights))
    _, _, polynomial = construct(n, corner)
    area, target_area = exact_area(n, corner)
    print('versions:', np.__version__, scipy.__version__)
    print('value cases:', cases, 'tolerance:', tolerance)
    print('maximum scratch/tool value difference:', f'{max_value_error:.3e}')
    print('maximum exact/tool area difference:', f'{max_area_error:.3e}')
    print('n=16, corner=3/10, interior node x=1/4:')
    print('  target:', abs(x - corner), 'polynomial exact:', exact_value)
    print('  polynomial decimal:', f'{float(polynomial(float(x))):.12f}')
    print('  exact polynomial area:', area, 'target area:', target_area)
    print('  sufficient uniform bound:', f'{1 / (2 * sqrt(n)):.6f}')
    print('  outside interval:', float(polynomial(-.01)), float(polynomial(1.01)))
    _, _, changed = construct(100, Fraction(2, 5), 2)
    area, target_area = exact_area(100, Fraction(2, 5), 2)
    print('changed n=100, corner=2/5, slope=2:', area, target_area, abs(area-target_area))
    print('  tool area:', f'{float(changed.integrate(0, 1)):.12f}')


if __name__ == '__main__':
    main()
