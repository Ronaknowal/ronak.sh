import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { validateDeliveryLedger } from '../../../../scripts/lib/lesson-delivery.mjs';

const topic = 'non-negative-matrix-factorization-nmf';
const owner = `docs/teaching/classical-ml-reading-flow/${topic}/`;
const acceptedPath = owner + 'design-accepted-root.json';
const recordPath = owner + 'reading-flow-revision.md';
const phasePath = owner + 'design-phase-transition.json';
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const bind = p => { const b = fs.readFileSync(p); return { path: p, bytes: b.length, sha256: hash(b) }; };
const bindings = new Map();
function guard(d) {
  const a = bind(d.path);
  assert.equal(a.bytes, d.bytes, d.path); assert.equal(a.sha256, d.sha256, d.path);
  bindings.set(a.path, a); return a;
}
for (const p of [acceptedPath, recordPath, phasePath]) assert.ok(!fs.existsSync(p), `Preserve existing ${p}`);
const closurePath = owner + 'independent-design-review/r1-closure/closure-packet.json';
const closure = read(closurePath);
assert.equal(closure.decision, 'R1_CLOSED');
assert.deepEqual(closure.outstandingFindings, []);
guard(closure.correctionPacket);
const correction = read(closure.correctionPacket.path);
guard(closure.originalWholeReview); guard(closure.originalWholeReport);
const whole = read(closure.originalWholeReview.path);
assert.equal(whole.decision, 'REQUEST_CHANGES_R1');
assert.equal(whole.protectedPairs, 28);
const identity = read(guard(whole.sourceIdentity).path), mutable = [];
for (const d of identity.bindings) {
  if (d.role === 'current-mutable-global-guidance-not-historical-conservation-claim') {
    mutable.push({ historical: d, observedCurrent: bind(d.path), qualification: 'Mutable current guidance, excluded from historical equality and immutable content bindings.' });
  } else guard(d);
}
assert.equal(identity.bindings.length - mutable.length, 117);
for (const d of closure.effectiveContracts) guard(d);
for (const d of whole.files) guard(d);
for (const d of [closure.checks, closure.consumption, closure.report, closure.checkSource, closure.correctionSource]) guard(d);
guard(bind(closurePath));
const before = fs.readFileSync(correction.correction.source.path, 'utf8');
const after = fs.readFileSync(correction.correction.successor.path, 'utf8');
assert.equal(after.split(correction.correction.after).length - 1, 1);
assert.equal(after.replace(correction.correction.after, correction.correction.before), before);
const currentBindings = [...bindings.values()].sort((a, b) => a.path.localeCompare(b.path));
const at = new Date().toISOString();
const acceptance = {
  schema: 'root-corrected-whole-design-release/v1', status: 'DESIGN_ACCEPTED_COMPLETE_CONTENT_AUTHORSHIP_RELEASED',
  at, topicId: topic, position: 19, revision: 4, author: '/root',
  role: 'Root authored the bounded R1 metric correction; the original DIFFERENT reviewer supplies independent whole assessment and SAME closure. Root is not an additional independent reviewer.',
  wholeIndependentReview: closure.originalWholeReview, wholeIndependentReport: closure.originalWholeReport,
  sameClosure: bind(closurePath), sameReport: closure.report, correction: closure.correctionPacket,
  effectiveContracts: closure.effectiveContracts, currentSourceBindings: currentBindings,
  currentBindingDigest: hash(JSON.stringify(currentBindings)), mutableGuidance: mutable,
  exactSingleCorrectionInverse: true, protectedOriginalPairs: 28, immutableSelectedInputs: 117,
  scope: whole.fullScope, remainingRequiredFindings: [],
  rootReading: {
    completeCurrentContracts: closure.effectiveContracts.map(d => d.path),
    tools: ['ddfd0c', '4965e0', '1a4467', 'ca957a', '350419'],
    completeIndependentReports: ['3f0d34', 'a0e531'],
    freshIdentityTool: 'b051e7',
    qualification: 'Whole composed current design/contracts and independent reports personally read. Historical full baseline and original papers are retained author/reviewer evidence, not claimed as fresh whole Root research reading; no manuscript/native usability certification.'
  },
  mechanismDecisions: [
    'Draw measured bins, scaled patterns, addends, shaped matrices and an actual output cell before factorization notation.',
    'Teach residual cells, exact half-loss/norm/MSE conversions, fixed-dictionary cone projection and fresh cyclic coordinates before general fitting.',
    'Keep W-first coordinate updates distinct from original H-first MU, and descent, stationarity, caps and identifiability distinct.',
    'Use actual common-ruler saved8x8 patterns, amounts, weighted contributions and signed residuals; preserve all candidates/splits and retained PCA win.',
    'Build visible deeper MM, beta-domain, NNDSVD, penalty/mask, rank/support, anchor, text/spectrum, online and tensor/phase ladders with their exact assumptions.'
  ],
  permissions: {
    released: ['Complete continuous 19-section manuscript', '66 actionable actual-object drawing contracts and local taught-control investigations', '12 complete promised scratch/ordinary routes with explained code, usable sibling payloads and proper output roles', 'All24 solved A-X tasks, exact prerequisite/destination connections and distinct annotated ending roles'],
    held: ['Private runtime until complete independently reviewed content and Root release', 'Canonical/public/shared writes', 'Worker central phase writes', 'Content completion from an outline or source-file plan']
  },
  retainedLimits: [
    'No new original fits/mains/studies or historical checker replay; original three complete code/stdout pairs and28 pairs stay immutable.',
    'Full versus selected primary reading and failed primary pixels remain explicit; no fabricated benchmark or learner study.',
    'Original204/205 finite-check result retains its mutable-handoff equality observation; current immutable guards do not relabel that historical result.',
    'Ordinary API inspection is not execution parity; new complete content programmes need their own appropriately scoped evidence.',
    'Tensor/audio/probabilistic/physical-validation destinations retain their declared external scope; no invented accepted local owner.',
    'No current manuscript, native diagrams, browser interactions, implementation completion, user acceptance or best-possible representation claim.'
  ],
  nextAction: 'Content author consumes all seven effective contracts and retained source/research roles, then writes the entire actual manuscript, programmes/payloads, solved practice, visual specifications and source-bound handoff. A different reviewer assesses the whole content before Root opens runtime.'
};
const beforeBytes = fs.readFileSync(ledgerPath), ledger = JSON.parse(beforeBytes), old = ledger.topics[topic];
assert.equal(old.revision, 3);
const foreign = JSON.stringify(Object.fromEntries(Object.entries(ledger.topics).filter(([id]) => id !== topic)));
const prior = structuredClone(old), history = prior.previousRevisions || []; delete prior.previousRevisions;
ledger.topics[topic] = { revision: 4, deliveryMode: 'full', record: recordPath,
  content: { status: 'in-progress' }, implementation: { status: 'not-started' },
  nextAction: acceptance.nextAction, previousRevisions: [...history, prior] };
