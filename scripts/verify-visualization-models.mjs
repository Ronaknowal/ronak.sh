import assert from 'node:assert/strict';
import {histogramView,scalePositions} from '../src/learn/data/visualization-models.js';
let cases=0;
for(let v=0;v<=8;v+=.25)for(const equal of [false,true])for(const density of [false,true]){
 const result=histogramView(v,equal,density);
 assert.equal(result.bins.reduce((s,b)=>s+b.count,0),8);
 if(density)assert.ok(Math.abs(result.area-1)<1e-12);
 for(const b of result.bins)assert.ok(b.height>=0);
 cases++;
}
assert.deepEqual(histogramView().bins.map(b=>b.count),[2,3,3]);
assert.deepEqual(histogramView().bins.map(b=>b.height),[.125,.1875,.09375]);
assert.equal(scalePositions(10).logarithmic,.5);
assert.deepEqual(scalePositions(1),{linear:0,logarithmic:0});
assert.deepEqual(scalePositions(100),{linear:1,logarithmic:1});
assert.throws(()=>scalePositions(0));
console.log(`Visualization: ${cases} histogram configurations and independent boundary/scale fixtures pass.`);
