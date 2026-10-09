import { useState } from 'react';
import { curvatureTrace, safeguardedNewtonState } from '../../data/second-order-methods-models.js';
import { Arrow, CirclePath, Curve, DataTable, Key, Line, Mark, Matrix, Mechanism, NumericControl, Plane, Readout, VectorView, fmt, ink, vec } from './SecondOrderReadingPrimitives.jsx';

const pairs = [ink.cyan, ink.amber];
const sample = (fn, a, b, count = 181) => Array.from({ length: count }, (_, i) => { const x = a + (b - a) * i / (count - 1); return [x, fn(x)]; });
const doubleWell = ([x, y]) => (x * x - 1) ** 2 / 4 + y * y / 2;
function Contours({ map, curvature = 200, angle = 0, center = [0, 0], levels = [1, 4, 25, 100] }) {
  return levels.map(level => <CirclePath key={level} center={center} radii={[Math.sqrt(2 * level / curvature), Math.sqrt(level)]} angle={angle * Math.PI / 180} map={map} colour={ink.muted} />);
}
function WellContours({ map }) {
  return [.025, .1, .25, .5, 1].flatMap(level => {
    const outer = Math.sqrt(1 + 2 * Math.sqrt(level));
    const inner = level < .25 ? Math.sqrt(1 - 2 * Math.sqrt(level)) : 0;
    const components = level < .25 ? [[-outer, -inner], [inner, outer]] : [[-outer, outer]];
    return components.map(([a,b], component) => {
      const upper = Array.from({length:301}, (_,i) => { const x=a+(b-a)*i/300; return [x, i===0 || i===300 ? 0 : Math.sqrt(Math.max(0,2*level-.5*(x*x-1)**2))]; });
      const points=[...upper,...upper.slice(0,-1).reverse().map(([x,y])=>[x,-y])];
      return <Line key={`${level}-${component}`} map={map} colour={ink.muted} width={1} points={points} />;
    });
  });
}
function Slice({ label, fn, xDomain, yDomain, colour, marked = [] }) {
  return <Plane label={label} domain={xDomain} yDomain={yDomain} equal={false} xLabel="varied coordinate" yLabel="loss">{map => <><Curve fn={fn} from={xDomain[0]} to={xDomain[1]} map={map} colour={colour} />{marked.map((point, i) => <Mark key={i} point={point} map={map} colour={colour} />)}</>}</Plane>;
}

export function S01() {
  return <Mechanism id="S01" label="One parameter point and two different coordinate loss slices"><Plane label="Both settings together: f = 100x² + y²" domain={[-1.3, 1.3]}>{map => <><Contours map={map} /><Arrow end={[1, 0]} map={map} colour={ink.cyan} /><Arrow start={[1, 0]} end={[1, 1]} map={map} colour={ink.amber} shape="square" /><Mark point={[1, 1]} selected map={map} /><Mark point={[0, 0]} shape="cross" colour={ink.neutral} map={map} /></>}</Plane><Key items={[["x displacement", ink.cyan, '●'], ['y displacement', ink.amber, '■'], ['current (1,1), loss 101', ink.neutral, '◯'], ['minimum (0,0), loss 0', ink.neutral, '×']]} /><p>Contours: loss 1, 4, 25 and 100, from inner to outer.</p><div className="so-columns"><Slice label="Hold y = 1; change x" fn={x => 100 * x * x + 1} xDomain={[-1.3, 1.3]} yDomain={[0, 175]} colour={ink.cyan} marked={[[1, 101]]} /><Slice label="Hold x = 1; change y" fn={y => 100 + y * y} xDomain={[-1.3, 1.3]} yDomain={[99.8, 102]} colour={ink.amber} marked={[[1, 101]]} /></div><figcaption>The slice height ranges differ; each labelled point is the same loss 101.</figcaption></Mechanism>;
}

