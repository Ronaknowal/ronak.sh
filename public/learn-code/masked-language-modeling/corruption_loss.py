"""BERT-style corruption and selected cross-entropy, from array operations.

Run: python corruption_loss.py
Requires NumPy and PyTorch. IDs are integers; logits are finite real numbers.
"""
import json
import numpy as np
import torch
import torch.nn.functional as F


def corrupt(ids, eligible, vocab_size, mask_id, rng, rate=0.15):
    """Independent eligible-position selection, then 80/10/10 branches.

    Random replacements use the entire vocabulary and may equal the original.
    The caller supplies eligibility; do not infer it from the corrupted IDs.
    """
    selected = (rng.random(ids.shape) < rate) & eligible
    branch_draw = rng.random(ids.shape)
    masked = selected & (branch_draw < 0.8)
    random = selected & (branch_draw >= 0.8) & (branch_draw < 0.9)
    replaced = ids.copy()
    replaced[masked] = mask_id
    replacements = rng.integers(0, vocab_size, ids.shape)
    replaced[random] = replacements[random]
    labels = np.where(selected, ids, -100)
    branches = np.full(ids.shape, "ignore", dtype="U6")
    branches[masked], branches[random] = "mask", "random"
    branches[selected & (branch_draw >= 0.9)] = "keep"
    return replaced, labels, branches


def whole_word_selection(word_ids, rng, rate=0.15):
    """Select each unique word group, including all its pieces; -1 is special.

    This is independent word-group sampling, not BERT's capped token budget.
    """
    groups = np.unique(word_ids[word_ids >= 0])
    chosen = groups[rng.random(len(groups)) < rate]
    return np.isin(word_ids, chosen)


def selected_cross_entropy(logits, labels):
    """Return mean NLL, its logit gradient, and the number of scored positions.

    Shape: logits [..., V], labels [...]. At count=0 the mean is undefined;
    zero is only a no-op sentinel. Skip the update and metric contribution.
    """
    selected = labels != -100
    count = int(selected.sum())
    gradient = np.zeros_like(logits)
    if count == 0:
        return 0.0, gradient, 0
    rows = logits[selected]
    targets = labels[selected]
    shifted = rows - rows.max(axis=-1, keepdims=True)
    normalizer = np.exp(shifted).sum(axis=-1, keepdims=True)
    log_probabilities = shifted - np.log(normalizer)
    loss = -log_probabilities[np.arange(count), targets].mean()
    row_gradient = np.exp(log_probabilities)
    row_gradient[np.arange(count), targets] -= 1
    gradient[selected] = row_gradient / count
    return float(loss), gradient, count


def torch_selected_loss(logits, labels):
    selected = labels != -100
    if not selected.any():
        return logits.sum() * 0
    return F.cross_entropy(logits[selected], labels[selected], reduction="mean")


def main():
    probabilities = np.array([
        [0.5, 0.25, 0.125, 0.125],
        [0.25, 0.25, 0.25, 0.25],
        [0.1, 0.2, 0.3, 0.4],
    ], dtype=np.float64)
    logits = np.log(probabilities)
    labels = np.array([0, 2, -100])
    loss, gradient, count = selected_cross_entropy(logits, labels)
    tensor = torch.tensor(logits, requires_grad=True)
    reference = torch_selected_loss(tensor, torch.tensor(labels))
    reference.backward()
    updated = logits - 0.1 * gradient
    new_loss, _, _ = selected_cross_entropy(updated, labels)
    original = np.array([[2, 5, 6, 7, 8, 3, 0]])
    eligible = np.array([[False, True, True, True, True, False, False]])
    inputs, targets, branches = corrupt(
        original, eligible, 10, 4, np.random.default_rng(7), rate=0.5
    )
    print(json.dumps({
        "selected": count, "loss": loss,
        "loss_after_one_sgd_step": new_loss,
        "torch_loss": reference.item(),
        "gradient_max_difference": float(np.max(np.abs(gradient - tensor.grad.numpy()))),
        "ignored_gradient": gradient[-1].tolist(),
        "original": original.tolist(), "input": inputs.tolist(),
        "labels": targets.tolist(), "branches": branches.tolist(),
    }, indent=2))


if __name__ == "__main__":
    main()
