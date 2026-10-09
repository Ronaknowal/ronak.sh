import { useEffect, useId, useRef, useState } from 'react';
import { requestColors } from '../../data/continuous-batching-models.js';
import './continuous-batching-flow.css';
export const fmt = (value, digits = 4) => value == null ? 'not defined' : typeof value !== 'number' ? value : Number.isInteger(value) ? String(value) : Math.abs(value) < .0001 && value !== 0 ? value.toExponential(3) : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
export const vec = values => `[${values.map(value => fmt(value)).join(', ')}]`;
export function Figure({
  id,
  caption,
  children
}) {
  return <figure className="cb-figure" data-cb-figure={id}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}
export function Controls({
  children,
  reset
}) {
  return <div className="cb-controls">{children}{reset && <button type="button" onClick={reset}>Reset</button>}</div>;
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false
}) {
  const id = useId();
  return <label htmlFor={id}><span>{label}: <output>{fmt(value)}</output></span>
    <input id={id} type="range" value={value} min={min} max={max} step={step} disabled={disabled} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
export function Check({
  label,
  checked,
  onChange,
  disabled = false
}) {
  return <label className="cb-check"><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false
}) {
  const id = useId();
  return <label htmlFor={id}><span>{label}</span><select id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
    {options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
  </select></label>;
}
export function Scroll({
  label,
  children
}) {
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
  return <div className="cb-scroll-wrap"><div ref={ref} className="cb-scroll" role="region" tabIndex={0} aria-label={label}>
    {children}</div>{overflow && <p className="cb-scroll-hint">↔ Scroll sideways; focus this region to use the arrow keys.</p>}</div>;
}
function TableValue({ value }) {
  if (typeof value !== 'string') return typeof value === 'number' ? <span className="cb-number">{fmt(value)}</span> : value;
  const number = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i;
  if (number.test(value) || /^[A-Za-z]+-\d+$/.test(value)) return <span className="cb-number">{value}</span>;
  if (/^\[.*\]$/.test(value)) return <span>{value.split(/([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)/i).map((part, i) => number.test(part) ? <span className="cb-number" key={i}>{part}</span> : part)}</span>;
  return value;
}
export function Table({ label, caption, headers, rows }) {
  return <div className="cb-table"><p>{label || caption}</p><Scroll label={label || caption || 'Cache data table'}>
    <table><thead><tr>{headers.map((header, index) => <th scope="col" key={index}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0 ? <th scope="row" key={column}><TableValue value={value} /></th> : <td key={column}><TableValue value={value} /></td>)}</tr>)}</tbody>
    </table></Scroll></div>;
}
export function Matrix({
  title,
  rows,
  rowLabels,
  columnLabels,
  selected = -1,
  identity = true,
  colors,
  permitted
}) {
  return <div className="cb-matrix"><p>{title}</p><Scroll label={title}>
    <table><thead><tr><th scope="col">row</th>{rows[0]?.map((_, column) => <th scope="col" key={column}>{columnLabels?.[column] ?? `c${column}`}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index} style={{
            '--cb-identity': colors?.[index] || (identity ? requestColors[index % 5] : '#c9cbd2')
          }}>
        <th scope="row">{rowLabels?.[index] ?? index}</th>{row.map((value, column) => <td key={column} className={`${selected === index ? 'cb-selected' : ''} ${permitted && !permitted[index][column] ? 'cb-invalid' : ''}`}>
          <span className="cb-number">{fmt(value)}</span></td>)}</tr>)}</tbody>
    </table></Scroll></div>;
}
export function Pair({
  children
}) {
  return <div className="cb-pair">{children}</div>;
}
export function Arrow({
  children
}) {
  return <p className="cb-arrow" aria-hidden={!children}>{children || '↓'}</p>;
}
export function Tokens({
  items,
  title,
  valid = items.length,
  selected = -1,
  offset = 0,
  color,
  colors,
  indexLabel = 'position',
  invalidLabel = 'not stored'
}) {
  return <div className="cb-tokens"><p>{title}</p><div className="cb-token-row">{items.map((item, index) => <div key={index} className={`cb-token ${index >= valid ? 'cb-invalid' : ''} ${selected === index ? 'cb-selected' : ''}`} style={{
        '--cb-identity': colors?.[index] || color || requestColors[(index + offset) % 5]
      }}>
      <small>{indexLabel} {index + offset}</small><span>{item}</span>{index >= valid && <small>{invalidLabel}</small>}
    </div>)}</div></div>;
}
export function Bars({
  title,
  names,
  values,
  maximum = Math.max(...values.map(Math.abs), 1),
  signed = false
}) {
  return <div className="cb-bars"><p>{title}; {signed ? `−${fmt(maximum)} to +${fmt(maximum)}` : `0 to ${fmt(maximum)}`}</p>
    {values.map((value, index) => <div className="cb-bar-row" key={index}>
      <span style={{
        color: requestColors[index % 5]
      }}>{names?.[index] ?? index}</span>
      <div className={`cb-bar-track ${signed ? 'cb-signed' : ''}`}>
        <i style={{
          background: requestColors[index % 5],
          left: signed ? `${value < 0 ? 50 - 50 * Math.min(1, Math.abs(value) / maximum) : 50}%` : 0,
          width: `${(signed ? 50 : 100) * Math.min(1, Math.abs(value) / maximum)}%`
        }} />
      </div><span className="cb-number">{fmt(value)}</span>
    </div>)}</div>;
}
let observationPromise;
export function useBatchingObservations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    setError(false);
    if (!observationPromise) observationPromise = fetch('/learn-assets/continuous-batching-pagedattention/observations.json').then(response => {
      if (!response.ok) throw new Error('Unavailable');
      return response.json();
    }).catch(failure => {
      observationPromise = undefined;
      throw failure;
    });
    observationPromise.then(value => {
      if (mounted) setData(value);
    }).catch(() => {
      if (mounted) setError(true);
    });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  return {
    data,
    error,
    retry: () => setAttempt(value => value + 1)
  };
}
export function ObservationStatus({
  error,
  retry
}) {
  return error ? <p role="alert">Saved observations could not load. <button type="button" onClick={retry}>Retry</button></p> : <p role="status">Loading recorded serving observations…</p>;
}
