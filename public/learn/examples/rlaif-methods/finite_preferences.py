"""Finite noisy-label IPO, preference cycles and missing behavior support.

python -B finite_preferences.py --output finite-results.json
Requires torch. These are analytical calculations and gradient checks, not fits.
"""

import argparse
import math
from pathlib import Path

import torch

from records_and_masks import emit


def noisy_square(h, probability_a, target):
    return probability_a * (h - target) ** 2 + (1 - probability_a) * (h + target) ** 2


def identity_tilt(preferences, behavior, reference, tau):
    if tau <= 0 or preferences.ndim != 2 or preferences.shape[0] != preferences.shape[1]:
        raise ValueError("Need a square preference matrix and positive tau")
    if torch.any(preferences < 0) or torch.any(preferences > 1):
        raise ValueError("Pairwise preference probabilities must be in [0,1]")
    if torch.any(behavior < 0) or torch.any(reference < 0):
        raise ValueError("Distributions cannot have negative mass")
    if not torch.isclose(behavior.sum(), torch.tensor(1., dtype=behavior.dtype)):
        raise ValueError("Behavior distribution must sum to one")
    if not torch.isclose(reference.sum(), torch.tensor(1., dtype=reference.dtype)):
        raise ValueError("Reference distribution must sum to one")
    scores = preferences @ behavior
    support = reference > 0
    logits = reference[support].log() + scores[support] / tau
    policy = torch.zeros_like(reference)
    policy[support] = logits.softmax(-1)
    return scores, policy


def run():
    dtype = torch.float64
    probability_a, target = .7, 1.
    optimum = target * (2 * probability_a - 1)
    h = torch.tensor(optimum, dtype=dtype, requires_grad=True)
    loss = noisy_square(h, probability_a, target)
    loss.backward()
    assert abs(h.grad.item()) < 1e-12
    assert math.isclose(loss.item(), 4 * target ** 2 * probability_a * (1 - probability_a))
    reference = torch.tensor([.4, .6], dtype=dtype)
    ipo = (reference.log() + torch.tensor([optimum, 0.], dtype=dtype)).softmax(-1)
    dpo_h = math.log(.7 / .3) / .5
    dpo = (reference.log() + torch.tensor([dpo_h, 0.], dtype=dtype)).softmax(-1)
    matrix = torch.tensor([[.5, .99, .25, .25], [.01, .5, .75, .25],
                           [.75, .25, .5, .25], [.75, .75, .75, .5]], dtype=dtype)
    uniform = torch.full((4,), .25, dtype=dtype)
    scores, tilted = identity_tilt(matrix, uniform, uniform, .1)
    shifted = (uniform.log() + (scores + 50) / .1).softmax(-1)
    assert torch.allclose(tilted, shifted, atol=1e-12)
    families = []
    share_a = math.e / (1 + math.e)
    for observed_mass in [.3, .9]:
        policy = [observed_mass * share_a, observed_mass * (1 - share_a), 1 - observed_mass]
        ratio = math.log(policy[0] / policy[1])
        assert math.isclose(ratio, 1)
        families.append({"observed_mass": observed_mass, "policy": policy, "observed_h_AB": ratio,
                         "observed_pair_loss": (ratio - 1) ** 2})
    connected = torch.tensor([math.e, 1., 1.], dtype=dtype)
    connected /= connected.sum()
    # Equal A>B and A>C target constraints now determine all three relative masses.
    assert torch.allclose((connected[0] / connected[1:]).log(), torch.ones(2, dtype=dtype))
    return {"kind": "Finite-action analytical calculations; no neural training",
            "noisy": {"q": probability_a, "c": target, "optimum_h": optimum,
                      "minimum_loss": loss.item(), "gradient_at_optimum": h.grad.item(),
                      "reference": reference.tolist(), "IPO_policy": ipo.tolist(), "DPO_policy_beta_point5": dpo.tolist()},
            "published_four_action": {"matrix": matrix.tolist(), "behavior": uniform.tolist(),
                                      "reference": uniform.tolist(), "tau": .1,
                                      "identity_row_means": scores.tolist(), "policy": tilted.tolist()},
            "missing_support_family": families, "connected_constructed_policy": connected.tolist(),
            "scope": "The connected A>B/A>C example is constructed; the published matrix is source-attributed."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("finite-results.json"))
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print({"noisy": result["noisy"], "identity_policy": result["published_four_action"]["policy"]})


if __name__ == "__main__":
    main()
