import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { initialKeys, initialValues, memoryRead, cancellationRead, localAttention,
  copyDistribution, encodeAttention, traceAttention, attentionTokens } from '../../data/recurrent-attention-models.js';
import { AttentionQueryPlane, AttentionDotDrawing, AttentionSoftmaxDrawing,
  AttentionValueDrawing, AttentionMaskDrawing, AttentionOutputDrawing, AttentionGradientDrawing,
  AttentionWindowDrawing, AttentionCopyDrawing, AttentionMonotonicDrawing } from './RecurrentAttentionDrawings.jsx';
import './recurrent-attention-flow.css';
import { temperatureRead, monotonicExpectation } from '../../data/recurrent-attention-flow-models.js';

const names = ['A', 'B', 'C'];
const vectorText = vector => `(${vector.map(value => flowNumber(value)).join(', ')})`;
const ConstructedContext = createContext(null);

export function AttentionConstruction({ children }) {
  const [query, setQuery] = useState([1, 0]);
  const [keys, setKeys] = useState(initialKeys.map(row => [...row]));
  const [values, setValues] = useState(initialValues.map(row => [...row]));
  const [valid, setValid] = useState([true, true, true]);
  const [rate, setRate] = useState(.1);
  const result = useMemo(() => memoryRead(query, keys, values, valid, rate), [query, keys, values, valid, rate]);
  const reset = () => {
    setQuery([1, 0]); setKeys(initialKeys.map(row => [...row]));
    setValues(initialValues.map(row => [...row])); setValid([true, true, true]); setRate(.1);
  };
  return <ConstructedContext.Provider value={{ query, setQuery, keys, setKeys, values,
    setValues, valid, setValid, rate, setRate, result, reset }}>{children}</ConstructedContext.Provider>;
}

export function AttentionQueryLab() {
  const { query, setQuery, keys, result, reset } = useContext(ConstructedContext);
  return <FlowLab id="attention-query" label="Change the two-coordinate query">
    <AttentionQueryPlane query={query} keys={keys} />
    <FlowControls>{query.map((value, axis) => <FlowSlider key={axis} name={`Query coordinate ${axis + 1}`}
      value={value} min={-2} max={2} step={.05} onChange={next => setQuery(current => current.map((old, index) => index === axis ? next : old))} />)}</FlowControls>
    <FlowReadout>The query is {vectorText(query)}; its scores against A, B and C are {vectorText(result.scores)}.</FlowReadout>
    <div className="attention-flow-actions"><button type="button" onClick={reset}>Reset constructed read</button></div>
  </FlowLab>;
}

export function AttentionKeyLab() {
  const { query, keys, setKeys, result } = useContext(ConstructedContext);
  const [selected, setSelected] = useState(1);
  return <FlowLab id="attention-keys" label="Change one key without changing its returned value">
    <AttentionDotDrawing query={query} keys={keys} />
    <FlowControls><FlowChoice label="Compared key" value={selected} onChange={setSelected}
      options={names.map((name, index) => [index, name])} />
      {keys[selected].map((value, axis) => <FlowSlider key={axis} name={`Key ${names[selected]} coordinate ${axis + 1}`}
        value={value} min={-2} max={2} step={.05} onChange={next => setKeys(current => current.map((row, index) => index === selected
          ? row.map((old, coordinate) => coordinate === axis ? next : old) : row))} />)}</FlowControls>
    <FlowReadout>Key {names[selected]} is {vectorText(keys[selected])}; the compared scores are {vectorText(result.scores)}. Returned values have not changed.</FlowReadout>
  </FlowLab>;
}

export function AttentionSharesFigure() {
  const { result, valid } = useContext(ConstructedContext);
  return <><AttentionSoftmaxDrawing scores={result.scores} valid={valid} />
    <FlowReadout>The current A/B/C shares are {vectorText(result.attention)} and sum to {flowNumber(result.attention.reduce((a, b) => a + b, 0))}.</FlowReadout></>;
}

