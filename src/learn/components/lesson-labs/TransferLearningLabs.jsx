import useLessonViewport from './useLessonViewport.js';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowChoice, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import experiment from '../../data/transfer-learning-experiment.json';
import specimens from '../../data/transfer-learning-specimens.json';
import features from '../../data/transfer-learning-features.json';
import { TRANSFER_METHODS, TRANSFER_LABELS, loraForward, loraStep, batchNormFixture, batchNormForward, adapterBudget, selectTransferCandidate } from '../../data/transfer-learning-model.js';
import { freezeSwitchesStep } from '../../data/transfer-learning-freeze.js';
import programUrl from '../../assets/transfer-learning/transfer-experiments.py?url';
import dataUrl from '../../assets/transfer-learning/digits-400.csv?url';
import provenanceUrl from '../../assets/transfer-learning/data-provenance.md?url';
import './transfer-learning.css';

export { programUrl, dataUrl, provenanceUrl };
const number = (value, digits = 4) => Number.isFinite(value) ? (Number(value.toFixed(digits)) + 0).toLocaleString('en-US', { maximumFractionDigits: digits }).replace('-', '−') : 'Unavailable';
const vector = values => `(${values.map(value => number(value)).join(', ')})`;

// Match SVG user units to CSS pixels so axis labels remain readable on phones.
function usePlotWidth() {
  const container = useRef(null);
  const [width, setWidth] = useState(490);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width;
      if (next > 0) setWidth(next);
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return [container, width];
}

function PixelDigit({ row, label }) {
  return <figure className="transfer-digit"><svg className="transfer-pixels" viewBox="0 0 80 80" role="img" aria-label={`Recorded digit ${row.digit}; source ID ${row.source_id}; 8 by 8 pixels, intensity 0 to 16`}>
    {row.pixels.map((value, i) => <rect key={i} x={10 * (i % 8)} y={10 * Math.floor(i / 8)} width="10" height="10" fill={`rgb(${Math.round(18 + value * 14)},${Math.round(18 + value * 14)},${Math.round(18 + value * 14)})`} />)}
  </svg><figcaption>{label}<br />source ID {row.source_id}</figcaption></figure>;
}

/** Section 1: the copied backbone feeds whichever head is attached; the head decides the meaning. */
export function TransferReuseLab() {
  const [head, setHead] = useState('target');
  const five = features.seeds[0].specimens.find(row => row.digit === 5);
  const row = specimens.training.find(r => r.source_id === five.source_id) || specimens.training.find(r => r.digit === 5);
  const source = head === 'source';
  return <FlowLab id="transfer-reuse" label="Attach a head to the copied backbone">
    <div className="transfer-reuse">
      <PixelDigit row={row} label="A real 5 from the new task" />
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className="transfer-reuse-box is-frozen"><strong>Copied backbone</strong><span>64 → tanh 32 → tanh 16 · copied, not changed in this lab</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className="transfer-reuse-box is-computed"><strong>Features h</strong><span>16 numbers</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className={'transfer-reuse-box ' + (source ? 'is-source' : 'is-added')}><strong>{source ? 'Original source head' : 'New target head'}</strong><span>outputs mean {source ? '0 · 1 · 2 · 3 · 4' : '5 · 6 · 7 · 8 · 9'}</span></div>
    </div>
    <FlowControls>
      <FlowChoice label="Head reading the features" options={[['target', 'New target head'], ['source', 'Original source head']]} value={head} onChange={setHead} />
    </FlowControls>
    <FlowReadout><span data-testid="transfer-head-meaning">{source
      ? <>The original head’s largest score for this 5 is the one meaning <strong>“{five.source_head_says}”</strong>. Its five scores still mean digits 0–4, so it can only name an old digit; a matching shape cannot turn them into scores for 5–9.</>
      : <>The new head’s five outputs will mean <strong>5–9</strong> once it is trained; before training its weights are random. The original head is kept aside to measure the old task later.</>}</span></FlowReadout>
  </FlowLab>;
}

