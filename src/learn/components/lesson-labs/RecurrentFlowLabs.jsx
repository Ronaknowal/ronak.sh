import { createContext, useContext, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as n } from './LessonFlow.jsx';
import { scalarRecurrence, lstmAccounting, resetPlacement, retentionPath, boundaryExperiment, streamOwnership, paddingExperiment, recurrentSequence } from '../../data/recurrent-models.js';
import { ScalarTraceDrawing, SharedCreditDrawing, LstmCellDrawing, GruResetDrawing, GruBlendDrawing, RecurrentBoundaryFigure, RecurrentOwnershipFigure, RecurrentPackingFigure, RecurrentDrawing, RecurrentWire, RecurrentLabel, RecurrentPlot } from './RecurrentDrawings.jsx';
import { useRecurrentData, PointPath } from './RecurrentLabs.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import './recurrent-flow.css';

const ScalarContext = createContext(null);
const ResetContext = createContext(null);
const scalarFixture = () => ({ inputs: [.4, -.2, .7], inputWeight: .8, recurrentWeight: .6, bias: .1, initial: 0, target: .3, rate: .1 });
const resetFixture = () => ({ hidden: [1, 2], reset: [.2, .8], matrix: [[1, 2], [3, 4]], bias: [.5, -.5] });

export function RecurrentFlowProvider({ children }) {
  const [scalar, setScalar] = useState(scalarFixture);
  const [reset, setReset] = useState(resetFixture);
  return <ScalarContext.Provider value={{ scalar, setScalar }}><ResetContext.Provider value={{ reset, setReset }}>{children}</ResetContext.Provider></ScalarContext.Provider>;
}

