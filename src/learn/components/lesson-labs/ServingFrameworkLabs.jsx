import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { cachePages, scheduleRequests } from '../../data/serving-framework-models.js';
const flow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '.65rem',
  marginBlock: '1rem'
};
const card = {
  padding: '.7rem',
  border: '1px solid #65532e',
  background: '#171512',
  flex: '1 1 180px',
  borderRadius: 4
};
export function ServingPhasesFigure() {
  return (
    <figure aria-label="From prompt to released inference state">
    <figcaption>One request, several kinds of work</figcaption>
    <div style={flow}>{['Messages → template → token IDs', 'Prefill → cache keys/values → first output', 'Decode → append/read cache → next output', 'Stop or cancel → return result → release state'].map(text => <div key={text} style={card}>{text}</div>)}</div>
    </figure>
  );
}
export function CachePagesLab() {
  const [first, setFirst] = useState(5),
    [second, setSecond] = useState(3),
    [block, setBlock] = useState('4'),
    [prefix, setPrefix] = useState(0);
  const size = Number(block),
    result = cachePages(first, second, size, prefix);
  return <NeuralLab id="serving-cache-pages" title="Follow logical tokens into physical cache pages">
    <p>Exact slot accounting, not measured GPU memory. Only complete identical prefix blocks share storage. P0 means physical page 0 in both maps.</p>
    <div className="neural-controls">
    <NeuralNumber label="A cached positions" value={first} onChange={setFirst} min={1} max={12} step={1} integer />
    <NeuralNumber label="B cached positions" value={second} onChange={setSecond} min={1} max={12} step={1} integer />
    <NeuralSelect label="Positions per page" value={block} onChange={setBlock} options={[['2', '2'], ['4', '4'], ['8', '8']]} />
    <NeuralNumber label="Assumed identical prefix" value={prefix} onChange={setPrefix} min={0} max={12} step={1} integer />
    </div>
    <p>Actual common prefix: {result.effectivePrefix} positions (cannot exceed either sequence). Shared complete pages: <strong>{result.shared}</strong>.</p>
    {result.maps.map((pages, index) => <div key={index}>
    <h4>Request {index ? 'B' : 'A'} · {index ? second : first} positions</h4>
    <div style={flow}>{pages.map((physical, logical) => <div key={logical} style={{
          ...card,
          flex: '0 1 auto'
        }}>
    <strong>Logical {logical} → P{physical}</strong>
    <p>{logical < result.shared ? 'Shared, read-only prefix' : 'Owned by this request'}</p>
    <div style={{
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap'
          }}>{Array.from({
              length: size
            }, (_, slot) => {
              const used = logical * size + slot < (index ? second : first);
              return <span key={slot} style={{
                width: '1.35rem',
                textAlign: 'center',
                border: '1px solid #97773d',
                background: used ? '#4c3a17' : 'transparent'
              }}>{used ? '●' : '·'}</span>;
            })}</div>
    </div>)}</div>
    </div>)}
    <p>
    <strong>{result.physical} physical pages · {result.capacity} slots · {result.useful} unique populated positions · {result.slack} unused slots.</strong>
    </p>
    <p>Dots mark populated positions; small dots mark slack. Change page size to trade tail slack against page count. A longer shared prefix helps only when another complete page becomes shareable.</p>
    <button type="button" onClick={() => {
      setFirst(5);
      setSecond(3);
      setBlock('4');
      setPrefix(0);
    }}>Reset cache pages</button>
  </NeuralLab>;
}
export function ServingScheduleLab() {
  const [prompt, setPrompt] = useState(6),
    [arrival, setArrival] = useState(1),
    [budget, setBudget] = useState(4),
    [policy, setPolicy] = useState('continuous'),
    [inspect, setInspect] = useState(1);
  const result = scheduleRequests(prompt, arrival, budget, policy === 'continuous'),
    selected = Math.min(inspect, result.events.length - 1),
    event = result.events[selected];
  return <NeuralLab id="serving-scheduler" title="See which request makes progress at each boundary">
    <p>Calculated work-unit trace. A needs 3 output tokens; B and C need 2 each. Final prefill produces the first token; D1 produces a subsequent one. Two resident slots, decode-first scheduling.</p>
    <div className="neural-controls">
    <NeuralNumber label="A prompt positions" value={prompt} onChange={setPrompt} min={1} max={10} step={1} integer />
    <NeuralNumber label="B arrival boundary" value={arrival} onChange={setArrival} min={0} max={4} step={1} integer />
    <NeuralNumber label="Token-work budget" value={budget} onChange={setBudget} min={1} max={8} step={1} integer />
    <NeuralSelect label="Admission policy" value={policy} onChange={setPolicy} options={[['continuous', 'Continuous admission'], ['fixed', 'Wait for entire resident batch']]} />
    <NeuralNumber label="Inspect iteration" value={selected} onChange={setInspect} min={0} max={result.events.length - 1} step={1} integer />
    </div>
    <div style={flow}>{['A', 'B', 'C'].map(name => <div style={card} key={name}>
    <strong>Request {name}</strong>
    <p>{event.actions[name] || 'No work this iteration'}</p>
    </div>)}</div>
    <p>Iteration {selected} consumes {event.used} of {budget} units. Outputs computed in this iteration appear at boundary {selected + 1}. An empty cell means no scheduled work; it can be waiting, not yet arrived or already finished.</p>
    <NeuralTable caption="Complete work trace, in abstract iterations" headers={['Iteration', 'A', 'B', 'C', 'Used']} rows={result.events.map(e => [e.tick, ...['A', 'B', 'C'].map(n => e.actions[n] || '—'), e.used])} />
    <NeuralTable caption="Results relative to declared arrivals" headers={['Request', 'First boundary', 'Finish boundary', 'First-token wait']} rows={['A', 'B', 'C'].map(name => [name, result.completed[name].first, result.completed[name].finish, result.completed[name].ttft])} />
    <p>Compare policies with the same inputs. Then lower the budget: fewer units can fit, even when a request has a resident slot. These units cannot be converted to milliseconds without an actual hardware/workload measurement.</p>
    <button type="button" onClick={() => {
      setPrompt(6);
      setArrival(1);
      setBudget(4);
      setPolicy('continuous');
      setInspect(1);
    }}>Reset schedule</button>
  </NeuralLab>;
}
