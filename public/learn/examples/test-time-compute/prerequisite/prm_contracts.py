"""Loss, mask and metric contracts for reasoning-step classifiers.

python prm_contracts.py --output contracts.json
Requires NumPy and PyTorch. All numbers here are constructed tests, not dataset
performance. Class labels sit at their current SEP; language-model targets shift.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F


def sigmoid(z):
    z = np.asarray(z, dtype=np.float64)
    return np.exp(-np.logaddexp(0, -z))


def binary_loss(z, target):
    return np.logaddexp(0, z) - np.asarray(target) * z


def masked_mean(values, mask):
    mask = np.asarray(mask, dtype=bool)
    if not mask.any():
        return None
    return float(np.asarray(values)[mask].mean())


def reductions(losses, masks):
    included = [np.asarray(v)[np.asarray(m, dtype=bool)] for v, m in zip(losses, masks)]
    nonempty = [v for v in included if len(v)]
    if not nonempty:
        return {"boundary_mean": None, "trajectory_mean": None, "boundaries": 0}
    return {"boundary_mean": float(np.concatenate(nonempty).mean()),
            "trajectory_mean": float(np.mean([v.mean() for v in nonempty])),
            "boundaries": sum(len(v) for v in nonempty)}


def aggregate(scores, method):
    values = np.asarray(scores, dtype=np.float64)
    if not len(values):
        return None
    if np.any((values < 0) | (values > 1)):
        raise ValueError("Step probability outside [0,1]")
    if method == "minimum":
        return float(values.min())
    if method == "mean":
        return float(values.mean())
    if method == "product":
        return float(values.prod())
    if method == "log_product":
        return float(np.log(values).sum()) if np.all(values > 0) else -float("inf")
    raise ValueError("Unknown reduction")


def first_error(scores, threshold):
    """None denotes an unknown gap; −1 denotes no predicted error."""
    for index, score in enumerate(scores):
        if score is None:
            return None
        if score < threshold:
            return index
    return -1


def localization_metrics(predictions, targets):
    errors = [(p, t) for p, t in zip(predictions, targets) if t is not None and t >= 0]
    correct = [(p, t) for p, t in zip(predictions, targets) if t == -1]
    a = sum(p == t for p, t in errors) / len(errors) if errors else None
    b = sum(p == t for p, t in correct) / len(correct) if correct else None
    harmonic = (None if a is None or b is None else
                (0.0 if a + b == 0 else 2 * a * b / (a + b)))
    return {"error_cases": len(errors), "all_correct_cases": len(correct),
            "error_accuracy": a, "all_correct_accuracy": b, "harmonic": harmonic,
            "unknown_targets": sum(t is None for t in targets)}


def selective_accuracy(scores, correctness, threshold):
    accepted = [c for s, c in zip(scores, correctness) if s >= threshold]
    return {"accepted": len(accepted), "total": len(scores),
            "coverage": len(accepted) / len(scores) if scores else None,
            "accuracy": sum(accepted) / len(accepted) if accepted else None}


def exercise_checks():
    return {
        "binary_changed": {"p": 0.25, "target": 1,
                           "loss": float(-np.log(0.25)), "logit_gradient": -0.75},
        "neutral_changed": {"probabilities": [0.1, 0.6, 0.3],
                            "acceptable": 0.9, "strict_progress": 0.3,
                            "gradient": [0.1, -0.4, 0.3]},
        "product_changed": {"A": 0.8 ** 2, "B4": 0.9 ** 4, "B5": 0.9 ** 5},
        "harmonic_changed": localization_metrics([0, 1, -1, -1, -1, -1, -1, -1, 0],
                                                   [0, 1, 2, 2, 3, -1, -1, -1, -1]),
    }


def verify():
    checks = []

    def close(name, actual, expected, atol=1e-10):
        passed = bool(np.allclose(actual, expected, atol=atol, rtol=1e-10))
        checks.append({"name": name, "passed": passed})
        if not passed:
            raise AssertionError(f"{name}: {actual} != {expected}")

    z = np.array([-1000, -2, 0, np.log(4), 1000], dtype=float)
    targets = np.array([0, 1, 0, 0, 1], dtype=float)
    tensor = torch.tensor(z, dtype=torch.float64, requires_grad=True)
    labels = torch.tensor(targets, dtype=torch.float64)
    per_item = F.binary_cross_entropy_with_logits(tensor, labels, reduction="none")
    close("stable BCE", binary_loss(z, targets), per_item.detach().numpy())
    per_item.sum().backward()
    close("BCE logit derivative", sigmoid(z) - targets, tensor.grad.numpy())
    for index in (1, 2, 3):
        plus, minus = z.copy(), z.copy()
        plus[index] += 1e-5
        minus[index] -= 1e-5
        derivative = (binary_loss(plus, targets).sum() -
                      binary_loss(minus, targets).sum()) / 2e-5
        close(f"finite derivative {index}", derivative, sigmoid(z)[index] - targets[index], 1e-8)

    logits = torch.tensor([[2.0, 0, -1], [-3.0, 1, 2]], dtype=torch.float64,
                          requires_grad=True)
    classes = torch.tensor([0, 1])
    probabilities = torch.softmax(logits, dim=-1)
    manual = torch.logsumexp(logits, dim=-1) - logits[torch.arange(2), classes]
    library = F.cross_entropy(logits, classes, reduction="none")
    close("three-class CE", manual.detach().numpy(), library.detach().numpy())
    library.sum().backward()
    expected = probabilities.detach().numpy() - np.eye(3)[classes.numpy()]
    close("three-class derivative", logits.grad.numpy(), expected)

    tokens = ["Q", "a", "SEP", "b", "SEP", "PAD"]
    targets_at_current_boundary = [-100, -100, 2, -100, 0, -100]
    target_mask = [label != -100 for label in targets_at_current_boundary]
    triangle = np.tril(np.ones((6, 6), dtype=int))
    triangle[:, 5] = 0  # PAD is not a real key, even in the last causal row.
    close("current-boundary positions", np.flatnonzero(target_mask), [2, 4])
    close("position2 visibility", np.flatnonzero(triangle[2]), [0, 1, 2])
    close("different reduction denominators", list(reductions([[4], [1, 1, 1]],
                                                              [[1], [1, 1, 1]]).values()),
          [1.75, 2.5, 4])
    assert masked_mean([4], [0]) is None
    checks.append({"name": "all-masked mean unknown", "passed": True})
    close("worked invalid BCE", binary_loss(np.log(4), 0), np.log(5))
    close("worked BCE derivative", sigmoid(np.log(4)), 0.8)
    # A simple contextual map isolates the route; real attention is richer.
    question = torch.tensor([0.0, 2.0], dtype=torch.float64, requires_grad=True)
    current = torch.tensor([2.0, 2.0], dtype=torch.float64, requires_grad=True)
    head = torch.tensor([0.4, 0.3], dtype=torch.float64, requires_grad=True)
    bias = torch.tensor(np.log(4) - 1, dtype=torch.float64, requires_grad=True)
    hidden = (question + current) / 2
    hidden.retain_grad()
    logit = hidden @ head + bias
    F.binary_cross_entropy_with_logits(logit, torch.tensor(0.0, dtype=torch.float64)).backward()
    close("constructed hidden map", hidden.detach().numpy(), [1, 2])
    close("head weight gradient", head.grad.numpy(), [0.8, 1.6])
    close("head bias gradient", bias.grad.numpy(), 0.8)
    close("hidden gradient route", hidden.grad.numpy(), [0.32, 0.24])
    close("earlier contextual input gradient", question.grad.numpy(), [0.16, 0.12])
    close("current contextual input gradient", current.grad.numpy(), [0.16, 0.12])
    close("published metric convention example", localization_metrics(
        [0, 1, 2, -1, -1, -1, 0], [0, 1, 2, 3, -1, -1, -1])["harmonic"], 12 / 17)
    assert localization_metrics([-1], [-1])["harmonic"] is None
    assert selective_accuracy([0.2], [True], 0.9)["accuracy"] is None
    assert first_error([0.9, None, 0.1], 0.5) is None
    assert aggregate([], "product") is None
    assert aggregate([1, 0], "log_product") == -float("inf")
    checks.append({"name": "unknown/empty/exact-zero contracts", "passed": True})
    changed = exercise_checks()
    close("changed harmonic", changed["harmonic_changed"]["harmonic"], 12 / 23)
    return {"checks": checks, "passed": len(checks), "torch": torch.__version__,
            "tokens": tokens, "labels": targets_at_current_boundary,
            "visibility": triangle.tolist(), "practice": changed,
            "contextual_fixture": {"question_embedding": [0, 2], "current_embedding": [2, 2],
                                   "hidden": [1, 2], "head": [0.4, 0.3],
                                   "bias": float(np.log(4) - 1), "logit": float(logit.detach()),
                                   "head_gradient": head.grad.tolist(),
                                   "hidden_gradient": hidden.grad.tolist(),
                                   "question_gradient": question.grad.tolist()},
            "scope": "Constructed contract checks; no training or benchmark"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = verify()
    text = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
