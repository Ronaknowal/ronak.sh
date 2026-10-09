"""Enumerate local masking versus model conditioning on valid completion.

python conditioning.py
Exact fractions. A viable grammar branch may have zero allowed model mass.
Local failure remains explicit; it is not silently resampled at the root.
"""

from fractions import Fraction as F
import json


def compare(priors, future):
    priors, future = tuple(map(F, priors)), tuple(map(F, future))
    if (
        len(priors) != len(future)
        or sum(priors) != 1
        or any(p < 0 for p in priors)
        or any(not 0 <= h <= 1 for h in future)
    ):
        raise ValueError(
            "Normalized nonnegative prior and future masses in [0,1] required"
        )
    accepted = tuple(p * h for p, h in zip(priors, future))
    total = sum(accepted)
    local = tuple(p if h > 0 else F(0) for p, h in zip(priors, future))
    return {
        "original_accepted": accepted,
        "valid_mass": total,
        "global": tuple(p / total for p in accepted) if total else None,
        "local_success": local,
        "local_failure": 1 - sum(local),
        "expected_attempts_until_valid": 1 / total if total else None,
    }


def main():
    cases = [
        compare(["1/2", "1/2"], future)
        for future in [("1/10", "9/10"), ("9/10", "9/10"), ("0", "9/10"), ("0", "0")]
    ]
    print(json.dumps(cases, default=str, indent=2))


if __name__ == "__main__":
    main()