function Select({ label, value, onChange, options }) {
  return <label><span>{label}</span> <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

function ResetButton({ children, onClick }) { return <div className="recurrent-flow-actions"><button type="button" onClick={onClick}>{children}</button></div>; }

export function RecurrentForwardLab() {
  const { scalar, setScalar } = useContext(ScalarContext), [position, setPosition] = useState(1);
  const trace = useMemo(() => scalarRecurrence(scalar), [scalar]);
  return <FlowLab id="recurrent-forward" label="Change one input and follow the state">
    <ScalarTraceDrawing state={scalar} trace={trace} />
    <FlowControls><Select label="Input position" value={position} onChange={v => setPosition(Number(v))} options={scalar.inputs.map((_, i) => [i, `Position ${i + 1}`])} />
      <FlowSlider name={`Input ${position + 1}`} min={-1} max={1} step={.01} value={scalar.inputs[position]} onChange={value => setScalar(old => ({ ...old, inputs: old.inputs.map((v, i) => i === position ? value : v) }))} />
      <FlowSlider name="Initial state" min={-1} max={1} step={.01} value={scalar.initial} onChange={initial => setScalar(old => ({ ...old, initial }))} /></FlowControls>
    <FlowReadout data-result="forward">The current states are {trace.states.slice(1).map(v => n(v)).join(', ')}; the same input and recurrent weights act at every position.</FlowReadout>
    <ResetButton onClick={() => { setScalar(scalarFixture()); setPosition(1); }}>Reset scalar example</ResetButton>
  </FlowLab>;
}

export function RecurrentParameterLab() {
  const { scalar, setScalar } = useContext(ScalarContext), trace = useMemo(() => scalarRecurrence(scalar), [scalar]);
  return <FlowLab id="recurrent-parameters" label="Change a parameter shared by all three positions">
    <ScalarTraceDrawing state={scalar} trace={trace} />
    <FlowControls>{[['inputWeight', 'Input weight'], ['recurrentWeight', 'Recurrent weight'], ['bias', 'Bias']].map(([key, name]) => <FlowSlider key={key} name={name} value={scalar[key]} min={-2} max={2} step={.01} onChange={value => setScalar(old => ({ ...old, [key]: value }))} />)}</FlowControls>
    <FlowReadout data-result="parameters">Reusing the current weights gives final state {n(trace.states.at(-1))}; changing one weight changes all of its uses.</FlowReadout>
  </FlowLab>;
}

export function RecurrentCreditLab() {
  const { scalar, setScalar } = useContext(ScalarContext), result = useMemo(() => scalarRecurrence(scalar), [scalar]);
  return <FlowLab id="recurrent-credit" label="Sum the shared-weight gradient and take one update">
    <SharedCreditDrawing result={result} />
    <FlowControls><FlowSlider name="Target final state" value={scalar.target} min={-1} max={1} step={.01} onChange={target => setScalar(old => ({ ...old, target }))} />
      <FlowSlider name="Learning rate" value={scalar.rate} min={0} max={.2} step={.005} onChange={rate => setScalar(old => ({ ...old, rate }))} /></FlowControls>
    <FlowReadout data-result="credit">Final state {n(result.states.at(-1))} has loss {n(result.loss)}; the summed gradient is ({Object.values(result.gradient).map(v => n(v)).join(', ')}). One update gives weights/bias ({Object.values(result.updated).map(v => n(v)).join(', ')}) and recomputed loss {n(result.updatedLoss)}.</FlowReadout>
  </FlowLab>;
}

export function LstmRetainLab() {
  const [cell, setCell] = useState(.8), [forget, setForget] = useState(.9);
  return <FlowLab id="lstm-retain" label="Retain a positive or negative stored value">
    <LstmCellDrawing cell={cell} forget={forget} write={false} read={false} />
    <FlowControls><FlowSlider name="Old stored value" value={cell} min={-2} max={2} step={.02} onChange={setCell} /><FlowSlider name="Retained fraction f" value={forget} min={0} max={1} step={.01} onChange={setForget} /></FlowControls>
    <FlowReadout>The retained cell is {n(cell * forget)}; its sign comes from the stored value, and no new value is written.</FlowReadout>
    <ResetButton onClick={() => { setCell(.8); setForget(.9); }}>Reset retention example</ResetButton>
  </FlowLab>;
}

export function LstmMemoryLab() {
  const [forget, setForget] = useState(.9), [input, setInput] = useState(.2), [candidate, setCandidate] = useState(-.5);
  const result = lstmAccounting({ cell: .8, forget, input, candidate, output: .6 });
  return <FlowLab id="lstm-memory" label="Keep old cell values and add a signed write">
    <LstmCellDrawing forget={forget} input={input} candidate={candidate} read={false} />
    <FlowControls><FlowSlider name="Retained fraction f" value={forget} min={0} max={1} step={.01} onChange={setForget} /><FlowSlider name="Written fraction i" value={input} min={0} max={1} step={.01} onChange={setInput} /><FlowSlider name="Signed candidate g" value={candidate} min={-1} max={1} step={.01} onChange={setCandidate} /></FlowControls>
    <FlowReadout data-result="cell">Retained {n(result.retained)} plus written {n(result.written)} gives stored cell {n(result.cell)}; at i=0, changing the candidate has no effect.</FlowReadout>
    <ResetButton onClick={() => { setForget(.9); setInput(.2); setCandidate(-.5); }}>Reset write example</ResetButton>
  </FlowLab>;
}

export function LstmReadoutLab() {
  const [cell, setCell] = useState(.62), [output, setOutput] = useState(.6);
  return <FlowLab id="lstm-readout" label="Read a stored cell through the output gate">
    <LstmCellDrawing cell={cell} forget={1} output={output} write={false} />
    <FlowControls><FlowSlider name="Stored cell" value={cell} min={-2} max={2} step={.01} onChange={setCell} /><FlowSlider name="Output fraction o" value={output} min={0} max={1} step={.01} onChange={setOutput} /></FlowControls>
    <FlowReadout data-result="readout">The hidden output is {n(output * Math.tanh(cell))}; changing o leaves this step's stored cell {n(cell)} in place.</FlowReadout>
    <ResetButton onClick={() => { setCell(.62); setOutput(.6); }}>Reset readout example</ResetButton>
  </FlowLab>;
}

export function GruBlendLab() {
  const [retain, setRetain] = useState(.75), [candidate, setCandidate] = useState(-.4);
  return <FlowLab id="gru-blend" label="Blend old state with a candidate">
    <GruBlendDrawing retain={retain} candidate={candidate} />
    <FlowControls><FlowSlider name="Retained fraction z" value={retain} min={0} max={1} step={.01} onChange={setRetain} /><FlowSlider name="Candidate" value={candidate} min={-1} max={1} step={.01} onChange={setCandidate} /></FlowControls>
    <FlowReadout>The new state is {n(retain * .8 + (1 - retain) * candidate)}; retaining all the old state makes candidate edits ineffective.</FlowReadout>
    <ResetButton onClick={() => { setRetain(.75); setCandidate(-.4); }}>Reset blend</ResetButton>
  </FlowLab>;
}

export function GruResetLab() {
  const { reset, setReset } = useContext(ResetContext), result = resetPlacement(reset.hidden, reset.reset, reset.matrix, reset.bias);
  return <FlowLab id="gru-reset" label="Scale before versus after recurrent mixing">
    <GruResetDrawing {...reset} />
    <FlowControls>{[0, 1].map(i => <FlowSlider key={i} name={`Reset coordinate ${i + 1}`} value={reset.reset[i]} min={0} max={1} step={.01} onChange={value => setReset(old => ({ ...old, reset: old.reset.map((v, j) => j === i ? value : v) }))} />)}</FlowControls>
    <FlowReadout data-result="reset">Before mixing gives ({result.before.map(v => n(v)).join(', ')}), after mixing and bias gives ({result.after.map(v => n(v)).join(', ')}); all-one reset makes the two equal.</FlowReadout>
    <ResetButton onClick={() => setReset(resetFixture())}>Reset mixing example</ResetButton>
  </FlowLab>;
}

export function GruMixingLab() {
  const { reset, setReset } = useContext(ResetContext), [entry, setEntry] = useState('w01');
  const value = entry[0] === 'w' ? reset.matrix[Number(entry[1])][Number(entry[2])] : reset.bias[Number(entry[1])];
  const edit = value => setReset(old => entry[0] === 'w' ? { ...old, matrix: old.matrix.map((row, i) => row.map((v, j) => i === Number(entry[1]) && j === Number(entry[2]) ? value : v)) } : { ...old, bias: old.bias.map((v, i) => i === Number(entry[1]) ? value : v) });
  const result = resetPlacement(reset.hidden, reset.reset, reset.matrix, reset.bias);
  return <FlowLab id="gru-mixing" label="Edit any matrix or hidden bias coordinate">
    <GruResetDrawing {...reset} />
    <FlowControls><Select label="Matrix or bias entry" value={entry} onChange={setEntry} options={[['w00', 'W₁₁'], ['w01', 'W₁₂'], ['w10', 'W₂₁'], ['w11', 'W₂₂'], ['b0', 'b₁'], ['b1', 'b₂']]} /><FlowSlider name="Entry value" value={value} min={-4} max={4} step={.01} onChange={edit} /></FlowControls>
    <FlowReadout data-result="mixing">The current before-minus-after differences are ({result.before.map((v, i) => n(v - result.after[i])).join(', ')}); compare a diagonal zero-bias matrix with a restored bias or off-diagonal weight.</FlowReadout>
  </FlowLab>;
}

function RetentionCurve({ result, horizon }) {
  return <RecurrentPlot title="Direct fixed-gate cell path" xLabel="Position" yLabel="Cell value" xDomain={[0, horizon]} yDomain={[Math.min(0, ...result.changed.map(p => p[1])), Math.max(1.05, ...result.changed.map(p => p[1]))]} series={[{ label: 'No writes', color: '#b5a3dd', dashed: true, values: result.plain }, { label: 'Current path', color: '#e4b752', values: result.changed }]} />;
}
export function LstmRetentionLab() {
  const [fraction, setFraction] = useState(.5), [horizon, setHorizon] = useState(100);
  const result = retentionPath(fraction, horizon, 1, 0);
  return <FlowLab id="lstm-retention" label="Choose the direct path's surviving fraction">
    <RetentionCurve result={result} horizon={horizon} />
    <FlowControls><FlowSlider name="Fraction surviving at horizon" value={fraction} min={.05} max={.99} step={.01} onChange={setFraction} /><FlowSlider name="Horizon in positions" value={horizon} min={1} max={200} step={1} onChange={setHorizon} /></FlowControls>
    <FlowReadout data-result="retention">Keeping {n(fraction)} after {horizon} positions requires per-position factor {n(result.forget, 9)}, sigmoid preactivation {n(result.bias)}, and half-life {n(result.halfLife)} positions.</FlowReadout>
    <ResetButton onClick={() => { setFraction(.5); setHorizon(100); }}>Reset direct path</ResetButton>
  </FlowLab>;
}
export function LstmWriteRetentionLab() {
  const [position, setPosition] = useState(25), [write, setWrite] = useState(0);
  const result = retentionPath(.99 ** 100, 100, position, write);
  return <FlowLab id="lstm-write-retention" label="Follow one write through the remaining cell path">
    <RetentionCurve result={result} horizon={100} />
    <FlowControls><FlowSlider name="Write position" value={position} min={1} max={100} step={1} onChange={setPosition} /><FlowSlider name="Signed write" value={write} min={-.5} max={.5} step={.01} onChange={setWrite} /></FlowControls>
    <FlowReadout>With f fixed at .99, the write contributes {n(write * .99 ** (100 - position))} at position 100; the final cell is {n(result.changed.at(-1)[1])}. A zero write leaves both curves identical.</FlowReadout>
    <ResetButton onClick={() => { setPosition(25); setWrite(0); }}>Reset write</ResetButton>
  </FlowLab>;
}

function FrozenPenFlow({ data }) {
  const [kind, setKind] = useState('gru'), [sample, setSample] = useState(0), [points, setPoints] = useState(() => data.specimens[0].points.map(p => [...p]));
  const [point, setPoint] = useState(2), [position, setPosition] = useState(2), [feature, setFeature] = useState(0);
  const baseline = useMemo(() => recurrentSequence(kind, data.specimens[sample].points, data.weights[kind]), [data, kind, sample]);
  const current = useMemo(() => recurrentSequence(kind, points, data.weights[kind]), [data, kind, points]);
  const move = (i, next) => setPoints(old => old.map((p, j) => i === j ? [...next] : p));
  const original = baseline.at(-1).probabilities, probabilities = current.at(-1).probabilities;
  const winner = p => p.indexOf(Math.max(...p));
  const source = value => { const index = Number(value); setSample(index); setPoints(data.specimens[index].points.map(p => [...p])); };
  return <>
    <FlowLab id="recurrent-pen" label="Change a completed trace with fixed fitted weights">
      <PointPath points={points} selected={point} onSelect={setPoint} onMove={move} title="Current completed trace · click a numbered point" />
      <FlowControls><Select label="Source specimen" value={sample} onChange={source} options={data.specimens.map((row, i) => [i, `${row.sourceId} · digit ${row.digit}`])} /><FlowSlider name={`Point ${point + 1} x`} value={points[point][0]} min={-1} max={1} step={.01} onChange={v => move(point, [v, points[point][1]])} /><FlowSlider name={`Point ${point + 1} y`} value={points[point][1]} min={-1} max={1} step={.01} onChange={v => move(point, [points[point][0], v])} /></FlowControls>
      <div className="recurrent-flow-actions"><button onClick={() => setPoints(old => [...old].reverse())}>Reverse current trace</button><button onClick={() => setPoints(old => old.map((p, i) => i === 2 ? old[3] : i === 3 ? old[2] : p))}>Swap points 3 and 4</button><ResetButton onClick={() => { setKind('gru'); source(0); setPoint(2); setFeature(0); setPosition(2); }}>Reset fitted trace</ResetButton></div>
      <FlowReadout data-result="pen">For {kind.toUpperCase()} with fixed seed-1 weights, the original top digit is {winner(original)}, the current top digit is {winner(probabilities)}. Source changes restore that specimen; changing the model below keeps your edited coordinates.</FlowReadout>
      <NeuralTable caption="All ten probabilities from the same final hidden state" headers={['Digit', 'Original', 'Current', 'Change']} rows={probabilities.map((v, i) => [i, n(original[i], 8), n(v, 8), n(v - original[i], 8)])} />
    </FlowLab>
    <p>The changed probabilities came from a changed hidden trajectory. Follow one of its 32 coordinates below. A feature number has no assigned human meaning. The selected position also exposes that coordinate's computed gates; these are the learned gates, rather than the ideal interventions in sections 3–4.</p>
    <FlowLab id="recurrent-pen-state" label="Inspect a hidden trajectory and its gate contributions">
      <RecurrentPlot title={`Hidden feature ${feature + 1} of the same edited trace`} xLabel="Position" yLabel="Hidden value" xDomain={[1, 8]} yDomain={[-1, 1]} series={[{ label: 'Original', color: '#b5a3dd', dashed: true, values: baseline.map((row, i) => [i + 1, row.hidden[feature]]) }, { label: 'Current', color: '#e4b752', values: current.map((row, i) => [i + 1, row.hidden[feature]]) }]} />
      <FlowControls><Select label="Recurrent model" value={kind} onChange={setKind} options={['rnn', 'lstm', 'gru'].map(v => [v, v.toUpperCase()])} /><FlowSlider name="Hidden feature" value={feature + 1} min={1} max={32} step={1} onChange={v => setFeature(v - 1)} /><FlowSlider name="Position to inspect" value={position + 1} min={1} max={8} step={1} onChange={v => setPosition(v - 1)} /></FlowControls>
      <FlowReadout data-result="pen-state">At position {position + 1}, feature {feature + 1}, the hidden value is {n(current[position].hidden[feature], 8)}. All eight inputs still belong to specimen {data.specimens[sample].sourceId}, with your current edits.</FlowReadout>
      <NeuralTable caption="Current computed state and gate values" headers={['Quantity', 'Value']} rows={[[ 'Hidden', n(current[position].hidden[feature], 8)], ...Object.entries(current[position].gates).map(([name, values]) => [name.replaceAll('_', ' '), n(values[feature], 8)])]} />
      <NeuralTable caption="Complete eight-position current trace" headers={['Position', 'x', 'y', 'Selected hidden']} rows={current.map((row, i) => [i + 1, n(points[i][0]), n(points[i][1]), n(row.hidden[feature], 8)])} />
    </FlowLab>
  </>;
}
export function RecurrentPenLab() {
  const { ref, data, fallback } = useRecurrentData('pen-models.json');
  return <div ref={ref} data-recurrent-load="recurrent-pen">{data ? <FrozenPenFlow data={data} /> : fallback}</div>;
}

function BoundaryFlow({ data }) {
  const [boundary, setBoundary] = useState(2), [swap, setSwap] = useState(false);
  const results = useMemo(() => ['carry', 'detach', 'reset'].map(mode => ({ mode, ...boundaryExperiment(data.sequence[0], data.weights, boundary, mode) })), [data, boundary]);
  const owners = useMemo(() => streamOwnership(data.sequence[0], data.weights, boundary, swap), [data, boundary, swap]);
  return <>
    <FlowLab id="recurrent-boundary" label="Compare carry, detach and reset at one boundary">
      <RecurrentBoundaryFigure boundary={boundary} />
      <FlowControls><FlowSlider name="Boundary after position" value={boundary} min={1} max={4} step={1} onChange={setBoundary} /></FlowControls>
      <FlowReadout data-result="boundary">Carry changes the final state by {n(results[0].finalError, 9)}; detach changes it by {n(results[1].finalError, 9)}; reset changes it by {n(results[2].finalError, 9)}. The suffix loss is the sum of squared hidden coordinates after this boundary.</FlowReadout>
      <NeuralTable caption="Suffix objective and credit reaching the prefix" headers={['Operation', 'Suffix loss', 'Position 1 ∂L/∂x', 'Position 1 ∂L/∂y']} rows={results.map(r => [r.mode, n(r.loss, 8), ...r.gradients[0].map(v => n(v, 8))])} />
      <NeuralTable caption="All input derivatives and hidden states at the current boundary" headers={['Position', 'Carry derivative x,y', 'Detach derivative x,y', 'Reset derivative x,y', 'Carry state', 'Reset state']} rows={results[0].current.map((row, i) => [i + 1, ...results.map(r => r.gradients[i].map(v => n(v, 7)).join(', ')), row.hidden.map(v => n(v, 7)).join(', '), results[2].current[i].hidden.map(v => n(v, 7)).join(', ')])} />
      <ResetButton onClick={() => setBoundary(2)}>Reset boundary</ResetButton>
    </FlowLab>
    <p>Now keep the arithmetic fixed and change who owns the carried state. Stream A is the five-point fixture; stream B is its reversed order. The scheduler presents B before A next, so both the inputs and their saved state rows must move together.</p>
    <FlowLab id="recurrent-ownership" label="Keep a state with its stream when batch rows move">
      <RecurrentOwnershipFigure swapped={swap} />
      <FlowControls><label className="recurrent-checkbox"><input type="checkbox" checked={swap} onChange={e => setSwap(e.target.checked)} />Pass unchanged state rows to the reordered inputs</label><FlowSlider name="Boundary after position" value={boundary} min={1} max={4} step={1} onChange={setBoundary} /></FlowControls>
      <FlowReadout data-result="ownership">The largest final-state change from wrong ownership is {n(owners.difference, 9)}. Moving the owned states with their inputs gives the original values.</FlowReadout>
      <NeuralTable caption="Actual carried final states" headers={['Stream', 'Correct state', 'Current state']} rows={owners.current.map((row, i) => [i ? 'B' : 'A', owners.correct[i].map(v => n(v, 8)).join(', '), row.map(v => n(v, 8)).join(', ')])} />
      <ResetButton onClick={() => { setBoundary(2); setSwap(false); }}>Restore owned states</ResetButton>
    </FlowLab>
  </>;
}
export function RecurrentBoundaryLab() {
  const { ref, data, fallback } = useRecurrentData('recurrent-evidence.json');
  return <div ref={ref} data-recurrent-load="recurrent-boundary">{data ? <BoundaryFlow data={data.boundaries} /> : fallback}</div>;
}

function PaddingFlow({ data }) {
  const [length, setLength] = useState(3), [padding, setPadding] = useState(0);
  const result = useMemo(() => paddingExperiment(data.sequence[0], data.padding.True.weights, length, padding), [data, length, padding]);
  return <FlowLab id="recurrent-padding" label="Exclude padded computations and distinguish directional endpoints">
    <RecurrentPackingFigure length={length} />
    <FlowControls><FlowSlider name="Valid positions" value={length} min={1} max={5} step={1} onChange={setLength} /><FlowSlider name="Padding value in each coordinate" value={padding} min={-4} max={4} step={.1} onChange={setPadding} /></FlowControls>
    <FlowReadout data-result="padding">Relative to zero padding, valid forward states change by {n(result.forwardEditError, 8)}, valid backward states by {n(result.backwardEditError, 8)}. Reading the padded final forward state instead of its valid endpoint changes it by {n(result.paddedFinalError, 8)}.</FlowReadout>
    <NeuralTable caption="Every valid directional state" headers={['Position', 'Forward padded', 'Backward padded', 'Backward true length']} rows={result.forward.slice(0, length).map((row, i) => [i + 1, row.hidden.map(v => n(v, 7)).join(', '), result.backward[i].hidden.map(v => n(v, 7)).join(', '), result.packedBackward[i].hidden.map(v => n(v, 7)).join(', ')])} />
    <p>For batch lengths 5, 4 and {length}, {9 + length} targets are valid. Dividing by all 15 storage positions scales the loss by {n((9 + length) / 15)} relative to the valid-position mean. Packing does not choose your loss denominator.</p>
    <ResetButton onClick={() => { setLength(3); setPadding(0); }}>Reset padded batch</ResetButton>
  </FlowLab>;
}
export function RecurrentPaddingLab() {
  const { ref, data, fallback } = useRecurrentData('recurrent-evidence.json');
  return <div ref={ref} data-recurrent-load="recurrent-padding">{data ? <PaddingFlow data={data.boundaries} /> : fallback}</div>;
}

export function RecurrentClippingLab() {
  const [threshold, setThreshold] = useState(2), scale = Math.min(1, threshold / 5);
  const xy = (x, y) => [38 + x * 52, 296 - y * 52];
  return <FlowLab id="recurrent-clipping" label="Keep gradient direction while limiting its norm">
    <RecurrentDrawing name="recurrent-clipping-vectors" height={355} label={`Gradient (3,4) has norm5. Global threshold ${threshold} yields (${3 * scale},${4 * scale}); coordinate clipping at2 gives (2,2), another direction.`}>
      {arrow => <><RecurrentWire points={[[38, 25], [38, 296], [317, 296]]} /><RecurrentLabel x={28} y={318}>0</RecurrentLabel><RecurrentLabel x={311} y={319}>x</RecurrentLabel><RecurrentLabel x={20} y={28}>y</RecurrentLabel>
        {[[3, 4, 'original', 'computed'], [3 * scale, 4 * scale, 'global', 'backward'], [2, 2, 'coordinate', 'learned']].map(([x, y, name, role], i) => <g key={name}><RecurrentWire points={[xy(0, 0), xy(x, y)]} arrow={arrow} color={role} dashed={role === 'backward'} /><RecurrentLabel x={170} y={23 + i * 23} color={role}>{name}: ({n(x, 2)}, {n(y, 2)})</RecurrentLabel></g>)}<RecurrentLabel y={347}>equal scale · 52 pixels per coordinate</RecurrentLabel></>}
    </RecurrentDrawing>
    <FlowControls><FlowSlider name="Global norm threshold" value={threshold} min={.1} max={6} step={.1} onChange={setThreshold} /></FlowControls>
    <FlowReadout data-result="clipping">The gradient becomes ({n(3 * scale)}, {n(4 * scale)}), with norm {n(5 * scale)}. Thresholds at least 5 leave it unchanged; coordinate clipping at 2 has a different direction.</FlowReadout>
    <ResetButton onClick={() => setThreshold(2)}>Reset clipping threshold</ResetButton>
  </FlowLab>;
}

function MeasuredFlow({ data }) {
  const [kind, setKind] = useState('gru'), [seed, setSeed] = useState(1);
  const run = data.runs.find(r => r.kind === kind && r.seed === seed);
  return <FlowLab id="recurrent-measured" label="Inspect the nine recorded training trajectories">
    <RecurrentPlot title="Recorded training and development loss" xLabel="Optimizer updates" yLabel="Cross-entropy" xDomain={[0, 500]} yDomain={[0, Math.max(...run.trajectory.flatMap(r => [r.train.cross_entropy, r.development.cross_entropy])) * 1.05]} series={['train', 'development'].map((key, i) => ({ label: key, color: i ? '#b5a3dd' : '#e4b752', dashed: !!i, values: run.trajectory.map(r => [r.step, r[key].cross_entropy]) }))} />
    <FlowControls><Select label="Recorded architecture" value={kind} onChange={setKind} options={['rnn', 'lstm', 'gru'].map(v => [v, v.toUpperCase()])} /><Select label="Recorded seed" value={seed} onChange={v => setSeed(Number(v))} options={[1, 2, 3].map(v => [v, String(v)])} /></FlowControls>
    <FlowReadout data-result="measured">This recorded {kind.toUpperCase()} seed-{seed} run got {run.final.correct}/300 original traces, {run.reversed.correct}/300 reversed and {run.swapped_points_3_4.correct}/300 with points 3/4 swapped. These selectors choose saved runs; they do not train a new model.</FlowReadout>
    <NeuralTable caption="Every saved checkpoint" headers={['Update', 'Train loss', 'Dev loss', 'Train correct /600', 'Dev correct /300']} rows={run.trajectory.map(r => [r.step, n(r.train.cross_entropy, 7), n(r.development.cross_entropy, 7), r.train.correct, r.development.correct])} />
    <p>The run has {run.parameters} parameters; clipping activated on {run.clipped_updates}/500 updates. These measurements imply no hardware-speed ranking.</p>
  </FlowLab>;
}
export function RecurrentMeasuredLab() {
  const { ref, data, fallback } = useRecurrentData('recurrent-evidence.json');
  return <div ref={ref} data-recurrent-load="recurrent-measured">{data ? <MeasuredFlow data={data} /> : fallback}</div>;
}
