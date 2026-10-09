import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateDeliveryLedger} from './lib/lesson-delivery.mjs';
const id='decoding-strategies-greedy-beam-top-k-top-p-temperature';
const base=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packetPath=`${base}/runtime-review-successor/inputs.json`;
assert.equal(sha(packetPath),'b70f22054b9d89b87d64aca01da4a435754f0a5eddc908a8653bf9fab1677002');
const packet=JSON.parse(fs.readFileSync(packetPath));
const original=JSON.parse(fs.readFileSync(`${base}/runtime-inputs.json`));
const review=`${base}/runtime-review-root/correction-closure.md`;
const files={...packet.files};
for(const file of [packetPath,review,`${base}/runtime-review-root/whole-review.md`,`${base}/runtime-review-root/correction-checks.json`,'scripts/review-decoding-correction-root.py','scripts/accept-decoding-runtime-root.mjs'])files[file]=sha(file);
for(const[file,hash]of Object.entries(files))assert.equal(sha(file),hash,file);
const mapped=fs.readFileSync(original.manuscript,'utf8').replaceAll('../../../../src/learn/','../../');
const acceptance={...original,accepted:true,review,status:'private-runtime-accepted-production-pending',files,
  effectiveManuscript:packet.effectiveManuscript,figures:'[data-decoding-figure]',count:30,
  publishedSha256:createHash('sha256').update(mapped).digest('hex')};
// The content continuation changes exactly the three exercises and their answers,
// plus the independently corrected shared sampler. Preserve the old content entry.
const ledgerPath='docs/teaching/lesson-delivery-progress.json';
const bytes=fs.readFileSync(ledgerPath),ledger=JSON.parse(bytes),entry=ledger.topics[id];
assert.equal(entry.content.status,'complete');assert.equal(entry.implementation.status,'in-progress');
const unrelated=JSON.stringify(Object.fromEntries(Object.entries(ledger.topics).filter(([key])=>key!==id)));
fs.writeFileSync(`${base}/runtime-review-root/prior-phase-entry.json`,JSON.stringify(entry,null,2)+'\n',{flag:'wx'});
const predecessors=JSON.parse(fs.readFileSync(`${base}/runtime-review-successor/predecessors.json`));
const bindings={},relocations=[];
for(const[file,hash]of Object.entries(entry.content.files)) {
 if(sha(file)===hash)bindings[file]=hash;
 else {const prior=predecessors.find(p=>p.path===file&&p.sha256===hash);assert.ok(prior,file);assert.equal(sha(prior.saved),hash);bindings[prior.saved]=hash;bindings[file]=sha(file);relocations.push(prior);}
}
for(const file of [packet.effectiveManuscript,review,`${base}/runtime-review-root/correction-checks.json`])bindings[file]=sha(file);
const continuationPath=`${base}/runtime-review-root/content-continuation.json`;
fs.writeFileSync(continuationPath,JSON.stringify({accepted:true,reviewer:'/root',topicId:id,manuscript:packet.effectiveManuscript,review,files:bindings,relocations,scope:'Bounded continuation of complete content; previous completion date and scientific observations retained.'},null,2)+'\n',{flag:'wx'});
entry.content.files={...bindings,[continuationPath]:sha(continuationPath)};
entry.content.manuscript=packet.effectiveManuscript;
entry.implementation.preparedSource=original.manuscript;
entry.record=continuationPath;
entry.nextAction='Private runtime independently accepted; root guarded canonical publication, production build and normal-reader integration remain.';
validateDeliveryLedger(ledger);
assert.equal(JSON.stringify(Object.fromEntries(Object.entries(ledger.topics).filter(([key])=>key!==id))),unrelated);
assert.ok(fs.readFileSync(ledgerPath).equals(bytes),'Concurrent central update');
files[continuationPath]=sha(continuationPath);
fs.writeFileSync(`${base}/runtime-acceptance.json`,JSON.stringify(acceptance,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({id,accepted:true,bindings:Object.keys(files).length,contentRelocations:relocations.length}));
