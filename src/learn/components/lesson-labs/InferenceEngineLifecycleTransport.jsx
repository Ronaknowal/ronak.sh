import React, { useState } from 'react';
import { Figure, Controls, Select, Slider, Readout, Local, Table, Drawing, Wire, Box, fmt, colours } from './InferenceEngineElements';
import { anchorJobs, runEngine, packedPrompts, decodeSteps, commitRecords, terminalPhases, utf8Wire, parseWire, sseFixtures, sharedOwnership } from '../../data/inference-engine-lifecycle-models';
import './inference-engine-lifecycle.css';
const idText = x => x === 0 ? 'EOS(0)' : String(x);
const list = xs => `[${xs.map(idText).join(', ')}]`;
const hue = id => colours[id] ?? '#bbb';
const text = (x, y, value, colour = '#ddd', anchor = 'start') => <text x={x} y={y} style={{
  fill: colour
}} textAnchor={anchor} fontSize="15">{value}</text>;
function StepButtons({
  index,
  setIndex,
  max
}) {
  return <div className="engine-life-steps"><button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button><output>Step {index + 1} of {max + 1}</output><button type="button" disabled={index === max} onClick={() => setIndex(index + 1)}>Next</button></div>;
}
export function PrefillDecodeFigure() {
  const [cap, setCap] = useState(3),
    result = decodeSteps(cap);
  return <Figure id="D04" label="Consumed inputs and emitted outputs">
    <Drawing width={740} height={220 + result.decodeInputs.length * 88} label="Causal prompt attention and one-row decode attention; all input and output IDs belong to A">
      {text(15, 23, 'A · prefill: queries ↓, keys →', colours.A)}
      {[11, 12, 13].map((token, r) => <g key={token}>{text(14, 70 + r * 36, token, colours.A)}{[11, 12, 13].map((k, c) => <g key={k}><rect x={60 + c * 37} y={47 + r * 36} width="32" height="30" fill={c <= r ? colours.A : '#151515'} fillOpacity={c <= r ? .3 : 1} stroke={c <= r ? colours.A : '#555'} strokeDasharray={c > r ? '3 3' : undefined} />{text(76 + c * 37, 68 + r * 36, c <= r ? '●' : '×', c <= r ? colours.A : '#888', 'middle')}</g>)}</g>)}
      {[11, 12, 13].map((token, c) => text(76 + c * 37, 40, token, colours.A, 'middle'))}
      <Wire x1={179} y1={135} x2={267} y2={135} colour={colours.A} /><Box x={275} y={116} w={124} label="output 21" colour={colours.A} />
      {text(430, 140, 'Last prompt row selects output 1')}
      {result.decodeInputs.map((token, r) => <g key={r}>{text(15, 207 + r * 88, `Feed ${token}`, colours.A)}{[11, 12, 13, ...result.decodeInputs.slice(0, r + 1)].map((k, c) => <g key={c}><rect x={110 + c * 49} y={183 + r * 88} width="43" height="34" stroke={colours.A} fill={colours.A} fillOpacity=".22" />{text(131 + c * 49, 206 + r * 88, k, colours.A, 'middle')}</g>)}<Wire x1={365} y1={200 + r * 88} x2={420} y2={200 + r * 88} colour={colours.A} /><Box x={430} y={182 + r * 88} w={140} label={`output ${idText(result.outputs[r + 1])}`} colour={colours.A} /></g>)}
      {!result.decodeInputs.length && text(15, 205, 'No decode forward: cap 1 stops after prefill.')}
    </Drawing>
    <div className="engine-life-inputs" style={{
      '--entity': colours.A
    }}><strong>Stored K/V input positions</strong><div>{result.consumed.map((token, i) => <span key={i}>p{i}<b>{token}</b></span>)}</div><strong>Final output outside K/V</strong><div><span className="engine-life-unfed">{idText(result.outputs.at(-1))}<small>not fed again</small></span></div></div>
    <Readout>Actual: {result.actualRows} cached inputs, {result.outputs.length} outputs, {result.decodeInputs.length} decode forwards. Stop: {result.stop}. Positive-cap bound: 3 + {cap} − 1 = {result.budget.maxRows} rows.</Readout>
    <p>Filled attention cells are allowed; × blocks future prompt positions. The declared runner keeps outputs [21,22,0]. Cap 4 reserves a six-row bound, but EOS still stops after five actual input rows.</p>
    <Controls reset={() => setCap(3)}><Slider label="Positive output cap" value={cap} onChange={setCap} min={1} max={4} step={1} /></Controls>
  </Figure>;
}
function stateTrace(scenario) {
  const options = scenario === 'cancel' ? {
    cancelAt: {
      A: 1
    }
  } : scenario === 'error' ? {
    failure: ['A', 1]
  } : scenario === 'late' ? {
    cancelAt: {
      A: 3
    }
  } : {};
  const result = runEngine({
    ...options,
    poolPages: 5
  });
  return result.events.map((event, i) => ({
    event,
    snapshot: result.snapshots[i]
  })).filter(x => x.event.request === 'A');
}
export function LifecycleFigure() {
  const [scenario, setScenario] = useState('eos'),
    [index, setIndex] = useState(5),
    trace = stateTrace(scenario),
    selected = trace[Math.min(index, trace.length - 1)],
    e = selected.event;
  const raw = selected.snapshot.states.A.phase,
    phase = terminalPhases.includes(raw) ? raw === 'eos' || raw === 'limit' ? 'finished' : raw : raw === 'future' ? 'arriving' : raw;
  const nodes = [['queued', 15, 60], ['prefill', 220, 60], ['decode', 425, 60], ['finished', 630, 60], ['canceled', 15, 280], ['error', 323, 280], ['deadline', 630, 280]];
  return <Figure id="D05" label="A request moves through a persistent state machine">
    <Drawing width={795} height={430} label="State graph with fixed legal exits and A's selected event">
      <g transform="translate(0 60)">
      <path d="M292 60V-25H702" fill="none" stroke="#bbb" strokeWidth="1.5" />
      <Wire x1={702} y1={-25} x2={702} y2={55} />{text(495, -35, 'first output is EOS or reaches cap', '#bbb', 'middle')}
      {[0, 1, 2].map(i => <Wire key={i} x1={nodes[i][1] + 145} y1={82} x2={nodes[i + 1][1] - 8} y2={82} />)}
      <path d="M470 60 C475 0 550 0 550 60" fill="none" stroke="#bbb" strokeWidth="1.5" />{text(515, 18, 'next ID', '#bbb', 'middle')}
      <path d="M87 105V200H702V270 M292 105V200 M497 105V200" fill="none" stroke="#999" strokeDasharray="4 4" />
      <Wire x1={87} y1={200} x2={87} y2={273} dashed /><Wire x1={702} y1={200} x2={702} y2={273} dashed />
      {text(15, 190, 'queued / prefill / decode: safe-point cancel or expiry', '#bbb')}
      <path d="M310 105V235H400 M520 105V235H400" fill="none" stroke="#aaa" />
      <Wire x1={400} y1={235} x2={400} y2={273} />{text(425, 255, 'prefill / decode: runner failure', '#bbb')}
      {nodes.map(([name, x, y]) => <g key={name}><Box x={x} y={y} w={145} h={45} label={name} selected={phase === name} colour={phase === name ? colours.A : '#aaa'} />{phase === name && <>{text(x + 73, y + 73, 'A is here', colours.A, 'middle')}<circle cx={x + 12} cy={y + 13} r="5" fill={colours.A} /></>}</g>)}
      {phase === 'arriving' && text(15, 145, 'A arrived; queue insertion follows this event.', colours.A)}
      </g>
    </Drawing>
    <Readout>Tick {e.time}: {e.event}{e.reason ? ` (${e.reason})` : ''}{e.token != null ? ` ${idText(e.token)}` : ''}. A retains its cyan identity; the white outline identifies the current state.</Readout>
    <Table headers={['Outputs', 'Live cached rows', 'Reserved pages', 'Terminal events in complete trace']} rows={[[list(selected.snapshot.states.A.outputs), selected.snapshot.states.A.cacheRows, selected.snapshot.states.A.pages, trace.filter(r => r.event.event === 'terminal').length]]} />
    <p>Arrows into cancellation, error or deadline represent exits from unfinished work. The event boundary is explicit: an emit record precedes terminal cleanup. A late cancel adds no second terminal event.</p>
    <Controls reset={() => {
      setScenario('eos');
      setIndex(5);
    }}><Select label="Lifecycle case" value={scenario} onChange={v => {
        setScenario(v);
        setIndex(0);
      }} options={[['eos', 'Normal EOS'], ['cancel', 'Cancel at tick 1'], ['error', 'Runner failure at tick 1'], ['late', 'Cancel after EOS']]} /><StepButtons index={Math.min(index, trace.length - 1)} setIndex={setIndex} max={trace.length - 1} /></Controls>
  </Figure>;
}
export function CommitFigure() {
  const [index, setIndex] = useState(0),
    row = commitRecords(index);
  return <Figure id="D06" label="Forward consumption differs from output commit">
    <div className="engine-life-commit-flow"><span>Forward consumes <b>{list(row.input)}</b></span><span aria-hidden="true">→</span><span>Cache now has <b>{row.before.cached} input positions</b></span><span aria-hidden="true">→</span><span>Commit appends <b>{idText(row.after.outputs.at(-1))}</b></span></div>
    <Table label="The exact record immediately before and after this output commit" headers={['Record field', 'Before commit', 'After commit']} rows={[['Prompt cursor', 3, 3], ['Total fed input positions', row.before.fed, row.after.fed], ['Cached input rows', row.before.cached, row.after.cached], ['Output IDs', list(row.before.outputs), list(row.after.outputs)], ['Phase', row.before.phase, row.after.phase]]} />
    <Readout>Appending output {idText(row.after.outputs.at(-1))} changes the output list, not the cached input count.{row.terminal ? ' This is the instant before terminal cleanup; cleanup then returns three pages and clears the live cache counter.' : ' The new ID enters K/V only if a later forward consumes it.'}</Readout>
    <Controls reset={() => setIndex(0)}><Select label="Output commit" value={index} onChange={v => setIndex(Number(v))} options={[[0, 'First: 21'], [1, 'Second: 22'], [2, 'Third: EOS']]} /></Controls>
  </Figure>;
}
export function PackedFigure() {
  const [reverse, setReverse] = useState(false),
    p = packedPrompts(reverse),
    cell = 42,
    left = 125,
    top = 58;
  return <Figure id="D07" label="Packed prompts preserve independent causal blocks">
    <Drawing width={735} height={420} label="Seven by seven causal mask with complete prompt rows and scatter destinations">
      {text(15, 20, 'query rows ↓ / key rows →')}
      {p.rows.map((row, i) => <g key={i}>{text(left + i * cell + 19, 44, `${row.owner}${row.position}`, hue(row.owner), 'middle')}{text(18, top + i * cell + 27, `r${i}: ${row.owner} p${row.position}`, hue(row.owner))}{p.rows.map((key, j) => <g key={j}><rect x={left + j * cell} y={top + i * cell} width="38" height="38" fill={p.allowed[i][j] ? hue(row.owner) : '#181818'} fillOpacity={p.allowed[i][j] ? .25 : 1} stroke={row.owner === key.owner ? hue(row.owner) : '#555'} strokeDasharray={row.owner !== key.owner ? '3 3' : undefined} />{text(left + j * cell + 19, top + i * cell + 26, p.allowed[i][j] ? '●' : '×', p.allowed[i][j] ? hue(row.owner) : '#888', 'middle')}</g>)}{p.lastRows[row.owner] === i && <><Wire x1={left + 7 * cell + 6} y1={top + i * cell + 19} x2={493} y2={top + i * cell + 19} colour={hue(row.owner)} /><Box x={503} y={top + i * cell + 1} w={215} label={`row ${i} → request ${row.owner}`} colour={hue(row.owner)} /></>}</g>)}
      {text(15, 390, '● allowed · × blocked · dashed cells cross a request boundary')}
    </Drawing>
    <Table label="Literal packed arrays aligned by flat row" headers={['Flat row', 'Request', 'Token ID', 'Local position', 'Prompt-end sample?']} rows={p.rows.map(r => [r.row, r.owner, r.token, r.position, p.lastRows[r.owner] === r.row ? `yes → ${r.owner}` : 'no'])} />
    <Readout>Offsets {JSON.stringify(p.offsets)}. Last rows: {Object.entries(p.lastRows).map(([id, i]) => `${id}→${i}`).join(', ')}. {p.count} allowed cells; zero cross-request attention cells.</Readout>
    <p>Each block contains a complete prompt. An incomplete prompt chunk has no prompt-end output to scatter yet. Reordering moves the rows, while A and B keep their identities.</p>
    <Controls reset={() => setReverse(false)}><Select label="Packing order" value={reverse ? 'BA' : 'AB'} onChange={v => setReverse(v === 'BA')} options={[['AB', 'A then B'], ['BA', 'B then A']]} /></Controls>
  </Figure>;
}
function IterationDrawing({
  result,
  ids = ['A', 'B'],
  deadlines = {}
}) {
  const lane = 160, last = Math.max(4, ...result.events.map(e => e.time), ...Object.values(deadlines)),
    left = 120,
    scale = 94,
    width = left + (last + 1) * scale + 65;
  return <Drawing width={width} height={ids.length * lane + 75} label="Logical iteration lanes: filled inputs, separate output circles and terminal marks">
    {Array.from({
      length: last + 1
    }, (_, tick) => <g key={tick}><line x1={left + tick * scale} x2={left + tick * scale} y1={24} y2={ids.length * lane + 25} stroke="#444" strokeDasharray="3 4" />{text(left + tick * scale, 18, tick, '#ddd', 'middle')}</g>)}
    {ids.map((id, i) => {
      const y = 65 + i * lane,
        events = result.events.filter(e => e.request === id),
        arrival = events.find(e => e.event === 'arrive'),
        admit = events.find(e => e.event === 'admit'),
        terminal = events.find(e => e.event === 'terminal'),
        waitEnd = admit?.time ?? terminal?.time ?? arrival.time;
      return <g key={id}>
      {text(12, y + 4, `Request ${id}`, hue(id))}<line x1={left} x2={width - 20} y1={y + 5} y2={y + 5} stroke="#555" />
      <circle cx={left + arrival.time * scale} cy={y + 5} r="5" fill="none" stroke={hue(id)} strokeWidth="2" />
      {waitEnd > arrival.time && <><rect x={left + arrival.time * scale} y={y - 15} width={(waitEnd - arrival.time) * scale} height="34" fill="none" stroke={hue(id)} strokeDasharray="5 4" />{text(left + (arrival.time + waitEnd) * scale / 2, y + 8, 'waiting', hue(id), 'middle')}</>}
      {events.filter(e => e.event === 'forward').map((e, j) => <g key={j}><rect x={left + e.time * scale + 7} y={y - 14} width="77" height="36" fill={hue(id)} fillOpacity=".23" stroke={hue(id)} />{text(left + e.time * scale + 45, y + 9, e.phase === 'prefill' ? `P${e.input_ids.length}` : `in ${e.input_ids[0]}`, hue(id), 'middle')}</g>)}
      {events.filter(e => e.event === 'emit').map((e, j) => <g key={j}><line x1={left + e.time * scale + 45} x2={left + e.time * scale + 45} y1={y + 23} y2={y + 40} stroke={hue(id)} /><circle cx={left + e.time * scale + 45} cy={y + 48} r="5" fill={hue(id)} />{text(left + e.time * scale + 45, y + 74, idText(e.token), hue(id), 'middle')}</g>)}
      {terminal && <>{text(left + terminal.time * scale + 8, y + 102, terminal.reason, hue(id))}<line x1={left + terminal.time * scale + 86} x2={left + terminal.time * scale + 86} y1={y - 17} y2={y + 25} stroke={hue(id)} strokeWidth="3" /></>}
      {deadlines[id] != null && <><line x1={left + deadlines[id] * scale} x2={left + deadlines[id] * scale} y1={y - 38} y2={y + 82} stroke="#fff" strokeDasharray="2 3" />{text(left + deadlines[id] * scale, y - 43, 'deadline', '#fff', 'middle')}</>}
    </g>;
    })}
    {text(12, ids.length * lane + 63, 'Tick →    P = prompt input rows · in = one decode input · ● = emitted ID')}
  </Drawing>;
}
export function IterationsFigure() {
  const [pages, setPages] = useState(6),
    [arrival, setArrival] = useState(1),
    [cap, setCap] = useState(2);
  const result = runEngine({
    jobs: [anchorJobs[0], {
      ...anchorJobs[1],
      arrival,
      cap
    }],
    poolPages: pages
  });
  return <Figure id="D08" label="Requests join and leave between iterations"><IterationDrawing result={result} />
    <Readout>{['A', 'B'].map(id => `${id} emits at ticks ${result.events.filter(e => e.request === id && e.event === 'emit').map(e => e.time).join(', ')}`).join('; ')}. All {pages} reserved pages are free after termination.</Readout>
    <p>These are logical iterations, not milliseconds. Admission runs before forwards: pages released during a tick are available to the next admission scan unless released at the earlier safe point. B retains the declared [31,0] sequence; cap 3 still ends at its second output.</p>
    <Controls reset={() => {
      setPages(6);
      setArrival(1);
      setCap(2);
    }}><Select label="Page pool" value={pages} onChange={v => setPages(Number(v))} options={[[5, 'Five pages'], [6, 'Six pages']]} /><Slider label="B arrival tick" value={arrival} onChange={setArrival} min={0} max={4} step={1} /><Slider label="B output cap" value={cap} onChange={setCap} min={1} max={3} step={1} /></Controls>
  </Figure>;
}
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
const visible = value => value.replaceAll('\r', '␍').replaceAll('\n', '␊');
function ByteCells({
  bytes,
  offset = 0
}) {
  return <div className="engine-life-bytes">{Array.from(bytes, (b, i) => <span key={i} className={b >= 128 ? 'multibyte' : ''}><small>{offset + i}</small><b>{hex([b])}</b><span>{b === 10 ? 'LF' : b === 13 ? 'CR' : b >= 32 && b < 127 ? String.fromCharCode(b) : b >= 128 ? 'UTF-8' : 'byte'}</span></span>)}</div>;
}
export function Utf8Figure() {
  const special = utf8Wire.indexOf(195) + 1,
    [split, setSplit] = useState(special),
    result = parseWire(utf8Wire, 1, split);
  const first = result.reads[0],
    second = result.reads[1],
    pending = split === special;
  return <Figure id="D11" label="UTF-8 character boundaries differ from network reads">
    <p>Literal wire: <code>data: {'{"content":"é"}'}␊␊</code>. Byte indices are zero-based; C3 and A9 together encode é.</p>
    <div className="engine-life-read"><strong>Read 1 · bytes [0,{split})</strong><ByteCells bytes={utf8Wire.slice(0, split)} />{split === 0 && <p>Empty first read.</p>}<div className="engine-life-decoder"><span>Incremental UTF-8 decoder →</span><code>{first?.text ? visible(first.text) : '(no decoded text)'}</code><span>{pending ? 'C3 retained: é is incomplete' : 'No incomplete character at this boundary'}</span></div></div>
    <div className="engine-life-read"><strong>Read 2 · bytes [{split},{utf8Wire.length})</strong><ByteCells bytes={utf8Wire.slice(split)} offset={split} />{split === utf8Wire.length && <p>Empty second read.</p>}<div className="engine-life-decoder"><span>Incremental UTF-8 decoder →</span><code>{second?.text ? visible(second.text) : '(no decoded text)'}</code></div></div>
    <Readout>Dispatched SSE data: {JSON.stringify(result.events)}. Parsed content: {result.records[0]?.content}. {pending ? 'The second read completes the retained character.' : 'Changing a read boundary preserves the complete event.'}</Readout>
    <p>The accent bytes keep their blue identity across either read. A read boundary is an outline between groups, not a character, event or token boundary.</p>
    <Controls reset={() => setSplit(special)}><Slider label="Split after this many bytes" value={split} onChange={setSplit} min={0} max={utf8Wire.length} step={1} /></Controls>
  </Figure>;
}
export function SseFigure() {
  const [fixture, setFixture] = useState('crlf'),
    [chunk, setChunk] = useState(1),
    [readIndex, setReadIndex] = useState(0);
  const wire = sseFixtures[fixture].bytes,
    result = parseWire(wire, chunk),
    selectedIndex = Math.min(readIndex, Math.max(0, result.reads.length - 1)),
    selected = result.reads[selectedIndex];
  return <Figure id="D12" label="Incremental bytes pass through line framing before JSON">
    <div className="engine-life-pipeline">
      <div><strong>1 · Received bytes</strong><code>{selected ? hex(selected.bytes) : 'decoder refused the input'}</code><span>read {result.reads.length ? selectedIndex + 1 : 0} / {result.reads.length} successful reads</span></div><b aria-hidden="true">↓</b>
      <div><strong>2 · Decoded characters</strong><code>{selected ? visible(selected.text) || '(none yet)' : '(no decoded text)'}</code><span>incremental UTF-8; incomplete bytes wait</span></div><b aria-hidden="true">↓</b>
      <div><strong>3 · Pending line and data fields</strong><code>line: {JSON.stringify(selected?.pendingLine ?? '')}</code><code>fields: {JSON.stringify(selected?.pendingFields ?? [])}</code><span>blank line dispatches; comments are ignored</span></div><b aria-hidden="true">↓</b>
      <div><strong>4 · Events dispatched by this read</strong><code>{JSON.stringify(selected?.events ?? [])}</code><span>one read may dispatch zero, one or several events</span></div>
    </div>
    <Table label="Complete line-parser trace for this wire" headers={['Completed line (visible delimiters omitted)', 'Framing action', 'Dispatched data']} rows={result.trace.map(t => [t.line || '(blank)', t.action, t.event == null ? '—' : t.event])} />
    <div className="engine-life-json"><strong>5 · Native JSON adapter, after event framing</strong>{result.records.map((r, i) => <pre key={i}>{JSON.stringify(r, null, 2)}</pre>)}{!result.records.length && <p>No native record produced.</p>}</div>
    <Readout role={result.error ? 'status' : undefined}>{result.error ? `Local refusal: ${result.error}` : result.partial ? 'EOF discards the unfinished event; it is not promoted to a record.' : `${result.events.length} complete data events assembled.`}</Readout>
    <p>␍ means CR and ␊ means LF. The native adapter checks stop/content/tokens when supplied; an empty JSON object is allowed. [DONE] is refused as JSON. This parser uses strict UTF-8, unlike EventSource replacement decoding; it implements no reconnection or event-ID behavior.</p>
    <Controls reset={() => {
      setFixture('crlf');
      setChunk(1);
      setReadIndex(0);
    }}><Select label="Literal wire fixture" value={fixture} onChange={v => {
        setFixture(v);
        setReadIndex(0);
      }} options={Object.entries(sseFixtures).map(([k, v]) => [k, v.label])} /><Slider label="Bytes per read" value={chunk} onChange={v => {
        setChunk(v);
        setReadIndex(0);
      }} min={1} max={80} step={1} /><Slider label="Inspect successful read index" value={selectedIndex} onChange={setReadIndex} min={0} max={Math.max(0, result.reads.length - 1)} step={1} disabled={!result.reads.length} /></Controls>
  </Figure>;
}
export function CancellationFigure() {
  const [delay, setDelay] = useState(.05),
    cancel = .45,
    safe = cancel + delay,
    left = 130,
    scale = 540,
    x = value => left + scale * value;
  return <Figure id="D13" label="Cancellation is acknowledged at a later safe point">
    <Drawing width={770} height={385} label="Four lanes on one constructed seconds axis: client, HTTP, engine, allocator">
      {['Client', 'HTTP handler', 'Engine', 'Allocator'].map((name, i) => <g key={name}>{text(8, 84 + i * 68, name)}<line x1={left} x2={730} y1={80 + i * 68} y2={80 + i * 68} stroke="#555" /></g>)}
      {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={48} y2={306} stroke="#444" strokeDasharray="3 4" />{text(x(t), 334, fmt(t), '#ddd', 'middle')}</g>)}
      <circle cx={x(cancel)} cy="80" r="6" fill={colours.A} />{text(x(cancel), 35, `cancel ${fmt(cancel)} s`, colours.A, 'middle')}
      <Wire x1={x(cancel)} y1={86} x2={x(cancel)} y2={140} colour={colours.A} /><Wire x1={x(cancel)} y1={154} x2={x(cancel)} y2={206} colour={colours.A} />
      {delay > 0 && <><rect x={x(cancel)} y={199} width={scale * delay} height="32" fill={colours.A} fillOpacity=".25" stroke={colours.A} /><line x1={x(cancel)} x2={x(safe)} y1={179} y2={179} stroke={colours.A} />{text((x(cancel) + x(safe)) / 2, 170, `${fmt(delay)} s residual`, colours.A, 'middle')}</>}
      <circle cx={x(safe)} cy="216" r="6" fill="none" stroke="#fff" strokeWidth="2" /><Wire x1={x(safe)} y1={223} x2={x(safe)} y2={275} colour={colours.A} /><circle cx={x(safe)} cy="284" r="6" fill={colours.A} />
      {text(730, 244, `safe point ${fmt(safe)} s`, '#fff', 'end')}{text(730, 310, 'release local ownership', colours.A, 'end')}{text(12, 372, 'Constructed seconds → · same clock for every subtraction')}
    </Drawing>
    <Readout>{fmt(safe)} − 0.45 = {fmt(delay)} seconds before acknowledgement.{delay === 0 ? ' The residual interval is empty; release follows at the same time coordinate.' : ' The shaded interval is work or delay already in progress before the safe point.'}</Readout>
    <p>A closed connection expresses cancellation; it does not itself prove the engine has released its state. These times are constructed, not observed native cancellation latency.</p>
    <Controls reset={() => setDelay(.05)}><Slider label="Safe-point delay (seconds)" value={delay} onChange={setDelay} min={0} max={.4} step={.01} /></Controls>
  </Figure>;
}
export function SharedOwnershipFigure() {
  const [stage, setStage] = useState(1),
    [retain, setRetain] = useState(true),
    state = sharedOwnership(stage, retain);
  const original = sharedOwnership(0, true);
  function graph(s, label) {
    return <Drawing width={690} height={315} label={label}>
    {text(15, 25, label)}
    {['A', 'B'].map((id, i) => {
        const active = s.active.includes(id),
          y = 58 + i * 148;
        return <g key={id}><Box x={15} y={y} w={135} h={48} label={`${id}: ${active ? 'active' : 'finished'}`} colour={hue(id)} dashed={!active} />{active && <><Wire x1={155} y1={y + 12} x2={330} y2={135 + i * 20} colour={hue(id)} /><Wire x1={155} y1={y + 35} x2={475} y2={y + 35} colour={hue(id)} /></>}<rect x={485} y={y + 9} width="160" height="55" fill={active ? hue(id) : 'none'} fillOpacity=".2" stroke={hue(id)} strokeDasharray={active ? undefined : '4 4'} />{text(565, y + 43, `tail ${id === 'A' ? 'X' : 'Y'}: ${active ? 'live' : 'free'}`, hue(id), 'middle')}</g>;
      })}
    <rect x="335" y="110" width="110" height="85" fill={s.resident ? '#efb66b' : 'none'} fillOpacity=".2" stroke="#efb66b" strokeDasharray={s.resident ? undefined : '4 4'} />{text(390, 138, 'page P', '#efb66b', 'middle')}{text(390, 160, `${s.refs} active refs`, '#efb66b', 'middle')}{text(390, 182, s.resident ? 'resident' : 'evicted', '#efb66b', 'middle')}
    {text(15, 304, 'Arrows are active references; dashed tails have been freed.')}
  </Drawing>;
  }
  return <Figure id="D14" label="Shared prefix reference count differs from cache residency">
    {graph(original, 'Before cancellation: A and B own references')}{graph(state, stage === 0 ? 'Current: neither request finished' : stage === 1 ? 'Current: A canceled, B survives' : 'Current: A and B finished')}
    <Readout>Active references to P: {state.refs}. Private X {state.privateA ? 'live' : 'free'}; private Y {state.privateB ? 'live' : 'free'}. P is {state.resident ? 'resident' : 'evicted'}.{state.refs === 0 && state.resident ? ' Reusable-cache policy retains P despite zero active references.' : ''}</Readout>
    <p>P has its own amber page identity; A and B keep cyan and violet references. This constructed sharing graph extends ownership. The finite engine itself reserves private logical pages and does not implement shared K/V.</p>
    <Controls reset={() => {
      setStage(1);
      setRetain(true);
    }}><Select label="Request ownership" value={stage} onChange={v => setStage(Number(v))} options={[[0, 'A and B active'], [1, 'Cancel A; keep B'], [2, 'Both finished']]} /><Select label="Zero-reference residency policy" value={retain ? 'retain' : 'evict'} onChange={v => setRetain(v === 'retain')} options={[['retain', 'Retain reusable prefix'], ['evict', 'Evict if no active references']]} /></Controls>
  </Figure>;
}
export function DeadlinesFigure() {
  const [deadline, setDeadline] = useState(2),
    [limit, setLimit] = useState(2);
  const jobs = [anchorJobs[0], {
    ...anchorJobs[1],
    deadline
  }, {
    id: 'C',
    prompt: [17],
    cap: 1,
    arrival: 1
  }];
  const result = runEngine({
    jobs,
    poolPages: 3,
    queueLimit: limit,
    scripts: {
      A: [21, 22, 0],
      B: [31, 0],
      C: [41]
    }
  });
  return <Figure id="D29" label="Deadline and waiting capacity decide whether work is submitted">
    <IterationDrawing result={result} ids={['A', 'B', 'C']} deadlines={{
      B: deadline
    }} />
    <Table label="Exact terminal reasons and runner submission counts" headers={['Request', 'Arrival', 'Deadline', 'Runner forwards', 'Terminal reason']} rows={jobs.map(j => [j.id, j.arrival, j.deadline ?? 'none', result.events.filter(e => e.request === j.id && e.event === 'forward').length, result.states[j.id].phase])} />
    <Readout>B expires when deadline ≤ current tick. At deadline {deadline}, its terminal reason is {result.states.B.phase}. Waiting limit {limit} counts queued requests before the admission scan; C is {result.states.C.phase}.</Readout>
    <p>A holds all three pages until tick 2 finishes. The next admission scan is tick 3. The deadline check runs before that scan and before the runner; equality therefore prevents submission. Arrivals and waiting-limit checks occur first, so rejection and deadline expiry remain distinct reasons. There is no automatic retry.</p>
    <Controls reset={() => {
      setDeadline(2);
      setLimit(2);
    }}><Slider label="B deadline tick" value={deadline} onChange={setDeadline} min={1} max={6} step={1} /><Slider label="Maximum waiting requests" value={limit} onChange={setLimit} min={1} max={3} step={1} /></Controls>
  </Figure>;
}
export const lifecycleTransportFigures = {
  D04: PrefillDecodeFigure,
  D05: LifecycleFigure,
  D06: CommitFigure,
  D07: PackedFigure,
  D08: IterationsFigure,
  D11: Utf8Figure,
  D12: SseFigure,
  D13: CancellationFigure,
  D14: SharedOwnershipFigure,
  D29: DeadlinesFigure
};
