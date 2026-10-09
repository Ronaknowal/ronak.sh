import math

# Bisection: x^2 - 2 = 0 on [1, 2]
lo, hi = 1.0, 2.0
for _ in range(30):
    mid = (lo + hi) / 2
    if mid * mid < 2:
        lo = mid
    else:
        hi = mid
root = (lo + hi) / 2

# Central difference for d/dx sin(x) at x = 1
x, h = 1.0, 0.1
central_derivative = (math.sin(x + h) - math.sin(x - h)) / (2 * h)

# Trapezoidal rule for integral_0^pi sin(x) dx
n, a, b = 4, 0.0, math.pi
step = (b - a) / n
values = [math.sin(a + i * step) for i in range(n + 1)]
trapezoid = step * (0.5 * values[0] + sum(values[1:-1]) + 0.5 * values[-1])

print(round(root, 6))
print(round(central_derivative, 6), round(math.cos(1), 6))
print(round(trapezoid, 6), 2.0)