import { useId, useState } from 'react';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowChoice, FlowControls, FlowLab, FlowReadout, FlowSlider } from './LessonFlow.jsx';
import { firstAdamChange, layerForward, layerInput, manyDrawAverages, probePrediction, probeSchemes, upstreamGradient, widthShapes } from '../../data/weight-initialization-buildup.js';
import records from '../../data/weight-initialization-measurements.json';
import './initialization-buildup.css';

// Colour roles follow docs/teaching/deep-learning-beginner/visual-vocabulary.md:
// cyan supplied inputs, amber learned parameters (weights), violet computed values,
// orange dashed backward flow and gradients, thick white outline for the traced element.

const superscript = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
// Readable scientific notation for values spanning dozens of orders of magnitude, with true minus signs.
export function sci(value, digits = 3) {
  if (value === 0) return '0';
  if (!Number.isFinite(value)) return 'undefined';
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e4) return String(Number(value.toPrecision(digits))).replace('-', '−');
  const [mantissa, exponent] = value.toExponential(digits - 1).split('e');
  return `${mantissa.replace('-', '−')} × 10${String(Number(exponent)).split('').map(character => superscript[character]).join('')}`;
}
const fixed = (value, digits = 3) => String(Number(value.toFixed(digits))).replace('-', '−');
const sub = '₁₂₃₄';
const signed = value => String(value).replace('-', '−');

/* ---------- One drawn layer: inputs, sixteen weights, four outputs ---------- */
const rowsY = [45, 110, 175, 240];
const inX = 52, outX = 300;
const at = (t, a, b) => a + t * (b - a);

// mode 'fan-in': light the weights into output `index`; 'fan-out': the weights leaving input `index`,
// drawn with backward gradients; 'plain': no highlight, every output value shown.
function LayerDrawing({ layer, mode = 'plain', index = 0, label }) {
  const arrow = useId().replace(/:/g, '');
  const lit = (i, j) => (mode === 'fan-in' ? j === index : mode === 'fan-out' ? i === index : false);
  return <svg className="init-layer" viewBox="0 0 450 290" role="img" aria-label={label}>
    <defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="init-arrowhead" /></marker></defs>
    <text className="init-layer__heading" x={inX} y="16" textAnchor="middle">inputs x</text>
    <text className="init-layer__heading" x="176" y="16" textAnchor="middle">weights W</text>
    <text className="init-layer__heading" x={outX} y="16" textAnchor="middle">outputs h</text>
    {rowsY.map((y1, i) => rowsY.map((y2, j) => <line key={`${i}-${j}`} x1={inX + 22} y1={y1} x2={outX - 24} y2={y2}
      className={lit(i, j) ? (mode === 'fan-out' ? 'init-edge init-edge--back' : 'init-edge init-edge--lit') : 'init-edge'} markerStart={mode === 'fan-out' && lit(i, j) ? `url(#${arrow})` : undefined} />))}
    {mode === 'fan-in' && rowsY.map((y1, i) => { const t = 0.3; return <text key={i} className="init-weight-label" x={at(t, inX + 22, outX - 24)} y={at(t, y1, rowsY[index]) - 5} textAnchor="middle">{fixed(layer.weights[index][i])}</text>; })}
    {mode === 'fan-out' && rowsY.map((y2, j) => { const t = 0.72; return <text key={j} className="init-weight-label" x={at(t, inX + 22, outX - 24)} y={at(t, rowsY[index], y2) - 5} textAnchor="middle">{fixed(layer.weights[j][index])}</text>; })}
    {rowsY.map((y, i) => <g key={i} className={`init-node init-node--input${(mode === 'fan-out' && i === index) ? ' init-node--traced' : ''}`}>
      <circle cx={inX} cy={y} r="23" /><text x={inX} y={y - 3} textAnchor="middle">x{sub[i]}</text><text className="init-node__value" x={inX} y={y + 13} textAnchor="middle">{signed(layerInput[i])}</text></g>)}
    {rowsY.map((y, j) => { const off = layer.gates[j] === 0; return <g key={j} className={`init-node init-node--output${(mode === 'fan-in' && j === index) ? ' init-node--traced' : ''}${off ? ' init-node--off' : ''}`}>
      <circle cx={outX} cy={y} r="24" /><text x={outX} y={y - 3} textAnchor="middle">h{sub[j]}</text><text className="init-node__value" x={outX} y={y + 13} textAnchor="middle">{fixed(layer.outputs[j], 2)}</text>
      {mode === 'fan-out' && <text className="init-gradient-label" x={outX + 32} y={y + 5}>g = {signed(upstreamGradient[j])}{off ? ' · off' : ''}</text>}
    </g>; })}
    {mode !== 'fan-out' && rowsY.map((y, j) => <text key={j} className="init-relu-label" x={outX + 32} y={y + 5}>{layer.gates[j] ? 'ReLU on' : 'ReLU off'}</text>)}
  </svg>;
}

