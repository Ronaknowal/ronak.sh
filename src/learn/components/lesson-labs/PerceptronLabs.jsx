import { useId, useState } from 'react';
import { activation, activationNames, boundarySegment, geometry, geometryInitial, sensitivity, sigmoid, xorRows } from '../../data/perceptron-models.js';
import { activationColors, Choice, CurvePlot, fmt, Frame, NumberControl, PerceptronTable, SignedBars } from './PerceptronShared.jsx';

// Polygon of the half-plane w1 x + w2 y + b > 0 inside the square [lo, hi]².
function halfPlane(w1, w2, b, lo, hi) {
  const square = [[lo, lo], [hi, lo], [hi, hi], [lo, hi]], value = ([x, y]) => w1 * x + w2 * y + b, out = [];
  square.forEach((point, i) => {
    const next = square[(i + 1) % 4], a = value(point), c = value(next);
    if (a > 0) out.push(point);
    if ((a > 0) !== (c > 0) && a !== c) { const t = a / (a - c); out.push([point[0] + t * (next[0] - point[0]), point[1] + t * (next[1] - point[1])]); }
  });
  return out;
}

function BoundaryPlane({ x1, x2, w1, w2, b, result }) {
  const id = useId(), px = x => 38 + (x + 4) * 31, py = y => 286 - (y + 4) * 31;
  const line = boundarySegment(w1, w2, b), foot = result.foot, footVisible = foot && foot.every(v => v >= -4 && v <= 4);
  const pos = halfPlane(w1, w2, b, -4, 4), neg = halfPlane(-w1, -w2, -b, -4, 4);
  return <svg className="perceptron-chart" viewBox="0 0 330 332" role="img" aria-labelledby={`${id}-title`}>
    <title id={`${id}-title`}>Input plane from −4 to 4. Boundary line where the score is 0; amber side scores positive, blue side scores 0 or less. The point ({fmt(x1)}, {fmt(x2)}) has signed distance {fmt(result.distance)} from the line.</title>
    <defs><clipPath id={`${id}-clip`}><rect x="38" y="38" width="248" height="248" /></clipPath></defs>
    <g clipPath={`url(#${id}-clip)`}>
      {pos.length > 2 && <polygon className="level-positive" points={pos.map(p => `${px(p[0])},${py(p[1])}`).join(' ')} />}
      {neg.length > 2 && <polygon className="level-negative" points={neg.map(p => `${px(p[0])},${py(p[1])}`).join(' ')} />}
    </g>
    {[-4, -2, 0, 2, 4].map(n => <g key={n}><line className="perceptron-grid" x1={px(n)} x2={px(n)} y1="38" y2="286" /><line className="perceptron-grid" x1="38" x2="286" y1={py(n)} y2={py(n)} /><text x={px(n)} y="306" textAnchor="middle">{n}</text><text x="26" y={py(n) + 4} textAnchor="end">{n}</text></g>)}
    <g clipPath={`url(#${id}-clip)`}>
      {line.length === 2 && <line className="perceptron-boundary-line" x1={px(line[0][0])} y1={py(line[0][1])} x2={px(line[1][0])} y2={py(line[1][1])} />}
      {foot && <line className="perceptron-guide" x1={px(x1)} y1={py(x2)} x2={px(foot[0])} y2={py(foot[1])} />}
    </g>
    {footVisible && <rect x={px(foot[0]) - 4} y={py(foot[1]) - 4} width="8" height="8" fill="#f3eee2" />}
    <circle className="perceptron-dot" cx={px(x1)} cy={py(x2)} r="6.5" />
    <text className="perceptron-point-label" x={px(x1) + 10} y={py(x2) + 4}>x = ({fmt(x1)}, {fmt(x2)})</text>
    <text x="276" y="276" textAnchor="end" className="level-label">score &gt; 0: output 1</text>
    <text x="48" y="56" className="level-label">score ≤ 0: output 0</text>
    <text x="160" y="328" textAnchor="middle">Input x₁</text><text x="38" y="20">Input x₂</text>
  </svg>;
}

const paren = value => (value < 0 ? `(${fmt(value)})` : fmt(value));

