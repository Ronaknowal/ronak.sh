import React, { useState } from 'react';
import { finiteBufferState, pooledQueueState } from '../../data/queueing-models.js';
import {
  Controls,
  Drawing,
  Figure,
  Legend,
  Plot,
  Range,
  Table,
  Token,
  Worker,
  format,
  ink,
} from './QueueingReadingPrimitives.jsx';
import { ProbabilityBars, StateEdges } from './QueueingProbabilityFigures.jsx';

function Architecture({ kind, servers = 2, rate = 5 }) {
  const worker = (i, speed = rate) => <Worker label={`worker ${i + 1}`} job="S" rate={`${speed} jobs/s`} />;
  return (
    <div className="queue-architecture">
      <p>{kind === 'pooled' ? 'One shared queue' : kind === 'split' ? 'Independent, uniformly split queues' : 'One faster worker'}</p>
      {kind === 'pooled' ? <>
        <div className="queue-waiting"><strong>shared waiting line</strong><Token label="·" /></div>
        <p className="queue-topology-explanation">Each branch serves a job directly from the shared line.</p>
        <div className="queue-pool-branches" aria-label="Parallel workers share one waiting line">
          {Array.from({ length: servers }, (_, i) => <div className="queue-pool-branch" key={i}><span className="queue-branch-arrow" aria-hidden="true">→</span>{worker(i)}</div>)}
        </div>
      </> : kind === 'split' ? <div className="queue-split-paths">
        {Array.from({ length: servers }, (_, i) => <div className="queue-split-path" key={i}>
          <div className="queue-waiting"><strong>queue {i + 1}</strong><Token label="·" /></div>
          <span className="queue-down-arrow" aria-hidden="true">↓</span>{worker(i)}
        </div>)}
      </div> : <div className="queue-fast-path"><span aria-hidden="true">→</span>{worker(0, servers * rate)}</div>}
    </div>
  );
}

function PoolingLab() {
  const [arrival, setArrival] = useState(8),
    [servers, setServers] = useState(2);
  const state = pooledQueueState(arrival, 5, servers);
  const alternatives = state.stable
    ? [
        ['Shared pool', state.meanWait, 0.2, ink.amber],
        ['Random split', state.splitTotal - 0.2, 0.2, ink.cyan],
        ['Faster worker', state.fastTotal - 1 / (servers * 5), 1 / (servers * 5), ink.pale],
      ]
    : [];
  const maximum = state.stable
    ? Math.ceil(Math.max(...alternatives.map((a) => a[1] + a[2])) * 10) / 10
    : 1;
  return (
    <Figure
      id="Q29"
      caption="Equal nominal capacity cμ does not give the same service duration to one job. Hatched segments are waiting; solid segments are own service."
    >
      {state.stable ? (
        <Drawing
          description={`Mean time comparisons on common 0 to ${maximum} seconds axis.`}
          height={240}
        >
          {({ width, scale, id }) => {
            const left = 12 * scale,
              right = width - 15 * scale,
              x = (v) => left + (v / maximum) * (right - left);
            return (
              <>
                {alternatives.map(([name, wait, service, color], i) => (
                  <g key={name} style={{ color }}>
                    <text x={left} y={(20 + i * 65) * scale}>
                      {name}
                    </text>
                    <rect
                      x={x(0)}
                      y={(29 + i * 65) * scale}
                      width={x(wait) - x(0)}
                      height={23 * scale}
                      fill={`url(#${id}-hatch)`}
                      stroke={color}
                    />
                    <rect
                      x={x(wait)}
                      y={(29 + i * 65) * scale}
                      width={x(wait + service) - x(wait)}
                      height={23 * scale}
                      fill={color}
                    />
                  </g>
                ))}
                {[0, maximum / 2, maximum].map((v, i) => (
                  <text
                    key={v}
                    x={x(v)}
                    y={224 * scale}
                    textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                  >
                    {format(v)} s
                  </text>
                ))}
              </>
            );
          }}
        </Drawing>
      ) : (
        <p role="status">
          λ={arrival} ≥ total capacity {servers * 5} jobs/s. The structures remain defined; these
          infinite-buffer stationary means are unavailable.
        </p>
      )}
      <Controls
        onReset={() => {
          setArrival(8);
          setServers(2);
        }}
      >
        <Range
          label="Arrival rate λ"
          value={arrival}
          onChange={setArrival}
          min={1}
          max={14}
          unit="jobs/s"
        />
        <Range
          label="Number of ordinary workers c"
          value={servers}
          onChange={setServers}
          min={1}
          max={4}
        />
      </Controls>
      <p>S marks a service position; these are structural diagrams of the three architectures.</p>
      {['pooled', 'split', 'fast'].map((kind) => (
        <Architecture key={kind} kind={kind} servers={servers} />
      ))}
      {state.stable && (
        <Table
          caption={`Common comparison axis 0–${format(maximum)}s; μ=5/s`}
          headers={['Architecture', 'wait (s)', 'service (s)', 'total (s)']}
          rows={alternatives.map(([name, wait, service]) => [
            name,
            format(wait, 6),
            format(service, 6),
            format(wait + service, 6),
          ])}
        />
      )}
    </Figure>
  );
}

