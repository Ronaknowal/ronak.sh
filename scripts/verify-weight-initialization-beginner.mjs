// Author checks for the Weight Initialization lesson (beginner buildup, then reading flow).
// Writes its receipt to LESSON_RECEIPT when set, so a later revision never overwrites an earlier
// revision's receipt; the default remains the revision-5 path.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse } from '@babel/parser';
import { layerDraws, layerInput, layerForward, manyDrawAverages, upstreamGradient, probeSchemes, probePrediction, firstAdamChange, widthShapes } from '../src/learn/data/weight-initialization-buildup.js';

const id = 'weight-initialization-xavier-kaiming-p';
const lessonPath = `src/learn/data/topics/${id}.jsx`;
const read = file => readFileSync(file, 'utf8');
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const close = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));
const lesson = read(lessonPath);
const records = JSON.parse(read('src/learn/data/weight-initialization-measurements.json'));
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

// Independent loop implementation of one layer for comparison with the model module.
function reference(std, draw) {
  const rows = layerDraws[draw];
  const scores = [];
  for (let j = 0; j < 4; j++) { let z = 0; for (let i = 0; i < 4; i++) z += std * rows[j][i] * layerInput[i]; scores.push(z); }
  const out = scores.map(z => (z > 0 ? z : 0));
  let q = 0, h = 0; for (let i = 0; i < 4; i++) { q += layerInput[i] ** 2 / 4; h += out[i] ** 2 / 4; }
  return { scores, out, q, factor: h / q };
}

check('Layer figure: model matches an independent loop for every draw and scale, including s = 0', () => {
  for (const draw of ['A', 'B', 'C']) for (const std of [0, 0.01, 0.5, 0.7071, 1.5]) {
    const model = layerForward(std, draw), ref = reference(std, draw);
    model.scores.forEach((z, j) => assert.ok(close(z, ref.scores[j], 1e-12)));
    assert.ok(close(model.inputSecondMoment, ref.q, 1e-12));
    if (std > 0) assert.ok(close(model.realizedFactor, ref.factor, 1e-12));
    assert.ok(close(model.expectedFactor, 2 * std * std, 1e-12));
  }
});

check('Layer figure: quoted h₁ trace (draw A, s = 0.5) and Σx² = 4.49', () => {
  const model = layerForward(0.5, 'A');
  assert.deepEqual(model.weights[0].map(w => Number(w.toPrecision(3))), [0.32, 0.1, -0.225, 0.545]);
  assert.equal(Number(model.scores[0].toFixed(4)), -0.6535);
  assert.equal(model.outputs[0], 0);
  assert.ok(lesson.includes('(0.32)(1.2)+(0.1)(-0.4)+(-0.225)(0.8)+(0.545)(-1.5)=-0.654'));
  assert.ok(close(layerInput.reduce((s, x) => s + x * x, 0), 4.49, 1e-12));
});

check('Layer figure: at the reachable s = 0.71 the draws read about 0.41, 0.65, 1.27 (as the prose says); multiplier/s² is invariant in s; draws are below/near/above the middle of the single-draw spread', () => {
  const factors = ['A', 'B', 'C'].map(d => layerForward(0.71, d).realizedFactor);
  assert.deepEqual(factors.map(f => Number(f.toFixed(2))), [0.41, 0.65, 1.27]);
  assert.ok(lesson.includes('it reads about 0.41, 0.65 and 1.27'));
  for (const d of ['A', 'B', 'C']) { const ratios = [0.01, 0.3, 0.7071, 1.5].map(s => layerForward(s, d).realizedFactor / (s * s)); ratios.forEach(r => assert.ok(close(r, ratios[0], 1e-10))); }
  const perS2 = ['A', 'B', 'C'].map(d => layerForward(1, d).realizedFactor);
  // Independent simulated spread (Python, 200,000 draws): quartiles ≈ 0.36 and 2.88, median ≈ 1.27.
  assert.ok(perS2[0] > 0.36 && perS2[0] < 1.27 && Math.abs(perS2[1] - 1.27) < 0.05 && perS2[2] > 1.27 && perS2[2] < 2.88, perS2.join(','));
  const tiny = layerForward(0.01, 'A').realizedFactor; assert.ok(tiny > 5e-5 && tiny < 2e-4, 'tiny ≈ a ten-thousandth');
  assert.ok(Math.abs(2 * 0.7071 ** 2 - 1) < 1e-4, 'Kaiming preset rounds to factor 1');
});

