import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ouLaw } from '../../../../src/learn/data/ito-sde-models.js';

// Complementary design checks only: no old programme main, RNG, fit or build.
const checks = [];
function check(name, pass, evidence) {
  checks.push({ name, pass: Boolean(pass), evidence });
}
const near = (a, b) => Math.abs(a - b) < 1e-12;

// Signed mean bias is negative by log(1+x) < x for x > -1, x != 0.
for (const mu of [-0.5, 0, 0.4, 1]) {
  const n = 16;
  const bias = (1 + mu / n) ** n - Math.exp(mu);
  check(`D42 signed bias mu=${mu}`, mu === 0 ? bias === 0 : bias < 0,
    { mu, n, bias, realLogDefined: bias > 0 });
}

// The proposed live domain reaches an invariant variance beyond the old
// initial-variance editor/helper contract. Preserve the rejection as evidence.
const theta = 0.05;
const eta = 1.2;
const stationaryVariance = eta ** 2 / (2 * theta);
let stationaryAttempt;
try {
  stationaryAttempt = { value: ouLaw({ theta, eta, initial: 0,
    initialVariance: stationaryVariance, time: 1 }) };
} catch (error) {
  stationaryAttempt = { error: error.message, name: error.name };
}
check('L6 valid parameter corner produces invariant variance 14.4',
  near(stationaryVariance, 14.4), { theta, eta, stationaryVariance });
check('L6 old helper rejects invariant comparison as initialVariance > 4',
  stationaryAttempt.name === 'RangeError', stationaryAttempt);
check('L6 invariant variance identity independently preserves 14.4',
  near(stationaryVariance * Math.exp(-2 * theta) +
    eta ** 2 * (-Math.expm1(-2 * theta)) / (2 * theta), stationaryVariance),
  { explanation: 'Retained initial variance plus independent injected variance.' });

// Covariance geometry: normalize before drawing a unit Mahalanobis contour.
for (const rho of [-0.6, 0, 0.6]) {
  const point = [Math.sqrt((1 + rho) / 2), Math.sqrt((1 + rho) / 2)];
  const radiusSquared = (point[0] ** 2 - 2 * rho * point[0] * point[1] +
    point[1] ** 2) / (1 - rho ** 2);
  check(`D19 unit contour rho=${rho}`, near(radiusSquared, 1),
    { point, radiusSquared, eigenvalues: [1 + rho, 1 - rho] });
}

// Independent change of driver coordinates exposes transposition.
const matrix = [[1, -2], [0.5, 1]];
const increments = [[0.2, 0.1], [-0.1, 0.3]];
const trace = [[1, -1]];
for (const dw of increments) {
  const before = trace.at(-1);
  trace.push(matrix.map((row, i) => before[i] + row[0] * dw[0] + row[1] * dw[1]));
}
check('T15 both intermediate states and terminal',
  near(trace[1][0], 1) && near(trace[1][1], -0.8) &&
  near(trace[2][0], 0.3) && near(trace[2][1], -0.55), trace);
const wrong = [1 + 0.1 + 0.5 * 0.4, -1 - 2 * 0.1 + 0.4];
check('T15 transposed map has observably different endpoint',
  !near(wrong[0], trace[2][0]) && !near(wrong[1], trace[2][1]), { wrong });
check('T15 zero second driver leaves first-column effect',
  near(1 + matrix[0][0] * 0.1, 1.1) && near(-1 + matrix[1][0] * 0.1, -0.95),
  { endpoint: [1.1, -0.95] });

// Midpoint condition: matching locations at z=0 is not a deterministic bridge.
const midpoint = (left, right, h, z) => (left + right) / 2 + Math.sqrt(h) * z / 2;
const mid = midpoint(-0.2, 0.6, 1, -1.5);
check('T13 independent midpoint and split increments',
  near(mid, -0.55) && near(mid + 0.2, -0.35) && near(0.6 - mid, 1.15),
  { midpoint: mid, increments: [mid + 0.2, 0.6 - mid] });
check('T13 zero residual leaves conditional variance positive',
  near(midpoint(-0.2, 0.6, 1, 0), 0.2) && 1 / 4 > 0,
  { midpoint: 0.2, conditionalVariance: 0.25 });

// Exact conditional/total uncertainty, not a new simulation.
const attenuation = Math.exp(-Math.log(4) / 2);
const conditionalVariance = 1 - Math.exp(-Math.log(4));
check('T16 conditional versus total variance',
  near(3 * attenuation, 1.5) && near(conditionalVariance, 0.75) &&
  near(4 * attenuation ** 2 + conditionalVariance, 1.75) &&
  near(attenuation ** 2 + conditionalVariance, 1),
  { attenuation, conditionalVariance, initialVariance4: 1.75, initialVariance1: 1 });

const here = path.dirname(fileURLToPath(import.meta.url));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = {
  reviewer: '/root/queue_nonconvex_resume',
  scope: 'Complementary whole-design review; source/helper and new exact algebra only.',
  createdAt: new Date().toISOString(),
  noOldMains: true, noRandomDraws: true, noBuildOrNativeCampaign: true,
  modelSha256: digest(path.resolve(here, '../../../../src/learn/data/ito-sde-models.js')),
  checks, passed: checks.filter(c => c.pass).length, total: checks.length,
};
fs.writeFileSync(path.join(here, 'independent-design-check-r1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, total: report.total, stationaryAttempt }));
if (report.passed !== report.total) process.exitCode = 1;
