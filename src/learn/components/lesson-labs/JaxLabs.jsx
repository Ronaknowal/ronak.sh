import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as format } from './NeuralLessonElements.jsx';
import { calibrationState, traceOutput, traceSignature } from '../../data/jax-models.js';
import './neural-lesson-neutral.css';
import './functional-framework-lessons.css';

const flowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16, margin: '20px 0' };

export function JaxStateFigure() {
  return <figure aria-label="A pure step receives parameters, velocity and key and returns all three updated values.">
    <figcaption>Follow the state through one call</figcaption>
    <div style={flowStyle}>
      <div><strong>Inputs</strong><p>parameters p<br/>velocity v<br/>random key k</p></div>
      <div><strong>→ step(p, v, k, data) →</strong><p>forward → loss → gradient → update</p></div>
      <div><strong>Returned state</strong><p>parameters p′<br/>velocity v′<br/>continuation key k′</p></div>
    </div>
    <p>The caller uses the returned state for the next call. Arrows show dependencies; positions do not encode numbers.</p>
  </figure>;
}

export function JaxGradientLab() {
  const [weight, setWeight] = useState(0);
  const [bias, setBias] = useState(0);
  const [rate, setRate] = useState(0.1);
  const state = calibrationState(weight, bias, rate);
  return <NeuralLab title="Which examples move which parameter?" id="jax-gradient">
    <p>Four fixed calibration measurements. Edit the current parameters or step size; every row and the one-step preview update immediately.</p>
    <div className="neural-controls">
      <NeuralNumber label="Current weight w" value={weight} onChange={setWeight} min={-2} max={4} step={0.05}/>
      <NeuralNumber label="Current bias b" value={bias} onChange={setBias} min={-2} max={4} step={0.05}/>
      <NeuralNumber label="Learning rate" value={rate} onChange={setRate} min={0} max={1} step={0.01}/>
    </div>
    <p><strong>Current loss {format(state.loss)}</strong> → gradient ({format(state.gradient.weight)}, {format(state.gradient.bias)}) → next parameters ({format(state.next.weight)}, {format(state.next.bias)}) → <strong>next loss {format(state.nextLoss)}</strong>.</p>
    <figure><figcaption>Signed contributions r × x to the weight gradient; common fixed scale −32 to +32</figcaption>
      {state.contributions.map((row, index) => <div key={row.x} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <span style={{ minWidth: 150 }}>Row {index + 1}: {format(row.weightGradient)}</span>
        <svg viewBox="0 0 280 28" role="img" aria-label={`Row ${index + 1} weight-gradient contribution ${format(row.weightGradient)}`} style={{ width: 280, maxWidth: '100%', height: 28 }}>
          <line x1="12" x2="268" y1="14" y2="14" stroke="#555"/>
          <line x1="140" x2="140" y1="2" y2="26" stroke="#aaa"/>
          <rect x={Math.min(140, 140 + row.weightGradient * 4)} y="7" width={Math.abs(row.weightGradient) * 4} height="14" fill="#e4b752"/>
        </svg>
      </div>)}
    </figure>
    <NeuralTable caption="Exact calculation behind each contribution" headers={['x → y', 'Prediction', 'Residual r', 'r × x', 'r (bias)']} rows={state.contributions.map(row => [`${row.x} → ${row.y}`, format(row.prediction), format(row.residual), format(row.weightGradient), format(row.biasGradient)])}/>
    <p>{state.loss < 1e-12 ? 'Every residual is zero: neither parameter has an error signal.' : rate === 0 ? 'The derivatives remain visible, but a zero learning rate makes no parameter move.' : state.nextLoss > state.loss ? 'This step increased loss: the chosen move overshot useful local progress. Reduce the rate and compare.' : 'The preview uses the same pre-update gradient for both parameters. A negative derivative asks for an increase under gradient descent.'}</p>
    <button type="button" onClick={() => { setWeight(0); setBias(0); setRate(0.1); }}>Reset</button>{' '}
    <button type="button" onClick={() => { setWeight(2); setBias(1); }}>Inspect exact fit</button>
  </NeuralLab>;
}

export function JaxTraceLab() {
  const [length, setLength] = useState(4);
  const [offset, setOffset] = useState(0);
  const [dtype, setDtype] = useState('float32');
  const [reduction, setReduction] = useState('sum');
  const initial = traceSignature(4, 'float32', 'sum');
  const [cached, setCached] = useState([initial]);
  const [history, setHistory] = useState([{ signature: initial, status: 'compile', result: 14 }]);
  const signature = traceSignature(length, dtype, reduction);
  const output = traceOutput(length, offset, reduction);
  const hit = cached.includes(signature);
  function call() {
    if (!hit) setCached(previous => [...previous, signature]);
    setHistory(previous => [...previous, { signature, status: hit ? 'reuse' : 'compile', result: output.result }].slice(-8));
  }
  function reset() {
    setLength(4); setOffset(0); setDtype('float32'); setReduction('sum');
    setCached([initial]); setHistory([{ signature: initial, status: 'compile', result: 14 }]);
  }
  return <NeuralLab title="Change values or change the compiled signature" id="jax-trace">
    <p>A teaching model of one function's cache: square the input values, then sum or average. The selected reduction is marked static. No real JAX compiler or benchmark runs here.</p>
    <div className="neural-controls">
      <NeuralNumber label="Array length" value={length} onChange={setLength} min={2} max={8} step={1} integer/>
      <NeuralNumber label="Value offset" value={offset} onChange={setOffset} min={-4} max={4} step={0.25}/>
      <NeuralSelect label="Array dtype" value={dtype} onChange={setDtype} options={[["float32", "float32"], ["float64", "float64 (x64 enabled)"]]}/>
      <NeuralSelect label="Static reduction" value={reduction} onChange={setReduction} options={[["sum", "sum"], ["mean", "mean"]]}/>
    </div>
    <p>Values [{output.values.join(', ')}] → squares → {reduction} = <strong>{format(output.result)}</strong>.</p>
    <p style={{ overflowWrap: 'anywhere' }}>Selected signature: <code>{signature}</code></p>
    <p><strong>{hit ? 'Matching signature is cached.' : 'This signature is new.'}</strong> {hit ? 'Changing only the values leaves the recipe reusable.' : 'The next recorded call adds a compiled recipe in this model.'}</p>
    <button type="button" onClick={call}>Record this call</button>{' '}<button type="button" onClick={reset}>Reset</button>
    <NeuralTable caption="Last eight calls; values are calculated, compile/reuse is the stated model" headers={['Call', 'Signature', 'Action → result']} rows={history.map((entry, index) => [index + 1, <span style={{ overflowWrap: 'anywhere' }}>{entry.signature}</span>, `${entry.status} → ${format(entry.result)}`])}/>
    <p>Cached recipes: {cached.length}. History keeps eight calls; the bounded configuration has at most 28 signatures. Dtype is a signature label here; this browser calculation uses JavaScript numbers, not float32 emulation.</p>
  </NeuralLab>;
}
