import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Readout,
  Local,
  Table,
  Drawing,
  Wire,
  Box,
  Evidence,
  colours,
  fmt,
} from './InferenceEngineElements.jsx';
import { runEngine, anchorJobs } from '../../data/inference-engine-lifecycle-models.js';
import * as m from '../../data/inference-engine-metrics-models.js';
import './inference-engine-metrics.css';

const ints = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, String(a + i)]);
const labelValue = (x) => (typeof x === 'object' ? JSON.stringify(x) : String(x));
function SmallText({ x, y, children, colour = '#ddd', anchor = 'start' }) {
  return (
    <text x={x} y={y} style={{ fill: colour }} textAnchor={anchor} fontSize="14">
      {children}
    </text>
  );
}
function Identity({ id, children }) {
  return (
    <span className="engine-metric-identity" style={{ '--request': colours[id] }}>
      {id}
      {children}
    </span>
  );
}

export function ReservationPool() {
  const [pool, setPool] = useState(5),
    [size, setSize] = useState(2),
    [tick, setTick] = useState(1),
    [selected, setSelected] = useState('A');
  const run = runEngine({ jobs: anchorJobs, poolPages: pool, pageSize: size });
  const snapshots = m.addressSnapshots(run),
    snapshot = snapshots.filter((s) => s.time <= tick).at(-1) ?? snapshots[0];
  const pageOwner = (index) =>
    Object.entries(snapshot.addresses).find(([, ps]) => ps.includes(index))?.[0];
  return (
    <Figure id="D09" label="Reservation pages and live cache rows">
      <Drawing
        width={900}
        height={Math.max(390, pool * 56 + 70)}
        label="Logical reservation table mapped to illustrative numbered physical pages"
      >
        <SmallText x={20} y={24}>
          Request page tables · tick {tick}
        </SmallText>
        <SmallText x={470} y={24}>
          Page address → row slots
        </SmallText>
        {['A', 'B'].map((id, i) => {
          const s = snapshot.states[id],
            pages = snapshot.addresses[id] ?? [];
          return (
            <g key={id}>
              <Box
                x={20}
                y={70 + i * 180}
                w={210}
                h={44}
                label={`${id} · ${s.phase}`}
                colour={colours[id]}
                selected={selected === id}
              />
              <SmallText x={20} y={139 + i * 180}>
                {pages.length ? `table [${pages.join(', ')}]` : 'no reserved address'}
              </SmallText>
              <SmallText x={20} y={164 + i * 180}>
                {s.cacheRows} live rows · {s.pages} pages
              </SmallText>
              {pages.map((p) => (
                <Wire
                  key={p}
                  x1={230}
                  y1={92 + i * 180}
                  x2={455}
                  y2={69 + p * 56}
                  colour={colours[id]}
                />
              ))}
            </g>
          );
        })}
        {Array.from({ length: pool }, (_, p) => {
          const id = pageOwner(p),
            order = id ? snapshot.addresses[id].indexOf(p) : 0;
          return (
            <g key={p}>
              <SmallText x={435} y={45 + p * 56}>
                p{p}
              </SmallText>
              {Array.from({ length: size }, (_, c) => {
                const row = order * size + c,
                  live = id && row < snapshot.states[id].cacheRows;
                return (
                  <g key={c}>
                    <rect
                      x={470 + c * 82}
                      y={48 + p * 56}
                      width={76}
                      height={40}
                      fill={live ? colours[id] : '#222'}
                      stroke={id ? colours[id] : '#666'}
                      strokeDasharray={id && !live ? '4 3' : undefined}
                    />
                    {!live && id && (
                      <path
                        d={`M${472 + c * 82},${84 + p * 56}l34,-34m0,34l34,-34`}
                        stroke={colours[id]}
                        opacity=".45"
                      />
                    )}
                    <SmallText
                      x={508 + c * 82}
                      y={73 + p * 56}
                      anchor="middle"
                      colour={live ? '#111' : '#ddd'}
                    >
                      {id ? `${id}:${row}` : 'free'}
                    </SmallText>
                  </g>
                );
              })}
            </g>
          );
        })}
      </Drawing>
      <Readout>
        {pool - snapshot.freePages}/{pool} reserved pages; {snapshot.freePages} free. A needs{' '}
        {m.reservation(3, 3, size).pages}, B needs {m.reservation(4, 2, size).pages}. Filled cells
        are written cache rows; dashed, hatched cells are reserved but unwritten. Addresses stay
        assigned until release.
      </Readout>
      <p>
        Page addresses illustrate one deterministic first-free layout. The exact finite engine
        counts reservations; it does not allocate physical model tensors.
      </p>
      <Controls
        reset={() => {
          setPool(5);
          setSize(2);
          setTick(1);
          setSelected('A');
        }}
      >
        <Select
          label="Pool pages"
          value={pool}
          onChange={(x) => setPool(Number(x))}
          options={ints(5, 8)}
        />
        <Select
          label="Rows per page"
          value={size}
          onChange={(x) => setSize(Number(x))}
          options={ints(1, 4)}
        />
        <Slider label="Logical tick" value={tick} onChange={setTick} min={0} max={5} step={1} />
        <Select
          label="Outlined request"
          value={selected}
          onChange={setSelected}
          options={['A', 'B'].map((x) => [x, x])}
        />
      </Controls>
    </Figure>
  );
}

