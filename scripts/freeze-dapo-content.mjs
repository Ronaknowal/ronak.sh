import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dir='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files={};
const add=p=>files[p.replaceAll('\\','/')]=hash(p);
const visit=d=>{for(const item of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,item.name);if(item.isDirectory())visit(p);else add(p);}};
visit('public/learn-code/dapo');
add('public/learn-code/dapo-examples.zip');
for(const name of ['lesson.md','heading-compatibility.json','design.md','design-review-acceptance.json','design-review-closure.md','research-assessment.md','research-handoff.md','program-protocol.md','program-r1-inputs.json','program-review-r1-checks.json','program-review-r1-closure.md','unreached-continuation-inputs.json','unreached-continuation-review.json','author-content-review.md','content-observation-checks.json'])add(`${dir}/${name}`);
for(const name of ['execution-inputs.json','unreached-continuation-start.json','unreached-continuation-terminal.json'])add(`scratch/dapo-research/study/${name}`);
for(const p of ['scripts/run-dapo-study.py','scripts/continue-dapo-unreached.py','scripts/prepare-dapo-content-evidence.py','scripts/freeze-dapo-content.mjs','src/learn/data/topics/dapo.jsx'])add(p);
const observations=JSON.parse(fs.readFileSync(`${dir}/content-observation-checks.json`));
for(const [p,expected] of Object.entries(observations.source_observations)){if(hash(p)!==expected)throw Error(`Changed saved outcome ${p}`);add(p);}
for(const [p,expected] of Object.entries(observations.public_files)){if(hash(`public/learn-code/dapo/${p}`)!==expected)throw Error(`Changed public input ${p}`);}
const packet={
  topic:'dapo-dynamic-adaptive-policy-optimization',status:'Complete content proposal awaiting different review; runtime not started',
  manuscriptSha256:hash(`${dir}/lesson.md`),
  scope:'Entire18-section manuscript/36visualcontracts/18workedpractices/12completeprograms and actual prescribed observations. Existing published source protected.',
  originalSource:'src/learn/data/topics/dapo.jsx',originalSourceSha256:hash('src/learn/data/topics/dapo.jsx'),
  evidenceBoundary:'Five complete scratch runs; combined73 interrupted on original score guard after2updates; separate native2updates. All prescribed outcomes retained, no retry/tolerance change. Runtime pending.',
  files,
};
const out=`${dir}/content-inputs.json`;
fs.writeFileSync(out,JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:out,sha256:hash(out),files:Object.keys(files).length,manuscriptSha256:packet.manuscriptSha256}));
