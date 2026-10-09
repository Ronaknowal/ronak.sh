import { useEffect, useState } from 'react';
import { color, namespace, hashChain, lifecycle, admission, trace, requests } from '../../data/prefix-caching-models.js';
import { Figure, Controls, Range, Check, Select, Graph, Edge, Node, Tokens, Table, Pool, Stepper, Pair, vec } from './PrefixCachingShared.jsx';
import { AliasGraph } from './PrefixCachingFoundations.jsx';
export function PcStates() {
  const stages = [['free', 20, 30, 'none'], ['reserved', 270, 30, 'A'], ['complete active', 520, 30, 'A'], ['retained inactive', 520, 230, 'none'], ['reclaimed/free', 20, 230, 'none']];
  return <Figure 
  id="D10" 
  caption="The same physical slot changes state. Reservation has no computed payload yet. Completing its K/V makes a full page indexable; final release makes it evictable, not immediately absent."
>
  <Graph 
    label="Physical page state transitions" 
    width={760} 
    height={380}
  >
    {stages.map(([name, x, y, owner], i) => <g key={name}>
      <Node 
        x={x} 
        y={y} 
        width={215} 
        height={95} 
        label={`p0 · ${name}`} 
        sub={`owner: ${owner}`} 
        tone="#62d7e2" 
        dashed={i === 1} 
      />
      {[0, 1, 2, 3].map(j => <g key={j}>
        <rect 
          x={x + 18 + j * 45} 
          y={y + 107} 
          width="42" 
          height="35" 
          fill={i === 2 || i === 3 ? `${color(j + 1)}22` : '#262a34'} 
          stroke={color(j + 1)} 
          strokeDasharray={i === 1 ? '3 3' : undefined} 
        />
        <text 
          x={x + 39 + j * 45} 
          y={y + 131} 
          textAnchor="middle"
        >
          {i === 2 || i === 3 ? j + 1 : '—'}
        </text>
      </g>)}
    </g>)}
    <Edge 
      x1={235} 
      y1={77} 
      x2={270} 
      y2={77} 
    />
    <text 
      x="235" 
      y="18"
    >admit</text>
    <Edge 
      x1={485} 
      y1={77} 
      x2={520} 
      y2={77} 
    />
    <text 
      x="460" 
      y="18"
    >compute</text>
    <Edge 
      x1={628} 
      y1={173} 
      x2={628} 
      y2={228} 
      label="last release" 
    />
    <Edge 
      x1={518} 
      y1={280} 
      x2={236} 
      y2={280} 
      label="evict inactive entry" 
    />
    <Edge 
      x1={125} 
      y1={227} 
      x2={125} 
      y2={173} 
      label="free slot" 
    />
  </Graph>
</Figure>;
}
export function PcOwners() {
  const [step, setStep] = useState(0);
  const events = lifecycle(),
    s = events[step];
  return <Figure 
  id="D11" 
  caption="Each event updates the request tables, references and inactive queue together. Back/Reset reconstruct state without acquiring or releasing a second time."
>
  <p>
    <strong>
      {s.label}
    </strong>
  </p>
  <Pool state={s} />
  <Stepper 
    step={step} 
    setStep={setStep} 
    max={events.length - 1} 
  />
  <Table 
    label="Live request page tables" 
    headers={['Request', 'Physical table', 'Computed']} 
    rows={Object.entries(s.requests).map(([id, r]) => [id, vec(r.table), r.computed ? 'yes' : 'not yet'])} 
  />
</Figure>;
}
export function PcAdmission() {
  const [capacity, setCapacity] = useState(4),
    [pin, setPin] = useState(true);
  const r = admission(capacity, pin);
  return <Figure 
  id="D12" 
  caption="C has thirteen IDs, including A's first full block. Its four-page table needs one protected match plus three new pages. Plan the entire deficit before mutating storage."
>
  <Pool 
    state={r.before} 
    label="Before C admission" 
  />
  <Controls reset={() => {
      setCapacity(4);
      setPin(true);
    }}>
    <Range 
      label="Physical pool pages" 
      value={capacity} 
      min={4} 
      max={8} 
      onChange={setCapacity} 
    />
    <Check 
      label="A remains active" 
      value={pin} 
      onChange={setPin} 
    />
  </Controls>
  <p>Protected matches {vec(r.plan.matched)}; new pages needed {r.plan.needed}; free {vec(r.plan.availableFree)}; unprotected inactive candidates {vec(r.plan.evictable)}.</p>
  <p>
    {r.plan.accepted ? `Accepted. Evicted ${vec(r.plan.evicted)}; allocated ${vec(r.plan.allocated)}.` : `Denied. Entire state unchanged: ${r.unchanged ? 'yes' : 'no'}.`}
  </p>
  <Pool 
    state={r.after} 
    label="After admission decision" 
  />
</Figure>;
}
export function PcUnion() {
  const [tails, setTails] = useState(1);
  const a = [0, 1, ...Array.from({
      length: tails
    }, (_, i) => 2 + i)],
    b = [0, 1, ...Array.from({
      length: tails
    }, (_, i) => 2 + tails + i)],
    pages = [{
      id: 0,
      tokens: [1, 2, 3, 4],
      shared: true
    }, {
      id: 1,
      tokens: [5, 6, 7, 8],
      shared: true
    }, ...Array.from({
      length: 2 * tails
    }, (_, i) => ({
      id: i + 2,
      tokens: [i < tails ? 9 : 11, i < tails ? 10 : 12],
      owner: i < tails ? 'A' : 'B'
    }))];
  return <Figure 
  id="D13" 
  caption="Each tail page is a separate physical allocation; repeated labels here represent a supplied storage-count fixture. Shared full pages are counted once in the union. The 512-byte block size includes both K and V across all layers."
>
  <AliasGraph 
    a={a} 
    b={b} 
    pages={pages} 
  />
  <Controls reset={() => setTails(1)}>
    <Range 
      label="Private tail pages per request" 
      value={tails} 
      min={1} 
      max={3} 
      onChange={setTails} 
    />
  </Controls>
  <p>{a.length + b.length} logical references × 512 = {(a.length + b.length) * 512} reference-counted bytes; {pages.length} unique pages × 512 = {pages.length * 512} allocated data-block bytes. Only {1024 + tails * 512} bytes contain valid rows: two full shared pages plus two occupied positions in each private tail. Dashed slots are reserved but unused. Metadata and retained inactive allocations are additional.</p>
</Figure>;
}
export function PcFork() {
  return <Figure 
  id="D14" 
  caption="Full immutable pages remain shared. The writable partial tail is copied before either branch appends; otherwise the later write would replace its sibling's fourth value."
>
  <Graph 
    label="Partial-page copy before two divergent writes" 
    width={760} 
    height={370}
  >
    <Node 
      x={250} 
      y={15} 
      width={235} 
      label="earlier full pages: shared" 
      sub="unchanged K/V; owners A+B" 
      tone="#62d7e2" 
    />
    <Node 
      x={260} 
      y={100} 
      width={215} 
      height={65} 
      label="original tail [5, 6, 7, —]" 
      sub="copy before second owner writes" 
      tone="#ffc266" 
    />
    <Edge 
      x1={280} 
      y1={168} 
      x2={160} 
      y2={225} 
      label="" 
      tone="#6daeff" 
    />
    <Edge 
      x1={450} 
      y1={168} 
      x2={605} 
      y2={225} 
      label="" 
      tone="#ff91b4" 
    />
    <text x="100" y="178" textAnchor="middle" fill="#6daeff">A private</text>
    <text x="660" y="178" textAnchor="middle" fill="#ff91b4">B copied</text>
    <Node 
      x={25} 
      y={230} 
      width={270} 
      height={65} 
      label="A [5, 6, 7, 8]" 
      sub="write 8 to its own fourth slot" 
      tone="#6daeff" 
    />
    <Node 
      x={475} 
      y={230} 
      width={270} 
      height={65} 
      label="B [5, 6, 7, 9]" 
      sub="write 9 to its own fourth slot" 
      tone="#ff91b4" 
    />
    <Edge 
      x1={285} 
      y1={64} 
      x2={130} 
      y2={228} 
      dashed 
      tone="#62d7e2" 
    />
    <Edge 
      x1={465} 
      y1={64} 
      x2={630} 
      y2={228} 
      dashed 
      tone="#62d7e2" 
    />
    <text 
      x="20" 
      y="344"
    >Wrong shared tail: A writes 8 → B writes 9 → both references see 9.</text>
  </Graph>
</Figure>;
}
export function PcHash() {
  const [collision, setCollision] = useState(false),
    [edit, setEdit] = useState(false),
    [data, setData] = useState(null);
  const b = edit ? [8, 6, 5, 7] : [1, 3, 5, 7];
  useEffect(() => {
    let live = true;
    setData(null);
    Promise.all([hashChain([1, 3, 5, 7], 2, namespace, collision), hashChain(b, 2, namespace, collision)]).then(([a, c]) => {
      if (live) setData({
        a,
        b: c
      });
    });
    return () => {
      live = false;
    };
  }, [collision, edit]);
  return <Figure 
  id="D15" 
  caption="The parent digest carries earlier context into the next hash. A forced zero digest makes both buckets collide, but complete-prefix equality still rejects a different causal history."
>
  <Graph 
    label="Parent-dependent block hash chain" 
    width={730} 
    height={185}
  >
    <Node 
      x={10} 
      y={40} 
      width={170} 
      label="namespace bytes" 
      sub="model / adapter / trust" 
      tone="#62d7e2" 
    />
    <Edge 
      x1={180} 
      y1={74} 
      x2={260} 
      y2={74} 
      label="parent" 
    />
    <Node 
      x={260} 
      y={40} 
      width={170} 
      label="block 0 → h0" 
      sub={vec(b.slice(0, 2))} 
      tone={color(b[0])} 
    />
    <Edge 
      x1={430} 
      y1={74} 
      x2={530} 
      y2={74} 
      label="h0 + IDs" 
    />
    <Node 
      x={530} 
      y={40} 
      width={185} 
      label="block 1 → h1" 
      sub={vec(b.slice(2))} 
      tone={color(b[2])} 
    />
    <text 
      x="10" 
      y="145"
    >Exact comparator also retains namespace and the entire prefix.</text>
  </Graph>
  <Controls reset={() => {
      setCollision(false);
      setEdit(false);
    }}>
    <Check 
      label="Force digest to zero (teaching collision)" 
      value={collision} 
      onChange={setCollision} 
    />
    <Check 
      label="Change B's earlier block to [8, 6]" 
      value={edit} 
      onChange={setEdit} 
    />
  </Controls>
  {data ? <><Table 
    label={collision ? 'Forced one-byte digest; not SHA256' : 'Actual browser SHA256, same byte serialization as the Python program'} 
    headers={['Entry', 'Prefix', 'Digest']} 
    rows={[...data.a.map((r, i) => ['A block ' + i, vec(r.prefix), r.digest]), ...data.b.map((r, i) => ['B block ' + i, vec(r.prefix), r.digest])]} 
  /><p>Last digest {data.a[1].digest === data.b[1].digest ? 'equal' : 'different'}; exact prefix {data.a[1].exact === data.b[1].exact ? 'equal: reuse candidate accepted.' : 'different: reuse refused, even if the digest collides.'}</p></> : <p role="status">Computing the selected digest…</p>}
</Figure>;
}
export function PcTrace() {
  const [capacity, setCapacity] = useState(4),
    [step, setStep] = useState(0),
    [order, setOrder] = useState('ACB');
  const r = trace([...order], capacity),
    s = r.events[Math.min(step, r.events.length - 1)];
  return <Figure 
  id="D16" 
  caption="Selected requests arrive sequentially; each completes and releases before the next. The finite store computes actual prefix matches and reclamation decisions. Four-page A,C,B is the saved reordered trace; three-page A,C,B is the pressure case."
>
  <p>
    <strong>
      {s.label}
    </strong>
  </p>
  <Pool state={s} />
  <Controls reset={() => {
      setCapacity(4);
      setStep(0);
      setOrder('ACB');
    }}>
    <Select 
      label="Request sequence" 
      value={order} 
      onChange={v => {
        setOrder(v);
        setStep(0);
      }} 
      options={[["A", "Cold A"], ["ABA", "Warm A → B → A"], ["ACB", "Reordered A → C → B"]]} 
    />
    <Range 
      label="Trace pool pages" 
      value={capacity} 
      min={3} 
      max={8} 
      onChange={v => {
        setCapacity(v);
        setStep(0);
      }} 
    />
  </Controls>
  <Stepper 
    step={step} 
    setStep={setStep} 
    max={r.events.length - 1} 
  />
  <p>Current request: matched {vec(s.plan.matched)}, new query rows {s.plan.new_query_rows}; eviction {vec(s.plan.evicted ?? [])}. Whole trace: {r.reused}/{r.requested} rows reused, {r.newQueries} new queries.</p>
</Figure>;
}
export function PcHistory() {
  const r = trace(['A', 'C', 'B'], 4);
  return <Figure 
  id="D17" 
  caption="Read each physical slot downward through time. The generation increases when a slot holds a new allocation; reuse of the slot is not continued residence of its old content. This is the same four-page A,C,B trace."
>
  <Table 
    label="Physical pages across actual finite events" 
    headers={['Event', ...Array.from({
      length: 4
    }, (_, i) => `p${i}`)]} 
    rows={r.events.map(s => [s.label, ...s.pages.map(p => <span key={p.id} style={{
      color: p.tokens.length ? color(p.tokens[0]) : '#bdc2ce'
    }}>g{p.generation} · {p.owners.length ? `active ${p.owners.join('+')}` : s.free.includes(p.id) ? 'free' : 'retained'}<br />{vec(p.tokens)}{p.reserved ? ' reserved' : ''}</span>)])} 
  />
</Figure>;
}
export function PcDenominators() {
  const [choice, setChoice] = useState('unequal');
  const presets = {
    unequal: [[6, 0], [10, 8], [14, 4]],
    longMiss: [[4, 3], [4, 3], [100, 0]],
    empty: []
  };
  const rows = presets[choice],
    hit = rows.filter(([, p]) => p > 0).length,
    total = rows.reduce((s, [l]) => s + l, 0),
    reuse = rows.reduce((s, [, p]) => s + p, 0);
  return <Figure 
  id="D18" 
  caption="A request hit contributes one regardless of its length. The token numerator weights actual reused rows. These supplied denominator fixtures isolate the statistic and do not impose the earlier four-row page policy."
>
  <Table 
    label="Requests and reused rows" 
    headers={['Request', 'Prompt rows', 'Reused rows', 'Hit?']} 
    rows={rows.map(([l, p], i) => [String.fromCharCode(65 + i), l, p, p > 0 ? 'yes' : 'no'])} 
  />
  <Controls reset={() => setChoice('unequal')}>
    <Select 
      label="Metric fixture" 
      value={choice} 
      onChange={setChoice} 
      options={[['unequal', 'Unequal lengths: 6, 10, 14'], ['longMiss', 'Two short hits and one long miss'], ['empty', 'No offered requests']]} 
    />
  </Controls>
  <p>Request hit fraction: {rows.length ? `${hit}/${rows.length} = ${(100 * hit / rows.length).toFixed(2)}%` : 'not applicable (0/0)'}.</p>
  <p>Reused-token fraction: {total ? `${reuse}/${total} = ${(100 * reuse / total).toFixed(2)}%` : 'not applicable (0/0)'}. New query rows: {total - reuse}.</p>
</Figure>;
}