/** Section 2, model state: a forward pass in training mode rewrites BatchNorm's stored statistics. */
export function TransferRunningStatsLab() {
  const [state, setState] = useState(batchNormFixture);
  const [passes, setPasses] = useState(0);
  const result = batchNormForward(state);
  const training = state.training;
  return <FlowLab id="transfer-running-stats" label="A frozen layer's stored statistics can still change">
    <div className="transfer-bn-trace">
      <div className="transfer-bn-cell is-input"><strong>Batch in</strong><span>{vector(state.input)}</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className="transfer-bn-cell is-frozen"><strong>BatchNorm, nothing trainable</strong><span>normalizes with {training ? 'this batch’s mean and variance' : 'the stored buffers'}: mean {number(result.usedMean)}, variance {number(result.usedVariance)}</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className="transfer-bn-cell is-computed"><strong>Output</strong><span>{vector(result.output)}</span></div>
    </div>
    <div className="transfer-bn-buffers"><strong>Stored buffers</strong><span>running mean {number(state.mean)} → after this pass {number(result.nextMean)}</span><span>running variance {number(state.variance)} → after this pass {number(result.nextVariance)}</span></div>
    <FlowControls>
      <FlowChoice label="Mode" options={[[true, 'Training'], [false, 'Evaluation']]} value={training} onChange={value => setState(current => ({ ...current, training: value }))} />
      <button type="button" onClick={() => { setState(current => ({ ...current, mean: result.nextMean, variance: result.nextVariance })); setPasses(value => value + 1); }}>Apply one forward pass</button>
      <button type="button" onClick={() => { setState(batchNormFixture()); setPasses(0); }}>Start over</button>
    </FlowControls>
    <FlowReadout><span data-testid="transfer-bn-state">{passes} forward {passes === 1 ? 'pass' : 'passes'} applied. {training
      ? <>In training mode the next pass moves the running mean to <strong>{number(result.nextMean)}</strong> (momentum 0.1, batch mean 2) and the running variance to <strong>{number(result.nextVariance)}</strong>, using the unbiased batch variance 2, although no weight changes. Whether gradients are recorded makes no difference to this update; only the mode decides.</>
      : <>In evaluation mode the pass reads the stored buffers and leaves them unchanged at mean <strong>{number(state.mean)}</strong> and variance <strong>{number(state.variance)}</strong>.</>}</span></FlowReadout>
  </FlowLab>;
}

const affineSetups = {
  frozen: { trainable: false, optimizer: false, label: 'Frozen' },
  gradient: { trainable: true, optimizer: false, label: 'Gradients, not in optimizer' },
  trains: { trainable: true, optimizer: true, label: 'Gradients and in optimizer' },
};

