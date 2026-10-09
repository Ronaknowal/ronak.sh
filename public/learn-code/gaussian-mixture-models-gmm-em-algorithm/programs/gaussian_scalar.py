"""Scalar Gaussian density, interval area and coordinate units; no fitting."""
import math


def log_normal(x, mean=0.0, variance=1.0):
    if not all(math.isfinite(value) for value in (x, mean, variance)) or variance <= 0:
        raise ValueError("finite coordinates and positive variance required")
    standardized = (x - mean) / math.sqrt(variance)
    answer = -0.5 * (math.log(2 * math.pi) + math.log(variance) + standardized ** 2)
    if not math.isfinite(answer):
        raise ArithmeticError("log density exceeds representable range")
    return answer


def normal_density(x, mean=0.0, variance=1.0):
    return math.exp(log_normal(x, mean, variance))


def interval_probability(lower, upper, mean=0.0, variance=1.0):
    log_normal(mean, mean, variance)
    if not all(math.isfinite(value) for value in (lower, upper)) or lower > upper:
        raise ValueError("finite ordered interval endpoints required")
    scale = math.sqrt(variance) * math.sqrt(2)
    # erfc differences avoid subtracting two nearly-one CDFs in one tail.
    if lower >= mean:
        return 0.5 * (math.erfc((lower - mean) / scale) - math.erfc((upper - mean) / scale))
    if upper <= mean:
        return 0.5 * (math.erfc((mean - upper) / scale) - math.erfc((mean - lower) / scale))
    return 0.5 * (math.erf((upper - mean) / scale) - math.erf((lower - mean) / scale))


def change_units(x, mean, variance, factor):
    if not math.isfinite(factor) or factor <= 0:
        raise ValueError("positive finite coordinate factor required")
    return factor * x, factor * mean, factor ** 2 * variance


def main():
    from scipy.stats import norm
    print("default log-density", log_normal(1))
    print("default density", normal_density(1))
    print("interval probability", interval_probability(-1, 1))
    print("zero interval", interval_probability(0, 0))
    print("narrow peak", normal_density(1, 1, 0.0625))
    values = change_units(1, 0, 1, 10)
    print("millimetre density", normal_density(*values))
    print("SciPy density", norm.pdf(1, loc=0, scale=1))
    print("SciPy interval", norm.cdf(1) - norm.cdf(-1))


if __name__ == "__main__":
    main()
