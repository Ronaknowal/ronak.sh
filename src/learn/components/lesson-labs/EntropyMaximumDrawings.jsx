import { maxEntropyState, numericDraft } from '../../data/entropy-reading-models.js';
import { Figure, Drawing, Arrow, Curve, Axis, Mark, Strip, Table, Controls, Range, Draft, useMaximum, COLORS, number } from './EntropyDrawingElements.jsx';
const V = [[65, 335], [415, 335], [240, 335 - 175 * Math.sqrt(3)]],
  at = q => [q.reduce((s, p, i) => s + p * V[i][0], 0), q.reduce((s, p, i) => s + p * V[i][1], 0)];
function Simplex({
  q = [.2, .3, .5],
  slice = null,
  candidate = null,
  reference = false
}) {
  const point = at(q);
  return <div className="en-simplex"><p className="en-simplex-top">▲ count 2: q₂=1</p><Drawing label="Equilateral probability simplex. Top vertex is count 2, bottom left count 0, bottom right count 1. Barycentric coordinates are probabilities." height={365} minWidth={0}><polygon points={V.map(v => v.join(',')).join(' ')} fill="#ffffff04" stroke="#aaa" />{[.25, .5, .75].flatMap(t => [0, 1, 2].map(i => {
        const a = Array(3).fill(0),
          b = Array(3).fill(0);
        a[i] = b[i] = t;
        a[(i + 1) % 3] = 1 - t;
        b[(i + 2) % 3] = 1 - t;
        const p = at(a),
          r = at(b);
        return <line key={t + '-' + i} x1={p[0]} y1={p[1]} x2={r[0]} y2={r[1]} stroke="#555" strokeDasharray="2 4" />;
      }))}{reference && [0, 1, 2].map(i => {
        const t = q[i],
          a = Array(3).fill(0),
          b = Array(3).fill(0);
        a[i] = b[i] = t;
        a[(i + 1) % 3] = 1 - t;
        b[(i + 2) % 3] = 1 - t;
        const p = at(a),
          r = at(b);
        return <line key={i} x1={p[0]} y1={p[1]} x2={r[0]} y2={r[1]} stroke={COLORS[i]} strokeWidth="2" />;
      })}{slice && (() => {
        const a = at([1 - slice.mean + slice.lower, slice.mean - 2 * slice.lower, slice.lower]),
          b = at([1 - slice.mean + slice.upper, slice.mean - 2 * slice.upper, slice.upper]);
        return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#ddd" strokeWidth="3" />;
      })()}<circle cx={point[0]} cy={point[1]} r="7" fill={COLORS[1]} stroke="#fff" strokeWidth="1.5" />{candidate && (() => {
        const p = at(candidate);
        return <path d={`M${p[0]},${p[1] - 9}l9 9l-9 9l-9 -9Z`} fill="none" stroke={COLORS[0]} strokeWidth="3" />;
      })()}{V.map(([x, y], i) => <Mark key={i} x={x} y={y} index={i} size={5} />)}</Drawing><div className="en-simplex-bottom"><span>● count 0<br />q₀=1</span><span>■ count 1<br />q₁=1</span></div></div>;
}
export function ProbabilitySimplex() {
  return <Figure id="E42" title="Three probabilities determine one point"><Simplex reference /><Strip title="The selected law: probabilities in count order" labels={['count 0', 'count 1', 'count 2']} values={[.2, .3, .5]} /><p>Each line through the selected point is parallel to the opposite side: amber q₀=.2, blue q₁=.3, lavender q₂=.5. Dotted parallels mark ¼, ½ and ¾. The three coordinates sum to one; the point is a law, not a physical count location.</p></Figure>;
}
function MaximumContent({
  stage
}) {
  const {
      maximum,
      setMaximum,
      maximumReset,
      resetMaximum
    } = useMaximum(),
    s = maxEntropyState(maximum.mean, maximum.fraction),
    collapsed = s.lower === s.upper;
  const update = patch => setMaximum(old => ({
    ...old,
    ...patch
  }));
  return <><Simplex q={s.q} slice={s} candidate={stage >= 2 ? s.optimum : null} /><p>Current q is the blue circle. {stage >= 2 ? 'Candidate p* is the amber open diamond. ' : ''}The white segment contains exactly the laws satisfying the selected mean.</p><Strip title="Current q in count order" labels={['count 0', 'count 1', 'count 2']} values={s.q} /><div className="en-constraint-strip"><span>sum q = {number(s.q.reduce((a, b) => a + b, 0))}</span><span>mean = {number(s.q[1] + 2 * s.q[2], 8)}</span><span>t=q₂={number(s.t, 8)}</span><span>feasible t ∈ [{number(s.lower, 8)}, {number(s.upper, 8)}]</span></div>{stage >= 2 && <><Strip title="Candidate p* in count order" labels={['count 0', 'count 1', 'count 2']} values={s.optimum} /><Drawing label="Entropy along the feasible slice with current law and maximizing candidate" height={265}><Axis yLabel="entropy, bits" xLabel="t = q₂" />{!collapsed && <Curve points={s.curve} xDomain={[s.lower, s.upper]} yDomain={[0, 1.6]} />}<circle cx={collapsed ? 240 : 45 + (s.t - s.lower) / (s.upper - s.lower) * 390} cy={190 - s.entropy / 1.6 * 155} r="6" fill={COLORS[1]} stroke="#fff" /><path d={(() => {
          const x = collapsed ? 240 : 45 + (s.optimum[2] - s.lower) / (s.upper - s.lower) * 390,
            y = 190 - s.maximumEntropy / 1.6 * 155;
          return `M${x} ${y - 8}l8 8l-8 8l-8 -8Z`;
        })()} fill="none" stroke={COLORS[0]} strokeWidth="2" /><text x="45" y="225">{number(s.lower, 4)}</text><text x="435" y="225" textAnchor="end">{number(s.upper, 4)}</text></Drawing><p aria-live="polite" className="en-status">H(q)={number(s.entropy, 9)}; H(p*)={number(s.maximumEntropy, 9)}; gap={number(s.gap, 9)} bits. η={Number.isFinite(s.eta) ? number(s.eta, 8) : 'no finite value at this exact endpoint'}.</p></>}<Controls onReset={resetMaximum} resetIdentity={maximumReset}><Range label={`Feasible-slice fraction — stage ${stage}`} value={s.fraction} onChange={fraction => update({
        fraction
      })} disabled={collapsed} />{collapsed && <p>The feasible interval is one point; the fraction control is disabled because it cannot change the law.</p>}{stage >= 2 && <button disabled={collapsed} onClick={() => update({
        fraction: (s.optimum[2] - s.lower) / (s.upper - s.lower)
      })}>Select p*</button>}{stage === 3 && <Draft label="Required mean" value={maximum.mean} parse={text => {
        const mean = numericDraft(text, 0, 2, 'Mean');
        maxEntropyState(mean, maximum.fraction);
        return mean;
      }} onApply={mean => update({
        mean
      })} />}</Controls><p>All three investigation positions share this state. Scrolling does not reset it; reset anywhere restores mean 10/7 and fraction 0.</p></>;
}
export function FeasibleSlice() {
  return <Figure id="E43" title="Investigate the feasible slice before choosing a criterion"><MaximumContent stage={1} /></Figure>;
}
export function MaximumCandidate() {
  return <Figure id="E44" title="Compare the current law with the entropy candidate"><MaximumContent stage={2} /></Figure>;
}
export function MovingConstraint() {
  return <Figure id="E45" title="Move the mean constraint, keeping the same slice fraction"><Table caption="Four reference slices, before changing the live mean" headers={['Mean', 't lower', 't upper', 'Feasible geometry']} rows={[[0, 0, 0, 'one vertex'], [1, 0, .5, 'line segment'], ['10/7', '3/7', '5/7', 'line segment'], [2, 1, 1, 'one vertex']]} /><div className="en-split">{[0, 1, 10 / 7, 2].map(mean => <div key={mean}><p>Reference mean {number(mean, 6)}</p><Simplex q={maxEntropyState(mean, 0).q} slice={maxEntropyState(mean, 0)} /></div>)}</div><MaximumContent stage={3} /></Figure>;
}
export function BaseMeasure() {
  return <Figure id="E46" title="A nonuniform reference changes the entropy objective"><Drawing label="Base weights one two one represented by one subslot, two middle subslots and one subslot, while retaining three outcome identities" height={200}>{[0, 1, 2].map(i => <g key={i}><rect x={[35, 137.5, 342.5][i]} y="35" width={i === 1 ? 205 : 102.5} height="90" fill={COLORS[i]} fillOpacity=".2" stroke={COLORS[i]} />{i === 1 && <line x1="240" y1="35" x2="240" y2="125" stroke={COLORS[i]} strokeWidth="2" />}<text x={[86.25, 240, 393.75][i]} y="162" textAnchor="middle">count {i}</text></g>)}</Drawing><p>The two middle subslots represent reference weight h₁=2; they do not create a fourth outcome.</p><Strip title="Distribution proportional to base h=(1,2,1)" labels={['count 0', 'count 1', 'count 2']} values={[.25, .5, .25]} /><Table caption="Shannon entropy and the base-relative objective are different" headers={['Candidate', 'Shannon H, bits', 'H + E log₂h, bits']} rows={[["(.25,.5,.25)", 1.5, 2], ['Uniform (⅓,⅓,⅓)', number(Math.log2(3), 6), number(Math.log2(3) + 1 / 3, 6)]]} /><p>Both satisfy mean 1. The uniform law wins for Shannon entropy; the base-weighted law wins for the explicitly changed relative objective.</p></Figure>;
}
