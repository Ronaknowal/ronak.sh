import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { binaryCurvatureReport, weightedParcelReport, leveragedParcelReport } from '../src/learn/data/linear-logistic-flow-models.js';
import { residualReport, gradientTrace, sigmoid, separationOptimum, uncertaintyReport } from '../src/learn/data/linear-logistic-models.js';

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const originals = 'docs/teaching/classical-ml-reading-flow/original/linear-logistic-before-reading-flow';
const topic = 'src/learn/data/topics/linear-logistic-regression.jsx';
const files = [
  topic,
  'src/learn/data/linear-logistic-flow-models.js',
  'src/learn/components/lesson-labs/LinearLogisticDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/RegressionInferenceDrawings.jsx',
  'src/learn/components/lesson-labs/linear-logistic-flow.css',
];
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const checks = [];
function close(actual, expected, label, tolerance = 1e-10) {
  assert(Math.abs(actual - expected) <= tolerance, label + ': ' + actual + ' != ' + expected);
  checks.push({ label, actual, expected, tolerance });
}
function expressions(source) {
  const result = [];
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXElement' && node.openingElement.name.name === 'MathBlock') {
      const expression = node.children.find(item => item.type === 'JSXExpressionContainer')?.expression;
      if (expression?.type === 'TaggedTemplateExpression') {
        result.push(expression.quasi.quasis.map(item => item.value.raw).join(''));
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
  return result;
}
const current = fs.readFileSync(topic, 'utf8');
const oldMath = expressions(fs.readFileSync(originals + '/' + topic, 'utf8'));
const newMath = expressions(current);
for (const expression of oldMath) assert(newMath.includes(expression), 'Lost or altered original formal expression: ' + expression);
for (const file of files.filter(file => /\.[jm]?[sx]+$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  parse(text, { sourceType: 'module', plugins: ['jsx'] });
  assert(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text), file + ': control character');
}
assert.equal((current.match(/<Practice title=/g) || []).length, 12);
assert.equal((current.match(/<H2>/g) || []).length, 14);
for (const file of ['src/learn/data/linear-logistic-models.js', 'src/learn/data/linear-logistic-examples.js']) {
  assert.equal(digest(file), digest(originals + '/' + file), 'Original science changed');
}

for (const importance of [0, .25, 1]) {
  const result = weightedParcelReport(importance);
  const weights = [1, 1, 1, importance];
  const x = [0, 1, 2, 3], y = [1, 2, 2, 4];
  const sum = weights.reduce((a, b) => a + b);
  const sx = weights.reduce((a, w, i) => a + w * x[i], 0);
  const sy = weights.reduce((a, w, i) => a + w * y[i], 0);
  const sxx = weights.reduce((a, w, i) => a + w * x[i] ** 2, 0);
  const sxy = weights.reduce((a, w, i) => a + w * x[i] * y[i], 0);
  const slope = (sum * sxy - sx * sy) / (sum * sxx - sx * sx);
  const intercept = (sy - slope * sx) / sum;
  close(result.slope, slope, 'weighted slope ' + importance);
  close(result.intercept, intercept, 'weighted intercept ' + importance);
  close(result.mse, weights.reduce((a, w, i) => a + w * (y[i] - intercept - slope * x[i]) ** 2, 0) / sum, 'weighted mean ' + importance);
}
for (let selected = 0; selected < 4; selected++) for (const change of [-2, 0, 1, 2]) {
  const result = leveragedParcelReport(selected, change);
  const expectedSelf = [.7, .3, .3, .7][selected];
  close(result.leverage, expectedSelf, 'leverage ' + selected + ':' + change);
  for (let row = 0; row < 4; row++) {
    close(result.rows[row].predicted - (.9 + .9 * row), result.rows[row].predictionChange,
      'prediction response ' + selected + ':' + row + ':' + change);
  }
}
const zero = binaryCurvatureReport();
close(zero.slopeGradient, -.25, 'zero-state slope gradient');
close(zero.hessian[0][0], .25, 'intercept curvature');
close(zero.hessian[0][1], 0, 'cross curvature');
close(zero.hessian[1][1], .475, 'penalized slope curvature');
close(-zero.slopeGradient / zero.hessian[1][1], 10 / 19, 'Newton and IRLS first step');
close(residualReport(0, 1).mse, .75, 'default residual mean');
close(sigmoid(1), .7310585786300049, 'binary anatomy');
close(-1 + .1 * (1 - sigmoid(1)), -.9731058578630005, 'same-old logistic intercept update');
close(1 + .2 * (1 - sigmoid(1)), 1.053788284273999, 'same-old logistic slope update');
for (const rate of [.05, .2, .3]) {
  const trace = gradientTrace(rate, 16);
  assert(trace.every(row => Number.isFinite(row.mse)));
  checks.push({ label: 'full sixteen-step finite trace ' + rate, states: trace.length });
}
close(separationOptimum(.02), 2.817989135948636, 'small-penalty optimum', 1e-6);
close(separationOptimum(.2), 1.177505264153562, 'larger-penalty optimum', 1e-6);
for (const input of [-1, 0, 2.5, 5, 8, 9]) {
  const report = uncertaintyReport(input);
  assert(report.individualHalfWidth > report.meanHalfWidth);
  checks.push({ label: 'interval ordering ' + input, mean: report.meanHalfWidth, individual: report.individualHalfWidth });
}
close(.647514 - .646604, .000910, 'printed held-out gain');
close(.5 * 3 ** 2, 4.5, 'squared hand loss at residual three');
close(3 - .5, 2.5, 'Huber hand loss at residual three');
close(1 * (1 - .3), .7, 'warning expected cost');
close(4 * .3, 1.2, 'quiet expected cost');
for (const weight of [0, 2, 12]) {
  const scores = [-weight, 0, 0, weight];
  const labels = [0, 0, 1, 1];
  const stableMean = scores.reduce((sum, score, index) => {
    const signed = (1 - 2 * labels[index]) * score;
    return sum + (Math.max(signed, 0) + Math.log1p(Math.exp(-Math.abs(signed)))) / 4;
  }, 0);
  close(stableMean, .5 * Math.log1p(Math.exp(-weight)) + .5 * Math.log(2),
    'quasi-separation four-row loss at ' + weight);
}
close(Math.log(2) / 2, .34657359027997264, 'quasi-separation limiting loss');
close(7 / 4, 1.1875 + .75 ** 2, 'mean constant shared-shift error');

const receipt = {
  checkedAt: new Date().toISOString(),
  scope: 'Author source/formal-depth conservation and complementary teaching arithmetic; not independent review or rendered acceptance',
  sourceHashes: Object.fromEntries(files.map(file => [file, digest(file)])),
  originalMathBlocksRetained: oldMath.length,
  practiceCount: 12, sectionCount: 14, checks,
};
const suffix = process.argv[2] || receipt.checkedAt.replace(/[:.]/g, '-');
fs.writeFileSync(folder + '/reading-flow-author-sources-' + suffix + '.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ checks: checks.length, originalMathBlocksRetained: oldMath.length }));
