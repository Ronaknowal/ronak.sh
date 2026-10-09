import { useId } from 'react';
import { formatSpectral, spectralNames, multiply, dot } from '../../data/spectral-graph-models.js';
import './spectral-graph-labs.css';

export const sf = (value, digits = 4) => typeof value === 'number' ? formatSpectral(value, digits).replaceAll('-', '−') : String(value);
export const palette = ['#e4b752', '#8dcce8', '#dfb6d1'];
export function SpectralFigure({ name, label, caption, children }) {
  return <figure className="sg-figure" data-spectral-figure={name} aria-label={label}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Scene({ label, height = 260, children }) {
  const id = `sg-arrow-${useId().replaceAll(':', '')}`;
  return <svg className="sg-scene" viewBox={`0 0 340 ${height}`} role="img" aria-label={label}><title>{label}</title>
    <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke" /></marker></defs>
    {typeof children === 'function' ? children(id) : children}</svg>;
}
export function Label({ x, y, children, small = false, anchor = 'middle', className = '' }) {
  return <text x={x} y={y} textAnchor={anchor} className={`sg-label ${small ? 'sg-small' : ''} ${className}`}>{children}</text>;
}
export function Arrow({ from, to, marker, className = '' }) {
  return <path d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} className={`sg-arrow ${className}`} markerEnd={`url(#${marker})`} />;
}
export function Matrix({ values, rows, columns, label, highlight }) {
  return <div className="sg-matrix-block"><p>{label}</p><div className="sg-local-scroll" tabIndex={0} role="region" aria-label={label}><table className="sg-matrix"><caption>{label}</caption><thead><tr><th scope="col" aria-label="row" />{(columns || values[0].map((_, i) => spectralNames[i])).map((name, i) => <th key={i} scope="col">{name}</th>)}</tr></thead><tbody>{values.map((row, i) => <tr key={i}><th scope="row">{rows?.[i] ?? spectralNames[i]}</th>{row.map((value, j) => <td key={j} className={highlight?.(i, j) ? 'is-selected' : ''}>{sf(value)}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Network({ graph, values, sides, selected = [], label, edgeText, edgeCurrent, names, path = false }) {
  const size = graph.degree.length;
  const positions = path ? [[50, 70], [170, 70], [290, 70]] : size === 3 ? [[70, 55], [270, 55], [170, 190]]
    : size === 2 ? [[75, 65], [265, 65]] : Array.from({ length: size }, (_, i) => {
      const group = Math.floor(i / 3), item = i % 3;
      return [[65, 42 + group * 205], [275, 42 + group * 205], [170, 142 + group * 205]][item];
    });
  const height = Math.max(...positions.map(point => point[1])) + (values ? 75 : 38);
  return <Scene label={label} height={height}>{marker => <>{graph.adjacency.flatMap((row, i) => row.map((weight, j) => {
    if (j <= i || weight <= 0) return null;
    const [x, y] = positions[i], [xx, yy] = positions[j], length = Math.hypot(xx - x, yy - y), dx = (xx - x) / length, dy = (yy - y) / length;
    const current = edgeCurrent?.(i, j, weight) || 0, reverse = current < 0;
    return <g key={`${i}-${j}`}><line x1={reverse ? xx - dx * 21 : x + dx * 21} y1={reverse ? yy - dy * 21 : y + dy * 21} x2={reverse ? x + dx * 21 : xx - dx * 21} y2={reverse ? y + dy * 21 : yy - dy * 21} markerEnd={Math.abs(current) > 1e-10 ? `url(#${marker})` : undefined} className={sides && sides[i] !== sides[j] ? 'sg-edge sg-crossing' : 'sg-edge'} style={{ strokeWidth: 1 + Math.min(weight, 3) }} />
      <Label x={(x + xx) / 2 + (Math.abs(dx) < .1 ? 31 : 0)} y={(y + yy) / 2 - 9} small className="sg-halo">{edgeText?.(i, j, weight) ?? sf(weight, 2)}</Label></g>;
  }))}{positions.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="20" className={`sg-node ${selected.includes(i) ? 'is-selected' : ''}`} style={{ fill: sides ? `${palette[sides[i] ?? 0]}33` : undefined, stroke: sides ? palette[sides[i] ?? 0] : undefined }} /><Label x={x} y={y + 6}>{names?.[i] ?? spectralNames[i]}</Label>{values && <Label x={x} y={y + 49} small>{sf(values[i])}</Label>}</g>)}</>}</Scene>;
}
export function WeightedAtoms({ values, degrees, median, label }) {
  const px = value => 35 + (value + 2.5) * 54;
  return <Scene height={185} label={label}><line x1="30" y1="75" x2="310" y2="75" className="sg-axis" />{[-2.5, 0, 2.5].map(value => <g key={value}><line x1={px(value)} y1="71" x2={px(value)} y2="79" className="sg-axis" /><Label x={px(value)} y={176} small>{sf(value)}</Label></g>)}<line x1={px(median)} y1="30" x2={px(median)} y2="150" className="sg-threshold" />{values.map((value, i) => <g key={i}><circle cx={px(value)} cy="75" r={9 * Math.sqrt(degrees[i])} fill={palette[i]} fillOpacity=".5" stroke={palette[i]} /><Label x={px(value)} y={43} small>{spectralNames[i]}</Label><Label x={px(value)} y={119} small>{sf(value, 3)}</Label><Label x={px(value)} y={143} small>d={degrees[i]}</Label></g>)}</Scene>;
}
/** Each bar is a signed coordinate, with a visible zero baseline and one common scale. */
export function SignedBars({ values, names, label, scale: suppliedScale, secondary, secondaryName = 'comparison' }) {
  const scale = suppliedScale || Math.max(1e-12, ...values.map(Math.abs), ...(secondary || []).map(Math.abs));
  const n = values.length, height = 48 + n * 58;
  const x = value => 182 + 100 * value / scale;
  return <Scene label={label} height={height}><line x1="182" y1="25" x2="182" y2={height - 15} className="sg-axis" /><Label x={182} y={18} small>0</Label><Label x={82} y={18} small>{sf(-scale, 3)}</Label><Label x={282} y={18} small>{sf(scale, 3)}</Label>{values.map((value, i) => <g key={i}><Label x={26} y={43 + i * 58} anchor="start" small>{names?.[i] ?? spectralNames[i]}</Label><Label x={326} y={43 + i * 58} anchor="end" small>{sf(value, 4)}</Label><line x1="182" y1={58 + i * 58} x2={x(value)} y2={58 + i * 58} className="sg-bar" />{secondary && <line x1="182" y1={68 + i * 58} x2={x(secondary[i])} y2={68 + i * 58} className="sg-comparison-bar" />}</g>)}{secondary && <title>{`Amber: first vector. Cyan: ${secondaryName}. Common signed scale.`}</title>}</Scene>;
}
export function EigenAgreement({ state, mode = 1 }) {
  const vector = state.vectors[mode], product = multiply(state.matrix, vector), target = vector.map(value => value * state.values[mode]);
  const residual = Math.hypot(...product.map((value, i) => value - target[i]));
  return <><Network graph={state} values={vector} label={`Node coordinates of u${mode + 1}`} /><SignedBars values={product} secondary={target} secondaryName={`lambda${mode + 1} u${mode + 1}`} label="Lu and lambda u share one signed coordinate scale" /><p className="flow-readout">λ{mode + 1} = <strong>{sf(state.values[mode], 6)}</strong>; ‖u‖² = {sf(dot(vector, vector), 8)}; ‖Lu − λu‖₂ = {sf(residual, 8)}. Amber is Lu; cyan is λu.</p></>;
}
/** Group tied coordinate marks without moving their mathematical positions. */
export function SweepAxis({ state, candidate }) {
  const low = Math.min(...state.coordinates), high = Math.max(...state.coordinates), span = high - low || 1;
  const y = value => 52 + (high - value) * 260 / span;
  const groups = [];
  state.order.forEach(node => {
    const group = groups.find(item => Math.abs(item.value - state.coordinates[node]) <= 1e-9);
    if (group) group.nodes.push(node); else groups.push({ value: state.coordinates[node], nodes: [node] });
  });
  return <Scene label="Ordered degree-normalized coordinates and actual threshold" height={365}><line x1="135" y1="40" x2="135" y2="325" className="sg-axis" />{groups.map((group, i) => {
    const labelY = 55 + (groups.length - 1 - i) * 250 / Math.max(1, groups.length - 1);
    return <g key={i}><line x1="127" y1={y(group.value)} x2="145" y2={y(group.value)} className="sg-axis" /><line x1="146" y1={y(group.value)} x2="180" y2={labelY} className="sg-coordinate-link" /><Label x={185} y={labelY + 5} anchor="start" small>{group.nodes.map(node => spectralNames[node]).join(', ')}: {sf(group.value, 3)}</Label></g>;
  })}{candidate && <><line x1="45" y1={y(candidate.threshold)} x2="155" y2={y(candidate.threshold)} className="sg-threshold" /><Label x={30} y={y(candidate.threshold) - 10} anchor="start" small>t={sf(candidate.threshold, 3)}</Label></>}<Label x={170} y={355} small>Axis is yᵢ; leaders separate labels.</Label></Scene>;
}
/** All three two-coordinate views show the same 3D points, not a projected distance claim. */
export function EmbeddingViews({ state, frame, selected = -1, previousCenters }) {
  const pairs = [[0, 1], [0, 2], [1, 2]];
  return <div className="sg-projections">{pairs.map(([a, b]) => {
    const point = values => [180 + 115 * values[a], 200 - 115 * values[b]];
    const grouped = [];
    state.points.forEach((values, node) => {
      const found = grouped.find(group => Math.hypot(group.values[a] - values[a], group.values[b] - values[b]) < .08);
      if (found) found.nodes.push(node); else grouped.push({ values, nodes: [node] });
    });
    return <Scene key={`${a}-${b}`} height={420} label={`Row coordinates ${a + 1} and ${b + 1}; coordinate ${[0, 1, 2].find(i => i !== a && i !== b) + 1} omitted`}>
      <Label x={170} y={25} small className="sg-projection-axis-label">Horizontal r{a + 1}; vertical r{b + 1}</Label>
      <line x1="48" y1="200" x2="315" y2="200" className="sg-axis" /><line x1="180" y1="70" x2="180" y2="330" className="sg-axis" />
      <Label x={167} y={223} small>0</Label><Label x={65} y={223} small>−1</Label><Label x={295} y={223} small>1</Label>
      {previousCenters?.map((values, i) => { const [x, y] = point(values), [xx, yy] = point(frame.centroids[i]); return <g key={`move${i}`}><rect x={x - 5} y={y - 5} width="10" height="10" fill="none" stroke={palette[i]} strokeDasharray="2 2" /><line x1={x} y1={y} x2={xx} y2={yy} stroke={palette[i]} strokeWidth="3" /><circle cx={xx} cy={yy} r="3" fill={palette[i]} /></g>; })}
      {frame.labels && state.points.map((values, i) => { const [x, y] = point(values), [xx, yy] = point(frame.centroids[frame.labels[i]]); return <line key={i} x1={x} y1={y} x2={xx} y2={yy} stroke={palette[frame.labels[i]]} opacity=".4" />; })}
      {state.points.map((values, i) => { const [x, y] = point(values); return <circle key={i} cx={x} cy={y} r={selected === i ? 7 : 4} fill={frame.labels ? palette[frame.labels[i]] : palette[0]} />; })}
      {grouped.map((group, i) => { const [x, y] = point(group.values); return <g key={i}><line x1={x} y1={y - 6} x2={x} y2={y - 17} className="sg-coordinate-link" /><Label x={x} y={y - 23} small className="sg-halo">{group.nodes.map(node => spectralNames[node]).join('')}</Label></g>; })}
      {frame.centroids.map((values, i) => {
        const [x, y] = point(values), coincident = frame.centroids.slice(0, i).filter(center => Math.hypot(center[a] - values[a], center[b] - values[b]) < 1e-7).length, radius = 7 + 4 * coincident;
        const labelX = 60 + i * 110;
        return <g key={i}><rect x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} fill={frame.empty.includes(i) ? 'none' : `${palette[i]}22`} stroke={palette[i]} strokeWidth="2" strokeDasharray={frame.empty.includes(i) ? '3 2' : undefined} />
          <line x1={x} y1={y + radius} x2={labelX} y2={360} stroke={palette[i]} strokeWidth="1" strokeDasharray="2 3" opacity=".65" />
          <Label x={labelX} y={381} small className="sg-centroid-label sg-halo">c{i + 1}{frame.empty.includes(i) ? ' ∅' : ''}</Label></g>;
      })}
      <Label x={170} y={415} small>Omitted coordinate r{[0, 1, 2].find(i => i !== a && i !== b) + 1}</Label>
    </Scene>;
  })}</div>;
}
export function GainCurve({ values, gains, kind = 'heat', amount = 1, label }) {
  const maximum = Math.max(3.5, ...values), px = value => 55 + 240 * value / maximum, py = value => 180 - 125 * value;
  const gain = value => kind === 'heat' ? Math.exp(-amount * value) : kind === 'ridge' ? 1 / (1 + amount * value) : undefined;
  const points = Array.from({ length: 81 }, (_, i) => [px(maximum * i / 80), py(gain(maximum * i / 80))]);
  const groups = [];
  values.forEach((value, i) => { const group = groups.find(item => Math.abs(item.value - value) < 1e-8 && Math.abs(item.gain - gains[i]) < 1e-12); if (group) group.modes.push(i + 1); else groups.push({ value, gain: gains[i], modes: [i + 1] }); });
  const annotationRows = [];
  const annotations = groups.map(group => {
    const text = `m ${group.modes.join(',')}`, x = px(group.value), halfWidth = text.length * 4.5;
    const interval = [x - halfWidth, x + halfWidth];
    let row = annotationRows.findIndex(items => items.every(other => interval[1] + 12 < other[0] || interval[0] > other[1] + 12));
    if (row < 0) { row = annotationRows.length; annotationRows.push([]); }
    annotationRows[row].push(interval);
    return { ...group, text, x, y: 236 + row * 24 };
  });
  const height = Math.max(275, 236 + (annotationRows.length - 1) * 24 + 20);
  return <Scene height={height} label={label}>
    <line x1="55" y1="180" x2="310" y2="180" className="sg-axis" /><line x1="55" y1="45" x2="55" y2="180" className="sg-axis" />
    <Label x={34} y={185} small>0</Label><Label x={34} y={59} small>1</Label><Label x={55} y={205} small>0</Label><Label x={295} y={205} small>{sf(maximum, 2)}</Label><Label x={315} y={205} small>λ</Label>
    {kind !== 'cutoff' && <polyline points={points.map(p => p.join(',')).join(' ')} className="sg-curve" />}
    {annotations.map((group, i) => <g key={i}>
      <line x1={group.x} y1="180" x2={group.x} y2={py(group.gain)} className="sg-stem" /><circle cx={group.x} cy={py(group.gain)} r="4" fill={palette[0]} />
      <line x1={group.x} y1="212" x2={group.x} y2={group.y - 17} className="sg-coordinate-link" /><Label x={group.x} y={group.y} small className="sg-mode-label sg-halo">{group.text}</Label>
    </g>)}
  </Scene>;
}
export function WalkTransfer({ lazy = false }) {
  const states = lazy ? [[1, 0], [.5, .5], [.5, .5]] : [[1, 0], [0, 1], [1, 0]];
  const transition = lazy ? [[.5, .5], [.5, .5]] : [[0, 1], [1, 0]];
  const position = (step, node) => [node ? 260 : 80, 45 + 135 * step];
  return <Scene height={370} label={lazy ? 'Lazy half-stay half-cross column-mass transfers at three times' : 'Ordinary swapping column-mass transfers at three times'}>{marker => <>
    {[0, 1].flatMap(step => [0, 1].flatMap(source => [0, 1].map(target => {
      const probability = transition[target][source];
      if (!probability) return null;
      const [x, y] = position(step, source), [xx, yy] = position(step + 1, target);
      const positiveFlow = states[step][source] > 0;
      const dx = xx - x, dy = yy - y, length = Math.hypot(dx, dy);
      const labelX = source === target ? x + (source ? 29 : -29) : source ? 194 : 146;
      const labelY = (y + yy) / 2 + (source === target ? 6 : source ? 19 : -19);
      return <g key={`${step}-${source}-${target}`}><title>{`Source ${source ? 'B' : 'A'} to target ${target ? 'B' : 'A'}: probability ${probability}, transferred mass ${probability * states[step][source]}`}</title>
        <line x1={x + dx * 22 / length} y1={y + dy * 22 / length} x2={xx - dx * 22 / length} y2={yy - dy * 22 / length} stroke={positiveFlow ? palette[0] : '#aaa79f'} strokeOpacity={positiveFlow ? 1 : .35} strokeDasharray={positiveFlow ? undefined : '4 4'} strokeWidth={positiveFlow ? 2 : 1} markerEnd={`url(#${marker})`} />
        <Label x={labelX} y={labelY} small className="sg-halo">{sf(probability)} / {sf(probability * states[step][source])}</Label></g>;
    }))) }
    {states.map((mass, step) => <g key={step}><Label x={12} y={51 + 135 * step} anchor="start" small>t{step}</Label>{mass.map((value, node) => {
      const [x, y] = position(step, node);
      return <g key={node}><circle cx={x} cy={y} r="22" className="sg-node" style={{ fill: value ? '#e4b75233' : '#101010' }} /><Label x={x} y={y - 4} small>{node ? 'B' : 'A'}</Label><Label x={x} y={y + 15} small>{sf(value)}</Label></g>;
    })}</g>)}
    <Label x={170} y={365} small>Labels: probability / transferred mass.</Label>
  </>}</Scene>;
}
export function DiffusionCurves({ state }) {
  const px = time => 62 + 248 * time / 40, py = value => 190 - (value + 2) * 24;
  return <Scene height={250} label="Six node trajectories from time zero to forty, with exact limiting values"><line x1="62" y1="190" x2="315" y2="190" className="sg-axis" /><line x1="62" y1="34" x2="62" y2="190" className="sg-axis" />{[-2, 0, 2, 4].map(value => <g key={value}><line x1="57" y1={py(value)} x2="62" y2={py(value)} className="sg-axis" /><Label x={47} y={py(value) + 5} anchor="end" small>{value}</Label></g>)}{[0, 10, 20, 30, 40].map(time => <Label key={time} x={px(time)} y={216} small>{time}</Label>)}{Array.from(new Set(state.limit)).map(value => <g key={value}><line x1="62" y1={py(value)} x2="310" y2={py(value)} className="sg-limit" /><Label x={308} y={py(value) - 8} anchor="end" small>limit {sf(value)}</Label></g>)}{state.input.map((_, node) => <polyline key={node} points={state.curves.map(sample => `${px(sample.time)},${py(sample.values[node])}`).join(' ')} fill="none" stroke={palette[node % 3]} strokeDasharray={node < 3 ? undefined : '5 3'} strokeWidth="1.6" />)}<line x1={px(state.time)} y1="34" x2={px(state.time)} y2="190" className="sg-threshold" /><Label x={170} y={243} small>Solid A–C; dashed D–F. Time t.</Label></Scene>;
}
