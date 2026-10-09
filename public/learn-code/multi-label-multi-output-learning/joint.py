from fractions import Fraction as F
from itertools import product

states = list(product([0, 1], repeat=2))
mass = dict(zip(states, map(lambda count: F(count, 20), [6, 5, 1, 8])))
marginals = [sum(p for state, p in mass.items() if state[j]) for j in range(2)]
print("marginals:", list(map(str, marginals)))
for action in states:
    hamming = sum(
        p * F(sum(a != y for a, y in zip(action, state)), 2)
        for state, p in mass.items()
    )
    print(action, "Hamming risk", hamming, "subset risk", 1 - mass[action])
for order in [(0, 1), (1, 0)]:
    action = [0, 0]
    first, second = order
    action[first] = int(marginals[first] >= F(1, 2))
    support = sum(p for state, p in mass.items() if state[first] == action[first])
    conditional = (
        sum(
            p
            for state, p in mass.items()
            if state[first] == action[first] and state[second]
        )
        / support
    )
    action[second] = int(conditional >= F(1, 2))
    print("greedy order", order, "conditional", conditional, "action", action)
