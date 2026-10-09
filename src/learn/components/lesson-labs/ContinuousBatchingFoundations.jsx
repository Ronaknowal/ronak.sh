import { useState } from 'react';
import { originalJobs, schedule, projection, segmentedAttention, requestColor } from '../../data/continuous-batching-models.js';
import { Figure, Controls, Range, Select, Check, Pair, Table, Matrix, Tokens, Arrow, Bars, fmt, vec } from './ContinuousBatchingShared.jsx';
import { Identity, Timeline, EventLine } from './ContinuousBatchingStructures.jsx';
export function CbRequest() {
  const [processed, setProcessed] = useState(false);
  const [stopped, setStopped] = useState(false);
  const count = processed ? 4 : 3;
  return <Figure id="D01" caption="Selecting a token does not yet materialize its K/V. These finite fixture values expose the storage boundary; the drawing runs no neural network.">
    <Tokens title="A: token positions, separate from feature coordinates" items={[11, 7, 5, 9, ...(processed ? [4] : [])]} valid={count} color={requestColor('A')} invalidLabel={stopped ? 'stopped: never processed' : 'pending input'} />
    <Pair>{[0, 1].map(layer => <Matrix key={layer} title={`Layer ${layer}: stored position × K/V feature coordinates`} rows={Array.from({
        length: count
      }, (_, position) => [position + layer + 1, position - layer, -position - 1, layer + .5])} rowLabels={Array.from({
        length: count
      }, (_, i) => `A position ${i}`)} columnLabels={['K c0', 'K c1', 'V c0', 'V c1']} colors={Array(count).fill(requestColor('A'))} />)}</Pair>
    <Table label="Persistent request A" headers={['computed positions', 'generated outputs', 'state']} rows={[[count, processed ? 2 : 1, stopped ? 'terminal' : 'decode: pending input']]} />
    <Controls reset={() => {
      setProcessed(false);
      setStopped(false);
    }}>
      <button type="button" disabled={processed || stopped} onClick={() => setProcessed(true)}>Process pending ID 9</button>
      <button type="button" disabled={stopped} onClick={() => setStopped(true)}>Stop at output cap</button>
    </Controls>
  </Figure>;
}
export function CbBoundary() {
  const [step, setStep] = useState(0);
  const [during, setDuring] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [cancelAt, setCancelAt] = useState(5);
  const [duplicate, setDuplicate] = useState(false);
  const names = ['admit', 'assemble', 'forward', 'select', 'release', 'next boundary'];
  const canceled = cancel && step >= cancelAt;
  const bAdmitted = !canceled && (!during || step === 5);
  const lanes = {
    'not arrived': during && step < 2 ? ['B'] : [],
    waiting: during && step >= 2 && step < 5 && !canceled ? ['B'] : [],
    prefill: bAdmitted ? ['B'] : [],
    decode: step < 4 ? ['A'] : [],
    terminal: [...(step >= 4 ? ['A'] : []), ...(canceled ? ['B'] : [])]
  };
  return <Figure id="D02" caption="A's assembled forward cannot acquire B halfway through. This local cancellation acknowledgment is separate from the later framework's pending-request behavior.">
    <div className="cb-lanes">{Object.entries(lanes).map(([lane, ids]) => <div className="cb-lane" key={lane}>
      <span>{lane}</span><div className="cb-rail">{ids.map(id => <Identity key={id} id={id}>{id}{lane === 'terminal' ? id === 'B' ? ': canceled' : ': finished' : ''}</Identity>)}</div>
    </div>)}</div>
    <Tokens indexLabel="operation" title="Iteration boundary operations, in order" items={names} selected={step} />
    <p>Assembled request IDs: [{!during && !(cancel && cancelAt === 0) ? 'A, B' : 'A'}]. {step === 5 ? canceled ? 'A released; B cancellation observed before the next forward.' : 'A released; B may enter the next forward.' : 'The current tensor keeps its assembled membership.'}</p>
    {duplicate && <p role="status">Duplicate A refused before insertion; the four lanes remain unchanged.</p>}
    <Controls reset={() => {
      setStep(0);
      setDuring(true);
      setCancel(false);
      setCancelAt(5);
      setDuplicate(false);
    }}>
      <Range label="Boundary operation" value={step} min={0} max={5} onChange={setStep} />
      <Check label="B arrives during the forward" checked={during} onChange={value => {
        setDuring(value);
        if (value) setCancelAt(5);
      }} />
      <Check label="Cancel B at the observed boundary" checked={cancel} onChange={setCancel} />
      <Select label="Observe B cancellation" value={cancelAt} options={during ? [[5, 'before next assembly']] : [[0, 'before current assembly'], [5, 'before next assembly']]} onChange={v => setCancelAt(Number(v))} disabled={!cancel} />
      <button type="button" onClick={() => setDuplicate(true)} disabled={duplicate}>Try duplicate ID A</button>
    </Controls>
  </Figure>;
}
export function CbSchedules() {
  const [slots, setSlots] = useState(4);
  const [arrival, setArrival] = useState(0);
  const [length, setLength] = useState(25);
  const [mode, setMode] = useState('original');
  const jobs = mode === 'single' ? [originalJobs[0]] : originalJobs.map(row => ({
    ...row,
    arrival: row.identity === 'E' ? arrival : 0,
    length: mode === 'equal' ? 30 : row.identity === 'C' ? length : row.length
  }));
  const continuous = schedule(jobs, slots),
    fixed = schedule(jobs, slots, 'static');
  const maximum = Math.max(continuous.finish, fixed.finish);
  return <Figure id="D03" caption="The two policies do identical prescribed request work. Empty intervals, rather than shorter requests, explain this finite-model difference.">
    <Timeline title="Static batch: admission waits for the whole group" intervals={fixed.intervals} slots={slots} maximum={maximum} legend />
    <Timeline title="Continuous: refill each empty slot" intervals={continuous.intervals} slots={slots} maximum={maximum} legend />
    <Timeline title="Continuous detail: first 65 work units" intervals={continuous.intervals} slots={slots} maximum={maximum} limit={65} />
    <Table label="Equal-work comparison" headers={['policy', 'finish', 'request-work']} rows={[[fixed.policy, fixed.finish, fixed.useful_work], [continuous.policy, continuous.finish, continuous.useful_work]]} />
    <Controls reset={() => {
      setSlots(4);
      setArrival(0);
      setLength(25);
      setMode('original');
    }}>
      <Select label="Workload" value={mode} options={['original', 'equal', 'single'].map(x => [x, x])} onChange={setMode} />
      <Range label="Request slots" value={slots} min={1} max={4} onChange={setSlots} />
      <Range label="C work length" value={length} min={5} max={100} onChange={setLength} disabled={mode !== 'original'} />
      <Range label="E arrival" value={arrival} min={0} max={120} onChange={setArrival} disabled={mode === 'single'} />
    </Controls>
    {continuous.finish === fixed.finish && <p>The policies tie for this workload and capacity.</p>}
  </Figure>;
}
export function CbRefill() {
  const [time, setTime] = useState(25);
  const after = time >= 25;
  const ids = ['A', 'B', after ? 'E' : 'C', 'D'];
  return <Figure id="D04" caption="Slot 2 changes ownership at boundary 25. The output is delivered through the saved request ID, never through its future slot occupant.">
    <Tokens indexLabel="queue entry" title={`Waiting at boundary ${time}`} items={after ? ['F', 'G', 'H'] : ['E', 'F', 'G', 'H']} colors={(after ? ['F', 'G', 'H'] : ['E', 'F', 'G', 'H']).map(requestColor)} />
    <Table label="Assembled rows → persistent output recipients" headers={['slot / row', 'request', 'output destination']} rows={ids.map((id, i) => [i, <Identity key={id} id={id} />, `${id}.generated_ids`])} />
    <Arrow>{after ? 'C terminal output → C record; free slot → E admission' : 'C still owns slot 2'}</Arrow>
    <Controls reset={() => setTime(25)}><Range label="Work boundary" value={time} min={24} max={26} onChange={setTime} /></Controls>
  </Figure>;
}
export function CbBudgets() {
  const [budget, setBudget] = useState(6);
  const [pages, setPages] = useState(5);
  const prefill = Math.max(0, Math.min(4, budget - 2));
  const required = 4 + Number(prefill > 0);
  return <Figure id="D05" caption="A page shared by A and B counts once physically. Unscheduled C retains its resident page. D has no resident cache yet: its proposed page is needed only when at least one D prefill row is selected.">
    <Pair><Tokens indexLabel="request slot" title="Three request slots" items={['A decode', 'B decode', ...(prefill ? ['D prefill'] : ['idle'])]} colors={['A', 'B', 'D'].map(requestColor)} />
      <Tokens indexLabel="query row" title={`${2 + prefill} query rows selected`} items={['A', 'B', ...Array(prefill).fill('D')]} colors={['A', 'B', ...Array(prefill).fill('D')].map(requestColor)} /></Pair>
    <Tokens indexLabel="page" title="Proposed physical-page requirement" items={['p0: A/B', 'p1: A', 'p2: B', 'p3: C resident, unscheduled', ...(prefill ? ['p4: D proposed'] : [])]} colors={['A', 'A', 'B', 'C', 'D'].map(requestColor)} valid={Math.min(pages, required)} invalidLabel="does not fit" />
    <Table label="Three independent constraints" headers={['unit', 'required / available', 'result']} rows={[['requests', `${prefill ? 3 : 2} / 3`, 'fits'], ['new query rows', `${2 + prefill} / ${budget}`, prefill < 4 ? 'query budget limits prefill' : 'four prefill rows fit'], ['physical pages', `${required} / ${pages}`, pages < required ? 'memory blocks this selection' : pages === required ? 'exactly full' : 'spare pages do not add query rows']]} />
    <Controls reset={() => {
      setBudget(6);
      setPages(5);
    }}>
      <Range label="Query-row budget" value={budget} min={2} max={8} onChange={setBudget} />
      <Range label="Physical page capacity" value={pages} min={3} max={8} onChange={setPages} />
    </Controls>
  </Figure>;
}
export function CbClocks() {
  const [delay, setDelay] = useState(0);
  const [single, setSingle] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const emissions = (single ? [5] : [5, 6.5, 8]).map(t => t + delay);
  return <Figure id="D06" caption="These declared times illustrate subtraction, not measured hardware performance. An empty gap list differs from a measured gap of zero.">
    <EventLine title="Request A: supplied arrival and emission clocks" maximum={12} events={[{
      label: 'arrival',
      time: 2
    }, ...emissions.map((time, i) => ({
      label: `emit ${i + 1}`,
      time,
      id: 'B'
    }))]} spans={[{
      label: 'TTFT',
      begin: 2,
      end: emissions[0]
    }, ...(canceled ? [] : [{
      label: 'response elapsed',
      begin: 2,
      end: emissions.at(-1)
    }]), ...emissions.slice(1).map((time, index) => ({
      label: `gap ${index + 1}`, begin: emissions[index], end: time
    }))]} />
    <Table label="Named event timestamps and differences" headers={['quantity', 'seconds']} rows={[['arrival', 2], ['emissions', vec(emissions)], ['TTFT', emissions[0] - 2], ['inter-token gaps', vec(emissions.slice(1).map((t, i) => t - emissions[i]))], ['completed-response elapsed', canceled ? 'unavailable: canceled' : emissions.at(-1) - 2]]} />
    <Controls reset={() => {
      setDelay(0);
      setSingle(false);
      setCanceled(false);
    }}>
      <Range label="Additional initial delay" value={delay} min={0} max={3} step={.5} onChange={setDelay} />
      <Check label="One output only" checked={single} onChange={setSingle} />
      <Check label="Canceled after last shown output" checked={canceled} onChange={setCanceled} />
    </Controls>
  </Figure>;
}
export function CbProjection() {
  const [count, setCount] = useState(2);
  const [reverse, setReverse] = useState(false);
  const result = projection(count, reverse);
  const colors = result.rows.map(row => requestColor(row.id));
  const labels = result.rows.map(row => `${row.id} position ${row.position}`);
  return <Figure id="D07" caption="Rows are token positions; columns are feature coordinates. Reordering segments changes offsets and row order while each request keeps its projected values.">
    <Matrix title={`Packed hidden rows (${result.rows.length} × 4)`} rows={result.rows.map(row => row.values)} rowLabels={labels} colors={colors} />
    <Arrow>× shared projection W</Arrow>
    <Matrix title="W: 4 input features × 3 output features" rows={result.weights} identity={false} />
    <Arrow>↓ one output row for every input row</Arrow>
    <Matrix title="Projected rows" rows={result.result} rowLabels={labels} colors={colors} />
    <p>Segment order {result.order.join(' → ')}; offsets {vec(result.offsets)}. A begins at absolute position 2; B begins at 50.</p>
    <Controls reset={() => {
      setCount(2);
      setReverse(false);
    }}>
      <Range label="A query rows" value={count} min={1} max={3} onChange={setCount} />
      <Check label="Pack B before A" checked={reverse} onChange={setReverse} />
    </Controls>
  </Figure>;
}
export function CbSegmented() {
  const [perturb, setPerturb] = useState(0);
  const [broken, setBroken] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const result = segmentedAttention(perturb, broken);
  if (invalid) {
    result.mask = result.mask.map(row => row.map(() => false));
    result.scores = result.scores.map(row => row.map(() => -Infinity));
    result.weights = result.weights.map(row => row.map(() => 'undefined'));
    result.keyed = Object.fromEntries(Object.keys(result.keyed).map(key => [key, 'undefined: no permitted key']));
  }
  const labels = result.rows.map(row => `${row.id}${row.position}`);
  return <Figure id="D08" caption="Hatched cells are forbidden, not small probabilities. A global lower triangle lets B read A; the request-aware mask keeps B's output at 7 when A changes.">
    <Pair><Matrix title="Scores q·k, q = 0.5" rows={result.scores.map(row => row.map(x => Number.isFinite(x) ? x : 'masked'))} rowLabels={labels} columnLabels={labels} permitted={result.mask} colors={result.rows.map(row => requestColor(row.id))} />
      <Matrix title="Permitted probabilities" rows={result.weights} rowLabels={labels} columnLabels={labels} permitted={result.mask} colors={result.rows.map(row => requestColor(row.id))} /></Pair>
    <Table label="Weighted values, delivered by request position" headers={['position', 'output']} rows={Object.entries(result.keyed)} />
    <p>Normalize across each query row, then sum probability × value across its permitted columns. Values: {vec(result.rows.map(row => row.value))}.</p>
    <Controls reset={() => {
      setPerturb(0);
      setBroken(false);
      setInvalid(false);
    }}>
      <Range label="Perturb only A keys and values" value={perturb} min={-3} max={3} step={.5} onChange={setPerturb} disabled={invalid} />
      <Check label="Bug: global lower-triangular mask" checked={broken} onChange={setBroken} disabled={invalid} />
      <Check label="All keys invalid" checked={invalid} onChange={setInvalid} />
    </Controls>
  </Figure>;
}
export function CbScatter() {
  const [reverse, setReverse] = useState(false);
  const [empty, setEmpty] = useState(false);
  const result = projection(empty ? 0 : 2, reverse);
  return <Figure id="D09" caption="Scatter follows recorded segment boundaries and IDs. An empty A segment has no arithmetic row and yields an empty result, without asking softmax to normalize nothing.">
    <Table label="Packed row → owning request" headers={['packed index', 'request / absolute position', 'projected values']} rows={result.rows.map((row, i) => [i, <Identity key={i} id={row.id}>{row.id} / {row.position}</Identity>, vec(result.result[i])])} />
    <Arrow>scatter through offsets {vec(result.offsets)}</Arrow>
    <Table label="Persistent output records" headers={['request', 'rows']} rows={['A', 'B'].map(id => [<Identity key={id} id={id} />, result.rows.flatMap((row, i) => row.id === id ? [vec(result.result[i])] : []).join('; ') || '[]'])} />
    <Table label="Request context retained alongside the scattered rows" headers={['request', 'cached positions before', 'new absolute positions', 'pending output']} rows={['A', 'B'].map(id => [<Identity key={id} id={id} />, id === 'A' ? 2 : 50, vec(result.rows.filter(row => row.id === id).map(row => row.position)), id === 'A' && empty ? 'unchanged: no new row' : 'selected only after the full decoder and output head'])} />
    <p>This projection fixture returns hidden feature rows. It does not commit K/V or select token IDs; those operations in the complete decoder keep the same request identity.</p>
    <Controls reset={() => {
      setReverse(false);
      setEmpty(false);
    }}>
      <Check label="Pack B before A" checked={reverse} onChange={setReverse} />
      <Check label="A contributes zero rows" checked={empty} onChange={setEmpty} />
    </Controls>
  </Figure>;
}