export function AttentionValueLab() {
  const { values, setValues, result } = useContext(ConstructedContext);
  const [selected, setSelected] = useState(1);
  return <FlowLab id="attention-values" label="Change what a selected memory returns">
    <AttentionValueDrawing values={values} attention={result.attention} />
    <FlowControls><FlowChoice label="Returned value" value={selected} onChange={setSelected} options={names.map((name, index) => [index, name])} />
      {values[selected].map((value, axis) => <FlowSlider key={axis} name={`Value ${names[selected]} coordinate ${axis + 1}`}
        value={value} min={-3} max={3} step={.05} onChange={next => setValues(current => current.map((row, index) => index === selected
          ? row.map((old, coordinate) => coordinate === axis ? next : old) : row))} />)}</FlowControls>
    <FlowReadout>Value {names[selected]} is {vectorText(values[selected])}; its share remains {flowNumber(result.attention[selected])}, and the returned context is {vectorText(result.context)}.</FlowReadout>
    <NeuralTable caption="The same shares act on both value coordinates" headers={['Memory', 'Value', 'Share', 'Contribution']}
      rows={values.map((row, index) => [names[index], vectorText(row), flowNumber(result.attention[index]), vectorText(row.map(value => value * result.attention[index]))])} />
  </FlowLab>;
}

export function AttentionMaskLab() {
  const [admitted, setAdmitted] = useState(false);
  return <FlowLab id="attention-storage-mask" label="Exclude padding before normalization">
    <AttentionMaskDrawing admitted={admitted} />
    <FlowControls><label className="attention-flow-toggle"><input type="checkbox" checked={admitted}
      onChange={event => setAdmitted(event.target.checked)} />Admit PAD as an observation</label></FlowControls>
    <FlowReadout>The real values remain 2 and 4. {admitted ? 'PAD receives one third of the mass, reducing the read from 3 to 2.' : 'PAD receives zero mass; the read is 3.'}</FlowReadout>
  </FlowLab>;
}

export function AttentionValidityLab() {
  const { valid, setValid, result, values } = useContext(ConstructedContext);
  return <FlowLab id="attention-valid-memories" label="Mask one of the constructed memories">
    <AttentionSoftmaxDrawing scores={result.scores} valid={valid} />
    <FlowControls>{names.map((name, index) => <label key={name} className="attention-flow-toggle">
      <input type="checkbox" checked={valid[index]} disabled={valid[index] && valid.filter(Boolean).length === 1}
        onChange={event => setValid(current => current.map((old, position) => position === index ? event.target.checked : old))} />Allow {name}</label>)}</FlowControls>
    <FlowReadout>The allowed memories return {vectorText(result.context)}. {names.filter((_, index) => !valid[index]).join(', ') || 'No memory'} is excluded;
      an excluded value contributes zero even if its coordinates change. At least one memory must remain allowed.</FlowReadout>
    <AttentionValueDrawing values={values} attention={result.attention} />
  </FlowLab>;
}

export function AttentionLearningFigure() {
  const { result } = useContext(ConstructedContext);
  return <AttentionGradientDrawing result={result} />;
}

export function AttentionLearningLab({ update = false, diagram = true }) {
  const { result, rate, setRate } = useContext(ConstructedContext);
  return <FlowLab id={update ? 'attention-query-update' : 'attention-loss-path'} label={update ? 'Take one differentiable query update' : 'Follow output loss back to the read'}>
    {diagram && (update ? <AttentionGradientDrawing result={result} /> : <AttentionOutputDrawing context={result.context} />)}
    {update && <FlowControls><FlowSlider name="Query learning rate" value={rate} min={0} max={2} step={.01} onChange={setRate} /></FlowControls>}
    <FlowReadout>{update ? <>One step proposes q = {vectorText(result.nextQuery)}; recomputing the entire read changes loss from {flowNumber(result.loss)} to {flowNumber(result.nextLoss)}.</>
      : <>Class 2 has probability {flowNumber(result.probabilities[1])}; its negative log probability is loss {flowNumber(result.loss)}.</>}</FlowReadout>
  </FlowLab>;
}

