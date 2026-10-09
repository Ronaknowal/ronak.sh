"""Enumerate a two-step binary language model and its prefix derivatives.

Run: python distillation_sequences.py --output sequence-results.json
Requires NumPy and PyTorch. This exact finite calculation fits no model.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import torch


def softmax(logits):
    logits = np.asarray(logits, dtype=np.float64)
    shifted = logits - logits.max(axis=-1, keepdims=True)
    weights = np.exp(shifted)
    return weights / weights.sum(axis=-1, keepdims=True)


def joint(rows):
    """Row 0 is first-token mass; rows 1/2 condition on first token A/B."""
    rows = np.asarray(rows)
    if rows.shape != (3, 2) or np.any(rows <= 0):
        raise ValueError('Require three strictly positive binary distributions')
    np.testing.assert_allclose(rows.sum(-1), 1.)
    return (rows[0, :, None] * rows[1:]).reshape(-1)


def local_reverse_gradient(p, q):
    divergence = np.sum(p * np.log(p / q))
    return p * (np.log(p / q) - divergence)


def sequence_report(teacher_logits, student_logits):
    q, p = softmax(teacher_logits), softmax(student_logits)
    q_joint, p_joint = joint(q), joint(p)
    local_kl = np.sum(p * np.log(p / q), axis=-1)
    future = float(p[0] @ local_kl[1:])
    detached = np.stack([local_reverse_gradient(p[0], q[0]),
                         p[0, 0] * local_reverse_gradient(p[1], q[1]),
                         p[0, 1] * local_reverse_gradient(p[2], q[2])])
    visitation = np.zeros_like(detached)
    visitation[0] = p[0] * (local_kl[1:] - future)
    # A detached prefix has its same numerical probability, but no derivative
    # through that weight. Local divergences still differentiate student logits.
    return {
        'leaf_order': ['AA', 'AB', 'BA', 'BB'],
        'teacher_rows': q.tolist(), 'student_rows': p.tolist(),
        'teacher_joint': q_joint.tolist(), 'student_joint': p_joint.tolist(),
        'sequence_ce': float(-q_joint @ np.log(p_joint)),
        'sequence_entropy': float(-q_joint @ np.log(q_joint)),
        'forward_kl': float(q_joint @ np.log(q_joint / p_joint)),
        'reverse_kl': float(p_joint @ np.log(p_joint / q_joint)),
        'local_reverse_kls': local_kl.tolist(), 'weighted_future': future,
        'detached_gradient': detached.tolist(),
        'visitation_gradient': visitation.tolist(),
        'full_gradient': (detached + visitation).tolist(),
    }


def categorical_index(probabilities, uniform):
    """Sample only positive support; zero-mass entries cannot win at u=0."""
    probabilities = np.asarray(probabilities, dtype=np.float64)
    if not 0 <= uniform < 1 or np.any(probabilities < 0):
        raise ValueError('Require nonnegative masses and uniform in [0,1)')
    support = np.flatnonzero(probabilities > 0)
    if not len(support):
        raise ValueError('Empty positive support')
    mass = probabilities[support]
    cdf = np.cumsum(mass / mass.sum())
    cdf[-1] = 1.
    return int(support[np.searchsorted(cdf, uniform, side='right')])


def torch_objective(q, logits, detach=False):
    p = logits.softmax(-1)
    local = (p * (p.log() - q.log())).sum(-1)
    prefix = p[0].detach() if detach else p[0]
    return local[0] + (prefix * local[1:]).sum()


def verify():
    teacher_logits = np.array([[.8, -.2], [.7, -.1], [-.2, .3]])
    base = np.array([[.2, -.3], [.1, -.5], [-.4, .7]])
    cases = []
    for shift in [0., -.4, .5]:
        logits = base.copy()
        logits[0, 0] += shift
        report = sequence_report(teacher_logits, logits)
        q = torch.tensor(report['teacher_rows'], dtype=torch.float64)
        for detached, key in [(False, 'full_gradient'), (True, 'detached_gradient')]:
            z = torch.tensor(logits, dtype=torch.float64, requires_grad=True)
            value = torch_objective(q, z, detached)
            value.backward()
            np.testing.assert_allclose(z.grad.numpy(), report[key], atol=1e-13)
            np.testing.assert_allclose(value.item(), report['reverse_kl'], atol=1e-13)
        numeric = np.zeros_like(logits)
        for index in np.ndindex(logits.shape):
            plus, minus = logits.copy(), logits.copy()
            plus[index] += 1e-5
            minus[index] -= 1e-5
            numeric[index] = (sequence_report(teacher_logits, plus)['reverse_kl'] -
                              sequence_report(teacher_logits, minus)['reverse_kl']) / 2e-5
        np.testing.assert_allclose(numeric, report['full_gradient'], atol=1e-9)
        np.testing.assert_allclose(report['sequence_ce'] - report['sequence_entropy'],
                                   report['forward_kl'], atol=1e-14)
        np.testing.assert_allclose(report['local_reverse_kls'][0] + report['weighted_future'],
                                   report['reverse_kl'], atol=1e-14)
        cases.append(report)
    # Match both conditional rows to their teachers: equal continuation costs 0.
    equal = sequence_report(teacher_logits, np.vstack([base[0], teacher_logits[1:]]))
    np.testing.assert_allclose(equal['visitation_gradient'], 0., atol=1e-14)
    q_leaf = np.array(cases[0]['teacher_joint'])
    p_leaf = np.array(cases[0]['student_joint'])
    rng = np.random.default_rng(731)
    indices = [categorical_index(q_leaf, u) for u in rng.random(10000)]
    sample_mean = float(-np.log(p_leaf[indices]).mean())
    assert categorical_index([0., .2, 0., .8], 0.) == 1
    assert categorical_index([0., .2, 0., .8], .2) == 3
    return {'scope': 'Exact four-leaf mathematics; no neural fitting or generation',
            'cases': cases, 'equal_continuation_null': equal,
            'sample_count': len(indices), 'teacher_sample_ce_observation': sample_mean,
            'exact_teacher_expected_ce': cases[0]['sequence_ce'],
            'greedy_leaf_ce': float(-np.log(p_leaf[q_leaf.argmax()])),
            'sample_note': 'This finite sample mean is an observation; its expectation is exact sequence CE.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = verify()
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'cases': len(result['cases']), 'output': str(args.output)}))