function CoordinateMove({ label, start, end, colour, domain }) {
  return <div><Plane label={label} domain={domain} yDomain={[-.12, .12]} equal={false} xLabel="setting" yLabel="arrows lie on the zero baseline">{map => <Arrow start={[start, 0]} end={[end, 0]} map={map} colour={colour} />}</Plane><p>{fmt(start)} → {fmt(end)}; change {fmt(end - start)}</p></div>;
}
export function S02() {
  return <Mechanism id="S02" label="Large and smaller gradient descent coordinate updates"><p>Rate .1. The x ruler interrupts the gap between −18 and −1.2; screen lengths across the break are not distances.</p><div className="so-interrupted" role="img" aria-label="Interrupted x scale, arrow from 1 to minus 19, displacement minus 20"><div><Plane label="Distant x endpoint" domain={[-20, -18]} yDomain={[-1, 1]} equal={false} xLabel="x" yLabel="zero baseline">{map => <><Line points={[[-18, 0], [-19, 0]]} map={map} colour={ink.cyan} /><Mark point={[-19, 0]} map={map} colour={ink.cyan} /></>}</Plane></div><span className="so-break">↤ // ↤<br />interrupted scale</span><div><Plane label="Local x start" domain={[-1.2, 1.2]} yDomain={[-1, 1]} equal={false} xLabel="x" yLabel="zero baseline">{map => <><Mark point={[1,0]} map={map} colour={ink.cyan} hollow /><Arrow start={[1, 0]} end={[-1.2, 0]} map={map} colour={ink.cyan} endpoint={false} /></>}</Plane></div></div><p>x: 1 → −19; change −20.</p><CoordinateMove label="Rate .1: y" start={1} end={.8} colour={ink.amber} domain={[.6, 1.2]} /><p>Rate .008. Both coordinate rulers below share the displayed interval.</p><div className="so-columns"><CoordinateMove label="x error multiplied by −.6" start={1} end={-.6} colour={ink.cyan} domain={[-1.2, 1.2]} /><CoordinateMove label="y error multiplied by .984" start={1} end={.984} colour={ink.amber} domain={[-1.2, 1.2]} /></div></Mechanism>;
}

export function S03() {
  return <Mechanism id="S03" label="The columns of the Hessian map equal displacement lengths to different gradient changes"><div className="so-columns"><VectorView label="Parameter displacement δ" domain={[-.002, .012]} xLabel="δx" yLabel="δy" vectors={[{ end: [.01, 0], colour: ink.cyan, label: 'first displacement' }, { end: [0, .01], colour: ink.amber, shape: 'square', label: 'second displacement' }]} /><VectorView label="Gradient change Hδ" domain={[-.2, 2.2]} xLabel="Δgx" yLabel="Δgy" vectors={[{ end: [2, 0], colour: ink.cyan, label: 'first response' }, { end: [0, .02], colour: ink.amber, shape: 'square', label: 'second response' }]} /></div><Matrix label="H: gradient rows, parameter columns" values={[[200, 0], [0, 2]]} rows={['gx', 'gy']} columns={['δx', 'δy']} rowColours={pairs} columnColours={pairs} /><div className="so-columns"><p>.01 × first column = (2,0).<br />.01 × second column = (0,.02).</p><VectorView label="Magnified weak response; gradient units" domain={[-.005, .025]} xLabel="Δgx" yLabel="Δgy" vectors={[{ end: [0, .02], colour: ink.amber, shape: 'square', label: 'second response, unchanged value' }]} /></div></Mechanism>;
}

export function S04() {
  return <Mechanism id="S04" label="Hessian action stretches independent displacement directions"><div className="so-columns"><Plane label="Unit displacement circle" domain={[-1.2, 1.2]} xLabel="δx" yLabel="δy">{map => <><CirclePath map={map} /><Arrow end={[1, 0]} map={map} colour={ink.cyan} /><Arrow end={[0, 1]} map={map} colour={ink.amber} shape="square" /></>}</Plane><Plane label="Image ellipse Hδ; true 100:1 axis ratio" domain={[-220, 220]} xLabel="Δgx" yLabel="Δgy">{map => <><CirclePath radii={[200, 2]} map={map} /><Arrow end={[200, 0]} map={map} colour={ink.cyan} /><Arrow end={[0, 2]} map={map} colour={ink.amber} shape="square" /></>}</Plane></div><VectorView label="Weak direction detail, gradient units" domain={[-2.5, 2.5]} xLabel="Δgx" yLabel="Δgy" vectors={[{ end: [0, 2], colour: ink.amber, shape: 'square', label: 'y eigenvalue 2' }]} /><p>The thin ellipse is intentional. Curvature along x is 200; along y it is 2.</p><div className="so-lengths"><div style={{ width: '100%', background: ink.cyan }} /><div style={{ width: '1%', background: ink.amber }} /></div><p>Aligned lengths on 0–200 curvature scale: 200 and 2.</p></Mechanism>;
}

