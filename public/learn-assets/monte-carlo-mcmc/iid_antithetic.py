import math
import random
import statistics

def estimate(seed, evaluations, paired=False):
    if evaluations < 2 or (paired and evaluations % 2):
        raise ValueError("Use at least two evaluations; pairs need an even count")
    rng = random.Random(seed)
    groups = []
    for _ in range(evaluations // (2 if paired else 1)):
        u = rng.random()
        groups.append((u*u + (1-u)**2) / 2 if paired else u*u)
    mcse = math.sqrt(statistics.variance(groups) / len(groups)) if len(groups) > 1 else None
    return statistics.mean(groups), mcse, len(groups)

for paired in [False, True]:
    result, mcse, groups = estimate(7, 1000, paired)
    print("paired" if paired else "iid", groups, f"mean={result:.6f}", f"MCSE={mcse:.6f}")
print("exact mean", f"{1/3:.6f}")
print("exact variance ratio", (4 / (45 * 1000)) / (1 / (90 * 1000)))