/** Section 2, parameters: gradients and optimizer membership are separate switches. */
export function TransferFreezeSwitchesLab() {
  const [setup, setSetup] = useState('frozen');
  const [params, setParams] = useState({ gamma: 1, beta: 0 });
  const [steps, setSteps] = useState(0);
  const result = freezeSwitchesStep(params, affineSetups[setup]);
  const choose = key => { setSetup(key); setParams({ gamma: 1, beta: 0 }); setSteps(0); };
  return <FlowLab id="transfer-freeze-switches" label="Which set-up lets an SGD step change γ and β?">
    <div className="transfer-bn-trace">
      <div className="transfer-bn-cell is-input"><strong>Batch, normalized with the stored buffers</strong><span>{vector(result.normalized)}</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className={'transfer-bn-cell ' + (setup === 'trains' ? 'is-added' : 'is-frozen')}><strong>γ · x̂ + β</strong><span>γ = {number(params.gamma)}, β = {number(params.beta)}</span></div>
      <span className="transfer-flow-arrow" aria-hidden="true">→</span>
      <div className="transfer-bn-cell is-computed"><strong>Output</strong><span>{vector(result.output)}; target (0, 2); loss {number(result.loss)}</span></div>
    </div>
    <FlowControls>
      <FlowChoice label="Affine parameters" options={Object.entries(affineSetups).map(([key, value]) => [key, value.label])} value={setup} onChange={choose} />
      <button type="button" onClick={() => { setParams({ gamma: result.nextGamma, beta: result.nextBeta }); setSteps(value => value + 1); }} disabled={steps >= 10}>Apply one SGD step (rate 0.1)</button>
    </FlowControls>
    <FlowReadout><span data-testid="transfer-bn-gradients">{steps} {steps === 1 ? 'step' : 'steps'} applied. {result.gradGamma === null
      ? <>Frozen: backpropagation computes <strong>no</strong> γ or β gradient, so the step changes nothing and the loss stays {number(result.loss)}. The gradient still passes through γ and β to the input: <strong>{vector(result.inputGradient)}</strong>.</>
      : setup === 'gradient'
        ? <>Gradients exist (γ <strong>{number(result.gradGamma)}</strong>, β <strong>{number(result.gradBeta)}</strong>), but this optimizer does not own the parameters, so the step leaves them at γ = {number(params.gamma)}, β = {number(params.beta)} and the loss at {number(result.loss)}.</>
        : <>Gradients γ <strong>{number(result.gradGamma)}</strong>, β <strong>{number(result.gradBeta)}</strong> and optimizer membership are both present, so the next step moves γ to <strong>{number(result.nextGamma)}</strong> and β to <strong>{number(result.nextBeta)}</strong>, lowering the loss from {number(result.loss)}.</>}</span></FlowReadout>
  </FlowLab>;
}

const partitionNames = { source_train: 'Source training', source_holdout: 'Source holdout', target_train: 'Target training', target_validation: 'Target validation', target_test: 'Target test' };
const partitionRows = { source_train: 'first 30 rows of each digit', source_holdout: 'last 10 rows of each digit', target_train: 'first 8 rows of each digit', target_validation: 'next 12 rows of each digit', target_test: 'last 20 rows of each digit' };
const partitionPurposes = { source_train: 'learn the backbone and the original head', source_holdout: 'measure retention with the original head; never used to choose', target_train: 'fit every adaptation candidate', target_validation: 'compare candidates and choose one', target_test: 'report the one chosen model, once' };

export function TransferPartitionsFigure() {
  const [teachingSection, ready] = useLessonViewport();
  return <figure className="transfer-partitions-figure" data-figure="transfer-partitions">
    <div className="transfer-partitions">{Object.entries(experiment.splits_source_ids).map(([key, ids]) => <div key={key} className={key.startsWith('source') ? 'is-source' : 'is-target'}><p className="transfer-part-title">{partitionNames[key]}</p><strong>{ids.length} images</strong><p>digits {key.startsWith('source') ? '0–4' : '5–9'}, {partitionRows[key]}</p><p>Job: {partitionPurposes[key]}</p></div>)}</div>
    <figcaption>All 400 images belong to exactly one group; the groups are fixed row blocks, not the official UCI benchmark split. Source training gives the learned backbone; target training fits six candidates; target validation picks one; the target test reports that one; the source holdout is a separate retention check. Target labels are stored as digit − 5, so index 0 of the new head means 5 while index 0 of the source head means 0.</figcaption>
    <section data-lesson-teaching="" ref={teachingSection} className="lesson-teaching-section"><details><summary className="transfer-part-title">Every image’s group, by source ID (all 400 IDs)</summary>{ready && <div className="transfer-table-scroll" role="region" tabIndex={0} aria-label="All specimen IDs and partitions"><table><caption>Source IDs in saved experiment order</caption><thead><tr><th>Group</th><th>Count</th><th>Source IDs</th></tr></thead><tbody>{Object.entries(experiment.splits_source_ids).map(([key, ids]) => <tr key={key}><th scope="row">{partitionNames[key]}</th><td>{ids.length}</td><td className="transfer-id-list">{ids.join(', ')}</td></tr>)}</tbody></table></div>}</details></section>
  </figure>;
}

