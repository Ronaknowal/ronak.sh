import { createContext, useContext, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { TrajectoryPlot, StateTrace, useStateResource, movementLabels } from './StateSpaceLabs.jsx';
import useLessonViewport from './useLessonViewport.js';
import { trajectoryForward } from '../../data/state-space-models.js';
import './state-space-flow.css';
const TrajectoryContext = createContext(null);
function Select({
  name,
  value,
  options,
  onChange
}) {
  return <label className="state-flow-select"><span>{name}</span><select aria-label={name} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>;
}
export function StateTrajectoryFlowProvider({
  children
}) {
  const [observer, ready] = useLessonViewport();
  const resource = useStateResource('trajectory-inference.json', ready, true);
  return <div ref={observer} className="state-trajectory-flow">
    {resource.error && <><p role="alert">{resource.error}</p><FlowControls><button type="button" onClick={resource.retry}>Retry fitted models</button></FlowControls></>}
    {!resource.data && !resource.error && <p role="status">{ready ? 'Loading fitted weights and the fifty validation trajectories…' : 'The fitted investigation loads when reached.'}</p>}
    {resource.data && <LoadedTrajectoryProvider data={resource.data}>{children}</LoadedTrajectoryProvider>}
  </div>;
}
function LoadedTrajectoryProvider({
  data,
  children
}) {
  const [recordId, setRecordId] = useState(7),
    [kind, setKind] = useState('diagonal');
  const [edited, setEdited] = useState(null),
    [selected, setSelected] = useState(22),
    [channel, setChannel] = useState(0);
  const record = data.records.find(row => row.id === recordId),
    points = edited || record.points;
  const baseline = useMemo(() => trajectoryForward(record.points, data.models[kind], kind), [record, data, kind]);
  const current = useMemo(() => trajectoryForward(points, data.models[kind], kind), [points, data, kind]);
  const editPoint = value => setEdited(points.map((point, i) => i === selected ? value : point));
  const state = {
    data,
    record,
    recordId,
    kind,
    points,
    selected,
    channel,
    baseline,
    current,
    setRecordId,
    setKind,
    setEdited,
    setSelected,
    setChannel,
    editPoint
  };
  return <TrajectoryContext.Provider value={state}>{children}</TrajectoryContext.Provider>;
}
function Probabilities({
  state
}) {
  const {
    baseline,
    current
  } = state;
  return <figure className="state-trajectory-probabilities" aria-label="Fifteen class probabilities; gray original and violet current, with a shared zero-to-one scale">
    <figcaption>Original gray / current violet; every bar spans 0…1</figcaption>
    <div className="ssm-probabilities">{movementLabels.map((label, i) => <div key={label}><span>{i + 1}. {label}</span><div><span className="ssm-prob-original" style={{
            width: `${100 * baseline.probabilities[i]}%`
          }} /><span className="ssm-prob-current" style={{
            width: `${100 * current.probabilities[i]}%`
          }} /></div><small>{number(current.probabilities[i], 6)}; change {number(current.probabilities[i] - baseline.probabilities[i], 6)}</small></div>)}</div>
  </figure>;
}
export function StateTrajectoryCaseFlow() {
  const state = useContext(TrajectoryContext);
  const {
    data,
    record,
    kind,
    points,
    setKind,
    setRecordId,
    setEdited
  } = state;
  return <FlowLab id="ssm-trajectory-case" label="Compare two fitted memories on the same trajectory">
    <TrajectoryPlot title={`Source ${record.id}: current cyan, original dashed gray`} points={points} baseline={record.points} />
    <FlowControls><Select name="Validation source row" value={record.id} options={data.records.map(row => [row.id, `${row.id} · ${movementLabels[row.label - 1]}`])} onChange={value => {
        setRecordId(Number(value));
        setEdited(null);
      }} /><Select name="Frozen temporal mixer" value={kind} options={['diagonal', 'selective'].map(value => [value, `${value} · seed 17`])} onChange={setKind} /></FlowControls>
    <FlowReadout>Source label {record.label} is {movementLabels[record.label - 1]}; the current {kind} model reports class {state.current.top}. Switching models preserves current edits. Selecting another source starts its original path.</FlowReadout>
    <Probabilities state={state} />
  </FlowLab>;
}
export function StateTrajectoryPointFlow() {
  const state = useContext(TrajectoryContext);
  const {
    record,
    points,
    selected,
    setSelected,
    editPoint
  } = state;
  return <FlowLab id="ssm-trajectory-point" label="Change a coordinate and follow the fitted result">
    <TrajectoryPlot title={`Point ${selected + 1}; current cyan / original dashed`} points={points} baseline={record.points} selected={selected} onChange={editPoint} />
    <FlowControls><Select name="Trajectory point" value={selected} options={points.map((_, i) => [i, `Point ${i + 1}`])} onChange={value => setSelected(Number(value))} /><FlowSlider name="Selected point x" value={points[selected][0]} min={0} max={1} step={.001} onChange={value => editPoint([value, points[selected][1]])} /><FlowSlider name="Selected point y" value={points[selected][1]} min={0} max={1} step={.001} onChange={value => editPoint([points[selected][0], value])} /></FlowControls>
    <FlowReadout>Point {selected + 1} is ({number(points[selected][0])}, {number(points[selected][1])}); probability of the original source class changes from {number(state.baseline.probabilities[record.label - 1])} to {number(state.current.probabilities[record.label - 1])}. The edited path has no newly certified label.</FlowReadout>
  </FlowLab>;
}
export function StateTrajectoryOrderFlow() {
  const state = useContext(TrajectoryContext);
  const {
    record,
    points,
    selected,
    setEdited,
    editPoint
  } = state;
  return <FlowLab id="ssm-trajectory-order" label="Change order while holding the geometric point set">
    <TrajectoryPlot title="A path has both shape and traversal order" points={points} baseline={record.points} />
    <FlowControls><button type="button" onClick={() => setEdited([...points].reverse())}>Reverse traversal order</button><button type="button" onClick={() => editPoint([1 - points[selected][0], points[selected][1]])}>Reflect selected x</button><button type="button" onClick={() => setEdited(null)}>Reset path</button></FlowControls>
    <FlowReadout>The original top class is {state.baseline.top}; the current top class is {state.current.top}. Reversal reorders all positions; reflection moves only point {selected + 1}. Reset restores the original logits.</FlowReadout>
  </FlowLab>;
}
export function StateTrajectoryResponseFlow() {
  const state = useContext(TrajectoryContext);
  return <FlowLab id="ssm-trajectory-response" label="Inspect an internal response without treating it as attribution">
    <StateTrace title={`First causal mixer, channel ${state.channel}`} series={[{
      label: 'Original response',
      color: '#dedede',
      values: state.baseline.traces[0].map(row => row[state.channel])
    }, {
      label: 'Current response',
      color: '#baa1e3',
      values: state.current.traces[0].map(row => row[state.channel])
    }]} yLabel="internal response, not importance" />
    <FlowControls><FlowSlider name="Inspect mixer channel" value={state.channel} min={0} max={15} step={1} onChange={state.setChannel} /></FlowControls>
    <FlowReadout>Changing a late input cannot change an earlier causal mixer response. The final class pools all forty-five positions, so it can still change. Channel {state.channel} is an inspection coordinate, not an importance score.</FlowReadout>
    <NeuralTable caption="Complete fifteen-class output, fixed class order" headers={['Class', 'Original probability', 'Current probability', 'Current logit']} rows={movementLabels.map((label, i) => [`${i + 1}. ${label}`, number(state.baseline.probabilities[i], 8), number(state.current.probabilities[i], 8), number(state.current.logits[i], 8)])} />
    <NeuralTable caption="Every current trajectory coordinate" headers={['Point', 'x', 'y']} rows={state.points.map((point, i) => [i + 1, ...point.map(value => number(value, 8))])} />
  </FlowLab>;
}
