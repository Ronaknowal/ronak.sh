import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Store,Radix,hashChain,namespace,requests,eligible,work,admission,trace,costs,route,radixFixture,parseIds,color} from '../src/learn/data/prefix-caching-models.js';
const topic='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const data=JSON.parse(fs.readFileSync('public/learn-assets/prefix-caching-prompt-caching/observations.json','utf8'));
const checks=[];const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks.push(label);};
const state=s=>({free:s.free,inactive_lru:s.inactive_lru,evictions:s.evictions,requests:s.requests,pages:s.pages.map(p=>({id:p.id,generation:p.generation,tokens:p.tokens,owners:p.owners,complete:p.complete,reserved:p.reserved}))});
for(const [name,run] of Object.entries(data.finite.prefix_workload.traces)){
  const s=new Store(run.capacity,run.page_size);let i=run.events.findIndex(e=>e.event==='admit');
  for(const row of run.rows){eq(state(s.snapshot()),state(row.before),`${name} ${row.request} before`);const plan=s.admit(row.request,row.ids);for(const key of ['matched','allocated','evicted','reused_rows','new_query_rows'])eq(plan[key],row[key],`${name} ${row.request} ${key}`);eq(state(s.snapshot()),state(run.events[i++].state),`${name} admitted`);s.complete(row.request);eq(state(s.snapshot()),state(run.events[i++].state),`${name} complete`);s.release(row.request);eq(state(s.snapshot()),state(run.events[i++].state),`${name} released`);eq(s.invariant(),true,`${name} invariant`);}
  eq(state(s.snapshot()),state(run.final),`${name} final`);
}
for(let l=1;l<=30;l++)for(let p=0;p<=l;p++){const cells=[];for(let q=0;q<l;q++)for(let k=0;k<=q;k++)cells.push([q,k]);const got=work(l,p);eq(got.remaining,cells.filter(([q])=>q>=p).length,`pairs ${l}/${p}`);eq(got.rectangle,cells.filter(([q,k])=>q>=p&&k<p).length,`rectangle ${l}/${p}`);}
for(let l=0;l<=20;l++)eq(eligible(l),4*Math.floor(Math.max(0,l-1)/4),`final query ${l}`);
eq(admission(4,true).unchanged,true,'atomic denied admission');eq(admission(4,false).plan.accepted,true,'inactive reclaim succeeds');eq(trace(['A','C','B'],3).reused,8,'pressure rows');eq(trace(['A','C','B'],4).reused,12,'reordered rows');
const normalize=nodes=>nodes.map(n=>({node:n.id,parent:n.parent,edge:n.edge,pins:n.pins,touched:n.last,children:n.children}));
const r=new Radix();r.pin('A',[1,2,3,4,5]);eq(normalize(r.snapshot()),data.finite.radix_prefix.before,'radix initial pin');r.insert([1,2,3,9]);r.insert([1,2,8]);eq(normalize(r.snapshot()),data.finite.radix_prefix.split,'radix inherited split counters');r.evict();r.evict();eq(normalize(r.snapshot()),data.finite.radix_prefix.protected,'radix protected ancestors');r.unpin('A');while(r.evict());eq(normalize(r.snapshot()),data.finite.radix_prefix.after_unpin,'radix release and eviction');
eq(radixFixture([1,2,8],true,1,true).removed,[null],'all-pinned refusal');const duplicate=new Radix();duplicate.insert([1,2,3]);duplicate.insert([1,2,3]);eq(duplicate.nodes().length,2,'duplicate node count');duplicate.insert([]);eq(duplicate.nodes().length,2,'empty input');assert.throws(()=>parseIds('1,no'));checks.push('malformed input rejected');
const sha=await hashChain(requests.A,4,{...namespace,model:'fixed'});eq(sha.map(x=>x.digest),data.finite.prefix_workload.traces.warm.rows[1].before.pages.filter(p=>p.complete).map(p=>p.digest),'native browser/Python SHA byte contract');const collisionA=await hashChain([1,3,5,7],2,namespace,true),collisionB=await hashChain([8,6,5,7],2,namespace,true);eq(collisionA[1].digest,collisionB[1].digest,'forced hash collision');assert.notEqual(collisionA[1].exact,collisionB[1].exact);checks.push('full-prefix collision rejection');
for(let storage=0;storage<=300;storage+=5){const c=costs(1,storage),before=c.tieOrBetter-1;eq(costs(c.tieOrBetter,storage).cached<=costs(c.tieOrBetter,storage).normal,true,'tie threshold '+storage);if(before>=0)eq(costs(before,storage).cached>costs(before,storage).normal,true,'before tie '+storage);eq(costs(c.strict,storage).cached<costs(c.strict,storage).normal,true,'strict threshold '+storage);}
eq([route(0).choice,route(8).choice,route(20).choice],['warm','tie','cold'],'routing three boundaries');eq(new Set(Array.from({length:25},(_,i)=>color(i+1))).size,25,'illustrative distinct token colours');
const inputs=['src/learn/data/prefix-caching-models.js','public/learn-assets/prefix-caching-prompt-caching/observations.json','scripts/verify-prefix-caching-models.mjs'];
const output=`${topic}/runtime-model-checks-${Date.now()}.json`;
fs.writeFileSync(output,JSON.stringify({scope:'Finite JavaScript and conserved JSON comparisons only; no model or original study execution',checks,inputs:Object.fromEntries(inputs.map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,output}));
