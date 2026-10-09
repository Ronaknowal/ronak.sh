import React, { useState } from 'react';
import { serviceVariabilityState } from '../../data/queueing-models.js';
import {
  Choice,
  Controls,
  Curve,
  Drawing,
  Figure,
  Legend,
  Plot,
  Range,
  ShareStrip,
  Table,
  Worker,
  format,
  ink,
  linePath,
} from './QueueingReadingPrimitives.jsx';

export const serviceLaws = [
  ['constant', 'Constant', ink.muted, '■'],
  ['twoSize', 'Two-size', ink.cyan, '▲'],
  ['exponential', 'Exponential', ink.amber, '●'],
  ['rareLong', 'Rare-long', ink.rose, '◆'],
];
const lawOptions = serviceLaws.map(([key, label]) => [key, label]);

function ServiceSamplingLab() {
  const [kind, setKind] = useState('twoSize');
  const state = serviceVariabilityState(8, kind);
  const label = serviceLaws.find((row) => row[0] === kind)[1];
  return (
    <Figure
      id="Q20"
      caption="Count sampling weights each job once. Busy-time sampling weights it by the time it occupies the worker. All four laws have mean .1 s."
    >
      <p>{label} service law</p>
      {kind === 'exponential' ? (
        <>
          <Plot
            description="Exponential duration density and busy-time duration density on the same seconds domain."
            xDomain={[0, 0.6]}
            yDomain={[0, 10]}
            xLabel="service duration (s)"
            yLabel="density (1/s)"
            xTicks={[0, 0.3, 0.6]}
            yTicks={[0, 5, 10]}
          >
            {({ x, y }) => (
              <>
                <Curve
                  points={Array.from({ length: 121 }, (_, i) => [
                    i / 200,
                    10 * Math.exp((-10 * i) / 200),
                  ])}
                  x={x}
                  y={y}
                  color={ink.cyan}
                  dashed
                />
                <Curve
                  points={Array.from({ length: 121 }, (_, i) => [
                    i / 200,
                    ((100 * i) / 200) * Math.exp((-10 * i) / 200),
                  ])}
                  x={x}
                  y={y}
                />
              </>
            )}
          </Plot>
          <Legend
            entries={[
              ['count: f(s)=10 exp(−10s)', ink.cyan, '┄'],
              ['busy time: g(s)=100s exp(−10s)', ink.amber, '━'],
            ]}
          />
          <p>
            Beyond .6 s: count mass exp(−6)={format(Math.exp(-6), 6)}; busy-time mass 7 exp(−6)=
            {format(7 * Math.exp(-6), 6)}. The visible area is not renormalized.
          </p>
        </>
      ) : (
        <>
          <ShareStrip
            label="Share of jobs"
            segments={state.atoms.map((a, i) => ({
              label: `${a.duration} s class`,
              value: a.probability,
              color: i === 0 ? ink.cyan : ink.amber,
              shape: i === 0 ? '△' : '●',
            }))}
          />
          <ShareStrip
            label="Share of occupied time"
            segments={state.atoms.map((a, i) => ({
              label: `${a.duration} s class`,
              value: a.busyShare,
              color: i === 0 ? ink.cyan : ink.amber,
              shape: i === 0 ? '△' : '●',
            }))}
          />
        </>
      )}
      <Controls onReset={() => setKind('twoSize')}>
        <Choice label="Service law" value={kind} onChange={setKind} options={lawOptions} />
      </Controls>
      {state.atoms.length > 0 && (
        <Table
          caption="Reconstruct the busy-time weight"
          headers={['Duration sᵢ (s)', 'Job probability pᵢ', 'pᵢsᵢ/.1']}
          rows={state.atoms.map((a) => [a.duration, a.probability, format(a.busyShare)])}
        />
      )}
    </Figure>
  );
}

