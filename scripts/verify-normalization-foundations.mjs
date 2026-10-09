// Revision-7 author checks for the Normalization lesson's foundational views:
// the labelled layer anatomy, the BN/LN pooling picture and the BatchNorm mode diagram.
// Reruns the revision-5 checks into a scratch receipt so their evidence file is not rewritten.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';

const topicId = 'batch-layer-group-rms-normalization';
const record = `docs/teaching/deep-learning-beginner/${topicId}`;
const python = 'scratch/lesson-tools/Scripts/python.exe';
const eps = 1e-5;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (actual, expected, tolerance = 5e-4) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sourceFiles = [
  `src/learn/data/topics/${topicId}.jsx`,
  'src/learn/components/lesson-labs/NormalizationBuildupFigures.jsx',
  'src/learn/components/lesson-labs/normalization-buildup.css',
  'src/learn/components/lesson-labs/NormalizationLabs.jsx',
  'src/learn/components/lesson-labs/normalization-labs.css',
  'scripts/verify-normalization-buildup.mjs',
];
const receipt = { topicId, revision: 7, passed: false, checks: [] };
const check = (name, run) => { run(); receipt.checks.push({ name, passed: true }); };

try {
  check('Revision-5 checks still pass (receipt redirected to scratch)', () => {
    const scratch = 'scratch/normalization-r7-rerun/revision-5-rerun.json';
    execFileSync(process.execPath, ['scripts/verify-normalization-buildup.mjs'], { env: { ...process.env, NORMALIZATION_RECEIPT: scratch }, stdio: 'pipe' });
    assert.equal(JSON.parse(fs.readFileSync(scratch, 'utf8')).passed, true);
    fs.rmSync('scratch/normalization-r7-rerun', { recursive: true, force: true });
  });
  check('Layer anatomy: μ, v, s, x̂, γx̂+β and tanh for A–D', () => {
    const z = [6, 8, 10, 12], mu = mean(z), v = mean(z.map(x => (x - mu) ** 2)), s = Math.sqrt(v + eps);
    assert.equal(mu, 9); assert.equal(v, 5);
    close(s, 2.23607, 1e-5);
    const h = z.map(x => (x - mu) / s);
    [-1.342, -.447, .447, 1.342].forEach((value, i) => close(h[i], value));
    [-.872, -.420, .420, .872].forEach((value, i) => close(Math.tanh(1 * h[i] + 0), value));
    // The bias cancels: adding any constant to every score leaves x̂ unchanged.
    const shifted = z.map(x => x + 3.7), m2 = mean(shifted), s2 = Math.sqrt(mean(shifted.map(x => (x - m2) ** 2)) + eps);
    shifted.forEach((x, i) => close((x - m2) / s2, h[i], 1e-12));
  });
  check('Pooling picture: BatchNorm column mean 9, LayerNorm row mean 4/3', () => {
    const rows = [[1, 6, -3], [0, 8, -1], [2, 10, 0], [1, 12, 4]];
    assert.equal(mean(rows.map(row => row[1])), 9);
    close(mean(rows[0]), 4 / 3, 1e-12);
    assert.deepEqual(rows.map(row => row[1]), [6, 8, 10, 12]);
  });
  const modes = (values, buffers, m, gamma = 1, beta = 0) => {
    const mu = mean(values), v = mean(values.map(x => (x - mu) ** 2)), corrected = v * values.length / (values.length - 1);
    return {
      next: { mean: (1 - m) * buffers.mean + m * mu, variance: (1 - m) * buffers.variance + m * corrected },
      training: values.map(x => gamma * (x - mu) / Math.sqrt(v + eps) + beta),
      evaluation: values.map(x => gamma * (x - buffers.mean) / Math.sqrt(buffers.variance + eps) + beta),
    };
  };
  const js = modes([1, 3, 5, 7], { mean: 0, variance: 1 }, .1);
  check('Mode diagram: buffer write, training output and read-only evaluation', () => {
    close(js.next.mean, .4, 1e-12); close(js.next.variance, 1.566667, 1e-6);
    close(js.training[0], -1.341639, 1e-6);
    close(js.evaluation[0], 1 / Math.sqrt(1 + eps), 1e-12);
    const after = modes([1, 3, 5, 7], js.next, .1);
    close(after.evaluation[0], .479360, 1e-6);
    const twice = modes([1, 3, 5, 7], after.next, .1);
    close(after.next.mean, .76, 1e-9); close(after.next.variance, 2.0766667, 1e-6);
    assert.ok(twice);
  });
  check('Mode diagram matches PyTorch BatchNorm1d (train pass, then eval)', () => {
    const code = [
      'import json, torch',
      'bn = torch.nn.BatchNorm1d(1, momentum=0.1, eps=1e-5, affine=False).double()',
      'x = torch.tensor([[1.],[3.],[5.],[7.]], dtype=torch.float64)',
      'bn.eval(); e0 = bn(x)[:,0].tolist()',
      'bn.train(); t = bn(x)[:,0].tolist()',
      'rm, rv = bn.running_mean.item(), bn.running_var.item()',
      'bn.eval(); e1 = bn(x)[:,0].tolist()',
      'print(json.dumps({"e0": e0, "t": t, "rm": rm, "rv": rv, "e1": e1}))',
    ].join('\n');
    const torch = JSON.parse(execFileSync(python, ['-B', '-c', code], { encoding: 'utf8' }));
    torch.e0.forEach((value, i) => close(value, js.evaluation[i], 1e-12));
    torch.t.forEach((value, i) => close(value, js.training[i], 1e-12));
    close(torch.rm, js.next.mean, 1e-12); close(torch.rv, js.next.variance, 1e-12);
    const after = modes([1, 3, 5, 7], js.next, .1);
    torch.e1.forEach((value, i) => close(value, after.evaluation[i], 1e-12));
    receipt.torch = torch;
  });
  check('Diagram evaluation (before the write) and table column (after it) are labelled for their own states', () => {
    const figure = fs.readFileSync('src/learn/components/lesson-labs/NormalizationBuildupFigures.jsx', 'utf8');
    const labs = fs.readFileSync('src/learn/components/lesson-labs/NormalizationLabs.jsx', 'utf8');
    assert.ok(figure.includes('Stored buffers, before this pass’s write'));
    assert.ok(labs.includes('Evaluation after this pass’s write') && labs.includes('Evaluation, buffers unchanged'));
    assert.ok(!labs.includes('Evaluation using proposed buffers'));
    // Training, fresh buffers: the diagram's before-write evaluation differs from the table's after-write evaluation.
    const before = js.evaluation[0], after = modes([1, 3, 5, 7], js.next, .1).evaluation[0];
    close(before, 1 / Math.sqrt(1 + eps), 1e-12); close(after, .479360, 1e-6);
    assert.ok(Math.abs(before - after) > .1);
    // Evaluation writes nothing, so the table's column equals the diagram's panel.
    const evalAfter = [1, 3, 5, 7].map(x => (x - 0) / Math.sqrt(1 + eps));
    js.evaluation.forEach((value, i) => close(value, evalAfter[i], 1e-12));
  });
  check('Geometry readouts: centered length is offset-invariant, amber length is not', () => {
    const lengths = offset => { const x = [1 + offset, 3 + offset], c = mean(x); return [Math.hypot(x[0] - c, x[1] - c), Math.hypot(...x)]; };
    close(lengths(0)[0], Math.SQRT2, 1e-12); close(lengths(10)[0], Math.SQRT2, 1e-12);
    assert.ok(lengths(10)[1] > lengths(0)[1] * 5);
  });
  check('Changed JSX parses and the lesson imports the new views', () => {
    sourceFiles.filter(file => file.endsWith('.jsx')).forEach(file => parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }));
    const lesson = fs.readFileSync(sourceFiles[0], 'utf8'), labs = fs.readFileSync(sourceFiles[3], 'utf8');
    assert.ok(lesson.includes('<LayerPoolingFigure />') && lesson.includes('#normalization-layer-anatomy'));
    assert.ok(labs.includes('<BatchNormModeDiagram'));
  });
  check('Models, measurements and programs unchanged since revision 6', () => {
    const rev6 = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/revision-6/revision-6-sources.json', 'utf8')).topics[topicId];
    const preserved = Object.entries(rev6).filter(([file]) => /normalization-(models|measurements|program|backward-program)\.js$/.test(file));
    assert.ok(preserved.length >= 2);
    for (const [file, expected] of preserved) assert.equal(hash(file), expected, file);
    receipt.preservedFiles = preserved.map(([file]) => file);
  });
  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, hash(file)]));
  receipt.reviewedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) {
  receipt.failure = error.stack;
  process.exitCode = 1;
}
fs.writeFileSync(`${record}/author-checks-r7.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.length, failure: receipt.failure }));
