// Author checks for the convolution lesson's beginner-buildup revision.
// Writes docs/teaching/deep-learning-beginner/convolution-pooling-receptive-fields/author-checks.json by default;
// LESSON_RECEIPT redirects it so a later revision never overwrites an earlier revision's receipt.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from '@babel/parser';
import { sharedFilterUpdate, windowGeometry, poolVector, dilationOffsets, averagingProfile, transpose1d, receptiveTrace, observedAncestors, cnnAxisLayers } from '../src/learn/data/convolution-models.js';
import {
  anatomyImage, anatomyKernel, centreChange, channelImage, channelWeight, channelBias, outputTerms,
  convolveChannels, squareWindows, poolingMap, pool2x2, cnnStages, realSeven, edgeKernels, channelMix, groupConnections,
} from '../src/learn/data/convolution-foundations.js';

const lessonPath = 'src/learn/data/topics/convolution-pooling-receptive-fields.jsx';
const python = process.env.LESSON_PYTHON || 'scratch/lesson-tools/Scripts/python.exe';
const receipt = process.env.LESSON_RECEIPT || 'docs/teaching/deep-learning-beginner/convolution-pooling-receptive-fields/author-checks.json';
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const lesson = fs.readFileSync(lessonPath, 'utf8');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-beginner-'));
const runPython = source => {
  const file = path.join(temp, `check-${checks.length}.py`);
  fs.writeFileSync(file, source);
  return execFileSync(python, ['-B', file], { encoding: 'utf8' }).replace(/\r\n/g, '\n').trim();
};

// Independent reference: direct nested loops, written separately from the figure module.
function reference(image, weight, bias) {
  const [cOut, cIn, kh, kw] = [weight.length, weight[0].length, weight[0][0].length, weight[0][0][0].length];
  const h = image[0].length - kh + 1, w = image[0][0].length - kw + 1;
  const y = [];
  for (let o = 0; o < cOut; o++) {
    y.push([]);
    for (let u = 0; u < h; u++) {
      y[o].push([]);
      for (let v = 0; v < w; v++) {
        let total = bias[o];
        for (let c = 0; c < cIn; c++) for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) total += weight[o][c][a][b] * image[c][u + a][v + b];
        y[o][u].push(total);
      }
    }
  }
  return y;
}

check('Anatomy figure: single-channel map [[0,5],[0,-2]] and top-left products 1,−2,0,1', () => {
  assert.deepEqual(convolveChannels([anatomyImage], [[anatomyKernel]], [0])[0], [[0, 5], [0, -2]]);
  assert.deepEqual(outputTerms([anatomyImage], [[anatomyKernel]], [0], 0, 0, 0).channels[0].terms.map(t => t.product), [1, -2, 0, 1]);
  assert.deepEqual(convolveChannels([anatomyImage], [[anatomyKernel]], [2])[0], [[2, 7], [2, 0]], 'bias shifts every output equally');
});

check('Channel figure: A=[[4,7],[2,1]], B=[[3,3],[2,2]], top-left partial sums 0 and 3 plus bias 1', () => {
  const maps = convolveChannels(channelImage, channelWeight, channelBias);
  assert.deepEqual(maps, reference(channelImage, channelWeight, channelBias));
  assert.deepEqual(maps, [[[4, 7], [2, 1]], [[3, 3], [2, 2]]]);
  const t = outputTerms(channelImage, channelWeight, channelBias, 0, 0, 0);
  assert.deepEqual([t.channels[0].sum, t.channels[1].sum, t.bias, t.value], [0, 3, 1, 4]);
});

check('Practice 3: raising channel-1 centre to 2 gives A=[[4,9],[4,1]], B=[[5,5],[2,2]]; layer plan 304 params, 307,200 MACs', () => {
  const changed = channelImage.map(ch => ch.map(row => [...row]));
  changed[1][1][1] = 2;
  assert.deepEqual(reference(changed, channelWeight, channelBias), [[[4, 9], [4, 1]], [[5, 5], [2, 2]]]);
  assert.equal(4 * 3 * 25 + 4, 304);
  assert.equal((32 + 2 * 2 - 5) / 1 + 1, 32);
  assert.equal(32 * 32 * 4 * 3 * 25, 307200);
});

