// Nonwriter checks for the new controlled reading-flow mechanisms and wrapper traces.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {
  hybridFlowInitialRecords, hybridFlowMemory, hybridTinySelectiveStep,
  hybridFlowDiscretization, hybridFlowCompose, hybridFlowBudget, hybridFlowRouter,
  validateHybridFlowSnapshot, hybridFlowStroke, hybridFlowContinuation, hybridFlowDeltaContrast,
} from '../src/learn/data/hybrid-memory-flow-models.js';
import { hybridStudy } from '../src/learn/data/hybrid-jamba-study.js';

const id = 'hybrid-ssm-transformer-architectures-jamba';
const record = `docs/teaching/deep-learning-beginner/${id}`;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const dependencies = JSON.parse(fs.readFileSync(`${record}/reading-flow-scientific-dependencies.json`));
const nativePath = `${record}/reading-flow-native-oracles.json`;
const native = JSON.parse(fs.readFileSync(nativePath));
let checks = 0, maximumTinyDifference = 0, maximumNativeDifference = 0;
const close = (actual, expected, tolerance = 1e-11) => {
  assert.equal(Array.isArray(actual), Array.isArray(expected));
  if (Array.isArray(expected)) { assert.equal(actual.length, expected.length); actual.forEach((value, index) => close(value, expected[index], tolerance)); return; }
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
  checks++;
};
const difference = (a, b) => Math.max(...a.flat(Infinity).map((value, index) => Math.abs(value - b.flat(Infinity)[index])));
for (const [path, identity] of Object.entries(dependencies.sourceHashes)) { assert.equal(hash(fs.readFileSync(path)), identity.sha256, path); checks++; }
for (const [path, identity] of Object.entries(native.sourceHashes)) { assert.equal(hash(fs.readFileSync(path)), identity, path); checks++; }

