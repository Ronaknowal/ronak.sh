import { useState } from 'react';
import { perceptronData } from '../../data/perceptron-data.js';
import { activation, activationNames, sigmoid, triangle } from '../../data/perceptron-models.js';
import { activationColors, Choice, CurvePlot, fmt, Frame, PerceptronTable } from './PerceptronShared.jsx';

const gray = value => `rgb(${value / 16 * 255},${value / 16 * 255},${value / 16 * 255})`;

// §7: SiLU and GELU dip below zero and then rise; left of each lowest point the slope is negative.
export const negativeSlopeMinima = { silu: { z: -1.2785, value: -0.2785 }, gelu: { z: -0.7518, value: -0.1700 } };
export function NegativeSlopeFigure() {
  const zs = Array.from({ length: 121 }, (_, i) => -4 + i * .05);
  const curve = name => ({ data: zs.map(z => [z, activation(name, z).value]), color: activationColors[name], width: 2.2, label: activationNames[name].replace(/ \(.*\)/, ''), labelAt: activation(name, 2).value });
  const { silu, gelu } = negativeSlopeMinima;
  return <figure id="perceptron-negative-slope" data-figure="negative-slope">
    <CurvePlot curves={[curve('silu'), curve('gelu')]} xDomain={[-4, 2]} xTicks={[-4, -3, -2, -1, 0, 1, 2]} yDomain={[-1, 2]} yTicks={[-1, 0, 1, 2]}
      points={[[silu.z, silu.value], [gelu.z, gelu.value]]}
      pointLabels={[[silu.z, silu.value, `SiLU lowest, z ≈ ${fmt(silu.z, 2)}`, -4, 24, 'end'], [gelu.z, gelu.value, `GELU lowest, z ≈ ${fmt(gelu.z, 2)}`, 4, 44, 'start']]}
      yLabel="Output" />
    <figcaption>Both curves dip below zero and then rise. Left of each marked lowest point, raising the score lowers the output: the slope there is negative. At z = −2, SiLU's slope is −0.0908 and GELU's is −0.0852.</figcaption>
  </figure>;
}

// §5: one observed image and the 64 numbers a dense layer receives.
export function DigitFigure() {
  const [label, setLabel] = useState(7);
  const examples = Array.from({ length: 10 }, (_, digit) => perceptronData.digits.find(row => row.digit === digit)), selected = examples[label];
  return <Frame id="perceptron-digits-figure" title="An observed image becomes 64 input numbers">
    <div className="flow-columns-2">
      <div><p className="grid-label">Digit {selected.digit} (source ID {selected.sourceId}): 8 × 8 counts</p>
        <div className="perceptron-digit" role="img" aria-label={`Digit ${selected.digit}, source ID ${selected.sourceId}. Pixel counts row by row: ${selected.pixels.join(', ')}.`}>{selected.pixels.map((value, i) => <span key={i} style={{ background: gray(value) }} />)}</div>
        <p className="perceptron-note">Black = 0, white = 16 (the count of inked cells in a 4 × 4 block).</p></div>
      <div><p className="grid-label">The same image as 64 inputs x₀ … x₆₃</p>
        <div className="perceptron-pixels" aria-label="Flattened row-major vector">{selected.pixels.map((value, i) => <span className={i < 8 ? 'first-row' : ''} key={i}><small>x{i}</small>{value}</span>)}</div>
        <p className="perceptron-note">Outlined: image row 0 becomes inputs x₀–x₇; each later row follows. A dense layer sees only this list, not which pixels are neighbours.</p></div>
    </div>
    <div className="flow-controls"><div className="flow-choice digit-picker" role="group" aria-label="Choose a digit"><span className="flow-choice-label">Digit</span>{examples.map(row => <button key={row.digit} type="button" aria-pressed={row.digit === label} onClick={() => setLabel(row.digit)}><span className="perceptron-thumbnail" aria-hidden="true">{row.pixels.map((value, i) => <span key={i} style={{ background: gray(value) }} />)}</span>{row.digit}</button>)}</div></div>
    <p className="perceptron-note">E. Alpaydin and C. Kaynak, UCI Optical Recognition of Handwritten Digits, CC BY 4.0; each button shows the first retained image of that digit. <a href="/learn-assets/perceptrons/digits-400.csv" download>Download the 400-image CSV</a> · <a href="/learn-assets/perceptrons/data-provenance.md">Selection, attribution and provenance</a>.</p>
  </Frame>;
}

