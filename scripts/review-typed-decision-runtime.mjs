import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/typed-decision-models.js';
const checks=[];
function near(a,b,label){assert.ok(Math.abs(a-b)<1e-8,label);checks.push(label);}
const p=[.2,.5,.3],q=[.4,.4,.2];
near(m.scores(p,p).log-m.scores(p,q).log,m.scores(p,q).kl,'expected log-score gap is KL');
near(m.scores(p,p).brier-m.scores(p,q).brier,m.scores(p,q).brierRegret,'expected quadratic gap is squared distance');
const z=[1.2,-.3,.7];
const loss=v=>-p.reduce((s,t,i)=>s+t*Math.log(m.softmaxTrace(v).probabilities[i]),0);
for(let i=0;i<3;i++){const a=z.slice(),b=z.slice();a[i]+=1e-5;b[i]-=1e-5;near((loss(a)-loss(b))/2e-5,m.ceStep(z,p,.1).gradient[i],`soft-target coordinate ${i} independent difference`);}
assert.throws(()=>m.softmaxTrace(z,[false,false,false]));checks.push('all-invalid distribution remains undefined');
const masked=m.softmaxTrace([1001,1000,999],[true,false,true]).probabilities;
near(masked[0],1/(1+Math.exp(-2)),'masked normalization ignores middle candidate');
near(masked[1],0,'masked candidate has zero mass');
const costs=[[0,3,8],[2,0,5],[12,4,0]];
for(const review of [0,1,10])m.costRegions(costs,review).forEach((polygon,action)=>polygon.forEach((point,j)=>{
const all=[...costs[0].map((_,a)=>point.reduce((s,v,y)=>s+v*costs[y][a],0)),review];
assert.ok(all.every(v=>all[action]<=v+1e-8));checks.push(`region ${review}/${action} vertex ${j} really minimizes risk`);
}));
const bins=m.reliability([[1,0],[.5,.5]],[1,0],5);
assert.equal(bins[4].accuracy,0);assert.equal(bins[1].accuracy,null);checks.push('p=1 final bin and empty-bin undefined distinction');
const route=m.routeRows([[.6,.4]],[[.1,.9]],[0],.6);
assert.equal(route.cheapCount,0);assert.equal(route.selectiveRisk,null);near(route.meanCost,10.5,'threshold equality selects fallible fallback');
const perm=[2,0,1],s=m.ceStep(z,p,.1),t=m.ceStep(perm.map(i=>z[i]),perm.map(i=>p[i]),.1);
perm.forEach((i,j)=>near(t.gradient[j],s.gradient[i],`consistent event permutation ${j}`));
const files=Object.fromEntries(['src/learn/data/typed-decision-models.js','scripts/review-typed-decision-runtime.mjs'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
fs.writeFileSync('docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems/runtime-root-math-checks.json',JSON.stringify({passed:true,checks,conditions:checks.length,files,scope:'Complementary pure arithmetic; no fit, inference or scientific replay.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,conditions:checks.length}));
