import { useId } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { Drawing, Arrow, paperHues } from './MessagePassingFlowElements.jsx';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import { useIntroExtensions, useGcnExtensions } from './MessagePassingBasicsExtensionsState.jsx';
import { introTrace, gcnTrace, gcnPairs, reconcilePairs, basicNumber as num } from '../../data/message-basics-extensions-models.js';
import './message-aggregation-flow.css';
import './message-basics-extensions.css';
export { MessagePassingBasicsExtensionsProvider } from './MessagePassingBasicsExtensionsState.jsx';
const calc = '#c1a4f5',
  param = '#e4b752',
  grad = '#ef9b65';
const centered = (y, label, hue = '#eee', x = 160) => <text x={x} y={y} textAnchor="middle" fill={hue}>
    {label}
  </text>;
function Select({
  label,
  value,
  options,
  onChange
}) {
  const id = useId();
  return <label className="mp-basic-select" htmlFor={id}>
    {label}
    <select id={id} aria-label={label} value={value} onChange={e => onChange(Number(e.target.value))}>
      {options.map(([v, name]) => <option key={v} value={v}>
        {name}
      </option>)}
    </select>
  </label>;
}
const nodes = n => Array.from({
  length: n
}, (_, i) => [i, `Paper ${i}`]);
function Reset({
  onClick,
  label = 'Reset'
}) {
  return <button type="button" onClick={onClick}>
    {label}
  </button>;
}
function Toggle({
  label,
  value,
  onChange
}) {
  return <label>
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
    {label}
  </label>;
}
function Figure({
  job,
  question,
  children,
  controls,
  result
}) {
  return <FlowLab id={`mp-basic-${job}`} label={question}>
    <figure data-mp-drawing={job}>
      {children}
    </figure>
    <FlowControls>
      {controls}
    </FlowControls>
    <FlowReadout>
      {result}
    </FlowReadout>
  </FlowLab>;
}
// Own cells preserve the shared sign/identity convention while labelling tiny positive
// permissions and large divided coordinates accurately. Shared Cells stays frozen.
function Cells({
  values,
  x,
  y,
  labels,
  identities,
  highlight,
  cellWidth = 116,
  digits = 4
}) {
  return <g>
    {values.map((row, r) => <g key={r}>
      {labels && <text x={x - 12} y={y + r * 48 + 28} textAnchor="end" fill={identities ? paperHues[identities[r]] : '#eee'}>
        {labels[r]}
      </text>}
      {row.map((value, c) => <g key={c}>
        <rect x={x + c * cellWidth} y={y + r * 48} width={cellWidth - 4} height="40" rx="3" fill={value > 0 ? '#342b18' : value < 0 ? '#152539' : '#161616'} stroke={highlight?.[0] === r && highlight?.[1] === c ? '#fff' : '#646464'} strokeWidth={highlight?.[0] === r && highlight?.[1] === c ? 3 : 1} />
        <text x={x + c * cellWidth + (cellWidth - 4) / 2} y={y + r * 48 + 27} textAnchor="middle">
          {num(value, digits)}
        </text>
      </g>)}
    </g>)}
  </g>;
}
function Rows({
  label,
  values,
  ids = values.map((_, i) => i),
  digits = 4
}) {
  return <Drawing width={320} height={93 + 48 * values.length} label={`${label}: ${values.map(v => v === null ? 'undefined' : v).join(', ')}`}>
    {centered(25, label)}
    <Cells values={values.map(v => [v])} x={154} y={58} cellWidth={148} digits={digits} labels={ids.map(i => `paper ${i}`)} identities={ids} />
  </Drawing>;
}
function Grid({
  label,
  values,
  highlight,
  identities = true,
  digits = 4
}) {
  const n = values.length,
    width = 148 + values[0].length * 116;
  return <Drawing width={width} height={113 + n * 48} label={`${label}; receiver rows, source columns. ${JSON.stringify(values)}`}>
    <text x={width / 2} y="25" textAnchor="middle">
      {label}
    </text>
    <text x={width / 2} y="50" textAnchor="middle">Source columns</text>
    {values[0].map((_, u) => <text key={u} x={193 + u * 116} y="78" textAnchor="middle" fill={paperHues[u]}>paper {u}</text>)}
    <Cells values={values} x={137} y={94} cellWidth={116} digits={digits} labels={values.map((_, v) => `recv ${v}`)} identities={identities ? values.map((_, i) => i) : undefined} highlight={highlight} />
  </Drawing>;
}
function Node({
  id,
  x,
  y,
  value,
  selected = false
}) {
  return <g>
    <text x={x} y={y - 37} textAnchor="middle" fill={paperHues[id]}>paper {id}</text>
    <circle cx={x} cy={y} r="24" fill="#101010" stroke={selected ? '#fff' : paperHues[id]} strokeWidth="2" />
    <text x={x} y={y + 6} textAnchor="middle" fill={paperHues[id]}>
      {id}
    </text>
    {value !== undefined && <text x={x} y={y + 47} textAnchor="middle" fill={paperHues[id]}>
      {num(value, 4)}
    </text>}
  </g>;
}
function Permissions({
  s,
  receiver = s.receiver,
  loops = false
}) {
  const values = s.a[receiver].map((w, u) => w + Number(loops && u === receiver));
  return <Drawing width={320} height={100 + values.length * 130} label={`Current incoming graph permissions at paper ${receiver}; all source IDs and strengths shown`}>
    {centered(24, `Incoming to paper ${receiver}`)}
    {values.map((w, u) => <g key={u}>
      <Node id={u} x={43} y={93 + u * 130} value={s.x[u]} />
      <Node id={receiver} x={277} y={93 + u * 130} selected />
      {w > 0 ? <Arrow x1={73} y1={93 + u * 130} x2={247} y2={93 + u * 130} hue={paperHues[u]} /> : <>
        <path d={`M73,${93 + u * 130}H247`} stroke="#666" strokeDasharray="6 5" />
        <text x="160" y={99 + u * 130} textAnchor="middle" fill="#999">×</text>
      </>}
      {centered(77 + u * 130, `strength ${num(w)}`, paperHues[u])}
      {centered(147 + u * 130, `source ${u} → receiver ${receiver}`)}
    </g>)}
    {centered(87 + values.length * 130, 'Zero strength denies this route.')}
  </Drawing>;
}
function BufferPair({
  label,
  before,
  after,
  receiver = null
}) {
  return <Drawing width={320} height={105 + before.length * 80} label={`${label}, input ${before.join(', ')}, result ${after.join(', ')}`}>
    {centered(25, label)}
    <text x="74" y="54" textAnchor="middle">Read buffer</text>
    <text x="248" y="54" textAnchor="middle">Next buffer</text>
    {before.map((v, i) => <g key={i}>
      <text x="15" y={91 + i * 80} fill={paperHues[i]}>
        {i}
      </text>
      <rect x="37" y={66 + i * 80} width="103" height="43" stroke={i === receiver ? '#fff' : paperHues[i]} fill="#101010" />
      <text x="88" y={94 + i * 80} textAnchor="middle">
        {num(v, 4)}
      </text>
      <Arrow x1={147} y1={87 + i * 80} x2={185} y2={87 + i * 80} hue={paperHues[i]} />
      <rect x="193" y={66 + i * 80} width="120" height="43" stroke={paperHues[i]} fill="#101010" />
      <text x="253" y={94 + i * 80} textAnchor="middle">
        {num(after[i], 4)}
      </text>
    </g>)}
  </Drawing>;
}
function Products({
  label,
  coefficients,
  values,
  receiver,
  own = null,
  divisors = null
}) {
  const products = coefficients.map((w, u) => w * values[u]),
    sum = products.reduce((a, b) => a + b, 0),
    base = 65 + coefficients.length * 120;
  return <Drawing width={320} height={base + (own === null ? 114 : 268)} label={`${label}; receiver ${receiver}; coefficients ${coefficients.join(', ')} times source values ${values.join(', ')} = products ${products.join(', ')}; sum ${sum}; own ${own}`}>
    {centered(25, label)}
    {coefficients.map((w, u) => <g key={u}>
      <text x="12" y={63 + u * 120} fill={paperHues[u]}>src {u}: {num(values[u], 3)}</text>
      <text x="308" y={63 + u * 120} textAnchor="end">× {num(w, 4)}</text>
      <Arrow x1={85} y1={74 + u * 120} x2={135} y2={99 + u * 120} hue={paperHues[u]} />
      <Arrow x1={261} y1={74 + u * 120} x2={188} y2={99 + u * 120} />
      <circle cx="160" cy={116 + u * 120} r="24" fill="#101010" stroke="#ddd" />
      <text x="160" y={122 + u * 120} textAnchor="middle">×</text>
      <Arrow x1={189} y1={116 + u * 120} x2={194} y2={116 + u * 120} hue={paperHues[u]} />
      <rect x="201" y={95 + u * 120} width="110" height="42" stroke={paperHues[u]} fill="#101010" />
      <text x="256" y={122 + u * 120} textAnchor="middle" fill={paperHues[u]}>
        {num(products[u], 4)}
      </text>
      {divisors && <text x="15" y={158 + u * 120}>dᵥ {num(divisors[receiver])} · dᵤ {num(divisors[u])}</text>}
    </g>)}
    <path d={`M316,115V${base + 28}H194`} fill="none" stroke="#aaa" />
    <Arrow x1={220} y1={base + 28} x2={194} y2={base + 28} />
    <circle cx="160" cy={base + 28} r="28" stroke="#ddd" fill="#101010" />
    <text x="160" y={base + 34} textAnchor="middle">Σ</text>
    {products.map((_, u) => <Arrow key={u} x1={312} y1={116 + u * 120} x2={316} y2={116 + u * 120} hue={paperHues[u]} />)}
    {centered(base + 88, `aggregate ${num(sum, 4)}`, calc)}
    {own !== null && <>
      <Arrow x1={160} y1={base + 102} x2={160} y2={base + 140} />
      <text x="50" y={base + 131} textAnchor="middle" fill={paperHues[receiver]}>own {num(own)}</text>
      <Arrow x1={50} y1={base + 141} x2={131} y2={base + 167} hue={paperHues[receiver]} />
      <circle cx="160" cy={base + 173} r="25" stroke="#ddd" fill="#101010" />
      <text x="160" y={base + 179} textAnchor="middle">+</text>
      {centered(base + 244, `new = ${num(sum + own, 4)}`, calc)}
    </>}
  </Drawing>;
}
function TrajectoryRows({
  trace,
  label
}) {
  return <div className="mp-basic-values" tabIndex={0} role="region" aria-label={`${label}. Scroll horizontally for all rounds.`}>
    <table>
      <caption>{label} · semantic IDs stay fixed</caption>
      <thead>
        <tr>
          <th>Paper ID</th>
          {trace.history.map((_, r) => <th key={r}>Round {r}</th>)}
        </tr>
      </thead>
      <tbody>
        {trace.history[0].map((_, i) => <tr key={i}>
          <th style={{
            color: paperHues[i]
          }}>
            {i}
          </th>
          {trace.history.map((row, r) => <td key={r}>
            {num(row[i], 12)}
          </td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
function IntroContextSentence({
  s
}) {
  return <>Current graph: {s.x.length} papers; values [{s.x.map(v => num(v)).join(', ')}]; mean self reads {s.loops ? 'included' : 'excluded'}; process order {s.reverse ? 'descending' : 'ascending'}; round {s.rounds}.</>;
}
export function MessagePassingGraphSizeExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c;
  return <Figure job="D02a" question="What changes when a graph has more papers?" controls={<>
      <AggregationQuantity label="Number of papers" value={s.x.length} onChange={c.resize} min={2} max={6} integer revision={c.revisions.size ?? 0} />
      <Reset onClick={() => c.reset('size')} />
    </>} result={<>There are {s.x.length} feature rows and {s.x.length} receiver/source positions. Growing preserves surviving entries and adds zero rows; shrinking drops them and clears the retained pin.</>}>
    <div className="mp-basic-grid">
      <Permissions s={s} />
      <Rows label="Supplied scalar feature rows" values={s.x} />
    </div>
    <Grid label="A · fixed relationship strengths" values={s.a} highlight={[s.receiver, s.source]} />
    <figcaption>Each circle is a paper; its identity hue follows its row and column. Numbers are features or fixed edge strengths, never learned weights. New zero-valued papers still exist.</figcaption>
  </Figure>;
}
export function MessagePassingEdgeStrengthExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c;
  const setReceiver = v => {
    c.edit('receiver', v);
    if (v === s.source) c.edit('source', v === 0 ? 1 : 0);
  };
  return <Figure job="D02b" question="What does an edge strength change?" controls={<>
      <Select label="Edge source" value={s.source} options={nodes(s.x.length).filter(([i]) => i !== s.receiver)} onChange={v => c.edit('source', v)} />
      <Select label="Edge receiver" value={s.receiver} options={nodes(s.x.length)} onChange={setReceiver} />
      <AggregationQuantity key={`${s.receiver}-${s.source}`} label="Selected fixed edge strength" value={s.a[s.receiver][s.source]} onChange={c.edge} min={0} max={4} revision={c.revisions.edge ?? 0} />
      <Reset onClick={() => c.reset('edge')} />
    </>} result={<>A[{s.receiver},{s.source}] = {num(s.a[s.receiver][s.source])} permits paper {s.receiver} to read paper {s.source}; its weighted message is {num(s.a[s.receiver][s.source] * s.x[s.source])}. {s.paired ? 'Paired editing also changes the reverse cell.' : 'The reverse strength stays independently editable.'}</>}>
    <Permissions s={s} />
    <Grid label="A · receiver rows / source columns" values={s.a} highlight={[s.receiver, s.source]} />
    <Products label={`One incoming sum at paper ${s.receiver}`} coefficients={s.a[s.receiver]} values={s.x} receiver={s.receiver} own={s.x[s.receiver]} />
  </Figure>;
}
export function MessagePassingPairedEdgesExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c;
  const reconciled = reconcilePairs(s.a);
  return <Figure job="D02c" question="When should the reverse permission change too?" controls={<>
      <Toggle label="Edit both directions together" value={s.paired} onChange={c.paired} />
      <button type="button" onClick={() => c.edit('a', s.a.map(row => row.map(() => 0)))}>Remove all nonself edges</button>
      <Reset onClick={() => c.reset('pairs')} />
    </>} result={<>Current {s.source}→{s.receiver} strength {num(s.a[s.receiver][s.source])}; reverse {num(s.a[s.source][s.receiver])}. Enabling paired editing assigns max({num(s.a[s.receiver][s.source])}, {num(s.a[s.source][s.receiver])}) = {num(reconciled[s.receiver][s.source])} to both, across every pair. Node values remain available when edges are removed.</>}>
    <div className="mp-basic-grid">
      <Grid label="Current directional strengths" values={s.a} highlight={[s.receiver, s.source]} />
      <Grid label="If paired: maximum of both cells" values={reconciled} highlight={[s.source, s.receiver]} />
    </div>
    <Permissions s={s} />
  </Figure>;
}
export function MessagePassingFeatureExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c;
  return <Figure job="D05a" question="Which input can change without changing the rule?" controls={<>
      <Select label="Feature paper" value={s.selected} options={nodes(s.x.length)} onChange={v => c.edit('selected', v)} />
      <AggregationQuantity key={s.selected} label="Selected paper feature" value={s.x[s.selected]} onChange={c.editFeature} min={-8} max={8} revision={c.revisions.feature ?? 0} />
      <Reset onClick={() => c.reset('feature')} />
    </>} result={<>Own + incoming SUM gives paper {s.selected}: {num(s.x[s.selected] + s.a[s.selected].reduce((z, w, u) => z + w * s.x[u], 0))}. The same edited scalar appears wherever this paper has a permitted outgoing route; degrees do not depend on its feature.</>}>
    <div className="mp-basic-grid">
      <Rows label="Old supplied values" values={s.x} />
      <Products label={`Message → aggregate → own update`} coefficients={s.a[s.selected]} values={s.x} receiver={s.selected} own={s.x[s.selected]} />
    </div>
    <figcaption>The weighted message is strength × old source value; the separate own-state addition occurs once. This SUM rule differs from the buffering comparison’s named MEAN rule.</figcaption>
  </Figure>;
}
function MeanBuffers({
  s,
  trace
}) {
  return <>
    <div className="mp-basic-grid">
      <BufferPair label="Synchronous MEAN · old → next" before={s.x} after={trace.correct.history[Math.min(s.rounds, 1)]} />
      <BufferPair label="Faulty MEAN · overwritten reads" before={s.x} after={trace.faulty.history[Math.min(s.rounds, 1)]} />
    </div>
    <Grid label="Current mean coefficients P" values={trace.p} />
    {s.rounds > 0 && <div className="mp-basic-grid">
      {trace.faulty.sweeps[s.rounds - 1].map((step, i) => <div key={step.receiver}>
        <BufferPair label={`Sweep ${s.rounds}, write ${i + 1}: paper ${step.receiver}`} before={step.read} after={step.buffer} receiver={step.receiver} />
        <Products label={`Reads used by paper ${step.receiver}`} coefficients={trace.p[step.receiver]} values={step.read} receiver={step.receiver} />
      </div>)}
    </div>}
    <TrajectoryRows label="Correct old-buffer mean" trace={trace.correct} />
    <TrajectoryRows label="Faulty in-place mean" trace={trace.faulty} />
  </>;
}
export function MessagePassingOrderExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c,
    t = introTrace(s);
  return <Figure job="D06a" question="What changes when processing order reverses?" controls={<>
      <Toggle label="Process paper IDs in reverse order" value={s.reverse} onChange={v => c.edit('reverse', v)} />
      <Reset onClick={() => c.reset('order')} />
    </>} result={<>Synchronous MEAN uses unchanged inputs in order [{t.correct.order.join(', ')}] and gives [{t.correct.history.at(-1).map(v => num(v)).join(', ')}]. Faulty in-place MEAN gives [{t.faulty.history.at(-1).map(v => num(v)).join(', ')}]. <IntroContextSentence s={s} /></>}>
    <MeanBuffers s={s} trace={t} />
    <figcaption>These are the current editor graph and values. The preceding fixed two-paper [1,3] illustration is a separately labelled buffering example. Correct writes always read the old buffer.</figcaption>
  </Figure>;
}
export function MessagePassingInPlaceExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c,
    t = introTrace(s);
  return <Figure job="D06b" question="What happens after several overwrite sweeps?" controls={<>
      <Toggle label="Select faulty in-place comparison" value={s.inPlace} onChange={v => c.edit('inPlace', v)} />
      <AggregationQuantity label="Mean comparison rounds" value={s.rounds} onChange={v => c.edit('rounds', v)} min={0} max={4} integer revision={c.revisions.rounds ?? 0} />
      <Reset onClick={() => c.reset('rounds')} />
    </>} result={<>Selected {s.inPlace ? 'faulty in-place' : 'synchronous'} MEAN at round {s.rounds} gives [{t.current.history.at(-1).map(v => num(v)).join(', ')}]. Correct and faulty branches remain visible; round zero is the identical initial state. A zero receiving total uses aggregate zero.</>}>
    <MeanBuffers s={s} trace={t} />
  </Figure>;
}
function UnfoldedSum({
  s,
  t
}) {
  const width = Math.max(320, 200 * t.sum.history.length - 20),
    offset = t.sum.history.length === 1 ? 80 : 0,
    height = 115 + 130 * s.x.length,
    highlight = s.x.length > 2 && s.rounds >= 2 && s.a[1][2] > 0 && s.a[0][1] > 0;
  return <>
    <Drawing width={width} height={height} label="Unfolded current own-plus-incoming sum graph; arrows join permitted old-round sources to next-round receivers">
      {t.sum.history.map((row, r) => r < t.sum.history.length - 1 && row.map((_, u) => t.ownSum.map((receiver, v) => receiver[u] !== 0 && <Arrow key={`${r}-${u}-${v}`} x1={110 + r * 200} y1={92 + u * 130} x2={250 + r * 200} y2={92 + v * 130} hue={r === 0 && u === 2 && v === 1 || r === 1 && u === 1 && v === 0 ? paperHues[2] : '#777'} />)))}
      {t.sum.history.map((row, r) => <g key={r}>
        <text x={80 + r * 200 + offset} y="25" textAnchor="middle">Round {r}</text>
        {row.map((value, i) => <g key={i}>
          <Node id={i} x={80 + r * 200 + offset} y={92 + i * 130} />
          <rect x={20 + r * 200 + offset} y={128 + i * 130} width="120" height="37" fill="#101010" />
          <text x={80 + r * 200 + offset} y={153 + i * 130} textAnchor="middle" fill={paperHues[i]}>
            {num(value, 4)}
          </text>
        </g>)}
      </g>)}
      <text x={width / 2} y={height - 36} textAnchor="middle">
        {s.rounds === 0 ? 'Round zero is the initial table.' : 'Each arrow reads the previous round.'}
      </text>
      <text x={width / 2} y={height - 5} textAnchor="middle">
        {highlight ? 'Current highlight: 2 → 1 → 0.' : s.rounds === 0 ? 'No messages have been applied.' : 'No arrow marks an absent route.'}
      </text>
    </Drawing>
    <div className="mp-basic-grid">
      {t.sum.history.map((row, r) => <Drawing key={r} width={320} height={98 + row.length * 130} label={`Own plus incoming sum round ${r}, states ${row.join(', ')}, initial sources reaching paper 0 ${t.support[r].join(', ')}`}>
        {centered(25, `Own + incoming SUM · round ${r}`)}
        {row.map((v, i) => <g key={i}>
          <Node id={i} x={54} y={94 + i * 130} />
          <rect x="122" y={70 + i * 130} width="170" height="43" stroke={paperHues[i]} fill="#101010" />
          <text x="207" y={98 + i * 130} textAnchor="middle">
            {num(v, 4)}
          </text>
          <Arrow x1={84} y1={94 + i * 130} x2={113} y2={94 + i * 130} hue={paperHues[i]} />
          <text x="160" y={152 + i * 130} textAnchor="middle">
            {r ? `reads prior-round permitted IDs` : 'initial scalar input'}
          </text>
        </g>)}
        {centered(83 + row.length * 130, `Paper 0 support: ${t.support[r].join(', ')}`)}
      </Drawing>)}
    </div>
    {s.rounds > 0 && <>
      <Products label={`Paper 0 · final old-round products`} coefficients={s.a[0]} values={t.sum.history[s.rounds - 1]} receiver={0} own={t.sum.history[s.rounds - 1][0]} />
      <Grid label="Each round's own-plus-incoming operator" values={t.ownSum} />
    </>}
    <TrajectoryRows label="Own + incoming SUM, all rounds" trace={t.sum} />
  </>;
}
export function MessagePassingReachExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c,
    t = introTrace(s);
  return <Figure job="D07" question="How far can local rounds carry information?" controls={<>
      <AggregationQuantity label="Own-sum current round" value={s.rounds} onChange={v => c.edit('rounds', v)} min={0} max={4} integer revision={c.revisions.reach ?? 0} />
      <Reset onClick={() => c.reset('reach')} />
    </>} result={<>At round {s.rounds}, paper 0’s own+incoming SUM is {num(t.sum.history.at(-1)[0])}; initial IDs [{t.support.at(-1).join(', ')}] have permitted dependencies. With the original path, paper 2 first reaches paper 0 at round 2. Edited zero edges remove routes; reachable contributions can still cancel.</>}>
    <UnfoldedSum s={s} t={t} />
    <figcaption>This is SUM with a separate own term even when the mean experiment’s automatic loops are off. Each panel is another computation round on the same graph; layout positions are not measured coordinates.</figcaption>
  </Figure>;
}
export function MessagePassingPinExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c,
    t = introTrace(s);
  return <Figure job="D07b" question="Can the current trajectory be compared with a retained one?" controls={<>
      <button type="button" onClick={c.pin}>Pin current states</button>
      <Reset label="Clear retained pin" onClick={() => c.reset('pin')} />
    </>} result={<>The current {s.inPlace ? 'in-place' : 'synchronous'} MEAN output is [{t.current.history.at(-1).map(v => num(v)).join(', ')}]. {s.pin ? `The copied pin retains ${s.pin.ids.length} semantic IDs, round ${s.pin.rounds}, loops ${s.pin.loops}, reverse ${s.pin.reverse}, ${s.pin.inPlace ? 'in-place' : 'synchronous'} mean and its exact buffers. Edits cannot mutate it.` : 'Pin the current inputs and states to keep a named comparison.'} Resizing clears that comparison.</>}>
    <Rows label="Current mean output" values={t.current.history.at(-1)} />
    {s.pin ? <>
      <Rows label="Retained mean output" values={s.pin.output} ids={s.pin.ids} />
      <Grid label="Retained adjacency" values={s.pin.a} />
      <Rows label="Retained initial inputs" values={s.pin.x} ids={s.pin.ids} />
      <TrajectoryRows label={`Pinned selected ${s.pin.inPlace ? 'in-place' : 'synchronous'} MEAN · loops ${s.pin.loops} · reverse ${s.pin.reverse}`} trace={{
        history: s.pin.current
      }} />
      {s.pin.inPlace && <TrajectoryRows label={`Pinned correct synchronous MEAN · loops ${s.pin.loops}`} trace={{
        history: s.pin.correct
      }} />}
      <TrajectoryRows label="Pinned separate own+incoming SUM" trace={{
        history: s.pin.sum
      }} />
    </> : <figcaption>The retained branch is empty until an actual copy is made. The current branch remains available.</figcaption>}
  </Figure>;
}
export function MessagePassingSelfReadsExtension() {
  const c = useIntroExtensions(),
    {
      s
    } = c,
    t = introTrace(s);
  return <Figure job="D08" question="What changes when each node reads itself?" controls={<>
      <Toggle label="Include introductory mean self reads, weight one" value={s.loops} onChange={v => c.edit('loops', v)} />
      <Reset onClick={() => c.reset('loops')} />
    </>} result={<>Introductory MEAN loops are {s.loops ? 'enabled' : 'disabled'}, giving receiving totals [{t.d.map(v => num(v)).join(', ')}]. No-loop degree zero returns mean aggregate zero. The following GCN example restarts its separately declared three-node path with its own enabled loops.</>}>
    <div className="mp-basic-grid">
      {s.x.map((_, i) => <Drawing key={i} width={320} height={214} label={`${s.loops ? 'One added' : 'No automatic'} self permission at paper ${i}`}>
        {centered(25, s.loops ? 'One added self permission' : 'No automatic self permission')}
        <Node id={i} x={160} y={94} />
        {s.loops ? <g fill="none" stroke={paperHues[i]} strokeWidth="2">
          <path d="M178,110C250,195 70,195 142,110" />
          <polyline points="142,110 132,119 143,123" />
        </g> : <text x="160" y="157" textAnchor="middle" fill="#999">×</text>}
        {centered(207, s.loops ? 'Fixed self strength 1' : 'Self strength 0', paperHues[i])}
      </Drawing>)}
    </div>
    <Permissions s={s} loops={s.loops} />
    <Grid label={s.loops ? 'B = A + I · one self permission' : 'B = A · no self permission'} values={t.b} />
    <Rows label="Receiving strength totals d" values={t.d} />
    <Grid label="D · receiving totals on diagonal" values={t.d.map((d, v) => t.d.map((_, u) => v === u ? d : 0))} />
    <figcaption>A curved self arrow returns to the same paper. The following permission rows repeat the endpoint so source/receiver correspondence stays explicit. Weighted degrees sum strengths; they do not sum feature values. Introductory and GCN inputs are separate contexts.</figcaption>
  </Figure>;
}
function GcnShared({
  s,
  t
}) {
  return <>
    <div className="mp-basic-grid">
      <Permissions s={{
        ...s,
        receiver: s.receiver
      }} loops={s.loops} />
      <Rows label="Current GCN supplied x" values={s.x} />
      <Rows label="Current receiving totals d" values={t.d} />
    </div>
    <Grid label="B · current closed strengths" values={t.b} />
    <Grid label="S · both endpoint degrees" values={t.s} />
    <Grid label="P · receiver degree only" values={t.p} />
    <div className="mp-basic-grid">
      <Products label={`Current ${s.rule === 'mean' ? 'P' : 'S'} products`} coefficients={t.matrix[s.receiver]} values={s.x} receiver={s.receiver} divisors={t.d} />
      <Rows label="Current aggregate by receiver" values={t.aggregate} />
    </div>
  </>;
}
export function MessagePassingGcnFeatureExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s);
  return <Figure job="D09a" question="Which GCN products change when a feature changes?" controls={<>
      <Select label="GCN feature paper" value={s.selected} options={nodes(3)} onChange={v => c.edit('selected', v)} />
      <AggregationQuantity key={s.selected} label="Selected GCN feature" value={s.x[s.selected]} onChange={c.editFeature} min={-8} max={8} revision={c.revisions['gcn-feature'] ?? 0} />
      <Reset onClick={() => c.reset('feature')} />
    </>} result={<>GCN restarts with its separately editable three-node graph. Current feature {s.selected} = {num(s.x[s.selected])}; degrees [{t.d.join(', ')}] depend only on relationships. All S/P products and the supervised loss reuse these current inputs.</>}>
    <GcnShared s={s} t={t} />
  </Figure>;
}
export function MessagePassingGcnEdgeExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s),
    [u, v] = gcnPairs[s.edge];
  return <Figure job="D09b" question="Why does an edge edit change other coefficients?" controls={<>
      <Select label="GCN undirected edge" value={s.edge} options={gcnPairs.map(([a, b], i) => [i, `${a}—${b}`])} onChange={v => c.edit('edge', v)} />
      <AggregationQuantity key={s.edge} label="Selected GCN edge strength" value={s.a[v][u]} onChange={c.edge} min={0} max={4} revision={c.revisions['gcn-edge'] ?? 0} />
      <Reset onClick={() => c.reset('edge')} />
    </>} result={<>Both directions of {u}—{v} have strength {num(s.a[v][u])}. The recomputed totals [{t.d.map(v => num(v)).join(', ')}] change every factor using those endpoint degrees, including earlier edges. A feature edit alone never changes those totals.</>}>
    <GcnShared s={s} t={t} />
  </Figure>;
}
export function MessagePassingGcnLoopsExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s);
  return <Figure job="D09c" question="Which GCN self contributions disappear without loops?" controls={<>
      <Toggle label="Include GCN self reads, weight one" value={s.loops} onChange={v => c.edit('loops', v)} />
      <Reset onClick={() => c.reset('loops')} />
    </>} result={<>GCN self reads are {s.loops ? 'included' : 'excluded'}. {t.d.some(v => v === 0) ? 'Degree zero: zero operator row and zero aggregate; division by its square-root degree is undefined. Invertible similarity is unavailable.' : 'All current degrees are positive, so every degree coordinate can be converted.'} Introductory mean-loop settings stay separate.</>}>
    <GcnShared s={s} t={t} />
    <Rows label="Divided input f · undefined at d=0" values={t.f} />
  </Figure>;
}
function CoordinateRoute({
  first,
  label,
  converted,
  result,
  t
}) {
  return <div className="mp-basic-sequence">
    <Rows label={first ? 'A · raw input x' : 'B · raw input x'} values={t.x} />
    <Drawing width={320} height={100} label={label}>
      {centered(30, label)}
      <Arrow x1={160} y1={49} x2={160} y2={94} />
    </Drawing>
    <Rows label={first ? 'A · Sx' : 'B · f = x / √d'} values={converted} />
    <Drawing width={320} height={100} label={first ? 'Divide each output by √d' : 'Mix converted inputs using P'}>
      {centered(30, first ? 'Divide each output by √d' : 'Mix converted inputs using P')}
      <Arrow x1={160} y1={49} x2={160} y2={94} />
    </Drawing>
    <Rows label={first ? 'A · (Sx) / √d' : 'B · Pf'} values={result} />
  </div>;
}
export function MessagePassingGcnCoordinatesExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s),
    positive = t.d.every(v => v > 0);
  return <Figure job="D09d" question="How do the two normalizers relate after changing coordinates?" controls={<>
      <Toggle label="Use receiver mean P in the supervised route" value={s.rule === 'mean'} onChange={v => c.edit('rule', v ? 'mean' : 'symmetric')} />
      <Reset onClick={() => c.reset('normalizer')} />
    </>} result={<>Same raw x gives Sx [{t.sx.map(v => num(v)).join(', ')}] and Px [{t.px.map(v => num(v)).join(', ')}]. {positive ? 'The two complete coordinate routes agree: Pf = (Sx)/√d. This changes the input AND output.' : 'The zero-degree coordinate is undefined; no invertible-similarity claim is made.'} The supervised route currently uses {s.rule === 'mean' ? 'P' : 'S'}.</>}>
    <div className="mp-basic-grid">
      <Grid label="S · endpoint factors" values={t.s} />
      <Grid label="P · row divisors" values={t.p} />
      <Rows label="Same raw x → Sx" values={t.sx} />
      <Rows label="Same raw x → Px" values={t.px} />
    </div>
    <div className="mp-basic-grid">
      <CoordinateRoute first label="Mix using S" converted={t.sx} result={t.divided} t={{
        ...t,
        x: s.x
      }} />
      <CoordinateRoute label="Divide inputs by √d" converted={t.f} result={positive ? t.pf : t.pf.map((v, i) => t.d[i] ? v : null)} t={{
        ...t,
        x: s.x
      }} />
    </div>
    <Rows label="Current degrees in both routes" values={t.d} />
    <figcaption>Receiver/source IDs stay attached to every cell. Nonnegative undirected support and positive degrees make this diagonal change invertible. Equal degree on a regular graph gives P = S. Zero-row arithmetic can be inspected separately.</figcaption>
  </Figure>;
}
function BiasCircuit({
  s,
  t,
  before
}) {
  return <div className="mp-basic-sequence">
    <Rows label={before ? 'A · input x' : 'B · input x'} values={s.x} />
    <Drawing width={320} height={186} label={before ? 'Add shared bias to every input row before mixing' : 'Mix using current operator before adding bias'}>
      {centered(25, before ? 'Add bias at each node' : 'Mix current graph')}
      <circle cx="160" cy="112" r="29" stroke="#ddd" fill="#101010" />
      <text x="160" y="118" textAnchor="middle">
        {before ? '+' : s.rule === 'mean' ? 'P' : 'S'}
      </text>
      <Arrow x1={160} y1={44} x2={160} y2={77} />
      {before && <>
        <text x="40" y="80" textAnchor="middle" fill={param}>b {num(s.bias)}</text>
        <Arrow x1={40} y1={92} x2={126} y2={112} hue={param} />
      </>}
      <Arrow x1={160} y1={146} x2={160} y2={182} />
    </Drawing>
    <Rows label={before ? 'A · x + b' : 'B · mixed x'} values={before ? s.x.map(v => v + s.bias) : t.aggregate} />
    <Drawing width={320} height={186} label={before ? 'Mix biased rows using current operator' : 'Add shared bias once after mixing'}>
      {centered(25, before ? 'Then mix current graph' : 'Then add bias once')}
      <circle cx="160" cy="112" r="29" stroke="#ddd" fill="#101010" />
      <text x="160" y="118" textAnchor="middle">
        {before ? s.rule === 'mean' ? 'P' : 'S' : '+'}
      </text>
      <Arrow x1={160} y1={44} x2={160} y2={77} />
      {!before && <>
        <text x="40" y="80" textAnchor="middle" fill={param}>b {num(s.bias)}</text>
        <Arrow x1={40} y1={92} x2={126} y2={112} hue={param} />
      </>}
      <Arrow x1={160} y1={146} x2={160} y2={182} />
    </Drawing>
    <Rows label={before ? 'A · bias before mixing' : 'B · bias after mixing'} values={before ? t.biasBefore : t.biasAfter} />
  </div>;
}
export function MessagePassingBiasExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s);
  return <Figure job="D11" question="How does current graph mixing change a bias sent through it?" controls={<>
      <AggregationQuantity label="Shared scalar bias" value={s.bias} onChange={v => c.edit('bias', v)} min={-4} max={4} revision={c.revisions['gcn-bias'] ?? 0} />
      <Reset onClick={() => c.reset('bias')} />
    </>} result={<>At paper 0, bias before mixing gives {num(t.biasBefore[0])}; afterward {num(t.biasAfter[0])}. Difference {num(t.biasBefore[0] - t.biasAfter[0])} = (row sum {num(t.rowSums[0])} − 1) × {num(s.bias)}. Bias zero or row sum one makes the two routes coincide. The no-bias supervised loss stays separate.</>}>
    <div className="mp-basic-grid">
      <BiasCircuit s={s} t={t} before />
      <BiasCircuit s={s} t={t} />
    </div>
    <Rows label="Current operator row sums" values={t.rowSums} />
  </Figure>;
}
function LossCircuit({
  t,
  s,
  proposed = false
}) {
  const w = proposed ? t.nextWeight : s.weight,
    pred = proposed ? t.nextPrediction : t.prediction,
    res = pred - s.target,
    loss = proposed ? t.nextLoss : t.loss;
  return <Drawing width={320} height={625} label={`${proposed ? 'Proposed' : 'Current'} no-bias supervised circuit: aggregate ${t.a}, weight ${w}, prediction ${pred}, target ${s.target}, residual ${res}, loss ${loss}`}>
    {centered(25, `${proposed ? 'Proposed' : 'Current'} · receiver ${s.receiver}`)}
    {centered(60, `aggregate a = ${num(t.a, 4)}`, calc)}
    <Arrow x1={160} y1={76} x2={160} y2={115} />
    <circle cx="160" cy="145" r="25" fill="#101010" stroke="#ddd" />
    <text x="160" y="151" textAnchor="middle">×</text>
    <rect x="10" y="75" width="110" height="60" stroke={param} fill="#101010" />
    <text x="23" y="97" fill={param}>shared w</text>
    <text x="23" y="122" fill={param}>
      {num(w, 6)}
    </text>
    <Arrow x1={54} y1={138} x2={130} y2={145} hue={param} />
    <Arrow x1={160} y1={175} x2={160} y2={210} />
    {centered(238, `prediction ${num(pred, 5)}`, calc)}
    <Arrow x1={160} y1={253} x2={160} y2={290} />
    <circle cx="160" cy="318" r="25" fill="#101010" stroke="#ddd" />
    <text x="160" y="324" textAnchor="middle">−</text>
    <text x="31" y="274" fill="#82d3ed">target</text>
    <text x="31" y="299" fill="#82d3ed">
      {num(s.target)}
    </text>
    <Arrow x1={55} y1={313} x2={130} y2={318} hue="#82d3ed" />
    {centered(381, `residual ${num(res, 5)}`, calc)}
    <Arrow x1={160} y1={395} x2={160} y2={430} />
    <rect x="99" y="436" width="122" height="52" fill="#101010" stroke="#ddd" />
    <text x="160" y="468" textAnchor="middle">square ÷ 2</text>
    <Arrow x1={160} y1={494} x2={160} y2={525} />
    {centered(550, `loss ${num(loss, 7)}`, calc)}
    {!proposed && <>
      <path d="M233,462H302V180H54V136" fill="none" stroke={grad} strokeDasharray="6 5" />
      <Arrow x1={54} y1={177} x2={54} y2={136} hue={grad} dashed />
      {centered(598, `dL/dw = a × residual`, grad)}
    </>}
  </Drawing>;
}
function GradientCircuit({
  s,
  t
}) {
  return <Drawing width={320} height={565} label={`Derivative ${t.a} times ${t.residual} = ${t.derivative}; exact step ${s.weight} minus ${s.rate} times derivative gives ${t.nextWeight}`}>
    {centered(25, 'Backward local effects', grad)}
    <text x="78" y="62" textAnchor="middle">a · local effect</text>
    <text x="243" y="62" textAnchor="middle" fill={grad}>residual</text>
    <rect x="8" y="75" width="140" height="44" fill="#101010" stroke={calc} />
    <rect x="173" y="75" width="140" height="44" fill="#101010" stroke={grad} />
    <text x="78" y="104" textAnchor="middle">
      {num(t.a, 5)}
    </text>
    <text x="243" y="104" textAnchor="middle" fill={grad}>
      {num(t.residual, 5)}
    </text>
    <Arrow x1={78} y1={125} x2={140} y2={161} hue={grad} dashed />
    <Arrow x1={243} y1={125} x2={182} y2={161} hue={grad} dashed />
    <circle cx="160" cy="186" r="25" fill="#101010" stroke="#ddd" />
    <text x="160" y="192" textAnchor="middle">×</text>
    <Arrow x1={160} y1={216} x2={160} y2={244} hue={grad} dashed />
    {centered(273, `derivative = ${num(t.derivative, 6)}`, grad)}
    <Arrow x1={160} y1={288} x2={160} y2={346} hue={grad} dashed />
    <text x="40" y="308" fill={param}>w {num(s.weight, 4)}</text>
    <text x="220" y="308" fill={param}>η {num(s.rate, 4)}</text>
    <Arrow x1={48} y1={322} x2={92} y2={363} hue={param} />
    <Arrow x1={252} y1={322} x2={232} y2={363} hue={param} />
    <rect x="35" y="367" width="250" height="54" fill="#101010" stroke="#ddd" />
    <text x="160" y="399" textAnchor="middle">w − η × derivative</text>
    <Arrow x1={160} y1={427} x2={160} y2={473} />
    {centered(510, `proposal ${num(t.nextWeight, 8)}`, param)}
    {centered(550, 'Full precision is used by Apply.')}
  </Drawing>;
}
function ExactLossTable({
  s,
  t
}) {
  return <div className="mp-basic-values" tabIndex={0} role="region" aria-label="Exact current and proposed supervised quantities">
    <table>
      <caption>Full-precision values used by Apply</caption>
      <thead>
        <tr>
          <th>Quantity</th>
          <th>Current</th>
          <th>Proposed</th>
        </tr>
      </thead>
      <tbody>
        {[['Weight', s.weight, t.nextWeight], ['Aggregate', t.a, t.a], ['Target', s.target, s.target], ['Prediction', t.prediction, t.nextPrediction], ['Half-squared loss', t.loss, t.nextLoss]].map(([name, a, b]) => <tr key={name}>
          <th>
            {name}
          </th>
          <td>
            {String(a)}
          </td>
          <td>
            {String(b)}
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
export function MessagePassingSupervisionExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s);
  return <Figure job="D12a" question="Which receiver teaches the shared weight?" controls={<>
      <Select label="Supervised receiver" value={s.receiver} options={nodes(3)} onChange={v => c.edit('receiver', v)} />
      <AggregationQuantity label="Supervised target" value={s.target} onChange={v => c.edit('target', v)} min={-8} max={8} revision={c.revisions['gcn-supervision'] ?? 0} />
      <AggregationQuantity label="Shared supervised weight" value={s.weight} onChange={v => c.edit('weight', v)} min={-4} max={4} revision={c.revisions['gcn-supervision'] ?? 0} />
      <Reset onClick={() => c.reset('supervision')} />
    </>} result={<>Receiver {s.receiver} uses current {s.rule === 'mean' ? 'P' : 'S'} aggregate {num(t.a)}. Its prediction {num(t.prediction)} minus target {num(s.target)} gives residual {num(t.residual)} and derivative {num(t.derivative)}. Target enters only the loss; graph/feature/loop edits above recompute this exact route.</>}>
    <Products label={`Receiver ${s.receiver} · current contributions`} coefficients={t.matrix[s.receiver]} values={s.x} receiver={s.receiver} divisors={t.d} />
    <LossCircuit s={s} t={t} />
    <GradientCircuit s={s} t={t} />
    <ExactLossTable s={s} t={t} />
  </Figure>;
}
export function MessagePassingApplyExtension() {
  const c = useGcnExtensions(),
    {
      s
    } = c,
    t = gcnTrace(s);
  return <Figure job="D12b" question="How large a weight step should be applied?" controls={<>
      <AggregationQuantity label="Exact step rate" value={s.rate} onChange={v => c.edit('rate', v)} min={0} max={1} revision={c.revisions['gcn-step'] ?? 0} />
      <button type="button" disabled={!t.applyAllowed} onClick={c.apply}>Apply exact weight step</button>
      <Reset onClick={() => c.reset('step')} />
    </>} result={<>Exact proposal {String(t.nextWeight)} changes loss {num(t.loss, 8)} → {num(t.nextLoss, 8)}. {t.applyAllowed ? 'Apply uses this full computed weight.' : `Outside ±4: Apply is disabled and current w=${String(s.weight)} is preserved. Reduce the rate; no clipping occurs.`} {t.a === 0 ? 'Aggregate zero gives derivative zero.' : `For this fixed quadratic, decreasing a nonzero residual requires 0 < η < ${Number.isFinite(t.stableRate) ? num(t.stableRate, 8) : '2/a² (beyond the offered rate range; the numeric threshold exceeds finite precision)'}.`} Bias remains outside this loss.</>}>
    <div className="mp-basic-grid">
      <LossCircuit s={s} t={t} />
      <LossCircuit s={s} t={t} proposed />
    </div>
    <GradientCircuit s={s} t={t} />
    <ExactLossTable s={s} t={t} />
    <figcaption>Current features [{s.x.join(', ')}], loops {String(s.loops)}, receiver {s.receiver} and {s.rule === 'mean' ? 'receiver-mean' : 'endpoint-degree'} operator are shared with the preceding figures. Rate zero is a null; a supported large step may increase the loss.</figcaption>
  </Figure>;
}
