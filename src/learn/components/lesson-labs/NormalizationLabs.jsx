import { useState } from 'react';
import { NeuralTable, NeuralPlot, neuralColors } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { normalizationMean as mean, normalizeVector, tensorGroup, normalizeTensor, batchNormalizationStep, normalizationGradient } from '../../data/normalization-models.js';
import measurements from '../../data/normalization-measurements.js';
import { BatchNormModeDiagram } from './NormalizationBuildupFigures.jsx';
import './neural-lesson-neutral.css';
import './normalization-labs.css';

// Each lab answers one question stated in the prose just before it, with only the controls that question needs.
const fmt = (value, digits = 4) => flowNumber(value, digits);
const methods = [['batch', 'BatchNorm'], ['layer', 'LayerNorm'], ['group', 'GroupNorm, 2 groups'], ['instance', 'InstanceNorm']];
const methodName = key => methods.find(([k]) => k === key)[1];
const cellName = i => `example ${Math.floor(i / 8)}, channel ${Math.floor(i % 8 / 2)}, position ${i % 2}`;

// Question: which cells share one cell's mean and spread, and can another example change example 0?
export function NormalizationMembershipLab() {
  const original = Array.from({ length: 16 }, (_, i) => i + 1);
  const [method, setMethod] = useState('batch'), [selected, setSelected] = useState(0), [changed, setChanged] = useState(9);
  const values = original.map((value, i) => i === 8 ? changed : value);
  const group = tensorGroup(selected, method, 2), statistics = normalizeVector(group.map(i => values[i]));
  const output = normalizeTensor(values, method, 2), baseline = normalizeTensor(original, method, 2);
  const delta = Math.max(...output.slice(0, 8).map((value, i) => Math.abs(value - baseline[i])));
  return <FlowLab id="normalization-membership" label="Which cells share one statistics group">
    <div className="normalization-tensor" role="group" aria-label="The 2 × 4 × 1 × 2 tensor; select a cell to show its group">
      {[0, 1].map(n => <div className="normalization-tensor-example" key={n}>
        <span className="normalization-grouping-example">example {n}</span>
        {[0, 1, 2, 3].map(c => <div className="normalization-tensor-row" key={c}>
          <span className="normalization-tensor-channel">ch {c}</span>
          {[0, 1].map(position => {
            const i = n * 8 + c * 2 + position, member = group.includes(i);
            return <button type="button" key={position} aria-pressed={selected === i} aria-label={`${cellName(i)}, value ${values[i]}${member ? ', in the selected group' : ''}`}
              className={`normalization-tensor-cell${member ? ' is-member' : ''}${selected === i ? ' is-selected' : ''}${i === 8 && changed !== 9 ? ' is-changed' : ''}`} onClick={() => setSelected(i)}>
              <strong>{values[i]}</strong><small>→ {fmt(output[i], 3)}</small>
            </button>;
          })}
        </div>)}
      </div>)}
    </div>
    <FlowControls>
      <FlowChoice label="Statistics rule" options={methods} value={method} onChange={setMethod} />
      <FlowChoice label="Example 1, channel 0, first value" options={[[9, '9 (original)'], [19, '19']]} value={changed} onChange={setChanged} />
    </FlowControls>
    <FlowReadout>Under <strong>{methodName(method)}</strong>, the selected cell ({cellName(selected)}) belongs to a group of {group.length} values: [{group.map(i => values[i]).join(', ')}], mean <strong>{fmt(statistics.center)}</strong>, variance <strong>{fmt(statistics.variance)}</strong>. {changed === 9 ? 'Switch the example-1 value to 19 to test whether example 0 notices.' : <>With that value at 19, the largest change in any example-0 output is <strong>{fmt(delta, 6)}</strong>{delta > 1e-12 ? ': this rule’s groups cross the example boundary.' : ': every example-0 group stays inside example 0.'}</>}</FlowReadout>
  </FlowLab>;
}

