import { useState } from 'react';
import { engineOrder, engineTrace, unitTwoOffThreshold, nudgeChain, tinyDefaults, tinyNetwork, tinyParameters } from '../../data/backprop-beginner-models.js';
import { BackpropFigure, BackpropSteps } from './BackpropShared.jsx';
import { FlowChoice, FlowControls, FlowLab, FlowReadout, FlowSlider } from './LessonFlow.jsx';
import './backprop-beginner.css';

const d = (value, places = 4) => {
  if (value === 0 || Object.is(value, -0)) return '0';
  const rounded = Number(value.toFixed(places));
  const short = Number(value.toFixed(2)) === rounded;
  const text = short ? String(rounded) : value.toFixed(places);
  return text.replace('-', '−');
};

const t = value => Number(value.toFixed(4)).toString();

// §1: nudge w by 0.01 and follow the change stage by stage. Each stage is a value
// (amber parameter, violet computed); between stages, the orange local rate.
export function NudgeChainFigure() {
  const model = nudgeChain(0.01);
  const stages = [
    { role: 'param', name: 'w', before: 3, after: 3.01 },
    { role: 'computed', name: 'z = wx + b', before: model.before.z, after: model.after.z },
    { role: 'computed', name: 'a = ReLU(z)', before: model.before.a, after: model.after.a },
    { role: 'computed', name: 'L = ½(a − 1)²', before: model.before.loss, after: model.after.loss },
  ];
  const rates = [
    ['Δz / Δw', model.rates.zPerW, 'the input x = 2 multiplies w'],
    ['Δa / Δz', model.rates.aPerZ, 'ReLU passes a positive score through'],
    ['ΔL / Δa', model.rates.lossPerA, 'about the current error a − y = 4'],
  ];
  return <BackpropFigure id="nudge-chain" title="Nudge w by 0.01 and follow the change through each stage">
    <ol className="bpb-chain">{stages.flatMap((stage, index) => [
      <li key={stage.name} className={`bpb-stage bpb-${stage.role}`}>
        <span className="bpb-stage-name">{stage.name}</span>
        <span className="bpb-stage-values">{t(stage.before)} → {t(stage.after)}</span>
        <span className="bpb-stage-change">change {index === 0 ? '+0.01' : `+${t(stage.after - stage.before)}`}</span>
      </li>,
      index < rates.length && <li key={`rate-${index}`} className="bpb-rate" aria-label={`local rate ${rates[index][0]} = ${d(rates[index][1], 2)}`}>
        <span aria-hidden="true">↓</span> {rates[index][0]} = <b>{d(rates[index][1], 2)}</b> <small>({rates[index][2]})</small>
      </li>,
    ])}</ol>
    <figcaption>Exact arithmetic for x = 2, w = 3, b = −1, target 1. Multiply the three orange rates: 2 × 1 × 4.01 = <b className="bpb-sens-text">8.02</b>, the measured change of L per unit change of w. With a smaller nudge the last rate approaches 4 and the product approaches <b className="bpb-sens-text">2 × 1 × 4 = 8</b>.</figcaption>
  </BackpropFigure>;
}

const engineLabels = { x: 'x (leaf)', u: 'u = x × x', c: '2 (constant)', m: 'm = u × 2', L: 'L = u + m' };

