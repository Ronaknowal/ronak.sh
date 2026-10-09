"""Different-reviewer complementary probes; no study mains or optimizer steps."""
from pathlib import Path
import hashlib, json, math, sys, zipfile
import torch

root=Path.cwd()
base=root/'docs/teaching/llm-architecture-training/dpo-direct-preference-optimization'
public=root/'public/learn/examples/dpo'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=json.loads((base/'content-inputs.json').read_text())
def guard():
    for row in packet['files']: assert sha(root/row['path'])==row['sha256'],row['path']
guard()
sys.path.insert(0,str(public))
from dpo_algebra import dpo, tilted, objective, kl, shared_step
from response_scores import pack,response_scores,pair_loss
from causal_backbone import TinyLM
from scratch_dpo import frozen_copy,digest_model
checks=[]
torch.set_num_threads(2)
torch.manual_seed(805)
# A new nonzero-margin scalar chain: reversing the label gives L(z)-L(-z)=-z.
a=dpo(-3.1,-4.7,-3.5,-4.2,.73)
b=dpo(-4.7,-3.1,-4.2,-3.5,.73)
assert math.isclose(a['loss']-b['loss'],-a['logit'],abs_tol=1e-12)
q=[.1,.2,.7]; rewards=[-.8,.4,1.1]; beta=.63; p=[.3,.45,.25]
opt=tilted(q,rewards,beta)
assert math.isclose(objective(p,q,rewards,beta),beta*(opt['log_normalizer']-kl(p,opt['policy'])),abs_tol=1e-12)
checks.append('Changed label reversal identity and complete three-action objective identity')
# Three pairs, unequal lengths, and an actual decoder. New gradients need no fit.
prompts=[[1,3],[1],[1,4,5]]*2
responses=[[4,2],[6,7,2],[8,2],[9,10,2],[4,2],[6,7,8,2]]
batch=pack(prompts,responses,pad_id=2)
model=TinyLM(13,context=16,width=16,heads=2,layers=2).double().eval()
ref=frozen_copy(model); identity=digest_model(ref)
assert all(x.data_ptr()!=y.data_ptr() for x,y in zip(model.parameters(),ref.parameters()))
with torch.no_grad(): model.head.weight[4,0]+=.23
def score(m,b): return response_scores(m(b['input_ids']),**b)['sums']
ps=score(model,batch)
with torch.no_grad(): rs=score(ref,batch)
loss,margin,_=pair_loss(ps,rs,3,beta=.41)
grad=torch.autograd.grad(loss,tuple(model.parameters()))
order=torch.tensor([2,0,1,5,3,4])
permuted={k:v[order] for k,v in batch.items()}
with torch.no_grad(): pr=score(ref,permuted)
pl,_,_=pair_loss(score(model,permuted),pr,3,beta=.41)
pg=torch.autograd.grad(pl,tuple(model.parameters()))
assert torch.allclose(pl,loss,atol=1e-12,rtol=0)
assert max((g-h).abs().max().item() for g,h in zip(grad,pg))<1e-12
extended={k:torch.nn.functional.pad(v,(0,4),value=2 if k=='input_ids' else 0) for k,v in batch.items()}
with torch.no_grad(): er=score(ref,extended)
el,_,_=pair_loss(score(model,extended),er,3,beta=.41)
eg=torch.autograd.grad(el,tuple(model.parameters()))
assert torch.allclose(el,loss,atol=1e-12,rtol=0)
assert max((g-h).abs().max().item() for g,h in zip(grad,eg))<1e-12
assert digest_model(ref)==identity and all(p.grad is None for p in ref.parameters())
checks.append('Actual two-layer causal model: three-pair reorder and four-cell padding preserve all gradients; reference distinct/frozen')
# Explicit output-coordinate derivative and renaming invariance at new dimensions.
logits=torch.randn(6,batch['input_ids'].shape[1],13,dtype=torch.float64,requires_grad=True)
s=response_scores(logits,**batch)
loss=-s['sums'].sum(); g=torch.autograd.grad(loss,logits)[0]
for i in range(6):
    for t in range(logits.shape[1]-1):
        target=int(batch['input_ids'][i,t+1])
        expected=logits[i,t].softmax(-1).detach()
        expected[target]-=1
        if not s['valid'][i,t]: expected.zero_()
        assert torch.allclose(g[i,t],expected,atol=1e-12)
perm=torch.randperm(13); inverse=torch.argsort(perm)
renamed={**batch,'input_ids':inverse[batch['input_ids']]}
assert torch.allclose(response_scores(logits[:,:,perm],**renamed)['sums'],s['sums'],atol=1e-12)
checks.append('Every selected vocabulary derivative and vocabulary-renaming equivariance')
# Evaluate stored results, not the fitted models or their original check mains.
scratch=json.loads((public/'results/scratch.json').read_text())
native=json.loads((public/'results/native.json').read_text())
generation_count=0
for method in scratch['methods']:
    for point in method['checkpoints']:
        valid=0
        for row in point['generation']['outputs']:
            prompt=row['prompt_ids']; country=scratch['tokens'][prompt[2]]
            capital=7 if country=='France' else 8
            expected=[capital,2] if prompt[1]==3 else [capital,9,10,11,prompt[2],12,2]
            correct=row['response_ids']==expected
            assert correct==row['criterion'];valid+=correct;generation_count+=1
            assert row['response']==' '.join(scratch['tokens'][t] for t in row['response_ids'])
        assert valid==point['generation']['criterion_count']
for phase in ['before','after']:
    rows=native[phase]['predictions']; losses=[]; briers=[]
    for row in rows:
        a=dpo(row['chosen_logp'],row['rejected_logp'],row['reference_chosen_logp'],row['reference_rejected_logp'],.2)
        assert abs(a['relative_margin']-row['margin'])<3e-5
        assert abs(a['preference_probability']-row['probability'])<2e-6
        losses.append(a['loss']);briers.append((1-a['preference_probability'])**2)
    assert abs(sum(losses)/len(rows)-native[phase]['metrics']['bce'])<2e-6
    assert abs(sum(briers)/len(rows)-native[phase]['metrics']['brier'])<2e-6
checks.append('All320 literal constructed generations and128 initial/final held-out margins/probabilities/losses reconstructed')
with zipfile.ZipFile(public/'dpo-programs.zip') as z:
    members=z.namelist()
    for name in members: assert z.read(name)==(public/name).read_bytes(),name
checks.append('Every archive member equals its supplied file')
guard()
out={'reviewer':'root','checks':checks,'guarded_files':len(packet['files']),'archive_members':len(members),'constructed_generations':generation_count,'fits':0,'model_generations':0,'inputs_sha256':sha(base/'content-inputs.json'),'checker_sha256':sha(Path(__file__)),'loss':loss.item(),'native_metrics':{k:native[k]['metrics'] for k in ['before','after']}}
(base/'content-review-checks.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checks':checks,'guards':len(packet['files'])}))
for phase in ['baseline_generations','final_generations']:
    print(phase)
    for row in native[phase]: print(json.dumps({k:row[k] for k in ['row_id','sample','prompt','response','stop','malformed']},ensure_ascii=False))
