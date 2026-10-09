import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/kv-cache-models.js';

const folder = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const checks = [];
function equal(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  checks.push(label);
}
function near(actual, expected, label, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} != ${expected}`);
  checks.push(label);
}
const packet = JSON.parse(fs.readFileSync(`${folder}/runtime-inputs.json`));
for (const item of packet.files) assert.equal(hash(item.path), item.sha256, item.path);
equal(m.softmax([1, 2], [false, false]), null, 'empty support is undefined');
const a = m.traceAttention();
[.4, .2, .4].forEach((v, i) => near(a.weights[i], v, `default attention weight ${i}`));
[1.2, .8].forEach((v, i) => near(a.output[i], v, `default attention output ${i}`));
const appended = m.traceAttention({ append: true });
[1, 9 / 11].forEach((v, i) => near(appended.output[i], v, `appended output ${i}`));
for (const p of [1, 3, 8]) for (const n of [1, 2, 5]) {
  const mask = m.offsetMasks(p, n, p + n + 2);
  for (let row = 0; row < n; row += 1) {
    equal(mask[row].filter(c => c.correct).map(c => c.key), Array.from({length: p + row + 1}, (_, i) => i), `offset mask ${p}/${n}/${row}`);
  }
}
for (const poison of [-1000, 0, 1000]) {
  m.poisonedTail(poison).output.forEach((v, i) => near(v, m.poisonedTail(0).output[i], `masked poison ${poison}/${i}`));
}
for (const p of [1, 4, 32]) for (const g of [1, 2, 8]) {
  const w = m.workCounts(p, g);
  equal(w.fullRows, g * p + g * (g - 1) / 2, `full rows ${p}/${g}`);
  equal(w.newRows, p + g - 1, `cached rows ${p}/${g}`);
  let full = 0;
  let cached = 0;
  for (let step = 0; step < g; step += 1) {
    for (let q = 0; q < p + step; q += 1) for (let k = 0; k <= q; k += 1) {
      full += 1;
      if (step === 0 || q === p + step - 1) cached += 1;
    }
  }
  equal(w.fullAttention, full, `enumerated full pairs ${p}/${g}`);
  equal(w.cachedAttention, cached, `enumerated cached pairs ${p}/${g}`);
}
const alloc = m.allocation([3, 7, 9], 12, 4);
equal([alloc.live, alloc.paged, alloc.reserved, alloc.slack, alloc.perToken], [19, 24, 36, 5, 256], 'allocation counts and bytes');
const budget = m.deviceBudget();
equal(budget.ownedHeads, 4, 'heads owned per device');
near(budget.perRequest / 2 ** 30, 1.25, 'per-device GiB per request');
equal(budget.maxRequests, 5, 'request capacity floors budget');
const negative = m.deviceBudget({ capacityGiB: 12 });
equal([negative.availableGiB, negative.maxRequests], [-5, 0], 'signed deficit and nonnegative capacity');
near(m.movedRecord().current, .5, 'RoPE physical relocation preserves logical score');
for (const bits of [4, 8]) for (const values of [[0, 1, 7 / 15, 1], [2, 2, 2], [-1, 0, 1]]) {
  const q = m.quantize(values, bits);
  const unpacked = q.payload.flatMap(byte => bits === 8 ? [byte] : [byte & 15, byte >> 4]).slice(0, values.length);
  equal(unpacked, q.codes, `packed round trip ${bits}/${values}`);
  equal(q.bytes, Math.ceil(values.length * bits / 8), `payload size ${bits}/${values}`);
}
equal([m.bankRound(.5), m.bankRound(1.5), m.bankRound(2.5), m.bankRound(-1.5)], [0, 2, 2, -2], 'ties to even');
for (const coefficient of [-2, 0, 2, 4]) {
  const l = m.latentTrace(coefficient);
  l.scores.forEach((v, i) => near(v, l.absorbedScores[i], `absorbed score ${coefficient}/${i}`));
  l.direct.forEach((v, i) => near(v, l.output[i], `latent value output ${coefficient}/${i}`));
}
const zeroAngle = m.latentTrace(2, 0);
equal(zeroAngle.before, zeroAngle.after, 'zero rotation commutes');
assert.ok(Math.abs(m.latentTrace().before[0] - m.latentTrace().after[0]) > .1);
checks.push('nonzero rotation counterexample');
let pool = m.poolFixture();
equal(pool.free.length, 1, 'fixture free page count');
const failed = m.appendPool(pool, 'C', Array(9).fill(1));
equal(failed.pages, pool.pages, 'exhausted append preserves pages');
equal(failed.requests, pool.requests, 'exhausted append preserves tables');
pool = m.releasePool(pool, 'B');
equal(pool.free.length, 2, 'release returns page');
pool = m.appendPool(pool, 'C', Array(8).fill(1));
equal(pool.error, null, 'released capacity reused');
const report = { packet: { path: `${folder}/runtime-inputs.json`, sha256: hash(`${folder}/runtime-inputs.json`), guardedFiles: packet.files.length }, model: { path: 'src/learn/data/kv-cache-models.js', sha256: hash('src/learn/data/kv-cache-models.js') }, checker: { path: 'scripts/review-kv-cache-finite-alignment.mjs', sha256: hash('scripts/review-kv-cache-finite-alignment.mjs') }, scope: 'Independent finite constructions and enumeration only; no model loading, fitting, generation, or timing replay.', count: checks.length, checks, passed: true };
fs.writeFileSync(`${folder}/runtime-review-alignment/finite-independent.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, guards: packet.files.length, checks: checks.length }));
