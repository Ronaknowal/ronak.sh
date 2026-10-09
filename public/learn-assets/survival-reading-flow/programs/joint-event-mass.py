"""Run: python -B joint-event-mass.py (PyTorch; scratch module beside it).

Compare supplied joint logits/masks/manual gradients with float64 Torch.
"""

import json
from math import log
import torch
from torch.nn import functional as F
from joint_survival_outputs import joint_output, joint_batch_loss


def torch_joint_loss(logits, causes, stops, n_causes, n_bins,
                     ranking_weight=0.0, sigma=0.5):
    """Joint log normalization across ALL K*B+1 cells, never per cause."""
    log_probability = F.log_softmax(logits, dim=1)
    cause_index = torch.arange(1, n_causes + 1, device=logits.device)[:, None]
    bin_index = torch.arange(1, n_bins + 1, device=logits.device)[None, :]
    masks = []
    for cause, stop in zip(causes, stops):
        if cause == 0:
            event_mask = (bin_index > stop).expand(n_causes, n_bins)
            tail_allowed = True
        else:
            event_mask = (cause_index == cause) & (bin_index == stop)
            tail_allowed = False
        masks.append(torch.cat((event_mask.flatten(),
                                torch.tensor([tail_allowed], device=logits.device))))
    allowed = torch.stack(masks)
    loss = -torch.logsumexp(log_probability.masked_fill(~allowed, -torch.inf), dim=1).mean()
    if ranking_weight == 0:
        return loss
    masses = log_probability[:, :-1].exp().reshape(-1, n_causes, n_bins)
    incidence = masses.cumsum(dim=2)
    penalties = []
    for i, (cause, stop) in enumerate(zip(causes, stops)):
        if cause == 0:
            continue
        for j, later in enumerate(stops):
            if stop < later:
                gap = incidence[i, cause - 1, stop - 1] - incidence[j, cause - 1, stop - 1]
                penalties.append(torch.exp(-gap / sigma))
    if penalties:
        loss = loss + ranking_weight * torch.stack(penalties).mean()
    return loss


def main():
    base = [log(value) for value in [0.2, 0.1, 0.3, 0.15, 0.25]]
    changed = base.copy()
    changed[1] += log(2.0)
    baseline = joint_output(base, 2, 2)
    edited = joint_output(changed, 2, 2)
    # A: motor/bin1; B: seal/bin2; C: observation ends after boundary1.
    rows = [base, changed, base]
    causes, stops = [1, 2, 0], [1, 2, 1]
    scratch_loss, scratch_gradient = joint_batch_loss(
        rows, causes, stops, 2, 2, ranking_weight=0.1, sigma=0.5,
    )
    logits = torch.tensor(rows, dtype=torch.float64, requires_grad=True)
    library_loss = torch_joint_loss(logits, causes, stops, 2, 2, 0.1, 0.5)
    library_loss.backward()
    # Keep the manual reference float64 as well as the library parameters.
    difference = (logits.grad - torch.tensor(scratch_gradient, dtype=torch.float64)).abs().max().item()
    print(json.dumps({
        "base_masses": baseline.masses,
        "base_tail": baseline.tail,
        "base_cif": baseline.incidence,
        "base_survival": baseline.survival,
        "censor_after_bin1": baseline.survival[1],
        "edited_masses": edited.masses,
        "edited_tail": edited.tail,
        "edited_cif": edited.incidence,
        "edited_survival": edited.survival,
        "mean_nll_plus_point1_ranking": scratch_loss,
        "torch_loss": library_loss.item(),
        "max_gradient_difference": difference,
        "scratch_gradient": scratch_gradient,
        "torch_version": torch.__version__,
    }, indent=2))


if __name__ == "__main__":
    main()
