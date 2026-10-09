import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tensorStorage, gradientState, dropoutMode } from '../src/learn/components/lesson-labs/pytorch-models.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const native = JSON.parse(fs.readFileSync('docs/teaching/core-frameworks/pytorch/native-evidence.json', 'utf8'));
for (const fixture of native.gradient_fixtures) {
  const result = gradientState(fixture);
  for (const key of ['loss', 'accumulated', 'nextWeight', 'nextLoss']) close(result[key], fixture[key]);
}
assert.equal(gradientState({ detached: true }).accumulated, null);
for (const value of [-5, 2, 9, 12]) {
  const view = tensorStorage('view', value), copy = tensorStorage('copy', value);
  assert.equal(view.source[1], value); assert.equal(copy.source[1], 2);
  assert.equal(view.logical[2], value); assert.equal(copy.logical[2], value);
}
assert.deepEqual(dropoutMode().rows.map(row => row.output), [0, 0, 6, 8]);
assert.deepEqual(dropoutMode({ training: false }).rows.map(row => row.output), [1, 2, 3, 4]);
assert.deepEqual(dropoutMode({ probability: 0 }).rows.map(row => row.output), [1, 2, 3, 4]);
assert.deepEqual(dropoutMode({ recording: false }).rows, dropoutMode().rows);
console.log('PyTorch browser models: native fixture agreement, copy/alias, null derivative, mode independence and boundary checks passed.');
