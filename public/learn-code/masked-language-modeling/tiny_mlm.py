"""A small bidirectional MLM trained on the supplied real Alice excerpt.

Run: python tiny_mlm.py --steps 240 --output experiment.json
Files beside this program: corruption_loss.py and alice_excerpt.txt.
Requires NumPy and PyTorch. CPU by default; no downloads or pretrained weights.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re

import numpy as np
import torch
from torch import nn
import torch.nn.functional as F

from corruption_loss import corrupt, torch_selected_loss

SPECIALS = ["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"]
PAD, UNK, CLS, SEP, MASK = range(5)


def prepare_data(path, words_per_chunk=24):
    words = re.findall(r"[a-z]+", Path(path).read_text(encoding="utf-8").lower())
    # Split contiguous text before making chunks or learning the vocabulary.
    boundary = int(len(words) * 0.8)
    train_words, test_words = words[:boundary], words[boundary:]
    vocabulary = SPECIALS + sorted(set(train_words))
    lookup = {word: index for index, word in enumerate(vocabulary)}

    def pack(part):
        rows = []
        for start in range(0, len(part), words_per_chunk):
            content = [lookup.get(word, UNK) for word in part[start:start + words_per_chunk]]
            row = [CLS] + content + [SEP]
            rows.append(row + [PAD] * (words_per_chunk + 2 - len(row)))
        return torch.tensor(rows, dtype=torch.long)

    train, test = pack(train_words), pack(test_words)
    metadata = {
        "words": len(words), "train_words": boundary,
        "test_words": len(test_words), "train_chunks": len(train),
        "test_chunks": len(test), "vocabulary_size": len(vocabulary),
        "test_unknown_words": sum(word not in lookup for word in test_words),
        "data_sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest(),
    }
    return train, test, vocabulary, metadata


def corrupt_batch(original, vocabulary_size, rng, rate=0.15):
    # UNK is excluded too: predicting a collapsed unknown symbol is uninformative.
    eligible = original.numpy() >= len(SPECIALS)
    inputs, labels, _ = corrupt(original.numpy(), eligible, vocabulary_size, MASK, rng, rate)
    return torch.from_numpy(inputs), torch.from_numpy(labels)


class SelfAttention(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.heads, self.head_width = heads, width // heads
        self.qkv = nn.Linear(width, 3 * width)
        self.output = nn.Linear(width, width)

    def forward(self, hidden, valid, causal=False):
        batch, length, width = hidden.shape
        packed = self.qkv(hidden).reshape(batch, length, 3, self.heads, self.head_width)
        q, k, v = packed.permute(2, 0, 3, 1, 4).unbind(0)
        scores = q @ k.transpose(-2, -1) / math.sqrt(self.head_width)
        allowed = valid[:, None, None, :].expand(batch, 1, length, length)
        if causal:
            allowed = allowed & torch.ones(length, length, dtype=torch.bool).tril()
        weights = scores.masked_fill(~allowed, float("-inf")).softmax(dim=-1)
        mixed = (weights @ v).transpose(1, 2).reshape(batch, length, width)
        return self.output(mixed), weights


class EncoderBlock(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.attention = SelfAttention(width, heads)
        self.attention_norm = nn.LayerNorm(width)
        self.ffn = nn.Sequential(nn.Linear(width, 4 * width), nn.GELU(), nn.Linear(4 * width, width))
        self.ffn_norm = nn.LayerNorm(width)

    def forward(self, hidden, valid, causal=False):
        mixed, weights = self.attention(hidden, valid, causal)
        hidden = self.attention_norm(hidden + mixed)
        hidden = self.ffn_norm(hidden + self.ffn(hidden))
        return hidden, weights


class TinyMLM(nn.Module):
    def __init__(self, vocabulary_size, length=26, width=48, heads=4, layers=2):
        super().__init__()
        self.token = nn.Embedding(vocabulary_size, width, padding_idx=PAD)
        self.position = nn.Embedding(length, width)
        self.segment = nn.Embedding(2, width)
        self.input_norm = nn.LayerNorm(width)
        self.blocks = nn.ModuleList(EncoderBlock(width, heads) for _ in range(layers))
        self.transform = nn.Sequential(nn.Linear(width, width), nn.GELU(), nn.LayerNorm(width))
        self.output_bias = nn.Parameter(torch.zeros(vocabulary_size))
        self.apply(self.initialize)

    @staticmethod
    def initialize(module):
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0, std=0.02)
        if isinstance(module, nn.Linear) and module.bias is not None:
            nn.init.zeros_(module.bias)

    def encode(self, inputs, valid, segment_ids=None, causal=False):
        positions = torch.arange(inputs.shape[1])
        if segment_ids is None:
            segment_ids = torch.zeros_like(inputs)
        hidden = self.input_norm(self.token(inputs) + self.position(positions) + self.segment(segment_ids))
        for block in self.blocks:
            hidden, weights = block(hidden, valid, causal)
        return hidden, weights

    def forward(self, inputs, valid, selected=None):
        hidden, _ = self.encode(inputs, valid)
        if selected is not None:
            hidden = hidden[selected]
        # One embedding matrix serves input lookup and transposed output decoding.
        return F.linear(self.transform(hidden), self.token.weight, self.output_bias)


@torch.no_grad()
def evaluate(model, original, fixed_inputs, fixed_labels):
    model.eval()
    selected = fixed_labels != -100
    count = int(selected.sum())
    if not count:
        return {"targets": 0, "loss": None, "accuracy": None}
    logits = model(fixed_inputs, original != PAD, selected)
    labels = fixed_labels[selected]
    return {
        "targets": count,
        "loss": F.cross_entropy(logits, labels).item(),
        "accuracy": (logits.argmax(-1) == labels).float().mean().item(),
    }


@torch.no_grad()
def pseudo_log_likelihood(model, original):
    """One input sequence; mask each eligible position once, then sum log p.

    Batched leave-one-out inputs are O(T^2) IDs; use smaller batches for long T.
    This score is not a normalized joint sequence log probability.
    """
    positions = (original >= len(SPECIALS)).nonzero().flatten()
    if not len(positions):
        return {"positions": 0, "sum_log_probability": None, "pseudo_perplexity": None}
    inputs = original.repeat(len(positions), 1)
    inputs[torch.arange(len(positions)), positions] = MASK
    logits = model(inputs, inputs != PAD)
    rows = logits[torch.arange(len(positions)), positions].log_softmax(-1)
    terms = rows[torch.arange(len(positions)), original[positions]]
    return {"positions": len(positions), "sum_log_probability": terms.sum().item(),
            "pseudo_perplexity": (-terms.mean()).exp().item()}


def train_experiment(steps=240, seed=17, rate=0.15):
    torch.set_num_threads(2)
    torch.manual_seed(seed)
    training_rng = np.random.default_rng(seed)
    path = Path(__file__).with_name("alice_excerpt.txt")
    train, test, vocabulary, metadata = prepare_data(path)
    size = len(vocabulary)
    train_fixed = corrupt_batch(train, size, np.random.default_rng(100), rate)
    test_fixed = corrupt_batch(test, size, np.random.default_rng(101), rate)
    model = TinyMLM(size)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.002, weight_decay=0.01)
    checkpoints = []
    for step in range(steps + 1):
        if step % 40 == 0 or step == steps:
            checkpoints.append({"step": step,
                                "train": evaluate(model, train, *train_fixed),
                                "held_out": evaluate(model, test, *test_fixed)})
        if step == steps:
            break
        model.train()
        indices = training_rng.integers(0, len(train), size=16)
        original = train[indices]
        inputs, labels = corrupt_batch(original, size, training_rng, rate)
        selected = labels != -100
        if not selected.any():
            continue
        logits = model(inputs, original != PAD, selected)
        loss = torch_selected_loss(logits, labels[selected])
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1)
        optimizer.step()
    counts = torch.bincount(train[train >= len(SPECIALS)], minlength=size).double() + 1
    unigram = counts / counts.sum()
    test_targets = test_fixed[1][test_fixed[1] != -100]
    baseline = None if not len(test_targets) else -unigram[test_targets].log().mean().item()
    model.eval()
    # Keep the example literal: one actual held-out chunk, one known target.
    original = test[0]
    location = int((original >= len(SPECIALS)).nonzero()[0])
    inputs = original.clone()
    inputs[location] = MASK
    with torch.no_grad():
        distribution = model(inputs[None], (original != PAD)[None])[0, location].softmax(-1)
        probabilities, indices = distribution.topk(5)
        hidden, _ = model.encode(original[None], (original != PAD)[None])
    return {
        "seed": seed, "steps": steps, "mask_rate": rate, "data": metadata,
        "architecture": {"width": 48, "heads": 4, "layers": 2, "dropout": 0},
        "versions": {"torch": torch.__version__, "numpy": np.__version__},
        "checkpoints": checkpoints, "held_out_unigram_loss": baseline,
        "sample": {"input": [vocabulary[i] for i in inputs.tolist()],
                   "target_position": location, "target": vocabulary[int(original[location])],
                   "top5": [[vocabulary[i], p] for i, p in zip(indices.tolist(), probabilities.tolist())]},
        "leave_one_out": pseudo_log_likelihood(model, original),
        "transfer_shapes": {"token_tags": list(nn.Linear(48, 3)(hidden).shape),
                            "sequence_classes": list(nn.Linear(48, 2)(hidden[:, 0]).shape),
                            "span_scores": list(nn.Linear(48, 2)(hidden).shape)},
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=240)
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--rate", type=float, default=0.15)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = train_experiment(args.steps, args.seed, args.rate)
    encoded = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)
