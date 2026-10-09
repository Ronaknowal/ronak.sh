import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber as number } from './LessonFlow.jsx';
import { groupedDefaults, groupedRead, cacheBudget, conversionRead, groupedForecast, groupedRollout } from '../../data/grouped-query-models.js';
import { groupedMovementPoints } from '../../data/grouped-query-reading-fixtures.js';
import { groupedForecastTrace } from '../../data/grouped-query-reading-traces.js';
import { GqaLearnedAffineRouteDrawing, GqaLearnedBlockDrawing, GqaLearnedHeadDrawing, GqaMovementDrawing } from './GroupedQueryFlowFigures.jsx';
import { GqaArray, GqaAmdahlDrawing, GqaAffineFoldingDrawing, GqaConstructedMemoryDrawing, GqaGroupingDrawing, GqaMeanConversionDrawing, GqaMeanDistanceDrawing, GqaPairedReadersDrawing, GqaParameterShapesDrawing, GqaPayloadDrawing, GqaPermissionsDrawing, GqaReadDrawing, GqaSharedGradientDrawing, GqaValueMixtureDrawing, gqaVector } from './GroupedQueryFlowFigures.jsx';
import './grouped-query-flow.css';

const GroupedCase = createContext(null), BudgetCase = createContext(null), ConversionCase = createContext(null), GradientCase = createContext(null), ForecastCase = createContext(null);
const assetBase = '/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/';
const clone = value => structuredClone(value);
const baselineRead = groupedRead(groupedDefaults());
const counts = [1, 2, 4, 8, 16, 32, 64];

function Select({ label, value, options, onChange }) {
  return <label className="gqa-flow-select"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option value={key} key={String(key)}>{text}</option>)}</select></label>;
}
function Toggle({ label, value, onChange }) {
  return <label className="gqa-flow-toggle"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)}/><span>{label}</span></label>;
}

