from fractions import Fraction as F
from itertools import product

rows = []
for a, b in product([0, 1], repeat=2):
    truth = F(a + b, 2)
    pa, pb = F(1 + 2 * a, 4), F(1 + 2 * b, 4)
    rows.append((F(1, 4), truth, pa, pb, (pa + pb) / 2))
for column, name in [(2, "A"), (3, "B"), (4, "mean")]:
    print(name)
    for forecast in sorted({row[column] for row in rows}):
        group = [row for row in rows if row[column] == forecast]
        rate = sum(row[0] * row[1] for row in group) / sum(row[0] for row in group)
        print(f"  forecast {forecast}: event chance {rate}")
    # E[(p-Y)^2 | signals] = p^2 - 2p E[Y|signals] + E[Y|signals].
    risk = sum(
        mass * (row[column] ** 2 - 2 * row[column] * truth + truth)
        for row in rows
        for mass, truth in [row[:2]]
    )
    print("  exact Brier risk:", risk)
