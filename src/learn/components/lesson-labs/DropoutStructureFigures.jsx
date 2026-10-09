import { useId, useState } from 'react';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { dropoutNetwork, networkPass, thinnedNetworks, passDisagreement } from '../../data/dropout-network.js';
import { formatDropout as fmt } from '../../data/dropout-models.js';
import './dropout-structure.css';

// Colours follow docs/teaching/deep-learning-beginner/visual-vocabulary.md: cyan supplied inputs,
// amber learned weights, violet computed values, white-outline operations (the mask gate multiplies),
// orange backward gradients, dimmed dashed outline with × for anything a mask removed.

const num = value => fmt(value).replace(/-/g, '−');
const vec = values => '[' + values.map(num).join(', ') + ']';
const scale = factor => factor === 1 ? '× 1' : '× ' + num(factor);
const masks = [[1, 0], [0, 1], [1, 1], [0, 0]];
const maskOptions = masks.map(mask => [mask.join(''), vec(mask)]);
const parseMask = key => key.split('').map(Number);

function Marker({ id }) {
  return <defs><marker id={id} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#b9b5af" /></marker></defs>;
}
function Wire({ from, to, marker, off, label, at, tone }) {
  return <g className={'dx-wire' + (off ? ' is-off' : '') + (tone ? ' dx-wire--' + tone : '')}>
    <path d={`M ${from.join(' ')} L ${to.join(' ')}`} markerEnd={`url(#${marker})`} />
    {label !== undefined && <text x={at[0]} y={at[1]} textAnchor="middle">{label}</text>}
  </g>;
}
function Node({ x, y, label, value, kind, off, r = 30 }) {
  return <g className={`dx-node dx-node--${kind}` + (off ? ' is-off' : '')}>
    <circle cx={x} cy={y} r={r} />
    <text x={x} y={value === undefined ? y + 6 : y - 4} textAnchor="middle">{label}</text>
    {value !== undefined && <text className="dx-value" x={x} y={y + 16} textAnchor="middle">{value}</text>}
    {off && <g className="dx-cross"><circle cx={x + r * .72} cy={y - r * .72} r="9" /><path d={`M ${x + r * .72 - 4} ${y - r * .72 - 4} L ${x + r * .72 + 4} ${y - r * .72 + 4} M ${x + r * .72 + 4} ${y - r * .72 - 4} L ${x + r * .72 - 4} ${y - r * .72 + 4}`} /></g>}
  </g>;
}
function Gate({ x, y, w = 76, h = 34, text, off, idle }) {
  return <g className={'dx-gate' + (off ? ' is-off' : '') + (idle ? ' is-idle' : '')}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="6" />
    <text x={x} y={y + 5} textAnchor="middle">{text}</text>
  </g>;
}

