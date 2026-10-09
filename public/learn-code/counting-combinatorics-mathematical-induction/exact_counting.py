"""Exact finite counting with SymPy 1.14.0, without positional duplicates."""
from itertools import product

from sympy import Poly, symbols
from sympy.utilities.iterables import multiset_permutations, necklaces


def exact_allocation_count(total, capacities, minimums=None):
    if isinstance(total, bool) or not isinstance(total, int) or not 0 <= total <= 24:
        raise ValueError("total must be a concrete integer in 0..24")
    if not isinstance(capacities, tuple) or len(capacities) > 4:
        raise ValueError("use a tuple of at most four capacities")
    if minimums is None:
        minimums = (0,) * len(capacities)
    if not isinstance(minimums, tuple) or len(minimums) != len(capacities):
        raise ValueError("minimums must be a matching tuple")
    if any(isinstance(v, bool) or not isinstance(v, int) or not 0 <= v <= 6
           for v in capacities + minimums):
        raise ValueError("each bound must be a concrete integer in 0..6")
    if any(low > high for low, high in zip(minimums, capacities)):
        return 0
    x = symbols("x")
    polynomial = Poly(1, x, domain="ZZ")
    for low, high in zip(minimums, capacities):
        factor = Poly(sum(x**amount for amount in range(low, high + 1)),
                      x, domain="ZZ")
        polynomial *= factor
    return int(polynomial.nth(total))


def fixed_binary_patterns(sites, shift):
    if isinstance(sites, bool) or not isinstance(sites, int) or not 1 <= sites <= 8:
        raise ValueError("sites must be a concrete integer in 1..8")
    if isinstance(shift, bool) or not isinstance(shift, int) or not 0 <= shift < sites:
        raise ValueError("shift must name an actual rotation of this ring")
    visited = set()
    cycles = 0
    for start in range(sites):
        if start in visited:
            continue
        cycles += 1
        position = start
        while position not in visited:
            visited.add(position)
            position = (position + shift) % sites
    # A fixed pattern is constant on each cycle; each cycle chooses one bit.
    return 2**cycles


if __name__ == "__main__":
    distinct = ["".join(word) for word in multiset_permutations("NOON")]
    print("distinct NOON strings:", distinct)
    assert len(distinct) == len(set(distinct)) == 6
    for total, capacities, minimums in [
        (3, (2, 3, 1), (0, 0, 0)),
        (7, (4, 3, 3), (1, 0, 2)),
        (4, (1, 2, 2), (0, 0, 0)),
        (0, (), ()),
        (2, (), ()),
    ]:
        count = exact_allocation_count(total, capacities, minimums)
        direct = sum(sum(values) == total for values in product(
            *(range(low, high + 1) for low, high in zip(minimums, capacities))))
        assert count == direct
        print("allocation:", total, capacities, minimums, "->", count)
    for sites in (4, 5, 6):
        representatives = list(necklaces(sites, 2, free=False))
        fixed = [fixed_binary_patterns(sites, shift) for shift in range(sites)]
        assert sum(fixed) == sites * len(representatives)
        print("rotation-only binary rings:", sites, "->", len(representatives))
