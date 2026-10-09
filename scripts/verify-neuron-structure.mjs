import assert from 'node:assert/strict';
import { neuronAnatomy, xorWiring } from '../src/learn/data/neuron-structure.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
// Independently derived tent and affine functions, including the corners and
// the interior where the lab permits editing without assigning new XOR labels.
for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
  const x = i / 10, y = j / 10;
  close(xorWiring(x, y).output, 1 - Math.abs(x + y - 1));
  close(xorWiring(x, y, false).output, 2 - x - y);
}
assert.deepEqual(neuronAnatomy(-1, -1, 'relu'), { contributions: [3, 2], score: 4, output: 4 });
close(neuronAnatomy(2, -1, 'relu').output, 0);
close(neuronAnatomy(1, -1, 'step').output, 0); // Stated strict > 0 rule.
close(neuronAnatomy(-1, -1, 'sigmoid').output, Math.exp(4) / (1 + Math.exp(4)));
for (const input of [-3, -.25, 0, 1.75, 3]) for (const bias of [-4, 0, 4]) {
  const relu = neuronAnatomy(input, bias, 'relu');
  const sigmoid = neuronAnatomy(input, bias, 'sigmoid');
  close(relu.score, 3 - 2 * input + bias);
  close(relu.score, sigmoid.score); // Swapping φ cannot change z.
  close(neuronAnatomy(input + .25, bias, 'relu').score - relu.score, -.5);
  close(neuronAnatomy(input, bias + .25, 'relu').score - relu.score, .25);
}
console.log('PASS: 121 XOR states against independent tent/line formulas, neuron hand calculation, threshold tie, activation placement, input/bias effects.');
