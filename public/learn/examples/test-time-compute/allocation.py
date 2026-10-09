"""Multiple-choice budget allocation with exact rational estimated gains.

python allocation.py
Tables are constructed planning inputs, not fitted from GSM8K test answers.
"""
from fractions import Fraction
from itertools import product
import json

TABLE = [[(0, ".40"), (1, ".70"), (2, ".75")],
         [(0, ".20"), (1, ".35"), (2, ".65")]]


def allocate(table, budget, overhead=0):
    if any(not isinstance(x, int) or x < 0 for x in (budget, overhead)):
        raise ValueError("Budget and overhead must be nonnegative integers")
    if overhead > budget:
        return None
    options = [[(cost, Fraction(str(gain))) for cost, gain in row] for row in table]
    if any(not row for row in options):
        raise ValueError("Each request needs at least one option")
    if any(not isinstance(c, int) or c < 0 or not 0 <= g <= 1
           for row in options for c, g in row):
        raise ValueError("Costs must be nonnegative integers; success in [0,1]")
    # Each state fixes one total cost. Its path has one choice per processed row.
    states = {0: (Fraction(0), ())}
    for row in options:
        following = {}
        for spent, (gain, path) in states.items():
            for index, (cost, extra) in enumerate(row):
                total = spent + cost
                if total > budget - overhead:
                    continue
                candidate = (gain + extra, path + (index,))
                current = following.get(total)
                if current is None or (-candidate[0], candidate[1]) < (-current[0], current[1]):
                    following[total] = candidate
        states = following
    if not states:
        return None
    spent, (gain, path) = min(states.items(), key=lambda item: (-item[1][0], item[1][1]))
    return {"choices": list(path), "work": spent, "overhead": overhead,
            "expected_correct": float(gain), "exact_gain": str(gain)}


def exhaustive(table, budget, overhead=0):
    """Independent small-domain reference; enumerates complete assignments."""
    possible = []
    for indices in product(*(range(len(row)) for row in table)):
        cost = sum(table[i][j][0] for i, j in enumerate(indices))
        gain = sum(Fraction(str(table[i][j][1])) for i, j in enumerate(indices))
        if cost + overhead <= budget:
            possible.append((gain, indices))
    return min(possible, key=lambda item: (-item[0], item[1])) if possible else None


if __name__ == "__main__":
    print(json.dumps({"table": TABLE, "budget3": allocate(TABLE, 3),
                     "with_overhead": allocate(TABLE, 3, 1),
                     "zero_budget": allocate(TABLE, 0),
                     "nonconcave": allocate([[(0, 0), (1, .3), (2, .3)],
                                               [(0, 0), (1, .2), (2, .9)]], 2)}, indent=2))
