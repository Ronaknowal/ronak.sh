import { DropConnectNetworkViews } from './DropoutStructureFigures.jsx';
import './dropout-noise-intuition.css';

const scattered = new Set([0, 2, 4, 6, 8, 12, 16, 18, 24]);
const block = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);

export function DropBlockFootprintFigure() {
  return <figure className="drop-noise-intuition" data-figure="dropout-dropblock-footprint">
    <div className="drop-noise-panels flow-columns-2">{[['Scattered positions', scattered], ['One contiguous 3 × 3 region', block]].map(([name, removed]) => <section key={name}><h5>{name}</h5><div className="drop-noise-grid" role="img" aria-label={`${name}; removed row-major positions ${[...removed].map(i => i + 1).join(', ')}`}>
      {Array.from({ length: 25 }, (_, i) => <span key={i} className={removed.has(i) ? 'drop-noise-removed' : ''} aria-hidden="true">{removed.has(i) ? '×' : '•'}</span>)}
    </div></section>)}</div>
    <figcaption>Two 5 × 5 feature-map masks, each removing 9 of 25 positions: • retained, × removed. These are chosen shapes, not samples from the DropBlock algorithm.</figcaption>
  </figure>;
}

export function DropConnectTopologyFigure() {
  const cases = [
    { title: 'One decision per activation', matrix: [[2, 0], [2, 0]], output: [2, 2], description: 'Mask [1, 0] on h: both recipients lose h₂ (value 2).' },
    { title: 'One decision per connection', matrix: [[2, 0], [0, -2]], output: [2, -4], description: 'Keep only the two diagonal weights: the recipients lose different inputs.' },
  ];
  const signed = value => String(value).replace('-', '−');
  return <figure className="drop-noise-intuition" data-figure="dropout-dropconnect">
    <DropConnectNetworkViews />
    <div className="drop-noise-panels flow-columns-2">{cases.map(({ title, matrix, output, description }) => <section key={title}><h5>{title}</h5><p>{description}</p><div className="drop-noise-matrix" aria-label={`Effective weight rows ${matrix.map(r => r.map(signed).join(', ')).join('; ')}`}>{matrix.flat().map((value, i) => <span key={i} className={value === 0 ? 'drop-noise-removed' : ''}>{signed(value)}</span>)}</div><p>Recipient 1: {signed(matrix[0][0])} × 1 + {signed(matrix[0][1])} × 2 = <strong>{signed(output[0])}</strong><br />Recipient 2: {signed(matrix[1][0])} × 1 + {signed(matrix[1][1])} × 2 = <strong>{signed(output[1])}</strong></p></section>)}</div>
    <figcaption>Input h = [1, 2]; weight rows [1, 1] and [1, −1]; inverted scaling with keep probability 0.5, so a kept weight doubles. In each matrix, rows are recipients and columns are inputs.</figcaption>
  </figure>;
}

export function LocalNoiseFigure() {
  return <figure className="drop-noise-intuition" data-figure="dropout-local-noise">
    <div className="drop-noise-panels flow-columns-2"><section><h5>Draw weights, then sum</h5><p>w₁ = 0.5 + 0.2ε₁<br />w₂ = −0.25 + 0.1ε₂</p><p>z = 1·w₁ + 2·w₂<br /><strong>z = 0.2ε₁ + 0.2ε₂</strong></p></section><section><h5>Compute moments, then draw z</h5><p>mean = 1(0.5) + 2(−0.25) = 0<br />variance = 1²(0.04) + 2²(0.01) = 0.08</p><p><strong>z = √0.08 · ε</strong></p></section></div>
    <figcaption>Fixed input [1, 2]; independent Gaussian weights with means [0.5, −0.25] and variances [0.04, 0.01]; each ε is standard normal. Both routes give the same single-example distribution N(0, 0.08), not identical draws.</figcaption>
  </figure>;
}
