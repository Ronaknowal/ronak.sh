import './landmark-family-intuition.css';

// Optional §7 figures in the reading flow: the lesson sentence before each figure
// introduces it, so the figures carry no titles of their own.

export function DenseFeatureReuseFigure() {
  return <figure className="landmark-family-intuition" data-figure="landmark-dense-reuse" aria-label="A dense block appends new channels; earlier channels remain available">
    {[0, 1, 2, 3, 4].map(step => <section className="landmark-dense-row" key={step}><h5>{step === 0 ? 'Initial state' : `After layer ${step}`}: {8 + 3 * step} channels</h5><div><span>Original 8</span>{Array.from({ length: step }, (_, i) => <span key={i} className={i === step - 1 ? 'landmark-new-features' : ''}>L{i + 1}: 3</span>)}</div></section>)}
    <figcaption>Violet marks the three channels each layer adds; every layer reads all groups to its left. For a simplified 3×3 dense layer that directly emits 3 channels, layer 1 has 9 × 8 × 3 = 216 weights; layer 4 has 9 × 17 × 3 = 459. Constant output growth does not imply constant per-layer cost. Actual DenseNet bottlenecks and transition compression add their own contracts.</figcaption>
  </figure>;
}

export function RegNetStageFigure() {
  const widths = Array.from({ length: 6 }, (_, j) => {
    const raw = 16 + 8 * j, exponent = Math.round(Math.log2(raw / 16));
    return { raw, exponent, width: 16 * 2 ** exponent };
  });
  return <figure className="landmark-family-intuition" data-figure="landmark-regnet" aria-label="A smooth width rule becomes repeated stages">
    <ol className="landmark-width-steps">{widths.map(({ raw, exponent, width }, j) => <li key={j}><span>Block {j}</span><p>Proposal {raw}<br />Rounded exponent {exponent}</p><strong>{width} channels</strong><div className="landmark-width-bar" aria-hidden="true"><i style={{ width: `${width / 64 * 100}%` }} /></div></li>)}</ol>
    <figcaption>Rule: uⱼ = 16 + 8j, then wⱼ = 16 × 2<sup>round(log₂(uⱼ/16))</sup>. Consecutive equal widths form stages: 16 channels × 1 block, 32 × 3, then 64 × 2. This is a width-rule illustration, not a trained named RegNet. All widths here already divide by 8; a complete builder must also satisfy its channel rounding, bottleneck and group divisibility rules.</figcaption>
  </figure>;
}

export function FrozenFeatureGradientFigure() {
  return <figure className="landmark-family-intuition" data-figure="landmark-frozen-feature" aria-label="Frozen feature weights still pass a gradient to their input">
    <div className="landmark-feature-flow"><span>trainable generator → ŷ</span><b aria-hidden="true">→</b><span>fixed feature rule φ(u) = u₁ + u₂</span><b aria-hidden="true">→</b><span>compare with φ(y) = 2 → loss L = (φ(ŷ) − 2)²</span></div>
    <div className="landmark-family-panels"><section><h5>The gradient passes through the fixed rule</h5><p>ŷ = [2, 1] → φ(ŷ) = 3 → L = 1</p><p>∂L/∂φ = 2(3 − 2) = 2<br />∂φ/∂ŷ = [1, 1]<br /><strong className="landmark-gradient">∂L/∂ŷ = [2, 2]</strong></p><p>That gradient continues into the generator’s parameters. The feature coefficients [1, 1] stay fixed.</p></section><section><h5>The feature can miss a change</h5><p>ŷ = [2, 0] → φ(ŷ) = 2 → <strong>L = 0</strong></p><p>The target is y = [1, 1]. Different pixels give the same sum, so the feature loss is zero while the pixelwise mean squared error is 1.</p></section></div>
    <figcaption>Orange marks a gradient travelling backward. Freezing φ’s parameters differs from detaching φ(ŷ) or computing that branch under no_grad: either would break the generator’s needed gradient. The target-feature branch can be computed without a gradient when y is fixed. Real feature networks retain much richer structure, but still define their own notions of similarity.</figcaption>
  </figure>;
}
