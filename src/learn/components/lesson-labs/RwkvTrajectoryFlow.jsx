import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { RwkvFlowSelect } from './RwkvFlowLabs.jsx';
import { RwkvFlowScroll, RwkvBoundaryDrawing } from './RwkvFlowDrawings.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { trajectoryMemoryForward } from '../../data/rwkv-memory-models.js';
const Context = createContext(null);
const clonePoints = points => points.map(row => [...row]);
const url = '/learn-assets/rwkv-linear-attention-models/trajectory-reading-flow-models.json';
export function RwkvTrajectoryProvider({
  children
}) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [load, setLoad] = useState(false);
  const [source, setSource] = useState(20),
    [kind, setKind] = useState('rwkv4'),
    [seed, setSeed] = useState(17);
  const [points, setPoints] = useState(null),
    [point, setPoint] = useState(15),
    [cut, setCut] = useState(15),
    [pin, setPin] = useState(null);
  useEffect(() => {
    if (!load) return undefined;
    const controller = new AbortController();
    fetch(url, {
      signal: controller.signal
    }).then(response => {
      if (!response.ok) throw new Error(`Lab data returned ${response.status}.`);
      return response.json();
    }).then(result => {
      setData(result);
      setError('');
      setPoints(previous => previous ?? clonePoints(result.specimens.find(row => row.sourceRow === 20).points));
    }).catch(reason => {
      if (reason.name !== 'AbortError') setError(reason.message);
    });
    return () => controller.abort();
  }, [load, attempt]);
  const results = useMemo(() => {
    if (!data || !points) return null;
    const parameters = data.models[`${kind}:${seed}`];
    const current = trajectoryMemoryForward(parameters, points, kind);
    const carried = trajectoryMemoryForward(parameters, points, kind, {
      cut
    });
    const reset = trajectoryMemoryForward(parameters, points, kind, {
      cut,
      reset: true
    });
    const original = trajectoryMemoryForward(parameters, data.specimens.find(row => row.sourceRow === source).points, kind);
    const prefixError = Math.max(0, ...current.features.slice(0, point).flatMap((row, i) => row.map((value, j) => Math.abs(value - original.features[i][j]))));
    return {
      current,
      carried,
      reset,
      prefixError,
      carryError: Math.max(...current.logits.map((v, i) => Math.abs(v - carried.logits[i])))
    };
  }, [data, points, kind, seed, cut, source, point]);
  return <Context.Provider value={{
    data,
    error,
    retry: () => {
      setError('');
      setAttempt(a => a + 1);
    },
    setLoad,
    source,
    setSource,
    kind,
    setKind,
    seed,
    setSeed,
    points,
    setPoints,
    point,
    setPoint,
    cut,
    setCut,
    pin,
    setPin,
    results
  }}>{children}</Context.Provider>;
}
function PathDrawing({
  points,
  point,
  setPoint,
  setPoints,
  cut
}) {
  const changeByPointer = (event, index) => {
    const rectangle = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, ((event.clientX - rectangle.left) / rectangle.width * 350 - 40) / 270));
    const y = Math.max(0, Math.min(1, (315 - (event.clientY - rectangle.top) / rectangle.height * 365) / 270));
    setPoint(index);
    setPoints(previous => previous.map((row, i) => i === index ? [x, y] : row));
  };
  return <figure className="rwkv-flow-drawing" data-figure="rwkv-trajectory-path"><RwkvFlowScroll label="Supplied movement path and editable points">
    <svg viewBox="0 0 350 365" role="img" aria-label={`Completed movement path; point ${point + 1} selected; cut after ${cut}. Drag a point or use the controls.`}>
      <rect x="40" y="45" width="270" height="270" fill="none" stroke="#777" />
      <polyline points={points.map(p => `${40 + 270 * p[0]},${315 - 270 * p[1]}`).join(' ')} fill="none" stroke="#999" />
      {points.map((p, i) => <g key={i}>
        <circle cx={40 + 270 * p[0]} cy={315 - 270 * p[1]} r={i === point ? 7 : 3} fill="#83b4e8" stroke={i === point ? '#fff' : 'none'} strokeWidth="2" />
        <circle className="rwkv-drag-point" cx={40 + 270 * p[0]} cy={315 - 270 * p[1]} r="11" fill="transparent" onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setPoint(i);
            changeByPointer(event, i);
          }} onPointerMove={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) changeByPointer(event, i);
          }} onPointerUp={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}><title>Point {i + 1}: x {f(p[0])}, y {f(p[1])}</title></circle>
      </g>)}
      <circle cx={40 + 270 * points[0][0]} cy={315 - 270 * points[0][1]} r="10" fill="none" stroke="#fff" />
      <rect x={35 + 270 * points.at(-1)[0]} y={310 - 270 * points.at(-1)[1]} width="10" height="10" fill="none" stroke="#fff" />
      <text x="175" y="24" textAnchor="middle" fill="#83b4e8">normalized x/y; equal unit scales</text>
      <text x="175" y="345" textAnchor="middle" fill="#ddd">ring start; square end; white selected point</text>
      <text x="35" y="330" fill="#aaa">0</text><text x="302" y="330" fill="#aaa">1</text><text x="23" y="52" fill="#aaa">1</text><text x="23" y="316" fill="#aaa">0</text>
    </svg></RwkvFlowScroll><figcaption>The supplied coordinates stay cyan. Point index is resampling order, not physical time. Sliders provide the same edit without dragging.</figcaption></figure>;
}
function ProbabilityDrawing({
  results
}) {
  return <figure className="rwkv-flow-drawing" data-figure="rwkv-class-probabilities"><RwkvFlowScroll label="All fifteen class probabilities"><svg viewBox="0 0 350 418" role="img" aria-label="All fifteen current class probabilities on a fixed zero to one scale">
    {results.current.probabilities.map((probability, i) => <g key={i}><text x="12" y={23 + i * 25} fill="#ddd">class {i + 1}</text><rect x="92" y={10 + i * 25} width={180 * probability} height="13" fill="#c1a0dc" /><text x="281" y={23 + i * 25} fill="#c1a0dc">{f(probability, 4)}</text></g>)}
    <text x="92" y="401" fill="#aaa">0</text><text x="264" y="401" fill="#aaa">1</text>
  </svg></RwkvFlowScroll><figcaption>Computed probabilities use violet; changing models holds the edited path fixed. The scale stays 0…1.</figcaption></figure>;
}
export function RwkvFittedFlow({
  study
}) {
  const context = useContext(Context),
    [section, ready] = useLessonViewport();
  useEffect(() => {
    if (ready) context.setLoad(true);
  }, [ready, context.setLoad]);
  const {
    data,
    error,
    retry,
    source,
    setSource,
    kind,
    setKind,
    seed,
    setSeed,
    points,
    setPoints,
    point,
    setPoint,
    cut,
    setCut,
    pin,
    setPin,
    results
  } = context;
  const specimen = data?.specimens.find(row => row.sourceRow === source);
  const restore = () => setPoints(clonePoints(specimen.points));
  const controls = () => {
    if (study === 'source') return <RwkvFlowSelect name="Validation source" value={source} options={data.specimens.map(row => [row.sourceRow, `Source ${row.sourceRow}; class ${row.label}`])} onChange={v => {
      const row = data.specimens.find(s => s.sourceRow === Number(v));
      setSource(row.sourceRow);
      setPoints(clonePoints(row.points));
    }} />;
    if (study === 'edit') return <><FlowSlider name="Selected point" min={1} max={45} step={1} value={point + 1} onChange={v => setPoint(v - 1)} />{['x', 'y'].map((axis, index) => <FlowSlider key={axis} name={`Selected ${axis}`} min={0} max={1} step={.001} value={points[point][index]} onChange={v => setPoints(points.map((row, i) => i === point ? row.map((x, j) => j === index ? v : x) : row))} />)}</>;
    if (study === 'model') return <><RwkvFlowSelect name="Memory model" value={kind} options={[["rwkv4", "RWKV-4 style"], ["positive_kernel", "Positive kernel"]]} onChange={setKind} /><RwkvFlowSelect name="Retained seed" value={seed} options={[[17, '17'], [41, '41']]} onChange={v => setSeed(Number(v))} /></>;
    if (study === 'order') return <><button onClick={() => setPoints([...points].reverse())}>Reverse chronology</button><button onClick={() => setPoints(points.map((row, i) => i === point ? [1 - row[0], row[1]] : row))}>Reflect selected x</button><button onClick={restore}>Restore source</button></>;
    if (study === 'cut') return <FlowSlider name="Cut after point" value={cut} min={1} max={44} step={1} onChange={setCut} />;
    return <><button onClick={() => setPin({
        source,
        kind,
        seed,
        cut,
        points: clonePoints(points),
        probabilities: [...results.current.probabilities]
      })}>Pin current edited case</button><button disabled={!pin} onClick={() => setPin(null)}>Clear pin</button></>;
  };
  return <FlowLab id={`rwkv-fitted-${study}`} label={`Fitted movement ${study} investigation`}>
    <div ref={section}>
      {error ? <><p role="alert">{error}</p><FlowControls><button onClick={retry}>Retry fitted data</button></FlowControls></> : !results ? <p role="status">Loading the retained movement models…</p> : <>
        {study === 'model' ? <ProbabilityDrawing results={results} /> : study === 'cut' ? <RwkvBoundaryDrawing /> : <PathDrawing points={points} point={point} setPoint={setPoint} setPoints={setPoints} cut={cut} />}
        <FlowControls>{controls()}</FlowControls>
        <FlowReadout>Source {source}, {kind === 'rwkv4' ? 'RWKV-4 style' : 'positive kernel'} seed {seed}: whole class {results.current.predicted}; carried class {results.carried.predicted}; reset class {results.reset.predicted}. Whole/carry logit difference {f(results.carryError, 9)}. Original class {specimen.label} probability is {f(results.current.probabilities[specimen.label - 1])}; modified inputs have no certified replacement label.{study === 'edit' && <> Selected point {point + 1} is [{points[point].map(v => f(v)).join(', ')}]. Prefix difference before it, compared with this source's original path, is {f(results.prefixError, 9)}; earlier edits can already change that prefix.</>}{study === 'pin' && <> {pin ? `Pinned source ${pin.source}, ${pin.kind}, seed ${pin.seed}, cut ${pin.cut}; later edits do not change that saved input.` : 'No current pin.'}</>}</FlowReadout>
        {study === 'model' && <NeuralTable caption="All fifteen distributions, same current path" headers={['Recorded class', 'Whole', 'Carried', 'Reset']} rows={results.current.probabilities.map((p, i) => [i + 1, f(p, 8), f(results.carried.probabilities[i], 8), f(results.reset.probabilities[i], 8)])} />}
        {study === 'cut' && <NeuralTable caption="Current per-position feature inspection; coordinates 1 and 2 of 16" headers={['Point', 'Feature 1', 'Feature 2', 'Boundary']} rows={results.current.features.map((row, i) => [i + 1, f(row[0]), f(row[1]), i + 1 === cut ? 'last before cut' : ''])} />}
        {study === 'pin' && pin && <NeuralTable caption="Pinned and current complete class evidence" headers={['Class', 'Pinned case', 'Current case']} rows={pin.probabilities.map((p, i) => [i + 1, f(p, 8), f(results.current.probabilities[i], 8)])} />}
      </>}
    </div>
  </FlowLab>;
}
export function RwkvRecordedEvidence() {
  const context = useContext(Context),
    [section, ready] = useLessonViewport();
  useEffect(() => {
    if (ready) context.setLoad(true);
  }, [ready, context.setLoad]);
  return <div ref={section}>
    {context.error ? <><p role="alert">{context.error}</p><FlowControls><button onClick={context.retry}>Retry recorded data</button></FlowControls></> : !context.data ? <p role="status">Loading recorded losses…</p> : context.data.recorded.map(record => {
      const maximum = Math.max(...record.history.flatMap(row => row.slice(1))) * 1.12;
      const x = epoch => 43 + 2.1 * (epoch - 1),
        y = loss => 228 - 180 * loss / maximum;
      return <figure className="rwkv-flow-drawing" data-figure={`rwkv-evidence-${record.kind}-${record.seed}`} key={`${record.kind}:${record.seed}`}>
        <RwkvFlowScroll label={`${record.kind} seed ${record.seed} recorded learning history`}><svg viewBox="0 0 350 315" role="img" aria-label={`${record.kind} seed ${record.seed}, all 100 recorded fit and validation cross entropy values`}>
          <text x="175" y="22" textAnchor="middle" fill="#ddd">{record.kind}; seed {record.seed}</text>
          <line x1="43" x2="253" y1="228" y2="228" stroke="#777" /><line x1="43" x2="43" y1="40" y2="228" stroke="#777" />
          {[0, maximum / 2, maximum].map(value => <text key={value} x="36" y={y(value) + 4} textAnchor="end" fill="#aaa">{f(value, 2)}</text>)}
          {[1, 50, 100].map(epoch => <text key={epoch} x={x(epoch)} y="251" textAnchor="middle" fill="#aaa">{epoch}</text>)}
          {[[1, 'fit', '#e39d6a', 273], [2, 'validation', '#c1a0dc', 296]].map(([column, name, color, labelY]) => <g key={name}>
            <polyline points={record.history.map(row => `${x(row[0])},${y(row[column])}`).join(' ')} stroke={color} fill="none" strokeWidth="1.8" />
            <polyline points={`${x(100)},${y(record.history.at(-1)[column])} 290,${y(record.history.at(-1)[column])} 290,${labelY - 5} 270,${labelY - 5}`} fill="none" stroke={color} />
            <text x="255" y={labelY} textAnchor="end" fill={color}>{name} {f(record.history.at(-1)[column], 4)}</text>
          </g>)}
          <line x1={x(record.selected_epoch)} x2={x(record.selected_epoch)} y1="43" y2="228" stroke="#e4b752" strokeDasharray="3 3" />
        </svg></RwkvFlowScroll>
        <figcaption>Actual epochs 1…100; dashed amber marks retained epoch {record.selected_epoch}. Axes: epoch horizontally, cross-entropy vertically. Separate direct labels keep both trajectories identifiable.</figcaption>
      </figure>;
    })}
  </div>;
}