export function AttentionCancellationFlow() {
  const [query, setQuery] = useState(0);
  const linear = cancellationRead(query), nonlinear = cancellationRead(query, true);
  return <FlowLab id="attention-query-cancellation" label="Compare a query-independent scorer with a nonlinear scorer">
    <NeuralTable caption="Same keys; the question changes while both score rules remain fixed" headers={['Key', 'Linear score', 'Linear share', 'Nonlinear score', 'Nonlinear share']}
      rows={[-.7, .1, 1.3].map((key, index) => [key, flowNumber(linear.scores[index]), flowNumber(linear.attention[index]), flowNumber(nonlinear.scores[index]), flowNumber(nonlinear.attention[index])])} />
    <FlowControls><FlowSlider name="Shared scalar query" min={-2} max={2} step={.05} value={query} onChange={setQuery} /></FlowControls>
    <FlowReadout>At query {flowNumber(query)}, the linear shares remain {vectorText(linear.attention)}; bending each sum through tanh gives {vectorText(nonlinear.attention)}.</FlowReadout>
  </FlowLab>;
}

export function AttentionWindowFlow() {
  const [center, setCenter] = useState(3), [radius, setRadius] = useState(2);
  const [renormalize, setRenormalize] = useState(false), [scores, setScores] = useState([0, .5, 1, -.5, 2]);
  const [selected, setSelected] = useState(4);
  const result = localAttention(center, radius, renormalize, scores);
  return <>
    <FlowLab id="attention-window" label="Change local donor eligibility and distance">
      <AttentionWindowDrawing result={result} center={center} radius={radius} />
      <FlowControls><FlowSlider name="Window center" value={center} min={1} max={5} step={.05} onChange={setCenter} />
        <FlowSlider name="Window radius" value={radius} min={1} max={3} step={.05} onChange={setRadius} />
        <label className="attention-flow-toggle"><input type="checkbox" checked={renormalize} onChange={event => setRenormalize(event.target.checked)} />Normalize the product again</label></FlowControls>
      <FlowReadout>The final weight mass is {flowNumber(result.sum, 8)} and the read is {flowNumber(result.context, 8)}. {renormalize ? 'Second normalization produces a convex average.' : 'The Gaussian product retains its reduced magnitude.'}</FlowReadout>
    </FlowLab>
    <p>Now change one comparison score while keeping returned values equal to position numbers 1–5. A score outside the current window cannot affect this read.</p>
    <FlowLab id="attention-window-score" label="Edit one local score">
      <NeuralTable caption="Eligibility and multiplication remain separate operations" headers={['Position / value', 'Score', 'Allowed', 'Softmax', 'Gaussian', 'Final weight']}
        rows={result.positions.map((position, index) => [position, flowNumber(scores[index]), result.valid[index] ? 'yes' : 'no', flowNumber(result.base[index]), flowNumber(result.gaussian[index]), flowNumber(result.weights[index])])} />
      <FlowControls><FlowSlider name="Selected source position" value={selected + 1} min={1} max={5} step={1} onChange={value => setSelected(value - 1)} />
        <FlowSlider name={`Score at position ${selected + 1}`} value={scores[selected]} min={-3} max={3} step={.05}
          onChange={value => setScores(current => current.map((old, index) => index === selected ? value : old))} /></FlowControls>
      <FlowReadout>Position {selected + 1} {result.valid[selected] ? 'is eligible' : 'is excluded'}; its score is {flowNumber(scores[selected])}. The current read is {flowNumber(result.context, 8)}.</FlowReadout>
      <div className="attention-flow-actions"><button type="button" onClick={() => { setCenter(3); setRadius(2); setRenormalize(false); setScores([0, .5, 1, -.5, 2]); setSelected(4); }}>Reset local read</button></div>
    </FlowLab>
  </>;
}

