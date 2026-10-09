import math
from scipy.optimize import brentq

rate = lambda t: t * math.exp(-t)
volume = lambda t: -math.expm1(-t) - t * math.exp(-t)
target, candidate, n = 0.7, 2.44, 32
h = candidate / n
estimate = h * (
    rate(0) / 2
    + sum(rate(i * h) for i in range(1, n))
    + rate(candidate) / 2
)
bound = candidate**3 / (6 * n * n)
time_bound = (abs(estimate - target) + bound) / (4 * math.exp(-4))
reference = brentq(lambda t: volume(t) - target, 2.0, 4.0)
print(f"residual={estimate-target:.6f}, integral_bound={bound:.6f}")
print(
    f"time_bound={time_bound:.6f}, actual_error={abs(candidate-reference):.6f}"
)