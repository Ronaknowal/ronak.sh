import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as fmt } from './NeuralLessonElements.jsx';
import { tensorStorage, gradientState, dropoutMode } from './pytorch-models.js';
import './neural-lesson-neutral.css';
import './pytorch-labs.css';

function TensorCells({ values, columns, label, addresses, selected }) {
  return <figure className="pytorch-tensor"><figcaption>{label}</figcaption><div className="pytorch-cells" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{values.map((value, index) => <div key={index} className={selected === index ? 'pytorch-cell-selected' : ''}><small>{addresses ? `slot ${addresses[index]}` : `[${Math.floor(index / columns)},${index % columns}]`}</small><strong>{fmt(value)}</strong></div>)}</div></figure>;
}

export function TensorShapeFigure() {
  return <figure className="pytorch-shape"><figcaption>One row stays one example throughout the forward pass</figcaption><ol>
    <li><strong>Measurements</strong><code>[B, 13]</code><span>Subtract center and divide by scale</span></li>
    <li><strong>Hidden units</strong><code>[B, 12]</code><span>Linear 13 → 12, then ReLU</span></li>
    <li><strong>Class logits</strong><code>[B, 3]</code><span>Linear 12 → 3</span></li>
    <li><strong>One loss</strong><code>scalar</code><span>Compare with B integer labels; average</span></li>
  </ol><p>Each arrow transforms columns; the batch dimension B survives until the final reduction.</p></figure>;
}

export function ModuleStateFigure() {
  return <figure className="pytorch-state"><figcaption>WineClassifier owns state by name</figcaption><div><strong>Trainable parameters · 207 scalars</strong><ul><li>hidden.weight [12,13] + hidden.bias [12]</li><li>output.weight [3,12] + output.bias [3]</li></ul></div><div><strong>Persistent buffers · 26 scalars</strong><ul><li>center [13] — fitted on training rows</li><li>scale [13] — fitted on training rows</li></ul></div><p><code>parameters()</code> → optimizer gets the first branch.<br /><code>state_dict()</code> → saving includes both branches.</p></figure>;
}

export function TensorStorageLab() {
  const [mode, setMode] = useState('view');
  const [value, setValue] = useState(9);
  const result = tensorStorage(mode, value);
  return <NeuralLab title="Edit a transposed cell: does the original change?" id="pytorch-storage">
    <p>Start with [[1,2,3],[4,5,6]]. Every control change repeats <code>t[1,0] = value</code> from that fixed starting array. Slot labels reveal the address mapping.</p>
    <div className="neural-controls"><NeuralSelect label="Ownership" value={mode} onChange={setMode} options={ [['view', 'Transpose view — shared storage'], ['copy', 'Contiguous transpose — copied storage']] }/><NeuralNumber label="Value assigned to t[1,0]" value={value} onChange={setValue} min={-5} max={12} step={1}/></div>
    <div className="neural-two"><TensorCells values={result.source} columns={3} label="Original array after the edit" selected={mode === 'view' ? 1 : undefined}/><TensorCells values={result.logical} columns={2} label={`Transposed logical view · strides [${result.strides.join(',')}]`} addresses={result.addresses} selected={2}/></div>
    <TensorCells values={result.storage} columns={3} label={mode === 'view' ? 'Shared storage, slots 0–5' : 'Separate contiguous storage, slots 0–5'} addresses={[0, 1, 2, 3, 4, 5]} selected={mode === 'view' ? 1 : 2}/>
    <p className="neural-result">{mode === 'view' ? `Original [0,1] becomes ${value}: transposed [1,0] reaches slot 1 × 1 + 0 × 3 = 1 in shared storage.` : `Original [0,1] remains 2. Transposed [1,0] reaches slot 1 × 2 + 0 × 1 = 2 in its separate copy.`}</p>
    <div className="neural-buttons"><button type="button" onClick={() => setValue(2)}>Restore the original value</button><button type="button" onClick={() => { setMode('view'); setValue(9); }}>Reset investigation</button></div>
    <p>Use the copy when isolation matters; retain the view when intentional sharing avoids an unnecessary allocation. The small six-slot example illustrates ownership, not a speed benchmark.</p>
  </NeuralLab>;
}

