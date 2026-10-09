import { useId, useState } from 'react';
import { C, Figure, Plot, Facts, Table, Equation, number } from './NonconvexDrawingPrimitives.jsx';
import { Surface, Contours, UnitNetwork } from './NonconvexGeometry.jsx';
import { FactorPlane } from './NonconvexRepresentations.jsx';
import { wellValue, wellState, stationaryPresets, stationaryState, stationaryValue, saddleTrace, noiseTrace, noiseMoment, saddleSigns, factorStep, networkState, linspace, modePaths, interpolationValue, deadTrace } from '../../data/nonconvex-reading-models.js';
function Range({
  label,
  value,
  set,
  min,
  max,
  step = 1,
  disabled = false
}) {
  const id = useId();
  return <label htmlFor={id}>{label}: {number(value)}<input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => set(Number(e.target.value))} /><span>{min} to {max}; step {step}</span></label>;
}
function Choice({
  label,
  value,
  set,
  options,
  disabled = false
}) {
  const id = useId();
  return <label htmlFor={id}>{label}<select id={id} value={value} disabled={disabled} onChange={e => set(e.target.value)}>{options.map(([value, label, disabled]) => <option key={value} value={value} disabled={disabled}>{label}</option>)}</select></label>;
}
function Controls({
  children,
  reset
}) {
  return <div className="nc-controls">{children}<button type="button" onClick={reset}>Reset</button></div>;
}
function range(values, includeZero = true) {
  const all = includeZero ? [0, ...values] : values,
    a = Math.min(...all),
    b = Math.max(...all),
    pad = (b - a || 1) * .12;
  return [a - pad, b + pad];
}
// Two endpoint identities remain at their exact coordinates, with separated label lanes.
function WellEndpoints({
  plot: p,
  selected,
  reference
}) {
  const same = selected[0] === reference[0] && selected[1] === reference[1];
  const selectedBelow = !same && selected[1] < reference[1];
  const label = (point, name, colour, below) => {
    const xx = p.x(point[0]),
      yy = p.y(point[1]),
      end = yy + (below ? 1.05 : -.75) * p.f;
    return <g><line x1={xx} y1={yy + (below ? .3 : -.3) * p.f} x2={xx} y2={end + (below ? -.75 : .15) * p.f} stroke={colour} /><text x={xx} y={end} textAnchor="middle" fill={colour}>{name}</text></g>;
  };
  const x = p.x(reference[0]),
    y = p.y(reference[1]),
    r = .42 * p.f;
  return <><path d={`M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`} fill="#101010" stroke={C.c} strokeWidth="2" />{p.mark(selected, 'a')}{label(selected, 'S', C.a, selectedBelow)}{label(reference, 'R', C.c, !selectedBelow)}</>;
}
function GeometryValues({
  values,
  extent = .5,
  detail = false
}) {
  return <Plot domain={[0, 3]} range={[-extent, extent]} xLabel="actual / quadratic / remainder" yLabel={detail ? 'Current small-value detail; rescaled signed objective change' : 'Signed objective change; fixed common ruler'}>{p => <>{p.line([0, 0], [3, 0], C.neutral)}<text x={p.x(0)} y={p.y(0) + 1.1 * p.f} fill={C.neutral}>0</text>{values.map((value, i) => <g key={i}>{p.line([i + .5, 0], [i + .5, value], [C.a, C.reference, C.c][i])}{p.mark([i + .5, value], ['a', 'reference', 'c'][i])}<text x={p.x(i + .5)} y={p.y(value) + (value < 0 ? 1.1 : -.7) * p.f} textAnchor="middle" fill={[C.a, C.reference, C.c][i]}>{['actual', 'quadratic', 'remainder'][i]}</text></g>)}</>}</Plot>;
}
export function WellLab() {
  const [tilt, setTilt] = useState(.15),
    [start, setStart] = useState(.8),
    [k, setK] = useState(60),
    selected = wellState(tilt, start, .12, 60),
    reference = wellState(tilt, -.8, .12, 60),
    rows = selected.frames.slice(0, k + 1),
    other = reference.frames.slice(0, k + 1),
    current = rows[k],
    ref = other[k],
    costRange = range([...selected.frames, ...reference.frames].map(r => r.value));
  return <Figure id="N06" caption="S is the cyan circle and solid trace; R is the fixed −.8 violet open diamond and wider dashed trace. Shared coordinates keep both marker shapes and separate labels; no endpoint is displaced. Finite trace endpoints are not the hollow stationary-root references or a proof of an entire basin."><Plot domain={[-1.5, 1.5]} range={[-.3, .75]} xLabel="parameter x" yLabel="objective Wδ(x)">{p => <>{p.curve(x => wellValue(x, tilt))}{selected.critical.map(r => p.mark([r.x, r.value], 'reference'))}{p.path(other.map(r => [r.x, r.value]), C.c, {
          strokeDasharray: '5 4',
          strokeWidth: 5
        })}{p.path(rows.map(r => [r.x, r.value]), C.a)}<WellEndpoints plot={p} selected={[current.x, current.value]} reference={[ref.x, ref.value]} /></>}</Plot><Plot domain={[0, 60]} range={costRange} xLabel="completed update k" yLabel="actual cost; shared enclosing scale">{p => <>{p.path(other.map(r => [r.step, r.value]), C.c, {
          strokeDasharray: '5 4',
          strokeWidth: 5
        })}{p.path(rows.map(r => [r.step, r.value]), C.a)}<WellEndpoints plot={p} selected={[k, current.value]} reference={[k, ref.value]} /></>}</Plot><Equation>S: selected cyan circle and solid trace. R: fixed −.8 reference, violet open diamond and wider dashed trace. Shared endpoints retain both shapes at the same coordinates; separate label lanes also distinguish nearby endpoints.</Equation><Controls reset={() => {
      setTilt(.15);
      setStart(.8);
      setK(60);
    }}><Range label="Tilt δ" value={tilt} set={setTilt} min={-.2} max={.2} step={.01} /><Range label="Selected initial x" value={start} set={setStart} min={-1.4} max={1.4} step={.05} /><Range label="Completed updates" value={k} set={setK} min={0} max={60} /></Controls><p className="nc-status">Fixed η=.12. Selected x={number(current.x)}, cost={number(current.value)}, slope={number(current.gradient)}. Reference x={number(ref.x)}, cost={number(ref.value)}.</p><Table caption="Actual inspected states through the chosen horizon" headers={['k', 'selected x', 'selected cost', 'reference x', 'reference cost']} rows={rows.map((r, i) => [r.step, number(r.x), number(r.value), number(other[i].x), number(other[i].value)])} /></Figure>;
}
export function GeometryLab() {
  const [kind, setKind] = useState('saddle'),
    [direction, setDirection] = useState('x'),
    [epsilon, setEpsilon] = useState(.2),
    degrees = direction === 'x' ? 0 : direction === 'y' ? 90 : 45,
    s = stationaryState(kind, degrees, epsilon),
    fn = (x, y) => stationaryValue(kind, x, y),
    height = kind === 'flatMinimum' || kind === 'flatSaddle' ? [-.26, .26] : [-1.28, 1.28],
    levels = kind === 'flatMinimum' ? [.002, .02, .1, .2] : kind === 'flatSaddle' ? [-.1, -.02, 0, .02, .1] : [-1, -.5, 0, .5, 1],
    values = [s.actual, s.quadratic, s.actual - s.quadratic],
    magnitude = Math.max(...values.map(Math.abs)),
    roundoffScale = 64 * Number.EPSILON * Math.max(epsilon ** 2, epsilon ** 4),
    showDetail = magnitude > roundoffScale && magnitude < .02;
  return <Figure id="N15" caption="The direction has unit length, so ε is actual displacement distance. Actual higher-order changes remain separate from the Hessian prediction."><Surface fn={fn} label={stationaryPresets[kind].label} range={height} extent={kind === 'flatMinimum' || kind === 'flatSaddle' ? .6 : .8} selected={[{
      point: s.point,
      label: 'selected',
      role: 'a'
    }]} /><Contours fn={fn} extent={.8} levels={levels}>{p => <>{epsilon > 0 && p.arrow([0, 0], s.point, C.a)}{p.mark(s.point, 'a', '', true)}</>}</Contours><Equation>Equal-objective contour levels: {levels.map(v => number(v)).join(', ')} where present. Negative levels are dashed; zero is the neutral solid contour.</Equation><GeometryValues values={values} />{showDetail ? <div className="nc-value-detail"><Equation>Current small-value detail: the vertical range is rescaled to ±{number(1.25 * magnitude)}. These are the same three values on a different, explicitly labelled ruler.</Equation><GeometryValues values={values} extent={1.25 * magnitude} detail /></div> : magnitude <= roundoffScale ? <Equation>All three changes are zero at this point and direction, apart from any floating-point residue in the readout. No nonzero height is magnified. The fixed common ruler stays visible.</Equation> : null}<Controls reset={() => {
      setKind('saddle');
      setDirection('x');
      setEpsilon(.2);
    }}><Choice label="Geometry family" value={kind} set={setKind} options={Object.entries(stationaryPresets).map(([k, v]) => [k, v.label])} /><Choice label="Unit direction" value={direction} set={setDirection} options={['x', 'y', 'diagonal'].map(v => [v, v])} /><Range label="Distance ε" value={epsilon} set={setEpsilon} min={0} max={.5} step={.01} /></Controls><p className="nc-status">Actual change {number(s.actual)}; quadratic {number(s.quadratic)}; remainder {number(s.actual - s.quadratic)}. Selected point({s.point.map(v => number(v)).join(', ')}).</p><Equation>{s.classification}: {s.reason} A zero value in one direction does not classify all directions.</Equation></Figure>;
}
export function SaddleLab() {
  const [initial, setInitial] = useState('.001'),
    [k, setK] = useState(20),
    all = saddleTrace(Number(initial), 30),
    rows = all.slice(0, k + 1),
    stable = saddleTrace(0, k),
    current = rows[k];
  return <Figure id="N19" caption="The exact stable-line reference remains visible. A tiny positive or negative initial y keeps its sign while growing under the fixed recurrence."><Plot domain={[0, .65]} range={[-.25, .25]} xLabel="parameter x" yLabel="parameter y">{p => <>{p.path(stable.map(r => [r.x, r.y]), C.reference, {
          strokeDasharray: '5 4'
        })}{p.path(rows.map(r => [r.x, r.y]), C.a)}{p.mark([current.x, current.y], 'a', 'k' + k, true)}</>}</Plot><Plot domain={[.45, .65]} range={[-.0015, .0015]} xLabel="initial x; fixed local detail" yLabel="initial y; magnified">{p => <>{p.mark([.6, Number(initial)], 'a', initial === '0' ? 'start = stable' : 'start', true)}{p.mark([.6, 0], 'reference', initial === '0' ? '' : 'stable')}</>}</Plot><Plot domain={[0, 30]} range={[0, .6]} xLabel="completed updates k" yLabel="x coordinate">{p => <>{p.path(rows.map(r => [r.k, r.x]), C.x)}{p.mark([k, current.x], 'x', '', true)}</>}</Plot><Plot domain={[0, 30]} range={[-.25, .25]} xLabel="completed updates k" yLabel="y coordinate">{p => <>{p.path(rows.map(r => [r.k, r.y]), C.y)}{p.line([0, 0], [30, 0], C.reference, {
          strokeDasharray: '5 4'
        })}{p.mark([k, current.y], 'y', '', true)}</>}</Plot><Controls reset={() => {
      setInitial('.001');
      setK(20);
    }}><Choice label="Initial y" value={initial} set={setInitial} options={[['0', '0, exact stable line'], ['.001', '+.001'], ['-.001', '−.001']]} /><Range label="Completed updates" value={k} set={setK} min={0} max={30} /></Controls><p className="nc-status">Fixed x₀=.6 and η=.1. At k={k}: x={current.x.toFixed(9)}, y={current.y.toFixed(9)}. x multiplier .8; y multiplier1.2.</p></Figure>;
}
export function NoiseLab() {
  const [direction, setDirection] = useState('y'),
    [amplitude, setAmplitude] = useState(.2),
    [k, setK] = useState(8),
    rows = noiseTrace(direction, amplitude, k),
    ref = noiseTrace(direction, 0, k),
    current = rows[k],
    xr = range([...rows, ...ref].map(r => r.x)),
    yr = range([...rows, ...ref].map(r => r.y)),
    moment = noiseMoment(direction, amplitude, k);
  return <Figure id="N21" caption="One disclosed sign sequence drives the selected path. Current-horizon expectation is a different object from that path and from the fixed eight-step 256-outcome reference below."><Plot domain={xr} range={yr} xLabel="parameter x; enclosing selected path" yLabel="parameter y; enclosing selected path">{p => <>{p.path(ref.map(r => [r.x, r.y]), C.reference, {
          strokeDasharray: '5 4'
        })}{p.path(rows.map(r => [r.x, r.y]), C.a)}{p.mark([current.x, current.y], 'a', 'k' + k, true)}</>}</Plot><Plot domain={[.4, .65]} range={[-.035, .035]} xLabel="x; fixed first-update detail" yLabel="y; fixed first-update detail">{p => <>{p.path(noiseTrace(direction, amplitude, 1).map(r => [r.x, r.y]), C.a)}{p.mark([.6, 0], 'reference', 'initial')}</>}</Plot><Controls reset={() => {
      setDirection('y');
      setAmplitude(.2);
      setK(8);
    }}><Choice label="Noise direction" value={direction} set={setDirection} options={[['x', 'x only'], ['y', 'y only']]} /><Range label="Noise amplitude" value={amplitude} set={setAmplitude} min={0} max={.3} step={.01} /><Range label="Displayed horizon" value={k} set={setK} min={0} max={24} /></Controls><p className="nc-status">Fixed η=.1, initial(.6,0). At k={k}:({number(current.x)},{number(current.y)}). Current-k E[y²]={number(moment)} over independent uniform signs.</p><Equation>Consumed signs: {saddleSigns.slice(0, k).map(s => s > 0 ? '+' : '−').join(' ') || 'none at k0'}. Reset retains this exact sequence.</Equation><Table caption="Actual sample-gradient decomposition; last row has no further consumed update" headers={['k', 'sign used', 'full gradient', 'noise', 'sample gradient']} rows={rows.map((r, i) => [r.k, i === rows.length - 1 ? 'not yet used' : r.sign > 0 ? '+' : '−', r.gradient.map(v => number(v)).join(', '), i === rows.length - 1 ? 'not applied' : r.noise.map(v => number(v)).join(', '), i === rows.length - 1 ? 'not applied' : r.sample.map(v => number(v)).join(', ')])} /></Figure>;
}
export function FactorLab() {
  const [scale, setScale] = useState(1),
    [mode, setMode] = useState('normal'),
    [amount, setAmount] = useState(.1),
    state = factorStep(scale, mode, amount),
    reference = factorStep(1, mode, amount),
    curve = linspace(0, amount).map(t => factorStep(scale, mode, t).end),
    detailRadius = Math.max(.3, ...state.end.map((v, i) => 1.15 * Math.abs(v - state.base[i])));
  return <Figure id="N29" caption="Straight modes use unit directions and Euclidean distance ε. Curved symmetry uses path parameter t; equal scalar settings do not imply equal travelled or straight-line distance."><FactorPlane domain={[0, 5.1]} range={[0, 2.6]}>{p => <>{p.path(linspace(0, amount).map(t => factorStep(1, mode, t).end), C.neutral, {
          strokeDasharray: '5 4'
        })}{p.mark(reference.base, 'reference')}{p.mark(reference.end, 'reference')}{p.path(curve, C.a, mode === 'tangent' ? {
          strokeDasharray: '5 4'
        } : {})}{p.mark(state.base, 'c')}{p.mark(state.end, 'a', '', true)}</>}</FactorPlane><Plot domain={[state.base[0] - detailRadius, state.base[0] + detailRadius]} range={[state.base[1] - detailRadius, state.base[1] + detailRadius]} equal xLabel="factor a; local endpoint detail" yLabel="factor b; local endpoint detail">{p => <>{p.curve(a => 1 / a, C.neutral, Math.max(.01, state.base[0] - detailRadius), state.base[0] + detailRadius)}{p.path(curve, C.a)}{p.arrow(state.base, state.end, C.a)}{p.mark(state.base, 'c', 'B')}{p.mark(state.end, 'a', amount === 0 ? '' : 'E', true)}</>}</Plot><Equation>B is the base; E is the selected endpoint; The hollow overview marks show the scale 1 reference. The labelled local panel encloses the entire displacement against the exact hyperbola; its axis limits adapt to the selected endpoint.</Equation><Controls reset={() => {
      setScale(1);
      setMode('normal');
      setAmount(.1);
    }}><Range label="Factor scale s" value={scale} set={setScale} min={.5} max={4} step={.05} /><Choice label="Displacement mode" value={mode} set={setMode} options={[['normal', 'straight normal'], ['tangent', 'straight tangent'], ['curved', 'curved symmetry']]} /><Range label={mode === 'curved' ? 'Path parameter t' : 'Euclidean distance ε'} value={amount} set={setAmount} min={0} max={.2} step={.01} /></Controls><p className="nc-status">Base({state.base.map(v => number(v)).join(',')}), endpoint({state.end.map(v => number(v)).join(',')}); actual Euclidean distance {number(state.distance)}. Product/prediction slope {number(state.product)}, loss {number(state.loss)}.</p><Facts rows={[["positive curvature at base", number(state.positiveEigenvalue)], ['straight-step Hessian prediction', mode === 'curved' ? 'not a straight-distance control' : number(state.quadratic)], ['same mode/scalar at scale 1', 'distance ' + number(reference.distance) + ', loss ' + number(reference.loss)]]} /><Equation>{mode === 'curved' ? 'The exact curve has product1 and mathematical loss 0; a tiny computed product discrepancy is roundoff.' : 'Both directions have unit length. A straight tangent endpoint generally leaves the curved level set.'}</Equation></Figure>;
}
export function NetworkLab() {
  const [input, setInput] = useState(1.5),
    [transform, setTransform] = useState('original'),
    [scale, setScale] = useState(2),
    state = networkState(input, transform, scale),
    ref = networkState(input),
    usesScale = transform === 'scaled' || transform === 'missing-bias';
  return <Figure id="N33" caption="Unit colour/shape travels with its complete incoming,bias,outgoing bundle when positions swap. A zero preactivation is labelled kink, separately from active or inactive."><UnitNetwork state={state} name="Selected complete network" /><p className="nc-status">Original reference output {number(ref.output)}; selected output {number(state.output)}; difference {number(state.output - ref.output)}.</p><Controls reset={() => {
      setInput(1.5);
      setTransform('original');
      setScale(2);
    }}><Range label="Model input u" value={input} set={setInput} min={-1} max={3} step={.05} /><Choice label="Transformation" value={transform} set={setTransform} options={[['original', 'original'], ['permuted', 'permuted whole units'], ['scaled', 'positive scaling'], ['missing-bias', 'bias left unchanged']]} /><Range label="Positive scale c" value={scale} set={setScale} min={.5} max={4} step={.05} disabled={!usesScale} /></Controls><Equation>{usesScale ? `Unit1 scale c=${number(scale)}; unit 2 scale 1/c=${number(1 / scale)}. ${scale === 1 ? 'At c1 the correct and missing-bias transformations coincide because nothing is scaled.' : ''}` : 'Scale is disabled because original/permuted order does not use it; its selected value is retained.'}</Equation></Figure>;
}
export function PathLab() {
  const [family, setFamily] = useState('positive'),
    [mode, setMode] = useState('straight'),
    [t, setT] = useState(.5),
    state = modePaths(t),
    selected = family === 'opposite' ? state.opposite : state[mode],
    loss = family === 'opposite' ? state.oppositeLoss : state[mode + 'Loss'],
    rows = linspace(0, 1);
  function changeFamily(next) {
    setFamily(next);
    if (next === 'opposite') setMode('straight');
  }
  const lossPlot = maximum => <Plot domain={[0, 1]} range={[0, maximum]} xLabel="path parameter t" yLabel={maximum < .01 ? 'positive branch; enlarged loss' : 'loss; shared overview'}>{p => <>{p.curve(u => family === 'positive' ? modePaths(u).straightLoss : modePaths(u).oppositeLoss, C.invalid, 0, 1, {
        strokeDasharray: '6 4'
      })}{family === 'positive' && p.curve(u => modePaths(u).curvedLoss, C.a)}{p.mark([t, loss], mode === 'curved' ? 'a' : 'invalid', 'selected', true)}</>}</Plot>;
  return <Figure id="N41" caption="Selected parameter and objective points share t. Opposite endpoints force the curved option to become unavailable; the path through a0 has unavoidable loss .5."><FactorPlane domain={[-1.2, 2.2]} range={[-1.2, 1.3]}>{p => <>{p.path(rows.map(u => family === 'positive' ? modePaths(u).straight : modePaths(u).opposite), C.invalid, {
          strokeDasharray: '6 4'
        })}{family === 'positive' && p.path(rows.map(u => modePaths(u).curved), C.a)}{p.mark(selected, mode === 'curved' ? 'a' : 'invalid', 'selected', true)}</>}</FactorPlane>{lossPlot(.55)}{family === 'positive' && lossPlot(.009)}<Controls reset={() => {
      setFamily('positive');
      setMode('straight');
      setT(.5);
    }}><Choice label="Endpoint family" value={family} set={changeFamily} options={[['positive', 'same positive branch'], ['opposite', 'opposite branches']]} /><Choice label="Selected path" value={mode} set={setMode} options={[['straight', 'straight'], ['curved', 'curved symmetry', family === 'opposite']]} /><Range label="Path parameter t" value={t} set={setT} min={0} max={1} step={.01} /></Controls><p className="nc-status">Selected point({selected.map(v => number(v)).join(',')}), actual loss {number(loss)}.</p>{family === 'opposite' && <Equation>The curved reciprocal construction would divide by zero when a changes sign. It cannot connect these endpoints continuously; the path was set to straight.</Equation>}</Figure>;
}
export function GeneralizationLab() {
  const [a, setA] = useState(1),
    [target, setTarget] = useState('0'),
    targetA = Number(target),
    prediction = -a,
    wanted = -targetA,
    residual = prediction - wanted,
    loss = .5 * residual * residual;
  return <Figure id="N47" caption="Both labelled target rules pass through the training dots. Changing the target changes the declared evaluation question, not the information supplied by those two observations."><Plot domain={[-1.3, 1.3]} range={[-3, 3]} xLabel="model input x" yLabel="prediction / declared target">{p => <>{p.curve(x => x, C.a)}{p.curve(x => interpolationValue(1, x), C.b, -1.3, 1.3, {
          strokeDasharray: '7 3 2 3'
        })}{p.curve(x => interpolationValue(a, x), C.reference, -1.3, 1.3, {
          strokeDasharray: '2 4',
          strokeWidth: 3
        })}{p.line([0, wanted], [0, prediction], C.reference, {
          strokeWidth: 3
        })}{p.mark([0, prediction], 'reference', residual === 0 ? 'P = T' : 'P', true)}{p.mark([0, wanted], target === '0' ? 'a' : 'b', residual === 0 ? '' : 'T')}{p.mark([-1, -1], 'neutral')}{p.mark([1, 1], 'neutral')}</>}</Plot><Controls reset={() => {
      setA(1);
      setTarget('0');
    }}><Range label="Predictor coefficient a" value={a} set={setA} min={-2} max={2} step={.05} /><Choice label="Declared target rule" value={target} set={setTarget} options={[['0', 'f0(x)=x'], ['1', 'f1(x)=x+(x²−1)']]} /></Controls><p className="nc-status">Training loss 0. At x0: prediction {number(prediction)}, declared target {number(wanted)}, residual {number(residual)}, half-squared error {number(loss)}.</p><Equation>Cyan solid:f0. Amber dot-dash:f1. Neutral dotted:selected hₐ. {a === 0 || a === 1 ? `The selected curve coincides with f${a}; the shared line has both identities.` : ''}</Equation><Plot domain={[0, 4.5]} range={[0, 1]} xLabel="one-point half-squared loss" yLabel="actual evaluation">{p => <>{p.line([0, .5], [loss, .5], C.reference, {
          strokeWidth: 5
        })}{p.mark([loss, .5], 'reference', number(loss))}</>}</Plot></Figure>;
}
export function InactiveLab() {
  const [initial, setInitial] = useState('inactive'),
    [k, setK] = useState(10),
    [rate, setRate] = useState(.1),
    active = deadTrace(true, rate, k),
    inactive = deadTrace(false, rate, k),
    rows = initial === 'active' ? active : inactive,
    current = rows[k];
  return <Figure id="N50" caption="The inactive path stays fixed for every offered rate. The active preactivation approaches1 monotonically because1−2η is between.6 and.9; both parameter updates remain linked."><Plot domain={[-.1, .4]} range={[-1.1, .9]} xLabel="parameter w" yLabel="parameter b">{p => <>{p.path(active.map(r => [r.w, r.b]), C.a)}{p.path(inactive.map(r => [r.w, r.b]), C.c, {
          strokeDasharray: '5 4'
        })}{p.mark([active[k].w, active[k].b], 'a', 'active', initial === 'active')}{p.mark([inactive[k].w, inactive[k].b], 'c', 'inactive', initial === 'inactive')}</>}</Plot><Plot domain={[0, 20]} range={[-1.1, 1.1]} xLabel="completed update k" yLabel="preactivation z=w+b">{p => <>{p.path(active.map(r => [r.k, r.z]), C.a)}{p.path(inactive.map(r => [r.k, r.z]), C.c, {
          strokeDasharray: '5 4'
        })}{p.line([0, 1], [20, 1], C.reference, {
          strokeDasharray: '3 3'
        })}</>}</Plot><Controls reset={() => {
      setInitial('inactive');
      setK(10);
      setRate(.1);
    }}><Choice label="Selected initialization" value={initial} set={setInitial} options={[['inactive', 'inactive(0,−1)'], ['active', 'active(0,.5)']]} /><Range label="Completed updates" value={k} set={setK} min={0} max={20} /><Range label="Learning rate η" value={rate} set={setRate} min={.05} max={.2} step={.01} /></Controls><p className="nc-status">k={k},(w,b)=({number(current.w)},{number(current.b)}), z={number(current.z)}, prediction={number(current.prediction)}, loss={number(current.loss)}, gradient norm={number(current.norm)}. Last applied displacement({k === 0 ? 'none at initial state' : rows[k - 1].displacement.map(v => number(v)).join(',')}). Proposed next displacement({current.displacement.map(v => number(v)).join(',')}).</p><Table caption="Selected initialization’s actual history; initial state k0 is not an update" headers={['k', 'w', 'b', 'z', 'prediction', 'loss', 'gradient', 'next proposed Δ']} rows={rows.map(r => [r.k, number(r.w), number(r.b), number(r.z), number(r.prediction), number(r.loss), r.gradient.map(v => number(v)).join(','), r.displacement.map(v => number(v)).join(',')])} /><Equation>The derivative convention at an exact kink is0. At negative preactivation the classical local derivative is0; these statements have different mathematical premises.</Equation></Figure>;
}
