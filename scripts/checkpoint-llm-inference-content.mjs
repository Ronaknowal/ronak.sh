// Root-only phase transition after complete different content review/closure.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateDeliveryLedger } from './lib/lesson-delivery.mjs';

const [id, releasePath, expectedRelease] = process.argv.slice(2);
const base = 'docs/teaching/llm-architecture-training';
const scope = JSON.parse(fs.readFileSync(`${base}/inference-serving-scope.json`, 'utf8'));
const topic = scope.topics.find((row) => row.id === id);
assert.ok(topic, 'Topic must belong to the frozen ten-topic scope');
const folder = `${base}/${id}`;
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.ok(releasePath?.startsWith(`${folder}/`));
assert.match(expectedRelease || '', /^[a-f0-9]{64}$/);
assert.equal(sha(releasePath), expectedRelease);
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
assert.equal(release.accepted, true);
assert.equal(release.topicId, id);
assert.equal(release.reviewer, '/root');
assert.ok(release.manuscript.startsWith(`${folder}/`));
assert.ok(release.visualSpecifications.startsWith(`${folder}/`));
assert.ok(release.files[release.manuscript]);
assert.ok(release.files[release.visualSpecifications]);
assert.ok(release.differentReview && release.files[release.differentReview]);
const bindings = { ...release.files, [releasePath]: expectedRelease };
for (const [file, expected] of Object.entries(bindings)) {
  assert.match(expected, /^[a-f0-9]{64}$/);
  assert.equal(sha(file), expected, `Reviewed content changed: ${file}`);
}
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const before = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(before);
const entry = ledger.topics[id];
assert.equal(entry.deliveryMode, 'full');
assert.equal(entry.content.status, 'in-progress');
assert.equal(entry.implementation.status, 'not-started');
const unrelated = Object.fromEntries(Object.entries(ledger.topics).filter(([key]) => key !== id));
const completedAt = new Date().toISOString();
entry.content = {
  status: 'complete',
  manuscript: release.manuscript,
  visualSpecifications: release.visualSpecifications,
  completedAt,
  files: bindings,
};
entry.record = releasePath;
entry.implementation = { status: 'in-progress' };
entry.nextAction = 'Implement the accepted complete content, then different whole runtime and actual-paint review, corrections and root production integration within LLM positions30–39.';
validateDeliveryLedger(ledger);
assert.deepEqual(Object.fromEntries(Object.entries(ledger.topics).filter(([key]) => key !== id)), unrelated);
assert.ok(fs.readFileSync(ledgerPath).equals(before), 'Concurrent central ledger edit; retry against fresh state');
for (const [file, expected] of Object.entries(bindings)) assert.equal(sha(file), expected);
const receiptPath = `${folder}/content-acceptance.json`;
fs.writeFileSync(receiptPath, JSON.stringify({ accepted: true, topicId: id, completedAt, releasePath, releaseSha256: expectedRelease, bindings, scope: 'Complete content accepted; implementation in progress. No runtime/production certification.' }, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ id, content: 'complete', implementation: 'in-progress', bindings: Object.keys(bindings).length }));
