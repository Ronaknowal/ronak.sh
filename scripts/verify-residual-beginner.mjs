// Author checks for the Residual Connections beginner-buildup revision. Prints JSON; writes nothing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';
import { anatomyState, identityRequirement, scalarChain, joinBoth, projectionBlock, highwayBlock, degradationTable, shortcutTable } from '../src/learn/data/residual-buildup-model.js';

const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const closeAll = (a, b, tol) => { assert.equal(a.length, b.length); a.forEach((v, i) => Array.isArray(v) ? closeAll(v, b[i], tol) : close(v, b[i], tol)); };
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lessonPath = 'src/learn/data/topics/residual-connections-skip-connections.jsx';
const lesson = fs.readFileSync(lessonPath, 'utf8');

check('Anatomy forward values: F(x) = [0, 0.5], y = [2, −0.5]', () => {
  const s = anatomyState();
  closeAll(s.correction, [0, 0.5]); closeAll(s.output, [2, -0.5]); close(s.loss, 0.625);
});

check('Anatomy backward values match an independent finite-difference gradient', () => {
  const s = anatomyState();
  closeAll(s.upstream, [1, -0.5]); closeAll(s.branchGradient, [0.1, 0.45]); closeAll(s.totalGradient, [1.1, -0.05]);
  closeAll(s.weightGradient, [[2, -1], [-1, 0.5]]);
  const W = s.weight, t = [1, 0];
  const loss = (x, w) => { const y = x.map((v, i) => v + w[i][0] * x[0] + w[i][1] * x[1]); return 0.5 * y.reduce((a, v, i) => a + (v - t[i]) ** 2, 0); };
  const h = 1e-6, x = [2, -1];
  const gx = x.map((_, j) => { const p = [...x], m = [...x]; p[j] += h; m[j] -= h; return (loss(p, W) - loss(m, W)) / (2 * h); });
  closeAll(gx, s.totalGradient, 1e-6);
  const gw = W.map((row, i) => row.map((_, j) => { const p = W.map(r => [...r]), m = W.map(r => [...r]); p[i][j] += h; m[i][j] -= h; return (loss(x, p) - loss(x, m)) / (2 * h); }));
  closeAll(gw, s.weightGradient, 1e-6);
});

check('Anatomy agrees with the program’s recorded PyTorch autograd run (calculated-inputs.json)', () => {
  const recorded = JSON.parse(fs.readFileSync('public/learn-assets/residual-connections/calculated-inputs.json', 'utf8')).mechanisms.one_update;
  const s = anatomyState();
  closeAll(s.correction, recorded.correction, 1e-12); closeAll(s.output, recorded.output, 1e-12);
  closeAll(s.totalGradient, recorded.total_input_gradient, 1e-12); closeAll(s.weightGradient, recorded.weight_gradient, 1e-12);
  closeAll(s.branchGradient, recorded.branch_input_gradient, 1e-12);
});

check('Zero branch: y = x, input gradient = g, weight gradient still nonzero', () => {
  const s = anatomyState(true);
  closeAll(s.output, [2, -1]); closeAll(s.upstream, [1, -1]); closeAll(s.totalGradient, [1, -1]);
  closeAll(s.weightGradient, [[2, -1], [-2, 1]]);
});

check('Identity requirement: residual keeps x at zero weights; plain needs I and fails with tanh', () => {
  assert.ok(identityRequirement('linear', 'zero').residualKeepsX);
  assert.ok(!identityRequirement('linear', 'zero').plainKeepsX);
  assert.ok(identityRequirement('linear', 'identity').plainKeepsX);
  const tanhIdentity = identityRequirement('tanh', 'identity');
  assert.ok(!tanhIdentity.plainKeepsX); closeAll(tanhIdentity.plain, [Math.tanh(2), Math.tanh(-1)]);
  assert.ok(identityRequirement('tanh', 'zero').residualKeepsX);
  for (const setting of ['zero', 'identity', 'lesson']) assert.ok(!identityRequirement('tanh', setting).plainKeepsX);
  // tanh keeps each hidden value in (−1, 1), so a fixed W₂ bounds the plain output while x is unbounded.
  const w = [[0.3, -2], [1.5, 0.4]], rowBound = Math.max(...w.map(r => Math.abs(r[0]) + Math.abs(r[1])));
  const x = [10 * rowBound, 0], out = w.map(r => r[0] * Math.tanh(x[0]) + r[1] * Math.tanh(x[1]));
  assert.ok(Math.abs(out[0]) < x[0]);
});

