import { useId } from "react";
import { motionPosition, motionVelocity, motionRate, compositionChange, motionAccumulation, extremaCandidates, extremaValue } from "../../data/single-variable-calculus-models.js";
import "./single-variable-calculus-flow.css";
const fmt = (value, digits = 5) => value === 0 ? "0" : Math.abs(value) >= 1e4 || Math.abs(value) < 1e-4 ? value.toExponential(3) : Number(value.toFixed(digits)).toString();
function CalculusFigure({ children, caption, controls, live = false }) {
  return <figure className={`single-calculus-flow ${live ? "single-calculus-live" : ""}`}>{children}{controls}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
function Compare({ children }) {
  return <div className="sc-comparison">{children}</div>;
}
function Scene({ label, height = 300, children }) {
  return <svg className="sc-scene" viewBox={`0 0 340 ${height}`} role="img" aria-label={label}>{children}</svg>;
}
function Label({ x, y, children, anchor = "middle", tone = "" }) {
  return <text x={x} y={y} textAnchor={anchor} className={`sc-label ${tone}`}>{children}</text>;
}
function Arrow({ x1, y1, x2, y2, tone = "gold" }) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  if (length < 1e-6) return <circle cx={x1} cy={y1} r={3} className={`sc-dot ${tone}`} />;
  const ux = dx / length, uy = dy / length, size = Math.min(8, length / 3);
  return <g className={`sc-arrow ${tone}`}><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${x2 - size * ux + size * 0.5 * uy},${y2 - size * uy - size * 0.5 * ux}L${x2},${y2}L${x2 - size * ux - size * 0.5 * uy},${y2 - size * uy + size * 0.5 * ux}`} /></g>;
}
function samples(fn, a, b, n = 200, spacing = "linear") {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = spacing === "log" ? Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * i / n) : a + (b - a) * i / n;
    return [x, fn(x)];
  });
}
function pathOf(values, X, Y) {
  return values.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
}
function Area({ fn, a, b, X, Y, tone = "gold", base = 0, spacing = "linear" }) {
  return <polygon className={`sc-area ${tone}`} points={`${X(a)},${Y(base)} ${pathOf(samples(fn, a, b, 200, spacing), X, Y)} ${X(b)},${Y(base)}`} />;
}
function Plane({ label, xRange = [0, 4], yRange = [0, 5], xLabel = "input", yLabel = "output", curves = [], xTicks, yTicks, children }) {
  const id = useId().replaceAll(":", ""), left = 55, right = 310, top = 44, bottom = 232, X = (x) => left + (x - xRange[0]) * (right - left) / (xRange[1] - xRange[0]), Y = (y) => bottom - (y - yRange[0]) * (bottom - top) / (yRange[1] - yRange[0]), xt = xTicks || [xRange[0], (xRange[0] + xRange[1]) / 2, xRange[1]], yt = yTicks || [yRange[0], (yRange[0] + yRange[1]) / 2, yRange[1]];
  return <Scene label={label}><defs><clipPath id={id}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs><Label x={left} y={24} anchor="start">{yLabel}</Label>{yt.map((v) => <g key={v}><line x1={left} x2={right} y1={Y(v)} y2={Y(v)} className="sc-grid" /><Label x={left - 8} y={Y(v) + 6} anchor="end">{fmt(v, 3)}</Label></g>)}{xt.map((v, i) => <g key={v}><line x1={X(v)} x2={X(v)} y1={top} y2={bottom} className="sc-grid" /><Label x={X(v)} y={256} anchor={i === 0 ? "start" : i === xt.length - 1 ? "end" : "middle"}>{fmt(v, 3)}</Label></g>)}<path d={`M${left},${top}V${bottom}H${right}`} className="sc-axis" /><Label x={(left + right) / 2} y={286}>{xLabel}</Label><g clipPath={`url(#${id})`}>{yRange[0] < 0 && yRange[1] > 0 && <line x1={left} x2={right} y1={Y(0)} y2={Y(0)} className="sc-zero" />}{curves.map((c, i) => <polyline key={i} points={pathOf(c.points || samples(c.fn, ...c.domain || xRange, 200, c.spacing), X, Y)} className={`sc-curve ${c.tone || "gold"} ${c.dashed ? "dashed" : ""}`} />)}{children?.({ X, Y, left, right, top, bottom })}</g></Scene>;
}
function Point({ x, y, X, Y, open = false, tone = "gold", radius = 4 }) {
  return <circle cx={X(x)} cy={Y(y)} r={radius} className={`sc-point ${tone} ${open ? "open" : ""}`} />;
}
function JourneyTracks({ legs = false }) {
  const rows = legs ? [[0, 0], [1, 4], [3, 0], [4, 4]] : [[0, 0], [1, 4], [3, 0], [4, 4]], X = (x) => 52 + x * 62, Y = (i) => 52 + i * 57;
  return <Scene label="Equal metre-scale observations; time0/1/3/4, position0/4/0/4" height={310}>{rows.map(([time, s], i) => <g key={time}><line x1="52" x2="300" y1={Y(i)} y2={Y(i)} className="sc-axis" /><circle cx={X(s)} cy={Y(i)} r="5" className="sc-point gold" /><Label x="18" y={Y(i) + 6}>{time}s</Label>{[0, 2, 4].map((v) => <Label key={v} x={X(v)} y={Y(i) + 25}>{v}</Label>)}</g>)}{legs && rows.slice(1).map(([, s], i) => <Arrow key={i} x1={X(rows[i][1])} y1={Y(i + 1) - 13} x2={X(s)} y2={Y(i + 1) - 13} tone={s < rows[i][1] ? "rose" : "gold"} />)}<Label x="177" y="301">position (m)</Label></Scene>;
}
function MotionDrawing({ base = 2, increment = 0.5, finiteOnly = false }) {
  const s = motionRate(base, increment), a = finiteOnly ? 1 : base, b = finiteOnly ? 3 : base + increment, pa = motionPosition(a), pb = motionPosition(b), secant = (pb - pa) / (b - a), curves = [{ fn: motionPosition }, { fn: (t) => pa + secant * (t - a), tone: "blue", domain: [Math.min(a, b), Math.max(a, b)] }];
  if (!finiteOnly) curves.push({ fn: (t) => s.position + s.velocity * (t - base), tone: "rose", dashed: true, domain: [Math.max(0, base - 0.7), Math.min(4, base + 0.7)] });
  return <><Plane label={`Original cubic; secant (${a},${fmt(pa)}) to (${b},${fmt(pb)}); rate ${fmt(secant)}`} xLabel="time (s)" yLabel="position (m)" xRange={[0, 4]} yRange={[-0.5, 4.5]} curves={curves}>{({ X, Y }) => <><path d={`M${X(a)},${Y(pa)}H${X(b)}V${Y(pb)}`} className="sc-reference blue" /><Point x={a} y={pa} X={X} Y={Y} /><Point x={b} y={pb} X={X} Y={Y} tone="blue" /></>}</Plane><div className="sc-values"><span>Δtime {fmt(b - a)} s</span><span>Δposition {fmt(pb - pa)} m</span><span>secant {fmt(secant)} m/s</span>{!finiteOnly && <span>tangent {fmt(s.velocity)} m/s</span>}</div></>;
}
function LimitDrawing({ kind = "hole", epsilon = 0.5, delta = 0.1, bands = false, witness = null }) {
  const curves = kind === "jump" ? [{ fn: (x) => x * x, domain: [1.4, 2] }, { fn: (x) => x * x + 2, domain: [2.000001, 2.6], tone: "blue" }] : [{ fn: (x) => x * x, domain: [1.4, 1.999999] }, { fn: (x) => x * x, domain: [2.000001, 2.6] }];
  return <><Plane label={`${kind} square near2; nearby left4 right${kind === "jump" ? 6 : 4}; assigned${kind === "hole" ? 6 : 4}${bands ? `; accuracy${epsilon}, radius${delta}` : ""}`} xRange={[1.4, 2.6]} yRange={[1, 9]} xTicks={[1.5, 2, 2.5]} yTicks={[2, 4, 6, 8]} xLabel="input x" yLabel="output f(x)" curves={curves}>{({ X, Y, top, bottom, left, right }) => <>{bands && <><rect x={left} y={Y(4 + epsilon)} width={right - left} height={Y(4 - epsilon) - Y(4 + epsilon)} className="sc-band blue" /><rect x={X(2 - delta)} y={top} width={X(2) - X(2 - delta)} height={bottom - top} className="sc-band gold" /><rect x={X(2)} y={top} width={X(2 + delta) - X(2)} height={bottom - top} className="sc-band gold" /><line x1={X(2)} x2={X(2)} y1={top} y2={bottom} className="sc-excluded-test" /><text x={X(2)} y={top+18} textAnchor="middle" className="sc-label rose">×</text>{[2-delta/2,2+delta/2].map(x=><Point key={x} x={x} y={x*x+(kind==='jump'&&x>2?2:0)} X={X} Y={Y} tone="blue" radius={4}/>)}</>}{witness && <Point x={witness.input} y={witness.output} X={X} Y={Y} tone="rose" radius={5} />}<line x1={X(2)} x2={X(2)} y1={top} y2={bottom} className="sc-reference" /><Point x={2} y={4} X={X} Y={Y} open={kind === "hole"} tone="gold" />{kind !== "smooth" && <Point x={2} y={6} X={X} Y={Y} open={kind === "jump"} tone="blue" />}</>}</Plane>{bands&&<><p>For the test, 0 &lt; |x−2| &lt; δ: the × and dark center line exclude x=2 from the gold input strip. The assigned function-value point remains valid. Cyan nearby samples are x=2±δ/2; they illustrate allowed inputs, while the analytic bound or certified witness decides the all-nearby claim.</p><div className="sc-values">{[2-delta/2,2+delta/2].map(x=><span key={x}>sample ({fmt(x)}, {fmt(x*x+(kind==='jump'&&x>2?2:0))})</span>)}</div></>}</>;
}
// Addressed unit-cube slices; x,y,z are integer coordinates, not projected areas.
function CubeShell({ size }) {
  const a=size-1,unit=25;
  const cells=Array.from({length:size**3},(_,index)=>{
    const x=index%size,y=Math.floor(index/size)%size,z=Math.floor(index/(size*size));
    const boundaries=[x,y,z].filter(v=>v===a).length;
    return {x,y,z,kind:boundaries===0?'old':boundaries===1?'face':boundaries===2?'edge':'corner',tone:z===a?'gold':x===a?'blue':'rose'};
  });
  const counts=Object.fromEntries(['old','face','edge','corner'].map(kind=>[kind,cells.filter(c=>c.kind===kind).length]));
  return <div>
    <p>j = {size}: inner cube {a}³ = {a**3}; added shell {size**3-a**3} unit cubes.</p>
    <Scene label={`All${size**3} addressed unit cubes in${size} true z-slices; ${counts.face} face,${counts.edge} edge,1corner added`} height={Math.ceil(size/2)*205+25}>
      {Array.from({length:size},(_,z)=>{
        const left=36+(z%2)*170,top=46+Math.floor(z/2)*205;
        return <g key={z}>
          <Label x={left} y={top-22} anchor="start">z = {z}</Label>
          {cells.filter(c=>c.z===z).map(c=><rect key={`${c.x}-${c.y}`} x={left+c.x*unit} y={top+(size-1-c.y)*unit} width={unit} height={unit}
            className={`sc-cube-cell ${c.kind} ${c.tone}`}><title>{`(${c.x},${c.y},${c.z}): ${c.kind==='old'?'retained inner cube':`new ${c.kind} cell`}`}</title></rect>)}
          {Array.from({length:size},(_,v)=><g key={v}>
            <Label x={left+(v+.5)*unit} y={top+size*unit+22}>{v}</Label>
            <Label x={left-9} y={top+(size-.5-v)*unit+6} anchor="end">{v}</Label>
          </g>)}
          <Label x={left+size*unit/2} y={top+size*unit+48}>x index</Label>
        </g>;
      })}
    </Scene>
    <div className="sc-values"><span>face cells 3a² = {counts.face}</span><span>edge cells 3a = {counts.edge}</span><span>corner 1</span></div>
    <p>Each grid square marks one unit cube in a slice of thickness 1. x runs across, y upward, and z names the slice.</p>
    <p>a = j−1. A face cell has one coordinate a, an edge cell two, and the corner all three. Dashed outlines distinguish edge cells; a thick outline marks the corner. Grey cells have no coordinate a and form the retained inner cube.</p>
  </div>;
}

function SquareChangeDrawing() {
  return <Compare><div><Plane label="True x-square and tangent at2; actual4.41, prediction4.4" xRange={[1.7, 2.3]} yRange={[2.8, 5.4]} xLabel="input x" yLabel="square / tangent" curves={[{ fn: (x) => x * x }, { fn: (x) => 4 + 4 * (x - 2), tone: "blue" }]}>{({ X, Y }) => <><Point x={2} y={4} X={X} Y={Y} /><Point x={2.1} y={4.41} X={X} Y={Y} /><Point x={2.1} y={4.4} X={X} Y={Y} tone="blue" /></>}</Plane></div><div><Plane label="Magnified residual h-square; separate scale, residual.01 at h.1" xRange={[-0.15, 0.15]} yRange={[0, 0.025]} xLabel="input increment h" yLabel="remainder h²" curves={[{ fn: (h) => h * h }]}>{({ X, Y }) => <Point x={0.1} y={0.01} X={X} Y={Y} />}</Plane><p>Separate magnification of the remainder: 0.01, with relative remainder 0.1.</p></div></Compare>;
}
function ProductDrawing() {
  const unit = 75, ox = 35, oy = 244, a = 2, b = 3, da = 0.2, db = 0.1, X = (x) => ox + x * unit, Y = (y) => oy - y * unit;
  return <><Scene label="Common physical scale:2by3 base, side increments.2/.1; exact area6.82" height={310}><rect x={X(0)} y={Y(b)} width={a * unit} height={b * unit} className="sc-area neutral" /><rect x={X(a)} y={Y(b)} width={da * unit} height={b * unit} className="sc-area gold" /><rect x={X(0)} y={Y(b + db)} width={a * unit} height={db * unit} className="sc-area blue" /><rect x={X(a)} y={Y(b + db)} width={da * unit} height={db * unit} className="sc-area rose" /><Label x={X(a / 2)} y={oy + 25}>a = 2</Label><Label x={X(a + da / 2)} y={oy + 49}>+0.2</Label><Label x="233" y="144" anchor="start">b = 3</Label><Label x="233" y="40" anchor="start">+0.1</Label></Scene><div className="sc-values"><span>base 6</span><span>gold strip 0.6</span><span>blue strip 0.2</span><span>rose corner 0.02</span></div></>;
}
function CoordinateRuler({ label, a, b, range, change, tone = "gold" }) {
  const X = (x) => 46 + (x - range[0]) * 256 / (range[1] - range[0]);
  return <div><p>{label}: {fmt(a)} → {fmt(b)}; change {fmt(change ?? b - a)}</p><Scene label={`${label} on actual ruler${range.join("..")};${a}to${b}`} height={108}><line x1="46" x2="302" y1="46" y2="46" className="sc-axis" />{[range[0], (range[0] + range[1]) / 2, range[1]].map((v, i) => <Label x={X(v)} y="85" anchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} key={v}>{fmt(v, 6)}</Label>)}<circle cx={X(a)} cy="46" r="4" className="sc-point gold" /><Arrow x1={X(a)} y1="32" x2={X(b)} y2="32" tone={tone} /><circle cx={X(b)} cy="46" r="4" className={`sc-point ${tone}`} /></Scene></div>;
}
function ChainDrawing({ input = 1, increment = 0.1, zeroInner = false }) {
  const s = zeroInner ? { input: 0, increment: 0.1, intermediate: 0, intermediateChange: 0.01, output: 0, nextOutput: 1e-4, exactChange: 1e-4, predictedChange: 0, remainder: 1e-4 } : compositionChange(input, increment);
  return <><CoordinateRuler label="Input x" a={s.input} b={s.input + s.increment} range={[-1.5, 1.5]} /><CoordinateRuler label={zeroInner ? "Intermediate u=x\xB2" : "Intermediate u=3x+1"} a={s.intermediate} b={s.intermediate + s.intermediateChange} range={zeroInner ? [0, 0.02] : [-4, 6]} /><CoordinateRuler label="Output y=u²" a={s.output} b={s.nextOutput} range={zeroInner ? [0, 2e-4] : [0, 36]} /><div className="sc-values"><span>actual Δy {fmt(s.exactChange)}</span><span>local prediction {fmt(s.predictedChange)}</span><span>remainder {fmt(s.remainder)}</span></div>{zeroInner && <p>The intermediate/output rulers use their displayed small scales; their lengths cannot be compared as equal-unit quantities.</p>}</>;
}
function RadianGeometry() {
  const h = Math.PI / 6, R = 180, O = [45, 240], A = [O[0] + R, O[1]], B = [O[0] + R * Math.cos(h), O[1] - R * Math.sin(h)], T = [A[0], O[1] - R * Math.tan(h)];
  return <><Scene label="One unit circle; inscribed triangle, radian sector and tangent triangle at pi/6" height={310}><path d={`M${O}L${A}L${T}Z`} className="sc-area rose" /><path d={`M${O}L${A}A${R},${R} 0 0 0 ${B}Z`} className="sc-area gold" /><path d={`M${O}L${A}L${B}Z`} className="sc-area blue" /><path d={`M${A}A${R},${R} 0 0 0 ${B}`} className="sc-curve gold" /><line x1={A[0]} x2={T[0]} y1={260} y2={105} className="sc-reference" /><Label x="120" y="270">radius 1</Label><Label x="130" y="225">π/6</Label></Scene><div className="sc-values"><span>triangle sin(h)/2 = 1/4</span><span>sector h/2 = π/12</span><span>tangent triangle tan(h)/2 = 1/(2√3)</span></div></>;
}
function CircleDrawing() {
  const X = (x) => 170 + 23 * x, Y = (y) => 160 - 23 * y;
  return <><Scene label="True radius-five circle; upper3,4/lower3,-4 and vertical endpoint tangents" height={320}><line x1="38" x2="302" y1={Y(0)} y2={Y(0)} className="sc-axis" /><line x1={X(0)} x2={X(0)} y1="27" y2="293" className="sc-axis" /><circle cx={X(0)} cy={Y(0)} r="115" className="sc-ring" /><line x1={X(1)} x2={X(5)} y1={Y(5.5)} y2={Y(2.5)} className="sc-curve gold" /><line x1={X(-5)} x2={X(-5)} y1={Y(-2)} y2={Y(2)} className="sc-reference" /><line x1={X(5)} x2={X(5)} y1={Y(-2)} y2={Y(2)} className="sc-reference" /><circle cx={X(3)} cy={Y(4)} r="5" className="sc-point gold" /><circle cx={X(3)} cy={Y(-4)} r="5" className="sc-point blue" /><Label x="170" y="20">y</Label><Label x="324" y="165">x</Label><Label x={X(-5)-10} y={Y(0) + 25} anchor="end">−5</Label><Label x={X(5)+10} y={Y(0) + 25} anchor="start">5</Label></Scene><div className="sc-values"><span>upper (3,4): slope −3/4</span><span>lower (3,−4): slope +3/4</span><span>y=0 endpoints: vertical</span></div></>;
}
function RectangleFamily() {
  const rows = [[1, 5], [2, 4], [3, 3], [5, 1]], unit = 25;
  return <><Scene label="Four perimeter12 rectangles on one length scale, areas5/8/9/5" height={680}>{rows.map(([a, b], i) => <g key={a}><rect x="25" y={40 + i * 155} width={a * unit} height={b * unit} className="sc-area gold" /><Label x="188" y={80 + i * 155} anchor="start">{a} × {b}</Label><Label x="188" y={109 + i * 155} anchor="start">area {a * b}</Label></g>)}</Scene><p>All side lengths share the same scale; every perimeter is 12.</p></>;
}
function CircleAnnulus() {
  const unit = 36, cx = 140, cy = 145;
  return <><Scene label="Radius3 and finite increment.2 on same physical scale" height={310}><circle cx={cx} cy={cy} r={3.2 * unit} className="sc-area gold" /><circle cx={cx} cy={cy} r={3 * unit} className="sc-area opaque" /><line x1={cx} x2={cx + 3 * unit} y1={cy} y2={cy} className="sc-axis" /><Arrow x1={cx + 3 * unit} x2={cx + 3.2 * unit} y1={cy} y2={cy} /><Label x="155" y="170">r = 3</Label><Label x="175" y="285">Δr = 0.2</Label></Scene><div className="sc-values"><span>exact annulus 1.24π m²</span><span>linear term 1.2π m²</span><span>remainder 0.04π m²</span></div></>;
}
function CandidatesDrawing({ kind = "motion", left = 0, right = 4 }) {
  const s = extremaCandidates(kind, left, right), fn = (x) => extremaValue(kind, x), ys = kind === "inflection" ? [-9, 9] : [-0.5, 4.5];
  return <><Plane label={`${kind} on[${left},${right}]; all${s.candidates.length} candidates and tied extrema`} xRange={[0, 4]} yRange={ys} xLabel="input t" yLabel="value" curves={[{ fn }]}>{({ X, Y }) => <>{s.candidates.map((c) => <Point key={c.input} x={c.input} y={c.value} X={X} Y={Y} tone={c.isMinimum ? "blue" : c.isMaximum ? "rose" : "gold"} radius={5} />)}</>}</Plane><div className="sc-table-scroll" role="region" aria-label="All endpoint and interior candidates" tabIndex="0"><table><thead><tr><th>input</th><th>value</th><th>reason</th><th>winner</th></tr></thead><tbody>{s.candidates.map((c) => <tr key={c.input}><td>{fmt(c.input)}</td><td>{c.valueExact}</td><td>{c.reasons.join("; ")}</td><td>{[c.isMinimum ? "minimum" : "", c.isMaximum ? "maximum" : ""].filter(Boolean).join(" / ") || "neither"}</td></tr>)}</tbody></table></div><div className="sc-values">{s.intervals.map((v) => <span key={v.start}>({fmt(v.start)}, {fmt(v.end)}): {v.sign > 0 ? "increasing" : v.sign < 0 ? "decreasing" : "constant"}</span>)}</div></>;
}
function Rectangles({ fn, partition, tags, X, Y }) {
  return <>{tags.map((t, i) => {
    const a = partition[i], b = partition[i + 1], value = fn(t);
    return <g key={i}><rect x={X(a)} y={Math.min(Y(0), Y(value))} width={X(b) - X(a)} height={Math.abs(Y(value) - Y(0))} className={`sc-area ${value < 0 ? "rose" : "gold"}`} /><Point x={t} y={value} X={X} Y={Y} /></g>;
  })}</>;
}
function TaggedDrawing({ uniform = false, count = 4, right = true }) {
  const partition = uniform ? Array.from({ length: count + 1 }, (_, i) => 2 * i / count) : [0, 0.5, 1.5, 2], tags = uniform ? partition.slice(1).map((v, i) => right ? v : (v + partition[i]) / 2) : [0.25, 1, 1.75];
  return <><Plane label="Actual square rectangles, tagged inside actual partition" xRange={[0, 2]} yRange={[0, 4.5]} xLabel="input x" yLabel="height x²" curves={[{ fn: (x) => x * x }]}>{({ X, Y }) => <Rectangles fn={(x) => x * x} partition={partition} tags={tags} X={X} Y={Y} />}</Plane><div className="sc-values">{tags.map((tag, i) => <span key={i}>width {fmt(partition[i + 1] - partition[i])}, tag {fmt(tag)}, contribution {fmt((partition[i + 1] - partition[i]) * tag * tag)}</span>)}</div></>;
}
function PartitionRuler({ partition, label }) {
  const X = (x) => 40 + x * 132;
  return <><p>{label}; largest width {fmt(Math.max(...partition.slice(1).map((v, i) => v - partition[i])))}</p><Scene label={`${label}: exact partition${partition.join(",")}`} height={120}>{partition.slice(1).map((v, i) => <g key={i}><rect x={X(partition[i])} y="25" width={X(v) - X(partition[i])} height="28" className={`sc-area ${i === 0 ? "rose" : "gold"}`} /><line x1={X(v)} x2={X(v)} y1="15" y2="65" className="sc-axis" /></g>)}{[0, 1, 2].map((v) => <Label x={X(v)} y="95" key={v}>{v}</Label>)}</Scene></>;
}
function SignedDrawing({ upper = 4, panelCount = 8, method = "midpoint", rectangles = false, absolute = false }) {
  const s = motionAccumulation(upper, panelCount, method), fn = absolute ? (t) => Math.abs(motionVelocity(t)) : motionVelocity;
  return <><Plane label={`${absolute ? "Magnitude" : "Signed velocity"} on0..${upper}${rectangles ? `,${panelCount}${method}rectangles` : ""}`} xRange={[0, 4]} yRange={[-4, 10]} xLabel="time (s)" yLabel={absolute ? "speed (m/s)" : "velocity (m/s)"} curves={[{ fn }]}>{({ X, Y }) => <>{rectangles ? s.panels.map((p, i) => <Rectangles key={i} fn={fn} partition={[p.start, p.end]} tags={[p.sample]} X={X} Y={Y} />) : [0, ...[1, 3].filter((v) => v < upper), upper].slice(1).map((b, i, arr) => {
    const a = i ? arr[i - 1] : 0;
    return <Area key={b} fn={fn} a={a} b={b} X={X} Y={Y} tone={!absolute && motionVelocity((a + b) / 2) < 0 ? "rose" : "gold"} />;
  })}</>}</Plane><div className="sc-values"><span>{rectangles ? absolute ? "finite magnitude sum" : "finite signed sum" : absolute ? "exact distance" : "exact displacement"} {fmt(rectangles ? absolute ? s.distanceEstimate : s.signedEstimate : absolute ? s.exactDistance : s.exactDisplacement)} m</span><span>{rectangles ? absolute ? "exact distance" : "exact displacement" : absolute ? "exact displacement" : "exact distance"} {fmt(rectangles ? absolute ? s.exactDistance : s.exactDisplacement : absolute ? s.exactDisplacement : s.exactDistance)} m</span></div></>;
}
function AccumulationDrawing({ h = 0.5 }) {
  const a = 1, b = 1 + h, A = (x) => x + x * x * x / 3, change = A(b) - A(a), average = change / h;
  return <><Compare><Plane label={`Actual1+t-square strip1to${b}; signed total${fmt(change)}`} xRange={[0, 2]} yRange={[0, 5.5]} xLabel="rate input t" yLabel="rate 1+t²" curves={[{ fn: (t) => 1 + t * t }]}>{({ X, Y }) => <><Area fn={(t) => 1 + t * t} a={Math.min(a, b)} b={Math.max(a, b)} X={X} Y={Y} tone={h < 0 ? "rose" : "gold"} /><rect x={X(Math.min(a, b))} y={Y(2)} width={Math.abs(X(b) - X(a))} height={Y(0) - Y(2)} className="sc-reference-rectangle" /><Arrow x1={X(a)} x2={X(b)} y1={Y(0.25)} y2={Y(0.25)} /></>}</Plane><Plane label="AccumulationA=x+x-cube/3; actual endpoint secant and local tangent" xRange={[0, 2]} yRange={[0, 5]} xLabel="upper endpoint x" yLabel="accumulation A(x)" curves={[{ fn: A }, { fn: (x) => A(a) + average * (x - a), domain: [Math.min(a, b), Math.max(a, b)], tone: "blue" }, { fn: (x) => A(a) + 2 * (x - a), domain: [0.5, 1.5], tone: "rose", dashed: true }]}>{({ X, Y }) => <><Point x={a} y={A(a)} X={X} Y={Y} /><Point x={b} y={A(b)} X={X} Y={Y} tone="blue" /></>}</Plane></Compare><div className="sc-values"><span>h {fmt(h)}</span><span>signed total {fmt(change)}</span><span>average {fmt(average)}</span><span>local height 2</span><span>reference total {fmt(2 * h)}</span></div>{h < 0 && <p>The highlighted geometric region has positive area; the backward endpoint direction makes the added integral negative.</p>}</>;
}
function ExponentialDrawing({ rate = 0.2, period = 1 }) {
  const fn = (t) => 10 * Math.exp(rate * t), time = 2, current = fn(time);
  return <Plane label={`10exp(${rate}t); fixedtime2 and future${2 + period}, real tangent`} xRange={[0, 4]} yRange={[0, 80]} xLabel="time" yLabel="amount" curves={[{ fn }, { fn: (t) => current + rate * current * (t - time), tone: "blue", domain: [1, 4] }]}>{({ X, Y }) => <><Point x={2} y={current} X={X} Y={Y} /><Point x={2 + period} y={fn(2 + period)} X={X} Y={Y} tone="rose" /></>}</Plane>;
}
function RodDrawing() {
  const c = 10 / 9, unit = 130, items = Array.from({ length: 8 }, (_, i) => {
    const a = i / 4, b = (i + 1) / 4, x = (a + b) / 2, mass = (2 + x) / 4;
    return { a, b, x, mass };
  });
  return <><Scene label="Two metre rod with density2+x; equal-length pieces, mass weighted positions, balance10/9" height={300}>{items.map((v, i) => <g key={i}><rect x={40 + v.a * unit} y={190 - (2 + v.x) * 35} width={(v.b - v.a) * unit} height={(2 + v.x) * 35} className="sc-area gold" /></g>)}<line x1="40" x2="300" y1="190" y2="190" className="sc-axis" /><path d={`M${40 + c * unit},193l-12,24h24Z`} className="sc-outline blue" />{[0, 1, 2].map((v) => <Label key={v} x={40 + v * unit} y="251">{v}</Label>)}<Label x="170" y="285">position (m)</Label><Label x="40" y="24" anchor="start">density (kg/m)</Label></Scene><div className="sc-values"><span>mass 6 kg</span><span>moment 20/3 kg·m</span><span>balance 10/9 m</span></div><p>The bar heights show sampled density on equal 0.25m pieces. Their approximate masses are density×0.25m; the balance and totals are exact integrals, independent of this displayed partition.</p></>;
}
function EulerDrawing() {
  const exact = (t) => 3 * Math.exp(-2 * t);
  return <><Plane label="Exact3exp(-2t); Euler oneh1to-3 and twoh.5to0; time0..1" xRange={[0, 1]} yRange={[-3.5, 3.5]} xLabel="time" yLabel="state y" curves={[{ fn: exact }, { points: [[0, 3], [1, -3]], tone: "rose" }, { points: [[0, 3], [0.5, 0], [1, 0]], tone: "blue" }]}>{({ X, Y }) => <><Point x={1} y={exact(1)} X={X} Y={Y} /><Point x={1} y={-3} X={X} Y={Y} tone="rose" /><Point x={1} y={0} X={X} Y={Y} tone="blue" /></>}</Plane><div className="sc-values"><span>exact {fmt(exact(1))}</span><span>one step −3</span><span>two steps 0</span></div></>;
}
export {
  AccumulationDrawing,
  Area,
  Arrow,
  CalculusFigure,
  CandidatesDrawing,
  ChainDrawing,
  CircleAnnulus,
  CircleDrawing,
  CubeShell,
  Compare,
  CoordinateRuler,
  EulerDrawing,
  ExponentialDrawing,
  JourneyTracks,
  Label,
  LimitDrawing,
  MotionDrawing,
  PartitionRuler,
  Plane,
  Point,
  ProductDrawing,
  RadianGeometry,
  RectangleFamily,
  Rectangles,
  RodDrawing,
  Scene,
  SignedDrawing,
  SquareChangeDrawing,
  TaggedDrawing,
  fmt,
  pathOf,
  samples
};
