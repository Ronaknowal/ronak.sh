// Author checks for the Residual Connections reading-flow revision.
// Writes its receipt only to RESIDUAL_FLOW_RECEIPT (default: the topic's author-checks-flow.json).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';
import { anatomyState, identityRequirement, scalarChain, joinBoth, projectionBlock, highwayBlock, degradationTable, shortcutTable } from '../src/learn/data/residual-buildup-model.js';
import { correctionFixture, correctionModel, scalarStack, operatorPlacement, projectionModel, gateModel, nonlinearPaths } from '../src/learn/data/residual-connections-model.js';

const topicId = 'residual-connections-skip-connections';
const receipt = process.env.RESIDUAL_FLOW_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks-flow.json`;
const lessonPath = `src/learn/data/topics/${topicId}.jsx`;
const figuresPath = 'src/learn/components/lesson-labs/ResidualBuildupFigures.jsx';
const labsPath = 'src/learn/components/lesson-labs/ResidualConnectionsLabs.jsx';
const gatePath = 'src/learn/components/lesson-labs/ResidualGateIntuition.jsx';
const read = file => fs.readFileSync(file, 'utf8');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lesson = read(lessonPath), figures = read(figuresPath), labs = read(labsPath);
const snapshot = `docs/teaching/deep-learning-beginner/original/before-reading-flow/${topicId}`;
const before = read(`${snapshot}/${lessonPath}`);

const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const closeAll = (a, b, tol) => { assert.equal(a.length, b.length); a.forEach((v, i) => Array.isArray(v) ? closeAll(v, b[i], tol) : close(v, b[i], tol)); };

check('Anatomy and correction lab: F(x) = [0, 0.5], y = [2, −0.5]; three steps lower the loss 0.625 → 0.15625 → 0.0390625 → 0.0097656', () => {
  const s = anatomyState(); closeAll(s.correction, [0, 0.5]); closeAll(s.output, [2, -0.5]);
  closeAll(anatomyState(true).output, [2, -1]);
  let w = correctionFixture(); const losses = [];
  for (let k = 0; k < 4; k++) { const m = correctionModel(w, 0.1); losses.push(m.loss); w = m.newWeight; }
  closeAll(losses, [0.625, 0.15625, 0.0390625, 0.009765625], 1e-12);
  closeAll(correctionModel(correctionFixture()).newWeight, [[-0.1, 0.3], [0.1, -0.55]]);
  closeAll(correctionModel(correctionFixture()).totalGradient, [1.1, -0.05]);
});

check('Identity requirement: residual keeps x at W = 0; plain keeps x only for the linear identity; tanh plain never keeps x', () => {
  assert.ok(identityRequirement('linear', 'zero').residualKeepsX && !identityRequirement('linear', 'zero').plainKeepsX);
  assert.ok(identityRequirement('linear', 'identity').plainKeepsX);
  closeAll(identityRequirement('linear', 'identity').residual, [4, -2]);
  assert.ok(identityRequirement('tanh', 'zero').residualKeepsX && !identityRequirement('tanh', 'identity').plainKeepsX);
});

check('Stack: 1.331 with skips, 0.001 without, 1 for the well-scaled plain stack; λ = 0.5 gives 0.125 and 0.5^54 ≈ 5.6e−17', () => {
  close(scalarChain(0.1, true).total, 1.331); close(scalarChain(0.1, false).total, 0.001);
  close(scalarChain(1, false).total, 1); close(scalarChain(-1, true).total, 0);
  close(scalarChain(0, true, 3, 1, 0.5).total, 0.125); close(scalarChain(0, true, 3, 1, 0.5).directTerm, 0.125);
  close(0.5 ** 54, 5.551115123125783e-17, 1e-30);
});

check('Depth lab values quoted in prose: (1+a)^10 for a = −1, −0.5, 0, 0.1, 1', () => {
  close(scalarStack(-1, 10).gain, 0); close(scalarStack(-0.5, 10).gain, 0.0009765625);
  close(scalarStack(0, 10).gain, 1); close(scalarStack(0.1, 10).gain, 2.5937424601, 1e-9); close(scalarStack(1, 10).gain, 1024);
  for (const text of ['0.0009765625', '2.59374', '1024']) assert.ok(lesson.includes(text), text);
});

check('Order lab: ReLU after join gives [0, 1]; LayerNorm ≈ [−0.999998, 0.999998] and ignores a common shift', () => {
  closeAll(operatorPlacement('post-relu').output, [0, 1]); closeAll(operatorPlacement('inside').output, [-2, 1]);
  const ln = operatorPlacement('post-ln'); closeAll(ln.output, [-0.999998, 0.999998], 1e-6);
  closeAll(operatorPlacement('post-ln', 1).output, ln.output, 1e-6); closeAll(ln.shiftDirection, [0, 0], 1e-9);
});

check('Projection: Px = [2, −1, 1], output [2.1, −1.2, 1.3], Pᵀ[1, 2, 3] = [4, 5]; identity skip is incompatible', () => {
  const p = projectionBlock(); closeAll(p.skip, [2, -1, 1]); closeAll(p.output, [2.1, -1.2, 1.3]);
  closeAll(projectionModel([1, 1]).gradient, [4, 5]); assert.equal(projectionModel([1, 1], false, false).compatible, false);
  close(projectionModel([1, -1]).skip[2], 3);
});

check('Gate lab: scalar gradient 1.4 → α = −0.14; per-feature gradients [0, 1.4]; zero branch-weight gradient at α = 0', () => {
  const s = gateModel(0); close(s.scaleGradient, 1.4); close(s.nextScale, -0.14); closeAll(s.branchGradient, [[0, 0], [0, 0]]);
  closeAll(gateModel(0, 'channel').scaleGradient, [0, 1.4]);
});

check('Paths, join, highway and tables', () => {
  const n = nonlinearPaths(1); assert.equal(n.actual, 6); assert.equal(n.invalid, 4);
  closeAll(joinBoth().added, [2, -0.5]); closeAll(joinBoth().concatenated, [2, -1, 0, 0.5]);
  const h = highwayBlock(); close(h.gate, 0.7310586, 1e-6); close(h.carry, 0.2689414, 1e-6); close(h.carried, 1.4621172, 1e-6); close(h.output, 1.7310586, 1e-6);
  close(highwayBlock(1, -3).gate, 1 / (1 + Math.exp(2)));
  assert.deepEqual(degradationTable.map(r => [r.plain, r.residual]), [[27.94, 27.88], [28.54, 25.03]]);
  assert.deepEqual(shortcutTable.map(r => r.error), ['6.61', 'fail', '12.35', '12.22', 'fail']);
});

check('Recorded measurements quoted in prose and readouts', () => {
  const d = JSON.parse(read('public/learn-assets/residual-connections/browser-measurements.json'));
  const fit = (seed, depth, mode) => d.fits.find(r => r.seed === seed && r.depth === depth && r.mode === mode);
  assert.equal(fit(1, 12, 'plain').trace.at(-1).validation.correct, 110);
  assert.equal(fit(1, 6, 'residual').trace.at(-1).validation.correct, 116);
  const omissions = fit(1, 6, 'residual').validation_block_ablations.map(r => r.correct);
  assert.equal(Math.min(...omissions), 28); assert.equal(Math.max(...omissions), 114);
  for (const mode of ['residual', 'scaled', 'rezero']) for (const seed of [1, 2, 3]) assert.equal(fit(seed, 6, mode).validation_block_ablations.length, 6, `${mode} ${seed}`);
});

check('Reading flow: opt-in class, shared flow parts, no card chrome, banners, headings or legends in figures and labs', () => {
  assert.ok(lesson.includes('className="residual-lesson lesson-flow"'));
  for (const source of [figures, labs]) assert.ok(source.includes("from './LessonFlow.jsx'"));
  for (const banned of ['res-eyebrow', 'Live mechanism exploration', 'Reset investigation', 'function Legend', 'rb-legend', 'Named states', 'type="number"', '<h4'])
    for (const [file, source] of [[figuresPath, figures], [labsPath, labs], [gatePath, read(gatePath)]]) assert.ok(!source.includes(banned), `${banned} in ${file}`);
  const css = read('src/learn/components/lesson-labs/residual-buildup.css') + read('src/learn/components/lesson-labs/residual-connections.css') + read('src/learn/components/lesson-labs/residual-gate-intuition.css');
  assert.ok(!/\.rb-figure\s*\{[^}]*background:\s*#/.test(css), 'figure fill removed');
  assert.ok(!/\.res-lab/.test(css), 'lab card style removed');
});

check('Figure before its walk-through, at each major view', () => {
  const order = (figure, walk) => { const a = lesson.indexOf(figure), b = lesson.indexOf(walk); assert.ok(a > 0 && b > a, `${figure} before “${walk}”`); };
  order('<ResidualBlockAnatomy id="residual-block-anatomy"', 'At the top is the ');
  order('<ResidualCorrectionLab', 'The first step gives');
  order('<DegradationTable', 'Going from 18 to 34 layers');
  order('<IdentityRequirementFigure', 'With one linear matrix, both forms');
  order('<ResidualStackFigure id="residual-stack"', 'The forward value also telescopes');
  order('<ResidualBlockAnatomy initialDirection="backward"', 'An addition passes its incoming derivative');
  order('<ResidualDepthLab', 'the derivative halves at every block');
  order('<ResidualStackFigure mode="lambda"', 'Unrolled, the purely direct term');
  order('<ResidualPlacementFigure', 'In the first and third designs');
  order('<ResidualOrderLab', 'With a zero correction the three choices compute');
  order('<ResidualProjectionDiagram', 'The skip computes ');
  order('<ResidualProjectionLab', 'An identity cannot be added to three corrections');
  order('<ResidualOpeningLab', 'the gate\'s own gradient is 1.4');
  order('<DigitNetworkDiagram', 'Every model starts with');
  order('<ResidualPathsFigure', 'For two linear residual blocks, multiplying out');
  order('<ResidualAblationLab', 'For seed 1 with six unscaled residual blocks');
  order('<AddConcatFigure', 'Addition mixes aligned coordinates');
  order('<HighwayBlockDiagram', 'The block computes ');
  order('<HighwayGateFigure', 'In the scalar case the derivative is');
  order('<ResidualDenoisingFigure', 'The second entry rises');
  order('<ResidualEulerLab', 'A step of 0.1 contracts by 0.9');
  order('<ResidualMemoryFigure', 'Backward through a pure addition');
});

check('Review closure: F1 a = −1 step, F2 equation, F3 zero-branch figure, V1/V3 symbols, F5/F6/F8 wording', () => {
  assert.ok(lesson.includes('Finally keep the skips and set "}<Math>{"a=-1"}</Math>{": every branch cancels its skip'));
  assert.ok(lesson.indexOf('Finally keep the skips and set') < lesson.indexOf('The stack figure already hinted at a limit'));
  assert.ok(lesson.includes('<Math>{"dx/dt=f(x)"}</Math>') && lesson.includes('<Math>{"x(t)=e^{-t}"}</Math>'));
  assert.ok(lesson.indexOf('<Math>{"dx/dt=f(x)"}') < lesson.indexOf('<ResidualEulerLab'));
  assert.ok(lesson.indexOf('<ResidualZeroBranchFigure') > lesson.indexOf('Start near identity') && lesson.indexOf('<ResidualZeroBranchFigure') < lesson.indexOf('With the final linear output'));
  assert.ok(!lesson.includes('saved fixture') && !lesson.includes('socket') && !lesson.includes('[batch') && !lesson.includes('O(Bd)'));
  assert.ok(lesson.includes('x+\\\\mathbf s\\\\odot F(x)') && !lesson.includes('x+\\\\lambda\\\\odot F(x)'));
  assert.ok(lesson.includes('recall its internals from the'));
  assert.ok(lesson.includes('“10-crop” means') && lesson.includes('learning-rate warmup (') && lesson.includes('a “1×1 convolution” shortcut'));
  assert.ok(figures.includes("useState('linear')"), 'identity figure opens on the linear branch');
  assert.ok(figures.includes("'⇡'") && figures.includes('× skip removed') && figures.includes('<sub>T</sub>') && figures.includes('⊗ (1 − T)'));
  assert.ok(!/FlowSlider name="Number of steps"/.test(labs) && labs.includes("skip === 'projection' && <FlowChoice"));
});

check('Review closure: L1 fixed log axis with title and reference; L2 diagnostics quoted from the record; L3 chips as control', () => {
  assert.ok(labs.includes('export const evidenceRange = [1e-4, 10]') && labs.includes('yTitle="cross-entropy (nats)"') && labs.includes('reference={{'));
  const d = JSON.parse(read('public/learn-assets/residual-connections/browser-measurements.json'));
  let lo = Infinity, hi = 0; for (const f of d.fits) for (const t of f.trace) for (const v of [t.training.ce, t.validation.ce]) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  assert.ok(lo >= 1e-4 && hi <= 10, `all CE in the fixed range: ${lo}–${hi}`);
  const g = d.fits.find(r => r.seed === 1 && r.depth === 12 && r.mode === 'rezero');
  const a = g.scales.map(Math.abs); close(Math.min(...a), 0.1271, 1e-4); close(Math.max(...a), 0.1423, 1e-4);
  assert.ok(g.scales.some(v => v > 0) && g.scales.some(v => v < 0));
  const moves = Object.entries(g.parameter_displacements).filter(([k]) => /^blocks\.\d+\.(lower|upper)\.weight$/.test(k)).map(([, v]) => v);
  assert.equal(moves.length, 24); close(Math.min(...moves), 2.813, 1e-3); close(Math.max(...moves), 3.304, 1e-3);
  for (const mode of ['plain', 'residual']) { const L = d.fits.find(r => r.seed === 1 && r.depth === 12 && r.mode === mode).trace.find(t => t.step === 0).diagnostics.layers; assert.ok(L[0].activation_gradient_rms > L.at(-1).activation_gradient_rms, `${mode}: no vanishing toward the stem at update 0`); }
  assert.ok(lesson.includes('each between 0.127 and 0.142 in size') && lesson.includes('moved 2.8 to 3.3') && lesson.includes('reached every layer at update 0 in both 12-block models') && !lesson.includes('is not a lost gradient'));
  assert.ok(lesson.indexOf('<ResidualDiagnosticsFigure') > lesson.indexOf('Here are three of those records'));
  assert.ok(labs.includes('res-chips--buttons') && !labs.includes('label="Omit block"'));
});

check('Anchors, H2 sections, §4.1 home and practice/resources conserved', () => {
  const h2 = source => [...source.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]);
  assert.deepEqual(h2(lesson), h2(before));
  for (const id of ['id="residual-block-anatomy"', 'id="residual-stack"']) assert.ok(lesson.includes(id), id);
  assert.equal((lesson.match(/§4\.1/g) || []).length, 1);
  const tail = source => source.slice(source.indexOf('<section className="lesson-ending lesson-ending--practice"'));
  assert.equal(tail(lesson), tail(before).replace(/\r\n/g, '\n'));
});

check('Claim regression: conditions from the previous version are still stated', () => {
  const phrases = [
    'He et al. checked and argued otherwise', 'unlikely', 'not that an optimizer will find the best weights',
    'both can represent the same linear maps', 'Every modification of the skip in the table did worse',
    'Do not confuse this with scaling the', 'not a reproduction of the paper',
    'it is not a theorem that deleting any block is harmless', 'need not mean every internal block has a ResNet shortcut',
    'an arbitrary residual network is not automatically a convergent solver', 'not a measured memory saving',
    'Pre-norm keeps normalization off the direct route', 'Zero per-channel values remain per-channel parameters',
    'zero derivative for ReLU at zero', 'reproduce the exact historical degradation experiment',
  ];
  for (const phrase of phrases) assert.ok(lesson.includes(phrase), phrase);
  assert.ok(/plain networks used BatchNorm/.test(lesson));
  assert.ok(/option A, no parameters/.test(lesson) && /option B/.test(lesson));
  assert.ok(/fixed weighted average/.test(lesson));
});

check('Displayed excerpt is exactly lines 15–62 of the published program', () => {
  const program = read('public/learn-assets/residual-connections/residual-experiments.py').replace(/\r\n/g, '\n').split('\n');
  assert.ok(lesson.includes(JSON.stringify(program.slice(14, 62).join('\n').replace(/\n+$/, ''))));
});

check('Programs, data, models and downloads unchanged', () => {
  const original = JSON.parse(read('docs/teaching/deep-learning-beginner/original/before-reading-flow/sources.json')).topics[topicId];
  for (const file of ['src/learn/data/residual-connections-model.js', 'src/learn/data/residual-buildup-model.js']) assert.equal(hash(file), original[file], file);
  for (const file of fs.readdirSync('public/learn-assets/residual-connections')) {
    const path = `public/learn-assets/residual-connections/${file}`;
    const head = execFileSync('git', ['show', `HEAD:${path}`], { maxBuffer: 64 * 1024 * 1024 });
    const normalize = buffer => buffer.toString('binary').replace(/\r\n/g, '\n');
    assert.equal(normalize(fs.readFileSync(path)), normalize(head), path);
  }
});

check('Changed sources parse; no prediction or reveal gates; hedging density', () => {
  for (const file of [lessonPath, figuresPath, labsPath, gatePath]) parse(read(file), { sourceType: 'module', plugins: ['jsx'] });
  assert.ok(!/check (your )?prediction|reveal (the )?answer|enter your prediction/i.test(lesson + figures + labs));
  const paragraphs = (lesson.match(/<Prose/g) || []).length;
  const hedges = (lesson.match(/does not prove|not a guarantee|not automatically|alone does not|not a claim|is not a certificate/g) || []).length;
  assert.ok(hedges * 4 <= paragraphs, `${hedges} hedges in ${paragraphs} paragraphs`);
});

const result = { topicId, passed: true, checkedAt: new Date().toISOString(), checks };
fs.writeFileSync(receipt, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length, receipt }));
