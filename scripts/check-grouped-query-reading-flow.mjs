import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import katex from 'katex';
import { groupedDefaults, groupedRead, cacheBudget, conversionRead, groupedForecast, groupedRollout } from '../src/learn/data/grouped-query-models.js';
import { groupedMovementPoints } from '../src/learn/data/grouped-query-reading-fixtures.js';
import { groupedForecastTrace } from '../src/learn/data/grouped-query-reading-traces.js';
const id = 'grouped-query-attention-gqa-multi-query-attention-mqa';
const output = `docs/teaching/deep-learning-beginner/${id}/reading-flow-author-numerics.json`;
const checks = [];
function check(name, action) { action(); checks.push({ name, pass: true }); }
function near(actual, expected, tolerance = 1e-10) {
  if (Array.isArray(actual)) { assert.equal(actual.length, expected.length); actual.forEach((value, i) => near(value, expected[i], tolerance)); }
  else assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}
const softmax = scores => { const maximum = Math.max(...scores), exp = scores.map(x => Math.exp(x - maximum)), total = exp.reduce((x,y) => x+y); return exp.map(x => x/total); };
check('Opening identity Q/K and explicit value maps, complete two-record read', () => {
  const masses = softmax([0, 1 / Math.sqrt(2)]);
  near(masses, [.33023845067334306, .6697615493266569]);
  near([masses[0]+masses[1],masses[0]-masses[1]], [1,-.33952309865331387]);
});
const defaults = groupedDefaults(), native = JSON.parse(fs.readFileSync(`docs/teaching/deep-learning-completion/${id}/native-fixtures.json`));
check('All original constructed scores, probabilities and four outputs against native values', () => near(groupedRead(defaults).map(row => row.output), native.mechanisms.manual_outputs.baseline[0].map(row => row[0])));
check('Value edit leaves every matching mass and unrelated-group output unchanged', () => { const edited=structuredClone(defaults); edited.values[0][0]=[3,-1]; const a=groupedRead(edited), b=groupedRead(defaults); near(a.map(row=>row.weights),b.map(row=>row.weights));near(a.slice(2).map(row=>row.output),b.slice(2).map(row=>row.output));a.slice(0,2).forEach((row,h)=>near(row.output.map((v,j)=>v-b[h].output[j]),[b[h].weights[0],-b[h].weights[0]])); });
check('Key edit orthogonal-query and other-group nulls', () => { const edited=structuredClone(defaults);edited.keys[0][0]=[2,0];near(groupedRead(edited).slice(1).map(row=>row.output),groupedRead(defaults).slice(1).map(row=>row.output)); });
check('Consistent group relabel and complete-record reorder preserve all reads', () => { near(groupedRead({...defaults,keys:[...defaults.keys].reverse(),values:[...defaults.values].reverse(),mapping:defaults.mapping.map(g=>1-g)}).map(row=>row.output),groupedRead(defaults).map(row=>row.output));near(groupedRead({...defaults,positions:[...defaults.positions].reverse(),keys:defaults.keys.map(row=>[...row].reverse()),values:defaults.values.map(row=>[...row].reverse())}).map(row=>row.output),groupedRead(defaults).map(row=>row.output)); });
check('Illustrated concatenation and 2×8 output-map route', () => { const rows=groupedRead(defaults).map(row=>row.output),f=rows.flat();near([f[0]+.5*f[4],f[3]+.5*f[7]],[1.7687623868843803,2.9136876131156195],1e-6); });
check('Main payload table and binary/decimal units', () => { for(const [kv,gib,perToken] of [[64,80,2621440],[8,10,327680],[1,1.25,40960]]){const result=cacheBudget({batch:1,layers:80,length:32768,queryHeads:64,kvHeads:kv,keyWidth:128,valueWidth:128,bytes:2});near(result.total/2**30,gib);near(result.perToken,perToken);} });
check('Common-head-width and independent expanded-query parameter counts', () => { for(const [kv,total] of [[8,1048576],[2,655360],[1,589824]])near(cacheBudget({batch:1,layers:1,length:1,queryHeads:8,kvHeads:kv,keyWidth:64,valueWidth:64,bytes:2}).parameters,total);const result=cacheBudget({batch:1,layers:80,length:32768,queryHeads:64,kvHeads:8,keyWidth:128,valueWidth:128,bytes:2,modelWidth:512});near(result.parameters,9437184);near(result.total/2**30,10); });
check('Scalar conversion, original reads, tied null and full L2 excess identity', () => { const rows=conversionRead([1,2],[[2,0],[0,2]],[[1,3],[5,-1]]);near(rows.map(row=>row.original),[1.2384058440442353,-.8920827402274504]);near(rows.map(row=>row.converted),[2,2]);const edited=conversionRead([1,2],[[2,0],[0,2]],[[1,3],[5,-1]],{keys:[2,0],values:[2,4]});near([edited[0].minimumKeyDistance,edited[0].minimumValueDistance,edited[0].keyDistance,edited[0].valueDistance],[4,16,8,36]);near(conversionRead([1,2],[[2,0],[2,0]],[[1,3],[1,3]]).map(row=>row.outputDelta),[0,0]); });
check('Equal mean and unequal learned affine-folding arithmetic including bias', () => { for(const [a,b] of [[.5,.5],[.25,.75],[-2,2]]){const explicit=[3*a-2*b,-2*a],W=[[a,b],[-b,2*a]],bias=[a-b,2*b];near(W.map((row,i)=>2*row[0]-row[1]+bias[i]),explicit);} });
check('All quantitative practice answers: heads, unequal widths, masks, derivatives, cost and replicas', () => {
  near(12/3,4);near(Math.floor(9/4),2);
  const probability=softmax([Math.sqrt(2),0])[0];near(probability,.8044296825069569);near([probability,3*(1-probability)], [.8044296825069569,.5867109524791293]);near([2*(1-probability),2*probability],[.3911406349860862,1.6088593650139138]);
  const bytes=2*12*3*1024*(64+32)*2;near(bytes,14155776);near(bytes/2**20,13.5);near(bytes*4/2**20,54);
  assert.deepEqual([5,6].map(q=>[0,1,2,3,4,5,6].map(k=>Number(k<=q))),[[1,1,1,1,1,1,0],[1,1,1,1,1,1,1]]);
  near(.2*3+.7*(-1),-.1);near(1/(.6+.4/4),10/7);near(1/(.4+.6/8),40/19);near((32/8)/(32/2),.25);near(2*4,8);
});
let maximumNativeError=0, maximumTraceError=0;
for(const heads of [4,2,1]) {
  const runtime=JSON.parse(fs.readFileSync(`public/learn-assets/${id}/runtime-${heads}.json`));
  check(`KV${heads}: all live source-row coordinates match immutable runtime fixture`,()=>assert.deepEqual(groupedMovementPoints,runtime.points));
  const weights=runtime.weights;
  const cases=native.cases.filter(test=>test.heads===heads);
  for(const test of cases) check(`KV${heads}: current JS full read, all head writes, distribution and five generated points: length${test.points.length} shift${test.shift}`,()=>{
    const result=groupedRollout(weights,test.points,heads,5,test.shift);
    near(result.predictions,test.prediction,2e-5);near(result.rollout,test.rollout,2e-5);near(result.attention.at(-1),test.weights,2e-5);near(result.heads.at(-1),test.headOutputs,2e-5);
    maximumNativeError=Math.max(maximumNativeError,...result.predictions.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-test.prediction[i][j]))));
    for(let h=0;h<4;h++) { const trace=groupedForecastTrace(weights,test.points,heads,h,test.shift,result);near(trace.prediction,result.predictions.at(-1),1e-12);near(trace.contributions[0].map((_,j)=>trace.contributions.reduce((sum,row)=>sum+row[j],0)),result.heads.at(-1)[h],1e-12);maximumTraceError=Math.max(maximumTraceError,...trace.prediction.map((v,j)=>Math.abs(v-result.predictions.at(-1)[j]))); }
    let cache=null;const incremental=test.points.map(point=>{const current=groupedForecast(weights,[point],heads,test.shift,cache);cache=current.cache;return current.predictions[0];});near(incremental,result.predictions,1e-12);near(groupedForecast(weights,test.points,heads,test.shift+100).predictions,result.predictions,1e-12);
  });
}
const sources=[`src/learn/data/topics/${id}.jsx`,'src/learn/components/lesson-labs/GroupedQueryFlowFigures.jsx','src/learn/components/lesson-labs/GroupedQueryFlowLabs.jsx','src/learn/components/lesson-labs/grouped-query-flow.css','src/learn/data/grouped-query-reading-fixtures.js','src/learn/data/grouped-query-reading-traces.js','src/learn/data/grouped-query-models.js','src/learn/data/grouped-query-study.js',`public/learn-code/${id}/grouped-attention-cache.py`];
let mathCount=0;
check('Every literal lesson equation parses as actual KaTeX, including new formal definitions',()=>{
  const tree=parse(fs.readFileSync(sources[0],'utf8'),{sourceType:'module',plugins:['jsx']});
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='JSXElement'&&['MathBlock','InlineMath'].includes(node.openingElement.name.name)){const expressions=node.children.filter(child=>child.type==='JSXExpressionContainer').map(child=>child.expression);for(const expression of expressions){assert.equal(expression.type,'StringLiteral');katex.renderToString(expression.value,{throwOnError:true});mathCount++;}}for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
  visit(tree);
});
for(const file of sources.filter(file=>file.endsWith('.jsx'))) check(`${file}: complete JSX parse`,()=>parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']}));
const receipt={date:new Date().toISOString(),pass:true,checks,mathCount,maximumNativeError,maximumTraceError,scope:'Current source arithmetic and actual trace paths; native scientific fixtures from unchanged original selected models, not a new fit. Browser geometry and independent source review remain separate.',sources:sources.map(file=>({path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({pass:true,checks:checks.length,mathCount,maximumNativeError,maximumTraceError}));
