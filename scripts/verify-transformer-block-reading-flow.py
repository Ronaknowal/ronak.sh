"""Execute all printed programs and independently reconstruct saved block inference.

No fitting or changes to historical results. Writes new topic-owned receipts only.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import sys
import torch
from torch.nn import functional as F

ROOT = Path(__file__).resolve().parents[1]
RECORD = ROOT / 'docs/teaching/deep-learning-beginner/transformer-block-architecture'
WORK = ROOT / 'scratch/transformer-block-reading-flow/native'
WORK.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(1)
ASSET = ROOT / 'public/learn-code/transformer-block-architecture'
models = json.loads((ASSET / 'movement-runtime.json').read_text(encoding='utf-8'))

def independent_forward(model, points, tags, validity, key_exclude, pool_exclude):
    w = {name: torch.tensor(value, dtype=torch.float64) for name, value in model['state_dict'].items()}
    def linear(x, name):
        return F.linear(x, w[name+'.weight'], w.get(name+'.bias'))
    def norm(x, name):
        return F.layer_norm(x, (24,), w[name+'.weight'], w[name+'.bias'], 1e-5)
    coordinates = torch.tensor(points, dtype=torch.float64)
    t = torch.tensor(tags, dtype=torch.float64).reshape(-1, 1)
    state = linear(torch.cat((coordinates*2-1, t), dim=-1), 'stem')
    valid = torch.tensor(validity, dtype=torch.bool)
    traces = []
    for layer in range(2):
        prefix = f'blocks.{layer}'
        supplied = norm(state, prefix+'.norm_attention') if model['preNorm'] else state
        packed = F.linear(supplied, w[prefix+'.attention.in_proj_weight'], w[prefix+'.attention.in_proj_bias'])
        q, k, v = packed.chunk(3, dim=-1)
        heads, weights = [], []
        for head in range(2):
            query, key, value = [x[:, head*12:(head+1)*12] for x in (q,k,v)]
            score = query @ key.T / math.sqrt(12)
            if key_exclude:
                score = score.masked_fill(~valid[None, :], -torch.inf)
            probability = torch.softmax(score, dim=-1)
            weights.append(probability)
            heads.append(probability @ value)
        update = linear(torch.cat(heads,dim=-1), prefix+'.attention.out_proj')
        summed = state+update
        context = summed if model['preNorm'] else norm(summed,prefix+'.norm_attention')
        ffn_input = norm(context,prefix+'.norm_feedforward') if model['preNorm'] else context
        hidden = F.gelu(linear(ffn_input,prefix+'.feedforward.0'), approximate='none')
        ffn_update = linear(hidden,prefix+'.feedforward.2')
        output = context+ffn_update
        if not model['preNorm']:
            output = norm(output,prefix+'.norm_feedforward')
        traces.append(dict(input=state.tolist(),attentionInput=supplied.tolist(),update=update.tolist(),residual=summed.tolist(),context=context.tolist(),ffnInput=ffn_input.tolist(),hidden=hidden.tolist(),ffnUpdate=ffn_update.tolist(),output=output.tolist(),weights=[x.tolist() for x in weights]))
        state=output
    normalized=norm(state,'final_norm')
    pooled=normalized[valid].mean(0) if pool_exclude else normalized.mean(0)
    logits=linear(pooled,'classifier')
    return dict(logits=logits.tolist(),probabilities=torch.softmax(logits,dim=-1).tolist(),traces=traces)

expected={}
for name, model in models.items():
    source=model['points']; tags=model['times']
    conditions=[]
    conditions.append(('original',source,tags,[True]*45,True,True))
    conditions.append(('reverse-coordinates',source[::-1],tags,[True]*45,True,True))
    conditions.append(('reverse-records',source[::-1],tags[::-1],[True]*45,True,True))
    reflected=[row[:] for row in source];reflected[22][0]=1-reflected[22][0]
    conditions.append(('reflect-point23',reflected,tags,[True]*45,True,True))
    changed_tags=tags[:];changed_tags[22]=1.3
    conditions.append(('retag-point23',source,changed_tags,[True]*45,True,True))
    for count in (5,15):
        for key_exclude in (False,True):
            for pool_exclude in (False,True):
                conditions.append((f'pad{count}-keys{int(key_exclude)}-pool{int(pool_exclude)}',source+[[.75,.75]]*count,tags+[0]*count,[True]*45+[False]*count,key_exclude,pool_exclude))
    expected[name]={key: independent_forward(model,points,times,valid,keys,pool) for key,points,times,valid,keys,pool in conditions}
(WORK/'independent-inference.json').write_text(json.dumps(expected),encoding='utf-8')
programs=[]
for file in sorted(WORK.glob('printed-*.py')):
    result=subprocess.run([sys.executable,'-B',str(file)],capture_output=True,text=True,encoding='utf-8',cwd=WORK)
    if result.returncode: raise RuntimeError(result.stderr)
    programs.append(dict(file=file.name,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),stdout=result.stdout.strip()))
if len(programs)!=3: raise RuntimeError('Expected all three complete printed programs.')
record=dict(date='2026-10-05',torch=torch.__version__,device='CPU float64',programs=programs,independent_inference_cases=sum(map(len,expected.values())),model_asset_sha256=hashlib.sha256((ASSET/'movement-runtime.json').read_bytes()).hexdigest(),lesson_sha256=hashlib.sha256((ROOT/'src/learn/data/topics/transformer-block-architecture.jsx').read_bytes()).hexdigest(),limits='No six-fit rerun, GPU test or browser certificate; unchanged historical scientific evidence is retained separately.')
(RECORD/'reading-flow-native-checks.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print(json.dumps(record,indent=2))
