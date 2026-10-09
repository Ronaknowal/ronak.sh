import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as flow from '../src/learn/data/titans-reading-flow-models.js';
import { neuralOuterRate } from '../src/learn/data/titans-memory-models.js';
let count = 0;
function close(actual, expected, tolerance = 1e-10) { if (Array.isArray(expected)) { assert.equal(actual.length, expected.length); actual.forEach((value, i) => close(value, expected[i], tolerance)); } else assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`); count++; }
let c = flow.associativeDefault(), a = flow.associativeCase(c); close(a.weight, [[1, 0]]); close(a.readAfter, 1);
c.cards[1].key = [1, 1]; close(flow.associativeCase(c).readAfter, 2.5);
c.cards[1] = { key: [0, 1], value: 0 }; c.retention = .5; a = flow.associativeCase(c); close(a.preview.gradient, [[0, 0]]); close(a.preview.momentum, [[.5, 0]]); close(a.preview.weight, [[1.5, 0]]);
c.decay = 1; close(flow.associativeCase(c).preview.weight, [[.5, 0]]);
c = flow.associativeDefault(); c.cards[0] = { key: [2, 2], value: 5 }; c.events = Array(12).fill(0); c.next = 0; a = flow.associativeCase(c); close(a.weight, [[-664300, -664300]]); close(a.preview.weight, [[1992905, 1992905]]);
close(flow.nonlinearCase().read.output, .4446655100869954); close(flow.nonlinearCase(-1).read.output, -.35533448991300465); close(flow.nonlinearCase(0).read.output, 0); close(flow.nonlinearCase(1, 0).otherAfter.output, flow.nonlinearCase().otherBefore.output);
const p = flow.projectionCase(); close(p.branches.map(b => b.convolved), [[.75, 1], [2, 0], [1.5, .5]]); close(p.branches[0].unit, [.6, .8]); close(p.wrong, [1.25, .25]);
for (let length = 4; length <= 8; length++) { const c = flow.gatedDefault(); while (c.tokens.length < length) c.tokens.push([.5, -.5]); for (let split = 1; split < length; split++) { c.split = split; for (let selected = 0; selected < length; selected++) { c.selected = selected; close(flow.gatedCase(c).difference, 0); } } }
const g = flow.gatedDefault(); g.writes = false; close(flow.gatedCase(g).full.outputs, Array(4).fill([0, 0]));
for (const initial of [-3, 0, 1, 3]) for (const targets of [[1, 2], [3, -1], [-5, 5]]) { const c = { targets, initial, rate: .25, size: 1, selected: 1 }; const m = flow.chunkCase(c); close(m.sequential[1].weight, m.anchor[1].weight); c.rate = 0; c.size = 2; close(flow.chunkCase(c).anchor[1].weight, initial); }
const outer = neuralOuterRate(flow.titansStudy.outerInitial, [1, -.5], .8, [-.25, .75], -.3, .1); close(outer.derivative, -.00249327930752, 1e-13);
const rentals = [];
for (const seed of [3, 7, 19]) { const s = JSON.parse(fs.readFileSync(`public/learn-assets/titans-multi-memory-architecture/rental-seed-${seed}.json`)); const anatomy = flow.rentalAnatomy(s, 365); close(Math.hypot(...anatomy.key), 1); if (seed === 3) close(anatomy.output, 2609.6164011671567, 1e-7); const baseline = flow.rentalCase(s, 548, flow.titansStudy.counts[548]), changed = flow.rentalCase(s, 548, flow.titansStudy.counts[548] + 1000); assert.equal(baseline.firstAffected, null); assert.equal(changed.firstAffected, 549); assert.equal(changed.invalidIndex, null); count += 3; for (let i = 0; i <= 183; i++) close(changed.edited.trace[i].adaptive, changed.baseline.trace[i].adaptive); rentals.push({ seed, first: anatomy.output, changedFirst: changed.firstAffected }); }
fs.writeFileSync('docs/teaching/deep-learning-beginner/titans-multi-memory-architecture/reading-flow-model-checks.json', JSON.stringify({ purpose: 'New constructed model and existing immutable-fit replay checks; no fitting', assertions: count, rentals }, null, 2)+'\n');
console.log(JSON.stringify({ assertions: count, seeds: rentals.length, fits: 0 }));
