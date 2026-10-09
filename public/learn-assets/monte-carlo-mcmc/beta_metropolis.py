import math
import random

rng = random.Random(7)
alpha, beta = 10, 4

def log_target(theta):
    if not 0 < theta < 1:
        return float("-inf")
    return (alpha - 1) * math.log(theta) + (beta - 1) * math.log(1 - theta)

state, accepted, samples = 0.5, 0, []
for step in range(30_000):
    proposal = state + rng.gauss(0, 0.12)
    log_acceptance = log_target(proposal) - log_target(state)
    if math.log(rng.random()) < min(0.0, log_acceptance):
        state = proposal
        accepted += 1
    if step >= 2_000:  # retain draws after warmup, including repeats
        samples.append(state)

print(len(samples), round(accepted / 30_000, 3))
print(round(sum(samples) / len(samples), 3))
print(round(sum(x > 0.70 for x in samples) / len(samples), 3))