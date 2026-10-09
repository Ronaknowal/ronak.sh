"""Small transparent root iterations, then ordinary SciPy routes."""
import argparse
import math
from scipy.optimize import brentq, newton


def value(f, x):
    y = float(f(x))
    if not math.isfinite(y):
        raise ValueError("Function evaluations must be finite")
    return y


def tangent_trace(f, df, start, *, bracket=None, tolerance=1e-10, limit=12):
    """A step-small status is a diagnostic, never a root certificate."""
    if not math.isfinite(start) or not math.isfinite(tolerance) or tolerance <= 0:
        raise ValueError("Use a finite start and positive finite tolerance")
    if not isinstance(limit, int) or limit < 1:
        raise ValueError("Use a positive integer work limit")
    x, rows = float(start), []
    if bracket is not None:
        a, b = map(float, bracket)
        if not (math.isfinite(a) and math.isfinite(b) and a < b and a <= x <= b):
            raise ValueError("Start must lie in a finite increasing bracket")
        fa, fb = value(f, a), value(f, b)
        if fa == 0 or fb == 0:
            return (a if fa == 0 else b), "endpoint zero", rows
        if (fa > 0) == (fb > 0):
            raise ValueError("Opposite endpoint signs required")
    for _ in range(limit):
        fx, slope = value(f, x), value(df, x)
        if fx == 0:
            return x, "evaluated zero", rows
        if slope == 0 and bracket is None:
            return x, "zero derivative", rows
        proposal = x - fx / slope if slope != 0 else math.nan
        accepted, method = proposal, "tangent"
        if bracket is not None:
            width = b - a
            if not (math.isfinite(proposal) and a + .1 * width <= proposal <= b - .1 * width):
                accepted, method = a + width / 2, "bisect"
        elif not math.isfinite(proposal):
            return x, "nonfinite proposal", rows
        if accepted == x:
            return x, "coordinate stagnation", rows
        fy = value(f, accepted)
        rows.append((x, fx, proposal, accepted, fy, method))
        if bracket is not None:
            if fy == 0:
                return accepted, "evaluated zero", rows
            if (fa > 0) == (fy > 0):
                a, fa = accepted, fy
            else:
                b, fb = accepted, fy
            if (b - a) / 2 <= tolerance:
                return a + (b - a) / 2, "conditional bracket radius", rows
        elif abs(accepted - x) <= tolerance:
            return accepted, "step small; inspect residual", rows
        x = accepted
    return x, "work limit", rows


def secant_trace(f, x0, x1, *, tolerance=1e-10, limit=12):
    if not all(math.isfinite(x) for x in (x0, x1, tolerance)) or tolerance <= 0:
        raise ValueError("Use finite inputs and positive tolerance")
    if x0 == x1 or not isinstance(limit, int) or limit < 1:
        raise ValueError("Use distinct starts and a positive integer limit")
    f0, f1, rows = value(f, x0), value(f, x1), []
    for _ in range(limit):
        if f0 == 0 or f1 == 0:
            return (x0 if f0 == 0 else x1), "evaluated zero", rows
        if f1 == f0:
            return x1, "equal function values", rows
        proposal = x1 - f1 * (x1 - x0) / (f1 - f0)
        if not math.isfinite(proposal):
            return x1, "nonfinite proposal", rows
        if proposal == x1:
            return x1, "coordinate stagnation", rows
        fp = value(f, proposal)
        rows.append((x0, x1, proposal, fp))
        if abs(proposal - x1) <= tolerance:
            return proposal, "step small; inspect residual", rows
        x0, f0, x1, f1 = x1, f1, proposal, fp
    return x1, "work limit", rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--step-stop", action="store_true")
    args = parser.parse_args()
    if args.step_stop:
        f = lambda x: math.exp(1000 * x)
        root, result = newton(f, 0., fprime=lambda x: 1000 * f(x),
                              tol=.01, maxiter=5, full_output=True, disp=False)
        print(f"exp: x={root:.9f} residual={f(root):.9f} converged={result.converged}")
        print(f"flag={result.flag}; iterations={result.iterations}")
        print(f"scaled linear: residual at 0={1e-12 * (0 - 1):.1e}; location error=1")
        return
    f, df = lambda x: x**3 - 2*x + 2, lambda x: 3*x*x - 2
    for label, bracket in [("plain", None), ("safeguarded", (-2., 0.))]:
        x, status, rows = tangent_trace(f, df, 0., bracket=bracket, limit=5)
        print(label, status)
        for old, fx, proposed, accepted, fy, method in rows:
            print(f"  x={old:.6f} proposed={proposed:.6f} visited={accepted:.6f} f={fy:.6f} {method}")
    for c, start in [(2., 1.5), (3., 2.), (2., 0.)]:
        f, df = lambda x: x*x-c, lambda x: 2*x
        x, status, rows = tangent_trace(f, df, start)
        print(f"scratch c={c:g} start={start:g}: x={x:.9f} residual={f(x):.2e}; {status}")
        root, result = brentq(f, 0., 2., xtol=1e-12, rtol=1e-12,
                              maxiter=100, full_output=True, disp=False)
        print(f"brentq x={root:.9f} flag={result.flag} calls={result.function_calls}")
        if start != 0:
            root, result = newton(f, start, fprime=df, tol=1e-12,
                                  maxiter=30, full_output=True, disp=False)
            print(f"newton x={root:.9f} flag={result.flag} iterations={result.iterations}")
    x, status, rows = tangent_trace(lambda x: (x-1)**2, lambda x: 2*(x-1), 5., limit=3)
    print("repeated root visits:", [round(row[3], 6) for row in rows], status)
    x, status, rows = secant_trace(lambda x: x*x-2, 1., 2.)
    print(f"secant first={rows[0][2]:.9f} final={x:.9f} residual={x*x-2:.2e}; {status}")


if __name__ == "__main__":
    main()
