"""Deep prefix plus token head: explicit encoder and native BERT/PEFT routes.

Run: python soft_token_head.py --output ./token-head-check
Both are random instructional models on a five-target constructed fixture.
Thirty updates test fixture fitting; they are not pretrained NLU evidence.
"""
import argparse
import json
import math
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F
from transformers import BertConfig, BertForTokenClassification
from peft import PeftModel, PrefixTuningConfig, get_peft_model


IDS = torch.tensor([[1, 4, 5, 6, 2], [1, 7, 8, 2, 0]])
VALID = torch.tensor([[1, 1, 1, 1, 1], [1, 1, 1, 1, 0]])
LABELS = torch.tensor([[-100, 0, 1, 2, -100], [-100, 2, 1, -100, -100]])


class EncoderLayer(nn.Module):
    def __init__(self, width=16):
        super().__init__()
        self.qkv = nn.Linear(width, 3 * width)
        self.out = nn.Linear(width, width)
        self.norm1, self.norm2 = nn.LayerNorm(width), nn.LayerNorm(width)
        self.ffn = nn.Sequential(nn.Linear(width, 2 * width), nn.GELU(), nn.Linear(2 * width, width))

    def forward(self, hidden, prefix, valid):
        batch, length, width = hidden.shape
        heads, depth = 2, width // 2
        split = lambda x: x.reshape(batch, -1, heads, depth).transpose(1, 2)
        query, key, value = [split(x) for x in self.qkv(hidden).chunk(3, dim=-1)]
        key = torch.cat([split(prefix[0][None].expand(batch, -1, -1)), key], dim=2)
        value = torch.cat([split(prefix[1][None].expand(batch, -1, -1)), value], dim=2)
        # Bidirectional real attention; only padded keys are hidden.
        allowed = torch.cat([torch.ones(batch, prefix.shape[1], dtype=torch.bool), valid.bool()], dim=1)
        scores = query @ key.transpose(-2, -1) / math.sqrt(depth)
        weights = scores.masked_fill(~allowed[:, None, None, :], -torch.inf).softmax(-1)
        returned = (weights @ value).transpose(1, 2).contiguous().reshape(batch, length, width)
        hidden = self.norm1(hidden + self.out(returned))
        return self.norm2(hidden + self.ffn(hidden))


class TokenEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.embedding = nn.Embedding(17, 16)
        self.positions = nn.Embedding(32, 16)
        self.layers = nn.ModuleList([EncoderLayer(), EncoderLayer()])
        self.requires_grad_(False)
        self.prefix = nn.Parameter(torch.randn(2, 2, 3, 16) * 0.02)
        self.classifier = nn.Linear(16, 3)

    def forward(self, input_ids, attention_mask, labels=None):
        hidden = self.embedding(input_ids) + self.positions(torch.arange(input_ids.shape[1]))
        for layer, prefix in zip(self.layers, self.prefix):
            hidden = layer(hidden, prefix, attention_mask)
        logits = self.classifier(hidden)
        loss = None if labels is None else F.cross_entropy(logits.reshape(-1, 3), labels.reshape(-1))
        from types import SimpleNamespace
        return SimpleNamespace(logits=logits, loss=loss)


def fit_fixture(model):
    model.eval()
    frozen = {name: value.detach().clone() for name, value in model.named_parameters() if not value.requires_grad}
    parameters = [(name, value) for name, value in model.named_parameters() if value.requires_grad]
    optimizer = torch.optim.AdamW([value for _, value in parameters], lr=0.03, weight_decay=0)
    losses = []
    for step in range(31):
        result = model(input_ids=IDS, attention_mask=VALID, labels=LABELS)
        assert list(result.logits.shape) == [2, 5, 3]
        losses.append(float(result.loss.detach()))
        if step == 30:
            break
        optimizer.zero_grad(set_to_none=True)
        result.loss.backward()
        assert all(value.grad is not None and torch.isfinite(value.grad).all() for _, value in parameters)
        if step == 0:
            first_gradients = {name: float(value.grad.norm()) for name, value in parameters}
        optimizer.step()
    assert all(torch.equal(frozen[name], value) for name, value in model.named_parameters() if name in frozen)
    assert all(value.grad is None for name, value in model.named_parameters() if name in frozen)
    assert losses[-1] < losses[0]
    selected = LABELS != -100
    predictions = result.logits.argmax(-1)
    # Altering only padded token IDs must not affect selected real positions.
    changed = IDS.clone()
    changed[1, -1] = 16
    with torch.no_grad():
        altered = model(input_ids=changed, attention_mask=VALID).logits
    torch.testing.assert_close(altered[selected], result.logits.detach()[selected], atol=1e-6, rtol=1e-6)
    return {"trainable_count": sum(value.numel() for _, value in parameters),
            "groups": {name: list(value.shape) for name, value in parameters},
            "first_gradient_norms": first_gradients, "losses": losses,
            "selected_targets": int(selected.sum()), "selected_correct": int((predictions[selected] == LABELS[selected]).sum()),
            "predictions": predictions.tolist(), "frozen_parameters_exact": True,
            "masked_padding_invariant": True, "optimizer_steps": 30}


def run(output):
    output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    torch.manual_seed(17)
    scratch = TokenEncoder()
    scratch_report = fit_fixture(scratch)
    torch.manual_seed(17)
    config = BertConfig(vocab_size=17, hidden_size=16, num_hidden_layers=2,
                        num_attention_heads=2, intermediate_size=32, num_labels=3,
                        hidden_dropout_prob=0, attention_probs_dropout_prob=0,
                        max_position_embeddings=32)
    base = BertForTokenClassification(config)
    initial_base = {name: value.detach().clone() for name, value in base.state_dict().items()}
    native = get_peft_model(base, PrefixTuningConfig(task_type="TOKEN_CLS", num_virtual_tokens=3,
                                                   prefix_projection=False))
    native_report = fit_fixture(native)
    assert native_report["trainable_count"] == 243
    native.save_pretrained(output / "adapter", safe_serialization=True)
    reloaded_base = BertForTokenClassification(config)
    reloaded_base.load_state_dict(initial_base)
    reloaded = PeftModel.from_pretrained(reloaded_base, output / "adapter").eval()
    with torch.no_grad():
        before = native(input_ids=IDS, attention_mask=VALID).logits
        after = reloaded(input_ids=IDS, attention_mask=VALID).logits
    torch.testing.assert_close(before, after, rtol=0, atol=0)
    return {"kind": "two distinct random instructional encoders, not benchmark comparison",
            "input_ids": IDS.tolist(), "attention_mask": VALID.tolist(), "labels": LABELS.tolist(),
            "scratch": scratch_report, "native_bert": native_report,
            "native_materialized_reload_exact": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = run(args.output)
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"scratch": report["scratch"]["losses"][-1],
                      "native": report["native_bert"]["losses"][-1], "reload_exact": True}))


if __name__ == "__main__":
    main()