check('Three-block stack: skips give (1+a)³, plain gives a³, a = −1 cancels', () => {
  const r = scalarChain(0.1, true), p = scalarChain(0.1, false);
  closeAll(r.values, [1, 1.1, 1.21, 1.331]); close(r.total, 1.331);
  closeAll(p.values, [1, 0.1, 0.01, 0.001], 1e-15); close(p.total, 0.001, 1e-15);
  closeAll(r.corrections, [0.1, 0.11, 0.121]);
  closeAll(r.sensitivities, [1.331, 1.21, 1.1, 1]);
  close(scalarChain(-1, true).total, 0);
  close(scalarChain(0.2, true).total, 1.728); close(scalarChain(0.2, false).total, 0.008, 1e-15);
  // Independent numerical derivative of the with-skips chain.
  const run = x0 => { let x = x0; for (let k = 0; k < 3; k++) x = x + 0.1 * x; return x; };
  close((run(1 + 1e-6) - run(1 - 1e-6)) / 2e-6, 1.331, 1e-6);
});

check('Well-scaled plain stack (a = 1, no skips) keeps derivative 1; residual at a = 1 gives 8', () => {
  close(scalarChain(1, false).total, 1); closeAll(scalarChain(1, false).values, [1, 1, 1, 1]);
  close(scalarChain(1, true).total, 8);
});

check('Skip multiplier λ: x_{k+1} = λx_k + a x_k; direct term λ³; λ = 0.5, a = 0 gives 0.125', () => {
  const s = scalarChain(0, true, 3, 1, 0.5);
  close(s.directTerm, 0.125); close(s.total, 0.125); closeAll(s.values, [1, 0.5, 0.25, 0.125]);
  const mixed = scalarChain(0.2, true, 3, 1, 0.5);
  close(mixed.multiplier, 0.7); close(mixed.total, 0.343); close(mixed.directTerm, 0.125);
  const run = x0 => { let x = x0; for (let k = 0; k < 3; k++) x = 0.5 * x + 0.2 * x; return x; };
  close((run(1 + 1e-6) - run(1 - 1e-6)) / 2e-6, 0.343, 1e-6);
  close(scalarChain(0.1, true, 3, 1, 1).total, scalarChain(0.1, true).total);
  close(0.5 ** 54, 5.551115123125783e-17, 1e-30);
  assert.equal(scalarChain(0.3, false, 3, 1, 0.5).lambda, 0, 'removed skip ignores λ');
});

check('Stack captions: exact cancel only at a = −1; near-cancel and |a| > 0.1 states use honest text', () => {
  const figures = fs.readFileSync('src/learn/components/lesson-labs/ResidualBuildupFigures.jsx', 'utf8');
  assert.ok(figures.includes("if (near(s.multiplier)) return 'At a = −1 each branch cancels its skip exactly"));
  assert.ok(figures.includes('Each branch nearly cancels its skip'));
  assert.ok(figures.includes('Math.abs(slope) <= 0.1 + 1e-9'));
  assert.ok(!figures.includes('slope <= -0.95 && slope >= -1.05'));
  close(scalarChain(-0.95, true).total, 0.000125, 1e-12);
  close(scalarChain(0.25, true).total, 1.953125);
});

check('Plain stack at a = −1: magnitude 1, sign-alternating derivative −1; caption is state-aware and the power prints (−1)³', () => {
  const s = scalarChain(-1, false);
  close(s.total, -1); closeAll(s.values, [1, -1, 1, -1]);
  const figures = fs.readFileSync('src/learn/components/lesson-labs/ResidualBuildupFigures.jsx', 'utf8');
  assert.ok(figures.includes("return slope > 0 ? 'A well-scaled plain stack"));
  assert.ok(figures.includes('flips sign at every layer'));
  assert.ok(figures.includes('= {term(s.multiplier)}³ ='));
  assert.ok(figures.includes('He et al. 2016 tested λ = 0.5 and several other modified shortcuts'));
});

check('Degradation and shortcut tables reproduce the papers’ reported values', () => {
  assert.deepEqual(degradationTable, [{ depth: 18, plain: 27.94, residual: 27.88 }, { depth: 34, plain: 28.54, residual: 25.03 }]);
  assert.deepEqual(shortcutTable.map(r => r.error), ['6.61', 'fail', '12.35', '12.22', 'fail']);
  assert.deepEqual(shortcutTable.map(r => [r.shortcut, r.branch]), [['1', '1'], ['0.5', '1'], ['0.5', '0.5'], ['1×1 conv', '1'], ['dropout 0.5', '1']]);
});

check('Highway gate with learned weights: b_T = −3 starts near carry mode', () => {
  const h = highwayBlock(1, -3); const g = 1 / (1 + Math.exp(2));
  close(h.gate, g); close(h.output, (1 - g) + 2 * g); assert.ok(Math.abs(h.output - 1) < 0.15);
  close(highwayBlock(1).gate, 1 / (1 + Math.exp(-1)));
});

