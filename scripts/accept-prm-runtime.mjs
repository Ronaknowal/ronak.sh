import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const id='process-reward-models-prm-vs-outcome-reward-models-orm';
const folder=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=`${folder}/runtime-context-math-successor/inputs.json`;
assert.equal(sha(packet),'598a9699f99d72145278a95e8566f71c6c8852d59d04a8a3f6215c36d84a6cb8');
const decision=JSON.parse(fs.readFileSync(packet));
assert.equal(Object.keys(decision.files).length,1389);
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
assert.equal(ledger.topics[id].content.status,'complete');
const content=ledger.topics[id].content.files;
for(const[p,h]of Object.entries(content))assert.equal(sha(p),h,p);
const closure=`${folder}/runtime-context-math-successor/independent-closure.md`;
const files={...content,...decision.files,[packet]:sha(packet),[closure]:sha(closure)};
for(const[p,h]of Object.entries(files))assert.equal(sha(p),h,p);
assert.equal(sha(`${folder}/runtime-review.md`),'2d02fb94feeb72fb958c982067f7340992d0cb766e1fb34bcfa4900d5dbf8543');
const report=JSON.parse(fs.readFileSync(`${folder}/runtime-context-math-successor/browser/report.json`));
assert.equal(report.passed,true);assert.equal(report.checks.length,47);assert.equal(report.images.length,12);
const manuscript=`${folder}/lesson.jsx`;
assert.equal(sha(manuscript),'6a8d7b9c8f0b2d5e2828d1b81c65158e0ca74c863783415e392e16a06a3dd05a');
fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,
 reviewer:'root; different whole runtime review and same-reviewer corrections',phase:'ready-for-production-integration',
 topic:id,manuscript,figures:'[data-prm-figure]',count:29,assets:'learn-code/process-reward-models',files,
 review:`${folder}/runtime-review.md`,closure,
 limits:'Composed entire source/paint review with R1–R6 correction closure. No fit repeated. Three tall enlarged final math images were viewer-resized. Native ZIP cancellation remains qualified separately from byte-exact HTTP and individual downloads. Current normal integration follows.'},null,2)+'\n',{flag:'wx'});
console.log(`PRM runtime accepted: ${Object.keys(files).length} exact bindings.`);
