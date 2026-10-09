import fs from 'node:fs';import crypto from 'node:crypto';
const folder='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const original=JSON.parse(fs.readFileSync(`${folder}/program-inputs.json`));
const files={};
for(const p of Object.keys(original.files))files[p]=sha(p);
const retained=JSON.parse(fs.readFileSync(`${folder}/program-r1-predecessor/retained.json`));
for(const[p,h]of Object.entries(retained)){if(sha(p)!==h)throw Error(p);files[p]=h;}
for(const[p,h]of Object.entries(original.installed_sources)){if(sha(p)!==h)throw Error(p);}
for(const p of ['public/learn-code/dapo/scientific_journal.py','scripts/preserve-dapo-program-r1.mjs','scripts/check-dapo-retention.py','scripts/freeze-dapo-program-r1.mjs',
 `${folder}/program-r1-retention-checks.json`,`${folder}/program-r1-author-closure.md`,`${folder}/program-review-inputs.json`,`${folder}/program-review.md`,`${folder}/program-review-checks.json`,`${folder}/program-inputs.json`,`${folder}/program-r1-predecessor/retained.json`])files[p]=sha(p);
const check=JSON.parse(fs.readFileSync(`${folder}/program-r1-retention-checks.json`));
if(!check.passed)throw Error('Synthetic check failed');
for(const[p,h]of Object.entries(check.inputs))if(sha(p)!==h)throw Error('Post-check change: '+p);
const destination=`${folder}/program-r1-inputs.json`;
fs.writeFileSync(destination,JSON.stringify({status:'R1 successor awaiting same different reviewer closure; no scientific execution',files,installed_sources:original.installed_sources,budget:original.budget,retention_conditions:check.conditions,language_models:0,optimizer_steps:0},null,2)+'\n',{flag:'wx'});
console.log({sha256:sha(destination),files:Object.keys(files).length,installed_sources:Object.keys(original.installed_sources).length});