// Investigation B: move the point, or multiply every coefficient by the same positive c.
export function GeometryLab() {
  const [x2, setX2] = useState(geometryInitial.x2), [c, setC] = useState(1);
  const { x1, w1, w2, b } = geometryInitial;
  const base = geometry({ ...geometryInitial, x2 }), scaled = geometry({ ...geometryInitial, x2 }, c);
  const side = scaled.score > 0 ? 'above 0, so the hard output is 1' : scaled.score === 0 ? 'exactly 0, a tie, so the strict rule outputs 0' : 'below 0, so the hard output is 0';
  return <Frame id="perceptron-geometry-lab" title="Investigation B: move the point, then rescale every coefficient">
    <div className="flow-columns-2">
      <BoundaryPlane x1={x1} x2={x2} w1={w1 * c} w2={w2 * c} b={b * c} result={scaled} />
      <div>
        <SignedBars labels={['w₁x₁', 'w₂x₂', 'bias b']} values={scaled.products} extent={8 * c} />
        <p className="flow-readout" data-testid="geometry-result">Score z = {fmt(scaled.products[0])} + {paren(scaled.products[1])} + {paren(scaled.products[2])} = <strong>{fmt(scaled.score)}</strong>, {side}. Weight length ‖w‖ = <strong>{fmt(scaled.norm)}</strong>, so the signed distance to the line is z ÷ ‖w‖ = <strong>{fmt(scaled.distance)}</strong>. Sigmoid of the score: <strong>{fmt(scaled.sigmoid)}</strong>.</p>
        <p className="flow-readout">{c === 1 ? 'At c = 1 the coefficients are the original (1.5, −2) and −1.' : `Multiplying by c = ${fmt(c)} changed the score from ${fmt(base.score)} to ${fmt(scaled.score)} and the length from 2.5 to ${fmt(scaled.norm)}; their ratio, the distance, stays ${fmt(base.distance)}. The line did not move, but sigmoid moved from ${fmt(base.sigmoid)} to ${fmt(scaled.sigmoid)}.`}</p>
      </div>
    </div>
    <div className="flow-controls">
      <NumberControl name="Point height x₂" value={x2} onChange={setX2} min={-4} max={4} />
      <NumberControl name="Common scale c" value={c} onChange={setC} min={.25} max={3} />
    </div>
  </Frame>;
}

