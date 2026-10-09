import math


def adaptive_simpson(
    f, a, b, tolerance=1e-6, max_depth=12, max_evaluations=4097
):
    if not (
        math.isfinite(a)
        and math.isfinite(b)
        and a < b
        and math.isfinite(b - a)
        and math.isfinite(tolerance)
        and tolerance > 0
    ):
        raise ValueError("Invalid interval or tolerance")
    if (
        not isinstance(max_depth, int)
        or max_depth < 0
        or max_evaluations < 1
    ):
        raise ValueError("Invalid work limits")
    samples, leaves = {}, []
    failed = False

    def evaluate(x):
        if x not in samples:
            if len(samples) >= max_evaluations:
                raise RuntimeError("evaluation limit")
            value = f(x)
            if not math.isfinite(value):
                raise RuntimeError("nonfinite evaluation")
            samples[x] = value
        return samples[x]

    def panel(left, right, fl, fm, fr):
        return (right - left) / 6 * (fl + 4 * fm + fr)

    def recurse(left, right, budget, depth):
        nonlocal failed
        middle = left + (right - left) / 2
        lm, rm = (
            left + (middle - left) / 2,
            middle + (right - middle) / 2,
        )
        if len({left, lm, middle, rm, right}) != 5:
            raise RuntimeError("arithmetic stagnation")
        fl, fm, fr = evaluate(left), evaluate(middle), evaluate(right)
        coarse = panel(left, right, fl, fm, fr)
        fine = panel(left, middle, fl, evaluate(lm), fm) + panel(
            middle, right, fm, evaluate(rm), fr
        )
        error = abs(fine - coarse) / 15
        corrected = fine + (fine - coarse) / 15
        if not (math.isfinite(error) and math.isfinite(corrected)):
            raise RuntimeError("nonfinite arithmetic")
        if error <= budget or depth == max_depth:
            failed |= error > budget
            leaves.append((left, right, error, budget))
            return corrected
        return recurse(left, middle, budget / 2, depth + 1) + recurse(
            middle, right, budget / 2, depth + 1
        )

    try:
        value = recurse(a, b, tolerance, 0)
    except RuntimeError as error:
        return None, None, len(samples), str(error)
    status = "depth limit" if failed else "estimated tolerance"
    return value, sum(row[2] for row in leaves), len(samples), status


peak = lambda x: 1 / (1 + 400 * (x - 0.35) ** 2)
reference = (math.atan(13) + math.atan(7)) / 20
value, estimate, evaluations, status = adaptive_simpson(peak, 0.0, 1.0)
print(status, evaluations, round(value, 9))
print(
    "estimated error:",
    f"{estimate:.2e}",
    "actual error:",
    f"{abs(value-reference):.2e}",
)
print(adaptive_simpson(peak, 0.0, 1.0, max_evaluations=5)[-1])