import { createContext, useContext, useMemo, useState, useId, useEffect } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { linearOdeComparison, scalarOdeGradient } from '../../data/neural-ode-models.js';
import { adaptiveFlow, observedFlow } from '../../data/neural-ode-flow-models.js';
import { OdePlane, OdeArray, OdeOperation, OdeWire, OdeCoordinates,
  OdeLiftDrawing, OdeObservationDrawing, odeFlowRoles } from './NeuralOdeFlowFigures.jsx';

const FixedContext = createContext(null);
const AdaptiveContext = createContext(null);
const GradientContext = createContext(null);
const LiftContext = createContext(null);
const ObservationContext = createContext(null);

const fixedDefault = { matrix: [[0, -1], [1, 0]], initial: [.6, .8], endpoint: 1.2,
  intervals: 8, method: 'rk4', selected: 0, probe: 0 };
const adaptiveDefault = { rates: [-2, -50], initial: [1, .3], endpoint: .4,
  relative: .01, absolute: .0001, selected: 0 };
const gradientDefault = { rate: .3, initial: .8, target: 1, endpoint: .7, intervals: 3, method: 'euler' };
const liftDefault = { points: [-2, 0, 1], endpoint: .4, threshold: .5 };
const observationDefault = { events: [{ time: .1, value: 1 }, { time: .7, value: -1 },
  { time: 1.4, value: .5 }], decay: .5, mixing: .3, query: 1.6, omit: -1 };
const clone = value => JSON.parse(JSON.stringify(value));

function FixtureProvider({ context: Context, initial, calculate, children }) {
  const [fixture, setFixture] = useState(() => clone(initial));
  const [pinned, setPinned] = useState(null);
  const [resetEpoch, setResetEpoch] = useState(0);
  const [error, setError] = useState('');
  const result = useMemo(() => calculate(fixture), [fixture, calculate]);
  const change = update => {
    const next = typeof update === 'function' ? update(fixture) : { ...fixture, ...update };
    try {
      calculate(next);
      setFixture(next);
      setError('');
      return true;
    } catch (failure) { setError(failure.message); return false; }
  };
  const reset = () => {
    setFixture(clone(initial));
    setError('');
    setResetEpoch(epoch => epoch + 1);
  };
  const restore = () => {
    if (!pinned) return;
    setFixture(clone(pinned));
    setError('');
    setResetEpoch(epoch => epoch + 1);
  };
  return <Context.Provider value={{ fixture, change, result, pinned, resetEpoch, error,
    reset, restore, pin: () => setPinned(clone(fixture)), reject: setError }}>{children}</Context.Provider>;
}

const calculateFixed = fixture => linearOdeComparison(fixture.matrix, fixture.initial,
  fixture.endpoint, fixture.intervals, fixture.method);
const calculateAdaptive = fixture => adaptiveFlow(fixture);
const calculateGradient = fixture => scalarOdeGradient(fixture.rate, fixture.initial,
  fixture.target, fixture.endpoint, fixture.intervals, fixture.method);
const calculateLift = fixture => ({ heights: fixture.points.map(value => fixture.endpoint * value * value) });
const calculateObservations = fixture => observedFlow(fixture);

export function OdeFlowContexts({ children }) {
  return <FixtureProvider context={FixedContext} initial={fixedDefault} calculate={calculateFixed}>
    <FixtureProvider context={AdaptiveContext} initial={adaptiveDefault} calculate={calculateAdaptive}>
      <FixtureProvider context={GradientContext} initial={gradientDefault} calculate={calculateGradient}>
        <FixtureProvider context={LiftContext} initial={liftDefault} calculate={calculateLift}>
          <FixtureProvider context={ObservationContext} initial={observationDefault} calculate={calculateObservations}>
            {children}
          </FixtureProvider>
        </FixtureProvider>
      </FixtureProvider>
    </FixtureProvider>
  </FixtureProvider>;
}

export function OdeSelect({ label, value, onChange, options }) {
  const id = useId();
  return <label className="ode-flow-select" htmlFor={id}><span>{label}</span>
    <select id={id} aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
    </select>
  </label>;
}

