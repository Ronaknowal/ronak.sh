import { useEffect, useId, useRef, useState } from 'react';
import { FlowControls, FlowReadout } from './LessonFlow.jsx';
import { numericDraft } from '../../data/svm-reading-flow-models.js';
import { MathBlock as SharedMathBlock, Math as SharedInlineMath } from '../content/Math.jsx';

export const colors = { negative: '#ee9aa8', positive: '#89baff', query: '#e8b76c', first: '#7ed6df', second: '#c5a2ef', computed: '#d2c0f0', neutral: '#b8bec8' };
export function number(value, digits = 5) {
  if (value === null || value === undefined) return 'undefined';
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e7)) return value.toExponential(3).replaceAll('-', '−');
  return Number(value.toFixed(digits)).toString().replaceAll('-', '−');
}
export const vectorText = row => `[${row.map(v => number(v)).join(', ')}]`;
function PanRegion({ className, label, children }) {
  const ref = useRef(null), [overflow, setOverflow] = useState(false);
  useEffect(() => { const el = ref.current, measure = () => setOverflow(el.scrollWidth > el.clientWidth + 1); measure(); const observer = new ResizeObserver(measure); observer.observe(el); for (const child of el.children) observer.observe(child); return () => observer.disconnect(); }, []);
  useEffect(() => { const el = ref.current; setOverflow(el.scrollWidth > el.clientWidth + 1); });
  return <>{overflow && <p className="svm-flow-pan-hint">Pan horizontally for the remaining columns or operations. You can also focus this region and use the arrow keys.</p>}<div ref={ref} className={className} tabIndex={0} role="region" aria-label={label}>{children}</div></>;
}
export function SvmReadingFlowMathBlock(props) { return <PanRegion className="svm-flow-equation" label="Equation. Pan horizontally for the complete expression."><SharedMathBlock {...props}/></PanRegion>; }
export function SvmReadingFlowInlineMath(props) { return <span className="svm-flow-inline-math"><SharedInlineMath {...props}/></span>; }
export function Scene({ label, width = 720, height = 300, children }) {
  const title = useId();
  return <PanRegion className="svm-flow-pan" label={`${label}. Pan horizontally if needed.`}>
    <svg className="svm-flow-scene" width={width} height={height} style={{ width: `${width / 16}em`, height: `${height / 16}em` }} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={title}>
      <title id={title}>{label}</title>{children}
    </svg>
  </PanRegion>;
}
export function Text({ x, y, children, hue, anchor = 'start', ...rest }) {
  return <text x={x} y={y} fill={hue || colors.neutral} textAnchor={anchor} {...rest}>{children}</text>;
}
export function Wire({ x1, y1, x2, y2, hue = colors.neutral, dash, arrow = false, ...rest }) {
  const angle = Math.atan2(y2 - y1, x2 - x1), head = 7;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hue} strokeWidth="1.5" strokeDasharray={dash} {...rest} />
    {arrow && <path d={`M${x2 - head * Math.cos(angle - .45)},${y2 - head * Math.sin(angle - .45)} L${x2},${y2} L${x2 - head * Math.cos(angle + .45)},${y2 - head * Math.sin(angle + .45)}`} fill="none" stroke={hue} strokeWidth="1.5" />}</g>;
}
export function Port({ x, y, label, value, hue = colors.neutral, width = 130 }) {
  return <g><Text x={x + width / 2} y={y - 12} anchor="middle" hue={hue}>{label}</Text>
    <rect x={x} y={y} width={width} height="42" rx="2" fill="none" stroke={hue} /><Text x={x + width / 2} y={y + 27} anchor="middle" hue={hue}>{value}</Text></g>;
}
export function Mark({ x, y, label, kind = 1, support = false, size = 6 }) {
  const hue = kind === -1 ? colors.negative : kind === 1 ? colors.positive : colors.query;
  return <g>{support && <circle cx={x} cy={y} r={size + 5} fill="none" stroke={hue} strokeWidth="2" />}
    {kind === -1 ? <rect x={x - size} y={y - size} width={2 * size} height={2 * size} fill={hue} /> : kind === 1 ? <circle cx={x} cy={y} r={size} fill={hue} /> : <path d={`M${x},${y - size - 2}l${size + 2},${size + 2}l${-size - 2},${size + 2}l${-size - 2},${-size - 2}Z`} fill={hue} />}
    {label && <Text x={x + 12} y={y - 10} hue={hue}>{label}</Text>}</g>;
}
export function Bracket({ x1, x2, y, label, hue = colors.query }) {
  return <g><Wire x1={x1} x2={x2} y1={y} y2={y} hue={hue}/><Wire x1={x1} x2={x1} y1={y - 5} y2={y + 5} hue={hue}/><Wire x1={x2} x2={x2} y1={y - 5} y2={y + 5} hue={hue}/><Text x={(x1 + x2) / 2} y={y + 24} anchor="middle" hue={hue}>{label}</Text></g>;
}
export function Grid({ matrix, rows, columns, x = 100, y = 65, cell = 100, rowHues = [], columnHues = [], selectedColumns = [] }) {
  return <g>{columns.map((name, j) => <Text key={j} x={x + cell * (j + .5)} y={y - 22} anchor="middle" hue={columnHues[j]}>{name}</Text>)}
    {matrix.map((row, i) => <g key={i}><Text x={x - 16} y={y + 48 * i + 30} anchor="end" hue={rowHues[i]}>{rows[i]}</Text>{row.map((value, j) => <g key={j}>
      <rect x={x + cell * j} y={y + 48 * i} width={cell} height="48" fill={selectedColumns.includes(j) ? '#e8b76c12' : 'none'} stroke={selectedColumns.includes(j) ? colors.query : '#4a505b'} />
      <Text x={x + cell * (j + .5)} y={y + 48 * i + 30} anchor="middle" hue={rowHues[i]}>{typeof value === 'number' ? number(value) : value}</Text>
    </g>)}</g>)}</g>;
}
// Equal scales in both coordinates. Clipping is geometric; feet remain their
// actual coordinates instead of being moved to the border of the viewport.
export function Plane({ points, w = [1, 0], b = 0, levels = [0], query, foot, range = 3, size = 340, children, field, showBoundaryLabels = false }) {
  const clip = useId(), pad = 52, extent = size - 2 * pad, map = ([x, y]) => [pad + extent * (x + range) / (2 * range), size - pad - extent * (y + range) / (2 * range)];
  const line = level => {
    const vertices = [];
    if (w[1] !== 0) for (const x of [-range, range]) { const y = (level - b - w[0] * x) / w[1]; if (Math.abs(y) <= range + 1e-10) vertices.push(map([x, y])); }
    if (w[0] !== 0) for (const y of [-range, range]) { const x = (level - b - w[1] * y) / w[0]; if (Math.abs(x) <= range + 1e-10) vertices.push(map([x, y])); }
    if (vertices.length < 2) return null;
    return <Wire key={level} x1={vertices[0][0]} y1={vertices[0][1]} x2={vertices[1][0]} y2={vertices[1][1]} hue={showBoundaryLabels && level === 0 ? colors.query : colors.neutral} strokeWidth={showBoundaryLabels && level === 0 ? 2.6 : 1.5} dash={level === 0 ? undefined : '6 5'} />;
  };
  const origin = map([0, 0]), norm = Math.hypot(...w), base = norm ? w.map(v => -b * v / norm ** 2) : [0, 0];
  // Translate the direction cue along the same true boundary, away from row D
  // at the default endpoint. Translation along its tangent changes no score.
  const cueBase = showBoundaryLabels && norm ? base.map((v, i) => v + .35 * (i ? w[0] : -w[1]) / norm) : base;
  const normEnd = norm ? cueBase.map((v, i) => v + w[i] / norm) : cueBase, start = map(cueBase), end = map(normEnd);
  const normalCue = norm > 0 && <><Wire x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} hue={colors.query} arrow/>{showBoundaryLabels ? <Text x={pad} y={18} hue={colors.query}>normal w: amber arrow</Text> : <Text x={start[0] - 15} y={start[1] - 40} anchor="end" hue={colors.query}>normal w</Text>}</>;
  return <Scene label="Equal-scale input coordinates, class −1 rose squares and class +1 blue circles" width={size} height={size}>
    <defs><clipPath id={clip}><rect x={pad} y={pad} width={extent} height={extent}/></clipPath></defs>
    <g clipPath={`url(#${clip})`}>{field && Array.from({ length: 24 }, (_, i) => Array.from({ length: 24 }, (_, j) => {
      const x = -range + (i + .5) * 2 * range / 24, y = -range + (j + .5) * 2 * range / 24, [px, py] = map([x, y]);
      const f = field([x, y]); return <rect key={`${i}-${j}`} x={px - extent / 48} y={py - extent / 48} width={extent / 24 + .5} height={extent / 24 + .5} fill={f >= 0 ? colors.positive : colors.negative} opacity={Math.min(.28, Math.abs(f) * .2 + .03)}/>;
    }))}{!showBoundaryLabels && levels.map(line)}</g>
    <Wire x1={pad} y1={origin[1]} x2={size - pad} y2={origin[1]} arrow/><Wire x1={origin[0]} y1={size - pad} x2={origin[0]} y2={pad} arrow/>
    <Text x={size - 40} y={origin[1] + 24}>x₁</Text><Text x={origin[0] + 12} y={35}>x₂</Text>
    {[-range, range].map(v => <g key={v}><Text x={map([v, 0])[0]} y={origin[1] + 25} anchor="middle">{v}</Text><Text x={origin[0] - 12} y={map([0, v])[1] + 5} anchor="end">{v}</Text></g>)}
    {showBoundaryLabels && <g clipPath={`url(#${clip})`}>{levels.map(line)}</g>}
    {!showBoundaryLabels && normalCue}
    {points.map((p, i) => { const [x, y] = map(p.x); return <Mark key={i} x={x} y={y} kind={p.y} label={p.id} support={p.support}/>; })}
    {query && (() => { const [qx, qy] = map(query); return <Mark x={qx} y={qy} kind={0} label="x"/>; })()}
    {foot && query && (() => { const [qx, qy] = map(query), [fx, fy] = map(foot), dx = qx - fx, dy = qy - fy, length = Math.hypot(dx, dy), nx = dx / length * 9, ny = dy / length * 9; return <g>
      <Wire x1={qx} y1={qy} x2={fx} y2={fy} dash="2 4" hue={colors.query}/><circle cx={fx} cy={fy} r="4" fill={colors.query}/><path d={`M${fx - ny},${fy + nx}l${nx},${ny}l${ny},${-nx}`} stroke={colors.query} fill="none"/><Text x={fx - 12} y={fy + 28} anchor="end">foot</Text>
    </g>; })()}{showBoundaryLabels && normalCue}{children?.(map)}
  </Scene>;
}
export function Curve({ curves, xmin, xmax, ymin = 0, ymax, dots = [], xLabel, yLabel, width = 540, height = 300, children }) {
  const l = 95, r = width - 35, top = 35, bottom = height - 65, px = x => l + (x - xmin) / (xmax - xmin) * (r - l), py = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  return <Scene label={`${yLabel} against ${xLabel}`} width={width} height={height}>
    <Wire x1={l} y1={bottom} x2={r} y2={bottom} arrow/><Wire x1={l} y1={bottom} x2={l} y2={top} arrow/>
    <Text x={l} y={22}>{yLabel}</Text><Text x={(l + r) / 2} y={height - 15} anchor="middle">{xLabel}</Text>
    {[xmin, 0, xmax].filter((v, i, a) => v >= xmin && v <= xmax && a.indexOf(v) === i).map(x => <Text key={x} x={px(x)} y={bottom + 25} anchor="middle">{number(x)}</Text>)}
    {[ymin, ymax].map(y => <Text key={y} x={l - 10} y={py(y) + 6} anchor="end">{number(y)}</Text>)}
    {curves.map(({ name, hue, fn, points, labelX }, i) => { const values = points || Array.from({ length: 121 }, (_, j) => { const x = xmin + (xmax - xmin) * j / 120; return [x, fn(x)]; });
      const lx = labelX ?? xmin + (xmax - xmin) * (.18 + i * .22), ly = fn ? fn(lx) : values.at(-1)[1];
      return <g key={name}><polyline points={values.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} stroke={hue} strokeWidth="2" fill="none"/><Text x={px(lx) + 6} y={py(ly) - 14} hue={hue}>{name}</Text></g>;
    })}
    {dots.map(({ x, y, hue, label }, i) => <g key={i}><circle cx={px(x)} cy={py(y)} r="5" fill={hue || colors.query}/><Text x={px(x) + 9} y={py(y) + 24}>{label}</Text></g>)}{children?.({ px, py })}
  </Scene>;
}
export function ExactInput({ name, value, onChange, min = -Number.MAX_VALUE, max = Number.MAX_VALUE, integer = false, revision = 0 }) {
  const id = useId(), [draft, setDraft] = useState(String(value)), [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, revision]);
  const apply = () => { try { onChange(numericDraft(draft, min, max, name, integer)); setError(''); } catch (e) { setError(e.message); } };
  return <div className="svm-flow-exact"><label htmlFor={id}>{name}</label><span className="svm-flow-entry"><input id={id} inputMode="decimal" aria-describedby={error ? `${id}-error` : undefined} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}/><button type="button" onClick={apply}>Apply</button></span>{error && <span id={`${id}-error`} role="alert">{error}</span>}</div>;
}
export function Select({ name, value, options, onChange }) {
  const id = useId(); return <div className="svm-flow-select"><label htmlFor={id}>{name}</label><select id={id} value={value} onChange={e => onChange(e.target.value)}>{options.map(([v, text]) => <option value={v} key={String(v)}>{text}</option>)}</select></div>;
}
export const Reset = ({ onClick }) => <button type="button" className="flow-reset" onClick={onClick}>Reset</button>;
export function ExactTable({ caption, columns, rows }) {
  return <PanRegion className="svm-flow-table" label={`${caption}. Pan for all columns.`}><table><caption>{caption}</caption><thead><tr>{columns.map((col, i) => <th key={i} scope="col">{col}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></PanRegion>;
}
export { FlowControls, FlowReadout };
