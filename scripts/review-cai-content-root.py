"""Different-review arithmetic and retained-data checks, without repeating model runs."""
import hashlib
import json
from pathlib import Path
import sys
import numpy as np
import torch

root=Path(__file__).resolve().parents[1]
programs=root/'public/learn/examples/constitutional-ai'
folder=root/'docs/teaching/llm-architecture-training/constitutional-ai-cai'
sys.path.insert(0,str(programs))
from policy_learning import kl_gradient, dpo_loss, optimum
from preference_model import preference_loss
checks=[]
for z in [[-.9,.2,1.1],[0.,0.,0.],[3.,-2.,.5]]:
    ref=np.array([.5,.3,.2]); rewards=np.array([-.3,.7,.2]); beta=.6
    x=torch.tensor(z,dtype=torch.float64,requires_grad=True)
    p=x.softmax(0); logp=x.log_softmax(0)
    objective=(p*(torch.tensor(rewards)-beta*(logp-torch.tensor(ref).log()))).sum()
    gradient,=torch.autograd.grad(objective,x,retain_graph=True)
    actual=kl_gradient(z,ref,rewards,beta)
    np.testing.assert_allclose(actual[0],objective.detach(),rtol=0,atol=1e-14)
    np.testing.assert_allclose(actual[1],gradient,rtol=0,atol=1e-14)
    margin=beta*(logp[2]-np.log(ref[2])-logp[0]+np.log(ref[0]))
    loss=torch.nn.functional.softplus(-margin)
    grad,=torch.autograd.grad(loss,x)
    result=dpo_loss(z,ref,2,0,beta)
    np.testing.assert_allclose(result[0],loss.detach(),rtol=0,atol=1e-14)
    np.testing.assert_allclose(result[1],grad,rtol=0,atol=1e-14)
checks.append('Three changed-state KL and DPO objectives/full-logit gradients independently match Torch autograd')
loss,grad,_=preference_loss([1],[[1]],[[0]],[.75])
assert abs(loss-.5632616875182228)<1e-14
assert abs(grad[0]-(-.018941421369995104))<1e-14
np.testing.assert_allclose(optimum([.6,.2,.2],[0,0,1],1),[.6,.2,.2*np.e]/np.sum([.6,.2,.2*np.e]))
checks.append('Displayed soft loss/update and exact policy optimum recomputed')
data=json.loads((programs/'cai_records.json').read_text(encoding='utf-8'))
duplicates=[r['row_idx'] for r in data['rows'] if r['row']['init_response'].strip()==r['row']['revision_response'].strip()]
assert duplicates==[40,77,78,80,82] and len(data['rows'])==10
checks.append('Actual retained records reproduce exact stripped duplicates and selected-subset denominator')
run=json.loads((programs/'critic_outputs.json').read_text(encoding='utf-8'))
for row in run['records']:
    mapped=[]
    for i,judge in enumerate(row['judge_passes']):
        a,b=[judge[k]['sequence_logprob'] for k in ['option_a','option_b']]
        for k in ['option_a','option_b']:
            assert abs(sum(judge[k]['token_logprobs'])-judge[k]['sequence_logprob'])<1e-6
        probability=1/(1+np.exp(b-a))
        assert abs(probability-judge['conditional_probability_a'])<1e-12
        mapped.append(1-probability if i==0 else probability)
    np.testing.assert_allclose(mapped,row['revision_probability_mapped'],rtol=0,atol=1e-12)
    assert abs(sum(mapped)/2-row['revision_probability_mean'])<1e-12
checks.append('Every retained actual judge pass recomputes token sums, conditional mass and identity mapping')
assert abs(3*.2**2*.8+.2**3-.104)<1e-14
assert abs(np.mean((np.array([.1,.2,.6,.8])-np.array([0,1,1,1]))**2)-.2125)<1e-14
checks.append('Error-independence and Brier examples recomputed')
files=list(programs.glob('*'))+[folder/'manuscript.jsx',Path(__file__)]
report={'reviewer':'root','passed':checks,'hashes':{str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.is_file()},'limits':'Complementary arithmetic/data review; original native fits and generation conserved, not replayed. No runtime/paint certification.'}
with (folder/'root-content-checks.json').open('x',encoding='utf-8') as out:json.dump(report,out,indent=2)
print(json.dumps({'passed':len(checks),'limits':report['limits']}))
