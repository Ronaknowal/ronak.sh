"""Exact ordinary-tool algebra; Python 3.12+, SymPy 1.14.

Run: python symbolic_algebra.py
Only fixed expressions are constructed: no user text is evaluated.
"""
import math
from sympy import FiniteSet, S, cancel, expand, factor, solveset, sqrt, symbols


def real_roots(expression, variable, excluded=()):
    """Solve expression = 0 in the reals, then retain original exclusions.

    The result is a mathematical set, not necessarily an iterable finite list.
    Exclusions must come from the original problem before simplification.
    """
    domain = S.Reals - FiniteSet(*excluded)
    return solveset(expression, variable, domain=domain)


def checked_real_roots(expression, variable, roots):
    """Substitute the finite answers used in this lesson's fixtures."""
    if not isinstance(roots, FiniteSet):
        raise ValueError("This substitution check requires finite answers.")
    for root in roots:
        assert expression.subs(variable, root).simplify() == 0
    return roots


if __name__ == "__main__":
    x = symbols("x")
    polynomial = x**2 - 6*x + 5
    print("factored:", factor(polynomial))
    print("vertex identity:", expand((x-3)**2-4-polynomial) == 0)
    roots = real_roots(polynomial, x)
    print("real roots:", checked_real_roots(polynomial, x, roots))

    # Cancel only after saving the original denominator restriction x != 1.
    numerator, denominator = x**2-1, x-1
    excluded = solveset(denominator, x, domain=S.Reals)
    simplified = cancel(numerator/denominator)
    print("simplified:", simplified, "; excluded:", excluded)
    print("filled formula equals 2:", real_roots(simplified-2, x))
    print("original equals 2:", real_roots(simplified-2, x, excluded))

    original = sqrt(x+2)-x
    candidates = real_roots(x**2-x-2, x)
    accepted = real_roots(original, x)
    print("squared candidates:", candidates)
    print("original root:", checked_real_roots(original, x, accepted))
    print("no real roots:", real_roots(x**2+1, x))

    changed = x**2+4*x-5
    print("changed roots:", checked_real_roots(changed, x, real_roots(changed, x)))
    print("all answers:", real_roots(S.Zero, x))
    print("no answers:", real_roots(S.One, x))
    print("tiny log increment:", format(math.log1p(1e-16), ".8e"))
    print("tiny exp increment:", format(math.expm1(1e-16), ".8e"))
