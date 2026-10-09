import React, { useId } from 'react';
export const ink = {
  query: '#e5b85c',
  A: '#78b5e3',
  B: '#cd9fe9',
  observed: '#e2e2e2',
  estimated: '#dfad74',
  missing: '#c3a0d5',
  muted: '#a5a5ae',
  axis: '#777781'
};
export function fmt(value, precision = 6) {
  if (value === null || value === undefined) return 'NA';
  if (typeof value !== 'number') return String(value);
  if (!Number.isFinite(value)) return 'undefined';
  return Number(value.toPrecision(precision)).toString();
}
export function Figure({
  id,
  children,
  caption
}) {
  return <figure className="prep-figure" data-drawing-id={id} aria-label={caption}>
    {children}<figcaption><span className="prep-id">{id}</span> {caption}</figcaption>
  </figure>;
}
export function Table({
  headers,
  rows,
  caption,
  label
}) {
  return <div className="prep-table-scroll" tabIndex={0} role="region" aria-label={caption || label || 'Complete values; scroll horizontally when needed'}>
    <table><caption>{caption}</caption><thead><tr>{headers.map((header, i) => <th key={i} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{typeof value === 'number' || value === null || value === undefined ? fmt(value) : value}</td>)}</tr>)}</tbody></table>
  </div>;
}
export function Matrix({
  values,
  columns,
  rowLabels,
  missing,
  highlightRows = [],
  label
}) {
  return <div className="prep-matrix"><Table caption={label} headers={['Row', ...columns]} rows={values.map((row, i) => [<span className={highlightRows.includes(i) ? 'prep-selected' : ''}>{rowLabels?.[i] ?? i}</span>, ...row.map((value, j) => <span className={`prep-cell${missing?.[i]?.[j] || value === null ? ' prep-cell--estimated' : ''}${highlightRows.includes(i) ? ' prep-cell--selected' : ''}`}>
      {React.isValidElement(value) ? value : fmt(value)}{missing?.[i]?.[j] && value !== null ? <span className="prep-cell-note">filled</span> : null}
    </span>)])} /></div>;
}
export function Cells({
  values,
  names,
  mask,
  label
}) {
  return <div className="prep-cells" aria-label={label}>{values.map((value, i) => <div key={i} className={mask?.[i] ? 'prep-coordinate prep-cell--estimated' : 'prep-coordinate'}>
    <span>{names?.[i] ?? `coordinate ${i}`}</span><strong>{fmt(value)}</strong>{mask?.[i] ? <small>originally missing</small> : null}
  </div>)}</div>;
}
export function Plot({
  points = [],
  paths = [],
  circles = [],
  xDomain = [-1, 1],
  yDomain = [-1, 1],
  equal = false,
  xLabel,
  yLabel,
  label,
  children
}) {
  const marker = useId().replaceAll(':', '');
  const left = 58,
    right = 382,
    top = 32,
    bottom = 356;
  let [xmin, xmax] = xDomain,
    [ymin, ymax] = yDomain;
  if (equal) {
    const span = Math.max(xmax - xmin, ymax - ymin),
      cx = (xmin + xmax) / 2,
      cy = (ymin + ymax) / 2;
    xmin = cx - span / 2;
    xmax = cx + span / 2;
    ymin = cy - span / 2;
    ymax = cy + span / 2;
  }
  const x = value => left + (value - xmin) / (xmax - xmin) * (right - left);
  const y = value => bottom - (value - ymin) / (ymax - ymin) * (bottom - top);
  const ticks = (low, high) => [low, low + (high - low) / 2, high];
  return <div className="prep-plot"><p className="prep-axis-labels"><span>Horizontal: {xLabel}</span><span>Vertical: {yLabel}</span></p><svg viewBox="0 0 440 398" role="img" aria-label={label}>
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke" /></marker></defs>
    {ticks(xmin, xmax).map(value => <g key={`x${value}`}><line x1={x(value)} x2={x(value)} y1={top} y2={bottom} className="prep-grid" /><text x={x(value)} y={bottom + 24} textAnchor="middle">{fmt(value, 3)}</text></g>)}
    {ticks(ymin, ymax).map(value => <g key={`y${value}`}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className="prep-grid" /><text x={left - 8} y={y(value) + 5} textAnchor="end">{fmt(value, 3)}</text></g>)}
    <line x1={left} x2={right} y1={y(Math.min(ymax, Math.max(ymin, 0)))} y2={y(Math.min(ymax, Math.max(ymin, 0)))} stroke={ink.axis} />
    <line x1={x(Math.min(xmax, Math.max(xmin, 0)))} x2={x(Math.min(xmax, Math.max(xmin, 0)))} y1={top} y2={bottom} stroke={ink.axis} />
    {circles.map((circle, i) => <circle key={i} cx={x(circle.x || 0)} cy={y(circle.y || 0)} r={circle.radius / (xmax - xmin) * (right - left)} fill="none" stroke={circle.color || ink.muted} strokeDasharray="5 5" />)}
    {paths.map((path, i) => <polyline key={i} points={path.values.filter(row => row.every(Number.isFinite)).map(([px, py]) => `${x(px)},${y(py)}`).join(' ')} fill="none" stroke={path.color || ink.query} strokeWidth={path.width || 2} strokeDasharray={path.dashed ? '5 4' : undefined} markerEnd={path.arrow ? `url(#${marker})` : undefined} />)}
    {points.map((point, i) => <g key={i}>{i % 3 === 1 ? <rect x={x(point.x) - (point.radius || 5)} y={y(point.y) - (point.radius || 5)} width={2 * (point.radius || 5)} height={2 * (point.radius || 5)} fill={point.color || ink.query} stroke="#171719" /> : i % 3 === 2 ? <path d={`M${x(point.x)} ${y(point.y) - 7} l7 7 l-7 7 l-7 -7Z`} fill={point.color || ink.query} stroke="#171719" /> : <circle cx={x(point.x)} cy={y(point.y)} r={point.radius || 5} fill={point.color || ink.query} stroke="#171719" strokeWidth="1.5" />}</g>)}
    {children?.({
        x,
        y
      })}
  </svg>{points.some(point => point.id) ? <ul className="prep-plot-key">{points.map((point, i) => point.id ? <li key={i}><span style={{
          color: point.color || ink.query
        }}>{['●', '■', '◆'][i % 3]} {point.id}</span>: ({fmt(point.x)}, {fmt(point.y)})</li> : null)}</ul> : null}</div>;
}
export function NumberLine({
  values,
  min,
  max,
  label,
  colors = [],
  marks = []
}) {
  const domainMin = min ?? Math.min(0, ...values, ...marks.map(mark => mark.value));
  const domainMax = max ?? Math.max(1, ...values, ...marks.map(mark => mark.value));
  const span = domainMax - domainMin || 1,
    x = value => 38 + (value - domainMin) / span * 364;
  return <div className="prep-number-line"><svg viewBox="0 0 440 134" role="img" aria-label={label}>
    <line x1="38" x2="402" y1="55" y2="55" stroke={ink.axis} />
    {[domainMin, domainMax].map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1="49" y2="61" stroke={ink.axis} /><text x={x(value)} y="88" textAnchor="middle">{fmt(value, 4)}</text></g>)}
    {values.map((value, i) => <circle key={i} cx={x(value)} cy={55 - values.slice(0, i).filter(old => old === value).length * 10} r="4" fill={colors[i] || ink.A} />)}
    {marks.map((mark, i) => <line key={i} x1={x(mark.value)} x2={x(mark.value)} y1="26" y2="65" stroke={mark.color || ink.query} />)}
  </svg><p className="prep-axis-labels">{label}</p>{marks.length ? <ul className="prep-plot-key">{marks.map((mark, i) => <li key={i}>{mark.id}: {fmt(mark.value)}</li>)}</ul> : null}</div>;
}
export function Bars({
  rows,
  maximum,
  label
}) {
  const max = maximum ?? Math.max(...rows.map(row => Math.abs(row.value)), 1);
  return <div className="prep-bars" aria-label={label}>{rows.map((row, i) => <div key={i} className="prep-bar-row"><span>{row.name}</span><div className="prep-bar-track"><span style={{
          width: `${100 * Math.abs(row.value) / max}%`,
          background: row.color || ink.A
        }} /></div><strong>{fmt(row.value)}</strong></div>)}</div>;
}
