import { useEffect, useId, useRef, useState } from 'react';
import {
  FlowLab,
  FlowControls,
  FlowSlider,
  FlowChoice,
  FlowReadout,
  flowNumber,
} from './LessonFlow.jsx';
import {
  MIX_COLORS as C,
  tokenShares,
  powerShares,
  quotas,
  pacing,
  orderPath,
  sampleRecords,
  updateWeights,
  dot,
  responseValue,
} from '../../data/curriculum-mixing-models.js';
import study from '../../data/curriculum-mixing-recorded-study.json';
import './curriculum-mixing-flow.css';

const n = (value, digits = 4) => flowNumber(value, digits);
const pct = (value) => `${n(value * 100, 2)}%`;
const domains = ['Web', 'Code', 'Math'];
function Figure({ name, label, caption, children }) {
  return (
    <figure className="mix-figure" data-mixing-figure={name} aria-label={label}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
function Scroll({ label, children }) {
  return (
    <div className="mix-scroll" role="region" tabIndex={0} aria-label={label}>
      {children}
    </div>
  );
}
function Cells({ count, color = C[0], prefix = '', start = 1 }) {
  return (
    <div className="mix-cells">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="mix-cell" style={{ color }}>
          {prefix}
          {start + i}
        </span>
      ))}
    </div>
  );
}
function Legend({ items }) {
  return (
    <div className="mix-legend">
      {items.map(([color, text]) => (
        <span key={text} style={{ color }}>
          <i />
          {text}
        </span>
      ))}
    </div>
  );
}
function Ribbon({ shares, labels = domains }) {
  return (
    <>
      <div
        className="mix-ribbon"
        role="img"
        aria-label={shares.map((v, i) => `${labels[i]} ${pct(v)}`).join(', ')}
      >
        {shares.map((v, i) => (
          <span key={i} style={{ width: `${v * 100}%`, background: C[i] }} />
        ))}
      </div>
      <Legend items={shares.map((v, i) => [C[i], `${labels[i]} ${pct(v)}`])} />
    </>
  );
}
function Table({ caption, headers, rows }) {
  return (
    <Scroll label={caption}>
      <table className="mix-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {v}
                  </th>
                ) : (
                  <td key={j}>{v}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
function Matrix({ values, columns = 3, color = C[1], frozen = false, label }) {
  return (
    <div>
      <span className="mix-stage-label">{label}</span>
      <div
        className={`mix-matrix ${frozen ? 'is-frozen' : ''}`}
        style={{ gridTemplateColumns: `repeat(${columns},2.2rem)` }}
      >
        {values.map((v, i) => (
          <span
            key={i}
            style={{
              color,
              background: `color-mix(in srgb, ${color} ${12 + Math.min(Math.abs(v), 2) * 12}%, transparent)`,
            }}
          >
            {n(v, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}
function Arrow({ children }) {
  return (
    <span className="mix-connector">
      ↓ <small>{children}</small>
    </span>
  );
}
function Reset({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Reset example
    </button>
  );
}
function Plot({
  name,
  xRange = [-2, 2],
  yRange = [-2, 2],
  xLabel = 'parameter 1',
  yLabel = 'parameter 2',
  children,
  height = 300,
  equalAspect = false,
  xTicks,
}) {
  const frame = useRef(null),
    [size, setSize] = useState({ width: 384, factor: 1 });
  useEffect(() => {
    const update = () => {
      const width = frame.current?.clientWidth;
      if (width > 0)
        setSize({
          width,
          factor: parseFloat(getComputedStyle(document.documentElement).fontSize) / 16,
        });
    };
    const resize = new ResizeObserver(update);
    resize.observe(frame.current);
    const style = new MutationObserver(update);
    style.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    update();
    return () => {
      resize.disconnect();
      style.disconnect();
    };
  }, []);
  const { width, factor } = size,
    left = 55 * factor,
    right = width - 25 * factor,
    h = equalAspect
      ? ((right - left) * (yRange[1] - yRange[0])) / (xRange[1] - xRange[0]) + 47 * factor
      : height * factor,
    bottom = h - 35 * factor;
  const sx = (x) => left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (right - left);
  const sy = (y) => bottom - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (bottom - 12 * factor);
  const ticks = (range) => [
    range[0],
    range[0] < 0 && range[1] > 0 ? 0 : (range[0] + range[1]) / 2,
    range[1],
  ];
  const precision = (range) => (range[1] - range[0] < 0.2 ? 3 : 2);
  const id = useId().replace(/:/g, '');
  return (
    <div ref={frame} className="mix-responsive-plot">
      <span className="mix-stage-label">{yLabel}</span>
      <svg
        className="mix-plot"
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={name}
        style={{ '--mix-svg-font': `${15 * factor}px` }}
      >
        <defs>
          <marker
            id={id}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill="context-stroke" />
          </marker>
        </defs>
        <path d={`M${left} ${12 * factor}V${bottom}H${right}`} fill="none" stroke="#777" />
        {ticks(yRange).map((v) => (
          <g key={v}>
            <line x1={left} x2={right} y1={sy(v)} y2={sy(v)} stroke="#333" />
            <text x={left - 8 * factor} y={sy(v) + 5 * factor} textAnchor="end">
              {n(v, precision(yRange))}
            </text>
          </g>
        ))}
        {(xTicks || ticks(xRange)).map((v) => (
          <text key={v} x={sx(v)} y={bottom + 24 * factor} textAnchor="middle">
            {n(v, precision(xRange))}
          </text>
        ))}
        {xRange[0] < 0 && xRange[1] > 0 && (
          <line
            x1={sx(0)}
            x2={sx(0)}
            y1={12 * factor}
            y2={bottom}
            stroke="#555"
            strokeDasharray="3 4"
          />
        )}
        {children({ sx, sy, arrow: `url(#${id})` })}
      </svg>
      <p className="mix-axis-label">{xLabel}</p>
    </div>
  );
}

export function ShareLab() {
  const [a, setA] = useState(2),
    [b, setB] = useState(8),
    [p, setP] = useState(0.5);
  const shares = tokenShares([p, 1 - p], [a, b]);
  return (
    <FlowLab label="Compare record counts with learning targets">
      <Figure
        name="shares"
        label="Two document lengths and their target counts"
        caption="Constructed batch: exactly one record from A and one from B. Below it, the probability calculation describes long-run exposure under repeated independent draws, not the expected ratio of a short random batch."
      >
        <div className="mix-grid">
          {[a, b].map((length, i) => (
            <div className="mix-sheet" key={i} style={{ color: C[i] }}>
              <b>
                Record {i ? 'B' : 'A'} · {length} targets
              </b>
              <Cells count={length} color={C[i]} prefix={i ? 'B' : 'A'} />
            </div>
          ))}
        </div>
        <span className="mix-stage-label">The actual two-record batch</span>
        <div className="mix-cells">
          <Cells count={a} prefix="A" />
          <Cells count={b} color={C[1]} prefix="B" />
        </div>
        <p>
          {a + b} targets: A {pct(a / (a + b))}, B {pct(b / (a + b))}.
        </p>
        <span className="mix-stage-label">Long-run target share from record probabilities</span>
        <Ribbon shares={shares} labels={['A', 'B']} />
      </Figure>
      <FlowControls>
        <FlowSlider name="A eligible targets" value={a} onChange={setA} min={1} max={8} step={1} />
        <FlowSlider name="B eligible targets" value={b} onChange={setB} min={1} max={8} step={1} />
        <FlowSlider
          name="Record probability p(A)"
          value={p}
          onChange={setP}
          min={0}
          max={1}
          step={0.1}
        />
        <Reset
          onClick={() => {
            setA(2);
            setB(8);
            setP(0.5);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Expected targets per draw: A {n(p * a)}, B {n((1 - p) * b)}. Equal target shares require
        p(A)={n(b / (a + b))}.{' '}
        {a === b ? 'With equal lengths, record and target shares agree.' : ''}
      </FlowReadout>
    </FlowLab>
  );
}

export function ExposureLab() {
  const [alpha, setAlpha] = useState(0.5),
    [budget, setBudget] = useState(100),
    [empty, setEmpty] = useState(false);
  const masses = [80, 15, empty ? 0 : 5],
    q = powerShares(masses, alpha),
    counts = quotas(q, budget);
  return (
    <FlowLab label="Allocate a fixed target budget">
      <Figure
        name="exposure"
        label="Available reservoirs, allocated draws and repeated exposure"
        caption="Constructed available targets. Coloured reservoir bars share a scale; allocation counts use the largest-remainder rule, not a random draw."
      >
        <div className="mix-bars">
          {masses.map((v, i) => (
            <div className="mix-bar" key={i}>
              <span style={{ color: C[i] }}>{domains[i]}</span>
              <div className="mix-track">
                <i style={{ width: `${(v / 80) * 100}%`, background: C[i] }} />
              </div>
              <output>{v}</output>
            </div>
          ))}
        </div>
        <Arrow>sample B={budget} learning targets</Arrow>
        <Ribbon shares={q} />
        <Table
          caption="Allocation and repetition"
          headers={['Source', 'Draws', 'Expected exposure / available target']}
          rows={masses.map((v, i) => [
            domains[i],
            counts[i],
            v ? n((budget * q[i]) / v) : 'No available targets',
          ])}
        />
      </Figure>
      <FlowControls>
        <FlowSlider name="Power α" value={alpha} onChange={setAlpha} min={0} max={1} step={0.1} />
        <FlowSlider
          name="Target budget B"
          value={budget}
          onChange={setBudget}
          min={0}
          max={200}
          step={10}
        />
        <FlowChoice
          label="Math reservoir"
          value={empty}
          onChange={setEmpty}
          options={[
            [false, '5 targets'],
            [true, 'Empty'],
          ]}
        />
        <Reset
          onClick={() => {
            setAlpha(0.5);
            setBudget(100);
            setEmpty(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Allocated counts sum to {counts.reduce((a, b) => a + b, 0)}.{' '}
        {alpha === 0
          ? 'Equal shares apply only to nonempty collections.'
          : 'Lower α increases the smaller collections’ shares.'}{' '}
        Repeated draws consume budget without creating new observations.
      </FlowReadout>
    </FlowLab>
  );
}

export function GradientMixLab() {
  const [q, setQ] = useState(0.5),
    [same, setSame] = useState(false);
  const a = [2, 0],
    b = same ? a : [0, 2],
    g = a.map((v, i) => q * v + (1 - q) * b[i]);
  return (
    <FlowLab label="See the mixture change an update direction">
      <Figure
        name="gradient-mixture"
        label="Two gradients and their weighted sum"
        caption="Constructed gradients share axes. Blue is A; amber is B; white is their weighted sum. Dashed rose shows a descent step of size .5 in the opposite direction."
      >
        <Plot equalAspect name="Weighted gradient geometry" xRange={[-1, 2.5]} yRange={[-1, 2.5]}>
          {({ sx, sy, arrow }) => (
            <>
              {[a, b, g, g.map((v) => -0.5 * v)].map((v, i) => (
                <line
                  key={i}
                  x1={sx(0)}
                  y1={sy(0)}
                  x2={sx(v[0])}
                  y2={sy(v[1])}
                  stroke={[C[0], C[1], '#fff', C[3]][i]}
                  strokeWidth={i === 2 ? 4 : 2}
                  strokeDasharray={i === 3 ? '5 4' : undefined}
                  markerEnd={arrow}
                />
              ))}
            </>
          )}
        </Plot>
        <Legend
          items={[
            [C[0], `gA = (${a})`],
            [C[1], `gB = (${b})`],
            ['#fff', `mixture = (${g.map((v) => n(v)).join(', ')})`],
            [C[3], '−.5 × mixture'],
          ]}
        />
      </Figure>
      <FlowControls>
        <FlowSlider name="A target share" value={q} onChange={setQ} min={0} max={1} step={0.05} />
        <FlowChoice
          label="Gradients"
          value={same}
          onChange={setSame}
          options={[
            [false, 'Different'],
            [true, 'Identical'],
          ]}
        />
        <Reset
          onClick={() => {
            setQ(0.5);
            setSame(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {same
          ? 'Changing the mixture cannot change this identical-gradient update.'
          : `Expected gradient is (${n(g[0])}, ${n(g[1])}).`}{' '}
        This shows one local update, not final generalization.
      </FlowReadout>
    </FlowLab>
  );
}

export function SamplerLab() {
  const [policy, setPolicy] = useState('wrap'),
    [count, setCount] = useState(6);
  const s = sampleRecords(policy, count);
  return (
    <FlowLab label="Compare finite-stream stopping policies">
      <Figure
        name="sampler"
        label="Finite source cursors and emitted record sequence"
        caption="A has two records with two targets each; B has four with eight each. A fixed displayed uniform stream chooses sources; this miniature does not reproduce Python or Hugging Face random sequences."
      >
        <div className="mix-grid">
          {[2, 4].map((size, d) => (
            <div key={d}>
              <span className="mix-stage-label" style={{ color: C[d] }}>
                Source {d ? 'B' : 'A'} · cursor {s.cursor[d]} · epoch {s.epoch[d]}
              </span>
              <Cells count={size} prefix={d ? 'B' : 'A'} start={0} color={C[d]} />
            </div>
          ))}
        </div>
        <Arrow>emit in order</Arrow>
        <div className="mix-cells">
          {s.records.map((r, i) => (
            <span
              className="mix-cell"
              key={i}
              style={{ color: C[r.domain] }}
              title={`draw ${i + 1}; u=${r.u}; epoch ${r.epoch}; ${r.targets} targets`}
            >
              {r.id}
              <sub>{r.epoch}</sub>
            </span>
          ))}
        </div>
        <Table
          caption="Actual emitted counts"
          headers={['Source', 'Records', 'Targets']}
          rows={[0, 1].map((d) => [
            d ? 'B' : 'A',
            s.records.filter((r) => r.domain === d).length,
            s.targets[d],
          ])}
        />
      </Figure>
      <FlowControls>
        <FlowChoice
          label="Stop policy"
          value={policy}
          onChange={setPolicy}
          options={[
            ['wrap', 'Wrap'],
            ['first_exhausted', 'First exhausted'],
            ['once', 'Once each'],
          ]}
        />
        <FlowSlider
          name="Requested draws"
          value={count}
          onChange={setCount}
          min={1}
          max={12}
          step={1}
        />
        <Reset
          onClick={() => {
            setPolicy('wrap');
            setCount(6);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Emitted {s.records.length} of {count} requested records.{' '}
        {policy === 'once'
          ? 'Exhausted sources leave the active set; final once-only counts are determined by available records.'
          : policy === 'first_exhausted'
            ? 'Stop when the next selected source has no record left.'
            : 'An exhausted source starts another epoch when selected.'}{' '}
        Subscripts identify epochs.
      </FlowReadout>
    </FlowLab>
  );
}

export function CheckpointFigure() {
  return (
    <Figure
      name="checkpoint"
      label="Two worker streams and state needed to resume"
      caption="A distributed-state anatomy, not an implemented distributed sampler. The complete Python example implements one worker and proves its saved suffix matches uninterrupted execution."
    >
      <div className="mix-grid">
        {[0, 1].map((i) => (
          <div key={i}>
            <b style={{ color: C[i] }}>Worker {i}</b>
            <div className="mix-timeline">
              <div className="mix-time-point">
                Shard {i} · record cursor {i + 2}
              </div>
              <div className="mix-time-point">
                <Cells count={i + 2} color={C[i]} prefix="t" />
              </div>
              <div className="mix-time-point">Partial packed sequence ↑</div>
            </div>
            <Table
              caption={`Worker ${i} checkpoint`}
              headers={['State', 'Value needed']}
              rows={[
                ['Random generator', 'Next source/record choice'],
                ['Order + cursor + epoch', 'Next record identity'],
                ['Packing buffer', 'Unconsumed target positions'],
              ]}
            />
          </div>
        ))}
      </div>
      <Arrow>merge workers’ emitted batches</Arrow>
      <div className="mix-cells">
        <Cells count={2} prefix="A" />
        <Cells count={3} prefix="B" color={C[1]} />
      </div>
      <p>
        Count included targets after packing and masking. Saving only mixture probabilities cannot
        reconstruct this state.
      </p>
    </Figure>
  );
}

export function PacingLab() {
  const [time, setTime] = useState(0.25),
    [ramp, setRamp] = useState(1),
    [mode, setMode] = useState('easy'),
    [noisy, setNoisy] = useState(4);
  const scores = [1, 2, 3, noisy],
    weights = pacing(scores, time, ramp, mode === 'hard', mode === 'all');
  return (
    <FlowLab label="Separate difficulty ranking from pacing">
      <Figure
        name="pacing"
        label="Ranked examples and a time-by-example exposure mask"
        caption="Constructed scores: the fourth record is labelled noisy, independently of its score. Numbers give sampling weights; faded cell borders mark exclusion. A high loss can mean noise rather than a useful challenge."
      >
        <div className="mix-grid">
          <div>
            <span className="mix-stage-label">Current admitted examples</span>
            {scores.map((s, i) => (
              <div key={i} className="mix-sheet" style={{ color: C[i] }}>
                <b>
                  Example {i + 1}
                  {i === 3 ? ' (noisy)' : ''} · difficulty {s}
                </b>
                <span>{weights[i] ? `admitted, weight ${n(weights[i])}` : 'not yet admitted'}</span>
              </div>
            ))}
          </div>
          <Table
            caption="Rows are examples; columns are training progress"
            headers={['Item', '0%', '33%', '67%', '100%']}
            rows={scores.map((s, i) => [
              `E${i + 1}`,
              ...[0, 1 / 3, 2 / 3, 1].map((t) => (
                <span
                  key={t}
                  className="mix-cell"
                  style={{
                    color: C[i],
                    borderColor: pacing(scores, t, ramp, mode === 'hard', mode === 'all')[i]
                      ? C[i]
                      : '#444',
                    background: pacing(scores, t, ramp, mode === 'hard', mode === 'all')[i]
                      ? undefined
                      : 'transparent',
                  }}
                >
                  {n(pacing(scores, t, ramp, mode === 'hard', mode === 'all')[i], 2)}
                </span>
              )),
            ])}
          />
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Noisy record difficulty"
          value={noisy}
          onChange={setNoisy}
          min={0}
          max={5}
          step={1}
        />
        <FlowSlider name="Progress" value={time} onChange={setTime} min={0} max={1} step={0.05} />
        <FlowSlider
          name="Full-support ramp fraction"
          value={ramp}
          onChange={setRamp}
          min={0.25}
          max={1}
          step={0.25}
        />
        <FlowChoice
          label="Admission order"
          value={mode}
          onChange={setMode}
          options={[
            ['easy', 'Easy first'],
            ['hard', 'Hard first'],
            ['all', 'All from start'],
          ]}
        />
        <Reset
          onClick={() => {
            setTime(0.25);
            setRamp(1);
            setMode('easy');
            setNoisy(4);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {weights.filter((v) => v > 0).length} of four examples admitted. Their probabilities sum to
        1. Ranking says which; pacing says when. The full-support comparison removes curriculum
        gating.
      </FlowReadout>
    </FlowLab>
  );
}

export function OrderLab() {
  const [rate, setRate] = useState(0.5),
    [same, setSame] = useState(false);
  const centers = [1, same ? 1 : -1],
    paths = [orderPath(centers, rate), orderPath([...centers].reverse(), rate)];
  return (
    <FlowLab label="Change order while holding examples fixed">
      <Figure
        name="order"
        label="Quadratic loss bowls and two update paths"
        caption="Constructed scalar losses .5(θ−center)². The two paths start at zero and use the same two objectives and learning rate. Below the loss curves, both paths share parameter and update-count axes; the table gives their exact coordinates."
      >
        <Plot
          name="Order-dependent quadratic descent"
          xRange={[-1.5, 1.5]}
          yRange={[0, 3.5]}
          xLabel="parameter θ"
          yLabel="loss"
        >
          {({ sx, sy }) => (
            <>
              {centers.map((c, i) => (
                <path
                  key={i}
                  d={Array.from({ length: 61 }, (_, j) => {
                    const x = -1.5 + j * 0.05;
                    return `${j ? 'L' : 'M'}${sx(x)},${sy(0.5 * (x - c) ** 2)}`;
                  }).join(' ')}
                  fill="none"
                  stroke={C[i]}
                  strokeWidth="2"
                />
              ))}
            </>
          )}
        </Plot>
        <Plot
          name="The two parameter paths after each update"
          xRange={[-1.5, 1.5]}
          yRange={[0, 2]}
          xLabel="parameter θ"
          yLabel="completed updates"
          height={220}
        >
          {({ sx, sy, arrow }) =>
            paths.map((path, i) => (
              <g key={i}>
                {path.slice(1).map((v, j) => (
                  <line
                    key={j}
                    x1={sx(path[j])}
                    x2={sx(v)}
                    y1={sy(j)}
                    y2={sy(j + 1)}
                    stroke={C[i]}
                    strokeWidth={i ? 2 : 4}
                    strokeDasharray={i ? '5 3' : undefined}
                    markerEnd={arrow}
                  />
                ))}
                {path.map((v, j) => (
                  <circle key={j} cx={sx(v)} cy={sy(j)} r={i ? 3 : 5} fill={C[i]} />
                ))}
              </g>
            ))
          }
        </Plot>
        <Legend
          items={[
            [C[0], 'A then B · solid'],
            [C[1], 'B then A · dashed'],
          ]}
        />
        <Table
          caption="Exact parameter after each update"
          headers={['Path', 'Start', 'Update 1', 'Update 2']}
          rows={paths.map((p, i) => [i ? 'B then A' : 'A then B', ...p.map((v) => n(v))])}
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Learning rate η"
          value={rate}
          onChange={setRate}
          min={0}
          max={1}
          step={0.1}
        />
        <FlowChoice
          label="Objectives"
          value={same}
          onChange={setSame}
          options={[
            [false, 'Different centers'],
            [true, 'Identical centers'],
          ]}
        />
        <Reset
          onClick={() => {
            setRate(0.5);
            setSame(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Endpoints: {n(paths[0].at(-1))} and {n(paths[1].at(-1))}.{' '}
        {rate === 0 || same
          ? 'They agree in this null case.'
          : 'Order changed the parameter at which the second gradient was evaluated.'}
      </FlowReadout>
    </FlowLab>
  );
}

export function ScheduleLab() {
  const [replay, setReplay] = useState(0.2),
    [cooldown, setCooldown] = useState(0.4);
  return (
    <FlowLab label="Separate mixture changes from step-size changes">
      <Figure
        name="schedule"
        label="Target mixture area and learning rate on the same training timeline"
        caption="Constructed schedule: A is used alone for the first half, then replay share A is retained while B enters. A separate linear cooldown changes step size; the two vertical units must not be conflated."
      >
        <Plot
          name="Source shares over training progress"
          xRange={[0, 1]}
          yRange={[0, 1]}
          xLabel="training progress"
          yLabel="target share"
        >
          {({ sx, sy }) => (
            <>
              <path
                d={`M${sx(0)} ${sy(0)}V${sy(1)}H${sx(0.5)}V${sy(replay)}H${sx(1)}V${sy(0)}Z`}
                fill={C[0]}
                fillOpacity=".65"
              />
              <path
                d={`M${sx(0.5)} ${sy(replay)}V${sy(1)}H${sx(1)}V${sy(replay)}Z`}
                fill={C[1]}
                fillOpacity=".65"
              />
            </>
          )}
        </Plot>
        <Plot
          name="Learning-rate cooldown over the same progress"
          xRange={[0, 1]}
          yRange={[0, 1]}
          xLabel="training progress"
          yLabel="relative learning rate"
        >
          {({ sx, sy }) => (
            <path
              d={`M${sx(0)} ${sy(1)}H${sx(1 - cooldown)}L${sx(1)} ${sy(cooldown === 0 ? 1 : 0)}`}
              fill="none"
              stroke={C[2]}
              strokeWidth="3"
            />
          )}
        </Plot>
        <Legend
          items={[
            [C[0], 'A replay'],
            [C[1], 'B new targets'],
            [C[2], 'learning rate'],
          ]}
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="A replay share after midpoint"
          value={replay}
          onChange={setReplay}
          min={0}
          max={1}
          step={0.1}
        />
        <FlowSlider
          name="Cooldown fraction"
          value={cooldown}
          onChange={setCooldown}
          min={0}
          max={1}
          step={0.1}
        />
        <Reset
          onClick={() => {
            setReplay(0.2);
            setCooldown(0.4);
          }}
        />
      </FlowControls>
      <FlowReadout>
        After the midpoint, A/B shares are {pct(replay)}/{pct(1 - replay)}. Cooldown changes update
        magnitude; replay changes the objective. Neither alone guarantees retained capability.
      </FlowReadout>
    </FlowLab>
  );
}

export function ExcessLab() {
  const [first, setFirst] = useState(1.8),
    [second, setSecond] = useState(0.6);
  const proxy = [first, second],
    gaps = proxy.map((v) => v - 1),
    clipped = gaps.map((v) => Math.max(v, 0)),
    mean = clipped.reduce((a, b) => a + b, 0) / 2;
  return (
    <FlowLab label="Clip token gaps before reducing the domain signal">
      <Figure
        name="excess"
        label="Two token rows through subtraction, clipping and averaging"
        caption="Same observed tokens and loss units for proxy and frozen reference. Negative gaps contribute zero to this weight signal; this clipping does not define the proxy training loss."
      >
        <Table
          caption="Per-token excess in nats"
          headers={['Token', 'Proxy', 'Reference', 'Gap', 'Positive part']}
          rows={proxy.map((v, i) => [
            <span style={{ color: C[i] }}>t{i + 1}</span>,
            n(v),
            1,
            n(gaps[i]),
            n(clipped[i]),
          ])}
        />
        <div className="mix-grid">
          <div>
            <Arrow>clip each, then mean</Arrow>
            <strong>{n(mean)}</strong>
          </div>
          <div>
            <Arrow>mean, then clip (different)</Arrow>
            <strong>{n(Math.max((gaps[0] + gaps[1]) / 2, 0))}</strong>
          </div>
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Proxy NLL at t1"
          value={first}
          onChange={setFirst}
          min={0}
          max={3}
          step={0.1}
        />
        <FlowSlider
          name="Proxy NLL at t2"
          value={second}
          onChange={setSecond}
          min={0}
          max={3}
          step={0.1}
        />
        <button
          type="button"
          onClick={() => {
            setFirst(1);
            setSecond(1);
          }}
        >
          Equal to reference
        </button>
        <Reset
          onClick={() => {
            setFirst(1.8);
            setSecond(0.6);
          }}
        />
      </FlowControls>
      <FlowReadout>
        The clipped-token mean is {n(mean)} nats.{' '}
        {mean === 0
          ? 'Neither token exceeds its reference loss.'
          : 'Positive gaps cannot be cancelled by easier-than-reference tokens.'}{' '}
        Proxy parameter descent still uses ordinary NLL.
      </FlowReadout>
    </FlowLab>
  );
}

export function ReferenceFigure() {
  return (
    <Figure
      name="reference"
      label="Raw loss versus room above a reference"
      caption="Constructed domain means, constant over the displayed tokens. A noisy domain can have high proxy loss and little positive excess; the reference is an attainable comparison model, not known entropy."
    >
      <div className="mix-grid">
        {[
          { name: 'Predictable domain', proxy: 3, ref: 2 },
          { name: 'Noisy domain', proxy: 5.1, ref: 5 },
        ].map((d, i) => (
          <div key={d.name}>
            <b style={{ color: C[i] }}>{d.name}</b>
            <div className="mix-bars">
              {[
                ['Proxy', d.proxy],
                ['Reference', d.ref],
                ['Positive gap', d.proxy - d.ref],
              ].map(([label, v]) => (
                <div className="mix-bar" key={label}>
                  <span>{label}</span>
                  <div className="mix-track">
                    <i
                      style={{
                        width: `${(v / 5.1) * 100}%`,
                        background: C[i],
                        opacity: label === 'Reference' ? 0.5 : 1,
                      }}
                    />
                  </div>
                  <output>{n(v)}</output>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p>
        Raw loss favors the noisy domain (5.1 vs 3); positive gap favors the predictable one (1 vs
        .1).
      </p>
    </Figure>
  );
}

export function DoReMiFigure() {
  const history = study.proxy_runs[0].proxy.history;
  const average = study.main_runs.find((r) => r.seed === 17 && r.arm === 'doremi').shares;
  return (
    <Figure
      name="doremi-anatomy"
      label="Reference, adaptive proxy and fresh target model"
      caption="The small parameter matrices are constructed anatomy. The lower weight trace is the recorded seed-17 literary experiment; book colours identify Alice, Time Machine and Great Expectations. Only mixture weights transfer to the fresh main run."
    >
      <div className="mix-grid">
        <div>
          <b>1 · Train reference, then freeze</b>
          <Arrow>starting mixture → ordinary loss</Arrow>
          <Matrix
            label="Reference parameters · frozen"
            frozen
            values={[0.2, -0.3, 0.4, 0.1, 0.5, -0.2]}
            color="#b7b7b7"
          />
          <p>Its loss on the proxy's exact targets supplies the baseline.</p>
        </div>
        <div>
          <b>2 · Train proxy and adapt q</b>
          <Arrow>equal batch per domain</Arrow>
          <Matrix label="Proxy parameters · updated" values={[0.1, -0.2, 0.3, 0.2, 0.4, -0.1]} />
          <p>Clipped excess → q update</p>
          <Arrow>ordinary q-weighted NLL gradient</Arrow>
          <Matrix label="Next proxy parameters" values={[0.12, -0.22, 0.32, 0.18, 0.44, -0.13]} />
        </div>
        <div>
          <b>3 · Train a fresh main model</b>
          <Arrow>average q over all proxy steps</Arrow>
          <Ribbon shares={average} labels={['Alice', 'Time Machine', 'Great Expectations']} />
          <Matrix label="Fresh zero initialization" values={[0, 0, 0, 0, 0, 0]} />
          <p>Sample by mean q. Use ordinary unweighted target loss.</p>
        </div>
      </div>
      <Plot
        name="Recorded proxy-weight trajectory"
        xRange={[0, 120]}
        yRange={[0, 1]}
        xLabel="proxy step"
        yLabel="current domain weight"
      >
        {({ sx, sy }) =>
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={history
                .map((row, j) => `${j ? 'L' : 'M'}${sx(row.step)},${sy(row.q[i])}`)
                .join(' ')}
              fill="none"
              stroke={C[i]}
              strokeWidth="2.5"
            />
          ))
        }
      </Plot>
      <p>
        Recorded checkpoints are joined for readability. The main mixture averages every update, not
        merely these plotted checkpoints or the last weight.
      </p>
    </Figure>
  );
}

export function WeightLab() {
  const [q, setQ] = useState(0.5),
    [signal, setSignal] = useState(Math.log(2)),
    [smooth, setSmooth] = useState(0.1);
  const before = [q, 1 - q],
    signals = [signal, 0],
    raw = before.map((v, i) => v * Math.exp(signals[i])),
    after = updateWeights(before, signals, 1, smooth);
  return (
    <FlowLab label="Follow multiplicative ascent and uniform smoothing">
      <Figure
        name="weights"
        label="Domain weights before multiplication, normalization and smoothing"
        caption="Constructed two-domain update with η=1. Signals control weight ascent; the resulting q multiplies ordinary domain-loss gradients for the stratified proxy step."
      >
        <Table
          caption="One exact weight update"
          headers={['Domain', 'Old q', '× exp(signal)', 'Raw mass', 'New q']}
          rows={[0, 1].map((i) => [
            <span style={{ color: C[i] }}>{i ? 'B' : 'A'}</span>,
            n(before[i]),
            n(Math.exp(signals[i])),
            n(raw[i]),
            n(after[i]),
          ])}
        />
        <Ribbon shares={after} labels={['A', 'B']} />
        <Arrow>qA × gradient A + qB × gradient B</Arrow>
        <p>
          With gradients (2,0) and (0,2), the weighted gradient is ({n(2 * after[0])},{' '}
          {n(2 * after[1])}).
        </p>
      </Figure>
      <FlowControls>
        <FlowSlider name="Old q(A)" value={q} onChange={setQ} min={0} max={1} step={0.1} />
        <FlowSlider
          name="A excess signal"
          value={signal}
          onChange={setSignal}
          min={0}
          max={2}
          step={0.01}
        />
        <FlowSlider
          name="Uniform smoothing c"
          value={smooth}
          onChange={setSmooth}
          min={0}
          max={1}
          step={0.1}
        />
        <Reset
          onClick={() => {
            setQ(0.5);
            setSignal(Math.log(2));
            setSmooth(0.1);
          }}
        />
      </FlowControls>
      <FlowReadout>
        New weights sum to {n(after[0] + after[1])}; each has floor c/2={n(smooth / 2)}.{' '}
        {signal === 0
          ? smooth === 0
            ? 'Equal signals preserve the old weights.'
            : 'Equal signals still pull a nonuniform mixture toward .5/.5.'
          : 'The larger excess receives an exponential boost before smoothing.'}
      </FlowReadout>
    </FlowLab>
  );
}

export function AlignmentLab() {
  const [angle, setAngle] = useState(45),
    [magnitude, setMagnitude] = useState(Math.sqrt(2)),
    [rate, setRate] = useState(0.1);
  const radians = (angle * Math.PI) / 180,
    validation = [magnitude * Math.cos(radians), magnitude * Math.sin(radians)],
    gradients = [
      [1, 0],
      [-1, 1],
    ],
    scores = gradients.map((g) => dot(g, validation));
  const mixed = [0, 0.5],
    predicted = -rate * dot(mixed, validation),
    actual = predicted + 0.5 * rate * rate * dot(mixed, mixed);
  return (
    <FlowLab label="Inspect alignment and the local approximation">
      <Figure
        name="alignment"
        label="Training gradients and a tuning gradient in one plane"
        caption="Constructed gradients. The tuning objective is the quadratic Lv(θ)=.5‖θ+gv‖² at θ=0, so its gradient is gv. White is the equal-mixture gradient; rose is the tuning gradient."
      >
        <Plot
          equalAspect
          name="Gradient dot-product geometry"
          xRange={[-2.2, 2.2]}
          yRange={[-2.2, 2.2]}
        >
          {({ sx, sy, arrow }) =>
            [...gradients, validation, mixed].map((v, i) => (
              <line
                key={i}
                x1={sx(0)}
                y1={sy(0)}
                x2={sx(v[0])}
                y2={sy(v[1])}
                stroke={[C[0], C[1], C[3], '#fff'][i]}
                strokeWidth={i === 3 ? 4 : 2.5}
                markerEnd={arrow}
              />
            ))
          }
        </Plot>
        <Legend
          items={[
            [C[0], 'gA=(1,0)'],
            [C[1], 'gB=(−1,1)'],
            [C[3], `gv=(${validation.map((v) => n(v, 3)).join(', ')})`],
            ['#fff', 'equal mixture=(0,.5)'],
          ]}
        />
        <Table
          caption="Same gradient, two loss-change calculations"
          headers={['Quantity', 'Value']}
          rows={[
            ['gA · gv', n(scores[0])],
            ['gB · gv', n(scores[1])],
            ['First-order ΔLv', n(predicted)],
            ['Exact quadratic ΔLv', n(actual)],
          ]}
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Tuning-gradient angle (degrees)"
          value={angle}
          onChange={setAngle}
          min={-180}
          max={180}
          step={15}
        />
        <FlowSlider
          name="Tuning-gradient magnitude"
          value={magnitude}
          onChange={setMagnitude}
          min={0}
          max={2}
          step={0.1}
        />
        <FlowSlider
          name="Model step size γ"
          value={rate}
          onChange={setRate}
          min={0}
          max={2}
          step={0.1}
        />
        <Reset
          onClick={() => {
            setAngle(45);
            setMagnitude(Math.sqrt(2));
            setRate(0.1);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Curvature adds {n(actual - predicted)} beyond the linear estimate. A positive dot product
        predicts decrease only locally; a large step can reverse it. Magnitude zero removes the
        first-order signal, while a nonzero step can still increase this quadratic.
      </FlowReadout>
    </FlowLab>
  );
}

export function SplitFigure() {
  return (
    <Figure
      name="split"
      label="Training, tuning and final-test information boundaries"
      caption="Each book is split by paragraph before creating next-byte pairs. Parameter updates and mixture selection have separate feedback paths; final-test values do not feed either choice."
    >
      <div className="mix-grid">
        {[
          ['Train', 72, C[0]],
          ['Tune', 12, C[1]],
          ['Final test', 12, C[2]],
        ].map(([label, count, color]) => (
          <div key={label} style={{ color }}>
            <b>
              {label} · {count} paragraphs/book
            </b>
            <div className="mix-sheet">
              <Cells count={label === 'Train' ? 6 : 3} color={color} prefix="¶" />
            </div>
            <span>
              {label === 'Train'
                ? 'targets → parameter gradient'
                : label === 'Tune'
                  ? 'loss or gradient → mixture choice'
                  : 'selected procedure → final assessment'}
            </span>
          </div>
        ))}
      </div>
      <div className="mix-timeline">
        <div className="mix-time-point" style={{ color: C[0] }}>
          Train θ under candidate q
        </div>
        <div className="mix-time-point" style={{ color: C[1] }}>
          Tune q, then lock the chosen procedure
        </div>
        <div className="mix-time-point" style={{ color: C[2] }}>
          Score final test once choices are fixed
        </div>
      </div>
    </Figure>
  );
}

const bookNames = ['Alice', 'Time Machine', 'Great Expectations'];
function Triangle({ point, children }) {
  const position = (r) => [192 * r[0] + 48 * r[1] + 336 * r[2], 45 * r[0] + 245 * (r[1] + r[2])];
  const [x, y] = position(point);
  return (
    <div>
      <p className="mix-axis-label" style={{ color: C[0] }}>
        Top: Alice = 1
      </p>
      <Scroll label="Three-source mixture simplex">
        <svg
          className="mix-plot"
          viewBox="0 0 384 300"
          role="img"
          aria-label={`Mixture triangle: ${bookNames.map((b, i) => `${b} ${pct(point[i])}`).join(', ')}`}
        >
          <path d="M192 45L48 245H336Z" fill="#202020" stroke="#777" />
          {[0.25, 0.5, 0.75].map((t) => (
            <path
              key={t}
              d={`M${position([t, 1 - t, 0]).join(' ')}L${position([t, 0, 1 - t]).join(' ')}`}
              stroke="#444"
            />
          ))}
          {children?.(position)}
          <circle cx={x} cy={y} r="7" fill="none" stroke="#fff" strokeWidth="3" />
        </svg>
      </Scroll>
      <Legend
        items={[
          [C[1], 'Bottom left: Time = 1'],
          [C[2], 'Bottom right: Great = 1'],
        ]}
      />
    </div>
  );
}

export function ResponseLab() {
  const [a, setA] = useState(0.3),
    [fraction, setFraction] = useState(0),
    [domain, setDomain] = useState(0);
  const r = [a, (1 - a) * fraction, (1 - a) * (1 - fraction)],
    coeff = study.fit.models[domain].library_parameters;
  const observed = study.response_observations.tuning_nll.map((row) => row[domain]),
    predicted = study.response_observations.mixtures.map((m) => responseValue(m, coeff));
  const lower = Math.floor(Math.min(...observed, ...predicted) * 100) / 100 - 0.01,
    upper = Math.ceil(Math.max(...observed, ...predicted) * 100) / 100 + 0.01;
  return (
    <FlowLab label="Inspect a fitted response on the mixture simplex">
      <Figure
        name="response"
        label="Measured mixtures, held-out coordinates and predicted tuning losses"
        caption="Real seed-17 byte-bigram tuning observations. Filled dots fit the surface; open dots are the three held-out mixture coordinates. White ring is the candidate controlled below. The second plot compares observed and fitted loss on the same axes; distance from the diagonal is residual error."
      >
        <div className="mix-grid">
          <Triangle point={r}>
            {(position) =>
              study.response_observations.mixtures.map((m, i) => {
                const [x, y] = position(m);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    stroke={C[domain]}
                    fill={study.fit.fit_mask[i] ? C[domain] : '#111'}
                    strokeWidth="2"
                  >
                    <title>{`${m.join(', ')}; observed ${observed[i]}; predicted ${predicted[i]}`}</title>
                  </circle>
                );
              })
            }
          </Triangle>
          <Plot
            name="Observed versus predicted tuning NLL"
            xRange={[lower, upper]}
            yRange={[lower, upper]}
            xLabel="observed nats/byte"
            yLabel="predicted nats/byte"
          >
            {({ sx, sy }) => (
              <>
                <line
                  x1={sx(lower)}
                  y1={sy(lower)}
                  x2={sx(upper)}
                  y2={sy(upper)}
                  stroke="#777"
                  strokeDasharray="5 4"
                />
                {observed.map((v, i) => (
                  <g key={i}>
                    <line
                      x1={sx(v)}
                      x2={sx(v)}
                      y1={sy(v)}
                      y2={sy(predicted[i])}
                      stroke={C[domain]}
                      opacity=".5"
                    />
                    <circle
                      cx={sx(v)}
                      cy={sy(predicted[i])}
                      r="4"
                      fill={study.fit.fit_mask[i] ? C[domain] : '#111'}
                      stroke={C[domain]}
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </>
            )}
          </Plot>
        </div>
        <Ribbon shares={r} labels={bookNames} />
        <p>
          Candidate predicted {bookNames[domain]} tuning loss:{' '}
          <strong>{n(responseValue(r, coeff), 6)} nats/byte</strong>. Held-out-coordinate RMSE:{' '}
          {n(Math.sqrt(study.fit.models[domain].held_mse), 6)}.
        </p>
      </Figure>
      <FlowControls>
        <FlowSlider name="Alice share" value={a} onChange={setA} min={0} max={1} step={0.05} />
        <FlowSlider
          name="Time Machine fraction of remainder"
          value={fraction}
          onChange={setFraction}
          min={0}
          max={1}
          step={0.05}
        />
        <FlowChoice
          label="Evaluation domain"
          value={domain}
          onChange={setDomain}
          options={bookNames.map((name, i) => [i, name])}
        />
        <Reset
          onClick={() => {
            setA(0.3);
            setFraction(0);
            setDomain(0);
          }}
        />
      </FlowControls>
      <FlowReadout>
        The measured study selected (.3, 0, .7) using equal-domain predicted tuning loss,{' '}
        {n(study.fit.predicted_tuning_mean, 6)}. This inspector changes a candidate and the domain
        being inspected; it does not retrain a model or use final test results to refit.
      </FlowReadout>
    </FlowLab>
  );
}

export function GaugeFigure() {
  const [shift, setShift] = useState(1),
    r = [0.2, 0.3, 0.5],
    t = [-0.4, 0.3, 0.1],
    amplitude = 2;
  const original = amplitude * Math.exp(dot(t, r)),
    shifted =
      amplitude *
      Math.exp(-shift) *
      Math.exp(
        dot(
          t.map((v) => v + shift),
          r,
        ),
      );
  return (
    <FlowLab label="Expose redundant response-fit coefficients">
      <Figure
        name="gauge"
        label="Two coefficient sets produce the same prediction"
        caption="Constructed r=(.2,.3,.5), c=1 and k=2. Adding δ to every t contributes δ×sum(r)=δ in the exponent; multiplying k by exp(−δ) cancels it."
      >
        <Table
          caption="Equivalent parameterizations"
          headers={['Term', 'Original', 'Shifted']}
          rows={[
            ['k', amplitude, n(amplitude * Math.exp(-shift))],
            ['t vector', t.join(', '), t.map((v) => n(v + shift)).join(', ')],
            ['k exp(t · r)', n(original), n(shifted)],
            ['c + contribution', n(1 + original), n(1 + shifted)],
          ]}
        />
        <Arrow>fix r3 = 1 − r1 − r2</Arrow>
        <div className="mix-cells">
          {['c', 'b', 't1', 't2'].map((label) => (
            <span key={label} className="mix-cell" style={{ color: C[2] }}>
              {label}
            </span>
          ))}
        </div>
        <p>Fit c + exp(b + t1 r1 + t2 r2), with no additional free amplitude.</p>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Common coefficient shift δ"
          value={shift}
          onChange={setShift}
          min={-2}
          max={2}
          step={0.25}
        />
        <Reset onClick={() => setShift(1)} />
      </FlowControls>
      <FlowReadout>
        Prediction difference: {n(shifted - original, 12)}. Raw coefficients can change while
        predictions stay identical. The chosen coordinate convention removes this particular
        redundancy.
      </FlowReadout>
    </FlowLab>
  );
}

export function ByteModelFigure() {
  const [selected, setSelected] = useState(1),
    bytes = [99, 97, 116],
    words = ['c', 'a', 't'];
  const target = bytes[selected + 1],
    probability = Math.exp(2) / (255 + Math.exp(2));
  return (
    <FlowLab label="Trace a byte pair into the model's selected row">
      <Figure
        name="byte-model"
        label="Within-paragraph pairs, full row distribution and next-byte loss"
        caption="The model has 256 input rows and 256 output columns. This constructed selected row has target logit 2 and all other logits 0; it is not a saved model prediction. Its 256 output positions are folded into a 16×16 grid, one cell per byte ID, solely to fit the row on screen."
      >
        <div className="mix-grid">
          <div>
            <span className="mix-stage-label">One paragraph: c a t</span>
            <div className="mix-cells">
              {bytes.map((v, i) => (
                <span className="mix-cell" style={{ color: C[i] }} key={v}>
                  {words[i]} · {v}
                </span>
              ))}
            </div>
            <Arrow>adjacent pairs stay inside paragraph</Arrow>
            {[0, 1].map((i) => (
              <p
                key={i}
                className={selected === i ? 'mix-selected' : ''}
                style={{ padding: '.3rem' }}
              >
                ({bytes[i]}, {bytes[i + 1]}) · {words[i]} → {words[i + 1]}
              </p>
            ))}
            <Arrow>input byte {bytes[selected]} selects W's row</Arrow>
            <p>
              W shape: 256 × 256.
              <br />
              Selected row shape: 256 logits.
            </p>
          </div>
          <div>
            <span className="mix-stage-label">All 256 output bytes · row {bytes[selected]}</span>
            <p>Byte ID = 16 × grid row + column (both zero-based).</p>
            <Scroll label="Complete 256-byte output distribution">
              <svg
                className="mix-plot"
                viewBox="0 0 384 310"
                role="img"
                aria-label={`256 output cells; selected target ${target} has logit 2, all others zero`}
              >
                {Array.from({ length: 256 }, (_, i) => (
                  <rect
                    key={i}
                    x={65 + (i % 16) * 15}
                    y={40 + Math.floor(i / 16) * 15}
                    width="12"
                    height="12"
                    fill={i === target ? C[selected + 1] : '#444'}
                    stroke={i === target ? '#fff' : 'none'}
                    strokeWidth="2"
                  >
                    <title>{`Byte ${i}: logit ${i === target ? 2 : 0}, probability ${i === target ? probability : 1 / (255 + Math.exp(2))}`}</title>
                  </rect>
                ))}
              </svg>
            </Scroll>
            <p>
              Target {target}: grid ({Math.floor(target / 16)}, {target % 16}).
            </p>
            <p>
              Normalize all columns: exp(2) + 255 exp(0).
              <br />
              Target p={n(probability, 6)}; −ln p={n(-Math.log(probability), 6)} nats.
            </p>
          </div>
        </div>
        <p>
          Next paragraph starts a new set of pairs. There is no invented t → next-paragraph
          transition.
        </p>
      </Figure>
      <FlowControls>
        <FlowChoice
          label="Observed pair"
          value={selected}
          onChange={setSelected}
          options={[
            [0, 'c → a'],
            [1, 'a → t'],
          ]}
        />
      </FlowControls>
      <FlowReadout>
        Byte {bytes[selected]} selects a parameter row; byte {target} selects the observed target
        column after 256-way normalization. The loss denominator counts observed pairs, not unique
        transitions.
      </FlowReadout>
    </FlowLab>
  );
}

export function StudyFigure() {
  const [seed, setSeed] = useState(17),
    [domain, setDomain] = useState(-1);
  const arms = study.summary.map((row) => row.arm),
    rows = study.main_runs.filter((row) => row.seed === seed);
  const value = (row) => (domain < 0 ? row.test_macro_nll : row.test_nll[domain]);
  const all = study.main_runs.map(value),
    lo = Math.floor(Math.min(...all) * 100) / 100 - 0.005,
    hi = Math.ceil(Math.max(...all) * 100) / 100 + 0.005;
  return (
    <FlowLab label="Inspect actual final scores and source exposure">
      <Figure
        name="study"
        label="Recorded final losses across three seeds and four mixture strategies"
        caption="Measured CPU experiment: 120 main-model steps × 768 targets, identical zero initialization and fixed SGD settings. Here colours distinguish strategies, not books. Circles are individual seeds; white outlines select the seed. Lines span the seed range, not a confidence interval."
      >
        <Plot
          xTicks={[0, 1, 2, 3]}
          name="Final test scores by mixture strategy"
          xRange={[-0.4, 3.4]}
          yRange={[lo, hi]}
          xLabel="strategy index · key below"
          yLabel="test nats/byte"
        >
          {({ sx, sy }) =>
            arms.map((arm, i) => {
              const candidates = study.main_runs.filter((row) => row.arm === arm);
              return (
                <g key={arm}>
                  <line
                    x1={sx(i)}
                    x2={sx(i)}
                    y1={sy(Math.min(...candidates.map(value)))}
                    y2={sy(Math.max(...candidates.map(value)))}
                    stroke={C[i]}
                    strokeWidth="2"
                  />
                  {candidates.map((row, j) => (
                    <circle
                      key={row.seed}
                      cx={sx(i + (j - 1) * 0.07)}
                      cy={sy(value(row))}
                      r={row.seed === seed ? 6 : 4}
                      fill={C[i]}
                      stroke={row.seed === seed ? '#fff' : '#111'}
                      strokeWidth="2"
                    >
                      <title>{`${arm}; seed ${row.seed}; ${value(row)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })
          }
        </Plot>
        <Legend items={arms.map((arm, i) => [C[i], `${i}: ${arm}`])} />
        <Table
          caption={`Recorded seed ${seed}: loss and actual training targets`}
          headers={['Strategy', 'Final test NLL', 'Alice / Time / Great targets']}
          rows={rows.map((row) => [row.arm, n(value(row), 6), row.exposure.join(' / ')])}
        />
        <p>
          All main runs use {study.protocol.steps * study.protocol.batch} targets. Learned-mixture
          selection has additional costs outside this matched main budget.
        </p>
      </Figure>
      <FlowControls>
        <FlowChoice
          label="Recorded seed"
          value={seed}
          onChange={setSeed}
          options={study.protocol.seeds.map((s) => [s, String(s)])}
        />
        <FlowChoice
          label="Final score"
          value={domain}
          onChange={setDomain}
          options={[[-1, 'Equal-domain mean'], ...bookNames.map((name, i) => [i, name])]}
        />
        <Reset
          onClick={() => {
            setSeed(17);
            setDomain(-1);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Across all three seeds, mean macro loss is {n(study.summary[0].mean, 6)} for availability
        and {n(study.summary[2].mean, 6)} for DoReMi. Learned allocation did not beat the simple
        baselines here. Controls inspect existing measurements; no browser training occurs.
      </FlowReadout>
    </FlowLab>
  );
}

export function StrategyFigure() {
  return (
    <Figure
      name="strategies"
      label="Offline mixture search versus online adaptation"
      caption="These timelines identify where weights are chosen and which model pays the adaptation cost. Shapes denote parameter arrays; arrows denote training or weight transfer, not measured latency."
    >
      <div className="mix-grid">
        <div>
          <b>Offline search</b>
          <div className="mix-timeline">
            <div className="mix-time-point">
              <Matrix label="Small reference / proxy" values={[0.2, 0.1, 0.3, 0.4]} columns={2} />
            </div>
            <div className="mix-time-point" style={{ color: C[2] }}>
              Choose or average q using tuning evidence
            </div>
            <div className="mix-time-point">
              <Matrix label="Fresh main model · fixed q" values={[0, 0, 0, 0]} columns={2} />
            </div>
            <div className="mix-time-point">Independent final assessment</div>
          </div>
        </div>
        <div>
          <b>Online adaptation</b>
          <div className="mix-timeline">
            <div className="mix-time-point">
              <Matrix label="Current main parameters" values={[0.1, 0.2, 0.3, 0.4]} columns={2} />
            </div>
            <div className="mix-time-point" style={{ color: C[2] }}>
              Current signal → new q
            </div>
            <div className="mix-time-point">
              <Matrix
                label="Same main model · next update"
                values={[0.12, 0.18, 0.34, 0.38]}
                columns={2}
              />
            </div>
            <div className="mix-time-point">Repeat signal / weight / parameter loop</div>
          </div>
        </div>
      </div>
      <p>
        Offline search adds preparatory runs and a transfer question. Online adaptation adds
        feedback cost and state to the main run. Both require an explicit evaluation target.
      </p>
    </Figure>
  );
}
