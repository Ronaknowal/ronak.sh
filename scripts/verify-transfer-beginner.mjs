// Author checks for the transfer-learning beginner buildup revision.
// Independent of the browser: recomputes each new number from recorded data or arithmetic.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { transferStrategy, TRANSFER_BLOCK_SIZES } from '../src/learn/data/transfer-learning-strategy.js';

const topicId = 'transfer-learning-fine-tuning-strategies';
const read = file => fs.readFileSync(file, 'utf8');
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const experiment = JSON.parse(read('src/learn/data/transfer-learning-experiment.json'));
const features = JSON.parse(read('src/learn/data/transfer-learning-features.json'));
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

check('Block sizes follow the layer shapes', () => {
  assert.deepEqual(TRANSFER_BLOCK_SIZES, { lower: 2080, upper: 528, head: 85, adapter: 148, loraLower: 192, loraUpper: 96 });
});

const configs = {
  scratch: { start: 'random', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
  probe: { start: 'learned', lower: false, upper: false, lora: false, adapter: false, slowLower: false },
  full: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
  discriminative: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: true },
  lora2: { start: 'learned', lower: false, upper: false, lora: true, adapter: false, slowLower: false },
  adapter4: { start: 'learned', lower: false, upper: false, lora: false, adapter: true, slowLower: false },
};
check('Strategy map counts equal the program-recorded trainable and total parameters', () => {
  for (const [method, config] of Object.entries(configs)) {
    const plan = transferStrategy(config);
    const run = experiment.runs.find(row => row.seed === 1 && row.method === method);
    assert.equal(plan.method, method);
    assert.equal(plan.trainable, run.trainable_parameters, method);
    assert.equal(plan.total, run.total_parameters, method);
  }
});
check('Unrun combinations have no measured method; partial is upper + head', () => {
  const partial = transferStrategy({ ...configs.probe, upper: true });
  assert.equal(partial.method, null); assert.equal(partial.key, 'partial'); assert.equal(partial.trainable, 528 + 85);
  assert.equal(transferStrategy({ ...configs.lora2, adapter: true }).method, null);
  assert.equal(transferStrategy({ ...configs.full, adapter: true }).method, null);
  assert.equal(transferStrategy(configs.probe).countExplanation, 'lower layer 0 + upper layer 0 + head 85 = 85.');
});
check('Retention is promised exactly only when the features cannot change', () => {
  const exact = Object.entries(configs).filter(([, c]) => transferStrategy(c).retention.startsWith('Preserved')).map(([m]) => m);
  assert.deepEqual(exact, ['probe']);
  // Recorded evidence agrees: the probe keeps the source holdout result and loss exactly.
  const probe = experiment.runs.find(row => row.seed === 1 && row.method === 'probe');
  assert.equal(probe.source_after.correct, probe.source_before.correct);
  assert.equal(probe.source_after.ce, probe.source_before.ce);
});

check('Feature inspection reproduces the main experiment for all three seeds', () => {
  for (const record of features.seeds) {
    const probe = experiment.runs.find(row => row.seed === record.seed && row.method === 'probe');
    assert.equal(record.probe_validation.learned_backbone.ce, probe.validation.ce);
    assert.equal(record.probe_validation.learned_backbone.correct, probe.validation.correct);
    assert.deepEqual(record.source_holdout, probe.source_before);
  }
});
check('Nearest-mean ordering claimed in the prose holds in every seed', () => {
  for (const { nearest_centroid_correct_of_60: n } of features.seeds) {
    assert.ok(n.learned_backbone < n.random_backbone && n.random_backbone <= n.raw_pixels);
  }
  assert.deepEqual(features.seeds.map(s => s.nearest_centroid_correct_of_60.learned_backbone), [37, 41, 43]);
});
check('Vote table rows each count 12 images; fives and nines collide under 3', () => {
  const votes = features.seeds[0].source_head_votes;
  for (const counts of Object.values(votes)) assert.equal(counts.reduce((a, b) => a + b, 0), 12);
  assert.equal(votes['5'][3], 11); assert.equal(votes['9'][3], 12);
  assert.equal(Object.values(votes).flat().filter(c => c >= 10).length, 2);
});
check('Saturation and displayed specimen facts', () => {
  const s = features.seeds[0];
  assert.equal(Math.round(100 * s.saturated_share.learned_backbone), 36);
  assert.equal(s.saturated_share.random_backbone, 0);
  const five = s.specimens.find(row => row.digit === 5);
  assert.equal(five.learned_features.filter(v => Math.abs(v) > .95).length, 10);
  assert.ok(five.random_features.every(v => Math.abs(v) < .5));
  assert.equal(five.source_head_says, 3);
});
check('Random-backbone probe values quoted in section 7', () => {
  const r = features.seeds[0].probe_validation.random_backbone;
  assert.equal(r.ce.toFixed(6), '0.542671'); assert.equal(r.correct, 58);
});

