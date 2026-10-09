import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import { SCALING_TOY, lossParts, optimalAllocation, powerCurve, lossContour, effectiveAmount, repeatedLoss, lifetimeAllocation, hardwareBudget, metricValues, sensitivityRows, RELEASED_LAW } from '../src/learn/data/scaling-laws-models.js';
const report = JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/scaling-laws-kaplan-chinchilla-beyond/native-results.json', 'utf8'));
let checks = 0;
function close(actual, expected, relative = 1e-7, absolute = 1e-10) { assert.ok(Math.abs(actual - expected) <= Math.max(absolute, relative * Math.abs(expected)), `${actual} != ${expected}`); checks++; }
const allocation = report.results['scaling_allocation.py'];
const optimum = optimalAllocation(allocation.compute_flops);
close(optimum.n, allocation.analytic_parameters); close(optimum.d, allocation.analytic_tokens); close(optimum.total, allocation.minimum_loss);
for (const budget of [.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]) {
  const o = optimalAllocation(budget * 6e18);
  close(o.n * o.d * 6, budget * 6e18);
  close(SCALING_TOY.alpha * o.parameter, SCALING_TOY.beta * o.data);
  for (const n of [100, 500, 1000, 2000]) assert.ok(lossParts(n * 1e6, budget * 1e12 / n).total >= o.total - 1e-10);
  checks += 4;
}
for (const alpha of [0, .5, 1]) for (const floor of [0, .5, 1]) {
  close(powerCurve(4, alpha, floor).excess / powerCurve(2, alpha, floor).excess, 2 ** -alpha);
  close(powerCurve(2, alpha, floor).total - powerCurve(2, alpha, floor).excess, floor);
}
for (const n of [1e8, 5e8, 1e9]) for (const target of [1.6, 1.9, 2.2, 2.8]) {
  const d = lossContour(n, target);
  if (d !== null) close(lossParts(n, d).total, target); else { assert.ok(target <= 1 + 10000 / Math.sqrt(n)); checks++; }
}
const repeat = report.results['data_constrained.py'];
for (const [i, n, d] of [[0, 6.34e9, 242e9], [1, 8.67e9, 178e9]]) {
  const actual = repeatedLoss(n, d, 25e9), expected = repeat.published_examples[i];
  close(actual.effectiveN, expected.effective_parameters); close(actual.effectiveD, expected.effective_tokens); close(actual.total, expected.loss);
}
for (const row of repeat.effective_data_at_passes) close(effectiveAmount(row.unique, row.seen, RELEASED_LAW.dataReuse), row.effective);
for (const scale of [2, 15.387756, 30]) for (let passes = 1; passes <= 20; passes++) {
  const e = effectiveAmount(4, 4 * passes, scale);
  assert.ok(e >= 4 && e <= 4 * passes && e <= 4 * (1 + scale)); checks++;
}
assert.equal(repeatedLoss(1e9, 3e9, 4e9), null); checks++;
for (const expected of report.results['lifetime_compute.py'].results) {
  const actual = lifetimeAllocation(expected.target_loss, expected.inference_tokens);
  close(actual.n, expected.parameters, 1e-6); close(actual.d, expected.training_tokens, 1e-6); close(actual.total, expected.lifetime_flops);
}
for (const target of [1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4]) for (const demand of [0, 1e10, 1e12]) {
  const value = lifetimeAllocation(target, demand);
  close(lossParts(value.n, value.d).total, target); close(value.total, value.training + value.serving);
  assert.ok(value.n > value.minimum); checks++;
}
assert.equal(lossContour(1e8, 2), null); checks++;
close(hardwareBudget(6e18, 8, 1e14, .4).hours, allocation.planning_hours);
close(hardwareBudget(6e18, 16, 1e14, .4).hours, allocation.planning_hours / 2);
close(hardwareBudget(6e18, 8, 1e14, .4).cost, hardwareBudget(6e18, 16, 1e14, .4).cost);
for (const expected of report.results['metric_sensitivity.py'].rows) {
  const actual = metricValues(expected.per_token_probability, expected.length);
  close(actual.exact, expected.exact_match_probability); close(actual.zero, expected.chance_of_zero_exact_matches); close(actual.thresholded, expected.thresholded_population_score);
}
for (const p of [0, .01, .4, .8, .99, 1]) for (const length of [1, 3, 5, 10]) {
  const actual = metricValues(p, length);
  close(actual.masses.reduce((a, b) => a + b, 0), 1); close(actual.masses[0], actual.zero);
  close(actual.masses.reduce((sum, mass, i) => sum + mass * i, 0), 100 * actual.exact);
}
const fixed = sensitivityRows(true, 1), alternate = sensitivityRows(true, 2);
fixed.forEach((row, i) => { close(row.loss, alternate[i].loss); close(row.jacobian[3], 0); });
assert.ok(sensitivityRows(false, 1).at(-1).loss !== sensitivityRows(false, 2).at(-1).loss); checks++;
for (const file of ['src/learn/components/lesson-labs/ScalingLawsFlow.jsx', 'docs/teaching/llm-architecture-training/scaling-laws-kaplan-chinchilla-beyond/scaling-laws.jsx']) {
  parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }); checks++;
}
console.log(JSON.stringify({ checks, reference: 'Native Python/SciPy fixtures plus independent boundary and invariant checks' }, null, 2));
