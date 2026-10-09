"""Finite samples and adaptive first/second derivative diagnostics."""
import argparse
import math
import numpy as np
from scipy.differentiate import derivative, hessian


STENCILS = {
    "forward": ([0, 1], [-1, 1], 1),
    "central": ([-1, 1], [-.5, .5], 1),
    "second": ([-1, 0, 1], [1, -2, 1], 2),
    "one-sided-order2": ([0, 1, 2], [-1.5, 2, -.5], 1),
}


def stencil(f, x, h, name):
    if not (math.isfinite(x) and math.isfinite(h) and h > 0):
        raise ValueError("Use finite x and positive finite h")
    offsets, weights, power = STENCILS[name]
    points = [x + k*h for k in offsets]
    if not all(math.isfinite(p) for p in points) or len(set(points)) != len(points):
        raise ValueError("Sample coordinates are nonfinite or coincide")
    values = [float(f(p)) for p in points]
    if not all(math.isfinite(v) for v in values):
        raise ValueError("Sample values must be finite")
    denominator = h if power == 1 else h*h
    if not math.isfinite(denominator) or denominator == 0:
        raise ValueError("Step power is not representable as a positive finite number")
    answer = math.fsum(w*y for w, y in zip(weights, values)) / denominator
    if not math.isfinite(answer):
        raise ValueError("Weighted quotient is nonfinite")
    return answer, list(zip(points, weights, values))


def report(label, result, field):
    print(label)
    for key in [field, "error", "success", "status", "nfev"]:
        print(f"  {key}={np.asarray(getattr(result, key)).tolist()}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zero-derivative", action="store_true")
    args = parser.parse_args()
    if args.zero_derivative:
        for atol in [1e-8, 1e-12]:
            result = derivative(lambda x: x*x, 0., tolerances={"atol": atol, "rtol": 0.})
            report(f"x^2 at 0; exact df=0; atol={atol:g}", result, "df")
        return
    for name in STENCILS:
        answer, rows = stencil(math.sin, 1., .1, name)
        reference = -math.sin(1.) if name == "second" else math.cos(1.)
        print(f"{name}: value={answer:.9f} reference={reference:.9f} error={answer-reference:.3e}")
        for point, weight, value in rows:
            print(f"  x={point:.2f} weight={weight:g} sample={value:.9f}")
    result = derivative(np.sin, 1., tolerances={"atol": 1e-10, "rtol": 1e-10})
    report("adaptive first", result, "df")
    # Leading axis indexes coordinates; all following axes are evaluation batches.
    result = hessian(lambda coordinates: np.sin(coordinates[0]), np.array([1.]),
                     tolerances={"atol": 1e-8, "rtol": 1e-8})
    report("1 by 1 Hessian", result, "ddf")
    result = derivative(np.exp, 0., step_direction=1,
                        tolerances={"atol": 1e-10, "rtol": 1e-10})
    report("right-sided endpoint exp at 0; exact df=1", result, "df")
    for x, h in [(.7, 10**-4.5), (1., 1e-20)]:
        try:
            answer, _ = stencil(math.sin, x, h, "central")
            print(f"changed x={x:g} h={h:.3e}: {answer:.9f}")
        except ValueError as error:
            print(f"changed x={x:g} h={h:.3e}: {error}")


if __name__ == "__main__":
    main()