function ResidualWaitLab() {
  const [kind, setKind] = useState('twoSize');
  const [arrival, setArrival] = useState(8);
  const states = serviceLaws.map(([key]) => serviceVariabilityState(arrival, key));
  const chosen = states.find((s) => s.kind === kind);
  const max =
    Math.ceil(
      Math.max(...states.flatMap((s) => [s.busyResidual, s.timeResidual, s.meanWait])) * 10,
    ) / 10;
  return (
    <Figure
      id="Q24"
      caption="Every row uses the same seconds scale at the current arrival rate. The three marks are busy residual, full-time residual and queue wait, not interchangeable durations."
    >
      <Drawing
        height={360}
        description={`Four service laws at arrival ${arrival}; selected ${kind}. Common scale0 to ${max} seconds.`}
      >
        {({ width, scale }) => {
          const left = 16 * scale,
            right = width - 20 * scale;
          const x = (v) => left + (v / max) * (right - left);
          return (
            <>
              {states.map((s, i) => {
                const [, label, color, shape] = serviceLaws[i];
                const top = (20 + i * 77) * scale;
                return (
                  <g key={s.kind}>
                    <text x={left} y={top}>
                      {shape} {label}
                      {kind === s.kind ? ' (selected)' : ''}
                    </text>
                    {[s.busyResidual, s.timeResidual, s.meanWait].map((v, j) => (
                      <g key={j}>
                        <line
                          x1={x(0)}
                          x2={x(v)}
                          y1={top + (14 + 15 * j) * scale}
                          y2={top + (14 + 15 * j) * scale}
                          stroke={color}
                          strokeWidth={4 * scale}
                          strokeDasharray={j === 0 ? '3 3' : j === 1 ? '9 4' : undefined}
                        />
                        <circle
                          cx={x(v)}
                          cy={top + (14 + 15 * j) * scale}
                          r={3 * scale}
                          fill={color}
                          stroke={kind === s.kind ? '#fff' : color}
                        />
                      </g>
                    ))}
                  </g>
                );
              })}
              {[0, max / 2, max].map((v, i) => (
                <text
                  key={v}
                  x={x(v)}
                  y={345 * scale}
                  textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                >
                  {format(v)} s
                </text>
              ))}
            </>
          );
        }}
      </Drawing>
      <p>
        Rows show, from top to bottom: dotted busy residual; dashed full-time residual; solid queue
        wait. Common axis range: 0–{format(max)} s, recomputed for all four laws together.
      </p>
      <Controls
        onReset={() => {
          setKind('twoSize');
          setArrival(8);
        }}
      >
        <Choice label="Selected service law" value={kind} onChange={setKind} options={lawOptions} />
        <Range
          label="Arrival rate λ"
          value={arrival}
          onChange={setArrival}
          min={0.5}
          max={9.5}
          step={0.5}
          unit="jobs/s"
        />
      </Controls>
      <p>
        Selected: {format(chosen.busyResidual)} s × load {format(chosen.rho)} ={' '}
        {format(chosen.timeResidual)} s; divide by headroom {format(1 - chosen.rho)} to obtain wait{' '}
        {format(chosen.meanWait)} s.
      </p>
      <Table
        caption="Exact model quantities at the chosen rate"
        headers={['Law', 'E[S²] (s²)', 'busy R (s)', 'time R (s)', 'Wq (s)', 'W (s)']}
        rows={states.map((s, i) => [
          serviceLaws[i][1],
          format(s.secondMoment),
          format(s.busyResidual),
          format(s.timeResidual),
          format(s.meanWait),
          format(s.meanTotal),
        ])}
      />
    </Figure>
  );
}

function Triangle({ duration, max, color, label }) {
  return (
    <Plot
      description={`${label}: residual triangle with width and height${duration}seconds; area${(duration * duration) / 2}seconds squared.`}
      xDomain={[0, max]}
      yDomain={[0, max]}
      xLabel="elapsed service (s)"
      yLabel="remaining service (s)"
      xTicks={[0, max]}
      yTicks={[0, max]}
      height={210}
    >
      {({ x, y }) => (
        <path
          d={`M${x(0)},${y(0)}L${x(0)},${y(duration)}L${x(duration)},${y(0)}Z`}
          fill={color}
          fillOpacity=".35"
          stroke={color}
          strokeWidth="2"
        />
      )}
    </Plot>
  );
}

