import { useState } from 'react';
import { booleanTargets, corners, hiddenSpaceRows, nudgeRows, perceptronTrace, pixelPresets, pixelTemplates, scorePixels, xorRampRows } from '../../data/perceptron-beginner.js';
import { activationColors, Choice, CurvePlot, fmt, Frame, NumberControl, PerceptronTable } from './PerceptronShared.jsx';
import './perceptron-beginner.css';

const signed = value => (value > 0 ? '+' : '') + fmt(value);
const term = value => (value < 0 ? `(${fmt(value)})` : fmt(value));
const tone = v => (v > 0 ? 'pixel-weight-positive' : v < 0 ? 'pixel-weight-negative' : 'pixel-weight-zero');

// Clip the half-plane w1 x + w2 y + b > 0 to a rectangular window; returns polygon vertices.
function positiveRegion(w1, w2, b, [lo, hi], [ylo, yhi] = [lo, hi]) {
  const square = [[lo, ylo], [hi, ylo], [hi, yhi], [lo, yhi]];
  const value = ([x, y]) => w1 * x + w2 * y + b;
  const out = [];
  square.forEach((point, i) => {
    const next = square[(i + 1) % 4], a = value(point), c = value(next);
    if (a > 0) out.push(point);
    if ((a > 0) !== (c > 0) && a !== c) {
      const t = a / (a - c);
      out.push([point[0] + t * (next[0] - point[0]), point[1] + t * (next[1] - point[1])]);
    }
  });
  return out;
}
function boundaryInWindow(w1, w2, b, [lo, hi], [ylo, yhi] = [lo, hi]) {
  if (w1 === 0 && w2 === 0) return [];
  const points = [];
  if (w2 !== 0) [lo, hi].forEach(x => { const y = -(w1 * x + b) / w2; if (y >= ylo - 1e-9 && y <= yhi + 1e-9) points.push([x, y]); });
  if (w1 !== 0) [ylo, yhi].forEach(y => { const x = -(w2 * y + b) / w1; if (x >= lo - 1e-9 && x <= hi + 1e-9) points.push([x, y]); });
  const unique = points.filter((p, i) => points.findIndex(q => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9) === i);
  return unique.length >= 2 ? unique.slice(0, 2) : [];
}

function Grid({ label, cells, render, interactive }) {
  return <div className="pixel-grid" role={interactive ? 'group' : 'img'} aria-label={label}>{cells.map(render)}</div>;
}

// §1, first view: one template, three images, bias −2.
export function TemplateExampleFigure() {
  const weights = pixelTemplates.vertical.weights, bias = -2;
  const images = ['Clean vertical bar', 'Vertical bar + stray pixel', 'Horizontal bar'];
  return <figure className="template-example" id="neuron-template-example" data-figure="template-example">
    <div className="template-example-key">
      <div><p className="grid-label">Template: one weight per pixel</p><Grid label={`Template weights ${weights.map(signed).join(', ')}`} cells={weights} render={(w, i) => <span key={i} className={tone(w)}>{signed(w)}</span>} /></div>
      <p>+1 (amber) on the middle column, −1 (blue) everywhere else.<br />Bias b = −2. Answer <strong>yes</strong> only when the score z is above 0.</p>
    </div>
    <div className="template-example-cases">{images.map(name => {
      const pixels = pixelPresets[name], r = scorePixels(pixels, weights, bias);
      return <div className="template-example-case" key={name}>
        <p className="grid-label">{name}</p>
        <div className="template-example-grids">
          <div><small>image: 1 = inked</small><Grid label={`${name}: ${pixels.join(', ')}`} cells={pixels} render={(ink, i) => <span key={i} className={ink ? 'template-ink' : 'template-blank'}>{ink}</span>} /></div>
          <span className="template-times" aria-hidden="true">×w →</span>
          <div><small>products pixel × weight</small><Grid label={`Products: ${r.contributions.map(signed).join(', ')}`} cells={r.contributions} render={(c, i) => <span key={i} className={tone(c)}>{c === 0 ? '0' : signed(c)}</span>} /></div>
        </div>
        <p className="template-sum">{fmt(r.positive)} − {fmt(-r.negative)} − {fmt(-bias)} = <strong>z = {fmt(r.score)}</strong> → <strong className={r.fires ? 'pixel-yes' : 'pixel-no'}>{r.fires ? 'yes' : 'no'}</strong></p>
      </div>;
    })}</div>
  </figure>;
}

