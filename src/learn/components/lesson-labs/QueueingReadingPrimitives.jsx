import React, { useEffect, useId, useRef, useState } from 'react';
import './queueing-reading.css';

export const ink = {
  amber: '#edc267',
  cyan: '#97bfca',
  rose: '#d6a0b7',
  pale: '#ded5bf',
  violet: '#ba9ee8',
  muted: '#92928f',
  text: '#e8e5df',
};
export const jobInk = { A: ink.amber, B: ink.cyan, C: ink.rose, D: ink.pale };
export const format = (value, digits = 4) =>
  value === null
    ? 'undefined'
    : value === 0
      ? '0'
      : Math.abs(value) < 0.0001
        ? value.toExponential(2)
        : Number(value.toFixed(digits)).toString();

export function Drawing({ description, height = 220, children, className = '' }) {
  const element = useRef(null);
  const [size, setSize] = useState({ width: 640, scale: 1 });
  const id = useId().replaceAll(':', '');
  useEffect(() => {
    const read = () =>
      setSize({
        width: element.current?.clientWidth || 640,
        scale: parseFloat(getComputedStyle(document.documentElement).fontSize) / 16,
      });
    const resize = new ResizeObserver(read);
    if (element.current) resize.observe(element.current);
    resize.observe(document.documentElement);
    read();
    return () => resize.disconnect();
  }, []);
  const frame = { ...size, height: height * size.scale, id };
  return (
    <div ref={element} className={`queue-drawing ${className}`}>
      <svg
        width="100%"
        height={frame.height}
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        role="img"
        aria-labelledby={`${id}-description`}
        style={{ fontSize: 12 * frame.scale }}
      >
        <title id={`${id}-description`}>{description}</title>
        <defs>
          <pattern
            id={`${id}-hatch`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" opacity=".65" />
          </pattern>
        </defs>
        {typeof children === 'function' ? children(frame) : children}
      </svg>
    </div>
  );
}

export function Figure({ id, children, caption }) {
  return (
    <figure className="queue-figure" data-queue-figure={id}>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Plot({
  description,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  xTicks,
  xTickLabels,
  yTicks,
  height = 230,
  children,
}) {
  return (
    <Drawing description={description} height={height}>
      {(frame) => {
        const { width, height: h, scale } = frame;
        const left = Math.min(55 * scale, width * 0.22),
          right = 17 * scale,
          top = 28 * scale,
          bottom = 50 * scale;
        const x = (v) =>
          left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (width - left - right);
        const y = (v) =>
          h - bottom - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (h - top - bottom);
        const xt = xTicks || [xDomain[0], (xDomain[0] + xDomain[1]) / 2, xDomain[1]];
        const yt = yTicks || [yDomain[0], (yDomain[0] + yDomain[1]) / 2, yDomain[1]];
        return (
          <>
            <text x={left} y={16 * scale}>
              {yLabel}
            </text>
            {yt.map((t) => (
              <g key={t}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="#575755"
                  opacity=".45"
                />
                <text x={left - 7 * scale} y={y(t) + 4 * scale} textAnchor="end">
                  {format(t, 5)}
                </text>
              </g>
            ))}
            <path
              d={`M${left},${top}V${h - bottom}H${width - right}`}
              fill="none"
              stroke={ink.muted}
            />
            {xt.map((t, i) => (
              <text
                key={t}
                x={x(t)}
                y={h - bottom + 20 * scale}
                textAnchor={i === 0 ? 'start' : i === xt.length - 1 ? 'end' : 'middle'}
              >
                {xTickLabels?.[t] || format(t, 2)}
              </text>
            ))}
            <text x={(left + width - right) / 2} y={h - 7 * scale} textAnchor="middle">
              {xLabel}
            </text>
            {children({ ...frame, x, y, left, right: width - right, top, bottom: h - bottom })}
          </>
        );
      }}
    </Drawing>
  );
}

export const linePath = (points, x, y) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join(' ');

export function Curve({ points, x, y, color = ink.amber, dashed = false, width = 2.5 }) {
  return (
    <path
      d={linePath(points, x, y)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '7 5' : undefined}
    />
  );
}

export function Legend({ entries }) {
  return (
    <ul className="queue-legend">
      {entries.map(([label, color, shape = '●']) => (
        <li key={label}>
          <span style={{ color }} aria-hidden="true">
            {shape}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Range({ label, value, onChange, min, max, step = 1, unit = '' }) {
  const id = useId();
  return (
    <label className="queue-range" htmlFor={id}>
      <span>
        {label}:{' '}
        <strong>
          {format(value)} {unit}
        </strong>
      </span>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="queue-range-ends">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </span>
    </label>
  );
}

export function Choice({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label className="queue-choice" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Controls({ children, onReset }) {
  return (
    <div className="queue-controls">
      {children}
      <button type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

export function Table({ caption, headers, rows }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const measure = () => setOverflow(ref.current.scrollWidth > ref.current.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    observer.observe(ref.current.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [rows]);
  return (
    <div className="queue-table-wrap">
      {overflow && (
        <p className="queue-scroll-help">Scroll this table horizontally to read every column.</p>
      )}
      <div
        ref={ref}
        className="queue-table-scroll"
        tabIndex={overflow ? 0 : undefined}
        role={overflow ? 'region' : undefined}
        aria-label={overflow ? caption : undefined}
      >
        <table>
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
                {row.map((value, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {value}
                    </th>
                  ) : (
                    <td key={j}>{value}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ShareStrip({ segments, label }) {
  return (
    <div className="queue-share">
      <p>{label}</p>
      <div
        className="queue-share-strip"
        role="img"
        aria-label={`${label}: ${segments.map((s) => `${s.label} ${format(100 * s.value, 2)}%`).join(', ')}`}
      >
        {segments.map((s) => (
          <span key={s.label} style={{ width: `${100 * s.value}%`, background: s.color }} />
        ))}
      </div>
      <Legend
        entries={segments.map((s) => [
          `${s.label}: ${format(100 * s.value, 2)}%`,
          s.color,
          s.shape || '●',
        ])}
      />
    </div>
  );
}

export function Worker({ label = 'worker', job, rate }) {
  return (
    <div className="queue-worker">
      <span>{label}</span>
      <div className="queue-worker-slot">
        {job ? <Token id={job} /> : <span className="queue-idle">idle</span>}
      </div>
      {rate && <span>{rate}</span>}
    </div>
  );
}

export function Token({ id, label }) {
  return (
    <span className="queue-token" style={{ color: jobInk[id] || ink.pale }}>
      {label || id}
    </span>
  );
}
