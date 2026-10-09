"""Two-sided fixed-time Maurer-Pontil bound: IID [0,1], n >= 2.

The sample variance uses denominator n-1; reflection allocates delta/2
to each one-sided theorem, so the logarithm is log(4/delta).
"""
from fractions import Fraction
from math import comb, log, sqrt
from statistics import variance


def empirical_radius(values, delta):
    n = len(values)
    if n < 2 or not 0 < delta < 1 or any(not 0 <= x <= 1 for x in values):
        raise ValueError('at least two unit-range observations and a failure budget required')
    level = log(4 / delta)
    return sqrt(2 * variance(values) * level / n) + 7 * level / (3 * (n - 1))


def bernoulli_radius(n, successes, delta):
    average = successes / n
    unbiased = n * average * (1 - average) / (n - 1)
    level = log(4 / delta)
    return sqrt(2 * unbiased * level / n) + 7 * level / (3 * (n - 1))


if __name__ == '__main__':
    p, delta = Fraction(1, 40), .05
    for n in [100, 1000]:
        failure = Fraction(0)
        for k in range(n + 1):
            if abs(k / n - float(p)) > bernoulli_radius(n, k, delta):
                failure += Fraction(comb(n, k)) * p**k * (1 - p)**(n - k)
        print('n:', n, 'all-zero radius:', f'{empirical_radius([0] * n, delta):.8f}',
              'exact finite-law failure:', f'{float(failure):.8f}')
    values = [0, 0, 1, 0]
    pairwise = sum((values[i] - values[j])**2 for i in range(4) for j in range(i + 1, 4)) / 12
    print('unbiased variance:', f'{variance(values):.8f}', 'pairwise variance:', f'{pairwise:.8f}')
