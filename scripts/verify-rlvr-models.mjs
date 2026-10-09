import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import * as M from '../src/learn/data/rlvr-models.js';
const doc='docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const read=file=>JSON.parse(fs.readFileSync(`public/learn-assets/rlvr/${file}`,'utf8'));
const checks=[];
function equal(label,actual,expected,tolerance=1e-9){
  if(Array.isArray(actual) && Array.isArray(expected)) {
    assert.equal(actual.length,expected.length,label);
    actual.forEach((value,i)=>equal(`${label}/${i}`,value,expected[i],tolerance));
  }
  else if(typeof actual==='number' && Number.isFinite(actual)) assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} != ${expected}`);
  else assert.deepEqual(actual,expected,label);
  checks.push({label,passed:true});
}
const mechanisms=read('mechanisms.json');
for(const original of mechanisms.groups.finite_curriculum){
  const current=M.finiteScheduler(original.strategy,mechanisms.finiteUniformTape);
  equal(`Scheduler default counts ${original.strategy}`,current.task_counts,original.task_counts);
  original.history.forEach((row,i)=>{
    equal(`Scheduler original outcomes ${original.strategy}/${i}`,current.history[i].outcomes,row.outcomes);
    for(const key of ['theta_before','theta_after','same_group_logit_gradient'])equal(`Scheduler exact fixture ${original.strategy}/${i}/${key}`,current.history[i][key],row[key]);
  });
}
for(const row of mechanisms.verifier.numeric){
  const result=M.verdict(row.prediction,row.gold);
  equal(`Exact recorded numeric verdict ${row.name}`,result.accepted,row.accepted);
  equal(`Exact recorded numeric object ${row.name}`,result.parsed,row.parsed);
}
equal('Unicode suffix addresses',M.extractNumber('🙂 #### 72').span,[7,9]);
equal('Empty suffix noninverted',M.extractNumber('####   ').span,[7,7]);
equal('Unicode boxed addresses',M.extractNumber('🙂 \\boxed{72}',true).span,[9,11]);
equal('Proof reconstructs goal',M.proofCase().accepted,true);
equal('Proof different proposition',M.proofCase('left').accepted,false);
equal('Missing binder fails',M.proofCase('scope').derived,null);
for(const [source,valid] of [['x',false],['x+y',true],['x-y',false],['x*y',false],['call()',false]]) equal(`Counterexample ${source}`,M.checkExpression(source,true).accepted,valid);
for(const p of [0,.1,.25,.5,.9,1])for(const size of [2,3,4,5]){
  const events=M.samplingEvents(p,size);
  equal(`Events partition ${p}/${size}`,events.failure+events.success+events.mixed,1);
  const enumeration=M.enumerateBaselines(p,size);
  equal(`Probability normalization ${p}/${size}`,enumeration.rows.reduce((s,r)=>s+r.probability,0),1);
  equal(`Same-group derivative ${p}/${size}`,enumeration.moments.same.mean,(1-1/size)*p*(1-p));
  equal(`LOO derivative ${p}/${size}`,enumeration.moments.loo.mean,p*(1-p));
}
for(const p of [.1,.3,.6,.8])for(const q of [.2,.5,.7]){
  const r=M.klRoutes(p,q),h=1e-5,logit=Math.log(p/(1-p)),sigmoid=x=>1/(1+Math.exp(-x));
  equal(`Finite KL value ${p}/${q}`,r.sampledValue,r.value);
  equal(`Exact KL derivative ${p}/${q}`,r.exactDerivative,(M.klRoutes(sigmoid(logit+h),q).value-M.klRoutes(sigmoid(logit-h),q).value)/(2*h),1e-8);
  equal(`Detached k3 derivative ${p}/${q}`,r.partialDerivative,p-q);
}
equal('Response reduction',M.tokenReduction([2,6],[1,3]).response,2);
equal('Pooled reduction',M.tokenReduction([2,6],[1,3]).pooled,2.5);
equal('Empty reduction unknown',M.tokenReduction([0,0],[1,3]).pooled,null);
equal('Declared pass at4',M.passAtK(8,2,4),11/14);
equal('Changed pass at3',M.passAtK(10,3,3),17/24);
equal('Out of range k unknown',M.passAtK(8,2,9),null);
equal('Vote tie unknown',M.answerVote(['1','1','2','2',null]).plurality,null);
equal('Positive affine exact coefficients',M.correctedRewards([1,0,1,0],.1,.2).transformed.advantages,[1,-1,1,-1]);
equal('Nonpositive affine unavailable',M.correctedRewards([1,0],.5,.5).corrected,null);
equal('No coefficients when unavailable',M.groupStatistics([null,null]).advantages,[0,0]);
const records=read('records.json'),index=new Map([...records.train,...records.test].map(r=>[r.id,r]));
let training=0,evaluation=0,updates=0,generated=0;
for(const run of read('study-index.json').runs){
  const address=`${run.seed}-${run.arm}`,train=read(`train-${address}.json`),evals=read(`eval-${address}.json`);
  equal(`Warm identical ${address}`,train.start_sha256,read('study-index.json').warm_runs.find(w=>w.seed===run.seed).warm_sha256);
  equal(`All rollouts ${address}`,train.steps.length,48);
  equal(`All fixed checkpoints ${address}`,evals.map(e=>e.step),[0,16,32,48]);
  for(const step of train.steps){
    updates+=step.update.updates;
    for(const sample of step.samples){
      training++;generated+=sample.length;
      equal(`Runtime byte prefix ${address}/${step.step}/${sample.sample}/${sample.record_id}`,M.byteIds(index.get(sample.record_id).question).length>0,true);
      equal(`EOS length ${address}/${step.step}/${sample.sample}/${sample.record_id}`,sample.response_ids.length,sample.length);
      equal(`Target score count ${address}/${step.step}/${sample.sample}/${sample.record_id}`,sample.generated_logps.length,sample.length);
      equal(`Numeric value replay ${address}/${step.step}/${sample.sample}/${sample.record_id}`,M.verdict(sample.response,index.get(sample.record_id).gold).accepted,sample.verdict.accepted);
    }
  }
  for(const e of evals){equal(`All heldout IDs ${address}/${e.step}`,e.records.map(r=>r.record_id),records.test.map(r=>r.id));for(const r of e.records){equal(`All fresh samples ${address}/${e.step}/${r.record_id}`,r.samples.length,8);evaluation+=r.samples.length;}}
}
equal('Every retained training response',training,3456);equal('Every retained evaluation response',evaluation,3456);equal('Actual update count',updates,670);equal('Generated position ledger',generated,28537);
const native=read('native.json');
equal('Original failure preserved',native.continuation.original_native_status,'failed');equal('Update equality not relabelled',native.continuation.original_update_equality_passed,false);equal('Continuation no optimizer',native.continuation.continuation_optimizer_updates,0);
const core=fs.readFileSync('src/learn/components/lesson-labs/RLVRCoreFigures.jsx','utf8'),study=fs.readFileSync('src/learn/components/lesson-labs/RLVRStudyFigures.jsx','utf8');
const names=[...core.matchAll(/export function (\w+)\(/g),...study.matchAll(/export function (\w+)\(/g)].map(m=>m[1]);equal('Every drawing export',names.length,39);
const bundled=await build({stdin:{contents:`import React from 'react';import {renderToString} from 'react-dom/server';import * as core from './src/learn/components/lesson-labs/RLVRCoreFigures.jsx';import * as study from './src/learn/components/lesson-labs/RLVRStudyFigures.jsx';import lesson from './${doc}/lesson.jsx';const figures={...core,...study};export const html=${JSON.stringify(names)}.map(name=>renderToString(React.createElement(figures[name])));export const lessonHtml=renderToString(React.createElement(lesson.content));`,resolveDir:process.cwd(),loader:'jsx'},write:false,bundle:true,format:'cjs',platform:'node',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom/server']});
const require=createRequire(import.meta.url),module={exports:{}},warnings=[],original=console.error;
console.error=(...args)=>warnings.push(args.join(' '));
try{new Function('require','module','exports',bundled.outputFiles[0].text)(require,module,module.exports);}finally{console.error=original;}
equal('No React warnings',warnings,[]);
module.exports.html.forEach((html,i)=>equal(`Rendered ${names[i]}`,html.includes(`D${String(i+1).padStart(2,'0')}`),true));
equal('Complete lesson renders all drawings',(module.exports.lessonHtml.match(/data-rlvr-figure=/g)||[]).length,39);
const sourceFiles=['src/learn/data/rlvr-models.js','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/rlvr-flow.css',`${doc}/lesson.jsx`,`${doc}/lesson.md`,`${doc}/runtime-data-projection.json`];
const receipt={passed:true,at:new Date().toISOString(),checks:checks.length,conditions:checks,inference:0,fits:0,sourceFiles:sourceFiles.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))};
fs.writeFileSync(`${doc}/runtime-model-checks.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,fits:0,inference:0}));