check('Outer-product figure arithmetic', () => {
  const a = [1, -1], b = [1, 2], x = [2, 1];
  const delta = b.map(bi => a.map(aj => bi * aj));
  assert.deepEqual(delta, [[1, -1], [2, -2]]);
  const full = delta.map(row => row[0] * x[0] + row[1] * x[1]);
  const m = a[0] * x[0] + a[1] * x[1];
  assert.deepEqual(full, b.map(v => v * m)); assert.deepEqual(full, [1, 2]);
  assert.equal(32 + 64, 96); assert.equal(32 * 64, 2048);
  assert.equal(192 + 96, 288); assert.equal(2080 + 528, 2608); assert.equal(288 + 85, 373);
});
check('LoRA first-step numbers', () => {
  const out = [2, 1], loss = (out[0] ** 2 + out[1] ** 2) / 2;
  assert.equal(loss, 2.5);
  const next = [2 - .1 * 2, 1 - .1 * 1];
  assert.ok(Math.abs(next[0] - 1.8) < 1e-12 && Math.abs(next[1] - .9) < 1e-12);
  assert.ok(Math.abs((next[0] ** 2 + next[1] ** 2) / 2 - 2.025) < 1e-12);
});
check('Section-1 worked case and practice 7 solution', () => {
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const mean = rows => rows[0].map((_, i) => rows.reduce((t, r) => t + r[i], 0) / rows.length);
  // Section 1: P {(1,3),(3,1)}, Q {(5,5),(7,7)}, new point (2,4).
  assert.deepEqual(mean([[1, 3], [3, 1]]), [2, 2]); assert.deepEqual(mean([[5, 5], [7, 7]]), [6, 6]);
  assert.equal(dist([2, 4], [2, 2]), 2); assert.equal(dist([2, 4], [6, 6]).toFixed(2), '4.47');
  // Practice 7: P {(0,2),(2,0)}, Q {(4,4),(6,6)}; (1,3) then collapsed (5,-1).
  const P = mean([[0, 2], [2, 0]]), Q = mean([[4, 4], [6, 6]]);
  assert.deepEqual(P, [1, 1]); assert.deepEqual(Q, [5, 5]);
  assert.equal(dist([1, 3], P), 2); assert.equal(dist([1, 3], Q).toFixed(2), '4.47');
  assert.equal(dist([5, -1], P).toFixed(2), '4.47'); assert.equal(dist([5, -1], Q), 6);
  assert.equal(Math.abs(5 - P[0]), 4); assert.equal(Math.abs(5 - Q[0]), 0);
});
check('Nearest-mean confusion and lower-layer evidence', () => {
  const s1 = features.seeds[0].nearest_centroid_confusion.learned_backbone;
  for (const counts of Object.values(s1)) assert.equal(counts.reduce((a, b) => a + b, 0), 12);
  assert.equal(s1['5'][4], 4); assert.equal(s1['9'][0], 4); assert.equal(s1['8'][2], 5); assert.equal(s1['7'][1], 5);
  const diag = t => Object.entries(t).reduce((sum, [d, c]) => sum + c[Number(d) - 5], 0);
  for (const seed of features.seeds) {
    assert.equal(diag(seed.nearest_centroid_confusion.learned_backbone), seed.nearest_centroid_correct_of_60.learned_backbone);
    assert.equal(diag(seed.nearest_centroid_confusion.random_backbone), seed.nearest_centroid_correct_of_60.random_backbone);
  }
  assert.deepEqual(features.seeds.map(x => x.nearest_centroid_confusion.learned_backbone['5'][4]), [4, 5, 4]);
  assert.deepEqual(features.seeds.map(x => x.nearest_centroid_confusion.learned_backbone['9'][0]), [4, 3, 3]);
  assert.deepEqual(features.seeds.map(x => x.nearest_centroid_confusion.learned_backbone['7'][1]), [5, 0, 2]);
  assert.deepEqual(features.seeds.map(x => x.nearest_centroid_confusion.learned_backbone['8'][2]), [5, 2, 2]);
  assert.deepEqual(features.seeds.map(x => x.lower_layer_nearest_centroid_correct_of_60.learned_lower_layer), [47, 49, 48]);
  assert.deepEqual(features.seeds.map(x => x.lower_layer_nearest_centroid_correct_of_60.random_lower_layer), [58, 59, 58]);
});
check('Per-seed votes, saturation and random-probe values quoted in the text', () => {
  assert.deepEqual(features.seeds.map(x => x.source_head_votes['5'][3]), [11, 11, 8]);
  assert.deepEqual(features.seeds.map(x => x.source_head_votes['9'][3]), [12, 10, 10]);
  assert.deepEqual(features.seeds.map(x => Math.round(100 * x.saturated_share.learned_backbone)), [36, 27, 28]);
  assert.deepEqual(features.seeds.map(x => x.probe_validation.random_backbone.correct), [58, 51, 52]);
  assert.deepEqual(features.seeds.map(x => x.probe_validation.learned_backbone.correct), [44, 42, 46]);
});
check('Negative-transfer margins repeat in every seed', () => {
  for (const seed of [1, 2, 3]) {
    const runs = experiment.runs.filter(r => r.seed === seed && r.method);
    const scratch = runs.find(r => r.method === 'scratch').validation.ce;
    const best = Math.min(...runs.filter(r => r.method !== 'scratch').map(r => r.validation.ce));
    assert.ok(scratch < best, 'seed ' + seed);
    if (seed === 1) { assert.equal(scratch.toFixed(2), '0.12'); assert.ok(best >= .34); }
  }
});
check('Adapter validation errors quoted in section 7', () => {
  const adapter = experiment.runs.find(row => row.seed === 1 && row.method === 'adapter4');
  assert.equal(60 - adapter.validation.correct, 21); assert.equal(adapter.train.correct, 40);
});

