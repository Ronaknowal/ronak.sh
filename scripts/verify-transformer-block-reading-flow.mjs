import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { blockDefault, traceBlock, feedforwardTrace, gatedFeedforwardTrace, normalizationProbe, movementBlockForward, movementBlockForwardWithMasks, blockCosts } from '../src/learn/data/transformer-block-models.js';
const require = createRequire(import.meta.url), parser = require('@babel/parser');
const topic='src/learn/data/topics/transformer-block-architecture.jsx';
const records='docs/teaching/deep-learning-beginner/transformer-block-architecture';
const work='scratch/transformer-block-reading-flow/native';
fs.mkdirSync(work,{recursive:true});
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ast=parser.parse(fs.readFileSync(topic,'utf8'),{sourceType:'module',plugins:['jsx']});
const codes=[];
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='JSXElement'&&node.openingElement.name.name==='CodeBlock'){const values=node.children.filter(x=>x.type==='JSXExpressionContainer').map(x=>x.expression.value);assert.equal(values.length,1);codes.push(values[0]);}for(const[key,value]of Object.entries(node)){if(key==='loc')continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
visit(ast);assert.equal(codes.length,3);codes.forEach((code,i)=>fs.writeFileSync(`${work}/printed-${i+1}.py`,code+'\n'));
if(process.argv.includes('--extract')){console.log('Extracted all three actual printed programs.');process.exit(0);}
const flatten=v=>Array.isArray(v)?v.flat(Infinity):[v];
let maxError=0,comparisons=0;
function close(actual,expected,tolerance=1e-10){const a=flatten(actual),b=flatten(expected);assert.equal(a.length,b.length);a.forEach((v,i)=>{const error=Math.abs(v-b[i]);maxError=Math.max(maxError,error);assert.ok(error<=tolerance,`${v} != ${b[i]}: ${error}`);comparisons++;});}
// Independent scalar operations, without importing shipped sequence helpers.
const avg=row=>row.reduce((s,x)=>s+x,0)/row.length;
const normalize=row=>{const m=avg(row),s=Math.sqrt(avg(row.map(x=>(x-m)**2))+1e-5);return row.map(x=>(x-m)/s);};
const multiply=(row,map)=>map[0].map((_,j)=>row.reduce((s,x,i)=>s+x*map[i][j],0));
function scalarBlock(settings){const {inputs,pre,branch,up,down}=settings;const supplied=pre?inputs.map(normalize):inputs;const weights=supplied.map(q=>{const score=supplied.map(k=>q.reduce((s,x,i)=>s+x*k[i],0)/2),m=Math.max(...score),mass=score.map(x=>Math.exp(x-m));return mass.map(x=>x/mass.reduce((s,v)=>s+v,0));});const update=weights.map(w=>supplied[0].map((_,j)=>branch*w.reduce((s,x,i)=>s+x*supplied[i][j]/4,0)));const residual=inputs.map((r,i)=>r.map((x,j)=>x+update[i][j]));const context=pre?residual:residual.map(normalize);const ffnInput=pre?context.map(normalize):context;const hidden=ffnInput.map(row=>multiply(row,up).map(x=>Math.max(0,x)));const ffnUpdate=hidden.map(row=>multiply(row,down).map(x=>branch*x));const sums=context.map((r,i)=>r.map((x,j)=>x+ffnUpdate[i][j]));return {input:inputs,attentionInput:supplied,weights,update,residual,context,ffnInput,hidden,ffnUpdate,output:pre?sums:sums.map(normalize)};}
let corners=0;
for(const pre of[false,true])for(const value of[-3,3,6])for(const branch of[0,1,2]){const base=blockDefault(),settings={...base,pre,branch,inputs:[base.inputs[0],[value,0,2,1]]},actual=traceBlock(settings),expected=scalarBlock(settings);for(const key of Object.keys(actual))close(actual[key],expected[key]);corners++;}
const fixture=blockDefault();close(multiply([.75,.5],[[-.8,3.2,6.4,12],[3.2,-.8,.4,-2]]),fixture.inputs[0]);close(multiply([.25,1],[[-.8,3.2,6.4,12],[3.2,-.8,.4,-2]]),fixture.inputs[1]);
close(feedforwardTrace([1,2,-1,-2],fixture.up,fixture.down).output,[2,4,1.5,-1.5]);close(feedforwardTrace([2,-1,0,1],fixture.up,fixture.down).output,[2,0,.5,-.5]);
for(const first of[-3,1,3])for(const detector of[-2,1,2])for(const write of[-2,.5,2]){const input=[first,2,-1,-2],up=fixture.up.map((row,i)=>row.map((v,j)=>i===0&&j===0?detector:v)),down=fixture.down.map((row,i)=>row.map((v,j)=>i===2&&j===2?write:v));const response=multiply(input,up).map(x=>Math.max(0,x));close(feedforwardTrace(input,up,down).output,multiply(response,down));const gate=[[detector,0,0],[0,-1,0],[0,0,1],[0,0,0]],u=multiply(input,up),g=multiply(input,gate).map(x=>x/(1+Math.exp(-x)));close(gatedFeedforwardTrace(input,up,gate,down).output,multiply(u.map((x,i)=>x*g[i]),down));}
for(const contrast of[0,.3,1])for(const spread of[.01,1,2]){const input=[1,2,5,8].map(x=>4+spread*(x-4)),probe=[1,1-2*contrast,1-contrast,1-contrast],result=normalizationProbe(input,probe);close(result.gradient,result.finite,2e-5);}
close([3-4+1, -3*3+(-2)*(-4)+1],[0,0]);
close(blockCosts(512,512,2048).maps,1610612736);close(blockCosts(512,512,2048).pairs,268435456);close(blockCosts(4096,512,2048).maps,12884901888);close(blockCosts(4096,512,2048).pairs,17179869184);close(blockCosts(1,256,1024).parameters,789760);
const models=JSON.parse(fs.readFileSync('public/learn-code/transformer-block-architecture/movement-runtime.json','utf8'));
const expected=JSON.parse(fs.readFileSync(`${work}/independent-inference.json`,'utf8'));
let inference=0,maxNativeError=0;
for(const[name,model]of Object.entries(models))for(const[key,reference]of Object.entries(expected[name])){
 let points=model.points,times=model.times,validity=points.map(()=>true),excludeInvalidKeys=true,excludeInvalidPool=true;
 if(key==='reverse-coordinates')points=[...points].reverse();
 if(key==='reverse-records'){points=[...points].reverse();times=[...times].reverse();}
 if(key==='reflect-point23')points=points.map((row,i)=>i===22?[1-row[0],row[1]]:row);
 if(key==='retag-point23')times=times.map((v,i)=>i===22?1.3:v);
 if(key.startsWith('pad')){const match=key.match(/pad(\d+)-keys(\d)-pool(\d)/),count=Number(match[1]);points=[...points,...Array.from({length:count},()=>[.75,.75])];times=[...times,...Array(count).fill(0)];validity=points.map((_,i)=>i<45);excludeInvalidKeys=match[2]==='1';excludeInvalidPool=match[3]==='1';}
 const actual=movementBlockForwardWithMasks(model,points,times,{validity,excludeInvalidKeys,excludeInvalidPool});
 for(const prop of['logits','probabilities']){const a=flatten(actual[prop]),b=flatten(reference[prop]);a.forEach((x,i)=>maxNativeError=Math.max(maxNativeError,Math.abs(x-b[i])));close(a,b,4e-6);}
 for(let i=0;i<2;i++)for(const prop of Object.keys(actual.traces[i]))close(actual.traces[i][prop],reference.traces[i][prop],5e-6);
 if(excludeInvalidKeys&&excludeInvalidPool){const prior=movementBlockForward(model,points,times,validity.map(v=>!v));close(actual.logits,prior.logits,0);}
 inference++;
}
assert.throws(()=>movementBlockForwardWithMasks(models['pre-norm'],[[0,0]],[0],{validity:[false]}));
const sources=[topic,'src/learn/components/lesson-labs/TransformerBlockLabs.jsx','src/learn/components/lesson-labs/TransformerBlockFlowFigures.jsx','src/learn/components/lesson-labs/transformer-block-labs.css','src/learn/data/transformer-block-models.js'];
const result={date:'2026-10-05',sources:sources.map(file=>({file,sha256:hash(file)})),printedPrograms:codes.length,independentBlockCorners:corners,independentFfnGateCorners:27,gradientProbeCases:9,nativeInferenceCases:inference,scalarComparisons:comparisons,maxError,maxNativeLogitError:maxNativeError,limits:'Scoped mathematical/native-source checks; no browser, refit or production integration claim.'};
fs.writeFileSync(`${records}/reading-flow-model-checks.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
