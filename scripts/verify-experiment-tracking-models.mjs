import assert from 'node:assert/strict';
import { trainingHistory, classifyMetricEvent } from '../src/learn/data/experiment-tracking-models.js';
const full = trainingHistory(4, .1, 1);
assert.equal(full[0].loss,5.5);
assert.ok(Math.abs(full[1].loss - 3.2175)<1e-12);
assert.equal(full[1].weight,.5); assert.equal(full[1].bias,.1); assert.equal(full[1].examples,4);
assert.equal(trainingHistory(3,.1,2).at(-1).examples,4);
assert.equal(trainingHistory(3,.1,3).at(-1).examples,7);
for(const batch of [1,2,3,4]) for(const rate of [0,.07,.2]) {
  const rows=trainingHistory(batch,rate,30);
  assert.ok(rows.every(row=>Number.isFinite(row.loss) && row.loss>=0));
  if(rate===0) assert.ok(rows.every(row=>row.loss===5.5));
}
const original=[{name:'train/loss',step:0,value:5.5}];
assert.equal(classifyMetricEvent(original,{...original[0]}).status,'identical retry');
assert.equal(classifyMetricEvent(original,{...original[0],value:4}).status,'conflict');
assert.equal(classifyMetricEvent(original,{...original[0],step:1}).events.length,2);
assert.equal(classifyMetricEvent(original,{...original[0],name:'validation/loss'}).events.length,2);
assert.deepEqual(original,[{name:'train/loss',step:0,value:5.5}]);
console.log('Tracking: independently worked first update, partial-batch exposure, zero-rate boundaries and retry/conflict immutability passed.');
