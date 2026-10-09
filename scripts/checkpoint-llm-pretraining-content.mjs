import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { validateDeliveryLedger } from './lib/lesson-delivery.mjs';

// Root runs only after reading the complete packet and resolving different review.
const [id, manuscriptName, programFolder, expectedManuscript, successorManifest, expectedSuccessor] = process.argv.slice(2);
assert.ok(id && manuscriptName && programFolder && /^[a-f0-9]{64}$/.test(expectedManuscript));
const base = 'docs/teaching/llm-architecture-training';
const scope = JSON.parse(fs.readFileSync(`${base}/pretraining-alignment-scope.json`));
assert.ok(scope.topics.some(topic => topic.id === id));
const folder = `${base}/${id}`;
const manuscript = `${folder}/${manuscriptName}`;
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(sha(manuscript), expectedManuscript);
assert.ok(fs.existsSync(`${folder}/content-review.md`));
assert.ok(fs.existsSync(`${folder}/design-review.md`));
const files = [];
const programs = programFolder.startsWith('examples/') ? `public/learn/${programFolder}` : `public/learn-code/${programFolder}`;
for (const directory of [folder, programs]) {
  for (const name of fs.readdirSync(directory)) {
    const file = `${directory}/${name}`;
    if (fs.statSync(file).isFile() && !name.startsWith('content-acceptance')) files.push(file);
  }
}
// Research files are part of the prepared packet, not disposable runtime output.
const research = `${folder}/research`;
if (fs.existsSync(research)) for (const name of fs.readdirSync(research)) {
  const file = `${research}/${name}`;
  if (fs.statSync(file).isFile()) files.push(file);
}
const bindings = Object.fromEntries(files.map(file => [file, sha(file)]));
// A reviewed bounded successor preserves the original manifest as historical
// evidence. Require its explicit identity instead of silently rebinding it.
const inputManifest = successorManifest || `${folder}/content-inputs.json`;
if (successorManifest) {
  assert.ok(successorManifest.startsWith(`${folder}/`));
  assert.match(expectedSuccessor || '', /^[a-f0-9]{64}$/);
  assert.equal(sha(inputManifest), expectedSuccessor);
  bindings[inputManifest] = expectedSuccessor;
}
if (fs.existsSync(inputManifest)) {
  const preparedFiles = JSON.parse(fs.readFileSync(inputManifest)).files;
  assert.ok(preparedFiles && typeof preparedFiles === 'object');
  const preparedInputs = Array.isArray(preparedFiles) ? preparedFiles
    : Object.entries(preparedFiles).map(([path, sha256]) => ({path, sha256}));
  assert.ok(preparedInputs.length > 0);
  for (const item of preparedInputs) {
    assert.equal(typeof item.path, 'string');
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.equal(sha(item.path),item.sha256,`Prepared input changed: ${item.path}`);
    bindings[item.path]=item.sha256;
  }
}
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const before = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(before);
const entry = ledger.topics[id];
assert.equal(entry.content.status, 'in-progress');
assert.equal(entry.implementation.status, 'not-started');
entry.content = {status:'complete', manuscript, visualSpecifications:`${folder}/design.md`, files:bindings, completedAt:new Date().toISOString()};
entry.record = `${folder}/design.md`;
entry.implementation = {status:'in-progress'};
entry.nextAction = 'Implement the accepted complete content, then different entire runtime/native/actual-paint review, corrections and root-owned normal production integration.';
validateDeliveryLedger(ledger);
assert.ok(fs.readFileSync(ledgerPath).equals(before), 'Concurrent central ledger change');
for (const [file,digest] of Object.entries(bindings)) assert.equal(sha(file),digest);
fs.writeFileSync(`${folder}/content-acceptance.json`, JSON.stringify({reviewer:'root', acceptedAt:entry.content.completedAt, manuscript, bindings, implementation:'in-progress', limits:'Content accepted; no runtime or publication certification.'}, null,2)+'\n', {flag:'wx'});
fs.writeFileSync(ledgerPath, JSON.stringify(ledger,null,2)+'\n');
console.log(`${id}: content complete, implementation in progress; ${files.length} exact inputs`);
