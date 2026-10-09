import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { anatomyImage, anatomyKernel, centreChange, channelImage, channelWeight, channelBias, outputTerms, convolveChannels, squareWindows, poolingMap, pool2x2, cnnStages, realSeven, edgeKernels, channelMix, groupConnections } from '../../data/convolution-foundations.js';
import { sharedFilterUpdate } from '../../data/convolution-models.js';
import './convolution-foundations.css';

// Colour vocabulary (docs/teaching/deep-learning-beginner/visual-vocabulary.md):
// cyan supplied inputs, amber learned parameters, violet computed values, orange gradients,
// thick white outline = the element currently traced. Value grids: amber positive, blue negative.
const tapName = ['w₀₀', 'w₀₁', 'w₁₀', 'w₁₁'];
const n = flowNumber;
const sub = value => (value < 0 ? `(${n(value)})` : n(value));

function Cells({ values, className = '', cell, scrollLabel }) {
  const grid = <div className={`cf-grid ${className}`} style={{ '--cols': values[0].length }}>
    {values.flatMap((row, r) => row.map((value, c) => cell(value, r, c)))}
  </div>;
  // Wide grids keep readable cells under large text and scroll inside their own region.
  return scrollLabel ? <div className="cf-grid-scroll" role="region" tabIndex={0} aria-label={scrollLabel}>{grid}</div> : grid;
}

function Panel({ label, children }) {
  return <div className="cf-panel"><p className="cf-label">{label}</p>{children}</div>;
}

/* §1 Anatomy of one convolution output (interactive) -------------------------------- */
// The centre pixel lies in all four windows, under a different kernel tap in each. An
// output moves only if that tap's weight is nonzero, so the sentence is computed, not asserted.
function describeCentreChange(centre) {
  if (centre === anatomyImage[1][1]) return '';
  const windows = centreChange(centre);
  const moved = windows.filter(w => w.weight !== 0).map((w, i) => `${i === 0 ? 'output ' : ''}(${w.u}, ${w.v}) ${i === 0 ? 'changes ' : ''}by ${n(w.delta)}`);
  const still = windows.filter(w => w.weight === 0).map(w => `output (${w.u}, ${w.v}) stays the same because its window multiplies the centre by ${tapName[w.tap]} = 0`);
  return `The centre pixel sits in all four windows: ${moved.join(', ')}${still.length ? `; ${still.join('; ')}` : ''}.`;
}

export function ConvolutionAnatomyFigure() {
  const [[u, v], setPosition] = useState([0, 0]);
  const [centre, setCentre] = useState(anatomyImage[1][1]);
  const [bias, setBias] = useState(0);
  const image = anatomyImage.map((row, r) => row.map((value, c) => (r === 1 && c === 1 ? centre : value)));
  const one = outputTerms([image], [[anatomyKernel]], [bias], 0, u, v);
  const terms = one.channels[0].terms;
  const output = convolveChannels([image], [[anatomyKernel]], [bias])[0];
  const tapAt = (r, c) => (r >= u && r < u + 2 && c >= v && c < v + 2 ? (r - u) * 2 + (c - v) : -1);
  const centreNote = describeCentreChange(centre);
  return <FlowLab id="convolution-anatomy" label="Anatomy of one convolution output">
    <div className="cf-anatomy">
      <Panel label="Input x · 3×3 · supplied">
        <Cells values={image} className="cf-input" cell={(value, r, c) => {
          const tap = tapAt(r, c);
          return <span key={`${r}${c}`} className={`cf-cell${tap >= 0 ? ' is-traced' : ''}${r === 1 && c === 1 ? ' cf-centre' : ''}`}>
            {n(value)}{tap >= 0 && <small>× {tapName[tap]}</small>}
          </span>;
        }} />
      </Panel>
      <span className="cf-op" aria-hidden="true">×</span>
      <Panel label="Kernel W · 2×2 · learned">
        <Cells values={anatomyKernel} className="cf-param" cell={(value, r, c) => <span key={`${r}${c}`} className="cf-cell">{n(value)}<small>{tapName[r * 2 + c]}</small></span>} />
        <p className="cf-bias-chip"><span className="cf-param-text">+ bias b = {n(bias)}</span></p>
      </Panel>
      <span className="cf-op" aria-hidden="true">=</span>
      <Panel label="Output y · 2×2 · computed">
        <Cells values={output} className="cf-computed" cell={(value, r, c) => <button type="button" key={`${r}${c}`} className={`cf-cell${r === u && c === v ? ' is-traced' : ''}`} aria-pressed={r === u && c === v} aria-label={`Output row ${r}, column ${c}: ${n(value)}. Trace its window.`} onClick={() => setPosition([r, c])}>{n(value)}</button>} />
        <p className="cf-small-note">Select a cell to trace it.</p>
      </Panel>
    </div>
    <FlowControls>
      <FlowSlider name="Centre pixel x[1, 1]" value={centre} onChange={setCentre} min={0} max={4} step={1} />
      <FlowSlider name="Bias b" value={bias} onChange={setBias} min={-3} max={3} step={1} />
    </FlowControls>
    <FlowReadout>
      Traced output y[{u}, {v}] = {terms.map(term => `${n(term.x)}×${sub(term.w)}`).join(' + ')} + {sub(bias)} = <strong>{n(one.value)}</strong> (each pixel times its weight, then the bias).
      {centreNote ? ` ${centreNote}` : ''}
    </FlowReadout>
  </FlowLab>;
}

