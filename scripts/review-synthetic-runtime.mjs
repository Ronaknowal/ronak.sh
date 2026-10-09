import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as model from '../src/learn/data/synthetic-data-models.js';

const folder = 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const groups = [];
let conditions = 0;
function near(actual, expected, tolerance = 2e-12) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
  conditions++;
}
function check(condition) { assert.ok(condition); conditions++; }

const acceptance = JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`));
for (const [path, sha] of Object.entries(acceptance.bindings)) check(hash(path) === sha);
groups.push('All frozen content inputs match; no scientific replay');

for (const masses of [[0, .2, .8, 0], [...Array(10).fill(.1), 0], [.5, 0, 0, .5], [0, 0, 1, 0]]) {
  for (const u of [0, Number.EPSILON, .199999, .2, .499999, .5, .8, 1 - Number.EPSILON / 2]) {
    const id = model.inverseCDF(masses, u);
    check(masses[id] > 0);
    const reversed = [...masses].reverse();
    const positive = reversed.filter(x => x > 0);
    const positiveIndex = model.inverseCDF(positive, u);
    check(model.inverseCDF(reversed, u) === reversed.map((p, i) => ({p, i})).filter(x => x.p > 0)[positiveIndex].i);
  }
}
check(model.inverseCDF([0, .2, .8, 0], .2) === 2);
check(model.inverseCDF([...Array(10).fill(.1), 0], 1 - Number.EPSILON / 2) === 9);
groups.push('Positive-support CDF: zeros, exact boundaries, rounding tail and support-to-ID mapping');

for (const temperature of [.2, .7, 1, 2]) {
  for (const threshold of [.1, .4, .8, .95, 1]) {
    const state = model.sampling([.05, .55, .25, .15], temperature, threshold);
    near(state.nucleus.reduce((a, b) => a + b, 0), 1);
    check(state.retainedMass >= threshold - 1e-15);
    if (state.kept.length > 1) check(state.retainedMass - state.probabilities[state.kept.at(-1)] < threshold + 1e-15);
    check(state.kept[0] === 1);
    state.nucleus.forEach((p, i) => check((p > 0) === state.kept.includes(i)));
  }
}
groups.push('Nucleus minimal crossing support and token-ID permutation');

for (const c of [0, .2, .6, 1]) for (const t of [0, .5, 1]) for (const f of [0, .3, 1]) {
  const s = model.selection(c, t, f);
  near(s.tp + s.fn, c);
  near(s.fp + s.tn, 1 - c);
  near(s.tp + s.fp, s.acceptance);
  if (c === 0) check(s.recall === null);
  if (s.acceptance === 0) check(s.precision === null);
  else near(s.precision, c * t / (c * t + (1 - c) * f));
}
groups.push('Selection denominators, absent positive class and empty accepted population');

for (const rule of ['replace', 'anchor', 'accumulate', 'fresh']) {
  for (const alpha of [0, .4, 1]) {
    const rows = model.populationPath({rule, population: 20, generations: 5, seed: 6, alpha});
    for (const row of rows) {
      near(row.distribution.reduce((a, b) => a + b, 0), 1);
      near(row.counts.reduce((a, b) => a + b, 0), 20);
      const g = row.generation;
      check(row.stored === (rule === 'accumulate' ? 20 * (g + 1) : rule === 'anchor' && g > 0 ? 40 : 20));
      if (g === 0) continue;
      row.distribution.forEach((p, i) => {
        const prior = rows[g - 1].distribution[i];
        const empirical = row.counts[i] / 20;
        const target = rule === 'anchor' ? (1 - alpha) * [.6, .3, .1][i] + alpha * empirical
          : rule === 'accumulate' ? (prior * g + empirical) / (g + 1) : empirical;
        near(p, target);
      });
    }
  }
}
const factorial = n => n < 2 ? 1 : n * factorial(n - 1);
for (const N of [3, 4]) {
  const q = [.6, .3, .1];
  let replacement = 0, accumulated = 0, mass = 0;
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N - a; b++) {
    const c = N - a - b;
    const probability = factorial(N) / (factorial(a) * factorial(b) * factorial(c)) * q[0] ** a * q[1] ** b * q[2] ** c;
    const sample = [a, b, c].map(x => x / N);
    mass += probability;
    replacement += probability * (1 - sample.reduce((s, p) => s + p * p, 0));
    accumulated += probability * (1 - sample.map((p, i) => (p + q[i]) / 2).reduce((s, p) => s + p * p, 0));
  }
  near(mass, 1);
  near(model.expectedH('replace', N, 1)[1], replacement);
  near(model.expectedH('accumulate', N, 1)[1], accumulated);
}
groups.push('Four recursive rules: exact per-step distributions/storage and enumerated finite multinomial expectations');

for (const text of ['é', 'Alice 🐇', 'e\u0301', 'x'.repeat(33)]) {
  const got = model.windows(text, 3);
  check(got.bytes.length === Buffer.from(text).length);
  check(got.count === Math.max(0, Buffer.from(text).length - 3));
}
for (const alpha of [0, 1]) check(model.mixBatch(alpha).every(row => row.generated === Boolean(alpha)));
check(model.costLedger(.04, .01, 0).perKeep === null);
near(model.costLedger(.04, .01, .62).perKeep, 5 / 62);
groups.push('UTF-8 windows, mixture endpoints and zero-acceptance expense');

const bindings = Object.fromEntries([
  'src/learn/data/synthetic-data-models.js',
  'scripts/review-synthetic-runtime.mjs',
  `${folder}/content-acceptance.json`,
].map(path => [path, hash(path)]));
const report = {reviewer:'training_author', status:'passed', conditions, groups, fits:0, neuralGenerations:0, bindings};
fs.writeFileSync(`${folder}/runtime-review-model-checks.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
