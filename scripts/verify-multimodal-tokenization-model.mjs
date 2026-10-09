import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import * as m from '../src/learn/data/multimodal-tokenization-models.js';
import { parse } from '@babel/parser';

const root = process.cwd();
const owner = 'docs/teaching/tokenization/multimodal-tokenization-visual-audio-video/';
const receiptArg = process.argv.indexOf('--receipt');
const receipt = receiptArg < 0 ? `${owner}model-evidence.json` : process.argv[receiptArg + 1];
if (!receipt || fs.existsSync(receipt)) throw new Error('Use a fresh receipt path; passed evidence is not overwritten.');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let checks = 0;
const same = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const near = (actual, expected, tolerance = 1e-12) => { assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`); checks++; };
const rejects = fn => { assert.throws(fn, RangeError); checks++; };

// Independent nested slicing of the image; reconstruction does not call patchImage.
for (const side of [1, 2, 4]) {
  const result = m.patchImage(m.INITIAL_PIXELS, side);
  const reference = [];
  for (let row = 0; row < 4; row += side) for (let col = 0; col < 4; col += side) {
    const values = [];
    for (let y = row; y < row + side; y++) values.push(...m.INITIAL_PIXELS.slice(y * 4 + col, y * 4 + col + side));
    reference.push(values);
  }
  same(result.patches.map(p => p.values), reference);
  same(result.count, (4 / side) ** 2);
  const restored = [];
  result.patches.forEach(p => p.values.forEach((v, i) => { restored[(p.row + Math.floor(i / side)) * 4 + p.column + i % side] = v; }));
  same(restored, [...m.INITIAL_PIXELS]);
}
same(m.patchImage(m.INITIAL_PIXELS).patches[0].projected, [0, 2]);
const edited = [...m.INITIAL_PIXELS]; edited[0] = 1;
same(m.patchImage(edited).patches[0].projected, [1, 2]);
rejects(() => m.patchImage(m.INITIAL_PIXELS, 3));

// Enumerated direct Euclidean reference on all offered slider coordinates.
for (let xi = -15; xi <= 15; xi++) for (let yi = -15; yi <= 15; yi++) {
  const point = [xi / 10, yi / 10];
  const sorted = m.CODEBOOK.map((v, i) => ({ i, distance: Math.hypot(point[0] - v[0], point[1] - v[1]) })).sort((a, b) => a.distance - b.distance || a.i - b.i);
  const actual = m.nearestCode(point);
  same(actual.index, sorted[0].i);
  near(actual.distance, sorted[0].distance ** 2);
}
same(m.nearestCode([0, 0]).index, 0);
same(m.nearestCode([.8, .6]).index, 3);
near(m.nearestCode([.8, .6]).distance, .2);
near(m.nearestCode([-.8, .7]).distance, .13);
near(m.nearestCode([-.7, .7]).distance, .18);
const rvq = m.residualQuantize();
rvq.stages.forEach((stage, i) => near(stage.error, [.2, .1, .025][i]));
same(rvq.sum, [.75, .75]);
near(m.residualQuantize([.8, .6], 0).error, 1);
near(m.nearestCode([.1, 0], [[1, 0]]).distance, .81);
rejects(() => m.residualQuantize([1, 2], 4));

for (const order of ['time', 'level']) {
  const stream = m.orderAudio(m.AUDIO_MATRIX, order);
  const recovered = Array.from({ length: 2 }, () => Array(3));
  stream.forEach(cell => { recovered[cell.level][cell.frame] = cell.id; });
  same(recovered, m.AUDIO_MATRIX);
  same(stream.length, 6);
}
same(m.orderAudio([], 'time'), []);
same(['text', 'image', 'audio0', 'audio1'].map(n => m.namespaceId(n, 3)), [3, 11, 15, 19]);
rejects(() => m.namespaceId('constructor', 0));
rejects(() => m.namespaceId('image', 4));
same(m.PACKED_EXAMPLE.alignedLabels.slice(1).concat(-100), m.PACKED_EXAMPLE.nextTargets);
same(m.sampleVideo(1).times, [0, 1]); same(m.sampleVideo(1).retained, false);
same(m.sampleVideo(4).times, [0, .25, .5, .75, 1, 1.25, 1.5, 1.75]);
same(m.sampleVideo(4).hitTimes, [.5]); same(m.sampleVideo(4, 0).times, []);
same(m.tubeletCount(), 8); same(m.tubeletCount(4, 4, 4, 1, 2), 16);
rejects(() => m.tubeletCount(5, 4, 4, 2, 2));
const budget = m.inputBudget(); same([budget.audio, budget.total, budget.remaining], [1200, 1240, 808]);
same(m.inputBudget(0).total, 40); same(m.inputBudget(10, 16).overBudget, true);
same(m.kvCacheBytes(1240) / 2 ** 20, 155); same(m.kvCacheBytes(1240, 32, 32) / 2 ** 20, 620);
near(m.usageStatistics().entropy, 1.5); near(m.usageStatistics().perplexity, Math.sqrt(8));
same(m.usageStatistics([0, 0]).entropy, null);
same((224 / 16) ** 2, 196); same((196 / 49) ** 2, 16);
same(24000 / 320 * 8 * Math.log2(1024), 6000);
same(320 / 16 * (192 / 16), 240); same(320 / 8 * (192 / 8), 960);
same(2 * .25 * (.8 - 1) + 2, 1.9); near(.8 - .1 * 1.9, .61); near(1 - .1 * .4, .96);
same(.5 * 2 + .5 * 2, 2); same((.5 * 2 + .5 * 0) / 2, .5); same(2 + 3 * 1, 5);

const manuscriptPath = 'src/learn/data/topics/multimodal-tokenization.jsx';
const source = fs.readFileSync(manuscriptPath, 'utf8');
parse(source, { sourceType: 'module', plugins: ['jsx'] }); checks++;
for (const text of ['.170926', '.034394', '1,240', '808', '155 MiB', '620 MiB', '65,536 including', 'facebook/encodec_24khz', 'w2v-BERT', '--output decoded.wav']) {
  assert.ok(source.includes(text), `Missing verified authored quantity/contract ${text}`); checks++;
}
const resultPath = 'public/learn-code/multimodal-tokenization/digits_reconstructions.json';
const reconstructions = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
const examples = reconstructions.examples;
assert.ok(examples.length >= 2); checks++;
for (const example of examples) {
  same(example.original_8x8.length, 8); same(example.reconstructed_8x8.length, 8); same(example.latent_ids_4x4.length, 4);
  let error = 0;
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) error += (example.original_8x8[row][col] - example.reconstructed_8x8[row][col]) ** 2;
  near(error / 64, example.reconstruction_mse_mean, 1e-7);
}
// Independent NumPy/PyTorch route, also preserving exact shifted labels and sampling.
const python = process.env.MULTIMODAL_PYTHON || path.join(root, 'scratch/lesson-tools/Scripts/python.exe');
const sequencePath = 'public/learn-code/multimodal-tokenization/sequence_geometry.py';
const geometry = JSON.parse(execFileSync(python, ['-X', 'utf8', '-B', sequencePath], { encoding: 'utf8' }));
same(geometry.tubelet_shape, [8, 8]);
near(geometry.conv3d_max_absolute_difference, 0);
same(geometry.next_targets, m.PACKED_EXAMPLE.nextTargets);
same(geometry.sample_times_4fps, m.sampleVideo(4).times);
const files = [manuscriptPath, 'src/learn/data/multimodal-tokenization-models.js', sequencePath, resultPath, 'scripts/verify-multimodal-tokenization-model.mjs'];
fs.mkdirSync(path.dirname(receipt), { recursive: true });
fs.writeFileSync(receipt, JSON.stringify({ checkedAt: new Date().toISOString(), passed: true, checks,
  sourceFiles: Object.fromEntries(files.map(p => [p, hash(p)])), geometry,
  reconstructionExamples: examples.map(x => ({ source_index: x.source_index, mse: x.reconstruction_mse_mean })),
  scope: 'Independent arithmetic, slice/Euclidean references, actual generated reconstruction arrays, namespace/time/targets and NumPy/Conv3d agreement; browser paint reviewed separately.' }, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks, receipt }));
