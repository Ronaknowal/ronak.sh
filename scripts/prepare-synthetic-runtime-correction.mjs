import fs from 'node:fs';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const root='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(`${root}/runtime-inputs.json`),'6bcadc87727fa7f008b9c3a48c388e8eefc65baac66acdf04be8f84c7295d4a8');
const previous=JSON.parse(fs.readFileSync(`${root}/runtime-inputs.json`)),bindings={...previous.bindings};
const replacements={'src/learn/components/lesson-labs/SyntheticDataFlow.jsx':`${root}/runtime-review-predecessor/SyntheticDataFlow.jsx`,'src/learn/components/lesson-labs/synthetic-data-flow.css':`${root}/runtime-review-predecessor/synthetic-data-flow.css`};
for(const[p,h]of Object.entries(bindings))assert.equal(sha(replacements[p]||p),h,p);
for(const[p,old]of Object.entries(replacements)){bindings[old]=bindings[p];bindings[p]=sha(p)}
const add=p=>bindings[p]=sha(p);
for(const p of [`${root}/runtime-inputs.json`,`${root}/runtime-review-predecessor/runtime-inputs.json`,`${root}/runtime-review.md`,`${root}/runtime-review-inputs.json`,`${root}/runtime-author-correction.md`,'scripts/verify-synthetic-review-closure.cjs','scripts/prepare-synthetic-runtime-correction.mjs',`${root}/browser-review-closure/report.json`])add(p);
for(const p of JSON.parse(fs.readFileSync(`${root}/browser-review-closure/report.json`)).captures)add(p);
for(const[p,h]of Object.entries(bindings))assert.equal(sha(p),h,p);
fs.writeFileSync(`${root}/runtime-correction-inputs.json`,JSON.stringify({author:'root',status:'ready-for-same-reviewer-bounded-closure',predecessorBindings:Object.keys(previous.bindings).length,changedFiles:Object.keys(replacements),scientificFitsRerun:0,bindings},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({bindings:Object.keys(bindings).length,sha256:sha(`${root}/runtime-correction-inputs.json`)}));
