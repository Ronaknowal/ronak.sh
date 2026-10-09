import { useEffect, useId, useRef, useState } from 'react';
import { candidateColors } from '../../data/typed-decision-models.js';
import './typed-decision-flow.css';

export const fmt = (value, digits = 4) => value == null ? 'undefined' : !Number.isFinite(value)
  ? (value > 0 ? '+∞' : '−∞') : Math.abs(value) > 0 && Math.abs(value) < 1e-5
    ? value.toExponential(2) : Number.isInteger(value) ? String(value)
      : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '').replace(/^-0$/, '0');
export const vector = row => `[${row.map(x => fmt(x)).join(', ')}]`;
export function Figure({ id, caption, children }) {
  return <figure className="typed-figure" data-typed-figure={id}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Controls({ children, reset }) {
  return <div className="typed-controls">{children}{reset && <button type="button" onClick={reset}>Reset</button>}</div>;
}
export function Range({ label, value, min = 0, max = 1, step = .05, onChange }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}: <output>{fmt(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
export function Check({ label, checked, onChange, disabled = false }) {
  return <label className="typed-check"><input type="checkbox" disabled={disabled} checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export function Select({ label, value, options, onChange, disabled = false }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}</span><select id={id} disabled={disabled} value={value} onChange={event => onChange(event.target.value)}>
    {options.map(([key, name]) => <option value={key} key={key}>{name}</option>)}
  </select></label>;
}
export function Scroll({ label, children }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div><div className="typed-scroll" ref={ref} tabIndex={0} role="region" aria-label={label}>{children}</div>
    {overflow && <p className="typed-cue">↔ More drawing to the right. Focus here and use arrow keys to pan.</p>}</div>;
}
export function Table({ caption, headers, rows }) {
  return <div className="typed-table"><Scroll label={caption || 'Exact values'}><table>
    {caption && <caption>{caption}</caption>}<thead><tr>{headers.map((x, i) => <th scope="col" key={i}>{x}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i}>{row.map((x, j) => j === 0
      ? <th scope="row" key={j}>{x}</th> : <td key={j}>{typeof x === 'number' ? fmt(x) : x}</td>)}</tr>)}</tbody>
  </table></Scroll></div>;
}
export function Bars({ values, names, title, colors = candidateColors, max = 1 }) {
  return <div className="typed-bars"><p>{title} <small>0–{fmt(max)}</small></p>{values.map((value, i) => <div key={i}>
    <span style={{ color: colors[i % colors.length] }}>{names?.[i] ?? String.fromCharCode(65 + i)}: {fmt(value)}</span>
    <div className="typed-bar-track"><i style={{ width: `${100 * value / max}%`, background: colors[i % colors.length] }} /></div>
  </div>)}</div>;
}
export function Matrix({ values, rowNames, colNames, label, colors = candidateColors, selected = -1, signed = false }) {
  const magnitude = Math.max(...values.flat().map(Math.abs), 1e-12);
  return <div><p>{label}</p><Scroll label={label}><div className="typed-matrix" style={{ gridTemplateColumns: `max-content repeat(${values[0].length}, minmax(3.2rem, 1fr))` }}>
    <span />{values[0].map((_, j) => <b key={`head${j}`}>{colNames?.[j] ?? j}</b>)}
    {values.flatMap((row, i) => [<b key={`row${i}`} style={{ color: colors[i % colors.length] }}>{rowNames?.[i] ?? i}</b>, ...row.map((value, j) =>
      <span key={`${i}-${j}`} className={selected === i ? 'typed-cell-selected' : ''} style={{
        '--cell-color': signed ? (value < 0 ? '#ff997e' : '#7db8ff') : colors[i % colors.length],
        background: `color-mix(in srgb, ${signed ? (value < 0 ? '#ff997e' : '#7db8ff') : colors[i % colors.length]} ${12 + 50 * Math.abs(value) / magnitude}%, transparent)`,
      }}>{fmt(value, 3)}</span>)])}
  </div></Scroll>{signed && <p className="typed-cue">Coral = negative; blue = nonnegative. Stronger fill means larger absolute value within this matrix.</p>}</div>;
}
export function Tensor({ rows, columns, label, color = '#b5a0ff', rowColors }) {
  const shownRows = Math.min(rows, 6);
  const shownColumns = Math.min(columns, 32);
  return <div className="typed-tensor"><p style={{ color }}>{label} <strong>{rows} × {columns}</strong></p>
    <div className="typed-tensor-grid" style={{ gridTemplateColumns: `repeat(${shownColumns}, 1fr)`, width: `${shownColumns}rem` }}>
      {Array.from({ length: shownRows * shownColumns }, (_, i) => <i key={i} style={{ background: rowColors?.[Math.floor(i / shownColumns)] || color }} />)}
    </div>{(rows > shownRows || columns > shownColumns) && <small>{shownRows} of {rows} rows drawn; width shows {shownColumns}{columns > 32 ? ' representative' : ''} coordinates.</small>}
  </div>;
}
export function Pair({ children }) { return <div className="typed-pair">{children}</div>; }
export function Arrow({ children = '↓' }) { return <p className="typed-arrow">{children}</p>; }
export function Plot({ series, xLabel, yLabel, xDomain, yDomain, points = false, reference, vertical }) {
  const data = series.flatMap(s => s.values).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const xd = xDomain || [Math.min(...data.map(p => p[0])), Math.max(...data.map(p => p[0]))];
  const yd = yDomain || [Math.min(0, ...data.map(p => p[1])), Math.max(...data.map(p => p[1])) * 1.05];
  const px = x => 72 + 380 * (x - xd[0]) / (xd[1] - xd[0] || 1);
  const py = y => 235 - 180 * (y - yd[0]) / (yd[1] - yd[0] || 1);
  return <div className="typed-plot"><p>{yLabel}</p><Scroll label={`${yLabel} against ${xLabel}`}>
    <svg viewBox="0 0 510 295" role="img" aria-label={`${yLabel} against ${xLabel}`}>
      {[0, .5, 1].map(t => <g key={t}><path d={`M72 ${235 - 180 * t}H455`} stroke="#424650" />
        <text x="62" y={240 - 180 * t} textAnchor="end">{fmt(yd[0] + t * (yd[1] - yd[0]), 3)}</text></g>)}
      <path d="M72 50V235H455" stroke="#9c9fa6" fill="none" />
      {reference && <path d={`M${px(reference[0][0])} ${py(reference[0][1])}L${px(reference[1][0])} ${py(reference[1][1])}`} stroke="#999" strokeDasharray="4 4" />}
      {vertical != null && <path d={`M${px(vertical)} 52V235`} stroke="#ddd" strokeDasharray="4 4" />}
      {series.map((s, i) => <g key={s.name} style={{ color: s.color || candidateColors[i] }}>
        {!points && <path d={s.values.filter(p => p.every(Number.isFinite)).map(([x, y], j) => `${j ? 'L' : 'M'}${px(x)} ${py(y)}`).join(' ')} stroke="currentColor" strokeWidth="2" fill="none" />}
        {(points || s.markers) && s.values.filter(p => p.every(Number.isFinite)).map(([x, y], j) => <circle key={j} cx={px(x)} cy={py(y)} r="3.5" fill="currentColor" />)}
      </g>)}
      {[0, .5, 1].map(t => <text key={t} x={72 + t * 380} y="260" textAnchor="middle">{fmt(xd[0] + t * (xd[1] - xd[0]), 3)}</text>)}
      <text x="260" y="286" textAnchor="middle">{xLabel}</text>
    </svg>
  </Scroll><div className="typed-key">{series.map((s, i) => <span key={s.name} style={{ color: s.color || candidateColors[i] }}>● {s.name}</span>)}</div></div>;
}

let observationState = { loading: true };
let observationPromise;
const observationListeners = new Set();
function publishObservation(next) {
  observationState = next;
  observationListeners.forEach(listener => listener(next));
}
function loadObservations() {
  if (observationPromise) return;
  publishObservation({ loading: true });
  observationPromise = fetch('/learn-assets/typed-decision-systems/observations.json')
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(data => publishObservation({ data }))
    .catch(error => publishObservation({ error: error.message }));
}
export function useObservations() {
  const [state, setState] = useState(observationState);
  useEffect(() => {
    observationListeners.add(setState);
    setState(observationState);
    loadObservations();
    return () => observationListeners.delete(setState);
  }, []);
  return { ...state, retry: () => { observationPromise = undefined; loadObservations(); } };
}
export function EvidenceState({ state }) {
  return state.loading ? <p role="status">Loading recorded observations…</p> : state.error
    ? <p role="alert">Recorded observations unavailable: {state.error} <button type="button" onClick={state.retry}>Retry</button></p> : null;
}