check('Layer figure backward trace: ∂/∂xᵢ = Σⱼ Wⱼᵢ·gateⱼ·gⱼ matches an independent loop; zero score gets slope 0', () => {
  for (const draw of ['A', 'B', 'C']) for (const std of [0.5, 1.5]) {
    const layer = layerForward(std, draw), rows = layerDraws[draw].map(r => r.map(e => std * e));
    const z = rows.map(r => r.reduce((a, w, i) => a + w * layerInput[i], 0));
    for (let i = 0; i < 4; i++) { let g = 0; for (let j = 0; j < 4; j++) if (z[j] > 0) g += rows[j][i] * upstreamGradient[j]; assert.ok(close(layer.inputGradient[i], g, 1e-12)); }
  }
  assert.deepEqual(layerForward(0, 'A').inputGradient, [0, 0, 0, 0]);
});

check('1,000-draw readout: forward ÷ s² ≈ 2 (exact expectation n/2), backward ≈ 1.84 exact for this fixed gradient, ≈40% within a factor of two', () => {
  const many = manyDrawAverages(1000, 2026);
  assert.ok(Math.abs(many.forward - 2) < 0.1, many.forward);
  const g2 = upstreamGradient.reduce((a, g) => a + g * g, 0), gs = upstreamGradient.reduce((a, g) => a + g, 0);
  const exactBackward = 2 + (gs * gs - g2) / (2 * Math.PI * g2);   // gate/weight correlation within a row
  assert.equal(Number(exactBackward.toFixed(2)), 1.84);
  assert.ok(Math.abs(many.backward - exactBackward) < 0.1, many.backward);
  assert.equal(Number(many.backward.toFixed(2)), 1.87);
  assert.ok(many.withinFactorTwo > 0.35 && many.withinFactorTwo < 0.45);
  assert.ok(lesson.includes('about 1.87 "}<InlineMath>{"s^2"}') && lesson.includes('the exact value for that input and gradient is 1.84'));
  const large = manyDrawAverages(100000, 7); assert.ok(Math.abs(large.forward - 2) < 0.03 && Math.abs(large.backward - exactBackward) < 0.03);
});

const q0 = records.propagation[0].layers[0].q;
const layersOf = scheme => records.propagation.find(row => row.seed === 1 && row.scheme === scheme).layers;

check('Stack figure and §2: per-seed q₂₀/q₀ and prediction misses match the records and the prose', () => {
  const ratio = (seed, scheme) => { const L = records.propagation.find(r => r.seed === seed && r.scheme === scheme).layers; return L[20].q / L[0].q; };
  const kaiming = [1, 2, 3].map(seed => ratio(seed, 'kaiming')), orthogonal = [1, 2, 3].map(seed => ratio(seed, 'orthogonal'));
  const all = [...kaiming, ...orthogonal];
  assert.equal(Number(Math.min(...all).toFixed(2)), 0.2); assert.equal(Number(Math.max(...all).toFixed(1)), 3);
  assert.equal(Number(orthogonal[0].toFixed(2)), 0.24); assert.equal(Number(orthogonal[1].toFixed(1)), 3);
  const miss = (seed, scheme, factor) => { const L = records.propagation.find(r => r.seed === seed && r.scheme === scheme).layers; return L[0].q * factor ** 20 / L[20].q; };
  for (const scheme of ['small', 'xavier', 'kaiming', 'large']) {
    const f = { small: 0.0032, xavier: 0.5, kaiming: 1, large: 8 }[scheme];
    assert.deepEqual([1, 2, 3].map(seed => Number(miss(seed, scheme, f).toFixed(2))), [1.36, 5.02, 0.69], scheme);
  }
  assert.deepEqual([1, 2, 3].map(seed => Number(miss(seed, 'orthogonal', 1).toFixed(2))), [4.19, 0.33, 1.2]);
  assert.ok(lesson.includes('Three seeds support no ranking between Gaussian and orthogonal'));
});

