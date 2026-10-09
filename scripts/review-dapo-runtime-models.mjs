// Complementary runtime-only arithmetic. No language model or scientific replay.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/dapo-models.js';
const checks=[];
const check=(x,label)=>{assert.ok(x,label);checks.push(label);};
const near=(a,b,label,tolerance=1e-9)=>check(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tolerance,label);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const output=process.argv[2];
assert.ok(output,'Pass a new result path; receipts are never overwritten');
const input='src/learn/data/dapo-models.js',before=sha(input);

// A separately written signed piecewise oracle, followed by central differences
// in log ratio rather than differentiating the implementation's branch code.
function loss(r,a,high,dual){
  let value=a>=0 ? -a*Math.min(r,1+high) : -a*Math.max(r,.8);
  if(a<0&&dual!==null)value=Math.min(value,-dual*a);
  return value;
}
for(const a of [-2,-.5,0,.5,2])for(const high of [.2,.28])for(const dual of [null,10])for(const r of [.3,.79,.81,1,1.19,1.21,1.27,1.29,9.9,10.1,12]){
  const actual=m.clippedTerm(r,a,high,.2,dual),h=1e-6;
  near(actual.loss,loss(r,a,high,dual),`signed value a${a}/u${high}/c${dual}/r${r}`);
  const finite=(loss(r*Math.exp(h),a,high,dual)-loss(r*Math.exp(-h),a,high,dual))/(2*h);
  near(actual.derivative,finite,`logp central difference a${a}/u${high}/c${dual}/r${r}`,2e-7);
}
for(const [r,a,c,kink]of [[.8,-1,null,true],[1.28,1,null,true],[.8,1,null,false],[1.28,-1,null,false],[10,-1,10,true],[10,1,10,false]]){
  const actual=m.clippedTerm(r,a,.28,.2,c);
  check(actual.kink===kink&&(!kink||actual.derivative===null),`only active signed knees unavailable ${r}/${a}/${c}`);
}

for(const rewards of [[-1,-1,1,1],[1,1,1,1],[-1,-1,-1,-1],[0,2,2,2],[3,-2,1,4,0]]){
  const n=rewards.length,mean=rewards.reduce((s,x)=>s+x,0)/n;
  // Pairwise squared differences reconstruct sample variance independently.
  let pairSquares=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairSquares+=(rewards[i]-rewards[j])**2;
  const sd=Math.sqrt(pairSquares/(n*(n-1)));
  const actual=m.groupStatistics(rewards);
  near(actual.sd,sd,`pairwise sample SD ${rewards}`);
  near(actual.mean,mean,`group mean ${rewards}`);
  near(actual.advantages.reduce((s,x)=>s+x,0),0,`centered coefficient sum ${rewards}`);
  const transformed=m.groupStatistics(rewards.map(x=>3*x+7),3e-6);
  actual.advantages.forEach((x,i)=>near(x,transformed.advantages[i],`affine plus scaled epsilon ${rewards}/${i}`));
}
check(m.groupStatistics([1])===null,'one response is unavailable');
check(m.groupStatistics([1,NaN])===null,'nonfinite reward is unavailable');

// Recursive path probabilities provide a different construction from the
// closed-form homogeneous-event subtraction used by the runtime.
function enumerate(p,g,bits=[],mass=1){
  if(bits.length===g)return[{bits,mass,mixed:bits.some(Boolean)&&!bits.every(Boolean)}];
  return [...enumerate(p,g,[...bits,0],mass*(1-p)),...enumerate(p,g,[...bits,1],mass*p)];
}
for(const p of [0,.1,.25,.5,.9,1])for(const g of [2,3,4,8]){
  const paths=enumerate(p,g),actual=m.binaryPaths(p,g);
  near(paths.reduce((s,x)=>s+x.mass,0),1,`tree total p${p}/g${g}`);
  near(m.mixedProbability(p,g),paths.filter(x=>x.mixed).reduce((s,x)=>s+x.mass,0),`enumerated mixed event p${p}/g${g}`);
  check(actual.length===paths.length&&actual.every((x,i)=>x.bits.join('')===paths[i].bits.join('')&&x.mixed===paths[i].mixed&&Math.abs(x.probability-paths[i].mass)<1e-14),`complete path objects p${p}/g${g}`);
}
const none=m.acceptedPopulation([.4,.6],[0,1],4);
check(none.accepted===null&&none.total===0,'zero accepted mass is unavailable');
const mixed=m.acceptedPopulation([.2,.3,.5],[0,.5,.9],2);
near(mixed.total,.24,'conditional accepted total');
for(const [i,x]of [0,.625,.375].entries())near(mixed.accepted[i],x,`selected population identity ${i}`);

