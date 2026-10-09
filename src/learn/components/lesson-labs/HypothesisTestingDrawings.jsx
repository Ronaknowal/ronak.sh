import { useId } from 'react';
import { inferenceNumber as num } from '../../data/hypothesis-testing-models.js';
import './hypothesis-testing-flow.css';
export const INK = '#ded5bf',
  SELECT = '#edc267',
  COMPARE = '#97bfca',
  MUTED = '#918b80';
export const scale = (low, high, left = 50, right = 390) => value => left + (value - low) / (high - low) * (right - left);
export const linePath = (points, x, y) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join(' ');
export const curve = (fn, low, high, x, y, samples = 220) => linePath(Array.from({
  length: samples + 1
}, (_, i) => {
  const t = low + (high - low) * i / samples;
  return [t, fn(t)];
}), x, y);
export const area = (fn, low, high, x, y, base) => high > low ? `M${x(low)},${base} ${curve(fn, low, high, x, y).replace(/^M/, 'L')} L${x(high)},${base} Z` : '';
export function Drawing({
  title,
  width = 440,
  height = 260,
  children
}) {
  const id = useId();
  return <div className="hf-svg-scroll" role="region" aria-label={`${title}; drawing scroll region`} tabIndex={0}><svg viewBox={`0 0 ${width} ${height}`} style={{
      '--hf-drawing-width': `${width}px`
    }} role="img" aria-labelledby={id}><title id={id}>{title}</title>{children}</svg></div>;
}
export function Block({
  id,
  title,
  caption,
  children,
  lab = false
}) {
  const Tag = lab ? 'section' : 'figure';
  return <Tag className={lab ? 'hf-lab' : 'hf-figure'} data-lab={lab ? id : undefined} data-figure={lab ? undefined : id} aria-label={title}><h3>{title}</h3>{children}<p className="hf-caption">{caption}</p></Tag>;
}
export function Table({
  title,
  headers,
  rows,
  maxHeight
}) {
  return <div className="hf-table"><p className="hf-table-title">{title}</p><div className="hf-table-scroll" role="region" aria-label={`${title}; numerical table scroll region`} tabIndex={0} style={maxHeight ? {
      maxHeight
    } : undefined}><table><caption className="hf-sr-only">{title}</caption><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Axis({
  x,
  ticks,
  y = 200,
  label,
  low = 50,
  high = 390
}) {
  return <g className="hf-axis"><path d={`M${low},${y}H${high}`} />{ticks.map(v => <g key={v}><path d={`M${x(v)},${y}v6`} /><text x={x(v)} y={y + 25} textAnchor="middle">{num(v, 2)}</text></g>)}{label && <text x={(low + high) / 2} y={y + 52} textAnchor="middle">{label}</text>}</g>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = INK,
  dashed = false
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1),
    length = 7,
    a = angle + .5,
    b = angle - .5;
  return <g stroke={color} fill="none" strokeWidth="1.6" strokeDasharray={dashed ? '5 4' : undefined}><path d={`M${x1},${y1}L${x2},${y2}`} /><path d={`M${x2 - length * Math.cos(a)},${y2 - length * Math.sin(a)}L${x2},${y2}L${x2 - length * Math.cos(b)},${y2 - length * Math.sin(b)}`} /></g>;
}
export function Interval({
  x,
  low,
  high,
  mean,
  y,
  color = INK,
  dashed = false,
  domain = [-Infinity, Infinity]
}) {
  const a = Math.max(low, domain[0]),
    b = Math.min(high, domain[1]);
  return <g stroke={color} fill={color} strokeWidth="2" strokeDasharray={dashed ? '5 4' : undefined}><path d={`M${x(a)},${y}H${x(b)}`} />{Number.isFinite(low) && low >= domain[0] && <path d={`M${x(low)},${y - 6}v12`} />}{Number.isFinite(high) && high <= domain[1] && <path d={`M${x(high)},${y - 6}v12`} />}{mean !== undefined && <circle cx={x(mean)} cy={y} r="4" />}{low < domain[0] && <Arrow x1={x(a) + 10} y1={y} x2={x(a)} y2={y} color={color} />}{high > domain[1] && <Arrow x1={x(b) - 10} y1={y} x2={x(b)} y2={y} color={color} />}</g>;
}
export function Density({
  fn,
  domain = [-5, 5],
  max = .45,
  ticks = [-4, -2, 0, 2, 4],
  label = 'Standardized coordinate',
  regions = [],
  reference,
  comparison
}) {
  const x = scale(...domain),
    y = v => 190 - v / max * 140;
  return <Drawing title={`Probability density against ${label}`} height={260}>{regions.map(([a, b, color], i) => <path key={i} d={area(fn, Math.max(a, domain[0]), Math.min(b, domain[1]), x, y, 190)} fill={color ?? SELECT} opacity=".3" />)}{comparison && <path d={curve(comparison, ...domain, x, y)} stroke={COMPARE} strokeDasharray="5 4" fill="none" strokeWidth="2" />}<path d={curve(fn, ...domain, x, y)} stroke={INK} fill="none" strokeWidth="2" /><path d="M50,190V45" stroke={MUTED} /><text x="54" y="29">Density</text><text x="44" y="55" textAnchor="end">{num(max, 2)}</text>{reference !== undefined && <g><path d={`M${x(Math.max(domain[0], Math.min(domain[1], reference)))},190V45`} stroke={SELECT} strokeDasharray="3 3" />{(reference < domain[0] || reference > domain[1]) && <Arrow x1={x(reference < domain[0] ? domain[0] + .4 : domain[1] - .4)} y1={55} x2={x(reference < domain[0] ? domain[0] : domain[1])} y2={55} color={SELECT} />}</g>}<Axis x={x} ticks={ticks} y={190} label={label} /></Drawing>;
}
export function Mass({
  rows,
  keyName = 'value',
  massName = 'mass',
  title,
  domain,
  ticks,
  highlight = row => row.extreme
}) {
  const values = rows.map(row => row[keyName]);
  const bounds = domain ?? [Math.min(...values) - .5, Math.max(...values) + .5];
  const x = scale(...bounds),
    max = Math.max(...rows.map(row => row[massName])) || 1;
  const width = Math.min(20, 300 / Math.max(1, rows.length));
  return <Drawing title={title} height={260}><path d="M50,190V45" stroke={MUTED} /><text x="54" y="27">Probability mass</text><text x="46" y="55" textAnchor="end">{num(max, 3)}</text>{rows.map((row, i) => <g key={i}><rect x={x(row[keyName]) - width / 2} y={190 - row[massName] / max * 140} width={width} height={row[massName] / max * 140} fill={highlight(row) ? SELECT : INK} />{row[massName] === 0 && <circle cx={x(row[keyName])} cy="190" r="2.5" fill="none" stroke={INK} />}</g>)}<Axis x={x} ticks={ticks ?? values.filter((_, i) => i % Math.max(1, Math.floor(values.length / 6)) === 0)} y={190} label={title} /></Drawing>;
}
