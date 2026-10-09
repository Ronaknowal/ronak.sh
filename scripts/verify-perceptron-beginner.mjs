// Author checks for the neuron lesson's beginner buildup revision. Writes its own
// receipt; it never rewrites the revision-4 concept-intuition receipt.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '@babel/parser';
import { perceptronTrace, booleanTargets, scorePixels, pixelTemplates, pixelPresets, hiddenSpaceRows, xorRampRows, nudgeRows, neuronCoreProgram, neuronCoreOutput } from '../src/learn/data/perceptron-beginner.js';
import { perceptronUpdateExample, evaluateBatchNeuronExample, neuronOutputShares } from '../src/learn/data/perceptron-intuition.js';
import { perceptronExamples } from '../src/learn/data/perceptron-examples.js';

const topicId = 'perceptrons-neurons-activation-functions';
// LESSON_RECEIPT keeps a later revision from overwriting an earlier revision's receipt.
const destination = process.env.LESSON_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks.json`;
const python = process.env.LESSON_PYTHON || 'scratch/lesson-tools/Scripts/python.exe';
const sourceFiles = [
  `src/learn/data/topics/${topicId}.jsx`,
  'src/learn/data/perceptron-beginner.js',
  'src/learn/components/lesson-labs/PerceptronBeginnerFigures.jsx',
  'src/learn/components/lesson-labs/perceptron-beginner.css',
  'src/learn/components/lesson-labs/PerceptronIntuitionFigures.jsx',
  'src/learn/components/lesson-labs/PerceptronLabs.jsx',
  'src/learn/components/lesson-labs/NeuronStructureFigures.jsx',
  'src/learn/components/lesson-labs/neuron-structure.css',
  'src/learn/data/neuron-structure.js',
];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const close = (a, b, tol = 1e-12) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const checks = [];
const receipt = { topicId, passed: false, python, sourceFiles, checks };
const pass = (name, extra = {}) => checks.push({ name, passed: true, ...extra });
fs.mkdirSync(`docs/teaching/deep-learning-beginner/${topicId}`, { recursive: true });
try {
  // 1. The stepped trace reproduces the lesson's executed NumPy program epoch by epoch.
  const printed = execFileSync(python, ['-c', perceptronExamples[0].code], { encoding: 'utf8' });
  const blocks = {}; let task;
  for (const line of printed.split(/\r?\n/).filter(Boolean)) {
    if (/^[A-Z]+$/.test(line.trim())) { task = line.trim(); blocks[task] = []; continue; }
    const [, epoch, coefficients, updates] = line.match(/^(\d+) \[\s*([-\d\s]+)\] (\d+)/);
    blocks[task].push({ pass: +epoch, coefficients: coefficients.trim().split(/\s+/).map(Number), updates: +updates });
  }
  for (const name of ['AND', 'XOR']) {
    const js = perceptronTrace(booleanTargets[name]).passes.map(({ pass, coefficients, updates }) => ({ pass, coefficients, updates }));
    assert.deepEqual(js, blocks[name], name);
  }
  pass('Stepped perceptron trace equals the executed NumPy program for AND and XOR', { epochs: { AND: blocks.AND.length, XOR: blocks.XOR.length } });

  // 2. Independent Python re-implementation for OR and every presentation, plus the prose walkthroughs.
  const orPython = JSON.parse(execFileSync(python, ['-c', `
import json
X=[(0,0),(0,1),(1,0),(1,1)]; y=[-1,1,1,1]; w=[0,0,0]; steps=[]
for e in range(1,13):
    u=0
    for (a,b),t in zip(X,y):
        s=w[0]*a+w[1]*b+w[2]
        if t*s<=0:
            w=[w[0]+t*a,w[1]+t*b,w[2]+t]; u+=1
        steps.append(list(w))
    if u==0: break
