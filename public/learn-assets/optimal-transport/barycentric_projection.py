from fractions import Fraction as F

source = [0, 2]
target = [-1, 1, 3]
a = [F(1, 2), F(1, 2)]
plan = [[F(1, 4), F(1, 4), F(0)], [F(0), F(1, 4), F(1, 4)]]
b = [sum(row[j] for row in plan) for j in range(len(target))]
mapped = [
    sum(mass * y for mass, y in zip(row, target)) / weight
    for row, weight in zip(plan, a)
]
mean = sum(weight * y for weight, y in zip(b, target))
target_variance = sum(weight * (y - mean) ** 2 for weight, y in zip(b, target))
mapped_variance = sum(weight * (y - mean) ** 2 for weight, y in zip(a, mapped))
conditional_variance = sum(
    plan[i][j] * (target[j] - mapped[i]) ** 2 for i in range(2) for j in range(3)
)
assert target_variance == mapped_variance + conditional_variance
print("target masses:", [str(value) for value in b])
print("mean destinations:", [str(value) for value in mapped])
print("same mean:", str(mean))
print("target / mapped variance:", str(target_variance), str(mapped_variance))
print("discarded conditional variance:", str(conditional_variance))