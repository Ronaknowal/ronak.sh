// Author checks for the Landmark Architectures reading-flow revision.
// Recomputes the numbers the rebuilt live figures report, checks figure-before-walk-through
// order and the reading-flow opt-in, and runs the torchvision count verifier
// (scripts/verify-landmark-beginner.py). Writes only its own receipt:
//   LANDMARK_FLOW_RECEIPT (default docs/teaching/deep-learning-beginner/<id>/author-checks-flow.json)
// Usage: LANDMARK_PYTHON=scratch/dl-library-tools/Scripts/python.exe node scripts/verify-landmark-flow.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { channelContext, headBudget, signedScoreMap } from '../src/learn/data/landmark-architecture-models.js';

const id = 'landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet';
const receipt = process.env.LANDMARK_FLOW_RECEIPT || `docs/teaching/deep-learning-beginner/${id}/author-checks-flow.json`;
const python = process.env.LANDMARK_PYTHON || 'scratch/dl-library-tools/Scripts/python.exe';
const lessonPath = `src/learn/data/topics/${id}.jsx`;
const files = [lessonPath, 'src/learn/components/lesson-labs/LandmarkAnatomyFigures.jsx', 'src/learn/components/lesson-labs/LandmarkArchitectureLabs.jsx',
  'src/learn/components/lesson-labs/LandmarkFamilyIntuition.jsx', 'src/learn/components/lesson-labs/landmark-anatomy.css',
  'src/learn/components/lesson-labs/landmark-architectures.css', 'src/learn/components/lesson-labs/landmark-family-intuition.css'];
const source = Object.fromEntries(files.map(f => [f, readFileSync(f, 'utf8')]));
const lesson = source[lessonPath];
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

check('Changed JS/JSX parses', () => files.filter(f => f.endsWith('.jsx')).forEach(f => parse(source[f], { sourceType: 'module', plugins: ['jsx'] })));

check('SE figure: default gates, B raised to 3, and same-mean rearrangement', () => {
  const base = channelContext([[2, 2, 2, 2], [1, 1, 1, 1]]);
  close(base.hidden, 1); close(base.gates[0], 1 / (1 + Math.exp(-1))); close(base.gates[1], 1 / (1 + Math.exp(1)));
  assert.equal(base.gates[0].toFixed(4), '0.7311'); assert.equal(base.gates[1].toFixed(4), '0.2689');
  const raised = channelContext([[2, 2, 2, 2], [3, 3, 3, 3]]);
  close(raised.hidden, 0); close(raised.gates[0], .5); close(raised.gates[1], .5);
  const uneven = channelContext([[0, 4, 2, 2], [1, 1, 1, 1]]);
  close(uneven.means[0], 2); close(uneven.gates[0], base.gates[0]); close(uneven.gates[1], base.gates[1]);
});

check('Score figure: two routes agree; raising B bottom-left 2 → 6 lowers 2.5 → 1.5; positive weight raises it', () => {
  const at = (cell, wB) => signedScoreMap([[1, 2, 0, 3], [0, 1, cell, 1]], [2, wB], .5);
  const base = at(2, -1), raised = at(6, -1);
  close(base.viaFeatures, 2.5); close(base.viaMap, 2.5); assert.deepEqual(base.totalMap, [2, 3, -2, 5]);
  close(raised.viaMap, 1.5); close(raised.totalMap[2], -6);
  assert.ok(at(6, 1).viaMap > at(2, 1).viaMap, 'positive weight: increase raises score');
  for (const cell of [0, 3, 8]) for (const w of [-3, -0.5, 0, 2.5]) { const r = at(cell, w); close(r.viaFeatures, r.viaMap); }
});

check('Head figure: original 123,642,856; global average 513,000; 1×1 flattened equals global average', () => {
  const base = { channels: 512, dense: 4096, classes: 1000 };
  assert.equal(headBudget({ ...base, height: 7, width: 7, mode: 'dense' }).parameters, 123642856);
  assert.equal(headBudget({ ...base, height: 7, width: 7, mode: 'gap' }).parameters, 513000);
  assert.equal(headBudget({ ...base, height: 7, width: 7, mode: 'dense' }).gapParameters, 513000);
  assert.equal(headBudget({ ...base, height: 1, width: 1, mode: 'flat' }).parameters, 513000);
  assert.equal(headBudget({ ...base, height: 7, width: 7, mode: 'flat' }).parameters, (512 * 49 + 1) * 1000);
});

