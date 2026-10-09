import { useState } from 'react';
import { cacheColors, workCounts, allocation, deviceBudget, movedRecord } from '../../data/kv-cache-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Matrix, Pair, Arrow, Tokens,
  Bars, VectorPlot, Slots, fmt, vec, useCacheObservations, ObservationStatus } from './KvCacheShared.jsx';

export function KvNativeCache() {
  const { data, error, retry } = useCacheObservations();
  const [prompt, setPrompt] = useState(8);
  const [arm, setArm] = useState('dynamic');
  const [step, setStep] = useState(0);
  const [input, setInput] = useState(0);
  if (!data) return <Figure id="D10" caption="Recorded native cache observations."><ObservationStatus error={error} retry={retry} /></Figure>;
  const row = data.study.cases.find(value => value.prompt_length === prompt && value.arm === arm);
  const payload = row.payload;
  const layer = payload.layers[0];
  const firstInput = Math.floor(input / 8) * 8;
  return <Figure id="D10" caption="Actual Pythia14M, CPU FP32, same frozen inputs. The six cached teacher-forced arrays fail the original tolerance even though all tested argmax and eight greedy IDs agree. Cache payload is the final recorded state; selecting an output step does not invent an intermediate tensor snapshot.">
    <Tokens title={`Recorded Alice prompt IDs · positions ${firstInput}–${Math.min(prompt - 1, firstInput + 7)} of ${prompt}`} offset={firstInput}
      items={data.study.protocol.token_ids.slice(firstInput, Math.min(prompt, firstInput + 8))} selected={input - firstInput} />
    <p>Input position {input}: ID {data.study.protocol.token_ids[input]}, tokenizer piece <code>{data.study.protocol.tokens[input]}</code>. The tokenizer's visible Ġ marks a leading space.</p>
    <Arrow>these fixed prompt IDs → {arm} execution → selected output IDs</Arrow>
    <Tokens title="Recorded eight greedy output IDs" items={row.greedy_ids} selected={step} />
    <p>Output step {step + 1}: ID {row.greedy_ids[step]}; recorded top-two margin {fmt(row.greedy_top2_margins[step])}.</p>
    {layer ? <Pair><div className="kv-stage"><p>Each of six decoder layers owns a separate pair</p>
      <Matrix title="Actual tensor axis lengths" identity={false} columnLabels={['batch', 'heads', 'slots', 'coordinates']}
        rows={[layer.keys, layer.values]} rowLabels={['K', 'V']} /></div>
      <div><Bars title="Final tensor payload bytes" names={['occupied', 'backing']} values={[payload.occupied_bytes, payload.backing_bytes]} maximum={payload.backing_bytes} />
        <p>Processed positions: {payload.length}. Last emitted ID remains unfed.</p></div></Pair>
      : <p>Full recomputation retains no past-key/value payload; it recomputes each complete prefix.</p>}
    <Table label="Saved comparison against full recomputation" headers={['quantity', 'observed value']}
      rows={[["maximum absolute error", row.maximum_absolute_error], ['maximum relative error', row.maximum_relative_error],
        ['atol and rtol', '0.0002 each'], ['elementwise criterion', row.numerical_comparison.tolerance_passed ? 'passed (full reference)' : 'FAILED'],
        ['elements outside criterion', row.numerical_comparison.mismatched_elements], ['tested top-1 IDs', row.top1_matches_full ? 'all agree' : 'disagreement'],
        ['eight greedy IDs', row.greedy_matches_full ? 'all agree' : 'disagreement']]} />
    <Controls reset={() => { setPrompt(8); setArm('dynamic'); setStep(0); setInput(0); }}>
      <Select label="Prompt tokens" value={prompt} options={[[8, '8'], [32, '32'], [96, '96']]} onChange={value => { setPrompt(Number(value)); setInput(0); }} />
      <Select label="Execution route" value={arm} options={['full', 'dynamic', 'static'].map(value => [value, value])} onChange={setArm} />
      <Range label="Recorded input position" value={input} min={0} max={prompt - 1} onChange={setInput} />
      <Range label="Recorded output index" value={step} min={0} max={7} onChange={setStep} />
    </Controls>
  </Figure>;
}

