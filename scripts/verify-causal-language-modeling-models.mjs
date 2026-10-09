import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import { distribution, DEFAULT_LOGITS, attentionTrace, targetLoss, packedMask, objectiveMask, categorical, scoringWindow } from '../src/learn/data/causal-language-modeling-models.js';
let checks = 0;
const near = (actual, expected) => { assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`); checks++; };
distribution(DEFAULT_LOGITS).probabilities.forEach((value, index) => near(value, [.5, .25, .125, .125][index]));
near(distribution(DEFAULT_LOGITS).loss, Math.log(2));
for (const target of [0, 1, 2, 3]) {
  const result = distribution(DEFAULT_LOGITS, target);
  const shifted = distribution(DEFAULT_LOGITS.map(value => value + 1000), target);
  result.probabilities.forEach((value, index) => near(value, shifted.probabilities[index]));
  near(result.gradient.reduce((a, b) => a + b, 0), 0);
  near(distribution([0, 0, 0, 0], target).loss, Math.log(4));
}
for (let row = 0; row < 4; row++) {
  for (let future = -4; future <= 8; future++) {
    const trace = attentionTrace(row, future, true);
    near(trace.weights.reduce((a, b) => a + b, 0), 1);
    near(trace.result, row < 3 ? (row + 2) / 2 : (6 + future) / 4);
    near(attentionTrace(row, future, false).result, (6 + future) / 4);
  }
}
near(targetLoss([true, true, true, true]).sum, Math.log(64));
near(targetLoss([true, true, true, true]).perplexity, Math.sqrt(8));
assert.equal(targetLoss([false, false, false, false]).mean, null); checks++;
for (const independent of [false, true]) packedMask(independent).forEach((row, i) => row.forEach((value, j) => {
  assert.equal(value, j <= i && (!independent || Math.floor(i / 3) === Math.floor(j / 3))); checks++;
}));
assert.deepEqual(objectiveMask('prefix')[0], [true, true, false, false]); checks++;
assert.ok(objectiveMask('masked').flat().every(Boolean)); checks++;
for (const [u, expected] of [[0, 0], [.499, 0], [.5, 1], [.75, 2], [.875, 3], [.99, 3]]) {
  assert.equal(categorical([.5, .25, .125, .125], u).selected, expected); checks++;
}
for (let target = 1; target < 7; target++) {
  const result = scoringWindow(target);
  assert.equal(result.length, Math.min(4, target));
  assert.equal(result.at(-1), target - 1); checks += 2;
}
for (const path of ['src/learn/components/lesson-labs/CausalLanguageModelingFlow.jsx', 'docs/teaching/llm-architecture-training/causal-language-modeling-next-token-prediction/causal-language-modeling.jsx']) {
  parse(fs.readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }); checks++;
}
console.log(JSON.stringify({ passed: true, checks }));