export function S05() {
  const angle = Math.PI / 6, h = [[150.5, 99 * Math.sqrt(3) / 2], [99 * Math.sqrt(3) / 2, 51.5]];
  return <Mechanism id="S05" label="Thirty degree rotation couples coordinates without changing curvature eigenvalues"><Plane label="Rotated quadratic contours" domain={[-1.5, 1.5]}>{map => <><Contours angle={30} map={map} /><Arrow end={[Math.cos(angle), Math.sin(angle)]} map={map} colour={ink.cyan} /><Arrow end={[-Math.sin(angle), Math.cos(angle)]} map={map} colour={ink.amber} shape="square" /><Line points={Array.from({ length: 30 }, (_, i) => [.3 * Math.cos(angle * i / 29), .3 * Math.sin(angle * i / 29)])} map={map} colour={ink.neutral} /></>}</Plane><Key items={[["first eigenaxis, 30° from x, curvature 200", ink.cyan, '●'], ['second eigenaxis, curvature 2', ink.amber, '■']]} /><Matrix label="H = R diag(200,2) Rᵀ" values={h} rows={['gx', 'gy']} columns={['δx', 'δy']} /><p>Off-diagonal entries are exactly 99√3/2. Contour levels remain 1,4,25,100.</p></Mechanism>;
}

export function S06() {
  const rotated = curvatureTrace(200, 30, 1.6, 0);
  return <Mechanism id="S06" label="Solve the reverse Hessian correspondence then subtract the recovered offset"><div className="so-columns"><VectorView label="Parameter offset s" vectors={[{ end: [1, 1], colour: ink.amber, shape: 'square', label: 's' }]} /><VectorView label="Gradient image Hs = g" domain={[-20, 220]} xLabel="gx" yLabel="gy" vectors={[{ end: [200, 2], colour: ink.cyan, label: 'g' }]} /></div><p className="so-operation">Forward: Hs = g. Reverse solve: given H and g, recover s.</p><Plane label="Subtract in parameter space: θ − s" domain={[-.3, 1.3]}>{map => <><Mark point={[1, 1]} map={map} selected colour={ink.amber} shape="square" /><Arrow start={[1, 1]} end={[0, 0]} map={map} colour={ink.cyan} shape="triangle" /></>}</Plane><Readout rows={[["θ", '(1,1)'], ['−s displacement', '(−1,−1)'], ['θ − s', '(0,0)'], ['Rotated g = H(1,1)', vec(rotated.initialGradient)], ['Rotated solution s', '(1,1)']]} /><Matrix label="Rotated solve uses both columns" values={rotated.hessian} /></Mechanism>;
}

