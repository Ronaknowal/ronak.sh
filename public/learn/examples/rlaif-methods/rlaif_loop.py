"""Two finite-action RLAIF mechanisms with exact and sampled gradients.

python -B rlaif_loop.py --feedback feedback-results.json --output loop-results.json
Requires torch and numpy. Reuses inspected RLHF categorical mechanics.
These closed-world 64-step traces do not measure assistant quality.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch

from records_and_masks import digest_file, emit


def exact_gradient(probabilities, rewards, reference, beta):
    """Inspected RLHF expectation: derivative of E[r] - beta KL(pi || ref)."""
    shaped = rewards - beta * np.log(probabilities / reference)
    return probabilities * (shaped - probabilities @ shaped)


def gradient_probe():
    probabilities = np.array([.25, .75])
    rewards = np.array([2., 0.])
    reference = np.array([.5, .5])
    logits = torch.tensor(np.log(probabilities), dtype=torch.float64, requires_grad=True)
    current = logits.softmax(-1)
    reward = torch.tensor(rewards)
    ref = torch.tensor(reference)
    objective = current @ reward - .1 * (current * (current.log() - ref.log())).sum()
    objective.backward()
    analytical = exact_gradient(probabilities, rewards, reference, .1)
    assert np.allclose(analytical, logits.grad.numpy(), atol=1e-12)
    # Enumerating the expectation verifies baseline cancellation, without sampling.
    baseline = probabilities @ rewards
    score_vectors = np.eye(2) - probabilities[None, :]
    centered = probabilities @ ((rewards - baseline)[:, None] * score_vectors)
    uncentered = probabilities @ (rewards[:, None] * score_vectors)
    assert np.allclose(centered, uncentered, atol=1e-12)
    return {"probabilities": probabilities.tolist(), "rewards": rewards.tolist(),
            "reference": reference.tolist(), "objective": objective.item(),
            "analytical_gradient": analytical.tolist(), "autograd": logits.grad.tolist(),
            "baseline": float(baseline), "reward_gradient": centered.tolist()}


def trace(rewards):
    generator = torch.Generator().manual_seed(17)
    logits = torch.nn.Parameter(torch.zeros(2, dtype=torch.float64))
    reference = torch.tensor([.5, .5], dtype=torch.float64)
    rewards = torch.tensor(rewards, dtype=torch.float64)
    optimizer = torch.optim.SGD([logits], lr=.05)
    history = []
    for step in range(65):
        probabilities = logits.softmax(-1)
        expected_reward = (probabilities * rewards).sum()
        kl = (probabilities * (probabilities.log() - reference.log())).sum()
        row = {"step": step, "logits": logits.detach().tolist(),
               "probabilities": probabilities.detach().tolist(),
               "expected_reward": expected_reward.item(), "KL_pi_reference": kl.item()}
        history.append(row)
        if step == 64:
            break
        action = int(torch.multinomial(probabilities.detach(), 1, generator=generator))
        baseline = expected_reward.detach()
        # Neither reward nor baseline is differentiated through the policy.
        advantage = rewards[action].detach() - baseline
        loss = -advantage * probabilities[action].log() + .1 * kl
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        row.update({"sampled_action": action, "reward": rewards[action].item(),
                    "baseline": baseline.item(), "advantage": advantage.item(),
                    "loss": loss.item(), "gradient": logits.grad.tolist()})
        optimizer.step()
    return history


def run(feedback_path):
    feedback = json.loads(Path(feedback_path).read_text(encoding="utf-8"))
    assert feedback["steps"] == 64 and feedback["target"] == .7
    distilled = feedback["frozen_rewards"]
    direct = [2 * (8.1 - 1) / 9 - 1, 0.]
    return {"kind": "Constructed closed-world sampled policy updates, no language-model fit",
            "feedback_sha256": digest_file(feedback_path), "steps_per_route": 64, "seed": 17,
            "learning_rate": .05, "KL_coefficient": .1, "reference": [.5, .5],
            "gradient_probe": gradient_probe(), "distilled_rewards": distilled,
            "direct_rewards": direct, "direct_rating_distributions": {
                "A": {"1": .1, "5": .2, "10": .7}, "B": {"5": .5, "6": .5}},
            "histories": {"distilled": trace(distilled), "direct": trace(direct)},
            "interpretation": "Feedback scales differ; trajectory speed is not evidence of a better feedback source."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--feedback", type=Path, default=Path("feedback-results.json"))
    parser.add_argument("--output", type=Path, default=Path("loop-results.json"))
    args = parser.parse_args()
    torch.set_num_threads(2)
    result = run(args.feedback)
    emit(args.output, result)
    print({name: rows[-1]["probabilities"] for name, rows in result["histories"].items()})


if __name__ == "__main__":
    main()
