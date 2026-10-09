import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const checks = [];
const close = (actual, expected, name, tolerance = 1e-10) => {
  assert(Math.abs(actual - expected) <= tolerance, `${name}: ${actual} versus ${expected}`);
  checks.push({ name, actual, expected, tolerance });
};
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const x = [0, 1, 2, 3];
const y = [1, 2, 2, 4];
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const centeredSquare = x.map(value => (value - mean(x)) ** 2);
assert.deepEqual(centeredSquare, [2.25, .25, .25, 2.25]);
close(centeredSquare.reduce((sum, value) => sum + value, 0), 5, 'centered-square denominator');
function gradients(intercept, slope) {
  const errors = x.map((value, index) => intercept + slope * value - y[index]);
  return [2 * mean(errors), 2 * mean(errors.map((value, index) => x[index] * value))];
}
close(gradients(0, 0)[0], -4.5, 'shared original intercept gradient');
close(gradients(0, 0)[1], -9, 'shared original slope gradient');
close(gradients(.4, 0)[1] - gradients(0, 0)[1], 1.2, 'changing old b changes the slope derivative too');
close(0 - .05 * gradients(0, 0)[0], .225, 'retained first new intercept');
close(0 - .05 * gradients(0, 0)[1], .45, 'retained first new slope');
const probability = 1 / (1 + Math.exp(-(-1 + 1 * 2)));
close(probability, .7310585786300049, 'shared binary old-state probability');
close(probability - 1, -.2689414213699951, 'binary intercept derivative');
close(2 * (probability - 1), -.5378828427399902, 'binary slope derivative receives feature two');
close(-1 - .1 * (probability - 1), -.9731058578630005, 'retained binary new intercept');
close(1 - .1 * 2 * (probability - 1), 1.053788284273999, 'retained binary new slope');

const observations = [1, 1.7, 3.2, 3.7, 5.3, 5.8];
const positions = observations.map((_, index) => index);
const centeredSum = positions.reduce((sum, value) => sum + (value - mean(positions)) ** 2, 0);
const slope = positions.reduce((sum, value, index) =>
  sum + (value - mean(positions)) * (observations[index] - mean(observations)), 0) / centeredSum;
const intercept = mean(observations) - slope * mean(positions);
const sse = positions.reduce((sum, value, index) => sum + (observations[index] - intercept - slope * value) ** 2, 0);
const degreesOfFreedom = observations.length - 2;
const variance = sse / degreesOfFreedom;
const tCutoff = 2.7764451051977987;
close(sse, .333714, 'printed squared-residual sum', .5e-6);
close(variance, .083429, 'printed noise-variance estimate', .5e-6);
close(degreesOfFreedom, 4, 'six rows minus two fitted coefficients');
const leverage = 1 / observations.length;
const meanSE = Math.sqrt(variance * leverage);
const newSE = Math.sqrt(variance * (1 + leverage));
close(meanSE, .117918, 'printed mean standard error', .5e-6);
close(newSE, .311983, 'printed new-outcome standard error', .5e-6);
const fittedMean = intercept + slope * 2.5;
close(fittedMean - tCutoff * meanSE, 3.122606, 'printed mean lower endpoint', .5e-6);
close(fittedMean + tCutoff * meanSE, 3.777394, 'printed mean upper endpoint', .5e-6);
close(fittedMean - tCutoff * newSE, 2.583797, 'printed new-outcome lower endpoint', .5e-6);
close(fittedMean + tCutoff * newSE, 4.316203, 'printed new-outcome upper endpoint', .5e-6);
const previous = JSON.parse(fs.readFileSync(folder + '/reading-flow-ready-first-pass-route.json', 'utf8'));
const unchanged = Object.entries(previous.sourceHashes).filter(([path]) => ![
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
].includes(path));
for (const [path, expected] of unchanged) assert.equal(digest(path), expected, path);
const sourcePaths = ['src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx'];
const receipt = { at: new Date().toISOString(),
  scope: 'Author complementary arithmetic for the corrected fixed-fixture derivative drawings and printed interval ladder. Critical t value reuses the unchanged executed native quantile evidence; no programme reruns or refits.',
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, digest(path)])),
  unchangedBindings: unchanged.length, checks };
const suffix = process.argv[2] || 'initial';
const path = folder + '/reading-flow-review-corrections-numerics-' + suffix + '.json';
assert(!fs.existsSync(path));
fs.writeFileSync(path, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ checks: checks.length, unchangedBindings: unchanged.length }));