function AdmissionBranches({ arrival, admitted, rejected }) {
  return (
    <Drawing
      description={`One offered flow splits into admitted ${admitted} and rejected ${rejected} jobs per second. Vertical ribbon widths use one common scale. Accepted flow continues to completion.`}
      height={305}
    >
      {({ width, scale }) => {
        const x0 = 12 * scale,
          split = width * 0.42,
          end = width - 14 * scale;
        const band = (value) => (value / 20) * 52 * scale;
        const y = 134 * scale,
          acceptedY = 67 * scale,
          rejectedY = 222 * scale;
        const acceptedTop = y - band(arrival) / 2,
          acceptedBottom = acceptedTop + band(admitted);
        const ribbon = (a, b, target, h) =>
          `M${split},${a}C${split + width * 0.15},${a} ${end - width * 0.22},${target - h / 2} ${end},${target - h / 2}V${target + h / 2}C${end - width * 0.22},${target + h / 2} ${split + width * 0.15},${b} ${split},${b}Z`;
        return (
          <>
            <rect
              x={x0}
              y={y - band(arrival) / 2}
              width={split - x0}
              height={band(arrival)}
              fill={ink.pale}
            />
            <path
              d={ribbon(acceptedTop, acceptedBottom, acceptedY, band(admitted))}
              fill={ink.cyan}
            />
            <path
              d={ribbon(acceptedBottom, y + band(arrival) / 2, rejectedY, band(rejected))}
              fill={ink.rose}
            />
            <text x={x0} y={y - 40 * scale}>
              offered {format(arrival)}
            </text>
            <text x={end} y={acceptedY - 24 * scale} textAnchor="end">
              accepted {format(admitted, 3)}
            </text>
            <text x={end} y={acceptedY + 40 * scale} textAnchor="end">
              → completed {format(admitted, 3)}
            </text>
            <text x={end} y={rejectedY + 40 * scale} textAnchor="end">
              × rejected {format(rejected, 3)}
            </text>
            <text x={x0} y={295 * scale}>
              Flows in jobs/s; common width scale
            </text>
          </>
        );
      }}
    </Drawing>
  );
}

function AdmissionLab() {
  const [arrival, setArrival] = useState(12),
    [capacity, setCapacity] = useState(3);
  const state = finiteBufferState(arrival, 10, capacity);
  const rejected = arrival * state.dropProbability,
    completion = 10 * state.busyProbability;
  return (
    <Figure
      id="Q31"
      caption="Finite capacity normalizes even when offered rate exceeds service capacity. Accepted throughput belongs with the admitted customer's residence time."
    >
      <ProbabilityBars
        probabilities={state.probabilities}
        description={`Finite count law for K${capacity}; last state is full.`}
      />
      <AdmissionBranches arrival={arrival} admitted={state.admittedRate} rejected={rejected} />
      <p>
        State {capacity} is full: probability {format(state.dropProbability, 6)}.
      </p>
      <Controls
        onReset={() => {
          setArrival(12);
          setCapacity(3);
        }}
      >
        <Range
          label="Offered arrival rate λ"
          value={arrival}
          onChange={setArrival}
          min={1}
          max={20}
          unit="jobs/s"
        />
        <Range label="Total slots K" value={capacity} onChange={setCapacity} min={1} max={6} />
      </Controls>
      <Table
        caption="Use the admitted population"
        headers={['Quantity', 'Value']}
        rows={[
          ['L', `${format(state.meanNumber, 6)} jobs`],
          ['admitted W=L/λeff', `${format(state.meanTotal, 6)} s`],
          ['admitted Wq', `${format(state.meanWait, 6)} s`],
          ['incorrect L/offered λ', `${format(state.meanNumber / arrival, 6)} s`],
          ['accepted − completion', `${format(state.admittedRate - completion, 9)} jobs/s`],
        ]}
      />
    </Figure>
  );
}

