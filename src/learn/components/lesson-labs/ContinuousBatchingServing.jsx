import { useState } from 'react';
import { chunkGeometry, simulate, servingRequests, pipeline, PagePool, segmentedAttention, pageAttention, requestColor } from '../../data/continuous-batching-models.js';
import { Figure, Controls, Range, Select, Check, Pair, Table, Matrix, Tokens, Arrow, Scroll, fmt, vec, useBatchingObservations, ObservationStatus } from './ContinuousBatchingShared.jsx';
import { Pool, Timeline, Identity, EventLine } from './ContinuousBatchingStructures.jsx';
export function CbChunks() {
  const [chunk, setChunk] = useState(4);
  const observation = useBatchingObservations();
  const result = chunkGeometry(12, chunk);
  return <Figure id="D20" caption="Each chunk reads an old-prefix rectangle plus its own causal triangle. The union remains the same 78 query-key pairs; chunking changes boundaries, not causal permission.">
    <p>Each numbered chunk has one stable color. Query positions run downward; key positions run across. Hatching marks future keys that the query cannot read.</p>
    <Scroll label="Twelve by twelve causal mask with query/key positions and numbered chunks">
      <svg className="cb-timeline" viewBox="0 0 620 470" role="img" aria-label={`12-position causal triangle, ${chunk}-row chunks, 78 permitted pairs`}>
        <text x="245" y="18" textAnchor="middle">key position →</text>
        <text x="8" y="40">query ↓</text>
        {Array.from({length:12},(_,k)=><text key={`key-${k}`} x={86+k*32} y="40" textAnchor="middle">{k}</text>)}
        {Array.from({length:12},(_,q)=><g key={q}>
          <text x="55" y={67+q*32} textAnchor="end">{q}</text>
          {Array.from({length:12},(_,k)=><g key={k}>
            <rect x={70+k*32} y={46+q*32} width="30" height="30" fill={k<=q?requestColor('ABCDEG'[Math.floor(q/chunk)]):'#252832'} fillOpacity={k<=q?.72:1} stroke="#666b78" />
            {k>q&&<path d={`M${74+k*32} ${71+q*32}l21 -21`} stroke="#9296a3" />}
          </g>)}
        </g>)}
        {result.blocks.map((row,i)=><g key={i}>
          <path d={`M466 ${46+row.begin*32}h8v${row.rows*32-2}h-8`} stroke={requestColor('ABCDEG'[i])} fill="none" strokeWidth="3" />
          <text x="488" y={51+(row.begin+row.rows/2)*32} style={{fill:requestColor('ABCDEG'[i])}}>chunk {i}</text>
          {i>0&&<path d={`M70 ${45+row.begin*32}H454`} stroke="white" strokeWidth="2" />}
        </g>)}
      </svg>
    </Scroll>
    <Table label="Pair counts by the same numbered/color-coded chunk" headers={['chunk', 'query positions', 'new rows', 'old-prefix rectangle', 'local triangle']} rows={result.blocks.map((row,i) => [<span key={i} style={{color:requestColor('ABCDEG'[i])}}>chunk {i}</span>,`${row.begin}–${row.begin+row.rows-1}`, row.rows, row.oldPairs, row.triangle])} />
    <p>Total permitted pairs: {result.pairs}.</p>
    <Controls reset={() => setChunk(4)}><Select label="Chunk rows" value={chunk} options={[2, 3, 4, 6, 12].map(n => [n, n])} onChange={v => setChunk(Number(v))} /></Controls>
    {observation.data ? <Table label="Separate saved full-decoder comparison: A has 6 tokens, B has 5; this control does not rerun it"
      headers={['attention route', 'packed calls', 'maximum absolute logit error']}
      rows={observation.data.decoder.comparisons.map(record => [record.sdpa ? 'PyTorch SDPA' : 'manual', record.chunks.length,
        Math.max(...record.errors.map(row => row.max_absolute))])} /> : <ObservationStatus {...observation} />}
  </Figure>;
}
export function CbQueryAllocation() {
  const [budget, setBudget] = useState(6);
  const [decodes, setDecodes] = useState(2);
  const [finished, setFinished] = useState(false);
  const active = Math.max(0, decodes - Number(finished && decodes > 0));
  const prefill = Math.min(4, budget - active);
  return <Figure id="D21" caption="Decode rows are selected first in this boundary fixture, then the prefill gets at most its four-row chunk limit. A finished decode disappears before the next assembly.">
    <div className="cb-token-row">{Array.from({
        length: budget
      }, (_, i) => {
        const id = i < active ? 'AB'[i] : i < active + prefill ? 'long' : null;
        return <div key={i} className={`cb-token ${id ? '' : 'cb-invalid'}`} style={{
          '--cb-identity': id ? requestColor(id) : '#9498a6'
        }}>
        <small>query slot {i}</small><span>{id || 'unused'}</span><small>{i < active ? 'decode' : id ? 'prefill' : 'chunk limit'}</small>
      </div>;
      })}</div>
    <p>{active} decode + {prefill} prefill = {active + prefill} ≤ {budget} query rows. {budget - active - prefill} unused.</p>
    <Table label="Rows attach to request histories, not global packed positions" headers={['request', 'cached positions', 'new absolute positions']}
      rows={[...Array.from({length: active}, (_, i) => ['AB'[i], '0–2', '3 (pending decode)']), ['long', 'none in this fixture', `0–${prefill - 1}`]]} />
    <Controls reset={() => {
      setBudget(6);
      setDecodes(2);
      setFinished(false);
    }}>
      <Range label="Query budget" value={budget} min={3} max={8} onChange={setBudget} />
      <Range label="Decode requests before completion" value={decodes} min={0} max={2} onChange={setDecodes} />
      <Check label="Last decode finished at preceding boundary" checked={finished} onChange={setFinished} disabled={decodes === 0} />
    </Controls>
    <p>If decodes alone could exhaust the budget while the oldest request is still prefilling, the full simulator protects that oldest request's progress.</p>
  </Figure>;
}
export function CbModeledTime() {
  const [chunk, setChunk] = useState(4);
  const [cost, setCost] = useState(.05);
  const [single, setSingle] = useState(false);
  const requests = single ? [servingRequests[2]] : servingRequests;
  const result = simulate(requests, {
    chunk,
    linear: cost
  });
  const ids = requests.map(r => r.identity);
  const intervals = result.iterations.flatMap(iteration => iteration.work.map(row => ({
    id: row.id,
    slot: ids.indexOf(row.id),
    begin: iteration.begin,
    end: iteration.end
  })));
  return <Figure id="D22" caption="Iteration duration = 0.2 + selected rows × row cost + attention pairs × 0.001 seconds. These supplied coefficients model scheduling tradeoffs; pair count is not a measurement of physical memory traffic.">
    <Timeline title="Modeled scheduled work; white ticks mark emissions" intervals={intervals} slots={ids.length} maximum={result.finish} unit="modeled seconds" events={result.events.filter(row => row.event === 'emit').map(row => ({
      ...row,
      slot: ids.indexOf(row.id)
    }))} />
    <Table label="Emission clocks and work" headers={['ID', 'emissions', 'TTFT', 'new rows', 'repeated rows']} rows={Object.entries(result.requests).map(([id, row]) => [id, vec(row.emissions), row.ttft, row.useful_rows, row.repeated_rows])} />
    <p>Total query rows {result.iterations.reduce((sum, it) => sum + it.work.reduce((s, r) => s + r.rows, 0), 0)};
      attention pairs {result.iterations.reduce((sum, it) => sum + it.work.reduce((s, r) => s + r.attention_pairs, 0), 0)}.
      The six-row query budget still bounds a requested chunk of 64.</p>
    <Controls reset={() => {
      setChunk(4);
      setCost(.05);
      setSingle(false);
    }}>
      <Select label="Maximum prefill chunk" value={chunk} options={[2, 4, 6, 64].map(n => [n, n])} onChange={v => setChunk(Number(v))} />
      <Range label="Seconds per selected query row" value={cost} min={.01} max={.1} step={.01} onChange={setCost} />
      <Check label="Only the long request" checked={single} onChange={setSingle} />
    </Controls>
    {single && <p>No other request's decode can be delayed in this single-request case.</p>}
  </Figure>;
}
function SavedChoice({
  budget,
  setBudget,
  id,
  setId,
  data,
  reset
}) {
  return <Controls reset={reset}>
    <Select label="Recorded query budget" value={budget} options={[16, 32, 64].map(n => [n, n])} onChange={v => setBudget(Number(v))} />
    <Select label="Recorded request" value={id} options={Object.keys(data.study.references).map(key => [key, key])} onChange={setId} />
  </Controls>;
}
export function CbManager() {
  const observation = useBatchingObservations();
  const [reverse, setReverse] = useState(false);
  const [id, setId] = useState('alice-8');
  if (!observation.data) return <Figure id="D23" caption="Recorded CPU request manager"><ObservationStatus {...observation} /></Figure>;
  const arm = observation.data.study.arms[0],
    selected = arm.outputs[id];
  const ids = Object.keys(arm.outputs);
  if (reverse) ids.reverse();
  return <Figure id="D23" caption="These are saved outputs from the actual CPU manager, keyed by persistent request ID. Rearranging this display does not rerun inference or change a recorded response.">
    <p>API identity routing. Bar length encodes recorded prompt length; paths carry IDs through the manager, not observed execution timing.</p>
    <Scroll label="Request identities through manager to keyed outputs"><svg className="cb-timeline" viewBox="0 0 760 360" role="img" aria-label="Six recorded request IDs retain their identities through the request manager">
      <path d="M335 30H425V320H335Z" fill="#242731" stroke="#bfc1cb" />
      <text x="380" y="155" textAnchor="middle">manager</text><text x="380" y="180" textAnchor="middle">queue</text><text x="380" y="205" textAnchor="middle">forward</text>
      {ids.map((key, i) => {
          const originalIndex = Object.keys(arm.outputs).indexOf(key),
            color = requestColor('ABCDEF'[originalIndex]),
            y = 35 + i * 52;
          return <g key={key}>
          <text x="5" y={y - 7} style={{
              fill: color
            }}>{key}</text>
          <rect x="5" y={y} width={arm.outputs[key].prompt_ids.length * 3} height="14" fill={color} />
          <path d={`M${5 + arm.outputs[key].prompt_ids.length * 3} ${y + 7}H335M425 ${y + 7}H525`} stroke={color} fill="none" />
          <text x="535" y={y + 12} style={{
              fill: color
            }}>{key}: 6 outputs</text>
          {key === id && <rect x="530" y={y - 8} width="220" height="31" fill="none" stroke="white" strokeWidth="2" />}
        </g>;
        })}
    </svg></Scroll>
    <Tokens title={`${id}: saved prompt IDs`} items={selected.prompt_ids} color={requestColor('ABCDEF'[Object.keys(arm.outputs).indexOf(id)])} />
    <Tokens indexLabel="output" title={`${id}: generated IDs`} items={selected.generated_tokens} color={requestColor('ABCDEF'[Object.keys(arm.outputs).indexOf(id)])} />
    <p>Status: {selected.status_name}. Error: {selected.error ?? 'none'}.</p>
    <Controls reset={() => {
      setReverse(false);
      setId('alice-8');
    }}>
      <Select label="Inspect request ID" value={id} options={Object.keys(arm.outputs).map(key => [key, key])} onChange={setId} />
      <Check label="Reverse request display order" checked={reverse} onChange={setReverse} />
    </Controls>
  </Figure>;
}
export function CbLifecycle() {
  const observation = useBatchingObservations();
  const [step, setStep] = useState(0);
  if (!observation.data) return <Figure id="D24" caption="Recorded native lifecycle"><ObservationStatus {...observation} /></Figure>;
  const record = observation.data.lifecycle;
  const steps = ['queue three', 'cancel pending C', 'start and finish', 'stop and destroy'];
  return <Figure id="D24" caption="The bounded native preflight removed pending C without returning a terminal GenerationOutput for C. It did not exercise a cancellation race during a running forward.">
    <Tokens indexLabel="operation" title="Actual operation order" items={steps} selected={step} />
    <div className="cb-lanes">{[['waiting', step < 2 ? step === 0 ? ['A', 'B', 'C'] : ['A', 'B'] : []], ['finished', step >= 2 ? ['A', 'B'] : []], ['removed', step >= 1 ? ['C'] : []]].map(([name, ids]) => <div className="cb-lane" key={name}><span>{name}</span><div className="cb-rail">{ids.map(id => <Identity key={id} id={id} />)}</div></div>)}</div>
    <p>Manager thread: {step < 2 ? 'not started' : step === 2 ? 'completion observed; awaiting explicit stop' : 'stopped'}.
      Processor: {step < 2 ? 'initialized, no forward yet' : step === 2 ? 'two forwards performed' : 'cleared by stop'}.</p>
    <Table label="Saved native observations" headers={['quantity', 'observed']} rows={[['forward calls after completion', record.forward_calls], ['short-A generated IDs', vec(record.outputs['short-A'].generated_tokens)], ['short-B generated IDs', vec(record.outputs['short-B'].generated_tokens)], ['C terminal output', Object.hasOwn(record.outputs, 'C') ? 'present' : 'absent'], ['warmup performed', String(record.post_completion_state.warmup_performed)], ['post-completion active IDs', vec(record.post_completion_state.active_ids)], ['stop / destroy', 'thread stopped; processor cleared; repeated destroy safe']]} />
    <Controls reset={() => setStep(0)}><Range label="Lifecycle operation" value={step} min={0} max={3} onChange={setStep} /></Controls>
  </Figure>;
}
export function CbNativeParity() {
  const observation = useBatchingObservations();
  const [budget, setBudget] = useState(16),
    [id, setId] = useState('alice-8');
  if (!observation.data) return <Figure id="D25" caption="Recorded full-prefix versus manager outputs"><ObservationStatus {...observation} /></Figure>;
  const arm = observation.data.study.arms.find(row => row.budget === budget),
    comparison = arm.comparisons[id];
  return <Figure id="D25" caption="All 18 recorded request runs finished and all 108 manager output IDs matched their full-prefix references. This fixed study is an output comparison, not a claim about every cache or device.">
    <Tokens indexLabel="output" title={`${id}: independent full-prefix reference`} items={comparison.expected} color={requestColor('A')} />
    <Tokens indexLabel="output" title={`${id}: manager with query budget ${budget}`} items={comparison.actual} color={requestColor('B')} />
    <p>First divergence: {comparison.first_divergence ?? 'none'}. Terminal: {comparison.finished ? 'FINISHED' : 'not finished'}.</p>
    <Table label="All six requests × all three query budgets" headers={['request', 'budget 16', 'budget 32', 'budget 64']} rows={Object.keys(observation.data.study.references).map(key => [key, ...observation.data.study.arms.map(record => {
      const r = record.comparisons[key];
      return `${r.finished ? 'FINISHED' : 'unfinished'} · ${r.actual.length} IDs · ${r.matches ? 'match' : 'differ'}${record.budget === budget && key === id ? ' ← selected' : ''}`;
    })])} />
    <SavedChoice {...{
      budget,
      setBudget,
      id,
      setId
    }} data={observation.data} reset={() => {
      setBudget(16);
      setId('alice-8');
    }} />
  </Figure>;
}
export function CbNativeClocks() {
  const observation = useBatchingObservations();
  const [budget, setBudget] = useState(16),
    [id, setId] = useState('alice-8');
  if (!observation.data) return <Figure id="D26" caption="Recorded framework clocks"><ObservationStatus {...observation} /></Figure>;
  const arm = observation.data.study.arms.find(row => row.budget === budget),
    row = arm.outputs[id];
  const events = [['creation', row.created_relative], ['lifespan start', row.lifespan_relative[0]], ...row.timestamps_relative.map((t, i) => [`emission ${i + 1}`, t]), ['lifespan end', row.lifespan_relative[1]]];
  return <Figure id="D26" caption="Times are relative to this arm's manager origin. Creation and framework lifespan are observed fields; external arrival was not recorded. Each inclusive manager elapsed time is one observation, not a benchmark ranking.">
    <Timeline title={`${id}: saved lifespan; white ticks mark actual emissions`} intervals={[{
      id: 'ABCDEF'[Object.keys(arm.outputs).indexOf(id)],
      label: id,
      slot: 0,
      begin: row.lifespan_relative[0],
      end: row.lifespan_relative[1]
    }]} slots={1} maximum={arm.manager_elapsed_seconds} unit="seconds from arm origin" events={row.timestamps_relative.map(time => ({
      id: 'ABCDEF'[Object.keys(arm.outputs).indexOf(id)],
      slot: 0,
      time
    }))} />
    <Table label="Actual event timestamps" headers={['event', 'seconds']} rows={events} />
    <Table label="Observation boundaries" headers={['quantity', 'value']} rows={[['external-arrival TTFT', 'unavailable: external arrival not recorded'], ['first emission − creation', row.timestamps_relative[0] - row.created_relative], ['emission gaps', vec(row.timestamps_relative.slice(1).map((t, i) => t - row.timestamps_relative[i]))], ['inclusive manager elapsed', arm.manager_elapsed_seconds], ['thread stopped', String(arm.thread_stopped)]]} />
    <SavedChoice {...{
      budget,
      setBudget,
      id,
      setId
    }} data={observation.data} reset={() => {
      setBudget(16);
      setId('alice-8');
    }} />
  </Figure>;
}
export function CbWorkers() {
  const [split, setSplit] = useState('heads');
  return <Figure id="D27" caption="Illustration only: a shared logical decision identifies requests and positions across workers, while each worker owns its assigned tensors. Thin dashed paths carry control; the thick path represents tensor transfer or a collective.">
    <Tokens indexLabel="field" title="Control plane: shared iteration decision" items={['request A', 'positions 8–9', 'request B', 'position 4']} colors={['A', 'A', 'B', 'B'].map(requestColor)} />
    <Scroll label="Control messages branch to both workers"><svg className="cb-timeline" viewBox="0 0 760 115" role="img" aria-label="Thin dashed control paths carry the same request IDs and row ranges to two workers">
      <text x="380" y="18" textAnchor="middle">IDs, row ranges, page-table decisions</text>
      <path d="M380 30V50H180V95M380 50H580V95" stroke="#ffc04d" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
      <path d="M175 87L180 95L185 87M575 87L580 95L585 87" stroke="#ffc04d" fill="none" />
      <text x="180" y="112" textAnchor="middle">worker 0</text><text x="580" y="112" textAnchor="middle">worker 1</text>
    </svg></Scroll>
    <Pair>{[0, 1].map(worker => <div key={worker}>
      <p>Worker {worker}: {split === 'heads' ? `heads ${worker * 2}–${worker * 2 + 1}, all layers` : `layers ${worker * 2}–${worker * 2 + 1}, all heads`}</p>
      <Matrix title="Local weight shard (schematic feature coordinates)" rows={[[worker + 1, 0], [0, worker + 2]]} identity={false} />
      <Matrix title="Local K/V shard: requests × representative stored coordinates" rows={[[worker + 3, worker + 4], [worker + 5, worker + 6]]} rowLabels={['A', 'B']} columnLabels={['K representative', 'V representative']} colors={[requestColor('A'), requestColor('B')]} />
    </div>)}</Pair>
    <div style={{
      borderTop: '.35em solid #b595ff',
      marginTop: '1em',
      paddingTop: '.4em'
    }}>
      {split === 'heads' ? '↔ tensor-parallel collective combines partial outputs' : '→ activations from earlier layers feed later layers'}
    </div>
    <Controls reset={() => setSplit('heads')}><Select label="Illustrated partition" value={split} options={[['heads', 'head shards'], ['layers', 'layer stages']]} onChange={setSplit} /></Controls>
  </Figure>;
}
export function CbPipeline() {
  const [count, setCount] = useState(2);
  const result = pipeline(count);
  return <Figure id="D28" caption="Stage 1 takes two units and stage 2 takes three per microbatch. A downstream interval begins only after its input exists and its own stage becomes free. Dark gaps expose fill and drain.">
    <Timeline title="Two-stage dependency schedule; dashed paths carry each ready input" intervals={result.intervals} slots={2} maximum={result.finish} unit="supplied time units" dependencies={Array.from({
      length: count
    }, (_, i) => ({
      id: 'ABC'[i],
      from: result.intervals[2 * i].end,
      to: result.intervals[2 * i + 1].begin,
      fromSlot: 0,
      toSlot: 1
    }))} />
    <p>Makespan: {result.finish}. Microbatch colors remain the same on both stages.</p>
    <Controls reset={() => setCount(2)}><Range label="Microbatches" value={count} min={2} max={3} onChange={setCount} /></Controls>
  </Figure>;
}
export function CbDiagnosis() {
  const [bug, setBug] = useState('correct');
  const pool = new PagePool(bug === 'atomic' ? 2 : 3, 3);
  pool.create('A');
  pool.append('A', [1, 2, 3, 4, 5]);
  pool.fork('A', 'B', 4);
  const correctParent = pool.dense('A');
  let refusal = null;
  if (bug === 'tail') {
    pool.keys[pool.tables.B[1]][2] = 99;
    pool.values[pool.tables.B[1]][2] = -99;
    pool.lengths.B = 6;
  } else if (bug === 'atomic') {
    pool.keys[pool.tables.A[1]][2] = 99;
    try {
      pool.append('B', [99]);
    } catch (error) {
      refusal = error.message;
    }
  } else pool.append('B', [99]);
  const attention = segmentedAttention(1, bug === 'mask');
  const referenceAttention = segmentedAttention(1, false);
  const normalized = pageAttention([1, 2, 3, 4].map(Math.log), [2, 0, 4, 1]);
  const outputs = Object.entries(attention.keyed).map(([id, value]) => [bug === 'swap' ? id.startsWith('A') ? `B (wrong destination for ${id})` : `A (wrong destination for ${id})` : id, value]);
  return <Figure id="D29" caption="Each injected fault changes a real mapping, stored cell, mask or normalization. Inspect the first broken invariant before attributing a disagreement to scheduling speed.">
    <Tokens indexLabel="request" title="Persistent queue / records" items={['A', 'B']} />
    <Pool pool={pool} />
    <Matrix title="Request-aware attention permission" rows={attention.mask.map(row => row.map(value => Number(value)))} rowLabels={attention.rows.map(r => `${r.id}${r.position}`)} permitted={attention.mask} colors={attention.rows.map(r => requestColor(r.id))} />
    <Table label="Outputs and diagnostic witnesses" headers={['quantity', 'result']} rows={[...outputs, ['parent expected', vec(correctParent)], ['parent actual', vec(pool.dense('A'))], ['child expected after successful append', '[1, 2, 3, 4, 99]'], ['child actual', vec(pool.dense('B'))], ['correct request outputs', Object.entries(referenceAttention.keyed).map(([key, value]) => `${key}: ${fmt(value)}`).join('; ')], ['correct page-attention output', normalized.output], ['page-attention output', bug === 'softmax' ? 31 / 21 : normalized.output], ['failed-append physical tail', refusal ? `K at page 1, offset 2 changed 0 → 99 before refusal: ${refusal}` : 'no partial mutation']]} />
    <Controls reset={() => setBug('correct')}><Select label="Mechanism state" value={bug} options={[['correct', 'correct'], ['swap', 'row-ID swap'], ['tail', 'use parent offset for partial fork'], ['atomic', 'mutate before allocation refusal'], ['mask', 'cross-request triangle'], ['softmax', 'average page softmax outputs']]} onChange={setBug} /></Controls>
  </Figure>;
}
export function CbBindingLimit() {
  const [mode, setMode] = useState('pages');
  const [extra, setExtra] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [spareSlots, setSpareSlots] = useState(0);
  const ledger = mode === 'pages' ? {
    slots: [1, 3],
    queries: [2, 6],
    pages: [4, 4 + extra]
  } : mode === 'queries' ? {
    slots: [2, 3],
    queries: [6, 6 + extra],
    pages: [3, 8]
  } : {
    slots: [0, 3],
    queries: [0, 6],
    pages: [0, 8]
  };
  ledger.slots[1] += spareSlots;
  const eligible = mode === 'arrival' ? arrived : extra > 0;
  return <Figure id="D30" caption="Find the binding unit before changing capacity. Empty request slots cannot manufacture pages, and unused pages cannot make a not-yet-arrived request eligible.">
    <Table label="Boundary resource ledger" headers={['resource', 'used', 'capacity', 'remaining']} rows={Object.entries(ledger).map(([name, [used, capacity]]) => [name, used, capacity, capacity - used])} />
    <Tokens indexLabel="candidate" title="Candidate work" color={requestColor(mode === 'arrival' ? 'A' : 'C')} items={[mode === 'arrival' ? arrived ? 'A arrived: eligible' : 'A arrives at t = 3' : 'C next input: needs one new row and one free page']} />
    <p>{eligible ? 'Candidate is now eligible; assemble its next row.' : mode === 'pages' ? 'Binding limit: no free page. Next possible change: a last-reference release or more pages.' : mode === 'queries' ? 'Binding limit: this iteration has no query-row budget left. Next possible change: a forward boundary or a larger budget.' : 'No work has arrived. Next event: arrival at t = 3; adding resources alone changes nothing.'}</p>
    {spareSlots > 0 && <p>Adding {spareSlots} spare request slots changes that capacity, but leaves the candidate's eligibility unchanged: request slots were not binding.</p>}
    <Controls reset={() => {
      setMode('pages');
      setExtra(0);
      setArrived(false);
      setSpareSlots(0);
    }}>
      <Select label="Scenario" value={mode} options={[['pages', 'no pages, spare request slots'], ['queries', 'query budget exhausted, spare pages'], ['arrival', 'no arrived work']]} onChange={v => {
        setMode(v);
        setExtra(0);
        setArrived(false);
      }} />
      <Range label={mode === 'pages' ? 'Additional pages' : 'Additional query rows'} value={extra} min={0} max={3} onChange={setExtra} disabled={mode === 'arrival'} />
      <Range label="Additional nonbinding request slots" value={spareSlots} min={0} max={2} onChange={setSpareSlots} />
      <Check label="Advance to A's arrival" checked={arrived} onChange={setArrived} disabled={mode !== 'arrival'} />
    </Controls>
  </Figure>;
}
