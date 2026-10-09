from itertools import permutations
from math import sqrt

source = [(-1.0, -1.0), (1.0, 1.0)]
target = [(-1.0, 1.0), (1.0, -1.0)]
directions = [(1.0, 0.0), (0.0, 1.0), (1 / sqrt(2), 1 / sqrt(2))]
projected_costs = []
for direction in directions:
    left = sorted(sum(x * v for x, v in zip(point, direction)) for point in source)
    right = sorted(sum(x * v for x, v in zip(point, direction)) for point in target)
    squared = sum((x - y) ** 2 for x, y in zip(left, right)) / 2
    projected_costs.append(squared)
print("projection W2 squared:", [round(value, 6) for value in projected_costs])
best = min(
    sum(
        sum((x - y) ** 2 for x, y in zip(source[i], target[j]))
        for i, j in enumerate(order)
    )
    / 2
    for order in permutations(range(2))
)
print("full W2:", f"{sqrt(best):.6f}")
print("two-axis average:", f"{sum(projected_costs[:2]) / 2:.6f}")
print("three-direction rooted average:", f"{sqrt(sum(projected_costs) / 3):.6f}")
# This finite direction average is the declared approximation, not the
# exact integral over all unit directions defining sliced Wasserstein.