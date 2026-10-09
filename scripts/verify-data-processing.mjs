import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paddingPlan, dataOwnership } from '../src/learn/data/data-processing-models.js';
let checks = 0;
for (let count = 1; count <= 16; count++) {
  for (let ranks = 1; ranks <= 3; ranks++) {
    for (let workers = 1; workers <= 3; workers++) {
      const split = dataOwnership(count, ranks, workers, false);
      assert.deepEqual(split.owners.flatMap(owner => owner.ids).sort((a, b) => a - b), Array.from({ length: count }, (_, index) => index));
      assert.equal(split.duplicates, 0);
      assert.equal(dataOwnership(count, ranks, workers, true).yielded, count * ranks * workers);
      checks += 3;
    }
  }
}
assert.equal(paddingPlan([2, 9, 3, 8], false).allocated, 34);
assert.equal(paddingPlan([2, 9, 3, 8], true).allocated, 24);
for (const lengths of [[1, 1, 1, 1], [12, 12, 12, 12], [1, 7, 2, 6], [12, 1, 1, 12]]) {
  const first = paddingPlan(lengths, false), sorted = paddingPlan(lengths, true);
  assert.equal(first.valid, sorted.valid);
  assert.ok(sorted.allocated <= first.allocated);
  checks += 2;
}
assert.deepEqual(readFileSync('public/learn-code/data-processing-loading/iris.csv'), readFileSync('public/learn-assets/mini-batches-training-loops-gradient-accumulation/iris.csv'));
checks += 3;
console.log(JSON.stringify({ checks, passed: true }));
