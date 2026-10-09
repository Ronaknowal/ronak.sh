"""Preference labels, calibration arithmetic and public-input aggregation.

Run: python preference_labels.py
All fixtures here are constructed. They do not measure an actual judge's quality.
"""
import json
import math


def logsumexp(values):
    if not values or not all(math.isfinite(x) for x in values):
        raise ValueError("Expected a nonempty list of finite log scores.")
    maximum = max(values)
    return maximum + math.log(sum(math.exp(x - maximum) for x in values))


def option_probability(logprob_a, logprob_b):
    """Conditional mass of A given that the scored complete option is A or B."""
    normalizer = logsumexp([logprob_a, logprob_b])
    return math.exp(logprob_a - normalizer)


def sequence_logprob(token_logprobs):
    """Use a sum, not a length-normalized score; EOS inclusion must be stated."""
    if not token_logprobs or not all(math.isfinite(x) and x <= 0 for x in token_logprobs):
        raise ValueError("Expected one or more finite nonpositive token log probabilities.")
    return sum(token_logprobs)


def checked_probability(value):
    if not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError("Probability must lie in [0, 1].")
    return value


def mapped_order_average(q_first_a, q_second_a):
    """First pass A=R1, second pass A=R2. Map second result back to R1."""
    if q_first_a is None or q_second_a is None:
        return {"mean_for_r1": None, "order_gap": None, "reason": "missing judge pass"}
    first = checked_probability(q_first_a)
    second_for_r1 = 1 - checked_probability(q_second_a)
    return {"mean_for_r1": (first + second_for_r1) / 2,
            "order_gap": abs(first - second_for_r1),
            "mapped_probabilities": [first, second_for_r1]}


def transform_label(q, mode="soft", lower=0.4, upper=0.6):
    q = checked_probability(q)
    if mode == "soft":
        return q
    if mode == "hard":
        # A .5 tie is not turned into an arbitrary winning response.
        return 0.5 if q == 0.5 else float(q > 0.5)
    if mode == "clamped":
        if not 0 <= lower <= upper <= 1:
            raise ValueError("Clamp bounds must satisfy 0 <= lower <= upper <= 1.")
        return min(upper, max(lower, q))
    raise ValueError("Mode must be soft, hard or clamped.")


def calibration(rows, bin_count=4):
    """Rows contain probability q and an independently supplied binary label."""
    if bin_count < 1:
        raise ValueError("At least one bin is required.")
    bins = [[] for _ in range(bin_count)]
    for row in rows:
        q = checked_probability(row["q"])
        if row["label"] not in (0, 1):
            raise ValueError("External labels must be binary.")
        bins[min(bin_count - 1, int(q * bin_count))].append(row)
    result = []
    for index, group in enumerate(bins):
        result.append({"bin": index, "count": len(group),
                       "mean_q": sum(r["q"] for r in group) / len(group) if group else None,
                       "observed_frequency": sum(r["label"] for r in group) / len(group) if group else None})
    return {"bins": result,
            "brier": sum((r["q"] - r["label"]) ** 2 for r in rows) / len(rows) if rows else None,
            "count": len(rows)}


def group_aware_consensus(group_probabilities):
    """The Collective CAI paper multiplies per-group agreement estimates."""
    if not group_probabilities or any(q is None for q in group_probabilities):
        return None
    return math.prod(checked_probability(q) for q in group_probabilities)


def majority_error(error_probability, correlated=False):
    """Three binary labels; independence is an assumption, not a measured property."""
    e = checked_probability(error_probability)
    if correlated:
        return e  # All three labels share exactly the same error bit.
    return 3 * e * e * (1 - e) + e ** 3


def main():
    rows = [{"q": .1, "label": 0}, {"q": .2, "label": 1},
            {"q": .6, "label": 1}, {"q": .8, "label": 1}]
    result = {
        "origin": "constructed arithmetic fixtures, not model evaluation",
        "conditional_choice": option_probability(math.log(.3), math.log(.1)),
        "other_probability_excluded": .6,
        "extreme_logit_choice": option_probability(-10000, -10001),
        "order_swap": mapped_order_average(.8, .4),
        "order_no_gap": mapped_order_average(.8, .2),
        "order_missing": mapped_order_average(.8, None),
        "label_variants": {mode: transform_label(.9, mode) for mode in ("soft", "hard", "clamped")},
        "calibration": calibration(rows),
        "gac": [group_aware_consensus([.9, .2]), group_aware_consensus([.65, .65])],
        "independent_majority_error": majority_error(.2),
        "shared_error": majority_error(.2, correlated=True),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
