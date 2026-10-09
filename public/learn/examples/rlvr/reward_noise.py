"""Constructed verifier errors, oracle correction and correlated test masks.

python -B reward_noise.py --output noise-results.json
No fitted model. Truth labels and error rates are supplied fixture annotations.
"""

import argparse
import itertools
import math

from rlvr_data import emit


def coefficients(values, epsilon=0.0):
    mean = sum(values) / len(values)
    std = math.sqrt(sum((value - mean) ** 2 for value in values) / len(values))
    return [
        (value - mean) / (std + epsilon) if std + epsilon else 0.0 for value in values
    ]


def error_channel(prevalence=0.2, false_positive=0.1, false_negative=0.2):
    if not all(
        0 <= value <= 1 for value in [prevalence, false_positive, false_negative]
    ):
        raise ValueError("Probabilities must lie in[0,1]")
    cells = {
        "true_accept": prevalence * (1 - false_negative),
        "true_reject": prevalence * false_negative,
        "false_accept": (1 - prevalence) * false_positive,
        "false_reject": (1 - prevalence) * (1 - false_positive),
    }
    accepted = cells["true_accept"] + cells["false_accept"]
    scale = 1 - false_positive - false_negative
    return {
        "prevalence": prevalence,
        "FP": false_positive,
        "FN": false_negative,
        "joint_mass": cells,
        "accepted_probability": accepted,
        "precision": cells["true_accept"] / accepted if accepted else None,
        "gradient_multiplier": scale,
        "oracle_corrected_binary_rewards": (
            [-false_positive / scale, (1 - false_positive) / scale]
            if scale > 0
            else None
        ),
    }


def mask_results(clean, mask):
    observed = [
        [int(bool(cell) != bool(flip)) for cell, flip in zip(row, fliprow)]
        for row, fliprow in zip(clean, mask)
    ]
    rewards = [sum(row) / len(row) for row in observed]
    return {
        "mask": mask,
        "observed": observed,
        "reward": rewards,
        "advantages": coefficients(rewards),
    }


def enumerate_channel(prevalence=0.2, fp=0.1, fn=0.2):
    """Finite truth/accept pairs; exact oracle gradient expectation and variance."""
    values = []
    for truth, observed in itertools.product([0, 1], repeat=2):
        truth_mass = prevalence if truth else 1 - prevalence
        observed_chance = (
            (1 - fn if truth else fp) if observed else (fn if truth else 1 - fp)
        )
        corrected = (observed - fp) / (1 - fp - fn)
        score = truth - prevalence
        values.append(
            {
                "truth": truth,
                "observed": observed,
                "probability": truth_mass * observed_chance,
                "noisy_score_gradient": observed * score,
                "corrected_score_gradient": corrected * score,
                "clean_score_gradient": truth * score,
            }
        )
    moments = {}
    for name in [
        "clean_score_gradient",
        "noisy_score_gradient",
        "corrected_score_gradient",
    ]:
        mean = sum(row["probability"] * row[name] for row in values)
        variance = sum(row["probability"] * (row[name] - mean) ** 2 for row in values)
        moments[name] = {"mean": mean, "variance": variance}
    return {"rows": values, "moments": moments}


def run():
    channel = error_channel()
    raw = [1.0, 0.0, 1.0, 0.0]
    corrected = [(value - 0.1) / 0.7 for value in raw]
    clean = [[1, 1, 1], [1, 0, 1], [0, 0, 1], [0, 0, 0]]
    masks = {
        "cell": [[1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        "row": [[1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        "column": [[1, 0, 0]] * 4,
        "whole_group": [[1, 1, 1]] * 4,
    }
    pc, alpha, beta = 0.25, 0.8, 0.2
    mean = pc * alpha + (1 - pc) * beta
    std = math.sqrt(mean * (1 - mean))
    reasoning = {
        "reasoning_probability": pc,
        "answer_given_correct_reasoning": alpha,
        "answer_given_incorrect_reasoning": beta,
        "joint_mass": [
            [pc * alpha, pc * (1 - alpha)],
            [(1 - pc) * beta, (1 - pc) * (1 - beta)],
        ],
        "answer_probability": mean,
        "answer_population_std": std,
        "limiting_conditional_advantages": [(alpha - mean) / std, (beta - mean) / std],
    }
    return {
        "channel": channel,
        "enumerated_channel": enumerate_channel(),
        "normalization": {
            "raw": raw,
            "corrected": corrected,
            "epsilon_zero": [coefficients(raw), coefficients(corrected)],
            "fixed_epsilon": [coefficients(raw, 1e-4), coefficients(corrected, 1e-4)],
            "scaled_epsilon": [
                coefficients(raw, 1e-4),
                coefficients(corrected, 1e-4 / 0.7),
            ],
        },
        "clean_grid": clean,
        "corruptions": {
            name: mask_results(clean, mask) for name, mask in masks.items()
        },
        "reasoning_joint_distribution": reasoning,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="noise-results.json")
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print(
        {
            "accepted_probability": result["channel"]["accepted_probability"],
            "gradient_multiplier": result["channel"]["gradient_multiplier"],
            "oracle_rewards": result["channel"]["oracle_corrected_binary_rewards"],
        }
    )


if __name__ == "__main__":
    main()
