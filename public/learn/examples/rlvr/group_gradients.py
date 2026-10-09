"""Exact finite score gradients, group estimators, clipping and KL routes.

python -B group_gradients.py --output group-results.json
Requires PyTorch. Enumerations and derivatives only; no model is fitted.
"""

import argparse
import itertools
import math
import random
import torch

from rlvr_data import emit


def group_advantages(rewards, scaled=True, correction=0, epsilon=1e-4):
    """Available rows define the baseline; missing rows get coefficient zero."""
    values = torch.as_tensor(rewards, dtype=torch.float64)
    available = torch.isfinite(values)
    count = int(available.sum())
    result = torch.zeros_like(values)
    if not count:
        return result, {"available": 0, "mean": None, "std": None}
    mean = values[available].mean()
    centred = values[available] - mean
    std = values[available].std(correction=correction) if count > correction else None
    if scaled and std is not None and float(std) + epsilon > 0:
        result[available] = centred / (std + epsilon)
    elif not scaled:
        result[available] = centred
    return result, {
        "available": count,
        "mean": float(mean),
        "std": None if std is None else float(std),
    }


def baseline_enumeration(p=0.25, group_size=4):
    """IID Bernoulli samples; derivative is with respect to its logit."""
    if not 0 < p < 1 or not 2 <= group_size <= 10:
        raise ValueError(
            "Need interior p and group size2–10 for this finite enumeration"
        )
    rows = []
    for outcomes in itertools.product([0.0, 1.0], repeat=group_size):
        successes = sum(outcomes)
        weight = p**successes * (1 - p) ** (group_size - successes)
        mean = successes / group_size
        scores = [outcome - p for outcome in outcomes]
        raw = (
            sum(outcome * score for outcome, score in zip(outcomes, scores))
            / group_size
        )
        same = (
            sum((outcome - mean) * score for outcome, score in zip(outcomes, scores))
            / group_size
        )
        loo = same * group_size / (group_size - 1)
        advantages, _ = group_advantages(outcomes, epsilon=0.0)
        # Homogeneous groups have zero coefficients; avoid 0/0 in the exact fixture.
        if successes in [0, group_size]:
            standardized = 0.0
        else:
            standardized = (
                sum(float(value) * score for value, score in zip(advantages, scores))
                / group_size
            )
        rows.append(
            {
                "outcomes": outcomes,
                "probability": weight,
                "no_baseline": raw,
                "same_group": same,
                "leave_one_out": loo,
                "standardized": standardized,
            }
        )
    moments = {}
    for field in ["no_baseline", "same_group", "leave_one_out", "standardized"]:
        mean = sum(row["probability"] * row[field] for row in rows)
        variance = sum(row["probability"] * (row[field] - mean) ** 2 for row in rows)
        moments[field] = {"mean_gradient": mean, "variance_gradient": variance}
    return {
        "p": p,
        "G": group_size,
        "rows": rows,
        "moments": moments,
        "exact_expected_reward_logit_gradient": p * (1 - p),
    }


def clipped_terms(ratios, advantages, epsilon=0.2):
    ratios = torch.as_tensor(ratios)
    advantages = torch.as_tensor(advantages, dtype=ratios.dtype, device=ratios.device)
    return torch.minimum(
        ratios * advantages, ratios.clamp(1 - epsilon, 1 + epsilon) * advantages
    )


def sampled_k3(current, reference):
    """Log probabilities at fixed sampled addresses; reference is detached."""
    delta = reference.detach() - current
    return delta.exp() - delta - 1


def kl_routes(p=0.8, q=0.5):
    theta = torch.tensor(math.log(p / (1 - p)), dtype=torch.float64, requires_grad=True)
    probability = torch.stack([theta.sigmoid(), 1 - theta.sigmoid()])
    reference = torch.tensor([q, 1 - q], dtype=torch.float64)
    exact = (probability * (probability.log() - reference.log())).sum()
    k3 = sampled_k3(probability.log(), reference.log())
    fixed_sampling = (probability.detach() * k3).sum()
    ratio_corrected = (
        probability.detach() * (probability / probability.detach()) * k3
    ).sum()
    values = {}
    for name, loss in [
        ("exact_expectation", exact),
        ("fixed_sample_partial", fixed_sampling),
        ("ratio_weighted_k3", ratio_corrected),
    ]:
        derivative = torch.autograd.grad(loss, theta, retain_graph=True)[0]
        values[name] = {
            "value": float(loss.detach()),
            "logit_derivative": float(derivative),
        }
    return {
        "p": p,
        "q": q,
        "terms": (probability * (probability.log() - reference.log()))
        .detach()
        .tolist(),
        "k3_per_action": k3.detach().tolist(),
        "routes": values,
    }


def finite_kl(policy, reference):
    """Zero policy mass contributes0; positive policy at zero reference gives∞."""
    if len(policy) != len(reference) or min(policy + reference) < 0:
        raise ValueError("Need matched nonnegative finite distributions")
    if not math.isclose(sum(policy), 1.0) or not math.isclose(sum(reference), 1.0):
        raise ValueError("Each distribution must sum to1")
    if any(p > 0 and q == 0 for p, q in zip(policy, reference)):
        return {
            "finite": False,
            "value": None,
            "reason": "positive policy mass outside reference support",
        }
    value = sum(p * math.log(p / q) for p, q in zip(policy, reference) if p > 0)
    return {"finite": True, "value": value}


