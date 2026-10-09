import { useId } from 'react';
import { Drawing, Arrow, paperHues, channelHues } from './MessagePassingFlowElements.jsx';
import { expressivenessNumber } from '../../data/message-expressiveness-flow-models.js';
export { Drawing, Arrow, paperHues, channelHues };
export const num = expressivenessNumber;
export const short = value => typeof value === 'number' && num(value, 4).length > 8 ? value.toExponential(0).replace('e+', 'e').replaceAll('-', '−') : typeof value === 'number' ? num(value, 4) : String(value);
export const hues = {
  parameter: '#e4b752',
  computed: '#b99ded',
  channel3: '#b8a4ed'
};
export function Text({
  x = 192,
  y,
  children,
  hue = '#eee',
  anchor = 'middle'
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={hue}>
    {children}
  </text>;
}
export function Op({
  x = 62,
  y,
  width = 260,
  children,
  hue = '#ddd'
}) {
  return <g>
    <rect x={x} y={y} width={width} height={44} rx={3} fill="#111" stroke="#888" />
    <Text x={x + width / 2} y={y + 28} hue={hue}>
      {children}
    </Text>
  </g>;
}
export function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label className="mp-express-select" htmlFor={id}>
    {label}
    <select id={id} aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, name]) => <option key={key} value={key}>
        {name}
      </option>)}
    </select>
  </label>;
}
export function Rows({
  title,
  headers,
  rows
}) {
  return <div className="mp-express-table-pan" tabIndex={0} role="region" aria-label={title}>
    <table className="mp-express-values">
      <caption>
        {title}
      </caption>
      <thead>
        <tr>
          {headers.map((h, i) => <th key={i}>
            {h}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => <tr key={i}>
          {row.map((v, j) => j ? <td key={j}>
            {typeof v === 'number' ? num(v, 12) : v}
          </td> : <th key={j}>
            {v}
          </th>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
export function Grid({
  values,
  title,
  rowLabels,
  columnLabels,
  rowIdentities,
  columnIdentities,
  parameter = false,
  nodeRows = true
}) {
  const columnHue = c => parameter ? hues.parameter : columnIdentities
    ? paperHues[columnIdentities[c] % paperHues.length]
    : [...channelHues, hues.channel3][c % 3];
  const cols = Math.max(...values.map(r => r.length)),
    w = Math.max(384, 110 + cols * 116),
    h = 100 + values.length * 64;
  return <Drawing width={w} height={h} label={title}>
    <Text x={w / 2} y={23}>
      {title}
    </Text>
    {Array.from({
      length: cols
    }, (_, c) => <Text key={c} x={166 + c * 116} y={60} hue={columnHue(c)}>
      {columnLabels?.[c] ?? `c${c + 1}`}
    </Text>)}
    {values.map((row, r) => <g key={r}>
      <Text x={92} y={100 + r * 64} anchor="end" hue={nodeRows ? paperHues[(rowIdentities?.[r] ?? r) % 6] : '#ddd'}>
        {rowLabels?.[r] ?? (nodeRows ? `node ${r}` : `out c${r + 1}`)}
      </Text>
      {row.map((v, c) => <g key={c}>
        <rect x={110 + c * 116} y={74 + r * 64} width={108} height={44} fill="#101010" stroke={columnHue(c)} />
        <Text x={164 + c * 116} y={102 + r * 64} hue={columnHue(c)}>
          {short(v)}
        </Text>
      </g>)}
    </g>)}
  </Drawing>;
}
export function NodeValues({
  values,
  title,
  labels
}) {
  return <Grid values={values.map(v => [v])} title={title} columnLabels={['value']} rowLabels={labels} />;
}
export function Reduction({
  values,
  name = 'sum',
  title = 'Occurrence reduction',
  prefix = 'o',
  emptyZero = false,
  selected = null
}) {
  const n = values.length,
    h = Math.max(230, 100 + n * 84),
    mid = 55 + Math.max(1, n) * 42,
    aggregate = n ? name === 'sum' ? values.reduce((s, v) => s + v, 0) : name === 'mean' ? values.reduce((s, v) => s + v, 0) / n : Math.max(...values) : name === 'sum' || emptyZero ? 0 : null;
  return <Drawing width={384} height={h} label={title}>
    <Text y={24}>
      {title}
    </Text>
    {values.map((v, i) => {
      const y = 74 + i * 84;
      return <g key={i}>
      <Text x={58} y={y - 35} hue={paperHues[i % 6]}>
        {prefix}
        {i}
      </Text>
      <circle cx={58} cy={y} r={29} fill="#111" stroke={selected === i ? '#fff' : paperHues[i % 6]} strokeWidth={selected === i ? 3 : 1} />
      <Text x={58} y={y + 6} hue={paperHues[i % 6]}>
        {short(v)}
      </Text>
      <Arrow x1={89} y1={y} x2={257} y2={mid + (i - (n - 1) / 2) * 8} />
    </g>;
    })}
    <rect x={258} y={mid - 30} width={110} height={60} fill="#111" stroke="#999" />
    <Text x={313} y={mid - 5}>
      {name}
    </Text>
    <Text x={313} y={mid + 18} hue={hues.computed}>
      {aggregate === null ? 'undefined' : short(aggregate)}
    </Text>
    <Text y={h - 14}>{n} distinct occurrences</Text>
  </Drawing>;
}
export function Lift({
  values,
  title = 'Transform before the sum',
  prefix = 'o',
  selected = null
}) {
  const h = 210 + values.length * 84,
    sum = values.reduce((s, v) => [s[0] + v, s[1] + v * v], [0, 0]),
    sumY = 85 + values.length * 84;
  return <Drawing width={512} height={h} label={title}>
    <Text x={256} y={24}>
      {title}
    </Text>
    <Text x={319} y={58} hue={channelHues[0]}>c1 = x</Text>
    <Text x={439} y={58} hue={channelHues[1]}>c2 = x²</Text>
    {values.map((v, i) => {
      const y = 94 + i * 84;
      return <g key={i}>
      <Text x={42} y={y - 29} hue={paperHues[i % 6]}>
        {prefix}
        {i}
      </Text>
      <circle cx={42} cy={y + 3} r={27} stroke={selected === i ? '#fff' : paperHues[i % 6]} strokeWidth={selected === i ? 3 : 1} fill="#111" />
      <Text x={42} y={y + 9} hue={paperHues[i % 6]}>
        {short(v)}
      </Text>
      <Arrow x1={72} y1={y + 3} x2={116} y2={y + 3} />
      <Op x={119} y={y - 19} width={108}>φ(x)=(x,x²)</Op>
      <Arrow x1={229} y1={y + 3} x2={265} y2={y + 3} />
      {[v, v * v].map((x, c) => <g key={c}>
        <rect x={269 + c * 120} y={y - 20} width={102} height={46} fill="#111" stroke={channelHues[c]} />
        <Text x={320 + c * 120} y={y + 9} hue={channelHues[c]}>
          {short(x)}
        </Text>
        <path d={'M' + (371 + c * 120) + ',' + (y + 3) + 'H' + (c ? 506 : 378)} stroke={channelHues[c]} fill="none" />
      </g>)}
    </g>;
    })}
    {[0, 1].map(c => <g key={c}>
      {values.length > 0 && <>
        <path d={'M' + (c ? 506 : 378) + ',97V' + (sumY + 22)} stroke={channelHues[c]} fill="none" />
        <Arrow x1={c ? 506 : 378} y1={sumY + 22} x2={371 + c * 120} y2={sumY + 22} hue={channelHues[c]} />
      </>}
      <rect x={269 + c * 120} y={sumY} width={102} height={44} fill="#111" stroke={channelHues[c]} />
      <Text x={320 + c * 120} y={sumY + 28} hue={channelHues[c]}>Σ c{c + 1}</Text>
      <Arrow x1={320 + c * 120} y1={sumY + 49} x2={320 + c * 120} y2={sumY + 74} hue={channelHues[c]} />
      <Text x={320 + c * 120} y={sumY + 97} hue={channelHues[c]}>
        {short(sum[c])}
      </Text>
    </g>)}
    <Text x={140} y={sumY + 74}>Sum each coordinate</Text>
  </Drawing>;
}
export function Graph({
  incoming,
  values,
  title,
  names,
  directed = false,
  layout = 'ring'
}) {
  const n = incoming.length,
    w = n > 4 ? 512 : 384,
    h = n > 4 ? 390 : 310,
    points = Array.from({
      length: n
    }, (_, i) => layout === 'triangles' ? [[95, 70], [45, 210], [150, 210], [360, 70], [300, 210], [415, 210]][i] : n === 4 ? [[75, 75], [280, 75], [280, 230], [75, 230]][i] : [w / 2 + Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n) * (n > 4 ? 180 : 115), h / 2 + (n > 4 ? 12 : 0) + Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n) * (n > 4 ? 135 : 105)]);
  return <Drawing width={w} height={h + 40} label={title}>
    <Text x={w / 2} y={24}>
      {title}
    </Text>
    {incoming.flatMap((donors, t) => donors.filter(s => directed || s < t).map((s, j) => {
      const a = points[s],
        b = points[t],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        norm = Math.hypot(dx, dy),
        start = [a[0] + dx / norm * 36, a[1] + dy / norm * 36],
        end = [b[0] - dx / norm * 36, b[1] - dy / norm * 36];
      return directed ? <Arrow key={`${s}-${t}-${j}`} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} hue={paperHues[s % 6]} /> : <path key={`${s}-${t}-${j}`} d={`M${start}L${end}`} stroke="#aaa" fill="none" />;
    }))}
    {points.map(([x, y], i) => <g key={i}>
      <circle cx={x} cy={y} r={34} fill="#111" stroke={paperHues[i % 6]} />
      <Text x={x} y={y - 6} hue={paperHues[i % 6]}>
        {names?.[i] ?? 'ID' + i}
      </Text>
      <Text x={x} y={y + 15} hue={paperHues[i % 6]}>
        {short(values[i])}
      </Text>
    </g>)}
  </Drawing>;
}
