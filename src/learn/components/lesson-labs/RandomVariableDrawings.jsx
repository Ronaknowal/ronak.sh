import { useId } from 'react';
import { curveSamples, cdfAt, pairedContributions, conditionalRow, covarianceMatrix, conditionalGeometry } from '../../data/random-variable-visual-models.js';
import './random-variable-flow.css';
export function fmt(value, digits = 4) {
  if (value === null) return 'undefined';
  if (value === 0) return '0';
  return Math.abs(value) >= 1e5 || Math.abs(value) < 1e-4 ? value.toExponential(3) : Number(value.toFixed(digits)).toString();
}
export function Figure({
  job,
  children,
  caption,
  controls
}) {
  return <figure className="rv-figure" data-rv-job={job}>{children}{controls}<figcaption>{caption}</figcaption></figure>;
}
export function Compare({
  children
}) {
  return <div className="rv-compare">{children}</div>;
}
export function Values({
  children
}) {
  return <div className="rv-values">{children}</div>;
}
export function Table({
  label,
  headers,
  rows
}) {
  return <div className="rv-scroll" tabIndex={0} role="region" aria-label={`${label}; use arrow keys to scroll`}><table><caption>{label}</caption><thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div>;
}
export function Scene({
  label,
  height = 300,
  children
}) {
  const id = useId();
  return <svg className="rv-scene" viewBox={`0 0 340 ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>;
}
export function Label({
  x,
  y,
  children,
  anchor = 'middle',
  tone = ''
}) {
  return <text x={x} y={y} textAnchor={anchor} className={`rv-label ${tone ? `rv-${tone}` : ''}`}>{children}</text>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  tone = 'gold'
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 1e-8) return <circle cx={x1} cy={y1} r={3} className={`rv-dot rv-${tone}`} />;
  const ux = (x2 - x1) / length,
    uy = (y2 - y1) / length,
    a = 7;
  return <g className={`rv-arrow rv-${tone}`}><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${x2 - a * ux + a * .5 * uy},${y2 - a * uy - a * .5 * ux}L${x2},${y2}L${x2 - a * ux - a * .5 * uy},${y2 - a * uy + a * .5 * ux}`} /></g>;
}
export function Plane({
  label,
  xRange = [-2, 2],
  yRange = [0, 1],
  xLabel = 'value',
  yLabel = 'probability',
  xTicks,
  yTicks,
  equalScale = false,
  curves = [],
  children
}) {
  const id = useId().replaceAll(':', '');
  const left = 58, top = 48;
  const unit = Math.min(250 / (xRange[1]-xRange[0]),190 / (yRange[1]-yRange[0]));
  const right = equalScale ? left + unit * (xRange[1]-xRange[0]) : 308;
  const bottom = equalScale ? top + unit * (yRange[1]-yRange[0]) : 238;
  const X = x => left + (x - xRange[0]) / (xRange[1] - xRange[0]) * (right - left);
  const Y = y => bottom - (y - yRange[0]) / (yRange[1] - yRange[0]) * (bottom - top);
  const xt = xTicks || [xRange[0], (xRange[0] + xRange[1]) / 2, xRange[1]],
    yt = yTicks || [yRange[0], (yRange[0] + yRange[1]) / 2, yRange[1]];
  return <Scene label={label}><defs><clipPath id={id}><rect x={left - 6} y={top - 6} width={right - left + 12} height={bottom - top + 12} /></clipPath></defs><Label x={left} y={24} anchor="start">{yLabel}</Label>{yt.map(v => <g key={v}><line x1={left} x2={right} y1={Y(v)} y2={Y(v)} className="rv-grid" /><Label x={left - 8} y={Y(v) + 5} anchor="end">{fmt(v, 3)}</Label></g>)}{xt.map((v, i) => <g key={v}><line x1={X(v)} x2={X(v)} y1={top} y2={bottom} className="rv-grid" /><Label x={X(v)} y={260} anchor={i === 0 ? 'start' : i === xt.length - 1 ? 'end' : 'middle'}>{fmt(v, 3)}</Label></g>)}<path d={`M${left},${top}V${bottom}H${right}`} className="rv-axis" /><Label x={(left + right) / 2} y={290}>{xLabel}</Label><g clipPath={`url(#${id})`}>{yRange[0] < 0 && yRange[1] > 0 && <line x1={left} x2={right} y1={Y(0)} y2={Y(0)} className="rv-reference" />}{curves.map((curve, i) => <polyline key={i} points={(curve.points || curveSamples(curve.fn, ...(curve.range || xRange), 160, curve.logarithmic)).map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} className={`rv-line rv-${curve.tone || 'gold'}`} />)}{children?.({
        X,
        Y,
        left,
        right,
        top,
        bottom
      })}</g></Scene>;
}
export function Point({
  x,
  y,
  X,
  Y,
  tone = 'gold',
  open = false,
  radius = 4,
  selected = false
}) {
  return <circle cx={X(x)} cy={Y(y)} r={radius} className={`rv-dot rv-${tone} ${open ? 'open' : ''} ${selected ? 'rv-selected' : ''}`} />;
}
export function MappingDrawing({
  rows,
  selected = null,
  threshold = null,
  label = 'Outcomes carry their probability into values'
}) {
  const height = rows.length * 66 + 65;
  return <><Scene label={label} height={height}><Label x={43} y={25}>outcome</Label><Label x={163} y={25}>probability</Label><Label x={298} y={25}>value</Label>{rows.map((row, i) => {
        const y = 65 + i * 66,
          tone = threshold !== null && row.value > threshold ? 'blue' : 'gold';
        return <g key={row.label}><circle cx={43} cy={y} r={23} className={`rv-area rv-${tone} ${selected === row.label ? 'rv-selected' : ''}`} /><Label x={43} y={y + 5}>{row.label}</Label><Arrow x1={68} y1={y} x2={265} y2={y} tone={tone} /><Label x={166} y={y - 10}>{fmt(row.mass)}</Label><Label x={293} y={y + 5}>{row.value}</Label></g>;
      })}</Scene>{selected && <p>The white ring selects the single realization {selected}; all four probability routes remain present.</p>}</>;
}
export function LawDrawing({
  law,
  range = [-.5, 2.5],
  threshold = null,
  tone = 'gold',
  label = 'Point masses on a common probability axis',
  xLabel = 'numerical value',
  ticks = [0, 1, 2]
}) {
  return <Plane label={label} xRange={range} yRange={[0, 1]} xTicks={ticks} xLabel={xLabel}>{({
      X,
      Y,
      top,
      bottom
    }) => <>{threshold !== null && <line x1={X(threshold)} x2={X(threshold)} y1={top} y2={bottom} className="rv-reference" />}{law.map((row, i) => <g key={i} className={`rv-${tone}`}><line x1={X(row.value)} x2={X(row.value)} y1={Y(0)} y2={Y(row.mass)} className="rv-line" /><Point x={row.value} y={row.mass} X={X} Y={Y} tone={tone} open={row.mass === 0} /></g>)}</>}</Plane>;
}
export function CdfDrawing({
  law,
  threshold = 1
}) {
  const cuts = [-.5, ...law.map(row => row.value), 2.5];
  return <Plane label={`Right-continuous cumulative probability; F(${threshold})=${fmt(cdfAt(law, threshold))}`} xRange={[-.5, 2.5]} yRange={[0, 1]} xTicks={[0, 1, 2]} xLabel="threshold t" yLabel="F(t)">{({
      X,
      Y,
      top,
      bottom
    }) => <><line x1={X(threshold)} x2={X(threshold)} y1={top} y2={bottom} className="rv-reference" />{cuts.slice(0, -1).map((a, i) => <line key={i} x1={X(a)} x2={X(cuts[i + 1])} y1={Y(cdfAt(law, a))} y2={Y(cdfAt(law, a))} className="rv-line rv-blue" />)}{law.map(row => <g key={row.value}><Point x={row.value} y={cdfAt(law, row.value, true)} X={X} Y={Y} tone="blue" open /><Point x={row.value} y={cdfAt(law, row.value)} X={X} Y={Y} tone="blue" /></g>)}<Point x={threshold} y={cdfAt(law, threshold)} X={X} Y={Y} tone="gold" /></>}</Plane>;
}
export function MassRuler({
  rows,
  label = 'A total probability of one'
}) {
  let cumulative = 0;
  return <Scene label={label} height={rows.length * 56 + 85}><Label x={30} y={26} anchor="start">0</Label><Label x={310} y={26} anchor="end">1 total mass</Label>{rows.map((row, i) => {
      const start = cumulative;
      cumulative += row.mass;
      return <g key={i}><line x1={30} x2={310} y1={50 + i * 56} y2={50 + i * 56} className="rv-grid" /><rect x={30 + 280 * start} y={41 + i * 56} width={280 * row.mass} height={18} className={`rv-area rv-${i % 2 ? 'blue' : 'gold'}`} /><Label x={30} y={78 + i * 56} anchor="start">{row.label}: {fmt(row.mass)}</Label></g>;
    })}</Scene>;
}
export function ResidualSquares({
  pieces,
  center,
  centerName = 'c',
  label = 'Probability-weighted squared distances'
}) {
  return <><Scene label={label} height={pieces.length * 102 + 50}>{pieces.map((row, i) => {
        const side = Math.sqrt(row.mass) * Math.abs(row.value - center) * 18,
          y = 45 + i * 102;
        return <g key={i}><rect x={22} y={y} width={side} height={side} className="rv-area rv-gold" /><Label x={135} y={y + 18} anchor="start">x = {row.value}, p = {fmt(row.mass)}</Label><Label x={135} y={y + 45} anchor="start">x − {centerName} = {fmt(row.value - center)}</Label><Label x={135} y={y + 72} anchor="start">area = {fmt(row.mass * (row.value - center) ** 2)}</Label>{side === 0 && <circle cx={22} cy={y} r={3} className="rv-dot rv-gold" />}</g>;
      })}</Scene><p>Each side is √p · |x−{centerName}| on the same drawing scale; its area is p(x−{centerName})². A dot marks a true zero area.</p></>;
}
export function JointGrid({
  state,
  selectedX = null
}) {
  const width = 76,
    top = 60,
    left = 63,
    height = 110 + state.xs.length * 65;
  const row = selectedX === null ? null : conditionalRow(state, selectedX);
  return <><Scene label="Every joint cell with actual probability; marginals are separate sums" height={height}>{state.ys.map((y, i) => <Label key={i} x={left + (i + .5) * width} y={28}>Y {y}</Label>)}{state.xs.map((x, i) => <g key={x}><Label x={left - 10} y={top + i * 65 + 37} anchor="end">X {x}</Label>{state.ys.map((y, j) => {
          const cell = state.cells.find(c => c.x === x && c.y === y);
          return <g key={y}><rect x={left + j * width} y={top + i * 65} width={width} height={65} className={`rv-area rv-${selectedX === x ? 'gold' : 'blue'}`} style={{
              fillOpacity: .08 + .65 * cell.mass
            }} /><Label x={left + (j + .5) * width} y={top + i * 65 + 37}>{fmt(cell.mass, 3)}</Label></g>;
        })}</g>)}</Scene><Table label="Joint row and column sums" headers={['Coordinate', 'Marginal probability']} rows={[...state.xs.map(x => [`X=${x}`, fmt(state.rows.filter(r => r.x === x).reduce((s, r) => s + r.mass, 0))]), ...state.ys.map(y => [`Y=${y}`, fmt(state.rows.filter(r => r.y === y).reduce((s, r) => s + r.mass, 0))])]} />{row && <p>Row X={selectedX}, mass {fmt(row.mass)}: conditional Y probabilities {row.cells.map(cell => `${cell.y}: ${fmt(cell.conditional)}`).join('; ')}.</p>}</>;
}
export function CovarianceDrawing({
  state,
  selected = 0
}) {
  const rows = pairedContributions(state),
    chosen = rows[selected],
    unit = 48;
  return <Compare><div><Plane label="Raw paired coordinates and their mean crosshair" xRange={[-1.5, 1.5]} yRange={[-5.5, 5.5]} xTicks={[-1, 0, 1]} yTicks={[-5, 0, 5]} xLabel="X (raw units)" yLabel="Y (raw units)">{({
          X,
          Y,
          left,
          right,
          top,
          bottom
        }) => <><line x1={X(state.x.mean)} x2={X(state.x.mean)} y1={top} y2={bottom} className="rv-reference" /><line x1={left} x2={right} y1={Y(state.y.mean)} y2={Y(state.y.mean)} className="rv-reference" />{rows.map((r, i) => <Point key={i} x={r.x} y={r.y} X={X} Y={Y} radius={4 + 4 * Math.sqrt(r.mass)} selected={i === selected} />)}</>}</Plane></div><div><Scene label="Equal-scale centered plane; selected rectangle area is the weighted centered product" height={350}><Label x={25} y={25} anchor="start">√p (Y−μY)</Label><line x1={50} x2={290} y1={160} y2={160} className="rv-axis" /><line x1={170} x2={170} y1={40} y2={280} className="rv-axis" />{[-2, -1, 0, 1, 2].map(v => <g key={v}><Label x={170 + v * unit} y={304}>{v}</Label><Label x={38} y={165 - v * unit} anchor="end">{v}</Label></g>)}{chosen && <><rect x={Math.min(170, 170 + Math.sqrt(chosen.mass) * chosen.dx * unit)} y={Math.min(160, 160 - Math.sqrt(chosen.mass) * chosen.dy * unit)} width={Math.abs(Math.sqrt(chosen.mass) * chosen.dx * unit)} height={Math.abs(Math.sqrt(chosen.mass) * chosen.dy * unit)} className={`rv-area rv-${chosen.contribution < 0 ? 'rose' : 'gold'}`} /><Arrow x1={170} y1={160} x2={170 + Math.sqrt(chosen.mass) * chosen.dx * unit} y2={160 - Math.sqrt(chosen.mass) * chosen.dy * unit} tone={chosen.contribution < 0 ? 'rose' : 'gold'} /></>}<Label x={205} y={334}>√p (X−μX)</Label></Scene><p>The centered plane uses equal scales. The selected signed area is {fmt(chosen?.contribution ?? 0)}; the raw plot uses different axis scales.</p></div></Compare>;
}
export function GroupDrawing({
  state,
  decomposition = false
}) {
  return <><Plane label="All four group outcomes, group means and pooled mean" xRange={[-3, 3]} yRange={[-3.5, 3.5]} xTicks={[-2, 2]} yTicks={[-3, 0, 3]} xLabel="group G" yLabel="Y = G−U">{({
        X,
        Y,
        left,
        right
      }) => <><line x1={left} x2={right} y1={Y(state.y.mean)} y2={Y(state.y.mean)} className="rv-reference" />{state.rows.map((r, i) => <Point key={i} x={r.g + (r.u < 0 ? -.18 : .18)} y={r.y} X={X} Y={Y} open={r.mass === 0} radius={4 + 5 * Math.sqrt(r.mass)} tone={r.g < 0 ? 'gold' : 'blue'} />)}{state.groups.filter(g => g.moments).map(g => <g key={g.g}><line x1={X(g.g - .6)} x2={X(g.g + .6)} y1={Y(g.moments.y.mean)} y2={Y(g.moments.y.mean)} className={`rv-line rv-${g.g < 0 ? 'gold' : 'blue'}`} /></g>)}</>}</Plane><Table label="Actual grouped outcomes and their probability" headers={['G', 'U', 'X=G+U', 'Y=G−U', 'Mass']} rows={state.rows.map(r => [r.g, r.u, r.x, r.y, fmt(r.mass)])} /><p>{state.groups.map(g => `Group ${g.g}: mass ${fmt(g.mass)}, mean ${fmt(g.moments?.y.mean ?? null)}`).join('; ')}. Pooled mean {fmt(state.y.mean)}.</p>{decomposition && <><Table label="Variance and signed covariance decomposition" headers={['Target', 'Within groups', 'Between groups', 'Total']} rows={[["Var(Y)", fmt(state.withinVariance), fmt(state.betweenVariance), fmt(state.y.variance)], ["Cov(X,Y)", fmt(state.withinCovariance), fmt(state.betweenCovariance), fmt(state.covariance)]]} /><p>Within covariance can be negative; the two variance contributions are nonnegative.</p></>}</>;
}
export function NoiseDrawing({
  state
}) {
  return <><Scene label="One shared source connects both measurement channels" height={255}><Label x={170} y={28}>shared sign s; amplitude {state.common} mV</Label><Arrow x1={150} y1={42} x2={77} y2={110} /><Arrow x1={190} y1={42} x2={263} y2={110} /><Label x={77} y={135}>A = 10 + {state.common}s</Label><Label x={263} y={135}>B = 20 + {state.common}s</Label><Label x={77} y={160}>+ {state.local}e (mV)</Label><Label x={263} y={160}>+ {state.local}f (mV)</Label><Arrow x1={77} y1={175} x2={150} y2={220} /><Arrow x1={263} y1={175} x2={190} y2={220} tone="blue" /><Label x={170} y={250}>{state.a} A + {state.b} B</Label></Scene><Table label="All eight equally likely sign choices" headers={['sign s', 'sign e', 'sign f', 'A (mV)', 'B (mV)', 'Output (mV)']} rows={state.rows.map(r => [r.s, r.e, r.f, fmt(r.x), fmt(r.y), fmt(state.a * r.x + state.b * r.y)])} /><LawDrawing law={state.distribution} range={[-41, 41]} ticks={[-40, 0, 40]} xLabel="combined output (mV)" /><Values><span>mean {fmt(state.combined.mean)} mV</span><span>variance {fmt(state.combined.variance)} mV²</span><span>shared {fmt(state.components[0])}; A-local {fmt(state.components[1])}; B-local {fmt(state.components[2])} mV²</span></Values></>;
}
export function SquaredUniformDrawing({
  state
}) {
  return <><Plane label="Both inverse intervals under the actual square map" xRange={[-1, 1]} yRange={[0, 1]} xTicks={[-1, 0, 1]} xLabel="U (uniform on −1..1)" yLabel="Y = U²" curves={[{
      fn: u => u * u
    }]}>{({
        X,
        Y,
        left,
        right,
        bottom
      }) => <><rect x={left} y={Y(state.upper)} width={right - left} height={Y(state.lower) - Y(state.upper)} className="rv-area rv-blue" />{state.preimages.map(([a, b], i) => <g key={i}><rect x={X(a)} y={Y(state.upper)} width={X(b) - X(a)} height={bottom - Y(state.upper)} className="rv-area rv-gold" /><Point x={a} y={a * a} X={X} Y={Y} /><Point x={b} y={b * b} X={X} Y={Y} /></g>)}</>}</Plane><p>Inverse intervals {state.preimages.map(([a, b]) => `[${fmt(a)}, ${fmt(b)}]`).join(' ∪ ')}. Each has length {fmt(state.rootUpper - state.rootLower)}, multiplied by density 1/2; total probability {fmt(state.mass)}.</p><Plane label="The square CDF is the square root, with no jump at zero" xRange={[0, 1]} yRange={[0, 1]} xLabel="square threshold y" yLabel="F(y) = √y" curves={[{
      fn: Math.sqrt,
      tone: 'blue'
    }]}>{({
        X,
        Y
      }) => <><Point x={state.lower} y={state.rootLower} X={X} Y={Y} /><Point x={state.upper} y={state.rootUpper} X={X} Y={Y} /></>}</Plane></>;
}
export function MatrixDrawing({
  rows
}) {
  const state = covarianceMatrix(rows);
  return <><Table label="Every centered outer product, weighted by probability" headers={['A', 'B', 'p', 'dA', 'dB', 'p dA²', 'p dA dB', 'p dB²']} rows={state.centered.map(r => [r.x, r.y, fmt(r.mass), fmt(r.dx), fmt(r.dy), fmt(r.mass * r.dx * r.dx), fmt(r.mass * r.dx * r.dy), fmt(r.mass * r.dy * r.dy)])} /><Table label="Covariance matrix, sum of the weighted outer products" headers={['', 'A residual', 'B residual']} rows={state.matrix.map((row, i) => [i === 0 ? 'A residual' : 'B residual', ...row.map(v => fmt(v))])} /></>;
}
export function ConditionalRectangles({
  state
}) {
  const rows = conditionalGeometry(state),
    unit = 42;
  return <Compare>{['within', 'between'].map(kind => <div key={kind}><Scene label={`${kind} paired residual rectangles, actual signed probability-weighted areas`} height={rows.length * 110 + 50}>{rows.map((row, i) => {
          const y = 68 + i * 110,
            pair = row[kind];
          if (!pair) return <Label key={i} x={25} y={y} anchor="start">G={row.g}: null group, no rectangle</Label>;
          const dx = Math.sqrt(row.mass) * pair[0] * unit,
            dy = Math.sqrt(row.mass) * pair[1] * unit;
          return <g key={i}><Label x={20} y={y - 28} anchor="start">G={row.g}, U={row.u}; p={fmt(row.mass)}</Label><line x1={180} x2={320} y1={y} y2={y} className="rv-axis" /><line x1={250} x2={250} y1={y - 24} y2={y + 24} className="rv-axis" /><rect x={Math.min(250, 250 + dx)} y={Math.min(y, y - dy)} width={Math.abs(dx)} height={Math.abs(dy)} className={`rv-area rv-${pair[0] * pair[1] < 0 ? 'rose' : 'blue'}`} /><Label x={20} y={y + 37} anchor="start">signed area {fmt(row.mass * pair[0] * pair[1])}</Label></g>;
        })}</Scene><p>{kind} covariance: sum of the actual signed areas. Each side is a centered coordinate multiplied by √p.</p></div>)}</Compare>;
}
