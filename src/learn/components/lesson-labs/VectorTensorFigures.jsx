import { useId } from 'react';
import './vector-tensor-labs.css';

const f = value => String(value).replace(/-/g, '−');
export function MatrixDrawing({ values, label, rows, columns, mark }) {
  return <div className="vector-matrix-scroll" role="region" aria-label={label} tabIndex={0}>
    <table className="vector-value-matrix"><caption>{label}</caption>
      {columns && <thead><tr><th aria-label="row labels" />{columns.map(value => <th key={value} scope="col">{value}</th>)}</tr></thead>}
      <tbody>{values.map((row, i) => <tr key={i}>{rows && <th scope="row">{rows[i]}</th>}{row.map((value, j) => <td key={j} className={mark?.(i, j) ? 'is-selected' : ''}>{f(value)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function Plane({ label, domain = [-3, 4], arrows = [], segments = [], points = [] }) {
  const id = useId().replace(/:/g, '');
  const scale = 210 / (domain[1] - domain[0]);
  const xy = ([x, y]) => [38 + (x - domain[0]) * scale, 248 - (y - domain[0]) * scale];
  const origin = xy([0, 0]);
  const ticks = Array.from({ length: domain[1] - domain[0] + 1 }, (_, i) => domain[0] + i);
  return <svg className="vector-small-plane" viewBox="0 0 290 290" role="img" aria-label={label}>
    <title>{label}</title>
    <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="context-stroke" /></marker></defs>
    {ticks.map(t => <g key={t} className="vector-grid-line"><line x1={xy([t, 0])[0]} y1="38" x2={xy([t, 0])[0]} y2="248" /><line x1="38" y1={xy([0, t])[1]} x2="248" y2={xy([0, t])[1]} /></g>)}
    <path className="vector-coordinate-axis" d={`M25 ${origin[1]}H260M${origin[0]} 260V25`} />
    <text x="265" y={origin[1] + 4}>x</text><text x={origin[0] + 8} y="24">y</text>
    <text x={origin[0] - 15} y={origin[1] + 18}>0</text>
    {segments.map((s, i) => <g key={i}><line className={`vector-arrow ${s.kind || 'residual'}`} x1={xy(s.from)[0]} y1={xy(s.from)[1]} x2={xy(s.to)[0]} y2={xy(s.to)[1]} />{s.label && <text className="vector-label-halo" x={xy(s.at)[0]} y={xy(s.at)[1]}>{s.label}</text>}</g>)}
    {arrows.map((a, i) => { const start = xy(a.from || [0, 0]), end = xy(a.to); return <g key={i}><line className={`vector-arrow ${a.kind || 'original'}`} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} markerEnd={`url(#${id})`} /><text className="vector-label-halo" x={end[0] + (a.dx ?? 8)} y={end[1] + (a.dy ?? -10)} textAnchor={a.anchor || 'start'}>{a.label}</text></g>; })}
    {points.map((p, i) => <g key={i}><circle cx={xy(p.at)[0]} cy={xy(p.at)[1]} r="4" className={`vector-endpoint ${p.kind || 'original'}`} /><text className="vector-label-halo" x={xy(p.at)[0] + (p.dx ?? 8)} y={xy(p.at)[1] + (p.dy ?? -8)}>{p.label}</text></g>)}
  </svg>;
}

export function ShapeAnatomyFigure() {
  return <figure className="vector-inline-figure" aria-label="Coordinate movement, indexed orders, and two tensor session slices">
    <div className="vector-anatomy-grid">
      <div><p>Displacement · east/north, metres</p><Plane domain={[-1, 3]} label="Two metres east, then one metre north; displacement (2,1)." arrows={[{ to: [2, 1], label: '(2,1)' }]} segments={[{ from: [0, 0], to: [2, 0], label: 'east 2', at: [.4, -.5] }, { from: [2, 0], to: [2, 1], label: 'north 1', at: [2.12, .35] }]} /></div>
      <div><MatrixDrawing label="Orders X · shape (3,2)" values={[[2, 1], [0, 3], [1, 2]]} rows={['order 0', 'order 1', 'order 2']} columns={['small', 'large']} mark={(i, j) => i === 1 && j === 0} /><p>X[1,0]=0: order 1, small packs.</p></div>
    </div>
    <div className="vector-tensor-slices">{[0, 1].map(s => <MatrixDrawing key={s} label={`T · session ${s} slice`} values={[[0, 1, 2], [3, 4, 5]].map(row => row.map(v => v + 6 * s))} rows={['time 0', 'time 1']} columns={['c0', 'c1', 'c2']} mark={(t, c) => s === 1 && t === 0 && c === 2} />)}</div>
    <p>T[1,0,2]=8: session 1, time 0, channel 2. Two session slices × two time rows × three channel columns contain twelve values; c0/c1/c2 name channels. These are constructed index markers in one arbitrary unit.</p>
  </figure>;
}

export function BasisLengthFigure() {
  return <figure className="vector-inline-figure" aria-label="The displacement (2,1) decomposed into perpendicular steps; length square root of five metres">
    <Plane domain={[-1, 3]} label="Right triangle with east side 2 metres, north side 1 metre, and diagonal square root of 5 metres." arrows={[{ to: [2, 1], label: '√5 m', dx: -18, dy: -16, anchor: 'end' }]} segments={[{ from: [0, 0], to: [2, 0], label: '2e₁ · 2 m', at: [.3, -.45], kind: 'basis-one' }, { from: [2, 0], to: [2, 1], label: 'e₂ · 1 m', at: [2.12, .4], kind: 'basis-two' }, { from: [1.78, 0], to: [1.78, .22] }, { from: [1.78, .22], to: [2, .22] }]} />
    <p>e₁=(1,0) and e₂=(0,1) are unit directions. Two horizontal steps plus one vertical step give 2e₁+e₂=(2,1). Their perpendicular sides give length √(2²+1²)=√5 metres.</p>
  </figure>;
}

export function ProductKindsFigure() {
  return <figure className="vector-inline-figure" aria-label="Matching coordinate products compared with all outer pairs">
    <div className="vector-product-kinds">
      <div><MatrixDrawing label="Elementwise · retain each matched pair" values={[["2×3 = 6", "1×5 = 5"]]} /><p>Two positions survive: [6,5].</p></div>
      <div><MatrixDrawing label="Dot · sum the matched pairs" values={[["6 + 5 = 11"]]} /><p>One scalar: 11.</p></div>
      <div><MatrixDrawing label="Outer · each row meets every column" values={[["2×3 = 6", "2×5 = 10"], ["1×3 = 3", "1×5 = 5"]]} rows={['a₀=2', 'a₁=1']} columns={['b₀=3', 'b₁=5']} /><p>Both independent indices survive: shape (2,2).</p></div>
    </div>
  </figure>;
}

export function CompositionDrawing() {
  const rows = [
    { steps: [[1, 1], [2, 1], [-1, 2]], names: ['start', 'stretch horizontal ×2', 'quarter-turn'], result: 'R S x = (−1,2)' },
    { steps: [[1, 1], [-1, 1], [-2, 1]], names: ['same start', 'quarter-turn', 'stretch horizontal ×2'], result: 'S R x = (−2,1)' }
  ];
  return <figure className="vector-inline-figure" aria-label="Two three-stage geometric chains; stretch and rotation in opposite orders">
    {rows.map((row, r) => <div key={r} className="vector-composition-row">{row.steps.map((p, i) => <div key={i}><p>{i ? '→ ' : ''}{row.names[i]}</p><Plane label={`${row.names[i]}: ${p}`} domain={[-3, 3]} arrows={[{ to: p, label: `(${p.map(f).join(',')})`, dx: p[0] < 0 ? -10 : 8, anchor: p[0] < 0 ? 'end' : 'start' }]} /></div>)}<p className="vector-composition-result">{row.result}</p></div>)}
    <p>All six plots share equal physical axis scales and the same [−3,3] range. R rotates a quarter-turn; S doubles the horizontal coordinate. The rightmost matrix acts first.</p>
  </figure>;
}

export function RankLossFigure() {
  return <figure className="vector-inline-figure" aria-label="Collapse map with equal-output input line, a lost direction, reachable and unreachable output">
    <div className="vector-two-planes">
      <div><p>Input space · x₁+x₂=3</p><Plane domain={[-1, 4]} label="Distinct inputs (1,2) and (2,1) on x1+x2=3. Lost direction (1,-1) changes input along this line." segments={[{ from: [-1, 4], to: [4, -1], kind: 'basis-two' }]} points={[{ at: [1, 2], label: '(1,2)', dx: -45, dy: -10 }, { at: [2, 1], label: '(2,1)', dx: 8, dy: -10 }]} arrows={[{ to: [1, -1], label: 'lost (1,−1)', dx: 10, dy: 18 }]} /></div>
      <div><p>Output space · A=[[1,1],[0,0]]</p><Plane domain={[-1, 4]} label="Both inputs reach (3,0), on the horizontal column span; requested output (3,1) is unreachable." segments={[{ from: [-1, 0], to: [4, 0], kind: 'basis-two' }]} points={[{ at: [3, 0], label: '(3,0)', dx: -35, dy: 24 }, { at: [3, 1], label: '(3,1)', dx: 8, dy: -12, kind: 'basis-two' }]} /></div>
    </div><p>A(1,2)=A(2,1)=(3,0). Their difference (1,−1) maps to zero. The dashed horizontal output line is the entire reachable span; a point above it cannot be an exact output.</p>
  </figure>;
}

export function BroadcastCorrespondenceFigure() {
  return <figure className="vector-inline-figure" aria-label="Row means 6 and 9 applied wrongly to columns versus correctly to rows">
    <div className="vector-two-planes">
      <div><MatrixDrawing label="Wrong · shape (2,) aligns to columns" columns={['−6', '−9']} rows={['row 0', 'row 1']} values={[["2 − 6 = −4", "10 − 9 = 1"], ["4 − 6 = −2", "14 − 9 = 5"]]} /><p>Row means after subtraction: −1.5 and 1.5.</p></div>
      <div><MatrixDrawing label="Right · (2,1) retains row positions" columns={['column 0', 'column 1']} rows={['row 0 · −6', 'row 1 · −9']} values={[["2 − 6 = −4", "10 − 6 = 4"], ["4 − 9 = −5", "14 − 9 = 5"]]} /><p>Row means after subtraction: 0 and 0.</p></div>
    </div><p>The same offsets follow columns on the left and rows on the right. The singleton column position in (2,1) repeats each row’s own mean across its two features.</p>
  </figure>;
}

export function AffineContributionsFigure() {
  const id = useId().replace(/:/g, '');
  return <figure className="vector-inline-figure" aria-label="Input features 1,2,3 connected to two scores; three products plus one bias per score">
    <svg className="vector-affine-wiring" viewBox="0 0 420 240" role="img" aria-label="Each input feature feeds both score columns. Outputs equal the sum of weighted inputs plus a separate bias.">
      <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="context-stroke" /></marker></defs>
      {[0, 1, 2].map(i => <g key={i}>{[0, 1].map(j => <line key={j} className={`vector-arrow ${j ? 'basis-two' : 'basis-one'}`} x1="118" y1={48 + 72 * i} x2="285" y2={66 + 110 * j} markerEnd={`url(#${id})`} />)}<circle cx="95" cy={48 + 72 * i} r="22" className="vector-feature-node" /><text x="95" y={53 + 72 * i} textAnchor="middle">x{i}={i + 1}</text></g>)}
      {[0, 1].map(j => <g key={j}><circle cx="315" cy={66 + 110 * j} r="28" className="vector-feature-node" /><text x="315" y={71 + 110 * j} textAnchor="middle">score {j}</text><text x="315" y={110 + 110 * j} textAnchor="middle">+ b{j}={j ? '−.02' : '.01'}</text></g>)}
    </svg>
    <div className="vector-two-planes">
      <MatrixDrawing label="Score 0 · solid connections" rows={['x0', 'x1', 'x2', 'bias', 'output']} columns={['contribution']} values={[["1×.2 = .2"], ["2×.4 = .8"], ["3×.1 = .3"], ["+ .01"], ["1.31"]]} />
      <MatrixDrawing label="Score 1 · dashed connections" rows={['x0', 'x1', 'x2', 'bias', 'output']} columns={['contribution']} values={[["1×(−.1) = −.1"], ["2×.3 = .6"], ["3×.5 = 1.5"], ["− .02"], ["1.98"]]} />
    </div><p>Every connection carries one input into that output’s weight column. Bias is added once per score after the three products are summed.</p>
  </figure>;
}
