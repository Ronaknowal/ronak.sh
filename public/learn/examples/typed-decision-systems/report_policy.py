"""A policy over probability reports, not a policy sampling category labels.

python report_policy.py --output report-policy.json
Centered Gaussian perturbations live in K-1 dimensions. Independent and LOO
baselines estimate the smoothed objective; a self mean attenuates the gradient.
The reward here is UNCLIPPED expected log + 0.5 spherical, not Laya's recipe.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np

from decision_math import masked_softmax

TRUTH=np.array([.6,.3,.1])
CENTER=np.array([.4,-.1,-.3])
SIGMA=.3


def reward_and_pathwise(logits):
    q=masked_softmax(logits)
    norm=np.linalg.norm(q,axis=-1,keepdims=True)
    dot=(q*TRUTH).sum(-1,keepdims=True)
    spherical_derivative=TRUTH/norm-dot*q/norm**3
    gradient=TRUTH-q + .5*q*(spherical_derivative-(q*spherical_derivative).sum(-1,keepdims=True))
    reward=(TRUTH*np.log(q)).sum(-1)+.5*dot[...,0]/norm[...,0]
    return reward,gradient


def summary(values):
    return {'mean':values.mean(0).tolist(),'standard_deviation':values.std(0,ddof=1).tolist(),
            'standard_error':(values.std(0,ddof=1)/np.sqrt(len(values))).tolist(),
            'replicates':len(values)}


def experiment():
    reference_rng=np.random.default_rng(107)
    reference_noise=reference_rng.normal(size=(131072,3))
    reference_noise-=reference_noise.mean(-1,keepdims=True)
    reward,gradient=reward_and_pathwise(CENTER+SIGMA*reference_noise)
    # An independent Monte Carlo baseline; it is fixed before the estimator groups.
    baseline=float(reward.mean())
    generator=np.random.default_rng(103)
    rows=[]
    for size in [2,4,8,16]:
        noise=generator.normal(size=(4096,size,3))
        noise-=noise.mean(-1,keepdims=True)
        reports=CENTER+SIGMA*noise
        scores=noise/SIGMA
        rewards,pathwise=reward_and_pathwise(reports)
        average=rewards.mean(1,keepdims=True)
        loo=(rewards.sum(1,keepdims=True)-rewards)/(size-1)
        deviations=rewards.std(1,ddof=0,keepdims=True)
        centered=rewards-average
        estimators={
            'independent':((rewards-baseline)[...,None]*scores).mean(1),
            'leave_one_out':((rewards-loo)[...,None]*scores).mean(1),
            'self_mean':(centered[...,None]*scores).mean(1),
            'self_mean_std':((centered/(deviations+1e-8))[...,None]*scores).mean(1),
            'pathwise':pathwise.mean(1),
        }
        np.testing.assert_allclose(estimators['self_mean'],(1-1/size)*estimators['leave_one_out'],atol=2e-14)
        constant=np.full((4096,size),2.)
        null=constant-(constant.sum(1,keepdims=True)-constant)/(size-1)
        assert np.array_equal(null,np.zeros_like(null))
        rows.append({'group_size':size,'noise_sha256':hashlib.sha256(noise.tobytes()).hexdigest(),
                     'estimators':{name:summary(value) for name,value in estimators.items()},
                     'first_twelve_group_estimates':{name:value[:12].tolist() for name,value in estimators.items()},
                     'self_to_loo_exact_factor':1-1/size})
    return {'scope':'finite probability-report experiment; no neural model or PPO',
            'truth':TRUTH.tolist(),'center':CENTER.tolist(),'sigma':SIGMA,'spherical_weight':.5,
            'reference_noise_sha256':hashlib.sha256(reference_noise.tobytes()).hexdigest(),
            'reference_smoothed_gradient':summary(gradient),'independent_baseline':baseline,
            'deterministic_gradient':reward_and_pathwise(CENTER)[1].tolist(),'groups':rows}


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    with Path(args.output).open('x',encoding='utf-8') as stream:
        json.dump(experiment(),stream,indent=2,allow_nan=False)
