"""Changed-input numerical solutions for the decoding practice.

python practice_answers.py
Uses direct arithmetic, Fraction and enumeration rather than the lesson filters.
"""

from fractions import Fraction as F
import json
import math


def normalized(values):
    total = sum(values)
    return [value / total for value in values]


def solve():
    answers = {}
    answers["1"] = {"u_074_token_index": 1, "u_075_token_index": 2,
                    "cdf": [.4, .75, .9, 1]}
    answers["2"] = {"q": [str(x) for x in normalized([F(16), F(4), F(1)])], "odds": 4}
    answers["3"] = {"limit": [.5, .5, 0], "entropy_nats": math.log(2)}
    answers["4"] = {"threshold_q": [str(x) for x in normalized([F(45), F(20), F(20)])],
                    "exact_k_q": [str(x) for x in normalized([F(45), F(20)])]}
    answers["5"] = {"nucleus_070_ids": [0, 1], "nucleus_071_ids": [0, 1, 2]}
    answers["6"] = {"cutoff": .15, "q": [str(x) for x in normalized([F(60), F(20), F(15)])],
                    "m0_keeps": [0, 1, 2, 3], "m1_keeps": [0]}
    roots = [math.sqrt(x) for x in [.8, .15, .05]]
    heated = normalized(roots)
    answers["7"] = {"temperature_first": normalized(heated[:2]),
                    "temperature_first_keeps": [0, 1], "filter_first_q": [1, 0, 0]}
    p = [.5, .25, .15, .1]
    surprise = [-math.log(x) for x in p]
    H = sum(x * s for x, s in zip(p, surprise))
    order = sorted(range(4), key=lambda i: (abs(surprise[i] - H), i))
    answers["8"] = {"entropy": H, "surprisal": surprise, "distance_order": order,
                    "typical_035_ids": order[:2], "typical_035_mass": sum(p[i] for i in order[:2])}
    answers["9"] = {"signed_penalty": [-3, 4 / 3], "additive_bias": [-2.5, 1.5]}
    answers["10"] = {"prefix_map": {"red": ["blue"], "blue": ["red"]}, "banned": ["blue"]}
    answers["11"] = {"decoded": "friendship", "stop_start": 3, "stop_end": 6,
                     "overhang": "ship", "trimmed_before_stop": "fri"}
    tree = {"A X EOS": F(55, 100) * F(4, 10),
            "A Y EOS": F(55, 100) * F(35, 100),
            "A EOS": F(55, 100) * F(25, 100),
            "B X EOS": F(4, 10) * F(8, 10),
            "B EOS": F(4, 10) * F(2, 10), "EOS": F(5, 100)}
    assert sum(tree.values()) == 1
    answers["12"] = {"paths": {k: str(v) for k, v in tree.items()},
                     "greedy": "A X EOS", "best": max(tree, key=tree.get)}
    answers["13"] = {"raw": [math.log(.3), math.log(.25)],
                     "normalized": [math.log(.3) / 2, math.log(.25) / 5],
                     "raw_winner": 0, "normalized_winner": 1}
    answers["14"] = {"bound": -1.2 / 6, "stop_with_minus025": False, "stop_with_minus015": True}
    masses = [F(3, 10) * F(1, 2), F(7, 10) * F(3, 4)]
    answers["15"] = {"global_conditioned": [str(x) for x in normalized(masses)],
                     "local_first_masses": [.3, .7]}
    answers["16"] = {"top_k50": "rank-truncated sampling", "ties": "may retain more than k",
                     "limit32_without_eos": "capped"}
    answers["17"] = {"empty_distinct2": None, "one_token_distinct2": None,
                     "ids_4_4_7_4_4_7_distinct2": str(F(3, 5)), "quality_inference": False}
    answers["18"] = {"cells_by_step": [4000, 2400, 2400, 1600], "total": 10400,
                     "fixed_frontier_not_replenished": True, "measured_latency": None}
    return answers


if __name__ == "__main__":
    print(json.dumps(solve(), indent=2))
