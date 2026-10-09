import { useId } from 'react';
import { BackpropFigure } from './BackpropShared.jsx';
import './backprop-computation-diagrams.css';

const perceptronsAnatomy = '/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#neuron-anatomy';

// Backward sensitivities for x = 2, w = 3, b = −1, y = 1 (checked by scripts/verify-backprop-foundations.mjs).
const back = { seed: 1, a: 4, z: 4, wx: 4, b: 4, w: 8, x: 12 };

// One value node: a circle holding the value, its name above, and (backward view) its
// loss sensitivity above the name. role: supplied | parameter | computed.
function ValueNode({ cx, cy, name, value, role, sensitivity, nameBelow = false }) {
  return <g className={`bpc-node bpc-${role}`}>
    {sensitivity !== undefined && <text className="bpc-sens" x={cx} y={cy - 64}>{sensitivity}</text>}
    <text className="bpc-name" x={cx} y={nameBelow ? cy + 50 : cy - 40}>{name}</text>
    <circle cx={cx} cy={cy} r="28" />
    <text className="bpc-value-text" x={cx} y={cy + 7}>{value}</text>
  </g>;
}

// One operation node: a white-outlined rounded rectangle naming the operation.
function OperationNode({ x, y, width, height, lines, label }) {
  const cx = x + width / 2;
  return <g className="bpc-operation">
    <rect x={x} y={y} width={width} height={height} rx="12" />
    {lines.length === 1
      ? <text className="bpc-symbol" x={cx} y={y + height / 2 + 9}>{lines[0]}</text>
      : lines.map((line, i) => <text key={line} x={cx} y={y + 22 + i * 21}>{line}</text>)}
    {label && <text className="bpc-operation-name" x={x + width + 10} y={y + height / 2 + 6}>{label}</text>}
  </g>;
}

