"""Transparent mixture calculations. Run: python mixing_math.py (NumPy).

Probabilities refer to the explicitly named unit. No empirical curve is generated.
"""
import json
import math
import numpy as np


def nonnegative(values, name="values"):
    x = np.asarray(values, dtype=np.float64)
    if x.ndim != 1 or x.size == 0 or not np.isfinite(x).all() or (x < 0).any():
        raise ValueError(f"{name} must be a nonempty finite nonnegative vector")
    return x


def normalize(values):
    x = nonnegative(values)
    scale = x.max()
    if scale == 0:
        raise ValueError("At least one positive mass is required")
    x = x / scale  # Avoid overflow in the sum of large masses.
    return x / x.sum()


def power_shares(masses, alpha=1.0):
    masses = nonnegative(masses, "masses")
    if not math.isfinite(alpha) or alpha < 0:
        raise ValueError("alpha must be finite and nonnegative")
    active = masses > 0
    if not active.any():
        raise ValueError("No available data")
    logs = alpha * np.log(masses[active])
    weights = np.zeros_like(masses)
    weights[active] = np.exp(logs - logs.max())
    return normalize(weights)


def token_shares(record_probabilities, eligible_lengths):
    p = normalize(record_probabilities)
    lengths = nonnegative(eligible_lengths, "eligible_lengths")
    if p.shape != lengths.shape:
        raise ValueError("One mean eligible length per domain is required")
    return normalize(p * lengths)


def record_shares(desired_tokens, eligible_lengths):
    q = normalize(desired_tokens)
    lengths = nonnegative(eligible_lengths, "eligible_lengths")
    if q.shape != lengths.shape or ((lengths == 0) & (q > 0)).any():
        raise ValueError("A positive target share needs positive eligible length")
    return normalize(np.divide(q, lengths, out=np.zeros_like(q), where=lengths > 0))


def quotas(probabilities, budget):
    if isinstance(budget, bool) or not isinstance(budget, (int, np.integer)) or budget < 0:
        raise ValueError("budget must be a nonnegative integer")
    exact = normalize(probabilities) * budget
    count = np.floor(exact).astype(np.int64)
    remaining = budget - int(count.sum())
    # Stable ties go to the earlier domain; this is an allocation, not random sampling.
    order = np.argsort(-(exact - count), kind="stable")
    count[order[:remaining]] += 1
    return count


def exposure(probabilities, budget, available_targets):
    q = normalize(probabilities)
    n = nonnegative(available_targets)
    if q.shape != n.shape or ((q > 0) & (n == 0)).any() or budget < 0:
        raise ValueError("Positive shares require nonempty domains and nonnegative budget")
    return np.divide(budget * q, n, out=np.zeros_like(q), where=n > 0)


def pacing_weights(scores, progress, start_fraction=0.25, ramp_fraction=1.0, reverse=False):
    scores = nonnegative(scores, "difficulty scores")
    if not 0 <= progress <= 1 or not 0 < start_fraction <= 1 or not 0 < ramp_fraction <= 1:
        raise ValueError("Invalid schedule fraction")
    fraction = start_fraction + (1 - start_fraction) * min(progress / ramp_fraction, 1)
    count = max(1, math.ceil(fraction * len(scores)))
    order = np.argsort(-scores if reverse else scores, kind="stable")
    weights = np.zeros_like(scores)
    weights[order[:count]] = 1 / count
    return weights


def quadratic_order(order=(1.0, -1.0), learning_rate=0.5, initial=0.0):
    if not all(math.isfinite(x) for x in (*order, learning_rate, initial)):
        raise ValueError("Finite quadratic parameters required")
    path = [initial]
    for center in order:
        path.append(path[-1] - learning_rate * (path[-1] - center))
    return path


def clipped_excess(proxy_nll, reference_nll):
    proxy = nonnegative(proxy_nll, "proxy token losses")
    reference = nonnegative(reference_nll, "reference token losses")
    if proxy.shape != reference.shape:
        raise ValueError("Compare the same observed token positions")
    return float(np.maximum(proxy - reference, 0).mean())


def exponentiated_update(weights, signals, eta=1.0, smoothing=0.001):
    q = normalize(weights)
    signal = np.asarray(signals, dtype=np.float64)
    if signal.shape != q.shape or not np.isfinite(signal).all():
        raise ValueError("One finite signal per domain required")
    if not math.isfinite(eta) or eta < 0 or not 0 <= smoothing <= 1:
        raise ValueError("eta>=0 and smoothing in[0,1] required")
    active = q > 0
    log_weight = np.full_like(q, -np.inf)
    log_weight[active] = np.log(q[active]) + eta * signal[active]
    if not np.isfinite(log_weight[active]).all():
        raise ValueError("Weight update overflow; rescale eta/signals")
    raw = np.exp(log_weight - log_weight.max())
    return (1 - smoothing) * normalize(raw) + smoothing / len(q)


def alignment(domain_gradients, validation_gradient):
    gradients = np.asarray(domain_gradients, dtype=np.float64)
    target = np.asarray(validation_gradient, dtype=np.float64)
    if gradients.ndim < 2 or gradients.shape[1:] != target.shape:
        raise ValueError("Each domain gradient must match validation gradient shape")
    if not np.isfinite(gradients).all() or not np.isfinite(target).all():
        raise ValueError("Finite gradients required")
    return (gradients.reshape(len(gradients), -1) @ target.reshape(-1))


def examples():
    return {
        "record_half_token_share": token_shares([.5, .5], [2, 8]).tolist(),
        "desired_half_record_share": record_shares([.5, .5], [2, 8]).tolist(),
        "power_half": power_shares([80, 15, 5], .5).tolist(),
        "integer_budget": quotas(power_shares([80, 15, 5], .5), 100).tolist(),
        "A_then_B": quadratic_order(), "B_then_A": quadratic_order((-1, 1)),
        "clip_before_mean": clipped_excess([1.8, .6], [1, 1]),
        "multiplicative_then_smooth": exponentiated_update([.5, .5], [math.log(2), 0], smoothing=.1).tolist(),
        "alignment": alignment([[1, 0], [-1, 1]], [1, 1]).tolist(),
    }


if __name__ == "__main__":
    print(json.dumps(examples(), indent=2))
