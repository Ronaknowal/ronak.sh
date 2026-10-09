import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, NeuralPlot, formatNeural as format } from './NeuralLessonElements.jsx';
import { trainingHistory, classifyMetricEvent } from '../../data/experiment-tracking-models.js';
import './neural-lesson-neutral.css';

export function TrackingLineageFigure() {
  return <figure><figcaption>One run links the inputs to two different kinds of output</figcaption>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 20, margin: '20px 0' }}>
      <div><strong>Used by run →</strong><p>data / split identity<br/>source / environment<br/>configuration</p></div>
      <div><strong>Run: calibration-01</strong><p>declared procedure<br/>current status<br/>parent attempt, if any</p></div>
      <div><strong>→ Produced by run</strong><p>metric: loss / step / value<br/>artifact: checkpoint → digest<br/>selection: “best” → artifact</p></div>
    </div><p>A selection label may move; the original run-to-artifact reference should remain recoverable. Arrows show provenance, not execution time.</p>
  </figure>;
}

export function TrackingBudgetLab() {
  const [firstBatch, setFirstBatch] = useState(2);
  const [secondBatch, setSecondBatch] = useState(4);
  const [rate, setRate] = useState(.1);
  const [updates, setUpdates] = useState(10);
  const [axis, setAxis] = useState('step');
  const [inspect, setInspect] = useState(1);
  const first = trainingHistory(firstBatch, rate, updates);
  const second = trainingHistory(secondBatch, rate, updates);
  const selected = Math.min(inspect, updates);
  const lastFirst = first.at(-1), lastSecond = second.at(-1);
  const maximumLoss = Math.max(...first.map(row => row.loss), ...second.map(row => row.loss), 5.5);
  function reset() { setFirstBatch(2); setSecondBatch(4); setRate(.1); setUpdates(10); setAxis('step'); setInspect(1); }
  return <NeuralLab title="Same run history, different comparison budget" id="tracking-budget">
    <p>Two deterministic SGD runs on the four calibration rows. Both start from zero. Each point measures full-fixture half-MSE after that update. No held-out data or wall-clock timing is modeled.</p>
    <div className="neural-controls">
      <NeuralNumber label="Run A batch size" value={firstBatch} onChange={setFirstBatch} min={1} max={4} step={1} integer/>
      <NeuralNumber label="Run B batch size" value={secondBatch} onChange={setSecondBatch} min={1} max={4} step={1} integer/>
      <NeuralNumber label="Shared learning rate" value={rate} onChange={setRate} min={0} max={.2} step={.01}/>
      <NeuralNumber label="Optimizer updates" value={updates} onChange={setUpdates} min={1} max={30} step={1} integer/>
      <NeuralSelect label="Comparison axis" value={axis} onChange={setAxis} options={[["step", "Optimizer updates"], ["examples", "Processed examples"]]}/>
    </div>
    <NeuralPlot title="Calculated SGD histories; the initial state is included" xLabel={axis === 'step' ? 'optimizer updates' : 'example presentations'} yLabel="full-fixture half-MSE" xDomain={[0, Math.max(lastFirst[axis], lastSecond[axis])]} yDomain={[0, maximumLoss * 1.05]}
      series={[{ label: `Run A · batch ${firstBatch}`, color: '#e4b752', values: first.map(row => [row[axis], row.loss]) }, { label: `Run B · batch ${secondBatch}`, color: '#ccc', dashed: true, values: second.map(row => [row[axis], row.loss]) }]}/>
    <NeuralTable caption="State after the chosen number of updates" headers={['Run', 'Updates', 'Examples', 'w / b', 'Loss']} rows={[["A", updates, lastFirst.examples, `${format(lastFirst.weight)} / ${format(lastFirst.bias)}`, format(lastFirst.loss)], ["B", updates, lastSecond.examples, `${format(lastSecond.weight)} / ${format(lastSecond.bias)}`, format(lastSecond.loss)]]}/>
    <NeuralNumber label="Inspect recorded update" value={selected} onChange={setInspect} min={0} max={updates} step={1} integer/>
    <p>At update {selected}: A has processed {first[selected].examples} examples with loss {format(first[selected].loss)}; B has processed {second[selected].examples} with loss {format(second[selected].loss)}.</p>
    <p>{firstBatch === secondBatch ? 'Identical batch sizes and state produce coincident histories. Change one batch size to investigate exposure and update differences.' : rate === 0 ? 'A zero learning rate keeps both loss curves fixed, while processed-example counts still increase.' : 'Same update count does not necessarily mean the same number of example presentations. Switch axes, then compare the exact logged coordinates.'} A short final slice is retained; batch size 3 alternates three and one rows.</p>
    <button type="button" onClick={reset}>Reset</button>
  </NeuralLab>;
}

const startingEvents = [{ name: 'train/loss', step: 0, value: 5.5 }];
export function TrackingRetryLab() {
  const [name, setName] = useState('train/loss');
  const [step, setStep] = useState(0);
  const [value, setValue] = useState(5.5);
  const [events, setEvents] = useState(startingEvents);
  const [lastAction, setLastAction] = useState('The initial event is already stored.');
  const incoming = { name, step, value };
  const preview = classifyMetricEvent(events, incoming);
  function deliver() {
    const result = classifyMetricEvent(events, incoming);
    setEvents(result.events);
    setLastAction(`${result.status}: ${name} at step ${step}, incoming value ${format(value)}.`);
  }
  function reset() {
    setName('train/loss'); setStep(0); setValue(5.5); setEvents(startingEvents);
    setLastAction('The initial event is already stored.');
  }
  return <NeuralLab title="Deliver an event, retry it, then try a conflict" id="tracking-retry">
    <p>Local model of one run's chosen persistence policy. Change the event fields to see its consequence immediately; Deliver applies that operation to the visible store.</p>
    <div className="neural-controls">
      <NeuralSelect label="Metric name" value={name} onChange={setName} options={[["train/loss", "train/loss"], ["validation/loss", "validation/loss"]]}/>
      <NeuralNumber label="Metric step" value={step} onChange={setStep} min={0} max={5} step={1} integer/>
      <NeuralNumber label="Incoming measured value" value={value} onChange={setValue} min={0} max={10} step={.05}/>
    </div>
    <p style={{ overflowWrap: 'anywhere' }}>Incoming coordinate: <code>demo-run-01 / {name} / {step}</code>; value {format(value)}.</p>
    <p><strong>Current consequence: {preview.status}.</strong> {preview.status === 'insert' ? 'A new coordinate adds one row.' : preview.status === 'identical retry' ? 'The coordinate and value already match; the stored rows stay unchanged.' : 'This coordinate already has another value; the write is rejected and the original remains.'}</p>
    <button type="button" onClick={deliver}>Deliver event</button>{' '}<button type="button" onClick={reset}>Reset</button>
    <p role="status">{lastAction}</p>
    <NeuralTable caption={`Stored events: ${events.length}; fixed run demo-run-01`} headers={['Metric', 'Step', 'Stored value']} rows={[...events].sort((a,b) => a.name.localeCompare(b.name) || a.step - b.step).map(event => [event.name, event.step, format(event.value)])}/>
  </NeuralLab>;
}
