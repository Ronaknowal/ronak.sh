import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { POOL } from '../../data/divergence-reading-models.js';

export const COLORS = { P: '#e6ad55', Q: '#79b8e8', difference: '#baa4e8', neutral: '#dedad2' };
export function fmt(value, digits = 6) {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '−∞';
  if (value === null || !Number.isFinite(value)) return 'undefined';
  if (value === 0) return '0';
  if (Math.abs(value) < 10 ** -digits) return value.toExponential(2);
  return String(Number(value.toFixed(digits)));
}

export function Figure({ id, children, caption }) {
  return <figure className="fd-figure" data-divergence-drawing={id}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}

export function LawKey() {
  return <ul className="fd-key"><li><span style={{ color: COLORS.P }}>●</span> P</li><li><span style={{ color: COLORS.Q }}>■</span> Q</li></ul>;
}

export function Dot({ x, y, role = 'P', size = 5, selected = false }) {
  const common = { fill: COLORS[role] ?? COLORS.neutral, stroke: selected ? '#fff' : '#151515', strokeWidth: selected ? 3 : 1 };
  return role === 'Q' ? <rect x={x - size} y={y - size} width={2 * size} height={2 * size} {...common} /> : <circle cx={x} cy={y} r={size} {...common} />;
}

export function Arrow({ x1, y1, x2, y2, color = COLORS.neutral, dashed = false }) {
  const id = useId().replaceAll(':', '');
  return <><defs><marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z" fill={color} /></marker></defs><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.6" strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#${id})`} /></>;
}

export function Svg({ label, children, width = 480, height = 270 }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const observer = new ResizeObserver(() => setScale(ref.current.getBoundingClientRect().width / width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [width]);
  return <svg ref={ref} className="fd-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ fontSize: `calc(1rem / ${scale || 1})` }}>{children}</svg>;
}

export function Table({ caption, headers, rows }) {
  return <div className="fd-table" role="region" aria-label={caption} tabIndex={0}><table><caption>{caption}</caption><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th key={j} scope="row">{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody></table></div>;
}

export function Bars({ rows, maximum, minimum = 0, label = 'Common scale', unit = '' }) {
  const span = maximum - minimum;
  return <div className="fd-bars"><p>{label}: {fmt(minimum)} to {fmt(maximum)} {unit}.</p>{rows.map((row, i) => {
    const value = row.value;
    const finite = Number.isFinite(value);
    const visible = Math.min(maximum, Math.max(minimum, finite ? value : 0));
    return <div className="fd-bar-row" key={row.label ?? i}><div><span style={{ color: row.color ?? COLORS[row.role] ?? COLORS.neutral }}>{row.label}</span><output>{fmt(value)} {unit}</output></div><div className="fd-bar-track"><i style={{ left: `${-minimum / span * 100}%` }} />{finite ? <span style={{ background: row.color ?? COLORS[row.role] ?? COLORS.neutral, left: `${(Math.min(0, visible) - minimum) / span * 100}%`, width: `${Math.abs(visible) / span * 100}%` }} /> : <b className="fd-extended">{fmt(value)} — no finite endpoint</b>}</div>{finite && (value > maximum || value < minimum) && <p>Beyond this labelled axis: {fmt(value)}.</p>}</div>;
  })}</div>;
}

export function LawColumns({ p, q, labels = ['A', 'B', 'C', 'D'] }) {
  const n = labels.length;
  const step = 380 / n;
  return <><LawKey /><p>Probability height: 0 at the baseline, 1 at the top guide.</p><Svg label="Paired probabilities attached to the same named outcomes" height={250}><path d="M45 25H435M45 190H435" stroke="#777" fill="none" />{labels.map((name, i) => {
    const x = 45 + step * (i + .5);
    return <g key={name}>{[[p[i], 'P', -10], [q[i], 'Q', 10]].map(([value, role, shift]) => <g key={role}><line x1={x + shift} y1={190} x2={x + shift} y2={190 - value * 165} stroke={COLORS[role]} strokeWidth="7" /><Dot x={x + shift} y={190 - value * 165} role={role} /></g>)}<text x={x} y="230" textAnchor="middle">{name}</text></g>;
  })}</Svg><Table caption="Probabilities in fixed outcome order" headers={['Outcome', 'P', 'Q']} rows={labels.map((name, i) => [name, fmt(p[i]), fmt(q[i])])} /></>;
}

export function Plot({ label, xDomain, yDomain, xLabel, yLabel, series = [], children, equalUnits = false, ticks = true }) {
  const innerWidth = 380;
  const innerHeight = equalUnits ? innerWidth * (yDomain[1] - yDomain[0]) / (xDomain[1] - xDomain[0]) : 190;
  const bottom = 35 + innerHeight;
  const xy = (x, y) => [50 + (x - xDomain[0]) / (xDomain[1] - xDomain[0]) * innerWidth, bottom - (y - yDomain[0]) / (yDomain[1] - yDomain[0]) * innerHeight];
  const path = points => points.filter(p => p.every(Number.isFinite)).map(([x, y], i) => `${i ? 'L' : 'M'}${xy(x, y).join(',')}`).join(' ');
  const clipId = useId().replaceAll(':', '');
  return <><p className="fd-axis-labels"><span>Horizontal: {xLabel}, {fmt(xDomain[0])} to {fmt(xDomain[1])}.</span><span>Vertical: {yLabel}, {fmt(yDomain[0])} to {fmt(yDomain[1])}.</span></p><Svg label={label} height={bottom + 55}><defs><clipPath id={clipId}><rect x="50" y="35" width={innerWidth} height={innerHeight} /></clipPath></defs><path d={`M50 35V${bottom}H430`} fill="none" stroke="#999" />{yDomain[0] < 0 && yDomain[1] > 0 && <line x1="50" x2="430" y1={xy(0, 0)[1]} y2={xy(0, 0)[1]} stroke="#999" strokeDasharray="4 4" />}{series.map((line, i) => <path key={i} d={path(line.points)} fill="none" stroke={line.color ?? COLORS.P} strokeWidth={line.width ?? 2.5} strokeDasharray={line.dashed ? '6 4' : undefined} clipPath={`url(#${clipId})`} />)}{typeof children === 'function' ? children({ xy, bottom, innerWidth, innerHeight }) : children}{ticks && <><text x="50" y={bottom + 38}>{fmt(xDomain[0], 3)}</text><text x="430" y={bottom + 38} textAnchor="end">{fmt(xDomain[1], 3)}</text></>}</Svg></>;
}

export function Ops({ steps, label = 'Operation' }) {
  return <ol className="fd-ops" aria-label={label}>{steps.map((step, i) => <li key={i}><span>{step.label}</span><output>{step.value}</output></li>)}</ol>;
}

export function Choice({ label, value, options, onChange, disabled = false }) {
  const id = useId();
  return <label className="fd-control" htmlFor={id}><span>{label}</span><select id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

const ResetContext = createContext(0);
export function Edit({ label, value, parse, onValid, type = 'text', disabled = false }) {
  const reset = useContext(ResetContext);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const id = useId();
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, reset]);
  return <label className="fd-control" htmlFor={id}><span>{label}</span><input id={id} type={type} value={draft} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined} onChange={event => {
    const text = event.target.value;
    setDraft(text);
    try { onValid(parse(text)); setError(''); } catch (failure) { setError(failure.message); }
  }} />{error && <span className="fd-error" id={id + '-error'} role="alert">{error} The last valid result stays visible.</span>}</label>;
}

