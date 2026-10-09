import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// New revision receipt only. Historical writers and training entry points are not run.
const id = 'state-space-models-s4-mamba-mamba-2';
const record = `docs/teaching/deep-learning-beginner/${id}`;
const original = 'docs/teaching/deep-learning-beginner/original/state-space-before-reading-flow';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const presentation = [
  `src/learn/data/topics/${id}.jsx`,
  'src/learn/components/lesson-labs/StateSpaceLabs.jsx',
  'src/learn/components/lesson-labs/StateSpaceFigures.jsx',
  'src/learn/components/lesson-labs/StateSpaceIntuition.jsx',
  'src/learn/components/lesson-labs/state-space-labs.css',
];
const science = [
  'src/learn/data/state-space-models.js',
  'src/learn/data/state-space-intuition.js',
  'src/learn/data/state-space-measurements.json',
  ...fs.readdirSync(`public/learn-code/${id}`).map(name => `public/learn-code/${id}/${name}`),
];
fs.mkdirSync(record, { recursive: true });
fs.mkdirSync(original, { recursive: true });
const frozenPath = `${original}/sources.json`;
let frozen;
if (!fs.existsSync(frozenPath)) {
  const sources = {};
  for (const source of [...presentation, ...science]) {
    const bytes = fs.readFileSync(source);
    const target = `${original}/${source}`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { flag: 'wx' });
    sources[source] = { sha256: digest(bytes), lfSha256: digest(bytes.toString('utf8').replaceAll('\r\n', '\n')), bytes: bytes.length, snapshot: target };
  }
  frozen = { topic: id, capturedAt: new Date().toISOString(), status: 'Pre-edit originals, never overwritten', sources };
  fs.writeFileSync(frozenPath, `${JSON.stringify(frozen, null, 2)}\n`, { flag: 'wx' });
} else frozen = JSON.parse(fs.readFileSync(frozenPath));
const sourceHashes = {};
// Once captured, new reference programs are additions, not claimed old dependencies.
const protectedScience = Object.keys(frozen.sources).filter(source => !presentation.includes(source));
for (const source of protectedScience) {
  const bytes = fs.readFileSync(source), hash = digest(bytes);
  assert.equal(hash, frozen.sources[source].sha256, `Conserved scientific dependency changed: ${source}`);
  sourceHashes[source] = { sha256: hash, lfSha256: digest(bytes.toString('utf8').replaceAll('\r\n', '\n')), bytes: bytes.length };
}
const assetRoot = `public/learn-code/${id}`;
const provenance = JSON.parse(fs.readFileSync(`${assetRoot}/asset-provenance.json`));
const provenanceComparisons = {};
for (const [name, hash] of Object.entries(provenance.sha256)) {
  const actual = sourceHashes[`${assetRoot}/${name}`];
  provenanceComparisons[name] = actual.sha256 === hash ? 'raw identical' : actual.lfSha256 === hash ? 'LF-normalized identical only' : 'different historical provenance binding; inspect before reuse';
}
const native = JSON.parse(fs.readFileSync('docs/teaching/evidence/state-space-native.json'));
const models = JSON.parse(fs.readFileSync('docs/teaching/evidence/state-space-models.json'));
assert.equal(native.passed, true); assert.equal(models.passed, true);
const historicalBindings = {};
for (const [name, expected] of Object.entries(models.sourceHashes)) {
  if (!sourceHashes[name]) continue;
  const current = sourceHashes[name];
  historicalBindings[name] = current.sha256 === expected ? 'raw identical' : current.lfSha256 === expected ? 'LF-normalized identical only' : 'changed; no blind historical reuse';
}
const results = JSON.parse(fs.readFileSync(`${assetRoot}/trajectory-results.json`));
const inference = JSON.parse(fs.readFileSync(`${assetRoot}/trajectory-inference.json`));
const measurements = JSON.parse(fs.readFileSync('src/learn/data/state-space-measurements.json'));
const receipt = {
  topic: id, checkedAt: new Date().toISOString(), passed: true,
  checks: ['Current raw and LF identities of all retained scientific dependencies captured before presentation edits', 'Every scientific file still matches the immutable original snapshot', 'Old native/model receipts read only; no native execution, retraining or new browser certification'],
  sourceHashes, originalManifest: { path: frozenPath, sha256: digest(fs.readFileSync(frozenPath)) }, provenanceComparisons, historicalBindings,
  historicalNumerics: { nativePassed: native.passed, nativeCases: native.cases?.length, browserModelNativeCases: models.nativeCases, maxLogitError: models.maxLogitError },
  assetSchema: { resultKeys: Object.keys(results), inferenceKeys: Object.keys(inference), measurementKeys: Object.keys(measurements) },
};
fs.writeFileSync(`${record}/reading-flow-scientific-dependencies.json`, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ passed: true, scientificFiles: protectedScience.length, originalFiles: Object.keys(frozen.sources).length, provenanceComparisons, historicalBindings, assetSchema: receipt.assetSchema }));
