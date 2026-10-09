"""Stable teacher/student divergences, manual gradients, and Torch parity.

python distillation_loss.py --output loss-results.json
Requires NumPy and PyTorch. The fixtures are constructed, not model benchmarks.
The last axis names the same vocabulary events in teacher and student.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F


def log_softmax(logits, temperature=1.0):
    if temperature <= 0:
        raise ValueError('Temperature must be positive')
    values = np.asarray(logits, dtype=np.float64) / temperature
    shifted = values - values.max(axis=-1, keepdims=True)
    return shifted - np.log(np.exp(shifted).sum(axis=-1, keepdims=True))


def divergence(student, teacher, mask=None, kind='forward', temperature=1.0,
               scale_t2=True, beta=0.5):
    """Return pooled loss, d(loss)/d(student logits), and per-position values.

    Teacher logits are fixed. kind='jsd' uses the unnormalized interior mixture,
    not the native API's special pure-KL endpoint replacements.
    """
    lp, lq = log_softmax(student, temperature), log_softmax(teacher, temperature)
    if lp.shape != lq.shape:
        raise ValueError('Logit shapes and vocabulary events must match')
    p, q = np.exp(lp), np.exp(lq)
    if kind == 'forward':
        per_position = (q * (lq-lp)).sum(axis=-1)
        derivative = (p-q) / temperature
    elif kind == 'reverse':
        gap = lp-lq
        per_position = (p*gap).sum(axis=-1)
        derivative = p*(gap-per_position[..., None]) / temperature
    elif kind == 'jsd':
        if not 0 < beta < 1:
            raise ValueError('Interior JSD requires 0 < beta < 1; use a named KL at endpoints')
        lm = np.logaddexp(lq+np.log(beta), lp+np.log1p(-beta))
        per_position = (beta*q*(lq-lm) + (1-beta)*p*(lp-lm)).sum(axis=-1)
        gap = lp-lm
        derivative = (1-beta)*p*(gap-(p*gap).sum(axis=-1, keepdims=True)) / temperature
    else:
        raise ValueError('Choose forward, reverse, or jsd')
    valid = np.ones(lp.shape[:-1], dtype=bool) if mask is None else np.asarray(mask, dtype=bool)
    if valid.shape != lp.shape[:-1]:
        raise ValueError('Mask must have one entry per vocabulary row')
    factor = temperature**2 if scale_t2 else 1.0
    denominator = max(int(valid.sum()), 1)
    loss = float((per_position*valid).sum()*factor/denominator)
    gradient = derivative*valid[..., None]*factor/denominator
    return loss, gradient, per_position*factor


def hard_cross_entropy(student, labels, mask=None):
    lp = log_softmax(student)
    labels = np.asarray(labels, dtype=np.int64)
    if labels.shape != lp.shape[:-1]:
        raise ValueError('One label per vocabulary row is required')
    valid = np.ones(labels.shape, dtype=bool) if mask is None else np.asarray(mask, dtype=bool)
    one_hot = np.eye(lp.shape[-1])[labels]
    terms = -(lp*one_hot).sum(axis=-1)
    denominator = max(int(valid.sum()), 1)
    return (float((terms*valid).sum()/denominator),
            (np.exp(lp)-one_hot)*valid[..., None]/denominator)


def mixed_objective(student, teacher, labels, alpha, temperature=2.0, mask=None):
    """Gold/hard CE at T=1 mixed with T² times forward KL at the chosen T."""
    if not 0 <= alpha <= 1:
        raise ValueError('Mixture weight must be in [0,1]')
    soft, soft_gradient, _ = divergence(student, teacher, mask, temperature=temperature)
    hard, hard_gradient = hard_cross_entropy(student, labels, mask)
    return ((1-alpha)*hard+alpha*soft,
            (1-alpha)*hard_gradient+alpha*soft_gradient)


def torch_divergence(student, teacher, mask, kind='forward', temperature=1.0,
                     scale_t2=True, beta=0.5):
    """Explicit Torch objective used by the neural loop; sampling is external."""
    lp = F.log_softmax(student/temperature, dim=-1)
    lq = F.log_softmax(teacher.detach()/temperature, dim=-1)
    p, q = lp.exp(), lq.exp()
    if kind == 'forward':
        terms = q*(lq-lp)
    elif kind == 'reverse':
        terms = p*(lp-lq)
    elif kind == 'jsd' and 0 < beta < 1:
        lm = torch.logaddexp(lq+np.log(beta), lp+np.log1p(-beta))
        terms = beta*q*(lq-lm)+(1-beta)*p*(lp-lm)
    else:
        raise ValueError('Invalid divergence or interior mixture weight')
    weights = mask.to(student.dtype)
    factor = temperature**2 if scale_t2 else 1.0
    return (terms.sum(-1)*weights).sum()*factor/weights.sum().clamp_min(1)


def verify():
    generator = np.random.default_rng(71)
    teacher = generator.normal(size=(2,3,4))
    student = generator.normal(size=(2,3,4))
    masks = [np.ones((2,3), dtype=bool),
             np.array([[True,True,True],[True,False,False]]),
             np.zeros((2,3), dtype=bool)]
    rows = []
    for kind in ('forward','reverse','jsd'):
        for temperature in (.5,1.,2.,8.):
            for mask in masks:
                loss, manual, _ = divergence(student, teacher, mask, kind, temperature)
                s = torch.tensor(student, requires_grad=True)
                t = torch.tensor(teacher, requires_grad=True)
                native = torch_divergence(s,t,torch.tensor(mask),kind,temperature)
                native.backward()
                np.testing.assert_allclose(native.item(),loss,atol=2e-13,rtol=2e-12)
                np.testing.assert_allclose(s.grad.numpy(),manual,atol=2e-13,rtol=2e-12)
                assert t.grad is None
                finite = np.zeros_like(student)
                for index in np.ndindex(student.shape):
                    high, low = student.copy(), student.copy()
                    high[index] += 1e-5
                    low[index] -= 1e-5
                    finite[index] = (divergence(high,teacher,mask,kind,temperature)[0]
                                   -divergence(low,teacher,mask,kind,temperature)[0])/2e-5
                np.testing.assert_allclose(finite,manual,atol=3e-9,rtol=3e-7)
                shifted = divergence(student+17,teacher-8,mask,kind,temperature)
                np.testing.assert_allclose(shifted[0],loss,atol=2e-12)
                np.testing.assert_allclose(manual.sum(-1),0,atol=1e-13)
                permutation = [2,0,3,1]
                renamed = divergence(student[...,permutation],teacher[...,permutation],mask,kind,temperature)
                np.testing.assert_allclose(renamed[0],loss,atol=1e-13)
                eta = .1
                updated = student-eta*manual
                np.testing.assert_allclose(updated,(s.detach()-eta*s.grad).numpy(),atol=1e-13)
                rows.append({'kind':kind,'temperature':temperature,'targets':int(mask.sum()),
                             'loss':loss,'after_sgd':divergence(updated,teacher,mask,kind,temperature)[0],
                             'finite_difference_error':float(np.max(abs(manual-finite)))})
    labels = np.array([[0,1,2],[3,0,1]])
    for alpha in (0,.4,1):
        loss,gradient = mixed_objective(student,teacher,labels,alpha,mask=masks[1])
        s = torch.tensor(student, requires_grad=True)
        terms = F.cross_entropy(s.reshape(-1,4),torch.tensor(labels).reshape(-1),reduction='none').reshape(2,3)
        native = (1-alpha)*(terms*torch.tensor(masks[1])).sum()/4
        native = native+alpha*torch_divergence(s,torch.tensor(teacher),torch.tensor(masks[1]),temperature=2)
        native.backward()
        np.testing.assert_allclose(loss,native.item(),atol=1e-13)
        np.testing.assert_allclose(gradient,s.grad.numpy(),atol=1e-13)
    q,p = np.array([.6,.2,.15,.05]),np.array([.4,.3,.2,.1])
    contributions = q*np.log(q/p)
    high_temperature = []
    for temperature in (1,2,8,128,4096):
        value,gradient,_ = divergence([.7,.2,-.1,-.8],[2,0,-1,-3],temperature=temperature)
        high_temperature.append({'temperature':temperature,'scaled_kl':value,'gradient':gradient.tolist()})
    return {'constructed_parity_cases':rows,'mixed_objective_cases':3,
            'kl_contributions':contributions.tolist(),'forward_kl':float(contributions.sum()),
            'temperature_example':high_temperature,'teacher_gradient':None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    result = verify()
    text = json.dumps(result,indent=2)+'\n'
    if args.output:
        args.output.write_text(text,encoding='utf8')
    print(text)


if __name__ == '__main__':
    main()
