import React, { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import './decoding-strategies-flow.css';
export const colours = ['#86c9f1', '#83d9dc', '#efb66b', '#c5a3ed', '#f29f91'];
export const fmt = (n, digits = 5) =>
  n === null || n === undefined
    ? 'undefined'
    : !Number.isFinite(n)
      ? String(n)
      : n !== 0 && Math.abs(n) < 0.0001
        ? n.toExponential(2)
        : Number(n.toFixed(digits)).toString();
export const vector = (values) => `(${values.map((x) => fmt(x)).join(', ')})`;
export function Figure({ id, label, children }) {
  return (
    <figure
      className="decoding-figure"
      data-decoding-figure={id}
      id={`decoding-${id}`}
      aria-label={label}
    >
      {children}
    </figure>
  );
}
export function Controls({ children, reset }) {
  return (
    <fieldset className="decoding-controls">
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
        {options.map(([key, text]) => (
          <option key={key} value={key}>
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
export function Local({ children, label, minWidth = '34em' }) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current,
      measure = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
    // Preserve the authored SVG units at 16px root size, then scale with text.
    // Local panning carries wide structures instead of shrinking their labels.
    for (const drawing of el.querySelectorAll('svg[viewBox]')) {
      drawing.style.minWidth = `max(var(--diagram-width, 34em), ${drawing.viewBox.baseVal.width / 16}rem)`;
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const c of el.children) ro.observe(c);
    return () => ro.disconnect();
  }, [children]);
  return (
    <div>
      <p className="decoding-pan">
        {overflow
          ? 'Scroll horizontally to inspect the complete drawing or table. Keyboard: focus below, then use arrow keys.'
          : label}
      </p>
      <div
        className="decoding-local"
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        style={{ '--diagram-width': minWidth }}
      >
        {children}
      </div>
    </div>
  );
}
export function Table({ headers, rows, label = 'Aligned values' }) {
  return (
    <Local label={label}>
      <table className="decoding-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Local>
  );
}
export function Bars({
  p,
  names = ['door', 'window', 'garden', 'river', 'EOS'],
  label = 'Probability',
  selected = -1,
  maximum = 1,
}) {
  if (!p) return <p role="status">Empty support: no probability distribution exists.</p>;
  return (
    <div className="decoding-bars" aria-label={label}>
      <p>
        {label} · common axis 0–{fmt(maximum)}
      </p>
      {p.map((value, i) => (
        <div
          className="decoding-bar-row"
          key={i}
          data-selected={selected === i}
          style={{ '--entity': colours[i % 5] }}
        >
          <span style={{ color: colours[i % 5] }}>{names[i] ?? `ID ${i}`}</span>
          <span className="decoding-bar-track">
            <span className="decoding-bar-fill" style={{ width: `${(100 * value) / maximum}%` }} />
          </span>
          <span>{fmt(value)}</span>
        </div>
      ))}
    </div>
  );
}
export function Strip({ values, selected = -1, identities }) {
  return (
    <div className="decoding-token-row">
      {values.map((value, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true">→</span>}
          <span
            className="decoding-token"
            data-selected={i === selected}
            style={{ '--entity': colours[(identities?.[i] ?? i) % 5] }}
          >
            {value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
export function Readout({ children }) {
  return (
    <p className="decoding-readout" aria-live="polite">
      {children}
    </p>
  );
}
export function AxisPlot({
  points,
  xmax,
  ymax,
  xlabel,
  ylabel,
  marker,
  colour = colours[0],
  ymin = 0,
}) {
  const x = (n) => 60 + (500 * n) / xmax,
    y = (n) => 245 - (190 * (n - ymin)) / (ymax - ymin);
  return (
    <Local label={`${ylabel} versus ${xlabel}`}>
      <svg viewBox="0 0 620 310" role="img" aria-label={`${ylabel} versus ${xlabel}`}>
        <path d="M60 40V245H580" fill="none" stroke="#aaa" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <text x={x(t * xmax)} y="269" textAnchor="middle" fontSize="14">
              {fmt(t * xmax, 2)}
            </text>
            <text x="50" y={y(ymin + t * (ymax - ymin)) + 5} textAnchor="end" fontSize="14">
              {fmt(ymin + t * (ymax - ymin), 2)}
            </text>
          </g>
        ))}
        <text x="320" y="302" textAnchor="middle" fontSize="16">
          {xlabel}
        </text>
        <text x="60" y="20" fontSize="16">
          {ylabel}
        </text>
        <polyline
          points={points.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')}
          fill="none"
          stroke={colour}
          strokeWidth="3"
        />
        {marker && (
          <>
            <circle
              cx={x(marker[0])}
              cy={y(marker[1])}
              r="6"
              fill={colour}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={Math.min(470, x(marker[0]) + 12)}
              y={Math.max(42, y(marker[1]) - 14)}
              fontSize="15"
            >
              ({fmt(marker[0], 2)}, {fmt(marker[1], 3)})
            </text>
          </>
        )}
      </svg>
    </Local>
  );
}
