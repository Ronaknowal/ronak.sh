import { useId } from 'react';
import { formatRec as n, itemHue } from './RecommenderFlowControls.jsx';
import './recommender-flow-drawing.css';

export const RecWire = ({ down = false }) => <span className="rec-flow-wire" aria-hidden="true">{down ? '↓' : '→'}</span>;
export const RecPort = ({ hue = 0, children }) => <span className="rec-flow-token" style={{ '--rec-hue': itemHue(hue) }}>{children}</span>;
const axisNumber = value => value !== 0 && (Math.abs(value) >= 1e5 || Math.abs(value) < 1e-4) ? value.toExponential(2) : n(value);

export function RecBars({ label, rows, identifyValues = false }) {
  const extent = Math.max(1e-12, ...rows.map(row => Math.abs(row.value)));
  const width = 800;
  const x = value => 420 + value / extent * 270;
  return <div className="rec-flow-pan" role="region" tabIndex={0} aria-label={`${label}: local scroll`}>
    <svg className="rec-flow-drawing" viewBox={`0 0 ${width} ${rows.length * 55 + 105}`} role="img" aria-label={label}>
      <text x="15" y="24">{label}; shared magnitude scale</text>
      {[-extent, 0, extent].map(value => <g key={value}><line x1={x(value)} y1="40" x2={x(value)} y2={rows.length * 55 + 50} stroke="#555" />
        <text x={x(value)} y={rows.length * 55 + 85} textAnchor="middle">{axisNumber(value)}</text></g>)}
      {rows.map((row, index) => <g key={row.id}>
        <text x="15" y={index * 55 + 72}>{row.id}</text>
        <line x1={x(0)} y1={index * 55 + 67} x2={x(row.value)} y2={index * 55 + 67} stroke={itemHue(row.hue ?? index)} strokeWidth="12" />
        <text x={x(row.value)} y={index * 55 + 55} textAnchor={identifyValues ? (row.value < 0 ? 'start' : 'end') : (row.value < 0 ? 'end' : 'start')}>
          {identifyValues ? `${row.id}: ${n(row.value)}` : n(row.value)}</text>
      </g>)}
    </svg>
  </div>;
}

