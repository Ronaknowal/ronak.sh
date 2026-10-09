import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Root-owned completion gate; the separately written review records actual
// source and opened-paint acceptance. Hash checks cannot create that acceptance.
const base = 'docs/teaching/tokenization';
const previousPath = `${base}/reading-flow-evidence/color-correspondence/previous-checkpoint.json`;
const evidence = `${base}/reading-flow-evidence/color-correspondence/accepted-color`;
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bind = files => Object.fromEntries([...new Set(files)].map(file => [file, hash(file)]));
const match = files => { for (const [file, expected] of Object.entries(files)) assert.equal(hash(file), expected, file); };
const previous = read(previousPath);
const baseline = read(`${base}/reading-flow-baseline.json`);
assert.equal(hash('src/learn/data/lesson-manifest.json'), baseline.manifestHash);
match(baseline.protectedOriginals);
const currentAuthorReceipts = [
  `${base}/${previous.scope[0]}/colour-feedback-evidence/prototype-key-guard.json`,
  `${base}/${previous.scope[1]}/colour-feedback-evidence/final-renewal/check.json`,
  `${base}/${previous.scope[2]}/colour-feedback-evidence/author-browser-final.json`,
];
for (const file of currentAuthorReceipts) {
  const receipt = read(file);
  match(receipt.sourceSha256 || receipt.sources ||
    Object.fromEntries(receipt.sourceBindings.map(row => [row.path, row.sha256])));
}
if (process.argv.includes('--record-review')) {
  const browser = read(`${evidence}/browser.json`);
  match(browser.sourceHashes);
  const authorEvidence = [...currentAuthorReceipts,
    `${base}/${previous.scope[0]}/colour-feedback-evidence/source-check.json`,
    `${base}/${previous.scope[0]}/colour-feedback-evidence/browser-paint.json`,
    `${base}/${previous.scope[1]}/colour-feedback-evidence/source-check.json`,
    `${base}/${previous.scope[1]}/colour-feedback-evidence/browser-check.json`,
    `${base}/${previous.scope[1]}/colour-feedback-evidence/paint-review.json`,
    `${base}/${previous.scope[1]}/colour-feedback-evidence/final-renewal/merge-correspondence-diagnostic.json`,
    `${base}/${previous.scope[2]}/colour-feedback-evidence/source-check.json`,
    `${base}/${previous.scope[2]}/colour-feedback-evidence/source-equivalence-after-palette-guard.json`,
    `${base}/${previous.scope[2]}/colour-feedback-evidence/copied-evidence.json`];
  // These are the views root personally opened, not automatically approved
  // merely because the browser produced screenshots.
  const finalPaints = [
    `${previous.scope[0]}-03-desktop`, `${previous.scope[0]}-13-phone`, `${previous.scope[0]}-18-enlarged`,
    `${previous.scope[2]}-00-desktop`, `${previous.scope[2]}-03-phone`, `${previous.scope[2]}-05-enlarged`,
    `${previous.scope[2]}-09-phone`, `${previous.scope[2]}-14-desktop`, `${previous.scope[2]}-04-desktop`,
    `${previous.scope[2]}-18-phone`, `${previous.scope[2]}-19-enlarged`,
  ].map(file => `${evidence}/screenshots/${file}.png`);
  const predecessorPaints = [
    `${base}/reading-flow-evidence/color-correspondence/final/screenshots/${previous.scope[0]}-00-phone.png`,
    `${base}/reading-flow-evidence/color-correspondence/final/screenshots/${previous.scope[0]}-04-desktop.png`,
    `${base}/reading-flow-evidence/color-correspondence/final/screenshots/${previous.scope[0]}-10-phone.png`,
    ...['text-storage-1366-1x', 'byte-merges-390-1x', 'unicode-scientist-phone', 'byte-targets-768-2x', 'architecture-blt-390-1x']
      .map(file => `${base}/${previous.scope[1]}/colour-feedback-evidence/paints/${file}.png`),
  ];
  const review = { checkedAt: new Date().toISOString(), accepted: true, reviewer: 'root',
    scope: previous.scope, sourceHashes: browser.sourceHashes, authorEvidenceHashes: bind(authorEvidence),
    personallyOpenedFinalPaint: bind(finalPaints), personallyOpenedPredecessorPaint: bind(predecessorPaints),
    reviewRecords: bind(previous.scope.map(id => `${base}/${id}/reading-flow-independent-review.md`)),
    basis: 'Root actually reviewed the changed sources/captions/styles against revision3 and personally opened the listed views plus final in-app reader. Their recorded conclusions, corrections and limits are in the independent topic reviews.',
    predecessorLimits: 'Pre-guard worked-state paint is identified separately. The own-property guard conserves all those literal-key hues; author final renewal establishes selected image equality. No universal compiled-byte equivalence or fresh scientific fit is claimed.',
    reference: 'Later multimodal token stream uses identity hues; retained reference screenshot and exact style observation in the parent color-correspondence directory.',
  };
  fs.writeFileSync(`${evidence}/independent-review.json`, `${JSON.stringify(review, null, 2)}\n`);
  console.log(JSON.stringify({ recordedActualReview: true, sourceFiles: Object.keys(browser.sourceHashes).length }));
  process.exit(0);
}
const review = read(`${evidence}/independent-review.json`);
assert.equal(review.reviewer, 'root');
assert.equal(review.accepted, true);
match(review.sourceHashes);
const browser = read(`${evidence}/browser.json`);
const manifestHash = hash('dist-tokenization-flow/.vite/manifest.json');
assert.equal(browser.buildManifestHash, manifestHash);
assert.equal(browser.records.length, 3);
assert(browser.records.every(row => row.passed && !row.errors.length));
match(browser.sourceHashes);
for (const topic of browser.records) for (const state of topic.states) for (const figure of state.figures) {
  if (figure.screenshot) assert.equal(hash(figure.screenshot), figure.screenshotSha256);
}
const numerics = read(`${evidence}/independent-numerics.json`);
match(numerics.sourceHashes);
assert.equal(numerics.checks.length, 6);
const site = read(`${evidence}/site-build.json`);
assert(site.passed && site.buildManifestSha256 === manifestHash);
const intermediate = read(`${evidence}/intermediate-layout.json`);
assert(intermediate.passed && intermediate.manifestHash === manifestHash);
assert.equal(read(`${evidence}/load-boundaries.json`).results.length, 11);
match(review.authorEvidenceHashes);
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const ledger = read(ledgerPath); // Fresh read: preserve unrelated concurrent work.
const common = [previousPath, `${base}/visual-vocabulary.md`, `${base}/reading-flow-integration.md`, `${base}/README.md`,
  ...['independent-review.json', 'browser.json', 'independent-numerics.json', 'site-build.json', 'intermediate-layout.json', 'load-boundaries.json', 'build.log'].map(file => `${evidence}/${file}`),
  'scripts/finalize-tokenization-color-feedback.mjs', ...Object.keys(review.authorEvidenceHashes)];
