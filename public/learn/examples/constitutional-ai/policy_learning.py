"""Actual normalized finite-action SFT, KL policy optimization and DPO.

Run: python -m pip install numpy==2.3.5
     python policy_learning.py
Each action is a complete fixed candidate response. This is not open-ended PPO.
"""
import json
import numpy as np


def distribution(logits, reference=None):
    logits = np.asarray(logits, dtype=float)
    if logits.ndim != 1 or not len(logits) or not np.all(np.isfinite(logits)):
        raise ValueError("Supply a nonempty finite vector of logits.")
    supported = np.ones(len(logits), dtype=bool)
    if reference is not None:
        reference = validate_reference(reference, len(logits))
        supported = reference > 0
    shifted = logits[supported] - np.max(logits[supported])
    mass = np.exp(shifted)
    probabilities = np.zeros(len(logits))
    probabilities[supported] = mass / mass.sum()
    return probabilities


def log_distribution(logits, reference=None):
    """Compute supported log probabilities directly, avoiding log(underflowed p)."""
    logits = np.asarray(logits, dtype=float)
    # Reuse validation and support rules without using rounded probability values.
    distribution(logits, reference)
    supported = np.ones(len(logits), dtype=bool) if reference is None else np.asarray(reference) > 0
    maximum = np.max(logits[supported])
    normalizer = maximum + np.log(np.exp(logits[supported] - maximum).sum())
    result = np.full(len(logits), -np.inf)
    result[supported] = logits[supported] - normalizer
    return result


def validate_reference(reference, size):
    reference = np.asarray(reference, dtype=float)
    if (reference.shape != (size,) or not np.all(np.isfinite(reference))
            or np.any(reference < 0) or not np.isclose(reference.sum(), 1.0)):
        raise ValueError("Reference must be a normalized nonnegative probability vector.")
    return reference


def kl_objective(probabilities, reference, rewards, beta):
    probabilities = validate_reference(probabilities, len(rewards))
    reference = validate_reference(reference, len(rewards))
    rewards = np.asarray(rewards, dtype=float)
    if not np.all(np.isfinite(rewards)) or not np.isfinite(beta) or beta < 0:
        raise ValueError("Rewards must be finite; beta must be finite and nonnegative.")
    if np.any((probabilities > 0) & (reference == 0)):
        raise ValueError("Positive policy mass outside reference support has infinite KL.")
    active = probabilities > 0
    kl = float(np.sum(probabilities[active] * np.log(probabilities[active] / reference[active])))
    expected_reward = float(probabilities @ rewards)
    return expected_reward - beta * kl, expected_reward, kl


def optimum(reference, rewards, beta):
    reference = validate_reference(reference, len(rewards))
    rewards = np.asarray(rewards, dtype=float)
    supported = reference > 0
    if not np.all(np.isfinite(rewards)) or not np.isfinite(beta) or beta < 0:
        raise ValueError("Rewards must be finite; beta must be finite and nonnegative.")
    if beta == 0:
        # The beta->0+ limit splits tied maximizing actions by reference mass.
        best = supported & (rewards == np.max(rewards[supported]))
        result = np.zeros(len(rewards))
        result[best] = reference[best] / reference[best].sum()
        return result
    log_weights = np.zeros(len(rewards))
    log_weights[supported] = np.log(reference[supported]) + rewards[supported] / beta
    return distribution(log_weights, reference)


def kl_gradient(logits, reference, rewards, beta):
    probabilities = distribution(logits, reference)
    objective, _, _ = kl_objective(probabilities, reference, rewards, beta)
    supported = probabilities > 0
    adjusted_reward = np.zeros(len(probabilities))
    adjusted_reward[supported] = (
        np.asarray(rewards)[supported] - beta * np.log(probabilities[supported] / np.asarray(reference)[supported]))
    # Maximization gradient. The common -beta term cancels under softmax.
    gradient = probabilities * (adjusted_reward - objective)
    return objective, gradient, probabilities


def sft_loss(logits, target):
    probabilities = distribution(logits)
    target = validate_reference(target, len(logits))
    log_probabilities = log_distribution(logits)
    return float(-np.sum(target * log_probabilities)), probabilities - target


def dpo_loss(logits, reference, chosen, rejected, beta=.5, target=1.0):
    if not np.isfinite(beta) or beta <= 0 or not 0 <= target <= 1:
        raise ValueError("DPO beta must be positive and target in [0, 1].")
    probabilities = distribution(logits, reference)
    reference = np.asarray(reference, dtype=float)
    if not all(0 <= index < len(logits) for index in (chosen, rejected)):
        raise ValueError("Candidate index is outside this policy.")
    if reference[chosen] == 0 or reference[rejected] == 0:
        raise ValueError("Both compared responses require positive reference support.")
    log_probabilities = log_distribution(logits, reference)
    log_ratio_chosen = log_probabilities[chosen] - np.log(reference[chosen])
    log_ratio_rejected = log_probabilities[rejected] - np.log(reference[rejected])
    margin = beta * (log_ratio_chosen - log_ratio_rejected)
    preference_probability = float(np.exp(-np.logaddexp(0, -margin)))
    loss = float(np.logaddexp(0, margin) - target * margin)
    gradient = np.zeros(len(logits))
    gradient[chosen] += beta * (preference_probability - target)
    gradient[rejected] -= beta * (preference_probability - target)
    return loss, gradient, preference_probability


def main():
    reference = np.array([.6, .2, .2])
    rewards = np.array([0.0, 0.0, 1.0])
    logits = np.log(reference)
    initial_sft, sft_gradient = sft_loss(logits, [0, 0, 1])
    sft_after = distribution(logits - .2 * sft_gradient)
    optimized = logits.copy()
    for _ in range(300):
        _, gradient, _ = kl_gradient(optimized, reference, rewards, 1.0)
        optimized += .2 * gradient
    objective, _, trained = kl_gradient(optimized, reference, rewards, 1.0)
    exact = optimum(reference, rewards, 1.0)
    dpo_before, gradient, pair_probability = dpo_loss(logits, reference, 2, 0)
    dpo_logits_after = logits - .2 * gradient
    dpo_after = dpo_loss(dpo_logits_after, reference, 2, 0)[0]
    identical = dpo_loss(logits, reference, 2, 2)
    result = {
        "origin": "three fixed constructed candidate responses, not language-model PPO",
        "reference": reference.tolist(), "rewards": rewards.tolist(),
        "sft_loss_before": initial_sft, "sft_gradient": sft_gradient.tolist(),
        "sft_probabilities_after_one_step": sft_after.tolist(),
        "kl_beta": 1.0, "policy_after_300_steps": trained.tolist(),
        "exact_optimum": exact.tolist(), "max_optimum_difference": float(np.max(np.abs(trained - exact))),
        "objective_after": objective, "equal_reward_null": optimum(reference, [2, 2, 2], 1).tolist(),
        "zero_reference_support": optimum([.75, .25, 0], rewards, 1).tolist(),
        "beta_zero_limit": optimum(reference, rewards, 0).tolist(),
        "dpo": {"loss_before": dpo_before, "loss_after_one_step": dpo_after,
                "preference_probability_before": pair_probability,
                "probabilities_after": distribution(dpo_logits_after).tolist()},
        "identical_pair": {"loss": identical[0], "gradient": identical[1].tolist()},
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
