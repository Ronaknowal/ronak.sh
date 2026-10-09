"""Check the grid against quadrature and a positive finite beta mixture.

Requires SciPy. The reporter has P(report=1|truth=1)=.9 and
P(report=1|truth=0)=.1, so q(theta)=.1+.8*theta. Eight reported
successes/two failures with a Beta(2,2) prior are synthetic. The posterior
is a mixture, not a single conjugate Beta. Fraction evidence is exact for
these rational inputs; SciPy tails and quad are numerical approximations.
"""
from fractions import Fraction
from math import comb, exp, factorial, fsum, log, log1p
from scipy.integrate import quad
from scipy.stats import beta


def beta_integral(a, b):
    return Fraction(factorial(a-1)*factorial(b-1), factorial(a+b-1))


def mixture_components(successes, failures, sensitivity=Fraction(9, 10), false_positive=Fraction(1, 10)):
    normalizer = beta_integral(2, 2)
    masses = {}
    for j in range(successes+1):
        for k in range(failures+1):
            coefficient = (comb(successes, j)*sensitivity**j
                           * false_positive**(successes-j)
                           * comb(failures, k)*(1-sensitivity)**k
                           * (1-false_positive)**(failures-k))
            shapes = (2+j+k, 2+successes+failures-j-k)
            masses[shapes] = masses.get(shapes, Fraction(0)) + coefficient*beta_integral(*shapes)/normalizer
    evidence = sum(masses.values(), Fraction(0))
    if evidence <= 0:
        raise ValueError('reported observations have zero model probability')
    return evidence, [(shapes, mass/evidence) for shapes, mass in sorted(masses.items()) if mass > 0]


def grid(cells, successes=8, failures=2, sensitivity=.9, false_positive=.1):
    width = 1/cells
    points = [(i+.5)*width for i in range(cells)]
    reported = [false_positive+(sensitivity-false_positive)*x for x in points]
    def term(count, p):
        return 0 if count == 0 else -float('inf') if p == 0 else count*log(p)
    logs = [log(6)+log(x)+log1p(-x)+term(successes, q)+term(failures, 1-q)
            for x, q in zip(points, reported)]
    peak = max(logs)
    if peak == -float('inf'):
        raise ValueError('reported observations have zero model probability')
    scaled = [exp(value-peak) for value in logs]
    total = fsum(scaled)
    mean = fsum(x*w for x, w in zip(points, scaled))/total
    tail = fsum(w for x, w in zip(points, scaled) if x>.7)/total
    return mean, tail, exp(peak)*total*width


if __name__ == '__main__':
    evidence, components = mixture_components(8, 2)
    mean = sum(Fraction(a, a+b)*w for (a, b), w in components)
    tail = fsum(float(w)*beta.sf(.7, a, b) for (a, b), w in components)
    kernel = lambda x: beta.pdf(x, 2, 2)*(.1+.8*x)**8*(.9-.8*x)**2
    reference, error = quad(kernel, 0, 1, epsabs=1e-13, epsrel=1e-12)
    reference_tail = quad(kernel, .7, 1, epsabs=1e-13, epsrel=1e-12)[0]/reference
    assert abs(reference-float(evidence)) < 1e-13 and abs(reference_tail-tail) < 1e-12
    print(f'positive beta components={len(components)} exact evidence={evidence}')
    print(f'mixture mean={float(mean):.10f} P(theta>.7)={tail:.10f} evidence={float(evidence):.10f}')
    print(f'quad evidence={reference:.10f} error estimate={error:.3e}')
    for cells in [100, 1000, 10000]:
        estimate = grid(cells)
        print(f'cells={cells} mean={estimate[0]:.10f} tail={estimate[1]:.10f} evidence={estimate[2]:.10f}')
