"""Different-review probes; consume fixed science without refitting."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib
import itertools
import json
import math
import sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm'
CODE=ROOT/'public/learn-code/process-reward-models'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=FOLDER/'content-inputs.json'
assert sha(packet)=='6ddcd718881f1373898c6075cd16b671a8d68680a739adffcd666163237fff00'
bindings=json.loads(packet.read_text())['files']
for p,h in bindings.items():assert sha(ROOT/p)==h,p
sys.path.insert(0,str(CODE))
from prm_classifier import features,objective_gradient,load_splits
from prm_search import rank_pool,beam,uct
from prm_rollouts_rewards import policy_leaves,potential_shaping,binomial,pav_at_iterate
checks=[]
examples,matrices=load_splits(CODE/'data')
model=json.loads((CODE/'study/model.json').read_text())
result=json.loads((CODE/'study/results.json').read_text())
w,b=np.array(model['weights']),np.array(model['bias'])
for split,(x,y) in matrices.items():
    z=x@w+b
    p=np.exp(z-z.max(1,keepdims=True));p/=p.sum(1,keepdims=True)
    ce=-np.log(p[np.arange(len(y)),y]).mean()
    brier=np.square(p-np.eye(3)[y]).sum(1).mean()
    expected=result['checkpoints'][-1]['metrics'][split]
    np.testing.assert_allclose([ce,brier,(p.argmax(1)==y).mean()],
       [expected['cross_entropy'],expected['brier'],expected['accuracy']],atol=2e-12)
    assert sum(expected['class_counts'])==len(y)
checks.append('Reconstructed fixed final CE/Brier/accuracy on all3 splits by direct probability operations; no fit')
# Invariance risks that numerical classifier parity alone does not establish.
row=examples['test'][0]
for update in [{'class_id':99},{'problem_id':'leak'},{'source':{'record':999}}, {'answer':'SECRET'}]:
    np.testing.assert_array_equal(features({**row,**update}),features(row))
np.testing.assert_array_equal(features({**row,'current_step':'alpha 2 beta'}),features({**row,'current_step':'beta alpha 2'}))
assert np.count_nonzero(features({**row,'current_step':''})[:512])>0
assert np.count_nonzero(features({**row,'current_step':''})[512:])==0
checks.append('Metadata/answer exclusion, order-loss counterexample and empty-current prefix retention')
rng=np.random.default_rng(107);x=rng.normal(size=(5,1024));y=np.array([0,2,1,2,0]);w0=rng.normal(size=(1024,3))*.02;b0=np.array([.2,-.3,.1])
loss,dw,db=objective_gradient(x,y,w0,b0)
for index in [(0,0),(13,1),(511,2),(1023,0)]:
    plus=w0.copy();minus=w0.copy();plus[index]+=1e-6;minus[index]-=1e-6
    fd=(objective_gradient(x,y,plus,b0)[0]-objective_gradient(x,y,minus,b0)[0])/2e-6
    assert abs(fd-dw[index])<1e-8
checks.append('Four changed-input signed-feature objective finite differences')
for q,a,bv in itertools.product([.17,.61,.92],[.2,.8],[.3,.7]):
    exact=[q*(1-q)*(a-bv),q*a*(1-a),(1-q)*bv*(1-bv)]
    for baseline in [False,True]:np.testing.assert_allclose(policy_leaves(q,a,bv,baseline)['gradient'],exact,atol=1e-14)
for gamma in [0,.4,1]:
    phi=[.7,-.3,1.1,.2]
    shaped=potential_shaping(phi,gamma)
    assert abs(shaped['sum']-(-phi[0]+gamma**3*phi[-1]))<1e-14
for value,budget in itertools.product([0,.03,.8,1],[1,3,10]):
    row=binomial(value,budget)
    assert abs(sum(row['distribution'])-1)<1e-12
    assert abs(row['soft_variance']-value*(1-value)/budget)<1e-12
for q in [.13,.77]:
    row=pav_at_iterate(q,.9,.1,.8)
    assert abs(row['surrogate_gradient']-1.8*q*(1-q)*.8)<1e-14
checks.append('24 policy-gradient/baseline cases,3 telescopes,12 degenerate/ordinary binomials and2 frozen-advantage derivatives')
for width in [1,2,3]:
    for depth in [0,1,2,3,5]:
        row=beam(width,depth)
        assert row['generated_scored_nodes']==sum(len(layer['scored']) for layer in row['layers'])
        for layer in row['layers']:assert len(layer['kept'])<=width
for seed in range(7):
    row=uct(15,seed=seed)
    previous={};previous_returns={}
    for trace in row['traces']:
        for node,count in trace['visits_after'].items():
            assert count-previous.get(node,0)==int(node in trace['selection_path'])
            assert trace['return_sums_after'].get(node,0)-previous_returns.get(node,0)==trace['reward']*int(node in trace['selection_path'])
        previous=trace['visits_after'];previous_returns=trace['return_sums_after']
checks.append('15 beam depth/width cases and105 exact UCT ancestor-backup traces')
product=rank_pool(6,'product');logged=rank_pool(6,'log_product')
finding={'product_vote':product['weighted_vote'],'log_score_vote':logged['weighted_vote'],
         'product_weights':product['answer_weights'],'log_score_weights':logged['answer_weights'],
         'reason':'Monotone log transform preserves ranking, not sums of vote weights; exposed log_product route sums negative logs'}
assert product['weighted_vote']!=logged['weighted_vote']
for p,h in bindings.items():assert sha(ROOT/p)==h,p
with (FOLDER/'content-review-probes.json').open('x',encoding='utf-8') as stream:
    json.dump({'at':datetime.now(timezone.utc).isoformat(),'reviewer':'root','packet_sha256':sha(packet),
               'source_bindings_verified_before_after':len(bindings),'checks':checks,'finding':finding,
               'scientific_fits':0,'program_source':sha(Path(__file__))},stream,indent=2)
print(json.dumps({'checks':len(checks),'finding':finding}))
