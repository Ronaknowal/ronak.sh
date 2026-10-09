import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as format } from './NeuralLessonElements.jsx';
import { gridOwnership, gpuAccounting } from '../../data/gpu-computing-models.js';
import './neural-lesson-neutral.css';
import './gpu-computing-lessons.css';

export function GpuResidencyFigure() {
  return <figure className="gpu-residency" data-figure="gpu-residency">
    <figcaption>Same three transformations, different journeys</figcaption>
    <div className="gpu-residency-path">
      <strong>Repeated crossings</strong>
      <p>Host → GPU stage 1 → host → GPU stage 2 → host → GPU stage 3 → host</p>
      <span>Six full-array crossings</span>
    </div>
    <div className="gpu-residency-path">
      <strong>Resident chain</strong>
      <p>Host → GPU [stage 1 → stage 2 → stage 3] → host</p>
      <span>Two full-array crossings</span>
    </div>
    <p>The arrows describe where values travel. Their lengths do not encode time; stages still execute on the GPU in both routes.</p>
  </figure>;
}

export function GpuIndexLab() {
  const [size, setSize] = useState(19);
  const [blocks, setBlocks] = useState(2);
  const [threads, setThreads] = useState('4');
  const [selected, setSelected] = useState(2);
  const threadCount = Number(threads);
  const ownership = gridOwnership(size, blocks, threadCount);
  const activeSelection = Math.min(selected, ownership.length - 1);
  const chosen = ownership[activeSelection];

  function reset() {
    setSize(19);
    setBlocks(2);
    setThreads('4');
    setSelected(2);
  }

  return <NeuralLab id="gpu-thread-ownership" title="Follow one thread through the array">
    <p>Change the work size or launch geometry. Amber cells belong to the selected thread. The cells are read-only results; use the labeled controls to change them.</p>
    <div className="neural-controls">
      <NeuralNumber integer label="Number of elements" value={size} min={1} max={32} step={1} onChange={setSize} />
      <NeuralNumber integer label="Blocks" value={blocks} min={1} max={4} step={1} onChange={setBlocks} />
      <NeuralSelect label="Threads per block" value={threads} onChange={setThreads}
        options={[["2", "2 threads"], ["4", "4 threads"], ["8", "8 threads"]]} />
      <NeuralNumber integer label="Selected global thread" value={activeSelection} min={0}
        max={ownership.length - 1} step={1} onChange={setSelected} />
    </div>
    <p><strong>Stride = {blocks} × {threadCount} = {ownership.length}.</strong> Selected block {chosen.block}, thread {chosen.thread}: {chosen.indices.length ? chosen.indices.join(' → ') : 'no elements; starting index is outside the array'}.</p>
    <figure data-figure="gpu-output-owners">
      <figcaption>Output positions 0 through {size - 1}; each label names its unique writer</figcaption>
      <div className="gpu-index-cells">{Array.from({ length: size }, (_, index) => {
        const writer = index % ownership.length;
        return <div key={index} className={writer === activeSelection ? 'is-selected' : ''}>
          <strong>i = {index}</strong><span>thread {writer}</span>
          <span>visit {Math.floor(index / ownership.length) + 1}</span>
        </div>;
      })}</div>
    </figure>
    <NeuralTable caption="Logical ownership; this is not a GPU execution-order trace"
      headers={['Block', 'Thread in block', 'Global thread', 'Assigned indices']}
      rows={ownership.map(owner => [owner.block, owner.thread, owner.first,
        owner.indices.length ? owner.indices.join(', ') : 'Inactive'])} />
    <p>Exactly {size} output positions have one writer. {size < ownership.length
      ? `${ownership.length - size} launched threads have no elements; the bounds check is necessary.`
      : 'The stride lets threads revisit later elements without sharing an output.'}</p>
    <button type="button" onClick={reset}>Reset launch and selection</button>
  </NeuralLab>;
}

const costTerms = [
  { key: 'transfer', label: 'Host transfers', color: '#e4b752' },
  { key: 'traffic', label: 'Device traffic', color: '#b6b6b6' },
  { key: 'launch', label: 'Launch overhead', color: '#707070' },
];

