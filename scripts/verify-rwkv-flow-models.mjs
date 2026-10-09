import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { trajectoryMemoryForward, weightedMemory, kernelSummary, deltaMemory, gooseUpdate } from '../src/learn/data/rwkv-memory-models.js';
const root = 'docs/teaching/deep-learning-beginner/rwkv-linear-attention-models';
const assetPath = 'public/learn-assets/rwkv-linear-attention-models/trajectory-reading-flow-models.json';
const asset = JSON.parse(fs.readFileSync(assetPath));
const native = JSON.parse(fs.readFileSync(`${root}/reading-flow-native.json`));
const reference = JSON.parse(fs.readFileSync(`${root}/reading-flow-fitted-native-reference.json`));
const checks = [];
function close(name, actual, expected, tolerance = 3e-5) {
  const error = Math.max(...actual.flat(Infinity).map((v, i) => Math.abs(v - expected.flat(Infinity)[i])));
  assert(error <= tolerance, `${name}: ${error}`);
  checks.push({ name, maxAbsoluteError: error, tolerance });
}
for (const [model, parameters] of Object.entries(asset.models)) {
  const [kind] = model.split(':');
  for (const [i, specimen] of asset.specimens.entries()) {
    const result = trajectoryMemoryForward(parameters, specimen.points, kind);
    close(`${model} all validation source ${specimen.sourceRow}`, result.logits, reference.validation[model][i]);
  }
}
for (const record of native.nativeCases) {
  const parameters = asset.models[`${record.kind}:${record.seed}`];
  for (const [mode, options] of [['logits', {}], ['carried', { cut: 22 }], ['reset', { cut: 22, reset: true }]]) {
    const result = trajectoryMemoryForward(parameters, record.points, record.kind, options);
    close(`${record.kind}:${record.seed} ${record.sourceRow} ${record.mutation} ${mode}`, result.logits, record[mode]);
    if (mode === 'logits') close(`${record.kind}:${record.seed} ${record.mutation} first30features`, result.features.slice(0, 30), record.prefixFeatures);
  }
  if (record.mutation === 'point31') {
    const original = asset.specimens.find(s => s.sourceRow === record.sourceRow);
    const old = trajectoryMemoryForward(parameters, original.points, record.kind);
    const changed = trajectoryMemoryForward(parameters, record.points, record.kind);
    close(`${record.kind}:${record.seed} future point31 null`, changed.features.slice(0, 30), old.features.slice(0, 30), 0);
  }
}
for (const offset of [-1000, 0, 1000]) for (const bonus of [-4, 0, 4]) {
  const row = weightedMemory([0], [2], .5, bonus, offset)[0];
  const keyScale = 0 + offset, oldA = 0, oldB = 0, keyWeight = Math.exp(offset - keyScale);
  const pictured = (oldA + keyWeight * Math.exp(bonus) * 2) / (oldB + keyWeight * Math.exp(bonus));
  close(`empty weighted picture offset${offset} bonus${bonus}`, [pictured], [row.output], 1e-12);
}
const fixture = { queries: [[1,1],[2,1],[1,2],[3,1]], keys: [[1,0],[0,1],[1,1],[2,1]], values: [2,8,-1,5], chunk: 3 };
close('summary worked outputs', kernelSummary(fixture).map(r => r.output), [2,4,2.5,3], 1e-12);
for (const chunk of [1,2,3,8,12]) close(`summary chunk${chunk}`, kernelSummary({ ...fixture, chunk }).map(r => r.chunkOutput), [2,4,2.5,3], 1e-12);
assert.equal(kernelSummary({ ...fixture, queries: fixture.queries.map(() => [0,0]) })[0].output, null);
close('delta nonunit overshoot', deltaMemory([[2,0]], [3], 1)[0].delta, [6,0], 0);
close('goose second fixture', gooseUpdate([.6,.8]).next, [[4.152,5.212],[.552,2.412]], 1e-12);
const files = [assetPath, 'src/learn/data/rwkv-memory-models.js', `${root}/reading-flow-native.json`, `${root}/reading-flow-fitted-native-reference.json`, 'scripts/verify-rwkv-flow-models.mjs'];
const sourceHashes = Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.writeFileSync(`${root}/reading-flow-models.json`, JSON.stringify({ passed: true, sourceHashes, checks, count: checks.length, limits: 'Current JS/native parity only; no browser or new training.' }, null, 2) + '\n');
console.log(`PASS ${checks.length} current JS/native and fixture groups`);
