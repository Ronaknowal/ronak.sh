"""Independent scalar/enumeration/mask checks, with no pretrained model load.

Run: python group_checks.py --output mechanism-checks.json
Requires NumPy and PyTorch. No generation, neural training or dataset scoring.
"""
import argparse
import itertools
import json
import math
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import torch

from group_estimators import METHODS, advantages, enumerate_distribution, group_gradient, reward_budget
from group_losses import group_advantages, grpo_loss, reduce_token_loss, response_logps, rloo_loss
from kto_loss import cyclic_completions, kto_loss, practical_reference


def verify():
    checks = []
    def check(name,condition):
        if not condition:
            raise AssertionError(name)
        checks.append(name)
    p = np.array([.15,.55,.3])
    rewards = np.array([-2.,.5,3.])
    z = torch.tensor(np.log(p),dtype=torch.float64,requires_grad=True)
    objective = (z.softmax(0)*torch.tensor(rewards)).sum()
    target, = torch.autograd.grad(objective,z)
    for size in (2,3,4):
        distributions = {m:enumerate_distribution(p,rewards,size,m) for m in METHODS}
        for method,result in distributions.items():
            check(f'probability mass G{size} {method}',abs(result['total_probability']-1)<1e-12)
            check(f'covariance PSD G{size} {method}',np.linalg.eigvalsh(result['covariance']).min()>-1e-12)
            check(f'MSE identity G{size} {method}',abs(result['mse']-result['covariance_trace']-result['bias_squared'])<1e-12)
        for method in ('reinforce','constant','loo','corrected'):
            np.testing.assert_allclose(distributions[method]['mean_gradient'],target.numpy(),atol=1e-12,rtol=0)
            checks.append(f'autograd target G{size} {method}')
        np.testing.assert_allclose(distributions['self_mean']['mean_gradient'],target.numpy()*(size-1)/size,atol=1e-12)
        checks.append(f'self dependence factor G{size}')
        for group in itertools.product(range(3),repeat=size):
            np.testing.assert_allclose(group_gradient(p,rewards,group,'loo'),
                                       group_gradient(p,rewards,group,'corrected'),atol=2e-15)
        checks.append(f'pointwise LOO corrected equality G{size}')
        budget = reward_budget(distributions['loo'],size*4)
        check(f'four independent groups variance G{size}',
              abs(budget['covariance_trace']-distributions['loo']['covariance_trace']/4)<1e-14)
    for method in ('self_mean','corrected','loo','standardized'):
        check(f'equal reward null {method}',np.count_nonzero(advantages([2.,2.,2.],method))==0)
    values = torch.tensor([0.,2.,float('nan'),4.,1.,float('nan'),float('nan'),float('nan')])
    result,counts = group_advantages(values,4,'loo')
    torch.testing.assert_close(result,torch.tensor([-3.,0.,0.,3.,0.,0.,0.,0.]))
    check('observed counts distinct from zero reward',counts.tolist()==[3,1])
    check('cyclic pairing',cyclic_completions([[1],[2],[3],[4]])==[[4],[1],[2],[3]])
    for advantage in (-2.,0.,3.):
        for ratio in (.6,1.,1.5):
            variable = torch.tensor([[math.log(ratio)]],dtype=torch.float64,requires_grad=True)
            zero = torch.zeros_like(variable)
            one = torch.ones_like(variable)
            loss,_ = grpo_loss(variable,zero,zero,one,torch.tensor([advantage]),beta=0.)
            derivative, = torch.autograd.grad(loss,variable)
            clipped = (advantage>0 and ratio>1.2) or (advantage<0 and ratio<.8)
            expected = 0. if clipped else -advantage*ratio
            check(f'clipping sign A{advantage} ratio{ratio}',abs(float(derivative)-expected)<1e-12)
    terms = torch.tensor([[1.,0.,0.],[3.,3.,3.]],dtype=torch.float64,requires_grad=True)
    mask = torch.tensor([[1,0,0],[1,1,1]])
    for mode,expected in [('response',2.),('token',2.5),('fixed',10/6)]:
        value = reduce_token_loss(terms,mask,mode,3)
        check(f'unequal length {mode}',abs(float(value.detach())-expected)<1e-12)
        gradient, = torch.autograd.grad(value,terms,retain_graph=True)
        check(f'padding gradient zero {mode}',bool((gradient[mask==0]==0).all()))
    current = torch.tensor([[-.4,-.7]],dtype=torch.float64,requires_grad=True)
    old = current.detach()-torch.tensor([[.2,-.1]],dtype=torch.float64)
    _,detail = rloo_loss(current,old,torch.ones_like(current),torch.tensor([1.]))
    check('sequence SUM ratio',abs(float(detail['ratio'].detach())-math.exp(.1))<1e-12)
    class FixedLogits:
        def __call__(self,input_ids,attention_mask,use_cache):
            logits = torch.arange(input_ids.numel()*7,dtype=torch.float64).reshape(*input_ids.shape,7)/20
            return SimpleNamespace(logits=logits)
    ids = torch.tensor([[1,2,3,0,0],[1,4,5,6,0]])
    attention = torch.tensor([[1,1,1,1,0],[1,1,1,1,1]])
    selected = torch.tensor([[0,0,1,1,0],[0,0,0,1,1]])
    logps,target_mask = response_logps(FixedLogits(),ids,attention,selected)
    check('one shift and positional true EOS',target_mask.tolist()==[[False,True,True,False],[False,False,True,True]])
    reference_logits = FixedLogits()(ids,attention,False).logits[:,:-1].log_softmax(-1)
    torch.testing.assert_close(logps,reference_logits.gather(-1,ids[:,1:,None]).squeeze(-1),atol=1e-14,rtol=0)
    checks.append('independent dense logsoftmax score check')
    for labels in ([True,False,False],[True,True,True],[False,False,False]):
        scores = torch.tensor([.7,-.5,1.3],dtype=torch.float64,requires_grad=True)
        ref = torch.tensor([.2,-.8,1.1],dtype=torch.float64,requires_grad=True)
        point = torch.tensor(.15,dtype=torch.float64,requires_grad=True)
        loss,_ = kto_loss(scores,ref,torch.tensor(labels),point,beta=.4,desirable_weight=2.,undesirable_weight=1.)
        gradient,ref_gradient,point_gradient = torch.autograd.grad(loss,(scores,ref,point),allow_unused=True)
        expected = []
        for d,reference,label in zip(scores.detach().tolist(),ref.detach().tolist(),labels):
            sign = 1 if label else -1
            weight = 2 if label else 1
            u = sign*.4*(d-reference-.15)
            sigmoid = 1/(1+math.exp(-u))
            expected.append(-weight*sign*.4*sigmoid*(1-sigmoid)/3)
        torch.testing.assert_close(gradient,torch.tensor(expected,dtype=torch.float64),atol=1e-14,rtol=1e-12)
        check(f'KTO reference detached {labels}',ref_gradient is None and point_gradient is None)
        checks.append(f'KTO scalar derivative {labels}')
    mismatch = torch.tensor([-2.,-1.],requires_grad=True)
    point = practical_reference(mismatch,torch.tensor([-1.,-1.]))
    check('practical negative mean clamps and detaches',float(point)==0 and not point.requires_grad)
    return {'status':'pass','count':len(checks),'checks':checks,
            'boundary':'Constructed scalar/tensor checks only; no pretrained model load, dataset scoring, generation or training.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    result = verify()
    if args.output.exists():
        raise FileExistsError('Preserve the earlier check receipt; choose a new output path.')
    args.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'checks':result['count']}))


if __name__ == '__main__':
    main()