export function TransferProgram() {
  return <div className="transfer-downloads">
    <p><a href={programUrl} download="transfer-experiments.py">Download the complete Python program</a> · <a href={dataUrl} download="digits-400.csv">Download all 400 digit rows</a> · <a href={provenanceUrl} download="data-provenance.md">Dataset provenance and license</a></p>
    <RemoteCodeBlock source={programUrl} language="python" filename="transfer-experiments.py" title="Read the full executable Python program" />
  </div>;
}

const loraInputs = { a: [2, 1], b: [1, 3], c: [1, 1] };
const loraStart = { usual: { A: [[1, -1]], B: [[0], [0]] }, zero: { A: [[0, 0]], B: [[0], [0]] } };
const loraState = (input, start) => ({ rank: 1, A: loraStart[start].A, B: loraStart[start].B, x: loraInputs[input], target: [0, 0], alpha: 1, rate: 0.1 });

/** Section 4: one LoRA layer with W = I₂, its two routes and one genuine SGD step. */
export function TransferLoraLab() {
  const [input, setInput] = useState('a');
  const [start, setStart] = useState('usual');
  const [state, setState] = useState(() => loraState('a', 'usual'));
  const [steps, setSteps] = useState(0);
  const reset = (nextInput, nextStart) => { setInput(nextInput); setStart(nextStart); setState(loraState(nextInput, nextStart)); setSteps(0); };
  const now = loraForward(state);
  const step = loraStep(state);
  const gA = now.gradA[0], gB = now.gradB.map(row => row[0]);
  const noSignal = gA.every(v => Math.abs(v) < 1e-12) && gB.every(v => Math.abs(v) < 1e-12);
  return <FlowLab id="transfer-lora" label="One LoRA layer and one SGD step">
    <div className="transfer-lora-lab">
      <div className="transfer-bn-cell is-input"><strong>Input x</strong><span>{vector(state.x)}</span></div>
      <div className="transfer-lora-lanes">
        <div className="transfer-lane is-frozen"><span className="transfer-route-tag">Route 1 · frozen</span><span>W = I₂ keeps x: {vector(state.x)}</span></div>
        <div className="transfer-lane is-added"><span className="transfer-route-tag">Route 2 · added, trains</span><span>A = [{state.A[0].map(v => number(v)).join(', ')}] measures A x = <strong className="transfer-violet">{number(now.bottleneck[0])}</strong></span><span>B = [{state.B.map(row => number(row[0])).join(', ')}]ᵀ turns it into the correction <strong className="transfer-violet">{vector(now.correction)}</strong></span></div>
      </div>
      <div className="transfer-bn-cell is-computed"><strong>⊕ Output y</strong><span>{vector(now.output)}; loss vs (0, 0): <strong>{number(now.loss, 6)}</strong></span></div>
      <div className="transfer-bn-cell is-backward"><strong>Backward</strong><span>∂L/∂y = {vector(now.output)}; ∂L/∂B = {vector(gB)}ᵀ; ∂L/∂A = [{gA.map(v => number(v)).join(', ')}]</span></div>
    </div>
    <FlowControls>
      <FlowChoice label="Input x" options={[['a', '(2, 1)'], ['b', '(1, 3)'], ['c', '(1, 1)']]} value={input} onChange={value => reset(value, start)} />
      <FlowChoice label="Factors start at" options={[['usual', 'A = [1, −1], B = 0'], ['zero', 'both zero']]} value={start} onChange={value => reset(input, value)} />
      <button type="button" disabled={steps >= 20} onClick={() => { setState(step.next); setSteps(value => value + 1); }}>Apply one SGD step (rate 0.1)</button>
      <button type="button" onClick={() => reset(input, start)}>Start over</button>
    </FlowControls>
    <FlowReadout><span data-testid="transfer-lora-current">{steps} {steps === 1 ? 'step' : 'steps'} applied. {noSignal
      ? <>Neither factor receives a gradient here although the loss is <strong>{number(now.loss, 6)}</strong>: {now.bottleneck[0] === 0 && state.B.every(row => row[0] === 0) && state.A[0].some(v => v !== 0) ? 'the measurement A x is zero and B is zero' : 'both factors are zero'}, so a step changes nothing.</>
      : <>The next step moves B to <strong>{vector(step.next.B.map(row => row[0]))}ᵀ</strong> and the loss to <strong>{number(step.after.loss, 6)}</strong>{gA.every(v => Math.abs(v) < 1e-12) ? '; A has no gradient yet, because B is still zero' : ''}.</>}</span></FlowReadout>
  </FlowLab>;
}