/* §1 What a feature map says about a real digit -------------------------------------- */
const signedStyle = (value, scale) => ({ background: value === 0 ? '#1a1a1a' : value > 0 ? `rgba(228, 183, 82, ${0.12 + 0.6 * value / scale})` : `rgba(131, 180, 232, ${0.12 + 0.6 * -value / scale})` });
export function EdgeMapsFigure() {
  const [picked, setPicked] = useState({ key: 'horizontal', u: 4, v: 2 });
  const maps = Object.fromEntries(Object.entries(edgeKernels).map(([key, { kernel }]) => [key, convolveChannels([realSeven], [[kernel]], [0])[0]]));
  const scale = Math.max(...Object.values(maps).flatMap(map => map.flat().map(Math.abs)));
  const { key, u, v } = picked, kernel = edgeKernels[key].kernel;
  const terms = outputTerms([realSeven], [[kernel]], [0], 0, u, v).channels[0].terms;
  const inWindow = (r, c) => r >= u && r < u + 2 && c >= v && c < v + 2;
  return <FlowLab id="edge-maps" label="Two hand-set kernels on a real handwritten 7">
    <div className="cf-anatomy cf-edge">
      <Panel label="Input · a real 7 (ink 0–16)">
        <Cells values={realSeven} className="cf-small cf-input" scrollLabel="Handwritten 7, 8 by 8 values; scroll to see all columns" cell={(value, r, c) => <span key={`${r}${c}`} className={`cf-cell cf-ink${inWindow(r, c) ? ' is-traced' : ''}`} style={{ '--ink': value / 16 }}>{value || ''}</span>} />
      </Panel>
      {Object.entries(edgeKernels).map(([mapKey, spec]) => <Panel key={mapKey} label={<>{spec.name} <span className="cf-param-text">[{spec.kernel.map(row => row.map(n).join(', ')).join(' ; ')}]</span> · {spec.reads}</>}>
        <Cells values={maps[mapKey]} className="cf-small cf-signed" scrollLabel={`${spec.name} map, 7 by 7; scroll to see all columns`} cell={(value, r, c) => {
          const current = mapKey === key && r === u && c === v;
          return <button type="button" key={`${r}${c}`} className={`cf-cell${current ? ' is-traced' : ''}`} style={signedStyle(value, scale)} aria-pressed={current} aria-label={`${spec.name} map row ${r}, column ${c}: ${n(value)}`} onClick={() => setPicked({ key: mapKey, u: r, v: c })}>{n(value)}</button>;
        }} />
      </Panel>)}
    </div>
    <FlowReadout>{edgeKernels[key].name}, traced cell ({u}, {v}): {terms.map(term => `${n(term.x)}·${sub(term.w)}`).join(' + ')} = <strong>{n(maps[key][u][v])}</strong>. Select any map cell to outline its window on the digit.</FlowReadout>
  </FlowLab>;
}

