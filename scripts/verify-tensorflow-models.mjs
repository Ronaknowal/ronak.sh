import assert from 'node:assert/strict';
import { tapeBranches, aggregateBatchMeans } from '../src/learn/data/tensorflow-models.js';
assert.deepEqual(tapeBranches(2, false), {branchValue:4,loss:8,firstGradient:4,secondGradient:4,gradient:8});
assert.equal(tapeBranches(2,true).gradient,4);
assert.equal(tapeBranches(-3,false).gradient,-12);
assert.equal(tapeBranches(0,true).gradient,0);
assert.deepEqual(aggregateBatchMeans(2,2,1,8),{total:12,count:3,mean:4,batchMean:5});
for(const a of [1,3,8]) for(const b of [1,4,8]) for(const x of [0,2.25,10]) for(const y of [0,6.75,10]) {
  const individual=[...Array(a).fill(x),...Array(b).fill(y)];
  const expected=individual.reduce((sum,value)=>sum+value,0)/individual.length;
  assert.equal(aggregateBatchMeans(a,x,b,y).mean,expected);
}
console.log('TensorFlow: connected/detached signed/zero branches and 81 expanded-row aggregation fixtures passed.');
