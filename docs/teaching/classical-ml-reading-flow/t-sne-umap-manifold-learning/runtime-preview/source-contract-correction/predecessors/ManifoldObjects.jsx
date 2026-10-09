import React, { useId } from 'react';
import { hues, number } from './ManifoldDrawing.jsx';
export function DimensionedArray({
  name,
  rows,
  columns,
  entries,
  caption
}) {
  const displayedRows = Math.min(rows, 4),
    displayedColumns = Math.min(columns, 4);
  const width = 280 / displayedColumns,
    height = 160 / displayedRows;
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 260" role="img" aria-label={`${name}: ${rows} rows by ${columns} columns. ${caption}`}>
    <text x="180" y="22" textAnchor="middle">{name}</text>
    {Array.from({
        length: displayedRows
      }, (_, i) => Array.from({
        length: displayedColumns
      }, (_, j) => <g key={`${i}-${j}`}>
      <rect x={40 + width * j} y={45 + height * i} width={width} height={height} fill="none" stroke="#767982" />
      <text x={40 + width * (j + .5)} y={45 + height * (i + .6)} textAnchor="middle">{entries?.[i]?.[j] ?? (i === displayedRows - 1 && rows > 4 ? '⋮' : j === displayedColumns - 1 && columns > 4 ? '…' : '·')}</text>
    </g>))}
    <path d="M32 45 h-8 v160 h8 M328 45 h8 v160 h-8" fill="none" stroke={hues[0]} strokeWidth="2" />
    <text x="180" y="235" textAnchor="middle">{rows} rows × {columns} columns</text>
  </svg>
  <p>{caption} Extents are schematic; the dimensions are exact.</p>
</div>;
}
export function DirectedLine({
  values,
  labels,
  targets,
  caption
}) {
  const marker = useId().replaceAll(':', '');
  const min = Math.min(...values) - .5,
    max = Math.max(...values) + .5;
  const x = value => 45 + 270 * (value - min) / (max - min);
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 290" role="img" aria-label={caption}>
    <defs>
      <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker>
    </defs>
    <line x1="35" x2="325" y1="225" y2="225" stroke="#8a8e96" />
    {targets.map((j, i) => {
        const lane = 30 + 40 * i;
        return <g key={i}>
      <path d={`M${x(values[i])} 225 V${lane} M${x(values[j])} 225 V${lane}`} stroke={hues[i]} strokeDasharray="2 4" fill="none" opacity=".5" />
      <line x1={x(values[i])} x2={x(values[j])} y1={lane} y2={lane} stroke={hues[i]} strokeWidth="2" markerEnd={`url(#${marker})`} />
      <text x="20" y={lane - 9} fill={hues[i]}>{labels[i]}→{labels[j]}</text>
    </g>;
      })}
    {values.map((v, i) => <g key={i}>
      <circle cx={x(v)} cy="225" r="5" fill={hues[i]} />
      <text x={x(v)} y={i % 2 ? 275 : 250} textAnchor="middle" fill={hues[i]}>{labels[i]} {number(v)}</text>
    </g>)}
  </svg>
  <p>{caption} Arrow lanes keep their endpoints at the true horizontal coordinates; dashed stems only separate annotations.</p>
</div>;
}
export function RankLadders() {
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 260" role="img" aria-label="Query A input ladder B,C,D and map ladder C,B,D; crossed rank1 membership gives one penalty each">
    <text x="85" y="22" textAnchor="middle">Input rank</text>
    <text x="275" y="22" textAnchor="middle">Map rank</text>
    <path d="M55 50 V220 M115 50 V220 M245 50 V220 M305 50 V220" stroke="#838892" fill="none" />
    {['B', 'C', 'D'].map((id, i) => <g key={id}>
      <line x1="55" x2="115" y1={65 + i * 65} y2={65 + i * 65} stroke={hues[i + 1]} />
      <text x="42" y={70 + i * 65} textAnchor="end">{i + 1}</text>
      <text x="85" y={55 + i * 65} textAnchor="middle" fill={hues[i + 1]}>{id}</text>
    </g>)}
    {['C', 'B', 'D'].map((id, i) => <g key={id}>
      <line x1="245" x2="305" y1={65 + i * 65} y2={65 + i * 65} stroke={hues[['A', 'B', 'C', 'D'].indexOf(id)]} />
      <text x="320" y={70 + i * 65}>{i + 1}</text>
      <text x="275" y={55 + i * 65} textAnchor="middle">{id}</text>
    </g>)}
    <path d="M120 130 L240 65" stroke={hues[2]} strokeWidth="2" fill="none" />
    <path d="M120 65 L240 130" stroke={hues[1]} strokeDasharray="5 3" fill="none" />
    <text x="180" y="239" textAnchor="middle">rank2−k1 =1 per error</text>
  </svg>
  <p>Solid C correspondence is an intrusion into map rank1. Dashed B correspondence is the lost input rank1 neighbor.</p>
</div>;
}
export function IdentityRulers({ input, mapped, labels }) {
  const maximum = Math.max(...input, ...mapped);
  const x = value => 45 + 270 * value / maximum;
  return <div className="manifold-scene">
    <svg viewBox="0 0 360 260" role="img" aria-label="Same A,B,C,D IDs joined from input to map coordinates on a common horizontal ruler">
      <text x="180" y="22" textAnchor="middle">Same IDs across states</text>
      <line x1="35" x2="325" y1="70" y2="70" stroke="#838892" />
      <line x1="35" x2="325" y1="205" y2="205" stroke="#838892" />
      {input.map((value, i) => <g key={labels[i]}>
        <line x1={x(value)} x2={x(mapped[i])} y1="70" y2="205" stroke={hues[i]} strokeWidth="1.5" opacity=".7" />
        <circle cx={x(value)} cy="70" r="5" fill={hues[i]} />
        <circle cx={x(mapped[i])} cy="205" r="5" fill={hues[i]} />
        <text x={x(value)} y={i % 2 ? 52 : 35} textAnchor="middle" fill={hues[i]}>{labels[i]} {number(value)}</text>
        <text x={x(mapped[i])} y={i % 2 ? 248 : 230} textAnchor="middle" fill={hues[i]}>{labels[i]} {number(mapped[i])}</text>
      </g>)}
    </svg>
    <p>Top: input; bottom: map. Colored correspondences join identity, not graph edges. Both rulers use the same horizontal unit.</p>
  </div>;
}
export function DistanceBracket({ x, y, from, to, label, color = hues[0], offset = 18 }) {
  const a = [x(from[0]), y(from[1])], b = [x(to[0]), y(to[1])];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const normal = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
  const p = [a[0] + offset * normal[0], a[1] + offset * normal[1]];
  const q = [b[0] + offset * normal[0], b[1] + offset * normal[1]];
  return <g>
    <path d={`M${p[0]} ${p[1]} L${q[0]} ${q[1]} M${p[0]-4*normal[0]} ${p[1]-4*normal[1]} L${p[0]+4*normal[0]} ${p[1]+4*normal[1]} M${q[0]-4*normal[0]} ${q[1]-4*normal[1]} L${q[0]+4*normal[0]} ${q[1]+4*normal[1]}`} stroke={color} fill="none" />
    <text x={(p[0]+q[0])/2+10*normal[0]} y={(p[1]+q[1])/2+10*normal[1]} textAnchor="middle" fill={color}>{label}</text>
  </g>;
}
export function EncoderLayers() {
  const input = Array.from({
    length: 64
  }, (_, i) => [20 + i % 8 * 13, 50 + Math.floor(i / 8) * 18]);
  const hidden = Array.from({
    length: 16
  }, (_, i) => [185 + i % 4 * 15, 78 + Math.floor(i / 4) * 25]);
  const output = [[310, 105], [310, 145]];
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 250" role="img" aria-label="Schematic encoder64 input coordinates,16 hidden units,two output coordinates with learned weight connections">
    {hidden.map((p, i) => <line key={i} x1={input[i * 4][0]} y1={input[i * 4][1]} x2={p[0]} y2={p[1]} stroke="#555b66" />)}
    {hidden.flatMap((p, i) => output.map((q, j) => <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#555b66" />))}
    {input.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={hues[1]} />)}
    {hidden.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={hues[3]} />)}
    {output.map(([x, y], i) => <g key={i}>
      <circle cx={x} cy={y} r="7" fill={hues[2]} />
      <text x={x + 13} y={y + 5}>y{i + 1}</text>
    </g>)}
    <text x="66" y="220" textAnchor="middle">64 inputs</text>
    <text x="207" y="220" textAnchor="middle">16 hidden</text>
    <text x="310" y="220" textAnchor="middle">q2</text>
  </svg>
  <p>Schematic learned function: input64 → weight matrix64×16 → hidden16 → weight matrix16×2 → output2. Representative connections are drawn; these are declared widths, not a retained trained model.</p>
</div>;
}
export function LengthResidual({
  supplied = 2,
  mapped = 1.5
}) {
  const x = v => 45 + 120 * v;
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 230" role="img" aria-label="Declared target length2 compared with mapped length1.5; residual minus.5 squared equals.25">
    <line x1={x(0)} x2={x(supplied)} y1="60" y2="60" stroke={hues[1]} strokeWidth="3" />
    <line x1={x(0)} x2={x(mapped)} y1="130" y2="130" stroke={hues[2]} strokeWidth="3" />
    {[0, supplied].map((v, i) => <circle key={i} cx={x(v)} cy="60" r="5" fill={hues[1]} />)}
    {[0, mapped].map((v, i) => <circle key={i} cx={x(v)} cy="130" r="5" fill={hues[2]} />)}
    <path d={`M${x(mapped)} 155 V175 H${x(supplied)} V155`} fill="none" stroke={hues[0]} strokeWidth="2" />
    <text x="45" y="40">supplied d_AB=2</text>
    <text x="45" y="110">mapped r_AB=1.5</text>
    <text x="180" y="213" textAnchor="middle">r−d=−.5; square .25</text>
  </svg>
  <p>Constructed length-residual example on one common coordinate ruler. Squaring the distances before subtraction would be a different objective.</p>
</div>;
}
export function FilledTetrahedron() {
  const points = [[65, 190], [285, 190], [180, 80], [150, 25]];
  const faces = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
  const labels = ['A(0,0,0)', 'B(1,0,0)', 'C(0,1,0)', 'D(0,0,1)'];
  return <div className="manifold-scene">
  <svg viewBox="0 0 360 270" role="img" aria-label="Abstract3-simplex with four filled triangular faces and vertices A,B,C,D in declared schematic3D coordinates">
    {faces.map((face, i) => <polygon key={i} points={face.map(j => points[j].join(',')).join(' ')} fill={hues[i + 1]} fillOpacity=".16" stroke={hues[i + 1]} strokeWidth="1.5" />)}
    {points.map(([x, y], i) => <g key={i}>
      <circle cx={x} cy={y} r="5" fill={hues[i]} />
      <text x={x} y={i === 3 ? y - 10 : y + 25} textAnchor="middle">{['A', 'B', 'C', 'D'][i]}</text>
    </g>)}
    <text x="180" y="253" textAnchor="middle">ABC,ABD,ACD,BCD all filled</text>
  </svg>
  <p>Abstract simplex display: {labels.join('; ')}. These display coordinates place the filled tetrahedron for inspection; they are separate from the original unit-square input coordinates.</p>
</div>;
}
