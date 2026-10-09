import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { validateDeliveryLedger, getDeliveryState, assertDeliveryRequest } from '../../../../../scripts/lib/lesson-delivery.mjs';

const topic = 't-sne-umap-manifold-learning';
const owner = `docs/teaching/classical-ml-reading-flow/${topic}/`;
const content = owner + 'content-authoring/';
const correction = content + 'review-correction/';
const review = content + 'independent-whole-content-review/';
const same = review + 'same-correction-closure/';
const acceptancePath = owner + 'content-accepted-root.json';
const transitionPath = owner + 'content-phase-transition.json';
const recordPath = owner + 'reading-flow-revision.md';
const recordPredecessor = content + 'checkpoints/pre-content-acceptance-record.md';
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const describe = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: hash(bytes) }; };
const bindings = new Map();
function guard(expected) {
  const actual = describe(expected.path);
  assert.equal(actual.sha256, expected.sha256, expected.path);
  assert.equal(actual.bytes, expected.bytes, expected.path);
  if (bindings.has(actual.path)) assert.equal(bindings.get(actual.path).sha256, actual.sha256);
  bindings.set(actual.path, actual);
}
for (const file of [acceptancePath, transitionPath, recordPredecessor]) assert.ok(!fs.existsSync(file), `Preserve existing ${file}`);
const authorPath = correction + 'author-ready.json';
const samePath = same + 'review-packet.json';
guard({ path: authorPath, bytes: 7336, sha256: '76a3db64bd01e30fc35517701108f37d4cb23b227e6db811ffea32020104c545' });
guard({ path: samePath, bytes: 12597, sha256: '9af7e0d3b4ec9a21a71b5f93b38cd0d905dfaf7b959178d9aec2cca27ce3b371' });
const author = read(authorPath), closure = read(samePath);
assert.equal(closure.status, 'PASS_COMPOSED_WHOLE_CONTENT_SAME_R1_R2_R3_CLOSURE');
assert.deepEqual(closure.residualRequiredFindings, []);
assert.equal(closure.independence.authoredTeachingContent, false);
assert.equal(closure.independence.originalDifferentReviewer, true);
assert.notEqual(closure.reviewer, author.author);
assert.notEqual(closure.reviewer, closure.independence.originalAuthor);
assert.notEqual(closure.reviewer, closure.independence.successorAuthor);
for (const value of Object.values(closure)) if (value && typeof value === 'object' && value.path && value.sha256) guard(value);
for (const source of Object.values(closure.currentSelectedSources)) guard(source);
guard(closure.freezeScript);
const sourceCheck = read(closure.currentIndependentSourceAndProtocolCheck.path);
assert.equal(sourceCheck.status, 'PASS_EXACT_SOURCE_AND_NEW_L7_SCALAR_PROTOCOL_CHECKS');
assert.equal(sourceCheck.checks.length, 811);
assert.equal(sourceCheck.priorDescriptorsConserved, 623);
assert.equal(sourceCheck.solverASTOutsideSolveRowConserved, true);
assert.deepEqual(sourceCheck.structure, [13, 45, 12, 19]);
for (const check of sourceCheck.checks) {
  assert.equal(check.passed, true, check.role);
  guard(check.source);
}
guard(sourceCheck.script);
const checkedBindings = [...bindings.values()].sort((a, b) => a.path.localeCompare(b.path));
const at = new Date().toISOString();
const acceptance = {
  schema: 'root-composed-whole-content-acceptance/v1',
  status: 'CONTENT_ACCEPTED_PRIVATE_RUNTIME_RELEASED', at, topicId: topic, position: 17, revision: 5,
  author: '/root', authorPacket: describe(authorPath), acceptedDesign: author.acceptedDesign,
  wholeDifferentPacket: closure.originalWholeDifferentPacket, wholeDifferentReport: closure.originalWholeDifferentReport,
  samePacket: describe(samePath), sameReport: closure.reviewReport,
  currentIndependentSourceCheck: closure.currentIndependentSourceAndProtocolCheck,
  currentSourceBindings: checkedBindings, currentBindingDigest: hash(JSON.stringify(checkedBindings)),
  scope: { sections: 13, drawings: 45, investigations: 12, completePrograms: 15, completeStreams: 15, completePayloads: 35, solvedTasks: 19 },
  remainingRequiredFindings: [], findings: closure.requiredFindings, advisories: closure.advisories,
  rootReading: {
    actual: 'Complete DIFFERENT report and correction author handoff; complete SAME report and both current packets; full changed Gaussian source; current binding/protocol/schema inspection and all811 fresh source expectations.',
    basis: 'Compose the independent original whole13-section/manuscript/specification/source/output/practice reading with its SAME affected current reading and five exact inverses. Root does not claim a new complete human reading of the138332-byte manuscript or all45 contracts.',
    identityIsNotPedagogy: true,
  },
  sourceCheckScope: { freshExpectations: 811, distinctCurrentBindings: checkedBindings.length, priorConserved: 623, acceptedInputs: 118, originalPairs: 40, inverseFiles: 5, nativeChecks: false },
  qualifications: closure.qualifications,
  implementationCarryforwards: [
    'Consume the whole current manuscript, all45 specifications/12 investigations,15 complete sources/streams,35 mapped payloads,19 solved tasks and complete setup/resource/handoff before source implementation.',
    'Gaussian and classical streams describe their exact executed predecessors; current source-only roles remain explicit. Do not rerun old mains/fits/checkers to refresh dates.',
    'Implement the entire L7 shared-domain/state protocol, including rate100→M13→selectionC→edit−10→rate0 unchanged→positive simultaneous step/centering→Reset and explicit nonfinite last-state retention.',
    'Actual model, responsive paint, keyboard/pointer/reset/refusal/file delivery and loading recovery remain mandatory phase-two checks; none is certified by this source release.',
    'Before canonical publication replaces any source-bound predecessor path, conserve that input at an exact immutable physical resolver and reconcile current content bindings; do not silently stale the accepted checkpoint.',
  ],
  permissions: {
    released: ['Private complete runtime authoring under this topic runtime-preview owner after whole packet intake', 'Full picture-first continuous reader and all45 actual mechanisms/12 playable investigations', 'Topic-only preview with exact mapped source/data/output delivery'],
    held: ['Worker shared/public/canonical edits', 'Worker central phase edits', 'Runtime completion before different entire review and Root normal integration', 'Full public duplication or broad scientific replay'],
  },
  nativeOrRuntimeAcceptance: false, bestPossibleDiagramClaim: false, observedLearnerClaim: false,
  historicalScienceReplayed: false,
  nextAction: 'Assigned private author consumes the entire accepted content packet, saves exact intake, implements the entire reader and conducts author/native/model review, then returns a frozen entire runtime for DIFFERENT review. Root alone integrates and changes central phases.',
};
const beforeBytes = fs.readFileSync(ledgerPath), ledger = JSON.parse(beforeBytes);
const old = ledger.topics[topic];
assert.equal(old.revision, 5);
assert.equal(old.content.status, 'in-progress');
assert.equal(old.implementation.status, 'not-started');
const foreign = object => JSON.stringify(Object.fromEntries(Object.entries(object.topics).filter(([id]) => id !== topic)));
const foreignBefore = foreign(ledger), historyBefore = JSON.stringify(old.previousRevisions);
const previousRecordBytes = fs.readFileSync(recordPath);
fs.writeFileSync(recordPredecessor, previousRecordBytes, { flag: 'wx' });
acceptance.predecessorCurrentRecord = describe(recordPredecessor);
fs.writeFileSync(acceptancePath, JSON.stringify(acceptance, null, 2) + '\n', { flag: 'wx' });
const contentFiles = Object.fromEntries(checkedBindings.map(d => [d.path, d.sha256]));
contentFiles[acceptancePath] = describe(acceptancePath).sha256;
contentFiles[recordPredecessor] = describe(recordPredecessor).sha256;
ledger.topics[topic] = {
  ...old,
  content: { status: 'complete', completedAt: at, manuscript: author.manuscript.path, visualSpecifications: author.specifications.path, files: contentFiles },
  implementation: { status: 'not-started' }, nextAction: acceptance.nextAction,
};
ledger.updatedOn = at.slice(0, 10);
validateDeliveryLedger(ledger);
assert.equal(foreign(ledger), foreignBefore);
assert.equal(JSON.stringify(ledger.topics[topic].previousRevisions), historyBefore);
const state = getDeliveryState(process.cwd(), ledger.topics[topic]);
assert.equal(state.content, 'complete');
assert.equal(state.implementation, 'not-started');
assertDeliveryRequest('finish', state);
const record = '# t-SNE, UMAP & Manifold Learning: reading-flow revision5\n\n' +
  'Content is complete and accepted under [content-accepted-root.json](content-accepted-root.json); implementation is not started. The current source is the consolidated correction at content-authoring/review-correction/author-ready.json76a3db64. Historical revisions and the prior active record are preserved.\n\n' +
  'The complete DIFFERENT content review bb5f13a8 and SAME closure9af7e0d3 leave no required content finding. Root read both full reports and the complete correction handoff; fresh811 source expectations conserve623 prior guards,118 accepted inputs,40 original pairs and five exact inverses. Scope remains13 sections,45 drawing contracts,12 investigations,15 whole source/stream pairs,35 payloads and19 solved tasks. Identity checks do not constitute human reading or native acceptance.\n\n' +
  'R1 routes, R2 evaluated-beta return/budget and R3 expanding editor-domain contract are closed as content. Actual L7 pointer/keyboard/bounds/failure/reset and responsive paint remain implementation checks. A1–A3 have deliberate current dispositions; original scientific and current-versus-executed predecessor roles remain explicit. No old main/fit/campaign was replayed.\n\n' +
  acceptance.nextAction + '\n';
