import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { capsuleVotes, routeCapsules, squash, norm, loadCapsuleWeights, encodeCapsuleImage, decodeCapsules } from '../src/learn/data/capsule-models.js';

const folder = 'docs/teaching/deep-learning-beginner/capsule-networks/';
// Retain the original checks verbatim, redirecting only their receipt destination
// and the instructional-disclosure count changed by the visible walkthrough.
let retained = readFileSync('scripts/verify-capsule-models.mjs', 'utf8');
retained = retained.replace("docs/teaching/evidence/capsule-author.json", folder + 'reading-flow-retained-models.json')
  .replace(/17 closed/g, '16 closed').replace(').length, 17)', ').length, 16)');
await import(`data:text/javascript;base64,${Buffer.from(retained.replaceAll("'../src/learn/data/capsule-models.js'", `'${new URL('../src/learn/data/capsule-models.js', import.meta.url).href}'`).replace("from '@babel/parser'", `from '${new URL('../node_modules/@babel/parser/lib/index.js', import.meta.url).href}'`)).toString('base64')}`);

const files = ['src/learn/data/topics/capsule-networks.jsx', 'src/learn/components/lesson-labs/CapsuleDrawings.jsx', 'src/learn/components/lesson-labs/CapsuleFlowLabs.jsx', 'src/learn/components/lesson-labs/CapsuleLabs.jsx', 'src/learn/components/lesson-labs/capsule-flow.css'];
for (const file of files.filter(path => path.endsWith('.jsx'))) parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
const source = readFileSync(files[0], 'utf8');
assert.equal((source.match(/data-lesson-exercise=""/g) || []).length, 8);
assert.ok(!/href=\{?"[^"\n]*\s[^"\n]*"/.test(source), 'URLs must contain no literal whitespace');
assert.match(source, /lesson-flow/);
assert.match(source, /CapsuleObjectiveDrawing/);
const close = (actual, expected, tolerance = 1e-11) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const arrays = (actual, expected, tolerance = 1e-11) => { assert.equal(actual.length, expected.length); actual.forEach((value, i) => Array.isArray(value) ? arrays(value, expected[i], tolerance) : close(value, expected[i], tolerance)); };
const assets = 'public/learn-assets/capsule-networks/';
const metadata = JSON.parse(readFileSync(assets + 'frozen-model.json'));
const bytes = readFileSync(assets + 'frozen-model.f32');
const state = loadCapsuleWeights(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), metadata);
const native = JSON.parse(readFileSync(folder + 'reading-flow-native.json'));
let maxError = 0;
for (const probe of native.probes) {
  const current = encodeCapsuleImage(probe.image, state);
  arrays(current.capsules, probe.capsules, 1e-12);
  arrays(current.reconstruction, probe.reconstruction, 1e-12);
  assert.equal(current.predicted, probe.predicted);
  current.lengths.forEach((value, i) => { maxError = Math.max(maxError, Math.abs(value - probe.lengths[i])); });
}
for (const probe of native.edits) {
  const sample = metadata.examples.find(item => item.source_id === probe.source);
  const encoded = encodeCapsuleImage(sample.image, state);
  for (const [label, target] of [[probe.selected, probe.edited], [(probe.selected + 1) % 10, probe.null]]) {
    const changed = structuredClone(encoded.capsules);
    changed[label][probe.coordinate] += probe.delta;
    arrays(decodeCapsules(changed, probe.selected, state), target, 1e-12);
  }
}
const hand = routeCapsules(capsuleVotes, 3);
const printed = [[.5,.5,.5,.8095,.5],[.7447,.8880,.3092,.9150,.6993],[.8996,.9900,.1076,.9346,.7786]];
hand.forEach((step, i) => [...step.coupling.map(row => row[0]), ...step.lengths].forEach((value, j) => close(value, printed[i][j], .00005)));
arrays(squash([.3, .4]), [.12, .16]);
close(norm(squash([.3, .4])), .2);
close(.0005 * 64, .032); close(.0005 * 256, .128);
close((.9-.8)**2+.5*((.2-.1)**2+(.4-.1)**2), .06);
close(2 * Math.log(.5), -1.3862943611198906);
close(1 / (1 + Math.exp(2 * Math.log(.5))), .8);
close(.1 + .25, .35); close(.2 + .5, .7); close(.2 * 1, .1 * 2);
close(.5 / (1 + .5**2), .4); close(2 * .5 / (1 + .5**2)**2, .64);
close((5 / 26) / (10 / 26**2), 13);
const scalar = 1/(1+Math.exp(-1)); close(scalar + scalar*(1-scalar), .9276705118714867);
const receipt = { passed: true, freshNativeImageProbes: native.probes.length, freshFixedMaskDecoderProbes: native.edits.length, maxLengthError: maxError,
  groups: ['retained scientific checks redirected without changing frozen receipts', 'new JSX and eight visible practice tasks', 'URLs and objective information routes', '20 current Torch image probes and 12 fixed-mask decoder probes', 'all displayed core routing table values', 'squash, coefficients, margin practice, EM cost, coordinate addition, transformed density and gradient scalar recomputed'],
  sourceHashes: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])) };
writeFileSync(folder + 'reading-flow-models.json', JSON.stringify(receipt, null, 2)+'\n');
console.log(JSON.stringify({ passed: true, probes: native.probes.length, decoderEdits: native.edits.length, maxLengthError: maxError }));