function WorkDrawing({ title, lengths, prefill = false, maximum }) {
  const height = 30 + lengths.length * 30;
  return <div><p>{title}</p><Scroll label={title}>
    <svg className="kv-work-drawing" viewBox={`0 0 480 ${height}`} style={{ width: '100%', minWidth: '24rem' }} role="img" aria-label={`${title}: rows per call ${vec(lengths)}`}>
      {lengths.map((length, index) => <g key={index}>
        <text x="5" y={28 + index * 30}>call {index + 1}</text>
        <rect x="85" y={12 + index * 30} width={330 * length / maximum} height="18" fill={cacheColors[index % 5]} opacity=".8" />
        <text x={425} y={28 + index * 30}>{length}</text>
      </g>)}
    </svg></Scroll><p>{prefill ? 'One prefill, then one new row per call.' : 'The complete growing prefix is processed on every call.'}</p></div>;
}

export function KvWork() {
  const [prompt, setPrompt] = useState(3);
  const [generated, setGenerated] = useState(4);
  const counts = workCounts(prompt, generated);
  return <Figure id="D11" caption="Analytic counts, not elapsed time or a hardware FLOP counter. Legal query–key pairs form a triangle for prefill/full-prefix calls and one growing row for each cached decode call. Masked dense kernels may still do extra arithmetic.">
    <Pair><WorkDrawing title="Full-prefix projection rows" lengths={counts.lengths} maximum={prompt + generated - 1} />
      <WorkDrawing title="Cached projection rows" lengths={counts.cachedRows} maximum={prompt + generated - 1} prefill /></Pair>
    <Pair><Matrix title={`First full/prefill attention · ${prompt * (prompt + 1) / 2} legal pairs`} identity={false}
      rows={Array.from({ length: Math.min(prompt, 8) }, (_, row) => Array.from({ length: Math.min(prompt, 8) }, (_, column) => column <= row ? '●' : '×'))}
      permitted={Array.from({ length: Math.min(prompt, 8) }, (_, row) => Array.from({ length: Math.min(prompt, 8) }, (_, column) => column <= row))} />
      <div><p>{prompt > 8 ? 'The matrix shows its first eight rows/columns; exact full counts appear below.' : 'Every allowed matrix cell is one query–key pair.'}</p>
        <Table label="Per-call legal pair counts" headers={['call', 'full triangle', 'cache']}
          rows={counts.fullPairs.map((value, index) => [index + 1, value, counts.cachedPairs[index]])} /></div></Pair>
    <Table label="Exact totals" headers={['work unit', 'full recompute', 'cache']}
      rows={[["projection rows", counts.fullRows, counts.newRows], ['legal attention pairs', counts.fullAttention, counts.cachedAttention]]} />
    <Controls reset={() => { setPrompt(3); setGenerated(4); }}>
      <Range label="Prompt P" value={prompt} min={1} max={32} onChange={setPrompt} />
      <Range label="Emitted outputs G" value={generated} min={1} max={32} onChange={setGenerated} />
    </Controls>
  </Figure>;
}

