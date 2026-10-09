import math

rates = [.2, .1, .05, .01]
decay = .3
weight = 2.0
for rate in rates:
    weight *= 1 - rate * decay  # zero adaptive displacement; parameter participates each time
expected = 2 * math.prod(1 - rate * decay for rate in rates)
assert weight == expected
print("cumulative decayed weight", round(weight, 6))
print("first-order exponential approximation", round(2 * math.exp(-decay * sum(rates)), 6))

gradient_buffer = 0.0
scaled_velocity = 0.0
first_weight = second_weight = 0.0
for rate, gradient in zip((.2, .05), (1.0, 1.0)):
    gradient_buffer = .9 * gradient_buffer + gradient
    first_weight -= rate * gradient_buffer
    scaled_velocity = .9 * scaled_velocity + rate * gradient
    second_weight -= scaled_velocity
print("gradient-storage momentum", round(first_weight, 6))
print("scaled-contribution velocity", round(second_weight, 6))
