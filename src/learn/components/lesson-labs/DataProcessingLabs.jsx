import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { paddingPlan, dataOwnership } from '../../data/data-processing-models.js';

const tiles = { display: 'flex', flexWrap: 'wrap', gap: '.45rem', alignItems: 'center' };
const tile = { padding: '.3rem .5rem', border: '1px solid #8b743e', background: '#282116', borderRadius: 3 };

export function DataPipelineFigure() {
  return <figure><figcaption>The values can change while row identity survives</figcaption><ol>
    <li><strong>Source ID 1:</strong> measurements [5.1, 3.5, 1.4, .2], species 0.</li>
    <li><strong>Split:</strong> ID 1 belongs to training; validation cannot fit its scaler.</li>
    <li><strong>Transform:</strong> standardized values replace centimeters; ID 1 and target 0 stay attached.</li>
    <li><strong>Sampler:</strong> ID 1 is selected at a position in this epoch.</li>
    <li><strong>Collator:</strong> batch tensors hold its features, target and audit ID at the same row.</li>
  </ol></figure>;
}

export function PaddingBudgetLab() {
  const [lengths, setLengths] = useState([2, 9, 3, 8]), [order, setOrder] = useState('adjacent');
  const plan = paddingPlan(lengths, order === 'length'), baseline = paddingPlan(lengths, false);
  return <NeuralLab id="padding-budget" title="Batch the same sequences with less empty space">
    <p>Each filled tile is one real token position; each outlined tile is padding. IDs stay attached when order changes. This is exact slot counting, not elapsed time.</p>
    <div className="neural-controls">{lengths.map((length, index) => <NeuralNumber key={index} label={`Sequence ${index + 1} length`} value={length} min={1} max={12} step={1} integer onChange={value => setLengths(current => current.map((item, at) => at === index ? value : item))} />)}<NeuralSelect label="Pairing" value={order} onChange={setOrder} options={[["adjacent", 'Adjacent IDs'], ['length', 'Nearby lengths']]} /></div>
    {plan.batches.map((batch, index) => <figure key={index}><figcaption>Batch {index + 1}: width {batch.width}</figcaption>{batch.rows.map(item => <div key={item.id} style={{ marginBlock: '.7rem' }}><p>ID {item.id} · {item.length} real + {batch.width - item.length} padding</p><div style={tiles}>{Array.from({ length: batch.width }, (_, position) => <span key={position} style={{ ...tile, background: position < item.length ? '#493919' : 'transparent', borderStyle: position < item.length ? 'solid' : 'dashed', fontSize: '.8rem' }}>{position < item.length ? position + 1 : 'pad'}</span>)}</div></div>)}</figure>)}
    <p><strong>{plan.valid} real tokens / {plan.allocated} allocated slots; {plan.padding} padding.</strong> Adjacent-ID baseline: {baseline.allocated} slots. This pairing saves {baseline.allocated - plan.allocated} slots.</p>
    <p>Set every length equal for the no-padding null case. Length grouping changes order, so real training combines batching efficiency with an intentional mixing policy.</p>
    <button type="button" onClick={() => { setLengths([2, 9, 3, 8]); setOrder('adjacent'); }}>Reset sequences</button>
  </NeuralLab>;
}

export function DataOwnershipLab() {
  const [count, setCount] = useState(13), [ranks, setRanks] = useState(2), [workers, setWorkers] = useState(2), [replicated, setReplicated] = useState(false);
  const result = dataOwnership(count, ranks, workers, replicated);
  return <NeuralLab id="data-ownership" title="Who owns each stream record?">
    <p>Source IDs are 0 through {count - 1}. Each lane is a rank/worker pair. The correct rule uses the same global owner count in every process.</p>
    <div className="neural-controls"><NeuralNumber label="Source row count" value={count} onChange={setCount} min={1} max={16} step={1} integer /><NeuralNumber label="Ranks" value={ranks} onChange={setRanks} min={1} max={3} step={1} integer /><NeuralNumber label="Workers per rank" value={workers} onChange={setWorkers} min={1} max={3} step={1} integer /></div>
    <label><input type="checkbox" checked={replicated} onChange={event => setReplicated(event.target.checked)} /> Deliberate bug: every worker reads every row</label>
    {result.owners.map(owner => <div key={`${owner.rank}-${owner.worker}`} style={{ borderBottom: '1px solid #444', paddingBlock: '.7rem' }}><p>Rank {owner.rank} / worker {owner.worker} · owner {owner.rank * workers + owner.worker}</p><div style={tiles}>{owner.ids.length ? owner.ids.map(id => <span style={tile} key={id}>{id}{replicated && ranks * workers > 1 ? ' ↺ repeated' : ''}</span>) : <span>No assigned rows</span>}</div></div>)}
    <p><strong>{result.yielded} yielded · {result.unique} unique · {result.duplicates} duplicate copies.</strong> {result.duplicates ? 'Training can continue while silently repeating observations. Check IDs, not just batch shapes.' : 'Every source ID has exactly one owner. Different scheduling can still interleave those owners differently.'}</p>
    <button type="button" onClick={() => { setCount(13); setRanks(2); setWorkers(2); setReplicated(false); }}>Reset ownership</button>
  </NeuralLab>;
}