// §5: recorded results for one seed, and which validation images each network got wrong.
export function DigitComparisonFigure() {
  const [seed, setSeed] = useState(1), [compare, setCompare] = useState('relu');
  const runs = perceptronData.runs.filter(row => row.seed === seed),
    reference = runs.find(row => row.activation === 'sigmoid'),
    candidate = runs.find(row => row.activation === compare),
    byId = new Map(perceptronData.digits.map(row => [row.sourceId, row])),
    paired = perceptronData.splits.validationSourceIds.map((sourceId, i) => ({ sourceId, actual: byId.get(sourceId).digit, a: reference.validationPredictions[i], b: candidate.validationPredictions[i] }))
      .filter(row => row.a !== row.actual || row.b !== row.actual);
  const lo = 112, hi = 120;
  return <Frame id="perceptron-comparison-figure" title="Recorded training losses and validation counts for one seed" kind="Measured CPU results, recorded and not retrained in the browser: 400 images, 280 train / 120 validation, 64 → 32 → 10, Adam 0.01, 200 full-batch updates, float32, one CPU thread. The predictions listed in the table are retained class labels from those runs, not new inference.">
    <CurvePlot title={`Training cross-entropy, seed ${seed} (log scale)`} curves={runs.map((row, i) => ({ data: row.trace.map(point => [point.step, point.trainLoss]), color: activationColors[row.activation], dash: row.activation === 'leaky_relu' ? '5 3' : row.activation === 'gelu' ? '2 3' : undefined, label: activationNames[row.activation].replace(/ \(.*\)/, '') }))} xDomain={[0, 200]} xTicks={[0, 50, 100, 150, 200]} yDomain={[.001, 3]} yTicks={[.001, .01, .1, 1, 3]} log yLabel="Mean cross-entropy" xLabel="Update number" />
    <p className="perceptron-note">Each line joins the six recorded values at updates 0, 1, 10, 50, 100 and 200; losses between them were not recorded.</p>
    <p className="grid-label">Validation images correct, out of 120 (axis starts at {lo}; one image = 0.833 percentage points)</p>
    <div className="perceptron-count-axis" aria-hidden="true"><span /><div>{[lo, 114, 116, 118, hi].map(t => <span key={t}>{t}</span>)}</div><span /></div>
    {runs.map(row => <div className="perceptron-counts" key={row.activation}><span>{activationNames[row.activation].replace(/ \(.*\)/, '')}</span><div className="perceptron-count-track" role="img" aria-label={`${activationNames[row.activation]}: ${row.correct} of 120 correct`}><span style={{ left: `${(row.correct - lo) / (hi - lo) * 100}%` }} /></div><strong>{row.correct}</strong></div>)}
    <div className="flow-controls">
      <Choice label="Seed" options={[[1, '1'], [2, '2'], [3, '3']]} value={seed} onChange={setSeed} />
      <Choice label="Compare sigmoid with" options={runs.filter(row => row.activation !== 'sigmoid').map(row => [row.activation, activationNames[row.activation].replace(/ \(.*\)/, '')])} value={compare} onChange={setCompare} />
    </div>
    <PerceptronTable caption={`Validation images that sigmoid or ${activationNames[compare]} got wrong, seed ${seed}`} headers={['Source ID', 'Actual digit', 'Sigmoid predicted', `${activationNames[compare].replace(/ \(.*\)/, '')} predicted`]} rows={paired.map(row => [row.sourceId, row.actual, row.a, row.b])} />
  </Frame>;
}

// §7: SwiGLU as a structure: two learned projections of the same input, a gate, a product.
export function SwiGluFigure() {
  const gates = [1, -1], values = [2, 3], gated = gates.map(g => g * sigmoid(g)), product = gated.map((g, i) => g * values[i]);
  const vec = v => `(${v.map(x => fmt(x, 4)).join(', ')})`;
  return <figure id="perceptron-swiglu-figure" data-figure="swiglu" className="swiglu-diagram">
    <div className="swiglu-input"><span className="swiglu-value is-input">x · width d</span></div>
    <div className="swiglu-branches">
      <div className="swiglu-fork" aria-hidden="true" />
      <div className="swiglu-branch"><span className="swiglu-arrow">↓</span><span className="swiglu-op">× W<sub>g</sub> <small>learned</small></span><span className="swiglu-arrow">↓</span><span className="swiglu-value">gate scores {vec(gates)}</span><span className="swiglu-arrow">↓</span><span className="swiglu-op">SiLU</span><span className="swiglu-arrow">↓</span><span className="swiglu-value">{vec(gated)}</span></div>
      <div className="swiglu-branch"><span className="swiglu-arrow">↓</span><span className="swiglu-op">× W<sub>v</sub> <small>learned</small></span><span className="swiglu-arrow">↓</span><span className="swiglu-value">values {vec(values)}</span><span className="swiglu-arrow">↓</span><span className="swiglu-note">no activation on this branch</span></div>
      <div className="swiglu-join" aria-hidden="true" />
    </div>
    <div className="swiglu-merge"><span className="swiglu-op">⊗ multiply coordinate by coordinate <small>⊙ in the equation</small></span><span className="swiglu-arrow">↓</span><span className="swiglu-value">h = {vec(product)}</span><span className="swiglu-arrow">↓</span><span className="swiglu-op">× W<sub>o</sub> <small>learned</small></span><span className="swiglu-arrow">↓</span><span className="swiglu-value">output o · width d</span></div>
    <figcaption>Both branches read the same input x. Coordinate 2's SiLU gate is −0.2689, so the product −0.8068 has the opposite sign to its value 3. The numbers are projected scores, not probabilities.</figcaption>
  </figure>;
}

// §7: three ramps add up to a triangular pulse.
export function TriangleFigure() {
  const x = Array.from({ length: 81 }, (_, i) => -1 + i * .05),
    functions = [v => Math.max(0, v), v => -2 * Math.max(0, v - 1), v => Math.max(0, v - 2), triangle],
    titles = ['ReLU(x): slope +1 from 0', '−2·ReLU(x − 1): slope −2 from 1', 'ReLU(x − 2): slope +1 from 2', 'Sum: a triangular pulse'];
  return <figure id="perceptron-triangle-figure" data-figure="triangle">
    <div className="flow-columns-2">{functions.map((fn, i) => <CurvePlot key={titles[i]} title={titles[i]} curves={[{ data: x.map(v => [v, fn(v)]), color: ['#c49be2', '#e99b88', '#c49be2', '#f3eee2'][i], width: i === 3 ? 3.4 : undefined }]} xDomain={[-1, 3]} xTicks={[-1, 0, 1, 2, 3]} yDomain={[-4, 3]} yTicks={[-4, -2, 0, 1, 3]} xLabel="Input x" yLabel={i === 3 ? 'Sum' : 'Contribution'} />)}</div>
    <figcaption>All four panels share the same axes. Adding the three ramps gives slope 0 before 0, +1 from 0 to 1, −1 from 1 to 2, and 0 after 2.</figcaption>
  </figure>;
}
