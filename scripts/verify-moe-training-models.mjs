import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as model from '../src/learn/data/moe-training-models.js';

const folder = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const checks = [];
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
function close(name, actual, expected, tolerance = 1e-10) {
  assert(Math.abs(actual - expected) <= tolerance, `${name}: ${actual} != ${expected}`);
  checks.push({ name, actual, expected, tolerance });
}
const acceptance = JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`));
for (const [path, expected] of Object.entries(acceptance.bindings)) {
  assert.equal(hash(path), expected, `Frozen content changed: ${path}`);
}
checks.push({ name: 'Every root-frozen content binding conserved', count: Object.keys(acceptance.bindings).length });

const ordinary = model.mixtureTrace();
close('Selected return coordinate 0', ordinary.output[0], 4 / 3);
close('Selected return coordinate 1', ordinary.output[1], 1);
close('No-drop router credit 0', ordinary.logitGradient[0], -2 / 9);
for (const convention of ['selected', 'full', 'sigmoid']) {
  for (const k of [1, 2, 3]) {
    for (const accepted of [[true, true, true], [false, true, true], [false, false, false]]) {
      const options = { convention, k, accepted, logits: [1.1, .4, -.8] };
      const trace = model.mixtureTrace(options);
      trace.logitGradient.forEach((gradient, id) => {
        const epsilon = 1e-5;
        const plus = [...options.logits], minus = [...options.logits];
        plus[id] += epsilon;
        minus[id] -= epsilon;
        const fd = (model.mixtureTrace({ ...options, logits: plus }).objective
          - model.mixtureTrace({ ...options, logits: minus }).objective) / (2 * epsilon);
        close(`Finite difference ${convention}, k${k}, accepted${accepted}, z${id}`, gradient, fd, 5e-10);
      });
    }
  }
}
const partial = model.mixtureTrace({ accepted: [false, true, true] });
close('Rejected selected branch denominator credit', partial.logitGradient[0], -2 / 3);
close('Accepted selected branch credit', partial.logitGradient[1], 2 / 3);
assert.deepEqual(partial.returnGradient[0], [0, 0]);
assert.deepEqual(model.capacityTrace().updates, [1.5, 1.5, 1.5, 1.5]);
assert.deepEqual(model.capacityTrace(undefined, 0).updates, [0, 0, 0, 0]);
assert.deepEqual(model.capacityTrace(undefined, 4).updates, [1.5, 1.5, 2, 2]);
checks.push({ name: 'Capacity fixtures, residual null and no survivor renormalization' });

const load = model.binomialLoad();
close('Complete PMF normalization', model.sum(load.pmf), 1, 5e-12);
close('Binomial tail', load.tail, .4762720970231288, 1e-11);
close('Rejected share', load.rejectedShare, .030516126567745987, 1e-11);
for (const [threshold, capacity] of [[.05, 144], [.01, 151]]) {
  const first = load.pmf.findIndex((_, n) => model.sum(load.pmf.slice(n + 1)) < threshold);
  assert.equal(first, capacity);
  checks.push({ name: `First capacity below tail ${threshold}`, actual: first });
}
close('Worked balance', model.balance([[.6, .3, .1], [.5, .4, .1], [.2, .7, .1], [.1, .2, .7]]).loss, 1.0125);
close('Counterexample', model.balance([[.51, .49], [.51, .49], [.51, .49], [.001, .999]]).loss, .88275);
close('Tied balance surrogate', model.balance([[.5, .5], [.5, .5]]).loss, 1);
assert.deepEqual(model.gradientTerms().total, [0, 0]);
close('Unequal local objective', model.scopeTrace().weightedLocal, 1.7333333333333334);
close('Unequal pooled objective', model.scopeTrace().global.loss, 1.0666666666666667);
close('Group move conserves pooled objective', model.scopeTrace(false, true).global.loss, model.scopeTrace().global.loss);
close('Identical group null', model.scopeTrace(true).weightedLocal, model.scopeTrace(true).global.loss);
const noBias = model.biasReplay(0);
noBias.history.forEach(item => assert.deepEqual(item.bias, [0, 0, 0]));
for (const refinement of [1, 2, 3, 4]) {
  const budget = model.expertBudget(refinement, refinement);
  assert.equal(budget.expertParameters, 5184);
  assert.equal(budget.expertWork, 1728);
}
assert.equal(model.systemsTrace().remote, 3);
assert.equal(model.systemsTrace().bytes, 48);
assert.equal(model.systemsTrace([1, 0, 1, 1]).bytes, 64);
assert.equal(model.systemsTrace(undefined, false, 4, true).bytes, 0);
assert.deepEqual(model.systemsTrace().allocated, [4, 4, 4, 4]);
assert.deepEqual(model.systemsTrace(undefined, false, 1).allocated, [3, 2, 1, 2]);
const nativeSystems = JSON.parse(fs.readFileSync(`${folder}/research/systems-native.json`));
assert.deepEqual(model.systemsTrace().output, nativeSystems.split.output);
assert.deepEqual(model.systemsTrace().inputGradient, nativeSystems.split.input_gradient);
assert.deepEqual(model.systemsTrace([1, 0, 1, 1]).output, nativeSystems.move_E0.output);
assert.deepEqual(model.systemsTrace(undefined, false, 4, true).rankRows, [8, 0]);
checks.push({ name: 'Bias null, refinement budgets, remote traffic and row tiles' });

assert.equal(hash('src/learn/data/moe-training-study.json'), hash(`${folder}/research/study/study.json`));
assert.equal(hash('public/learn-assets/moe-training/model.json'), hash(`${folder}/research/study/model.json`));
const saved = JSON.parse(fs.readFileSync('public/learn-assets/moe-training/model.json'));
let nll = 0;
const counts = [0, 0, 0, 0], mass = [0, 0, 0, 0];
for (let index = 0; index < saved.heldout_targets.length; index++) {
  const prediction = model.savedPrediction(saved, index);
  nll += prediction.nll;
  prediction.routing.ids.forEach(id => counts[id]++);
  prediction.routing.gates.forEach((gate, id) => { mass[id] += gate; });
}
close('Saved model all 1949 held-out NLL sum', nll, saved.reference.nll_sum, 1e-8);
assert.deepEqual(counts, saved.reference.counts);
mass.forEach((value, id) => close(`Saved gate mass E${id}`, value, saved.reference.gate_mass[id], 1e-9));
for (const index of [0, 100, 487, 1948]) {
  const prediction = model.savedPrediction(saved, index);
  const unused = [0, 1, 2, 3].find(id => !prediction.routing.ids.includes(id));
  assert.deepEqual(model.savedPrediction(saved, index, unused).probabilities, prediction.probabilities);
}
checks.push({ name: 'Saved-model native evidence reused; byte-identical assets; four unused-expert null interventions' });
const sourcePaths = [
  'src/learn/data/moe-training-models.js', 'src/learn/data/moe-training-study.json',
  'public/learn-assets/moe-training/model.json', 'scripts/verify-moe-training-models.mjs',
];
fs.writeFileSync(`${folder}/runtime-model-checks.json`, JSON.stringify({
  at: new Date().toISOString(), checks, scientificFits: 0,
  inputs: Object.fromEntries(sourcePaths.map(path => [path, hash(path)])),
}, null, 2));
console.log(`${checks.length} mechanism/inference conditions passed; zero fits.`);