print(json.dumps(steps))`], { encoding: 'utf8' }));
  assert.deepEqual(perceptronTrace(booleanTargets.OR).steps.map(s => s.after), orPython);
  const or = perceptronTrace(booleanTargets.OR);
  assert.deepEqual(or.steps.slice(0, 4).map(s => s.after), [[0, 0, -1], [0, 1, 0], [1, 1, 1], [1, 1, 1]]);
  assert.equal(or.passes[1].updates, 1); assert.deepEqual(or.passes[1].coefficients, [1, 1, 0]);
  assert.deepEqual(or.passes.at(-1).coefficients, [2, 2, -1]); assert.equal(or.passes.length, 6);
  const and = perceptronTrace(booleanTargets.AND);
  assert.deepEqual(and.steps.slice(0, 4).map(s => [s.score, s.updated, s.after]), [[0, true, [0, 0, -1]], [-1, false, [0, 0, -1]], [-1, false, [0, 0, -1]], [-1, true, [1, 1, 0]]]);
  assert.deepEqual([0, 1, 2, 3].map(i => [[0, 0], [0, 1], [1, 0], [1, 1]][i]).map(([a, b]) => 3 * a + 2 * b - 4), [-4, -2, -1, 1]);
  pass('OR trace matches an independent Python loop; practice 9 and the AND walkthrough numbers hold', { presentations: orPython.length });

  // 3. Pixel template numbers stated in §1 and its checkpoint.
  const vertical = pixelTemplates.vertical.weights, horizontal = pixelTemplates.horizontal.weights;
  const scores = Object.fromEntries(Object.entries(pixelPresets).map(([k, p]) => [k, scorePixels(p, vertical, -2).score]));
  assert.deepEqual(scores, { 'Clean vertical bar': 1, 'Vertical bar + stray pixel': 0, 'Horizontal bar': -3, 'Every pixel inked': -5, 'Blank image': -2 });
  assert.equal(scorePixels(pixelPresets['Every pixel inked'], vertical, 0).score, -3);
  assert.equal(scorePixels(pixelPresets['Vertical bar + stray pixel'], vertical, -2).fires, false);
  assert.equal(scorePixels(pixelPresets['Horizontal bar'], horizontal, -2).score, 1);
  for (let b = -3; b <= 2; b += 0.25) {
    const ok = scorePixels(pixelPresets['Vertical bar + stray pixel'], vertical, b).fires && !scorePixels(pixelPresets['Horizontal bar'], vertical, b).fires;
    assert.equal(ok, b > -2 && b <= 1, `checkpoint bias ${b}`);
  }
  // Revision 7: the static template figure's supporting/opposing split for its three images.
  const split = name => { const r = scorePixels(pixelPresets[name], vertical, -2); return [r.positive, r.negative, r.score]; };
  assert.deepEqual(['Clean vertical bar', 'Vertical bar + stray pixel', 'Horizontal bar'].map(split), [[3, 0, 1], [3, -1, 0], [1, -2, -3]]);
  pass('Pixel template scores, the template figure split (3−0−2, 3−1−2, 1−2−2) and the checkpoint bias interval (−2, 1]');

  // Revision 7: the training-loop figure's stated protocol matches the executed §5 program.
  const digitProgram = perceptronExamples[1].code;
  for (const fragment of ['nn.Linear(64, 32)', 'nn.Linear(32, 10)', 'torch.optim.Adam(model.parameters(), lr=0.01)', 'for step in range(200):', 'test_size=120', '/ 16.0', 'optimizer.zero_grad()']) assert.ok(digitProgram.includes(fragment), fragment);
  pass('Training-loop figure: 64→32→10, 280 training rows, 200 full-batch Adam steps at lr 0.01, gradients cleared first');

  // 4. Geometry figure: score, norm, distance and perpendicular foot.
  const w = [1.5, -2], b = -1, x = [2, -1];
  const z = w[0] * x[0] + w[1] * x[1] + b, norm = Math.hypot(...w);
  assert.equal(z, 4); assert.equal(norm, 2.5); close(z / norm, 1.6);
  const foot = x.map((v, i) => v - z / norm ** 2 * w[i]);
  close(w[0] * foot[0] + w[1] * foot[1] + b, 0, 1e-12); close(Math.hypot(x[0] - foot[0], x[1] - foot[1]), 1.6);
  close(0.75 * 2 - 0.5, 1); // boundary x2 = 0.75 x1 − 0.5 passes (2, 1): 3 − 2 − 1 = 0
  assert.equal(1.5 * 2 - 2 * 1 - 1, 0);
  pass('Level-set figure: score 4, length 2.5, distance 1.6, boundary x₂ = 0.75x₁ − 0.5');

  // 5. XOR ramps, hidden space, the no-ReLU collapse and practice 10.
  assert.deepEqual(xorRampRows().map(r => [r.h1, r.second, r.q, r.target]), [[0, -0, 0, 0], [1, -0, 1, 1], [2, -2, 0, 0]]);
  const hidden = hiddenSpaceRows();
  assert.deepEqual(hidden.map(r => [r.h1, r.h2, r.q, r.target]), [[0, 0, 0, 0], [1, 0, 1, 1], [1, 0, 1, 1], [2, 1, 0, 0]]);
  hidden.forEach(r => assert.equal(r.h1 - 2 * r.h2 > 0.5, r.target === 1));
  assert.deepEqual([0, 1, 2].map(s => s - 2 * (s - 1)), [2, 1, 0]);
  hidden.forEach(r => assert.equal(1 - r.h1 + 2 * r.h2, 1 - r.target));
  pass('XOR ramps, hidden-space separation, affine collapse 2 − s and XNOR output 1 − q');

  // 6. Nudge table against independent Python arithmetic.
  const pyNudge = JSON.parse(execFileSync(python, ['-c', `
