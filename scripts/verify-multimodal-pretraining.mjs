import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/multimodal-pretraining-models.js';
const root='docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const study=read('public/learn-code/multimodal-pretraining/scratch-study.json');
const native=read(`${root}/native/interfaces.json`);
let conditions=0,maxSavedScoreError=0;
function check(ok,message){assert.ok(ok,message);conditions++;}
function near(a,b,tol=1e-10,message='numeric equality'){check(Math.abs(a-b)<=tol,`${message}: ${a} vs ${b}`);}
function arrays(a,b,tol=1e-10){a.flat(Infinity).forEach((x,i)=>near(Number(x),Number(b.flat(Infinity)[i]),tol));}
near(m.paired(m.BASE_SCORES).loss,.2691454922469161);
near(m.alignmentStep(.05).after.loss,.2577078742677159);
near(m.alignmentStep(0).after.loss,m.paired(m.BASE_SCORES).loss);
check(m.normalize([0,0])===null,'zero cosine invalid');
arrays(m.normalize([.6,.8]),m.normalize([6,8]));
check(m.paired([])===null,'empty paired invalid');
check(m.paired([[NaN]])===null,'nonfinite invalid');
near(m.paired([[9]]).loss,0);
arrays(m.paired([[9]]).gradient,[[0]]);
near(m.paired(Array.from({length:4},()=>Array(4).fill(0))).loss,Math.log(4));
near(m.paired([[1000,-1000],[-1000,1000]]).loss,0);
const g=m.paired(m.BASE_SCORES).gradient;
for(let i=0;i<3;i++)for(let j=0;j<3;j++){
 const shifted=delta=>m.BASE_SCORES.map((r,a)=>r.map((x,b)=>x+(a===i&&b===j?delta:0)));
 near((m.paired(shifted(1e-5)).loss-m.paired(shifted(-1e-5)).loss)/2e-5,g[i][j],1e-9,'logit finite difference');
}
const a=m.linearAlignment();
for(const key of ['wi','wt'])for(let i=0;i<2;i++)for(let j=0;j<2;j++){
 const weight=delta=>[[1,0],[0,1]].map((r,k)=>r.map((x,l)=>x+(k===i&&l===j?delta:0)));
 const run=delta=>key==='wi'?m.linearAlignment(weight(delta)):m.linearAlignment(undefined,weight(delta));
 near((run(1e-5).loss-run(-1e-5).loss)/2e-5,a[key][i][j],1e-8,'tower derivative');
}
const eye=m.BASE_SCORES.map((r,i)=>r.map((_,j)=>i===j));
near(m.positiveSet(m.BASE_SCORES,eye),m.paired(m.BASE_SCORES).loss);
near(m.positiveSet(m.BASE_SCORES,eye.map(r=>r.map(()=>true))),0);
check(m.positiveSet(m.BASE_SCORES,eye.map(r=>r.map(()=>false)))===null,'empty positives invalid');
near(m.sigmoidPairs(m.BASE_SCORES,eye,-1).loss,.8969771976188498);
near(m.softplus(1000),1000);near(m.softplus(-1000),0);
study.assessment_pixels.forEach((pixels,i)=>{
 const result=m.savedForward(study,pixels);
 const expected=study.final.assessment.scores[i];
 const error=Math.max(...result.scores.map((x,j)=>Math.abs(x-expected[j])));
 maxSavedScoreError=Math.max(maxSavedScoreError,error);
 check(error<4e-5,`full saved row ${i} score parity`);
 check(result.predicted===study.final.assessment.predictions[i],`full saved row ${i} prediction parity`);
 near(result.probabilities.reduce((s,v)=>s+v,0),1,1e-12);
});
const changed=[...study.assessment_pixels[0]];changed[study.controls.edited.pixel_index]=study.controls.edited.after * 16;
arrays(m.savedForward(study,changed).scores,study.controls.edited.edited_scores,4e-5);
const query=m.queryRead(1,-.8);arrays(query.weights,native.query.weights);arrays(query.output,native.query.output);
arrays(m.queryRead(1,3).output[0],query.output[0]);
check(m.queryRead(1,0,[[false,false,false,false],[true,true,true,true]])===null,'empty query invalid');
for(const mode of ['ITC','ITM','ITG'])arrays(m.qformerMask(mode),native.qformer_masks[mode]);
const count=m.detailCounts(280,420,14,32,80);
check(count.n===600&&count.vision===360000&&count.direct===462400&&count.queryPrefix===12544&&count.queryRead===19200,'all cost branches');
check(m.detailCounts(281,420,14,32,80)===null,'undeclared resize invalid');
const files=['src/learn/data/multimodal-pretraining-models.js','src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css','public/learn-code/multimodal-pretraining/scratch-study.json','public/learn-code/multimodal-pretraining/library-study.json','scripts/verify-multimodal-pretraining.mjs'];
const report={conditions,maxSavedScoreError,scope:'JavaScript mechanisms against independent retained NumPy/Torch outputs and numerical derivatives; no study refit.',files:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync(`${root}/native/runtime-model-checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
