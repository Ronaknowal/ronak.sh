import './residual-gate-intuition.css';

// Forward contributions of a highway block and the three input-derivative routes, at x = 1.
// Violet values are computed forward; orange values are derivatives.
export function HighwayGateFigure() {
  const x = 1, transform = 2, gate = 1 / (1 + Math.exp(-x));
  const carry = (1 - gate) * x, changed = gate * transform;
  const gateDerivative = gate * (1 - gate);
  const terms = [
    ['Carry route', '1 − T', 1 - gate],
    ['Transformation route', 'T × H′', 2 * gate],
    ['Input changes the gate', 'T′ × (H − x)', gateDerivative],
  ];
  return <figure className="res-gate-intuition" data-figure="residual-highway-gate">
    <div className="res-gate-panels"><section><h5>Forward: what each route delivers at x = 1</h5><p>Carry: (1 − {gate.toFixed(4)}) × 1 = <span>{carry.toFixed(4)}</span></p><p>Transform: {gate.toFixed(4)} × 2 = <span>{changed.toFixed(4)}</span></p><strong>Output: {(carry + changed).toFixed(4)}</strong></section>
      <section className="res-gate-derivative"><h5>Backward: three contributions to dy/dx</h5>{terms.map(([name, formula, value]) => <p key={name}>{name}<br /><span>{formula} = {value.toFixed(4)}</span></p>)}<strong>Sum: {terms.reduce((sum, term) => sum + term[2], 0).toFixed(4)}</strong></section></div>
    <figcaption>Holding the gate fixed would give derivative {(1 + gate).toFixed(4)} and omit {gateDerivative.toFixed(4)}. The extra term appears because changing x also changes how much of H(x) replaces x. The sigmoid gate is between 0 and 1; a ReZero scalar need not be.</figcaption>
  </figure>;
}