// Question: what does a common offset or a common scale do to LayerNorm and to RMSNorm?
export function NormalizationGeometryLab() {
  const [offset, setOffset] = useState(0), [scale, setScale] = useState(1);
  const base = [1, 3], x = base.map(value => scale * value + offset);
  const centered = normalizeVector(x), rms = normalizeVector(x, 1e-5, true);
  const baseCentered = normalizeVector(base), baseRms = normalizeVector(base, 1e-5, true);
  const bound = Math.max(4, ...x.map(Math.abs)) * 1.25, coordinate = value => 160 + value / bound * 115;
  const px = coordinate(x[0]), py = 320 - coordinate(x[1]), mx = coordinate(centered.center), my = 320 - coordinate(centered.center);
  const change = (now, then) => Math.max(...now.map((v, i) => Math.abs(v - then[i])));
  const list = values => `[${values.map(v => fmt(v, 3)).join(', ')}]`;
  return <FlowLab id="normalization-geometry" label="A two-feature token drawn in a plane">
    <svg className="neural-chart normalization-vector" viewBox="0 0 320 320" role="img" aria-label={`Equal-scale plane. The token ${list(x)} is a cyan line from the origin. Its mean point ${list([centered.center, centered.center])} lies on the dashed equal-features diagonal; a violet segment joins the mean point to the token.`}>
      <line x1="30" y1="160" x2="290" y2="160" stroke="#6f6f6f" /><line x1="160" y1="30" x2="160" y2="290" stroke="#6f6f6f" />
      <line x1="45" y1="275" x2="275" y2="45" stroke="#6f6f6f" strokeDasharray="4 5" />
      <text x="62" y="292" className="normalization-svg-note">equal features</text>
      <line x1="160" y1="160" x2={px} y2={py} stroke="#7dd5e9" strokeWidth="3" />
      <line x1={mx} y1={my} x2={px} y2={py} stroke="#c7a5ee" strokeWidth="3" />
      <circle cx={mx} cy={my} r="4" fill="#c7a5ee" />
      <circle cx={px} cy={py} r="4.5" fill="#7dd5e9" />
      {/* The token and its mean point sit on a line perpendicular to the diagonal; each label goes on
          the far side of its own point, away from the other point and from the cyan line. */}
      {(() => {
        // Approximate label widths in plane units; a label that would leave the plane is tucked
        // directly below (or above) its point instead, still on the side away from the other point.
        const above = x[1] >= x[0], away = above ? 1 : -1, tokenWidth = 40, meanWidth = 74;
        const tokenSide = above ? px - 10 - tokenWidth > 4 : px + 10 + tokenWidth < 316;
        const meanSide = above ? mx + 10 + meanWidth < 316 : mx - 10 - meanWidth > 4;
        const token = tokenSide
          ? { x: px - away * 10, y: py - away * 10, anchor: above ? 'end' : 'start' }
          : { x: px, y: py - away * 14, anchor: 'middle' };
        const meanLabel = meanSide
          ? { x: mx + away * 10, y: my + away * 18, anchor: above ? 'start' : 'end' }
          : { x: Math.min(316 - meanWidth / 2, Math.max(4 + meanWidth / 2, mx)), y: my + away * 30, anchor: 'middle' };
        return <>
          <text x={token.x} y={token.y} textAnchor={token.anchor} className="normalization-svg-input">token</text>
          <text x={meanLabel.x} y={meanLabel.y} textAnchor={meanLabel.anchor} className="normalization-svg-computed">mean point</text>
        </>;
      })()}
      <text x="160" y="308" textAnchor="middle" className="normalization-svg-note">feature 0 (axes ±{fmt(bound, 1)})</text>
      <text x="12" y="20" className="normalization-svg-note">feature 1, same scale</text>
    </svg>
    <FlowControls>
      <FlowSlider name="Common offset added to both features" value={offset} onChange={setOffset} min={-10} max={10} step={.5} format={v => fmt(v, 2)} />
      <FlowSlider name="Common scale" value={scale} onChange={setScale} min={-2} max={2} step={.25} format={v => fmt(v, 2)} />
    </FlowControls>
    <FlowReadout>Token <strong>{list(x)}</strong>. LayerNorm gives <strong>{list(centered.output)}</strong> (changed by {fmt(change(centered.output, baseCentered.output), 3)} from the token [1, 3]); RMSNorm gives <strong>{list(rms.output)}</strong> (changed by {fmt(change(rms.output, baseRms.output), 3)}). Violet length {fmt(Math.hypot(x[0] - centered.center, x[1] - centered.center), 3)}, cyan length {fmt(Math.hypot(x[0], x[1]), 3)}.</FlowReadout>
  </FlowLab>;
}

