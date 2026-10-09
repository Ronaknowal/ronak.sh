"""Explicit positional-policy search; no pretrained model or quality claim.

Requires numpy, torch, transformers==5.17.0 because the reused frequency file
imports those tools. Keep the ../positional-encodings-... sibling directory, or
pass that exact prerequisite file to load_frequency_operators(path).
An objective callback evaluates REAL model/data tokens in a research run.
The executable demonstration checks search/rotation contracts on a synthetic
objective only; its numbers are NOT perplexity or a context-quality result.
"""
from __future__ import annotations
import importlib.util
import json
import math
from pathlib import Path
from typing import Callable
import numpy as np


def load_frequency_operators(path: str | Path | None = None):
    path = Path(path) if path else Path(__file__).resolve().parent.parent / (
        'positional-encodings-sinusoidal-learned-rope-alibi/rotary-frequency-rules.py')
    spec = importlib.util.spec_from_file_location('reused_rotary_frequency_rules', path)
    if spec is None or spec.loader is None:
        raise ValueError('the exact prerequisite frequency file is required')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def policy_angles(position, theta, factors, unscaled_prefix=0):
    position, theta, factors = (np.asarray(x, dtype=np.float64) for x in (position, theta, factors))
    if theta.ndim != 1 or factors.shape != theta.shape or not all(np.isfinite(x).all() for x in (position, theta, factors)):
        raise ValueError('finite positions/frequencies and one factor per pair required')
    if (position < 0).any() or (factors <= 0).any() or not isinstance(unscaled_prefix, int) or unscaled_prefix < 0:
        raise ValueError('nonnegative positions/prefix and positive factors required')
    # A real per-position branch: initial positions are unscaled. This is not a
    # single frequency replacement valid for every position.
    scale = np.where(position[..., None] < unscaled_prefix, 1.0, factors)
    return position[..., None] * theta / scale


def rotate_policy(values, position, theta, factors, unscaled_prefix=0):
    values = np.asarray(values, dtype=np.float64)
    angle = policy_angles(position, theta, factors, unscaled_prefix)
    if values.shape[-1] != 2 * len(theta) or not np.isfinite(values).all():
        raise ValueError('finite adjacent coordinate pairs required')
    even, odd = values[..., 0::2], values[..., 1::2]
    return np.stack((even * np.cos(angle) - odd * np.sin(angle),
                     even * np.sin(angle) + odd * np.cos(angle)), -1).reshape(values.shape)


def token_nll(logits, targets, eligible):
    """Average true-token loss ONLY at eligible positions; ignore positions, not classes."""
    logits = np.asarray(logits, dtype=np.float64)
    targets, eligible = np.asarray(targets), np.asarray(eligible)
    if logits.ndim < 2 or targets.shape != logits.shape[:-1] or eligible.shape != targets.shape:
        raise ValueError('logits [...,V], targets [...], eligible [...] required')
    if not np.isfinite(logits).all() or targets.dtype.kind not in 'iu' or eligible.dtype != bool:
        raise ValueError('finite logits, integer targets and Boolean eligibility required')
    if not eligible.any() or ((targets[eligible] < 0) | (targets[eligible] >= logits.shape[-1])).any():
        raise ValueError('nonempty eligible targets inside vocabulary required')
    selected = logits[eligible]
    peak = selected.max(-1)
    log_partition = peak + np.log(np.exp(selected - peak[:, None]).sum(-1))
    return float(np.mean(log_partition - selected[np.arange(len(selected)), targets[eligible]]))


