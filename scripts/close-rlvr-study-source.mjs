import fs from 'node:fs';
import crypto from 'node:crypto';
import {transform} from 'esbuild';
const topic='docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const out=`${topic}/runtime-independent-preparation/study-closure`;
fs.mkdirSync(out,{recursive:true});
const packet=JSON.parse(fs.readFileSync(`${topic}/runtime-study-corrections/source-inputs.json`));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
function check(name,ok){checks.push({name,passed:!!ok});}
for(const row of packet.bindings)check(`exact source ${row.path}`,hash(fs.readFileSync(row.path))===row.sha256);
const old=fs.readFileSync(`${topic}/runtime-independent-preparation/flow-successor-source/RLVRStudyFigures.jsx`,'utf8');
const current=fs.readFileSync('src/learn/components/lesson-labs/RLVRStudyFigures.jsx','utf8');
function pieces(s){const a=[...s.matchAll(/^export function (\w+)/gm)];return a.map((m,i)=>[m[1],s.slice(m.index,a[i+1]?.index??s.length)]);}
const before=new Map(pieces(old)),changed=[];
for(const [name,source] of pieces(current)){
 const a=(await transform(source,{loader:'jsx',minify:true})).code,b=(await transform(before.get(name),{loader:'jsx',minify:true})).code;
 if(a!==b)changed.push(name);
}
check('only requested three study exports changed',JSON.stringify(changed)===JSON.stringify(['RolloutReuseAndUpdate','PaperProtocolComparison','WorkAndMetricLedger']));
const data=JSON.parse(fs.readFileSync('public/learn-assets/rlvr/train-17-verified-sample-sft.json'));
check('saved SFT step1 skip has no target rows',data.steps[0].update.updates===0&&data.steps[0].update.accepted_ids.length===0);
const update=data.steps[1].update;
check('saved SFT step2 included-target addresses aligned',update.updates===1&&update.accepted_ids.length===update.target_counts.length&&update.target_counts.every(n=>n>0));
for(const path of ['src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/rlvr-flow.css'])fs.copyFileSync(path,`${out}/${path.split('/').at(-1)}`);
const report={passed:checks.every(c=>c.passed),checks,changedExports:changed,sourcePacketSha256:hash(fs.readFileSync(`${topic}/runtime-study-corrections/source-inputs.json`)),scientificReplays:0,paintAcceptance:false};
fs.writeFileSync(`${out}/source-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,checks:checks.length,changed}));if(!report.passed)process.exitCode=1;
