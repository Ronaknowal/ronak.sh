import { useState } from 'react';
import { color, requests, common, eligible, namespace, compatible, work } from '../../data/prefix-caching-models.js';
import { Figure, Controls, Range, Select, Check, Graph, Edge, Node, Tokens, Table, Pair, vec } from './PrefixCachingShared.jsx';
export function PcTensors() {
  const [head, setHead] = useState(0);
  return <Figure 
  id="D01" 
  caption="Each layer has its own K and V. The selected head's query at position 8 reads rows 0–8; only row 8 is new. Two representative feature columns are drawn, not two token positions."
>
    
  <Graph 
    label="Two layers of keys and values, position rows versus feature columns" 
    width={850} 
    height={805}
  >
      
    {[0, 1].map(layer => <g 
      key={layer} 
      transform={`translate(0 ${layer * 390 + 75})`}
    >
        
      <text 
        x="12" 
        y="-60"
      >Layer {layer} · KV head {head} of 2</text>
        
      {[['K', 115], ['V', 345]].map(([name, x]) => <g key={name}>
        <text 
          x={x + 58} 
          y="22" 
          textAnchor="middle"
        >{name} feature columns</text>
        {[0, 1].map(f => <text 
          key={f} 
          x={x + f * 63 + 29} 
          y="44" 
          textAnchor="middle"
        >f{f}</text>)}
          
        {Array.from({
            length: 9
          }, (_, p) => <g key={p}>
          <text 
            x={x - 12} 
            y={68 + p * 24} 
            textAnchor="end"
          >pos {p}</text>
          {[0, 1].map(f => <g key={f}>
            <rect 
              x={x + f * 63} 
              y={51 + p * 24} 
              width="60" 
              height="23" 
              fill={`${color(p + 1)}22`} 
              stroke={p === 8 ? 'white' : color(p + 1)} 
              strokeWidth={p === 8 ? 2 : 1} 
            />
            <text 
              x={x + f * 63 + 30} 
              y={68 + p * 24} 
              textAnchor="middle" 
              fill={color(p + 1)}
            >{name.toLowerCase()}{p},{f}</text>
          </g>)}
        </g>)}
        
      </g>)}
        
      <Node 
        x={590} 
        y={5} 
        width={240} 
        label={`query q8 · layer ${layer}`} 
        sub="head-specific vector" 
      />
        
      <path 
        d="M650 5V-35H175V-5" 
        fill="none" 
        stroke="#6daeff" 
        strokeWidth="2" 
      />
      <Edge 
        x1={175} 
        y1={-6} 
        x2={175} 
        y2={7} 
        tone="#6daeff" 
      />
        
      <text 
        x="405" 
        y="-45" 
        textAnchor="middle" 
        fill="#6daeff"
      >scores against retained and new K rows</text>
        
      <path 
        d="M810 55V180H490" 
        fill="none" 
        stroke="#ff91b4" 
        strokeWidth="2" 
      />
      <Edge 
        x1={492} 
        y1={180} 
        x2={478} 
        y2={180} 
        tone="#ff91b4" 
      />
        
      <text 
        x="590" 
        y="155" 
        fill="#ff91b4"
      >weights combine V rows</text>
        
      <text 
        x="560" 
        y="245"
      >old rows 0–7 retained</text>
      <text 
        x="560" 
        y="270"
      >white row 8: write</text>
        
      <text 
        x="115" 
        y="290"
      >Shape per layer: [batch 1, heads 2, positions 9, features d]</text>
      
    </g>)}
    
  </Graph>
  <Controls reset={() => setHead(0)}>
    <Select 
      label="Inspect KV head" 
      value={String(head)} 
      options={[[0, 'Head 0'], [1, 'Head 1']]} 
      onChange={v => setHead(Number(v))} 
    />
  </Controls>
  
</Figure>;
}
export function AliasGraph({
  a,
  b,
  pages,
  label = 'Logical request tables and shared physical K/V pages'
}) {
  const second = 65 + a.length * 55 + 55;
  const height = Math.max(second + b.length * 55 + 30, pages.length * 68 + 45);
  return <Graph 
  label={label} 
  width={750} 
  height={height}
>
    
  <text 
    x="10" 
    y="20"
  >Logical references</text>
  <text 
    x="425" 
    y="20"
  >Physical page contents (token IDs)</text>
    
  {[['A', a, 65, '#6daeff'], ['B', b, second, '#ff91b4']].map(([name, table, y, tone]) => <g key={name}>
      
    <text 
      x="10" 
      y={y - 15} 
      fill={tone}
    >Request {name}</text>
      
    {table.map((n, i) => <g key={i}>
      <Node 
        x={10} 
        y={y + i * 55} 
        width={170} 
        height={40} 
        label={`slot ${i} → p${n}`} 
        tone={tone} 
      />
      <Edge 
        x1={182} 
        y1={y + i * 55 + 20} 
        x2={415} 
        y2={64 + pages.findIndex(p => p.id === n) * 68} 
        tone={tone} 
      />
    </g>)}
    
  </g>)}
    
  {pages.map((p, i) => <g key={p.id}>
    <text 
      x="425" 
      y={39 + i * 68}
    >p{p.id} · {p.shared ? 'shared A+B' : 'private ' + p.owner}</text>
    {Array.from({
        length: 4
      }, (_, j) => {
        const t = p.tokens[j];
        return <g key={j}>
      <rect 
        x={425 + j * 67} 
        y={44 + i * 68} 
        width="64" 
        height="35" 
        fill={t === undefined ? '#222630' : `${color(t)}22`} 
        stroke={t === undefined ? '#7c8495' : color(t)} 
        strokeDasharray={t === undefined ? '3 3' : undefined} 
      />
      <text 
        x={457 + j * 67} 
        y={67 + i * 68} 
        textAnchor="middle" 
        fill={t === undefined ? '#bfc4d0' : color(t)}
      >
        {t ?? '—'}
      </text>
    </g>;
      })}
  </g>)}
  
</Graph>;
}
export function PcAliasing() {
  const [edited, setEdited] = useState(false);
  const b = [...requests.B];
  if (edited) b[5] = 20;
  const shared = eligible(common(requests.A, b) + 1, 4) / 4;
  const pages = [{
    id: 0,
    tokens: requests.A.slice(0, 4),
    shared: true
  }, {
    id: 1,
    tokens: requests.A.slice(4, 8),
    shared: shared === 2,
    owner: 'A'
  }, {
    id: 2,
    tokens: requests.A.slice(8),
    owner: 'A'
  }];
  const bt = [0];
  if (shared === 1) {
    pages.push({
      id: 3,
      tokens: b.slice(4, 8),
      owner: 'B'
    });
    bt.push(3);
    pages.push({
      id: 4,
      tokens: b.slice(8),
      owner: 'B'
    });
    bt.push(4);
  } else {
    pages.push({
      id: 3,
      tokens: b.slice(8),
      owner: 'B'
    });
    bt.push(1, 3);
  }
  return <Figure 
  id="D02" 
  caption="Arrows are references, not copies. Blue and rose identify requests; token colours follow contents. Shared pages represent both requests' compatible full prefixes."
>
  <AliasGraph 
    a={[0, 1, 2]} 
    b={bt} 
    pages={pages} 
  />
  <Controls reset={() => setEdited(false)}>
    <Check 
      label="Change B's ID at position 5 from 6 to 20" 
      value={edited} 
      onChange={setEdited} 
    />
  </Controls>
  <p>Common rows: {common(requests.A, b)}. Shared full pages: {shared}. Six logical references occupy {pages.length} physical pages.</p>
</Figure>;
}
export function PcCausal() {
  const [edit, setEdit] = useState(8);
  const old = 3;
  return <Figure 
  id="D03" 
  caption="The white outlines are ancestors of layer 3, position 3. Pink corners mark rows that can change after the edited input. A future edit cannot enter this old row's ancestor cone."
>
    
  <Graph 
    label="Layer-by-position causal ancestors" 
    width={730} 
    height={270}
  >
      
    {Array.from({
        length: 10
      }, (_, p) => <text 
      key={p} 
      x={129 + p * 58} 
      y="24" 
      textAnchor="middle"
    >p{p}</text>)}
      
    {[0, 1, 2, 3].map(l => <g key={l}>
      <text 
        x="4" 
        y={70 + l * 51}
      >
        {l === 0 ? 'embeddings' : `layer ${l}`}
      </text>
      {Array.from({
          length: 10
        }, (_, p) => {
          const cone = l === 3 ? p === old : p <= old,
            affected = l === 0 ? p === edit : p >= edit;
          return <g key={p}>
        <rect 
          x={104 + p * 58} 
          y={42 + l * 51} 
          width="50" 
          height="39" 
          fill={`${color(p + 1)}25`} 
          stroke={cone ? 'white' : color(p + 1)} 
          strokeWidth={cone ? 3 : 1} 
        />
        <text 
          x={129 + p * 58} 
          y={66 + l * 51} 
          textAnchor="middle" 
          fill={color(p + 1)}
        >h{l},{p}</text>
        {affected && <path 
          d={`M${140 + p * 58} ${45 + l * 51}h10v10`} 
          stroke="#ff91b4" 
          fill="none" 
          strokeWidth="4" 
        />}
      </g>;
        })}
    </g>)}
    
  </Graph>
  <Controls reset={() => setEdit(8)}>
    <Select 
      label="Edited token position" 
      value={String(edit)} 
      options={[[8, 'Future position 8'], [1, 'Earlier position 1']]} 
      onChange={v => setEdit(Number(v))} 
    />
  </Controls>
  <p>Layer 3, position 3 {edit > 3 ? 'is unchanged: the edit is outside its causal past.' : 'may change: the edited position is in its causal past.'}</p>
  
</Figure>;
}
export function PcEdit() {
  const [position, setPosition] = useState(5),
    [value, setValue] = useState(6),
    [draft, setDraft] = useState('6'),
    [error, setError] = useState('');
  const b = [...requests.B];
  b[position] = value;
  const prefix = common(requests.A, b),
    rows = Math.min(eligible(b.length), 4 * Math.floor(prefix / 4));
  const change = v => {
    setDraft(v);
    if (!/^\d+$/.test(v) || Number(v) >= 2 ** 32) {
      setError('Enter an integer from 0 to 4294967295; last valid state is retained.');
      return;
    }
    setError('');
    setValue(Number(v));
  };
  return <Figure 
  id="D04" 
  caption="The first unequal effective input invalidates that row and all later dependent rows. Hatched positions are outside the common prefix; only complete four-row pages can be reused."
>
  <Pair>
    <Tokens 
      items={requests.A} 
      label="A's effective IDs" 
      mutedFrom={prefix} 
    />
    <Tokens 
      items={b} 
      label="B's effective IDs" 
      selected={position} 
      mutedFrom={prefix} 
    />
  </Pair>
  <Controls reset={() => {
      setPosition(5);
      setValue(6);
      setDraft('6');
      setError('');
    }}>
    <Range 
      label="B token position" 
      value={position} 
      min={0} 
      max={9} 
      onChange={p => {
        setPosition(p);
        setValue(requests.B[p]);
        setDraft(String(requests.B[p]));
        setError('');
      }} 
    />
    <label>Replacement token ID<input 
        type="text" 
        inputMode="numeric" 
        value={draft} 
        onChange={e => change(e.target.value)} 
      /></label>
  </Controls>
  {error && <p role="alert">
    {error}
  </p>}
  <p>First mismatch: position {prefix}. Common rows {prefix}; eligible full reusable rows {rows}. Later block identities depend on this earlier boundary.</p>
</Figure>;
}
export function PcNamespace() {
  const [adapter, setAdapter] = useState('none'),
    [positions, setPositions] = useState('absolute'),
    [trust, setTrust] = useState('demo');
  const b = {
      ...namespace,
      adapter,
      positions,
      trust
    },
    difference = compatible(namespace, b);
  return <Figure 
  id="D05" 
  caption="A namespace describes effective computation and sharing policy. An adapter or position-policy mismatch can change numbers; a trust-group mismatch forbids sharing independently of numeric equality."
>
  <Table 
    label="Exact namespace fields" 
    headers={['Field', 'A', 'B', 'Decision']} 
    rows={Object.keys(namespace).map(k => [k, namespace[k], b[k], namespace[k] === b[k] ? 'equal' : 'mismatch'])} 
  />
  <Controls reset={() => {
      setAdapter('none');
      setPositions('absolute');
      setTrust('demo');
    }}>
    <Select 
      label="B adapter" 
      value={adapter} 
      onChange={setAdapter} 
      options={['none', 'adapter-v2'].map(x => [x, x])} 
    />
    <Select 
      label="B position policy" 
      value={positions} 
      onChange={setPositions} 
      options={['absolute', 'offset-8'].map(x => [x, x])} 
    />
    <Select 
      label="B trust group" 
      value={trust} 
      onChange={setTrust} 
      options={['demo', 'isolated'].map(x => [x, x])} 
    />
  </Controls>
  <p>
    {difference ? `Reuse refused: first unequal field is ${difference}.` : 'All declared fields agree; token identity and residency still need checking.'}
  </p>
</Figure>;
}
export function PcBoundary() {
  const [length, setLength] = useState(10);
  const retained = eligible(length),
    blocks = Math.ceil(length / 4);
  return <Figure 
  id="D06" 
  caption="Only full blocks before the required final query are eligible. At a multiple of four, the last full block is recomputed under this KV-only policy."
>
  <Graph 
    label="Full cache pages and last-query boundary" 
    width={730} 
    height={205}
  >
    {Array.from({
        length: blocks
      }, (_, b) => <g key={b}>
      <text 
        x={20 + b * 142} 
        y="30"
      >block {b}</text>
      {[0, 1, 2, 3].map(j => {
          const p = b * 4 + j,
            exists = p < length;
          return <g key={j}>
        <rect 
          x={20 + b * 142 + j * 30} 
          y="48" 
          width="28" 
          height="46" 
          fill={p < retained ? '#62d7e233' : '#292c37'} 
          stroke={p === length - 1 ? 'white' : exists ? color(p + 1) : '#626777'} 
          strokeDasharray={!exists ? '3 3' : undefined} 
          strokeWidth={p === length - 1 ? 3 : 1} 
        />
        <text 
          x={34 + b * 142 + j * 30} 
          y="77" 
          textAnchor="middle"
        >
          {exists ? p : '—'}
        </text>
      </g>;
        })}
      <text 
        x={20 + b * 142} 
        y="121"
      >
        {b * 4 < retained ? 'reuse full block' : 'compute block'}
      </text>
    </g>)}
    <text 
      x="20" 
      y="165"
    >White outlined position {length - 1}: required query for the output logits</text>
  </Graph>
  <Controls reset={() => setLength(10)}>
    <Range 
      label="Prompt rows L" 
      value={length} 
      min={1} 
      max={20} 
      onChange={setLength} 
    />
  </Controls>
  <p>{retained} reusable rows; {length - retained} newly computed query rows. Page size remains 4.</p>
</Figure>;
}
export function PcResident() {
  const [missing, setMissing] = useState(true);
  const boundary = missing ? 1 : 4;
  return <Figure 
  id="D07" 
  caption="A read-only lookup follows consecutive parent identities. An isolated later block cannot supply the missing earlier K/V rows."
>
  <Graph 
    label="Resident hash chain with lookup stopping at a miss" 
    width={720} 
    height={185}
  >
    {[0, 1, 2, 3].map(i => <g key={i}>
      <Node 
        x={15 + i * 176} 
        y={40} 
        width={145} 
        height={70} 
        label={`block ${i}: h${i}`} 
        sub={i === 1 && missing ? 'absent' : 'resident'} 
        tone={color(i + 1)} 
        dashed={i === 1 && missing} 
        selected={i < boundary} 
      />
      {i < 3 && <Edge 
        x1={160 + i * 176} 
        y1={75} 
        x2={191 + i * 176} 
        y2={75} 
        dashed={i >= boundary - 1 && missing} 
      />}
      <text 
        x={15 + i * 176} 
        y="140"
      >
        {i < boundary ? '✓ reusable' : i === boundary ? '× first miss' : 'not reached'}
      </text>
    </g>)}
  </Graph>
  <Controls reset={() => setMissing(true)}>
    <Check 
      label="Second prefix block is absent" 
      value={missing} 
      onChange={setMissing} 
    />
  </Controls>
  <p>In a 17-row prompt, eligible blocks 0–3 exist by length. Lookup returns {boundary} consecutive blocks = {boundary * 4} reusable rows.</p>
</Figure>;
}
export function PcPairs() {
  const [length, setLength] = useState(10),
    [prefix, setPrefix] = useState(8);
  const w = work(length, prefix);
  return <Figure 
  id="D08" 
  caption="Every filled cell is one causal query/key pair. Faint cells belong to avoided old queries; blue cells are new queries reading old keys; rose cells form the new tail's triangle. Blank future cells are masked."
>
  <Graph 
    label="Causal attention pairs, retained prefix and live suffix" 
    width={700} 
    height={80 + length * 29}
  >
    <text 
      x="85" 
      y="19"
    >Key positions →</text>
    {Array.from({
        length: length
      }, (_, k) => <text 
      x={95 + k * 32} 
      y="43" 
      key={k} 
      textAnchor="middle"
    >
      {k}
    </text>)}
    {Array.from({
        length: length
      }, (_, q) => <g key={q}>
      <text 
        x="62" 
        y={69 + q * 29} 
        textAnchor="end"
      >q{q}</text>
      {Array.from({
          length: length
        }, (_, k) => {
          const type = k > q ? 'future' : q < prefix ? 'avoided' : k < prefix ? 'read' : 'tail';
          return <g key={k}>
        <rect 
          x={80 + k * 32} 
          y={49 + q * 29} 
          width="30" 
          height="27" 
          fill={type === 'avoided' ? '#343946' : type === 'read' ? '#6daeff55' : type === 'tail' ? '#ff91b455' : '#191b22'} 
          stroke={type === 'read' ? '#6daeff' : type === 'tail' ? '#ff91b4' : '#535967'} 
          strokeDasharray={type === 'avoided' ? '2 3' : undefined} 
        />
        {type !== 'future' && <text 
          x={95 + k * 32} 
          y={69 + q * 29} 
          textAnchor="middle"
        >
          {type === 'avoided' ? '·' : '1'}
        </text>}
      </g>;
        })}
    </g>)}
  </Graph>
  <Controls reset={() => {
      setLength(10);
      setPrefix(8);
    }}>
    <Range 
      label="Prompt length L" 
      value={length} 
      min={4} 
      max={16} 
      onChange={n => {
        setLength(n);
        setPrefix(p => Math.min(p, n - 1));
      }} 
    />
    <Range 
      label="Retained rows P" 
      value={prefix} 
      min={0} 
      max={length - 1} 
      onChange={setPrefix} 
    />
  </Controls>
  <p>{w.full} full pairs − {w.avoided} avoided = {w.remaining} remaining = {w.rectangle} prefix reads + {w.tail} tail pairs.</p>
</Figure>;
}
export function PcUnits() {
  return <Figure 
  id="D09" 
  caption="These two views count different objects. Two new query rows still require nineteen query/key pairs; neither count is a measured duration."
>
  <Graph 
    label="Two query vectors and their nine plus ten key reads" 
    width={720} 
    height={235}
  >
    {[8, 9].map((q, row) => <g key={q}>
      <Node 
        x={10} 
        y={45 + row * 90} 
        width={100} 
        height={46} 
        label={`new q${q}`} 
        tone={row ? '#ff91b4' : '#6daeff'} 
      />
      <Edge 
        x1={111} 
        y1={68 + row * 90} 
        x2={178} 
        y2={68 + row * 90} 
        label="reads" 
      />
      {Array.from({
          length: q + 1
        }, (_, k) => <g key={k}>
        <rect 
          x={183 + k * 49} 
          y={45 + row * 90} 
          width="45" 
          height="46" 
          fill={`${color(k + 1)}22`} 
          stroke={color(k + 1)} 
        />
        <text 
          x={205 + k * 49} 
          y={74 + row * 90} 
          textAnchor="middle"
        >k{k}</text>
      </g>)}
    </g>)}
    <text 
      x="12" 
      y="220"
    >2 query rows</text>
    <text 
      x="185" 
      y="220"
    >9 + 10 = 19 query/key pairs</text>
  </Graph>
</Figure>;
}