/* §1 Dense layer versus convolution, same inputs and outputs ----------------------------- */
const tapStroke = ['#e8c36f', '#f0dca8', '#b98f3a'];
function Wiring({ dense }) {
  const xs = [30, 80, 130, 180, 230], ys = [80, 130, 180];
  const lines = [];
  ys.forEach((yx, j) => xs.forEach((xx, i) => {
    const tap = i - j;
    if (dense) lines.push(<line key={`${i}${j}`} x1={xx} y1={44} x2={yx} y2={126} stroke="rgba(228, 183, 82, 0.5)" strokeWidth="1.2" />);
    else if (tap >= 0 && tap < 3) lines.push(<line key={`${i}${j}`} x1={xx} y1={44} x2={yx} y2={126} stroke={tapStroke[tap]} strokeWidth="2.6" strokeDasharray={tap === 1 ? '6 3' : tap === 2 ? '2 3' : undefined} />);
  }));
  return <svg viewBox="0 0 260 176" role="img" aria-label={dense ? 'Dense layer: every one of five inputs connects to each of three outputs with its own weight, fifteen weights.' : 'Convolution: each output connects to three neighbouring inputs; the left, centre and right connection of every output reuse the same three weights w0, w1, w2.'}>
    {lines}
    {xs.map((xx, i) => <g key={i}><circle cx={xx} cy={30} r="13" className="cf-node cf-node-in" /><text x={xx} y={35} textAnchor="middle">x{i + 1}</text></g>)}
    {ys.map((yx, j) => <g key={j}><circle cx={yx} cy={142} r="13" className="cf-node cf-node-out" /><text x={yx} y={147} textAnchor="middle">y{j + 1}</text></g>)}
  </svg>;
}
export function DenseVersusConvolutionFigure() {
  return <figure className="cf-figure" data-figure="dense-versus-convolution" id="dense-versus-convolution">
    <div className="flow-columns-2">
      <div><p className="cf-label">Dense layer · 15 weights + 3 biases</p><Wiring dense /><p className="cf-small-note">Every thin amber line is its own learned weight (dimmed only so fifteen lines stay readable).</p></div>
      <div><p className="cf-label">Convolution, 3-wide kernel · 3 weights + 1 bias</p><Wiring /><p className="cf-small-note">Solid line = w₀ (left neighbour), dashed = w₁ (centre), dotted = w₂ (right neighbour); every output reuses the same three.</p></div>
    </div>
  </figure>;
}