// §3: the downloadable engine's reverse sweep over §2's graph, one pullback at a time.
export function EngineOrderFigure() {
  const [stage, setStage] = useState(0);
  const state = engineTrace[stage];
  const previous = engineTrace[Math.max(0, stage - 1)].grads;
  const reverse = [...engineOrder].reverse();
  return <BackpropFigure id="engine-order" title="The engine's reverse sweep over u = x × x, L = u + 2u">
    <p><span className="bpb-row-label">Recorded forward order</span> {engineOrder.map(name => <span key={name} className="bpb-chip">{engineLabels[name]}</span>)}</p>
    <p><span className="bpb-row-label">Reverse sweep</span> {reverse.map(name => <span key={name} className={`bpb-chip ${state.node === name ? 'is-active' : ''}`}>{name}</span>)}</p>
    <div className="backprop-table" role="region" aria-label="Gradient buffers after this step" tabIndex={0}><table className="bpb-buffers">
      <thead><tr><th scope="col">buffer</th>{engineOrder.map(name => <th scope="col" key={name}>{engineLabels[name]}</th>)}</tr></thead>
      <tbody><tr><th scope="row">.grad</th>{engineOrder.map(name => <td key={name} className={stage > 0 && state.grads[name] !== previous[name] ? 'is-changed' : ''}>{state.grads[name]}</td>)}</tr></tbody>
    </table></div>
    <BackpropSteps index={stage} setIndex={setStage} count={engineTrace.length} name="Engine sweep" />
    <FlowReadout><strong>{state.node === 'seed' ? 'Seed' : `Run ${state.node}.pullback()`}.</strong> {state.note}</FlowReadout>
    <figcaption>Recorded by running the unchanged downloadable teaching-autodiff.py at x = 3 and reading every .grad buffer after each pullback. The orange outline marks a buffer that this step changed.</figcaption>
  </BackpropFigure>;
}

const listNames = indices => indices.map(j => j + 1).join(' and ');
const factor = value => (value < 0 ? `(${d(value)})` : d(value));
const perceptronsWiring = '/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#neuron-network-wiring';

// The worked network, left to right: inputs (cyan) → hidden ReLU units → class logits
// (violet), every edge labelled. Forward view: amber weights on grey arrows. Backward
// view: the same edges carry orange dashed reverse arrows; each edge label becomes that
// weight's sensitivity and each node shows the sensitivity arriving there.
function WiringDiagram({ off, trueClass, r, view }) {
  const backward = view === 'backward';
  const { W1, b1, W2 } = tinyParameters;
  const nodes = { x1: [44, 64], x2: [44, 184], h1: [184, 64], h2: [184, 184], A: [324, 64], B: [324, 184] };
  const edges = [
    ['x1', 'h1', W1[0][0], r.gW1[0][0], [114, 54]], ['x2', 'h2', W1[1][1], r.gW1[1][1], [114, 204]], ['x1', 'h2', W1[0][1], r.gW1[0][1], [100, 92]], ['x2', 'h1', W1[1][0], r.gW1[1][0], [100, 166]],
    ['h1', 'A', W2[0][0], r.gW2[0][0], [254, 54]], ['h2', 'B', W2[1][1], r.gW2[1][1], [254, 204]], ['h1', 'B', W2[0][1], r.gW2[0][1], [240, 92]], ['h2', 'A', W2[1][0], r.gW2[1][0], [240, 166]],
  ];
  const label = { x1: 'x₁', x2: 'x₂', h1: 'h₁', h2: 'h₂', A: 'A', B: 'B' };
  const role = name => (name[0] === 'x' ? 'supplied' : 'computed');
  const unitOff = name => name[0] === 'h' && off[Number(name[1]) - 1];
  const description = backward
    ? `Backward view. Logit sensitivities p minus target: A ${d(r.g2[0], 3)}, B ${d(r.g2[1], 3)}. Hidden activation sensitivities: h1 ${d(r.ga1[0], 3)}, h2 ${d(r.ga1[1], 3)}. Weight sensitivities: ${edges.map(([from, to, , g]) => `${from} to ${to} ${d(g, 3)}`).join(', ')}.`
    : `Network wiring with inputs ${d(r.x[0])} and ${d(r.x[1])}. Input to hidden weights: x1 to h1 ${W1[0][0]}, x2 to h1 ${W1[1][0]}, x1 to h2 ${W1[0][1]}, x2 to h2 ${W1[1][1]}. Hidden biases ${b1.join(' and ')}. Hidden to logit weights: h1 to A ${W2[0][0]}, h1 to B ${W2[0][1]}, h2 to A ${W2[1][0]}, h2 to B ${W2[1][1]}.`;
  return <svg className={`backprop-svg bpb-wiring-svg ${backward ? 'is-backward' : ''}`} viewBox="0 0 392 250" role="img" aria-label={description} data-view={view}>
    <defs>
      <marker id={`bpb-wiring-${view}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" className={backward ? 'bpb-back-head' : 'bpb-forward-head'} /></marker>
    </defs>
    {edges.map(([from, to, weight, grad, [lx, ly]]) => <g key={from + to} className={unitOff(from) || unitOff(to) ? 'bpb-edge is-off' : 'bpb-edge'}>
      <line x1={nodes[from][0] + 24} y1={nodes[from][1]} x2={nodes[to][0] - 24} y2={nodes[to][1]}
        markerStart={backward ? `url(#bpb-wiring-${view})` : undefined} markerEnd={backward ? undefined : `url(#bpb-wiring-${view})`} />
      <text x={lx} y={ly} textAnchor="middle" className={backward ? 'bpb-edge-sens' : 'bpb-edge-weight'}>{backward ? d(grad, 3) : d(weight)}</text></g>)}
    {Object.entries(nodes).map(([name, [cx, cy]]) => {
      const isTrue = (name === 'A' && trueClass === 0) || (name === 'B' && trueClass === 1);
      const isHidden = name[0] === 'h';
      const j = isHidden ? Number(name[1]) - 1 : null;
      return <g key={name} className={`bpb-wiring-node bpc-${role(name)} ${unitOff(name) ? 'is-off' : ''} ${isTrue ? 'is-true' : ''}`}>
        <circle cx={cx} cy={cy} r="22" /><text x={cx} y={unitOff(name) ? cy : cy + 6} textAnchor="middle" className="bpb-node-label">{label[name]}</text>
        {isHidden && !backward && <text x={cx} y={cy + 42} textAnchor="middle" className="bpb-bias">b = {d(b1[j])}</text>}
        {isHidden && backward && <text x={cx} y={cy < 100 ? cy - 32 : cy + 42} textAnchor="middle" className="bpb-node-sens">∂L/∂a = {d(r.ga1[j], 3)}</text>}
        {isHidden && unitOff(name) && <text x={cx} y={cy + 15} textAnchor="middle" className="bpb-off-label">off</text>}
        {!isHidden && name[0] !== 'x' && backward && <text x={cx} y={cy < 100 ? cy - 46 : cy + 38} textAnchor="middle" className="bpb-node-sens"><tspan x={cx}>p − target</tspan><tspan x={cx} dy="15">= {d(r.g2[name === 'A' ? 0 : 1], 3)}</tspan></text>}
        {isTrue && <text x={cx + 30} y={cy + 5} className="bpb-true-label">true</text>}
      </g>;
    })}
  </svg>;
}

