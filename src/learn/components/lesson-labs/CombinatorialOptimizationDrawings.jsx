import { useId } from "react";
import { MATROID_PRESETS } from "../../data/combinatorial-optimization-models.js";
import { members, distance, ROUTE_POINTS } from "../../data/combinatorial-optimization-flow-models.js";
import "./combinatorial-optimization-flow.css";
const ink = ["#e6ad68", "#77bfd0", "#b79ad8", "#e6a1ad", "#a3b8db", "#d7cfb2"];
const fmt = (value) => value === null || value === void 0 ? "undefined" : value === Infinity ? "\u221E" : value === -Infinity ? "\u2212\u221E" : typeof value === "number" ? Number(value.toFixed(6)).toString() : String(value);
const sum = (values) => values.reduce((a, b) => a + b, 0);
function Figure({ id, title, caption, children }) {
  return <figure className="co-figure" data-co-mechanism={id} aria-label={title}><div className="co-figure-name">{title}</div>{children}<figcaption>{caption}</figcaption></figure>;
}
function Scene({ title, description = "", width = 620, height = 360, children }) {
  const id = useId();
  return <div className="co-scene"><p className="co-window-hint">Focus the diagram and use arrow keys to read its full width when it extends beyond the window.</p><div className="co-svg-scroll" role="region" tabIndex={0} aria-label={`${title}: diagram window`}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title ${id}-desc`} style={{ minWidth: `${width / 16}rem` }}><title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{description}</desc>{children}</svg></div></div>;
}
function Label({ x, y, children, color = "#d4dbe6", anchor = "middle", ...props }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color} {...props}>{children}</text>;
}
function Arrow({ from, to, color = ink[0], dashed = false, width = 2, label = null }) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const tip = [to, [to[0] - 8 * Math.cos(angle - 0.4), to[1] - 8 * Math.sin(angle - 0.4)], [to[0] - 8 * Math.cos(angle + 0.4), to[1] - 8 * Math.sin(angle + 0.4)]];
  return <g><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={width} strokeDasharray={dashed ? "5 4" : void 0} />{Math.hypot(to[0] - from[0], to[1] - from[1]) > 1 && <polygon points={tip.map((p) => p.join(",")).join(" ")} fill={color} />} {label !== null && <Label x={(from[0] + to[0]) / 2} y={(from[1] + to[1]) / 2 - 12} color={color}>{label}</Label>}</g>;
}
function Table({ label, headers, rows, tall = false, cellClass = null }) {
  return <><div className="co-array-name">{label}</div><p className="co-window-hint">{tall ? "All rows retained. " : ""}Focus this table and use arrow keys to read its full extent.</p><div className={`co-table-scroll${tall ? " co-table-scroll--tall" : ""}`} role="region" tabIndex={0} aria-label={label}><table><caption>{label}</caption><thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={cellClass?.(i, j)}>{fmt(v)}</td>)}</tr>)}</tbody></table></div></>;
}
function Compare({ children }) {
  return <div className="co-comparison">{children}</div>;
}
function Matrix({ title, values, rowNames = null, columnNames = null, selected = [], sums = false }) {
  const columns = values[0]?.length ?? 0, cell = Math.max(72, ...values.flat().map((v) => fmt(v).length * 9 + 22));
  const left = 86, top = 54, width = left + (columns + Number(sums)) * cell + 28, height = top + values.length * 61 + (sums ? 60 : 25);
  return <Scene title={title} width={width} height={height} description="Each cell retains its row and column address. A crossed-out cell is unavailable, not a zero cost.">{Array.from({ length: columns }, (_, j) => <Label key={j} x={left + cell * (j + 0.5)} y={27}>{columnNames?.[j] ?? j}</Label>)}{values.map((row, i) => <g key={i}><Label x={left - 16} y={top + i * 61 + 30} anchor="end">{rowNames?.[i] ?? i}</Label>{row.map((v, j) => <g key={j}><rect x={left + cell * j} y={top + 61 * i} width={cell - 9} height="47" fill={ink[i % ink.length]} fillOpacity={selected.some(([a, b]) => a === i && b === j) ? ".3" : ".07"} stroke={selected.some(([a, b]) => a === i && b === j) ? "#f0f2f7" : "#596879"} strokeWidth={selected.some(([a, b]) => a === i && b === j) ? 2.5 : 1} /><Label x={left + cell * j + (cell - 9) / 2} y={top + 61 * i + 30} color={ink[i % ink.length]}>{v === null ? "\xD7" : fmt(v)}</Label></g>)}{sums && <Label x={left + cell * (columns + 0.4)} y={top + 61 * i + 30}>{sum(row)}</Label>}</g>)}{sums && <>{Array.from({ length: columns }, (_, j) => <Label key={j} x={left + cell * (j + 0.5)} y={top + values.length * 61 + 26}>{sum(values.map((r) => r[j]))}</Label>)}<Label x={left - 16} y={top + values.length * 61 + 26} anchor="end">Σ</Label></>}</Scene>;
}
const smallNodes = (count = 4) => count === 2 ? [{ x: 150, y: 130, label: "A" }, { x: 420, y: 130, label: "B" }] : count === 3 ? [{ x: 280, y: 68, label: "A" }, { x: 110, y: 248, label: "B" }, { x: 450, y: 248, label: "C" }] : [{ x: 130, y: 75, label: "A" }, { x: 440, y: 75, label: "B" }, { x: 440, y: 250, label: "C" }, { x: 130, y: 250, label: "D" }].slice(0, count);
function Graph({ title, nodes, edges, selectedNodes = [], highlight = [], selectedEdges = [], directed = false, width = 620, height = 360, degree = null }) {
  const seen = /* @__PURE__ */ new Map();
  const keys = edges.map((e) => [e.a, e.b].sort((a, b) => a - b).join(":"));
  const totals = keys.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
  return <Scene title={title} width={width} height={height} description="Node locations are illustrative and stay fixed across related states. Labels give the actual cost or load; geometric edge length is not that quantity.">{edges.map((e, i) => {
    const a = nodes[e.a], b = nodes[e.b], key = keys[i], lane = (seen.get(key) || 0) - (totals[key] - 1) / 2;
    seen.set(key, (seen.get(key) || 0) + 1);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), orientation = e.a < e.b ? 1 : -1, nx = -dy / len * orientation, ny = dx / len * orientation, offset = lane * 32;
    const p = [a.x + 20 * dx / len, a.y + 20 * dy / len], q = [b.x - 20 * dx / len, b.y - 20 * dy / len], c = [(a.x + b.x) / 2 + offset * nx, (a.y + b.y) / 2 + offset * ny];
    const labelT = e.labelT ?? 0.5, labelPoint = [
      (1 - labelT) ** 2 * p[0] + 2 * (1 - labelT) * labelT * c[0] + labelT ** 2 * q[0],
      (1 - labelT) ** 2 * p[1] + 2 * (1 - labelT) * labelT * c[1] + labelT ** 2 * q[1]
    ];
    const color = e.color || (highlight.includes(i) ? "#f4f5f8" : selectedEdges.includes(i) ? ink[0] : e.added ? ink[2] : "#7f90a4");
    const angle = Math.atan2(q[1] - c[1], q[0] - c[0]);
    const tip = [q, [q[0] - 8 * Math.cos(angle - 0.4), q[1] - 8 * Math.sin(angle - 0.4)], [q[0] - 8 * Math.cos(angle + 0.4), q[1] - 8 * Math.sin(angle + 0.4)]];
    return <g key={e.id ?? i}><title>{`${a.label} to ${b.label}; ${e.label ?? e.cost ?? ""}`}</title><path d={`M${p} Q${c} ${q}`} stroke={color} strokeWidth={highlight.includes(i) || selectedEdges.includes(i) ? 3 : 1.5} fill="none" strokeDasharray={e.dashed ? "5 4" : void 0} />{(directed || e.directed) && <polygon points={tip.map((p2) => p2.join(",")).join(" ")} fill={color} />} {(e.label !== void 0 || e.cost !== void 0) && <Label x={labelPoint[0] + nx * 14} y={labelPoint[1] + ny * 14 - 5} color={color} stroke="#080808" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">{e.label ?? e.cost}</Label>}</g>;
  })}{nodes.map((n, i) => <g key={i}><circle cx={n.x} cy={n.y} r="19" fill={ink[i % ink.length]} fillOpacity={selectedNodes.includes(i) ? ".3" : ".1"} stroke={selectedNodes.includes(i) ? "#f0f2f7" : ink[i % ink.length]} strokeWidth={selectedNodes.includes(i) ? 3 : 1.5} /><Label x={n.x} y={n.y + 5} color={ink[i % ink.length]}>{n.label}</Label>{n.detail !== void 0 && <Label x={n.x} y={n.y + 42}>{n.detail}</Label>}{degree && <Label x={n.x} y={n.y - 29}>{`d=${degree[i]}`}</Label>}</g>)}</Scene>;
}
function Assignment({ title, costs, pairs = [], completeNetwork = false, residual = null, path = [], potentials = null }) {
  const n = costs.length, m = costs[0].length, height = Math.max(280, 80 + Math.max(n, m) * 95);
  const nodes = [...Array.from({ length: n }, (_, i) => ({ x: 165, y: 60 + i * 95, label: String.fromCharCode(65 + i) })), ...Array.from({ length: m }, (_, j) => ({ x: 465, y: 60 + j * 95, label: String(j + 1) })), { x: 42, y: height / 2 - 12, label: "s" }, { x: 592, y: height / 2 - 12, label: "t" }];
  if (potentials) nodes.forEach((node, i) => {
    node.detail = `p ${fmt(potentials[i])}`;
  });
  const edges = residual ? residual.filter((a) => a.residual > 0).map((a) => ({ a: a.from, b: a.to, cost: a.cost, label: `c ${a.cost} / r ${a.residual}`, directed: true, color: a.forward ? "#7f90a4" : ink[2] })) : costs.flatMap((row, i) => row.flatMap((c, j) => c === null ? [] : [{ a: i, b: n + j, cost: c }]));
  if (completeNetwork && !residual) {
    for (let i = 0; i < n; i++) edges.push({ a: n + m, b: i, label: "c0 / u1", directed: true });
    for (let j = 0; j < m; j++) edges.push({ a: n + j, b: n + m + 1, label: "c0 / u1", directed: true });
  }
  edges.forEach((edge) => {
    const workerToJob = edge.a < n && edge.b >= n && edge.b < n + m;
    const jobToWorker = edge.b < n && edge.a >= n && edge.a < n + m;
    if (workerToJob || jobToWorker) edge.labelT = workerToJob ? 0.23 : 0.77;
  });
  const chosen = residual ? [] : edges.map((e, i) => pairs.some((p) => p.worker === e.a && n + p.job === e.b) ? i : null).filter((i) => i !== null);
  const highlighted = residual ? edges.map((e, i) => path.some((p) => p.from === e.a && p.to === e.b) ? i : null).filter((i) => i !== null) : [];
  return <Graph title={title} nodes={completeNetwork || residual ? nodes : nodes.slice(0, n + m)} edges={edges} selectedEdges={chosen} highlight={highlighted} directed={completeNetwork || !!residual} width={640} height={height} />;
}
function Ruler({ title, min = 0, max, unit, marks, ticks = null }) {
  const scale = 440 / (max - min), x = (v) => 75 + (v - min) * scale, height = 150 + marks.length * 35;
  return <Scene title={title} width={620} height={height} description={`Common ${unit} ruler from ${min} through ${max}. Marks use actual quantities.`}><Label x={75} y={25} anchor="start">{unit}</Label><path d="M75 70H515" stroke="#8798ad" />{(ticks || [.../* @__PURE__ */ new Set([min, ...min < 0 && max > 0 ? [0] : [], max])]).map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1="64" y2="76" stroke="#a0b0c3" /><Label x={x(t)} y={98}>{fmt(t)}</Label></g>)}{marks.map((m, i) => <g key={i}><line x1={x(m.value)} x2={x(m.value)} y1="70" y2={121 + i * 35} stroke={m.color || ink[i % ink.length]} strokeDasharray={m.dashed ? "4 4" : void 0} /><circle cx={x(m.value)} cy="70" r="4" fill={m.color || ink[i % ink.length]} /><Label x={x(m.value)} y={140 + i * 35} color={m.color || ink[i % ink.length]}>{`${m.label} ${fmt(m.value)}`}</Label></g>)}</Scene>;
}
function Intervals({ title, selected = [0, 1, 2], overlaps = [], weights = [3, 2, 2] }) {
  const intervals = [[0, 2], [0, 1], [1, 2]], X = (t) => 80 + t * 195;
  return <Scene title={title} width={620} height={300} description="The time ruler uses identical units in every interval state. Left endpoints are included; right endpoints are open."><path d="M80 250H470" stroke="#8596a9" />{[0, 1, 2].map((t) => <Label key={t} x={X(t)} y={276}>{t}</Label>)}<Label x={535} y={276}>time</Label>{intervals.map(([a, b], i) => <g key={i}><Label x={60} y={58 + i * 65} anchor="end">{String.fromCharCode(65 + i)}</Label><line x1={X(a)} x2={X(b)} y1={52 + i * 65} y2={52 + i * 65} stroke={ink[i]} strokeWidth={selected.includes(i) ? 10 : 3} opacity={selected.includes(i) ? 0.95 : 0.35} /><circle cx={X(a)} cy={52 + i * 65} r="5" fill={ink[i]} /><circle cx={X(b)} cy={52 + i * 65} r="5" stroke={ink[i]} fill="#080808" /><Label x={535} y={58 + i * 65} color={ink[i]}>v {weights[i]}</Label></g>)}{overlaps.map(([a, b], i) => {
    const lo = Math.max(intervals[a][0], intervals[b][0]), hi = Math.min(intervals[a][1], intervals[b][1]);
    return <g key={i}><rect x={X(lo)} y={32 + a * 65} width={X(hi) - X(lo)} height="39" fill={ink[3]} fillOpacity=".15" /><Label x={(X(lo) + X(hi)) / 2} y={25 + a * 65} color={ink[3]}>× overlap</Label></g>;
  })}</Scene>;
}
function Independence({ title, kind, mask, weights = null }) {
  const p = MATROID_PRESETS[kind], selected = members(mask, p.names.length);
  if (kind === "intervals") {
    const overlaps = selected.flatMap((a, i) => selected.slice(i + 1).filter((b) => Math.max(p.intervals[a][0], p.intervals[b][0]) < Math.min(p.intervals[a][1], p.intervals[b][1])).map((b) => [a, b]));
    return <Intervals title={title} selected={selected} overlaps={overlaps} weights={weights || p.weights} />;
  }
  if (kind === "graphic") return <Graph title={title} nodes={smallNodes()} edges={p.edges.map(([a, b], i) => ({ a, b, label: `${p.names[i]} \xB7 ${(weights || p.weights)[i]}`, dashed: !selected.includes(i) }))} selectedEdges={selected} />;
  return <Scene title={title} width={620} height={185} description="Four labelled candidates; at most two selected incidences may enter the two actual slots.">{p.names.map((n, i) => <g key={i}><circle cx={90 + i * 125} cy="60" r="23" fill={ink[i]} fillOpacity={selected.includes(i) ? ".3" : ".08"} stroke={selected.includes(i) ? "#eff1f6" : ink[i]} /><Label x={90 + i * 125} y={65} color={ink[i]}>{n}</Label><Label x={90 + i * 125} y={104}>v {(weights || p.weights)[i]}</Label></g>)}{selected.map((i, slot) => <Arrow key={i} from={[90 + i * 125, 86]} to={[235 + slot * 90, 141]} color={ink[i]} />)}{[0, 1].map((i) => <rect key={i} x={215 + i * 90} y="142" width="45" height="30" fill="none" stroke="#a0acbb" />)}</Scene>;
}
function Incidence({ title, sets, universeSize = 6, selected = [], covered = 0, added = [], charges = null }) {
  const left = 105, slot = 72, top = 68, width = left + slot * universeSize + 120, height = top + sets.length * 68 + (charges ? 115 : 55);
  return <Scene title={title} width={width} height={height} description="Columns are individual requirements; a filled dot is membership in the test row. White outlines mark selected tests; highlighted lower dots are already covered requirements.">{Array.from({ length: universeSize }, (_, e) => <Label key={e} x={left + e * slot} y="28">{e + 1}</Label>)}{sets.map((s, i) => <g key={i}><Label x={left - 32} y={top + i * 68 + 5} color={ink[i % ink.length]} anchor="end">{s.name}</Label><Label x={left - 32} y={top + i * 68 + 26} anchor="end">c {s.cost}</Label>{selected.includes(i) && <rect x={left - 20} y={top + i * 68 - 21} width={slot * universeSize - 26} height="42" rx="2" fill="none" stroke="#eff1f7" />}{Array.from({ length: universeSize }, (_, e) => <g key={e}><circle cx={left + e * slot} cy={top + i * 68} r="11" fill={s.elements.includes(e) ? ink[i % ink.length] : "none"} fillOpacity={s.elements.includes(e) ? ".65" : "0"} stroke={s.elements.includes(e) ? ink[i % ink.length] : "#3f4b5c"} />{s.elements.includes(e) && <line x1={left + e * slot} x2={left + e * slot} y1={top + i * 68 + 12} y2={top + sets.length * 68 + 5} stroke={ink[i % ink.length]} strokeOpacity={selected.includes(i) ? ".5" : ".1"} strokeDasharray={selected.includes(i) ? void 0 : "3 4"} />}</g>)}</g>)}{Array.from({ length: universeSize }, (_, e) => <g key={e}><circle cx={left + e * slot} cy={top + sets.length * 68 + 15} r="14" fill={covered & 1 << e ? "#ced9e9" : "#080808"} fillOpacity={covered & 1 << e ? ".3" : "1"} stroke={added.includes(e) ? "#f4f6fb" : "#6e7d91"} strokeWidth={added.includes(e) ? 3 : 1} /><Label x={left + e * slot} y={top + sets.length * 68 + 20}>{covered & 1 << e ? "\u2713" : "\xD7"}</Label>{charges && <Label x={left + e * slot} y={top + sets.length * 68 + 65}>{fmt(charges[e])}</Label>}</g>)}{charges && <Label x={left - 32} y={top + sets.length * 68 + 65} anchor="end">charge</Label>}</Scene>;
}
function Capacity({ title, items, capacity, amounts }) {
  const scale = 430 / Math.max(15, capacity), X = (v) => 75 + scale * v;
  let total = 0;
  return <Scene title={title} width={620} height={230} description="Every horizontal width is an actual resource weight on one common scale. Benefit labels are numbers, not geometric lengths."><Label x={75} y="28" anchor="start">resource units</Label>{amounts.map(({ index, fraction = 1 }, i) => {
    const it = items[index], start = total;
    total += it.weight * fraction;
    return <g key={i}><rect x={X(start)} y="64" width={it.weight * fraction * scale} height="48" fill={ink[index % ink.length]} fillOpacity={fraction < 1 ? ".18" : ".6"} stroke={ink[index % ink.length]} strokeDasharray={fraction < 1 ? "4 3" : void 0} /><Label x={X(start + it.weight * fraction / 2)} y="90">{it.name}</Label><Label x={X(start + it.weight * fraction / 2)} y="143" color={ink[index % ink.length]}>{`v ${fmt(it.value * fraction)}`}</Label></g>;
  })}<line x1={X(capacity)} x2={X(capacity)} y1="44" y2="163" stroke="#e3e8f1" strokeDasharray="4 4" /><path d={`M75 178H${X(Math.max(15, capacity))}`} stroke="#8394aa" />{[0, capacity, 15].filter((v, i, a) => a.indexOf(v) === i).map((v) => <Label key={v} x={X(v)} y="207">{v}</Label>)}</Scene>;
}
function SearchTree({ state }) {
  const { nodes, frontier, incumbent } = state;
  const count = Math.max(1, ...nodes.map((n) => n.depth)), width = 2 ** count * 145 + 50, height = 120 + (count + 1) * 112, byId = new Map(nodes.map((n) => [n.id, n]));
  const prefix = (n) => n.parent === null ? "" : prefix(byId.get(n.parent)) + (n.decision.startsWith("Include") ? "1" : "0");
  const xy = (n) => {
    const p = prefix(n), i = parseInt(p || "0", 2);
    return [(i + 0.5) * (width - 50) / 2 ** n.depth + 25, 58 + n.depth * 112];
  };
  return <Scene title="Actual include/exclude search tree" width={width} height={height} description="Each node has its full processed decision prefix, resource weight, benefit and optimistic bound. Frontiers are outlined; crosses denote infeasible overweight nodes.">{nodes.filter((n) => n.parent !== null).map((n) => <Arrow key={n.id} from={xy(byId.get(n.parent))} to={xy(n)} color={n.decision.startsWith("Include") ? ink[0] : ink[1]} />)}{nodes.map((n) => {
    const [x, y] = xy(n), open = frontier.some((f) => f.id === n.id);
    return <g key={n.id}><rect x={x - 63} y={y - 30} width="126" height="86" rx="3" fill="#080808" stroke={n.status === "infeasible" ? ink[3] : open ? "#f4f5f8" : "#66778d"} strokeWidth={open ? 3 : 1} /><Label x={x} y={y - 10}>{prefix(n) || "\u2205"}</Label><Label x={x} y={y + 12}>{`w ${n.weight} / v ${n.value}`}</Label><Label x={x} y={y + 34}>{n.upper === null ? "\xD7 overweight" : `b ${fmt(n.upper)}`}</Label>{n.status === "bound-pruned" && <Label x={x} y={y + 52} color={ink[3]}>≤ incumbent {incumbent.value}</Label>}</g>;
  })}</Scene>;
}
function BudgetLoads({ title, costs, edges, loads, selected = [] }) {
  const scale = 35, top = 45, rowHeight = 160, height = top + costs.length * rowHeight;
  return <Scene title={title} width={Math.max(620, 150 + Math.max(...costs) * scale + 150)} height={height} description="Each edge load occupies that amount at both endpoint budgets. Rectangles use one cost-unit scale; the white budget boundary denotes the full vertex cost.">{costs.map((cost, v) => {
    let used = 0, local = 0;
    return <g key={v}><Label x={56} y={top + v * rowHeight + 23} color={ink[v]}>{String.fromCharCode(65 + v)}</Label><rect x="100" y={top + v * rowHeight} width={cost * scale} height="34" fill="none" stroke={selected.includes(v) ? "#f5f6fa" : "#7a8ca3"} strokeWidth={selected.includes(v) ? 3 : 1} />{edges.map(([a, b], e) => {
      if (a !== v && b !== v) return null;
      const start = used, lane = local++;
      used += loads[e];
      return <g key={e}><rect x={100 + start * scale} y={top + v * rowHeight} width={loads[e] * scale} height="34" fill={ink[e % ink.length]} fillOpacity=".6" /><Label x="100" y={top + v * rowHeight + 66 + lane * 22} color={ink[e % ink.length]} anchor="start">{`e${e}: ${fmt(loads[e])}`}</Label><path d={`M${100 + (start + loads[e] / 2) * scale} ${top + v * rowHeight + 34}V${top + v * rowHeight + 51 + lane * 22}H90`} fill="none" stroke={ink[e % ink.length]} /></g>;
    })}<Label x={115 + cost * scale} y={top + v * rowHeight + 23} anchor="start">{`budget ${cost}; load ${fmt(used)}`}</Label></g>;
  })}<Label x="100" y={height - 5} anchor="start">cost units; 0 starts each strip</Label></Scene>;
}
function DpTable({ state, focus = null }) {
  return <Table label={`Complete minimum-weight DP: ${state.rows.length} rows \xD7 ${state.columns} integer scores`} headers={["Item prefix / score", ...Array.from({ length: state.columns }, (_, i) => i)]} rows={state.rows.map((r, i) => [i, ...r])} cellClass={(i, j) => focus && i === focus[0] && j === focus[1] + 1 ? "co-cell-focus" : ""} />;
}
function DpJoin({ witness: w }) {
  const coords = [[150, 90], [440, 90], [295, 245]];
  return <Scene title={`DP cell row ${w.row}, score ${w.score}`} width={620} height={335} description="Only previous-row cells feed the minimum. The take branch adds this item's resource weight; an inadmissible score has no predecessor."><Arrow from={coords[0]} to={coords[2]} color={ink[0]} />{w.admissible && <Arrow from={coords[1]} to={coords[2]} color={ink[1]} label={`+ ${w.item.weight} weight`} />}<rect x="64" y="48" width="172" height="88" fill="#080808" stroke={w.chosen === "skip" ? "#f2f4fa" : ink[0]} /><Label x="150" y="73">{`D[${w.row - 1},${w.score}]`}</Label><Label x="150" y="111">{fmt(w.skip)}</Label><rect x="354" y="48" width="172" height="88" fill="#080808" stroke={w.chosen === "take" ? "#f2f4fa" : ink[1]} /><Label x="440" y="73">{w.admissible ? `D[${w.row - 1},${w.predecessorScore}]` : "\xD7 score too small"}</Label><Label x="440" y="111">{w.admissible ? fmt(w.predecessorWeight) : "no take predecessor"}</Label><rect x="202" y="212" width="186" height="77" fill="#080808" stroke="#f0f2f7" /><Label x="295" y="238">{`D[${w.row},${w.score}] = min`}</Label><Label x="295" y="271">{fmt(w.value)}</Label><Label x="295" y="321">{Number.isFinite(w.value) ? `${w.chosen}; weight ${w.value} \u2264 capacity 10: ${w.value <= 10 ? "yes" : "no"}` : "\u221E: no subset reaches this score"}</Label></Scene>;
}
function RouteGraph({ title, edges = [], walk = null, selectedNodes = [], degree = null, edgeLabels = true }) {
  const iso = (p) => [130 + p[0] * 125, 315 - p[1] * 125];
  const nodes = ROUTE_POINTS.map((p, i) => {
    const [x, y] = iso(p);
    return { x, y, label: String(i) };
  });
  const routeEdges = walk ? walk.slice(1).map((b, i) => ({ a: walk[i], b, id: i, label: edgeLabels ? `${i}: d${distance(walk[i], b)}` : void 0, directed: true, color: ink[i % ink.length] })) : edges.map((e, i) => Array.isArray(e) ? { a: e[0], b: e[1], id: i, label: edgeLabels ? `d${distance(e[0], e[1])}` : void 0 } : { ...e, label: edgeLabels ? `${e.id}: d${e.cost ?? distance(e.a, e.b)}` : void 0 });
  return <><Scene title={`${title}: coordinate axes`} width={540} height={390} description="x and y have equal coordinate-unit scales. Straight drawn edges indicate adjacency; numeric d labels are Manhattan distances."><path d="M95 315H430 M130 340V45" stroke="#718398" />{[0, 1, 2].map((v) => <g key={v}><Label x={130 + v * 125} y="352">{v}</Label><Label x="97" y={315 - v * 125 + 5}>{v}</Label></g>)}<Label x="440" y="315">x</Label><Label x="130" y="30">y</Label><Label x="275" y="383">coordinate units · equal x/y scales</Label>{routeEdges.map((e, i) => {
    const a = nodes[e.a], b = nodes[e.b], duplicates = routeEdges.filter((k) => k.a === e.a && k.b === e.b || k.a === e.b && k.b === e.a), lane = duplicates.findIndex((k) => k.id === e.id) - (duplicates.length - 1) / 2, dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), orientation = e.a < e.b ? 1 : -1, ox = -dy / length * lane * 22 * orientation, oy = dx / length * lane * 22 * orientation, c = [(a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy];
    const canonicalT = duplicates.length > 1 ? 0.35 + 0.3 * (lane + (duplicates.length - 1) / 2) / (duplicates.length - 1) : 0.5;
    const labelT = e.a < e.b ? canonicalT : 1 - canonicalT;
    const labelPoint = [
      (1 - labelT) ** 2 * a.x + 2 * (1 - labelT) * labelT * c[0] + labelT ** 2 * b.x,
      (1 - labelT) ** 2 * a.y + 2 * (1 - labelT) * labelT * c[1] + labelT ** 2 * b.y
    ];
    const side = lane < 0 ? -1 : 1, nx = -dy / length * orientation, ny = dx / length * orientation;
    return <g key={i}><path d={`M${a.x} ${a.y}Q${c} ${b.x} ${b.y}`} fill="none" stroke={e.color || (e.added ? ink[2] : ink[0])} strokeWidth="2" />{walk && <Arrow from={c} to={[b.x - dx / length * 16, b.y - dy / length * 16]} color={e.color || ink[0]} />} {e.label !== void 0 && <Label x={labelPoint[0] + nx * side * 18} y={labelPoint[1] + ny * side * 18 - 5} color={e.color || ink[0]} stroke="#080808" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">{e.label}</Label>}</g>;
  })}{nodes.map((n, i) => <g key={i}><circle cx={n.x} cy={n.y} r="16" fill="#080808" stroke={selectedNodes.includes(i) ? "#f3f4f8" : ink[i]} strokeWidth={selectedNodes.includes(i) ? 3 : 1.5} /><Label x={n.x} y={n.y + 5} color={ink[i]}>{i}</Label>{degree && <Label x={n.x + 25} y={n.y - 15}>{`d${degree[i]}`}</Label>}</g>)}</Scene>{walk && <Table label={`${title}: every actual visit`} headers={["Visit", "Node", "Distance from previous"]} rows={walk.map((v, i) => [i, v, i ? distance(walk[i - 1], v) : 0])} />}</>;
}
export {
  Arrow,
  Assignment,
  BudgetLoads,
  Capacity,
  Compare,
  DpJoin,
  DpTable,
  Figure,
  Graph,
  Incidence,
  Independence,
  Intervals,
  Label,
  Matrix,
  RouteGraph,
  Ruler,
  Scene,
  SearchTree,
  Table,
  fmt,
  ink,
  smallNodes,
  sum
};
