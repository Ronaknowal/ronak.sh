import { flowNumber as number } from './LessonFlow.jsx';

// Endpoint leaders identify each trace where it appears. A fixed plot domain
// supplied by the caller also makes separate recorded fits comparable.
export default function StateSpaceLinePlot({
  title,
  xLabel,
  yLabel,
  xDomain,
  yDomain,
  series,
  points = []
}) {
  const [xmin, xmax] = xDomain,
    [ymin, ymax] = yDomain;
  const x = value => 70 + 216 * (value - xmin) / (xmax - xmin);
  const y = value => 236 - 190 * (value - ymin) / (ymax - ymin);
  return <figure className="state-flow-drawing state-line-plot" data-figure="state-space-numerical-traces">
    <figcaption>{title}</figcaption>
    <svg viewBox={`0 0 360 ${326 + series.length * 38}`} role="img" aria-label={`${title}. Horizontal: ${xLabel}. Vertical: ${yLabel}. Each trace has a connected endpoint label. Equal curves retain separate labelled leaders.`}>
      <path d="M 70,46 V 236 H 286" fill="none" stroke="#898989" />
      {[0, .5, 1].map(fraction => <g key={fraction}>
        <text x={70 + 216 * fraction} y="266" textAnchor="middle" fill="#dedede" fontSize="13">{number(xmin + fraction * (xmax - xmin), 2)}</text>
        <text x="61" y={y(ymin + fraction * (ymax - ymin)) + 4} textAnchor="end" fill="#dedede" fontSize="13">{number(ymin + fraction * (ymax - ymin), 2)}</text>
      </g>)}
      {ymin < 0 && ymax > 0 && <line x1="70" x2="286" y1={y(0)} y2={y(0)} stroke="#555" strokeDasharray="3 5" />}
      {series.map((line, i) => {
        const color = line.color || '#baa1e3',
          end = line.values.at(-1),
          labelY = 315 + i * 38;
        return <g key={line.label}>
          <polyline fill="none" stroke={color} strokeWidth="2" strokeDasharray={line.dasharray ?? (line.dashed ? '5 4' : undefined)} points={line.values.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} />
          <circle cx={x(end[0])} cy={y(end[1])} r="3" fill={color} />
          <polyline points={`${x(end[0])},${y(end[1])} ${302 + 10 * i},${y(end[1])} ${302 + 10 * i},${labelY + 9} 56,${labelY + 9}`} fill="none" stroke={color} strokeDasharray={line.dasharray ?? (line.dashed ? '5 4' : undefined)} />
          <text x="56" y={labelY} fill={color} fontSize="14">{line.label}</text>
        </g>;
      })}
      {points.map((point, i) => <circle key={i} cx={x(point.x)} cy={y(point.y)} r="4" fill={point.color || '#e2b55a'}><title>{point.label}</title></circle>)}
    </svg>
    <figcaption>Horizontal: {xLabel}. Vertical: {yLabel}. {points.length > 0 && 'Amber dot: selected validation checkpoint.'}</figcaption>
  </figure>;
}
