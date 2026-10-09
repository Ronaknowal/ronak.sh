"""Match a linear PRM's scratch loss/gradient/update using ordinary PyTorch.

python prm_torch.py --data data --model study/model.json --output torch.json
The default verifies a matched update and conserved fitted weights; it does not
run another scientific fit. --fit-out NEW_DIRECTORY explicitly offers that route.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from prm_classifier import load_splits, objective_gradient, softmax


def verify(data, model_path, fit_out=None):
    torch.set_num_threads(2)
    _, matrices = load_splits(data)
    saved = json.loads(Path(model_path).read_text(encoding="utf8"))
    weights = np.array(saved["initial_weights"])
    bias = np.array(saved["initial_bias"])
    model = torch.nn.Linear(1024, 3, dtype=torch.float64)
    with torch.no_grad():
        model.weight.copy_(torch.from_numpy(weights.T))
        model.bias.copy_(torch.from_numpy(bias))
    x, y = matrices["train"]
    inputs = torch.from_numpy(x)
    targets = torch.from_numpy(y)
    optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
    checks = []

    def close(name, actual, expected):
        passed = bool(np.allclose(actual, expected, atol=2e-12, rtol=2e-12))
        checks.append({"name": name, "passed": passed})
        if not passed:
            raise AssertionError(name)

    scratch_loss, dw, db = objective_gradient(x, y, weights, bias)
    logits = model(inputs)
    loss = F.cross_entropy(logits, targets) + 0.001 * model.weight.square().sum() / 2
    close("logit weight-layout mapping", logits.detach().numpy(), x @ weights + bias)
    close("objective reduction", loss.detach().numpy(), scratch_loss)
    optimizer.zero_grad()
    loss.backward()
    close("weight gradient", model.weight.grad.numpy().T, dw)
    close("bias gradient", model.bias.grad.numpy(), db)
    optimizer.step()
    close("SGD weights", model.weight.detach().numpy().T, weights - 0.1 * dw)
    close("SGD bias", model.bias.detach().numpy(), bias - 0.1 * db)

    # Sparse/all-masked supervision needs an explicit guard before mean CE.
    before = {name: value.detach().clone() for name, value in model.named_parameters()}
    mask = torch.zeros(len(targets), dtype=torch.bool)
    if mask.any():
        optimizer.zero_grad()
        F.cross_entropy(model(inputs)[mask], targets[mask]).backward()
        optimizer.step()
    for name, value in model.named_parameters():
        close(f"all-masked preserves {name}", value.detach().numpy(), before[name].numpy())

    with torch.no_grad():
        model.weight.copy_(torch.tensor(saved["weights"], dtype=torch.float64).T)
        model.bias.copy_(torch.tensor(saved["bias"], dtype=torch.float64))
    for split, (split_x, _) in matrices.items():
        probabilities = model(torch.from_numpy(split_x)).softmax(dim=-1).detach().numpy()
        close(f"retained fitted {split} probabilities", probabilities,
              softmax(split_x @ np.array(saved["weights"]) + np.array(saved["bias"])))

    executed_fits = 0
    if fit_out is not None:
        fit_out = Path(fit_out)
        if fit_out.exists():
            raise FileExistsError("Choose a new directory for an explicit independent fit")
        fit_out.mkdir(parents=True)
        with torch.no_grad():
            model.weight.copy_(torch.from_numpy(weights.T))
            model.bias.copy_(torch.from_numpy(bias))
        for _ in range(160):
            optimizer.zero_grad()
            loss = F.cross_entropy(model(inputs), targets) + 0.001 * model.weight.square().sum() / 2
            loss.backward()
            optimizer.step()
        torch.save(model.state_dict(), fit_out / "linear-prm.pt")
        executed_fits = 1
    return {"checks": checks, "passed": len(checks), "torch": torch.__version__,
            "scientific_fits_executed": executed_fits,
            "scope": "Ordinary-tool parity on the exact fixed corpus; no pretrained reasoner"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--fit-out", type=Path)
    args = parser.parse_args()
    report = verify(args.data, args.model, args.fit_out)
    text = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
