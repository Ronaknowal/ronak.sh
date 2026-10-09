import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/moe-training-models.js';
const folder='docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ready=JSON.parse(fs.readFileSync(`${folder}/runtime-author-ready.json`));
const checks=[];const close=(a,b,t=1e-8)=>{assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);};
for(const [p,h] of Object.entries(ready.contentBindings))assert.equal(sha(p),h,p);
checks.push('All52 frozen content identities conserved');
const fixture={logits:[1.1,-.8,.3,2.4],returns:[[2,-3,.6],[-4,1,2],[.3,.8,-2],[1.2,-.6,3]],upstream:[-.3,2,1.1],accepted:[true,true,false,true]};
let derivatives=0;
for(const convention of ['selected','full','sigmoid'])for(const k of [1,2,3,4]){
 const args={...fixture,k,convention};const t=m.mixtureTrace(args),eps=1e-5;
 for(let i=0;i<4;i++){
  const plus=[...fixture.logits],minus=[...fixture.logits];plus[i]+=eps;minus[i]-=eps;
  close(t.logitGradient[i],(m.mixtureTrace({...args,logits:plus}).objective-m.mixtureTrace({...args,logits:minus}).objective)/(2*eps));derivatives++;
 }
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){
  const plus=fixture.returns.map(r=>[...r]),minus=fixture.returns.map(r=>[...r]);plus[i][j]+=eps;minus[i][j]-=eps;
  close(t.returnGradient[i][j],(m.mixtureTrace({...args,returns:plus}).objective-m.mixtureTrace({...args,returns:minus}).objective)/(2*eps));derivatives++;
 }
}
checks.push(`${derivatives} changed-upstream, four-expert, dropped-branch derivatives across three conventions and four k values`);
let cases=0;for(const t of [1,8,32,128,512])for(const e of [4,8,16])for(const k of [1,2,4])for(const f of [.5,1,1.5]){
 const r=m.binomialLoad(t,e,k,f);close(m.sum(r.pmf),1,2e-11);close(m.sum(r.pmf.map((p,i)=>i*p)),r.mean,1e-8);close(m.sum(r.pmf.map((p,i)=>(i-r.mean)**2*p)),r.variance,1e-7);assert.ok(r.tail>=0&&r.tail<=1+2e-11);cases++;
}checks.push(`${cases} finite binomial distributions: mass, first/second moments and bounded tail`);
for(const changed of [false,true])for(const owners of [[0,0,1,1],[1,0,1,1],[1,1,0,0]])for(const local of [false,true]){
 const r=m.systemsTrace(owners,changed,4,local),baseline=m.systemsTrace([0,0,1,1],changed);
 assert.deepEqual(r.output,baseline.output);assert.deepEqual(r.inputGradient,baseline.inputGradient);assert.equal(m.sum(r.rankRows),8);
 if(local){assert.equal(r.bytes,0);assert.deepEqual(r.owners,[0,0,0,0]);}
}checks.push('Twelve placement/changed-request/local combinations preserve exactly addressed arithmetic');
for(const speed of [0,.01,.08]){
 const r=m.biasReplay(speed);for(let i=0;i<r.history.length;i++){const row=r.history[i];if(i)assert.deepEqual(row.bias,r.history[i-1].nextBias);for(const routed of row.routes)close(m.sum(routed.gates),1);}
}checks.push('Bias changes affect only subsequent routes; every selected denominator excludes the bias');
const logits=[[1,.2,-.7,2.4],[1.5,-.3,.2,.8],[.2,1.6,-.7,.9]];
for(const k of [1,2,3]){
 const r=m.balance(logits.map(m.softmax),k);for(let t=0;t<3;t++)for(let e=0;e<4;e++){
  const a=logits.map(r=>[...r]),b=logits.map(r=>[...r]),eps=1e-5;a[t][e]+=eps;b[t][e]-=eps;
  close(r.gradient[t][e],(m.balance(a.map(m.softmax),k).loss-m.balance(b.map(m.softmax),k).loss)/(2*eps));
 }
}checks.push('36 strict-gap auxiliary derivatives at changed group size and k');
fs.writeFileSync(`${folder}/runtime-root-probes.json`,JSON.stringify({reviewer:'root',status:'passed',ready:sha(`${folder}/runtime-author-ready.json`),model:sha('src/learn/data/moe-training-models.js'),checks,scope:'Complementary runtime scalar checks; no scientific fit or historical check replay'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(checks));