// Investigation A: click pixels or weights; move the bias; switch the template.
export function PixelTemplateLab() {
  const [pixels, setPixels] = useState(pixelPresets['Vertical bar + stray pixel']),
    [weights, setWeights] = useState(pixelTemplates.vertical.weights),
    [bias, setBias] = useState(-2),
    r = scorePixels(pixels, weights, bias);
  const toggle = i => setPixels(old => old.map((v, j) => (j === i ? 1 - v : v)));
  const cycle = i => setWeights(old => old.map((w, j) => (j === i ? (w === 1 ? 0 : w === 0 ? -1 : 1) : w)));
  const cell = i => `row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`;
  const template = Object.entries(pixelTemplates).find(([, t]) => t.weights.every((v, i) => v === weights[i]))?.[0] ?? 'edited';
  const explanation = r.score === 0 ? 'The supporting products, the opposing products and the bias cancel exactly; the strict rule z > 0 answers no at this tie.'
    : r.fires ? 'The supporting products outweigh the opposing ones by more than the bias demands.'
      : r.positive + bias > 0 ? 'The supporting products alone would pass the bias, but inked pixels with negative weights pulled the score down.'
        : 'Not enough supporting evidence has arrived to overcome the bias.';
  return <Frame id="perceptron-pixel-template-lab" title="Investigation A: score your own 3 × 3 image">
    <div className="pixel-grids">
      <div><p className="grid-label">Image x · click a pixel</p><Grid interactive label="Image pixels" cells={pixels} render={(ink, i) =>
        <button key={i} type="button" className={ink ? 'pixel-ink' : 'pixel-blank'} aria-pressed={!!ink} aria-label={`Image pixel ${cell(i)}: ${ink ? 'inked, 1' : 'blank, 0'}`} onClick={() => toggle(i)}>{ink}</button>} /></div>
      <div><p className="grid-label">Weights w · click to change</p><Grid interactive label="Template weights" cells={weights} render={(w, i) =>
        <button key={i} type="button" className={tone(w)} aria-label={`Weight at ${cell(i)}: ${signed(w)}. Activate to cycle +1, 0, −1.`} onClick={() => cycle(i)}>{signed(w)}</button>} /></div>
      <div><p className="grid-label">Products x × w</p><Grid label={`Products: ${r.contributions.map(signed).join(', ')}`} cells={r.contributions} render={(c, i) =>
        <span key={i} className={tone(c)}>{c === 0 ? '0' : signed(c)}</span>} /></div>
    </div>
    <div className="flow-controls">
      <NumberControl name="Bias b" value={bias} onChange={setBias} min={-6} max={2} step={.5} />
      <Choice label="Template" options={[['vertical', 'Vertical stroke'], ['horizontal', 'Horizontal stroke']]} value={template} onChange={key => setWeights(pixelTemplates[key].weights)} />
    </div>
    <p className="flow-readout" data-testid="pixel-score">Supporting <strong>{signed(r.positive)}</strong>, opposing <strong>{fmt(r.negative)}</strong>, bias <strong>{fmt(bias)}</strong>: score z = <strong>{fmt(r.score)}</strong>, so the answer is <strong className={r.fires ? 'pixel-yes' : 'pixel-no'}>{r.fires ? 'yes' : 'no'}</strong>. {explanation}</p>
  </Frame>;
}