/** Section 4: does low rank save parameters for our lower layer? */
export function TransferLoraCountLab() {
  const [rank, setRank] = useState(2);
  const d = 32, k = 64, factors = rank * (d + k), full = d * k;
  return <FlowLab id="transfer-lora-count" label="Factor count against the full weight matrix">
    <div className="transfer-count-bars" aria-hidden="true">
      <div><span>full weight matrix W, 32 × 64</span><i className="is-frozen" style={{ width: '100%' }} /><b>{full.toLocaleString('en-US')}</b></div>
      <div><span>factors A and B at rank {rank}</span><i className="is-added" style={{ width: `${Math.min(100, 100 * factors / full)}%` }} /><b>{factors.toLocaleString('en-US')}</b></div>
    </div>
    <FlowControls><FlowSlider name="Rank r" value={rank} min={1} max={32} step={1} format={v => String(v)} onChange={setRank} /></FlowControls>
    <FlowReadout><span data-testid="transfer-lora-count">Rank {rank} needs r(d + k) = {rank} × 96 = <strong>{factors.toLocaleString('en-US')}</strong> factor values against <strong>{full.toLocaleString('en-US')}</strong> in W. {factors < full ? `That saves ${(full - factors).toLocaleString('en-US')}.` : 'This rank saves nothing: the factors are at least as large as W.'} The saving disappears at r = 22, where 22 × 96 = 2,112 exceeds 2,048.</span></FlowReadout>
  </FlowLab>;
}

/** Section 5: count the adapter and its head before trusting a "parameter-efficient" label. */
export function TransferAdapterCountLab() {
  const [width, setWidth] = useState(4);
  const budget = adapterBudget(16, width, true);
  return <FlowLab id="transfer-budget" label="Adapter parameter count">
    <div className="transfer-count-bars" aria-hidden="true">
      <div><span>down projection D and b<sub>D</sub></span><i className="is-added" style={{ width: `${100 * budget.down / budget.count}%` }} /><b>{budget.down}</b></div>
      <div><span>up projection U and b<sub>U</sub></span><i className="is-added" style={{ width: `${100 * budget.up / budget.count}%` }} /><b>{budget.up}</b></div>
      <div><span>new head</span><i className="is-added" style={{ width: `${100 * budget.head / budget.count}%` }} /><b>{budget.head}</b></div>
    </div>
    <FlowControls><FlowSlider name="Bottleneck width m" value={width} min={1} max={16} step={1} format={v => String(v)} onChange={setWidth} /></FlowControls>
    <FlowReadout><span data-testid="transfer-adapter-count">With d = 16 and m = {width}: down {budget.down} + up {budget.up} = adapter <strong>{budget.adapter}</strong>, plus the 85-value head = <strong>{budget.count}</strong> trainable values. Their FP32 gradients and two Adam moments take 12 bytes each: <strong>{budget.bytes.toLocaleString('en-US')} bytes</strong>, before counting any weights or activations.</span></FlowReadout>
  </FlowLab>;
}