// The opening forward state of the worked network: x = (1, 2), true class B.
export function TinyNetworkFigure() {
  const r = tinyNetwork(tinyDefaults);
  const off = r.mask.map(value => value === 0);
  return <BackpropFigure id="tiny-network-forward" title="The worked network, forward, at x = (1, 2) with true class B">
    <WiringDiagram off={off} trueClass={tinyDefaults.label} r={r} view="forward" />
    <p className="bpc-reading-key">Inputs are <span className="bpc-key-value">cyan</span> circles; hidden units and class scores are <span className="bpc-key-computed">violet</span> circles, each a whole neuron (weighted sum, bias, and ReLU for h) as in the <a href={perceptronsWiring}>Perceptrons network wiring</a>. <span className="bpc-key-param">Amber</span> edge labels are weights; hidden biases are written under each unit; output biases are 0. A dashed circle marked “off” is a ReLU unit whose score is at most 0. The thick white ring and “true” mark the correct class.</p>
  </BackpropFigure>;
}

function band(pTrue) {
  if (pTrue >= 0.8) return 'The true class already has most of the probability, so p − target and every sensitivity are small: a confident correct example asks for little change.';
  if (pTrue > 0.2) return 'The model is undecided, so p − target is moderate. Switching the true class reverses the sign of every sensitivity and rescales it by the ratio of the two probabilities; at exactly p = 0.5 the sizes stay the same.';
  return 'The true class has little probability, so p − target is large and the whole backward pass carries large sensitivities.';
}

