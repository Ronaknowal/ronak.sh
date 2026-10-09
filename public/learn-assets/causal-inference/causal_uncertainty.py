import math
import random

# Fixed cell sizes and target population weights; outcomes are independent within/between cells.
cells = [(20, 4), (80, 8), (80, 32), (20, 6)]  # low treated/control, high treated/control
weights = [0.5, -0.5, 0.5, -0.5]
observed = sum(w*k/n for w, (n, k) in zip(weights, cells))
rng = random.Random(18)
draws = []
for _ in range(5000):
    # Resampling binary empirical outcomes in a fixed cell equals Bernoulli(k/n) draws.
    estimates = [sum(rng.random() < k/n for _ in range(n))/n for n, k in cells]
    draws.append(sum(w*rate for w, rate in zip(weights, estimates)))
draws.sort()

def percentile(p):
    position = (len(draws)-1)*p
    lower = math.floor(position)
    upper = min(lower+1, len(draws)-1)
    return draws[lower] + (position-lower)*(draws[upper]-draws[lower])

print('adjusted estimate:', round(observed, 4))
print('bootstrap 2.5% and 97.5%:', round(percentile(.025), 4), round(percentile(.975), 4))
print('Resamples:', len(draws))
