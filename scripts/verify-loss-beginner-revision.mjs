// Author checks for the Loss Functions beginner-buildup revision. Recomputes every
// new worked value from its definition, checks the experiment claims against the
// recorded validation probabilities, and confirms programs, data and models are unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import measurements from '../src/learn/data/loss-functions-measurements.js';

const topicId = 'loss-functions-ce-mse-focal-contrastive-triplet';
const lesson = `src/learn/data/topics/${topicId}.jsx`;
const sourceFiles = [lesson, 'src/learn/components/lesson-labs/LossIntuitionFigures.jsx', 'src/learn/components/lesson-labs/loss-intuition.css', 'src/learn/components/lesson-labs/LossFunctionsLabs.jsx', 'src/learn/components/lesson-labs/loss-functions-labs.css'];
// LESSON_RECEIPT lets a later revision rerun these checks without overwriting this revision's receipt.
const output = process.env.LESSON_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks.json`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (a, b, tolerance = 5e-5) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const sigmoid = z => 1 / (1 + Math.exp(-z));
const softmax = z => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b); return e.map(v => v / s); };
const receipt = { topicId, passed: false, checks: [] };
const check = (name, body) => { body(); receipt.checks.push({ name, passed: true }); };

try {
  check('Count-versus-loss column: CE of label 1 at six logits', () => {
    [[-2, 2.1269], [-1, 1.3133], [-.5, .9741], [.5, .4741], [1, .3133], [2, .1269]].forEach(([z, v]) => close(Math.log1p(Math.exp(-z)), v));
  });
  check('Pull balance at c = 0.5 and the three balance points', () => {
    const data = [0, 0, 0, 0, 0, 0, 10], c = .5;
    const pulls = { mse: r => 2 * r, mae: r => Math.sign(r), huber: r => Math.max(-1, Math.min(1, r)) };
    const down = f => data.filter(y => y < c).reduce((s, y) => s + f(c - y), 0), up = f => -data.filter(y => y > c).reduce((s, y) => s + f(c - y), 0);
    assert.deepEqual([down(pulls.mse), up(pulls.mse)], [6, 19]);
    assert.deepEqual([down(pulls.mae), up(pulls.mae)], [6, 1]);
    assert.deepEqual([down(pulls.huber), up(pulls.huber)], [3, 1]);
    close(data.reduce((s, y) => s + 2 * (10 / 7 - y), 0), 0, 1e-12);
    close(data.reduce((s, y) => s + pulls.huber(1 / 6 - y), 0), 0, 1e-12);
  });
  check('Probability-penalty figure: penalties and logit pushes', () => {
    [[.9, .1054, .01, .1, .018], [.5, .6931, .25, .5, .25], [.1, 2.3026, .81, .9, .162], [.01, 4.6052, .9801, .99, .0196]].forEach(([p, ce, sq, dce, dsq]) => {
      close(-Math.log(p), ce); close((1 - p) ** 2, sq, 1e-12);
      const z = Math.log(p / (1 - p)), h = 1e-6;
      const numeric = f => (f(z + h) - f(z - h)) / (2 * h);
      close(Math.abs(numeric(t => -Math.log(sigmoid(t)))), dce, 1e-6);
      close(Math.abs(numeric(t => (1 - sigmoid(t)) ** 2)), dsq, 1e-4);
    });
  });
  check('Softmax class trace (cat/dog/fox) and candidate trace at tau .2 and 1', () => {
    const p = softmax([2, 1, -1]);
    [.7054, .2595, .0351].forEach((v, i) => close(p[i], v));
    close(-Math.log(p[1]), 1.349); close(p[1] - 1, -.7405); close(Math.exp(2) + Math.exp(1) + Math.exp(-1), 10.475, 1e-3);
    assert.ok((p[0]) / p[2] > 20);
    const q = softmax([.8, .2, -.1].map(s => s / .2)), r = softmax([.8, .2, -.1]);
    [.9426, .0469, .0105].forEach((v, i) => close(q[i], v)); close(-Math.log(q[0]), .0591);
    close(r[0], .5114); close(-Math.log(r[0]), .6706);
  });
  check('Focal factor table, easy crowd and gradient ratio', () => {
    [[.99, .01005], [.9, .1054], [.5, .6931], [.1, 2.3026]].forEach(([pt, ce]) => close(-Math.log(pt), ce));
    close(.25 * -Math.log(.5), .1733); close(.81 * -Math.log(.1), 1.8651); close(.01 * -Math.log(.9), .00105, 1e-5);
    close(1000 * -Math.log(.99), 10.05, .005); close(1000 * 1e-4 * -Math.log(.99), .001, 1e-4);
    const focalSlope = pt => (1 - pt) ** 2 * (2 * pt * Math.log(pt) - (1 - pt));
    close(focalSlope(.9) / -(1 - .9), .028965, 1e-6);
    close(1000 * -focalSlope(.99), .002990, 1e-6); close(focalSlope(.1), -1.102019, 1e-6);
  });
  check('Focal minimizer pulled toward one half (.69 at .9, .31 at .1)', () => {
    const minimize = eta => { let best = [Infinity, 0]; for (let i = 1; i < 100000; i++) { const p = i / 100000; const v = -(eta * (1 - p) ** 2 * Math.log(p) + (1 - eta) * p * p * Math.log(1 - p)); if (v < best[0]) best = [v, p]; } return best[1]; };
    close(minimize(.9), .6942, 2e-4); close(minimize(.1), .3058, 2e-4);
  });
  check('C-1 ordering: squared push at .01 is about the .9 push and weaker than .5/.1', () => {
    const push = p => 2 * (1 - p) * p * (1 - p);
    assert.ok(push(.01) > push(.9) && Math.abs(push(.01) - push(.9)) < .002 && push(.01) < push(.1) && push(.01) < push(.5));
  });
  check('Alpha toggle net push and SimCLR/CPC worked values', () => {
    const slope = (pt, sign) => sign * (1 - pt) ** 2 * ((1 - pt) - 2 * pt * Math.log(pt));
    const neg = 1000 * slope(.99, 1), pos = slope(.1, -1);
    close(neg + pos, -1.099, .001); close(.75 * neg + .25 * pos, -.2733, 5e-4);
    const q = softmax([.9, .3, .2].map(v => v / .5)); [.6461, .1946, .1593].forEach((v, i) => close(q[i], v)); close(-Math.log(q[0]), .4368);
    const roles = [0, 1, 2, 3].map(i => [0, 1, 2, 3].filter(j => j !== i)); assert.ok(roles.every(r => r.length === 3));
    close(Math.log(8), 2.08, .005); close(Math.log(2 * 8) - Math.log(8), Math.log(2), 1e-12);
    close(softmax([0, 0, 0, 0])[0], .25, 1e-12);
  });
  check('Weighted BCE as copies: p* and equivalent threshold', () => {
    close(9 * .1 / (9 * .1 + .9), .5, 1e-12); close(1 / (1 + 9), .1, 1e-12); close(.8 / (.8 + .8), .5, 1e-12);
  });
  check('Embedding distance, cosine and pair/triplet examples', () => {
    close(Math.hypot(.6, .8), 1, 1e-12); close((.6 * .8 + .8 * .6), .96, 1e-12); close(.6 * -.8 + .8 * .6, 0, 1e-12);
    close(.2 ** 2, .04, 1e-12); close((1 - .2) ** 2, .64, 1e-12); close(Math.max(0, 1 - 1.2) ** 2, 0, 1e-12);
    close(1 - .25 + 1, 1.75, 1e-12); close(1 - 1.44 + 1, .56, 1e-12); close(Math.max(0, 1 - 4 + 1), 0, 1e-12); close(1 - 1.2 + 1, .8, 1e-12);
  });
  check('Practice answers: softmax trace and focal crowd', () => {
    const p = softmax([0, 1, 3]);
    [.042, .1142, .8438].forEach((v, i) => close(p[i], v)); close(-Math.log(p[1]), 2.1698); close(p[1] - 1, -.8858);
    close(500 * -Math.log(.95), 25.65, .005); close(500 * .05 * -Math.log(.95), 1.282, 5e-4); close(.4 * -Math.log(.6), .204, 5e-4);
    close(500 * .0025 * -Math.log(.95), .0641, 5e-5); close(.16 * -Math.log(.6), .0817, 5e-5);
  });
  check('Experiment claims recomputed from recorded validation probabilities', () => {
    const labels = measurements.validation_source_ids.map(id => measurements.specimens.find(row => row.source_id === id).digit === 9);
    const median = values => { const v = [...values].sort((a, b) => a - b), n = v.length; return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2; };
    const by = objective => measurements.records.filter(r => r.objective === objective);
    const posMedian = r => median(r.validation_probabilities.filter((_, i) => labels[i]));
    const negMedian = r => median(r.validation_probabilities.filter((_, i) => !labels[i]));
    const fn = r => r.validation_probabilities.filter((p, i) => labels[i] && p < .5).length;
    assert.equal(labels.filter(Boolean).length, 12);
    assert.deepEqual(by('bce').map(fn), [2, 2, 2]); assert.deepEqual(by('positive_weight_9').map(fn), [1, 1, 0]);
    by('positive_weight_9').forEach(r => assert.ok(posMedian(r) > .985));
    by('bce').forEach(r => assert.ok(posMedian(r) >= .89 && posMedian(r) <= .925 && negMedian(r) < .0015));
    by('focal_gamma_2').forEach(r => assert.ok(posMedian(r) >= .755 && posMedian(r) <= .835 && negMedian(r) >= .016 && negMedian(r) <= .0355));
    by('focal_gamma_2').forEach((r, i) => { const ratio = r.unweighted_log_loss / by('bce')[i].unweighted_log_loss; assert.ok(ratio > 1.8 && ratio < 2.3); });
    assert.equal(measurements.records.filter(r => r.average_precision.toFixed(6) === '0.979070').length, 7);
  });
  check('Changed JSX parses and section anchors are unchanged', () => {
    for (const file of sourceFiles.filter(f => f.endsWith('.jsx'))) parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    const anchors = file => [...fs.readFileSync(file, 'utf8').match(/sections=\{\[(.*?)\]\}/s)[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(anchors(lesson), anchors(`docs/teaching/deep-learning-beginner/original/${topicId}/${lesson}`));
  });
  check('Programs, data, measurements and models unchanged from the protected original', () => {
    const originals = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/original-sources.json')).topics[topicId];
    const preserved = Object.keys(originals).filter(f => /loss-functions-(models|measurements|program)\.js$|loss-mechanisms-program\.js$/.test(f));
    assert.equal(preserved.length, 4);
    for (const file of preserved) assert.equal(hash(file), originals[file], file);
    const baseline = JSON.parse(fs.readFileSync('docs/teaching/evidence/concept-intuition-baseline.json')).actualFileHashes;
    const assets = Object.keys(baseline).filter(f => f.startsWith(`public/learn-assets/${topicId}/`));
    assert.ok(assets.length > 3);
    for (const file of assets) assert.equal(hash(file), baseline[file], file);
    receipt.preservedFiles = [...preserved, ...assets].length;
  });
  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, hash(file)]));
  receipt.checkedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) { receipt.failure = error.stack; process.exitCode = 1; }
fs.mkdirSync(`docs/teaching/deep-learning-beginner/${topicId}`, { recursive: true });
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.length, failure: receipt.failure }));