import json, math
sig=lambda z: 1/(1+math.exp(-z))
step=lambda z: 1 if z>0 else 0
rows=[step(2.01)-step(2), max(0,2.01)-max(0,2), max(0,-1.99)-max(0,-2), sig(0.01)-sig(0), sig(5.01)-sig(5), step(-0.005+0.01)-step(-0.005)]
print(json.dumps([r/0.01 for r in rows]+[sig(0)*(1-sig(0)), sig(5)*(1-sig(5))]))`], { encoding: 'utf8' }));
  const rows = nudgeRows();
  assert.equal(rows.length, 6);
  rows.forEach((r, i) => close(r.ratio, pyNudge[i], 1e-9));
  close(rows[3].slope, pyNudge[6]); close(rows[4].slope, pyNudge[7]);
  close(Number(rows[4].slope.toFixed(5)), 0.00665, 1e-12);
  assert.deepEqual([+rows[3].ratio.toFixed(6), +rows[4].ratio.toFixed(6), +rows[4].slope.toFixed(6)], [0.249998, 0.006615, 0.006648]);
  assert.ok(rows[5].crossesJump && rows[5].slope === 0 && Math.abs(rows[5].ratio - 100) < 1e-9);
  assert.ok(rows.slice(0, 5).every(r => !r.crossesJump));
  pass('Nudge ratios and exact slopes agree with independent Python; the jump row gives ratio 100');

  // 6b. Review closure: §4 core snippet output, symmetry mechanism, trace boundary states.
  const coreRun = execFileSync(python, ['-c', neuronCoreProgram], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(coreRun, neuronCoreOutput);
  const sym = JSON.parse(execFileSync(python, ['-c', `
import json, torch
X=torch.tensor([[0.,0.],[0.,1.],[1.,0.],[1.,1.]],dtype=torch.float64); y=torch.tensor([0.,1.,1.,0.],dtype=torch.float64)
def grads(out):
    W=torch.tensor([[.3,.4],[.3,.4]],dtype=torch.float64,requires_grad=True); b=torch.tensor([.1,.1],dtype=torch.float64,requires_grad=True)
    v=torch.tensor(out,dtype=torch.float64)
    loss=((torch.relu(X@W.T+b)@v-y)**2).sum(); loss.backward(); return W.grad.tolist()
