"""Prospective no-fit preflight for the reasoning lesson programs."""
from pathlib import Path
import itertools
import json
import math
import sys
import torch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'public/learn-code/rl-reasoning'))
import sequence_policy as tree
from reasoning_checks import check_trace, terminal_number, gsm_reward
from reasoning_sampling import group_probabilities, success_probability
from reasoning_evaluate import pass_at_k, budget_prefix, majority
from reasoning_train import (make_splits, tensors, create_policy, completion_logits,
                             supervised_loss, reinforce_loss, inspect_outputs, EOS)

checks = []
def check(value, name):
    assert value, name
    checks.append(name)

torch.set_num_threads(2)
torch.manual_seed(101)
check(tree.verify()['maximum_error'] < 1e-10, 'all24 manual/autograd/finite-difference coordinates')
leaves = tree.trajectories(tree.INITIAL)
check(abs(sum(r['probability'] for r in leaves) - 1) < 1e-14, 'complete path mass')
check(abs(tree.exact_gradient(tree.INITIAL)[0] - .53) < 1e-14, 'final-answer mass .53')
check(abs(tree.exact_gradient(tree.INITIAL, True)[0] - .4) < 1e-14, 'strict derivation mass .4')
for baseline in (-1., .5, 2.):
    total = [[0.] * 3 for _ in range(4)]
    for leaf in leaves:
        derivative = tree.score_gradient(tree.INITIAL, leaf['choices'])
        for row in range(4):
            for column in range(3):
                total[row][column] += leaf['probability'] * (leaf['reward'] - baseline) * derivative[row][column]
    check(max(abs(a-b) for row, other in zip(total, tree.exact_gradient(tree.INITIAL)[1]) for a,b in zip(row,other)) < 1e-14, 'independent baseline cancellation ' + str(baseline))
for n in range(1, 10):
    for correct in range(n+1):
        for k in range(1, n+1):
            truth = 1 - (math.comb(n-correct,k) / math.comb(n,k) if n-correct >= k else 0)
            check(abs(pass_at_k(n,correct,k)-truth)<1e-14, f'finite sample metric {n}/{correct}/{k}')
check(majority([None,3,4,4,3]) == 3, 'invalid excluded and first-occurrence tie')
check(budget_prefix([{'tokens':3}, {'tokens':5}], 6) == {'attempts':[{'tokens':3}], 'tokens':6, 'partial_tokens':3, 'unfinished_attempt':True}, 'unfinished attempt is charged and excluded')
check(check_trace(2,3,3,'sum = 6; answer = 15')['reward'] == 1, 'correct final despite false sum')
check(not check_trace(2,3,3,'sum = 6; answer = 15')['derivation_correct'], 'false sum exposed separately')
check(check_trace(2,3,3,'answer = 15',False)['reward'] == 0, 'cap without EOS has no reward')
check(terminal_number('work\n#### 1,234.00') == 1234, 'exact decimal and comma parsing')
for text in ['#### 1,23', '#### 1\n#### 1', '#### 1 extra', 'answer1', '#### 1e2']:
    check(terminal_number(text) is None, 'reject invalid terminal answer ' + text)
records = json.loads((ROOT/'public/learn-code/rl-reasoning/data/gsm8k-slice.json').read_text(encoding='utf-8'))
check(all(gsm_reward(row['answer'],row['answer']) == 1 for row in records), 'all24 original references parse unchanged')
splits = make_splits()
families = {name:{r['family'] for r in rows} for name,rows in splits.items()}
check([len(rows) for rows in splits.values()] == [195,40,40], 'complete predeclared split counts')
for left,right in itertools.combinations(families,2):
    check(not families[left]&families[right], 'family disjoint '+left+'/'+right)
prompts,targets = tensors(splits['train'][:8])
model = create_policy()
before = {name:t.detach().clone() for name,t in model.state_dict().items()}
logits = completion_logits(model,prompts,targets)
check(tuple(logits.shape) == (8,5,99), 'every response target has a predictor')
altered = targets.clone(); altered[:,3] = (altered[:,3] + 1) % 91
check(torch.equal(logits[:,:4],completion_logits(model,prompts,altered)[:,:4]), 'target cannot affect its own or prior prediction')
supervised_loss(model,prompts,targets).backward()
check(all(torch.isfinite(p.grad).all() for p in model.parameters() if p.grad is not None), 'all finite warm-start gradients without step')
model.zero_grad(set_to_none=True)
mask = torch.ones_like(targets,dtype=torch.bool)
mask[0,3:] = False
rewards = torch.tensor([1.,0.,0.,1.,0.,0.,1.,0.])
loss,adv,chosen = reinforce_loss(model,prompts,targets,mask,rewards,8)
expected = rewards - (rewards.sum()-rewards)/7
check(torch.equal(adv,expected), 'exact leave-one-out baseline')
gradient = torch.autograd.grad(loss,chosen)[0]
check(torch.equal(gradient, -adv[:,None]*mask/8), 'sequence sum and first-EOS mask derivative')
check(all(torch.equal(t,before[name]) for name,t in model.state_dict().items()), 'zero optimizer steps preserve all weights')
zero,advantages,_ = reinforce_loss(model,prompts,targets,mask,torch.zeros(8),8)
check(float(zero.detach()) == 0 and not bool(advantages.any()), 'all-failed group has zero reward signal')
check(abs(success_probability()['success_probability']-.53)<1e-14, 'sampler full-support matches finite tree')
for p in (0,.01,.5,1):
    parts = group_probabilities(p,8)
    check(abs(sum(parts.values())-1)<1e-14,'group partition '+str(p))
report = {'passed':True,'fits':0,'generation':0,'conditions':len(checks),'checks':checks}
destination = ROOT/'docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style/program-preflight.json'
with destination.open('x',encoding='utf-8') as handle:
    json.dump(report,handle,indent=2)
print(json.dumps({'passed':True,'conditions':len(checks),'fits':0,'generation':0}))
