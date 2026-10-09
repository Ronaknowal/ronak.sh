import { flowNumber as number } from './LessonFlow.jsx';
import './linear-logistic-labs.css';

export function RegressionOperationFigure({ binary = false }) {
  return <figure aria-label={binary ? 'Distance through score and probability' : 'Distance through a weighted delivery-time rule'}>
    <div className="regression-operation">
      <p className="regression-input">Supplied distance<br /><strong>x = 2</strong><br />200 km</p>
      <p className="regression-flow-arrow">→ multiply by weight</p>
      <p className="regression-parameter">Weight w = 1<br />Offset b = {binary ? '−1' : '0'}<br /><span className="regression-operation-node">multiply, then add</span></p>
      <p className="regression-flow-arrow">→ computed value</p>
      <p className="regression-computed">{binary ? 'Score z' : 'Predicted hours ŷ'}<br /><strong>{binary ? '−1 + 1 × 2 = 1' : '0 + 1 × 2 = 2'}</strong></p>
    </div>
    {binary && <div className="regression-operation"><p className="regression-computed">Score z = 1</p><p className="regression-flow-arrow">→ convert score</p><p className="regression-operation-node">Sigmoid: 1 / (1 + exp(−z))</p><p className="regression-flow-arrow">→ computed probability</p><p className="regression-computed">p = 0.731<br />probability of missed deadline</p></div>}
    <figcaption>Read in arrow order. Cyan labels supplied data; amber labels adjustable parameters; violet labels computed results. The outlined operation performs the named calculation.</figcaption>
  </figure>;
}

export function MeanBalanceFigure() {
  const hours = [1, 2, 2, 4];
  return <figure aria-label="Moving a constant prediction above or below the mean">
    <div className="flow-columns-3">{[1, 2.25, 3].map(constant => <div key={constant}>
      <p>Constant prediction <strong>{constant} hours</strong></p>
      <ol className="regression-values">{hours.map((observed, index) => <li key={index}>Shipment {String.fromCharCode(65 + index)}: observed {observed}; residual {number(observed - constant)}</li>)}</ol>
      <p>Residual sum <strong>{number(hours.reduce((sum, observed) => sum + observed - constant, 0))}</strong>: {constant < 2.25 ? 'move up' : constant > 2.25 ? 'move down' : 'pulls balance'}.</p>
    </div>)}</div>
  </figure>;
}

export function DesignRowsFigure() {
  return <figure aria-label="Each design row supplies one dot product">
    <ol className="regression-values">{[0, 1, 2, 3].map((distance, index) => <li key={distance}>
      <span className="regression-input">Shipment {String.fromCharCode(65 + index)}: row [1, {distance}]</span>
      <span className="regression-flow-arrow"> → multiply corresponding entries, then sum → </span>
      <span className="regression-parameter">1 × 0.9 + {distance} × 0.9</span>
      <span className="regression-computed"> = {number(0.9 + distance * 0.9)} predicted hours</span>
    </li>)}</ol>
    <figcaption>The constant column 1 always multiplies the intercept; the distance column multiplies the slope. Stacking these same row operations is matrix multiplication.</figcaption>
  </figure>;
}

export function HeldOutPipelineFigure() {
  return <figure aria-label="Training fitting, validation selection, final test">
    <ol className="regression-values">
      <li><span className="regression-input">180 training rows</span> → learn scaling and fit each candidate rule.</li>
      <li><span className="regression-input">60 validation rows</span> → compare candidate probabilities; select the penalty setting and warning threshold.</li>
      <li><span className="regression-parameter">Freeze the training-fitted rule and selected settings.</span></li>
      <li><span className="regression-input">60 test rows</span> → apply that frozen rule → report probability loss and warning cost once.</li>
    </ol>
    <figcaption>Arrows follow information use, not another training update. Test targets never point back to the selection steps.</figcaption>
  </figure>;
}

export function LeverageFigure() {
  return <figure aria-label="An intercept change and a slope change affect predictions differently">
    <div className="flow-columns-2">{[
      ['Add 0.1 to the intercept', () => 0.1],
      ['Add 0.1 to the slope', input => 0.1 * input],
    ].map(([label, change]) => <div key={label}>
      <p>{label}</p>
      <ol className="regression-values">{[0, 1, 2, 3, 10].map(input => <li key={input}>Distance x = {input}: prediction changes by <strong>{number(change(input))} hours</strong>.</li>)}</ol>
    </div>)}</div>
    <figcaption>The distant row at x = 10 changes much more when the slope moves. This is sensitivity to a parameter change; leverage below measures the fitted prediction's sensitivity to its own observed target.</figcaption>
  </figure>;
}