// The one-neuron circuit from §1, read top to bottom. mode "forward" shows values only;
// mode "backward" keeps them and adds each value's loss sensitivity, carried in reverse
// (orange dashed arrows) along the same wires.
export function NeuronComputationDiagram({ mode = 'forward' }) {
  const backward = mode === 'backward';
  const uid = `backprop-computation-${useId().replace(/:/g, '')}`;
  const description = backward
    ? 'The same circuit with backward sensitivities. Forward values as before: x 2, w 3, wx 6, b minus 1, z 5, a 5, loss 8. Backward along the same wires: seed 1 at the loss, 4 at a, 4 at z, 4 at wx and at b, 8 at w and 12 at x.'
    : 'Input x equals 2 and weight w equals 3 enter a multiply operation, giving wx equals 6. An add-bias operation adds bias b equals minus 1, giving score z equals 5. ReLU gives activation a equals 5. Below the end of the neuron, the loss operation compares a with the target y equals 1 and gives loss L equals 8.';
  return <BackpropFigure id={backward ? 'neuron-computation-backward' : 'neuron-computation'}
    title={backward ? 'One neuron and its loss, with backward sensitivities' : 'One neuron followed by its loss'}>
    <svg className={`backprop-svg bpc-diagram ${backward ? 'is-backward' : ''}`} viewBox={backward ? '0 -8 360 708' : '0 18 360 650'} role="img" aria-labelledby={`${uid}-title ${uid}-description`}>
      <title id={`${uid}-title`}>{backward ? 'Neuron circuit, backward' : 'Neuron circuit, forward'}</title>
      <desc id={`${uid}-description`}>{description}</desc>
      <defs>
        <marker id={`${uid}-f`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path className="bpc-forward-head" d="M0 0 10 5 0 10z" /></marker>
        <marker id={`${uid}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path className="bpc-back-head" d="M0 0 10 5 0 10z" /></marker>
      </defs>
      <g className="bpc-wire" markerEnd={`url(#${uid}-f)`}>
        <path d="M102 99 L163 136" /><path d="M258 99 L197 136" />
        <path d="M180 180 L180 264" /><path d="M86 288 L148 288" />
        <path d="M180 310 L180 378" /><path d="M180 432 L180 514" />
        <path d="M84 542 L118 542" /><path d="M180 568 L180 602" />
      </g>
      {backward && <g className="bpc-reverse" markerEnd={`url(#${uid}-b)`}>
        <path d="M168 604 L168 572" /><path d="M168 514 L168 436" /><path d="M168 378 L168 314" />
        <path d="M168 264 L168 184" /><path d="M148 300 L88 300" />
        <path d="M156 146 L94 108" /><path d="M204 146 L266 108" />
      </g>}
      <ValueNode cx={80} cy={82} name="input x" value="2" role="supplied" sensitivity={backward ? `∂L/∂x = ${back.x}` : undefined} />
      <ValueNode cx={280} cy={82} name="weight w" value="3" role="parameter" sensitivity={backward ? `∂L/∂w = ${back.w}` : undefined} />
      <OperationNode x={150} y={136} width={60} height={44} lines={['×']} label="multiply" />
      <text className="bpc-readout" x="192" y="218">wx = 6</text>
      {backward && <text className="bpc-sens-readout" x="192" y="242">∂L/∂(wx) = {back.wx}</text>}
      <ValueNode cx={58} cy={288} name="bias b" value="−1" role="parameter" sensitivity={backward ? `∂L/∂b = ${back.b}` : undefined} />
      <OperationNode x={150} y={266} width={60} height={44} lines={['+']} label="add bias" />
      <text className="bpc-readout" x="192" y="338">z = 5</text>
      {backward && <text className="bpc-sens-readout" x="192" y="362">∂L/∂z = {back.z}</text>}
      <OperationNode x={115} y={378} width={130} height={54} lines={['ReLU', 'max(0, z)']} />
      <text className="bpc-readout" x="192" y="460">a = 5</text>
      {backward && <text className="bpc-sens-readout" x="192" y="484">∂L/∂a = a − y = {back.a}</text>}
      <path className="bpc-boundary" d="M8 496 H352" /><text className="bpc-boundary-label" x="352" y="512">neuron ends</text>
      <ValueNode cx={56} cy={542} name="target y" value="1" role="supplied" nameBelow />
      <OperationNode x={118} y={514} width={124} height={54} lines={['loss', '½(a − y)²']} />
      <ValueNode cx={180} cy={630} name="" value="8" role="computed" />
      <text className="bpc-operation-name" x="216" y="636">loss L</text>
      {backward && <text className="bpc-sens-readout bpc-seed" x="180" y="690">seed ∂L/∂L = {back.seed}</text>}
    </svg>
    <p className="bpc-reading-key">{backward
      ? <><span className="bpc-key-sens">Orange</span> numbers are sensitivities of the loss, written ∂L/∂(value): how much L moves per unit change of that value. Each travels up a dashed orange arrow, against the grey forward arrow beside it. The <span className="bpc-key-value">cyan</span>, <span className="bpc-key-param">amber</span> and <span className="bpc-key-computed">violet</span> forward values stay where they were.</>
      : <>Circles are values; rounded rectangles are operations. <span className="bpc-key-value">Cyan</span> values are supplied (the input and the target), <span className="bpc-key-param">amber</span> values are parameters that training can change, and <span className="bpc-key-computed">violet</span> values are computed from them. This is the <a href={perceptronsAnatomy}>Perceptrons neuron</a> with one input, drawn top to bottom so that each operation gets its own row.</>}</p>
  </BackpropFigure>;
}

// The multiplication inside the neuron, alone: forward it combined x and w; backward it
// sends each input the incoming sensitivity times the other input.
export function MultiplyPullbackDiagram() {
  const uid = `backprop-pullback-${useId().replace(/:/g, '')}`;
  return <BackpropFigure id="multiply-pullback" title="Multiplication's local backward rule">
    <svg className="backprop-svg bpc-diagram bpc-pullback" viewBox="0 -8 360 320" role="img" aria-labelledby={`${uid}-title ${uid}-description`}>
      <title id={`${uid}-title`}>Multiplication's local backward rule</title>
      <desc id={`${uid}-description`}>Forward, x equals 2 on the left and w equals 3 on the right enter multiplication, producing 6. Backward, the incoming sensitivity 4 arrives from below. It is multiplied by w equals 3 to give 12 for x, and by x equals 2 to give 8 for w.</desc>
      <defs><marker id={uid} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path className="bpc-back-head" d="M0 0 10 5 0 10z" /></marker></defs>
      <g className="bpc-reverse" markerEnd={`url(#${uid})`}><path d="M180 262 L180 186" /><path d="M156 146 L100 108" /><path d="M204 146 L260 108" /></g>
      <ValueNode cx={80} cy={82} name="input x" value="2" role="supplied" sensitivity="∂L/∂x = 12" />
      <ValueNode cx={280} cy={82} name="weight w" value="3" role="parameter" sensitivity="∂L/∂w = 8" />
      <OperationNode x={150} y={136} width={60} height={44} lines={['×']} />
      <text className="bpc-contribution" x="12" y="150">4 × w</text><text className="bpc-contribution" x="12" y="174">= 4 × 3</text>
      <text className="bpc-contribution" x="266" y="150">4 × x</text><text className="bpc-contribution" x="266" y="174">= 4 × 2</text>
      <text className="bpc-readout" x="192" y="222">wx = 6</text>
      <text className="bpc-incoming" x="180" y="286">incoming sensitivity 4</text>
      <text className="bpc-incoming" x="180" y="308">from loss → ReLU → addition</text>
    </svg>
    <figcaption>The multiplication remembers x = 2 and w = 3 from the forward pass, with x on the left and w on the right as in the neuron circuit. It receives sensitivity 4 from the loss, passed back through ReLU (slope 1) and the bias addition (which passes it unchanged). Reverse arrows carry sensitivities, not the original forward values; they do not undo the multiplication.</figcaption>
  </BackpropFigure>;
}

// Local backward rules for the other operations the lesson uses, each with one traced
// number. tanh(0.5) and the fan-out totals are checked by the verifier.
const tanhHalf = Math.tanh(0.5);
const tanhSlope = 1 - tanhHalf * tanhHalf;
const f4 = value => value.toFixed(4).replace('-', '−');

export function LocalRuleStrip() {
  const rules = [
    { name: 'Addition', form: 'z = wx + b', rows: [['incoming', 'g = 4'], ['to wx', 'g = 4'], ['to b', 'g = 4']], note: 'Passes g unchanged to every input. Saves nothing from forward.' },
    { name: 'ReLU', form: 'a = max(0, z)', rows: [['z = 5 (on)', '4 × 1 = 4'], ['z = −0.5 (off)', '4 × 0 = 0']], note: 'Multiplies g by the slope, 1 or 0. Saves the on/off mask; §3’s unit 2 is the off case.' },
    { name: 'tanh', form: 'a = tanh(z)', rows: [['z = 0.5', `tanh = ${f4(tanhHalf)}`], ['slope', `1 − tanh² = ${f4(tanhSlope)}`], ['to z', `4 × ${f4(tanhSlope)} = ${f4(4 * tanhSlope)}`]], note: 'Multiplies g by a slope that is at most 1 (exactly 1 at z = 0) and never 0, so it can shrink the signal but never blocks it.' },
    { name: 'Fan-out', form: 'L = u + 2u', rows: [['from route 1', '1'], ['from route 2', '2'], ['total at u', '1 + 2 = 3']], note: 'A value used by several operations adds every contribution it receives before passing anything further back.' },
  ];
  return <BackpropFigure id="local-rules" title="The other local backward rules, each with one number">
    <div className="bpc-rules" role="list">
      {rules.map(rule => <div className="bpc-rule" role="listitem" key={rule.name}>
        <p className="bpc-rule-name"><strong>{rule.name}</strong> <code>{rule.form}</code></p>
        <dl>{rule.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="bpc-key-sens">{value}</dd></div>)}</dl>
        <p className="bpc-rule-note">{rule.note}</p>
      </div>)}
    </div>
  </BackpropFigure>;
}
