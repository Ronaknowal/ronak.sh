"""A current Transformers actor/value interface and independently matched loss.

python transformers_bridge.py --output transformers-results.json
Requires torch and transformers==5.19.0. No checkpoint or network is needed.
The GPT2 architecture differs from TinyLM; this is objective/interface parity.
"""
import argparse
import copy
import json
from pathlib import Path
import torch
from torch import nn
import torch.nn.functional as F
from transformers import GPT2Config, GPT2LMHeadModel
from preference_records import ROOT
from token_credit import action_mask, ppo_losses, shifted_scores
from token_ppo import TOKENS, fixture, padded


class FrameworkActorCritic(nn.Module):
    def __init__(self):
        super().__init__()
        config = GPT2Config(vocab_size=len(TOKENS), n_positions=16, n_ctx=16, n_embd=32,
                            n_layer=2, n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                            bos_token_id=1, eos_token_id=2, pad_token_id=0)
        self.actor = GPT2LMHeadModel(config)
        self.value = nn.Linear(32, 1)

    def forward(self, ids, attention_mask):
        output = self.actor(input_ids=ids, attention_mask=attention_mask,
                            output_hidden_states=True, use_cache=False)
        return output.logits, self.value(output.hidden_states[-1]).squeeze(-1)


def run():
    torch.set_num_threads(2)
    torch.manual_seed(53)
    model = FrameworkActorCritic()
    _, demonstrations, _ = fixture()
    ids, lengths = padded([demonstrations[0], demonstrations[3], demonstrations[4]])
    attention = torch.arange(ids.shape[1])[None, :] < lengths[:, None]
    valid = action_mask(torch.full_like(lengths, 3), lengths, ids.shape[1])
    logits, values = model(ids, attention)
    gathered = -shifted_scores(logits, ids)[valid].mean()
    labels = ids.clone()
    supervised_positions = torch.cat((torch.zeros((len(ids), 1), dtype=torch.bool), valid), dim=1)
    labels[~supervised_positions] = -100
    native = model.actor(input_ids=ids, attention_mask=attention, labels=labels, use_cache=False).loss
    # Native GPT2 performs the label shift itself; same-position labels supplied.
    manual_grads = torch.autograd.grad(gathered, tuple(model.actor.parameters()), retain_graph=True)
    native_grads = torch.autograd.grad(native, tuple(model.actor.parameters()))
    maximum = max((a - b).abs().max().item() for a, b in zip(manual_grads, native_grads))
    assert abs(gathered.item() - native.item()) < 1e-6
    assert maximum < 2e-6
    reference = copy.deepcopy(model).eval()
    for parameter in reference.parameters():
        parameter.requires_grad_(False)
    old_logp = shifted_scores(logits.detach(), ids)
    advantages = torch.linspace(-1., 1., old_logp.numel()).reshape_as(old_logp)
    targets = values[:, :-1].detach() + .4
    old_copy = old_logp.clone()
    before_actor = model.actor.transformer.wte.weight.detach().clone()
    before_value = model.value.weight.detach().clone()
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=0.)
    current_logits, current_values = model(ids, attention)
    policy, value, ratios = ppo_losses(shifted_scores(current_logits, ids), old_logp,
                                     current_values[:, :-1], targets, advantages, valid)
    assert torch.allclose(ratios[valid], torch.ones_like(ratios[valid]))
    loss = policy + .5 * value
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    nn.utils.clip_grad_norm_(model.parameters(), 1.)
    optimizer.step()
    assert not torch.equal(before_actor, model.actor.transformer.wte.weight)
    assert not torch.equal(before_value, model.value.weight)
    assert torch.equal(old_copy, old_logp)
    with torch.no_grad():
        ref_logits, _ = reference(ids, attention)
    assert torch.allclose(ref_logits, logits.detach(), atol=1e-6)
    return {"comparison": "objective/interface parity, not architecture weight parity",
            "dtype": str(logits.dtype), "input_shape": list(ids.shape), "logits_shape": list(logits.shape),
            "value_shape": list(values.shape), "valid_targets": int(valid.sum()),
            "gathered_nll": gathered.item(), "native_shifted_nll": native.item(),
            "max_gradient_discrepancy": maximum, "policy_loss": policy.item(), "value_mse": value.item(),
            "checks": ["single internal label shift", "same token mean", "same-state gradients", "one actual actor/value update", "frozen reference", "old snapshot unchanged"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "transformers-results.json")
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
