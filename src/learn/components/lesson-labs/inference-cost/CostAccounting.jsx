import React, { useState } from 'react';
import * as m from "../../../data/inference-cost-models.js";
import { Figure, Controls, Choice, NumberControl, Select, Readout, Note, SafeResult, Bars, Strip, useSavedJson, Loading, n, money } from './CostPrimitives.jsx';
export function TokenObjects() {
  const state = useSavedJson('/learn/examples/inference-cost/native-prompts.json');
  const [which, setWhich] = useState('0'),
    [selected, setSelected] = useState(0);
  if (!state.data) return <Figure id="D01" label="Text bytes and token objects"><Loading state={state} /></Figure>;
  const data = state.data,
    fixtures = data.tokenizer_only_fixtures;
  const examples = [...data.requests, ...(fixtures || [])];
  const item = examples[Number(which)],
    text = item.source_text ?? item.text,
    ids = item.input_ids,
    offsets = item.offsets,
    index = Math.min(selected, ids.length - 1);
  const span = index >= 0 ? offsets[index] : null;
  return <Figure id="D01" label="Text bytes and token objects"><blockquote className="cost-text">{span ? <>{Array.from(text).slice(0, span[0]).join('')}<mark>{Array.from(text).slice(...span).join('')}</mark>{Array.from(text).slice(span[1]).join('')}</> : text || '(empty text)'}</blockquote><div className="cost-token-sequence">{ids.map((id, i) => <button type="button" key={i} aria-pressed={index === i} onClick={() => setSelected(i)}><span>position {i}</span><code>{item.pieces[i]}</code><span>ID {id}</span></button>)}</div><Readout>Whole text: {item.source_characters ?? item.codepoints} code points; {item.source_bytes_utf8 ?? item.utf8_bytes} UTF-8 bytes; {item.source_token_count ?? ids.length} tokenizer IDs. Selected model input: {ids.length} IDs.{span && <> Selected piece {index}: raw byte-token spelling <code>{item.pieces[index]}</code>; code-point interval [{span[0]}, {span[1]}).</>}</Readout><Controls><Select name="Exact saved input" value={which} options={examples.map((row, i) => [String(i), row.request_id || (row.text ? 'Unicode fixture' : 'Empty fixture')])} onChange={v => {
        setWhich(v);
        setSelected(0);
      }} /></Controls><Note>Saved tokenizer output, no added special tokens. The highlighted decoded span is distinct from the raw byte-token spelling. Output IDs appear in the later recorded model trace.</Note></Figure>;
}
export function RequestBill() {
  const [counts, setCounts] = useState([1000, 0, 0, 0, 200]);
  return <Figure id="D02" label="Disjoint bill categories"><SafeResult calculate={() => m.bill(counts)}>{result => <><Bars rows={result.parts.map(p => ({
          label: `${p.name}: ${p.count} × $${p.rate}/M`,
          value: p.usd,
          color: p.color
        }))} unit="USD" maximum={Math.max(.008, ...result.parts.map(p => p.usd))} label="Each charged category on the same money scale" /><Readout>Total ${result.exact}. Every input token belongs to one charged input category.</Readout></>}</SafeResult><Controls>{counts.map((count, i) => <NumberControl key={i} name={m.categoryNames[i]} value={count} onChange={value => setCounts(old => old.map((x, j) => i === j ? value : x))} />)}<button type="button" onClick={() => setCounts([1000, 0, 0, 0, 200])}>Reset request</button></Controls><Note>Constructed usage; dated quoted rates. Integer tenths of a micro-dollar preserve exact category arithmetic.</Note></Figure>;
}
export function Reservation() {
  const [active, setActive] = useState(80),
    [devices, setDevices] = useState(2),
    [contract, setContract] = useState('reserved');
  return <Figure id="D04" label="Occupied and reserved device time"><SafeResult calculate={() => m.rental(active, devices, contract)}>{r => <><div className="cost-lanes">{Array.from({
            length: devices
          }, (_, i) => <div key={i}><span>Device {i + 1}; horizon 720 hours</span><Strip pieces={[{
              label: 'Busy',
              value: active,
              color: m.identityColors[i % 5]
            }, {
              label: 'Idle',
              value: 720 - active,
              color: '#555'
            }]} total={720} /></div>)}</div><Readout>{devices} devices × {n(r.hours)} billable hours × $4.29 = {money(r.charge, 2)}. {active === 0 && 'No work: cost per completed token is undefined.'}</Readout></>}</SafeResult><Controls><NumberControl name="Active hours" value={active} max={720} onChange={setActive} /><NumberControl name="Devices" value={devices} max={8} onChange={setDevices} /><Choice name="Billing assumption" value={contract} onChange={setContract} options={[['reserved', '720-hour reservation'], ['active', 'Active hours only']]} /></Controls><Note>The lanes retain the full horizon. Choosing another contract changes which hours are billed.</Note></Figure>;
}
export function HardwareDenominator() {
  const [fraction, setFraction] = useState(.25),
    [rate, setRate] = useState(200);
  return <Figure id="D13" label="Hardware expense and delivered output denominator"><SafeResult calculate={() => m.hardwareCost(fraction, rate)}>{r => <><div className="cost-equation-chain"><span className="cost-device">Device A<br />720 h × $4.29</span><span>+</span><span className="cost-device">Device B<br />720 h × $4.29</span><span>→ {money(r.charge, 2)}</span></div><Strip total={1} pieces={[{
          label: 'Delivering output',
          value: fraction,
          color: '#59d9ed'
        }, {
          label: 'Other reserved time',
          value: 1 - fraction,
          color: '#555'
        }]} /><Readout>{rate} aggregate tokens/s × {fraction} × 2,592,000 s = {n(r.tokens)} output tokens. Hardware expense per million output tokens: {money(r.perMillion, 6)}.</Readout></>}</SafeResult><Controls><NumberControl name="Delivered fraction" value={fraction} max={1} step={.05} onChange={setFraction} /><NumberControl name="Aggregate output tokens/s" value={rate} onChange={setRate} /></Controls><Note>Constructed occupancy and aggregate rate. Successful tasks, input tokens and provider margin remain unknown.</Note></Figure>;
}
export function Attribution() {
  const [a, setA] = useState(.5),
    [b, setB] = useState(.25),
    [known, setKnown] = useState(true),
    [storage, setStorage] = useState(0);
  return <Figure id="D14" label="Expense attribution"><SafeResult calculate={() => m.attribution(a, b, storage, known)}>{r => <>{r.allocations ? <Strip total={r.lease} pieces={r.allocations.map((value, i) => ({
          value,
          label: ['Workload A', 'Workload B', 'Unallocated'][i],
          color: m.identityColors[i]
        }))} /> : <div className="cost-unknown">Lease $6,177.60 — allocation unknown</div>}<Readout>Lease {money(r.lease, 2)} + independent storage {money(storage, 2)} = {money(r.total, 2)}. Attribution partitions the lease; it does not add another expense.</Readout></>}</SafeResult><Controls><NumberControl name="Workload A share" value={a} step={.05} max={1} onChange={setA} /><NumberControl name="Workload B share" value={b} step={.05} max={1} onChange={setB} /><NumberControl name="Separate storage USD" value={storage} onChange={setStorage} /><Choice name="Attribution policy" value={known} onChange={setKnown} options={[[true, 'Declared shares'], [false, 'Unknown allocation']]} /></Controls></Figure>;
}
export function PrefixBilling({
  timing = false
}) {
  const [pattern, setPattern] = useState('ordinary'),
    [ttl, setTtl] = useState(300),
    [delay, setDelay] = useState(0),
    [prefix, setPrefix] = useState(900),
    [changed, setChanged] = useState(false),
    [cached, setCached] = useState(true);
  const starts = pattern === 'late' ? [0, 360, 720] : pattern === 'overlap' ? [0, 1, 5] : [0, 120, 240];
  const r = m.prefixCosts({
    starts,
    ttl,
    delay,
    prefix,
    identities: ['P', changed ? 'Q' : 'P', 'P'],
    cached
  });
  return <Figure id={timing ? 'D21' : 'D20'} label={timing ? 'Cache availability and expiry' : 'Shared prefix billing'}><div className="cost-prefix-groups">{(cached && prefix > 0 ? [...new Set(r.rows.map(row => row.identity))] : ['absent']).map(identity => <div className="cost-prefix-root" key={identity}><strong style={{
          borderColor: identity === 'Q' ? '#ff83ad' : '#b595ff'
        }}>{identity === 'absent' ? prefix === 0 ? 'Zero prefix tokens · no reusable ancestor' : 'Cache disabled · no reusable ancestor' : `Prefix ${identity} · ${prefix} tokens`}</strong><div className="cost-prefix-branches">{r.rows.map((row, i) => identity === 'absent' || row.identity === identity ? <div key={i} className="cost-request" style={{
            borderColor: identity === 'Q' ? '#ff83ad' : '#b595ff'
          }}>{identity !== 'absent' && <span className="cost-prefix-stem">↓ from prefix {identity}</span>}<span>Request {['A', 'B', 'C'][i]} · prefix {row.identity}</span><span className="cost-prefix-stem">{prefix === 0 ? 'no prefix to read or write' : row.hit ? `read from ${['A', 'B', 'C'][row.source]}` : cached ? 'new write' : 'uncached'}</span><span>100-token private suffix → 200-token output</span><Strip pieces={row.parts.filter(p => p.count).map(p => ({
              label: p.name,
              value: p.count,
              color: p.color
            }))} /><strong>{money(row.usd)}</strong></div> : null)}</div></div>)}</div>{timing && <div className="cost-timeline" role="group" aria-label="Time in seconds"><CacheTimeAxis rows={r.rows} /><div className="cost-timeline-grid">{r.rows.map((row, i) => <div key={i}><strong>{['A', 'B', 'C'][i]} at {row.start}s</strong><span> → {row.hit ? 'read and refresh' : 'miss; independent pending write'}</span><span>Available {row.available}s ≤ request start &lt; expires {row.expires}s</span></div>)}</div><Note>Each row records expiry immediately after that event. Reads refresh the eligible write with latest expiry. Pending writes do not erase earlier eligible writes.</Note></div>}<Readout>Total {money(r.total)}; uncached comparison {money(m.prefixCosts({
        starts,
        prefix,
        cached: false
      }).total)}.</Readout><Controls>{timing ? <><Choice name="Arrival pattern" value={pattern} onChange={setPattern} options={[['ordinary', '0 / 120 / 240 s'], ['late', '0 / 360 / 720 s'], ['overlap', '0 / 1 / 5 s']]} /><Choice name="Lifetime" value={ttl} onChange={setTtl} options={[[300, 'Five minutes'], [3600, 'One hour']]} /><NumberControl name="Write availability delay (s)" value={delay} max={100} onChange={v => setDelay(v === "" ? 0 : Math.max(0, Math.min(100, v)))} /></> : <><NumberControl name="Common prefix tokens" value={prefix} max={10000} onChange={v => setPrefix(v === "" ? 0 : Math.max(0, Math.min(10000, Math.floor(v))))} /><Choice name="Request B identity" value={changed} onChange={setChanged} options={[[false, 'Same prefix P'], [true, 'Different prefix Q']]} /><Choice name="Cache" value={cached} onChange={setCached} options={[[true, 'Enabled'], [false, 'Uncached']]} /></>}</Controls><Note>Constructed cache contract, suffix and output counts. Identity, availability and lifetime jointly determine reuse.</Note></Figure>;
}
export function MixedUsage() {
  const [mode, setMode] = useState('complete');
  const r = m.mixedUsage(mode);
  return <Figure id="D22" label="Mixed cache usage fields"><div className="cost-json-tree"><span>input_tokens: 2048 → uncached</span><span>cache_read_input_tokens: 1800 → read</span><strong>cache_creation_input_tokens: 248 → parent subtotal only</strong><div>↳ ephemeral_5m_input_tokens: {mode === 'missing' ? '?' : 148}<br />↳ ephemeral_1h_input_tokens: {mode === 'inconsistent' ? 101 : 100}</div><span>output_tokens: 503 → output</span></div>{r.valid ? <Bars rows={r.parts.map(p => ({
      label: p.name,
      value: p.usd,
      color: p.color
    }))} unit="USD" /> : null}<Readout>{r.valid ? `Total $${r.exact}. The 248 parent subtotal is not a sixth billed category.` : `Unresolved: ${r.reason}`}</Readout><Controls><Choice name="Returned usage case" value={mode} onChange={setMode} options={[['complete', 'Complete'], ['missing', 'Missing TTL split'], ['inconsistent', 'Inconsistent subtotal'], ['reversed', 'Reversed TTL boundary']]} /></Controls><Note>Saved documentation example, not a paid request invoice.</Note></Figure>;
}
export function Aggregation() {
  const [zero, setZero] = useState(false),
    [known, setKnown] = useState(true);
  const r = m.aggregation(zero, known);
  return <Figure id="D31" label="Joined request and task denominators"><div className="cost-join">{r.rows.map((row, i) => <div key={row.id} style={{
        borderColor: m.identityColors[i]
      }}>Request {row.id} → attempt {row.id} → task {row.id}<br />{money(row.cost)}; {row.tokens} output tokens<br />Outcome: {known ? 'recorded success' : 'missing'}</div>)}</div><Strip pieces={r.rows.map((row, i) => ({
      label: `Request ${row.id} output denominator`,
      value: row.tokens,
      color: m.identityColors[i]
    }))} /><Readout>Total expense {money(r.cost)} / {r.tokens} total output tokens = {money(r.ratio, 8)} per output token. Unweighted mean of request ratios: {money(r.mean)}. {known ? 'Two successful tasks give $0.017 per success.' : 'Cost per successful task is unresolved: outcomes are missing.'}</Readout><Controls><Choice name="Output count" value={zero} onChange={setZero} options={[[false, '20 and 300'], [true, 'Both zero']]} /><Choice name="Outcome join" value={known} onChange={setKnown} options={[[true, 'Known outcomes'], [false, 'Missing outcomes']]} /></Controls></Figure>;
}
function CacheTimeAxis({
  rows
}) {
  const end = Math.max(1, ...rows.map(row => row.expires || row.start)),
    x = t => 90 + 500 * t / end;
  return <><div className="cost-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable quantitative drawing"><svg className="cost-chart" viewBox="0 0 660 235" role="img" aria-label="Request starts, independent write availability and exclusive expiry in seconds">{rows.map((row, i) => <g key={i}><text x="5" y={48 + i * 52}>Request {['A', 'B', 'C'][i]}</text><line x1={x(row.start)} y1={58 + i * 52} x2={x(row.available)} y2={58 + i * 52} style={{
            stroke: '#888',
            strokeWidth: 8,
            strokeDasharray: '4 3'
          }} /><line x1={x(row.available)} y1={58 + i * 52} x2={x(row.expires)} y2={58 + i * 52} style={{
            stroke: row.hit ? '#59d9ed' : '#ffc04d',
            strokeWidth: 8
          }} /><circle cx={x(row.start)} cy={58 + i * 52} r="7" fill="#fff" stroke="#111" /><circle cx={x(row.expires)} cy={58 + i * 52} r="6" fill="#111" stroke={row.hit ? '#59d9ed' : '#ffc04d'} strokeWidth="2" /><text x={x(row.start)} y={39 + i * 52}>{row.start}s</text><text x={x(row.expires)} y={81 + i * 52} textAnchor="end">expiry {row.expires}s</text></g>)}<line x1="90" y1="195" x2="590" y2="195" /><text x="90" y="220">0</text><text x="290" y="220">time · seconds</text><text x="590" y="220" textAnchor="end">{end}</text></svg></div><Note>White dot: request start. Dashed segment: pending write. Coloured segment: available interval; open endpoint excludes expiry. Each lane is the state immediately after that request.</Note></>;
}
