// Author checks for the Loss Functions reading-flow revision: presentation contract (opt-in,
// no figure cards, figure before walk-through, small lab control sets, notation), every new
// stated value recomputed independently, and preservation of programs, data, anchors and the
// practice/ending block against the protected pre-revision copy. Writes author-checks-flow.json
// (override with LESSON_RECEIPT); it never touches earlier receipts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { fittedConstant, focalTerm, confusionAt, tripletGeometry, candidateCompetition } from '../src/learn/data/loss-functions-models.js';
import measurements from '../src/learn/data/loss-functions-measurements.js';

const topicId = 'loss-functions-ce-mse-focal-contrastive-triplet';
const lesson = `src/learn/data/topics/${topicId}.jsx`;
const labs = 'src/learn/components/lesson-labs/LossFunctionsLabs.jsx';
const figures = 'src/learn/components/lesson-labs/LossIntuitionFigures.jsx';
const css = ['src/learn/components/lesson-labs/loss-functions-labs.css', 'src/learn/components/lesson-labs/loss-intuition.css'];
const sourceFiles = [lesson, labs, figures, ...css];
const snapshotRoot = 'docs/teaching/deep-learning-beginner/original/before-reading-flow';
const output = process.env.LESSON_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks-flow.json`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');
const close = (a, b, tolerance = 5e-5) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const receipt = { topicId, revision: 'reading-flow', passed: false, checks: [] };
const check = (name, body) => { body(); receipt.checks.push({ name, passed: true }); };
const functionBody = (source, name) => {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, name);
  const next = source.indexOf('\nexport function ', start + 10);
  return source.slice(start, next < 0 ? undefined : next);
};

try {
  const lessonSource = read(lesson), labSource = read(labs), figureSource = read(figures);

  check('Lesson opts into the reading flow and labs use the shared flow components', () => {
    assert.ok(lessonSource.includes('className="neural-lesson neural-lesson-neutral lesson-flow loss-functions-lesson"'));
    assert.ok(labSource.includes("from './LessonFlow.jsx'") && figureSource.includes("from './LessonFlow.jsx'"));
  });

  check('No figure cards, banners or in-figure headings remain', () => {
    assert.ok(!/NeuralLab\b|LIVE EXPLORATION|neural-eyebrow/.test(labSource));
    assert.ok(!/<h3|<h4|<figcaption/.test(labSource + figureSource));
    assert.ok(!/className="[^"]*(loss-intuition-figure|loss-enc-|loss-training-)/.test(labSource + figureSource + lessonSource));
    const cssText = css.map(read).join('\n');
    assert.ok(!/\.lf-figure\s*\{[^}]*(border|background)\s*:/.test(cssText), 'figure container has no frame or fill');
  });

  check('Each figure comes before the prose that walks through it', () => {
    const order = [
      ['<LossUpdateFigure', 'Steps 1 to 3 run forward'], ['<TangentFigure', 'The dashed tangent touches the curve'],
      ['<CountVersusLossFigure', 'Read down the middle column'], ['<PullBalanceFigure', 'Read each row'],
      ['<QuantileBalanceFigure', 'At estimate 3.5, two measurements'], ['<ProbabilityPenaltyFigure', 'The chain rule explains'],
      ['figure="softmax-classes"', 'Column 2 exponentiates'], ['figure="softmax-classes"', 'Written as formulas'],
      ['<FocalFactorFigure', 'Multiply across each row'], ['<FocalFactorFigure', 'L_{\\\\mathrm{focal}}'],
      ['<EmbeddingEncoderFigure', 'The three photos are supplied inputs'], ['<PairPenaltyFigure', 'A matching pair keeps paying'],
      ['figure="softmax-candidates"', 'Dividing by '], ['<SimClrPipelineFigure', 'The photos are supplied and the augmentations make the views'],
      ['<SimClrMaskFigure', 'Each row of the second table'], ['<AngularMarginFigure', 'The feature stays on the solid ray'],
      ['<ReductionFigure', 'Summing tokens gives the long sequence'],
    ];
    for (const [figure, walk] of order) {
      const f = lessonSource.indexOf(figure), w = lessonSource.indexOf(walk);
      assert.ok(f >= 0 && w >= 0 && f < w, `${figure} before "${walk}"`);
    }
  });

  check('Each lab offers at most three controls', () => {
    const budgets = { RegressionInfluenceLab: 1, FocalContributionLab: 3, LossDecisionLab: 2, TripletGeometryLab: 3, InfoNceLab: 2 };
    for (const [name, limit] of Object.entries(budgets)) {
      const body = functionBody(labSource, name);
      const controls = (body.match(/<FlowSlider|<FlowChoice|<button /g) || []).length;
      assert.ok(controls <= limit, `${name}: ${controls} controls`);
      assert.ok(body.includes('<FlowReadout'), `${name} has a live readout`);
      assert.ok(!/NeuralNumber|NeuralSelect|type="number"/.test(body), `${name}: no duplicate number boxes`);
    }
  });

  check('Batch notation follows the module vocabulary (N, not B)', () => {
    assert.ok(!/B\\\\times B|2B-1|\{"2B"\}|their N is our B|batch of "\}<InlineMath>\{"B"/.test(lessonSource));
    assert.ok(lessonSource.includes('J(\\\\theta)=\\\\frac1N\\\\sum_{i=1}^{N}'));
    assert.ok(!/B × B|2B − 1|\(B = 2\)/.test(figureSource));
  });

  check('Regression lab: the three answers and their balances', () => {
    const fits = late => ({ mse: fittedConstant([0, 0, 0, 0, 0, 0, late], 'mse'), mae: fittedConstant([0, 0, 0, 0, 0, 0, late], 'mae'), huber: fittedConstant([0, 0, 0, 0, 0, 0, late], 'huber') });
    const ten = fits(10), hundred = fits(100), zero = fits(0);
    close(ten.mse, 10 / 7, 1e-12); close(hundred.mse, 100 / 7, 1e-12);
    assert.equal(ten.mae, 0); assert.equal(hundred.mae, 0);
    close(ten.huber, 1 / 6, 1e-9); close(hundred.huber, 1 / 6, 1e-9);
    [zero.mse, zero.mae, zero.huber].forEach(v => close(v, 0, 1e-12));
    close(6 * 2 * ten.mse, 2 * (10 - ten.mse), 1e-9); close(6 * 2 * hundred.mse, 2 * (100 - hundred.mse), 1e-9);
    close(6 * ten.huber, 1, 1e-9);
  });

  check('Pull balance and quantile figures', () => {
    const data = [0, 0, 0, 0, 0, 0, 10], c = .5;
    const pulls = { mse: r => 2 * r, mae: r => Math.sign(r), huber: r => Math.max(-1, Math.min(1, r)) };
    const down = f => data.filter(y => y < c).reduce((s, y) => s + f(c - y), 0), up = f => -data.filter(y => y > c).reduce((s, y) => s + f(c - y), 0);
    assert.deepEqual([down(pulls.mse), up(pulls.mse), down(pulls.mae), up(pulls.mae), down(pulls.huber), up(pulls.huber)], [6, 19, 6, 1, 3, 1]);
    const q = .75, obs = [1, 2, 3, 4, 10];
    const total = e => obs.reduce((s, y) => s + (y > e ? -q : 1 - q), 0);
    close(total(3.5), -.75, 1e-12); close(total(4.5), .25, 1e-12);
    // At 4 the measurement on the estimate can contribute any pull in [−.75, .25], which contains the value cancelling the rest.
    const rest = obs.filter(y => y !== 4).reduce((s, y) => s + (y > 4 ? -q : 1 - q), 0);
    assert.ok(-rest >= -q && -rest <= 1 - q);
  });

  check('Focal lab: crowd, positive and net pushes, with and without the class factor', () => {
    const net = (count, gamma, alpha) => count * focalTerm(.01, 0, gamma, alpha).slope + focalTerm(.1, 1, gamma, alpha).slope;
    close(net(1000, 0, null), 10 - .9, 1e-9);
    close(1000 * focalTerm(.01, 0, 2, null).slope, .002990, 1e-6); close(focalTerm(.1, 1, 2, null).slope, -1.102019, 1e-6);
    close(net(1000, 2, null), -1.099, 1e-3); close(net(1000, 2, .25), -.2733, 5e-4);
    assert.ok(net(1000, 0, null) > 0 && net(1000, 2, null) < 0);
  });

  check('Decision lab: seed-1 records, the all-nines threshold and the weighted run at .5', () => {
    const specimens = measurements.validation_source_ids.map(id => measurements.specimens.find(row => row.source_id === id));
    const labels = specimens.map(row => row.digit === 9 ? 1 : 0);
    const run = objective => measurements.records.find(r => r.seed === 1 && r.objective === objective);
    for (const objective of ['bce', 'positive_weight_9', 'focal_gamma_2']) assert.ok(run(objective));
    const bce = run('bce').validation_probabilities;
    const lowestNine = Math.min(...bce.filter((_, i) => labels[i]));
    assert.equal(confusionAt(bce, labels, lowestNine).tp, 12);
    assert.ok(confusionAt(bce, labels, lowestNine + 1e-9).tp < 12);
    assert.deepEqual(confusionAt(bce, labels, .5), { tp: 10, fp: 1, fn: 2, tn: 107 });
    assert.equal(confusionAt(run('positive_weight_9').validation_probabilities, labels, .5).fn, 1);
    receipt.decisionLab = { bceAllNinesThreshold: lowestNine, falseAlarmsThere: confusionAt(bce, labels, lowestNine).fp };
  });

  check('Triplet board defaults and margin .3 (unchanged model)', () => {
    assert.ok(labSource.includes('const startingPoints = [[0, 0], [1, 0], [.3, .4], [.72, .96], [1.2, 1.6]];'));
    const start = [[0, 0], [1, 0], [.3, .4], [.72, .96], [1.2, 1.6]];
    const r = tripletGeometry(start, 1, true);
    assert.deepEqual(r.candidates.map(c => c.kind), ['hard', 'semi-hard', 'easy']); assert.equal(r.selected, 1);
    const narrow = tripletGeometry(start, .3, true); assert.equal(narrow.selected, null); close(Math.sqrt(1.3), 1.14, .005);
    const collapsed = tripletGeometry(Array.from({ length: 5 }, () => [0, 0]), 1, true);
    collapsed.candidates.forEach(c => close(c.loss, 1, 1e-12));
    close(Math.sqrt(2), 1.41, .005); close(tripletGeometry(start, 1, false).candidates[1].loss, .8, 1e-12);
  });

  check('InfoNCE lab cases and the candidate trace', () => {
    close(candidateCompetition([.8, .2, -.1], .2).loss, .0591); close(candidateCompetition([.8, .2, -.1], 1).probabilities[0], .5114);
    const negative = candidateCompetition([.8, .9, -.1], .2), sharper = candidateCompetition([.8, .9, -.1], .1);
    assert.ok(sharper.loss > negative.loss);
    [.05, .2, 1, 2].forEach(t => close(candidateCompetition([.4, .4, .4], t).loss, Math.log(3), 1e-12));
  });

  check('Softmax walk-through, SimCLR row and loop/tangent strings', () => {
    const e = [2, 1, -1].map(Math.exp), total = e.reduce((a, b) => a + b);
    close(total, 10.475, 1e-3); close(-Math.log(e[1] / total), 1.349, 1e-4);
    const z = [.9, .3, .2].map(v => v / .5); [1.8, .6, .4].forEach((v, i) => close(z[i], v, 1e-12));
    const s = z.map(Math.exp), st = s.reduce((a, b) => a + b);
    [.6461, .1946, .1593].forEach((v, i) => close(s[i] / st, v)); close(-Math.log(s[0] / st), .4368);
    assert.ok(labSource.includes('values: [[2, 8], [4, 0]]') && labSource.includes('yDomain={[0, 16]}'));
    close(10 * Math.cos(30 * Math.PI / 180), 8.6603); close(10 * Math.cos(40 * Math.PI / 180), 7.6604);
  });

  check('Labels stay clear of the marks they describe', () => {
    // Decision strip: dots start at x(0) = 150; row labels sit in the gutter before it.
    const decision = functionBody(labSource, 'LossDecisionLab');
    assert.ok(decision.includes('const x = p => 150 + p * 430;'));
    assert.ok(/<text x="8" y="76"[^>]*>12 nines<\/text>/.test(decision) && /<text x="8" y="100"[^>]*><tspan x="8">108 other<\/tspan><tspan x="8" dy="1.15em">digits<\/tspan><\/text>/.test(decision));
    // Pair plot: the different-pair label starts at D = .12, height 1.15, where the same-pair
    // curve D² is far below for the label's horizontal extent (D² ≤ .67 up to D = .82).
    assert.ok(figureSource.includes("dashed: true, labelAt: [.12, 1.15]"));
    close(.82 ** 2, .6724, 1e-9);
  });

  check('Independent review closure: order, terms and table fit', () => {
    // F2: the encoder figure stops at distances; margin and the triplet loss are taught later.
    const encoder = functionBody(figureSource, 'EmbeddingEncoderFigure');
    assert.ok(!/margin|max\(0/.test(encoder), 'encoder figure computes no margin loss');
    const t = lessonSource.indexOf('<EmbeddingEncoderFigure'), margin = lessonSource.indexOf('"}<strong>{"margin"}</strong>'), triplet = lessonSource.indexOf('L_{\\\\mathrm{triplet}}');
    assert.ok(t < margin && margin < triplet);
    // F3: the pair equation follows its plot and the plot's reading.
    const plot = lessonSource.indexOf('<PairPenaltyFigure'), reading = lessonSource.indexOf('A matching pair keeps paying'), eq = lessonSource.indexOf('L_{\\\\mathrm{pair}}');
    assert.ok(plot < reading && reading < eq, 'pair plot → reading → equation');
    // F4: the candidate-set details follow the pipeline figure and precede the mask figure.
    const pipe = lessonSource.indexOf('<SimClrPipelineFigure'), details = lessonSource.indexOf('Two details decide which cells'), masks = lessonSource.indexOf('<SimClrMaskFigure');
    assert.ok(pipe < details && details < masks);
    // F7, F8: projection head defined where it first appears; the ArcFace angle is φ, not θ.
    assert.ok(lessonSource.includes('"}<strong>{"projection head"}</strong>{" (a small extra layer'));
    assert.ok(!/theta_y/.test(lessonSource) && lessonSource.includes('\\\\cos(\\\\varphi_y+m)') && !/feature θ|θ \+ m/.test(figureSource));
    // F1: the 2N × 2N mask table always uses its short labels (visible in the key).
    const css = read('src/learn/components/lesson-labs/loss-intuition.css');
    assert.ok(/^\.lf-mask-short \{ display: inline; \}/m.test(css) && /^\.lf-mask-long \{ position: absolute;/m.test(css));
    assert.ok(functionBody(figureSource, 'SimClrMaskFigure').includes('pos (amber): positive'));
    // F10: one image affordance (click a dot) and correct pluralisation.
    const decision = functionBody(labSource, 'LossDecisionLab');
    assert.ok(!decision.includes('Show the image of') && decision.includes("counts.fp === 1 ? 'alarm' : 'alarms'"));
    // F15: the translation-invariance point lives in prose.
    assert.ok(lessonSource.includes('sliding all three points by the same amount'));
  });

  check('No prediction or reveal gate', () => {
    assert.ok(!/check (your )?prediction|reveal (the )?answer|enter your prediction|commit (your )?prediction/i.test(lessonSource + labSource + figureSource));
  });

  check('Changed JSX parses; anchors and practice/ending block equal the pre-revision copy', () => {
    for (const file of [lesson, labs, figures]) parse(read(file), { sourceType: 'module', plugins: ['jsx'] });
    const before = read(`${snapshotRoot}/${topicId}/${lesson}`);
    const anchors = text => [...text.match(/sections=\{\[(.*?)\]\}/s)[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(anchors(lessonSource), anchors(before));
    const ending = text => text.slice(text.indexOf('<section className="lesson-ending lesson-ending--practice"'));
    assert.equal(ending(lessonSource), ending(before));
  });

  check('Programs, data, models and measurements unchanged', () => {
    // Models and measurements are static imports (pre-revision snapshot); the two program
    // modules load lazily, so their protected identity is the pre-revision-5 original copy.
    const before = JSON.parse(read(`${snapshotRoot}/sources.json`)).topics[topicId];
    const original = JSON.parse(read('docs/teaching/deep-learning-beginner/original/original-sources.json')).topics[topicId];
    const preserved = [['src/learn/data/loss-functions-models.js', before], ['src/learn/data/loss-functions-measurements.js', before], ['src/learn/data/loss-functions-program.js', original], ['src/learn/data/loss-mechanisms-program.js', original]];
    for (const [file, record] of preserved) assert.equal(hash(file), record[file], file);
    const baseline = JSON.parse(read('docs/teaching/evidence/concept-intuition-baseline.json')).actualFileHashes;
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
console.log(JSON.stringify({ passed: receipt.passed, checks: receipt.checks.length, failure: receipt.failure, decisionLab: receipt.decisionLab }));
