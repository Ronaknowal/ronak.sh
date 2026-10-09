import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {attention, inputAttention, multiply, WK, WV, initialPrompt} from '../src/learn/data/soft-prompt-models.js';

const folder='docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const checks=[];
function check(v,label){assert.ok(v,label);checks.push(label);}
function close(a,b,label,tol=1e-8){check(Math.abs(a-b)<tol,label);}
const packet=`${folder}/runtime-inputs.json`;
check(sha(packet)==='ba843a71255e56953c563f6cdd32b7fbf5940784460dccab4cf31ef916bf53f8','exact author runtime packet');
for(const[p,h]of Object.entries(read(packet).files))check(sha(p)===h,`guard ${p}`);

// Recreate only the text projection, intercepting writes to conserve frozen files.
const realWrite=fs.writeFileSync;
try{
  fs.writeFileSync=(p,bytes)=>{assert.equal(String(bytes),fs.readFileSync(p,'utf8'));checks.push(`exact complete deterministic rendering: ${p}`);};
  await import('./render-soft-prompt-lesson.mjs');
  await import('./project-soft-prompt-observations.mjs');
}finally{fs.writeFileSync=realWrite;}

// Complement the author's input-prompt differences with direct K/V gradients,
// whole directional changes and row-identity exchange.
for(const target of [0,1])for(const scale of [-.73,0,.41,1.7]){
  const keys=[[scale,.19],[-.38,.27]],values=[[.16,-.61],[scale,.34]];
  const base=attention(keys,values,target),eps=1e-5;
  for(const which of ['keys','values'])for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    const evaluate=sign=>{const k=keys.map(r=>[...r]),v=values.map(r=>[...r]);(which==='keys'?k:v)[i][j]+=sign*eps;return attention(k,v,target).loss;};
    close((evaluate(1)-evaluate(-1))/(2*eps),base[which==='keys'?'dKeys':'dValues'][i][j],`${which} independent finite derivative ${target}/${scale}/${i}/${j}`);
  }
  const swapped=attention([...keys].reverse(),[...values].reverse(),target);
  close(swapped.loss,base.loss,'paired memory-row permutation conserves loss');
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    close(swapped.dKeys[i][j],base.dKeys[1-i][j],'key gradient follows identity');
    close(swapped.dValues[i][j],base.dValues[1-i][j],'value gradient follows identity');
  }
  const direction=[[.31,-.71],[.47,.19]], p=initialPrompt.map(r=>[...r]);
  const f=sign=>inputAttention(p.map((r,i)=>r.map((v,j)=>v+sign*eps*direction[i][j])),target).loss;
  const grad=inputAttention(p,target).gradient;
  close((f(1)-f(-1))/(2*eps),grad.flatMap((r,i)=>r.map((v,j)=>v*direction[i][j])).reduce((a,b)=>a+b,0),'whole input directional derivative');
}
const one=attention(multiply(initialPrompt,WK),multiply(initialPrompt,WV));
const duplicate=[...initialPrompt,...initialPrompt];
const two=attention(multiply(duplicate,WK),multiply(duplicate,WV));
check(two.output.some((v,i)=>Math.abs(v-2*one.output[i])>.01),'duplicate prompt output is not additive');
const projected=read('public/learn-assets/p-tuning-soft-prompt-methods/observations.json');
const raw=read('public/learn-code/p-tuning/results/study-evaluation.json');
for(const run of projected.runs){
  for(const row of run.examples){
    assert.deepEqual(row.generation,raw.results[run.key].generation.rows.find(r=>r.id===row.id));
    assert.deepEqual(row.candidate,raw.results[run.key].constrained.rows.find(r=>r.id===row.id));
    checks.push(`complete saved generation/candidate ${run.key}/${row.id}`);
  }
  for(const row of run.history){close(row.dev.nll_sum/row.dev.targets,row.dev.nll,'dev denominator');check(row.dev.nll>=.3&&row.dev.nll<=9,'all observed points inside log-plot extent');}
}
const composition=read(`${folder}/runtime-delivery-composition.json`);
for(const row of composition.browser_predecessor_resolution)check(sha(row.resolved)===row.sha256,`source-resolved browser predecessor ${row.report}/${row.source}`);
const index=read(`${folder}/root-review-paint/index.json`);
for(const[p,h]of Object.entries(index.sources))check(sha(p)===h,`paint input ${p}`);
for(const[p,h]of Object.entries(read(packet).files))assert.equal(sha(p),h,p);
const output={status:'passed',reviewer:'root',author:'training_author',conditions:checks.length,checks,
  fits:0,optimizerSteps:0,neuralGenerations:0,
  personallyReadPaint:index.atlases.map(r=>({path:r.path,sha256:sha(r.path)})),
  paintScope:'All34 atlases:26 mechanisms at desktop and phone; ten complex mechanisms at enlarged text; seven changed boundary states and all12 open practices. Not every horizontal pan, author capture or prose pixel.',
  openFindings:['P21 cache strip uses step+3 and minimum-width label boxes rather than represented cache counts; separate a count-accurate drawing from labels and explicitly identify correct-run saved outputs in the constructed bug state.','P03 merged input matrix loses the pink/blue source correspondence. Preserve row-role colours through concatenation.']};
fs.writeFileSync(`${folder}/runtime-root-checks.json`,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({conditions:checks.length,paint:index.atlases.length,openFindings:output.openFindings.length}));
