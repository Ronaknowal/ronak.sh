"""Current author-owned dispatcher and model trace checks; no fit or old writer."""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys
import torch
import torch.nn.functional as F

ROOT=Path(__file__).resolve().parents[1]
ID='mixture-of-experts-transformers-moe'
RECORD=ROOT/'docs/teaching/deep-learning-beginner'/ID
PROGRAM=ROOT/'public/learn-code'/ID/'moe-routing-dispatch.py'
torch.set_num_threads(1)
spec=importlib.util.spec_from_file_location('current_dispatch',PROGRAM)
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
checks=[]
maximum=0.

def close(name,actual,expected,tolerance=1e-11):
    global maximum
    error=float((torch.as_tensor(actual)-torch.as_tensor(expected)).abs().max())
    assert error<=tolerance,(name,error)
    maximum=max(maximum,error);checks.append({'name':name,'maxError':error})

def reject(name,function):
    try:function()
    except ValueError:checks.append({'name':name,'rejected':True});return
    raise AssertionError(name)

for seed in (19,41,73):
    fixture=p.comparison_fixture(seed)
    for k,normal,capacity in ((1,True,None),(1,False,None),(2,True,None),(2,False,1),(4,True,None),(2,True,0)):
        reference,gradients,used=p.forward_with_credit(p.dense_oracle,fixture,k,normal,capacity)
        for function in (p.grouped_experts,p.batched_tool_experts):
            output,credit,actual_used=p.forward_with_credit(function,fixture,k,normal,capacity)
            close(f'{seed}/{k}/{normal}/{capacity}/{function.__name__}/output',output,reference)
            assert actual_used==used
            for i,(actual,target) in enumerate(zip(credit,gradients)):
                close(f'{seed}/{k}/{normal}/{capacity}/{function.__name__}/operand{i}',actual,target)
                close(f'{seed}/{k}/{normal}/{capacity}/{function.__name__}/update{i}',fixture[i]-.03*actual,fixture[i]-.03*target)

# Independently perturb every operand coordinate in one non-tied full-normalizer case.
fixture=p.comparison_fixture(19)
_,analytic,_=p.forward_with_credit(p.grouped_experts,fixture,2,False)
direction=torch.linspace(.4,1.1,15,dtype=torch.float64).reshape(5,3)
def scalar(values):
    x,router,g,u,d=values
    ids,weights,_=p.select_gates(F.linear(x,router),2,False)
    kept,_=p.allocate(ids,4)
    result=p.grouped_experts(x,g,u,d,ids,weights,kept)
    return float((result*direction).sum()+.07*result.square().sum())
fd_error=0.
for i,value in enumerate(fixture):
    finite_difference=torch.zeros_like(value)
    for index in range(value.numel()):
        high=[v.clone() for v in fixture];low=[v.clone() for v in fixture]
        high[i].view(-1)[index]+=1e-6;low[i].view(-1)[index]-=1e-6
        finite_difference.view(-1)[index]=(scalar(high)-scalar(low))/2e-6
    error=float((finite_difference-analytic[i]).abs().max());assert error<2e-8
    fd_error=max(fd_error,error);checks.append({'name':f'central differences, all operand {i} coordinates','maxError':error,'coordinates':value.numel()})

ids=torch.tensor([[0,1],[0,2],[0,3],[1,2],[0,1]])
kept,used=p.allocate(ids,4,2);assert used==[2,2,2,1]
checks.append({'name':'five-token capacity, including assignment addresses','retained':int(kept.sum())})
reject('duplicate selected ID',lambda:p.allocate(torch.tensor([[0,0]]),4))
reject('boolean token priority',lambda:p.allocate(ids,4,order=[False,True,2,3,4]))
reject('noninteger capacity',lambda:p.allocate(ids,4,1.5))
reject('nonfinite scores',lambda:p.select_gates(torch.tensor([[float('inf'),0.]]),1))
reject('complex scores',lambda:p.select_gates(torch.tensor([[1j,0j]]),1))
reject('zero-support CV squared',lambda:p.cv_squared(torch.zeros(2)))
close('conditional Gaussian crossing',p.noisy_crossing(0,.5,.5),.15865525393145707,1e-12)
close('population CV squared',p.cv_squared(torch.tensor([1.,3.],dtype=torch.float64)),.25,1e-12)
x=torch.eye(2,dtype=torch.float64);phi=torch.diag(torch.full((2,),math.log(3),dtype=x.dtype))
answer,D,C,slots=p.soft_slots(x,phi,torch.stack([x,2*x]))
close('Soft MoE complete output',answer,torch.tensor([[.6875,.5625],[.5625,1.1875]],dtype=x.dtype))
close('Soft MoE column totals',D.sum(0),torch.ones(2,dtype=x.dtype))
close('Soft MoE row totals',C.sum(1),torch.ones(2,dtype=x.dtype))
reject('Soft MoE overflow',lambda:p.soft_slots(torch.full((2,2),1e200,dtype=x.dtype),torch.full((2,2),1e200,dtype=x.dtype),torch.stack([x,x])))

