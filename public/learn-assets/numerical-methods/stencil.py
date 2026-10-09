from fractions import Fraction as F

weights = [F(-3, 2), F(2), F(-1, 2)]
moments = [
    sum(w * k**degree for k, w in enumerate(weights))
    for degree in range(4)
]
print("moments:", moments)
# For x^3 at x=1 this stencil has derivative 3-2h^2.
for h in [F(1, 2), F(1, 4)]:
    estimate = (
        sum(w * (1 + k * h) ** 3 for k, w in enumerate(weights)) / h
    )
    print("h:", h, "estimate:", estimate, "error:", estimate - 3)


def loss(x, y):
    return x * x + 3 * x * y + 2 * y * y


x, y = 1.0, 2.0
vx, vy = 2.0, -1.0
h = 1e-4
difference = (
    loss(x + h * vx, y + h * vy) - loss(x - h * vx, y - h * vy)
) / (2 * h)
gradient_dot_direction = (2 * x + 3 * y) * vx + (3 * x + 4 * y) * vy
print("direction:", round(difference, 6), gradient_dot_direction)