// §1: the score as a tilted ramp; level lines; distance along w.
export function ScoreLevelFigure() {
  const w = [1.5, -2], b = -1, point = [2, -1], lo = -4, hi = 4;
  const px = x => 40 + (x - lo) * 30, py = y => 280 - (y - lo) * 30;
  const norm = Math.hypot(...w), z = w[0] * point[0] + w[1] * point[1] + b;
  const foot = point.map((v, i) => v - z / norm ** 2 * w[i]);
  const pos = positiveRegion(w[0], w[1], b, [lo, hi]), neg = positiveRegion(-w[0], -w[1], -b, [lo, hi]);
  const arrowStart = [-2, -2], arrowEnd = [arrowStart[0] + w[0] / norm * 1.6, arrowStart[1] + w[1] / norm * 1.6];
  return <figure className="perceptron-level-figure" id="neuron-score-levels" data-figure="score-levels">
    <svg className="perceptron-chart" viewBox="0 0 400 320" role="img" aria-label="Input plane from −4 to 4. Parallel lines mark score −4, 0 and 4 for w = (1.5, −2), b = −1. The amber side scores positive, the blue side 0 or less. The point (2, −1) lies on the score-4 line, 1.6 units from the boundary; an arrow along w shows the direction in which the score increases.">
      <defs><marker id="level-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#f3d48f" /></marker></defs>
      <polygon points={pos.map(p => `${px(p[0])},${py(p[1])}`).join(' ')} className="level-positive" />
      <polygon points={neg.map(p => `${px(p[0])},${py(p[1])}`).join(' ')} className="level-negative" />
      {[-4, -2, 0, 2, 4].map(n => <g key={n}><line className="perceptron-grid" x1={px(n)} x2={px(n)} y1={py(hi)} y2={py(lo)} /><line className="perceptron-grid" x1={px(lo)} x2={px(hi)} y1={py(n)} y2={py(n)} /><text x={px(n)} y="300" textAnchor="middle">{n}</text><text x="30" y={py(n) + 4} textAnchor="end">{n}</text></g>)}
      {[-4, 0, 4].map(level => { const seg = boundaryInWindow(w[0], w[1], b - level, [lo, hi]); return seg.length === 2 && <line key={level} x1={px(seg[0][0])} y1={py(seg[0][1])} x2={px(seg[1][0])} y2={py(seg[1][1])} className={level === 0 ? 'level-boundary' : 'level-line'} />; })}
      <line x1={px(point[0])} y1={py(point[1])} x2={px(foot[0])} y2={py(foot[1])} className="perceptron-guide" />
      <line x1={px(arrowStart[0])} y1={py(arrowStart[1])} x2={px(arrowEnd[0])} y2={py(arrowEnd[1])} className="level-direction" markerEnd="url(#level-arrow)" />
      <circle cx={px(point[0])} cy={py(point[1])} r="6" className="perceptron-dot" />
      <text x={px(point[0]) + 9} y={py(point[1]) + 16} className="level-label">(2, −1): z = 4</text>
      <text x={px(arrowEnd[0]) + 8} y={py(arrowEnd[1]) + 4} className="level-label">w</text>
      <text x={px(4) + 5} y={py(0.5) + 4} className="level-label">z = 4</text>
      <text x={px(4) + 5} y={py(2.5) + 4} className="level-label">z = 0 (boundary)</text>
      <text x={px(10 / 3)} y={py(4) - 7} textAnchor="middle" className="level-label">z = −4</text>
      <text x={px(1.1)} y={py(-3.5)} className="level-label">z &gt; 0: output 1</text>
      <text x={px(-3.6)} y={py(3.4)} className="level-label">z ≤ 0: output 0</text>
      <text x="175" y="318" textAnchor="middle">Input x₁</text><text x="40" y="12">Input x₂</text>
    </svg>
  </figure>;
}

