import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable, NeuralPlot } from './NeuralLessonElements.jsx';
import { longContextDefaults, retainedRead, recurrenceTrace, latentRead } from '../../data/long-context-models.js';
import { LongSegmentDrawing, LongRetainWriteDrawing, LongCausalDrawing, LongPositionPolicyDrawing } from './LongContextDrawings.jsx';
import './long-context-flow.css';
import { useLongContextResource } from './LongContextLabs.jsx';

const Context = createContext(null);
const impulse = () => Array.from({ length: 6 }, (_, i) => ({ x: i ? 0 : 1, input: 1, recurrence: .125 }));
const tagged = () => [-1, 0, 1].map((position, i) => ({ id: `P${i}`, position, value: 2 + 4 * i, comparison: 6 * i }));
const update = (items, selected, field, value) => items.map((item, i) => i === selected ? { ...item, [field]: value } : item);
export function LongContextFlowProvider({ children }) {
  const [records, setRecords] = useState(longContextDefaults), [memory, setMemory] = useState(2), [segment, setSegment] = useState(2), [query, setQuery] = useState(4), [record, setRecord] = useState(0), [beta, setBeta] = useState(0), [excluded, setExcluded] = useState([]);
  const [events, setEvents] = useState(impulse), [event, setEvent] = useState(1), [base, setBase] = useState(.8), [initial, setInitial] = useState(0);
  const [tags, setTags] = useState(tagged), [queries, setQueries] = useState([-Math.log(2), Math.log(2)]), [tag, setTag] = useState(0), [latent, setLatent] = useState(0);
  return <Context.Provider value={{ records, setRecords, memory, setMemory, segment, setSegment, query, setQuery, record, setRecord, beta, setBeta, excluded, setExcluded, events, setEvents, event, setEvent, base, setBase, initial, setInitial, tags, setTags, queries, setQueries, tag, setTag, latent, setLatent }}>{children}</Context.Provider>;
}
function Select({ name, value, onChange, options }) {
  return <label className="flow-select"><span>{name}</span><select aria-label={name} value={value} onChange={e => onChange(Number(e.target.value))}>{options.map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select></label>;
}
const list = count => Array.from({ length: count }, (_, i) => [i, String(i)]);
export function LongMemoryFlowLab({ view = 'access' }) {
  const s = useContext(Context), query = Math.min(s.query, s.records.length - 1), record = Math.min(s.record, s.records.length - 1);
  const read = retainedRead(s.records, s.segment, s.memory, query, s.beta, s.excluded);
  const edit = (field, value) => s.setRecords(old => update(old, record, field, value));
  const reset = () => { s.setRecords(longContextDefaults()); s.setSegment(2); s.setMemory(2); s.setQuery(4); s.setRecord(0); s.setBeta(0); s.setExcluded([]); };
  const structural = action => { action(); s.setExcluded([]); };
  if(view==='identity') return <><p>Move a complete record first: its key and value stay paired, while its position changes.</p><LongMemoryFlowLab view="move"/><p>Now change the number of stored records without changing the current question. The selected record is the one removed.</p><LongMemoryFlowLab view="size"/><p>Finally exclude one otherwise legal donor. The last legal donor stays protected because an empty read has no normalized answer.</p><LongMemoryFlowLab view="exclude"/></>;
  return <FlowLab id={`long-context-cache-${view}`}  label={view === 'access' ? 'Change which records remain available' : view === 'records' ? 'Change one key or returned value' : view === 'position' ? 'Change recency preference' : 'Move complete records or exclude a donor'}>
    <LongSegmentDrawing records={s.records.map(r => r.value)} memory={s.memory} segment={s.segment} query={query} statuses={read.rows.map(r => r.status)} />
    <FlowControls>
      {view === 'access' && <><FlowSlider name="Segment length L" value={s.segment} onChange={v => structural(() => s.setSegment(v))} min={1} max={8} step={1} /><FlowSlider name="Retained rows M" value={s.memory} onChange={v => structural(() => s.setMemory(v))} min={0} max={16} step={1} /><Select name="Query position" value={query} onChange={v => structural(() => s.setQuery(v))} options={list(s.records.length)} /></>}
      {view === 'records' && <><Select name="Record to edit" value={record} onChange={s.setRecord} options={s.records.map((r, i) => [i, `${r.id} at ${i}`])} /><FlowSlider name="Selected key" value={s.records[record].key} onChange={v => edit('key', v)} min={-4} max={4} step={.05} /><FlowSlider name="Selected value" value={s.records[record].value} onChange={v => edit('value', v)} min={-10} max={10} step={.1} /></>}
      {view === 'position' && <><FlowSlider name="Recency penalty β" value={s.beta} onChange={s.setBeta} min={0} max={1} step={.01} /><Select name="Query position" value={query} onChange={v => structural(() => s.setQuery(v))} options={list(s.records.length)} /></>}
      {view === 'move' && <><Select name="Record to move" value={record} onChange={s.setRecord} options={s.records.map((r, i) => [i, `${r.id} at ${i}`])} /><button disabled={record === 0} onClick={() => structural(() => { s.setRecords(old => { const a = [...old]; [a[record - 1], a[record]] = [a[record], a[record - 1]]; return a; }); s.setRecord(record - 1); })}>Move earlier</button><button disabled={record === s.records.length - 1} onClick={() => structural(() => { s.setRecords(old => { const a = [...old]; [a[record + 1], a[record]] = [a[record], a[record + 1]]; return a; }); s.setRecord(record + 1); })}>Move later</button></>}
      {view === 'size' && <><Select name="Record to remove" value={record} onChange={s.setRecord} options={s.records.map((r,i)=>[i,`${r.id} at ${i}`])}/><button disabled={s.records.length >= 16} onClick={() => structural(() => s.setRecords(old => [...old, { id: `R${Math.max(...old.map(r => Number(r.id.slice(1)))) + 1}`, key: 0, value: 0 }]))}>Add record</button><button disabled={s.records.length <= 1} onClick={() => structural(() => s.setRecords(old => old.filter((_, i) => i !== record)))}>Remove selected</button></>}
      {view==='exclude'&&<><Select name="Donor to exclude" value={record} onChange={s.setRecord} options={s.records.map((r,i)=>[i,`${r.id} at ${i}`])}/><button disabled={!['legal', 'excluded by edit'].includes(read.rows[record].status) || (read.rows[record].status === 'legal' && read.legalIds.length === 1)} onClick={() => s.setExcluded(old => old.includes(s.records[record].id) ? old.filter(id => id !== s.records[record].id) : [...old, s.records[record].id])}>{s.excluded.includes(s.records[record].id) ? 'Restore selected donor' : 'Exclude selected donor'}</button></>}
    </FlowControls>
    <FlowReadout>Query {query} returns {f(read.output, 8)} from {read.legalIds.join(', ')}; the current support total is {f(read.denominator, 8)}. The fixture q=1 and the same edited records continue into the following investigations.</FlowReadout>
    <NeuralTable caption="Each actual selected-read contribution" headers={['Record / position', 'Status', 'Score', 'Weight', 'Value × weight']} rows={read.rows.map(row => [row.id + ' / ' + row.position, row.status, f(row.score), f(row.weight ?? 0), f(row.contribution ?? 0)])} />


    <FlowControls><button onClick={reset}>Reset record fixture</button></FlowControls>
  </FlowLab>;
}

export function LongRecurrenceFlowLab({ view = 'input' }) {
  const s = useContext(Context), event = Math.min(s.event, s.events.length - 1), e = s.events[event];
  const trace = useMemo(() => recurrenceTrace(s.events, s.base, s.initial), [s.events, s.base, s.initial]), current = trace[event];
  const previous = event ? trace[event - 1].state : s.initial;
  const edit = (field, value) => s.setEvents(old => update(old, event, field, value));
  const reset = () => { s.setEvents(impulse()); s.setBase(.8); s.setInitial(0); s.setEvent(1); };
  const eventControl = <Select name="Event to inspect" value={event} onChange={s.setEvent} options={s.events.map((_, i) => [i, `Event ${i + 1}`])} />;
  if(view==='order')return <><p>Reverse complete events with their gates and follow how the final contributions change.</p><LongRecurrenceFlowLab view="ordering"/><p>Changing duration is a separate question: append a silent event or remove one selected event, keeping the current coefficients.</p><LongRecurrenceFlowLab view="extent"/></>;
  return <FlowLab id={`long-context-recurrence-${view}`}  label="Follow the two contributions into a recurrent state">
    <LongRetainWriteDrawing previous={previous} input={e.x} inputGate={e.input} retention={current.decay} simple={view === 'input'} />
    <FlowControls>
      {view === 'input' && <>{eventControl}<FlowSlider name="Selected input gate i" value={e.input} onChange={v => edit('input', v)} min={0} max={1} step={.01} /></>}
      {view === 'retention' && <>{eventControl}<FlowSlider name="Selected recurrence gate r" value={e.recurrence} onChange={v => edit('recurrence', v)} min={0} max={1} step={.001} /></>}
      {view === 'write' && <>{eventControl}<FlowSlider name="Selected event input x" value={e.x} onChange={v => edit('x', v)} min={-3} max={3} step={.05} /><FlowSlider name="Learned decay base" value={s.base} onChange={s.setBase} min={.05} max={.999} step={.001} /></>}
      {view === 'initial' && <><FlowSlider name="Initial state" value={s.initial} onChange={s.setInitial} min={-3} max={3} step={.05} /><FlowSlider name="Learned decay base" value={s.base} onChange={s.setBase} min={.05} max={.999} step={.001} /></>}
      {view === 'ordering' && <>{eventControl}<button onClick={() => s.setEvents(old => [...old].reverse())}>Reverse events and gates</button></>}
      {view==='extent'&&<>{eventControl}<button disabled={s.events.length >= 16} onClick={() => s.setEvents(old => [...old, { x: 0, input: 1, recurrence: .125 }])}>Add silent event</button><button disabled={s.events.length <= 1} onClick={() => s.setEvents(old => old.filter((_, i) => i !== event))}>Remove selected event</button></>}
    </FlowControls>
    <FlowReadout>Event {event + 1} retains {f(current.retained, 8)} and writes {f(current.injection, 8)}, producing {f(current.state, 8)}. After all {trace.length} events the state is {f(trace.at(-1).state, 9)}.</FlowReadout>
    <NeuralPlot title="The recomputed state after each event" xLabel="event number" yLabel="state, feature units" xDomain={[1, Math.max(2, trace.length)]} yDomain={[Math.min(0, s.initial, ...trace.map(r => r.state)) - .05, Math.max(.65, s.initial, ...trace.map(r => r.state)) + .05]} series={[{ label: 'Current state', color: '#baa1e3', values: trace.map((r, i) => [i + 1, r.state]) }]} />
    {['ordering','extent'].includes(view) && <NeuralTable caption="Every current update and final contribution" headers={['Event', 'x / i / r', 'Retained', 'Written', 'State', 'Final contribution']} rows={trace.map((r, i) => [i + 1, `${f(s.events[i].x)} / ${f(s.events[i].input)} / ${f(s.events[i].recurrence)}`, f(r.retained), f(r.injection), f(r.state), f(trace.at(-1).contributions[i])])} />}
    <FlowControls><button onClick={reset}>Reset impulse fixture</button></FlowControls>
  </FlowLab>;
}

export function LongLatentFlowLab({ view = 'query' }) {
  const s = useContext(Context), tag = Math.min(s.tag, s.tags.length - 1), latent = Math.min(s.latent, s.queries.length - 1);
  const output = latentRead(s.tags, s.queries), comparison = latentRead(s.tags.map(r => ({ ...r, value: r.comparison })), s.queries);
  const edit = (field, value) => s.setTags(old => update(old, tag, field, value));
  const reset = () => { s.setTags(tagged()); s.setQueries([-Math.log(2), Math.log(2)]); s.setTag(0); s.setLatent(0); };
  if(view==='capacity')return <><p>Change how many query rows can collect distinct summaries. Removing one row does not delete an input record.</p><LongLatentFlowLab view="rows"/><p>A single uniform read asks a more restricted question: it returns only the mean of each stream. Collapse to that read to inspect the resulting information loss.</p><LongLatentFlowLab view="uniform"/></>;
  if(view==='identity')return <><p>Move complete tagged rows, then contrast that with moving values under fixed tags.</p><LongLatentFlowLab view="pairing"/><p>Now change the number of supplied records, preserving the current learned queries. A new row has tag zero and values zero until edited above.</p><LongLatentFlowLab view="extent"/></>;
  return <FlowLab id={`long-context-latent-${view}`}  label="Change what a latent read can distinguish">
    <NeuralTable caption="Actual two streams and their common position key" headers={['Record', 'Tag', 'A', 'B', 'Selected weight']} rows={s.tags.map((r, i) => [r.id, f(r.position), f(r.value), f(r.comparison), f(output[latent].weights[i], 8)])} />
    <div className="long-flow-weights" aria-label="Selected query weight bars">{s.tags.map((r, i) => <div key={r.id}><span>{r.id}</span><span style={{ width: `${100 * output[latent].weights[i]}%` }} /><output>{f(output[latent].weights[i])}</output></div>)}</div>
    <FlowControls>
      {view === 'query' && <><Select name="Latent query to edit" value={latent} onChange={s.setLatent} options={list(s.queries.length)} /><FlowSlider name="Selected query q" value={s.queries[latent]} onChange={v => s.setQueries(old => old.map((q, i) => i === latent ? v : q))} min={-3} max={3} step={.01} /></>}
      {view === 'records' && <><Select name="Record to edit" value={tag} onChange={s.setTag} options={s.tags.map((r, i) => [i, r.id])} /><FlowSlider name="Stream A value" value={s.tags[tag].value} onChange={v => edit('value', v)} min={-12} max={12} step={.1} /><FlowSlider name="Stream B value" value={s.tags[tag].comparison} onChange={v => edit('comparison', v)} min={-12} max={12} step={.1} /></>}
      {view === 'tags' && <><Select name="Record to retag" value={tag} onChange={s.setTag} options={s.tags.map((r, i) => [i, r.id])} /><FlowSlider name="Selected position tag" value={s.tags[tag].position} onChange={v => edit('position', v)} min={-2} max={2} step={.05} /></>}
      {view === 'rows' && <><Select name="Selected latent row" value={latent} onChange={s.setLatent} options={list(s.queries.length)} /><button disabled={s.queries.length >= 4} onClick={() => s.setQueries(old => [...old, 1])}>Add query row</button><button disabled={s.queries.length <= 1} onClick={() => s.setQueries(old => old.filter((_, i) => i !== latent))}>Remove query row</button></>}
      {view==='uniform'&&<><button onClick={() => { s.setQueries([0]); s.setLatent(0); }}>One uniform query</button></>}
      {view === 'pairing' && <><button onClick={() => s.setTags(old => [old.at(-1), ...old.slice(0, -1)])}>Rotate complete tagged rows</button><button onClick={() => s.setTags(old => old.map((r, i) => ({ ...r, value: old[(i + old.length - 1) % old.length].value, comparison: old[(i + old.length - 1) % old.length].comparison })))}>Rotate values under fixed tags</button></>}
      {view==='extent'&&<><Select name="Record to remove" value={tag} onChange={s.setTag} options={s.tags.map((r,i)=>[i,r.id])}/><button disabled={s.tags.length >= 8} onClick={() => s.setTags(old => [...old, { id: `P${Math.max(...old.map(r => Number(r.id.slice(1)))) + 1}`, position: 0, value: 0, comparison: 0 }])}>Add record</button><button disabled={s.tags.length <= 1} onClick={() => s.setTags(old => old.filter((_, i) => i !== tag))}>Remove selected record</button></>}
    </FlowControls>
    <FlowReadout>Latent {latent + 1} returns A={f(output[latent].output, 8)} and B={f(comparison[latent].output, 8)}. The largest difference across all {s.queries.length} latent rows is {f(Math.max(...output.map((r, i) => Math.abs(r.output - comparison[i].output))), 9)}.</FlowReadout>
    <NeuralTable caption="Complete current latent outputs" headers={['Query', 'A', 'B']} rows={output.map((r, i) => [f(s.queries[i]), f(r.output, 8), f(comparison[i].output, 8)])} />
    <FlowControls><button onClick={reset}>Reset tagged fixture</button></FlowControls>
  </FlowLab>;
}

export function LongCausalFlowLab() {
  const [crossMask, setCross] = useState(true), [selfMask, setSelf] = useState(true), [future, setFuture] = useState(4);
  const values = [0, 1, 2, 3, future];
  const first = (crossMask ? values.slice(0, 4) : values).reduce((a, b) => a + b, 0) / (crossMask ? 4 : 5);
  const later = values.reduce((a, b) => a + b, 0) / 5, final = selfMask ? first : (first + later) / 2;
  return <FlowLab id="long-context-causal" label="Close direct and indirect future paths">
    <LongCausalDrawing crossMask={crossMask} selfMask={selfMask} />
    <FlowControls><label><input type="checkbox" checked={crossMask} onChange={e => setCross(e.target.checked)} />Exclude future input from earlier cross-read</label><label><input type="checkbox" checked={selfMask} onChange={e => setSelf(e.target.checked)} />Exclude later latent from earlier self-read</label><FlowSlider name="Future input 4 value" value={future} onChange={setFuture} min={-10} max={10} step={.1} /></FlowControls>
    <FlowReadout>With uniform scores, earlier cross-read={f(first)}, later cross-read={f(later)}, and earlier returned result={f(final)}. Editing future input 4 is a null only when both masks close its routes.</FlowReadout>
  </FlowLab>;
}

export function LongPositionPolicyFlowLab() {
  const [pair, setPair] = useState(0), [factor, setFactor] = useState(2), [prefix, setPrefix] = useState(3);
  const theta = pair ? .01 : 1, first = 2 * theta / (2 < prefix ? 1 : factor), second = 4 * theta / (4 < prefix ? 1 : factor);
  return <FlowLab id="long-context-position-policy" label="Compare a rotary pair across an unscaled prefix boundary">
    <LongPositionPolicyDrawing pair={pair} factor={factor} prefix={prefix} />
    <FlowControls><Select name="Coordinate pair" value={pair} onChange={setPair} options={[[0, 'Pair 1: frequency 1'], [1, 'Pair 2: frequency .01']]} /><FlowSlider name="Selected pair factor" value={factor} onChange={setFactor} min={1} max={8} step={.1} /><FlowSlider name="Unscaled prefix threshold" value={prefix} onChange={setPrefix} min={0} max={5} step={1} /></FlowControls>
    <FlowReadout>For this pair, position 2 uses angle {f(first, 6)} and position 4 uses {f(second, 6)} radians. Their rotated unit-vector dot product is cos(angle4−angle2)={f(Math.cos(second - first), 8)}. These are geometric scores, not measured model loss.</FlowReadout>
  </FlowLab>;
}

export function LongMeasuredHistory() {
  const [ready, setReady] = useState(false), [selected, setSelected] = useState(0), region = useRef(null);
  const resource = useLongContextResource('trajectory-results.json', ready, true);
  useEffect(() => {
    if (!globalThis.IntersectionObserver) { setReady(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setReady(true); observer.disconnect(); } }, { rootMargin: '500px' });
    if (region.current) observer.observe(region.current);
    return () => observer.disconnect();
  }, []);
  const run = resource.data?.models[selected];
  return <div ref={region}><FlowLab id="long-context-recorded-history" label="Inspect every recorded fit and validation loss">
    {resource.error ? <><p role="alert">{resource.error}</p><FlowControls><button onClick={resource.retry}>Retry recorded histories</button></FlowControls></> : !run ? <p role="status">Loading the four recorded 80-epoch histories…</p> : <>
      <NeuralPlot title={`Measured K=${run.latents}, seed ${run.seed}; selected epoch ${run.best_epoch}`} xLabel="full-batch epoch" yLabel="mean cross-entropy" xDomain={[1, 80]} yDomain={[0, Math.max(...run.history.flatMap(r => [r[1], r[2]])) * 1.03]} series={[{ label: 'Fit loss', color: '#baa1e3', values: run.history.map(r => [r[0], r[1]]) }, { label: 'Validation loss', color: '#dedede', dashed: true, values: run.history.map(r => [r[0], r[2]]) }]} />
      <FlowControls><Select name="Recorded fit to inspect" value={selected} onChange={setSelected} options={resource.data.models.map((r, i) => [i, `K=${r.latents}, seed ${r.seed}`])} /></FlowControls>
      <FlowReadout>The minimum recorded validation loss selects epoch {run.best_epoch}; its fit loss is {f(run.history[run.best_epoch - 1][1], 8)} and validation loss {f(run.history[run.best_epoch - 1][2], 8)}. Switching this view changes no trained parameter.</FlowReadout>
      <NeuralTable caption="All recorded epochs; no interpolation or omitted runs" headers={['Epoch', 'Fit loss', 'Validation loss']} rows={run.history.map(r => [r[0], f(r[1], 8), f(r[2], 8)])} />
    </>}
  </FlowLab></div>;
}
