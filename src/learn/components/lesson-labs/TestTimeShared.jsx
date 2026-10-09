import { useEffect, useId, useRef, useState } from 'react';
import './test-time-compute.css';
export { candidateColors as colors } from '../../data/test-time-compute-models.js';
export const fmt = (n, d = 4) =>
  Number.isInteger(n) ? String(n) : n.toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
export function Figure({ id, caption, children }) {
  return (
    <figure className="ttc-figure" data-ttc-figure={id}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
export function Controls({ children, reset }) {
  return (
    <div className="ttc-controls">
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
}
export function Range({ label, value, onChange, min, max, step = 1 }) {
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
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Select({ label, value, options, onChange }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Scroll({ label, children }) {
  const ref = useRef(null),
    [wide, setWide] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const measure = () => setWide(node.scrollWidth > node.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div>
      <div className="ttc-scroll" ref={ref} tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      {wide && <p className="ttc-cue">↔ Focus the drawing and use arrow keys to pan.</p>}
    </div>
  );
}
export function Drawing({ label, width = 620, height, children }) {
  return (
    <Scroll label={label}>
      <svg
        className="ttc-drawing"
        style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </Scroll>
  );
}
export function Table({ caption, headers, rows }) {
  return (
    <Scroll label={caption || 'Values'}>
      <table className="ttc-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {headers.map((v, i) => (
              <th scope="col" key={i}>
                {v}
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
export function Status({ children }) {
  return (
    <p className="ttc-status" aria-live="polite" aria-atomic="true">
      {children}
    </p>
  );
}
export function Plot({
  series,
  xMax,
  yMax,
  xLabel,
  yLabel,
  selectedX,
  region,
  height = 305,
  xTicks,
}) {
  const x = (n) => 65 + (490 * n) / xMax,
    y = (n) => 230 - (180 * n) / yMax;
  return (
    <>
      <p>{yLabel}</p>
      <Drawing label={`${yLabel} against ${xLabel}`} height={height}>
        {region != null && region >= 0 && (
          <rect
            x="65"
            y="50"
            width={(490 * Math.min(region, xMax)) / xMax}
            height="180"
            fill="#ffffff09"
          />
        )}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <path d={`M65 ${230 - 180 * t}H555`} stroke="#424650" />
            <text x="55" y={235 - 180 * t} textAnchor="end">
              {fmt(yMax * t, 2)}
            </text>
          </g>
        ))}
        {(xTicks || [0, 0.25, 0.5, 0.75, 1].map((t) => t * xMax)).map((t) => (
          <text key={t} x={x(t)} y="258" textAnchor="middle">
            {fmt(t, 2)}
          </text>
        ))}
        <path d="M65 48V230H558" fill="none" stroke="#acb1bc" />
        {series.map((s) => (
          <g key={s.name}>
            {s.line && (
              <path
                d={s.points.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a)} ${y(b)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dashed ? '6 5' : undefined}
              />
            )}
            {s.points.map(([a, b], i) => (
              <circle
                key={i}
                cx={x(a)}
                cy={y(b)}
                r={s.selected?.includes(i) || a === selectedX ? 6 : 4}
                fill={s.dashed ? '#070707' : s.color}
                stroke={s.selected?.includes(i) || a === selectedX ? '#fff' : s.color}
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
        <text x="310" y="293" textAnchor="middle">
          {xLabel}
        </text>
      </Drawing>
      <div className="ttc-key">
        {series.map((s) => (
          <span key={s.name} style={{ color: s.color }}>
            ● {s.name}
          </span>
        ))}
      </div>
    </>
  );
}
let state = { loading: true },
  pending;
const listeners = new Set();
const publish = (next) => {
  state = next;
  listeners.forEach((fn) => fn(next));
};
function fetchData() {
  if (pending) return;
  publish({ loading: true });
  pending = fetch('/learn-assets/test-time-compute/observations.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => publish({ data }))
    .catch((e) => publish({ error: e.message }));
}
export function useEvidence() {
  const [value, setValue] = useState(state);
  useEffect(() => {
    listeners.add(setValue);
    setValue(state);
    fetchData();
    return () => listeners.delete(setValue);
  }, []);
  return {
    ...value,
    retry: () => {
      pending = null;
      fetchData();
    },
  };
}
export function EvidenceState({ state: s }) {
  return s.loading ? (
    <p role="status">Loading recorded outputs…</p>
  ) : s.error ? (
    <p role="alert">
      Recorded outputs unavailable: {s.error}{' '}
      <button type="button" onClick={s.retry}>
        Retry
      </button>
    </p>
  ) : null;
}