// The same score 4 sent through three activations.
export function ActivationChoiceFigure() {
  const zs = Array.from({ length: 121 }, (_, i) => -6 + i / 10);
  const panels = [
    { title: 'Step: 1 if z > 0, else 0', curves: [{ data: [[-6, 0], [0, 0]], color: activationColors.step }, { data: [[0, 1], [6, 1]], color: activationColors.step }], y: [-.2, 1.2], ticks: [0, 1], out: 1 },
    { title: 'ReLU: max(0, z)', curves: [{ data: zs.map(z => [z, Math.max(0, z)]), color: activationColors.relu }], y: [-1, 6], ticks: [0, 2, 4, 6], out: 4 },
    { title: 'Sigmoid: 1 / (1 + e⁻ᶻ)', curves: [{ data: zs.map(z => [z, sigmoid(z)]), color: activationColors.sigmoid }], y: [0, 1], ticks: [0, .5, 1], out: sigmoid(4) },
  ];
  return <figure id="neuron-activation-choices" data-figure="activation-choices">
    <div className="flow-columns-3">{panels.map(panel => <CurvePlot key={panel.title} title={panel.title} curves={panel.curves} yDomain={panel.y} yTicks={panel.ticks} selected={4} points={[[4, panel.out]]} pointLabels={[[4, panel.out, `a = ${fmt(panel.out, 3)}`]]} hollowPoints={panel.title.startsWith('Step') ? [[0, 1]] : []} yLabel="Output a" />)}</div>
    <figcaption>Each panel draws one activation φ as a curve. The dashed line is the same score z = 4 in every panel; the dot shows the output a = φ(4) that each one sends on.</figcaption>
  </figure>;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const sixths = value => {
  const n = Math.round(value * 6);
  if (Math.abs(value * 6 - n) > 1e-9) return fmt(value);
  const g = gcd(Math.abs(n), 6), num = n / g, den = 6 / g;
  return den === 1 ? fmt(num) : `${num < 0 ? '−' : ''}${Math.abs(num)}/${den}`;
};

// Investigation D: repair all four XOR rows by editing the delayed ramp and its output weight.
export function XorLab() {
  const [bias, setBias] = useState(-1), [coefficient, setCoefficient] = useState(-1);
  const rows = xorRows(bias, coefficient), inactive = rows.every(row => row.h2 === 0);
  const message = inactive ? 'The second hidden ramp is 0 at every corner, so its output weight cannot change any output.'
    : rows.every(row => row.matches) ? 'Every row matches its target: the delayed ramp cancels the both-on corner and leaves the single-on corners unchanged.'
      : Math.abs(bias + .5) < 1e-10 ? 'With hidden bias −0.5, the single-on rows need v = 0 while the 11 row needs v = −4/3. One weight cannot satisfy both (practice 3 works the equations).'
        : 'A weight only changes rows where its hidden value is nonzero. Watch all four residuals: fixing one corner can break another.';
  return <Frame id="perceptron-xor-lab" title="Investigation D: repair all four XOR rows">
    <PerceptronTable caption={`q = h₁ + v·h₂ with h₁ = ReLU(s), h₂ = ReLU(s ${bias < 0 ? '−' : '+'} ${fmt(Math.abs(bias))}), v = ${sixths(coefficient)}`} headers={['Corner', 'h₁, h₂', 'q', 'Target', 'Residual q − target']} rows={rows.map(r => [r.id, `${fmt(r.h1)}, ${fmt(r.h2)}`, fmt(r.q), r.target, r.matches ? '0 ✓' : fmt(r.residual)])} />
    {/* The same rows as one line each, shown instead of the table when the lab is narrow, so the residual stays in view. */}
    <ol className="xor-repair-rows" aria-label="The four corners: hidden values, output, target and residual">{rows.map(r => <li key={r.id}><strong>Corner {r.id}</strong>: h₁, h₂ = {fmt(r.h1)}, {fmt(r.h2)}; q = {fmt(r.q)}; target {r.target}; residual <b>{r.matches ? '0 ✓' : fmt(r.residual)}</b></li>)}</ol>
    <div className="flow-controls">
      <NumberControl name="Second hidden bias" value={bias} onChange={setBias} min={-3} max={0} />
      <NumberControl name="Second output weight v" value={coefficient} onChange={setCoefficient} min={-4} max={2} step={1 / 6} format={sixths} />
    </div>
    <p className="flow-readout" data-testid="xor-result">{message}</p>
  </Frame>;
}

// Only the activations taught by §4; SiLU and GELU are drawn in §7 where they are defined.
const labActivations = ['sigmoid', 'tanh', 'relu', 'leaky_relu'];

// Investigation E: value, local slope and the input sensitivity w·φ′(z).
export function ActivationLab() {
  const [name, setName] = useState('relu'), [z, setZ] = useState(2), [weight, setWeight] = useState(.5);
  const r = sensitivity(name, z, weight);
  const samples = Array.from({ length: 241 }, (_, i) => -6 + i * .05), values = samples.map(x => [x, activation(name, x).value]);
  const discontinuous = ['relu', 'leaky_relu'].includes(name);
  // One function, one colour: the slope's two pieces share the curve colour.
  const color = activationColors[name];
  const slopeCurves = discontinuous ? [{ data: [[-6, activation(name, -1).slope], [0, activation(name, -1).slope]], color }, { data: [[0, 1], [6, 1]], color }] : [{ data: samples.map(x => [x, activation(name, x).slope]), color }];
  const valueDomain = name === 'sigmoid' ? [0, 1] : name === 'tanh' ? [-1, 1] : [-1, 6];
  return <Frame id="perceptron-activation-lab" title="Investigation E: output, local slope and input sensitivity">
    <div className="flow-columns-2">
      <CurvePlot title="Output a = φ(z)" curves={[{ data: values, color }]} yDomain={valueDomain} selected={z} points={[[z, r.value]]} yLabel="Output" />
      <CurvePlot title="Local slope φ′(z)" curves={slopeCurves} yDomain={[-.25, 1.25]} yTicks={[0, .5, 1]} selected={z} points={[[z, r.slope]]} hollowPoints={discontinuous ? [[0, activation(name, -1).slope], [0, 1]] : []} yLabel="Slope" />
    </div>
    <div className="flow-controls">
      <Choice label="Activation" options={labActivations.map(key => [key, activationNames[key].replace(/ \(exact definition\)/, '')])} value={name} onChange={setName} />
      <NumberControl name="Score z" value={z} onChange={setZ} min={-6} max={6} step={.1} />
      <NumberControl name="Incoming weight w" value={weight} onChange={setWeight} min={-4} max={4} />
    </div>
    <p className="flow-readout" data-testid="sensitivity-result">At z = {fmt(z)}, {activationNames[name]} outputs <strong>{fmt(r.value)}</strong> with local slope <strong>{fmt(r.slope)}</strong>. A small input change Δx is multiplied first by the weight w = {fmt(weight)} and then by that slope, so Δa ≈ <strong>{fmt(r.sensitivity)}</strong> × Δx.{r.corner ? ` ${activationNames[name]} has a corner at 0 and no ordinary derivative there; the slope shown is PyTorch's convention ${fmt(r.slope)}.` : ''}</p>
  </Frame>;
}