function ExposureBrackets() {
  return (
    <Drawing
      description="Three disjoint busy intervals have lengths two, one and three seconds, together six. The full observation bracket includes two idle seconds and spans eight."
      height={155}
    >
      {({ width, scale }) => {
        const left = Math.min(55 * scale, width * 0.22),
          right = width - 17 * scale,
          x = (t) => left + (t / 8) * (right - left);
        return (
          <>
            {[
              [0, 2, ink.amber],
              [3, 4, ink.cyan],
              [4, 7, ink.rose],
            ].map(([a, b, color]) => (
              <g key={a}>
                <rect
                  x={x(a)}
                  y={15 * scale}
                  width={x(b) - x(a)}
                  height={20 * scale}
                  fill={color}
                />
                <path
                  d={`M${x(a)},${42 * scale}v${8 * scale}H${x(b)}v${-8 * scale}`}
                  fill="none"
                  stroke={color}
                />
                <text x={x((a + b) / 2)} y={70 * scale} textAnchor="middle">
                  {b - a} s
                </text>
              </g>
            ))}
            <path
              d={`M${x(0)},${96 * scale}v${8 * scale}H${x(8)}v${-8 * scale}`}
              fill="none"
              stroke={ink.pale}
            />
            <text x={width / 2} y={130 * scale} textAnchor="middle">
              full exposure: 8 s
            </text>
          </>
        );
      }}
    </Drawing>
  );
}

function UnfinishedWorker() {
  return (
    <div className="queue-worker">
      <span>part-served job</span>
      <Drawing
        height={100}
        description="A schematic current service interval has an already served portion followed by unfinished R; only R enters the tagged wait."
      >
        {({ width, scale, id }) => (
          <>
            <rect
              x="0"
              y={8 * scale}
              width={width * 0.45}
              height={27 * scale}
              fill={`url(#${id}-hatch)`}
              stroke={ink.muted}
            />
            <rect
              x={width * 0.45}
              y={8 * scale}
              width={width * 0.55}
              height={27 * scale}
              fill={ink.amber}
            />
            <text x={width * 0.22} y={57 * scale} textAnchor="middle">
              served
            </text>
            <text x={width * 0.73} y={57 * scale} textAnchor="middle">
              R left
            </text>
            <text x={width / 2} y={84 * scale} textAnchor="middle">
              schematic work
            </text>
          </>
        )}
      </Drawing>
    </div>
  );
}

