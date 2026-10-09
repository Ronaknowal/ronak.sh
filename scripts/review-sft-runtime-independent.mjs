import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/sft-models.js';
const dir='docs/teaching/llm-architecture-training/supervised-fine-tuning-sft',pub='public/learn-code/supervised-fine-tuning';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++},near=(a,b,label)=>{assert.ok(Math.abs(a-b)<1e-10,label);checks++};
const manifest=read(`${dir}/runtime-inputs.json`);for(const [p,h]of Object.entries(manifest.bindings))eq(hash(p),h,p);
const d=read('src/learn/data/sft-runtime-data.json'),study=read(`${pub}/study-evaluation.json`),summary=read(`${pub}/study-summary.json`),reports=read(`${pub}/mechanism-reports.json`);
for(const [name,h]of Object.entries(d.source_hashes))eq(hash(`${pub}/${name}`),h,name);
eq(d.summary,summary,'Every summary value');
for(const [name,value]of Object.entries(reports))eq(d.reports[name],value.report,`Complete native report ${name}`);
eq(d.study.display_test_ids,Object.values(study.display_test_ids).flat(),'Six predeclared identities');
for(const model of d.study.models){const r=model.id==='base'?null:study.runs.find(r=>`${r.policy}-${r.seed}`===model.id),e=structuredClone(r?r.test:study.base);for(const kind of ['response','generation','constrained'])e[kind].rows=e[kind].rows.filter(row=>d.study.display_test_ids.includes(row.id));eq(model.evaluation,e,`Every selected prediction and complete metrics ${model.id}`);if(r){eq(model.history,r.history,`Every checkpoint ${model.id}`);eq(model.selected_step,r.selected_step,`Selection ${model.id}`)}}
for(const e of [study.base,...study.runs.map(r=>r.test)])for(const kind of ['generation','constrained']){const v=e[kind];eq(v.confusion.flat().reduce((a,b)=>a+b),104,`${kind} whole test denominator`);let correct=0;for(let i=0;i<v.gold_order.length;i++)correct+=v.confusion[i][v.prediction_order.indexOf(v.gold_order[i])];near(v.accuracy,correct/104,`${kind} accuracy from matrix`)}
// Coupled invariants complement the author's finite differences: packed records,
// repeated IDs, vocabulary permutations and softmax-invariant head perturbation.
for(const long of [false,true])for(const eos of [false,true]){
 const t=m.capstone(long,eos),parts=t.records.map(ids=>m.contextTrace({ids,labels:ids.map((id,j)=>j>=4&&(eos||id!==6)?id:-100),embedding:Array.from({length:7},(_,i)=>Array.from({length:7},(_,j)=>Number(i===j))),head:m.zeros(7,7)}));
 eq(t.count,parts.reduce((s,r)=>s+r.count,0),'Packing preserves owned target count');
 near(t.loss,parts.reduce((s,r)=>s+r.loss*r.count/t.count,0),'Packing preserves count-weighted loss');
 for(let a=0;a<7;a++)for(let b=0;b<7;b++)near(t.dhead[a][b],parts.reduce((s,r)=>s+r.dhead[a][b]*r.count/t.count,0),'Packing preserves full parameter gradient');
}
const f=d.context_fixture,t=m.contextTrace(f),perm=[3,0,6,2,5,1,4],inverse=perm.map((_,i)=>perm.indexOf(i));
const changed={ids:f.ids.map(i=>inverse[i]),labels:f.labels.map(i=>i<0?i:inverse[i]),embedding:perm.map(i=>f.embedding[i]),head:f.head.map(row=>perm.map(i=>row[i]))};
const p=m.contextTrace(changed);near(t.loss,p.loss,'Vocabulary identity permutation invariant');for(let i=0;i<7;i++)for(let j=0;j<3;j++)near(p.dembedding[inverse[i]][j],t.dembedding[i][j],'Embedding derivative follows identity');
const shifted=m.contextTrace({...f,head:f.head.map((row,d)=>row.map(v=>v+(d-1)*.7))});near(t.loss,shifted.loss,'Adding common vocabulary logit preserves objective');for(let i=0;i<7;i++)for(let j=0;j<3;j++)near(t.dembedding[i][j],shifted.dembedding[i][j],'Common logit derivative cancels');
for(let target=0;target<7;target++){const q=m.conditionalUpdate(target,0);q.before.forEach((row,j)=>row.forEach((v,i)=>near(v,q.after[j][i],'Zero-rate softmax null within rounding')));}
const files=['scripts/review-sft-runtime-independent.mjs',`${dir}/runtime-inputs.json`,'src/learn/data/sft-models.js','src/learn/data/sft-runtime-data.json'];
fs.mkdirSync(`${dir}/independent-runtime`,{recursive:true});fs.writeFileSync(`${dir}/independent-runtime/model-checks.json`,JSON.stringify({reviewer:'root',checks,fits:0,generations:0,scope:'Exact whole projections, target-weighted packed gradients, identity permutation and common-logit invariance; original author numerical receipts reused',bindings:Object.fromEntries(files.map(p=>[p,hash(p)]))},null,2)+'\n');console.log(`${checks} different runtime conditions; zero fits`);
