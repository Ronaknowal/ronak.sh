"""Current JS arithmetic versus independent formulas and actual narrow Torch probes.

Imports new program modules without executing mains; no old fit/writer/receipt.
"""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import numpy as np
import torch

ROOT=Path(__file__).resolve().parents[1]
OWNER=ROOT/'docs/teaching/deep-learning-beginner/neural-training-diagnostics-reproducible-experiments'
ASSET=ROOT/'public/learn-assets/neural-training-diagnostics-reproducible-experiments'
DEST=OWNER/'reading-flow-runtime-math-checkpoint.json'
assert not DEST.exists(), 'Preserve prior receipt; write a successor'
spec=importlib.util.spec_from_file_location('diagnostic_runtime_bridge',ASSET/'diagnostic-library-bridge.py')
bridge=importlib.util.module_from_spec(spec);sys.modules[spec.name]=bridge;spec.loader.exec_module(bridge)
torch.set_num_threads(1)
scalar=[dict(rows=rows,weight=w,rate=rate) for rows,w,rate in [([(1,2),(2,0),(3,1)],0,.1),([(-1.137,2.791),(.025,-.717),(3.331,1.019),(-4.04,.2)],-.413,.0173),([(1,1),(2,2)],1,.1),([(1,2)],0,0),([(1,2)],0,1e-14),([(0,1),(0,-3)],2,.413)]]
mode=[dict(values=values,mean=mean,variance=var,training=train,graph=graph,module=module) for values,mean,var in [([1,3],0,1),([-1.137,2.791],-.413,.0173),([2,2],2,0),([-10,10],-5,38.81)] for train in [True,False] for graph in [True,False] for module in ['batchnorm','linear']]
pairs=[dict(rows=rows,direction=direction) for rows in [[(.7,.6),(.8,.85),(.9,.85)],[(.413,.413)],[(.0102,.0101),(99.21,99.7)],[(.1,.07),(.1,.11),(.1,.15)]] for direction in ['smaller','larger']]
restart=[dict(target=target,weight=w,rate=rate,momentum=mu,save=save,steps=steps) for target,w,rate,mu,save,steps in [(3,1,.1,.5,1,1),(4,2,.25,.75,1,1),(2.791,-.413,.0173,.733,5,5),(3,1,0,.5,3,2),(3,1,.1,0,5,4)]]
group=[dict(rows=case['rows'],weight=case['weight'],rate=case['rate'],cursor=cursor) for case in scalar[:2] for cursor in range(len(case['rows'])+1)]
variance=[dict(common=common,count=count) for common,count in [(.4,3),(.4,100),(.01379,37),(0,1),(1,100)]]
fixture=dict(scalar=scalar,mode=mode,pairs=pairs,restart=restart,group=group,variance=variance)
process=subprocess.run(['node','scripts/diagnostics-runtime-oracles.mjs'],input=json.dumps(fixture),text=True,capture_output=True,cwd=ROOT,check=True)
actual=json.loads(process.stdout);checks=[]
def close(name,value,expected):
    a,b=np.asarray(value,dtype=np.float64),np.asarray(expected,dtype=np.float64)
    error=float(np.max(np.abs(a-b))) if a.size else 0
    assert np.allclose(a,b,atol=1e-12,rtol=1e-12),(name,a,b)
    checks.append(dict(name=name,max_absolute_error=error))
def same(name,value,expected):
    assert value==expected,(name,value,expected)
    checks.append(dict(name=name,exact=True))
for i,(c,r) in enumerate(zip(scalar,actual['scalar'])):
    xx=math.fsum(x*x for x,y in c['rows']);xy=math.fsum(x*y for x,y in c['rows']);yy=math.fsum(y*y for x,y in c['rows']);n=len(c['rows']);w=c['weight'];g=(w*xx-xy)/n
    close(f'scalar{i}/expanded loss',r['loss'],(w*w*xx-2*w*xy+yy)/(2*n));close(f'scalar{i}/expanded gradient',r['gradient'],g)
    library=bridge.scalar_probe(c['rows'],w,c['rate']);close(f'scalar{i}/Torch after',r['after'],library['after']);close(f'scalar{i}/Torch gradient',r['gradient'],library['gradient']);same(f'scalar{i}/represented distinction',r['distinguishes'],r['after']!=w)
    same(f'scalar{i}/curvaturezero optimum',r['optimum'] is None,xx==0)
