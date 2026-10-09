import { useState, useId } from 'react';
import { FlowLab, FlowControls, FlowSlider } from './LessonFlow.jsx';
import { MFigure, MTable, mt } from './MeasureReadingPrimitives.jsx';
import { InformationPicture, MapPicture } from './MeasureFoundationDrawings.jsx';
import { MixedPicture, SimplePicture, LimitPicture } from './MeasureIntegralDrawings.jsx';
import { CoordinatePicture } from './MeasureProductDrawings.jsx';
import { ConditionalPicture } from './MeasureConditionalDrawings.jsx';
import { TransferPicture } from './MeasureTransferDrawings.jsx';
import {
  INFORMATION_PARTITIONS,
  LIMIT_MODES,
  TARGET_MEASURES,
  DIE_LOSSES,
  informationState,
  preimageState,
  mixedMeasureState,
  simpleIntegralState,
  limitIntegralState,
  jointCellState,
  conditionalMeanState,
  parseLosses,
  reweightState,
} from '../../data/measure-theory-models.js';

const entries = (o) => Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v : v.label]);
function Choice({ label, value, onChange, options }) {
  return (
    <label className="mt-input">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Controls({ reset, children }) {
  return (
    <FlowControls>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </FlowControls>
  );
}
function Lab({ id, label, children }) {
  return (
    <MFigure id={id}>
      <FlowLab label={label}>{children}</FlowLab>
    </MFigure>
  );
}
export function EventInformationLab() {
  const [partition, setPartition] = useState('pairs'),
    [mask, setMask] = useState(3);
  const state = informationState(partition, mask);
  return (
    <Lab id="MT06" label="Observable die events">
      <InformationPicture state={state} />
      <p aria-live="polite">
        {state.observableEventCount} observable events; selected event is{' '}
        {state.observable ? 'observable' : 'not observable'}.
      </p>
      <Controls
        reset={() => {
          setPartition('pairs');
          setMask(3);
        }}
      >
        <Choice
          label="Observed information"
          value={partition}
          onChange={setPartition}
          options={entries(INFORMATION_PARTITIONS)}
        />
        <div className="mt-bit-controls" role="group" aria-label="Select event faces">
          {[1, 2, 3, 4, 5, 6].map((face) => (
            <button
              type="button"
              key={face}
              aria-pressed={!!(mask & (1 << (face - 1)))}
              onClick={() => setMask((old) => old ^ (1 << (face - 1)))}
            >
              Face {face}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMask(0)}>
          Empty event
        </button>
        <button type="button" onClick={() => setMask(63)}>
          Every outcome
        </button>
      </Controls>
      <MTable
        label="Every union of the current whole information cells"
        tall
        columns={['Cell choices in displayed order', 'Event', 'Ambient probability']}
        rows={state.algebra.map((faces, i) => [
          state.cells.map((cell) => (faces.includes(cell.faces[0]) ? '1' : '0')).join(''),
          faces.length ? '{' + faces.join(', ') + '}' : '∅',
          mt(faces.length / 6),
        ])}
      />
    </Lab>
  );
}
export function PreimageLab() {
  const [t, setT] = useState(1),
    state = preimageState(t);
  return (
    <Lab id="MT12" label="Complete preimage of an output threshold">
      <MapPicture state={state} />
      <p aria-live="polite">
        Z≤{t}: faces {'{' + state.preimage.join(', ') + '}'}, probability {mt(state.probability)}.
        The four-point law stays fixed.
      </p>
      <Controls reset={() => setT(1)}>
        <FlowSlider name="Output threshold t" value={t} onChange={setT} min={0} max={3} step={1} />
      </Controls>
      <MTable
        label="All input arrows and event membership"
        columns={['Face', 'Output Z', 'Z≤t?']}
        rows={state.rows.map((r) => [r.face, r.value, r.selected ? 'yes' : 'no'])}
      />
    </Lab>
  );
}
export function MixedLab() {
  const [w, setW] = useState(0.25),
    [interval, setInterval] = useState('half'),
    intervals = {
      half: [0, 0.5],
      point: [0, 0],
      positive: [0.25, 0.75],
      all: [0, 1],
      outside: [-0.25, -0.1],
    };
  const controls = (
    <Controls
      reset={() => {
        setW(0.25);
        setInterval('half');
      }}
    >
      <FlowSlider
        name="Atomic probability w"
        value={w}
        onChange={setW}
        min={0}
        max={1}
        step={0.05}
      />
      <Choice
        label="Closed interval"
        value={interval}
        onChange={setInterval}
        options={Object.entries(intervals).map(([k, v]) => [k, '[' + v.join(', ') + ']'])}
      />
    </Controls>
  );
  return (
    <Lab id="MT21" label="Atom and continuous interval probability">
      <MixedPicture state={mixedMeasureState(w, ...intervals[interval])} controls={controls} />
    </Lab>
  );
}
export function SimpleLab() {
  const [n, setN] = useState(2);
  return (
    <Lab id="MT27" label="Simple lower integral by value refinement">
      <SimplePicture
        state={simpleIntegralState(n)}
        controls={
          <Controls reset={() => setN(2)}>
            <FlowSlider
              name="Refinement level n"
              value={n}
              onChange={setN}
              min={0}
              max={6}
              step={1}
            />
          </Controls>
        }
      />
    </Lab>
  );
}
export function LimitLab() {
  const [mode, setMode] = useState('spike'),
    [n, setN] = useState(4),
    [x, setX] = useState(0.25);
  return (
    <Lab id="MT35" label="Point values and limits of integrals">
      <LimitPicture
        state={limitIntegralState(mode, n, x)}
        controls={
          <Controls
            reset={() => {
              setMode('spike');
              setN(4);
              setX(0.25);
            }}
          >
            <Choice
              label="Sequence"
              value={mode}
              onChange={setMode}
              options={[
                ['spike', 'Shrinking spike'],
                ['bounded', 'Bounded xⁿ'],
                ['increasing', 'Increasing truncation'],
              ]}
            />
            <FlowSlider
              name="Sequence index n"
              value={n}
              onChange={setN}
              min={1}
              max={64}
              step={1}
            />
            <FlowSlider
              name="Fixed observation x"
              value={x}
              onChange={setX}
              min={0}
              max={1}
              step={0.01}
            />
          </Controls>
        }
      />
    </Lab>
  );
}
export function CoordinateLab() {
  const [c, setC] = useState(2),
    [r, setR] = useState(1),
    [a, setA] = useState(2),
    [b, setB] = useState(3);
  return (
    <Lab id="MT40" label="Coordinate area and probability">
      <CoordinatePicture
        state={jointCellState(c, r, a, b)}
        controls={
          <Controls
            reset={() => {
              setC(2);
              setR(1);
              setA(2);
              setB(3);
            }}
          >
            <FlowSlider name="Column c" value={c} onChange={setC} min={0} max={3} step={1} />
            <FlowSlider name="Row r" value={r} onChange={setR} min={0} max={3} step={1} />
            <FlowSlider
              name="Horizontal scale a"
              value={a}
              onChange={setA}
              min={0.5}
              max={3}
              step={0.5}
            />
            <FlowSlider
              name="Vertical scale b"
              value={b}
              onChange={setB}
              min={0.5}
              max={3}
              step={0.5}
            />
          </Controls>
        }
      />
    </Lab>
  );
}
export function ConditionalLab() {
  const [partition, setPartition] = useState('pairs'),
    [sampling, setSampling] = useState('fair'),
    [values, setValues] = useState([...DIE_LOSSES]),
    [draft, setDraft] = useState(DIE_LOSSES.join(', ')),
    [error, setError] = useState(''),
    [nullValue, setNullValue] = useState(0),
    errorId = useId();
  const state = conditionalMeanState(partition, sampling, values, nullValue);
  const reset = () => {
    setPartition('pairs');
    setSampling('fair');
    setValues([...DIE_LOSSES]);
    setDraft(DIE_LOSSES.join(', '));
    setError('');
    setNullValue(0);
  };
  const controls = (
    <>
      <Controls reset={reset}>
        <Choice
          label="Prediction information"
          value={partition}
          onChange={setPartition}
          options={entries(INFORMATION_PARTITIONS)}
        />
        <Choice
          label="Sampling law"
          value={sampling}
          onChange={setSampling}
          options={[
            ['fair', 'Fair die'],
            ['missing-six', 'Missing face 6'],
          ]}
        />
        {state.hasNullCell && (
          <FlowSlider
            name="Null-cell version"
            value={nullValue}
            onChange={setNullValue}
            min={-20}
            max={20}
            step={1}
          />
        )}
      </Controls>
      <form
        className="mt-loss-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            setValues(parseLosses(draft));
            setError('');
          } catch (ex) {
            setError(ex.message);
          }
        }}
      >
        <label className="mt-input">
          Six losses, each from −100 to 100
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
        <button type="submit">Apply losses</button>
        {error && (
          <p role="alert" id={errorId}>
            {error} The last valid calculation remains displayed.
          </p>
        )}
      </form>
    </>
  );
  return (
    <Lab id="MT50" label="Conditional means from available information">
      <ConditionalPicture state={state} controls={controls} />
    </Lab>
  );
}
export function TransferLab() {
  const [source, setSource] = useState('fair'),
    [target, setTarget] = useState('lossHeavy');
  return (
    <Lab id="MT59" label="Supported and unsupported measure transfer">
      <TransferPicture
        state={reweightState(source, target)}
        controls={
          <Controls
            reset={() => {
              setSource('fair');
              setTarget('lossHeavy');
            }}
          >
            <Choice
              label="Source law"
              value={source}
              onChange={setSource}
              options={[
                ['fair', 'Fair die'],
                ['missing-six', 'Missing face 6'],
              ]}
            />
            <Choice
              label="Target law"
              value={target}
              onChange={setTarget}
              options={[
                ['uniform', 'Uniform target'],
                ['lossHeavy', 'Higher-loss target'],
                ['last', 'Only face 6'],
              ]}
            />
          </Controls>
        }
      />
    </Lab>
  );
}
