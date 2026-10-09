import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { OdeSelect, OdeNumber, OdeFixtureActions } from './NeuralOdeFlowLabs.jsx';
import { OdeArray, OdeMatrix, OdeOperation, OdeWire, OdeCoordinates, odeFlowRoles } from './NeuralOdeFlowFigures.jsx';
import { odeClassifier } from '../../data/neural-ode-models.js';
import { fieldEvaluation, validateOdeModels } from '../../data/neural-ode-flow-models.js';
import { odeStudy } from '../../data/neural-ode-study.js';

const base = '/learn-assets/neural-ode-continuous-depth-models/';
const StudyContext = createContext(null);
const kinds = [['linear', 'Linear readout'], ['residual', 'Four separate residual fields'],
  ['neural_ode', 'Shared neural field'], ['augmented_ode', 'Shared field plus two coordinates']];
const source = id => odeStudy.sources.find(row => row.id === id);
const defaultCase = () => ({ kind: 'neural_ode', seed: 37, sourceId: 70,
  raw: [...source(70).features], method: 'rk4', intervals: 4, endpoint: 1,
  selected: 0, probe: 0, horizontal: 0, vertical: 1, hidden: 0, rate: 0, readout: 0 });
const clone = value => JSON.parse(JSON.stringify(value));

export function OdeStudyContext({ children }) {
  const [fixture, setFixture] = useState(defaultCase);
  const [pinned, setPinned] = useState(null);
  const [epoch, setEpoch] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [models, setModels] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setFailed(false);
    fetch(base + 'fitted-models.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Saved weights unavailable.');
      const data = await response.json();
      if (!validateOdeModels(data)) {
        throw new Error('Saved weight identity or dimensions are invalid.');
      }
      return data;
    }).then(data => { if (!controller.signal.aborted) setModels(data); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [enabled, attempt]);
  const snapshot = models?.find(model => model.kind === fixture.kind && model.seed === fixture.seed);
  const result = useMemo(() => snapshot ? odeClassifier(snapshot, fixture.raw, odeStudy.metadata,
    fixture.intervals, fixture.method, fixture.endpoint) : null, [snapshot, fixture]);
  const original = useMemo(() => snapshot ? odeClassifier(snapshot, source(fixture.sourceId).features,
    odeStudy.metadata, fixture.intervals, fixture.method, fixture.endpoint) : null, [snapshot, fixture]);
  const pinSnapshot = models?.find(model => model.kind === pinned?.kind && model.seed === pinned?.seed);
  const pinnedResult = useMemo(() => pinSnapshot ? odeClassifier(pinSnapshot, pinned.raw, odeStudy.metadata,
    pinned.intervals, pinned.method, pinned.endpoint) : null, [pinSnapshot, pinned]);
  const change = update => {
    setFixture(old => typeof update === 'function' ? update(old) : { ...old, ...update });
    setError('');
  };
  const reset = () => { setFixture(defaultCase()); setEpoch(value => value + 1); setError(''); };
  const restore = () => { if (pinned) { setFixture(clone(pinned)); setEpoch(value => value + 1); setError(''); } };
  return <StudyContext.Provider value={{ fixture, change, snapshot, result, original, pinnedResult,
    models, pinned, error, resetEpoch: epoch, reject: setError, reset, restore,
    pin: () => setPinned(clone(fixture)), enable: () => setEnabled(true), enabled,
    failed, retry: () => setAttempt(value => value + 1) }}>{children}</StudyContext.Provider>;
}

function StudyView({ label, children }) {
  const context = useContext(StudyContext);
  const element = useRef(null);
  useEffect(() => {
    if (context.enabled) return undefined;
    if (!('IntersectionObserver' in window)) { context.enable(); return undefined; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { context.enable(); observer.disconnect(); }
    }, { rootMargin: '220px' });
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, [context.enabled]);
  return <div ref={element} className="ode-flow-study-view">
    {context.failed ? <p role="alert">The saved model could not be loaded. Your current raw measurements and selections are retained.
      {' '}<button type="button" className="ode-flow-retry" onClick={context.retry}>Retry saved models</button></p>
      : context.result ? <FlowLab label={label}>{children(context)}</FlowLab>
        : <p role="status">{context.enabled ? 'Loading the twelve saved small models; no fitting is performed in your browser.' : 'Saved weights load as this part of the explanation approaches the viewport.'}</p>}
  </div>;
}