function TransferTrace({ record }) {
  const [container, width] = usePlotWidth();
  const ceiling = Math.max(...record.trace.flatMap(row => [row.train.ce, row.validation.ce])) * 1.05;
  const right = width - 16;
  const px = value => 52 + value / 300 * (right - 52);
  const py = value => 178 - value / ceiling * 148;
  const last = record.trace[record.trace.length - 1];
  // End labels: the lower line's label goes just below it (there is room above the tick
  // labels), the upper line's label just above it, so the two never cross a line or each other.
  const trainEnd = py(last.train.ce), validationEnd = py(last.validation.ce);
  const labelY = trainEnd >= validationEnd
    ? { train: trainEnd + 16, validation: validationEnd - 8 }
    : { train: trainEnd - 8, validation: validationEnd + 16 };
  return <div ref={container} className="transfer-trace">
    <svg className="transfer-plot" viewBox={`0 0 ${width} 230`} role="img" aria-label={`Saved training and validation cross-entropy for ${TRANSFER_LABELS[record.method]}, seed ${record.seed}; exact values are in the table below the controls`}>
      <text x="14" y="110" textAnchor="middle" transform="rotate(-90 14 110)">cross-entropy (nats)</text>
      {[0, ceiling / 2, ceiling].map(value => <g key={value}><line x1="52" x2={right} y1={py(value)} y2={py(value)} stroke="#3a3631" /><text x="46" y={py(value) + 4} textAnchor="end">{number(value, 2)}</text></g>)}
      {[0, 100, 300].map(value => <text key={value} x={px(value)} y="211" textAnchor="middle">{value}</text>)}
      <text x={(52 + right) / 2} y="228" textAnchor="middle">full-batch updates</text>
      {['train', 'validation'].map((split, i) => <g key={split}><polyline fill="none" stroke={i ? '#e2b55a' : '#7dd5e9'} strokeWidth="2" strokeDasharray={i ? '5 4' : undefined} points={record.trace.map(row => `${px(row.step)},${py(row[split].ce)}`).join(' ')} />{record.trace.map(row => <circle key={row.step} cx={px(row.step)} cy={py(row[split].ce)} r="3" fill={i ? '#e2b55a' : '#7dd5e9'} />)}<text x={px(300) - 6} y={labelY[split]} textAnchor="end" style={{ fill: i ? '#e2b55a' : '#7dd5e9' }}>{i ? 'validation (60 rows)' : 'training (40 rows)'}</text></g>)}
    </svg>
  </div>;
}

function TransferTraceTable({ record }) {
  return <div className="transfer-table-scroll" role="region" tabIndex={0} aria-label="Exact recorded trace"><table><caption>Exact saved values: mean cross-entropy in nats and correct counts</caption><thead><tr><th>Update</th><th>Train CE</th><th>Train correct / 40</th><th>Validation CE</th><th>Validation correct / 60</th></tr></thead><tbody>{record.trace.map(row => <tr key={row.step}><th scope="row">{row.step}</th><td>{number(row.train.ce, 6)}</td><td>{row.train.correct}</td><td>{number(row.validation.ce, 6)}</td><td>{row.validation.correct}</td></tr>)}</tbody></table></div>;
}