export function LayerAnatomyFigure() {
  const [output, setOutput] = useState(0);
  const layer = layerForward(0.5, 'A');
  const row = layer.weights[output];
  return <FlowLab id="layer-anatomy" label="One layer: the weights into one output">
    <div className="flow-columns-2 init-anatomy">
      <LayerDrawing layer={layer} mode="fan-in" index={output}
        label={`Four input circles on the left connect to four output circles on the right by sixteen lines, one weight each. The four lines into output h${sub[output]} are highlighted with their weights ${row.map(w => fixed(w)).join(', ')}.`} />
      <div className="init-matrix" role="region" tabIndex={0} aria-label="Weight matrix W: one row per output, one column per input">
        <table><caption>The same sixteen weights stored as W: row j holds the weights into output hⱼ.</caption>
          <thead><tr><th scope="col"><span className="init-visually-hidden">output (row) by input (column)</span><span aria-hidden="true">W</span></th>{layerInput.map((value, i) => <th scope="col" key={i}>x{sub[i]}</th>)}</tr></thead>
          <tbody>{layer.weights.map((weights, j) => <tr key={j} className={j === output ? 'is-traced' : ''}><th scope="row">h{sub[j]}</th>{weights.map((weight, i) => <td key={i}>{fixed(weight)}</td>)}</tr>)}</tbody></table>
      </div>
    </div>
    <FlowControls><FlowChoice label="Follow output" value={output} onChange={setOutput} options={[0, 1, 2, 3].map(j => [j, `h${sub[j]}`])} /></FlowControls>
    <FlowReadout>h{sub[output]} adds four products, one per highlighted line: z = {row.map((weight, i) => `(${fixed(weight)})(${signed(layerInput[i])})`).join(' + ')} = <strong>{fixed(layer.scores[output], 4)}</strong>. ReLU then gives h{sub[output]} = <strong>{fixed(layer.outputs[output], 4)}</strong>.</FlowReadout>
  </FlowLab>;
}

export function LayerScaleFigure() {
  const [std, setStd] = useState(0.5), [draw, setDraw] = useState('A');
  const layer = layerForward(std, draw);
  const ratio = std === 0 ? null : layer.realizedFactor / (std * std);
  return <FlowLab id="layer-scale" label="One layer: how the weight scale s changes the outputs">
    <LayerDrawing layer={layer} label={`The same four-input layer with weights s times draw ${draw}, s = ${fixed(std, 2)}. Outputs: ${layer.outputs.map(h => fixed(h, 2)).join(', ')}.`} />
    <FlowControls>
      <FlowSlider name="Weight scale s" value={std} onChange={setStd} min={0} max={1.5} step={0.01} format={value => fixed(value, 2)} />
      <FlowChoice label="Random draw" value={draw} onChange={setDraw} options={[['A', 'A'], ['B', 'B'], ['C', 'C']]} />
    </FlowControls>
    <FlowReadout>Input mean square q = <strong>{fixed(layer.inputSecondMoment, 4)}</strong>; output mean square = <strong>{sci(layer.outputSecondMoment, 4)}</strong>. This draw's multiplier, output ÷ input mean square, is <strong>{sci(layer.realizedFactor, 3)}</strong>{ratio === null ? ' (every weight is zero at s = 0)' : <>, which equals <strong>{fixed(ratio, 3)}</strong> × s² for draw {draw} at every s</>}.</FlowReadout>
  </FlowLab>;
}