// The §1 network: two inputs, two hidden ReLU units, a mask gate on each hidden output, one output.
function NetworkDrawing({ compact, inputs, result, mask, training, probability, showGradients, marker }) {
  const W = dropoutNetwork.firstWeights, v = dropoutNetwork.outputWeights;
  const off = result.factors.map(f => f === 0);
  const P = compact
    ? { x: [[80, 48], [220, 48]], h: [[80, 190], [220, 190]], g: [[80, 300], [220, 300]], y: [150, 430], box: '0 0 300 540' }
    : { x: [[60, 90], [60, 240]], h: [[275, 90], [275, 240]], g: [[440, 90], [440, 240]], y: [640, 165], box: '0 0 760 320' };
  const edge = (a, b, ra = 30, rb = 30) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    return [[a[0] + dx * ra / d, a[1] + dy * ra / d], [b[0] - dx * rb / d, b[1] - dy * rb / d]];
  };
  const along = (a, b, t, shift = [0, 0]) => [a[0] + (b[0] - a[0]) * t + shift[0], a[1] + (b[1] - a[1]) * t + shift[1]];
  const g = result;
  const gateW = compact ? 118 : 150, gateHalf = gateW / 2;
  const tone = showGradients ? 'gradient' : 'weight';
  const firstLabel = (j, i) => showGradients ? num(g.firstWeightGradient[j][i]) : '×' + num(W[j][i]);
  const title = `Inputs ${vec(inputs)} feed two ReLU hidden units giving h = ${vec(g.hidden)}. ${training ? 'Training' : 'Evaluation'} gate multipliers ${vec(g.factors)} pass ${vec(g.passed)} on. Output weights 1 and −0.5 give ŷ = ${num(g.output)}; target 1, loss ${num(g.loss)}.` + (showGradients ? ` Arrow labels are gradients: output weights ${vec(g.outputWeightGradient)}, first layer into h₁ ${vec(g.firstWeightGradient[0])}, into h₂ ${vec(g.firstWeightGradient[1])}.` : '');
  return <svg className={'dx-svg ' + (compact ? 'dx-svg--compact' : 'dx-svg--wide')} viewBox={P.box} role="img" aria-label={title}>
    <Marker id={marker} />
    {[0, 1].flatMap(i => [0, 1].map(j => {
      const [a, b] = edge(P.x[i], P.h[j]);
      const straight = i === j;
      const shift = compact ? (straight ? [i ? 18 : -18, 0] : [i ? -14 : 14, -4]) : (straight ? [0, -10] : (i ? [14, 16] : [14, -10]));
      return <Wire key={`${i}${j}`} from={a} to={b} marker={marker} tone={tone} off={showGradients && g.firstWeightGradient[j][i] === 0} label={firstLabel(j, i)} at={along(a, b, .74, shift)} />;
    }))}
    {[0, 1].map(j => {
      const [hx, hy] = P.h[j], [gx, gy] = P.g[j];
      const [a, b] = compact ? [[hx, hy + 34], [gx, gy - 18]] : [[hx + 34, hy], [gx - gateHalf, gy]];
      return <Wire key={'hg' + j} from={a} to={b} marker={marker} off={off[j]} />;
    })}
    {[0, 1].map(j => {
      const [gx, gy] = P.g[j];
      const start = compact ? [gx, gy + 18] : [gx + gateHalf, gy];
      const [, b] = edge(start, P.y, 0, 34);
      const label = showGradients ? num(g.outputWeightGradient[j]) : '×' + num(v[j]);
      const at = compact ? along(start, b, .45, [j ? 26 : -26, 0]) : along(start, b, .42, [j ? -18 : -8, j ? 30 : -14]);
      return <Wire key={'gy' + j} from={start} to={b} marker={marker} tone={tone} off={off[j] || (showGradients && g.outputWeightGradient[j] === 0)} label={label} at={at} />;
    })}
    {P.x.map(([x, y], i) => <Node key={'x' + i} x={x} y={y} label={'x' + '₁₂'[i]} value={num(inputs[i])} kind="input" />)}
    {P.h.map(([x, y], j) => <Node key={'h' + j} x={x} y={y} r={34} label={'h' + '₁₂'[j]} value={num(g.hidden[j])} kind="computed" off={off[j]} />)}
    {P.g.map(([x, y], j) => <Gate key={'g' + j} x={x} y={y} text={training && probability > 0 ? (probability === 1 ? '× 0' : `m${'₁₂'[j]}=${mask[j]} → ${scale(g.factors[j])}`) : '× 1 (no mask)'} off={off[j]} idle={!training || probability === 0} w={gateW} />)}
    <Node x={P.y[0]} y={P.y[1]} r={34} label="ŷ" value={num(g.output)} kind="computed" />
    {compact
      ? <><text className="dx-caption" x="150" y="505" textAnchor="middle">target y = 1 · L = {num(g.loss)}</text><text className="dx-caption" x="150" y="245" textAnchor="middle">mask gates</text></>
      : <><text className="dx-caption" x="640" y="228" textAnchor="middle">target y = 1</text><text className="dx-caption" x="640" y="252" textAnchor="middle">L = {num(g.loss)}</text>
        <text className="dx-caption" x="60" y="30" textAnchor="middle">inputs</text><text className="dx-caption" x="275" y="30" textAnchor="middle">hidden ReLU units</text><text className="dx-caption" x="440" y="30" textAnchor="middle">mask gates</text><text className="dx-caption" x="640" y="98" textAnchor="middle">output</text></>}
  </svg>;
}

function Drawing(props) {
  const marker = useId();
  return <div className="dx-drawing">{[false, true].map(compact => <NetworkDrawing key={String(compact)} compact={compact} marker={marker + (compact ? 'c' : 'w')} {...props} />)}</div>;
}

const inputs = [1, 1];
const probability = .5;