function GroupedCaseProvider({ children }) {
  const [state, setState] = useState(groupedDefaults), [head, setHead] = useState(0), [memory, setMemory] = useState('0:0'), [slot, setSlot] = useState(0), [queryRow, setQueryRow] = useState(0), [upperLeft, setUpperLeft] = useState(false);
  const position = state.queryPosition + queryRow;
  const legal = state.positions.map((id, i) => upperLeft ? i <= queryRow : id <= position);
  const logical = state.positions.map(id => id <= position);
  const read = useMemo(() => {
    const run = allowed => allowed.some(Boolean) ? groupedRead({ ...state, positions: allowed.map(value => value ? 0 : 2), queryPosition: 1 }) : null;
    return { rows: run(legal), reference: run(logical) };
  }, [state, queryRow, upperLeft]);
  const edit = (entity, first, second, coordinate, value) => setState(previous => {
    const next = clone(previous);
    if (entity === 'query') next.query[first][coordinate] = value;
    else next[entity][first][second][coordinate] = value;
    return next;
  });
  const reset = () => { setState(groupedDefaults()); setHead(0); setMemory('0:0'); setSlot(0); setQueryRow(0); setUpperLeft(false); };
  const append = () => {
    const last = state.positions.length;
    if (last >= 8) return;
    setState(previous => ({ ...previous, positions: [...previous.positions, Math.min(256, Math.max(...previous.positions) + 1)], keys: previous.keys.map(rows => [...rows, [1, 1]]), values: previous.values.map(rows => [...rows, [4, -4]]) }));
    setSlot(last); setMemory(`0:${last}`);
  };
  const remove = () => {
    if (state.positions.length <= 1) return;
    const [group, oldMemory] = memory.split(':').map(Number);
    setState(previous => ({ ...previous, positions: previous.positions.filter((_, i) => i !== slot), keys: previous.keys.map(rows => rows.filter((_, i) => i !== slot)), values: previous.values.map(rows => rows.filter((_, i) => i !== slot)) }));
    setMemory(`${group}:${Math.max(0, Math.min(state.positions.length - 2, oldMemory > slot ? oldMemory - 1 : oldMemory))}`);
    setSlot(Math.max(0, slot - 1));
  };
  const reverse = () => {
    const [group, index] = memory.split(':').map(Number);
    setState(previous => ({ ...previous, positions: [...previous.positions].reverse(), keys: previous.keys.map(rows => [...rows].reverse()), values: previous.values.map(rows => [...rows].reverse()) }));
    setSlot(state.positions.length - 1 - slot); setMemory(`${group}:${state.positions.length - 1 - index}`);
  };
  const relabel = () => {
    const [group, index] = memory.split(':').map(Number);
    setState(previous => ({ ...previous, keys: [...previous.keys].reverse(), values: [...previous.values].reverse(), mapping: previous.mapping.map(g => 1 - g) }));
    setMemory(`${1 - group}:${index}`);
  };
  return <GroupedCase.Provider value={{ state, setState, head, setHead, memory, setMemory, slot, setSlot, queryRow, setQueryRow, upperLeft, setUpperLeft, position, legal, ...read, edit, reset, append, remove, reverse, relabel }}>{children}</GroupedCase.Provider>;
}
function BudgetCaseProvider({ children }) {
  const [state, setState] = useState({ batch: 1, layers: 80, length: 32768, queryHeads: 64, kvHeads: 8, keyWidth: 128, valueWidth: 128, bytes: 2, modelWidth: 512 });
  const budget = useMemo(() => cacheBudget(state), [state]);
  const update = (key, value) => setState(previous => ({ ...previous, [key]: value }));
  return <BudgetCase.Provider value={{ state, setState, budget, update }}>{children}</BudgetCase.Provider>;
}
function ConversionCaseProvider({ children }) {
  const initial = () => ({ query: [1, 2], keys: [[2, 0], [0, 2]], values: [[1, 3], [5, -1]], keyOffsets: [0, 0], valueOffsets: [0, 0] });
  const [state, setState] = useState(initial), [queryHead, setQueryHead] = useState(0), [location, setLocation] = useState('0:0'), [candidate, setCandidate] = useState('keys:0');
  const result = useMemo(() => {
    const averagedKeys = state.keys[0].map((value, i) => (value + state.keys[1][i]) / 2);
    const averagedValues = state.values[0].map((value, i) => (value + state.values[1][i]) / 2);
    return conversionRead(state.query, state.keys, state.values, { keys: averagedKeys.map((value, i) => value + state.keyOffsets[i]), values: averagedValues.map((value, i) => value + state.valueOffsets[i]) });
  }, [state]);
  const edit = (field, head, slot, value) => setState(previous => { const next = clone(previous); if (field === 'query') next.query[head] = value; else next[field][head][slot] = value; return next; });
  const tie = () => setState(previous => ({ ...previous, keys: [clone(previous.keys[0]), clone(previous.keys[0])], values: [clone(previous.values[0]), clone(previous.values[0])], keyOffsets: [0, 0], valueOffsets: [0, 0] }));
  return <ConversionCase.Provider value={{ state, setState, result, edit, queryHead, setQueryHead, location, setLocation, candidate, setCandidate, tie, reset: () => setState(initial()) }}>{children}</ConversionCase.Provider>;
}
function GradientCaseProvider({ children }) {
  const [weights, setWeights] = useState([.2, .7]), [upstream, setUpstream] = useState([3, -1]);
  const contributions = weights.map((weight, i) => weight * upstream[i]);
  return <GradientCase.Provider value={{ weights, setWeights, upstream, setUpstream, contributions, gradient: contributions.reduce((a, b) => a + b, 0) }}>{children}</GradientCase.Provider>;
}
function ForecastCaseProvider({ children }) {
  const [near, setNear] = useState(false), [attempt, setAttempt] = useState(0), [models, setModels] = useState(null), [error, setError] = useState('');
  const [boundary, setBoundary] = useState(32), [edits, setEdits] = useState({}), [frame, setFrame] = useState(23), [steps, setSteps] = useState(5), [shift, setShift] = useState(0), [inspection, setInspection] = useState('2:0');
  useEffect(() => {
    if (!near) return undefined;
    const controller = new AbortController();
    setError('');
    Promise.all([4, 2, 1].map(async heads => {
      const response = await fetch(`${assetBase}runtime-${heads}.json`, { signal: controller.signal });
      if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('Model unavailable');
      return [heads, await response.json()];
    })).then(entries => { if (!controller.signal.aborted) setModels(Object.fromEntries(entries)); })
      .catch(reason => { if (reason.name !== 'AbortError' && !controller.signal.aborted) setError('The three saved models could not load. Retry keeps your current observations and controls.'); });
    return () => controller.abort();
  }, [near, attempt]);
  const points = useMemo(() => groupedMovementPoints.slice(0, boundary).map((point, i) => edits[i] ?? point), [boundary, edits]);
  const original = useMemo(() => models && Object.fromEntries([4, 2, 1].map(heads => [heads, groupedForecast(models[heads].weights, groupedMovementPoints.slice(0, boundary), heads)])), [models, boundary]);
  const results = useMemo(() => {
    if (!models) return null;
    return Object.fromEntries([4, 2, 1].map(heads => {
      const live = groupedRollout(models[heads].weights, points, heads, steps, shift);
      let cache = null;
      const incremental = points.map(point => { const next = groupedForecast(models[heads].weights, [point], heads, shift, cache); cache = next.cache; return next.predictions[0]; });
      const cacheError = Math.max(...incremental.flatMap((row, i) => row.map((value, j) => Math.abs(value - live.predictions[i][j]))));
      const firstEdit = Math.min(boundary, ...Object.keys(edits).map(Number));
      const earlierError = Math.max(0, ...live.predictions.slice(0, firstEdit).flatMap((row, i) => row.map((value, j) => Math.abs(value - original[heads].predictions[i][j]))));
      return [heads, { ...live, cacheError, earlierError }];
    }));
  }, [models, points, steps, shift, original, edits, boundary]);
  const currentFrame = Math.min(frame, boundary - 1), selected = inspection.split(':').map(Number), point = points[currentFrame];
  const edit = (coordinate, value) => setEdits(previous => ({ ...previous, [currentFrame]: point.map((x, i) => i === coordinate ? value : x) }));
  const reset = () => { setBoundary(32); setEdits({}); setFrame(23); setSteps(5); setShift(0); setInspection('2:0'); };
  return <ForecastCase.Provider value={{ near, setNear, error, models, results, original, boundary, setBoundary, points, edits, frame: currentFrame, setFrame, steps, setSteps, shift, setShift, inspection, setInspection, branch: selected[0], head: selected[1], point, edit, reset, retry: () => setAttempt(value => value + 1) }}>{children}</ForecastCase.Provider>;
}
export function GqaLessonProvider({ children }) {
  return <GroupedCaseProvider><BudgetCaseProvider><ConversionCaseProvider><GradientCaseProvider><ForecastCaseProvider>{children}</ForecastCaseProvider></GradientCaseProvider></ConversionCaseProvider></BudgetCaseProvider></GroupedCaseProvider>;
}

