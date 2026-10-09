import React, { useEffect, useId, useRef, useState } from 'react';

import './dapo-flow.css';

export const colours = ['#86c9f1', '#efb66b', '#c5a3ed', '#83d9dc'];
export const fmt = (value, digits = 5) => {
  if (value === null || !Number.isFinite(value)) return 'unavailable';
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(2);
  return Number(value.toFixed(digits)).toString();
};
export const vector = (values) => `(${values.map((value) => fmt(value)).join(', ')})`;
export function Figure({ id, label, children }) {
  return (
    <figure className="dapo-figure" data-dapo-figure={id} id={`dapo-${id}`} aria-label={label}>
      {children}
    </figure>
  );
}
export function Identity({ index = 0, children }) {
  return <strong style={{ color: colours[index % colours.length] }}>{children}</strong>;
}
export function Controls({ children, reset }) {
  return (
    <fieldset className="dapo-controls">
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
    <label className="dapo-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([key, text]) => (
          <option value={key} key={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = -5,
  max = 5,
  step = 'any',
  disabled = false,
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);
  return (
    <label className="dapo-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          const next = Number(event.target.value);
          const valid =
            event.target.value !== '' && Number.isFinite(next) && event.target.checkValidity();
          setInvalid(!valid);
          if (valid) onChange(next);
        }}
        onBlur={() => {
          setDraft(String(value));
          setInvalid(false);
        }}
      />
      {invalid && (
        <small id={`${id}-error`}>
          Enter a valid value from {min} to {max}. The picture keeps the last valid value; leaving
          this field restores it.
        </small>
      )}
    </label>
  );
}
export function Local({ label, children, minWidth, selectionKey }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    const mutation = new MutationObserver(measure);
    mutation.observe(element, { subtree: true, childList: true, characterData: true });
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [children]);
  useEffect(() => {
    if (selectionKey === undefined) return;
    const element = ref.current;
    const reveal = () => {
      const target = element.querySelector('.dapo-target');
      if (!target) return;
      const pane = element.getBoundingClientRect();
      const cell = target.getBoundingClientRect();
      if (cell.left < pane.left + 4) element.scrollLeft += cell.left - pane.left - 4;
      else if (cell.right > pane.right - 4) element.scrollLeft += cell.right - pane.right + 4;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(element);
    return () => observer.disconnect();
  }, [selectionKey]);
  return (
    <div className="dapo-local-wrap">
      {overflow && (
        <p className="dapo-scroll-hint">
          Scroll this aligned view horizontally; focus it and use the arrow keys.
        </p>
      )}
      <div className="dapo-local" ref={ref} role="region" aria-label={label} tabIndex={0}>
        <div style={minWidth ? { minWidth } : undefined}>{children}</div>
      </div>
    </div>
  );
}
export function Table({ label, headers, rows }) {
  return (
    <Local label={label}>
      <table className="dapo-table">
        <caption>{label}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) =>
                column === 0 ? (
                  <th scope="row" key={column}>
                    {cell}
                  </th>
                ) : (
                  <td key={column}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Local>
  );
}
export function Strip({ values, selected = [], coloursByIndex, label }) {
  return (
    <div className="dapo-strip" aria-label={label}>
      {values.map((value, index) => (
        <span
          key={index}
          className={selected.includes(index) ? 'dapo-selected' : ''}
          style={{ '--entity': colours[coloursByIndex?.[index] ?? index % colours.length] }}
        >
          <small>{index}</small>
          {value}
        </span>
      ))}
    </div>
  );
}
export function Bars({ rows, label, signed = false, maximum }) {
  const bound = maximum ?? Math.max(1e-8, ...rows.map((row) => Math.abs(row.value)));
  return (
    <div className="dapo-bars" aria-label={label}>
      <p>
        {label} ·{' '}
        {signed ? `common axis −${fmt(bound)} to +${fmt(bound)}` : `common axis 0 to ${fmt(bound)}`}
      </p>
      {rows.map((row, index) => (
        <div key={index}>
          <span>{row.label}</span>
          <div className={signed ? 'dapo-bar-axis dapo-signed' : 'dapo-bar-axis'}>
            <i
              style={{
                background: colours[row.colour ?? index % colours.length],
                width: `${(Math.abs(row.value) / bound) * (signed ? 50 : 100)}%`,
                marginLeft: signed
                  ? `${row.value >= 0 ? 50 : 50 - (Math.abs(row.value) / bound) * 50}%`
                  : 0,
              }}
            />
          </div>
          <output>{fmt(row.value)}</output>
        </div>
      ))}
    </div>
  );
}
export function Branches({ children }) {
  return <div className="dapo-branches">{children}</div>;
}
export function Branch({ index = 0, children }) {
  return (
    <div className="dapo-branch" style={{ '--entity': colours[index] }}>
      {children}
    </div>
  );
}
export function Arrow({ children = '↓' }) {
  return <div className="dapo-arrow">{children}</div>;
}
export function Matrix({ label, size, cell, headers }) {
  return (
    <Table
      label={label}
      headers={[
        'Receiving row ↓ / source →',
        ...Array.from({ length: size }, (_, index) => headers?.[index] ?? `r${index + 1}`),
      ]}
      rows={Array.from({ length: size }, (_, row) => [
        <Identity index={row}>row {row + 1}</Identity>,
        ...Array.from({ length: size }, (_, column) => cell(row, column)),
      ])}
    />
  );
}
export function Curves({ series, domain, label, marker, vertical = [], yDomain }) {
  const values = series.flatMap((line) => line.points.map((point) => point[1]));
  const low = yDomain?.[0] ?? Math.min(0, ...values);
  const high = yDomain?.[1] ?? Math.max(0.01, ...values);
  const x = (value) => 80 + ((value - domain[0]) / (domain[1] - domain[0])) * 490;
  const y = (value) => 300 - ((value - low) / (high - low)) * 245;
  const important = [domain[0], ...vertical, domain[1]];
  const middle = (domain[0] + domain[1]) / 2;
  const ticks = [
    ...new Set([
      ...important,
      ...(important.every((v) => Math.abs(v - middle) > (domain[1] - domain[0]) * 0.13)
        ? [middle]
        : []),
    ]),
  ].sort((a, b) => a - b);
  const [xLabel, yLabel] = label.split('→').map((value) => value.trim());
  return (
    <>
      <Local label={label} minWidth="37rem">
        <svg className="dapo-plot" viewBox="0 0 620 390" role="img" aria-label={label}>
          <text x="80" y="25" fill="#ddd">
            {yLabel ?? label}
          </text>
          <text x="320" y="376" textAnchor="middle" fill="#ddd">
            {xLabel}
          </text>
          <path className="dapo-axis" d="M80 55V300H570" />
          {low < 0 && high > 0 && <path className="dapo-guide" d={`M80 ${y(0)}H570`} />}
          {[0, 0.5, 1].map((f) => {
            const value = low + f * (high - low);
            return (
              <g key={f}>
                <path d={`M74 ${y(value)}H80`} stroke="#aaa" />
                <text x="66" y={y(value) + 5} textAnchor="end" fill="#ddd">
                  {fmt(value, 3)}
                </text>
              </g>
            );
          })}
          {ticks.map((value, index) => (
            <g key={value}>
              <path d={`M${x(value)} 300V308`} stroke="#aaa" />
              <text
                x={x(value)}
                y={index > 0 && x(value) - x(ticks[index - 1]) < 50 ? 351 : 330}
                textAnchor="middle"
                fill="#ddd"
              >
                {fmt(value, 3)}
              </text>
            </g>
          ))}
          {vertical.map((value, index) => (
            <path key={index} className="dapo-guide" d={`M${x(value)} 55V300`} />
          ))}
          {series.map((line, index) => (
            <path
              key={line.name}
              d={line.points
                .map(
                  (point, pointIndex) => `${pointIndex ? 'L' : 'M'}${x(point[0])} ${y(point[1])}`,
                )
                .join(' ')}
              fill="none"
              stroke={colours[index % colours.length]}
              strokeWidth="2.5"
              strokeDasharray={line.dashed ? '7 5' : undefined}
            />
          ))}
          {marker !== undefined && (
            <g>
              <path
                d={`M${x(marker)} 55V300`}
                stroke="#fff"
                strokeWidth="2"
                strokeDasharray="3 4"
              />
              <text x="570" y="46" textAnchor="end" fill="#eee">
                selected x = {fmt(marker)}
              </text>
            </g>
          )}
        </svg>
      </Local>
      <p>
        {label}. Horizontal {fmt(domain[0])} to {fmt(domain[1])}; vertical {fmt(low)} to {fmt(high)}
        . {marker !== undefined && `White dotted selection: ${fmt(marker)}.`}
      </p>
      <div className="dapo-legend">
        {series.map((line, index) => (
          <span key={line.name} style={{ color: colours[index % colours.length] }}>
            {line.dashed ? '┄' : '━'} {line.name}
          </span>
        ))}
      </div>
    </>
  );
}
export const curvePoints = (start, end, fn, count = 100, breakpoints = []) =>
  [
    ...new Set([
      ...Array.from({ length: count + 1 }, (_, index) => start + ((end - start) * index) / count),
      ...breakpoints,
    ]),
  ]
    .filter((x) => x >= start && x <= end)
    .sort((a, b) => a - b)
    .map((x) => [x, fn(x)]);