/* ---------- 1,000 fresh draws of the same layer ---------- */
const manyDraws = manyDrawAverages(1000, 2026);
export function ManyDrawsFigure() {
  const width = 8, bins = 16, counts = Array.from({ length: bins + 1 }, () => 0);
  manyDraws.values.forEach(value => { counts[Math.min(bins, Math.floor(value / (width / bins)))]++; });
  const top = Math.max(...counts), x = value => 46 + value / width * 288, barW = 288 / bins;
  const marks = [['A', 0.82], ['B', 1.29], ['C', 2.53]];
  return <figure className="init-many" id="many-draws">
    <svg viewBox="0 0 380 230" role="img" aria-label={`Histogram of 1,000 single-draw multipliers divided by s squared. Most draws lie between 0 and 3; the long right tail reaches past 8 (${counts[bins]} draws). Mean ${fixed(manyDraws.forward, 2)}, median ${fixed(manyDraws.median, 2)}. Draws A, B and C sit at 0.82, 1.29 and 2.53.`}>
      {counts.slice(0, bins).map((count, k) => <rect key={k} className="init-many__bar" x={46 + k * barW + 1} width={barW - 2} y={170 - count / top * 130} height={count / top * 130} />)}
      <rect className="init-many__bar init-many__bar--tail" x={46 + 288 + 6} width={barW - 2} y={170 - counts[bins] / top * 130} height={counts[bins] / top * 130} />
      <text className="init-axis-label" x={46 + 288 + 6 + barW / 2} y="186" textAnchor="middle">8+</text>
      <line className="init-axis" x1="46" x2="334" y1="170" y2="170" />
      {[0, 2, 4, 6, 8].map(tick => <text key={tick} className="init-axis-label" x={x(tick)} y="186" textAnchor="middle">{tick}</text>)}
      <line className="init-many__mean" x1={x(manyDraws.forward)} x2={x(manyDraws.forward)} y1="30" y2="170" />
      <text className="init-many__mean-label" x={x(manyDraws.forward) + 5} y="40">mean {fixed(manyDraws.forward, 2)}</text>
      <line className="init-many__median" x1={x(manyDraws.median)} x2={x(manyDraws.median)} y1="24" y2="170" />
      <text className="init-many__median-label" x={x(manyDraws.median) - 5} y="20" textAnchor="end">median {fixed(manyDraws.median, 2)}</text>
      {marks.map(([name, value]) => <g key={name}><line className="init-many__draw" x1={x(value)} x2={x(value)} y1="172" y2="196" /><text className="init-many__draw-label" x={x(value)} y="210" textAnchor="middle">{name}</text></g>)}
      <text className="init-axis-label" x="190" y="226" textAnchor="middle">multiplier ÷ s² for one random draw of the 4 × 4 layer</text>
    </svg>
    <figcaption>1,000 seeded draws computed in your browser. Only {Math.round(100 * manyDraws.withinFactorTwo)}% land within a factor of two of the mean (between 1 and 4). Over the same draws, the backward multiplier ÷ s², used in section 2, averages {fixed(manyDraws.backward, 2)}.</figcaption>
  </figure>;
}

export function LayerBackwardFigure() {
  const [input, setInput] = useState(0);
  const layer = layerForward(0.5, 'A');
  const terms = layer.weights.map((row, j) => `(${fixed(row[input])})(${layer.gates[j]})(${signed(upstreamGradient[j])})`);
  return <FlowLab id="layer-backward" label="One layer run backward: the gradient reaching one input">
    <LayerDrawing layer={layer} mode="fan-out" index={input}
      label={`The same layer with gradients g = ${upstreamGradient.join(', ')} arriving at the outputs. Dashed orange lines carry them back to input x${sub[input]} along its four outgoing weights; outputs whose ReLU was off pass nothing back.`} />
    <FlowControls><FlowChoice label="Follow input" value={input} onChange={setInput} options={[0, 1, 2, 3].map(i => [i, `x${sub[i]}`])} /></FlowControls>
    <FlowReadout>x{sub[input]} collects one term per outgoing line: weight × ReLU gate (1 on, 0 off) × arriving g. ∂L/∂x{sub[input]} = {terms.join(' + ')} = <strong>{fixed(layer.inputGradient[input], 4)}</strong>.</FlowReadout>
  </FlowLab>;
}

