import { useId } from "react";
import { probabilityMass } from "../../data/sampling-measurement-flow-models.js";
import { formatSampling } from "../../data/sampling-measurement-models.js";
import "./sampling-measurement-flow.css";
export const fmt = (v, d = 4) => formatSampling(v, d).replaceAll("-", "−");
export const tones = ["gold", "cyan", "violet", "rose"];
export function Figure({
  job,
  children,
  caption,
  controls
}) {
  return <figure className="sm-figure" data-sm-job={job}>{children}{controls}<figcaption className="sm-caption">{caption}</figcaption></figure>;
}
export function Compare({
  children
}) {
  return <div className="sm-compare">{children}</div>;
}
export function Values({
  children
}) {
  return <div className="sm-values">{children}</div>;
}
export function Table({
  label,
  headers,
  rows
}) {
  return <div className="sm-table-block"><p className="sm-table-title">{label}</p><div className="sm-scroll sm-table-scroll" role="region" tabIndex={0} aria-label={`${label}; use arrow keys to scroll`}><table className="sm-table"><caption className="sm-semantic-caption">{label}</caption><thead><tr>{headers.map((h, i) => <th scope="col" key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Scene({
  label,
  height = 260,
  children
}) {
  const id = useId();
  return <div className="sm-scroll" role="region" tabIndex={0} aria-label={`${label}; use arrow keys to scroll`}><svg className="sm-scene" viewBox={`0 0 340 ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg></div>;
}
export function Label({
  x,
  y,
  children,
  anchor = "middle",
  tone = ""
}) {
  return <text x={x} y={y} textAnchor={anchor} className={`sm-label ${tone ? `sm-${tone}` : ""}`}>{children}</text>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  tone = "gold",
  dashed = false
}) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  if (l === 0) return <circle cx={x1} cy={y1} r={3} className={`sm-${tone}`} />;
  const u = (x2 - x1) / l,
    v = (y2 - y1) / l;
  return <g className={`sm-line sm-${tone}`} strokeDasharray={dashed ? "4 3" : undefined}><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${x2 - 7 * u + 4 * v} ${y2 - 7 * v - 4 * u}L${x2} ${y2}L${x2 - 7 * u - 4 * v} ${y2 - 7 * v + 4 * u}`} /></g>;
}
export function Unit({
  x,
  y,
  id,
  value,
  tone = "gold",
  selected = false,
  missing = false,
  r = 20
}) {
  return <g><circle cx={x} cy={y} r={r} className={`sm-unit sm-${tone} ${selected ? "sm-selected" : ""} ${missing ? "sm-open" : ""}`} /><Label x={x} y={y + 5} tone={tone}>{id}</Label>{value !== undefined && <Label x={x} y={y + r + 24}>{value}</Label>}</g>;
}
export function UnitArray({
  values,
  selected = [],
  eligible = null,
  label = "Fixed units",
  height = 220
}) {
  return <Scene label={label} height={height}><Label x={20} y={24} anchor="start">{label}</Label>{values.map((value, i) => {
      const x = 45 + i % 4 * 82,
        y = 62 + Math.floor(i / 4) * 95;
      return <Unit key={i} x={x} y={y} id={`U${i + 1}`} value={fmt(value)} tone={tones[i % 4]} selected={selected.includes(i)} missing={eligible !== null && !eligible.includes(i)} />;
    })}</Scene>;
}
export function NumberLine({
  label,
  values,
  range = [0, 18],
  target = null,
  mean = null,
  height = 220,
  units = "score",
  unitsY = 193,
  ticks = null
}) {
  const X = v => 45 + (v - range[0]) / (range[1] - range[0]) * 260;
  const ts = ticks || [range[0], (range[0] + range[1]) / 2, range[1]];
  const stacks = new Map();
  const positioned = values.map((v, i) => {
    const value = v.value ?? v,
      row = v.row ?? (stacks.get(value) || 0);
    stacks.set(value, row + 1);
    return {
      value,
      row,
      tone: v.tone || tones[i % 4],
      id: v.id
    };
  });
  return <Scene label={label} height={height}><Label x={20} y={25} anchor="start">{label}</Label><line x1={45} x2={305} y1={140} y2={140} className="sm-axis" />{ts.map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={135} y2={145} className="sm-axis" /><Label x={X(v)} y={168}>{fmt(v)}</Label></g>)}{positioned.map((v, i) => <g key={i}><circle cx={X(v.value)} cy={70 + v.row * 22} r={6} className={`sm-${v.tone || tones[i % 4]}`} />{v.id && <Label x={X(v.value)} y={47 + v.row * 22}>{v.id}</Label>}</g>)}{target !== null && <><line x1={X(target)} x2={X(target)} y1={48} y2={145} className="sm-line sm-rose" /><Label x={X(target)} y={193} tone="rose">target {fmt(target)}</Label></>}{mean !== null && <><path d={`M${X(mean) - 7} 130L${X(mean) + 7} 130L${X(mean)} 117Z`} className="sm-cyan" /><Label x={X(mean)} y={height - 5} tone="cyan">mean {fmt(mean)}</Label></>}<Label x={305} y={unitsY} anchor="end">{units}</Label></Scene>;
}
export function Law({
  label,
  values,
  probabilities = null,
  range = [0, 18],
  target = null,
  selected = null
}) {
  const selectedKey = selected === null ? null : Number(selected.toFixed(10));
  const rows = probabilityMass(values, probabilities),
    X = v => 50 + (v - range[0]) / (range[1] - range[0]) * 255,
    Y = p => 220 - p * 150;
  return <Scene label={label} height={290}><Label x={20} y={25} anchor="start">Probability</Label>{[0, .5, 1].map(p => <g key={p}><line x1={50} x2={305} y1={Y(p)} y2={Y(p)} className="sm-grid" /><Label x={39} y={Y(p) + 5} anchor="end">{p}</Label></g>)}<path d="M50 70V220H305" className="sm-axis" />{rows.map((r, i) => <g key={i}><line x1={X(r.value)} x2={X(r.value)} y1={220} y2={Y(r.mass)} className={`sm-line sm-${r.value === selectedKey ? "gold" : "cyan"}`} /><circle cx={X(r.value)} cy={Y(r.mass)} r={4} className={`sm-${r.value === selectedKey ? "gold" : "cyan"}`} /></g>)}{target !== null && <line x1={X(target)} x2={X(target)} y1={62} y2={220} className="sm-line sm-rose" strokeDasharray="4 3" />}{[range[0], (range[0] + range[1]) / 2, range[1]].map(v => <Label key={v} x={X(v)} y={247}>{fmt(v)}</Label>)}<Label x={170} y={280}>{label}</Label></Scene>;
}
export function Contributions({
  label,
  rows,
  range = [0, 9],
  units = "squared score units"
}) {
  const X = v => 110 + (v - range[0]) / (range[1] - range[0]) * 190,
    height = rows.length * 68 + 92;
  return <Scene label={label} height={height}>{rows.map((r, i) => {
      const y = 32 + i * 68;
      return <g key={i}><Label x={20} y={y + 5} anchor="start">{r.label}</Label><line x1={110} x2={300} y1={y} y2={y} className="sm-grid" /><Arrow x1={X(0)} y1={y} x2={X(r.value)} y2={y} tone={r.tone || "gold"} /><Label x={300} y={y + 28} anchor="end">{fmt(r.value)}</Label></g>;
    })}<line x1={110} x2={300} y1={height - 63} y2={height - 63} className="sm-axis" />{[range[0], (range[0] + range[1]) / 2, range[1]].map(v => <Label key={v} x={X(v)} y={height - 35}>{fmt(v)}</Label>)}<Label x={170} y={height - 5}>{units}</Label></Scene>;
}
export function GroupTree({
  groups = 4,
  repeats = 4,
  label = "Independent units; shared readings"
}) {
  const height = groups * 92 + 42;
  return <Scene label={label} height={height}>{Array.from({
      length: groups
    }, (_, i) => {
      const y = 35 + i * 92;
      return <g key={i}><Unit x={43} y={y} id={`G${i + 1}`} tone={tones[i % 4]} r={22} />{Array.from({
          length: repeats
        }, (__, j) => {
          const x = 100 + j * 200 / Math.max(1, repeats - 1);
          return <g key={j}><Arrow x1={66} y1={y} x2={x} y2={y + 38} tone={tones[i % 4]} /><circle cx={x} cy={y + 43} r={4} className={`sm-${tones[i % 4]}`} /></g>;
        })}<Label x={300} y={y + 72} anchor="end">{repeats} readings share G{i + 1}</Label></g>;
    })}</Scene>;
}
export function AssignmentDrawing({
  state,
  index = 0
}) {
  const a = state.states[index];
  return <Compare><Scene label="Constructed potential outcomes and observed projection" height={580}><Label x={67} y={25}>Y(0)</Label><Label x={232} y={25}>Y(1)</Label>{state.baseline.map((v, i) => {
        const y = 63 + i * 80,
          on = a.indices.includes(i);
        return <g key={i}><Unit x={67} y={y} id={`U${i + 1}`} value={fmt(v)} tone="cyan" selected={!on} /><Unit x={232} y={y} id={`U${i + 1}`} value={fmt(state.treated[i])} tone="gold" selected={on} /><Arrow x1={90} y1={y} x2={210} y2={y} tone={tones[i % 4]} /><Label x={149} y={y - 13}>τ {fmt(state.effects[i])}</Label></g>;
      })}<Label x={170} y={565}>White ring: assigned/observed</Label></Scene><Table label="Actual observed projection" headers={["Unit", "Assigned", "Observed"]} rows={a.observed.map((v, i) => [`U${i + 1}`, a.indices.includes(i) ? "A" : "B", fmt(v)])} /></Compare>;
}
export function FactorialDrawing({
  state
}) {
  const X = a => 75 + a * 210,
    Y = v => 240 - (v - 4) / 14 * 175;
  return <Compare><Table label="Constructed means, score units" headers={["B setting", "A=0", "A=1", "A effect"]} rows={[[0, 10, 12, 2], [1, 9, fmt(state.cells[1][1]), fmt(state.highBEffect)]]} /><Scene label="Conditional A effects at each fixed B" height={320}>{[4, 11, 18].map(v => <g key={v}><line x1={75} x2={285} y1={Y(v)} y2={Y(v)} className="sm-grid" /><Label x={58} y={Y(v) + 5} anchor="end">{v}</Label></g>)}<path d="M75 65V240H285" className="sm-axis" />{state.cells.map((r, i) => <g key={i}><line x1={X(0)} x2={X(1)} y1={Y(r[0])} y2={Y(r[1])} className={`sm-line sm-${i ? "cyan" : "gold"}`} />{r.map((v, j) => <circle key={j} cx={X(j)} cy={Y(v)} r={5} className={`sm-${i ? "cyan" : "gold"}`} />)}<Label x={170} y={25 + i * 24} tone={i ? "cyan" : "gold"}>B={i}: Δ {fmt(r[1] - r[0])}</Label></g>)}<Label x={75} y={267}>A=0</Label><Label x={285} y={267}>A=1</Label><Label x={170} y={310}>Response (score units)</Label></Scene></Compare>;
}
