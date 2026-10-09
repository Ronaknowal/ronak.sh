import './LessonFlow.jsx';
import './transfer-intuition.css';

const minus = value => String(value).replace('-', '−');

// Colour vocabulary: class labels follow the sign rule (same = +1, filled amber circle;
// different = −1, blue ring); computed values violet; grey unchanged; dashed amber added and trained.
export function ProbeInformationFigure() {
  const points = [[-1, -1, 'same'], [-1, 1, 'different'], [1, -1, 'different'], [1, 1, 'same']];
  return <figure className="transfer-intuition" data-figure="transfer-probe-information" aria-label="A failed linear probe need not mean the representation lost the answer">
    <p className="transfer-row-label">Task: decide whether the two signs agree. A filled amber circle means “same”; a blue ring means “different”.</p>
    <div className="transfer-intuition-pair">
      <div><p className="transfer-part-title">Panel A: keep both coordinates</p><svg viewBox="0 0 250 240" role="img" aria-label="Opposite corners have the same label, so no straight line separates the two classes"><line x1="30" x2="220" y1="120" y2="120" stroke="#8c8476" /><line x1="125" x2="125" y1="25" y2="215" stroke="#8c8476" />{points.map(([x, y, label]) => <g key={`${x},${y}`}>{label === 'same' ? <circle cx={125 + x * 65} cy={120 - y * 65} r="8" fill="#e4b752" /> : <circle cx={125 + x * 65} cy={120 - y * 65} r="8" fill="none" stroke="#83b4e8" strokeWidth="2.5" />}<text x={125 + x * 65} y={143 - y * 65} textAnchor="middle">({minus(x)}, {minus(y)}) {label}</text></g>)}</svg><p>Opposite corners share a label, so no single straight line separates the classes; a nonlinear head can use the sign of x₁x₂.</p></div>
      <div><p className="transfer-part-title">Panel B: keep only the first coordinate</p><div className="transfer-collapsed-features">{[-1, 1].map(value => <div key={value}><strong>Feature = {minus(value)}</strong><span><span className="transfer-dot is-same" aria-hidden="true" /> same</span><span><span className="transfer-dot is-different" aria-hidden="true" /> different</span><span>Both cases now share one value.</span></div>)}</div><p>Each feature value must serve both labels, so no deterministic head receiving only this feature can tell them apart.</p></div>
    </div>
    <figcaption>Constructed four-row example. Panel A: the head is too restricted, but the information is present. Panel B: the information is lost.</figcaption>
  </figure>;
}

const signed = (value, digits = 6) => value.toFixed(digits).replace('-', '−');

export function AdapterCorrectionFigure() {
  const hidden = Math.tanh(-1);
  const up = [.5 * hidden, -.25 * hidden];
  return <figure className="transfer-intuition" data-figure="transfer-adapter-routes" aria-label="A bottleneck adapter computes a nonlinear correction and adds back the input">
    <p className="transfer-row-label">Example values after some training, so the up weights are no longer zero: h = (1, 2); down weights D = [1, −1]; up weights U = [.5, −.25]ᵀ; both biases zero.</p>
    <div className="transfer-adapter-placement"><span>Backbone</span><span aria-hidden="true">→</span><strong>Adapter, expanded below</strong><span aria-hidden="true">→</span><span>Target head</span></div>
    <div className="transfer-route-end"><strong>Split: h = (1, 2)</strong><span>The same two values enter both routes.</span></div>
    <p className="transfer-fork" aria-hidden="true"><span>↙</span><span>both routes run in parallel from the same h</span><span>↘</span></p>
    <div className="transfer-adapter-branches">
      <div className="transfer-adapter-direct"><p className="transfer-part-title"><span className="transfer-route-tag">Route 1 of 2 · unchanged</span>Direct route</p><p>Keep h unchanged</p><div className="transfer-skip-line" aria-hidden="true" /><p className="transfer-route-tail"><strong>(1, 2)</strong> ↓ into ⊕</p></div>
      <div className="transfer-adapter-detour"><p className="transfer-part-title"><span className="transfer-route-tag">Route 2 of 2 · added, trains</span>Learned detour</p><ol><li><strong>Down: 2 values → 1</strong><span>Dh = 1 − 2 = −1</span></li><li><strong>Nonlinear response</strong><span>tanh(−1) = {signed(hidden)}</span></li><li><strong>Up: 1 value → 2</strong><span>U tanh(Dh) = ({signed(up[0])}, {signed(up[1])})</span></li></ol><p className="transfer-route-tail">↓ into ⊕</p></div>
    </div>
    <div className="transfer-route-end is-sum"><strong>⊕ Add matching coordinates</strong><span>h′ = (1, 2) + ({signed(up[0])}, {signed(up[1])})</span><b>= ({signed(1 + up[0])}, {signed(2 + up[1])}) → head</b></div>
    <figcaption>Grey: the direct route, which bypasses every learned operation; dashed amber: the added detour, which trains. The two routes rejoin only at the addition ⊕.</figcaption>
  </figure>;
}

export function LowRankDirectionFigure() {
  const examples = [{ x: [2, 1], measure: 1 }, { x: [0, 2], measure: -2 }, { x: [3, 3], measure: 0 }];
  return <figure className="transfer-intuition" data-figure="transfer-low-rank-direction" aria-label="Rank one restricts every correction to a common output direction">
    <div className="transfer-intuition-pair"><svg viewBox="0 0 260 285" role="img" aria-label="Corrections (1,2), (−2,−4) and (0,0) lie on one line along b"><line x1="20" x2="240" y1="120" y2="120" stroke="#8c8476" /><line x1="140" x2="140" y1="20" y2="260" stroke="#8c8476" /><line x1="75" y1="250" x2="185" y2="30" stroke="#e4b752" strokeDasharray="4 4" /><text x="176" y="26" textAnchor="end" className="transfer-svg-amber">line through b</text><line x1="140" y1="120" x2="165" y2="70" stroke="#c7a5ee" strokeWidth="3" /><line x1="140" y1="120" x2="90" y2="220" stroke="#8f7aa8" strokeWidth="3" />{examples.map(({measure}, index) => <g key={index}><circle cx={140 + 25 * measure} cy={120 - 50 * measure} r="5" fill={index === 1 ? '#8f7aa8' : '#c7a5ee'} /><text x={140 + 25 * measure + 10} y={120 - 50 * measure + 4}>{`(${minus(measure)}, ${minus(2 * measure)})`}</text></g>)}<text x="16" y="279">Output coordinates · equal unit scales</text></svg><div>{examples.map(example => <p key={example.measure}>x = ({example.x.join(', ')})<br />a · x = {minus(example.measure)}<br /><strong className="transfer-violet">Correction = ({minus(example.measure)}, {minus(2 * example.measure)})</strong></p>)}</div></div>
    <figcaption>a = [1, −1] and b = [1, 2]ᵀ, the pair from the grid above, held fixed. Violet points are the computed corrections b (a · x) (the darker one is negative); the dashed amber line runs through the learned direction b. Only the added correction is drawn, not the full output.</figcaption>
  </figure>;
}
