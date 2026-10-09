import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { attentionRead, multiHeadRead, attentionTrajectory, mixtures, attentionStorage } from '../src/learn/data/self-attention-models.js';
const id='self-attention-multi-head-attention';
const checks=[];
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const q=[[1,0],[0,1],[1,1]],k=q,v=[[2,0],[0,2],[1,1]];
// X=I3 selects each learned map's corresponding row; recompute all three maps.
const input=[[1,0,0],[0,1,0],[0,0,1]];
for(const map of [q,k,v]) input.forEach((row,i)=>map[0].forEach((_,j)=>near(row.reduce((sum,x,r)=>sum+x*map[r][j],0),map[i][j])));
checks.push('Three learned 3×2 maps produce the pictured Q/K/V from X=I3');
for(const queryY of [-2,0,2])for(const keyY of [-2,0,2])for(const valueY of [-2,1,3]){
  const keys=[[1,keyY],[0,1],[1,1]], values=[[2,0],[0,2],[1,valueY]], result=attentionRead([1,queryY],keys,values), baseline=attentionRead([1,queryY],keys,v);
  near(result.weights.reduce((a,b)=>a+b),1);result.weights.forEach((w,i)=>near(w,baseline.weights[i]));
  result.output.forEach((x,j)=>{assert.ok(x>=Math.min(...values.map(row=>row[j]))-1e-12);assert.ok(x<=Math.max(...values.map(row=>row[j]))+1e-12)});
}
checks.push('27 supported message-control corners; unchanged weights on value edits and convex-hull coordinate bounds');
for(const allow of [false,true])for(const futureX of [-4,-2,4]){
 const result=attentionRead([0,1],[[1,0],[0,1],[1,1],[.5,-1]],[[1,0],[0,2],[3,1],[futureX,3]],{allowed:[true,true,false,allow]});
 if(!allow)near(result.output[0],1/(1+Math.exp(1/Math.sqrt(2))));else assert.ok(result.weights[3]>0);
 near(result.weights[2],0);
}
for(let position=0;position<=2;position++)near(attentionRead([1,1],k,v,{allowed:[0,1,2].map(p=>p<=position)}).weights.reduce((a,b)=>a+b),1);
checks.push('Future-value mask invariance, legal edge leak, cached absolute-position prefixes');
const identity=[[1,0],[0,1]];
for(const coordinate of [-2,-.25,0,1,2])for(const zero of [false,true]){
 const maps={query:identity,key:identity,value:zero?[[0,0],[0,0]]:identity,output:identity};
 for(const heads of [1,2]){const r=multiHeadRead([[coordinate,0],[0,1]],maps,heads);r.output.forEach((row,i)=>row.forEach((x,j)=>near(x,r.merged[i][j])));if(zero)r.output.flat().forEach(x=>near(x,0));}
}
const maps=Object.fromEntries(['query','key','value','output'].map(n=>[n,identity]));near(multiHeadRead([[1,0],[0,1]],maps,2).merged[0][0],1/(1+Math.exp(-1)));near(multiHeadRead([[1,0],[0,1]],maps,2).merged[0][1],.5);
checks.push('Head scalar mixtures, concatenation and explicit identity W_O agree at ten input/value-map alternatives');
const equal=mixtures([.6,.3,.1],[.2,.3,.5],[4,2,4]);near(equal.outputA,3.4);near(equal.outputB,3.4);
for(const offset of [0,710,1000])attentionRead([1,0],k,v,{offset}).weights.forEach((x,i)=>near(x,attentionRead([1,0],k,v).weights[i]));
const storage=attentionStorage();assert.equal(storage.matrixBytes,128*2**20);assert.equal(storage.cacheBytes,96*2**20);
checks.push('Equal mixtures, common-offset invariance and exact storage counts');
const data=JSON.parse(fs.readFileSync(`public/learn-assets/${id}/trajectory-model.json`));
const native=JSON.parse(fs.readFileSync(`docs/teaching/deep-learning-completion/${id}/native-fixtures.json`));
let maximumPortError=0;
for(const fixture of native){const points=structuredClone(data.points);let valid;if(fixture.variant==='reverse')points.reverse();if(fixture.variant==='reflect')points[22][0]=1-points[22][0];if(fixture.variant.startsWith('padding')){points.push(...Array.from({length:5},()=>[.75,.75]));if(fixture.variant==='padding-masked')valid=[...Array(45).fill(true),...Array(5).fill(false)];}if(fixture.variant==='duplicate-first')points.push([...points[0]]);const result=attentionTrajectory(data.state_dict,points,valid);result.logits.forEach((x,i)=>{maximumPortError=Math.max(maximumPortError,Math.abs(x-fixture.logits[i]));near(x,fixture.logits[i],2e-5);});result.heads.forEach((head,h)=>head[0].weights.forEach((x,i)=>near(x,fixture.selectedWeights[h][i],1e-5)));}
checks.push('Six retained native conditions; every class logit and both selected head rows');
const lesson=fs.readFileSync(`src/learn/data/topics/${id}.jsx`,'utf8');
assert.equal((lesson.match(/data-lesson-exercise/g)||[]).length,8);assert.ok(lesson.includes('36 / 28 / 35'));assert.ok(lesson.includes('input/parameter gradients and one equal update: True'));
const files=[`src/learn/data/topics/${id}.jsx`,'src/learn/components/lesson-labs/SelfAttentionLabs.jsx','src/learn/components/lesson-labs/SelfAttentionFlowFigures.jsx','src/learn/components/lesson-labs/self-attention-labs.css','src/learn/data/self-attention-models.js',`public/learn-assets/${id}/trajectory-model.json`];
files.filter(f=>f.endsWith('.jsx')).forEach(path=>parse(fs.readFileSync(path,'utf8'),{sourceType:'module',plugins:['jsx']}));
const report={date:'2026-10-05',passed:true,checks,maximumPortError,sources:files.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),limits:'No twelve-fit rerun, GPU benchmark or learner study. Original fit evidence retained because programs/data/protocol unchanged.'};
fs.writeFileSync(`docs/teaching/deep-learning-beginner/${id}/reading-flow-model-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,maximumPortError}));