export function DeviceMemoryBudget() {
  const [context, setContext] = useState(5),
    [bytes, setBytes] = useState(2),
    [over, setOver] = useState('normal');
  const cfg = {
    total: 8192,
    weights: over === 'normal' ? 2048 : 9000,
    workspace: 1024,
    reserve: 1024,
    layers: 2,
    heads: 2,
    width: 16,
    bytes,
    pageSize: 2,
    context,
  };
  const r = m.memoryBudget(cfg),
    regions = [
      ['Weights', cfg.weights, '#c5a3ed'],
      ['Workspace', cfg.workspace, '#efb66b'],
      ['Reserve', cfg.reserve, '#aaa'],
      ['KV budget', Math.max(0, r.available), '#83d9dc'],
    ];
  const maximum = Math.max(cfg.total, cfg.weights + cfg.workspace + cfg.reserve),
    x = (v) => 35 + (720 * v) / maximum;
  let cursor = 0;
  return (
    <Figure id="D10" label="Explicit device byte budget and reserved cache slack">
      <Drawing width={800} height={195} label="One byte scale for the full device budget">
        <SmallText x={35} y={24}>
          Declared analytic budget · bytes, not a device measurement
        </SmallText>
        {regions.map(([name, count, colour]) => {
          const start = cursor;
          cursor += count;
          return (
            count > 0 && (
              <rect
                key={name}
                x={x(start)}
                y={52}
                width={x(cursor) - x(start)}
                height={60}
                fill={colour}
              />
            )
          );
        })}
        <line x1={x(cfg.total)} y1={37} x2={x(cfg.total)} y2={135} stroke="white" strokeWidth="3" />
        <SmallText x={35} y={160}>
          0
        </SmallText>
        <SmallText x={x(cfg.total)} y={160} anchor="end">
          capacity {cfg.total} B
        </SmallText>
      </Drawing>
      <div className="engine-metric-legend">
        {regions.map(([name, count, colour]) => (
          <span key={name}>
            <i style={{ background: colour }} />
            {name}: {count.toLocaleString()} B
          </span>
        ))}
      </div>
      <Local label="Two rows in each reserved KV page; live rows and rounding slack">
        <div className="engine-metric-pages">
          {Array.from({ length: r.demand }, (_, p) => (
            <div key={p}>
              <strong>page {p}</strong>
              <div>
                {[0, 1].map((c) => {
                  const i = 2 * p + c;
                  return (
                    <span key={c} className={i < context ? 'live' : 'slack'}>
                      {i < context ? `row ${i}` : 'slack'}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Local>
      <Readout>
        2 × 2 layers × 2 local KV heads × 16 channels × {bytes} B = {r.perRow} B/row; {r.perPage}{' '}
        B/page. Residual {r.available.toLocaleString()} B → {r.pages} whole pages. {context} live
        rows need {r.demand} pages, {r.slack} slack rows.{' '}
        {r.feasible
          ? 'This declared arithmetic budget fits.'
          : r.available < 0
            ? 'Infeasible: fixed occupants already exceed capacity.'
            : 'Infeasible: the requested KV reservation exceeds this budget.'}
      </Readout>
      <p>
        GiB = 2³⁰ bytes. Capacity here is {fmt(cfg.total / 2 ** 30)} GiB. The zoom is the requested
        layout even when infeasible, not an assertion that it was allocated.
      </p>
      <Controls
        reset={() => {
          setContext(5);
          setBytes(2);
          setOver('normal');
        }}
      >
        <Slider
          label="Cached context rows"
          value={context}
          onChange={setContext}
          min={1}
          max={20}
          step={1}
        />
        <Select
          label="Bytes per element"
          value={bytes}
          onChange={(x) => setBytes(Number(x))}
          options={[1, 2, 4].map((x) => [x, String(x)])}
        />
        <Select
          label="Fixed occupants"
          value={over}
          onChange={setOver}
          options={[
            ['normal', '2,048 B weights'],
            ['over', '9,000 B weights: over budget'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function RequestClocks() {
  const [delay, setDelay] = useState(0),
    [count, setCount] = useState(3),
    [known, setKnown] = useState('tokens');
  const produced = [0.3, 0.5, 0.7].slice(0, count),
    received = produced.map((x) => x + delay),
    terminal = 0.8 + delay;
  const row = m.requestMetrics({
    id: 'A',
    arrival: 0,
    content: received,
    tokens: known === 'tokens' ? received : null,
    terminal,
    outcome: 'completed',
    quality: true,
    admitted: null,
  });
  const x = (t) => 100 + (t / 1.4) * 590;
  return (
    <Figure id="D15" label="Coherent output clocks, gaps and terminal boundary">
      <Drawing
        width={800}
        height={425}
        label="Constructed internal and client elapsed timelines; each uses its own zero"
      >
        <SmallText x={20} y={25}>
          Constructed internal clock · queue 0→0.10 s
        </SmallText>
        <line x1={x(0)} x2={x(1.4)} y1={80} y2={80} stroke="#888" />
        <rect x={x(0)} y={62} width={x(0.1) - x(0)} height={18} fill="#efb66b" />
        <SmallText x={x(0)} y={110}>
          arrival 0
        </SmallText>
        <SmallText x={x(0.1)} y={46}>
          start .10
        </SmallText>
        {produced.map((t, i) => (
          <g key={i}>
            <circle cx={x(t)} cy={80} r={6} fill={colours.A} />
            <SmallText x={x(t)} y={110} anchor="middle">
              {fmt(t)}
            </SmallText>
          </g>
        ))}
        <SmallText x={20} y={155}>
          Client elapsed clock · delayed delivery, independent origin
        </SmallText>
        <line x1={x(0)} x2={x(1.4)} y1={200} y2={200} stroke="#888" />
        {received.map((t, i) => (
          <g key={i}>
            <circle cx={x(t)} cy={200} r={6} fill={colours.A} />
            <SmallText x={x(t)} y={230} anchor="middle">
              {fmt(t)}
            </SmallText>
          </g>
        ))}
        <rect x={x(terminal) - 5} y={193} width={10} height={14} fill="#f29f91" />
        <SmallText x={x(terminal)} y={178} anchor="middle">
          terminal {fmt(terminal)}
        </SmallText>
        <path d={`M${x(0)},256v8H${x(received[0])}v-8`} fill="none" stroke={colours.A} />
        <SmallText x={x(0)} y={286}>
          first delivery {fmt(received[0])} s
        </SmallText>
        <path d={`M${x(0)},310v8H${x(terminal)}v-8`} fill="none" stroke="#f29f91" />
        <SmallText x={x(0)} y={343}>
          terminal latency {fmt(terminal)} s
        </SmallText>
        {count > 1 ? (
          <>
            <path
              d={`M${x(received[0])},363v8H${x(received[1])}v-8`}
              fill="none"
              stroke={colours.A}
            />
            <SmallText x={x(received[0])} y={402}>
              {known === 'tokens' ? 'Token gap' : 'Content-event gap'}: 0.20 s between marks
            </SmallText>
          </>
        ) : (
          <SmallText x={100} y={402}>
            One mark: an inter-output gap is undefined.
          </SmallText>
        )}
      </Drawing>
      <Readout>
        {known === 'tokens'
          ? `Known token correspondence: TTFT ${fmt(row.tokenFirst)} s; TPOT ${fmt(row.tokenGap)} s.`
          : `Content-event correspondence only: first content ${fmt(row.first)} s; mean content gap ${fmt(row.contentGap)} s. Token TTFT/TPOT are unknown.`}{' '}
        Last-output latency {fmt(received.at(-1))} s; terminal latency {fmt(terminal)} s.{' '}
        {count === 1 && 'One output has no inter-output gap.'}
      </Readout>
      <p>
        All numbers are supplied examples. The edit adds a declared delivery delay to client events;
        it does not infer a real server-to-client offset. The internal queue duration is measured
        only on the internal clock.
      </p>
      <Controls
        reset={() => {
          setDelay(0);
          setCount(3);
          setKnown('tokens');
        }}
      >
        <Slider
          label="Constructed delivery delay, seconds"
          value={delay}
          onChange={setDelay}
          min={0}
          max={0.5}
          step={0.05}
        />
        <Select
          label="Output observations"
          value={count}
          onChange={(x) => setCount(Number(x))}
          options={[
            [3, 'Three'],
            [1, 'One: gap undefined'],
          ]}
        />
        <Select
          label="Correspondence evidence"
          value={known}
          onChange={setKnown}
          options={[
            ['tokens', 'One known token per mark'],
            ['events', 'Content events only'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function OutcomeStrip({ rows }) {
  return (
    <Drawing
      width={800}
      height={rows.length ? 310 : 100}
      label="Every offered request retains its identity and outcome"
    >
      {!rows.length ? (
        <SmallText x={25} y={50}>
          No offered requests · fraction undefined
        </SmallText>
      ) : (
        rows.map((r, i) => (
          <g key={r.id}>
            <Box
              x={25 + i * 195}
              y={25}
              w={160}
              label={`${r.id} · offered`}
              colour={colours[r.id]}
            />
            <Wire x1={105 + i * 195} y1={61} x2={105 + i * 195} y2={125} colour={colours[r.id]} />
            <Box
              x={25 + i * 195}
              y={130}
              w={160}
              h={44}
              label={r.outcome}
              colour={colours[r.id]}
              selected={r.good}
              dashed={r.outcome === 'censored'}
            />
            <SmallText x={105 + i * 195} y={210} anchor="middle">
              {r.good ? 'in good numerator' : 'retained denominator'}
            </SmallText>
            <SmallText x={105 + i * 195} y={240} anchor="middle">
              {r.good ? 'latency + quality pass' : r.reasons[0]}
            </SmallText>
          </g>
        ))
      )}
    </Drawing>
  );
}
export function OfferedGoodput() {
  const [limit, setLimit] = useState(0.5),
    [empty, setEmpty] = useState('four');
  const r = m.cohortMetrics(empty === 'four' ? m.cohortFixture() : [], { firstLimit: limit });
  return (
    <Figure id="D16" label="Goodput keeps all offered outcomes">
      <OutcomeStrip rows={r.rows} />
      <Readout>
        Arrival window [0, 2) s; cutoff 2 s. {r.offered} offered → {r.completed} completed →{' '}
        {r.good} good. Offered success{' '}
        {r.fraction === null ? 'undefined' : `${fmt(100 * r.fraction)}%`}; completed-only success{' '}
        {r.conditional === null ? 'undefined' : `${fmt(100 * r.conditional)}%`}; goodput{' '}
        {fmt(r.goodput)} good requests/s.
      </Readout>
      <Table
        label="SLO decisions with missingness retained"
        headers={['Request', 'First content (s)', 'Terminal latency (s)', 'Decision']}
        rows={r.rows.map((row) => [
          <Identity id={row.id} />,
          fmt(row.first),
          fmt(row.terminal),
          row.good ? 'good' : row.reasons.join('; '),
        ])}
      />
      <Controls
        reset={() => {
          setLimit(0.5);
          setEmpty('four');
        }}
      >
        <Slider
          label="First-content SLO, seconds"
          value={limit}
          onChange={setLimit}
          min={0.1}
          max={1}
          step={0.1}
          disabled={empty === 'empty'}
        />
        <Select
          label="Arrival cohort"
          value={empty}
          onChange={setEmpty}
          options={[
            ['four', 'Four offered requests'],
            ['empty', 'No arrivals'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function ClaimLinks({ claim }) {
  if (!claim) return <>No exact claim in this packet.</>;
  return (
    <>
      <span>{claim.explanation}</span>
      {claim.sources.map((id) => (
        <a key={id} href={m.evidence.sources[id].url} target="_blank" rel="noreferrer">
          Pinned {id} source
        </a>
      ))}
      {claim.observation && <a href={claim.observation}>Exact retained observation</a>}
    </>
  );
}
export function EngineEvidenceMatrix() {
  const [proposition, setProposition] = useState('route.windows_cpu_pythia14m_f16_observed'),
    [layer, setLayer] = useState('observed');
  return (
    <Figure id="D20" label="Six engines and exact scoped evidence">
      <p>
        Evidence as of {m.evidence.as_of}. Status describes the selected proposition, not the engine
        as a whole.
      </p>
      <Table
        label="Requirement, evidence basis and pinned source for six engines"
        headers={['Engine', 'Status / basis', 'Exact scoped statement and source']}
        rows={m.evidence.engines.map((e) => {
          const c = m.engineClaim(e, proposition, layer === 'observed');
          return [
            e.name,
            <span className={`engine-metric-status ${c?.status ?? 'unknown'}`}>
              {c?.status ?? 'unknown'} · {c?.basis ?? 'unresolved'}
            </span>,
            <div className="engine-metric-evidence">
              <ClaimLinks claim={c} />
            </div>,
          ];
        })}
      />
      <Readout>
        {layer === 'observed'
          ? 'The added observation establishes only the exact llama.cpp CPU route. Other absent joint routes remain unknown.'
          : 'Source-only evidence has no locally observed route; the original manifest is preserved.'}
      </Readout>
      <Controls
        reset={() => {
          setProposition('route.windows_cpu_pythia14m_f16_observed');
          setLayer('observed');
        }}
      >
        <Select
          label="Exact proposition"
          value={proposition}
          onChange={setProposition}
          options={m.requirementOptions}
        />
        <Select
          label="Evidence layer"
          value={layer}
          onChange={setLayer}
          options={[
            ['observed', 'Sources + exact retained CPU observation'],
            ['source', 'Original source-only manifest'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function BoundaryDurations() {
  const [which, setWhich] = useState('queue'),
    [value, setValue] = useState(100);
  const base = { queue: 100, compute: 200, delivery: 50 },
    changed = { ...base, [which]: value };
  const colour = { queue: '#efb66b', compute: '#c5a3ed', delivery: '#83d9dc' },
    max = 1000,
    x = (t) => 120 + (t / max) * 620;
  return (
    <Figure id="D24" label="Locate delay on a common time scale">
      <Drawing
        width={800}
        height={255}
        label="Supplied baseline and edited queue, compute and delivery intervals"
      >
        {[base, changed].map((row, i) => {
          let time = 0;
          return (
            <g key={i}>
              <SmallText x={15} y={65 + i * 85}>
                {i ? 'Edited' : 'Baseline'}
              </SmallText>
              {Object.entries(row).map(([key, v]) => {
                const start = time;
                time += v;
                return (
                  <g key={key}>
                    <rect
                      x={x(start)}
                      y={40 + i * 85}
                      width={x(time) - x(start)}
                      height={38}
                      fill={colour[key]}
                    />
                    <SmallText x={x(start)} y={101 + i * 85}>
                      {v > 0 ? '' : `${key}: 0`}
                    </SmallText>
                  </g>
                );
              })}
              <SmallText x={x(time) + 10} y={65 + i * 85}>
                {time} ms
              </SmallText>
            </g>
          );
        })}
        <line x1={x(0)} x2={x(max)} y1={215} y2={215} stroke="#888" />
        {[0, 250, 500, 750, 1000].map((t) => (
          <SmallText key={t} x={x(t)} y={240} anchor="middle">
            {t}
          </SmallText>
        ))}
      </Drawing>
      <div className="engine-metric-legend">
        {Object.keys(base).map((k) => (
          <span key={k}>
            <i style={{ background: colour[k] }} />
            {k}: {base[k]}→{changed[k]} ms
          </span>
        ))}
      </div>
      <Readout>
        Baseline 350 ms; edited {Object.values(changed).reduce((a, b) => a + b, 0)} ms.{' '}
        {which === 'compute'
          ? 'Instrument model execution for this constructed change.'
          : which === 'queue'
            ? 'Inspect admission and preprocessing boundaries for this constructed change.'
            : 'Inspect emission, proxy and receipt boundaries with compatible clocks.'}
      </Readout>
      <Controls
        reset={() => {
          setWhich('queue');
          setValue(100);
        }}
      >
        <Select
          label="Changed boundary"
          value={which}
          onChange={(x) => {
            setWhich(x);
            setValue(base[x]);
          }}
          options={Object.keys(base).map((k) => [k, k])}
        />
        <Slider
          label="Edited duration, milliseconds"
          value={value}
          onChange={setValue}
          min={0}
          max={500}
          step={10}
        />
      </Controls>
    </Figure>
  );
}

function StairPlot({ rows, field, label, colour }) {
  const maximum = Math.max(1, ...rows.map((r) => r[field])),
    last = Math.max(1, ...rows.map((r) => r.tick));
  const x = (t) => 70 + (t / last) * 640,
    y = (v) => 170 - (v / maximum) * 125;
  let path = `M${x(0)},${y(0)}`;
  for (const r of rows) path += `H${x(r.tick)}V${y(r[field])}`;
  path += `H${x(last + 0.15)}`;
  return (
    <Drawing width={800} height={230} label={label}>
      <SmallText x={20} y={22}>
        {label}
      </SmallText>
      <path d={`M70,40V170H740`} fill="none" stroke="#888" />
      <path d={path} fill="none" stroke={colour} strokeWidth={3} />
      {[0, maximum].map((v) => (
        <SmallText key={v} x={55} y={y(v) + 4} anchor="end">
          {v}
        </SmallText>
      ))}
      {Array.from({ length: last + 1 }, (_, t) => (
        <SmallText key={t} x={x(t)} y={198} anchor="middle">
          {t}
        </SmallText>
      ))}
      <SmallText x={350} y={223}>
        logical tick · not seconds
      </SmallText>
    </Drawing>
  );
}
export function EventCounters() {
  const [pool, setPool] = useState(5),
    [cancel, setCancel] = useState('none');
  const run = runEngine({
      jobs: anchorJobs,
      poolPages: pool,
      cancelAt: cancel === 'A' ? { A: 1 } : {},
    }),
    rows = m.eventSeries(run);
  return (
    <Figure id="D25" label="Output counter and waiting occupancy from exact finite events">
      <StairPlot
        rows={rows}
        field="outputs"
        label="Cumulative emitted output IDs"
        colour="#83d9dc"
      />
      <StairPlot
        rows={rows}
        field="queued"
        label="Requests waiting after each event"
        colour="#c5a3ed"
      />
      <Table
        label="Exact event order including events at the same tick"
        headers={['Event index', 'Tick', 'Request', 'Event', 'Outputs total', 'Waiting']}
        rows={rows.map((r) => [
          r.index,
          r.tick,
          <Identity id={r.request} />,
          r.event,
          r.outputs,
          r.queued,
        ])}
      />
      <Readout>
        {rows.at(-1)?.outputs ?? 0} outputs retained. Vertical changes at the same tick preserve
        event order in the table. A tick-based slope is outputs per logical tick, not native
        tokens/s or a latency percentile.
      </Readout>
      <Controls
        reset={() => {
          setPool(5);
          setCancel('none');
        }}
      >
        <Select
          label="Reservation pool"
          value={pool}
          onChange={(x) => setPool(Number(x))}
          options={[
            [5, 'Five pages'],
            [6, 'Six pages'],
          ]}
        />
        <Select
          label="Safe-point cancellation"
          value={cancel}
          onChange={setCancel}
          options={[
            ['none', 'No cancellation'],
            ['A', 'Cancel A at tick 1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function MatchedManifest() {
  const [change, setChange] = useState('none'),
    r = m.manifestPair(change);
  return (
    <Figure id="D26" label="Match controlled identities before comparing runs">
      <Table
        label="Aligned controlled manifest fields; white outline marks a changed control"
        headers={['Held field', 'Left supplied run', 'Right supplied run']}
        rows={Object.keys(r.left).map((k) => [
          k.replaceAll('_', ' '),
          <span className="engine-metric-literal">{labelValue(r.left[k])}</span>,
          <span
            className={`engine-metric-literal ${r.differences.includes(k) ? 'engine-metric-confound' : ''}`}
          >
            {labelValue(r.right[k])}
          </span>,
        ])}
      />
      <Readout>
        {r.comparable
          ? 'Held controls match. Runtime treatment remains separately named; outcome receipts must still be complete.'
          : `Comparison blocked: ${r.differences.join(', ')} differs. No aggregate performance claim is generated.`}
      </Readout>
      <p>
        These literal fixture identities label supplied records. Hashes are placeholders in the
        finite comparison, not actual model identities. A matching manifest cannot prove that a
        dishonest record describes reality.
      </p>
      <Controls reset={() => setChange('none')}>
        <Select
          label="Right-run control"
          value={change}
          onChange={setChange}
          options={[
            ['none', 'Matched'],
            ['cap', 'A cap 2→3'],
            ['cache', 'Cold→warm cache'],
            ['precision', 'Different precision'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function CohortCutoff() {
  const [cutoff, setCutoff] = useState(2),
    [quality, setQuality] = useState('known');
  const traces = m.cohortFixture();
  if (quality === 'unknown') traces[0].quality = null;
  const r = m.cohortMetrics(traces, { windowEnd: 0.4, cutoff });
  return (
    <Figure id="D27" label="Offered cohort outcomes through an observation cutoff">
      <Drawing
        width={1040}
        height={365}
        label="Every offered identity reaches one observed outcome branch"
      >
        <Box x={20} y={150} w={150} h={46} label="4 offers A–D" />
        {r.rows.map((row, i) => (
          <g key={row.id}>
            <Wire
              x1={170}
              y1={173}
              x2={210}
              y2={50 + i * 85}
              colour={colours[row.id]}
              dashed={row.outcome === 'censored'}
            />
            <Box
              x={215}
              y={28 + i * 85}
              w={195}
              h={44}
              label={!row.admitted ? `${row.id} · never admitted` : `${row.id} · admitted`}
              colour={colours[row.id]}
              dashed={!row.admitted}
            />
            <Wire x1={410} y1={50 + i * 85} x2={500} y2={50 + i * 85} colour={colours[row.id]} />
            <Box
              x={505}
              y={28 + i * 85}
              w={195}
              h={44}
              label={`${row.id} · ${row.outcome}`}
              colour={colours[row.id]}
              dashed={row.outcome === 'censored'}
            />
            <Wire x1={700} y1={50 + i * 85} x2={790} y2={50 + i * 85} colour={colours[row.id]} />
            <Box
              x={795}
              y={28 + i * 85}
              w={205}
              h={44}
              label={
                row.good
                  ? 'good: counted'
                  : row.quality === null && row.outcome === 'completed'
                    ? 'quality unknown'
                    : 'not in numerator'
              }
              colour={colours[row.id]}
              selected={row.good}
            />
          </g>
        ))}
      </Drawing>
      <Readout>
        Arrivals [0, 0.4) s; outcomes through {fmt(cutoff)} s. Offered 4 ={' '}
        {Object.entries(r.outcomes)
          .map(([k, v]) => `${v} ${k}`)
          .join(' + ')}
        . {r.completed} completed; {r.good} good. Offered success {fmt(100 * r.fraction)}%.
      </Readout>
      <p>
        Censoring preserves the request in the denominator. A known future terminal time is hidden
        until the cutoff reaches it; absent quality is not success. This shortened arrival window is
        declared separately from D16's two-second goodput denominator.
      </p>
      <Controls
        reset={() => {
          setCutoff(2);
          setQuality('known');
        }}
      >
        <Slider
          label="Observation cutoff, seconds"
          value={cutoff}
          onChange={setCutoff}
          min={0.4}
          max={2}
          step={0.05}
        />
        <Select
          label="A quality evidence"
          value={quality}
          onChange={setQuality}
          options={[
            ['known', 'Supplied quality passes'],
            ['unknown', 'Quality unavailable'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PairedObservations() {
  const [mode, setMode] = useState('matched-pair');
  return (
    <Figure id="D28" label="Retained supplied matched fixture, not a native benchmark">
      <Evidence>
        {(data) => {
          const result = data.finite.cases.find((c) => c.name === mode).result;
          if (!result.comparable)
            return (
              <>
                <Readout>
                  Comparison blocked:{' '}
                  {result.audit.held_fields_differ.join(', ') ||
                    `missing right receipts ${result.audit.missing_receipts.right.join(', ')}`}
                  .
                </Readout>
                <Table
                  label="Raw outcomes remain visible after refused comparison"
                  headers={['Side', 'Request', 'Outcome', 'Terminal (s)']}
                  rows={Object.entries(result.raw_traces).flatMap(([side, rows]) =>
                    rows.map((r) => [
                      side,
                      <Identity id={r.request_id} />,
                      r.outcome,
                      fmt(r.terminal),
                    ]),
                  )}
                />
              </>
            );
          const paired = result.paired_rows;
          return (
            <>
              <p>
                Saved finite-driver fixture · supplied elapsed times · no model or engine benchmark.
              </p>
              <Drawing
                width={800}
                height={250}
                label="Left circles and right squares on one terminal-latency axis"
              >
                <SmallText x={20} y={24}>
                  Terminal latency (seconds); marker shape = comparison side
                </SmallText>
                {paired.map((p, i) => (
                  <g key={p.request_id}>
                    <SmallText x={20} y={80 + i * 95}>
                      {p.request_id}
                    </SmallText>
                    <line x1={100} x2={720} y1={75 + i * 95} y2={75 + i * 95} stroke="#555" />
                    {p.completed_pair ? (
                      <>
                        <line
                          x1={100 + p.left.terminal_latency_s * 600}
                          x2={100 + p.right.terminal_latency_s * 600}
                          y1={75 + i * 95}
                          y2={75 + i * 95}
                          stroke={colours[p.request_id]}
                          strokeWidth={3}
                        />
                        <circle
                          cx={100 + p.left.terminal_latency_s * 600}
                          cy={75 + i * 95}
                          r={7}
                          fill={colours[p.request_id]}
                        />
                        <rect
                          x={93 + p.right.terminal_latency_s * 600}
                          y={68 + i * 95}
                          width={14}
                          height={14}
                          fill={colours[p.request_id]}
                        />
                      </>
                    ) : (
                      <SmallText x={115} y={80 + i * 95}>
                        Rejected in both · no completion pair
                      </SmallText>
                    )}
                  </g>
                ))}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <SmallText key={t} x={100 + t * 600} y={225} anchor="middle">
                    {t}
                  </SmallText>
                ))}
              </Drawing>
              <Table
                label="Exact retained finite paired observations"
                headers={[
                  'Request',
                  'Left terminal latency',
                  'Right terminal latency',
                  'Paired difference',
                ]}
                rows={paired.map((p) => [
                  <Identity id={p.request_id} />,
                  fmt(p.left.terminal_latency_s),
                  fmt(p.right.terminal_latency_s),
                  fmt(p.right_minus_left_terminal_s_completed_pair_only),
                ])}
              />
              <Readout>
                {result.left_cohort.offered} offers per side; {result.completed_pair_count}{' '}
                completed pair. Mean right−left for completed pairs only ={' '}
                {fmt(result.mean_terminal_delta_s_completed_pairs_only)} s. The rejected B receipt
                remains in both offered cohorts.
              </Readout>
            </>
          );
        }}
      </Evidence>
      <Controls reset={() => setMode('matched-pair')}>
        <Select
          label="Retained finite case"
          value={mode}
          onChange={setMode}
          options={[
            ['matched-pair', 'Matched: one completed pair'],
            ['cache-confound', 'Cache policy differs'],
            ['missing-offered-receipt', 'Right receipt B is missing'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function OversizeProgress() {
  const [cap, setCap] = useState(11),
    pool = 6,
    size = 2;
  let demand, run, error;
  try {
    demand = m.reservation(3, cap, size);
    run = runEngine({
      jobs: [
        { id: 'A', prompt: [11, 12, 13], cap, arrival: 0 },
        { id: 'B', prompt: [41, 42, 43], cap: 1, arrival: 0 },
      ],
      poolPages: pool,
      pageSize: size,
      scripts: { A: [21, 22, 0], B: [0] },
    });
  } catch (e) {
    error = e.message;
  }
  return (
    <Figure id="D30" label="Permanently oversized work does not block feasible work forever">
      {error ? (
        <Readout role="alert">
          Request refused before allocation: {error}. No reservation or progress is fabricated.
        </Readout>
      ) : (
        <>
          <Drawing
            width={850}
            height={285}
            label="Demand and physical pool on the same page-count scale"
          >
            <SmallText x={20} y={26}>
              One outlined square = one logical page
            </SmallText>
            {[
              [`A demand ${demand.pages}`, demand.pages, colours.A],
              ['Pool capacity 6', pool, '#aaa'],
              ['B demand 2', 2, colours.B],
            ].map(([label, n, colour], i) => (
              <g key={label}>
                <SmallText x={20} y={85 + i * 80}>
                  {label}
                </SmallText>
                {Array.from({ length: n }, (_, p) => (
                  <rect
                    key={p}
                    x={205 + p * 42}
                    y={60 + i * 80}
                    width={36}
                    height={36}
                    fill="none"
                    stroke={colour}
                    strokeWidth={2}
                  />
                ))}
              </g>
            ))}
          </Drawing>
          <Readout>
            A: ceil((3 + {cap} − 1)/2) = {demand.pages}{' '}
            {demand.pages > pool
              ? '> 6: permanently infeasible, rejected.'
              : '≤ 6: eligible subject to current reservations.'}{' '}
            B needs two pages. Final free pages {run.freePages}/6.
          </Readout>
          <Table
            label="Actual finite admission and terminal sequence"
            headers={['Tick', 'Request', 'Event', 'Result']}
            rows={run.events
              .filter((e) => ['admit', 'terminal'].includes(e.event))
              .map((e) => [
                e.time,
                <Identity id={e.request} />,
                e.event,
                e.reason ?? `${e.pages} pages reserved`,
              ])}
          />
        </>
      )}
      <Controls reset={() => setCap(11)}>
        <Select
          label="A output cap"
          value={cap}
          onChange={(x) => setCap(Number(x))}
          options={[
            [11, '11: seven pages'],
            [9, '9: six pages'],
            [1, '1: two pages'],
            [0, '0: invalid request'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function EngineRequirements() {
  const [requirement, setRequirement] = useState('route.windows_cpu_pythia14m_f16_observed'),
    [extra, setExtra] = useState('none'),
    [layer, setLayer] = useState('observed');
  const requirements = [...new Set([requirement, ...(extra === 'none' ? [] : [extra])])],
    rows = m.selectCandidates(requirements, layer === 'observed');
  return (
    <Figure id="D31" label="Requirements produce eligible, unknown and excluded sets">
      <p>Each engine must satisfy every selected proposition. Missing evidence stays unknown.</p>
      <div className="engine-metric-candidates">
        {['eligible', 'unknown', 'excluded'].map((status) => (
          <section key={status}>
            <strong>{status}</strong>
            <span className="engine-metric-branch">↓</span>
            {rows
              .filter((r) => r.decision === status)
              .map((r) => (
                <span className={`engine-metric-candidate ${status}`} key={r.engine.id}>
                  {r.engine.name}
                </span>
              ))}
            {!rows.some((r) => r.decision === status) && <span>∅ empty set</span>}
          </section>
        ))}
      </div>
      <Table
        label="Exact conjunction decisions and evidence"
        headers={['Engine', 'Proposition', 'Decision reason']}
        rows={rows.flatMap((r) =>
          r.rows.map((p) => [
            r.engine.name,
            m.requirementOptions.find((x) => x[0] === p.proposition)?.[1] ?? p.proposition,
            <div className="engine-metric-evidence">
              <strong>{p.result}</strong>
              <ClaimLinks claim={p.claim} />
            </div>,
          ]),
        )}
      />
      <Readout>
        {rows.filter((r) => r.decision === 'eligible').length} eligible candidates.{' '}
        {rows.some((r) => r.decision === 'eligible')
          ? 'Eligibility is not a fastest/cheapest ranking; a matched investigation remains.'
          : 'No candidate is established. Change a requirement or obtain the missing joint compatibility evidence; do not pick an arbitrary winner.'}
      </Readout>
      <Controls
        reset={() => {
          setRequirement('route.windows_cpu_pythia14m_f16_observed');
          setExtra('none');
          setLayer('observed');
        }}
      >
        <Select
          label="Primary hard requirement"
          value={requirement}
          onChange={(value) => {
            setRequirement(value);
            if (extra === value) setExtra('none');
          }}
          options={m.requirementOptions}
        />
        <Select
          label="Additional hard requirement"
          value={extra}
          onChange={setExtra}
          options={[
            ['none', 'None'],
            ...m.requirementOptions.filter(([value]) => value !== requirement),
          ]}
        />
        <Select
          label="Evidence available"
          value={layer}
          onChange={setLayer}
          options={[
            ['observed', 'Source + exact CPU observation'],
            ['source', 'Source only'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export const memoryMetricsFigures = {
  D09: ReservationPool,
  D10: DeviceMemoryBudget,
  D15: RequestClocks,
  D16: OfferedGoodput,
  D20: EngineEvidenceMatrix,
  D24: BoundaryDurations,
  D25: EventCounters,
  D26: MatchedManifest,
  D27: CohortCutoff,
  D28: PairedObservations,
  D30: OversizeProgress,
  D31: EngineRequirements,
};