assert.equal(hash(fs.readFileSync(ledgerPath)), hash(beforeBytes), 'Concurrent central change: reconcile before writing');
assert.deepEqual(fs.readFileSync(recordPath), previousRecordBytes, 'Concurrent topic record change');
fs.writeFileSync(recordPath, record);
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
const persisted = read(ledgerPath);
assert.equal(foreign(persisted), foreignBefore);
const transition = {
  status: 'CURRENT_CONTENT_COMPLETE_RUNTIME_NOT_STARTED', at, topicId: topic, revision: 5,
  acceptance: describe(acceptancePath), record: describe(recordPath),
  beforeTopicState: old, effectiveState: getDeliveryState(process.cwd(), persisted.topics[topic]),
  checkedExpectations: 811, distinctCurrentBindings: checkedBindings.length,
  foreignRowsUnchanged: Object.keys(persisted.topics).length - 1,
  previousRevisionsPreserved: true, historicalScienceReplayed: false, runtimeAcceptance: false,
  ledgerBeforeSha256: hash(beforeBytes), ledgerAfterSha256: describe(ledgerPath).sha256,
};
fs.writeFileSync(transitionPath, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: transition.status, acceptance: describe(acceptancePath), transition: describe(transitionPath), sourceBindings: checkedBindings.length, foreignRowsUnchanged: transition.foreignRowsUnchanged }));