export function AttentionCopyFlowLab() {
  const [generate, setGenerate] = useState(.4);
  const output = copyDistribution(['Ada', 'met', 'Ada'], [.2, .3, .5], { Ada: .1, met: .6, left: .3 }, generate);
  return <FlowLab id="attention-copy" label="Mix vocabulary generation with grouped source copying">
    <AttentionCopyDrawing output={output} pGenerate={generate} />
    <FlowControls><FlowSlider name="Vocabulary-route probability" value={generate} min={0} max={1} step={.01} onChange={setGenerate} /></FlowControls>
    <FlowReadout>The mixture returns {output.map(item => `${item.word} ${flowNumber(item.probability)}`).join(', ')}. Both Ada occurrences contribute to the same word.</FlowReadout>
  </FlowLab>;
}

export function AttentionMonotonicFlow() {
  const [probability, setProbability] = useState(.5);
  return <FlowLab id="attention-monotonic" label="Follow choose-or-continue probability mass">
    <AttentionMonotonicDrawing probabilities={[probability, probability, probability]} />
    <FlowControls><FlowSlider name="Choose probability at each visited position" value={probability} min={0} max={1} step={.05} onChange={setProbability} /></FlowControls>
    <FlowReadout>One scan chooses positions 0/1/2 with masses {vectorText([probability, (1 - probability) * probability, (1 - probability) ** 2 * probability])};
      remaining mass {flowNumber((1 - probability) ** 3)} selects nothing and returns the zero vector. This displays an expectation over stochastic scans, not a threshold decision.</FlowReadout>
  </FlowLab>;
}

export function AttentionTemperatureFlow() {
  const [temperature, setTemperature] = useState(1);
  const result = temperatureRead(temperature);
  return <FlowLab id="attention-temperature" label="Change competition sharpness with positive temperature">
    <figure data-figure="attention-temperature-read">
      <svg className="attention-flow-drawing" viewBox="0 0 360 238" style={{ aspectRatio: '360 / 238' }} role="img" aria-label="Two source values have scores zero and log three. Temperature changes their normalized shares, then the same shares multiply values two and ten.">
        {[2, 10].map((value, index) => <g key={value}>
          <text x={90 + 180 * index} y="25" textAnchor="middle" fill="#77c8da">value {value}</text>
          <text x={90 + 180 * index} y="57" textAnchor="middle" fill="#bc9ce7">score {flowNumber(result.scores[index])}</text>
          <rect x={55 + 180 * index} y={163 - 80 * result.weights[index]} width="70" height={80 * result.weights[index]} fill="#bc9ce7" />
          <text x={90 + 180 * index} y="190" textAnchor="middle" fill="#bc9ce7">share {flowNumber(result.weights[index])}</text>
        </g>)}
        <text x="180" y="230" textAnchor="middle" fill="#eee">read = {flowNumber(result.context)}</text>
      </svg>
      <figcaption>Bar height is the normalized share on a 0–1 scale; both scores are divided by the same positive temperature before softmax.</figcaption>
    </figure>
    <FlowControls><FlowSlider name="Positive scoring temperature" value={temperature} min={.25} max={4} step={.05} onChange={setTemperature} /></FlowControls>
    <FlowReadout>Temperature {flowNumber(temperature)} returns {flowNumber(result.context)} from the same values 2 and 10; it changes competition, not which memories are legal.</FlowReadout>
  </FlowLab>;
}

export function AttentionMonotonicExpectedFigure() {
  const previous = [.5, .25, .125];
  const result = monotonicExpectation([.5, .5, .5], previous);
  return <NeuralTable caption="A second expected scan can remain at an earlier chosen position" headers={['Position', 'Previous choice mass', 'Reach from previous position plus scan', 'New choice mass']}
    rows={previous.map((value, index) => [index, value, flowNumber(result.chosen[index] / .5), flowNumber(result.chosen[index])])} />;
}

