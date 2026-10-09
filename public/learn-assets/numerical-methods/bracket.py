import math


def bisect(f, lower, upper, tolerance=1e-3, limit=100):
    if not (
        math.isfinite(lower)
        and math.isfinite(upper)
        and lower < upper
        and math.isfinite(upper - lower)
    ):
        raise ValueError("Use a finite increasing interval")
    if not math.isfinite(tolerance) or tolerance <= 0 or limit < 0:
        raise ValueError("Invalid tolerance or work limit")
    fa, fb = f(lower), f(upper)
    if not (math.isfinite(fa) and math.isfinite(fb)):
        return None, 0, None, "nonfinite evaluation"
    if fa == 0 or fb == 0:
        return (lower if fa == 0 else upper), 0, 0.0, "endpoint root"
    if (fa < 0) == (fb < 0):
        return None, 0, None, "no opposite signs"
    for halves in range(limit + 1):
        midpoint = lower + (upper - lower) / 2
        radius = (upper - lower) / 2
        fm = f(midpoint)
        if not math.isfinite(fm):
            return midpoint, halves, radius, "nonfinite evaluation"
        if fm == 0:
            return midpoint, halves, radius, "computed zero"
        if radius <= tolerance:
            return midpoint, halves, radius, "bracket tolerance"
        if midpoint == lower or midpoint == upper:
            return midpoint, halves, radius, "arithmetic stagnation"
        if halves == limit:
            return midpoint, halves, radius, "step limit"
        if (fa < 0) != (fm < 0):
            upper = midpoint
        else:
            lower, fa = midpoint, fm


root, halves, radius, status = bisect(lambda x: x * x - 2, 0.0, 2.0)
print(status, halves, round(root, 6), round(radius, 6))
print(abs(root - math.sqrt(2)) <= radius)
print(bisect(lambda x: (x - 1) ** 2, 0.0, 2.0)[-1])