export function GradientStateLab() {
  const [weight, setWeight] = useState(1), [rate, setRate] = useState(0.1), [passes, setPasses] = useState(1);
  const [reduction, setReduction] = useState('mean'), [graph, setGraph] = useState('connected');
  const result = gradientState({ weight, rate, passes, reduction, detached: graph === 'detached' });
  return <NeuralLab title="Follow residuals → accumulated gradient → one update" id="pytorch-gradient">
    <p>Fixed rows x = [1,2], y = [2,4]. Each backward pass below uses a fresh forward graph at the same unchanged weight; there is only one optimizer update after accumulation.</p>
    <div className="neural-controls"><NeuralNumber label="Starting weight w" value={weight} onChange={setWeight} min={-1} max={4} step={0.1}/><NeuralNumber label="Learning rate" value={rate} onChange={setRate} min={0} max={1} step={0.05}/><NeuralSelect label="Loss reduction" value={reduction} onChange={setReduction} options={ [['mean', 'Mean half-squared error'], ['sum', 'Sum half-squared error']] }/><NeuralNumber label="Backward passes before clearing" value={passes} onChange={setPasses} min={1} max={3} step={1} integer/><NeuralSelect label="Derivative connection" value={graph} onChange={setGraph} options={ [['connected', 'Output connected to w'], ['detached', 'Output detached from w']] }/></div>
    <div className="pytorch-residuals">{result.rows.map(row => <div key={row.x}><strong>x = {row.x} → output {fmt(row.output)}</strong><div className="pytorch-residual-track" aria-hidden="true"><span style={{ left: `${(row.target + 2) / 10 * 100}%` }} className="pytorch-target"/><span style={{ left: `${(row.output + 2) / 10 * 100}%` }} className="pytorch-output"/></div><p>Target ● {row.target} · output ◇ {fmt(row.output)}<br />Residual {fmt(row.residual)} × x {row.x} = derivative contribution {fmt(row.residual * row.x)}</p></div>)}</div>
    <p>Rulers share [−2,8]. These marks show values; use the labeled controls above to change them.</p>
    <NeuralTable caption="The current operation state" headers={['Quantity', 'Value']} rows={[
      ['Loss before update', fmt(result.loss)], ['Connected mathematical derivative', fmt(result.derivative)],
      ['Parameter .grad after backward', result.accumulated === null ? 'None — backward raises: no derivative graph' : fmt(result.accumulated)],
      ['Weight after one SGD step', result.nextWeight === null ? 'No step performed' : fmt(result.nextWeight)],
      ['Loss after that step', result.nextLoss === null ? 'No step performed' : fmt(result.nextLoss)],
    ]}/>
    <p className="neural-result">{graph === 'detached' ? 'The numerical loss still exists, but detaching the entire model output removes this derivative path. A missing gradient is not convergence.' : result.loss === 0 ? 'The connected derivative is genuinely zero: both targets are already matched.' : result.nextLoss < result.loss ? 'This update reduces the chosen loss. Change the rate or accumulated pass count to find where the step becomes too large.' : result.nextLoss === result.loss ? 'The chosen update leaves the loss unchanged. Inspect whether the rate is zero or the step crossed to an equal-error point.' : 'The derivative is still correct, but this step increases the loss. Reduce its effective size: rate × accumulated passes × reduction scale.'}</p>
    <div className="neural-buttons"><button type="button" onClick={() => { setWeight(2); setGraph('connected'); }}>Inspect zero error</button><button type="button" onClick={() => { setWeight(1); setRate(0.1); setPasses(1); setReduction('mean'); setGraph('connected'); }}>Reset investigation</button></div>
  </NeuralLab>;
}

export function DropoutModeLab() {
  const [probability, setProbability] = useState(0.5), [mode, setMode] = useState('train'), [recording, setRecording] = useState('on');
  const result = dropoutMode({ probability, training: mode === 'train', recording: recording === 'on' });
  return <NeuralLab title="Two independent switches: forward behavior and derivative recording" id="pytorch-mode">
    <p>Four activations use fixed illustrative uniforms [0.1,0.4,0.7,0.9]. In training mode a unit is kept when its uniform ≥ p. Changing p compares the same draws; a real training run draws new masks.</p>
    <div className="neural-controls"><NeuralNumber label="Drop probability p" value={probability} onChange={setProbability} min={0} max={0.9} step={0.05}/><NeuralSelect label="Module mode" value={mode} onChange={setMode} options={ [['train', 'train()'], ['eval', 'eval()']] }/><NeuralSelect label="Autograd recording" value={recording} onChange={setRecording} options={ [['on', 'Ordinary grad mode'], ['off', 'Inside no_grad()']] }/></div>
    <div className="pytorch-dropout">{result.rows.map(row => <div key={row.input}><strong>{row.input}</strong><span>uniform {row.uniform}</span><span className="pytorch-gate">{mode === 'eval' ? 'identity' : row.kept ? `keep ÷ ${fmt(1 - probability)}` : 'drop → 0'}</span><strong>{fmt(row.output)}</strong></div>)}</div>
    <p className="neural-result">Forward: {mode === 'eval' ? 'unchanged activations' : `dropout with p = ${probability}`}. Derivative recording: {result.recording ? 'on, assuming input requires gradients' : 'off'}. {mode === 'train' && !result.recording ? 'no_grad did not disable dropout.' : mode === 'eval' && result.recording ? 'eval did not disable autograd.' : 'These settings control different mechanisms.'}</p>
    <div className="neural-buttons"><button type="button" onClick={() => setProbability(0)}>Inspect p = 0</button><button type="button" onClick={() => { setProbability(0.5); setMode('train'); setRecording('on'); }}>Reset investigation</button></div>
  </NeuralLab>;
}
