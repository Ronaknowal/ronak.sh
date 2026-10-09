import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getDeliveryState } from '../../../../../scripts/lib/lesson-delivery.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bind = path => {
  const bytes = fs.readFileSync(path);
  return { path, bytes: bytes.length, sha256: hash(bytes) };
};
const id = 'non-negative-matrix-factorization-nmf';
const owner = 'docs/teaching/classical-ml-reading-flow/' + id;
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const beforeBytes = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(beforeBytes);
const before = structuredClone(ledger);
const row = ledger.topics[id];
const intakeBinding = bind(owner + '/runtime-preview/complete-intake.json');
assert.equal(intakeBinding.sha256, 'fc6f6dd81c3c18241c3843c9c3fb8c291f73274424357822b64e00479e125b0b');
const intake = JSON.parse(fs.readFileSync(intakeBinding.path));
assert.equal(intake.status, 'FULL_ACCEPTED_CONTENT_INTAKE_COMPLETE_AWAITING_ROOT_IMPLEMENTATION_RELEASE');
assert.equal(row.revision, 4);
assert.equal(row.deliveryMode, 'full');
assert.equal(row.content.status, 'complete');
assert.equal(row.implementation.status, 'not-started');
assert.equal(getDeliveryState(process.cwd(), row).content, 'complete');
let conditions = 7;
for (const input of [...intake.acceptedSourceBindings, intake.rootContentAcceptance, intake.manuscript]) {
  const actual = bind(input.path);
  assert.equal(actual.sha256, input.sha256);
  assert.equal(actual.bytes, input.bytes);
  conditions += 1;
}
let line = 1;
for (const range of intake.actuallyReadManuscriptRanges) {
  assert.equal(range.from, line);
  assert.ok(range.through >= line && range.chunk);
  line = range.through + 1;
  conditions += 1;
}
assert.equal(line, 7399);
assert.equal(intake.allManuscriptRangesUntruncated, true);
assert.equal(intake.completeSpecificationReads.length, 17);
for (const spec of intake.completeSpecificationReads) {
  assert.equal(spec.complete, true);
  assert.equal(spec.untruncated, true);
  assert.ok(spec.actualReadChunks.length > 0);
  assert.equal(bind(spec.binding.path).sha256, spec.binding.sha256);
  conditions += 1;
}
assert.equal(intake.implementationStarted, false);
assert.equal(intake.runtimeBuildRun, false);
assert.equal(intake.nativeReviewRun, false);
row.implementation.status = 'in-progress';
row.nextAction = 'Implement the entire accepted19-section/66-mechanism lesson privately from complete-intake.json fc6f6dd8 and root-start.json. Preserve all programme/output roles and accepted amendments; independent whole source/paint review and canonical normal integration remain required.';
const reconstructed = structuredClone(row);
reconstructed.implementation.status = 'not-started';
reconstructed.nextAction = before.topics[id].nextAction;
assert.deepEqual(reconstructed, before.topics[id]);
let foreignRows = 0;
for (const [key, value] of Object.entries(before.topics)) {
  if (key === id) continue;
  assert.deepEqual(ledger.topics[key], value);
  foreignRows += 1;
  conditions += 1;
}
assert.deepEqual(Object.keys(ledger.topics), Object.keys(before.topics));
assert.ok(fs.readFileSync(ledgerPath).equals(beforeBytes));
const receipt = {
  schema: 'nmf-private-implementation-root-release/v1',
  at: new Date().toISOString(),
  status: 'IMPLEMENTATION_IN_PROGRESS_AFTER_COMPLETE_CURRENT_CONTENT_INTAKE',
  root: '/root', author: intake.author, topicId: id, revision: 4,
  intake: intakeBinding, rootContentAcceptance: intake.rootContentAcceptance,
  manuscript: intake.manuscript, rootConditions: conditions, foreignRowsConserved: foreignRows,
  intakeScope: { manuscriptLines: 7398, completeSpecificationReads: 17, sections: 19, drawingJobs: 66, solvedTasks: 24, fileIndexEntries: 22 },
  acceptedAmendments: intake.acceptedAmendments,
  release: 'Full private runtime implementation in topic semantic owners; no canonical/public/shared changes by author.',
  limits: [
    'This release is not implementation acceptance.',
    'Full different source/paint review, actual control/code/loading evidence and Root canonical normal integration remain.',
    'Original numerical/execution roles retained; no unchanged scientific replay.',
  ],
  retainedHarnessFailure: 'edd627 was an initial require/top-level-await module-format failure before any script execution; this explicit ESM successor replaces that attempt.',
};
const path = owner + '/runtime-preview/root-start.json';
assert.ok(!fs.existsSync(path));
fs.writeFileSync(path, JSON.stringify(receipt, null, 2) + '\n');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
assert.deepEqual(JSON.parse(fs.readFileSync(ledgerPath)), ledger);
console.log(JSON.stringify({ receipt: bind(path), conditions, foreignRows, implementation: row.implementation.status }));