/* §2 One output channel reads a patch from every input channel --------------------------- */
export function ChannelStackFigure() {
  const [o, setO] = useState(0);
  const [[u, v], setPosition] = useState([0, 0]);
  const result = outputTerms(channelImage, channelWeight, channelBias, o, u, v);
  const maps = convolveChannels(channelImage, channelWeight, channelBias);
  const names = ['A', 'B'];
  const inWindow = (r, c) => r >= u && r < u + 2 && c >= v && c < v + 2;
  return <FlowLab id="convolution-channels-stack" label="One output channel reads a patch from every input channel">
    <div className="cf-channel-rows">
      {channelImage.map((channel, c) => <div className="cf-channel-row" key={c}>
        <Panel label={`Input channel ${c} · supplied`}><Cells values={channel} className="cf-input" cell={(value, r, cc) => <span key={`${r}${cc}`} className={`cf-cell${inWindow(r, cc) ? ' is-traced' : ''}`}>{n(value)}</span>} /></Panel>
        <span className="cf-op" aria-hidden="true">×</span>
        <Panel label={`Kernel ${names[o]}, slice ${c} · learned`}><Cells values={channelWeight[o][c]} className="cf-param" cell={(value, r, cc) => <span key={`${r}${cc}`} className="cf-cell">{n(value)}</span>} /></Panel>
        <p className="cf-partial">slice sum: {result.channels[c].terms.map(term => `${n(term.x)}·${sub(term.w)}`).join(' + ')} = <strong>{n(result.channels[c].sum)}</strong></p>
      </div>)}
    </div>
    <div className="cf-outputs">
      {maps.map((map, i) => <Panel key={i} label={`Output channel ${names[i]} · computed`}><Cells values={map} className="cf-computed" cell={(value, r, c) => {
        const current = i === o && r === u && c === v;
        return <button type="button" key={`${r}${c}`} className={`cf-cell${current ? ' is-traced' : ''}`} aria-pressed={current} aria-label={`Output channel ${names[i]}, row ${r}, column ${c}: ${n(value)}`} onClick={() => { setO(i); setPosition([r, c]); }}>{n(value)}</button>;
      }} /></Panel>)}
    </div>
    <FlowControls><FlowChoice label="Output channel" options={[[0, 'A'], [1, 'B']]} value={o} onChange={setO} /></FlowControls>
    <FlowReadout>y{names[o]}[{u}, {v}] = {result.channels.map(ch => sub(ch.sum)).join(' + ')} + bias {sub(result.bias)} = <strong>{n(result.value)}</strong>. Shapes: input [2, 3, 3], weight [2, 2, 2, 2], bias [2], output [2, 2, 2].</FlowReadout>
  </FlowLab>;
}

/* §2 A 1×1 kernel mixes channels at one position ----------------------------------------- */
export function ChannelMixFigure() {
  const [x, setX] = useState([2, 3]);
  const out = channelMix.weights.map((row, o) => row.reduce((sum, w, c) => sum + w * x[c], channelMix.bias[o]));
  const set = i => value => setX(previous => previous.map((item, j) => (j === i ? value : item)));
  const ys = [50, 130], outY = [50, 130];
  return <FlowLab id="convolution-channel-mix" label="A 1×1 kernel mixes the channels at one position">
    <svg className="cf-mix" viewBox="0 0 360 180" role="img" aria-label={`One position with input channel values ${x[0]} and ${x[1]}. Output A uses weights 4 and −1 and bias 1; output B uses weights 2 and 1 and bias 0.`}>
      {channelMix.weights.map((row, o) => row.map((w, c) => {
        // Straight wires carry their label midway, above the line; the two crossing wires
        // carry theirs near the source node, before the crossing, on the outer side.
        const straight = c === o;
        const t = straight ? 0.5 : 0.16;
        const lx = 70 + t * 206, ly = ys[c] + t * (outY[o] - ys[c]) + (straight ? -8 : c === 0 ? 20 : -10);
        return <g key={`${o}${c}`}><line x1={70} y1={ys[c]} x2={276} y2={outY[o]} className="cf-mix-wire" /><text x={lx} y={ly} textAnchor={straight ? 'middle' : 'start'} className="cf-param-svg">{`w${'AB'[o]}${c} = ${n(w)}`}</text></g>;
      }))}
      {x.map((value, c) => <g key={c}><circle cx={48} cy={ys[c]} r="22" className="cf-node cf-node-in" /><text x={48} y={ys[c] + 5} textAnchor="middle">{n(value)}</text><text x={48} y={ys[c] + 40} textAnchor="middle" className="cf-svg-label">channel {c}</text></g>)}
      {out.map((value, o) => <g key={o}><circle cx={298} cy={outY[o]} r="22" className="cf-node cf-node-out" /><text x={298} y={outY[o] + 5} textAnchor="middle">{n(value)}</text><text x={298} y={outY[o] + 40} textAnchor="middle" className="cf-svg-label">{'AB'[o]} · b = {n(channelMix.bias[o])}</text></g>)}
    </svg>
    <FlowControls>
      <FlowSlider name="Input channel 0" value={x[0]} onChange={set(0)} min={-4} max={4} step={1} />
      <FlowSlider name="Input channel 1" value={x[1]} onChange={set(1)} min={-4} max={4} step={1} />
    </FlowControls>
    <FlowReadout>A = 4·{sub(x[0])} − 1·{sub(x[1])} + 1 = <strong>{n(out[0])}</strong>; B = 2·{sub(x[0])} + 1·{sub(x[1])} + 0 = <strong>{n(out[1])}</strong>. Each output is a different weighted mix of the same two numbers.</FlowReadout>
  </FlowLab>;
}

