import { useState } from 'react';
import { PagePool, pageAttention, simulate, servingRequests, requestColor } from '../../data/continuous-batching-models.js';
import { Figure, Controls, Range, Select, Check, Pair, Table, Tokens, Arrow, Bars, fmt, vec } from './ContinuousBatchingShared.jsx';
import { Pool, Identity } from './ContinuousBatchingStructures.jsx';
const seeded = (pages = 5, length = 5) => {
  const pool = new PagePool(pages, 3);
  pool.create('A');
  pool.append('A', Array.from({
    length
  }, (_, i) => i + 1));
  return pool;
};
export function CbAddresses() {
  const [position, setPosition] = useState(5);
  const [moved, setMoved] = useState(false);
  const pool = new PagePool(7, 3);
  pool.tables = {
    A: [4, 1, moved ? 2 : 6]
  };
  pool.lengths = {
    A: 7
  };
  pool.free = [0, 3, 5, moved ? 6 : 2];
  pool.tables.A.forEach((page, block) => {
    pool.refs[page] = 1;
    for (let offset = 0; offset < 3; offset++) {
      pool.keys[page][offset] = block * 3 + offset + 1;
      pool.values[page][offset] = -(block * 3 + offset + 1);
    }
  });
  const block = Math.floor(position / 3),
    offset = position % 3,
    page = pool.tables.A[block];
  return <Figure id="D10" caption="The logical read is unchanged when the final page's values and its table entry move together. Allocated addressability does not grant permission to read beyond valid length 7.">
    <Tokens title="Logical positions" items={Array.from({
      length: 8
    }, (_, i) => i)} valid={7} selected={position} color={requestColor('A')} />
    <Arrow>{position} ÷ 3 → block {block}, offset {offset} → table[{block}] = page {page}</Arrow>
    <Pool pool={pool} selected={position < 7 ? [page, offset] : undefined} />
    <p>{position < 7 ? `Valid read: K ${pool.keys[page][offset]}, V ${pool.values[page][offset]}.` : 'Read refused: position 7 is outside the request’s valid history.'}</p>
    <Controls reset={() => {
      setPosition(5);
      setMoved(false);
    }}>
      <Range label="Logical position" value={position} min={0} max={7} onChange={setPosition} />
      <Check label="Relocate final page 6 → 2, including its values" checked={moved} onChange={setMoved} />
    </Controls>
  </Figure>;
}
export function CbSlack() {
  const [size, setSize] = useState(16);
  const [first, setFirst] = useState(137);
  const [divisible, setDivisible] = useState(false);
  const lengths = divisible ? [size * 4, size * 3, size * 8, size * 2] : [first, 89, 512, 50];
  const allocated = lengths.map(length => Math.ceil(length / size) * size);
  const useful = lengths.reduce((a, b) => a + b, 0),
    total = allocated.reduce((a, b) => a + b, 0);
  const reserve = 4 * Math.max(...lengths);
  return <Figure id="D11" caption="All bars use token slots on the same scale. Byte storage multiplies these slots by the per-token K/V footprint; table entries and reference counters are additional metadata.">
    <Bars title="Storage comparison in token slots" names={['useful', 'paged allocation', 'maximum reservation']} values={[useful, total, reserve]} maximum={reserve} />
    <p>Each request below uses the same 0–{Math.max(...allocated)} slot scale. Vertical lines mark pages; hatched tails are allocated but unused.</p>
    <div className="cb-lanes">{lengths.map((length, i) => <div className="cb-lane" key={i}>
      <Identity id={'ABCD'[i]} /><div style={{
          height: '1.5em',
          background: '#242731',
          position: 'relative'
        }}>
        <div className="cb-invalid" style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${100 * length / Math.max(...allocated)}%`,
            width: `${100 * (allocated[i] - length) / Math.max(...allocated)}%`,
            borderRight: '1px solid white'
          }} />
        <div style={{
            position: 'absolute',
            inset: 0,
            width: `${100 * length / Math.max(...allocated)}%`,
            background: requestColor('ABCD'[i]),
            opacity: .65
          }} />
        {Array.from({
            length: allocated[i] / size
          }, (_, page) => <i key={page} style={{
            position: 'absolute',
            left: `${100 * page * size / Math.max(...allocated)}%`,
            top: 0,
            bottom: 0,
            borderLeft: '1px solid #eee'
          }} />)}
      </div>
    </div>)}</div>
    <Table label="Each request's last-page slack" headers={['request', 'valid', 'pages', 'allocated', 'tail slack']} rows={lengths.map((length, i) => [<Identity key={i} id={'ABCD'[i]} />, length, Math.ceil(length / size), allocated[i], allocated[i] - length])} />
    <p>Unused allocated tail: {total - useful} slots. Allocation / reservation: {fmt(100 * total / reserve, 2)}%. Tail / allocation: {fmt(100 * (total - useful) / total, 2)}%.</p>
    <Controls reset={() => {
      setSize(16);
      setFirst(137);
      setDivisible(false);
    }}>
      <Select label="Page size" value={size} options={[4, 8, 16, 32].map(n => [n, n])} onChange={v => setSize(Number(v))} />
      <Range label="A valid length" value={first} min={1} max={256} onChange={setFirst} disabled={divisible} />
      <Check label="Use page-divisible lengths" checked={divisible} onChange={setDivisible} />
    </Controls>
  </Figure>;
}
export function CbTransaction() {
  const [capacity, setCapacity] = useState(3);
  const [phase, setPhase] = useState(0);
  const pool = seeded(capacity);
  const before = JSON.stringify(pool.snapshot());
  let error = null;
  if (phase === 2 || capacity === 2) {
    try {
      pool.append('A', [6, 7]);
    } catch (failure) {
      error = failure.message;
    }
  }
  return <Figure id="D12" caption="The two-row append is one transaction. Insufficient capacity leaves every stored value, table entry, length, reference count and free-list entry unchanged.">
    <Tokens indexLabel="stage" title="Append transaction" items={['before: length 5', 'reserve 1 page', 'commit: length 7']} selected={phase} />
    <Pool pool={pool} />
    <p>{error ? `${error}. Whole state unchanged: ${before === JSON.stringify(pool.snapshot())}.` : phase === 1 ? 'Reservation plan: the current tail receives 6, the new page receives 7. Published storage is still unchanged.' : phase === 2 ? 'Committed logical keys [1, 2, 3, 4, 5, 6, 7].' : 'A has one unused tail slot; the second new row requires another page.'}</p>
    <Controls reset={() => {
      setCapacity(3);
      setPhase(0);
    }}>
      <Range label="Pool page capacity" value={capacity} min={2} max={4} onChange={n => {
        setCapacity(n);
        setPhase(0);
      }} />
      <button type="button" disabled={Boolean(error) || phase === 2} onClick={() => setPhase(n => n + 1)}>Next transaction stage</button>
    </Controls>
  </Figure>;
}
export function CbRelease() {
  const [step, setStep] = useState(0);
  const [childFirst, setChildFirst] = useState(false);
  const pool = seeded(2, 3);
  pool.fork('A', 'B', 3);
  const order = childFirst ? ['B', 'A'] : ['A', 'B'];
  if (step >= 1) pool.release(order[0]);
  if (step >= 2) pool.release(order[1]);
  if (step >= 3) {
    pool.create('C');
    pool.append('C', [91, 92, 93, 94]);
  }
  return <Figure id="D13" caption="An address can be reused after its last reference disappears. The old request has no table, so the new contents do not resurrect its history.">
    <Pool pool={pool} origins={step < 3 ? {
      0: 'A'
    } : {
      0: 'C',
      1: 'C'
    }} />
    <p>{['A and B both reference page 0.', `${order[0]} released; the surviving request still owns page 0.`, 'Both released; page 0 is now free.', 'C consumes the free list, including old page 0, and stores new values.'][step]}</p>
    <Controls reset={() => {
      setStep(0);
      setChildFirst(false);
    }}>
      <Range label="Release / reuse stage" value={step} min={0} max={3} onChange={setStep} />
      <Check label="Release child B first" checked={childFirst} onChange={setChildFirst} />
    </Controls>
  </Figure>;
}
export function CbFork() {
  const [prefix, setPrefix] = useState(4);
  const pool = seeded(3);
  pool.fork('A', 'B', prefix);
  return <Figure id="D14" caption="The tables may point to the same physical cell while their valid lengths differ. B's shorter prefix cannot read A's later tail value merely because that value is physically present.">
    <Pool pool={pool} />
    <Pair><Tokens title="A's permitted logical keys" items={pool.dense('A')} color={requestColor('A')} />
      <Tokens title="B's permitted logical keys" items={pool.dense('B')} color={requestColor('B')} /></Pair>
    {!prefix && <p>B has an empty table and adds no references.</p>}
    <Controls reset={() => setPrefix(4)}><Range label="B shared prefix length" value={prefix} min={0} max={5} onChange={setPrefix} /></Controls>
  </Figure>;
}
export function CbCopyOnWrite() {
  const [aligned, setAligned] = useState(false);
  const [limited, setLimited] = useState(false);
  const [append, setAppend] = useState(false);
  const pool = seeded(limited ? 2 : 4, aligned ? 6 : 5);
  pool.fork('A', 'B', aligned ? 6 : 4);
  const before = JSON.stringify(pool.snapshot()),
    parent = vec(pool.dense('A'));
  const oldTable = [...pool.tables.B],
    oldRefs = [...pool.refs];
  let result, error;
  if (append) {
    try {
      result = pool.append('B', [99]);
    } catch (failure) {
      error = failure.message;
    }
  }
  return <Figure id="D15" caption="A partial shared tail must become private before B writes. At an aligned boundary B allocates a fresh page and copies zero old rows. Both paths preserve A.">
    <Pool pool={pool} />
    <Table label="B's write path: before → after" headers={['object', 'before', 'after']} rows={[['B table', vec(oldTable), vec(pool.tables.B)], ['page references', vec(oldRefs), vec(pool.refs)], ['B permitted keys', aligned ? '[1, 2, 3, 4, 5, 6]' : '[1, 2, 3, 4]', vec(pool.dense('B'))]]} />
    {result && <Arrow>{aligned ? `No tail copy → new page ${result.new_pages[0]} offset 0 receives 99` : `Old page ${oldTable.at(-1)}, offset 0: K 4 / V −4 → new page ${result.new_pages[0]}, offset 0; new offset 1 receives K 99 / V −99`}</Arrow>}
    <Table label="Copy and mutation result" headers={['quantity', 'value']} rows={[['parent keys', vec(pool.dense('A'))], ['parent conserved', String(parent === vec(pool.dense('A')))], ['copied valid rows', result?.copied_valid_rows ?? (error ? 'append refused' : 'not appended')], ['new pages', result ? vec(result.new_pages) : 'none']]} />
    {error && <p role="status">{error}. Entire state unchanged: {String(before === JSON.stringify(pool.snapshot()))}.</p>}
    <Controls reset={() => {
      setAligned(false);
      setLimited(false);
      setAppend(false);
    }}>
      <Check label="Aligned parent and child length 6" checked={aligned} onChange={v => {
        setAligned(v);
        setAppend(false);
      }} />
      <Check label="Only two physical pages" checked={limited} onChange={v => {
        setLimited(v);
        setAppend(false);
      }} />
      <button type="button" disabled={append} onClick={() => setAppend(true)}>Append key 99 to B</button>
    </Controls>
  </Figure>;
}
export function CbPageNormalization() {
  const [reverse, setReverse] = useState(false);
  const [equal, setEqual] = useState(false);
  const masses = equal ? [1, 2, 1, 2] : [1, 2, 3, 4],
    values = [2, 0, 4, 1];
  const pages = [0, 1].map(page => ({
    id: page,
    masses: masses.slice(page * 2, page * 2 + 2),
    values: values.slice(page * 2, page * 2 + 2)
  }));
  if (reverse) pages.reverse();
  const rows = pages.map(page => {
    const mass = page.masses.reduce((a, b) => a + b, 0);
    const numerator = page.masses.reduce((sum, value, i) => sum + value * page.values[i], 0);
    return [`page ${page.id}`, vec(page.masses), vec(page.values), mass, numerator, numerator / mass];
  });
  const totalMass = rows.reduce((sum, row) => sum + row[3], 0),
    numerator = rows.reduce((sum, row) => sum + row[4], 0);
  return <Figure id="D16" caption="Page-local outputs must be weighted by their masses. Averaging them equally works in the special equal-mass case, not as a general page-attention rule.">
    <Table label="Unnormalized weights exp(score) and values" headers={['page', 'weights', 'values', 'mass', 'weighted sum', 'local output']} rows={rows} />
    <Arrow>combine numerators and masses across page boundaries</Arrow>
    <Bars title="Output comparison" names={['global normalization', 'unweighted page average']} values={[numerator / totalMass, rows.reduce((sum, row) => sum + row[5], 0) / 2]} maximum={4} />
    <p>Total numerator {numerator}; total mass {totalMass}; output {fmt(numerator / totalMass)}.</p>
    <Controls reset={() => {
      setReverse(false);
      setEqual(false);
    }}>
      <Check label="Read page 1 before page 0" checked={reverse} onChange={setReverse} />
      <Check label="Use equal page masses" checked={equal} onChange={setEqual} />
    </Controls>
  </Figure>;
}
export function CbOnlineSoftmax() {
  const [step, setStep] = useState(2);
  const [offset, setOffset] = useState(0);
  const [mask, setMask] = useState('none');
  const scores = [1, 2, 3, 4].map(n => Math.log(n) + offset);
  const allowed = [0, 1, 2, 3].map(i => mask === 'none' || mask === 'first' && i >= 2);
  const result = pageAttention(scores, [2, 0, 4, 1], 2, allowed);
  const registers = result.registers.slice(0, step);
  const current = registers.at(-1),
    previous = registers.at(-2);
  return <Figure id="D17" caption="When the running maximum changes, both old accumulators rescale by the same factor. A masked-only page is skipped; an all-invalid history has no normalized output.">
    <Tokens indexLabel="key row" title="Score rows, with page boundary after row 1" items={scores.map(value => fmt(value))} />
    <Table label="Online registers after each processed page" headers={['page', 'new maximum m', 'old rescale', 'mass ℓ', 'numerator u', 'u / ℓ']} rows={registers.map((r, i) => [i, r.maximum, r.skipped ? 'skip: no permitted rows' : r.rescale, r.mass, r.numerator, r.output ?? null])} />
    {current && !current.skipped && <>
      <Tokens indexLabel="register" title="Old unnormalized registers" items={[`m = ${previous ? fmt(previous.maximum) : "−∞"}`, `ℓ = ${fmt(previous?.mass ?? 0)}`, `u = ${fmt(previous?.numerator ?? 0)}`]} />
      <Arrow>old ℓ and u × {fmt(current.rescale)}; add this page's exponentials and weighted values</Arrow>
      <Tokens indexLabel="register" title="New unnormalized registers" items={[`m = ${fmt(current.maximum)}`, `ℓ = ${fmt(current.mass)}`, `u = ${fmt(current.numerator)}`]} />
    </>}
    <p>Final stable dense output: {fmt(result.dense)}. {step === 2 ? `Online output: ${fmt(result.output)}.` : 'The second page has not been consumed yet.'}</p>
    <Controls reset={() => {
      setStep(2);
      setOffset(0);
      setMask('none');
    }}>
      <Range label="Pages consumed" value={step} min={0} max={2} onChange={setStep} />
      <Select label="Common score offset" value={offset} options={[-1000, 0, 1000].map(n => [n, n])} onChange={v => setOffset(Number(v))} />
      <Select label="Mask" value={mask} options={[['none', 'all rows permitted'], ['first', 'first page masked'], ['all', 'all rows masked']]} onChange={setMask} />
    </Controls>
  </Figure>;
}
export function CbAdmission() {
  const [pages, setPages] = useState(10);
  const [cap, setCap] = useState(8);
  const [reserve, setReserve] = useState(true);
  const requests = servingRequests.map(row => ({
    ...row,
    cap: row.identity === 'long' ? row.cap : cap
  }));
  let used = 0,
    blocked = false;
  const rows = requests.map(row => {
    const needed = reserve ? Math.ceil((row.prompt + row.cap - 1) / 4) : Math.ceil(Math.min(4, row.prompt) / 4);
    const state = needed > pages ? 'infeasible alone' : blocked ? 'wait: earlier FIFO request blocked' : used + needed > pages ? 'wait: capacity occupied' : 'admit';
    const before = used;
    if (state === 'admit') used += needed;
    if (state.startsWith('wait')) blocked = true;
    return [<Identity key={row.identity} id={row.identity} />, row.prompt, row.cap, needed, `${before} + ${needed} ${before + needed <= pages ? '≤' : '>'} ${pages}`, state];
  });
  return <Figure id="D18" caption="This boundary presents A, B, then long in FIFO order. Cap reservation uses supplied upper bounds, never hidden completion lengths. Incremental first-chunk admission may need later growth or preemption.">
    <Table label="Admission ledger, page size 4" headers={['ID', 'prompt', 'output cap', 'requested pages', 'inequality', 'decision']} rows={rows} />
    <div className="cb-lanes">{['admit', 'wait', 'infeasible'].map(state => <div className="cb-lane" key={state}>
      <span>{state}</span><div className="cb-rail">{rows.flatMap((row, i) => row[5].startsWith(state) ? [<Identity key={i} id={requests[i].identity} />] : [])}</div>
    </div>)}</div>
    <Bars title="Physical page budget" names={['admitted requirement', 'capacity']} values={[used, pages]} maximum={Math.max(used, pages)} />
    <Controls reset={() => {
      setPages(10);
      setCap(8);
      setReserve(true);
    }}>
      <Range label="Pool pages" value={pages} min={2} max={14} onChange={setPages} />
      <Range label="A/B output cap" value={cap} min={1} max={16} onChange={setCap} />
      <Check label="Reserve through output cap" checked={reserve} onChange={setReserve} />
    </Controls>
  </Figure>;
}
export function CbRebuild() {
  const [pages, setPages] = useState(5);
  const [index, setIndex] = useState(0);
  const [cancel, setCancel] = useState(false);
  const requests = servingRequests.map(row => ({
    ...row,
    ...(cancel && row.identity === 'B' ? {
      cancel_at: 1.2
    } : {})
  }));
  const result = simulate(requests, {
    pages
  });
  const selected = Math.min(index, result.iterations.length - 1),
    iteration = result.iterations[selected];
  return <Figure id="D19" caption="Recomputation restores already-known prefix rows after a victim's pages were released. It does not emit those old outputs again. The high-water mark separates new rows from repeated work.">
    <Table label={`Iteration ${selected + 1}: ${fmt(iteration.begin)} → ${fmt(iteration.end)} modeled seconds`} headers={['request', 'kind', 'position begin', 'rows', 'new', 'repeated']} rows={iteration.work.map(row => [<Identity key={row.id} id={row.id} />, row.kind, row.begin, row.rows, row.new_rows, row.repeated_rows])} />
    <Pool pool={iteration.pool} />
    <Table label="Known response versus currently resident history at this boundary" headers={['ID', 'outputs already emitted', 'known processed-prefix target', 'currently resident', 'pending input']}
      rows={requests.map(row => {
        const emitted = result.events.filter(e => e.id === row.identity && e.event === 'emit' && e.time <= iteration.end).length;
        const done = result.events.some(e => e.id === row.identity && ['finished', 'canceled'].includes(e.event) && e.time <= iteration.end);
        return [row.identity, emitted, row.prompt + Math.max(0, emitted - 1), iteration.pool.lengths[row.identity] ?? 'released / not yet admitted',
          done ? 'none: terminal' : emitted ? `emission ${emitted}, still awaiting its own forward` : 'prompt not completed'];
      })} />
    <Table label="Whole-run request accounting" headers={['ID', 'new rows', 'repeated rows', 'preemptions', 'emitted', 'terminal']} rows={Object.entries(result.requests).map(([id, r]) => [id, r.useful_rows, r.repeated_rows, r.preemptions, r.generated, r.status])} />
    <Table label="Preemption and cancellation boundaries" headers={['time', 'event', 'ID']} rows={result.events.filter(e => ['preempt', 'canceled'].includes(e.event)).map(e => [e.time, e.event, e.id])} />
    <Controls reset={() => {
      setPages(5);
      setIndex(0);
      setCancel(false);
    }}>
      <Select label="Pool pages" value={pages} options={[5, 8, 10].map(n => [n, n])} onChange={v => {
        setPages(Number(v));
        setIndex(0);
      }} />
      <Range label="Iteration index" value={selected} min={0} max={result.iterations.length - 1} onChange={setIndex} />
      <Check label="Cancel B at first boundary at or after 1.2 s" checked={cancel} onChange={v => {
        setCancel(v);
        setIndex(0);
      }} />
    </Controls>
  </Figure>;
}