export function Range({ label, value, onChange, min = 0, max = 1, step = .01, disabled = false }) {
  const id = useId();
  return <label className="fd-control" htmlFor={id}><span>{label}: <output>{fmt(value)}</output></span><input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={event => onChange(Number(event.target.value))} /></label>;
}

export function Controls({ children, reset, onReset, name = 'Reset investigation' }) {
  return <ResetContext.Provider value={reset}><div className="fd-controls">{children}<button type="button" onClick={onReset}>{name}</button></div></ResetContext.Provider>;
}

const Study = createContext();
const defaults = {
  ratio: () => ({ p: [7, 2, 1, 0], q: [4, 5, 1, 0], kind: 'kl', selected: 0 }),
  observer: () => ({ p: [4, 1, 1, 4], q: [1, 4, 4, 1], mask: [true, false, false, true], slope: 0, slopes: [-1, 0, 1] }),
  kernel: () => ({ x: [-2, -2, 2, 2], y: [-1, -1, 1, 1], sigma: 1, kind: 'rbf', query: 0, pair: ['X0', 'Y0'] }),
  estimator: () => ({ x: [-1, 1], y: [-1, 1], sigma: 1, kind: 'rbf', query: 0, pair: ['X0', 'Y0'] }),
  atomEarly: () => ({ h: .5 }),
  atomLate: () => ({ h: .5, sigma: 1 }),
  permutation: () => ({ pool: [...POOL], sigma: 1, mode: 'fixed', inspected: 0 }),
  variational: () => ({ scale: 1, offset: 0 }),
  iris: () => ({ features: 'sepal', sigma: 1, unit: 'cm', same: false, rowP: 0, rowQ: 0 }),
};

export function DivergenceStudy({ children }) {
  const [state, setState] = useState(() => Object.fromEntries(Object.entries(defaults).map(([name, create]) => [name, { ...create(), reset: 0 }])));
  const update = (name, patch) => setState(old => ({ ...old, [name]: { ...old[name], ...patch } }));
  const reset = name => setState(old => ({ ...old, [name]: { ...defaults[name](), reset: old[name].reset + 1 } }));
  return <Study.Provider value={{ state, update, reset }}>{children}</Study.Provider>;
}

export function useStudy(name) {
  const study = useContext(Study);
  return [study.state[name], patch => study.update(name, patch), () => study.reset(name)];
}
