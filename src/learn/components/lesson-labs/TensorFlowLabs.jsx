import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as format } from './NeuralLessonElements.jsx';
import { tapeBranches, aggregateBatchMeans } from '../../data/tensorflow-models.js';
import './neural-lesson-neutral.css';
import './functional-framework-lessons.css';

const panels = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 20, margin: '20px 0' };

export function TensorFlowOwnershipFigure() {
  return <figure><figcaption>One step has four different jobs</figcaption>
    <ol style={{ lineHeight: 1.8 }}>
      <li><strong>Variables W, b</strong> hold the current parameter values.</li>
      <li><strong>Tape: X → XW + b → residual → loss</strong> records the forward dependencies.</li>
      <li><strong>Gradient request: loss → ∂L/∂W, ∂L/∂b</strong> calculates sensitivities; W and b stay unchanged.</li>
      <li><strong>Optimizer assignment</strong> writes the next values into W and b and updates optimizer state.</li>
    </ol><p>The tape is not the optimizer. A metric reads the resulting observations and accumulates its own reporting state.</p>
  </figure>;
}

export function TensorFlowTapeLab() {
  const [weight, setWeight] = useState(2);
  const [mode, setMode] = useState('connected');
  const state = tapeBranches(weight, mode === 'detached');
  return <NeuralLab title="Same forward value, different derivative path" id="tensorflow-tape">
    <p>Calculate L = w² + w². Choose whether the second branch keeps its derivative connection. This evaluates the declared equations locally; it is not TensorFlow running in the browser.</p>
    <div className="neural-controls"><NeuralNumber label="Weight w" value={weight} onChange={setWeight} min={-4} max={4} step={0.1}/>
      <NeuralSelect label="Second branch" value={mode} onChange={setMode} options={[["connected", "Connected square"], ["detached", "stop_gradient(square)"]]}/></div>
    <p><strong>Shared input w = {format(weight)}</strong> branches into two paths:</p>
    <div style={panels}>{[false, mode === 'detached'].map((cut, index) => <figure key={index} style={{ margin: 0, padding: 16, border: '1px solid #555' }}>
      <figcaption>Branch {index + 1}{cut ? ' · detached' : ' · connected'}</figcaption>
      <p>Forward: {format(weight)} × {format(weight)} = <strong>{format(state.branchValue)}</strong></p>
      <svg viewBox="0 0 240 32" style={{ width: 240, maxWidth: '100%', height: 32 }} role="img" aria-label={cut ? 'Reverse path is cut; zero derivative contribution' : 'Reverse path is connected'}>
        <line x1="20" x2="220" y1="16" y2="16" stroke={cut ? '#999' : '#e4b752'} strokeWidth="2" strokeDasharray={cut ? '5 5' : undefined}/>
        {cut ? <><line x1="114" x2="126" y1="7" y2="25" stroke="#ddd" strokeWidth="3"/><line x1="114" x2="126" y1="25" y2="7" stroke="#ddd" strokeWidth="3"/></> : <path d="M30 9 L20 16 L30 23" fill="none" stroke="#e4b752" strokeWidth="2"/>}
      </svg><p>Reverse contribution: <strong>{format(cut ? 0 : 2 * weight)}</strong>{cut ? ' — the value is treated as fixed.' : ' — local slope 2w times upstream 1.'}</p>
    </figure>)}</div>
    <p>Forward sum: {format(state.branchValue)} + {format(state.branchValue)} = <strong>{format(state.loss)}</strong>.<br/>Reverse sum: {format(state.firstGradient)} + {format(state.secondGradient)} = <strong>{format(state.gradient)}</strong>.</p>
    <p>{weight === 0 ? 'At zero, both local slopes vanish. This null input does not expose the missing path; try a nonzero weight.' : mode === 'detached' ? 'The loss still includes both values, but only the first branch contributes a derivative. Compare connected mode at the same weight.' : 'Both uses of the same variable contribute. The reverse pass adds them rather than overwriting one.'}</p>
    <button type="button" onClick={() => { setWeight(2); setMode('connected'); }}>Reset</button>
  </NeuralLab>;
}

export function TensorFlowMetricLab() {
  const [firstCount, setFirstCount] = useState(2);
  const [secondCount, setSecondCount] = useState(1);
  const [firstMean, setFirstMean] = useState(2);
  const [secondMean, setSecondMean] = useState(8);
  const state = aggregateBatchMeans(firstCount, firstMean, secondCount, secondMean);
  function reset() { setFirstCount(2); setSecondCount(1); setFirstMean(2); setSecondMean(8); }
  return <NeuralLab title="Give every example the intended weight" id="tensorflow-metric">
    <p>Each pictured row has its batch's chosen loss, so its batch mean is exact. Change counts and losses; compare a mean over examples with a mean over batches.</p>
    <div className="neural-controls">
      <NeuralNumber label="Batch A example count" value={firstCount} onChange={setFirstCount} min={1} max={8} step={1} integer/>
      <NeuralNumber label="Batch A mean loss" value={firstMean} onChange={setFirstMean} min={0} max={10} step={0.25}/>
      <NeuralNumber label="Batch B example count" value={secondCount} onChange={setSecondCount} min={1} max={8} step={1} integer/>
      <NeuralNumber label="Batch B mean loss" value={secondMean} onChange={setSecondMean} min={0} max={10} step={0.25}/>
    </div>
    <div style={panels}>{[[firstCount, firstMean], [secondCount, secondMean]].map(([count, mean], index) => <figure key={index} style={{ margin: 0 }}>
      <figcaption>Batch {index === 0 ? 'A' : 'B'}: {count} rows × {format(mean)} loss</figcaption>
      {Array.from({ length: count }, (_, row) => <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
        <span>{row + 1}</span><span style={{ flex: 1, height: 14, border: '1px solid #555' }}><span style={{ display: 'block', height: '100%', width: `${mean * 10}%`, background: '#e4b752' }}/></span>
      </div>)}<p>Sum = {format(count * mean)}; count = {count}</p>
    </figure>)}</div>
    <p>Each bar uses the fixed scale 0–10 loss units. Bar count is example count; its length is that example's constructed loss.</p>
    <NeuralTable caption="Two different aggregations" headers={['Question', 'Calculation', 'Result']} rows={[
      ['Mean over examples', `${format(state.total)} / ${state.count}`, format(state.mean)],
      ['Mean over batch means', `(${format(firstMean)} + ${format(secondMean)}) / 2`, format(state.batchMean)],
    ]}/>
    <p>{Math.abs(state.mean - state.batchMean) < 1e-10 ? 'The two values agree here because counts or batch means match. Change both to expose the distinction.' : 'The equal-batch calculation gives every batch half the weight, regardless of how many examples it contains. Use total loss / total count for the per-example mean.'}</p>
    <button type="button" onClick={reset}>Reset</button>
  </NeuralLab>;
}