/* §2 Groups restrict which channels connect --------------------------------------------- */
export function GroupsFigure() {
  const inX = [40, 110, 230, 300], outX = [20, 70, 120, 220, 270, 320];
  return <figure className="cf-figure" data-figure="convolution-groups" id="convolution-groups">
    <svg className="cf-groups" viewBox="0 0 340 170" role="img" aria-label="Groups = 2: input channels 0 and 1 connect only to output channels 0, 1 and 2; input channels 2 and 3 connect only to output channels 3, 4 and 5.">
      <rect x="4" y="8" width="160" height="150" className="cf-group-box" /><rect x="186" y="8" width="150" height="150" className="cf-group-box" />
      <text x="12" y="26" className="cf-svg-label">group 1</text><text x="194" y="26" className="cf-svg-label">group 2</text>
      {groupConnections.map(([i, o]) => <line key={`${i}-${o}`} x1={inX[i]} y1={56} x2={outX[o]} y2={122} className="cf-mix-wire" />)}
      {inX.map((x, i) => <g key={i}><circle cx={x} cy={46} r="13" className="cf-node cf-node-in" /><text x={x} y={51} textAnchor="middle">i{i}</text></g>)}
      {outX.map((x, o) => <g key={o}><circle cx={x} cy={132} r="13" className="cf-node cf-node-out" /><text x={x} y={137} textAnchor="middle">o{o}</text></g>)}
    </svg>
    <figcaption>Four input channels (cyan, top), six output channels (violet, bottom), groups = 2. Every output channel's kernel has two slices, one per input channel in its group; no line crosses between the groups.</figcaption>
  </figure>;
}

