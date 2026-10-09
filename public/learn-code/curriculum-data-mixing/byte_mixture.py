"""A complete learned byte-bigram model and domain-weight optimization.

Requires NumPy. Run `python byte_mixture.py` for a Torch autograd comparison
(also requires PyTorch). Each row W[a] predicts the byte following byte a.
This is a one-byte context model, not a Transformer or an LLM benchmark.
"""
import json
from pathlib import Path
import numpy as np
from mixing_math import normalize, exponentiated_update, alignment

ROOT = Path(__file__).resolve().parent
VOCABULARY = 256


def load_pairs(path=ROOT / "literary-domains.json"):
    corpus = json.loads(Path(path).read_text(encoding="utf-8"))
    result = []
    for domain in corpus["domains"]:
        splits = {}
        for split in ("train", "tune", "test"):
            fragments = []
            for paragraph in domain["paragraphs"]:
                if paragraph["split"] == split:
                    ids = np.frombuffer(paragraph["text"].encode("utf-8"), dtype=np.uint8).astype(np.int64)
                    if len(ids) > 1:
                        fragments.append(np.stack([ids[:-1], ids[1:]], axis=1))
            if not fragments:
                raise ValueError(f"Empty {split} for {domain['id']}")
            splits[split] = np.concatenate(fragments)
        result.append({"id": domain["id"], "title": domain["title"], **splits})
    return result


def log_probabilities(weights):
    w = np.asarray(weights, dtype=np.float64)
    if w.ndim != 2 or w.shape[0] != w.shape[1] or not np.isfinite(w).all():
        raise ValueError("A finite square logit matrix is required")
    shifted = w - w.max(axis=1, keepdims=True)
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))


def token_losses(weights, pairs):
    pairs = np.asarray(pairs, dtype=np.int64)
    if pairs.ndim != 2 or pairs.shape[1] != 2 or len(pairs) == 0:
        raise ValueError("At least one [input,target] pair is required")
    if (pairs < 0).any() or (pairs >= len(weights)).any():
        raise ValueError("Byte index outside model vocabulary")
    logs = log_probabilities(weights)
    return -logs[pairs[:, 0], pairs[:, 1]]


def loss_gradient(weights, pairs):
    """Exact mean-token CE and gradient; repeated pairs accumulate correctly."""
    pairs = np.asarray(pairs, dtype=np.int64)
    losses = token_losses(weights, pairs)  # Validates targets and denominator.
    vocabulary = len(weights)
    logs = log_probabilities(weights)
    inputs = np.bincount(pairs[:, 0], minlength=vocabulary)
    counts = np.bincount(pairs[:, 0] * vocabulary + pairs[:, 1],
                         minlength=vocabulary * vocabulary).reshape(vocabulary, vocabulary)
    gradient = (inputs[:, None] * np.exp(logs) - counts) / len(pairs)
    return float(losses.mean()), gradient


def score(weights, domains, split="tune"):
    return [float(token_losses(weights, domain[split]).mean()) for domain in domains]


def sample_pairs(domains, shares, count, rng, split="train"):
    q = normalize(shares)
    if len(q) != len(domains) or count < 1:
        raise ValueError("One share per domain and positive batch size required")
    selected = rng.choice(len(domains), size=count, p=q)
    result = np.empty((count, 2), dtype=np.int64)
    for i, domain in enumerate(domains):
        positions = np.flatnonzero(selected == i)
        result[positions] = domain[split][rng.integers(len(domain[split]), size=len(positions))]
    return result, np.bincount(selected, minlength=len(domains))


def train_fixed(domains, shares, seed=17, steps=120, batch=768, learning_rate=8.0):
    if steps < 1 or batch < 1 or learning_rate <= 0:
        raise ValueError("Positive training settings required")
    weights = np.zeros((VOCABULARY, VOCABULARY), dtype=np.float64)
    rng = np.random.default_rng(seed)
    exposure = np.zeros(len(domains), dtype=np.int64)
    history = []
    for step in range(1, steps + 1):
        pairs, counts = sample_pairs(domains, shares, batch, rng)
        loss, gradient = loss_gradient(weights, pairs)
        weights -= learning_rate * gradient
        exposure += counts
        if step == 1 or step % 30 == 0 or step == steps:
            history.append({"step": step, "sampled_train_nll": loss,
                            "tuning_nll": score(weights, domains)})
    return weights, {"shares": normalize(shares).tolist(), "seed": seed,
                     "steps": steps, "batch": batch, "learning_rate": learning_rate,
                     "targets": int(exposure.sum()), "exposure": exposure.tolist(),
                     "history": history, "tuning_nll": score(weights, domains)}


