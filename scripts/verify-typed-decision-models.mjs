import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import * as m from '../src/learn/data/typed-decision-models.js';

const topic = 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
const close = (name, actual, expected, tolerance = 1e-9) => check(name, Math.abs(actual - expected) <= tolerance);
const data = read('public/learn-assets/typed-decision-systems/observations.json');
const accepted = read(`${topic}/content-review-acceptance.json`);
for (const [path, expected] of Object.entries(accepted.files)) check(`content ${path}`, sha(path) === expected);
for (const [path, expected] of Object.entries(data.sources)) check(`observation ${path}`, sha(path) === expected);
for (const name of ['Shared', 'Foundations', 'Probability', 'Study', 'Native']) {
  parse(fs.readFileSync(`src/learn/components/lesson-labs/TypedDecision${name}.jsx`, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  check(`parse ${name}`, true);
}
const softmaxReference = z => {
  const numerator = z.map(Math.exp);
  const denominator = numerator.reduce((a, b) => a + b, 0);
  return numerator.map(x => x / denominator);
};
for (const a of [-8, -1, 0, 3, 8]) for (const b of [-8, 0, 1, 8]) for (const shift of [-1000, 0, 1000]) {
  const row = m.softmaxTrace([a + shift, b + shift, shift]).probabilities;
  softmaxReference([a, b, 0]).forEach((x, i) => close(`stable ${a}/${b}/${shift}/${i}`, row[i], x));
}
assert.throws(() => m.softmaxTrace([0, 0], [false, false]));
check('all-invalid rejected', true);
check('mask excludes accidental high padding', m.softmaxTrace([0, 0, 4], [true, true, false]).probabilities.join(',') === '.5,.5,0'.replaceAll('.5', '0.5'));
for (const target of [[0, 1, 0], [.2, .5, .3]]) {
  const z = [2, 1, 0];
  const trace = m.ceStep(z, target, .05);
  for (let coordinate = 0; coordinate < 3; coordinate++) {
    const loss = step => {
      const row = z.map((x, i) => x + (i === coordinate ? step : 0));
      const maximum = Math.max(...row);
      const lse = maximum + Math.log(row.reduce((total, x) => total + Math.exp(x - maximum), 0));
      return target.reduce((total, t, i) => total + t * (lse - row[i]), 0);
    };
    close(`CE derivative ${target}/${coordinate}`, trace.gradient[coordinate], (loss(1e-6) - loss(-1e-6)) / 2e-6, 1e-8);
  }
  check(`positive step lowers loss ${target}`, -m.dot(target, trace.afterP.map(Math.log)) < trace.loss);
}
for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20; b++) {
  const p = m.stickProbability(a / 20, b / 20);
  close(`simplex sum ${a}/${b}`, m.sum(p), 1);
  m.simplexPoint(p);
  close(`Brier truth optimum ${a}/${b}`, m.scores(p, p).brierRegret, 0);
  close(`KL truth optimum ${a}/${b}`, m.scores(p, p).kl, 0);
}
check('infinite log boundary', m.scores([.6, .3, .1], [1, 0, 0]).kl === Infinity);
close('ordinal mean endpoints', m.ordinalTrace([.5, 0, .5], 1).expectation, 1);
close('rubric changes expectation', m.ordinalTrace([.5, 0, .5], 1, [0, 1, 10]).expectation, 5);
for (const coefficient of [.5, .75]) {
  const truth = [1 - 1e-6, 1e-6];
  const report = [1 - .5e-6, .5e-6];
  check(`rare floor counterexample ${coefficient}`, m.clippedReward(truth, report, coefficient) > m.clippedReward(truth, truth, coefficient));
  check(`proper log unchanged ${coefficient}`, m.scores(truth, report).kl > 0);
}
const costs = [[0, 3, 8], [2, 0, 5], [12, 4, 0]];
for (let r = 0; r <= 100; r++) {
  const review = r / 10;
  m.costRegions(costs, review).forEach((polygon, action) => {
    polygon.forEach((p, vertex) => {
      m.simplexPoint(p);
      const risks = costs[0].map((_, a) => costs.reduce((total, row, y) => total + p[y] * row[a], 0)).concat(review);
      check(`cost region ${r}/${action}/${vertex}`, risks[action] <= Math.min(...risks) + 1e-10);
    });
  });
}
for (const [method, item] of Object.entries(data.calibration.methods)) {
  const source = method === 'laya' ? read('public/learn/examples/typed-decision-systems/results/laya/logits.json').test : data.scratchLogits[method];
  for (let i = 0; i < 120; i++) {
    const p = m.softmaxTrace(source.logits[i], undefined, item.temperature).probabilities;
    p.forEach((x, j) => close(`cached ${method}/${i}/${j}`, x, item.test_calibrated.probabilities[i][j], 2e-12));
    check(`argmax ${method}/${i}`, m.argmax(p) === m.argmax(item.test_raw.probabilities[i]));
  }
  const target = data.test.map(x => x.target);
  const matrix = m.confusion(item.test_raw.probabilities, target);
  close(`confusion N ${method}`, m.sum(matrix.flat()), 120);
  close(`confusion accuracy ${method}`, m.sum(matrix.map((row, i) => row[i])) / 120, item.test_raw.accuracy);
  const bins = m.reliability(item.test_calibrated.probabilities, target, 5);
  bins.forEach((bin, i) => {
    const saved = item.test_calibrated.reliability[i];
    check(`bin N ${method}/${i}`, bin.count === saved.n);
    if (bin.count) {
      close(`bin confidence ${method}/${i}`, bin.confidence, saved.mean_confidence);
      close(`bin accuracy ${method}/${i}`, bin.accuracy, saved.accuracy);
    } else check(`empty bin ${method}/${i}`, bin.confidence === null && bin.accuracy === null);
  });
}
for (const method of ['seed-17', 'seed-29', 'seed-43', 'lexical']) for (const variant of ['raw', 'calibrated']) {
  const probabilities = data.calibration.methods[method][`test_${variant}`].probabilities;
  const fallback = data.calibration.methods.laya.test_raw.probabilities;
  const target = data.test.map(x => x.target);
  for (const saved of data.routing.methods[method][variant].diagnostic_thresholds) {
    const got = m.routeRows(probabilities, fallback, target, saved.threshold);
    for (const [key, other] of [['cheapCount', 'cheap_count'], ['wrong', 'wrong_final'], ['meanCost', 'mean_cost'], ['coverage', 'coverage']]) close(`routing ${method}/${variant}/${saved.threshold}/${key}`, got[key], saved[other]);
  }
}
const native = data.typed;
check('native six rows', native.raw_logits.length === 6 && native.forward_events[0].input_shape[0] === 6);
check('native row order widths', native.raw_logits.map(x => x.length).join(',') === '6,3,2,6,3,2');
check('all shifts retained', data.shifts.rows.length === 24 && data.nativeShifts.length === 24);
for (const seed of ['17', '29', '43']) {
  const run = data.history[seed];
  check(`history final row ${seed}`, run.history.at(-1).step === 400 && run.history.at(-1).next_40th_batch_nll == null);
  check(`history next-step semantics ${seed}`, run.history.filter(x => x.next_40th_batch_nll != null).map(x => x.step + 40).join(',') === '40,80,120,160,200,240,280,320,360,400');
}
const paths = [`${topic}/lesson.jsx`, 'src/learn/data/typed-decision-models.js', 'src/learn/components/lesson-labs/typed-decision-flow.css',
  ...['Shared', 'Foundations', 'Probability', 'Study', 'Native'].map(name => `src/learn/components/lesson-labs/TypedDecision${name}.jsx`),
  'public/learn-assets/typed-decision-systems/observations.json', 'scripts/verify-typed-decision-models.mjs'];
fs.writeFileSync(`${topic}/runtime-model-checks.json`, JSON.stringify({ status: 'passed', conditions: checks.length,
  scope: 'Finite arithmetic, source conservation and projection of already saved records. No model construction, inference, training or scientific replay.',
  retained_preflight: 'Before this verifier, the geometry smoke check found -1e-16 barycentric residues rejected by simplexPoint. Its geometric validator now accepts only 1e-12 edge roundoff, without moving the derived point.',
  files: Object.fromEntries(paths.map(path => [path, sha(path)])), checks }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'passed', conditions: checks.length }));
