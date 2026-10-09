// Reading-flow revision checks for Transfer Learning & Fine-Tuning.
// Carries forward the revision-7 numeric checks (verify-transfer-foundations.mjs, now historical)
// and adds reading-flow structure: opt-in, no card chrome, figure before its walk-through,
// minimal lab controls, and the arithmetic every new lab readout states.
// Writes its receipt to the topic's author-checks-flow.json (override with TRANSFER_FLOW_RECEIPT).
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { transferStrategy } from '../src/learn/data/transfer-learning-strategy.js';
import { loraForward, loraStep, batchNormFixture, batchNormForward, adapterBudget, selectTransferCandidate } from '../src/learn/data/transfer-learning-model.js';
import { freezeSwitchesStep, freezeFixture } from '../src/learn/data/transfer-learning-freeze.js';

const topicId = 'transfer-learning-fine-tuning-strategies';
const read = file => fs.readFileSync(file, 'utf8');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lessonFile = 'src/learn/data/topics/' + topicId + '.jsx';
const figuresFile = 'src/learn/components/lesson-labs/TransferBuildupFigures.jsx';
const intuitionFile = 'src/learn/components/lesson-labs/TransferIntuitionFigures.jsx';
const labsFile = 'src/learn/components/lesson-labs/TransferLearningLabs.jsx';
const freezeFile = 'src/learn/data/transfer-learning-freeze.js';
const cssFiles = ['transfer-learning.css', 'transfer-buildup.css', 'transfer-intuition.css'].map(name => 'src/learn/components/lesson-labs/' + name);
const lesson = read(lessonFile), figures = read(figuresFile), intuition = read(intuitionFile), labs = read(labsFile);
const css = Object.fromEntries(cssFiles.map(file => [file, read(file)]));
const experiment = JSON.parse(read('src/learn/data/transfer-learning-experiment.json'));
const before = read('docs/teaching/deep-learning-beginner/original/before-reading-flow/' + topicId + '/' + lessonFile);
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

check('Lesson opts into the shared reading flow; every component module imports LessonFlow', () => {
  assert.match(lesson, /className="transfer-lesson lesson-flow"/);
  for (const source of [figures, labs, intuition]) assert.match(source, /LessonFlow\.jsx/);
});