check('Kernel flip stated in §1: convolution with K equals cross-correlation with flipped K', () => {
  const flipped = anatomyKernel.map(row => [...row].reverse()).reverse();
  assert.deepEqual(flipped, [[1, 0], [-1, 1]]);
});

check('Padding/stride figure: 5×5, k=3 → 3 (p0 s1), 5 (p1 s1), 2 (p0 s2), 3 (p1 s2); 6×6 p0 s2 → 2 with last row unused', () => {
  assert.deepEqual([[0, 1], [1, 1], [0, 2], [1, 2]].map(([p, s]) => squareWindows(5, 3, p, s).count), [3, 5, 2, 3]);
  const six = squareWindows(6, 3, 0, 2);
  assert.equal(six.count, 2);
  assert.equal(six.starts.at(-1) + 3, 5, 'windows cover rows 0–4; row 5 unused');
});

check('Pooling figure: max [[4,2],[3,7]], average [[2.5,1],[1.5,5.25]], no tied maximum in any window', () => {
  const pooled = pool2x2(poolingMap);
  assert.deepEqual(pooled.map(r => r.map(p => p.max)), [[4, 2], [3, 7]]);
  assert.deepEqual(pooled.map(r => r.map(p => p.mean)), [[2.5, 1], [1.5, 5.25]]);
  for (const p of pooled.flat()) assert.equal(p.cells.filter(([i, j]) => poolingMap[i][j] === p.max).length, 1, 'unique winner');
});

check('Edge-map figure: realSeven is CSV source_id 28 (digit 7); maps computed in JS equal the independent reference; quoted +23, −32, ±21 cells', () => {
  const csv = fs.readFileSync('public/learn-code/convolution-pooling-receptive-fields/digits-400.csv', 'utf8').trim().split(/\r?\n/);
  const header = csv[0].split(',');
  const row = csv.slice(1).map(line => line.split(',')).find(cells => cells[header.indexOf('source_id')] === '28');
  assert.equal(row[header.indexOf('digit')], '7');
  const pixels = Array.from({ length: 64 }, (_, i) => Number(row[header.indexOf(`pixel_${i}`)]));
  assert.deepEqual(realSeven.flat(), pixels);
  const v = convolveChannels([realSeven], [[edgeKernels.vertical.kernel]], [0])[0];
  const h = convolveChannels([realSeven], [[edgeKernels.horizontal.kernel]], [0])[0];
  assert.deepEqual(v, reference([realSeven], [[edgeKernels.vertical.kernel]], [0])[0]);
  assert.deepEqual(h, reference([realSeven], [[edgeKernels.horizontal.kernel]], [0])[0]);
  assert.equal(h[2][3], 23); assert.equal(Math.max(...h.flat()), 23);
  assert.equal(h[4][2], -32); assert.equal(Math.min(...h.flat()), -32);
  assert.equal(v[6][2], 21); assert.equal(v[6][4], -21);
  assert.equal(v[4][2], 0, 'solid 16,16 over 0,0 window gives 0 in the vertical map');
  assert.equal(v[0][0], 0); assert.equal(h[0][0], 0);
});

check('Edge maps agree with torch F.conv2d on the CSV digit', () => {
  const out = runPython(`import csv, json, numpy as np, torch
from torch.nn import functional as F
row = [r for r in csv.DictReader(open('public/learn-code/convolution-pooling-receptive-fields/digits-400.csv')) if r['source_id'] == '28'][0]
x = torch.tensor([float(row[f'pixel_{i}']) for i in range(64)], dtype=torch.float64).reshape(1, 1, 8, 8)
kv = torch.tensor([[[[-1., 1], [-1, 1]]]], dtype=torch.float64); kh = torch.tensor([[[[-1., -1], [1, 1]]]], dtype=torch.float64)
print(json.dumps([F.conv2d(x, kv)[0, 0].int().tolist(), F.conv2d(x, kh)[0, 0].int().tolist()]))`);
  const [tv, th] = JSON.parse(out);
  assert.deepEqual(convolveChannels([realSeven], [[edgeKernels.vertical.kernel]], [0])[0], tv);
  assert.deepEqual(convolveChannels([realSeven], [[edgeKernels.horizontal.kernel]], [0])[0], th);
});