function CappedTail() {
  const xm = 1 / 30,
    cap = 1;
  const survival = (t) => (t < xm ? 1 : (xm / t) ** 1.5);
  const points = Array.from({ length: 201 }, (_, i) => {
    const t = i / 200;
    return [t, survival(t)];
  });
  const atom = survival(cap);
  return (
    <Figure
      id="Q25"
      caption="The displayed cap M=1 s creates an atom at 1 and survival zero beyond 1. The finite cap results support the separate monotone limiting argument; four points alone are not its proof."
    >
      <Plot
        description="Capped survival through1 second; first moment is area under this curve."
        xDomain={[0, 1.1]}
        yDomain={[0, 1]}
        xLabel="duration s (seconds)"
        yLabel="survival"
        xTicks={[0, 0.5, 1]}
      >
        {({ x, y }) => (
          <>
            <path
              d={`${linePath(points, x, y)}L${x(1)},${y(0)}L${x(0)},${y(0)}Z`}
              fill={ink.cyan}
              fillOpacity=".22"
            />
            <Curve points={points} x={x} y={y} color={ink.cyan} />
            <line x1={x(1)} x2={x(1)} y1={y(atom)} y2={y(0)} stroke={ink.rose} />
            <line x1={x(1)} x2={x(1.1)} y1={y(0)} y2={y(0)} stroke={ink.cyan} />
            <circle cx={x(1)} cy={y(atom)} r="3" fill="#111" stroke={ink.cyan} />
            <circle cx={x(1)} cy={y(0)} r="3" fill={ink.cyan} />
          </>
        )}
      </Plot>
      <Plot
        description="Twice-duration-weighted survival whose area is the capped second moment."
        xDomain={[0, 1]}
        yDomain={[0, 0.07]}
        xLabel="duration s (seconds)"
        yLabel="2s × survival (s)"
        yTicks={[0, 0.035, 0.07]}
      >
        {({ x, y }) => (
          <>
            <path
              d={`${linePath(
                points.map(([t, p]) => [t, 2 * t * p]),
                x,
                y,
              )}L${x(1)},${y(0)}L${x(0)},${y(0)}Z`}
              fill={ink.amber}
              fillOpacity=".25"
            />
            <Curve points={points.map(([t, p]) => [t, 2 * t * p])} x={x} y={y} />
          </>
        )}
      </Plot>
      <Plot
        description="The cap creates a point mass at one second; its probability is (1/30) to the power1.5."
        xDomain={[0.8, 1.2]}
        yDomain={[0, 0.01]}
        xLabel="duration (s)"
        yLabel="cap atom probability"
        xTicks={[0.8, 1, 1.2]}
        yTicks={[0, 0.005, 0.01]}
        height={180}
      >
        {({ x, y }) => (
          <>
            <line x1={x(1)} x2={x(1)} y1={y(0)} y2={y(atom)} stroke={ink.rose} strokeWidth="2" />
            <circle cx={x(1)} cy={y(atom)} r="5" fill={ink.rose} />
          </>
        )}
      </Plot>
      <p>
        Cap atom: P(S≥1)={format(atom, 8)}. This is probability mass, separate from the two area
        integrands.
      </p>
      <Plot
        description="Recorded capped-law mean waits at caps1,10,100,1000 seconds, logarithmic cap axis."
        xDomain={[0, 3]}
        yDomain={[0, 16]}
        xLabel="cap M (s), log₁₀ spacing"
        yLabel="mean wait (s)"
        xTicks={[0, 1, 2, 3]}
        xTickLabels={{ 0: '1', 1: '10', 2: '100', 3: '1000' }}
        yTicks={[0, 8, 16]}
      >
        {({ x, y }) =>
          [0.282607, 1.276417, 4.579041, 15.096908].map((w, i) => (
            <circle key={i} cx={x(i)} cy={y(w)} r="5" fill={ink.rose} />
          ))
        }
      </Plot>
    </Figure>
  );
}