export function S07() {
  const [inputs, setInputs] = useState({ curvature: 200, angle: 0, rate: 1.6, index: 0 });
  const [reset, setReset] = useState(0);
  const state = curvatureTrace(inputs.curvature, inputs.angle, inputs.rate, 24);
  const frame = state.frames[inputs.index];
  const extent = Math.max(1.3, ...state.frames.flatMap(f => f.point.map(x => Math.abs(x) + .2)));
  const edit = (key, value) => setInputs(old => ({ ...old, [key]: value }));
  return <Mechanism id="S07" label="Live gradient descent and Newton curvature comparison" state={{ ...inputs, ...state, selected: frame }}><Plane label={`Current valley; inspected update ${inputs.index}`} domain={[-extent, extent]}>{map => <><Contours curvature={inputs.curvature} angle={inputs.angle} levels={[.1, 1, inputs.curvature / 8, inputs.curvature / 2]} map={map} /><Line points={state.frames.map(f => f.point)} map={map} colour={ink.amber} dash="3 5" width={1} />{state.frames.map((f, i) => <Mark key={i} point={f.point} map={map} colour={ink.amber} shape="square" hollow size={3} />)}<Line points={state.frames.slice(0, inputs.index + 1).map(f => f.point)} map={map} colour={ink.amber} /><Mark point={frame.point} map={map} colour={ink.amber} shape="square" selected /><Mark point={[0, 0]} map={map} colour={ink.cyan} shape="triangle" size={6} /></>}</Plane><Key items={[["GD; dashed hollow future preview, solid selected prefix", ink.amber, '■'], ['one Newton endpoint', ink.cyan, '▲'], ['inspected state ring', ink.neutral, '◯']]} /><div className="so-controls"><NumericControl label="Steep curvature" value={inputs.curvature} onChange={v => edit('curvature', v)} min={2} max={200} step={2} resetKey={reset} /><NumericControl label="Valley angle (degrees)" value={inputs.angle} onChange={v => edit('angle', v)} min={0} max={90} step={5} resetKey={reset} /><NumericControl label="Rate × curvature" value={inputs.rate} onChange={v => edit('rate', v)} min={.1} max={1.9} step={.1} resetKey={reset} /><NumericControl label="Inspect update" value={inputs.index} onChange={v => edit('index', v)} min={0} max={24} integer resetKey={reset} /></div><button onClick={() => { setInputs({ curvature: 200, angle: 0, rate: 1.6, index: 0 }); setReset(r => r + 1); }}>Reset</button><Readout rows={[["Actual rate η = product / curvature", fmt(state.rate)], ['Selected θ', vec(frame.point)], ['Selected loss', fmt(frame.objective)], ['First update displacement', vec(state.frames[1].point.map(x => x - 1))], ['Fixed Newton endpoint', '(0,0)']]} /><DataTable label="All 25 computed GD states; selection does not hide future states" columns={['Update', 'x', 'y', 'Loss']} rows={state.frames.map((f, i) => [i === inputs.index ? `${i} · selected` : i, ...f.point.map(fmt), fmt(f.objective)])} /></Mechanism>;
}

function QuadraticSurface({ label, fn }) {
  const grid = Array.from({ length: 9 }, (_, i) => -.8 + i * .2);
  const project = ([x, y, z]) => [x - .55 * y, .35 * y + z];
  return <div><Plane label={label} domain={[-1.35, 1.35]} yDomain={[-.8, 1.4]} equal={false} xLabel="dx − .55dy (perspective)" yLabel="height + .35dy (perspective)">{map => grid.flatMap((fixed, i) => [<Line key={`x${i}`} points={grid.map(t => project([t, fixed, fn(t, fixed)]))} map={map} colour={ink.cyan} width={1} />, <Line key={`y${i}`} points={grid.map(t => project([fixed, t, fn(fixed, t)]))} map={map} colour={ink.amber} width={1} />])}</Plane><p>Wireframe coordinates: dx,dy ∈ [−.8,.8]; height is the stated model value. Perspective lengths are not distances.</p></div>;
}
export function S08() {
  const fn = (x, y) => .3554 - .192 * x + .5 * y - .44 * x * x + .5 * y * y;
  return <Mechanism id="S08" label="Constant, tangent and quadratic parts in displacement space"><div className="so-columns"><QuadraticSurface label="Constant height .3554" fn={() => .3554} /><QuadraticSurface label="Tangent: add −.192dx + .5dy" fn={(x, y) => .3554 - .192 * x + .5 * y} /><QuadraticSurface label="Full quadratic: add −.44dx² + .5dy²" fn={fn} /></div><div className="so-columns"><Slice label="Full model along dx, dy = 0" fn={x => fn(x, 0)} xDomain={[-.8, .8]} yDomain={[-.25, 1.3]} colour={ink.cyan} marked={[[0, .3554]]} /><Slice label="Full model along dy, dx = 0" fn={y => fn(0, y)} xDomain={[-.8, .8]} yDomain={[-.25, 1.3]} colour={ink.amber} marked={[[0, .3554]]} /></div><figcaption>Local displacement d is measured from θ=(.2,.5). All three share height .3554 at d=0; the full model has opposite curvature signs and no unconstrained minimum.</figcaption></Mechanism>;
}