// Question: what does each mode read and write, and how does stored memory build up over passes?
export function BatchNormalizationStateLab() {
  const values = [1, 3, 5, 7], momentum = .1;
  const [training, setTraining] = useState(true), [buffers, setBuffers] = useState({ mean: 0, variance: 1 });
  const [passes, setPasses] = useState({ training: 0, evaluation: 0 });
  const step = batchNormalizationStep(values, buffers, momentum, training);
  const run = () => {
    if (training) setBuffers(step.next);
    setPasses({ ...passes, [training ? 'training' : 'evaluation']: passes[training ? 'training' : 'evaluation'] + 1 });
  };
  const reset = () => { setBuffers({ mean: 0, variance: 1 }); setPasses({ training: 0, evaluation: 0 }); };
  const evalFirst = (1 - buffers.mean) / Math.sqrt(buffers.variance + 1e-5);
  return <FlowLab id="normalization-state" label="BatchNorm's two modes on one batch">
    <BatchNormModeDiagram values={values} batchMean={step.batchMean} batchVariance={step.populationVariance} correctedVariance={step.correctedVariance} buffers={buffers} momentum={momentum} gamma={1} beta={0} training={training} />
    <FlowControls>
      <FlowChoice label="Mode" options={[[true, 'Training'], [false, 'Evaluation']]} value={training} onChange={setTraining} />
      <button type="button" onClick={run}>Run one forward pass</button>
      <button type="button" onClick={reset}>Reset buffers</button>
    </FlowControls>
    <FlowReadout>Passes run: <strong>{passes.training}</strong> in training mode, each writing the buffers, and <strong>{passes.evaluation}</strong> in evaluation mode, which wrote nothing. Stored now: running mean <strong>{fmt(buffers.mean)}</strong>, running variance <strong>{fmt(buffers.variance)}</strong>. Evaluation maps the input 1 to <strong>{fmt(evalFirst)}</strong>; training always maps it to <strong>−1.3416</strong>.</FlowReadout>
  </FlowLab>;
}

