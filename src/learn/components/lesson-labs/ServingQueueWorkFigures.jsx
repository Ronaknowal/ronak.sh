import { useEffect, useId, useRef, useState } from 'react';
import {
  requestColours,
  requestFixture,
  tokenSchedule,
  defaultTokenRequests,
  routeWork,
  deadlineTrace,
  retryTrace,
  delayedCapacity,
  hysteresisTrace,
  parseAzureCsv,
  traceReplay,
  sloCohort,
  quantile,
  cumulativeBuckets,
  histogramQuantile,
  fcfs,
  pooledQueue,
} from '../../data/llm-serving-queue-models.js';
import {
  Figure,
  Drawing,
  Controls,
  Select,
  Slider,
  Table,
  TimeAxis,
  Lanes,
  number,
} from './ServingQueueFigures.jsx';

const assetBase = '/learn/examples/llm-serving-queues/';
const requests = new Map();

function loadData(filename, parser) {
  if (!requests.has(filename)) {
    const request = fetch(assetBase + filename)
      .then((response) => {
        if (!response.ok || /text\/html/i.test(response.headers.get('content-type') ?? ''))
          throw new Error('Dataset unavailable');
        return response.text();
      })
      .then(parser)
      .catch((error) => {
        requests.delete(filename);
        throw error;
      });
    requests.set(filename, request);
  }
  return requests.get(filename);
}

export function DataView({ filename, parser = JSON.parse, children, label }) {
  const host = useRef(null);
  const [near, setNear] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!window.IntersectionObserver) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    let active = true;
    setError(false);
    loadData(filename, parser)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [filename, parser, near, attempt]);
  return (
    <div ref={host} className="sq-data">
      {data !== null ? (
        children(data)
      ) : error ? (
        <p role="alert">
          {label} could not load.{' '}
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </button>
        </p>
      ) : (
        <p role="status">
          {near ? `Loading ${label}…` : `${label} loads as this view approaches.`}
        </p>
      )}
    </div>
  );
}

export function MemoryFigure() {
  const [blocks, setBlocks] = useState(8);
  const [selected, setSelected] = useState(0);
  const model = tokenSchedule({ blocks });
  const iteration = model.iterations[Math.min(selected, Math.max(0, model.iterations.length - 1))];
  const reserved = iteration?.reservedBefore ?? {};
  const committed = iteration?.committedAfter ?? {};
  const owners = Object.entries(reserved).flatMap(([id, count]) =>
    Array.from({ length: count }, (_, block) => ({ id, committed: block < committed[id] })),
  );
  const free = blocks - owners.length;
  const waiting = iteration
    ? model.rows.filter(
        (row) =>
          row.arrival <= iteration.end && row.admitted !== null && row.admitted > iteration.start,
      )
    : [];
  return (
    <Figure id="D16">
      <Drawing
        label="CPU waiting IDs outside the reserved and committed KV block grid"
        height={330}
      >
        <text x="25" y="28">
          CPU waiting
        </text>
        {waiting.length ? (
          waiting.map((row, index) => (
            <text
              key={row.id}
              x="30"
              y={65 + index * 35}
              fill={requestColours[defaultTokenRequests.findIndex((item) => item.id === row.id)]}
            >
              {row.id}
            </text>
          ))
        ) : (
          <text x="25" y="65">
            None
          </text>
        )}
        <line x1="155" x2="155" y1="20" y2="280" className="sq-guide" />
        <text x="190" y="28">
          KV capacity: {blocks} blocks × 4 token slots
        </text>
        {Array.from({ length: blocks }, (_, block) => {
          const owner = owners[block];
          const colour = owner
            ? requestColours[defaultTokenRequests.findIndex((row) => row.id === owner.id)]
            : '#777';
          const x = 190 + (block % 4) * 111;
          const y = 48 + Math.floor(block / 4) * 53;
          return (
            <g key={block}>
              <rect
                x={x}
                y={y}
                width="100"
                height="35"
                fill={owner?.committed ? colour : 'none'}
                fillOpacity={owner?.committed ? '.6' : undefined}
                stroke={colour}
                strokeDasharray={owner && !owner.committed ? '4 3' : undefined}
              />
              {[1, 2, 3].map((slot) => (
                <line
                  key={slot}
                  x1={x + slot * 25}
                  x2={x + slot * 25}
                  y1={y}
                  y2={y + 35}
                  stroke="#303030"
                />
              ))}
              <text x={x + 50} y={y + 25} textAnchor="middle">
                {owner ? `${owner.id} ${owner.committed ? 'KV' : 'reserve'}` : 'free'}
              </text>
            </g>
          );
        })}
        <text x="190" y="300">
          Solid: committed blocks; dashed: reserved, not committed
        </text>
      </Drawing>
      <figcaption>
        {iteration
          ? `Iteration ${iteration.index + 1}, after work and before release. Reserved ${owners.length}, free ${free}; total ${blocks}. Released at end: ${iteration.released.join(', ') || 'none'}.`
          : 'No admitted operation.'}{' '}
        Reservations use known output targets in this toy. Requests rejected for impossible peak
        memory never enter the grid.
      </figcaption>
      <Table
        label="Admission outcomes from the complete toy trace"
        headers={['ID', 'Peak blocks', 'Admission (s)', 'Final status']}
        rows={model.rows.map((row) => [row.id, row.reserved, number(row.admitted), row.status])}
      />
      <Controls
        reset={() => {
          setBlocks(8);
          setSelected(0);
        }}
      >
        <Slider
          label="Available KV blocks"
          value={blocks}
          change={(value) => {
            setBlocks(value);
            setSelected(0);
          }}
          min={2}
          max={16}
          step={2}
        />
        <Slider
          label="Iteration index (zero-based)"
          value={Math.min(selected, Math.max(0, model.iterations.length - 1))}
          change={setSelected}
          max={Math.max(0, model.iterations.length - 1)}
        />
      </Controls>
    </Figure>
  );
}

