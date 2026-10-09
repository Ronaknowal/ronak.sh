import { useId, useState } from 'react';
import { neuronAnatomy, xorWiring } from '../../data/neuron-structure.js';
import { Choice, fmt, NumberControl, PerceptronTable } from './PerceptronShared.jsx';
import './neuron-structure.css';

// Diagram node and equation line use the same precision so the two readings agree.
const shown = value => fmt(value, 4);
const term = value => (value < 0 ? `(${fmt(value)})` : fmt(value));

function Arrow({ start, end, marker, label, labelAt, anchor = 'middle', computed = false }) {
  return <g>
    <path className="neuron-wire" d={`M ${start.join(' ')} L ${end.join(' ')}`} markerEnd={`url(#${marker})`} />
    {label && <text className={`neuron-edge-label${computed ? ' is-computed' : ''}`} x={labelAt[0]} y={labelAt[1]} textAnchor={anchor}>{label}</text>}
  </g>;
}

// Circles are values: cyan supplied inputs, violet computed values.
function ValueNode({ x, y, label, value, kind = 'input', radius = 31 }) {
  return <g className={`neuron-node neuron-node--${kind}`}>
    <circle cx={x} cy={y} r={radius} />
    <text x={x} y={y - 5} textAnchor="middle">{label}</text>
    <text className="neuron-value" x={x} y={y + 16} textAnchor="middle">{value}</text>
  </g>;
}

// Rounded rectangles are operations, drawn with a neutral white outline.
function OperationNode({ x, y, width, label, detail }) {
  return <g className="neuron-node neuron-node--operation">
    <rect x={x - width / 2} y={y - 30} width={width} height="60" rx="12" />
    <text x={x} y={y - 6} textAnchor="middle">{label}</text>
    <text className="neuron-detail" x={x} y={y + 16} textAnchor="middle">{detail}</text>
  </g>;
}

function Circuit({ compact, type, title, children }) {
  const id = useId();
  const marker = `${id}-arrow`;
  const viewBox = type === 'single'
    ? (compact ? '0 0 300 540' : '0 0 760 250')
    : (compact ? '0 0 360 560' : '0 0 680 330');
  return <svg className={`neuron-circuit ${compact ? 'neuron-circuit--compact' : 'neuron-circuit--wide'}`} viewBox={viewBox} role="img" aria-labelledby={`${id}-title`}>
    <title id={`${id}-title`}>{title}</title>
    <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#b9b5af" /></marker></defs>
    {children(marker)}
  </svg>;
}

function AnatomyCircuit({ compact, input, bias, result }) {
  const title = `One neuron. Inputs x₁ = 2 and x₂ = ${fmt(input)} arrive on connections with weights 1.5 and −2. The sum operation adds the two products and the bias ${fmt(bias)}, giving z = ${fmt(result.score)}. The step activation outputs a = ${shown(result.output)}.`;
  return <Circuit compact={compact} type="single" title={title}>{marker => compact ? <>
    <rect className="neuron-boundary" x="28" y="168" width="244" height="262" rx="12" />
    <text className="neuron-caption" x="40" y="420" textAnchor="start">one neuron</text>
    <Arrow start={[70, 87]} end={[128, 220]} marker={marker} label="w₁ = 1.5" labelAt={[88, 150]} anchor="end" />
    <Arrow start={[230, 87]} end={[172, 220]} marker={marker} label="w₂ = −2" labelAt={[212, 150]} anchor="start" />
    <Arrow start={[150, 280]} end={[150, 318]} marker={marker} label={`z = ${fmt(result.score)}`} labelAt={[160, 304]} anchor="start" computed />
    <Arrow start={[150, 378]} end={[150, 452]} marker={marker} />
    <ValueNode x={70} y={56} label="x₁" value="2" />
    <ValueNode x={230} y={56} label="x₂" value={fmt(input)} />
    <OperationNode x={150} y={250} width={150} label="Σ + b" detail={`add, bias ${fmt(bias)}`} />
    <OperationNode x={150} y={348} width={170} label="step φ" detail="1 if z > 0, else 0" />
    <ValueNode x={150} y={486} label="a" value={shown(result.output)} kind="computed" />
    <text className="neuron-caption" x="150" y="16" textAnchor="middle">inputs (supplied)</text>
    <text className="neuron-caption" x="196" y="514" textAnchor="start">output</text>
  </> : <>
    <rect className="neuron-boundary" x="240" y="22" width="352" height="206" rx="12" />
    <text className="neuron-caption" x="416" y="46" textAnchor="middle">one neuron: sum, then activation</text>
    <Arrow start={[103, 74]} end={[280, 118]} marker={marker} label="w₁ = 1.5" labelAt={[186, 78]} />
    <Arrow start={[103, 186]} end={[280, 142]} marker={marker} label="w₂ = −2" labelAt={[186, 196]} />
    <Arrow start={[360, 130]} end={[436, 130]} marker={marker} label={`z = ${fmt(result.score)}`} labelAt={[398, 116]} computed />
    <Arrow start={[566, 130]} end={[652, 130]} marker={marker} />
    <ValueNode x={72} y={74} label="x₁" value="2" />
    <ValueNode x={72} y={186} label="x₂" value={fmt(input)} />
    <OperationNode x={320} y={130} width={80} label="Σ + b" detail={`b = ${fmt(bias)}`} />
    <OperationNode x={501} y={130} width={130} label="step φ" detail="1 if z > 0" />
    <ValueNode x={690} y={130} label="a" value={shown(result.output)} kind="computed" />
    <text className="neuron-caption" x="72" y="22" textAnchor="middle">inputs (supplied)</text>
    <text className="neuron-caption" x="690" y="80" textAnchor="middle">output</text>
  </>}</Circuit>;
}

