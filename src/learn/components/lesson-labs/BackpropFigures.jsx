import { useState } from 'react';
import { biasGradient, broadcastSensitivity, checkpointSchedule, directionalProducts } from '../../data/backprop-models.js';
import { backpropTraining } from '../../data/backprop-training.js';
import { BackpropFigure, BackpropSteps, BackpropTable, numberText as f } from './BackpropShared.jsx';
import { FlowReadout } from './LessonFlow.jsx';

// §3: a bias broadcast to three rows; backward, its three row sensitivities are summed.
export function BackpropBroadcastFigure() {
  return <BackpropFigure id="broadcast" title="A shared bias collects a column of sensitivities">
    <div className="flow-columns-2">{[0, 1].map(column => <div className="backprop-broadcast-column" key={column}>
      <div className="backprop-bias">bias b{column + 1}</div>
      <div className="backprop-fan" aria-label={`Bias ${column + 1} is added to each of three rows`}><span>↙</span><span>↓</span><span>↘</span></div>
      <div className="backprop-cells">{broadcastSensitivity.map((row, index) => <div key={index}><span>row {index + 1}</span><strong>{row[column]}</strong></div>)}</div>
      <div className="backprop-fan is-backward" aria-hidden="true"><span>↘</span><span>↓</span><span>↙</span></div>
      <div className="backprop-bias is-total">∂L/∂b{column + 1} = {broadcastSensitivity.map(row => row[column]).join(' + ')} = <strong>{biasGradient[column]}</strong></div>
    </div>)}</div>
    <figcaption>Top: forward, the single bias value is added to every row. Middle: the orange numbers are the rows' incoming sensitivities G. Bottom: backward, the three sensitivities in the bias's column are added, which returns a result with the bias's own shape (2,).</figcaption>
  </BackpropFigure>;
}

// §3: shapes through the two-layer classifier, forward (violet) and backward (orange).
export function BackpropShapeFigure() {
  const stages = [
    ['Input → hidden score', 'X[N,D] × W₁[D,H] + b₁[H] → Z₁[N,H]', 'G₁[N,H] → Xᵀ[D,N]G₁[N,H] = ∂L/∂W₁[D,H]; sum rows → ∂L/∂b₁[H].', 'The example index N is summed when collecting a shared weight or bias.'],
    ['Hidden score → activation', 'tanh(Z₁[N,H]) → A₁[N,H]', '∂L/∂A₁ ⊙ (1 − A₁²) → G₁[N,H].', 'Entry-by-entry multiplication keeps the shape N × H.'],
    ['Hidden activation → logits', 'A₁[N,H] × W₂[H,C] + b₂[C] → Z₂[N,C]', 'G₂[N,C] → A₁ᵀ[H,N]G₂[N,C] = ∂L/∂W₂[H,C]; sum rows → ∂L/∂b₂[C]; G₂[N,C]W₂ᵀ[C,H] → ∂L/∂A₁[N,H].', 'The class index C is summed when passing sensitivity back to each hidden feature.'],
    ['Logits → scalar mean loss', 'Z₂[N,C] → probabilities P[N,C] → mean cross-entropy', 'Seed 1 → G₂ = (P − onehot(y)) / N, shape [N,C].', 'The mean contributes 1/N exactly once. Labels y have shape [N].'],
  ];
  return <BackpropFigure id="shapes" title="Every backward step returns an array with the receiving object's shape">
    <div className="backprop-shape-lanes">{stages.map(([name, forward, reverse, contraction]) => <div className="backprop-shape-stage" key={name}><h4>{name}</h4><p className="is-forward"><strong>Forward ↓</strong> {forward}</p><p className="is-backward"><strong>Backward ↑</strong> {reverse}</p><p className="backprop-small">{contraction}</p></div>)}</div>
    <BackpropTable caption="Objects and the shapes of their gradients (engine storage: input × output)" headers={['Object', 'Shape', 'Gradient shape']} rows={[
      ['X', '[N,D]', '[N,D] when requested'], ['W₁', '[D,H]', '[D,H]'], ['b₁', '[H]', '[H]'], ['Z₁, A₁', '[N,H]', '[N,H]'], ['W₂', '[H,C]', '[H,C]'], ['b₂', '[C]', '[C]'], ['Z₂, P', '[N,C]', '[N,C]'], ['y (integer labels)', '[N]', 'not differentiated'], ['L (mean cross-entropy)', 'scalar', 'scalar seed 1'],
    ]} />
  </BackpropFigure>;
}