export function OdeNumber({ label, value, onChange, min, max, integer = false,
  epoch = 0, reject }) {
  const id = useId();
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, epoch]);
  return <label className="ode-flow-number" htmlFor={id}><span>{label}</span>
    <input id={id} aria-label={label} type="text" inputMode={integer ? 'numeric' : 'decimal'} value={draft}
      aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
      onChange={event => {
        const next = event.target.value;
        setDraft(next);
        const parsed = Number(next);
        if (!next.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max ||
            (integer && !Number.isInteger(parsed))) {
          const message = `Use ${integer ? 'an integer' : 'a finite value'} from ${min} to ${max}. The last valid result remains.`;
          setError(message);
          reject?.(message);
          return;
        }
        const accepted = onChange(parsed);
        setError(accepted === false ? 'This edit cannot form a valid case. The last valid result remains shown.' : '');
      }} />
    {error && <span id={errorId} role="alert">{error}</span>}
  </label>;
}

export function OdeFixtureActions({ context, name }) {
  const { pin, reset, restore, pinned, error } = context;
  return <>
    <div className="ode-flow-actions">
      <button type="button" onClick={pin}>Pin whole {name} case</button>
      <button type="button" onClick={reset}>Reset whole {name} case</button>
      {pinned && <button type="button" onClick={restore}>Restore pinned case</button>}
    </div>
    <p role="status">{pinned ? 'The full case is pinned; subsequent controls keep that comparison.' : 'Pin saves every model input in this case, not just the selected coordinate.'}</p>
    {error && <p role="alert">{error}</p>}
  </>;
}

function FixedView({ children, stages = false, resultSentence }) {
  const context = useContext(FixedContext);
  const { fixture, result, pinned } = context;
  const baseline = pinned ? calculateFixed(pinned) : null;
  return <FlowLab label="Change the shared fixed-solver case">
    <OdePlane matrix={fixture.matrix} initial={fixture.initial} endpoint={fixture.endpoint}
      steps={fixture.intervals} method={fixture.method}
      stageIndex={stages ? fixture.selected : null} probe={fixture.probe} />
    <FlowControls>{children(context)}</FlowControls>
    <FlowReadout>At depth {number(fixture.endpoint)}, {fixture.method} reaches
      {' '}({result.endpoint.map(value => number(value)).join(', ')}), using {result.nfe} rate evaluations.
      {' '}The exact linear endpoint is ({result.exact.map(value => number(value)).join(', ')}),
      {' '}with endpoint error {number(result.error, 9)}.{resultSentence?.(context)}
      {baseline && <> The pinned whole-case error is {number(baseline.error, 9)}; changing its field or input also changes the question.</>}
    </FlowReadout>
  </FlowLab>;
}

export function OdeFixedMatrixLab() {
  const context = useContext(FixedContext);
  const [entry, setEntry] = useState(0);
  const row = Math.floor(entry / 2);
  const column = entry % 2;
  return <><FixedView>{({ fixture, change, resetEpoch, reject }) => <>
    <OdeSelect label="Field coefficient" value={entry} onChange={value => setEntry(Number(value))}
      options={[[0, 'x rate from x'], [1, 'x rate from y'], [2, 'y rate from x'], [3, 'y rate from y']]} />
    <OdeNumber key={entry} label="Selected coefficient value" value={fixture.matrix[row][column]}
      min={-4} max={4} epoch={resetEpoch} reject={reject}
      onChange={value => change({ matrix: fixture.matrix.map((values, index) => index === row
        ? values.map((old, coordinate) => coordinate === column ? value : old) : values) })} />
  </>}</FixedView><OdeFixtureActions context={context} name="fixed-solver" /></>;
}

export function OdeFixedInitialLab() {
  const [coordinate, setCoordinate] = useState(0);
  return <FixedView>{({ fixture, change, resetEpoch, reject }) => <>
    <OdeSelect label="Starting coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))}
      options={[[0, 'x'], [1, 'y']]} />
    <OdeNumber key={coordinate} label="Starting value" value={fixture.initial[coordinate]} min={-2} max={2}
      epoch={resetEpoch} reject={reject} onChange={value => change({
        initial: fixture.initial.map((old, index) => index === coordinate ? value : old) })} />
  </>}</FixedView>;
}