check('Prediction table: derived factors, same 1.358/1.173 miss for every Gaussian row, orthogonal ×4.19', () => {
  const factors = Object.fromEntries(probeSchemes.map(s => [s.id, probePrediction(s.variance, q0, records.cotangentRms).factor]));
  assert.deepEqual([factors.small, factors.xavier, factors.kaiming, factors.large].map(f => Number(f.toFixed(6))), [0.0032, 0.5, 1, 8]);
  assert.equal(factors.zero, 0);
  for (const scheme of ['small', 'xavier', 'kaiming', 'large']) {
    const p = probePrediction(probeSchemes.find(s => s.id === scheme).variance, q0, records.cotangentRms), m = layersOf(scheme);
    assert.equal(Number((p.finalSecondMoment / m[20].q).toFixed(3)), 1.358, scheme);
    assert.equal(Number((p.inputGradientRms / m[0].g).toFixed(3)), 1.173, scheme);
  }
  const o = probePrediction(null, q0, records.cotangentRms);
  assert.equal(Number((o.finalSecondMoment / layersOf('orthogonal')[20].q).toFixed(2)), 4.19);
  assert.equal(layersOf('zero')[20].q, 0);
  assert.equal(layersOf('zero')[0].g, 0);
});

check('Adam first step: η·(active inputs) standard, width-independent under μP, with measured 1/√m logit shrinkage', () => {
  const standard = [32, 64, 128, 256].map(n => firstAdamChange(n, 0.003, 'standard').hiddenChange);
  const mu = [32, 64, 128, 256].map(n => firstAdamChange(n, 0.003, 'mu'));
  assert.deepEqual(standard.map(v => Number(v.toFixed(6))), [0.048, 0.096, 0.192, 0.384]);
  mu.forEach(row => { assert.ok(close(row.hiddenChange, 0.048)); assert.ok(close(row.readoutChange, 0.048)); });
  const logits = [32, 64, 128].map(n => records.widthFits.find(r => r.mode === 'mu' && r.seed === 1 && r.rate === 0.01 && r.width === n).trace.find(t => t.step === 0).coordinate_mean_abs[4]);
  assert.deepEqual(logits.map(v => Number(v.toFixed(3))), [0.381, 0.308, 0.17]);
  assert.equal(Number((logits[2] / logits[0]).toFixed(3)), 0.448);
  assert.equal(widthShapes(96).map(s => s.changing).join(','), '1,2,1');
});

check('Adam first step in PyTorch: each entry moves by η·g/(|g|+ε); a half-active unit changes by η·n/2', () => {
  const python = process.env.LESSON_PYTHON || 'scratch/lesson-tools/Scripts/python.exe';
  assert.ok(existsSync(python), 'tested Python environment');
  const program = `import sys; sys.dont_write_bytecode = True
import json, torch
out = {}
for n in (32, 64, 128):
    torch.manual_seed(0)
    h = torch.zeros(n, dtype=torch.float64); h[: n // 2] = 1.0
    w = torch.nn.Parameter(torch.randn(n, dtype=torch.float64) * (2 / n) ** 0.5)
    for mode, rate in (("standard", 0.003), ("mu", 0.003 / (n / 32))):
        p = torch.nn.Parameter(w.detach().clone())
        opt = torch.optim.Adam([p], lr=rate)
        z0 = (p * h).sum()
        loss = -(p * h).sum()          # gradient -h: every active entry pushed the same way
        opt.zero_grad(); loss.backward(); opt.step()
        out[f"{mode}-{n}"] = float((p.detach() * h).sum() - z0.detach())
print(json.dumps(out))`;
  const result = JSON.parse(execFileSync(python, ['-c', program], { encoding: 'utf8' }));
  for (const n of [32, 64, 128]) {
    assert.ok(close(result[`standard-${n}`], 0.003 * n / 2, 1e-6), `standard ${n}`);
    assert.ok(close(result[`mu-${n}`], 0.048, 1e-6), `mu ${n}`);
  }
});

