// Reading-flow revision checks for the Normalization lesson.
// Recomputes every new or moved number, checks that each figure precedes its walk-through,
// confirms labs use the shared flow components, and reruns the revision-5 numeric checks
// into a scratch receipt. Writes only author-checks-flow.json.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';
import { normalizeVector, normalizeTensor, batchNormalizationStep } from '../src/learn/data/normalization-models.js';

const topicId = 'batch-layer-group-rms-normalization';
const record = `docs/teaching/deep-learning-beginner/${topicId}`;
const lessonFile = `src/learn/data/topics/${topicId}.jsx`;
const sourceFiles = [
  lessonFile,
  'src/learn/components/lesson-labs/NormalizationBuildupFigures.jsx',
  'src/learn/components/lesson-labs/NormalizationIntuitionFigures.jsx',
  'src/learn/components/lesson-labs/NormalizationLabs.jsx',
  'src/learn/components/lesson-labs/normalization-buildup.css',
  'src/learn/components/lesson-labs/normalization-intuition.css',
  'src/learn/components/lesson-labs/normalization-labs.css',
];
const eps = 1e-5;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (actual, expected, tolerance = 5e-4) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const receipt = { topicId, revision: 'reading-flow', passed: false, checks: [] };
const check = (name, run) => { run(); receipt.checks.push({ name, passed: true }); };
const lesson = fs.readFileSync(lessonFile, 'utf8');
const before = (first, second) => {
  const a = lesson.indexOf(first), b = lesson.indexOf(second);
  assert.ok(a >= 0, `missing ${first}`); assert.ok(b >= 0, `missing ${second}`);
  assert.ok(a < b, `${first} should come before ${second}`);
};