def finite_curriculum_simulation(strategy, steps=24, group_size=4):
    """Two finite Bernoulli tasks share θ; this is not language-model training."""
    generator = random.Random(11)
    theta, difficulty, counts, history = 0.0, [-2.0, 1.0], [0, 0], []
    for step in range(steps):
        probabilities = [1 / (1 + math.exp(-theta - offset)) for offset in difficulty]
        mixed = [1 - p**group_size - (1 - p) ** group_size for p in probabilities]
        if strategy == "easy-first":
            weights = [0.0, 1.0] if step < steps // 2 else [1.0, 0.0]
        elif strategy == "mixed-rate":
            weights = [value / sum(mixed) for value in mixed]
        elif strategy == "uniform":
            weights = [0.5, 0.5]
        else:
            raise ValueError("unknown finite task scheduler")
        task = int(generator.random() >= weights[0])
        p = probabilities[task]
        outcomes = [int(generator.random() < p) for _ in range(group_size)]
        mean = sum(outcomes) / group_size
        gradient = (
            sum((outcome - mean) * (outcome - p) for outcome in outcomes) / group_size
        )
        before = theta
        theta += 0.15 * gradient
        counts[task] += 1
        history.append(
            {
                "step": step + 1,
                "task": task,
                "probabilities": probabilities,
                "mixed_probabilities": mixed,
                "proposed_weights": weights,
                "outcomes": outcomes,
                "same_group_logit_gradient": gradient,
                "theta_before": before,
                "theta_after": theta,
            }
        )
    return {
        "strategy": strategy,
        "initial_theta": 0.0,
        "learning_rate": 0.15,
        "task_offsets": difficulty,
        "G": group_size,
        "task_counts": counts,
        "history": history,
    }


def run():
    logits = torch.tensor(
        [math.log(0.2), math.log(0.5), math.log(0.3)],
        dtype=torch.float64,
        requires_grad=True,
    )
    probabilities = logits.softmax(-1)
    expected_return = probabilities[0]
    expected_return.backward()
    ratios = torch.tensor([1.4, 0.6, 0.9, 1.1], dtype=torch.float64, requires_grad=True)
    advantages = torch.tensor([1.0, -1.0, 1.0, -1.0], dtype=torch.float64)
    terms = clipped_terms(ratios, advantages)
    terms.mean().backward()
    groups = {}
    for name, rewards in [
        ("mixed", [1.0, 0.0, 1.0, 0.0]),
        ("all_fail", [0.0] * 4),
        ("all_pass", [1.0] * 4),
        ("one_missing", [1.0, 0.0, float("nan"), 0.0]),
        ("one_available", [1.0, float("nan"), float("nan"), float("nan")]),
    ]:
        groups[name] = {}
        for correction in [0, 1]:
            coeff, details = group_advantages(rewards, correction=correction)
            groups[name]["population" if correction == 0 else "sample"] = {
                **details,
                "advantages": coeff.tolist(),
            }
    lengths, per_token = [2, 6], [1.0, 3.0]
    reduction = {
        "lengths": lengths,
        "per_token_contributions": per_token,
        "response_equal": sum(per_token) / 2,
        "pooled_tokens": sum(n * value for n, value in zip(lengths, per_token))
        / sum(lengths),
        "fixed_max6": sum(n * value for n, value in zip(lengths, per_token)) / (2 * 6),
    }
    assert torch.allclose(
        logits.grad, torch.tensor([0.16, -0.1, -0.06], dtype=torch.float64)
    )
    assert torch.allclose(
        ratios.grad, torch.tensor([0.0, 0.0, 0.25, -0.25], dtype=torch.float64)
    )
    return {
        "finite_objective": {
            "probabilities": probabilities.detach().tolist(),
            "rewards": [1, 0, 0],
            "expected_return": float(expected_return.detach()),
            "logit_gradient": logits.grad.tolist(),
        },
        "groups": groups,
        "enumeration": baseline_enumeration(),
        "signed_clip": {
            "ratios": ratios.detach().tolist(),
            "advantages": advantages.tolist(),
            "terms": terms.detach().tolist(),
            "mean": float(terms.mean().detach()),
            "surrogate_ratio_derivatives": ratios.grad.tolist(),
        },
        "reductions": reduction,
        "KL": kl_routes(),
        "support": [
            finite_kl([0.8, 0.2], [0.5, 0.5]),
            finite_kl([1.0, 0.0], [0.0, 1.0]),
        ],
        "sampling_events": [
            {
                "p": p,
                "G": g,
                "any_success": 1 - (1 - p) ** g,
                "mixed": 1 - (1 - p) ** g - p**g,
                "all_success": p**g,
            }
            for p, g in [(0.25, 4), (0.9, 4), (0.8, 5)]
        ],
        "finite_curriculum": [
            finite_curriculum_simulation(name)
            for name in ["uniform", "easy-first", "mixed-rate"]
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="group-results.json")
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print(
        {
            "expected_return": result["finite_objective"]["expected_return"],
            "clip_mean": result["signed_clip"]["mean"],
            "KL_routes": result["KL"]["routes"],
        }
    )


if __name__ == "__main__":
    main()
