from fractions import Fraction as F
from itertools import product

# Independent causes; C is their common effect and D is a copy of C.
rows = [(x, y, int(x or y), F(1, 4)) for x, y in product([0, 1], repeat=2)]

def risk(x, selected=False):
    keep = [(y, mass) for tx, y, c, mass in rows if tx == x and (not selected or c == 1)]
    return sum(y * mass for y, mass in keep) / sum(mass for _, mass in keep)

print('unselected Y risks:', risk(0), risk(1))
print('given C=1, Y risks:', risk(0, True), risk(1, True))
print('selected association:', risk(1, True) - risk(0, True))
