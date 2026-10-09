"""Grouped causal-response losses from PyTorch tensor operations.

Run: python group_losses.py --output grouped-losses.json
The executable example uses declared token-score fixtures, not generated text.
"""
import argparse
import json
from pathlib import Path

import torch


def response_logps(model, input_ids, attention_mask, response_mask):
    """Return shifted token log probabilities and positional target mask.

    response_mask marks original token positions. An actual EOS is selected;
    padding that stores the same ID is excluded by position. Prompt context
    remains visible to attention. The backbone supplies logits, not this loss.
    """
    logits = model(input_ids=input_ids, attention_mask=attention_mask, use_cache=False).logits[:, :-1]
    targets = input_ids[:, 1:]
    selected = logits.gather(-1, targets.unsqueeze(-1)).squeeze(-1)
    logps = selected-torch.logsumexp(logits, dim=-1)
    mask = response_mask[:, 1:].bool() & attention_mask[:, 1:].bool()
    return logps, mask


def group_advantages(rewards, group_size, method='loo', epsilon=1e-4):
    """Consecutive rows are independent draws for one prompt; rewards detached.

    Missing rewards are NaN. Fewer than two observed rewards gives zero update
    with an explicit valid count, not a claim that a LOO baseline was observed.
    """
    if group_size < 2 or rewards.ndim != 1 or len(rewards) % group_size:
        raise ValueError('Require complete consecutive groups with G>=2.')
    if torch.isinf(rewards).any():
        raise ValueError('Infinite rewards are a numerical error, not missing feedback.')
    grouped = rewards.detach().reshape(-1, group_size)
    valid = torch.isfinite(grouped)
    counts = valid.sum(-1, keepdim=True)
    values = torch.where(valid, grouped, 0.)
    means = values.sum(-1, keepdim=True)/counts.clamp_min(1)
    centered = torch.where(valid, grouped-means, 0.)
    if method == 'loo':
        advantages = centered*counts/(counts-1).clamp_min(1)
    elif method == 'self_mean':
        advantages = centered
    elif method == 'standardized':
        variance = centered.square().sum(-1, keepdim=True)/(counts-1).clamp_min(1)
        advantages = centered/(variance.sqrt()+epsilon)
    else:
        raise ValueError('Use loo, self_mean or standardized.')
    advantages = torch.where(valid & (counts > 1), advantages, 0.)
    return advantages.flatten(), counts.squeeze(-1)


def reduce_token_loss(terms, mask, reduction='response', fixed_cap=None):
    weighted = terms*mask
    lengths = mask.sum(-1)
    if reduction == 'response':
        return (weighted.sum(-1)/lengths.clamp_min(1)).mean()
    if reduction == 'token':
        return weighted.sum()/lengths.sum().clamp_min(1)
    if reduction == 'fixed':
        if fixed_cap is None or fixed_cap < int(lengths.max()):
            raise ValueError('The fixed generation cap must contain every actual response.')
        return weighted.sum()/(len(terms)*fixed_cap)
    raise ValueError('Use response, token or fixed reduction.')


def grpo_loss(logps, old_logps, reference_logps, mask, advantages,
              beta=.01, epsilon=.2, reduction='response', fixed_cap=None,
              importance='token', bias_correction_kl=False):
    """Minimize the negative clipped surrogate plus a reference term.

    Old, reference and advantages are constants. The optional corrected KL
    branch differentiates the importance weight too. Sequence mode here is
    current TRL's geometric mean ratio, not ordinary sequence importance.
    """
    log_ratio = logps-old_logps.detach()
    if importance == 'token':
        ratio = log_ratio.exp()
    elif importance == 'geometric':
        ratio = ((log_ratio*mask).sum(-1)/mask.sum(-1).clamp_min(1)).exp()[:, None]
    else:
        raise ValueError('Use token or geometric importance for this GRPO loss.')
    advantage = advantages.detach()[:, None]
    surrogate = torch.minimum(ratio*advantage, ratio.clamp(1-epsilon,1+epsilon)*advantage)
    difference = reference_logps.detach()-logps
    k3 = difference.exp()-difference-1
    penalty = ratio*k3 if bias_correction_kl else k3
    terms = -surrogate+beta*penalty
    return reduce_token_loss(terms,mask,reduction,fixed_cap), {
        'ratio':ratio,'k3':k3,'penalty':penalty,'surrogate':surrogate,
        'token_loss':terms,'lengths':mask.sum(-1)}


def rloo_reward(rewards, old_logps, reference_logps, mask, beta=.01):
    """Current trainer's reward-side signed sequence log-ratio, then detach."""
    sampled_log_ratio = ((old_logps-reference_logps)*mask).sum(-1)
    return (rewards-beta*sampled_log_ratio).detach(), sampled_log_ratio.detach()


def rloo_loss(logps, old_logps, mask, advantages, epsilon=.2):
    """Current-style clipped sequence-SUM ratio; average across responses."""
    log_ratio = ((logps-old_logps.detach())*mask).sum(-1)
    ratio = log_ratio.exp()
    advantage = advantages.detach()
    surrogate = torch.minimum(ratio*advantage, ratio.clamp(1-epsilon,1+epsilon)*advantage)
    return -surrogate.mean(), {'ratio':ratio,'surrogate':surrogate,'log_ratio':log_ratio}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    dtype = torch.float64
    current = torch.tensor([[-.8,-1.2,-.4],[-.3,-.9,-.7],[-1.,-.5,-.6],[-.2,-.6,-.8]],dtype=dtype)
    old = current+torch.tensor([[.1,-.2,0.],[0.,.1,-.1],[-.1,.2,0.],[.2,0.,-.2]],dtype=dtype)
    reference = current+.15
    mask = torch.tensor([[1,1,0],[1,1,1],[1,0,0],[1,1,1]],dtype=dtype)
    rewards = torch.tensor([0.,1.,1.,2.],dtype=dtype)
    report = {'boundary':'Constructed selected-token scores; these are not model generation outcomes.'}
    for method in ('grpo','rloo'):
        variable = current.clone().requires_grad_()
        if method == 'grpo':
            advantage, counts = group_advantages(rewards,4,'standardized')
            loss, details = grpo_loss(variable,old,reference,mask,advantage)
        else:
            shaped, sampled_kl = rloo_reward(rewards,old,reference,mask)
            advantage, counts = group_advantages(shaped,4,'loo')
            loss, details = rloo_loss(variable,old,mask,advantage)
            details['reward_side_log_ratio'] = sampled_kl
        gradient, = torch.autograd.grad(loss,variable)
        report[method] = {'loss':float(loss.detach()),'advantages':advantage.tolist(),
                          'valid_counts':counts.tolist(),'gradient':gradient.tolist(),
                          'details':{k:v.detach().tolist() for k,v in details.items()}}
    args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'output':str(args.output),'methods':['grpo','rloo']}))


if __name__ == '__main__':
    main()
