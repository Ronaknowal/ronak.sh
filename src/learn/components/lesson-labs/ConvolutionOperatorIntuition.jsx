import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from './LessonFlow.jsx';
import './convolution-operator-intuition.css';

// §5 Adaptive average pooling: bins come from boundaries, not equal partitions.
export function AdaptivePoolingBinsLab() {
  const [count, setCount] = useState(3);
  const values = [1, 2, 3, 4, 5];
  const bins = Array.from({ length: count }, (_, i) => {
    const start = Math.floor(i * values.length / count), end = Math.ceil((i + 1) * values.length / count);
    return { start, end, mean: values.slice(start, end).reduce((sum, value) => sum + value, 0) / (end - start) };
  });
  const shared = values.map((_, j) => bins.filter(b => j >= b.start && j < b.end).length);
  return <FlowLab id="adaptive-pooling-bins" label="Adaptive average pooling bins">
    <div className="conv-bin-scroll" role="region" tabIndex={0} aria-label="Adaptive pooling bins over input positions 0 to 4">
      <div className="conv-bin-grid" style={{ '--bins': count }}>
        <span className="conv-bin-corner">input</span>
        {values.map((value, i) => <span key={i} className="conv-bin-input"><small>i = {i}</small>{value}</span>)}
        <span className="conv-bin-corner">mean</span>
        {bins.map(({ start, end, mean }, i) => <div key={i} className="conv-bin-row" role="img" aria-label={`Bin ${i} averages input indices ${start} to ${end - 1}: mean ${flowNumber(mean, 3)}`}>
          <span className="conv-bin-name">bin {i}</span>
          {values.map((_, j) => <span key={j} className={j >= start && j < end ? 'conv-bin-active' : 'conv-bin-off'} aria-hidden="true">{j >= start && j < end ? `1/${end - start}` : ''}</span>)}
          <strong>{flowNumber(mean, 3)}</strong>
        </div>)}
      </div>
    </div>
    <FlowControls><FlowSlider name="Output count" value={count} onChange={setCount} min={1} max={7} step={1} format={v => String(v)} /></FlowControls>
    <FlowReadout>Bin i averages indices from ⌊5i/{count}⌋ up to, not including, ⌈5(i + 1)/{count}⌉. Inputs shared by several bins: {shared.map((s, j) => s > 1 ? `index ${j} (${s} bins)` : null).filter(Boolean).join(', ') || 'none at this count'}.</FlowReadout>
  </FlowLab>;
}

// §10 Absorbing an evaluation-mode BatchNorm into the convolution.
export function BatchNormFoldingFigure() {
  return <figure className="conv-fold" data-figure="batchnorm-folding" id="batchnorm-folding">
    <div className="flow-columns-2">
      <div><p className="conv-fold-label">Convolution, then evaluation BatchNorm</p>
        <p>z = 2(3) − 4 + 1 = <strong>3</strong><br />√(v + ε) = √4 = 2<br />BN(z) = 4(3 − 1)/2 − 3 = <strong>1</strong></p></div>
      <div><p className="conv-fold-label">Fold first, then one convolution</p>
        <p>α = γ/√(v + ε) = 2<br />kernel 2·[2, −1] = <strong>[4, −2]</strong>; bias −3 + 2(1 − 1) = <strong>−3</strong><br />4(3) − 2(4) − 3 = <strong>1</strong></p></div>
    </div>
    <figcaption>One output channel with kernel [2, −1], bias 1 and patch [3, 4]; frozen BatchNorm values μ = 1, v = 3.99, ε = 0.01, γ = 4, β = −3. Both routes give 1, because α(Wx + b − μ) + β = (αW)x + α(b − μ) + β.</figcaption>
  </figure>;
}
