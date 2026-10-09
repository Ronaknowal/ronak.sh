"""All six finite assignments and their feasible soft mixtures; standard library."""
from itertools import permutations
from math import hypot

SOURCE = [(0, 0), (1, 0), (0, 2)]
TARGET = [(5, 10), (7, 10), (7, 11)]


def distances(points):
    return [[hypot(x - u, y - v) for u, v in points] for x, y in points]


def coupling(order, mix=0):
    return [[(1 - mix) * (j == order[i]) / 3 + mix / 9
             for j in range(3)] for i in range(3)]


def gw(plan, left, right):
    return sum((left[i][k] - right[j][ell]) ** 2 * plan[i][j] * plan[k][ell]
               for i in range(3) for k in range(3)
               for j in range(3) for ell in range(3))


def main():
    left, right = distances(SOURCE), distances(TARGET)
    print("source distances", [[round(v, 9) for v in row] for row in left])
    print("target distances", [[round(v, 9) for v in row] for row in right])
    for order in permutations(range(3)):
        print("permutation", list(order), "GW", f"{gw(coupling(order), left, right):.9f}")
    for mix in [0, .25, .5, 1]:
        plan = coupling((1, 2, 0), mix)
        print("mix", mix, "plan", [[round(v, 9) for v in row] for row in plan])
        print("GW", f"{gw(plan, left, right):.9f}")
    costs = [[sum((x - y) ** 2 for x, y in zip(a, b)) for b in TARGET] for a in SOURCE]
    assignments = [(sum(costs[i][order[i]] for i in range(3)) / 3, order)
                   for order in permutations(range(3))]
    value, order = min(assignments)
    print("coordinate squared cost", f"{value:.9f}", "assignment", list(order))


if __name__ == "__main__":
    main()
