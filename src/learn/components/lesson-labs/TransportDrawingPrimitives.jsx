import { useId } from 'react';
export const sourceColours = ['#78cbe8', '#c6b6f0', '#e8b44a', '#f4bda2'];
export const targetColours = ['#f29ab1', '#93aaf5', '#e8b44a', '#bad5e3'];
export const fmt = (n, d = 5) => !Number.isFinite(n) ? String(n) : n === 0 ? '0' : Math.abs(n) < 1e-4 ? n.toExponential(3) : Number(n.toFixed(d)).toString();
export const sum = a => a.reduce((s, x) => s + x, 0);
export function Figure({
  id,
  label,
  children,
  caption
}) {
  return <figure className="ot-figure" data-mechanism={id} aria-label={label}><div className="ot-drawing">{children}</div>{caption && <figcaption>{caption}</figcaption>}</figure>;
}
export function Geometry({
  label,
  children,
  height = 180
}) {
  const id = useId();
  return <svg className="ot-geometry" viewBox={`0 0 300 ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>;
}
export function Dot({
  x,
  y,
  mass = 1,
  colour = sourceColours[0],
  target = false,
  selected = false,
  scale = 20
}) {
  const r = mass > 0 ? scale * Math.sqrt(mass) : 3;
  return <g>{target ? <rect x={x - r * Math.sqrt(Math.PI) / 2} y={y - r * Math.sqrt(Math.PI) / 2} width={r * Math.sqrt(Math.PI)} height={r * Math.sqrt(Math.PI)} transform={`rotate(45 ${x} ${y})`} fill={mass ? colour : 'none'} stroke={colour} /> : <circle cx={x} cy={y} r={r || 3} fill={mass ? colour : 'none'} stroke={colour} />}{selected && <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#fff" strokeWidth="2" />}</g>;
}
export function Ledger({
  label,
  headers,
  rows
}) {
  return <div className="ot-table-region" role="region" aria-label={label} tabIndex={0}><table><caption>{label}</caption><thead><tr>{headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{typeof v === 'number' ? fmt(v, 9) : v}</td>)}</tr>)}</tbody></table></div>;
}
export function Values({
  items
}) {
  return <dl className="ot-values">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === 'number' ? fmt(value, 9) : value}</dd></div>)}</dl>;
}
export function Law({
  locations,
  weights,
  domain,
  label,
  target = false,
  colours,
  names,
  outlineColours,
  highlight = -1
}) {
  const min = domain?.[0] ?? Math.min(...locations) - .5,
    max = domain?.[1] ?? Math.max(...locations) + .5,
    x = v => 30 + (v - min) / (max - min) * 240,
    palette = colours || (target ? targetColours : sourceColours),
    name = i => names?.[i] ?? (target ? 'B' : 'A') + i;
  const ticks = [min];
  for (const v of [...new Set(locations)].sort((a, b) => a - b)) if (v > min && v < max && v - ticks.at(-1) >= .12 * (max - min) && max - v >= .12 * (max - min)) ticks.push(v);
  ticks.push(max);
  const groups = [...new Set(locations)].sort((a, b) => a - b).map(position => ({
    position,
    indices: locations.map((v, i) => v === position ? i : -1).filter(i => i >= 0)
  }));
  const lanes = [];
  for (const g of groups) {
    g.mass = sum(g.indices.map(i => weights[i]));
    g.halfWidth = Math.max(26, 20 * Math.sqrt(g.mass) * (target ? Math.sqrt(Math.PI / 2) : 1) + 5);
    let lane = 0;
    while (lanes[lane]?.some(h => Math.abs(x(h.position) - x(g.position)) < h.halfWidth + g.halfWidth)) lane++;
    (lanes[lane] ??= []).push(g);
    g.y = 52 + lane * 64;
  }
  const axis = 78 + Math.max(0, lanes.length - 1) * 64,
    H = axis + 48;
  return <div className="ot-law"><p className="ot-object-label">{label}</p><Geometry label={`${label}: atom area encodes mass; horizontal position encodes location`} height={H}><line x1="30" x2="270" y1={axis} y2={axis} stroke="#888" />{ticks.map((v, i) => <g key={i}><line x1={x(v)} x2={x(v)} y1={axis - 2} y2={axis + 5} stroke="#aaa" /><text x={x(v)} y={axis + 23} textAnchor="middle">{fmt(v, 2)}</text></g>)}
 {groups.map(g => <g key={g.position}>{lanes.length > 1 && <line x1={x(g.position)} x2={x(g.position)} y1={g.y} y2={axis} stroke="#555" strokeDasharray="2 3" />}<Dot x={x(g.position)} y={g.y} mass={g.mass} colour={palette[g.indices[0] % palette.length]} target={target} selected={g.indices.includes(highlight)} />{(g.indices.length > 1 || outlineColours?.[g.indices[0]]) && <g stroke={g.indices.length > 1 ? palette[g.indices[1] % palette.length] : outlineColours[g.indices[0]]} strokeWidth="3" fill="none">{target ? <rect x={x(g.position)-10*Math.sqrt(Math.PI*g.mass)} y={g.y-10*Math.sqrt(Math.PI*g.mass)} width={20*Math.sqrt(Math.PI*g.mass)} height={20*Math.sqrt(Math.PI*g.mass)} transform={`rotate(45 ${x(g.position)} ${g.y})`} /> : <circle cx={x(g.position)} cy={g.y} r={20*Math.sqrt(g.mass)} />}</g>}<text x={x(g.position)} y={g.y - 32} textAnchor="middle">{g.indices.map(name).join('+')}</text></g>)}<text x="150" y={H - 5} textAnchor="middle">location</text></Geometry>
 <p className="ot-key">{weights.map((w, i) => <span key={i} style={{
        color: palette[i % palette.length]
      }}>{target ? '◇' : '●'} {name(i)}: {fmt(w)} at {fmt(locations[i])}</span>)}</p>{lanes.length > 1 && <p className="ot-note">Close atoms use separate vertical lanes for legibility; their horizontal locations and mass areas remain exact.</p>}</div>;
}
export function LawPair({
  x = [0, 2],
  y = [0, 1],
  a = [.5, .5],
  b = [.5, .5],
  domain = [0, 2],
  sourceLabel = 'Source α',
  targetLabel = 'Target β'
}) {
  return <div className="ot-pair"><Law locations={x} weights={a} domain={domain} label={sourceLabel} /><Law locations={y} weights={b} domain={domain} label={targetLabel} target /></div>;
}
export function Matrix({
  values,
  label = 'Transport plan P',
  max,
  selected = -1,
  rowLabels,
  colLabels,
  rowColours = sourceColours,
  colColours = targetColours,
  requiredRows,
  requiredCols,
  decimals = 5,
  kind = 'mass',
  scaleLabel,
  showTotals
}) {
  const scale = max ?? Math.max(...values.flat(), 1e-15),
    rows = values.map(sum),
    cols = values[0].map((_, j) => sum(values.map(r => r[j]))),
    shaded = ['mass', 'kernel', 'conditional', 'support'].includes(kind),
    totals = showTotals ?? ['mass', 'kernel', 'support'].includes(kind),
    quantity = scaleLabel || {
      mass: 'Mass',
      kernel: 'Kernel weight',
      support: 'Positive edge weight',
      conditional: 'Conditional probability'
    }[kind];
  return <div className="ot-matrix-object"><p className="ot-object-label">{label}</p><div className="ot-matrix-scroll" role="region" aria-label={label + '; matrix, scroll horizontally when needed'} tabIndex={0}><div className="ot-matrix" style={{
      gridTemplateColumns: `auto repeat(${values[0].length},minmax(max-content,1fr))${totals ? ' auto' : ''}`
    }}><span />{cols.map((_, j) => <span className="ot-matrix-label" style={{
        color: colColours[j % colColours.length]
      }} key={'h' + j}>{colLabels?.[j] ?? `◇ B${j}`}</span>)}{totals && <span className="ot-matrix-label">Σ row</span>}{values.map((row, i) => <div className="ot-matrix-row" key={i}><span className="ot-matrix-label" style={{
          color: rowColours[i % rowColours.length]
        }}>{rowLabels?.[i] ?? `● A${i}`}</span>{row.map((v, j) => <span key={j} className={`ot-cell ${selected === i * row.length + j ? 'is-selected' : ''}`} style={{
          background: shaded && v > 0 ? `rgba(120,203,232,${.1 + .48 * v / scale})` : 'transparent'
        }}>{fmt(v, decimals)}</span>)}{totals && <span className="ot-matrix-total">{fmt(rows[i], decimals)}{requiredRows && <small>need {fmt(requiredRows[i])}</small>}</span>}</div>)}{totals && <><span className="ot-matrix-label">Σ col</span>{cols.map((v, j) => <span className="ot-matrix-total" key={'c' + j}>{fmt(v, decimals)}{requiredCols && <small>need {fmt(requiredCols[j])}</small>}</span>)}<span className="ot-matrix-total">{fmt(sum(rows), decimals)}</span></>}</div></div>{shaded && <p className="ot-scale"><i />{quantity} scale: empty 0 → cyan {fmt(scale)}. Headers identify atoms.</p>}</div>;
}
export function Routes({
  plan = [[.5, 0], [0, .5]],
  label = 'Mass routes; lane spacing is schematic',
  quantity = 'mass',
  selected = -1,
  sourceNames,
  targetNames,
  targetIdentityColours = targetColours
}) {
  const n = plan.length,
    m = plan[0].length,
    H = Math.max(n, m) * 66 + 24,
    y = (i, k) => 35 + i * (H - 70) / Math.max(1, k - 1);
  return <div className="ot-routes"><p className="ot-object-label">{label}</p><Geometry label={label} height={H}>{plan.flatMap((r, i) => r.map((v, j) => v > 0 ? <g key={`${i}-${j}`}><path d={`M 80 ${y(i, n)} C 120 ${y(i, n)},180 ${y(j, m)},220 ${y(j, m)}`} fill="none" stroke={selected === i * m + j ? '#fff' : sourceColours[i % 4]} strokeWidth={v * 28 + (selected === i * m + j ? 4 : 0)} />{selected === i * m + j && <path d={`M 80 ${y(i, n)} C 120 ${y(i, n)},180 ${y(j, m)},220 ${y(j, m)}`} fill="none" stroke={sourceColours[i % 4]} strokeWidth={v * 28} />}</g> : null))}{plan.map((r, i) => <g key={'a' + i}><Dot x={70} y={y(i, n)} mass={sum(r)} colour={sourceColours[i % 4]} /><text x="12" y={y(i, n) + 5}>{sourceNames?.[i] ?? `A${i}`}</text></g>)}{plan[0].map((_, j) => <g key={'b' + j}><Dot x={230} y={y(j, m)} mass={sum(plan.map(r => r[j]))} target colour={targetIdentityColours[j % targetIdentityColours.length]} /><text x="270" y={y(j, m) + 5}>{targetNames?.[j] ?? `B${j}`}</text></g>)}</Geometry><p className="ot-key">{quantity === 'mass' ? 'Ribbon width ∝ mass. Zero cells carry no ribbon.' : `Ribbon width and endpoint area ∝ ${quantity}. Zero cells carry no ribbon.`}</p></div>;
}
export function Plan({
  plan,
  a,
  b,
  selected = -1,
  max,
  label,
  targetIdentityColours = targetColours,
  kind = 'mass',
  routeLabel,
  scaleLabel,
  quantity = 'mass'
}) {
  return <div className="ot-pair"><Routes plan={plan} selected={selected} label={routeLabel} quantity={quantity} targetIdentityColours={targetIdentityColours} /><Matrix values={plan} requiredRows={a} requiredCols={b} selected={selected} max={max} label={label} colColours={targetIdentityColours} kind={kind} scaleLabel={scaleLabel} /></div>;
}
export function Plot({
  curves,
  domain = [0, 1],
  range = [0, 1],
  xLabel = 'x',
  yLabel = 'value',
  points = [],
  areas = [],
  segments = [],
  xTicks,
  yTicks,
  height = 215
}) {
  const X = v => 42 + 220 * (v - domain[0]) / (domain[1] - domain[0]),
    Y = v => height - 42 - (height - 70) * (v - range[0]) / (range[1] - range[0]);
  return <div className="ot-plot"><Geometry label={`${yLabel} against ${xLabel}`} height={height}>{areas.map((a, i) => <rect key={'area' + i} x={X(a.x0)} width={Math.max(0, X(a.x1) - X(a.x0))} y={Y(Math.max(a.y0, a.y1))} height={Math.abs(Y(a.y0) - Y(a.y1))} fill={a.colour || '#e8b44a'} fillOpacity=".22" stroke={a.selected ? '#fff' : 'none'} strokeWidth="2" />)}<path d={`M42 20V${height - 42}H275`} fill="none" stroke="#888" />{range[0] < 0 && range[1] > 0 && <line x1="42" x2="262" y1={Y(0)} y2={Y(0)} stroke="#888" strokeDasharray="3 3" />}{domain[0] < 0 && domain[1] > 0 && <line x1={X(0)} x2={X(0)} y1="28" y2={height - 42} stroke="#888" strokeDasharray="3 3" />}{(xTicks || [domain[0], (domain[0] + domain[1]) / 2, domain[1]]).map(t => <text key={'x' + t} x={X(t)} y={height - 22} textAnchor="middle">{fmt(t, 3)}</text>)}{(yTicks || [range[0], (range[0] + range[1]) / 2, range[1]]).map(t => <text key={'y' + t} x="36" y={Y(t) + 4} textAnchor="end">{fmt(t, 3)}</text>)}{segments.map((s, i) => <line key={'seg' + i} x1={X(s.x0)} x2={X(s.x1)} y1={Y(s.y0)} y2={Y(s.y1)} stroke={s.colour || '#888'} strokeWidth="1.3" />)}{curves.map((c, i) => c.discrete ? <g key={i}>{c.points.map(([x, y], j) => <g key={j}>{c.stems && <line x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(y)} stroke={c.colour || sourceColours[i % 4]} strokeWidth="2" />}{c.marker === 'diamond' ? <rect x={X(x) - 3} y={Y(y) - 3} width="6" height="6" transform={`rotate(45 ${X(x)} ${Y(y)})`} fill={c.colour || sourceColours[i % 4]} /> : <circle cx={X(x)} cy={Y(y)} r="3" fill={c.colour || sourceColours[i % 4]} />}</g>)}</g> : <path key={i} d={c.points.map(([x, y], j) => `${j ? 'L' : 'M'}${X(x)} ${Y(y)}`).join(' ')} fill="none" stroke={c.colour || sourceColours[i % 4]} strokeWidth="2.2" strokeDasharray={c.dashed ? '5 3' : undefined} />)}{points.map((p, i) => <g key={'p' + i}><circle cx={X(p.x)} cy={Y(p.y)} r="4" fill={p.colour || '#fff'} />{p.label && <text x={X(p.x) + 6} y={Y(p.y) - 7}>{p.label}</text>}</g>)}<text x="155" y={height - 2} textAnchor="middle">{xLabel}</text></Geometry><p className="ot-key">{yLabel}. {curves.map((c, i) => <span key={i} style={{
        color: c.colour || sourceColours[i % 4]
      }}>{c.discrete ? c.marker === 'diamond' ? '◆' : '●' : c.dashed ? '┄' : '━'} {c.label}</span>)}</p></div>;
}
export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange
}) {
  return <label className="ot-control"><span>{label}: <output>{fmt(value, 4)}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
export function Buttons({
  label,
  options,
  value,
  onChange
}) {
  return <div className="ot-choice" role="group" aria-label={label}>{options.map(([id, text]) => <button type="button" aria-pressed={value === id} key={id} onClick={() => onChange(id)}>{text}</button>)}</div>;
}
export function Reset({
  onClick
}) {
  return <button type="button" onClick={onClick}>Reset</button>;
}
