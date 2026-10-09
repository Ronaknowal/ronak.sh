import React, { useEffect, useId, useRef, useState } from 'react';
import { aggregateCloud } from '../../data/grouped-preference-models.js';
import './grouped-preference-flow.css';

export const colours = ['#c5a3ed', '#86c9f1', '#efb66b', '#f29f91'];
export const fmt = (value, digits = 5) => {
  if (value === null || !Number.isFinite(value)) return 'unavailable';
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(2);
  return Number(value.toFixed(digits)).toString();
};
export const vector = (values) => `(${values.map((value) => fmt(value)).join(', ')})`;
export function Figure({ id, label, children }) {
  return (
    <figure
      className="grouped-figure"
      data-grouped-figure={id}
      id={`grouped-${id}`}
      aria-label={label}
    >
      {children}
    </figure>
  );
}
export function Identity({ index = 0, children }) {
  return <strong style={{ color: colours[index % colours.length] }}>{children}</strong>;
}
export function Controls({ children, reset }) {
  return (
    <fieldset className="grouped-controls">
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
    <label className="grouped-field" htmlFor={id}>
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
  return (
    <label className="grouped-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (event.target.value !== '' && Number.isFinite(next))
            onChange(Math.max(min, Math.min(max, step === 1 ? Math.round(next) : next)));
        }}
      />
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
      const target = element.querySelector('.grouped-target');
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
    <div className="grouped-local-wrap">
      {overflow && (
        <p className="grouped-scroll-hint">
          Scroll this aligned view horizontally; focus it and use the arrow keys.
        </p>
      )}
      <div className="grouped-local" ref={ref} role="region" aria-label={label} tabIndex={0}>
        <div style={minWidth ? { minWidth } : undefined}>{children}</div>
      </div>
    </div>
  );
}
export function Table({ label, headers, rows }) {
  return (
    <Local label={label}>
      <table className="grouped-table">
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
    <div className="grouped-strip" aria-label={label}>
      {values.map((value, index) => (
        <span
          key={index}
          className={selected.includes(index) ? 'grouped-selected' : ''}
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
    <div className="grouped-bars" aria-label={label}>
      <p>
        {label} ·{' '}
        {signed ? `common axis −${fmt(bound)} to +${fmt(bound)}` : `common axis 0 to ${fmt(bound)}`}
      </p>
      {rows.map((row, index) => (
        <div key={index}>
          <span>{row.label}</span>
          <div className={signed ? 'grouped-bar-axis grouped-signed' : 'grouped-bar-axis'}>
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
  return <div className="grouped-branches">{children}</div>;
}
export function Branch({ index = 0, children }) {
  return (
    <div className="grouped-branch" style={{ '--entity': colours[index] }}>
      {children}
    </div>
  );
}
export function Arrow({ children = '↓' }) {
  return <div className="grouped-arrow">{children}</div>;
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
export function Cloud({ distribution, label = 'Exact ordered-group distribution' }) {
  const points = aggregateCloud(distribution.groups);
  const vectors = [
    ...points.map((point) => point.gradient),
    distribution.target_gradient,
    distribution.mean_gradient,
  ];
  const bound = Math.max(0.05, ...vectors.flat().map(Math.abs)) * 1.12;
  const x = (value) => 250 + (210 * value) / bound;
  const y = (value) => 210 - (170 * value) / bound;
  const last = distribution.target_gradient.length - 1;
  return (
    <>
      <Local label={label} minWidth="28rem">
        <svg
          viewBox="0 0 500 420"
          className="grouped-plot"
          role="img"
          aria-label={`${label}; first versus final logit-gradient coordinate. Circle area encodes exact probability. Plus is target, diamond is mean.`}
        >
          <path className="grouped-axis" d="M40 210H460 M250 40V380" />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={x(point.gradient[0])}
              cy={y(point.gradient[last])}
              r={Math.sqrt(point.probability) * 40}
              fill={colours[0]}
              fillOpacity=".48"
              stroke={colours[0]}
            >
              <title>
                {vector(point.gradient)}; mass {fmt(point.probability)}; {point.count} ordered
                groups
              </title>
            </circle>
          ))}
          <path
            d={`M${x(distribution.target_gradient[0]) - 8} ${y(distribution.target_gradient[last])}h16 M${x(distribution.target_gradient[0])} ${y(distribution.target_gradient[last]) - 8}v16`}
            stroke={colours[2]}
            strokeWidth="3"
          />
          <path
            d={`M${x(distribution.mean_gradient[0])} ${y(distribution.mean_gradient[last]) - 7}l7 7 -7 7 -7 -7Z`}
            stroke={colours[1]}
            fill="none"
            strokeWidth="2"
          />
        </svg>
      </Local>
      <p>
        Horizontal: first logit gradient; vertical: final logit gradient. Both axes −{fmt(bound)} to
        +{fmt(bound)}. Circle area is probability; coincident points combine their mass.
      </p>
      <p>
        <Identity index={2}>+ Target {vector(distribution.target_gradient)}</Identity>;{' '}
        <Identity index={1}>◇ mean {vector(distribution.mean_gradient)}</Identity>.
      </p>
      <p>
        Bias {vector(distribution.bias)}; covariance trace {fmt(distribution.covariance_trace)};
        squared bias {fmt(distribution.bias_squared)}; MSE {fmt(distribution.mse)}. Units: squared
        logit-gradient coordinates. {distribution.groups.length} ordered groups, {points.length}{' '}
        distinct positions.
      </p>
    </>
  );
}
export function Curves({ series, domain, label, marker, vertical = [], yDomain }) {
  const values = series.flatMap((line) => line.points.map((point) => point[1]));
  const low = yDomain?.[0] ?? Math.min(0, ...values);
  const high = yDomain?.[1] ?? Math.max(0.01, ...values);
  const x = (value) => 35 + ((value - domain[0]) / (domain[1] - domain[0])) * 430;
  const y = (value) => 285 - ((value - low) / (high - low)) * 250;
  return (
    <>
      <Local label={label} minWidth="28rem">
        <svg className="grouped-plot" viewBox="0 0 500 320" role="img" aria-label={label}>
          <path className="grouped-axis" d={`M35 ${y(0)}H465 M35 35V285`} />
          {vertical.map((value, index) => (
            <path key={index} className="grouped-guide" d={`M${x(value)} 35V285`} />
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
            <path d={`M${x(marker)} 35V285`} stroke="#fff" strokeWidth="2" strokeDasharray="3 4" />
          )}
        </svg>
      </Local>
      <p>
        {label}. Horizontal {fmt(domain[0])} to {fmt(domain[1])}; vertical {fmt(low)} to {fmt(high)}
        . {marker !== undefined && `White dotted selection: ${fmt(marker)}.`}
      </p>
      <div className="grouped-legend">
        {series.map((line, index) => (
          <span key={line.name} style={{ color: colours[index % colours.length] }}>
            {line.dashed ? '┄' : '━'} {line.name}
          </span>
        ))}
      </div>
    </>
  );
}
export const curvePoints = (start, end, fn, count = 100) =>
  Array.from({ length: count + 1 }, (_, index) => {
    const x = start + ((end - start) * index) / count;
    return [x, fn(x)];
  });
