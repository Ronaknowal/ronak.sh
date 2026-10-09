import { Children, useId } from 'react';
import { gridValues } from '../../data/bayesian-inference-flow-models.js';
import './bayesian-inference-reading-flow.css';

export const number = (value, digits = 6) => value === null ? 'not unique' : Math.abs(value) > 0 && Math.abs(value) < .0001 ? value.toExponential(3) : Number(value.toFixed(digits)).toString();
export function Figure({ id, children, caption, controls }) {
  return <figure className="bayes-flow-figure" data-bayes-view={id}>{children}{controls}<figcaption>{caption}</figcaption></figure>;
}
export function Compare({ children }) {
  return <div className="bf-compare">{Children.map(children, child => <div className="bf-panel">{child}</div>)}</div>;
}
export function Scene({ label, height = 290, children }) {
  return <div className="bf-scene-scroll" role="region" tabIndex="0" aria-label={`${label}. Use left and right arrow keys if the drawing is wider than the view.`}><svg className="bf-scene" viewBox={`0 0 360 ${height}`} role="img" aria-label={label}>{children}</svg></div>;
}
export function Label({ x, y, children, anchor = 'middle', tone = '' }) {
  return <text className={`bf-label ${tone}`} x={x} y={y} textAnchor={anchor}>{children}</text>;
}
export function Arrow({ a, b, tone = 'posterior', dashed = false }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
  if (length < 1e-9) return <circle cx={a[0]} cy={a[1]} r="4" className={`bf-point ${tone}`} />;
  const x = dx / length, y = dy / length, size = Math.min(7, length / 3);
  return <g className={`bf-arrow ${tone} ${dashed ? 'dashed' : ''}`}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><path d={`M${b[0] - size * x + size * .45 * y},${b[1] - size * y - size * .45 * x}L${b[0]},${b[1]}L${b[0] - size * x - size * .45 * y},${b[1] - size * y + size * .45 * x}`} /></g>;
}
export function Ledger({ rows }) {
  return <dl className="bf-ledger">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export function Table({ label, headers, rows, vertical = false }) {
  const id = useId();
  return <><p className="bf-table-title" id={id}>{label}</p><div className={`bf-table-scroll ${vertical ? 'bf-table-scroll--tall' : ''}`} role="region" tabIndex="0" aria-labelledby={id} aria-label={undefined}><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th scope="row" key={j}>{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></>;
}
export function Plot({ label, xRange = [0, 1], yRange, xLabel = 'θ (probability)', yLabel = 'density per unit θ', xDigits = 3, lines = [], regions = [], markers = [], children }) {
  const id = useId().replaceAll(':', '');
  const left = 62, right = 328, top = 30, bottom = 222;
  const X = x => left + (x - xRange[0]) * (right - left) / (xRange[1] - xRange[0]);
  const Y = y => bottom - (y - yRange[0]) * (bottom - top) / (yRange[1] - yRange[0]);
  const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)},${Y(y)}`).join(' ');
  return <><p className="bf-drawing-title">{label}</p><Scene label={`${label}; ${xLabel} ${xRange.join(' to ')}, ${yLabel} ${yRange.join(' to ')}`}><defs><clipPath id={id}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>{[yRange[0], (yRange[0] + yRange[1]) / 2, yRange[1]].map(y => <g key={y}><line x1={left} x2={right} y1={Y(y)} y2={Y(y)} className="bf-grid" /><Label x={left - 8} y={Y(y) + 5} anchor="end">{number(y, 3)}</Label></g>)}{[xRange[0], (xRange[0] + xRange[1]) / 2, xRange[1]].map((x, i) => <Label key={x} x={X(x)} y="246" anchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{number(x, xDigits)}</Label>)}<path className="bf-axis" d={`M${left},${top}V${bottom}H${right}`} />{yRange[0] < 0 && yRange[1] > 0 && <line className="bf-zero" x1={left} x2={right} y1={Y(0)} y2={Y(0)} />}<g clipPath={`url(#${id})`}>{regions.map((region, i) => {
    const points = region.points;
    return <path key={i} className={`bf-area ${region.tone ?? 'posterior'}`} d={`M${X(points[0][0])},${Y(0)}${path(points).replace(/^M/, 'L')}L${X(points.at(-1)[0])},${Y(0)}Z`} />;
  })}{lines.map((line, i) => <path key={i} className={`bf-curve ${line.tone ?? 'posterior'} ${line.dashed ? 'dashed' : ''}`} d={path(line.points)} />)}{markers.map((marker, i) => <g key={i}><line x1={X(marker.x)} x2={X(marker.x)} y1={top} y2={bottom} className={`bf-reference ${marker.tone ?? ''}`} /><circle cx={X(marker.x)} cy={Y(marker.y ?? 0)} r="4" className={`bf-point ${marker.tone ?? 'posterior'}`} /></g>)}{children?.({ X, Y, left, right, top, bottom })}</g></Scene><p className="bf-axis-caption">Horizontal: {xLabel}. Vertical: {yLabel}.</p></>;
}
export function ProbabilityBars({ label, rows, selected = () => false, series = [['mass', 'posterior']], xLabel = 'count', yMax }) {
  const peak = yMax ?? Math.max(.05, ...rows.flatMap(row => series.map(([key]) => row[key]))) * 1.12;
  const width = 266 / rows.length, X = i => 62 + width * (i + .5), Y = y => 222 - y / peak * 192;
  return <><p className="bf-drawing-title">{label}</p><Scene label={`${label}; ${xLabel}, probability mass from 0 to ${number(peak, 3)}`}><line className="bf-axis" x1="62" x2="328" y1="222" y2="222" /><line className="bf-axis" x1="62" x2="62" y1="30" y2="222" />{[0, peak / 2, peak].map(y => <g key={y}><line x1="62" x2="328" y1={Y(y)} y2={Y(y)} className="bf-grid" /><Label x="54" y={Y(y) + 5} anchor="end">{number(y, 3)}</Label></g>)}{rows.map((row, i) => <g key={i}>{series.map(([key, tone], j) => <rect key={key} className={`bf-bar ${tone} ${selected(row) ? 'selected' : ''}`} x={X(i) - width * .36 + j * width * .72 / series.length} y={Y(row[key])} width={width * .72 / series.length} height={222 - Y(row[key])} />)}{rows.length <= 12 || i % 5 === 0 || i === rows.length - 1 ? <Label x={X(i)} y="246">{row.k ?? row.runs ?? row.n ?? i}</Label> : null}</g>)}<Label x="195" y="279">{xLabel}</Label></Scene><p className="bf-axis-caption">Vertical height is probability mass. {series.length === 2 ? 'Amber: integrated prediction; cyan: plug-in prediction.' : 'An outlined bar belongs to the stated event.'}</p></>;
}
export function TokenRows({ successes, failures, label = 'Observed visitors' }) {
  const n = successes + failures, columns = 10, rows = Math.max(1, Math.ceil(n / columns));
  return <><p className="bf-drawing-title">{label}: {successes} S, {failures} F</p><Scene label={`${label}; each numbered mark is one separate observation`} height={rows * 45 + 25}>{Array.from({ length: n }, (_, i) => {
    const x = 25 + (i % columns) * 34, y = 20 + Math.floor(i / columns) * 45, success = i < successes;
    return <g key={i}>{success ? <circle className="bf-outcome success" cx={x} cy={y} r="12" /> : <path className="bf-outcome failure" d={`M${x},${y - 13}L${x + 13},${y + 11}H${x - 13}Z`} />}<Label x={x} y={y + 5}>{success ? 'S' : 'F'}</Label><Label x={x} y={y + 32}>{i + 1}</Label></g>;
  })}{n === 0 && <Label x="180" y="36">No observations; retain the prior.</Label>}</Scene></>;
}
export function Word({ values, label, compact = false, event = false }) {
  const runs = [];
  let start = 0;
  for (let i = 1; i <= values.length; i += 1) if (i === values.length || values[i] !== values[i - 1]) { runs.push([start, i - 1]); start = i; }
  const width = compact ? 220 : 360, step = compact ? 20 : 32, left = compact ? 10 : 20;
  const drawing = <svg className={`bf-word ${event ? 'event' : ''}`} viewBox={`0 0 ${width} ${compact ? 40 : 85}`} role="img" aria-label={`${label}: ${values.map(x => x ? 'S' : 'F').join('')}; ${runs.length} runs`}>{values.map((value, i) => <g key={i}><rect x={left + i * step} y="4" width={step - 3} height="22" className={`bf-outcome ${value ? 'success' : 'failure'}`} /><text className="bf-word-label" x={left + i * step + (step - 3) / 2} y="20" textAnchor="middle">{value ? 'S' : 'F'}</text></g>)}{runs.map(([a, b], i) => <path key={i} d={`M${left + a * step},30V34H${left + (b + 1) * step - 3}V30`} className="bf-run-bracket" />)}{!compact && <Label x="180" y="69">{runs.length} maximal runs</Label>}</svg>;
  return <div className="bf-word-row"><span>{label}</span>{drawing}</div>;
}
export function Simplex({ state, direction = false, label = 'Three-category probability simplex' }) {
  const vertices = [[45, 230], [315, 230], [180, 35]];
  const point = weights => [weights.reduce((s, w, i) => s + w * vertices[i][0], 0), weights.reduce((s, w, i) => s + w * vertices[i][1], 0)];
  const mean = point(state.means), prior = point([1 / 3, 1 / 3, 1 / 3]);
  return <><Scene label={label} height={310}><path className="bf-simplex" d="M45,230L315,230L180,35Z" />{[0, 1, 2].map(i => {
    const others = [0, 1, 2].filter(j => i !== j);
    const endpoints = others.map(j => point([0, 1, 2].map(k => k === i ? state.means[i] : k === j ? 1 - state.means[i] : 0)));
    return <g key={i}><line className={`bf-reference category-${i}`} x1={endpoints[0][0]} y1={endpoints[0][1]} x2={endpoints[1][0]} y2={endpoints[1][1]} /><Label x={vertices[i][0]} y={i === 2 ? 23 : 260}>{['A', 'B', 'C'][i]}</Label></g>;
  })}<circle className="bf-point prior" cx={prior[0]} cy={prior[1]} r="5" /><circle className="bf-point posterior" cx={mean[0]} cy={mean[1]} r="6" />{direction && <Arrow a={mean} b={point([state.means[0] + .1, state.means[1] - .1, state.means[2]])} tone="category-0" />}<Label x="180" y="292">All coordinates sum to one</Label></Scene><Ledger rows={state.means.map((m, i) => [`${['A', 'B', 'C'][i]} posterior mean`, number(m)])} /></>;
}
export function Choice({ label, value, onChange, options }) {
  return <label className="bf-control"><span>{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(([id, text]) => <option key={id} value={String(id).startsWith('.') ? `0${id}` : id}>{text}</option>)}</select></label>;
}
export function CountInput({ label, value, onChange, max }) {
  return <label className="bf-control"><span>{label}</span><input aria-label={label} type="number" min="0" max={max} step="1" value={value} onChange={e => onChange(e.target.value)} /></label>;
}
export function Range({ label, value, onChange, min, max, step }) {
  return <label className="bf-control"><span>{label}: <output>{number(value)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
export function Controls({ children, onReset }) {
  return <div className="bf-controls">{children}<button type="button" onClick={onReset}>Reset</button></div>;
}
export const filledCurve = (fn, low, high, tone = 'posterior') => ({ points: gridValues(fn, low, high, 160), tone });
