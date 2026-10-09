"""Rollout estimates, value/progress and complete finite-policy credit.

python prm_rollouts_rewards.py --output rewards.json
Requires NumPy and PyTorch. Exact finite fixtures test mechanisms; no Math-Shepherd
or PAV experiment is reproduced and no efficiency gain is inferred.
"""

import argparse
import json
import math
from pathlib import Path
import random

import numpy as np
import torch

CONTINUATIONS = [
    {"steps": ["From 2x=6, assert x=6."], "answer": "6"},
    {"steps": ["Divide by 3: x=2."], "answer": "2"},
    {"steps": ["Divide both sides by 2: x=3."], "answer": "3"},
    {"steps": ["Subtract 2: x=4."], "answer": "4"},
    {"steps": ["Change sign: x=-3."], "answer": "-3"},
    {"steps": ["Assert x=3.5."], "answer": "3.5"},
    {"steps": ["Repeat 2x=6 without finishing."], "answer": None},
    {"steps": ["Assert x=0."], "answer": "0"},
]


def estimates(outcomes):
    if not outcomes:
        return {"draws": 0, "successes": 0, "hard": None, "soft": None}
    successes = sum(bool(outcome) for outcome in outcomes)
    return {"draws": len(outcomes), "successes": successes,
            "hard": int(successes > 0), "soft": successes / len(outcomes)}


def binomial(value, budget):
    if not 0 <= value <= 1 or budget < 0:
        raise ValueError("Invalid success probability or rollout budget")
    if budget == 0:
        return {"distribution": [1.0], "hard_positive_probability": None,
                "soft_expectation": None, "soft_variance": None}
    probabilities = [math.comb(budget, k) * value ** k * (1 - value) ** (budget - k)
                     for k in range(budget + 1)]
    return {"distribution": probabilities,
            "hard_positive_probability": 1 - (1 - value) ** budget,
            "soft_expectation": sum(k / budget * p for k, p in enumerate(probabilities)),
            "soft_variance": sum((k / budget - value) ** 2 * p
                                 for k, p in enumerate(probabilities))}


def sampled_completions(value, budget, seed=31):
    if not 0 <= value <= 1 or budget < 0:
        raise ValueError("Invalid success probability or rollout budget")
    rng = random.Random(seed)
    return [int(rng.random() < value) for _ in range(budget)]


def consensus(first_error_rollout, first_error_judge):
    if len(first_error_rollout) != len(first_error_judge):
        raise ValueError("Both labelers must address the same full trajectories")
    retained, disagree, unknown = [], [], []
    for index, (a, b) in enumerate(zip(first_error_rollout, first_error_judge)):
        if a is None or b is None:
            unknown.append(index)
        elif a == b:
            retained.append(index)
        else:
            disagree.append(index)
    return {"total": len(first_error_rollout), "retained": retained,
            "disagree": disagree, "unknown": unknown}


def active_priority(probabilities, disagreements):
    """Annotation priority is a heuristic, never a substitute ground-truth label."""
    result = []
    for index, (masses, disagreement) in enumerate(zip(probabilities, disagreements)):
        if any(p < 0 for p in masses) or not math.isclose(sum(masses), 1):
            raise ValueError("Class probabilities must form a distribution")
        entropy = -sum(p * math.log(p) for p in masses if p > 0)
        result.append({"index": index, "entropy": entropy,
                       "disagreement": bool(disagreement),
                       "priority": entropy + float(bool(disagreement))})
    return sorted(result, key=lambda item: (-item["priority"], item["index"]))


def value_advantage(alpha=1.0):
    branches = [{"name": "A", "probabilities": [0.5, 0.5], "child_values": [0.75, 0.85]},
                {"name": "B", "probabilities": [0.5, 0.5], "child_values": [0.4, 0]}]
    for branch in branches:
        branch["parent_value"] = sum(p * q for p, q in zip(branch["probabilities"], branch["child_values"]))
        branch["selected_value"] = branch["child_values"][0]
        branch["advantage"] = branch["selected_value"] - branch["parent_value"]
        branch["score"] = branch["selected_value"] + alpha * branch["advantage"]
    return {"alpha": alpha, "branches": branches, "crossover": 1.4}


