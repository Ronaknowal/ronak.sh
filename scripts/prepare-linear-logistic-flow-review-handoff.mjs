import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const writeNew = (path, value) => {
  assert(!fs.existsSync(path), `Preserve existing receipt ${path}`);
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
};
const priorPath = folder + '/reading-flow-ready-first-pass-route.json';
const prior = read(priorPath);
assert.equal(hash(priorPath), '69618562fff56ed80913fcf6088205d2aca1c0e25c254a05d7f6c27996cf1cd9');
const changed = ['src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx'];
const current = Object.fromEntries(changed.map(path => [path, hash(path)]));
for (const [path, expected] of Object.entries(prior.sourceHashes)) {
  if (!changed.includes(path)) assert.equal(hash(path), expected, path);
}
for (const [path, expected] of Object.entries(prior.evidenceHashes)) assert.equal(hash(path), expected, path);
const receiptNames = ['reading-flow-author-sources-bounded-review-corrections-painted.json',
  'reading-flow-review-corrections-numerics-painted.json',
  'reading-flow-layout-bounded-review-corrections-painted.json',
  'reading-flow-review-corrections-browser-painted.json',
  'reading-flow-review-corrections-settled-pans.json',
  'reading-flow-review-corrections-loss-right.json'];
const receipts = Object.fromEntries(receiptNames.map(name => [name, read(folder + '/' + name)]));
for (const receipt of Object.values(receipts)) {
  for (const [path, expected] of Object.entries(current)) assert.equal(receipt.sourceHashes[path], expected);
}
assert.equal(receipts[receiptNames[0]].checks.length, 119);
assert.equal(receipts[receiptNames[0]].originalMathBlocksRetained, 14);
assert.equal(receipts[receiptNames[1]].checks.length, 20);
assert.equal(receipts[receiptNames[1]].unchangedBindings, 23);
assert.equal(receipts[receiptNames[3]].checks.length, 7);
const buildLog = folder + '/reading-flow-build-review-corrections.log';
fs.copyFileSync('scratch/linear-logistic-reading-flow/build-bounded-review-corrections-painted.log', buildLog, fs.constants.COPYFILE_EXCL);
assert(fs.readFileSync(buildLog, 'utf8').includes('built in 1m 17s'));
const buildReceipt = folder + '/reading-flow-build-review-corrections.json';
writeNew(buildReceipt, { recordedAt: new Date().toISOString(),
  scope: 'Actual author isolated Vite v6.4.1 production build, completed before targeted current production checks. Shared integration is parent-owned.',
  exitCode: 0, reportedDuration: '1m 17s', outputDirectory: 'scratch/linear-logistic-reading-flow/dist',
  previewPort: 4841, sourceHashes: current, log: buildLog, logHash: hash(buildLog) });
const additions = ['scripts/verify-linear-logistic-flow-review-corrections.cjs',
  'scripts/verify-linear-logistic-flow-review-numerics.mjs',
  'scripts/verify-linear-logistic-flow-review-pans.cjs',
  'scripts/verify-linear-logistic-flow-review-loss-pans.cjs',
  'scripts/prepare-linear-logistic-flow-review-handoff.mjs',
  folder + '/reading-flow-review-corrections.md',
  folder + '/before-bounded-review-corrections/linear-logistic-regression.jsx',
  folder + '/before-bounded-review-corrections/RegressionGeometryDrawings.jsx',
  folder + '/before-bounded-review-corrections/LinearLogisticFlowLabs.jsx',
  folder + '/before-bounded-review-corrections/sources.json'];
const sourceHashes = { ...prior.sourceHashes, ...current,
  ...Object.fromEntries(additions.map(path => [path, hash(path)])) };
const newEvidence = [priorPath, ...receiptNames.map(name => folder + '/' + name), buildLog, buildReceipt];
const evidenceHashes = { ...prior.evidenceHashes,
  ...Object.fromEntries(newEvidence.map(path => [path, hash(path)])) };
const browser = receipts[receiptNames[3]];
const settled = receipts[receiptNames[4]];
const right = receipts[receiptNames[5]];
const personallyViewed = [
  ...settled.views.map(view => ({ path: view.picture, hash: view.pictureHash })),
  ...browser.pictures.filter(view => view.state === 'penalty02-weight2' || view.state === 'penalty02-weight12')
    .map(view => ({ path: view.path, hash: view.hash })),
  ...right.views.map(view => ({ path: view.picture, hash: view.pictureHash }))
];
assert.equal(personallyViewed.length, 21);
for (const view of personallyViewed) assert.equal(hash(view.path), view.hash);
const manifest = { ...prior, at: new Date().toISOString(),
  candidateStatus: 'corrected-candidate-frozen-for-independent-closure',
  scope: 'One coherent correction of five bounded independent findings. Author checks are complete for this scoped delta; parent independent closure and shared integration remain pending. No phase promotion or unchanged-fit rerun.',
  sourceHashes, evidenceHashes,
  scopeCounts: { sections: 14, practices: 12, figures: 54, liveQuestions: 10,
    authorTeachingCalculations: 119, originalFormalMathBlocksRetained: 14,
    newComplementaryCalculations: 20, unchangedPriorSourceBindings: 23,
    currentTargetedBrowserGroups: 7, currentExportedPictures: browser.pictures.length,
    settledCenterPictures: settled.views.length, maximumWeightRightPictures: right.views.length,
    personallyInspectedCurrentPictures: personallyViewed.length,
    reusedPriorBrowserGroups: 24, reusedPriorNativePanGroups: 6 },
  scientificReuse: 'All 23 unaffected prior source bindings and all prior evidence bindings rechecked raw-exact. Numerical engines, all ten complete programme strings and deployed programmes unchanged. Original native/library/fit evidence retained with its original scope; no fresh scientific execution claimed for the presentation delta.',
  supersedes: { path: priorPath, hash: hash(priorPath), reason: 'Five bounded independent-review corrections; original full candidate, first-pass route and all prior receipts preserved.' },
  boundedDeltaRecord: folder + '/reading-flow-review-corrections.md',
  beforeCorrection: folder + '/before-bounded-review-corrections/sources.json',
  personallyViewed,
  panEvidenceLimit: 'Use settled-pans receipt for actual centered positions; the native keyboard campaign named center images can contain pending movement. Narrow/enlarged views intentionally retain full-size annotations with accessible horizontal pan.',
  remaining: ['Parent independent closure of the five bounded findings against exact current sources and actual scoped paint',
    'Parent central phase and shared production/site/repository/artifact/loading integration'] };
const output = folder + '/reading-flow-ready-review-corrections.json';
writeNew(output, manifest);
console.log(JSON.stringify({ path: output, hash: hash(output), sourceBindings: Object.keys(sourceHashes).length,
  evidenceBindings: Object.keys(evidenceHashes).length, current, personallyViewed: personallyViewed.length }, null, 2));
