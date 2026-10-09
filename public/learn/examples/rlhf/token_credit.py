"""Shifted token scores, role-based validity, reward shaping and masked GAE.

python token_credit.py --output token-credit-results.json
Requires torch. Functions are also used by token_ppo.py.
"""
import argparse
import json
from pathlib import Path
import torch
import torch.nn.functional as F
from preference_records import ROOT


def shifted_scores(logits, ids):
    """Logit position t scores the actual input ID at t+1 exactly once."""
    return F.log_softmax(logits[:, :-1], dim=-1).gather(-1, ids[:, 1:, None]).squeeze(-1)


def action_mask(prompt_lengths, lengths, width):
    """Mask is indexed by predicting logit, not by the target input position."""
    position = torch.arange(width - 1)[None, :]
    return (position >= prompt_lengths[:, None] - 1) & (position < lengths[:, None] - 1)


def shape_rewards(old_logp, reference_logp, valid, terminal_scores, beta):
    rewards = -beta * (old_logp - reference_logp) * valid
    for b in range(len(valid)):
        indexes = valid[b].nonzero().flatten()
        if len(indexes):
            rewards[b, indexes[-1]] += terminal_scores[b]
    return rewards


def gae(rewards, values, valid, gamma=1., lam=.95, bootstrap=None):
    """Right-padded action arrays. bootstrap is V(next) only for a cutoff.

    No trace crosses the final sampled action into a new episode. A continuing
    cutoff may nevertheless bootstrap its final delta using the supplied value.
    """
    if rewards.shape != values.shape or rewards.shape != valid.shape:
        raise ValueError("Rewards, pre-action values and validity must align")
    batch, width = rewards.shape
    bootstrap = torch.zeros(batch, dtype=values.dtype) if bootstrap is None else bootstrap
    advantages = torch.zeros_like(values)
    for b in range(batch):
        indexes = valid[b].nonzero().flatten().tolist()
        carry = values.new_tensor(0.)
        next_value = bootstrap[b]
        for t in reversed(indexes):
            delta = rewards[b, t] + gamma * next_value - values[b, t]
            carry = delta + gamma * lam * carry
            advantages[b, t] = carry
            next_value = values[b, t]
    return advantages, torch.where(valid, advantages + values, torch.zeros_like(values))


def normalize_valid(advantages, valid, epsilon=1e-8):
    result = torch.zeros_like(advantages)
    entries = advantages[valid]
    if entries.numel():
        result[valid] = (entries - entries.mean()) / torch.sqrt(entries.var(unbiased=False) + epsilon)
    return result


def ppo_losses(current_logp, old_logp, values, targets, advantages, valid, epsilon=.2):
    """Token-mean surrogate and token-mean MSE; caller supplies value coefficient."""
    if not bool(valid.any()):
        raise ValueError("No valid actions: skip this optimizer step")
    ratio = (current_logp - old_logp).exp()
    unclipped = ratio * advantages
    clipped = ratio.clamp(1 - epsilon, 1 + epsilon) * advantages
    policy_loss = -torch.minimum(unclipped, clipped)[valid].mean()
    value_mse = ((values - targets) ** 2)[valid].mean()
    return policy_loss, value_mse, ratio


def run():
    torch.manual_seed(19)
    ids = torch.tensor([[1, 3, 7, 2, 0, 0], [1, 4, 5, 8, 9, 2]])
    prompt = torch.tensor([2, 3])
    lengths = torch.tensor([4, 6])
    logits = torch.randn(2, 6, 13, dtype=torch.float64)
    valid = action_mask(prompt, lengths, ids.shape[1])
    scores = shifted_scores(logits, ids)
    labels = ids[:, 1:].clone()
    labels[~valid] = -100
    native = F.cross_entropy(logits[:, :-1].reshape(-1, 13), labels.reshape(-1), ignore_index=-100)
    assert torch.allclose(-scores[valid].mean(), native)
    r = torch.tensor([[-.1, -.2, 1.3], [.2, .8, 999.]], dtype=torch.float64)
    v = torch.tensor([[.4, .5, .6], [.1, .3, -888.]], dtype=torch.float64)
    mask = torch.tensor([[True, True, True], [True, True, False]])
    advantages, targets = gae(r, v, mask, lam=.8)
    assert torch.allclose(advantages[0], torch.tensor([.368, .46, .7], dtype=torch.float64))
    independent = []
    for b, n in ((0, 3), (1, 2)):
        delta = [r[b, t].item() + (v[b, t + 1].item() if t + 1 < n else 0) - v[b, t].item() for t in range(n)]
        sums = [sum(.8 ** (j - t) * delta[j] for j in range(t, n)) for t in range(n)]
        assert torch.allclose(advantages[b, :n], torch.tensor(sums, dtype=torch.float64))
        independent.append({"delta": delta, "expanded": sums})
    normalized = normalize_valid(advantages, mask)
    changed = advantages.clone()
    changed[~mask] = 1e9
    assert torch.equal(normalized, normalize_valid(changed, mask))
    cutoff, _ = gae(r, v, mask, lam=.8, bootstrap=torch.tensor([.9, .9], dtype=torch.float64))
    empty = torch.zeros_like(mask)
    assert not bool(gae(r, v, empty)[0].any())
    return {"ids": ids.tolist(), "predicting_position_mask": valid.tolist(),
            "scored_target_positions": [[int(i) + 1 for i in row.nonzero().flatten()] for row in valid],
            "gathered_loss": (-scores[valid].mean()).item(), "native_cross_entropy": native.item(),
            "gae": advantages.tolist(), "targets": targets.tolist(), "expanded_check": independent,
            "continuing_cutoff_advantages": cutoff.tolist(), "normalized": normalized.tolist(),
            "checks": ["single shift", "EOS scored", "prompt/PAD role mask", "expanded GAE", "padding invariant", "no-action no-op"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "token-credit-results.json")
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