// §1: the anatomy of one neuron, using the step activation the template already used.
export function NeuronAnatomyFigure() {
  const [input, setInput] = useState(-1);
  const [bias, setBias] = useState(-1);
  const result = neuronAnatomy(input, bias, 'step');
  return <figure id="neuron-anatomy" className="neuron-structure" data-figure="neuron-anatomy">
    <div className="neuron-drawing">
      {[false, true].map(compact => <AnatomyCircuit key={String(compact)} compact={compact} input={input} bias={bias} result={result} />)}
    </div>
    <p className="flow-readout neuron-equation"><span className="neuron-input-label">inputs (2, {fmt(input)})</span> → <span className="neuron-weight-label">products 1.5 × 2 = {fmt(result.contributions[0])} and −2 × {term(input)} = {fmt(result.contributions[1])}</span> → <span>sum with bias: z = {fmt(result.contributions[0])} + {term(result.contributions[1])} + {term(bias)} = <strong>{fmt(result.score)}</strong></span> → <span className="neuron-activation-label">step(z) = <strong>{shown(result.output)}</strong></span></p>
    <div className="flow-controls">
      <NumberControl name="Input x₂" min={-3} max={3} step={.25} value={input} onChange={setInput} />
      <NumberControl name="Bias b" min={-6} max={4} step={.25} value={bias} onChange={setBias} />
    </div>
  </figure>;
}

const lossLesson = '/learn/path/full-curriculum/loss-functions-ce-mse-focal-contrastive-triplet?module=deep-learning-fundamentals#from-a-prediction-to-an-update';
const backpropLesson = '/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals';