function CornerPlane({ labels, coefficients, current, window = [-0.5, 1.5] }) {
  const [lo, hi] = window, px = x => 36 + (x - lo) * 120, py = y => 276 - (y - lo) * 120;
  const [w1, w2, b] = coefficients;
  const seg = boundaryInWindow(w1, w2, b, window), pos = positiveRegion(w1, w2, b, window);
  return <svg className="perceptron-chart perceptron-trace-plane" viewBox="0 0 312 312" role="img" aria-label={`Four corners with labels ${labels.map(l => (l > 0 ? '+1' : '−1')).join(', ')}. Current boundary ${seg.length ? `${fmt(w1)}x₁ + ${fmt(w2)}x₂ + ${fmt(b)} = 0` : 'absent'}.`}>
    <rect x={px(lo)} y={py(hi)} width={(hi - lo) * 120} height={(hi - lo) * 120} className="level-negative" />
    {pos.length > 2 && <polygon points={pos.map(p => `${px(p[0])},${py(p[1])}`).join(' ')} className="level-positive" />}
    {[0, 1].map(n => <g key={n}><line className="perceptron-grid" x1={px(n)} x2={px(n)} y1={py(hi)} y2={py(lo)} /><line className="perceptron-grid" x1={px(lo)} x2={px(hi)} y1={py(n)} y2={py(n)} /><text x={px(n)} y="300" textAnchor="middle">{n}</text><text x="26" y={py(n) + 4} textAnchor="end">{n}</text></g>)}
    {seg.length === 2 && <line x1={px(seg[0][0])} y1={py(seg[0][1])} x2={px(seg[1][0])} y2={py(seg[1][1])} className="level-boundary" />}
    {corners.map((x, i) => <g key={i}>
      {current === i && <circle cx={px(x[0])} cy={py(x[1])} r="15" className="trace-current" />}
      <circle cx={px(x[0])} cy={py(x[1])} r="9" className={labels[i] > 0 ? 'target-positive' : 'target-negative'} />
      <text x={px(x[0])} y={py(x[1]) + (x[1] ? -20 : 32)} textAnchor="middle">{x.join('')} · label {labels[i] > 0 ? '+1' : '−1'}</text>
    </g>)}
  </svg>;
}

function boundaryNote([w1, w2, b], ended) {
  if (w1 === 0 && w2 === 0) return `No boundary line${ended ? '' : ' yet'}: both weights are 0, so every point scores ${fmt(b)} and is predicted ${b > 0 ? '+1' : '−1'}.`;
  if (!boundaryInWindow(w1, w2, b, [-0.5, 1.5]).length) return 'The boundary lies outside this window: every corner shown is on the same side.';
  return `Boundary: ${term(w1)}x₁ + ${term(w2)}x₂ + ${term(b)} = 0.`;
}

