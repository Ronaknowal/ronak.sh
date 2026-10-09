import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { lionTrace, sampledCurvature, hessianProbes, prodigyTrace, scheduleFreeTrace } from '../../data/advanced-optimizer-models.js';
import { LionBalanceDrawing, OptimizerSignedRulers, OptimizerUpdateDrawing, optimizerOpening, optimizerVector, SophiaClipDrawing, HessianMatrixDrawing, HessianProbeDrawing, SampledBatchDrawing, ProdigyGlobalDrawing, ProdigyStateDrawing, ScheduleFreePointsDrawing, ScheduleFreeHistoryDrawing, OptimizerTraceDrawing, OptimizerMemoryDrawing, OptimizerFactorShapeDrawing } from './AdvancedOptimizerFlowFigures.jsx';
import './advanced-optimizer-flow.css';
export function OptimizerFlowNumber({
  name,
  value,
  onChange,
  min,
  max,
  step = .01,
  integer = false,
  resetToken = 0
}) {
  const id = useId(),
    errorId = `${id}-error`;
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState('');
  useEffect(() => {
    setDraft(String(value));
    setError('');
  }, [value, resetToken]);
  const change = text => {
    setDraft(text);
    const number = Number(text);
    if (text.trim() === '' || !Number.isFinite(number) || number < min || number > max || integer && !Number.isInteger(number)) {
      setError(`Use a ${integer ? 'whole ' : ''}number from ${min} to ${max}. The picture retains the last valid value, ${value}.`);
      return;
    }
    setError('');
    onChange(number);
  };
  return <div className="optimizer-flow-field">
    <label htmlFor={id}>{name}</label>
    <input id={id} type="text" inputMode={integer ? 'numeric' : 'decimal'} value={draft} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={event => change(event.target.value)} />
    {error && <p id={errorId} className="optimizer-flow-error" role="status">{error}</p>}
  </div>;
}
export function OptimizerFlowSelect({
  name,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <div className="optimizer-flow-field"><label htmlFor={id}>{name}</label><select id={id} aria-label={name} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>;
}
const initialLion = Object.freeze({
  initial: -.4,
  momentum: -.3,
  gradients: [2, 2, 2],
  rate: .02,
  decay: .1,
  beta1: .9,
  beta2: .99
});
const OptimizerContext = createContext(null);
export function AdvancedOptimizerFlowProvider({
  children
}) {
  const [lion, setLion] = useState(() => structuredClone(initialLion)),
    [selectedLion, setSelectedLion] = useState(0),
    [lionPin, setLionPin] = useState(null),
    [resetToken, setResetToken] = useState(0);
  const rows = useMemo(() => lionTrace(lion), [lion]);
  const selected = Math.min(selectedLion, rows.length - 1),
    row = rows[selected];
  const updateLion = (name, value) => setLion(previous => ({
    ...previous,
    [name]: value
  }));
  const editGradient = value => setLion(previous => ({
    ...previous,
    gradients: previous.gradients.map((old, i) => i === selected ? value : old)
  }));
  const resetLion = () => {
    setLion(structuredClone(initialLion));
    setSelectedLion(0);
    setLionPin(null);
    setResetToken(token => token + 1);
  };
  return <OptimizerContext.Provider value={{
    lion,
    rows,
    row,
    selected,
    setSelectedLion,
    updateLion,
    editGradient,
    lionPin,
    setLionPin,
    resetLion,
    resetToken,
    setLion
  }}>{children}</OptimizerContext.Provider>;
}
function useOptimizerCase() {
  const state = useContext(OptimizerContext);
  if (!state) throw new Error('Optimizer reading-flow labs require AdvancedOptimizerFlowProvider.');
  return state;
}
export function OptimizerOpeningFlowLab() {
  const [rate, setRate] = useState(.1),
    state = useMemo(() => optimizerOpening(rate), [rate]);
  return <FlowLab id="optimizer-opening-update" label="Change the scale of one complete classifier update"><OptimizerUpdateDrawing state={state} /><FlowControls><FlowSlider name="Learning rate η" value={rate} min={0} max={1} step={.01} onChange={setRate} /></FlowControls><FlowReadout>At η=<strong>{f(rate)}</strong>, class 0's probability changes from <strong>{f(state.probabilities[0], 6)}</strong> to <strong>{f(state.nextProbabilities[0], 6)}</strong>; all four weights use the same initial gradient.</FlowReadout></FlowLab>;
}
export function LionWorkedFlowFigure() {
  const row = lionTrace({
    initial: .5,
    momentum: .2,
    gradients: [-1],
    rate: .01,
    decay: .2
  })[0];
  return <><LionBalanceDrawing row={row} /><LionBalanceDrawing row={row} view="memory" /></>;
}
export function LionFlowLab({
  view = 'evidence'
}) {
  const state = useOptimizerCase(),
    {
      lion,
      row,
      rows,
      selected,
      setSelectedLion,
      updateLion,
      editGradient,
      resetToken
    } = state;
  const number = (name, label, min, max, step = .01) => <OptimizerFlowNumber name={label} value={lion[name]} min={min} max={max} step={step} resetToken={resetToken} onChange={value => updateLion(name, value)} />;
  if (view === 'evidence') return <FlowLab id="optimizer-lion-evidence" label="Current gradient competes with old history"><LionBalanceDrawing row={row} beta1={lion.beta1} beta2={lion.beta2} /><FlowControls><OptimizerFlowSelect name="Inspect Lion update" value={selected} onChange={value => setSelectedLion(Number(value))} options={rows.map((current, i) => [i, `Update ${current.step}`])} /><OptimizerFlowNumber name="Gradient at this update" value={lion.gradients[selected]} min={-10} max={10} step={.1} resetToken={resetToken} onChange={editGradient} />{number('momentum', 'Initial momentum m', -10, 10, .1)}</FlowControls><FlowReadout>Update {row.step} combines <strong>{f(row.historyPart, 6)}</strong> with <strong>{f(row.freshPart, 6)}</strong>, making <strong>{f(row.blend, 6)}</strong>; the current signed direction is <strong>{row.direction}</strong>.</FlowReadout></FlowLab>;
  if (view === 'update') return <FlowLab id="optimizer-lion-update" label="Decay and sign both move the weight"><OptimizerSignedRulers label="Same current weight before decay and signed subtraction" description={`Update ${row.step}. Weight ${row.parameter} shrinks to ${row.shrunk} then changes to ${row.next}. All marks use the same axis; directly labelled concentric symbols preserve coincident positions.`} rows={[{
      name: `update ${row.step}; sign ${row.direction}`,
      points: [{
        name: 'old',
        value: row.parameter,
        role: 'parameter'
      }, {
        name: 'decay',
        value: row.shrunk
      }, {
        name: 'next',
        value: row.next,
        role: 'parameter'
      }]
    }]} /><FlowControls>{number('initial', 'Initial weight θ', -10, 10, .1)}{number('rate', 'Lion learning rate η', 0, .2, .001)}{number('decay', 'Lion decay λ', 0, 1)}</FlowControls><FlowReadout>The weight moves from <strong>{f(row.parameter, 6)}</strong> to <strong>{f(row.shrunk, 6)}</strong> by decay, then to <strong>{f(row.next, 6)}</strong> by subtracting η times direction {row.direction}.</FlowReadout></FlowLab>;
  if (view === 'memory') return <FlowLab id="optimizer-lion-memory" label="The second blend supplies future history"><LionBalanceDrawing row={row} beta1={lion.beta1} beta2={lion.beta2} view="memory" /><FlowControls>{number('beta1', 'Direction retention β₁', 0, .999, .001)}{number('beta2', 'Memory retention β₂', 0, .999, .001)}</FlowControls><FlowReadout>Direction retention β₁=<strong>{f(lion.beta1)}</strong> chooses the present sign {row.direction}; memory retention β₂=<strong>{f(lion.beta2)}</strong> stores <strong>{f(row.nextMemory, 6)}</strong> for the next update.</FlowReadout></FlowLab>;
  if (view === 'sequence') return <FlowLab id="optimizer-lion-sequence" label="The complete chronological Lion state"><NeuralTable caption="Every current gradient has an actual preceding state" headers={['Update', 'Old θ', 'Old m', 'g', 'Blend', 'Sign', 'After decay', 'New θ', 'New m']} rows={rows.map(current => [current.step, ...['parameter', 'memory', 'gradient', 'blend', 'direction', 'shrunk', 'next', 'nextMemory'].map(name => f(current[name], 7))])} /><div className="optimizer-flow-actions"><button disabled={rows.length >= 12} onClick={() => {
        state.setLion(previous => ({
          ...previous,
          gradients: [...previous.gradients, 0]
        }));
        setSelectedLion(rows.length);
      }}>Append zero gradient</button><button disabled={rows.length <= 1} onClick={() => {
        state.setLion(previous => ({
          ...previous,
          gradients: previous.gradients.filter((_, i) => i !== selected)
        }));
        setSelectedLion(Math.max(0, selected - 1));
      }}>Remove selected gradient</button></div><FlowReadout>The complete sequence is <strong>{optimizerVector(lion.gradients)}</strong>; after {rows.length} updates the weight is <strong>{f(rows.at(-1).next, 7)}</strong> and memory is <strong>{f(rows.at(-1).nextMemory, 7)}</strong>.</FlowReadout></FlowLab>;
  throw new Error(`Unknown Lion reading-flow view: ${view}`);
}
export function LionFlowActions() {
  const {
    lion,
    rows,
    lionPin,
    setLionPin,
    resetLion
  } = useOptimizerCase();
  return <><div className="optimizer-flow-actions"><button onClick={() => setLionPin({
        inputs: structuredClone(lion),
        rows: structuredClone(rows)
      })}>Pin complete Lion case</button><button onClick={resetLion}>Reset Lion case</button></div>{lionPin && <FlowReadout>Pinned gradients {optimizerVector(lionPin.inputs.gradients)} produced final weight <strong>{f(lionPin.rows.at(-1).next, 7)}</strong>. The current final weight differs by <strong>{f(rows.at(-1).next - lionPin.rows.at(-1).next, 7)}</strong>; pinned initial weight/history, both retentions, rate, decay and all updates remain fixed.</FlowReadout>}</>;
}
const SophiaContext = createContext(null),
  ProbeContext = createContext(null),
  SampleContext = createContext(null);
export function SophiaFlowProvider({
  children
}) {
  const [clip, setClip] = useState({
      momentum: [.2, -.3, 0],
      diagonal: [5, .1, 0],
      rho: .5,
      rate: .1,
      decay: .2
    }),
    [coordinate, setCoordinate] = useState(0),
    [resetToken, setResetToken] = useState(0),
    [clipPin, setClipPin] = useState(null);
  const [matrix, setMatrix] = useState([4, -2, 1]),
    [probe, setProbe] = useState(0),
    [probePin, setProbePin] = useState(null);
  const [sample, setSample] = useState({
      inputs: [3, 1],
      probabilities: [.25, .6],
      labels: [1, 0]
    }),
    [example, setExample] = useState(0),
    [samplePin, setSamplePin] = useState(null);
  const probes = useMemo(() => hessianProbes(...matrix), [matrix]),
    enumeration = useMemo(() => sampledCurvature(sample.inputs, sample.probabilities, sample.labels), [sample]);
  const clipState = useMemo(() => ({
    clip,
    setClip,
    coordinate,
    setCoordinate,
    resetToken,
    setResetToken,
    clipPin,
    setClipPin
  }), [clip, coordinate, resetToken, clipPin]);
  const probeState = useMemo(() => ({
    matrix,
    setMatrix,
    probe,
    setProbe,
    probes,
    probePin,
    setProbePin,
    resetToken,
    setResetToken
  }), [matrix, probe, probes, probePin, resetToken]);
  const sampleState = useMemo(() => ({
    sample,
    setSample,
    example,
    setExample,
    enumeration,
    samplePin,
    setSamplePin,
    resetToken,
    setResetToken
  }), [sample, example, enumeration, samplePin, resetToken]);
  return <SophiaContext.Provider value={clipState}><ProbeContext.Provider value={probeState}><SampleContext.Provider value={sampleState}>{children}</SampleContext.Provider></ProbeContext.Provider></SophiaContext.Provider>;
}
function useRequiredOptimizerCase(context, label) {
  const state = useContext(context);
  if (!state) throw new Error(`${label} requires SophiaFlowProvider.`);
  return state;
}
export function SophiaClipFlowLab({
  view = 'coordinates'
}) {
  const {
    clip,
    setClip,
    coordinate,
    setCoordinate,
    resetToken
  } = useRequiredOptimizerCase(SophiaContext, 'Sophia clipping');
  const directions = clip.momentum.map((value, i) => Math.max(-1, Math.min(1, value / Math.max(clip.rho * clip.diagonal[i], 1e-12)))),
    old = [1, 2, 3],
    shrinkage = old.map(value => value * (1 - clip.rate * clip.decay)),
    next = shrinkage.map((value, i) => value - clip.rate * directions[i]);
  const editCoordinate = (name, value) => setClip(previous => ({
    ...previous,
    [name]: previous[name].map((oldValue, i) => i === coordinate ? value : oldValue)
  }));
  if (view === 'coordinates') return <FlowLab id="optimizer-sophia-clipping" label="Inspect each current momentum and curvature lane"><SophiaClipDrawing momentum={clip.momentum} diagonal={clip.diagonal} rho={clip.rho} /><FlowControls><OptimizerFlowSelect name="Sophia coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))} options={old.map((_, i) => [i, `Coordinate ${i + 1}`])} /><OptimizerFlowNumber name="Momentum of this coordinate" value={clip.momentum[coordinate]} min={-3} max={3} step={.01} resetToken={resetToken} onChange={value => editCoordinate('momentum', value)} /><OptimizerFlowNumber name="Curvature estimate of this coordinate" value={clip.diagonal[coordinate]} min={-6} max={6} step={.01} resetToken={resetToken} onChange={value => editCoordinate('diagonal', value)} /></FlowControls><FlowReadout>The complete clipped direction is <strong>{optimizerVector(directions, 6)}</strong>. Coordinate {coordinate + 1} contributes <strong>{f(directions[coordinate], 6)}</strong> after the same floor and clipping rule.</FlowReadout></FlowLab>;
  if (view === 'scale') return <FlowLab id="optimizer-sophia-step" label="Curvature scale, step rate and decay change distinct operations"><OptimizerSignedRulers label="All three current parameters before and after Sophia" description={`Old weights ${old.join(',')}, after decay ${shrinkage.join(',')}, next weights ${next.join(',')}. All coordinates share the same ruler scale.`} rows={old.map((value, i) => ({
      name: `coordinate ${i + 1}; direction ${f(directions[i])}`,
      points: [{
        name: 'old',
        value,
        role: 'parameter'
      }, {
        name: 'decay',
        value: shrinkage[i]
      }, {
        name: 'next',
        value: next[i],
        role: 'parameter'
      }]
    }))} /><FlowControls>{[['rho', 'Curvature scale ρ', .01, 2], ['rate', 'Sophia learning rate η', 0, .4], ['decay', 'Sophia decay λ', 0, 1]].map(([key, name, min, max]) => <OptimizerFlowNumber key={key} name={name} value={clip[key]} min={min} max={max} step={.01} resetToken={resetToken} onChange={value => setClip(previous => ({
        ...previous,
        [key]: value
      }))} />)}</FlowControls><FlowReadout>With rate <strong>{f(clip.rate)}</strong> and decay <strong>{f(clip.decay)}</strong>, the new parameters are <strong>{optimizerVector(next, 6)}</strong>; clipping bounds the gradient-driven displacement, while decay has its own effect.</FlowReadout></FlowLab>;
  throw new Error(`Unknown Sophia clipping view: ${view}`);
}
export function HessianProbeFlowLab({
  view = 'matrix'
}) {
  const {
    matrix,
    setMatrix,
    probe,
    setProbe,
    probes,
    resetToken
  } = useRequiredOptimizerCase(ProbeContext, 'Hessian probe');
  if (view === 'matrix') return <FlowLab id="optimizer-hessian-matrix" label="Edit three entries of one complete symmetric Hessian"><HessianMatrixDrawing matrix={matrix} /><FlowControls>{['H₁₁', 'H₁₂ = H₂₁', 'H₂₂'].map((name, i) => <OptimizerFlowNumber key={name} name={name} value={matrix[i]} min={-6} max={6} step={.1} resetToken={resetToken} onChange={value => setMatrix(previous => previous.map((old, j) => j === i ? value : old))} />)}</FlowControls><FlowReadout>The actual diagonal is <strong>{optimizerVector(probes.mean)}</strong>; eigenvalues are <strong>{optimizerVector(probes.eigenvalues, 6)}</strong>. Both off-diagonal cells use the same edited entry.</FlowReadout></FlowLab>;
  if (view === 'probe') return <FlowLab id="optimizer-hessian-probe" label="Compare an individual diagonal estimate with all four probes"><HessianProbeDrawing matrix={matrix} probe={probes.values[probe].u} /><FlowControls><OptimizerFlowSelect name="Selected sign probe u" value={probe} onChange={value => setProbe(Number(value))} options={probes.values.map((row, i) => [i, optimizerVector(row.u)])} /></FlowControls><NeuralTable caption="All four equally likely sign probes" headers={['Probe u', 'Elementwise estimate u⊙Hu']} rows={probes.values.map(row => [optimizerVector(row.u), optimizerVector(row.estimate)])} /><FlowReadout>This probe estimates <strong>{optimizerVector(probes.values[probe].estimate)}</strong>; averaging all four gives <strong>{optimizerVector(probes.mean)}</strong>. A sampled coordinate and an eigenvalue are different quantities.</FlowReadout></FlowLab>;
  throw new Error(`Unknown Hessian probe view: ${view}`);
}
export function SophiaClipFlowActions() {
  const state = useRequiredOptimizerCase(SophiaContext, 'Sophia clip actions');
  const result = source => [1, 2, 3].map((weight, i) => weight * (1 - source.rate * source.decay) - source.rate * Math.max(-1, Math.min(1, source.momentum[i] / Math.max(source.rho * source.diagonal[i], 1e-12))));
  return <><div className="optimizer-flow-actions"><button onClick={() => state.setClipPin({
        inputs: structuredClone(state.clip),
        next: result(state.clip)
      })}>Pin complete Sophia update</button><button onClick={() => {
        state.setClip({
          momentum: [.2, -.3, 0],
          diagonal: [5, .1, 0],
          rho: .5,
          rate: .1,
          decay: .2
        });
        state.setCoordinate(0);
        state.setClipPin(null);
        state.setResetToken(value => value + 1);
      }}>Reset Sophia update</button></div>{state.clipPin && <FlowReadout>The pinned m {optimizerVector(state.clipPin.inputs.momentum)} and h {optimizerVector(state.clipPin.inputs.diagonal)}, with scale {f(state.clipPin.inputs.rho)}, rate {f(state.clipPin.inputs.rate)} and decay {f(state.clipPin.inputs.decay)}, gave parameters <strong>{optimizerVector(state.clipPin.next, 6)}</strong>; the complete current result is <strong>{optimizerVector(result(state.clip), 6)}</strong>.</FlowReadout>}</>;
}
const initialProdigy = Object.freeze({
  initial: 1,
  target: -2,
  distance: .01,
  rate: .3,
  steps: 12
});
const initialAveraging = Object.freeze({
  initial: -1,
  target: 1,
  rate: .2,
  beta: .9,
  noise: [-.5, .5, 1, -1]
});
const AdaptationContext = createContext(null),
  AveragingContext = createContext(null),
  MemoryContext = createContext(null);
export function OptimizerAdaptationFlowProvider({
  children
}) {
  const [settings, setSettings] = useState({
      ...initialProdigy
    }),
    [selected, setSelected] = useState(2),
    [pin, setPin] = useState(null),
    [resetToken, setResetToken] = useState(0);
  const [global, setGlobal] = useState({
      gradients: [-1, 2],
      displacements: [-.5, -.25]
    }),
    [coordinate, setCoordinate] = useState(0);
  const result = useMemo(() => prodigyTrace(settings.initial, settings.target, settings.distance, settings.rate, settings.steps), [settings]);
  const index = Math.min(selected, Math.max(0, result.rows.length - 1)),
    row = result.rows[index];
  const reset = () => {
    setSettings({
      ...initialProdigy
    });
    setSelected(2);
    setGlobal({
      gradients: [-1, 2],
      displacements: [-.5, -.25]
    });
    setCoordinate(0);
    setPin(null);
    setResetToken(value => value + 1);
  };
  return <AdaptationContext.Provider value={{
    settings,
    setSettings,
    selected: index,
    setSelected,
    result,
    row,
    pin,
    setPin,
    reset,
    resetToken,
    global,
    setGlobal,
    coordinate,
    setCoordinate
  }}>{children}</AdaptationContext.Provider>;
}
export function ProdigyWorkedFlowFigure() {
  const rows = prodigyTrace(0, 3, .01, 1, 12).rows;
  return <><OptimizerTraceDrawing label="The worked adapting scale includes its overshoot" description="Actual paper Algorithm 4 quadratic recurrence with initialization 0, target 3, d 0.01, gamma 1 and 12 updates; all computed parameter points retained." series={[{
      name: 'calculated θ',
      points: [[0, 0], ...rows.map(row => [row.step, row.after])]
    }, {
      name: 'objective target a=3',
      role: 'input',
      dashed: true,
      points: [[0, 3], [12, 3]]
    }]} /><NeuralTable caption="Worked scale used now versus retained next" headers={['Update', 'θ after', 'Loss', 'd now', 'd next']} rows={rows.map(row => [row.step, f(row.after, 7), f(row.loss, 7), f(row.distance_used, 8), f(row.distance_next, 8)])} /></>;
}
export function ProdigyFlowLab({
  view = 'objective'
}) {
  const state = useRequiredOptimizerCase(AdaptationContext, 'Prodigy investigation'),
    {
      settings,
      setSettings,
      result,
      row,
      selected,
      setSelected,
      resetToken
    } = state;
  const field = (key, name, min, max, integer = false) => <OptimizerFlowNumber name={name} value={settings[key]} min={min} max={max} integer={integer} resetToken={resetToken} onChange={value => setSettings(previous => ({
    ...previous,
    [key]: value
  }))} />;
  if (view === 'global') {
    const {
      global,
      setGlobal,
      coordinate,
      setCoordinate
    } = state;
    const sum = global.gradients.reduce((total, value, i) => total + value * global.displacements[i], 0),
      absolute = global.gradients.reduce((total, value, i) => total + Math.abs(value * global.displacements[i]), 0);
    const edit = (key, value) => setGlobal(previous => ({
      ...previous,
      [key]: previous[key].map((old, i) => i === coordinate ? value : old)
    }));
    return <FlowLab id="optimizer-prodigy-global" label="Keep signed contributions until the global sum"><ProdigyGlobalDrawing {...global} /><FlowControls><OptimizerFlowSelect name="Dot-product coordinate" value={coordinate} onChange={value => setCoordinate(Number(value))} options={[[0, 'Coordinate 1'], [1, 'Coordinate 2']]} /><OptimizerFlowNumber name="Gradient in this coordinate" value={global.gradients[coordinate]} min={-5} max={5} resetToken={resetToken} onChange={value => edit('gradients', value)} /><OptimizerFlowNumber name="Displacement toward initialization" value={global.displacements[coordinate]} min={-5} max={5} resetToken={resetToken} onChange={value => edit('displacements', value)} /></FlowControls><FlowReadout>The signed dot product is <strong>{f(sum, 6)}</strong>; taking absolute values first gives <strong>{f(absolute, 6)}</strong>, a different statistic. Both coordinates feed the same adaptation quantity.</FlowReadout></FlowLab>;
  }
  const graph = <OptimizerTraceDrawing label="The current objective and adapting state produce the complete trajectory" description={`Initialization ${settings.initial}, target ${settings.target}, initial d ${settings.distance}, gamma ${settings.rate}, requested updates ${settings.steps}. Only finite completed states are shown; target supplies gradient only.`} series={[{
    name: 'calculated θ',
    points: [[0, settings.initial], ...result.rows.map(current => [current.step, current.after])]
  }, {
    name: 'objective target a',
    role: 'input',
    dashed: true,
    points: [[0, settings.target], [settings.steps, settings.target]]
  }]} />;
  if (view === 'objective') return <FlowLab id="optimizer-prodigy-objective" label="Change the objective without supplying target distance to the estimator">{graph}<FlowControls>{field('initial', 'Initial Prodigy weight θ₀', -5, 5)}{field('target', 'Quadratic target a', -5, 5)}</FlowControls><FlowReadout>The objective is ½(θ−a)² with target <strong>{f(settings.target)}</strong>; {result.rows.length} finite updates end at <strong>{f(result.rows.at(-1)?.after ?? settings.initial, 7)}</strong>. The estimator receives gradients and observed displacements.</FlowReadout></FlowLab>;
  if (view === 'scale') return <FlowLab id="optimizer-prodigy-scale" label="Initial scale and multiplier change the same recurrence">{row && <ProdigyStateDrawing row={row} />}<FlowControls>{field('distance', 'Initial Prodigy scale d₀', 1e-6, .1)}{field('rate', 'Prodigy multiplier γ', .1, 1)}</FlowControls><FlowReadout>At selected update {row?.step ?? 'none'}, the current scale is <strong>{f(row?.distance_used ?? settings.distance, 8)}</strong> and the retained next scale is <strong>{f(row?.distance_next ?? settings.distance, 8)}</strong>. Current d supplies this parameter update.</FlowReadout></FlowLab>;
  if (view === 'chronology') return <FlowLab id="optimizer-prodigy-chronology" label="Inspect the complete adaptation chronology"><NeuralTable caption="All finite states of the current recurrence" headers={['Update', 'θ before', 'g', 'θ after', 'Loss', 'd now', 'd next', 'r', '‖s‖₁']} rows={result.rows.map(current => [current.step, ...['before', 'gradient', 'after', 'loss', 'distance_used', 'distance_next'].map(key => f(current[key], 8)), current.numerator.toExponential(5), current.denominator.toExponential(5)])} />{row && <ProdigyStateDrawing row={row} />}<FlowControls><OptimizerFlowSelect name="Inspect Prodigy update" value={selected} onChange={value => setSelected(Number(value))} options={result.rows.map((current, i) => [i, `Update ${current.step}`])} />{field('steps', 'Number of Prodigy updates', 1, 24, true)}</FlowControls><FlowReadout>{result.stopped ? `The recurrence became nonfinite at update ${result.stopped}; only completed finite states are retained.` : `All ${result.rows.length} computed updates are finite.`} The first retained scale increase is {result.rows.find(current => current.distance_next > current.distance_used + 1e-15)?.step ?? 'absent in this trace'}.</FlowReadout></FlowLab>;
  throw new Error(`Unknown Prodigy reading-flow view ${view}`);
}
export function ProdigyFlowActions() {
  const {
    settings,
    result,
    global,
    pin,
    setPin,
    reset
  } = useRequiredOptimizerCase(AdaptationContext, 'Prodigy actions');
  return <><div className="optimizer-flow-actions"><button onClick={() => setPin({
        settings: structuredClone(settings),
        global: structuredClone(global),
        result: structuredClone(result)
      })}>Pin complete Prodigy case</button><button onClick={reset}>Reset Prodigy case</button></div>{pin && <FlowReadout>Pinned initialization {f(pin.settings.initial)}, target {f(pin.settings.target)}, d₀ {f(pin.settings.distance, 8)} and γ {f(pin.settings.rate)} ended at <strong>{f(pin.result.rows.at(-1)?.after ?? pin.settings.initial, 7)}</strong>; current minus pinned final weight is <strong>{f((result.rows.at(-1)?.after ?? settings.initial) - (pin.result.rows.at(-1)?.after ?? pin.settings.initial), 7)}</strong>. Its two-coordinate contributions remain fixed too.</FlowReadout>}</>;
}
export function OptimizerAveragingFlowProvider({
  children
}) {
  const [settings, setSettings] = useState(() => structuredClone(initialAveraging)),
    [selected, setSelected] = useState(2),
    [pin, setPin] = useState(null),
    [resetToken, setResetToken] = useState(0);
  const [rates, setRates] = useState([.1, .2, .3]),
    [rateIndex, setRateIndex] = useState(0);
  const rows = useMemo(() => scheduleFreeTrace(settings.initial, settings.target, settings.noise, settings.beta, settings.rate), [settings]),
    index = Math.min(selected, rows.length - 1),
    row = rows[index];
  const reset = () => {
    setSettings(structuredClone(initialAveraging));
    setSelected(2);
    setRates([.1, .2, .3]);
    setRateIndex(0);
    setPin(null);
    setResetToken(value => value + 1);
  };
  return <AveragingContext.Provider value={{
    settings,
    setSettings,
    rows,
    row,
    selected: index,
    setSelected,
    pin,
    setPin,
    reset,
    resetToken,
    rates,
    setRates,
    rateIndex,
    setRateIndex
  }}>{children}</AveragingContext.Provider>;
}
export function ScheduleFreeWorkedFlowFigure() {
  const rows = scheduleFreeTrace(2, 0, [1, -1, .5, -.5], .9, .2);
  return <><ScheduleFreePointsDrawing row={rows[2]} /><NeuralTable caption="All four worked post-update averages" headers={['Update', 'y read', 'g', 'New z', 'New x', 'Next y', 'Loss at x']} rows={rows.map(row => [row.step, ...['training', 'gradient', 'fast', 'average', 'nextTraining', 'loss'].map(key => f(row[key], 7))])} /></>;
}
export function ScheduleFreeFlowLab({
  view = 'objective'
}) {
  const state = useRequiredOptimizerCase(AveragingContext, 'Schedule-Free investigation'),
    {
      settings,
      setSettings,
      row,
      rows,
      selected,
      setSelected,
      resetToken
    } = state;
  const field = (key, name, min, max) => <OptimizerFlowNumber name={name} value={settings[key]} min={min} max={max} resetToken={resetToken} onChange={value => setSettings(previous => ({
    ...previous,
    [key]: value
  }))} />;
  const drawing = <ScheduleFreePointsDrawing row={row} beta={settings.beta} rate={settings.rate} />;
  if (view === 'objective') return <FlowLab id="optimizer-averaging-objective" label="One objective supplies the gradient at the interpolation">{drawing}<FlowControls>{field('initial', 'Initial average x = fast z', -5, 5)}{field('target', 'Schedule-Free quadratic target a', -5, 5)}</FlowControls><FlowReadout>The selected gradient reads y=<strong>{f(row.training, 7)}</strong>; the complete sequence ends with evaluation average x=<strong>{f(rows.at(-1).average, 7)}</strong> and fast point z=<strong>{f(rows.at(-1).fast, 7)}</strong>.</FlowReadout></FlowLab>;
  if (view === 'mixing') return <FlowLab id="optimizer-averaging-mixing" label="Interpolation and displacement have different roles">{drawing}<FlowControls>{field('beta', 'Schedule-Free interpolation β', 0, 1)}{field('rate', 'Schedule-Free SGD rate η', 0, .4)}</FlowControls><FlowReadout>At β=<strong>{f(settings.beta)}</strong>, the gradient is read at <strong>{f(row.training, 7)}</strong>, then rate η=<strong>{f(settings.rate)}</strong> moves z from <strong>{f(row.oldFast, 7)}</strong> to <strong>{f(row.fast, 7)}</strong>. Evaluation uses the new x=<strong>{f(row.average, 7)}</strong>.</FlowReadout></FlowLab>;
  if (view === 'perturbation') return <FlowLab id="optimizer-averaging-perturbation" label="Edit one declared gradient perturbation in chronological context">{drawing}<FlowControls><OptimizerFlowSelect name="Inspect Schedule-Free update" value={selected} onChange={value => setSelected(Number(value))} options={rows.map((current, i) => [i, `Update ${current.step}`])} /><OptimizerFlowNumber name="Gradient perturbation at this update" value={settings.noise[selected]} min={-2} max={2} resetToken={resetToken} onChange={value => setSettings(previous => ({
        ...previous,
        noise: previous.noise.map((old, i) => i === selected ? value : old)
      }))} /></FlowControls><FlowReadout>Update {row.step} reads objective gradient <strong>{f(row.training - settings.target, 7)}</strong> plus declared perturbation <strong>{f(settings.noise[selected])}</strong>, making <strong>{f(row.gradient, 7)}</strong>. Later states recompute from this same chronology.</FlowReadout></FlowLab>;
  if (view === 'length') return <FlowLab id="optimizer-averaging-length" label="The average uses every post-update fast point"><NeuralTable caption="Current complete SGD recurrence" headers={['Update', 'y', 'g', 'z next', 'x next', 'Next y', 'Coefficient']} rows={rows.map(current => [current.step, ...['training', 'gradient', 'fast', 'average', 'nextTraining', 'coefficient'].map(key => f(current[key], 7))])} /><div className="optimizer-flow-actions"><button disabled={rows.length >= 12} onClick={() => {
        setSettings(previous => ({
          ...previous,
          noise: [...previous.noise, 0]
        }));
        setSelected(rows.length);
      }}>Append zero perturbation</button><button disabled={rows.length <= 1} onClick={() => {
        setSettings(previous => ({
          ...previous,
          noise: previous.noise.filter((_, i) => i !== selected)
        }));
        setSelected(Math.max(0, selected - 1));
      }}>Remove selected perturbation</button></div><FlowReadout>The complete perturbations are <strong>{optimizerVector(settings.noise)}</strong>. The final averaging coefficient is 1/{rows.length}; removing an update changes the later count and states.</FlowReadout></FlowLab>;
  if (view === 'weights') {
    const {
        rates,
        setRates,
        rateIndex,
        setRateIndex
      } = state,
      total = rates.reduce((sum, value) => sum + value ** 2, 0);
    return <FlowLab id="optimizer-averaging-weights" label="Squared rates determine a separate AdamW averaging instrument"><ScheduleFreeHistoryDrawing rates={rates} /><FlowControls><OptimizerFlowSelect name="Averaging-weight update" value={rateIndex} onChange={value => setRateIndex(Number(value))} options={rates.map((_, i) => [i, `Update ${i + 1}`])} /><OptimizerFlowNumber name="Rate used for this averaging weight" value={rates[rateIndex]} min={0} max={1} resetToken={resetToken} onChange={value => setRates(previous => previous.map((old, i) => i === rateIndex ? value : old))} /></FlowControls><FlowReadout>{total > 0 ? <>Final weights are <strong>{optimizerVector(rates.map(value => value ** 2 / total), 7)}</strong>; each insertion coefficient divides by the sum available at that update.</> : <>All rates are zero: no new-point normalized weight is defined; a running implementation retains its prior average.</>} This instrument is separate from the equal-rate SGD recurrence above.</FlowReadout></FlowLab>;
  }
  throw new Error(`Unknown averaging reading-flow view ${view}`);
}
export function ScheduleFreeFlowActions() {
  const {
    settings,
    rows,
    rates,
    pin,
    setPin,
    reset
  } = useRequiredOptimizerCase(AveragingContext, 'Schedule-Free actions');
  return <><NeuralTable caption="Same objective and perturbations; only interpolation changes" headers={['β', 'Final x', 'Loss at x']} rows={[0, .9, 1].map(beta => {
      const result = scheduleFreeTrace(settings.initial, settings.target, settings.noise, beta, settings.rate).at(-1);
      return [beta, f(result.average, 7), f(result.loss, 7)];
    })} /><div className="optimizer-flow-actions"><button onClick={() => setPin({
        settings: structuredClone(settings),
        rows: structuredClone(rows),
        rates: [...rates]
      })}>Pin complete Schedule-Free case</button><button onClick={reset}>Reset Schedule-Free case</button></div>{pin && <FlowReadout>Pinned perturbations {optimizerVector(pin.settings.noise)} produced x=<strong>{f(pin.rows.at(-1).average, 7)}</strong>; current minus pinned x is <strong>{f(rows.at(-1).average - pin.rows.at(-1).average, 7)}</strong>. Objective, β, rate, all points and separate averaging weights remain retained.</FlowReadout>}</>;
}
const initialMemory = Object.freeze({
  billions: 70,
  buffers: 2,
  bytes: 4,
  ranks: 8,
  shard: 'moments',
  rows: 4096,
  columns: 4096
});
export function OptimizerMemoryFlowProvider({
  children
}) {
  const [settings, setSettings] = useState({
      ...initialMemory
    }),
    [pin, setPin] = useState(null),
    [resetToken, setResetToken] = useState(0);
  const allocations = useMemo(() => [['Model weights', settings.billions * 1e9 * 2, settings.shard === 'all'], ['Gradients', settings.billions * 1e9 * 4, settings.shard === 'all'], ['Optimizer buffers', settings.billions * 1e9 * settings.buffers * settings.bytes, settings.shard !== 'none']].map(([name, total, sharded]) => ({
    name,
    total,
    sharded,
    local: total / (sharded ? settings.ranks : 1)
  })), [settings]);
  return <MemoryContext.Provider value={{
    settings,
    setSettings,
    allocations,
    pin,
    setPin,
    resetToken,
    reset: () => {
      setSettings({
        ...initialMemory
      });
      setPin(null);
      setResetToken(value => value + 1);
    }
  }}>{children}</MemoryContext.Provider>;
}
export function OptimizerMemoryFlowLab({
  view = 'payload'
}) {
  const {
    settings,
    setSettings,
    allocations,
    resetToken
  } = useRequiredOptimizerCase(MemoryContext, 'Tensor-payload investigation');
  const field = (key, name, min, max, integer = false) => <OptimizerFlowNumber name={name} value={settings[key]} min={min} max={max} integer={integer} resetToken={resetToken} onChange={value => setSettings(previous => ({
    ...previous,
    [key]: value
  }))} />;
  const choice = (key, name, options) => <OptimizerFlowSelect name={name} value={settings[key]} options={options} onChange={value => setSettings(previous => ({
    ...previous,
    [key]: key === 'shard' ? value : Number(value)
  }))} />;
  if (view === 'payload') return <FlowLab id="optimizer-memory-payload" label="Count parameter-sized buffers with their chosen entry width"><OptimizerMemoryDrawing allocations={allocations} ranks={settings.ranks} global /><FlowControls>{field('billions', 'Billions of model parameters', .001, 1000)}{choice('buffers', 'Additional parameter-sized buffers', [[1, '1: Lion'], [2, '2: AdamW / Sophia / compact Schedule-Free'], [3, '3: readable Schedule-Free'], [4, '4: paper Prodigy']])}{choice('bytes', 'Bytes per optimizer-buffer entry', [[2, '2 bytes'], [4, '4 bytes: FP32'], [8, '8 bytes: classroom float64']])}</FlowControls><FlowReadout>The global optimizer-buffer payload is <strong>{f(settings.billions * settings.buffers * settings.bytes, 3)} GB</strong>, separate from BF16 weights and FP32 gradients. No activation, workspace or master-copy size is specified.</FlowReadout></FlowLab>;
  if (view === 'ownership') return <FlowLab id="optimizer-memory-ownership" label="Divide only the arrays that have distributed owners"><OptimizerMemoryDrawing allocations={allocations} ranks={settings.ranks} /><FlowControls>{field('ranks', 'Number of sharding ranks', 1, 128, true)}{choice('shard', 'Arrays evenly sharded', [['none', 'None: every listed array replicated'], ['moments', 'Optimizer buffers only'], ['all', 'All three listed allocations']])}</FlowControls><NeuralTable caption="Global and one-rank payload" headers={['Array', 'Global GB', 'Per-rank GB', 'Per-rank GiB']} rows={allocations.map(row => [row.name, f(row.total / 1e9, 3), f(row.local / 1e9, 3), f(row.local / 2 ** 30, 3)])} /><FlowReadout>The listed one-rank sum is <strong>{f(allocations.reduce((sum, row) => sum + row.local, 0) / 1e9, 3)} GB</strong>; replicated arrays stay whole as ranks change.</FlowReadout></FlowLab>;
  if (view === 'shape') return <FlowLab id="optimizer-memory-factors" label="Compare dense entries with row and column factor lengths"><OptimizerFlowFactorShape rows={settings.rows} columns={settings.columns} /><FlowControls>{field('rows', 'Weight-matrix rows n', 1, 16384, true)}{field('columns', 'Weight-matrix columns m', 1, 16384, true)}</FlowControls><FlowReadout>One dense FP32 second-moment array requires <strong>{(4 * settings.rows * settings.columns).toLocaleString()} bytes</strong>; its two factor arrays require <strong>{(4 * (settings.rows + settings.columns)).toLocaleString()} bytes</strong>. This counts these arrays only.</FlowReadout></FlowLab>;
  throw new Error(`Unknown memory reading-flow view ${view}`);
}
function OptimizerFlowFactorShape({
  rows,
  columns
}) {
  return <OptimizerFactorShapeDrawing rows={rows} columns={columns} />;
}
export function OptimizerMemoryFlowActions() {
  const {
      settings,
      allocations,
      pin,
      setPin,
      reset
    } = useRequiredOptimizerCase(MemoryContext, 'Memory actions'),
    total = allocations.reduce((sum, row) => sum + row.local, 0);
  return <><div className="optimizer-flow-actions"><button onClick={() => setPin({
        settings: {
          ...settings
        },
        total
      })}>Pin complete allocation case</button><button onClick={reset}>Reset allocation case</button></div>{pin && <FlowReadout>Pinned listed per-rank payload was <strong>{f(pin.total / 1e9, 3)} GB</strong>; current minus pinned is <strong>{f((total - pin.total) / 1e9, 3)} GB</strong>. All buffer, dtype, rank, ownership and factor-shape inputs stay recorded.</FlowReadout>}</>;
}
export function HessianProbeFlowActions() {
  const state = useRequiredOptimizerCase(ProbeContext, 'Hessian probe actions');
  return <><div className="optimizer-flow-actions"><button onClick={() => state.setProbePin({
        matrix: [...state.matrix],
        probe: state.probe,
        estimate: [...state.probes.values[state.probe].estimate]
      })}>Pin complete probe case</button><button onClick={() => {
        state.setMatrix([4, -2, 1]);
        state.setProbe(0);
        state.setProbePin(null);
        state.setResetToken(value => value + 1);
      }}>Reset Hessian probe</button></div>{state.probePin && <FlowReadout>The pinned matrix entries {optimizerVector(state.probePin.matrix)} and probe {optimizerVector(state.probes.values[state.probePin.probe].u)} gave <strong>{optimizerVector(state.probePin.estimate)}</strong>; the current selected estimate is <strong>{optimizerVector(state.probes.values[state.probe].estimate)}</strong>.</FlowReadout>}</>;
}
export function SampledCurvatureFlowLab({
  view = 'example'
}) {
  const {
    sample,
    setSample,
    example,
    setExample,
    enumeration,
    resetToken
  } = useRequiredOptimizerCase(SampleContext, 'Sampled curvature');
  const edit = (name, value) => setSample(previous => ({
    ...previous,
    [name]: previous[name].map((old, i) => i === example ? value : old)
  }));
  const selector = <OptimizerFlowSelect name="Selected curvature example" value={example} onChange={value => setExample(Number(value))} options={[[0, 'Example 1'], [1, 'Example 2']]} />;
  if (view === 'example') return <FlowLab id="optimizer-sampled-example" label="Change an example's feature and current model probability"><SampledBatchDrawing inputs={sample.inputs} probabilities={sample.probabilities} labels={sample.labels} /><FlowControls>{selector}<OptimizerFlowNumber name="Feature x of this example" value={sample.inputs[example]} min={-5} max={5} step={.1} resetToken={resetToken} onChange={value => edit('inputs', value)} /><OptimizerFlowNumber name="Current class-1 probability p" value={sample.probabilities[example]} min={.01} max={.99} step={.01} resetToken={resetToken} onChange={value => edit('probabilities', value)} /></FlowControls><FlowReadout>The batch-scaled sampled expectation is <strong>{f(enumeration.expectation, 8)}</strong>, equal to analytic mean curvature <strong>{f(enumeration.exact, 8)}</strong>. Both examples remain in every leaf.</FlowReadout></FlowLab>;
  if (view === 'target') return <FlowLab id="optimizer-sampled-target" label="Real labels change training residuals without changing the curvature expectation"><OptimizerSignedRulers label="The current true-label mean derivative is a separate calculation" description={`Current two-example true derivatives ${sample.inputs.map((x, i) => x * (sample.probabilities[i] - sample.labels[i])).join(',')}; their mean ${sample.inputs.reduce((total, x, i) => total + x * (sample.probabilities[i] - sample.labels[i]), 0) / 2}. The sampled curvature expectation depends on inputs and probabilities, not these true labels.`} rows={sample.inputs.map((x, i) => ({
      name: `example ${i + 1}; target ${sample.labels[i]}`,
      points: [{
        name: 'g',
        value: x * (sample.probabilities[i] - sample.labels[i]),
        role: 'derivative'
      }]
    }))} /><FlowControls>{selector}<OptimizerFlowSelect name="Real label of this example" value={sample.labels[example]} onChange={value => edit('labels', Number(value))} options={[[0, 'Class 0'], [1, 'Class 1']]} /></FlowControls><FlowReadout>The real-label mean gradient squared is <strong>{f(enumeration.trueSquare, 8)}</strong>; the unchanged model-sampled expectation is <strong>{f(enumeration.expectation, 8)}</strong>.</FlowReadout></FlowLab>;
  if (view === 'enumeration') return <><NeuralTable caption="Every current independent label-pair outcome" headers={['Sample pair', 'Probability', 'Mean ĝ', 'Nĝ²', 'Weighted term']} rows={enumeration.outcomes.map(row => [optimizerVector(row.sampled), ...['probability', 'gradient', 'estimate', 'contribution'].map(key => f(row[key], 8))])} /><FlowReadout>These four weighted terms sum to <strong>{f(enumeration.expectation, 8)}</strong>; omitting N=2 gives <strong>{f(enumeration.expectation / 2, 8)}</strong>, while real-label squared mean is <strong>{f(enumeration.trueSquare, 8)}</strong>.</FlowReadout></>;
  throw new Error(`Unknown sampled curvature view: ${view}`);
}
export function SampledCurvatureFlowActions() {
  const state = useRequiredOptimizerCase(SampleContext, 'Sampled curvature actions');
  return <><div className="optimizer-flow-actions"><button onClick={() => state.setSamplePin({
        inputs: structuredClone(state.sample),
        expectation: state.enumeration.expectation,
        trueSquare: state.enumeration.trueSquare
      })}>Pin complete sampled-label case</button><button onClick={() => {
        state.setSample({
          inputs: [3, 1],
          probabilities: [.25, .6],
          labels: [1, 0]
        });
        state.setExample(0);
        state.setSamplePin(null);
        state.setResetToken(value => value + 1);
      }}>Reset sampled-label case</button></div>{state.samplePin && <FlowReadout>The pinned features {optimizerVector(state.samplePin.inputs.inputs)}, probabilities {optimizerVector(state.samplePin.inputs.probabilities)} and true labels {optimizerVector(state.samplePin.inputs.labels)} gave expectation <strong>{f(state.samplePin.expectation, 8)}</strong> and real-label squared mean <strong>{f(state.samplePin.trueSquare, 8)}</strong>. Current expectation differs by <strong>{f(state.enumeration.expectation - state.samplePin.expectation, 8)}</strong>.</FlowReadout>}</>;
}