// §5: one training step of the digit network, as a structure (no numbers traced here).
export function TrainingLoopStructure() {
  const stages = [
    ['is-data', 'supplied', 'Training images X', <>280 rows × 64 pixel values, scaled to 0–1. Training never changes them.</>],
    ['is-computed', 'computed', 'Hidden layer', <>32 neurons like the one in §1, each reading all 64 pixels: <code>X W₁ᵀ + b₁</code>, then the activation. Result: 280 × 32.</>],
    ['is-computed', 'computed', 'Output logits', <>10 neurons with no activation, one score per digit: <code>H W₂ᵀ + b₂</code>. Result: 280 × 10.</>],
    ['is-computed', 'computed', 'Softmax shares', <>§4's softmax turns each image's 10 logits into shares that sum to 1.</>],
    ['is-computed', 'computed', 'Loss', <>For each image, −log of the share given to its true digit, averaged over the 280 images: one number.</>],
    ['is-gradient', 'computed backward', 'Gradients', <>One number per weight and bias: how the loss moves when that parameter is nudged. <a href={backpropLesson}>Backpropagation</a> computes these.</>],
    ['is-update', 'writes parameters', 'Update', <>Adam changes W₁, b₁, W₂ and b₂ a little in the direction that lowers the loss. The next step first clears these gradients.</>],
  ];
  return <figure className="neuron-structure" id="neuron-training-loop" data-figure="neuron-training-loop">
    <div className="neuron-loop-frame">
      <div className="neuron-loop-params" aria-label="Learned parameters"><strong>Learned parameters</strong><span>W₁ (32 × 64), b₁ (32), W₂ (10 × 32), b₂ (10)</span><span className="neuron-loop-tag">read by steps 2–3 · written by step 7</span></div>
      <ol className="neuron-loop">{stages.map(([kind, tag, name, text], i) => <li key={name} className={kind}><strong>{i + 1}. {name} <small>({tag})</small></strong><span>{text}</span>{i === 1 || i === 2 ? <em className="neuron-loop-read">reads the parameters</em> : null}{i === 6 ? <em className="neuron-loop-write">writes new values into the parameters ↑</em> : null}</li>)}</ol>
      <div className="neuron-loop-rail" aria-hidden="true"><span>↑ update returns to the parameters</span></div>
    </div>
    <figcaption>One training step, read downward; the update feeds new parameter values back to the top. This program repeats the step 200 times, each time on all 280 images (full-batch), with Adam at learning rate 0.01. The <a href={lossLesson}>Loss Functions lesson</a> draws this loop with numbers for one prediction, and Backpropagation traces step 6.</figcaption>
  </figure>;
}

function NetworkCircuit({ compact, x1, x2, nonlinear, result }) {
  const h = result.hidden;
  const activationName = nonlinear ? 'ReLU' : 'identity';
  const title = `Inputs ${fmt(x1)} and ${fmt(x2)}. Each input connection has weight 1. Hidden neurons use ${activationName}, biases 0 and −1, outputs ${fmt(h[0])} and ${fmt(h[1])}. The output neuron has no activation, weights 1 and −2 and bias 0, giving ${fmt(result.output)}.`;
  const inputs = compact ? [[70, 70], [290, 70]] : [[60, 100], [60, 256]];
  const hidden = compact ? [[70, 270], [290, 270]] : [[312, 100], [312, 256]];
  const output = compact ? [180, 470] : [600, 178];
  // Every wire gets its own weight label near its arrowhead, placed clear of the crossing.
  const inEdge = (source, target, i, j) => {
    const straight = i === j;
    if (compact) return [[source[0], source[1] + 31], [target[0] + (straight ? 0 : i < j ? -24 : 24), target[1] - (straight ? 34 : 25)]];
    return [[source[0] + 31, source[1]], [target[0] - (straight ? 34 : 29), target[1] + (straight ? 0 : i < j ? -17 : 17)]];
  };
  const inLabel = (i, j) => compact
    ? [[38, 178], [234, 196], [126, 196], [322, 178]][i * 2 + j]
    : [[230, 90], [234, 216], [234, 142], [230, 276]][i * 2 + j];
  const outEdge = i => compact
    ? [[hidden[i][0] + (i ? -12 : 12), hidden[i][1] + 32], [output[0] + (i ? 16 : -16), output[1] - 30]]
    : [[hidden[i][0] + 34, hidden[i][1]], [output[0] - 34, output[1] + (i ? 10 : -10)]];
  const outLabel = i => compact ? [i ? 266 : 94, 382] : [454, i ? 252 : 102];
  return <Circuit compact={compact} type="network" title={title}>{marker => <>
    {inputs.flatMap((source, i) => hidden.map((target, j) => {
      const [start, end] = inEdge(source, target, i, j);
      return <Arrow key={`${i}-${j}`} start={start} end={end} marker={marker} label="w = 1" labelAt={inLabel(i, j)} />;
    }))}
    {hidden.map((_, i) => {
      const [start, end] = outEdge(i);
      return <Arrow key={i} start={start} end={end} marker={marker} label={i ? 'w = −2' : 'w = 1'} labelAt={outLabel(i)} />;
    })}
    {inputs.map(([x, y], i) => <ValueNode key={i} x={x} y={y} label={i ? 'x₂' : 'x₁'} value={fmt(i ? x2 : x1)} />)}
    {hidden.map(([x, y], i) => <g key={i}>
      <ValueNode x={x} y={y} label={i ? 'h₂' : 'h₁'} value={fmt(h[i])} kind="computed" radius={34} />
      {compact ? <>
        <text className="neuron-activation-text" x={i ? x - 42 : x + 42} y={y - 4} textAnchor={i ? 'end' : 'start'}>{activationName}</text>
        <text className="neuron-bias" x={i ? x - 42 : x + 42} y={y + 17} textAnchor={i ? 'end' : 'start'}>b = {i ? '−1' : '0'}</text>
      </> : <>
        <text className="neuron-activation-text" x={x} y={y - 45} textAnchor="middle">{activationName}</text>
        <text className="neuron-bias" x={x} y={y + 55} textAnchor="middle">b = {i ? '−1' : '0'}</text>
      </>}
    </g>)}
    <ValueNode x={output[0]} y={output[1]} label="q" value={fmt(result.output)} kind="computed" radius={34} />
    {compact ? <>
      <text className="neuron-caption" x="180" y="22" textAnchor="middle">inputs (supplied)</text>
      <text className="neuron-caption" x="180" y="340" textAnchor="middle">hidden layer</text>
      <text className="neuron-caption" x="180" y="528" textAnchor="middle">output neuron: no activation</text>
      <text className="neuron-bias" x="180" y="550" textAnchor="middle">b = 0</text>
    </> : <>
      <text className="neuron-caption" x="60" y="34" textAnchor="middle">inputs (supplied)</text>
      <text className="neuron-caption" x="312" y="26" textAnchor="middle">hidden layer</text>
      <text className="neuron-caption" x="600" y="80" textAnchor="middle">output neuron</text>
      <text className="neuron-caption" x="600" y="102" textAnchor="middle">no activation</text>
      <text className="neuron-bias" x="600" y="233" textAnchor="middle">b = 0</text>
    </>}
  </>}</Circuit>;
}

