import { useState } from 'react';
import { binaryEntropyState, SOURCE } from '../../data/entropy-reading-models.js';
import { Figure, Key, Drawing, Arrow, Axis, Curve, Mark, Strip, Table, Range, Controls, COLORS, number } from './EntropyDrawingElements.jsx';
const H = p => p === 0 || p === 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
export function SourceLaw() {
  return <Figure id="E01" title="A law and one constructed message"><Key /><Strip title="Probability law: one whole divided into eight equal cells" values={SOURCE} /><div className="en-law-cells" aria-label="Eight equal probability cells: four A, two B, one C, one D">{[...'AAAABBCD'].map((s, i) => <span key={i} style={{
        background: COLORS['ABCD'.indexOf(s)]
      }}>{s}</span>)}</div><p>One deliberately constructed message; each cell is an indexed observation.</p><div className="en-indexed">{[...'AAAABBCD'].map((s, i) => <span key={i} style={{
        '--identity': COLORS['ABCD'.indexOf(s)]
      }}>{s}<small>{i + 1}</small></span>)}</div></Figure>;
}
export function Halving() {
  return <Figure id="E02" title="Three halvings isolate one of eight"><Drawing label="Nested sets with eight, four, two and one selected cells" height={280}>{[8, 4, 2, 1].map((n, i) => <g key={n}>{Array.from({
          length: 8
        }, (_, k) => <rect key={k} x={95 + k * 39} y={24 + i * 62} width="35" height="22" fill={k < n ? COLORS[0] : '#ffffff08'} stroke="#888" />)}<text x="20" y={42 + i * 62}>{i}</text><text x="95" y={72 + i * 62}>{['1', '½', '¼', '⅛'][i]} probability</text></g>)}</Drawing><p>Left index: binary depth, in bits. Probability ticks are logarithmically spaced: each row halves the selected set.</p></Figure>;
}
export function ProductTree() {
  return <Figure id="E03" title="Conditional branches multiply; their information adds"><p>Two equally likely choices, followed by four equally likely choices.</p><Drawing label="A root splits into two, each branch splits into four. One path has factors one half and one quarter." minWidth={0} height={250}><Mark x={240} y={20} />{[0, 1].map(a => <g key={a}><Arrow x1={240} y1={26} x2={120 + 240 * a} y2={93} color={a === 0 ? COLORS[0] : '#888'} /><text x={155 + 135 * a} y={56}>½</text><circle cx={120 + 240 * a} cy="100" r="5" fill={a === 0 ? COLORS[0] : '#aaa'} />{[0, 1, 2, 3].map(b => <g key={b}><Arrow x1={120 + 240 * a} y1={105} x2={40 + 240 * a + b * 50} y2={190} color={a === 0 && b === 0 ? COLORS[0] : '#888'} /><circle cx={40 + 240 * a + b * 50} cy="194" r="4" fill={a === 0 && b === 0 ? COLORS[0] : '#aaa'} /></g>)}</g>)}<text x="5" y="158">¼</text></Drawing><p className="en-status">Selected path: ½ × ¼ = ⅛; 1 + 2 = 3 bits.</p><p>A different experiment: copy the first fair bit.</p><Drawing label="A fair bit chooses zero or one; a copied bit has only its identical child, conditional probability one" minWidth={0} height={190}><circle cx="240" cy="15" r="5" fill="#ddd" />{[0, 1].map(a => <g key={a}><Arrow x1={240} y1={20} x2={100 + 280 * a} y2={67} /><text x={150 + 140 * a} y="45">½</text><text x={100 + 280 * a} y="88" textAnchor="middle">{a}</text><Arrow x1={100 + 280 * a} y1={96} x2={100 + 280 * a} y2={144} color={COLORS[a]} /><text x={120 + 280 * a} y="130">1</text><text x={100 + 280 * a} y="174" textAnchor="middle">{a}{a}</text></g>)}</Drawing><p>For 00: ½ × 1 = ½; 1 + 0 = 1 bit. No new branch choice is made by the copy.</p></Figure>;
}
export function Units() {
  return <Figure id="E04" title="Two rulers for the same event"><Drawing label="Bit and nat rulers aligned at probabilities one, one half, one quarter and one eighth" height={205}>{[0, 1].map(row => <g key={row}><line x1="45" y1={45 + row * 85} x2="420" y2={45 + row * 85} stroke="#aaa" />{[0, 1, 2, 3].map(n => <g key={n}><line x1={45 + n * 125} y1={39 + row * 85} x2={45 + n * 125} y2={51 + row * 85} stroke={n === 3 ? COLORS[0] : '#aaa'} /><text x={45 + n * 125} y={78 + row * 85} textAnchor="middle">{row ? number(n * Math.LN2, 3) : n}</text>{row === 0 && <line x1={45 + n * 125} y1="84" x2={45 + n * 125} y2="123" stroke="#777" strokeDasharray="3 3" />}</g>)}</g>)}</Drawing><p>Top: bits. Bottom: nats. Each aligned pair denotes the same probability.</p><div className="en-steps"><span>p = ½ → 1 bit</span>→<span>¼ → 2</span>→<span>⅛ → 3</span>→<span>…</span>↗</div><p>As positive p approaches zero, surprisal has no finite upper endpoint.</p></Figure>;
}
export function ContributionAreas({
  probabilities = SOURCE,
  labels = ['A', 'B', 'C', 'D']
}) {
  return <>{probabilities.map((p, i) => {
      const surprise = p ? -Math.log2(p) : Infinity,
        area = p ? p * surprise : 0;
      return <div key={i}><p><b style={{
            color: COLORS[i]
          }}>{labels[i]}</b>: width {number(p)} × price {number(surprise)} = {number(area)} bits</p><Drawing label={`${labels[i]} probability width ${p}, surprise height ${surprise}, area ${area}`} height={135}><path d="M45 15V110H435" fill="none" stroke="#888" />{p > 0 && <rect x="45" y={110 - Math.min(surprise, 4) * 22} width={p * 390} height={Math.min(surprise, 4) * 22} fill={COLORS[i]} fillOpacity=".55" stroke={COLORS[i]} />}<text x="45" y="132">0</text><text x="435" y="132" textAnchor="end">p = 1</text>{surprise > 4 && <text x="55" y="25">{p === 0 ? 'Excluded event: weighted cost 0' : 'Price continues above 4 bits ↑'}</text>}</Drawing></div>;
    })}<p>Every rectangle uses the same horizontal 0–1 probability ruler and vertical 0–4 bit price ruler.</p></>;
}
export function Expectation() {
  return <Figure id="E05" title="Areas add to the weighted average"><ContributionAreas /><Strip title="Summed contributions: total 1.75 bits" values={[.5, .5, .375, .375]} capacity={1.75} /><p>The unweighted mean 2.25 gives each category one quarter of the weight; that describes a different law.</p></Figure>;
}
export function Coin() {
  const [p, setP] = useState(.9),
    s = binaryEntropyState(p);
  return <Figure id="E06" title="Investigate a biased coin"><Key labels={['Heads', 'Tails']} /><ContributionAreas probabilities={[p, 1 - p]} labels={['Heads', 'Tails']} /><Drawing label={`Binary entropy curve. Heads probability ${p}, entropy ${s.entropy} bits.`}><Axis xLabel="heads probability" yLabel="H, bits" /><Curve points={s.curve} /><path d={`M${45 + p * 390},190V${190 - s.entropy * 155}H45`} fill="none" stroke="#aaa" strokeDasharray="4 4" /><Mark x={45 + p * 390} y={190 - s.entropy * 155} /><text x="45" y="218">0</text><text x="435" y="218" textAnchor="end">1</text><text x="22" y="43">1</text></Drawing><p className="en-status" aria-live="polite">H = {number(s.entropy, 6)} bits. Weighted heads {number(s.rows[0].entropy, 6)} + weighted tails {number(s.rows[1].entropy, 6)}.</p><Controls onReset={() => setP(.9)}><Range label="Heads probability" value={p} onChange={setP} /><button onClick={() => setP(1 - p)}>Swap heads and tails probabilities</button></Controls></Figure>;
}
export function Concavity() {
  return <Figure id="E07" title="A single summand and a mixed law"><p>Single summand g(p) = −p ln p, in nats.</p><Drawing label="Concave single entropy summand with its limit zero at p zero"><Axis yLabel="g, nats" xLabel="p" /><Curve points={Array.from({
        length: 101
      }, (_, i) => [i / 100, i === 0 ? 0 : -i / 100 * Math.log(i / 100)])} yDomain={[0, .4]} /><Mark x={45} y={190} /><text x="45" y="220">0</text><text x="435" y="220" textAnchor="end">1</text></Drawing><p>Binary entropy H₂(p), in bits. Mixing the two certain laws gives the fair law.</p><Drawing label="Binary entropy above the zero chord joining two certain endpoint distributions"><Axis yLabel="H₂, bits" xLabel="p" /><Curve points={Array.from({
        length: 101
      }, (_, i) => [i / 100, H(i / 100)])} /><line x1="45" y1="190" x2="435" y2="190" stroke={COLORS[1]} strokeWidth="4" /><Mark x={240} y={35} /><line x1="240" y1="190" x2="240" y2="40" stroke={COLORS[0]} strokeDasharray="5 4" /><text x="45" y="220">0</text><text x="240" y="220" textAnchor="middle">½</text><text x="435" y="220" textAnchor="end">1</text></Drawing><p>The endpoint chord is zero; its midpoint mixture has entropy 1 bit.</p></Figure>;
}
