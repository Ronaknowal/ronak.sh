import { useId, useState } from 'react';
import { formatNumber, recordColors, recordNames } from "../../data/pca-geometry.js";
import './pca-reading-flow.css';

export function useNumericDrafts(initialValues, domains, onCommit, validate) {
  const [values, setValues] = useState(initialValues);
  const [drafts, setDrafts] = useState(initialValues.map(String));
  const [statuses, setStatuses] = useState(initialValues.map(() => ''));

  function edit(index, text) {
    setDrafts(previous => previous.map((value, i) => i === index ? text : value));
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
    const numeric = decimal.test(text.trim()) ? Number(text) : NaN;
    const domain = domains[index];
    const inDomain = Number.isFinite(numeric) && numeric >= domain[0] &&
      numeric <= domain[1] && (!domain[2] || Number.isInteger(numeric));
    const nextValues = values.map((value, i) => i === index ? numeric : value);
    const dependentError = inDomain ? validate?.(nextValues) : null;
    const valid = inDomain && !dependentError;
    setStatuses(previous => previous.map((value, i) => i === index ?
      (valid ? '' : dependentError ?? `Enter ${domain[2] ? 'an integer' : 'a finite number'} from ${domain[0]} to ${domain[1]}; the drawing retains the last valid value.`) : value));
    if (valid) {
      setValues(previous => previous.map((value, i) => i === index ? numeric : value));
      onCommit?.(index, numeric);
    }
  }

  function reset() {
    setValues(initialValues);
    setDrafts(initialValues.map(String));
    setStatuses(initialValues.map(() => ''));
  }

  function restore(nextValues) {
    setValues(nextValues);
    setDrafts(nextValues.map(String));
    setStatuses(nextValues.map(() => ''));
  }

  return { values, drafts, statuses, edit, reset, restore };
}

export function NumberField({ state, index, label, min, max, step = 'any' }) {
  const id = useId();
  return <label className="pca-number-field" htmlFor={id}>
    <span id={`${id}-label`}>{label}</span>
    <input id={id} type="text" inputMode="decimal" value={state.drafts[index]}
      aria-labelledby={`${id}-label`}
      aria-invalid={Boolean(state.statuses[index])}
      aria-describedby={`${id}-range${state.statuses[index] ? ` ${id}-status` : ''}`}
      onChange={event => state.edit(index, event.target.value)} />
    <small id={`${id}-range`}>{min} ≤ value ≤ {max}{step === 1 ? '; integer' : ''}</small>
    {state.statuses[index] && <span id={`${id}-status`} className="pca-status"
      role="status">{state.statuses[index]}</span>}
  </label>;
}

export function Controls({ children, onReset }) {
  return <div className="pca-controls">
    {children}
    <button type="button" onClick={onReset}>Reset</button>
  </div>;
}

export function Figure({ job, title, description, children, caption }) {
  const id = useId();
  return <figure className="pca-mechanism" data-pca-job={job}
    aria-labelledby={`${id}-caption`}>
    <span className="pca-sr-only">{title}. {description}</span>
    {children}
    <figcaption id={`${id}-caption`}>{caption}</figcaption>
  </figure>;
}

export function Drawing({ title, description, height = 320, width = 560, children }) {
  const id = useId();
  return <div className="pca-drawing-pan" tabIndex={0}
    role="region" aria-label={`${title}; horizontal drawing scroll when needed`}>
    <svg className="pca-drawing" viewBox={`0 0 ${width} ${height}`}
      style={{ '--pca-drawing-width': `${width / 16}rem` }} role="img"
      aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-description`}>{description}</desc>
      {children}
    </svg>
  </div>;
}

export function Matrix({ values, label, rowLabels, rowColors, columnLabels, signed = false, exactNumbers = false }) {
  return <div className="pca-matrix" tabIndex={0} role="region" aria-label={`${label}; numeric table scroll when needed`}>
    <table>
      <caption>{label}</caption>
      <thead><tr><th scope="col">{rowLabels?.every(name => recordNames.includes(name)) ? 'Record' : 'Row'}</th>
        {(values[0] ?? columnLabels?.map(() => null) ?? []).map((_, index) => <th key={index} scope="col">
          {columnLabels?.[index] ?? `Column ${index + 1}`}
        </th>)}
      </tr></thead>
      <tbody>{values.map((row, index) => <tr key={index}>
        <th scope="row" style={rowLabels ? {
          color: rowColors?.[index] ?? recordColors[recordNames.indexOf(rowLabels[index])]
        } : undefined}>
          {rowLabels?.[index] ?? index + 1}
        </th>
        {row.map((value, column) => <td key={column} data-sign={signed ? Math.sign(value) : undefined}>
          {typeof value === 'number' ? exactNumbers ? String(value) : formatNumber(value) : value}
        </td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

export function Records({ records, columns, caption }) {
  return <div className="pca-table-pan" tabIndex={0} role="region" aria-label={caption}>
    <table><caption>{caption}</caption><thead><tr>
      <th scope="col">Record</th>
      {columns.map(column => <th scope="col" key={column.label}>{column.label}</th>)}
    </tr></thead><tbody>
      {records.map((record, index) => <tr key={record.id ?? index}>
        <th scope="row" style={{ color: recordColors[index % 4] }}>{record.id ?? recordNames[index]}</th>
        {columns.map(column => <td key={column.label}>
          {column.read(record)}
        </td>)}
      </tr>)}
    </tbody></table>
  </div>;
}

export function Arrow({ x1, y1, x2, y2, color = '#d6d6d6', dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  return <g stroke={color} fill="none" strokeWidth="1.7">
    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? '5 4' : undefined} />
    <path d={`M${x2 - head * Math.cos(angle - 0.5)},${y2 - head * Math.sin(angle - 0.5)} L${x2},${y2} L${x2 - head * Math.cos(angle + 0.5)},${y2 - head * Math.sin(angle + 0.5)}`} />
  </g>;
}

export function Point({ x, y, label, color, hollow = false, dx = 9, dy = -10, shape }) {
  const identity = shape ?? recordNames.indexOf(label);
  const fill = hollow ? '#171717' : color;
  return <g>
    {identity === 1 ? <path d={`M${x},${y - 6} L${x + 6},${y + 5} L${x - 6},${y + 5} Z`}
      stroke={color} strokeWidth={2} fill={fill} /> :
      identity === 2 ? <rect x={x - 5} y={y - 5} width={10} height={10}
        stroke={color} strokeWidth={2} fill={fill} /> :
        identity === 3 ? <path d={`M${x},${y - 6} L${x + 6},${y} L${x},${y + 6} L${x - 6},${y} Z`}
          stroke={color} strokeWidth={2} fill={fill} /> :
          <circle cx={x} cy={y} r={5} stroke={color} strokeWidth={2} fill={fill} />}
    {label && <text x={x + dx} y={y + dy} fill={color}>{label}</text>}
  </g>;
}

export function Pair({ values }) {
  return <>({values.map(value => formatNumber(value)).join(', ')})</>;
}
