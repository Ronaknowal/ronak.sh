"""Exact Decimal prefix-cache charges, break-even and strict-saving counts."""

from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR
import json


def number(value):
    out = Decimal(str(value))
    if not out.is_finite() or out < 0:
        raise ValueError("Charges must be finite and nonnegative.")
    return out


def decision(write, normal, hit, storage, hits):
    if type(hits) is not int or hits < 0:
        raise ValueError("hits must be a nonnegative integer.")
    write, normal, hit, storage = map(number, [write, normal, hit, storage])
    overhead, benefit = write - normal + storage, normal - hit
    cached, uncached = write + hits * hit + storage, (hits + 1) * normal
    if benefit > 0:
        tie = max(0, int((overhead / benefit).to_integral_value(rounding=ROUND_CEILING)))
        strict = max(0, int((overhead / benefit).to_integral_value(rounding=ROUND_FLOOR)) + 1)
    else:
        # With zero/negative per-hit benefit, extra hits cannot improve saving.
        tie = 0 if overhead <= 0 else None
        strict = 0 if overhead < 0 else None
    return {
        "cached": str(cached),
        "uncached": str(uncached),
        "saving": str(uncached - cached),
        "fixed_overhead": str(overhead),
        "per_hit_benefit": str(benefit),
        "first_not_more_expensive": tie,
        "first_strictly_cheaper": strict,
        "extra_hits_improve_saving": benefit > 0,
    }


def verify():
    cases = [
        decision("1.25", "1", ".1", s, n) for s in ["0", ".65", "1.55", "3"] for n in range(11)
    ]
    tie = decision("4", "1", ".4", ".6", 6)
    assert tie["first_not_more_expensive"] == 6 and tie["first_strictly_cheaper"] == 7
    assert tie["saving"] == "0.0"
    no_benefit = decision("2", "1", "1", "0", 20)
    assert no_benefit["first_not_more_expensive"] is None
    return {
        "cases": cases,
        "integer_tie": tie,
        "no_benefit": no_benefit,
        "initial_discount_negative_benefit": decision(".5", "1", "2", "0", 2),
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
