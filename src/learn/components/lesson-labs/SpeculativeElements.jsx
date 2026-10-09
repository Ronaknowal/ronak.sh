import React, { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import './speculative-decoding-flow.css';

export const tokenColours = ['#83d9dc', '#c5a3ed', '#f29f91'];
export const targetColour = '#86c9f1',
  draftColour = '#efb66b';
export const tokenNames = ['A', 'B', 'C'];
export const fmt = (n, digits = 5) =>
  n === null || n === undefined
    ? 'undefined'
    : Number.isFinite(n)
      ? n !== 0 && Math.abs(n) < 0.00001
        ? n.toExponential(2)
        : Number(n.toFixed(digits)).toString()
      : String(n);
export const vector = (values) =>
  values ? `(${values.map((x) => fmt(x)).join(', ')})` : 'unreachable';
export function Figure({ id, label, children }) {
  return (
    <figure
      className="speculative-figure"
      data-speculative-figure={id}
      id={`speculative-${id}`}
      aria-label={label}
    >
      {children}
    </figure>
  );
}
export function Controls({ children, reset }) {
  return (
    <fieldset className="speculative-controls">
      <legend>Change this example</legend>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
}
export function Select({ label, value, onChange, options, disabled = false }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
}) {
  const id = useId();
  return (
    <label htmlFor={id}>
      <span>
        {label}: <output>{fmt(value)}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Readout({ children, role }) {
  return (
    <p className="speculative-readout" aria-live="polite" role={role}>
      {children}
    </p>
  );
}
export function Local({ children, label }) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    for (const svg of el.querySelectorAll('svg[viewBox]'))
      svg.style.minWidth = `${svg.viewBox.baseVal.width / 16}rem`;
    const update = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);
  return (
    <div className="speculative-local-wrap">
      <p className="speculative-pan">
        {overflow
          ? 'Scroll to inspect the complete drawing or table. Focus below and use arrow keys for keyboard panning.'
          : label}
      </p>
      <div className="speculative-local" ref={ref} role="region" tabIndex={0} aria-label={label}>
        {children}
      </div>
    </div>
  );
}
export function Table({ headers, rows, label = 'Aligned values' }) {
  return (
    <Local label={label}>
      <table className="speculative-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Local>
  );
}
export function Bars({ values, label, names = tokenNames, maximum = 1 }) {
  return (
    <div className="speculative-bars">
      <p>
        {label} · axis 0–{fmt(maximum)}
      </p>
      {values.map((v, i) => (
        <div className="speculative-bar" key={i} style={{ '--entity': tokenColours[i % 3] }}>
          <span>{names[i]}</span>
          <span>{fmt(v)}</span>
          <span className="speculative-track">
            <span style={{ width: `${(100 * v) / maximum}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
export function Tokens({ ids, names = tokenNames, states = [] }) {
  return (
    <div className="speculative-tokens">
      {ids.length ? (
        ids.map((id, i) => (
          <span
            key={i}
            style={{ '--entity': tokenColours[id % 3] }}
            data-state={states[i] ?? 'committed'}
          >
            {names[id] ?? id}
            {states[i] && <small>{states[i]}</small>}
          </span>
        ))
      ) : (
        <span>No token in this lane</span>
      )}
    </div>
  );
}
export function Drawing({ width = 760, height = 320, label, children }) {
  return (
    <Local label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {children}
      </svg>
    </Local>
  );
}
export function Wire({ x1, y1, x2, y2, colour = '#bbb', dashed = false }) {
  const id = useId().replaceAll(':', '');
  return (
    <>
      <defs>
        <marker id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0L7 3.5L0 7Z" fill={colour} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colour}
        strokeWidth="1.6"
        strokeDasharray={dashed ? '5 4' : undefined}
        markerEnd={`url(#${id})`}
      />
    </>
  );
}
export function Box({
  x,
  y,
  w = 100,
  h = 36,
  label,
  colour = '#ccc',
  selected = false,
  dashed = false,
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="3"
        fill="#191919"
        stroke={selected ? '#fff' : colour}
        strokeWidth={selected ? 3 : 1.5}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 5}
        textAnchor="middle"
        fontSize="15"
        style={{ fill: colour }}
      >
        {label}
      </text>
    </g>
  );
}

const listeners = new Set();
let resource = { status: 'idle', data: null, error: null },
  pending = null;
const publish = (value) => {
  resource = value;
  for (const notify of listeners) notify();
};
export async function loadSpeculativeEvidence() {
  if (pending) return pending;
  if (resource.status === 'ready') return resource.data;
  publish({ status: 'loading', data: null, error: null });
  pending = (async () => {
    try {
      const response = await fetch('/learn-assets/speculative-decoding/observations.json');
      if (!response.ok) throw Error(`Evidence request returned ${response.status}.`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== 804283) throw Error('Evidence payload has an unexpected size.');
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
      if (hash !== 'd741f79ae7a309344a297ba4ae2dee092bb02cc11ab73654464e429832a8bb00')
        throw Error('Evidence identity differs from the retained observations.');
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (!data.stages || !Array.isArray(data.summary))
        throw Error('Evidence shape is incomplete.');
      publish({ status: 'ready', data, error: null });
      return data;
    } catch (error) {
      publish({ status: 'error', data: null, error: String(error.message ?? error) });
      return null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
export function Evidence({ children }) {
  const ref = useRef(null);
  const result = useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => resource,
    () => resource,
  );
  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (resource.status === 'idle') loadSpeculativeEvidence();
          observer.disconnect();
        }
      },
      { rootMargin: '500px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="speculative-evidence">
      {result.status === 'ready' ? (
        children(result.data)
      ) : result.status === 'error' ? (
        <div role="alert">
          <p>{result.error}</p>
          <button type="button" onClick={loadSpeculativeEvidence}>
            Retry evidence
          </button>
        </div>
      ) : (
        <p role="status">
          {result.status === 'idle'
            ? 'Recorded observations load when this example approaches the viewport.'
            : 'Loading retained observations…'}
        </p>
      )}
    </div>
  );
}
