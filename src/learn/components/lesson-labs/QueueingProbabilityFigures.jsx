import React, { useState } from 'react';
import { mm1State, mm1Survival } from '../../data/queueing-models.js';
import {
  Choice,
  Controls,
  Curve,
  Drawing,
  Figure,
  Legend,
  Plot,
  Range,
  Table,
  Worker,
  format,
  ink,
} from './QueueingReadingPrimitives.jsx';

export function ProbabilityBars({
  probabilities,
  tail,
  color = ink.amber,
  description = 'Stationary population probabilities',
  compare,
}) {
  const values = tail === undefined ? probabilities : [...probabilities, tail];
  const ticks = [...new Set([0, Math.floor((values.length - 1) / 2), values.length - 1])];
  const labels = tail === undefined ? {} : { [values.length - 1]: `≥${probabilities.length}` };
  return (
    <Plot
      description={description}
      xDomain={[-0.5, values.length - 0.5]}
      yDomain={[0, 1]}
      xLabel={tail === undefined ? 'population (jobs)' : 'population; final bar is tail'}
      yLabel="probability"
      xTicks={ticks}
      xTickLabels={labels}
      yTicks={[0, 0.5, 1]}
    >
      {({ x, y }) => (
        <>
          {values.map((p, n) => (
            <rect
              key={n}
              x={x(n - 0.35)}
              y={y(p)}
              width={x(n + (compare ? 0 : 0.35)) - x(n - 0.35)}
              height={y(0) - y(p)}
              fill={color}
              opacity={tail !== undefined && n === values.length - 1 ? 0.45 : 0.85}
              stroke={color}
            />
          ))}
          {compare?.map((p, n) => (
            <rect
              key={n}
              x={x(n)}
              y={y(p)}
              width={x(n + 0.35) - x(n)}
              height={y(0) - y(p)}
              fill={ink.cyan}
              opacity=".65"
              stroke={ink.cyan}
            />
          ))}
        </>
      )}
    </Plot>
  );
}