def policy_leaves(q=0.6, p_a=0.8, p_b=0.2, baseline=False):
    """Independent state logits govern first branch and each continuation.

    Score dlogπ/dlogit is action−probability. Shared terminal return therefore
    multiplies different scores. Enumerating every leaf computes expectation.
    """
    if not all(0 < p < 1 for p in (q, p_a, p_b)):
        raise ValueError("Finite-logit policy requires probabilities strictly inside (0,1)")
    expected_return = q * p_a + (1 - q) * p_b
    leaves = []
    gradient = np.zeros(3)
    baseline_score_expectation = np.zeros(3)
    for branch, branch_probability, branch_success in (("A", q, p_a), ("B", 1 - q, p_b)):
        for success in (1, 0):
            conditional = branch_success if success else 1 - branch_success
            mass = branch_probability * conditional
            score = np.array([(1 if branch == "A" else 0) - q,
                              success - p_a if branch == "A" else 0,
                              success - p_b if branch == "B" else 0])
            state_baselines = np.array([expected_return,
                                        p_a if branch == "A" else 0,
                                        p_b if branch == "B" else 0])
            credit = success - state_baselines if baseline else np.full(3, success)
            contribution = mass * score * credit
            gradient += contribution
            baseline_score_expectation += mass * score * state_baselines
            leaves.append({"branch": branch, "success": success, "mass": mass,
                           "score_derivatives": score.tolist(),
                           "credit": credit.tolist(), "expected_contribution": contribution.tolist()})
    return {"q": q, "p_a": p_a, "p_b": p_b, "expected_return": expected_return,
            "leaves": leaves, "gradient": gradient.tolist(),
            "baseline_score_expectation": baseline_score_expectation.tolist()}


def potential_shaping(potentials, gamma=0.9):
    if not 0 <= gamma <= 1 or len(potentials) < 2:
        raise ValueError("Supply at least two states and a discount in [0,1]")
    bonuses = [gamma * next_value - value for value, next_value in
               zip(potentials[:-1], potentials[1:])]
    weighted = [gamma ** index * bonus for index, bonus in enumerate(bonuses)]
    return {"potentials": list(potentials), "gamma": gamma, "bonuses": bonuses,
            "discounted_bonuses": weighted, "sum": sum(weighted),
            "telescoped": -potentials[0] + gamma ** len(bonuses) * potentials[-1],
            "omit_terminal_transition": sum(weighted[:-1])}


def return_to_go(rewards, gamma=1.0):
    result = [0.0] * len(rewards)
    future = 0.0
    for index in range(len(rewards) - 1, -1, -1):
        future = rewards[index] + gamma * future
        result[index] = future
    return result


def proxy_failures():
    """Concrete checker/rubric disagreement, not labels from a learned model."""
    expected_roots = {0, -1}
    offered_roots = {-1}
    return {
        "wrong_expansion_right_assertion": {"steps": ["2x+1=8", "2x=7", "x=3.5", "answer 3"],
                                           "final_checker": True, "first_local_error": 0},
        "lost_solution": {"equation": "x(x+1)=0", "offered_roots": sorted(offered_roots),
                          "checker_accepts_any_valid_root": bool(offered_roots & expected_roots),
                          "complete_solution_set_correct": offered_roots == expected_roots,
                          "omitted_roots": sorted(expected_roots - offered_roots)},
        "raw_length_bonus": {"two_steps": sum([0.1] * 2), "four_steps": sum([0.1] * 4),
                             "same_terminal_reward": 1},
        "format_rejection": {"correct_numeric_answer": 3, "supplied": "x = 3",
                             "integer_only_parser_accepts": "x = 3".isdigit()},
        "missing_suffix": {"local_classes": [2, 0, None], "target_mask": [1, 1, 0]},
    }


def pav_at_iterate(q=0.6, p_a=0.8, p_b=0.2, alpha=0.5):
    """One finite state: exact own-advantage surrogate gradient at old=current.

    State occupancy and advantage are detached constants in this derivative.
    Own advantage scales the direction by 1+alpha; it need not produce the same
    optimizer step. This toy does not establish a theorem for arbitrary provers.
    """
    initial_logit = math.log(q / (1 - q))
    theta = torch.tensor(initial_logit, dtype=torch.float64, requires_grad=True)
    current_q = theta.sigmoid()
    outcome = current_q * p_a + (1 - current_q) * p_b
    frozen_value = q * p_a + (1 - q) * p_b
    advantages = [p_a - frozen_value, p_b - frozen_value]
    surrogate = outcome + alpha * (current_q * advantages[0] + (1 - current_q) * advantages[1])
    outcome_gradient = torch.autograd.grad(outcome, theta, retain_graph=True)[0]
    surrogate_gradient = torch.autograd.grad(surrogate, theta)[0]
    return {"outcome_gradient": float(outcome_gradient),
            "surrogate_gradient": float(surrogate_gradient),
            "positive_scale": 1 + alpha, "frozen_advantages": advantages}


