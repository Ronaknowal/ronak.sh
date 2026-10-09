import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getDeliveryState, validateDeliveryLedger } from '../../../../scripts/lib/lesson-delivery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const owner = 'docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation';
const preparation = `${owner}/content-preparation`;
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const acceptancePath = `${owner}/content-accepted-root.json`;
const topicId = 'feature-scaling-encoding-imputation';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const read = filename => fs.readFileSync(path.join(root, filename));
const json = filename => JSON.parse(read(filename));
const ledgerBefore = read(ledgerPath);
const ledger = JSON.parse(ledgerBefore);
const original = structuredClone(ledger);
let conditions = 0;
const check = (condition, message) => { assert.ok(condition, message); conditions++; };
check(!fs.existsSync(path.join(root, acceptancePath)), 'Never overwrite an earlier acceptance');
const entry = ledger.topics[topicId];
check(entry.revision === 5 && entry.content.status === 'in-progress' && entry.implementation.status === 'not-started', 'Expected current revision and phase boundary');

const handoffPath = `${preparation}/whole-review-handoff.json`;
const handoff = json(handoffPath);
const closurePath = `${preparation}/independent-content-review/F1-F2-closure.json`;
const closure = json(closurePath);
const composition = json(handoff.fullBindingManifest.path);
check(closure.reviewer === '/root/ml_successor_independent_review', 'Review attribution');
check(closure.status === 'F1-and-adopted-F2-closed-source-only', 'Required corrections closed');
check(composition.fileIndex.length === 42, 'Complete learner file index');
assert.deepEqual(handoff.scope, { sections: 11, drawings: 41, investigations: 16, teachingProgrammes: 16, newTeachingProgrammes: 13, retained: 3, optionalR: 1, answerFile: 1, solvedTasks: 26 });
conditions++;
const files = {};
const bind = binding => {
  check(typeof binding.path === 'string' && /^[a-f0-9]{64}$/.test(binding.sha256), 'Explicit source binding');
  const resolved = path.resolve(root, binding.path);
  check(resolved.startsWith(`${root}${path.sep}`), 'Binding stays in selected checkout');
  const bytes = read(binding.path);
  check(bytes.length === binding.bytes && digest(bytes) === binding.sha256, `Current bytes: ${binding.path}`);
  if (files[binding.path]) check(files[binding.path] === binding.sha256, 'Duplicate bindings agree');
  files[binding.path] = binding.sha256;
};
const actualBinding = filename => { const bytes = read(filename); return { path: filename, bytes: bytes.length, sha256: digest(bytes) }; };
for (const value of Object.values(handoff)) if (value && typeof value === 'object' && value.path && value.sha256) bind(value);
for (const binding of [...composition.fileIndex, ...composition.authorInputs, ...closure.inputs]) bind(binding);
for (const filename of [handoffPath, closurePath, `${preparation}/independent-content-review/F1-F2-closure.md`]) bind(actualBinding(filename));
check(digest(read(handoffPath)) === '01e38167b9103f2020fb89d525fbefeb416f37c0ffc0d0122e4dd27b97b8fe75', 'Exact corrected handoff read by Root');
check(digest(read(`${preparation}/independent-content-review/F1-F2-closure.md`)) === '0a1c3d79d4b2b7e0a27a4b1b181ba47f1d417f70a16de07140f96ac2c021aca0', 'Exact SAME report read by Root');
const manuscript = read(handoff.manuscript.path).toString('utf8');
for (const text of ['[[1,2],[2,4],[3,6],[2.5,8],[5,10]]', 'Feeding stale initialized a=2.5', 'Initialize medians [2.5,6]', '3.9652777778', '6.0158266415']) check(manuscript.includes(text), `Affected trace: ${text}`);
const acceptedAt = new Date().toISOString();
const acceptance = {
  schemaVersion: 1, topicId, revision: 5, acceptedAt, status: 'content-accepted-implementation-not-started',
  author: '/root/nmf_content_recovery', independentReviewer: closure.reviewer, acceptanceOwner: '/root',
  manuscript: handoff.manuscript, visualSpecifications: handoff.visualSpecifications, scope: handoff.scope,
  evidence: { wholeDifferentReview: handoff.predecessorWholeReview, sameBoundedClosure: actualBinding(closurePath), sameReport: actualBinding(`${preparation}/independent-content-review/F1-F2-closure.md`), correctedHandoff: actualBinding(handoffPath) },
  rootReading: 'Root read the complete DIFFERENT whole-content report in the preceding continuation, then the entire corrected handoff, SAME closure report and author correction readback, and actual full initialization-through-inference passage, T23 hint/solution and D37 numerical refinement. This composes attributed whole review with the bounded correction; it is not a new Root whole-manuscript reading.',
  dispositions: { F1: 'Observed medians2.5/6 and initialized matrix now agree with existing code. Observed row2 a=3, later predictions and source/output pairs preserved.', F2: 'Four adopted process-language paragraphs replaced with direct teaching while conserving mathematical conditions, nine original activities and complete ending.' },
  currentInputBindings: Object.keys(files).length, rootSourceConditionsBeforeComposition: conditions,
  limits: ['Content acceptance only; no runtime/native/build/publication acceptance.', 'Optional R complete source remains unexecuted.', 'Original scientific results, failed attempts, prior independent review and exact predecessor packets remain authoritative in their stated roles.', 'No old main, fit, campaign or scientific verifier replayed.'],
  nextAction: 'Consume the entire accepted packet before private runtime authoring. Implement all41 drawing contracts,16 direct live investigations,16 explained programmes,26 solved tasks and complete file delivery. Different whole runtime review, affected corrections, actual native checks and normal integration remain required.'
};
check(read(ledgerPath).equals(ledgerBefore), 'Ledger unchanged during preparation');
fs.writeFileSync(path.join(root, acceptancePath), `${JSON.stringify(acceptance, null, 2)}\n`);
files[acceptancePath] = digest(read(acceptancePath));
entry.content = { ...entry.content, status: 'complete', completedAt: acceptedAt, manuscript: handoff.manuscript.path, visualSpecifications: handoff.visualSpecifications.path, files };
entry.nextAction = acceptance.nextAction;
for (const [id, row] of Object.entries(original.topics)) if (id !== topicId) assert.deepEqual(ledger.topics[id], row);
assert.deepEqual(entry.implementation, original.topics[topicId].implementation);
assert.deepEqual(entry.previousRevisions, original.topics[topicId].previousRevisions);
validateDeliveryLedger(ledger);
const state = getDeliveryState(root, entry);
check(state.content === 'complete' && state.implementation === 'not-started', 'Effective phase states');
fs.writeFileSync(path.join(root, ledgerPath), `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ status: acceptance.status, topicId, conditions, currentInputs: Object.keys(files).length, foreignRowsPreserved: Object.keys(original.topics).length - 1, acceptance: actualBinding(acceptancePath), effective: { content: state.content, implementation: state.implementation } }, null, 2));
