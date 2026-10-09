"""Changed scalar/tensor practice, with no model loading or scientific replay.

Run: python practice_answers.py --output practice-answers.json
The capstone diagnostic accepts records; this script does not execute its fit.
"""
import argparse
import itertools
import json
import math
from pathlib import Path

import numpy as np
import torch

from group_losses import reduce_token_loss
from kto_loss import cyclic_completions, kto_loss, practical_reference


def masked_loo(rewards):
    """One sum and count give all excluded means in O(G) time."""
    values = np.asarray(rewards, dtype=float)
    valid = np.isfinite(values)
    if np.isinf(values).any():
        raise ValueError('Infinite feedback is an error, not a missing observation.')
    count = int(valid.sum())
    advantages = np.zeros_like(values)
    if count > 1:
        total = values[valid].sum()
        advantages[valid] = values[valid] - (total - values[valid]) / (count - 1)
    return advantages, valid, count


def exact_binary_estimators():
    """Enumerate each ordered pair independently of the lesson estimator helper."""
    probabilities = np.array([0.7, 0.3])
    rewards = np.array([-2.0, 1.0])
    scores = np.eye(2) - probabilities
    target = probabilities * (rewards - probabilities @ rewards)
    results = {}
    for method in ('plain', 'loo', 'constant_10'):
        rows = []
        for group in itertools.product(range(2), repeat=2):
            indices = np.array(group)
            group_rewards = rewards[indices]
            if method == 'plain':
                advantage = group_rewards
            elif method == 'loo':
                advantage = group_rewards - group_rewards[::-1]
            else:
                advantage = group_rewards - 10
            gradient = (advantage[:, None] * scores[indices]).mean(axis=0)
            mass = float(probabilities[indices].prod())
            rows.append((mass, gradient))
        mean = sum(mass * gradient for mass, gradient in rows)
        mse = sum(mass * np.square(gradient - target).sum() for mass, gradient in rows)
        np.testing.assert_allclose(mean, target, atol=1e-14)
        results[method] = {
            'ordered_first_coordinates': [float(gradient[0]) for _, gradient in rows],
            'mean': mean.tolist(),
            'mse': float(mse),
        }
    return results


def capstone_diagnostics(records, group_size=4):
    """Inspect an already recorded alternative-reward run; never generate here.

    Each record has group_id, valid and correct. A correct label must be valid.
    The caller must retain its frozen protocol and model/evaluation identities.
    """
    groups = {}
    for row in records:
        if row['correct'] and not row['valid']:
            raise ValueError('A correct task label cannot be invalid.')
        reward = 0.25 * bool(row['valid']) + 0.75 * bool(row['correct'])
        groups.setdefault(row['group_id'], []).append(reward)
    if not records or any(len(group) != group_size for group in groups.values()):
        raise ValueError('Require nonempty, complete recorded groups.')
    return {
        'valid_rate': sum(bool(row['valid']) for row in records) / len(records),
        'correct_rate': sum(bool(row['correct']) for row in records) / len(records),
        'mean_reward': sum(sum(group) for group in groups.values()) / len(records),
        'mixed_group_fraction': sum(min(g) != max(g) for g in groups.values()) / len(groups),
        'groups': groups,
    }


