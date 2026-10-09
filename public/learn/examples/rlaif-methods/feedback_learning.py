"""Soft AI preference targets, a visible reward head and one fixed tiny fit.

python -B feedback_learning.py --output feedback-results.json
Requires torch. The two fixed feature vectors are constructed, not learned text features.
The 64-step gap fit is declared in the prospective study protocol.
"""

import argparse
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F

from records_and_masks import emit


class RewardHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.gap = nn.Parameter(torch.tensor(0., dtype=torch.float64))

    def forward(self, features):
        return self.gap * features


def soft_preference_loss(score_a, score_b, target):
    if not 0 <= target <= 1:
        raise ValueError("Preference target must be in [0,1]")
    gap = score_a - score_b
    # Both label outcomes remain in the loss, including the less likely one.
    return target * F.softplus(-gap) + (1 - target) * F.softplus(gap)


def run():
    torch.set_num_threads(2)
    head = RewardHead()
    features = torch.tensor([.5, -.5], dtype=torch.float64)
    optimizer = torch.optim.SGD(head.parameters(), lr=.1)
    history = []
    for step in range(65):
        scores = head(features)
        loss = soft_preference_loss(scores[0], scores[1], .7)
        history.append({"step": step, "gap": head.gap.item(), "scores": scores.detach().tolist(),
                        "probability_a": head.gap.sigmoid().item(), "loss": loss.item()})
        if step == 64:
            break
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        expected = head.gap.detach().sigmoid() - .7
        assert torch.allclose(head.gap.grad, expected, atol=1e-12)
        optimizer.step()
    comparisons = []
    for target in [.2, .5, .8]:
        gap = torch.tensor(0., dtype=torch.float64, requires_grad=True)
        full = soft_preference_loss(gap / 2, -gap / 2, target)
        full_gradient = torch.autograd.grad(full, gap, retain_graph=True)[0]
        winner_weighted = target * F.softplus(-gap)
        weighted_gradient = torch.autograd.grad(winner_weighted, gap)[0]
        comparisons.append({"target": target, "full_loss": full.item(), "full_gradient": full_gradient.item(),
                            "A_only_weighted_loss": winner_weighted.item(), "A_only_gradient": weighted_gradient.item()})
    return {"kind": "One constructed reward-gap fit, not a text quality study", "steps": 64,
            "target": .7, "learning_rate": .1, "features": features.tolist(),
            "history": history, "frozen_rewards": head(features).detach().tolist(),
            "soft_vs_A_only": comparisons,
            "closed_form_gap_optimum": torch.logit(torch.tensor(.7, dtype=torch.float64)).item()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("feedback-results.json"))
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print({"steps": result["steps"], "final": result["history"][-1]})


if __name__ == "__main__":
    main()