// Question: how do the direct, mean and spread routes trade off as the two inputs move apart or together?
export function NormalizationGradientLab() {
  const [second, setSecond] = useState(3);
  const x = [1, second], gamma0 = [1, 2], rate = .1;
  const initial = normalizationGradient(x, gamma0, [0, 0], [0, 1]);
  const gamma = gamma0.map((value, i) => value - rate * initial.scaleGradient[i]), beta = initial.shiftGradient.map(value => -rate * value);
  const after = normalizationGradient(x, gamma, beta, [0, 1]);
  const upstream = initial.shiftGradient.map((value, i) => value * gamma0[i]);
  const average = (upstream[0] + upstream[1]) / 2, centered = normalizeVector(x);
  const coupling = (upstream[0] * centered.output[0] + upstream[1] * centered.output[1]) / 2;
  return <FlowLab id="normalization-gradients" label="Three routes back to each input of a two-feature token">
    <div className="normalization-graph-scroll" role="region" tabIndex={0} aria-label="Normalization dependency graph; scroll horizontally on narrow screens">
      <svg className="normalization-dependency-graph" viewBox="0 0 380 455" role="img" aria-label="Input feeds the shared mean and the numerator. Centered differences feed both the numerator and variance. Variance sets the denominator. Numerator and denominator join at normalized output, then affine output and loss. Reverse contributions add at each shared input.">
        <g fill="none" stroke="#a39c8c" strokeWidth="2"><path d="M190 45 V65 H65 V95 M190 45 V165 M65 125 V180 H130 M250 195 H300 V245 M190 215 V300 M300 275 V325 H250 M190 345 V385" /><path d="M60 87 L65 95 L70 87 M185 157 L190 165 L195 157 M122 175 L130 180 L122 185 M295 237 L300 245 L305 237 M185 292 L190 300 L195 292 M258 320 L250 325 L258 330 M185 377 L190 385 L195 377" /></g>
        <g fill="#161616" stroke="#6b6b6b"><rect x="130" y="10" width="120" height="35" rx="3" stroke="#7dd5e9" /><rect x="10" y="95" width="110" height="30" rx="3" stroke="#c7a5ee" /><rect x="130" y="165" width="120" height="50" rx="3" stroke="#c7a5ee" /><rect x="245" y="245" width="125" height="30" rx="3" stroke="#c7a5ee" /><rect x="130" y="300" width="120" height="45" rx="3" stroke="#c7a5ee" /><rect x="75" y="385" width="230" height="35" rx="3" /></g>
        <g fill="#e7e7e7" fontSize="14" textAnchor="middle"><text x="190" y="33">Input x</text><text x="65" y="115">Mean μ</text><text x="190" y="187">Differences</text><text x="190" y="206">d = x − μ</text><text x="307" y="265">v = mean(d²)</text><text x="190" y="319">x̂ = d / s</text><text x="190" y="337">s = √(v + ε)</text><text x="190" y="408">γx̂ + β → squared-error loss</text><text x="251" y="82">direct route</text><text x="340" y="212">spread</text><text x="340" y="230">route</text><text x="30" y="148">mean</text><text x="30" y="164">route</text><text x="190" y="449" fill="#f0a57f">Backward: the three routes add at each input</text></g>
      </svg>
    </div>
    <FlowControls>
      <FlowSlider name="Second input x₁ (first input fixed at 1)" value={second} onChange={setSecond} min={-5} max={5} step={.25} format={v => fmt(v, 2)} />
    </FlowControls>
    <NeuralTable caption="Each route's contribution to the input derivatives, before any update" headers={['Input', 'Direct uᵢ / s', 'Mean −mean(u) / s', 'Spread −x̂ᵢ mean(u x̂) / s', 'Sum']} rows={x.map((_, i) => [i, fmt(upstream[i] / centered.denominator, 6), fmt(-average / centered.denominator, 6), fmt(-centered.output[i] * coupling / centered.denominator, 6), fmt(initial.inputGradient[i], 6)])} />
    <FlowReadout>Inputs <strong>[1, {fmt(second, 2)}]</strong>: input derivatives <strong>[{initial.inputGradient.map(v => fmt(v, 6)).join(', ')}]</strong>. One step of size 0.1 on γ and β alone, with the inputs held fixed, takes the loss from <strong>{fmt(initial.loss, 6)}</strong> to <strong>{fmt(after.loss, 6)}</strong>.</FlowReadout>
  </FlowLab>;
}

// Question: what did the twelve recorded training runs actually measure?
export function NormalizationMeasuredLab() {
  const [metric, setMetric] = useState('validation_loss'), [seed, setSeed] = useState(1);
  const runs = measurements.records.filter(run => run.seed === seed), isCount = metric === 'validation_correct';
  const maximum = isCount ? 120 : Math.max(...runs.flatMap(run => run.history.map(row => row[metric]))) * 1.08;
  const label = { validation_loss: 'Validation cross-entropy', train_evaluation_loss: 'Training-set cross-entropy, evaluation mode', validation_correct: 'Correct validation images / 120' }[metric];
  return <FlowLab id="normalization-measured" label="Recorded training runs" note="Recorded CPU runs replayed from saved values; nothing is trained in the browser. Lines join recorded epochs 0, 1, 5, 20 and 50 only.">
    <NeuralPlot title={`${label}, seed ${seed}`} xLabel="recorded epoch" yLabel={isCount ? 'correct / 120' : 'cross-entropy, nats'} xDomain={[0, 50]} yDomain={[0, maximum]} series={runs.map((run, i) => ({
      label: run.normalization, color: neuralColors[i], values: run.history.map(row => [row.epoch, row[metric]]),
    }))} points={runs.flatMap((run, i) => run.history.map(row => ({ x: row.epoch, y: row[metric], color: neuralColors[i], label: `${run.normalization}; epoch ${row.epoch}: ${fmt(row[metric], 6)}` })))} />
    <FlowControls>
      <FlowChoice label="Measured quantity" options={[['validation_loss', 'Validation loss'], ['train_evaluation_loss', 'Training loss'], ['validation_correct', 'Correct /120']]} value={metric} onChange={setMetric} />
      <FlowChoice label="Seed" options={[[1, '1'], [2, '2'], [3, '3']]} value={seed} onChange={setSeed} />
    </FlowControls>
    <NeuralTable caption={`Exact recorded values, seed ${seed}`} headers={['Normalization', 'Epoch 0', 'Epoch 1', 'Epoch 5', 'Epoch 20', 'Epoch 50']} rows={runs.map(run => [run.normalization, ...run.history.map(row => fmt(row[metric], 6))])} />
  </FlowLab>;
}