export function StateEdges({ states = 4, servers = 1, arrival = 'λ', service = 'μ' }) {
  return (
    <div className="queue-state-edges">
      {Array.from({ length: states - 1 }, (_, n) => (
        <div key={n} className="queue-state-row">
          <span className="queue-token">{n}</span>
          <div>
            <div>{arrival} →</div>
            <div>
              ← {Math.min(n + 1, servers) === 1 ? service : `${Math.min(n + 1, servers)}${service}`}
            </div>
          </div>
          <span className="queue-token">{n + 1}</span>
          <span>
            {Math.min(n + 1, servers)} active worker{Math.min(n + 1, servers) > 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadLab() {
  const [arrival, setArrival] = useState(8);
  const state = mm1State(arrival, 10);
  const points = Array.from({ length: 96 }, (_, i) => [0.1 * i, 1 / (10 - 0.1 * i)]);
  return (
    <Figure
      id="Q14"
      caption="μ=10 jobs/s is fixed. At or beyond capacity the infinite-buffer stationary quantities are absent."
    >
      {state.stable ? (
        <ProbabilityBars probabilities={state.probabilities} tail={state.tail} />
      ) : (
        <p role="status">
          λ={arrival} ≥ μ=10: the stationary geometric law cannot normalize. Stationary L, W and Wq
          are unavailable.
        </p>
      )}
      <Plot
        description={`Mean total response for stable arrival rates. Current arrival rate ${arrival}.`}
        xDomain={[0, 11]}
        yDomain={[0, 2.2]}
        xLabel="arrival rate (jobs/s)"
        yLabel="mean total (s)"
        xTicks={[0, 5, 10]}
        yTicks={[0, 1, 2]}
      >
        {({ x, y, top, bottom }) => (
          <>
            <Curve points={points} x={x} y={y} />
            <line
              x1={x(10)}
              x2={x(10)}
              y1={top}
              y2={bottom}
              stroke={ink.rose}
              strokeDasharray="5 4"
            />
            {state.stable && (
              <circle
                cx={x(arrival)}
                cy={y(state.meanTotal)}
                r="5"
                fill={ink.amber}
                stroke="#fff"
              />
            )}
          </>
        )}
      </Plot>
      <p>
        The dashed capacity boundary is λ=10. The response grows without bound as λ approaches 10
        from below; the finite drawing ends at the largest offered stable setting 9.5.
      </p>
      <Controls onReset={() => setArrival(8)}>
        <Range
          label="Arrival rate λ"
          value={arrival}
          onChange={setArrival}
          min={0.5}
          max={11}
          step={0.5}
          unit="jobs/s"
        />
      </Controls>
      {state.stable && (
        <Table
          caption="Same stationary model"
          headers={['Load ρ', 'L (jobs)', 'Wq (s)', 'W (s)', 'tail P(N≥12)']}
          rows={[
            [
              format(state.rho),
              format(state.meanNumber),
              format(state.meanWait),
              format(state.meanTotal),
              format(state.tail),
            ],
          ]}
        />
      )}
    </Figure>
  );
}

function TailLab() {
  const [arrival, setArrival] = useState(0.9);
  const [percentile, setPercentile] = useState(0.99);
  const state = mm1State(arrival, 1, percentile);
  return (
    <Figure
      id="Q19"
      caption="Total duration is amber/solid; queue wait is cyan/dashed. The queue quantile uses its zero atom before any logarithm."
    >
      {[100, 10].map((max) => (
        <div key={max}>
          <p>{max === 100 ? 'Full overview: 0–100 s' : 'Magnified detail: 0–10 s'}</p>
          <Plot
            description={`Survival curves through ${max} seconds; total quantile${state.totalQuantile}, queue quantile${state.waitQuantile}.`}
            xDomain={[0, max]}
            yDomain={[0, 1]}
            xLabel="duration (s)"
            yLabel="strict survival"
            yTicks={[0, 0.5, 1]}
          >
            {({ x, y }) => (
              <>
                <Curve
                  points={Array.from({ length: 161 }, (_, i) => [
                    (max * i) / 160,
                    mm1Survival(arrival, 1, (max * i) / 160).total,
                  ])}
                  x={x}
                  y={y}
                />
                <Curve
                  points={Array.from({ length: 161 }, (_, i) => [
                    (max * i) / 160,
                    mm1Survival(arrival, 1, (max * i) / 160).queue,
                  ])}
                  x={x}
                  y={y}
                  color={ink.cyan}
                  dashed
                />
                <line
                  x1={x(0)}
                  x2={x(max)}
                  y1={y(1 - percentile)}
                  y2={y(1 - percentile)}
                  stroke={ink.pale}
                  strokeDasharray="2 4"
                />
                {[
                  [state.totalQuantile, ink.amber],
                  [state.waitQuantile, ink.cyan],
                ]
                  .filter(([q]) => q <= max)
                  .map(([q, color]) => (
                    <g key={color}>
                      <line
                        x1={x(q)}
                        x2={x(q)}
                        y1={y(0)}
                        y2={y(1 - percentile)}
                        stroke={color}
                        strokeDasharray="4 3"
                      />
                      <circle
                        cx={x(q)}
                        cy={y(q === 0 ? arrival : 1 - percentile)}
                        r="4"
                        fill={color}
                        stroke="#fff"
                      />
                    </g>
                  ))}
              </>
            )}
          </Plot>
        </div>
      ))}
      <Legend
        entries={[
          [`Total p${percentile * 100}: ${format(state.totalQuantile, 6)} s`, ink.amber, '━'],
          [`Queue p${percentile * 100}: ${format(state.waitQuantile, 6)} s`, ink.cyan, '┄'],
        ]}
      />
      <Controls
        onReset={() => {
          setArrival(0.9);
          setPercentile(0.99);
        }}
      >
        <Range
          label="Arrival rate λ"
          value={arrival}
          onChange={setArrival}
          min={0.1}
          max={0.95}
          step={0.05}
          unit="jobs/s"
        />
        <Choice
          label="Percentile p"
          value={String(percentile)}
          onChange={(value) => setPercentile(Number(value))}
          options={[0.5, 0.9, 0.95, 0.99].map((p) => [String(p), `${p * 100}%`])}
        />
      </Controls>
      <p>
        μ=1/s. Zero-wait mass: {format(1 - arrival)}.{' '}
        {state.waitQuantile === 0
          ? `p=${percentile} is inside this atom, so queue quantile is exactly 0 s.`
          : `The guide is survival 1−p=${format(1 - percentile)}.`}
      </p>
    </Figure>
  );
}

function TailSum() {
  const rho = 0.8;
  const widths = [1, 2, 3, 4].map((n) => (1 - rho) * rho ** n);
  const colors = [ink.amber, ink.cyan, ink.violet, ink.rose];
  return (
    <Figure
      id="Q15"
      caption="Each number and colour identifies the same n-column pieces before and after rearrangement. Row k contains one piece from every displayed n≥k column; its neutral hatch continues through all n≥5."
    >
      <Plot
        description="Columns n1 through4 have widths πn and heights n. Undisplayed columns contribute2.94912 jobs to the expectation."
        xDomain={[0, 1]}
        yDomain={[0, 4]}
        xLabel="cumulative probability width"
        yLabel="population height"
        xTicks={[0, 0.5, 1]}
        yTicks={[0, 2, 4]}
      >
        {({ x, y }) =>
          widths.flatMap((w, i) => {
            const start = widths.slice(0, i).reduce((a, b) => a + b, 0);
            return Array.from({ length: i + 1 }, (_, k) => (
              <g key={`${i}-${k}`} data-tail-piece={`column-${i + 1}-unit-${k + 1}`}>
              <rect
                x={x(start)}
                y={y(k + 1)}
                width={x(start + w) - x(start)}
                height={y(k) - y(k + 1)}
                fill={colors[i]}
                fillOpacity=".65"
                stroke="#111"
              />
              <text x={x(start + w / 2)} y={(y(k) + y(k + 1)) / 2} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
              </g>
            ));
          })
        }
      </Plot>
      <Legend entries={widths.map((w, i) => [`n=${i + 1}: width π${i + 1}=${format(w, 5)}`, colors[i], `${i + 1}`])} />
      <p>
        Displayed columns n=1,2,3,4. Remaining column contribution: ρ⁵(5+ρ/(1−ρ)) = 2.94912 jobs.
      </p>
      <Drawing
        description="Tail rows have widths .8,.64,.512,.4096; each contains .32768 from columns n≥5."
        height={280}
      >
        {({ width, scale, id }) => {
          const left = Math.min(55 * scale, width * 0.22),
            span = width - left - 17 * scale;
          return [1, 2, 3, 4].map((k, i) => (
            <g key={k}>
              <text x={0} y={(42 + 60 * i) * scale}>
                k={k}
              </text>
              {widths.slice(i).map((w, j) => {
                const n = i + j + 1;
                const start = widths.slice(i, i + j).reduce((a, b) => a + b, 0);
                return <g key={n} data-tail-piece={`row-${k}-column-${n}`}>
                  <rect x={left + span * start} y={(18 + 60 * i) * scale} width={span * w} height={38 * scale} fill={colors[n - 1]} fillOpacity=".65" stroke="#111" />
                  <text x={left + span * (start + w / 2)} y={(37 + 60 * i) * scale} textAnchor="middle" dominantBaseline="central">{n}</text>
                </g>;
              })}
              <rect x={left + span * (rho ** k - rho ** 5)} y={(18 + 60 * i) * scale} width={span * rho ** 5} height={38 * scale} fill={ink.muted} fillOpacity=".2" stroke={ink.muted} />
              <rect
                x={left + span * (rho ** k - rho ** 5)}
                y={(18 + 60 * i) * scale}
                width={span * rho ** 5}
                height={38 * scale}
                fill={`url(#${id}-hatch)`}
              />
              <text x={left} y={(73 + 60 * i) * scale}>
                {format(rho ** k)}
              </text>
            </g>
          ));
        }}
      </Drawing>
      <p>Rows k≥5 contribute ρ⁵/(1−ρ)=1.6384 jobs. All rows sum to E[N]=.8/.2=4 jobs.</p>
    </Figure>
  );
}

function MixtureBranches() {
  const branches = [
    [0, 0.1],
    [1, 0.09],
    [2, 0.081],
  ];
  return (
    <Drawing
      description="A geometric selection branches into one, two or three exponential stages. Branch thickness represents its probability; stage widths are schematic."
      height={320}
    >
      {({ width, scale }) => {
        const source = 18 * scale,
          stages = width * 0.4,
          end = width - 12 * scale;
        return (
          <>
            <line x1={source} x2={source} y1={38 * scale} y2={240 * scale} stroke={ink.pale} />
            {branches.map(([n, p], i) => {
              const y = (53 + i * 83) * scale,
                stageWidth = (end - stages) / (n + 1);
              return (
                <g key={n}>
                  <path
                    d={`M${source},${155 * scale}Q${width * 0.18},${y} ${stages - 9 * scale},${y}`}
                    fill="none"
                    stroke={ink.amber}
                    strokeWidth={p * 90 * scale}
                  />
                  <text x={source + 3 * scale} y={y - 18 * scale}>
                    {format(p)}
                  </text>
                  {Array.from({ length: n + 1 }, (_, k) => (
                    <g key={k}>
                      <rect
                        x={stages + k * stageWidth}
                        y={y - 12 * scale}
                        width={stageWidth - 3 * scale}
                        height={24 * scale}
                        fill={k === n ? ink.amber : ink.cyan}
                        fillOpacity=".5"
                        stroke={k === n ? ink.amber : ink.cyan}
                      />
                      <text
                        x={stages + (k + 0.5) * stageWidth}
                        y={y + 4 * scale}
                        textAnchor="middle"
                      >
                        {k + 1}
                      </text>
                    </g>
                  ))}
                  <text x={stages} y={y + 32 * scale}>
                    n={n}: {n + 1} stage{n ? 's' : ''}
                  </text>
                </g>
              );
            })}
            <text x={source} y={292 * scale}>
              … further branches n=3,4,…
            </text>
          </>
        );
      }}
    </Drawing>
  );
}

function QueueWaitCdf() {
  return (
    <Plot
      description="Queue-wait CDF is zero to the left of zero, jumps to .1 at zero, then increases as 1 minus .9 exp(-.1t)."
      xDomain={[-2, 20]}
      yDomain={[0, 1]}
      xLabel="duration (s)"
      yLabel="CDF probability"
      xTicks={[0, 10, 20]}
      yTicks={[0, 0.5, 1]}
    >
      {({ x, y }) => (
        <>
          <path d={`M${x(-2)},${y(0)}H${x(0)}`} fill="none" stroke={ink.cyan} />
          <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(0.1)} stroke={ink.cyan} strokeDasharray="3 3" />
          <circle cx={x(0)} cy={y(0)} r="4" fill="#111" stroke={ink.cyan} />
          <Curve
            points={Array.from({ length: 81 }, (_, i) => [
              i / 4,
              1 - 0.9 * Math.exp((-0.1 * i) / 4),
            ])}
            x={x}
            y={y}
            color={ink.cyan}
          />
          <circle cx={x(0)} cy={y(0.1)} r="4" fill={ink.cyan} />
        </>
      )}
    </Plot>
  );
}

export function QueueingProbabilityFigure({ id }) {
  if (id === 'Q14') return <LoadLab />;
  if (id === 'Q19') return <TailLab />;
  if (id === 'Q15') return <TailSum />;
  if (id === 'Q12')
    return (
      <Figure
        id={id}
        caption="State n counts jobs. Every nonempty state has one busy worker and departure rate μ, even when jobs are waiting."
      >
        <StateEdges />
        <p>
          … larger populations continue with the same λ up and μ down. State 0 has no service
          departure.
        </p>
        <Worker label="one service clock" job="S" rate="μ jobs/s" />
      </Figure>
    );
  if (id === 'Q13') {
    const s = mm1State(8, 10);
    return (
      <Figure
        id={id}
        caption="The last bucket aggregates all n≥12; it is not the probability of state 12 alone."
      >
        <div className="queue-state-row">
          <span className="queue-token">n</span>
          <div>
            <div>πₙ λ →</div>
            <div>← πₙ₊₁ μ</div>
          </div>
          <span className="queue-token">n+1</span>
        </div>
        <p>Equal flow at the cut: πₙ₊₁=.8πₙ. Normalization gives π₀=.2.</p>
        <ProbabilityBars probabilities={s.probabilities} tail={s.tail} />
        <p>
          π₀=.2, π₁=.16, π₂=.128; tail mass .8¹²={format(s.tail, 6)}. Displayed masses and tail sum
          to 1.
        </p>
      </Figure>
    );
  }
  if (id === 'Q16')
    return (
      <Figure
        id={id}
        caption="Schematic stages count exponential clocks of rate μ; equal drawn widths are not equal realized seconds."
      >
        <Drawing
          height={295}
          description="Zero, one and two preceding jobs require one, two and three total exponential stages. Equal-sized blocks count stages, not elapsed seconds."
        >
          {({ width, scale }) => {
            const left = 12 * scale,
              span = width - 24 * scale,
              stageWidth = span / 3;
            return [0, 1, 2].map((n) => (
              <g key={n}>
                <text x={left} y={(20 + 90 * n) * scale}>
                  {n} preceding job{n === 1 ? '' : 's'}
                </text>
                {Array.from({ length: n + 1 }, (_, k) => (
                  <g key={k}>
                    <rect
                      x={left + k * stageWidth}
                      y={(33 + 90 * n) * scale}
                      width={stageWidth - 7 * scale}
                      height={27 * scale}
                      fill={k === n ? ink.amber : ink.cyan}
                      fillOpacity=".4"
                      stroke={k === n ? ink.amber : ink.cyan}
                      strokeDasharray={k < n ? '4 3' : undefined}
                    />
                    <text
                      x={left + (k + 0.5) * stageWidth - 3 * scale}
                      y={(51 + 90 * n) * scale}
                      textAnchor="middle"
                    >
                      {k === n ? 'own' : k === 0 ? 'residual' : 'ahead'}
                    </text>
                  </g>
                ))}
                <text x={left} y={(80 + 90 * n) * scale}>
                  Queue: {n} stage{n === 1 ? '' : 's'}; total: {n + 1}
                </text>
              </g>
            ));
          }}
        </Drawing>
        <p>
          With n=0 the queue wait is exactly zero, a probability atom. The total still contains the
          job's own service stage.
        </p>
      </Figure>
    );
  if (id === 'Q17')
    return (
      <Figure
        id={id}
        caption="Geometric branch weights retain their original mass. The omitted branch is not renormalized away."
      >
        <MixtureBranches />
        <Legend
          entries={[
            ['preceding exponential stage', ink.cyan, '□'],
            ['own exponential stage', ink.amber, '■'],
          ]}
        />
        <Table
          caption="First total-survival branches at ρ=.9"
          headers={['n before arrival', 'weight', 'stages in total']}
          rows={[
            [0, 0.1, 1],
            [1, 0.09, 2],
            [2, 0.081, 3],
            ['3…80', 'retained remaining weights', 'n+1'],
            ['≥81', '.9⁸¹ omitted', 'unbounded'],
          ]}
        />
        <div className="queue-state-row">
          <span className="queue-stage">n=2 branch</span>
          <span>→</span>
          <span>e⁻ˣ(1 + x + x²/2)</span>
        </div>
        <Table
          caption="Recorded retained mixture, strict survival"
          headers={['t (s)', 'queue', 'total']}
          rows={[
            [0, '.899803373', '.999803373'],
            [1, '.814157049', '.904640791'],
            [4, '.603091414', '.670123419'],
          ]}
        />
        <p>
          Missing geometric mass .00019662705047555332. The separate zero-wait atom has mass .1.
        </p>
      </Figure>
    );
  if (id === 'Q18')
    return (
      <Figure
        id={id}
        caption="A probability mass at zero and a positive-duration density have different units; their heights cannot be added."
      >
        <Plot
          description="A point mass .1 sits at duration zero."
          xDomain={[-0.25, 1]}
          yDomain={[0, 0.2]}
          xLabel="duration (s)"
          yLabel="atom probability"
          xTicks={[0, 1]}
          yTicks={[0, 0.1, 0.2]}
          height={180}
        >
          {({ x, y }) => (
            <>
              <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(0.1)} stroke={ink.cyan} strokeWidth="3" />
              <circle cx={x(0)} cy={y(0.1)} r="5" fill={ink.cyan} />
            </>
          )}
        </Plot>
        <Plot
          description="Positive queue-wait density .09 exp(-.1t), total area .9."
          xDomain={[0, 50]}
          yDomain={[0, 0.1]}
          xLabel="duration (s)"
          yLabel="density (1/s)"
          yTicks={[0, 0.05, 0.1]}
        >
          {({ x, y }) => (
            <Curve
              points={Array.from({ length: 101 }, (_, i) => [
                i / 2,
                0.09 * Math.exp((-0.1 * i) / 2),
              ])}
              x={x}
              y={y}
              color={ink.cyan}
              dashed
            />
          )}
        </Plot>
        <QueueWaitCdf />
        <p>
          Positive component mass .9, including the tail beyond 50 s. CDF at 0 jumps from 0 to .1;
          strict survival P(Tq&gt;0)=.9. Total duration has no zero atom.
        </p>
      </Figure>
    );
  throw new Error(`Unknown queue probability figure ${id}`);
}