def optimize_doremi(domains, reference, seed=17, steps=120, per_domain=256,
                    learning_rate=8.0, eta=1.0, smoothing=.001):
    """Stratified proxy batches; clipped gap for q, ordinary NLL for W.

    Frozen reference never receives an update. Main-model training is separate.
    q_t is averaged after its update, as in the displayed algorithm.
    """
    if steps < 1 or per_domain < 1:
        raise ValueError("Positive steps and per-domain batch required")
    proxy = np.zeros_like(reference)
    q = np.ones(len(domains)) / len(domains)
    mean_q = np.zeros_like(q)
    rng = np.random.default_rng(seed)
    history = []
    for step in range(1, steps + 1):
        gradients, signals = [], []
        for domain in domains:
            pairs = domain["train"][rng.integers(len(domain["train"]), size=per_domain)]
            proxy_losses = token_losses(proxy, pairs)
            reference_losses = token_losses(reference, pairs)
            signals.append(float(np.maximum(proxy_losses - reference_losses, 0).mean()))
            gradients.append(loss_gradient(proxy, pairs)[1])
        q = exponentiated_update(q, signals, eta, smoothing)
        proxy -= learning_rate * np.tensordot(q, np.stack(gradients), axes=1)
        mean_q += (q - mean_q) / step
        if step == 1 or step % 30 == 0 or step == steps:
            history.append({"step": step, "excess": signals, "q": q.tolist(),
                            "mean_q": mean_q.tolist(), "tuning_nll": score(proxy, domains)})
    return mean_q, {"seed": seed, "steps": steps, "per_domain": per_domain,
                    "targets": steps * per_domain * len(domains),
                    "eta": eta, "smoothing": smoothing, "history": history,
                    "mean_q": mean_q.tolist(), "last_q": q.tolist()}


def doge_step(weights, domains, q, batches, validation_shares, learning_rate=.1, eta=1.0):
    """One transparent DoGE-style first-order step (eta absorbs its regularizer).

    The chosen tuning objective supplies a gradient; it never uses final test.
    This educational SGD step does not reproduce a paper's optimizer/scale study.
    """
    q = normalize(q)
    v = normalize(validation_shares)
    if len(q) != len(domains) or len(v) != len(domains) or len(batches) != len(domains):
        raise ValueError("Domain vectors must agree")
    gradients = np.stack([loss_gradient(weights, pairs)[1] for pairs in batches])
    target = sum(share * loss_gradient(weights, domain["tune"])[1]
                 for share, domain in zip(v, domains))
    signals = alignment(gradients, target)
    new_q = exponentiated_update(q, signals, eta, smoothing=0)
    direction = np.tensordot(new_q, gradients, axes=1)
    prediction = -learning_rate * float(np.sum(direction * target))
    return weights - learning_rate * direction, new_q, prediction


def torch_bridge():
    """Ordinary CE/autograd and SGD on the exact same targets and initial W."""
    import torch
    import torch.nn.functional as F
    weights = np.array([[.3, -.1, .2], [0., .5, -.2], [.1, .2, -.4]])
    pairs = np.array([[0, 1], [0, 1], [1, 2], [2, 0], [1, 1]])
    loss, gradient = loss_gradient(weights, pairs)
    parameter = torch.tensor(weights, dtype=torch.float64, requires_grad=True)
    target = torch.tensor(pairs, dtype=torch.long)
    optimizer = torch.optim.SGD([parameter], lr=.2)
    native_loss = F.cross_entropy(parameter[target[:, 0]], target[:, 1])
    native_loss.backward()
    gradient_error = float(np.abs(gradient - parameter.grad.numpy()).max())
    optimizer.step()
    update_error = float(np.abs((weights - .2 * gradient) - parameter.detach().numpy()).max())
    if gradient_error > 1e-12 or update_error > 1e-12:
        raise AssertionError("Scratch and Torch objective differ")
    return {"numpy": np.__version__, "torch": torch.__version__, "scratch_loss": loss,
            "torch_loss": float(native_loss.detach()), "max_gradient_error": gradient_error,
            "max_update_error": update_error}


if __name__ == "__main__":
    print(json.dumps(torch_bridge(), indent=2))