function ProbabilityDrawing({ context }) {
  const { result, original, fixture, pinnedResult } = context;
  return <figure aria-label="Three separate class probabilities from the current, original and pinned saved-model computations; categorical classes are not connected by a curve.">
    <div className="ode-flow-matrix-scroll" tabIndex={0} aria-label="All class probabilities and logits">
      <table className="ode-flow-matrix"><caption>Same weights and solve: current edited input versus original source {fixture.sourceId}</caption>
        <thead><tr>{['species', 'original P', 'current logit', 'current P', 'difference'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{odeStudy.metadata.classes.map((name, index) => <tr key={name}>
          <th scope="row">{name}</th><td>{number(original.probabilities[index], 9)}</td><td>{number(result.logits[index], 9)}</td>
          <td>{number(result.probabilities[index], 9)}</td><td>{number(result.probabilities[index] - original.probabilities[index], 9)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {pinnedResult && <p>Pinned full-case probabilities: {pinnedResult.probabilities.map(value => number(value, 9)).join(', ')}.
      The pinned model and solver may differ; it is a named whole-case comparison.</p>}
  </figure>;
}

export function OdeStudyModelLab() {
  return <StudyView label="Choose a saved model, declared seed and validation measurement">{context => <>
    <ProbabilityDrawing context={context} />
    <FlowControls><OdeSelect label="Saved architecture" value={context.fixture.kind}
      onChange={kind => context.change({ kind })} options={kinds} />
      <OdeSelect label="Declared fit seed" value={context.fixture.seed}
        onChange={seed => context.change({ seed: Number(seed) })} options={[13, 37, 61].map(seed => [seed, `seed ${seed}`])} />
      <OdeSelect label="Validation source row" value={context.fixture.sourceId} onChange={id => {
        const row = source(Number(id));
        context.change({ sourceId: row.id, raw: [...row.features] });
      }} options={odeStudy.sources.map(row => [row.id, `row ${row.id}: ${row.species}`])} />
    </FlowControls>
    <FlowReadout>The {context.snapshot.kind} seed {context.snapshot.seed} uses its saved validation-selected update
      {' '}{context.snapshot.selected_step}. Model or seed changes preserve all four edited raw measurements.
      {' '}Changing source adopts that row's original measurements; hypothetical edits have no new established species label.</FlowReadout>
    <OdeFixtureActions context={context} name="saved-classifier" />
  </>}</StudyView>;
}

export function OdeWorkedStudyDrawing() {
  return <StudyView label="Follow the actual worked source64 through the fixed seed37 neural field">{context => {
    const row = source(64);
    const snapshot = context.models.find(model => model.kind === 'neural_ode' && model.seed === 37);
    const result = odeClassifier(snapshot, row.features, odeStudy.metadata, 4, 'rk4', 1);
    const edited = odeClassifier(snapshot, row.features.map((value, index) => index === 2 ? value + .6 : value), odeStudy.metadata, 4, 'rk4', 1);
    return <figure aria-label="The named fixed worked source64, separate from the editable source70 case, passes through complete standardization, full hidden state and readout.">
      <OdeArray values={row.features} names={odeStudy.metadata.columns.map(name => `${name} cm`)} role="input" />
      <OdeWire /><OdeArray values={odeStudy.metadata.mean} names={odeStudy.metadata.columns.map(name => `${name} fit μ`)} role="parameter" />
      <OdeArray values={odeStudy.metadata.scale} names={odeStudy.metadata.columns.map(name => `${name} fit σ`)} role="parameter" />
      <OdeWire /><OdeOperation name="(raw − fit μ) / fit σ" />
      <OdeArray values={result.standardized} names={result.standardized.map((_, index) => `initial z${index + 1}`)} />
      <OdeWire /><OdeOperation name="same saved 4D field, four RK4 intervals">16 field evaluations with their actual clock inputs</OdeOperation>
      <OdeArray values={result.endpoint} names={result.endpoint.map((_, index) => `final z${index + 1}`)} />
      <OdeWire /><OdeOperation name="saved Wz + b → softmax" />
      <OdeArray values={result.logits} names={odeStudy.metadata.classes.map(name => `${name} logit`)} />
      <OdeArray values={result.probabilities} names={odeStudy.metadata.classes.map(name => `${name} probability`)} />
      <p>Changing only source64 petal length by +0.6 cm gives probabilities
        {' '}{edited.probabilities.map(value => number(value, 9)).join(', ')}. This fixed worked example does not change the editable source70 case.</p>
    </figure>;
  }}</StudyView>;
}

export function OdeStudyFeatureLab() {
  const [coordinate, setCoordinate] = useState(2);
  return <StudyView label="Edit one raw flower measurement with every fitted weight fixed">{context => <>
    <OdeArray values={context.fixture.raw} names={odeStudy.metadata.columns.map(name => `${name} (cm)`)} role="input" />
    <OdeWire /><OdeOperation name="(raw − fit μ) / fit σ">fit-only standardization for every coordinate</OdeOperation>
    <OdeArray values={context.result.standardized} names={odeStudy.metadata.columns.map((_, index) => `standardized z${index + 1}`)} />
    <ProbabilityDrawing context={context} />
    <FlowControls><OdeSelect label="Raw measurement" value={coordinate} onChange={value => setCoordinate(Number(value))}
      options={odeStudy.metadata.columns.map((name, index) => [index, name])} />
      <OdeNumber key={coordinate} label="Measurement value (cm)" value={context.fixture.raw[coordinate]}
        min={Math.min(odeStudy.bounds[coordinate][0], source(context.fixture.sourceId).features[coordinate] - .6)}
        max={Math.max(odeStudy.bounds[coordinate][1], source(context.fixture.sourceId).features[coordinate] + .6)}
        epoch={context.resetEpoch} reject={context.reject} onChange={value => context.change({
          raw: context.fixture.raw.map((old, index) => index === coordinate ? value : old) })} />
    </FlowControls>
    <FlowReadout>The fixed model turns the current raw vector into probabilities
      {' '}{context.result.probabilities.map(value => number(value, 9)).join(', ')}.
      This is local input sensitivity, not a verified causal intervention or improved accuracy.</FlowReadout>
  </>}</StudyView>;
}

export function OdeStudySolverLab() {
  return <StudyView label="Change the numerical realization while keeping saved weights and raw input">{context => {
    const isOde = context.fixture.kind.includes('ode');
    return <>
      <ProbabilityDrawing context={context} />
      {isOde && <FlowControls><OdeSelect label="Inference numerical method" value={context.fixture.method}
        onChange={method => context.change({ method })} options={[['rk4', 'Classical RK4'], ['euler', 'Euler']]} />
        <FlowSlider name="Inference intervals" min={1} max={64} step={1} value={context.fixture.intervals}
          onChange={intervals => context.change({ intervals })} />
        <FlowSlider name="Final representation depth" min={0} max={2} step={.05} value={context.fixture.endpoint}
          onChange={endpoint => context.change({ endpoint })} />
      </FlowControls>}
      <FlowReadout>{isOde ? <>This forward pass makes {context.result.nfe} field calls at depth {number(context.fixture.endpoint)};
        all saved parameters stay fixed.</> : <>The linear/residual comparison has its fixed discrete architecture;
        these ODE solver settings are retained for your next ODE model and do not change this baseline.</>}</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeStudyTraceLab() {
  return <StudyView label="Inspect every full hidden-state coordinate and one accepted state">{context => {
    const { fixture, result } = context;
    const index = Math.min(fixture.selected, result.trace.length - 1);
    const clock = i => fixture.kind.includes('ode') ? fixture.endpoint * i / fixture.intervals
      : fixture.kind === 'residual' ? i / 4 : 0;
    return <>
      {result.endpoint.map((_, coordinate) => <figure key={coordinate} aria-label={`Full hidden coordinate ${coordinate + 1}, at each accepted clock`}>
        <OdeCoordinates series={[{ label: `actual state z${coordinate + 1}`, color: odeFlowRoles.computed,
          values: result.trace.map((row, i) => [clock(i), row[coordinate]]), dots: true }]}
          xDomain={[0, Math.max(.01, clock(result.trace.length - 1))]} yLabel={`hidden z${coordinate + 1}`} />
      </figure>)}
      <OdeArray values={result.trace[index]} names={result.trace[index].map((_, i) => `selected z${i + 1}`)} />
      <FlowControls><FlowSlider name="Accepted state index" min={0} max={result.trace.length - 1} step={1}
        value={index} onChange={selected => context.change({ selected })} /></FlowControls>
      <FlowReadout>Selected state {index} is at representation depth {number(clock(index))}.
        Every coordinate shown belongs to the full hidden state; these are not growing flower measurements.</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeStudyFieldLab() {
  return <StudyView label="Inspect the full saved field and every weight row">{context => {
    const { fixture, result, snapshot } = context;
    if (fixture.kind === 'linear') return <p>The linear baseline has no field; its readout is inspected below. Select a neural/residual model above to inspect field weights.</p>;
    const step = Math.min(fixture.selected, fixture.kind === 'residual' ? 3 : fixture.intervals - 1);
    const probe = Math.min(fixture.probe, fixture.method === 'euler' ? 0 : 3);
    const stage = fixture.kind === 'residual' ? { time: step / 4, state: result.trace[step] } : result.stages[step][probe];
    const prefix = fixture.kind === 'residual' ? `blocks.${step}` : 'field';
    const field = fieldEvaluation(snapshot, stage.time, stage.state, prefix);
    const unit = Math.min(fixture.hidden, field.hidden.length - 1);
    const rate = Math.min(fixture.rate, field.velocity.length - 1);
    return <>
      <figure aria-label="The actual saved input matrix row, all hidden activations and selected output row compute a state derivative, not a replacement state.">
        <OdeArray values={field.inputs} names={field.inputs.map((_, index) => index === field.inputs.length - 1 ? 'actual stage clock t' : `stage z${index + 1}`)} role="input" />
        <OdeWire /><OdeMatrix matrix={[field.inputWeights[unit]]} rowNames={[`hidden ${unit + 1}`]}
          columnNames={field.inputs.map((_, index) => index === field.inputs.length - 1 ? 'clock' : `z${index + 1}`)}
          label={`Saved input weight row ${unit + 1}; matrix is ${field.inputWeights.length} output rows × ${field.inputs.length} inputs`} />
        <OdeArray values={[field.inputBias[unit]]} names={['selected hidden bias']} role="parameter" />
        <OdeWire /><OdeOperation name="sum row products + bias">sum = {number(field.sums[unit], 9)}</OdeOperation>
        <OdeWire /><OdeOperation name="tanh" />
        <OdeArray values={[field.hidden[unit]]} names={[`selected hidden q${unit + 1}`]} />
        <p>This row produces only q{unit + 1}. Every other hidden unit repeats the same operation with its own
          saved input row and bias. The complete vector below contains those separately computed results.</p>
        <OdeArray values={field.hidden} names={field.hidden.map((_, index) => `hidden q${index + 1}`)} />
        <OdeWire /><OdeMatrix matrix={[field.outputWeights[rate]]} rowNames={[`rate ${rate + 1}`]}
          columnNames={field.hidden.map((_, index) => `q${index + 1}`)} label="Selected output row reads every hidden activation" />
        <OdeArray values={[field.outputBias[rate]]} names={['selected rate bias']} role="parameter" />
        <OdeWire /><OdeOperation name="sum all hidden products + bias" />
        <OdeArray values={[field.velocity[rate]]} names={[`selected state rate ${rate + 1}`]} />
        <p>This output row produces only rate {rate + 1}. The complete derivative below repeats the output-row
          operation for every coordinate, using each row’s own weights and bias.</p>
        <OdeArray values={field.velocity} names={field.velocity.map((_, index) => `state rate ${index + 1}`)} />
      </figure>
      <FlowControls><OdeSelect label="Inspect hidden-unit input row" value={unit} onChange={value => context.change({ hidden: Number(value) })}
        options={field.hidden.map((_, index) => [index, `hidden unit ${index + 1}`])} />
        <OdeSelect label="Inspect derivative output row" value={rate} onChange={value => context.change({ rate: Number(value) })}
          options={field.velocity.map((_, index) => [index, `state rate ${index + 1}`])} /></FlowControls>
      <FlowReadout>At actual stage clock {number(stage.time)}, hidden unit {unit + 1} has sum
        {' '}{number(field.sums[unit], 9)} and tanh output {number(field.hidden[unit], 9)}.
        The selected complete output row gives rate {number(field.velocity[rate], 9)}.</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeStudyProjectionLab() {
  return <StudyView label="Inspect a two-coordinate projection without hiding the full state">{context => {
    const { fixture, result } = context;
    const horizontal = Math.min(fixture.horizontal, result.endpoint.length - 1);
    const vertical = Math.min(fixture.vertical, result.endpoint.length - 1);
    const values = result.trace.map(row => [row[horizontal], row[vertical]]);
    return <>
      <OdeCoordinates series={[{ label: 'accepted hidden-state path',
        color: odeFlowRoles.computed, dots: true, values }]}
        xLabel={`hidden z${horizontal + 1}`} yLabel={`hidden z${vertical + 1}`} />
      <FlowControls><OdeSelect label="Horizontal projected coordinate" value={horizontal}
        onChange={value => context.change({ horizontal: Number(value) })}
        options={result.endpoint.map((_, index) => [index, `z${index + 1}`])} />
        <OdeSelect label="Vertical projected coordinate" value={vertical}
          onChange={value => context.change({ vertical: Number(value) })}
          options={result.endpoint.map((_, index) => [index, `z${index + 1}`])} /></FlowControls>
      <FlowReadout>This is only the selected projection. It contains {result.trace.length} accepted states;
        a crossing here need not be a meeting of full states. Selecting the same coordinate on both axes gives a diagonal view.</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeStudyStageLab() {
  return <StudyView label="Inspect a tentative rate evaluation of the saved field">{context => {
    const { fixture, result } = context;
    if (!fixture.kind.includes('ode')) return <p>This baseline has no RK probes. Its discrete computation is fixed; select an ODE model to inspect solver probes.</p>;
    const step = Math.min(fixture.selected, fixture.intervals - 1);
    const probe = Math.min(fixture.probe, result.stages[step].length - 1);
    const stage = result.stages[step][probe];
    return <><OdeArray values={stage.state} names={stage.state.map((_, index) => `tentative z${index + 1}`)} role="input" />
      <OdeWire /><OdeArray values={stage.derivative} names={stage.derivative.map((_, index) => `rate k${probe + 1},${index + 1}`)} />
      <FlowControls><FlowSlider name="Accepted interval index" min={0} max={fixture.intervals - 1} step={1}
        value={step} onChange={selected => context.change({ selected })} />
        <FlowSlider name="Rate evaluation number" min={1} max={fixture.method === 'rk4' ? 4 : 1} step={1}
          value={probe + 1} onChange={value => context.change({ probe: value - 1 })} /></FlowControls>
      <FlowReadout>Probe {probe + 1} in interval {step} has actual clock {number(stage.time)}.
        Its tentative state and derivative are not extra accepted endpoints. The weight drawing above now inspects this same probe.</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeStudyReadoutLab() {
  return <StudyView label="Inspect the full saved class readout and normalization">{context => {
    const { fixture, result, snapshot } = context;
    const weights = snapshot.state['readout.weight'];
    const bias = snapshot.state['readout.bias'];
    const selected = fixture.readout;
    const shift = Math.max(...result.logits);
    const exponentials = result.logits.map(value => Math.exp(value - shift));
    return <><OdeArray values={result.endpoint} names={result.endpoint.map((_, index) => `final z${index + 1}`)} />
      <OdeWire /><OdeMatrix matrix={weights} rowNames={odeStudy.metadata.classes}
        columnNames={result.endpoint.map((_, index) => `z${index + 1}`)} label="All three saved class rows read the complete final state" />
      <OdeArray values={bias} names={odeStudy.metadata.classes.map(name => `${name} bias`)} role="parameter" />
      <OdeWire /><OdeOperation name="Wz + b">each row gives one class logit</OdeOperation>
      <OdeArray values={result.logits} names={odeStudy.metadata.classes.map(name => `${name} logit`)} />
      <OdeWire /><OdeOperation name="subtract max → exp → sum → divide">shared max {number(shift)}; sum {number(exponentials.reduce((sum, value) => sum + value, 0))}</OdeOperation>
      <OdeArray values={result.probabilities} names={odeStudy.metadata.classes.map(name => `${name} probability`)} />
      <FlowControls><OdeSelect label="Class row to inspect" value={selected}
        onChange={value => context.change({ readout: Number(value) })} options={odeStudy.metadata.classes.map((name, index) => [index, name])} /></FlowControls>
      <FlowReadout>{odeStudy.metadata.classes[selected]} has logit {number(result.logits[selected], 9)},
        exponential {number(exponentials[selected], 9)} after the shared shift, and normalized probability
        {' '}{number(result.probabilities[selected], 9)}. The edited input has no supplied new label for a loss calculation.</FlowReadout>
    </>;
  }}</StudyView>;
}

export function OdeHistoryDrawing() {
  const [selected, setSelected] = useState('neural_ode');
  const runs = odeStudy.runs.filter(run => run.kind === selected);
  return <FlowLab label="Read all declared validation histories and paired assessment outcomes">
    <OdeCoordinates series={runs.map((run, index) => ({
      label: `seed ${run.seed}: validation CE`, color: [odeFlowRoles.input, odeFlowRoles.computed, odeFlowRoles.parameter][index],
      dashed: index === 1, values: run.curves.map(point => [point.step, point.validation.cross_entropy]),
    }))} xDomain={[1, 300]} yLabel="validation CE" xLabel="AdamW update" />
    <div className="ode-flow-matrix-scroll" tabIndex={0} aria-label="All twelve declared assessment outcomes">
      <table className="ode-flow-matrix"><caption>All models and seeds; counts share denominator 29</caption>
        <thead><tr>{['model', 'seed', 'parameters', 'selected update', 'assessment CE', 'correct'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{odeStudy.runs.map(run => <tr key={`${run.kind}-${run.seed}`}>
          <th scope="row">{run.kind}</th><td>{run.seed}</td><td>{run.parameters}</td><td>{run.selected_step}</td>
          <td>{number(run.assessment.cross_entropy, 9)}</td><td>{run.assessment.correct} / 29</td>
        </tr>)}</tbody>
      </table>
    </div>
    <FlowControls><OdeSelect label="Validation histories to trace" value={selected} onChange={setSelected} options={kinds} /></FlowControls>
    <FlowReadout>These are three declared seeds for {selected}; all twelve outcomes remain visible.
      Validation selects checkpoints. Different parameter counts and three paired seeds do not establish a universal architecture ranking.</FlowReadout>
  </FlowLab>;
}

export function OdeVisibleProgram({ file }) {
  return <RemoteCodeBlock source={base + file} filename={file} language="python"
    title={`Read the complete ${file}`} />;
}
