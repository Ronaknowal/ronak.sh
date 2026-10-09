import './normalization-intuition.css';

// Statistics are shared along a row (one token); γ gradients are collected down a column (one feature).
export function NormalizationAxesFigure() {
  return <figure className="normalization-intuition" data-figure="normalization-axes" aria-label="LayerNorm statistics and parameter gradients reduce different axes"><div className="normalization-axis-grid">
    <span /><strong>Feature 1<br /><span className="normalization-learned">γ₁</span></strong><strong>Feature 2<br /><span className="normalization-learned">γ₂</span></strong><strong>Feature 3<br /><span className="normalization-learned">γ₃</span></strong>
    <strong>Token 1 → one μ, one s</strong><span className="normalization-axis-row">1</span><span className="normalization-axis-row">2</span><span className="normalization-axis-row">3</span>
    <strong>Token 2 → one μ, one s</strong><span className="normalization-axis-row is-second">2</span><span className="normalization-axis-row is-second">4</span><span className="normalization-axis-row is-second">6</span>
    <strong>Collect γ gradients ↓</strong><span className="normalization-gradient-cell">d₁₁h₁₁<br />+ d₂₁h₂₁</span><span className="normalization-gradient-cell">d₁₂h₁₂<br />+ d₂₂h₂₂</span><span className="normalization-gradient-cell">d₁₃h₁₃<br />+ d₂₃h₂₃</span>
    </div><figcaption>One sequence, two tokens, three features each, under LayerNorm(3). Each row gets its own mean and spread; each column reuses one learned γ, so its gradient adds that column’s contributions. Here h is the normalized value and d the derivative arriving from above.</figcaption></figure>;
}

// Normalizing over time and features lets a later token change an earlier output.
export function CausalNormalizationFigure() {
  const cases = [
    { name: 'Original two-token sequence', future: '[5, 7]', mean: 4, variance: 5, result: -3 / Math.sqrt(5 + 1e-5) },
    { name: 'Only the future token changes', future: '[15, 17]', mean: 9, variance: 50, result: -8 / Math.sqrt(50 + 1e-5) },
  ];
  return <figure className="normalization-intuition" data-figure="causal-normalization" aria-label="Normalizing over time lets a future token change an earlier output"><div className="flow-columns-2">{cases.map(example => <div className="normalization-causal-case" key={example.name}><p className="normalization-panel-label">{example.name}</p><div className="normalization-causal-flow"><span>Present token<br /><strong>[1, 3]</strong></span><span>Future token<br /><strong>{example.future}</strong></span></div><p>↓ Statistics shared across all four values: μ = {example.mean}, v = {example.variance}</p><p>First output = (1 − {example.mean}) / √({example.variance} + ε) ≈ <strong>{example.result.toFixed(6).replace('-', '−')}</strong></p></div>)}</div><figcaption>ε = 10⁻⁵, identity scale and shift. Per-token LayerNorm, for comparison, uses [1, 3] alone and gives about −0.999995 in both cases.</figcaption></figure>;
}

// An exponential running mean keeps a fading share of every past batch.
export function RunningStatisticWeightsFigure() {
  const contributions = [
    { label: 'Initial buffer', weight: .729, statistic: 0 },
    { label: 'Batch 1', weight: .081, statistic: 4 },
    { label: 'Batch 2', weight: .09, statistic: 8 },
    { label: 'Batch 3', weight: .1, statistic: 2 },
  ];
  return <figure className="normalization-intuition" data-figure="running-weights" aria-label="Exponential running mean retains most initial weight after only three updates"><div className="normalization-memory-strip" aria-label="Weight shares: initial .729, first batch .081, second .09, third .1">{contributions.map((entry, index) => <span key={entry.label} style={{ flex: entry.weight }} className={`normalization-memory-${index}`}><small>{entry.weight >= .09 ? entry.label : ''}</small></span>)}</div><ol className="normalization-memory-key">{contributions.map(entry => <li key={entry.label}>{entry.label}: weight <strong>{entry.weight}</strong> × mean {entry.statistic} = {(entry.weight * entry.statistic).toFixed(3)}</li>)}</ol><figcaption>Momentum 0.1, initial running mean 0, then three batches with means 4, 8 and 2. Each segment’s width is that source’s weight in the running mean, not its value. Running mean = 0.324 + 0.720 + 0.200 = 1.244.</figcaption></figure>;
}
