"""Complementary different content review; no scientific fit or replay."""
from pathlib import Path
import hashlib, json, sys
import numpy as np
import torch

base=Path('docs/teaching/llm-architecture-training/supervised-fine-tuning-sft')
packet=base/'content-author-ready.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(packet)=='8d3a91b0c289086cf3a77ba752fc2974bef87695ebbfc18b6219fc29be0e3d92'
bound=json.loads(packet.read_text())['bindings']
for path,digest in bound.items(): assert sha(Path(path))==digest,path
sys.path.insert(0,str(Path('public/learn-code/supervised-fine-tuning').resolve()))
from sft_objective import masked_ce,context_forward,context_backward
from sft_batching import ExplicitDecoder,packed_batch
from sft_evaluate import classification_metrics
torch.set_num_threads(2)
rng=np.random.default_rng(291)
z=rng.normal(size=(2,6,8)); y=np.array([[-100,-100,-100,4,7,0],[-100,-100,6,1,-100,-100]])
original=masked_ce(z,y)
permutation=rng.permutation(8); inverse=np.argsort(permutation)
relabeled=np.where(y==-100,-100,inverse[np.maximum(y,0)])
renamed=masked_ce(z[:,:,permutation],relabeled)
assert np.isclose(original['loss'],renamed['loss'])
assert np.allclose(original['gradient'][:,:,permutation],renamed['gradient'])
doubled=masked_ce(np.concatenate([z,z]),np.concatenate([y,y]))
assert np.isclose(original['loss'],doubled['loss'])
assert np.allclose(original['gradient']/2,doubled['gradient'][:2])
ids=np.array([1,1,3,1,2,0]); embedding=rng.normal(size=(8,3));head=rng.normal(size=(3,8))
logits,cache=context_forward(ids,embedding,head)
loss=masked_ce(logits[None],y[:1]); grads=context_backward(loss['gradient'][0],cache,8)
values=[]
for delta in [-1e-6,1e-6]:
    edited=embedding.copy();edited[1,2]+=delta
    pred,_=context_forward(ids,edited,head)
    values.append(masked_ce(pred[None],y[:1])['loss'])
assert abs((values[1]-values[0])/2e-6-grads['embedding'][1,2])<1e-8

torch.manual_seed(91)
model=ExplicitDecoder(12,context=32,width=8,heads=2,layers=2).double().eval()
records=[{'ids':[1,2,3,4,0],'boundary':3},{'ids':[1,5,6,7,8,0],'boundary':3}]
packed=packed_batch(records)
with torch.no_grad():
    expected=model(packed['input_ids'],positions=packed['positions'],allowed=packed['allowed'])
    changed=packed['input_ids'].clone();changed[0,1:4]=torch.tensor([8,9,10])
    actual=model(changed,positions=packed['positions'],allowed=packed['allowed'])
    assert torch.equal(expected[:,5:],actual[:,5:])
    reversed_batch=packed_batch(records[::-1])
    reversed_logits=model(reversed_batch['input_ids'],positions=reversed_batch['positions'],allowed=reversed_batch['allowed'])
    torch.testing.assert_close(expected[0,:5],reversed_logits[0,6:],atol=1e-14,rtol=1e-14)
    torch.testing.assert_close(expected[0,5:],reversed_logits[0,:6],atol=1e-14,rtol=1e-14)

evaluation=json.loads(Path('public/learn-code/supervised-fine-tuning/study-evaluation.json').read_text())
for run in evaluation['runs']:
    chosen=min(run['history'],key=lambda item:(item['development_response']['nll'],item['step']))
    assert chosen['step']==run['selected_step']
    generated=run['test']['generation']; constrained=run['test']['constrained']
    assert len(generated['rows'])==104
    assert all((a['id'],a['prediction'])==(b['id'],b['prediction']) for a,b in zip(generated['rows'],constrained['rows']))
    # Permuting observation order cannot change any confusion-derived metric.
    assert classification_metrics(generated['rows'][::-1])['confusion']==generated['confusion']
    assert sum(r['records'] for r in run['updates'])==1595
collapsed=next(r for r in evaluation['runs'] if r['policy']=='full' and r['seed']==29)
assert collapsed['test']['generation']['confusion']==[[0,19,0,0],[0,69,0,0],[0,16,0,0]]
all_invalid=[{'gold':label,'prediction':'invalid'} for label in ['negative','no impact','positive']]
assert classification_metrics(all_invalid)['accuracy']==classification_metrics(all_invalid)['macro_f1']==0
for path,digest in bound.items(): assert sha(Path(path))==digest,path
report={'reviewer':'root','packet_sha256':sha(packet),'guarded_inputs':len(bound),
    'checks':['Vocabulary-renaming CE/gradient equivariance and replicated-batch weighting',
              'Repeated-token embedding finite difference on a new context fixture',
              'Actual decoder earlier-record perturbation isolation and packed-order equivariance',
              'Every fixed selected-step decision,104-row free/constrained agreements and row-order metric invariance',
              'Majority collapse,all-invalid metric boundary and all executed record counts'],
    'scientific_fits':0,'pretrained_inference':0,'limits':'Complementary arithmetic and fixed observations; no browser review.'}
(base/'content-review-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
