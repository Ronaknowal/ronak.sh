import React, { useEffect, useId, useRef, useState } from 'react';
import { responseColors, roles } from '../../data/rlvr-models.js';
import './rlvr-flow.css';

export const palette = responseColors;
export const f = (value, digits = 6) =>
  value === null || value === undefined || Number.isNaN(value)
    ? 'unknown'
    : !Number.isFinite(value)
      ? value < 0
        ? '−∞'
        : '∞'
      : Number(value.toFixed(digits)).toString();
export function Figure({ id, label, children, note }) {
  return (
    <figure className="rlvr-figure" data-rlvr-figure={id} aria-label={label}>
      {children}
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
export function Controls({ children }) {
  return <div className="rlvr-controls">{children}</div>;
}
export function Select({ label, value, onChange, options }) {
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
export function Range({ label, value, onChange, min = 0, max = 1, step = 0.05, disabled = false }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}: <output>{f(value)}</output>
      <input
        type="range"
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
export function Check({ label, value, onChange }) {
  return (
    <label className="rlvr-check">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
export function Reset({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Reset
    </button>
  );
}
export function RLVRScroll({
  children,
  className = '',
  label = 'Drawing; scroll horizontally if needed',
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
    <div className={`rlvr-scroll-wrap ${className}`}>
      {overflow && (
        <p className="rlvr-scroll-cue">
          Scroll horizontally · focus this region and use arrow keys
        </p>
      )}
      <div
        ref={ref}
        className="rlvr-scroll"
        tabIndex={overflow ? 0 : undefined}
        role={overflow ? 'region' : undefined}
        aria-label={overflow ? label : undefined}
      >
        {children}
      </div>
    </div>
  );
}
export function RLVRTable({ headers, rows, caption }) {
  return (
    <RLVRScroll label={caption || 'Data table'}>
      <table className="rlvr-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {headers.map((value, i) => (
              <th key={i} scope="col">
                {value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td key={j}>
                  {typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? (
                    <code className="rlvr-hash">{value}</code>
                  ) : typeof value === 'number' ||
                    (typeof value === 'string' &&
                      /^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+−-]?\d+)?$/i.test(value)) ? (
                    <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </RLVRScroll>
  );
}
export function Svg({ children, width = 640, height = 300, label }) {
  return (
    <RLVRScroll label={label}>
      <svg
        className="rlvr-svg"
        style={{ width: `${width / 16}rem` }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </RLVRScroll>
  );
}
export function Text({ x, y, children, anchor = 'start', color = '#e0e2e9', halo = false }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{ fill: color }}
      className={halo ? 'rlvr-halo' : undefined}
    >
      {children}
    </text>
  );
}
export function Line({ x1, y1, x2, y2, color = roles.frozen, dashed = false }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth="1.5"
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}
export function Arrow({ x1, y1, x2, y2, color, dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1),
    size = 7;
  return (
    <g>
      <Line {...{ x1, y1, x2, y2, color, dashed }} />
      <path
        d={`M${x2 - size * Math.cos(angle - 0.45)},${y2 - size * Math.sin(angle - 0.45)}L${x2},${y2}L${x2 - size * Math.cos(angle + 0.45)},${y2 - size * Math.sin(angle + 0.45)}`}
        fill="none"
        stroke={color || roles.frozen}
        strokeWidth="1.5"
      />
    </g>
  );
}
export function Bars({
  labels,
  values,
  colors = palette,
  signed = false,
  maximum,
  unit = '',
  caption,
}) {
  const extent = maximum || Math.max(...values.filter(Number.isFinite).map(Math.abs), 1e-12);
  return (
    <div className="rlvr-bars" aria-label={caption}>
      {labels.map((label, i) => (
        <div className="rlvr-bar-row" key={i}>
          <span style={{ color: colors[i % colors.length] }}>{label}</span>
          <div
            className={`rlvr-bar-track${signed ? ' rlvr-bar-track--signed' : ''}`}
            data-value={values[i]}
          >
            {Number.isFinite(values[i]) && (
              <span
                className="rlvr-bar"
                style={{
                  background: colors[i % colors.length],
                  width: `${(Math.abs(values[i]) / extent) * (signed ? 50 : 100)}%`,
                  left: signed
                    ? values[i] < 0
                      ? `${50 - (Math.abs(values[i]) / extent) * 50}%`
                      : '50%'
                    : 0,
                }}
              />
            )}
          </div>
          <output>
            {f(values[i])}
            {unit && ` ${unit}`}
          </output>
        </div>
      ))}
      <p className="rlvr-note">
        {signed ? 'Centre = 0; ' : 'Left = 0; '}full track {signed ? 'on either side ' : ''}={' '}
        {f(extent)}
        {unit && ` ${unit}`}.
      </p>
    </div>
  );
}
export function Tokens({ ids, mask, selected, onSelect, offset = 0 }) {
  const reserved = { 256: 'PAD', 257: 'EOS', 258: 'BOS', 259: 'SEP' };
  return (
    <div className="rlvr-tokens">
      {ids.map((id, index) => {
        const include = mask ? mask[index] : true;
        const content = (
          <>
            <small>{offset + index}</small>
            <b>{reserved[id] || id}</b>
            <small>{include ? 'included' : 'context / pad'}</small>
          </>
        );
        return onSelect ? (
          <button
            type="button"
            key={index}
            className={`rlvr-token${index === selected ? ' rlvr-selected' : ''}`}
            style={{ '--entity': include ? roles.score : id === 256 ? roles.frozen : roles.input }}
            onClick={() => onSelect(index)}
            aria-label={`Position ${offset + index}, ID ${id}, ${include ? 'included target' : 'excluded target'}`}
          >
            {content}
          </button>
        ) : (
          <span
            key={index}
            className={`rlvr-token${index === selected ? ' rlvr-selected' : ''}`}
            style={{ '--entity': include ? roles.score : roles.input }}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}
export function Plot({ series, domainX = [0, 1], domainY = [0, 1], xLabel, yLabel, point }) {
  const sx = (x) => 70 + ((x - domainX[0]) / (domainX[1] - domainX[0])) * 490;
  const sy = (y) => 250 - ((y - domainY[0]) / (domainY[1] - domainY[0])) * 190;
  return (
    <Svg label={`${yLabel} against ${xLabel}`} height={320}>
      <Line x1={70} y1={60} x2={70} y2={250} />
      <Line x1={70} y1={250} x2={560} y2={250} />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <Text x={65} y={254 - t * 190} anchor="end">
            {f(domainY[0] + t * (domainY[1] - domainY[0]), 3)}
          </Text>
          <Text x={70 + 490 * t} y={275} anchor="middle">
            {f(domainX[0] + t * (domainX[1] - domainX[0]), 3)}
          </Text>
        </g>
      ))}
      <Text x={70} y={30}>
        {yLabel}
      </Text>
      <Text x={315} y={306} anchor="middle">
        {xLabel}
      </Text>
      {series.map((item, i) => (
        <g key={i}>
          <polyline
            points={item.points
              .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
              .map(([x, y]) => `${sx(x)},${sy(y)}`)
              .join(' ')}
            fill="none"
            stroke={item.color || palette[i]}
            strokeWidth="2.2"
          />
          {point && (
            <circle
              cx={sx(point.x)}
              cy={sy(
                item.points.reduce((best, p) =>
                  Math.abs(p[0] - point.x) < Math.abs(best[0] - point.x) ? p : best,
                )[1],
              )}
              r="5"
              fill={item.color || palette[i]}
              stroke="#fff"
            />
          )}
        </g>
      ))}
    </Svg>
  );
}
const dataPromises = new Map();
export function DataView({ file, children }) {
  const ref = useRef(null),
    [near, setNear] = useState(false),
    [value, setValue] = useState(null),
    [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    let active = true;
    setValue(null);
    setError(null);
    if (!dataPromises.has(file)) {
      const promise = fetch(`/learn-assets/rlvr/${file}`)
        .then((response) => {
          if (!response.ok) throw new Error(`Observation request failed (${response.status})`);
          return response.json();
        })
        .catch((error) => {
          dataPromises.delete(file);
          throw error;
        });
      dataPromises.set(file, promise);
    }
    dataPromises
      .get(file)
      .then((data) => {
        if (active) setValue(data);
      })
      .catch((problem) => {
        if (active) setError(problem.message);
      });
    return () => {
      active = false;
    };
  }, [file, near, attempt]);
  return (
    <div ref={ref} className="rlvr-data-view">
      {error ? (
        <div role="alert">
          <p>{error}. Recorded observations are unavailable.</p>
          <button
            type="button"
            onClick={() => {
              dataPromises.delete(file);
              setAttempt((value) => value + 1);
            }}
          >
            Retry observations
          </button>
        </div>
      ) : value ? (
        children(value)
      ) : (
        <p role="status">Loading recorded observations…</p>
      )}
    </div>
  );
}
