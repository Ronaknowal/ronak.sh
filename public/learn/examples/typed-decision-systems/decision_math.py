"""Transparent probability reports, proper scores and decisions.

python decision_math.py --output math-results.json
NumPy plus PyTorch; constructed examples, not a model benchmark.
Rows name the same events in the same order. Costs are actions by outcomes.
"""
import argparse
import json
from pathlib import Path

import numpy as np


def probability(value):
    value = np.asarray(value, dtype=np.float64)
    if value.ndim < 1 or value.shape[-1] < 2:
        raise ValueError('At least two events required')
    if not np.isfinite(value).all() or (value < 0).any():
        raise ValueError('Probabilities must be finite and nonnegative')
    if not np.allclose(value.sum(-1), 1, atol=1e-12, rtol=0):
        raise ValueError('Each probability row must sum to one')
    return value


def masked_softmax(logits, mask=None, temperature=1.0):
    z = np.asarray(logits, dtype=np.float64)
    keep = np.ones_like(z, dtype=bool) if mask is None else np.asarray(mask, dtype=bool)
    if z.shape != keep.shape or z.ndim < 1 or z.shape[-1] < 2:
        raise ValueError('A matching candidate mask is required')
    if not np.isfinite(temperature) or temperature <= 0:
        raise ValueError('Temperature must be finite and positive')
    if not keep.any(-1).all() or not np.isfinite(z[keep]).all():
        raise ValueError('Every row needs a finite valid candidate')
    active = np.where(keep, z, -np.inf) / temperature
    exp = np.exp(active - active.max(-1, keepdims=True))
    return exp / exp.sum(-1, keepdims=True)


def scores(report, observed):
    """Rewards: larger is better. RPS loss is normalized by K-1."""
    q = probability(report)
    if q.ndim != 1 or not isinstance(observed, (int, np.integer)) or not 0 <= observed < len(q):
        raise ValueError('One report and a valid integer outcome required')
    target = np.eye(len(q))[observed]
    return {'log_reward': float(np.log(q[observed])) if q[observed] else -np.inf,
            'brier_reward': -float(np.square(q-target).sum()),
            'spherical_reward': float(q[observed]/np.linalg.norm(q)),
            'rps_loss': float(np.square(np.cumsum(q)[:-1]-np.cumsum(target)[:-1]).mean())}


def expected_scores(truth, report):
    p, q = probability(truth), probability(report)
    if p.shape != q.shape or p.ndim != 1:
        raise ValueError('Same one-dimensional events required')
    return {key: sum(float(p[y])*scores(q,y)[key] for y in range(len(p)) if p[y] > 0)
            for key in scores(q,0)}


def typed_summary(report, values=None):
    q = probability(report)
    if q.ndim != 1:
        raise ValueError('One report required')
    positive = q[q > 0]
    result = {'choice_index': int(q.argmax()), 'confidence': float(q.max()),
              'entropy_nats': -float((positive*np.log(positive)).sum()),
              'ordinal_cdf': np.cumsum(q).tolist()}
    if values is not None:
        values = np.asarray(values,dtype=np.float64)
        if values.shape != q.shape or not np.isfinite(values).all():
            raise ValueError('Explicit finite values must match events')
        result['expectation'] = float(q@values)
    return result


def expected_cost(report, costs):
    p, c = probability(report), np.asarray(costs,dtype=np.float64)
    if p.ndim != 1 or c.ndim != 2 or c.shape[1] != len(p) or not len(c) or not np.isfinite(c).all():
        raise ValueError('Costs must have one column per outcome and at least one action')
    risks = c@p
    return {'risks': risks.tolist(), 'action': int(risks.argmin()), 'tie_rule': 'first action'}


def clipped_recipe(truth, report, spherical_weight=.75):
    p, q = probability(truth), probability(report)
    if p.shape != q.shape:
        raise ValueError('Events differ')
    logq=np.maximum(np.log(np.maximum(q,1e-12)),-9.21)
    return float(p@logq + spherical_weight*(p@q)/np.linalg.norm(q))


def verify():
    import torch
    import torch.nn.functional as F
    checks = []
    z = np.array([[2.,1.,0.],[1000.,999.,-1000.]])
    mask = np.array([[1,1,1],[1,1,0]],dtype=bool)
    p = masked_softmax(z,mask)
    native = torch.tensor(z).masked_fill(~torch.tensor(mask),-torch.inf).softmax(-1)
    np.testing.assert_allclose(p,native.numpy(),atol=1e-14)
    np.testing.assert_allclose(p,masked_softmax(z+5000,mask),atol=1e-14)
    checks += ['stable masked native parity','common shift','padded event zero']
    for target in [np.array([0.,1.,0.]),np.array([.2,.5,.3])]:
        logits = torch.tensor(z[0],requires_grad=True)
        loss = F.cross_entropy(logits,torch.tensor(target))
        loss.backward()
        np.testing.assert_allclose(logits.grad.numpy(),p[0]-target,atol=1e-14)
        checks.append('soft/hard CE gradient')
    truth = np.array([.6,.3,.1]); q = np.array([.2,.3,.5])
    good, bad = expected_scores(truth,truth),expected_scores(truth,q)
    np.testing.assert_allclose(good['log_reward']-bad['log_reward'],truth@np.log(truth/q))
    np.testing.assert_allclose(good['brier_reward']-bad['brier_reward'],np.square(truth-q).sum())
    checks += ['log regret is KL','Brier regret is squared distance']
    for value in [np.zeros((2,3),bool),np.ones((2,2),bool)]:
        try:
            masked_softmax(z,value)
        except ValueError:
            checks.append('invalid mask rejected')
        else:
            raise AssertionError('invalid mask accepted')
    rare = np.array([1-1e-6,1e-6]); changed = np.array([1-.5e-6,.5e-6])
    witness = {str(w): clipped_recipe(rare,changed,w)-clipped_recipe(rare,rare,w) for w in [.5,.75]}
    assert all(v > 0 for v in witness.values())
    return {'scope':'constructed finite examples','checks':checks,'probabilities':p.tolist(),
            'truth':truth.tolist(),'report':q.tolist(),'truth_scores':good,'report_scores':bad,
            'clipped_rare_class_reward_gain':witness,
            'cost_example':expected_cost([.6,.3,.1],[[0,4,10],[3,0,2],[8,2,0],[1,1,1]])}


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    with Path(args.output).open('x',encoding='utf-8') as stream:
        json.dump(verify(),stream,indent=2,allow_nan=False)
