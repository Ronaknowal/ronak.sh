// Revision-7 checks for the Transfer Learning foundational-visual completion.
// Complements verify-transfer-beginner.mjs; writes nothing.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';

const read = file => fs.readFileSync(file, 'utf8');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lessonFile = 'src/learn/data/topics/transfer-learning-fine-tuning-strategies.jsx';
const figuresFile = 'src/learn/components/lesson-labs/TransferBuildupFigures.jsx';
const intuitionFile = 'src/learn/components/lesson-labs/TransferIntuitionFigures.jsx';
const lesson = read(lessonFile), figures = read(figuresFile), intuition = read(intuitionFile);
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

check('LoRA shape table matches the program: Linear(64, 32), Linear(32, 16), rank 2, alpha 2, A ~ N(0, 0.1²), B = 0', () => {
  const program = read('src/learn/assets/transfer-learning/transfer-experiments.py');
  assert.match(program, /self\.lower = nn\.Linear\(64, 32\)/);
  assert.match(program, /self\.upper = nn\.Linear\(32, 16\)/);
  assert.match(program, /def __init__\(self, base, rank=2, alpha=2\.\)/);
  assert.match(program, /self\.A = nn\.Parameter\(torch\.empty\(rank, base\.in_features\)\)/);
  assert.match(program, /self\.B = nn\.Parameter\(torch\.zeros\(base\.out_features, rank\)\)/);
  assert.match(program, /nn\.init\.normal_\(self\.A, std=\.1\)/);
  assert.match(program, /self\.scale = alpha \/ rank/);
  const rank = 2, alpha = 2;
  const rows = [{ k: 64, d: 32 }, { k: 32, d: 16 }].map(({ k, d }) => `<td>${k}</td><td>${d} × ${k}</td><td>${rank} × ${k}</td><td>${d} × ${rank}</td><td>${d}</td>`);
  for (const row of rows) assert.ok(figures.includes(row), row);
  assert.equal(alpha / rank, 1);
  assert.ok(figures.includes('rank r = 2, α = 2, so s = α / r = 1'));
  // Factor counts agree with the strategy map's 192 + 96.
  assert.equal(rank * (64 + 32), 192);
  assert.equal(rank * (32 + 16), 96);
});

check('Nearest-mean toy: averages (2, 2) and (6, 6); distances 2 and 4.47; nearest is P', () => {
  const avg = pts => pts[0].map((_, j) => pts.reduce((sum, p) => sum + p[j], 0) / pts.length);
  const mP = avg([[1, 3], [3, 1]]), mQ = avg([[5, 5], [7, 7]]);
  assert.deepEqual(mP, [2, 2]); assert.deepEqual(mQ, [6, 6]);
  const dP = Math.hypot(2 - 2, 4 - 2), dQ = Math.hypot(2 - 6, 4 - 6);
  assert.equal(dP.toFixed(2), '2.00'); assert.equal(dQ.toFixed(2), '4.47');
  assert.ok(dP < dQ);
  assert.match(lesson, /distance 2 from \(2, 2\) and "\}<Math>\{"\\\\sqrt\{4\^2\+2\^2\}\\\\approx4\.47"\}<\/Math>/);
});

check('Adapter trace uses U+2212 minus and reproduces h′ = (0.619203, 2.190399)', () => {
  const signed = (value, digits = 6) => value.toFixed(digits).replace('-', '−');
  const hidden = Math.tanh(-1);
  const up = [.5 * hidden, -.25 * hidden];
  assert.equal(signed(hidden), '−0.761594');
  assert.equal(signed(up[0]), '−0.380797');
  assert.equal(signed(up[1]), '0.190399');
  assert.equal(signed(1 + up[0]), '0.619203');
  assert.equal(signed(2 + up[1]), '2.190399');
  const adapter = intuition.slice(intuition.indexOf('export function AdapterCorrectionFigure'), intuition.indexOf('export function LowRankDirectionFigure'));
  assert.ok(!/\.toFixed\(6\)\}/.test(adapter), 'raw toFixed output would print a hyphen-minus');
});