export function S09() {
  return <Mechanism id="S09" label="A positive definite model has a descending minimizing displacement"><Plane label="m(d) − f; contours around d* = (−1,−1)" domain={[-2.2, 1.2]} xLabel="dx" yLabel="dy">{map => <><Contours center={[-1, -1]} map={map} /><Mark point={[0, 0]} map={map} selected colour={ink.neutral} /><Arrow end={[-1, -1]} map={map} colour={ink.cyan} shape="triangle" /></>}</Plane><DataTable label="Negative reciprocal curvature acts on each gradient component" columns={['Direction', 'Gradient', 'Curvature', 'Displacement']} rows={[["x", 200, 200, -1], ['y', 2, 2, -1]]} /><p>Initial slope gᵀd = −202. The contours shown have model value −101 + {"{1,4,25,100}"}.</p><VectorView label="At zero gradient, the displacement is zero" vectors={[{ end: [0, 0], colour: ink.cyan, shape: 'triangle', label: 'd = 0' }]} /></Mechanism>;
}

export function S10() {
  return <Mechanism id="S10" label="Two minima separated by a saddle"><Plane label="Double-well loss" domain={[-1.6, 1.6]} yDomain={[-1.1, 1.1]}>{map => <><WellContours map={map} /><Mark point={[-1, 0]} map={map} colour={ink.cyan} shape="triangle" /><Mark point={[1, 0]} map={map} colour={ink.cyan} shape="triangle" /><Mark point={[0, 0]} map={map} colour={ink.rose} shape="diamond" selected /></>}</Plane><Key items={[["minima (−1,0),(1,0), loss 0", ink.cyan, '▲'], ['saddle (0,0), loss .25', ink.rose, '◆']]} /><div className="so-columns"><Slice label="Through the saddle: x curvature −1" fn={x => doubleWell([x, 0])} xDomain={[-1.5, 1.5]} yDomain={[0, .9]} colour={ink.cyan} marked={[[0, .25]]} /><Slice label="Through the saddle: y curvature +1" fn={y => doubleWell([0, y])} xDomain={[-1.5, 1.5]} yDomain={[0, 1.5]} colour={ink.amber} marked={[[0, .25]]} /></div></Mechanism>;
}

export function S11() {
  const final = -1 / 55, xloss = doubleWell([final, 0]);
  return <Mechanism id="S11" label="Newton raises x loss but eliminating y error may lower total loss"><Plane label="Same raw Newton x move; different y starts" domain={[-.3, .7]}>{map => <><Mark point={[.2,0]} map={map} colour={ink.cyan} /><Mark point={[.2,.5]} map={map} colour={ink.amber} shape="square" /><Arrow start={[.2, 0]} end={[final, 0]} map={map} colour={ink.cyan} /><Arrow start={[.2, .5]} end={[final, 0]} map={map} colour={ink.amber} shape="square" /><Mark point={[final, 0]} map={map} selected colour={ink.cyan} /></>}</Plane><Key items={[["start (.2,0)", ink.cyan, '●'], ['start (.2,.5)', ink.amber, '■']]} /><Plane label="Loss contributions share one zero-based height scale" domain={[-.5, 2.5]} yDomain={[0, .4]} equal={false} xTicks={[[0,"(.2, 0)"],[1,"(.2, .5)"],[2,"endpoint"]]} xLabel="state" yLabel="loss">{map => [[.2304, 0], [.2304, .125], [xloss, 0]].map(([a, b], i) => <g key={i}><rect x={map.x(i) - 15} y={map.y(a)} width="30" height={map.y(0) - map.y(a)} fill={ink.violet} /><rect x={map.x(i) - 15} y={map.y(a + b)} width="30" height={map.y(a) - map.y(a + b)} fill={ink.rose} /><Mark point={[i, a + b]} map={map} colour={ink.neutral} /></g>)}</Plane><Key items={[["x loss", ink.violet, '■'], ['y loss', ink.rose, '■']]} /><DataTable label="Separate contributions and totals" columns={['State', 'x loss', 'y loss', 'Total']} rows={[["(.2,0)", .2304, 0, .2304], ['(.2,.5)', .2304, .125, .3554], ['(−1/55,0)', fmt(xloss), 0, fmt(xloss)]]} /></Mechanism>;
}