// Log-axis tick label: 1e-30 → "10⁻³⁰", 1 → "10⁰". Every digit and the sign become superscripts.
export const logTickLabel = value => `10${String(Math.round(Math.log10(value))).replace(/-/g, '⁻').replace(/\d/g, digit => '⁰¹²³⁴⁵⁶⁷⁸⁹'[digit])}`;

function TrainingChart({ rows, valueKey, maxStep, yDomain, yTicks, logarithmic, label }) {
  const transform = value => logarithmic ? Math.log10(value) : value;
  const px = value => 80 + value / maxStep * 230;
  const py = value => 215 - (transform(value) - yDomain[0]) / (yDomain[1] - yDomain[0]) * 180;
  return <svg className="backprop-svg" viewBox="0 0 338 275" role="img" aria-label={label}>
    {yTicks.map(value => <g key={value}><line x1="80" x2="310" y1={py(value)} y2={py(value)} className="bp-grid" /><text x="74" y={py(value) + 4} textAnchor="end">{logarithmic ? logTickLabel(value) : f(value)}</text></g>)}
    <line x1="80" x2="310" y1="215" y2="215" className="bp-axis" /><line x1="80" x2="80" y1="35" y2="215" className="bp-axis" />
    <polyline points={rows.map(row => `${px(row.step)},${py(row[valueKey])}`).join(' ')} className="bp-current" />
    {rows.map(row => <circle key={row.step} cx={px(row.step)} cy={py(row[valueKey])} r="4" className="bp-sample" />)}
    {[0, maxStep / 2, maxStep].map(step => <text key={step} x={px(step)} y="240" textAnchor="middle">{step}</text>)}
    <text x="195" y="266" textAnchor="middle">parameter updates</text>
  </svg>;
}

export function BackpropTrainingFigure() {
  const { xorTraining, digitTraining } = backpropTraining;
  return <BackpropFigure id="training" title="Recorded CPU runs from the downloadable teaching engine">
    <div className="backprop-training-panel"><h4>XOR: mean squared error over the 4 truth-table rows</h4><p className="backprop-small">2 → 4 → 1 tanh; seed 3; learning rate 0.1; 2,000 full-batch updates. Vertical axis: log₁₀ of the error. The final error, about 7.82 × 10⁻³⁰, is a finite-arithmetic fit to these four rows.</p>
      <TrainingChart rows={xorTraining} valueKey="mse" maxStep={2000} yDomain={[-30, 1]} yTicks={[1e-30, 1e-20, 1e-10, 1]} logarithmic label="XOR recorded mean squared errors, logarithmic axis" />
      <BackpropTable caption="XOR recorded errors and outputs, targets in order (0, 1, 1, 0)" headers={['Updates', 'MSE', 'Outputs for (00, 01, 10, 11)']} rows={xorTraining.map(row => [row.step, f(row.mse), row.outputs.flat().map(f).join(', ')])} />
    </div>
    <div className="backprop-training-panel"><h4>Digits: mean training cross-entropy over 280 images</h4><p className="backprop-small">64 → 16 → 10 tanh; seed 4; learning rate 0.2; 500 full-batch updates; stratified split seed 22; pixels divided by 16. The first training cross-entropy is 3.597477, not forced to log(10).</p>
      <TrainingChart rows={digitTraining} valueKey="trainLoss" maxStep={500} yDomain={[0, 4]} yTicks={[0, 1, 2, 3, 4]} label="Digit training cross-entropy, linear axis" />
      <h4>Digits: validation images correct out of 120</h4><TrainingChart rows={digitTraining} valueKey="validationCorrect" maxStep={500} yDomain={[0, 120]} yTicks={[0, 30, 60, 90, 120]} label="Digit validation correct count out of 120" />
      <BackpropTable caption="Digit recorded observations" headers={['Updates', 'Training cross-entropy / 280', 'Validation correct / 120']} rows={digitTraining.map(row => [row.step, f(row.trainLoss), `${row.validationCorrect} / 120`])} />
    </div>
    <figcaption>Saved float64 NumPy observations, not training in your browser. Dots are recorded samples; the segments between them are interpolation. The XOR and digit runs are separate, with different objectives.</figcaption>
  </BackpropFigure>;
}

