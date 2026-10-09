import assert from 'node:assert/strict';
import { pairedAndCross, tensorBoundary } from '../src/learn/data/tensor-boundary-models.js';

const close = (actual, expected) => assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const baseline = pairedAndCross([1, 3], [2, 4]);
assert.equal(baseline.pairedLoss, .5);
assert.equal(baseline.crossLoss, 1.5);
assert.deepEqual(baseline.crossGradient, [-1, 0]);
let derivatives = 0;
for (const p0 of [-4, -.5, 0, 2, 6]) {
  for (const p1 of [-4, 1, 6]) {
    for (const y1 of [-4, 0, 4, 6]) {
      const p = [p0, p1];
      const targets = [2, y1];
      const current = pairedAndCross(p, targets);
      for (let index = 0; index < 2; index++) {
        const plus = [...p], minus = [...p];
        plus[index] += 1e-4;
        minus[index] -= 1e-4;
        for (const [loss, gradient] of [['pairedLoss', 'pairedGradient'], ['crossLoss', 'crossGradient']]) {
          const difference = (pairedAndCross(plus, targets)[loss] - pairedAndCross(minus, targets)[loss]) / 2e-4;
          close(current[gradient][index], difference);
          derivatives++;
        }
      }
    }
  }
}
for (const mode of ['connected', 'clone', 'detach', 'detached-copy']) {
  const result = tensorBoundary(mode, 2, 3, 1, 0);
  assert.equal(result.loss, 24.5);
  assert.equal(result.biasGradient, 7);
  assert.equal(result.weightGradient, ['connected', 'clone'].includes(mode) ? 21 : null);
  assert.equal(result.shared, ['connected', 'detach'].includes(mode));
}
assert.equal(tensorBoundary('connected', 2, 3, 1, 7).weightGradient, 0);
assert.equal(tensorBoundary('detach', 2, 3, 1, 7).weightGradient, null);
const changed = pairedAndCross([1, 3], [2, 5]);
assert.equal(changed.pairedGradient[0], baseline.pairedGradient[0]);
assert.notEqual(changed.crossGradient[0], baseline.crossGradient[0]);
console.log(JSON.stringify({ finite_difference_derivatives: derivatives, routing_and_dependency_cases: 'passed' }));
