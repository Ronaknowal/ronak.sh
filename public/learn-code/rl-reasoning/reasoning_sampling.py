"""Trace a temperature/nucleus sampler and finite-budget success probabilities.
Run: python reasoning_sampling.py
Nucleus rule matches Synthetic Data Generation's synthetic_sampling.py.
"""
import json
import math
from sequence_policy import INITIAL, ANSWERS, softmax


def nucleus(logits, temperature=1., top_p=1.):
    if temperature <= 0 or not math.isfinite(temperature) or not 0 < top_p <= 1:
        raise ValueError("Need positive temperature and 0 < top_p <= 1")
    peak = max(logits)
    probabilities = softmax([(value - peak) / temperature for value in logits])
    order = sorted(range(len(logits)), key=lambda i: -probabilities[i])
    kept, mass = [], 0.
    for index in order:
        kept.append(index)
        mass += probabilities[index]
        if mass >= top_p:
            break
    return {"original": probabilities, "kept": kept, "retained_mass": mass,
            "sampled": [p / mass if i in kept else 0. for i, p in enumerate(probabilities)]}


def success_probability(logits=INITIAL, temperature=1., top_p=1.):
    nodes = [nucleus(row, temperature, top_p) for row in logits]
    final_index = ANSWERS.index(15)
    success = math.fsum(p * nodes[i + 1]["sampled"][final_index]
                        for i, p in enumerate(nodes[0]["sampled"]))
    return {"nodes": nodes, "success_probability": success}


def group_probabilities(p, group):
    if not 0 <= p <= 1 or not isinstance(group, int) or group < 1:
        raise ValueError("Need probability and positive integer group")
    failed, successful = (1 - p) ** group, p ** group
    return {"all_failed": failed, "all_successful": successful,
            "mixed": max(0., 1 - failed - successful)}


def no_success_upper_bound(n, alpha=.05):
    if n < 1 or not 0 < alpha < 1:
        raise ValueError("Need positive sample count and 0 < alpha < 1")
    return -math.expm1(math.log(alpha) / n)


if __name__ == "__main__":
    print(json.dumps({"full": success_probability(), "nucleus": success_probability(top_p=.5),
                      "group_p01_G8": group_probabilities(.1, 8),
                      "zero_of256_one_sided95_upper": no_success_upper_bound(256)}, indent=2))
