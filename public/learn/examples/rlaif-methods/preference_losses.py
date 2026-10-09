"""Explicit IPO and stable ORPO losses, signs and shared-weight derivatives.

python -B preference_losses.py --output preference-losses-results.json
Requires torch. All probes are constructed calculations, not a training fit.
"""

import argparse
import math
from pathlib import Path

import torch
import torch.nn.functional as F

from records_and_masks import emit


def ipo_loss(policy_sums, reference_sums, counts, pair_count, tau=.5):
    if tau <= 0 or pair_count <= 0 or torch.any(counts <= 0):
        raise ValueError("Need positive tau and nonempty responses")
    if len(policy_sums) != 2 * pair_count or policy_sums.shape != reference_sums.shape:
        raise ValueError("Rows must be all chosen, then all rejected")
    gain = (policy_sums - reference_sums.detach()) / counts
    margin = gain[:pair_count] - gain[pair_count:]
    losses = (margin - 1 / (2 * tau)).square()
    return losses.mean(), margin, losses


def log_odds(mean_log_probability):
    """log(q/(1-q)) with q=exp(mean logp), without subtracting rounded q from 1."""
    if torch.any(~torch.isfinite(mean_log_probability)) or torch.any(mean_log_probability >= 0):
        raise ValueError("Finite token log probabilities must be strictly below zero")
    log_one_minus_q = torch.log(-torch.expm1(mean_log_probability))
    return mean_log_probability - log_one_minus_q


def orpo_loss(chosen_mean, rejected_mean, weight=.1, chosen_nll=None):
    if weight < 0 or chosen_mean.shape != rejected_mean.shape:
        raise ValueError("Need matched response scores and nonnegative weight")
    margin = log_odds(chosen_mean) - log_odds(rejected_mean)
    contrast = F.softplus(-margin)
    imitation = -chosen_mean if chosen_nll is None else chosen_nll
    losses = imitation + weight * contrast
    return losses.mean(), margin, contrast


def shared_weight(theta, chosen_feature, rejected_feature, weight):
    chosen_logp = F.logsigmoid(theta * chosen_feature)
    rejected_logp = F.logsigmoid(theta * rejected_feature)
    loss, margin, contrast = orpo_loss(chosen_logp, rejected_logp, weight)
    return loss, -chosen_logp, contrast, margin


def run():
    points = []
    for raw_margin in [-1., 0., 1., 2.]:
        variable = torch.tensor(raw_margin, dtype=torch.float64, requires_grad=True)
        ipo = (variable - 1).square()
        dpo = F.softplus(-.5 * variable)
        ipo_gradient = torch.autograd.grad(ipo, variable, retain_graph=True)[0]
        dpo_gradient = torch.autograd.grad(dpo, variable)[0]
        points.append({"h": raw_margin, "ipo_loss": ipo.item(), "ipo_gradient": ipo_gradient.item(),
                       "published_tau_scaled_gradient": .5 * ipo_gradient.item(),
                       "dpo_loss": dpo.item(), "dpo_gradient": dpo_gradient.item()})
    chosen = torch.tensor(math.log(math.sqrt(.8 * .5)), dtype=torch.float64, requires_grad=True)
    rejected = torch.tensor(math.log(.5), dtype=torch.float64, requires_grad=True)
    total, margin, contrast = orpo_loss(chosen, rejected)
    chosen_gradient, rejected_gradient = torch.autograd.grad(contrast, (chosen, rejected), retain_graph=True)
    assert torch.allclose(chosen_gradient, torch.tensor(-1., dtype=torch.float64))
    coupled = []
    for xa, xb, weight in [(1., 3., .1), (1., 3., .5), (1., 3., 1.), (1., -1., .1)]:
        theta = torch.tensor(0., dtype=torch.float64, requires_grad=True)
        loss, nll, penalty, odds_margin = shared_weight(theta, xa, xb, weight)
        sft_gradient = torch.autograd.grad(nll, theta, retain_graph=True)[0]
        contrast_gradient = torch.autograd.grad(penalty, theta, retain_graph=True)[0]
        gradient = torch.autograd.grad(loss, theta)[0]
        epsilon = 1e-6
        high = shared_weight(torch.tensor(epsilon, dtype=torch.float64), xa, xb, weight)[0]
        low = shared_weight(torch.tensor(-epsilon, dtype=torch.float64), xa, xb, weight)[0]
        finite = (high - low) / (2 * epsilon)
        assert torch.allclose(gradient, finite, atol=1e-9, rtol=0)
        coupled.append({"xA": xa, "xB": xb, "lambda": weight, "theta": 0.,
                        "SFT_gradient": sft_gradient.item(), "contrast_gradient": contrast_gradient.item(),
                        "total_gradient": gradient.item(), "finite_difference": finite.item(),
                        "theta_after_lr_point01": (-.01 * gradient).item(), "margin": odds_margin.item()})
    stable = log_odds(torch.tensor([-1000., -10., -.1, -1e-12], dtype=torch.float64))
    assert torch.all(torch.isfinite(stable))
    return {"kind": "Constructed loss/gradient contracts; no fitting", "margin_points": points,
            "ORPO": {"chosen_mean": chosen.item(), "rejected_mean": rejected.item(),
                     "chosen_geometric_score": chosen.exp().item(), "rejected_geometric_score": rejected.exp().item(),
                     "margin": margin.item(), "contrast": contrast.item(), "total": total.item(),
                     "chosen_contrast_gradient": chosen_gradient.item(),
                     "rejected_contrast_gradient": rejected_gradient.item()},
            "shared_weight": coupled, "stable_log_odds": stable.tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("preference-losses-results.json"))
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print({"margin_points": len(result["margin_points"]), "shared_weight_cases": len(result["shared_weight"]),
           "ORPO_total": result["ORPO"]["total"]})


if __name__ == "__main__":
    main()
