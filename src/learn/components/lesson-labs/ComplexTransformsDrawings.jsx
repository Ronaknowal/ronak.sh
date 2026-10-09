import { Children, useId } from "react";
import { dft, multiplyComplex, finiteExponentialIntegral, filterResponse, harmonicValue, sinc } from "../../data/complex-transforms-models.js";
import "./complex-transforms-flow.css";
const TAU = 2 * Math.PI;
const fmt = (v, d = 5) => Math.abs(v) < 1e-12 ? "0" : Math.abs(v) >= 1e5 || Math.abs(v) < 1e-4 ? v.toExponential(3) : Number(v.toFixed(d)).toString();
const ctext = (z) => `${fmt(z[0])}${z[1] < -1e-12 ? "\u2212" : "+"}${fmt(Math.abs(z[1]))}i`;
const unit = (a) => [Math.cos(a), Math.sin(a)];
const values = (f, a, b, n = 256) => Array.from({ length: n + 1 }, (_, i) => {
  const x = a + (b - a) * i / n;
  return [x, f(x)];
});
function Figure({ children, caption, controls, id }) {
  return <figure className="complex-flow-figure" data-complex-view={id}>{children}{controls}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
function Compare({ children }) {
  return <div className="cx-compare">{Children.map(children, child => <div className="cx-panel">{child}</div>)}</div>;
}
function Label({ x, y, children, tone = "", anchor = "middle" }) {
  return <text x={x} y={y} textAnchor={anchor} className={`cx-label ${tone}`}>{children}</text>;
}
function Scene({ label, height = 310, children }) {
  return <svg className="cx-scene" viewBox={`0 0 360 ${height}`} role="img" aria-label={label}>{children}</svg>;
}
function Arrow({ a, b, tone = "gold", dashed = false }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  if (len < 1e-8) return <circle cx={a[0]} cy={a[1]} r="3" className={`cx-point ${tone}`} />;
  const ux = dx / len, uy = dy / len, s = Math.min(8, len / 3);
  return <g className={`cx-arrow ${tone} ${dashed ? "dashed" : ""}`}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><path d={`M${b[0] - s * ux + s * 0.45 * uy},${b[1] - s * uy - s * 0.45 * ux}L${b[0]},${b[1]}L${b[0] - s * ux - s * 0.45 * uy},${b[1] - s * uy + s * 0.45 * ux}`} /></g>;
}
function Ledger({ items }) {
  return <dl className="cx-ledger">{items.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>;
}
function Table({ headers, rows, label }) {
  return <div className="cx-scroll" role="region" tabIndex="0" aria-label={`${label}. Use left and right arrow keys if this table is wider than the view.`}><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
function Range({ label, value, onChange, min, max, step = 1, display }) {
  return <label className="cx-control"><span>{label}: <output>{display ?? fmt(value)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}
function Choice({ label, value, onChange, options }) {
  return <label className="cx-control"><span>{label}</span><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>;
}
function Controls({ children, onReset }) {
  return <div className="cx-controls">{children}<button type="button" onClick={onReset}>Reset</button></div>;
}
function Plot({ label, xRange, yRange, xLabel, yLabel, lines = [], dots = [], stems = [], cursor, areas = [], children }) {
  const id = useId().replaceAll(":", ""), left = 66, right = 328, top = 42, bottom = 228, X = (x) => left + (x - xRange[0]) * (right - left) / (xRange[1] - xRange[0]), Y = (y) => bottom - (y - yRange[0]) * (bottom - top) / (yRange[1] - yRange[0]);
  const p = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x)},${Y(y)}`).join(" ");
  return <><Scene label={`${label}; ${xLabel} from ${xRange.join(" to ")}, ${yLabel} from ${yRange.join(" to ")}`}><defs><clipPath id={id}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath><clipPath id={id + "negative"}><rect x={left} y={Math.max(top, Math.min(bottom, Y(0)))} width={right - left} height={Math.max(0, bottom - Math.max(top, Math.min(bottom, Y(0))))} /></clipPath><pattern id={id + "hatch"} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-1,7L7,-1M3,11L11,3" stroke="#d7d7d7" strokeWidth="1" /></pattern></defs>{[yRange[0], (yRange[0] + yRange[1]) / 2, yRange[1]].map((v) => <g key={v}><line x1={left} x2={right} y1={Y(v)} y2={Y(v)} className="cx-grid" /><Label x={left - 8} y={Y(v) + 5} anchor="end">{fmt(v, 3)}</Label></g>)}{[xRange[0], (xRange[0] + xRange[1]) / 2, xRange[1]].map((v, i) => <Label key={v} x={X(v)} y={255} anchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>{fmt(v, 3)}</Label>)}<path d={`M${left},${top}V${bottom}H${right}`} className="cx-axis" />{yRange[0] < 0 && yRange[1] > 0 && <line x1={left} x2={right} y1={Y(0)} y2={Y(0)} className="cx-zero" />}<g clipPath={`url(#${id})`}>{areas.map((area, i) => {
    const path = `M${X(area.points[0][0])},${Y(0)}${p(area.points).replace(/^M/, "L")}L${X(area.points.at(-1)[0])},${Y(0)}Z`;
    return <g key={i}><path className={`cx-area ${area.tone ?? "gold"}`} d={path} /><path d={path} fill={`url(#${id}hatch)`} clipPath={`url(#${id}negative)`} /></g>;
  })}{lines.map((line, i) => <path key={i} d={p(line.points)} className={`cx-line ${line.tone ?? "gold"} ${line.dashed ? "dashed" : ""}`} />)}{stems.map((series, i) => <g key={i}>{series.points.map(([x, y], j) => <g key={j}><line x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(y)} className={`cx-stem ${series.tone ?? "gold"}`} /><circle cx={X(x)} cy={Y(y)} r="3.2" className={`cx-point ${series.tone ?? "gold"} ${series.hollow ? "open" : ""}`} /></g>)}</g>)}{dots.map((point, i) => <circle key={i} cx={X(point.x)} cy={Y(point.y)} r={point.r ?? 4} className={`cx-point ${point.tone ?? "gold"} ${point.open ? "open" : ""}`} />)}{cursor !== void 0 && <line x1={X(cursor)} x2={X(cursor)} y1={top} y2={bottom} className="cx-cursor" />}{children?.({ X, Y, left, right, top, bottom })}</g></Scene><p className="cx-axis-caption">Horizontal: {xLabel}. Vertical: {yLabel}.</p></>;
}
function Plane({ label, extent = 3, vectors = [], points = [], curves = [], circle, children, unitLabel = "dimensionless" }) {
  const X = (x) => 180 + x * 118 / extent, Y = (y) => 158 - y * 118 / extent;
  return <><Scene label={`${label}; equal real and imaginary coordinate scales \xB1${extent} ${unitLabel}`} height={340}><line x1="44" x2="316" y1="158" y2="158" className="cx-axis" /><line x1="180" x2="180" y1="22" y2="294" className="cx-axis" /><Label x="310" y="182" anchor="end">Re</Label><Label x="188" y="26" anchor="start">Im</Label><Label x="166" y="180">0</Label><Label x={X(-extent)} y="205">−{fmt(extent)}</Label><Label x={X(extent)} y="205">{fmt(extent)}</Label>{circle !== void 0 && <circle cx="180" cy="158" r={118 * circle / extent} className="cx-ring" />}{curves.map((c, i) => <path key={i} d={c.points.map(([x, y], j) => `${j ? "L" : "M"}${X(x)},${Y(y)}`).join(" ")} className={`cx-line ${c.tone ?? "gold"} ${c.dashed ? "dashed" : ""}`} />)}{vectors.map((v, i) => {
    const a = v.start ?? [0, 0], b = v.end;
    return <Arrow key={i} a={[X(a[0]), Y(a[1])]} b={[X(b[0]), Y(b[1])]} tone={v.tone ?? "gold"} dashed={v.dashed} />;
  })}{points.map((v, i) => <circle key={i} cx={X(v.at[0])} cy={Y(v.at[1])} r="4" className={`cx-point ${v.tone ?? "gold"} ${v.open ? "open" : ""}`} />)}{children?.({ X, Y })}<Label x="166" y={Y(extent) + 5} anchor="end">{fmt(extent)}</Label><Label x="166" y={Y(-extent) + 5} anchor="end">−{fmt(extent)}</Label></Scene><p className="cx-plane-units">Coordinate units: {unitLabel}. The real and imaginary axes use the same numerical scale.</p></>;
}
function PolarGuide({ X, Y, phase, radius, tone = "rose" }) {
  if (phase === null || radius === 0) return null;
  const arc = values((a) => a, 0, phase, 80).map(([a]) => [X(Math.cos(a) * radius * 0.32), Y(Math.sin(a) * radius * 0.32)]);
  return <><path d={arc.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")} className={`cx-line ${tone}`} /><circle cx={X(0)} cy={Y(0)} r={Math.abs(X(radius) - X(0))} className="cx-ring" /></>;
}
function ProjectionGuide({ X, Y, point, tone = "gold" }) {
  return <><path d={`M${X(point[0])},${Y(point[1])}V${Y(0)}`} className="cx-reference" /><circle cx={X(point[0])} cy={Y(0)} r="4" className={`cx-point ${tone}`} /></>;
}
function SignalPlot({ phase = Math.PI / 2, time, offset = 0 }) {
  return <Plot label="First tone gold, third tone cyan dashed, real sum rose" xRange={[0, 1]} yRange={[-3 - Math.abs(offset), 3 + Math.abs(offset)]} xLabel="time (s)" yLabel="signal (V)" cursor={time} lines={[{ points: values((t) => 2 * Math.cos(TAU * t), 0, 1) }, { points: values((t) => Math.cos(3 * TAU * t + phase), 0, 1), tone: "blue", dashed: true }, { points: values((t) => harmonicValue(t, [2, 1], phase, offset), 0, 1), tone: "rose" }]} />;
}
function CoefficientStems({ phase = Math.PI / 2, offset = 0 }) {
  return <Compare><Plot label="Real coefficients" xRange={[-4, 4]} yRange={[-2.2, 2.2]} xLabel="harmonic k (Hz for T=1 s)" yLabel="Re(cₖ) (V)" stems={[{ points: [[-1, 1], [1, 1]] }, { points: [[-3, 0.5 * Math.cos(phase)], [3, 0.5 * Math.cos(phase)]], tone: "blue" }, { points: [[0, offset]], tone: "rose" }]} /><Plot label="Imaginary coefficients" xRange={[-4, 4]} yRange={[-2.2, 2.2]} xLabel="harmonic k (Hz for T=1 s)" yLabel="Im(cₖ) (V)" stems={[{ points: [[-3, -0.5 * Math.sin(phase)], [3, 0.5 * Math.sin(phase)]], tone: "blue" }]} /></Compare>;
}
function FiniteTransformDrawing({ samples, bin }) {
  const F = dft(samples), parts = samples.map((x, n) => multiplyComplex([x, 0], unit(-TAU * n * bin / samples.length))), bound = Math.max(1, samples.reduce((s, x) => s + Math.abs(x), 0)), running = [[0, 0]];
  parts.forEach((p) => running.push([running.at(-1)[0] + p[0], running.at(-1)[1] + p[1]]));
  return <><Compare><Plot label="Committed indexed real samples" xRange={[-0.5, samples.length - 0.5]} yRange={[-4.5, 4.5]} xLabel="sample n" yLabel="sample value (V)" stems={[{ points: samples.map((x, n) => [n, x]) }]} /><Plane label={`Actual tip-to-tail contributions for bin ${bin}; sum ${ctext(F[bin])}`} extent={bound * 1.15} unitLabel="coefficient (V)" vectors={parts.map((p, n) => ({ start: running[n], end: running[n + 1], tone: ["gold", "blue", "rose", "violet"][n % 4] }))} points={[{ at: F[bin], tone: "rose" }]} /></Compare><p>Each source index keeps its labelled contribution in the ledger. All bins of this committed record share extent ±{fmt(bound * 1.15)} V; the bound changes only when the committed record changes.</p><Table label="Source indices, rotation weights and actual contributions" headers={["n", "x[n]", "weight", "contribution"]} rows={samples.map((x, n) => [n, fmt(x), ctext(unit(-TAU * n * bin / samples.length)), ctext(parts[n])])} /><Ledger items={[[`X[${bin}]`, ctext(F[bin])], ["inverse", dft(F, true).map(ctext).join(", ")], ["time energy (V\xB2)", fmt(samples.reduce((s, x) => s + x * x, 0))], ["\u03A3|X|\xB2/N (V\xB2)", fmt(F.reduce((s, z) => s + z[0] ** 2 + z[1] ** 2, 0) / samples.length)]]} /></>;
}
function WindowDrawing({ state, compare }) {
  return <><Compare><Plot label="Actual window weights" xRange={[0, state.count / 64]} yRange={[0, 1.1]} xLabel="time (s)" yLabel="weight (dimensionless)" lines={[{ points: state.weights.map((w, n) => [n / 64, w]) }]} /><Plot label="Actual weighted observations" xRange={[0, state.count / 64]} yRange={[-1.2, 1.2]} xLabel="time (s)" yLabel="weighted sample (V)" stems={[{ points: state.weighted.map((x, n) => [n / 64, x]) }]} /></Compare><Plot label="Finite record transform; primary gold and comparison cyan" xRange={[0, 12]} yRange={[0, 1.3]} xLabel="frequency (Hz)" yLabel="normalized amplitude (V)" lines={[{ points: state.curve.map((r) => [r.frequency, r.amplitude]) }, ...compare ? [{ points: compare.curve.map((r) => [r.frequency, r.amplitude]), tone: "blue", dashed: true }] : []]} dots={state.bins.filter((r) => r.frequency <= 12).map((r) => ({ x: r.frequency, y: r.amplitude, r: 2 }))} /><Ledger items={[[`N=${state.count}, M=${state.paddedCount}`, "same observations; added zeros change grid"], ["grid spacing (Hz)", fmt(state.gridSpacing)], ["last observed time (s)", fmt((state.count - 1) / 64)], ["continuation period (s)", fmt(state.count / 64)], ["\u03A3w, \u03A3w\xB2", `${fmt(state.weightSum)}, ${fmt(state.weightSquares)}`], ["density sum \xD7 spacing (V\xB2)", fmt(state.densityIntegral)]]} /></>;
}
function RocDrawing({ side = "right", sigma = 0, omega = 1, strip = false }) {
  const X = (x) => 66 + (x + 3) * 262 / 6, Y = (y) => 228 - (y + 4) * 186 / 8;
  return <Scene label={strip ? "Open strip \u22121<sigma<1; imaginary axis inside" : `Open ${side} ROC with pole \u22121; selected sigma${sigma}, omega${omega}`}><rect x={strip ? X(-1) : side === "right" ? X(-1) : X(-3)} y="42" width={strip ? X(1) - X(-1) : side === "right" ? X(3) - X(-1) : X(-1) - X(-3)} height="186" className="cx-roc" /><line x1={X(0)} x2={X(0)} y1="42" y2="228" className="cx-axis" /><line x1="66" x2="328" y1={Y(0)} y2={Y(0)} className="cx-axis" />{[-1, ...strip ? [1] : []].map((v) => <g key={v}><line x1={X(v)} x2={X(v)} y1="42" y2="228" className="cx-cursor" /><Label x={X(v)} y="256">{v}</Label><Label x={X(v)} y={Y(0) - 12} tone="rose">×</Label></g>)}<circle cx={X(sigma)} cy={Y(omega)} r="5" className="cx-point gold" /><Label x="66" y="23" anchor="start">ω (rad/s)</Label><Label x="196" y="291">σ (s⁻¹); shaded domain is open</Label><Label x={X(0) + 12} y={Y(0) + 20}>0</Label></Scene>;
}
function StartupDrawing({ rate = TAU, phase = Math.PI / 2, initial = 0, time = 0 }) {
  const s = filterResponse(rate, phase, initial);
  return <><Plot label="Steady cyan dashed, initial correction gold, total rose" xRange={[0, 2]} yRange={[-6.5, 6.5]} xLabel="time (s)" yLabel="output (V)" cursor={time} lines={[{ points: s.points.map((p) => [p.time, p.transient]) }, { points: s.points.map((p) => [p.time, p.steady]), tone: "blue", dashed: true }, { points: s.points.map((p) => [p.time, p.total]), tone: "rose" }]} /><Ledger items={[["steady at cursor (V)", fmt(s.points[Math.round(time * 256)].steady)], ["initial correction at cursor (V)", fmt(s.points[Math.round(time * 256)].transient)], ["total at cursor (V)", fmt(s.points[Math.round(time * 256)].total)], ["initial output (V)", fmt(initial)]]} /></>;
}
function signedLog(v) {
  return Math.sign(v) * Math.log10(1 + Math.abs(v));
}
export {
  Arrow,
  Choice,
  CoefficientStems,
  Compare,
  Controls,
  Figure,
  FiniteTransformDrawing,
  Label,
  Ledger,
  Plane,
  Plot,
  PolarGuide,
  ProjectionGuide,
  Range,
  RocDrawing,
  Scene,
  SignalPlot,
  StartupDrawing,
  TAU,
  Table,
  WindowDrawing,
  ctext,
  dft,
  finiteExponentialIntegral,
  fmt,
  signedLog,
  sinc,
  unit,
  values
};