check('Projection block, addition/concatenation and highway numbers', () => {
  const p = projectionBlock(); closeAll(p.skip, [2, -1, 1]); closeAll(p.output, [2.1, -1.2, 1.3]);
  const j = joinBoth(); closeAll(j.added, [2, -0.5]); closeAll(j.concatenated, [2, -1, 0, 0.5]);
  const h = highwayBlock(); const g = 1 / (1 + Math.exp(-1));
  close(h.output, (1 - g) + 2 * g); close(h.carry, 0.2689414, 1e-6); close(h.carried, 1.4621172, 1e-6);
});

check('Practice 8 and 9 answers', () => {
  const t = Math.tanh(1);
  close(0.5 * t, 0.380797, 1e-6); close(1 + 0.5 * t, 1.380797, 1e-6);
  close(1.2 ** 4, 2.0736); close(0.2 ** 4, 0.0016, 1e-15);
  close((1 + -2) ** 4, 1);
});

check('Displayed excerpt is exactly lines 15–62 of the published program', () => {
  const program = fs.readFileSync('public/learn-assets/residual-connections/residual-experiments.py', 'utf8').replace(/\r\n/g, '\n').split('\n');
  const excerpt = program.slice(14, 62).join('\n').replace(/\n+$/, '');
  assert.ok(lesson.includes(JSON.stringify(excerpt)), 'excerpt string not found in lesson');
  assert.ok(excerpt.startsWith('class Refinement') && excerpt.includes('return self.states(pixels)[0]'));
});

check('Lesson and new figure files parse; figures (with link ids) are placed in reading order; §4.1 has one home', () => {
  for (const file of [lessonPath, 'src/learn/components/lesson-labs/ResidualBuildupFigures.jsx', 'src/learn/data/residual-buildup-model.js'])
    parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  for (const name of ['<ResidualBlockAnatomy id="residual-block-anatomy" allowBackward={false} />', 'ResidualBlockAnatomy initialDirection="backward"', 'IdentityRequirementFigure', '<ResidualStackFigure id="residual-stack" />', 'ResidualPlacementFigure', 'ResidualProjectionDiagram', 'DigitNetworkDiagram', 'AddConcatFigure', 'HighwayBlockDiagram', '<DegradationTable />', '<ShortcutVariantsTable />', 'He et al. 2015, §4.1'])
    assert.ok(lesson.includes(name), name);
  assert.ok(!lesson.includes('<ResidualGradientFigure'));
  assert.equal((lesson.match(/§4.1/g) || []).length, 1, 'He 2015 §4.1 caution appears once');
  assert.ok(lesson.indexOf('<DegradationTable') < lesson.indexOf('<ResidualStackFigure') && lesson.indexOf('<ResidualStackFigure') < lesson.indexOf('<ShortcutVariantsTable'));
  assert.ok(lesson.indexOf('<ResidualBlockAnatomy id=') < lesson.indexOf('<IdentityRequirementFigure') && lesson.indexOf('<IdentityRequirementFigure') < lesson.indexOf('<ResidualStackFigure'));
});

check('Programs, data, measurements and prior lab/model files are byte-identical to the protected originals', () => {
  const originals = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/original-sources-positions-6-10.json', 'utf8')).topics['residual-connections-skip-connections'];
  for (const file of ['src/learn/data/residual-connections-model.js', 'src/learn/components/lesson-labs/ResidualConnectionsLabs.jsx', 'src/learn/components/lesson-labs/ResidualGateIntuition.jsx', 'src/learn/components/lesson-labs/residual-gate-intuition.css', 'src/learn/components/lesson-labs/residual-connections.css'])
    assert.equal(hash(file), originals[file], file);
  for (const file of fs.readdirSync('public/learn-assets/residual-connections')) {
    const path = `public/learn-assets/residual-connections/${file}`;
    const head = execFileSync('git', ['show', `HEAD:${path}`], { maxBuffer: 64 * 1024 * 1024 });
    const normalize = buffer => buffer.toString('binary').replace(/\r\n/g, '\n');
    assert.equal(normalize(fs.readFileSync(path)), normalize(head), path);
  }
});

check('Hedging density: at most one stock hedge per four teaching paragraphs', () => {
  const paragraphs = (lesson.match(/<Prose/g) || []).length;
  const hedges = (lesson.match(/does not prove|not a guarantee|not automatically|alone does not|not a claim|is not a certificate/g) || []).length;
  assert.ok(hedges * 4 <= paragraphs, `${hedges} hedges in ${paragraphs} paragraphs`);
});

console.log(JSON.stringify({ topicId: 'residual-connections-skip-connections', passed: true, checks }, null, 2));
