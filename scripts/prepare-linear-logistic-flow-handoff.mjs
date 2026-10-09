import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const runtime = [
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/data/linear-logistic-flow-models.js',
  ...['LinearLogisticDrawings.jsx', 'LinearLogisticFlowLabs.jsx',
    'RegressionGeometryDrawings.jsx', 'RegressionInferenceDrawings.jsx',
    'linear-logistic-flow.css'].map(name => 'src/learn/components/lesson-labs/' + name),
];
const science = ['src/learn/data/linear-logistic-models.js',
  'src/learn/data/linear-logistic-examples.js',
  ...['weighted-least-squares.py', 'newton-logistic.py', 'diabetes-regression.py']
    .map(name => 'public/learn-code/linear-logistic-regression/' + name)];
const checkers = ['verify-linear-logistic-flow-sources.mjs',
  'verify-linear-logistic-flow-weighted.py', 'verify-linear-logistic-flow-layout.cjs',
  'verify-linear-logistic-flow-browser.cjs', 'verify-linear-logistic-flow-pan.cjs',
  'format-linear-logistic-flow.mjs', 'prepare-linear-logistic-flow-handoff.mjs']
  .map(name => 'scripts/' + name);
const read = name => JSON.parse(fs.readFileSync(folder + '/' + name));
const source = read('reading-flow-author-sources-final-dynamic-axis-labels.json');
const browser = read('reading-flow-browser-final-dynamic-axis-labels.json');
const layout = read('reading-flow-layout-final-dynamic-axis-labels.json');
const pan = read('reading-flow-pan-final-dynamic-axis-labels.json');
for (const receipt of [source, browser, layout, pan]) {
  for (const [path, hash] of Object.entries(receipt.sourceHashes)) assert.equal(digest(path), hash, path);
}
assert.equal(source.checks.length, 119);
assert.equal(browser.checks.length, 24);
assert.equal(browser.pictures.length, 112);
assert.deepEqual(browser.errors, []);
assert.equal(pan.checks.length, 6);
for (const view of layout.views) {
  assert.equal(view.figures.length, 50);
  assert.deepEqual(view.targetIssues, []);
  for (const figure of view.figures) {
    assert.deepEqual(figure.outside, []);
    assert.deepEqual(figure.collisions, []);
    assert(figure.minimumFont >= 15.99);
  }
}
for (const receipt of [browser, pan]) {
  for (const picture of receipt.pictures) assert.equal(digest(picture.path), picture.sha256);
}
const weighted = read('reading-flow-weighted-native-current-programme.json');
assert.equal(digest(weighted.source), weighted.sha256);
const existing = read('reading-flow-existing-programs.json');
for (const program of existing.programs) assert.equal(digest(program.path), program.rawSha256);
const original = JSON.parse(fs.readFileSync('docs/teaching/classical-ml-reading-flow/original/linear-logistic-before-reading-flow/sources.json'));
for (const path of science.filter(path => !path.endsWith('weighted-least-squares.py'))) {
  assert.equal(digest(path), original.records.find(record => record.path === path).sha256);
}
const log = folder + '/reading-flow-build.log';
assert(/built in/.test(fs.readFileSync(log, 'utf8')));
const build = folder + '/reading-flow-build.json';
assert(!fs.existsSync(build), 'Preserve the existing frozen build receipt.');
fs.writeFileSync(build, JSON.stringify({ at: new Date().toISOString(),
  scope: 'Author actual own isolated Vite production build, exit 0; shared site/repository/loading integration remains parent-owned',
  command: 'node --max-old-space-size=6144 node_modules/vite/bin/vite.js build --outDir scratch/linear-logistic-reading-flow/dist --emptyOutDir',
  log, logSha256: digest(log), sourceHashes: browser.sourceHashes,
  preview: 'http://127.0.0.1:4841', buildCompleted: true }, null, 2) + '\n');
const records = [folder + '/reading-flow-revision.md',
  'docs/teaching/classical-ml-reading-flow/original/linear-logistic-before-reading-flow/accepted-reading-flow-design.md',
  'docs/teaching/classical-ml-reading-flow/original/linear-logistic-before-reading-flow/sources.json',
  'docs/teaching/topic-notes/k-nearest-neighbors-knn.md'];
const evidence = [
  'reading-flow-author-sources-final-dynamic-axis-labels.json',
  'reading-flow-weighted-native-current-programme.json', 'reading-flow-existing-programs.json',
  'reading-flow-design-independent.json', 'reading-flow-layout-final-dynamic-axis-labels.json',
  'reading-flow-browser-final-dynamic-axis-labels.json', 'reading-flow-pan-final-dynamic-axis-labels.json',
  'reading-flow-formatting.json', 'reading-flow-build.json', 'reading-flow-build.log',
].map(name => folder + '/' + name);
evidence.push('docs/teaching/evidence/linear-logistic-native-review.json');
const ready = folder + '/reading-flow-ready.json';
assert(!fs.existsSync(ready), 'Preserve the exact earlier candidate manifest.');
fs.writeFileSync(ready, JSON.stringify({ at: new Date().toISOString(),
  topicId: 'linear-logistic-regression', candidateStatus: 'frozen-for-independent-review',
  scope: 'Complete author candidate; final independent source review and parent shared integration pending. No phase completion claim.',
  manuscript: runtime[0], visualSpecifications: records[0],
  sourceHashes: Object.fromEntries([...runtime, ...science, ...checkers, ...records].map(path => [path, digest(path)])),
  evidenceHashes: Object.fromEntries(evidence.map(path => [path, digest(path)])),
  scopeCounts: { sections: 14, practices: 12, figures: 50, liveQuestions: 10,
    authorTeachingCalculations: 119, currentBrowserGroups: 24, nativePanGroups: 6,
    defaultPaintedViews: 100, changedPaintedViews: 12, enlargedRightPaintedViews: 6 },
  scientificReuse: 'Original engine and all ten programme strings raw-identical to rollback; two complete formerly-unlinked programmes retain exact current CPU receipts. New WLS programme has its own actual CPU/library and boundary checks. No refits or rewritten historical receipts.',
  remaining: ['Independent complete-source/drawing/lab/program review and closure of actual findings',
    'Parent shared current production/site/repository/artifact/loading integration'],
}, null, 2) + '\n');
console.log(JSON.stringify({ ready, sha256: digest(ready), sources: runtime.length + science.length + checkers.length + records.length,
  evidence: evidence.length }));
