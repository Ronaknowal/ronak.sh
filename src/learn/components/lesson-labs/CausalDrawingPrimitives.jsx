import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';

export { FlowControls, FlowSlider, FlowReadout };
export const ink = { X: '#EDC267', Y: '#97BFCA', Z: '#B8A6DA', M: '#E6A1B0', C: '#C9B9A5', D: '#B9C9C3', U: '#B9B9C0', low: '#B8A6DA', high: '#E6A1B0' };
export const number = (value, digits = 3) => value == null ? 'unavailable' : Number(value.toFixed(digits)).toString().replaceAll('-', '−');
export function Drawing({ id, label, children, live = false }) {
  return <FlowLab id={id} label={label}><div className="causal-drawing" data-causal-figure={id} data-live={live || undefined}>{children}</div></FlowLab>;
}
export function Columns({ children }) { return <div className="causal-columns">{children}</div>; }
export function Caption({ children }) { return <p className="causal-caption">{children}</p>; }
export function ExactTable({ label, headings, rows }) {
  const id = useId(), [ref, {width, em}] = useGeometry(), [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => { setOverflow(ref.current.scrollWidth > ref.current.clientWidth + 2); }, [width, em, rows]);
  return <div className="causal-table"><p id={id} className="causal-caption">{label}</p>{overflow && <Caption>Scroll horizontally for all columns. Focus the table and use the arrow keys.</Caption>}<div ref={ref} className="causal-table-scroll" tabIndex={0} role="region" aria-labelledby={id}><table aria-labelledby={id}><thead><tr>{headings.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => c === 0 ? <th key={c} scope="row">{cell}</th> : <td key={c}>{cell}</td>)}</tr>)}</tbody></table></div></div>;
}
export function MassStrip({ label, pieces, total = 1, units = 'probability', selected = false }) {
  return <div className="causal-mass-strip"><p>{label}</p><div className="causal-strip" aria-label={label + '; total scale ' + total + ' ' + units}>
    {pieces.filter(p => p.value > 0).map((p, i) => <span key={i} className={(p.hatched ? 'causal-hatched ' : '') + (p.open ? 'causal-open' : '')} style={{ width: (100 * p.value / total) + '%', backgroundColor: p.color, outline: selected ? '1px solid #f3efdf' : undefined }} />)}
  </div><div className="causal-strip-labels">{pieces.map((p, i) => <span key={i}><i style={{ backgroundColor: p.color }} className={p.hatched ? 'causal-hatched' : ''} />{p.label}: {number(p.value)}{p.value === 0 ? ' (empty)' : ''}</span>)}</div></div>;
}
export function Probability({ label, value, color = ink.Y, max = 1, suffix = '' }) {
  return <div className="causal-probability"><p>{label}: <strong>{number(value)}{suffix}</strong></p><div className="causal-probability-track">{value != null && <span style={{ width: (100 * value / max) + '%', backgroundColor: color }} />}</div><div className="causal-scale"><span>0</span><span>{max}</span></div></div>;
}
export function Reset({ onClick }) { return <button type="button" onClick={onClick}>Reset</button>; }

// Measure the actual figure column, including a root-font change after mounting.
export function useGeometry() {
  const ref = useRef(null), [size, setSize] = useState({ width: 400, em: 16 });
  useLayoutEffect(() => {
    const measure = () => {
      const width = ref.current?.getBoundingClientRect().width || 400;
      const em = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(old => old.width === width && old.em === em ? old : { width, em });
    };
    measure();
    const resize = new ResizeObserver(measure); resize.observe(ref.current);
    const mutation = new MutationObserver(measure); mutation.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => { resize.disconnect(); mutation.disconnect(); };
  }, []);
  return [ref, size];
}

export function Plot({ label, children, height = 12, xLabel, yLabel }) {
  const [ref, { width, em }] = useGeometry(), h = height * em, margin = 2 * em;
  const map = { x: v => margin + v * Math.max(1, width - margin * 1.5), y: v => h - margin - v * (h - margin * 1.7), em, width, height: h };
  return <div ref={ref} className="causal-graph"><Caption>{yLabel}</Caption><svg width="100%" height={h} viewBox={'0 0 ' + width + ' ' + h} role="img" aria-label={label}><title>{label}</title><path d={'M' + map.x(0) + ',' + map.y(1) + 'V' + map.y(0) + 'H' + map.x(1)} fill="none" stroke="#a49d92" />{children(map)}</svg><Caption>{xLabel}</Caption></div>;
}

