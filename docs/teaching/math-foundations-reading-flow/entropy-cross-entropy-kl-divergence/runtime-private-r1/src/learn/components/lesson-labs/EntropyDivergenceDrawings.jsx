import { useState } from 'react';
import { SOURCE, MODEL, informationState, supportState, numericDraft } from '../../data/entropy-reading-models.js';
import { Figure, Key, Drawing, Arrow, Axis, Curve, Mark, Table, Strip, Bars, CostGap, Controls, Range, Draft, Choice, COLORS, number } from './EntropyDrawingElements.jsx';
function parseFour(text) {
  const parts = text.trim().split(/[\s,]+/);
  if (parts.length !== 4) throw Error('Enter four nonnegative weights in A, B, C, D order.');
  const v = parts.map((p, i) => numericDraft(p, 0, 100, 'Weight ' + 'ABCD'[i]));
  informationState(v);
  return v;
}
export function PriceRows({
  s = informationState(SOURCE, MODEL),
  unit = 'bits'
}) {
  return <><Key /><div className="en-split"><Strip title="P supplies outcomes; solid strip" values={s.p} /><Strip title="Q supplies prices; dashed model outline" values={s.q} dashed /></div><Table caption={`Follow each identity from mass to cost (${unit})`} headers={['Outcome', 'P', 'Q', '−log Q', 'P × price', 'P log(P/Q)']} rows={s.rows.map(r => [r.label, number(r.p), number(r.q), number(r.price), number(r.crossEntropy), number(r.kl)])} /><Bars rows={s.rows.map(r => ({
      label: r.label,
      value: r.crossEntropy
    }))} maximum={4} title="Weighted model prices" unit={unit} /></>;
}
export function CrossPrices() {
  return <Figure id="E13" title="Outcomes come from P; prices come from Q"><PriceRows /><div className="en-steps"><span>A: 1.5</span>+<span>B: .75</span>+<span>C: .25</span>+<span>D: .125</span>=<span>2.625 bits</span></div></Figure>;
}
export function DivergenceLab() {
  const [p, setP] = useState([4, 2, 1, 1]),
    [q, setQ] = useState([1, 1, 2, 4]),
    [unit, setUnit] = useState('bits'),
    s = informationState(p, q, unit === 'bits' ? 2 : Math.E);
  return <Figure id="E14" title="Investigate source weights and model weights"><PriceRows s={s} unit={unit} /><Bars signed maximum={2} rows={s.rows.map(r => ({
      label: r.label,
      value: r.kl
    }))} title="Signed row contributions to KL" unit={unit} /><CostGap title="Source entropy and model cost" entropy={s.entropy} total={s.crossEntropy} parts={[{
      label: "KL mismatch",
      value: s.kl
    }]} unit={unit} /><p aria-live="polite" className="en-status">H = {number(s.entropy, 8)}; cross-entropy = {number(s.crossEntropy, 8)}; KL = {number(s.kl, 8)} {unit}. Individual KL rows can be negative; the normalized total cannot.</p><Controls onReset={() => {
      setP([4, 2, 1, 1]);
      setQ([1, 1, 2, 4]);
      setUnit('bits');
    }}><Draft label="Source weights A B C D" value={p.join(', ')} parse={parseFour} onApply={setP} /><Draft label="Model weights A B C D" value={q.join(', ')} parse={parseFour} onApply={setQ} /><Choice label="Information unit" value={unit} onChange={setUnit} options={['bits', 'nats'].map(s => [s, s])} /><button onClick={() => setQ([...p])}>Match model to source</button><button onClick={() => {
        setP(q);
        setQ(p);
      }}>Reverse source and model</button></Controls></Figure>;
}
export function MissingSupport() {
  const [b, setB] = useState(.5),
    [qB, setQB] = useState(0),
    [alpha, setAlpha] = useState(0),
    s = supportState(b, qB, alpha);
  return <Figure id="E15" title="A missing model slot cannot price an observed event"><Key /><Strip title="Source probabilities" values={s.original.p} /><p>Original model weights: (1, {number(qB)}, 0, 0).</p><Strip title="Original normalized Q" values={s.original.q} /><Drawing label="Source B points into its model probability slot; missing support is explicitly empty" height={140}><Mark x={65} y={65} index={1} size={10} /><Arrow x1={80} y1={65} x2={265} y2={65} color={COLORS[1]} /><rect x="280" y="30" width="130" height="70" fill={qB === 0 ? 'none' : COLORS[1]} fillOpacity=".3" stroke={COLORS[1]} strokeDasharray={qB === 0 ? '6 4' : undefined} /><text x="345" y="75" textAnchor="middle">Q(B)={number(s.original.q[1], 3)}</text></Drawing><p>Original B term: {b === 0 ? 'zero source weight → weighted cost 0' : qB === 0 ? 'positive source mass × excluded model event → ∞' : `${number(s.original.rows[1].crossEntropy)} bits`}.</p><Strip title={`Changed model: add α=${number(alpha)} to every weight, then normalize`} values={s.changed.q} /><Table caption="Original and explicitly changed model" headers={['Model', 'Cross-entropy', 'KL']} rows={[["Original", number(s.original.crossEntropy), number(s.original.kl)], ['Smoothed', number(s.changed.crossEntropy), number(s.changed.kl)]]} /><Controls onReset={() => {
      setB(.5);
      setQB(0);
      setAlpha(0);
    }}><Range label="Source probability of B" value={b} onChange={setB} /><Draft label="Original model weight B" value={qB} parse={t => numericDraft(t, 0, 100, 'Model weight B')} onApply={setQB} /><Range label="Pseudocount alpha" value={alpha} onChange={setAlpha} /></Controls></Figure>;
}
export function WeightContract() {
  return <Figure id="E16" title="Weights and probabilities are different input contracts"><div className="en-steps"><span>Raw weights (2, 1)</span>→<span>Total 3</span>→<span>Divide each by 3</span></div><Strip title="Normalized probabilities" labels={['first', 'second']} values={[2 / 3, 1 / 3]} /><Drawing label="A strict probability API rejects a vector whose total is three; a weights API explicitly normalizes it" height={130}><text x="30" y="35">(2, 1)</text><Arrow x1={120} y1={30} x2={210} y2={30} /><path d="M230 18L250 42M250 18L230 42" stroke={COLORS[3]} strokeWidth="3" /><text x="275" y="37">sum ≠ 1</text><text x="30" y="104">(⅔, ⅓)</text><Arrow x1={140} y1={98} x2={260} y2={98} /><text x="285" y="104">sum = 1</text></Drawing><p>A strict probability API rejects the first vector. The live weight editors above explicitly normalize it; malformed drafts leave the active drawing unchanged.</p></Figure>;
}
export function LogBound() {
  const pts = Array.from({
    length: 100
  }, (_, i) => [.1 + i * 2.9 / 99, Math.log(.1 + i * 2.9 / 99)]);
  return <Figure id="E17" title="A tangent line stays above the logarithm"><Drawing label="Natural logarithm and its tangent t minus one, touching at t one" height={270}><Axis y={215} height={170} xLabel="t > 0" yLabel="value" /><Curve points={pts} xDomain={[0, 3]} yDomain={[-2.5, 2]} y={215} height={170} /><Curve points={[[.1, -.9], [3, 2]]} xDomain={[0, 3]} yDomain={[-2.5, 2]} y={215} height={170} color={COLORS[1]} dash /><line x1="305" y1={215 - (Math.log(2) + 2.5) / 4.5 * 170} x2="305" y2={215 - 3.5 / 4.5 * 170} stroke={COLORS[2]} strokeWidth="4" /><Mark x={175} y={215 - 2.5 / 4.5 * 170} /><text x="175" y="245" textAnchor="middle">1</text><text x="305" y="245" textAnchor="middle">2</text></Drawing><Key labels={['ln t', 't − 1', 'gap at t = 2']} /><p>At t=1 both values and slopes agree. At t=2 the gap is 1−ln2 ≈ .306853.</p></Figure>;
}
export function SupportProof() {
  return <Figure id="E18" title="Summing over the source support leaves model mass outside"><Key /><Strip title="P=(½,½,0,0); support S={A,B}" values={[.5, .5, 0, 0]} /><Strip title="Q=(¼,¼,¼,¼); Q(S)=½" values={[.25, .25, .25, .25]} /><Drawing label="The A and B model slots lie inside source support; C and D lie outside it" height={150}><rect x="20" y="25" width="220" height="65" fill="none" stroke={COLORS[0]} strokeWidth="2" /><rect x="250" y="25" width="210" height="65" fill="none" stroke="#aaa" strokeDasharray="6 4" />{[0, 1, 2, 3].map(i => <g key={i}><Mark x={75 + 110 * i} y={55} index={i} size={8} /><text x={75 + 110 * i} y="80" textAnchor="middle">{'ABCD'[i]}</text></g>)}<text x="130" y="125" textAnchor="middle">inside S</text><text x="350" y="125" textAnchor="middle">outside S</text></Drawing><Table caption="The pointwise natural-log bound multiplied by P" headers={['Source row', 'P ln(P/Q)', 'P − Q']} rows={[["A", number(.5 * Math.log(2)), .25], ['B', number(.5 * Math.log(2)), .25], ['Sum', number(Math.log(2)), .5]]} /><p>D(P‖Q) ≥ 1−Q(S)=.5 nats. Equality at zero requires both Q=P on the support and no leftover model mass outside it.</p></Figure>;
}
export function CrossCurve() {
  const hp = informationState([.8, .2]).entropy,
    points = Array.from({
      length: 99
    }, (_, i) => {
      const q = (i + 1) / 100;
      return [q, -.8 * Math.log2(q) - .2 * Math.log2(1 - q)];
    });
  return <Figure id="E19" title="Vary the model; keep the source fixed"><Drawing label="Cross-entropy curve for P .8 .2, bounded below by source entropy. Endpoint costs diverge." height={270}><Axis xLabel="Q(first outcome)" yLabel="bits" y={215} height={175} /><Curve points={points} yDomain={[0, 4]} y={215} height={175} /><line x1="45" x2="435" y1={215 - hp / 4 * 175} y2={215 - hp / 4 * 175} stroke={COLORS[1]} strokeDasharray="6 4" /><Mark x={357} y={215 - hp / 4 * 175} /><line x1="240" x2="240" y1={215 - 1 / 4 * 175} y2={215 - hp / 4 * 175} stroke={COLORS[2]} strokeWidth="4" /><Arrow x1={48} y1={60} x2={48} y2={20} color={COLORS[0]} /><Arrow x1={434} y1={155} x2={434} y2={20} color={COLORS[0]} /><text x="45" y="245">0</text><text x="240" y="245" textAnchor="middle">.5</text><text x="357" y="245" textAnchor="middle">.8</text><text x="435" y="245" textAnchor="end">1</text></Drawing><Key labels={['Cross-entropy', 'H(P) floor', 'Gap at Q=.5']} /><p>H(P)=.721928 bits. The uniform model costs 1 bit, leaving .278072 bits of KL. Endpoints exclude a positive source event and have infinite cost; arrows denote continuation beyond the displayed range.</p></Figure>;
}
export function UniformBound() {
  return <Figure id="E20" title="Uniform prices expose the finite-alphabet ceiling"><Key /><Strip title="Source P" values={SOURCE} /><Strip title="Uniform Q: every event costs 2 bits" values={[.25, .25, .25, .25]} /><Bars title="2-bit budget accounting" maximum={2} rows={[{
      label: 'H(P)',
      value: 1.75,
      color: COLORS[0]
    }, {
      label: 'KL',
      value: .25,
      color: COLORS[1]
    }, {
      label: 'H + KL',
      value: 2,
      color: '#bbb'
    }]} /><p>The same four source-weighted uniform prices sum to 2 = 1.75 + .25 bits.</p></Figure>;
}
export function Direction() {
  return <Figure id="E23" title="Reverse the expectation, reverse the support test"><div className="en-split"><Strip title="P" labels={['first', 'second']} values={[1, 0]} /><Strip title="Q" labels={['first', 'second']} values={[.5, .5]} /></div><Drawing label="Forward source P uses only the first Q price; reverse source Q also visits P's zero second slot" height={240}><Mark x={70} y={45} /><Arrow x1={85} y1={45} x2={365} y2={45} color={COLORS[0]} /><text x="225" y="30" textAnchor="middle">P → Q</text><text x="390" y="53">1</text><Mark x={70} y={155} index={1} /><Arrow x1={85} y1={155} x2={365} y2={155} color={COLORS[1]} /><text x="225" y="140" textAnchor="middle">Q → P</text><text x="390" y="164">∞</text></Drawing><p>Forward D(P‖Q)=1 bit. Reverse Q assigns positive mass to the second event, whose P price is infinite.</p></Figure>;
}
export function TriangleFailure() {
  const d = (p, q) => informationState([p, 1 - p], [q, 1 - q], Math.E).kl;
  return <Figure id="E24" title="Directed costs do not obey a triangle inequality"><Drawing label="Bernoulli point one, point five and point nine joined by directed KL cost edges. Geometry is not a distance scale." height={270}><Mark x={65} y={190} /><Mark x={240} y={45} index={1} /><Mark x={415} y={190} index={2} /><Arrow x1={75} y1={180} x2={228} y2={55} /><Arrow x1={250} y1={55} x2={405} y2={180} /><Arrow x1={78} y1={205} x2={400} y2={205} color={COLORS[3]} /><text x="65" y="235" textAnchor="middle">.1</text><text x="240" y="28" textAnchor="middle">.5</text><text x="415" y="235" textAnchor="middle">.9</text></Drawing><Table caption="KL costs in nats; positions do not encode cost" headers={['Directed path', 'Cost']} rows={[[".1 → .5", number(d(.1, .5), 9)], ['.5 → .9', number(d(.5, .9), 9)], ['via .5 total', number(d(.1, .5) + d(.5, .9), 9)], ['.1 → .9 direct', number(d(.1, .9), 9)]]} /><p>Direct 1.757780 exceeds the two-edge sum .878890. KL is not a metric distance.</p></Figure>;
}
export function InfiniteTail() {
  const points = Array.from({
      length: 79
    }, (_, i) => {
      const k = i + 2;
      return [k, 1 / (k * Math.log(k) ** 2)];
    }),
    prices = points.map(([k]) => [k, 1 / (k * Math.log(k))]);
  return <Figure id="E25" title="A finite picture cannot settle an infinite tail"><Drawing label="Illustrative first 79 tail terms comparing inverse k log squared k with inverse k log k" height={255}><Axis yLabel="unnormalized term" xLabel="k (finite window)" /><Curve points={points} xDomain={[2, 80]} yDomain={[0, 1.1]} /><Curve points={prices} xDomain={[2, 80]} yDomain={[0, 1.1]} color={COLORS[1]} dash /><text x="45" y="220">2</text><text x="435" y="220" textAnchor="end">80</text></Drawing><Key labels={['1/(k ln²k)', '1/(k ln k)']} /><p>The first tail has a finite integral; its log-price-weighted tail behaves like the second, whose integral diverges. Those analytic tail statements, not this finite window, establish the infinite expectation.</p><div className="en-steps"><span>Q = P</span>→<span>log(P(k)/Q(k)) = 0</span>→<span>sum of exact zeros = 0</span></div><p>Compute self-divergence from its ratio definition; “∞−∞” is not an arithmetic calculation.</p></Figure>;
}
