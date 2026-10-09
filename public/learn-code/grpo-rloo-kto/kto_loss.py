"""KTO utility, detached practical reference point and total-example reduction.

Run: python kto_loss.py --output kto-fixture.json
The worked update changes declared sequence scores, not a language model.
"""
import argparse
import json
from pathlib import Path

import torch


def cyclic_completions(completions):
    if len(completions) < 2:
        raise ValueError('Practical KL pairing requires an actual batch larger than one.')
    return [completions[-1],*completions[:-1]]


def practical_reference(policy_mismatch_scores, reference_mismatch_scores):
    """Finite single-process analogue of native gathered mean, clamp and detach.

    The mismatched offline score distribution is not exact current-policy KL.
    Both forward scores are no-grad inputs; do not create a hidden gradient path.
    """
    return (policy_mismatch_scores-reference_mismatch_scores).mean().clamp_min(0).detach()


def kto_loss(policy_scores, reference_scores, desirable, reference_point,
             beta=.1, desirable_weight=2., undesirable_weight=1.):
    if policy_scores.ndim != 1 or len(policy_scores) == 0 or desirable.shape != policy_scores.shape:
        raise ValueError('Require a nonempty score vector and one Boolean label per example.')
    if desirable.dtype != torch.bool:
        raise ValueError('Desirability labels must be Boolean.')
    log_ratios = policy_scores-reference_scores.detach()
    utility_input = beta*(log_ratios-reference_point.detach())
    sign = torch.where(desirable,1.,-1.)
    weight = torch.where(desirable,desirable_weight,undesirable_weight)
    # sigmoid(-sign*u) equals 1-sigmoid(sign*u) without subtractive cancellation.
    terms = weight*torch.sigmoid(-sign*utility_input)
    return terms.mean(), {'log_ratios':log_ratios,'utility_input':utility_input,
                          'weighted_terms':terms,'reference_point':reference_point.detach()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    policy = torch.tensor([-1.,-2.,-3.,-1.5],dtype=torch.float64,requires_grad=True)
    reference = torch.tensor([-1.2,-1.8,-2.7,-1.6],dtype=torch.float64)
    desirable = torch.tensor([True,False,False,True])
    mismatch_policy = torch.tensor([-2.,-2.5,-3.,-1.],dtype=torch.float64)
    mismatch_reference = torch.tensor([-2.2,-2.4,-3.4,-1.1],dtype=torch.float64)
    point = practical_reference(mismatch_policy,mismatch_reference)
    optimizer = torch.optim.SGD([policy],lr=.05)
    before = policy.detach().clone()
    loss, details = kto_loss(policy,reference,desirable,point)
    loss.backward()
    gradient = policy.grad.detach().clone()
    optimizer.step()
    report = {'boundary':'Constructed score-coordinate SGD demonstration, not a scientific neural fit.',
              'loss_before':float(loss.detach()),'scores_before':before.tolist(),
              'gradient':gradient.tolist(),'scores_after':policy.detach().tolist(),
              'learning_rate':.05,'details':{k:v.detach().tolist() for k,v in details.items()}}
    args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'output':str(args.output),'loss':report['loss_before']}))


if __name__ == '__main__':
    main()
