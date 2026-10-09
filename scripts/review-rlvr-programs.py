"""Different prospective finite/source checks: no model, fit, generation or parser study."""
from pathlib import Path
import ast,hashlib,json,math,sys,itertools
root=Path(__file__).resolve().parents[1]
folder=root/'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
public=root/'public/learn/examples/rlvr'
sys.path.insert(0,str(public))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=json.loads((folder/'prospective-ready.json').read_text(encoding='utf-8'))
count=0
def check(value):
    global count
    assert value
    count+=1
bindings=packet.get('files',packet.get('inputs'))
if isinstance(bindings,list):bindings={x['path']:x['sha256'] for x in bindings}
for p,h in bindings.items():check(sha(root/p)==(h if isinstance(h,str) else h['sha256']))
for p in public.glob('*.py'):ast.parse(p.read_text(encoding='utf-8'));count+=1
from verifier_contracts import final_verdict,arithmetic_expression,proof_verdict
from evaluate_rollouts import pass_at_k,sample_metrics
from rlvr_data import pack,prompt_ids,target_ids,load_records,decode,PAD,EOS
import torch
from group_gradients import group_advantages,clipped_terms,finite_kl
for gold,text,accepted in [('3','prefix #### 6/2',True),('3','#### 3\nextra',False),('3','#### 2 #### 3.0',True),('3','3',False),('0.25','#### 1/4',True),('1','#### 2/0',False)]:
    check(final_verdict(text,gold)['accepted']==accepted)
check(final_verdict('#### 3',None)['accepted'] is None)
check(arithmetic_expression('(x-y)*(x+y)',7,2)==45)
try:arithmetic_expression('x**2',7,2)
except ValueError:count+=1
else:raise AssertionError('Unsupported operator accepted')
check(proof_verdict(('imp-intro','a','P',('assume','a')),('implies','P','P'))['accepted'])
check(not proof_verdict(('assume','a'),'P')['accepted'])
records=load_records();check(len(records['train'])==24 and len(records['test'])==12)
identities=[]
for split,rows in records.items():
    for row in rows:
        check(len(prompt_ids(row))+12<=320)
        check(len(row['question'].encode('utf-8'))<=240)
        check(0<=int(row['gold'])<=99)
        check('#### '+row['gold'] not in row['question'])
        check(decode(target_ids(row))=='#### '+row['gold'])
        identities.append((split,row['id']))
check(len(set(identities))==36)
b=pack([[258,65,259],[258,66,67,259]],[[35,EOS],[35,35,EOS]])
check(b['completion_mask'].sum(-1).tolist()==[2,3])
check(b['attention_mask'].sum(-1).tolist()==[5,7])
check(b['input_ids'][0,-1].item()==PAD)
check(not b['completion_mask'][0,-1] and b['completion_mask'][0,4])
for rewards in [[2.,-1.,2.,-1.],[1.,1.,1.,1.],[0.,0.,0.,0.],[3.,float('nan'),-2.,1.]]:
    valid=[r for r in rewards if math.isfinite(r)];mean=sum(valid)/len(valid)
    for correction in [0,1]:
        sd=math.sqrt(sum((r-mean)**2 for r in valid)/(len(valid)-correction))
        observed,stats=group_advantages(rewards,correction=correction)
        wanted=[(r-mean)/(sd+1e-4) if math.isfinite(r) else 0. for r in rewards]
        check(max(abs(a-b) for a,b in zip(observed.tolist(),wanted))<1e-12)
for a in [-1.7,.8]:
    for r in [.4,.9,1.1,1.6]:
        x=torch.tensor(r,dtype=torch.float64,requires_grad=True)
        val=clipped_terms(x,torch.tensor(a,dtype=torch.float64));val.backward()
        wanted=a if (a>0 and r<1.2) or (a<0 and r>.8) else 0.
        check(abs(x.grad.item()-wanted)<1e-12)
for n in range(2,10):
    for c in range(n+1):
        for k in range(1,n+1):
            subsets=list(itertools.combinations(range(n),k))
            exact=sum(any(i<c for i in group) for group in subsets)/len(subsets)
            check(abs(pass_at_k(n,c,k)-exact)<1e-12)
check(pass_at_k(3,2,4) is None)
check(finite_kl([0.,1.],[.3,.7])['finite'])
check(not finite_kl([.1,.9],[0.,1.])['finite'])
source=ast.parse((public/'causal_backbone.py').read_text())
upstream=ast.parse((root/'public/learn-code/causal-language-modeling/tiny_causal_lm.py').read_text())
for name in ['CausalAttention','Block','TinyLM']:
    get=lambda tree:next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name==name)
    check(ast.dump(get(source),include_attributes=False)==ast.dump(get(upstream),include_attributes=False))
result={'passed':True,'conditions':count,'source_guards':len(bindings),'models_constructed':0,'scientific_runs':0,'scope':'Different full11-source reading; independent changed finite inputs, parser/mask/gradient/estimator counting, exact causal class AST and all input guards. Original study stages not executed.','files':bindings}
(folder/'program-root-checks.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':True,'conditions':count,'guards':len(bindings)}))
