"""Exact equal-weight finite laws: pair means and a witness, with no sample estimator."""
import math


def compare(x, y, sigma=1.0, query=0.0):
    if not x or not y or not math.isfinite(sigma) or sigma <= 0:
        raise ValueError("Nonempty laws and positive finite bandwidth required.")
    if any(not math.isfinite(value) for value in [*x, *y, query]):
        raise ValueError("Finite coordinates and query required.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a-b)/sigma)**2)
    def pair_mean(left, right):
        return math.fsum(kernel(a, b) for a in left for b in right)/(len(left)*len(right))
    xx, yy, xy = pair_mean(x, x), pair_mean(y, y), pair_mean(x, y)
    squared = xx+yy-2*xy
    def witness(t):
        return (math.fsum(kernel(a, t) for a in x)/len(x)
                - math.fsum(kernel(b, t) for b in y)/len(y))
    gap = math.fsum(witness(a) for a in x)/len(x)-math.fsum(witness(b) for b in y)/len(y)
    return xx, yy, xy, squared, witness(query), gap


def main():
    x, y = [-1., 1.], [0.]
    values = compare(x, y)
    assert math.isclose(values[3], values[5], abs_tol=1e-14)
    assert math.isclose(values[3], 1.5+math.exp(-2)/2-2*math.exp(-.5), abs_tol=1e-14)
    print("XX / YY / XY means", [round(v, 9) for v in values[:3]])
    print("squared norm / witness at 0 / witness gap", [round(v, 9) for v in values[3:]])
    feature_mean = lambda sample: [math.fsum(a for a in sample)/len(sample),
                                  math.fsum(a*a for a in sample)/len(sample)]
    mx, my = feature_mean(x), feature_mean(y)
    print("finite feature means", mx, my)
    print("finite feature norm", math.sqrt(math.fsum((a-b)**2 for a,b in zip(mx,my))))


if __name__ == "__main__":
    main()
