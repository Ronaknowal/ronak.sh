import { createContext, useContext, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { StateRetentionDrawing, StatePathsDrawing, StateHeldDrawing, StateImpulseDrawing, StateOscillatorDrawing, StateMatrixWriteDrawing } from './StateSpaceDrawings.jsx';
import { retainedTrace } from '../../data/state-space-intuition.js';
import { systemDefault, linearSystem, selectionDefault, selectiveMemory, ssdDefault, ssdOperator } from '../../data/state-space-models.js';
import './state-space-flow.css';
import { StateGateInjectionDrawing } from './StateSpaceStructureDrawings.jsx';
import { StateSSDFactorDrawing, StateSSDChunkDrawing, StateSSDCarryDrawing, StateSystemLedgerDrawing, StateEventDrawing } from './StateSpaceArchitectureDrawings.jsx';
import { StateTrace } from './StateSpaceLabs.jsx';
import { StateEndpointsDrawing } from './StateSpaceExtensionDrawings.jsx';
const StateContext = createContext(null);
const SelectionContext = createContext(null);
const SSDContext = createContext(null);
const vector = values => `[${values.map(value => number(value)).join(', ')}]`;
function Select({
  name,
  value,
  onChange,
  options
}) {
  return <label className="state-flow-select"><span>{name}</span>
    <select aria-label={name} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}
    </select>
  </label>;
}
export function StateSpaceFlowProvider({
  children
}) {
  const [system, setSystem] = useState(() => ({
    ...systemDefault(),
    inputs: [2, 0, 1, 0]
  }));
  const [systemStep, setSystemStep] = useState(2);
  const [selection, setSelection] = useState(() => ({
    ...selectionDefault(),
    inputs: [4, 9, -7, 6]
  }));
  const [eventStep, setEventStep] = useState(1);
  const [ssd, setSSD] = useState(() => {
    const settings = ssdDefault();
    settings.values[2] = [1, 2];
    settings.chunkSize = 2;
    return settings;
  });
  const [ssdStep, setSSDStep] = useState(2);
  const systemResult = useMemo(() => linearSystem(system), [system]);
  const selectionResult = useMemo(() => selectiveMemory(selection), [selection]);
  const ssdResult = useMemo(() => ssdOperator(ssd), [ssd]);
  return <StateContext.Provider value={{
    system,
    setSystem,
    step: Math.min(systemStep, system.inputs.length - 1),
    setStep: setSystemStep,
    result: systemResult
  }}>
    <SelectionContext.Provider value={{
      settings: selection,
      setSettings: setSelection,
      step: Math.min(eventStep, selection.inputs.length - 1),
      setStep: setEventStep,
      trace: selectionResult
    }}>
      <SSDContext.Provider value={{
        settings: ssd,
        setSettings: setSSD,
        step: Math.min(ssdStep, ssd.decay.length - 1),
        setStep: setSSDStep,
        result: ssdResult
      }}>{children}</SSDContext.Provider>
    </SelectionContext.Provider>
  </StateContext.Provider>;
}
export function StateRetentionFlow() {
  const [retention, setRetention] = useState(.8),
    [step, setStep] = useState(1);
  const trace = retainedTrace(retention),
    current = trace[step];
  return <FlowLab id="ssm-retention" label="What survives a zero reading?">
    <StateRetentionDrawing previous={current.previous} input={current.input} retention={retention} step={step} />
    <FlowControls><FlowSlider name="Old fraction retained" value={retention} onChange={setRetention} min={0} max={1} step={.01} />
      <Select name="Reading to inspect" value={step} onChange={value => setStep(Number(value))} options={trace.map(row => [row.step, `Step ${row.step}: reading ${row.input}`])} />
    </FlowControls>
    <FlowReadout>Retain {number(current.retained)} and write {number(current.written)}: the new summary is {number(current.state)}. {retention === 1 ? 'Writing is zero; the zero initial state stays zero.' : retention === 0 ? 'The new summary is exactly the newest reading.' : 'The older disturbance fades without being erased at once.'}</FlowReadout>
    <NeuralTable caption="The same three inputs; different information retained" headers={['Step', 'Input', 'Latest only', 'Whole-history average', 'Retain and write']} rows={trace.map(row => [row.step, row.input, row.input, number(row.average), number(row.state)])} />
  </FlowLab>;
}
export function StatePathsFlow() {
  const [read, setRead] = useState(2),
    [direct, setDirect] = useState(.25);
  return <FlowLab id="ssm-four-jobs" label="Does reporting change memory?">
    <StatePathsDrawing read={read} direct={direct} />
    <FlowControls><FlowSlider name="Read multiplier" value={read} onChange={setRead} min={-3} max={3} step={.1} /><FlowSlider name="Direct multiplier" value={direct} onChange={setDirect} min={-1} max={1} step={.05} /></FlowControls>
    <FlowReadout>The state stays 3.5. Reading contributes {number(read * 3.5)}, direct input contributes {number(direct * 3)}, and output is {number(read * 3.5 + direct * 3)}.</FlowReadout>
  </FlowLab>;
}
export function StateHeldFlow({
  comparison = false
}) {
  const [interval, setInterval] = useState(1),
    [input, setInput] = useState(1),
    [rate, setRate] = useState(-1);
  const exact = rate === 0 ? interval * input : Math.expm1(rate * interval) / rate * input,
    approximate = interval / (1 - interval * rate / 2) * input;
  return <FlowLab id={comparison ? 'ssm-bilinear' : 'ssm-held'} label={comparison ? 'How do the two sampling rules differ?' : 'What does waiting longer do?'}>
    <StateHeldDrawing interval={interval} input={input} rate={rate} bilinear={comparison} />
    <FlowControls><FlowSlider name={comparison ? 'Comparison interval Δ' : 'Held interval Δ'} value={interval} onChange={setInterval} min={0} max={3} step={.05} /><FlowSlider name={comparison ? 'Comparison held reading u' : 'Held reading u'} value={input} onChange={setInput} min={0} max={2} step={.1} />{comparison && <FlowSlider name="Comparison continuous rate A" value={rate} onChange={setRate} min={-3} max={0} step={.1} />}</FlowControls>
    <FlowReadout>From zero, the exact state is {number(exact)} after {number(interval)} time units; old memory would retain {number(Math.exp(rate * interval))}. {comparison && <>The bilinear state is {number(approximate)}; the signed difference is {number(approximate - exact)}.</>} The state axis stays 0…6 as input and rate change.</FlowReadout>
  </FlowLab>;
}
export function StateEulerFlow() {
  const [interval, setInterval] = useState(1),
    [rate, setRate] = useState(-1);
  const retained = 1 + interval * rate;
  return <FlowLab id="ssm-euler" label="Does a straight-line step preserve stable decay?">
    <StateRetentionDrawing previous={1} input={0} retention={retained} writeFraction={interval} />
    <FlowControls><FlowSlider name="Euler interval Δ" value={interval} onChange={setInterval} min={0} max={3} step={.05} /><FlowSlider name="Euler continuous rate A" value={rate} onChange={setRate} min={-3} max={0} step={.1} /></FlowControls>
    <FlowReadout>The straight-line step retains {number(retained)}; exact evolution retains {number(Math.exp(rate * interval))}. {Math.abs(retained) > 1 ? 'Repeating this Euler step amplifies a nonzero disturbance despite the nonpositive continuous rate.' : Math.abs(retained) === 1 ? 'Its magnitude does not decay.' : 'Its disturbance decays in magnitude.'} A negative multiplier flips sign at each step.</FlowReadout>
  </FlowLab>;
}
export function StateImpulseFlow() {
  const [selected, setSelected] = useState(2),
    [inputs, setInputs] = useState([2, 0, 1, 0]);
  const output = inputs.reduce((sum, input, birth) => birth <= selected ? sum + input * .5 ** (selected - birth) : sum, 0);
  return <FlowLab id="ssm-impulse" label="Which arrival contributes to this output?">
    <StateImpulseDrawing inputs={inputs} selected={selected} />
    <FlowControls><Select name="Input and output position" value={selected} options={inputs.map((_, i) => [i, `Position ${i}`])} onChange={value => setSelected(Number(value))} />
      <FlowSlider name="Selected input" value={inputs[selected]} onChange={value => setInputs(previous => previous.map((input, i) => i === selected ? value : input))} min={-4} max={4} step={.25} />
    </FlowControls>
    <FlowReadout>With half retention and a unit write, output {selected} is {number(output)}. Later arrivals have no route into this sum.</FlowReadout>
  </FlowLab>;
}
function SystemTable({
  system,
  result
}) {
  return <NeuralTable caption="One shared system, three independent calculations" headers={['Step', 'Input', 'Initial response', 'Recurrent', 'Direct convolution', 'FFT']} rows={system.inputs.map((input, i) => [i, number(input), number(result.initialResponse[i]), number(result.recurrent[i]), number(result.directConvolution[i]), number(result.frequencyConvolution[i])])} />;
}
export function StateSystemInputFlow() {
  const {
    system,
    setSystem,
    step,
    setStep,
    result
  } = useContext(StateContext);
  return <FlowLab id="ssm-system-input" label="Change one input, preserve the operator">
    <StateSystemLedgerDrawing system={system} result={result} selected={step} />
    <FlowControls><Select name="System input to edit" value={step} options={system.inputs.map((_, i) => [i, `Position ${i}`])} onChange={value => setStep(Number(value))} />
      <FlowSlider name="Input u" value={system.inputs[step]} min={-10} max={10} step={.25} onChange={value => setSystem(previous => ({
        ...previous,
        inputs: previous.inputs.map((input, i) => i === step ? value : input)
      }))} />
    </FlowControls>
    <FlowReadout>At position {step}, read memory {number(result.memory[step])} plus direct input {number(system.direct * system.inputs[step])} gives {number(result.recurrent[step])}. Maximum three-route difference is {result.difference.toExponential(2)}.</FlowReadout>
    <StateTrace title="The same inputs and actual outputs" series={[{
      label: 'Input',
      color: '#79c5d8',
      values: system.inputs
    }, {
      label: 'Output',
      color: '#baa1e3',
      values: result.recurrent
    }]} />
    <StateTrace title="Both retained state coordinates" series={system.initial.map((_, i) => ({
      label: `State ${i}`,
      color: i ? '#dedede' : '#baa1e3',
      values: result.states.map(row => row[i])
    }))} />
    <StateTrace title="Kernel: one input unit at each lag" series={[{
      label: 'Tap',
      color: '#baa1e3',
      values: result.kernel
    }]} yLabel="output per input unit" />
    <NeuralTable caption="Complete input contribution ledger: birth row, output column" headers={['Input birth', ...system.inputs.map((_, i) => `Output ${i}`)]} rows={result.contributions.map((row, i) => [i, ...row.map(value => number(value))])} />
    <SystemTable system={system} result={result} />
  </FlowLab>;
}
export function StateSystemParameterFlow({
  parameter
}) {
  const {
    system,
    setSystem,
    result,
    step
  } = useContext(StateContext);
  const [mode, setMode] = useState(0);
  const names = {
    rates: ['Continuous rate A', -3, 0],
    write: ['Write B', -2, 2],
    read: ['Read C', -2, 2],
    initial: ['Initial memory', -5, 5]
  };
  const [label, min, max] = names[parameter];
  return <FlowLab id={`ssm-system-${parameter}`} label={`What changes when ${label} changes?`}>
    <NeuralTable caption="Two state coordinates; shared input and interval" headers={['Mode', 'Rate', 'Discrete retention', 'Discrete write', 'Read', `State at ${step}`]} rows={[0, 1].map(i => [i, number(system.rates[i]), number(result.transitions[i]), number(result.injections[i]), number(system.read[i]), number(result.states[step][i])])} />
    <FlowControls><Select name={`${label} mode`} value={mode} options={[[0, 'Mode 0'], [1, 'Mode 1']]} onChange={value => setMode(Number(value))} />
      <FlowSlider name={label} value={system[parameter][mode]} min={min} max={max} step={.05} onChange={value => setSystem(previous => ({
        ...previous,
        [parameter]: previous[parameter].map((item, i) => i === mode ? value : item)
      }))} />
    </FlowControls>
    <FlowReadout>Mode {mode} now {parameter === 'initial' ? `starts at ${number(system.initial[mode])}` : parameter === 'read' ? `reports with multiplier ${number(system.read[mode])}` : `retains ${number(result.transitions[mode])} and writes ${number(result.injections[mode])} per input unit`}; output {step} is {number(result.recurrent[step])}. {parameter === 'read' && 'The state trajectory is unchanged by reading.'}</FlowReadout>
  </FlowLab>;
}
export function StateSystemExtentFlow() {
  const {
    system,
    setSystem,
    setStep,
    result
  } = useContext(StateContext);
  return <FlowLab id="ssm-system-extent" label="Does a longer input change the earlier outputs?">
    <SystemTable system={system} result={result} />
    <FlowControls><button type="button" disabled={system.inputs.length >= 16} onClick={() => setSystem(previous => ({
        ...previous,
        inputs: [...previous.inputs, 0]
      }))}>Append zero input</button>
      <button type="button" disabled={system.inputs.length <= 1} onClick={() => setSystem(previous => ({
        ...previous,
        inputs: previous.inputs.slice(0, -1)
      }))}>Remove last input</button>
      <button type="button" onClick={() => {
        setSystem({
          ...systemDefault(),
          inputs: [2, 0, 1, 0]
        });
        setStep(2);
      }}>Reset shared system</button>
    </FlowControls><FlowReadout>The sequence has {system.inputs.length} positions, up to sixteen. A silent appended observation still advances memory.</FlowReadout>
  </FlowLab>;
}
export function StateSystemDirectFlow() {
  const {
    system,
    setSystem,
    result,
    step
  } = useContext(StateContext);
  return <FlowLab id="ssm-system-direct" label="Separate current input from stored history">
    <SystemTable system={system} result={result} />
    <FlowControls><FlowSlider name="Shared-system direct D" value={system.direct} min={-2} max={2} step={.05} onChange={value => setSystem(previous => ({
        ...previous,
        direct: value
      }))} /></FlowControls>
    <FlowReadout>Position {step} keeps memory read {number(result.memory[step])}; direct input adds {number(system.direct * system.inputs[step])}. Setting both read coefficients to zero and D to one returns the input exactly.</FlowReadout>
  </FlowLab>;
}
export function StateSystemIntervalFlow() {
  const {
    system,
    setSystem,
    result,
    step
  } = useContext(StateContext);
  return <FlowLab id="ssm-system-interval" label="Change elapsed time while keeping the continuous rates">
    <SystemTable system={system} result={result} />
    <FlowControls><FlowSlider name="Shared-system interval Δ" value={system.interval} min={.05} max={2} step={.05} onChange={value => setSystem(previous => ({
        ...previous,
        interval: value
      }))} /></FlowControls>
    <FlowReadout>The continuous rates stay {vector(system.rates)}; per-step retention becomes {vector(result.transitions)} and writing becomes {vector(result.injections)}. Position {step} outputs {number(result.recurrent[step])}.</FlowReadout>
  </FlowLab>;
}
export function StateRotationFlow() {
  const [damping, setDamping] = useState(.2),
    [frequency, setFrequency] = useState(2);
  return <FlowLab id="ssm-rotation" label="Turn a memory without losing its coordinate meaning">
    <StateOscillatorDrawing damping={damping} frequency={frequency} />
    <FlowControls><FlowSlider name="Damping" value={damping} onChange={setDamping} min={0} max={2} step={.05} /><FlowSlider name="Angular rate" value={frequency} onChange={setFrequency} min={-4} max={4} step={.1} /></FlowControls>
    <FlowReadout>In .25 time units the angle changes by {number(.25 * frequency)} radians and the radius retains {number(Math.exp(-.25 * damping))}. Negative angular rate reverses the turn; zero damping preserves radius.</FlowReadout>
  </FlowLab>;
}
export function StateSelectionEventFlow() {
  const {
    settings,
    setSettings,
    step,
    setStep,
    trace
  } = useContext(SelectionContext);
  const row = trace[step];
  const edit = (key, value) => setSettings(previous => ({
    ...previous,
    [key]: previous[key].map((item, i) => i === step ? value : item)
  }));
  return <FlowLab id="ssm-selection-events" label="Which observations deserve to be retained?">
    <StateEventDrawing settings={settings} trace={trace} selected={step} />
    <FlowControls><Select name="Event to edit" value={step} options={trace.map((_, i) => [i, `Event ${i}`])} onChange={value => setStep(Number(value))} /><FlowSlider name="Event value" value={settings.inputs[step]} min={-10} max={10} step={.25} onChange={value => edit('inputs', value)} /><button type="button" aria-pressed={settings.marked[step]} onClick={() => edit('marked', !settings.marked[step])}>{settings.marked[step] ? 'Unmark this event' : 'Mark this event'}</button></FlowControls>
    <FlowReadout>{row.target === null ? 'No marked target exists yet.' : `The desired latest-marked value is ${number(row.target)}.`} Changing a marker changes the task target; it does not automatically learn or change the gate.</FlowReadout>
    <NeuralTable caption="Supplied events and desired latest-marked target" headers={['Event', 'Input', 'Marked', 'Desired target']} rows={trace.map((row, i) => [i, number(row.input), settings.marked[i] ? 'yes' : 'no', row.target === null ? 'none yet' : number(row.target)])} />
  </FlowLab>;
}
export function StateSelectionGateFlow({
  independent = false
}) {
  const {
    settings,
    setSettings,
    step,
    setStep,
    trace
  } = useContext(SelectionContext);
  const row = trace[step],
    previous = step ? trace[step - 1].state : settings.initial;
  const retention = settings.independent ? settings.retention : 1 - settings.gates[step];
  return <FlowLab id={independent ? 'ssm-selection-independent' : 'ssm-selection-gates'} label={independent ? 'Can memory decay while writing is closed?' : 'Keep or overwrite at this event?'}>
    <StateRetentionDrawing previous={previous} input={settings.inputs[step]} retention={retention} writeFraction={settings.gates[step]} step={step} />
    <FlowControls><Select name={independent ? 'Independent event' : 'Gate event'} value={step} options={trace.map((_, i) => [i, `Event ${i}`])} onChange={value => setStep(Number(value))} />
      <FlowSlider name="Selected write gate g" value={settings.gates[step]} min={0} max={1} step={.01} onChange={value => setSettings(previous => ({
        ...previous,
        gates: previous.gates.map((gate, i) => i === step ? value : gate),
        independent
      }))} />
      {independent && <FlowSlider name="Independent retention a" value={settings.retention} min={0} max={1} step={.01} onChange={value => setSettings(previous => ({
        ...previous,
        retention: value,
        independent: true
      }))} />}
    </FlowControls><FlowReadout>Retained {number(row.retained)} plus new write {number(row.incoming)} gives {number(row.state)}. {settings.independent ? 'Retention and writing need not sum to one.' : 'Here writing g and retention 1−g are coupled.'}</FlowReadout>
  </FlowLab>;
}
export function StateSelectionComparisonFlow() {
  const {
    settings,
    setSettings,
    trace
  } = useContext(SelectionContext);
  return <FlowLab id="ssm-selection-comparison" label="Compare constant and content-dependent retention">
    <NeuralTable caption="The same inputs under both gate schedules" headers={['Event', 'Selected state', 'Constant state', 'Target']} rows={trace.map((row, i) => [i, number(row.state), number(row.fixed), row.target === null ? 'none' : number(row.target)])} />
    <FlowControls><FlowSlider name="Constant gate" value={settings.constant} min={0} max={1} step={.01} onChange={value => setSettings(previous => ({
        ...previous,
        constant: value
      }))} /><button type="button" onClick={() => setSettings(previous => ({
        ...previous,
        gates: previous.marked.map(marked => marked ? .99 : .01),
        independent: false
      }))}>Apply constructed marker gates</button></FlowControls>
    <FlowReadout>The constant rule uses g={number(settings.constant)} everywhere; the selected rule can use a different gate at each observation. These are controlled rules, not trained accuracy measurements.</FlowReadout>
    <NeuralTable caption="Every signed update and its target error" headers={['Event', 'Retained', 'Written', 'State', 'Constant state', 'Target', 'Selected absolute error', 'Constant absolute error']} rows={trace.map((row, i) => [i, number(row.retained), number(row.incoming), number(row.state), number(row.fixed), row.target === null ? 'none' : number(row.target), row.error === null ? 'no target' : number(row.error), row.fixedError === null ? 'no target' : number(row.fixedError)])} />
  </FlowLab>;
}
export function StateSelectionExtentFlow() {
  const {
    settings,
    setSettings,
    setStep
  } = useContext(SelectionContext);
  return <FlowLab id="ssm-selection-extent" label="Keep memory through additional distractions">
    <FlowControls><button type="button" disabled={settings.inputs.length >= 16} onClick={() => setSettings(previous => ({
        ...previous,
        inputs: [...previous.inputs, 0],
        marked: [...previous.marked, false],
        gates: [...previous.gates, .01]
      }))}>Add distraction</button><button type="button" disabled={settings.inputs.length <= 1} onClick={() => setSettings(previous => ({
        ...previous,
        inputs: previous.inputs.slice(0, -1),
        marked: previous.marked.slice(0, -1),
        gates: previous.gates.slice(0, -1)
      }))}>Remove last event</button><button type="button" onClick={() => {
        setSettings({
          ...selectionDefault(),
          inputs: [4, 9, -7, 6]
        });
        setStep(1);
      }}>Reset marked events</button></FlowControls>
    <FlowReadout>There are {settings.inputs.length} events, up to sixteen; appended zero is a real unmarked observation.</FlowReadout>
  </FlowLab>;
}
export function StateSelectionInitialFlow() {
  const {
    settings,
    setSettings,
    trace
  } = useContext(SelectionContext);
  return <FlowLab id="ssm-selection-initial" label="What survives from before this event stream?">
    <StateRetentionDrawing previous={settings.initial} input={settings.inputs[0]} retention={settings.independent ? settings.retention : 1 - settings.gates[0]} writeFraction={settings.gates[0]} step={0} />
    <FlowControls><FlowSlider name="Selection initial state" value={settings.initial} min={-5} max={5} step={.25} onChange={value => setSettings(previous => ({
        ...previous,
        initial: value
      }))} /></FlowControls>
    <FlowReadout>Start at {number(settings.initial)}; the first state is {number(trace[0].state)}. Closing every write and setting retention to one preserves this initial memory; independent retention below one still decays it.</FlowReadout>
  </FlowLab>;
}
export function StateSSDStepFlow() {
  const {
    settings,
    result,
    step,
    setStep
  } = useContext(SSDContext);
  return <FlowLab id="ssm-ssd-state" label="Trace one matrix-state update">
    <StateMatrixWriteDrawing old={step ? result.states[step - 1] : settings.initial} decay={settings.decay[step]} write={settings.write[step]} read={settings.read[step]} values={settings.values[step]} />
    <FlowControls><Select name="SSD position to inspect" value={step} options={settings.decay.map((_, i) => [i, `Position ${i}`])} onChange={value => setStep(Number(value))} /></FlowControls>
    <FlowReadout>At position {step}, the two-coordinate output is {vector(result.recurrent[step])}; reading does not modify the saved matrix.</FlowReadout>
  </FlowLab>;
}
export function StateSSDEditFlow({
  field = 'write'
}) {
  const {
    settings,
    setSettings,
    step,
    result
  } = useContext(SSDContext);
  const [coordinate, setCoordinate] = useState(0);
  return <FlowLab id={`ssm-ssd-${field}`} label={`Which output changes when the ${field} coordinate changes?`}>
    <StateMatrixWriteDrawing old={step ? result.states[step - 1] : settings.initial} decay={settings.decay[step]} write={settings.write[step]} read={settings.read[step]} values={settings.values[step]} />
    <FlowControls><Select name={`${field} coordinate`} value={coordinate} options={[[0, 'Coordinate 0'], [1, 'Coordinate 1']]} onChange={value => setCoordinate(Number(value))} /><FlowSlider name={`SSD ${field} entry`} value={settings[field][step][coordinate]} min={-8} max={8} step={.25} onChange={value => setSettings(previous => ({
        ...previous,
        [field]: previous[field].map((row, i) => i === step ? row.map((entry, j) => j === coordinate ? value : entry) : row)
      }))} /></FlowControls>
    <FlowReadout>{field} coordinate {coordinate} at position {step} is {number(settings[field][step][coordinate])}; output becomes {vector(result.recurrent[step])}. {field === 'read' && 'The entire state trajectory is unchanged.'}</FlowReadout>
  </FlowLab>;
}
export function StateSSDChunkFlow() {
  const {
    settings,
    setSettings,
    result
  } = useContext(SSDContext);
  const [inspected, setInspected] = useState(0);
  const index = Math.min(inspected, result.chunks.length - 1),
    chunk = result.chunks[index];
  return <FlowLab id="ssm-ssd-chunks" label="Change grouping without changing the operator">
    <StateSSDChunkDrawing chunk={chunk} />
    <FlowControls><FlowSlider name="Chunk size q" value={settings.chunkSize} min={1} max={8} step={1} onChange={value => setSettings(previous => ({
        ...previous,
        chunkSize: value
      }))} /><Select name="Chunk to inspect" value={index} options={result.chunks.map((chunk, i) => [i, `${chunk.start}–${chunk.stop - 1}`])} onChange={value => setInspected(Number(value))} /></FlowControls>
    <FlowReadout>Maximum recurrent/matrix/chunk difference is {result.difference.toExponential(2)}. Chunk {index} passes {number(chunk.totalDecay)} times its incoming state plus its own final write. A short final chunk remains valid.</FlowReadout>
    <NeuralTable caption={`Chunk ${chunk.start}–${chunk.stop - 1}: local plus incoming`} headers={['Step', 'Local writes', 'Incoming memory', 'Output']} rows={chunk.total.map((row, i) => [chunk.start + i, vector(chunk.local[i]), vector(chunk.incoming[i]), vector(row)])} />
    <StateSSDCarryDrawing chunk={chunk} />
    <NeuralTable caption="Complete outgoing chunk boundary: advanced incoming plus own writes" headers={['State row', 'Incoming', 'Own final writes', 'Outgoing']} rows={chunk.carry.map((row, i) => [i, vector(row), vector(chunk.ownFinal[i]), vector(row.map((value, j) => chunk.totalDecay * value + chunk.ownFinal[i][j]))])} />
  </FlowLab>;
}
export function StateInjectionFlow() {
  const [interval, setInterval] = useState(Math.log(4)),
    [input, setInput] = useState(10);
  const a = Math.exp(-interval);
  return <FlowLab id="ssm-injection" label="Keep the retention fixed across two write conventions">
    <StateGateInjectionDrawing interval={interval} value={input} />
    <FlowControls><FlowSlider name="Injection interval Δ" value={interval} min={0} max={2} step={.05} onChange={setInterval} /><FlowSlider name="Held or endpoint input" value={input} min={-10} max={10} step={.25} onChange={setInput} /></FlowControls>
    <FlowReadout>Exact held input gives {number(a * 2 + (1 - a) * input)}; the maintained Δ B write gives {number(a * 2 + interval * input)}. Both carry {number(2 * a)} from old state 2.</FlowReadout>
  </FlowLab>;
}
export function StateSSDInfluenceFlow() {
  const {
    result
  } = useContext(SSDContext);
  return <><StateSSDFactorDrawing influence={result.influence} />
    <NeuralTable caption="Signed content factors cᵢ · bⱼ, before causal decay" headers={['Output', ...result.content.map((_, i) => `Input ${i}`)]} rows={result.content.map((row, i) => [i, ...row.map(value => number(value))])} />
    <NeuralTable caption="Causal decay factors: future entries zero, diagonal one" headers={['Output', ...result.mask.map((_, i) => `Input ${i}`)]} rows={result.mask.map((row, i) => [i, ...row.map(value => number(value))])} />
    <NeuralTable caption="Complete current signed influence matrix: output row, input column" headers={['Output', ...result.influence.map((_, i) => `Input ${i}`)]} rows={result.influence.map((row, i) => [i, ...row.map(value => number(value))])} />
  </>;
}
export function StateEndpointFlow() {
  const [mixture, setMixture] = useState(.5),
    [current, setCurrent] = useState(6);
  return <FlowLab id="ssm-endpoints" label="Change which endpoint supplies the write">
    <StateEndpointsDrawing mixture={mixture} current={current} />
    <FlowControls><FlowSlider name="Current endpoint fraction λ" value={mixture} min={0} max={1} step={.05} onChange={setMixture} /><FlowSlider name="Current endpoint input" value={current} min={-10} max={10} step={.25} onChange={setCurrent} /></FlowControls>
    <FlowReadout>Old state contributes .5; the previous endpoint contributes {number(1 - mixture)}; the current endpoint contributes {number(mixture * current)}. Their sum is {number(.5 + (1 - mixture) + mixture * current)}. The α=.5 and Δ=1 coefficients stay fixed.</FlowReadout>
  </FlowLab>;
}
export function StateSSDDecayFlow() {
  const {
    settings,
    setSettings,
    step,
    result
  } = useContext(SSDContext);
  return <FlowLab id="ssm-ssd-decay" label="Erase incoming matrix memory without erasing the current write">
    <StateMatrixWriteDrawing old={step ? result.states[step - 1] : settings.initial} decay={settings.decay[step]} write={settings.write[step]} read={settings.read[step]} values={settings.values[step]} />
    <FlowControls><FlowSlider name="SSD selected decay a" value={settings.decay[step]} min={0} max={1} step={.05} onChange={value => setSettings(previous => ({
        ...previous,
        decay: previous.decay.map((item, i) => i === step ? value : item)
      }))} /></FlowControls>
    <FlowReadout>At position {step}, incoming memory retains {number(settings.decay[step])}, and output is {vector(result.recurrent[step])}. At zero, the current outer-product write still enters.</FlowReadout>
  </FlowLab>;
}
export function StateSSDInitialFlow() {
  const {
    settings,
    setSettings,
    result
  } = useContext(SSDContext);
  const [entry, setEntry] = useState(0),
    row = Math.floor(entry / 2),
    column = entry % 2;
  return <FlowLab id="ssm-ssd-initial" label="Track nonzero memory through every output route">
    <StateMatrixWriteDrawing old={settings.initial} decay={settings.decay[0]} write={settings.write[0]} read={settings.read[0]} values={settings.values[0]} />
    <FlowControls><Select name="Initial matrix entry" value={entry} options={[0, 1, 2, 3].map(index => [index, `Row ${Math.floor(index / 2)}, column ${index % 2}`])} onChange={value => setEntry(Number(value))} /><FlowSlider name="Initial matrix value" value={settings.initial[row][column]} min={-5} max={5} step={.25} onChange={value => setSettings(previous => ({
        ...previous,
        initial: previous.initial.map((values, i) => i === row ? values.map((item, j) => j === column ? value : item) : values)
      }))} /></FlowControls>
    <FlowReadout>Initial entry [{row},{column}] is {number(settings.initial[row][column])}; first output becomes {vector(result.recurrent[0])}. The influence matrix describes writes; initial memory remains a separate contribution.</FlowReadout>
  </FlowLab>;
}
export function StateSSDExtentFlow() {
  const {
    settings,
    setSettings,
    setStep,
    result
  } = useContext(SSDContext);
  return <FlowLab id="ssm-ssd-extent" label="Preserve the SSD contract across a short final chunk">
    <NeuralTable caption="All output positions; arbitrary final chunk length" headers={['Position', 'Recurrent', 'Matrix', 'Chunked']} rows={result.recurrent.map((row, i) => [i, vector(row), vector(result.matrix[i]), vector(result.chunked[i])])} />
    <FlowControls><button type="button" disabled={settings.decay.length >= 8} onClick={() => setSettings(previous => ({
        ...previous,
        decay: [...previous.decay, .5],
        write: [...previous.write, [1, 0]],
        read: [...previous.read, [1, 0]],
        values: [...previous.values, [0, 0]]
      }))}>Append SSD position</button><button type="button" disabled={settings.decay.length <= 1} onClick={() => setSettings(previous => ({
        ...previous,
        decay: previous.decay.slice(0, -1),
        write: previous.write.slice(0, -1),
        read: previous.read.slice(0, -1),
        values: previous.values.slice(0, -1)
      }))}>Remove SSD position</button><button type="button" onClick={() => {
        const reset = ssdDefault();
        reset.values[2] = [1, 2];
        reset.chunkSize = 2;
        setSettings(reset);
        setStep(2);
      }}>Reset shared SSD</button></FlowControls>
    <FlowReadout>There are {settings.decay.length} positions, up to eight. Every output and final boundary state must agree across the three routes.</FlowReadout>
  </FlowLab>;
}