def solve():
    dtype = torch.float64
    report = {}
    report['1'] = {'selected_logit_rows': [1, 2, 3, 4], 'prompt_upstream_gradient_possible': True}
    p = np.array([0.5, 0.25, 0.25])
    rewards = np.array([-1.0, 2.0, 0.0])
    scores = np.eye(3) - p
    np.testing.assert_allclose(p @ scores, 0)
    target = p * (rewards - p @ rewards)
    np.testing.assert_allclose(target, [-0.5, 0.5, 0])
    report['2'] = {'expectation': float(p @ rewards), 'scores': scores.tolist(), 'gradient': target.tolist()}
    values = np.array([2.0, -1.0, 5.0])
    excluded = (values.sum() - values) / 2
    np.testing.assert_allclose(values - excluded, [0, -4.5, 4.5])
    report['3'] = {'excluded_means': excluded.tolist(), 'loo': (values - excluded).tolist(), 'self_factor': 2 / 3}
    report['4'] = {'copied_group_loo': [0.0, 0.0, 0.0], 'nonzero_target': target.tolist()}
    advantages, mask, count = masked_loo([3, np.nan, -1, 7])
    np.testing.assert_allclose(advantages, [0, 0, -6, 6])
    assert count == 3 and masked_loo([3, np.nan])[0].sum() == 0
    report['5'] = {'advantages': advantages.tolist(), 'observed': mask.tolist(), 'count': count}
    report['6'] = exact_binary_estimators()
    for method, expected in [('plain', 0.0021), ('loo', 1.0962), ('constant_10', 20.5821)]:
        assert math.isclose(report['6'][method]['mse'], expected, abs_tol=1e-12)
    epsilon = 1e-4
    centered = values - values.mean()
    spread = values.std(ddof=1)
    transformed = 3 * values + 8
    standardized = (transformed - transformed.mean()) / (transformed.std(ddof=1) + epsilon)
    np.testing.assert_allclose(standardized, centered / (spread + epsilon / 3))
    report['7'] = {'transformed_standardized': standardized.tolist(), 'original_standardized': (centered / (spread + epsilon)).tolist()}
    ratios = np.array([1.4, 0.7, 1.1])
    clipped = ratios.clip(0.8, 1.2)
    report['8'] = {'sequence': float(ratios.prod()), 'geometric': float(ratios.prod() ** (1 / 3)), 'positive': np.minimum(ratios, clipped).tolist(), 'negative': np.minimum(-ratios, -clipped).tolist()}
    report['9'] = {}
    base = torch.tensor([[4, 0, 0], [1, 1, 1]], dtype=dtype)
    mask = torch.tensor([[1, 0, 0], [1, 1, 1]], dtype=dtype)
    for reduction, expected in [('response', 2.5), ('token', 1.75), ('fixed', 7 / 6)]:
        variable = base.clone().requires_grad_()
        loss = reduce_token_loss(variable, mask, reduction, fixed_cap=3)
        gradient, = torch.autograd.grad(loss, variable)
        padded = torch.cat([base, torch.full((2, 2), 99.0, dtype=dtype)], dim=1).requires_grad_()
        padded_mask = torch.cat([mask, torch.zeros((2, 2), dtype=dtype)], dim=1)
        padded_loss = reduce_token_loss(padded, padded_mask, reduction, fixed_cap=3)
        padded_gradient, = torch.autograd.grad(padded_loss, padded)
        torch.testing.assert_close(padded_loss, loss)
        torch.testing.assert_close(padded_gradient[:, :3], gradient)
        assert torch.count_nonzero(padded_gradient[:, 3:]) == 0
        assert math.isclose(float(loss.detach()), expected, abs_tol=1e-12)
        report['9'][reduction] = {'loss': float(loss.detach()), 'gradient': gradient.tolist()}
    p = np.array([0.25, 0.75])
    q = np.array([0.5, 0.5])
    signed = np.log(p / q)
    k3 = q / p - np.log(q / p) - 1
    assert signed[0] < 0 < p @ signed
    assert math.isclose(float(p @ k3), float(p @ signed), abs_tol=1e-14)
    report['10'] = {'sample_log_ratios': signed.tolist(), 'exact_kl': float(p @ signed), 'old_uniform_k3_mean': float(k3.mean())}
    current = torch.tensor(0.0, dtype=dtype, requires_grad=True)
    reference = torch.tensor(math.log(2), dtype=dtype, requires_grad=True)
    difference = reference.detach() - current
    penalty = difference.exp() - difference - 1
    derivative, reference_derivative = torch.autograd.grad(penalty, (current, reference), allow_unused=True)
    assert derivative.item() == -1 and reference_derivative is None
    report['11'] = {'current_derivative': derivative.item(), 'reference_derivative': None}
    report['12'] = {'relative_winner_need_not_be_desirable': True, 'example_criterion': 'All requested fields exact, no extra fields.'}
    report['13'] = {}
    for desirable in (True, False):
        score = torch.tensor([0.7], dtype=dtype, requires_grad=True)
        loss, _ = kto_loss(score, torch.zeros_like(score), torch.tensor([desirable]), torch.tensor(0.1, dtype=dtype), beta=0.4, desirable_weight=2, undesirable_weight=1)
        gradient, = torch.autograd.grad(loss, score)
        report['13'][str(desirable)] = {'loss': loss.item(), 'derivative': gradient.item()}
    rotation = cyclic_completions([1, 2, 3, 4])
    assert rotation == [4, 1, 2, 3]
    point = practical_reference(torch.tensor([-0.8, 0.2, 0.1, -0.3]), torch.zeros(4))
    assert point.item() == 0 and not point.requires_grad
    report['14'] = {'paired_completion_indices': rotation, 'clamped_reference': point.item()}
    report['15'] = {'desirable_weight_interval': [5, 7.5], 'total_example_denominator': 6}
    report['16'] = {'inspect': ['loss_type', 'beta', 'importance_sampling_level', 'scale_rewards', 'use_bias_correction_kl', 'disable_dropout', 'sampling and reference lifetime']}
    logits = torch.tensor(np.log([0.6, 0.4]), dtype=dtype, requires_grad=True)
    reward = torch.tensor(np.log([0.7, 0.2]), dtype=dtype)
    expected_reward = logits.softmax(0) @ reward
    gradient, = torch.autograd.grad(expected_reward, logits)
    torch.testing.assert_close(gradient, torch.tensor([0.24 * math.log(3.5), -0.24 * math.log(3.5)], dtype=dtype))
    report['17'] = {'policy_logit_gradient': gradient.tolist()}
    fixture = [{'group_id': 0, 'valid': True, 'correct': correct} for correct in [True, False, False, True]]
    report['18'] = {'constructed_diagnostic_only': capstone_diagnostics(fixture), 'new_fit_executed': False}
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    answers = solve()
    args.output.write_text(json.dumps(answers, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'solved_tasks': len(answers), 'output': str(args.output), 'model_loads': 0}))