const FittedContext = createContext(null);
const modelRequests = new Map();
function loadModel(kind) {
  if (!modelRequests.has(kind)) {
    const request = fetch(`/learn-code/attention-mechanism-bahdanau-luong/${kind}-seed-one.json`)
      .then(response => { if (!response.ok) throw new Error(`Model request failed (${response.status}).`); return response.json(); })
      .catch(error => { modelRequests.delete(kind); throw error; });
    modelRequests.set(kind, request);
  }
  return modelRequests.get(kind);
}

export function AttentionFittedConstruction({ children }) {
  const [sentinel, ready] = useLessonViewport();
  const [kind, setKind] = useState('additive'), [resource, setResource] = useState({ kind: '', data: null, error: '' });
  const [attempt, setAttempt] = useState(0), [lemma, setLemma] = useState('cash'), [feature, setFeature] = useState('past');
  const [prefix, setPrefix] = useState(''), [cap, setCap] = useState(16), [step, setStep] = useState(0), [coordinate, setCoordinate] = useState(0);
  const [padding, setPadding] = useState(0), [admitted, setAdmitted] = useState([false, false]);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setResource({ kind, data: null, error: '' });
    loadModel(kind).then(data => { if (current) setResource({ kind, data, error: '' }); })
      .catch(error => { if (current) setResource({ kind, data: null, error: error.message }); });
    return () => { current = false; };
  }, [kind, ready, attempt]);
  const weights = resource.kind === kind ? resource.data?.weights : null;
  const validSource = /^[a-z]{3,8}$/.test(lemma);
  const encoded = useMemo(() => weights && validSource ? encodeAttention(weights, lemma, feature) : null, [weights, lemma, feature, validSource]);
  const trace = useMemo(() => encoded ? traceAttention(weights, kind, encoded, { prefix, padding, admitted, cap }) : null,
    [weights, kind, encoded, prefix, padding, admitted, cap]);
  const baseline = useMemo(() => weights ? traceAttention(weights, kind, encodeAttention(weights, 'cash', 'past')) : null, [weights, kind]);
  const correctlyMasked = useMemo(() => encoded ? traceAttention(weights, kind, encoded, { prefix, padding, admitted: [false, false], cap }) : null,
    [weights, kind, encoded, prefix, padding, cap]);
  const index = trace ? Math.min(step, trace.rows.length - 1) : 0;
  const row = trace?.rows[index];
  const reset = () => { setLemma('cash'); setFeature('past'); setPrefix(''); setCap(16); setStep(0); setCoordinate(0); setPadding(0); setAdmitted([false, false]); };
  return <FittedContext.Provider value={{ kind, setKind, lemma, setLemma, feature, setFeature, prefix, setPrefix,
    cap, setCap, step: index, setStep, coordinate, setCoordinate, padding, setPadding, admitted, setAdmitted,
    trace, row, baseline, correctlyMasked, reset }}>
    <div ref={sentinel} />
    {resource.error ? <div className="attention-flow-actions"><p role="alert">{resource.error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry model</button></div>
      : !weights && ready ? <p role="status">Loading the selected model…</p> : null}
    {!validSource && <p role="status">Use 3–8 lowercase letters for a source spelling.</p>}
    {children}
  </FittedContext.Provider>;
}