// Investigation C: present one corner at a time to the perceptron rule.
export function PerceptronTraceLab() {
  // Opens at the end of AND's epoch 1, the state the prose walks through by hand; Back replays it.
  const [task, setTask] = useState('AND'), [cursor, setCursor] = useState(4);
  const labels = booleanTargets[task];
  const trace = perceptronTrace(labels), steps = trace.steps, last = steps.length;
  const shown = cursor === 0 ? null : steps[cursor - 1];
  const coefficients = shown ? shown.after : [0, 0, 0];
  const next = steps[cursor];
  const passesDone = trace.passes.filter(p => steps.slice(0, cursor).some(s => s.pass === p.pass && s.row === 3));
  return <Frame id="perceptron-trace-lab" title="Investigation C: step through perceptron training">
    <div className="flow-columns-2">
      <CornerPlane labels={labels} coefficients={coefficients} current={shown ? shown.row : undefined} />
      <div>
        <p className="flow-readout" data-testid="trace-step">{shown ? <>
          Epoch {shown.pass}, corner {shown.x.join('')} with label {signed(shown.label)}.<br />
          Score = {term(shown.before[0])}·{shown.x[0]} + {term(shown.before[1])}·{shown.x[1]} + {term(shown.before[2])} = <strong>{fmt(shown.score)}</strong>.<br />
          Margin y × score = <strong>{fmt(shown.margin)}</strong> {shown.updated ? '≤ 0: a mistake or tie, so update.' : '> 0: correct, so no change.'}<br />
          {shown.updated ? <>Add {signed(shown.label)} × ({shown.x[0]}, {shown.x[1]}, 1): ({shown.before.map(fmt).join(', ')}) → <strong>({shown.after.map(fmt).join(', ')})</strong>.</> : <>Coefficients stay ({shown.after.map(fmt).join(', ')}).</>}
        </> : <>Start: w₁ = w₂ = b = 0. Every corner scores 0, a tie, so the first corner presented must update.</>}</p>
        <p className="perceptron-note" data-testid="trace-boundary">{boundaryNote(coefficients, cursor === last)} Step {cursor} of {last}.</p>
        <p className="perceptron-note">Updates in each completed epoch: {passesDone.length ? passesDone.map(p => p.updates).join(', ') : 'none completed yet'}.</p>
      </div>
    </div>
    <div className="flow-controls">
      <Choice label="Task" options={Object.keys(booleanTargets).map(name => [name, name])} value={task} onChange={name => { setTask(name); setCursor(0); }} />
      <div className="flow-choice" role="group" aria-label="Step through training">
        <button type="button" disabled={cursor === 0} onClick={() => setCursor(c => c - 1)}>Back</button>
        <button type="button" disabled={cursor === last} onClick={() => setCursor(c => c + 1)}>Present {next ? `corner ${next.x.join('')}` : 'next corner'}</button>
        <button type="button" disabled={cursor === last} onClick={() => setCursor(last)}>Run to the end</button>
        <button type="button" disabled={cursor === 0} onClick={() => setCursor(0)}>Start over</button>
      </div>
    </div>
    <p className="flow-readout" data-testid="trace-summary">{cursor < last ? `Training stops after an epoch with no update, or after 12 epochs.` : trace.converged ? `An epoch with no updates ends training at (${trace.passes[trace.passes.length - 1].coefficients.map(fmt).join(', ')}). Every corner has a positive margin: one straight line separates the labels.` : 'After 12 epochs the rule is still updating, and it always would be: no straight line separates these labels, so the corrections keep undoing each other.'}</p>
  </Frame>;
}

// §3: XOR as a function of the count s = x₁ + x₂, built from two ramps.
export function XorRampFigure() {
  const rows = xorRampRows();
  const xs = Array.from({ length: 61 }, (_, i) => -.5 + i * .05);
  return <figure id="neuron-xor-ramps" data-figure="xor-ramps">
    <CurvePlot curves={[
      { data: xs.map(s => [s, Math.max(0, s)]), color: activationColors.relu, dash: '2 4', width: 1.8, label: 'h₁ = ReLU(s)' },
      { data: xs.map(s => [s, -2 * Math.max(0, s - 1)]), color: '#e99b88', dash: '6 4', width: 1.8, label: '−2·h₂', labelAt: -2.6 },
      { data: xs.map(s => [s, Math.max(0, s) - 2 * Math.max(0, s - 1)]), color: '#f3eee2', width: 3.4, label: 'q = h₁ − 2h₂', labelAt: -.4 },
    ]} xDomain={[-.5, 2.5]} xTicks={[0, 1, 2]} yDomain={[-3, 2.5]} yTicks={[-3, -2, -1, 0, 1, 2]} points={rows.map(r => [r.s, r.target])} pointLabels={rows.map(r => r.target ? [r.s, r.target, `target ${r.target}`, 0, -12, "middle"] : [r.s, r.target, `target ${r.target}`, 0, 20, "middle"])} xLabel="Number of inputs on, s" yLabel="Value" />
    <figcaption>Dots mark XOR's targets at s = 0, 1, 2. The first ramp h₁ rises from s = 0; the second, weighted −2, starts at s = 1 and bends the total q back down through all three targets. The thin dotted and dashed lines are the two parts; the thick white line is their sum q.</figcaption>
  </figure>;
}

