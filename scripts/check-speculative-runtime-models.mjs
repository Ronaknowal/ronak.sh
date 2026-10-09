import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as m from '../src/learn/data/speculative-decoding-models.js';
const folder='docs/teaching/llm-architecture-training/speculative-decoding';
const evidenceFile='public/learn-assets/speculative-decoding/observations.json';
const evidence=JSON.parse(fs.readFileSync(evidenceFile));
const checks=[];
const close=(name,actual,expected,tolerance=1e-12)=>{assert.ok(Math.abs(actual-expected)<=tolerance,`${name}: ${actual} != ${expected}`);checks.push({name,actual,expected,tolerance});};
for(const [name,{p,q}] of Object.entries(m.policies)){
 const r=m.mass(p,q);
 p.forEach((v,i)=>close(`${name} token ${i} recovery`,r.final[i],v));
 close(`${name} total variation`,r.rejected,p.reduce((s,v,i)=>s+Math.abs(v-q[i]),0)/2);
 close(`${name} acceptance + rejection`,r.overlap+r.rejected,1);
 if(r.repair)close(`${name} residual norm`,r.repair.reduce((a,b)=>a+b,0),1);
}
assert.throws(()=>m.mass([0,0,0],[0,0,0]));checks.push({name:'Invalid all-zero law refused',passed:true});
for(const row of [[0,1,0],[.2,.8,0],[0,.2,.8],[.16384036919468925,.8361596308053106,0]])for(const u of [0,.199999999999,.2,.5,1-Number.EPSILON/2]){
 assert.ok(row[m.sample(row,u)]>0);checks.push({name:'Categorical support',row,u,selected:m.sample(row,u)});
}
for(const k of [0,1,2,3])for(const record of evidence.stages.finite.sequence_law.horizon3){
 const row=m.terminalLaw(k).find(r=>r.ids.join()===record.ids.join());
 const [numerator,denominator=1]=record.mass.split('/').map(Number);
 close(`K ${k} exact retained terminal ${record.ids}`,row.probability,numerator/denominator);
}
for(const h of [1,2,3,4])for(const k of [0,1,2,3]){
 const actual=m.terminalLaw(k,h),baseline=m.terminalLaw(null,h);
 close(`H ${h} K ${k} total`,actual.reduce((s,r)=>s+r.probability,0),1);
 actual.forEach((r,i)=>close(`H ${h} K ${k} path ${r.ids}`,r.probability,baseline[i].probability));
}
for(const k of [0,1,2]){
 const contributions=[];m.roundLaw([],3,k,contributions);
 for(const selected of m.terminalLaw()){
  const total=contributions.filter(r=>r.ids.every((id,i)=>selected.ids[i]===id)).reduce((s,r)=>s+r.probability*selected.ids.slice(r.ids.length).reduce((v,id,i)=>v*m.conditional(selected.ids.slice(0,r.ids.length+i))[id],1),0);
  close(`D12 event decomposition K ${k} ${selected.ids}`,total,selected.probability);
 }
}
for(const u of [.399999,.4,.400001,0,.99]){
 const r=m.firstRejection(u);assert.equal(r.rejectedAt,u<.4?-1:1);checks.push({name:'Strict rejection boundary',u,rejectedAt:r.rejectedAt});
}
for(const remaining of [1,2,3,4])for(const mode of ['bonus','acceptedEos','repairEos']){
 const r=m.stopRound(mode,remaining);assert.ok(r.emitted.length<=remaining);assert.ok(r.emitted.length>0);
 if(mode!=='bonus'&&remaining>1)assert.equal(r.emitted.at(-1),2);
 checks.push({name:'Budget/EOS output boundary',remaining,mode,...r});
}
for(const alpha of [0,.3,.6,.7,1])for(const k of [0,1,2,3,4,8]){
 const r=m.lengthModel(alpha,k);close(`tail identity ${alpha}/${k}`,r.emitted,alpha===1?k+1:(1-alpha**(k+1))/(1-alpha));
}
close('Changed practice tail expectation',m.lengthModel(.6,3).emitted,2.176);
const after=m.processed([6,3,1],1,2);close('Filtered A',after[0],2/3);close('Filtered C',after[2],0);close('Filtered residual A',m.mass(after,[.2,.3,.5]).repair[0],14/15);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['src/learn/data/speculative-decoding-models.js',evidenceFile];
const report={passed:true,checks,inputs:files.map(path=>({path,sha256:hash(path)})),scope:'Finite browser-model tests, including retained exact-fraction sequence outputs and conditional event decomposition. No model calls, scientific programs or measured workload replay.'};
fs.writeFileSync(`${folder}/runtime-model-checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length}));