function FittedDrawing({ trace, row, step, coordinate }) {
  if (!trace || !row) return null;
  return <figure data-figure="attention-fitted-read">
    <div className="attention-flow-heatmap" tabIndex={0} role="region" aria-label="Source attention by output step; scroll for all source columns"
      style={{ '--source-count': trace.sourceIds.length }}>
      <span />{trace.sourceIds.map((id, index) => <span className="attention-flow-source-label" key={index}>{attentionTokens[id]}</span>)}
      {trace.rows.map((read, index) => <div className="attention-flow-heatmap-row" key={index}>
        <span>{index + 1}: {attentionTokens[read.emittedToken]}</span>
        {read.attention.map((value, column) => <span key={column} title={`Output step ${index + 1}, source ${column}, share ${value}`}
          className={index === step ? 'is-selected' : ''}
          style={{ background: `rgba(188,156,231,${value})` }}>{flowNumber(value, 2)}</span>)}
      </div>)}
    </div>
    <figcaption>Rows are emitted output steps; columns are source positions. Violet brightness is source share 0–1;
      the white outline selects the current row. The row is normalized over allowed source positions, including source EOS.</figcaption>
    <div className="attention-flow-coordinate-grids">
      {[['query', row.query], ['context', row.context], ['new state', row.state]].map(([label, vector]) => <div key={label}>
        <p>{label}: all 64 coordinates</p><div className="attention-flow-coordinate-grid">
          {vector.map((value, index) => <span key={index} className={index === coordinate ? 'is-selected' : ''}
            title={`${label} coordinate ${index}: ${value}`}>{flowNumber(value, 2)}</span>)}
        </div>
        <p>Coordinate {coordinate}: {flowNumber(vector[coordinate], 8)}</p>
      </div>)}
    </div>
  </figure>;
}

function FittedSequenceDrawing({ trace, prefix }) {
  if (!trace) return null;
  return <figure data-figure="attention-fitted-token-path">
    <p className="attention-flow-strip-label">Source tokens: encoder inputs</p>
    <ol className="attention-flow-token-strip is-input">{trace.sourceIds.map((id, index) => <li key={index}>
      <span>{attentionTokens[id]}</span><small>position {index}</small></li>)}</ol>
    <p className="attention-flow-strip-label">Emissions: one writing step at a time</p>
    <ol className="attention-flow-token-strip">{trace.rows.map((row, index) => <li key={index}
      className={index < prefix.length ? 'is-selected' : ''}>
      <span>{attentionTokens[row.emittedToken]}</span><small>step {index + 1}</small></li>)}</ol>
    <figcaption>The timelines have independent lengths. White outlines identify forced prefix emissions;
      violet tokens otherwise come from the current model’s largest output probability.</figcaption>
  </figure>;
}

function FittedPaddingDrawing({ trace, row, masked }) {
  if (!trace || !row || !masked) return null;
  return <figure data-figure="attention-fitted-padding-shares">
    <div className="attention-flow-padding-bars">
      {row.attention.map((value, index) => <div key={index}>
        <span>{index}: {attentionTokens[trace.sourceIds[index]]}</span>
        <div><span style={{ width: `${100 * masked.attention[index]}%`, background: '#999' }} /></div>
        <div><span style={{ width: `${100 * value}%`, background: '#bc9ce7' }} /></div>
        <span>{flowNumber(masked.attention[index], 6)} → {flowNumber(value, 6)}</span>
      </div>)}
    </div>
    <figcaption>Each complete bar is share 1. Gray is the same source/prefix/cap with correct masking;
      violet is the current admitted-slot computation. Zero-valued storage can change both proportions and context.</figcaption>
  </figure>;
}

