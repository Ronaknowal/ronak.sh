// Author checks for the Normalization beginner-buildup revision: every new worked
// value is recomputed independently, and unchanged programs/data keep their bytes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';

const topicId = 'batch-layer-group-rms-normalization';
const record = `docs/teaching/deep-learning-beginner/${topicId}`;
const sourceFiles = [
  `src/learn/data/topics/${topicId}.jsx`,
  'src/learn/components/lesson-labs/NormalizationBuildupFigures.jsx',
  'src/learn/components/lesson-labs/normalization-buildup.css',
  'src/learn/components/lesson-labs/NormalizationLabs.jsx',
  'src/learn/components/lesson-labs/normalization-labs.css',
];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (actual, expected, tolerance = 5e-4) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const eps = 1e-5;
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const normalize = values => { const m = mean(values), s = Math.sqrt(mean(values.map(v => (v - m) ** 2)) + eps); return { m, v: mean(values.map(x => (x - m) ** 2)), s, h: values.map(x => (x - m) / s) }; };
const slope = z => 1 - Math.tanh(z) ** 2;
const receipt = { topicId, passed: false, checks: [], sourceFiles };
const check = (name, run) => { run(); receipt.checks.push({ name, passed: true }); };

try {
  check('Scale drift: saturated slopes, restored slopes, identical normalized pattern', () => {
    const early = normalize([-1.5, -.5, .5, 1.5]), later = normalize([6, 8, 10, 12]);
    assert.ok(Math.max(...[6, 8, 10, 12].map(slope)) < 2.5e-5 && Math.max(...[6, 8, 10, 12].map(slope)) > 2.4e-5);
    [.181, .786, .786, .181].forEach((value, i) => close(slope([-1.5, -.5, .5, 1.5][i]), value));
    [.240, .824, .824, .240].forEach((value, i) => close(slope(later.h[i]), value));
    early.h.forEach((value, i) => close(value, later.h[i], 5e-4));
    assert.deepEqual([later.m, later.v], [9, 5]);
  });
  check('Ruler arithmetic, epsilon null and affine rows', () => {
    const r = normalize([1, 3, 5, 7]);
    [-1.342, -.447, .447, 1.342].forEach((value, i) => close(r.h[i], value));
    assert.deepEqual(normalize([5, 5]).h, [0, 0]);
    [-1.683, .106, 1.894, 3.683].forEach((value, i) => close(2 * r.h[i] + 1, value));
    [1, 3, 5, 7].forEach((value, i) => close(Math.sqrt(5 + eps) * r.h[i] + 4, value, 1e-12));
  });
  check('RMS by hand and mean-square identity', () => {
    close(1 / Math.sqrt(5 + eps), .447213, 1e-6); close(3 / Math.sqrt(5 + eps), 1.341639, 1e-6);
    close(11 / Math.sqrt(145 + eps), .9135, 1e-6);
  });
  check('Backward routes against central finite differences', () => {
    const x = [1, 3, -2], u = [.3, -.2, .8], n = normalize(x);
    close(n.m, 2 / 3, 1e-12); close(n.v, 38 / 9, 1e-12); close(n.s, 2.0548, 1e-4);
    const mu = mean(u), muh = mean(u.map((value, i) => value * n.h[i]));
    close(mu, .3, 1e-12); close(muh, -.4056, 1e-4);
    const direct = u.map(value => value / n.s), total = u.map((value, i) => (value - mu - n.h[i] * muh) / n.s);
    close(direct.reduce((a, b) => a + b), .438);
    const loss = values => normalize(values).h.reduce((sum, value, i) => sum + value * u[i], 0);
    total.forEach((value, i) => { const step = 1e-6, plus = [...x], minus = [...x]; plus[i] += step; minus[i] -= step; close((loss(plus) - loss(minus)) / (2 * step), value, 1e-7); });
    [.032, -.019, -.013].forEach((value, i) => close(total[i], value));
    close(total.reduce((a, b) => a + b), 0, 1e-12);
    close((.3 - .3 + .162 * .4056) / 2.0548, .032, 5e-4);
  });
  check('Nudge trace of x0 and new practice routes', () => {
    const x = [1, 3, -2], u = [.3, -.2, .8], n = normalize(x), step = 1e-7;
    const nudged = [...x]; nudged[0] += step;
    close((normalize(nudged).s - n.s) / step, n.h[0] / 3, 1e-6); close(n.h[0] / 3, .054, 5e-4);
    const muh = mean(u.map((value, i) => value * n.h[i]));
    close(u[0] / n.s, .146); close(-mean(u) / n.s, -.146); close(-n.h[0] * muh / n.s, .032); close(-.162 * -.406 / 2.055, .032, 5e-4);
    const p = normalize([0, 2, 4]), q = [1, 0, 0], pm = mean(q), pmh = mean(q.map((value, i) => value * p.h[i]));
    close(p.s, 1.633); [-1.225, 0, 1.225].forEach((value, i) => close(p.h[i], value)); close(pmh, -.408);
    const direct = q.map(value => value / p.s), spread = p.h.map(h => -h * pmh / p.s);
    [.612, 0, 0].forEach((value, i) => close(direct[i], value)); close(-pm / p.s, -.204); [-.306, 0, .306].forEach((value, i) => close(spread[i], value));
    const total = q.map((_, i) => direct[i] - pm / p.s + spread[i]);
    [.102, -.204, .102].forEach((value, i) => close(total[i], value));
    const loss = values => normalize(values).h[0];
    total.forEach((value, i) => { const plus = [0, 2, 4], minus = [0, 2, 4]; plus[i] += 1e-6; minus[i] -= 1e-6; close((loss(plus) - loss(minus)) / 2e-6, value, 1e-7); });
    const t = [2, -1, 2], rms = Math.sqrt(mean(t.map(v => v * v)));
    [1.155, -.577, 1.155].forEach((value, i) => close(t[i] / rms, value)); [.707, -1.414, .707].forEach((value, i) => close(normalize(t).h[i], value));
    assert.ok(400 * 400 > 65504);
  });
  check('Practice values', () => {
    const p = normalize([2, 4, 6, 12]);
    close(p.v, 14, 1e-12); close(p.s, 3.7417, 1e-4);
    [-1.069, -.535, 0, 1.604].forEach((value, i) => close(p.h[i], value));
    [.377, .761, 1, .150].forEach((value, i) => close(slope(p.h[i]), value));
    close(slope(12), 1.5e-10, 1e-11); close(slope(6), 2.5e-5, 1e-6);
    close(.75 * 2 + .25 * 6, 3, 1e-12); close(.75 * 4 + .25 * 9 * 4 / 3, 6, 1e-12); close(3 / Math.sqrt(6 + eps), 1.2247);
    assert.deepEqual([2 * 3 * 4, 6 / 3 * 3 * 4, 3 * 4], [24, 24, 12]);
  });
  const measurements = (await import('../src/learn/data/normalization-measurements.js')).default;
  const final = run => run.history.at(-1);
  for (const seed of [1, 2, 3]) {
    const runs = measurements.records.filter(run => run.seed === seed), none = runs.find(run => /none/i.test(run.normalization));
    for (const run of runs.filter(run => run !== none)) {
      const ratio = final(none).train_evaluation_loss / final(run).train_evaluation_loss;
      assert.ok(ratio > 4 && ratio < 5, `${seed} ${run.normalization} ${ratio}`);
      assert.ok(final(run).validation_loss < final(none).validation_loss);
    }
    const counts = runs.map(run => final(run).validation_correct);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 2);
  }
  receipt.checks.push({ name: 'Recorded runs: 4–5× lower training loss, lower validation loss, counts within 2', passed: true });
  check('Changed JSX parses', () => sourceFiles.filter(file => file.endsWith('.jsx')).forEach(file => parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] })));
  const originals = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/original-sources.json', 'utf8')).topics[topicId];
  const preserved = Object.entries(originals).filter(([file]) => /normalization-(models|measurements|program|backward-program)\.js$/.test(file));
  assert.equal(preserved.length, 4);
  for (const [file, expected] of preserved) assert.equal(hash(file), expected, file);
  const assets = fs.readdirSync(`public/learn-assets/${topicId}`).map(name => `public/learn-assets/${topicId}/${name}`);
  const baseline = JSON.parse(fs.readFileSync('docs/teaching/evidence/concept-intuition-baseline.json', 'utf8')).actualFileHashes;
  for (const file of assets.filter(file => baseline[file])) assert.equal(hash(file), baseline[file], file);
  receipt.checks.push({ name: 'Models, measurements, displayed programs and downloads unchanged', passed: true, files: preserved.length + assets.filter(file => baseline[file]).length });
  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, hash(file)]));
  receipt.reviewedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) {
  receipt.failure = error.stack;
  process.exitCode = 1;
}
// NORMALIZATION_RECEIPT redirects the receipt so later revisions can rerun these checks
// without rewriting the revision-5 evidence file.
const receiptPath = process.env.NORMALIZATION_RECEIPT || `${record}/author-checks.json`;
fs.mkdirSync(receiptPath.slice(0, Math.max(receiptPath.lastIndexOf('/'), receiptPath.lastIndexOf('\\'))), { recursive: true });
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.map(entry => entry.name), failure: receipt.failure }, null, 1));
