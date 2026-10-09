import React, { useEffect, useId, useRef, useState } from 'react';
import * as M from '../../data/rlaif-methods-models.js';
import './rlaif-methods-flow.css';

const colors = M.candidateColors;
const f = (value, digits = 5) =>
  value === null || value === undefined || Number.isNaN(value)
    ? 'unknown'
    : !Number.isFinite(value)
      ? value < 0
        ? '−∞'
        : '∞'
      : Number(value.toFixed(digits)).toString();
const colorStyle = (index) => ({ '--response-color': colors[index] });
function Figure({ id, label, children, note }) {
  return (
    <figure className="rf-figure" data-rlaif-figure={id} aria-label={label}>
      {children}
      {note && <figcaption className="rf-note">{note}</figcaption>}
    </figure>
  );
}
function Controls({ children }) {
  return <div className="rf-controls">{children}</div>;
}
function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05 }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}: <output>{f(value)}</output>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
function Numeric({ label, value, onChange, min, max, step = 0.05 }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option
            key={Array.isArray(option) ? option[0] : option}
            value={Array.isArray(option) ? option[0] : option}
          >
            {Array.isArray(option) ? option[1] : option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label className="rf-check">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
function Reset({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Reset
    </button>
  );
}
export function RLAIFScroll({
  children,
  label = 'Diagram; scroll horizontally if needed',
  className = '',
}) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);
  return (
    <div className={`rf-scroll-wrap ${className}`}>
      {overflow && (
        <p className="rf-scroll-hint">Scroll horizontally, or focus this diagram and use ← →.</p>
      )}
      <div
        ref={ref}
        className="rf-scroll"
        tabIndex={overflow ? 0 : undefined}
        role={overflow ? 'region' : undefined}
        aria-label={overflow ? label : undefined}
      >
        {children}
      </div>
    </div>
  );
}
function Svg({ children, height = 320, small = false, label }) {
  return (
    <RLAIFScroll label={label}>
      <svg
        className={`rf-svg${small ? ' rf-svg--small' : ''}`}
        viewBox={`0 0 ${small ? 336 : 640} ${height}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </RLAIFScroll>
  );
}
function Line({ x1, y1, x2, y2, color = '#9599a6', dashed = false, ...rest }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth="1.5"
      strokeDasharray={dashed ? '5 4' : undefined}
      {...rest}
    />
  );
}
function Arrow({ x1, y1, x2, y2, color = '#9599a6', dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1),
    size = 7;
  return (
    <g>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} color={color} dashed={dashed} />
      <path
        d={`M${x2 - size * Math.cos(angle - 0.45)},${y2 - size * Math.sin(angle - 0.45)}L${x2},${y2}L${x2 - size * Math.cos(angle + 0.45)},${y2 - size * Math.sin(angle + 0.45)}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </g>
  );
}
function Text({ x, y, children, anchor = 'start', color, halo = false }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={color ? { fill: color } : undefined}
      className={halo ? 'rf-label-bg' : undefined}
    >
      {children}
    </text>
  );
}
function Key({ names = ['A', 'B'], palette = colors }) {
  return (
    <div className="rf-key">
      {names.map((name, index) => (
        <span key={name}>
          <i className="rf-swatch" style={{ '--response-color': palette[index] }} />
          {name}
        </span>
      ))}
    </div>
  );
}
function Areas({ values, names, palette = colors }) {
  if (!values) return <p className="rf-value">Unknown: no possible conditioning event.</p>;
  return (
    <>
      <div
        className="rf-probability"
        aria-label={names.map((name, i) => `${name}: ${f(values[i])}`).join('; ')}
      >
        {values.map((value, index) => (
          <span
            key={index}
            style={{ width: `${value * 100}%`, background: palette[index] }}
            data-mass={value}
          />
        ))}
      </div>
      <Key names={names.map((name, i) => `${name}: ${f(values[i])}`)} palette={palette} />
    </>
  );
}
export function RLAIFTable({ headers, rows, caption }) {
  return (
    <RLAIFScroll label={caption}>
      <table className="rf-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  {typeof cell === 'string' && /^[a-f0-9]{64}$/.test(cell) ? (
                    <span className="rf-value">{cell}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </RLAIFScroll>
  );
}
function Response({ index, text = M.responses[index], children }) {
  return (
    <div
      className="rf-response"
      style={colorStyle(index)}
      data-response-id={M.candidateNames[index]}
    >
      <strong>Response {M.candidateNames[index]}</strong>
      <p>{text || 'Empty response — no valid pair.'}</p>
      {children}
    </div>
  );
}
function SignedBars({ values, names, extent, palette = colors, unit }) {
  const bound = extent || Math.max(0.1, ...values.filter(Number.isFinite).map(Math.abs));
  return (
    <Svg height={75 + values.length * 54} label={`${unit}; shared zero and extent ${f(bound)}`}>
      <Text x={12} y={22}>
        {unit}
      </Text>
      <Line x1={350} y1={35} x2={350} y2={45 + values.length * 54} />
      {values.map((value, index) => (
        <g key={index}>
          <Text x={12} y={65 + index * 54}>
            {names[index]}
          </Text>
          {Number.isFinite(value) ? (
            <>
              <rect
                x={350 + Math.min(0, (value / bound) * 155)}
                y={45 + index * 54}
                width={Math.abs((value / bound) * 155)}
                height={23}
                fill={palette[index % palette.length]}
              />
              <Text x={540} y={64 + index * 54}>
                {f(value)}
              </Text>
            </>
          ) : (
            <Text x={380} y={64 + index * 54}>
              unknown
            </Text>
          )}
        </g>
      ))}
      <Text x={195} y={65 + values.length * 54} anchor="middle">
        {f(-bound)}
      </Text>
      <Text x={350} y={65 + values.length * 54} anchor="middle">
        0
      </Text>
      <Text x={505} y={65 + values.length * 54} anchor="middle">
        {f(bound)}
      </Text>
    </Svg>
  );
}
function Curve({ series, xRange, yRange, cursor, xLabel, yLabel, small = false, marker }) {
  const width = small ? 336 : 640,
    left = 62,
    right = width - 24,
    top = 40,
    bottom = 215;
  const X = (x) => left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (right - left);
  const Y = (y) => bottom - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (bottom - top);
  return (
    <Svg height={288} small={small} label={`${yLabel} versus ${xLabel}`}>
      <Text x={12} y={22}>
        {yLabel}
      </Text>
      <Line x1={left} y1={bottom} x2={right} y2={bottom} />
      <Line x1={left} y1={top} x2={left} y2={bottom} />
      {yRange[0] < 0 && yRange[1] > 0 && <Line x1={left} y1={Y(0)} x2={right} y2={Y(0)} dashed />}
      <Text x={left - 10} y={top + 6} anchor="end">
        {f(yRange[1], 2)}
      </Text>
      <Text x={left - 10} y={bottom + 5} anchor="end">
        {f(yRange[0], 2)}
      </Text>
      <Text x={left} y={bottom + 28} anchor="middle">
        {f(xRange[0], 2)}
      </Text>
      <Text x={right} y={bottom + 28} anchor="middle">
        {f(xRange[1], 2)}
      </Text>
      <Text x={(left + right) / 2} y={bottom + 57} anchor="middle">
        {xLabel}
      </Text>
      {series.map(({ points, color }, index) => (
        <path
          key={index}
          d={points.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)},${Y(y)}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      ))}
      {cursor !== undefined && cursor >= xRange[0] && cursor <= xRange[1] && (
        <Line x1={X(cursor)} y1={top} x2={X(cursor)} y2={bottom} color="#f0bd68" dashed />
      )}
      {xRange[0] < 0 && xRange[1] > 0 && (
        <Text x={X(0)} y={bottom + 28} anchor="middle">
          0
        </Text>
      )}
      {marker && marker.x > xRange[0] && marker.x < xRange[1] && (
        <Line x1={X(marker.x)} y1={top} x2={X(marker.x)} y2={bottom} color="#b8bbc5" dashed />
      )}
    </Svg>
  );
}
const observationPromises = new Map();
function useObservation(file) {
  const [element, setElement] = useState(null),
    [near, setNear] = useState(false);
  const [state, setState] = useState({ status: 'loading', data: null }),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    setState({ status: 'loading', data: null });
    if (!observationPromises.has(file)) {
      const promise = fetch(`/learn/examples/rlaif-methods/observations/${file}-results.json`).then(
        (response) => {
          if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || ''))
            throw new Error(`Observations unavailable: HTTP ${response.status}`);
          return response.json();
        },
      );
      observationPromises.set(file, promise);
    }
    observationPromises
      .get(file)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [file, retry, near]);
  return {
    ...state,
    ref: setElement,
    retry: () => {
      observationPromises.delete(file);
      setRetry((value) => value + 1);
    },
  };
}
function ObservationState({ state, children }) {
  return (
    <div ref={state.ref} className="rf-observation">
      {state.status === 'loading' ? (
        <p className="rf-loading" role="status">
          Loading retained observations…
        </p>
      ) : state.status === 'error' ? (
        <div className="rf-loading">
          <p role="status">
            Retained observations are unavailable; no values have been substituted.
          </p>
          <button type="button" onClick={state.retry}>
            Retry observations
          </button>
        </div>
      ) : (
        children(state.data)
      )}
    </div>
  );
}

