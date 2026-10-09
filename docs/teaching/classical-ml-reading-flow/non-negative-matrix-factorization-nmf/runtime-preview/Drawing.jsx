import React, { useId } from 'react';
import { fmt } from './nmf-model.js';
export const colors = ['#7bb7ff', '#ee8faf', '#78d3e2', '#c1a1ee', '#f2c276', '#9b9fe8', '#dca47e', '#e1c7cf'];
export function Figure({
  id,
  caption,
  children
}) {
  return <figure className="nmf-figure" data-nmf-figure={id}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Panels({
  children
}) {
  return <div className="nmf-panels">{children}</div>;
}
export function Matrix({
  values,
  label,
  rows,
  columns,
  componentRows = false,
  componentColumns = false,
  color,
  selected,
  signed = false,
  max = 4
}) {
  return <div className="nmf-array"><p className="nmf-object-label">{label}</p><div className="nmf-array-scroll" tabIndex={0} role="region" aria-label={`${label}; complete labelled array, scroll horizontally when needed`}><table><thead><tr><th scope="col" aria-label="Row identity" />{values[0].map((_, j) => <th scope="col" key={j}>{columns?.[j] ?? `F${j}`}</th>)}</tr></thead><tbody>{values.map((r, i) => <tr key={i}><th scope="row">{rows?.[i] ?? `R${i}`}</th>{r.map((v, j) => <td key={j} data-missing={typeof v === 'string' && /missing|not observed|excluded/.test(v) ? '' : undefined} data-selected={selected?.[0] === i && selected?.[1] === j ? '' : undefined} style={{
              background: typeof v === 'number' ? `color-mix(in srgb, ${signed ? v < 0 ? '#ee8faf' : '#7bb7ff' : color ?? (componentRows || rows?.every(r => /^C\d$/.test(r)) ? colors[i % 8] : componentColumns || columns?.every(c => /^C\d$/.test(c)) ? colors[j % 8] : '#9ca7b5')} ${Math.min(75, Math.abs(v) / max * 65)}%, transparent)` : undefined
            }}>{fmt(v)}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Table({
  caption,
  headers,
  rows
}) {
  const id = useId();
  return <div className="nmf-table-wrapper"><p id={id} className="nmf-object-label">{caption}</p><div className="nmf-table" tabIndex={0} role="region" aria-label={`${caption}; scroll table horizontally when needed`}><table aria-labelledby={id}><thead><tr>{headers.map((h, i) => <th scope="col" key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Bars({
  values,
  label,
  ids,
  max = 4,
  component = false,
  signed = false,
  color = '#aab6c7'
}) {
  return <div className="nmf-bars"><p className="nmf-object-label">{label}</p><p className="nmf-ruler">{signed ? `−${max} · 0 · +${max}` : `0 → ${max}`} · units named above</p>{values.map((v, i) => <div className="nmf-bar-row" key={i}><span>{ids?.[i] ?? `F${i}`}</span><span className={`nmf-bar-track${signed ? ' nmf-bar-track--signed' : ''}`}><span style={{
          left: signed ? v < 0 ? `${50 - 50 * Math.abs(v) / max}%` : '50%' : 0,
          width: `${(signed ? 50 : 100) * Math.abs(v) / max}%`,
          background: signed ? v < 0 ? colors[1] : colors[0] : component ? colors[i % 8] : color
        }} /></span><output>{fmt(v)}</output></div>)}</div>;
}
export function Plot({
  label,
  xmin = 0,
  xmax = 4,
  ymin = 0,
  ymax = 4,
  xlabel = 'F0',
  ylabel = 'F1',
  xticks,
  children
}) {
  const map = ([x, y]) => [60 + (x - xmin) / (xmax - xmin) * 210, 250 - (y - ymin) / (ymax - ymin) * 210];
  return <div className="nmf-plot"><p className="nmf-object-label">{label}</p><svg viewBox="0 0 300 282" role="img" aria-label={`${label}; ${xlabel} horizontal ${xmin}–${xmax}, ${ylabel} vertical ${ymin}–${ymax}`}><path d="M60 25V250H280" fill="none" stroke="currentColor" opacity=".6" />{[0, .25, .5, .75, 1].map(t => <g key={t}><path d={`M55 ${250 - t * 210}h5`} stroke="currentColor" /><text x={51} y={255 - t * 210} textAnchor="end">{fmt(ymin + t * (ymax - ymin))}</text></g>)}{(xticks ?? [0, .25, .5, .75, 1].map(t => xmin + t * (xmax - xmin))).map(x => <g key={x}><path d={`M${map([x, ymin])[0]} 250v5`} stroke="currentColor" /><text x={map([x, ymin])[0]} y="275" textAnchor="middle">{fmt(x)}</text></g>)}{children(map)}</svg><p className="nmf-ruler">Horizontal: {xlabel}. Vertical: {ylabel}.</p></div>;
}
export function Point({
  at,
  label,
  color = colors[0],
  open = false,
  diamond = false
}) {
  return <g>{diamond ? <path d={`M${at[0]} ${at[1] - 7}l7 7l-7 7l-7-7Z`} fill={open ? 'none' : color} stroke={color} strokeWidth="2" /> : <circle cx={at[0]} cy={at[1]} r="5" fill={open ? 'none' : color} stroke={color} strokeWidth="2" />}{label && <text x={at[0] + (at[0] > 215 ? -10 : 10)} y={at[1] + (at[1] < 45 ? 22 : -10)} textAnchor={at[0] > 215 ? 'end' : 'start'} fill={color}>{label}</text>}</g>;
}
export function Arrow({
  from,
  to,
  color = colors[0],
  dashed = false
}) {
  const id = useId().replaceAll(':', '');
  if (from[0] === to[0] && from[1] === to[1]) return null;
  return <g><defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill={color} /></marker></defs><path d={`M${from.join(' ')}L${to.join(' ')}`} stroke={color} strokeWidth="2" strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#${id})`} /></g>;
}
export function Curve({
  map,
  fn,
  xmin = 0,
  xmax = 4,
  color = colors[0]
}) {
  const points = Array.from({
    length: 81
  }, (_, i) => {
    const x = xmin + i * (xmax - xmin) / 80;
    return map([x, fn(x)]).join(',');
  }).join(' ');
  return <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" />;
}
export function Controls({
  children,
  onReset
}) {
  return <div className="nmf-controls">{children}<button type="button" onClick={onReset}>Reset</button></div>;
}
export function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 4,
  step = .25
}) {
  const id = useId();
  return <label htmlFor={id}>{label}: <output>{fmt(value)}</output><input id={id} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} /></label>;
}
export function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label htmlFor={id}>{label}<select id={id} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select></label>;
}
export function Result({
  children
}) {
  return <p className="nmf-current" aria-live="polite" aria-atomic="true">{children}</p>;
}
