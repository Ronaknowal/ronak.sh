import math


def finite_exponent(growth, initial, burn, count):
    if not math.isfinite(growth) or not 0 <= growth <= 4:
        raise ValueError("Use growth in [0,4].")
    if not math.isfinite(initial) or not 0 <= initial <= 1:
        raise ValueError("Use an initial state in [0,1].")
    if (
        type(burn) is not int
        or type(count) is not int
        or not 0 <= burn <= 10000
        or not 1 <= count <= 10000
    ):
        raise ValueError("Use bounded integer discard/average counts.")
    value = initial
    for _ in range(burn):
        value = growth * value * (1 - value)
    log_sum = 0.0
    for _ in range(count):
        derivative = growth * (1 - 2 * value)
        if derivative == 0:
            return -math.inf
        log_sum += math.log(abs(derivative))
        value = growth * value * (1 - value)
    return log_sum / count


for growth in (2.5, 3.2, 3.83, 3.9):
    print(
        f"r={growth}: finite average {finite_exponent(growth, 0.217, 1000, 2000):.6f}"
    )
print(f"fixed x=.75 at r=4: {finite_exponent(4, 0.75, 0, 20):.6f}")
print("critical x=.5 at r=4:", finite_exponent(4, 0.5, 0, 20))
error, tolerance, assumed_rate = 1e-6, 0.01, 0.5
print(
    f"local growth-model horizon: {math.log(tolerance / error) / assumed_rate:.3f} iterations"
)
print("The horizon is an approximation under the stated growth model, not a guarantee.")