function UniformizationMixture() {
  // Exact first rows of R^k for R = I + Q/22, starting at state 0.
  const rows = [
    [1, 0, 0, 0],
    [10 / 22, 12 / 22, 0, 0],
    [220 / 484, 120 / 484, 144 / 484, 0],
  ];
  const colors = [ink.pale, ink.cyan, ink.amber, ink.rose];
  return (
    <>
      <Drawing
        height={295}
        description="First three conditional rows for event counts zero, one and two. Each whole row has mass one, then receives its own Poisson weight. Further event-count rows continue through80."
      >
        {({ width, scale }) => {
          const left = 12 * scale,
            span = width - 24 * scale;
          return (
            <>
              {rows.map((row, k) => (
                <g key={k}>
                  <text x={left} y={(22 + 75 * k) * scale}>
                    k={k}; weight w{k}=e⁻²² × 22ᵏ/k!
                  </text>
                  {row.map((mass, state) => {
                    const start = row.slice(0, state).reduce((a, b) => a + b, 0);
                    return mass > 0 ? (
                      <g key={state}>
                        <rect
                          x={left + span * start}
                          y={(34 + 75 * k) * scale}
                          width={span * mass}
                          height={27 * scale}
                          fill={colors[state]}
                          fillOpacity=".5"
                          stroke="#111"
                        />
                        <text
                          x={left + span * (start + mass / 2)}
                          y={(53 + 75 * k) * scale}
                          textAnchor="middle"
                        >
                          {state}
                        </text>
                      </g>
                    ) : null;
                  })}
                </g>
              ))}
              <text x={left} y={264 * scale}>
                … k=3,…,80: add wₖ × rowₖ
              </text>
            </>
          );
        }}
      </Drawing>
      <p>
        Numbers inside the strips are destination states. Each strip is a conditional row of Rᵏ with
        R=I+Q/22; its width is probability, before multiplication by its Poisson weight. Starting
        row (1,0,0,0) selects row 0 of each matrix power. The displayed first three rows are not
        renormalized into a new distribution.
      </p>
    </>
  );
}

