import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import * as M from '../src/learn/data/rlaif-methods-models.js';

const directory = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const base = 'public/learn/examples/rlaif-methods/observations';
const read = name => JSON.parse(fs.readFileSync(`${base}/${name}-results.json`, 'utf8'));
const checks = [];
function close(name, actual, expected, tolerance = 1e-9) {
  const a = Array.isArray(actual) ? actual.flat(Infinity) : [actual];
  const b = Array.isArray(expected) ? expected.flat(Infinity) : [expected];
  assert.equal(a.length, b.length, name);
  a.forEach((value, index) => {
    if (typeof value === 'number' && Number.isFinite(value)) assert.ok(Math.abs(value - b[index]) <= tolerance, `${name}: ${value} != ${b[index]}`);
    else assert.equal(value, b[index], name);
  });
  checks.push({ name, conditions: a.length, passed: true });
}
close('Conditional option area', M.conditionalMass(.3, .1).conditional, [.75, .25]);
close('Zero option event unknown', M.conditionalMass(0, 0).conditional, null);
close('Invalid mass rejected', M.conditionalMass(.8, .4).valid, false);
close('No excluded mass', M.conditionalMass(.3, .7).conditional, [.3, .7]);
for (const p of [0, .2, .5, .8, 1]) {
  close(`Identity-mapped reciprocal order ${p}`, M.mapOrders(p, 1 - p).target, p);
  close(`No mapped order gap ${p}`, M.mapOrders(p, 1 - p).gap, 0);
}
close('Worked mapping', Object.values(M.mapOrders(.8, .4)), [[.8, .6], .7, .2]);
close('Changed practice mapping', Object.values(M.mapOrders(.65, .2)), [[.65, .8], .725, .15]);
close('Missing choice unknown', M.feedbackStatus('unmapped').target, null);
close('Overbudget choice unknown', M.feedbackStatus('1', true).target, null);
close('Full target distribution', M.softTargets(.8).full, [.8, .2]);
close('Tie is not missing soft feedback', [M.softTargets(.5).hard, M.softTargets(.5).full], [null, [.5, .5]]);
const baselineHead = M.rewardHead();
close('Default scalar reward gap', baselineHead.gap, 0);
close('Common reward bias cancels', M.rewardHead([0], .8).gap, baselineHead.gap);
close('Equal features zero gap', M.rewardHead([.6], .1, [.5], [.5]).gap, 0);
const feedback = read('feedback');
for (const row of feedback.soft_vs_A_only) {
  const actual = M.softBCE(row.target, 0);
  close(`Native soft BCE ${row.target}`, [actual.full, actual.derivative, actual.weighted, actual.weightedDerivative], [row.full_loss, row.full_gradient, row.A_only_weighted_loss, row.A_only_gradient]);
}
for (const q of [0, .1, .25, .5, .8, 1]) for (const logit of [-5, -1, 0, 1, 5]) {
  const epsilon = 1e-5, model = M.softBCE(q, logit);
  const difference = (M.softBCE(q, logit + epsilon).full - M.softBCE(q, logit - epsilon).full) / (2 * epsilon);
  close(`Soft BCE finite difference ${q}/${logit}`, model.derivative, difference, 1e-8);
}
close('Rating expectation and reward', [M.ratings([.1, 0, 0, 0, .2, 0, 0, 0, 0, .7]).expected, M.ratings([.1, 0, 0, 0, .2, 0, 0, 0, 0, .7]).reward], [8.1, 26 / 45]);
close('Empty rating unknown', M.ratings(Array(10).fill(0)), null);
close('Rating endpoints', [M.ratings([1, ...Array(9).fill(0)]).reward, M.ratings([...Array(9).fill(0), 1]).reward], [-1, 1]);
for (const p of [.05, .25, .5, .8, .95]) {
  const model = M.policyVectors(p, [2, 0]);
  close(`Score vector expected ${p}`, model.rewardGradient, [2 * p * (1 - p), -2 * p * (1 - p)]);
  for (const baseline of [-2, 0, 1, 3]) close(`Constant baseline invariant ${p}/${baseline}`, M.policyVectors(p, [2, 0], baseline).rewardGradient, model.rewardGradient);
  close(`Dependent baseline intentionally biased ${p}`, M.policyVectors(p, [2, 0], 0, true).rewardGradient, [0, 0]);
}
close('Default sample vectors', M.policyVectors().samples, [[1.5, -1.5], [0, 0]]);
close('Zero learning rate unchanged', M.analyticalPolicyStep(0).after, M.analyticalPolicyStep(0).before);
const records = read('records'), aligned = M.gather();
close('Native aligned selected values', aligned.aligned.map(Math.log), records.gather.aligned);
close('Native gather log sum', aligned.logSum, records.gather.sum);
close('Aligned and Cartesian counts', [aligned.aligned.length, aligned.cartesian.flat().length], [3, 9]);
for (let row = 0; row < 3; row++) for (let id = 0; id < 4; id++) {
  const targets = [...M.gatherTargets]; targets[row] = id;
  close(`Changed aligned address ${row}/${id}`, M.gather(targets).aligned[row], M.gatherProbabilities[row][id]);
}
close('Empty target score unknown', M.gather([]), null);
for (const p of [0, .2, .5, .9, 1]) for (let count = 1; count <= 8; count++) {
  const score = M.tokenScore(Array(count).fill(p));
  close(`Geometric repetition ${p}/${count}`, score.geometric, p);
  close(`Whole-string product ${p}/${count}`, score.product, p ** count);
}
close('Response masks preserve real EOS', M.packedTokens(2, 2, 2, true).count, 3);
close('Empty response no score', M.packedTokens(2, 0, 2).count, 0);
close('Padding invariance', M.packedTokens(2, 2, 0).count, M.packedTokens(2, 2, 4).count);
close('Four-score default', [M.gains().h, M.gains().scaled], [1.5, .75]);
for (const tau of [.1, .25, .5, 1, 2]) for (const h of [-2, 0, .4, 1, 4, 8]) {
  const epsilon = 1e-5, actual = M.preferenceLoss(h, tau);
  close(`IPO derivative ${h}/${tau}`, actual.IPODerivative, (M.preferenceLoss(h + epsilon, tau).IPO - M.preferenceLoss(h - epsilon, tau).IPO) / (2 * epsilon), 1e-7);
  close(`IPO prefactor target ${h}/${tau}`, M.preferenceLoss(h, tau, .5, true).target, actual.target);
  close(`DPO coordinate bound ${h}/${tau}`, actual.DPODerivative >= -.5 && actual.DPODerivative <= 0, true);
}
const finite = read('finite');
close('Native contradictory optimum/minimum', [M.contradictory().optimum, M.contradictory().minimum], [finite.noisy.optimum_h, finite.noisy.minimum_loss]);
close('Zero comparisons unknown', M.contradictory(0, 0), null);
close('Equal contradictory counts zero optimum', M.contradictory(5, 5).optimum, 0);
close('Published matrix exact', M.publishedMatrix, finite.published_four_action.matrix);
close('Published identity averages', M.tilt().scores, finite.published_four_action.identity_row_means);
close('Published identity optimum', M.tilt().policy, finite.published_four_action.policy);
close('Tilt common offset invariant', M.tilt(M.publishedMatrix, [.25,.25,.25,.25], [.25,.25,.25,.25], .1, 'identity', 100).policy, M.tilt().policy);
close('Zero reference excluded', M.tilt(M.publishedMatrix, [.25,.25,.25,.25], [0,1,1,1]).policy[0], 0);
for (const mass of [.05, .3, .9, 1]) {
  const result = M.supportFamily(mass);
  close(`Missing-support same observed h ${mass}`, result.h, 1);
  close(`Missing-support normalized ${mass}`, M.sum(result.policy), 1);
}
close('Connected comparison exact constraints', [M.supportFamily(.3, true).h, M.supportFamily(.3, true).AC], [1, 1]);
close('Empty support unknown', M.supportFamily(.3, false, true).policy, null);
close('Default ORPO contrast', [M.oddsContrast(Math.sqrt(.4), .5).margin, M.oddsContrast(Math.sqrt(.4), .5).loss], [.5427657202593361, .45814536593707755], 2e-6);
close('Equal geometric scores contrast log2', M.oddsContrast(.5, .5).loss, Math.log(2));
close('Odds exact boundary unknown', M.oddsContrast(1, .5).valid, false);
close('Zero geometric chosen limiting loss', M.oddsContrast(0, .5).loss, Infinity);
for (const logP of [-100, -1, -.1, -1e-9]) close(`Stable log1mexp ${logP}`, Math.exp(M.log1mexp(logP)), -Math.expm1(logP));
for (const lambda of [0, .1, .5, 1]) for (const xB of [-1, 1, 3]) for (const theta of [-1, 0, 1]) {
  const model = M.sharedWeight(theta, 1, xB, lambda);
  const loss = value => M.softplus(-value) + lambda * M.softplus(-value * (1 - xB));
  const epsilon = 1e-5;
  close(`Shared weight finite difference ${theta}/${xB}/${lambda}`, model.total, (loss(theta + epsilon) - loss(theta - epsilon)) / (2 * epsilon), 1e-8);
}
close('Shared cancellation update', [M.sharedWeight(0,1,3,.1).after, M.sharedWeight(0,1,3,.5).after, M.sharedWeight(0,1,3,1).after], [.004, 0, -.005]);
close('Zero updates no policy/cache work', [M.workCounts(6,20,30,0).sequences, M.workCounts(6,20,30,0).referenceSequences], [0,0]);
close('Cache online and total reference distinct', [M.workCounts().onlineReferenceSequences, M.workCounts().referenceSequences], [0,12]);
const training = read('training');
for (const seed of training.seeds) for (const [name, arm] of Object.entries(seed.methods)) {
  close(`Same warm state ${seed.seed}/${name}`, arm.start_state_sha256, seed.warm_state_sha256);
  close(`Same step0 state ${seed.seed}/${name}`, arm.checkpoints[0].state_sha256, seed.warm_state_sha256);
  close(`All held-out IDs paired ${seed.seed}/${name}`, arm.checkpoints.at(-1).heldout.records.map(row => row.id), records.rows.heldout.map(row => row.id));
  close(`Terminal observed NLL finite ${seed.seed}/${name}`, Number.isFinite(arm.checkpoints.at(-1).heldout.token_weighted_chosen_NLL), true);
}
const source = fs.readFileSync('src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx', 'utf8');
const names = [...source.matchAll(/export function (\w+)\(/g)].map(match => match[1]).filter(name => name !== 'RLAIFScroll' && name !== 'RLAIFTable');
close('All35 actual figure exports', names.length, 35);
const bundled = await build({ stdin: { contents: `import React from 'react';import {renderToString} from 'react-dom/server';import * as figures from './src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx';export const html=${JSON.stringify(names)}.map(name=>renderToString(React.createElement(figures[name])));`, resolveDir: process.cwd(), loader: 'jsx' }, write: false, bundle: true, format: 'cjs', platform: 'node', jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react-dom/server'] });
const require = createRequire(import.meta.url), module = { exports: {} }, warnings = [], originalError = console.error;
console.error = (...args) => warnings.push(args.join(' '));
try { new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(require, module, module.exports); } finally { console.error = originalError; }
close('No React server markup warnings', warnings.length, 0);
module.exports.html.forEach((html, i) => close(`Server figure address ${names[i]}`, html.includes(`D${String(i + 1).padStart(2, '0')}`), true));
const sourceFiles = ['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx', 'src/learn/components/lesson-labs/rlaif-methods-flow.css', 'src/learn/data/rlaif-methods-models.js', `${directory}/lesson.jsx`, `${directory}/lesson.md`, `${directory}/content-successor/inputs.json`, ...['feedback','loop','judge','records','training','native','finite','losses'].map(name => `${base}/${name}-results.json`)];
const receipt = { passed: true, at: new Date().toISOString(), fits: 0, inference: 0, assertions: checks.length, scalarConditions: checks.reduce((total, row) => total + row.conditions, 0), sourceFiles: sourceFiles.map(path => ({ path, sha256: crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex') })), checks };
fs.writeFileSync(`${directory}/runtime-model-checks.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, assertions: receipt.assertions, conditions: receipt.scalarConditions, fits: 0, inference: 0 }));