def verify():
    checks = []

    def close(name, actual, expected):
        if not np.allclose(actual, expected, atol=1e-12, rtol=1e-12):
            raise AssertionError(f"{name}: {actual} != {expected}")
        checks.append({"name": name, "passed": True})

    leaves = [int(continuation["answer"] == "3") for continuation in CONTINUATIONS]
    estimate = estimates(leaves)
    close("eight actual leaves", [estimate["hard"], estimate["soft"]], [1, 0.125])
    distribution = binomial(0.1, 8)
    close("binomial mass", sum(distribution["distribution"]), 1)
    close("hard-estimator bias", distribution["hard_positive_probability"], 0.56953279)
    close("soft mean and variance", [distribution["soft_expectation"], distribution["soft_variance"]], [0.1, 0.01125])
    assert estimates([])["soft"] is None and binomial(0.1, 0)["soft_variance"] is None
    checks.append({"name": "zero-budget unknown", "passed": True})
    agreed = consensus([0, 1, -1, 2, None], [0, 2, -1, None, 0])
    assert agreed == {"total": 5, "retained": [0, 2], "disagree": [1], "unknown": [3, 4]}
    checks.append({"name": "address-level consensus and missing labels", "passed": True})
    values = value_advantage()
    close("complete parent averages", [b["parent_value"] for b in values["branches"]], [0.8, 0.2])
    close("signed progress", [b["advantage"] for b in values["branches"]], [-0.05, 0.2])
    tie = value_advantage(1.4)
    close("value-progress crossover", tie["branches"][0]["score"], tie["branches"][1]["score"])

    policy = policy_leaves()
    close("complete policy mass", sum(leaf["mass"] for leaf in policy["leaves"]), 1)
    close("terminal expected reward", policy["expected_return"], 0.56)
    close("enumerated logit gradient", policy["gradient"], [0.144, 0.096, 0.064])
    logits = torch.tensor(np.log(np.array([0.6, 0.8, 0.2]) / np.array([0.4, 0.2, 0.8])),
                          dtype=torch.float64, requires_grad=True)
    q, p_a, p_b = logits.sigmoid()
    reward = q * p_a + (1 - q) * p_b
    reward.backward()
    close("ordinary Torch exact expectation", logits.grad.numpy(), policy["gradient"])
    with_baseline = policy_leaves(baseline=True)
    close("state baseline zero score expectation", with_baseline["baseline_score_expectation"], [0, 0, 0])
    close("state baseline preserves expectation", with_baseline["gradient"], policy["gradient"])
    shaped = potential_shaping([0.2, 0.5, 0.9, 0])
    close("potential transition bonuses", shaped["bonuses"], [0.25, 0.31, -0.9])
    close("terminal telescope", [shaped["sum"], shaped["telescoped"]], [-0.2, -0.2])
    close("omitting terminal changes return", shaped["omit_terminal_transition"], 0.529)
    close("return to go", return_to_go([0.1, 0.1, 1], 0.9), [1, 1, 1])
    own = pav_at_iterate()
    close("own advantage changes positive scale", own["surrogate_gradient"], own["outcome_gradient"] * 1.5)
    changed = policy_leaves(0.5, 0.9, 0.1)
    close("changed policy practice", [changed["expected_return"], *changed["gradient"]], [0.5, 0.2, 0.045, 0.045])
    close("changed potential practice", potential_shaping([0.4, 0.6, 0], 1)["sum"], -0.4)
    failures = proxy_failures()
    assert failures["lost_solution"]["checker_accepts_any_valid_root"]
    assert not failures["lost_solution"]["complete_solution_set_correct"]
    close("length proxy distinguishes equal outcomes", list(failures["raw_length_bonus"].values()), [0.2, 0.4, 1])
    checks.append({"name": "concrete checker coverage and missing-suffix failures", "passed": True})
    return {"checks": checks, "passed": len(checks), "torch": torch.__version__,
            "continuation_outcomes": leaves, "estimate": estimate, "binomial": distribution,
            "continuation_prefix": "2x=6", "continuations": CONTINUATIONS,
            "sampled_outcomes": sampled_completions(0.1, 8), "consensus": agreed,
            "value_advantage": values, "policy": policy, "baseline_policy": with_baseline,
            "potential": shaped, "own_advantage": own,
            "active_priority": active_priority([[0.9, 0.05, 0.05], [1/3, 1/3, 1/3], [0.2, 0.4, 0.4]], [False, False, True]),
            "practice_policy": changed,
            "proxy_failures": failures,
            "scope": "Exact constructed finite mechanisms; no fitted reward or efficiency claim"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    text = json.dumps(verify(), indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