// The worked network as a lab, backward view: input x₁ stays at 1; change x₂ and the true
// class. The forward weights are drawn in TinyNetworkFigure directly above the lab.
export function TinyNetworkLab() {
  const [x2, setX2] = useState(tinyDefaults.x2);
  const [label, setLabel] = useState(tinyDefaults.label);
  const inputs = { x1: tinyDefaults.x1, x2, label };
  const r = tinyNetwork(inputs);
  const classes = ['A', 'B'];
  const off = r.mask.map(value => value === 0);
  const offUnits = [0, 1].filter(j => off[j]);
  const atCorner = [0, 1].filter(j => r.z1[j] === 0);
  const { W2 } = tinyParameters;
  const pTrue = r.p[label];
  const plural = offUnits.length > 1;
  const offText = offUnits.length === 0
    ? `Both hidden units are on, so ReLU passes each collected sensitivity back unchanged and every weight receives a nonzero sensitivity. Unit 2's score is x₂ − x₁ − 1.5; lower x₂ to ${d(unitTwoOffThreshold(inputs.x1))} or below to switch it off again.`
    : `Hidden unit${plural ? 's' : ''} ${listNames(offUnits)} ${plural ? 'have scores' : 'has a score'} ≤ 0${atCorner.length ? ` (unit ${listNames(atCorner)} is exactly 0, ReLU's corner, where the §2 convention sets the slope to 0)` : ''}, so ReLU outputs 0 with slope 0. ${plural ? 'Each still receives' : 'It still receives'} a sensitivity (${offUnits.map(j => d(r.ga1[j])).join(', ')}), but the slope 0 stops it: its incoming weights and bias get 0, and its outgoing weights get 0 because their input a is 0.${plural ? ' With both units off, every weight sensitivity is 0; only the output biases still receive p − target.' : ''}`;
  return <FlowLab id="tiny-network-lab" label="The worked network: change an input or the true class">
    <WiringDiagram off={off} trueClass={label} r={r} view="backward" />
    <p className="bpc-reading-key">Same wiring as the forward figure above, run backward: <span className="bpc-key-sens">orange</span> dashed arrows point toward the inputs. The number on each edge is ∂L/∂(that weight); the number beside each node is the sensitivity arriving there, p − target at the class scores and ∂L/∂a at the hidden units.</p>
    <FlowControls>
      <FlowChoice label="True class" options={[[0, 'A'], [1, 'B']]} value={label} onChange={setLabel} />
      <FlowSlider name="Input x₂ (x₁ stays 1)" value={x2} min={-3} max={4} step={0.25} onChange={setX2} format={value => d(value)} />
    </FlowControls>
    <FlowReadout data-tiny-summary data-loss={r.loss} data-mask={r.mask.join(',')}>Loss <strong>{d(r.loss)}</strong>; the network gives the true class {classes[label]} probability <strong>{d(pTrue)}</strong>, so the logit sensitivities p − target are ({d(r.g2[0])}, {d(r.g2[1])}). They add to zero because raising both logits equally changes no probability.</FlowReadout>
    <div className="bpb-collect" data-collect>
      {[0, 1].map(j => <p key={j} data-collect-unit={j + 1}><span className="bpb-collect-unit">h{j === 0 ? '₁' : '₂'} collects</span> <span className="bpb-sens-text">{factor(r.g2[0])}</span> × {factor(W2[j][0])} <small>(edge to A)</small> + <span className="bpb-sens-text">{factor(r.g2[1])}</span> × {factor(W2[j][1])} <small>(edge to B)</small> = <b className="bpb-sens-text">{d(r.ga1[j])}</b>{off[j] ? <> → × slope 0 = <b className="bpb-off-text">0</b></> : <> → × slope 1 = <b className="bpb-sens-text">{d(r.g1[j])}</b></>}</p>)}
    </div>
    <p className="flow-readout" data-tiny-explanation>{offText} {band(pTrue)}</p>
  </FlowLab>;
}