/** Section 7: saved trajectories and retention for each measured candidate. */
export function TransferEvidenceLab() {
  const [seed, setSeed] = useState(1);
  const [method, setMethod] = useState('scratch');
  const record = experiment.runs.find(row => row.seed === seed && row.method === method);
  return <FlowLab id="transfer-evidence" label="Saved training trajectories and retention">
    <TransferTrace record={record} />
    <FlowControls>
      <FlowChoice label="Method" options={TRANSFER_METHODS.map(key => [key, TRANSFER_LABELS[key]])} value={method} onChange={setMethod} />
      <FlowChoice label="Seed" options={[[1, 'Seed 1 (selection)'], [2, 'Seed 2'], [3, 'Seed 3']]} value={seed} onChange={setSeed} />
    </FlowControls>
    <FlowReadout><span data-testid="transfer-evidence-readout">{TRANSFER_LABELS[method]}, seed {seed}: after 300 updates, training {record.train.correct}/40 correct and validation CE <strong>{number(record.validation.ce, 6)}</strong> ({record.validation.correct}/60). {record.source_after
      ? <>The original head names <strong>{record.source_before.correct}/50</strong> source holdout images correctly before and <strong>{record.source_after.correct}/50</strong> after (CE {number(record.source_before.ce, 6)} → {number(record.source_after.ce, 6)}).</>
      : <>Retention does not apply: scratch starts from the saved random backbone, which never learned digits 0–4.</>}{seed !== 1 ? ' Seeds 2 and 3 are validation-only sensitivity runs; they took no part in the selection.' : ''}</span></FlowReadout>
    {record.source_after && <div className="transfer-count-bars" aria-hidden="true">
      <div><span>old head, source holdout before adaptation</span><i className="is-baseline" style={{ width: `${2 * record.source_before.correct}%` }} /><b>{record.source_before.correct}/50</b></div>
      <div><span>after adaptation</span><i className="is-computed" style={{ width: `${2 * record.source_after.correct}%` }} /><b>{record.source_after.correct}/50</b></div>
    </div>}
    <TransferTraceTable record={record} />
  </FlowLab>;
}

/** Section 7: a different declared rule (a parameter cap) applied to the same saved seed-1 records. */
export function TransferBudgetRuleLab() {
  const [budget, setBudget] = useState(400);
  const decision = selectTransferCandidate(experiment.runs, budget, 1);
  return <FlowLab id="transfer-budget-rule" label="Selection under a parameter cap">
    <ol className="transfer-candidates" aria-label="Seed-1 candidates and whether each fits the cap">{TRANSFER_METHODS.map(key => {
      const run = experiment.runs.find(row => row.seed === 1 && row.method === key);
      const eligible = run.trainable_parameters <= budget;
      const winner = decision.winner && decision.winner.method === key;
      return <li key={key} className={(eligible ? 'is-eligible' : 'is-excluded') + (winner ? ' is-winner' : '')}><strong>{TRANSFER_LABELS[key]}</strong><span>{run.trainable_parameters.toLocaleString('en-US')} values · CE {number(run.validation.ce, 6)}</span><span>{winner ? 'chosen' : eligible ? 'eligible' : 'over the cap'}</span></li>;
    })}</ol>
    <FlowControls><FlowSlider name="Maximum trainable values" value={budget} min={0} max={3000} step={1} format={v => v.toLocaleString('en-US')} onChange={setBudget} /></FlowControls>
    <FlowReadout><span data-testid="transfer-budget-winner">{decision.winner
      ? <>Within {budget.toLocaleString('en-US')} values, the lowest validation cross-entropy belongs to <strong>{TRANSFER_LABELS[decision.winner.method]}</strong> ({decision.winner.trainable_parameters} values, CE {number(decision.winner.validation.ce, 6)}).</>
      : <>No candidate fits under {budget.toLocaleString('en-US')} values.</>} This reinterprets saved validation records; no model is trained or tested.</span></FlowReadout>
  </FlowLab>;
}

