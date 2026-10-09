import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { initialPrompt, inputAttention, promptStep, finitePrompt, attention, inputPositions,
  prefixMask, workCounts, infixLayout } from '../src/learn/data/soft-prompt-models.js';

const topic = 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const near = (a, b, tolerance = 2e-12) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const compare = (a, b) => Array.isArray(a) ? a.forEach((value, i) => compare(value, b[i])) : near(a, b);
const content = read(`${topic}/content-inputs.json`).inputs;
for (const [path, expected] of Object.entries(content)) assert.equal(sha(path), expected, path);
const python = read('public/learn-code/p-tuning/results/attention.json');
for (const record of python.input_cases) {
  const result = inputAttention(initialPrompt, record.target);
  for (const [js, py] of [['keys', 'keys'], ['values', 'values'], ['scores', 'scores'], ['weights', 'attention'],
    ['output', 'output'], ['probabilities', 'probabilities'], ['gradient', 'd_prompt'],
    ['keyPath', 'd_prompt_key_path'], ['valuePath', 'd_prompt_value_path']]) compare(result[js], record.before[py]);
  near(result.loss, record.before.loss);
  const update = promptStep(initialPrompt, .2, record.target);
  compare(update.updated, record.updated_prompt);
  near(update.after.loss, record.after_loss);
}
let derivativeChecks = 0, maximumError = 0;
for (const coordinate of [-1, -.3, .2, .7, 1]) for (const target of [0, 1]) {
  const prompt = [[coordinate, -.4], [.5, .1]];
  const result = inputAttention(prompt, target);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const error = Math.abs(finitePrompt(prompt, i, j, target) - result.gradient[i][j]);
    maximumError = Math.max(maximumError, error);
    assert.ok(error < 4e-9);
    derivativeChecks++;
  }
  compare(promptStep(prompt, 0, target).updated, prompt);
  assert.ok(promptStep(prompt, .2, target).after.loss < result.loss);
}
for (const [keys, values, expected] of [[[], [], python.absent], [[[0, 0], [0, 0]], [[0, 0], [0, 0]], python.zero_prefix]]) {
  const result = attention(keys, values, 1);
  compare(result.output, expected.output);
  near(result.loss, expected.loss);
}
for (let count = 0; count <= 3; count++) {
  const layout = inputPositions(count);
  assert.deepEqual(layout.predictors, [count + 1, count + 2]);
  assert.equal(layout.targets.filter(value => value !== '−100').length, 2);
  for (let i = 0; i < layout.tokens.length; i++) for (let j = 0; j < layout.tokens.length; j++) assert.equal(layout.mask[i][j], j <= i);
}
for (const padded of [false, true]) {
  const mask = prefixMask(3, 2, padded);
  mask.forEach((row, i) => row.forEach((visible, j) => assert.equal(visible, j < 2 || (j - 2 <= i && !(padded && j === 4)))));
}
for (let insert = 0; insert <= 4; insert++) for (const bidirectional of [false, true]) {
  const layout = infixLayout(insert, bidirectional);
  assert.equal(layout.promptVisible, bidirectional || insert <= 1);
  assert.equal(layout.tokens[layout.predictor], 'context');
}
assert.deepEqual(workCounts(8), { input: 1024, kv: 12288, inputEntries: 1600, kvEntries: 1280, baselineEntries: 1024 });
assert.equal(workCounts(8, 2).kv, 6144);
const projected = read('public/learn-assets/p-tuning-soft-prompt-methods/observations.json');
for (const [path, expected] of Object.entries(projected.inputs)) assert.equal(sha(path), expected, path);
assert.equal(projected.runs.length, 9);
for (const run of projected.runs) {
  const minimum = [...run.history].sort((a, b) => a.dev.nll - b.dev.nll || a.step - b.step)[0];
  assert.equal(minimum.step, run.selected_step);
  assert.deepEqual(run.confusion, [[0, 19, 0, 0], [0, 69, 0, 0], [0, 16, 0, 0]]);
  assert.equal(run.examples.length, 6);
  for (const example of run.examples) {
    assert.deepEqual(example.generation.ids, [642, 3486, 0]);
    assert.equal(example.generation.eos_stopped, true);
    assert.equal(example.candidate.prediction, 'no impact');
  }
}
const encoder = read('public/learn-code/p-tuning/results/encoders.json').encoders.find(row => row.kind === 'LSTM');
const nativeBatch = read('public/learn-assets/p-tuning-soft-prompt-methods/native-batch.json');
for (const [path, expected] of Object.entries(nativeBatch.sources)) assert.equal(sha(path), expected, path);
assert.equal(nativeBatch.batch.input_ids.length, 2);
assert.equal(nativeBatch.batch.input_ids[0].length, 33);
near(nativeBatch.decoder.loss, 1.6085210053921624);
compare(nativeBatch.decoder.layers[0].derivative.slice(0, 2), nativeBatch.decoder.prompt_gradient);
near(Math.hypot(...nativeBatch.decoder.prompt_gradient.flat()), .020072700546060546);
for (const layer of nativeBatch.decoder.layers) assert.deepEqual(layer.shape, [1, 6, 8]);
let gateChecks = 0;
for (const trace of encoder.gate_traces) {
  let previous = [0, 0, 0];
  for (const row of trace.steps) {
    row.cell[0].forEach((value, i) => { near(value, row.f[0][i] * previous[i] + row.i[0][i] * row.g[0][i]); gateChecks++; });
    row.hidden[0].forEach((value, i) => { near(value, row.o[0][i] * Math.tanh(row.cell[0][i])); gateChecks++; });
    previous = row.cell[0];
  }
}
const runtime = ['src/learn/data/soft-prompt-models.js',
  ...['Shared', 'Foundations', 'Memory', 'Encoders', 'Evidence'].map(name => `src/learn/components/lesson-labs/SoftPrompt${name}.jsx`),
  'src/learn/components/lesson-labs/soft-prompt-flow.css', `${topic}/lesson.jsx`,
  'scripts/render-soft-prompt-lesson.mjs', 'scripts/project-soft-prompt-observations.mjs',
  'public/learn-assets/p-tuning-soft-prompt-methods/observations.json',
  'public/learn-assets/p-tuning-soft-prompt-methods/native-batch.json'];
for (const path of runtime.filter(path => path.endsWith('.jsx'))) parse(fs.readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
const report = { status: 'passed', derivativeChecks, maximumError, gateChecks,
  frozenContentGuards: Object.keys(content).length, projectedRuns: projected.runs.length,
  fits: 0, scientificGenerations: 0, bindings: Object.fromEntries(runtime.map(path => [path, sha(path)])) };
fs.writeFileSync(`${topic}/runtime-model-checks.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