export function KvTimings() {
  const { data, error, retry } = useCacheObservations();
  const [metric, setMetric] = useState('total');
  const [prompt, setPrompt] = useState(8);
  const [repeat, setRepeat] = useState(0);
  if (!data) return <Figure id="D12" caption="All 45 actual CPU observations."><ObservationStatus error={error} retry={retry} /></Figure>;
  const valueOf = row => (metric === 'total' ? row.end_to_end_ns : metric === 'prefill' ? row.prefill_ns : row.decode_ns.reduce((sum, value) => sum + value, 0)) / 1e6;
  const maximum = Math.max(...data.study.timings.map(valueOf)) * 1.08;
  const arms = ['full', 'dynamic', 'static'];
  return <Figure id="D12" caption="One warmup plus five cyclically ordered measured repetitions per arm and prompt. Every measured point is shown, including the 185.0851 ms full-route outlier. Shared x scale across prompt panels; these are CPU observations, not a GPU forecast.">
    {[8, 32, 96].map(length => <div key={length}><p>Prompt {length} · {metric} milliseconds</p>
      <Scroll label={`Measured ${metric} timings for ${length} prompt tokens`}><svg data-timing-plot="" viewBox="0 0 600 180" style={{ width: '100%', minWidth: '28rem' }} role="img" aria-label={`All 15 timings at prompt ${length}`}>
        <line x1="92" y1="145" x2="550" y2="145" stroke="#999" />
        {[0, .25, .5, .75, 1].map(fraction => <g key={fraction}><line x1={92 + 450 * fraction} x2={92 + 450 * fraction} y1="20" y2="145" stroke="#454752" />
          <text x={92 + 450 * fraction} y="170" textAnchor="middle">{fmt(maximum * fraction, 1)}</text></g>)}
        {arms.map((arm, index) => <g key={arm}><text x="5" y={43 + 43 * index}>{arm}</text>
          {data.study.timings.filter(row => row.prompt_length === length && row.arm === arm).map(row => <circle key={row.repeat}
            cx={92 + 450 * valueOf(row) / maximum} cy={39 + 43 * index + (row.repeat - 2) * 3} r="5" fill={cacheColors[index]}
            stroke={row.repeat === repeat && length === prompt ? '#fff' : 'none'} strokeWidth="2"><title>repeat {row.repeat + 1}: {fmt(valueOf(row))} ms</title></circle>)}
        </g>)}
      </svg></Scroll></div>)}
    <Table label={`Exact repeat ${repeat + 1} at prompt ${prompt}`} headers={['arm', 'construction ms', 'prefill ms', '7 decode calls ms', 'total ms']}
      rows={data.study.timings.filter(row => row.prompt_length === prompt && row.repeat === repeat).map(row => [row.arm, row.construction_ns / 1e6, row.prefill_ns / 1e6, row.decode_ns.reduce((a, b) => a + b, 0) / 1e6, row.end_to_end_ns / 1e6])} />
    <Table label="Recorded median ratio · full median / arm median (baseline 1)" headers={['prompt', 'arm', 'ratio']}
      rows={data.study.summary.map(row => [row.prompt_length, row.arm, row.full_over_arm_median])} />
    <Controls reset={() => { setMetric('total'); setPrompt(8); setRepeat(0); }}>
      <Select label="Plot measurement" value={metric} options={['total', 'prefill', 'decode'].map(value => [value, value])} onChange={setMetric} />
      <Select label="Detailed prompt" value={prompt} options={[[8, '8'], [32, '32'], [96, '96']]} onChange={value => setPrompt(Number(value))} />
      <Range label="Detailed repeat index" value={repeat} min={0} max={4} onChange={setRepeat} />
    </Controls>
  </Figure>;
}

export function KvPayloadFactors() {
  return <Figure id="D13" caption="Tensor payload counts stored coordinates, not Python object size or process RSS. The factor 2 applies only when K and V have the same coordinate width.">
    <Pair><Matrix title="One token in one head · width 3 + width 3" identity={false} rowLabels={['K', 'V']} rows={[[1, 0, 2], [.5, 1, -1]]} />
      <div className="kv-stage"><p>6 coordinates × 2 bytes = 12 bytes</p><p>2 stored heads × 12 = 24 bytes / layer / token</p><p>3 layers × 24 = 72 bytes / token</p></div></Pair>
    <Arrow>same tensor pair at every stored token position</Arrow>
    <Pair><Slots title="Request A" length={3} capacity={3} color={cacheColors[0]} /><Slots title="Request B" length={5} capacity={5} color={cacheColors[1]} /></Pair>
    <p>8 stored positions × 72 bytes = 576 bytes. In general: L × Hkv × (dk + dv) × bytes per coordinate × sum of request lengths.</p>
  </Figure>;
}

export function KvAllocation() {
  const [lengths, setLengths] = useState([3, 5, 8]);
  const [capacity, setCapacity] = useState(8);
  const [block, setBlock] = useState(4);
  const state = allocation(lengths, capacity, block);
  return <Figure id="D14" caption="Same occupied records, different allocation rules. Page-tail slack belongs to allocated payload; metadata and a reusable free-page pool are separate costs.">
    {['Ragged occupied storage', 'Static rectangular storage', `Blocks of ${block}`].map((title, mode) => <div key={title}><p>{title}</p>
      {lengths.map((length, index) => <div key={index}>
        <Slots title={`Request ${'ABC'[index]}`} length={mode === 1 ? Math.min(capacity, length) : length}
          capacity={mode === 0 ? length : mode === 1 ? capacity : state.allocated[index]} color={cacheColors[index]} pageSize={mode === 2 ? block : 0} />
        {mode === 1 && length > capacity && <Tokens title={`${length - capacity} required records have no allocated slot`}
          items={Array.from({ length: length - capacity }, (_, at) => `record ${capacity + at}`)} offset={capacity}
          valid={0} invalidLabel="unallocated" color={cacheColors[index]} />}
      </div>)}
    </div>)}
    {!state.validCapacity && <p role="status">The proposed static capacity is too small. Only the requested slots are allocated; hatched records below each affected request show what cannot fit. This static allocation is infeasible.</p>}
    <Table label="Exact slot accounting" headers={['layout', 'slots', 'payload bytes (256 bytes/token)']}
      rows={[["occupied", state.live, state.liveBytes], ['static requested', state.reserved, state.staticBytes], ['paged', state.paged, state.pagedBytes], ['page-tail slack', state.slack, state.slack * state.perToken]]} />
    <Controls reset={() => { setLengths([3, 5, 8]); setCapacity(8); setBlock(4); }}>
      {lengths.map((length, index) => <Range key={index} label={`Request ${'ABC'[index]} length`} value={length} min={1} max={12}
        onChange={value => setLengths(previous => previous.map((old, at) => at === index ? value : old))} />)}
      <Range label="Static capacity" value={capacity} min={1} max={12} onChange={setCapacity} />
      <Range label="Page size" value={block} min={1} max={8} onChange={setBlock} />
    </Controls>
  </Figure>;
}

