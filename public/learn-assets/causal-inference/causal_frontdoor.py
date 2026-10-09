from fractions import Fraction as F
from itertools import product

assignment, mediator = [F(1, 5), F(4, 5)], [F(1, 10), F(4, 5)]

def compare(direct):
    def risk(u, m, x):
        return F(1, 10) + F(1, 2)*m + F(1, 5)*u + direct*x
    rows = []
    for u, x, m, y in product([0, 1], repeat=4):
        mass = F(1, 2) * (assignment[u] if x else 1-assignment[u])
        mass *= mediator[x] if m else 1-mediator[x]
        mass *= risk(u, m, x) if y else 1-risk(u, m, x)
        rows.append((u, x, m, y, mass))
    def conditional_y(m, x):
        selected = [row for row in rows if row[1] == x and row[2] == m]
        return sum(row[3]*row[4] for row in selected) / sum(row[4] for row in selected)
    # Only observed X,M,Y probabilities occur in this calculation.
    inner = [sum(conditional_y(m, x) * F(1, 2) for x in [0, 1]) for m in [0, 1]]
    proposed = [(1-mediator[x])*inner[0] + mediator[x]*inner[1] for x in [0, 1]]
    truth = [sum(F(1, 2)*((1-mediator[x])*risk(u, 0, x) + mediator[x]*risk(u, 1, x))
                 for u in [0, 1]) for x in [0, 1]]
    print('direct =', direct, '| inner =', list(map(str, inner)))
    print('formula:', list(map(str, proposed)), '| true do:', list(map(str, truth)))
    if direct == 0:
        assert proposed == truth
    else:
        assert proposed != truth

compare(F(0))
compare(F(1, 10))
