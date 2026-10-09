// Reading-flow revision checks for Backpropagation & Automatic Differentiation.
// Carries forward every numeric check of verify-backprop-foundations.mjs (revision 7, kept
// unchanged as historical evidence), updates the one intentional change (the worked-network
// lab now opens on the backward view the prose asks for), and adds reading-flow checks:
// figure before walk-through, no card chrome, few lab controls, stable anchors and links.
// Writes its receipt to author-checks-flow.json only (override with BACKPROP_FLOW_RECEIPT).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tinyNetwork, tinyParameters, tinyDefaults } from '../src/learn/data/backprop-beginner-models.js';
import { lineFit, fitDefaults, sharedSquare } from '../src/learn/data/backprop-models.js';

const record = 'docs/teaching/deep-learning-beginner/backpropagation-automatic-differentiation';
const receiptPath = process.env.BACKPROP_FLOW_RECEIPT || `${record}/author-checks-flow.json`;
const original = 'docs/teaching/deep-learning-beginner/original/before-reading-flow/backpropagation-automatic-differentiation';
const read = file => fs.readFileSync(file, 'utf8');
const labs = 'src/learn/components/lesson-labs';
const lesson = read('src/learn/data/topics/backprop.jsx');
const before = read(`${original}/src/learn/data/topics/backprop.jsx`);
const diagrams = read(`${labs}/BackpropComputationDiagrams.jsx`);
const wiring = read(`${labs}/BackpropBeginnerFigures.jsx`);
const labSource = read(`${labs}/BackpropLabs.jsx`);
const shared = read(`${labs}/BackpropShared.jsx`);
const topicSources = ['BackpropLabs.jsx', 'BackpropBeginnerFigures.jsx', 'BackpropComputationDiagrams.jsx', 'BackpropFigures.jsx', 'BackpropIntuitionFigures.jsx', 'BackpropShared.jsx']
  .map(name => read(`${labs}/${name}`)).join('\n');
const topicCss = ['backprop-labs.css', 'backprop-beginner.css', 'backprop-intuition.css', 'backprop-computation-diagrams.css']
  .map(name => read(`${labs}/${name}`)).join('\n');

const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const at = (needle, from = 0) => {
  const index = lesson.indexOf(needle, from);
  assert.ok(index >= 0, `lesson is missing: ${needle}`);
  return index;
};
const before_ = (first, second, why) => assert.ok(at(first) < at(second), why || `${first} must come before ${second}`);

// ---- Numeric checks carried forward from revision 7 ----
check('One-neuron backward values: seed 1, a 4, z 4, wx 4, b 4, w 8, x 12 (with finite differences)', () => {
  const x = 2, w = 3, b = -1, y = 1;
  const z = w * x + b, a = Math.max(0, z);
  assert.equal(z, 5); assert.equal(a, 5); assert.equal(0.5 * (a - y) ** 2, 8);
  const ga = a - y, gz = ga * (z > 0 ? 1 : 0), gwx = gz, gb = gz, gw = gwx * x, gx = gwx * w;
  assert.deepEqual([ga, gz, gwx, gb, gw, gx], [4, 4, 4, 4, 8, 12]);
  const L = (xx, ww, bb) => 0.5 * (Math.max(0, ww * xx + bb) - y) ** 2;
  const eps = 1e-6;
  for (const [got, fd] of [[gw, (L(x, w + eps, b) - L(x, w - eps, b)) / (2 * eps)], [gx, (L(x + eps, w, b) - L(x - eps, w, b)) / (2 * eps)], [gb, (L(x, w, b + eps) - L(x, w, b - eps)) / (2 * eps)]])
    assert.ok(near(got, fd, 1e-6), `finite difference ${fd} vs ${got}`);
  assert.match(diagrams, /const back = \{ seed: 1, a: 4, z: 4, wx: 4, b: 4, w: 8, x: 12 \}/);
});

check('Multiply close-up keeps x left and w right, and names the loss as the source of the 4', () => {
  const pull = diagrams.slice(diagrams.indexOf('export function MultiplyPullbackDiagram'), diagrams.indexOf('export function LocalRuleStrip'));
  assert.ok(pull.indexOf('x = 2') < pull.indexOf('w = 3'));
  assert.match(pull, /∂L\/∂x = 12/); assert.match(pull, /∂L\/∂w = 8/);
  assert.match(pull, /from the loss, passed back through ReLU/);
  assert.doesNotMatch(pull, /rest of this same neuron/);
});

