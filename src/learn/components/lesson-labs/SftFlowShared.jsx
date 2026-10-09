import { useEffect, useId, useRef, useState } from 'react';
import { roles } from '../../data/sft-models.js';
import './sft-flow.css';

export const fmt = (value, places = 5) => value == null ? 'undefined'
  : Number.isInteger(value) ? String(value) : value.toFixed(places).replace(/0+$/, '').replace(/\.$/, '');
export const vec = values => `[${values.map(value => typeof value === 'number' ? fmt(value) : value).join(', ')}]`;

export function Figure({ id, caption, children }) {
  return <figure className="sft-figure" data-sft-figure={id}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}
export function Controls({ children, reset }) {
  return <div className="sft-controls">{children}
    {reset && <button type="button" onClick={reset}>Reset</button>}
  </div>;
}
export function Select({ label, value, options, onChange }) {
  const id = useId();
  return <label className="sft-control" htmlFor={id}><span>{label}</span>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
    </select>
  </label>;
}
export function Range({ label, value, min, max, step = .05, onChange }) {
  const id = useId();
  return <label className="sft-control" htmlFor={id}>
    <span>{label}: <output htmlFor={id}>{fmt(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
export function Check({ label, checked, onChange }) {
  return <label className="sft-check"><input type="checkbox" checked={checked}
    onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export function Scroll({ label, children, start = 'left' }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    let previousWidth = -1;
    const update = () => {
      setOverflow(el.scrollWidth > el.clientWidth + 1);
      if (el.clientWidth !== previousWidth) {
        if (start === 'right') el.scrollLeft = el.scrollWidth - el.clientWidth;
        previousWidth = el.clientWidth;
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);
  return <div className="sft-scroll-shell">
    <div className="sft-scroll" role="region" tabIndex={0} ref={ref}
      aria-label={`${label}${overflow ? '; scroll horizontally with arrow keys' : ''}`}>{children}</div>
    {overflow && <p className="sft-scroll-cue">↔ Scroll sideways, or focus this drawing and use arrow keys.</p>}
  </div>;
}
export function SftTable({ caption, label, headers, rows }) {
  const title = label || caption;
  return <div className="sft-table-object"><p className="sft-small">{title}</p>
    <Scroll label={title}><table className={`sft-table${headers.length === 2 ? ' sft-table-compact' : ''}`}>
      <thead><tr>{headers.map((text, i) => <th key={i} scope="col">{text}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0
        ? <th key={j} scope="row">{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody>
    </table></Scroll>
  </div>;
}
export function Lanes({ rows, label = 'Aligned position lanes' }) {
  return <Scroll label={label}><table className="sft-lanes"><tbody>
    {rows.map(({ name, values, colors, selected }, i) => <tr key={i}>
      <th scope="row">{name}</th>{values.map((value, j) => <td key={j}
        style={{ '--role': colors?.[j] || roles.muted }} data-selected={selected?.[j] || undefined}>
        {typeof value === 'number' ? fmt(value) : value}
      </td>)}
    </tr>)}
  </tbody></table></Scroll>;
}
export function Bars({ names, values, color = roles.answer, selected, maximum = 1, label }) {
  return <div className="sft-bars" aria-label={label}>{values.map((value, i) =>
    <div key={i} className="sft-bar-row" data-selected={selected === i || undefined}>
      <span>{names[i]}</span><div className="sft-bar-track">
        <i style={{ width: `${Math.max(0, Math.min(1, value / maximum)) * 100}%`, background: color }} />
      </div><output>{fmt(value, 4)}</output>
    </div>)}</div>;
}
export function AttentionMatrix({ graph, lengths, activeRow, onRow, label = 'Query rows by key columns' }) {
  let boundary = 0;
  const starts = lengths.map(length => { const start = boundary; boundary += length; return start; });
  const segment = index => starts.findLastIndex(start => index >= start);
  return <Scroll label={label}><table className="sft-attention" aria-label={label}>
    <thead><tr><th>q ↓ / k →</th>{graph.map((_, j) => <th key={j} scope="col">{j}</th>)}</tr></thead>
    <tbody>{graph.map((row, i) => <tr key={i} data-active={activeRow === i || undefined}>
      <th scope="row">{onRow ? <button type="button" aria-label={`Inspect query ${i}`}
        aria-pressed={activeRow === i} onClick={() => onRow(i)}>{i}</button> : i}</th>
      {row.map((allowed, j) => <td key={j} data-allowed={allowed || undefined}
        data-cross={allowed && segment(i) !== segment(j) || undefined}
        style={{ '--role': segment(i) === 0 ? roles.prompt : roles.tool }}
        aria-label={`Query ${i}, key ${j}: ${allowed ? 'allowed' : 'blocked'}`}>
        {allowed ? '●' : '·'}
      </td>)}
    </tr>)}</tbody>
  </table></Scroll>;
}
export function Decoder({ label, changed = false, blocks = 2 }) {
  const height = 58 + blocks * 56;
  return <div className="sft-decoder">
    <strong>{label}</strong>
    <svg viewBox={`0 0 210 ${height}`} role="img" aria-label={`Causal decoder: token rows, ${blocks} residual blocks, output map; schematic widths`}>
      <g stroke={changed ? roles.answer : roles.prompt} fill="none" strokeWidth="1.4">
        {[0, 1, 2, 3].map(i => <g key={i}>
          <circle cx={40 + i * 42} cy={height - 19} r="6" />
          <path d={`M${40 + i * 42} ${height - 25} V${39 + (blocks - 1) * 56 + 33} M${40 + i * 42} 29 V12`} />
          {Array.from({ length: blocks - 1 }, (_, j) => <path key={j} d={`M${40 + i * 42} ${83 + j * 56} V${71 + j * 56}`} />)}
        </g>)}
        {Array.from({ length: blocks }, (_, i) => 39 + i * 56).map(y => <g key={y}>
          <rect x="21" y={y} width="167" height="29" rx="3" />
          {[0, 1, 2, 3].flatMap(i => Array.from({ length: i + 1 }, (_, j) =>
            <path key={`${i}-${j}`} opacity=".6" d={`M${40 + j * 42} ${y + 24} L${40 + i * 42} ${y + 6}`} />))}
          <path d={`M188 ${y + 27} H202 V${y + 2} H188`} stroke={roles.boundary} />
        </g>)}
      </g>
    </svg>
    <span>Token rows ↑ {blocks} causal blocks + residual paths ↑ logits. Token count and width are schematic.</span>
  </div>;
}