export function GqaGroupingInvestigation() {
  const [heads, setHeads] = useState(2);
  return <FlowLab label="Change how many distinct head descriptions are stored"><GqaGroupingDrawing count={heads}/><FlowControls><Select label="Distinct key/value heads" value={heads} onChange={value => setHeads(Number(value))} options={[[4, '4: one per reader'], [2, '2: two readers per group'], [1, '1: all readers share']]}/></FlowControls><FlowReadout>Four query heads now read <strong>{heads}</strong> distinct K/V heads, with <strong>{4 / heads}</strong> readers per group. This drawing changes the architecture’s connections; the next numerical example fixes two groups.</FlowReadout></FlowLab>;
}
export function GqaProjectedInvestigation({ question = 'query' }) {
  const c = useContext(GroupedCase), [group, slot] = c.memory.split(':').map(Number), entity = question === 'query' ? 'query' : question === 'key' ? 'keys' : 'values';
  const selected = entity === 'query' ? c.state.query[c.head] : c.state[entity][group][slot];
  const inspectedHead = entity === 'query' || c.state.mapping[c.head] === group ? c.head : c.state.mapping.findIndex(g => g === group);
  const memoryOptions = [0, 1].flatMap(g => c.state.positions.map((id, i) => [`${g}:${i}`, `Group ${g}, slot ${i}, ID ${id}`]));
  return <FlowLab id={`gqa-${question}-edit`} label={`Change one projected ${question} vector`}>
    {inspectedHead < 0 ? <GqaConstructedMemoryDrawing state={c.state}/> : entity === 'values' ? <GqaValueMixtureDrawing state={c.state} head={inspectedHead} row={c.rows?.[inspectedHead]}/> : entity === 'keys' ? <GqaPairedReadersDrawing state={c.state} group={group} rows={c.rows}/> : <GqaReadDrawing state={c.state} head={inspectedHead} row={c.rows?.[inspectedHead]} legal={c.legal}/>}
    <FlowControls>{entity === 'query' ? <Select label="Query head to edit and inspect" value={c.head} onChange={value => c.setHead(Number(value))} options={c.state.mapping.map((g, h) => [h, `Head ${h} → group ${g}`])}/>
      : <Select label={`${question} record to edit`} value={c.memory} onChange={c.setMemory} options={memoryOptions}/>}
      {[0, 1].map(coordinate => <FlowSlider key={coordinate} name={`${question} ${coordinate ? 'y' : 'x'}`} value={selected[coordinate]} min={-4} max={4} step={.01} onChange={value => c.edit(entity, entity === 'query' ? c.head : group, slot, coordinate, value)}/>)}</FlowControls>
    <FlowReadout>{inspectedHead < 0 ? `No current query is connected to edited group ${group}; its stored vectors change without changing any reader output.` : <>{entity === 'query' ? `Head ${inspectedHead} reads group ${c.state.mapping[inspectedHead]}.` : `You edited group ${group}, slot ${slot}; this drawing follows connected head ${inspectedHead}.`} Its current mixed output is <strong>{gqaVector(c.rows?.[inspectedHead].output)}</strong>.</>} {entity === 'values' ? 'Values change the written mixture, while every matching weight stays fixed.' : entity === 'keys' ? 'A changed key affects only readers connected to that group, and only when their dot product changes.' : 'Other projected queries remain fixed; sharing a memory does not force their questions to agree.'}</FlowReadout>
  </FlowLab>;
}
export function GqaRoutingInvestigation() {
  const c = useContext(GroupedCase);
  return <FlowLab label="Change the group read by one query head"><GqaGroupingDrawing mapping={c.state.mapping} selected={c.head}/><FlowControls>
    <Select label="Query head" value={c.head} onChange={value => c.setHead(Number(value))} options={[0, 1, 2, 3].map(h => [h, `Head ${h}`])}/>
    <Select label="Connect this reader to group" value={c.state.mapping[c.head]} onChange={value => c.setState(previous => ({ ...previous, mapping: previous.mapping.map((g, h) => h === c.head ? Number(value) : g) }))} options={[[0, 'Group 0'], [1, 'Group 1']]}/>
  </FlowControls><FlowReadout>Head {c.head} now reads group <strong>{c.state.mapping[c.head]}</strong>; its current output is <strong>{gqaVector(c.rows?.[c.head].output)}</strong>. This changes a connection while holding the stored arrays fixed; it is different from consistently renaming both groups.</FlowReadout></FlowLab>;
}
export function GqaReadResults() {
  const c = useContext(GroupedCase);
  const rows = c.state.query.map((_, h) => [h, c.state.mapping[h], ...(c.rows?.[h].output ?? ['—', '—']), ...(c.rows ? c.rows[h].output.map((value, j) => value - baselineRead[h].output[j]) : ['—', '—'])]);
  return <><GqaArray label="All current reader outputs; the last two columns compare with the original frozen fixture" values={rows} columns={['head', 'KV group', 'output x', 'output y', 'Δ original x', 'Δ original y']}/><FlowReadout>All related questions use the same edited projected vectors and connections. The difference columns include <strong>all current edits</strong>, rather than isolating whichever control was changed last.</FlowReadout></>;
}
export function GqaPermissionInvestigation({ question = 'key-id' }) {
  const c = useContext(GroupedCase), both = [c.state.queryPosition, c.state.queryPosition + 1];
  const difference = c.rows && c.reference ? Math.max(...c.rows.flatMap((row, h) => row.output.map((value, j) => Math.abs(value - c.reference[h].output[j])))) : null;
  return <FlowLab label={`Investigate cache permissions: ${question}`}><GqaPermissionsDrawing positions={c.state.positions} queryPositions={both} upperLeft={c.upperLeft}/><FlowControls>
    {question === 'key-id' && <><Select label="Stored record" value={c.slot} onChange={value => c.setSlot(Number(value))} options={c.state.positions.map((id, i) => [i, `Slot ${i}, ID ${id}`])}/><FlowSlider name="Attached key ID" value={c.state.positions[c.slot]} min={0} max={256} step={1} onChange={value => c.setState(previous => ({ ...previous, positions: previous.positions.map((id, i) => i === c.slot ? value : id) }))}/></>}
    {question === 'query-id' && <><FlowSlider name="First query ID" value={c.state.queryPosition} min={0} max={255} step={1} onChange={value => c.setState(previous => ({ ...previous, queryPosition: value }))}/><Select label="Query row to read" value={c.queryRow} onChange={value => c.setQueryRow(Number(value))} options={both.map((id, row) => [row, `Row ${row}, ID ${id}`])}/></>}
    {question === 'triangle' && <Toggle label="Use the local upper-left triangle instead" value={c.upperLeft} onChange={c.setUpperLeft}/>}
  </FlowControls><FlowReadout>Row {c.queryRow}, attached query ID {c.position}, reads <strong>{c.legal.filter(Boolean).length}</strong> legal records. Head {c.head} writes <strong>{gqaVector(c.rows?.[c.head].output)}</strong>. Its four-head maximum output difference from the attached-ID relation is <strong>{difference === null ? 'undefined because one relation has no legal record' : number(difference, 9)}</strong>.</FlowReadout></FlowLab>;
}
export function GqaRecordInvestigation({ question = 'append' }) {
  const c = useContext(GroupedCase);
  return <FlowLab label={`Change cache records: ${question}`}><GqaConstructedMemoryDrawing state={c.state}/><FlowControls>
    {question === 'append' ? <><Select label="Record to remove" value={c.slot} onChange={value => c.setSlot(Number(value))} options={c.state.positions.map((id, i) => [i, `Slot ${i}, ID ${id}`])}/><button type="button" disabled={c.state.positions.length === 8} onClick={c.append}>Append initialized record</button><button type="button" disabled={c.state.positions.length === 1} onClick={c.remove}>Remove selected record</button></>
      : <><button type="button" onClick={c.reverse}>Reverse complete records and IDs</button><button type="button" onClick={c.relabel}>Relabel groups and all connections</button><button type="button" onClick={c.reset}>Reset the projected read</button></>}
  </FlowControls><FlowReadout>There are <strong>{c.state.positions.length}</strong> physical records per KV group, containing <strong>{2 * 2 * c.state.positions.length * 2 * 8}</strong> K/V bytes in this float64 fixture, versus <strong>{2 * 4 * c.state.positions.length * 2 * 8}</strong> if copied to all four readers. Logical permission currently gives head {c.head} output <strong>{gqaVector(c.reference?.[c.head].output)}</strong>; the local-triangle relation follows physical slots and need not survive their reversal.</FlowReadout></FlowLab>;
}
export function GqaBudgetInvestigation({ question = 'population' }) {
  const c = useContext(BudgetCase), s = c.state, b = c.budget;
  const fields = question === 'population' ? [['batch', 'Independent requests B', 64], ['layers', 'Layers in the model', 256], ['length', 'Occupied positions', 262144]] : [['keyWidth', 'Key coordinates per head', 256], ['valueWidth', 'Value coordinates per head', 256]];
  return <FlowLab label={`Change exact cache dimensions: ${question}`}>
    {question === 'model-width' ? <GqaParameterShapesDrawing state={s}/> : <GqaPayloadDrawing state={s}/>}
    <FlowControls>{['population', 'widths'].includes(question) && fields.map(([key, label, maximum]) => <FlowSlider key={key} name={label} value={s[key]} min={1} max={maximum} step={1} onChange={value => c.update(key, value)}/>)}
      {question === 'widths' && <Select label="Bytes per stored coordinate" value={s.bytes} onChange={value => c.update('bytes', Number(value))} options={[[1, '1 byte'], [2, '2 bytes'], [4, '4 bytes'], [8, '8 bytes']]}/>}
      {question === 'heads' && <><Select label="Query readers Hq" value={s.queryHeads} onChange={value => c.setState(previous => { const queryHeads = Number(value); return { ...previous, queryHeads, kvHeads: Math.min(previous.kvHeads, queryHeads) }; })} options={counts.map(value => [value, value])}/><Select label="Distinct KV heads Hkv" value={s.kvHeads} onChange={value => c.update('kvHeads', Number(value))} options={counts.filter(value => s.queryHeads % value === 0).map(value => [value, value])}/></>}
      {question === 'model-width' && <FlowSlider name="Model input/output width D" value={s.modelWidth} min={1} max={8192} step={1} onChange={value => c.update('modelWidth', value)}/>}
    </FlowControls><FlowReadout>Current K/V payload is <strong>{b.total.toLocaleString('en-US')} bytes</strong> ({number(b.total / 2 ** 30, 6)} GiB); one record across all requests/layers costs {b.perToken.toLocaleString('en-US')} bytes. Giving every query its own K/V head would require <strong>{b.mha.toLocaleString('en-US')} bytes</strong>. {question === 'model-width' && <>The four map arrays contain <strong>{b.parameters.toLocaleString('en-US')}</strong> weights, excluding biases. Changing D alone changes projection weights, not the already specified K/V head widths or their cache payload.</>}</FlowReadout>
  </FlowLab>;
}
export function GqaAmdahlInvestigation() {
  const [fraction, setFraction] = useState(.6), [factor, setFactor] = useState(8), cost = 1 - fraction + fraction / factor;
  return <FlowLab label="Separate reducible traffic from unchanged work"><GqaAmdahlDrawing fraction={fraction} factor={factor}/><FlowControls>
    <FlowSlider name="Assumed baseline traffic fraction" value={fraction} min={0} max={1} step={.01} onChange={setFraction}/><FlowSlider name="Traffic reduction factor" value={factor} min={1} max={64} step={1} onChange={setFactor}/>
  </FlowControls><FlowReadout>Under these assumptions, total cost changes from 1 to <strong>{number(cost)}</strong>, giving a modeled speed factor <strong>{number(1 / cost)}</strong>. The remaining {number(1 - fraction)} of baseline cost is held fixed.</FlowReadout></FlowLab>;
}
export function GqaConversionInvestigation({ question = 'query' }) {
  const c = useContext(ConversionCase), [head, slot] = c.location.split(':').map(Number);
  const field = question === 'key' ? 'keys' : 'values';
  const [candidateField, candidateSlot] = c.candidate.split(':');
  const offsetField = candidateField === 'keys' ? 'keyOffsets' : 'valueOffsets', row = c.result[0];
  return <FlowLab label={`Investigate mean conversion: ${question}`}>
    {question === 'candidate' ? <GqaMeanDistanceDrawing originals={c.state[candidateField]} candidate={candidateField === 'keys' ? row.sharedKeys : row.sharedValues} mean={candidateField === 'keys' ? row.averagedKeys : row.averagedValues} label={`Shared ${candidateField} candidate`}/> : <GqaMeanConversionDrawing state={c.state} result={c.result}/>}
    <FlowControls>
      {question === 'query' && <><Select label="Original query head" value={c.queryHead} onChange={value => c.setQueryHead(Number(value))} options={[[0, 'Head 0'], [1, 'Head 1']]}/><FlowSlider name="Projected scalar query" value={c.state.query[c.queryHead]} min={-4} max={4} step={.01} onChange={value => c.edit('query', c.queryHead, 0, value)}/></>}
      {['key', 'value'].includes(question) && <><Select label={`Original ${question} coordinate`} value={c.location} onChange={c.setLocation} options={[0, 1].flatMap(h => [0, 1].map(s => [`${h}:${s}`, `Head ${h}, slot ${s}`]))}/><FlowSlider name={`Scalar ${question}`} value={c.state[field][head][slot]} min={-6} max={6} step={.01} onChange={value => c.edit(field, head, slot, value)}/></>}
      {question === 'candidate' && <><Select label="Candidate coordinate" value={c.candidate} onChange={c.setCandidate} options={['keys', 'values'].flatMap(name => [0, 1].map(s => [`${name}:${s}`, `${name}, slot ${s}`]))}/><FlowSlider name="Offset from this coordinate’s mean" value={c.state[offsetField][Number(candidateSlot)]} min={-4} max={4} step={.01} onChange={value => c.setState(previous => ({ ...previous, [offsetField]: previous[offsetField].map((x, i) => i === Number(candidateSlot) ? value : x) }))}/></>}
      {question === 'tied' && <><button type="button" onClick={c.tie}>Make both K/V heads equal and clear offsets</button><button type="button" onClick={c.reset}>Restore the original counterexample</button></>}
    </FlowControls><FlowReadout>Old outputs are <strong>{gqaVector(c.result.map(value => value.original))}</strong>; shared-candidate outputs are <strong>{gqaVector(c.result.map(value => value.converted))}</strong>. Key distance is <strong>{number(row.keyDistance)}</strong> (mean minimum {number(row.minimumKeyDistance)}), and value distance is <strong>{number(row.valueDistance)}</strong> (mean minimum {number(row.minimumValueDistance)}). These are projection-coordinate distances, not forecast losses.</FlowReadout>
  </FlowLab>;
}
export function GqaSharedGradientInvestigation({ question = 'weights' }) {
  const c = useContext(GradientCase), weights = question === 'weights', values = weights ? c.weights : c.upstream, setter = weights ? c.setWeights : c.setUpstream;
  return <FlowLab label={`Change shared-gradient ${question}`}><GqaSharedGradientDrawing weights={c.weights} upstream={c.upstream}/><FlowControls>{values.map((value, i) => <FlowSlider key={i} name={weights ? `Reader ${i} mass on this record` : `Reader ${i} upstream loss derivative`} value={value} min={weights ? 0 : -5} max={weights ? 1 : 5} step={.01} onChange={next => setter(previous => previous.map((x, j) => j === i ? next : x))}/>)}</FlowControls><FlowReadout>Reader contributions are {gqaVector(c.contributions)}, so the single shared coordinate receives derivative <strong>{number(c.gradient)}</strong>. The two weights belong to different readers; they are not required to sum to one together.</FlowReadout></FlowLab>;
}
export function GqaAffineFoldingInvestigation() {
  const [coefficients, setCoefficients] = useState([.25, .75]);
  return <FlowLab label="Fold static affine mixing into one projection"><GqaAffineFoldingDrawing first={coefficients[0]} second={coefficients[1]}/><FlowControls>{coefficients.map((value, i) => <FlowSlider key={i} name={`Map ${i} coefficient`} value={value} min={-2} max={2} step={.05} onChange={next => setCoefficients(previous => previous.map((x, j) => j === i ? next : x))}/>)}</FlowControls><FlowReadout>Both routes produce <strong>{gqaVector([3 * coefficients[0] - 2 * coefficients[1], -2 * coefficients[0]])}</strong>. Static coefficients can be folded into one affine map; input-dependent coefficients require a different analysis.</FlowReadout></FlowLab>;
}

