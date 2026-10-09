import { useEffect, useId, useRef, useState } from 'react';
import { cacheColors } from '../../data/kv-cache-models.js';
import './kv-cache-flow.css';

export const fmt = (value, digits = 4) => value == null ? 'not defined'
  : typeof value !== 'number' ? value : Number.isInteger(value) ? String(value)
    : Math.abs(value) < .0001 && value !== 0 ? value.toExponential(3)
      : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
export const vec = values => `[${values.map(value => fmt(value)).join(', ')}]`;

export function Figure({ id, caption, children }) {
  return <figure className="kv-figure" data-kv-figure={id}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}

export function Controls({ children, reset }) {
  return <div className="kv-controls">{children}{reset && <button type="button" onClick={reset}>Reset</button>}</div>;
}

export function Range({ label, value, min, max, step = 1, onChange, disabled = false }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}: <output>{fmt(value)}</output></span>
    <input id={id} type="range" value={value} min={min} max={max} step={step} disabled={disabled}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

export function Check({ label, checked, onChange }) {
  return <label className="kv-check"><input type="checkbox" checked={checked}
    onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}

export function Select({ label, value, options, onChange, disabled = false }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}</span><select id={id} value={value} disabled={disabled}
    onChange={event => onChange(event.target.value)}>
    {options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
  </select></label>;
}

export function Scroll({ label, children }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 2);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div className="kv-scroll-wrap"><div ref={ref} className="kv-scroll" role="region" tabIndex={0} aria-label={label}>
    {children}</div>{overflow && <p className="kv-scroll-hint">↔ Scroll sideways; focus this region to use the arrow keys.</p>}</div>;
}

export function Table({ label, caption, headers, rows }) {
  return <div className="kv-table"><p>{label || caption}</p><Scroll label={label || caption || 'Cache data table'}>
    <table><thead><tr>{headers.map((header, index) => <th scope="col" key={index}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0
        ? <th scope="row" key={column}>{value}</th>
        : <td key={column}><span className={typeof value === 'number' || /^[-+\d.]+(?:e[-+]?\d+)?$/i.test(String(value)) ? 'kv-number' : ''}>{fmt(value)}</span></td>)}</tr>)}</tbody>
    </table></Scroll></div>;
}

export function Matrix({ title, rows, rowLabels, columnLabels, selected = -1, identity = true, permitted }) {
  return <div className="kv-matrix"><p>{title}</p><Scroll label={title}>
    <table><thead><tr><th scope="col">row</th>{rows[0]?.map((_, column) => <th scope="col" key={column}>{columnLabels?.[column] ?? `c${column}`}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index} style={{ '--kv-identity': identity ? cacheColors[index % 5] : '#c9cbd2' }}>
        <th scope="row">{rowLabels?.[index] ?? index}</th>{row.map((value, column) => <td key={column}
          className={`${selected === index ? 'kv-selected' : ''} ${permitted && !permitted[index][column] ? 'kv-invalid' : ''}`}>
          <span className="kv-number">{fmt(value)}</span></td>)}</tr>)}</tbody>
    </table></Scroll></div>;
}

export function Pair({ children }) {
  return <div className="kv-pair">{children}</div>;
}

export function Arrow({ children }) {
  return <p className="kv-arrow" aria-hidden={!children}>{children || '↓'}</p>;
}

export function Tokens({ items, title, valid = items.length, selected = -1, offset = 0, color, invalidLabel = 'not stored' }) {
  return <div className="kv-tokens"><p>{title}</p><div className="kv-token-row">{items.map((item, index) =>
    <div key={index} className={`kv-token ${index >= valid ? 'kv-invalid' : ''} ${selected === index ? 'kv-selected' : ''}`}
      style={{ '--kv-identity': color || cacheColors[(index + offset) % 5] }}>
      <small>position {index + offset}</small><span>{item}</span>{index >= valid && <small>{invalidLabel}</small>}
    </div>)}</div></div>;
}

