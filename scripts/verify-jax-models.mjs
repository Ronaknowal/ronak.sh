import assert from 'node:assert/strict';
import { calibrationState, traceOutput, traceSignature } from '../src/learn/data/jax-models.js';
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const initial = calibrationState(0, 0, .1);
near(initial.loss, 5.5); near(initial.gradient.weight, -5); near(initial.gradient.bias, -1);
near(initial.next.weight, .5); near(initial.next.bias, .1); near(initial.nextLoss, 3.2175);
near(calibrationState(0, 0, 1).nextLoss, 11.25);
near(calibrationState(2, 1, .1).loss, 0);
near(calibrationState(-2, -2, 0).next.weight, -2);
for (const weight of [-2, -.35, 0, 1.25, 4]) {
  for (const bias of [-2, .65, 4]) {
    const epsilon = 1e-5;
    const state = calibrationState(weight, bias, .1);
    const derivative = (calibrationState(weight + epsilon, bias, 0).loss - calibrationState(weight - epsilon, bias, 0).loss) / (2 * epsilon);
    assert.ok(Math.abs(derivative - state.gradient.weight) < 1e-7);
    assert.ok(state.contributions.every(row => Math.abs(row.weightGradient) <= 32));
  }
}
assert.equal(traceOutput(4, 0, 'sum').result, 14);
assert.equal(traceOutput(4, 1, 'mean').result, 7.5);
assert.notEqual(traceSignature(4, 'float32', 'sum'), traceSignature(5, 'float32', 'sum'));
assert.notEqual(traceSignature(4, 'float32', 'sum'), traceSignature(4, 'float64', 'sum'));
console.log('JAX: manual arithmetic, central finite differences, fit/zero-rate limits, fixed axis and signature distinctions passed.');
