import { useEffect, useId, useState } from 'react';
import { cases, finite } from "../../../data/knn-reading-flow-model.js";
import { useReadingState } from "./Examples.jsx";
export const num = (v, d = 6) => {
  if (v === null || v === undefined) return 'unavailable';
  // A display precision must never turn a supported nonzero input into zero.
  const rounded = Number(v.toFixed(d));
  const text = v !== 0 && rounded === 0 ? v.toExponential(d).replace(/(\.\d*?[1-9])0+(?=e)|\.0+(?=e)/, '$1') : rounded.toString();
  return text.replaceAll('-', '−');
};
export function Figure({
  id,
  label,
  caption,
  children
}) {
  return <figure className="knf-figure" data-knn-drawing={id} aria-label={label}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Table({
  headers,
  rows,
  caption
}) {
  return <div className="knf-scroll" tabIndex={0} role="region" aria-label={caption + '; horizontally scrollable'}><table><caption>{caption}</caption><thead><tr>{headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
}
export function Numeric({
  label,
  value,
  onChange,
  min,
  max,
  step = .1,
  integer = false,
  resetKey = 0,
  bounds = null
}) {
  const id = useId(),
    [draft, setDraft] = useState(String(value)),
    [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value, resetKey]);
  function update(raw) {
    setDraft(raw);
    const v = raw.trim() === '' ? NaN : Number(raw);
    const valid = finite(v, min, max, integer);
    setInvalid(!valid);
    if (valid) onChange(v);
  }
  // Navigation clamps only at the stated endpoints; direct drafts never clamp.
  const navigate = delta => {
    const next = Math.max(min, Math.min(max, value + delta));
    setDraft(String(next));
    setInvalid(false);
    onChange(next);
  };
  return <div className="knf-number"><label htmlFor={id}>{label} ({bounds ?? min + "…" + max}{integer ? ", integer" : ""})</label><span className="knf-number-row"><button type="button" aria-label={'Decrease ' + label} onClick={() => navigate(-step)}>−</button><input id={id} type="number" step="any" value={draft} aria-invalid={invalid} aria-describedby={id + '-status'} onChange={e => update(e.target.value)} /><button type="button" aria-label={'Increase ' + label} onClick={() => navigate(step)}>+</button></span><span id={id + '-status'} className={invalid ? 'knf-error' : 'knf-valid'}>{invalid ? 'Invalid draft; retaining ' + num(value, 12) : 'Current: ' + num(value, 12)}</span></div>;
}
export function Choices({
  label,
  value,
  onChange,
  options
}) {
  return <div className="knf-choice" role="group" aria-label={label}><span>{label}</span><div>{options.map(([v, text]) => <button type="button" key={v} aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}</div></div>;
}
export function QueryControls({
  state,
  extra = null
}) {
  return <div className="knf-controls"><Numeric label="Query x₁" value={state.query[0]} min={0} max={6} onChange={v => state.setQuery([v, state.query[1]])} resetKey={state.resetKey} /><Numeric label="Query x₂" value={state.query[1]} min={0} max={6} onChange={v => state.setQuery([state.query[0], v])} resetKey={state.resetKey} />{extra}<button type="button" onClick={state.reset}>Reset connected query</button></div>;
}
export function Scene({
  label,
  width = 420,
  height = 420,
  children
}) {
  return <div className="knf-scroll knf-scene" tabIndex={0} role="region" aria-label={label + '; horizontally scrollable'}><svg width={width} height={height} style={{
      width: width / 16 + 'rem',
      height: 'auto'
    }} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><title>{label}</title>{children}</svg></div>;
}
export function Mark({
  row,
  x,
  y,
  dim = false
}) {
  const [dx, dy] = {
    A1: [-12, 5],
    A2: [12, 24],
    A3: [-12, -13],
    B1: [13, -10],
    B2: [10, 22],
    B3: [-12, -13],
    C1: [-15, -15],
    C2: [15, 23]
  }[row.id] || [10, -12];
  return <g opacity={dim ? .3 : 1} className={'knf-class-' + row.label}>{row.label === 'A' ? <circle cx={x} cy={y} r={6} /> : row.label === 'B' ? <rect x={x - 6} y={y - 6} width={12} height={12} /> : <path d={`M${x},${y - 7}l7,13h-14Z`} />}<text x={x + dx} y={y + dy} textAnchor={dx < 0 ? 'end' : 'start'}>{row.id}</text></g>;
}
export function Map({
  query = [3.1, 2.9],
  selected = cases,
  radius = null,
  metric = 'euclidean',
  children = null,
  label = 'Stored cases and query',
  split = null
}) {
  const clip = useId(),
    x = v => 60 + v * 50,
    y = v => 355 - v * 50;
  return <Scene label={label}>
 <defs><clipPath id={clip}><rect x={60} y={55} width={300} height={300} /></clipPath></defs>
 {[0, 1, 2, 3, 4, 5, 6].map(v => <g key={v}><line className="knf-grid" x1={x(v)} x2={x(v)} y1={55} y2={355} /><line className="knf-grid" x1={60} x2={360} y1={y(v)} y2={y(v)} /><text x={x(v)} y={378} textAnchor="middle">{v}</text><text x={49} y={y(v) + 5} textAnchor="end">{v}</text></g>)}
 <g clipPath={`url(#${clip})`}>{radius !== null && (metric === 'euclidean' ? <circle className="knf-contour" cx={x(query[0])} cy={y(query[1])} r={50 * radius} /> : <polygon className="knf-contour" points={(metric === 'manhattan' ? [[radius, 0], [0, radius], [-radius, 0], [0, -radius]] : [[radius, radius], [-radius, radius], [-radius, -radius], [radius, -radius]]).map(([dx, dy]) => `${x(query[0] + dx)},${y(query[1] + dy)}`).join(' ')} />)}
 {split && (split.axis === 0 ? <line className="knf-split" x1={x(split.split)} x2={x(split.split)} y1={55} y2={355} /> : <line className="knf-split" x1={60} x2={360} y1={y(split.split)} y2={y(split.split)} />)}
 {children?.({
        x,
        y
      })}</g>
 {cases.map(row => <Mark key={row.id} row={row} x={x(row.point[0])} y={y(row.point[1])} dim={!selected.some(r => r.id === row.id)} />)}
 <path className="knf-query" d={`M${x(query[0]) - 7},${y(query[1]) - 7}l14,14m-14,0l14,-14`} />
 <text x={210} y={406} textAnchor="middle">Feature x₁ · equal axis units</text><text x={18} y={205} textAnchor="middle" transform="rotate(-90 18 205)">Feature x₂</text>
 </Scene>;
}
export function Legend() {
  return <p className="knf-legend">● A · ■ B · ▲ C · × query; faded marks are excluded.</p>;
}
export function Steps({
  items
}) {
  return <ol className="knf-steps">{items.map((item, i) => <li key={i}><span className="knf-step-index">{i + 1}</span><div>{item}</div>{i < items.length - 1 && <span className="knf-operation-arrow" aria-hidden="true">↓</span>}</li>)}</ol>;
}
export function Bars({
  rows,
  max = 1,
  label = 'Shares'
}) {
  return <div className="knf-bars" aria-label={label}>{rows.map(([name, value]) => <div key={name}><span>{name}</span><div className="knf-bar-track"><span style={{
          width: Math.max(0, Math.min(100, value / max * 100)) + '%'
        }} /></div><output>{num(value)}</output></div>)}</div>;
}
export function Matrix({
  rows,
  label
}) {
  return <div className="knf-matrix-wrap"><span>{label}</span><div className="knf-scroll" tabIndex={0} role="region" aria-label={label + '; horizontally scrollable'}><div className="knf-matrix">{rows.map((row, i) => <div key={i}>{row.map((v, j) => <span key={j}>{typeof v === 'number' ? num(v) : v}</span>)}</div>)}</div></div></div>;
}
export { useReadingState };
