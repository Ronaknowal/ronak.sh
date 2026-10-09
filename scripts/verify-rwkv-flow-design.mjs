// Pre-edit author arithmetic, not independent review or browser certification.
// Never invokes historical receipt writers or retrains the conserved models.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  deltaMemory,
  dot,
  gooseUpdate,
  kernelSummary,
  softmax,
  weightedMemory,
} from '../src/learn/data/rwkv-memory-models.js';

const directory = 'docs/teaching/deep-learning-beginner/rwkv-linear-attention-models';
const checks = [];
const near = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${actual} does not agree with ${expected}`);
};
const check = (name, actual, expected, tolerance) => {
  const measured = Array.isArray(actual) ? actual.flat(Infinity) : [actual];
  const reference = Array.isArray(expected) ? expected.flat(Infinity) : [expected];
  assert.equal(measured.length, reference.length);
  measured.forEach((value, index) => near(value, reference[index], tolerance));
  checks.push({ name, actual, expected });
};

const input = {
  queries: [[1, 1], [2, 1], [1, 2], [3, 1]],
  keys: [[1, 0], [0, 1], [1, 1], [2, 1]],
  values: [2, 8, -1, 5],
  chunk: 3,
};
const summary = kernelSummary(input);
check('Worked normalized stream and unequal-tail chunk outputs',
  summary.map(row => [row.output, row.chunkOutput]),
  [[2, 2], [4, 4], [2.5, 2.5], [3, 3]]);
check('Worked last state and normalization operands',
  [summary.at(-1).state, summary.at(-1).normalizer,
    summary.at(-1).numerator, summary.at(-1).denominator],
  [[11, 12], [4, 3], 45, 15]);
check('Future value edit preserves earlier answers',
  kernelSummary({ ...input, values: [2, 8, -1, 11] }).map(row => row.output),
  [2, 4, 2.5, 5.8]);
assert.equal(kernelSummary({ ...input, queries: input.queries.map(() => [0, 0]) })[0].output, null);
checks.push({ name: 'Zero normalized read is unavailable, not zero', actual: null });
check('Hand softmax transcript', dot(softmax([0, Math.log(2), 0]), [2, 8, -1]), 4.25);
check('Distinct scalar kernels',
  [dot(softmax([0, 2]), [0, 10]), (3 * 1 * 0 + 3 * 2 * 10) / (3 * 1 + 3 * 2)],
  [8.807970779778824, 20 / 3]);

const local = { state: [2, 8], normalizer: [1, 1], query: [2, 1] };
const answer = fixture => dot(fixture.query, fixture.state) / dot(fixture.query, fixture.normalizer);
const loss = fixture => .5 * (answer(fixture) - 6) ** 2;
check('Local normalized read and half-squared loss', [answer(local), loss(local)], [4, 2]);
for (const [field, derivative] of Object.entries({
  state: [-4 / 3, -2 / 3],
  normalizer: [16 / 3, 8 / 3],
  query: [4 / 3, -8 / 3],
})) {
  const epsilon = 1e-6;
  const numerical = local[field].map((_, coordinate) => {
    const plus = structuredClone(local), minus = structuredClone(local);
    plus[field][coordinate] += epsilon;
    minus[field][coordinate] -= epsilon;
    return (loss(plus) - loss(minus)) / (2 * epsilon);
  });
  check(`Local loss gradient: ${field}`, numerical, derivative, 2e-8);
}

const keys = [0, Math.log(2), 0, Math.log(4)];
const weighted = weightedMemory(keys, input.values, .5, Math.log(2));
check('Worked weighted reads', weighted.map(row => row.output), [2, 6.8, 10 / 3, 190 / 41]);
const bonusOff = weightedMemory(keys, input.values, .5, 0);
check('Current bonus removed', bonusOff.map(row => row.output), [2, 6, 32 / 7, 4.4]);
check('Stored scale/history invariant under bonus',
  weighted.map(({ a, b, p }) => [a, b, p]),
  bonusOff.map(({ a, b, p }) => [a, b, p]));
check('A common +1000 log-key shift preserves reads',
  weightedMemory(keys, input.values, .5, Math.log(2), 1000).map(row => row.output),
  weighted.map(row => row.output), 1e-9);
assert.equal(Math.exp(1000), Infinity);
check('Constant weighted values from empty memory',
  weightedMemory(keys, [7, 7, 7, 7], .5).map(row => row.output), [7, 7, 7, 7]);
check('Retention half-lives', [.5, .9, .99].map(rate => Math.log(.5) / Math.log(rate)),
  [1, 6.578813478960585, 68.96756393652842]);

const writes = [[1, 0], [0, 1], [1, 0]], targets = [2, 7, 5];
const corrected = deltaMemory(writes, targets, 1).at(-1);
check('Unit addresses: accumulation versus correction', [corrected.additive, corrected.delta],
  [[7, 7], [5, 7]]);
const correlatedKeys = [[1, 0], [.6, .8], [1, 0]];
const correlated = deltaMemory(correlatedKeys, targets, 1);
check('Correlated-address intermediate and final retrieval',
  [correlated[1].delta, correlated[2].delta, dot(correlated[2].delta, correlatedKeys[1])],
  [[5.48, 4.64], [5, 4.64], 6.712]);
const localCorrection = deltaMemory([[1, 0]], [5], .5, [2, 7])[0];
check('Nonempty local loss/gradient update',
  [.5 * localCorrection.residual ** 2, localCorrection.delta], [4.5, [3.5, 7]]);
check('Zero rate preserves nonempty state', deltaMemory(writes, targets, 0, [2, 7]).at(-1).delta, [2, 7]);
check('Nonunit key: unit rate overshoots, inverse squared norm replaces',
  [dot(deltaMemory([[2, 0]], [3], 1)[0].delta, [2, 0]),
    dot(deltaMemory([[2, 0]], [3], .25)[0].delta, [2, 0])], [12, 3]);
check('Two Goose erase directions', [gooseUpdate([1, 0]).next, gooseUpdate([.6, .8]).next],
  [[[5.4, 6.3], [1.8, 2.7]], [[4.152, 5.212], [.552, 2.412]]]);
const normal = [1 / Math.sqrt(2), -1 / Math.sqrt(2)];
const reflection = [3, 8].map((coordinate, index) => coordinate - 2 * dot([3, 8], normal) * normal[index]);
check('Ideal reflection and half-scaled direction construction',
  [reflection, reflection.map(value => value / 2)], [[8, 3], [4, 1.5]]);
check('Released strict decay lower boundary', Math.exp(-Math.exp(-.5)), .545239211892605);
check('Core cache-byte fixtures, with declared exclusions',
  [12 * 5 * 512 * 4, 12 * 8 * 64 ** 2 * 4,
    12 * 4096 * 2 * 8 * 64 * 2, 12 * 4096 * 2 * 2 * 64 * 2],
  [122880, 1572864, 100663296, 25165824]);
check('Retained practice storage fixture',
  [6 * 4 * 32 ** 2 * 4, 6 * 2048 * 2 * 2 * 32 * 2], [98304, 3145728]);

const files = [
  'src/learn/data/rwkv-memory-models.js',
  `${directory}/reading-flow-revision.md`,
  'scripts/verify-rwkv-flow-design.mjs',
];
const sourceHashes = Object.fromEntries(files.map(file =>
  [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.writeFileSync(`${directory}/reading-flow-design-author-numerics.json`,
  JSON.stringify({ passed: true, checkedAt: new Date().toISOString(),
    scope: 'Author pre-edit design arithmetic; no runtime/browser/independent-review certification',
    sourceHashes, checks }, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, groups: checks.length }));
