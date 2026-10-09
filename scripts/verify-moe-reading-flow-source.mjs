import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from '@babel/parser';
import {route,dispatch,balance,costs,biasedSelection,choice} from '../src/learn/data/moe-models.js';
import {modelTrace,softMoEFixture,noisyProbability,objectiveScopes,routingDefaults,capacityDefaults,balanceDefaults,budgetDefaults,allocationPair,expertTrace} from '../src/learn/data/moe-reading-traces.js';
const id='mixture-of-experts-transformers-moe',record=`docs/teaching/deep-learning-beginner/${id}`;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`src/learn/data/topics/${id}.jsx`,'src/learn/data/moe-reading-traces.js',...['MoeFlowFigures','MoeFlowSystemsFigures','MoeMechanismFigures','MoeDeepFigures','MoeFlowObjectiveFigures','MoeFlowModelFigures','MoeFlowStudy','MoeFlowLabs'].map(x=>`src/learn/components/lesson-labs/${x}.jsx`),'src/learn/components/lesson-labs/moe-flow.css',`public/learn-code/${id}/moe-routing-dispatch.py`,'scripts/render-moe-lesson.mjs'];
const checks=[];let comparisons=0,maxTraceError=0;
function close(a,b,tol=1e-10){if(Array.isArray(a)){assert.equal(a.length,b.length);a.forEach((v,i)=>close(v,b[i],tol));return;}const e=Math.abs(a-b);comparisons++;assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&e<=tol,`${a} vs ${b}`);return e;}
function check(name,fn){fn();checks.push({name,passed:true});}
check('All current lesson and figure JSX parses; exactly twelve main sections/twelve practice owners',()=>{
 for(const p of files.filter(x=>x.endsWith('.jsx')))parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']});
 const s=fs.readFileSync(files[0],'utf8');assert.equal((s.match(/<H2>/g)||[]).length,12);assert.equal((s.match(/data-lesson-exercise=/g)||[]).length,12);
 assert.ok(!s.includes('3Ndm')&&!s.includes('dN'));for(const x of ['MoeBoundaryDrawing','MoeObjectiveTotalDrawing','MoeNodeConstraintDrawing','MoeParallelDrawing'])assert.ok(s.includes(`<${x} `)||s.includes(`<${x} />`));
});
check('All immutable baseline copies and all protected scientific/current old receipts remain byte identical',()=>{
 const baseline=JSON.parse(fs.readFileSync(`docs/teaching/deep-learning-beginner/original/moe-before-reading-flow/sources.json`));
 for(const row of baseline.sources){assert.equal(hash(row.copy),row.sha256);if(![files[0],'scripts/render-moe-lesson.mjs'].includes(row.path))assert.equal(hash(row.path),row.sha256);}
});
check('Old seven downloaded supporting files preserve canonical bytes',()=>{
 for(const file of fs.readdirSync(`docs/teaching/drafts/${id}`)){const dest=`public/learn-code/${id}/${file}`;if(fs.existsSync(dest))assert.ok(fs.readFileSync(dest).equals(fs.readFileSync(`docs/teaching/drafts/${id}/${file}`)));}
});
check('Foundational mixture, score credit, map input credit, selected top1/full top1 and copy null',()=>{
 const score=[4,2,1].map(Math.log),outputs=[[2,0],[0,3],[-1,1]],a=route(score,outputs,2,true,[1,1]),b=route(score,outputs,2,false,[1,1]);
 close(a.output,[4/3,1]);close(b.output,[8/7,6/7]);close(a.gradient,[-2/9,2/9,0]);close(b.gradient,[0,2/7,-2/7]);
 close(a.gradient[0]*Math.log(4)+a.gradient[1]*Math.log(2),-2*Math.log(2)/9);
 close(route(score,outputs,1,true).gradient,[0,0,0]);assert.notEqual(route(score,outputs,1,false).gradient[0],0);
 close(route(score,[[2,-3],[2,-3],[2,-3]],2,true,[1,1]).gradient,[0,0,0]);
});
check('All local gradient coordinates away from boundaries match central differences, common offset invariant',()=>{
 for(const k of [1,2,4])for(const normal of [true,false])for(const direction of [[1,0],[0,1],[1,1]]){
  const s=[-.8,.2,1.7,1],out=[[2,-3],[-1,4],[3,2],[1,-2]],a=route(s,out,k,normal,direction);
  close(a.output,route(s.map(v=>v+1000),out,k,normal,direction).output,2e-12);
  for(let j=0;j<4;j++){const hi=s.map((v,i)=>v+(i===j?1e-5:0)),lo=s.map((v,i)=>v-(i===j?1e-5:0));
   const scalar=x=>route(x,out,k,normal).output.reduce((sum,v,i)=>sum+v*direction[i],0);close(a.gradient[j],(scalar(hi)-scalar(lo))/2e-5,1e-9);}
 }
});
check('Capacity hand/fresh cases retain all addresses; zeros count; dropless/reorder and mass policy differ',()=>{
 const hand=dispatch([[0,1],[0,1],[0,2],[0,2]],2,{values:[1,2,3]});close(hand.requested,[4,2,2]);assert.equal(hand.dropped.length,2);assert.equal(hand.fullyDropped.length,0);
 const s=capacityDefaults(),a=allocationPair(s);close(a.capped.output,[1.5,2,2,2.5,0]);close(a.dropless.output,[1.5,2,2.5,2.5,1.5]);
 close(allocationPair({...s,renormalize:true}).capped.output,[1.5,2,4,2.5,0]);
 for(const order of [[4,0,1,2,3],[3,2,1,0,4]])close(allocationPair({...s,order}).dropless.output,a.dropless.output);
 const zero=allocationPair({...s,gates:s.gates.map(()=>[0,1])});assert.equal(zero.capped.retained.length,7);
 const practice=dispatch(Array.from({length:6},()=>[0,1]),4);assert.equal(practice.dropped.length,4);assert.equal(practice.fullyDropped.length,2);
});
check('All balance conventions, scopes, counterexample, z shifts and total scalar',()=>{
 const s=balanceDefaults(),q=objectiveScopes(s);close(q.global.value,1.0125);assert.notEqual(q.pairMean,q.global.value);assert.notEqual(q.rowMean,q.global.value);
 const b=balance([[.51,.49],[.51,.49],[.51,.49],[.001,.999]].map(r=>r.map(Math.log)));close(b.fractions,[.75,.25]);close(b.mean,[.38275,.61725]);close(b.value,.88275);
 close(balance([[.99,.01].map(p=>Math.log(p)+3)]).zLoss,9);close(balance([[.2,.3,.5].map(p=>Math.log(p)-2)]).zLoss,4);
 close(1.2+.01*1.0125+.001*9,1.219125);
});
check('SwiGLU exact maps, fixed-resource split, bytes and all safe supported upper counts',()=>{
 close(expertTrace([1,2],[[1,0],[0,1]],[[2,0],[0,-1]],[[1,0],[0,1]]).output,[1.4621171572600098,-3.5231883119115293]);
 const a=costs({d:64,m:128,n:8,k:2,tokens:32,bytes:2});close([a.expert,a.stored,a.active,a.router,a.payload],[24576,196608,49152,512,16384]);close(a.stored*2,393216);close(393216/1024**2,.375);
 const p=costs({d:32,m:96,n:6,k:2}),fine=costs({d:32,m:48,n:12,k:4});close([p.stored,p.active,p.router],[55296,18432,192]);close([fine.stored,fine.active,fine.router],[55296,18432,384]);
 Object.values(costs({d:4096,m:4096,n:256,k:256,tokens:4096,bytes:8,shared:4})).forEach(v=>assert.ok(Number.isSafeInteger(v)));
});
check('Two directions of choice, feasible matching, selection-only bias and node-mask arithmetic',()=>{
 const c=choice([[.7,.2,.1],[.6,.3,.1],[.2,.2,.6],[.1,.8,.1]]);close(c.token,[[0],[0],[2],[1]]);close(c.expert,[[0],[3],[2]]);close(2+2.9,4.9);
 const b=biasedSelection([.8,.7,.6,.1],[0,0,.3,0]);close(b.selected,[2,0]);close(b.weights,[4/7,0,3/7,0]);
 const p=biasedSelection([.4,.8,.7],[.5,0,0]);close(p.selected,[0,1]);close(p.weights,[1/3,2/3,0]);close(p.weights[0]*3-p.weights[1],1/3);close((.9*3-.8)/1.7,19/17);
 close(.9/1.3+.4/1.3,1);
});
check('Column/row Soft MoE and normal CDF approximate oracle including off-plot thresholds',()=>{
 const t=softMoEFixture();close(t.dispatchWeights,[[.75,.25],[.25,.75]]);close(t.slots,[[.75,.25],[.25,.75]]);close(t.answers,[[.75,.25],[.5,1.5]]);close(t.output,[[.6875,.5625],[.5625,1.1875]]);
 close(noisyProbability(0,.5),.15865525393145707,8e-8);close(noisyProbability(.5,.5),.5,8e-8);close(noisyProbability(-2,.1),0,1e-12);close(noisyProbability(2,.1),1,1e-12);
});
const state=JSON.parse(fs.readFileSync(`public/learn-assets/${id}/moe-001-17.json`)),native=JSON.parse(fs.readFileSync(`${record}/reading-flow-native.json`));
check('Every new semantic model boundary matches ten complete independent Torch float64 traces',()=>{
 for(const c of native.modelTraceCases){const t=modelTrace(state,c.pixels,{temperature:c.temperature,disabled:c.disabled}),r=t.reference;
  const actual={patches:r.patches,projection:t.projection.map(p=>p.output),positioned:t.positioned,attentionNorm:t.attentionNorm.map(p=>p.output),qkv:t.qkv.map(p=>p.output),attentionScores:t.attentionScores,attention:r.attention,contexts:t.contexts,afterAttention:t.afterAttention,expertNorm:t.expertNorm.map(p=>p.output),router:t.router.map(p=>p.output),selected:r.selected,gates:r.weights,combined:r.combined,afterExperts:t.afterExperts,finalNorm:t.finalNorm.map(p=>p.output),mean:t.mean,logits:t.classifier.output,probabilities:t.probabilities};
  for(const [key,a]of Object.entries(actual)){const scan=(x,y)=>Array.isArray(x)?Math.max(...x.map((v,i)=>scan(v,y[i]))):Math.abs(x-y);maxTraceError=Math.max(maxTraceError,scan(a,c.native[key]));close(a,c.native[key],2e-11);}
 }
});
check('Literal source probability/count constants and preserved twelve study rows/156 points/48 confusions',()=>{
 const examples=JSON.parse(fs.readFileSync('src/learn/data/moe-examples.json'));assert.equal(examples.study.length,12);assert.equal(examples.study.reduce((n,r)=>n+r.curve.length,0),156);
 let confusionCount=0;for(const r of examples.study){assert.equal(r.selected_step,r.curve.reduce((a,b)=>b.validation_ce_after<a.validation_ce_after?b:a).step);
  for(const m of Object.values(r.measurements)){if(m.confusion){close(m.confusion.flat().reduce((a,b)=>a+b,0),m.count);close(m.confusion.reduce((sum,row,i)=>sum+row[i],0),m.correct);confusionCount++;}}
 }
 assert.equal(confusionCount,48);
 const zero=examples.examples.find(x=>x.label===0),a=modelTrace(state,zero.pixels).reference,b=modelTrace(state,zero.pixels.map((v,i)=>i>=32?0:v)).reference;
 close(a.classProbabilities[0],.951716,5e-7);close(a.counts,[0,1,15,16]);assert.equal(b.predicted,9);close(b.classProbabilities[0],.008668,5e-7);close(b.counts,[15,7,4,6]);close(modelTrace(state,zero.pixels,{temperature:2}).reference.classProbabilities[0],.946955,5e-7);
 close(modelTrace(state,zero.pixels,{disabled:0}).reference.logits,a.logits,0);
});
check('Practice changed mixture/derivatives/scatter/budget cases compute literal supplied answers',()=>{
 const a=route([2,5,3].map(Math.log),[[1],[5],[-2]],2,true,[1]);close(a.output,[19/8]);close(a.gradient,[0,105/64,-105/64]);close(route([2,5,3].map(Math.log),[[1],[5],[-2]],2,false).output,[1.9]);
 close([.25*2+.75*-1,.25*1+.75*3],[-.25,2.5]);close([.75*-1,.75*3],[-.75,2.25]);
});
const result={topic:id,scope:'Current author numerical/source self-check; independent review and shared integration pending',sourceHashes:Object.fromEntries(files.map(p=>[p,hash(p)])),nativeReceiptHash:hash(`${record}/reading-flow-native.json`),checks,count:checks.length,comparisons,maxTraceError,result:'PASS'};
fs.writeFileSync(`${record}/reading-flow-source-checks.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({count:result.count,comparisons,maxTraceError,result:'PASS'}));
