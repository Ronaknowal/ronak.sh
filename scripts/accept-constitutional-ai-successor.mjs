import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const id = 'constitutional-ai-cai';
const folder = `docs/teaching/llm-architecture-training/${id}`;
const successor = `${folder}/review-successor`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inputPath = `${successor}/inputs.json`;
assert.equal(hash(inputPath), '91d40cf6b59f205d9fb149ac92cb1278b04020edc37ed94a70cf0011da627304');
assert.equal(hash(`${successor}/different-successor-review.md`), '7116c8cef83f310c44d6ad688f58dedf6303d901360ca9b52011ffda73132690');
const inputs = read(inputPath);
const different = read(`${successor}/different-successor-inputs.json`);
const files = {};
for (const row of [...inputs.files, ...different.files]) {
  assert.equal(hash(row.path), row.sha256, row.path);
  files[row.path] = row.sha256;
}
assert.equal(read(`${successor}/different-correction-checks-final.json`).status, 'passed');
const changes = new Map(inputs.changes.map(change => [change.path, change]));
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const originalLedger = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(originalLedger);
const entry = ledger.topics[id];
assert.equal(entry.content.status, 'complete');
assert.equal(entry.implementation.status, 'in-progress');
fs.writeFileSync(`${successor}/root-predecessor-ledger-entry.json`, JSON.stringify(entry, null, 2) + '\n', { flag: 'wx' });
for (const [file, expected] of Object.entries(entry.content.files)) {
  if (hash(file) === expected) continue;
  const change = changes.get(file);
  assert.ok(change, `Undeclared content change: ${file}`);
  assert.equal(change.predecessor, expected);
  assert.equal(hash(file), change.successor);
  entry.content.files[file] = change.successor;
}
for (const name of ['different-successor-inputs.json', 'different-successor-review.md', 'author-corrections.md']) {
  const file = `${successor}/${name}`;
  entry.content.files[file] = hash(file);
  files[file] = hash(file);
}
const acceptance = {
  at: new Date().toISOString(), accepted: true, reviewer: 'root', topic: id,
  phase: 'ready-for-production-integration', manuscript: entry.content.manuscript,
  figures: '[data-cai-figure]', count: 24, assets: 'learn/examples/constitutional-ai',
  files: { ...entry.content.files, ...files }, review: `${folder}/runtime-review.md`,
  successorReview: `${successor}/different-successor-review.md`,
  basis: 'Root read entire whole-runtime review and complete successor reviews, changed target/credit transition and every changed solved practice. Different 841-condition closure and actual successor paint resolve R1-R3. All511 unchanged predecessor bindings conserved; only three declared successors. Root accepts the content successor on that specific teaching/formatting basis, not a blind source refresh. Programs/scientific evidence unchanged. Production checks follow.',
};
fs.writeFileSync(`${folder}/runtime-acceptance.json`, JSON.stringify(acceptance, null, 2) + '\n', { flag: 'wx' });
assert.ok(fs.readFileSync(ledgerPath).equals(originalLedger), 'Concurrent central edit');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ accepted: true, inputs: Object.keys(acceptance.files).length }));
