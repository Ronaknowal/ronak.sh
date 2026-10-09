import { useState } from 'react';
import { color } from '../../data/prefix-caching-models.js';
import { Figure, Graph, Edge, Node, Controls, Select, Stepper, Table, Tokens, useObservations, Status, vec, fmt } from './PrefixCachingShared.jsx';
export function PcSnapshot() {
  return <Figure 
  id="D19" 
  caption="Schematic occupied-position view of the executed TinyLM snapshot: each drawn position represents K and V across two layers/four heads/four features. Only eight occupied rows are copied (4096 bytes); each branch reserves capacity twenty (10240 bytes). Symbols show identity and extent, not invented tensor values."
>
  <Graph 
    label="Retained prefix copied into two capacity-backed K/V arrays" 
    width={760} 
    height={680}
  >
    
    <Node 
      x={30} 
      y={15} 
      width={200} 
      height={55} 
      label="base: length 8" 
      sub="unchanged occupied prefix" 
      tone="#62d7e2" 
    />
    
    <Node 
      x={300} 
      y={15} 
      width={190} 
      height={55} 
      label="branch A: length 12" 
      sub="same-weight tail 9–12" 
      tone="#6daeff" 
    />
    
    <Node 
      x={545} 
      y={15} 
      width={195} 
      height={55} 
      label="branch B: length 12" 
      sub="same-weight tail 13–16" 
      tone="#ff91b4" 
    />
    
    <Edge 
      x1={230} 
      y1={42} 
      x2={300} 
      y2={42} 
      label="copy" 
      tone="#62d7e2" 
    />
    
    {[30, 300, 545].map((x, column) => <g key={x}>
      <text 
        x={x} 
        y="100"
      >position · K / V vectors</text>
      {Array.from({
          length: column === 0 ? 8 : 20
        }, (_, p) => {
          const occupied = column === 0 || p < 12,
            tone = p < 8 ? color(p + 1) : column === 1 ? '#6daeff' : '#ff91b4';
          return <g key={p}>
        <text 
          x={x + 18} 
          y={128 + p * 22} 
          textAnchor="end"
        >
          {p}
        </text>
        {['K', 'V'].map((name, f) => <g key={name}>
          <rect 
            x={x + 28 + f * 78} 
            y={112 + p * 22} 
            width="75" 
            height="21" 
            fill={occupied ? `${tone}22` : '#222630'} 
            stroke={occupied ? tone : '#575e6d'} 
            strokeDasharray={!occupied ? '3 3' : undefined} 
          />
          <text 
            x={x + 65 + f * 78} 
            y={128 + p * 22} 
            textAnchor="middle"
          >
            {occupied ? `${name}[${p},:]` : 'unused'}
          </text>
        </g>)}
      </g>;
        })}
    </g>)}
    
    <path 
      d="M130 300V610H525V42H545" 
      fill="none" 
      stroke="#62d7e2" 
      strokeWidth="2" 
    />
    <Edge 
      x1={525} 
      y1={42} 
      x2={545} 
      y2={42} 
      tone="#62d7e2" 
    />
    
    <text 
      x="140" 
      y="590" 
      fill="#62d7e2"
    >copy occupied 0–7 to B</text>
    
    <text 
      x="30" 
      y="655"
    >Rows 8–11 are new suffix work. Dashed rows 12–19 are capacity, not valid history.</text>
  
  </Graph>
</Figure>;
}
export function PcNative() {
  const {
      data,
      error,
      retry
    } = useObservations(),
    [caseId, setCase] = useState('0');
  if (!data) return <Figure 
  id="D20" 
  caption="The recorded four-case CPU comparison."
>
  <Status 
    error={error} 
    retry={retry} 
  />
</Figure>;
  const row = data.native.cases[Number(caseId)],
    c = row.comparison;
  return <Figure 
  id="D20" 
  caption="These are the saved Pythia-14m FP64/eager results, not a browser model run. Each branch copies DynamicCache; equal logits within the criterion do not establish zero-copy storage or speed."
>
  <Tokens 
    items={row.prefix_ids} 
    label={`Actual prefix IDs (${row.prefix_length} rows)`} 
  />
  <Tokens 
    items={row.tail_ids} 
    label={`Actual tail ${row.tail_index} IDs`} 
    offset={row.prefix_length} 
  />
  <Controls reset={() => setCase('0')}>
    <Select 
      label="Saved native comparison" 
      value={caseId} 
      onChange={setCase} 
      options={data.native.cases.map((r, i) => [String(i), `Prefix ${r.prefix_length}, tail ${r.tail_index}`])} 
    />
  </Controls>
  <Table 
    label="All-tail numerical and memory evidence" 
    headers={['Quantity', 'Recorded value']} 
    rows={[['Compared logits', c.compared_elements], ['Maximum absolute error', c.max_absolute_error], ['Absolute / relative tolerance', `${c.atol} / ${c.rtol}`], ['Tolerance failures', c.mismatched_elements], ['Top-1 IDs agree', c.top1_matches ? 'yes' : 'no'], ['Base prefix unchanged', row.base_unchanged ? 'yes' : 'no'], ['Independent branch storage', row.independent_branch_storage ? 'yes (copies)' : 'no'], ['Copied prefix bytes', row.copied_prefix_bytes], ['Branch occupied/backing bytes', `${row.branch.occupied_bytes} / ${row.branch.backing_bytes}`], ['K and V shape at each of 6 layers', vec(row.branch.layers[0].keys)], ['Versions', `Torch ${data.native.torch}; Transformers ${data.native.transformers}`]]} 
  />
  <p>Four cases / {data.native.calls} total forwards. Criterion: |cached − reference| ≤ atol + rtol × |reference|.</p>
</Figure>;
}
export function PcAllocator() {
  const {
      data,
      error,
      retry
    } = useObservations(),
    [step, setStep] = useState(6),
    [layer, setLayer] = useState('0');
  if (!data) return <Figure 
  id="D21" 
  caption="Actual pinned allocator state and backing addresses."
>
  <Status 
    error={error} 
    retry={retry} 
  />
</Figure>;
  const events = data.allocator_events,
    e = events[Math.min(step, events.length - 1)],
    s = e.state,
    addresses = data.allocator.addresses[Number(layer)],
    blocks = [5, 4, 3, 2],
    refs = n => Object.entries(s.tables).filter(([, t]) => t.includes(n)).map(([r]) => r),
    base = addresses.A_key_addresses[0];
  return <Figure 
  id="D21" 
  caption="Actual observed allocator IDs and state. The shared-reference dictionary records multiply referenced blocks, so absence there is not a zero-owner claim. Owner labels in the drawing are derived from actual request tables. The address comparison is the saved both-active observation at the selected layer."
>
  <p>
    <strong>Recorded event: {e.name}</strong>
  </p>
  <Graph 
    label="Native physical blocks with current observed owners" 
    width={740} 
    height={275}
  >
    {blocks.map((n, i) => <g key={n}>
      <Node 
        x={10 + i * 183} 
        y={35} 
        width={170} 
        height={70} 
        label={`block ${n}`} 
        sub={refs(n).length ? `owners ${refs(n).join('+')}` : s.retained.includes(n) ? 'retained inactive' : s.free_sectors === 4 ? 'sector returned' : 'unowned'} 
        tone={n >= 4 ? '#62d7e2' : n === 3 ? '#6daeff' : '#ff91b4'} 
      />
      {[0, 1, 2, 3].map(j => <rect 
        key={j} 
        x={20 + i * 183 + j * 38} 
        y="125" 
        width="35" 
        height="36" 
        fill={refs(n).length || s.retained.includes(n) ? '#62d7e218' : '#252833'} 
        stroke="#81899b" 
      />)}
      <text 
        x={10 + i * 183} 
        y="192"
      >512 B / 2 layers</text>
    </g>)}
    <text 
      x="10" 
      y="245"
    >Two required trash sectors add 1024 B; total backing allocation is 3072 B.</text>
  </Graph>
  <Stepper 
    step={Math.min(step, events.length - 1)} 
    setStep={setStep} 
    max={events.length - 1} 
    reset={() => setStep(6)} 
  />
  <Table 
    label="Exact event state" 
    headers={['Field', 'Observed value']} 
    rows={Object.entries(s.tables).map(([r, t]) => [r + ' table', vec(t)]).concat([['Retained', vec(s.retained)], ['Free blocks', s.free_blocks], ['Free sectors', s.free_sectors], ['Shared-reference dictionary', JSON.stringify(s.shared_ref_counts)]])} 
  />
  <Controls reset={() => setLayer('0')}>
    <Select 
      label="Saved address observation layer" 
      value={layer} 
      onChange={setLayer} 
      options={[[0, 'Layer 0'], [1, 'Layer 1']]} 
    />
  </Controls>
  <Table 
    label={`Both-active byte offsets from A key address ${base}; this comparison is independent of lifecycle selection`} 
    headers={['Position', 'A key offset', 'B key offset', 'A value offset', 'B value offset']} 
    rows={addresses.A_key_addresses.map((n, i) => [i, n - base, addresses.B_key_addresses[i] - base, addresses.A_value_addresses[i] - base, addresses.B_value_addresses[i] - base])} 
  />
  <p>
    {s.free_sectors === 4 ? 'All four sectors returned outward; zero assigned free blocks does not mean a leak.' : 'Current free-block count belongs to the allocator; outer free-sector count is separate.'}
  </p>
</Figure>;
}