// Where dropout sits: choose a mask or switch to evaluation, and follow what reaches the output.
export function DropoutNetworkLab() {
  const [maskKey, setMaskKey] = useState('10');
  const [mode, setMode] = useState('train');
  const mask = parseMask(maskKey), training = mode === 'train';
  const result = networkPass({ inputs, mask, probability, training });
  const dropped = result.factors.map((f, j) => f === 0 ? 'h' + '₁₂'[j] : null).filter(Boolean);
  return <FlowLab id="dropout-network" label="Where dropout sits inside a network">
    <Drawing inputs={inputs} result={result} mask={mask} training={training} probability={probability} showGradients={false} />
    <FlowControls>
      <FlowChoice label="Mask m" options={maskOptions} value={maskKey} onChange={setMaskKey} />
      <FlowChoice label="Mode" options={[['train', 'Training'], ['eval', 'Evaluation']]} value={mode} onChange={setMode} />
    </FlowControls>
    <FlowReadout>{training
      ? <>Training with mask {vec(mask)}: the gates turn h = {vec(result.hidden)} into <strong>h̃ = {vec(result.passed)}</strong>{dropped.length ? <> ({dropped.join(' and ')} dropped)</> : null}, so ŷ = 1·{num(result.passed[0])} − 0.5·{num(result.passed[1])} = <strong>{num(result.output)}</strong> and L = ½(ŷ − 1)² = {num(result.loss)}.</>
      : <>Evaluation: every gate passes its value unchanged, whatever the mask, so h̃ = h = {vec(result.passed)}, ŷ = <strong>{num(result.output)}</strong> and L = {num(result.loss)}.</>}</FlowReadout>
  </FlowLab>;
}

// The same network with each arrow labelled by its weight's gradient from this one example.
export function DropoutGradientLab() {
  const [maskKey, setMaskKey] = useState('10');
  const mask = parseMask(maskKey);
  const result = networkPass({ inputs, mask, probability, training: true });
  const rate = .1;
  const next = dropoutNetwork.outputWeights.map((w, j) => w - rate * result.outputWeightGradient[j]);
  const nextOutput = result.passed.reduce((sum, value, j) => sum + value * next[j], 0);
  return <FlowLab id="dropout-gradients" label="Gradients through a sampled mask">
    <Drawing inputs={inputs} result={result} mask={mask} training probability={probability} showGradients />
    <FlowControls>
      <FlowChoice label="Mask m" options={maskOptions} value={maskKey} onChange={setMaskKey} />
    </FlowControls>
    <FlowReadout>∂L/∂ŷ = ŷ − 1 = <strong>{num(result.error)}</strong>. Output-weight gradients <strong>{vec(result.outputWeightGradient)}</strong>; first-layer gradients into h₁ {vec(result.firstWeightGradient[0])} and into h₂ {vec(result.firstWeightGradient[1])}. One gradient step of size 0.1 on the output weights gives w = {vec(next)}; with the same mask, ŷ becomes {num(nextOutput)} and L = {num((nextOutput - 1) ** 2 / 2)}.</FlowReadout>
  </FlowLab>;
}