/** Section 8: the same stored probabilities, with and without their declared meaning. */
export function TransferCheckpointLab() {
  const [index, setIndex] = useState(1);
  const [order, setOrder] = useState('declared');
  const [prep, setPrep] = useState('declared');
  const probabilities = experiment.selection.test_probabilities[index - 1];
  const labelOrder = order === 'reversed' ? [9, 8, 7, 6, 5] : [5, 6, 7, 8, 9];
  const largest = probabilities.indexOf(Math.max(...probabilities));
  const row = specimens.test[index - 1];
  return <FlowLab id="transfer-checkpoint" label="A checkpoint needs meaning as well as numbers">
    <div className="transfer-checkpoint">
      <PixelDigit row={row} label={`Test row ${index}: a ${row.digit}`} />
      <div className="transfer-probabilities" aria-label="Saved probabilities and their declared meanings">{probabilities.map((value, i) => <div key={i} className={i === largest ? 'is-largest' : ''}><span>index {i} → digit {labelOrder[i]}: {number(value, 6)}</span><div className="transfer-bar" aria-hidden="true"><i style={{ width: `${100 * value}%` }} /></div></div>)}</div>
    </div>
    <FlowControls>
      <FlowSlider name="Test row" value={index} min={1} max={100} step={1} format={v => String(v)} onChange={setIndex} />
      <FlowChoice label="Output label order" options={[['declared', 'Declared 5–9'], ['reversed', 'Reversed 9–5']]} value={order} onChange={setOrder} />
      <FlowChoice label="Preprocessing" options={[['declared', 'Declared: divide by 16'], ['changed', 'Changed version']]} value={prep} onChange={setPrep} />
    </FlowControls>
    <FlowReadout><span data-testid="transfer-checkpoint-meaning">The largest saved probability is at index {largest}, which now means digit <strong>{labelOrder[largest]}</strong>; the image is a {row.digit}. {prep === 'changed'
      ? 'These saved probabilities were produced with the declared preprocessing; under a changed version they no longer describe the model’s output, and no new inference has run.'
      : order === 'reversed'
        ? 'The numbers are unchanged, but with the reversed label order they no longer mean what the model predicted.'
        : 'With the declared configuration, the recorded state-dictionary round trip reproduced these probabilities exactly.'}</span></FlowReadout>
  </FlowLab>;
}

export function TransferScheduleFigure() {
  const [container, width] = usePlotWidth();
  const px = time => 80 + time / 100 * (width - 96);
  const py = rate => 130 - rate / 0.01 * 110;
  const samples = [[0, 0.01 / 32], [10, 0.01], [100, 0.01 / 32]];
  return <figure ref={container} className="transfer-schedule" data-figure="transfer-schedule"><svg className="transfer-plot" viewBox={`0 0 ${width} 180`} role="img" aria-label="Rate rises from 0.0003125 at t zero to 0.01 at t ten, then decreases to 0.0003125 at t one hundred"><line x1="80" y1="130" x2={width - 16} y2="130" stroke="#6e675c" /><polyline points={samples.map(([time, rate]) => `${px(time)},${py(rate)}`).join(' ')} fill="none" stroke="#e2b55a" strokeWidth="3" /><text x="74" y="24" textAnchor="end">0.01</text><text x={px(10) + 8} y="22">peak at t = 10</text><text x="74" y={py(0.01 / 32) + 4} textAnchor="end">0.0003125</text>{[0, 100].map(time => <circle key={time} cx={px(time)} cy={py(0.01 / 32)} r="3.5" fill="#e2b55a" />)}{width >= 520 && <><line x1={px(100) - 2} y1="94" x2={px(100) - 2} y2={py(0.01 / 32) - 5} stroke="#a59c8c" /><text x={width - 16} y="88" textAnchor="end">t = 100: back to 0.0003125, never 0</text></>}{(width >= 360 ? [0, 10, 100] : [0, 100]).map(time => <text key={time} x={px(time)} y="151" textAnchor="middle">{time}</text>)}<text x={width - 16} y="172" textAnchor="end">step t</text></svg><figcaption>Learning rate against step t for the teaching schedule: 0.0003125 at t = 0, 0.01 at t = 10, 0.0003125 at t = 100. A specified schedule, not a measured learning curve.</figcaption></figure>;
}
