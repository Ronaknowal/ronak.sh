import { useEffect, useState, useId } from 'react';
import { cases, neighborhood, rank, regression, units, shares, votes, affine } from "../../../data/knn-reading-flow-model.js";
import { knnValidationRows } from "../../../data/knn-validation-data.js";
import { Figure, Table, Numeric, Choices, QueryControls, Map, Scene, Legend, Steps, Bars, Matrix, num, useReadingState } from "./DrawingParts.jsx";
export function CaseAnatomy() {
  const s = useReadingState();
  return <Figure id="D01" label="One remembered case, its coordinates and its target" caption="Each row retains two feature coordinates and a separate target. The unknown query target is absent. ● A, ■ B, ▲ C; × marks the query."><div className="knf-panels"><Table headers={['ID', 'x₁', 'x₂', 'target']} rows={cases.map(r => [r.id, ...r.point, r.label])} caption="Eight stored training cases" /><Map query={s.query}>{({
          x,
          y
        }) => <><path d={`M${x(1)},${y(2)}h60v55`} fill="none" stroke="#e5ad52" /><text x={x(1) + 70} y={y(2) + 57}>A1=(1,2)</text></>}</Map></div><Matrix label="New input → two feature cells; target remains unknown" rows={[[...s.query, '? target']]} /><QueryControls state={s} /></Figure>;
}
export function DistanceTrace() {
  const s = useReadingState(),
    [id, setId] = useState('C1'),
    row = cases.find(r => r.id === id),
    delta = s.query.map((v, i) => v - row.point[i]),
    squares = delta.map(v => v * v),
    sum = squares.reduce((a, b) => a + b, 0),
    zoom = Math.hypot(...delta) === 0 ? 1 : 120 / Math.max(...delta.map(Math.abs)),
    insetX = 180 + delta[0] * zoom,
    insetY = 180 - delta[1] * zoom;
  return <Figure id="D02" label="Two coordinate differences make one Euclidean distance" caption="The right angle draws the two actual coordinate legs; subtraction, squaring, addition and root produce the distance. The remembered target is not an operand."><Map query={s.query} selected={[row]}>{({
        x,
        y
      }) => <path d={`M${x(row.point[0])},${y(row.point[1])}H${x(s.query[0])}V${y(s.query[1])}Z`} fill="none" stroke="#e5ad52" strokeWidth={2} />}</Map><Scene label="Magnified coordinate-leg inset, equal axis units" width={420} height={440}><path d={`M180,180H${insetX}V${insetY}Z`} stroke="#e5ad52" strokeWidth={2} fill="none" /><circle cx={180} cy={180} r={4} fill="#91b4d8" /><circle cx={insetX} cy={insetY} r={4} fill="white" /><text x={20} y={25}>Magnified inset: same geometry, larger legs</text><text x={20} y={55}>Δx₁={num(delta[0])}; Δx₂={num(delta[1])}</text><text x={20} y={390}>stored row → horizontal leg → vertical leg → query</text><text x={20} y={418}>{sum === 0 ? "Exact match: both legs and distance are zero" : "Equal axis magnification; lengths retain their ratio."}</text></Scene><Steps items={[<Matrix label="query − stored row" rows={[s.query, row.point, delta]} />, <Matrix label="square each signed difference" rows={[squares]} />, <span>{num(squares[0])} + {num(squares[1])} = {num(sum)}</span>, <span>√{num(sum)} = <strong>{num(Math.hypot(...delta))}</strong></span>]} /><Choices label="Inspect stored row" value={id} onChange={setId} options={cases.map(r => [r.id, r.id])} /></Figure>;
}
export function RetrievalLab() {
  const s = useReadingState(),
    r = neighborhood(s.query, s.k, 'euclidean');
  return <Figure id="D03" label="Full distance ranking and a k-row cutoff" caption="The map and complete rank table agree. Only query and integer k affect this stage; Euclidean distance is fixed here. The kth distance sets the dashed radius."><span id="knn-neighbors" /><Map query={s.query} selected={r.selected} radius={r.radius} /><Legend /><Table headers={['rank', 'ID', 'raw distance', '12-place key', 'selected?']} rows={r.ranked.map((row, i) => [i + 1, row.id, num(row.distance, 9), row.distance.toFixed(12), i < s.k ? 'yes ←' : 'outside'])} caption="Retrieve before combining targets" /><div className="knf-controls"><Numeric label="Neighbors k" value={s.k} min={1} max={8} step={1} integer onChange={s.setK} resetKey={s.resetKey} /><button type="button" onClick={s.reset}>Reset connected query</button></div><p aria-live="polite">Current query ({s.query.map(v => num(v, 12)).join(', ')}); k={s.k}; boundary distance {num(r.radius)}.</p></Figure>;
}
export function MetricContoursLab() {
  const s = useReadingState(),
    r = neighborhood(s.query, s.k, s.metric);
  return <Figure id="D04" label="Equal-distance contours follow the norm" caption="Equal data-axis units keep circle, diamond and square geometries honest. The separate 3/4-component comparison calculates L₂=5, L₁=7 and L∞=4."><Map query={s.query} selected={r.selected} radius={r.radius} metric={s.metric} /><Legend /><div className="knf-panels"><Scene label="Three and four coordinate legs" width={300} height={280}><path d="M50,225H200V25Z" stroke="#e5ad52" fill="none" strokeWidth={2} /><text x={125} y={250} textAnchor="middle">|Δx₁|=3</text><text x={215} y={130}>|Δx₂|=4</text><text x={20} y={100}>√(9+16)=5</text></Scene><Steps items={['L₂: √(3²+4²)=5', 'L₁: |3|+|4|=7', 'L∞: max(3,4)=4']} /></div><Choices label="Distance rule" value={s.metric} onChange={s.setMetric} options={[["euclidean", "L₂ circle"], ["manhattan", "L₁ diamond"], ["maximum", "L∞ square"]]} /><Table caption="Same query and k, changed geometry" headers={['selected ID', 'distance']} rows={r.selected.map(row => [row.id, num(row.distance)])} /><p>Query ({s.query.map(v => num(v, 12)).join(', ')}), k={s.k}; change those in the first investigation. Here the distance choice alone changes.</p></Figure>;
}
export function UnitsLab() {
  const [q, setQ] = useState([1.2, 600]),
    [scaled, setScaled] = useState(false),
    [factor, setFactor] = useState(1),
    [resetKey, setResetKey] = useState(0),
    r = units(q, factor, scaled);
  function reset() {
    setQ([1.2, 600]);
    setScaled(false);
    setFactor(1);
    setResetKey(x => x + 1);
  }
  return <>
    <Figure id="D05" label="Time and energy query in recorded units" caption="These inputs are recorded in hours and Wh. The same query feeds the conversion comparison immediately below; resetting restores both views.">
      <span id="knn-units" /><Matrix label="Training rows: [time hours, energy Wh]" rows={[["R",1,100],["S",3,1000],["T",5,1100]]} />
      <Matrix label="Current query: [hours, Wh]" rows={[q]} />
      <div className="knf-controls"><Numeric label="Query time" value={q[0]} min={0} max={6} onChange={v=>setQ([v,q[1]])} resetKey={resetKey} /><Numeric label="Query energy (Wh)" value={q[1]} min={0} max={1200} step={25} onChange={v=>setQ([q[0],v])} resetKey={resetKey} /><button type="button" onClick={reset}>Reset units</button></div>
    </Figure>
    <p>Keep that query and the three stored rows. Now change only their energy representation or the rule that scales coordinates before adding their squared contributions. A conversion multiplies every stored and query energy by the same factor.</p>
    <Figure id="D05-conversion" label="Per-coordinate contributions and unit conversion" caption="Raw Euclidean geometry adds numerical squared contributions in the chosen representation; scaled geometry divides each coordinate by its own training standard deviation.">
      <Matrix label="Training rows: [time, converted energy]" rows={[["R",1,100*factor],["S",3,1000*factor],["T",5,1100*factor]]} />
      <Table caption="Actual coordinate reduction" headers={['ID','Δtime / scale','Δenergy / scale','first square','second square','distance']} rows={r.records.map(row=>[row.id,...row.deltas.map(v=>num(v)),...row.components.map(v=>num(v)),num(row.distance)])} />
      {r.records.map(row=><div key={row.id}><p>{row.id}: squared contributions ({scaled?'standardized units':'chosen raw numeric units'})</p><Bars max={Math.max(...r.records.flatMap(row=>row.components),1)} rows={row.components.map((v,i)=>['x'+(i+1),v])} /></div>)}
      <div className="knf-controls"><Numeric label="Energy conversion factor" value={factor} min={.1} max={10} onChange={setFactor} resetKey={resetKey} /><Choices label="Geometry" value={scaled} onChange={setScaled} options={[[false,'Raw'],[true,'Training scaled']]} /></div>
      <p aria-live="polite">Same query ({q.map(v=>num(v)).join(', ')} hours/Wh); winner {r.winner}. Training means ({r.means.map(v=>num(v)).join(', ')}); scales ({r.scales.map(v=>num(v)).join(', ')}). Scaled differences cancel the common energy conversion factor.</p>
    </Figure>
  </>;
}
export function CosineFigure() {
  return <Figure id="D06" label="Direction vectors and their unit normalization" caption="For q=(1,0), U=(3,0), V=(1,1), raw Euclidean favors V while cosine favors U. The positive 2×U null keeps its direction; zero has no normalized direction."><div className="knf-panels"><Scene label="Raw arrows from the origin" width={360} height={250}><path d="M40,190H315M40,190V35" stroke="#666" fill="none" /><path d="M40,190H265" stroke="#e5ad52" strokeWidth={3} /><path d="M40,190L115,115" stroke="#91b4d8" strokeWidth={3} /><path d="M40,195H115" stroke="white" strokeWidth={2} /><text x={265} y={175}>U=(3,0)</text><text x={115} y={95}>V=(1,1)</text><text x={85} y={220}>q=(1,0)</text></Scene><Scene label="Normalized arrows and a unit circle" width={300} height={290}><circle cx={100} cy={160} r={85} fill="none" stroke="#666" /><path d="M100,160H185M100,160L160.1,99.9" stroke="#e5ad52" fill="none" strokeWidth={3} /><text x={192} y={165}>q̂=Û</text><text x={170} y={85}>V̂</text><text x={35} y={272}>‖q̂−V̂‖²=2−√2</text></Scene></div><Table caption="Two ranking calculations" headers={['row', 'Euclidean from q', 'cosine dissimilarity']} rows={[["U", 2, 0], ["V", 1, num(1 - 1 / Math.sqrt(2))], ["2×U", 5, 0], ["zero", 1, 'undefined direction']]} /></Figure>;
}
export function InfluenceFigure() {
  const s = useReadingState(),
    r = neighborhood(s.query, s.k, s.metric, s.weight);
  return <Figure id="D07" label="Selected distances become normalized row shares" caption="All row shares account for one prediction. For positive inverse distances the implementation rescales masses by the minimum distance; normalized shares are identical to 1/d without reciprocal overflow. Exact selected matches use the separate zero-only branch."><Table caption="distance → mass → divide by total → share" headers={['ID', 'distance', 'mass', 'normalized share']} rows={r.selected.map(row => [row.id, num(row.distance), num(row.mass), num(row.share)])} /><Bars label="Actual normalized influences" rows={r.selected.map(row => [row.id, row.share])} /><Steps items={[<span>Selected rows from {s.metric}, k={s.k}</span>, <span>{s.weight === 'uniform' ? 'massᵢ=1' : r.selected.some(r => r.distance === 0) ? 'massᵢ=1 only for dᵢ=0; otherwise 0' : 'massᵢ=dmin/dᵢ (common rescaling of 1/dᵢ)'}</span>, <span>Σ mass = {num(r.selected.reduce((v, row) => v + row.mass, 0))}</span>, <span>shareᵢ = massᵢ / Σ mass; Σ share = {num(r.selected.reduce((v, row) => v + row.share, 0))}</span>]} /><Choices label="Neighbor influence" value={s.weight} onChange={s.setWeight} options={[["uniform", "Equal"], ["distance", "Inverse distance"]]} /><button type="button" onClick={s.reset}>Reset connected query</button></Figure>;
}
export function ClassificationLab() {
  const s = useReadingState(),
    r = neighborhood(s.query, s.k, s.metric, s.weight);
  return <Figure id="D08" label="Class masks route every row share into a class sum" caption="A row contributes its share to exactly one class column. The three class sums total one before the declared argmax decision."><Matrix label="[row, share, A contribution, B contribution, C contribution]" rows={r.selected.map(row => [row.id, row.share, ...['A', 'B', 'C'].map(label => row.label === label ? row.share : 0)])} /><Steps items={[<span>Σ each class column</span>, <Bars rows={r.totals.map(row => [row.label, row.value])} />, <strong>largest sum → {r.winner}</strong>]} /><p aria-live="polite">Same connected query ({s.query.map(v => num(v, 12)).join(', ')}), k={s.k}, {s.metric}, {s.weight}. Decision {r.winner}.</p></Figure>;
}
export function DuplicateFigure() {
  const [position, setPosition] = useState(0),
    [label, setLabel] = useState('B'),
    [resetKey, setResetKey] = useState(0),
    rows = shares([{
      id: 'first',
      distance: 0,
      label: 'A'
    }, {
      id: 'second',
      distance: position,
      label
    }, {
      id: 'third',
      distance: 2,
      label: 'B'
    }], 'distance'),
    v = votes(rows, ['A', 'B']);
  function reset() {
    setPosition(0);
    setLabel('B');
    setResetKey(x => x + 1);
  }
  return <Figure id="D09" label="Exact-match-only influence and two different ties" caption="The query is zero on this separate line fixture. k=3 includes every displayed row; the second row can move or change label. Retrieval and class-total ties are different operations."><Scene label="Duplicate and separated rows on a line" width={380} height={170}><path d="M50,95H330" stroke="#777" /><circle cx={50} cy={90} r={6} fill="#e5ad52" />{label === "A" ? <circle cx={50 + position * 120} cy={110} r={6} fill="#e5ad52" /> : <rect x={50 + position * 120 - 6} y={104} width={12} height={12} fill="#91b4d8" />}<rect x={284} y={84} width={12} height={12} fill="#91b4d8" /><text x={35} y={63}>first A, q=0</text><text x={55 + position * 120} y={140}>second {label}</text><text x={270} y={63}>third B=2</text></Scene><Table caption="Zero-only inverse mass branch" headers={['row', 'distance', 'label', 'mass', 'share']} rows={rows.map(row => [row.id, num(row.distance), row.label, row.mass, num(row.share)])} /><Bars rows={v.totals.map(row => [row.label, row.value])} /><div className="knf-controls"><Numeric label="Second row position" value={position} min={0} max={2} onChange={setPosition} resetKey={resetKey} /><Choices label="Second target" value={label} onChange={setLabel} options={[["A", "A"], ["B", "B"]]} /><button type="button" onClick={reset}>Reset duplicates</button></div><p aria-live="polite">Decision {v.winner}; with two opposite exact labels shares are ½ each. Separate cutoff fixture: positions −1(A), +1(B), k1 at q0 tie by ID; k2 contains both and ties by class total.</p></Figure>;
}
export function RegressionLab() {
  const [q, setQ] = useState(2.5),
    [k, setK] = useState(3),
    [weight, setWeight] = useState('uniform'),
    [resetKey, setResetKey] = useState(0),
    r = regression(q, k, weight);
  function reset() {
    setQ(2.5);
    setK(3);
    setWeight('uniform');
    setResetKey(x => x + 1);
  }
  const x = v => 50 + (v + 1) * 35,
    y = v => 300 - v * 9;
  return <Figure id="D10" label="Selected target products make a local mean" caption="The x-axis retains the full query domain −1…8. The horizontal prediction mark comes from the displayed target products, with the selected-target minimum/maximum interval reported below the plot."><span id="knn-regression" /><Scene label="Six target observations and the local prediction" width={420} height={360}>{[0, 1, 2, 3, 4, 5].map(v => <g key={v}><circle cx={x(v)} cy={y(v * v)} r={5} fill={r.selected.some(row => row.id === String(v)) ? '#e5ad52' : '#666'} /><text x={x(v)} y={330} textAnchor="middle">{v}</text></g>)}<path d={`M${x(q)},315V35M${x(q) - 12},${y(r.prediction)}h24`} stroke="white" fill="none" strokeWidth={2} /><text x={50} y={20}>target y=x² observations</text><text x={365} y={330} textAnchor="middle">8</text><text x={50} y={330} textAnchor="middle">−1</text><text x={295} y={330} textAnchor="middle">6</text><text x={330} y={330} textAnchor="middle">7</text><text x={10} y={300}>0</text><text x={5} y={y(25) + 5}>25</text><text x={50} y={352}>query q={num(q)} · × mean={num(r.prediction)}</text></Scene><Table caption="selected target × share → contribution" headers={['x', 'target', 'distance', 'share', 'product']} rows={r.selected.map(row => [row.id, row.target, num(row.distance), num(row.share), num(row.share * row.target)])} /><p>Σ products = <strong>{num(r.prediction)}</strong>, within [{Math.min(...r.selected.map(row => row.target))},{Math.max(...r.selected.map(row => row.target))}].</p><div className="knf-controls"><Numeric label="Regression query" value={q} min={-1} max={8} step={.5} onChange={setQ} resetKey={resetKey} /><Numeric label="Regression k" value={k} min={1} max={6} step={1} integer onChange={setK} resetKey={resetKey} /><Choices label="Mean influence" value={weight} onChange={setWeight} options={[["uniform", "Uniform"], ["distance", "Distance"]]} /><button type="button" onClick={reset}>Reset regression</button></div></Figure>;
}
export function VoronoiFigure() {
  return <Figure id="D11" label="Bisectors divide space into nearest-site cells" caption="Two sites at0 and4 have midpoint2. In the 2D drawing, three actual site half-spaces give strips; sites at0 and4 both carry A, whose union is disconnected even though each individual cell is convex."><Scene label="Nearest-site cells and actual bisectors" width={420} height={310}><rect x={40} y={45} width={85} height={200} fill="#584325" /><rect x={125} y={45} width={170} height={200} fill="#30445a" /><rect x={295} y={45} width={85} height={200} fill="#584325" /><path d="M125,35V255M295,35V255" stroke="white" strokeDasharray="4 4" /><circle cx={40} cy={145} r={6} fill="#e5ad52" /><rect x={204} y={139} width={12} height={12} fill="#91b4d8" /><circle cx={380} cy={145} r={6} fill="#e5ad52" /><text x={45} y={125}>A at0</text><text x={190} y={125}>B at2</text><text x={325} y={125}>A at4</text><text x={110} y={280}>x=1</text><text x={280} y={280}>x=3</text></Scene><Steps items={['Two-site comparison: q² ≤ (q−4)²', 'Cancel q²: 0 ≤ −8q+16', 'q ≤ 2; equality belongs to the tie policy']} /></Figure>;
}
export function AffineLab() {
  const clip = useId();
  const [q, setQ] = useState(3.5),
    [h, setH] = useState(1),
    [fixture, setFixture] = useState('curved'),
    [resetKey, setResetKey] = useState(0),
    r = affine(q, h, fixture);
  function reset() {
    setQ(3.5);
    setH(1);
    setFixture('curved');
    setResetKey(x => x + 1);
  }
  const x = v => 55 + (v + 1) * 60,
    y = v => 300 - v * 15;
  return <Figure id="D12" label="A query-specific weighted design fits a local line" caption="Every square-root-weighted row is shown. A rank2 line predicts at the centered query coordinate0; rank failure leaves the line unavailable and the local constant visible."><Scene label="Local constant and fitted affine line" width={420} height={390}><defs><clipPath id={clip}><rect x={55} y={35} width={300} height={295} /></clipPath></defs><path d="M55,320H355M55,320V35" stroke="#666" fill="none" />{r.x.map((v, i) => <g key={i}><circle cx={x(v)} cy={y(r.y[i])} r={4 + 7 * Math.sqrt(r.weight[i])} fill="#e5ad52" /><text x={x(v) - 12} y={y(r.y[i]) - 12} textAnchor="end">{v},{r.y[i]}</text></g>)}<path d={`M55,${y(r.constant)}H355`} stroke="#91b4d8" strokeDasharray="4 4" /><g clipPath={"url(#" + clip + ")"}>{r.intercept !== null && <path d={`M${x(-1)},${y(r.intercept + r.slope * (-1 - q))}L${x(4)},${y(r.intercept + r.slope * (4 - q))}`} stroke="#e5ad52" />}</g><path d={`M${x(q)},325V35`} stroke="white" strokeDasharray="3 5" /><text x={55} y={350}>q={num(q)} · constant={num(r.constant)}</text><text x={55} y={370}>affine={num(r.intercept)} · rank={r.rank}</text></Scene><Table caption="Gaussian weights and actual centered design" headers={['x', 'y', 'x−q', 'aᵢ', '√aᵢ', '√aᵢ(x−q)', '√aᵢ y']} rows={r.x.map((v, i) => [v, r.y[i], num(r.centered[i]), num(r.weight[i]), ...r.design[i].map(v => num(v))])} /><Steps items={[<Matrix label="QR upper-triangular R" rows={r.R} />, <span>σmin={num(r.sigmaMin, 12)}, σmax={num(r.sigmaMax, 12)}; σmin &gt; 10⁻¹²σmax? {r.rank === 2 ? 'yes' : 'no'}</span>, <span>{r.rank === 2 ? `intercept ${num(r.intercept)}; slope ${num(r.slope)}; predict at centered 0` : 'Unavailable affine fit: two columns are not numerically identifiable.'}</span>]} /><div className="knf-controls"><Numeric label="Affine query" value={q} min={-1} max={4} onChange={setQ} resetKey={resetKey} /><Numeric label="Gaussian bandwidth h" value={h} min={.1} max={3} onChange={setH} resetKey={resetKey} /><Choices label="Local data" value={fixture} onChange={v => {
        setFixture(v);
        setQ(v === 'curved' ? 3.5 : v === 'symmetric' ? 0 : 1);
      }} options={[["curved", "Curved"], ["symmetric", "Affine null"], ["repeated", "Repeated x"]]} /><button type="button" onClick={reset}>Reset local fit</button></div></Figure>;
}
export function EstimatorFigure() {
  const distances = cases.map(row => Math.hypot(row.point[0] - 3.1, row.point[1] - 2.9));
  return <Figure id="D13" label="Stored model arrays and one query's temporary arrays" caption="Fit retains copies and class vocabulary; querying creates distances and indices. Targets enter aggregation only after retrieval."><div className="knf-panels"><Matrix label="Stored X[n,2] (first/last rows shown)" rows={[[1, 2], [1.5, 1.8], ['⋮', '⋮'], [3.2, 2.8]]} /><Matrix label="Stored targets[n]" rows={[cases.map(row => row.label)]} /><Matrix label="Class vocabulary[3]" rows={[["A", "B", "C"]]} /></div><Steps items={[<Matrix label="query[2]" rows={[[3.1, 2.9]]} />, <div><Matrix label="Actual distances[n] in stored row order A1…C2" rows={[distances]} /><Matrix label="Stable selected original positions[k]" rows={[[6, 7, 1, 2, 0]]} /></div>, <Matrix label="shares[k] → target aggregation" rows={[[.2, .2, .2, .2, .2], ["C", "C", "A", "A", "A"]]} />, <span>class distribution[3]=(0.6,0,0.4) → A</span>]} /></Figure>;
}
export function SelectionFigure() {
  return <Figure id="D14" label="Partition cutoff plus original-position tie fill" caption="The unsorted array determines τ=1 for k2. All tied positions remain eligible; an arbitrary partition subset is discarded. Only chosen positions1,2 are finally sorted."><Matrix label="raw distances by original position0…4" rows={[[2, 1, 1, 1, 3]]} /><Scene label="Cutoff partitions and stable ID fill" width={420} height={220}><path d="M50,30H360M210,35V65M210,125V155" stroke="#aaa" fill="none" /><text x={50} y={25}>τ=1, k=2</text><text x={50} y={95}>closer: []</text><text x={170} y={95}>equal: [1,2,3]</text><text x={50} y={185}>scan → [1,2]</text><text x={250} y={185}>far: [0,4]</text></Scene><Matrix label="selected k only: (distance, position)" rows={[[1, 1], [1, 2]]} /><p>All-equal distances select positions0…k−1. A batch distance matrix has b rows of queries and n columns of references; the coordinate dimension is accumulated into each cell.</p></Figure>;
}
export function EvaluationFigure() {
  return <Figure id="D15" label="Training, validation and reserved-test row ownership" caption="The actual Wine IDs belong to disjoint pools. Transform fitting and candidate selection happen before the reserved test report. Refit updates allowed development state after the chosen configuration is frozen."><div className="knf-panels"><Matrix label="Training pool106 rows → fitted state" rows={[["Xtrain[106,13]"], ["ytrain[106]"], ["mean[13], scale[13]"], ["references[106,13]"]]} /><Matrix label="Validation pool36 rows → choose configuration" rows={[["Xvalid[36,13] → same transform"], ["probabilities[36,3]"], ["yvalid → log loss"], ["16 candidate losses → winner"]]} /></div><Steps items={['Freeze: scaled, k7, distance', 'Refit scaler and reference rows on train+validation:142 rows', <Matrix label="Reserved test pool36 → final report" rows={[["Xtest → fixed refitted transform"], ["neighbors → probabilities"], ["ytest → one score/confusion"]]} />, <span>Test → candidate selection: forbidden information route</span>]} /></Figure>;
}
function WineInspector() {
  const [data, setData] = useState(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [index, setIndex] = useState(0),
    [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    fetch('/learn-code/k-nearest-neighbors/wine-result.json').then(r => {
      if (!r.ok) throw Error('asset');
      return r.json();
    }).then(value => {
      if (active) setData(value);
    }).catch(() => {
      if (active) {
        setError(true);
        setData(null);
      }
    });
    return () => {
      active = false;
    };
  }, [retry]);
  if (error) return <div role="status"><p>Saved Wine data unavailable. The numerical examples above remain usable.</p><button type="button" onClick={() => setRetry(v => v + 1)}>Retry Wine data</button></div>;
  if (!data) return <p role="status">Loading saved Wine state…</p>;
  const row = data.neighborContributions[index];
  return <div><Table caption="All16 Wine validation candidates; objective is log loss" headers={['scaled', 'k', 'weights', 'validation loss', 'accuracy']} rows={data.candidates.map(r => [String(r.scaled), r.k, r.weights, num(r.validationLogLoss), num(r.validationAccuracy)])} /><div className="knf-controls"><Numeric label="Saved test position" value={index} min={0} max={35} integer step={1} onChange={setIndex} resetKey={resetKey} /><button type="button" onClick={() => {
        setIndex(0);
        setResetKey(v => v + 1);
      }}>Reset Wine row</button></div><p aria-live="polite">CSV row ID {data.splitIds.test[index]} (zero-based); prediction {data.testPredictions[index]}, observed cultivar {data.testLabels[index]}. Selected configuration was fixed before this target entered scoring.</p><Table caption="13 raw coordinates → actual142-row refitted scaler" headers={['feature', 'raw', 'refitted mean', 'refitted scale', 'transformed']} rows={data.featureNames.map((name, j) => [name, num(data.testRows[index][j]), num(data.refittedScaler.mean[j]), num(data.refittedScaler.scale[j]), num(data.transformedTest[index][j])])} /><Table caption="Fixed refitted model: selected reference IDs and contributions" headers={['CSV row ID', 'distance', 'share', 'class']} rows={row.referenceIds.map((id, j) => [id, num(row.distances[j]), num(row.shares[j]), data.referenceLabels[data.referenceIds.indexOf(id)]])} /><Bars rows={row.probabilities.map((v, j) => ['class' + (j + 1), v])} /><Matrix label="Reserved confusion rows actual1,2,3; columns predicted1,2,3" rows={data.test.confusion} /><p>Test accuracy {num(data.test.accuracy)}, log loss {num(data.test.logLoss)}; prior baseline log loss {num(data.test.baselineLogLoss)}; supports {data.test.support.join(', ')}.</p></div>;
}
export function EvidenceFigure({
  wine = false
} = {}) {
  if (wine) return <Figure id="D16-Wine" label="Saved Wine candidates and frozen test inspector" caption="Actual new Wine execution; the browser reads saved refitted state and never fits or selects on test targets."><WineInspector /></Figure>;
  const x = k => 55 + k * 7,
    y = loss => 320 - loss * 75;
  return <Figure id="D16" label="Actually measured validation points and saved Wine inspection" caption="Old seed19/noise0.28 measurements are retained. Lines guide the eye between tested k only; no score is interpolated or fitted in the browser. The test supplies no point in this selection chart."><Scene label="Original eight measured validation losses" width={420} height={390}>{[0, 1, 2, 3].map(v => <g key={v}><path d={`M55,${y(v)}H365`} stroke="#444" /><text x={40} y={y(v) + 5} textAnchor="end">{v}</text></g>)}{['uniform', 'distance'].map(w => <g key={w}><polyline points={knnValidationRows.filter(r => r.weights === w).map(r => `${x(r.k)},${y(r.loss)}`).join(' ')} stroke={w === 'uniform' ? '#e5ad52' : '#91b4d8'} strokeDasharray={w === 'uniform' ? '' : '4 4'} fill="none" />{knnValidationRows.filter(r => r.weights === w).map(r => w === 'uniform' ? <circle key={r.k} cx={x(r.k)} cy={y(r.loss)} r={5} fill="#e5ad52" /> : <rect key={r.k} x={x(r.k) - 4} y={y(r.loss) - 4} width={8} height={8} fill="#91b4d8" />)}</g>)}{[1, 5, 15, 41].map(v => <text key={v} x={x(v)} y={346} textAnchor="middle">{v}</text>)}<text x={55} y={25}>Validation log loss: uniform● distance■</text><text x={155} y={369}>Tested integer k</text></Scene><Table caption="Original measured synthetic candidates" headers={['k', 'weights', 'validation loss']} rows={knnValidationRows.map(r => [r.k, r.weights, num(r.loss)])} /></Figure>;
}
