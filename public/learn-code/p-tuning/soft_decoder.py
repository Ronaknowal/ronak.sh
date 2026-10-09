"""Frozen complete TinyLM with input, infix or per-layer KV prompt state.

Run: python soft_decoder.py --output decoder.json
The unchanged tiny_causal_lm.py is bundled from the causal-LM prerequisite.
Random model fixtures establish mechanisms, not pretrained adaptation quality.
"""
import argparse
import json
import math
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F

from tiny_causal_lm import TinyLM


class SoftDecoder(nn.Module):
    def __init__(self, base, virtual=2, route="input", insertion=0):
        super().__init__()
        if route not in {"input", "kv"} or virtual < 0 or insertion < 0:
            raise ValueError("Invalid route, prompt count or insertion")
        self.base = base.requires_grad_(False)
        self.virtual, self.route, self.insertion = virtual, route, insertion
        width = base.token.embedding_dim
        if route == "input":
            self.prompt = nn.Parameter(torch.randn(virtual, width) * 0.02)
        else:
            self.prefix = nn.Parameter(torch.randn(len(base.blocks), 2, virtual, width) * 0.02)

    def forward(self, ids, valid=None):
        batch, length = ids.shape
        if length < 1 or self.insertion > length:
            raise ValueError("A prompt must be inserted into an existing sequence")
        if valid is None:
            valid = torch.ones_like(ids, dtype=torch.bool)
        if valid.shape != ids.shape or not bool(valid[:, 0].all()):
            raise ValueError("The first real input must be valid; mask must match IDs")
        hidden = self.base.token(ids)
        if self.route == "input":
            prompt = self.prompt[None].expand(batch, -1, -1)
            point = self.insertion
            hidden = torch.cat([hidden[:, :point], prompt, hidden[:, point:]], dim=1)
            visible = torch.ones(batch, self.virtual, dtype=torch.bool, device=ids.device)
            valid_keys = torch.cat([valid[:, :point], visible, valid[:, point:]], dim=1)
            real_rows = torch.arange(length, device=ids.device)
            real_rows = real_rows + (real_rows >= point) * self.virtual
        else:
            valid_keys = valid
            real_rows = torch.arange(length, device=ids.device)
        if hidden.shape[1] > self.base.context:
            raise ValueError("Real plus input-virtual positions exceed the frozen position table")
        positions = torch.arange(hidden.shape[1], device=ids.device)
        hidden = hidden + self.base.position(positions)
        for layer_index, block in enumerate(self.base.blocks):
            normalized = block.ln1(hidden)
            attention = block.attention
            heads = attention.heads
            head_width = hidden.shape[-1] // heads
            split = lambda x: x.reshape(batch, -1, heads, head_width).transpose(1, 2)
            query, key, value = [split(x) for x in attention.qkv(normalized).chunk(3, dim=-1)]
            size = hidden.shape[1]
            allowed = torch.ones(size, size, device=ids.device, dtype=torch.bool).tril()
            allowed = allowed[None, None] & valid_keys[:, None, None, :]
            if self.route == "kv":
                prefix = self.prefix[layer_index]
                prefix_key = split(prefix[0][None].expand(batch, -1, -1))
                prefix_value = split(prefix[1][None].expand(batch, -1, -1))
                key = torch.cat([prefix_key, key], dim=2)
                value = torch.cat([prefix_value, value], dim=2)
                prefix_allowed = torch.ones(batch, 1, size, self.virtual,
                                            dtype=torch.bool, device=ids.device)
                allowed = torch.cat([prefix_allowed, allowed], dim=-1)
            scores = query @ key.transpose(-2, -1) / math.sqrt(head_width)
            weights = scores.masked_fill(~allowed, -torch.inf).softmax(-1)
            values = (weights @ value).transpose(1, 2).contiguous().reshape(batch, size, -1)
            hidden = hidden + attention.out(values)
            hidden = hidden + block.mlp(block.ln2(hidden))
        all_logits = self.base.head(self.base.norm(hidden))
        return all_logits[:, real_rows]


def selected_loss(logits, next_labels):
    """Labels are already next-token targets aligned to real predictor positions."""
    if logits.shape[:2] != next_labels.shape or not bool((next_labels != -100).any()):
        raise ValueError("Select at least one aligned real target")
    return F.cross_entropy(logits.reshape(-1, logits.shape[-1]), next_labels.reshape(-1))


@torch.no_grad()
def greedy(model, prompt, steps, eos=None):
    result = prompt.clone()
    for _ in range(steps):
        token = model(result)[:, -1].argmax(-1, keepdim=True)
        result = torch.cat([result, token], dim=1)
        if eos is not None and bool((token == eos).all()):
            break
    return result


def verify():
    torch.set_num_threads(2)
    torch.manual_seed(17)
    base = TinyLM(11, context=24, width=8, heads=2, layers=2).double()
    before = {key: value.detach().clone() for key, value in base.state_dict().items()}
    ids = torch.tensor([[1, 2, 3, 4]])
    labels = torch.tensor([[-100, -100, 4, 5]])
    records = []
    for route in ("input", "kv"):
        null = SoftDecoder(base, 0, route).double()
        torch.testing.assert_close(null(ids), base(ids), rtol=0, atol=0)
        model = SoftDecoder(base, 2, route).double()
        params = [p for p in model.parameters() if p.requires_grad]
        initial = selected_loss(model(ids), labels)
        initial.backward()
        gradient_norm = sum(float(p.grad.square().sum()) for p in params) ** 0.5
        assert gradient_norm > 0 and all(torch.isfinite(p.grad).all() for p in params)
        optimizer = torch.optim.SGD(params, lr=0.01)
        optimizer.step()
        after = selected_loss(model(ids), labels)
        assert float(after.detach()) < float(initial.detach())
        assert all(torch.equal(value, before[key]) for key, value in base.state_dict().items())
        assert all(p.grad is None for p in base.parameters())
        changed = ids.clone()
        changed[0, -1] = 9
        torch.testing.assert_close(model(ids)[:, :-1], model(changed)[:, :-1], rtol=0, atol=0)
        padded_ids = torch.cat([ids, torch.tensor([[0, 0]])], dim=1)
        padded_valid = torch.tensor([[1, 1, 1, 1, 0, 0]], dtype=torch.bool)
        torch.testing.assert_close(model(padded_ids, padded_valid)[:, :4], model(ids), rtol=1e-14, atol=1e-14)
        records.append({"route": route, "parameters": sum(p.numel() for p in params),
                        "initial_loss": float(initial.detach()), "after_one_step": float(after.detach()),
                        "gradient_norm": gradient_norm, "logits_shape": list(model(ids).shape),
                        "generated_ids": greedy(model, ids[:, :2], 3).tolist()})
    after_target = SoftDecoder(base, 2, "input", insertion=3).double()
    after_target(ids)[0, 1, 4].backward()
    assert torch.count_nonzero(after_target.prompt.grad) == 0
    before_target = SoftDecoder(base, 2, "input", insertion=1).double()
    before_target(ids)[0, 1, 4].backward()
    assert torch.count_nonzero(before_target.prompt.grad) > 0
    return {"kind": "random full two-block mechanism, not pretrained quality",
            "cases": records, "zero_virtual_matches_base_exactly": True,
            "frozen_base_exact": True, "causal_future_and_padding_checks": True,
            "infix_after_target_gradient_zero": True,
            "base": {"vocabulary": 11, "width": 8, "heads": 2, "layers": 2}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = json.dumps(verify(), indent=2)
    if args.output:
        args.output.write_text(result + "\n", encoding="utf-8")
    print(result)


if __name__ == "__main__":
    main()
