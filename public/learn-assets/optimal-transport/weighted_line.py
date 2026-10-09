from fractions import Fraction as F
from math import sqrt

source = [(0, F(2, 5)), (3, F(3, 5))]
target = [(1, F(1, 5)), (2, F(1, 2)), (5, F(3, 10))]
left = [mass for _, mass in source]
right = [mass for _, mass in target]
plan = [[F(0) for _ in target] for _ in source]
i = j = 0
while i < len(source) and j < len(target):
    moved = min(left[i], right[j])
    plan[i][j] += moved
    left[i] -= moved
    right[j] -= moved
    if left[i] == 0:
        i += 1
    if right[j] == 0:
        j += 1
costs = [
    sum(
        plan[i][j] * abs(x - y) ** order
        for i, (x, _) in enumerate(source)
        for j, (y, _) in enumerate(target)
    )
    for order in [1, 2]
]
knots = sorted({x for x, _ in source + target})
area = F(0)
for lower, upper in zip(knots, knots[1:]):
    fa = sum(mass for x, mass in source if x <= lower)
    fb = sum(mass for x, mass in target if x <= lower)
    contribution = abs(fa - fb) * (upper - lower)
    area += contribution
    print("gap", lower, upper, "contribution", str(contribution))
assert area == costs[0]
print("plan:", [[str(mass) for mass in row] for row in plan])
print("W1:", str(costs[0]), "W2 squared:", str(costs[1]))
print("W2:", f"{sqrt(costs[1]):.6f}")