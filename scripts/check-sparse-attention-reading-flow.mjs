import fs from 'node:fs';
import crypto from 'node:crypto';
import { sparseForecastTrace, sparseHeadTrace, sparseOpeningRead, sparseQuotientGradient, sparseNystromTrace } from '../src/learn/data/sparse-attention-reading-traces.js';
import examples from '../src/learn/data/sparse-attention-examples.json' with { type: 'json' };

// This scoped checkpoint tests the new trace layer. It never executes fitting
// entry points or overwrites any historical scientific receipt.
const checks = [];
function assert(name, pass, details = {}) {
  checks.push({ name, pass: Boolean(pass), ...details });
  if (!pass) throw new Error(`${name}: ${JSON.stringify(details)}`);
}
const maximumError = (left, right) => Math.max(...left.flat(Infinity).map((value, index) => Math.abs(value - right.flat(Infinity)[index])));
const dot = (left, right) => left.reduce((total, value, index) => total + value * right[index], 0);
const boundPaths = ['src/learn/data/sparse-attention-reading-traces.js', 'src/learn/data/sparse-attention-models.js', 'src/learn/data/sparse-attention-examples.json'];
for (const mode of ['dense', 'window', 'kernel']) {
  const path = `public/learn-assets/sparse-linear-attention-variants/${mode}-forecast.json`;
  boundPaths.push(path);
  const weights = JSON.parse(fs.readFileSync(path)).weights;
  for (const length of [8, 27, 32, 44]) {
    const trace = sparseForecastTrace(weights, examples.sourcePoints.slice(0, length), mode);
    assert(`${mode} full network trace, prefix ${length}`, trace.maximumDifference < 2e-13, { error: trace.maximumDifference });
    const head = sparseHeadTrace(trace, 0);
    const mixed = head.values[0].map((_, coordinate) => head.values.reduce((total, value, record) => total + value[coordinate] * head.weights[record], 0));
    assert(`${mode} same-case head contributions, prefix ${length}`, maximumError([mixed], [head.output]) < 1e-14);
    assert(`${mode} head coefficients sum one, prefix ${length}`, Math.abs(head.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    if (mode === 'kernel') {
      assert(`Kernel numerator/denominator, prefix ${length}`, maximumError([head.numerator.map(value => value / head.appliedDenominator)], [head.output]) < 2e-13);
      assert(`Kernel state agrees with retained helper, prefix ${length}`, maximumError(head.matrix, trace.matrices[0]) === 0);
    }
  }
  const points = examples.sourcePoints.slice(0, 27).map(row => [...row]);
  points[19][1] = 1 - points[19][1];
  points[25][0] = 0.17;
  const edited = sparseForecastTrace(weights, points, mode);
  assert(`${mode} combined edited network trace`, edited.maximumDifference < 2e-13, { error: edited.maximumDifference });
  assert(`${mode} selected head owns the edited point`, edited.points[25][0] === 0.17 && edited.points[19][1] === points[19][1]);
}
const opening = sparseOpeningRead();
assert('Opening read has complete 2/1/1 masses and answer 1.75', opening.mass === 4 && opening.output[0] === 1.75);
const nystrom = sparseNystromTrace(examples.nystrom_worked);
assert('Value-first Nyström trace agrees with saved independent calculation', maximumError(nystrom.output, examples.nystrom_worked.approximate_output) < 1e-14);
const query = [1, 3], keys = [[1, 2], [2, 1], [1, 1]], values = [[1, -1], [0, 2], [3, 1]], upstream = [0.4, -0.7];
const gradient = sparseQuotientGradient(query, keys, values, upstream);
function directLoss(q, k, v) {
  const amounts = k.map(key => dot(q, key));
  const denominator = amounts.reduce((a, b) => a + b, 0);
  const result = v[0].map((_, coordinate) => v.reduce((total, row, record) => total + amounts[record] * row[coordinate], 0) / denominator);
  return dot(result, upstream);
}
const epsilon = 1e-5;
for (let coordinate = 0; coordinate < 2; coordinate += 1) {
  const high = [...query], low = [...query];
  high[coordinate] += epsilon; low[coordinate] -= epsilon;
  const expected = (directLoss(high, keys, values) - directLoss(low, keys, values)) / (2 * epsilon);
  assert(`New trace query derivative ${coordinate}`, Math.abs(expected - gradient.queryGradient[coordinate]) < 2e-10);
}
assert('Zero query yields an explicitly undefined gradient', sparseQuotientGradient([0, 0], keys, values, upstream).defined === false);
const emptyGradient = sparseQuotientGradient(query, [], [], upstream);
assert('Zero included writes retain the two-value shape and undefined derivative', emptyGradient.defined === false && emptyGradient.read.matrix.length === 2 && emptyGradient.read.matrix[0].length === 2);
assert('Empty memory is genuinely zero state, without an epsilon read', emptyGradient.read.denominator === 0 && emptyGradient.read.matrix.flat().every(value => value === 0) && emptyGradient.read.output === null);
const bindings = boundPaths.map(path => {
  const bytes = fs.readFileSync(path);
  return { path, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
});
const receipt = { scope: 'New trace-layer checkpoint only; no whole-lesson/browser/native-fit claim', bindings, checks, pass: checks.every(check => check.pass) };
fs.writeFileSync('docs/teaching/deep-learning-beginner/sparse-linear-attention-variants/reading-flow-trace-checks.json', `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ pass: receipt.pass, checks: checks.length }));
