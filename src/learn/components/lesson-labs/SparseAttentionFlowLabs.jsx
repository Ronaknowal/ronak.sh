import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, FlowSlider, flowNumber as number } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { blockOccupancy, causalEdges, featureMemory, graphReach, memoryDefaults, projectedRead, randomFeatureRead, sparseRead } from '../../data/sparse-attention-models.js';
import { sparseForecastTrace, sparseQuotientGradient, sparseFeatureMemory } from '../../data/sparse-attention-reading-traces.js';
import examples from '../../data/sparse-attention-examples.json';
import { SparseDeletionDrawing, SparseLayerDrawing, SparsePermissionDrawing, SparseTilesDrawing, SparseProjectionDrawing, SparseRandomFeatureDrawing, SparseWeightedValuesDrawing, SparseOuterProductDrawing, SparseMemoryReadDrawing, sparseVector } from './SparseAttentionFlowFigures.jsx';
import { SparseForecastDrawing, SparseNetworkDrawing, SparseAffineDrawing, SparseHeadDrawing, SparseNormalizationDrawing, SparseGeluDrawing, SparseQuotientDrawing, SparseTrialsDrawing, SparseBudgetDrawing } from './SparseAttentionSystemsFigures.jsx';
import './sparse-attention-flow.css';

const Cases = createContext(null);
const clone = value => structuredClone(value);
const readInitial = () => ({ scores: [0, Math.log(3), Math.log(2), Math.log(4)], values: [[-2, 1], [1, 2], [3, -1], [0, 4]], legal: [true, false, true, true], selected: 1, offset: 0 });
const graphInitial = () => ({ length: 10, window: 2, hub: -1, source: 1, target: 9, layers: 2, mask: causalEdges(10, 2), receiver: 9, donor: 1 });
const memoryInitial = () => ({ ...clone(memoryDefaults), selected: 2, prefix: 3 });
const randomInitial = () => ({ query: clone(examples.random_features_fresh.query_scaled), keys: clone(examples.random_features_fresh.key_scaled), values: clone(examples.random_features_fresh.value), features: 8, selected: 1, receiver: 3, seed: 5 });
const projectionInitial = () => ({ values: [4, -2, 3, 8], coefficients: [.25, .5, 0, .25], selected: 3, position: 1 });
const tilesInitial = () => ({ size: 2, receiver: 0, source: 0, mask: Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, column) => row < 4 ? column === row % 2 : column === 4 + row % 2)) });
const forecastInitial = () => ({ points: clone(examples.sourcePoints), length: 27, selected: 19, head: 0, mode: 'dense' });
const initializers = { read: readInitial, graph: graphInitial, memory: memoryInitial, random: randomInitial, projection: projectionInitial, tiles: tilesInitial, forecast: forecastInitial };
const CaseContexts = Object.fromEntries(Object.keys(initializers).map(name => [name, createContext(null)]));
const editCell = (rows, row, column, value) => rows.map((entry, i) => i === row ? entry.map((old, j) => j === column ? value : old) : entry);
const recordOptions = (length, noun = 'Source record') => Array.from({ length }, (_, record) => [record, `${noun} ${record}`]);

function validateWeights(document) {
  const shapes = {
    'stem.weight': [24, 2], 'stem.bias': [24], 'qkv.weight': [72, 24], 'output.weight': [24, 24],
    'norm_attention.weight': [24], 'norm_attention.bias': [24],
    'norm_feedforward.weight': [24], 'norm_feedforward.bias': [24],
    'feedforward.0.weight': [48, 24], 'feedforward.0.bias': [48],
    'feedforward.2.weight': [24, 48], 'feedforward.2.bias': [24],
    'norm_final.weight': [24], 'norm_final.bias': [24], 'forecast.weight': [2, 24], 'forecast.bias': [2],
  };
  const matches = (value, shape) => shape.length === 0 ? typeof value === 'number' && Number.isFinite(value)
    : Array.isArray(value) && value.length === shape[0] && value.every(entry => matches(entry, shape.slice(1)));
  if (!document?.weights || Object.entries(shapes).some(([name, shape]) => !matches(document.weights[name], shape))) {
    throw new Error('Saved model has an invalid weight field or shape.');
  }
  return document;
}

