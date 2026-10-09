import { useEffect, useId, useRef, useState } from 'react';
import { colors } from '../../data/soft-prompt-models.js';
import './soft-prompt-flow.css';

export const fmt = (number, digits = 5) => number == null ? 'not defined'
  : Number.isInteger(number) ? String(number) : number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '').replace(/^-0$/, '0');
export const vec = values => `[${values.map(value => typeof value === 'number' ? fmt(value) : value).join(', ')}]`;
export function Figure({ id, caption, children }) {
  return <figure className="soft-figure" data-soft-figure={id}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}
export function Controls({ children, reset }) {
  return <div className="soft-controls">{children}{reset && <button type="button" onClick={reset}>Reset</button>}</div>;
}
export function Select({ label, value, options, onChange }) {
  const id = useId();
  return <label className="soft-control" htmlFor={id}><span>{label}</span>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </label>;
}
export function Range({ label, value, min, max, step = .1, onChange }) {
  const id = useId();
  return <label className="soft-control" htmlFor={id}>
    <span>{label}: <output htmlFor={id}>{fmt(value)}</output></span>
    <input id={id} type="range" value={value} min={min} max={max} step={step}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
export function Check({ label, checked, onChange }) {
  return <label className="soft-check"><input type="checkbox" checked={checked}
    onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export function Scroll({ label, children }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const update = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);
  return <div className="soft-scroll-shell"><div ref={ref} className="soft-scroll"
    role="region" tabIndex={0} aria-label={label}>{children}</div>
    {overflow && <p className="soft-scroll-cue">↔ Scroll sideways, or focus this drawing and use arrow keys.</p>}
  </div>;
}
export function Matrix({ title, rows, rowLabels, columns, color = colors.fixed, rowColors, selected, selectedRows }) {
  return <div className="soft-matrix-object"><p>{title}</p>
    <Scroll label={title}><table className="soft-matrix" style={{ '--role': color }}>
      <thead><tr><th>row ↓ / coordinate →</th>{(columns || rows[0]?.map((_, j) => j)).map((name, i) =>
        <th scope="col" key={i}>{name}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} style={{ '--role': rowColors?.[i] || color }}><th scope="row">{rowLabels?.[i] ?? i}</th>
        {row.map((value, j) => <td key={j} data-selected={selectedRows?.includes(i) || selected?.[0] === i && selected?.[1] === j || undefined}>
          {typeof value === 'number' ? fmt(value) : value}</td>)}
      </tr>)}</tbody>
    </table></Scroll>
  </div>;
}
export function Lanes({ rows, label }) {
  return <Scroll label={label}><table className="soft-lanes"><tbody>{rows.map((row, i) =>
    <tr key={i}><th scope="row">{row.name}</th>{row.values.map((value, j) =>
      <td key={j} style={{ '--role': row.colors?.[j] || row.color || colors.real }}
        data-selected={row.selected?.includes(j) || undefined}>{value}</td>)}
    </tr>)}</tbody></table></Scroll>;
}
export function Mask({ rows, columns, labels, active, prefix = 0 }) {
  return <Scroll label="Attention visibility: query rows by key columns"><table className="soft-mask">
    <thead><tr><th>query ↓ / key →</th>{columns.map((name, j) => <th key={j} scope="col"
      style={{ color: j < prefix ? colors.prompt : colors.real }}>{name}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i} data-selected={active === i || undefined}>
      <th scope="row">{labels?.[i] ?? `q${i}`}</th>{row.map((visible, j) => <td key={j}
        data-allowed={visible || undefined} style={{ '--role': j < prefix ? colors.prompt : colors.real }}
        aria-label={`Query ${i}, key ${columns[j]}: ${visible ? 'visible' : 'blocked'}`}>{visible ? '●' : '×'}</td>)}
    </tr>)}</tbody></table></Scroll>;
}
export function Bars({ names, values, maximum = 1, color = colors.target, label }) {
  return <div className="soft-bars" aria-label={label}>{values.map((value, i) =>
    <div className="soft-bar-row" key={i}><span>{names[i]} <output>{fmt(value)}</output></span>
      <div className="soft-bar-track"><i style={{ width: `${100 * Math.max(0, Math.min(1, value / maximum))}%`, background: color }} /></div>
    </div>)}</div>;
}
export function SoftTable({ label, caption, headers, rows }) {
  const title = label || caption;
  return <div className="soft-table-object"><p>{title}</p><Scroll label={title}>
    <table className="soft-table"><thead><tr>{headers.map((text, i) => <th key={i} scope="col">{text}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0
        ? <th key={j} scope="row">{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody>
    </table></Scroll></div>;
}
export function Arrow({ children = '↓', color = colors.fixed }) {
  return <div className="soft-arrow" style={{ color }}>{children}</div>;
}
export function Operation({ children, color = colors.fixed }) {
  return <div className="soft-operation" style={{ '--role': color }}>{children}</div>;
}
export function useObservation(file) {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetch(file.startsWith('/') ? file : `/learn-code/p-tuning/results/${file}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(data => setState({ status: 'ready', data }))
      .catch(error => { if (error.name !== 'AbortError') setState({ status: 'error', message: error.message }); });
    return () => controller.abort();
  }, [file, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
export function ObservationState({ state }) {
  if (state.status === 'ready') return null;
  return <div role="status" className="soft-observation-state">{state.status === 'loading'
    ? 'Loading the recorded observation…' : <>Could not load this recorded observation: {state.message}.
      <button type="button" onClick={state.retry}>Retry observation</button></>}</div>;
}