export function OdeFixedResolutionLab() {
  return <FixedView>{({ fixture, change }) => <>
    <FlowSlider name="Final depth T" value={fixture.endpoint} min={0} max={3} step={.05}
      onChange={endpoint => change({ endpoint })} />
    <FlowSlider name="Accepted intervals" value={fixture.intervals} min={1} max={128} step={1}
      onChange={intervals => change({ intervals })} />
  </>}</FixedView>;
}

export function OdeFixedWorkLab() {
  return <FixedView>{({ fixture, change }) => <>
    <OdeSelect label="Numerical method" value={fixture.method} onChange={method => change({ method })}
      options={[['euler', 'Euler: one rate per interval'], ['rk4', 'Classical RK4: four rates per interval']]} />
    <FlowSlider name="Accepted interval budget" value={fixture.intervals} min={1} max={128} step={1}
      onChange={intervals => change({ intervals })} />
  </>}</FixedView>;
}

export function OdeFixedStageLab() {
  return <FixedView stages>{({ fixture, change }) => <>
    <FlowSlider name="Accepted interval index (starts at zero)" min={0} max={fixture.intervals - 1} step={1}
      value={Math.min(fixture.selected, fixture.intervals - 1)} onChange={selected => change({ selected })} />
    <FlowSlider name="Tentative rate evaluation (starts at one)" min={1} max={fixture.method === 'rk4' ? 4 : 1} step={1}
      value={Math.min(fixture.probe + 1, fixture.method === 'rk4' ? 4 : 1)}
      onChange={probe => change({ probe: probe - 1 })} />
  </>}</FixedView>;
}

