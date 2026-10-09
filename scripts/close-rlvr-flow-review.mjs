import fs from 'node:fs';
import crypto from 'node:crypto';
import {transform} from 'esbuild';
const base='docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/runtime-independent-preparation';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const packet=JSON.parse(fs.readFileSync(`${base}/author-flow-corrections.json`));
const checks=[];
function check(name,ok){checks.push({name,passed:!!ok});}
for(const [path,sha] of Object.entries(packet.inputs))check(`guard ${path}`,hash(fs.readFileSync(path))===sha);
const before=fs.readFileSync(`${base}/flow-source/rlvr-models.js`,'utf8');
const after=fs.readFileSync('src/learn/data/rlvr-models.js','utf8');
// All module declarations were read: each exported declaration starts at column zero.
function exportsOf(source){const matches=[...source.matchAll(/^export (?:function|const) (\w+)/gm)];return matches.map((m,i)=>[m[1],source.slice(m.index,matches[i+1]?.index??source.length)]);}
const newer=new Map(exportsOf(after));
for(const [name,source] of exportsOf(before)){
 const a=await transform(source,{minify:true,target:'esnext'}),b=await transform(newer.get(name),{minify:true,target:'esnext'});
 check(`existing model export conserved ${name}`,a.code===b.code);
}
const M=await import(`data:text/javascript;base64,${Buffer.from(after).toString('base64')}`);
check('valid proof reconstructs implication',JSON.stringify(M.proofCase().derived)==='["implies",["and","P","Q"],["and","Q","P"]]');
check('left twice valid different consequence',JSON.stringify(M.proofCase('left').derived)==='["implies",["and","P","Q"],["and","P","P"]]'&&!M.proofCase('left').accepted);
check('missing binder stops reconstruction',M.proofCase('scope').derived===null&&M.proofCase('scope').reason.includes('out of scope'));
for(const [name,proof] of [['atomic elimination',['and-left',['assume','a']]],['unknown rule',['invent','P']]]){
 let rejected=false;try{M.deriveProof(proof,{a:'P'});}catch{rejected=true;}check(name,rejected);
}
// New finite calculation only. Deliberately chosen tape permits direct independent checks.
const tape=Array.from({length:24},()=>[.25,.1,.3,.6,.9]).flat();
for(const strategy of ['uniform','easy-first','mixed-rate'])for(const theta of [-2,0,2])for(const offset of [-4,-2,0]){
 const r=M.finiteScheduler(strategy,tape,theta,[offset,1]);
 check(`scheduler length ${strategy}/${theta}/${offset}`,r.history.length===24&&r.task_counts.reduce((a,b)=>a+b,0)===24);
 let previous=theta;
 for(const row of r.history){
  const k=row.outcomes.reduce((a,b)=>a+b,0);
  // Sum centred Bernoulli scores /4 = k(4-k)/16, independent of p after centring.
  check(`finite coefficient ${strategy}/${theta}/${offset}/${row.step}`,Math.abs(row.same_group_logit_gradient-k*(4-k)/16)<1e-12);
  check(`finite update ${strategy}/${theta}/${offset}/${row.step}`,Math.abs(row.theta_before-previous)<1e-12&&Math.abs(row.theta_after-previous-.15*k*(4-k)/16)<1e-12);
  check(`finite probabilities ${strategy}/${theta}/${offset}/${row.step}`,row.probabilities.every((p,i)=>Math.abs(p-1/(1+Math.exp(-(previous+[offset,1][i]))))<1e-12));
  previous=row.theta_after;
 }
}
const snap=`${base}/flow-successor-source`;
fs.mkdirSync(snap,{recursive:true});
for(const path of Object.keys(packet.inputs).filter(p=>p.startsWith('src/')))fs.copyFileSync(path,`${snap}/${path.split('/').at(-1)}`);
const result={scope:'same preliminary source closure; no whole runtime acceptance',checks:checks.length,passed:checks.every(c=>c.passed),conditions:checks,sourceHashes:packet.inputs,scientificReplays:0,browserChecks:0};
fs.writeFileSync(`${base}/flow-closure-checks.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,checks:checks.length,failures:checks.filter(c=>!c.passed)}));
if(!result.passed)process.exitCode=1;
