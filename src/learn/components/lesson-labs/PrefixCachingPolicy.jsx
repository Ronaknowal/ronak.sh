import { useState } from 'react';
import { Radix, radixFixture, parseIds, color, costs, route } from '../../data/prefix-caching-models.js';
import { Figure, Graph, Edge, Node, Controls, Range, Select, Check, Table, Pool, Stepper, Tokens, useObservations, Status, vec, fmt } from './PrefixCachingShared.jsx';
function RadixDrawing({
  nodes,
  label
}) {
  const positions = new Map();
  let leaf = 0,
    maxDepth = 0;
  const cell = n => Math.max(38, ...n.edge.map(t => String(t).length * 9 + 12));
  const spacing = Math.max(220, ...nodes.map(n => cell(n) * n.edge.length + 50));
  const place = (id, depth) => {
    const n = nodes.find(x => x.id === id);
    maxDepth = Math.max(maxDepth, depth);
    const children = n.children.map(c => place(c, depth + 1));
    const x = children.length ? children.reduce((a, b) => a + b, 0) / children.length : spacing / 2 + 30 + leaf++ * spacing;
    positions.set(id, {
      x,
      y: 45 + depth * 180
    });
    return x;
  };
  place(0, 0);
  const width = Math.max(650, leaf * spacing + 60);
  return <Graph 
  label={label} 
  width={width} 
  height={maxDepth * 180 + 130}
>
    
  {nodes.filter(n => n.parent !== null).map(n => {
      const p = positions.get(n.parent),
        q = positions.get(n.id),
        w = cell(n),
        tone = n.pins ? '#ffc266' : '#969cac';
      return <g key={n.id}>
    <path 
      d={`M${p.x} ${p.y + 62}V${p.y + 70}H${q.x}V${q.y - 28}`} 
      stroke={tone} 
      fill="none" 
      strokeWidth="2" 
    />
    <Edge 
      x1={q.x} 
      y1={q.y - 38} 
      x2={q.x} 
      y2={q.y - 28} 
      tone={tone} 
    />
    <g transform={`translate(${q.x - n.edge.length * w / 2} ${q.y - 82})`}>
      {n.edge.map((t, i) => <g key={i}>
        <rect 
          x={i * w} 
          y="0" 
          width={w - 2} 
          height="28" 
          fill="#20232d" 
          stroke={color(t)} 
        />
        <text 
          x={i * w + w / 2 - 1} 
          y="19" 
          textAnchor="middle" 
          fill={color(t)}
        >
          {t}
        </text>
      </g>)}
    </g>
  </g>;
    })}
    
  {nodes.map(n => {
      const p = positions.get(n.id);
      return <g key={n.id}>
    <circle 
      cx={p.x} 
      cy={p.y} 
      r="23" 
      fill="#20232d" 
      stroke={n.pins ? '#ffc266' : '#9fa5b6'} 
      strokeWidth={n.pins ? 3 : 1.5} 
    />
    <text 
      x={p.x} 
      y={p.y + 5} 
      textAnchor="middle"
    >
      {n.id === 0 ? 'root' : `n${n.id}`}
    </text>
    <text 
      x={p.x} 
      y={p.y + 46} 
      textAnchor="middle"
    >pins {n.pins} · last {n.last}</text>
  </g>;
    })}
  
</Graph>;
}
export function PcRadix() {
  const [draft, setDraft] = useState('1,2,8'),
    [third, setThird] = useState([1, 2, 8]),
    [error, setError] = useState(''),
    [stage, setStage] = useState('2');
  const r = new Radix();
  r.insert([1, 2, 3, 4, 5]);
  if (Number(stage) > 0) r.insert([1, 2, 3, 9]);
  if (Number(stage) > 1) r.insert(third);
  const nodes = r.snapshot();
  const change = text => {
    setDraft(text);
    try {
      const next = parseIds(text);
      if (next.length > 8) throw Error('Use at most eight IDs in this drawing.');
      setThird(next);
      setError('');
    } catch (e) {
      setError(e.message + ' Last valid tree is retained.');
    }
  };
  return <Figure 
  id="D22" 
  caption="Each edge holds an exact token sequence; circles identify persistent node objects. Inserting a mismatch splits an edge and reparents its old child. Empty input ends at root, and an exact duplicate adds no node."
>
  <RadixDrawing 
    nodes={nodes} 
    label="Compressed radix edges after the selected insertion" 
  />
  <Controls reset={() => {
      setDraft('1,2,8');
      setThird([1, 2, 8]);
      setStage('2');
      setError('');
    }}>
    <Select 
      label="Insertion boundary" 
      value={stage} 
      onChange={setStage} 
      options={[[0, 'A only: 1,2,3,4,5'], [1, 'Then B: 1,2,3,9'], [2, 'Then the editable third sequence']]} 
    />
    <label>Third sequence (comma-separated IDs)<input 
        value={draft} 
        disabled={stage !== '2'} 
        onChange={e => change(e.target.value)} 
        type="text" 
      /></label>
  </Controls>
  {error && <p role="alert">
    {error}
  </p>}
  <Table 
    label="Actual parent and edge identities" 
    headers={['Node', 'Parent', 'Edge IDs', 'Children']} 
    rows={nodes.map(n => [n.id, n.parent ?? 'none', vec(n.edge), vec(n.children)])} 
  />
</Figure>;
}
export function PcPins() {
  const [all, setAll] = useState(false),
    [count, setCount] = useState(0);
  const result = radixFixture([1, 2, 8], true, count, all);
  return <Figure 
  id="D23" 
  caption="A is pinned before the later edge splits. Its new intermediate ancestors inherit protection. Gold edges/circles carry positive path counts; only unpinned leaves can be removed. The endpoint handle remains attached to A's original node."
>
  <RadixDrawing 
    nodes={result.nodes} 
    label="Pinned radix paths and leaf eviction" 
  />
  <Controls reset={() => {
      setAll(false);
      setCount(0);
    }}>
    <Check 
      label="Also pin B and the third path (all leaves protected)" 
      value={all} 
      onChange={v => {
        setAll(v);
        setCount(0);
      }} 
    />
    <Range 
      label="Eviction attempts" 
      value={count} 
      min={0} 
      max={5} 
      onChange={setCount} 
    />
  </Controls>
  <p>
    {result.removed.length ? `Attempt results: ${result.removed.map(n => n ? `remove n${n.id} edge ${vec(n.edge)}` : 'refused: no unpinned leaf').join('; ')}.` : 'No eviction attempted.'} 
    {all && count > 0 ? ' All-pinned refusal leaves the entire tree unchanged.' : ''}
  </p>
</Figure>;
}
export function PcDepthFirst() {
  const [order, setOrder] = useState('ABC');
  const rows = order === 'ABC' ? [['A', '1–10', 10], ['B', '11,12', 2], ['C', '20–25', 6]] : [['A', '1–10', 10], ['C', '20–25', 6], ['B', '5–8,11,12', 6]];
  return <Figure 
  id="D24" 
  caption="Fixed token-granularity tree; the whole current path fits capacity 10 and requests run to completion. This edge-work argument is not an online queueing guarantee."
>
  <Graph 
    label="Three-leaf prefix tree and shared edge lengths" 
    width={760} 
    height={365}
  >
    <circle 
      cx="370" 
      cy="25" 
      r="12" 
      fill="#aaaebd" 
    />
    <Edge 
      x1={370} 
      y1={38} 
      x2={370} 
      y2={94} 
    />
    <Node 
      x={295} 
      y={95} 
      width={150} 
      label="1,2,3,4" 
      sub="4 rows" 
      tone="#62d7e2" 
    />
    <Edge 
      x1={325} 
      y1={145} 
      x2={210} 
      y2={203} 
    />
    <Edge 
      x1={418} 
      y1={145} 
      x2={600} 
      y2={203} 
    />
    <Node 
      x={135} 
      y={205} 
      width={150} 
      label="5,6,7,8" 
      sub="4 rows" 
      tone="#bb96ff" 
    />
    <Node 
      x={525} 
      y={205} 
      width={150} 
      label="20–25 → C" 
      sub="6 rows" 
      tone="#ffc266" 
    />
    <Edge 
      x1={175} 
      y1={255} 
      x2={95} 
      y2={301} 
    />
    <Edge 
      x1={240} 
      y1={255} 
      x2={330} 
      y2={301} 
    />
    <Node 
      x={20} 
      y={305} 
      width={150} 
      label="9,10 → A" 
      sub="2 rows" 
      tone="#6daeff" 
    />
    <Node 
      x={255} 
      y={305} 
      width={150} 
      label="11,12 → B" 
      sub="2 rows" 
      tone="#ff91b4" 
    />
  </Graph>
  <Controls reset={() => setOrder('ABC')}>
    <Select 
      label="Traversal order" 
      value={order} 
      onChange={setOrder} 
      options={[['ABC', 'Depth first: A → B → C'], ['ACB', 'Interleaved: A → C → B']]} 
    />
  </Controls>
  <Graph 
    label="Current path stack at each completed visit" 
    width={750} 
    height={305}
  >
    {[...order].map((name, i) => {
        const frames = name === 'C' ? ['1–4', '20–25'] : ['1–4', '5–8', name === 'A' ? '9,10' : '11,12'];
        const reused = i === 0 ? 0 : order === 'ABC' && name === 'B' ? 2 : 1;
        return <g key={name}>
      <text 
        x={30 + i * 250} 
        y="25"
      >Visit {i + 1}: {name}</text>
      {frames.map((frame, j) => <Node 
        key={frame} 
        x={20 + i * 250} 
        y={220 - j * 67} 
        width={220} 
        height={55} 
        label={frame} 
        sub={j < reused ? 'retained from previous path' : 'computed for this visit'} 
        tone={j < reused ? '#62d7e2' : '#ffc266'} 
      />)}
      <text 
        x={30 + i * 250} 
        y="298"
      >bottom → earlier prefix</text>
    </g>;
      })}
  </Graph>
  <Table 
    label="Computed edges at each leaf" 
    headers={['Visit', 'New IDs', 'New query rows']} 
    rows={rows} 
  />
  <p>Current path stack follows root → shared four → {order === 'ABC' ? 'shared eight → A, then B; pop to four before C.' : 'A; switching to C discards the A/B-only edge, which B must reconstruct.'} Total new rows: <strong>
      {rows.reduce((n, r) => n + r[2], 0)}
    </strong>.</p>
</Figure>;
}
export function PcWaiting() {
  const [wait, setWait] = useState(20),
    r = route(wait),
    scale = 25;
  return <Figure 
  id="D25" 
  caption="Supplied waiting/service estimates on one arrival-to-finish clock; no measured engine latency is implied. Warm service takes 4 ms, cold waiting takes 2 ms and cold service takes 10 ms."
>
  <Graph 
    label="Aligned worker waiting and service timelines" 
    width={760} 
    height={240}
  >
    
    {[0, 4, 8, 12, 16, 20, 24].map(t => <g key={t}>
      <line 
        x1={130 + t * scale} 
        y1="30" 
        x2={130 + t * scale} 
        y2="205" 
        stroke="#424858" 
      />
      <text 
        x={130 + t * scale} 
        y="228" 
        textAnchor="middle"
      >{t} ms</text>
    </g>)}
    
    {[['Warm', wait, 4, 65, '#62d7e2'], ['Cold', 2, 10, 150, '#ff91b4']].map(([name, w, s, y, tone]) => <g key={name}>
      <text 
        x="8" 
        y={y + 24}
      >
        {name}
      </text>
      <rect 
        x="130" 
        y={y} 
        width={w * scale} 
        height="40" 
        fill="#515666" 
      />
      <rect 
        x={130 + w * scale} 
        y={y} 
        width={s * scale} 
        height="40" 
        fill={`${tone}55`} 
        stroke={tone} 
      />
      <text 
        x={130 + (w + s / 2) * scale} 
        y={y + 25} 
        textAnchor="middle"
      >service {s}</text>
      <text 
        x="130" 
        y={y - 10}
      >wait {w}; finish {w + s} ms</text>
    </g>)}
  
  </Graph>
  <Controls reset={() => setWait(20)}>
    <Range 
      label="Warm waiting time (ms)" 
      value={wait} 
      min={0} 
      max={20} 
      onChange={setWait} 
    />
  </Controls>
  <p>Finish: warm {r.warm} ms; cold {r.cold} ms. Choice: <strong>
      {r.choice}
    </strong>. The tie occurs at 8 ms of warm waiting.</p>
</Figure>;
}
export function PcProviders() {
  return <Figure 
  id="D26" 
  caption="These are request/lifetime contracts, not observed remote responses or physical cache-page layouts. Names and usage fields belong to the source-checked API routes in the adjacent program; model-specific eligibility and minimum sizes still apply."
>
  <Graph 
    label="Document and question placement in three provider cache contracts" 
    width={800} 
    height={590}
  >
    
    <text 
      x="10" 
      y="25"
    >Implicit repeated prefix (where the model/API supports it)</text>
    <Node 
      x={10} 
      y={40} 
      width={235} 
      label="stable document D" 
      tone="#62d7e2" 
    />
    <Node 
      x={255} 
      y={40} 
      width={160} 
      label="question Q₁" 
      tone="#ff91b4" 
    />
    <Edge 
      x1={425} 
      y1={64} 
      x2={480} 
      y2={64} 
    />
    <Node 
      x={490} 
      y={40} 
      width={280} 
      label="matching eligible prefix" 
      sub="inspect reported cached usage" 
    />
    
    <text 
      x="10" 
      y="140"
    >Explicit breakpoint</text>
    <Node 
      x={10} 
      y={155} 
      width={235} 
      label="stable document D" 
      tone="#62d7e2" 
    />
    <line 
      x1="252" 
      y1="150" 
      x2="252" 
      y2="215" 
      stroke="#ffc266" 
      strokeWidth="4" 
    />
    <Node 
      x={270} 
      y={155} 
      width={160} 
      label="question Q₂" 
      tone="#ff91b4" 
    />
    <text 
      x="10" 
      y="242"
    >D ends at cache_control or prompt_cache_breakpoint; Q changes after it.</text>
    
    <text 
      x="10" 
      y="300"
    >Named resource: document is created separately</text>
    <Node 
      x={10} 
      y={320} 
      width={165} 
      label="document D" 
      tone="#62d7e2" 
    />
    <Edge 
      x1={177} 
      y1={344} 
      x2={263} 
      y2={344} 
      label="create" 
    />
    <Node 
      x={270} 
      y={320} 
      width={215} 
      label="resource name + TTL" 
      tone="#ffc266" 
    />
    <Edge 
      x1={486} 
      y1={344} 
      x2={564} 
      y2={344} 
      label="use" 
    />
    <Node 
      x={575} 
      y={320} 
      width={210} 
      label="name + question Q" 
      tone="#ff91b4" 
    />
    
    <Edge 
      x1={375} 
      y1={370} 
      x2={375} 
      y2={428} 
    />
    <text 
      x="375" 
      y="457" 
      textAnchor="middle"
    >get metadata · update TTL · delete</text>
    
    <line 
      x1="50" 
      y1="515" 
      x2="750" 
      y2="515" 
      stroke="#aaaebd" 
    />
    <circle 
      cx="50" 
      cy="515" 
      r="5" 
      fill="#62d7e2" 
    />
    <circle 
      cx="673" 
      cy="515" 
      r="5" 
      fill="#62d7e2" 
    />
    <line 
      x1="680" 
      y1="490" 
      x2="680" 
      y2="535" 
      stroke="#ff91b4" 
      strokeWidth="3" 
    />
    <text 
      x="50" 
      y="560"
    >create 0 s</text>
    <text 
      x="630" 
      y="484"
    >89: eligible</text>
    <text 
      x="680" 
      y="560" 
      textAnchor="middle"
    >90: expired</text>
  
  </Graph>
  <Table 
    label="Read the actual usage field rather than assuming a hit" 
    headers={['Route', 'Usage meaning']} 
    rows={[['Claude', 'cache_creation_input_tokens versus cache_read_input_tokens'], ['OpenAI Responses', 'input_tokens_details.cached_tokens; compare input and output usage separately'], ['Gemini', 'cached_content_token_count within usage_metadata; named resource has its own lifetime']]} 
  />
  <p>The 90-second timeline is a supplied exclusive-expiry example. The complete optional Google program instead creates a 300-second resource, later updates to 600 seconds, and deletes it in cleanup.</p>
</Figure>;
}
export function PcCost() {
  const [hits, setHits] = useState(1),
    [storage, setStorage] = useState(0),
    c = costs(hits, storage),
    x = n => 65 + n * 62,
    y = v => 345 - v * 21;
  return <Figure 
  id="D27" 
  caption="Illustrative cost units: initial cached write 1.25, each cache read 0.10, ordinary request 1.00. Storage is one additional total charge. These are not provider prices."
>
  <Graph 
    label="Cumulative ordinary versus cached charges" 
    width={760} 
    height={430}
  >
    
    {[0, 5, 10, 15].map(v => <g key={v}>
      <line 
        x1="65" 
        x2="700" 
        y1={y(v)} 
        y2={y(v)} 
        stroke="#454b58" 
      />
      <text 
        x="48" 
        y={y(v) + 5} 
        textAnchor="end"
      >
        {v}
      </text>
    </g>)}
    
    {Array.from({
        length: 11
      }, (_, n) => <text 
      key={n} 
      x={x(n)} 
      y="370" 
      textAnchor="middle"
    >
      {n}
    </text>)}
    
    <polyline 
      points={Array.from({
        length: 11
      }, (_, n) => `${x(n)},${y(costs(n, storage).normal)}`).join(' ')} 
      fill="none" 
      stroke="#ff91b4" 
      strokeWidth="3" 
    />
    
    <polyline 
      points={Array.from({
        length: 11
      }, (_, n) => `${x(n)},${y(costs(n, storage).cached)}`).join(' ')} 
      fill="none" 
      stroke="#62d7e2" 
      strokeWidth="3" 
    />
    
    {[['cached', c.cached, '#62d7e2'], ['ordinary', c.normal, '#ff91b4']].map(([name, v, tone]) => <g key={name}>
      <circle 
        cx={x(hits)} 
        cy={y(v)} 
        r="6" 
        fill={tone} 
        stroke="white" 
      />
      <text 
        x={name === 'cached' ? 85 : 420} 
        y="400" 
        fill={tone}
      >{name}: {fmt(v)} units</text>
    </g>)}
    
    <text 
      x="75" 
      y="20"
    >Total cost units</text>
    <text 
      x="635" 
      y="420"
    >Later hit count</text>
  
  </Graph>
  <Controls reset={() => {
      setHits(1);
      setStorage(0);
    }}>
    <Range 
      label="Later hits" 
      value={hits} 
      min={0} 
      max={10} 
      onChange={setHits} 
    />
    <Range 
      label="Total storage charge (cents)" 
      value={storage} 
      min={0} 
      max={300} 
      step={5} 
      onChange={setStorage} 
    />
  </Controls>
  <Table 
    label="Charge decomposition and integer thresholds" 
    headers={['Quantity', 'Value']} 
    rows={[['Cached write / reads / storage', `1.25 + ${fmt(hits * .1)} + ${fmt(storage / 100)}`], ['Saving', c.saving], ['First tie-or-better hit count', c.tieOrBetter], ['First strictly cheaper hit count', c.strict]]} 
  />
</Figure>;
}
export function PcSession() {
  const {
      data,
      error,
      retry
    } = useObservations(),
    [step, setStep] = useState(7),
    [policy, setPolicy] = useState('lru');
  if (!data) return <Figure 
  id="D28" 
  caption="Saved ended-hot-session workload."
>
  <Status 
    error={error} 
    retry={retry} 
  />
</Figure>;
  const ended = data.finite.prefix_workload.ended_session,
    run = ended[policy],
    admissions = run.events.filter(e => e.event === 'admit'),
    e = admissions[step],
    labels = ['A', 'A', 'A', 'A', 'A', 'B', 'C', 'B'];
  return <Figure 
  id="D28" 
  caption="The actual finite eight-request trace uses three pages. Each five-token request needs a four-token prefix page and a final-query page. A's historical popularity outlives its session; this is a counterexample, not a universal policy ranking."
>
  <Graph 
    label="Eight sequential requests and the selected admission" 
    width={740} 
    height={130}
  >
    {labels.map((name, i) => <g key={i}>
      <Node 
        x={10 + i * 90} 
        y={25} 
        width={78} 
        height={60} 
        label={name} 
        sub={`request ${i}`} 
        tone={{
          A: '#6daeff',
          B: '#ff91b4',
          C: '#ffc266'
        }[name]} 
        selected={i === step} 
      />
      {i < 7 && <Edge 
        x1={89 + i * 90} 
        y1={55} 
        x2={99 + i * 90} 
        y2={55} 
      />}
    </g>)}
  </Graph>
  <Controls reset={() => {
      setStep(7);
      setPolicy('lru');
    }}>
    <Select 
      label="Saved eviction policy" 
      value={policy} 
      onChange={setPolicy} 
      options={[['lru', 'Inactive LRU'], ['frequency', 'Historical frequency']]} 
    />
    <Range 
      label="Request index" 
      value={step} 
      min={0} 
      max={7} 
      onChange={setStep} 
    />
  </Controls>
  <Pool 
    state={e.state} 
    label={`Actual ${policy} state after ${labels[step]} admission`} 
  />
  <Table 
    label="Matched work and victim IDs" 
    headers={['Quantity', 'Saved value']} 
    rows={[['Matched physical pages', vec(e.decision.matched)], ['Evicted physical pages', vec(e.decision.evicted)], ['Reused rows on this request', e.decision.reused_rows], ['New query rows', e.decision.new_query_rows], ['All-eight reused / requested rows', `${run.reused_tokens} / ${run.requested_tokens}`]]} 
  />
  <p>Last B: LRU reuses {ended.lru.events.filter(x => x.event === 'admit')[7].decision.reused_rows} rows; frequency reuses {ended.frequency.events.filter(x => x.event === 'admit')[7].decision.reused_rows}. Historical frequency retains A's old prefix, whereas LRU's newer B prefix survives C.</p>
</Figure>;
}
export function PcTrust() {
  const [isolated, setIsolated] = useState(true);
  return <Figure 
  id="D29" 
  caption="Numerical correctness and information exposure are separate paths. Namespace isolation prevents this cross-group sharing edge; it does not prove every other service security property. The hit/timing path is a conceptual observation channel, not an attack performed here."
>
  <Graph 
    label="Two trust groups, a correct-output path and a cache observation path" 
    width={790} 
    height={445}
  >
    
    <rect 
      x="15" 
      y="35" 
      width="345" 
      height="215" 
      fill="none" 
      stroke="#6daeff" 
      strokeDasharray="6 4" 
    />
    <rect 
      x="420" 
      y="35" 
      width="345" 
      height="215" 
      fill="none" 
      stroke="#ff91b4" 
      strokeDasharray="6 4" 
    />
    
    <text 
      x="30" 
      y="24" 
      fill="#6daeff"
    >Trust group A</text>
    <text 
      x="435" 
      y="24" 
      fill="#ff91b4"
    >Trust group B</text>
    
    <Node 
      x={40} 
      y={60} 
      width={295} 
      label="public document + A question" 
      tone="#6daeff" 
    />
    <Node 
      x={445} 
      y={60} 
      width={295} 
      label="same document + B question" 
      tone="#ff91b4" 
    />
    
    <Edge 
      x1={187} 
      y1={110} 
      x2={187} 
      y2={169} 
    />
    <Edge 
      x1={592} 
      y1={110} 
      x2={592} 
      y2={169} 
    />
    
    <Node 
      x={75} 
      y={170} 
      width={225} 
      label={isolated ? 'namespace A prefix' : 'shared compatible prefix'} 
      tone="#62d7e2" 
    />
    <Node 
      x={480} 
      y={170} 
      width={225} 
      label={isolated ? 'namespace B prefix' : 'shared compatible prefix'} 
      tone="#62d7e2" 
    />
    
    <Edge 
      x1={300} 
      y1={194} 
      x2={480} 
      y2={194} 
      dashed 
      tone={isolated ? '#969cac' : '#ffc266'} 
    />
    <text 
      x="390" 
      y="168" 
      textAnchor="middle"
    >
      {isolated ? 'sharing blocked' : 'sharing allowed'}
    </text>
    {isolated && <path 
      d="M380 184l20 20m0-20l-20 20" 
      stroke="#ff91b4" 
      strokeWidth="3" 
    />}
    
    <Edge 
      x1={592} 
      y1={220} 
      x2={592} 
      y2={305} 
      tone="#6daeff" 
    />
    <Node 
      x={480} 
      y={310} 
      width={225} 
      label="correct B output" 
      tone="#6daeff" 
    />
    
    <Edge 
      x1={187} 
      y1={220} 
      x2={187} 
      y2={305} 
      dashed 
      tone="#ffc266" 
    />
    <Node 
      x={50} 
      y={310} 
      width={285} 
      label="hit / timing / usage observer" 
      sub={isolated ? 'no cross-group reuse in this model' : 'may distinguish another group’s reuse'} 
      tone="#ffc266" 
    />
    
    <text 
      x="40" 
      y="410"
    >Correct output alone says nothing about whether reuse is distinguishable.</text>
  
  </Graph>
  <Controls reset={() => setIsolated(true)}>
    <Check 
      label="Isolate the two trust namespaces" 
      value={isolated} 
      onChange={setIsolated} 
    />
  </Controls>
</Figure>;
}
