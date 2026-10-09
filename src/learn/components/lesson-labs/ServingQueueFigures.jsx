import { useEffect, useId, useRef, useState } from 'react';
import {
  requestColours,
  requestFixture,
  tokenClocks,
  fcfs,
  queueAreas,
  arrivalDiagnostics,
  clientArrivals,
  mm1,
  survival,
  pk,
  kingman,
  processorSharing,
  pooledQueue,
  erlangC,
  finiteQueue,
} from '../../data/llm-serving-queue-models.js';
import './serving-queue-figures.css';

export function number(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'undefined';
  if (!Number.isFinite(value)) return '∞';
  return Number(value.toFixed(digits)).toString();
}

export function Figure({ id, children }) {
  return (
    <figure className="sq-figure" data-queue-figure={id}>
      {children}
    </figure>
  );
}

export function Scroller({ label, children, className = '' }) {
  const host = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = host.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const observeContents = () => {
      for (const child of node.querySelectorAll('svg, table, .katex-display, .katex-html')) {
        observer.observe(child);
      }
      measure();
    };
    observeContents();
    const mutations = new MutationObserver(observeContents);
    mutations.observe(node, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [children]);
  return (
    <div>
      <div
        ref={host}
        className={`sq-scroll ${className}`}
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {children}
      </div>
      {overflow && (
        <p className="sq-scroll-hint">
          Scroll horizontally to inspect the remaining structure. Keyboard: focus this region and
          use the arrow keys.
        </p>
      )}
    </div>
  );
}

export function Drawing({ label, height = 250, children, width = 672 }) {
  const id = useId();
  return (
    <Scroller label={label}>
      <svg
        role="img"
        aria-labelledby={id}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}
      >
        <title id={id}>{label}</title>
        <defs>
          <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 7L7 0" stroke="#101010" strokeWidth="2" />
          </pattern>
        </defs>
        {children}
      </svg>
    </Scroller>
  );
}