export function SparseCaseProvider({ children }) {
  const [read, setRead] = useState(readInitial), [graph, setGraph] = useState(graphInitial);
  const [memory, setMemory] = useState(memoryInitial), [random, setRandom] = useState(randomInitial);
  const [projection, setProjection] = useState(projectionInitial), [tiles, setTiles] = useState(tilesInitial);
  const [forecast, setForecast] = useState(forecastInitial), [pinnedRead, setPinnedRead] = useState(readInitial);
  const [pinnedMemory, setPinnedMemory] = useState(memoryInitial);
  const [resetTokens, setResetTokens] = useState({ read: 0, graph: 0, memory: 0, random: 0, projection: 0, tiles: 0, forecast: 0 });
  const [models, setModels] = useState(null), [modelsRequested, setModelsRequested] = useState(false);
  const [modelError, setModelError] = useState(''), [modelAttempt, setModelAttempt] = useState(0);
  const requestModels = useCallback(() => setModelsRequested(true), []);
  const retryModels = useCallback(() => { setModelError(''); setModelAttempt(old => old + 1); }, []);
  useEffect(() => {
    if (!modelsRequested) return undefined;
    const controller = new AbortController();
    Promise.all(['dense', 'window', 'kernel'].map(async mode => {
      const response = await fetch(`/learn-assets/sparse-linear-attention-variants/${mode}-forecast.json`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Saved model returned ${response.status}.`);
      const text = await response.text();
      if (!text.trimStart().startsWith('{')) throw new Error('Saved model response is not JSON.');
      return [mode, validateWeights(JSON.parse(text))];
    })).then(entries => { if (!controller.signal.aborted) { setModels(Object.fromEntries(entries)); setModelError(''); } })
      .catch(error => { if (error.name !== 'AbortError') setModelError('The saved weights could not be loaded. Your edited coordinates are retained; retry to evaluate them.'); });
    return () => controller.abort();
  }, [modelsRequested, modelAttempt]);
  const currentForecasts = useMemo(() => models ? Object.fromEntries(Object.entries(models).map(([mode, document]) =>
    [mode, sparseForecastTrace(document.weights, forecast.points.slice(0, forecast.length), mode)])) : null, [models, forecast.points, forecast.length]);
  const originalForecasts = useMemo(() => models ? Object.fromEntries(Object.entries(models).map(([mode, document]) =>
    [mode, sparseForecastTrace(document.weights, examples.sourcePoints.slice(0, forecast.length), mode)])) : null, [models, forecast.length]);
  const setters = { read: setRead, graph: setGraph, memory: setMemory, random: setRandom, projection: setProjection, tiles: setTiles, forecast: setForecast };
  const reset = useCallback(name => {
    setters[name](initializers[name]());
    if (name === 'read') setPinnedRead(readInitial());
    if (name === 'memory') setPinnedMemory(memoryInitial());
    setResetTokens(old => ({ ...old, [name]: old[name] + 1 }));
  }, []);
  const value = { read, setRead, graph, setGraph, memory, setMemory, random, setRandom, projection, setProjection,
    tiles, setTiles, forecast, setForecast, pinnedRead, setPinnedRead, pinnedMemory, setPinnedMemory, resetTokens, reset,
    models, modelError, modelsRequested, requestModels, currentForecasts, originalForecasts, retryModels };
  // Each operator's questions share one case, while unrelated operators do not
  // rerender for its edits. The optional complete context remains an API fallback.
  const scoped = {
    read: useMemo(() => ({ read, setRead, pinnedRead, setPinnedRead, reset, resetTokens: { read: resetTokens.read } }), [read, pinnedRead, resetTokens.read, reset]),
    graph: useMemo(() => ({ graph, setGraph, reset, resetTokens: { graph: resetTokens.graph } }), [graph, resetTokens.graph, reset]),
    memory: useMemo(() => ({ memory, setMemory, pinnedMemory, setPinnedMemory, reset, resetTokens: { memory: resetTokens.memory } }), [memory, pinnedMemory, resetTokens.memory, reset]),
    random: useMemo(() => ({ random, setRandom, reset, resetTokens: { random: resetTokens.random } }), [random, resetTokens.random, reset]),
    projection: useMemo(() => ({ projection, setProjection, reset, resetTokens: { projection: resetTokens.projection } }), [projection, resetTokens.projection, reset]),
    tiles: useMemo(() => ({ tiles, setTiles, reset, resetTokens: { tiles: resetTokens.tiles } }), [tiles, resetTokens.tiles, reset]),
    forecast: useMemo(() => ({ forecast, setForecast, reset, resetTokens: { forecast: resetTokens.forecast }, models, modelError, modelsRequested, requestModels, currentForecasts, originalForecasts, retryModels }),
      [forecast, resetTokens.forecast, models, modelError, modelsRequested, requestModels, currentForecasts, originalForecasts, retryModels, reset]),
  };
  const content = Object.entries(CaseContexts).reduceRight((nested, [name, Context]) => <Context.Provider value={scoped[name]}>{nested}</Context.Provider>, children);
  return <Cases.Provider value={value}>{content}</Cases.Provider>;
}

export function useSparseCase(name) {
  const state = useContext(name ? CaseContexts[name] : Cases);
  if (!state) throw new Error('Sparse attention questions require the shared case provider.');
  return state;
}

export function SparseSelection({ name, value, onChange, options }) {
  const id = useId();
  return <label className="sparse-flow-field" htmlFor={id}><span>{name}</span>
    <select id={id} aria-label={name} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  </label>;
}

export function SparseNumber({ name, value, onChange, min, max, integer = false, caseName }) {
  const { resetTokens } = useSparseCase(caseName), id = useId();
  const [draft, setDraft] = useState(String(value)), [error, setError] = useState('');
  const resetToken = resetTokens[caseName];
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, resetToken]);
  const edit = text => {
    setDraft(text);
    const parsed = Number(text);
    if (text.trim() === '' || !Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
      setError(`Use ${integer ? 'an integer' : 'a finite number'} from ${min} to ${max}. The current calculation still uses ${number(value)}.`);
      return;
    }
    onChange(parsed);
    setError('');
  };
  return <label className="sparse-flow-field" htmlFor={id}><span>{name}</span>
    <input id={id} type="number" aria-label={name} min={min} max={max} step={integer ? 1 : 'any'}
      value={draft} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={event => edit(event.target.value)}/>
    {error && <span id={`${id}-error`} role="status">{error}</span>}
  </label>;
}

export function SparseToggle({ name, value, onChange, disabled = false }) {
  const id = useId();
  return <label className="sparse-flow-toggle" htmlFor={id}>
    <input id={id} type="checkbox" aria-label={name} checked={value} disabled={disabled} onChange={event => onChange(event.target.checked)}/>{name}
  </label>;
}

export function SparseReadInvestigation({ question = 'support' }) {
  const { read, setRead, pinnedRead, setPinnedRead, reset } = useSparseCase('read');
  const [coordinate, setCoordinate] = useState(0);
  const selected = read.selected, scores = read.scores.map(value => value + read.offset);
  const result = sparseRead(scores, read.values, read.legal);
  const pinned = sparseRead(pinnedRead.scores.map(value => value + pinnedRead.offset), pinnedRead.values, pinnedRead.legal);
  return <FlowLab id={`sparse-read-${question}`} label={`Selected-record read: ${question}; same shared case`}>
    <SparseDeletionDrawing scores={scores} values={read.values} legal={read.legal}/>
    <FlowControls>
      {question !== 'offset' && <SparseSelection name="Source record" value={selected} onChange={value => setRead(old => ({ ...old, selected: Number(value) }))} options={recordOptions(read.scores.length)}/>}
      {question === 'support' && <SparseToggle name="Retain this source" value={read.legal[selected]} onChange={value => setRead(old => ({ ...old, legal: old.legal.map((entry, record) => record === selected ? value : entry) }))}/>}
      {question === 'score' && <SparseNumber name="Selected finite score" value={read.scores[selected]} min={-10} max={1010} caseName="read" onChange={value => setRead(old => ({ ...old, scores: old.scores.map((entry, record) => record === selected ? value : entry) }))}/>}
      {question === 'message' && <>
        <SparseSelection name="Message coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))} options={[[0, 'Coordinate 0'], [1, 'Coordinate 1']]}/>
        <FlowSlider name="Signed message value" value={read.values[selected][coordinate]} min={-8} max={8} step={.05} onChange={value => setRead(old => ({ ...old, values: editCell(old.values, selected, coordinate, value) }))}/>
      </>}
      {question === 'offset' && <>
        <FlowSlider name="Common score shift" value={read.offset} min={0} max={1000} step={1} onChange={value => setRead(old => ({ ...old, offset: value }))}/>
        <button type="button" onClick={() => setPinnedRead(clone(read))}>Pin this read</button>
        <button type="button" onClick={() => reset('read')}>Reset read</button>
      </>}
    </FlowControls>
    <FlowReadout>Full answer {sparseVector(result.dense)}; removed full share {number(result.removedMass, 6)}. {result.output
      ? <>The retained answer is <strong>{sparseVector(result.output)}</strong>; the pinned answer is {sparseVector(pinned.output)}.</>
      : <strong>No retained source remains, so the normalized answer is undefined.</strong>}
      {question === 'offset' && ' One shared score shift cancels from every normalized weight; it does not change which sources are retained.'}
    </FlowReadout>
  </FlowLab>;
}

export function SparseReadConstantQuestion() {
  const { read, setRead } = useSparseCase('read');
  const result = sparseRead(read.scores.map(value => value + read.offset), read.values, read.legal);
  return <FlowLab id="sparse-read-constant" label="A common message removes output sensitivity to reweighting">
    <SparseDeletionDrawing scores={read.scores.map(value => value + read.offset)} values={read.values} legal={read.legal}/>
    <FlowControls><button type="button" onClick={() => setRead(old => ({ ...old, values: old.values.map(() => [2, -1]) }))}>Use the same message [2, −1] at every source</button></FlowControls>
    <FlowReadout>{result.output ? <>The current full answer is {sparseVector(result.dense)} and retained answer {sparseVector(result.output)}. After every message is equal, changed shares cannot change their average.</> : 'An empty support still has no answer, even when all messages are equal.'}</FlowReadout>
  </FlowLab>;
}

export function SparseGraphInvestigation({ question = 'window' }) {
  const { graph, setGraph, reset } = useSparseCase('graph');
  const result = graphReach(graph.mask, graph.source, graph.layers);
  const pattern = (length, window, hub) => setGraph(old => ({ ...old, length, window, hub,
    mask: causalEdges(length, window, hub), source: Math.min(old.source, length - 1), target: Math.min(old.target, length - 1),
    receiver: Math.min(old.receiver, length - 1), donor: Math.min(old.donor, length - 1) }));
  return <FlowLab id={`sparse-graph-${question}`} label={`Communication through successive layers: ${question}; same shared graph`}>
    {question === 'edge' ? <SparsePermissionDrawing mask={graph.mask} receiver={graph.receiver} source={graph.donor}/>
      : <SparseLayerDrawing mask={graph.mask} source={graph.source} target={graph.target} layers={graph.layers}/>}
    <FlowControls>
      {question === 'window' && <>
        <SparseNumber name="Positions" value={graph.length} min={4} max={16} integer caseName="graph" onChange={value => pattern(value, graph.window, graph.hub < value ? graph.hub : -1)}/>
        <SparseNumber name="Total window keys, including self" value={graph.window} min={1} max={8} integer caseName="graph" onChange={value => pattern(graph.length, value, graph.hub)}/>
        <button type="button" onClick={() => reset('graph')}>Reset graph</button>
      </>}
      {question === 'hub' && <SparseSelection name="Causal hub" value={graph.hub} onChange={value => pattern(graph.length, graph.window, Number(value))} options={[[-1, 'No hub'], ...recordOptions(graph.length, 'Position')]}/>}
      {question === 'path' && <>
        <SparseSelection name="Input source" value={graph.source} onChange={value => setGraph(old => ({ ...old, source: Number(value) }))} options={recordOptions(graph.length, 'Position')}/>
        <SparseSelection name="Output receiver" value={graph.target} onChange={value => setGraph(old => ({ ...old, target: Number(value) }))} options={recordOptions(graph.length, 'Position')}/>
        <SparseNumber name="Successive layers" value={graph.layers} min={1} max={4} integer caseName="graph" onChange={value => setGraph(old => ({ ...old, layers: value }))}/>
      </>}
      {question === 'edge' && <>
        <SparseSelection name="Receiving position" value={graph.receiver} onChange={value => setGraph(old => ({ ...old, receiver: Number(value) }))} options={recordOptions(graph.length, 'Position')}/>
        <SparseSelection name="Source position" value={graph.donor} onChange={value => setGraph(old => ({ ...old, donor: Number(value) }))} options={recordOptions(graph.length, 'Position')}/>
        <SparseToggle name={graph.donor > graph.receiver ? 'Future source is forbidden' : 'Allow this causal edge'} value={graph.mask[graph.receiver][graph.donor]} disabled={graph.donor > graph.receiver}
          onChange={value => { if (graph.donor <= graph.receiver) setGraph(old => ({ ...old, mask: editCell(old.mask, old.receiver, old.donor, value) })); }}/>
      </>}
    </FlowControls>
    <FlowReadout>{result.edges} explicit attention edges. {result.paths[graph.target] ? <>A possible route is <strong>{result.paths[graph.target].join(' → ')}</strong>.</> : <>There is no {graph.layers}-layer route from {graph.source} to {graph.target}.</>}
      {' '}A drawn route permits dependence; it does not certify a useful learned message. {['window', 'hub'].includes(question) && 'Changing this pattern rebuilds its edges and discards individual edge edits.'}
      {question === 'edge' && graph.donor > graph.receiver && 'A future edge cannot be enabled; choose a source at or before the receiver.'}
    </FlowReadout>
  </FlowLab>;
}

export function SparseMemoryInvestigation({ question = 'query' }) {
  const { memory, setMemory, pinnedMemory, setPinnedMemory, reset } = useSparseCase('memory');
  const selected = memory.selected, keys = memory.keys.slice(0, memory.prefix), values = memory.values.slice(0, memory.prefix);
  const result = sparseFeatureMemory(memory.query, keys, values);
  const pinned = sparseFeatureMemory(pinnedMemory.query, pinnedMemory.keys.slice(0, pinnedMemory.prefix), pinnedMemory.values.slice(0, pinnedMemory.prefix));
  const changeCoordinate = (kind, coordinate, value) => setMemory(old => ({ ...old, [kind]: kind === 'query'
    ? old.query.map((entry, index) => index === coordinate ? value : entry)
    : editCell(old[kind], old.selected, coordinate, value) }));
  if (['keys', 'values'].includes(question) && memory.keys.length === 0) return <FlowLab id={`sparse-memory-${question}`} label={`The same feature memory: ${question}`}>
    <SparseMemoryReadDrawing query={memory.query} keys={[]} values={[]}/>
    <FlowReadout>No source records remain to edit. Append an included source in the prefix investigation, or restore the original three-record case here.</FlowReadout>
    <FlowControls><button type="button" onClick={() => reset('memory')}>Reset memory</button></FlowControls>
  </FlowLab>;
  return <FlowLab id={`sparse-memory-${question}`} label={`The same feature memory: ${question}`}>
    {['keys', 'values'].includes(question)
      ? <SparseOuterProductDrawing keyFeatures={memory.keys[selected]} value={memory.values[selected]} record={selected}/>
      : <SparseMemoryReadDrawing query={memory.query} keys={keys} values={values} selected={memory.prefix - 1}/>}
    <FlowControls>
      {question === 'query' && [0, 1].map(coordinate => <FlowSlider key={coordinate} name={`Query feature ${coordinate}`} value={memory.query[coordinate]} min={0} max={8} step={.05} onChange={value => changeCoordinate('query', coordinate, value)}/>)}
      {['keys', 'values'].includes(question) && <>
        <SparseSelection name="Memory source record" value={selected} onChange={value => setMemory(old => ({ ...old, selected: Number(value) }))} options={recordOptions(memory.keys.length)}/>
        {[0, 1].map(coordinate => <FlowSlider key={coordinate} name={`${question === 'keys' ? 'Key feature' : 'Message coordinate'} ${coordinate}`} value={memory[question][selected][coordinate]}
          min={question === 'keys' ? 0 : -8} max={8} step={.05} onChange={value => changeCoordinate(question, coordinate, value)}/>)}
      </>}
      {question === 'chronology' && <>
        <SparseNumber name="Included prefix records" value={memory.prefix} min={0} max={memory.keys.length} integer caseName="memory" onChange={value => setMemory(old => ({ ...old, prefix: value }))}/>
        <button type="button" disabled={memory.keys.length >= 8} onClick={() => setMemory(old => ({ ...old,
          keys: [...old.keys.slice(0, old.prefix), [1, 1], ...old.keys.slice(old.prefix)],
          values: [...old.values.slice(0, old.prefix), [0, 0], ...old.values.slice(old.prefix)],
          selected: old.prefix, prefix: old.prefix + 1 }))}>Append included source</button>
        <button type="button" disabled={memory.prefix === 0} onClick={() => setMemory(old => ({ ...old, keys: old.keys.slice(1), values: old.values.slice(1), selected: Math.max(0, old.selected - 1), prefix: old.prefix - 1 }))}>Evict oldest included source</button>
      </>}
      {question === 'compare' && <>
        <button type="button" onClick={() => setPinnedMemory(clone(memory))}>Pin this prefix and query</button>
        <button type="button" onClick={() => setMemory(old => ({ ...old, values: old.values.map(() => [2, -2]) }))}>Set all messages [2, −2]</button>
        <button type="button" onClick={() => reset('memory')}>Reset memory</button>
      </>}
    </FlowControls>
    <FlowReadout>Included records: {memory.prefix}; denominator {number(result.denominator)}. {result.output
      ? <>Current read <strong>{sparseVector(result.output)}</strong>; pinned read {sparseVector(pinned.output)}.</>
      : <strong>There is no positive overlap, so this normalized read is undefined.</strong>}
      {question === 'query' && 'Editing only the query leaves the accumulated matrix and key sum unchanged.'}
      {['keys', 'values'].includes(question) && selected >= memory.prefix && ` Source ${selected} is outside this prefix, so its edit does not change the current read.`}
      {question === 'chronology' && 'The available records after the prefix remain excluded. Append inserts exactly one new included write at the prefix boundary; eviction removes only the oldest included write.'}
    </FlowReadout>
  </FlowLab>;
}

export function SparseMemoryRecords() {
  const { memory } = useSparseCase('memory');
  return <NeuralTable caption="Actual records shared by all feature-memory questions" headers={['Source', 'Key features', 'Message', 'Included now?']}
    rows={memory.keys.map((key, record) => [record, sparseVector(key), sparseVector(memory.values[record]), record < memory.prefix ? 'yes' : 'no'])}/>;
}

export function SparseTileInvestigation({ question = 'edge' }) {
  const { tiles, setTiles, reset } = useSparseCase('tiles');
  const count = blockOccupancy(tiles.mask, tiles.size);
  return <FlowLab id={`sparse-tiles-${question}`} label={`Selected connections and occupied hardware blocks: ${question}; same layout`}>
    <SparseTilesDrawing mask={tiles.mask} size={tiles.size} receiver={tiles.receiver} source={tiles.source}/>
    <FlowControls>
      {question === 'edge' && <>
        <SparseSelection name="Receiving row" value={tiles.receiver} onChange={value => setTiles(old => ({ ...old, receiver: Number(value) }))} options={recordOptions(8, 'Receiver')}/>
        <SparseSelection name="Source column" value={tiles.source} onChange={value => setTiles(old => ({ ...old, source: Number(value) }))} options={recordOptions(8)}/>
        <SparseToggle name="Keep this connection" value={tiles.mask[tiles.receiver][tiles.source]} onChange={value => setTiles(old => ({ ...old, mask: editCell(old.mask, old.receiver, old.source, value) }))}/>
      </>}
      {question === 'size' && <SparseSelection name="Block width" value={tiles.size} onChange={value => setTiles(old => ({ ...old, size: Number(value) }))} options={[1, 2, 4, 8].map(value => [value, `${value} cells per side`])}/>}
      {question === 'layout' && <>
        <button type="button" onClick={() => setTiles(old => ({ ...old, mask: Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, column) => column === 3 * row % 8)) }))}>Disperse eight connections</button>
        <button type="button" onClick={() => setTiles(old => ({ ...old, mask: Array.from({ length: 8 }, () => Array(8).fill(false)) }))}>Remove every connection</button>
        <button type="button" onClick={() => reset('tiles')}>Restore the clustered layout</button>
      </>}
    </FlowControls>
    <FlowReadout>{count.edges} selected connections occupy <strong>{count.occupied} blocks</strong>, so their blocks contain {count.candidates} candidate cells.
      {' '}These are exact layout counts, not a measured speed ratio. This noncausal layout exercise counts work; it does not normalize an attention read.
    </FlowReadout>
  </FlowLab>;
}

export function SparseProjectionInvestigation({ question = 'message' }) {
  const { projection, setProjection, reset } = useSparseCase('projection');
  const result = projectedRead(projection.values, projection.coefficients, projection.position);
  return <FlowLab id={`sparse-projection-${question}`} label={`Length summary: ${question}; same coefficients and messages`}>
    <SparseProjectionDrawing values={projection.values} coefficients={projection.coefficients} position={projection.position}/>
    <FlowControls>
      {['message', 'coefficient'].includes(question) && <SparseSelection name="Summary source record" value={projection.selected}
        onChange={value => setProjection(old => ({ ...old, selected: Number(value) }))} options={recordOptions(projection.values.length)}/>}
      {question === 'message' && <FlowSlider name="Signed source message" value={projection.values[projection.selected]} min={-10} max={10} step={.1}
        onChange={value => setProjection(old => ({ ...old, values: old.values.map((entry, record) => record === old.selected ? value : entry) }))}/>}
      {question === 'coefficient' && <FlowSlider name="Summary coefficient" value={projection.coefficients[projection.selected]} min={-2} max={2} step={.05}
        onChange={value => setProjection(old => ({ ...old, coefficients: old.coefficients.map((entry, record) => record === old.selected ? value : entry) }))}/>}
      {question === 'prefix' && <SparseSelection name="Query position" value={projection.position}
        onChange={value => setProjection(old => ({ ...old, position: Number(value) }))} options={recordOptions(projection.values.length, 'Position')}/>}
      {question === 'length' && <>
        <button type="button" disabled={projection.values.length >= 6} onClick={() => setProjection(old => ({ ...old, values: [...old.values, 0], coefficients: [...old.coefficients, .25], selected: old.values.length }))}>Append source</button>
        <button type="button" disabled={projection.values.length <= 3} onClick={() => setProjection(old => ({ ...old, values: old.values.slice(0, -1), coefficients: old.coefficients.slice(0, -1), selected: Math.min(old.selected, old.values.length - 2), position: Math.min(old.position, old.values.length - 2) }))}>Remove last source</button>
        <button type="button" onClick={() => reset('projection')}>Reset summary</button>
      </>}
    </FlowControls>
    <FlowReadout>The full summary returns <strong>{number(result.full)}</strong>; the separately constructed prefix through {projection.position} returns {number(result.prefix)}.
      {' '}A source after that query can change the full result when its coefficient is nonzero. Zeroing its coefficient removes that particular route; it does not establish a general causal length-projection model.
    </FlowReadout>
  </FlowLab>;
}

export function SparseRandomInvestigation({ question = 'approximation' }) {
  const { random, setRandom, reset } = useSparseCase('random');
  const [coordinate, setCoordinate] = useState(0);
  const result = randomFeatureRead(random.query, random.keys, random.values, examples.random_features_fresh.projections.slice(0, random.features));
  const kind = question === 'query' ? 'query' : question === 'key' ? 'keys' : 'values';
  const shownReceiver = question === 'query' ? random.selected : random.receiver;
  return <FlowLab id={`sparse-random-${question}`} label={`Fixed sampled-feature case: ${question}`}>
    {['message', 'constant'].includes(question)
      ? <SparseWeightedValuesDrawing values={random.values} weights={result.weights[shownReceiver]} receiver={shownReceiver}/>
      : <SparseRandomFeatureDrawing input={random} features={random.features} receiver={shownReceiver} source={random.selected}/>}
    <FlowControls>
      {['query', 'key', 'message'].includes(question) && <>
        <SparseSelection name={`${question === 'query' ? 'Query' : 'Source'} record`} value={random.selected} onChange={value => setRandom(old => ({ ...old, selected: Number(value) }))} options={recordOptions(4, 'Position')}/>
        <SparseSelection name="Coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))} options={[[0, 'Coordinate 0'], [1, 'Coordinate 1']]}/>
        <FlowSlider name={`${question === 'message' ? 'Message' : 'Scaled vector'} value`} value={random[kind][random.selected][coordinate]}
          min={question === 'message' ? -3 : -2} max={question === 'message' ? 3 : 2} step={.05} onChange={value => setRandom(old => ({ ...old, [kind]: editCell(old[kind], old.selected, coordinate, value) }))}/>
      </>}
      {question === 'approximation' && <>
        <SparseSelection name="Fixed sampled features" value={random.features} onChange={value => setRandom(old => ({ ...old, features: Number(value) }))} options={[8, 16, 32, 64].map(value => [value, `${value} features`])}/>
        <SparseSelection name="Receiving query" value={random.receiver} onChange={value => setRandom(old => ({ ...old, receiver: Number(value) }))} options={recordOptions(4, 'Position')}/>
      </>}
      {question === 'constant' && <>
        <button type="button" onClick={() => setRandom(old => ({ ...old, values: old.values.map(() => [2, -1]) }))}>Set every message [2, −1]</button>
        <button type="button" onClick={() => reset('random')}>Reset this sampled case</button>
      </>}
    </FlowControls>
    <FlowReadout>Query {shownReceiver} returns exact softmax {sparseVector(result.exact[shownReceiver])} and sampled read <strong>{sparseVector(result.output[shownReceiver])}</strong>.
      {' '}Whole-output relative error is {result.relativeError === null ? 'undefined for zero reference norm or overlap' : number(result.relativeError, 8)}.
      {' '}These questions retain the same edited inputs and the same fixed nested projection rows; adding features does not redraw earlier samples.
    </FlowReadout>
  </FlowLab>;
}

export function SparseRandomOutputs() {
  const { random } = useSparseCase('random');
  const result = randomFeatureRead(random.query, random.keys, random.values, examples.random_features_fresh.projections.slice(0, random.features));
  return <NeuralTable caption="All current causal outputs for this one sampled case" headers={['Receiver', 'Exact softmax', 'Sampled features']}
    rows={result.output.map((output, receiver) => [receiver, sparseVector(result.exact[receiver]), sparseVector(output)])}/>;
}

export function SparseForecastInvestigation({ question = 'prefix' }) {
  const { forecast, setForecast, reset, currentForecasts, originalForecasts, requestModels, modelsRequested, modelError, retryModels } = useSparseCase('forecast');
  const region = useRef(null);
  useEffect(() => {
    if (question !== 'prefix' || !region.current) return undefined;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { requestModels(); observer.disconnect(); } }, { rootMargin: '350px' });
    observer.observe(region.current);
    return () => observer.disconnect();
  }, [question, requestModels]);
  const points = forecast.points.slice(0, forecast.length);
  const changed = points.some((point, record) => point.some((value, coordinate) => value !== examples.sourcePoints[record][coordinate]));
  const predictions = currentForecasts ? Object.fromEntries(Object.entries(currentForecasts).map(([mode, trace]) => [mode, trace.forecast])) : null;
  const original = originalForecasts ? Object.fromEntries(Object.entries(originalForecasts).map(([mode, trace]) => [mode, trace.forecast])) : null;
  const controls = <FlowControls>
    {question === 'prefix' && <SparseNumber name="Visible input records" value={forecast.length} min={8} max={44} integer caseName="forecast" onChange={value => setForecast(old => ({ ...old, length: value, selected: Math.min(old.selected, value - 1) }))}/>}
    {question === 'point' && <>
      <SparseSelection name="Edited input record" value={forecast.selected} onChange={value => setForecast(old => ({ ...old, selected: Number(value) }))} options={recordOptions(forecast.length, 'Position')}/>
      {[0, 1].map(coordinate => <FlowSlider key={coordinate} name={`${coordinate === 0 ? 'x' : 'y'} coordinate`} value={forecast.points[forecast.selected][coordinate]} min={0} max={1} step={.001}
        onChange={value => setForecast(old => ({ ...old, points: editCell(old.points, old.selected, coordinate, value) }))}/>)}
    </>}
    {question === 'reflect' && <>
      <button type="button" onClick={() => setForecast(old => ({ ...old, points: editCell(old.points, old.selected, 1, 1 - old.points[old.selected][1]) }))}>Reflect selected y</button>
      <button type="button" onClick={() => setForecast(old => ({ ...old, selected: old.length - 2, points: editCell(old.points, old.length - 2, 1, 1 - old.points[old.length - 2][1]) }))}>Reflect y inside the final window</button>
      <button type="button" onClick={() => setForecast(old => ({ ...old, points: clone(examples.sourcePoints) }))}>Restore original coordinates</button>
    </>}
    {question === 'reset' && <button type="button" onClick={() => reset('forecast')}>Reset prefix and coordinates</button>}
  </FlowControls>;
  return <div ref={region}><FlowLab id={`sparse-forecast-${question}`} label={`Three frozen networks evaluate the same edited prefix: ${question}`}>
    <SparseForecastDrawing points={points} predictions={predictions} original={original} selected={forecast.selected} target={changed ? null : examples.sourcePoints[forecast.length]}/>
    {controls}
    {question === 'prefix' && !currentForecasts && <>
      <FlowReadout>{modelError || (modelsRequested ? 'Loading the three saved networks; coordinate edits remain available.' : 'The input path is ready; saved weights load when this investigation approaches the viewport.')}</FlowReadout>
      {modelError && <FlowControls><button type="button" onClick={retryModels}>Retry saved networks</button></FlowControls>}
    </>}
    <FlowReadout>{currentForecasts ? <>
      Dense returns <strong>{sparseVector(predictions.dense, 6)}</strong>; five-record window {sparseVector(predictions.window, 6)}; positive-feature kernel {sparseVector(predictions.kernel, 6)}.
      {' '}{changed ? 'This edited path is hypothetical: no true next point is assigned.' : `The original next point is ${sparseVector(examples.sourcePoints[forecast.length], 6)}.`}
      {' '}Only records {Math.max(0, forecast.length - 5)}–{forecast.length - 1} directly feed the final window read. Every displayed forecast uses this same current prefix.
    </> : 'The current input prefix is visible above. Computed forecasts appear when the actual weights are available.'}</FlowReadout>
  </FlowLab></div>;
}

export function SparseForecastComparison() {
  const { currentForecasts, originalForecasts } = useSparseCase('forecast');
  if (!currentForecasts) return null;
  const points = Object.fromEntries(Object.entries(currentForecasts).map(([mode, trace]) => [mode, trace.forecast]));
  const original = Object.fromEntries(Object.entries(originalForecasts).map(([mode, trace]) => [mode, trace.forecast]));
  return <>
    <SparseForecastDrawing points={[]} predictions={points} original={original} zoom/>
    <NeuralTable caption="All three networks, the same current prefix, original-coordinate units" headers={['Operator', 'Original', 'Current', 'Current − original', 'Float32 payload bytes']}
      rows={Object.entries(currentForecasts).map(([mode, trace]) => [mode, sparseVector(original[mode], 6), sparseVector(trace.forecast, 6), sparseVector(trace.forecast.map((value, i) => value - original[mode][i]), 8), trace.payloadBytes])}/>
    <p>Payload counts only retained keys/values or feature state and normalizer. It excludes weights, positions, activations, temporary work and allocator overhead.</p>
  </>;
}

export function SparseForecastHeadInvestigation() {
  const { forecast, setForecast, currentForecasts } = useSparseCase('forecast');
  if (!currentForecasts) return null;
  const trace = currentForecasts[forecast.mode], receiver = forecast.length - 1;
  return <FlowLab id="sparse-forecast-head" label="Inspect the actual head of the same current edited prefix">
    <SparseHeadDrawing trace={trace} head={forecast.head} receiver={receiver}/>
    <FlowControls>
      <SparseSelection name="Network to inspect" value={forecast.mode} onChange={mode => setForecast(old => ({ ...old, mode }))} options={['dense', 'window', 'kernel'].map(mode => [mode, mode])}/>
      <SparseSelection name="Head to inspect" value={forecast.head} onChange={head => setForecast(old => ({ ...old, head: Number(head) }))} options={[0, 1, 2].map(head => [head, `Head ${head}`])}/>
    </FlowControls>
    <FlowReadout>This is <strong>{forecast.mode}, head {forecast.head}, receiving record {receiver}</strong>, using the coordinates retained across the preceding questions.
      {' '}Its eight returned coordinates are {sparseVector(trace.headOutputs[forecast.head][receiver])}. {forecast.mode === 'kernel' && 'Pair weights are reconstructed from the positive-feature read; they are not softmax probabilities.'}
    </FlowReadout>
  </FlowLab>;
}

export function SparseFittedRoute({ stage = 'network' }) {
  const { forecast, currentForecasts } = useSparseCase('forecast');
  if (!currentForecasts) return null;
  const trace = currentForecasts[forecast.mode];
  if (stage === 'network') return <SparseNetworkDrawing trace={trace}/>;
  if (stage === 'gelu') return <SparseGeluDrawing trace={trace}/>;
  if (stage.startsWith('norm-')) return <SparseNormalizationDrawing trace={trace} stage={stage.slice(5)}/>;
  return <SparseAffineDrawing trace={trace} stage={stage}/>;
}

export function SparseGradientInvestigation() {
  const { memory, resetTokens } = useSparseCase('memory');
  const [upstream, setUpstream] = useState([1, -.5]);
  useEffect(() => setUpstream([1, -.5]), [resetTokens.memory]);
  const keys = memory.keys.slice(0, memory.prefix), values = memory.values.slice(0, memory.prefix);
  const trace = sparseQuotientGradient(memory.query, keys, values, upstream);
  return <FlowLab id="sparse-memory-gradient" label="Trace both quotient-credit routes in the same edited feature memory">
    <SparseQuotientDrawing query={memory.query} keys={keys} values={values} upstream={upstream}/>
    <FlowControls>{upstream.map((value, coordinate) => <FlowSlider key={coordinate} name={`Output credit g coordinate ${coordinate}`} value={value} min={-2} max={2} step={.05}
      onChange={value => setUpstream(old => old.map((entry, index) => index === coordinate ? value : entry))}/>)}</FlowControls>
    <FlowReadout>{trace.defined ? <>Both read routes give query credit <strong>{sparseVector(trace.queryGradient)}</strong>.
      {' '}These derivatives are with respect to the supplied feature-coordinate query, keys and values; changing the output credit does not change the forward memory.
    </> : <strong>The same edited memory has no positive query overlap. Its normalized output and derivatives are undefined; restore positive overlap in the earlier memory questions.</strong>}</FlowReadout>
  </FlowLab>;
}

export function SparseRecordedStudy() {
  const [seed,setSeed]=useState(5),trials=examples.trials.filter(trial=>trial.seed===seed);
  const changes=trials.slice(1).map((trial,index)=>trial.relative_output_l2_error-trials[index].relative_output_l2_error);
  return <FlowLab id="sparse-recorded-study" label="Inspect the retained eight-seed study without resampling or altering the live edited case">
    <SparseTrialsDrawing seed={seed}/>
    <FlowControls><SparseSelection name="Recorded seed to inspect" value={seed} onChange={value=>setSeed(Number(value))} options={Array.from({length:8},(_,seed)=>[seed,`Seed ${seed}`])}/></FlowControls>
    <FlowReadout>Seed {seed} has complete-output relative errors <strong>{trials.map(trial=>number(trial.relative_output_l2_error,8)).join(', ')}</strong> at 16, 64 and 256 features.
      {' '}{changes.some(change=>change>0)?'At least one increase in feature count made this particular fixed draw worse.':'This seed improves at both recorded increases; that is not a guarantee for another draw.'}
      {' '}The recorded dense-model head and inputs stay fixed; these results do not re-evaluate your edited four-record case.
    </FlowReadout>
    <NeuralTable caption="All 24 retained trials: the same trained head and prefix, eight seeds" headers={['Seed','Features','Relative output L₂ error']} rows={examples.trials.map(trial=>[trial.seed,trial.features,number(trial.relative_output_l2_error,8)])}/>
  </FlowLab>;
}

export function SparseBudgetInvestigation() {
  const [length,setLength]=useState(1024),[window,setWindow]=useState(5),[features,setFeatures]=useState(8);
  return <FlowLab id="sparse-budget" label="Change analytic length, window and feature-width budgets after learning their distinct representations">
    <SparseBudgetDrawing length={length} window={window} features={features}/>
    <FlowControls>
      <FlowSlider name="Analytic prefix length L" value={length} min={8} max={8192} step={1} onChange={setLength}/>
      <FlowSlider name="Total window records W" value={window} min={1} max={128} step={1} onChange={setWindow}/>
      <FlowSlider name="Feature width m" value={features} min={2} max={128} step={1} onChange={setFeatures}/>
    </FlowControls>
    <FlowReadout>With three heads and eight key/value coordinates per head, individual dense state grows with <strong>{length} records</strong>;
      {' '}the window retains {Math.min(length,window)} records; feature state retains {features} feature rows.
      {' '}Changing m changes that operator's capacity and work, so smaller memory alone does not establish comparable accuracy.
    </FlowReadout>
  </FlowLab>;
}
