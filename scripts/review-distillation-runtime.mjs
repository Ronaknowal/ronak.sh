import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/distillation-models.js';
const directory='docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(`${directory}/runtime-inputs.json`),'40bd50692bf0bb96b0f27fa675f7593591c89c4d217ccfc4cca473f4103a4c97');
const packet=JSON.parse(fs.readFileSync(`${directory}/runtime-inputs.json`));
for(const[p,h]of Object.entries(packet.files))assert.equal(sha(p),h,p);
let conditions=0;const near=(a,b,tol=1e-7)=>{assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);conditions++};
for(const T of [.25,.7,2,8])for(const scaled of [false,true])for(const kind of ['forward','reverse','jsd'])for(const beta of [.1,.5,.9]){
 const z=[-.9,.3,1.2,0],q=m.softmax([1,0,-2,2],T),p=m.softmax(z,T),g=m.gradient(q,p,kind,T,scaled,beta);
 const f=v=>(scaled?T*T:1)*m.loss(q,m.softmax(v,T),kind,beta);
 for(let i=0;i<z.length;i++){const a=[...z],b=[...z];a[i]-=1e-5;b[i]+=1e-5;near(g[i],(f(b)-f(a))/2e-5);}
 near(m.sum(g),0);
}
for(const shift of [-2,-.3,0,.8,2])for(const equal of [false,true]){
 const row=m.sequence(shift,equal),f=v=>m.sequence(v,equal).reverse;
 near((f(shift+1e-5)-f(shift-1e-5))/2e-5,row.full[0][0]);
 near(m.kl(row.pLeaf,row.qLeaf),m.kl(row.p[0],row.q[0])+row.future);
 near(m.sum(row.qLeaf),1);near(m.sum(row.pLeaf),1);
 if(equal)row.visitation.forEach(v=>near(v,0));
}
for(const T of [.25,1,8]){const a=m.softmax(m.teacherLogits,T),b=m.softmax(m.teacherLogits.map(x=>x+100),T);a.forEach((v,i)=>near(v,b[i]));}
const evidence=JSON.parse(fs.readFileSync('public/learn-assets/llm-distillation/observations.json'));
assert.equal(evidence.candidates.length,256);assert.equal(evidence.students.length,15);
for(const predicate of ['structural','final_correct','all_steps_correct'])assert.equal(evidence.candidates.filter(row=>row.check[predicate]).length,evidence.corpus[predicate]);
for(const ex of evidence.examples)for(const row of ex.log_probs)near(m.sum(row.map(Math.exp)),1,2e-6);
const writes=[],write=fs.writeFileSync;
fs.writeFileSync=(p,b)=>writes.push([String(p),Buffer.from(b)]);
try{await import('./render-distillation-lesson.mjs');}finally{fs.writeFileSync=write;}
for(const[p,b]of writes)assert.ok(b.equals(fs.readFileSync(p)),p);
assert.equal(writes.length,2);
fs.writeFileSync(`${directory}/runtime-root-checks.json`,JSON.stringify({passed:true,reviewer:'root',sourceGuards:Object.keys(packet.files).length,conditions,projectionWritesIntercepted:writes.length,modelRuns:0,scope:'Whole current renderer/component/model/CSS read and exact accepted projection. Independent finite derivatives, sequence chain rule, offset invariance and retained evidence reconstruction. Separate different paint review follows.',files:packet.files},null,2)+'\n');
console.log(JSON.stringify({passed:true,conditions,guards:Object.keys(packet.files).length}));
