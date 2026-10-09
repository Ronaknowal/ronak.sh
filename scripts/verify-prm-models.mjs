import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import * as M from '../src/learn/data/prm-models.js';

const directory = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const fixture = read(`${directory}/runtime-parity-fixture.json`);
const observations = read('public/learn-data/process-reward-models/observations.json');
const model = read('public/learn-code/process-reward-models/study/model.json');
const checks = [];
function close(name, actual, expected) {
  const a = Array.isArray(actual) ? actual.flat(Infinity) : [actual];
  const b = Array.isArray(expected) ? expected.flat(Infinity) : [expected];
  assert.equal(a.length, b.length, name);
  a.forEach((value, index) => {
    if (typeof value === 'number' && Number.isFinite(value)) assert.ok(Math.abs(value - b[index]) < 1e-9, `${name}: ${value} != ${b[index]}`);
    else assert.equal(value, b[index], name);
  });
  checks.push({ name, conditions: a.length, passed: true });
}
for (const [index, entry] of fixture.lexemes.entries()) {
  const result = await M.signedFeatures(entry.text);
  close(`Unicode lexical identity ${index}`, M.lexemes(entry.text), entry.tokens);
  close(`Unicode signed feature ${index}`, result.vector.flatMap((value, i) => value ? [[i, value]] : []), entry.nonzero);
}
for (const [index, row] of fixture.heldout.entries()) {
  const result = await M.inspect(model, row.example);
  close(`Held-out complete feature vector ${index}`, result.x.flatMap((value, i) => value ? [[i, value]] : []), row.nonzero);
  close(`Held-out complete fixed-model probabilities ${index}`, result.probabilities, row.probabilities);
}
for (const row of fixture.ranking) {
  const method = row.vote_weight_convention === 'relative_product_mass' ? 'log_product' : row.vote_weight_convention;
  const result = M.rankPool(row.requested_candidates, method);
  close(`Ranking identities ${method}/${row.requested_candidates}`, result.ordered.map(item => item.id), row.ordered.map(item => item.id));
  close(`Voting masses ${method}/${row.requested_candidates}`, result.answerWeights.map(([, weight]) => weight), Object.values(row.answer_weights));
  close(`Voting winner ${method}/${row.requested_candidates}`, result.weightedVote, row.weighted_vote);
}
for (const row of fixture.beam) {
  const result = M.beam(row.width, row.depth_budget, row.score_family);
  close(`Beam selected ${row.width}/${row.depth_budget}/${row.score_family}`, result.selected?.node.id || null, row.selected?.node || null);
  close(`Beam count ${row.width}/${row.depth_budget}/${row.score_family}`, result.scored, row.generated_scored_nodes);
  close(`Beam retained ancestry ${row.width}/${row.depth_budget}/${row.score_family}`, result.layers.map(layer => layer.kept), row.layers.map(layer => layer.kept));
}
for (const [index, row] of fixture.policies.entries()) {
  const baseline = index % 2 === 1;
  const result = M.policy(row.q, row.p_a, row.p_b, baseline);
  close(`Policy expectation ${index}`, [result.expected, ...result.gradient], [row.expected_return, ...row.gradient]);
  close(`All policy leaf contributions ${index}`, result.leaves.map(leaf => [leaf.mass, ...leaf.score, ...leaf.credit, ...leaf.contribution]), row.leaves.map(leaf => [leaf.mass, ...leaf.score_derivatives, ...leaf.credit, ...leaf.expected_contribution]));
}
for (const row of fixture.binomial) {
  const result = M.binomial(row.value, row.budget);
  close(`Binomial mass ${row.value}/${row.budget}`, result.distribution, row.output.distribution);
  close(`Binomial moments ${row.value}/${row.budget}`, [result.hard, result.mean, result.variance], [row.output.hard_positive_probability, row.output.soft_expectation, row.output.soft_variance]);
}
close('Default reductions', Object.values(M.reductions([[4], [1, 1, 1]], [[1], [1, 1, 1]])), [4, 2, 1.75, 2.5]);
close('No eligible loss', [M.reductions([[4]], [[0]]).boundary, M.reductions([[4]], [[0]]).trajectory], [null, null]);
close('Binary worked loss and gradient', [M.binary(Math.log(4), 0).loss, M.binary(Math.log(4), 0).derivative], [Math.log(5), .8]);
close('Binary exact endpoint semantics', [M.binary(Infinity, 1).loss, M.binary(-Infinity, 0).loss, M.binary(Infinity, 0).loss, M.binary(-Infinity, 1).loss], [0, 0, Infinity, Infinity]);
close('Masked exact endpoint', [M.binary(Infinity, 0, false).loss, M.binary(Infinity, 0, false).derivative], [null, null]);
const shape = M.shaping([.2, .5, .9, 0], .9);
close('Discounted shaping including terminal', [shape.sum, shape.telescoped, shape.omitted, ...shape.weighted], [-.2, -.2, .529, .25, .279, -.729]);
for (const gamma of [0, .5, .9, 1]) for (const terminal of [0, .2, 1]) {
  const result = M.shaping([.2, .5, .9, terminal], gamma);
  close(`Telescoping changed ${gamma}/${terminal}`, result.sum, result.telescoped);
}
close('Earliest missing stays unknown', M.firstError([.9, null, .1], .5), null);
close('Harmonic separate denominators', M.localization([0, 1, 2, -1, -1, -1, 0], [0, 1, 2, 3, -1, -1, -1]).h, 12 / 17);
close('Absent group stays unknown', M.localization([-1], [-1]).h, null);
const collision = observations.collision;
close('Concrete collision signed vectors', (await M.signedFeatures(collision.words[0])).vector, (await M.signedFeatures(collision.words[1])).vector);
close('Order loss signed vectors', (await M.signedFeatures('a b')).vector, (await M.signedFeatures('b a')).vector);
const require = createRequire(import.meta.url);
const componentSource = fs.readFileSync('src/learn/components/lesson-labs/PRMFlow.jsx', 'utf8');
const names = [...componentSource.matchAll(/export function (PRM\w+)\(/g)].map(match => match[1]).filter(name => name !== 'PRMTable');
close('29 exact figure exports', names.length, 29);
const result = await build({ stdin: { contents: `import React from 'react';import {renderToString} from 'react-dom/server';import * as figures from './src/learn/components/lesson-labs/PRMFlow.jsx';export const html=${JSON.stringify(names)}.map(name=>renderToString(React.createElement(figures[name])));`, resolveDir: process.cwd(), loader: 'jsx' }, write: false, bundle: true, format: 'cjs', platform: 'node', jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react-dom/server'] });
const mod = { exports: {} };
const warnings = [];
const previousError = console.error;
console.error = (...args) => warnings.push(args.join(' '));
try { new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports); } finally { console.error = previousError; }
close('No React markup warnings', warnings.length, 0);
mod.exports.html.forEach((html, i) => assert.ok(html.includes(`D${String(i + 1).padStart(2, '0')}`), names[i]));
const sourceFiles = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', `${directory}/lesson.jsx`, `${directory}/lesson.md`, `${directory}/runtime-parity-fixture.json`, 'public/learn-data/process-reward-models/observations.json'];
const receipt = { passed: true, at: new Date().toISOString(), fits: 0, wholeHeldoutExamples: fixture.heldout.length, assertions: checks.length, scalarConditions: checks.reduce((sum, item) => sum + item.conditions, 0), sourceFiles: sourceFiles.map(path => ({ path, sha256: crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex') })), checks };
fs.writeFileSync(`${directory}/runtime-model-checks.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, assertions: receipt.assertions, scalarConditions: receipt.scalarConditions, heldout: fixture.heldout.length, fits: 0 }));
