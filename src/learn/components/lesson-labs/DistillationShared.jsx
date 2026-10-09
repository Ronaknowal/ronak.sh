import { useEffect, useId, useRef, useState } from 'react';
import { colors } from '../../data/distillation-models.js';
import './distillation-flow.css';

export const fmt = (value, digits = 5) => value == null ? 'undefined' : Number.isInteger(value)
  ? String(value) : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '').replace(/^-0$/, '0');
export const vec = values => `[${values.map(value => typeof value === 'number' ? fmt(value) : value).join(', ')}]`;
export function Figure({ id, caption, children }) {
  return <figure className="distill-figure" data-distill-figure={id}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Controls({ children, reset }) {
  return <div className="distill-controls">{children}{reset && <button type="button" onClick={reset}>Reset</button>}</div>;
}
export function Range({ label, value, min, max, step = .1, onChange }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}: <output>{fmt(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function Check({ label, checked, onChange }) {
  return <label className="distill-check"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export function Select({ label, value, options, onChange }) {
  const id = useId();
  return <label htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={event => onChange(event.target.value)}>
    {options.map(([key, title]) => <option value={key} key={key}>{title}</option>)}
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
  return <div><div className="distill-scroll" ref={ref} tabIndex={0} role="region" aria-label={label}>{children}</div>
    {overflow && <p className="distill-cue">↔ Scroll this drawing sideways; keyboard arrow keys work after focus.</p>}</div>;
}
export function Table({ label, caption, headers, rows }) {
  return <div className="distill-table"><p>{label || caption}</p><Scroll label={label || caption || 'Data table'}>
    <table><thead><tr>{headers.map((value, index) => <th scope="col" key={index}>{value}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0
        ? <th scope="row" key={column}>{value}</th> : <td key={column}>{typeof value === 'number' ? fmt(value) : value}</td>)}</tr>)}</tbody></table>
  </Scroll></div>;
}
export function Bars({ title, values, names = ['A', 'B', 'C', 'D'], maximum = 1, color, identities = true, format = fmt }) {
  return <div className="distill-bars"><p>{title} <small>(0–{fmt(maximum)})</small></p>{values.map((value, index) =>
    <div key={index}><span style={{ color: identities ? colors.event[index % 4] : color }}>{names[index]}: {format(value)}</span>
      <div className="distill-track"><i style={{ width: `${Math.max(0, Math.min(100, 100 * value / maximum))}%`, background: identities ? colors.event[index % 4] : color }} /></div>
    </div>)}</div>;
}
export function Pair({ children }) {
  return <div className="distill-pair">{children}</div>;
}
export function Arrow({ children, color = colors.fixed }) {
  return <p className="distill-arrow" style={{ color }}>{children || '↓'}</p>;
}
export function Tree({ rows, title, selected = -1, color = colors.teacher }) {
  const leaves = rows[0].flatMap((mass, index) => rows[index + 1].map(value => mass * value));
  const x = [58, 176, 324, 442];
  return <div><p style={{ color }}>{title}</p><Scroll label={title}>
    <svg viewBox="0 0 500 245" className="distill-tree" role="img" aria-label={`${title}; root probabilities ${vec(rows[0])}, after A ${vec(rows[1])}, after B ${vec(rows[2])}, leaves ${vec(leaves)}`}>
      <g fill="none" stroke={color} strokeWidth="2">
        <path d="M250 30L117 93M250 30L383 93" />
        {[0, 1, 2, 3].map(index => <path key={index} d={`M${index < 2 ? 117 : 383} 105L${x[index]} 179`} />)}
      </g>
      <circle cx="250" cy="23" r="8" fill={color} />
      {[117, 383].map((cx, index) => <g key={cx}><circle cx={cx} cy="100" r="15" fill="#20232a" stroke={color} />
        <text x={cx} y="106" textAnchor="middle">{index === 0 ? 'A' : 'B'}</text>
        <text x={index === 0 ? 137 : 363} y="55" textAnchor="middle" className="distill-backed">{fmt(rows[0][index], 3)}</text></g>)}
      {leaves.map((mass, index) => <g key={index}>
        <text x={x[index]} y="150" textAnchor="middle" className="distill-backed">{fmt(rows[index < 2 ? 1 : 2][index % 2], 3)}</text>
        <rect x={x[index] - 33} y="177" width="66" height="29" fill="#20232a" stroke={selected === index ? '#fff' : colors.event[index]} strokeWidth={selected === index ? 3 : 1} />
        <text x={x[index]} y="197" textAnchor="middle" style={{ fill: colors.event[index] }}>{['AA', 'AB', 'BA', 'BB'][index]}</text>
        <text x={x[index]} y="232" textAnchor="middle">{fmt(mass, 4)}</text>
      </g>)}
    </svg>
  </Scroll></div>;
}
export function Curve({ series, xLabel = 'u', yLabel = 'divergence (nats)', maximum, vertical }) {
  const all = series.flatMap(item => item.values);
  const max = maximum || Math.max(...all.map(point => point[1])) * 1.05 || 1;
  const xmin = Math.min(...all.map(point => point[0]));
  const xmax = Math.max(...all.map(point => point[0]));
  const px = x => 65 + 415 * (x - xmin) / (xmax - xmin || 1);
  const py = y => 220 - 175 * y / max;
  return <div><p>{yLabel}</p><Scroll label={`${yLabel} against ${xLabel}`}>
    <svg viewBox="0 0 520 280" className="distill-curve" role="img" aria-label={`${series.map(item => item.name).join(', ')} against ${xLabel}`}>
      <path d="M65 40V220H485" stroke={colors.fixed} fill="none" />
      {[0, .5, 1].map(fraction => <g key={fraction}><text x="55" y={py(max * fraction) + 5} textAnchor="end">{fmt(max * fraction, 2)}</text>
        <path d={`M65 ${py(max * fraction)}H485`} stroke="#353943" /></g>)}
      {series.map(item => <path key={item.name} d={item.values.map(([x, y], index) => `${index ? 'L' : 'M'}${px(x)} ${py(y)}`).join(' ')} fill="none" stroke={item.color} strokeWidth="2" />)}
      {vertical != null && <path d={`M${px(vertical)} 40V220`} stroke="#fff" strokeDasharray="4 4" />}
      <text x="65" y="245">{fmt(xmin, 2)}</text><text x="480" y="245" textAnchor="end">{fmt(xmax, 2)}</text>
      <text x="275" y="270" textAnchor="middle">{xLabel}</text>
    </svg>
  </Scroll><div className="distill-key">{series.map(item => <span key={item.name} style={{ color: item.color }}>━ {item.name}</span>)}</div></div>;
}
export function useEvidence() {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    fetch('/learn-assets/llm-distillation/observations.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(data => setState({ data })).catch(error => { if (error.name !== 'AbortError') setState({ error: error.message }); });
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
export function EvidenceState({ state }) {
  return state.loading ? <p role="status">Loading recorded observations…</p>
    : state.error ? <p role="alert">Observations unavailable: {state.error} <button type="button" onClick={state.retry}>Retry</button></p> : null;
}