/* ---------- The same layer stacked twenty times ---------- */
export function StackChainFigure() {
  const q0 = records.propagation[0].layers[0].q;
  const stages = [['data', 'inputs x', `128 vectors × 64, q₀ = ${fixed(q0, 3)}`], ['layer', 'layer 1', '64 × 64 W, ReLU'], ['layer', 'layer 2', '64 × 64 W, ReLU'], ['gap', '⋯', 'layers 3–19'], ['layer', 'layer 20', '64 × 64 W, ReLU'], ['score', 'probe score', 'Σ h₂₀ ⊙ c']];
  return <figure className="init-chain" id="layer-stack">
    <ol aria-label="Twenty layers in sequence: each layer's output is the next layer's input">{stages.map(([kind, name, detail]) => <li key={name} data-kind={kind}><strong>{name}</strong><span>{detail}</span></li>)}</ol>
    <p className="init-chain__arrows"><span className="init-chain__forward">forward → activations h₁ … h₂₀, recording q = mean(h²) at each layer</span><span className="init-chain__backward">← backward gradients ∂score/∂h, recording their RMS</span></p>
  </figure>;
}

/* ---------- ReLU keeps half the squared mass of a symmetric score ---------- */
export function HalfMassFigure() {
  // Plot z²·p(z) for a standard normal score: the area under it is E[z²]. Peak at |z| = √2.
  const points = Array.from({ length: 81 }, (_, i) => { const z = -4 + i * 0.1; return [z, z * z * Math.exp(-z * z / 2), Math.exp(-z * z / 2)]; });
  const x = z => 180 + z * 38, y = value => 160 - value * 150;
  const area = side => { const part = points.filter(([z]) => (side < 0 ? z <= 0 : z >= 0)); return `M${x(part[0][0])},160 ` + part.map(([z, m]) => `L${x(z)},${y(m)}`).join(' ') + ` L${x(part.at(-1)[0])},160 Z`; };
  const density = 'M' + points.map(([z, , d]) => `${x(z)},${160 - d * 115}`).join(' L');
  return <figure className="init-halfmass" id="relu-half-mass">
    <svg viewBox="0 0 360 200" role="img" aria-label="Two mirror-image humps of z squared times how likely z is. ReLU sets the left hump, the negative scores, to zero and keeps the right hump. A dashed bell shows how likely each score is.">
      <path d={density} className="init-halfmass__density" />
      <path d={area(-1)} className="init-halfmass__removed" /><path d={area(1)} className="init-halfmass__kept" />
      <line x1="26" x2="334" y1="160" y2="160" className="init-axis" /><line x1="180" x2="180" y1="20" y2="164" className="init-halfmass__zero" />
      <text className="init-axis-label" x="180" y="178" textAnchor="middle">score z = 0</text>
      <text className="init-halfmass__label" x="62" y="32" textAnchor="middle">negative scores</text><text className="init-halfmass__label" x="62" y="48" textAnchor="middle">set to 0</text>
      <text className="init-halfmass__label init-halfmass__label--kept" x="300" y="32" textAnchor="middle">positive scores</text><text className="init-halfmass__label init-halfmass__label--kept" x="300" y="48" textAnchor="middle">kept</text>
      <text className="init-axis-label" x="180" y="12" textAnchor="middle">dashed bell: how likely z is</text>
      <text className="init-axis-label" x="180" y="196" textAnchor="middle">shaded height: z² × how likely z is</text>
    </svg>
  </figure>;
}

