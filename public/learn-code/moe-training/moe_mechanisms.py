"""Sparse expert arithmetic and manual gradients. Python 3.12, NumPy 2.3+.

Run: python moe_mechanisms.py
Maps are output-by-input; input rows therefore multiply their transpose.
Capacity keeps the requested gate denominator, without survivor renormalization.
"""
import json
import math

import numpy as np


def sigmoid(x):
    return np.exp(-np.logaddexp(0.0, -x))


def softmax(x):
    mass = np.exp(x - x.max(axis=-1, keepdims=True))
    return mass / mass.sum(axis=-1, keepdims=True)


def logsumexp(x):
    largest = x.max(axis=-1)
    return largest + np.log(np.exp(x - largest[..., None]).sum(axis=-1))


def topk(scores, k):
    """Distinct IDs; lower ID wins a tie, including at the kth boundary."""
    experts = scores.shape[1]
    if not 1 <= k <= experts:
        raise ValueError("k must be between one and the number of experts")
    threshold = np.partition(scores, experts - k, axis=1)[:, experts - k]
    above = scores > threshold[:, None]
    ties = scores == threshold[:, None]
    needed = k - above.sum(axis=1)
    chosen = above | (ties & (ties.cumsum(axis=1) <= needed[:, None]))
    ids = np.nonzero(chosen)[1].reshape(len(scores), k)
    values = np.take_along_axis(scores, ids, axis=1)
    order = np.argsort(-values, axis=1, kind="stable")
    return np.take_along_axis(ids, order, axis=1)


def routes(logits, k, kind="softmax", bias=None):
    """Return probabilities/affinities, selected IDs and applied gate weights."""
    if kind not in {"softmax", "full", "sigmoid"}:
        raise ValueError("kind must be softmax, full, or sigmoid")
    scores = sigmoid(logits) if kind == "sigmoid" else softmax(logits)
    corrected = scores if bias is None else scores + bias
    ids = topk(corrected, k)
    selected = np.take_along_axis(scores, ids, axis=1)
    gates = selected if kind == "full" else selected / selected.sum(axis=1, keepdims=True)
    return scores, ids, gates


def assignment_groups(ids, capacity=None, valid=None):
    """Group requests once, preserving token/slot priority inside each expert."""
    tokens, k = ids.shape
    valid = np.ones(tokens, dtype=bool) if valid is None else np.asarray(valid, dtype=bool)
    token = np.repeat(np.arange(tokens), k)
    slot = np.tile(np.arange(k), tokens)
    expert = ids.reshape(-1)
    order = np.argsort(expert, kind="stable")
    order = order[valid[token[order]]]
    boundaries = np.r_[0, np.flatnonzero(np.diff(expert[order])) + 1, len(order)]
    groups = []
    accepted = np.zeros_like(ids, dtype=bool)
    for start, end in zip(boundaries[:-1], boundaries[1:]):
        group = order[start:end]
        if capacity is not None:
            group = group[:capacity]
        if len(group):
            t, s = token[group], slot[group]
            accepted[t, s] = True
            groups.append((int(expert[group[0]]), t, s))
    return groups, accepted


def initial_parameters(rng, experts=4, width=8, hidden=6):
    return {
        "router": rng.normal(0, 0.25 / np.sqrt(width), (experts, width)),
        "gate": rng.normal(0, 1 / np.sqrt(width), (experts, hidden, width)),
        "up": rng.normal(0, 1 / np.sqrt(width), (experts, hidden, width)),
        "down": rng.normal(0, 1 / np.sqrt(hidden), (experts, width, hidden)),
    }


def forward(x, parameters, k=2, kind="softmax", bias=None, capacity=None, valid=None):
    logits = x @ parameters["router"].T
    scores, ids, gates = routes(logits, k, kind, bias)
    groups, accepted = assignment_groups(ids, capacity, valid)
    y = np.zeros_like(x)
    caches = []
    for expert, token, slot in groups:
        rows = x[token]
        a = rows @ parameters["gate"][expert].T
        b = rows @ parameters["up"][expert].T
        activation = a * sigmoid(a)
        hidden = activation * b
        returned = hidden @ parameters["down"][expert].T
        np.add.at(y, token, gates[token, slot, None] * returned)
        caches.append((expert, token, slot, a, b, activation, hidden, returned))
    context = {
        "x": x, "logits": logits, "scores": scores, "ids": ids, "gates": gates,
        "accepted": accepted, "caches": caches, "kind": kind, "valid": valid,
    }
    return y, context


def gate_backward(context, slot_derivative):
    """Differentiate weights while holding requested IDs and capacity masks fixed."""
    scores, ids, gates = (context[name] for name in ["scores", "ids", "gates"])
    if context["kind"] == "full":
        derivative = np.zeros_like(scores)
        np.put_along_axis(derivative, ids, slot_derivative, axis=1)
        return scores * (derivative - (scores * derivative).sum(axis=1, keepdims=True))
    centered = slot_derivative - (gates * slot_derivative).sum(axis=1, keepdims=True)
    selected = gates * centered
    if context["kind"] == "sigmoid":
        selected *= 1 - np.take_along_axis(scores, ids, axis=1)
    gradient = np.zeros_like(scores)
    np.put_along_axis(gradient, ids, selected, axis=1)
    return gradient


