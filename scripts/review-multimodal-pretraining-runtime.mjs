// Different reviewer: changed mechanisms, not another fit of the accepted study.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/multimodal-pretraining-models.js';

const base = 'docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment';
const conditions = [];
const check = (ok, name) => { assert.ok(ok, name); conditions.push(name); };
const near = (a, b, name, tolerance = 2e-7) => check(Math.abs(a-b) < tolerance, `${name}: ${a} / ${b}`);
const clone = a => a.map(r => [...r]);
const epsilon = 1e-5;
const changedScores = [[-1.2, 2.7, .4], [3.1, -.8, -2.3], [.5, 1.8, 2.2]];
const changed = m.paired(changedScores);
for (let i=0; i<3; i++) for (let j=0; j<3; j++) {
  const plus=clone(changedScores), minus=clone(changedScores);
  plus[i][j]+=epsilon; minus[i][j]-=epsilon;
  near((m.paired(plus).loss-m.paired(minus).loss)/(2*epsilon), changed.gradient[i][j], `changed score derivative ${i}/${j}`);
}
near(changed.gradient.flat().reduce((a,b)=>a+b,0),0,'global score shift has zero derivative');
near(m.paired(changedScores.map(r=>r.map(x=>x+123))).loss,changed.loss,'global additive invariance');
const perm=[2,0,1];
near(m.paired(perm.map(i=>perm.map(j=>changedScores[i][j]))).loss,changed.loss,'different simultaneous pair permutation');

const wi=[[.7,-.3],[.25,1.1]], wt=[[1.2,.4],[-.2,.65]], logScale=-.1;
const tower=m.linearAlignment(wi,wt,logScale);
for (const which of ['wi','wt']) for (let i=0;i<2;i++) for (let j=0;j<2;j++) {
  const plus=clone(which==='wi'?wi:wt),minus=clone(which==='wi'?wi:wt);
  plus[i][j]+=epsilon;minus[i][j]-=epsilon;
  const a=which==='wi'?m.linearAlignment(plus,wt,logScale):m.linearAlignment(wi,plus,logScale);
  const b=which==='wi'?m.linearAlignment(minus,wt,logScale):m.linearAlignment(wi,minus,logScale);
  near((a.loss-b.loss)/(2*epsilon),tower[which][i][j],`nonidentity ${which} derivative ${i}/${j}`);
}
near((m.linearAlignment(wi,wt,logScale+epsilon).loss-m.linearAlignment(wi,wt,logScale-epsilon).loss)/(2*epsilon),tower.da,'nonidentity learned scale derivative');
for(let i=0;i<3;i++) {
  near(m.dot(tower.drawU[i],tower.u[i]),0,`image radial component removed ${i}`);
  near(m.dot(tower.drawV[i],tower.v[i]),0,`caption radial component removed ${i}`);
}
const step=.005;
const next=m.linearAlignment(wi.map((r,i)=>r.map((v,j)=>v-step*tower.wi[i][j])),wt.map((r,i)=>r.map((v,j)=>v-step*tower.wt[i][j])),logScale-step*tower.da);
check(next.loss<tower.loss,'small descent improves changed nonidentity case');
const mask=[[true,true,false],[false,true,true],[true,false,true]];
const independentSetMass = (() => {
  const reductions=[];
  for(let i=0;i<3;i++) {
    const row=m.softmax(changedScores[i]);
    const col=m.softmax(changedScores.map(r=>r[i]));
    reductions.push(-Math.log(row.reduce((s,p,j)=>s+(mask[i][j]?p:0),0)));
    reductions.push(-Math.log(col.reduce((s,p,j)=>s+(mask[j][i]?p:0),0)));
  }
  return reductions.reduce((s,x)=>s+x,0)/6;
})();
near(m.positiveSet(changedScores,mask),independentSetMass,'set mass via direct probability summation');
check(m.positiveSet(changedScores,[[true,false,false],[true,false,false],[true,false,false]])===null,'empty column is invalid even if every row has a positive');
for(const x of [-1000,-40,0,40,1000]) check(Number.isFinite(m.softplus(x)),`stable softplus ${x}`);
const logistic=m.sigmoidPairs(changedScores,mask,.7);
near(logistic.loss,logistic.terms.flat().reduce((s,x)=>s+x,0)/3,'changed logistic divides by image count');
const other=clone(changedScores);other[2][1]+=4;
near(m.sigmoidPairs(other,mask,.7).terms[0][0],logistic.terms[0][0],'independent pair term has no softmax coupling');

const queryA=m.queryRead(-1.7,-2.4),queryB=m.queryRead(-1.7,2.6);
for(let c=0;c<2;c++) near(queryA.output[0][c],queryB.output[0][c],`blocked donor cannot affect query 0 channel ${c}`);
near(queryB.output[1][0]-queryA.output[1][0],5*queryA.weights[1][3],'allowed donor changes output by its exact share');
near(queryB.output[1][1],queryA.output[1][1],'value edit does not change other channel');
const allowed=[[true,true,false,true],[false,true,true,true]];
const qa=m.queryRead(-1.7,-2.4,allowed),qb=m.queryRead(-1.7,2.6,allowed);
near(qb.output[0][0]-qa.output[0][0],5*qa.weights[0][3],'opening donor permits the previously blocked contribution');
check(m.queryRead(1,0,[[false,false,false,false],[true,true,true,true]])===null,'empty query row yields explicit null');
for(const mode of ['ITC','ITM','ITG']) {
  const a=m.qformerMask(mode,3,4);
  for(let i=0;i<7;i++) for(let j=0;j<7;j++) {
    const expected=mode==='ITM'?true:mode==='ITC'?(i<3)===(j<3):i<3?j<3:j<3||j<=i;
    check(a[i][j]===expected,`changed 3-query/4-text ${mode} ${i}/${j}`);
  }
}
const count=m.detailCounts(224,336,16,12,25);
check(count.n===294 && count.vision===86436 && count.direct===101761 && count.queryPrefix===1369 && count.queryRead===3528 && count.memoryRead===300,'different geometry count');
check(m.detailCounts(225,336,16,12,25)===null,'nondivisible changed geometry');
const study=JSON.parse(fs.readFileSync('public/learn-code/multimodal-pretraining/scratch-study.json','utf8'));
for(const row of [0,19,73,119,199]) {
  const r=m.savedForward(study,study.assessment_pixels[row]);
  check(Math.max(...r.scores.map((s,j)=>Math.abs(s-study.final.assessment.scores[row][j])))<4e-5,`retained whole-MLP assessment score ${row}`);
  const dup=m.softmax([...r.scores,r.scores[7]]);
  near(dup[7],dup[10],`duplicate exact vector shares probability ${row}`);
  check(dup[7]<r.probabilities[7],`duplicate expands denominator ${row}`);
}
const sources=['scripts/review-multimodal-pretraining-runtime.mjs','src/learn/data/multimodal-pretraining-models.js','src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css',`${base}/manuscript.jsx`,`${base}/runtime-inputs.json`,'public/learn-code/multimodal-pretraining/scratch-study.json'];
const hashes=Object.fromEntries(sources.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const receipt={status:'passed',conditions:conditions.length,scope:'Different changed-score/nonidentity-tower finite differences, set-mass probabilities, donor interventions, larger masks, geometry and selected retained inference. No training rerun.',before:tower.loss,after:next.loss,conditionsDetail:conditions,files:hashes};
fs.writeFileSync(`${base}/runtime-review-probes.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,conditions:receipt.conditions,before:receipt.before,after:receipt.after,files:hashes},null,2));