function ForecastResource({ children }) {
  const c = useContext(ForecastCase);
  if (c.error) return <><FlowReadout>{c.error}</FlowReadout><FlowControls><button type="button" onClick={c.retry}>Retry saved models</button></FlowControls></>;
  if (!c.models) return <FlowReadout>The three frozen model arrays load near this investigation. Your observations and controls remain editable while they load.</FlowReadout>;
  return children;
}
export function GqaForecastZone({ children }) {
  const c = useContext(ForecastCase), host = useRef(null);
  useEffect(() => {
    if (c.near) return undefined;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { c.setNear(true); observer.disconnect(); } }, { rootMargin: '700px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [c.near, c.setNear]);
  return <div ref={host}>{children}</div>;
}
export function GqaForecastInvestigation({ question = 'points' }) {
  const c = useContext(ForecastCase), current = c.results?.[c.branch];
  const future = groupedMovementPoints.slice(c.boundary, c.boundary + c.steps);
  return <FlowLab label={`Change the fitted forecast's ${question}`}>
    <GqaMovementDrawing points={c.points} boundary={c.boundary} predictions={current?.predictions} rollout={question === 'rollout' ? current?.rollout : []} targetPoints={future} selectedFrame={c.frame}/>
    <FlowControls>
      {question === 'points' && <><FlowSlider name="Observed frame to edit" value={c.frame} min={0} max={c.boundary - 1} step={1} onChange={c.setFrame}/>{[0, 1].map(coordinate => <FlowSlider key={coordinate} name={`Observed ${coordinate ? 'y' : 'x'}`} value={c.point[coordinate]} min={0} max={1} step={.01} onChange={value => c.edit(coordinate, value)}/>)}</>}
      {question === 'boundary' && <FlowSlider name="Number of supplied observations" value={c.boundary} min={2} max={40} step={1} onChange={c.setBoundary}/>}
      {question === 'shift' && <FlowSlider name="Common logical-ID shift for all Q/K" value={c.shift} min={0} max={128} step={1} onChange={c.setShift}/>}
      {question === 'rollout' && <FlowSlider name="Generated next points" value={c.steps} min={1} max={5} step={1} onChange={c.setSteps}/>}
      {question === 'reset' && <button type="button" onClick={c.reset}>Restore the original observed prefix</button>}
    </FlowControls>
    <ForecastResource><FlowReadout>The currently inspected <strong>{c.branch === 4 ? 'MHA' : c.branch === 2 ? 'GQA' : 'MQA'}</strong> model writes next point <strong>{gqaVector(current?.predictions.at(-1), 7)}</strong> from {c.boundary} observations. {question === 'points' && <>Predictions preceding the earliest edited observation differ by at most <strong>{number(current?.earlierError ?? 0, 10)}</strong> from the same model’s unedited prefix.</>} {question === 'shift' && 'Only the attached IDs shift; the observations, model weights and all relative Q/K offsets stay fixed.'} {question === 'rollout' && 'Amber future inputs are this model’s own preceding outputs. Grey reference points never enter that generated route.'} The compact cache shown elsewhere contains this observed prefix, not the later generated records.</FlowReadout></ForecastResource>
  </FlowLab>;
}
export function GqaForecastResults() {
  const c = useContext(ForecastCase);
  return <ForecastResource>{c.results && <><GqaArray label="All three saved models on this same edited observed prefix; payload counts declare FP32 K/V coordinates" values={[4, 2, 1].map(heads => {
    const result = c.results[heads];
    return [heads === 4 ? 'MHA' : heads === 2 ? 'GQA' : 'MQA', ...result.predictions.at(-1), 2 * heads * c.boundary * 6 * 4, result.cacheError, result.earlierError];
  })} columns={['model', 'next x', 'next y', 'KV bytes', 'max full/cached Δ', 'max pre-edit Δ']} digits={9}/><FlowReadout>Each branch evaluates the same current point edits, boundary and common IDs. These are frozen models, rather than three new training runs; the byte column excludes array headers, IDs, masks and the browser’s numeric representation.</FlowReadout></>}</ForecastResource>;
}
export function GqaForecastHeadInvestigation() {
  const c = useContext(ForecastCase), result = c.results?.[c.branch];
  const trace = useMemo(() => c.models && groupedForecastTrace(c.models[c.branch].weights, c.points, c.branch, c.head, c.shift, result), [c.models, c.branch, c.points, c.head, c.shift, result]);
  return <FlowLab label="Inspect a real model's selected query head">
    <ForecastResource>{trace && <GqaLearnedHeadDrawing trace={trace} head={c.head} kvHeads={c.branch} positions={result.cache.positions}/>}</ForecastResource>
    <FlowControls><Select label="Saved model and query head to inspect" value={c.inspection} onChange={c.setInspection} options={[4, 2, 1].flatMap(heads => [0, 1, 2, 3].map(head => [`${heads}:${head}`, `${heads === 4 ? 'MHA' : heads === 2 ? 'GQA' : 'MQA'}, query head ${head}`]))}/></FlowControls>
    <ForecastResource>{trace && <><FlowReadout>Query head <strong>{c.head}</strong> in the <strong>{c.branch}-KV-head model</strong> reads group <strong>{trace.group}</strong> at ID {result.cache.positions.at(-1)}. Its six-coordinate write is <strong>{gqaVector(trace.headOutputs[c.head])}</strong>; all its memory fields come from this current edited prefix.</FlowReadout><GqaArray label="Every stored record for this selected real head: its score, probability and all six weighted value coordinates" values={trace.keys.map((_, i) => [result.cache.positions[i], trace.scores[i], trace.probabilities[i], ...trace.contributions[i]])} columns={['logical ID', 'score / √6', 'matching mass', 'write 0', 'write 1', 'write 2', 'write 3', 'write 4', 'write 5']}/></>}</ForecastResource>
  </FlowLab>;
}
export function GqaForecastAnatomy() {
  const c = useContext(ForecastCase), result = c.results?.[c.branch];
  const trace = useMemo(() => c.models && groupedForecastTrace(c.models[c.branch].weights, c.points, c.branch, c.head, c.shift, result), [c.models, c.branch, c.points, c.head, c.shift, result]);
  const weights = c.models?.[c.branch].weights;
  return <ForecastResource>{trace && <><GqaLearnedBlockDrawing trace={trace} weights={weights} kvHeads={c.branch}/>
    <p>Follow the written updates through their actual learned maps below. The attention output map reads the concatenated 24-coordinate row; the first bypass adds its result to the saved stem. Each cutaway labels its omitted coordinates, and every displayed dot product uses the full underlying row.</p>
    <GqaLearnedAffineRouteDrawing name="Attention output" input={trace.concatenated} map={weights['output.weight']} bias={weights['output.bias']} output={trace.attentionUpdate}/>
    <p>The context after that first addition is normalized across all 24 features. The next learned map expands it to 48 coordinates; GELU changes those expanded coordinates individually. The down-map then writes a 24-coordinate update for the second bypass addition.</p>
    <GqaLearnedAffineRouteDrawing name="FFN expansion" input={trace.feedforwardInput} map={weights['feedforward.0.weight']} bias={weights['feedforward.0.bias']} output={trace.expanded}/>
    <GqaArray label="All 48 pre-activation coordinates and their actual GELU outputs" values={[trace.expanded, trace.activated]} rows={['expanded', 'after GELU']}/>
    <GqaLearnedAffineRouteDrawing name="FFN down-map" input={trace.activated} map={weights['feedforward.2.weight']} bias={weights['feedforward.2.bias']} output={trace.feedforwardUpdate}/>
    <p>Add the down-map’s write to the saved context, normalize that final 24-coordinate row, and let the task map make two transformed coordinates. The fixed inverse scaling (y+1)/2 returns them to the recording’s coordinate units; it does not clip them.</p>
    <GqaLearnedAffineRouteDrawing name="Forecast task" input={trace.finalNormalized} map={weights['forecast.weight']} bias={weights['forecast.bias']} output={trace.transformedPrediction}/>
    <GqaArray label="The complete last-row numerical path; widths omitted in the drawing are visible here" values={[
    ['stem', ...trace.stem.at(-1)], ['attention LN', ...trace.normalized.at(-1)], ['all head writes', ...trace.concatenated], ['attention update', ...trace.attentionUpdate], ['saved context', ...trace.context], ['FFN LN', ...trace.feedforwardInput], ['FFN update', ...trace.feedforwardUpdate], ['second residual', ...trace.final], ['final LN', ...trace.finalNormalized],
  ]} columns={['stage', ...Array.from({ length: 24 }, (_, i) => `feature ${i}`)]}/></>}</ForecastResource>;
}