check('No card chrome: no eyebrows, banners or headings inside figures and labs', () => {
  for (const source of [figures, labs, intuition]) {
    assert.ok(!/Live exploration|eyebrow|<h3|<h4/.test(source), 'banner or heading in a component');
  }
  assert.ok(!/\.tb-figure[^{]*\{[^}]*(border|background)/.test(css[cssFiles[1]]), 'tb-figure frame');
  assert.ok(!/\.transfer-intuition\s*\{[^}]*(border|background)/.test(css[cssFiles[2]]), 'transfer-intuition frame');
  assert.ok(!/\.transfer-lab\b|transfer-eyebrow|transfer-test-report|transfer-evidence-cards/.test(css[cssFiles[0]]), 'old lab card classes');
});

check('Visual vocabulary: added-and-trained is dashed amber; no dashed cyan; negative values blue', () => {
  const all = Object.values(css).join('\n');
  assert.ok(!/9bdced/i.test(all), 'old cyan #9bdced remains');
  assert.match(css[cssFiles[1]], /\.tb-lora-routes > \.is-added-route \{ border-inline: 2px dashed var\(--tl-param\); \}/);
  assert.match(css[cssFiles[2]], /\.transfer-adapter-detour \{ border-inline: 2px dashed #e4b752; \}/);
  assert.match(css[cssFiles[1]], /li\.is-negative \{ background: rgba\(131, 180, 232/);
  assert.match(intuition, /stroke="#83b4e8"/); // "different" = blue ring
});

check('Each figure comes before the prose that walks through it', () => {
  const at = text => { const i = lesson.indexOf(text); assert.ok(i > 0, text); return i; };
  const pairs = [
    ['<TransferNetworkFigure />', 'Follow one image along the arrows'],
    ['<FeatureVectorFigure />', 'Source training did change something'],
    ['<NearestMeanToyFigure />', 'Class P has training codes'],
    ['<FeatureTestFigure />', 'Read the counts first'],
    ['<CoAdaptationFigure />', 'Read the rows top to bottom'],
    ['<ProbeInformationFigure />', 'In panel A the information is all there'],
    ['<TransferStrategyMap />', 'Notice what the options expose'],
    ['<BatchNormPolicyFigure />', 'Call both lines at the start of each training epoch'],
    ['<FrozenGradientFigure />', 'In rows 1 and 2 a trainable module upstream'],
    ['<TransferPartitionsFigure />', 'Two of those jobs need names'],
    ['<OuterProductFigure />', 'Both routes give the same change'],
    ['<LowRankDirectionFigure />', 'All three corrections lie on the line'],
    ['<LoraLocationFigure />', 'Read the drawing top to bottom'],
    ['Read the drawing top to bottom', 'y=Wx+sB(Ax)'],
    ['<TransferLoraLab />', 'the correction is zero and the output is just'],
    ['<AdapterCorrectionFigure />', 'The detour squeezes the features'],
    ['<TransferScheduleFigure />', 'Name its pieces'],
  ];
  for (const [first, then] of pairs) assert.ok(at(first) < at(then), `${first} before ${then}`);
  // Every figure/lab tag is preceded by a lead sentence, not by another figure.
  for (const match of lesson.matchAll(/\n<(Transfer\w+|\w+Figure)( [^>]*)? \/>/g)) {
    if (match[1].endsWith('Program')) continue; // code follows its setup commands, not a lead sentence
    const prior = lesson.slice(0, match.index).trimEnd();
    assert.ok(prior.endsWith('</Prose>') || prior.endsWith('</ol>'), match[1] + ' lacks a lead sentence');
  }
});

check('Labs offer only the controls their question needs (at most four, typically one to three)', () => {
  const sources = { ...splitFunctions(labs), ...splitFunctions(figures) };
  const labs_ = Object.entries(sources).filter(([, body]) => /<FlowLab/.test(body));
  assert.ok(labs_.length >= 9);
  for (const [name, body] of labs_) {
    const controls = (body.match(/<FlowChoice|<FlowSlider|<button /g) || []).length;
    assert.ok(controls >= 1 && controls <= 4, `${name}: ${controls} controls`);
    assert.ok(/<FlowReadout/.test(body), name + ' has no live readout');
    assert.ok(!/your prediction|check (your )?prediction|commit (your )?prediction|reveal|check your answer/i.test(body), name + ' has a prediction or reveal gate');
  }
  assert.ok(!/<select|type="number"|type="checkbox"/.test(labs + figures), 'old select, number box or checkbox control remains');
});
function splitFunctions(source) {
  const out = {};
  const parts = source.split(/\nexport function /);
  for (const part of parts.slice(1)) out[part.slice(0, part.indexOf('('))] = part;
  return out;
}

check('Strategy map counts: probe 85, partial 613, full and scratch 2,693; all-stage options are the six measured runs', () => {
  const presets = {
    scratch: { start: 'random', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
    probe: { start: 'learned', lower: false, upper: false, lora: false, adapter: false, slowLower: false },
    partial: { start: 'learned', lower: false, upper: true, lora: false, adapter: false, slowLower: false },
    full: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
    discriminative: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: true },
    lora2: { start: 'learned', lower: false, upper: false, lora: true, adapter: false, slowLower: false },
    adapter4: { start: 'learned', lower: false, upper: false, lora: false, adapter: true, slowLower: false },
  };
  assert.deepEqual(['probe', 'partial', 'full', 'scratch'].map(k => transferStrategy(presets[k]).trainable), [85, 613, 2693, 2693]);
  for (const key of ['scratch', 'probe', 'full', 'discriminative', 'lora2', 'adapter4']) {
    const plan = transferStrategy(presets[key]);
    const run = experiment.runs.find(row => row.seed === 1 && row.method === plan.method);
    assert.ok(run, key); assert.equal(plan.trainable, run.trainable_parameters, key);
  }
  assert.match(figures, /const layerOptions = \['probe', 'partial', 'full', 'scratch'\];/);
  assert.match(figures, /const measuredOptions = \['scratch', 'probe', 'full', 'discriminative', 'lora2', 'adapter4'\];/);
});

check('Running-statistics lab: training moves buffers to 0.2 and 1.1; evaluation leaves them', () => {
  const train = batchNormForward(batchNormFixture());
  assert.ok(close(train.batchMean, 2) && close(train.unbiasedVariance, 2));
  assert.ok(close(train.nextMean, 0.2) && close(train.nextVariance, 1.1));
  const evalMode = batchNormForward({ ...batchNormFixture(), training: false });
  assert.equal(evalMode.nextMean, 0); assert.equal(evalMode.nextVariance, 1);
  // Gradient recording does not govern the buffer update.
  const recorded = batchNormForward({ ...batchNormFixture(), recording: true });
  assert.ok(close(recorded.nextMean, 0.2));
});

check('Freeze-switches lab (evaluation mode, target (0, 2)): the frozen set-up passes a nonzero input gradient; only gradients plus optimizer membership change γ and β, and that step lowers the loss', () => {
  // Expected values match PyTorch BatchNorm1d in float64 with eval(), running mean 0 and variance 1, eps 1e-5.
  assert.deepEqual(freezeFixture.target, [0, 2]);
  const start = { gamma: 1, beta: 0 };
  const frozen = freezeSwitchesStep(start, { trainable: false, optimizer: false });
  assert.equal(frozen.gradGamma, null); assert.equal(frozen.gradBeta, null);
  assert.ok(close(frozen.inputGradient[0], 0.99999000009999, 1e-9) && close(frozen.inputGradient[1], 0.99998000022499, 1e-9), 'input gradient ≈ (1, 1)');
  assert.ok(frozen.inputGradient.every(value => Math.abs(value) > 0.9), 'frozen set-up must show a nonzero input gradient');
  assert.equal(frozen.nextGamma, 1); assert.equal(frozen.nextBeta, 0);
  assert.ok(close(frozen.loss, 0.99998000027499, 1e-9));
  const gradientOnly = freezeSwitchesStep(start, { trainable: true, optimizer: false });
  assert.ok(close(gradientOnly.gradGamma, 3.99993000077499, 1e-9) && close(gradientOnly.gradBeta, 1.99998000014999, 1e-9));
  assert.equal(gradientOnly.nextGamma, 1); assert.equal(gradientOnly.nextBeta, 0);
  const trains = freezeSwitchesStep(start, { trainable: true, optimizer: true });
  assert.ok(close(trains.nextGamma, 0.60000699992250, 1e-9) && close(trains.nextBeta, -0.19999800001500, 1e-9));
  const after = freezeSwitchesStep({ gamma: trains.nextGamma, beta: trains.nextBeta }, { trainable: true, optimizer: true });
  assert.ok(close(after.loss, 0.15999680018799, 1e-9) && after.loss < trains.loss, 'one step lowers the loss');
  // After one step the β gradient is ε-residue (2e-5); the readout rounds gradients to 4 decimals so it shows 0.
  const display = (value, digits = 4) => (Number(value.toFixed(digits)) + 0).toLocaleString('en-US', { maximumFractionDigits: digits }).replace('-', '−');
  assert.ok(Math.abs(after.gradBeta) < 5e-5 && display(after.gradBeta) === '0', 'β gradient residue displays as 0');
  assert.ok(!/number\(result\.grad(Gamma|Beta), 6\)/.test(labs), 'gradients are not shown with six decimals');
  assert.ok(labs.includes('freezeSwitchesStep(params, affineSetups[setup])'));
  assert.ok(lesson.includes('runs in evaluation mode and normalizes the batch (1, 3) with the stored buffers'));
  assert.ok(lesson.includes('the target (0, 2)'));
  assert.ok(lesson.includes('The frozen set-up still reports an input gradient, about (1, 1)'));
});

check('Review closure: section-7 order, co-adaptation legend, captions that survive stacking, a/b → A/B bridge, evidence-lab order and axis title', () => {
  const at = text => { const i = lesson.indexOf(text); assert.ok(i > 0, text); return i; };
  const rule = at('<Prose>{"The choice follows from the declared rule."}</Prose>');
  const verdict = at('<Prose>{"So the answer to the opening question');
  assert.ok(rule < verdict && !lesson.slice(rule, verdict).includes('<Transfer'), 'verdict follows the rule without the cap lab between them');
  assert.ok(at('Forgetting needs the same care') < at('<TransferBudgetRuleLab />') && at('<TransferBudgetRuleLab />') < at('<TransferEvidenceLab />'));
  assert.ok(lesson.includes('A different declared rule can choose differently from the same evidence.'));
  assert.ok(lesson.includes('after the predeclared seed-1 selection (section 3)'));
  assert.ok(figures.includes('solid amber: trains (baseB from its own random start; B4B+ layers 1–4 from baseB’s weights)'));
  assert.ok(!/trains from copied weights/.test(figures));
  for (const source of [figures, intuition, labs]) assert.ok(!/left to right|right to left|Left:|Right:/.test(source), 'direction words that break when stacked');
  assert.ok(!/On the left|On the right/.test(lesson));
  assert.ok(intuition.includes('line through b') && !intuition.includes('line through B'));
  assert.ok(lesson.includes('with a single pair, "}<Math>{"A"}</Math>{" is just the row "}<Math>{"a"}</Math>{" and "}<Math>{"B"}</Math>{" the column "}<Math>{"b"}</Math>'));
  const evidence = labs.slice(labs.indexOf('export function TransferEvidenceLab'));
  assert.ok(evidence.indexOf('<FlowControls>') < evidence.indexOf('<TransferTraceTable'), 'controls directly under the plot, table after');
  assert.ok(labs.includes('cross-entropy (nats)'));
  assert.ok(labs.includes("back to 0.0003125, never 0"));
  assert.ok(labs.includes('<summary className="transfer-part-title">Every image’s group, by source ID (all 400 IDs)</summary>'));
});

check('LoRA lab states: (2, 1) gives loss 2.5 → 2.025; (1, 3) gives Ax = −2 and ∂L/∂B = (−2, −6); (1, 1) and both-zero give no gradient', () => {
  const state = (x, A = [[1, -1]]) => ({ rank: 1, A, B: [[0], [0]], x, target: [0, 0], alpha: 1, rate: 0.1 });
  const a = loraForward(state([2, 1]));
  assert.equal(a.loss, 2.5); assert.deepEqual(a.gradB.map(r => r[0]), [2, 1]); assert.ok(a.gradA[0].every(v => v === 0));
  const stepped = loraStep(state([2, 1]));
  assert.deepEqual(stepped.next.B.map(r => Number(r[0].toFixed(12))), [-0.2, -0.1]);
  assert.ok(close(stepped.after.loss, 2.025));
  const b = loraForward(state([1, 3]));
  assert.equal(b.bottleneck[0], -2); assert.deepEqual(b.gradB.map(r => r[0]), [-2, -6]);
  const c = loraForward(state([1, 1]));
  assert.equal(c.bottleneck[0], 0); assert.ok(c.loss > 0);
  assert.ok([...c.gradA[0], ...c.gradB.map(r => r[0])].every(v => v === 0));
  const z = loraForward(state([2, 1], [[0, 0]]));
  assert.ok([...z.gradA[0], ...z.gradB.map(r => r[0])].every(v => v === 0));
});

check('LoRA count lab: rank r saves for the 32 × 64 lower layer only while r ≤ 21', () => {
  assert.equal(21 * 96, 2016); assert.ok(21 * 96 < 2048); assert.equal(22 * 96, 2112); assert.ok(22 * 96 > 2048);
  assert.equal(2 * (32 + 64), 192);
  assert.match(labs, /The saving disappears at r = 22, where 22 × 96 = 2,112 exceeds 2,048\./);
});

check('Adapter count lab: d = 16, m = 4 gives adapter 148, with head 233, 2,796 bytes', () => {
  const budget = adapterBudget(16, 4, true);
  assert.equal(budget.adapter, 148); assert.equal(budget.count, 233); assert.equal(budget.bytes, 2796);
});

check('Budget-rule lab and prose: 400 → LoRA; 250 → probe; 84 → none', () => {
  assert.equal(selectTransferCandidate(experiment.runs, 400, 1).winner.method, 'lora2');
  assert.equal(selectTransferCandidate(experiment.runs, 250, 1).winner.method, 'probe');
  assert.equal(selectTransferCandidate(experiment.runs, 84, 1).winner, null);
  assert.match(lesson, /At 400, LoRA wins; at 250, the probe beats the eligible adapter; at 84, nothing fits\./);
});

check('Carried forward: LoRA shape table matches the program', () => {
  const program = read('src/learn/assets/transfer-learning/transfer-experiments.py');
  assert.match(program, /self\.lower = nn\.Linear\(64, 32\)/);
  assert.match(program, /self\.upper = nn\.Linear\(32, 16\)/);
  assert.match(program, /def __init__\(self, base, rank=2, alpha=2\.\)/);
  assert.match(program, /self\.B = nn\.Parameter\(torch\.zeros\(base\.out_features, rank\)\)/);
  assert.match(program, /nn\.init\.normal_\(self\.A, std=\.1\)/);
  for (const { k, d } of [{ k: 64, d: 32 }, { k: 32, d: 16 }]) assert.ok(figures.includes(`<td>${k}</td><td>${d} × ${k}</td><td>2 × ${k}</td><td>${d} × 2</td><td>${d}</td>`));
  assert.ok(figures.includes('rank r = 2, α = 2, so s = α / r = 1'));
});

check('Carried forward: nearest-mean toy, adapter trace and outer product arithmetic', () => {
  assert.equal(Math.hypot(0, 2).toFixed(2), '2.00'); assert.equal(Math.hypot(4, 2).toFixed(2), '4.47');
  const signed = (value, digits = 6) => value.toFixed(digits).replace('-', '−');
  const hidden = Math.tanh(-1), up = [.5 * hidden, -.25 * hidden];
  assert.equal(signed(1 + up[0]), '0.619203'); assert.equal(signed(2 + up[1]), '2.190399');
  const a = [1, -1], b = [1, 2], x = [2, 1];
  const delta = b.map(bi => a.map(aj => bi * aj));
  assert.deepEqual(delta.map(row => row[0] * x[0] + row[1] * x[1]), [1, 2]);
  assert.match(lesson, /distance 2 from \(2, 2\) and "\}<Math>\{"\\\\sqrt\{4\^2\+2\^2\}\\\\approx4\.47"\}<\/Math>/);
});

check('Restored conditions found by claim regression are present', () => {
  for (const [source, text] of [
    [figures, 'a batch adds a leading dimension N'],
    [labs, 'not the official UCI benchmark split'],
    [labs, 'Whether gradients are recorded makes no difference to this update; only the mode decides.'],
    [intuition, 'Example values after some training, so the up weights are no longer zero'],
    [intuition, 'no deterministic head receiving only this feature'],
    [figures, 'counts include weights and biases'],
    [lesson, 'The program performs all 18 target fits'],
    [lesson, 'Freezing "}<Math>{"W"}</Math>{" prevents its parameter update; it does not remove the operation'],
    [lesson, 'Doubling "}<Math>{"h"}</Math>{" does not generally double the correction'],
    [lesson, 'Only the added correction is restricted; the base'],
    [lesson, 'so a probe\'s score alone does not identify the cause'],
  ]) assert.ok(source.includes(text), text);
});

check('Practice, endings, anchors and H2 headings unchanged; programs and data byte-identical', () => {
  const marker = '<div id="transfer-section-10"';
  assert.equal(lesson.slice(lesson.indexOf(marker)), before.slice(before.indexOf(marker)));
  const ids = s => [...s.matchAll(/id="(transfer-section-\d+|transfer-code-route)"/g)].map(m => m[1]);
  const h2 = s => [...s.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]);
  assert.deepEqual(ids(lesson), ids(before)); assert.deepEqual(h2(lesson), h2(before));
  const snapshot = JSON.parse(read('docs/teaching/deep-learning-beginner/original/before-reading-flow/sources.json')).topics[topicId];
  // The mechanism-program data file was filtered out of that snapshot by name; the earlier protected manifest holds it.
  const earlier = JSON.parse(read('docs/teaching/deep-learning-beginner/original/original-sources.json')).topics[topicId];
  for (const file of ['src/learn/assets/transfer-learning/transfer-experiments.py', 'src/learn/assets/transfer-learning/feature-inspection.py', 'src/learn/assets/transfer-learning/digits-400.csv', 'src/learn/assets/transfer-learning/data-provenance.md', 'src/learn/data/transfer-learning-features.json', 'src/learn/data/transfer-learning-experiment.json', 'src/learn/data/transfer-learning-specimens.json', 'src/learn/data/transfer-learning-model.js', 'src/learn/data/transfer-learning-strategy.js', 'src/learn/data/transfer-learning-mechanism-program.js'])
    assert.equal(hash(file), snapshot[file] ?? earlier[file], file);
});

check('Hedging density: at most one stock hedge per four teaching paragraphs', () => {
  const paragraphs = (lesson.match(/<Prose/g) || []).length;
  const hedges = (lesson.match(/does not prove|not a certificate|not automatically|alone does not|not a claim|not a guarantee|no guarantee/g) || []).length;
  assert.ok(hedges * 4 <= paragraphs, `${hedges} hedges / ${paragraphs} paragraphs`);
});

check('Changed JSX parses', () => {
  for (const source of [lesson, figures, intuition, labs, read(freezeFile)]) parse(source, { sourceType: 'module', plugins: ['jsx'] });
});

const receipt = { topicId, revision: 'reading-flow', checkedAt: new Date().toISOString(), passed: true, checks, sources: Object.fromEntries([lessonFile, figuresFile, intuitionFile, labsFile, freezeFile, ...cssFiles].map(file => [file, hash(file)])) };
const destination = process.env.TRANSFER_FLOW_RECEIPT || `docs/teaching/deep-learning-beginner/${topicId}/author-checks-flow.json`;
fs.writeFileSync(destination, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ topicId, passed: true, checks: checks.length, receipt: destination }));
