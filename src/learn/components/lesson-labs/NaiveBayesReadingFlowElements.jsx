import { useId, useState } from 'react';
import { formatNaiveBayesNumber } from '../../data/naive-bayes-models.js';
import { classColors } from '../../data/naive-bayes-reading-flow-models.js';
export const f = (x, d = 5) => formatNaiveBayesNumber(x, d);
export const num = text => text.trim() === '' ? NaN : Number(text);
export function useDraft(defaults, derive) {
  const [draft, setDraft] = useState(defaults),
    [value, setValue] = useState(() => derive(defaults)),
    [error, setError] = useState('');
  const edit = (key, next) => {
    const candidate = {
      ...draft,
      [key]: next
    };
    setDraft(candidate);
    try {
      const result = derive(candidate);
      setValue(result);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };
  const reset = () => {
    setDraft({
      ...defaults
    });
    setValue(derive(defaults));
    setError('');
  };
  return {
    draft,
    value,
    error,
    edit,
    reset
  };
}
export function Field({
  label,
  value,
  onChange,
  help,
  vector = false
}) {
  const id = useId();
  return <label className="nb-field" htmlFor={id}>
    <span>
      {label}
    </span>
    <input id={id} aria-label={label} type="text" inputMode={vector ? 'text' : 'decimal'} value={value} onChange={e => onChange(e.target.value)} autoComplete="off" spellCheck="false" aria-describedby={help ? id + '-help' : undefined} />
    {help && <small id={id + '-help'}>
      {help}
    </small>}
  </label>;
}
export function Choice({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label className="nb-field" htmlFor={id}>
    <span>
      {label}
    </span>
    <select id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(([v, name]) => <option key={v} value={v}>
        {name}
      </option>)}
    </select>
  </label>;
}
export function Controls({
  model,
  children
}) {
  return <>
    <div className="nb-controls">
      {children}
      <button type="button" onClick={model.reset}>Reset</button>
    </div>
    <p className={'nb-validation' + (model.error ? ' nb-validation--error' : '')} role="status">
      {model.error ? 'Draft rejected; drawing retains the last valid inputs. ' + model.error : 'Drawing uses the current valid inputs.'}
    </p>
  </>;
}
export function Figure({
  title,
  caption,
  children
}) {
  return <figure className="nb-figure">
    <figcaption>
      <strong>
        {title}
      </strong>
      {caption && <span>
        {caption}
      </span>}
    </figcaption>
    {children}
  </figure>;
}
export function Svg({
  width = 760,
  height = 340,
  label,
  children
}) {
  return <>
    <div className="nb-pan" role="region" aria-label={label + '; drawing can scroll horizontally'} tabIndex={0}>
      <svg width={width} height={height} style={{
        width: width / 16 + 'rem',
        height: height / 16 + 'rem'
      }} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {children}
      </svg>
    </div>
    <small className="nb-pan-hint">Scroll the drawing horizontally to follow the complete mechanism.</small>
  </>;
}
export function Text({
  x,
  y,
  children,
  color = 'currentColor',
  anchor = 'start',
  size = 16,
  ...rest
}) {
  return <text x={x} y={y} fill={color} fontSize={size} style={{
    fontSize: size
  }} textAnchor={anchor} {...rest}>
    {children}
  </text>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = '#93939c',
  dashed = false
}) {
  const id = useId().replaceAll(':', '');
  return <>
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      </marker>
    </defs>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.6" strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#${id})`} />
  </>;
}
export function Mark({
  x,
  y,
  c = 0,
  size = 7,
  selected = false
}) {
  const fill = classColors[c];
  return c === 1 ? <path d={`M${x},${y - size}L${x + size},${y + size}L${x - size},${y + size}Z`} fill={fill} stroke={selected ? 'white' : fill} strokeWidth={selected ? 3 : 1} /> : c === 2 ? <rect x={x - size} y={y - size} width={2 * size} height={2 * size} fill={fill} stroke={selected ? 'white' : fill} strokeWidth={selected ? 3 : 1} /> : <circle cx={x} cy={y} r={size} fill={fill} stroke={selected ? 'white' : fill} strokeWidth={selected ? 3 : 1} />;
}
export function ClassLegend({
  three = false
}) {
  return <p className="nb-key">
    <span style={{
      color: classColors[0]
    }}>● class 0</span>
    <span style={{
      color: classColors[1]
    }}>▲ class 1</span>
    {three && <span style={{
      color: classColors[2]
    }}>■ class 2</span>}
    <span>White outline: selected operation</span>
  </p>;
}
export function Table({
  caption,
  headers,
  rows
}) {
  return <div className="nb-table-pan" tabIndex={0}>
    <table>
      <caption>
        {caption}
      </caption>
      <thead>
        <tr>
          {headers.map((x, j) => <th scope="col" key={j}>
            {x}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => <tr key={i}>
          {row.map((x, j) => j === 0 ? <th scope="row" key={j}>
            {x}
          </th> : <td key={j}>
            {x}
          </td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
export function Result({
  children
}) {
  return <div className="nb-result" aria-live="polite">
    {children}
  </div>;
}
export function Probability({
  values,
  labels
}) {
  if (!values) return <p>Posterior undefined: both/all classes give this known event zero likelihood.</p>;
  return <div className="nb-probabilities">
    {values.map((p, c) => <div key={c}>
      <span style={{
        color: classColors[c]
      }}>{labels?.[c] || `class ${c}`}: {f(p)}</span>
      <div className="nb-probability-track">
        <span style={{
          width: `${100 * p}%`,
          background: classColors[c]
        }} />
      </div>
    </div>)}
  </div>;
}
export function Axis({
  x = 60,
  y = 270,
  width = 430,
  height = 210,
  xlabel,
  ylabel,
  xTicks = [0, .25, .5, .75, 1],
  yTicks = [0, .25, .5, .75, 1],
  xmin = 0,
  xmax = 1,
  ymin = 0,
  ymax = 1
}) {
  return <>
    <line x1={x} y1={y} x2={x + width} y2={y} stroke="#bbb" />
    <line x1={x} y1={y} x2={x} y2={y - height} stroke="#bbb" />
    {xTicks.map(t => <g key={t}>
      <line x1={x + width * (t - xmin) / (xmax - xmin)} y1={y} x2={x + width * (t - xmin) / (xmax - xmin)} y2={y + 5} stroke="#bbb" />
      <Text x={x + width * (t - xmin) / (xmax - xmin)} y={y + 23} anchor="middle">
        {f(t, 3)}
      </Text>
    </g>)}
    {yTicks.map(t => <Text key={t} x={x - 10} y={y - height * (t - ymin) / (ymax - ymin) + 5} anchor="end">
      {f(t, 3)}
    </Text>)}
    <Text x={x + width / 2} y={y + 51} anchor="middle">
      {xlabel}
    </Text>
    <Text x={x} y={y - height - 8}>
      {ylabel}
    </Text>
  </>;
}
export const pathFor = (points, x, y) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join(' ');

// Explicit input/output objects for this lesson's fitting and inference circuits.
export function Port({ x, y, width = 180, lines, color = '#93939c', dashed = false }) {
  const height = 18 + lines.length * 25;
  return <g data-nb-port="true">
    <rect x={x} y={y} width={width} height={height} fill="none" stroke={color}
      strokeDasharray={dashed ? '5 4' : undefined} />
    {lines.map((line, index) => <Text key={index} x={x + 10} y={y + 27 + index * 25} color={color}>{line}</Text>)}
  </g>;
}

export function RecordStack({ x, y, rows, label, width = 330, headers = ['ID', '0: free', '1: money', 'target'] }) {
  const columns = [0, .25, .5, .75, 1].map(part => x + part * width);
  return <g data-nb-record-stack="true">
    <Text x={x} y={y - 12}>{label}</Text>
    {headers.map((title, index) =>
      <Text key={title} x={columns[index] + 6} y={y + 22}>{title}</Text>)}
    {rows.map((row, index) => <g key={row[0]}>
      <rect x={x} y={y + 32 + index * 38} width={width * .75} height={38} fill="none" stroke="#757580" />
      {row.slice(0, 3).map((value, column) => <Text key={column} x={columns[column] + 6} y={y + 57 + index * 38}
        color={column === 1 ? '#b79cff' : column === 2 ? '#78d3ea' : 'currentColor'}>{value}</Text>)}
      <rect x={columns[3]} y={y + 70 + index * 38} width={width * .25} height={38} fill="none" stroke={row[3] === '?' ? 'white' : '#757580'} />
      <Text x={columns[3] + 6} y={y + 95 + index * 38} color={row[3] === '?' ? 'white' : 'currentColor'}>{row[3]}</Text>
    </g>)}
    {columns.slice(1, 3).map(position => <line key={position} x1={position} x2={position}
      y1={y + 32} y2={y + 32 + rows.length * 38} stroke="#757580" />)}
  </g>;
}