/* ---------- The derived factor predicts the section-1 measurements ---------- */
export function ProbePredictionTable() {
  const q0 = records.propagation[0].layers[0].q, cotangent = records.cotangentRms;
  const rows = probeSchemes.map(scheme => {
    const measured = records.propagation.find(row => row.seed === 1 && row.scheme === scheme.id).layers;
    const prediction = probePrediction(scheme.variance, q0, cotangent);
    return [scheme.label, scheme.variance === null ? '— (orthogonal: ×2 exactly, then ReLU)' : sci(scheme.variance, 3), fixed(prediction.factor, 4), sci(prediction.finalSecondMoment), sci(measured[20].q), sci(prediction.inputGradientRms), sci(measured[0].g)];
  });
  return <NeuralTable caption="Prediction q₂₀ = q₀ (64 s²/2)²⁰ against the seed-1 measurements (q₀ = 0.970)" headers={['Initialization', 'Weight variance s²', 'Per-layer factor 64 s²/2', 'Predicted q₂₀', 'Measured q₂₀', 'Predicted input-gradient RMS', 'Measured input-gradient RMS']} rows={rows} />;
}

/* ---------- Fan-in and fan-out on a layer whose two counts differ ---------- */
export function FanShapeFigure() {
  const inputs = [30, 70, 110, 150, 190, 230], outputs = [70, 130, 190];
  return <figure className="init-fan" id="fan-in-fan-out">
    <svg viewBox="0 0 380 270" role="img" aria-label="A layer with six inputs and three outputs. Six amber lines run into the middle output: its fan-in, n = 6, one row of the 3 by 6 matrix W. Three dashed orange lines leave the third input: its fan-out, m = 3, one column of W.">
      {inputs.map((y1, i) => outputs.map((y2, j) => <line key={`${i}-${j}`} x1="66" y1={y1} x2="276" y2={y2} className={j === 1 ? 'init-edge init-edge--lit' : 'init-edge'} />))}
      {outputs.map((y2, j) => <line key={`out-${j}`} x1="66" y1={inputs[2]} x2="276" y2={y2} className="init-edge init-edge--back" />)}
      {inputs.map((y, i) => <g key={i} className={`init-node init-node--input${i === 2 ? ' init-node--traced' : ''}`}><circle cx="46" cy={y} r="17" /><text x="46" y={y + 5} textAnchor="middle">x{'₁₂₃₄₅₆'[i]}</text></g>)}
      {outputs.map((y, j) => <g key={j} className={`init-node init-node--output${j === 1 ? ' init-node--traced' : ''}`}><circle cx="296" cy={y} r="19" /><text x="296" y={y + 5} textAnchor="middle">h{sub[j]}</text></g>)}
      <text className="init-fan__label init-fan__label--in" x="300" y="226" textAnchor="middle">fan-in n = 6</text><text className="init-axis-label" x="300" y="244" textAnchor="middle">row 2 of W (3 × 6)</text>
      <text className="init-fan__label init-fan__label--out" x="8" y="262">fan-out of x₃: m = 3 (one column)</text>
    </svg>
  </figure>;
}

/* ---------- One matrix, two directional gains ---------- */
export function EllipseFigure() {
  const big = Math.sqrt(1.9), small = Math.sqrt(0.1), s = 62;
  const panel = (cx, rx, ry, labelX, labelY, title) => <g>
    <line className="init-axis" x1={cx - 100} x2={cx + 100} y1="120" y2="120" /><line className="init-axis" x1={cx} x2={cx} y1="30" y2="210" />
    <ellipse cx={cx} cy="120" rx={rx * s} ry={ry * s} className={rx === 1 ? 'init-ellipse--input' : 'init-ellipse--output'} />
    <line className="init-ellipse__radius" x1={cx} y1="120" x2={cx + rx * s} y2="120" /><line className="init-ellipse__radius" x1={cx} y1="120" x2={cx} y2={120 - ry * s} />
    <text className="init-ellipse__value" x={cx + rx * s / 2} y="112" textAnchor="middle">{labelX}</text>
    <text className="init-ellipse__value" x={cx + 8} y={rx === 1 ? 120 - ry * s / 2 + 4 : 120 - ry * s - 8}>{labelY}</text>
    <text className="init-layer__heading" x={cx} y="232" textAnchor="middle">{title}</text>
  </g>;
  return <figure className="init-ellipse" id="circle-to-ellipse">
    <svg viewBox="0 0 460 244" role="img" aria-label={`Left: a circle of radius 1, every direction of a small input change. Right: after the matrix M, an ellipse with horizontal radius ${fixed(big)} and vertical radius ${fixed(small)}. Both panels use the same scale.`}>
      {panel(110, 1, 1, 'radius 1', '1', 'before: unit circle')}
      <text className="init-ellipse__arrow" x="220" y="126" textAnchor="middle">× M →</text>
      {panel(330, big, small, fixed(big), fixed(small), 'after M')}
    </svg>
  </figure>;
}