for(const [name,batches,target,expected,status,generated]of [
  ['filled',1,2,[],'collecting',2],['filled',2,2,['P2'],'collecting',4],
  ['filled',3,2,['P2','P4'],'filled',6],['exhausted',3,2,['P2'],'exhausted',6],
  ['overflow',2,1,['P0'],'filled',2],
]){
  const actual=m.collectGroups(name,batches,target);
  check(actual.selected.join()===expected.join()&&actual.status===status&&actual.generated===generated,`bounded collector ${name}/${batches}/${target}`);
  check(actual.decisions.length===generated&&actual.decisions.every(x=>x.correct.length===4),`whole generated records ${name}/${batches}/${target}`);
}
const quota=m.collectGroups('filled',3,2).decisions.at(-1);
check(quota.mixed&&!quota.keep&&quota.reason==='quota full','last generated eligible group remains accounted but excluded');

const rows=[[2,2,2],[-1,-1,-1,-1,-1,-1,-1,-1,-1]].map(row=>row.map(value=>({value,selected:true})));
near(m.raggedLoss(rows,'response').loss,.5,'changed ragged response mean');
near(m.raggedLoss(rows).loss,-.25,'changed ragged pooled mean');
rows[0][0].selected=false;
near(m.raggedLoss(rows).loss,-5/11,'mask changes numerator and denominator');
check(m.raggedLoss([[{value:9,selected:false}]]).loss===null,'empty token selection unavailable');
check(m.raggedLoss([[],[{value:1,selected:true}]],'response').loss===null,'response-equal cannot average an empty response');
for(const [length,want]of [[0,0],[80,0],[90,-.25],[120,-1],[121,-1]])near(m.lengthPenalty(length,120,40),want,`length penalty ${length}`);

// Directly finite-difference logits while holding the old selected probability
// constant. This checks both the signed score derivative and softmax coupling.
for(const probs of [[.5,.3,.2],[.1,.9]])for(let chosen=0;chosen<probs.length;chosen++)for(const a of [-1,0,1])for(const ratio of [.7,1.1,1.4]){
  const result=m.probabilityStep(probs,chosen,a,.3,.28,ratio);
  const z=probs.map(Math.log),old=probs[chosen]/ratio,h=1e-6;
  for(let j=0;j<z.length;j++){
    const plus=z.map((v,k)=>v+(j===k?h:0)),minus=z.map((v,k)=>v-(j===k?h:0));
    const distribution=logits=>{const weights=logits.map(Math.exp),total=weights.reduce((s,x)=>s+x,0);return weights.map(x=>x/total);};
    const numeric=(loss(distribution(plus)[chosen]/old,a,.28,null)-loss(distribution(minus)[chosen]/old,a,.28,null))/(2*h);
    near(result.gradient[j],numeric,`coupled finite logit ${probs}/${chosen}/${a}/${ratio}/${j}`,2e-7);
  }
  near(result.after.reduce((s,x)=>s+x,0),1,`normalized step ${probs}/${chosen}/${a}/${ratio}`);
}
const trace=m.workedTrace(),a=1/(Math.sqrt(2)+1e-6);
near(trace.loss,-1.38*a/5,'whole worked trace value');
check(trace.rows[1][1].derivative===0,'positive clipped token carries no own gradient');
const homogeneous=m.workedTrace(1);
check(homogeneous.loss===0&&homogeneous.rows.flat().every(x=>x.derivative===0),'homogeneous full trace stays exactly zero');
for(const [text,want]of [[String.raw`\boxed{12} then \boxed{13}`,13],[String.raw`\boxed{\boxed{12}}`,12],[String.raw`\boxed{6+6}`,null],[String.raw`\boxed{12} then \boxed{`,null]])check(m.integerParser(text).value===want,`narrow last-marker extraction ${text}`);
check(sha(input)===before,'model source unchanged during probe');
fs.mkdirSync(output.slice(0,output.lastIndexOf('/')),{recursive:true});
fs.writeFileSync(output,JSON.stringify({at:new Date().toISOString(),passed:true,scope:'Preliminary complementary pure runtime arithmetic only; no source/paint or whole-runtime acceptance.',source:{[input]:before},checker:{['scripts/review-dapo-runtime-models.mjs']:sha('scripts/review-dapo-runtime-models.mjs')},conditions:checks.length,checks},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,conditions:checks.length,output}));
