import { useEffect, useId, useRef, useState } from 'react';
import './second-order-reading-flow.css';

export const ink = { cyan: '#82cde2', amber: '#edbd68', violet: '#bda5f3', rose: '#eea4ba', neutral: '#dedbd4', muted: '#94928d' };
export const fmt = value => value === null ? 'unavailable' : !Number.isFinite(value) ? String(value) : value === 0 ? '0' : Math.abs(value) < 0.0001 || Math.abs(value) >= 100000 ? value.toExponential(4) : Number(value.toFixed(6)).toString();
export const vec = values => `(${values.map(fmt).join(', ')})`;
export const probability = value => value < 1 && value > .9999 ? `1 − ${fmt(1 - value)}` : fmt(value);

export function Mechanism({ id, label, children, state }) {
  return <figure className="so-mechanism" data-mechanism={id} data-state={state ? JSON.stringify(state) : undefined} aria-label={label}>{children}</figure>;
}

export function Key({ items }) {
  return <ul className="so-key">{items.map(([label, colour, shape = '●']) => <li key={label}><span style={{ color: colour }} aria-hidden="true">{shape}</span> {label}</li>)}</ul>;
}

export function Readout({ rows }) {
  return <dl className="so-readout">{rows.map(([label, value], i) => <div key={`${label}-${i}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function DataTable({ label, columns, rows, scrollRows = false }) {
  return <div className={`so-table${scrollRows ? " so-table-rows" : ""}`} tabIndex={0} role="region" aria-label={scrollRows ? `${label}; scroll to read all ${rows.length} rows` : label}><table><caption>{label}</caption><thead><tr>{columns.map((v, i) => <th key={i} scope="col">{v}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
}

export function Matrix({ label, values, rows, columns, selected, scale, rowColours, columnColours }) {
  const magnitude = scale ?? Math.max(...values.flat().map(Math.abs));
  return <div className={`so-matrix-block${values[0].length >= 4 ? " so-matrix-wide" : ""}`}><p className="so-object-label">{label} · {values.length} × {values[0].length}</p><div className="so-table" tabIndex={0} role="region" aria-label={`${label} matrix entries`}><table className="so-matrix"><thead><tr><th scope="col">row / column</th>{values[0].map((_, j) => <th scope="col" key={j} style={{ color: columnColours?.[j] }}>{columns?.[j] ?? `c${j + 1}`}</th>)}</tr></thead><tbody>{values.map((row, i) => <tr key={i}><th scope="row" style={{ color: rowColours?.[i] }}>{rows?.[i] ?? `r${i + 1}`}</th>{row.map((v, j) => <td key={j} className={selected?.[0] === i && selected?.[1] === j ? 'so-selected-cell' : undefined} style={{ backgroundColor: v === 0 ? 'transparent' : `rgb(${v > 0 ? '130 205 226' : '238 164 186'} / ${.08 + .25 * Math.min(1, Math.abs(v) / magnitude)})` }}>{fmt(v)}</td>)}</tr>)}</tbody></table></div><p className="so-scale">{magnitude === 0 ? "Every entry is zero; all cells have neutral fill." : <>Signed cell fill: rose −{fmt(magnitude)} · neutral 0 · cyan +{fmt(magnitude)}.</>} Labels identify coordinates.</p></div>;
}

export function NumericControl({ label, value, onChange, min, max, step = 1, integer = false, resetKey = 0 }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, resetKey]);
  const edit = text => {
    setDraft(text);
    const next = Number(text);
    if (text.trim() === '' || !Number.isFinite(next) || next < min || next > max || (integer && !Number.isInteger(next))) {
      setError(`Enter ${integer ? 'an integer' : 'a finite number'} from ${min} to ${max}. Showing applied value ${fmt(value)}.`);
      return;
    }
    setError(''); onChange(next);
  };
  return <div className="so-field"><label htmlFor={id}>{label}</label><span className="so-applied">Applied: {fmt(value)}</span><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => { const next = Number(event.target.value); setDraft(String(next)); setError(''); onChange(next); }} /><label className="so-numeric-label" htmlFor={`${id}-number`}>Enter {label.toLowerCase()}</label><input id={`${id}-number`} type="text" inputMode="decimal" value={draft} onChange={event => edit(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />{error && <p id={`${id}-error`} role="status" className="so-error">{error}</p>}</div>;
}

export function SelectControl({ label, value, options, onChange }) {
  const id = useId();
  return <label className="so-field" htmlFor={id}>{label}<select id={id} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

export function Plane({ label, xLabel = 'x', yLabel = 'y', domain = [-1.5, 1.5], yDomain, equal = true, children, className = '', schematic = false, xTicks, compact = false }) {
  const host = useRef(null);
  const remProbe = useRef(null);
  const [width, setWidth] = useState(340);
  const [font, setFont] = useState(16);
  useEffect(() => {
    const update = () => {
      setWidth(Math.max(220, host.current?.clientWidth || 340));
      setFont(parseFloat(getComputedStyle(document.documentElement).fontSize));
    };
    update();
    const observer = new ResizeObserver(update); observer.observe(host.current); observer.observe(remProbe.current);
    return () => observer.disconnect();
  }, []);
  const yd = yDomain || domain;
  const pad = Math.max(22, font * 1.4), left = pad, right = width - pad;
  const plotWidth = right - left;
  const height = equal ? plotWidth * (yd[1] - yd[0]) / (domain[1] - domain[0]) : Math.max(compact ? 76 : 180, width * (compact ? .18 : .62));
  const top = pad, bottom = top + height;
  const x = v => left + (v - domain[0]) / (domain[1] - domain[0]) * plotWidth;
  const y = v => bottom - (v - yd[0]) / (yd[1] - yd[0]) * height;
  const inside = ([a, b]) => a >= domain[0] && a <= domain[1] && b >= yd[0] && b <= yd[1];
  const mapper = { x, y, left, right, top, bottom, width, height, font, inside };
  return <div className={`so-plane ${className}`} ref={host}><span ref={remProbe} className="so-rem-probe" aria-hidden="true" /><p className="so-object-label">{label}</p>{schematic ? <p className="so-axis-label">{yLabel}; {xLabel}. Schematic arrangement.</p> : <p className="so-axis-label">↑ {yLabel} · {fmt(yd[0])} to {fmt(yd[1])}</p>}<svg viewBox={`0 0 ${width} ${bottom + pad}`} role="img" aria-label={schematic ? `${label}; schematic positions, not measured coordinates` : `${label}; ${xLabel} from ${domain[0]} to ${domain[1]}, ${yLabel} from ${yd[0]} to ${yd[1]}${equal ? '; equal coordinate scales' : ''}`}>
    {!schematic && <path d={`M${left},${top}V${bottom}H${right}`} fill="none" stroke="#777570" />}
    {!schematic && domain[0] <= 0 && domain[1] >= 0 && <path d={`M${x(0)},${top}V${bottom}`} className="so-grid" />}
    {!schematic && yd[0] <= 0 && yd[1] >= 0 && <path d={`M${left},${y(0)}H${right}`} className="so-grid" />}
    {children(mapper)}
  </svg>{!schematic && <>{xTicks ? <div className="so-category-ticks" style={{ marginLeft: left, marginRight: width - right }}>{xTicks.map(([value, text]) => <span key={value} style={{ left: `${100 * (value-domain[0])/(domain[1]-domain[0])}%` }}>{text}</span>)}</div> : <div className="so-ticks" style={{ marginLeft: left, marginRight: width - right }}><span>{fmt(domain[0])}</span><span>{fmt((domain[0] + domain[1]) / 2)}</span><span>{fmt(domain[1])}</span></div>}<p className="so-axis-label">{xLabel} → {equal && <span>· equal units on both axes</span>}</p></>}</div>;
}

export function Mark({ point, map, colour = ink.amber, shape = 'circle', selected = false, hollow = false, size = 5, hollowFill = 'none' }) {
  if (!map.inside(point)) return null;
  const x = map.x(point[0]), y = map.y(point[1]);
  const attributes = { fill: hollow ? hollowFill : colour, stroke: colour, strokeWidth: 2 };
  return <g>{shape === 'square' ? <rect x={x - size} y={y - size} width={2 * size} height={2 * size} {...attributes} /> : shape === 'triangle' ? <path d={`M${x},${y - size - 1}L${x + size + 1},${y + size}H${x - size - 1}Z`} {...attributes} /> : shape === 'diamond' ? <path d={`M${x},${y - size - 1}L${x + size + 1},${y}L${x},${y + size + 1}L${x - size - 1},${y}Z`} {...attributes} /> : shape === 'cross' ? <path d={`M${x - size},${y - size}L${x + size},${y + size}M${x + size},${y - size}L${x - size},${y + size}`} stroke={colour} strokeWidth="2" /> : <circle cx={x} cy={y} r={size} {...attributes} />}{selected && <circle cx={x} cy={y} r={size + 6} fill="none" stroke={ink.neutral} strokeWidth="2" />}</g>;
}

export function Line({ points, map, colour = ink.amber, dash, width = 2 }) {
  let open = false;
  const path = points.map(point => {
    if (!point || !map.inside(point)) { open = false; return ''; }
    const command = open ? 'L' : 'M'; open = true;
    return `${command}${map.x(point[0])},${map.y(point[1])}`;
  }).join(' ');
  return <path d={path} fill="none" stroke={colour} strokeWidth={width} strokeDasharray={dash} />;
}

export function Arrow({ start = [0, 0], end, map, colour = ink.amber, dash, shape = 'circle', endpoint = true, size = 5, hollow = false }) {
  const id = useId().replaceAll(':', '');
  if (!map.inside(start) || !map.inside(end)) return null;
  const same = Math.hypot(end[0] - start[0], end[1] - start[1]) < 1e-13;
  return <g><defs><marker id={id} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0,0L7,3.5L0,7Z" fill={colour} /></marker></defs>{!same && <path d={`M${map.x(start[0])},${map.y(start[1])}L${map.x(end[0])},${map.y(end[1])}`} stroke={colour} strokeWidth="2" strokeDasharray={dash} markerEnd={`url(#${id})`} />}{endpoint && <Mark point={end} map={map} colour={colour} shape={shape} hollow={same || hollow} size={size} />}</g>;
}

export function Curve({ fn, from, to, map, colour, dash, count = 161 }) {
  return <Line points={Array.from({ length: count }, (_, i) => { const v = from + (to - from) * i / (count - 1); return [v, fn(v)]; })} map={map} colour={colour} dash={dash} />;
}

export function CirclePath({ center = [0, 0], radii = [1, 1], angle = 0, map, colour = ink.muted, dash }) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const points = Array.from({ length: 241 }, (_, i) => { const t = 2 * Math.PI * i / 240, a = radii[0] * Math.cos(t), b = radii[1] * Math.sin(t); return [center[0] + c * a - s * b, center[1] + s * a + c * b]; });
  return <Line points={points} map={map} colour={colour} dash={dash} width={1.4} />;
}

export function VectorView({ label, vectors, domain = [-1.5, 1.5], xLabel, yLabel, scalar = false }) {
  return <div><Plane label={label} domain={domain} xLabel={xLabel} yLabel={yLabel} yDomain={scalar ? [-.3, .3] : undefined} equal={!scalar} compact={scalar}>{map => vectors.map((v, i) => <Arrow key={i} {...v} map={map} />)}</Plane><Key items={vectors.map(v => [`${v.label}: ${vec(v.end)}`, v.colour, v.shape === 'square' ? '■' : v.shape === 'triangle' ? '▲' : v.shape === 'diamond' ? '◆' : v.shape === 'cross' ? '×' : '●'])} /></div>;
}

export function Masses({ label, p }) {
  return <div className="so-masses"><p>{label}</p><div className="so-mass-axis" role="img" aria-label={`Success ${probability(p)}, failure ${probability(1 - p)}`}><span style={{ width: `${100 * p}%`, background: ink.amber }} /><span style={{ width: `${100 * (1 - p)}%`, background: ink.cyan }} /></div><Key items={[[`success y=1: ${probability(p)}`, ink.amber, '■'], [`failure y=0: ${probability(1 - p)}`, ink.cyan, '●']]} /></div>;
}