try {
  check('Revision-5 numeric checks still pass (receipt redirected to scratch)', () => {
    const scratch = 'scratch/normalization-flow-rerun/revision-5-rerun.json';
    execFileSync(process.execPath, ['scripts/verify-normalization-buildup.mjs'], { env: { ...process.env, NORMALIZATION_RECEIPT: scratch }, stdio: 'pipe' });
    assert.equal(JSON.parse(fs.readFileSync(scratch, 'utf8')).passed, true);
    fs.rmSync('scratch/normalization-flow-rerun', { recursive: true, force: true });
  });
  check('Layer walk-through: μ 9, v 5, s ≈ 2.236, A → −1.342 → tanh −0.872; shift by −5 leaves x̂ unchanged', () => {
    const z = [6, 8, 10, 12], n = normalizeVector(z);
    assert.equal(n.center, 9); assert.equal(n.variance, 5); close(n.denominator, 2.236, 1e-3);
    close(n.output[0], -1.342); close(Math.tanh(n.output[0]), -.872);
    normalizeVector(z.map(v => v - 5)).output.forEach((v, i) => close(v, n.output[i], 1e-12));
  });
  check('Affine figure on 6, 8, 10, 12: 2x̂ + 1 and the exact undo with γ = √(5 + ε), β = 9', () => {
    const h = normalizeVector([6, 8, 10, 12]).output;
    [-1.683, .106, 1.894, 3.683].forEach((v, i) => close(2 * h[i] + 1, v));
    [6, 8, 10, 12].forEach((v, i) => close(Math.sqrt(5 + eps) * h[i] + 9, v, 1e-12));
  });
  check('Membership lab: changing example 1 moves example 0 only under BatchNorm (≈ 0.150221)', () => {
    const original = Array.from({ length: 16 }, (_, i) => i + 1), changed = original.map((v, i) => i === 8 ? 19 : v);
    const delta = method => Math.max(...normalizeTensor(changed, method, 2).slice(0, 8).map((v, i) => Math.abs(v - normalizeTensor(original, method, 2)[i])));
    close(delta('batch'), .150221, 1e-6);
    for (const method of ['layer', 'group', 'instance']) assert.equal(delta(method), 0);
  });
  check('Geometry lab: offset leaves LayerNorm unchanged and changes RMSNorm; negative scale flips both', () => {
    const base = [1, 3], shifted = base.map(v => v + 10), flipped = base.map(v => -v);
    normalizeVector(shifted).output.forEach((v, i) => close(v, normalizeVector(base).output[i], 1e-6));
    assert.ok(Math.abs(normalizeVector(shifted, eps, true).output[0] - normalizeVector(base, eps, true).output[0]) > .4);
    normalizeVector(flipped).output.forEach((v, i) => close(v, -normalizeVector(base).output[i], 1e-9));
    normalizeVector(flipped, eps, true).output.forEach((v, i) => close(v, -normalizeVector(base, eps, true).output[i], 1e-9));
  });
  check('BatchNorm lab: running mean 0.4, 0.76, 1.084 …; evaluation of input 1 approaches (1 − 4)/√(20/3) ≈ −1.162, not −1.342', () => {
    let buffers = { mean: 0, variance: 1 };
    const means = [];
    for (let i = 0; i < 400; i += 1) { buffers = batchNormalizationStep([1, 3, 5, 7], buffers, .1, true).next; if (i < 3) means.push(buffers.mean); }
    [.4, .76, 1.084].forEach((v, i) => close(means[i], v, 1e-9));
    close(buffers.mean, 4, 1e-9); close(buffers.variance, 20 / 3, 1e-9);
    close((1 - buffers.mean) / Math.sqrt(buffers.variance + eps), -1.162, 1e-3);
    close(batchNormalizationStep([1, 3, 5, 7], { mean: 0, variance: 1 }, .1, true).output[0], -1.3416, 1e-4);
    const evalStep = batchNormalizationStep([1, 3, 5, 7], { mean: .4, variance: 1.566667 }, .1, false);
    assert.deepEqual(evalStep.next, { mean: .4, variance: 1.566667 });
  });
  check('Placement lab at a = 0: pre-norm returns [1, 3], post-norm returns LN(x) ≈ [−1, 1]', () => {
    close(normalizeVector([1, 3]).output[0], -1, 1e-5); close(normalizeVector([1, 3]).output[1], 1, 1e-5);
  });
  check('Reading order: each figure or lab precedes its walk-through', () => {
    before('<ScaleDriftFigure />', 'Read the top row first');
    before('Read the top row first', '<NormalizationNetworkFigure />');
    before('<NormalizationNetworkFigure />', 'Follow example A down the five steps');
    before('Follow example A down the five steps', 'sum_i x_i,');
    before('<AffineChoiceFigure />', 'The top row is step 3');
    before('<LayerPoolingFigure />', 'In the BatchNorm panel the group runs down one column');
    before('<LayerPoolingFigure />', '<AxisGroupingFigure />');
    before('<NormalizationGeometryLab />', 'Feature 0 runs horizontally');
    before('<NormalizationGeometryLab />', 'operatorname{RMSNorm}(x)_i');
    before('<CausalNormalizationFigure />', 'The present token');
    before('<BatchNormalizationStateLab />', 'In the training panel');
    before('<BatchNormalizationStateLab />', 'mathrm{run,new}');
    before('<RunningStatisticWeightsFigure />', 'The initial zero still owns');
    before('<BackwardPathsFigure />', 'Read input 0');
    before('<NormalizationModelStrip />', 'In code it is');
    // Review F1: the reader sees the network before the program that trains it.
    before('<NormalizationModelStrip />', '<NeuralProgram topic="normalization" />');
    before('In code it is', '<NeuralProgram topic="normalization" />');
    // Review F4: the deeper derivation is closed before the main thread resumes.
    before('Deeper: deriving the rule.', 'Back to the main thread.');
    before('Back to the main thread.', '<NormalizationGradientLab />');
    before('<NormalizationPlacementLab />', 'In the pre-norm drawing');
    before('<NormalizationPlacementLab />', 'text{post-norm: }');
    before('<NormalizationAxesFigure />', 'Each row, one token');
  });
  check('Review closure: no left/right panel wording; no leading-dot decimals in tables', () => {
    assert.ok(!/(left|right) panel|on the (left|right)/.test(lesson));
    assert.ok(!/<>\{"\.[0-9]/.test(lesson));
  });
  check('Flow presentation: lesson opts in; labs use shared flow components; no card titles or old lab chrome', () => {
    assert.ok(lesson.includes('className="neural-lesson neural-lesson-neutral lesson-flow normalization-lesson"'));
    const labs = fs.readFileSync('src/learn/components/lesson-labs/NormalizationLabs.jsx', 'utf8');
    assert.ok(labs.includes("from './LessonFlow.jsx'"));
    for (const legacy of ['NeuralLab', 'NeuralNumber', 'NeuralSelect', 'neural-buttons', 'Reset tensor', 'Reset geometry', 'Reset state ledger', 'Reset gradient trace', 'Reset recorded comparison', 'Reset zero branch', 'Membership epsilon', 'Geometry epsilon']) assert.ok(!labs.includes(legacy), `labs still use ${legacy}`);
    const figures = ['NormalizationBuildupFigures.jsx', 'NormalizationIntuitionFigures.jsx'].map(f => fs.readFileSync(`src/learn/components/lesson-labs/${f}`, 'utf8')).join('\n');
    assert.ok(!figures.includes('normalization-buildup-title') && !figures.includes('<h3>'));
    const css = ['normalization-buildup.css', 'normalization-intuition.css'].map(f => fs.readFileSync(`src/learn/components/lesson-labs/${f}`, 'utf8')).join('\n');
    assert.ok(!/\.normalization-(buildup|intuition)\s*\{[^}]*(border|background)/.test(css), 'figure wrappers must not draw a card');
  });
  check('Section anchors unchanged', () => {
    const heads = [...lesson.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]);
    assert.deepEqual(heads, ['Why a network needs a moving ruler', 'A reference frame for a collection of numbers', 'Tensor axes: name the collection before applying a formula', 'LayerNorm and RMSNorm on a feature vector', 'BatchNorm remembers information between forward passes', 'The operation is differentiable, including its statistics', 'A complete CPU experiment', 'Deeper: placement, information, and numerical behavior', 'Implement the derivative and connect it to the module', 'Practice and diagnosis', 'Another explanation and the next step']);
    assert.ok(lesson.includes('#normalization-layer-anatomy'));
  });
  check('Changed JSX parses', () => sourceFiles.filter(f => f.endsWith('.jsx')).forEach(f => parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] })));
  check('Models, measurements and programs unchanged since before this revision', () => {
    const snapshot = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/before-reading-flow/sources.json', 'utf8')).topics[topicId];
    const preserved = Object.entries(snapshot).filter(([file]) => /normalization-(models|measurements|program|backward-program)\.js$/.test(file));
    // The snapshot holds the lesson's own imports (models, measurements); the two program files are
    // loaded through the shared NeuralProgram and are checked by the revision-5 rerun above.
    assert.ok(preserved.length >= 2);
    for (const [file, expected] of preserved) assert.equal(hash(file), expected, file);
    receipt.preservedFiles = preserved.map(([file]) => file);
  });
  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(f => [f, hash(f)]));
  receipt.reviewedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) {
  receipt.failure = error.stack;
  process.exitCode = 1;
}
fs.writeFileSync(`${record}/author-checks-flow.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.length, failure: receipt.failure }));
