// Read-only comparison of browser observations to preserved scientific records.
// Does not import a model, execute a learner program, or rewrite observations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const directory='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const output=process.argv[2];
assert.ok(output,'Pass a fresh receipt path');
assert.ok(!fs.existsSync(output),'Preserve earlier receipt');
const files={},checks=[];
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function read(p){files[p]=sha(p);return JSON.parse(fs.readFileSync(p));}
function equal(actual,expected,label){assert.deepEqual(actual,expected,label);checks.push(label);}
const sourcePath='public/learn-code/dapo/evidence/observations.json';
const source=read(sourcePath),runtime=read('public/learn-code/dapo/runtime-observations.json');
equal(runtime.sourceSha256,files[sourcePath],'exact original observation identity');
equal(runtime.runs.length,6,'all six prescribed runs');
function metrics(actual,original,label){
  if(original===null){equal(actual,null,`${label}: unavailable remains null`);return;}
  equal(actual.nll,original.response.nll,`${label}: pooled target NLL`);
  equal(actual.records,original.generation.rows.length,`${label}: complete evaluation count`);
  const count=rows=>rows.reduce((n,row)=>n+Number(row.gold===row.prediction),0);
  equal(actual.correct,count(original.generation.rows),`${label}: recomputed free generation count`);
  equal(actual.constrainedCorrect,count(original.constrained.rows),`${label}: recomputed constrained count`);
}
for(const run of runtime.runs){
  const label=`${run.arm}/${run.seed}`;
  const original=source.runs.find(row=>row.arm===run.arm&&row.seed===run.seed);
  assert.ok(original,label);
  for(const [key,value]of Object.entries(run)){
    if(['before','after','slots'].includes(key))continue;
    equal(value,original[key]??null,`${label}: preserved ${key}`);
  }
  metrics(run.before,original.before,`${label}/before`);
  metrics(run.after,original.after,`${label}/after`);
  const slots=original.slots??original.observed_slots;
  equal(run.slots.length,slots.length,`${label}: every observed slot`);
  for(const slot of run.slots){
    const old=slots.find(row=>row.slot===slot.slot),name=`${label}/slot${slot.slot}`;
    assert.ok(old,name);
    for(const key of ['slot','status','decisions','generated_tokens','selected_tokens'])equal(slot[key],old[key],`${name}: ${key}`);
    equal(slot.selected,old.selected.map(row=>row.uid),`${name}: ordered selected UIDs`);
    equal(slot.candidates.length,old.candidates.length,`${name}: all candidate batches`);
    slot.candidates.forEach((batch,b)=>{
      equal(batch.length,old.candidates[b].length,`${name}/batch${b}: all generated responses`);
      batch.forEach((row,i)=>{
        for(const [key,value]of Object.entries(row))equal(value,old.candidates[b][i][key]??null,`${name}/${row.uid}: ${key}`);
      });
    });
    equal(slot.updates.length,(old.updates??[]).length,`${name}: actual completed updates`);
    slot.updates.forEach((row,i)=>{
      for(const[key,value]of Object.entries(row))equal(value,old.updates[i][key]??null,`${name}/update${i}: ${key}`);
    });
    const rows=slot.candidates.flat();
    equal(rows.reduce((n,r)=>n+r.completion_ids.length,0),slot.generated_tokens,`${name}: emitted IDs account for generated work`);
    equal(rows.filter(r=>slot.selected.includes(r.uid)).reduce((n,r)=>n+r.completion_ids.length,0),slot.selected_tokens,`${name}: selected IDs account for retained work`);
  }
  equal(run.slots.reduce((n,s)=>n+s.updates.length,0),run.optimizer_updates,`${label}: completed updates conserve`);
  equal(run.slots.reduce((n,s)=>n+s.selected_tokens*s.updates.length,0),run.optimizer_token_positions,`${label}: optimizer positions conserve`);
}
metrics(runtime.native.before,source.native.before,'native/before');
metrics(runtime.native.after,source.native.after,'native/after');
for(const key of ['timing','parameter_change','configuration','rewards'])equal(runtime.native[key],source.native[key],`native: ${key}`);
equal(runtime.native.batches,source.native.native_batches,'native: complete batches');
equal(runtime.paper,source.paper_cumulative,'separate published cumulative outcomes');
equal(runtime.parity.length,8,'six constructed plus two actual cases');
runtime.parity.forEach((row,i)=>{
  const constructed=i<6,index=constructed?i+1:i-5;
  equal(row.kind,constructed?'constructed':'actual',`parity${i}: evidence class`);
  const original=constructed?source.native.constructed_parity.cases[i]:source.native.actual_parity[i-6];
  for(const[key,value]of Object.entries(original))equal(row[key],value,`parity${i}: ${key}`);
  const path=constructed?`public/learn-code/dapo/evidence/native/parity-input-${index}.json`:`scratch/dapo-research/study/native/actual/parity-input-${index}.json`;
  equal(row.inputs,read(path),`parity${i}: all saved input and detail arrays`);
  const details=row.inputs.manual_details;
  const selected=row.inputs.inputs.completion_mask.flat().reduce((s,x)=>s+x,0);
  equal(details.selected_counts.reduce((s,x)=>s+x,0),selected,`parity${i}: actual selected-mask count`);
  const reconstructed=details.terms.flat().reduce((s,x)=>s+x,0)/row.inputs.normalizer;
  assert.ok(Math.abs(reconstructed-row.scratch_loss)<1e-7,`parity${i}: saved term sum/normalizer`);
  checks.push(`parity${i}: saved term sum/normalizer`);
});
for(const[p,h]of Object.entries(files))equal(sha(p),h,`read-only guard: ${p}`);
files['scripts/review-dapo-runtime-evidence.mjs']=sha('scripts/review-dapo-runtime-evidence.mjs');
fs.writeFileSync(output,JSON.stringify({at:new Date().toISOString(),passed:true,count:checks.length,checks,files,boundary:'Independent read-only projection, complete case coverage, and arithmetic accounting. No scientific replay or native execution.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,count:checks.length,output}));
