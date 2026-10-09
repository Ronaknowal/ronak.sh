import math


def radius_at(parameter, initial_radius, time):
    if not all(math.isfinite(value) for value in (parameter, initial_radius, time)):
        raise ValueError("Use finite values.")
    if not -1 <= parameter <= 1 or not 0 <= initial_radius <= 2 or not 0 <= time <= 30:
        raise ValueError("Use the stated parameter, radius and time ranges.")
    squared = initial_radius**2
    exponent = 2 * parameter * time
    # expm1(z)/z has continuous value 1 at zero. The series also handles
    # a nonzero parameter whose product with time rounds to zero.
    relative = (
        1 + exponent / 2 + exponent**2 / 6
        if abs(exponent) < 1e-7
        else math.expm1(exponent) / exponent
    )
    growth = math.exp(exponent)
    denominator = 1 + 2 * squared * time * relative
    return initial_radius * math.sqrt(growth / denominator)


period = 2 * math.pi
for parameter in (-0.25, 0, 0.25):
    returns = [radius_at(parameter, 0.3, count * period) for count in range(3)]
    print(f"a={parameter}: radii after turns", [round(value, 6) for value in returns])
parameter = 0.25
fixed_radius = math.sqrt(parameter)
epsilon = 1e-6
measured_multiplier = (
    radius_at(parameter, fixed_radius + epsilon, period)
    - radius_at(parameter, fixed_radius - epsilon, period)
) / (2 * epsilon)
print(f"radial return multiplier: {measured_multiplier:.6f}")
print(f"analytic multiplier: {math.exp(-4 * math.pi * parameter):.6f}")
print("Angles advance by 2*pi per turn; attraction of radius does not reset phase.")
