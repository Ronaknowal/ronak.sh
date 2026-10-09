import math


def cubic_solution(initial, time, attracting=True):
    if (
        not math.isfinite(initial)
        or not abs(initial) <= 2
        or not math.isfinite(time)
        or not 0 <= time <= 30
    ):
        raise ValueError("Use an initial state in [-2,2] and time in [0,30].")
    denominator = 1 + (1 if attracting else -1) * 2 * initial**2 * time
    if denominator <= 0:
        raise ValueError("The repelling solution has reached its finite-time pole.")
    return initial / math.sqrt(denominator)


def potential(value, parameter):
    return value**4 / 4 - parameter * value**2 / 2


def potential_rate(value, parameter):
    velocity = parameter * value - value**3
    return (value**3 - parameter * value) * velocity


for time in (0, 1, 4):
    stable = cubic_solution(0.25, time, True)
    unstable = cubic_solution(0.25, time, False)
    print(f"t={time}: -x^3 gives {stable:.6f}; +x^3 gives {unstable:.6f}")
for value in (-1.5, -0.5, 0, 0.5, 1.5):
    print(
        f"x={value:.1f}: V={potential(value, 1):.6f}, dV/dt={potential_rate(value, 1):.6f}"
    )
try:
    cubic_solution(0.25, 8, False)
except ValueError as error:
    print(error)