// Small static network: sources feed targets; edges can be removed individually.
function MiniNet({ sources, targets, edges, label }) {
  const id = useId();
  const sy = i => 32 + i * 66, ty = i => targets.length === 1 ? 65 : 32 + i * 66;
  return <svg className="dx-mini" viewBox="0 0 220 130" role="img" aria-label={label}>
    <Marker id={id} />
    {edges.map(({ from, to, kept, text }, k) => {
      const a = [52, sy(from)], b = [168, ty(to)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const s = [a[0] + (b[0] - a[0]) * 24 / d, a[1] + (b[1] - a[1]) * 24 / d], e = [b[0] - (b[0] - a[0]) * 26 / d, b[1] - (b[1] - a[1]) * 26 / d];
      return <Wire key={k} from={s} to={e} marker={id} off={!kept} tone="weight" label={text} at={[a[0] + (b[0] - a[0]) * .5, a[1] + (b[1] - a[1]) * .5 + (b[1] < a[1] ? 18 : -6)]} />;
    })}
    {sources.map((node, i) => <Node key={'s' + i} x={30} y={sy(i)} r={22} label={node.label} kind="computed" off={node.off} />)}
    {targets.map((node, i) => <Node key={'t' + i} x={192} y={ty(i)} r={22} label={node.label} kind="computed" />)}
  </svg>;
}

export function ThinnedNetworksFigure() {
  const rows = thinnedNetworks({ probability: .5 });
  return <figure className="dx-figure" data-figure="dropout-thinned-networks">
    <div className="dx-thinned dx-thinned--four">{rows.map(row => <section key={row.mask.join('')}>
      <MiniNet label={`Mask ${vec(row.mask)}: ${row.mask.map((b, j) => 'h' + (j + 1) + (b ? ' kept' : ' dropped')).join(', ')}; output ${num(row.output)}`}
        sources={[0, 1].map(j => ({ label: 'h' + '₁₂'[j], off: !row.mask[j] }))} targets={[{ label: 'ŷ' }]}
        edges={[0, 1].map(j => ({ from: j, to: 0, kept: Boolean(row.mask[j]), text: row.mask[j] ? ['×1', '×−0.5'][j] : '0' }))} />
      <p><strong>Mask {vec(row.mask)}</strong> · probability {fmt(row.probability)}<br />h̃ = {vec(row.passed)} · ŷ = {num(row.output)}</p>
    </section>)}</div>
    <figcaption>Inputs (1, 1), p = 0.5. Each panel is one thinned network: dropped units are dashed with ×, and every surviving arrow keeps its weight. Kept values are already doubled.</figcaption>
  </figure>;
}

// Same four masks, now feeding signed contributions [1, −1] into a sum followed by ReLU.
export function ReluForkFigure() {
  const contributions = [1, -1];
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(mask => {
    const kept = contributions.map((c, j) => c * mask[j] * 2);
    const sum = kept[0] + kept[1];
    return { mask, kept, sum, relu: Math.max(0, sum) };
  });
  const mean = rows.reduce((total, row) => total + row.relu, 0) / rows.length;
  return <figure className="dx-figure" data-figure="dropout-relu-fork">
    <table className="dx-fork">
      <thead><tr><th scope="col">Mask</th><th scope="col">Masked contributions</th><th scope="col">Sum</th><th scope="col">ReLU(sum)</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.mask.join('')}><th scope="row">{vec(row.mask)}</th><td>{vec(row.kept)}</td><td>{num(row.sum)}</td><td><strong>{num(row.relu)}</strong></td></tr>)}</tbody>
    </table>
    <figcaption>Each mask has probability 0.25. The four ReLU outputs average to <strong>{num(mean)}</strong>, while the unmasked network computes ReLU(1 − 1) = 0. The masked sums still average to 0; only the clipping after them breaks the agreement.</figcaption>
  </figure>;
}

export function DropConnectNetworkViews() {
  const sources = [{ label: 'h₁' }, { label: 'h₂' }];
  return <div className="dx-thinned dx-thinned--two">
    <section><MiniNet label="Unit dropout: h2 is dropped, so both of its outgoing connections disappear" sources={[{ label: 'h₁' }, { label: 'h₂', off: true }]} targets={[{ label: 'r₁' }, { label: 'r₂' }]} edges={[{ from: 0, to: 0, kept: true }, { from: 0, to: 1, kept: true }, { from: 1, to: 0, kept: false }, { from: 1, to: 1, kept: false }]} /><p>Unit mask: drop h₂. <strong>Both</strong> of its arrows go.</p></section>
    <section><MiniNet label="Connection dropout: only the two diagonal connections are kept" sources={sources} targets={[{ label: 'r₁' }, { label: 'r₂' }]} edges={[{ from: 0, to: 0, kept: true }, { from: 0, to: 1, kept: false }, { from: 1, to: 0, kept: false }, { from: 1, to: 1, kept: true }]} /><p>Connection mask: each arrow decides alone. r₁ keeps h₁; r₂ keeps h₂.</p></section>
  </div>;
}

