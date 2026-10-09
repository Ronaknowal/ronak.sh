import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import {mass, terminalLaw, costModel, sample, firstRejection} from '../src/learn/data/speculative-decoding-models.js';
const base='docs/teaching/llm-architecture-training/speculative-decoding';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=JSON.parse(fs.readFileSync(`${base}/runtime-inputs.json`));
assert.equal(sha(`${base}/runtime-inputs.json`),'91a79c9943789f2b27eb88dceefdfd8761dd0085687f5084e7a5b8c4f3805f80');
for(const row of packet.files) assert.equal(sha(row.path),row.sha256,row.path);
const checks=[];
const close=(actual,expected,why)=>{assert.ok(Math.abs(actual-expected)<2e-12,`${why}: ${actual} != ${expected}`);checks.push({why,actual,expected});};
// Independent direct target path products, including immediate EOS and each horizon leaf.
const direct=[];
function expand(ids,probability){
 if(ids.at(-1)===2||ids.length===3){direct.push({ids,probability});return;}
 const row=ids.length===0?[.5,.3,.2]:ids.at(-1)===0?[.2,.5,.3]:[.4,.1,.5];
 row.forEach((p,id)=>expand([...ids,id],probability*p));
}
expand([],1);
for(const k of [0,1,2]){
 const observed=terminalLaw(k);
 assert.equal(observed.length,15);
 for(const expected of direct)close(observed.find(r=>String(r.ids)===String(expected.ids)).probability,expected.probability,`K${k} path ${expected.ids}`);
}
// A changed case and permutation expose accidental positional/token coupling.
for(const order of [[0,1,2],[2,0,1],[1,2,0]]){
 const p=order.map(i=>[.4,.1,.5][i]),q=order.map(i=>[.2,.5,.3][i]),r=mass(p,q);
 close(r.overlap,.6,'changed overlap');
 order.forEach((id,i)=>{close(r.repair[i],[.5,0,.5][id],'permuted residual');close(r.final[i],p[i],'permuted recovery');});
}
assert.equal(sample([1,0,0],1-Number.EPSILON),0);
assert.equal(sample([0,0,1],0),2);
assert.equal(firstRejection(.4).rejectedAt,1);
assert.equal(firstRejection(.39).rejectedAt,-1);
close(costModel(.6,3,2,4/3).speedup,21.76/21,'cost in milliseconds');
close(costModel(1,0,0,0).emitted,1,'zero proposals still emits target');
const observations=JSON.parse(fs.readFileSync('public/learn-assets/speculative-decoding/observations.json'));
const measured=observations.stages.study.records;
assert.equal(measured.length,96);
assert.equal(measured.filter(r=>r.lookahead>0).length,72);
for(const r of measured){
 assert.equal(r.ids.length,24);
 close(r.ns_per_emitted_token,r.elapsed_ns/24,'time-unit identity');
 if(r.lookahead){const b=measured.find(x=>x.lookahead===0&&x.prompt_id===r.prompt_id&&x.mode===r.mode&&x.repetition===r.repetition);assert.ok(r.elapsed_ns>b.elapsed_ns);if(r.mode==='greedy')assert.deepEqual(r.ids,b.ids);}
}
const renderer=JSON.parse(fs.readFileSync(`${base}/renderer-receipt.json`));
assert.equal(sha(`${base}/lesson.md`),renderer.manuscript);
assert.equal(sha(`${base}/lesson.jsx`),renderer.generated);
parse(fs.readFileSync(`${base}/lesson.jsx`,'utf8'),{sourceType:'module',plugins:['jsx']});
const result={reviewer:'/root',author:'/root/alignment_author',inputSha256:sha(`${base}/runtime-inputs.json`),guarded:packet.files.length,checks,additionalAssertions:'15 leaves each K; support endpoints; strict first rejection; all96 original records/72 losses/36 greedy pairs; renderer hashes and JSX parse',scientificExecution:'none; retained native records read only; new finite JavaScript complementary checks'};
fs.writeFileSync(`${base}/runtime-review-root-checks.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({guarded:packet.files.length,independentChecks:checks.length,passed:true}));
