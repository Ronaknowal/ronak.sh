import assert from 'node:assert/strict';
import { gridOwnership, gpuAccounting } from '../src/learn/data/gpu-computing-models.js';

let configurations = 0;
for (let size = 0; size <= 80; size++) {
  for (let blocks = 1; blocks <= 4; blocks++) {
    for (const threads of [2, 4, 8]) {
      const owners = gridOwnership(size, blocks, threads);
      const indices = owners.flatMap(owner => owner.indices).sort((a, b) => a - b);
      assert.deepEqual(indices, Array.from({ length: size }, (_, i) => i));
      for (const owner of owners) {
        assert.equal(owner.first, owner.block * threads + owner.thread);
        assert(owner.indices.every(index => index % (blocks * threads) === owner.first));
      }
      configurations++;
    }
  }
}
assert.deepEqual(gridOwnership(19, 2, 4)[2].indices, [2, 10, 18]);
assert.equal(gpuAccounting().total, 650);
assert.equal(gpuAccounting({ resident: false, fused: false }).total, 2950);
for (const fused of [false, true]) {
  assert.deepEqual(gpuAccounting({ stages: 1, resident: false, fused }), gpuAccounting({ stages: 1, resident: true, fused }));
}
assert.equal(gpuAccounting({ launchCost: 0 }).launch, 0);
assert.equal(gpuAccounting({ fused: false }).deviceBytes / gpuAccounting().deviceBytes, 3);
for (const settings of [{ stages: 1.5 }, { elements: NaN }, { launchCost: NaN }, { hostBandwidth: Infinity }]) {
  assert.throws(() => gpuAccounting(settings));
}
assert.throws(() => gridOwnership(4, 1.5, 2));
console.log(JSON.stringify({ indexing_configurations: configurations, byte_accounting_and_null_cases: 'passed' }));
