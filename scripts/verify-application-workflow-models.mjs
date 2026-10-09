import assert from 'node:assert/strict';
import {retrieveEvidence,packEvidence} from '../src/learn/data/application-framework-models.js';
import {workflowRoute,replayEffect} from '../src/learn/data/agent-workflow-models.js';
let assertions=0;
const fixture=retrieveEvidence('file exception').filter(d=>d.score>0);
assert.deepEqual(fixture.map(d=>d.id),['with','close','finally']);
assert.deepEqual(fixture.map(d=>d.words.length),[22,23,23]);
for(const [i,value] of [1.4139587718739461,.990210257942779,.6931471805599453].entries())assert.ok(Math.abs(fixture[i].score-value)<1e-12);
assert.equal(retrieveEvidence('quantum banana')[0].score,0);assertions+=6;
for(const query of ['file exception','dictionary key','resource cleanup','quantum banana',''])for(let total=20;total<=140;total+=5)for(let instructions=0;instructions<=40;instructions+=10)for(let reserve=0;reserve<=60;reserve+=10){
 const r=packEvidence(query,total,instructions,reserve,3);
 assert.ok(r.used<=r.budget);assert.equal(r.used,r.candidates.filter(d=>d.admitted).reduce((s,d)=>s+d.words.length,0));
 if(!r.feasible)assert.equal(r.used,0);assertions+=2;
}
for(const approve of [true,false])for(let failures=0;failures<=3;failures++)for(let limit=1;limit<=4;limit++){
 const r=workflowRoute(approve,failures,limit);assert.equal(r.effects,approve&&limit>failures?1:0);assert.ok(r.attempts<=limit);assertions+=2;
}
for(const window of ['before-effect','after-effect','after-checkpoint'])for(let deliveries=1;deliveries<=4;deliveries++)for(const dedup of [true,false]){
 const r=replayEffect(window,deliveries,dedup);
 const expected=window==='before-effect'&&deliveries===1?0:window==='after-effect'&&deliveries>1&&!dedup?2:1;
 assert.equal(r.counter,expected);assert.equal(r.events.length,deliveries);assertions+=2;
}
console.log(JSON.stringify({assertions,passed:true}));
