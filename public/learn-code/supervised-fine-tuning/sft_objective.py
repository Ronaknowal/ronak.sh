"""SFT's shifted, masked objective and a complete manual context backward pass.

Run: python sft_objective.py --output objective-report.json
Requires NumPy; the executable verification also uses PyTorch.
This small mean-context model explains gradient credit, not Transformer quality.
"""
import argparse
import json
from pathlib import Path
import numpy as np


IGNORE = -100


def masked_ce(logits, labels, reduction="token"):
    """Align z[:,j] with labels[:,j+1]; return loss and all logit derivatives.

    Labels are aligned with input token positions BEFORE shifting. A selected
    label must be a vocabulary ID. Ignored positions contribute no direct loss.
    Example mean gives each example equal weight and requires targets in each.
    """
    z = np.asarray(logits, dtype=np.float64)
    y = np.asarray(labels)
    if z.ndim != 3 or y.shape != z.shape[:2] or z.shape[1] < 2:
        raise ValueError("Expected logits [B,L,V], aligned labels [B,L], L>=2")
    if z.shape[0] == 0 or z.shape[2] < 2 or not np.isfinite(z).all():
        raise ValueError("Require a nonempty batch, V>=2 and finite logits")
    if not np.issubdtype(y.dtype, np.integer):
        raise ValueError("Labels must have an integer dtype")
    if np.any((y != IGNORE) & ((y < 0) | (y >= z.shape[-1]))):
        raise ValueError("Selected labels must be vocabulary IDs")
    targets = y[:, 1:]
    selected = targets != IGNORE
    counts = selected.sum(axis=1)
    count = int(counts.sum())
    if count == 0:
        raise ValueError("No supervised shifted targets")
    if reduction not in ("token", "example", "sum"):
        raise ValueError("Reduction must be token, example or sum")
    if reduction == "example" and np.any(counts == 0):
        raise ValueError("Example mean requires targets in every example")
    shifted = z[:, :-1]
    stable = shifted - shifted.max(axis=-1, keepdims=True)
    logp = stable - np.log(np.exp(stable).sum(axis=-1, keepdims=True))
    rows, positions = np.nonzero(selected)
    terms = -logp[rows, positions, targets[selected]]
    weights = np.ones(len(terms), dtype=np.float64)
    if reduction == "token":
        weights /= count
    elif reduction == "example":
        weights /= z.shape[0] * counts[rows]
    gradient = np.zeros_like(z)
    chosen = np.exp(logp[rows, positions])
    chosen[np.arange(count), targets[selected]] -= 1
    gradient[rows, positions] = chosen * weights[:, None]
    return {
        "loss": float(terms @ weights),
        "nll_sum": float(terms.sum()),
        "targets": count,
        "counts": counts,
        "terms": terms,
        "gradient": gradient,
    }


def context_forward(ids, embedding, head, visible=None):
    """Average visible current/past embeddings, then apply one output head.

    visible[j,k] is the explicitly allowed context edge for logit position j.
    Even an ignored logit row may supply an embedding to a supervised later row.
    """
    ids = np.asarray(ids, dtype=np.int64)
    embedding = np.asarray(embedding, dtype=np.float64)
    head = np.asarray(head, dtype=np.float64)
    if ids.ndim != 1 or not len(ids) or embedding.ndim != 2:
        raise ValueError("Expected a nonempty token vector and embedding matrix")
    if head.shape != (embedding.shape[1], embedding.shape[0]):
        raise ValueError("Head must have shape [embedding width, vocabulary]")
    if np.any(ids < 0) or np.any(ids >= len(embedding)):
        raise ValueError("Token ID outside the vocabulary")
    if not np.isfinite(embedding).all() or not np.isfinite(head).all():
        raise ValueError("Parameters must be finite")
    causal = np.tril(np.ones((len(ids), len(ids)), dtype=bool))
    visible = causal if visible is None else np.asarray(visible, dtype=bool)
    if visible.shape != causal.shape or np.any(visible & ~causal):
        raise ValueError("Visibility must be a causal [L,L] matrix")
    counts = visible.sum(axis=1, keepdims=True)
    if np.any(counts == 0):
        raise ValueError("Each logit position needs at least one visible input")
    mixing = visible / counts
    hidden = mixing @ embedding[ids]
    return hidden @ head, (ids, mixing, hidden, head)


def context_backward(dlogits, cache, vocabulary):
    ids, mixing, hidden, head = cache
    dhead = hidden.T @ dlogits
    dtoken_rows = mixing.T @ (dlogits @ head.T)
    dembedding = np.zeros((vocabulary, head.shape[0]), dtype=np.float64)
    # Repeated IDs share one parameter row and must accumulate all positions.
    np.add.at(dembedding, ids, dtoken_rows)
    return {"embedding": dembedding, "head": dhead,
            "token_position_gradient": dtoken_rows}


