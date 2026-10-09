"""Exact finite-action policy-gradient estimators and their distributions.

Run: python group_estimators.py --group-size 4 --output finite-estimators.json
Requires NumPy. This program does not load or train a language model.
"""
import argparse
import itertools
import json
from pathlib import Path

import numpy as np


METHODS = ('reinforce', 'constant', 'self_mean', 'corrected', 'loo', 'standardized')


def softmax(logits):
    logits = np.asarray(logits, dtype=np.float64)
    weights = np.exp(logits - logits.max())
    return weights / weights.sum()


def policy_contract(probabilities, rewards):
    probabilities = np.asarray(probabilities, dtype=np.float64)
    rewards = np.asarray(rewards, dtype=np.float64)
    if (probabilities.ndim != 1 or len(probabilities) < 2 or
            probabilities.shape != rewards.shape or
            not np.isfinite(probabilities).all() or not np.isfinite(rewards).all() or
            np.any(probabilities < 0) or not np.isclose(probabilities.sum(), 1., atol=1e-12, rtol=0)):
        raise ValueError('Require equal finite vectors and nonnegative probabilities summing to one.')
    return probabilities, rewards


def advantages(rewards, method, baseline=.5, epsilon=1e-4):
    """One same-prompt group. Every reward is observed, rather than missing."""
    values = np.asarray(rewards, dtype=np.float64)
    if values.ndim != 1 or not len(values) or not np.isfinite(values).all():
        raise ValueError('Require a nonempty finite reward group.')
    if method == 'reinforce':
        return values.copy()
    if method == 'constant':
        return values - baseline
    if len(values) < 2:
        raise ValueError('Group estimators require at least two independent draws.')
    centered = values - values.mean()
    if method == 'self_mean':
        return centered
    if method == 'corrected':
        return centered * len(values) / (len(values)-1)
    if method == 'loo':
        # One sum supplies every excluded baseline: O(G), not a quadratic loop.
        other_mean = (values.sum()-values) / (len(values)-1)
        return values-other_mean
    if method == 'standardized':
        if epsilon <= 0:
            raise ValueError('A positive epsilon defines the all-equal case.')
        return centered / (values.std(ddof=1)+epsilon)
    raise ValueError(f'Unknown method: {method}')


def exact_target(probabilities, rewards):
    probabilities, rewards = policy_contract(probabilities, rewards)
    expected_reward = float(probabilities @ rewards)
    return expected_reward, probabilities * (rewards-expected_reward)


def group_gradient(probabilities, rewards, actions, method, baseline=.5, epsilon=1e-4):
    """Gradient coordinates are the categorical policy logits, not LM weights."""
    probabilities, rewards = policy_contract(probabilities, rewards)
    actions = np.asarray(actions, dtype=np.int64)
    if actions.ndim != 1 or not len(actions) or np.any(actions < 0) or np.any(actions >= len(rewards)):
        raise ValueError('Actions must index a nonempty ordered group.')
    selected = advantages(rewards[actions], method, baseline, epsilon)
    scores = np.eye(len(probabilities))[actions]-probabilities[None, :]
    return (selected[:, None]*scores).mean(axis=0)


def enumerate_distribution(probabilities, rewards, group_size, method,
                           baseline=.5, epsilon=1e-4, include_groups=True):
    """Enumerate independent ordered draws: O(K**G * G * K) time.

    Weighted online central moments avoid subtracting two close second moments.
    The enumeration streams; retaining every group is optional and costs O(K**G*K).
    """
    probabilities, rewards = policy_contract(probabilities, rewards)
    if group_size < 2 or len(probabilities)**group_size > 100_000:
        raise ValueError('Use G>=2 and at most 100,000 ordered groups for exact enumeration.')
    expected_reward, target = exact_target(probabilities, rewards)
    mass = 0.
    mean = np.zeros(len(probabilities))
    second_central = np.zeros((len(probabilities), len(probabilities)))
    mixed_mass = 0.
    groups = []
    for actions in itertools.product(range(len(probabilities)), repeat=group_size):
        probability = float(np.prod(probabilities[list(actions)]))
        if probability == 0:
            continue
        gradient = group_gradient(probabilities, rewards, actions, method, baseline, epsilon)
        next_mass = mass+probability
        difference = gradient-mean
        next_mean = mean+probability/next_mass*difference
        second_central += probability*np.outer(difference, gradient-next_mean)
        mean, mass = next_mean, next_mass
        observed = rewards[list(actions)]
        if not np.all(observed == observed[0]):
            mixed_mass += probability
        if include_groups:
            groups.append({'actions':list(actions), 'probability':probability,
                           'rewards':observed.tolist(), 'gradient':gradient.tolist()})
    covariance = second_central/mass
    bias = mean-target
    variance = float(np.trace(covariance))
    bias_squared = float(bias @ bias)
    return {'method':method,'group_size':group_size,'probabilities':probabilities.tolist(),
            'rewards':rewards.tolist(),'baseline':baseline,'epsilon':epsilon,
            'expected_reward':expected_reward,'target_gradient':target.tolist(),
            'mean_gradient':mean.tolist(),'bias':bias.tolist(),'bias_squared':bias_squared,
            'covariance':covariance.tolist(),'covariance_trace':variance,
            'mse':variance+bias_squared,'mixed_group_probability':mixed_mass,
            'total_probability':mass,'groups':groups}


def reward_budget(distribution, calls):
    """Average independent groups at the same fixed policy; no optimizer steps."""
    size = distribution['group_size']
    if calls < size or calls % size:
        raise ValueError('The reward budget must be a positive multiple of G.')
    groups = calls//size
    variance = distribution['covariance_trace']/groups
    return {'reward_calls':calls,'independent_groups':groups,'covariance_trace':variance,
            'bias_squared':distribution['bias_squared'],
            'mse':variance+distribution['bias_squared']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group-size',type=int,default=4)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    report = {method:enumerate_distribution([.2,.3,.5],[0.,1.,2.],args.group_size,method)
              for method in METHODS}
    args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'output':str(args.output),'methods':list(report),'group_size':args.group_size}))


if __name__ == '__main__':
    main()
