"""DAPO mechanisms from tensor operations; no trainer or network access.

Reward statistics and old scores are constants during the current update.
Run the complete finite examples with: python dapo_checks.py --output finite.json
"""

import math
import torch


def advantages(rewards, group_size=4, epsilon=1e-6):
    if rewards.ndim != 1 or group_size < 2 or len(rewards) % group_size:
        raise ValueError("Require complete groups, each with at least two responses.")
    if epsilon <= 0 or not torch.isfinite(rewards).all():
        raise ValueError("Require positive epsilon and finite rewards.")
    values = rewards.detach().reshape(-1, group_size)
    mean = values.mean(-1, keepdim=True)
    centered = values - mean
    sd = (centered.square().sum(-1, keepdim=True) / (group_size - 1)).sqrt()
    return (centered / (sd + epsilon)).flatten(), {
        "mean": mean.flatten(),
        "sample_sd": sd.flatten(),
    }


def length_penalty(length, cap=8, buffer=4):
    if not 0 < buffer <= cap or length < 0:
        raise ValueError("Require nonnegative length and 0 < buffer <= cap.")
    return max(-1.0, min(0.0, (cap - buffer - length) / buffer))


def select_loss_mask(response_mask, terminated, mask_truncated=False):
    if response_mask.ndim != 2 or len(terminated) != len(response_mask):
        raise ValueError("One termination flag is required per response.")
    result = response_mask.bool()
    if mask_truncated:
        result = (
            result & torch.as_tensor(terminated, dtype=torch.bool, device=result.device)[:, None]
        )
    return result


def objective(
    logps,
    old_logps,
    mask,
    advantage,
    low=0.2,
    high=0.28,
    reduction="token",
    dual_clip=None,
    normalizer=None,
):
    """Negative clipped surrogate, with explicit optional negative dual clip.

    An all-masked batch is an error here, not a successful zero update.
    normalizer supplies a shared full-batch denominator for microbatch sums;
    callers must sum those returned losses without taking another mean.
    """
    if logps.ndim != 2 or old_logps.shape != logps.shape or mask.shape != logps.shape:
        raise ValueError("Current, old and selected mask must have the same B×T shape.")
    if advantage.shape != (len(logps),) or not (0 <= low < 1 and high >= 0):
        raise ValueError("Require B advantages and valid clipping ranges.")
    if dual_clip is not None and dual_clip <= 1:
        raise ValueError("Negative dual clip must exceed one.")
    selected = mask.bool()
    counts = selected.sum(-1)
    if int(counts.sum()) == 0:
        raise ValueError("No selected tokens: the objective is undefined.")
    if not torch.isfinite(logps[selected]).all() or not torch.isfinite(old_logps[selected]).all():
        raise ValueError("Selected log probabilities must be finite.")
    if not torch.isfinite(advantage).all():
        raise ValueError("Advantages must be finite.")
    # Unselected cells cannot inject exp overflow/NaN into a masked reduction.
    delta = torch.where(selected, logps - old_logps.detach(), torch.zeros_like(logps))
    ratio = delta.exp()
    a = advantage.detach()[:, None]
    raw = -ratio * a
    bounded = -ratio.clamp(1 - low, 1 + high) * a
    terms = torch.maximum(raw, bounded)
    if dual_clip is not None:
        terms = torch.where(a < 0, torch.minimum(terms, -dual_clip * a), terms)
    terms = torch.where(selected, terms, torch.zeros_like(terms))
    if reduction == "token":
        denominator = float(counts.sum()) if normalizer is None else float(normalizer)
        if not math.isfinite(denominator) or denominator <= 0:
            raise ValueError("A finite positive shared denominator is required.")
        loss = terms.sum() / denominator
    elif reduction == "response":
        if normalizer is not None or (counts == 0).any():
            raise ValueError("Response averaging requires nonempty rows and its own denominator.")
        denominator = None
        loss = (terms.sum(-1) / counts).mean()
    else:
        raise ValueError("Use token or response averaging.")
    if not torch.isfinite(loss):
        raise FloatingPointError("Nonfinite loss; no optimizer step is permitted.")
    return loss, {
        "ratio": ratio,
        "terms": terms,
        "selected_counts": counts,
        "clip_fraction": ((bounded > raw) & selected).sum() / counts.sum(),
        "denominator": denominator,
    }


def scalar_loss_and_slope(ratio, advantage, low=0.2, high=0.28, dual_clip=None):
    """Loss and derivative with respect to log probability, away from knees."""
    if ratio <= 0:
        raise ValueError("A likelihood ratio is positive.")
    raw = -ratio * advantage
    bounded = -min(1 + high, max(1 - low, ratio)) * advantage
    loss = max(raw, bounded)
    slope = -ratio * advantage if raw > bounded or 1 - low < ratio < 1 + high else 0.0
    if dual_clip is not None and advantage < 0 and loss > -dual_clip * advantage:
        loss, slope = -dual_clip * advantage, 0.0
    return loss, slope


def mixed_probability(p, group_size):
    if not 0 <= p <= 1 or group_size < 2:
        raise ValueError("Require a probability and G>=2.")
    return 1 - p**group_size - (1 - p) ** group_size


def integer_answer(text):
    """Last literal boxed integer in full text; narrow, not the official port.

    Whitespace around an optional sign and decimal digits is trimmed. Fractions,
    expressions and a malformed last box are rejected. The last literal marker
    may itself be nested; this is not balanced-LaTeX parsing. No eval.
    """
    import re

    start = text.rfind("\\boxed{")
    if start < 0:
        return None
    tail = text[start + 7 :]
    end = tail.find("}")
    if end < 0:
        return None
    raw = tail[:end].strip()
    return int(raw) if re.fullmatch(r"[+-]?[0-9]+", raw) else None
