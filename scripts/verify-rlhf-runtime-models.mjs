import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as model from '../src/learn/data/rlhf-models.js';
import { observations, observationSources } from '../src/learn/data/rlhf-observations.js';

const owner = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const output = process.env.RLHF_MODEL_OUTPUT || `${owner}/runtime-model-checks-final.json`;
if (fs.existsSync(output)) throw new Error('Preserve the existing receipt and choose an explicit successor output.');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const checks = [];
function ok(condition, label) { assert.ok(condition, label); checks.push(label); }
function near(actual, expected, label, tolerance = 1e-9) {
  ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
}
const acceptance = read(`${owner}/content-acceptance.json`);
for (const [file, expected] of Object.entries(acceptance.bindings)) ok(hash(file) === expected, `Frozen content ${file}`);
for (const [file, expected] of Object.entries(observationSources)) ok(hash(`public/learn/examples/rlhf/${file}`) === expected, `Retained observations ${file}`);
const baseline = model.head();
near(baseline.probability, .6456563062257954, 'head probability');
for (let coordinate = 0; coordinate < 2; coordinate++) {
  const epsilon = 1e-5;
  const weights = [.4, -.2];
  const plus = weights.slice(), minus = weights.slice();
  plus[coordinate] += epsilon;
  minus[coordinate] -= epsilon;
  near((model.head(plus).loss - model.head(minus).loss) / (2 * epsilon), baseline.gradient[coordinate], `head derivative ${coordinate}`);
}
near(model.head([.4, -.2], baseline.probability).gradient[0], 0, 'target equals prediction null');
const identical = model.head([.4, -.2], 1, 0, 1, true);
near(identical.gap, 0, 'identical features give equal scores');
ok(identical.gradient.every((value) => value === 0), 'identical features give no pair gradient');
for (const shift of [-100, 0, 100]) near(model.head([.4, -.2], 1, shift).gap, .6, 'common offset cancels');
const terms = model.referenceTerms();
ok(terms.contributions[1] < 0 && terms.kl > 0, 'negative component with nonnegative exact KL');
near(model.referenceTerms([.4, .4, .2]).kl, 0, 'reference equality');
ok(!model.referenceTerms([.6, .3, .1], [.5, .5, 0]).valid, 'zero support invalidates finite KL');
ok(!model.referenceTerms([.8, .5, -.3]).valid, 'invalid simplex diagnosed');
for (const beta of [.05, .5, 3]) {
  const a = model.tilted([.4, .4, .2], [1, .4, -.2], beta);
  const b = model.tilted([.4, .4, .2], [3, 2.4, 1.8], beta);
  const c = model.tilted([.4, .4, .2], [2, .8, -.4], beta * 2);
  near(model.sum(a.policy), 1, 'tilt normalized');
  for (let i = 0; i < 3; i++) { near(a.policy[i], b.policy[i], 'tilt shift invariant'); near(a.policy[i], c.policy[i], 'tilt coscale invariant'); }
}
assert.deepEqual(model.tilted([.4, .6, 0], [0, 0, 100], .1).policy, [.4, .6, 0]);
checks.push('unsupported large reward remains unsupported');
for (const p of [.05, .25, .5, .95]) for (const baseline of [-2, 0, 1.5, 4]) {
  const state = model.estimator(p, baseline);
  state.mean.forEach((value, i) => near(value, state.exact[i], 'state-only baseline unbiased'));
  ok(state.variance.every((value) => value >= 0), 'exact estimator variance nonnegative');
}
near(model.estimator(.25, 1.5).variance[0], 0, 'specified exact zero variance baseline');
near(model.estimator(.25, 0, true).mean[0], 0, 'action-dependent reward baseline erases signal');
near(model.path().probability, .48, 'conditional token product');
near(model.path().logProbability, Math.log(.48), 'conditional log sum');
for (let prompt = 1; prompt <= 4; prompt++) for (let actions = 0; actions <= 4; actions++) {
  const state = model.tokenMask(prompt, actions, true);
  near(model.sum(state.target), actions, 'response target count');
  near(model.sum(state.predictor), actions, 'causal predictor count');
  for (let j = 0; j < state.tokens.length - 1; j++) near(state.predictor[j], state.target[j + 1], 'single causal shift');
  ok(state.attention.slice(-2).every((value) => value === 0), 'PAD EOS identity excluded by position');
}
for (const beta of [0, .1, 1]) for (const equal of [false, true]) {
  const state = model.shaped(beta, equal);
  near(model.sum(state.rewards), 1.3 - beta * model.sum(state.logRatio), 'trajectory reward identity');
}
for (const lambda of [0, .2, .8, 1]) for (const bootstrap of [0, .8]) {
  const state = model.gae(undefined, undefined, lambda, 1, bootstrap);
  for (let t = 0; t < 3; t++) near(state.advantages[t], model.sum(state.residuals.slice(t).map((delta, j) => lambda ** j * delta)), 'GAE independent expansion');
}
model.gae().advantages.forEach((value, i) => near(value, [.368, .46, .7][i], 'manuscript GAE fixture'));
assert.deepEqual(model.normalization(100).normalized, model.normalization(-1000).normalized);
checks.push('PAD filler invariance');
ok(model.normalization(2, true).normalized.flat().every((value) => value === 0), 'constant advantages null');
ok(model.normalization(2, false, true).mean === null, 'no action mean undefined');
const categorical = read('public/learn/examples/rlhf/observations/categorical.json');
for (const row of categorical.ppo_cases) near(model.clip(row.ratio, row.advantage).surrogate, row.surrogate, 'retained native clipping case');
for (const advantage of [-2, 0, 2]) for (const ratio of [.2, .7, 1, 1.4, 1.8]) {
  const state = model.clip(ratio, advantage);
  near((model.clip(ratio + 1e-5, advantage).surrogate - model.clip(ratio - 1e-5, advantage).surrogate) / 2e-5, state.slope, 'surrogate derivative');
}
const witness = model.sharedParameter();
near(witness.next, observations.sharedWitness.theta_after, 'actual native shared-parameter witness');
near(witness.afterRatios[0], observations.sharedWitness.ratio1_after, 'plateau can move through another gradient');
near(model.sharedParameter(0).next, .7, 'zero step null');
for (let seed = 0; seed < 100; seed++) ok(model.splitFamilies(seed).overlap === 0, 'whole groups never overlap');
near(model.splitFamilies(31, true).overlap, 8, 'row leakage witness');
const bins = model.calibration(observations.heldoutPredictions);
for (let i = 0; i < bins.length; i++) {
  near(bins[i].count, observations.probabilityBins[i].oriented_count, 'retained oriented calibration count');
  if (bins[i].count) {
    near(bins[i].confidence, observations.probabilityBins[i].mean_probability, 'retained calibration confidence');
    near(bins[i].frequency, observations.probabilityBins[i].label_fraction, 'retained calibration fraction');
  } else ok(bins[i].confidence === null && bins[i].frequency === null, 'empty bins stay undefined');
}
const policy = read('public/learn/examples/rlhf/observations/token_ppo.json');
assert.deepEqual(observations.firstRollout, policy.first_rollout);
assert.deepEqual(observations.evaluations, policy.evaluations);
checks.push('all first-rollout tensors and all 160 literal evaluation outputs conserved');
near(model.tilted([1 / 3, 1 / 3, 1 / 3], [1, 1, 2], .5).policy[0], 1 / (2 + Math.exp(2)), 'proxy-conflict exact criterion');
near(model.work().collection, 96, '96 generated actions');
near(model.work().actorValueUpdate, 384, '384 update positions');
near(model.work(16, 6, 0).actorValueUpdate, 0, 'zero epochs null');
for (let step = 0; step < 10; step++) {
  const clock = model.timeline(step);
  near(clock.referenceLogp, Math.log(.5), 'reference unchanged across collections');
  near(clock.oldLogp, model.timeline(Math.floor(step / 5) * 5).oldLogp, 'old snapshot unchanged in inner loop');
  near(clock.ratio, Math.exp(clock.currentLogp - clock.oldLogp), 'clock ratio uses fixed collection snapshot');
  if (step % 5 === 0) near(clock.ratio, 1, 'new collection starts at ratio one');
}
const files = ['scripts/verify-rlhf-runtime-models.mjs', 'src/learn/data/rlhf-models.js', 'src/learn/data/rlhf-observations.js', 'src/learn/components/lesson-labs/RLHFFlow.jsx', 'src/learn/components/lesson-labs/rlhf-flow.css'];
fs.writeFileSync(output, JSON.stringify({ status: 'passed', checks: checks.length, details: checks,
  sourceHashes: Object.fromEntries(files.map((file) => [file, hash(file)])),
  scope: 'Current pure browser mechanisms and retained native/scientific evidence; no fits repeated and no paint acceptance.' }, null, 2) + '\n');
console.log('Passed', checks.length, 'runtime model conditions; zero fits');