export function QueueingServiceFigure({ id }) {
  if (id === 'Q20') return <ServiceSamplingLab />;
  if (id === 'Q24') return <ResidualWaitLab />;
  if (id === 'Q25') return <CappedTail />;
  if (id === 'Q21')
    return (
      <Figure
        id={id}
        caption="Each area is s²/2. Width and height are both durations; neither triangle is a queue-wait distribution."
      >
        <div className="queue-panels">
          <div>
            <Triangle duration={0.05} max={0.15} color={ink.cyan} label="short" />
            <p>Short: .05²/2=.00125 s²</p>
          </div>
          <div>
            <Triangle duration={0.15} max={0.15} color={ink.amber} label="long" />
            <p>Long: .15²/2=.01125 s²</p>
          </div>
        </div>
        <p>Rare-long law, full 0–1.05 s overview:</p>
        <Triangle duration={1.05} max={1.05} color={ink.amber} label="rare long" />
        <p>
          The .05 s short interval above uses a labelled 0–.15 s detail. The 1.05 s triangle has
          area .55125 s².
        </p>
      </Figure>
    );
  if (id === 'Q22')
    return (
      <Figure
        id={id}
        caption="Idle gaps contribute zero residual. The same 7 s² area is divided by 6 busy seconds or 8 total seconds."
      >
        <Plot
          description="Service residual triangles on intervals[0,2),[3,4),[4,7); idle elsewhere through8."
          xDomain={[0, 8]}
          yDomain={[0, 3]}
          xLabel="calendar time (s)"
          yLabel="residual service (s)"
          yTicks={[0, 1, 2, 3]}
        >
          {({ x, y }) =>
            [
              [0, 2, ink.amber],
              [3, 4, ink.cyan],
              [4, 7, ink.rose],
            ].map(([a, b, color]) => (
              <path
                key={a}
                d={`M${x(a)},${y(0)}V${y(b - a)}L${x(b)},${y(0)}Z`}
                fill={color}
                fillOpacity=".3"
                stroke={color}
              />
            ))
          }
        </Plot>
        <ExposureBrackets />
        <Table
          caption="Finite exposure accounting"
          headers={['Interval', 'busy time (s)', 'residual area (s²)']}
          rows={[
            ['[0,2)', 2, 2],
            ['[2,3)', 0, 0],
            ['[3,4)', 1, 0.5],
            ['[4,7)', 3, 4.5],
            ['[7,8)', 0, 0],
          ]}
        />
        <p>
          Busy mean: 7/6 s. Full-window mean: 7/8 s.
          <br />
          n=3; m₁=2 s; m₂=14/3 s². These are finite accounting identities.
        </p>
      </Figure>
    );
  if (id === 'Q23')
    return (
      <Figure
        id={id}
        caption="The tagged wait assembles unfinished service plus the complete demands of waiting jobs ahead; its own service is not yet included."
      >
        <div className="queue-topology">
          <UnfinishedWorker />
          <span>→</span>
          <span className="queue-stage queue-stage--ahead">waiting S₁</span>
          <span
            className="queue-stage queue-stage--ahead"
            style={{ color: ink.rose, borderColor: ink.rose }}
          >
            waiting S₂
          </span>
          <span>← tagged arrival</span>
        </div>
        <Drawing
          description="Symbolic remaining workload R plus S1 plus S2 assembled head-to-tail; widths schematic."
          height={100}
        >
          {({ width, scale }) => {
            const left = 12 * scale,
              w = (width - 24 * scale) / 3;
            return (
              <>
                {['R', 'S₁', 'S₂'].map((label, i) => (
                  <g key={label}>
                    <rect
                      x={left + i * w}
                      y={25 * scale}
                      width={w}
                      height={30 * scale}
                      fill={[ink.amber, ink.cyan, ink.rose][i]}
                      fillOpacity=".5"
                      stroke="#111"
                    />
                    <text x={left + (i + 0.5) * w} y={46 * scale} textAnchor="middle">
                      {label}
                    </text>
                  </g>
                ))}
                <text x={left} y={84 * scale}>
                  Symbolic work, not scaled seconds
                </text>
              </>
            );
          }}
        </Drawing>
        <p>
          PASTA → time-average R and queue count.
          <br />
          FCFS + unrevealed iid demands → Lq E[S].
          <br />
          Little's queue boundary → Lq=λWq.
        </p>
      </Figure>
    );
  if (id === 'Q26')
    return (
      <Figure
        id={id}
        caption="A new vacation begins only after the system empties. This timeline illustrates the rule; it is not an empirical derivation of the ensemble mean."
      >
        <Plot
          description="Two .4-second vacations, arrival during the second, remaining vacation then exhaustive busy interval."
          xDomain={[0, 1.6]}
          yDomain={[0, 1]}
          xLabel="illustrative time (s)"
          yLabel="worker state"
          xTicks={[0, 0.8, 1.6]}
          yTicks={[]}
          height={170}
        >
          {({ x, y, id: pattern }) => (
            <>
              {[
                [0, 0.4],
                [0.4, 0.8],
                [1.2, 1.6],
              ].map(([a, b]) => (
                <rect
                  key={a}
                  x={x(a)}
                  y={y(0.65)}
                  width={x(b) - x(a)}
                  height={y(0.25) - y(0.65)}
                  fill={`url(#${pattern}-hatch)`}
                  stroke={ink.pale}
                />
              ))}
              <rect
                x={x(0.8)}
                y={y(0.65)}
                width={x(1.2) - x(0.8)}
                height={y(0.25) - y(0.65)}
                fill={ink.amber}
              />
              <line
                x1={x(0.6)}
                x2={x(0.6)}
                y1={y(0.05)}
                y2={y(0.95)}
                stroke={ink.rose}
                strokeWidth="2"
              />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            ['V: .4 s repeated vacation', ink.pale, '▧'],
            ['exhaustive busy interval', ink.amber, '━'],
            ['arrival during vacation', ink.rose, '│'],
          ]}
        />
        <p>
          Mean residual vacation: .4/2=.2 s.
          <br />
          Full-time contribution (1−ρ)×.2; after division by (1−ρ), the mean wait gains .2 s. The
          low-load customer limit is for positive λ; λ=0 has no arriving customer population.
        </p>
      </Figure>
    );
  throw new Error(`Unknown service figure ${id}`);
}
