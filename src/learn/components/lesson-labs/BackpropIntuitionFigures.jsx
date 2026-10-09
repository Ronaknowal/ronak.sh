import { BackpropFigure, BackpropTable } from './BackpropShared.jsx';
import './backprop-intuition.css';

// §3: an input used by two outputs, and a weight used by two example rows.
export function MatrixSensitivityFigure() {
  return <BackpropFigure id="matrix-sensitivity" title="One input reaches two outputs; one weight is used by two rows">
    <div className="backprop-intuition-fork"><div><strong className="bpi-input">input a₁ = 2</strong><p className="backprop-small">other input a₂ = −1</p></div><div className="backprop-intuition-paths"><p>forward: coefficient 3 → y₁ = 3a₁ + a₂ = 5, <span className="bpi-sens">sensitivity ∂L/∂y₁ = 2</span><br /><span className="bpi-sens">backward: 2 × 3 = 6</span></p><p>forward: coefficient −2 → y₂ = −2a₁ + 4a₂ = −8, <span className="bpi-sens">sensitivity ∂L/∂y₂ = −1</span><br /><span className="bpi-sens">backward: (−1) × (−2) = 2</span></p></div></div>
    <p>Collect at a₁: <strong className="bpi-sens">6 + 2 = 8</strong>. Increasing a₁ by ε changes the outputs by (3ε, −2ε); with output sensitivities (2, −1), the loss changes by 2(3ε) − 1(−2ε) = 8ε.</p>
    <BackpropTable caption="The same collection rule for a weight used by two example rows" headers={['Use of weight w', 'Input multiplying w', 'Output sensitivity', 'Contribution to w']} rows={[[1, 2, 2, '2 × 2 = 4'], [2, 5, '−1', '5 × (−1) = −5'], ['both uses', 'two example rows', 'add', '4 − 5 = −1']]} />
    <figcaption>A constructed linear example. The output sensitivities (2, −1) already include everything downstream. The first collection sums across output columns for one input; the second sums across example rows for one shared weight. Those are the two sums written as GBᵀ and AᵀG.</figcaption>
  </BackpropFigure>;
}

// §3: cross-entropy's logit sensitivity, p − target, for one example with true class B.
export function CrossEntropySignalFigure() {
  const probabilities = [.2, .3, .5];
  return <BackpropFigure id="ce-signal" title="Cross-entropy compares the allocated probability with the target allocation">
    <div className="backprop-intuition-shares" role="img" aria-label="Predicted probability: A 20%, B 30%, C 50%; B is the true class">{probabilities.map((probability, index) => <span key={index} className={index === 1 ? 'is-true' : ''} style={{ flex: probability }}>{['A', 'B (true)', 'C'][index]} · {probability}</span>)}</div>
    <BackpropTable caption="Probability minus target (1 for the true class, 0 otherwise), for each class" headers={['Class', 'p − target', 'Logit sensitivity', 'A gradient-descent step']} rows={[['A', '.2 − 0', '+.2', 'lowers this logit'], ['B (true)', '.3 − 1', '−.7', 'raises this logit'], ['C', '.5 − 0', '+.5', 'lowers this logit more']]} />
    <figcaption>One example, no batch average. The three sensitivities add to zero (.2 − .7 + .5 = 0): shifting every logit by the same amount changes no probability, so the loss has no sensitivity in that common direction.</figcaption>
  </BackpropFigure>;
}

// §6: each example's coefficient in the objective under three ways of combining two microbatches.
export function MicrobatchWeightFigure() {
  const schemes = [
    { name: 'Desired full-batch mean', weights: [.2, .2, .2, .2, .2], equation: '(ℓ₁ + ℓ₂ + ℓ₃ + ℓ₄ + ℓ₅) / 5' },
    { name: 'Unweighted sum of the two group means', weights: [.5, .5, 1 / 3, 1 / 3, 1 / 3], equation: '(ℓ₁ + ℓ₂) / 2 + (ℓ₃ + ℓ₄ + ℓ₅) / 3' },
    { name: 'Group means weighted by group size', weights: [.2, .2, .2, .2, .2], equation: '(2/5) × mean(first 2) + (3/5) × mean(last 3)' },
  ];
  return <BackpropFigure id="microbatch-weights" title="Each example should keep the same share of the objective">
    {schemes.map(scheme => <div className="backprop-intuition-weight-row" key={scheme.name}><h4>{scheme.name}</h4><p className="backprop-small">{scheme.equation}</p><div className="backprop-intuition-weight-bars">{scheme.weights.map((weight, index) => <div key={index}><span className="backprop-intuition-weight-number">{weight === 1 / 3 ? '⅓' : weight}</span><span className="backprop-intuition-weight-track"><span style={{ height: `${weight / .5 * 100}%` }} /></span><span>ℓ{index + 1}</span></div>)}</div></div>)}
    <figcaption>Five examples split into groups of two and three. Each bar's height is that example's coefficient in the objective, on a common 0–0.5 scale. In the unweighted sum, an example in the small group counts 1.5 times as much as one in the large group; weighting each group mean by its share of the five examples restores equal weights.</figcaption>
  </BackpropFigure>;
}
