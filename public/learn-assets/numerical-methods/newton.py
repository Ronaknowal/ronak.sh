import math


def f(x):
    return x**3 - 2 * x + 2


def derivative(x):
    return 3 * x * x - 2


x = 0.0
plain = [x]
for _ in range(4):
    x -= f(x) / derivative(x)
    plain.append(x)
print("plain:", plain)

lower, upper, x = -2.0, 0.0, 0.0
for step in range(5):
    slope = derivative(x)
    proposal = x - f(x) / slope if slope != 0 else math.nan
    width = upper - lower
    accept = (
        math.isfinite(proposal)
        and lower + 0.1 * width <= proposal <= upper - 0.1 * width
    )
    next_x = proposal if accept else lower + width / 2
    value = f(next_x)
    print(step + 1, "tangent" if accept else "bisect", round(next_x, 6))
    if value == 0:
        break
    if (f(lower) < 0) != (value < 0):
        upper = next_x
    else:
        lower = next_x
    x = next_x
print("bracket:", round(lower, 6), round(upper, 6))