import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const id = 'long-context-sequence-models-transformer-xl-griffin-perceiver';
const asset = `public/learn-code/${id}/`;
const record = `docs/teaching/deep-learning-beginner/${id}/`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const prior = ['native-checks.json', 'independent-checks.json', 'model-checks.json']
  .map(name => [`docs/teaching/evidence/long-context/${name}`, read(`docs/teaching/evidence/long-context/${name}`)]);
const expected = {};
for (const [file, receipt] of prior) {
  assert.equal(receipt.status, 'passed', file);
  for (const [source, digest] of Object.entries(receipt.reviewedFiles ?? receipt.files ?? {})) {
    if (source.startsWith(asset) || source === 'src/learn/data/long-context-models.js') {
      if (expected[source]) assert.equal(expected[source], digest, `Conflicting scientific identity: ${source}`);
      expected[source] = digest;
    }
  }
}
const retained = ['sequence_mechanisms.py', 'latent_trajectory_classifier.py', 'memory_library_bridge.py',
  'movement_libras.data', 'movement_libras.names', 'small-fits.npz', 'trajectory-models.json',
  'trajectory-results.json', 'checked-results.json', 'investigation-checks.json', 'data-provenance.md']
  .map(name => asset + name);
const files = [...retained, 'src/learn/data/long-context-models.js', 'src/learn/data/long-context-intuition.js',
  'public/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/rotary-frequency-rules.py'];
const identities = Object.fromEntries(files.map(file => {
  const bytes = fs.readFileSync(file);
  const rawSha256 = hash(bytes);
  if (expected[file]) assert.equal(rawSha256, expected[file], `Retained scientific source changed: ${file}`);
  const isText = !file.endsWith('.npz');
  return [file, { rawSha256, lfSha256: isText ? hash(bytes.toString('utf8').replaceAll('\r\n', '\n')) : null,
    matchedHistoricalRaw: expected[file] ? true : null }];
}));

const payload = read(asset + 'trajectory-models.json');
const result = read(asset + 'trajectory-results.json');
assert.equal(payload.specimens.length, 50);
assert.equal(Object.keys(payload.models).length, 4);
assert.deepEqual(payload.specimens.map(s => s.sourceRow), result.data_roles.validation_source_rows);
const roles = Object.entries(result.data_roles);
assert.deepEqual(roles.map(([, rows]) => rows.length), [220, 50, 60]);
assert.equal(new Set(roles.flatMap(([, rows]) => rows)).size, 330);
const labels = fs.readFileSync(asset + 'movement_libras.data', 'utf8').trim().split(/\r?\n/)
  .map(row => Number(row.split(',').at(-1)) - 1);
const modelCounts = [];
for (const model of result.models) {
  const selected = model.history.reduce((best, row) => row[2] < best[2] ? row : best);
  assert.equal(selected[0], model.best_epoch);
  for (const [role, rows] of roles) {
    const key = role.replace('_source_rows', '');
    const metric = model.metrics[key];
    assert.equal(metric.predictions.length, rows.length);
    assert.equal(metric.n, rows.length);
    const errors = rows.filter((row, i) => metric.predictions[i] !== labels[row - 1]).length;
    assert.equal(metric.errors, errors);
    const count = metric.confusion.flat().reduce((a, b) => a + b, 0);
    const correct = metric.confusion.reduce((sum, row, i) => sum + row[i], 0);
    assert.equal(count, rows.length);
    assert.equal(count - correct, errors);
  }
  modelCounts.push({ latents: model.latents, seed: model.seed, parameters: model.parameters,
    selectedEpoch: model.best_epoch, errors: roles.map(([role]) => model.metrics[role.replace('_source_rows', '')].errors) });
}
const verifier = 'scripts/verify-long-context-flow-dependencies.mjs';
const receipt = {
  passed: true, createdAt: new Date().toISOString(),
  scope: 'Current retained raw/LF scientific identities, four fitted prediction/confusion recounts and validation epoch selection; no fitting, new native execution or UI approval.',
  identities, modelCounts,
  reusedEvidence: Object.fromEntries(prior.map(([file]) => [file, hash(fs.readFileSync(file))])),
  reuseLimit: 'Unchanged numerical programs/engines/fits only. Older presentation bindings do not certify current prose, drawings, controls or new operator code.',
  verifier: { file: verifier, rawSha256: hash(fs.readFileSync(verifier)) },
};
fs.mkdirSync(record, { recursive: true });
fs.writeFileSync(record + 'reading-flow-scientific-dependencies.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, scientificFiles: files.length, historicalMatches: Object.keys(expected).length,
  recountedPredictions: 4 * 330, modelCounts }));
