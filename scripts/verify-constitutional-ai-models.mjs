import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/constitutional-ai-models.js';
const owner='docs/teaching/llm-architecture-training/constitutional-ai-cai';
const checks=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
const near=(name,a,b,tolerance=1e-10)=>check(name,Math.abs(a-b)<=tolerance);
const equal=(name,a,b)=>{assert.deepEqual(a,b,name);checks.push(name);};
const native=JSON.parse(fs.readFileSync('public/learn/examples/constitutional-ai/program_outputs.json','utf8'));
near('native conditional choice',m.conditionalChoice([Math.log(.3),Math.log(.1),Math.log(.6)]).q,native['preference_labels.py'].conditional_choice);
near('native pair BCE',m.preferenceStep(1,0,.75,.2).loss,.5632616875182228);
near('native pair derivative',m.preferenceStep(1,0,.75,.2).gradient,-.018941421369995104);
equal('actual supplied IDs',m.targetFixture().tokens.map(x=>x.id),[1,3,4,5,6,2,0,0]);
equal('actual same-position labels',m.targetFixture().labels,[-100,-100,-100,5,6,2,-100,-100]);
equal('manual shifted targets',m.targetFixture().targets.map(x=>[x.logit,x.target]),[[2,5],[3,6],[4,2]]);
check('ignored targets absent',m.targetFixture(3,2,false,true).count===0);
for (let promptCount = 1; promptCount <= 6; promptCount++) {
  const namesToIds = new Map();
  const idsToNames = new Map();
  for (const token of m.targetFixture(promptCount).tokens) {
    if (idsToNames.has(token.id)) equal('one ID retains the same named token', idsToNames.get(token.id), token.token);
    if (namesToIds.has(token.token)) equal('one named token retains the same ID', namesToIds.get(token.token), token.id);
    idsToNames.set(token.id, token.token); namesToIds.set(token.token, token.id);
  }
}
equal('additional prompt IDs avoid answer IDs', m.targetFixture(5).tokens.map(x=>x.id), [1,3,4,7,8,5,6,2,0,0]);
near('order mapping .8/.4',m.mappedOrders(.8,.4).mean,.7);
check('missing pass stays unknown',m.mappedOrders(.8,null).mean===null);
equal('label transformation native',[m.transformedLabel(.9,'soft'),m.transformedLabel(.9,'hard'),m.transformedLabel(.9,'clamped')],[.9,1,.6]);
near('hard tie stays tie',m.transformedLabel(.5,'hard'),.5);
const expected=[.44654274360623275,.14884758120207758,.4046096751916897];
m.policyOptimum([.6,.2,.2],[0,0,1],1).policy.forEach((x,i)=>near(`native KL optimum${i}`,x,expected[i]));
equal('supported zero reference stays zero',m.policyOptimum([.6,.4,0],[0,0,100],1).policy,[.6,.4,0]);
equal('beta zero maximum supported tie',m.policyOptimum([.6,.2,.2],[0,1,1],0).policy,[0,.5,.5]);
near('native DPO step R3',m.dpoStep([Math.log(.6),Math.log(.2),Math.log(.2)],[.6,.2,.2],2,0,.5,.2).next[2],.2143281966476588);
check('identical DPO pair exact zero derivatives',m.dpoStep([0,1,2],[.6,.2,.2],1,1,.5,.2).gradients.every(x=>x===0));
const baseRows=[{q:.1,label:0},{q:.2,label:1},{q:.6,label:1},{q:.8,label:1}];
near('native Brier',m.calibration(baseRows,4).brier,.2125);
check('empty calibration unknown',m.calibration([],4).bins.every(x=>x.mean===null&&x.observed===null));
near('native independent majority',m.errorStructure(.2,false).majority,.104);
near('native shared error',m.errorStructure(.2,true).majority,.2);
near('native GAC unequal support',m.consensus([18,4],[20,20]).gac,.18);
near('native GAC broad support',m.consensus([13,13],[20,20]).gac,.4225);
check('missing GAC unknown',m.consensus([18,4],[20,20],true).gac===null);
near('benign denominator',m.coverage([[6,4,0],[8,1,1]]).overRefusal,.4);
near('private denominator',m.coverage([[6,4,0],[8,1,1]]).disclosure,.1);
check('empty benign unknown',m.coverage([[0,0,0],[8,1,1]]).overRefusal===null);
const work=m.workLedger(10,2,10,2,1,80,40,false);
equal('manuscript call and sequence counts',[work.generation,work.judge,work.allTargets,work.finalTargets,work.pairs],[50,20,20,10,10]);
near('context history adds token work',m.workLedger(10,2,10,2,1,80,40,true).tokens-work.tokens,1600);
check('all-zero work counts',m.workLedger(0,2,0,2,1,80,40,true).tokens===0);
check('zero rounds no revised targets',m.workLedger(10,0,10,2,1,80,40,false).allTargets===0);
for(let state=0;state<24;state++){
  const logits=[Math.sin(state),Math.cos(state),state*.04],ref=[.6,.2,.2],beta=.1+state*.03,chosen=state%3,rejected=(state+1)%3;
  const dpo=m.dpoStep(logits,ref,chosen,rejected,beta,.2);
  for(let i=0;i<3;i++){
    const high=[...logits],low=[...logits];high[i]+=1e-6;low[i]-=1e-6;
    const difference=(m.dpoStep(high,ref,chosen,rejected,beta,0).loss-m.dpoStep(low,ref,chosen,rejected,beta,0).loss)/2e-6;
    near(`changed DPO state${state} gradient${i}`,dpo.gradients[i],difference,2e-8);
  }
  const delta=state/4-3,q=(state%10)/10;
  near(`changed BCE derivative${state}`,m.sigmoid(delta)-q,(m.softLoss(delta+1e-6,q)-m.softLoss(delta-1e-6,q))/2e-6,2e-8);
  near(`error masses sum${state}`,m.errorStructure(state/24,false).outcomes.reduce((s,x)=>s+x.mass,0),1);
}
for(const invalid of [()=>m.transformedLabel(.8,'clamped',.9,.1),()=>m.policyOptimum([0,0,0],[0,0,1],1),()=>m.headPair([1],[0],[1,2]),()=>m.calibration([],0),()=>m.targetFixture(2.5),()=>m.coverage([[1,-1,0],[0,0,0]]),()=>m.consensus([3,4],[2,4]),()=>m.dpoStep([1,2],[.5,.5],4,0,.5,.2)]){
  assert.throws(invalid);checks.push('invalid mathematical state rejected');
}
const bindings=['src/learn/data/constitutional-ai-models.js','src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx','src/learn/components/lesson-labs/constitutional-ai-flow.css',`${owner}/manuscript.jsx`,'public/learn/examples/constitutional-ai/program_outputs.json','scripts/verify-constitutional-ai-models.mjs'];
const receipt={status:'passed',checks:checks.length,conditions:checks,scope:'Native fixture reuse plus changed-state finite differences; no refit or browser acceptance',files:bindings.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),bytes:fs.statSync(path).size}))};
const output=process.env.CAI_MODEL_OUTPUT || `${owner}/model-checks.json`;
if(fs.existsSync(output))throw Error('Use a new receipt path; existing evidence is retained.');
fs.writeFileSync(output,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({status:receipt.status,checks:receipt.checks,output}));
