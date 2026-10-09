import React, { useId } from 'react';
import { flowNumber } from '../../../../../src/learn/components/lesson-labs/LessonFlow.jsx';
export const hues = ['#f2b85b', '#72b9eb', '#e99ac7', '#b6a3ed', '#e58d79', '#90c9c1', '#d8d1b9', '#c5a578', '#959dcf', '#c1a8b8'];
export const number = (value, digits = 6) => Number.isFinite(value) ? flowNumber(value, digits) : value === Infinity ? '∞' : 'undefined';
export function Drawing({ children, caption, className = '' }) {
  return <figure className={`manifold-drawing ${className}`}><div className="manifold-scenes">{children}</div><figcaption>{caption}</figcaption></figure>;
}
export function Table({ caption, headers, rows }) {
  return <div className="manifold-table" role="region" tabIndex={0} aria-label={`${caption}. Scroll horizontally if needed.`}><table><caption>{caption}</caption><thead><tr>{headers.map((v, i) => <th key={i} scope="col">{v}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => j ? <td key={j}>{v}</td> : <th key={j} scope="row">{v}</th>)}</tr>)}</tbody></table></div>;
}
export function Matrix({ values, labels, columnLabels, caption, digits = 6 }) {
  const names = labels || values.map((_, i) => String(i));
  return <Table caption={caption} headers={['row / column', ...(columnLabels || names)]} rows={values.map((row, i) => [names[i], ...row.map(v => number(v, digits))])} />;
}
export function Plot({ points, edges = [], path = [], caption, domain, arrows = [], circle, children }) {
  const marker = useId().replaceAll(':', '');
  const all = [...points, ...arrows.flatMap(a => [{ x: a[0], y: a[1] }, { x: a[2], y: a[3] }])];
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  let bounds = domain || [Math.min(...xs) - .5, Math.max(...xs) + .5, Math.min(...ys) - .5, Math.max(...ys) + .5];
  const span = Math.max(bounds[1] - bounds[0], bounds[3] - bounds[2], 1), cx = (bounds[0] + bounds[1]) / 2, cy = (bounds[2] + bounds[3]) / 2;
  const scale = 220 / span, x = v => 180 + (v - cx) * scale, y = v => 135 - (v - cy) * scale;
  return <div className="manifold-scene"><svg viewBox="0 0 360 290" role="img" aria-label={caption}>
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
    <line x1="45" x2="315" y1="258" y2="258" className="manifold-axis" />
    {[cx - span / 2, cx, cx + span / 2].map((v, i) => <g key={i}><line x1={x(v)} x2={x(v)} y1="253" y2="263" className="manifold-axis" /><text x={x(v)} y="282" textAnchor="middle">{number(v, 2)}</text></g>)}
    {circle && <circle cx={x(circle[0])} cy={y(circle[1])} r={circle[2] * scale} fill="none" stroke="#838a94" strokeDasharray="4 4" />}
    {edges.map(([a, b, , kind], i) => <line key={i} x1={x(points[a].x)} y1={y(points[a].y)} x2={x(points[b].x)} y2={y(points[b].y)} stroke={kind === 'missing' ? hues[2] : kind === 'new' ? hues[1] : '#838a94'} strokeWidth="1.5" strokeDasharray={kind === 'missing' ? '5 3' : undefined} />)}
    {path.slice(1).map((b, i) => <line key={i} x1={x(points[path[i]].x)} y1={y(points[path[i]].y)} x2={x(points[b].x)} y2={y(points[b].y)} stroke={hues[0]} strokeWidth="4" />)}
    {arrows.map(([a, b, c, d, color = hues[0]], i) => <line key={i} x1={x(a)} y1={y(b)} x2={x(c)} y2={y(d)} stroke={color} color={color} strokeWidth="2" markerEnd={`url(#${marker})`} />)}
    {points.map((p, i) => <g key={p.id ?? i}><circle cx={x(p.x)} cy={y(p.y)} r={p.selected ? 7 : 4} fill={p.color || hues[i % hues.length]} stroke={p.selected ? '#fff3d4' : 'none'} strokeWidth="2" />{p.label !== false && <text x={x(p.x) + (p.dx || 9)} y={y(p.y) + (p.dy || -9)} fill={p.color || hues[i % hues.length]}>{p.id ?? i}</text>}</g>)}
    {children?.({ x, y, scale })}
  </svg><p className="manifold-axis-label">{caption} · horizontal ruler in coordinate units; equal axis scales</p></div>;
}
export function Line({ values, labels, caption, compared, bound }) {
  const extents = [...values, ...(compared || [])], min = bound ? -bound : Math.min(...extents) - .5, max = bound ? bound : Math.max(...extents) + .5;
  const x = value => 35 + (value - min) / (max - min) * 290;
  const coincident = values.some((v, i) => values.indexOf(v) !== i);
  return <div className="manifold-scene"><svg viewBox="0 0 360 150" role="img" aria-label={caption}>
    <line x1="35" x2="325" y1="72" y2="72" className="manifold-axis" />
    {[min, (min + max) / 2, max].map((v, i) => <g key={i}><line x1={x(v)} x2={x(v)} y1="65" y2="80" className="manifold-axis" /><text x={x(v)} y="140" textAnchor="middle">{number(v, 2)}</text></g>)}
    {compared?.map((v, i) => <g key={i}><circle cx={x(v)} cy="38" r="4" fill="none" stroke={hues[i % 7]} /><line x1={x(v)} y1="38" x2={x(values[i])} y2="72" stroke={hues[i % 7]} strokeDasharray="3 3" /></g>)}
    {values.map((v, i) => <circle key={i} cx={x(v)} cy="72" r="5" fill={hues[i % 7]} />)}
    {!coincident && values.map((v, i) => <text key={i} x={x(v)} y={i % 2 ? 112 : 22} textAnchor="middle" fill={hues[i % 7]}>{labels?.[i] || String(i)}</text>)}
  </svg><p>{caption}{coincident ? ' · coincident marks retain the distinct IDs listed below.' : ''}</p><ul className="manifold-key">{values.map((v, i) => <li key={i} style={{ color: hues[i % 7] }}>{labels?.[i] || i}: {number(v)}{compared ? ` (old ${number(compared[i])})` : ''}</li>)}</ul></div>;
}
export function Bars({ values, labels, caption, max = 1, suffix = '' }) {
  return <div className="manifold-bars"><p>{caption} · common scale 0–{number(max)}{suffix}</p>{values.map((v, i) => <div key={i} className="manifold-bar-row"><span>{labels?.[i] || i}: {number(v)}{suffix}</span><div className="manifold-bar-axis"><span style={{ width: `${100 * v / max}%`, background: hues[i % 7] }} /></div></div>)}</div>;
}
export function Curve({ curves, caption, xmin = 0, xmax = 4, ymax = 1, marks = [] }) {
  const x = v => 35 + (v - xmin) / (xmax - xmin) * 285, y = v => 215 - v / ymax * 180;
  return <div className="manifold-scene"><svg viewBox="0 0 360 265" role="img" aria-label={caption}><path d="M35 25 V215 H330" className="manifold-axis" fill="none" />
    {[0, ymax / 2, ymax].map((v, i) => <text key={i} x="28" y={y(v) + 4} textAnchor="end">{number(v, 2)}</text>)}
    {[xmin, (xmin + xmax) / 2, xmax].map((v, i) => <text key={i} x={x(v)} y="245" textAnchor="middle">{number(v, 2)}</text>)}
    {curves.map((curve, i) => <path key={i} d={Array.from({ length: 121 }, (_, j) => { const v = xmin + j / 120 * (xmax - xmin); return `${j ? 'L' : 'M'}${x(v)} ${y(Math.min(ymax, curve.fn(v)))}`; }).join(' ')} stroke={curve.color || hues[i]} strokeWidth="2.5" fill="none" />)}
    {marks.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r="5" fill={hues[0]} />)}
  </svg><p>{caption}</p><ul className="manifold-key">{curves.map((curve, i) => <li key={i} style={{ color: curve.color || hues[i] }}>{curve.label}</li>)}</ul></div>;
}
export function Digit({ row, title }) {
  return <figure className="manifold-digit"><svg viewBox="0 0 80 80" role="img" aria-label={`${title || `Source ${row[0]}`}: 8 by 8 block counts`}>
    {row.slice(2).map((v, i) => <rect key={i} x={i % 8 * 10} y={Math.floor(i / 8) * 10} width="10" height="10" fill={`rgb(${Math.round(v / 16 * 235)},${Math.round(v / 16 * 235)},${Math.round(v / 16 * 235)})`} stroke="#282828" strokeWidth=".25" />)}
  </svg><figcaption>{title || `ID ${row[0]}`}<br />label {row[1]}</figcaption></figure>;
}
