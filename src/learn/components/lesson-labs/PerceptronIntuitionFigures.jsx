import { batchNeuronExample, evaluateBatchNeuronExample, neuronOutputShares, perceptronUpdateExample } from '../../data/perceptron-intuition.js';
import './perceptron-intuition.css';

const number = value => Number(value.toFixed(4)).toString().replace('-', '−');

// §2: one mistaken row and the correction it supplies.
export function MistakeCorrectionFigure() {
  const model = perceptronUpdateExample();
  const rows = [
    ['current', 'Current parameters', [...model.weights, model.bias]],
    ['added', '+ half of (x₁, x₂, 1) = (1, 2, 1) × 0.5', [.5, 1, .5]],
    ['updated', '= updated parameters', [...model.nextWeights, model.nextBias]],
  ];
  return <figure className="neuron-intuition" id="neuron-mistake-correction" data-figure="mistake-correction">
    <div className="neuron-update-rows">
      <div className="neuron-update-row neuron-update-head" aria-hidden="true"><span /><div><small>w₁</small><small>w₂</small><small>bias b</small></div></div>
      {rows.map(([kind, label, values]) => <div className={`neuron-update-row is-${kind}`} key={kind}>
        <strong>{label}</strong><div>{values.map((value, i) => <span key={i} aria-label={`${['w₁', 'w₂', 'bias'][i]} ${number(value)}`}>{number(value)}</span>)}</div>
      </div>)}
    </div>
    <p className="neuron-calculation">Score of (1, 2) before: (−1)(1) + 0(2) + 0 = <strong>−1</strong> (wrong sign for label +1). After: (−0.5)(1) + 1(2) + 0.5 = <strong>{number(model.after)}</strong>.</p>
  </figure>;
}

// §3: a batch of examples through a layer of neurons, with every shape labelled.
export function BatchNeuronCorrespondence() {
  const scores = evaluateBatchNeuronExample();
  const matrix = (rows, role) => <div className={`neuron-matrix is-${role}`}>{rows.flatMap((row, i) => row.map((value, j) => <span key={i + ':' + j}>{number(value)}</span>))}</div>;
  return <figure className="neuron-intuition" id="neuron-batch-correspondence" data-figure="batch-correspondence">
    <div className="neuron-matrix-layout">
      <div><p className="grid-label">Inputs X: N = 2 examples × d = 2 features</p><p className="neuron-axis">row n = one example · column i = input feature xᵢ</p>{matrix(batchNeuronExample.inputs, 'input')}</div>
      <div><p className="grid-label">Weights W: m = 2 neurons × d = 2 features</p><p className="neuron-axis">row j = the wires into neuron j · column i = input xᵢ</p>{matrix(batchNeuronExample.weights, 'parameter')}<p className="neuron-axis">Biases b: one per neuron, (−1, 0.5)</p></div>
    </div>
    <p className="grid-label">Scores Z = XWᵀ + b: N = 2 examples × m = 2 neurons</p>
    <p className="neuron-axis">Here N, d and m all happen to be 2, so the shapes look alike; the labels, not the sizes, say which axis is which.</p>
    <div className="neuron-matrix-results">
      {scores.map((row, i) => <div key={i}><p className="neuron-axis">Example {i + 1}: ({batchNeuronExample.inputs[i].map(number).join(', ')})</p>
        <div className="neuron-matrix is-computed">{row.map((value, j) => <span key={j}><small>neuron {j + 1}</small>{number(value)}<small>ReLU → {number(Math.max(0, value))}</small></span>)}</div>
      </div>)}
    </div>
  </figure>;
}

// §4: softmax shares compete for one unit of probability.
export function SoftmaxCompetitionFigure() {
  return <figure className="neuron-intuition" id="neuron-softmax-competition" data-figure="softmax-competition">
    {[[1, 2, 3], [1, 2, 4]].map(scores => {
      const result = neuronOutputShares(scores);
      return <div className="neuron-share-example" key={scores.join(',')}>
        <p className="grid-label">Scores ({scores.join(', ')})</p>
        <p className="neuron-calculation">e<sup>score</sup>: {scores.map(s => number(Math.exp(s))).join(' + ')} = {number(scores.reduce((t, s) => t + Math.exp(s), 0))}; each share is its exponential ÷ that total.</p>
        <div className="neuron-share-strip" role="img" aria-label={'Probability shares: ' + result.shares.map(number).join(', ')}>
          {result.shares.map((share, i) => <span key={i} style={{ flexGrow: share }}>{share > .12 ? `class ${i + 1}` : ''}</span>)}
        </div>
        <div className="neuron-share-labels">{result.shares.map((share, i) => <span key={i}>Class {i + 1}: <strong>{number(share)}</strong></span>)}</div>
      </div>;
    })}
    <figcaption>Each strip is one unit of probability split in class order. Only the third score changed, from 3 to 4.</figcaption>
  </figure>;
}

// §7: ReLU, GELU and SiLU as a fraction retained times the signed score.
export function SmoothGateDecomposition() {
  const rows = [
    { input: -1, relu: 0, gelu: .15865525393145707, silu: 1 / (1 + Math.E) },
    { input: 1, relu: 1, gelu: .8413447460685429, silu: 1 / (1 + Math.exp(-1)) },
  ];
  return <figure className="neuron-intuition" id="neuron-smooth-gate" data-figure="smooth-gate">
    {rows.map(row => <div key={row.input}><p className="grid-label">Score z = {row.input}</p>{[['ReLU', row.relu], ['GELU', row.gelu], ['SiLU', row.silu]].map(([name, multiplier]) =>
      <div className="neuron-gate-row" key={name}><span>{name}</span><div className="neuron-gate-track" role="img" aria-label={`${name} keeps the fraction ${number(multiplier)}`}><span style={{ width: multiplier * 100 + '%' }} /></div><span>fraction {number(multiplier)} × {row.input} = <strong>{number(multiplier * row.input)}</strong></span></div>
    )}</div>)}
    <figcaption>Each bar is the fraction kept, on a scale from 0 (left) to 1 (right); the number after it is that fraction times the signed score, the activation's output.</figcaption>
  </figure>;
}