check('Receptive growth: two 3×3 stride-1 layers give r = 5; digit CNN final r sequence 3,4,8,10 and 7-of-8 pixel coverage', () => {
  const grow = layers => layers.reduce(({ r, j }, { k, s, d = 1 }) => ({ r: r + d * (k - 1) * j, j: s * j }), { r: 1, j: 1 });
  assert.equal(grow([{ k: 3, s: 1 }, { k: 3, s: 1 }]).r, 5);
  const digitLayers = [{ k: 3, s: 1 }, { k: 2, s: 2 }, { k: 3, s: 1 }, { k: 2, s: 2 }];
  assert.deepEqual(digitLayers.map((_, i) => grow(digitLayers.slice(0, i + 1)).r), [3, 4, 8, 10]);
  const back = (layers, out) => { let set = new Set([out]); for (const L of [...layers].reverse()) { const next = new Set(); for (const i of set) for (let t = 0; t < L.k; t++) { const j = i * L.s + t - L.p; if (j >= 0 && j < L.n) next.add(j); } set = next; } return [...set].sort((a, b) => a - b); };
  const digit = [{ k: 3, s: 1, p: 1, n: 8 }, { k: 2, s: 2, p: 0, n: 8 }, { k: 3, s: 1, p: 1, n: 4 }, { k: 2, s: 2, p: 0, n: 4 }];
  assert.deepEqual(back(digit, 0), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(back(digit, 1), [1, 2, 3, 4, 5, 6, 7]);
});

check('Pipeline figure: shapes and parameter counts 80 + 1,168 + 650 = 1,898 match the program', () => {
  assert.deepEqual(cnnStages.map(s => s.shape.join('×')), ['1×8×8', '8×8×8', '8×4×4', '16×4×4', '16×2×2', '64', '10']);
  assert.equal(8 * 1 * 9 + 8, 80);
  assert.equal(16 * 8 * 9 + 16, 1168);
  assert.equal(64 * 10 + 10, 650);
  assert.equal(cnnStages.reduce((sum, s) => sum + (s.count || 0), 0), 1898);
});

// Extract a CodeBlock string by filename from the lesson source.
function codeBlock(filename) {
  const marker = `filename={"${filename}"}`;
  const at = lesson.indexOf(marker);
  assert.ok(at >= 0, `missing CodeBlock ${filename}`);
  const open = lesson.indexOf('>{"', at) + 3;
  let end = open;
  while (!(lesson[end] === '"' && lesson[end - 1] !== '\\' && lesson.slice(end, end + 13) === '"}</CodeBlock')) end++;
  return JSON.parse(lesson.slice(open - 1, end + 1));
}

check('Displayed §2 program prints exactly its displayed output; with the §4 appended check it also prints the §4 output', () => {
  const program = codeBlock('conv2d_from_scratch.py');
  assert.equal(runPython(program), codeBlock('conv2d_from_scratch-output.txt').trim());
  const appended = runPython(program + codeBlock('conv2d_from_scratch-geometry.py'));
  assert.equal(appended, [codeBlock('conv2d_from_scratch-output.txt').trim(), codeBlock('conv2d_from_scratch-geometry-output.txt').trim()].join('\n'));
  assert.ok(!/stride=2|padding=1/.test(program), '§2 program uses only the unpadded stride-1 case');
});

check('Adaptive-pooling sum gradient quoted in §5 is [1/2, 5/6, 1/3, 5/6, 1/2]', () => {
  const n = 5, m = 3, grad = Array(n).fill(0);
  for (let i = 0; i < m; i++) { const s = Math.floor(i * n / m), e = Math.ceil((i + 1) * n / m); for (let j = s; j < e; j++) grad[j] += 1 / (e - s); }
  [1 / 2, 5 / 6, 1 / 3, 5 / 6, 1 / 2].forEach((g, i) => assert.ok(Math.abs(grad[i] - g) < 1e-12));
});

check('Dilation exercise solution matches F.conv2d(dilation=2) on several random 7×7 inputs and gives 3×3', () => {
  const out = runPython(`import numpy as np, torch
from torch.nn import functional as F
def conv2d(x, weight, bias, stride=1, padding=0, dilation=1):
    c_out, c_in, k_h, k_w = weight.shape
    x = np.pad(x, ((0, 0), (padding, padding), (padding, padding)))
    span_h, span_w = dilation*(k_h-1)+1, dilation*(k_w-1)+1
    h_out = (x.shape[1] - span_h) // stride + 1
    w_out = (x.shape[2] - span_w) // stride + 1
    y = np.empty((c_out, h_out, w_out))
    for u in range(h_out):
        for v in range(w_out):
            top, left = u*stride, v*stride
            patch = x[:, top:top + span_h:dilation, left:left + span_w:dilation]
            y[:, u, v] = np.tensordot(weight, patch, axes=3) + bias
    return y
rng = np.random.default_rng(3)
ok = True
for _ in range(5):
    x, w, b = rng.normal(size=(2, 7, 7)), rng.normal(size=(3, 2, 3, 3)), rng.normal(size=3)
    ours = conv2d(x, w, b, dilation=2)
    ref = F.conv2d(torch.tensor(x)[None], torch.tensor(w), torch.tensor(b), dilation=2)[0].numpy()
    ok = ok and ours.shape == (3, 3, 3) and np.allclose(ours, ref)
print(ok)`);
  assert.equal(out, 'True');
});

check('DigitCNN excerpt is identical to the class in the downloadable program', () => {
  const excerpt = codeBlock('convolution-experiments-DigitCNN-excerpt.py');
  const program = fs.readFileSync('public/learn-code/convolution-pooling-receptive-fields/convolution-experiments.py', 'utf8').replace(/\r\n/g, '\n');
  assert.ok(program.includes(excerpt + '\n'), 'excerpt text must appear verbatim');
});

check('Published programs, data and recorded measurements unchanged from HEAD', () => {
  for (const file of ['convolution-experiments.py', 'convolution_pullbacks.py', 'calculated-inputs.json', 'digits-400.csv', 'data-provenance.md']) {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', `public/learn-code/convolution-pooling-receptive-fields/${file}`]);
  }
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'src/learn/data/convolution-models.js']);
});