const checkedAt = new Date().toISOString();
const checkpoints = {};
for (const id of previous.scope) {
  const entry = ledger.topics[id];
  assert.equal(entry.revision, 4);
  const { previousRevisions: history, ...oldCurrent } = previous.topics[id];
  assert.deepEqual(entry.previousRevisions.at(-1), oldCurrent);
  // Colours/captions are authorized; model/program/data/publication identities
  // are conserved against the accepted scientific revision, not re-certified.
  match(Object.fromEntries(Object.entries(previous.topics[id].content.files).filter(([file]) =>
    file.startsWith('public/') || file.startsWith('src/learn/data/') && !file.startsWith('src/learn/data/topics/'))));
  const content = { ...previous.topics[id].content, completedAt: checkedAt,
    files: bind(Object.keys(previous.topics[id].content.files)) };
  const implementation = { status: 'complete', completedAt: checkedAt,
    reviewedFiles: bind([...Object.keys(previous.topics[id].implementation.reviewedFiles),
      'src/learn/components/lesson-labs/token-identity-colors.js',
      'src/learn/components/lesson-labs/token-identity-colors.css', ...common]),
    presentationReviews: [{ record: `${evidence}/independent-review.json`, previousCheckpoint: previousPath,
      scope: 'Labelled piece/group/corpus identity colours; existing arithmetic, topology, programs and data preserved.' }] };
  checkpoints[id] = { content, implementation };
  entry.content = content;
  entry.implementation = implementation;
  entry.nextAction = 'Both phases complete; await user reading feedback on the restored colour correspondence. Only the first three LLM topics are included.';
}
const acceptance = { checkedAt, passed: true, independentAcceptance: true, reviewer: 'root', revision: 4,
  scope: previous.scope, buildManifestHash: manifestHash, evidenceHashes: bind(common), topicCheckpoints: checkpoints,
  preservedScientificInputs: numerics.reusedBindings,
  limits: 'Scoped presentation/source and expert paint acceptance; no new research, learner trial, GPU reproduction or later-topic recertification. Diagnostic predecessor builds remain labelled by the review.' };
fs.writeFileSync(`${evidence}/accepted.json`, `${JSON.stringify(acceptance, null, 2)}\n`);
fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ passed: true, revision: 4, manifestHash, scope: previous.scope }));