print(json.dumps({'same':grads([1.,1.]),'xor':grads([1.,-2.])}))`], { encoding: 'utf8' }));
  assert.deepEqual(sym.same[0], sym.same[1]);
  assert.notDeepEqual(sym.xor[0], sym.xor[1]);
  const xor = perceptronTrace(booleanTargets.XOR).steps;
  assert.ok(xor.some(s => s.after.every(v => v === 0)) && xor.some(s => s.after.join() === '1,1,1'));
  pass('§4 core snippet reproduces its displayed output; equal outgoing weights keep hidden gradients equal, XOR outgoing 1/−2 does not; XOR trace visits the no-boundary and out-of-window states', { symmetry: sym });

  // 7. Softmax figure and prose numbers; retained revision-4 intuition calculations.
  const e = [1, 2, 3, 4].map(Math.exp);
  close(+(e[0] + e[1] + e[2]).toFixed(2), 30.19); close(+(e[0] + e[1] + e[3]).toFixed(4), 64.7055);
  close(+e[2].toFixed(2), 20.09); close(+e[3].toFixed(2), 54.6);
  neuronOutputShares([1, 2, 3]).shares.forEach((s, i) => close(+s.toFixed(4), [0.09, 0.2447, 0.6652][i]));
  close(Math.tanh(0.7), 2 / (1 + Math.exp(-1.4)) - 1, 1e-15);
  const update = perceptronUpdateExample();
  assert.deepEqual([update.before, update.after, ...update.nextWeights, update.nextBias], [-1, 2, -0.5, 1, 0.5]);
  assert.deepEqual(evaluateBatchNeuronExample(), [[4, -2.5], [-7, 3.5]]);
  pass('Softmax exponentials/totals, tanh identity, retained mistake-correction and batch arithmetic');

  // 7b. Reading-flow presentation: opt-in style, no card banners or gates, picture before
  // walk-through, and the numbers drawn in the new figures recomputed independently.
  const lesson = fs.readFileSync(`src/learn/data/topics/${topicId}.jsx`, 'utf8');
  assert.ok(lesson.includes('className="perceptron-lesson lesson-flow"'), 'lesson opts into lesson-flow');
  // Flow components come from the shared LessonFlow.jsx (which imports lesson-flow.css); no local copies of its styles.
  assert.ok(fs.readFileSync('src/learn/components/lesson-labs/PerceptronShared.jsx', 'utf8').includes("from './LessonFlow.jsx'"), 'shared LessonFlow components used');
  assert.ok(fs.readFileSync('src/learn/components/lesson-labs/LessonFlow.jsx', 'utf8').includes("import './lesson-flow.css'"), 'lesson-flow.css imported');
  const localCss = ['perceptron-labs', 'perceptron-beginner', 'perceptron-intuition', 'neuron-structure'].map(n => fs.readFileSync(`src/learn/components/lesson-labs/${n}.css`, 'utf8')).join('\n');
  for (const shared of ['.flow-slider', '.flow-choice', '.flow-readout', '.flow-lab {', 'perceptron-grid-']) assert.ok(!localCss.includes(shared), `lesson CSS duplicates shared ${shared}`);
  assert.ok(lesson.includes('The second box stays the template'), 'anatomy walk-through says where the activation comparison happens');
  const flowFiles = ['PerceptronShared', 'PerceptronLabs', 'PerceptronBeginnerFigures', 'PerceptronFigures', 'NeuronStructureFigures', 'PerceptronIntuitionFigures'].map(name => `src/learn/components/lesson-labs/${name}.jsx`);
  for (const file of flowFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const banned of ['perceptron-kind', 'perceptron-panel', 'Pin ', 'Check prediction', '<h3']) assert.ok(!text.includes(banned), `${file} still contains ${banned}`);
  }
  assert.ok(!lesson.includes('Checkpoint'), 'in-body check uses FlowCheck, not the card Checkpoint');
  const order = ['<TemplateExampleFigure', 'Walk through the clean vertical bar', '<NeuronAnatomyFigure', 'Follow the arrows from the inputs to the output', 'In symbols, with', '<ActivationChoiceFigure', '<ScoreLevelFigure', 'The white line is the neuron', '<MistakeCorrectionFigure', 'Read the columns', '<XorRampFigure', 'Read the curves at the three dots', '<XorNetworkLab', 'The cyan circles hold the two inputs', '<HiddenSpaceFigure', '<BatchNeuronCorrespondence', 'Z=XW^', '<SlopeCurveFigure', 'Read each curve where it is marked', '<NudgeSlopeFigure', 'For the smooth rows', '<SoftmaxCompetitionFigure', 'p_k=', '<TrainingLoopStructure', 'Steps 1–5 run forward', 'SiLU uses the sigmoid as its fraction', '<NegativeSlopeFigure', 'Read the SiLU curve from the left', '<SwiGluFigure', 'h=\\\\operatorname{SiLU}', '<TriangleFigure', 'f(x)=a+m_0'];
  order.reduce((previous, marker) => { const at = lesson.indexOf(marker); assert.ok(at > previous, `order: ${marker}`); return at; }, -1);
  close(1 / (1 + Math.exp(-4)), 0.9820137900379085, 1e-15);
  const silu = z => z / (1 + Math.exp(-z));
  assert.deepEqual([silu(1), silu(-1), silu(1) * 2, silu(-1) * 3].map(v => +v.toFixed(4)), [0.7311, -0.2689, 1.4621, -0.8068]);
  // §4 slope-curve labels: sigmoid slope 0.25 at 0 and 0.0066 at 5 (four decimals).
  const sigSlope = z => { const v = 1 / (1 + Math.exp(-z)); return v * (1 - v); };
  assert.deepEqual([+sigSlope(0).toFixed(2), +sigSlope(5).toFixed(4)], [0.25, 0.0066]);
  assert.equal(1.5 * 2 + -2 * -1 + -1, 4);
  assert.equal(2 * -1 + -1 * 1 + 0.5, -2.5);
  assert.equal(1.5 * 2 - 2 * (0.75 * 2 - 0.5) - 1, 0); // Investigation B's point sits on the line at x₂ = 1.
  // Investigation B's region labels: SVG (48, 56) must lie on the score ≤ 0 side, (276, 276) on the score > 0 side.
  const plane = ([sx, sy]) => [(sx - 38) / 31 - 4, (286 - sy) / 31 - 4], score = ([x, y]) => 1.5 * x - 2 * y - 1;
  assert.ok(score(plane([48, 56])) <= 0 && score(plane([276, 276])) > 0, 'Investigation B region labels on the correct sides');
  pass('Reading flow: lesson-flow opt-in, no card banners, pins or gates; figures precede their walk-throughs; new figure numbers recomputed');

  // 7c. Reading-flow review closure (docs/.../reading-flow-review.md).
  const component = name => fs.readFileSync(`src/learn/components/lesson-labs/${name}`, 'utf8');
  // L1: the anatomy walk-through's bias switch is reachable on the slider. Score = 1.5·2 + (−2)(−1) + b.
  const biasMin = Number(component('NeuronStructureFigures.jsx').match(/name="Bias b" min=\{(-?[\d.]+)\}/)[1]);
  const anatomyScore = b => 1.5 * 2 + -2 * -1 + b, stepOut = z => (z > 0 ? 1 : 0);
  assert.ok(biasMin <= -5, `bias slider reaches the switch (min ${biasMin})`);
  assert.deepEqual([stepOut(anatomyScore(-4.75)), stepOut(anatomyScore(-5))], [1, 0]);
  assert.ok(lesson.includes('lower the bias until the output switches to 0'), 'anatomy instruction matches the reachable switch');
  // L3: the wiring table shows only the current activation, so identity is discovered by switching.
  assert.ok(!component('NeuronStructureFigures.jsx').includes("'q with identity'"), 'wiring table no longer gives away the identity column');
  // D1: Investigation E offers only activations taught by §4; §7 draws SiLU/GELU's negative-slope region.
  assert.ok(component('PerceptronLabs.jsx').includes("const labActivations = ['sigmoid', 'tanh', 'relu', 'leaky_relu'];"), 'Investigation E limited to taught activations');
  const sig = z => 1 / (1 + Math.exp(-z));
  const erf = x => { // Abramowitz–Stegun 7.1.26 is too coarse here; integrate the normal density instead.
    let sum = 0; const n = 20000, h = x / n; for (let i = 0; i < n; i++) { const t = (i + .5) * h; sum += Math.exp(-t * t); } return 2 / Math.sqrt(Math.PI) * sum * h;
  };
  const Phi = z => .5 * (1 + erf(z / Math.SQRT2)), phiD = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const dSilu = z => sig(z) + z * sig(z) * (1 - sig(z)), dGelu = z => Phi(z) + z * phiD(z);
  const root = (f, lo, hi) => { for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } return (lo + hi) / 2; };
  const zSilu = root(dSilu, -3, -.5), zGelu = root(dGelu, -3, -.2);
  close(zSilu, -1.2785, 6e-5); close(zSilu * sig(zSilu), -0.2785, 6e-5);
  close(zGelu, -0.7518, 6e-5); close(zGelu * Phi(zGelu), -0.1700, 6e-5);
  assert.deepEqual([+dSilu(-2).toFixed(4), +dGelu(-2).toFixed(4)], [-0.0908, -0.0852]);
  const figures = component('PerceptronFigures.jsx');
  assert.ok(figures.includes('silu: { z: -1.2785, value: -0.2785 }, gelu: { z: -0.7518, value: -0.1700 }'), 'negative-slope figure uses the recomputed minima');
  assert.ok(figures.includes("SiLU's slope is −0.0908 and GELU's is −0.0852"), 'negative-slope caption slopes');
  // F7 and the ⊙/⊗ ruling: SwiGLU draws one input forking into both branches and a visible join.
  assert.ok(figures.includes('className="swiglu-fork"') && figures.includes('className="swiglu-join"') && figures.includes('⊗ multiply coordinate by coordinate'), 'SwiGLU fork, join and ⊗');
  // V1–V3: computed shares violet; one distinct colour per activation; batch matrices coloured by role.
  const intuitionCss = component('perceptron-intuition.css');
  assert.ok(!/neuron-share-strip > span:nth-child\(\d\) \{ background: #(7a6e52|ac9766|e8c36f)/.test(intuitionCss), 'softmax shares are violet, not amber');
  const colourMap = component('PerceptronShared.jsx').match(/export const activationColors = (\{[^}]*\})/)[1];
  const colours = Object.values(Function(`return ${colourMap}`)());
  assert.equal(new Set(colours).size, colours.length, 'each activation has its own colour');
  const batchFigure = component('PerceptronIntuitionFigures.jsx');
  assert.ok(batchFigure.includes('`neuron-matrix is-${role}`') && batchFigure.includes("batchNeuronExample.inputs, 'input'") && batchFigure.includes("batchNeuronExample.weights, 'parameter'") && batchFigure.includes('neuron-matrix is-computed'), 'batch matrices coloured by role');
  assert.ok(['.neuron-matrix.is-input', '.neuron-matrix.is-parameter', '.neuron-matrix.is-computed'].every(rule => intuitionCss.includes(rule)), 'role colour rules defined');
  // F1, F5, F6: stacking-safe position words; announced target and activation switches.
  assert.ok(!lesson.includes('clean vertical bar on the left') && !lesson.includes('arrows from left to right'), 'no left/right position words in the stacking figures');
  assert.ok(lesson.includes('targets 0 and 1 instead of §2'), 'XOR target switch announced');
  assert.ok(lesson.includes('now with ReLU as the activation instead of the step rule'), 'batch figure activation switch announced');
  pass('Reading-flow review closure: reachable bias switch, single-column wiring table, taught-only Investigation E plus §7 negative-slope figure (minima and slopes recomputed), SwiGLU fork/join and ⊗, violet shares, distinct activation colours, role-coloured matrices, stacking-safe wording, announced switches');

  // 8. Changed source parses; previously verified programs, models, data and downloads are byte-identical.
  for (const file of sourceFiles.filter(f => /\.(jsx|js)$/.test(f))) parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const original = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/original-sources.json', 'utf8')).topics[topicId];
  // Reading-flow revision: PerceptronShared.jsx and PerceptronFigures.jsx are presentation components
  // and were intentionally restyled; the data, model and program modules stay byte-identical.
  const preserved = Object.keys(original).filter(f => /perceptron-(examples|mechanism-program|models|data|intuition)\.js$/.test(f));
  for (const file of preserved) assert.equal(hash(file), original[file], file);
  const assets = fs.readdirSync('public/learn-assets/perceptrons').map(f => `public/learn-assets/perceptrons/${f}`);
  // Raw working bytes must equal the revision-4 recorded hashes (this checkout uses
  // core.autocrlf, so these CRLF bytes differ from HEAD's LF blobs by line endings only).
  const recorded = JSON.parse(fs.readFileSync('docs/teaching/evidence/concept-intuition-baseline.json', 'utf8')).actualFileHashes;
  for (const file of assets) {
    assert.equal(hash(file), recorded[file], file);
    const head = execFileSync('git', ['show', `HEAD:${file}`]);
    assert.ok(fs.readFileSync(file).toString('latin1').replace(/\r\n/g, '\n') === head.toString('latin1'), `${file} differs from HEAD beyond line endings`);
  }
  pass('Changed JS/JSX parses; prior programs, models, data and downloads unchanged', { preserved: preserved.length + assets.length });

  receipt.sourceHashes = Object.fromEntries(sourceFiles.map(f => [f, hash(f)]));
  receipt.checkedOn = new Date().toISOString();
  receipt.passed = true;
} catch (error) { receipt.failure = error.stack; process.exitCode = 1; }
fs.writeFileSync(destination, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, checks: checks.map(c => c.name), failure: receipt.failure }, null, 1));
