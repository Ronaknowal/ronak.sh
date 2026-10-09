"""Stable scalar weighted-Gaussian crossings; literal branches, diagnostic tolerances."""
from dataclasses import dataclass
import math


@dataclass(frozen=True)
class CrossingResult:
    status: str
    roots: tuple
    coefficients: tuple
    near_degenerate: bool


def crossings(means, variances, weights):
    if len(means) != 2 or len(variances) != 2 or len(weights) != 2:
        raise ValueError("two components required")
    if not all(math.isfinite(value) for value in (*means, *variances, *weights)):
        raise ValueError("finite parameters required")
    if min(variances) <= 0 or min(weights) < 0 or not math.isclose(sum(weights), 1, abs_tol=1e-12):
        raise ValueError("positive variances and normalized nonnegative weights required")
    if min(weights) == 0:
        return CrossingResult("no finite crossing", (), (), False)
    m1, m2 = means
    v1, v2 = variances
    w1, w2 = weights
    a = 0.5 * (1 / v2 - 1 / v1)
    b = m1 / v1 - m2 / v2
    c = math.log(w1) - math.log(w2) - 0.5 * (math.log(v1) - math.log(v2)) - m1 ** 2 / (2 * v1) + m2 ** 2 / (2 * v2)
    if not all(math.isfinite(value) for value in (a, b, c)):
        raise ArithmeticError("coefficients exceed representable range")
    scale = max(1, abs(a), abs(b), abs(c))
    near = abs(a) <= 1e-12 * scale
    if a == 0:
        if b != 0:
            return CrossingResult("one linear crossing", (-c / b,), (a, b, c), near)
        status = "equal everywhere" if c == 0 else "no crossing"
        return CrossingResult(status, (), (a, b, c), near)
    discriminant = b * b - 4 * a * c
    if not math.isfinite(discriminant):
        raise ArithmeticError("discriminant exceeds representable range")
    near |= abs(discriminant) <= 1e-12 * max(1, b * b, abs(4 * a * c))
    if discriminant < 0:
        return CrossingResult("no crossing", (), (a, b, c), near)
    if discriminant == 0:
        return CrossingResult("tangent", (-b / (2 * a),), (a, b, c), near)
    q = -0.5 * (b + math.copysign(math.sqrt(discriminant), b))
    roots = tuple(sorted((q / a, c / q)))
    if not all(math.isfinite(value) for value in roots):
        raise ArithmeticError("root exceeds representable range")
    return CrossingResult("two crossings", roots, (a, b, c), near)


def log_height_difference(x, means, variances, weights):
    from gaussian_scalar import log_normal
    return math.log(weights[0]) + log_normal(x, means[0], variances[0]) - math.log(weights[1]) - log_normal(x, means[1], variances[1])


def main():
    cases = [([0, 2], [1, 1], [.25, .75]), ([-2, 2], [.25, 1], [.5, .5]),
             ([0, 0], [1, 1], [.2, .8]), ([0, 0], [1, 1], [.5, .5]),
             ([-2, 2], [1.000000001, 1], [.5, .5]), ([0, 0], [1, 4], [1 / 3, 2 / 3])]
    for means, variances, weights in cases:
        result = crossings(means, variances, weights)
        print("crossing", result.status, list(result.roots), "near-degenerate", result.near_degenerate)
        print("root residuals", [log_height_difference(x, means, variances, weights) for x in result.roots])


if __name__ == "__main__":
    main()
