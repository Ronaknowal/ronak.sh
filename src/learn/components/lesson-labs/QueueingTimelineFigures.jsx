import React, { createContext, useContext, useState } from 'react';
import { fcfsTrace, occupancyWindow, queueExampleJobs } from '../../data/queueing-models.js';
import {
  Choice,
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
  jobInk,
} from './QueueingReadingPrimitives.jsx';

const AreaContext = createContext(null);
export function QueueingAreaProvider({ children }) {
  const [horizon, setHorizon] = useState(7);
  const [boundary, setBoundary] = useState('system');
  const [selected, setSelected] = useState('C');
  const reset = () => {
    setHorizon(7);
    setBoundary('system');
    setSelected('C');
  };
  return (
    <AreaContext.Provider
      value={{ horizon, setHorizon, boundary, setBoundary, selected, setSelected, reset }}
    >
      {children}
    </AreaContext.Provider>
  );
}

export function JobLanes({
  jobs = fcfsTrace(queueExampleJobs),
  max = 8,
  selected,
  horizon = max,
  boundary = 'system',
  worker = false,
  windowStart = 0,
  totalBracket = false,
  residenceOnly = false,
}) {
  const rowCount = jobs.length + (worker ? 1 : 0);
  return (
    <Drawing
      height={56 + rowCount * 38 + (totalBracket ? 36 : 0)}
      description={`${residenceOnly ? 'Residence intervals; service starts unspecified' : boundary + ' durations'} on one seconds axis. ${jobs.map((j) => `${j.id}: arrival ${j.arrival}, ${residenceOnly ? '' : `start ${j.start}, `}departure ${j.departure}`).join('; ')}`}
    >
      {({ width, height, scale, id }) => {
        const left = 32 * scale,
          right = width - 15 * scale;
        const x = (t) => left + (t / max) * (right - left);
        return (
          <>
            {windowStart > 0 && (
              <>
                <defs>
                  <pattern id={`${id}-excluded`} width="8" height="8" patternUnits="userSpaceOnUse">
                    <path
                      d="M0,0L8,8M8,0L0,8"
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity=".55"
                    />
                  </pattern>
                </defs>
                <rect
                  x={x(windowStart)}
                  y={15 * scale}
                  width={x(horizon) - x(windowStart)}
                  height={jobs.length * 38 * scale}
                  fill={ink.pale}
                  fillOpacity=".045"
                />
              </>
            )}
            {jobs.map((job, index) => {
              const y = (23 + index * 38) * scale;
              const exit = boundary === 'queue' ? job.start : job.departure;
              const start = Math.max(job.arrival, windowStart),
                end = Math.min(exit, horizon);
              const waitingEnd = residenceOnly ? start : Math.min(job.start, horizon);
              return (
                <g key={job.id} style={{ color: jobInk[job.id] }} data-residence-only={residenceOnly ? job.id : undefined}>
                  <text x={3 * scale} y={y + 14 * scale} style={{ fill: jobInk[job.id] }}>
                    {job.id}
                  </text>
                  <line
                    x1={left}
                    x2={right}
                    y1={y + 11 * scale}
                    y2={y + 11 * scale}
                    stroke="#494946"
                  />
                  {exit > job.arrival && (
                    <rect
                      x={x(job.arrival)}
                      y={y}
                      width={x(exit) - x(job.arrival)}
                      height={22 * scale}
                      fill={jobInk[job.id]}
                      opacity=".13"
                      stroke={residenceOnly ? jobInk[job.id] : undefined}
                      strokeWidth={residenceOnly ? 2 : undefined}
                    />
                  )}
                  {windowStart > 0 &&
                    [
                      [job.arrival, Math.min(exit, windowStart)],
                      [Math.max(job.arrival, horizon), exit],
                    ]
                      .filter(([a, b]) => b > a)
                      .map(([a, b]) => (
                        <rect
                          key={a}
                          x={x(a)}
                          y={y}
                          width={x(b) - x(a)}
                          height={22 * scale}
                          fill={`url(#${id}-excluded)`}
                        />
                      ))}
                  {end > start && (
                    <rect
                      x={x(start)}
                      y={y}
                      width={x(end) - x(start)}
                      height={22 * scale}
                      fill={jobInk[job.id]}
                      opacity={residenceOnly ? '.35' : '.85'}
                      stroke={residenceOnly ? jobInk[job.id] : undefined}
                      strokeDasharray={residenceOnly ? '6 3' : undefined}
                      strokeWidth={residenceOnly ? 2 : undefined}
                    />
                  )}
                  {waitingEnd > start && (
                    <rect
                      x={x(start)}
                      y={y}
                      width={x(waitingEnd) - x(start)}
                      height={22 * scale}
                      fill="#171717"
                    />
                  )}
                  {waitingEnd > start && (
                    <rect
                      x={x(start)}
                      y={y}
                      width={x(waitingEnd) - x(start)}
                      height={22 * scale}
                      fill={`url(#${id}-hatch)`}
                      stroke={jobInk[job.id]}
                    />
                  )}
                  {job.arrival === exit && (
                    <line
                      x1={x(exit)}
                      x2={x(exit)}
                      y1={y - 3 * scale}
                      y2={y + 25 * scale}
                      stroke={jobInk[job.id]}
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={x(job.arrival)}
                    cy={y + 11 * scale}
                    r={3.5 * scale}
                    fill="#111"
                    stroke={jobInk[job.id]}
                    strokeWidth="2"
                  />
                  {!residenceOnly && <rect
                    x={x(job.start) - 2.5 * scale}
                    y={y + 8.5 * scale}
                    width={5 * scale}
                    height={5 * scale}
                    fill={jobInk[job.id]}
                  />}
                  <line
                    x1={x(exit)}
                    x2={x(exit)}
                    y1={y}
                    y2={y + 22 * scale}
                    stroke={jobInk[job.id]}
                    strokeWidth="2"
                  />
                  {selected === job.id && (
                    <rect
                      x={x(job.arrival) - 3}
                      y={y - 4 * scale}
                      width={Math.max(0, x(exit) - x(job.arrival)) + 6}
                      height={30 * scale}
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
            {worker && (
              <g>
                <text x={0} y={(31 + jobs.length * 38) * scale}>
                  W
                </text>
                {jobs.map((job) => (
                  <rect
                    key={job.id}
                    x={x(job.start)}
                    y={(23 + jobs.length * 38) * scale}
                    width={x(job.departure) - x(job.start)}
                    height={22 * scale}
                    fill={jobInk[job.id]}
                  />
                ))}
                <rect
                  x={x(jobs.at(-1).departure)}
                  y={(23 + jobs.length * 38) * scale}
                  width={x(max) - x(jobs.at(-1).departure)}
                  height={22 * scale}
                  fill="none"
                  stroke={ink.muted}
                  strokeDasharray="3 3"
                />
              </g>
            )}
            {totalBracket && (
              <g>
                <path
                  d={`M${x(jobs[0].arrival)},${(23 + rowCount * 38) * scale}v${8 * scale}H${x(jobs[0].departure)}v${-8 * scale}`}
                  stroke={jobInk[jobs[0].id]}
                  fill="none"
                />
                <text
                  x={(x(jobs[0].arrival) + x(jobs[0].departure)) / 2}
                  y={(51 + rowCount * 38) * scale}
                  textAnchor="middle"
                >
                  total {jobs[0].departure - jobs[0].arrival} s
                </text>
              </g>
            )}
            {[
              ...new Set(
                width / scale < 400 ? [0, max / 2, max] : [0, max / 4, max / 2, (3 * max) / 4, max],
              ),
            ].map((t) => (
              <text
                key={t}
                x={x(t)}
                y={height - 17 * scale}
                textAnchor={t === 0 ? 'start' : t === max ? 'end' : 'middle'}
              >
                {format(t)} s
              </text>
            ))}
            {(horizon < max || windowStart > 0) && (
              <>
                {[windowStart, horizon].map((t) => (
                  <line
                    key={t}
                    x1={x(t)}
                    x2={x(t)}
                    y1={8 * scale}
                    y2={height - 40 * scale}
                    stroke="#eee"
                    strokeDasharray="4 4"
                  />
                ))}
              </>
            )}
          </>
        );
      }}
    </Drawing>
  );
}

export function Occupancy({ state, selected, domain = 8, guide }) {
  return (
    <Plot
      description={`${state.boundary} occupancy. Area ${format(state.clippedArea)} job-seconds through ${state.horizon} seconds.`}
      xDomain={[0, domain]}
      yDomain={[0, 3]}
      xLabel="time (s)"
      yLabel="jobs inside"
      xTicks={[0, domain / 2, domain]}
      yTicks={[0, 1, 2, 3]}
    >
      {({ x, y, top, bottom }) => (
        <>
          {state.segments.flatMap((segment, index) =>
            segment.occupants.map((job, rank) => (
              <rect
                key={`${index}-${job}`}
                x={x(segment.start)}
                y={y(rank + 1)}
                width={x(segment.end) - x(segment.start)}
                height={y(rank) - y(rank + 1)}
                fill={jobInk[job]}
                opacity=".7"
                stroke={selected === job ? '#fff' : '#111'}
                strokeWidth={selected === job ? 2 : 1}
              />
            )),
          )}
          <line
            x1={x(state.horizon)}
            x2={x(state.horizon)}
            y1={top}
            y2={bottom}
            stroke="#eee"
            strokeDasharray="5 4"
          />
          {guide !== undefined && (
            <line
              x1={x(guide)}
              x2={x(guide)}
              y1={top}
              y2={bottom}
              stroke={ink.pale}
              strokeDasharray="2 3"
            />
          )}
        </>
      )}
    </Plot>
  );
}

function AreaInvestigation({ comparison = false }) {
  const state = useContext(AreaContext);
  const current = occupancyWindow(queueExampleJobs, state.horizon, state.boundary);
  const queue = occupancyWindow(queueExampleJobs, state.horizon, 'queue');
  const chosen = current.intervals.find((j) => j.id === state.selected);
  return (
    <Figure
      id={comparison ? 'Q07' : 'Q06'}
      caption={
        comparison
          ? 'The waiting boundary excludes service. A and D belong to the cohort even though their waiting intervals have zero length.'
          : 'Hollow circles mark arrivals; hatching is waiting; solid colour is service. The outlined job keeps its identity in the occupancy area.'
      }
    >
      {comparison ? (
        <>
          <JobLanes
            jobs={queue.trace}
            boundary="queue"
            selected={state.selected}
            horizon={state.horizon}
          />
          <Occupancy state={queue} selected={state.selected} />
          <p>
            Waiting area: <strong>{format(queue.clippedArea)} job·s</strong>. The selected{' '}
            {state.boundary} boundary above has area {format(current.clippedArea)} job·s at the same
            horizon.
          </p>
        </>
      ) : (
        <>
          <JobLanes
            jobs={current.trace}
            boundary={state.boundary}
            selected={state.selected}
            horizon={state.horizon}
          />
          <Occupancy state={current} selected={state.selected} />
          <p>
            <strong>{format(current.clippedArea)} job·s</strong> ={' '}
            {format(current.completedResidence)} completed + {format(current.pendingArea)}{' '}
            unfinished. Mean occupancy: {format(current.meanOccupancy)} jobs.
          </p>
          <Controls onReset={state.reset}>
            <Range
              label="Observation horizon"
              value={state.horizon}
              onChange={state.setHorizon}
              min={1}
              max={8}
              step={0.25}
              unit="s"
            />
            <Choice
              label="Boundary"
              value={state.boundary}
              onChange={state.setBoundary}
              options={[
                ['system', 'System: waiting + service'],
                ['queue', 'Queue: waiting only'],
              ]}
            />
            <Choice
              label="Selected job"
              value={state.selected}
              onChange={state.setSelected}
              options={['A', 'B', 'C', 'D'].map((j) => [j, `Job ${j}`])}
            />
          </Controls>
          <p>
            Job {state.selected}:{' '}
            {!chosen.observed
              ? 'not arrived'
              : `${format(chosen.clipped)} s observed inside; ${chosen.completedBoundary ? 'completed this boundary' : 'still inside at the cutoff'}`}
            .
          </p>
          <Table
            caption="Matched observation"
            headers={['Job', 'Observed time (s)', 'Status']}
            rows={current.intervals.map((j) => [
              j.id,
              format(j.clipped),
              !j.observed ? 'not arrived' : j.completedBoundary ? 'completed' : 'unfinished',
            ])}
          />
        </>
      )}
    </Figure>
  );
}

function DurationOperation() {
  return (
    <Figure
      id="Q04"
      caption="Subtract elapsed time, clamp unfinished work at zero, then append the next job's own service."
    >
      {[1, 4].map((gap) => (
        <div key={gap}>
          <p>Interarrival gap {gap} s</p>
          <Plot
            description={`Previous total 3 seconds, gap${gap}, unfinished${Math.max(0, 3 - gap)}, new service 1.`}
            xDomain={[0, 4]}
            yDomain={[0, 4]}
            xLabel="duration (s)"
            yLabel="operation"
            yTicks={[]}
            xTicks={[0, 2, 4]}
            height={210}
          >
            {({ x, y, scale, id }) => (
              <>
                {[
                  [3, 3, ink.amber],
                  [2, gap, ink.pale],
                  [1, Math.max(0, 3 - gap), ink.cyan],
                ].map(([row, length, color]) => (
                  <rect
                    key={row}
                    x={x(0)}
                    y={y(row) - 9 * scale}
                    width={x(length) - x(0)}
                    height={18 * scale}
                    fill={color}
                    opacity=".8"
                  />
                ))}
                <rect
                  x={x(Math.max(0, 3 - gap))}
                  y={y(1) - 9 * scale}
                  width={x(1) - x(0)}
                  height={18 * scale}
                  fill={ink.rose}
                />
                <rect
                  x={x(0)}
                  y={y(3) - 9 * scale}
                  width={x(Math.min(3, gap)) - x(0)}
                  height={18 * scale}
                  fill={`url(#${id}-hatch)`}
                />
              </>
            )}
          </Plot>
          <Legend
            entries={[
              ['previous total', ink.amber],
              ['elapsed gap', ink.pale],
              ['unfinished wait', ink.cyan],
              ['own service', ink.rose],
            ]}
          />
          <p>
            max(0, 3 − {gap}) + 1 = {Math.max(0, 3 - gap) + 1} s
            {gap === 4 ? '; the extra elapsed second is idle time.' : '.'}
          </p>
        </div>
      ))}
    </Figure>
  );
}

function SamplingTrace({ synchronized = false }) {
  const jobs = synchronized
    ? [0, 2, 4, 6].map((arrival, i) => ({ id: 'ABCD'[i], arrival, service: 1 }))
    : [
        { id: 'A', arrival: 0, service: 1.5 },
        { id: 'B', arrival: 1, service: 2 },
        { id: 'C', arrival: 2, service: 1 },
      ];
  const horizon = synchronized ? 8 : 5;
  const state = occupancyWindow(jobs, horizon);
  return (
    <Figure
      id={synchronized ? 'Q11' : 'Q10'}
      caption={
        synchronized
          ? 'Arrivals observe empty with fraction 1; the repeated cycle is busy for one of every two seconds.'
          : 'Hollow dots sample N(t−), before the arriving job raises the count. Horizontal intervals represent time exposure.'
      }
    >
      <Plot
        description={
          synchronized
            ? 'Alternating one-second busy and idle intervals; every arrival sees zero jobs.'
            : 'Arrivals at 0,1,2 see pre-arrival populations0,1,1.'
        }
        xDomain={[0, horizon]}
        yDomain={[0, 3]}
        xLabel="time (s)"
        yLabel="N(t), jobs"
        yTicks={[0, 1, 2, 3]}
      >
        {({ x, y, scale }) => (
          <>
            {state.segments.map((s, i) => (
              <g key={i}>
                <rect
                  x={x(s.start)}
                  y={y(s.count)}
                  width={x(s.end) - x(s.start)}
                  height={y(0) - y(s.count)}
                  fill={ink.amber}
                  opacity=".15"
                />
                <line
                  x1={x(s.start)}
                  x2={x(s.end)}
                  y1={y(s.count)}
                  y2={y(s.count)}
                  stroke={ink.amber}
                  strokeWidth="2.5"
                />
                {i > 0 && (
                  <line
                    x1={x(s.start)}
                    x2={x(s.start)}
                    y1={y(state.segments[i - 1].count)}
                    y2={y(s.count)}
                    stroke={ink.amber}
                  />
                )}
              </g>
            ))}
            {state.trace.map((j) => {
              const before = state.trace.filter(
                (k) => k.arrival < j.arrival && k.departure >= j.arrival,
              ).length;
              return (
                <circle
                  key={j.id}
                  cx={x(j.arrival)}
                  cy={y(before)}
                  r={5 * scale}
                  fill="#111"
                  stroke={jobInk[j.id]}
                  strokeWidth="2"
                />
              );
            })}
          </>
        )}
      </Plot>
      <Legend
        entries={state.trace.map((j) => [`${j.id} arrives at ${j.arrival} s`, jobInk[j.id], '○'])}
      />
      {synchronized && (
        <Table
          caption="One repeated two-second cycle"
          headers={['Interval', 'Worker', 'Duration']}
          rows={[
            ['[0,1)', 'busy', '1 s'],
            ['[1,2)', 'idle', '1 s'],
            ['just before 0', 'empty seen by arrival', 'one observation'],
          ]}
        />
      )}
    </Figure>
  );
}

function CohortExposure() {
  return (
    <Drawing
      description="A bracket includes all four jobs A,B,C,D. The complete observation window is seven seconds, while their residence areas sum to eleven job-seconds."
      height={170}
    >
      {({ width, scale }) => {
        const left = 32 * scale,
          right = width - 15 * scale,
          gap = (right - left) / 4;
        return (
          <>
            {['A', 'B', 'C', 'D'].map((job, i) => (
              <g key={job}>
                <circle
                  cx={left + (i + 0.5) * gap}
                  cy={28 * scale}
                  r={13 * scale}
                  fill="none"
                  stroke={jobInk[job]}
                />
                <text
                  x={left + (i + 0.5) * gap}
                  y={32 * scale}
                  textAnchor="middle"
                  fill={jobInk[job]}
                >
                  {job}
                </text>
              </g>
            ))}
            <path
              d={`M${left},${49 * scale}v${10 * scale}H${right}v${-10 * scale}`}
              fill="none"
              stroke={ink.pale}
            />
            <text x={width / 2} y={80 * scale} textAnchor="middle">
              4 jobs: one complete cohort
            </text>
            <path
              d={`M${left},${112 * scale}v${8 * scale}H${right}v${-8 * scale}`}
              fill="none"
              stroke={ink.pale}
            />
            <text x={left} y={108 * scale}>
              0 s
            </text>
            <text x={right} y={108 * scale} textAnchor="end">
              7 s
            </text>
            <text x={width / 2} y={147 * scale} textAnchor="middle">
              7 s observation exposure
            </text>
          </>
        );
      }}
    </Drawing>
  );
}

export function QueueingTimelineFigure({ id }) {
  const trace = fcfsTrace(queueExampleJobs);
  if (id === 'Q06' || id === 'Q07') return <AreaInvestigation comparison={id === 'Q07'} />;
  if (id === 'Q04') return <DurationOperation />;
  if (id === 'Q10' || id === 'Q11') return <SamplingTrace synchronized={id === 'Q11'} />;
  if (id === 'Q01')
    return (
      <Figure
        id={id}
        caption="System population = waiting jobs + the job in service. This drawing shows routes and boundaries, not elapsed time."
      >
        <div className="queue-topology">
          <span>arriving job</span>
          <span className="queue-arrow">→</span>
          <div className="queue-system">
            <span className="queue-system-label">System boundary</span>
            <div className="queue-waiting">
              <strong>Waiting boundary</strong>
              <Token label="1" />
              <Token label="2" />
              <Token label="3" />
            </div>
            <span className="queue-arrow">→</span>
            <Worker label="one worker" job="S" />
          </div>
          <span className="queue-arrow">→</span>
          <span>departure</span>
        </div>
      </Figure>
    );
  if (id === 'Q02')
    return (
      <Figure
        id={id}
        caption="B: arrival 1 → start 3 → departure 4. Its total 3 seconds comprises wait 2 and service 1. A starts immediately and has zero wait."
      >
        <JobLanes jobs={[trace[1], trace[0]]} max={7} totalBracket />
        <Legend
          entries={[
            ['B: 2 s hatched wait + 1 s service', jobInk.B],
            ['A: zero wait + 3 s service', jobInk.A],
          ]}
        />
      </Figure>
    );
  if (id === 'Q03' || id === 'Q34') {
    const changed = id === 'Q34';
    const rows = changed
      ? fcfsTrace(queueExampleJobs.map((j, i) => ({ ...j, service: [3, 2, 1, 1][i] })))
      : trace;
    return (
      <Figure
        id={id}
        caption={
          changed
            ? 'B and C have changed demands: 2 s and 1 s. Request → grant/start → timeout → release/departure align with these exact endpoints.'
            : 'W is the worker lane. Only one job occupies it at a time; [7,8) is idle. A and D have zero waits.'
        }
      >
        <JobLanes jobs={rows} worker />
        <Table
          caption={
            changed ? 'Resource event endpoints, seconds' : 'FCFS maximum and durations, seconds'
          }
          headers={[
            'Job',
            changed ? 'request' : 'start candidates',
            'start',
            'departure',
            'wait',
            'total',
          ]}
          rows={rows.map((j, i) => [
            j.id,
            changed ? j.arrival : `max(${j.arrival}, ${i ? rows[i - 1].departure : 0})`,
            j.start,
            j.departure,
            j.wait,
            j.total,
          ])}
        />
        {changed && (
          <p>
            Residence sum 12 job·s; mean wait 1.25 s; mean total 3 s. Through H=4 s, clipped area 8
            job·s.
          </p>
        )}
      </Figure>
    );
  }
  if (id === 'Q05')
    return (
      <Figure
        id={id}
        caption="At t=2.5 s three lanes overlap. At 6 s C leaves as D arrives: the count remains 1 while job identity changes."
      >
        <JobLanes />
        <Occupancy state={occupancyWindow(queueExampleJobs, 7)} selected="C" guide={2.5} />
        <p>
          By jobs: 3 + 3 + 4 + 1 = 11 job·s.
          <br />
          By slabs: 1 + 2 + 3 + 2 + 2 + 1 = 11 job·s.
        </p>
      </Figure>
    );
  if (id === 'Q08') {
    const jobs = [
      { id: 'A', arrival: 0, departure: 3 },
      { id: 'B', arrival: 1, departure: 5 },
      { id: 'C', arrival: 4, departure: 7 },
      { id: 'D', arrival: 6, departure: 8 },
    ];
    const segments = [
      { start: 2, end: 3, occupants: ['A', 'B'] },
      { start: 3, end: 4, occupants: ['B'] },
      { start: 4, end: 5, occupants: ['B', 'C'] },
      { start: 5, end: 6, occupants: ['C'] },
    ];
    return (
      <Figure
        id={id}
        caption="These are complete residence intervals; service starts are unspecified. Faint outlined lanes show residence, with dashed outlines inside the window. Only [2,6) contributes; crosshatching marks excluded time. Full departed A/B residences wrongly include earlier time and omit C's observed time."
      >
        <JobLanes jobs={jobs} horizon={6} windowStart={2} residenceOnly />
        <Occupancy state={{ boundary: 'window', horizon: 6, clippedArea: 6, segments }} />
        <Table
          caption="Two different accounting rules"
          headers={['Rule', 'Contributions (s)', 'Area (job·s)']}
          rows={[
            ['clip every residence', 'A1 + B3 + C2 + D0', 6],
            ['full departed residences', 'A3 + B4', 7],
          ]}
        />
      </Figure>
    );
  }
  if (id === 'Q09')
    return (
      <Figure
        id={id}
        caption="The same complete cohort contributes both occurrences of 4 jobs. This is finite accounting before taking any long-run limit."
      >
        <JobLanes max={7} />
        <CohortExposure />
        <div className="queue-equation">
          <span style={{ color: ink.amber }}>4 jobs / 7 s</span> ×{' '}
          <span style={{ color: ink.cyan }}>11 job·s / 4 jobs</span> = 11/7 jobs
        </div>
        <p>Complete-cohort flow × mean residence = mean occupancy.</p>
      </Figure>
    );
  throw new Error(`Unknown queue timeline figure ${id}`);
}