/* §3 Two windows negotiate one shared update --------------------------------------------- */
export function SharedUpdateFigure() {
  const [view, setView] = useState('forward');
  const [rate, setRate] = useState(0.1);
  const r = sharedFilterUpdate([0, 0], rate);
  const inX = [60, 210, 360], outX = [135, 285];
  // Label each wire beside it, on the side away from its neighbours: [t along the wire, side, x offset].
  const place = { "00": [0.45, "end", -7], "01": [0.3, "end", -7], "10": [0.3, "start", 8], "11": [0.45, "start", 8] };
  // Window i uses tap t on input i + t.
  const wires = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 2]];
  const backward = view === 'backward';
  return <FlowLab id="convolution-shared-update" label="Two windows negotiate one shared update">
    <svg className="cf-update" viewBox="0 0 440 240" role="img" aria-label={backward
      ? `Backward: errors ${r.errors.join(' and ')} flow back along the same wires. Weight w0 collects ${r.contributions[0][0]} and ${r.contributions[1][0]}, total ${r.gradient[0]}; weight w1 collects ${r.contributions[0][1]} and ${r.contributions[1][1]}, total ${r.gradient[1]}. Input gradients ${r.inputGradient.join(', ')}.`
      : 'Forward: inputs 1, 3, 2 and the shared weights w0 = 1, w1 = −1 give outputs −2 and 1.'}>
      {wires.map(([win, tap, inp]) => {
        const [t, anchor, dx] = place[`${win}${tap}`];
        const lx = inX[inp] + t * (outX[win] - inX[inp]) + dx, ly = 58 + t * 94 + 4;
        const label = backward ? `${n(r.errors[win])}×${n([1, 3, 2][inp])} = ${n(r.contributions[win][tap])} → w${tap === 0 ? '₀' : '₁'}` : `w${tap === 0 ? '₀' : '₁'} = ${n([1, -1][tap])}`;
        return <g key={`${win}${tap}`}>
          <line x1={inX[inp]} y1={58} x2={outX[win]} y2={152} className={backward ? 'cf-wire-back' : (tap === 0 ? 'cf-wire-w0' : 'cf-wire-w1')} />
          <text x={lx} y={ly} textAnchor={anchor} className={backward ? 'cf-grad-svg' : 'cf-param-svg'}>{label}</text>
        </g>;
      })}
      {[1, 3, 2].map((value, i) => <g key={i}><circle cx={inX[i]} cy={40} r="18" className="cf-node cf-node-in" /><text x={inX[i]} y={45} textAnchor="middle">{value}</text>
        <text x={inX[i]} y={14} textAnchor="middle" className={backward ? 'cf-grad-svg' : 'cf-svg-label'}>{backward ? `∂L/∂x${i} = ${n(r.inputGradient[i])}` : `x${i}`}</text></g>)}
      {r.output.map((value, i) => <g key={i}><circle cx={outX[i]} cy={170} r="18" className="cf-node cf-node-out" /><text x={outX[i]} y={175} textAnchor="middle">{n(value)}</text>
        <text x={outX[i]} y={210} textAnchor="middle" className={backward ? 'cf-grad-svg' : 'cf-svg-label'}>{backward ? `error y${i} − 0 = ${n(r.errors[i])}` : `y${i}, target 0`}</text></g>)}
    </svg>
    <FlowControls>
      <FlowChoice label="Show" options={[['forward', 'Forward: weights'], ['backward', 'Backward: contributions']]} value={view} onChange={setView} />
      {backward && <FlowSlider name="Step size η" value={rate} onChange={setRate} min={0} max={0.3} step={0.01} />}
    </FlowControls>
    {backward
      ? <FlowReadout>∂L/∂w₀ = {sub(r.contributions[0][0])} + {sub(r.contributions[1][0])} = <strong>{n(r.gradient[0])}</strong>; ∂L/∂w₁ = {sub(r.contributions[0][1])} + {sub(r.contributions[1][1])} = <strong>{n(r.gradient[1])}</strong>. Step: w′ = [{n(r.nextWeights[0])}, {n(r.nextWeights[1])}], new outputs [{n(r.nextOutput[0])}, {n(r.nextOutput[1])}], loss {n(r.loss)} → <strong>{n(r.nextLoss)}</strong>{rate === 0 ? ' (zero step leaves the weights unchanged).' : r.nextLoss > r.loss ? ' — this step overshoots.' : '.'}</FlowReadout>
      : <FlowReadout>Forward: outputs y = [<strong>{n(r.output[0])}</strong>, <strong>{n(r.output[1])}</strong>], each made by the same two weights; the targets are [0, 0].</FlowReadout>}
  </FlowLab>;
}

