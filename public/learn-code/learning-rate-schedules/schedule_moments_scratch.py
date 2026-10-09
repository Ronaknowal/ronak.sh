"""Build finite rates and expose exact scalar bias/noise contributions.

Pure Python 3.12; no optimizer or scientific library is hidden here.
Inputs: T a built-in integer 2..10000, W integer 0..T-1, update integer0..T-1,
finite 0 <= minimum <= peak <= 2 with peak > 0. Only cosine supports warmup.
Use positive finite curvature h and nonnegative finite independent noise sigma.
Each supplied rate is deterministic and the error follows e'=(1-h*eta)e-eta*xi,
with fresh independent mean-zero xi of variance sigma^2. Metric-adaptive rates
correlated with the errors do not satisfy this unconditional recurrence.
Cost: O(T) rates and moment trace; O(T) reverse suffix contributions.
The optional 16-atom enumeration below is intentionally only four updates.
"""
from itertools import product
from math import cos, isfinite, pi


def integer(value, name, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f'{name} must be a built-in integer in [{low},{high}]')


def real(value, name):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not isfinite(value):
        raise ValueError(f'{name} must be a finite real number')


def finite_rate(update, total, peak=.2, minimum=.01, kind='cosine', warmup=0):
    """Include both endpoints; W>0 reaches its peak once at update W-1."""
    integer(total, 'total', 2, 10000)
    integer(update, 'update', 0, total-1)
    integer(warmup, 'warmup', 0, total-1)
    real(peak, 'peak')
    real(minimum, 'minimum')
    if not 0 <= minimum <= peak <= 2 or peak == 0:
        raise ValueError('require 0 <= minimum <= peak <= 2 and positive peak')
    if kind not in ('constant', 'linear', 'cosine', 'exponential'):
        raise ValueError('kind must be constant, linear, cosine or exponential')
    if warmup and kind != 'cosine':
        raise ValueError('this finite convention applies warmup only to cosine')
    if kind == 'exponential' and minimum == 0:
        raise ValueError('an exponential finite ratio needs a positive minimum')
    if warmup and update < warmup:
        return peak*(update+1)/warmup
    progress = (update-warmup+1)/(total-warmup) if warmup else update/(total-1)
    if kind == 'constant':
        return peak
    if kind == 'linear':
        return peak+(minimum-peak)*progress
    if kind == 'exponential':
        return peak*(minimum/peak)**progress
    return minimum+.5*(peak-minimum)*(1+cos(pi*progress))


def error_moments(rates, curvature=1., sigma=.5, initial_error=1.):
    """Return T+1 moments plus contributions of each fresh noise to final variance."""
    for value, name in ((curvature, 'curvature'), (sigma, 'sigma'), (initial_error, 'initial_error')):
        real(value, name)
    if curvature <= 0 or sigma < 0:
        raise ValueError('curvature must be positive and sigma nonnegative')
    rates = list(rates)
    if not rates or len(rates) > 10000:
        raise ValueError('rates must have 1..10000 entries')
    for eta in rates:
        real(eta, 'rate')
        if eta < 0 or eta > 2:
            raise ValueError('rates must lie in [0,2]')
    mean, variance = float(initial_error), 0.
    rows = [(mean, variance, mean*mean+variance)]
    multipliers = []
    for eta in rates:
        multiplier = 1-curvature*eta
        mean *= multiplier
        variance = multiplier*multiplier*variance + eta*eta*sigma*sigma
        if not all(isfinite(v) for v in (mean, variance, mean*mean+variance)):
            raise ValueError('this rate/curvature trace exceeded finite arithmetic')
        rows.append((mean, variance, mean*mean+variance))
        multipliers.append(multiplier)
    contributions = [0.]*len(rates)
    future_square_product = 1.
    for update in range(len(rates)-1, -1, -1):
        contributions[update] = rates[update]**2*sigma**2*future_square_product
        future_square_product *= multipliers[update]**2
        if not isfinite(future_square_product):
            raise ValueError('the suffix products exceeded finite arithmetic')
    return rows, contributions


def infinite_rate_series(total, exponent, scale=.2):
    """Finite partial sums diagnose, but never prove an infinite series condition."""
    integer(total, 'total', 1, 10000)
    real(exponent, 'exponent')
    real(scale, 'scale')
    if not 0 < exponent <= 2 or not 0 < scale <= 2:
        raise ValueError('require exponent in (0,2] and scale in (0,2]')
    rates = [scale/(update+1)**exponent for update in range(total)]
    return sum(rates), sum(eta*eta for eta in rates)


def main():
    for warmup in (0, 1, 3, 7):
        rates = [finite_rate(u, 8, warmup=warmup) for u in range(8)]
        print('W', warmup, 'rates', [round(eta, 6) for eta in rates])
    rates = [.2, .15, .1, .05]
    moments, contributions = error_moments(rates)
    atoms = []
    for signs in product((-1., 1.), repeat=4):
        error = 1.
        for eta, sign in zip(rates, signs, strict=True):
            error = (1-eta)*error-eta*.5*sign
        atoms.append(error)
    atom_mean = sum(atoms)/len(atoms)
    atom_variance = sum((x-atom_mean)**2 for x in atoms)/len(atoms)
    assert abs(atom_mean-moments[-1][0]) < 1e-14
    assert abs(atom_variance-moments[-1][1]) < 1e-14
    assert abs(sum(contributions)-atom_variance) < 1e-14
    print('sixteen equally weighted final errors', [round(x, 6) for x in atoms])
    print('final mean variance second moment', [round(x, 8) for x in moments[-1]])
    print('fresh noise final variance contributions', [round(x, 8) for x in contributions])
    for exponent in (.5, .75, 1., 1.25):
        sums = infinite_rate_series(10000, exponent)
        print('exponent', exponent, 'partial sums', [round(x, 6) for x in sums])


if __name__ == '__main__':
    main()