/* ---------- ReLU's Jacobian can block a whole direction ---------- */
export function ReluJacobianFigure() {
  const s = 46;
  return <figure className="init-jacobian" id="relu-jacobian">
    <svg viewBox="0 0 440 230" role="img" aria-label="Left: a small circle of input changes around the point x = (−1, 1). Right: after f(x) = ReLU(√2 x), every horizontal change maps to zero, so the circle collapses to a vertical segment stretched by √2.">
      <line className="init-axis" x1="20" x2="200" y1="115" y2="115" /><line className="init-axis" x1="110" x2="110" y1="25" y2="205" />
      <circle className="init-ellipse--input" cx="110" cy="115" r={s} />
      <text className="init-ellipse__value" x="110" y="222" textAnchor="middle">changes around x = (−1, 1)</text>
      <text className="init-ellipse__arrow" x="220" y="120" textAnchor="middle">J<tspan baseline-shift="sub" fontSize="11">f</tspan> →</text>
      <line className="init-axis" x1="240" x2="420" y1="115" y2="115" /><line className="init-axis" x1="330" x2="330" y1="25" y2="205" />
      <line className="init-jacobian__segment" x1="330" x2="330" y1={115 - s * Math.SQRT2} y2={115 + s * Math.SQRT2} />
      <text className="init-ellipse__value" x="338" y={115 - s * Math.SQRT2 + 12}>× √2</text>
      <text className="init-jacobian__blocked" x="336" y="138">horizontal → 0</text>
      <text className="init-ellipse__value" x="330" y="222" textAnchor="middle">after: one direction blocked</text>
    </svg>
  </figure>;
}

/* ---------- Constructing an orthogonal draw ---------- */
export function OrthogonalStepsFigure() {
  const steps = [['draw', 'Gaussian matrix', 'tall: max(m, n) × min(m, n)'], ['qr', 'reduced QR', 'Q has orthonormal columns'], ['signs', 'fix signs', 'multiply column k by sign(Rₖₖ)'], ['gain', 'scale by gain g', 'transpose if the layer is wide']];
  return <figure className="init-chain init-chain--steps" id="orthogonal-construction">
    <ol aria-label="Four steps that build an orthogonal weight matrix">{steps.map(([key, name, detail]) => <li key={key} data-kind="layer"><strong>{name}</strong><span>{detail}</span></li>)}</ol>
  </figure>;
}