def evolutionary_search(objective: Callable[[np.ndarray, int], float], pairs=2,
                        population=8, generations=6, seed=17, maximum_factor=8.,
                        prefixes=(0, 4), monotone=False):
    """Minimize a supplied evaluation loss; preserve the best, mutate and cross.

    All candidates use the same caller-owned evaluation protocol. Use a separate
    held-out protocol after selection. A seed makes proposal sampling repeatable,
    not the external GPU/model evaluation automatically deterministic.
    """
    if pairs < 1 or population < 4 or generations < 1 or not math.isfinite(maximum_factor) or maximum_factor < 1:
        raise ValueError('positive sizes, population>=4 and maximum factor>=1 required')
    if not prefixes or any(not isinstance(p, int) or p < 0 for p in prefixes):
        raise ValueError('nonnegative integer prefix candidates required')
    rng = np.random.default_rng(seed)
    bounds = math.log(maximum_factor)
    def candidate(log_factor, prefix):
        x = np.clip(log_factor, 0, bounds)
        if monotone:
            x = np.sort(x)
        return x, int(prefix)
    candidates = [candidate(np.zeros(pairs), prefixes[0])]
    candidates += [candidate(rng.uniform(0, bounds, pairs), rng.choice(prefixes)) for _ in range(population - 1)]
    history = []
    for generation in range(generations):
        ranked = []
        for x, prefix in candidates:
            loss = float(objective(np.exp(x).copy(), prefix))
            if not math.isfinite(loss):
                raise ValueError('objective must return finite measured loss')
            ranked.append((loss, x, prefix))
        ranked.sort(key=lambda item: item[0])
        history.append({'generation': generation, 'best_loss': ranked[0][0],
                        'factors': np.exp(ranked[0][1]).tolist(), 'prefix': ranked[0][2]})
        elite = ranked[:max(2, population // 3)]
        candidates = [(x.copy(), prefix) for _, x, prefix in elite]
        while len(candidates) < population:
            first, second = elite[rng.integers(len(elite))], elite[rng.integers(len(elite))]
            crossed = np.where(rng.random(pairs) < .5, first[1], second[1])
            mutated = crossed + rng.normal(0, .15, pairs)
            prefix = first[2] if rng.random() < .75 else rng.choice(prefixes)
            candidates.append(candidate(mutated, prefix))
    return history[-1], history


def main():
    operators = load_frequency_operators()
    theta = operators.original_frequencies(4, 10000.)
    factors = np.array([2., 4.])
    values = np.array([[1., 0., 0., 1.], [1., 0., 0., 1.]])
    positions = np.array([2., 4.])
    angles = policy_angles(positions, theta, factors, 3)
    np.testing.assert_allclose(angles, [[2., .02], [2., .01]])
    observed = rotate_policy(values, positions, theta, factors, 0)
    expected = operators.rotate_adjacent(values, positions, operators.longrope_frequencies(4, 10000., factors))
    np.testing.assert_allclose(observed, expected, atol=1e-14)
    prefixed = rotate_policy(values, positions, theta, factors, 3)
    np.testing.assert_allclose(np.sum(prefixed ** 2, -1), np.sum(values ** 2, -1), atol=1e-14)
    # This deliberately labelled synthetic loss tests selection and replay. It
    # neither calls a language model nor estimates its perplexity.
    synthetic = lambda factor, prefix: float(np.sum((np.log(factor) - np.log([2., 4.])) ** 2) + .01 * abs(prefix - 4))
    winner, history = evolutionary_search(synthetic)
    repeat, repeated_history = evolutionary_search(synthetic)
    assert history == repeated_history and winner == repeat
    assert all(history[i]['best_loss'] <= history[i-1]['best_loss'] for i in range(1, len(history)))
    logits = np.array([[0., 0.], [0., math.log(3.)]])
    np.testing.assert_allclose(token_nll(logits, np.array([0, 1]), np.array([False, True])), -math.log(.75))
    report = {'contract': 'synthetic algorithm checks, not language-model quality',
              'prefix_angles': angles.tolist(), 'rotation_max_error': float(np.max(np.abs(observed-expected))),
              'best_synthetic_loss': winner['best_loss'], 'generations': len(history),
              'measured_model_loss': None}
    print(json.dumps(report, indent=2))
    return report


if __name__ == '__main__':
    main()