for i,(c,r) in enumerate(zip(mode,actual['mode'])):
    library=bridge.mode_probe(c['values'],c['mean'],c['variance'],c['training'],c['graph'],c['module'])
    close(f'mode{i}/Torch output',r['output'],library['output'])
    if c['module']=='batchnorm':
        close(f'mode{i}/Torch returned mean',r['nextMean'],library['next_mean']);close(f'mode{i}/Torch returned variance',r['nextVariance'],library['next_variance'])
    else:
        same(f'mode{i}/linear mean stays',r['nextMean'],c['mean']);same(f'mode{i}/linear variance stays',r['nextVariance'],c['variance'])
    same(f'mode{i}/graph',r['graph'],library['graph_recorded'])
for i,(c,r) in enumerate(zip(pairs,actual['pairs'])):
    d=[b-a for a,b in c['rows']];mean=math.fsum(d)/len(d);close(f'pairs{i}/mean',r['mean'],mean)
    if len(d)==1:same(f'pairs{i}/one pair undefined',r['sd'],None)
    else:close(f'pairs{i}/sample SD',r['sd'],math.sqrt(math.fsum((v-mean)**2 for v in d)/(len(d)-1)))
    same(f'pairs{i}/exact ties',r['ties'],sum(v==0 for v in d))
for i,(c,r) in enumerate(zip(restart,actual['restart'])):
    w,v=c['weight'],0
    for step in range(c['save']):v=c['momentum']*v+w-c['target'];w-=c['rate']*v
    close(f'restart{i}/savedweight',r['saved']['weight'],w);close(f'restart{i}/savedvelocity',r['saved']['velocity'],v)
    for branch,velocity in [('full',v),('reset',0)]:
        weight=w
        for j,row in enumerate(r[branch]):
            gradient=weight-c['target'];velocity=c['momentum']*velocity+gradient;weight-=c['rate']*velocity
            close(f'restart{i}/{branch}/{j}/gradient',row['gradient'],gradient);close(f'restart{i}/{branch}/{j}/velocity',row['nextVelocity'],velocity);close(f'restart{i}/{branch}/{j}/weight',row['nextWeight'],weight)
for i,(c,r) in enumerate(zip(group,actual['group'])):
    contributions=[(c['weight']*x-y)*x for x,y in c['rows']];prefix=math.fsum(contributions[:c['cursor']]);suffix=math.fsum(contributions[c['cursor']:]);n=len(contributions)
    for policy,total in zip(r['policies'],[prefix+suffix,suffix,2*prefix+suffix]):close(f'group{i}/{policy["policy"]}/mean',policy['gradient'],total/n);close(f'group{i}/{policy["policy"]}/nextweight',policy['after'],c['weight']-c['rate']*total/n)
for i,(c,r) in enumerate(zip(variance,actual['variance'])):close(f'variance{i}',r,c['common']+.6/c['count'])
paths=['src/learn/data/diagnostics-reading-models.js','scripts/diagnostics-runtime-oracles.mjs','scripts/verify-diagnostics-reading-flow-runtime-math.py',str((ASSET/'diagnostic-measurements.py').relative_to(ROOT)),str((ASSET/'diagnostic-library-bridge.py').relative_to(ROOT))]
sha=lambda p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
receipt=dict(status='PASS',scope='Current pure JS arithmetic versus independent expansion/statistics/recurrences and narrow actual Torch; not historical fits or browser closure',environment=dict(python=sys.version.split()[0],torch=torch.__version__,numpy=np.__version__),sources={p.replace('\\','/'):sha(p) for p in paths},fixtures=fixture,assertions=checks)
DEST.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8');print(json.dumps(dict(status='PASS',assertions=len(checks),max_error=max(c.get('max_absolute_error',0) for c in checks),receipt_sha256=hashlib.sha256(DEST.read_bytes()).hexdigest())))