/* §4 Padding and stride in two dimensions ------------------------------------------------ */
export function PaddingStrideFigure() {
  const [padding, setPadding] = useState(1), [stride, setStride] = useState(2), [selected, setSelected] = useState([0, 0]);
  const size = 5 + 2 * padding, k = 3;
  const { count, starts } = squareWindows(5, k, padding, stride);
  const [su, sv] = [Math.min(selected[0], count - 1), Math.min(selected[1], count - 1)];
  const top = starts[su], left = starts[sv];
  const cells = Array.from({ length: size }, () => Array(size).fill(0));
  return <FlowLab id="padding-stride-2d" label="Padding adds a border; stride sets how far the window jumps">
    <div className="cf-anatomy">
      <Panel label={padding ? 'Padded input · 7×7 (dashed = padding zeros)' : 'Input · 5×5'}>
        <Cells values={cells} className="cf-small" cell={(_, r, c) => {
          const pad = r < padding || c < padding || r >= size - padding || c >= size - padding;
          const inside = r >= top && r < top + k && c >= left && c < left + k;
          const isStart = starts.includes(r) && starts.includes(c);
          return <span key={`${r}${c}`} className={`cf-cell${pad ? ' cf-pad' : ' cf-pixel'}${inside ? ' is-traced' : ''}${isStart ? ' cf-start' : ''}`}>{pad ? '0' : ''}</span>;
        }} />
        <p className="cf-small-note">Corner triangle: a window's top-left start.</p>
      </Panel>
      <span className="cf-op cf-op-arrow" data-down="↓" aria-hidden="true">→</span>
      <Panel label={`Output · ${count}×${count}`}>
        <Cells values={Array.from({ length: count }, () => Array(count).fill(0))} className="cf-computed" cell={(_, r, c) => <button type="button" key={`${r}${c}`} className={`cf-cell${r === su && c === sv ? ' is-traced' : ''}`} aria-pressed={r === su && c === sv} aria-label={`Output row ${r}, column ${c}: trace its window`} onClick={() => setSelected([r, c])}>{r},{c}</button>} />
      </Panel>
    </div>
    <FlowControls>
      <FlowChoice label="Padding" options={[[0, '0'], [1, '1']]} value={padding} onChange={setPadding} />
      <FlowChoice label="Stride" options={[[1, '1'], [2, '2']]} value={stride} onChange={setStride} />
    </FlowControls>
    <FlowReadout>Output size = ⌊(5 + 2·{padding} − 3) / {stride}⌋ + 1 = <strong>{count}</strong> in each direction. Traced output ({su}, {sv}) starts at padded row {top}, column {left}.</FlowReadout>
  </FlowLab>;
}

/* §5 Pooling windows ------------------------------------------------------------------- */
const windowLetter = ['A', 'B', 'C', 'D'];
export function PoolingWindowsFigure() {
  const pooled = pool2x2(poolingMap);
  const windowOf = (r, c) => Math.floor(r / 2) * 2 + Math.floor(c / 2);
  const winner = (r, c) => pooled.flat().some(p => p.winner[0] === r && p.winner[1] === c);
  return <figure className="cf-figure" data-figure="pooling-windows" id="pooling-windows">
    <div className="cf-anatomy">
      <Panel label="Feature map · 4×4 · one channel">
        <Cells values={poolingMap} className="cf-computed" cell={(value, r, c) => <span key={`${r}${c}`} className={`cf-cell cf-win-${(Math.floor(r / 2) + Math.floor(c / 2)) % 2 ? 'b' : 'a'}${winner(r, c) ? ' cf-max' : ''}`}>{value}<small>{windowLetter[windowOf(r, c)]}{winner(r, c) ? ' · max' : ''}</small></span>} />
      </Panel>
      <span className="cf-op cf-op-arrow" data-down="↓" aria-hidden="true">→</span>
      <div className="cf-stack">
        <Panel label="Max pool · 2×2"><Cells values={pooled.map(row => row.map(p => p.max))} className="cf-computed" cell={(value, r, c) => <span key={`${r}${c}`} className="cf-cell">{value}<small>{windowLetter[r * 2 + c]}</small></span>} /></Panel>
        <Panel label="Average pool · 2×2"><Cells values={pooled.map(row => row.map(p => p.mean))} className="cf-computed" cell={(value, r, c) => <span key={`${r}${c}`} className="cf-cell">{n(value)}<small>{windowLetter[r * 2 + c]}</small></span>} /></Panel>
      </div>
    </div>
  </figure>;
}