export function KvDeviceBudget() {
  const [requests, setRequests] = useState(2);
  const [length, setLength] = useState(8192);
  const [replicated, setReplicated] = useState(false);
  const [capacity, setCapacity] = useState(24);
  const state = deviceBudget({ requests, length, replicated, capacityGiB: capacity });
  return <Figure id="D15" caption="Hypothetical per-device budget, not a measured 70B deployment. Each of two devices has these weights/workspace/reserve assumptions. Negative remaining space is a visible deficit; feasible request capacity is clamped at zero, not the signed remainder.">
    <Bars title={`Each device · available capacity ${capacity} GiB`} names={['weights', 'workspace', 'safety', 'K/V', 'remaining / deficit']}
      values={[14, 2, 1, state.cacheGiB, state.freeGiB]} maximum={Math.max(24, Math.abs(state.freeGiB), state.cacheGiB)} signed />
    <Table label="Declared ownership" headers={['quantity', 'value']}
      rows={[["KV heads owned by each device", state.ownedHeads], ['global cache / request GiB', state.globalPerRequest / 2 ** 30],
        ['cache / device / request GiB', state.perRequest / 2 ** 30], ['maximum requests under this budget', state.maxRequests], ['signed remaining GiB', state.freeGiB]]} />
    <Controls reset={() => { setRequests(2); setLength(8192); setReplicated(false); setCapacity(24); }}>
      <Range label="Simultaneous requests" value={requests} min={1} max={12} onChange={setRequests} />
      <Range label="Stored tokens / request" value={length} min={1024} max={16384} step={1024} onChange={setLength} />
      <Range label="Device capacity GiB" value={capacity} min={12} max={32} onChange={setCapacity} />
      <Check label="Replicate all eight KV heads on both devices" checked={replicated} onChange={setReplicated} />
    </Controls>
  </Figure>;
}

export function KvGroupedHeads() {
  const [heads, setHeads] = useState(2);
  return <Figure id="D16" caption="Four query readers retain their identities while stored head count changes. The output still has four query-head results; unrelated projection weights are not claimed equivalent.">
    <Scroll label="Query readers and stored key/value heads"><svg viewBox="0 0 520 210" className="kv-dependency" role="img" aria-label={`4 query heads connect to ${heads} KV heads`}>
      {[0, 1, 2, 3].map(query => {
        const group = Math.floor(query * heads / 4);
        const target = 260 + (group - (heads - 1) / 2) * 110;
        return <g key={query}><line x1={95 + 110 * query} y1="55" x2={target} y2="130" stroke={cacheColors[query]} strokeWidth="2" />
          <circle cx={95 + 110 * query} cy="35" r="22" fill="#202127" stroke={cacheColors[query]} />
          <text x={95 + 110 * query} y="40" textAnchor="middle">Q{query}</text></g>;
      })}
      {Array.from({ length: heads }, (_, head) => <g key={head}>
        <rect x={220 + (head - (heads - 1) / 2) * 110} y="130" width="80" height="55" fill="#202127" stroke={cacheColors[head]} />
        <text x={260 + (head - (heads - 1) / 2) * 110} y="152" textAnchor="middle">K{head} / V{head}</text>
        <path d={`M${225 + (head - (heads - 1) / 2) * 110} 160h70m-70 10h70`} stroke={cacheColors[head]} />
      </g>)}
    </svg></Scroll>
    <p>Two shown token rows per stored head. K/V row pairs: {heads * 2}, versus 8 in four-head MHA. Each pair still has its coordinate width.</p>
    <Controls reset={() => setHeads(2)}><Select label="Stored KV heads" value={heads} onChange={value => setHeads(Number(value))} options={[[4, '4 · MHA'], [2, '2 · GQA'], [1, '1 · MQA']]} /></Controls>
  </Figure>;
}