// The residual block from the previous lesson with one mask gate, on the branch or after the sum.
export function ResidualBranchDiagram({ placement, factor, input, correction, output }) {
  const id = useId();
  const dropped = factor === 0;
  const branchOff = dropped && placement === 'branch', allOff = dropped && placement === 'whole';
  const gateText = scale(factor);
  const wide = <svg className="dx-svg dx-svg--wide" viewBox="0 0 760 230" role="img" aria-label={`Residual block with the mask gate ${placement === 'branch' ? 'on branch F' : 'after the addition'}; gate multiplier ${num(factor)}. Input ${vec(input)}, F(x) = ${vec(correction)}, output ${vec(output)}.`}>
    <Marker id={id + 'w'} />
    <Wire from={[88, 130]} to={[168, 130]} marker={id + 'w'} />
    <path className="dx-skip" d="M 60 100 L 60 44 L 480 44 L 480 100" markerEnd={`url(#${id}w)`} />
    <text className="dx-caption" x="270" y="34" textAnchor="middle">skip · identity: copies x</text>
    <g className={'dx-box' + (branchOff ? ' is-off' : '')}><rect x="170" y="105" width="120" height="50" rx="6" /><text x="230" y="136" textAnchor="middle">Branch F</text></g>
    <Wire from={[290, 130]} to={[330, 130]} marker={id + 'w'} off={branchOff} />
    {placement === 'branch' ? <Gate x={372} y={130} w={84} text={gateText} off={dropped} /> : <text className="dx-caption" x="372" y="136" textAnchor="middle">no gate</text>}
    <Wire from={[416, 130]} to={[456, 130]} marker={id + 'w'} off={branchOff} />
    <g className="dx-sum"><circle cx="480" cy="130" r="22" /><text x="480" y="137" textAnchor="middle">+</text></g>
    <Wire from={[502, 130]} to={placement === 'whole' ? [540, 130] : [640, 130]} marker={id + 'w'} off={allOff} />
    {placement === 'whole' && <><Gate x={582} y={130} w={84} text={gateText} off={dropped} /><Wire from={[624, 130]} to={[640, 130]} marker={id + 'w'} off={allOff} /></>}
    <Node x={60} y={130} label="x" kind="input" />
    <Node x={676} y={130} label="y" kind="computed" />
    <text className="dx-caption" x="60" y="190" textAnchor="middle">{vec(input)}</text>
    <text className="dx-caption" x="230" y="185" textAnchor="middle">F(x) = {vec(correction)}</text>
    <text className="dx-caption" x="676" y="190" textAnchor="middle">{vec(output)}</text>
  </svg>;
  const compact = <svg className="dx-svg dx-svg--compact" viewBox="0 0 300 560" role="img" aria-label={`Residual block, vertical layout, gate ${placement === 'branch' ? 'on branch F' : 'after the addition'}. Output ${vec(output)}.`}>
    <Marker id={id + 'c'} />
    <Node x={150} y={44} label="x" kind="input" />
    <text className="dx-caption" x="150" y="100" textAnchor="middle">{vec(input)}</text>
    <path className="dx-skip" d="M 120 60 L 40 60 L 40 360 L 128 360" markerEnd={`url(#${id}c)`} />
    <text className="dx-caption dx-caption--vertical" x="28" y="210" textAnchor="middle" transform="rotate(-90 28 210)">skip · identity</text>
    <Wire from={[150, 108]} to={[150, 130]} marker={id + 'c'} />
    <g className={'dx-box' + (branchOff ? ' is-off' : '')}><rect x="92" y="132" width="116" height="46" rx="6" /><text x="150" y="161" textAnchor="middle">Branch F</text></g>
    <text className="dx-caption" x="150" y="200" textAnchor="middle">F = {vec(correction)}</text>
    <Wire from={[150, 208]} to={[150, 240]} marker={id + 'c'} off={branchOff} />
    {placement === 'branch' ? <Gate x={150} y={262} w={96} text={gateText} off={dropped} /> : <text className="dx-caption" x="150" y="268" textAnchor="middle">no gate</text>}
    <Wire from={[150, 284]} to={[150, 336]} marker={id + 'c'} off={branchOff} />
    <g className="dx-sum"><circle cx="150" cy="360" r="22" /><text x="150" y="367" textAnchor="middle">+</text></g>
    <Wire from={[150, 382]} to={placement === 'whole' ? [150, 408] : [150, 474]} marker={id + 'c'} off={allOff} />
    {placement === 'whole' && <><Gate x={150} y={430} w={96} text={gateText} off={dropped} /><Wire from={[150, 452]} to={[150, 474]} marker={id + 'c'} off={allOff} /></>}
    <Node x={150} y={506} label="y" kind="computed" />
    <text className="dx-caption" x="238" y="512" textAnchor="middle">{vec(output)}</text>
  </svg>;
  return <div className="dx-drawing" data-figure="dropout-residual-branch">{wide}{compact}</div>;
}

