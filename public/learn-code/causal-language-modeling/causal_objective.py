"""Stable next-token loss, its gradient, and information boundaries.
Run: python causal_objective.py  (NumPy and PyTorch)
"""
import json
import numpy as np
import torch
import torch.nn.functional as F


def log_softmax(logits):
    shifted = np.asarray(logits, dtype=np.float64)
    shifted = shifted - shifted.max(axis=-1, keepdims=True)
    return shifted - np.log(np.exp(shifted).sum(axis=-1, keepdims=True))


def objective(logits, targets, ignore=-100):
    """Targets have shape logits.shape[:-1]; return sum, count, mean, gradient."""
    scores = np.asarray(logits, dtype=np.float64)
    labels = np.asarray(targets, dtype=np.int64)
    if scores.shape[:-1] != labels.shape:
        raise ValueError("One target is required per vocabulary vector")
    valid = labels != ignore
    selected = labels[valid]
    if np.any((selected < 0) | (selected >= scores.shape[-1])):
        raise ValueError("A target is outside the vocabulary")
    logs = log_softmax(scores)
    gradient = np.zeros_like(scores)
    count = int(valid.sum())
    if count == 0:
        return 0.0, 0, None, gradient
    rows = logs[valid]
    total = float(-rows[np.arange(count), selected].sum())
    active_gradient = np.exp(rows)
    active_gradient[np.arange(count), selected] -= 1
    gradient[valid] = active_gradient / count
    return total, count, total / count, gradient


def allowed_attention(document_ids):
    """Separate documents: each query can read only earlier/self keys in its document."""
    ids = np.asarray(document_ids)
    causal = np.arange(len(ids))[None, :] <= np.arange(len(ids))[:, None]
    return causal & (ids[:, None] == ids[None, :])


def sample(logits, temperature, uniform):
    if temperature <= 0 or not 0 <= uniform < 1:
        raise ValueError("temperature must be positive; uniform must be in [0,1)")
    probabilities = np.exp(log_softmax(np.asarray(logits) / temperature))
    return int(np.searchsorted(np.cumsum(probabilities), uniform, side="right"))


def main():
    logits = np.log([[4.0, 2.0, 1.0, 1.0], [1.0, 1.0, 2.0, 4.0]])
    labels = np.array([0, 2])
    total, count, mean, gradient = objective(logits, labels)
    tensor = torch.tensor(logits, requires_grad=True)
    reference = F.cross_entropy(tensor, torch.tensor(labels))
    reference.backward()
    np.testing.assert_allclose(mean, reference.item(), atol=1e-12)
    np.testing.assert_allclose(gradient, tensor.grad.numpy(), atol=1e-12)
    epsilon = 1e-5
    for index in np.ndindex(logits.shape):
        delta = np.zeros_like(logits)
        delta[index] = epsilon
        numeric = (objective(logits + delta, labels)[2] - objective(logits - delta, labels)[2]) / (2 * epsilon)
        np.testing.assert_allclose(gradient[index], numeric, atol=1e-9)
    print(json.dumps({"nll_sum": total, "valid_targets": count, "mean_nats": mean,
                      "perplexity": np.exp(mean), "gradient": gradient.tolist(),
                      "independent_document_mask": allowed_attention([0, 0, 0, 1, 1, 1]).astype(int).tolist()}, indent=2))


if __name__ == "__main__":
    main()
