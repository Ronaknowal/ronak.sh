"""Exact finite weighted quantiles and their W2 barycentre; Python standard library."""
from fractions import Fraction as F


def law(points):
    merged = {}
    for location, mass in points:
        location, mass = F(location), F(mass)
        if mass < 0:
            raise ValueError("Weights must be nonnegative")
        if mass:
            merged[location] = merged.get(location, F(0)) + mass
    if sum(merged.values()) != 1:
        raise ValueError("Weights must sum exactly to one")
    return sorted(merged.items())


def packets(left, right):
    left, right = law(left), law(right)
    i = j = 0
    a, b, u = left[0][1], right[0][1], F(0)
    result = []
    while i < len(left) and j < len(right):
        mass = min(a, b)
        result.append((u, u + mass, left[i][0], right[j][0]))
        u += mass
        a -= mass
        b -= mass
        if a == 0:
            i += 1
            if i < len(left):
                a = left[i][1]
        if b == 0:
            j += 1
            if j < len(right):
                b = right[j][1]
    return result


def squared_cost(left, right):
    return sum((hi - lo) * (x - y) ** 2
               for lo, hi, x, y in packets(left, right))


def barycentre(left, right, weight):
    weight = F(weight)
    if not 0 <= weight <= 1:
        raise ValueError("Weight must lie in [0,1]")
    return law([((1 - weight) * x + weight * y, hi - lo)
                for lo, hi, x, y in packets(left, right)])


def main():
    half = F(1, 2)
    cases = {
        "equal": ([(0, half), (2, half)], [(2, half), (4, half)]),
        "unequal": ([(0, F(1, 4)), (2, F(3, 4))], [(1, half), (5, half)]),
    }
    for name, (left, right) in cases.items():
        print("case", name)
        print("packets", [[str(v) for v in row] for row in packets(left, right)])
        for weight in [F(0), F(1, 4), half, F(1)]:
            middle = barycentre(left, right, weight)
            mixture = law([(x, (1 - weight) * m) for x, m in left]
                          + [(y, weight * m) for y, m in right])
            ca, cb = squared_cost(left, middle), squared_cost(right, middle)
            objective = (1 - weight) * ca + weight * cb
            mix_objective = ((1 - weight) * squared_cost(left, mixture)
                             + weight * squared_cost(right, mixture))
            print("lambda", str(weight), "law", [[str(x), str(m)] for x, m in middle])
            print("costs/objective/mixture", list(map(str, [ca, cb, objective, mix_objective])))
    print("gaussian midpoint mean/sd/variance", [2, 2, 4])
    print("gaussian mixture variance", 9)


if __name__ == "__main__":
    main()
