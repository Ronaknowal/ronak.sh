import math

positions = [-3, -1, 1, 3]
p, q = [0.4, 0.1, 0.1, 0.4], [0.1, 0.4, 0.4, 0.1]
difference = [a - b for a, b in zip(p, q)]
prefix, running = [], 0
scores = [0]
for i in range(len(positions) - 1):
    running += difference[i]
    prefix.append(running)
    sign = (running > 0) - (running < 0)
    scores.append(scores[-1] - sign * (positions[i + 1] - positions[i]))
w1 = math.fsum(abs(amount) * (positions[i + 1] - positions[i]) for i, amount in enumerate(prefix))
critic_gap = math.fsum(score * mass for score, mass in zip(scores, difference))
linear = abs(math.fsum(position * mass for position, mass in zip(positions, difference)))
tv = math.fsum(abs(mass) for mass in difference) / 2
assert math.isclose(w1, critic_gap)
assert all(abs(scores[j] - scores[i]) <= abs(positions[j] - positions[i]) + 1e-12
           for i in range(4) for j in range(4))
print("Cumulative imbalances:", [round(value, 6) for value in prefix])
print("Optimal critic scores:", scores)
print("Linear / TV / W1:", round(linear, 6), round(tv, 6), round(w1, 6))
