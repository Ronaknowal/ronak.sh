import math


def logistic_values(growth, initial, count):
    if not math.isfinite(growth) or not 0 <= growth <= 4:
        raise ValueError("Use growth from zero to four.")
    if not math.isfinite(initial) or not 0 <= initial <= 1:
        raise ValueError("Use an initial state in [0,1].")
    if type(count) is not int or not 0 <= count <= 10000:
        raise ValueError("Use an integer count from zero to 10000.")
    values = [initial]
    for _ in range(count):
        values.append(growth * values[-1] * (1 - values[-1]))
    return values


def two_cycle(growth):
    if not math.isfinite(growth) or not 3 < growth <= 4:
        raise ValueError("Distinct two-cycle points here require 3 < growth <= 4.")
    radical = math.sqrt((growth - 3) * (growth + 1))
    return (
        (growth + 1 - radical) / (2 * growth),
        (growth + 1 + radical) / (2 * growth),
    )


growth = 3.2
left, right = two_cycle(growth)
multiplier = growth**2 * (1 - 2 * left) * (1 - 2 * right)
print(f"two-cycle: {left:.6f}, {right:.6f}; multiplier={multiplier:.6f}")
for growth in (2.5, 3.2, 3.5, 3.83, 3.9):
    tail = logistic_values(growth, 0.217, 1008)[-8:]
    print(f"r={growth}: eight retained values", [round(value, 5) for value in tail])
