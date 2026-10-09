"""Author checks before generation/fits; no learned model output is sampled."""
from pathlib import Path
import hashlib
import itertools
import json
import math
import sys
import subprocess
import numpy as np
import torch
from transformers import TemperatureLogitsWarper, TopPLogitsWarper

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
CODE = ROOT / 'public/learn-code/synthetic-data'
sys.path.insert(0, str(CODE))
from synthetic_sampling import distribution, inverse_cdf, trace_sequence
from synthetic_verification import arithmetic, check_candidate, selection
from synthetic_corpus import read_sources, select_candidates, WindowPool, normalize
from synthetic_student import grouped_score, state_hash, inspector
from synthetic_recursive import trajectory, expected_h
from tiny_causal_lm import TinyLM

torch.set_num_threads(2)
checks = []
for logits, temperature, mass in itertools.product([[2.3,.8,-.4,-2.1],[9.,3.,2.,-4.]], [.3,.8,1.,3.], [.05,.4,.85,1.]):
    z=torch.tensor([logits], dtype=torch.float64)
    ids=torch.zeros((1,1),dtype=torch.long)
    native=TopPLogitsWarper(mass)(ids,TemperatureLogitsWarper(temperature)(ids,z)).softmax(-1).numpy()[0]
    ours=distribution(logits,temperature,mass)['nucleus']
    np.testing.assert_allclose(ours,native,atol=1e-14)
checks.append('64 strict-gap temperature/nucleus native comparisons')
np.testing.assert_allclose(distribution(np.log([.55,.25,.15,.05]),top_p=.8)['nucleus'],[.6875,.3125,0,0],atol=1e-14)
assert distribution([0,0,0],top_p=.2)['kept'].tolist()==[0]
assert np.isfinite(distribution([1e308,-1e308],1e-200)['nucleus']).all()
for u,expected in [(0,1),(.2,2),(.999999,2)]:assert inverse_cdf([0,.2,.8,0],u)==expected
assert trace_sequence([.8,.8])['termination']=='EOS'
checks.append('Crossing-token, ties, extreme finite logits, zero masses and exact inverseCDF boundary')
assert arithmetic('(2 + 3) * 4')==20 and arithmetic('1/3 + 2/3')==1
assert check_candidate('(2+3)*4','20',['2+3=6','6*4=20'])=={'final_correct':True,'steps_valid':[False,False],'all_equalities_valid':False}
for invalid in ['__import__("os")','3**4','[1]','1/0','True','1.5']:
    assert not check_candidate('1',invalid,[])['final_correct']
assert abs(selection()['precision']-54/62)<1e-14 and selection(0,0,0)['precision'] is None
checks.append('Exact grammar, malformed/non-grammar rejection and final-answer versus equality distinction')
sources=read_sources()
train=[r for r in sources['records'] if r['split']=='train']; heldout=[r for r in sources['records'] if r['split']=='heldout']
assert (len(train),len(heldout),len(sources['excluded']))==(17,4,3)
pool=WindowPool(train)
assert pool.total==sum(len(r['text'].encode())-32 for r in train)
for index in range(pool.total):
    record,start=pool.locate(index)
    assert start+33<=len(pool.arrays[record])
    np.testing.assert_array_equal(pool.sample((index+.5)/pool.total),pool.arrays[record][start:start+33])
fixture=[{'id':'x','source_id':train[0]['id'],'text':'A rewritten paragraph that is long enough to form byte windows.'},
         {'id':'copy','source_id':train[0]['id'],'text':train[0]['text']},
         {'id':'dupe','source_id':train[1]['id'],'text':'A rewritten paragraph that is long enough to form byte windows.'},
         {'id':'short','source_id':train[0]['id'],'text':'No.'}]
assert [r['id'] for r in select_candidates(fixture,sources['records'])['kept']]==['x']
checks.append(f'All {pool.total} within-record windows and deterministic source/candidate exclusion cases')
torch.manual_seed(17); model=TinyLM(256,context=32)
scored=grouped_score(model,heldout)
assert scored['targets']==sum(len(r['text'].encode())-1 for r in heldout)
assert len(inspector(model,heldout))==16
for row in inspector(model,heldout):assert abs(sum(row['probabilities'])-1)<2e-7
# Same paired windows, full loss/backward/update null, without a scientific fit.
other=TinyLM(256,context=32);other.load_state_dict(model.state_dict())
windows=torch.tensor(np.stack([pool.sample(u) for u in [.1,.4,.7,.9]]))
for candidate in [model,other]:
    optimizer=torch.optim.AdamW(candidate.parameters(),lr=.003,weight_decay=.01)
    logits=candidate(windows[:,:-1]); loss=torch.nn.functional.cross_entropy(logits.reshape(-1,256),windows[:,1:].reshape(-1))
    loss.backward();torch.nn.utils.clip_grad_norm_(candidate.parameters(),1.);optimizer.step()
assert state_hash(model)==state_hash(other)
checks.append('Random-weight grouped scoring/16 full distributions and one paired raw-copy update equality; not a campaign fit')
for rule in ['replace','anchor','accumulate','fresh']:
    for seed in range(20):
        rows=trajectory(rule,seed=seed)
        for row in rows:
            q=np.array(row['distribution']);assert abs(q.sum()-1)<1e-12 and (q>=0).all()
            if rule=='anchor':assert (q>=.5*np.array([.6,.3,.1])-1e-12).all()
        if rule=='replace':
            for a,b in zip(rows,rows[1:]):
                assert all(y==0 for x,y in zip(a['distribution'],b['distribution']) if x==0)
assert abs(expected_h('replace',10,1)[-1]-.486)<1e-14
assert abs(expected_h('accumulate',10,1)[-1]-.5265)<1e-14
checks.append('80 recursive paths: conservation, anchored floor, absorbing replacement zeros and exact H checkpoints')
outputs={}
for name in ['sampling','verification','corpus','recursive','library']:
    run=subprocess.run([sys.executable,'-B','-X','utf8',str(CODE/f'synthetic_{name}.py')],capture_output=True,text=True,encoding='utf-8',check=True)
    outputs[name]=json.loads(run.stdout)
files={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in CODE.iterdir() if p.is_file()}
with (FOLDER/'programs-preflight.json').open('x',encoding='utf-8') as stream:
    json.dump({'checks':checks,'outputs':outputs,'bindings':files,'scope':'No FLAN generation and no 300-step study; one random paired update for the sampler contract'},stream,indent=2,ensure_ascii=False)
print(json.dumps({'passed':True,'groups':len(checks),'windows':pool.total,'heldout_targets':scored['targets']}))