export function Controls({ children, reset }) {
  return (
    <div className="sq-controls">
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
}

export function Select({ label, value, change, options }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => change(event.target.value)}>
        {options.map(([key, text]) => (
          <option value={key} key={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Slider({
  label,
  value,
  change,
  min = 0,
  max = 10,
  step = 1,
  unit = '',
  disabled = false,
}) {
  const id = useId();
  return (
    <div className="sq-slider">
      <label htmlFor={id}>
        {label}:{' '}
        <span>
          {number(value)} {unit}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled || min === max}
        onChange={(event) => change(Number(event.target.value))}
      />
    </div>
  );
}

export function Table({ label, headers, rows }) {
  return (
    <Scroller label={label} className="sq-table">
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) =>
                column === 0 ? (
                  <th scope="row" key={column}>
                    {cell}
                  </th>
                ) : (
                  <td key={column}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroller>
  );
}

export function TimeAxis({ max, y = 210, left = 60, right = 625, ticks = 5, label = 'Time (s)' }) {
  return (
    <g className="sq-axis">
      <line x1={left} x2={right} y1={y} y2={y} />
      {Array.from({ length: ticks + 1 }, (_, index) => {
        const x = left + ((right - left) * index) / ticks;
        return (
          <g key={index}>
            <line x1={x} x2={x} y1={y} y2={y + 6} />
            <text x={x} y={y + 25} textAnchor="middle">
              {number((max * index) / ticks, 2)}
            </text>
          </g>
        );
      })}
      <text x={right} y={y + 48} textAnchor="end">
        {label}
      </text>
    </g>
  );
}

export function Lanes({ rows, max, title, height = 300 }) {
  const horizon =
    max ?? Math.max(1, ...rows.map((row) => row.departure ?? row.finish ?? row.arrival));
  const x = (time) => 60 + (time / horizon) * 565;
  return (
    <Drawing label={title} height={height}>
      {rows.map((row, index) => {
        const y = 32 + index * 42;
        const colour =
          requestColours[requestFixture.findIndex((item) => item.id === row.id)] ??
          requestColours[index % requestColours.length];
        const end = row.departure ?? row.finish;
        return (
          <g key={row.id}>
            <text x="12" y={y + 6} fill={colour}>
              {row.id}
            </text>
            <line x1="60" x2="625" y1={y} y2={y} className="sq-guide" />
            <circle cx={x(row.arrival)} cy={y} r="5" fill={colour} />
            {row.start !== null && row.start !== undefined && (
              <>
                <line
                  x1={x(row.arrival)}
                  x2={x(row.start)}
                  y1={y}
                  y2={y}
                  stroke={colour}
                  strokeDasharray="5 4"
                  strokeWidth="4"
                />
                <rect
                  x={x(row.start)}
                  y={y - 9}
                  width={Math.max(0, x(end) - x(row.start))}
                  height="18"
                  fill={colour}
                  fillOpacity=".8"
                />
                <circle cx={x(end)} cy={y} r="4" fill={colour} />
              </>
            )}
          </g>
        );
      })}
      <TimeAxis max={horizon} y={height - 60} />
    </Drawing>
  );
}

export function ClockFigure() {
  const [mode, setMode] = useState('many');
  const [text, setText] = useState('3, 3.4, 4');
  const id = useId();
  const outputs =
    mode === 'zero'
      ? []
      : text.split(',').map((value) => (value.trim() === '' ? NaN : Number(value)));
  let model;
  try {
    if (
      outputs.length !== (mode === 'many' ? 3 : mode === 'two' ? 2 : mode === 'one' ? 1 : 0) ||
      outputs.some((value) => !Number.isFinite(value) || value > 30)
    )
      throw new Error('Enter the selected number of finite timestamps, no later than 30 s.');
    model = tokenClocks(0, 1, outputs);
  } catch (error) {
    model = { error: error.message };
  }
  const horizon = model.error ? 5 : Math.max(5, ...outputs);
  const x = (time) => 185 + (time / horizon) * 440;
  const events = [
    { label: 'Arrival', time: 0 },
    { label: 'Scheduled', time: 1 },
    ...outputs.map((time, index) => ({ label: `Output ${index + 1}`, time })),
  ];
  return (
    <Figure id="D01">
      {model.error ? (
        <p role="alert">
          Invalid clock sequence: {model.error} Clocks are not computed until the sequence is valid.
        </p>
      ) : (
        <>
          <Drawing
            label="Arrival, scheduling, output gaps and complete response clocks"
            height={495}
          >
            {events.map((event, index) => (
              <g key={event.label} data-clock-event={event.label}>
                <text x="10" y={42 + index * 32}>
                  {event.label}
                </text>
                <line
                  x1="185"
                  x2="625"
                  y1={38 + index * 32}
                  y2={38 + index * 32}
                  className="sq-guide"
                />
                <circle cx={x(event.time)} cy={38 + index * 32} r="6" fill={requestColours[0]} />
                <text x={x(event.time)} y={24 + index * 32} textAnchor="middle">
                  {number(event.time)} s
                </text>
              </g>
            ))}
            <line x1={x(0)} x2={x(1)} y1="197" y2="197" stroke={requestColours[0]} />
            <text x={(x(0) + x(1)) / 2} y="220" textAnchor="middle">
              Wait 1 s
            </text>
            {outputs.length > 0 && (
              <>
                <line x1={x(0)} x2={x(outputs[0])} y1="245" y2="245" stroke={requestColours[0]} />
                <text x={(x(0) + x(outputs[0])) / 2} y="268" textAnchor="middle">
                  TTFT {number(model.ttft)} s
                </text>
              </>
            )}
            {model.gaps.map((gap, index) => (
              <g key={index}>
                <line
                  x1={x(outputs[index])}
                  x2={x(outputs[index + 1])}
                  y1={292 + index * 43}
                  y2={292 + index * 43}
                  stroke={requestColours[0]}
                />
                <text
                  x={(x(outputs[index]) + x(outputs[index + 1])) / 2}
                  y={315 + index * 43}
                  textAnchor="middle"
                >
                  Gap {index + 1}: {number(gap)} s
                </text>
              </g>
            ))}
            {outputs.length > 0 && (
              <>
                <line
                  x1={x(0)}
                  x2={x(outputs.at(-1))}
                  y1="385"
                  y2="385"
                  stroke={requestColours[0]}
                />
                <text x={(x(0) + x(outputs.at(-1))) / 2} y="408" textAnchor="middle">
                  Complete response {number(model.e2e)} s
                </text>
              </>
            )}
            <TimeAxis max={horizon} y={440} left={185} />
          </Drawing>
          <figcaption>
            Wait {number(model.wait)} s; TTFT {number(model.ttft)}; output gaps{' '}
            {model.gaps.length ? model.gaps.map((gap) => number(gap)).join(', ') : 'undefined'};
            TPOT {number(model.tpot)}; E2E {number(model.e2e)}. No output leaves TTFT and E2E
            undefined.
          </figcaption>
        </>
      )}
      <Controls
        reset={() => {
          setMode('many');
          setText('3, 3.4, 4');
        }}
      >
        <Select
          label="Output count"
          value={mode}
          change={(value) => {
            setMode(value);
            setText(
              value === 'many'
                ? '3, 3.4, 4'
                : value === 'two'
                  ? '3, 3.4'
                  : value === 'one'
                    ? '3'
                    : '',
            );
          }}
          options={[
            ['many', 'Three outputs'],
            ['two', 'Two outputs'],
            ['one', 'One output'],
            ['zero', 'Zero-output cancellation'],
          ]}
        />
        <label htmlFor={id}>
          Output timestamps (seconds, comma separated)
          <input
            id={id}
            type="text"
            value={text}
            disabled={mode === 'zero'}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
      </Controls>
    </Figure>
  );
}

export function WaitingFigure() {
  const [first, setFirst] = useState(3);
  const [lastArrival, setLastArrival] = useState(6);
  const rows = fcfs(
    requestFixture.map((row, index) =>
      index === 0
        ? { ...row, service: first }
        : index === 3
          ? { ...row, arrival: lastArrival }
          : row,
    ),
  );
  return (
    <Figure id="D02">
      <Lanes rows={rows} title="FCFS arrivals, dashed waits and solid service intervals" />
      <figcaption>
        Dot: arrival. Dashed line: waiting. Solid interval: service. A's service changes all
        following starts through the carried departure clock.
      </figcaption>
      <Table
        label="FCFS recurrence (seconds)"
        headers={['ID', 'Arrival', 'Service', 'Start', 'Departure', 'Wait']}
        rows={rows.map((row) => [
          row.id,
          row.arrival,
          row.service,
          row.start,
          row.departure,
          row.wait,
        ])}
      />
      <Controls
        reset={() => {
          setFirst(3);
          setLastArrival(6);
        }}
      >
        <Slider
          label="A service"
          value={first}
          change={setFirst}
          min={1}
          max={5}
          step={0.5}
          unit="s"
        />
        <Slider
          label="D arrival"
          value={lastArrival}
          change={setLastArrival}
          min={6}
          max={10}
          step={0.5}
          unit="s"
        />
      </Controls>
    </Figure>
  );
}

export function AreaFigure() {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(7);
  const [kind, setKind] = useState('system');
  const [selected, setSelected] = useState('A');
  const rows = fcfs();
  const model = queueAreas(rows, Math.min(left, right), Math.max(left, right))[kind];
  const x = (time) => 60 + (time / 7) * 565;
  const baseline = 345;
  const path = model.segments
    .map(
      (segment, index) =>
        `${index ? 'H' : 'M'}${x(segment.start)}${index ? `V${baseline - segment.count * 28}` : `,${baseline - segment.count * 28}`}H${x(segment.end)}`,
    )
    .join(' ');
  return (
    <Figure id="D03">
      <Drawing label="Clipped request intervals and their exact population step area" height={420}>
        {model.contributions.map((row, index) => (
          <g key={row.id}>
            <text x="12" y={49 + index * 35} fill={requestColours[index]}>
              {row.id}
            </text>
            <rect
              x={x(row.start)}
              y={30 + index * 35}
              width={x(row.end) - x(row.start)}
              height="26"
              fill={requestColours[index]}
              fillOpacity=".7"
              stroke={row.id === selected ? 'white' : 'none'}
              strokeWidth="2"
            />
          </g>
        ))}
        <rect
          x={x(model.left)}
          y="20"
          width={x(model.right) - x(model.left)}
          height="150"
          fill="none"
          stroke="white"
          strokeDasharray="4 4"
        />
        <text x="60" y="205">
          Population at the same clock: one vertical unit per resident
        </text>
        {[0, 1, 2, 3].map((count) => (
          <g key={count}>
            <text x="40" y={baseline - count * 28 + 5} textAnchor="end">
              {count}
            </text>
            <line
              x1="60"
              x2="625"
              y1={baseline - count * 28}
              y2={baseline - count * 28}
              className="sq-guide"
            />
          </g>
        ))}
        {path && (
          <>
            <path
              d={`${path}V${baseline}H${x(model.left)}Z`}
              fill={requestColours[0]}
              fillOpacity=".18"
            />
            <path d={path} fill="none" stroke={requestColours[0]} strokeWidth="3" />
          </>
        )}
        <TimeAxis max={7} y={baseline} />
        <text x="60" y="410">
          Both areas = {number(model.area)} request-seconds
        </text>
      </Drawing>
      <figcaption>
        {kind === 'system' ? 'Residents: arrival to departure' : 'Waiting: arrival to start'}. Sweep
        area {number(model.area)}; independent interval sum {number(model.intervalArea)}; average
        population {number(model.average)}. Selected {selected} contributes{' '}
        {number(model.contributions.find((row) => row.id === selected).area)} request-seconds,
        outlined without changing its hue. Equal boundaries leave a zero-width window and an
        undefined average.
      </figcaption>
      <Table
        label="Occupancy sweep"
        headers={['Interval (s)', 'Population', 'Area (request·s)']}
        rows={model.segments.map((row) => [
          `${number(row.start)}–${number(row.end)}`,
          row.count,
          number(row.area),
        ])}
      />
      <Controls
        reset={() => {
          setLeft(0);
          setRight(7);
          setKind('system');
          setSelected('A');
        }}
      >
        <Select
          label="Population"
          value={kind}
          change={setKind}
          options={[
            ['system', 'N: all residents'],
            ['queue', 'Q: waiting only'],
          ]}
        />
        <Select
          label="Selected request contribution"
          value={selected}
          change={setSelected}
          options={requestFixture.map((row) => [row.id, row.id])}
        />
        <Slider label="Boundary one" value={left} change={setLeft} max={7} step={0.5} />
        <Slider label="Boundary two" value={right} change={setRight} max={7} step={0.5} />
      </Controls>
    </Figure>
  );
}

export function ArrivalFigure() {
  const [kind, setKind] = useState('regular');
  const [width, setWidth] = useState(2);
  const [edited, setEdited] = useState(null);
  const fieldId = useId();
  const fixtures = {
    regular: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    bunched: [0, 0.1, 0.2, 0.3, 4, 5, 8.7, 8.8, 8.9, 9],
    singleton: [4],
  };
  const text = edited ?? fixtures[kind].join(', ');
  let model;
  try {
    const times = text.split(',').map((value) => (value.trim() ? Number(value) : NaN));
    if (times.some((time) => !Number.isFinite(time) || time >= 10))
      throw new Error('Use finite offered times in [0, 10), preserving their order.');
    model = arrivalDiagnostics(times, width, 10);
  } catch (error) {
    model = { error: error.message };
  }
  const highestCount = model.error ? 1 : Math.max(1, ...model.bins.map((bin) => bin.count));
  const multiplicities = new Map();
  if (!model.error) {
    for (const time of model.times) multiplicities.set(time, (multiplicities.get(time) ?? 0) + 1);
  }
  const highestMultiplicity = Math.max(1, ...multiplicities.values());
  const dotStep = Math.min(12, 72 / Math.max(1, highestMultiplicity - 1));
  const seenTimes = new Map();
  return (
    <Figure id="D04">
      {model.error ? (
        <p role="alert">Invalid arrival timestamps: {model.error}</p>
      ) : (
        <>
          <Drawing label="Actual arrival dots and count bins" height={380}>
            {model.times.map((time, index) => {
              const duplicateIndex = seenTimes.get(time) ?? 0;
              seenTimes.set(time, duplicateIndex + 1);
              return (
                <circle
                  key={index}
                  cx={60 + (time / 10) * 565}
                  cy={32 + duplicateIndex * dotStep}
                  r="4"
                  fill={requestColours[index % 5]}
                />
              );
            })}
            {[...multiplicities]
              .filter(([, count]) => count > 1)
              .map(([time, count]) => (
                <text key={time} x={60 + (time / 10) * 565} y="130" textAnchor="middle">
                  ×{count}
                </text>
              ))}
            <text x="60" y="154">
              Each dot is an offered request; identical times stack
            </text>
            <text x="12" y="250" textAnchor="middle" transform="rotate(-90 12 250)">
              Requests/bin
            </text>
            {[...new Set([0, Math.ceil(highestCount / 2), highestCount])].map((count) => (
              <g key={count}>
                <line
                  x1="54"
                  x2="625"
                  y1={300 - (count / highestCount) * 100}
                  y2={300 - (count / highestCount) * 100}
                  className="sq-guide"
                />
                <text x="44" y={305 - (count / highestCount) * 100} textAnchor="end">
                  {count}
                </text>
              </g>
            ))}
            {model.bins.map((bin, index) => (
              <g key={index}>
                <rect
                  x={60 + (bin.left / 10) * 565}
                  y={300 - (bin.count / highestCount) * 100}
                  width={((bin.right - bin.left) / 10) * 565 - 3}
                  height={(bin.count / highestCount) * 100}
                  fill={requestColours[0]}
                  fillOpacity=".6"
                />
                <text
                  x={60 + ((bin.left + bin.right) / 20) * 565}
                  y={290 - (bin.count / highestCount) * 100}
                  textAnchor="middle"
                >
                  {bin.count}
                </text>
              </g>
            ))}
            <TimeAxis max={10} y={300} />
          </Drawing>
          <figcaption>
            Gap mean {number(model.meanGap)} s; gap squared CV {number(model.caSquared)}. Bin width{' '}
            {width} s; last bin's actual exposure is shown by its boundaries. A singleton has no
            arrival gap.
          </figcaption>
        </>
      )}
      <Controls
        reset={() => {
          setKind('regular');
          setWidth(2);
          setEdited(null);
        }}
      >
        <Select
          label="Offered timestamps"
          value={kind}
          change={(value) => {
            setKind(value);
            setEdited(null);
          }}
          options={[
            ['regular', 'Regular gaps'],
            ['bunched', 'Bunched, same first/last and count'],
            ['singleton', 'Single request'],
          ]}
        />
        <label htmlFor={fieldId}>
          Editable offered times (seconds)
          <input
            id={fieldId}
            type="text"
            value={text}
            onChange={(event) => setEdited(event.target.value)}
          />
        </label>
        <Slider label="Bin width" value={width} change={setWidth} min={1} max={5} />
      </Controls>
    </Figure>
  );
}

export function ClientFigure() {
  const [service, setService] = useState(1);
  const model = clientArrivals(service);
  const max = Math.max(4, model.closed.at(-1).arrival);
  return (
    <Figure id="D05">
      <Drawing
        label="Fixed open arrivals compared with completion-paced closed arrivals"
        height={240}
      >
        {[model.open, model.closed].map((rows, lane) => (
          <g key={lane}>
            <text x="60" y={30 + lane * 75}>
              {lane
                ? 'Closed: two clients replace completions'
                : 'Open: timestamp plan stays fixed'}
            </text>
            <line x1="60" x2="625" y1={55 + lane * 75} y2={55 + lane * 75} className="sq-axis" />
            {rows.map((row, index) => (
              <circle
                key={row.id}
                cx={60 + (row.arrival / max) * 565}
                cy={55 + lane * 75 + (lane ? (row.client ? 7 : -7) : 0)}
                r="5"
                fill={requestColours[index % 5]}
              />
            ))}
          </g>
        ))}
        <TimeAxis max={max} y={170} />
      </Drawing>
      <figcaption>
        Eight planned requests in each case. By observation time 4 s: open offered{' '}
        {model.open.filter((row) => row.arrival <= 4).length}, unfinished{' '}
        {model.open.filter((row) => row.arrival <= 4 && row.arrival + service > 4).length}; closed
        offered {model.closed.filter((row) => row.arrival <= 4).length}, unfinished{' '}
        {model.closed.filter((row) => row.arrival <= 4 && row.arrival + service > 4).length}. Closed
        last offer {number(model.closed.at(-1).arrival)} s; open last offer{' '}
        {number(model.open.at(-1).arrival)} s. Closed clients share no single-worker bottleneck
        here; each represents its own completion-paced service slot.
      </figcaption>
      <Controls reset={() => setService(1)}>
        <Slider
          label="Service per request"
          value={service}
          change={setService}
          min={0.5}
          max={3}
          step={0.5}
          unit="s"
        />
      </Controls>
    </Figure>
  );
}

function StateChain({ probabilities, lambda, mu, servers = 1, finite = false }) {
  const width = Math.max(672, probabilities.length * 82 + 70);
  return (
    <Drawing
      label={`${finite ? 'Finite' : 'Infinite truncated'} birth-death states and rates`}
      height={235}
      width={width}
    >
      {finite && (
        <g>
          <path
            d={`M${55 + (probabilities.length - 1) * 82} 66c-34 -47 40 -47 15 -5l7 -2m-7 2l-2 -7`}
            fill="none"
            stroke={requestColours[1]}
          />
          <text x={55 + (probabilities.length - 1) * 82} y="22" textAnchor="middle">
            Blocked λ {number(lambda)}
          </text>
        </g>
      )}
      {probabilities.map((probability, n) => (
        <g key={n}>
          <circle
            cx={55 + n * 82}
            cy="90"
            r="24"
            fill={n >= servers ? requestColours[2] : requestColours[0]}
            fillOpacity=".18"
            stroke={n >= servers ? requestColours[2] : requestColours[0]}
          />
          <text x={55 + n * 82} y="96" textAnchor="middle">
            {n}
          </text>
          <rect
            x={31 + n * 82}
            y={205 - probability * 80}
            width="48"
            height={probability * 80}
            fill={requestColours[0]}
          />
          <text x={55 + n * 82} y="225" textAnchor="middle">
            {number(probability, 3)}
          </text>
          {n < probabilities.length - 1 && (
            <>
              <path d={`M${80 + n * 82} 67h29l-6 -4m6 4l-6 4`} fill="none" stroke="#bbb" />
              <text x={95 + n * 82} y="51" textAnchor="middle">
                λ {number(lambda)}
              </text>
              <path d={`M${109 + n * 82} 123h-29l6 -4m-6 4l6 4`} fill="none" stroke="#bbb" />
              <text x={95 + n * 82} y="148" textAnchor="middle">
                {number(Math.min(n + 1, servers) * mu)}
              </text>
            </>
          )}
        </g>
      ))}
    </Drawing>
  );
}

export function BirthDeathFigure() {
  const [lambda, setLambda] = useState(0.8);
  const model = mm1(lambda, 1);
  return (
    <Figure id="D06">
      {model.stable ? (
        <>
          <StateChain probabilities={model.probabilities} lambda={lambda} mu={1} />
          <figcaption>
            Top arrows add residents at λ; bottom arrows remove one at μ=1/s. State probability bars
            share one scale. Visible mass {number(1 - model.omittedTail)}; omitted n≥9 mass{' '}
            {number(model.omittedTail)}; total 1. At λ=0, all probability is in state 0.
          </figcaption>
        </>
      ) : (
        <p role="status">
          ρ={number(model.rho)}: no stationary distribution on this infinite queue.
        </p>
      )}
      <Controls reset={() => setLambda(0.8)}>
        <Slider
          label="Arrival rate λ"
          value={lambda}
          change={setLambda}
          min={0}
          max={1.2}
          step={0.05}
          unit="/s"
        />
      </Controls>
    </Figure>
  );
}

export function MeanFigure() {
  const [rho, setRho] = useState(0.8);
  const [mu, setMu] = useState(1);
  const model = mm1(rho * mu, mu);
  const height = 310;
  const maxY = 20 / mu;
  const x = (load) => 60 + load * 565;
  const y = (value) => 245 - (value / maxY) * 190;
  const path = (wait) =>
    Array.from({ length: 96 }, (_, index) => {
      const load = index / 100;
      const value = (wait ? load : 1) / (mu * (1 - load));
      return `${index ? 'L' : 'M'}${x(load)},${y(value)}`;
    }).join(' ');
  return (
    <Figure id="D07">
      <Drawing label="Mean residence and wait on one load/time scale" height={height}>
        <path d={path(false)} fill="none" stroke={requestColours[0]} strokeWidth="3" />
        <path
          d={path(true)}
          fill="none"
          stroke={requestColours[1]}
          strokeWidth="3"
          strokeDasharray="7 4"
        />
        <line x1="60" x2="625" y1={y(1 / mu)} y2={y(1 / mu)} className="sq-guide" />
        <text x="64" y="25">
          Seconds; top of scale {number(maxY)} s
        </text>
        <text x="350" y="55" fill={requestColours[0]}>
          Residence
        </text>
        <text x="350" y="80" fill={requestColours[1]}>
          Wait (dashed)
        </text>
        {model.stable && (
          <>
            <circle cx={x(rho)} cy={y(model.meanResponse)} r="6" fill={requestColours[0]} />
            <circle cx={x(rho)} cy={y(model.meanWait)} r="6" fill={requestColours[1]} />
          </>
        )}
        <TimeAxis max={1} y={245} label="Load ρ" />
      </Drawing>
      <figcaption>
        {model.stable
          ? `At ρ=${number(rho)}: residence ${number(model.meanResponse)} s, wait ${number(model.meanWait)} s, isolated service ${number(model.meanService)} s.`
          : 'At critical/overload input, stationary means are undefined.'}
      </figcaption>
      <Controls
        reset={() => {
          setRho(0.8);
          setMu(1);
        }}
      >
        <Slider label="Load ρ" value={rho} change={setRho} max={1} step={0.05} />
        <Slider
          label="Service rate μ"
          value={mu}
          change={setMu}
          min={0.5}
          max={3}
          step={0.5}
          unit="/s"
        />
      </Controls>
    </Figure>
  );
}

export function TailFigure() {
  const [rho, setRho] = useState(0.9);
  const [probability, setProbability] = useState(0.99);
  const [deadline, setDeadline] = useState(10);
  const model = mm1(rho, 1, probability);
  const violation = survival(rho, 1, deadline);
  const horizon = 50;
  const path = (key) =>
    Array.from(
      { length: 101 },
      (_, index) =>
        `${index ? 'L' : 'M'}${60 + (index / 100) * 565},${220 - survival(rho, 1, (index / 100) * horizon)[key] * 170}`,
    ).join(' ');
  return (
    <Figure id="D08">
      <Drawing label="Response and waiting survival with the wait-at-zero atom" height={285}>
        <text x="60" y="24">
          Survival probability: 0 to 1
        </text>
        <path d={path('response')} stroke={requestColours[0]} strokeWidth="3" fill="none" />
        <path
          d={path('wait')}
          stroke={requestColours[1]}
          strokeDasharray="6 4"
          strokeWidth="3"
          fill="none"
        />
        <line
          x1="60"
          x2="625"
          y1={220 - (1 - probability) * 170}
          y2={220 - (1 - probability) * 170}
          className="sq-guide"
        />
        <text x="290" y="55" fill={requestColours[0]}>
          Response
        </text>
        <text x="290" y="80" fill={requestColours[1]}>
          Wait (dashed)
        </text>
        <line
          x1="60"
          x2="60"
          y1="50"
          y2={220 - rho * 170}
          stroke={requestColours[1]}
          strokeWidth="5"
        />
        <text x="450" y="125" fill={requestColours[1]}>
          Wait atom {number(model.waitAtom)}
        </text>
        {[0, 0.5, 1].map((value) => (
          <text key={value} x="45" y={225 - value * 170} textAnchor="end">
            {value}
          </text>
        ))}
        <line
          x1={60 + (deadline / horizon) * 565}
          x2={60 + (deadline / horizon) * 565}
          y1="50"
          y2="220"
          stroke="white"
          strokeDasharray="4 4"
        />
        {['response', 'wait'].map((key, index) => (
          <circle
            key={key}
            cx={60 + (deadline / horizon) * 565}
            cy={220 - violation[key] * 170}
            r="5"
            fill={requestColours[index]}
          />
        ))}
        {[model.responseQuantile, model.waitQuantile].map((time, index) =>
          Number.isFinite(time) && time <= horizon ? (
            <circle
              key={index}
              cx={60 + (time / horizon) * 565}
              cy={220 - (index === 1 && time === 0 ? rho : 1 - probability) * 170}
              r="5"
              fill={requestColours[index]}
              stroke="white"
            />
          ) : null,
        )}
        <TimeAxis max={horizon} y={220} />
      </Drawing>
      <figcaption>
        Quantile p={number(probability)}: response {number(model.responseQuantile)} s; wait{' '}
        {number(model.waitQuantile)} s. The wait quantile is zero when p falls in the no-wait atom.
        p=1 gives an infinite upper quantile for positive exponential tails. At deadline {deadline}{' '}
        s (white ruler), response violation {number(violation.response)} and wait violation{' '}
        {number(violation.wait)}. Outlined dots mark finite positive quantiles on the target
        survival level; a zero-wait quantile sits at the lower end of the atom.{' '}
        {rho === 0 &&
          'At zero arrivals, the response law describes a hypothetical test job; there is no offered flow to measure.'}
      </figcaption>
      <Controls
        reset={() => {
          setRho(0.9);
          setProbability(0.99);
          setDeadline(10);
        }}
      >
        <Slider label="Load ρ" value={rho} change={setRho} max={0.95} step={0.05} />
        <Select
          label="Quantile p"
          value={probability}
          change={(value) => setProbability(Number(value))}
          options={[
            [0.05, '.05'],
            [0.5, '.5'],
            [0.99, '.99'],
            [1, '1'],
          ]}
        />
        <Slider label="Deadline" value={deadline} change={setDeadline} max={50} step={5} unit="s" />
      </Controls>
    </Figure>
  );
}

export function ResidualFigure() {
  const [kind, setKind] = useState('mixture');
  const [observedAt, setObservedAt] = useState(7);
  const durations = kind === 'mixture' ? [...Array(9).fill(0.5), 5.5] : Array(10).fill(1);
  const total = durations.reduce((sum, value) => sum + value, 0);
  let offset = 0;
  const triangles = durations.map((duration, index) => {
    const start = offset;
    offset += duration;
    return { start, duration, index };
  });
  const source = pk(0.8, kind);
  const observed = triangles.find(
    (row) => observedAt >= row.start && observedAt < row.start + row.duration,
  );
  const residual = observed.start + observed.duration - observedAt;
  return (
    <Figure id="D09">
      <Drawing label="Service intervals and residual-work triangles" height={275}>
        <text x="60" y="25">
          Ten completed jobs; total length {number(total)} s
        </text>
        {triangles.map((row) => (
          <g key={row.index}>
            <rect
              x={60 + (row.start / total) * 565}
              y="50"
              width={(row.duration / total) * 565}
              height="22"
              fill={requestColours[row.index % 5]}
            />
            <path
              d={`M${60 + (row.start / total) * 565} 205v${-row.duration * 20}l${(row.duration / total) * 565} ${row.duration * 20}Z`}
              fill={requestColours[row.index % 5]}
              fillOpacity=".25"
              stroke={requestColours[row.index % 5]}
            />
          </g>
        ))}
        <line
          x1={60 + (observedAt / total) * 565}
          x2={60 + (observedAt / total) * 565}
          y1="40"
          y2="205"
          stroke="white"
          strokeDasharray="4 4"
        />
        <circle
          cx={60 + (observedAt / total) * 565}
          cy={205 - residual * 20}
          r="6"
          fill={requestColours[observed.index % 5]}
          stroke="white"
          strokeWidth="2"
        />
        <text x="60" y="85">
          Residual height declines to zero during each service
        </text>
        <TimeAxis max={total} y={205} />
      </Drawing>
      <figcaption>
        The nine short jobs and one long job occupy different shares of observed time. Each triangle
        has area s²/2. Mean residual from this repeating distribution: {number(source.residualMean)}{' '}
        s; second moment {number(source.secondMoment)} s². Observation at {observedAt} s falls
        inside a {observed.duration} s service, with {number(residual)} s remaining; the white ruler
        selects it.
      </figcaption>
      <Controls
        reset={() => {
          setKind('mixture');
          setObservedAt(7);
        }}
      >
        <Select
          label="Service distribution"
          value={kind}
          change={setKind}
          options={[
            ['mixture', 'Nine .5 s, one 5.5 s'],
            ['constant', 'Ten 1 s jobs'],
          ]}
        />
        <Slider
          label="Time observation"
          value={observedAt}
          change={setObservedAt}
          max={9.5}
          step={0.5}
          unit="s"
        />
      </Controls>
    </Figure>
  );
}

export function VariabilityFigure() {
  const [kind, setKind] = useState('mixture');
  const [lambda, setLambda] = useState(0.8);
  const model = pk(lambda, kind);
  return (
    <Figure id="D10">
      <Drawing label="Selected service duration distribution" height={255}>
        {kind === 'exponential' ? (
          <>
            <path
              d={Array.from(
                { length: 101 },
                (_, index) =>
                  `${index ? 'L' : 'M'}${60 + (index / 100) * 565},${195 - Math.exp((-index / 100) * 6) * 120}`,
              ).join(' ')}
              fill="none"
              stroke={requestColours[2]}
              strokeWidth="3"
            />
            <text x="250" y="45">
              Density e⁻ˢ; continuous support
            </text>
          </>
        ) : (
          model.support.map((row, index) => (
            <g key={index}>
              <line
                x1={60 + (row.duration / 6) * 565}
                x2={60 + (row.duration / 6) * 565}
                y1="195"
                y2={195 - row.probability * 120}
                stroke={requestColours[index]}
                strokeWidth="12"
              />
              <text
                x={60 + (row.duration / 6) * 565}
                y={180 - row.probability * 120}
                textAnchor="middle"
              >
                p={number(row.probability)}
              </text>
            </g>
          ))
        )}
        <TimeAxis max={6} y={195} label="Service duration (s)" />
      </Drawing>
      <figcaption>
        Mean service {number(model.mean)} s, second moment {number(model.secondMoment)} s², service
        squared CV {number(model.csSquared)}. P-K wait {number(model.meanWait)} s; residence{' '}
        {number(model.meanResponse)} s. p99 is not determined by these moments.
      </figcaption>
      <Controls
        reset={() => {
          setKind('mixture');
          setLambda(0.8);
        }}
      >
        <Select
          label="Service law"
          value={kind}
          change={setKind}
          options={[
            ['constant', 'Constant'],
            ['exponential', 'Exponential'],
            ['mixture', 'Two-point mixture'],
          ]}
        />
        <Slider
          label="Arrival rate λ"
          value={lambda}
          change={setLambda}
          max={0.95}
          step={0.05}
          unit="/s"
        />
      </Controls>
    </Figure>
  );
}

export function KingmanFigure() {
  const [ca, setCa] = useState(4);
  const [cs, setCs] = useState(1);
  const [rho, setRho] = useState(0.8);
  const [renewal, setRenewal] = useState('yes');
  const [mean, setMean] = useState(1);
  const model = kingman(ca, cs, rho, mean, renewal === 'yes');
  return (
    <Figure id="D11">
      <Drawing label="Arrival and service variability plane at the selected load" height={345}>
        {[2, 4, 6].map((sum) => (
          <g key={sum}>
            <line
              x1={60 + (Math.max(0, sum - 5) / 5) * 400}
              x2={60 + (Math.min(5, sum) / 5) * 400}
              y1={260 - (Math.min(5, sum) / 5) * 200}
              y2={260 - (Math.max(0, sum - 5) / 5) * 200}
              stroke="#888"
              strokeDasharray="5 4"
            />
            <text x="480" y={70 + sum * 25}>
              Cₐ²+Cₛ²={sum}
            </text>
          </g>
        ))}
        <line x1="60" x2="460" y1="260" y2="260" className="sq-axis" />
        <line x1="60" x2="60" y1="60" y2="260" className="sq-axis" />
        <text x="70" y="30">
          Cₛ²: 0 at bottom, 5 at top
        </text>
        <text x="460" y="305" textAnchor="end">
          Cₐ²: 0 to 5
        </text>
        <circle
          cx={60 + (ca / 5) * 400}
          cy={260 - (cs / 5) * 200}
          r="8"
          fill={requestColours[2]}
          stroke="white"
          strokeWidth="2"
        />
      </Drawing>
      <figcaption>
        Variability factor {number(model.variability)} × load factor {number(model.loadMultiplier)}{' '}
        × mean service {number(mean)} s → approximate wait {number(model.estimate)} s.{' '}
        {model.applicable
          ? 'Independent renewal gaps and finite variances assumed.'
          : 'Correlated arrivals fall outside this approximation; no estimate is supplied.'}
      </figcaption>
      <Controls
        reset={() => {
          setCa(4);
          setCs(1);
          setRho(0.8);
          setMean(1);
          setRenewal('yes');
        }}
      >
        <Slider label="Arrival squared CV Cₐ²" value={ca} change={setCa} max={5} step={0.5} />
        <Slider label="Service squared CV Cₛ²" value={cs} change={setCs} max={5} step={0.5} />
        <Slider label="Load ρ" value={rho} change={setRho} max={0.95} step={0.05} />
        <Slider
          label="Mean service"
          value={mean}
          change={setMean}
          min={0.5}
          max={2}
          step={0.5}
          unit="s"
        />
        <Select
          label="Arrival assumption"
          value={renewal}
          change={setRenewal}
          options={[
            ['yes', 'Independent renewal gaps'],
            ['no', 'Correlated gaps: outside model'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function SharingFigure() {
  const [capacity, setCapacity] = useState(1);
  const [work, setWork] = useState(1);
  const requests = [
    { id: 'A', arrival: 0, service: 4 },
    { id: 'B', arrival: 1, service: work },
  ];
  const model = processorSharing(requests, capacity);
  const fifo = fcfs(requests.map((row) => ({ ...row, service: row.service / capacity })));
  const horizon = Math.max(1, ...model.rows.map((row) => row.departure));
  const x = (time) => 60 + (time / horizon) * 565;
  return (
    <Figure id="D12">
      <Drawing label="Attained work slopes under equal processor sharing" height={310}>
        {requests.map((row, index) => (
          <g key={row.id}>
            <text x="70" y={35 + index * 25} fill={requestColours[index]}>
              {row.id}, required work {row.service}
            </text>
            {model.segments.flatMap((segment, i) =>
              segment.contributions
                .filter((item) => item.id === row.id)
                .map((item) => (
                  <line
                    key={i}
                    x1={x(segment.start)}
                    x2={x(segment.end)}
                    y1={245 - (item.attainedBefore / 4) * 160}
                    y2={
                      245 - ((item.attainedBefore + segment.elapsedOperand * item.rate) / 4) * 160
                    }
                    stroke={requestColours[index]}
                    strokeWidth="3"
                  />
                )),
            )}
          </g>
        ))}
        <text x="330" y="35">
          Vertical: attained work, 0 to 4
        </text>
        <TimeAxis max={horizon} y={245} />
      </Drawing>
      <figcaption>
        Total work {number(model.work)} units; aggregate rate {capacity} unit/s. Slopes change at
        arrivals and completions. Zero-size B completes at its arrival without occupying a share.
      </figcaption>
      <Table
        label="Equal-work PS and FCFS completion clocks"
        headers={['Request', 'Arrival', 'Work', 'PS departure', 'PS residence', 'FCFS departure']}
        rows={model.rows.map((row, index) => [
          row.id,
          row.arrival,
          row.service,
          number(row.departure),
          number(row.response),
          number(fifo[index].departure),
        ])}
      />
      <Controls
        reset={() => {
          setCapacity(1);
          setWork(1);
        }}
      >
        <Slider
          label="Aggregate capacity"
          value={capacity}
          change={setCapacity}
          min={1}
          max={2}
          step={0.5}
        />
        <Slider label="B required work" value={work} change={setWork} max={3} step={0.5} />
      </Controls>
    </Figure>
  );
}

export function PoolingFigure() {
  const [policy, setPolicy] = useState('pooled');
  const rows = pooledQueue(
    requestFixture,
    policy === 'fast' ? 1 : 2,
    policy === 'split' ? [0, 0, 0, 1] : null,
    policy === 'fast' ? 2 : 1,
  );
  return (
    <Figure id="D13">
      <Drawing label="Service intervals assigned to actual worker lanes" height={260}>
        {Array.from({ length: policy === 'fast' ? 1 : 2 }, (_, worker) => (
          <g key={worker}>
            <text x="10" y={69 + worker * 70}>
              W{worker}
            </text>
            <line
              x1="60"
              x2="625"
              y1={65 + worker * 70}
              y2={65 + worker * 70}
              className="sq-guide"
            />
            {rows
              .filter((row) => row.server === worker)
              .map((row) => {
                const colour =
                  requestColours[requestFixture.findIndex((item) => item.id === row.id)];
                return (
                  <g key={row.id}>
                    <rect
                      x={60 + (row.start / 7) * 565}
                      y={50 + worker * 70}
                      width={((row.departure - row.start) / 7) * 565}
                      height="30"
                      fill={colour}
                    />
                    <text
                      x={60 + ((row.start + row.departure) / 14) * 565}
                      y={71 + worker * 70}
                      textAnchor="middle"
                      fill="#101010"
                    >
                      {row.id}
                    </text>
                  </g>
                );
              })}
          </g>
        ))}
        <TimeAxis max={7} y={185} />
      </Drawing>
      <Lanes
        rows={rows}
        title="The same requests: arrival dots, dashed queue waits and solid service"
      />
      <figcaption>
        {policy === 'pooled'
          ? 'One queue sends the next request to the first idle worker.'
          : policy === 'split'
            ? 'A/B/C are assigned to worker 0; worker 1 can be idle while that queue waits.'
            : 'One worker serves every individual request at twice the rate.'}
      </figcaption>
      <Table
        label="Dispatch and actual service clocks"
        headers={['ID', 'Worker', 'Start', 'Departure', 'Wait']}
        rows={rows.map((row) => [row.id, row.server, row.start, row.departure, row.wait])}
      />
      <Controls reset={() => setPolicy('pooled')}>
        <Select
          label="Architecture"
          value={policy}
          change={setPolicy}
          options={[
            ['pooled', 'Two workers, pooled queue'],
            ['split', 'Two workers, uneven split'],
            ['fast', 'One double-speed worker'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function ErlangFigure() {
  const [lambda, setLambda] = useState(3);
  const [servers, setServers] = useState(2);
  const model = erlangC(lambda, 2, servers);
  return (
    <Figure id="D14">
      {model.stable && (
        <StateChain probabilities={model.probabilities} lambda={lambda} mu={2} servers={servers} />
      )}
      <figcaption>
        Resident n has departure rate min(n,c)×2/s. Violet states n≥c have every worker occupied;
        arrivals then wait.{' '}
        {model.stable
          ? `Probability of waiting C=${number(model.probabilityWait)}; mean wait ${number(model.meanWait)} s; mean residence ${number(model.meanResponse)} s. Omitted n≥9 probability ${number(model.omittedTail)}.`
          : 'Offered load reaches/exceeds capacity: no stationary Erlang-C mean.'}
      </figcaption>
      <Controls
        reset={() => {
          setLambda(3);
          setServers(2);
        }}
      >
        <Slider label="Arrival rate λ" value={lambda} change={setLambda} max={6} step={0.5} />
        <Slider label="Worker count c" value={servers} change={setServers} min={1} max={3} />
      </Controls>
    </Figure>
  );
}

export function FiniteFigure() {
  const [lambda, setLambda] = useState(1);
  const [capacity, setCapacity] = useState(3);
  const model = finiteQueue(lambda, 1, capacity);
  return (
    <Figure id="D15">
      <StateChain probabilities={model.probabilities} lambda={lambda} mu={1} finite />
      <figcaption>
        State K={capacity} blocks new offers: probability {number(model.blocking)}. Finite resident
        mean {number(model.population)}; admitted throughput {number(model.admittedRate)}/s;
        admitted mean residence {number(model.response)} s. At ρ=1 the states are uniform. This is a
        resident bound, not a hard service-duration bound.
      </figcaption>
      <Controls
        reset={() => {
          setLambda(1);
          setCapacity(3);
        }}
      >
        <Slider label="Offered rate λ" value={lambda} change={setLambda} max={2} step={0.25} />
        <Slider
          label="Total resident bound K"
          value={capacity}
          change={setCapacity}
          min={1}
          max={6}
        />
      </Controls>
    </Figure>
  );
}