check('Local rule strip: tanh(0.5) slope × 4 = 3.1458; fan-out total 1 + 2 = 3', () => {
  const t = Math.tanh(0.5), slope = 1 - t * t;
  assert.ok(near(slope, 0.7864477329659274));
  assert.equal((4 * slope).toFixed(4), '3.1458');
  assert.match(lesson, /collect every contribution into the single number/);
});

function independent({ x1, x2, label }) {
  const { W1, b1, W2 } = tinyParameters;
  const z1 = [0, 1].map(j => x1 * W1[0][j] + x2 * W1[1][j] + b1[j]);
  const a1 = z1.map(v => Math.max(0, v));
  const z2 = [0, 1].map(c => a1[0] * W2[0][c] + a1[1] * W2[1][c]);
  const m = Math.max(...z2), e = z2.map(v => Math.exp(v - m)), sum = e[0] + e[1], p = e.map(v => v / sum);
  const g2 = p.map((v, c) => v - (c === label ? 1 : 0));
  const ga1 = [0, 1].map(j => g2[0] * W2[j][0] + g2[1] * W2[j][1]);
  const g1 = ga1.map((v, j) => v * (z1[j] > 0 ? 1 : 0));
  const gW2 = [0, 1].map(j => [0, 1].map(c => a1[j] * g2[c]));
  const gW1 = [0, 1].map(i => [0, 1].map(j => [x1, x2][i] * g1[j]));
  return { z1, a1, p, g2, ga1, gW1, gW2, loss: -Math.log(p[label]) };
}

check('Worked network: every edge and node sensitivity agrees with an independent implementation on 390 states', () => {
  let states = 0;
  for (let x1 = -3; x1 <= 3; x1 += 0.5) for (let x2 = -3; x2 <= 4; x2 += 0.5) for (const label of [0, 1]) {
    const mine = independent({ x1, x2, label }), theirs = tinyNetwork({ x1, x2, label });
    for (let j = 0; j < 2; j++) {
      assert.ok(near(mine.ga1[j], theirs.ga1[j]));
      for (let c = 0; c < 2; c++) assert.ok(near(mine.gW2[j][c], theirs.gW2[j][c]));
      for (let i = 0; i < 2; i++) assert.ok(near(mine.gW1[i][j], theirs.gW1[i][j]));
    }
    for (let c = 0; c < 2; c++) assert.ok(near(mine.g2[c], theirs.g2[c]));
    states++;
  }
  assert.equal(states, 390);
});

check('Worked-network prose values: forward (2, −0.5), p = (0.9820, 0.0180), loss 4.0181; backward 1.9640, 0.9820, edges 1.964 and 3.928', () => {
  const r = independent(tinyDefaults);
  assert.deepEqual(r.z1, [2, -0.5]);
  assert.equal(r.p.map(v => v.toFixed(4)).join(','), '0.9820,0.0180');
  assert.equal(r.loss.toFixed(4), '4.0181');
  assert.equal(r.ga1.map(v => v.toFixed(4)).join(','), '1.9640,0.9820');
  assert.equal(r.gW2[0][0].toFixed(3), '1.964');
  assert.equal(r.gW1[1][0].toFixed(3), '3.928');
  assert.equal(r.gW2[1][0], 0);
  // Changed label: everything scales by −0.0180/0.9820 and reverses sign.
  const a = independent({ ...tinyDefaults, label: 0 });
  assert.equal(a.ga1.map(v => v.toFixed(4)).join(','), '-0.0360,-0.0180');
  assert.equal(a.gW1[1][0].toFixed(4), '-0.0719');
  assert.equal((r.p[1] / -r.p[0]).toFixed(3), '-0.018');
  for (const x2 of [3]) assert.ok(independent({ ...tinyDefaults, x2 }).a1[1] > 0, 'x₂ = 3 switches unit 2 on');
});

