"""Matched SciPy tails and sampling laws on the offline measured Iris frame.

Python 3.12+, SciPy. Keep iris.data next to this file; reuse unchanged data
from /learn-assets/maximum-likelihood-map-estimation/iris.data.
Fisher (1936), UCI DOI10.24432/C56C76, CC BY4.0. Species composition is
known for these 150 rows; it is not a claim about prevalence in nature.
"""
from csv import reader
from fractions import Fraction
from hashlib import sha256
from math import comb, exp
from pathlib import Path
from scipy.stats import binom, hypergeom
from concentration_scratch import binomial_log_tail, upper_bound_logs


if __name__ == '__main__':
    n, p, threshold = 1000, .02, 30
    scratch = binomial_log_tail(n, p, threshold)
    maintained = float(binom.logsf(threshold - 1, n, p))
    print('scratch/SciPy log tails:', f'{scratch:.8f}', f'{maintained:.8f}')
    print('inclusive sf(k-1):', f'{binom.sf(threshold - 1, n, p):.8f}',
          'strict sf(k):', f'{binom.sf(threshold, n, p):.8f}')
    data = Path(__file__).with_name('iris.data').read_bytes()
    assert sha256(data).hexdigest() == '6f608b71a7317216319b4d27b4d9bc84e6abd734eda7872b71a458569e2656c0'
    rows = [row for row in reader(data.decode().splitlines()) if row]
    population = len(rows)
    marked = sum(row[4] == 'Iris-setosa' for row in rows)
    draws, threshold = 30, 15
    denominator = comb(population, draws)
    exact_subset = sum((Fraction(comb(marked, k) * comb(population - marked, draws - k), denominator)
                        for k in range(threshold, draws + 1)), Fraction(0))
    subset = float(hypergeom.sf(threshold - 1, population, marked, draws))
    independent = float(binom.sf(threshold - 1, draws, marked / population))
    print('known frame/marked/draws/threshold:', population, marked, draws, threshold)
    print('subset scratch/SciPy:', f'{float(exact_subset):.8f}', f'{subset:.8f}')
    print('with-replacement tail:', f'{independent:.8f}')
    print('Hoeffding/Bernstein/Bennett/KL envelopes:',
          *[f'{exp(v):.8f}' for v in upper_bound_logs(draws, marked / population, threshold).values()])
    print('count variances iid/subset:', f'{binom.var(draws, marked / population):.8f}',
          f'{hypergeom.var(population, marked, draws):.8f}')
    print('complete-frame subset variance:', f'{hypergeom.var(population, marked, population):.8f}')
