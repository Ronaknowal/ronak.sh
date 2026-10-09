import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as model from '../src/learn/data/kv-cache-models.js';

const topic = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
let checks = 0;
function close(actual, expected, tolerance = 1e-10) {
  if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length);
    expected.forEach((value, index) => close(actual[index], value, tolerance));
  } else {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
    checks += 1;
  }
}
const original = model.traceAttention();
close(original.weights, [2 / 5, 1 / 5, 2 / 5]);
close(original.output, [6 / 5, 4 / 5]);
close(model.traceAttention({ append: true }).output, [1, 9 / 11]);
close(model.traceAttention({ qx: 0, qy: 0 }).weights, [1 / 3, 1 / 3, 1 / 3]);
for (const qx of [-2, 0, 2]) close(model.traceAttention({ qx, equal: true }).output, [1, .5]);
for (const poison of [-50, 0, 50]) close(model.poisonedTail(poison).output, model.poisonedTail(20).output);
assert.ok(model.poisonedTail(50, true).output[0] > model.poisonedTail(50).output[0]); checks += 1;
for (let past = 0; past <= 4; past += 1) {
  for (let count = 1; count <= 3; count += 1) {
    const rows = model.offsetMasks(past, count, past + count + 2);
    rows.forEach((row, index) => {
      assert.deepEqual(row.flatMap((cell, key) => cell.correct ? [key] : []), Array.from({ length: past + index + 1 }, (_, key) => key));
      checks += 1;
    });
  }
}
assert.deepEqual(model.causalReach(3, false)[2], [false, false, false, true]); checks += 1;
assert.deepEqual(model.causalReach(3, true)[2], [true, true, true, true]); checks += 1;
const work = model.workCounts(4, 3);
close([work.fullRows, work.newRows, work.fullAttention, work.cachedAttention], [15, 6, 46, 21]);
for (const prompt of [1, 4, 9]) {
  const nullCase = model.workCounts(prompt, 1);
  close(nullCase.fullRows, nullCase.newRows);
  close(nullCase.fullAttention, nullCase.cachedAttention);
}
const layout = model.allocation([3, 5, 8], 8, 4);
close([layout.live, layout.reserved, layout.paged, layout.slack], [16, 24, 20, 4]);
close(model.deviceBudget().globalPerRequest, 2684354560);
close(model.deviceBudget().perRequest, 1342177280);
assert.ok(model.deviceBudget({ requests: 8 }).freeGiB < 0); checks += 1;
close(model.movedRecord().correct, .5);
close(model.movedRecord(Math.PI / 6, true).current, 0);
close(model.movedRecord(0, true).current, 1);
const recorded = JSON.parse(fs.readFileSync(`${topic}/research/program-checks.json`, 'utf8')).outputs;
const latent = model.latentTrace();
close(latent.scores, recorded.latent_cache.content_scores[0]);
close(latent.output, recorded.latent_cache.absorbed_output[0]);
close(latent.direct, latent.output);
close(latent.after, recorded.latent_cache.rotation_after_projection[0]);
close(latent.before, recorded.latent_cache.incorrect_commuted_rotation[0]);
close(model.latentTrace(2, 0).after, model.latentTrace(2, 0).before);
for (const bits of [4, 8]) {
  const quantized = model.quantize([2.5, 2.5, 2.5], bits);
  close(quantized.reconstructed, [2.5, 2.5, 2.5]);
  close(quantized.bytes, Math.ceil(3 * bits / 8));
}
close(model.quantize([0, .49, 1]).reconstructed[1], recorded.cache_precision.threshold_witness.after[1], 1e-7);
const precision = model.precisionTrace();
close(precision.exact.output, recorded.cache_precision.exact_output[0], 1e-7);
close(precision.current.output, recorded.cache_precision.variants.both.output[0], 1e-7);
close(model.precisionTrace({ equal: true }).current.output, [.75, .75]);
let pool = model.poolFixture();
assert.deepEqual(pool.requests.A.table, [0, 2, 3]); checks += 1;
const prior = structuredClone(pool);
pool = model.appendPool(pool, 'A', [10, 11, 12, 13, 14, 15, 16]);
assert.ok(pool.error); assert.deepEqual(pool.requests, prior.requests); assert.deepEqual(pool.pages, prior.pages); checks += 3;
pool = model.releasePool(prior, 'B');
pool = model.appendPool(pool, 'A', [10, 11, 12]);
close(pool.requests.A.length, 13);
const read = Array.from({ length: 13 }, (_, index) => pool.pages[pool.requests.A.table[Math.floor(index / pool.size)]][index % pool.size]);
close(read, Array.from({ length: 13 }, (_, index) => index));
const path = 'src/learn/data/kv-cache-models.js';
const receipt = { scope: 'Finite models and retained output comparisons only; no native model or scientific replay.',
  status: 'PASS', checks, source: path, sha256: createHash('sha256').update(fs.readFileSync(path)).digest('hex') };
fs.writeFileSync(`${topic}/runtime-model-checks.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