ledger.updatedOn = at.slice(0, 10); validateDeliveryLedger(ledger);
assert.equal(JSON.stringify(Object.fromEntries(Object.entries(ledger.topics).filter(([id]) => id !== topic))), foreign);
fs.writeFileSync(acceptedPath, JSON.stringify(acceptance, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(recordPath, '# NMF: latest reading-flow revision4\n\n' +
  'The complete corrected design is accepted in [design-accepted-root.json](design-accepted-root.json). Content is in progress; implementation is not started. The central ledger preserves historical revision3 and its prior history.\n\n' +
  'Root read all seven current contracts and both complete independent reports. The original DIFFERENT entire-design review and SAME R1 closure leave no required finding. All117 immutable selected inputs and28 original/copy pairs are exact; mutable global guidance retains a separate current observation. The single metric-definition correction reverses exactly.\n\n' +
  'Scope:19sections,66 actual-object visual jobs,12 complete prospective computational routes,24 solved tasks and9 outcomes. These remain a design, not a finished manuscript or implemented diagrams. Write actual explained algorithms, ordinary library routes, payloads and manuscript before content completion; independent whole-content review and Root release precede runtime.\n\n' +
  'Preserve captured original programmes/stdout/scientific results, saved digit arrays/splits/PCA outcome, explicit implementation/library/domain differences and original access/format qualifications. No unchanged fit/main/checker replay or neighboring lesson acceptance. Exact content inputs and permissions are in the Root release; obsolete draft next-action text remains historical rather than a current queue.\n', { flag: 'wx' });
assert.equal(hash(fs.readFileSync(ledgerPath)), hash(beforeBytes), 'Concurrent ledger edit requires selected-row rebase');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
const persisted = read(ledgerPath);
assert.equal(JSON.stringify(Object.fromEntries(Object.entries(persisted.topics).filter(([id]) => id !== topic))), foreign);
const phase = { status: 'DESIGN_RELEASED_CONTENT_IN_PROGRESS_RUNTIME_NOT_STARTED', at, topicId: topic, revision: 4,
  acceptance: bind(acceptedPath), record: bind(recordPath), immutableInputs: 117, currentBindings: currentBindings.length,
  foreignRowsUnchanged: Object.keys(persisted.topics).length - 1, previousRevisionPreserved: 3,
  ledgerBeforeSha256: hash(beforeBytes), ledgerAfterSha256: bind(ledgerPath).sha256,
  contentComplete: false, runtimeAcceptance: false, historicalScienceReplay: false };
fs.writeFileSync(phasePath, JSON.stringify(phase, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: phase.status, acceptance: bind(acceptedPath), phase: bind(phasePath), currentBindings: currentBindings.length, foreignRowsUnchanged: phase.foreignRowsUnchanged }));
