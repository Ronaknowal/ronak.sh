import fs from 'node:fs';
import assert from 'node:assert/strict';
const ledgerPath='docs/teaching/lesson-delivery-progress.json';
const before=fs.readFileSync(ledgerPath), ledger=JSON.parse(before);
const scope=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/pretraining-alignment-scope.json'));
const changed=[];
for(const {id} of scope.topics){
  const entry=ledger.topics[id];
  if(!fs.existsSync(entry.record)){
    assert.equal(entry.content.status,'in-progress');
    assert.equal(entry.implementation.status,'not-started');
    entry.record='docs/teaching/llm-architecture-training/README.md';
    changed.push(id);
  }
}
assert.ok(fs.readFileSync(ledgerPath).equals(before));
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({changed,reason:'Unwritten designs cannot be existing handoff paths; pending topics use the actual frozen-scope coordination record.'},null,2));