def context_step(ids, labels, embedding, head, learning_rate=0.1, visible=None):
    if not np.isfinite(learning_rate) or learning_rate < 0:
        raise ValueError("Learning rate must be finite and nonnegative")
    logits, cache = context_forward(ids, embedding, head, visible)
    result = masked_ce(logits[None], np.asarray(labels)[None])
    grads = context_backward(result["gradient"][0], cache, len(embedding))
    updated = {"embedding": embedding - learning_rate * grads["embedding"],
               "head": head - learning_rate * grads["head"]}
    after, _ = context_forward(ids, updated["embedding"], updated["head"], visible)
    return result, grads, updated, masked_ce(after[None], np.asarray(labels)[None])


def verify():
    import torch
    import torch.nn.functional as F
    rng = np.random.default_rng(17)
    checks = []
    logits = np.zeros((1, 6, 7))
    labels = np.array([[IGNORE, IGNORE, IGNORE, IGNORE, 4, 5]])
    np.testing.assert_allclose(masked_ce(logits, labels)["loss"], np.log(7))
    # Specify complete probability rows so .5 and .25 are actual probabilities.
    probs = np.full((2, 7), 0.5 / 6)
    probs[0, 4] = 0.5
    probs[1] = 0.75 / 6
    probs[1, 5] = 0.25
    logits[0, 3:5] = np.log(probs)
    np.testing.assert_allclose(masked_ce(logits, labels)["loss"], -np.log(0.125)/2)
    checks.append("Uniform and hand-calculated two-target losses")
    z = rng.normal(size=(2, 7, 9))
    y = np.array([[IGNORE]*4+[4, 5, IGNORE], [IGNORE]*3+[3, 4, 5, 6]])
    for reduction in ("token", "example", "sum"):
        actual = masked_ce(z, y, reduction)
        tz = torch.tensor(z, requires_grad=True)
        ty = torch.tensor(y)
        losses = F.cross_entropy(tz[:, :-1].reshape(-1, 9), ty[:, 1:].reshape(-1),
                                 ignore_index=IGNORE, reduction="none").reshape(2, -1)
        counts = (ty[:, 1:] != IGNORE).sum(1)
        expected = losses.sum()
        if reduction == "token":
            expected = expected / counts.sum()
        elif reduction == "example":
            expected = (losses.sum(1) / counts).mean()
        expected.backward()
        np.testing.assert_allclose(actual["loss"], expected.item(), atol=1e-12)
        np.testing.assert_allclose(actual["gradient"], tz.grad.numpy(), atol=1e-12)
    checks.append("All shifted logit derivatives match Torch in three reductions")
    ids = np.array([0, 1, 2, 3, 4, 5])
    embedding = rng.normal(scale=0.4, size=(7, 3))
    head = rng.normal(scale=0.3, size=(3, 7))
    before, grads, updated, after = context_step(ids, labels[0], embedding, head)
    max_error = 0.0
    for name, array in (("embedding", embedding), ("head", head)):
        for index in np.ndindex(array.shape):
            previous = array[index]
            values = []
            for delta in (1e-6, -1e-6):
                array[index] = previous + delta
                pred, _ = context_forward(ids, embedding, head)
                values.append(masked_ce(pred[None], labels)["loss"])
            array[index] = previous
            numeric = (values[0] - values[1]) / 2e-6
            max_error = max(max_error, abs(numeric - grads[name][index]))
    assert max_error < 1e-8
    assert np.linalg.norm(grads["embedding"][1]) > 0
    assert np.all(before["gradient"][0, :3] == 0)
    assert after["loss"] < before["loss"]
    checks.append("Every embedding/head derivative, ignored direct loss, context credit and SGD")
    extreme = logits.copy()
    extreme[0, 3] += 10000
    np.testing.assert_allclose(masked_ce(extreme, labels)["loss"], masked_ce(logits, labels)["loss"], atol=1e-12)
    for bad_logits, bad_labels in ((logits, np.full_like(labels, IGNORE)),
                                  (np.full_like(logits, np.nan), labels)):
        try:
            masked_ce(bad_logits, bad_labels)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid loss input was accepted")
    checks.append("Stable shifted logits, zero-target and nonfinite rejection")
    return {"checks": checks, "finite_difference_max_error": max_error,
            "before_loss": before["loss"], "after_loss": after["loss"],
            "prompt_embedding_gradient": grads["embedding"][1].tolist(),
            "updated": {k: v.tolist() for k, v in updated.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = json.dumps(verify(), indent=2)
    if args.output:
        args.output.write_text(report + "\n", encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
