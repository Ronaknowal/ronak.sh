import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const id='rlhf-reinforcement-learning-from-human-feedback';
const folder=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(`${folder}/runtime-inputs.json`),'4be2cc5dfc48073c6e7471f4df45d49ddca1a1ec46333c671ed86dc2c781a2cf');
assert.equal(sha(`${folder}/runtime-review.md`),'2738a82bfadb2e9f9c49a30ad31fa941396229bda4faa3b8ed36ff76f2f9205a');
const files={...JSON.parse(fs.readFileSync(`${folder}/runtime-inputs.json`)).bindings};
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
assert.equal(ledger.topics[id].content.status,'complete');
Object.assign(files,ledger.topics[id].content.files);
for(const name of ['runtime-review.md','runtime-inputs.json','independent-runtime/image-index.json','independent-runtime/model-probes.json','independent-runtime/browser/report.json']) files[`${folder}/${name}`]=sha(`${folder}/${name}`);
for(const [p,h]of Object.entries(files)) assert.equal(sha(p),h,p);
const manuscript=`${folder}/lesson.jsx`;
assert.equal(sha(manuscript),'9ef51544205ebc7114a970cce90e351e87199854e8ca390c0ef9ff5e707298c2');
fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,reviewer:'root',
  phase:'ready-for-production-integration',topic:id,manuscript,figures:'[data-rlhf-figure]',count:28,
  assets:'learn/examples/rlhf',files,review:`${folder}/runtime-review.md`,
  limits:'Composes whole different source/paint review and conserved content/native studies; root normal production integration remains pending.'},null,2)+'\n',{flag:'wx'});
console.log(`RLHF runtime accepted: ${Object.keys(files).length} exact bindings.`);
