from fractions import Fraction as F

logging, target, reward_chance = (
    [F(4, 5), F(1, 5)],
    [F(1, 2), F(1, 2)],
    [F(2, 5), F(4, 5)],
)
logged = sum(p * q for p, q in zip(logging, reward_chance))
value = sum(p * q for p, q in zip(target, reward_chance))
mean, second = F(0), F(0)
for action in range(2):
    for reward in (0, 1):
        mass = logging[action] * (
            reward_chance[action] if reward else 1 - reward_chance[action]
        )
        weighted = target[action] / logging[action] * reward
        mean += mass * weighted
        second += mass * weighted**2
        print(
            "action",
            action,
            "reward",
            reward,
            "mass",
            mass,
            "weighted reward",
            weighted,
        )
assert mean == value
print("logged mean:", logged, "target mean:", value, "IPS expectation:", mean)
print("one-request IPS variance:", second - mean**2)
# A finite realized sample is not the expectation: 16 A, 4 B; 6 A and 3 B clicks.
estimate = (target[0] / logging[0] * 6 + target[1] / logging[1] * 3) / 20
print("one declared 20-request sample: raw", F(9, 20), "IPS", estimate)
print(
    "If B has zero logging probability and positive target mass, its mean is not identified from those logs."
)