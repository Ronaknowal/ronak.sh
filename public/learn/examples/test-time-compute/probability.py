"""Exact opportunity, binary majority, plurality and retained-pool pass@k.

python probability.py
Finite enumeration is a reference calculation, not a scalable LLM simulator.
"""
from itertools import product
from math import comb, isfinite
import json


def validate_probability(p):
    if not isfinite(p) or not 0 <= p <= 1:
        raise ValueError("Probability must be in [0,1]")


def opportunity(p, count):
    validate_probability(p)
    if not isinstance(count, int) or count < 0:
        raise ValueError("Nonnegative integer count required")
    return 1 - (1 - p) ** count


def binary_majority(p, count):
    validate_probability(p)
    if not isinstance(count, int) or count < 1 or count % 2 == 0:
        raise ValueError("Use a positive odd vote count; no tie case")
    return sum(comb(count, k) * p ** k * (1 - p) ** (count - k)
               for k in range(count // 2 + 1, count + 1))


def plurality(probabilities, count):
    """Enumerate iid draws and break ties by first occurrence in each draw.

    The count limit bounds exponential work for this teaching oracle.
    """
    if not 1 <= count <= 8 or not 1 <= len(probabilities) <= 4:
        raise ValueError("Oracle supports up to four answers and eight draws")
    for p in probabilities:
        validate_probability(p)
    if abs(sum(probabilities) - 1) > 1e-12:
        raise ValueError("Mass must sum to one")
    wins = [0.0] * len(probabilities)
    for draws in product(range(len(probabilities)), repeat=count):
        mass = 1.0
        for answer in draws:
            mass *= probabilities[answer]
        counts = [draws.count(a) for a in range(len(probabilities))]
        maximum = max(counts)
        winner = next(a for a in draws if counts[a] == maximum)
        wins[winner] += mass
    return wins


def pass_at_k(total, correct, k):
    if any(not isinstance(v, int) for v in (total, correct, k)):
        raise ValueError("Counts must be integers")
    if not 0 <= correct <= total or not 1 <= k <= total:
        raise ValueError("Require 0<=correct<=total and 1<=k<=total")
    # Python integers make this exact ratio safe for the bounded lesson pool.
    return 1 - comb(total - correct, k) / comb(total, k)


if __name__ == "__main__":
    print(json.dumps({"independent_opportunity": opportunity(.3, 4),
                     "identical_duplicate_opportunity": .3,
                     "binary_three": binary_majority(.55, 3),
                     "plurality_seven": plurality([.4, .35, .25], 7),
                     "pool_pass2": pass_at_k(8, 2, 2)}, indent=2))
