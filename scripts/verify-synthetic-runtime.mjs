import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/synthetic-data-models.js';
const folder='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const checks=[]; let assertions=0;
const ok=(condition,message)=>{assert.ok(condition,message); assertions++;};
const close=(a,b,tolerance=1e-12)=>Math.abs(a-b)<tolerance;
const sum=values=>values.reduce((a,b)=>a+b,0);
const group=(name,run)=>{const before=assertions;run();checks.push({name,assertions:assertions-before});};
group('Nucleus support, renormalization, temperature and positive-support CDF',()=>{
  const q=m.sampling();ok(close(q.nucleus[0],.6875)&&close(q.nucleus[1],.3125),'worked nucleus');
  for(const t of [.2,.3,.8,1,1.7,2])for(const p of [.1,.3,.6,.8,.9,1]){
    const state=m.sampling(m.BASE,t,p);ok(close(sum(state.nucleus),1),'normalized retained mass');
    ok(state.retainedMass+1e-15>=p,'crossing token retained');
    if(state.kept.length>1)ok(state.retainedMass-state.probabilities[state.kept.at(-1)]<p+1e-15,'minimal prefix');
    for(let k=0;k<100;k++){const u=k/100,token=m.inverseCDF(state.nucleus,u);ok(state.nucleus[token]>0,'only positive support');}
  }
  assert.deepEqual(m.sequence([.8,.8,.9]).rows.map(r=>r.token),[1,3]);assertions++;
  for(const [q,u,expected] of [[[0,.2,.8,0],0,1],[[0,.2,.8,0],.2,2],[[...Array(10).fill(.1),0],1-Number.EPSILON/2,9]])ok(m.inverseCDF(q,u)===expected,'half-open boundary and trailing-zero correction');
  for(const bad of [[],[0,0],[-1,2],[NaN,1],[[1]], [.5,.2]]){assert.throws(()=>m.inverseCDF(bad,.2));assertions++;}
});
group('Filtering, category support, family concentration and retry cost',()=>{
  const s=m.selection();ok(close(s.tp,.54)&&close(s.fp,.08)&&close(s.precision,27/31),'54 of62');
  for(let c=0;c<=10;c++)for(let t=0;t<=10;t++)for(let f=0;f<=10;f++){
    const r=m.selection(c/10,t/10,f/10);ok(close(r.tp+r.fp+r.fn+r.tn,1),'confusion mass');
    ok(r.acceptance===0?r.precision===null:close(r.precision*r.acceptance,r.tp),'precision denominator');
  }
  assert.deepEqual(m.selectedMass([.6,.3,.1],[1,.5,0]).conditional,[.7999999999999999,.19999999999999998,0]);assertions++;
  ok(close(m.familyExposure(3).effective,1.6)&&close(m.familyExposure(1).effective,2),'family count');
  ok(close(m.costLedger().perKeep,5/62)&&m.costLedger(.04,.01,0).perKeep===null,'retry expense');
});
group('Corpus accounting and causal byte windows',()=>{
  const root='public/learn-code/synthetic-data/';
  const sources=JSON.parse(fs.readFileSync(root+'source-records.json'));
  const study=JSON.parse(fs.readFileSync(root+'study.json'));
  const selection=JSON.parse(fs.readFileSync(root+'selection.json'));
  const raw=sources.records.filter(r=>r.split==='train');
  ok(raw.length===17&&sum(raw.map(r=>m.windows(r.text).bytes.length))===8636,'actual original pool');
  ok(sum(raw.map(r=>m.windows(r.text).count))===8092,'actual original window starts');
  ok(study.generated.records===32&&sum(study.generated.record_bytes.map(length=>Math.max(0,length-32)))===2927,'actual generated pool');
  ok(selection.ledger.length===34&&selection.ledger.filter(r=>r.accepted).length===32,'all decisions retained');
  ok(m.windows('é'.repeat(20)).count===8,'UTF8 rather than character count');
  for(const alpha of [0,.5,1]){
    const batch=m.mixBatch(alpha);ok(batch.length===16&&batch.every(r=>r.rank>=0&&r.rank<1),'draw ranges');
    if(alpha!==.5)ok(batch.every(r=>r.generated===Boolean(alpha)),'mixture endpoints');
  }
  const bytes=m.windows(raw[0].text).bytes.slice(0,33);const changed=[...bytes];changed[32]=65;
  for(let target=0;target<32;target++)ok(JSON.stringify(bytes.slice(0,target+1))===JSON.stringify(changed.slice(0,target+1)),'future byte cannot enter earlier prefix');
});
group('All recorded student displays recomputed without fitting',()=>{
  const root='public/learn-code/synthetic-data/';
  const study=JSON.parse(fs.readFileSync(root+'study.json')),audit=JSON.parse(fs.readFileSync(root+'audit.json'));
  for(const fit of study.fits)for(const point of fit.history){
    ok(sum(point.paragraphs.map(p=>p.targets))===1862,'same heldout denominator');
    ok(close(sum(point.paragraphs.map(p=>p.nll_sum))/1862,point.byte_nll),'pooled measured NLL');
    for(const p of point.paragraphs)ok(close(p.nll_sum/p.targets,p.mean_nats),'per paragraph display');
  }
  for(const pair of audit.pairs){
    const fits=study.fits.filter(f=>f.seed===pair.seed);
    const raw=fits.find(f=>f.arm==='raw'),copy=fits.find(f=>f.arm==='copy'),generated=fits.find(f=>f.arm==='generated');
    ok(raw.initial_weight_sha256===generated.initial_weight_sha256,'paired initialization');
    ok(raw.final_weight_sha256===copy.final_weight_sha256,'copy null');
    ok(close(generated.history.at(-1).byte_nll-raw.history.at(-1).byte_nll,pair.generated_minus_raw),'paired difference');
  }
  ok(close(sum(audit.pairs.map(r=>r.generated_minus_raw))/3,audit.mean_paired_difference),'mean difference');
  for(const arm of study.inspector){ok(arm.rows.length===16,'all declared inspection positions');for(const row of arm.rows){ok(row.probabilities.length===256,'full head');ok(close(sum(row.probabilities),1,3e-7),'measured float32 normalization');ok(row.probabilities.every(p=>p>0&&p<1),'valid measured probabilities');}}
});
group('Recursive count conservation, support loss, retained anchors and exact expectations',()=>{
  for(const rule of ['replace','anchor','accumulate','fresh'])for(const seed of [1,17,29]){
    const path=m.populationPath({rule,seed});
    for(let g=0;g<path.length;g++){
      const row=path[g];ok(sum(row.counts)===10&&close(sum(row.distribution),1),'population and probability conservation');
      ok(close(row.H,1-sum(row.distribution.map(p=>p*p))),'diversity definition');
      ok(row.stored===(g===0?10:rule==='accumulate'?(g+1)*10:rule==='anchor'?20:10),'honest physical storage');
      if(g&&rule==='replace')for(let i=0;i<3;i++)if(path[g-1].distribution[i]===0)ok(row.counts[i]===0,'extinction absorbing');
      if(rule==='anchor')for(let i=0;i<3;i++)ok(row.distribution[i]>=.5*[.6,.3,.1][i]-1e-15,'original support floor');
    }
  }
  for(const row of m.populationPath({rule:'anchor',alpha:0}))assert.deepEqual(row.distribution,[.6,.3,.1]);assertions+=21;
  const q=[.6,.3,.1];let replacement=0,accumulation=0;
  for(let a=0;a<3;a++)for(let b=0;b<3;b++){
    const empirical=q.map((_,i)=>((a===i)+(b===i))/2),mass=q[a]*q[b];
    replacement+=mass*m.heterozygosity(empirical);accumulation+=mass*m.heterozygosity(empirical.map((p,i)=>(p+q[i])/2));
  }
  ok(close(replacement,m.expectedH('replace',2,1)[1]),'enumerated exact replacement expectation');
  ok(close(accumulation,m.expectedH('accumulate',2,1)[1]),'enumerated exact growing-pool expectation');
});
const files=[`${folder}/lesson.jsx`,'src/learn/components/lesson-labs/SyntheticDataFlow.jsx','src/learn/components/lesson-labs/synthetic-data-flow.css','src/learn/data/synthetic-data-models.js',...['study.json','audit.json','source-records.json','candidates.json','selection.json'].map(f=>'public/learn-code/synthetic-data/'+f)];
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(`${folder}/runtime-model-checks.json`,JSON.stringify({checks,assertions,files:Object.fromEntries(files.map(f=>[f,sha(f)])),fits:0,scope:'New runtime mathematics and exact recorded-data display accounting; no replay of frozen scientific campaign'},null,2)+'\n');
console.log(`${assertions} assertions across ${checks.length} runtime groups`);
