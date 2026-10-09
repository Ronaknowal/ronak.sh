import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { accumulationComparison, trainingMemoryBudget } from '../../data/training-acceleration-models.js';

const cells = { display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBlock: '1rem' };
const cell = { border: '1px solid #64522e', borderRadius: 4, padding: '.7rem', flex: '1 1 120px', background: '#141311' };

export function TrainingExecutionFigure() {
  return <figure aria-label="Training work and state lifetimes"><figcaption>Follow one step; identify what survives it</figcaption>
    <div style={cells}>{['Examples →', 'Forward: save activations →', 'Backward: add gradients →', 'Optimizer: change weights'].map(text => <div key={text} style={cell}>{text}</div>)}</div>
    <p><strong>Across every step:</strong> weights + optimizer history. <strong>Inside this step:</strong> temporary activations. <strong>Until this update:</strong> accumulated gradient buffer.</p>
  </figure>;
}

export function AccumulationWeightLab() {
  const [weight, setWeight] = useState(.5), [microbatch, setMicrobatch] = useState(3);
  const result = accumulationComparison(weight, microbatch);
  return <NeuralLab id="accumulation-weights" title="Does changing the grouping change the objective?">
    <p>Exact scalar computation. Edit the shared starting weight or rows per microbatch. Learning rate stays 0.1.</p>
    <div className="neural-controls"><NeuralNumber label="Starting weight" value={weight} onChange={setWeight} min={-1} max={2} step={.1} /><NeuralNumber label="Rows per microbatch" value={microbatch} onChange={setMicrobatch} min={1} max={4} step={1} integer /></div>
    <div style={cells}>{result.groups.map((group, index) => <div style={{ ...cell, flexBasis: 220 }} key={group.start}><strong>Group {index + 1}: {group.count} {group.count === 1 ? 'row' : 'rows'}</strong>{result.contributions.slice(group.start, group.start + group.count).map((value, offset) => <p key={offset}>Row {group.start + offset + 1}: contribution {formatNeural(value)}<br />Correct weight 1/4; equal-group weight 1/{group.count * result.groups.length}</p>)}</div>)}</div>
    <NeuralTable caption="Same rows and starting weight, two reductions" headers={['Reduction', 'Gradient', 'Next weight']} rows={[
      ['Mean over every row', formatNeural(result.correct), formatNeural(result.correctWeight)],
      ['Mean of group means', formatNeural(result.meanOfMeans), formatNeural(result.wrongWeight)],
    ]} />
    <p>{Math.abs(result.correct - result.meanOfMeans) < 1e-10 ? 'The two reductions agree in this state. Equal-sized groups always give each row the same weight; other coincidences can happen at particular weights.' : 'The smaller group receives too much weight under equal-group averaging. Changing grouping has changed the objective.'} Choose 3 rows per group to expose unequal sizes; choose 4 for the one-group baseline.</p>
    <button type="button" onClick={() => { setWeight(.5); setMicrobatch(3); }}>Reset weighting</button>
  </NeuralLab>;
}

export function AccelerationBudgetLab() {
  const [parameters, setParameters] = useState(1), [activations, setActivations] = useState(8), [workers, setWorkers] = useState(4), [stage, setStage] = useState('0'), [recompute, setRecompute] = useState(false);
  const budget = trainingMemoryBudget(parameters, activations, workers, Number(stage), recompute);
  const labels = ['Weights', 'Gradients', 'Adam moments', 'Activations'];
  const colors = ['#e4b752', '#a3a3a3', '#73634b', '#d9d5ce'];
  return <NeuralLab id="training-memory" title="Which part of the memory budget can your change reduce?">
    <p>Analytic decimal-GB model. FP32 weights/gradients/moments; no extra master copy, temporary buffers or allocator overhead. Both bars share a scale.</p>
    <div className="neural-controls"><NeuralNumber label="Parameters (billions)" value={parameters} onChange={setParameters} min={.1} max={8} step={.1} /><NeuralNumber label="Local activations (GB)" value={activations} onChange={setActivations} min={0} max={32} step={.5} /><NeuralNumber label="Workers" value={workers} onChange={setWorkers} min={1} max={8} step={1} integer /><NeuralSelect label="State partition" value={stage} onChange={setStage} options={[["0", 'Replicated'], ['1', 'ZeRO stage 1'], ['2', 'ZeRO stage 2'], ['3', 'ZeRO stage 3']]} /></div>
    <label><input type="checkbox" checked={recompute} onChange={event => setRecompute(event.target.checked)} /> Assume recomputation halves activation storage (model assumption)</label>
    <div style={{ ...cells, gap: '.4rem 1rem' }} aria-label="Memory segments, from left to right">{labels.map((label, index) => <span key={label} style={{ display: 'inline-flex', gap: '.35rem', alignItems: 'center' }}><span aria-hidden="true" style={{ width: '.8rem', height: '.8rem', background: colors[index], flexShrink: 0 }} />{index + 1}. {label}</span>)}</div>
    {[["Replicated baseline", budget.baseline, budget.baselineTotal], ['Proposed per worker', budget.proposed, budget.proposedTotal]].map(([label, values, total]) => <figure key={label}><figcaption>{label}: {formatNeural(total, 2)} GB</figcaption><div style={{ display: 'flex', height: 30, width: '100%', background: '#232323' }} role="img" aria-label={`${label}: ${values.map((value, index) => `${labels[index]} ${value} GB`).join(', ')}`}>{values.map((value, index) => <span key={labels[index]} style={{ width: `${100 * value / budget.baselineTotal}%`, background: colors[index], borderRight: value ? '1px solid #111' : undefined }} />)}</div></figure>)}
    <NeuralTable caption="Exact budget terms per worker, GB" headers={['Category', 'Baseline', 'Proposed']} rows={labels.map((label, index) => [label, formatNeural(budget.baseline[index]), formatNeural(budget.proposed[index])])} />
    <p>State partitioning does not shrink the local activation estimate. Recomputation does not partition weights. At one worker, partitioning has no capacity benefit in this accounting model. Actual sharded execution has transient communication/materialization peaks.</p>
    <button type="button" onClick={() => { setParameters(1); setActivations(8); setWorkers(4); setStage('0'); setRecompute(false); }}>Reset budget</button>
  </NeuralLab>;
}
