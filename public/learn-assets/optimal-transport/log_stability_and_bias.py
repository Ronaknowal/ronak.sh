import math


def logsumexp(values):
    maximum = max(values)
    return maximum + math.log(sum(math.exp(value - maximum) for value in values))


def solve(a, b, costs, epsilon, max_steps=5000, tolerance=1e-10):
    if epsilon <= 0 or any(value <= 0 for value in a + b):
        raise ValueError("This teaching solver requires epsilon>0 and positive weights")
    if not math.isclose(sum(a), 1) or not math.isclose(sum(b), 1):
        raise ValueError("Both marginals must sum to1")
    log_kernel = [[-value / epsilon for value in row] for row in costs]
    log_u, log_v = [0.0] * len(a), [0.0] * len(b)
    for iteration in range(1, max_steps + 1):
        log_u = [
            math.log(a[i])
            - logsumexp([log_kernel[i][j] + log_v[j] for j in range(len(b))])
            for i in range(len(a))
        ]
        log_v = [
            math.log(b[j])
            - logsumexp([log_kernel[i][j] + log_u[i] for i in range(len(a))])
            for j in range(len(b))
        ]
        gauge = sum(log_v) / len(log_v)
        log_u = [value + gauge for value in log_u]
        log_v = [value - gauge for value in log_v]
        plan = [
            [math.exp(log_u[i] + log_kernel[i][j] + log_v[j]) for j in range(len(b))]
            for i in range(len(a))
        ]
        residual = max(
            [abs(sum(plan[i]) - a[i]) for i in range(len(a))]
            + [
                abs(sum(plan[i][j] for i in range(len(a))) - b[j])
                for j in range(len(b))
            ]
        )
        if residual <= tolerance:
            break
    linear = sum(plan[i][j] * costs[i][j] for i in range(len(a)) for j in range(len(b)))
    entropy_term = epsilon * sum(
        value * (math.log(value) - 1) for row in plan for value in row if value > 0
    )
    return plan, residual, residual <= tolerance, linear, linear + entropy_term


a = b = [0.5, 0.5]
costs = [[0.0, 1.0], [2.0, 1.0]]
shifted = [[value + 1000 for value in row] for row in costs]
plain_kernel = [[math.exp(-value / 0.5) for value in row] for row in shifted]
original = solve(a, b, costs, 0.5)
stable = solve(a, b, shifted, 0.5)
print(
    "vanished kernel entries:", sum(value == 0 for row in plain_kernel for value in row)
)
print("stable plan:", [[round(value, 6) for value in row] for row in stable[0]])
print("both converged:", original[2] and stable[2])
print("added linear cost:", f"{stable[3] - original[3]:.6f}")


def squared(left, right):
    return [[(x - y) ** 2 for y in right] for x in left]


source, target = [0.0, 2.0], [0.0, 1.0]
cross = solve(a, b, squared(source, target), 1.0)
self_a = solve(a, a, squared(source, source), 1.0)
self_b = solve(b, b, squared(target, target), 1.0)
divergence = cross[4] - (self_a[4] + self_b[4]) / 2
print("cross linear / full objective:", f"{cross[3]:.6f}", f"{cross[4]:.6f}")
print("Sinkhorn divergence:", f"{divergence:.6f}")
print("unregularized W2 squared:", 0.5)
sharp = solve(a, b, squared([0.0, 2.0], [1.0, 3.0]), 0.1)
print("sharp solve converged:", sharp[2], "residual:", f"{sharp[1]:.6f}")
# A finite iteration cap is a reportable result, not permission to label
# the returned matrix feasible or its objective an exact transport value.