// §3: the hidden layer moves the corners so that one straight line is enough.
export function HiddenSpaceFigure() {
  const rows = hiddenSpaceRows();
  const inPx = x => 30 + (x + .3) * 110, inPy = y => 196 - (y + .3) * 110;
  const hPx = x => 30 + (x + .3) * 90, hPy = y => 176 - (y + .3) * 90;
  const seg = boundaryInWindow(1, -2, -.5, [-.3, 2.4], [-.3, 1.4]), pos = positiveRegion(1, -2, -.5, [-.3, 2.4], [-.3, 1.4]);
  const dot = (cx, cy, target, key) => <circle key={key} cx={cx} cy={cy} r="8" className={target ? 'target-positive' : 'target-negative'} />;
  return <figure id="neuron-hidden-space" data-figure="hidden-space">
    <div className="hidden-space-layout">
      <div><p className="grid-label">Input space (x₁, x₂)</p>
        <svg className="perceptron-chart" viewBox="0 0 230 226" role="img" aria-label="The four input corners. Targets 1 at 01 and 10 sit on one diagonal, targets 0 at 00 and 11 on the other; no single line separates them.">
          {[0, 1].map(n => <g key={n}><line className="perceptron-grid" x1={inPx(n)} x2={inPx(n)} y1={inPy(1.3)} y2={inPy(-.3)} /><line className="perceptron-grid" x1={inPx(-.3)} x2={inPx(1.3)} y1={inPy(n)} y2={inPy(n)} /><text x={inPx(n)} y="220" textAnchor="middle">{n}</text><text x="22" y={inPy(n) + 4} textAnchor="end">{n}</text></g>)}
          {rows.map(r => dot(inPx(r.x[0]), inPy(r.x[1]), r.target, r.id))}
          {rows.map(r => <text key={'t' + r.id} x={inPx(r.x[0]) + 12} y={inPy(r.x[1]) - 11}>{r.id} → {r.target}</text>)}
        </svg></div>
      <div className="hidden-space-arrow" aria-hidden="true">h₁ = ReLU(x₁ + x₂)<br />h₂ = ReLU(x₁ + x₂ − 1)<br /><span className="arrow-wide">→</span><span className="arrow-narrow">↓</span></div>
      <div><p className="grid-label">Hidden space (h₁, h₂)</p>
        <svg className="perceptron-chart" viewBox="0 0 290 206" role="img" aria-label="Hidden coordinates: 00 maps to (0, 0), both 01 and 10 map to (1, 0), 11 maps to (2, 1). The line h1 − 2 h2 = 0.5 puts (1, 0) alone on its positive side.">
          {pos.length > 2 && <polygon points={pos.map(p => `${hPx(p[0])},${hPy(p[1])}`).join(' ')} className="level-positive" />}
          {[0, 1, 2].map(n => <g key={n}><line className="perceptron-grid" x1={hPx(n)} x2={hPx(n)} y1={hPy(1.4)} y2={hPy(-.3)} /><text x={hPx(n)} y="200" textAnchor="middle">{n}</text></g>)}
          {[0, 1].map(n => <g key={n}><line className="perceptron-grid" x1={hPx(-.3)} x2={hPx(2.4)} y1={hPy(n)} y2={hPy(n)} /><text x="22" y={hPy(n) + 4} textAnchor="end">{n}</text></g>)}
          {seg.length === 2 && <line x1={hPx(seg[0][0])} y1={hPy(seg[0][1])} x2={hPx(seg[1][0])} y2={hPy(seg[1][1])} className="level-boundary" />}
          {dot(hPx(0), hPy(0), 0, 'a')}{dot(hPx(1), hPy(0), 1, 'b')}{dot(hPx(2), hPy(1), 0, 'c')}
          <text x={hPx(0) + 10} y={hPy(0) - 12}>00 → 0</text><text x={hPx(1) + 10} y={hPy(0) - 12}>01, 10 → 1</text><text x={hPx(2) - 12} y={hPy(1) - 12} textAnchor="end">11 → 0</text>
        </svg></div>
    </div>
    <figcaption>Filled amber dots are target 1, blue rings target 0, in both panels. On the left no straight line separates the targets. On the right, 01 and 10 land on the same hidden point (1, 0); the line q = h₁ − 2h₂ = 0.5 puts it alone on the amber side.</figcaption>
  </figure>;
}

