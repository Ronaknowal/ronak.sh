"""Execute every displayed Python excerpt, with explicit context for the fragment."""
from pathlib import Path
import os, json, hashlib
import numpy as np
import torch
ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong'
snippets = json.loads((ROOT/'scratch/attention-reading-flow/inline-code.json').read_text())
checks = []
def record(name): checks.append({'name':name,'passed':True})
ns = {}; exec(compile(snippets[0], 'attention-core-excerpt', 'exec'), ns)
np.testing.assert_allclose(ns['context'], [1.240451338, .579487515], atol=2e-8)
with np.testing.assert_raises(ValueError): ns['attention_read'](np.zeros(2), ns['keys'], ns['values'], np.zeros(3,dtype=bool))
record('Displayed stable masked NumPy read and all-masked guard')
os.chdir(ROOT/'public/learn-code/attention-mechanism-bahdanau-luong')
ns = {}; exec(compile(snippets[1], 'saved-native-excerpt', 'exec'), ns)
assert ns['result']['prediction']=='lactated' and ns['result']['ended_with_eos']
record('Displayed saved additive PyTorch inference emits lactated and EOS')
os.chdir(ROOT)
for temperature in (1.,2.):
 ns={'torch':torch,'temperature':temperature,'scores':torch.tensor([0.,np.log(3.)],dtype=torch.float64),'valid':torch.tensor([True,True]),'memory':torch.tensor([2.,10.],dtype=torch.float64)}
 exec(compile(snippets[2], 'temperature-fragment', 'exec'),ns)
 expected=(2+10*3**(1/temperature))/(1+3**(1/temperature))
 torch.testing.assert_close(ns['context'], torch.tensor(expected,dtype=torch.float64))
record('Displayed temperature fragment at 1 and 2 with declared scores/valid/memory fixture')
ns['temperature']=0
try: exec(snippets[2],ns); raise AssertionError('accepted zero temperature')
except ValueError: pass
record('Displayed temperature fragment rejects zero')
ns={};exec(compile(snippets[3], 'monotonic-excerpt','exec'),ns)
np.testing.assert_allclose(ns['first'],[.5,.25,.125]);np.testing.assert_allclose(ns['second'],[.25,.25,.1875]);assert ns['missing']==.125 and ns['missing_next']==.3125
for p,prev in [([np.nan,.5],[1.,0.]),([.5,.5],[-.1,.5]),([.5,.5],[1.,1.])]:
 with np.testing.assert_raises(ValueError): ns['expected_monotonic'](p,prev)
record('Displayed monotonic two-step recurrence and probability-domain guards')
ns={};exec(compile(snippets[4], 'native-sdpa-excerpt','exec'),ns)
for key in ['query','keys','values']:ns[key]=ns[key].clone().requires_grad_()
ns['allowed'][...,2]=False
actual=ns['F'].scaled_dot_product_attention(ns['query'],ns['keys'],ns['values'],attn_mask=ns['allowed'],dropout_p=0.,scale=1.)
manual=(ns['query']@ns['keys'].transpose(-2,-1)).masked_fill(~ns['allowed'],-torch.inf).softmax(-1)@ns['values']
torch.testing.assert_close(actual,manual)
a=torch.autograd.grad(actual.square().sum(),[ns[k] for k in ['query','keys','values']],retain_graph=True)
b=torch.autograd.grad(manual.square().sum(),[ns[k] for k in ['query','keys','values']])
for x,y in zip(a,b):torch.testing.assert_close(x,y)
assert a[1][...,2,:].abs().sum()==0 and a[2][...,2,:].abs().sum()==0
record('Displayed SDPA unscaled all-valid and masked forward/input-gradient parity; excluded-key/value null')
files=['src/learn/data/topics/attention.jsx','scripts/verify-recurrent-attention-flow-excerpts.py']
report={'passed':True,'checks':checks,'torch':torch.__version__,'numpy':np.__version__,'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in files},'limits':'Displayed five excerpts executed with specified context; no new fitting or browser claim.'}
(FOLDER/'reading-flow-excerpts.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'groups':len(checks)}))
