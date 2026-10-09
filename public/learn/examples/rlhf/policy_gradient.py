"""Exact categorical gradients, estimator variance and the PPO clipping caveat.

python policy_gradient.py --output policy-gradient-results.json
Requires numpy and torch. All fixtures are constructed calculations.
"""
import argparse
import json
from pathlib import Path
import numpy as np
import torch
from preference_records import ROOT


def softmax(logits):
    weights = np.exp(logits - np.max(logits))
    return weights / weights.sum()


def objective(logits, rewards, reference, beta):
    probabilities = softmax(logits)
    return float(probabilities @ rewards - beta * np.sum(probabilities * np.log(probabilities / reference)))


def exact_gradient(probabilities, rewards, reference, beta=0):
    shaped = rewards - beta * np.log(probabilities / reference)
    # The derivative of log pi contributes -beta * E[score] = 0 exactly.
    return probabilities * (shaped - probabilities @ shaped)


def estimator_moments(probabilities, rewards, baseline):
    score = np.eye(len(probabilities)) - probabilities[None, :]
    samples = (rewards - baseline)[:, None] * score
    mean = probabilities @ samples
    variance = probabilities @ ((samples - mean) ** 2)
    return samples, mean, variance


def tilted(reference, rewards, beta):
    if beta <= 0 or np.any(reference < 0) or not np.isclose(reference.sum(), 1):
        raise ValueError("Need a probability reference and positive beta")
    supported = reference > 0
    logits = np.log(reference[supported]) + rewards[supported] / beta
    answer = np.zeros_like(reference)
    answer[supported] = softmax(logits)
    return answer


def clipped_surrogate(ratio, advantage, epsilon):
    return np.minimum(ratio * advantage, np.clip(ratio, 1 - epsilon, 1 + epsilon) * advantage)


def shared_parameter_witness():
    # Two states share theta with different features. Old theta=0 gives
    # action0 probabilities .5/.2; state2's smaller feature keeps it active.
    theta = torch.tensor(.7, dtype=torch.float64, requires_grad=True)
    old_probability = torch.tensor([.5, .2], dtype=torch.float64)
    p1, p2 = theta.sigmoid(), (-.1 * theta - np.log(4.)).sigmoid()
    ratios = torch.stack((p1, p2)) / old_probability
    advantages = torch.tensor([1., -1.], dtype=torch.float64)
    surrogate = torch.minimum(ratios * advantages, ratios.clamp(.8, 1.2) * advantages)
    first_grad = torch.autograd.grad(surrogate[0], theta, retain_graph=True)[0]
    combined_grad = torch.autograd.grad(surrogate.sum(), theta)[0]
    after = theta.detach() + .2 * combined_grad
    assert first_grad.item() == 0
    assert after.sigmoid() > p1
    return {"theta_before": theta.item(), "theta_after": after.item(),
            "ratios_before": ratios.tolist(), "ratio1_after": (after.sigmoid() / .5).item(),
            "first_local_gradient": first_grad.item(), "combined_gradient": combined_grad.item()}


def run():
    p = np.array([.25, .75])
    rewards = np.array([2., 0.])
    ref = np.array([.5, .5])
    logits = np.log(p)
    checks = []
    for beta in (0., .2):
        analytic = exact_gradient(p, rewards, ref, beta)
        variable = torch.tensor(logits, dtype=torch.float64, requires_grad=True)
        distribution = variable.softmax(-1)
        value = (distribution * torch.tensor(rewards)).sum() - beta * (distribution * (distribution.log() - torch.tensor(ref).log())).sum()
        value.backward()
        epsilon = 1e-6
        finite = np.array([(objective(logits + epsilon * np.eye(2)[j], rewards, ref, beta) -
                            objective(logits - epsilon * np.eye(2)[j], rewards, ref, beta)) / (2 * epsilon) for j in range(2)])
        assert np.allclose(analytic, variable.grad.numpy(), atol=1e-12)
        assert np.allclose(analytic, finite, atol=1e-8)
        checks.append({"beta": beta, "analytic": analytic.tolist(), "autograd": variable.grad.tolist(), "finite": finite.tolist()})
    rng = np.random.default_rng(41)
    draws = rng.choice(2, 20000, p=p)
    baselines = []
    for baseline in (0., .5, 1.5, 4.):
        estimates, mean, variance = estimator_moments(p, rewards, baseline)
        measured = estimates[draws].mean(axis=0)
        baselines.append({"baseline": baseline, "outcome_estimates": estimates.tolist(),
                          "exact_mean": mean.tolist(), "variance_per_logit": variance.tolist(),
                          "sample_mean": measured.tolist(), "standard_error": np.sqrt(variance / len(draws)).tolist()})
    # An action-dependent baseline equal to its reward annihilates every sample
    # and therefore biases this nonzero-gradient problem.
    biased = estimator_moments(p, rewards, rewards)[1]
    table = [{"advantage": a, "ratio": ratio, "surrogate": float(clipped_surrogate(ratio, a, .2))}
             for a in (2., -2.) for ratio in (.5, .8, 1., 1.2, 1.5)]
    return {"coordinates": "two unconstrained softmax logits z0,z1; score=e_action-p",
            "exact_checks": checks, "baseline_experiment": baselines,
            "biased_action_baseline_mean": biased.tolist(), "ppo_cases": table,
            "shared_parameter_witness": shared_parameter_witness(),
            "tilted_policy": tilted(np.array([.2, .5, .3]), np.log([1., 2., 4.]), 1.).tolist(),
            "zero_support_policy": tilted(np.array([.3, .7, 0.]), np.array([0., 0., 10.]), 1.).tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "policy-gradient-results.json")
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
