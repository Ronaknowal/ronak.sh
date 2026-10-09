"""Inspect QUADPACK diagnostics without confusing them with Simpson's rule."""
import math
from scipy.integrate import quad


def describe(label, f, exact, **options):
    result = quad(f, 0., 1., epsabs=1e-8, epsrel=1e-8, full_output=1, **options)
    estimate, error, info = result[:3]
    print(label)
    print(f"  estimate={estimate:.12f} estimated error={error:.3e} actual model error={abs(estimate-exact):.3e}")
    print(f"  evaluations={info['neval']} active intervals={info['last']} tuple length={len(result)}")
    print("  message:", result[3] if len(result) > 3 else "no appended diagnostic")


def main():
    peak = lambda x: 1/(1+400*(x-.35)**2)
    exact = (math.atan(13)+math.atan(7))/20
    describe("resolved peak", peak, exact)
    describe("same peak; one subinterval permitted", peak, exact, limit=1)
    # x=u^2: x^(-1/2) dx = 2 du for u>0; define the limiting value at u=0.
    describe("transformed endpoint integrand", lambda u: 2., 2.)


if __name__ == "__main__":
    main()