check('Practice 7 and 8 worked answers', () => {
  assert.equal(Number((64 * 0.01 / 2).toFixed(4)), 0.32);
  assert.equal(Number((0.32 ** 10 / 1e-5).toFixed(2)), 1.13);
  assert.equal(Number((1.28 ** 10).toFixed(1)), 11.8);
  assert.ok(close(0.002 * 96, 0.192)); assert.ok(close((0.002 / 8) * 96, 0.024));
  assert.ok(close(0.002 * 24, 0.048)); assert.ok(close((0.002 / 2) * 24, 0.024));
  assert.ok(close(Math.log(10), 2.302585, 1e-6));
});

check('Changed JSX/JS parses', () => {
  for (const file of [lessonPath, 'src/learn/components/lesson-labs/InitializationBuildupFigures.jsx', 'src/learn/components/lesson-labs/WeightInitializationLabs.jsx', 'src/learn/components/lesson-labs/InitializationUpdateIntuition.jsx', 'src/learn/data/weight-initialization-buildup.js'])
    parse(read(file), { sourceType: 'module', plugins: ['jsx'] });
});

check('Preserved programs, records and models are byte-identical to the protected originals', () => {
  const original = JSON.parse(read('docs/teaching/deep-learning-beginner/original/original-sources-positions-6-10.json')).topics[id];
  // The correlated-update figure lost only its card heading in the reading-flow revision; its arithmetic is unchanged.
  for (const file of ['src/learn/data/weight-initialization-models.js', 'src/learn/data/weight-initialization-measurements.json'])
    assert.equal(hash(file), original[file], file);
  const status = execFileSync('git', ['status', '--porcelain', '--', `public/learn-assets/${id}`, `docs/teaching/drafts/${id}`], { encoding: 'utf8' });
  assert.equal(status.trim(), '', 'public programs/data and the revision-3 packet are unchanged');
});

