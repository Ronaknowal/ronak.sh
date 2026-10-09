import React, { useEffect, useRef, useState, useId } from 'react';
import { FlowLab, FlowControls, FlowReadout, FlowChoice } from '../LessonFlow.jsx';
import { Drawing, Plot, Line, Table, Bars, Matrix, Digit, number, adaptiveNumber, hues } from './ManifoldDrawing.jsx';
import { GaussianBranches } from './ManifoldOperationObjects.jsx';
import { ids, uPoints, radiusGraph, shortestPath, gaussianRow, studentState, initialY, tsneStep, pairCost, auditQuery, fixedP } from './manifold-models.mjs';
import { digitRows, savedLayouts, layoutNames, sourceRow, sourceIdScores } from './manifold-data.js';
export function ExactControl({
  name,
  value,
  setValue,
  min,
  max,
  step = 'any'
}) {
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState('');
  const host = useRef(null);
  useEffect(() => {
    setDraft(String(value));
    setError('');
  }, [value]);
  useEffect(() => {
    const lab = host.current?.closest('.flow-lab');
    const reset = () => {
      setDraft(String(value));
      setError('');
    };
    lab?.addEventListener('manifold-reset', reset);
    return () => lab?.removeEventListener('manifold-reset', reset);
  }, [value]);
  const edit = text => {
    setDraft(text);
    const parsed = Number(text);
    if (!text.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max) {
      setError(`Enter a finite ${name} from ${min} to ${max}. The last valid state remains visible.`);
    } else {
      setError('');
      setValue(parsed);
    }
  };
  return <div ref={host} className="manifold-exact"><label><span>{name}: <output>{String(value)}</output></span><input aria-label={`${name} range`} type="range" value={value} min={min} max={max} step={step} onChange={event => {
        setDraft(event.target.value);
        setError('');
        setValue(Number(event.target.value));
      }} /></label><label><span>Exact {name} [{min}, {max}]</span><input aria-label={`Exact ${name}`} type="text" inputMode="decimal" value={draft} onChange={event => edit(event.target.value)} /></label>{error && <p role="alert">{error}</p>}</div>;
}
const Reset = ({
  onClick
}) => <button type="button" onClick={event => {
  onClick();
  event.currentTarget.closest('.flow-lab')?.dispatchEvent(new Event('manifold-reset'));
}}>Reset</button>;
export function GraphView({
  points = uPoints,
  radius = 1,
  start = 0,
  end = 6,
  traceCount = 0,
  showRouteAnnotations = false
}) {
  const built = radiusGraph(points, radius),
    route = shortestPath(built.graph, start, end);
  const initial = {
    distance: points.map((_, i) => i === start ? 0 : Infinity),
    previous: points.map(() => null),
    settled: []
  };
  const trace = traceCount && route.trace.length ? route.trace[Math.min(traceCount, route.trace.length) - 1] : initial;
  const traceTitle = trace === initial ? 'Before relaxation: only start has finite distance' : `After settling ${ids[trace.vertex]}`;
  const graphPoints = points.map(([x, y], i) => ({
    x,
    y,
    id: ids[i],
    selected: i === start || i === end,
    ...(i === 1 ? {dx:-25,dy:5} : {})
  }));
  const predecessors = trace.previous.flatMap((a, b) => {
    if (a === null) return [];
    const [x, y] = points[a],
      [u, v] = points[b],
      length = Math.hypot(u - x, v - y);
    if (length === 0) return []; // The table retains a zero-length edge; no direction exists.
    return [[x + .1 * (u - x) / length, y + .1 * (v - y) / length, u - .14 * (u - x) / length, v - .14 * (v - y) / length, hues[1]]];
  });
  return <>
    <Drawing caption={`Radius ${number(radius)}. Admitted edges are measured; the amber path is ${route.path.length ? route.path.map(i => ids[i]).join(' → ') : 'absent'}.`}>
      <Plot points={graphPoints} edges={built.edges} path={route.path} ticks={[0, 1, 2]} caption="U coordinates with unit ticks" domain={[-1, 3, -1, 3]}>
        {({
          x,
          y
        }) => showRouteAnnotations && <>
          <line x1={x(0)} y1={y(0)} x2={x(2)} y2={y(0)} stroke={hues[2]} strokeDasharray="5 4" />
          <text x={x(1)} y={y(0) + 48} textAnchor="middle" fill={hues[2]}>AG chord 2 · excluded at ε1</text>
          {points.map(([u, v], i) => <text key={i} x={x(u) + (u === 0 ? -12 : 12)} y={y(v) + 17} textAnchor={u === 0 ? 'end' : 'start'} fill={hues[0]}>d={number(route.distance[i])}</text>)}
        </>}
      </Plot>
    </Drawing>
    <FlowReadout>From {ids[start]} to {ids[end]}: <strong>{number(route.length)}</strong>; components {route.components.map(c => `{${c.map(i => ids[i]).join(', ')}}`).join(' ')}.</FlowReadout>
    <Table caption="All admitted edges and lengths" headers={['edge', 'length']} rows={built.edges.map(([a, b, d]) => [`${ids[a]}–${ids[b]}`, number(d)])} />
    {(showRouteAnnotations || traceCount > 0) && <Drawing caption={`${traceTitle}. Blue arrows point from the current predecessor to its reached vertex; infinity is unreached.`}>
      <Plot points={graphPoints} edges={built.edges} arrows={predecessors} ticks={[0, 1, 2]} domain={[-1, 3, -1, 3]} caption={traceTitle}>
        {({
          x,
          y
        }) => points.map(([u, v], i) => <text key={i} x={x(u) + (u === 0 ? -12 : 12)} y={y(v) + 17} textAnchor={u === 0 ? 'end' : 'start'}>{number(trace.distance[i])}</text>)}
      </Plot>
    </Drawing>}
    <Table caption={`${traceTitle}: cumulative distances and predecessors`} headers={['vertex', 'tentative distance', 'predecessor', 'settled']} rows={ids.map((id, i) => [id, number(trace.distance[i]), trace.previous[i] === null ? '—' : ids[trace.previous[i]], trace.settled.includes(i) ? 'yes' : 'no'])} />
  </>;
}
export function RadiusLab() {
  const [radius, setRadius] = useState(1),
    [trace, setTrace] = useState(0);
  const change = value => {
    setRadius(value);
    setTrace(0);
  };
  return <FlowLab id="L1" label="Change radius and trace a route"><GraphView radius={radius} traceCount={trace} /><FlowControls><ExactControl name="Radius ε" value={radius} setValue={change} min={0} max={2.5} /><button onClick={() => setTrace(n => Math.min(7, n + 1))}>Step relaxation</button><Reset onClick={() => {
        change(1);
      }} /></FlowControls><p>Changing the radius restarts the trace. At ε .75 there is no route; at 2 the direct AG shortcut appears.</p></FlowLab>;
}
export function BridgeLab() {
  const [position, setPosition] = useState([1, 2]);
  const points = uPoints.map((p, i) => i === 3 ? position : p);
  return <FlowLab id="L2" label="Move only vertex D"><GraphView points={points} /><FlowControls>{['x', 'y'].map((axis, i) => <ExactControl key={axis} name={`D ${axis}`} value={position[i]} setValue={value => setPosition(p => p.map((v, j) => j === i ? value : v))} min={-1} max={3} />)}<Reset onClick={() => setPosition([1, 2])} /></FlowControls><FlowReadout>D is ({number(position[0])}, {number(position[1])}); the radius stays 1 and all other vertices stay fixed. Disconnection keeps ∞ visible.</FlowReadout></FlowLab>;
}
export function EndpointLab() {
  const [start, setStart] = useState(0),
    [end, setEnd] = useState(6),
    [trace, setTrace] = useState(0);
  return <FlowLab id="L3" label="Choose path endpoints"><GraphView start={start} end={end} traceCount={trace} /><FlowControls>{[['Start', start, setStart], ['End', end, setEnd]].map(([name, value, setter]) => <label key={name}>{name}<select aria-label={name} value={value} onChange={event => {
          setter(Number(event.target.value));
          setTrace(0);
        }}>{ids.map((id, i) => <option value={i} key={id}>{id}</option>)}</select></label>)}<button onClick={() => setTrace(n => Math.min(7, n + 1))}>Step relaxation</button><Reset onClick={() => {
        setStart(0);
        setEnd(6);
        setTrace(0);
      }} /></FlowControls></FlowLab>;
}
export function GaussianView({
  distances,
  sigma
}) {
  const row = gaussianRow(distances, sigma);
  return <><Drawing caption="A chooses one of three distinct records; each coloured branch connects its raw, shifted and normalized weight."><Line values={[0, ...distances]} labels={['A', 'B', 'C', 'D']} colors={hues.slice(0, 4)} caption="Input distance ruler" /><GaussianBranches row={row} distances={distances} /><Bars values={row.probabilities} labels={['B', 'C', 'D']} colors={hues.slice(1, 4)} format={value => adaptiveNumber(value, 9)} caption="Normalized conditional row" /></Drawing>
    <p>Stable normalization subtracts the largest log weight ({adaptiveNumber(row.logShift)}) before exponentiation. Mathematically, every raw weight equals exp({adaptiveNumber(row.logShift)}) times its shifted weight. That same common factor cancels from numerator and denominator. We compute the shifted exponential directly from the distance difference; we never divide two underflowed raw zeros.</p>
    <div className="manifold-interval" aria-label="Complete probability interval from zero to one; coloured key follows">{row.probabilities.map((p, i) => <span key={ids[i + 1]} style={{
        width: `${p * 100}%`,
        background: hues[i + 1]
      }} />)}</div>
    <ul className="manifold-key">{row.probabilities.map((p, i) => <li key={ids[i + 1]} style={{ color: hues[i + 1] }}>{ids[i + 1]}: {adaptiveNumber(p, 9)} · interval [{adaptiveNumber(row.probabilities.slice(0, i).reduce((a, b) => a + b, 0), 9)}, {adaptiveNumber(row.probabilities.slice(0, i + 1).reduce((a, b) => a + b, 0), 9)}]</li>)}</ul>
    <p>The complete interval runs from 0 to 1; the key names even a branch too narrow to print inside it. Tiny nonzero values use scientific notation. A displayed numerical underflow is distinct from the exact excluded self probability 0; finite positive-width candidate exponentials are mathematically positive. Floating-point interval endpoints can coincide when a probability is too small to change their accumulated sum.</p>
    <Table caption="Every row operation; underflow is numerical, not exclusion" headers={['candidate', 'distance', 'log raw', 'raw exponential', 'shifted exponential', 'probability', '−p log₂ p']} rows={distances.map((d, i) => [ids[i + 1], number(d), adaptiveNumber(row.logWeights[i]), row.raw[i] === 0 ? '0 (underflow)' : adaptiveNumber(row.raw[i], 9), row.shifted[i] === 0 ? '0 (underflow)' : adaptiveNumber(row.shifted[i], 9), row.probabilities[i] === 0 ? '0 (underflow)' : adaptiveNumber(row.probabilities[i], 9), adaptiveNumber(row.contributions[i], 9)])} />
    <FlowReadout>Raw sum {row.rawSum === 0 ? '0 (underflow)' : adaptiveNumber(row.rawSum, 9)}; shifted sum {adaptiveNumber(row.shiftedSum, 9)}; log raw normalizer {adaptiveNumber(row.logShift + Math.log(row.shiftedSum), 9)}. Entropy <strong>{adaptiveNumber(row.entropy, 9)}</strong> bits; effective count <strong>{number(row.perplexity)}</strong>. Self probability is exactly 0 by exclusion.</FlowReadout></>;
}
export function WidthLab() {
  const [sigma, setSigma] = useState(1);
  return <FlowLab id="L4" label="Change Gaussian width"><GaussianView distances={[1, 2, 3]} sigma={sigma} /><FlowControls><ExactControl name="Width σ" value={sigma} setValue={setSigma} min={.1} max={3} /><Reset onClick={() => setSigma(1)} /></FlowControls></FlowLab>;
}
export function DistanceRowLab() {
  const [distances, setDistances] = useState([1, 2, 3]),
    [selected, setSelected] = useState(0),
    [sigma, setSigma] = useState(1);
  return <FlowLab id="L5" label="Edit one candidate distance"><GaussianView distances={distances} sigma={sigma} /><FlowControls><FlowChoice label="Candidate" value={selected} options={[[0, 'B'], [1, 'C'], [2, 'D']]} onChange={setSelected} /><ExactControl key={selected} name="Candidate distance" value={distances[selected]} setValue={value => setDistances(d => d.map((v, i) => i === selected ? value : v))} min={0} max={6} /><ExactControl name="Width σ" value={sigma} setValue={setSigma} min={.1} max={3} /><Reset onClick={() => {
        setDistances([1, 2, 3]);
        setSelected(0);
        setSigma(1);
      }} /></FlowControls><p>This edits a local distance row, not a globally consistent set of input coordinates. Zero distances and nearest ties keep their separate record IDs.</p></FlowLab>;
}
export function NormalizationView({
  coordinate = 3
}) {
  const state = studentState([0, 1, coordinate]);
  return <><Drawing caption="Both orientations of every off-diagonal pair contribute to Z."><Line values={[0, 1, coordinate]} labels={['A', 'B', 'C']} caption="Map ruler" /></Drawing><Matrix values={state.kernel} labels={['A', 'B', 'C']} caption="All Student kernels, self zero" /><Matrix values={state.q} labels={['A', 'B', 'C']} caption="Ordered joint Q" /><FlowReadout>The AB numerator stays .5; ordered total Z is <strong>{number(state.z)}</strong>, so Q_AB is <strong>{number(state.q[0][1])}</strong>.</FlowReadout></>;
}
export function NormalizationLab() {
  const [coordinate, setCoordinate] = useState(3);
  return <FlowLab id="L6" label="Move C in a normalized map"><NormalizationView coordinate={coordinate} /><FlowControls><ExactControl name="C coordinate" value={coordinate} setValue={setCoordinate} min={-2} max={5} /><Reset onClick={() => setCoordinate(3)} /></FlowControls></FlowLab>;
}
export function ForceView({
  y = initialY,
  selected = 0,
  before,
  bound = 4
}) {
  const state = studentState(y);
  return <><Drawing caption="Old points are hollow; current points are filled. Both states share the entire displayed ruler."><Line values={y} labels={ids.slice(0, 4)} compared={before} bound={Math.max(bound, ...(before || []).map(Math.abs))} caption={`Current coordinates; shared domain ±${bound}`} /></Drawing><Table caption={`Negative-gradient contributions at ${ids[selected]}`} headers={['other', 'P', 'Q', 'kernel', 'Δ', '−4(P−Q)tΔ']} rows={y.flatMap((v, j) => j === selected ? [] : [[ids[j], number(fixedP[selected][j]), number(state.q[selected][j]), number(state.kernel[selected][j]), number(y[selected] - v), number(state.contributions[selected][j], 9)]])} /><Matrix values={state.q} labels={ids.slice(0, 4)} caption="Complete current Q, ordered normalization" /><FlowReadout>Selected {ids[selected]} has current coordinate <strong>{String(y[selected])}</strong>. Current KL is <strong>{number(state.cost, 9)}</strong>; negative-gradient vector [{state.displacement.map(v => number(v, 9)).join(', ')}].</FlowReadout></>;
}
export function ForceStepLab() {
  const [state, setState] = useState({
      y: [...initialY],
      bound: 4,
      before: undefined,
      shift: 0
    }),
    [selected, setSelected] = useState(0),
    [rate, setRate] = useState(.5),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  const reset = () => {
    setState({
      y: [...initialY],
      bound: 4,
      before: undefined,
      shift: 0
    });
    setSelected(0);
    setRate(.5);
    setError('');
    setRevision(n => n + 1);
  };
  const step = () => {
    try {
      if (rate === 0) {
        setError('');
        return;
      }
      setState(tsneStep(state.y, rate, state.bound));
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  };
  return <FlowLab id="L7" label="Take a simultaneous t-SNE step"><ForceView {...state} selected={selected} /><FlowControls><FlowChoice label="Selected point" value={selected} options={ids.slice(0, 4).map((id, i) => [i, id])} onChange={setSelected} /><ExactControl key={`coordinate-${selected}-${revision}`} name="Current x" value={state.y[selected]} min={-state.bound} max={state.bound} setValue={value => {
        setState(s => ({
          ...s,
          y: s.y.map((v, i) => i === selected ? value : v)
        }));
        setError('');
      }} /><ExactControl key={`rate-${revision}`} name="Learning rate" value={rate} min={0} max={100} setValue={setRate} /><button onClick={step}>Step</button><Reset onClick={reset} /></FlowControls><FlowReadout>Shared editor bounds [−{state.bound}, {state.bound}]. Positive steps subtract centroid {number(state.shift, 12)}; rate 0 changes neither coordinates nor centroid. Bounds expand after a finite step and stay fixed through selection and edits.</FlowReadout>{state.before && <Table caption="Full simultaneous before/after state" headers={['ID', 'before', 'current']} rows={state.y.map((v, i) => [ids[i], String(state.before[i]), String(v)])} />}{error && <p role="alert">{error}</p>}</FlowLab>;
}
export function UnionView({
  first = .5,
  second = .25
}) {
  const union = first + second - first * second;
  return <><Drawing caption="Two rows own opposite directed strengths; union is a membership, not a normalized class probability."><Plot points={[{
        x: 0,
        y: 0,
        id: 'i'
      }, {
        x: 2,
        y: 0,
        id: 'j'
      }]} arrows={[[0, .2, 2, .2, hues[0]], [2, -.2, 0, -.2, hues[1]]]} caption="Same physical pair, distance 2" /><Bars values={[first, second, first * second, union, (first + second) / 2]} labels={['v(i→j)', 'v(j→i)', 'overlap', 'union', 'mean']} caption="Common membership ruler" /></Drawing><FlowReadout>Union {number(first)} + {number(second)} − {number(first * second)} = <strong>{number(union)}</strong>; arithmetic mean <strong>{number((first + second) / 2)}</strong>.</FlowReadout></>;
}
export function UnionLab() {
  const [first, setFirst] = useState(.5),
    [second, setSecond] = useState(.25);
  return <FlowLab id="L8" label="Combine reciprocal memberships"><UnionView first={first} second={second} /><FlowControls><ExactControl name="v i→j" value={first} setValue={setFirst} min={0} max={1} /><ExactControl name="v j→i" value={second} setValue={setSecond} min={0} max={1} /><Reset onClick={() => {
        setFirst(.5);
        setSecond(.25);
      }} /></FlowControls></FlowLab>;
}
export function PairView({
  radius = 1
}) {
  const state = pairCost(radius);
  return <><Drawing caption="Fixed graph strength .625 and teaching a=b=1; these are all-pair ideal terms in nats."><Line values={[0, radius]} labels={['i', 'j']} caption="Map pair separation" /><Bars values={[state.attraction, state.repulsion, state.total]} labels={['−w log ν', '−(1−w) log(1−ν)', 'total']} max={Math.max(2, state.total)} suffix=" nats" caption="Complete pair cost" /></Drawing><FlowReadout>ν = {number(state.membership)}; total <strong>{number(state.total, 9)}</strong>. Isolated optimum r = {number(state.optimum)}. The static r=0 limit is infinite for this intermediate strength.</FlowReadout></>;
}
export function PairLab() {
  const [radius, setRadius] = useState(1);
  return <FlowLab id="L9" label="Inspect ideal pair cross entropy"><PairView radius={radius} /><FlowControls><ExactControl name="Pair radius" value={radius} setValue={setRadius} min={.05} max={4} /><Reset onClick={() => setRadius(1)} /></FlowControls></FlowLab>;
}
export function SavedMapView({
  sourceId = 30,
  k = 10,
  layout = 'tsne-p30-s7',
  overlay = false
}) {
  const viewId = 'neighbors-' + useId().replaceAll(':','');
  const coordinates = savedLayouts[layout].coordinates,
    audit = auditQuery(digitRows, coordinates, sourceId, k),
    historical = savedLayouts[layout].metrics[String(k)];
  const common = new Set(audit.common), missing = new Set(audit.missing), introduced = new Set(audit.introduced),
    selected = audit.query;
  const edges = [...audit.input.map(row => [selected, row.i, 0, common.has(row.id) ? 'common' : 'missing']), ...audit.mapped.filter(row => !common.has(row.id)).map(row => [selected, row.i, 0, 'new'])];
  const membership = id => common.has(id) ? 'common' : missing.has(id) ? 'missing' : introduced.has(id) ? 'new' : undefined;
  const badge = id => common.has(id) ? 'C · common' : missing.has(id) ? 'M · input-only, missing in map' : 'N · map-only, new';
  return <><Drawing caption={`${layout}: actual saved full-precision coordinates, 300 distinct source IDs. Amber focus stays above the relation layer. C/common: neutral circle and solid link; M/input-only: pink dashed ring/link; N/map-only: blue diamond and solid link. Class fills never replace membership outlines.`}><Plot points={coordinates.map(([x, y], i) => ({
        x,
        y,
        id: digitRows[i][0],
        selected: i === selected,
        label: i === selected,
        color: i === selected ? hues[0] : overlay ? hues[digitRows[i][1]] : '#7d828a',
        relation: membership(digitRows[i][0])
      }))} edges={edges} foregroundRelations relationPrefix={viewId} caption={`${layout} coordinates; axes have no physical pixel units`} /></Drawing><div className="manifold-digits"><Digit row={sourceRow(sourceId)} title={`Selected ID ${sourceId}`} /></div>{[['Input neighbors in exact rank order', audit.input, 'input'], ['Map neighbors in exact rank order', audit.mapped, 'map']].map(([title, rows, role]) => <div key={title}><p>{title}. Each printed membership badge uses the same sets as the foreground rings. Select an image to find its map mark; select a ring to return to its ranked image.</p><div className="manifold-digits">{rows.map((row, i) => <a key={row.id} id={`${viewId}-${role}-${row.id}`} href={`#${viewId}-point-${row.id}`} aria-label={`Rank ${i+1}, source ${row.id}, ${badge(row.id)}; find map mark`}><Digit row={sourceRow(row.id)} title={`${i + 1}: ID ${row.id}`} /><strong className={`manifold-membership manifold-membership--${membership(row.id)}`}>{badge(row.id)}</strong></a>)}</div></div>)}<FlowReadout>Current source {sourceId}, k {k}: <strong>{audit.common.length}/{k} = {number(audit.retention)}</strong>. Common IDs [{audit.common.join(', ')}]; missing [{audit.missing.join(', ')}]; introduced [{audit.introduced.join(', ')}].</FlowReadout><Table caption="Historical collection scores, retained rank convention" headers={['map', 'k', 'R', 'T', 'C']} rows={[[layout, k, number(historical.retention), number(historical.trustworthiness), number(historical.continuity)]]} /><p>The local lists use stable source-ID ties. Historical T/C retain their library sorting and numerical convention. No fit runs on a change.</p>{k === 10 && sourceIdScores[layout] ? <Table caption="Recorded source-ID tie convention: already-executed collection audit, separate from historical metrics" headers={['map', 'k', 'R', 'T', 'C']} rows={[[layout, 10, String(sourceIdScores[layout].retention), String(sourceIdScores[layout].trustworthiness), String(sourceIdScores[layout].continuity)]]} /> : <p>Recorded source-ID collection metrics are available only at k10 for PCA, t-SNE p30 seed7 with PCA initialization, and UMAP n15,d.1,s7. This selection has no recorded collection audit under that convention; its current local neighbor lists and R remain available.</p>}{overlay && <p>Class hues are a viewing overlay; labels were not unsupervised fitting inputs. Printed IDs remain authoritative.</p>}</>;
}
export function SavedMapLab() {
  const [sourceId, setSourceId] = useState(30),
    [draft, setDraft] = useState('30'),
    [k, setK] = useState(10),
    [layout, setLayout] = useState('tsne-p30-s7'),
    [error, setError] = useState(''),
    [overlay, setOverlay] = useState(false);
  const edit = text => {
    setDraft(text);
    const value = Number(text);
    if (!text.trim() || !Number.isInteger(value) || !sourceRow(value)) setError('Enter an existing integer source ID. The last valid query remains visible.');else {
      setSourceId(value);
      setError('');
    }
  };
  return <FlowLab id="L10" label="Audit actual saved maps"><SavedMapView sourceId={sourceId} k={k} layout={layout} overlay={overlay} /><FlowControls><label>Existing source ID<input aria-label="Source ID" value={draft} inputMode="numeric" onChange={event => edit(event.target.value)} /></label><FlowChoice label="Audit k" value={k} options={[5, 10, 20].map(v => [v, v])} onChange={setK} /><label>Saved map<select aria-label="Saved map" value={layout} onChange={event => setLayout(event.target.value)}>{layoutNames.map(name => <option key={name}>{name}</option>)}</select></label><label><input type="checkbox" checked={overlay} onChange={event => setOverlay(event.target.checked)} />Class viewing overlay</label><Reset onClick={() => {
        setSourceId(30);
        setDraft('30');
        setK(10);
        setLayout('tsne-p30-s7');
        setOverlay(false);
        setError('');
      }} /></FlowControls>{error && <p role="alert">{error}</p>}</FlowLab>;
}
export function RecipeView({
  coordinate = 2
}) {
  return <><Drawing caption="Affine input recipe (2/3,1/3) remains fixed; only the mapped query changes."><Line values={[0, coordinate, 6]} labels={['L', 'i', 'R']} colors={[hues[0],hues[1],hues[2]]} caption="Map coordinates" /><Bars values={[0, 2]} labels={['L: (2/3)·0', 'R: (1/3)·6']} colors={[hues[0],hues[2]]} max={6} caption="Weighted map contributions" /></Drawing><FlowReadout>Recipe target is 2; current query {number(coordinate)} gives residual {number(coordinate - 2)} and squared error <strong>{number((coordinate - 2) ** 2)}</strong>.</FlowReadout></>;
}
export function RecipeLab() {
  const [coordinate, setCoordinate] = useState(2);
  return <FlowLab id="L11" label="Keep a local affine recipe"><RecipeView coordinate={coordinate} /><FlowControls><ExactControl name="Mapped query" value={coordinate} setValue={setCoordinate} min={-2} max={8} /><Reset onClick={() => setCoordinate(2)} /></FlowControls></FlowLab>;
}
export function EnergyView({
  middle = 1
}) {
  const terms = [middle ** 2, (3 - middle) ** 2],
    total = terms[0] + terms[1];
  return <><Drawing caption="Unit chain support remains A–B–C; each unordered edge contributes once."><Line values={[0, middle, 3]} labels={['A', 'B', 'C']} caption="Map coordinates on fixed graph" /><Bars values={terms} labels={['AB difference²', 'BC difference²']} max={Math.max(...terms, 9)} caption="Edge energy" /></Drawing><FlowReadout>Differences {number(-middle)} and {number(middle - 3)}; energy <strong>{number(total)}</strong> = yᵀLy, ordered sum {number(2 * total)}. At middle 1.5 the energy is 4.5.</FlowReadout></>;
}
export function EnergyLab() {
  const [middle, setMiddle] = useState(1);
  return <FlowLab id="L12" label="Change graph energy"><EnergyView middle={middle} /><FlowControls><ExactControl name="Middle coordinate" value={middle} setValue={setMiddle} min={-2} max={5} /><Reset onClick={() => setMiddle(1)} /></FlowControls></FlowLab>;
}
export const investigations = {
  L1: RadiusLab,
  L2: BridgeLab,
  L3: EndpointLab,
  L4: WidthLab,
  L5: DistanceRowLab,
  L6: NormalizationLab,
  L7: ForceStepLab,
  L8: UnionLab,
  L9: PairLab,
  L10: SavedMapLab,
  L11: RecipeLab,
  L12: EnergyLab
};
export function ManifoldInvestigation({
  id
}) {
  const Investigation = investigations[id];
  return <Investigation />;
}