function EigenShift({ values, damping }) {
  const low = Math.min(-1.1, ...values) - .15, high = Math.max(2.4, ...values.map(v => v + damping)) + .15;
  return <div><Plane label={`Shift each eigenvalue by ${fmt(damping)}`} domain={[low, high]} yDomain={[-.5, 1.5]} equal={false} xLabel="eigenvalue" yLabel="x direction / y direction">{map => values.map((v, i) => <Arrow key={i} start={[v, i]} end={[v + damping, i]} map={map} colour={pairs[i]} shape={i ? 'square' : 'circle'} />)}</Plane><Key items={values.map((v, i) => [`${i ? 'y' : 'x'}: ${fmt(v)} → ${fmt(v + damping)}`, pairs[i], i ? '■' : '●'])} /></div>;
}
export function S12() {
  return <Mechanism id="S12" label="Damping shifts eigenvalues and changes the candidate direction"><EigenShift values={[-.88, 1]} damping={1.2} /><VectorView label="Direction before a step length is chosen" domain={[-.8, .8]} xLabel="dx" yLabel="dy" vectors={[{ end: [.6, -5 / 22], colour: ink.violet, label: 'damped d' }]} /><EigenShift values={[-.88, 1]} damping={.88} /><figcaption>At λ=.88, x curvature becomes zero. The shifted system is singular, so there is no solved direction to draw.</figcaption></Mechanism>;
}

