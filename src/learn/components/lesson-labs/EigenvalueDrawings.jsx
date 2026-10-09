import { useId } from 'react';
import './eigenvalue-flow.css';

export const eigenColors = { neutral: '#ded5bf', active: '#edc267', compare: '#97bfca' };
export const eigenFormat = (value, digits = 6) => typeof value === 'string' ? value : value === null || value === undefined ? 'undefined' : value !== 0 && Math.abs(value) < 1e-5 ? value.toExponential(2).replaceAll('-', '−') : String(Number(value.toFixed(digits))).replaceAll('-', '−');
export const eigenPair = vector => `[${vector.map(value => eigenFormat(value)).join(', ')}]`;

export function EigenDrawing({ label, height = 320, children }) {
  const id = useId();
  return <svg className="ev-drawing" viewBox={`0 0 360 ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>;
}

export function EigenTable({ caption, headers, rows }) {
  return <div className="ev-table"><p>{caption}</p><div className="ev-table-scroll" tabIndex={0} role="region" aria-label={caption}><table><caption className="ev-semantic-caption">{caption}</caption><thead><tr>{headers.map((label, i) => <th key={i} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th key={j} scope="row">{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></div>;
}

export function EigenMatrix({ values, label = 'Matrix', highlight = [] }) {
  return <div className="ev-matrix"><p>{label}</p><div className="ev-table-scroll" tabIndex={0} role="region" aria-label={label}><table><caption className="ev-semantic-caption">{label}; row and column order as displayed</caption><tbody>{values.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j} className={highlight.some(([r, c]) => r === i && c === j) ? 'ev-cell-active' : undefined}>{eigenFormat(value)}</td>)}</tr>)}</tbody></table></div></div>;
}

export function EigenFigure({ children, caption }) {
  return <figure className="ev-figure">{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}

export function EigenArrow({ x1, y1, x2, y2, kind = 'primary' }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < .02) return <circle cx={x2} cy={y2} r="5" className={`ev-${kind}`} fill="#101010" />;
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length, size = Math.min(8, length * .3);
  return <g className={`ev-${kind}`}><path d={`M${x1} ${y1}L${x2} ${y2}`} /><path d={`M${x2 - size * ux + size * .45 * uy} ${y2 - size * uy - size * .45 * ux}L${x2} ${y2}L${x2 - size * ux - size * .45 * uy} ${y2 - size * uy + size * .45 * ux}`} /></g>;
}

// One scale on both axes. Endpoint leaders use separate fixed text slots, so
// coincident, reversed and aligned arrows do not overwrite one another's names.
export function EigenPlane({ label, range = 4, vectors = [], points = [], segments = [], trail = [], line, children, axisLabels = ['x', 'y'], unit = 'Equal units' }) {
  const X = x => 180 + 120 * x / range, Y = y => 190 - 120 * y / range;
  return <EigenDrawing label={`${label}. Equal coordinate scales, both axes −${range} to ${range}.`} height={345}>
    <path className="ev-axis" d="M50 190H310M180 60V320" /><text x="320" y="195">{axisLabels[0]}</text><text x="184" y="52">{axisLabels[1]}</text>
    {[-range, range].map(v => <g key={v}><text x={X(v)} y="211" textAnchor="middle">{eigenFormat(v)}</text><text x="171" y={Y(v) + 5} textAnchor="end">{eigenFormat(v)}</text></g>)}<text x="166" y="207">0</text>
    {line && <path className="ev-construction" d={`M${X(-range * line[0])} ${Y(-range * line[1])}L${X(range * line[0])} ${Y(range * line[1])}`} />}
    {trail.length > 1 && <polyline className="ev-comparison" points={trail.map(v => `${X(v[0])},${Y(v[1])}`).join(' ')} />}
    {segments.map(([a, b], i) => <path key={i} className="ev-construction" d={`M${X(a[0])} ${Y(a[1])}L${X(b[0])} ${Y(b[1])}`} />)}
    {points.map((p, i) => <g key={i}><circle cx={X(p.value[0])} cy={Y(p.value[1])} r={p.radius ?? 4} fill={p.ring ? '#101010' : eigenColors.neutral} stroke={p.ring ? eigenColors.compare : eigenColors.neutral} />{p.label && <text x={X(p.value[0]) + (p.dx ?? 8)} y={Y(p.value[1]) + (p.dy ?? -8)}>{p.label}</text>}</g>)}
    {vectors.map((v, i) => <g key={i}><EigenArrow x1={X(v.from?.[0] ?? 0)} y1={Y(v.from?.[1] ?? 0)} x2={X(v.value[0])} y2={Y(v.value[1])} kind={v.kind ?? 'primary'} />{v.label && <><path className="ev-leader" d={`M${X(v.value[0])} ${Y(v.value[1])}L${250 - i * 55} ${30 + i * 18}H${30 + i * 12}`} /><text x={15 + i * 12} y={24 + i * 18}>{v.label}</text></>}</g>)}
    {typeof children === 'function' ? children({ X, Y }) : children}<text x="180" y="340" textAnchor="middle">{unit} · range ±{eigenFormat(range)}</text>
  </EigenDrawing>;
}

export function EigenStems({ label, values, labels, min = 0, max = Math.max(1, ...values), unit = 'value', compare }) {
  const X = i => 90 + i * 220 / Math.max(1, values.length - 1), Y = v => 195 - 140 * (v - min) / (max - min);
  return <EigenDrawing label={`${label}; ${unit} ordinate from ${min} to ${max}.`} height={275}>
    <path className="ev-axis" d="M55 55V195H325" /><text x="55" y="25">{unit}</text><text x="45" y="59" textAnchor="end">{eigenFormat(max)}</text><text x="45" y="199" textAnchor="end">{eigenFormat(min)}</text>
    {values.map((v, i) => <g key={i}><path className="ev-primary" d={`M${X(i)} ${Y(Math.max(min, 0))}V${Y(v)}`} /><circle cx={X(i)} cy={Y(v)} r="4" fill={eigenColors.active} /><text x={X(i)} y={Y(v) - 9} textAnchor="middle">{eigenFormat(v)}</text><text x={X(i)} y="222" textAnchor="middle">{labels?.[i] ?? i}</text>{compare && <circle cx={X(i)} cy={Y(compare[i])} r="4" fill="none" stroke={eigenColors.compare} strokeDasharray="2 2" />}</g>)}
    <text x="190" y="262" textAnchor="middle">{label}</text>
  </EigenDrawing>;
}

export function EigenHistory({ label, values, selected, unit, min = 0, max = Math.max(1e-12, ...values) }) {
  const X = i => 90 + i * 235 / Math.max(1, values.length - 1), Y = v => 195 - 140 * (v - min) / (max - min);
  return <EigenDrawing label={`${label}; integer steps, ${unit} from ${min} to ${max}.`} height={275}>
    <path className="ev-axis" d="M90 55V195H325" /><text x="90" y="25">{unit}</text><text x="80" y="59" textAnchor="end">{eigenFormat(max)}</text><text x="80" y="199" textAnchor="end">{eigenFormat(min)}</text>
    <polyline className="ev-comparison" points={values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
    {values.map((v, i) => <g key={i}><circle cx={X(i)} cy={Y(v)} r={i === selected ? 5 : 2.8} fill={i === selected ? eigenColors.active : eigenColors.neutral} />{(i % 3 === 0 || i === values.length - 1) && <text x={X(i)} y="222" textAnchor="middle">{i}</text>}</g>)}
    <text x="190" y="260" textAnchor="middle">integer update / rotation</text>
  </EigenDrawing>;
}