export function Bars({ title, names, values, maximum = Math.max(...values.map(Math.abs), 1), signed = false }) {
  return <div className="kv-bars"><p>{title}; {signed ? `−${fmt(maximum)} to +${fmt(maximum)}` : `0 to ${fmt(maximum)}`}</p>
    {values.map((value, index) => <div className="kv-bar-row" key={index}>
      <span style={{ color: cacheColors[index % 5] }}>{names?.[index] ?? index}</span>
      <div className={`kv-bar-track ${signed ? 'kv-signed' : ''}`}>
        <i style={{ background: cacheColors[index % 5],
          left: signed ? `${value < 0 ? 50 - 50 * Math.min(1, Math.abs(value) / maximum) : 50}%` : 0,
          width: `${(signed ? 50 : 100) * Math.min(1, Math.abs(value) / maximum)}%` }} />
      </div><span className="kv-number">{fmt(value)}</span>
    </div>)}</div>;
}

export function VectorPlot({ vectors, chained = false, title }) {
  let current = [0, 0];
  const segments = vectors.map(vector => {
    const start = chained ? current : [0, 0];
    const end = start.map((value, index) => value + vector.value[index]);
    current = end;
    return { ...vector, start, end };
  });
  const limit = Math.max(1, ...segments.flatMap(segment => [...segment.start, ...segment.end].map(Math.abs))) * 1.2;
  const px = value => 190 + value / limit * 145;
  const py = value => 175 - value / limit * 145;
  const id = useId().replaceAll(':', '');
  return <div><p>{title}</p><Scroll label={title}>
    <svg viewBox="0 0 380 350" className="kv-vector" role="img" aria-label={`${title}; equal coordinate scale, extent plus or minus ${fmt(limit)}; ${vectors.map(v => `${v.label} ${vec(v.value)}`).join('; ')}`}>
      <defs>{segments.map((segment, index) => <marker id={`${id}-${index}`} key={index} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L8 4L0 8Z" fill={segment.color || cacheColors[index % 5]} /></marker>)}</defs>
      <path d="M30 175H350M190 15V335" stroke="#777b88" fill="none" />
      <text x="345" y="198">x</text><text x="202" y="22">y</text><text x="196" y="194">0</text>
      <text x="25" y="195">−{fmt(limit, 2)}</text><text x="315" y="160">{fmt(limit, 2)}</text>
      {segments.map((segment, index) => <line key={index} x1={px(segment.start[0])} y1={py(segment.start[1])}
        x2={px(segment.end[0])} y2={py(segment.end[1])} stroke={segment.color || cacheColors[index % 5]}
        strokeWidth="3" markerEnd={`url(#${id}-${index})`} />)}
    </svg></Scroll>
    <div className="kv-legend">{vectors.map((vector, index) => <span key={index} style={{ color: vector.color || cacheColors[index % 5] }}>
      {vector.label}: [{vector.value.map((value, coordinate) => <span key={coordinate}>
        {coordinate > 0 && ', '}<span className="kv-number">{fmt(value)}</span>
      </span>)}]
    </span>)}</div>
  </div>;
}

export function Slots({ title, length, capacity, color = cacheColors[0], pageSize = 0, labels = false }) {
  return <div className="kv-slots"><p>{title}: {length} occupied / {capacity} allocated</p><div style={{ '--kv-identity': color }}>
    {Array.from({ length: capacity }, (_, index) => <span key={index}
      className={`${index >= length ? 'kv-invalid' : ''} ${pageSize && index % pageSize === 0 ? 'kv-page-start' : ''}`}
      title={`slot ${index}: ${index < length ? 'occupied' : 'unused'}`}>{labels ? index : ''}</span>)}
  </div></div>;
}

let observationPromise;
export function useCacheObservations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    setError(false);
    if (!observationPromise) observationPromise = fetch('/learn-assets/kv-cache-memory-management/observations.json')
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
      .catch(failure => { observationPromise = undefined; throw failure; });
    observationPromise.then(value => { if (mounted) setData(value); }).catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, [attempt]);
  return { data, error, retry: () => setAttempt(value => value + 1) };
}

export function ObservationStatus({ error, retry }) {
  return error ? <p role="alert">Saved observations could not load. <button type="button" onClick={retry}>Retry</button></p>
    : <p role="status">Loading recorded cache observations…</p>;
}
