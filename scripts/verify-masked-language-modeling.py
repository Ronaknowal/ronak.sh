"""Complementary native checks for the masked-language lesson.

Run with the lesson Python environment. No network, training replay or receipt
overwrite. Pass --output to save a new source-bound verification receipt.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
from datetime import datetime, timezone

import numpy as np
import torch
import torch.nn.functional as F

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / "public/learn-code/masked-language-modeling"
sys.path.insert(0, str(CODE))
import corruption_loss as core
import tiny_mlm as tiny


def verify():
    checks = []
    def check(name, condition):
        if not bool(condition):
            raise AssertionError(name)
        checks.append(name)

    rng = np.random.default_rng(41)
    logits = rng.normal(size=(2, 4, 5))
    labels = np.array([[2, -100, 1, 3], [-100, 4, -100, 0]])
    loss, grad, count = core.selected_cross_entropy(logits, labels)
    manual = []
    for i, j in zip(*np.where(labels != -100)):
        row = logits[i, j]
        manual.append(math.log(sum(math.exp(float(v)) for v in row)) - row[labels[i, j]])
    check("Independent scalar loss", abs(loss - sum(manual) / len(manual)) < 1e-12)
    tensor = torch.tensor(logits, requires_grad=True)
    reference = F.cross_entropy(tensor.reshape(-1, 5), torch.tensor(labels).reshape(-1), ignore_index=-100)
    reference.backward()
    check("Torch loss", abs(loss - reference.item()) < 1e-12)
    check("Torch logit gradients", np.allclose(grad, tensor.grad.numpy(), atol=1e-12))
    check("Ignored logit gradient", np.all(grad[labels == -100] == 0))
    check("Row gradient conservation", np.allclose(grad.sum(-1), 0, atol=1e-12))
    for coordinate in [(0, 0, 2), (0, 1, 4), (1, 3, 2)]:
        plus, minus = logits.copy(), logits.copy()
        plus[coordinate] += 1e-5
        minus[coordinate] -= 1e-5
        numerical = (core.selected_cross_entropy(plus, labels)[0] - core.selected_cross_entropy(minus, labels)[0]) / 2e-5
        check(f"Finite difference {coordinate}", abs(numerical - grad[coordinate]) < 1e-9)
    shifted_loss, shifted_grad, _ = core.selected_cross_entropy(logits + 1000, labels)
    check("Stable logit shift", abs(shifted_loss - loss) < 1e-12 and np.allclose(shifted_grad, grad, atol=1e-12))
    empty = np.full(labels.shape, -100)
    empty_loss, empty_gradient, empty_count = core.selected_cross_entropy(logits, empty)
    check("No-op sentinel includes zero count", empty_loss == 0 and empty_count == 0 and np.all(empty_gradient == 0))
    check("Uneven-batch target mean", math.isclose((0.4 + 3 * 1.2) / 4, 1.0))
    for eligible in [np.zeros((2, 6), bool), np.ones((2, 6), bool)]:
        ids = np.arange(12).reshape(2, 6)
        original = ids.copy()
        for rate in [0, 0.15, 0.47, 1]:
            corrupted, target, branch = core.corrupt(ids, eligible, 16, 4, np.random.default_rng(6), rate)
            check(f"Labels and immutable originals {eligible.any()} {rate}", np.array_equal(ids, original) and np.all(target[target != -100] == ids[target != -100]))
            check(f"Eligibility {eligible.any()} {rate}", np.all(target[~eligible] == -100) and np.all(corrupted[~eligible] == ids[~eligible]))
            if rate == 0:
                check("Zero rate", np.all(target == -100))
            if rate == 1:
                check("Full rate", np.array_equal(target != -100, eligible))
    # Statistical audit counts branch identity, including possible self/special draws.
    population = np.full((1000, 100), 7)
    corrupted, target, branch = core.corrupt(population, np.ones_like(population, bool), 16, 4, np.random.default_rng(17))
    selected = target != -100
    check("Bernoulli selection statistical rate", abs(selected.mean() - .15) < .004)
    for name, expected in [("mask", .8), ("random", .1), ("keep", .1)]:
        actual = (branch[selected] == name).mean()
        check(f"Conditional branch {name}", abs(actual - expected) < .015)
    check("Random can equal original", np.any((branch == "random") & (corrupted == population)))
    check("Random can draw PAD", np.any((branch == "random") & (corrupted == tiny.PAD)))
    for rate in [0, .35, 1]:
        words = np.array([-1, 0, 1, 1, 1, 2, -1])
        mask = core.whole_word_selection(words, np.random.default_rng(5), rate)
        check(f"Whole word grouping {rate}", not mask[0] and not mask[-1] and mask[2] == mask[3] == mask[4])

    torch.manual_seed(3)
    attention = tiny.SelfAttention(8, 2).double()
    hidden = torch.randn(1, 5, 8, dtype=torch.float64, requires_grad=True)
    valid = torch.tensor([[True, True, True, True, False]])
    for causal in [False, True]:
        actual, weights = attention(hidden, valid, causal=causal)
        qkv = attention.qkv(hidden).reshape(1, 5, 3, 2, 4).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)
        allowed = valid[:, None, None, :].expand(1, 1, 5, 5)
        if causal:
            allowed = allowed & torch.ones(5, 5, dtype=torch.bool).tril()
        sdpa = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed, dropout_p=0)
        expected = attention.output(sdpa.transpose(1, 2).reshape(1, 5, 8))
        check(f"Attention versus independent SDPA {causal}", torch.allclose(actual, expected, atol=1e-12, rtol=1e-12))
        check(f"Padding key zero {causal}", torch.all(weights[..., -1] == 0))
        check(f"Normalized attention rows {causal}", torch.allclose(weights.sum(-1), torch.ones_like(weights.sum(-1))))
    changed = hidden.detach().clone()
    changed[:, 3] += 2
    bidirectional = attention(hidden, valid)[0]
    bidirectional_changed = attention(changed, valid)[0]
    causal = attention(hidden, valid, causal=True)[0]
    causal_changed = attention(changed, valid, causal=True)[0]
    check("Future edit influences earlier bidirectional row", not torch.allclose(bidirectional[:, 1], bidirectional_changed[:, 1]))
    check("Future edit cannot influence earlier causal row", torch.allclose(causal[:, 1], causal_changed[:, 1], atol=0, rtol=0))
    bidirectional[:, 1].sum().backward()
    check("Selected output has context gradient", hidden.grad[:, 3].abs().sum() > 0)
    check("Padding input has no attention contribution", torch.all(hidden.grad[:, 4] == 0))

    train, test, vocabulary, metadata = tiny.prepare_data(CODE / "alice_excerpt.txt")
    check("Supplied real corpus identity", metadata["data_sha256"] == "d4d1e63f00060bfc541d917618dd62dbaa7b8cfda7cb8ebb4d6ca4d2eb48d42f")
    check("Split and tokenizer numbers", metadata["words"] == 6118 and metadata["train_words"] == 4894 and metadata["test_words"] == 1224 and len(vocabulary) == 1012 and metadata["test_unknown_words"] == 162)
    check("Chunk counts", train.shape == (204, 26) and test.shape == (51, 26))
    first = tiny.corrupt_batch(test, len(vocabulary), np.random.default_rng(101))
    second = tiny.corrupt_batch(test, len(vocabulary), np.random.default_rng(101))
    check("Frozen evaluation exact reproducibility", all(torch.equal(a, b) for a, b in zip(first, second)))
    check("Held-out target count", int((first[1] != -100).sum()) == 166)
    model = tiny.TinyMLM(12, length=7, width=8, heads=2, layers=1)
    ids = torch.tensor([[2, 5, 6, 7, 3, 0, 0]])
    nothing = torch.full_like(ids, -100)
    result = tiny.evaluate(model, ids, ids, nothing)
    check("No target evaluation null not zero", result == {"targets": 0, "loss": None, "accuracy": None})
    full = model(ids, ids != tiny.PAD)
    mask = ids >= 5
    gathered = model(ids, ids != tiny.PAD, mask)
    check("Gather-before-head equals selected full head", torch.allclose(gathered, full[mask], atol=1e-6))
    check("Constructed joint mass", sum([.25] * 4) == 1 and .25 + .25 == .5)
    check("PLL arithmetic", abs(math.exp(101.0411376953125 / 19) - 203.96624755859375) < .0001)
    files = [*CODE.glob("*.py"), CODE / "alice_excerpt.txt", CODE / "provenance.md", Path(__file__)]
    return {"status": "passed", "createdAt": datetime.now(timezone.utc).isoformat(),
            "checkCount": len(checks), "checks": checks,
            "versions": {"numpy": np.__version__, "torch": torch.__version__},
            "sourceHashes": {str(path.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.output and args.output.exists():
        raise FileExistsError("Choose a fresh receipt path")
    result = verify()
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": result["status"], "checkCount": result["checkCount"]}))