export function IterationFigure() {
  const patternId = useId();
  const [budget, setBudget] = useState(4);
  const [policy, setPolicy] = useState('chunked');
  const [targets, setTargets] = useState('default');
  const model = tokenSchedule({
    budget,
    chunked: policy === 'chunked',
    requests:
      targets === 'zero'
        ? defaultTokenRequests.map((row) => ({ ...row, outputTarget: 0 }))
        : defaultTokenRequests,
  });
  const width = Math.max(672, 90 + model.iterations.length * 90);
  return (
    <Figure id="D17">
      {model.iterations.length ? (
        <Drawing
          label="Request rows and actual input-token slabs per iteration"
          width={width}
          height={320}
        >
          <defs>
            <pattern id={patternId} width="7" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 7L7 0" stroke="#111" strokeWidth="2" />
            </pattern>
          </defs>
          {model.iterations.map((iteration, column) => (
            <g key={column}>
              <text x={90 + column * 90} y="30" textAnchor="middle">
                Iter {column + 1}
              </text>
              {defaultTokenRequests.map((request, row) => {
                const operation = iteration.operations.find((item) => item.id === request.id);
                const x = 55 + column * 90;
                const y = 70 + row * 60;
                return (
                  <g key={request.id}>
                    <rect x={x} y={y} width="75" height="32" fill="none" stroke="#666" />
                    {operation && (
                      <>
                        <rect
                          x={x}
                          y={y}
                          width={(75 * operation.inputs) / budget}
                          height="32"
                          fill={requestColours[row]}
                          fillOpacity={operation.phase === 'decode' ? '.85' : '.35'}
                        />
                        {operation.phase === 'prefill' && (
                          <rect
                            x={x}
                            y={y}
                            width={(75 * operation.inputs) / budget}
                            height="32"
                            fill={`url(#${patternId})`}
                          />
                        )}
                        <text x={x + 37} y={y + 22} textAnchor="middle">
                          {operation.phase === 'decode' ? 'D' : 'P'} {operation.inputs}
                        </text>
                      </>
                    )}
                    {iteration.emitted.includes(request.id) && (
                      <circle cx={x + 82} cy={y + 16} r="4" fill={requestColours[row]} />
                    )}
                  </g>
                );
              })}
            </g>
          ))}
          {defaultTokenRequests.map((row, index) => (
            <text key={row.id} x="10" y={92 + index * 60} fill={requestColours[index]}>
              {row.id}
            </text>
          ))}
          <text x="55" y="295">
            P: hatched prompt inputs; D: solid decode input; dot: output emitted
          </text>
        </Drawing>
      ) : (
        <p>No model inputs are scheduled: all output targets are zero.</p>
      )}
      <figcaption>
        Each column has {budget} available input slots shared across rows. Rectangle width is input
        count, not elapsed time. Unused space is visible. Outputs are markers, not extra processed
        inputs.
      </figcaption>
      <Table
        label="Processed inputs and emitted outputs"
        headers={['ID', 'Prompt inputs', 'Decode inputs', 'Outputs', 'Status']}
        rows={model.rows.map((row) => [
          row.id,
          row.processedPrompt,
          row.decodeInputs,
          row.generated,
          row.status,
        ])}
      />
      <Controls
        reset={() => {
          setBudget(4);
          setPolicy('chunked');
          setTargets('default');
        }}
      >
        <Slider
          label="Input-token budget"
          value={budget}
          change={setBudget}
          min={4}
          max={16}
          step={4}
        />
        <Select
          label="Prompt policy"
          value={policy}
          change={setPolicy}
          options={[
            ['chunked', 'Chunked prefill'],
            ['full', 'Full prefill only'],
          ]}
        />
        <Select
          label="Output targets"
          value={targets}
          change={setTargets}
          options={[
            ['default', 'A3, B2, C1'],
            ['zero', 'All zero: constructed cancellation'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function CostClockFigure() {
  const [budget, setBudget] = useState(4);
  const [sequences, setSequences] = useState(3);
  const [blocks, setBlocks] = useState(8);
  const model = tokenSchedule({ budget, sequences, blocks });
  const horizon = Math.max(0.01, ...model.iterations.map((row) => row.end));
  const x = (time) => 60 + (time / horizon) * 565;
  return (
    <Figure id="D18">
      <Drawing label="Actual iteration duration split into fictional cost operands" height={330}>
        {model.iterations.map((row) => {
          const pieces = [0.02, 0.005 * row.prefill, 0.01 * row.decode, 0.0001 * row.context];
          let left = row.start;
          return (
            <g key={row.index}>
              {pieces.map((cost, index) => {
                const start = left;
                left += cost;
                return (
                  <rect
                    key={index}
                    x={x(start)}
                    y="45"
                    width={x(left) - x(start)}
                    height="35"
                    fill={requestColours[index]}
                  />
                );
              })}
              <line x1={x(row.end)} x2={x(row.end)} y1="40" y2="230" className="sq-guide" />
            </g>
          );
        })}
        {model.rows.map((row, index) => (
          <g key={row.id}>
            <text x="14" y={126 + index * 38} fill={requestColours[index]}>
              {row.id}
            </text>
            <line
              x1={x(row.arrival)}
              x2={x(row.finish ?? row.arrival)}
              y1={120 + index * 38}
              y2={120 + index * 38}
              stroke={requestColours[index]}
              strokeDasharray="4 3"
            />
            {row.outputs.map((time, output) => (
              <circle
                key={output}
                cx={x(time)}
                cy={120 + index * 38}
                r="5"
                fill={requestColours[index]}
              />
            ))}
          </g>
        ))}
        <TimeAxis max={horizon} y={260} />
      </Drawing>
      <figcaption>
        The top cost strip uses a local role encoding: blue overhead .02 s, amber .005×prompt
        inputs, violet .01×decode requests, rose .0001×decode-context tokens. Lower lanes retain
        request identity. Coefficients are fictional; markers come from the scheduler's actual
        operands.
      </figcaption>
      <Table
        label="Derived request latency (toy seconds)"
        headers={['ID', 'TTFT', 'TPOT', 'E2E']}
        rows={model.rows.map((row) => [
          row.id,
          number(row.ttft, 6),
          number(row.tpot, 6),
          number(row.e2e, 6),
        ])}
      />
      <Controls
        reset={() => {
          setBudget(4);
          setSequences(3);
          setBlocks(8);
        }}
      >
        <Slider
          label="Input-token budget"
          value={budget}
          change={setBudget}
          min={4}
          max={16}
          step={4}
        />
        <Slider
          label="Active-sequence limit"
          value={sequences}
          change={setSequences}
          min={2}
          max={3}
        />
        <Slider label="KV blocks" value={blocks} change={setBlocks} min={4} max={16} step={4} />
      </Controls>
    </Figure>
  );
}

export function RoutingFigure() {
  const [policy, setPolicy] = useState('count');
  const [long, setLong] = useState(8);
  const actual = routeWork([long], [1, 1], 2, policy === 'estimated' ? 'work' : policy);
  const selected = policy === 'estimated' ? 0 : actual.selected;
  const horizon = Math.max(10, long + 2);
  return (
    <Figure id="D19">
      <Drawing
        label="Unfinished jobs and the new request's actual chosen service lane"
        height={260}
      >
        {[[long], [1, 1]].map((queue, worker) => {
          let position = 0;
          return (
            <g key={worker}>
              <text x="10" y={68 + worker * 75}>
                W{worker}
              </text>
              {queue.map((work, index) => {
                const start = position;
                position += work;
                const colour = requestColours[worker ? index + 1 : 0];
                return (
                  <g key={index}>
                    <rect
                      x={60 + (start / horizon) * 565}
                      y={45 + worker * 75}
                      width={(work / horizon) * 565}
                      height="30"
                      fill={colour}
                    />
                    <text
                      x={60 + ((start + work / 2) / horizon) * 565}
                      y={(work > 0 ? 66 : 35) + worker * 75}
                      textAnchor="middle"
                      fill={work > 0 ? '#111' : '#ddd'}
                    >
                      {work}
                    </text>
                  </g>
                );
              })}
              {selected === worker && (
                <>
                  <rect
                    x={60 + (position / horizon) * 565}
                    y={45 + worker * 75}
                    width={(2 / horizon) * 565}
                    height="30"
                    fill={requestColours[3]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={60 + ((position + 1) / horizon) * 565}
                    y={100 + worker * 75}
                    textAnchor="middle"
                  >
                    New D
                  </text>
                </>
              )}
            </g>
          );
        })}
        <TimeAxis max={horizon} y={190} label="Unfinished work (units)" />
      </Drawing>
      <figcaption>
        Counts: 1 versus 2. Actual work: {long} versus 2. Selected worker {selected}; new D's actual
        residence at unit rate is {number(actual.work[selected] + 2)} s.{' '}
        {policy === 'estimated'
          ? 'Constructed estimate says worker 0 has only 1 unit left; its predicted 3 seconds disagrees with actual work.'
          : 'Count and work policies use their stated quantities; ties choose worker0.'}
      </figcaption>
      <Controls
        reset={() => {
          setPolicy('count');
          setLong(8);
        }}
      >
        <Select
          label="Routing quantity"
          value={policy}
          change={setPolicy}
          options={[
            ['count', 'Shortest queue count'],
            ['work', 'Exact remaining-work oracle'],
            ['estimated', 'Wrong work estimate: W0=1'],
          ]}
        />
        <Slider label="Worker 0 unfinished work" value={long} change={setLong} max={12} />
      </Controls>
    </Figure>
  );
}

export function DeadlineFigure() {
  const [deadline, setDeadline] = useState(2);
  const [estimate, setEstimate] = useState(2);
  const [policy, setPolicy] = useState('waiting');
  const rows = [
    { id: 'A', arrival: 0, service: 4, deadline: 10 },
    { id: 'B', arrival: 0.5, service: 1, deadline },
    { id: 'C', arrival: 1, service: 2, deadline: 5 },
  ];
  const model = deadlineTrace(rows, policy !== 'ignore', policy === 'running');
  return (
    <Figure id="D20">
      <Drawing
        label="Estimated elapsed, queued and service time against a fixed deadline"
        height={310}
      >
        {[
          { start: 0, length: 1, label: 'Elapsed', colour: requestColours[0] },
          { start: 1, length: estimate, label: 'Estimated wait', colour: requestColours[1] },
          { start: 1 + estimate, length: 2, label: 'Estimated service', colour: requestColours[2] },
        ].map((part, index) => (
          <g key={part.label}>
            <line x1="60" x2="625" y1={63 + index * 50} y2={63 + index * 50} className="sq-guide" />
            <rect
              x={60 + (part.start / 7) * 565}
              y={50 + index * 50}
              width={(part.length / 7) * 565}
              height="26"
              fill={part.colour}
            />
            {part.length === 0 && (
              <line
                x1={60 + (part.start / 7) * 565}
                x2={60 + (part.start / 7) * 565}
                y1={50 + index * 50}
                y2={76 + index * 50}
                stroke={part.colour}
                strokeWidth="3"
              />
            )}
            <text
              x={60 + ((part.start + part.length / 2) / 7) * 565}
              y={35 + index * 50}
              textAnchor="middle"
            >
              {part.label}: {number(part.length)} s
            </text>
          </g>
        ))}
        <line
          x1={60 + (5 / 7) * 565}
          x2={60 + (5 / 7) * 565}
          y1="15"
          y2="212"
          stroke="white"
          strokeDasharray="4 4"
        />
        <text x={60 + (5 / 7) * 565} y="231" textAnchor="middle">
          Deadline 5 s
        </text>
        <TimeAxis max={7} y={250} />
      </Drawing>
      <figcaption>
        Separate constructed estimate: elapsed 1 + estimated wait {estimate} + estimated service 2 ={' '}
        {3 + estimate} s; deadline margin {2 - estimate} s. This prediction is distinct from the
        actual cancellation trace below.
      </figcaption>
      <Lanes
        rows={model.rows}
        max={7}
        title="Deadline-aware service work, including canceled waiting requests"
      />
      <figcaption>
        B's absolute deadline is {deadline} s. Policy:{' '}
        {policy === 'ignore'
          ? 'cancellation ignored'
          : policy === 'running'
            ? 'waiting and running cancellation honored'
            : 'waiting cancellation honored'}
        . Total actual work spent {model.work} s; canceling queued work leaves no service interval.
      </figcaption>
      <Table
        label="Deadline and worker outcomes"
        headers={['ID', 'Deadline', 'Start', 'Finish', 'Work spent', 'Outcome']}
        rows={model.rows.map((row) => [
          row.id,
          row.deadline,
          number(row.start),
          row.finish,
          row.work,
          row.status,
        ])}
      />
      <Controls
        reset={() => {
          setDeadline(2);
          setEstimate(2);
          setPolicy('waiting');
        }}
      >
        <Slider
          label="Estimated queue delay"
          value={estimate}
          change={setEstimate}
          max={4}
          step={0.5}
          unit="s"
        />
        <Slider
          label="B absolute deadline"
          value={deadline}
          change={setDeadline}
          min={0.5}
          max={6}
          step={0.5}
          unit="s"
        />
        <Select
          label="Cancellation handling"
          value={policy}
          change={setPolicy}
          options={[
            ['waiting', 'Cancel waiting work'],
            ['running', 'Cancel waiting and running work'],
            ['ignore', 'Ignore cancellation'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function RetryLoaded({ data }) {
  const [policy, setPolicy] = useState('jitter');
  const [capacity, setCapacity] = useState(2);
  const [delay, setDelay] = useState(0.4);
  const model = retryTrace(policy, capacity, delay, data.retryUniforms);
  return (
    <>
      <Drawing label="Logical request rows, timed attempts and parent links" height={310}>
        {model.logical.map((row, lane) => (
          <g key={row.id}>
            <text x="12" y={48 + lane * 45} fill={requestColours[lane]}>
              {row.id}
            </text>
            {model.attempts
              .filter((attempt) => attempt.logicalId === row.id)
              .map((attempt) => {
                const x = 60 + (attempt.arrival / 2) * 565;
                const y = 42 + lane * 45;
                const parent = model.attempts.find((item) => item.id === attempt.parent);
                return (
                  <g key={attempt.id}>
                    {parent && (
                      <line
                        x1={60 + (parent.arrival / 2) * 565}
                        x2={x}
                        y1={y}
                        y2={y}
                        stroke={requestColours[lane]}
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill={attempt.status === 'completed' ? requestColours[lane] : '#171717'}
                      stroke={requestColours[lane]}
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fill={attempt.status === 'completed' ? '#101010' : requestColours[lane]}
                    >
                      {attempt.number}
                    </text>
                    {attempt.status === 'rejected' && (
                      <path
                        d={`M${x - 8} ${y + 18}l16 8m-16 0l16 -8`}
                        stroke={requestColours[lane]}
                      />
                    )}
                  </g>
                );
              })}
          </g>
        ))}
        <TimeAxis max={2} y={235} />
      </Drawing>
      <figcaption>
        {model.offered} offered attempts for four logical requests; {model.successes} logical
        successes. Each retry keeps its parent's request hue. Crossing beneath a node means
        rejected; outcomes remain named below. Jitter uses the two retained seed 17 backoff
        operands; changing delay scales those exact operands.
      </figcaption>
      <Table
        label="Attempt ancestry and actual outcomes"
        headers={['Attempt', 'Parent', 'Offer (s)', 'Start (s)', 'Outcome']}
        rows={model.attempts.map((row) => [
          row.id,
          row.parent ?? 'original',
          number(row.arrival, 6),
          number(row.start),
          row.status,
        ])}
      />
      <Controls
        reset={() => {
          setPolicy('jitter');
          setCapacity(2);
          setDelay(0.4);
        }}
      >
        <Select
          label="Retry policy"
          value={policy}
          change={setPolicy}
          options={[
            ['none', 'No retries'],
            ['synchronized', 'Synchronized, cap2'],
            ['jitter', 'Retained jitter, cap2'],
          ]}
        />
        <Select
          label="Resident capacity"
          value={capacity}
          change={(value) => setCapacity(Number(value))}
          options={[
            [2, 'Two residents'],
            [0, 'Reject all: zero capacity'],
          ]}
        />
        <Slider
          label="Backoff scale"
          value={delay}
          change={setDelay}
          min={0.1}
          max={0.8}
          step={0.1}
          unit="s"
        />
      </Controls>
    </>
  );
}

export function RetryFigure() {
  return (
    <Figure id="D21">
      <DataView filename="runtime-library-view.json" label="Retained jitter operands">
        {(data) => <RetryLoaded data={data} />}
      </DataView>
    </Figure>
  );
}

export function CapacityFigure() {
  const [delay, setDelay] = useState(5);
  const model = delayedCapacity(delay);
  const samples = hysteresisTrace(delay);
  const horizon = Math.max(model.ready, model.drain);
  const x = (time) => 60 + (time / horizon) * 565;
  const maxQueue = Math.max(1, ...model.history.map((row) => row.waiting));
  const path = model.history
    .map(
      (row, index) =>
        `${index ? 'H' : 'M'}${x(row.time)}${index ? `V${245 - (row.waiting / maxQueue) * 120}` : `,${245 - (row.waiting / maxQueue) * 120}`}`,
    )
    .join(' ');
  return (
    <Figure id="D22">
      <Drawing label="Pending readiness, installed workers and actual queued work" height={330}>
        <rect
          x={x(10)}
          y="28"
          width={x(model.ready) - x(10)}
          height="22"
          fill="none"
          stroke={requestColours[1]}
          strokeDasharray="5 4"
        />
        <text x="60" y="20">
          Pending worker: request 10 → ready {number(model.ready)}
        </text>
        <line
          x1="60"
          x2={x(model.ready)}
          y1="85"
          y2="85"
          stroke={requestColours[0]}
          strokeWidth="3"
        />
        <line
          x1={x(model.ready)}
          x2="625"
          y1="65"
          y2="65"
          stroke={requestColours[0]}
          strokeWidth="3"
        />
        <line x1={x(model.ready)} x2={x(model.ready)} y1="85" y2="65" stroke={requestColours[0]} />
        <text x="60" y="112">
          Installed workers: 2 before readiness, 3 afterward
        </text>
        <path
          d={`${path}V245H${x(model.history[0].time)}Z`}
          fill={requestColours[2]}
          fillOpacity=".18"
        />
        <path d={path} fill="none" stroke={requestColours[2]} strokeWidth="3" />
        <text x="60" y="140">
          Waiting population: 0 to {maxQueue}
        </text>
        <TimeAxis max={horizon} y={255} />
      </Drawing>
      <figcaption>
        Thirty unit-service jobs arrive at 3/s during the supplied burst. Readiness{' '}
        {number(model.ready)} s; last completion {number(model.drain)} s; queue area{' '}
        {number(model.area)} request-seconds. The third worker supplies no service while pending,
        and readiness does not erase waiting work.
      </figcaption>
      <Table
        label="Separate supplied samples: ten-second low-queue hold"
        headers={[
          'Sample time',
          'Queue',
          'Busy',
          'Installed',
          'Pending ready',
          'Low since',
          'Action',
        ]}
        rows={samples.map((row) => [
          row.time,
          row.queue,
          row.busy,
          row.installed,
          number(row.pending),
          number(row.lowSince),
          row.actions.join('; ') || 'hold',
        ])}
      />
      <figcaption>
        The sample controller acts only at supplied observation times. A low queue must span 10
        seconds and a server must be idle before scale-in; the warm floor is two. These samples are
        not the burst simulation plotted above.
      </figcaption>
      <Controls reset={() => setDelay(5)}>
        <Select
          label="Supplied startup delay"
          value={delay}
          change={(value) => setDelay(Number(value))}
          options={[
            [0, '0 s'],
            [5, '5 s'],
            [30, '30 s'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function TraceLoaded({ rows }) {
  const [selected, setSelected] = useState(1);
  const row = rows[selected - 1];
  const maxInput = Math.max(...rows.map((item) => item.input));
  const maxOutput = Math.max(...rows.map((item) => item.output));
  const horizon = rows.at(-1).arrival;
  const groupColour = (index) => requestColours[Math.floor(index / 128)];
  return (
    <>
      <Drawing
        label="Observed arrival dots and input/output token scatter with exact source-row selection"
        height={385}
      >
        <text x="60" y="25">
          Observed arrival clock, first 512 source rows
        </text>
        {rows.map((item, index) => (
          <circle
            key={item.source_row}
            cx={60 + (item.arrival / horizon) * 565}
            cy="55"
            r={selected === item.source_row ? 7 : 2.5}
            fill={groupColour(index)}
            stroke={selected === item.source_row ? 'white' : 'none'}
          />
        ))}
        <TimeAxis max={horizon} y={75} />
        <line x1="60" x2="625" y1="310" y2="310" className="sq-axis" />
        <line x1="60" x2="60" y1="155" y2="310" className="sq-axis" />
        <text x="60" y="150">
          Output tokens: 0 to {maxOutput}
        </text>
        <text x="625" y="350" textAnchor="end">
          Input tokens: 0 to {maxInput}
        </text>
        {rows.map((item, index) => (
          <circle
            key={item.source_row}
            cx={60 + (item.input / maxInput) * 565}
            cy={310 - (item.output / maxOutput) * 145}
            r={selected === item.source_row ? 7 : 2.5}
            fill={groupColour(index)}
            stroke={selected === item.source_row ? 'white' : 'none'}
          />
        ))}
      </Drawing>
      <figcaption>
        Colour groups consecutive128-row cohorts; white outlines the same selected row in both
        drawings. Source row {row.source_row}: raw timestamp <code>{row.TIMESTAMP}</code>, relative
        arrival {number(row.arrival, 6)} s, input {row.input}, output {row.output}. These fields
        contain no observed service duration or GPU latency. Relative time retains source
        microseconds.
      </figcaption>
      <Controls reset={() => setSelected(1)}>
        <Slider label="Source row" value={selected} change={setSelected} min={1} max={512} />
      </Controls>
    </>
  );
}

export function TraceFigure() {
  return (
    <Figure id="D23">
      <DataView
        filename="azure-conversation-512.csv"
        parser={parseAzureCsv}
        label="Licensed observed request rows"
      >
        {(rows) => <TraceLoaded rows={rows} />}
      </DataView>
    </Figure>
  );
}

function ReplayLoaded({ rows }) {
  const [stretch, setStretch] = useState(1);
  const [alpha, setAlpha] = useState(0.0002);
  const [beta, setBeta] = useState(0.003);
  const [window, setWindow] = useState('drain');
  const model = traceReplay(rows, stretch, alpha, beta);
  const cutoff = rows.at(-1).arrival * stretch;
  const completed = model.records.filter((row) => window === 'drain' || row.departure <= cutoff);
  const selected = model.records.slice(0, 12);
  const horizon = Math.max(1, ...selected.map((row) => row.departure));
  return (
    <>
      <Lanes
        rows={selected}
        max={horizon}
        height={620}
        title="First twelve source requests under the explicitly fictional service proxy"
      />
      <figcaption>
        Visible lanes are source rows 1–12; the summary uses all 512. Proxy service is
        α×input+β×output seconds. Full drained-cohort mean {number(model.meanResponse)} s, p99{' '}
        {number(model.p99)} s. Selected {window === 'drain' ? 'drained' : 'arrival-window'} view:{' '}
        {completed.length} completed, {512 - completed.length} unfinished by{' '}
        {window === 'drain' ? 'drain' : `${number(cutoff)} s`}; completed-only p99{' '}
        {number(quantile(completed.map((row) => row.response)))} s. This is a CPU model, not Azure
        measured latency.
      </figcaption>
      <Controls
        reset={() => {
          setStretch(1);
          setAlpha(0.0002);
          setBeta(0.003);
          setWindow('drain');
        }}
      >
        <Select
          label="Arrival stretch"
          value={stretch}
          change={(value) => setStretch(Number(value))}
          options={[
            [0.5, '.5'],
            [1, '1'],
            [2, '2'],
          ]}
        />
        <Slider
          label="α seconds per input token"
          value={alpha}
          change={setAlpha}
          max={0.0004}
          step={0.0001}
        />
        <Slider
          label="β seconds per output token"
          value={beta}
          change={setBeta}
          max={0.006}
          step={0.001}
        />
        <Select
          label="Completion observation window"
          value={window}
          change={setWindow}
          options={[
            ['drain', 'Drain all offered work'],
            ['arrival', 'Stop at last offered arrival'],
          ]}
        />
      </Controls>
    </>
  );
}

export function ReplayFigure() {
  return (
    <Figure id="D24">
      <DataView
        filename="azure-conversation-512.csv"
        parser={parseAzureCsv}
        label="Observed replay inputs"
      >
        {(rows) => <ReplayLoaded rows={rows} />}
      </DataView>
    </Figure>
  );
}

export function SloFigure() {
  const [window, setWindow] = useState(2);
  const [ttft, setTtft] = useState(0.5);
  const [e2e, setE2e] = useState(1);
  const model = sloCohort({ window, ttft, e2e });
  return (
    <Figure id="D25">
      <Drawing
        label="All offered IDs, including rejection and cancellation, under latency targets"
        height={345}
      >
        {model.records.map((row, index) => (
          <g key={row.id}>
            <text x="12" y={40 + index * 45} fill={requestColours[index]}>
              {row.id}
            </text>
            <line
              x1={60 + (row.arrival / 2) * 565}
              x2={60 + (Math.min(row.finish ?? row.arrival, window) / 2) * 565}
              y1={35 + index * 45}
              y2={35 + index * 45}
              stroke={requestColours[index]}
              strokeDasharray={row.completed ? undefined : '4 4'}
            />
            <circle
              cx={60 + (row.arrival / 2) * 565}
              cy={35 + index * 45}
              r="5"
              fill={requestColours[index]}
            />
            {row.clocks.outputs.map((time, output) => (
              <circle
                key={output}
                cx={60 + (time / 2) * 565}
                cy={35 + index * 45}
                r="4"
                fill={requestColours[index]}
              />
            ))}
            <text x="80" y={56 + index * 45}>
              {row.finish !== null && row.finish > window ? 'unfinished by window' : row.status};{' '}
              {row.good ? 'meets all targets' : 'outside targets or incomplete'}
            </text>
          </g>
        ))}
        <line
          x1={60 + (window / 2) * 565}
          x2={60 + (window / 2) * 565}
          y1="15"
          y2="260"
          stroke="white"
          strokeDasharray="4 4"
        />
        <TimeAxis max={2} y={280} />
      </Drawing>
      <figcaption>
        Offered {model.offered}; admitted {model.admitted}; completed {model.completed}; in-target{' '}
        {model.good}. Goodput {number(model.goodput)}/s; in-target/offered{' '}
        {number(model.offeredFraction)}, in-target/admitted {number(model.admittedFraction)}. Gap
        target .3 s; B has no between-output gap, so TPOT is undefined. A zero-width window has
        undefined rates.
      </figcaption>
      <Table
        label="Current observed clocks and target membership"
        headers={['ID', 'TTFT (s)', 'TPOT (s)', 'E2E (s)', 'In target']}
        rows={model.records.map((row) => [
          row.id,
          number(row.clocks.ttft),
          number(row.clocks.tpot),
          number(row.clocks.e2e),
          row.good ? 'yes' : 'no',
        ])}
      />
      <Controls
        reset={() => {
          setWindow(2);
          setTtft(0.5);
          setE2e(1);
        }}
      >
        <Slider label="Window end" value={window} change={setWindow} max={2} step={0.1} unit="s" />
        <Slider label="TTFT target" value={ttft} change={setTtft} max={1.5} step={0.1} unit="s" />
        <Slider label="E2E target" value={e2e} change={setE2e} max={2} step={0.1} unit="s" />
      </Controls>
    </Figure>
  );
}

export function HistogramFigure() {
  const [kind, setKind] = useState('default');
  const [probability, setProbability] = useState(0.99);
  const a = [0.2, 0.4, 2];
  const b = [0.3, 0.5, kind === 'overflow' ? 8 : 4];
  const edges = [0.5, 1, 3, 5, Infinity];
  const countsA = cumulativeBuckets(a, edges);
  const edgesB = kind === 'incompatible' ? [0.5, 1, 4, 5, Infinity] : edges;
  const countsB = cumulativeBuckets(b, edgesB);
  const merged = countsA.map((value, index) => value + countsB[index]);
  const bucket = kind === 'incompatible' ? null : histogramQuantile(merged, edges, probability);
  const targetCount = probability * merged.at(-1);
  const targetIndex = merged.findIndex((count) => count >= targetCount);
  const lowerEdge = targetIndex > 0 ? edges[targetIndex - 1] : 0;
  const upperEdge = edges[targetIndex];
  return (
    <Figure id="D26">
      <Drawing label="Raw replica samples, cumulative counts and bucket interpolation" height={350}>
        {[a, b].map((values, lane) => (
          <g key={lane}>
            <text x="15" y={48 + lane * 48} fill={requestColours[lane]}>
              {lane ? 'B' : 'A'}
            </text>
            {values.map((value, index) => (
              <circle
                key={index}
                cx={60 + (value / 8) * 565}
                cy={42 + lane * 48}
                r="6"
                fill={requestColours[lane]}
              />
            ))}
          </g>
        ))}
        {edges.slice(0, -1).map((edge, index) => (
          <g key={edge}>
            <line
              x1={60 + (edge / 8) * 565}
              x2={60 + (edge / 8) * 565}
              y1="20"
              y2="195"
              className="sq-guide"
            />
            <text x={60 + (edge / 8) * 565} y="150" textAnchor="middle">
              ≤{edge}
            </text>
            <text x={60 + (edge / 8) * 565} y="180" textAnchor="middle">
              {kind === 'incompatible' ? '—' : merged[index]}
            </text>
          </g>
        ))}
        <text x="500" y="150">
          +Inf
        </text>
        <text x="500" y="180">
          {kind === 'incompatible' ? '—' : 6}
        </text>
        {kind === 'incompatible' && (
          <text x="60" y="220">
            A has edge 3; B has edge 4: merged counts unavailable
          </text>
        )}
        {kind !== 'incompatible' && (
          <text x="60" y="220">
            Quantile target: {number(targetCount)} of {merged.at(-1)} samples
          </text>
        )}
        {bucket !== null && (
          <g>
            <line
              x1={60 + (lowerEdge / 8) * 565}
              x2={60 + (upperEdge / 8) * 565}
              y1="245"
              y2="245"
              stroke="white"
              strokeWidth="3"
            />
            <line
              x1={60 + (bucket / 8) * 565}
              x2={60 + (bucket / 8) * 565}
              y1="230"
              y2="280"
              stroke="white"
              strokeDasharray="4 3"
            />
            <circle cx={60 + (bucket / 8) * 565} cy="245" r="5" fill="white" />
          </g>
        )}
        <TimeAxis max={8} y={280} label="Latency (s)" />
      </Drawing>
      <figcaption>
        {kind === 'incompatible'
          ? "Replica B's actual edge set differs: refuse the merge; no bucket estimate is available."
          : `Merge counts first: bucket estimate ${number(bucket)} s.`}{' '}
        Raw type7 quantile {number(quantile([...a, ...b], probability))} s; average of local raw
        quantiles {number((quantile(a, probability) + quantile(b, probability)) / 2)} s. A target
        inside +Inf has no finite uniform-within-bucket estimate.{' '}
        {bucket !== null &&
          'The white interval marks the selected finite bucket, and its dot is the interpolated estimate.'}
      </figcaption>
      <Table
        label="Declared bucket edges and cumulative counts"
        headers={['A edge (s)', 'A count', 'B edge (s)', 'B count', 'Merged']}
        rows={edges.map((edge, index) => [
          number(edge),
          countsA[index],
          number(edgesB[index]),
          countsB[index],
          kind === 'incompatible' ? 'not merged' : merged[index],
        ])}
      />
      <Controls
        reset={() => {
          setKind('default');
          setProbability(0.99);
        }}
      >
        <Select
          label="Replica fixture"
          value={kind}
          change={setKind}
          options={[
            ['default', 'Same finite edges'],
            ['overflow', 'B has 8 s: tail in +Inf'],
            ['incompatible', 'Incompatible edge set: refuse'],
          ]}
        />
        <Select
          label="Quantile probability"
          value={probability}
          change={(value) => setProbability(Number(value))}
          options={[
            [0.5, '.5'],
            [0.9, '.9'],
            [0.99, '.99'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function LibraryLoaded({ data }) {
  const [kind, setKind] = useState('saved');
  const rows =
    kind === 'saved'
      ? data.simpy.library.records
      : pooledQueue(
          [
            { id: 'A', arrival: 0, service: 2 },
            { id: 'B', arrival: 1, service: 1 },
            { id: 'C', arrival: 2, service: 1 },
          ],
          2,
        );
  const scratch = kind === 'saved' ? fcfs() : rows;
  return (
    <>
      <Lanes
        rows={rows}
        title={
          kind === 'saved'
            ? 'Actual retained SimPy4.1.2 request and release clocks'
            : 'Two-worker tied-event fixture reconstructed in the browser'
        }
      />
      <figcaption>
        {kind === 'saved' ? (
          'Actual saved SimPy4.1.2 default trace; the independent scratch clock/area comparison passed. This is an ordinary CPU event simulation, not inference.'
        ) : (
          <>
            Changed two-worker fixture is a browser model. Its original native tied-event comparison
            passed; the full changed native request trace is not stored here. Run{' '}
            <code>python simpy_reference.py --servers 2 --ties</code> for an ordinary-library
            reproduction.
          </>
        )}
      </figcaption>
      {kind === 'saved' ? (
        <Table
          label="Actual library and scratch event correspondence"
          headers={['ID', 'Library start', 'Library release', 'Scratch start', 'Scratch release']}
          rows={rows.map((row, index) => [
            row.id,
            row.start,
            row.departure,
            scratch[index].start,
            scratch[index].departure,
          ])}
        />
      ) : (
        <Table
          label="Browser reconstruction of the two-worker fixture"
          headers={['ID', 'Worker', 'Start', 'Release']}
          rows={rows.map((row) => [row.id, row.server, row.start, row.departure])}
        />
      )}
      <Controls reset={() => setKind('saved')}>
        <Select
          label="Event fixture"
          value={kind}
          change={setKind}
          options={[
            ['saved', 'Actual saved one-worker comparison'],
            ['ties', 'Browser two-worker tied fixture'],
          ]}
        />
      </Controls>
    </>
  );
}

export function LibraryFigure() {
  return (
    <Figure id="D27">
      <DataView filename="runtime-library-view.json" label="Actual retained SimPy output">
        {(data) => <LibraryLoaded data={data} />}
      </DataView>
    </Figure>
  );
}

export function MetricFigure() {
  const [requeue, setRequeue] = useState(0);
  const frontend = 0.1;
  const core = 0.2;
  const first = 3 + requeue;
  const clientFirst = first + 0.1;
  const horizon = 5;
  const x = (time) => 110 + (time / horizon) * 515;
  return (
    <Figure id="D28">
      <Drawing label="Constructed client, frontend and core event rulers" height={360}>
        {['Client', 'Frontend', 'Core'].map((label, index) => (
          <g key={label}>
            <text x="12" y={58 + index * 85}>
              {label}
            </text>
            <line x1="110" x2="625" y1={52 + index * 85} y2={52 + index * 85} className="sq-axis" />
          </g>
        ))}
        <circle cx={x(0)} cy="52" r="5" fill={requestColours[0]} />
        <circle cx={x(clientFirst)} cy="52" r="5" fill={requestColours[0]} />
        <text x="110" y="35">
          Send 0 → first client output {number(clientFirst)}
        </text>
        <circle cx={x(frontend)} cy="137" r="5" fill={requestColours[1]} />
        <circle cx={x(first)} cy="137" r="5" fill={requestColours[1]} />
        <text x="110" y="120">
          Frontend receive .1 → first output {number(first)}
        </text>
        <line
          x1={x(core)}
          x2={x(1)}
          y1="222"
          y2="222"
          stroke={requestColours[2]}
          strokeDasharray="5 4"
          strokeWidth="4"
        />
        {requeue > 0 && (
          <line
            x1={x(1.4)}
            x2={x(1.4 + requeue)}
            y1="222"
            y2="222"
            stroke={requestColours[2]}
            strokeDasharray="5 4"
            strokeWidth="4"
          />
        )}
        <circle cx={x(1)} cy="222" r="5" fill={requestColours[2]} />
        <text x="110" y="205">
          Core queue .2 → scheduled 1; dashed means waiting
        </text>
        <TimeAxis max={5} y={295} left={110} />
      </Drawing>
      <figcaption>
        Constructed client TTFT {number(clientFirst)} s; frontend TTFT {number(first - frontend)} s;
        core-origin first-output interval {number(first - core)} s. Initial core wait .8 s plus
        requeue wait {number(requeue)} s → accumulated queue time {number(0.8 + requeue)} s. Metric
        names must retain their source-defined clock boundaries; this diagram is not a captured vLLM
        endpoint.
      </figcaption>
      <Controls reset={() => setRequeue(0)}>
        <Slider
          label="Constructed requeue interval"
          value={requeue}
          change={setRequeue}
          max={1}
          step={0.1}
          unit="s"
        />
      </Controls>
    </Figure>
  );
}