export function RecPlane({ label, vectors, points = [], paths = [] }) {
  const arrow = useId().replaceAll(':', '');
  const legendPoints = points.some(point => point.legend);
  const values = [...vectors.flatMap(vector => vector.xy), ...points.flatMap(point => point.xy), ...paths.flatMap(path => path.points.flat())];
  const extent = Math.max(1, ...values.map(Math.abs)) * 1.2;
  const x = value => 400 + value / extent * 250;
  const y = value => 270 - value / extent * 200;
  return <div className="rec-flow-pan" role="region" tabIndex={0} aria-label={`${label}: local scroll`}>
    <svg className="rec-flow-drawing" viewBox={`0 0 800 ${legendPoints ? 650 : 550}`} role="img" aria-label={`${label}; actual coordinates; range ±${n(extent)}`}>
      <defs>{vectors.map((vector, index) => <marker key={index} id={`${arrow}-${index}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10" fill={itemHue(vector.hue ?? index)} /></marker>)}</defs>
      <text x="20" y="28">{label}</text>
      <line x1="120" y1={y(0)} x2="690" y2={y(0)} stroke="#aaa" /><line x1={x(0)} y1="60" x2={x(0)} y2="485" stroke="#aaa" />
      {[-extent, 0, extent].map(value => <g key={value}>
        <text x={x(value)} y={y(0) + 30} textAnchor="middle">{axisNumber(value)}</text>
        <text x={x(0) - 15} y={y(value) - 8} textAnchor="end">{axisNumber(value)}</text>
      </g>)}
      <text x="590" y="530">Factor coordinate 0</text><text x="15" y="70">Coordinate 1</text>
      {paths.map((path, index) => <polyline key={index} points={path.points.map(pair => `${x(pair[0])},${y(pair[1])}`).join(' ')}
        fill="none" stroke={itemHue(path.hue ?? index)} strokeWidth="2" strokeDasharray="5 4" />)}
      {paths.filter(path => path.level !== undefined).map((path, index) => <g key={`level-${index}`}>
        <line x1="575" y1={80 + index * 30} x2="605" y2={80 + index * 30}
          stroke={itemHue(path.hue ?? index)} strokeWidth="2" strokeDasharray="5 4" />
        <text x="615" y={86 + index * 30} fill={itemHue(path.hue ?? index)}>Level +{n(path.level)}</text>
      </g>)}
      {vectors.map((vector, index) => <g key={vector.id}>
        <line x1={x(0)} y1={y(0)} x2={x(vector.xy[0])} y2={y(vector.xy[1] ?? 0)} stroke={itemHue(vector.hue ?? index)} strokeWidth="3"
          strokeDasharray={vector.dashed ? '7 5' : undefined} markerEnd={vector.xy.some(value => value !== 0) ? `url(#${arrow}-${index})` : undefined} />
        <text x={x(vector.xy[0]) + 12} y={y(vector.xy[1] ?? 0) + (index % 4 - 1.5) * 30} fill={itemHue(vector.hue ?? index)}>{vector.id}</text>
      </g>)}
      {points.map((point, index) => <g key={point.id}><circle cx={x(point.xy[0])} cy={y(point.xy[1])} r="5" fill={itemHue(point.hue ?? index)} />
        {point.legend ? <g>
          <circle cx="35" cy={575 + index * 30} r="5" fill={itemHue(point.hue ?? index)} />
          <text x="50" y={581 + index * 30}>{point.id}: ({point.xy.map(n).join(', ')})</text>
        </g> : <text x={x(point.xy[0]) + (point.labelOffset?.[0] ?? 12)} y={y(point.xy[1]) + (point.labelOffset?.[1] ?? -12)}
          textAnchor={point.anchor ?? 'start'}>{point.id}</text>}</g>)}
    </svg>
  </div>;
}

export function RecCurve({ label, points, xLabel, yLabel, selected, extra = [] }) {
  const all = [...points, ...extra, ...(selected ? [selected] : [])];
  const xMin = Math.min(...all.map(point => point[0]));
  const xMax = Math.max(xMin + 1, ...all.map(point => point[0]));
  const yMin = Math.min(0, ...all.map(point => point[1]));
  const yMax = Math.max(yMin + 1, ...all.map(point => point[1]));
  const x = value => 100 + (value - xMin) / (xMax - xMin) * 620;
  const y = value => 440 - (value - yMin) / (yMax - yMin) * 370;
  return <div className="rec-flow-pan" role="region" tabIndex={0} aria-label={`${label}: local scroll`}>
    <svg className="rec-flow-drawing" viewBox="0 0 800 550" role="img" aria-label={label}>
      <text x="20" y="28">{label}</text><line x1="100" y1="440" x2="730" y2="440" stroke="#aaa" /><line x1="100" y1="60" x2="100" y2="440" stroke="#aaa" />
      {Array.from({ length: 5 }, (_, index) => index / 4).map(fraction => <g key={fraction}>
        <text x={x(xMin + fraction * (xMax - xMin))} y="475" textAnchor="middle">{axisNumber(xMin + fraction * (xMax - xMin))}</text>
        <text x="85" y={y(yMin + fraction * (yMax - yMin)) + 6} textAnchor="end">{axisNumber(yMin + fraction * (yMax - yMin))}</text>
      </g>)}
      <text x="350" y="530">{xLabel}</text><text x="15" y="55">{yLabel}</text>
      <polyline points={points.map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill="none" stroke={itemHue(0)} strokeWidth="3" />
      {points.length <= 16 && points.map((point, index) => <circle key={index} cx={x(point[0])} cy={y(point[1])} r="4" fill={itemHue(0)} />)}
      {extra.map((point, index) => <g key={index}><circle cx={x(point[0])} cy={y(point[1])} r="6" fill={itemHue(1)} /><text x="720" y={y(point[1]) - 12} textAnchor="end">Minimum ({axisNumber(point[0])}, {axisNumber(point[1])})</text></g>)}
      {selected && <g><circle cx={x(selected[0])} cy={y(selected[1])} r="7" fill="none" stroke={itemHue(2)} strokeWidth="3" /><text x="720" y={y(selected[1]) + 28} textAnchor="end">Selected ({axisNumber(selected[0])}, {axisNumber(selected[1])})</text></g>}
    </svg>
  </div>;
}
