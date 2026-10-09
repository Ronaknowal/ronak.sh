import math

node = 1 / math.sqrt(3)
for power in range(5):
    estimate = (-node) ** power + node**power
    exact = 0.0 if power % 2 else 2 / (power + 1)
    print(power, round(estimate, 6), round(exact, 6))


def gauss_two(f, a, b):
    midpoint, radius = (a + b) / 2, (b - a) / 2
    return radius * (
        f(midpoint - radius * node) + f(midpoint + radius * node)
    )


print("x^2 on [2,4]:", round(gauss_two(lambda x: x * x, 2.0, 4.0), 6))