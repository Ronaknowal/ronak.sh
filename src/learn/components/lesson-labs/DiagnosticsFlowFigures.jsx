import { createContext, useContext, useId } from 'react';
import { diagnosticsStudy } from '../../data/training-diagnostics-study.js';
import { finiteScalarLoss, scalarTrace, meanVariance, diagnosticJacobian } from '../../data/diagnostics-reading-models.js';
import './diagnostics-reading-flow.css';

export const DIAGNOSTIC_PAINT = { input: '#6fd9eb', parameter: '#e5b55b', computed: '#b49aff', operation: '#e5e5e5', forward: '#898b90', gradient: '#f49a62', state: '#b49aff' };
export const diagnosticFormat = value => value === null || value === undefined ? 'undefined' : typeof value !== 'number' ? String(value) :
  (value !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6) ? value.toExponential(4) : Number(value.toFixed(6)).toString()).replace(/-/g, '−');
const Arrow = createContext('diagnostic');
export function DiagnosticScene({ width = 460, height, title, description, children }) {
  const id = useId().replace(/:/g, '');
  return <div className="diagnostics-flow-scene"><p id={`${id}-hint`} className="diagnostics-flow-pan">If needed, focus the drawing and use arrow keys or swipe to follow its connected operands.</p>
    <div className="diagnostics-flow-scroll" role="region" tabIndex={0} aria-label={title} aria-describedby={`${id}-hint`}>
      <Arrow.Provider value={id}><svg className="diagnostics-flow-svg" viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / 16}rem`, aspectRatio: `${width}/${height}` }} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{description}</desc>
        <defs><marker id={`${id}-forward`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill={DIAGNOSTIC_PAINT.forward}/></marker><marker id={`${id}-gradient`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill={DIAGNOSTIC_PAINT.gradient}/></marker></defs>
        {children}</svg></Arrow.Provider>
    </div></div>;
}
export function DiagnosticText({ x, y, children, role = 'operation', anchor = 'start' }) { return <text x={x} y={y} fill={DIAGNOSTIC_PAINT[role]} textAnchor={anchor}>{children}</text>; }
export function DiagnosticWire({ path, gradient = false, arrow = true }) { const id = useContext(Arrow); return <path d={path} fill="none" stroke={DIAGNOSTIC_PAINT[gradient ? 'gradient' : 'forward']} strokeWidth="1.7" strokeDasharray={gradient ? '5 4' : undefined} markerEnd={arrow ? `url(#${id}-${gradient ? 'gradient' : 'forward'})` : undefined}/>; }
export function DiagnosticCells({ values, x, y, width = 100, height = 40, columns = values.length, label, role = 'computed', selected = null }) {
  return <g>{label && <DiagnosticText x={x} y={y - 12} role={role}>{label}</DiagnosticText>}{values.map((value, i) => <g key={i}><rect x={x + (i % columns) * width} y={y + Math.floor(i / columns) * height} width={width - 4} height={height - 4} fill="#1b1b1d" stroke={selected === i ? '#fff' : DIAGNOSTIC_PAINT[role]} strokeWidth={selected === i ? 2.5 : 1}/><DiagnosticText x={x + (i % columns) * width + (width - 4) / 2} y={y + Math.floor(i / columns) * height + 24} role={role} anchor="middle">{diagnosticFormat(value)}</DiagnosticText></g>)}</g>;
}
export function DiagnosticOp({ x, y, symbol, radius = 20 }) { return <g data-diagnostic-operation={symbol}><rect x={x-radius} y={y-radius} width={2*radius} height={2*radius} rx={6} fill="#18181b" stroke={DIAGNOSTIC_PAINT.operation}/><DiagnosticText x={x} y={y + 5} anchor="middle">{symbol}</DiagnosticText></g>; }
// Every row is a real two-operand operation. Caption lanes remain outside wires.
export function DiagnosticBinary({ y, a, b, result, symbol, leftLabel, rightLabel, resultLabel, leftRole = 'computed', rightRole = 'input', gradient = false }) {
  return <g><DiagnosticCells values={[a]} x={25} y={y} width={160} label={leftLabel} role={leftRole}/><DiagnosticCells values={[b]} x={275} y={y} width={160} label={rightLabel} role={rightRole}/>
    <DiagnosticWire path={`M103 ${y + 36} V${y + 80} H200`} gradient={gradient}/><DiagnosticWire path={`M353 ${y + 36} V${y + 80} H240`} gradient={gradient}/><DiagnosticOp x={220} y={y + 80} symbol={symbol}/>
    <DiagnosticWire path={`M220 ${y + 100} V${y + 110} H10 V${y + 162} H25`} gradient={gradient}/><DiagnosticCells values={[result]} x={25} y={y + 144} width={160} label={resultLabel} role={gradient ? 'gradient' : 'computed'}/></g>;
}

export function DiagnosticRowDrawing({ row, weight }) {
  return <DiagnosticScene height={1040} title={`Row ${row.id}: actual prediction, residual, loss and raw derivative`} description={`Input ${row.x}, target ${row.y}, weight ${weight}; prediction ${row.prediction}, residual ${row.residual}, half-square ${row.loss}, raw derivative ${row.contribution}.`}>
    <DiagnosticText x={25} y={22}>Selected stable row ID {row.id}</DiagnosticText>
    <DiagnosticBinary y={60} a={weight} b={row.x} result={row.prediction} symbol="×" leftLabel="learned w" rightLabel="supplied x" resultLabel="prediction" leftRole="parameter"/>
    <DiagnosticBinary y={285} a={row.prediction} b={row.y} result={row.residual} symbol="−" leftLabel="prediction" rightLabel="target y" resultLabel="residual"/>
    <DiagnosticWire path="M103 465V485H10V553H25"/>
    <DiagnosticBinary y={535} a={row.residual} b={row.residual} result={row.residual * row.residual} symbol="×" leftLabel="residual" rightLabel="same residual" resultLabel="residual squared" rightRole="computed"/>
    <DiagnosticBinary y={770} a={row.residual * row.residual} b={2} result={row.loss} symbol="÷" leftLabel="residual squared" rightLabel="supplied divisor" resultLabel="row half-square loss"/>
    <DiagnosticWire path="M181 447H455V1020H435" gradient/>
    <DiagnosticCells values={[row.x]} x={275} y={936} width={160} label="same x" role="input"/>
    <DiagnosticWire path="M353 972V1000H320" gradient/><DiagnosticOp x={300} y={1000} symbol="×"/>
    <DiagnosticWire path="M435 1020H300" gradient/>
    <DiagnosticWire path="M280 1000H185" gradient/><DiagnosticCells values={[row.contribution]} x={25} y={982} width={160} label="raw derivative" role="gradient"/>
  </DiagnosticScene>;
}
export function DiagnosticMeanDrawing({ trace, selected }) {
  const rows = trace.details, columns = Math.min(4, rows.length), extent = Math.max(460, columns * 112 + 32);
  return <DiagnosticScene width={extent} height={600} title="Separate row-loss and raw-derivative sum/count branches" description={`${rows.length} rows including selected ID ${selected}; loss sum ${trace.lossSum} divided by count gives ${trace.loss}; derivative sum ${trace.contributionSum} divided by count gives ${trace.gradient}.`}>
    <DiagnosticText x={25} y={22}>Stable IDs: {rows.map(r => r.id).join(', ')}; white outline = {selected}</DiagnosticText>
    <DiagnosticCells values={rows.map(r => r.loss)} x={25} y={65} width={112} label="all row half-square losses" selected={rows.findIndex(r => r.id === selected)}/>
    <DiagnosticWire path={`M${25 + columns * 112 - 4} 83H${extent - 8}V142H240`}/><DiagnosticOp x={220} y={142} symbol="Σ"/>
    <DiagnosticWire path="M220 162V167H10V222H25"/><DiagnosticCells values={[trace.lossSum]} x={25} y={204} width={130} label="loss sum"/>
    <DiagnosticCells values={[rows.length]} x={320} y={204} width={112} label="count N" role="input"/><DiagnosticWire path="M151 222H200"/><DiagnosticWire path="M320 222H240"/><DiagnosticOp x={220} y={222} symbol="÷"/>
    <DiagnosticWire path="M220 242V282H250"/><DiagnosticCells values={[trace.loss]} x={250} y={264} width={180} label="mean loss"/>
    <DiagnosticCells values={rows.map(r => r.contribution)} x={25} y={345} width={112} label="all RAW derivative contributions" role="gradient" selected={rows.findIndex(r => r.id === selected)}/>
    <DiagnosticWire path={`M${25 + columns * 112 - 4} 363H${extent - 8}V417H240`} gradient/><DiagnosticOp x={220} y={417} symbol="Σ"/>
    <DiagnosticWire path="M220 437V443H10V498H25" gradient/><DiagnosticCells values={[trace.contributionSum]} x={25} y={480} width={130} label="raw sum" role="gradient"/>
    <DiagnosticCells values={[rows.length]} x={320} y={480} width={112} label="same N" role="input"/><DiagnosticWire path="M151 498H200" gradient/><DiagnosticWire path="M320 498H240" gradient/><DiagnosticOp x={220} y={498} symbol="÷"/>
    <DiagnosticWire path="M220 518V558H250" gradient/><DiagnosticCells values={[trace.gradient]} x={250} y={540} width={180} label="mean gradient g" role="gradient"/>
  </DiagnosticScene>;
}
export function DiagnosticMovementDrawing({ trace, weight, rate }) {
  return <DiagnosticScene height={585} title="Computed derivative versus called and absent update" description={`Gradient ${trace.gradient}; supplied rate ${rate}; called next weight ${trace.after}; absent step weight ${weight}. Represented movement ${trace.representedChange}.`}>
    <DiagnosticBinary y={50} a={rate} b={trace.gradient} result={rate * trace.gradient} symbol="×" leftLabel="supplied rate η" rightLabel="gradient g" resultLabel="signed step ηg" leftRole="input" rightRole="gradient"/>
    <DiagnosticBinary y={280} a={weight} b={rate * trace.gradient} result={trace.after} symbol="−" leftLabel="copied old w" rightLabel="signed step ηg" resultLabel="called: next w" leftRole="parameter" rightRole="computed"/>
    <DiagnosticCells values={[weight]} x={275} y={424} width={160} label="absent step: old w" role="parameter"/>
    <DiagnosticWire path="M353 316V401H353" arrow={false}/><DiagnosticText x={25} y={522}>Represented after − before: {diagnosticFormat(trace.representedChange)}</DiagnosticText>
    <DiagnosticText x={25} y={550}>Intended −ηg: {diagnosticFormat(trace.intendedChange)}</DiagnosticText>
    <DiagnosticText x={25} y={578}>{trace.distinguishes ? 'This represented case distinguishes the two branches.' : 'This represented case does not distinguish the branches.'}</DiagnosticText>
  </DiagnosticScene>;
}
export function DiagnosticPlot({ title, description, series, xDomain, yDomain, xLabel, yLabel, log = false, points = [], width = 560, height = 370 }) {
  const [xmin, xmax] = xDomain, [ymin, ymax] = yDomain, transform = value => log ? Math.log10(value) : value;
  const x = value => 105 + (value - xmin) / (xmax - xmin) * (width - 140);
  const y = value => 240 - (transform(value) - transform(ymin)) / (transform(ymax) - transform(ymin)) * 185;
  const ticks = log ? [.0005, .01, .1, 1, 4] : [ymin, (ymin + ymax) / 2, ymax];
  // The plot coordinates remain unchanged. Labels have their own readable gutter
  // and leaders attached to actual endpoints/selected points, not a swatch key.
  const entries = series.map(line => ({ ...line, kind:'curve', target:line.values.at(-1) }))
    .concat(points.map(point => ({ ...point, kind:'point', target:[point.x,point.y] })));
  const groups = [];
  for (const entry of entries) {
    const group = groups.find(g => entry.calloutGroup ? g.key===entry.calloutGroup : !g.key && g.kind===entry.kind && g.target[0]===entry.target[0] && g.target[1]===entry.target[1]);
    if (group) group.entries.push(entry);
    else groups.push({key:entry.calloutGroup,kind:entry.kind,target:entry.target,entries:[entry]});
  }
  const wrap = label => { const lines=[];let current='';for(const word of label.split(' ')){if(current && (current+' '+word).length>24){lines.push(current);current=word;}else current+=(current?' ':'')+word;}if(current)lines.push(current);return lines; };
  let nextLane=50;
  const annotations = groups.sort((a,b)=>y(a.target[1])-y(b.target[1])).map(group => {
    const note=group.entries[0].calloutNote || (group.entries.length>1 ? `Shared ${group.kind==='curve'?'endpoint':'point'}: x ${diagnosticFormat(group.target[0])}, y ${diagnosticFormat(group.target[1])}` : null);
    const labels=(note?wrap(note):[]).map(text=>({text,note:true})).concat(group.entries.flatMap(entry=>wrap(entry.label).map(text=>({text}))));
    const lane=nextLane;nextLane+=24*labels.length+24;
    return {...group,labels,lane};
  });
  const labelX=width+12;
  return <DiagnosticScene {...{ width:width+220, height:Math.max(height,nextLane+20), title, description }}><path d={`M105 45V240H${width - 35}`} fill="none" stroke="#aaa"/>
    {ticks.map(value => <DiagnosticText key={value} x={95} y={y(value) + 5} anchor="end">{diagnosticFormat(value)}</DiagnosticText>)}
    {[xmin, (xmin + xmax) / 2, xmax].map(value => <DiagnosticText key={value} x={x(value)} y={265} anchor="middle">{diagnosticFormat(value)}</DiagnosticText>)}
    {series.map(line => <polyline key={line.label} data-diagnostic-series={line.label} points={line.values.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} fill="none" stroke={line.color} strokeWidth="2" strokeDasharray={line.dashed ? '5 4' : undefined}/>)}
    {points.map((point, i) => <circle key={i} cx={x(point.x)} cy={y(point.y)} r="5" fill={point.color || '#fff'} stroke="#fff"><title>{point.label}</title></circle>)}
    {annotations.map((group,i)=><g key={i} data-diagnostic-callout={group.entries.map(e=>e.label).join(' | ')}>
      {group.entries.map((entry,j)=><path key={j} data-callout-target={JSON.stringify(entry.target)} d={`M${x(entry.target[0])} ${y(entry.target[1])}H${width-27}L${labelX-8} ${group.lane-5}`} fill="none" stroke={entry.color||'#bbb'} strokeWidth="1.2" strokeDasharray={entry.kind==='point'?'3 3':undefined}/>)}
      {group.labels.map((label,j)=><DiagnosticText key={j} x={labelX} y={group.lane+24*j}>{label.text}</DiagnosticText>)}
    </g>)}
    <DiagnosticText x={105} y={293}>x: {xLabel}; y: {yLabel}{log ? ' (log)' : ''}</DiagnosticText>
  </DiagnosticScene>;
}
export function DiagnosticRateDrawing({ state, trace }) {
  const low = Math.min(-3, state.weight, trace.after, trace.optimum ?? state.weight), high = Math.max(3, state.weight, trace.after, trace.optimum ?? state.weight);
  const values = Array.from({ length: 121 }, (_, i) => { const w = low + (high - low) * i / 120; return [w, scalarTrace(state.rows, w, state.rate).loss]; });
  const maximum = Math.max(1, ...values.map(v => v[1]), trace.nextLoss) * 1.05;
  return <><DiagnosticPlot title="Calculated scalar objective and actual update positions" description={`Curvature ${trace.curvature}, optimum ${trace.optimum}, current ${state.weight}, next ${trace.after}.`} series={[{ label: 'Calculated mean half-square L(w)', color: DIAGNOSTIC_PAINT.computed, values }]}
    xDomain={[low, high]} yDomain={[0, maximum]} xLabel="weight w" yLabel="mean half-square" points={[{ x: state.weight, y: trace.loss, label: 'current weight' }, { x: trace.after, y: trace.nextLoss, color: DIAGNOSTIC_PAINT.parameter, label: 'called next weight' }, ...(trace.optimum === null ? [] : [{ x: trace.optimum, y: scalarTrace(state.rows, trace.optimum, 0).loss, color: DIAGNOSTIC_PAINT.computed, label: 'calculated optimum' }])]} />
    <p aria-live="polite">Current w {diagnosticFormat(state.weight)} → next {diagnosticFormat(trace.after)}; optimum {diagnosticFormat(trace.optimum)}. Curvature A {diagnosticFormat(trace.curvature)}; error multiplier 1−ηA {diagnosticFormat(1 - state.rate * trace.curvature)}. Loss {diagnosticFormat(trace.loss)} → {diagnosticFormat(trace.nextLoss)}.</p></>;
}
export function DiagnosticTinyDrawing() {
  return <DiagnosticPlot title="Every retained seed7 tiny fitting checkpoint" description="Measured121 checkpoints for called and omitted update on twelve inspected rows; common axes, no fabricated gradient history." series={diagnosticsStudy.tiny.map((run, i) => ({ label: i === 0 ? 'Called update: tiny12' : 'Omitted update: tiny12', color: i === 0 ? DIAGNOSTIC_PAINT.parameter : DIAGNOSTIC_PAINT.input, values: run.trace.map(row => [row.update, row.train_supplied.loss]) }))}
    xDomain={[0, 120]} yDomain={[0, 1.1]} xLabel="completed update attempts" yLabel="nats / row" />;
}
export function DiagnosticFiniteDrawing() {
  const h = .01, w = .5, plus = finiteScalarLoss(w + h), minus = finiteScalarLoss(w - h), difference = plus - minus;
  return <><DiagnosticScene height={820} title="Two independent losses form a centered finite difference" description={`At weight .5, h .01, losses ${plus}/${minus}; divide their difference by .02 to get .75.`}>
    <DiagnosticCells values={[w + h]} x={25} y={50} width={160} label="w + h" role="input"/><DiagnosticCells values={[w - h]} x={275} y={50} width={160} label="w − h" role="input"/>
    <DiagnosticWire path="M103 86V145H103"/><DiagnosticWire path="M353 86V145H353"/><DiagnosticOp x={103} y={165} symbol="L"/><DiagnosticOp x={353} y={165} symbol="L"/>
    <DiagnosticWire path="M103 185V207H10V252H25"/><DiagnosticCells values={[plus]} x={25} y={234} width={160} label="fresh L(w+h)"/>
    <DiagnosticWire path="M353 185V207H445V252H435"/><DiagnosticCells values={[minus]} x={275} y={234} width={160} label="fresh L(w−h)"/>
    <DiagnosticBinary y={355} a={plus} b={minus} result={difference} symbol="−" leftLabel="fresh upper loss" rightLabel="fresh lower loss" resultLabel="loss difference" rightRole="computed"/>
    <DiagnosticBinary y={610} a={difference} b={2 * h} result={difference / (2 * h)} symbol="÷" leftLabel="loss difference" rightLabel="supplied 2h" resultLabel="centered derivative" gradient/>
  </DiagnosticScene><DiagnosticPlot title="Centered secant and local tangent on the same calculated quadratic" description="At w .5 the centered secant and tangent both have slope .75. The secant is .000125 higher; this gap is visually unresolved at this plot scale." series={[{label:'Calculated objective L(w)',color:DIAGNOSTIC_PAINT.computed,values:Array.from({length:81},(_,i)=>{const x=.2+i*.0075;return[x,finiteScalarLoss(x)];})},{label:'Centered secant through w±.01',calloutGroup:'secant-tangent',calloutNote:'Same slope .75; secant .000125 higher (unresolved at this scale)',color:DIAGNOSTIC_PAINT.input,values:[[.2,minus+(.2-(w-h))*difference/(2*h)],[.8,minus+(.8-(w-h))*difference/(2*h)]]},{label:'Local tangent .3125+.75(w−.5)',calloutGroup:'secant-tangent',color:DIAGNOSTIC_PAINT.gradient,dashed:true,values:[[.2,.3125+.75*(.2-.5)],[.8,.3125+.75*(.8-.5)]]}]} xDomain={[.2,.8]} yDomain={[0,.7]} xLabel="weight w" yLabel="mean half-square" height={410} points={[{x:w-h,y:minus,label:'lower fresh loss'},{x:w+h,y:plus,label:'upper fresh loss'}]}/></>;
}
function DiagnosticContraction({label,a,b,result,y}) {
  const products=a.map((value,i)=>value*b[i]);
  return <g><DiagnosticText x={25} y={y}>{label}</DiagnosticText><DiagnosticCells values={a} x={25} y={y+50} width={100} label="first vector" role="gradient"/><DiagnosticCells values={b} x={475} y={y+50} width={100} label="second vector" role="input"/>
    <DiagnosticWire path={`M221 ${y+68}H320`}/><DiagnosticWire path={`M475 ${y+68}H360`}/><DiagnosticOp x={340} y={y+68} symbol="×"/>
    <DiagnosticWire path={`M340 ${y+88}V${y+110}H10V${y+168}H25`}/><DiagnosticCells values={products} x={25} y={y+150} width={100} label="coordinate products" role="gradient"/><DiagnosticWire path={`M221 ${y+168}H320`}/><DiagnosticOp x={340} y={y+168} symbol="Σ"/><DiagnosticWire path={`M360 ${y+168}H475`}/><DiagnosticCells values={[result]} x={475} y={y+150} width={180} label="sum of products" role="gradient"/></g>;
}
export function DiagnosticJacobianDrawing() {
  const matrix = diagnosticJacobian([1, 2]);
  return <><DiagnosticScene width={720} height={600} title="Full Jacobian before forward and reverse contractions" description="f(a,b)=(a²+3b,ab), at1,2 yields7,2; J rows outputs, columns inputs, [[2,3],[2,1]]. u1,-1 gives -1,1; v2,-1 gives2,5; scalar -3.">
    <DiagnosticCells values={[1, 2]} x={25} y={55} width={105} label="supplied inputs a,b" role="input"/><DiagnosticCells values={[7, 2]} x={360} y={55} width={105} label="outputs a²+3b, ab"/>
    <DiagnosticText x={25} y={160}>Column a: derivatives 2a, b</DiagnosticText><DiagnosticText x={360} y={160}>Column b: derivatives 3, a</DiagnosticText>
    <DiagnosticCells values={matrix.flat()} columns={2} x={240} y={220} width={105} height={60} label="J: output rows / input columns" role="gradient"/>
    <DiagnosticText x={25} y={248}>output a²+3b</DiagnosticText><DiagnosticText x={25} y={308}>output ab</DiagnosticText>
    <DiagnosticCells values={[1, -1]} x={25} y={400} width={105} label="input direction u" role="input"/><DiagnosticCells values={[-1, 1]} x={360} y={400} width={105} label="Ju: row products summed" role="gradient"/>
    <DiagnosticCells values={[2, -1]} x={25} y={500} width={105} label="output seed v" role="input"/><DiagnosticCells values={[2, 5]} x={360} y={500} width={105} label="vᵀJ: column products summed" role="gradient"/>
    <DiagnosticText x={25} y={580}>vᵀJu = 2×(−1) + (−1)×1 = −3; a wrong row [1,1] cancels in u.</DiagnosticText>
  </DiagnosticScene><DiagnosticScene width={720} height={1260} title="Every Jacobian contraction exposes its coordinate products and sum" description="Jrow1dotu=2×1+3×−1=−1;row2=2×1+1×−1=1;v dotcolumn1=2×2+−1×2=2;column2=2×3+−1×1=5;v dotJu=−3.">
    <DiagnosticContraction label="Forward row1: [2,3] · input direction [1,−1]" a={[2,3]} b={[1,-1]} result={-1} y={25}/>
    <DiagnosticContraction label="Forward row2: [2,1] · input direction [1,−1]" a={[2,1]} b={[1,-1]} result={1} y={275}/>
    <DiagnosticContraction label="Reverse column1: output seed [2,−1] · [2,2]" a={[2,-1]} b={[2,2]} result={2} y={525}/>
    <DiagnosticContraction label="Reverse column2: output seed [2,−1] · [3,1]" a={[2,-1]} b={[3,1]} result={5} y={775}/>
    <DiagnosticContraction label="Directional scalar: output seed [2,−1] · Ju [−1,1]" a={[2,-1]} b={[-1,1]} result={-3} y={1025}/>
  </DiagnosticScene></>;
}
