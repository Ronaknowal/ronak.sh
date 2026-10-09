import fs from 'node:fs';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import * as m from '../src/learn/data/test-time-compute-models.js';
const b='docs/teaching/llm-architecture-training/test-time-compute-scaling',reference=JSON.parse(fs.readFileSync(`${b}/runtime-python-reference.json`));
const checks=[];const eq=(name,a,b)=>{assert.deepEqual(a,b,name);checks.push(name);};const near=(name,a,b)=>{assert.ok(Math.abs(a-b)<1e-11,name);checks.push(name);};
for(const r of reference.schedule){const v=m.schedule(r.workers);eq(`schedule${r.workers}`,v.jobs.map(j=>[j.worker,j.start,j.end]),r.value.rows.map(j=>[j.worker,j.start,j.end]));eq('makespan',v.makespan,r.value.makespan);}
for(const r of reference.plurality)m.plurality(r.p,r.n).forEach((v,i)=>near(`plurality${r.p}/${r.n}/${i}`,v,r.value[i]));
for(const r of reference.beam){const v=m.beam(r.width,r.depth,r.family);eq(`beam${r.width}/${r.depth}/${r.family}`,v.scored,r.value.layers.flatMap(l=>l.scored.map(n=>n.node)));eq('beam selection',v.selected,r.value.selected?.node??null);}
for(const r of reference.controller){const v=m.controller(r.cap,r.context);eq(`controller${r.cap}/${r.context}`,v.trace.map(t=>[t.phase,t.charged]),r.value.trace.map(t=>[t.phase,t.charged]));eq('controller work',v.used,r.value.thinking_and_injected_tokens);eq('controller stop',v.stop,r.value.thinking_stop);}
for(const r of reference.allocation){const v=m.allocation(r.budget,r.overhead).selected;eq(`allocation${r.budget}/${r.overhead}`,v?.choices??null,r.value?.choices??null);if(v)near('allocation gain',v.value/100,r.value.expected_correct);}
for(const r of reference.hybrid){const v=m.hybrid(r.breadth,r.depth);eq(`hybrid${r.breadth}/${r.depth}`,[v.calls,v.generated,v.promptWork,v.critical,v.prompts],[r.value.calls,r.value.generated_tokens,r.value.prompt_tokens_processed,r.value.critical_path_calls,r.value.per_chain_prefills]);}
for(const r of reference.exchange)near(`exchange${r.y}/${r.m}`,m.exchange(r.y,r.m).multiplier,r.value);
for(let n=1;n<=8;n++)for(const p of [0,.3,1])near(`opportunity${p}/${n}`,m.opportunity(p,n),1-(1-p)**n);
eq('default selector',m.select(m.pool),'11/2');eq('default flawed judge',m.select(m.pool,'best'),'15/2');eq('changed judge',m.select(m.pool.map(r=>r.id==='C'?{...r,score:.6}:r),'best'),'11/2');eq('empty selector',m.select([]),null);
near('absolute risk',m.risk('absolute').risks[1],2.8);eq('risk switch',m.risk('exact').selected,0);
const saved=JSON.parse(fs.readFileSync('public/learn-assets/test-time-compute/observations.json'));
for(const r of saved.detail)eq(`saved selection ${r.question_id}/${r.method}/${r.seed}`,m.select(r.candidates),r.answer);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(`${b}/runtime-model-checks.json`,JSON.stringify({passed:checks.length,checks,source:sha('src/learn/data/test-time-compute-models.js'),reference:sha(`${b}/runtime-python-reference.json`),scope:'Finite Python-to-browser and saved-output correspondence; no scientific replay.'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:checks.length}));