/* ---------- Symmetry: a drawn two-unit network ---------- */
export function SymmetryNetworkDiagram({ weights, outgoing, features, output, hiddenGradient, headGradient }) {
  const units = [62, 158];
  return <svg className="init-symmetry" viewBox="0 30 360 200" role="img" aria-label={`Input 1 feeds two tanh units with incoming weights ${fixed(weights[0])} and ${fixed(weights[1])}; their outputs ${fixed(features[0])} and ${fixed(features[1])} feed the output with weights ${fixed(outgoing[0])} and ${fixed(outgoing[1])}. Output ${fixed(output)}.`}>
    {units.map((y, i) => <g key={i}><line x1="60" y1="110" x2="150" y2={y} className="init-edge init-edge--lit" /><line x1="202" y1={y} x2="288" y2="110" className="init-edge init-edge--lit" />
      <text className="init-weight-label" x="98" y={y < 110 ? 68 : 162} textAnchor="middle">w{'₁₂'[i]} = {fixed(weights[i])}</text>
      <text className="init-weight-label" x="252" y={y < 110 ? 68 : 162} textAnchor="middle">v{'₁₂'[i]} = {fixed(outgoing[i])}</text>
      {hiddenGradient && <text className="init-gradient-label" x="98" y={y < 110 ? 50 : 180} textAnchor="middle">∂L/∂w{'₁₂'[i]} = {fixed(hiddenGradient[i], 4)}</text>}
      {headGradient && <text className="init-gradient-label" x="252" y={y < 110 ? 50 : 180} textAnchor="middle">∂L/∂v{'₁₂'[i]} = {fixed(headGradient[i], 4)}</text>}</g>)}
    <g className="init-node init-node--input"><circle cx="38" cy="110" r="22" /><text x="38" y="106" textAnchor="middle">x</text><text className="init-node__value" x="38" y="122" textAnchor="middle">1</text></g>
    {units.map((y, i) => <g key={i} className="init-node init-node--output"><circle cx="176" cy={y} r="26" /><text x="176" y={y - 3} textAnchor="middle">tanh</text><text className="init-node__value" x="176" y={y + 13} textAnchor="middle">{fixed(features[i])}</text></g>)}
    <g className="init-node init-node--output"><circle cx="312" cy="110" r="24" /><text x="312" y="106" textAnchor="middle">out</text><text className="init-node__value" x="312" y="122" textAnchor="middle">{fixed(output)}</text></g>
    <text className="init-layer__heading" x="38" y="212" textAnchor="middle">input</text><text className="init-layer__heading" x="176" y="212" textAnchor="middle">two hidden units</text><text className="init-layer__heading" x="312" y="212" textAnchor="middle">output</text>
  </svg>;
}

/* ---------- The digit model: which weights the experiment changes ---------- */
export function DigitArchitectureStrip() {
  const stages = [['data', 'input', '64 pixels'], ['varied', 'hidden 1', '32 × 64 W, ReLU'], ['varied', 'hidden 2', '32 × 32 W, ReLU'], ['varied', 'hidden 3', '32 × 32 W, ReLU'], ['varied', 'hidden 4', '32 × 32 W, ReLU'], ['fixed', 'head', '10 × 32 W → 10 logits']];
  return <figure className="init-chain" id="digit-model">
    <div className="init-digits" aria-label="Three of the real handwritten digit images used as inputs">{records.specimens.map(sample => <div key={sample.id} className="init-digit"><div className="neural-pixels" role="img" aria-label={`Handwritten digit ${sample.digit}, source row ${sample.id}`}>{sample.pixels.map((pixel, i) => <span key={i} style={{ '--pixel': `rgb(${255 * pixel / 16} ${255 * pixel / 16} ${255 * pixel / 16})` }} />)}</div><span>digit {sample.digit}</span></div>)}</div>
    <ol aria-label="Digit model layers">{stages.map(([kind, name, detail]) => <li key={name} data-kind={kind}><strong>{name}</strong><span>{detail}</span></li>)}</ol>
    <figcaption>Amber: the four hidden weight matrices, the only weights the six initializations change. The head starts from the same Xavier draw in every run of a seed, and every bias starts at zero.</figcaption>
  </figure>;
}

/* ---------- μP: the same three matrices at a chosen width ---------- */
export function WidthShapesFigure() {
  const [width, setWidth] = useState(128);
  const shapes = widthShapes(width), scale = 150 / 256, slots = [18, 100, 292];
  // Fixed units per pixel (the width stays 470), so sizes remain comparable; only empty space above is trimmed.
  const tallest = Math.max(...shapes.map(shape => Math.max(6, shape.rows * scale))), top = 170 - tallest - 12;
  return <FlowLab id="width-shapes" label="The three matrices of the width experiment, drawn to scale">
    <svg className="init-shapes" viewBox={`0 ${top} 470 ${232 - top}`} role="img" aria-label={`Input matrix ${width} by 64, hidden matrix ${width} by ${width}, readout matrix 10 by ${width}, drawn to scale. Each output sums along the horizontal, input axis: 64 fixed terms for the input matrix, ${width} growing terms for the hidden and readout matrices.`}>
      {shapes.map((shape, k) => { const w = shape.columns * scale, h = Math.max(6, shape.rows * scale), x = slots[k]; const summedGrows = shape.columns !== 64; return <g key={shape.name}>
        <rect x={x} y={170 - h} width={w} height={h} className="init-shapes__matrix" />
        <line x1={x} x2={x + w} y1={178} y2={178} className={summedGrows ? 'init-shapes__changing' : 'init-shapes__fixed'} />
        <text x={x + w + 6} y={183} className="init-shapes__sum">Σ</text>
        <line x1={x - 7} x2={x - 7} y1={170 - h} y2={170} className={shape.rows === 10 ? 'init-shapes__fixed' : 'init-shapes__changing'} />
        <text x={x} y={204} className="init-shapes__name">{shape.short}</text>
        <text x={x} y={222} className="init-shapes__dims">{shape.rows} × {shape.columns}</text>
      </g>; })}
    </svg>
    <FlowControls><FlowSlider name="Hidden width n" value={width} onChange={setWidth} min={32} max={256} step={1} format={value => String(value)} /></FlowControls>
    <FlowReadout>Each output sums along its matrix's Σ edge: the input matrix sums <strong>64</strong> pixels at every width; the hidden matrix and the readout each sum <strong>{width}</strong> values, a count that grows with n.</FlowReadout>
  </FlowLab>;
}