export function FeedbackObjectiveAxes() {
  const [source, setSource] = useState('AI'),
    [route, setRoute] = useState('Direct pairs');
  const sources = ['Verifier', 'AI', 'Human'],
    routes = ['Reward + RL', 'Direct pairs', 'Imitation + contrast'];
  const marks = [
    ['Human', 'Reward + RL', 'RLHF'],
    ['AI', 'Reward + RL', 'RLAIF'],
    ['AI', 'Direct pairs', 'AI pairs + IPO'],
    ['Human', 'Direct pairs', 'Human pairs + DPO'],
    ['AI', 'Imitation + contrast', 'AI pairs + ORPO'],
    ['Verifier', 'Reward + RL', 'RLVR'],
  ];
  return (
    <Figure id="D01" label="Feedback source and learning rule are independent coordinates">
      <Svg height={360} label="Feedback source vertical; training construction horizontal">
        <Arrow x1={90} y1={275} x2={615} y2={275} />
        <Arrow x1={90} y1={275} x2={90} y2={30} />
        <Text x={12} y={20}>
          Feedback source
        </Text>
        {sources.map((name, i) => (
          <Text key={name} x={80} y={70 + i * 85} anchor="end">
            {name}
          </Text>
        ))}
        {routes.map((name, i) => (
          <Text key={name} x={175 + i * 175} y={305} anchor="middle">
            {name}
          </Text>
        ))}
        {marks.map(([s, r, name]) => {
          const x = 175 + routes.indexOf(r) * 175,
            y = 65 + sources.indexOf(s) * 85;
          return (
            <g key={name}>
              <circle cx={x} cy={y} r={9} fill={s === 'AI' ? '#ba9bff' : '#76d0d9'} />
              <Text x={x} y={y + 30} anchor="middle">
                {name}
              </Text>
              {source === s && route === r && (
                <circle cx={x} cy={y} r={17} fill="none" stroke="#f0bd68" strokeWidth="2" />
              )}
            </g>
          );
        })}
        <Text x={350} y={346} anchor="middle">
          Training construction
        </Text>
      </Svg>
      <p>
        {source && route
          ? `Selected composition: ${source} feedback, ${route.toLowerCase()}. Marks are examples, not an exhaustive method list.`
          : 'No composition selected.'}
      </p>
      <Controls>
        <Select
          label="Feedback source"
          value={source}
          onChange={setSource}
          options={['AI', 'Human', 'Verifier', ['', 'None']]}
        />
        <Select label="Learning rule" value={route} onChange={setRoute} options={routes} />
        <Reset
          onClick={() => {
            setSource('AI');
            setRoute('Direct pairs');
          }}
        />
      </Controls>
    </Figure>
  );
}
export function FullComparisonRecord() {
  const [swapped, setSwapped] = useState(false),
    [empty, setEmpty] = useState(false),
    order = swapped ? [1, 0] : [0, 1];
  return (
    <Figure id="D02" label="A complete comparison preserves context and response identity">
      <dl className="rf-record">
        <dt>Source note</dt>
        <dd>{M.note}</dd>
        <dt>Visitor request</dt>
        <dd>{M.request}</dd>
        <dt>Criterion</dt>
        <dd>{M.criterion}</dd>
      </dl>
      <div className="rf-brace rf-grid">
        {order.map((index, slot) => (
          <div key={index}>
            <p>Presentation slot {slot + 1}</p>
            <Response index={index} text={index === 1 && empty ? '' : M.responses[index]} />
          </div>
        ))}
      </div>
      <dl className="rf-record">
        <dt>Stored fields</dt>
        <dd data-pair-valid={!empty}>
          response IDs: {order.map((index) => M.candidateNames[index]).join(', ')}; target P(A
          preferred)={empty ? 'unknown' : '.7'}; source: constructed inspectable note.
        </dd>
      </dl>
      <Response index={2} />
      <Controls>
        <Check label="Swap presentation order" value={swapped} onChange={setSwapped} />
        <Check label="Empty response B" value={empty} onChange={setEmpty} />
        <Reset
          onClick={() => {
            setSwapped(false);
            setEmpty(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function CompiledJudgePrompt() {
  const [detailed, setDetailed] = useState(false),
    [missing, setMissing] = useState(false),
    [zero, setZero] = useState(false),
    prompt = M.compiledPrompt(detailed, missing);
  return (
    <Figure id="D03" label="Encoder context and decoder option targets">
      <p>Encoder input: the complete comparison prompt</p>
      <div className="rf-segments">
        {prompt.segments.map((segment, i) => (
          <div key={i} data-prompt-segment={i}>
            <p className="rf-raw">{segment}</p>
          </div>
        ))}
        <p>Which response is better? Answer 1 or 2.</p>
      </div>
      <p>Decoder labels are separate complete options, including EOS.</p>
      <div className="rf-token-row">
        {zero ? (
          <p>No option targets.</p>
        ) : (
          ['1 + EOS', '2 + EOS'].map((text, i) => (
            <span key={text} className="rf-token rf-token--active" style={colorStyle(i)}>
              {text}
            </span>
          ))
        )}
      </div>
      <p data-valid={prompt.valid && !zero}>
        {prompt.valid && !zero
          ? 'Ready to score the declared options; this browser compiles a prompt and does not run the pretrained judge.'
          : 'Invalid: context or option targets are missing.'}
      </p>
      <Controls>
        <Check label="Detailed rubric" value={detailed} onChange={setDetailed} />
        <Check label="Missing source context" value={missing} onChange={setMissing} />
        <Check label="Zero option targets" value={zero} onChange={setZero} />
        <Reset
          onClick={() => {
            setDetailed(false);
            setMissing(false);
            setZero(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function ConditionalOptionMass() {
  const [a, setA] = useState(0.3),
    [b, setB] = useState(0.1),
    model =
      a === '' || b === ''
        ? { valid: false, reason: 'Enter both option masses; an empty edit is unknown.' }
        : M.conditionalMass(a, b);
  return (
    <Figure id="D04" label="Unrestricted mass versus conditional option probability">
      {model.valid ? (
        <>
          <p>Unrestricted probability mass</p>
          <Areas
            values={model.raw}
            names={['A', 'B', 'other outputs']}
            palette={[colors[0], colors[1], '#777b89']}
          />
          <div className="rf-brace">
            <p>Restrict to A or B: retained mass {f(Number(a) + Number(b))}</p>
            <Areas values={model.conditional} names={['A given A/B', 'B given A/B']} />
          </div>
          <p className="rf-value" data-conditional-a={model.conditional?.[0] ?? 'unknown'}>
            {model.conditional
              ? `P(A | A or B) = ${f(Number(a))} / (${f(Number(a))} + ${f(Number(b))}) = ${f(model.conditional[0])}`
              : 'Both option masses are zero. The conditional probability is undefined.'}
          </p>
        </>
      ) : (
        <p role="status">{model.reason}</p>
      )}
      <Controls>
        <Numeric label="Raw A mass" value={a} onChange={setA} min={0} max={1} />
        <Numeric label="Raw B mass" value={b} onChange={setB} min={0} max={1} />
        <Reset
          onClick={() => {
            setA(0.3);
            setB(0.1);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function MappedOrderWires() {
  const [first, setFirst] = useState(0.8),
    [second, setSecond] = useState(0.4),
    [missing, setMissing] = useState(false),
    model = missing ? null : M.mapOrders(first, second);
  return (
    <Figure id="D05" label="Map option positions to response identity before averaging">
      <Svg height={340} label="Two orderings map to the same response A identity">
        <Text x={60} y={28}>
          Slot 1
        </Text>
        <Text x={230} y={28}>
          Slot 2
        </Text>
        <Text x={475} y={28}>
          Mapped P(A)
        </Text>
        {[
          ['A', 'B'],
          ['B', 'A'],
        ].map((order, row) => (
          <g key={row}>
            {order.map((name, slot) => (
              <g key={name}>
                <circle
                  cx={95 + slot * 170}
                  cy={80 + row * 110}
                  r={25}
                  fill={colors[M.candidateNames.indexOf(name)]}
                />
                <Text x={95 + slot * 170} y={86 + row * 110} anchor="middle" color="#17181d">
                  {name}
                </Text>
              </g>
            ))}
            {row === 0 ? (
              <>
                <Line x1={114} y1={64} x2={136} y2={49} color={colors[0]} />
                <Line x1={136} y1={49} x2={440} y2={49} color={colors[0]} />
                <Arrow x1={440} y1={49} x2={455} y2={80} color={colors[0]} />
              </>
            ) : (
              <Arrow x1={295} y1={190} x2={455} y2={190} color={colors[0]} />
            )}
            <Text x={485} y={86 + row * 110}>
              {row === 0 ? f(first) : missing ? 'unknown' : f(1 - second)}
            </Text>
            <Text x={60} y={125 + row * 110}>
              P(slot 1) = {f(row === 0 ? first : second)}
            </Text>
          </g>
        ))}
        <Line x1={520} y1={112} x2={580} y2={112} />
        <Line x1={580} y1={112} x2={580} y2={250} />
        <Line x1={520} y1={190} x2={580} y2={190} />
        <Text x={350} y={294} anchor="middle">
          Average mapped A probabilities: {f(model?.target)}
        </Text>
      </Svg>
      <p data-target={model?.target ?? 'unknown'}>
        Mapped A target {f(model?.target)}; order gap {f(model?.gap)}.{' '}
        {missing && 'A missing pass stays unknown.'}
      </p>
      <Controls>
        <Slider label="First-order P(slot 1)" value={first} onChange={setFirst} />
        <Slider label="Reversed-order P(slot 1)" value={second} onChange={setSecond} />
        <Check label="Second pass missing" value={missing} onChange={setMissing} />
        <Reset
          onClick={() => {
            setFirst(0.8);
            setSecond(0.4);
            setMissing(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function LabelValidityRows() {
  const [choice, setChoice] = useState('1'),
    [budget, setBudget] = useState(false),
    [missing, setMissing] = useState(false),
    edited = M.feedbackStatus(choice, budget, missing);
  const rows = [
    edited,
    M.feedbackStatus('unmapped'),
    M.feedbackStatus('1', true),
    M.feedbackStatus('1', false, true),
  ];
  const known = rows.filter((row) => row.valid).length;
  return (
    <Figure id="D06" label="Requested records and valid mapped labels have different denominators">
      <RLAIFTable
        caption="Constructed validity records; unknown values are excluded"
        headers={['Record', 'Response identities', 'Status', 'Target P(A)']}
        rows={rows.map((row, i) => [
          i + 1,
          'A / B',
          row.reason,
          <span className="rf-number">
            {row.target === null ? '○ unknown' : `● ${row.target}`}
          </span>,
        ])}
      />
      <p data-known={known}>
        {known} valid of 4 requested records; {4 - known} unknown. Full context for every row is the
        source note and A/B responses above.
      </p>
      <Controls>
        <label>
          Raw choice text
          <input type="text" value={choice} onChange={(event) => setChoice(event.target.value)} />
        </label>
        <Check label="Edited record over budget" value={budget} onChange={setBudget} />
        <Check label="Edited record missing order" value={missing} onChange={setMissing} />
        <Reset
          onClick={() => {
            setChoice('1');
            setBudget(false);
            setMissing(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SoftTargetTransforms() {
  const [q, setQ] = useState(0.8),
    [weighted, setWeighted] = useState(true),
    model = M.softTargets(q);
  return (
    <Figure id="D07" label="Full soft targets retain both masses">
      <p>Full target distribution</p>
      <Areas values={model.full} names={['A target', 'B target']} />
      <p>Hard threshold</p>
      {model.hard ? (
        <Areas values={model.hard} names={['A target', 'B target']} />
      ) : (
        <p>Tie at q=.5: no unique threshold winner.</p>
      )}
      <p>
        A-only hard weighting:{' '}
        {weighted ? `fixed A label, weight q=${f(q)}` : 'fixed A label, weight 1'}. The B outcome is
        discarded. This is distinct from thresholding to whichever response is more probable.
      </p>
      <Areas
        values={[weighted ? q : 1, weighted ? 1 - q : 0]}
        names={['A-only loss weight', 'unused B target mass']}
        palette={[colors[0], '#777b89']}
      />
      <Controls>
        <Slider label="Soft target q=P(A preferred)" value={q} onChange={setQ} />
        <Check label="Weight hard A loss by q" value={weighted} onChange={setWeighted} />
        <Reset
          onClick={() => {
            setQ(0.8);
            setWeighted(true);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function RewardHeadWiring() {
  const [weight, setWeight] = useState(0),
    [bias, setBias] = useState(0),
    [equal, setEqual] = useState(false),
    model = M.rewardHead([weight], bias, [0.5], equal ? [0.5] : [-0.5]);
  return (
    <Figure id="D08" label="Shared reward weights produce a score difference">
      <Svg height={395} label="Two feature vectors use the same scalar reward head">
        <Text x={20} y={28}>
          Fixed features
        </Text>
        <Text x={240} y={28}>
          Shared scalar weight
        </Text>
        <Text x={485} y={28}>
          Scores
        </Text>
        <circle cx={295} cy={148} r={30} fill="none" stroke="#f0bd68" strokeWidth="2" />
        <Text x={295} y={154} anchor="middle">
          g={f(weight)}
        </Text>
        {[model.a, model.b].map((features, row) => (
          <g key={row}>
            <Text x={20} y={86 + row * 135} color={colors[row]}>
              {M.candidateNames[row]}
            </Text>
            <circle
              cx={110}
              cy={80 + row * 135}
              r={25}
              fill="none"
              stroke={colors[row]}
              strokeWidth="2"
            />
            <Text x={110} y={86 + row * 135} anchor="middle">
              {f(features[0])}
            </Text>
            <Arrow x1={136} y1={80 + row * 135} x2={480} y2={80 + row * 135} color={colors[row]} />
            <Line
              x1={295}
              y1={row === 0 ? 118 : 178}
              x2={295}
              y2={80 + row * 135}
              color="#f0bd68"
            />
            <Text x={495} y={86 + row * 135}>
              {f(model.scores[row])}
            </Text>
          </g>
        ))}
        <Text x={20} y={297}>
          Common bias b={f(bias)} cancels in subtraction.
        </Text>
        <Text x={20} y={337}>
          rA − rB = {f(model.gap)}
        </Text>
        <Text x={320} y={337}>
          sigmoid(gap) = {f(model.probability)}
        </Text>
      </Svg>
      <p data-reward-gap={model.gap}>
        The scalar gap is {f(model.gap)}; changing a shared weight affects both scores.
      </p>
      <Controls>
        <Slider
          label="Shared gap weight g"
          value={weight}
          onChange={setWeight}
          min={-2}
          max={2}
          step={0.1}
        />
        <Slider
          label="Common reward offset"
          value={bias}
          onChange={setBias}
          min={-1}
          max={1}
          step={0.1}
        />
        <Check label="Equal feature values" value={equal} onChange={setEqual} />
        <Reset
          onClick={() => {
            setWeight(0);
            setBias(0);
            setEqual(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SoftBCELossGradient() {
  const [q, setQ] = useState(0.8),
    [logit, setLogit] = useState(0),
    [approximation, setApproximation] = useState(true),
    model = M.softBCE(q, logit);
  const points = (key) => M.scalarSamples((x) => M.softBCE(q, x)[key], -5, 5);
  return (
    <Figure id="D09" label="Full soft BCE and its logit derivative">
      <div className="rf-stack">
        <Curve
          series={[{ points: points('p'), color: colors[0] }]}
          xRange={[-5, 5]}
          yRange={[0, 1]}
          cursor={logit}
          xLabel="Score gap / logit"
          yLabel="Model P(A)"
        />
        <Curve
          series={[
            { points: points('full'), color: colors[0] },
            ...(approximation ? [{ points: points('weighted'), color: colors[1] }] : []),
          ]}
          xRange={[-5, 5]}
          yRange={[
            0,
            Math.max(...points('full').map(([, y]) => y), ...points('weighted').map(([, y]) => y)),
          ]}
          cursor={logit}
          xLabel="Score gap / logit"
          yLabel="Binary cross-entropy"
        />
        <Curve
          series={[
            { points: points('derivative'), color: colors[0] },
            ...(approximation ? [{ points: points('weightedDerivative'), color: colors[1] }] : []),
          ]}
          xRange={[-5, 5]}
          yRange={[-1, 1]}
          cursor={logit}
          xLabel="Score gap / logit"
          yLabel="Derivative with respect to gap"
        />
      </div>
      <Key names={['Full soft BCE', 'A-only weighted loss']} />
      <p data-full-loss={model.full} data-full-gradient={model.derivative}>
        p={f(model.p)}; full loss={f(model.full)}, derivative p−q={f(model.derivative)}; A-only
        weighted loss={f(model.weighted)}, derivative={f(model.weightedDerivative)}. Full optimum
        logit={f(model.optimum)}.
      </p>
      <Controls>
        <Slider label="Target q" value={q} onChange={setQ} />
        <Slider
          label="Model score gap"
          value={logit}
          onChange={setLogit}
          min={-5}
          max={5}
          step={0.1}
        />
        <Check
          label="Show A-only weighted approximation"
          value={approximation}
          onChange={setApproximation}
        />
        <Reset
          onClick={() => {
            setQ(0.8);
            setLogit(0);
            setApproximation(true);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function DistilledDirectRoutes() {
  const [candidate, setCandidate] = useState('A');
  const selected = candidate === 'A' ? 0 : 1;
  const ratingMasses =
    selected === 0 ? [0.1, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.7] : [0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 0];
  const ratingModel = M.ratings(ratingMasses);
  return (
    <Figure id="D10" label="Distilled and direct reward have different updating parameter sets">
      <Key
        names={['Teacher frozen', 'Reward weights', 'Policy weights', 'Reference frozen']}
        palette={['#76d0d9', '#f0bd68', '#ba9bff', '#9396a2']}
      />
      <div className="rf-grid">
        {[false, true].map((direct) => (
          <div key={String(direct)}>
            <p>
              {direct
                ? 'Direct feedback: one sampled response'
                : 'Distilled feedback: a labelled pair'}
            </p>
            <Svg
              small
              height={400}
              label={
                direct
                  ? 'A frozen teacher supplies the policy reward directly'
                  : 'Soft pair labels train a reward head that is then frozen'
              }
            >
              {(direct ? [selected] : [0, 1]).map((index, slot) => (
                <g key={index}>
                  <circle
                    cx={direct ? 168 : 112 + slot * 112}
                    cy={40}
                    r={23}
                    fill="none"
                    stroke={colors[index]}
                    strokeWidth="2"
                  />
                  <Text
                    x={direct ? 168 : 112 + slot * 112}
                    y={46}
                    anchor="middle"
                    color={colors[index]}
                  >
                    {M.candidateNames[index]}
                  </Text>
                  <Arrow
                    x1={direct ? 168 : 112 + slot * 112}
                    y1={64}
                    x2={direct ? 168 : 130 + slot * 76}
                    y2={95}
                    color={colors[index]}
                  />
                  {index === selected && (
                    <circle
                      cx={direct ? 168 : 112 + slot * 112}
                      cy={40}
                      r={28}
                      fill="none"
                      stroke="#f0bd68"
                    />
                  )}
                </g>
              ))}
              <rect
                x={72}
                y={98}
                width={192}
                height={55}
                fill="none"
                stroke="#76d0d9"
                strokeDasharray="5 4"
              />
              <Text x={168} y={122} anchor="middle">
                Teacher parameters φ
              </Text>
              <Text x={168} y={145} anchor="middle">
                frozen
              </Text>
              <Arrow x1={168} y1={157} x2={168} y2={182} />
              {direct ? (
                <>
                  <Text x={168} y={208} anchor="middle">
                    Rating distribution 1…10
                  </Text>
                  {ratingMasses.map((mass, i) => (
                    <rect
                      key={i}
                      x={27 + i * 29}
                      y={275 - mass * 75}
                      width={20}
                      height={mass * 75}
                      fill="#76d0d9"
                    />
                  ))}
                  <Line x1={22} y1={276} x2={316} y2={276} />
                  <Text x={27} y={299}>
                    1
                  </Text>
                  <Text x={307} y={299} anchor="end">
                    10
                  </Text>
                  <Text x={168} y={336} anchor="middle">
                    E={f(ratingModel.expected)} → r({candidate})={f(ratingModel.reward)}
                  </Text>
                  <Text x={168} y={374} anchor="middle">
                    Detach teacher reward.
                  </Text>
                </>
              ) : (
                <>
                  <Text x={168} y={208} anchor="middle">
                    Soft target [q, 1−q]
                  </Text>
                  <rect x={65} y={225} width={144} height={20} fill={colors[0]} />
                  <rect x={209} y={225} width={62} height={20} fill={colors[1]} />
                  <Text x={168} y={272} anchor="middle">
                    Constructed q=.7
                  </Text>
                  <Arrow x1={168} y1={282} x2={168} y2={305} color="#f0bd68" dashed />
                  <circle cx={168} cy={334} r={26} fill="none" stroke="#f0bd68" />
                  <Text x={168} y={340} anchor="middle">
                    ψ
                  </Text>
                  <Text x={168} y={389} anchor="middle">
                    Fit ψ, then freeze rψ(y).
                  </Text>
                </>
              )}
            </Svg>
            <p className="rf-note">
              {direct
                ? 'The bars illustrate a constructed distribution, not a new judge call. The teacher stays frozen.'
                : 'Only the reward-head parameters ψ receive the soft-label fit gradient. Then their score is detached during policy optimization.'}
            </p>
          </div>
        ))}
      </div>
      <Svg
        height={340}
        label="Detached scalar rewards weight the policy score gradient; a frozen reference supplies a KL comparison"
      >
        <Text x={25} y={28}>
          Detached scalar reward r(y)
        </Text>
        <Arrow x1={245} y1={23} x2={360} y2={23} />
        <Text x={378} y={29}>
          Reward − baseline
        </Text>
        <Line x1={430} y1={40} x2={430} y2={67} />
        <Text x={330} y={95}>
          −(r−b) ∇θ log π(y)
        </Text>
        <Text x={30} y={123} color="#ba9bff">
          Updating policy parameters
        </Text>
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={45 + i * 88} y={146} width={76} height={48} fill="none" stroke="#ba9bff" />
            <Text x={83 + i * 88} y={176} anchor="middle">
              θ{M.candidateNames[i]}
            </Text>
          </g>
        ))}
        <Arrow x1={219} y1={170} x2={352} y2={170} />
        <Text x={373} y={177}>
          softmax → π(A), π(B)
        </Text>
        <Line x1={470} y1={154} x2={470} y2={108} />
        <Line x1={320} y1={87} x2={270} y2={87} color="#ba9bff" dashed />
        <Line x1={270} y1={87} x2={270} y2={154} color="#ba9bff" dashed />
        <Arrow x1={270} y1={154} x2={213} y2={154} color="#ba9bff" dashed />
        <rect
          x={363}
          y={241}
          width={245}
          height={65}
          fill="none"
          stroke="#9396a2"
          strokeDasharray="5 4"
        />
        <Text x={485} y={267} anchor="middle">
          Reference logits [0,0]
        </Text>
        <Text x={485} y={292} anchor="middle">
          frozen
        </Text>
        <Text x={35} y={250}>
          KL compares policy with reference.
        </Text>
        <Text x={35} y={287}>
          Reference parameters receive no update.
        </Text>
      </Svg>
      <p>
        Solid lines carry forward values; dashed violet lines return a gradient to policy logits.
        The reference distribution enters the KL term; its frozen parameters are not differentiated
        or optimized. Both routes retain an imperfect AI observer.
      </p>
      <Controls>
        <Select
          label="Trace response identity"
          value={candidate}
          onChange={setCandidate}
          options={['A', 'B']}
        />
        <Reset onClick={() => setCandidate('A')} />
      </Controls>
    </Figure>
  );
}
export function RatingDistributionMap() {
  const initial = () => [0.1, 0, 0, 0, 0.2, 0, 0, 0, 0, 0.7];
  const [masses, setMasses] = useState(initial),
    [rating, setRating] = useState(10),
    model = M.ratings(masses);
  return (
    <Figure id="D11" label="A rating distribution becomes an expected scalar reward">
      <Svg height={315} label="Constructed rating probability mass at each integer from 1 to 10">
        <Text x={20} y={24}>
          Probability mass (shared 0–1 scale)
        </Text>
        <Line x1={55} y1={245} x2={615} y2={245} />
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i}>
            <rect
              x={65 + i * 55}
              y={245 - (model?.distribution[i] ?? 0) * 180}
              width={28}
              height={(model?.distribution[i] ?? 0) * 180}
              fill="#76d0d9"
            />
            {model && (
              <Text x={79 + i * 55} y={235 - model.distribution[i] * 180} anchor="middle">
                {f(model.distribution[i], 2)}
              </Text>
            )}
            <Text x={79 + i * 55} y={275} anchor="middle">
              {i + 1}
            </Text>
          </g>
        ))}
        {!model && (
          <Text x={335} y={150} anchor="middle">
            Unknown distribution
          </Text>
        )}
      </Svg>
      <p data-expected-rating={model?.expected ?? 'unknown'}>
        {model
          ? `E[rating]=${model.contributions
              .map((v, i) => (v ? `${i + 1}×${f(model.distribution[i])}` : null))
              .filter(Boolean)
              .join(
                ' + ',
              )}=${f(model.expected)}; reward=(${f(model.expected)}−5.5)/4.5=${f(model.reward)}.`
          : 'Empty distribution: expectation and reward are unknown.'}
      </p>
      <Controls>
        <Select
          label="Rating to edit"
          value={rating}
          onChange={(v) => setRating(Number(v))}
          options={Array.from({ length: 10 }, (_, i) => `${i + 1}`)}
        />
        <Slider
          label="Unnormalized mass for selected rating"
          value={masses[rating - 1]}
          onChange={(v) =>
            setMasses((values) => values.map((old, i) => (i === rating - 1 ? v : old)))
          }
        />
        <button type="button" onClick={() => setMasses(Array(10).fill(0))}>
          Empty distribution
        </button>
        <button
          type="button"
          onClick={() => setMasses(Array.from({ length: 10 }, (_, i) => (i === 0 ? 1 : 0)))}
        >
          All at 1
        </button>
        <button
          type="button"
          onClick={() => setMasses(Array.from({ length: 10 }, (_, i) => (i === 9 ? 1 : 0)))}
        >
          All at 10
        </button>
        <Reset
          onClick={() => {
            setMasses(initial());
            setRating(10);
          }}
        />
      </Controls>
      <p className="rf-note">
        Constructed complete-option distribution. The later retained native judge observations are a
        separate measurement.
      </p>
    </Figure>
  );
}
export function FinitePolicyScoreVectors() {
  const [p, setP] = useState(0.25),
    [reward, setReward] = useState(2),
    [baseline, setBaseline] = useState(0),
    [dependent, setDependent] = useState(false),
    model = M.policyVectors(p, [reward, 0], baseline, dependent);
  const extent = Math.max(
    0.5,
    ...model.samples.flat().map(Math.abs),
    ...model.rewardGradient.map(Math.abs),
  );
  return (
    <Figure
      id="D12"
      label="Weighted score-function sample vectors give the expected policy gradient"
    >
      <Areas values={model.probabilities} names={['Policy P(A)', 'Policy P(B)']} />
      <RLAIFTable
        caption="Constructed two-logit coordinate vectors"
        headers={['Selected action', '∇θ log π(action)', 'Reward − baseline', 'Sample gradient']}
        rows={model.scoreVectors.map((vector, i) => [
          M.candidateNames[i],
          `[${vector.map((v) => f(v)).join(', ')}]`,
          f([reward, 0][i] - (dependent ? [reward, 0][i] : baseline)),
          `[${model.samples[i].map((v) => f(v)).join(', ')}]`,
        ])}
      />
      <SignedBars
        values={[...model.samples[0], ...model.samples[1], ...model.rewardGradient]}
        names={[
          'A sample: θA',
          'A sample: θB',
          'B sample: θA',
          'B sample: θB',
          'Expected: θA',
          'Expected: θB',
        ]}
        palette={[colors[0], colors[0], colors[1], colors[1], '#f0bd68', '#f0bd68']}
        extent={extent}
        unit="Reward-gradient coordinates; shared numeric scale"
      />
      <p data-expected-gradient={model.rewardGradient[0]}>
        Weighted mean = [{model.rewardGradient.map((v) => f(v)).join(', ')}].{' '}
        {dependent
          ? 'This action-dependent subtraction removes each reward and biases the estimate.'
          : 'A constant baseline changes sample vectors and preserves their weighted mean.'}
      </p>
      <Controls>
        <Slider label="Policy P(A)" value={p} onChange={setP} min={0.05} max={0.95} />
        <Slider
          label="Reward for A"
          value={reward}
          onChange={setReward}
          min={-2}
          max={3}
          step={0.1}
        />
        <Slider
          label="Action-independent baseline"
          value={baseline}
          onChange={setBaseline}
          min={-2}
          max={3}
          step={0.1}
        />
        <Check
          label="Subtract each action's own reward (biased)"
          value={dependent}
          onChange={setDependent}
        />
        <Reset
          onClick={() => {
            setP(0.25);
            setReward(2);
            setBaseline(0);
            setDependent(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SnapshotTimeline() {
  const state = useObservation('feedback'),
    loop = useObservation('loop');
  const [step, setStep] = useState(0),
    [policyStep, setPolicyStep] = useState(0),
    [rate, setRate] = useState(0.05);
  return (
    <Figure id="D13" label="Frozen and changed parameter states across feedback and policy updates">
      <ObservationState state={state}>
        {(data) => (
          <>
            <RLAIFTable
              caption="Retained reward-head state, followed by one sampled-gradient policy step"
              headers={['Parameter owner', 'Before', 'After selected operation', 'Updates?']}
              rows={[
                ['Teacher φ', 'Pinned Flan revision', 'Same pinned Flan revision', 'Frozen'],
                [
                  'Reward gap ψ',
                  f(data.history[0].gap),
                  f(data.history[step].gap),
                  `Retained fit step ${step}; freeze before policy`,
                ],
                [
                  'Policy logits θ',
                  'Separate retained policy trace below',
                  'One sampled-gradient update below',
                  `Learning rate ${f(rate)}`,
                ],
                ['Reference logits', '[0, 0]', '[0, 0]', 'Frozen'],
              ]}
            />
            <div className="rf-grid">
              <div style={{ '--response-color': '#f0bd68' }}>
                <p>Reward gap over retained fit steps</p>
                <div className="rf-parameters">
                  {[0, 16, 32, 48, 64].map((i) => (
                    <span key={i} className={i === step ? 'rf-selected' : ''}>
                      step {i}
                      <br />
                      {f(data.history[i].gap)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rf-frozen">
                <p>Reference state is reused unchanged</p>
                <div className="rf-parameters">
                  <span>θA=0</span>
                  <span>θB=0</span>
                </div>
              </div>
            </div>
            <p>
              Reward scores at the selected fit step: [
              {data.history[step].scores.map((v) => f(v)).join(', ')}]. The separately retained
              policy trace used the terminal frozen rewards, not an unfinished reward fit.
            </p>
          </>
        )}
      </ObservationState>
      <ObservationState state={loop}>
        {(data) => {
          const trace = data.histories.distilled[policyStep],
            after = trace.logits.map((value, i) => value - rate * trace.gradient[i]);
          return (
            <>
              <p>
                Retained distilled-policy step {policyStep}: sampled action{' '}
                {M.candidateNames[trace.sampled_action]}, detached reward {f(trace.reward)},
                baseline {f(trace.baseline)}.
              </p>
              <div className="rf-grid">
                <div>
                  <p>Actual logits before this step</p>
                  <div className="rf-parameters">
                    {trace.logits.map((value, i) => (
                      <span key={i} style={colorStyle(i)}>
                        {M.candidateNames[i]}: {f(value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p>Recalculate only this update at the chosen rate</p>
                  <div className="rf-parameters">
                    {after.map((value, i) => (
                      <span key={i} style={colorStyle(i)}>
                        {M.candidateNames[i]}: {f(value)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p data-policy-after={after[0]}>
                Loss gradient [{trace.gradient.map((v) => f(v)).join(', ')}]; θ′=θ−rate×gradient.
                Rate 0 leaves the logits unchanged. This edit does not retrain or relabel the
                retained trajectory.
              </p>
            </>
          );
        }}
      </ObservationState>
      <Controls>
        <Slider
          label="Retained reward fit step"
          value={step}
          onChange={setStep}
          min={0}
          max={64}
          step={1}
        />
        <Slider
          label="Retained sampled policy step"
          value={policyStep}
          onChange={setPolicyStep}
          min={0}
          max={63}
          step={1}
        />
        <Slider
          label="Recalculate one-step learning rate"
          value={rate}
          onChange={setRate}
          min={0}
          max={0.5}
          step={0.01}
        />
        <Reset
          onClick={() => {
            setStep(0);
            setPolicyStep(0);
            setRate(0.05);
          }}
        />
      </Controls>
    </Figure>
  );
}

export function AlignedGatherMatrix() {
  const [targets, setTargets] = useState([...M.gatherTargets]),
    [empty, setEmpty] = useState(false),
    model = empty ? null : M.gather(targets);
  return (
    <Figure id="D14" label="One target per predictor row, versus the wrong Cartesian square">
      <RLAIFScroll label="Token probability matrix with aligned target selections">
        <table className="rf-table rf-matrix">
          <caption>Probability matrix [T=3, V=4]</caption>
          <thead>
            <tr>
              <th>Predictor row</th>
              {[0, 1, 2, 3].map((id) => (
                <th key={id}>ID {id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {M.gatherProbabilities.map((row, t) => (
              <tr key={t}>
                <th scope="row">t={t}</th>
                {row.map((p, id) => (
                  <td
                    key={id}
                    className={!empty && targets[t] === id ? 'rf-selected' : ''}
                    data-selected={!empty && targets[t] === id}
                    style={{ background: `rgba(118,184,255,${p * 0.5})` }}
                  >
                    {f(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </RLAIFScroll>
      <div className="rf-grid">
        <div>
          <p>Aligned gather: (row, its target ID)</p>
          <div className="rf-token-row">
            {model ? (
              model.aligned.map((p, i) => (
                <span key={i} className="rf-token rf-token--active" style={colorStyle(0)}>
                  {f(p)}
                  <small>
                    ({i}, {targets[i]})
                  </small>
                </span>
              ))
            ) : (
              <p>No response targets.</p>
            )}
          </div>
          <p>
            {model
              ? `${targets.length} selected cells; product=${f(model.product)}, sum log p=${f(model.logSum)}.`
              : 'No score is defined.'}
          </p>
        </div>
        <div>
          <p>Wrong Cartesian gather: every row × every target</p>
          {model && (
            <table className="rf-table">
              <tbody>
                {model.cartesian.map((row, i) => (
                  <tr key={i}>
                    {row.map((p, j) => (
                      <td key={j}>{f(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>
            {model
              ? `${targets.length ** 2} cells; this is a different operation.`
              : 'No selected cells.'}
          </p>
        </div>
      </div>
      <Controls>
        {targets.map((id, i) => (
          <Select
            key={i}
            label={`Target ID for row ${i}`}
            value={id}
            onChange={(v) =>
              setTargets((current) => current.map((old, j) => (j === i ? Number(v) : old)))
            }
            options={['0', '1', '2', '3']}
          />
        ))}
        <Check label="Empty target vector" value={empty} onChange={setEmpty} />
        <Reset
          onClick={() => {
            setTargets([...M.gatherTargets]);
            setEmpty(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
function TokenScores({ model, index }) {
  return (
    <div style={colorStyle(index)}>
      <p style={{ color: colors[index] }}>
        Response {M.candidateNames[index]}: {model.count} target tokens
      </p>
      <div className="rf-token-row">
        {model.probabilities.map((p, i) => (
          <span key={i} className="rf-token rf-token--active">
            p={f(p)}
            <small>log p={f(model.logs[i])}</small>
          </span>
        ))}
      </div>
      <div className="rf-brace">
        <p>Sum log p = {f(model.sum)}</p>
        <p>
          Own-response mean = {f(model.sum)} / {model.count} = {f(model.mean)}
        </p>
      </div>
    </div>
  );
}
export function SumMeanTokenScores() {
  const [count, setCount] = useState(4),
    [p, setP] = useState(0.5),
    [equal, setEqual] = useState(false);
  const a = M.tokenScore([0.8, 0.5]),
    b = M.tokenScore(equal ? [0.8, 0.5] : Array(count).fill(p));
  const extent = Math.max(1, Math.abs(a.sum), Math.abs(b.sum));
  return (
    <Figure
      id="D15"
      label="Sums and own-response means can rank unequal-length responses differently"
    >
      <div className="rf-grid">
        <TokenScores model={a} index={0} />
        <TokenScores model={b} index={1} />
      </div>
      <SignedBars
        values={[a.sum, b.sum]}
        names={['A summed log score', 'B summed log score']}
        extent={extent}
        unit="Summed log-probability; identical track scale"
      />
      <SignedBars
        values={[a.mean, b.mean]}
        names={['A mean log score', 'B mean log score']}
        extent={Math.max(1, Math.abs(a.mean), Math.abs(b.mean))}
        unit="Mean log-probability per target; separate unit"
      />
      <Controls>
        <Slider label="B target count" value={count} onChange={setCount} min={1} max={8} step={1} />
        <Slider label="Each B target probability" value={p} onChange={setP} min={0.05} max={0.95} />
        <Check label="Make B tokens identical to A" value={equal} onChange={setEqual} />
        <Reset
          onClick={() => {
            setCount(4);
            setP(0.5);
            setEqual(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
function MaskTokens({ model, mode = 'response', index = 0 }) {
  return (
    <div className="rf-token-row" style={colorStyle(index)}>
      {model.tokens.map((token, i) => {
        const active =
          i > 0 && (mode === 'full' ? token.kind !== 'pad' : token.kind === 'response');
        return (
          <span
            key={i}
            className={`rf-token${active ? ' rf-token--active' : ''}`}
            data-token-kind={token.kind}
            data-target-active={active}
          >
            {token.text}
            <small>
              position {i}; ID {token.id}
            </small>
            <small>{i === 0 ? 'No preceding predictor' : `predictor ${i - 1} → target ${i}`}</small>
            <small>loss mask {active ? 1 : 0}</small>
          </span>
        );
      })}
    </div>
  );
}
export function CausalTargetMask() {
  const [prompt, setPrompt] = useState(2),
    [response, setResponse] = useState(2),
    [padding, setPadding] = useState(2),
    [shared, setShared] = useState(false),
    model = M.packedTokens(prompt, response, padding, shared);
  return (
    <Figure id="D16" label="Causal context and response targets are different position sets">
      <p>
        This variable-length toy prefix illustrates token addresses; the complete visitor note
        appears above. Prompt tokens remain causal context while their response-loss masks stay
        zero.
      </p>
      <MaskTokens model={model} />
      <p data-target-count={model.count}>
        {model.count
          ? `${model.count} response targets including genuine EOS. Right padding contributes no target.`
          : 'No response targets; mean score is invalid.'}{' '}
        {shared &&
          'EOS and PAD share ID 2 here; position and attention masks still distinguish them.'}
      </p>
      <Controls>
        <Slider
          label="Prompt token count"
          value={prompt}
          onChange={setPrompt}
          min={1}
          max={4}
          step={1}
        />
        <Slider
          label="Response token count"
          value={response}
          onChange={setResponse}
          min={0}
          max={4}
          step={1}
        />
        <Slider
          label="Padding token count"
          value={padding}
          onChange={setPadding}
          min={0}
          max={4}
          step={1}
        />
        <Check label="EOS and PAD share an ID" value={shared} onChange={setShared} />
        <Reset
          onClick={() => {
            setPrompt(2);
            setResponse(2);
            setPadding(2);
            setShared(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function RelativeGainCoordinates() {
  const [pa, setPA] = useState(-2),
    [pb, setPB] = useState(-4),
    [tau, setTau] = useState(0.5),
    model = M.gains([pa, pb], [-3, -3.5], tau);
  return (
    <Figure id="D17" label="Four scores produce relative gains and a raw margin">
      <RLAIFTable
        caption="Mean response log scores; reference is frozen"
        headers={['Response', 'Policy', 'Frozen reference', 'Relative gain']}
        rows={model.policy.map((v, i) => [
          M.candidateNames[i],
          f(v),
          f(model.reference[i]),
          `${f(v)} − (${f(model.reference[i])}) = ${f(model.gains[i])}`,
        ])}
      />
      <SignedBars
        values={model.gains}
        names={['A relative gain', 'B relative gain']}
        extent={Math.max(1, ...model.gains.map(Math.abs))}
        unit="Mean-score gain; shared zero"
      />
      <div className="rf-brace">
        <p data-raw-margin={model.h}>Raw h = gain A − gain B = {f(model.h)}</p>
        <p>
          Scaled coordinate τh = {f(tau)} × {f(model.h)} = {f(model.scaled)}. These are different
          units.
        </p>
      </div>
      <Controls>
        <Slider
          label="Policy mean score A"
          value={pa}
          onChange={setPA}
          min={-6}
          max={0}
          step={0.1}
        />
        <Slider
          label="Policy mean score B"
          value={pb}
          onChange={setPB}
          min={-6}
          max={0}
          step={0.1}
        />
        <Slider label="τ" value={tau} onChange={setTau} min={0.1} max={2} step={0.1} />
        <Reset
          onClick={() => {
            setPA(-2);
            setPB(-4);
            setTau(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function IPOAndDPOCoordinates() {
  const [h, setH] = useState(0),
    [tau, setTau] = useState(0.5),
    [beta, setBeta] = useState(0.5),
    [factor, setFactor] = useState(false),
    model = M.preferenceLoss(h, tau, beta, factor);
  const range = [-2, Math.max(4, model.target + 2, h + 1)];
  const points = (key) =>
    M.scalarSamples((x) => M.preferenceLoss(x, tau, beta, factor)[key], ...range);
  return (
    <Figure id="D18" label="Finite IPO target and bounded DPO raw-margin derivative">
      <div className="rf-stack">
        <Curve
          series={[{ points: points('DPO'), color: M.methodColors.DPO }]}
          xRange={range}
          yRange={[0, Math.max(...points('DPO').map(([, y]) => y))]}
          cursor={h}
          xLabel="Raw h"
          yLabel="DPO loss"
        />
        <Curve
          series={[{ points: points('IPO'), color: M.methodColors.IPO }]}
          xRange={range}
          yRange={[0, Math.max(...points('IPO').map(([, y]) => y))]}
          cursor={h}
          xLabel="Raw h"
          yLabel="IPO squared loss"
          marker={{ x: model.target }}
        />
        <p className="rf-note">
          Gray dashed line: finite IPO target c={f(model.target)}. Amber dashed line: current raw h=
          {f(h)}.
        </p>
        <Curve
          series={[
            { points: points('DPODerivative'), color: M.methodColors.DPO },
            { points: points('IPODerivative'), color: M.methodColors.IPO },
          ]}
          xRange={range}
          yRange={[
            Math.min(...points('IPODerivative').map(([, y]) => y), -beta),
            Math.max(...points('IPODerivative').map(([, y]) => y), 0.1),
          ]}
          cursor={h}
          xLabel="Raw h"
          yLabel="Derivative with respect to raw h"
        />
      </div>
      <Key names={['DPO', 'IPO']} palette={[M.methodColors.DPO, M.methodColors.IPO]} />
      <p data-ipo-target={model.target}>
        IPO target c=1/(2τ)={f(model.target)}; current loss={f(model.IPO)}, derivative=
        {f(model.IPODerivative)}. DPO loss={f(model.DPO)}, derivative={f(model.DPODerivative)},
        bounded between −β and 0.
      </p>
      <Controls>
        <Slider
          label="Raw preference margin h"
          value={h}
          onChange={setH}
          min={-2}
          max={8}
          step={0.1}
        />
        <Slider label="IPO τ" value={tau} onChange={setTau} min={0.1} max={2} step={0.1} />
        <Slider label="DPO β" value={beta} onChange={setBeta} min={0} max={2} step={0.1} />
        <Check
          label="Include published τ prefactor on IPO loss"
          value={factor}
          onChange={setFactor}
        />
        <Reset
          onClick={() => {
            setH(0);
            setTau(0.5);
            setBeta(0.5);
            setFactor(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function ContradictoryPreferenceCounts() {
  const [wins, setWins] = useState(7),
    [losses, setLosses] = useState(3),
    [tau, setTau] = useState(0.5),
    model = M.contradictory(wins, losses, tau);
  const points = model
    ? M.scalarSamples((h) => M.contradictory(wins, losses, tau, h).loss, -model.c * 2, model.c * 2)
    : [];
  return (
    <Figure
      id="D19"
      label="Repeated contradictory labels define an expected square, not independently satisfiable pairs"
    >
      <div className="rf-token-row">
        {Array.from({ length: wins }, (_, i) => (
          <span key={`w${i}`} className="rf-token rf-token--active" style={colorStyle(0)}>
            A &gt; B
          </span>
        ))}
        {Array.from({ length: losses }, (_, i) => (
          <span key={`l${i}`} className="rf-token rf-token--active" style={colorStyle(1)}>
            B &gt; A
          </span>
        ))}
      </div>
      {model ? (
        <>
          <div className="rf-brace">
            <p>
              {wins}+{losses}={wins + losses} comparisons; q={wins}/{wins + losses}={f(model.q)}
            </p>
            <p>
              Expected loss = {f(model.q)}(h−{f(model.c)})² + {f(1 - model.q)}(h+{f(model.c)})²
            </p>
          </div>
          <Curve
            series={[{ points, color: M.methodColors.IPO }]}
            xRange={[-model.c * 2, model.c * 2]}
            yRange={[0, Math.max(...points.map(([, y]) => y))]}
            cursor={model.optimum}
            xLabel="Raw h"
            yLabel="Expected squared loss"
          />
          <p data-optimum={model.optimum}>
            Optimum h*={f(model.optimum)}; minimum={f(model.minimum)}. Equal counts make h*=0.
          </p>
        </>
      ) : (
        <p data-optimum="unknown">Zero comparisons: target, optimum and loss are unknown.</p>
      )}
      <Controls>
        <Slider
          label="A preferred count"
          value={wins}
          onChange={setWins}
          min={0}
          max={12}
          step={1}
        />
        <Slider
          label="B preferred count"
          value={losses}
          onChange={setLosses}
          min={0}
          max={12}
          step={1}
        />
        <Slider label="τ" value={tau} onChange={setTau} min={0.1} max={2} step={0.1} />
        <Reset
          onClick={() => {
            setWins(7);
            setLosses(3);
            setTau(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function FourActionPreferenceMatrix() {
  const [matrix, setMatrix] = useState(M.publishedMatrix.map((row) => [...row])),
    [row, setRow] = useState(0),
    [column, setColumn] = useState(1);
  const means = matrix.map((values) => M.sum(values) / 4);
  return (
    <Figure id="D20" label="A nontransitive preference cycle and its complete probability matrix">
      <RLAIFScroll label="Four-action preference probability matrix">
        <table className="rf-table rf-matrix">
          <caption>Cell (row, column) = P(row preferred to column)</caption>
          <thead>
            <tr>
              <th>Row / column</th>
              {M.candidateNames.map((name, i) => (
                <th key={name} style={{ color: colors[i] }}>
                  {name}
                </th>
              ))}
              <th>Uniform row mean</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((values, i) => (
              <tr key={i}>
                <th style={{ color: colors[i] }}>{M.candidateNames[i]}</th>
                {values.map((p, j) => (
                  <td
                    key={j}
                    className={i === row && j === column ? 'rf-selected' : ''}
                    style={{ background: `rgba(118,184,255,${p * 0.5})` }}
                  >
                    {f(p)}
                  </td>
                ))}
                <td>{f(means[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </RLAIFScroll>
      <Svg height={270} label="Majority edges from the currently displayed preference matrix">
        {[
          { x: 115, y: 75 },
          { x: 335, y: 75 },
          { x: 225, y: 225 },
          { x: 525, y: 145 },
        ].map((point, i, positions) => (
          <g key={i}>
            {positions.map((other, j) => {
              if (j === i || matrix[i][j] <= 0.5) return null;
              const angle = Math.atan2(other.y - point.y, other.x - point.x);
              return (
                <Arrow
                  key={j}
                  x1={point.x + Math.cos(angle) * 29}
                  y1={point.y + Math.sin(angle) * 29}
                  x2={other.x - Math.cos(angle) * 29}
                  y2={other.y - Math.sin(angle) * 29}
                  color={colors[i]}
                />
              );
            })}
            <circle
              cx={point.x}
              cy={point.y}
              r={27}
              fill="#17181d"
              stroke={colors[i]}
              strokeWidth="2"
            />
            <Text x={point.x} y={point.y + 6} anchor="middle" color={colors[i]}>
              {M.candidateNames[i]}
            </Text>
          </g>
        ))}
      </Svg>
      <p>
        The blue/rose/violet cycle can coexist with D's advantages. The matrix shade is magnitude;
        node hue is response identity.
      </p>
      <Controls>
        <Select
          label="Preference row"
          value={row}
          onChange={(v) => {
            const next = Number(v);
            setRow(next);
            if (next === column) setColumn((next + 1) % 4);
          }}
          options={M.candidateNames.map((name, i) => [`${i}`, name])}
        />
        <Select
          label="Preference column"
          value={column}
          onChange={(v) => setColumn(Number(v))}
          options={M.candidateNames
            .map((name, i) => [`${i}`, name])
            .filter(([id]) => Number(id) !== row)}
        />
        <Slider
          label="Selected off-diagonal probability"
          value={matrix[row][column]}
          onChange={(v) => setMatrix((current) => M.matrixEdit(current, row, column, v))}
        />
        <button
          type="button"
          onClick={() => setMatrix(Array.from({ length: 4 }, () => Array(4).fill(0.5)))}
        >
          All ties
        </button>
        <Reset
          onClick={() => {
            setMatrix(M.publishedMatrix.map((values) => [...values]));
            setRow(0);
            setColumn(1);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function PreferenceTransformTilt() {
  const [tau, setTau] = useState(0.1),
    [transform, setTransform] = useState('identity'),
    [weight, setWeight] = useState(0.25),
    [refA, setRefA] = useState(0.25),
    [offset, setOffset] = useState(0);
  const model = M.tilt(
    M.publishedMatrix,
    [weight, (1 - weight) / 3, (1 - weight) / 3, (1 - weight) / 3],
    [refA, (1 - refA) / 3, (1 - refA) / 3, (1 - refA) / 3],
    tau,
    transform,
    offset,
  );
  return (
    <Figure
      id="D21"
      label="Transform preference probabilities, average over behavior, then tilt the reference"
    >
      <div className="rf-grid">
        <Curve
          small
          series={[{ points: M.scalarSamples((p) => p, 0.01, 0.99), color: colors[0] }]}
          xRange={[0, 1]}
          yRange={[0, 1]}
          xLabel="Preference p"
          yLabel="Identity Ψ(p)=p"
        />
        <Curve
          small
          series={[
            { points: M.scalarSamples((p) => Math.log(p / (1 - p)), 0.01, 0.99), color: colors[2] },
          ]}
          xRange={[0, 1]}
          yRange={[-5, 5]}
          xLabel="Preference p"
          yLabel="Logit Ψ(p)"
        />
      </div>
      {model?.valid ? (
        <>
          <RLAIFTable
            caption="Each transformed row is averaged using the displayed behavior weights"
            headers={[
              'Response',
              'Behavior μ',
              'Average transformed score + offset',
              'Frozen reference',
              'log reference + score/τ',
            ]}
            rows={model.scores.map((value, i) => [
              M.candidateNames[i],
              f(model.mu[i]),
              f(value),
              f(model.ref[i]),
              f(model.logWeights[i]),
            ])}
          />
          <p>
            Normalize the exponentiated log weights; subtracting a common maximum only stabilizes
            arithmetic.
          </p>
          <Areas values={model.policy} names={M.candidateNames.map((name) => `Policy ${name}`)} />
          <p data-policy-a={model.policy[0]}>
            A common score offset leaves this normalized policy unchanged. Zero reference support
            excludes that response.
          </p>
        </>
      ) : (
        <p>Unknown: {model?.reason || 'invalid weights or temperature'}.</p>
      )}
      <Controls>
        <Select
          label="Probability transform"
          value={transform}
          onChange={setTransform}
          options={['identity', 'logit']}
        />
        <Slider label="Behavior weight on A" value={weight} onChange={setWeight} />
        <Slider label="Frozen reference mass on A" value={refA} onChange={setRefA} />
        <Slider label="τ" value={tau} onChange={setTau} min={0.05} max={1} step={0.05} />
        <Slider
          label="Common score offset"
          value={offset}
          onChange={setOffset}
          min={-2}
          max={2}
          step={0.1}
        />
        <Reset
          onClick={() => {
            setTau(0.1);
            setTransform('identity');
            setWeight(0.25);
            setRefA(0.25);
            setOffset(0);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function MissingSupportSimplex() {
  const [mass, setMass] = useState(0.3),
    [connected, setConnected] = useState(false),
    [empty, setEmpty] = useState(false),
    model = M.supportFamily(mass, connected, empty),
    alternate = M.supportFamily(0.9);
  const point = (p) => [75 * p[0] + 565 * p[1] + 320 * p[2], 305 * p[0] + 305 * p[1] + 45 * p[2]];
  const selected = model.policy ? point(model.policy) : null;
  const ends = [point(M.supportFamily(0).policy), point(M.supportFamily(1).policy)];
  return (
    <Figure id="D22" label="An observed A/B ratio leaves an unobserved C probability unconstrained">
      <Svg height={365} label="Three-action probability simplex with constant A/B ratio family">
        <path d="M75,305L565,305L320,45Z" fill="none" stroke="#989caa" />
        <Text x={65} y={335} color={colors[0]}>
          A=1
        </Text>
        <Text x={565} y={335} anchor="end" color={colors[1]}>
          B=1
        </Text>
        <Text x={320} y={25} anchor="middle" color={colors[2]}>
          C=1
        </Text>
        {!empty && (
          <Line
            x1={ends[0][0]}
            y1={ends[0][1]}
            x2={ends[1][0]}
            y2={ends[1][1]}
            color="#f0bd68"
            dashed
          />
        )}
        {!empty && !connected && (
          <circle
            cx={point(alternate.policy)[0]}
            cy={point(alternate.policy)[1]}
            r={7}
            fill="none"
            stroke="#9396a2"
            strokeWidth="2"
          />
        )}
        {selected && <circle cx={selected[0]} cy={selected[1]} r={9} fill="#f0bd68" />}
        <Text x={20} y={360}>
          {empty
            ? 'No observed comparisons.'
            : connected
              ? 'A/B=e and A/C=e: unique normalized point.'
              : 'Dashed family: A/B=e; C remains free.'}
        </Text>
      </Svg>
      {model.policy ? (
        <>
          <Areas values={model.policy} names={['A', 'B', 'C']} />
          <p data-support-h={model.h}>
            Observed hAB={f(model.h)}, observed square={f(model.loss)}.{' '}
            {connected
              ? `Adding A>C with target 1 sets hAC=${f(model.AC)}.`
              : `A second policy with observed mass .9 is [${alternate.policy.map((v) => f(v)).join(', ')}], with the same hAB=1.`}
          </p>
        </>
      ) : (
        <p>No fitted comparison or optimum is defined.</p>
      )}
      <Controls>
        <Slider
          label="Total observed A+B mass"
          value={mass}
          onChange={setMass}
          min={0.05}
          max={1}
        />
        <Check label="Add A>C with the same target 1" value={connected} onChange={setConnected} />
        <Check label="Empty observed support" value={empty} onChange={setEmpty} />
        <Reset
          onClick={() => {
            setMass(0.3);
            setConnected(false);
            setEmpty(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function GeometricTokenPool() {
  const [count, setCount] = useState(4),
    [p, setP] = useState(0.5),
    a = M.tokenScore([0.8, 0.5]),
    b = M.tokenScore(Array(count).fill(p));
  return (
    <Figure id="D23" label="Geometric token score is distinct from whole-string likelihood">
      <div className="rf-grid">
        <TokenScores model={a} index={0} />
        <TokenScores model={b} index={1} />
      </div>
      <RLAIFTable
        caption="Exponentiating a sum and a mean produces different quantities"
        headers={['Response', 'Whole-string product exp(sum)', 'Geometric score exp(mean)']}
        rows={[
          ['A', f(a.product), f(a.geometric)],
          ['B', f(b.product), f(b.geometric)],
        ]}
      />
      <p data-geometric-b={b.geometric}>
        Repeated identical B token probabilities leave its geometric score at {f(b.geometric)},
        while its product changes with length. Geometric scores do not form a probability
        distribution over responses.
      </p>
      <Controls>
        <Slider label="B target count" value={count} onChange={setCount} min={1} max={8} step={1} />
        <Slider label="Each B token probability" value={p} onChange={setP} min={0} max={1} />
        <Reset
          onClick={() => {
            setCount(4);
            setP(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function OddsContrast() {
  const [a, setA] = useState(Math.sqrt(0.4)),
    [b, setB] = useState(0.5),
    model = a === '' || b === '' ? null : M.oddsContrast(a, b);
  return (
    <Figure id="D24" label="Compare the odds of two geometric token scores">
      <p>Geometric scores qA and qB, each on its own 0–1 ruler</p>
      <Areas
        values={a !== '' && a >= 0 && a <= 1 ? [a, 1 - a] : null}
        names={['A geometric score', '1−qA']}
        palette={[colors[0], '#777b89']}
      />
      <Areas
        values={b !== '' && b >= 0 && b <= 1 ? [b, 1 - b] : null}
        names={['B geometric score', '1−qB']}
        palette={[colors[1], '#777b89']}
      />
      {model?.valid ? (
        <>
          <RLAIFTable
            caption="Odds operations; these scores do not normalize across responses"
            headers={['Response', 'q / (1−q)', 'log odds']}
            rows={[
              ['A', `${f(a)} / ${f(1 - a)} = ${f(a / (1 - a))}`, f(model.logOdds[0])],
              ['B', `${f(b)} / ${f(1 - b)} = ${f(b / (1 - b))}`, f(model.logOdds[1])],
            ]}
          />
          <p data-odds-margin={model.margin}>
            Log-odds margin={f(model.margin)}; sigmoid comparison={f(model.probability)}; contrast
            softplus(−margin)={f(model.loss)}.
          </p>
        </>
      ) : (
        <p data-odds-margin="unknown">Unknown: {model?.reason || 'invalid scores'}.</p>
      )}
      <Controls>
        <Numeric label="Geometric score qA" value={a} onChange={setA} min={0} max={1} step="any" />
        <Numeric label="Geometric score qB" value={b} onChange={setB} min={0} max={1} step="any" />
        <button
          type="button"
          onClick={() => {
            setA(0.5);
            setB(0.5);
          }}
        >
          Equal scores
        </button>
        <Reset
          onClick={() => {
            setA(Math.sqrt(0.4));
            setB(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SharedWeightGradients() {
  const [lambda, setLambda] = useState(0.1),
    [xB, setXB] = useState(3),
    [theta, setTheta] = useState(0),
    [rate, setRate] = useState(0.01),
    model = M.sharedWeight(theta, 1, xB, lambda, rate);
  return (
    <Figure id="D25" label="SFT and odds gradients meet at the same parameter">
      <Svg
        height={330}
        label="One scalar parameter feeds both chosen and rejected next-token probabilities"
      >
        <circle cx={95} cy={160} r={38} fill="none" stroke="#f0bd68" strokeWidth="2" />
        <Text x={95} y={154} anchor="middle">
          Shared θ
        </Text>
        <Text x={95} y={180} anchor="middle">
          {f(theta)}
        </Text>
        <Arrow x1={128} y1={139} x2={260} y2={80} />
        <Arrow x1={128} y1={181} x2={260} y2={235} />
        <Text x={160} y={85}>
          xA=1
        </Text>
        <Text x={160} y={246}>
          xB={f(xB)}
        </Text>
        <Text x={280} y={69} color={colors[0]}>
          A logit θxA={f(theta)}
        </Text>
        <Text x={280} y={101} color={colors[0]}>
          pA=sigmoid(θxA)={f(model.p[0])}
        </Text>
        <Text x={280} y={222} color={colors[1]}>
          B logit θxB={f(theta * xB)}
        </Text>
        <Text x={280} y={254} color={colors[1]}>
          pB=sigmoid(θxB)={f(model.p[1])}
        </Text>
        <Arrow x1={270} y1={120} x2={138} y2={157} color={colors[0]} dashed />
        <Arrow x1={270} y1={206} x2={138} y2={172} color={colors[1]} dashed />
        <Text x={360} y={163} anchor="middle">
          Dashed: component gradients return to θ.
        </Text>
      </Svg>
      <SignedBars
        values={[model.sftGradient, model.weighted, model.total]}
        names={['SFT derivative', 'λ × contrast derivative', 'Total derivative']}
        palette={[colors[0], colors[1], '#f0bd68']}
        unit="Derivative with respect to the same θ"
      />
      <p data-total-gradient={model.total}>
        Contrast derivative={f(model.contrastGradient)}. Update θ′={f(theta)}−{f(rate)}×(
        {f(model.total)})={f(model.after)}. At λ=.5, xB=3, θ=0, the two contributions cancel.
      </p>
      <Controls>
        <Slider
          label="Contrast coefficient λ"
          value={lambda}
          onChange={setLambda}
          min={0}
          max={1}
          step={0.05}
        />
        <Slider label="Rejected feature xB" value={xB} onChange={setXB} min={-3} max={4} step={1} />
        <Slider
          label="Current shared θ"
          value={theta}
          onChange={setTheta}
          min={-1}
          max={1}
          step={0.1}
        />
        <Slider
          label="Learning rate"
          value={rate}
          onChange={setRate}
          min={0}
          max={0.1}
          step={0.01}
        />
        <Reset
          onClick={() => {
            setLambda(0.1);
            setXB(3);
            setTheta(0);
            setRate(0.01);
          }}
        />
      </Controls>
    </Figure>
  );
}

function RecordContext({ record }) {
  return (
    <>
      <dl className="rf-record">
        <dt>Prompt · {record.id}</dt>
        <dd>{record.prompt}</dd>
        <dt>Historical AI source scores</dt>
        <dd>
          Chosen A: {record.source_score_chosen}; rejected B: {record.source_score_rejected}. These
          are retained labels, not ground truth.
        </dd>
      </dl>
      <div className="rf-grid">
        <Response index={0} text={record.chosen}>
          <p>
            {record.chosen_ids.length} response targets; {record.chosen_unknowns} unknown IDs.
          </p>
        </Response>
        <Response index={1} text={record.rejected}>
          <p>
            {record.rejected_ids.length} response targets; {record.rejected_unknowns} unknown IDs.
          </p>
        </Response>
      </div>
    </>
  );
}
export function TinyCausalArchitecture() {
  const state = useObservation('records');
  const [target, setTarget] = useState(0);
  return (
    <Figure id="D26" label="The same causal decoder supplies token scores to different losses">
      <ObservationState state={state}>
        {(data) => {
          const record = data.rows.train[0],
            ids = [...record.prompt_ids, ...record.chosen_ids],
            position = record.prompt_ids.length + target,
            predictor = position - 1;
          return (
            <>
              <p>
                Actual retained record {record.id}: {ids.length} visible IDs. The common TinyLM has
                width 24, 2 heads, one block, context 196 and vocabulary{' '}
                {Object.keys(data.vocabulary).length}. No browser model forward is being run.
              </p>
              <Svg
                height={435}
                label="Causal decoder dimensions and the selected predictor-to-target address"
              >
                <Text x={20} y={28}>
                  Input IDs [B=1, T={ids.length}]
                </Text>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <rect
                      x={25 + i * 66}
                      y={45}
                      width={55}
                      height={35}
                      fill="none"
                      stroke="#76b8ff"
                    />
                    <Text x={52 + i * 66} y={69} anchor="middle">
                      {ids[i]}
                    </Text>
                  </g>
                ))}
                <Text x={375} y={69}>
                  … all {ids.length} positions
                </Text>
                <Arrow x1={210} y1={88} x2={210} y2={120} />
                <Text x={20} y={151}>
                  Token embedding [1022,24] + position embedding [196,24]
                </Text>
                <Arrow x1={210} y1={161} x2={210} y2={185} />
                {Array.from({ length: 5 }, (_, r) =>
                  Array.from({ length: 5 }, (_, c) => (
                    <rect
                      key={`${r}-${c}`}
                      x={30 + c * 24}
                      y={198 + r * 24}
                      width={21}
                      height={21}
                      fill={c <= r ? '#76d0d9' : '#373943'}
                    />
                  )),
                )}
                <Text x={190} y={219}>
                  Causal block: earlier positions + self only
                </Text>
                <Text x={190} y={250}>
                  2 heads × 12 dimensions; residual paths
                </Text>
                <Text x={190} y={281}>
                  Norm + vocabulary projection
                </Text>
                <Arrow x1={210} y1={320} x2={210} y2={344} />
                <Text x={20} y={372}>
                  Output logits [1,{ids.length},1022] → log-softmax → aligned gather
                </Text>
                <Text x={20} y={408}>
                  Selected predictor {predictor} supplies target ID {ids[position]} at position{' '}
                  {position}.
                </Text>
              </Svg>
              <RLAIFScroll label="Full selected causal row; each input position remains visible">
                <div className="rf-token-row" style={{ flexWrap: 'nowrap', width: 'max-content' }}>
                  {ids.map((id, i) => (
                    <span
                      key={i}
                      className={`rf-token${i === predictor ? ' rf-selected' : ''}`}
                      style={{ opacity: i <= predictor ? 1 : 0.45 }}
                      data-causal-allowed={i <= predictor}
                    >
                      ID {id}
                      <small>position {i}</small>
                      <small>{i <= predictor ? 'allowed' : 'future'}</small>
                    </span>
                  ))}
                </div>
              </RLAIFScroll>
              <p>
                Completion mask allows a loss at this target. It does not prohibit that target's
                gradient from reaching earlier embedding/attention parameters. The 5×5 triangle
                above is a mask illustration, not recorded attention magnitudes.
              </p>
              <Controls>
                <Slider
                  label="Selected chosen response target offset"
                  value={target}
                  onChange={setTarget}
                  min={0}
                  max={record.chosen_ids.length - 1}
                  step={1}
                />
                <Reset onClick={() => setTarget(0)} />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function SharedWarmStartFork() {
  const state = useObservation('training'),
    [seedIndex, setSeedIndex] = useState(0),
    [checkpointIndex, setCheckpointIndex] = useState(0);
  return (
    <Figure id="D27" label="Every objective starts from the same saved SFT state">
      <ObservationState state={state}>
        {(data) => {
          const seed = data.seeds[seedIndex],
            methods = Object.keys(seed.methods);
          return (
            <>
              <p>
                Seed {seed.seed}; one saved SFT warm start after {seed.warm_updates.length} updates.
              </p>
              <p className="rf-value">Warm state SHA256: {seed.warm_state_sha256}</p>
              <Svg
                height={215}
                label="A single saved warm state forks into four independently updated parameter copies"
              >
                <Text x={320} y={28} anchor="middle">
                  Saved warm state
                </Text>
                <Line x1={320} y1={40} x2={320} y2={65} />
                <Line x1={75} y1={65} x2={565} y2={65} />
                {methods.map((name, i) => {
                  const x = 75 + i * (490 / 3);
                  return (
                    <g key={name}>
                      <Arrow x1={x} y1={65} x2={x} y2={112} color={M.methodColors[name]} />
                      <Text x={x} y={143} anchor="middle" color={M.methodColors[name]}>
                        {name}
                      </Text>
                      <Text x={x} y={177} anchor="middle">
                        step {seed.methods[name].checkpoints[checkpointIndex].step}
                      </Text>
                    </g>
                  );
                })}
              </Svg>
              <RLAIFTable
                caption="Literal saved identities of separate parameter copies"
                headers={['Arm', 'Clone start equals warm?', 'Selected state SHA256']}
                rows={methods.map((name) => [
                  name,
                  seed.methods[name].start_state_sha256 === seed.warm_state_sha256 ? 'Yes' : 'No',
                  seed.methods[name].checkpoints[checkpointIndex].state_sha256,
                ])}
              />
              <div className="rf-frozen">
                <p>
                  Reference snapshot is the same warm state: {seed.warm_state_sha256}. It is not
                  another optimizing arm.
                </p>
              </div>
              <p>
                ORPO here is the declared warm-started response-only variant. Objective colours
                label methods locally, rather than candidate identities.
              </p>
              <Controls>
                <Select
                  label="Retained seed"
                  value={seedIndex}
                  onChange={(v) => {
                    setSeedIndex(Number(v));
                    setCheckpointIndex(0);
                  }}
                  options={data.seeds.map((s, i) => [`${i}`, `${s.seed}`])}
                />
                <Slider
                  label="Saved checkpoint index"
                  value={checkpointIndex}
                  onChange={setCheckpointIndex}
                  min={0}
                  max={seed.methods.SFT.checkpoints.length - 1}
                  step={1}
                />
                <Reset
                  onClick={() => {
                    setSeedIndex(0);
                    setCheckpointIndex(0);
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function TrainerTargetMasks() {
  const state = useObservation('native'),
    [full, setFull] = useState(true),
    [row, setRow] = useState(0);
  return (
    <Figure id="D28" label="Native IPO and ORPO use distinct score and imitation masks">
      <ObservationState state={state}>
        {(data) => {
          const ipo = data.results.find((result) => result.method === 'IPO'),
            orpo = data.results.find((result) => result.method === 'ORPO');
          const ids = ipo.native_batch.input_ids[row],
            attention = ipo.native_batch.attention_mask[row],
            completion = ipo.native_batch.completion_mask[row];
          const count = completion.slice(1).filter((v, i) => v && attention[i + 1]).length;
          return (
            <>
              <p>
                Actual GPT-2 prepared chosen row {data.ids[row]}: IPO β=.5 uses completion-mean
                reference gains. Experimental ORPO λ=.1 uses response-mean odds, plus{' '}
                {full
                  ? 'full nonpadding chosen-token NLL'
                  : 'a deliberately changed response-only NLL'}
                .
              </p>
              <RLAIFScroll label="Actual prepared IDs with response and chosen-NLL target masks">
                <table className="rf-table rf-matrix rf-native-mask">
                  <caption>Every prepared position; native masked values are retained</caption>
                  <tbody>
                    <tr>
                      <th>Position</th>
                      {ids.map((id, i) => (
                        <td key={i}>{i}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>Token ID</th>
                      {ids.map((id, i) => (
                        <td key={i}>{id}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>Visible input</th>
                      {attention.map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>Response target</th>
                      {completion.map((v, i) => (
                        <td key={i} className={v && i > 0 && attention[i] ? 'rf-selected' : ''}>
                          {i > 0 && attention[i] ? v : 0}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th>Chosen NLL target</th>
                      {ids.map((id, i) => (
                        <td
                          key={i}
                          style={{
                            background:
                              i > 0 && attention[i] && (full || completion[i])
                                ? 'rgba(230,163,189,.25)'
                                : undefined,
                          }}
                        >
                          {i > 0 && attention[i] && (full || completion[i]) ? 1 : 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </RLAIFScroll>
              <p>
                Selected row has {count} response targets. Native batch totals:{' '}
                {orpo.details.full_prompt_target_count} full chosen targets versus{' '}
                {orpo.details.response_target_count} response targets.
              </p>
              <p
                data-native-nll={
                  full
                    ? orpo.details.full_prompt_chosen_nll
                    : orpo.details.response_only_equal_response_nll
                }
              >
                Current aggregate NLL=
                {f(
                  full
                    ? orpo.details.full_prompt_chosen_nll
                    : orpo.details.response_only_equal_response_nll,
                  8,
                )}
                . The response-only comparison also uses equal-response weighting; this is an
                intentional convention change, not a parity failure.
              </p>
              <Controls>
                <Select
                  label="Actual chosen batch row"
                  value={row}
                  onChange={(v) => setRow(Number(v))}
                  options={data.ids.map((id, i) => [`${i}`, id])}
                />
                <Check label="Library full-prompt chosen NLL" value={full} onChange={setFull} />
                <Reset
                  onClick={() => {
                    setRow(0);
                    setFull(true);
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function NativeExplicitBridge() {
  const state = useObservation('native'),
    [method, setMethod] = useState('IPO'),
    [wrong, setWrong] = useState(false);
  return (
    <Figure id="D29" label="Compare native and explicit operations on exactly the same model state">
      <ObservationState state={state}>
        {(data) => {
          const result = data.results.find((item) => item.method === method);
          const responseDelta =
            method === 'ORPO'
              ? result.details.response_only_equal_response_nll -
                result.details.full_prompt_chosen_nll
              : null;
          const changedLoss =
            method === 'ORPO' ? result.explicit_loss + responseDelta : result.explicit_loss;
          return (
            <>
              <p>
                Actual {method} native comparison; Torch {data.versions.torch}, Transformers{' '}
                {data.versions.transformers}, TRL {data.versions.trl}, CPU float32, dropout 0.
              </p>
              <RLAIFTable
                caption="One forward/gradient/SGD bridge; not training quality"
                headers={['Quantity', 'Native', 'Matched explicit', 'Difference']}
                rows={[
                  [
                    'Loss',
                    f(result.native_loss, 9),
                    f(result.explicit_loss, 9),
                    f(result.loss_difference, 12),
                  ],
                  [
                    'Maximum gradient discrepancy',
                    'All parameter coordinates',
                    'Same initial weights/batch',
                    <span className="rf-number">
                      {result.max_gradient_difference.toExponential(3)}
                    </span>,
                  ],
                  [
                    'Maximum one-update parameter discrepancy',
                    '1 SGD update',
                    '1 matching SGD update',
                    <span className="rf-number">
                      {result.max_one_update_parameter_difference.toExponential(3)}
                    </span>,
                  ],
                ]}
              />
              <p className="rf-value">Shared start state SHA256: {result.start_state_sha256}</p>
              {method === 'ORPO' ? (
                <RLAIFTable
                  caption="Actual ORPO response components by real pair"
                  headers={[
                    'Pair ID',
                    'Chosen mean',
                    'Rejected mean',
                    'Odds margin',
                    'Contrast loss',
                  ]}
                  rows={data.ids.map((id, i) => [
                    id,
                    f(result.details.response_means[i], 8),
                    f(result.details.response_means[i + data.ids.length], 8),
                    f(result.details.odds_margin[i], 8),
                    f(result.details.contrast[i], 8),
                  ])}
                />
              ) : (
                <p>
                  Actual relative mean margins: [{result.details.margin.join(', ')}], target{' '}
                  {result.details.target}. At the identical reference snapshot these gains are
                  exactly zero.
                </p>
              )}
              <p data-bridge-loss={wrong ? changedLoss : result.explicit_loss}>
                {wrong && method === 'ORPO'
                  ? `Changing to response-only equal-response NLL gives loss ${f(changedLoss, 9)}; deliberate NLL delta ${f(responseDelta, 9)}. Gradient/update parity above belongs to the matched full convention.`
                  : wrong
                    ? 'At this identical IPO reference snapshot, switching mean to sum still gives zero relative margin. This null example cannot detect the wrong reduction; the unequal-length score investigation above does.'
                    : 'Matched conventions agree within float32 rounding. The small TinyLM study uses a separate architecture.'}
              </p>
              <Controls>
                <Select
                  label="Native contract"
                  value={method}
                  onChange={setMethod}
                  options={['IPO', 'ORPO']}
                />
                <Check
                  label="Inspect deliberately changed reduction"
                  value={wrong}
                  onChange={setWrong}
                />
                <Reset
                  onClick={() => {
                    setMethod('IPO');
                    setWrong(false);
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function RealFeedbackPair() {
  const state = useObservation('records'),
    [split, setSplit] = useState('train'),
    [index, setIndex] = useState(0);
  return (
    <Figure id="D30" label="Retained real AI-labelled record with full original context">
      <ObservationState state={state}>
        {(data) => {
          const rows = data.rows[split],
            record = rows[index];
          return (
            <>
              <RecordContext record={record} />
              <p>
                Source split {record.source_split}, row {record.source_row_index}. All context and
                both full answers are retained. Selection required the declared length budget and
                strict supplied-score ordering; tied/inverted scores were excluded before fitting.
              </p>
              <Controls>
                <Select
                  label="Record split"
                  value={split}
                  onChange={(v) => {
                    setSplit(v);
                    setIndex(0);
                  }}
                  options={['train', ['heldout', 'Held out']]}
                />
                <Select
                  label="Real record"
                  value={index}
                  onChange={(v) => setIndex(Number(v))}
                  options={rows.map((row, i) => [`${i}`, row.id])}
                />
                <button
                  type="button"
                  onClick={() => setIndex((current) => (current + rows.length - 1) % rows.length)}
                >
                  Previous record
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((current) => (current + 1) % rows.length)}
                >
                  Next record
                </button>
                <Reset
                  onClick={() => {
                    setSplit('train');
                    setIndex(0);
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
function StudyCurves({ seed, metric }) {
  const methods = Object.keys(seed.methods);
  const series = methods.map((name) => ({
    color: M.methodColors[name],
    points: seed.methods[name].checkpoints.map((point) => [point.step, point.heldout[metric]]),
  }));
  const values = series.flatMap(({ points }) => points.map(([, value]) => value));
  const low = Math.min(...values),
    high = Math.max(...values),
    pad = Math.max(0.01, (high - low) * 0.1);
  return (
    <Curve
      series={series}
      xRange={[0, 80]}
      yRange={[low - pad, high + pad]}
      xLabel="Saved continuation update"
      yLabel="Held-out chosen-token NLL"
    />
  );
}
export function ActualTrainingTrajectories() {
  const state = useObservation('training'),
    [seedIndex, setSeedIndex] = useState(0),
    [method, setMethod] = useState('SFT');
  return (
    <Figure id="D31" label="Actual saved trajectories retain separate objective scales">
      <ObservationState state={state}>
        {(data) => {
          const seed = data.seeds[seedIndex],
            arm = seed.methods[method];
          const objectivePoints = arm.updates.map((point) => [point.update, point.loss]);
          const max = Math.max(...objectivePoints.map(([, value]) => value));
          return (
            <>
              <Key names={Object.keys(M.methodColors)} palette={Object.values(M.methodColors)} />
              <StudyCurves seed={seed} metric="token_weighted_chosen_NLL" />
              <Curve
                series={[{ points: objectivePoints, color: M.methodColors[method] }]}
                xRange={[0, 80]}
                yRange={[0, Math.max(0.1, max * 1.05)]}
                xLabel="Actual training update"
                yLabel={`${method} training objective; own scale`}
              />
              <p>
                Seed {seed.seed}; each curve reads retained values. Selecting a method changes only
                the objective plot; native objective magnitudes are not a quality comparison.
              </p>
              <Controls>
                <Select
                  label="Retained seed"
                  value={seedIndex}
                  onChange={(v) => setSeedIndex(Number(v))}
                  options={data.seeds.map((seed, i) => [`${i}`, `${seed.seed}`])}
                />
                <Select
                  label="Objective plot"
                  value={method}
                  onChange={setMethod}
                  options={Object.keys(M.methodColors)}
                />
                <Reset
                  onClick={() => {
                    setSeedIndex(0);
                    setMethod('SFT');
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function PairedHeldoutOutcomes() {
  const study = useObservation('training'),
    records = useObservation('records');
  const [seedIndex, setSeedIndex] = useState(0),
    [method, setMethod] = useState('IPO'),
    [index, setIndex] = useState(0),
    [metric, setMetric] = useState('relative_mean_margin');
  return (
    <Figure
      id="D32"
      label="Paired held-out diagnostics preserve records, score units and all seeds"
    >
      <ObservationState state={study}>
        {(data) => {
          const seed = data.seeds[seedIndex],
            final = seed.methods[method].checkpoints.at(-1).heldout;
          return (
            <>
              <RLAIFTable
                caption={`All ${final.records.length} terminal held-out records; seed ${seed.seed}, ${method}`}
                headers={[
                  'Same record ID',
                  'Chosen sum − rejected sum',
                  'Chosen mean − rejected mean',
                  'Relative mean margin',
                  'Chosen token NLL',
                ]}
                rows={final.records.map((record, i) => [
                  <span className={i === index ? 'rf-selected' : ''}>{record.id}</span>,
                  f(record.chosen_sum - record.rejected_sum),
                  f(record.chosen_mean - record.rejected_mean),
                  f(record.relative_mean_margin),
                  f(-record.chosen_mean),
                ])}
              />
              <SignedBars
                values={final.records.map((record) =>
                  metric === 'sum_margin'
                    ? record.chosen_sum - record.rejected_sum
                    : metric === 'mean_margin'
                      ? record.chosen_mean - record.rejected_mean
                      : record.relative_mean_margin,
                )}
                names={final.records.map((record) => record.id)}
                unit={
                  metric === 'sum_margin'
                    ? 'Summed log-score margin'
                    : metric === 'mean_margin'
                      ? 'Mean log-score margin per target'
                      : 'Reference-adjusted mean margin per target'
                }
                palette={Array(final.records.length).fill(M.methodColors[method])}
              />
              <RLAIFTable
                caption="Every seed, same selected held-out record; descriptive comparison only"
                headers={[
                  'Seed',
                  'SFT chosen token NLL',
                  `${method} chosen token NLL`,
                  'Paired difference',
                ]}
                rows={data.seeds.map((seed) => {
                  const sft =
                      -seed.methods.SFT.checkpoints.at(-1).heldout.records[index].chosen_mean,
                    selected =
                      -seed.methods[method].checkpoints.at(-1).heldout.records[index].chosen_mean;
                  return [seed.seed, f(sft), f(selected), f(selected - sft)];
                })}
              />
              <ObservationState state={records}>
                {(corpus) => <RecordContext record={corpus.rows.heldout[index]} />}
              </ObservationState>
              <p>
                These are score and token diagnostics against supplied AI labels. No
                generated-response or independent human-quality evaluation was collected.
              </p>
              <Controls>
                <Select
                  label="Retained seed"
                  value={seedIndex}
                  onChange={(v) => setSeedIndex(Number(v))}
                  options={data.seeds.map((seed, i) => [`${i}`, `${seed.seed}`])}
                />
                <Select
                  label="Method"
                  value={method}
                  onChange={setMethod}
                  options={Object.keys(M.methodColors)}
                />
                <Select
                  label="Diagnostic plotted"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    ['relative_mean_margin', 'Reference-adjusted mean margin'],
                    ['mean_margin', 'Mean margin'],
                    ['sum_margin', 'Summed margin'],
                  ]}
                />
                <Select
                  label="Record inspected across seeds"
                  value={index}
                  onChange={(v) => setIndex(Number(v))}
                  options={final.records.map((record, i) => [`${i}`, record.id])}
                />
                <Reset
                  onClick={() => {
                    setSeedIndex(0);
                    setMethod('IPO');
                    setIndex(0);
                    setMetric('relative_mean_margin');
                  }}
                />
              </Controls>
            </>
          );
        }}
      </ObservationState>
    </Figure>
  );
}
export function MetricLineage() {
  const [metric, setMetric] = useState('Candidate ranking');
  const units = [
    [
      'Judge option likelihood',
      '4 pairs × 2 orders; complete-option token likelihood',
      'Small pretrained judge',
    ],
    [
      'Supplied AI labels',
      '24 training + 12 held-out original pairs',
      'Historical released GPT-4 labels',
    ],
    ['Reward-head fixture', 'One constructed soft target, 64 updates', 'Finite reward gap'],
    [
      'Candidate ranking',
      '12 held-out pairs × 3 seeds × 4 objectives',
      'Retained score diagnostics',
    ],
    ['Generated responses', 'Not collected', 'Unknown'],
    ['Independent human judgments', 'Not collected', 'Unknown'],
  ];
  return (
    <Figure id="D33" label="Observation units and absent independent evaluation">
      <RLAIFTable
        caption="Select a metric to trace its source, without inventing absent quality measurements"
        headers={['Measured object', 'Actual observational unit', 'Source / outcome']}
        rows={units.map(([name, count, source]) => [
          <span className={metric === name ? 'rf-selected' : ''}>{name}</span>,
          count,
          source,
        ])}
      />
      <Svg
        height={215}
        label="Released pair identity is conserved through model training and held-out diagnostic aggregation"
      >
        <Text x={20} y={30}>
          Released row ID
        </Text>
        <Arrow x1={165} y1={24} x2={225} y2={24} />
        <Text x={240} y={30}>
          Pair scores
        </Text>
        <Arrow x1={345} y1={24} x2={400} y2={24} />
        <Text x={415} y={30}>
          12-record summary
        </Text>
        <Line x1={85} y1={42} x2={85} y2={75} />
        <Text x={20} y={105}>
          Teacher option tokens are a separate measurement.
        </Text>
        <Text x={20} y={147}>
          Generated-answer quality requires new samples.
        </Text>
        <Text x={20} y={185}>
          Independent human assessment requires a new study.
        </Text>
      </Svg>
      <Controls>
        <Select
          label="Observation selected"
          value={metric}
          onChange={setMetric}
          options={units.map((unit) => unit[0])}
        />
        <Reset onClick={() => setMetric('Candidate ranking')} />
      </Controls>
    </Figure>
  );
}
export function CountedModelWork() {
  const [pairs, setPairs] = useState(6),
    [a, setA] = useState(20),
    [b, setB] = useState(30),
    [updates, setUpdates] = useState(80),
    [cached, setCached] = useState(true),
    [calls, setCalls] = useState(0),
    model = M.workCounts(pairs, a, b, updates, cached, calls);
  return (
    <Figure id="D34" label="Count policy work, reference work and teacher calls separately">
      <div className="rf-grid">
        {[a, b].map((length, i) => (
          <div key={i}>
            <p style={{ color: colors[i] }}>
              Response {M.candidateNames[i]}: {length} visible positions per forward
            </p>
            <div className="rf-token-row">
              {Array.from({ length: pairs }, (_, j) => (
                <span key={j} className="rf-token rf-token--active" style={colorStyle(i)}>
                  pair {j + 1}
                  <small>{length} positions</small>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <RLAIFTable
        caption="Declared logical forward-work model; not a wall-time or GPU-memory estimator"
        headers={['Owner', 'Sequences', 'Visible positions', 'When counted']}
        rows={[
          ['Policy', model.sequences, model.positions, `${pairs} pairs × ${updates} updates`],
          [
            'Frozen reference',
            model.referenceSequences,
            model.referencePositions,
            cached ? 'One declared cache pass over this pair set' : 'Every update',
          ],
          [
            'Online reference',
            model.onlineReferenceSequences,
            cached ? 0 : model.referencePositions,
            cached ? 'Cache reads require no online model forward' : 'Repeated forwards',
          ],
          [
            'Teacher',
            model.teacherCalls,
            'Not inferred from response lengths',
            'Separate requested calls',
          ],
        ]}
      />
      <p>
        Actual retained study CPU time was 99.2831 seconds across all warm starts, continuations,
        reference caches and evaluations; teacher and native-contract runs were separate. Changing
        this arithmetic model does not change that measurement.
      </p>
      <Controls>
        <Slider
          label="Pairs per update"
          value={pairs}
          onChange={setPairs}
          min={0}
          max={12}
          step={1}
        />
        <Slider label="A visible length" value={a} onChange={setA} min={0} max={64} step={1} />
        <Slider label="B visible length" value={b} onChange={setB} min={0} max={64} step={1} />
        <Slider
          label="Update count"
          value={updates}
          onChange={setUpdates}
          min={0}
          max={80}
          step={1}
        />
        <Check label="Cache frozen reference once" value={cached} onChange={setCached} />
        <Slider
          label="Separate teacher calls"
          value={calls}
          onChange={setCalls}
          min={0}
          max={24}
          step={1}
        />
        <Reset
          onClick={() => {
            setPairs(6);
            setA(20);
            setB(30);
            setUpdates(80);
            setCached(true);
            setCalls(0);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function ControlledComparisonMatrix() {
  const [tau, setTau] = useState(0.5),
    [beta, setBeta] = useState(0.2),
    [lambda, setLambda] = useState(0.1),
    [setting, setSetting] = useState('Objective');
  const ipo = M.preferenceLoss(0, tau, beta),
    shared = M.sharedWeight(0, 1, 3, lambda);
  const headers = ['Method', 'Objective', 'Start state', 'Label source', 'Evaluator'];
  return (
    <Figure id="D35" label="A fair comparison records both held-fixed and changed contracts">
      <RLAIFTable
        caption="Actual common-start study contracts; independent quality evaluation remains absent"
        headers={headers}
        rows={[
          [
            'SFT',
            'Chosen-response NLL',
            'Same warm snapshot',
            'Same 24 AI pairs',
            'Same 12 held-out pair diagnostics',
          ],
          [
            'DPO',
            'Summed gain, β=.2',
            'Same warm snapshot',
            'Same 24 AI pairs',
            'Same 12 held-out pair diagnostics',
          ],
          [
            'IPO',
            'Mean gain, τ=.5',
            'Same warm snapshot',
            'Same 24 AI pairs',
            'Same 12 held-out pair diagnostics',
          ],
          [
            'ORPO local',
            'Response-only imitation + λ=.1 odds',
            'Same warm snapshot',
            'Same 24 AI pairs',
            'Same 12 held-out pair diagnostics',
          ],
        ].map((row) =>
          row.map((value, i) =>
            headers[i] === setting ? <span className="rf-selected">{value}</span> : value,
          ),
        )}
      />
      <div className="rf-grid">
        <Curve
          small
          series={[
            {
              points: M.scalarSamples(
                (value) => M.preferenceLoss(0, 0.5, value).DPODerivative,
                0,
                2,
              ),
              color: M.methodColors.DPO,
            },
          ]}
          xRange={[0, 2]}
          yRange={[-1, 0]}
          cursor={beta}
          xLabel="DPO β"
          yLabel="∂loss/∂h at h=0"
        />
        <Curve
          small
          series={[
            {
              points: M.scalarSamples((value) => M.preferenceLoss(0, value).IPODerivative, 0.1, 2),
              color: M.methodColors.IPO,
            },
          ]}
          xRange={[0.1, 2]}
          yRange={[-10, 0]}
          cursor={tau}
          xLabel="IPO τ"
          yLabel="∂loss/∂h at h=0"
        />
        <Curve
          small
          series={[
            {
              points: M.scalarSamples((value) => M.sharedWeight(0, 1, 3, value).total, 0, 1),
              color: M.methodColors.ORPO,
            },
          ]}
          xRange={[0, 1]}
          yRange={[-0.5, 0.5]}
          cursor={lambda}
          xLabel="ORPO λ"
          yLabel="∂loss/∂θ at θ=0"
        />
      </div>
      <p>
        These coefficient edits calculate fixture derivatives only. They do not retune or predict
        the frozen empirical study. IPO target is {f(ipo.target)}. Shared-weight ORPO derivative is{' '}
        {f(shared.total)}.
      </p>
      <Controls>
        <Select
          label="Contract column highlighted"
          value={setting}
          onChange={setSetting}
          options={headers.slice(1)}
        />
        <Slider
          label="Analytical IPO τ"
          value={tau}
          onChange={setTau}
          min={0.1}
          max={2}
          step={0.1}
        />
        <Slider
          label="Analytical DPO β"
          value={beta}
          onChange={setBeta}
          min={0}
          max={2}
          step={0.1}
        />
        <Slider
          label="Analytical ORPO λ"
          value={lambda}
          onChange={setLambda}
          min={0}
          max={1}
          step={0.05}
        />
        <Reset
          onClick={() => {
            setTau(0.5);
            setBeta(0.2);
            setLambda(0.1);
            setSetting('Objective');
          }}
        />
      </Controls>
    </Figure>
  );
}
