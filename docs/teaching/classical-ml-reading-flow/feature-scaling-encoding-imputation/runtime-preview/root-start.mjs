import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getDeliveryState } from '../../../../../scripts/lib/lesson-delivery.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bind = path => {
  const bytes = fs.readFileSync(path);
  return { path, bytes: bytes.length, sha256: hash(bytes) };
};
const id = 'feature-scaling-encoding-imputation';
const owner = 'docs/teaching/classical-ml-reading-flow/' + id;
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const beforeBytes = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(beforeBytes);
const before = structuredClone(ledger);
const row = ledger.topics[id];
const intakeBinding = bind(owner + '/runtime-preview/intake/complete-intake.json');
assert.equal(intakeBinding.sha256, '6dbcac0730f682f8bf501e7b897ae4c9f1419dd72df5e0bcc6995a9bb02cda76');
const intake = JSON.parse(fs.readFileSync(intakeBinding.path));
assert.equal(intake.status, 'COMPLETE_AUTHOR_RUNTIME_INTAKE_AWAITING_ROOT_PRIVATE_RUNTIME_RELEASE');
assert.equal(row.revision, 5);
assert.equal(row.deliveryMode, 'full');
assert.equal(row.content.status, 'complete');
assert.equal(row.implementation.status, 'not-started');
assert.equal(getDeliveryState(process.cwd(), row).content, 'complete');
assert.equal(intake.inputCount, 191);
assert.equal(intake.inputs.length, 191);
assert.deepEqual(intake.scope, { sections: 11, drawings: 41, investigations: 16, teachingProgrammes: 16, newTeachingProgrammes: 13, retained: 3, optionalR: 1, answerFile: 1, solvedTasks: 26 });
let conditions = 9;
for (const input of intake.inputs) {
  const actual = bind(input.path);
  assert.equal(actual.sha256, input.sha256);
  assert.equal(actual.bytes, input.bytes);
  conditions += 2;
}
const contentBindings = Object.entries(row.content.files);
for (const [path, expected] of contentBindings) {
  assert.equal(bind(path).sha256, expected);
  conditions += 1;
}
assert.equal(intake.literalReading.manuscriptLines, 2882);
assert.equal(intake.literalReading.specificationLines, 519);
row.implementation.status = 'in-progress';
row.nextAction = 'Implement the entire accepted11-section/41-drawing/16-investigation lesson privately from intake/complete-intake.json6dbcac07 and runtime-preview/root-start.json. Preserve all16 teaching programmes,26 solved tasks,42 file roles and accepted amendments. Different entire runtime/source/paint review, corrections and Root canonical normal integration remain required.';
const restored = structuredClone(row);
restored.implementation.status = 'not-started';
restored.nextAction = before.topics[id].nextAction;
assert.deepEqual(restored, before.topics[id]);
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
  schema: 'feature-preprocessing-private-runtime-root-release/v1',
  at: new Date().toISOString(),
  status: 'IMPLEMENTATION_IN_PROGRESS_AFTER_COMPLETE_CURRENT_CONTENT_INTAKE',
  root: '/root', author: intake.owner, topicId: id, revision: 5,
  intake: intakeBinding, acceptedContent: intake.acceptedContent,
  scope: intake.scope, fileRoles: 42, literalReading: intake.literalReading,
  rootConditions: conditions, currentContentBindings: contentBindings.length,
  foreignRowsConserved: foreignRows,
  release: 'Full private topic-owned runtime implementation; Root retains central/canonical/public/shared ownership.',
  limits: [
    'Release is not runtime acceptance; entire different review, affected native behavior and normal integration remain.',
    'Root read the entire author intake narrative and composed prior different whole-content/SAME closure; no new Root whole-manuscript reading is claimed.',
    'Identity guards establish current inputs, not diagram clarity or learner comprehension.',
    'No unchanged teaching main, fit or scientific campaign replay; optional R remains unexecuted.',
  ],
};
const receiptPath = owner + '/runtime-preview/root-start.json';
assert.ok(!fs.existsSync(receiptPath));
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
assert.deepEqual(JSON.parse(fs.readFileSync(ledgerPath)), ledger);
console.log(JSON.stringify({ receipt: bind(receiptPath), conditions, foreignRows, implementation: row.implementation.status }));