export function QueueingCapacityFigure({ id }) {
  if (id === 'Q29') return <PoolingLab />;
  if (id === 'Q31') return <AdmissionLab />;
  if (id === 'Q27')
    return (
      <Figure
        id={id}
        caption="A possible allocation snapshot. The individual workers retain the same service rate μ; pooling changes which waiting job can use the idle slot."
      >
        <p>Separate waiting lines</p>
        <div className="queue-topology">
          <div className="queue-waiting">
            <strong>line 1</strong>
            <Token id="B" />
            <Token id="C" />
          </div>
          <span>→</span>
          <Worker label="worker 1" job="A" rate="μ jobs/s" />
        </div>
        <div className="queue-topology">
          <div className="queue-waiting">
            <strong>line 2: empty</strong>
          </div>
          <span>→</span>
          <Worker label="worker 2" rate="μ jobs/s" />
        </div>
        <p>Shared waiting line after assigning B</p>
        <div className="queue-topology">
          <div className="queue-waiting">
            <strong>shared line</strong>
            <Token id="C" />
          </div>
          <span>→</span>
          <Worker label="worker 1" job="A" rate="μ jobs/s" />
          <Worker label="worker 2" job="B" rate="μ jobs/s" />
        </div>
      </Figure>
    );
  if (id === 'Q28')
    return (
      <Figure
        id={id}
        caption="For c=2, departure rate is min(n,2)μ. An arrival finding both workers busy waits, including at state 2 with no preexisting waiting job."
      >
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className="queue-state-row">
            <strong>n={n}</strong>
            {[0, 1].map((worker) => (
              <Worker
                key={worker}
                label={`worker ${worker + 1}`}
                job={worker < Math.min(n, 2) ? String(worker + 1) : undefined}
              />
            ))}
            <div className="queue-waiting">
              <strong>{Math.max(0, n - 2)} waiting</strong>
              {Array.from({ length: Math.max(0, n - 2) }, (_, i) => (
                <Token key={i} label={String(i + 3)} />
              ))}
            </div>
            <span>departure: {n === 0 ? '0' : n === 1 ? 'μ' : '2μ'}</span>
            {n >= 2 && <span>arrival must wait</span>}
          </div>
        ))}
        <StateEdges states={5} servers={2} />
        <p>
          Relative weights: 1 → a → a²/2 → (a²/2)ρ → …<br />
          Ratios: a, a/2, then ρ=a/2. Prefix n&lt;2; infinite waiting event n≥2.
        </p>
      </Figure>
    );
  if (id === 'Q30')
    return (
      <Figure
        id={id}
        caption="K counts total jobs inside: one service slot and two waiting slots. SimPy Resource capacity instead counts simultaneous users."
      >
        <div className="queue-topology">
          <div className="queue-system">
            <span className="queue-system-label">Full K=3 system</span>
            <div className="queue-waiting">
              <strong>two waiting slots</strong>
              <Token id="B" />
              <Token id="C" />
            </div>
            <Worker label="one service slot" job="A" />
          </div>
          <span className="queue-arrow">offered D → × rejected outside</span>
        </div>
        <p>For a separate later arrival E, after a departure frees one slot:</p>
        <div className="queue-topology">
          <Token id="E" />
          <span>→ admitted</span>
          <div className="queue-system">
            <span className="queue-system-label">Separate later state</span>
            <div className="queue-waiting">
              <Token id="C" />
              <Token id="E" />
            </div>
            <Worker label="one service slot" job="B" />
          </div>
        </div>
      </Figure>
    );
  if (id === 'Q32') {
    const matrix = [
      [-2, 2, 0],
      [3, -5, 2],
      [0, 3, -3],
    ];
    return (
      <Figure
        id={id}
        caption="Rows are departure states, columns destination states. All original balances must still hold after replacing one redundant equation by normalization."
      >
        <StateEdges states={3} arrival="2" service="3" />
        <div
          className="queue-matrix"
          role="img"
          aria-label="Generator rows: minus2,2,0;3,minus5,2;0,3,minus3."
        >
          <span>from / to</span>
          {[0, 1, 2].map((n) => (
            <span key={n}>to {n}</span>
          ))}
          {matrix.map((row, i) => (
            <React.Fragment key={i}>
              <span>from {i}</span>
              {row.map((v, j) => (
                <span key={j} style={{ color: i === j ? ink.pale : j > i ? ink.cyan : ink.amber }}>
                  {v}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
        <p>
          First balance: 2π₀=3π₁.
          <br />
          Last balance: 2π₁=3π₂.
          <br />
          Normalization: π₀+π₁+π₂=1.
        </p>
        <p>Weights 1:2/3:4/9 → π=(9,6,4)/19.</p>
        <Table
          caption="Every original column balance"
          headers={['Column', 'Incoming/outgoing numerator', 'Residual']}
          rows={[
            [0, '−2×9+3×6', 0],
            [1, '2×9−5×6+3×4', 0],
            [2, '2×6−3×4', 0],
            ['sum', '(9+6+4)/19', 1],
          ]}
        />
      </Figure>
    );
  }
  if (id === 'Q33') {
    const transient = [0.186976588, 0.223924497, 0.268016275, 0.32108264],
      invariant = [0.186289121, 0.223546945, 0.268256334, 0.321907601];
    return (
      <Figure
        id={id}
        caption="Recorded λ=12, μ=10, K=3. Both distributions share the full probability scale; a one-second law is not a stationarity certificate."
      >
        <div className="queue-state-row">
          <span className="queue-token">0</span>
          <span>initial mass 1 → row (1,0,0,0) × exp(Q·1s)</span>
        </div>
        <ProbabilityBars
          probabilities={transient}
          compare={invariant}
          description="Empty-start one-second and invariant distributions on the same probability scale."
        />
        <Legend
          entries={[
            ['empty-start, one second', ink.amber, '■'],
            ['invariant law', ink.cyan, '□'],
          ]}
        />
        <Table
          caption="Retained printed values"
          headers={['State', 'probability at t=1 s', 'stationary probability']}
          rows={transient.map((p, i) => [i, p.toFixed(9), invariant[i].toFixed(9)])}
        />
        <UniformizationMixture />
        <p>
          Retain k=0…80; unrenormalized missing probability 3.5770045574516642×10⁻²². The matrix
          exponential combines state-transition paths; entrywise exponentials do not.
        </p>
      </Figure>
    );
  }
  throw new Error(`Unknown capacity figure ${id}`);
}