/* §6 Receptive field growth across two layers -------------------------------------------- */
export function ReceptiveGrowthFigure() {
  const [[u, v], setCell] = useState([1, 1]);
  const [[p, q], setMiddle] = useState([2, 2]);
  const grid = size => Array.from({ length: size }, () => Array(size).fill(0));
  const inRange = (r, c, size) => r >= u && r < u + size && c >= v && c < v + size;
  const inPatch = (r, c) => r >= p && r < p + 3 && c >= q && c < q + 3;
  return <FlowLab id="receptive-growth" label="Stacking two 3×3 convolutions widens what one number can see">
    <div className="cf-anatomy cf-receptive">
      <Panel label="Input · 7×7"><Cells values={grid(7)} className="cf-small" cell={(_, r, c) => <span key={`${r}${c}`} className={`cf-cell${inRange(r, c, 5) ? ' cf-rf-input' : ''}${inPatch(r, c) ? ' is-traced' : ''}`} />} /><p className="cf-small-note">Cyan: the 5×5 region the traced layer-2 value can see.</p></Panel>
      <span className="cf-op cf-op-arrow" data-down="↓" aria-hidden="true">→</span>
      <Panel label="Layer 1 · 5×5"><Cells values={grid(5)} className="cf-small" cell={(_, r, c) => <button type="button" key={`${r}${c}`} className={`cf-cell${inRange(r, c, 3) ? ' cf-rf-layer' : ''}${r === p && c === q ? ' is-traced' : ''}`} aria-pressed={r === p && c === q} aria-label={`Layer 1 row ${r}, column ${c}: outline its own input patch`} onClick={() => setMiddle([r, c])} />} /><p className="cf-small-note">Violet: the 3×3 block layer 2 reads.</p></Panel>
      <span className="cf-op cf-op-arrow" data-down="↓" aria-hidden="true">→</span>
      <Panel label="Layer 2 · 3×3"><Cells values={grid(3)} className="cf-computed" cell={(_, r, c) => <button type="button" key={`${r}${c}`} className={`cf-cell${r === u && c === v ? ' is-traced' : ''}`} aria-pressed={r === u && c === v} aria-label={`Layer 2 row ${r}, column ${c}`} onClick={() => { setCell([r, c]); setMiddle([r + 1, c + 1]); }}>{r},{c}</button>} /></Panel>
    </div>
    <FlowReadout>Traced layer-2 value ({u}, {v}) reads layer-1 rows {u}–{u + 2}, columns {v}–{v + 2}, which together read input rows {u}–{u + 4}, columns {v}–{v + 4}: a 5×5 receptive field. The white outline shows layer-1 value ({p}, {q})'s own 3×3 patch; select another layer-1 cell to move it.</FlowReadout>
  </FlowLab>;
}

/* §7 The complete small CNN as tensor shapes ----------------------------------------------- */
export function CnnPipelineFigure() {
  return <figure className="cf-figure" data-figure="cnn-pipeline" id="cnn-pipeline">
    <ol className="cf-pipeline">
      {cnnStages.map((stage, i) => {
        const [c, h] = stage.shape;
        const spatial = stage.shape.length === 3;
        const visible = spatial ? Math.min(c, 4) : 0;
        return <li key={i} className="cf-stage">
          {i > 0 && <div className="cf-arrow"><span className="cf-arrow-glyph" data-down="↓" aria-hidden="true">→</span><span className="cf-arrow-op">{stage.label}</span><span className="cf-param-text">{stage.parameters}</span><code>{stage.code}</code></div>}
          <div className={`cf-tensor${i === 0 ? ' is-input' : ''}`}>
            {spatial ? <div className="cf-slabs" style={{ '--side': `${h * 7 + 10}px`, '--count': visible }} aria-hidden="true">{Array.from({ length: visible }, (_, j) => <i key={j} style={{ '--j': j }} />)}</div>
              : <div className="cf-vector" style={{ '--len': Math.min(stage.shape[0], 16) }} aria-hidden="true">{Array.from({ length: Math.min(stage.shape[0], 16) }, (_, j) => <i key={j} />)}</div>}
            <strong>{spatial ? `${c} × ${h} × ${stage.shape[2]}` : `${stage.shape[0]} values`}</strong>
            <span>{i === 0 ? 'one grayscale digit' : spatial && c > 4 ? `${c} channels (4 drawn)` : i === cnnStages.length - 1 ? 'one logit per digit class' : !spatial ? `${Math.min(stage.shape[0], 16)} of ${stage.shape[0]} drawn` : ''}</span>
          </div>
        </li>;
      })}
    </ol>
    <figcaption>Squares are channels (side grows with H × W); a stack is several channels, labelled C × H × W for one image. Each arrow is an operation with its learned parameters (amber) and its program line. Learned values: 80 + 1,168 + 650 = 1,898.</figcaption>
  </figure>;
}