function SignedProductBars({ labels, values, backward }) {
  return <div className="backprop-bars">{values.map((value, index) => <div className="backprop-bar-row" key={labels[index]}><span>{labels[index]} = {f(value)}</span><div className="backprop-bar-track"><span className="backprop-zero" /><span className={`backprop-bar ${backward ? '' : 'is-forward'}`} style={{ left: `${value >= 0 ? 50 : 50 + value / 4 * 50}%`, width: `${Math.abs(value) / 4 * 50}%` }} /></div></div>)}<p className="backprop-bar-scale"><span>−4</span><span>0</span><span>+4</span></p></div>;
}

// §6: a forward direction pushed through J, and an output weighting pulled back through J.
export function BackpropProductsFigure() {
  const model = directionalProducts;
  return <BackpropFigure id="products" title="Push a direction forward; pull an output weighting backward">
    <BackpropTable caption="The Jacobian J at x = (0.3, 0.7): one row per output, one column per input" headers={['Output', '∂ / ∂x₁', '∂ / ∂x₂']} rows={[['x₁x₂', '0.7', '0.3'], ['sin x₁', f(Math.cos(0.3)), '0'], ['x₂²', '0', '1.4']]} />
    <div className="flow-columns-2"><div><h4>Forward: Jv, 2 input coordinates → 3 output rates</h4><p className="backprop-small">v = (1, 2). Each row of J is dotted with v.</p><SignedProductBars labels={['f₁ rate', 'f₂ rate', 'f₃ rate']} values={model.jvp} /></div><div><h4>Backward: Jᵀu, 3 output weights → 2 input sensitivities</h4><p className="backprop-small">u = (1, −1, 2). Each column of J is dotted with u.</p><SignedProductBars labels={['x₁ sensitivity', 'x₂ sensitivity']} values={model.vjp} backward /></div></div>
    <BackpropTable caption="The arithmetic behind each bar" headers={['Product entry', 'Calculation', 'Result']} rows={[
      ['(Jv)₁', '.7 × 1 + .3 × 2', f(model.jvp[0])], ['(Jv)₂', 'cos(.3) × 1 + 0 × 2', f(model.jvp[1])], ['(Jv)₃', '0 × 1 + 1.4 × 2', f(model.jvp[2])], ['(Jᵀu)₁', '.7 × 1 − cos(.3) + 0 × 2', f(model.vjp[0])], ['(Jᵀu)₂', '.3 × 1 + 0 × (−1) + 1.4 × 2', f(model.vjp[1])],
    ]} />
    <figcaption>Violet bars are forward rates; orange bars are backward sensitivities. Both use the same −4 to +4 scale. Matching scalar products: uᵀ(Jv) = {model.left.toPrecision(16)} and (Jᵀu)ᵀv = {model.right.toPrecision(16)}.</figcaption>
  </BackpropFigure>;
}

// §6: checkpointing an 8-operation chain, stepped through its recompute and reverse stages.
export function BackpropCheckpointFigure() {
  const [stage, setStage] = useState(0);
  const state = checkpointSchedule[stage];
  return <BackpropFigure id="checkpoint" title="Eight operations: keep a few boundaries, recompute the rest when needed">
    <ol className="backprop-checkpoint-chain">{Array.from({ length: 9 }, (_, i) => <li key={i} className={`${state.boundaries.includes(i) ? 'is-saved' : state.regenerated.includes(i) ? 'is-regenerated' : 'is-absent'} ${state.reverse.includes(i) ? 'is-reversing' : ''}`}><strong>{i}</strong><span>{state.boundaries.includes(i) ? 'saved' : state.regenerated.includes(i) ? 'recomputed' : 'not stored'}</span></li>)}</ol>
    <BackpropSteps index={stage} setIndex={setStage} count={checkpointSchedule.length} name="Checkpoint schedule" />
    <FlowReadout><strong>{state.title}.</strong> {state.note} Activation states currently held: <strong>{new Set([...state.boundaries, ...state.regenerated]).size}</strong>.{state.reverse.length > 0 && ` The orange outlines mark the pullbacks just applied, in the order ${state.reverse.join(' → ')}.`}</FlowReadout>
    <figcaption>State 0 is the input and state n is the output of operation n; operation n's pullback needs states n − 1 and n. Amber outline: saved boundary. Violet hatching: recomputed from the boundary before it. Dashed: not stored. This is an idealized chain of equal-size states, not a memory measurement.</figcaption>
  </BackpropFigure>;
}
