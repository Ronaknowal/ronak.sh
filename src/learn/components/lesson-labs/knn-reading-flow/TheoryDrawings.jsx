import { useState } from 'react';
import { cases, independentQueryOutcomes, radius, shares, votes } from "../../../data/knn-reading-flow-model.js";
import { Figure, Table, Numeric, Choices, Map, Scene, Steps, Matrix, Bars, num, Legend } from "./DrawingParts.jsx";
function MajorityGroup({
  decision
}) {
  const patterns = Array.from({
    length: 8
  }, (_, mask) => {
    const bits = [0, 1, 2].map(i => mask >> i & 1);
    return {
      bits,
      probability: bits.reduce((p, b) => p * (b ? .8 : .2), 1),
      majority: Number(bits.reduce((s, b) => s + b, 0) >= 2)
    };
  }).filter(row => row.majority === decision);
  return <Scene label={'Reference outcomes merged into majority ' + decision} width={440} height={275}>{patterns.map((row, i) => <g key={i}>{row.bits.map((bit, j) => <g key={j}><circle cx={35 + j * 32} cy={35 + i * 48} r={12} fill={bit ? '#59412a' : '#222'} stroke="#aaa" /><text x={35 + j * 32} y={40 + i * 48} textAnchor="middle">{bit}</text></g>)}<text x={128} y={40 + i * 48}>{num(row.probability)}</text><path d={'M200,' + (35 + i * 48) + 'H240V107H295'} stroke="#888" fill="none" /></g>)}<circle cx={325} cy={107} r={30} fill="#222" stroke="#e5ad52" /><text x={325} y={112} textAnchor="middle">A={decision}</text><text x={280} y={165}>mass {decision ? .896 : .104}</text><text x={15} y={255}>Three independent reference labels → majority</text></Scene>;
}
function QueryBranch({
  decision,
  mass
}) {
  return <Scene label={'Independent query split after majority ' + decision} width={420} height={305}><circle cx={210} cy={40} r={25} fill="#222" stroke="#aaa" /><text x={210} y={45} textAnchor="middle">A={decision}</text><text x={210} y={88} textAnchor="middle">P(A)={mass}</text><path d="M210,96V115H85V150M210,115H335V150" stroke="#888" fill="none" />{[0, 1].map((query, i) => {
      const x = i ? 335 : 85,
        probability = query ? .8 : .2,
        error = query !== decision;
      return <g key={query}><circle cx={x} cy={170} r={25} fill={error ? '#59412a' : '#222'} stroke={error ? '#e5ad52' : '#aaa'} /><text x={x} y={175} textAnchor="middle">Yq={query}</text><text x={x} y={215} textAnchor="middle">P(Yq)={probability}</text><path d={'M' + x + ',222V242'} stroke="#888" /><text x={x} y={267} textAnchor="middle">{num(mass * probability)}</text><text x={x} y={297} textAnchor="middle">{error ? 'mismatch' : 'match'}</text></g>;
    })}</Scene>;
}
export function NoiseFigure() {
  const outcomes = independentQueryOutcomes(.8);
  return <Figure id="D26" label="Independent reference and query labels produce predictive risk" caption="All areas and branch products are calculated under η=0.8. Bayes predicts1 and has query error0.2. Majority disagreement with that fixed Bayes class0.104 is a different event from majority-versus-query risk0.2624."><div className="knf-scroll" tabIndex={0} role="region" aria-label="Joint probability areas; horizontally scrollable"><div className="knf-outcome-mosaic" aria-label="Single reference/query joint probabilities: match .64/.04, mismatches .16/.16"><div style={{
          width: '80%'
        }}><span style={{
            height: '80%'
          }}>1 / 1: .64</span><span className="error" style={{
            height: '20%'
          }}>1 / 0: .16</span></div><div style={{
          width: '20%'
        }}><span className="error" style={{
            height: '80%'
          }}>0 / 1: .16</span><span style={{
            height: '20%'
          }}>0 / 0: .04</span></div></div></div><p>Horizontal width=P(reference); vertical height=P(query). The two mismatch areas sum0.32. η=0.5 gives0.5; η=1 gives0.</p><div className="knf-panels"><MajorityGroup decision={1} /><MajorityGroup decision={0} /></div><div className="knf-panels"><QueryBranch decision={1} mass={.896} /><QueryBranch decision={0} mass={.104} /></div><Steps items={['Mismatch routes:0.896×0.2=0.1792 and0.104×0.8=0.0832', 'Sum predictive risk:0.1792+0.0832=0.2624', 'Matching routes:0.7168+0.0208; all four routes total1', 'Bayes action1 → independent query0: probability0.2']} /><Table caption="All16 reference/query outcomes (model probabilities)" headers={['reference bits', 'query', 'probability', 'majority', 'disagrees with Bayes1?', 'query mistake?']} rows={outcomes.map(row => [row.bits.slice(0, 3).join(''), row.bits[3], num(row.probability, 4), row.majority, row.majority !== 1 ? 'yes' : 'no', row.error ? 'yes' : 'no'])} /></Figure>;
}
export function RiskAggregateFigure() {
  return <Figure id="D27" label="Average query risks across two feature regions" caption="Equal region masses average query-label predictive risks. Local identities and the integrated upper bound differ; the majority-versus-Bayes event0.104 is not substituted for query risk."><div className="knf-panels"><Bars max={.5} rows={[['η=.1 Bayes', .1], ['η=.1 1NN', .18]]} /><Bars max={.5} rows={[['η=.8 Bayes', .2], ['η=.8 1NN', .32]]} /></div><Steps items={['Bayes:½×0.1+½×0.2=0.15', 'Independent 1-label:½×0.18+½×0.32=0.25', 'Concave bound at average:2×0.15×0.85=0.255', 'E[2r(1−r)] ≤ 2E[r](1−E[r]); unequal local r makes this example strict']} /><Matrix label="Multiclass probabilities → independent disagreement" rows={[['p₁', 'p₂', '…', 'p_C'], ['p₁²', 'p₂²', '…', 'p_C²'], ['1 − sum of squares']]} /></Figure>;
}
export function ConsistencyFigure() {
  return <Figure id="D28" label="Growing local count and shrinking sample fraction" caption="Illustrative nested reference clouds explain two jobs; no empirical rate curve is fabricated. The algebra below is the stated smooth interior regression model."><div className="knf-panels">{[[12, 3, 95], [48, 6, 65]].map(([n, k, r], i) => <Scene key={n} label={'Illustration n' + n + ' k' + k} width={280} height={300}><circle cx={140} cy={120} r={r} fill="none" stroke="#e5ad52" />{Array.from({
          length: n
        }, (_, j) => {
          const angle = j * 2.399963,
            radius = j < k ? 20 + (r - 35) * Math.sqrt(j / k) : r + 10 + (105 - r) * Math.sqrt((j - k) / (n - k));
          return <circle key={j} cx={140 + Math.cos(angle) * radius} cy={120 + Math.sin(angle) * radius} r={3} fill="#aaa" />;
        })}<path d="M133,113l14,14m-14,0l14,-14" stroke="white" /><text x={25} y={280}>n={n}, k={k}; fraction {num(k / n)}</text></Scene>)}</div><Steps items={['k grows → average more independent label noise', 'k/n shrinks → locality can improve', 'Variance order1/k; squared bias order(k/n)^(4/d)', 'Set equal orders: k^(1+4/d) ~ n^(4/d)', 'k ~ n^(4/(d+4)) under smooth/density/interior assumptions']} /></Figure>;
}
export function GeographyFigure() {
  return <Figure id="D29" label="Longitude seam and shortest spherical arc" caption="179.8° east and−179.9° west differ by0.3° along the wrapped short arc. Degrees convert to radians before the haversine calculation; R=6371km is spherical, not ellipsoidal."><Scene label="Actual date-line arc on longitude circle" width={420} height={335}><circle cx={210} cy={150} r={105} fill="none" stroke="#aaa" /><path d="M210,40V260" stroke="#666" strokeDasharray="3 4" /><circle cx={205} cy={45} r={5} fill="#e5ad52" /><circle cx={214} cy={45} r={5} fill="#91b4d8" /><path d="M205,40Q210,32 214,40" stroke="#e5ad52" strokeWidth={3} fill="none" /><text x={25} y={22}>q179.8°E</text><text x={250} y={22}>station179.9°W</text><text x={65} y={293}>Short arc0.3° · schematic separation enlarged</text><text x={65} y={326}>0.3×π/180 radians ×6371 ≈33.358km</text></Scene><Steps items={['Raw printed subtraction:359.7° (wrong seam route)', 'Wrapped equatorial central angle:0.3°', 'a=sin²(Δlatitude/2)+cos(latitude₁)cos(latitude₂)sin²(Δlongitude/2)', 'angle=2 atan2(√a,√(1−a)); distance=R×angle']} /></Figure>;
}
export function JointTargetsFigure() {
  return <Figure id="D30" label="One selected neighbor set supplies two target coordinates" caption="The separate temperature analogy uses query24 between reference20 and30. Inverse-distance shares0.6/0.4 feed both target coordinates, producing pressure120 and load6. No face-completion fit is claimed."><Matrix label="Reference rows: [temperature, pressure, load]" rows={[[20, 100, 4], [30, 150, 9]]} /><Steps items={['Query24 → distances4,6 → normalized inverse shares0.6,0.4', <div><Matrix label="Reference share, pressure, load" rows={[[.6, 100, 4], [.4, 150, 9]]} /><p>Pressure: 0.6×100 + 0.4×150 = 60+60. Load: 0.6×4 + 0.4×9 = 2.4+3.6.</p><Matrix label="Sum shared-weight products into [pressure, load]" rows={[[.6 * 100 + .4 * 150, .6 * 4 + .4 * 9]]} /></div>, <span>prediction[2]=[pressure120, load6]</span>]} /><Scene label="Structured output analogy: observed top and predicted bottom" width={300} height={230}><rect x={75} y={25} width={150} height={90} fill="#30445a" stroke="#aaa" /><rect x={75} y={115} width={150} height={90} fill="#59412a" stroke="#aaa" /><path d="M110,80Q150,50 190,80M125,145Q150,175 175,145" stroke="#ddd" fill="none" /><text x={85} y={45}>upper pixels: input</text><text x={85} y={195}>lower pixels: target</text></Scene></Figure>;
}
export function LearnedSimilarityFigure() {
  return <Figure id="D31" label="Forest leaf blocks and supplied linear metric transform" caption="Three normalized one-hot blocks create a Gram similarity. The separate L=diag(1,0.2) is provided, not learned; identity preserves geometry, while a rank-deficient projection makes a pseudometric on original inputs."><Matrix label="Tree1/2/3 leaf one-hot blocks (divide every entry by√3)" rows={[[1, 0, '|', 0, 1, '|', 1, 0], [1, 0, '|', 1, 0, '|', 1, 0]]} /><Steps items={['Both vectors: squared norm3×(1/3)=1', 'Two shared leaves: dot product Π=2/3', 'Squared Euclidean distance=1+1−2Π=2/3']} /><div className="knf-panels"><Matrix label="Provided L → transformed difference" rows={[[1, 0], [0, .2], ['Δ=(1,5) → (1,1)']]} /><Scene label="Original and compressed coordinate arrows" width={340} height={280}><path d="M45,235H290M45,235V30" stroke="#777" /><path d="M45,235L85,35" stroke="#91b4d8" strokeWidth={3} /><path d="M45,235L85,195" stroke="#e5ad52" strokeWidth={3} /><text x={95} y={50}>original(1,5)</text><text x={95} y={195}>LΔ=(1,1)</text><text x={45} y={267}>√26 → √2</text></Scene></div><Matrix label="Rank-deficient L=diag(1,0): distinct inputs coincide" rows={[[1, 0], [0, 0], ['(1,5),(1,9) → (1,0)']]} /></Figure>;
}
export function RadiusLab() {
  const [q, setQ] = useState([3.1, 2.9]),
    [r, setR] = useState(.2),
    [resetKey, setResetKey] = useState(0),
    report = radius(q, r);
  function reset() {
    setQ([3.1, 2.9]);
    setR(.2);
    setResetKey(x => x + 1);
  }
  return <Figure id="D32" label="Inclusive radius selection and empty support" caption="Selection uses d≤r. Radius0 can include exact matches; when nobody is selected, a target distribution is unavailable. Fixed k expands its extent until k rows enter."><Map query={q} radius={r} selected={report.selected} /><Legend /><Table caption="All rows: inclusive eligibility test" headers={['ID', 'distance', 'd≤r?', 'share']} rows={report.ranked.map(row => [row.id, num(row.distance), row.distance <= r ? 'yes' : 'no', report.selected.find(selected => selected.id === row.id)?.share ?? 'excluded'])} /><div className="knf-controls"><Numeric label="Radius query x₁" value={q[0]} min={0} max={6} onChange={v => setQ([v, q[1]])} resetKey={resetKey} /><Numeric label="Radius query x₂" value={q[1]} min={0} max={6} onChange={v => setQ([q[0], v])} resetKey={resetKey} /><Numeric label="Radius" value={r} min={0} max={3} onChange={setR} resetKey={resetKey} /><button type="button" onClick={reset}>Reset radius</button></div><p aria-live="polite">{report.winner === null ? 'Unavailable: empty support; no probabilities fabricated.' : 'Selected ' + report.selected.length + ' rows; decision ' + report.winner + '.'}</p>{report.winner && <Bars rows={report.totals.map(row => [row.label, row.value])} />}</Figure>;
}
export function DiagnosisFigure() {
  const rows = [{
      id: 'close',
      distance: .01,
      label: 'B'
    }, {
      id: 'near1',
      distance: 1,
      label: 'A'
    }, {
      id: 'near2',
      distance: 1,
      label: 'A'
    }],
    uniform = votes(shares(rows), ['A', 'B']),
    inverse = votes(shares(rows, 'distance'), ['A', 'B']);
  return <Figure id="D33" label="Close corrupted target and duplicated evidence" caption="An extremely close erroneous B target can dominate inverse weights while uniform voting remains A. Repeating one observation occupies multiple slots without creating independent information."><Matrix label="Actual rows: distance / recorded target" rows={rows.map(row => [row.id, row.distance, row.label])} /><div className="knf-panels"><Bars rows={uniform.totals.map(row => ['equal ' + row.label, row.value])} /><Bars rows={inverse.totals.map(row => ['inverse ' + row.label, row.value])} /></div><Matrix label="Copying close B: distinct row IDs, same event" rows={[['copy1', .01, 'B'], ['copy2', .01, 'B'], ['near1', 1, 'A']]} /><Table caption="Observation contract examples" headers={['observed row', 'problem', 'repair layer']} rows={[['time=2, energy=missing', 'zero encoding invents closeness', 'train-owned missing policy'], ['category=new device', 'unknown representation', 'declared encoding/support'], ['same ID across split', 'target leakage', 'observation/split ownership'], ['close wrong label', 'annotation corruption', 'target process'], ['later time period', 'changed similarity', 'deployment evaluation']]} /><p>Uniform original decision {uniform.winner}; inverse decision {inverse.winner}, B share {num(inverse.totals[1].value)}. The example diagnoses a mechanism, not a universal failure of distance weights or rare classes.</p></Figure>;
}
