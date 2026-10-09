import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as m from '../src/learn/data/curation-pipeline-models.js';

const checks=[];
function check(name, condition, actual){assert.ok(condition,name);checks.push({name,actual,passed:true});}
const close=(a,b)=>Math.abs(a-b)<1e-12;
let r=m.repetition('aaaa\nb\naaaa');
check('Initial repetition units',r.duplicateLines===1&&r.duplicateCharacters===4&&close(r.characterShare,4/9),r);
r=m.repetition('aaaaaaaa\nb\naaaaaaaa');
check('Changed lengths conserve line incidence',close(r.lineShare,1/3)&&close(r.characterShare,8/17));
check('Empty quarantine',m.repetition(' \n\t').characterShare===null);
check('Unicode code points, not UTF16 units',m.repetition('😀\n😀').characters===2);
const reference=m.reference('general');
check('Reference normalization',close(reference.probabilities.reduce((a,b)=>a+b,0),1)&&reference.denominator===12);
check('Unknown spellings share one bucket',close(m.surprise('new spellings',reference).mean,Math.log(12)));
check('Per-word loss and exponent',close(m.surprise('pendulum energy',reference).perplexity,Math.sqrt(72)));
check('Empty word average',m.surprise('',reference).mean===null);
const step=m.gradientStep(), zero=m.gradientStep({rate:0});
check('Constructed readout',close(step.z,.18)&&close(step.p,.5448788923735801));
check('Rate zero null',close(zero.next[0],.4)&&close(zero.next[1],-.2)&&close(zero.nextBias,.1)&&close(zero.nextProbability,zero.p));
const eps=1e-6;
for(let i=0;i<2;i++){
  const plus=[.4,-.2],minus=[.4,-.2];plus[i]+=eps;minus[i]-=eps;
  const fd=(m.gradientStep({w:plus}).loss-m.gradientStep({w:minus}).loss)/(2*eps);
  check(`Gradient coordinate${i}`,Math.abs(fd-step.gradient[i])<1e-9,fd);
}
const rows=[{id:'A',score:.95,label:1},{id:'B',score:.8,label:1},{id:'C',score:.75,label:0},{id:'D',score:.7,label:1}];
check('Raising threshold can lower precision',close(m.metrics(rows,m.select(rows,'threshold',.7)).precision,.75)&&close(m.metrics(rows,m.select(rows,'threshold',.75)).precision,2/3));
check('Empty selection precision undefined',m.metrics(rows,[]).precision===null&&m.metrics(rows,[]).recall===0);
check('Stable tied count',m.select([{id:'Z',score:.8},{id:'A',score:.8}],'count',1)[0].id==='A');
check('Nearest even clamping and boundaries',[2.49,2.5,2.52,3,-1,6].map(x=>m.neuralPolicy(x).integer).join(',')==='2,2,3,3,0,5');
check('Connected bridge merges whole components',m.connectedGroups(['A','B','C'],[['A','B'],['B','C']]).length===1);
check('Rank ties average',close(m.rankPercentiles({A:2,B:2,C:1}).A,.75));
check('Conditional work',m.costLedger(1000,[1,10],[.2,.5]).total===3000&&m.costLedger(1000,[10,1],[.5,.2]).total===10500);
const observed=JSON.parse(fs.readFileSync('src/learn/data/curation-pipeline-recorded-study.json'));
const full=JSON.parse(fs.readFileSync('public/learn-code/data-curation-pipelines/study.json'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
check('Exact measured source binding',observed.sourceSha256===hash('public/learn-code/data-curation-pipelines/study.json'));
assert.deepEqual(observed.predictions,full.predictions.filter(row=>row.split==='final'));
check('All424 unchanged final rows',observed.predictions.length===424);
for(const policy of ['scratch','library','constant'])for(let i=0;i<17;i++){
  const threshold=(10+5*i)/100, rows=observed.predictions.map(row=>({...row,score:row[policy]}));
  const measured=m.metrics(rows,m.select(rows,'threshold',threshold));
  const expected=full.grid[policy].final.find(row=>close(row.threshold,threshold));
  for(const key of ['tp','fp','fn','tn','precision','recall','f1','brier']) assert.ok(expected[key]===null?measured[key]===null:close(expected[key],measured[key]),`${policy}/${threshold}/${key}`);
  checks.push({name:`Saved ${policy} final threshold${threshold}`,passed:true});
}
const files=['src/learn/data/curation-pipeline-models.js','src/learn/data/curation-pipeline-recorded-study.json','src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering/lesson.jsx'];
const report={checks,files:Object.fromEntries(files.map(p=>[p,hash(p)])),scope:'Runtime model checks and unchanged saved measurements; no refits'};
fs.writeFileSync('docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering/runtime-model-checks.json',JSON.stringify(report,null,2)+'\n');
console.log(`${checks.length} curation runtime conditions passed`);
