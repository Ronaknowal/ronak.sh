import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { OptimizerFlowSelect } from './AdvancedOptimizerFlowLabs.jsx';
import { OptimizerFlowDrawing, OptimizerFlowText, OptimizerFlowCell, OptimizerFlowWire, OptimizerTraceDrawing, optimizerFlowColors as color, optimizerVector } from './AdvancedOptimizerFlowFigures.jsx';
import { digitUpdate, digitProbabilities } from '../../data/advanced-optimizer-models.js';
import { optimizerDigits as optimizerReadingDigits } from '../../data/advanced-optimizer-study.js';
import './advanced-optimizer-flow.css';
const assetBase = '/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/';
const methods = [['adamw', 'AdamW constant'], ['adamw_cosine', 'AdamW warmup + cosine'], ['lion', 'Lion'], ['sophia_g', 'Sophia-G paper-scaled'], ['prodigy', 'Prodigy paper Algorithm 4'], ['schedule_free', 'Schedule-Free AdamW']];
const shortNames = {
  adamw: 'constant AdamW',
  adamw_cosine: 'cosine AdamW',
  lion: 'Lion',
  sophia_g: 'Sophia-G',
  prodigy: 'paper Prodigy',
  schedule_free: 'Schedule-Free'
};
const assetPromises = new Map();
function loadOptimizerAsset(file) {
  if (!assetPromises.has(file)) {
    const request = fetch(assetBase + file).then(async response => {
      if (!response.ok) throw new Error('Saved asset unavailable.');
      const data = await response.json();
      if (file === 'histories.json') {
        if (!Array.isArray(data.runs) || data.runs.length !== 24 || data.runs.some(run => !Array.isArray(run.curve) || !run.curve.length)) throw new Error('Saved history shape is invalid.');
      } else {
        const match = /^model-(.+)-(11|29)\.json$/.exec(file);
        if (!match || data.method !== match[1] || data.seed !== Number(match[2]) || data.parameters?.length !== 65 || data.parameters.some(row => row.length !== 10 || row.some(value => !Number.isFinite(value))) || data.state?.step !== 400) throw new Error('Saved state identity or shape is invalid.');
      }
      return data;
    }).catch(error => {
      assetPromises.delete(file);
      throw error;
    });
    assetPromises.set(file, request);
  }
  return assetPromises.get(file);
}
function useSavedOptimizerAsset(file, enabled) {
  const [stored, setStored] = useState(null),
    [failure, setFailure] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let current = true;
    setFailure(null);
    loadOptimizerAsset(file).then(data => {
      if (current) setStored({
        file,
        data
      });
    }).catch(error => {
      if (current) setFailure({
        file,
        message: error.message
      });
    });
    return () => {
      current = false;
    };
  }, [file, enabled, attempt]);
  return {
    enabled,
    value: stored?.file === file ? stored.data : null,
    failed: failure?.file === file,
    retry: () => setAttempt(value => value + 1)
  };
}
function useNearOptimizerAsset() {
  const container = useRef(null),
    [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setEnabled(true);
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setEnabled(true);
        observer.disconnect();
      }
    }, {
      rootMargin: '240px'
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return {
    container,
    enabled
  };
}
function SavedOptimizerStatus({
  resource,
  label
}) {
  if (resource.failed) return <p role="alert">The saved {label} could not be loaded. Your current edits are retained. <button className="optimizer-flow-retry" onClick={resource.retry}>Retry saved {label}</button></p>;
  if (!resource.value) return <p role="status">{resource.enabled ? `Loading the saved ${label}; calculations will use the latest current inputs.` : `The saved ${label} loads here when this explanation approaches the viewport.`}</p>;
  return null;
}
export function OptimizerDigitDrawing({
  pixels,
  selected = 28,
  source = 312
}) {
  return <OptimizerFlowDrawing label={`Actual 8 by 8 digit from source ${source}`} description={`Recorded class 0, source ${source}. All 64 raw intensities in row-major order are ${pixels.join(',')}. Selected pixel ${selected}, row ${Math.floor(selected / 8)}, column ${selected % 8}, raw ${pixels[selected]}; normalized ${pixels[selected] / 16}. Grayscale is raw intensity and white outline is inspection, not learned weight.`} height={349}>
    <OptimizerFlowText x={15} y={18}>source {source}; recorded class 0</OptimizerFlowText>
    {Array.from({
      length: 8
    }, (_, i) => <g key={i}><OptimizerFlowText x={55 + i * 30} y={47} anchor="middle">{i}</OptimizerFlowText><OptimizerFlowText x={23} y={73 + i * 30} anchor="middle">{i}</OptimizerFlowText></g>)}
    {pixels.map((value, i) => {
      const shade = Math.round(18 + value / 16 * 222),
        x = 40 + i % 8 * 30,
        y = 54 + Math.floor(i / 8) * 30;
      return <g key={i}><rect x={x} y={y} width={29} height={29} fill={`rgb(${shade},${shade},${shade})`} stroke={i === selected ? '#fff' : '#444'} strokeWidth={i === selected ? 2 : 1} /><OptimizerFlowText x={x + 14.5} y={y + 19} anchor="middle" color={value > 8 ? '#070707' : '#fff'}>{value}</OptimizerFlowText></g>;
    })}
    <OptimizerFlowText x={15} y={318}>pixel {selected}: raw {pixels[selected]} ÷16 = {f(pixels[selected] / 16)}</OptimizerFlowText><OptimizerFlowText x={15} y={336}>row {Math.floor(selected / 8)}; column {selected % 8}; white = selected</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function OptimizerFullMapDrawing({
  snapshot,
  pixels,
  selected = 18
}) {
  const forward = digitProbabilities(pixels, snapshot.parameters),
    maximum = Math.max(...snapshot.parameters.flat().map(Math.abs), 1e-12),
    start = 80;
  return <OptimizerFlowDrawing label="All 65 features feed the actual 65 by 10 learned map" description={`Actual complete 650 parameters. Each of 65 feature rows multiplies its 10 learned weights and each column sums 65 terms. Pixel ${selected} is enlarged into signed actual weight values; grayscale is input intensity, amber magnitude is absolute weight, not its sign. Full scores ${forward.scores.join(',')}.`} height={715}>{({
      forward: marker
    }) => <>
    <OptimizerFlowText x={15} y={18}>65 features → 65×10 weights → 10 scores</OptimizerFlowText><OptimizerFlowText x={15} y={48} color={color.input}>64 pixels /16, then separate bias 1</OptimizerFlowText>
    {forward.features.map((value, i) => <rect key={i} x={30} y={start + i * 4} width={24} height={3.8} fill={color.input} opacity={.15 + .85 * Math.abs(value)} />)}
    {snapshot.parameters.map((row, i) => row.map((value, j) => <rect key={`${i}-${j}`} x={104 + j * 15} y={start + i * 4} width={14} height={3.8} fill={color.parameter} opacity={.12 + .88 * Math.abs(value) / maximum} />))}
    {Array.from({
        length: 10
      }, (_, j) => <OptimizerFlowText key={j} x={111 + j * 15} y={70} anchor="middle">{j}</OptimizerFlowText>)}
    <OptimizerFlowWire from={[54, start + selected * 4 + 2]} to={[104, start + selected * 4 + 2]} marker={marker} /><rect x={29} y={start + selected * 4 - .5} width={226} height={5} fill="none" stroke="#fff" />
    <OptimizerFlowText x={265} y={100}>sum</OptimizerFlowText><OptimizerFlowText x={265} y={124}>65 terms</OptimizerFlowText><OptimizerFlowText x={265} y={166}>per class</OptimizerFlowText><OptimizerFlowWire from={[254, 207]} to={[303, 207]} marker={marker} /><OptimizerFlowText x={300} y={244} anchor="middle" color={color.computed}>z₀…z₉</OptimizerFlowText>
    <OptimizerFlowText x={15} y={371}>last row is bias, not an extra pixel</OptimizerFlowText><OptimizerFlowText x={15} y={399}>amber shade = |weight|; signs below</OptimizerFlowText>
    <OptimizerFlowWire from={[256, start + selected * 4 + 2]} to={[316, 435]} bend={[[333, start + selected * 4 + 2], [333, 435]]} marker={marker} /><OptimizerFlowText x={15} y={462}>enlarged pixel {selected} row; x={f(forward.features[selected])}</OptimizerFlowText>
    {snapshot.parameters[selected].map((value, j) => <g key={j}><OptimizerFlowText x={51 + j % 5 * 65} y={496 + Math.floor(j / 5) * 77} anchor="middle">class {j}</OptimizerFlowText><OptimizerFlowCell x={22 + j % 5 * 65} y={508 + Math.floor(j / 5) * 77} width={58} value={f(value, 3)} role="parameter" /></g>)}
    <OptimizerFlowText x={15} y={672}>one row enlarged; complete map above</OptimizerFlowText><OptimizerFlowText x={15} y={707}>each score sums every feature and bias</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerGradientDrawing({
  result,
  pixel,
  target
}) {
  const x = result.training.features[pixel];
  return <OptimizerFlowDrawing label="One actual input multiplies all ten class residuals" description={`Selected feature ${pixel}, value ${x}, target ${target}. All 10 training probabilities, residuals and weight derivatives are explicitly drawn. Other features and bias are still used in the full prediction; this is one selected parameter row.`} height={10 * 112 + 97}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={15} y={18} color={color.input}>feature {pixel}: x={f(x)}; target {target}</OptimizerFlowText><OptimizerFlowText x={15} y={49}>one weight derivative per class</OptimizerFlowText>
    {result.training.probabilities.map((p, j) => <g key={j}><OptimizerFlowText x={15} y={83 + j * 112}>class {j}: P={f(p, 6)}; Y={Number(j === target)}</OptimizerFlowText><OptimizerFlowText x={15} y={131 + j * 112} color={color.derivative}>P−Y={f(p - Number(j === target), 6)}</OptimizerFlowText><OptimizerFlowWire from={[133, 127 + j * 112]} to={[169, 127 + j * 112]} marker={forward} /><circle cx={182} cy={127 + j * 112} r={13} fill="none" stroke={color.operator} /><OptimizerFlowText x={182} y={132 + j * 112} anchor="middle">×</OptimizerFlowText><OptimizerFlowText x={182} y={103 + j * 112} anchor="middle" color={color.input}>x</OptimizerFlowText><OptimizerFlowWire from={[182, 107 + j * 112]} to={[182, 114 + j * 112]} marker={forward} /><OptimizerFlowWire from={[195, 127 + j * 112]} to={[216, 127 + j * 112]} marker={forward} /><OptimizerFlowText x={224} y={131 + j * 112} color={color.derivative}>{f(result.gradient[pixel][j], 6)}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={10 * 112 + 79}>bias uses 1; zero pixel only zeros its own row</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerDataRolesDrawing() {
  return <OptimizerFlowDrawing label="Fitting, validation selection and assessment have distinct directions" description="240 fitting records supply updates. All 6 methods times 2 scales times 2 seeds yield 24 fits. 80 validation records choose one scale per method using mean final cross-entropy across seeds. 80 assessment records report 12 selected states. There is no assessment-to-tuning arrow." height={498}>{({
      forward
    }) => <>
    {[[240, 'fitting rows', 'parameter updates'], [80, 'validation rows', 'choose scale'], [80, 'assessment rows', 'report states']].map(([count, name, destination], i) => <g key={name}><OptimizerFlowText x={15} y={24 + i * 127} color={color.input}>{count} {name}</OptimizerFlowText>{Array.from({
          length: Math.min(count / 10, 24)
        }, (_, j) => <circle key={j} cx={22 + j % 12 * 11} cy={45 + i * 127 + Math.floor(j / 12) * 12} r={3} fill={color.input} />)}<OptimizerFlowWire from={[150, 45 + i * 127]} to={[198, 45 + i * 127]} marker={forward} /><OptimizerFlowText x={209} y={50 + i * 127}>{destination}</OptimizerFlowText><OptimizerFlowText x={15} y={93 + i * 127}>each dot represents 10 records</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={417}>6 methods × 2 scales × 2 seeds = 24 fits</OptimizerFlowText><OptimizerFlowText x={15} y={451}>validation selects; assessment never tunes</OptimizerFlowText><OptimizerFlowText x={15} y={481}>historical subset; not official benchmark</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
function OptimizerProbabilityDrawing({
  before,
  after
}) {
  return <OptimizerFlowDrawing label="Every class probability uses the same zero-to-one scale" description={`All 10 probabilities before ${before} and after ${after}. Gray before and violet after bars both start at zero and use the full probability range 0 to 1.`} height={10 * 63 + 78}>
    <OptimizerFlowText x={15} y={18}>all classes; both bars share [0,1]</OptimizerFlowText>
    {before.map((p, j) => <g key={j}><OptimizerFlowText x={15} y={49 + j * 63}>class {j}</OptimizerFlowText><rect x={85} y={37 + j * 63} width={230 * p} height={7} fill={color.operator} /><rect x={85} y={48 + j * 63} width={230 * after[j]} height={7} fill={color.computed} /><OptimizerFlowText x={85} y={79 + j * 63}>{f(p, 7)} → {f(after[j], 7)}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={10 * 63 + 60}>gray before; violet after; endpoints 0 and 1</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
const initialDiagnosticPixels = () => {
  const pixels = [...optimizerReadingDigits[312].pixels];
  pixels[28] = 16;
  return pixels;
};
const StudyContext = createContext(null);
export function AdvancedOptimizerStudyFlowProvider({
  children
}) {
  const [method, setMethod] = useState('adamw'),
    [seed, setSeed] = useState(11),
    [pixels, setPixels] = useState(initialDiagnosticPixels),
    [pixel, setPixel] = useState(28),
    [target, setTarget] = useState(0),
    [representation, setRepresentation] = useState('evaluation'),
    [coordinate, setCoordinate] = useState(28),
    [pin, setPin] = useState(null);
  const liveNear = useNearOptimizerAsset(),
    workedNear = useNearOptimizerAsset();
  const resource = useSavedOptimizerAsset(`model-${method}-${seed}.json`, liveNear.enabled),
    worked = useSavedOptimizerAsset('model-adamw-11.json', workedNear.enabled);
  const result = useMemo(() => resource.value ? digitUpdate(resource.value, pixels, target) : null, [resource.value, pixels, target]);
  const workedResult = useMemo(() => worked.value ? digitUpdate(worked.value, optimizerReadingDigits[277].pixels, 0) : null, [worked.value]);
  const evaluation = method !== 'schedule_free' || representation === 'evaluation';
  const before = result ? evaluation ? result.before : result.training : null,
    after = result ? evaluation ? result.after : digitProbabilities(pixels, result.next.parameters) : null;
  const reset = () => {
    setMethod('adamw');
    setSeed(11);
    setPixels(initialDiagnosticPixels());
    setPixel(28);
    setCoordinate(28);
    setTarget(0);
    setRepresentation('evaluation');
    setPin(null);
  };
  return <StudyContext.Provider value={{
    method,
    setMethod,
    seed,
    setSeed,
    pixels,
    setPixels,
    pixel,
    setPixel,
    target,
    setTarget,
    representation,
    setRepresentation,
    coordinate,
    setCoordinate,
    pin,
    setPin,
    reset,
    resource,
    worked,
    result,
    workedResult,
    before,
    after,
    liveNear,
    workedNear,
    evaluation
  }}>{children}</StudyContext.Provider>;
}
function useOptimizerStudy() {
  const value = useContext(StudyContext);
  if (!value) throw new Error('Optimizer study needs its reading-flow provider.');
  return value;
}
export function OptimizerWorkedStudyFlow({
  view = 'image'
}) {
  const {
      worked,
      workedNear,
      workedResult
    } = useOptimizerStudy(),
    digit = optimizerReadingDigits[277];
  if (view === 'image') return <OptimizerDigitDrawing pixels={digit.pixels} selected={18} source={277} />;
  if (view === 'model') return <div ref={workedNear.container}><SavedOptimizerStatus resource={worked} label="worked AdamW model" />{worked.value && <><OptimizerFullMapDrawing snapshot={worked.value} pixels={digit.pixels} /><NeuralTable caption="Full worked scores sum all65 features" headers={['Class', 'Full score', 'Probability', 'Bias weight']} rows={workedResult.training.probabilities.map((p, j) => [j, f(workedResult.training.scores[j], 8), f(p, 8), f(worked.value.parameters[64][j], 8)])} /></>}</div>;
  if (view === 'gradient') return workedResult ? <><OptimizerGradientDrawing result={workedResult} pixel={18} target={0} /><NeuralTable caption="Separate bias row uses feature1" headers={['Class', 'Bias gradient', 'Pixel18 gradient']} rows={workedResult.gradient[64].map((value, j) => [j, f(value, 9), f(workedResult.gradient[18][j], 9)])} /></> : <FlowReadout>The worked pixel paths will use the saved AdamW model when it is available above.</FlowReadout>;
  throw new Error(`Unknown worked study view ${view}`);
}
export function OptimizerDigitFlowLab({
  view = 'image'
}) {
  const state = useOptimizerStudy(),
    {
      method,
      setMethod,
      seed,
      setSeed,
      pixels,
      setPixels,
      pixel,
      setPixel,
      target,
      setTarget,
      resource,
      result,
      before,
      after,
      coordinate,
      setCoordinate,
      representation,
      setRepresentation,
      evaluation
    } = state;
  if (view === 'image') return <>
    <FlowLab id="optimizer-study-edit" label="Edit any pixel of one real input without fitting">
      <OptimizerDigitDrawing pixels={pixels} selected={pixel} />
      <FlowControls>
        <FlowSlider name="Selected zero-based pixel" value={pixel} min={0} max={63} step={1} onChange={setPixel} />
        <FlowSlider name="Raw pixel intensity" value={pixels[pixel]} min={0} max={16} step={1} onChange={value => setPixels(previous => previous.map((old, i) => i === pixel ? value : old))} />
      </FlowControls>
      <FlowReadout>Pixel {pixel}, row {Math.floor(pixel / 8)}, column {pixel % 8}, supplies <strong>{f(pixels[pixel] / 16)}</strong> after normalization. Source312's recorded class remains0; current target is {target}.</FlowReadout>
    </FlowLab>
    <div ref={state.liveNear.container}>
      <SavedOptimizerStatus resource={resource} label="selected optimizer state" />
      <FlowLab id="optimizer-study-snapshot" label="Choose one complete retained method and seed state">
        {result && <OptimizerProbabilityDrawing before={before.probabilities} after={after.probabilities} />}
        <FlowControls>
          <OptimizerFlowSelect name="Saved optimizer method" value={method} onChange={setMethod} options={methods} />
          <OptimizerFlowSelect name="Saved optimizer seed" value={seed} onChange={value => setSeed(Number(value))} options={[[11, 'Seed 11'], [29, 'Seed 29']]} />
        </FlowControls>
        <FlowReadout>{result ? <>{shortNames[method]} seed {seed} starts at saved update 400; the diagnostic uses actual rate <strong>{f(result.next.diagnostics.rate, 8)}</strong> and all 650 parameters. Class0 changes from <strong>{f(before.probabilities[0], 9)}</strong> to <strong>{f(after.probabilities[0], 9)}</strong>.</> : <>Selected {shortNames[method]} seed {seed} is pending; all current pixels, target and selection remain editable.</>}</FlowReadout>
      </FlowLab>
    </div>
  </>;
  if (view === 'target') return <FlowLab id="optimizer-study-target" label="Change the temporary objective while retaining recorded source truth">{result && <OptimizerGradientDrawing result={result} pixel={pixel} target={target} />}<FlowControls><OptimizerFlowSelect name="Diagnostic target class" value={target} onChange={value => setTarget(Number(value))} options={Array.from({
        length: 10
      }, (_, i) => [i, `Class ${i}`])} /></FlowControls><FlowReadout>{result ? <>The forward probabilities do not read target {target}; its one-hot residual produces gradient row <strong>{optimizerVector(result.gradient[pixel], 7)}</strong>. Recorded truth is still class 0.</> : <>The current target {target} is retained while the selected saved model loads.</>}</FlowReadout></FlowLab>;
  if (view === 'coordinate') return <FlowLab id="optimizer-study-coordinate" label="Read one complete row of the saved and updated optimizer state">{result && <><NeuralTable caption={`Feature ${coordinate}: all 10 weight cells and gradients`} headers={['Class', 'Old θ', 'Gradient', 'New θ']} rows={result.gradient[coordinate].map((value, j) => [j, f(resource.value.parameters[coordinate][j], 8), value.toExponential(5), f(result.next.parameters[coordinate][j], 8)])} /><NeuralTable caption="All persisted arrays and scalars keep their actual roles" headers={['State', 'Before', 'After']} rows={Object.keys(resource.value.state).map(key => [key, Array.isArray(resource.value.state[key]) ? optimizerVector(resource.value.state[key][coordinate], 7) : String(resource.value.state[key]), Array.isArray(result.next.state[key]) ? optimizerVector(result.next.state[key][coordinate], 7) : String(result.next.state[key])])} /></>}<FlowControls><FlowSlider name="Inspect parameter feature row" value={coordinate} min={0} max={64} step={1} onChange={setCoordinate} /></FlowControls><FlowReadout>{coordinate === 64 ? 'Feature 64 is the constant bias 1.' : `Feature ${coordinate} is raw pixel ${coordinate} divided by 16.`} {result ? <>The copied state advances from update {resource.value.state.step} to {result.next.state.step}; all other coordinates participate too.</> : <>This coordinate selection is retained while the selected state is unavailable.</>}</FlowReadout></FlowLab>;
  if (view === 'representation') return <FlowLab id="optimizer-study-representation" label="Keep the gradient location distinct from the reported model">{result && <OptimizerProbabilityDrawing before={before.probabilities} after={after.probabilities} />}<FlowControls>{method === 'schedule_free' && <OptimizerFlowSelect name="Schedule-Free displayed representation" value={representation} onChange={setRepresentation} options={[['evaluation', 'Evaluation average x'], ['training', 'Training interpolation y']]} />}</FlowControls><FlowReadout>{!result ? 'The chosen representation is retained during state loading.' : method === 'schedule_free' ? `The gradient still reads training y; these displayed probabilities read ${evaluation ? 'evaluation x' : 'training y'}.` : method === 'adamw_cosine' ? 'The frozen cosine horizon supplies rate 0 at update 401: parameters and probabilities remain unchanged while moments can update.' : 'This method has one current parameter representation for training and evaluation.'}</FlowReadout></FlowLab>;
  if (view === 'probabilities') {
    const delta = result ? after.probabilities.map((value, j) => value - before.probabilities[j]) : [],
      largest = Math.max(0, ...delta.map(Math.abs)),
      exponent = largest === 0 ? 0 : Math.floor(Math.log10(largest)),
      unit = 10 ** exponent;
    return result ? <><OptimizerTraceDrawing label="The actual probability difference has a separate enlarged scale" description={`Actual signed deltas ${delta}. One vertical unit is ${unit} probability; full probabilities remain on 0 to 1 above. Class IDs are separate categories, so isolated points—not interpolated class measurements—are displayed.`} xLabel="class ID (separate categories)" yLabel={`Δprobability / 10^${exponent}`} zero xTicks={Array.from({
        length: 10
      }, (_, j) => j)} series={[{
        name: 'actual change for each labelled class',
        connect: false,
        points: delta.map((value, j) => [j, value / unit])
      }]} /><NeuralTable caption="Full probabilities and unscaled signed changes" headers={['Class', 'Before', 'After', 'After − before']} rows={before.probabilities.map((value, j) => [j, f(value, 10), f(after.probabilities[j], 10), delta[j].toExponential(6)])} /><FlowReadout>One plotted vertical unit represents <strong>{unit.toExponential(0)}</strong> probability. {largest === 0 ? 'Every actual difference is zero.' : 'The difference scale enlarges small changes without altering either original probability.'}</FlowReadout></> : <FlowReadout>The full probability and change table awaits the selected state; current edits stay retained.</FlowReadout>;
  }
  throw new Error(`Unknown optimizer digit view ${view}`);
}
export function OptimizerStudyFlowActions() {
  const {
    method,
    seed,
    pixels,
    target,
    result,
    before,
    after,
    pin,
    setPin,
    reset,
    representation
  } = useOptimizerStudy();
  return <><div className="optimizer-flow-actions"><button disabled={!result} onClick={() => setPin({
        method,
        seed,
        pixels: [...pixels],
        target,
        representation,
        result: structuredClone(result),
        before: structuredClone(before),
        after: structuredClone(after)
      })}>Pin complete digit diagnostic</button><button onClick={reset}>Reset complete digit diagnostic</button></div>{pin && <FlowReadout>Pinned {shortNames[pin.method]} seed {pin.seed}, target {pin.target}, all 64 pixels and its complete resulting state remain fixed. Its class 0 after-probability is <strong>{f(pin.after.probabilities[0], 10)}</strong>; current minus pinned is <strong>{result ? (after.probabilities[0] - pin.after.probabilities[0]).toExponential(6) : 'pending the latest snapshot'}</strong>.</FlowReadout>}</>;
}
const HistoryContext = createContext(null);
export function OptimizerHistoryFlowProvider({
  children
}) {
  const near = useNearOptimizerAsset(),
    resource = useSavedOptimizerAsset('histories.json', near.enabled),
    [candidate, setCandidate] = useState(0),
    [axis, setAxis] = useState('linear'),
    [seed, setSeed] = useState(11);
  return <HistoryContext.Provider value={{
    near,
    resource,
    candidate,
    setCandidate,
    axis,
    setAxis,
    seed,
    setSeed
  }}>{children}</HistoryContext.Provider>;
}
export function OptimizerHistoryFlow({
  view = 'loss'
}) {
  const state = useContext(HistoryContext);
  if (!state) throw new Error('Optimizer histories need their provider.');
  const {
      near,
      resource,
      candidate,
      setCandidate,
      axis,
      setAxis,
      seed,
      setSeed
    } = state,
    data = resource.value,
    run = data?.runs[candidate],
    transform = value => axis === 'log' ? Math.log10(value) : value;
  const lossLabel = axis === 'log' ? 'log10 cross-entropy' : 'cross-entropy (nats/example)';
  const lossDomain = data && axis === 'linear' ? [0, Math.max(...data.runs.flatMap(current => current.curve.flatMap(point => [point.fit.cross_entropy, point.validation.cross_entropy]))) * 1.05] : undefined;
  if (view === 'loss') return <div ref={near.container}><SavedOptimizerStatus resource={resource} label="24-candidate histories" />{data && <FlowLab id="optimizer-study-histories" label="Inspect all measured candidates on a stated loss axis"><OptimizerTraceDrawing label="Recorded fitting and validation loss for one declared candidate" description={`${run.method}, scale ${run.rate}, seed ${run.seed}; actual saved points only,${lossLabel}.`} yLabel={lossLabel} yDomain={lossDomain} series={['fit', 'validation'].map((key, i) => ({
        name: key === 'fit' ? 'fitting loss' : 'validation loss',
        role: 'computed',
        dash: i ? '5 4' : undefined,
        points: run.curve.map(point => [point.step, transform(point[key].cross_entropy)])
      }))} /><FlowControls><OptimizerFlowSelect name="Recorded optimizer candidate" value={candidate} onChange={value => setCandidate(Number(value))} options={data.runs.map((current, i) => [i, `${shortNames[current.method]}, ${current.rate}, seed ${current.seed}`])} /><OptimizerFlowSelect name="Recorded loss axis" value={axis} onChange={setAxis} options={[['linear', 'Linear cross-entropy'], ['log', 'log10 cross-entropy']]} /></FlowControls><FlowReadout>These are {run.curve.length} saved measurements for {shortNames[run.method]}, scale {run.rate}, seed {run.seed}. Lines join recorded points; they supply no extra measurements or elapsed-time evidence.</FlowReadout><OptimizerTraceDrawing label="All selected methods share one validation-loss axis" description={`All selected recipes at seed ${seed},${lossLabel}. Saved validation points with distinct line patterns; scale choice remains based on mean final loss across both seeds.`} yLabel={lossLabel} yDomain={lossDomain} series={data.runs.filter(current => current.seed === seed && current.selected_by_validation).map((current, i) => ({
        name: `${shortNames[current.method]} (${current.rate})`,
        role: 'computed',
        dash: [undefined, '5 4', '1 3', '8 3 1 3', '9 5', '2 2'][i],
        points: current.curve.map(point => [point.step, transform(point.validation.cross_entropy)])
      }))} /><FlowControls><OptimizerFlowSelect name="Paired seed for selected methods" value={seed} onChange={value => setSeed(Number(value))} options={[[11, 'Seed 11'], [29, 'Seed 29']]} /></FlowControls><NeuralTable caption="All 24 candidates: validation selects before assessment" headers={['Method', 'Scale', 'Seed', 'Validation CE', 'Selected?', 'Assessment CE / correct']} rows={data.runs.map(current => [shortNames[current.method], current.rate, current.seed, f(current.validation.cross_entropy, 7), current.selected_by_validation ? 'yes' : 'no', current.assessment ? `${f(current.assessment.cross_entropy, 7)} / ${current.assessment.correct} of 80` : 'not assessed for selection'])} /></FlowLab>}</div>;
  if (view === 'state') return data ? <><FlowReadout>The following state quantities belong to the same currently selected candidate: {shortNames[run.method]}, scale {run.rate}, seed {run.seed}.</FlowReadout>{run.method === 'prodigy' && <OptimizerTraceDrawing label="Recorded scale retained for the next Prodigy update" description="Only actual distance_next values from this retained candidate; these are distinct from an ordinary AdamW learning rate." yLabel="retained next d" zero series={[{
      name: 'd for next update',
      role: 'computed',
      points: run.curve.map(point => [point.step, point.distance_next])
    }]} />} {run.method === 'sophia_g' && <OptimizerTraceDrawing label="Recorded clipped-coordinate fraction for Sophia" description="Actual fraction of parameter coordinates whose transformed ratio exceeded one, not classification accuracy." yLabel="fraction clipped" yDomain={[0, 1]} zero series={[{
      name: 'clipped parameter fraction',
      role: 'computed',
      points: run.curve.map(point => [point.step, point.clipped_fraction])
    }]} />}<NeuralTable caption="Every recorded point for the current candidate" headers={['Update', 'Fitting CE', 'Validation CE at report', 'Validation CE at training iterate']} rows={run.curve.map(point => [point.step, f(point.fit.cross_entropy, 8), f(point.validation.cross_entropy, 8), f(point.training_iterate_validation.cross_entropy, 8)])} />{run.method === 'schedule_free' && <FlowReadout>Current final validation loss at evaluation x is <strong>{f(run.validation.cross_entropy, 8)}</strong>; at training y it is <strong>{f(run.curve.at(-1).training_iterate_validation.cross_entropy, 8)}</strong>. The declared reporting iterate stays x even when y is better.</FlowReadout>}</> : <FlowReadout>The candidate selection above is retained while its saved histories load.</FlowReadout>;
  throw new Error(`Unknown optimizer history view ${view}`);
}
export function OptimizerFlowProgram({
  file,
  title
}) {
  return <RemoteCodeBlock source={assetBase + file} language="python" filename={file} title={title} />;
}
export function OptimizerFlowSupportingFiles() {
  const files = ['LICENSE-lion.txt', 'LICENSE-sophia.txt', 'digits-400.csv', 'study-results.json', 'fitted-optimizer-states.json', 'calculated-inputs.json', 'data-provenance.md'];
  return <ul className="optimizer-supporting-files">{files.map(file => <li key={file}><a href={assetBase + file} download={file}>{file}</a></li>)}</ul>;
}
