"""Paired alignment: explicit NumPy derivatives and a matched Torch oracle.

Run: python alignment_mechanisms.py
Requires NumPy and PyTorch. Rows are examples; projection weights are [out,in].
"""
import json
import numpy as np
import torch
import torch.nn.functional as F


def logsumexp(x, axis, keepdims=False):
    maximum = np.max(x, axis=axis, keepdims=True)
    result = maximum + np.log(np.exp(x - maximum).sum(axis=axis, keepdims=True))
    return result if keepdims else np.squeeze(result, axis=axis)


def normalize(x):
    norms = np.linalg.norm(x, axis=-1, keepdims=True)
    if np.any(norms <= 1e-12):
        raise ValueError("cosine direction requires norm > 1e-12")
    return x / norms, norms


def paired_loss(scores):
    """Diagonal pairing; each direction contributes half its N-example mean."""
    count = len(scores)
    if scores.shape != (count, count) or count == 0:
        raise ValueError("scores must be a nonempty square matrix")
    row_logz = logsumexp(scores, 1)
    column_logz = logsumexp(scores, 0)
    row_loss = row_logz - np.diag(scores)
    column_loss = column_logz - np.diag(scores)
    row_probability = np.exp(scores - row_logz[:, None])
    column_probability = np.exp(scores - column_logz[None, :])
    gradient = (row_probability + column_probability - 2 * np.eye(count)) / (2 * count)
    return (row_loss.mean() + column_loss.mean()) / 2, gradient


def alignment_forward_backward(images, texts, image_weight, text_weight, log_scale):
    """One linear tower per modality, including normalization's derivative."""
    raw_image = images @ image_weight.T
    raw_text = texts @ text_weight.T
    u, image_norm = normalize(raw_image)
    v, text_norm = normalize(raw_text)
    scale = np.exp(log_scale)
    scores = scale * u @ v.T
    loss, score_gradient = paired_loss(scores)
    du = scale * score_gradient @ v
    dv = scale * score_gradient.T @ u
    # Remove the radial component; rescaling alone does not change direction.
    draw_image = (du - u * np.sum(du * u, axis=1, keepdims=True)) / image_norm
    draw_text = (dv - v * np.sum(dv * v, axis=1, keepdims=True)) / text_norm
    gradients = {
        "image_weight": draw_image.T @ images,
        "text_weight": draw_text.T @ texts,
        "log_scale": np.sum(score_gradient * scores),
    }
    return float(loss), scores, gradients


def set_positive_loss(scores, positive):
    """Negative log of total probability on each row/column's positive set."""
    positive = np.asarray(positive, dtype=bool)
    if not positive.any(1).all() or not positive.any(0).all():
        raise ValueError("every directional example needs at least one positive")
    positive_scores = np.where(positive, scores, -np.inf)
    rows = logsumexp(scores, 1) - logsumexp(positive_scores, 1)
    columns = logsumexp(scores, 0) - logsumexp(positive_scores, 0)
    return float((rows.mean() + columns.mean()) / 2)


def sigmoid_pair_loss(scores, positive):
    """SigLIP's all-pair signed logistic sum / N, not an N-squared mean."""
    signs = np.where(positive, 1.0, -1.0)
    terms = np.logaddexp(0, -signs * scores)
    return float(terms.sum() / len(scores)), terms


def torch_oracle(images, texts, image_weight, text_weight, log_scale):
    x = torch.tensor(images, dtype=torch.float64)
    y = torch.tensor(texts, dtype=torch.float64)
    wi = torch.tensor(image_weight, dtype=torch.float64, requires_grad=True)
    wt = torch.tensor(text_weight, dtype=torch.float64, requires_grad=True)
    a = torch.tensor(log_scale, dtype=torch.float64, requires_grad=True)
    # Inputs here have norms > 1e-12. At zero F.normalize's fallback is not cosine.
    u = F.normalize(F.linear(x, wi), dim=-1, eps=1e-12)
    v = F.normalize(F.linear(y, wt), dim=-1, eps=1e-12)
    scores = a.exp() * u @ v.T
    targets = torch.arange(len(x))
    loss = (F.cross_entropy(scores, targets) + F.cross_entropy(scores.T, targets)) / 2
    loss.backward()
    return float(loss.detach()), {"image_weight": wi.grad.numpy(),
                                 "text_weight": wt.grad.numpy(),
                                 "log_scale": float(a.grad)}


def main():
    images = np.array([[1., 0.], [0., 1.], [-1., 0.]])
    texts = np.array([[1., 0.], [.6, .8], [-1., 0.]])
    wi, wt, a = np.eye(2), np.eye(2), np.log(2.)
    loss, scores, gradients = alignment_forward_backward(images, texts, wi, wt, a)
    library_loss, library_gradients = torch_oracle(images, texts, wi, wt, a)
    for key in gradients:
        np.testing.assert_allclose(gradients[key], library_gradients[key], atol=1e-12)
    rate = .05
    next_loss, _, _ = alignment_forward_backward(
        images, texts, wi - rate * gradients["image_weight"],
        wt - rate * gradients["text_weight"], a - rate * gradients["log_scale"])
    positive = np.eye(3, dtype=bool)
    sigmoid_loss, _ = sigmoid_pair_loss(scores - 1., positive)
    print(json.dumps({"scores": scores.tolist(), "loss": loss,
                      "torch_loss": library_loss, "step_size": rate,
                      "updated_loss": next_loss,
                      "diagonal_set_loss": set_positive_loss(scores, positive),
                      "sigmoid_loss_bias_minus_one": sigmoid_loss}, indent=2))


if __name__ == "__main__":
    main()