check('Changed lesson, figures and labs parse as JSX', () => {
  for (const file of [lessonPath, 'src/learn/components/lesson-labs/ConvolutionFoundationFigures.jsx', 'src/learn/components/lesson-labs/ConvolutionLabs.jsx', 'src/learn/components/lesson-labs/ConvolutionOperatorIntuition.jsx', 'src/learn/data/convolution-foundations.js']) {
    parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  }
});

check('No learner prediction/reveal gate text and no "Open recorded viewer" button remain', () => {
  const labs = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionLabs.jsx', 'utf8');
  assert.ok(!/Open recorded viewer/.test(labs));
  assert.ok(!/check (your )?prediction|reveal (the )?answer/i.test(lesson + labs));
});

// ---- Reading-flow revision (lesson-flow) -------------------------------------------------
const figures = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionFoundationFigures.jsx', 'utf8');
const labsSource = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionLabs.jsx', 'utf8');
const operatorSource = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionOperatorIntuition.jsx', 'utf8');
const figureCss = fs.readFileSync('src/learn/components/lesson-labs/convolution-foundations.css', 'utf8');
const operatorCss = fs.readFileSync('src/learn/components/lesson-labs/convolution-operator-intuition.css', 'utf8');

check('Reading flow: lesson opts into lesson-flow; figures and labs use the shared flow parts, with no card chrome', () => {
  assert.match(lesson, /className="neural-lesson convolution-lesson lesson-flow"/);
  for (const source of [figures, labsSource, operatorSource]) {
    assert.match(source, /from '\.\/LessonFlow\.jsx'/);
    assert.ok(!/NeuralLab\b|NeuralNumber|NeuralSelect|neural-eyebrow|cf-title|LIVE EXPLORATION|Reset /.test(source), 'no old lab panel, title or reset button');
  }
  assert.ok(!/\.cf-figure\s*\{[^}]*(border:\s*1px|background:\s*#)/.test(figureCss), 'figure has no card border or fill');
  assert.ok(!/conv-op-intuition/.test(operatorCss + operatorSource), 'operator figures have no card class');
});

check('Reading flow: each figure comes before the prose that walks through it', () => {
  const order = [
    ['<ConvolutionAnatomyFigure />', 'Read the figure in order: input, kernel, output'],
    ['<EdgeMapsFigure />', 'Read each map as'],
    ['<DenseVersusConvolutionFigure />', 'In the dense-layer panel'],
    ['<ChannelStackFigure />', 'Each row pairs one input channel'],
    ['<ChannelMixFigure />', 'output A computes'],
    ['<GroupsFigure />', 'Each half of the outputs'],
    ['<SharedUpdateFigure />', 'switch the figure to'],
    ['<PaddingStrideFigure />', 'adds a border of supplied values'],
    ['<DilationRulerLab />', 'compare padding (1, 2) with (2, 1)'],
    ['<PoolingWindowsFigure />', 'Window A holds'],
    ['<PoolingRoutesLab />', 'the gradient of their sum is'],
    ['<AdaptivePoolingBinsLab />', 'For three bins the boundaries'],
    ['<ReceptiveGrowthFigure />', 'The traced layer-2 value'],
    ['<DilationHolesLab />', 'With dilations 2 and 2'],
    ['<CnnPipelineFigure />', 'Each part does one job'],
    ['<ConvolutionInfluenceLab />', 'At depth two the central'],
    ['<ShiftBoundaryLab />', 'commutes with circular shifts'],
    ['<SamplingPhaseLab />', 'At α = 1 the filter'],
    ['<ScatterLab />', 'Written as a matrix'],
    ['<CoverageLab />', 'Kernel three with stride two produces coverage'],
    ['<ConvolutionPatchMatrixFigure />', 'The first grid, “Unfolded”, is the column matrix'],
    ['<BatchNormFoldingFigure />', 'In general, for output channel'],
  ];
  for (const [figure, walk] of order) {
    const at = lesson.indexOf(figure), text = lesson.indexOf(walk);
    assert.ok(at >= 0 && text > at, `${figure} must precede "${walk}"`);
  }
});

check('Labs keep few controls: at most three FlowSlider/FlowChoice controls per lab component', () => {
  for (const source of [figures, labsSource, operatorSource]) {
    for (const body of source.split(/\nexport function /).slice(1)) {
      const count = (body.match(/<FlowSlider|<FlowChoice/g) || []).length + (body.match(/\.map\(\(value, i\) => <FlowSlider/g) ? 2 : 0);
      assert.ok(count <= 3, `${body.slice(0, 40)} has ${count} controls`);
    }
  }
});

check('New figure values: centre-pixel check, 1×1 mix, groups wiring', () => {
  const centre3 = anatomyImage.map((row, r) => row.map((v, c) => (r === 1 && c === 1 ? 3 : v)));
  assert.deepEqual(reference([centre3], [[anatomyKernel]], [0])[0], [[2, 5], [-2, 0]]);
  const mix = x => channelMix.weights.map((row, o) => row.reduce((s, w, c) => s + w * x[c], channelMix.bias[o]));
  assert.deepEqual(mix([2, 3]), [6, 7]);
  assert.equal(groupConnections.length, 12);
  assert.ok(groupConnections.every(([i, o]) => (i < 2) === (o < 3)), 'no connection crosses groups');
});

check('Shared update figure: contributions sum to [1, −4]; η = 0.1 gives loss 1.53; overshoot begins near η = 0.233 (inside the slider range)', () => {
  const r = sharedFilterUpdate([0, 0], 0.1);
  assert.deepEqual(r.contributions, [[-2, -6], [3, 2]]);
  assert.deepEqual(r.gradient, [1, -4]);
  assert.deepEqual(r.inputGradient, [-2, 3, -1]);
  assert.ok(Math.abs(r.nextLoss - 1.53) < 1e-9);
  const loss = eta => 0.5 * ((-2 + 11 * eta) ** 2 + (1 + 5 * eta) ** 2);
  assert.ok(Math.abs(sharedFilterUpdate([0, 0], 0.3).nextLoss - loss(0.3)) < 1e-9);
  assert.ok(loss(0.23) < 2.5 && loss(0.24) > 2.5 && sharedFilterUpdate([0, 0], 0.3).nextLoss > 2.5);
});

check('Geometry ruler: 4 taps with padding (1, 2) and (2, 1) both give 8 outputs, centres 1 and 0; 3 taps dilation 2 sample 0, 2, 4', () => {
  const a = windowGeometry({ n: 8, k: 4, left: 1, right: 2 }), b = windowGeometry({ n: 8, k: 4, left: 2, right: 1 });
  assert.equal(a.count, 8); assert.equal(b.count, 8);
  assert.equal(a.center, 1); assert.equal(b.center, 0);
  assert.deepEqual(windowGeometry({ n: 8, k: 3, d: 2 }).windows[0], [0, 2, 4]);
});

check('Pooling routes and holes: max [0,2,0], mean [0.5,1,0.5], tie [1,1,0]; dilations (2,2) → 5 of 9, (1,2) → 7 of 7', () => {
  assert.deepEqual(poolVector([1, 4, 3]).gradient, [0, 2, 0]);
  assert.deepEqual(poolVector([1, 4, 3], 2, 1, 'mean').gradient, [0.5, 1, 0.5]);
  assert.deepEqual(poolVector([2, 2, 1]).gradient, [1, 1, 0]);
  assert.deepEqual(dilationOffsets(2, 2), [-4, -2, 0, 2, 4]);
  assert.equal(dilationOffsets(1, 2).length, 7);
});

check('Receptive trace: final global-average output has r = 46 and sees all 32 pixels; an earlier output sees fewer pixels than its bounding width', () => {
  const trace = receptiveTrace(cnnAxisLayers);
  assert.equal(trace.at(-1).r, 46);
  assert.equal(observedAncestors(cnnAxisLayers, 0).length, 32);
  const row = trace[3];
  assert.ok(observedAncestors(cnnAxisLayers.slice(0, 4), 0).length < row.r);
});

check('Influence, shift phase, scatter and coverage values quoted in §8–§9', () => {
  const p = averagingProfile(20, 0.01);
  assert.equal(p.coefficients.length, 41); assert.equal(p.width, 21);
  assert.deepEqual(averagingProfile(2, 0.01).coefficients.map(v => Math.round(v * 9)), [1, 2, 3, 2, 1]);
  assert.equal(2 * 0.5 - 1, 0);
  const s = transpose1d([2, -3], [1, -1]);
  assert.deepEqual(s.output, [2, -5, 3]);
  assert.equal(s.output.reduce((t, v, i) => t + v * [1, 3, 2][i], 0), -7);
  assert.deepEqual(transpose1d([1, 1, 1], [1, 1, 1], 2).output, [1, 1, 2, 1, 2, 1, 1]);
  assert.deepEqual(transpose1d([1, 1, 1], [1, 1, 1, 1], 2).output, [1, 1, 2, 2, 2, 2, 1, 1]);
  assert.deepEqual(transpose1d([1, 1, 1], [1, 1], 2).output, [1, 1, 1, 1, 1, 1]);
});

check('BatchNorm folding figure: both routes give 1', () => {
  const z = 2 * 3 - 4 + 1, alpha = 4 / Math.sqrt(3.99 + 0.01);
  assert.ok(Math.abs(4 * (z - 1) / Math.sqrt(4) - 3 - 1) < 1e-12);
  assert.ok(Math.abs((alpha * 2) * 3 + (alpha * -1) * 4 + (-3 + alpha * (1 - 1)) - 1) < 1e-12);
});

check('Claim regression: conditions from the previous revision are still stated', () => {
  for (const phrase of [
    'it is not yet a probability or a named feature', 'not hundreds of independent extra training examples',
    'not an inverse', 'not a clean proof of translation', 'these rows remain development data',
    'Training-mode BatchNorm depends on the current batch', 'does not make pooling invertible',
    'do not build an argument that depends on a universal tie winner', 'A bounding width is not a count of connected pixels',
    'Equal tensor shapes do not prove equal spatial alignment', 'not the official dataset evaluation',
    'it does not mean 46 observed pixels or wraparound', 'A parameter comparison is not a latency comparison',
    'not a claim that blurring makes every classifier invariant', 'A zero gradient does not erase an architectural connection',
    'it does not append zero-valued cells',
  ]) assert.ok(lesson.toLowerCase().includes(phrase.toLowerCase()), `missing condition: ${phrase}`);
});

check('Anatomy readout (L1): for every centre the control allows (0–4), outputs that change are exactly those whose centre tap is nonzero', () => {
  const conv = img => [0, 1].map(u => [0, 1].map(v => anatomyKernel.reduce((t, row, a) => t + row.reduce((s, w, b) => s + w * img[u + a][v + b], 0), 0)));
  const base = conv(anatomyImage);
  for (let centre = 0; centre <= 4; centre++) {
    const img = anatomyImage.map(r => r.slice()); img[1][1] = centre;
    const map = conv(img);
    for (const w of centreChange(centre)) {
      assert.equal(map[w.u][w.v] - base[w.u][w.v], w.delta, `centre ${centre}, output (${w.u}, ${w.v})`);
      if (w.weight === 0) assert.equal(w.delta, 0);
    }
  }
  const img = anatomyImage.map(r => r.slice()); img[1][1] = 3;
  assert.deepEqual(conv(img), [[2, 5], [-2, 0]]);
  assert.equal(centreChange(3).find(w => w.u === 0 && w.v === 1).delta, 0, 'output (0, 1) stays: its centre tap w10 is 0');
  const figures = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionFoundationFigures.jsx', 'utf8');
  assert.ok(figures.includes('centreChange(centre)') && figures.includes('stays the same because its window multiplies the centre by'), 'readout is computed from centreChange');
});

check('Reading flow: wording survives stacked figures; Dropout notation current; recorded-viewer conditions restored', () => {
  for (const stale of ['Read the figure from left to right', 'output cell to its right', 'The input on the left',
    'On the left, a dense layer', 'On the right, each output', 'digit from left to right', 'The left grid', 'the right grid', '[B,C,H,W]',
    'outline, right', 'A control is always introduced in the paragraph just before it', 'all four outputs moved']) {
    assert.ok(!lesson.includes(stale), `layout-dependent or stale wording remains: ${stale}`);
  }
  const labs = fs.readFileSync('src/learn/components/lesson-labs/ConvolutionLabs.jsx', 'utf8');
  assert.ok(labs.includes('maps.first_layer_kernels[ch]') && /firstLayer\s*\?/.test(labs), 'saved-maps kernel follows the selected first-layer channel and is shown only for first-layer maps');
  assert.ok(labs.includes('compare the printed numbers, not the shading'), 'per-grid shading scale is stated');
  assert.ok(labs.includes('All input derivatives are zero at this input'), 'all-zero local gradient is reported');
  assert.ok(labs.includes('nothing between them was recorded'), 'recorded checkpoints are not presented as a continuous curve');
  assert.ok(lesson.includes('nothing is trained in your browser'), 'recorded results are labelled as recorded');
  assert.ok(lesson.includes('the four windows do not overlap'), 'stride-2 pooling windows stated as non-overlapping');
});

fs.rmSync(temp, { recursive: true, force: true });
const result = { topicId: 'convolution-pooling-receptive-fields', command: 'node scripts/verify-convolution-beginner.mjs', recordedAt: new Date().toISOString(), passed: true, checks };
fs.mkdirSync(path.dirname(receipt), { recursive: true });
fs.writeFileSync(receipt, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length }));
