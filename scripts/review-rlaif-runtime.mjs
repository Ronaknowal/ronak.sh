import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/rlaif-methods-models.js';
const directory='docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(`${directory}/runtime-inputs.json`),'bcb341b21d504858419fdc03ed061e82554664011419f918ae9af883ed57851e');
const packet=JSON.parse(fs.readFileSync(`${directory}/runtime-inputs.json`));
for(const[p,h]of Object.entries(packet.inputs))assert.equal(sha(p),typeof h==='string'?h:h.sha256,p);
let checks=0;
const near=(a,b,t=1e-7)=>{assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);checks++;};
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
// Complementary full-softmax finite differences include the KL contribution.
for(const p of [.13,.43,.86])for(const beta of [0,.2,1.3])for(const ref of [[.2,.8],[.7,.3]]) {
 const z=[Math.log(p),Math.log(1-p)],rewards=[-1,2.7];
 const objective=v=>{const q=1/(1+Math.exp(v[1]-v[0]));return q*rewards[0]+(1-q)*rewards[1]-beta*(q*Math.log(q/ref[0])+(1-q)*Math.log((1-q)/ref[1]));};
 const actual=m.policyVectors(p,rewards,.7,false,ref,beta);
 for(let j=0;j<2;j++){const lo=[...z],hi=[...z];lo[j]-=1e-5;hi[j]+=1e-5;near(actual.total[j],(objective(hi)-objective(lo))/2e-5);}
 near(actual.total[0]+actual.total[1],0);
}
for(const p of [.001,.02,.3,.8,.999])near(m.log1mexp(Math.log(p)),Math.log(1-p));
for(const t of [-.7,.2,.8])for(const x of [-2,1,3])for(const lambda of [0,.3,1]){
 const loss=v=>Math.log1p(Math.exp(-v))+lambda*Math.log1p(Math.exp(-v*(1-x)));
 near(m.sharedWeight(t,1,x,lambda).total,(loss(t+1e-5)-loss(t-1e-5))/2e-5);
}
for(const tau of [.2,.7,1.4])for(const w of [1,3,9])for(const l of [0,2,5]){
 const o=m.contradictory(w,l,tau);near(m.contradictory(w,l,tau,o.optimum).loss,o.minimum);
}
for(const ref of [[0,.2,.3,.5],[.4,0,.6,0]])for(const transform of ['identity','logit']){
 const a=m.tilt(m.publishedMatrix,[.4,.3,.2,.1],ref,.3,transform);
 const b=m.tilt(m.publishedMatrix,[.4,.3,.2,.1],ref,.3,transform,120);
 a.policy.forEach((v,i)=>{near(v,b.policy[i]);if(!ref[i])eq(v,0);});near(m.sum(a.policy),1);
}
for(const mass of [.1,.4,.9]){const s=m.supportFamily(mass);near(s.policy[0]/s.policy[1],Math.E);near(m.sum(s.policy),1);near(s.loss,0);}
const writes=[],write=fs.writeFileSync;
fs.writeFileSync=(p,b)=>writes.push([String(p),Buffer.from(b)]);
try{await import('./render-rlaif-lesson.mjs');}finally{fs.writeFileSync=write;}
for(const[p,b]of writes)eq(b.equals(fs.readFileSync(p)),true);
assert.ok(writes.some(([p])=>p.endsWith('lesson.jsx')));
const report={passed:true,reviewer:'root',source_guards:Object.keys(packet.inputs).length,complementary_conditions:checks,projection_writes_intercepted:writes.length,scientific_fits:0,neural_inference:0,scope:'Whole component/model/CSS read; exact accepted-manuscript projection and complementary numerical identities. Paint and browser review recorded separately.'};
fs.writeFileSync(`${directory}/runtime-root-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