check('Saved maps: specimen 0 is source 251 (4, correct), specimen 1 is source 379 (8 chosen as 5)', () => {
  const data = JSON.parse(readFileSync(`public/learn-assets/${id}/recorded-feature-maps.json`, 'utf8'));
  const fit = data.find(row => row.kind === 'parallel');
  const chosen = o => o.logits.indexOf(Math.max(...o.logits));
  assert.deepEqual([fit.observations[0].source_id, fit.observations[0].actual, chosen(fit.observations[0])], [251, 4, 4]);
  assert.deepEqual([fit.observations[1].source_id, fit.observations[1].actual, chosen(fit.observations[1])], [379, 8, 5]);
  for (const o of fit.observations) for (const k of [chosen(o), o.actual]) {
    const r = signedScoreMap(o.feature_maps.map(m => m.flat()), fit.head_weight[k], fit.head_bias[k]);
    assert.ok(Math.abs(r.viaMap - o.logits[k]) < 1e-5, 'class map mean + bias reconstructs the logit');
  }
});

check('Inception figure opens on the naive version the prose walks through first', () => {
  assert.match(source['src/learn/components/lesson-labs/LandmarkAnatomyFigures.jsx'], /function InceptionModuleFigure\(\) \{\s*const \[mode, setMode\] = useState\('naive'\)/);
  assert.match(lesson, /It opens on the "\}<strong>\{"naive"\}<\/strong>/);
});

check('Reading flow: lesson opts in; no NeuralLab panels, eyebrows or figure titles remain', () => {
  assert.match(lesson, /className="neural-lesson landmark-lesson lesson-flow"/);
  for (const f of files.filter(f => f.endsWith('.jsx'))) {
    assert.ok(!/<NeuralLab\b|NeuralNumber|NeuralSelect|neural-eyebrow|<figcaption>[^<]{0,80}<\/figcaption>\s*<(?:Choice|div className="la-bridge")/.test(source[f]), `${f} still uses panel chrome`);
  }
  assert.ok(!/<h4>/.test(source['src/learn/components/lesson-labs/LandmarkFamilyIntuition.jsx']), 'family figures carry no titles');
  for (const f of files.filter(f => f.endsWith('.css'))) assert.ok(!/la-figure \{[^}]*border:/.test(source[f]) && !/landmark-family-intuition \{[^}]*border:/.test(source[f]), `${f} frames figures`);
  for (const component of ['LandmarkContextLab', 'LandmarkScalingLab', 'LandmarkKernelFigure', 'AlexNetVggFigure']) assert.ok(!lesson.includes(component), `${component} removed`);
});

check('Figures precede their walk-through: each figure follows its lead and is followed by the explanation', () => {
  const order = (...needles) => { let at = -1; for (const n of needles) { const i = lesson.indexOf(n, at + 1); assert.ok(i > at, `order: ${n}`); at = i; } };
  order('<LandmarkStrideFigure />', 'Counting how many starts fit gives the output size', 'frac{227-11}{4}');
  order('<LandmarkCompositionFigure />', 'Why do two 3×3 layers reach a 5×5 input region?', 'One 5×5 convolution has 25C² weights');
  order('<ResidualBlockFigure />', 'Follow x through it.', '{"y=x+F(x)."}');
  order('<MbConvFigure />', 'This is the "}<strong>{"inverted bottleneck"}');
  order('<LandmarkScoreLab />', 'Now write it generally.', 'z_k=b_k+');
  order('<DenseFeatureReuseFigure />', 'so the widths run 8, 11, 14, 17, 20');
  order('<LandmarkRecordedMaps />', 'For source 379, the class 5 and class 8 maps');
  // Review closure: VGG details follow the drawing; ResNet variants are walked through
  // before the equation; §5 teaches depthwise and SE before drawing MBConv (which contains
  // the SE gate); §9's slider instructions sit between the lab and the general formula.
  order('<VggFigure />', 'Read the stages from the top.', '"2, 2, 3, 3, 3"');
  order('<ResidualBlockFigure />', 'Switch the drawing to the block that changes shape.', 'Now switch to the bottleneck.', '{"y=x+F(x)."}');
  order('<DepthwiseFigure />', '<SqueezeExciteFigure />', '<MbConvFigure />', '<CompoundScalingFigure />');
  order('<LandmarkScoreLab />', 'Raise feature B', 'Now write it generally.');
  assert.ok(!lesson.includes('explained next'), 'MBConv walk-through no longer forward-references SE');
  assert.ok(!lesson.includes('the skip on the right'), 'Residual lesson draws its skip on the left');
});

check('Diagram key: pool meaning true for LeNet S2/S4; no unused gate tag; rail sampled; 4 of 8 drawn', () => {
  const figures = source['src/learn/components/lesson-labs/LandmarkAnatomyFigures.jsx'];
  assert.ok(!figures.includes('no learned values'), 'pool tag must not deny LeNet S2/S4 parameters');
  assert.match(figures, /LeNet’s S layers also learn one scale and one bias per map/);
  assert.ok(!/gate: 'channel gate'/.test(figures), 'unused channel-gate tag removed');
  assert.ok(!/kind="gate"/.test(figures), 'no box uses a removed tag');
  assert.match(figures, /la-key-rail/);
  assert.match(figures, /4 of 8 channels drawn/);
  const anatomy = JSON.parse(readFileSync('src/learn/data/landmark-anatomy-data.json', 'utf8'));
  for (const id of ['S2', 'S4']) assert.ok(anatomy.lenet.find(l => l.id === id).params > 0, `${id} learns parameters`);
});

check('Head lab opens on the flattened head, distinct from the original and the global-average bars', () => {
  const labs = source['src/learn/components/lesson-labs/LandmarkArchitectureLabs.jsx'];
  assert.match(labs, /useState\('flat'\), \[side, setSide\] = useState\(7\)/);
  assert.ok(!/\['gap', 'Global average \+ linear'\]/.test(labs), 'global-average option duplicates the fixed third bar');
  const fixed = { channels: 512, dense: 4096, classes: 1000, height: 7, width: 7 };
  const flat = headBudget({ ...fixed, mode: 'flat' }), dense = headBudget({ ...fixed, mode: 'dense' });
  assert.equal(flat.parameters, 512 * 49 * 1000 + 1000);
  assert.equal(dense.parameters, 123642856);
  assert.equal(flat.gapParameters, 513000);
});

check('Vocabulary: operation boxes neutral; computed chips violet; input chip cyan; amber only for learned counts and positive values', () => {
  const css = source['src/learn/components/lesson-labs/landmark-anatomy.css'];
  assert.ok(!/--la-conv|--la-mix|--la-gate|--la-current/.test(css), 'no per-kind operation hues');
  assert.match(css, /\.la-tensor \{[^}]*border: 1px solid var\(--la-computed\)/);
  assert.match(css, /\.la-tensor\[data-supplied\] \{ border-color: var\(--la-input\)/);
  // Module vocabulary: whatever enters a drawn block from outside (the image, or the previous
  // layer's output when one block is drawn on its own) is supplied data, so its chip is cyan.
  const figs = source['src/learn/components/lesson-labs/LandmarkAnatomyFigures.jsx'];
  for (const note of ['the previous layer’s output', 'x, the block input', 'narrow input x', 'wide input x']) assert.ok(figs.includes(`note="${note}" supplied`), `block input chip is supplied (cyan): ${note}`);
  assert.match(figs, /A cyan chip is supplied to the drawing from outside/);
  assert.match(css, /\.la-op-button\[aria-pressed=true\] \{ outline: 3px solid var\(--la-select\)/);
});

check('Lesson keeps every H2 anchor title and the practice/ending bytes', () => {
  const before = readFileSync(`docs/teaching/deep-learning-beginner/original/before-reading-flow/${id}/${lessonPath}`, 'utf8');
  const h2 = text => [...text.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(m => m[1]);
  assert.deepEqual(h2(lesson), h2(before));
  const tail = text => text.slice(text.indexOf('<section className="lesson-ending lesson-ending--practice"'));
  assert.equal(tail(lesson).replace(/\r\n/g, '\n'), tail(before).replace(/\r\n/g, '\n'));
});

check('Programs, data, models and measurements unchanged from the protected copy', () => {
  const manifest = JSON.parse(readFileSync('docs/teaching/deep-learning-beginner/original/before-reading-flow/sources.json', 'utf8')).topics[id];
  for (const f of ['src/learn/data/landmark-architecture-models.js', 'src/learn/data/landmark-architecture-measurements.json', 'src/learn/data/landmark-anatomy-data.json']) {
    assert.equal(createHash('sha256').update(readFileSync(f)).digest('hex'), manifest[f], f);
  }
});

let countVerifier;
check('Torchvision count verifier (verify-landmark-beginner.py) passes', () => {
  const out = execFileSync(python, ['-B', 'scripts/verify-landmark-beginner.py'], { encoding: 'utf8' });
  countVerifier = JSON.parse(out.slice(out.indexOf('{')));
  assert.equal(countVerifier.passed, true);
});

const result = { topicId: id, passed: true, checks, countVerifier: { checks: countVerifier.checks, environment: countVerifier.environment },
  sources: Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(f)).digest('hex')])) };
writeFileSync(receipt, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length, countVerifierChecks: countVerifier.checks }));
