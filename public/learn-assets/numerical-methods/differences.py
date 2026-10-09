import math

x = 1.0
reference = math.cos(x)
for exponent in range(1, 13):
    h = 10.0 ** (-exponent)
    estimate = (math.sin(x + h) - math.sin(x - h)) / (2 * h)
    print(f"h={h:.0e}  error={abs(estimate-reference):.3e}")

f = lambda value: 1e12 + value
h = 1e-5
print(
    "large offset:",
    (f(x + h) - f(x - h)) / (2 * h),
    "true derivative:",
    1,
)
print("coordinates coincide:", x + 1e-20 == x)