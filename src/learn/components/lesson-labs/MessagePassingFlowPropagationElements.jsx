import { useId } from 'react';
import { Drawing, Arrow, paperHues, channelHues } from './MessagePassingFlowElements.jsx';
import { propagationNumber as num } from '../../data/message-propagation-flow-models.js';
export { Drawing, Arrow, paperHues, channelHues, num };
export const roleHues = {
  input: '#82d3ed',
  parameter: '#e4b752',
  computed: '#c1a4f5'
};
export const compactNumber = value => value === null ? '—' : (num(value, 3).length > 7 ? value.toExponential(0).replaceAll('-', '−') : num(value, 3)).replace('e+', 'e');
export const centerText = (y, text, hue = '#eee', x = 144) => <text x={x} y={y} textAnchor="middle" fill={hue}>
    {text}
  </text>;
export function PropagationSelect({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label className="mp-propagation-select" htmlFor={id}>
    <span>
      {label}
    </span>
    <select id={id} aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, title]) => <option key={key} value={key}>
        {title}
      </option>)}
    </select>
  </label>;
}
export function Operation({
  y,
  text,
  width = 220,
  x = 144
}) {
  return <g>
    <rect x={x - width / 2} y={y} width={width} height="44" rx="4" stroke="#aaa" fill="#111" />
    <text x={x} y={y + 28} textAnchor="middle">
      {text}
    </text>
  </g>;
}
export function NodeRow({
  values,
  title,
  degree = null,
  selected = null
}) {
  const width = Math.max(288, values.length * 96),
    height = degree ? 178 : 145;
  return <Drawing width={width} height={height} label={`${title}: ${values.map((value, i) => `node${i}=${value === null ? 'undefined' : value}`).join(', ')}`}>
    {centerText(25, title, '#eee', width / 2)}
    {values.map((value, i) => {
      const x = (i + .5) * width / values.length;
      return <g key={i}>
      <text x={x} y="54" textAnchor="middle" fill={paperHues[i % 6]}>node {i}</text>
      <circle cx={x} cy="94" r="34" fill="#101010" stroke={selected === i ? '#fff' : paperHues[i % 6]} strokeWidth={selected === i ? 3 : 2} />
      <text x={x} y="100" textAnchor="middle" fill={paperHues[i % 6]}>
        {compactNumber(value)}
      </text>
      {degree && <text x={x} y="158" textAnchor="middle">d={compactNumber(degree[i])}</text>}
    </g>;
    })}
  </Drawing>;
}
export function Pattern({
  values,
  title,
  domain = Math.max(1, ...values.filter(value => value !== null).map(Math.abs)),
  selected = null
}) {
  const height = 105 + values.length * 75,
    scale = 88 / domain;
  return <Drawing width={288} height={height} label={`${title}; signed node-value bars use range minus${domain} to plus${domain}`}>
    {centerText(25, title)}
    {values.map((value, i) => {
      const y = 76 + i * 75;
      return <g key={i}>
      <circle cx="25" cy={y} r="19" fill="#111" stroke={selected === i ? '#fff' : paperHues[i % 6]} strokeWidth={selected === i ? 3 : 2} />
      <text x="25" y={y + 6} textAnchor="middle" fill={paperHues[i % 6]}>
        {i}
      </text>
      <path d={`M170,${y - 12}v24`} stroke="#666" />
      {value !== null && value !== 0 && <rect x={Math.min(170, 170 + value * scale)} y={y - 5} width={Math.abs(value * scale)} height="10" fill={paperHues[i % 6]} />}
      {value === 0 && <circle cx="170" cy={y} r="3" fill={paperHues[i % 6]} />}
      <text x="170" y={y - 24} textAnchor="middle">
        {value === null ? 'undefined at d=0' : num(value, 4)}
      </text>
    </g>;
    })}
    <path d={`M82,${height - 50}H258`} stroke="#aaa" />
    <text x="82" y={height - 25} textAnchor="middle">−{compactNumber(domain)}</text>
    <text x="170" y={height - 25} textAnchor="middle">0</text>
    <text x="258" y={height - 25} textAnchor="middle">
      {compactNumber(domain)}
    </text>
  </Drawing>;
}
export function ColumnGrid({
  table,
  title,
  columns = ['c1', 'c2'],
  rowIds = table.map((_, i) => i),
  columnHues = channelHues
}) {
  const width = 96 + columns.length * 112,
    height = 110 + table.length * 65;
  return <Drawing width={width} height={height} label={`${title}; ${table.length} node rows by${columns.length} channel columns`}>
    {centerText(26, title, '#eee', width / 2)}
    {columns.map((label, c) => <text key={c} x={150 + c * 112} y="62" textAnchor="middle" fill={columnHues[c % columnHues.length]}>
      {label}
    </text>)}
    {table.map((row, node) => <g key={node}>
      <text x="38" y={107 + node * 65} textAnchor="middle" fill={paperHues[rowIds[node] % 6]}>node {rowIds[node]}</text>
      {row.map((value, c) => <g key={c}>
        <rect x={103 + c * 112} y={79 + node * 65} width="94" height="43" fill="#111" stroke={columnHues[c % columnHues.length]} />
        <text x={150 + c * 112} y={107 + node * 65} textAnchor="middle" fill={columnHues[c % columnHues.length]}>
          {num(value, 4)}
        </text>
      </g>)}
    </g>)}
    {centerText(height - 10, `${table.length} nodes × ${columns.length} channels`, '#bbb', width / 2)}
  </Drawing>;
}
export function ChannelMatrix({
  matrix,
  title,
  columns = ['c1', 'c2'],
  hue = roleHues.parameter
}) {
  return <Drawing width={320} height={242} label={`${title}; output channel rows, input channel columns; ${matrix.flat().join(', ')}`}>
    {centerText(25, title, '#eee', 160)}
    {columns.map((label, c) => <text key={c} x={126 + c * 112} y="62" textAnchor="middle">{label} in</text>)}
    {matrix.map((row, i) => <g key={i}>
      <text x="33" y={106 + i * 65} textAnchor="middle">c{i + 1} out</text>
      {row.map((value, j) => <g key={j}>
        <rect x={80 + j * 112} y={78 + i * 65} width="92" height="42" fill="#111" stroke={hue} />
        <text x={126 + j * 112} y={106 + i * 65} textAnchor="middle" fill={hue}>
          {num(value, 5)}
        </text>
      </g>)}
    </g>)}
    {centerText(226, '2 × 2 channel map', '#bbb', 160)}
  </Drawing>;
}
export function NodeOperator({
  matrix,
  title
}) {
  const width = 72 + matrix.length * 100,
    height = 106 + matrix.length * 66;
  return <Drawing width={width} height={height} label={`${title}; receiving-node rows and source-node columns`}>
    {centerText(25, title, '#eee', width / 2)}
    {matrix.map((_, source) => <text key={source} x={122 + source * 100} y="61" textAnchor="middle" fill={paperHues[source]}>from {source}</text>)}
    {matrix.map((row, receiver) => <g key={receiver}>
      <text x="29" y={106 + receiver * 66} textAnchor="middle" fill={paperHues[receiver]}>to {receiver}</text>
      {row.map((value, source) => <g key={source}>
        <rect x={78 + source * 100} y={79 + receiver * 66} width="88" height="42" fill="#111" stroke="#aaa" />
        <text x={122 + source * 100} y={107 + receiver * 66} textAnchor="middle">
          {compactNumber(value)}
        </text>
      </g>)}
    </g>)}
    {centerText(height - 10, `${matrix.length} receivers × ${matrix.length} sources`, '#bbb', width / 2)}
  </Drawing>;
}
export function VectorOperation({
  input,
  output,
  title,
  operation,
  factor = null
}) {
  const width = Math.max(288, input.length * 96);
  return <Drawing width={width} height={294} label={`${title}; ${input.join(', ')} through${operation} gives${output.join(', ')}`}>
    {centerText(25, title, '#eee', width / 2)}
    {input.map((value, node) => <g key={node}>
      <text x={(node + .5) * width / input.length} y="57" textAnchor="middle" fill={paperHues[node % 6]}>node {node}</text>
      <text x={(node + .5) * width / input.length} y="87" textAnchor="middle" fill={paperHues[node % 6]}>
        {compactNumber(value)}
      </text>
    </g>)}
    <Arrow x1={width / 2} y1={103} x2={width / 2} y2={131} />
    <Operation x={width / 2} y={138} text={operation} width={Math.min(width - 30, 270)} />
    {factor !== null && centerText(213, `factor = ${num(factor, 9)}`, roleHues.parameter, width / 2)}
    {output.map((value, node) => <g key={node}>
      <circle cx={(node + .5) * width / input.length} cy="253" r="34" fill="#111" stroke={paperHues[node % 6]} />
      <text x={(node + .5) * width / input.length} y="259" textAnchor="middle" fill={paperHues[node % 6]}>
        {compactNumber(value)}
      </text>
    </g>)}
  </Drawing>;
}
export function ExactRows({
  caption,
  headers,
  rows
}) {
  return <div className="mp-propagation-matrix-pan" tabIndex={0} role="region" aria-label={caption}>
    <table className="mp-propagation-values">
      <caption>
        {caption}
      </caption>
      <thead>
        <tr>
          {headers.map((header, i) => <th key={i}>
            {header}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => <tr key={i}>
          {row.map((value, j) => j ? <td key={j}>
            {typeof value === 'number' || value === null ? num(value, 12) : value}
          </td> : <th key={j}>
            {value}
          </th>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
export function Trajectory({
  history,
  round,
  domain,
  title
}) {
  const logarithmic = domain > 32,
    transformed = value => logarithmic ? Math.sign(value) * Math.log1p(Math.abs(value)) : value,
    extent = transformed(domain),
    x = step => 70 + step * 9.3,
    y = value => 185 - transformed(value) * 100 / extent;
  return <Drawing width={512} height={367} label={`${title}; rounds0–40, common ${logarithmic ? 'signed log(1+absolute value)' : 'linear'} value-axis range minus${domain} to plus${domain}`}>
    {centerText(25, title, '#eee', 256)}
    <path d="M70,76V292H442 M70,185H442" fill="none" stroke="#777" />
    {[0, 20, 40].map(step => <g key={step}>
      <path d={`M${x(step)},292v6`} stroke="#aaa" />
      <text x={x(step)} y="325" textAnchor="middle">
        {step}
      </text>
    </g>)}
    {[-domain, 0, domain].map(value => <text key={value} x="59" y={y(value) + 6} textAnchor="end">
      {compactNumber(value)}
    </text>)}
    {history[0].map((_, node) => <g key={node}>
      <polyline points={history.flatMap((row, step) => row[node] === null ? [] : [`${x(step)},${y(row[node])}`]).join(' ')} fill="none" stroke={paperHues[node]} strokeWidth="2" />
      {history[round][node] !== null && <circle cx={x(round)} cy={y(history[round][node])} r="4" fill={paperHues[node]} stroke="#fff" />}
    </g>)}
    <path d={`M${x(round)},76V292`} stroke="#fff" strokeDasharray="3 5" opacity=".5" />
    {centerText(358, logarithmic ? 'Round · value axis signed log(1+|v|)' : 'Integer round · linear node-value axis', '#bbb', 256)}
  </Drawing>;
}
export function NumericLegend() {
  return <p className="flow-note">Node IDs keep their hues across rows and routes; channel 1 is cyan and channel 2 pink. White marks selection. Amber marks parameters, violet computed merged results. Geometry organizes the operation unless a numeric axis or bar scale is explicitly labelled; written values retain precision beyond rounded drawing labels.</p>;
}
