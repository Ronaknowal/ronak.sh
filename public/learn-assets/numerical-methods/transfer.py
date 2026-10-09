import math

# A=diag(1,1e-6), b=(1,1e-6), exact solution=(1,1).
approximate = [1.0, 0.0]
residual = [approximate[0] - 1, 1e-6 * approximate[1] - 1e-6]
print("residual norm:", math.hypot(*residual), "solution error:", 1.0)

k, horizon = 2.0, 3.0
for steps in [3, 6, 12, 24]:
    h = horizon / steps
    computed = (1 - k * h) ** steps
    exact = math.exp(-k * horizon)
    print(
        "h:", h, "Euler:", round(computed, 8), "exact:", round(exact, 8)
    )

from scipy.optimize import brentq
from scipy.integrate import quad

root, status = brentq(lambda x: x * x - 2, 0.0, 2.0, full_output=True)
area, error_estimate = quad(lambda x: math.exp(-x * x), 0.0, 1.0)
print("SciPy root:", round(root, 9), "converged:", status.converged)
print(
    "SciPy area:",
    round(area, 9),
    "estimated error:",
    f"{error_estimate:.2e}",
)