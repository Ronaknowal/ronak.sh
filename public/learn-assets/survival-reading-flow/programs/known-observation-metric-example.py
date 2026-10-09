from itertools import combinations, product
import numpy as np
from sksurv.metrics import concordance_index_censored

times = np.array([1, 2, 2, 4], dtype=float)
events = np.array([True, False, True, True])
scores = np.array([3, 2, 2, 0], dtype=float)
for i, j in combinations(range(4), 2):
    early, late = sorted([i, j], key=lambda k: (times[k], not events[k]))
    comparable = events[early] and (times[early] < times[late] or not events[late])
    credit = (
        (0.5 if scores[early] == scores[late] else float(scores[early] > scores[late]))
        if comparable
        else None
    )
    print((i, j), "credit:", credit)
print(
    "library C, concordant, discordant, risk ties, time ties:",
    concordance_index_censored(events, times, scores),
)
prediction, horizon = 0.6, 5
weighted = complete = known_mass = naive = full = 0.0
for (lifetime, mass), (censor, censor_mass) in product(
    [(2, 0.4), (8, 0.6)], [(3, 0.5), (10, 0.5)]
):
    probability = mass * censor_mass
    observed, event = min(lifetime, censor), lifetime <= censor
    loss = (float(lifetime > horizon) - prediction) ** 2
    known = event or observed > horizon
    observation_probability = 1 if lifetime == 2 else 0.5
    weighted += probability * (loss / observation_probability if known else 0)
    complete += probability * loss if known else 0
    known_mass += probability if known else 0
    full += probability * loss
    naive += probability * (float(observed > horizon) - prediction) ** 2
print("full / known-G IPCW:", round(full, 6), round(weighted, 6))
print(
    "complete-case / censor-as-failure:",
    round(complete / known_mass, 6),
    round(naive, 6),
)