export function GpuTrafficLab() {
  const [thousands, setThousands] = useState(1000);
  const [stages, setStages] = useState(5);
  const [residency, setResidency] = useState('resident');
  const [fusion, setFusion] = useState('fused');
  const [hostBandwidth, setHostBandwidth] = useState(16);
  const [deviceBandwidth, setDeviceBandwidth] = useState(400);
  const [launchCost, setLaunchCost] = useState(10);
  const settings = { elements: thousands * 1000, stages, hostBandwidth, deviceBandwidth, launchCost };
  const baseline = gpuAccounting({ ...settings, resident: false, fused: false });
  const current = gpuAccounting({ ...settings, resident: residency === 'resident', fused: fusion === 'fused' });
  const maximum = Math.max(baseline.total, current.total);

  function reset() {
    setThousands(1000);
    setStages(5);
    setResidency('resident');
    setFusion('fused');
    setHostBandwidth(16);
    setDeviceBandwidth(400);
    setLaunchCost(10);
  }

  return <NeuralLab id="gpu-traffic-accounting" title="Change what moves, then inspect the accounting">
    <p><strong>Hypothetical sequential cost model, not measured GPU time.</strong> Every stage applies the same float32 elementwise operation. Bandwidths and launch costs below are editable assumptions.</p>
    <div className="neural-controls">
      <NeuralNumber integer label="Elements (thousands)" value={thousands} min={1} max={1000} step={1} onChange={setThousands} />
      <NeuralNumber integer label="Repeated stages" value={stages} min={1} max={20} step={1} onChange={setStages} />
      <NeuralSelect label="Array residency" value={residency} onChange={setResidency}
        options={[["resident", "Keep stages on device"], ["copy", "Copy in/out each stage"]]} />
      <NeuralSelect label="Elementwise implementation" value={fusion} onChange={setFusion}
        options={[["fused", "One fused kernel per stage"], ["separate", "Three separate kernels per stage"]]} />
      <NeuralNumber label="Host link (decimal GB/s)" value={hostBandwidth} min={1} max={64} step={1} onChange={setHostBandwidth} />
      <NeuralNumber label="Device memory (decimal GB/s)" value={deviceBandwidth} min={50} max={2000} step={50} onChange={setDeviceBandwidth} />
      <NeuralNumber label="Cost per launch (microseconds)" value={launchCost} min={0} max={40} step={1} onChange={setLaunchCost} />
    </div>
    <figure data-figure="gpu-cost-comparison">
      <figcaption>Common scale: full track = {format(maximum, 2)} modeled μs</figcaption>
      {[['Copy every stage + three kernels', baseline], ['Current configuration', current]].map(([label, result]) =>
        <div className="gpu-cost-row" key={label}>
          <strong>{label}: {format(result.total, 2)} μs</strong>
          <div className="gpu-cost-track" aria-label={costTerms.map(term => `${term.label}: ${format(result[term.key])} microseconds`).join('; ')}>
            {costTerms.map(term => <span key={term.key} style={{ width: `${100 * result[term.key] / maximum}%`, backgroundColor: term.color }} />)}
          </div>
        </div>)}
      <p className="gpu-cost-key">{costTerms.map(term => <span key={term.key}><i style={{ backgroundColor: term.color }} />{term.label}</span>)}</p>
    </figure>
    <NeuralTable caption="The exact values behind the bars" headers={['Quantity', 'Baseline', 'Current']} rows={[
      ['Host bytes', baseline.hostBytes.toLocaleString('en-US'), current.hostBytes.toLocaleString('en-US')],
      ['Device bytes', baseline.deviceBytes.toLocaleString('en-US'), current.deviceBytes.toLocaleString('en-US')],
      ['Kernel launches', baseline.kernels, current.kernels],
      ...costTerms.map(term => [term.label + ' (μs)', format(baseline[term.key], 3), format(current[term.key], 3)]),
    ]} />
    <p>{stages === 1 ? 'One stage gives the same host traffic for both residency choices. ' : ''}
      {launchCost === 0 ? 'The modeled launch term is zero; traffic still costs time. ' : ''}
      This additive model excludes compute, caches, overlap, allocation, startup and contention. Use it to formulate a measurement question, not report a speedup.</p>
    <button type="button" onClick={reset}>Reset workload and assumptions</button>
  </NeuralLab>;
}
