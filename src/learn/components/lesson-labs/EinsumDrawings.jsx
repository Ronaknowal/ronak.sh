import { useId } from 'react';
import { einsumNumber } from '../../data/einsum-models.js';
import './einsum-flow.css';
export const f = einsumNumber;
export const sum = values => values.reduce((a, b) => a + b, 0);
export const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
export const transpose = A => A[0].map((_, j) => A.map(row => row[j]));
export const mm = (A, B) => A.map(row => transpose(B).map(col => dot(row, col)));
export const mv = (A, v) => A.map(row => dot(row, v));
export const pair = v => '[' + v.map(f).join(', ') + ']';
export const X = Array.from({
  length: 2
}, (_, b) => Array.from({
  length: 3
}, (_, n) => Array.from({
  length: 4
}, (_, d) => 12 * b + 4 * n + d)));
export const W = [[1, 0], [0, 1], [1, -1], [2, 0]];
export const transformX = X.map(slab => slab.map(row => transpose(W).map(col => dot(row, col))));
export function Figure({
  name,
  caption,
  children
}) {
  return <figure className="ef-figure" data-ef-figure={name}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Panels({
  children
}) {
  return <div className="ef-panels">{children}</div>;
}
export function Panel({
  title,
  children
}) {
  return <div className="ef-panel"><p className="ef-panel-label">{title}</p>{children}</div>;
}
export function Scene({
  label,
  description,
  width = 360,
  height = 280,
  children
}) {
  const id = useId();
  return <div className="ef-scene-scroll" role="region" aria-label={label + '; drawing scroll region'} tabIndex={0}>
    <svg className="ef-scene" style={{
      '--ef-scene-width': width
    }} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
      <title id={id}>{label}</title>{description && <desc>{description}</desc>}{children}
    </svg>
  </div>;
}
export function Arrow({
  from,
  to,
  kind = 'left',
  dashed = false
}) {
  const [x, y] = to,
    dx = x - from[0],
    dy = y - from[1],
    length = Math.hypot(dx, dy),
    ux = length ? dx / length : 0,
    uy = length ? dy / length : 0;
  return <g className={'ef-arrow ' + kind + (dashed ? ' dashed' : '')}><line x1={from[0]} y1={from[1]} x2={x} y2={y} />{length > 1 && <path d={`M${x - 8 * ux + 4 * uy},${y - 8 * uy - 4 * ux} L${x},${y} L${x - 8 * ux - 4 * uy},${y - 8 * uy + 4 * ux}`} />}</g>;
}
export function Matrix({
  values,
  label,
  rowLabels,
  columnLabels,
  selected = [],
  kind = 'left',
  cellWidth = 65
}) {
  const rows = Array.isArray(values[0]) ? values : [values],
    cols = rows[0].length;
  const valueWidth = Math.max(...rows.flat().map(value => String(typeof value === 'number' ? f(value) : value).length * 9 + 16));
  cellWidth = Math.max(cellWidth, valueWidth);
  const margin = rowLabels ? Math.max(50, ...rowLabels.map(x => String(x).length * 8 + 20)) : 50;
  const width = Math.max(230, cols * cellWidth + margin + 20),
    height = rows.length * 48 + 68;
  return <Panel title={label}><Scene label={`${label}; ${rows.length} rows, ${cols} columns`} width={width} height={height}>
    {Array.from({
        length: cols
      }, (_, j) => <text key={j} x={margin + (j + .5) * cellWidth} y={20} textAnchor="middle">{columnLabels?.[j] ?? j}</text>)}
    {rows.map((row, i) => <g key={i}><text x={margin - 14} y={57 + 48 * i} textAnchor="end">{rowLabels?.[i] ?? i}</text>{row.map((value, j) => {
          const active = selected.some(([r, c]) => r === i && c === j);
          return <g key={j} className={'ef-cell ' + kind + (active ? ' selected' : '')} data-address={`${i},${j}`}><rect x={margin + j * cellWidth} y={29 + 48 * i} width={cellWidth - 3} height={44} /><text x={margin + (j + .5) * cellWidth - 2} y={57 + 48 * i} textAnchor="middle">{typeof value === 'number' ? f(value) : value}</text></g>;
        })}</g>)}
  </Scene></Panel>;
}
export function TensorSlabs({
  values = X,
  label = 'X[b,n,d]',
  selected = [1, 0, 2],
  axes = ['b', 'n', 'd']
}) {
  return <div className="ef-slabs"><p className="ef-panel-label">{label}; successive {axes[0]} slices</p><Panels>{values.map((slab, b) => <Matrix key={b} values={slab} label={`${axes[0]}=${b}; rows ${axes[1]}, columns ${axes[2]}`} kind={b ? 'right' : 'left'} selected={selected[0] === b ? [[selected[1], selected[2]]] : []} />)}</Panels></div>;
}
export function NumericTable({
  label,
  headers,
  rows,
  tall = false
}) {
  return <div className="ef-table-owner"><p>{label}{tall ? ' — scroll through every recorded row.' : ''}</p><div className={'ef-table-scroll' + (tall ? ' ef-table-tall' : '')} role="region" aria-label={label} tabIndex={0}><table><thead><tr>{headers.map((x, i) => <th scope="col" key={i}>{x}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j}>{typeof x === 'number' ? f(x) : x}</td>)}</tr>)}</tbody></table></div></div>;
}
export function ProductJoin({
  terms,
  label,
  result = sum(terms.map(t => t.product)),
  sumLabel = 'sum',
  names
}) {
  // Keep each complete displayed token inside its node, then reserve clear edges.
  // Nine user units per character bounds the topic's 14px numeric SVG font.
  const radius = (values, minimum) => Math.max(minimum, ...values.map(value => f(value).length * 4.5 + 8));
  const ra = radius(terms.map(t => t.a), 22), rb = radius(terms.map(t => t.b), 22);
  const rp = radius(terms.map(t => t.product), 24), rs = radius([result], 29);
  const largest = Math.max(ra, rb, rp);
  const rowHeight = largest > 24 ? Math.max(80, 2 * largest + 36) : 80;
  const cy = largest > 24 ? largest + 27 : 45;
  const xa = 38 + ra, xb = xa + ra + 48 + rb;
  const xp = xb + rb + 85 + rp, xs = xp + rp + 16 + rs;
  const height = terms.length * rowHeight + 84 + 2 * Math.max(0, rs - 29);
  const sumY = height - Math.max(40, rs + 11), width = xs + rs + 19;
  return <div><Scene label={label} width={width} height={height}>{terms.map((term, i) => <g key={i}>
    <text x={12} y={19 + i * rowHeight}>{names?.[i] ?? term.name ?? `choice ${i}`}</text>
    <circle className="ef-node left" cx={xa} cy={cy + i * rowHeight} r={ra} /><text x={xa} y={cy + 5 + i * rowHeight} textAnchor="middle">{f(term.a)}</text>
    <text x={(xa + ra + xb - rb) / 2 - 1} y={cy + 5 + i * rowHeight}>×</text><circle className="ef-node right" cx={xb} cy={cy + i * rowHeight} r={rb} /><text x={xb} y={cy + 5 + i * rowHeight} textAnchor="middle">{f(term.b)}</text>
    <Arrow from={[xb + rb + 4, cy + i * rowHeight]} to={[xp - rp - 4, cy + i * rowHeight]} kind="right" /><circle className="ef-node result" cx={xp} cy={cy + i * rowHeight} r={rp} /><text x={xp} y={cy + 5 + i * rowHeight} textAnchor="middle">{f(term.product)}</text>
    <line className="ef-reference" x1={xp + rp + 3} y1={cy + i * rowHeight} x2={xs} y2={sumY - 10} />
  </g>)}<circle className="ef-node result" cx={xs} cy={sumY} r={rs} /><text x={xs} y={sumY + 5} textAnchor="middle">{f(result)}</text><text x={xp - 23} y={height - 15}>Σ products</text></Scene><p className="ef-readout">{sumLabel}: {f(result)}</p></div>;
}
export function ContractionDrawing({
  state,
  operands,
  cellIndex = 0,
  label = 'Addressed products'
}) {
  const cell = state.cells[Math.min(cellIndex, state.cells.length - 1)];
  return <div><Panels>{operands.map((operand, i) => {
        const shape = state.shapes[i],
          selected = cell.terms.map(term => term.sources[i].coordinates);
        if (shape.length <= 2) return <Matrix key={i} label={`Operand ${i}: axes ${state.inputs[i]}, shape ${pair(shape)}`} values={operand} kind={i ? 'right' : 'left'} selected={shape.length === 1 ? selected.map(c => [0, c[0]]) : selected} />;
        return <NumericTable key={i} label={`Operand ${i}: selected source addresses`} headers={['Address', 'Value']} rows={cell.terms.map(t => [pair(t.sources[i].coordinates), t.sources[i].value])} />;
      })}</Panels><ProductJoin label={label + '; output ' + pair(cell.coordinates)} terms={cell.terms.map(t => ({
      a: t.sources[0].value,
      b: t.sources[1]?.value ?? 1,
      product: t.product,
      name: Object.entries(t.indices).map(([k, v]) => k + '=' + v).join(', ')
    }))} result={cell.value} sumLabel={`output ${pair(cell.coordinates)}`} />
    <NumericTable label={`Complete output: axes ${state.output || 'none (scalar)'}, shape ${pair(state.outputShape)}`} headers={['Output address', 'Value']} rows={state.cells.map(c => [pair(c.coordinates), c.value])} />
  </div>;
}
export function Plane({
  label,
  domain = [-4.5, 4.5],
  vectors = [],
  points = [],
  curves = [],
  lines = [],
  xLabel = 'physical x',
  yLabel = 'physical y'
}) {
  const low = typeof domain[0] === 'number' ? domain : domain[0],
    high = typeof domain[0] === 'number' ? domain : domain[1];
  const xDomain = typeof domain[0] === 'number' ? domain : low,
    yDomain = typeof domain[0] === 'number' ? domain : high;
  const scale = 260 / Math.max(xDomain[1] - xDomain[0], yDomain[1] - yDomain[0]);
  const plotWidth = scale * (xDomain[1] - xDomain[0]),
    plotHeight = scale * (yDomain[1] - yDomain[0]),
    base = 30 + plotHeight;
  const px = x => 60 + scale * (x - xDomain[0]),
    py = y => base - scale * (y - yDomain[0]);
  const path = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x)},${py(y)}`).join(' ');
  return <div><Scene label={label} width={390} height={base + 62}><text x={60} y={17}>{yLabel}</text>
    {[0, .5, 1].map(t => {
        const x = xDomain[0] + t * (xDomain[1] - xDomain[0]),
          y = yDomain[0] + t * (yDomain[1] - yDomain[0]);
        return <g key={t} className="ef-grid"><line x1={px(x)} x2={px(x)} y1={30} y2={base} /><line x1={60} x2={60 + plotWidth} y1={py(y)} y2={py(y)} /><text x={px(x)} y={base + 20} textAnchor="middle">{f(x)}</text><text x={50} y={py(y) + 5} textAnchor="end">{f(y)}</text></g>;
      })}
    {xDomain[0] <= 0 && xDomain[1] >= 0 && <line className="ef-axis" x1={px(0)} x2={px(0)} y1={30} y2={base} />}{yDomain[0] <= 0 && yDomain[1] >= 0 && <line className="ef-axis" x1={60} x2={60 + plotWidth} y1={py(0)} y2={py(0)} />}
    {lines.map((line, i) => <g key={i} className="ef-level"><path d={path(line.points)} />{line.label && <text x={line.slot?.[0] ?? 325} y={line.slot?.[1] ?? 45 + i * 25}>{line.label}</text>}</g>)}
    {curves.map((curve, i) => <path key={i} className={'ef-curve ' + (curve.kind || 'left')} d={path(curve.points)} />)}
    {vectors.map((v, i) => <g key={i}><Arrow from={(v.from || [0, 0]).map((x, j) => j ? py(x) : px(x))} to={v.to.map((x, j) => j ? py(x) : px(x))} kind={v.kind || 'left'} dashed={v.dashed} /><title>{v.label || 'vector ' + i}</title></g>)}
    {points.map((p, i) => <g key={i} className={p.kind || 'left'}><circle className={'ef-point' + (p.selected ? ' selected' : '')} cx={px(p.value[0])} cy={py(p.value[1])} r={p.selected ? 5 : 2.7} />{p.label && <text className="ef-geometry-label" x={p.slot?.[0] ?? px(p.value[0]) + 8} y={p.slot?.[1] ?? py(p.value[1]) - 10}>{p.label}</text>}</g>)}<text x={60 + plotWidth / 2} y={base + 44} textAnchor="middle">{xLabel}</text>
  </Scene>{vectors.some(v => v.label) && <div className="ef-vector-legend">{vectors.filter(v => v.label).map((v, i) => <p key={i} className={'ef-vector-key ' + (v.kind || 'left') + (v.dashed ? ' dashed' : '')}>{v.label}</p>)}</div>}</div>;
}
export function SignedAreas({
  terms,
  divisor = 1,
  label,
  axisLabels = ['offset i', 'offset j']
}) {
  return <Panels>{terms.map(([a, b], i) => <Panel key={i} title={`row ${i}: ${f(a)}×${f(b)}=${f(a * b)}`}><Scene label={`${label}; row ${i} signed offset product`} width={240} height={230}>
    <path className="ef-axis" d="M30,185 H205 M45,200 V20" />
    <rect className={'ef-area ' + (a * b < 0 ? 'negative' : 'left')} x={45} y={185 - Math.abs(b) * 35} width={Math.abs(a) * 35} height={Math.abs(b) * 35} />
    <text x={55} y={220}>{axisLabels[0]}: {f(a)}</text><text x={55} y={15}>{axisLabels[1]}: {f(b)}</text>
    <text x={55} y={52}>{a * b < 0 ? '− area' : '+ area'} {f(Math.abs(a * b))}</text>
  </Scene></Panel>)}</Panels>;
}
export function DimensionGrid({
  label,
  rows,
  columns,
  kind = 'left'
}) {
  const nr = Math.min(rows, 4),
    nc = Math.min(columns, 4);
  return <Panel title={`${label}: ${rows}×${columns}`}><Scene label={`${label}; representative grid, ${rows} rows by ${columns} columns`} width={280} height={240}>{Array.from({
        length: nr
      }, (_, i) => Array.from({
        length: nc
      }, (_, j) => <rect key={`${i},${j}`} className={'ef-dimension-cell ' + kind} x={35 + j * 52} y={24 + i * 42} width={47} height={36} />))}{rows > nr && <text x={20} y={200}>⋮</text>}{columns > nc && <text x={255} y={100}>…</text>}<text x={25} y={227}>Representative cells; exact shape above.</text></Scene></Panel>;
}
export function OrderTree({
  dimensions,
  first = 'left',
  counts
}) {
  const [a, b, c, d] = dimensions,
    leftFirst = first === 'left',
    temp = leftFirst ? [a, c] : [b, d];
  return <Panel title={leftFirst ? '(AB)C' : 'A(BC)'}><Scene label={`${leftFirst ? 'Left' : 'Right'} first contraction tree`} width={400} height={300}>
    {['A', 'B', 'C'].map((name, i) => <g key={name}><rect className={'ef-tree-matrix ' + (i === 1 ? 'right' : 'left')} x={15 + 132 * i} y={22} width={102} height={60} /><text x={66 + 132 * i} y={45} textAnchor="middle">{name}</text><text x={66 + 132 * i} y={66} textAnchor="middle">{[[a, b], [b, c], [c, d]][i].join('×')}</text></g>)}
    <Arrow from={[leftFirst ? 66 : 198, 84]} to={[200, 138]} /><Arrow from={[leftFirst ? 198 : 330, 84]} to={[200, 138]} kind="right" />
    <rect className="ef-tree-matrix result" x={143} y={140} width={114} height={64} /><text x={200} y={164} textAnchor="middle">{leftFirst ? 'AB' : 'BC'}</text><text x={200} y={187} textAnchor="middle">{temp.join('×')}</text>
    <Arrow from={[leftFirst ? 330 : 66, 84]} to={[200, 237]} kind="right" /><Arrow from={[200, 206]} to={[200, 237]} /><circle className="ef-node result" cx={200} cy={263} r={27} /><text x={200} y={269} textAnchor="middle">{a}×{d}</text>
  </Scene><NumericTable label="Dense multiplication count and first temporary" headers={['First work', 'Last work', 'Total', 'Temporary entries']} rows={[[counts.firstCost, counts.lastCost, counts.total, counts.firstSize]]} /></Panel>;
}