check('Frozen-gradient figure names the lesson case and draws the probe contrast', () => {
  const frozen = figures.slice(figures.indexOf('export function FrozenGradientFigure'), figures.indexOf('export function NearestMeanToyFigure'));
  assert.match(frozen, /LoRA factors beside the <strong>lower<\/strong> layer/);
  assert.match(frozen, /3 · Contrast: a linear probe/);
  assert.match(frozen, /Backward: stops at the head/);
  // Constructed case: u = (2, 1), W = I, L = (4 + 1) / 2, dL/du = u.
  assert.equal((2 ** 2 + 1 ** 2) / 2, 2.5);
  assert.match(lesson, /In our network that upstream module is section 4's LoRA pair beside the lower layer/);
});

check('Co-adaptation sketch: baseB all trains; B4B locks 1–4; B4B+ fine-tunes 1–4; 5–8 restart in both', () => {
  const fn = figures.slice(figures.indexOf('export function CoAdaptationFigure'), figures.indexOf('export function BatchNormPolicyFigure'));
  const rows = [...fn.matchAll(/name: '([^']+)'[^\n]*states: ([^\n]+) \}/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(rows.map(r => r[0]), ['baseB', 'B4B', 'B4B+']);
  assert.match(rows[0][1], /Array\(8\)\.fill\('trains'\)/);
  assert.match(rows[1][1], /Array\(4\)\.fill\('frozen'\), \.\.\.Array\(4\)\.fill\('added'\)/);
  assert.match(rows[2][1], /Array\(4\)\.fill\('trains'\), \.\.\.Array\(4\)\.fill\('added'\)/);
  assert.match(fn, /no measured values are drawn/);
});

check('BatchNorm policy figure: backbone eval with stored statistics, head train', () => {
  const fn = figures.slice(figures.indexOf('export function BatchNormPolicyFigure'));
  assert.match(fn, /Backbone · eval mode/);
  assert.match(fn, /Head · train mode/);
  assert.match(fn, /<code>model\.train\(\)<\/code>, then <code>model\.backbone\.eval\(\)<\/code>/);
});

check('Route figures use the strategy map\'s state colours; fork and join markers present', () => {
  const buildupCss = read('src/learn/components/lesson-labs/transfer-buildup.css');
  const intuitionCss = read('src/learn/components/lesson-labs/transfer-intuition.css');
  assert.match(buildupCss, /\.tb-lora-routes > \.is-added-route \{ border-color: #9bdced; border-inline-style: dashed; \}/);
  assert.match(buildupCss, /\.tb-lora-routes > div \{ padding: 1rem \.65rem; border-inline: 2px solid #6f6a62;/);
  assert.match(intuitionCss, /\.transfer-adapter-branches > div \{ min-width: 0; padding: 1rem \.6rem; border-inline: 2px solid #6f6a62; \}/);
  assert.match(intuitionCss, /\.transfer-adapter-detour \{ border-color: #9bdced; border-inline-style: dashed; \}/);
  assert.ok(!/Amber labels the unchanged route/.test(intuition));
  for (const source of [figures, intuition]) {
    assert.match(source, /Route 1 of 2/); assert.match(source, /Route 2 of 2/);
    assert.match(source, /↓ into ⊕/);
    assert.match(source, /Colours follow the strategy map/);
  }
  assert.match(figures, /className="tb-fork"/);
  assert.match(intuition, /className="transfer-fork"/);
});

check('Notation: x is named per layer in the LoRA figure; the adapter d is distinguished from LoRA d', () => {
  assert.match(figures, /For the lower layer, x is the image’s 64 values; for the upper layer, the 32 lower-layer activations\./);
  assert.match(lesson, /Here "\}<Math>\{"d"\}<\/Math>\{" is the feature width, 16 in our network; in the LoRA formula "\}<Math>\{"d"\}<\/Math>\{" was one layer's output width\./);
});

check('New figures sit at their point of need, in reading order', () => {
  const at = tag => { const i = lesson.indexOf(tag); assert.ok(i > 0, tag); return i; };
  const order = ['<TransferNetworkFigure />', '<NearestMeanToyFigure />', '<FeatureTestFigure />', '<CoAdaptationFigure />', '<TransferStrategyMap />', '<BatchNormPolicyFigure />', '<FrozenGradientFigure />', '<TransferFreezeLab />', '<LoraLocationFigure />', '<AdapterCorrectionFigure />', '<TransferStrategyMap stage="all" />'].map(at);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

check('Displayed negatives use U+2212 in lab readouts and older figures; labs differ from revision 6 only by that helper', () => {
  const labsFile = 'src/learn/components/lesson-labs/TransferLearningLabs.jsx';
  const before = read('docs/teaching/deep-learning-beginner/original/revision-6/transfer-learning-fine-tuning-strategies/' + labsFile);
  const after = read(labsFile);
  const helperBefore = "maximumFractionDigits: digits }) : 'Unavailable';";
  const helperAfter = "maximumFractionDigits: digits }).replace('-', '−') : 'Unavailable';";
  assert.ok(before.includes(helperBefore));
  assert.equal(after, before.replace(helperBefore, helperAfter));
  for (const snippet of [
    "const minus = value => String(value).replace('-', '−');",
    '({minus(x)}, {minus(y)})',
    'Ax = {minus(example.measure)}',
    'Feature = {minus(value)}',
    'Correction = ({minus(example.measure)}, {minus(2 * example.measure)})',
    '`(${minus(measure)}, ${minus(2 * measure)})`',
  ]) assert.ok(intuition.includes(snippet), snippet);
  const minus = value => String(value).replace('-', '−');
  assert.equal(minus(-2), '−2');
  assert.equal(`(${minus(-2)}, ${minus(-4)})`, '(−2, −4)');
  assert.equal(Number((-0.2).toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 }).replace('-', '−'), '−0.2');
});

check('Probe row separates forward connectors from where the backward signal ends', () => {
  const css = read('src/learn/components/lesson-labs/transfer-buildup.css');
  assert.ok(figures.includes('className="is-backward-stop"><strong>Backward: stops at the head</strong>'));
  assert.ok(css.includes(".tb-probe-route li:nth-child(2)::after { content: '⇠'; color: #eba36f; }"));
  assert.ok(css.includes(".tb-probe-route li:nth-child(2)::after { content: '⇡'; color: #eba36f; }"));
});

check('Changed JSX parses', () => {
  for (const source of [lesson, figures, intuition, read('src/learn/components/lesson-labs/TransferLearningLabs.jsx')]) parse(source, { sourceType: 'module', plugins: ['jsx'] });
});

check('Programs, data and the H2 anchors are unchanged from revision 6', () => {
  const snapshot = JSON.parse(read('docs/teaching/deep-learning-beginner/original/revision-6/revision-6-sources.json')).topics['transfer-learning-fine-tuning-strategies'];
  for (const file of ['src/learn/assets/transfer-learning/transfer-experiments.py', 'src/learn/assets/transfer-learning/feature-inspection.py', 'src/learn/assets/transfer-learning/digits-400.csv', 'src/learn/assets/transfer-learning/data-provenance.md', 'src/learn/data/transfer-learning-features.json', 'src/learn/data/transfer-learning-experiment.json', 'src/learn/data/transfer-learning-specimens.json', 'src/learn/data/transfer-learning-model.js', 'src/learn/data/transfer-learning-strategy.js'])
    assert.equal(hash(file), snapshot[file], file);
  const before = read('docs/teaching/deep-learning-beginner/original/revision-6/transfer-learning-fine-tuning-strategies/' + lessonFile);
  const anchors = source => [...source.matchAll(/id="(transfer-section-\d+)"/g)].map(m => m[1]).concat([...source.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]));
  assert.deepEqual(anchors(lesson), anchors(before));
});

console.log(JSON.stringify({ topicId: 'transfer-learning-fine-tuning-strategies', revision: 7, passed: true, checks }, null, 1));
