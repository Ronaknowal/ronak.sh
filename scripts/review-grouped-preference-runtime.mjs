import fs from 'node:fs';
import crypto from 'node:crypto';
import * as m from '../src/learn/data/grouped-preference-models.js';
const checks=[];
function near(a,b,label,tolerance=1e-7){if(!Number.isFinite(a)||Math.abs(a-b)>tolerance)throw Error(`${label}: ${a} versus ${b}`);checks.push(label);}
const central=(f,x)=>(f(x+1e-5)-f(x-1e-5))/2e-5;
const p=[.11,.37,.52],r=[-2,.4,1.8];
const target=p.map((v,i)=>v*(r[i]-p.reduce((s,q,j)=>s+q*r[j],0)));
for(const g of [2,3,4]){
  for(const method of ['reinforce','constant','loo','corrected','self_mean']){
    const d=m.distribution(p,r,g,method,-.7);
    near(d.groups.reduce((s,x)=>s+x.probability,0),1,`${g}/${method} total probability`);
    d.mean_gradient.forEach((x,i)=>near(x,target[i]*(method==='self_mean'?(g-1)/g:1),`${g}/${method}/coordinate${i} independent analytic target`));
    const directMSE=d.groups.reduce((s,x)=>s+x.probability*x.gradient.reduce((t,v,i)=>t+(v-target[i])**2,0),0);
    near(directMSE,d.mse,`${g}/${method} direct squared error matches decomposition`);
  }
}
for(const a of [-2,0,3])for(const ratio of [.3,.9,1,1.5]){
  const value=m.clipped(ratio,a,.2);
  near(central(x=>m.clipped(x,a,.2).surrogate,ratio),value.derivative,`signed clip central derivative ${a}/${ratio}`);
}
for(const distance of [-7,-.8,.7,6])for(const beta of [.1,.5,2]){
  const u=m.utility(distance,.2,beta,1.5,.6);
  near(central(x=>m.utility(x,.2,beta,1.5,.6).desirable,distance),u.desirableGradient,`KTO desirable derivative ${distance}/${beta}`);
  near(central(x=>m.utility(x,.2,beta,1.5,.6).undesirable,distance),u.undesirableGradient,`KTO undesirable derivative ${distance}/${beta}`);
}
for(const weighted of [false,true])for(const current of [-2,-1,-.2]){
  const d=m.penaltyDerivative(current,-1.4,-.5,weighted);
  near(central(x=>m.penaltyDerivative(x,-1.4,-.5,weighted).value,current),d.derivative,`KL path derivative ${weighted}/${current}`);
}
const kl=m.sampledKL(p,[.2,.3,.5]);
near(kl.sampled,kl.exact,'complete current-weighted k3 value identity');
const standard=m.standardize([1,null,3,null]);
near(standard.center,2,'missing rewards do not become zero observations');
near(standard.variance,2,'sample spread counts only two observed rewards');
if(standard.values[1]!==null||m.advantages([2],'loo')!==null)throw Error('Missing/singleton semantics');
checks.push('missing observations and undefined singleton LOO preserved');
const equal=m.distribution([.3,.7],[1,1],4,'loo');
near(equal.mse,0,'constant reward LOO null');
const reductions=m.reductions([[2,2,2],[-1,-1,-1,-1,-1,-1,-1,-1,-1]],12);
near(reductions[0].value,.5,'signed unequal-length response mean');
near(reductions[1].value,-.25,'signed unequal-length token mean');
const source='src/learn/data/grouped-preference-models.js';
const files=Object.fromEntries([source,'scripts/review-grouped-preference-runtime.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const output='docs/teaching/llm-architecture-training/grpo-rloo-kto-advanced-preference-methods/runtime-root-math-checks.json';
fs.writeFileSync(output,JSON.stringify({passed:true,conditions:checks.length,checks,files,scope:'Complementary independent analytic expectations and central-difference gradients; no model execution or scientific replay.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,conditions:checks.length}));
