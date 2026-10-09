import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
const dir='docs/teaching/llm-architecture-training/grpo-rloo-kto-advanced-preference-methods';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=JSON.parse(fs.readFileSync(`${dir}/content-inputs.json`));
assert.equal(sha(`${dir}/content-inputs.json`),'108d70ffa55f1b58adc7224a566e05d3ea91980042eee6cd5fde8e61ccccadb8');
for(const[p,h]of Object.entries(packet.inputs))assert.equal(sha(p),h,p);
let conditions=0;const close=(a,b,tol=2e-12)=>{assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);conditions++};
const sum=a=>a.reduce((x,y)=>x+y,0);
for(const p of [[.2,.3,.5],[.7,.2,.1],[0,.5,.5]])for(const r of [[0,1,2],[-2,1,0],[3,3,3]])for(const G of [2,3,4]){
 const J=sum(p.map((x,i)=>x*r[i])),target=p.map((x,i)=>x*(r[i]-J));
 const means=Object.fromEntries(['plain','self','loo','constant'].map(k=>[k,p.map(()=>0)]));
 for(let n=0;n<3**G;n++){
  let tmp=n;const ids=Array.from({length:G},()=>{const j=tmp%3;tmp=Math.floor(tmp/3);return j});
  const mass=ids.reduce((v,i)=>v*p[i],1),rs=ids.map(i=>r[i]),mean=sum(rs)/G;
  for(let k=0;k<3;k++)for(let i=0;i<G;i++){
   const score=+(ids[i]===k)-p[k],base=mass*score/G;
   means.plain[k]+=base*rs[i];means.self[k]+=base*(rs[i]-mean);
   means.loo[k]+=base*(rs[i]-(sum(rs)-rs[i])/(G-1));means.constant[k]+=base*(rs[i]-10);
  }
 }
 for(let k=0;k<3;k++){close(means.plain[k],target[k]);close(means.loo[k],target[k]);close(means.constant[k],target[k]);close(means.self[k],(G-1)/G*target[k]);}
}
// Complementary weighted-KL derivative cases, including coefficient one.
for(const [l,h,o]of [[0,Math.log(2),0],[-.7,-1.1,-.4],[0,0,0]]){
 const f=x=>Math.exp(x-o)*(Math.exp(h-x)-(h-x)-1),e=1e-5;
 const v=Math.exp(h-l),k=v-(h-l)-1;
 close((f(l+e)-f(l-e))/(2*e),Math.exp(l-o)*(k+1-v),3e-10);
}
const pbase='public/learn-code/grpo-rloo-kto/evidence';
const finite=JSON.parse(fs.readFileSync(`${pbase}/finite/report.json`));
assert.equal(finite.rows.length,32);
for(const row of finite.rows){const m=Math.max(...row.candidate_logp),w=row.candidate_logp.map(v=>Math.exp(v-m)),s=sum(w);row.restricted_probabilities.forEach((v,i)=>close(v,w[i]/s));}
for(const kind of ['scratch-grpo','scratch-rloo','native-grpo','native-rloo','native-kto']){
 const r=JSON.parse(fs.readFileSync(`${pbase}/${kind}/report.json`));assert.equal(r.reload_exact,true);conditions++;
}
parse(fs.readFileSync(`${dir}/manuscript.jsx`,'utf8'),{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(`${dir}/content-root-checks.json`,JSON.stringify({passed:true,conditions,guards:Object.keys(packet.inputs).length,files:packet.inputs,scope:'Different whole manuscript and new practice-source reading composed with earlier complete prospective program review; additional independent enumeration, saved-probability reconstruction and KL derivative checks. No model inference, fitting or scientific replay.'},null,2)+'\n');
console.log(JSON.stringify({passed:true,conditions,guards:Object.keys(packet.inputs).length}));
