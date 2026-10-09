import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// This identity receipt reuses scientific executions, never their old UI approval.
// Old native/model writers are intentionally not invoked or overwritten.
const outputRoot = 'docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong';
const assetRoot = 'public/learn-code/attention-mechanism-bahdanau-luong';
const nativeReceiptPath = 'docs/teaching/evidence/recurrent-attention-native.json';
const modelsReceiptPath = 'docs/teaching/evidence/recurrent-attention-models.json';
const nativeReceipt = JSON.parse(fs.readFileSync(nativeReceiptPath, 'utf8'));
const modelsReceipt = JSON.parse(fs.readFileSync(modelsReceiptPath, 'utf8'));
assert.equal(nativeReceipt.passed, true);
assert.equal(modelsReceipt.passed, true);

const expected = {
  ...nativeReceipt.reviewedFiles,
  'src/learn/data/recurrent-attention-models.js': modelsReceipt.reviewedFiles['src/learn/data/recurrent-attention-models.js'],
  'src/learn/data/recurrent-attention-measurements.json': modelsReceipt.reviewedFiles['src/learn/data/recurrent-attention-measurements.json'],
};
const scientificFiles = [
  ...fs.readdirSync(assetRoot).filter(name => /\.(?:py|json|csv|md)$/.test(name)).map(name => `${assetRoot}/${name}`),
  'src/learn/data/recurrent-attention-models.js',
  'src/learn/data/recurrent-attention-measurements.json',
  'public/learn-assets/rnns-lstms-grus/recurrent-cells.py',
  'public/learn-code/sequence-to-sequence-encoder-decoder/explicit-inflector.py',
  'public/learn-code/sequence-to-sequence-encoder-decoder/calculated-inputs.json',
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const identities = Object.fromEntries(scientificFiles.map(file => {
  const bytes = fs.readFileSync(file);
  const rawSha256 = hash(bytes);
  const lfSha256 = hash(bytes.toString('utf8').replace(/\r\n/g, '\n'));
  if (expected[file]) assert.equal(rawSha256, expected[file], `${file}: historical scientific identity changed`);
  return [file, { rawSha256, lfSha256, matchedHistoricalRaw: expected[file] ? true : null }];
}));
const mechanics = JSON.parse(fs.readFileSync(`${assetRoot}/mechanics-results.json`, 'utf8'));
const earlierFit = identities['public/learn-code/sequence-to-sequence-encoder-decoder/calculated-inputs.json'];
assert.equal(earlierFit.rawSha256, mechanics.prior_baseline.source_sha256);
const payload = JSON.parse(fs.readFileSync(`${assetRoot}/calculated-inputs.json`, 'utf8'));
assert.equal(payload.runs.length, 6);
assert.equal(payload.protocol.input_feeding, false);
assert.deepEqual(payload.protocol.seeds, [1, 2, 3]);
for (const run of payload.runs) assert.equal(run.development_predictions.length, 447);

const receipt = {
  passed: true,
  createdAt: new Date().toISOString(),
  scope: 'Current raw/LF scientific identity, six retained prediction-array sizes and exact predecessor baseline identity; no new native/model/fit/browser execution.',
  reusedEvidence: [nativeReceiptPath, modelsReceiptPath],
  reuseLimit: 'Only the unchanged native scientific programs/data and pure browser numerical engine. Current prose, figures, styles, controls and new scratch composition need separate evidence.',
  identities,
  verifier: { file: 'scripts/verify-recurrent-attention-flow-dependencies.mjs', rawSha256: hash(fs.readFileSync('scripts/verify-recurrent-attention-flow-dependencies.mjs')) },
};
fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, 'reading-flow-scientific-dependencies.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ passed: true, scientificFiles: scientificFiles.length, historicalRawMatches: Object.keys(expected).filter(file => identities[file]).length, retainedModels: payload.runs.length }));