function ResidualPathFigure({ pre, multiplier, output }) {
  const normPosition = pre ? 105 : 270;
  return <figure className="normalization-residual"><figcaption>{pre ? 'Pre-norm: x + F(LN(x))' : 'Post-norm: LN(x + F(x))'}</figcaption><svg className="normalization-residual-graph" viewBox="0 0 300 328" role="img" aria-label={pre ? 'Input forks: one path runs through normalization and the learned branch, the identity path skips both. They add at the output.' : 'Input forks: the learned branch and identity path add, then normalization transforms their sum.'}>
    <g stroke="#a39c8c" strokeWidth="2" fill="none"><path d={pre ? 'M150 38 V55 H60 V205 H150 V214 M150 55 H245 V230 H166 M150 246 V280' : 'M150 38 V55 H60 V205 H150 V214 M150 55 H245 V230 H166 M150 246 V257 M150 286 V300'} /><path d={pre ? 'M55 85 L60 93 L65 85 M240 210 L245 218 L250 210 M174 225 L166 230 L174 235 M145 206 L150 214 L155 206 M145 272 L150 280 L155 272' : 'M55 85 L60 93 L65 85 M240 210 L245 218 L250 210 M174 225 L166 230 L174 235 M145 206 L150 214 L155 206 M145 250 L150 258 L155 250 M145 292 L150 300 L155 292'} /></g>
    <g fill="#161616" stroke="#6b6b6b"><rect x="100" y="10" width="100" height="28" rx="3" stroke="#7dd5e9" /><rect x="12" y="145" width="100" height="32" rx="3" stroke="#e4b752" /><rect x={pre ? 12 : 100} y={normPosition - 12} width="100" height="28" rx="3" /><circle cx="150" cy="230" r="15" /></g>
    <g fill="#e7e7e7" fontSize="14" textAnchor="middle"><text x="150" y="30">Input [1, 3]</text><text x="62" y="166">F(u) = {fmt(multiplier, 2)}u</text><text x={pre ? 62 : 150} y={normPosition + 7}>LayerNorm</text><text x="150" y="235">+</text><text x="190" y="110">identity</text><text x="190" y="129">x unchanged</text><text x="150" y={pre ? 302 : 320}>Output</text></g>
  </svg><p className="normalization-panel-note">Output [{output.map(v => fmt(v, 4)).join(', ')}]. {pre ? 'The identity path bypasses normalization.' : 'The final normalization also transforms the identity contribution.'}</p></figure>;
}

// Question: does moving the normalization inside or outside the residual addition change the function?
export function NormalizationPlacementLab() {
  const [branch, setBranch] = useState(0), x = [1, 3], normalized = normalizeVector(x).output;
  const pre = x.map((value, i) => value + branch * normalized[i]), post = normalizeVector(x.map(value => value + branch * value)).output;
  return <FlowLab id="normalization-placement" label="Pre-norm and post-norm on the same block">
    <div className="flow-columns-2"><ResidualPathFigure pre multiplier={branch} output={pre} /><ResidualPathFigure pre={false} multiplier={branch} output={post} /></div>
    <FlowControls><FlowSlider name="Learned branch F(u) = a × u, with a =" value={branch} onChange={setBranch} min={-1} max={1} step={.1} format={v => fmt(v, 2)} /></FlowControls>
    <FlowReadout>With a = <strong>{fmt(branch, 2)}</strong>, pre-norm returns <strong>[{pre.map(v => fmt(v, 4)).join(', ')}]</strong> and post-norm returns <strong>[{post.map(v => fmt(v, 4)).join(', ')}]</strong>.{Math.abs(branch) < 1e-12 ? ' Even with the branch switched off, the two placements differ.' : ''}</FlowReadout>
  </FlowLab>;
}
