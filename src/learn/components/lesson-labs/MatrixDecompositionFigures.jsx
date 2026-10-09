import { useId } from 'react';
import { apply2, qrGeometry } from '../../data/matrix-decomposition-models.js';
import norris from '../../data/matrix-decomposition-observations.json';
import './matrix-decomposition-labs.css';

export const decompositionColors = { reference: '#ded5bf', current: '#edc267', comparison: '#97bfca' };
export function valueText(value) {
  if (value === null) return 'pending';
  if (typeof value === 'string') return value;
  return (Math.abs(value) < 0.0000005 ? 0 : value).toFixed(3).replace(/\.?0+$/, '').replace(/-/g, '−');
}
export function vectorText(vector) { return `(${vector.map(valueText).join(', ')})`; }
export function DecompositionMatrix({ values, label, augmented = false, mark, rows, columns }) {
  return <div className="decomposition-matrix" role="region" aria-label={label} tabIndex={0}>
    <table><caption>{label}</caption>
      {columns && <thead><tr>{rows && <th aria-label="row labels" />}{columns.map((v, j) => <th key={j} scope="col">{v}</th>)}</tr></thead>}
      <tbody>{values.map((row, i) => <tr key={i}>{rows && <th scope="row">{rows[i]}</th>}{row.map((v, j) => <td key={j} className={`${augmented && j === row.length - 1 ? 'decomposition-target' : ''} ${mark?.(i, j) ? 'is-selected' : ''}`}>{valueText(v)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function circlePoints(radius = 1) {
  return Array.from({ length: 65 }, (_, i) => [radius * Math.cos(i * Math.PI / 32), radius * Math.sin(i * Math.PI / 32)]);
}

/** Equal physical coordinate scales. Short endpoint labels stay on the drawing;
 * long descriptions/values reflow in HTML. Comparisons also use a dash pattern. */
export function DecompositionPlane({ label, range = 3, arrows = [], curves = [], segments = [], points = [] }) {
  const id = useId().replace(/:/g, '');
  const scale = 115 / range;
  const xy = ([x, y]) => [150 + x * scale, 150 - y * scale];
  const ticks = [-range, -range / 2, 0, range / 2, range];
  return <div className="decomposition-plane">
    <svg viewBox="0 0 300 300" role="img" aria-label={label}>
      <title>{label}</title>
      <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="context-stroke" /></marker></defs>
      {ticks.map(t => <g key={t} className="decomposition-grid"><line x1={xy([t, 0])[0]} y1="35" x2={xy([t, 0])[0]} y2="265" /><line x1="35" y1={xy([0, t])[1]} x2="265" y2={xy([0, t])[1]} />{t !== 0 && <><text x={xy([t, 0])[0]} y="287" textAnchor="middle">{valueText(t)}</text><text x="27" y={xy([0, t])[1] + 4} textAnchor="end">{valueText(t)}</text></>}</g>)}
      <path className="decomposition-axis" d="M25 150H277M150 277V25" />
      <text x="280" y="146">x</text><text x="159" y="23">y</text><text x="133" y="169">0</text>
      {curves.map((curve, i) => <polyline key={i} points={curve.points.map(p => xy(p).join(',')).join(' ')} fill="none" stroke={decompositionColors[curve.kind || 'reference']} strokeWidth="2" strokeDasharray={curve.kind === 'comparison' ? '6 4' : undefined} />)}
      {segments.map((s, i) => { const start = xy(s.from), end = xy(s.to); return <line key={i} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={decompositionColors[s.kind || 'reference']} strokeWidth="2" strokeDasharray={s.solid ? undefined : '2 4'} />; })}
      {arrows.map((a, i) => {
        const start = xy(a.from || [0, 0]), end = xy(a.to);
        const zero = Math.hypot(a.to[0] - (a.from?.[0] || 0), a.to[1] - (a.from?.[1] || 0)) < 1e-10;
        const labelPosition = a.labelAt ? xy(a.labelAt) : end;
        return <g key={i}><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={decompositionColors[a.kind || 'current']} strokeWidth="2.5" strokeDasharray={a.kind === 'comparison' ? '6 4' : undefined} markerEnd={zero ? undefined : `url(#${id})`} />{zero && <circle cx={end[0]} cy={end[1]} r="4" fill={decompositionColors[a.kind || 'current']} />}{a.labelAt && <line x1={end[0]} y1={end[1]} x2={labelPosition[0]} y2={labelPosition[1]} stroke={decompositionColors[a.kind || 'current']} strokeWidth="1" strokeDasharray="2 4" />}<text className="decomposition-label" x={labelPosition[0] + (a.dx ?? 8)} y={labelPosition[1] + (a.dy ?? -9)} textAnchor={a.anchor || 'start'}>{a.label}</text></g>;
      })}
      {points.map((p, i) => { const pos = xy(p.at); return <g key={i}><circle cx={pos[0]} cy={pos[1]} r="4" fill={decompositionColors[p.kind || 'current']} /><text className="decomposition-label" x={pos[0] + (p.dx ?? 8)} y={pos[1] + (p.dy ?? -8)}>{p.label}</text></g>; })}
    </svg>
  </div>;
}

export function SuccessiveFactorMapsFigure() {
  const stages = [
    { label: 'Input x', vector: [1, 2], matrix: [[1, 0], [0, 1]], name: 'I: original coordinates' },
    { label: 'Cx', vector: [2, 2], matrix: [[2, 0], [0, 1]], name: 'C: stretch horizontal ×2' },
    { label: 'BCx', vector: [4, 2], matrix: [[1, 1], [0, 1]], name: 'B: add vertical into horizontal' }
  ];
  return <figure className="decomposition-inline" aria-label="An input followed through two successive matrix factors">
    <div className="decomposition-three">{stages.map((s, i) => <div key={s.label}><p>{i > 0 ? '→ ' : ''}{s.label} = {vectorText(s.vector)}</p><DecompositionPlane range={5} label={`${s.label} ${vectorText(s.vector)}; all panels have range minus5 to5.`} arrows={[{ to: s.vector, label: s.label }]} /><DecompositionMatrix values={s.matrix} label={s.name} /></div>)}</div>
    <figcaption>Equal coordinate scales show the actual intermediate vector. Each grid describes the operation leading into its panel; the rightmost factor acts first.</figcaption>
  </figure>;
}

export function TriangularDependencyFigure() {
  const id = useId().replace(/:/g, '');
  return <figure className="decomposition-inline" aria-label="Upper triangular zero cell removes the lower equation's dependency on x1">
    <div className="decomposition-two"><DecompositionMatrix label="U and target b" values={[[2, 1, 5], [0, 1, 1]]} augmented mark={(i,j) => i === 1 && j === 0} />
      <svg className="decomposition-wiring" viewBox="0 0 320 230" role="img" aria-label="Solve x2=1 first, then carry coefficient1 upward to solve x1=2."><defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#edc267" /></marker></defs><circle cx="70" cy="55" r="24" /><text x="70" y="61" textAnchor="middle">x₁</text><circle cx="70" cy="172" r="24" /><text x="70" y="178" textAnchor="middle">x₂</text><path d="M70 148V84" markerEnd={`url(#${id})`} /><text x="87" y="120">×1</text><text x="112" y="61">2x₁ + 1 = 5</text><text x="112" y="85">x₁ = 2</text><text x="112" y="178">0x₁ + x₂ = 1</text><text x="112" y="202">x₂ = 1 first</text></svg></div>
    <figcaption>The selected zero cell removes one dependency. The upward edge carries an already known coordinate into the next equation.</figcaption>
  </figure>;
}

export function RowEliminationFigure() {
  return <figure className="decomposition-inline" aria-label="Row2 minus two times row1 removes the coefficient4, including the target contribution10">
    <div className="decomposition-three"><DecompositionMatrix label="Before [A | b]" values={[[2,1,5],[4,3,11]]} augmented mark={(i,j) => i === 1 && j === 0} /><div><svg className="decomposition-wiring" viewBox="0 0 320 150" role="img" aria-label="Each first-row entry contributes twice to the subtraction; coefficients4,2 and target10."><text x="160" y="24" textAnchor="middle">2 × row 1</text>{[4,2,10].map((v,i) => <g key={i}><path d={`M${55+i*105} 42V100`} /><path d={`M${49+i*105} 91L${55+i*105} 101L${61+i*105} 91`} /><text x={55+i*105} y="133" textAnchor="middle">−{v}</text></g>)}</svg><p>Subtract (4,2,10) from (4,3,11).</p></div><DecompositionMatrix label="After [U | y]" values={[[2,1,5],[0,1,1]]} augmented mark={(i,j) => i === 1} /></div>
    <figcaption>Targets take the same row operation as coefficients. L stores the multiplier 2 so the original second row can be reconstructed.</figcaption>
  </figure>;
}

export function QrGeometryDrawing({ model = qrGeometry(), live = false }) {
  return <><DecompositionPlane range={3} label={`Column a2 ${vectorText(model.secondColumn)}, projection ${vectorText(model.projection)}, remainder ${vectorText(model.perpendicular)}.`} arrows={[
    { to:model.firstColumn,label:'a₁',kind:'reference',dx:-12,dy:-13,anchor:'end' },
    { to:model.secondColumn,label:'a₂',dx:10,dy:19 },
    { to:model.projection,label:'p',kind:'comparison',dx:-10,dy:16,anchor:'end' },
    { from:model.projection,to:model.secondColumn,label:'r',kind:'reference',dx:17,dy:-12 }
  ]} /><p>a₂ = {vectorText(model.secondColumn)}; parallel piece p = {vectorText(model.projection)}; remainder r = {vectorText(model.perpendicular)}. All axes retain [−3,3].{live && ` Remainder length ${valueText(model.remainingNorm)}.`}</p></>;
}
export function QrColumnGeometryFigure() { return <figure className="decomposition-inline" aria-label="A column split into its shared direction and new perpendicular remainder"><QrGeometryDrawing /><figcaption>Solid amber is the second column; dashed cyan is its parallel piece. The remainder starts at that piece's endpoint.</figcaption></figure>; }

export function LeastSquaresGeometryFigure() {
  return <figure className="decomposition-inline" aria-label="Closest prediction p=(1,1) and perpendicular residual r=(1,-1) for target b=(2,0)">
    <DecompositionPlane range={3} label="The line y=x is the allowed prediction span. Target b=(2,0), perpendicular foot p=(1,1), residual from p to b. An allowed change reaches (1.5,1.5)." segments={[{from:[-2,-2],to:[2,2],solid:true,kind:'comparison'},{from:[1,1],to:[2,0]},{from:[1,1],to:[1.5,1.5]},{from:[1.1,.9],to:[1.2,1]},{from:[1.2,1],to:[1.1,1.1]}]} arrows={[{to:[2,0],label:'b',dy:21},{to:[1,1],label:'p',dx:-17,anchor:'end'}]} points={[{at:[1.5,1.5],label:'p+d'}]} />
    <p>Prediction span: multiples of (1,1). p=(1,1), r=(1,−1), d=(.5,.5). Their perpendicular lengths give ‖r−d‖² = 2 + .5 = 2.5.</p>
    <figcaption>This is an exact two-dimensional analogue; the actual four-observation fit below lives in a four-dimensional observation space.</figcaption>
  </figure>;
}

function ScatterPlot({ label, data, xRange, yRange, line, residual = false, xLabel, yLabel, pointLabels = false }) {
  const mapX = x => 48 + (x-xRange[0])/(xRange[1]-xRange[0])*252;
  const mapY = y => 245 - (y-yRange[0])/(yRange[1]-yRange[0])*202;
  return <svg className="decomposition-scatter" viewBox="0 0 340 310" role="img" aria-label={label}><title>{label}</title><path className="decomposition-axis" d="M48 35V245H308" />
    {[0,.5,1].map(t => <g key={t}><text x={48+t*252} y="268" textAnchor="middle">{valueText(xRange[0]+t*(xRange[1]-xRange[0]))}</text><text x="40" y={245-t*202+4} textAnchor="end">{valueText(yRange[0]+t*(yRange[1]-yRange[0]))}</text></g>)}
    <text x="170" y="294" textAnchor="middle">{xLabel}</text><text x="48" y="22">{yLabel}</text>
    {residual && <line className="decomposition-axis" x1="48" x2="300" y1={mapY(0)} y2={mapY(0)} />}
    {line && <line x1={mapX(xRange[0])} y1={mapY(line(xRange[0]))} x2={mapX(xRange[1])} y2={mapY(line(xRange[1]))} stroke={decompositionColors.comparison} strokeWidth="2" strokeDasharray="6 4" />}
    {data.map((p,i) => <g key={i}>{!residual && p.prediction !== undefined && <line x1={mapX(p.x)} x2={mapX(p.x)} y1={mapY(p.y)} y2={mapY(p.prediction)} stroke={decompositionColors.reference} strokeWidth="2" strokeDasharray="2 4" />}<circle cx={mapX(p.x)} cy={mapY(p.y)} r="3.5" fill={decompositionColors.current} />{pointLabels && <text x={mapX(p.x)+8} y={mapY(p.y)-8}>{valueText(p.y)}</text>}</g>)}
  </svg>;
}
export function FourPointFitFigure() {
  const data=[.1,1,2.2,2.9].map((y,x) => ({x,y,prediction:.11+.96*x}));
  return <figure className="decomposition-inline" aria-label="Four measurements with fitted line and separate magnified residual strip"><div className="decomposition-two"><ScatterPlot label="Time0 to3, observations .1,1,2.2,2.9 and fitted .11+.96t" data={data} xRange={[-.3,3.3]} yRange={[-.3,3.3]} xLabel="time t" yLabel="measurement" line={x => .11+.96*x} /><ScatterPlot label="Vertical residuals -.01,-.07,.17,-.09; residual scale differs from measurement scale" data={data.map(p => ({x:p.x,y:p.y-p.prediction}))} xRange={[-.3,3.3]} yRange={[-.2,.2]} xLabel="time t" yLabel="residual" residual pointLabels /></div><p>Fitted values (.11,1.07,2.03,2.99); residuals (−.01,−.07,.17,−.09); squared residual sum .042.</p><figcaption>Constructed observations. Dotted segments join measurements to their predictions; the separate residual axis makes their signs and magnitudes visible.</figcaption></figure>;
}

export function HouseholderGeometryFigure() {
  return <figure className="decomposition-inline" aria-label="Reflect the column(3,4) in the line2x+y=0 to (-5,0)"><div className="decomposition-two"><DecompositionPlane range={6} label="Equal-scale reflection: input(3,4), mirror2x+y=0, unit normal(2,1)/sqrt5, output(-5,0)" segments={[{from:[-2.5,5],to:[2.5,-5],kind:'comparison',solid:true},{from:[3,4],to:[-5,0]}]} arrows={[{to:[3,4],label:'a'},{to:[-5,0],label:'Ha',kind:'comparison',dy:22},{to:[2/Math.sqrt(5),1/Math.sqrt(5)],label:'v',kind:'reference',dx:10,dy:16}]} /><div><DecompositionMatrix label="Column before / after" values={[[3,-5],[4,0]]} columns={['a','Ha']} mark={(i,j) => i===1&&j===1} /><DecompositionMatrix label="Trailing block to update with H" values={[[3,1],[4,2],[0,1]]} mark={(i,j)=>i>=0&&j>=0} /><p>Mirror: 2x+y=0. Normal v=(2,1)/√5. Both column lengths are 5; the target first entry uses the opposite sign.</p></div></div><figcaption>The dotted connector crosses the mirror perpendicularly. The trailing-column grid locates where the same reflection acts during QR.</figcaption></figure>;
}

export function QrShapeFigure() {
  const q=[[.5,-3/Math.sqrt(20),.5,-1/Math.sqrt(20)],[.5,-1/Math.sqrt(20),-.5,3/Math.sqrt(20)],[.5,1/Math.sqrt(20),-.5,-3/Math.sqrt(20)],[.5,3/Math.sqrt(20),.5,1/Math.sqrt(20)]];
  const r=[[2,3],[0,Math.sqrt(5)],[0,0],[0,0]];
  return <figure className="decomposition-inline" aria-label="Same four-by-two design under full and reduced QR"><div className="decomposition-shape-row"><DecompositionMatrix label="Full Q · 4×4" values={q} mark={(i,j)=>j<2} /><DecompositionMatrix label="Full R · 4×2" values={r} mark={(i,j)=>i>=2} /></div><div className="decomposition-shape-row"><DecompositionMatrix label="Reduced Q · 4×2" values={q.map(row=>row.slice(0,2))} /><DecompositionMatrix label="Reduced R · 2×2" values={r.slice(0,2)} /></div><p>Both products recover A with rows (1,0),(1,1),(1,2),(1,3). The full Q's last two columns describe remaining output directions; their R rows are zero. Reduced Q keeps the prediction-space columns.</p><figcaption>Actual matching cell sizes show the omitted columns and rows. Signs are one valid QR convention; table values are rounded.</figcaption></figure>;
}

export function NorrisCalibrationFigure() {
  const line=x=>norris.coefficients[0]+norris.coefficients[1]*x;
  return <figure className="decomposition-inline" aria-label="All 36 observed NIST/customer readings and computed fit residuals"><div className="decomposition-two"><ScatterPlot label="NIST reading horizontally; customer reading vertically; all36 actual observations and fitted line" data={norris.points} xRange={[-30,1030]} yRange={[-30,1030]} line={line} xLabel="NIST reading" yLabel="customer reading" /><ScatterPlot label="Customer minus fitted customer residual against NIST reading; all36 computed residuals, scale minus3 to3" data={norris.points.map(p=>({x:p.x,y:p.residual}))} xRange={[-30,1030]} yRange={[-3,3]} xLabel="NIST reading" yLabel="residual" residual /></div><figcaption>{norris.attribution} All 36 points derive from the same complete canonical program; residual and measurement plots have different vertical scales.</figcaption></figure>;
}

export function CholeskyEntriesFigure() {
  return <figure className="decomposition-inline" aria-label="Lower factor entries construct the covariance through three dot products"><div className="decomposition-three">{[
    {label:'a²=4 → a=2',mark:(i,j)=>i===0&&j===0, first:[2,0],second:[2,0],result:4},
    {label:'ab=2 → b=1',mark:(i,j)=>i===1&&j===0,first:[2,0],second:[1,1],result:2},
    {label:'b²+c²=2 → c=1',mark:(i,j)=>i===1&&j===1,first:[1,1],second:[1,1],result:2}
  ].map(s=><div key={s.label}><DecompositionMatrix label={s.label} values={[[4,2],[2,2]]} mark={s.mark} /><svg className="decomposition-wiring" viewBox="0 0 300 230" role="img" aria-label={`Corresponding L row operands: ${s.first.join(',')} dotted with ${s.second.join(',')} gives${s.result}.`}>
    <text x="12" y="30">L row</text><text x="12" y="86">L row</text>
    {[0,1].map(j=><g key={j}><text x={100+120*j} y="30" textAnchor="middle">{s.first[j]}</text><text x={100+120*j} y="86" textAnchor="middle">{s.second[j]}</text><path d={`M${100+120*j} 38V65M${100+120*j} 93V132`} /><text x={100+120*j} y="154" textAnchor="middle">{s.first[j]}×{s.second[j]}</text><path d={`M${100+120*j} 162L160 194`} /></g>)}
    <text x="160" y="222" textAnchor="middle">sum = {s.result}</text>
    </svg><DecompositionMatrix label="L: rows supply dot operands" values={[[2,0],[1,1]]} /></div>)}</div><DecompositionMatrix label="Lᵀ: corresponding column operands" values={[[2,1],[0,1]]} /><figcaption>Each selected C cell is a dot product of two L rows. The lower-right entry removes the already accounted shared square before taking a square root.</figcaption></figure>;
}

export function SharedVariationFigure() {
  const id=useId().replace(/:/g,'');
  return <figure className="decomposition-inline" aria-label="Independent sources z1/z2 wire into x1=2z1 and x2=z1+z2">
    <svg className="decomposition-wiring" viewBox="0 0 400 230" role="img" aria-label="z1 branches with weights2 and1 into x1 and x2; z2 supplies only x2 with weight1"><defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#edc267" /></marker></defs>{[[70,55,'z₁'],[70,180,'z₂'],[325,55,'x₁'],[325,180,'x₂']].map(([x,y,label])=><g key={label}><circle cx={x} cy={y} r="24" /><text x={x} y={y+6} textAnchor="middle">{label}</text></g>)}<path d="M94 55H298M91 70L302 166M94 180H298" markerEnd={`url(#${id})`} /><text x="190" y="43">×2</text><text x="210" y="115">×1</text><text x="190" y="169">×1</text></svg>
    <div className="decomposition-two"><DecompositionMatrix label="L: source-to-output coefficients" values={[[2,0],[1,1]]} columns={['z₁','z₂']} rows={['x₁','x₂']} /><DecompositionMatrix label="C: output covariance" values={[[4,2],[2,2]]} rows={['x₁','x₂']} columns={['x₁','x₂']} mark={(i,j)=>i!==j} /></div><figcaption>Zero-mean, unit-variance, uncorrelated inputs. The shared z₁ branch supplies covariance 2; these connections are not observed samples.</figcaption>
  </figure>;
}

export function WhiteningGeometryFigure() {
  const circle=circlePoints(), lower=[[2,0],[1,1]];
  return <figure className="decomposition-inline" aria-label="SolveLy=x to move from correlated coordinates to independent coordinates"><div className="decomposition-two"><div><p>Original coordinates · x=(2,2)</p><DecompositionPlane range={3} label="L maps the unit circle to an ellipse. Original x=(2,2), ordinary squared length8." curves={[{points:circle.map(p=>apply2(lower,p)),kind:'comparison'}]} arrows={[{to:[2,2],label:'x'}]} /></div><div><p>Whitened coordinates · y=(1,1)</p><DecompositionPlane range={3} label="After solving Ly=x, the ellipse becomes a unit circle and y=(1,1) has squared length 2." curves={[{points:circle,kind:'comparison'}]} arrows={[{to:[1,1],label:'y'}]} /></div></div><figcaption>Both panels use equal [−3,3] scales. The outlines are exact linear geometry, not probability contours; squared distances are 8 before and 2 after the coordinate solve.</figcaption></figure>;
}

export function SvdStagesDrawing({ input, rotated, scaled, output, right, left, singular, range=5 }) {
  const circle=circlePoints();
  const diagonal=[[singular[0],0],[0,singular[1]]];
  const stages=[
    {name:'x · input coordinates',v:input,curve:circle,basis:[right.map(r=>r[0]),right.map(r=>r[1])],short:'x'},
    {name:'c = Vᵀx · singular coordinates',v:rotated,curve:circle,basis:[[1,0],[0,1]],short:'c'},
    {name:'ΣVᵀx · independent stretches',v:scaled,curve:circle.map(p=>apply2(diagonal,p)),basis:[[singular[0],0],[0,singular[1]]],short:'Σc'},
    {name:'UΣVᵀx · output coordinates',v:output,curve:circle.map(p=>apply2(left,apply2(diagonal,p))),basis:[left.map(r=>r[0]*singular[0]),left.map(r=>r[1]*singular[1])],short:'Ax'}
  ];
  return <div className="decomposition-stage-grid">{stages.map((s,i)=><div key={s.name}><p>{s.name}</p><DecompositionPlane range={range} label={`${s.name}: ${vectorText(s.v)}; same domain throughout.`} curves={[{points:s.curve,kind:'reference'}]} arrows={[
    {to:s.basis[0],label:i===0?'v₁':i===1?'unit₁':i===2?'σ₁':'σ₁u₁',kind:'comparison',labelAt:i===0?s.basis[0].map(v=>v*2.2):i===1?[1.8,-.8]:undefined,dx:i<2?0:-10,dy:i<2?0:19,anchor:i<2?'middle':'end'},
    {to:s.basis[1],label:i===0?'v₂':i===1?'unit₂':i===2?'σ₂':'σ₂u₂',kind:'reference',labelAt:i===0?s.basis[1].map(v=>v*2.2):i===1?[-.8,1.8]:undefined,dx:i<2?0:10,dy:i<2?0:19,anchor:i<2?'middle':'start'},
    {to:s.v,label:s.short,labelAt:i<2?[range*.8,range*.75]:undefined,dx:i<2?0:8,dy:i<2?0:-15,anchor:i<2?'middle':'start'}
  ]} /><p>{vectorText(s.v)}</p>{i===1&&<p>unit₁ and unit₂ are length-1 coordinate arrows; c carries this input's actual coordinates.</p>}{i===2&&<p>σ₁ and σ₂ mark the lengths of those unit arrows after stretching.</p>}</div>)}</div>;
}
export function SvdAnatomyFigure() {
  const s=Math.SQRT1_2, basis=[[s,s],[s,-s]];
  return <figure className="decomposition-inline" aria-label="Trace x=(1,0) through V transpose, stretches4/2 and U to output(3,1)"><SvdStagesDrawing input={[1,0]} rotated={[s,s]} scaled={[4*s,2*s]} output={[3,1]} right={basis} left={basis} singular={[4,2]} /><figcaption>Same physical scale in all four panels. Reference circles become ellipses; full traced input/output values are carried below each drawing.</figcaption></figure>;
}

export function SvdShapeFigure() {
  const s=Math.SQRT1_2, square=[[s,s],[s,-s]], tall=[[s,s,0],[s,-s,0],[0,0,1]];
  return <figure className="decomposition-inline" aria-label="Tall and wide full SVD factors with rectangular stretch tables"><div className="decomposition-shape-row"><DecompositionMatrix label="Tall U · 3×3" values={tall} /><DecompositionMatrix label="Σ · 3×2" values={[[4,0],[0,2],[0,0]]} mark={(i,j)=>i===2} /><DecompositionMatrix label="Vᵀ · 2×2" values={square} /></div><div className="decomposition-shape-row"><DecompositionMatrix label="Wide U · 2×2" values={square} /><DecompositionMatrix label="Σ · 2×3" values={[[4,0,0],[0,2,0]]} mark={(i,j)=>j===2} /><DecompositionMatrix label="Vᵀ · 3×3" values={tall} /></div><p>Tall product has rows (3,1),(1,3),(0,0). Wide product has rows (3,1,0),(1,3,0). The extra output coordinate is unreachable in the tall map; the extra input coordinate is lost in the wide map.</p><figcaption>All factor grids use the same cell size. Selected zero rows/columns expose the rectangular space; thin factors retain two singular pairs.</figcaption></figure>;
}

export function SingularOuterActionFigure() {
  const s=Math.SQRT1_2;
  return <figure className="decomposition-inline" aria-label="Each rank-one term reads one input coordinate and places it along an output direction"><div className="decomposition-two">{[1,-1].map((sign,i)=><div key={sign}><DecompositionPlane range={3} label={`Term${i+1}: input x=(1,0) has coordinate1/sqrt2, stretch${i===0?4:2}, output${i===0?'(2,2)':'(1,-1)'}`} arrows={[{to:[1,0],label:'x',kind:'reference',dy:21},{to:[s,sign*s],label:`v${i+1}`,kind:'comparison',dy:20},{to:i===0?[2,2]:[1,-1],label:`term${i+1}`}]} /><p>v{i+1}ᵀx=1/√2; σ{i+1}={i===0?4:2}; term={i===0?'(2,2)':'(1,−1)'}</p><DecompositionMatrix label={`σ${i+1}u${i+1}v${i+1}ᵀ`} values={i===0?[[2,2],[2,2]]:[[1,-1],[-1,1]]} /></div>)}</div><p>The arrows and grids add to Ax=(3,1) and A=[[3,1],[1,3]]. Keeping only the first pair produces(2,2); the lost connector is(1,−1), with length√2.</p><figcaption>Both terms retain equal [−3,3] scales and their signed cell values. A rank-one term performs a dot product, one scale and one output placement.</figcaption></figure>;
}

export function TwoColumnJacobiFigure() {
  const s=Math.sqrt(2);
  return <figure className="decomposition-inline" aria-label="A45degree right rotation makes the two columns perpendicular"><div className="decomposition-two"><div><p>Before · column dot product6</p><DecompositionPlane range={5} label="Before columns p=(3,1),q=(1,3) have squared lengths10 and inner product6." arrows={[{to:[3,1],label:'p'},{to:[1,3],label:'q',kind:'comparison'}]} /><DecompositionMatrix label="A" values={[[3,1],[1,3]]} /></div><div><p>After · column dot product0</p><DecompositionPlane range={5} label="After signed45degree rotation: pprime=(sqrt2,-sqrt2),qprime=(2sqrt2,2sqrt2), lengths2 and4." arrows={[{to:[s,-s],label:'p′'},{to:[2*s,2*s],label:'q′',kind:'comparison'}]} /><DecompositionMatrix label="A J · lengths2,4 before sorting" values={[[s,2*s],[-s,2*s]]} /></div></div><figcaption>Equal scales preserve lengths. J uses p′=cp−sq, q′=sp+cq with c=s=1/√2. Sorting the column lengths later also reorders the tracked right directions.</figcaption></figure>;
}

export function SingularValueBars({ singular, retained=2, logarithmic=false }) {
  return <svg className="decomposition-spectrum" viewBox="0 0 360 180" role="img" aria-label={logarithmic?'Logarithmic singular values1 and10^-8; zero is not represented on this logarithmic axis.':`Singular values ${singular.join(',')}; retained count${retained}.`}><title>{logarithmic?'Log10 singular values':'Singular-value budget'}</title><path className="decomposition-axis" d="M55 35V130H310" />{(logarithmic?[0,-4,-8]:[0,1.5,3]).map(t=><g key={t}><line className="decomposition-grid" x1="55" x2="310" y1={logarithmic?35-t/8*95:130-t/3*95} y2={logarithmic?35-t/8*95:130-t/3*95} /><text x="45" y={(logarithmic?35-t/8*95:130-t/3*95)+4} textAnchor="end">{logarithmic?`10^${t}`:t}</text></g>)}{singular.map((value,i)=>{const y=logarithmic?35-Math.log10(value)/8*95:130-value/3*95;return <g key={i}><line x1={130+i*100} x2={130+i*100} y1={logarithmic?130:130} y2={y} stroke={decompositionColors[i<retained?'current':'comparison']} strokeWidth="18" strokeDasharray={i<retained?undefined:'4 3'} /><circle cx={130+i*100} cy={y} r="5" fill={decompositionColors[i<retained?'current':'comparison']} /><text x={130+i*100} y="156" textAnchor="middle">σ{i+1}</text></g>;})}</svg>;
}
export function WeakDirectionFigure() {
  return <figure className="decomposition-inline" aria-label="Tiny singular value amplifies a tiny target change"><div className="decomposition-two"><SingularValueBars singular={[1,1e-8]} logarithmic /><div><DecompositionMatrix label="A: independent scales" values={[[1,0],[0,'10⁻⁸']]} /><DecompositionMatrix label="Target / solution, before then after" values={[[1,'10⁻⁸',1,1],[1,'2×10⁻⁸',1,2]]} columns={['b₁','b₂','x₁','x₂']} /><p>Changing b₂ by 10⁻⁸ changes x₂ by 1. Condition number 10⁸; normal-equation coefficient condition number 10¹⁶.</p></div></div><figcaption>The singular axis is logarithmic and labelled in powers of10. A zero scale requires a separate null label; log(0) is never drawn.</figcaption></figure>;
}

export function MinimumNormFigure() {
  return <figure className="decomposition-inline" aria-label="The line x1+x2=2 is tangent to the smallest origin-centred circle at(1,1)"><DecompositionPlane range={3} label="All solutions lie on x1+x2=2. Circle radius sqrt2 touches(1,1); solution(2,0) has greater length2." curves={[{points:circlePoints(Math.sqrt(2)),kind:'reference'}]} segments={[{from:[-1,3],to:[3,-1],kind:'comparison',solid:true}]} arrows={[{to:[1,1],label:'x*',dx:-10,anchor:'end'}]} points={[{at:[2,0],label:'(2,0)',dy:22}]} /><p>All coefficient pairs on the line give the same observable sum 2. The orthogonal foot(1,1) has squared length 2; (2,0) has squared length 4.</p><figcaption>Equal axis scales preserve the perpendicular/tangent geometry. Nullspace changes move along the line without changing the fitted observations.</figcaption></figure>;
}