check('Worked-network lab is the backward view only (forward stays in the figure above), its questions come first and a key names the orange numbers', () => {
  // Review L1: the forward/backward switch added nothing; the forward figure sits directly above.
  assert.match(wiring, /<WiringDiagram off=\{off\} trueClass=\{tinyDefaults\.label\} r=\{r\} view="forward" \/>/);
  assert.match(wiring, /<WiringDiagram off=\{off\} trueClass=\{label\} r=\{r\} view="backward" \/>/);
  assert.doesNotMatch(wiring, /Edges show|'Forward: weights'/);
  const lab = wiring.slice(wiring.indexOf('export function TinyNetworkLab'));
  assert.equal((lab.slice(0, lab.indexOf('</FlowControls>')).match(/<FlowSlider|<FlowChoice/g) || []).length, 2);
  // The questions for both controls are stated before the lab (review L1).
  before_('Then change the true class, or raise x₂ until unit 2 switches on', '<TinyNetworkLab />');
  // Review L2: the drawing itself says what the orange numbers mean, and writes p − target in full.
  assert.match(lab, /The number on each edge is ∂L\/∂\(that weight\)/);
  // Backward arrowheads sit at the edge start (pointing toward the inputs); forward at the end.
  assert.match(wiring, /markerStart=\{backward \? `url\(#bpb-wiring-\$\{view\}\)` : undefined\} markerEnd=\{backward \? undefined/);
});

check('Investigation A numbers: η 0.1 → loss 0.5 to 0.17; η 1 → 12.5; η 0 unchanged; gradients −2 and −1', () => {
  const at01 = lineFit({ ...fitDefaults, rate: 0.1 });
  assert.equal(at01.weightGradient, -2); assert.equal(at01.biasGradient, -1);
  assert.equal(at01.loss, 0.5); assert.equal(at01.nextLoss.toFixed(2), '0.17');
  assert.equal(lineFit({ ...fitDefaults, rate: 1 }).nextLoss, 12.5);
  assert.equal(lineFit({ ...fitDefaults, rate: 0 }).change, 'unchanged');
  assert.match(labSource, /className="bp-label-residual">r = /);
  assert.doesNotMatch(lesson, /red segments/);
});

check('Investigation B numbers at x = 3: c = 2 → L 27, dL/dx 18; c = −1 → 0 and 0; c = 0 → derivative 6', () => {
  const base = sharedSquare(3, 2); assert.equal(base.loss, 27); assert.equal(base.gradient, 18); assert.equal(base.uGradient, 3);
  const cancel = sharedSquare(3, -1); assert.equal(cancel.loss, 0); assert.equal(cancel.gradient, 0);
  assert.equal(sharedSquare(3, 0).gradient, 6);
});

// ---- Reading-flow checks ----
check('Lesson opts into the shared reading flow and labs use the shared flow components', () => {
  assert.match(lesson, /className="backprop-lesson lesson-flow"/);
  for (const name of ['BackpropLabs.jsx', 'BackpropBeginnerFigures.jsx']) assert.match(read(`${labs}/${name}`), /from '\.\/LessonFlow\.jsx'/);
});

check('Figures come before the prose that walks through them', () => {
  before_('<NeuronComputationDiagram />', 'z=wx+b,\\\\qquad a=', 'neuron circuit before its equations');
  before_('<NudgeChainFigure />', '<strong>{"local rate"}</strong>', 'nudge chain before the local-rate walk-through');
  before_('<NeuronComputationDiagram mode="backward" />', 'Read the orange numbers from the bottom');
  before_('<BackpropSharedLab />', 'Start at the right.');
  before_('Start at the right.', 'Investigation B — edit the reused branch.', 'walk-through before the investigation that uses the same graph');
  before_('<BackpropSharedLab />', '(“v-bar”)', 'shared graph before the bar notation');
  assert.ok(!lesson.includes('<SharedGraphFigure />'), 'the shared graph is drawn once, as the live lab');
  before_('<MultiplyPullbackDiagram />', 'Why multiply by the ');
  before_('<BackpropBroadcastFigure />', 'G=\\\\begin{bmatrix}1&2');
  before_('<MatrixSensitivityFigure />', '\\\\bar A=GB^\\\\top');
  before_('<TinyNetworkFigure />', 'Forward, left to right:');
  before_('<TinyNetworkLab />', 'Backward, right to left:');
  before_('<CrossEntropySignalFigure />', 'Now the algebra.');
  before_('<EngineOrderFigure />', 'Step through it.');
  // Review F1: Investigation C's terms and question come before the lab, not after it.
  before_('Two opposite errors decide', '<strong>{"Investigation C — choose a check you can interpret."}</strong>', 'truncation and rounding error are defined before the investigation');
  before_('<strong>{"Investigation C — choose a check you can interpret."}</strong>', '<BackpropDifferenceLab />', 'the investigation question comes before the lab');
});

check('Investigation C opens on a state that matches its first sentence (review F1)', () => {
  const lab = labSource.slice(labSource.indexOf('export function BackpropDifferenceLab'));
  assert.match(lab, /useState\('sine'\)/);
  assert.match(lab, /useState\(-1\)/, 'the lab opens at h = 10^-1');
  assert.match(lesson, /It opens on .*h=10\^\{-1\}.*where the curve visibly bends between the points and truncation error dominates/);
  // At h = 0.1 the secant really is shallower than the curve at x = 1, and truncation dominates:
  const h = 0.1, x = 1, secant = (Math.sin(x + h) - Math.sin(x - h)) / (2 * h), exact = Math.cos(x);
  assert.ok(secant < exact, 'the dashed secant tilts less than the curve');
  assert.ok(near(exact - secant, 9.0005e-4, 1e-7), `truncation error ${exact - secant}`);
  // Only the opening step claims a visible bend; smaller steps say the curve already looks straight.
  assert.match(lab, /exponent === -1\s*\?\s*'The curve visibly bends between the two points/);
  assert.match(lab, /'At this magnification the curve already looks straight, yet truncation still dominates/);
});

check('Reading-flow review minor closures', () => {
  // F2: the shared graph's direction is not misdescribed as the neuron circuit's.
  assert.match(lesson, /read left to right \(the neuron circuit ran top to bottom; the parts are the same\)/);
  // F3: the target is explained in the cross-entropy figure's own caption.
  assert.match(topicSources, /Probability minus target \(1 for the true class, 0 otherwise\)/);
  // F4: the matrix figure names the output sensitivities it uses.
  assert.match(topicSources, /sensitivity ∂L\/∂y₁ = 2/);
  assert.match(topicSources, /sensitivity ∂L\/∂y₂ = −1/);
  // F5: teaching-autodiff.py is linked at its first mention.
  const firstMention = lesson.indexOf('teaching-autodiff.py');
  assert.ok(lesson.lastIndexOf('<a href={"/learn-assets/backpropagation/teaching-autodiff.py"}>', firstMention) > firstMention - 120, 'first mention is a link');
  // V1: the shared graph draws dashed orange reverse arrows and puts the u total under u.
  const graph = labSource.slice(labSource.indexOf('function SharedGraphDiagram'), labSource.indexOf('export function BackpropSharedLab'));
  assert.match(graph, /className="bpc-reverse" markerEnd=\{`url\(#\$\{uid\}-b\)`\}/);
  assert.match(graph, /∂L\/∂u = 1 \+/);
  // V3: the checkpointing layer count is n, not L (which names the loss).
  assert.match(lesson, /ideal chain of "\}<Math>\{"n"\}<\/Math>\{" similarly sized layers/);
  // V4: recorded samples are violet computed values (tick labels have their own check below).
  assert.match(topicCss, /\.bp-sample \{ fill: var\(--bpb-computed\)/);
  // L3: the duplicated static graph is gone from the source.
  assert.doesNotMatch(topicSources, /SharedGraphFigure|sharedKey/);
});

check('Log-axis tick labels render every digit as a superscript (closure: lost backslash in V4)', () => {
  // Evaluate the component's own formatter source, so a regex typo cannot pass unnoticed.
  const figures = read(`${labs}/BackpropFigures.jsx`);
  const match = figures.match(/export const logTickLabel = (value => `[^\n]*`);/);
  assert.ok(match, 'logTickLabel is defined on one line');
  const logTickLabel = (0, eval)(`(${match[1]})`);
  const expected = { 1e-30: '10⁻³⁰', 1e-20: '10⁻²⁰', 1e-10: '10⁻¹⁰', 1e-3: '10⁻³', 1e-2: '10⁻²', 1e-1: '10⁻¹', 1: '10⁰' };
  for (const [value, label] of Object.entries(expected)) assert.equal(logTickLabel(Number(value)), label, `tick ${value}`);
  assert.match(figures, /logarithmic \? logTickLabel\(value\)/, 'the chart uses the checked formatter');
});

check('Investigation A residual label stays clear of both fitted lines and the "after one step" label at every learning rate (closure: F7)', () => {
  const lab = labSource.slice(labSource.indexOf('export function BackpropFitLab'));
  assert.match(lab, /const afterLabelY = py\(model\.rows\[1\]\.nextPrediction\) \+ 4;/, '"after one step" stays at its own line end');
  assert.match(lab, /return \[top \+ 10, \(top \+ bottom\) \/ 2 \+ 4, bottom - 2\]\.reduce/);
  assert.match(lab, /<text x=\{px\(row\.x\) \+ 8\} y=\{residualLabelY\(row\)\} className="bp-label-residual">/);
  const glyph = 6.6, height = 13;
  const box = (x, y, text) => ({ x0: x, x1: x + text.length * glyph, y0: y - height + 2, y1: y + 2 });
  const hits = (b, x1, y1, x2, y2) => { for (let t = 0; t <= 1; t += 0.01) { const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; if (x >= b.x0 - 2 && x <= b.x1 + 2 && y >= b.y0 - 2 && y <= b.y1 + 2) return true; } return false; };
  for (let step = 0; step <= 20; step++) {
    const rate = step / 20, m = lineFit({ ...fitDefaults, rate });
    const values = [0, ...m.rows.flatMap(r => [r.target, r.prediction, r.nextPrediction])];
    const low = Math.min(...values) - 1, high = Math.max(...values) + 1;
    const px = x => 60 + (x - 0.75) * 170, py = y => 228 - (y - low) / (high - low) * 200;
    const row = m.rows[1], afterY = py(row.nextPrediction) + 4;
    const top = Math.min(py(row.target), py(row.prediction)), bottom = Math.max(py(row.target), py(row.prediction));
    const residualY = [top + 10, (top + bottom) / 2 + 4, bottom - 2].reduce((best, y) => Math.abs(y - afterY) > Math.abs(best - afterY) ? y : best);
    const label = box(px(2) + 8, residualY, 'r = −1'), after = box(px(2) + 10, afterY, 'after one step');
    assert.ok(!hits(label, px(1), py(m.rows[0].prediction), px(2), py(row.prediction)), `η ${rate}: label on the current line`);
    assert.ok(!hits(label, px(1), py(m.rows[0].nextPrediction), px(2), py(row.nextPrediction)), `η ${rate}: label on the next line`);
    assert.ok(!(label.x0 < after.x1 && after.x0 < label.x1 && label.y0 < after.y1 && after.y0 < label.y1), `η ${rate}: label on "after one step"`);
    assert.ok(after.x1 <= 400 && after.y0 >= 20 && after.y1 <= 240, `η ${rate}: "after one step" inside the drawing`);
  }
});

check('No card chrome: figures render no title heading, no eyebrow or "live exploration" banner', () => {
  assert.doesNotMatch(topicSources, /neural-eyebrow|LIVE EXPLORATION|Live exploration|className="[^"]*eyebrow/);
  const figure = shared.slice(shared.indexOf('export function BackpropFigure'), shared.indexOf('export function BackpropSteps'));
  assert.doesNotMatch(figure, /\{title\}\s*</, 'BackpropFigure must not render its title as visible text');
  assert.match(figure, /aria-label=\{title\}/);
  assert.doesNotMatch(topicCss, /\.backprop-figure\s*\{[^}]*border:\s*1px/);
});

check('Each lab offers at most three controls', () => {
  const labsIn = source => source.split('<FlowLab').slice(1).map(part => part.slice(0, part.indexOf('</FlowLab>')));
  for (const part of [...labsIn(labSource), ...labsIn(wiring)]) {
    const controls = (part.match(/<FlowSlider|<FlowChoice/g) || []).length;
    assert.ok(controls >= 1 && controls <= 3, `lab with ${controls} controls`);
  }
});

check('Section headings, the code-route anchor and cross-lesson links are unchanged', () => {
  const heads = text => [...text.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]);
  assert.deepEqual(heads(lesson), heads(before));
  assert.match(lesson, /<section id="backprop-code-route">/);
  for (const anchor of ['#neuron-anatomy', '#neuron-network-wiring']) assert.ok((lesson + topicSources).includes(anchor), anchor);
});

const receipt = { topicId: 'backpropagation-automatic-differentiation', revision: 'reading-flow', passed: true, checks: checks.length, names: checks };
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length, receipt: receiptPath }));