function ArmijoDrawing({ state }) {
  if (!state.direction) return <p className="so-error">The shifted system is singular. No direction, trial curve or accepted endpoint is defined.</p>;
  if (!(state.slope < 0)) return <p className="so-error">This direction has slope {fmt(state.slope)}. It is not a descent direction, so no Armijo trials are made.</p>;
  const upper = Math.max(...state.samples.flatMap(v => [v.actual, v.model]), state.initialValue);
  const lower = Math.min(0, ...state.samples.map(v => v.model));
  const panel = (end, detail) => {
    const series = sample(a => doubleWell(state.point.map((v, i) => v + a * state.direction[i])), 0, end);
    const model = a => state.initialValue + a * state.slope + a * a * state.direction.reduce((sum, v, i) => sum + v * v * state.diagonal[i], 0) / 2;
    const lo = detail ? Math.min(0, ...series.map(p => p[1]), model(end)) : lower;
    const hi = detail ? Math.max(state.initialValue, ...series.map(p => p[1]), model(end)) : upper;
    const span = Math.max(.01, hi - lo);
    return <Plane label={detail ? `Accepted-neighborhood detail, α ≤ ${fmt(end)}` : 'Whole proposed line, including rejected trials'} domain={[0, end]} yDomain={[lo - span * .05, hi + span * .1]} equal={false} xLabel="step multiplier α" yLabel="actual / model / threshold loss">{map => <><Line points={series} map={map} colour={ink.cyan} /><Curve fn={model} from={0} to={end} map={map} colour={ink.violet} dash="6 4" /><Curve fn={a => state.initialValue + .0001 * a * state.slope} from={0} to={end} map={map} colour={ink.amber} dash="2 4" />{state.attempts.filter(t => t.multiplier <= end).map(t => <g key={t.multiplier}><Mark point={[t.multiplier, t.value]} map={map} colour={ink.cyan} selected={t.passes} />{!t.passes && <Mark point={[t.multiplier, t.value]} map={map} colour={ink.rose} shape="cross" size={8} />}</g>)}</>}</Plane>;
  };
  return <><div className="so-columns">{panel(1, false)}{state.accepted && panel(Math.min(1, state.accepted.multiplier * 1.5), true)}</div><Key items={[["actual loss", ink.cyan, '—'], ['local Taylor model', ink.violet, '┄'], ['Armijo threshold, c=.0001', ink.amber, '⋯'], ['rejected trial', ink.rose, '×'], ['accepted trial outline', ink.neutral, '◯']]} /><DataTable label="Every attempted step in order" columns={['Attempt', 'α', 'Actual', 'Threshold', 'Result']} rows={state.attempts.map((t, i) => [i + 1, fmt(t.multiplier), fmt(t.value), fmt(t.threshold), t.passes ? 'accepted' : 'rejected'])} /></>;
}
export function S13() {
  const state = safeguardedNewtonState(.6, .01);
  return <Mechanism id="S13" label="Full nonlinear Armijo search with every actual trial"><ArmijoDrawing state={state} /></Mechanism>;
}
export function S14() {
  const [inputs, setInputs] = useState({ x: .2, damping: 1.2 });
  const [reset, setReset] = useState(0);
  const state = safeguardedNewtonState(inputs.x, inputs.damping);
  const accepted = state.accepted ? state.point.map((v, i) => v + state.accepted.multiplier * state.direction[i]) : null;
  const rawEnd = state.direction ? state.point.map((v, i) => v + state.direction[i]) : null;
  const extent = Math.max(1.6, ...(rawEnd || []).map(v => Math.abs(v) + .3));
  const apply = (x, damping) => { setInputs({ x, damping }); setReset(r => r + 1); };
  return <Mechanism id="S14" label="Live separate direction and line-length choices" state={state}><Plane label="Current parameter point, full direction and accepted endpoint" domain={[-extent, extent]}>{map => <><WellContours map={map} /><Mark point={state.point} map={map} colour={ink.amber} selected shape="square" />{rawEnd && <Arrow start={state.point} end={rawEnd} map={map} colour={ink.violet} />}{accepted && <Mark point={accepted} map={map} colour={ink.cyan} shape="triangle" selected />}</>}</Plane><Key items={[[`start ${vec(state.point)}`, ink.amber, '■'], ['full proposed direction', ink.violet, '●'], ['accepted endpoint, when available', ink.cyan, '▲']]} /><div className="so-controls"><NumericControl label="Initial x" value={inputs.x} onChange={x => setInputs(v => ({ ...v, x }))} min={-1.4} max={1.4} step={.05} resetKey={reset} /><NumericControl label="Damping λ" value={inputs.damping} onChange={damping => setInputs(v => ({ ...v, damping }))} min={0} max={3} step={.01} resetKey={reset} /></div><p>Fixed initial y=.5.</p><div className="so-buttons"><button onClick={() => apply(.2, 0)}>Inspect indefinite model</button><button onClick={() => apply(.6, .01)}>Require a shorter step</button><button onClick={() => apply(.2, .88)}>Inspect singular shift</button><button onClick={() => apply(.2, 1.2)}>Reset</button></div><Readout rows={[["Current initial loss", fmt(state.initialValue)], ['Shifted model', state.singular ? 'singular; solve unavailable' : state.positiveDefinite ? 'positive definite' : 'indefinite raw inspection; not the programme SPD policy'], ['Direction d', state.direction ? vec(state.direction) : 'unavailable'], ['Initial slope gᵀd', fmt(state.slope)], ['Accepted multiplier', state.accepted ? fmt(state.accepted.multiplier) : 'none']]} /><EigenShift values={state.diagonal} damping={inputs.damping} /><ArmijoDrawing state={state} /></Mechanism>;
}

export function S15() {
  return <Mechanism id="S15" label="A radius constraint changes the quadratic model proposal"><Plane label="Displacement disk of radius .25" domain={[-.65, .65]} xLabel="dx" yLabel="dy">{map => <><CirclePath radii={[.25, .25]} map={map} colour={ink.neutral} /><CirclePath center={[.5, 0]} radii={[Math.sqrt(.0625), Math.sqrt(.125)]} map={map} colour={ink.muted} /><CirclePath center={[.5, 0]} radii={[.5, Math.sqrt(.5)]} map={map} colour={ink.muted} /><Arrow end={[.25, 0]} map={map} colour={ink.amber} shape="square" /><Mark point={[.5, 0]} map={map} colour={ink.amber} shape="square" hollow /></>}</Plane><Key items={[["constrained displacement (.25,0)", ink.amber, '■'], ['unconstrained displacement (.5,0)', ink.amber, '□'], ['radius .25', ink.neutral, '◯']]} /><Readout rows={[["Model change at boundary", '−.1875'], ['Actual decrease in this exact quadratic', '.1875'], ['Actual / predicted decrease', '1']]} /><figcaption>The contours represent m(d)−m(0)=−dx+dx²+.5dy². This fixed example illustrates a trust-region constraint.</figcaption></Mechanism>;
}