check('Revision-3 generator refuses to overwrite the directly edited lesson', () => {
  const before = hash(lessonPath), beforeRecords = hash('src/learn/data/weight-initialization-measurements.json');
  const run = spawnSync(process.execPath, ['scripts/generate-weight-initialization-lesson.mjs'], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.equal(hash(lessonPath), before);
  assert.equal(hash('src/learn/data/weight-initialization-measurements.json'), beforeRecords);
});

check('Hedging density: at most one stock hedge per four prose paragraphs', () => {
  const paragraphs = (lesson.match(/<Prose/g) || []).length;
  const hedges = (lesson.match(/does not prove|not a certificate|not automatically|alone does not|not evidence|does not guarantee|does not establish|not a guarantee/g) || []).length;
  assert.ok(hedges * 4 <= paragraphs, `${hedges} hedges in ${paragraphs} paragraphs`);
});

check('Reading flow: opt-in, no card components, figures before their walk-throughs, no forward reference to an untaught recipe', () => {
  assert.ok(lesson.includes('className="neural-lesson initialization-lesson lesson-flow"'));
  const figures = read('src/learn/components/lesson-labs/InitializationBuildupFigures.jsx'), labs = read('src/learn/components/lesson-labs/WeightInitializationLabs.jsx');
  for (const [name, source] of [['figures', figures], ['labs', labs]]) {
    assert.ok(!/NeuralLab|NeuralNumber|NeuralSelect|neural-eyebrow|<h4/.test(source), `${name} still uses card/lab chrome`);
    assert.ok(source.includes("from './LessonFlow.jsx'"), `${name} uses the shared flow components`);
  }
  const before = (figure, walkThrough) => { const a = lesson.indexOf(figure), b = lesson.indexOf(walkThrough); assert.ok(a > 0 && b > a, `${figure} precedes "${walkThrough}"`); };
  before('<LayerAnatomyFigure />', 'Follow the drawing from left to right');
  before('<LayerScaleFigure />', 'Every weight is "}<InlineMath>{"s"}</InlineMath>{" times its drawn number');
  before('<ManyDrawsFigure />', 'The dashed amber line is the average over draws');
  before('<StackChainFigure />', 'Read the chain in order');
  before('<LayerBackwardFigure />', 'Backward flow runs from right to left');
  before('<InitializationMomentsLab />', 'Each panel places the four values');
  before('<HalfMassFigure />', 'The shaded humps plot');
  before('<FanShapeFigure />', 'Its matrix ');
  before('<EllipseFigure />', 'The circle becomes an ellipse');
  before('<ReluJacobianFigure />', 'At this point the first coordinate');
  before('<InitializationSymmetryLab />', 'The amber labels are the weights');
  before('<DigitArchitectureStrip />', 'Each input is an 8-by-8 image');
  before('<WidthShapesFigure />', 'Each rectangle is one weight matrix');
  before('<AdamUnitFigure />', 'Adam divides each weight');
  before('<TruncationFigure />', 'bounds are absolute values');
  // The probe's walk-through defines the cotangent, RMS and probe score before the lab plots them.
  before('the backward signal that starts at the output', '<InitializationSignalLab />'); before('root mean square', '<InitializationSignalLab />');
  assert.ok(!lesson.includes('Kaiming preset') && !lesson.includes('RepeatedLayerFigure'), 'no preset or prediction column before the derivation');
});

check('Reading flow: every lab offers at most three controls (plus step/start-over buttons for the stepped symmetry trace)', () => {
  const source = read('src/learn/components/lesson-labs/WeightInitializationLabs.jsx') + read('src/learn/components/lesson-labs/InitializationBuildupFigures.jsx');
  for (const block of source.split(/\nexport function /).slice(1)) {
    const name = block.slice(0, block.indexOf('('));
    const controls = (block.match(/<FlowChoice|<FlowSlider/g) || []).length;
    const buttons = (block.match(/<button/g) || []).length;
    assert.ok(controls <= 3, `${name}: ${controls} controls`);
    assert.ok(buttons === 0 || name === 'InitializationSymmetryLab', `${name}: unexpected buttons`);
  }
});

check('Reading flow: new worked numbers (four values, ellipse gains, many-draws histogram)', () => {
  const stats = values => { const n = values.length, mean = values.reduce((a, v) => a + v, 0) / n, q = values.reduce((a, v) => a + v * v, 0) / n; return { mean, q, variance: q - mean * mean }; };
  const relu = values => values.map(v => Math.max(0, v));
  const sym = stats([-2, -1, 1, 2]), symAfter = stats(relu([-2, -1, 1, 2]));
  assert.deepEqual([sym.q, sym.variance, symAfter.q, symAfter.mean, symAfter.variance], [2.5, 2.5, 1.25, 0.75, 0.6875]);
  const shifted = stats([-1, 0, 2, 3]), shiftedAfter = stats(relu([-1, 0, 2, 3]));
  assert.deepEqual([shifted.q, shiftedAfter.q], [3.5, 3.25]);
  assert.ok(lesson.includes('3.5 → 3.25') && lesson.includes('the variance becomes 0.6875'));
  assert.equal(Number(Math.sqrt(1.9).toFixed(3)), 1.378); assert.equal(Number(Math.sqrt(0.1).toFixed(3)), 0.316);
  const many = manyDrawAverages(1000, 2026);
  assert.equal(many.values.length, 1000);
  assert.ok(close(many.values.reduce((a, v) => a + v, 0) / 1000, many.forward, 1e-12));
  assert.equal(Number(many.median.toFixed(2)), 1.24);
  assert.ok(lesson.includes('The median single draw is only about 1.24'));
});

check('Review closure: coordinate check opens on step 150 and the prose walks through both views with the recorded values', () => {
  const labs = read('src/learn/components/lesson-labs/WeightInitializationLabs.jsx');
  assert.ok(labs.includes('const [step, setStep] = useState(150), [tensor, setTensor] = useState(4);'));
  const fits = mode => step => tensor => records.widthFits.filter(r => r.mode === mode && r.seed === 1 && r.rate === 0.01).sort((a, b) => a.width - b.width)
    .map(r => r.trace.find(t => t.step === step).coordinate_mean_abs[tensor].toFixed(3)).join(', ');
  const quoted = [[fits('mu')(0)(4), '0.381, 0.308, and 0.170'], [fits('mu')(150)(4), '6.906, 7.368 and 6.694'], [fits('standard')(150)(4), '6.906, 9.729 and 12.254'],
    [fits('mu')(5)(4), '0.421, 0.376, 0.288'], [fits('standard')(5)(4), '0.421, 0.625, 1.069'], [fits('mu')(150)(3), '3.355, 3.058, 2.970'], [fits('standard')(150)(3), '3.355, 2.933, 2.836']];
  for (const [computed, text] of quoted) {
    assert.equal(computed, text.replace(', and ', ', ').replace(' and ', ', '), text);
    assert.ok(lesson.includes(text), 'prose quotes ' + text);
  }
  const before = (a, b) => { const i = lesson.indexOf(a), j = lesson.indexOf(b); assert.ok(i > 0 && j > i, a + ' precedes ' + b); };
  before('The question is whether a tensor keeps a similar typical size', '<CoordinateCheckLab />');
  before('<InitialLogitTable />', 'So μP passes this coordinate check');
});

check('Review closure: probe loss named before the backward readout, recipes given operative meaning, m/n switch announced, symmetry gradients drawn', () => {
  const figures = read('src/learn/components/lesson-labs/InitializationBuildupFigures.jsx'), labs = read('src/learn/components/lesson-labs/WeightInitializationLabs.jsx');
  assert.ok(!figures.includes('∂score/∂x'), 'backward readout uses ∂L/∂x');
  const loss = lesson.indexOf('of some final loss'), backward = lesson.indexOf('<LayerBackwardFigure />');
  assert.ok(loss > 0 && loss < backward, 'loss named before the backward figure');
  assert.ok(lesson.includes('s=\\\\sqrt{1/64}=0.125') && lesson.includes('a matrix built so that it keeps every vector'));
  assert.ok(lesson.indexOf('no longer mean fan-in and fan-out') > lesson.indexOf('m=n/n_0'));
  assert.ok(labs.includes('hiddenGradient={result.hiddenGradient} headGradient={result.headGradient}'));
  assert.ok(figures.includes('∂L/∂w') && figures.includes('∂L/∂v'));
  assert.ok(!figures.includes('>J_f'), 'Jacobian label uses a real subscript');
  assert.ok(lesson.includes('much larger than "}<InlineMath>{"\\\\epsilon"}'), 'Adam ε condition restored');
});

const record = { topicId: id, revision: process.env.LESSON_REVISION || 5, passed: true, checkedAt: new Date().toISOString(), checks,
  sources: Object.fromEntries([lessonPath, 'src/learn/components/lesson-labs/InitializationBuildupFigures.jsx', 'src/learn/components/lesson-labs/initialization-buildup.css', 'src/learn/components/lesson-labs/WeightInitializationLabs.jsx', 'src/learn/data/weight-initialization-buildup.js', 'scripts/generate-weight-initialization-lesson.mjs'].map(f => [f, hash(f)])) };
writeFileSync(process.env.LESSON_RECEIPT || `docs/teaching/deep-learning-beginner/${id}/author-checks.json`, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length }));
