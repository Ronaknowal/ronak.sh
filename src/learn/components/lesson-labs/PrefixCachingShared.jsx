import { useEffect, useId, useRef, useState } from 'react';
import { color, colors } from '../../data/prefix-caching-models.js';
import './prefix-caching-flow.css';
export const fmt = n => n == null ? 'not applicable' : typeof n !== 'number' ? n : Number.isInteger(n) ? String(n) : n !== 0 && Math.abs(n) < .0001 ? n.toExponential(3) : Number(n.toFixed(5)).toString();
export const vec = xs => `[${xs.join(', ')}]`;
export function Figure({
  id,
  children,
  caption
}) {
  return <figure 
  className="pc-figure" 
  data-pc-figure={id}
>
  {children}
  <figcaption>
    {caption}
  </figcaption>
</figure>;
}
export function Controls({
  children,
  reset
}) {
  return <div className="pc-controls">
  {children}
  {reset && <button 
    type="button" 
    onClick={reset}
  >Reset</button>}
</div>;
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
  return <label htmlFor={id}>
  <span>{label}: <output>
      {fmt(value)}
    </output></span>
  <input 
    id={id} 
    type="range" 
    min={min} 
    max={max} 
    step={step} 
    value={value} 
    onChange={e => onChange(Number(e.target.value))} 
    disabled={disabled} 
  />
</label>;
}
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false
}) {
  const id = useId();
  return <label htmlFor={id}>
  <span>
    {label}
  </span>
  <select 
    id={id} 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    disabled={disabled}
  >
    {options.map(([v, t]) => <option 
      value={v} 
      key={v}
    >
      {t}
    </option>)}
  </select>
</label>;
}
export function Check({
  label,
  value,
  onChange,
  disabled = false
}) {
  return <label className="pc-check">
  <input 
    type="checkbox" 
    checked={value} 
    onChange={e => onChange(e.target.checked)} 
    disabled={disabled} 
  />
  <span>
    {label}
  </span>
</label>;
}
export function Scroll({
  label,
  children
}) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const measure = () => setOverflow(el.scrollWidth > el.clientWidth + 2);
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    if (el.firstElementChild) obs.observe(el.firstElementChild);
    measure();
    return () => obs.disconnect();
  }, []);
  return <div>
  <div 
    ref={ref} 
    className="pc-scroll" 
    role="region" 
    aria-label={label} 
    tabIndex={0}
  >
    {children}
  </div>
  {overflow && <p className="pc-pan">↔ Focus the drawing or table and use arrow keys to pan.</p>}
</div>;
}
export function Graph({
  label,
  width = 720,
  height = 280,
  children
}) {
  return <Scroll label={label}>
  <svg 
    className="pc-graph" 
    viewBox={`0 0 ${width} ${height}`} 
    style={{
      width: `${width / 16}em`,
      height: `${height / 16}em`
    }} 
    role="img" 
    aria-label={label}
  >
    <title>
      {label}
    </title>
    {children}
  </svg>
</Scroll>;
}
export function Edge({
  x1,
  y1,
  x2,
  y2,
  label,
  tone = '#aaaebd',
  dashed = false
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1),
    length = 8;
  const backx = x2 - length * Math.cos(angle),
    backy = y2 - length * Math.sin(angle);
  return <g>
  <line 
    x1={x1} 
    y1={y1} 
    x2={x2} 
    y2={y2} 
    stroke={tone} 
    strokeWidth="2" 
    strokeDasharray={dashed ? '5 5' : undefined} 
  />
  <path 
    d={`M${backx + 4 * Math.sin(angle)} ${backy - 4 * Math.cos(angle)} L${x2} ${y2} L${backx - 4 * Math.sin(angle)} ${backy + 4 * Math.cos(angle)}`} 
    stroke={tone} 
    fill="none" 
    strokeWidth="2" 
  />
  {label && <text 
    x={(x1 + x2) / 2 + (Math.abs(x2 - x1) < 20 ? 12 : 0)} 
    y={(y1 + y2) / 2 - 10} 
    textAnchor={Math.abs(x2 - x1) < 20 ? "start" : "middle"} 
    fill={tone}
  >
    {label}
  </text>}
</g>;
}
export function Node({
  x,
  y,
  width = 130,
  height = 48,
  label,
  sub,
  tone = '#6daeff',
  dashed = false,
  selected = false
}) {
  return <g>
  <rect 
    x={x} 
    y={y} 
    width={width} 
    height={height} 
    fill={`${tone}18`} 
    stroke={selected ? 'white' : tone} 
    strokeWidth={selected ? 3 : 1.5} 
    strokeDasharray={dashed ? '5 4' : undefined} 
  />
  <text 
    x={x + width / 2} 
    y={y + height / 2 + (sub ? -2 : 5)} 
    textAnchor="middle" 
    fill={tone}
  >
    {label}
  </text>
  {sub && <text 
    x={x + width / 2} 
    y={y + height / 2 + 18} 
    textAnchor="middle"
  >
    {sub}
  </text>}
</g>;
}
export function Pair({
  children
}) {
  return <div className="pc-pair">
  {children}
</div>;
}
export function Tokens({
  items,
  label,
  offset = 0,
  selected = -1,
  mutedFrom = Infinity
}) {
  return <div>
  <p>
    {label}
  </p>
  <div className="pc-tokens">
    {items.map((t, i) => <span 
      className={`${selected === i ? 'pc-selected' : ''} ${i >= mutedFrom ? 'pc-muted' : ''}`} 
      style={{
        '--pc-color': color(t)
      }} 
      key={i}
    >
      <small>pos {i + offset}</small>
      <b>
        {t}
      </b>
    </span>)}
  </div>
</div>;
}
function Value({
  value
}) {
  if (typeof value === 'number') return <span className="pc-number">
  {fmt(value)}
</span>;
  if (typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)) return <span className="pc-hash">
  {value}