export function KvInvalidation() {
  const [position, setPosition] = useState(1);
  const [same, setSame] = useState(false);
  const [modelChanged, setModelChanged] = useState(false);
  const first = modelChanged ? 0 : same ? 5 : position;
  return <Figure id="D17" caption="A changed earlier input can affect every later hidden row. Repeating the same token spelling later does not recover its previous context-dependent state.">
    <Tokens title="Old token sequence" items={['the', 'cat', 'sat', 'the', 'cat']} />
    <Arrow>edit input → follow causal dependencies to the right</Arrow>
    <Tokens title="Cache validity after the change" items={['the', 'cat', 'sat', 'the', 'cat'].map((word, index) => index === position && !same ? 'new ID' : word)} valid={first} selected={position} invalidLabel="invalid / recompute" />
    <p>{first === 5 ? 'Same model and same ID: all five records stay valid.' : `Recompute from position ${first}. Earlier ${first} records remain reusable.`}</p>
    <Controls reset={() => { setPosition(1); setSame(false); setModelChanged(false); }}>
      <Range label="Edited position" value={position} min={0} max={4} onChange={setPosition} />
      <Check label="Replace with the identical ID" checked={same} onChange={setSame} />
      <Check label="Change model or adapter identity" checked={modelChanged} onChange={setModelChanged} />
    </Controls>
  </Figure>;
}

export function KvPositionMove() {
  const [angle, setAngle] = useState(30);
  const [slot, setSlot] = useState(4);
  const [wrong, setWrong] = useState(false);
  const record = movedRecord(angle * Math.PI / 180, wrong);
  return <Figure id="D18" caption="The query is at logical position 3, the stored key at position 1. A physical move preserves the rotated vector. Reinterpreting that record as logical position 0 changes the function. At θ = 0 the positional difference vanishes.">
    <VectorPlot title={`θ = ${angle}° · physical destination ${slot}`} vectors={[
      { label: 'query R(3θ)[1,0]', value: record.query, color: cacheColors[3] },
      { label: 'stored key R(θ)[1,0]', value: record.key, color: cacheColors[1] },
      { label: wrong ? 'wrong key at logical 0' : 'moved key, logical 1', value: record.readKey, color: cacheColors[2] },
    ]} />
    <Tokens title="Physical slots · the complete record moves" items={Array.from({ length: 6 }, (_, index) => index === slot ? 'key @ logical 1' : 'empty')} selected={slot} />
    <p>Preserved score {fmt(record.correct)}; current score {fmt(record.current)}.</p>
    <Controls reset={() => { setAngle(30); setSlot(4); setWrong(false); }}>
      <Range label="Angle θ in degrees" value={angle} min={0} max={60} onChange={setAngle} />
      <Range label="Physical destination slot" value={slot} min={0} max={5} onChange={setSlot} />
      <Check label="Wrongly reinterpret key at logical position 0" checked={wrong} onChange={setWrong} />
    </Controls>
  </Figure>;
}

export function KvRetention() {
  const grids = [
    ['Full causal attention', (query, key) => key <= query],
    ['Architectural window of 3', (query, key) => key <= query && key >= query - 2],
    ['Altered sink + recent 2', (query, key) => key <= query && (key === 0 || key >= query - 1)],
  ];
  return <Figure id="D19" caption="The permission rule determines which records are needed. A true local architecture can discard records outside future dependencies. Imposing sink/window deletion on full attention changes its function.">
    {grids.map(([title, allowed]) => <Matrix key={title} title={title} identity={false}
      rows={Array.from({ length: 6 }, (_, query) => Array.from({ length: 6 }, (_, key) => allowed(query, key) ? 'read' : '×'))}
      rowLabels={Array.from({ length: 6 }, (_, index) => `query ${index}`)}
      columnLabels={Array.from({ length: 6 }, (_, index) => `key ${index}`)}
      permitted={Array.from({ length: 6 }, (_, query) => Array.from({ length: 6 }, (_, key) => allowed(query, key)))} />)}
  </Figure>;
}