const defaultMemory = hybridFlowMemory(hybridFlowInitialRecords, 'A', .5, Math.log(9));
close(defaultMemory.summary, 32 / 7); close(defaultMemory.attention, 29 / 11);
close(defaultMemory.states, [[2, 1, 2], [8, 1.5, 16 / 3], [8, 1.75, 32 / 7]]);
const collision = hybridFlowMemory([{ key: 'A', value: 6 }, { key: 'B', value: 5 }, { key: 'C', value: 4 }], 'A', .5, Math.log(9));
close(collision.summary, defaultMemory.summary); close(collision.attention, 63 / 11);
for (const decay of [0, .1, .5, .75, 1]) {
  const absent = hybridFlowMemory(hybridFlowInitialRecords, 'Absent', decay, 6);
  close(absent.weights, [1 / 3, 1 / 3, 1 / 3]); close(absent.attention, 13 / 3);
  const constant = hybridFlowMemory(hybridFlowInitialRecords.map(row => ({ ...row, value: -3 })), 'A', decay, -6);
  close(constant.summary, -3); close(constant.attention, -3);
  const reordered = hybridFlowMemory([...hybridFlowInitialRecords].reverse(), 'A', decay, Math.log(9));
  close(reordered.attention, defaultMemory.attention);
}
for (const fixture of native.tiny) {
  const actual = hybridTinySelectiveStep({ input: fixture.input });
  for (const name of ['projected', 'gate', 'convolution', 'transformed', 'delta', 'decay', 'retained', 'written', 'state', 'contraction', 'output']) {
    close(actual[name], fixture[name]);
    maximumTinyDifference = Math.max(maximumTinyDifference, difference(actual[name], fixture[name]));
  }
  close(actual.writeNorm.values, fixture.write); close(actual.readNorm.values, fixture.read);
}
for (const interval of [0, .000001, .1, 1, 2]) {
  for (const rate of [0, -1e-9, -.1, -1, -3]) {
    const result = hybridFlowDiscretization(rate, interval, 2, 1);
    close(result.exactState, Math.exp(rate * interval) + (rate === 0 ? interval : Math.expm1(rate * interval) / rate) * 2);
    if (!rate || !interval) close(result.exactState, result.approximateState);
  }
}
close(hybridFlowDiscretization(-1, 1, 2, 1).exactState, 2 - Math.exp(-1));
close(hybridFlowDiscretization(-1, 1, 2, 1).approximateState, 2 + Math.exp(-1));
const maps = [{ a: .5, b: 2 }, { a: .25, b: -1 }, { a: .8, b: .2 }];
close(Object.values(hybridFlowCompose(hybridFlowCompose(maps[0], maps[1]), maps[2])), [.1, -.2]);
close(Object.values(hybridFlowCompose(maps[0], hybridFlowCompose(maps[1], maps[2]))), [.1, -.2]);
assert.notDeepEqual(hybridFlowCompose(maps[0], maps[1]), hybridFlowCompose(maps[1], maps[0])); checks++;
const budget = hybridFlowBudget({});
assert.equal(budget.kv, 4n * 2n ** 30n); assert.equal(budget.recurrent, 14n * 2n ** 20n); assert.equal(budget.convolution, 7n * 2n ** 18n); checks += 3;
const prompt = hybridFlowBudget({ length: 32768 }).operations;
assert.equal(prompt.projection, 2748779069440n); assert.equal(prompt.promptPairs, 8796361457664n); checks += 2;
for (const attentionLayers of [0, 4, 32]) {
  const item = hybridFlowBudget({ attentionLayers, length: 0 }); assert.equal(item.kv, 0n); checks++;
  if (attentionLayers === 32) { assert.equal(item.recurrent + item.convolution, 0n); checks++; }
}
assert.equal(hybridFlowBudget({ length: 8192, batch: 2, layers: 24, attentionLayers: 6, kvHeads: 4, headWidth: 64 }).kv, 100663296n); checks++;
const vectors = [[2, -1], [0, 3], [-2, 0], [1, 1]], scores = [Math.log(4), Math.log(2), 0, 0];
const router = hybridFlowRouter(scores, vectors, 2);
close(router.retained.probabilities, [.5, .25, .125, .125]); close(router.retained.output, [1, .25]); close(router.renormalized.output, [4 / 3, 1 / 3]);
close(hybridFlowRouter(scores, vectors.map(row => row.map(() => 0)), 2).retained.output, [0, 0]);
close(hybridFlowRouter(scores, vectors, 4).retained.output, hybridFlowRouter(scores, vectors, 4).renormalized.output);
assert.deepEqual(hybridFlowRouter([0, 0, 0, 0], vectors, 2).retained.selected, [0, 1]); checks++;
close(hybridFlowDeltaContrast().difference, .5);
close(hybridFlowDeltaContrast({ gate: [.5, .5] }).difference, 0);