def balance(logits, ids, kind="softmax", valid=None):
    """Normalized count/(Tk) surrogate and its exact local logit derivative."""
    valid = np.ones(len(logits), dtype=bool) if valid is None else np.asarray(valid, dtype=bool)
    count = int(valid.sum())
    experts = logits.shape[1]
    if count == 0:
        return 0.0, np.zeros_like(logits), {"mean": None, "valid_rows": 0}
    scores = sigmoid(logits) if kind == "sigmoid" else softmax(logits)
    probabilities = scores / scores.sum(axis=1, keepdims=True)
    f = np.bincount(ids[valid].reshape(-1), minlength=experts) / (count * ids.shape[1])
    means = probabilities[valid].mean(axis=0)
    value = experts * np.dot(f, means)
    derivative = experts / count * probabilities * (f - probabilities @ f[:, None])
    if kind == "sigmoid":
        derivative *= 1 - scores
    derivative[~valid] = 0
    return float(value), derivative, {
        "f": f, "P": means, "mean": float(value), "valid_rows": count,
        "cv_squared": float(experts * np.dot(f, f) - 1),
        "max_over_mean": float(experts * f.max()),
    }


def z_loss(logits, valid=None):
    valid = np.ones(len(logits), dtype=bool) if valid is None else np.asarray(valid, dtype=bool)
    count = int(valid.sum())
    if count == 0:
        return 0.0, np.zeros_like(logits)
    normalizer = logsumexp(logits)
    gradient = 2 / count * normalizer[:, None] * softmax(logits)
    gradient[~valid] = 0
    return float(np.mean(normalizer[valid] ** 2)), gradient


def backward(upstream, parameters, context, alpha=0.0, beta=0.0):
    x, ids, gates = (context[name] for name in ["x", "ids", "gates"])
    gradients = {name: np.zeros_like(value) for name, value in parameters.items()}
    dx = np.zeros_like(x)
    dgate = np.zeros_like(gates)
    for expert, token, slot, a, b, activation, hidden, returned in context["caches"]:
        dreturned = upstream[token] * gates[token, slot, None]
        gradients["down"][expert] += dreturned.T @ hidden
        dhidden = dreturned @ parameters["down"][expert]
        sig = sigmoid(a)
        da = dhidden * b * sig * (1 + a * (1 - sig))
        db = dhidden * activation
        gradients["gate"][expert] += da.T @ x[token]
        gradients["up"][expert] += db.T @ x[token]
        np.add.at(dx, token, da @ parameters["gate"][expert] + db @ parameters["up"][expert])
        dgate[token, slot] = np.sum(upstream[token] * returned, axis=1)
    task_logits = gate_backward(context, dgate)
    aux, balance_logits, stats = balance(context["logits"], ids, context["kind"], context["valid"])
    z, z_logits = z_loss(context["logits"], context["valid"])
    dlogits = task_logits + alpha * balance_logits + beta * z_logits
    gradients["router"] = dlogits.T @ x
    dx += dlogits @ parameters["router"]
    return dx, gradients, {
        "balance": aux, "z": z, "stats": stats,
        "task_logits": task_logits, "balance_logits": balance_logits, "z_logits": z_logits,
    }


def update_bias(bias, counts, speed):
    return bias + speed * np.sign(np.mean(counts) - counts)


def binomial_capacity(tokens=512, experts=8, k=2, capacity=128):
    """Independent uniform k-subsets across tokens; exact finite-binomial sum."""
    p = k / experts
    if p == 1:
        pmf = np.zeros(tokens + 1)
        pmf[tokens] = 1
    else:
        j = np.arange(tokens + 1)
        log_mass = np.array([
            math.lgamma(tokens + 1) - math.lgamma(i + 1) - math.lgamma(tokens - i + 1)
            for i in j
        ]) + j * math.log(p) + (tokens - j) * math.log1p(-p)
        pmf = np.exp(log_mass)
        pmf /= pmf.sum()
    overflow = float(pmf[capacity + 1:].sum())
    rejected = np.maximum(np.arange(tokens + 1) - capacity, 0) @ pmf
    return {
        "mean": tokens * p,
        "variance": tokens * p * (1 - p),
        "overflow_probability": overflow,
        "expected_rejected_fraction": float(experts * rejected / (tokens * k)),
    }


def main():
    logits = np.log(np.array([[4.0, 2.0, 1.0]]))
    returned = np.array([[2.0, 0.0], [0.0, 3.0], [-1.0, 1.0]])
    scores, ids, gates = routes(logits, 2)
    context = {"scores": scores, "ids": ids, "gates": gates, "kind": "softmax"}
    no_drop = gate_backward(context, np.array([[2.0, 3.0]]))
    partial = gate_backward(context, np.array([[0.0, 3.0]]))
    rows = np.log(np.array([[.51, .49]] * 3 + [[.001, .999]]))
    counterexample = balance(rows, topk(rows, 1))[0]
    rng = np.random.default_rng(17)
    parameters = initial_parameters(rng)
    x = rng.normal(size=(5, 8))
    y, cache = forward(x, parameters)
    dx, gradients, terms = backward(y / len(x), parameters, cache, alpha=.05, beta=.001)
    updated = {key: value - .01 * gradients[key] for key, value in parameters.items()}
    report = {
        "gates": gates.tolist(),
        "output": (gates @ returned[ids[0]]).tolist(),
        "no_drop_logit_gradient": no_drop.tolist(),
        "partial_drop_logit_gradient": partial.tolist(),
        "counterexample_balance": counterexample,
        "capacity": binomial_capacity(),
        "diagnostic_task_loss": float(np.sum(y * y) / (2 * len(x))),
        "router_gradient_norm": float(np.linalg.norm(gradients["router"])),
        "input_gradient_norm": float(np.linalg.norm(dx)),
        "router_update_norm": float(np.linalg.norm(updated["router"] - parameters["router"])),
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
