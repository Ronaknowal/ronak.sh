"""Offline CPU precision study. Keep all four Python files and Alice text together."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import platform
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from fp8_linear import EmulatedLinear, official_config


ROOT = Path(__file__).resolve().parent
CONTEXT, WIDTH, BATCH = 4, 64, 64


def data():
    train = (ROOT / "alice-train.txt").read_text(encoding="utf-8")
    heldout = (ROOT / "alice-heldout.txt").read_text(encoding="utf-8")
    vocabulary = sorted(set(train))
    mapping = {char: i + 1 for i, char in enumerate(vocabulary)}
    def windows(text):
        ids = torch.tensor([mapping.get(char, 0) for char in text])
        rows = ids.unfold(0, CONTEXT + 1, 1)
        valid = rows[:, -1] != 0
        x = F.one_hot(rows[valid, :-1], len(mapping) + 1).float().flatten(1)
        return x, rows[valid, -1], int((~valid).sum())
    return windows(train), windows(heldout), vocabulary


def make_model(vocabulary_size, mode):
    layer = EmulatedLinear if mode == "custom" else nn.Linear
    model = nn.Sequential(layer(CONTEXT * vocabulary_size, WIDTH), nn.Tanh(),
                          layer(WIDTH, vocabulary_size))
    if mode == "torchao":
        from torchao.float8 import convert_to_float8_training
        convert_to_float8_training(model, config=official_config())
    return model


@torch.no_grad()
def score(model, x, y, fp32=False):
    total = 0.0
    for start in range(0, len(y), 256):
        batch = x[start:start + 256]
        if fp32:
            hidden = torch.tanh(F.linear(batch, model[0].weight, model[0].bias))
            logits = F.linear(hidden, model[2].weight, model[2].bias)
        else:
            logits = model(batch)
        total += float(F.cross_entropy(logits, y[start:start + 256], reduction="sum"))
    return total / len(y) if len(y) else None


def run(steps=240, seeds=(17, 29)):
    torch.set_num_threads(1)
    train, heldout, vocabulary = data()
    x, y, _ = train
    vx, vy, unknown = heldout
    records = []
    for seed in seeds:
        torch.manual_seed(seed)
        initial = make_model(len(vocabulary) + 1, "fp32").state_dict()
        batches = torch.randint(len(y), (steps, BATCH), generator=torch.Generator().manual_seed(seed + 100))
        reference_gradient = None
        for mode in ("fp32", "custom", "torchao"):
            model = make_model(len(vocabulary) + 1, mode)
            model.load_state_dict(copy.deepcopy(initial))
            optimizer = torch.optim.AdamW(model.parameters(), lr=0.003, weight_decay=0.01)
            curve, gradient_error = [], None
            for step in range(steps + 1):
                if step % 20 == 0 or step == steps:
                    curve.append({"step": step, "train_nll": score(model, x, y),
                                  "heldout_nll": score(model, vx, vy),
                                  "heldout_fp32_nll": score(model, vx, vy, fp32=True)})
                if step == steps:
                    break
                indices = batches[step]
                optimizer.zero_grad(set_to_none=True)
                loss = F.cross_entropy(model(x[indices]), y[indices])
                loss.backward()
                if step == 0:
                    gradient = torch.cat([p.grad.flatten() for p in model.parameters()])
                    if mode == "fp32":
                        reference_gradient = gradient.clone()
                    gradient_error = float((gradient - reference_gradient).norm() / reference_gradient.norm())
                optimizer.step()
            records.append({"seed": seed, "mode": mode, "curve": curve,
                            "initial_gradient_relative_l2": gradient_error})
    hashes = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
              for name in ("alice-train.txt", "alice-heldout.txt", "fp8_linear.py", "fp8_language_study.py")}
    return {"python": platform.python_version(), "numpy": np.__version__, "torch": torch.__version__,
            "device": "cpu", "steps": steps, "seeds": list(seeds), "context": CONTEXT,
            "width": WIDTH, "batch": BATCH, "evaluation_batch": 256,
            "vocabulary_size": len(vocabulary) + 1, "train_targets": len(y), "heldout_targets": len(vy),
            "unknown_heldout_targets_excluded": unknown, "hashes": hashes, "records": records}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=240)
    parser.add_argument("--output", type=Path, default=Path("fp8-study.json"))
    args = parser.parse_args()
    result = run(args.steps)
    with args.output.open("x", encoding="utf-8") as output:
        json.dump(result, output, indent=2)
    print(json.dumps({"records": [{"seed": r["seed"], "mode": r["mode"], **r["curve"][-1]}
                                   for r in result["records"]]}, indent=2))
