import math
import random
import statistics

def leapfrog(q, r, epsilon):
    r -= epsilon * q / 2  # half kick: grad U(q) = q
    q += epsilon * r      # drift with unit mass
    r -= epsilon * q / 2  # second half kick at the new position
    return q, r

def energy(q, r):
    return (q*q + r*r) / 2

def sample_hmc(seed, iterations=12000, warmup=2000, epsilon=.2, steps=12):
    if not 0 <= warmup < iterations or epsilon <= 0 or steps < 1:
        raise ValueError("Invalid iteration or integration settings")
    rng = random.Random(seed)
    q, samples, accepted = 1.0, [], 0
    for iteration in range(iterations):
        r = rng.gauss(0, 1)  # fresh auxiliary momentum every transition
        old_energy = energy(q, r)
        proposal, momentum = q, r
        for _ in range(steps):
            proposal, momentum = leapfrog(proposal, momentum, epsilon)
        momentum = -momentum  # makes the deterministic proposal an involution
        new_energy = energy(proposal, momentum)
        if math.isfinite(new_energy) and math.log(rng.random()) < min(0, old_energy-new_energy):
            q = proposal
            accepted += 1
        if iteration >= warmup:
            samples.append(q)
    return samples, accepted / iterations

q, r = leapfrog(1, .7, .2)
print("first step", f"q={q:.3f}", f"r={r:.3f}", f"delta_H={energy(q,r)-energy(1,.7):.6f}")
draws, acceptance = sample_hmc(7)
print("draws", len(draws), "acceptance", f"{acceptance:.3f}")
print("mean", f"{statistics.mean(draws):.3f}", "variance", f"{statistics.variance(draws):.3f}")