export function AttentionFittedFlow({ question = 'source' }) {
  const state = useContext(FittedContext);
  const { trace, row, step, coordinate, baseline, correctlyMasked } = state;
  const original = baseline?.rows[step], masked = correctlyMasked?.rows[step];
  return <FlowLab id={`attention-fitted-${question}`} label={`Investigate fitted ${question}`}>
    {question === 'trace' ? <FittedDrawing trace={trace} row={row} step={step} coordinate={coordinate} />
      : question === 'padding' ? <FittedPaddingDrawing trace={trace} row={row} masked={masked} />
        : <FittedSequenceDrawing trace={trace} prefix={state.prefix} />}
    <FlowControls>
      {question === 'source' && <><label className="attention-flow-field">Source spelling<input value={state.lemma} maxLength={8}
        onChange={event => state.setLemma(event.target.value.toLowerCase().replace(/[^a-z]/g, ''))} /></label>
        <label className="attention-flow-field">Requested form<select value={state.feature} onChange={event => state.setFeature(event.target.value)}>
          <option value="past">past</option><option value="participle">participle</option><option value="third_person">third person</option></select></label>
        <label className="attention-flow-field">Frozen architecture<select value={state.kind} onChange={event => { state.setKind(event.target.value); state.setStep(0); }}>
          <option value="additive">additive / read before</option><option value="general">general / read after</option></select></label></>}
      {question === 'trace' && <><FlowSlider name="Output step" value={step + 1} min={1} max={trace?.rows.length || 1} step={1} onChange={value => state.setStep(value - 1)} />
        <FlowSlider name="Feature coordinate" value={coordinate} min={0} max={63} step={1} onChange={state.setCoordinate} /></>}
      {question === 'prefix' && <label className="attention-flow-field">Forced output prefix<input value={state.prefix} maxLength={8}
        onChange={event => state.setPrefix(event.target.value.toLowerCase().replace(/[^a-z]/g, ''))} /></label>}
      {question === 'cap' && <FlowSlider name="Maximum emitted tokens, including EOS" value={state.cap} min={1} max={16} step={1} onChange={state.setCap} />}
      {question === 'padding' && <><FlowSlider name="Appended PAD storage slots" value={state.padding} min={0} max={2} step={1} onChange={state.setPadding} />
        {state.admitted.map((value, index) => <label key={index} className="attention-flow-toggle"><input type="checkbox" checked={value}
          disabled={index >= state.padding} onChange={event => state.setAdmitted(current => current.map((old, position) => position === index ? event.target.checked : old))} />Admit PAD {index + 1}</label>)}</>}
    </FlowControls>
    <FlowReadout>{trace && row ? <>Current output is “{trace.prediction}”; {trace.ended ? 'EOS was emitted' : 'the cap was reached before EOS'}.
      Step {step + 1} reads after previous token {attentionTokens[row.previous]} and emits {attentionTokens[row.emittedToken]}.
      {question === 'padding' && <> PAD mass is {flowNumber(row.attention.slice(trace.sourceIds.length - state.padding).reduce((a, b) => a + b, 0), 8)};
        {masked ? <>maximum output-probability change against this same source, prefix and cap with correct masking is {flowNumber(Math.max(...row.probabilities.map((value, index) => Math.abs(value - masked.probabilities[index]))), 8)}.</> : <>Correctly masked generation ended before this step; there is no paired output distribution.</>}</>}
    </> : 'The current valid source and selected model are needed to calculate this read.'}</FlowReadout>
    {row && question === 'trace' && <>
      <NeuralTable caption="Every source donor, at the selected real decoder step" headers={['Position / token', 'Valid', 'Score', 'Share', `Memory[${coordinate}]`, 'Contribution']}
        rows={trace.sourceIds.map((id, index) => [`${index}: ${attentionTokens[id]}`, trace.valid[index] ? 'yes' : 'no', Number.isFinite(row.scores[index]) ? flowNumber(row.scores[index], 8) : 'excluded (−∞)', flowNumber(row.attention[index], 8), flowNumber(trace.memory[index][coordinate], 8), flowNumber(row.attention[index] * trace.memory[index][coordinate], 8)])} />
      <NeuralTable caption="Output probabilities versus the original cash + past reference in this architecture" headers={['Output', 'Current', 'Original', 'Difference']}
        rows={attentionTokens.map((token, index) => [token, flowNumber(row.probabilities[index], 8), original ? flowNumber(original.probabilities[index], 8) : 'original ended', original ? flowNumber(row.probabilities[index] - original.probabilities[index], 8) : '—'])} />
    </>}
    {question === 'source' && <div className="attention-flow-actions"><button type="button" onClick={state.reset}>Reset fitted source and investigations</button></div>}
  </FlowLab>;
}
