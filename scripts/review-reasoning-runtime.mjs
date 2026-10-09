import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/reasoning-models.js';
const folder='docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(`${folder}/${p}`));
assert.equal(sha(`${folder}/runtime-inputs.json`),'245118944bb51fc69598630a7202097099d1facb4d59c83352bb93d8cd3352a6');
const inputs=read('runtime-inputs.json').inputs;
for(const[p,h]of Object.entries(inputs))assert.equal(sha(p),h,p);
let conditions=0;
const eq=(a,b)=>{assert.deepEqual(a,b);conditions++;};
const near=(a,b)=>{assert.ok(Math.abs(a-b)<2e-8,`${a} != ${b}`);conditions++;};
for(const strict of [false,true])for(const offset of [-3,0,2]){
 const state=m.tree(offset,strict);near(m.total(state.paths.map(p=>p.probability)),1);
 for(let n=0;n<4;n++)for(let k=0;k<3;k++){
  const lo=structuredClone(state.logits),hi=structuredClone(state.logits);lo[n][k]-=1e-5;hi[n][k]+=1e-5;
  near(state.gradient[n][k],(m.treeFromLogits(hi,strict).value-m.treeFromLogits(lo,strict).value)/2e-5);
  for(const baseline of [-2,0,.53,3]){
   near(m.total(state.paths.map((p,i)=>p.probability*m.trajectoryScore(state,i,baseline).weighted[n][k])),state.gradient[n][k]);
  }
 }
}
near(m.tree().value,.53);near(m.tree(0,true).value,.4);
eq(m.checkTrace(2,3,3,'sum = 6; answer = 15').derivation,false);
eq(m.checkTrace(2,3,3,'sum = 6; answer = 15').reward,1);
eq(m.checkTrace(2,3,3,'sum = 5; answer = 15',false).reward,0);
eq(m.checkTrace(2,3,3,'answer = 15 garbage').format,false);
eq(m.group([1,1,1,1]).advantages,[0,0,0,0]);eq(m.group([1,0,1]).loo,[.5,-1,.5]);
near(m.clipped(1.4,-2).objective,-2.8);near(m.clipped(1.4,2).objective,2.4);
eq(m.nucleus([.55,.3,.15],1,.8).kept,[0,1]);near(m.nucleus([.55,.3,.15],1,.8).sampled[0],.55/.85);
eq(m.emitted([7,0,0,0],4,0).mask,[true,true,false,false]);eq(m.emitted([7,8,9,4],4,0).terminated,false);
for(let n=1;n<=16;n++)for(let c=0;c<=n;c++)for(let k=1;k<=n;k++)near(m.passAtK(n,c,k),1-m.choose(n-c,k)/m.choose(n,k));
eq(m.majority([null,2,1,1,2]),2);
const budget=m.budgetPrefix([{tokens:4},{tokens:7},{tokens:3}],8);
eq(budget,{completed:[{tokens:4}],used:8,partial:4,unfinished:true});
near(m.noSuccessUpper(16),1-Math.pow(.05,1/16));
eq(m.reportedSchedule(8199),{cap:32768,reference:8000});eq(m.reportedSchedule(8200),{cap:65536,reference:8000});
eq(m.observedSets([1,3],[2,3],4),{both:[3],base:[1],changed:[2],neither:[4]});
near(m.crossing(16).changed,(1-.2**16+1-.99**16)/2);
// Reconstruct the exact prepared projection while intercepting every write.
const writes=[],write=fs.writeFileSync;
fs.writeFileSync=(p,b)=>writes.push([String(p),Buffer.from(b)]);
try{await import('./render-rl-reasoning-lesson.mjs');}finally{fs.writeFileSync=write;}
eq(writes.length,2);
for(const[p,b]of writes){eq(b.equals(fs.readFileSync(p)),true);}
const succession=read('runtime-source-continuation.json');
for(const row of succession.sources){eq(sha(row.path),row.current_sha256);eq(sha(row.predecessor),row.old_sha256);}
const paint=read('root-review-paint/index.json');
for(const[p,h]of Object.entries(paint.sources))eq(sha(p),h);
const scroll=read('scroll-coverage/report.json');
eq(scroll.panes.length,52);
for(const pane of scroll.panes){
 eq(pane.positions[0],0);near(pane.positions.at(-1)+pane.width,pane.full);
 for(let i=1;i<pane.positions.length;i++){assert.ok(pane.positions[i]-pane.positions[i-1]<=pane.width);conditions++;}
}
const output={passed:true,reviewer:'root; different from runtime author',sourceGuards:Object.keys(inputs).length,conditions,scienceReplayed:false,
 renderer:'Byte-exact reconstruction with both writes intercepted; no frozen file rewritten.',
 paint:'Personally read all 40 root atlases (92 complete source captures,157 tiles), selected whole desktop/phone/default/changed/enlarged states and all14 solutions. Wide-region full coverage additionally retained in author source-bound packet.',
 files:{...inputs,[`${folder}/runtime-inputs.json`]:sha(`${folder}/runtime-inputs.json`),'scripts/review-reasoning-runtime.mjs':sha('scripts/review-reasoning-runtime.mjs')}};
write(`${folder}/runtime-root-checks.json`,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,conditions,sourceGuards:output.sourceGuards}));
