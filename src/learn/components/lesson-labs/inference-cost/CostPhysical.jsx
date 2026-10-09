import React, { useState } from 'react';
import * as m from "../../../data/inference-cost-models.js";
import { Figure, Controls, Choice, NumberControl, Readout, Note, SafeResult, Bars, Strip, Matrix, n } from './CostPrimitives.jsx';
export function SequenceWork() {
  const [input, setInput] = useState(16),
    [output, setOutput] = useState(2);
  return <Figure id="D03" label="Prefill and dependent decode work"><div className="cost-sequence-work"><div><strong>Prefill: {input} input query rows</strong><span className="cost-causal-axes">Query index ↓ · retained key index →</span><div className="cost-causal" style={{
          gridTemplateColumns: `repeat(${Math.max(1, input)}, 1.5em)`
        }}>{Array.from({
            length: input * input
          }, (_, k) => <span key={k} className={k % input <= Math.floor(k / input) ? 'cost-attends' : ''} title={`query ${Math.floor(k / input)} / key ${k % input}`} />)}</div><span>Each row attends to itself and earlier input positions.</span></div><div className="cost-decode"><strong>Selected outputs and next queries</strong>{Array.from({
          length: output
        }, (_, i) => <div key={i}><span className="cost-output-dot">output {i + 1}</span>{i < output - 1 && <><span> ↓ supplied as one query</span><span className="cost-history">attend to {input + i + 1} retained positions →</span></>}</div>)}{output === 0 && <span>No emitted output selected.</span>}</div></div><Readout>{input} prefill query rows; {Math.max(0, output - 1)} subsequent decode forwards for {output} outputs under this drawing's schedule. Billed input {input}; billed output {output}.</Readout><Controls><Choice name="Work shape" value={`${input}-${output}`} onChange={v => {
        const [i, o] = v.split('-').map(Number);
        setInput(i);
        setOutput(o);
      }} options={[['16-2', 'Long input / short output'], ['2-16', 'Short input / long output'], ['16-0', 'Zero emitted output']]} /></Controls><Note>Constructed schedule. Zero emitted output is an accounting case; this drawing does not prescribe a native engine's zero-cap execution policy.</Note></Figure>;
}
export function WeightBytes() {
  const [parameters, setParameters] = useState(7e9),
    [bytes, setBytes] = useState(2),
    [known, setKnown] = useState(true);
  const r = m.weightStorage(parameters, bytes);
  return <Figure id="D05" label="Parameter elements occupy byte cells">
    {known ? <><div className="cost-element-tiles">{Array.from({
          length: Math.min(14, parameters / 1e9)
        }, (_, i) => <div key={i} style={{
          borderColor: m.physicalColors.weights
        }}>1B elements<div>{Array.from({
              length: bytes
            }, (_, j) => <i key={j} style={{
              background: m.physicalColors.weights
            }} />)}</div>{bytes}B per element</div>)}{parameters === 0 && <span className="cost-empty-region">Zero stored elements: empty weight extent</span>}</div>
      <Bars rows={[{
        label: 'Weight element bytes',
        value: r.occupied,
        color: m.physicalColors.weights
      }, {
        label: 'Device capacity',
        value: r.capacity,
        color: m.physicalColors.free
      }]} maximum={Math.max(r.occupied, r.capacity)} unit="bytes" label="One common byte scale" />
      <Readout>{n(parameters)} × {bytes} = {n(r.occupied)} bytes ({n(r.occupied / 1e9)} GB). {r.overflow ? `${n(r.overflow)} bytes exceed device capacity.` : `${n(r.free)} bytes remain before other occupants.`}</Readout></> : <><div className="cost-unknown" aria-label="Unknown weight extent">Unknown element count × {bytes} bytes per element → unknown occupied extent</div><Readout>Storage is unresolved: parameter count is unknown.</Readout></>}
    <Controls><Choice name="Stored parameters" value={parameters} onChange={setParameters} disabled={!known} options={[[7e9, '7 billion'], [70e9, '70 billion'], [0, 'Zero']]} /><Choice name="Element bytes" value={bytes} onChange={setBytes} options={[[1, '1 byte'], [2, '2 bytes'], [4, '4 bytes']]} /><Choice name="Parameter evidence" value={known} onChange={setKnown} options={[[true, 'Known count'], [false, 'Unknown count']]} /></Controls>
    <Note>{known ? 'Each tile represents one billion elements; at most fourteen tiles are shown. The exact count and common-scale bar retain the complete amount.' : 'Hatching means unknown extent, not occupied elements. The disabled count is preserved for the known-count example; no total storage bar is inferred.'} Each element still uses the selected byte count. Quantization metadata and other runtime state are additional.</Note>
  </Figure>;
}
export function CacheBytes() {
  const [heads, setHeads] = useState(8),
    [query, setQuery] = useState(32),
    [positions, setPositions] = useState(4096),
    [requests, setRequests] = useState(4),
    [unequal, setUnequal] = useState(false);
  const lengths = [4096, 2048, 1024, 512],
    shownPositions = unequal ? lengths[0] : positions,
    hasRequest = unequal || requests > 0;
  return <Figure id="D06" label="KV tensor axes"><SafeResult calculate={() => m.kvStorage({
      heads,
      positions,
      requests,
      lengths: unequal ? lengths : null
    })}>{r => <>
    {unequal && <p>Four requests: A 4,096 + B 2,048 + C 1,024 + D 512 = 7,680 total positions. The slabs below represent request A only.</p>}
    <div className="cost-tensor-pair">{['K', 'V'].map(kind => <div key={kind} className="cost-tensor" style={{
            '--entity-color': m.physicalColors[kind]
          }}><strong>{kind} · one layer · {hasRequest ? 'request A' : 'no requests'}</strong>
      {hasRequest && shownPositions > 0 ? <div className="cost-tensor-slabs">{Array.from({
                length: Math.min(heads, 8)
              }, (_, h) => <div key={h}>head {h}<div className="cost-tensor-grid">{Array.from({
                    length: 12
                  }, (_, i) => <i key={i} />)}</div></div>)}</div> : <div className="cost-empty-region">{hasRequest ? 'Position axis: 0 positions — no occupied K/V cells' : 'Request axis: 0 requests — no occupied K/V cells'}</div>}
      <span>axes: {heads} KV heads × {hasRequest ? shownPositions : 0} positions × 128 values<br />2 bytes per value</span></div>)}</div>
    <Readout>2 tensors × 32 layers × {heads} KV heads × 128 width × {n(r.positions)} total request positions × 2 bytes = {n(r.bytes)} bytes ({n(r.bytes / 2 ** 30)} GiB). Query heads: {query}; {query / heads} query heads share each KV head. Query heads do not enter this stored tensor count.</Readout></>}</SafeResult>
    <Controls><Choice name="KV heads" value={heads} onChange={setHeads} options={[[1, '1 KV head'], [4, '4 KV heads'], [8, '8 KV heads'], [32, '32 KV heads']]} /><Choice name="Query heads (held separate)" value={query} onChange={setQuery} options={[[32, '32 query heads'], [64, '64 query heads']]} /><NumberControl name="Positions per request" value={positions} max={8192} step={512} onChange={setPositions} disabled={unequal} /><NumberControl name="Requests" value={requests} max={16} onChange={setRequests} disabled={unequal} /><Choice name="Lengths" value={unequal} onChange={setUnequal} options={[[false, 'Equal lengths'], [true, 'Four: 4096 / 2048 / 1024 / 512']]} /></Controls>
    <Note>Slabs expose axis structure; tiny grid cells are illustrative samples, not individual values at full tensor size. Up to eight KV heads are drawn; axis labels and arithmetic retain the complete count. All offered query/KV pairs divide exactly. Unequal mode fixes four lengths and disables the preserved equal-length controls.</Note>
  </Figure>;
}
export function DeviceFit() {
  const [requests, setRequests] = useState(4),
    [positions, setPositions] = useState(4096);
  return <Figure id="D07" label="Whole caches fit within device bytes"><SafeResult calculate={() => m.memoryFit(requests, positions)}>{r => <><div className="cost-device-capacity"><span>Device boundary: 24,000,000,000 bytes</span><Strip total={Math.max(r.device, r.occupied)} pieces={[{
            label: 'Weights',
            value: r.weights,
            color: m.physicalColors.weights
          }, {
            label: 'Workspace',
            value: r.workspace,
            color: m.physicalColors.workspace
          }, ...Array.from({
            length: requests
          }, (_, i) => ({
            label: `Request ${i + 1} KV`,
            value: r.perRequest,
            color: i % 2 ? m.physicalColors.V : m.physicalColors.K
          })), {
            label: 'Free',
            value: Math.max(0, r.device - r.occupied),
            color: m.physicalColors.free
          }]} /></div><Bars rows={[{
          label: 'All occupants',
          value: r.occupied,
          color: r.fits ? '#59d9ed' : '#ff83ad'
        }, {
          label: 'Device boundary',
          value: r.device,
          color: '#888'
        }]} unit="bytes" /><Readout>{n(r.occupied)} occupied bytes: {r.fits ? 'fits' : 'does not fit'}. {n(r.perRequest)} bytes per request; maximum {r.maximum === null ? 'unbounded under this zero-cache-only estimate' : r.maximum} whole caches after weights and workspace.</Readout></>}</SafeResult><Controls><NumberControl name="Concurrent requests" value={requests} max={32} onChange={setRequests} /><NumberControl name="Context positions" value={positions} max={8192} step={512} onChange={setPositions} /><button type="button" onClick={() => {
        setRequests(14);
        setPositions(4096);
      }}>Last fitting count</button><button type="button" onClick={() => {
        setRequests(15);
        setPositions(4096);
      }}>First overflowing count</button></Controls></Figure>;
}
export function Experts() {
  const [selected, setSelected] = useState([0]),
    [sharded, setSharded] = useState(false);
  return <Figure id="D08" label="Resident and active expert parameters"><div className="cost-experts"><div className="cost-shared">Shared weights<br />1B parameters · always used</div><span>router ↓ selects outlined experts</span><div className="cost-expert-grid">{[0, 1, 2, 3].map(i => <button key={i} type="button" style={{
          '--entity-color': m.identityColors[i]
        }} aria-pressed={selected.includes(i)} onClick={() => setSelected(v => v.includes(i) ? v.filter(x => x !== i) : [...v, i].slice(-2))}>Expert {i + 1}<br />6B resident parameters<br />{sharded ? `device ${i < 2 ? 'A' : 'B'}` : 'same device'}</button>)}</div>{sharded && <div className="cost-dependency">Device A ↔ routed activations / collective dependency ↔ Device B<br />Communication cost: unknown</div>}</div><Readout>Resident: 1B + 4 × 6B = 25B parameters = 50 GB at two bytes. Selected active path: {1 + 6 * selected.length}B parameters. {selected.length === 0 ? 'Shared-only state illustrates counting; it is not a valid complete expert inference.' : 'Unselected expert weights remain resident.'}</Readout><Controls><Choice name="Placement" value={sharded} onChange={setSharded} options={[[false, 'One placement'], [true, 'Split across devices']]} /><button type="button" onClick={() => setSelected([0])}>Reset one selected expert</button></Controls><Note>Select up to two experts. Colour identifies each expert; the white outline records selection.</Note></Figure>;
}
export function Projection() {
  const [batch, setBatch] = useState(2),
    [selected, setSelected] = useState([0, 0]);
  const r = m.projection(batch),
    [i, j] = [Math.min(selected[0], Math.max(0, batch - 1)), selected[1]];
  return <Figure id="D09" label="Matrix products and compulsory traffic"><div className="cost-matrix-equation"><Matrix rows={r.x} label={`X · ${batch}×3`} selectedRow={i} color="#5da9ff" /><span>×</span><Matrix rows={r.w} label="W · 4×3 (transpose in product)" selectedRow={j} color="#b595ff" /><span>→</span><Matrix rows={r.y} label={`Y · ${batch}×4`} selected={[i, j]} onSelect={setSelected} color="#59d9ed" /></div><Readout>{batch > 0 ? `Y[${i},${j}] = ${r.x[i].map((x, k) => `${x}×${r.w[j][k]}`).join(' + ')} = ${r.y[i][j]}. ` : 'No output rows. '}Nominal multiply/add operations: {r.operations}; compulsory two-byte traffic: {r.bytes} bytes; {n(r.intensity)} operations/byte.</Readout><Controls><Choice name="Input rows" value={batch} onChange={setBatch} options={[[2, 'Two rows'], [8, 'Eight rows'], [0, 'Zero rows']]} /></Controls><Note>All eight repeated rows remain visible. Zero rows retain the declared weight-read term only as a counting convention; no real empty kernel traffic is claimed.</Note></Figure>;
}
export function PrefillDecodeProjection() {
  const [batch, setBatch] = useState(4),
    [history, setHistory] = useState(16);
  const prefill = m.projection(16),
    decode = m.projection(batch);
  return <Figure id="D10" label="Shared projection weights and private history">
    <div className="cost-shared-read"><Matrix rows={m.matrixW} label="Shared W · 4×3 · one compulsory read per compared projection" color="#b595ff" />
      <div className="cost-weight-fanout"><span>W ↓ every prefill row</span><span>W ↓ every decode request</span></div>
      <div className="cost-two-branches"><div><strong>Prefill · 16 query rows</strong><div className="cost-query-rows">{Array.from({
              length: 16
            }, (_, i) => <span key={i}>x[{i}] × Wᵀ → y[{i}]</span>)}</div><span>{prefill.operations} operations; {prefill.bytes} bytes</span></div>
      <div><strong>Decode · {batch} requests × one query</strong>{Array.from({
            length: batch
          }, (_, i) => <div className="cost-private-history" key={i} style={{
            borderColor: m.identityColors[i]
          }}><strong style={{
              color: m.identityColors[i]
            }}>Request {i + 1}</strong><div>x[{i}] × shared Wᵀ → y[{i}]</div><div>query ↓ reads its private K and V</div>
        <div>Retained position → {history ? `0 through ${history - 1}` : 'empty'}</div>
        <div key={history} className="cost-private-cache" tabIndex={0} role="region" aria-label={`Request ${i + 1} private K and V positions; use arrow keys to pan`}><div className="cost-private-cache-inner">
          {['K', 'V'].map(kind => <div key={kind} className="cost-history-row" style={{
                  '--cache-color': m.physicalColors[kind]
                }}><strong>{kind}</strong>{Array.from({
                    length: history
                  }, (_, p) => <span key={p} title={`Request ${i + 1} ${kind} position ${p}`}>{p}</span>)}{history === 0 && <em className="cost-empty-region">0 positions</em>}</div>)}
        </div></div></div>)}<span>{decode.operations} operations; {decode.bytes} bytes</span></div></div></div>
    <Readout>Projection-only traffic includes X, W and Y. History {history} changes private attention work; it does not remove this projection. Full attention and runtime traffic are additional.</Readout>
    <Controls><Choice name="Decode batch" value={batch} onChange={setBatch} options={[[1, 'One request'], [4, 'Four requests']]} /><Choice name="Retained positions" value={history} onChange={setHistory} options={[[16, '16 positions'], [32, '32 positions'], [0, 'Empty history']]} /></Controls>
    <Note>Each numbered cell is one retained position, not a byte measurement. K and V have distinct colours; each request keeps its own identity border and private regions. Pan a cache with arrow keys to reach its last position. The two projection cases are alternatives; the shared-W arrows show reuse within each case.</Note>
  </Figure>;
}
export function Roofline() {
  const [batch, setBatch] = useState(false),
    [arithmetic, setArithmetic] = useState(100),
    [bandwidth, setBandwidth] = useState(1);
  return <Figure id="D11" label="Arithmetic and traffic lower bounds"><SafeResult calculate={() => m.roofline(batch, arithmetic, bandwidth)}>{r => <><Bars rows={[{
          label: 'Arithmetic pipeline',
          value: r.mathMs,
          color: '#b595ff'
        }, {
          label: 'Traffic pipeline',
          value: r.trafficMs,
          color: '#59d9ed'
        }]} maximum={Math.max(40, r.mathMs, r.trafficMs)} unit="ms" /><RooflinePlot result={r} arithmetic={arithmetic} bandwidth={bandwidth} /><Readout>max({n(r.mathMs)} ms, {n(r.trafficMs)} ms) = {n(r.boundMs)} ms under ideal overlap; {n(r.perItemMs)} ms per item. Intensity {n(r.intensity)} FLOP/byte; crossover {n(r.crossover)} FLOP/byte.</Readout></>}</SafeResult><Controls><Choice name="Work item" value={batch} onChange={setBatch} options={[[false, '400 GFLOP / 20 GB'], [true, 'Eight: 3.2 TFLOP / 22 GB']]} /><NumberControl name="Usable TFLOP/s" value={arithmetic} step={10} onChange={setArithmetic} /><NumberControl name="Usable TB/s" value={bandwidth} step={.25} onChange={setBandwidth} /></Controls><Note>Constructed lower bound, not measured latency. The slower pipeline limits the overlapped result.</Note></Figure>;
}
export function Parallelism() {
  const [batch, setBatch] = useState(false),
    [overlap, setOverlap] = useState(false),
    [communication, setCommunication] = useState('3'),
    [selected, setSelected] = useState([0, 0]);
  const r = m.projection(batch ? 4 : 1),
    i = Math.min(selected[0], r.x.length - 1),
    j = selected[1],
    shard = j < 2 ? 'A' : 'B';
  return <Figure id="D12" label="Output tiles and dependent communication">
    <div className="cost-processor-lanes">{[0, 1, 2, 3].map(lane => <div key={lane}><strong>Processing lane {lane + 1}</strong>{[0, 1, 2, 3].map(tile => <span key={tile} className={batch || lane === 0 ? 'cost-tile-active' : 'cost-tile-idle'} style={{
          '--entity-color': m.identityColors[lane]
        }}>{batch || lane === 0 ? `Y[${lane},${tile}] → ${tile < 2 ? 'A' : 'B'}` : 'idle'}</span>)}</div>)}</div>
    <div className="cost-device-shards">{['A', 'B'].map((device, d) => <div key={device}><strong>Device {device} · columns {d * 2}–{d * 2 + 1}</strong><div className="cost-shard-tiles">{r.y.flatMap((row, a) => row.map((value, b) => b >= d * 2 && b < d * 2 + 2 ? <button type="button" key={`${a}-${b}`} aria-pressed={i === a && j === b} onClick={() => setSelected([a, b])}>Y[{a},{b}]={value}</button> : null))}</div></div>)}</div>
    <div className="cost-matrix-equation"><Matrix rows={r.x} label="X rows · selected input subregion" selectedRow={i} color="#5da9ff" /><span>×</span><Matrix rows={r.w} label="W rows · selected output-column weights" selectedRow={j} color="#b595ff" /></div>
    <p>Selected tile Y[{i},{j}] on device {shard}: {r.x[i].map((x, k) => `${x}×${r.w[j][k]}`).join(' + ')} = {r.y[i][j]}. White outlines connect its input and weight rows to the selected output tile.</p>
    <CommunicationSchedule overlap={overlap} communication={communication} />
    <Readout>{communication === 'unknown' ? 'End-to-end bound is unresolved: communication duration is unknown.' : `${overlap ? 'Declared valid overlap: max' : 'Serial dependency: sum'}(32, ${communication}) = ${overlap ? Math.max(32, Number(communication)) : 32 + Number(communication)} ms.`} {batch ? 'More output tiles expose more independent work.' : 'A small work item leaves most lanes idle.'}</Readout>
    <Controls><Choice name="Available independent tiles" value={batch} onChange={setBatch} options={[[false, 'Small matrix'], [true, 'Batched matrix']]} /><Choice name="Dependency schedule" value={overlap} onChange={setOverlap} options={[[false, 'Unoverlapped collective'], [true, 'Explicitly valid overlap']]} /><Choice name="Communication" value={communication} onChange={setCommunication} options={[["3", '3 ms'], ["0", 'Zero'], ["unknown", 'Unknown']]} /></Controls>
    <Note>Constructed tile and dependency models. In the compatible overlap example, collective inputs are ready at 0 ms; independent compute runs concurrently. Both lanes must finish before the next dependent stage. The serial example makes collective inputs available only after compute. These alternative assumptions do not assert that an arbitrary same-layer collective can overlap its producer.</Note>
  </Figure>;
}
function CommunicationSchedule({
  overlap,
  communication
}) {
  const known = communication !== 'unknown',
    duration = known ? Number(communication) : null,
    start = overlap ? 0 : 32,
    end = known ? overlap ? Math.max(32, duration) : 32 + duration : null;
  const x = t => 150 + t * 12;
  return <><div className="cost-chart-scroll" tabIndex={0} role="region" aria-label="Compute and communication dependency schedule; use arrow keys to pan"><svg className="cost-chart" viewBox="0 0 690 310" role="img" aria-label={known ? `${overlap ? 'Concurrent' : 'Serial'} compute and collective join at ${end} milliseconds` : 'Compute 32 milliseconds; collective duration and join time unknown'}>
    <defs><marker id="cost-schedule-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="#ddd" /></marker></defs>
    <text x="8" y="58">Compute</text><text x="8" y="141">Collective</text>
    <rect x={x(0)} y="35" width={32 * 12} height="38" fill="#b595ff" fillOpacity=".3" stroke="#b595ff" /><text x={x(16)} y="60" textAnchor="middle">0–32 ms</text>
    {known && duration > 0 && <><rect x={x(start)} y="115" width={duration * 12} height="38" fill="#59d9ed" fillOpacity=".4" stroke="#59d9ed" /><text x={x(start)} y="180">{start}–{start + duration} ms</text></>}
    {known && duration === 0 && <text x="150" y="141">No communication interval · 0 ms</text>}
    {!known && <><rect x={x(start)} y="115" width={overlap ? 190 : 65} height="38" fill="#29292e" stroke="#bbb" strokeDasharray="5 4" /><text x="150" y="190">Unknown duration: dashed box is not a time extent</text></>}
    {!overlap && (duration === null || duration > 0) && <path d={`M ${x(32)} 73 V 101 H ${x(start)} V 115`} fill="none" stroke="#ddd" markerEnd="url(#cost-schedule-arrow)" />}
    {overlap && <><path d="M 130 20 V 134 H 145" fill="none" stroke="#ddd" markerEnd="url(#cost-schedule-arrow)" /><path d="M 130 54 H 145" fill="none" stroke="#ddd" markerEnd="url(#cost-schedule-arrow)" /><text x="150" y="18">Ready independent inputs at 0 ms</text></>}
    <path d={`M ${x(32)} 73 V 215 H 575 V 232`} fill="none" stroke="#ddd" markerEnd="url(#cost-schedule-arrow)" />
    {(duration === null || duration > 0) && <path d={`M ${known ? x(start + duration) : x(start) + (overlap ? 190 : 65)} 153 V 205 H 625 V 232`} fill="none" stroke="#59d9ed" markerEnd="url(#cost-schedule-arrow)" />}
    <rect x="450" y="235" width="220" height="55" fill="#17171b" stroke="#ddd" /><text x="560" y="257" textAnchor="middle">Join → next stage</text><text x="560" y="280" textAnchor="middle">{known ? `ready at ${end} ms` : 'ready time unknown'}</text>
    <line x1="150" y1="300" x2="570" y2="300" /><text x="150" y="284">0</text><text x="280" y="284">Time · ms</text>
  </svg></div><Note>Horizontal filled interval lengths use one time scale. The join box is a dependency node, not additional elapsed work.</Note></>;
}
function RooflinePlot({
  result,
  arithmetic,
  bandwidth
}) {
  const maxX = Math.max(result.crossover, result.intensity) * 1.5;
  const x = value => 70 + 510 * value / maxX,
    y = value => 210 - 150 * value / arithmetic;
  return <><div className="cost-chart-scroll" tabIndex={0} role="region" aria-label="Roofline plot"><svg className="cost-chart" viewBox="0 0 640 275" role="img" aria-label="Roofline with a linear FLOP-per-byte axis and a linear usable teraflops-per-second axis">
    <line x1="70" y1="210" x2="600" y2="210" /><line x1="70" y1="210" x2="70" y2="25" />
    <text x="75" y="20">Usable TFLOP / s</text><text x="220" y="266">Intensity · FLOP / byte</text>
    <polyline points={`70,210 ${x(result.crossover)},60 ${x(maxX)},60`} fill="none" stroke="#b595ff" strokeWidth="4" />
    <circle cx={x(result.intensity)} cy={y(Math.min(arithmetic, result.intensity * bandwidth))} r="7" fill="#59d9ed" />
    <text x="60" y="215" textAnchor="end">0</text><text x="60" y="65" textAnchor="end">{n(arithmetic)}</text>
    <text x="70" y="236">0</text><text x={x(result.crossover)} y="236" textAnchor="middle">{n(result.crossover)}</text><text x="590" y="236" textAnchor="end">{n(maxX)}</text>
  </svg></div><Note>Violet line: throughput ceiling. Cyan point: selected work intensity. Both axes are linear; the bend occurs where arithmetic and traffic limits meet.</Note></>;
}
