from fractions import Fraction as F

a, b = F(3, 5), F(3, 10)
costs = [[0, 1], [2, 1]]
lower, upper = max(F(0), a + b - 1), min(a, b)


def plan_at(t):
    return [[t, a - t], [b - t, 1 - a - b + t]]


def cost(plan):
    return sum(plan[i][j] * costs[i][j] for i in range(2) for j in range(2))


t = min([lower, upper], key=lambda value: cost(plan_at(value)))
plan = plan_at(t)
certificates = []
for f1 in [costs[1][j] - costs[0][j] for j in range(2)]:
    f = [0, f1]
    g = [min(costs[0][j], costs[1][j] - f1) for j in range(2)]
    value = (1 - a) * f1 + b * g[0] + (1 - b) * g[1]
    certificates.append((value, f, g))
dual, f, g = max(certificates)
slack = [[costs[i][j] - f[i] - g[j] for j in range(2)] for i in range(2)]
assert all(value >= 0 for row in slack for value in row)
assert cost(plan) == dual
print("feasible t:", str(lower), "to", str(upper))
print("plan:", [[str(value) for value in row] for row in plan])
print("source prices:", f, "target prices:", g)
print("cost and lower bound:", str(cost(plan)), str(dual))
print(
    "weighted slack:", sum(plan[i][j] * slack[i][j] for i in range(2) for j in range(2))
)