import assert from 'node:assert/strict';
import {cachePages,scheduleRequests} from '../src/learn/data/serving-framework-models.js';
let assertions=0;
for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)for(const block of [2,4,8])for(let prefix=0;prefix<=12;prefix++){
 const r=cachePages(a,b,block,prefix),unique=new Set(r.maps.flat());
 assert.equal(r.physical,unique.size);assert.equal(r.capacity-r.slack,r.useful);
 assert.ok(r.slack>=0 && r.slack<2*block); assertions+=3;
}
for(let prompt=1;prompt<=10;prompt++)for(let arrival=0;arrival<=4;arrival++)for(let budget=1;budget<=8;budget++)for(const policy of [true,false]){
 const result=scheduleRequests(prompt,arrival,budget,policy);
 assert.ok(result.events.every(e=>e.used<=budget));assert.equal(Object.keys(result.completed).length,3);
 for(const [name,length,outputs,start] of [['A',prompt,3,0],['B',2,2,arrival],['C',1,2,2]]){
  const actions=result.events.map(e=>e.actions[name]).filter(Boolean);
  assert.equal(actions.filter(v=>v.startsWith('P')).reduce((s,v)=>s+Number(v.slice(1)),0),length);
  assert.equal(actions.filter(v=>v==='D1').length,outputs-1);assert.ok(result.completed[name].first>start);assertions+=3;
 } assertions+=2;
}
assert.equal(scheduleRequests().completed.B.ttft,1);assert.equal(scheduleRequests(6,1,4,false).completed.B.ttft,4);assertions+=2;
console.log(JSON.stringify({assertions,passed:true}));