const changed = ['src/learn/data/topics/' + topicId + '.jsx', 'src/learn/components/lesson-labs/TransferBuildupFigures.jsx', 'src/learn/components/lesson-labs/TransferLearningLabs.jsx', 'src/learn/components/lesson-labs/TransferIntuitionFigures.jsx'];
check('Changed JSX parses', () => { for (const file of changed) parse(read(file), { sourceType: 'module', plugins: ['jsx'] }); });
check('Measured data and programs are byte-identical to the protected originals', () => {
  const original = JSON.parse(read('docs/teaching/deep-learning-beginner/original/original-sources.json')).topics[topicId];
  for (const file of ['src/learn/data/transfer-learning-experiment.json', 'src/learn/data/transfer-learning-specimens.json', 'src/learn/data/transfer-learning-model.js', 'src/learn/data/transfer-learning-mechanism-program.js']) assert.equal(hash(file), original[file], file);
  const baseline = JSON.parse(read('docs/teaching/evidence/concept-intuition-baseline.json')).actualFileHashes;
  for (const file of ['src/learn/assets/transfer-learning/transfer-experiments.py', 'src/learn/assets/transfer-learning/digits-400.csv', 'public/learn-assets/transfer-learning/lora-mechanism-bridge.py']) assert.equal(hash(file), baseline[file], file);
});
check('Hedging density: at most one hedge phrase per four teaching paragraphs', () => {
  const body = read(changed[0]);
  const paragraphs = (body.match(/<Prose/g) || []).length;
  const hedges = (body.match(/does not prove|not a certificate|not automatically|alone does not|not a claim|not a guarantee|no guarantee/g) || []).length;
  assert.ok(hedges * 4 <= paragraphs, `${hedges} hedges / ${paragraphs} paragraphs`);
});

console.log(JSON.stringify({ topicId, passed: true, checks }, null, 1));
