import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const id='dpo-direct-preference-optimization',folder=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=`${folder}/runtime-independent-closure-inputs.json`;
assert.equal(sha(packet),'1dabf9c670d3ceecebb3fa59b2921966cbb625221f2ea315d92dd30f0ba0ace5');
const decision=JSON.parse(fs.readFileSync(packet));
assert.equal(decision.status,'accepted-same-reviewer-bounded-closure');
assert.equal(decision.reviewer,'multimodal_reviewer');
assert.equal(sha(`${folder}/runtime-independent-closure.md`),'3142eb285f7c89a9a16379d7cef4e538e0ad7b85ef979345eaa5ea07944116af');
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
assert.equal(ledger.topics[id].content.status,'complete');
const files={...ledger.topics[id].content.files,...decision.files,[packet]:sha(packet)};
for(const[p,h]of Object.entries(files))assert.equal(sha(p),h,p);
const manuscript=`${folder}/lesson.jsx`;
assert.equal(sha(manuscript),'8863964269abc4c303c804776e9bdf86616af413b92bc73fac83482fcc5c436b');
fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,
 reviewer:'multimodal_reviewer; root composed guarded whole review and closure',phase:'ready-for-production-integration',
 topic:id,manuscript,figures:'[data-dpo-figure]',count:27,assets:'learn/examples/dpo',files,
 review:`${folder}/runtime-review.md`,closure:`${folder}/runtime-independent-closure.md`,
 limits:'Root read the complete independent closure and author runtime packet, and verified every binding. Whole different review and same-reviewer R1–R4 closure compose; no duplicate root whole-paint claim. Frozen mathematical/scientific manuscript conserved through separate renderer. Native ZIP canceled; exact HTTP bytes and native individual file downloads passed. Production integration follows.'},null,2)+'\n',{flag:'wx'});
console.log(`DPO runtime accepted: ${Object.keys(files).length} exact bindings.`);