function AdaptiveView({ children, inspect = false }) {
  const context = useContext(AdaptiveContext);
  const { fixture, result } = context;
  const baseline = context.pinned ? calculateAdaptive(context.pinned) : null;
  const selected = Math.min(fixture.selected, Math.max(0, result.attempts.length - 1));
  const attempt = result.attempts[selected];
  return <FlowLab label="Change the shared adaptive-solver case">
    <figure aria-label="Every accepted state is plotted against its actual clock; rejected attempts are not appended to the state path.">
      <OdeCoordinates series={fixture.initial.map((_, coordinate) => ({
        label: `accepted coordinate ${coordinate + 1}`, dashed: coordinate === 1,
        color: coordinate === 0 ? odeFlowRoles.input : odeFlowRoles.computed,
        values: result.trace.map(row => [row.time, row.state[coordinate]]),
      }))} xDomain={[0, Math.max(.001, fixture.endpoint)]} />
      {inspect && attempt && <><OdeArray values={[attempt.time, attempt.step, attempt.ratio]}
        names={['attempt starting clock', 'proposed interval', 'normalized error ratio']} />
        <OdeArray values={attempt.before} names={['old coordinate 1', 'old coordinate 2']} role="input" />
        <OdeWire /><OdeArray values={attempt.euler} names={['tentative Euler 1', 'tentative Euler 2']} />
        <OdeArray values={attempt.heun} names={['tentative Heun 1', 'tentative Heun 2']} />
        <OdeWire /><OdeArray values={attempt.scales} names={['computed error scale 1', 'computed error scale 2']} />
        <OdeArray values={attempt.standardized} names={['standardized error 1', 'standardized error 2']} />
        <OdeOperation name={attempt.accepted ? 'accept' : 'reject'}>
          {attempt.accepted ? 'advance to Heun endpoint' : 'retain old state and old clock'}</OdeOperation>
        <div className="ode-flow-matrix-scroll" tabIndex={0} aria-label="Selected attempt and nearby complete controller rows">
          <table className="ode-flow-matrix"><caption>Attempts {Math.max(0, selected - 5)} through {Math.min(result.attempts.length - 1, selected + 5)} of {result.attempts.length}; select any attempt below.</caption>
            <thead><tr>{['index', 'old clock', 'h', 'ratio', 'decision'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{result.attempts.slice(Math.max(0, selected - 5), selected + 6).map((row, index) => <tr key={index}>
              <th scope="row">{Math.max(0, selected - 5) + index}</th><td>{number(row.time)}</td><td>{number(row.step)}</td>
              <td>{number(row.ratio)}</td><td>{row.accepted ? 'accepted' : 'rejected'}</td>
            </tr>)}</tbody>
          </table>
        </div></>}
    </figure>
    <FlowControls>{children(context)}</FlowControls>
    <FlowReadout>At depth {number(fixture.endpoint)}, the solve uses {result.accepted} accepted and
      {' '}{result.rejected} rejected attempts, {result.nfe} rate evaluations. Its endpoint is
      {' '}({result.endpoint.map(value => number(value)).join(', ')}); exact is
      {' '}({result.exact.map(value => number(value)).join(', ')}).
      {attempt && inspect && <> Attempt {selected} {attempt.accepted ? 'advances' : 'does not advance'} the state.</>}
      {baseline && <> The pinned whole case reaches ({baseline.endpoint.map(value => number(value)).join(', ')})
        using {baseline.nfe} rate evaluations; its inputs and tolerances stay fixed.</>}
    </FlowReadout>
    {context.error && <p role="alert">{context.error}</p>}
  </FlowLab>;
}

export function OdeAdaptiveRatesLab() {
  const context = useContext(AdaptiveContext);
  const [coordinate, setCoordinate] = useState(0);
  return <><AdaptiveView>{({ fixture, change, resetEpoch, reject }) => <>
    <OdeSelect label="Decay coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))}
      options={[[0, 'coordinate 1'], [1, 'coordinate 2']]} />
    <OdeNumber key={coordinate} label="Rate coefficient" value={fixture.rates[coordinate]} min={-150} max={0}
      epoch={resetEpoch} reject={reject} onChange={value => change({ rates: fixture.rates.map((old, index) => index === coordinate ? value : old) })} />
  </>}</AdaptiveView><OdeFixtureActions context={context} name="adaptive" /></>;
}

export function OdeAdaptiveInitialLab() {
  const [coordinate, setCoordinate] = useState(0);
  return <AdaptiveView>{({ fixture, change, resetEpoch, reject }) => <>
    <OdeSelect label="Initial coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))}
      options={[[0, 'coordinate 1'], [1, 'coordinate 2']]} />
    <OdeNumber key={coordinate} label="Initial value" value={fixture.initial[coordinate]} min={-2} max={2}
      epoch={resetEpoch} reject={reject} onChange={value => change({ initial: fixture.initial.map((old, index) => index === coordinate ? value : old) })} />
  </>}</AdaptiveView>;
}

export function OdeAdaptiveTolerancesLab() {
  return <AdaptiveView>{({ fixture, change }) => <>
    <FlowSlider name="Relative tolerance" min={.001} max={.05} step={.001} value={fixture.relative}
      onChange={relative => change({ relative })} />
    <FlowSlider name="Absolute tolerance (state units)" min={.00001} max={.005} step={.00001} value={fixture.absolute}
      onChange={absolute => change({ absolute })} />
  </>}</AdaptiveView>;
}

export function OdeAdaptiveInspectLab() {
  return <AdaptiveView inspect>{({ fixture, change, result }) => <>
    <FlowSlider name="Final depth" min={0} max={1} step={.01} value={fixture.endpoint}
      onChange={endpoint => change({ endpoint })} />
    <FlowSlider name="Attempt index (starts at zero)" min={0} max={Math.max(0, result.attempts.length - 1)} step={1}
      value={Math.min(fixture.selected, Math.max(0, result.attempts.length - 1))} onChange={selected => change({ selected })} />
  </>}</AdaptiveView>;
}

function GradientView({ children }) {
  const context = useContext(GradientContext);
  const { fixture, result } = context;
  const baseline = context.pinned ? calculateGradient(context.pinned) : null;
  return <FlowLab label="Change the shared scalar loss and numerical gradient case">
    <OdeArray values={[fixture.rate, fixture.endpoint, fixture.intervals]}
      names={['field weight θ', 'final depth T', 'accepted intervals']}
      roles={['parameter', 'input', 'input']} />
    <OdeArray values={[fixture.initial, result.prediction, fixture.target]}
      names={['initial state', 'finite numerical endpoint', 'loss target']} roles={['input', 'computed', 'input']} />
    <OdeWire /><OdeOperation name="loss residual × sensitivity">
      ({number(result.prediction)} − {number(fixture.target)}) × {number(result.sensitivity)}</OdeOperation>
    <OdeArray values={[result.gradient, result.centralDifference, result.exactGradient, result.continuousAccumulator]}
      names={['finite-program gradient', 'finite-loss central difference', 'exact continuous-loss gradient', 'continuous backsolve from finite endpoint']} role="derivative" />
    <FlowControls>{children(context)}</FlowControls>
    <FlowReadout>The {fixture.method} program uses {fixture.intervals} intervals and has parameter gradient
      {' '}{number(result.gradient, 9)}, checked against its finite loss at {number(result.centralDifference, 9)}.
      {' '}The separately exact continuous endpoint is {number(result.exactPrediction, 9)},
      {' '}with continuous-loss gradient {number(result.exactGradient, 9)}.
      The RK4 continuous backsolve starts from the finite endpoint and its own terminal residual;
      it gives {number(result.continuousAccumulator, 9)}, including both forward-endpoint and backward-solve approximation.</FlowReadout>
    {baseline && <p>The pinned whole case has finite endpoint {number(baseline.prediction, 9)} and finite-program gradient
      {' '}{number(baseline.gradient, 9)}. Its field, loss target, depth and method remain fixed.</p>}
  </FlowLab>;
}

export function OdeGradientFieldLab() {
  const context = useContext(GradientContext);
  return <><GradientView>{({ fixture, change }) => <>
    <FlowSlider name="Field weight θ" min={-2} max={1} step={.05} value={fixture.rate} onChange={rate => change({ rate })} />
    <FlowSlider name="Initial state" min={-2} max={2} step={.05} value={fixture.initial} onChange={initial => change({ initial })} />
  </>}</GradientView><OdeFixtureActions context={context} name="sensitivity" /></>;
}

export function OdeGradientLossLab() {
  return <GradientView>{({ fixture, change }) => <>
    <FlowSlider name="Loss target" min={-2} max={2} step={.05} value={fixture.target} onChange={target => change({ target })} />
    <FlowSlider name="Final depth T" min={0} max={2} step={.05} value={fixture.endpoint} onChange={endpoint => change({ endpoint })} />
  </>}</GradientView>;
}

export function OdeGradientResolutionLab() {
  return <GradientView>{({ fixture, change }) => <>
    <OdeSelect label="Finite numerical method" value={fixture.method} onChange={method => change({ method })}
      options={[['euler', 'Euler'], ['rk4', 'Classical RK4']]} />
    <FlowSlider name="Intervals in the finite loss" min={1} max={64} step={1} value={fixture.intervals}
      onChange={intervals => change({ intervals })} />
  </>}</GradientView>;
}

export function OdeLiftPointsLab() {
  const context = useContext(LiftContext);
  const { fixture, change, resetEpoch, reject } = context;
  const [selected, setSelected] = useState(0);
  return <FlowLab label="Change a starting point in the constructed augmented flow">
    <OdeLiftDrawing points={fixture.points} endpoint={fixture.endpoint} threshold={fixture.threshold} />
    <FlowControls><OdeSelect label="Starting point" value={selected} onChange={value => setSelected(Number(value))}
      options={[[0, 'point 1'], [1, 'point 2'], [2, 'point 3']]} />
      <OdeNumber key={selected} label="Horizontal starting value" value={fixture.points[selected]} min={-3} max={3}
        epoch={resetEpoch} reject={reject} onChange={value => change({ points: fixture.points.map((old, index) => index === selected ? value : old) })} />
    </FlowControls>
    <FlowReadout>Starting points keep their x positions and reach heights
      {' '}{fixture.points.map(value => number(fixture.endpoint * value * value)).join(', ')}.
      {context.pinned && <> Pinned heights are {context.pinned.points.map(value => number(context.pinned.endpoint * value * value)).join(', ')}
        {' '}at pinned depth {number(context.pinned.endpoint)} and threshold {number(context.pinned.threshold)}.</>}
    </FlowReadout>
    <OdeFixtureActions context={context} name="augmentation" />
  </FlowLab>;
}

export function OdeLiftReadoutLab() {
  const { fixture, change } = useContext(LiftContext);
  return <FlowLab label="Change augmented depth and the readout threshold">
    <OdeLiftDrawing points={fixture.points} endpoint={fixture.endpoint} threshold={fixture.threshold} />
    <FlowControls><FlowSlider name="Depth T" min={0} max={1} step={.05} value={fixture.endpoint} onChange={endpoint => change({ endpoint })} />
      <FlowSlider name="Height readout threshold" min={0} max={3} step={.05} value={fixture.threshold} onChange={threshold => change({ threshold })} />
    </FlowControls>
    <FlowReadout>The strict height rule assigns classes
      {' '}{fixture.points.map(value => Number(fixture.endpoint * value * value > fixture.threshold)).join(', ')}.
      Changing the threshold does not change any state trajectory.</FlowReadout>
  </FlowLab>;
}

function ObservationView({ children }) {
  const context = useContext(ObservationContext);
  const { fixture, result } = context;
  const baseline = context.pinned ? calculateObservations(context.pinned) : null;
  return <FlowLab label="Change the shared observation history and query">
    <OdeObservationDrawing {...fixture} />
    <FlowControls>{children(context)}</FlowControls>
    <FlowReadout>The query at {number(fixture.query)} uses {result.updates.length} available, non-omitted observations
      {' '}and returns hidden state {number(result.state, 9)}. Future events do not contribute.
      {baseline && <> The pinned history returns {number(baseline.state, 9)} at its pinned query {number(context.pinned.query)};
        {' '}its events, omission, decay and mixing stay fixed.</>}
    </FlowReadout>
    {context.error && <p role="alert">{context.error}</p>}
  </FlowLab>;
}

export function OdeObservationEventsLab() {
  const context = useContext(ObservationContext);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, context.fixture.events.length - 1));
  return <><ObservationView>{({ fixture, change, resetEpoch, reject }) => fixture.events.length ? <>
    <OdeSelect label="Observation event" value={index} onChange={value => setSelected(Number(value))}
      options={fixture.events.map((_, eventIndex) => [eventIndex, `event ${eventIndex + 1}`])} />
    <OdeNumber key={`${index}-time`} label="Event clock time" value={fixture.events[index].time} min={0} max={3}
      epoch={resetEpoch} reject={reject} onChange={time => change({ events: fixture.events.map((event, i) => i === index ? { ...event, time } : event) })} />
    <OdeNumber key={`${index}-value`} label="Measured value" value={fixture.events[index].value} min={-3} max={3}
      epoch={resetEpoch} reject={reject} onChange={value => change({ events: fixture.events.map((event, i) => i === index ? { ...event, value } : event) })} />
  </> : <p>The history is empty. Add an observation below to edit its clock and value.</p>}</ObservationView>
    <div className="ode-flow-actions"><button type="button" disabled={context.fixture.events.length >= 8 || (context.fixture.events.at(-1)?.time ?? 0) >= 3}
      onClick={() => context.change({ events: [...context.fixture.events, { time: Math.min(3, (context.fixture.events.at(-1)?.time ?? 0) + .2), value: 0 }] })}>Add observation after last event</button>
      <button type="button" disabled={!context.fixture.events.length} onClick={() => context.change({
        events: context.fixture.events.filter((_, i) => i !== index), omit: -1 })}>Remove selected observation</button></div>
    <OdeFixtureActions context={context} name="observation" />
  </>;
}

export function OdeObservationPropagationLab() {
  return <ObservationView>{({ fixture, change }) => <>
    <FlowSlider name="Decay coefficient" min={0} max={2} step={.05} value={fixture.decay} onChange={decay => change({ decay })} />
    <FlowSlider name="Query clock" min={0} max={3} step={.05} value={fixture.query} onChange={query => change({ query })} />
  </>}</ObservationView>;
}

export function OdeObservationAssimilationLab() {
  return <ObservationView>{({ fixture, change }) => <>
    <FlowSlider name="New-observation mixing weight" min={0} max={1} step={.05} value={fixture.mixing} onChange={mixing => change({ mixing })} />
    <OdeSelect label="Omit an observation update" value={fixture.omit} onChange={value => change({ omit: Number(value) })}
      options={[[-1, 'keep every available observation'], ...fixture.events.map((_, index) => [index, `omit event ${index + 1}`])]} />
  </>}</ObservationView>;
}