export function Graph({ nodes, edges, positions, observed = [], observedLabel = 'Observed ring', cut = [], forced, dashed = [], undirected = false, joined = [], label, height = 11, active = [], cutLabel = 'incoming assignment removed' }) {
  const [ref, { width, em }] = useGeometry(), uid = useId().replaceAll(':', ''), flat = nodes.every(n => positions[n][1] === positions[nodes[0]][1]), h = (flat ? 4 : height) * em, r = 1.1 * em, margin = 1.65 * em;
  const point = name => { const p = positions[name]; return [margin + p[0] * Math.max(0, width - 2 * margin), margin + p[1] * (h - 2 * margin)]; };
  const pairs = [...edges.map(pair => ({ pair, added: false })), ...joined.map(pair => ({ pair, added: true }))];
  return <div className="causal-graph" ref={ref}><svg width="100%" height={h} viewBox={'0 0 ' + width + ' ' + h} role="img" aria-label={label}>
    <title>{label}</title><defs><marker id={uid} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="#c1bbb1" /></marker></defs>
    {pairs.map(({ pair: [a, b], added }, i) => {
      const [x1, y1] = point(a), [x2, y2] = point(b), length = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / length, dy = (y2 - y1) / length;
      const isCut = cut.some(e => e[0] === a && e[1] === b), traced = active.some(e => e.includes(a) && e.includes(b));
      return <g key={i} opacity={isCut ? .42 : 1}><line x1={x1 + dx * (r + 4)} y1={y1 + dy * (r + 4)} x2={x2 - dx * (r + 7)} y2={y2 - dy * (r + 7)} stroke={traced ? '#f3efdf' : '#b8b3aa'} strokeWidth={traced ? 3 : 1.6} strokeDasharray={isCut || added ? '6 5' : undefined} markerEnd={undirected || added ? undefined : 'url(#' + uid + ')'} />{isCut && <path d={'M' + ((x1 + x2) / 2 - 5) + ',' + ((y1 + y2) / 2 - 7) + 'l10,14m-10,0l10,-14'} fill="none" stroke="#f3efdf" strokeWidth="2" />}</g>;
    })}
    {nodes.map(name => { const [x, y] = point(name), color = ink[name] || ink.U; return <g key={name}>{observed.includes(name) && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#f3efdf" strokeWidth="2" />}<circle cx={x} cy={y} r={r} fill="#171719" stroke={color} strokeWidth="2" strokeDasharray={dashed.includes(name) || name.startsWith('U') ? '5 4' : undefined} /><text x={x} y={y} dominantBaseline="central" textAnchor="middle" fill={color} style={{ fontSize: '.95rem', fontWeight: 600 }}>{name}</text></g>; })}
    {forced && (() => { const [x, y] = point(forced); return <g><path d={'M' + (x - r - em) + ',' + (y + r + em) + 'L' + (x - r * .7) + ',' + (y + r * .7)} stroke={ink.X} strokeWidth="2" markerEnd={'url(#' + uid + ')'} /></g>; })()}
  </svg>{(observed.length > 0 || forced || cut.length > 0 || joined.length > 0) && <Caption>{observed.length > 0 && observedLabel + ': ' + observed.join(', ') + '. '}{forced && 'External assignment: set ' + forced + '. '}{cut.length > 0 && 'Crossed edge: ' + cutLabel + '. '}{joined.length > 0 && 'Dashed links join parents; these are not causal arrows.'}</Caption>}</div>;
}
export const offerPositions = { Z: [.5, 0], X: [0, 1], Y: [1, 1] };
export function OfferGraph({ forced = false, observed = false }) { return <Graph label={forced ? 'Set X; remove Z to X; retain Z to Y and X to Y' : 'Activity Z causes offer X and purchase Y; X also causes Y'} nodes={['Z', 'X', 'Y']} edges={[['Z', 'X'], ['Z', 'Y'], ['X', 'Y']]} positions={offerPositions} cut={forced ? [['Z', 'X']] : []} forced={forced ? 'X' : undefined} observed={observed ? ['X'] : []} />; }

export function Threshold({ label, input, threshold, result, color }) {
  return <div className="causal-threshold"><p>{label}: {number(input)} {input < threshold ? '<' : '≥'} {number(threshold)} → <strong>{result}</strong></p><div className="causal-threshold-track"><span className="causal-threshold-range" style={{ width: (100 * threshold) + '%', background: color }} /><span className="causal-threshold-tick" style={{ left: (100 * threshold) + '%' }} /><span className="causal-input-mark" style={{ left: (100 * input) + '%', color }} /></div><div className="causal-scale"><span>0</span><span>1</span></div><Caption>Triangle: fixed input {number(input)}. Vertical tick: threshold {number(threshold)}.</Caption></div>;
}

export function EffectMark({ label, value, min = -1, max = 1, color = ink.Y, reference, square = false, open = false }) {
  const position = n => 100 * (n - min) / (max - min);
  return <div className="causal-effect"><p>{label}: <strong>{number(value, 6)}</strong></p><div className="causal-effect-axis"><span className="causal-zero" style={{ left: position(0) + '%' }} />{reference != null && <span className="causal-reference" style={{ left: position(reference) + '%' }} />}{value != null && <span className="causal-effect-point" style={{ left: position(value) + '%', background: open ? '#171719' : color, border: '1px solid ' + color, transform: square ? 'translateX(-50%)' : undefined }} />}</div><div className="causal-scale"><span>{number(min)}</span><span>{number(max)}</span></div>{reference != null && <Caption>Dashed reference: {number(reference)}. Solid tick: zero.</Caption>}</div>;
}

export function Interval({ label, low, high, point, min = -1, max = 1 }) {
  const position = n => 100 * (n - min) / (max - min);
  return <div className="causal-effect"><p>{label}</p><div className="causal-effect-axis"><span className="causal-zero" style={{ left: position(0) + '%' }} /><span className="causal-interval-line" style={{ left: position(low) + '%', width: (position(high) - position(low)) + '%' }} />{point != null && <span className="causal-effect-point" style={{ left: position(point) + '%', background: ink.X }} />}</div><div className="causal-scale"><span>{number(min)}</span><span>{number(max)}</span></div><p>Endpoints: {number(low, 6)} to {number(high, 6)}{point != null && '; estimate: ' + number(point, 6)}.</p></div>;
}