// §4: nudge the score and measure how much the output moves.
// §4 opening: the three activations from §1 drawn as curves, each table score marked with its tangent.
export function SlopeCurveFigure() {
  const rows = nudgeRows(), at = name => rows.filter(r => r.name === name);
  const tangent = (r, half) => ({ data: [[r.z - half, r.before - r.slope * half], [r.z + half, r.before + r.slope * half]], color: '#f3eee2', dash: '5 4', width: 1.4 });
  const zs = range => Array.from({ length: 121 }, (_, i) => range[0] + i * (range[1] - range[0]) / 120);
  const step = at('step'), relu = at('relu'), sig = at('sigmoid');
  const panels = [
    { title: 'Step', x: [-3, 3], y: [-.2, 1.2], yTicks: [0, 1], curves: [{ data: [[-3, 0], [0, 0]], color: activationColors.step }, { data: [[0, 1], [3, 1]], color: activationColors.step }, tangent(step[0], .8)], points: step.map(r => [r.z, r.before]), hollow: [[0, 1]],
      labels: [[2, 1, 'slope 0', 0, -12, 'middle'], [0, 0, 'jump: no slope', 8, 18]] },
    { title: 'ReLU', x: [-3, 3], y: [-.5, 3], yTicks: [0, 1, 2, 3], curves: [{ data: zs([-3, 3]).map(z => [z, Math.max(0, z)]), color: activationColors.relu }, ...relu.map(r => tangent(r, .8))], points: relu.map(r => [r.z, r.before]),
      labels: [[2, 2, 'slope 1', -10, -6, 'end'], [-2, 0, 'slope 0', 0, -12, 'middle']] },
    { title: 'Sigmoid', x: [-6, 6], y: [0, 1], yTicks: [0, .5, 1], curves: [{ data: zs([-6, 6]).map(z => [z, 1 / (1 + Math.exp(-z))]), color: activationColors.sigmoid }, tangent(sig[0], 1.6), tangent(sig[1], 1.2)], points: sig.map(r => [r.z, r.before]),
      labels: [[0, .5, `slope ${fmt(sig[0].slope, 2)}`, -10, -8, 'end'], [5, sig[1].before, `slope ${fmt(sig[1].slope, 4)}`, 0, 40, 'end']] },
  ];
  return <figure id="neuron-slope-curves" data-figure="slope-curves">
    <div className="flow-columns-3">{panels.map(p => <CurvePlot key={p.title} title={p.title} curves={p.curves} xDomain={p.x} yDomain={p.y} yTicks={p.yTicks} points={p.points} hollowPoints={p.hollow ?? []} pointLabels={p.labels} xLabel="Score z" yLabel="Output" />)}</div>
    <figcaption>Each dot is one score from the table below. The thin white dashed segment through it is the tangent: the straight line the curve follows near that score. Its steepness, the slope, is how far the output moves per unit of score.</figcaption>
  </figure>;
}

export function NudgeSlopeFigure() {
  const rows = nudgeRows();
  return <figure id="neuron-nudge-slope" data-figure="nudge-slope">
    <PerceptronTable caption="Nudge the score by 0.01: output change divided by the nudge, beside the exact local slope" headers={['Function', 'Score z', 'Output at z', 'Output at z + 0.01', 'Change ÷ 0.01', 'Exact slope']} rows={rows.map(r => [r.title, fmt(r.z), fmt(r.before, 6), fmt(r.after, 6), fmt(r.ratio, 6), r.crossesJump ? '0 (nudge crosses the jump at 0)' : fmt(r.slope, 6)])} />
    <ol className="nudge-cards" aria-label="Nudge the score by 0.01: output change divided by the nudge, beside the exact local slope">{rows.map((r, i) => <li key={i} className={r.crossesJump ? 'is-jump' : undefined}>
      <strong>{r.title} at z = {fmt(r.z)}</strong>
      <span>output {fmt(r.before, 6)} → {fmt(r.after, 6)}</span>
      <span>change ÷ 0.01 = <b>{fmt(r.ratio, 6)}</b></span>
      <span>exact slope = <b>{r.crossesJump ? '0 (nudge crosses the jump at 0)' : fmt(r.slope, 6)}</b></span>
    </li>)}</ol>
  </figure>;
}