/* ---------- μP: one Adam step on one hidden unit ---------- */
export function AdamUnitFigure() {
  const inputs = Array.from({ length: 8 }, (_, i) => 28 + i * 26);
  return <figure className="init-adam" id="adam-first-step">
    <svg viewBox="0 0 380 250" role="img" aria-label="One hidden unit with eight inputs. Four inputs are active with value 1 and four are 0. After one Adam step every active input's weight has moved by plus eta, so the unit's score changes by 4 eta; the inactive inputs contribute nothing.">
      {inputs.map((y, i) => { const active = i % 2 === 0; return <g key={i}>
        <line x1="62" y1={y} x2="262" y2="125" className={active ? 'init-edge init-edge--lit' : 'init-edge'} />
        <g className={`init-node init-node--input${active ? '' : ' init-node--off'}`}><circle cx="44" cy={y} r="12" /><text className="init-node__value" x="44" y={y + 5} textAnchor="middle">{active ? 1 : 0}</text></g>
        {active && <text className="init-weight-label" x="128" y={at(0.33, y, 125) - 4} textAnchor="middle">+η</text>}
      </g>; })}
      <g className="init-node init-node--output init-node--traced"><circle cx="286" cy="125" r="26" /><text x="286" y="121" textAnchor="middle">Δz</text><text className="init-node__value" x="286" y="137" textAnchor="middle">4η</text></g>
      <text className="init-layer__heading" x="8" y="246">inputs hᵢ: 4 on (1), 4 off (0)</text><text className="init-layer__heading" x="286" y="176" textAnchor="middle">one unit's score</text>
    </svg>
  </figure>;
}

export function AdamWidthTable() {
  const widths = [32, 64, 128, 256], rate = 0.003;
  return <NeuralTable caption="Half the inputs active (hᵢ = 1), η = 0.003: change in one unit's score after the first step" headers={['Width n', 'm = n/32', 'Standard: Δz = η·n/2', 'μP hidden: (η/m)·n/2', 'μP readout: η·(n/2)/m']} rows={widths.map(n => { const standard = firstAdamChange(n, rate, 'standard'), mu = firstAdamChange(n, rate, 'mu'); return [n, fixed(mu.multiplier, 2), fixed(standard.hiddenChange, 4), fixed(mu.hiddenChange, 4), fixed(mu.readoutChange, 4)]; })} />;
}

export function InitialLogitTable() {
  const measured = [32, 64, 128].map(n => records.widthFits.find(row => row.mode === 'mu' && row.seed === 1 && row.rate === 0.01 && row.width === n).trace.find(step => step.step === 0).coordinate_mean_abs[4]);
  return <NeuralTable caption="Measured μP mean |logit| at step 0 (seed 1), compared with the 1/√m shrinkage" headers={['Width', 'Measured', 'Relative to width 32', 'Predicted 1/√m']} rows={[32, 64, 128].map((n, i) => [n, fixed(measured[i], 4), fixed(measured[i] / measured[0], 3), fixed(1 / Math.sqrt(n / 32), 3)])} />;
}
