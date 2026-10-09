import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {tokenShares,powerShares,quotas,pacing,orderPath,sampleRecords,updateWeights,dot,responseValue} from '../src/learn/data/curriculum-mixing-models.js';
const close=(a,b,tolerance=1e-12)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const checks=[];
assert.deepEqual(tokenShares([.5,.5],[2,8]),[.2,.8]);
assert.deepEqual(tokenShares([.8,.2],[2,8]),[.5,.5]);
checks.push('Record-to-target fixture and inverse-length allocation');
const q=powerShares([80,15,5],.5);
q.forEach((v,i)=>close(v,[.5941725804420223,.25728427444747204,.14854314511050556][i],1e-10));
assert.deepEqual(quotas(q,100),[59,26,15]);
assert.deepEqual(powerShares([80,15,0],0),[.5,.5,0]);
for(let b=0;b<=200;b+=10)assert.equal(quotas(q,b).reduce((a,b)=>a+b),b);
checks.push('Power rule, zero support and exact integer-budget conservation');
assert.deepEqual(orderPath([1,-1],.5),[0,.5,-.25]);
assert.deepEqual(orderPath([-1,1],.5),[0,-.5,.25]);
assert.deepEqual(orderPath([1,-1],0),[0,0,0]);
assert.deepEqual(pacing([1,2,3,4],1),[.25,.25,.25,.25]);
checks.push('Order dependence, no-update null and full-support pacing');
const once=sampleRecords('once',12),wrap=sampleRecords('wrap',12),stop=sampleRecords('first_exhausted',12);
assert.equal(once.records.length,6);assert.equal(new Set(once.records.map(r=>r.id)).size,6);
assert.deepEqual(once.targets,[4,32]);assert.equal(wrap.records.length,12);assert.equal(stop.records.length,4);
checks.push('Displayed stream policies, identities, cursors and actual target denominators');
updateWeights([.5,.5],[Math.log(2),0],1,.1).forEach((v,i)=>close(v,[.65,.35][i]));
updateWeights([.75,.25],[0,0],1,0).forEach((v,i)=>close(v,[.75,.25][i]));
close(dot([-1,1],[1,1]),0);close(dot([1,0],[1,1]),1);
checks.push('Smoothed exponentiated update, equal-signal null and gradient alignment');
const original='docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies/research/byte-mixture-study.json';
const runtime='src/learn/data/curriculum-mixing-recorded-study.json';
assert.ok(fs.readFileSync(original).equals(fs.readFileSync(runtime)));
const study=JSON.parse(fs.readFileSync(runtime));
for(let d=0;d<3;d++){
 const model=study.fit.models[d], held=study.response_observations.mixtures.filter((_,i)=>!study.fit.fit_mask[i]);
 held.forEach((r,i)=>close(responseValue(r,model.library_parameters),model.held_predictions[i]));
}
for(const summary of study.summary){
 const values=study.main_runs.filter(r=>r.arm===summary.arm).map(r=>r.test_macro_nll);
 close(values.reduce((a,b)=>a+b)/values.length,summary.mean);close(Math.min(...values),summary.min);close(Math.max(...values),summary.max);
}
checks.push('Exact measured-data copy, all held-out response predictions and all seed summaries');
const files=['src/learn/data/curriculum-mixing-models.js',runtime,'src/learn/components/lesson-labs/CurriculumMixingFlow.jsx','src/learn/components/lesson-labs/curriculum-mixing-flow.css'];
const sources=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.writeFileSync('docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies/runtime-checks.json',JSON.stringify({checks,sources,limits:'Author mechanism tests and original scientific data identity. No repeated training and no paint acceptance.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:checks.length}));