const cornerOptions = [['00', '(0, 0)'], ['01', '(0, 1)'], ['10', '(1, 0)'], ['11', '(1, 1)']];

// §3: two hidden neurons and one output neuron, with every weight and bias drawn.
export function XorNetworkLab() {
  const [corner, setCorner] = useState('11');
  const [nonlinear, setNonlinear] = useState(true);
  const x1 = Number(corner[0]), x2 = Number(corner[1]);
  const result = xorWiring(x1, x2, nonlinear);
  const name = nonlinear ? 'ReLU' : 'identity';
  return <figure className="neuron-structure" id="neuron-network-wiring" data-figure="neuron-network-wiring">
    <div className="neuron-drawing">{[false, true].map(compact => <NetworkCircuit key={String(compact)} compact={compact} x1={x1} x2={x2} nonlinear={nonlinear} result={result} />)}</div>
    <div className="flow-readout neuron-forward-trace">
      <p>h₁: z₁ = {fmt(x1)} + {fmt(x2)} + 0 = {fmt(result.scores[0])}; {name} gives <strong>h₁ = {fmt(result.hidden[0])}</strong>.</p>
      <p>h₂: z₂ = {fmt(x1)} + {fmt(x2)} − 1 = {fmt(result.scores[1])}; {name} gives <strong>h₂ = {fmt(result.hidden[1])}</strong>.</p>
      <p>q = 1 × {fmt(result.hidden[0])} − 2 × {term(result.hidden[1])} + 0 = <strong>{fmt(result.output)}</strong>; XOR's target here is {Number(x1 !== x2)}.</p>
    </div>
    <div className="flow-controls">
      <Choice label="Input corner" options={cornerOptions} value={corner} onChange={setCorner} />
      <Choice label="Hidden activation" options={[[true, 'ReLU'], [false, 'identity (none)']]} value={nonlinear} onChange={setNonlinear} />
    </div>
    <PerceptronTable caption={`All four corners with the same weights and biases, hidden activation ${name}`} headers={['Inputs', 'XOR target', `q with ${name}`]} rows={cornerOptions.map(([key, label]) => [label, Number(key[0] !== key[1]), xorWiring(+key[0], +key[1], nonlinear).output])} />
  </figure>;
}