</span>;
  if (typeof value === 'string' && /^[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?$/i.test(value)) return <span className="pc-number">
  {value}
</span>;
  return value;
}
export function Table({
  label,
  caption,
  headers,
  rows
}) {
  return <div className="pc-table">
  <p>
    {label || caption}
  </p>
  <Scroll label={label || caption || 'Exact cache values'}>
    <table>
      <thead>
        <tr>
          {headers.map((x, i) => <th 
            scope="col" 
            key={i}
          >
            {x}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>
          {r.map((v, j) => j === 0 ? <th 
            scope="row" 
            key={j}
          >
            <Value value={v} />
          </th> : <td key={j}>
            <Value value={v} />
          </td>)}
        </tr>)}
      </tbody>
    </table>
  </Scroll>
</div>;
}
export function Pool({
  state,
  label = 'Physical pages',
  size = 4
}) {
  return <div className="pc-pool">
  <p>
    {label}
  </p>
  <Scroll label={label}>
    <div className="pc-pool-rows">
      {state.pages.map(p => <div 
        className="pc-page" 
        key={p.id}
      >
        <span>p{p.id} · g{p.generation}<small>
            {p.owners.length ? `owners ${p.owners.join('+')}` : state.free.includes(p.id) ? 'free' : 'retained'}
            {p.reserved ? ' · reserved' : ''}
          </small></span>
        <div className="pc-page-cells">
          {Array.from({
              length: size
            }, (_, i) => <span 
            className={!p.tokens.length ? 'pc-muted' : ''} 
            style={{
              '--pc-color': p.tokens[i] === undefined ? '#aaaebd' : color(p.tokens[i])
            }} 
            key={i}
          >
            {p.tokens[i] ?? '—'}
          </span>)}
        </div>
        <span>
          {p.complete ? 'full/indexed' : p.reserved ? 'not computed' : p.tokens.length ? 'partial' : 'empty'}
        </span>
      </div>)}
    </div>
  </Scroll>
  <p>Free: {vec(state.free)}. Inactive LRU oldest→newest: {vec(state.inactive_lru)}.</p>
</div>;
}
export function Stepper({
  step,
  setStep,
  max,
  reset
}) {
  return <Controls reset={reset ?? (() => setStep(0))}>
  <button 
    type="button" 
    disabled={step === 0} 
    onClick={() => setStep(step - 1)}
  >Back</button>
  <Range 
    label="Event" 
    value={step} 
    min={0} 
    max={max} 
    onChange={setStep} 
  />
  <button 
    type="button" 
    disabled={step === max} 
    onClick={() => setStep(step + 1)}
  >Next</button>
</Controls>;
}
export function Bars({
  label,
  names,
  values,
  max = Math.max(1, ...values)
}) {
  return <div className="pc-bars">
  <p>{label}; scale 0–{fmt(max)}</p>
  {values.map((v, i) => <div 
    className="pc-bar-row" 
    key={i}
  >
    <span style={{
        color: colors[i]
      }}>
      {names[i]}
    </span>
    <div className="pc-track">
      <i style={{
          width: `${100 * v / max}%`,
          background: colors[i]
        }} />
    </div>
    <span className="pc-number">
      {fmt(v)}
    </span>
  </div>)}
</div>;
}
let promise;
export function useObservations() {
  const [data, setData] = useState(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setError(false);
    if (!promise) promise = fetch('/learn-assets/prefix-caching-prompt-caching/observations.json').then(r => {
      if (!r.ok) throw Error('Unavailable');
      return r.json();
    }).catch(e => {
      promise = undefined;
      throw e;
    });
    promise.then(x => {
      if (live) setData(x);
    }).catch(() => {
      if (live) setError(true);
    });
    return () => {
      live = false;
    };
  }, [attempt]);
  return {
    data,
    error,
    retry: () => setAttempt(x => x + 1)
  };
}
export function Status({
  error,
  retry
}) {
  return error ? <p role="alert">Saved observations could not load. <button 
    type="button" 
    onClick={retry}
  >Retry</button></p> : <p role="status">Loading saved prefix-cache observations…</p>;
}