const source = hybridStudy.sources.find(item => item.id === 2970), donor = hybridStudy.sources.find(item => item.id === 2452);
for (const fixture of native.traces) {
  const snapshot = validateHybridFlowSnapshot(JSON.parse(fs.readFileSync(`public/learn-assets/${id}/model-${fixture.key}.json`)), fixture.key);
  const before = JSON.stringify(snapshot), actual = hybridFlowStroke(snapshot, fixture.coordinates);
  close(actual.logits, fixture.full, 1e-10);
  maximumNativeDifference = Math.max(maximumNativeDifference, difference(actual.logits, fixture.full));
  fixture.frames.forEach((frame, position) => frame.layers.forEach((layer, index) => {
    for (const field of Object.keys(layer)) { close(actual.frames[position].layers[index][field], layer[field], 1e-10); maximumNativeDifference = Math.max(maximumNativeDifference, difference(actual.frames[position].layers[index][field], layer[field])); }
  }));
  for (const boundary of [0, 1, 3, 7, 8]) {
    const faults = { recurrent: true, history: true, kv: true, position: true, donor: true };
    const carried = hybridFlowContinuation(snapshot, source.coordinates, boundary, {}, donor.coordinates);
    close(carried.difference, 0, 1e-10);
    if (boundary === 0 || boundary === 8) close(hybridFlowContinuation(snapshot, source.coordinates, boundary, faults, donor.coordinates).difference, 0, 1e-10);
  }
  assert.equal(JSON.stringify(snapshot), before); checks++;
  const bad = structuredClone(snapshot); bad.state['embed.weight'][0].pop(); assert.throws(() => validateHybridFlowSnapshot(bad, fixture.key)); checks++;
  assert.throws(() => validateHybridFlowSnapshot(snapshot, fixture.key === 'AAA-37' ? 'MAM-37' : 'AAA-37')); checks++;
}
const defaultModel = JSON.parse(fs.readFileSync(`public/learn-assets/${id}/model-MAM-37.json`));
const damaged = hybridFlowContinuation(defaultModel, source.coordinates, 3, { kv: true }, donor.coordinates);
assert.equal(damaged.fullPrediction, 1); assert.equal(damaged.prediction, 2); checks += 2;
for (const action of [
  () => hybridFlowMemory([], 'A', .5, 1),
  () => hybridFlowMemory(hybridFlowInitialRecords, 'A', NaN, 1),
  () => hybridFlowBudget({ attentionLayers: 33 }),
  () => hybridFlowBudget({ batch: 0 }),
  () => hybridFlowBudget({ window: 0 }),
  () => hybridFlowRouter([NaN, 0, 0, 0], vectors, 2),
  () => hybridFlowRouter(scores, vectors, 0),
  () => hybridFlowStroke(defaultModel, source.coordinates.slice(1)),
  () => hybridFlowContinuation(defaultModel, source.coordinates, 9),
  () => hybridFlowContinuation(defaultModel, source.coordinates, 3, { donor: true }),
]) { assert.throws(action); checks++; }

const manuscript = fs.readFileSync(`docs/teaching/drafts/${id}/lesson.md`, 'utf8');
for (const literal of ['32/7', '29/11', '63/11', '2.035463704', '3.312887417', '−1.013090770',
  '4.015380859375', '2,748,779,069,440', '8,796,361,457,664', '47915728896', '8455716864', '5637144576', '288']) {
  assert.ok(manuscript.includes(literal), `Missing verified numeric label ${literal}`); checks++;
}
assert.equal((manuscript.match(/^## /gm) || []).length, 13); assert.equal((manuscript.match(/^### \d+\./gm) || []).length, 11); checks += 2;
assert.equal(hybridStudy.fits.reduce((sum, fit) => sum + fit.history.length, 0), 480); checks++;
assert.deepEqual(hybridStudy.fits.map(fit => [fit.key, fit.selected_epoch, fit.metrics.assessment.errors]),
  [['linear-37', 80, 565], ['MMM-37', 79, 201], ['AAA-37', 64, 167], ['MAM-37', 56, 193], ['AMM-37', 68, 261], ['MAM-73', 78, 183]]); checks++;
const files = ['src/learn/data/hybrid-memory-flow-models.js', `docs/teaching/drafts/${id}/lesson.md`, `docs/teaching/drafts/${id}/visual-specifications.md`, nativePath, 'scripts/verify-hybrid-memory-flow-models.mjs'];
const receipt = { purpose: 'Author complementary current mechanisms/traces/source-conservation; not independent whole-topic acceptance', passed: true, checks, fitsRerun: 0,
  tinyNativeCases: native.tiny.length, editedNativeModels: native.traces.length, maximumTinyDifference, maximumNativeDifference,
  protectedScientificFiles: Object.keys(dependencies.sourceHashes).length,
  sourceHashes: Object.fromEntries(files.map(path => [path, hash(fs.readFileSync(path))])) };
fs.writeFileSync(`${record}/reading-flow-author-model-checks.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks, maximumTinyDifference, maximumNativeDifference, fitsRerun: 0 }));
