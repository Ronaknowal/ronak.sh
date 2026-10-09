from fractions import Fraction as F
from itertools import product

population = [F(1, 2), F(1, 2)]
assignment = [F(1, 5), F(4, 5)]
outcome = [[F(1, 10), F(1, 5)], [F(3, 10), F(2, 5)]]

def joint(forced=None):
    rows = []
    for z, x, y in product([0, 1], repeat=3):
        # Intervention replaces just the probability of X with a point mass.
        px = (assignment[z] if x else 1 - assignment[z])
        if forced is not None:
            px = F(x == forced)
        py = outcome[z][x] if y else 1 - outcome[z][x]
        rows.append((z, x, y, population[z] * px * py))
    assert sum(row[3] for row in rows) == 1
    return rows

observed = joint()
for x in [0, 1]:
    selected = [row for row in observed if row[1] == x]
    observational_risk = sum(y * mass for _, _, y, mass in selected) / sum(r[3] for r in selected)
    intervention_risk = sum(y * mass for _, _, y, mass in joint(forced=x))
    print('X =', x, '| observed risk =', observational_risk,
          '| intervention risk =', intervention_risk)