// A row of residual blocks drawn as one chain. Clicking a block flips its sampled bit.
export function DepthStackStrip({ rates, active, onToggle }) {
  const fixed = rate => rate === 0 ? 'always on (rate 0)' : rate === 1 ? 'always off (rate 1)' : null;
  const path = ['H₀', ...active.map((on, index) => on ? 'F' + (index + 1) : 'skip'), 'output'].join(' → ');
  const depth = active.filter(Boolean).length;
  return <div className="dx-stack-figure" data-figure="dropout-depth-stack">
    <ol className="dx-stack" aria-label="Residual blocks in order; select a block to flip its sampled bit">
      <li className="dx-stack-tile dx-stack-tile--end"><strong>H₀</strong><span>block input</span></li>
      {rates.map((rate, index) => <li key={index} className={'dx-stack-tile' + (active[index] ? '' : ' is-off')}>
        <button type="button" aria-pressed={active[index]} disabled={Boolean(fixed(rate))} onClick={() => onToggle(index)} aria-label={`Block ${index + 1}: drop rate ${fmt(rate, 3)}, branch ${active[index] ? 'active' : 'dropped'}. ${fixed(rate) ? fixed(rate) + '.' : 'Select to flip.'}`}>
          <svg viewBox="0 0 120 64" aria-hidden="true"><path className="dx-skip" d="M 0 52 L 120 52" /><path className={'dx-tile-branch' + (active[index] ? '' : ' is-off')} d="M 14 52 L 14 14 L 36 14 M 84 14 L 106 14 L 106 52" /><rect className={'dx-tile-box' + (active[index] ? '' : ' is-off')} x="36" y="3" width="48" height="22" rx="4" /><text x="60" y="19" textAnchor="middle">F{index + 1}</text><circle className="dx-tile-sum" cx="106" cy="52" r="6" /></svg>
          <strong>Block {index + 1}</strong>
          <span>drop {fmt(rate, 3)}</span>
          <span>{fixed(rate) || (active[index] ? 'branch on' : 'skip only ×')}</span>
        </button>
      </li>)}
      <li className="dx-stack-tile dx-stack-tile--end dx-stack-tile--output"><strong>Output</strong><span>after block {rates.length}</span></li>
    </ol>
    <p className="dx-stack-path">This pass: {path}. It uses {depth} of {rates.length} corrections, so the example sees a network {depth} blocks deep.</p>
  </div>;
}

export function VarianceShiftFigure() {
  return <figure className="dx-figure" data-figure="dropout-variance-shift">
    <div className="dx-flows flow-columns-2">
      <section><h5>Training</h5><ol className="dx-flow"><li className="is-input"><b>X</b><span>1 or 3 · mean 2 · variance 1</span></li><li className="dx-flow-mask"><b>dropout × m/q</b><span>each value dropped to 0 or kept and doubled (2 or 6)</span></li><li><b>X̃</b><span>mean 2 · variance 6</span></li><li><b>BatchNorm</b><span>normalizes with the batch it sees and stores a running variance that tracks the noisy 6</span></li></ol></section>
      <section><h5>Evaluation</h5><ol className="dx-flow"><li className="is-input"><b>X</b><span>1 or 3 · mean 2 · variance 1</span></li><li className="dx-flow-mask is-identity"><b>dropout off</b><span>identity: values pass unchanged</span></li><li><b>X</b><span>mean 2 · variance 1</span></li><li><b>BatchNorm</b><span>divides by the <em>stored</em> noisy spread, so clean values come out narrower than ±1</span></li></ol></section>
    </div>
    <figcaption>Dropout sits directly before BatchNorm, with q = 0.5. The mean reaching BatchNorm is 2 in both modes; the spread is not.</figcaption>
  </figure>;
}

export function MonteCarloPassesFigure() {
  const cases = [
    { name: 'Masks disagree', passes: [[.9, .1], [.1, .9]], masks: [[1, 0], [0, 1]] },
    { name: 'Each pass is unsure', passes: [[.5, .5], [.5, .5]], masks: [[1, 0], [0, 1]] },
  ];
  return <figure className="dx-figure" data-figure="dropout-mc-passes">
    <div className="dx-mc flow-columns-2">{cases.map(c => {
      const s = passDisagreement(c.passes);
      return <section key={c.name}><h5>{c.name}</h5>
        <div className="dx-mc-passes">{c.passes.map((p, t) => <div key={t}>
          <MiniNet label={`Pass ${t + 1}: mask ${vec(c.masks[t])}`} sources={[0, 1].map(j => ({ label: 'h' + '₁₂'[j], off: !c.masks[t][j] }))} targets={[{ label: 'π' }]} edges={[0, 1].map(j => ({ from: j, to: 0, kept: Boolean(c.masks[t][j]), text: '' }))} />
          <p>Pass {t + 1}: π = {vec(p)}</p>
        </div>)}</div>
        <p className="dx-mc-summary">Average π̄ = {vec(s.mean)}</p>
      </section>;
    })}</div>
    <figcaption>A hypothetical two-class example. Each pass runs the same trained network with a different mask and returns a class-probability vector π; the prediction π̄ is their average. Both cases average to [0.5, 0.5].</figcaption>
  </figure>;
}
