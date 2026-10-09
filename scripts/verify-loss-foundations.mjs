// Author checks for the Loss Functions revision-7 foundational views. Recomputes every new
// value, drives the unchanged triplet model with the board's new default points, and confirms
// that programs, data, models and anchors are unchanged from the protected revision-6 copy.
// Writes its own receipt; it never touches the revision-5 author-checks.json.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { tripletGeometry, candidateCompetition } from '../src/learn/data/loss-functions-models.js';

const topicId = 'loss-functions-ce-mse-focal-contrastive-triplet';
const lesson = `src/learn/data/topics/${topicId}.jsx`;
const labs = 'src/learn/components/lesson-labs/LossFunctionsLabs.jsx';
const figures = 'src/learn/components/lesson-labs/LossIntuitionFigures.jsx';
const sourceFiles = [lesson, labs, figures, 'src/learn/components/lesson-labs/loss-functions-labs.css', 'src/learn/components/lesson-labs/loss-intuition.css'];
const snapshot = `docs/teaching/deep-learning-beginner/original/revision-6`;
// LESSON_RECEIPT lets a later revision rerun these checks without overwriting this revision's receipt.
const output = process.env.LESSON_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks-r7.json`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (a, b, tolerance = 5e-5) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const softmax = z => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b); return e.map(v => v / s); };
const receipt = { topicId, revision: 7, passed: false, checks: [] };
const check = (name, body) => { body(); receipt.checks.push({ name, passed: true }); };

try {
  const labSource = fs.readFileSync(labs, 'utf8');
  const starting = JSON.parse(labSource.match(/const startingPoints = (\[\[.*?\]\]);/)[1].replace(/(^|[\[,\s])\./g, '$10.'));

  check('Triplet board defaults: same squared distances as the prose, on one line through the anchor', () => {
    assert.deepEqual(starting, [[0, 0], [1, 0], [.3, .4], [.72, .96], [1.2, 1.6]]);
    const d2 = ([x, y]) => x * x + y * y;
    [.25, 1.44, 4].forEach((v, i) => close(d2(starting[i + 2]), v, 1e-12));
    starting.slice(2).forEach(([x, y]) => close(y / x, 4 / 3, 1e-12));
    // Every default point is visibly apart from the positive on the board (72 px per unit).
    starting.slice(2).forEach(([x, y]) => assert.ok(Math.hypot(x - 1, y) * 72 > 30));
  });
  check('Unchanged triplet model on the new defaults: kinds, losses, mining, margin .3, unsquared', () => {
    const r = tripletGeometry(starting, 1, true);
    assert.deepEqual(r.candidates.map(c => c.kind), ['hard', 'semi-hard', 'easy']);
    [1.75, .56, 0].forEach((v, i) => close(r.candidates[i].loss, v, 1e-12));
    assert.equal(r.selected, 1);
    const narrow = tripletGeometry(starting, .3, true);
    assert.equal(narrow.candidates[1].kind, 'easy'); assert.equal(narrow.selected, null);
    const plain = tripletGeometry(starting, 1, false);
    assert.equal(plain.selected, 1); close(plain.candidates[1].loss, .8, 1e-12);
    assert.equal(plain.candidates[2].kind, 'easy'); // distance exactly 2 is a boundary tie, excluded
  });
  check('Board rings and band radii, and step directions for the mined triplet', () => {
    const radii = (positive, margin, squared) => squared ? [Math.sqrt(positive), Math.sqrt(positive + margin)] : [positive, positive + margin];
    assert.deepEqual(radii(1, 1, true).map(v => +v.toFixed(4)), [1, 1.4142]);
    close(radii(1, .3, true)[1], 1.1402, 1e-4);
    assert.deepEqual(radii(1, 1, false), [1, 2]);
    const [a, p, , n] = starting;
    const stepP = [-2 * (p[0] - a[0]), -2 * (p[1] - a[1])], stepN = [-2 * (a[0] - n[0]), -2 * (a[1] - n[1])];
    assert.ok(Math.hypot(p[0] + .1 * stepP[0], p[1] + .1 * stepP[1]) < Math.hypot(...p)); // pulled toward a
    assert.ok(Math.hypot(n[0] + .1 * stepN[0], n[1] + .1 * stepN[1]) > Math.hypot(...n)); // pushed away
  });
  check('Embedding encoder figure: distances and triplet loss', () => {
    close(.72 ** 2 + .96 ** 2, 1.44, 1e-12); close(Math.max(0, 1 - 1.44 + 1), .56, 1e-12);
    // The API snippet's on-axis point has the same squared distance.
    close(1.2 ** 2, .72 ** 2 + .96 ** 2, 1e-12);
  });
  check('Softmax traces: exponential column, total and shares', () => {
    const e = [2, 1, -1].map(Math.exp), total = e.reduce((a, b) => a + b);
    ['7.389', '2.718', '0.368'].forEach((v, i) => assert.equal(e[i].toFixed(3), v)); assert.equal(total.toFixed(3), '10.475');
    softmax([2, 1, -1]).forEach((v, i) => close(v, e[i] / total, 1e-12));
    const c = [.8, .2, -.1].map(s => Math.exp(s / .2)), ct = c.reduce((a, b) => a + b);
    ['54.598', '2.718', '0.607'].forEach((v, i) => assert.equal(c[i].toFixed(3), v)); assert.equal(ct.toFixed(3), '57.923');
    close(c[0] / ct, .9426); close(candidateCompetition([.8, .2, -.1], .2).probabilities[0], c[0] / ct, 1e-12);
  });
  check('SimCLR pipeline row A₁: similarities .9/.3/.2 at τ = .5 give loss .4368', () => {
    const q = softmax([.9, .3, .2].map(v => v / .5)); close(-Math.log(q[0]), .4368);
  });
  check('Reduction figure: five combinations of the padded batch', () => {
    const short = [[4, 1], [0, 0], [0, 0]], long = [[1, 1], [1, 1], [1, 1]], all = [...short, ...long];
    const real = all.filter(([, m]) => m).map(([l]) => l);
    assert.equal(real.reduce((a, b) => a + b), 7);
    close(all.reduce((s, [l, m]) => s + l * m, 0) / all.reduce((s, [, m]) => s + m, 0), 1.75, 1e-12);
    close((4 + 1) / 2, 2.5, 1e-12);
    assert.equal((all.reduce((s, [l]) => s + l, 0) / all.length).toFixed(4), '1.1667');
  });
  check('Loop figure tangent through (3, 4) with slope −4 meets zero at prediction 4', () => {
    const tangent = x => 4 - 4 * (x - 3); assert.equal(tangent(2), 8); assert.equal(tangent(4), 0);
    assert.ok(labSource.includes('values: [[2, 8], [4, 0]]') && labSource.includes('yDomain={[0, 16]}'));
  });
  check('Changed JSX parses; section anchors equal the revision-6 copy', () => {
    for (const file of sourceFiles.filter(f => f.endsWith('.jsx'))) parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    const anchors = file => [...fs.readFileSync(file, 'utf8').match(/sections=\{\[(.*?)\]\}/s)[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(anchors(lesson), anchors(`${snapshot}/${topicId}/${lesson}`));
  });
  check('No prediction or reveal gate added; InfoNCE uses one name per role', () => {
    const text = [lesson, labs, figures].map(f => fs.readFileSync(f, 'utf8')).join('\n');
    assert.ok(!/check (your )?prediction|reveal (the )?answer|enter your prediction/i.test(text));
    assert.ok(!/Key \{i\}|p\(key 0\)/.test(labSource));
  });
  check('Programs, data, measurements and models unchanged from the revision-6 copy and the asset baseline', () => {
    // Models and measurements are static imports (revision-6 snapshot); the two program
    // modules load lazily, so their protected identity is the pre-revision-5 copy.
    const revision6 = JSON.parse(fs.readFileSync(`${snapshot}/revision-6-sources.json`, 'utf8')).topics[topicId];
    const original = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/original-sources.json', 'utf8')).topics[topicId];
    const preserved = [['src/learn/data/loss-functions-models.js', revision6], ['src/learn/data/loss-functions-measurements.js', revision6], ['src/learn/data/loss-functions-program.js', original], ['src/learn/data/loss-mechanisms-program.js', original]];
    for (const [file, record] of preserved) assert.equal(hash(file), record[file], file);
    const baseline = JSON.parse(fs.readFileSync('docs/teaching/evidence/concept-intuition-baseline.json', 'utf8')).actualFileHashes;
    const assets = Object.keys(baseline).filter(f => f.startsWith(`public/learn-assets/${topicId}/`));
    assert.ok(assets.length > 3);
    for (const file of assets) assert.equal(hash(file), baseline[file], file);
    receipt.preservedFiles = preserved.length + assets.length;
  });
  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, hash(file)]));
  receipt.checkedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) { receipt.failure = error.stack; process.exitCode = 1; }
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.length, failure: receipt.failure }));