# Independent Torch trace of the existing JSON weights, including every affine boundary.
state_json=json.loads((ROOT/'public/learn-assets'/ID/'moe-001-17.json').read_text())
state={key:torch.tensor(value,dtype=torch.float64) for key,value in state_json.items()}
examples=json.loads((ROOT/'src/learn/data/moe-examples.json').read_text())['examples']
def native_trace(pixels,temperature=1,disabled=None):
    def linear(x,name):return F.linear(x,state[name+'.weight'],state.get(name+'.bias'))
    def norm(x,name):return F.layer_norm(x,(16,),state[name+'.weight'],state[name+'.bias'],1e-5)
    image=torch.tensor(pixels,dtype=torch.float64).reshape(8,8)
    patches=torch.stack([image[r:r+2,c:c+2].flatten() for r in (0,2,4,6) for c in (0,2,4,6)])
    projection=linear(patches,'project');positioned=projection+state['position']
    normalized=norm(positioned,'norm_attention');qkv=linear(normalized,'qkv')
    q,k,v=[part.reshape(16,2,8).transpose(0,1) for part in qkv.chunk(3,dim=1)]
    score=q@k.transpose(1,2)/math.sqrt(8);attention=score.softmax(-1)
    contexts=(attention@v).transpose(0,1).reshape(16,16)
    after_attention=positioned+linear(contexts,'attention_output');expert_input=norm(after_attention,'norm_ffn')
    router=linear(expert_input,'router');scores=router/temperature
    selected=scores.argsort(descending=True,stable=True)[:,:2];gates=scores.gather(1,selected).softmax(-1)
    combined=torch.zeros_like(expert_input)
    for expert in range(4):
        if expert==disabled:continue
        token,slot=(selected==expert).nonzero(as_tuple=True)
        rows=expert_input[token]
        answer=linear(F.silu(linear(rows,f'experts.{expert}.gate'))*linear(rows,f'experts.{expert}.value'),f'experts.{expert}.down')
        combined.index_add_(0,token,answer*gates[token,slot,None])
    after_expert=after_attention+combined;final=norm(after_expert,'norm_final');mean=final.mean(0);logits=linear(mean,'classifier')
    return {key:value.tolist() for key,value in {'patches':patches,'projection':projection,'positioned':positioned,'attentionNorm':normalized,'qkv':qkv,
      'attentionScores':score,'attention':attention,'contexts':contexts,'afterAttention':after_attention,'expertNorm':expert_input,'router':router,'selected':selected,
      'gates':gates,'combined':combined,'afterExperts':after_expert,'finalNorm':final,'mean':mean,'logits':logits,'probabilities':logits.softmax(-1)}.items()}
cases=[]
for source in examples:
    for mode in ('original','lower-half','upper-left','temperature2','disabled0'):
        pixels=source['pixels'].copy()
        if mode=='lower-half':pixels[32:]=[0.]*32
        if mode=='upper-left':
            for index in (0,1,8,9):pixels[index]=0.
        cases.append({'label':source['label'],'mode':mode,'pixels':pixels,'temperature':2 if mode=='temperature2' else 1,
          'disabled':0 if mode=='disabled0' else None,'native':native_trace(pixels,2 if mode=='temperature2' else 1,0 if mode=='disabled0' else None)})
record={'scope':'Author current no-writer programme plus new complete Torch traces of unchanged existing JSON weights; no fit or historical writer',
 'sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (PROGRAM,Path(__file__),ROOT/'public/learn-assets'/ID/'moe-001-17.json')},
 'python':sys.version,'torch':torch.__version__,'checks':checks,'count':len(checks),'maxParityError':maximum,'maxFiniteDifferenceError':fd_error,
 'modelTraceCases':cases,'result':'PASS'}
(RECORD/'reading-flow-native.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print(json.dumps({key:record[key] for key in ('count','maxParityError','maxFiniteDifferenceError','result')}))
