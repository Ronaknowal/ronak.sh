from itertools import product
import math

rates = [.2, .15, .08, .02]
curvature, sigma, initial = 2.0, 1.0, 3.0
mean, variance = initial, 0.0
for rate in rates:
    multiplier = 1 - rate * curvature
    mean = multiplier * mean
    variance = multiplier**2 * variance + rate**2 * sigma**2

outcomes = []
for signs in product((-1, 1), repeat=len(rates)):
    error = initial
    for rate, sign in zip(rates, signs):
        error -= rate * (curvature * error + sigma * sign)
    outcomes.append(error)
exact_mean = math.fsum(outcomes) / len(outcomes)
exact_square = math.fsum(value * value for value in outcomes) / len(outcomes)
assert math.isclose(mean, exact_mean, abs_tol=1e-14)
assert math.isclose(mean**2 + variance, exact_square, abs_tol=1e-14)
print("all equally likely paths", len(outcomes))
print("mean", round(mean, 6), "variance", round(variance, 6))
print("expected squared error", round(exact_square, 6))
rate = .2
floor = rate * sigma**2 / (curvature * (2 - rate * curvature))
print("constant-rate limiting variance", round(floor, 6))