import { useState } from "react";
import { MATROID_PRESETS, KNAPSACK_ITEMS, VERTEX_COVER_PRESETS, matroidExchangeState, knapsackSearchTrace, setCoverTrace, vertexCoverState, scaledKnapsackState } from "../../data/combinatorial-optimization-models.js";
import { COVER_PRESETS, ASSIGNMENT_PRESETS, assignmentStage, dpWitness, routeConstruction, recordedCoverDiagnostic, members, popcount } from "../../data/combinatorial-optimization-flow-models.js";
import { Figure, Table, Compare, Matrix, Assignment, Graph, smallNodes, Ruler, Independence, Incidence, Capacity, SearchTree, BudgetLoads, DpTable, DpJoin, RouteGraph, Scene, Label, ink, fmt, sum } from "./CombinatorialOptimizationDrawings.jsx";
import { RecordedCoverDrawing } from "./CombinatorialOptimizationFigures.jsx";
function Slider({ label, value, min = 0, max, onChange }) {
  return <label>{label}: {value}<input type="range" aria-label={label} value={value} min={min} max={max} step="1" onChange={(e) => onChange(Number(e.target.value))} /></label>;
}
function Select({ label, value, options, onChange }) {
  return <label>{label}<select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, s]) => <option key={v} value={v}>{s}</option>)}</select></label>;
}
function Reset({ action }) {
  return <button type="button" onClick={action}>Reset</button>;
}
const kinds = [["uniform", "At most two"], ["graphic", "Forest"], ["intervals", "Nonoverlapping intervals"]];
const graphKinds = [["triangle", "Weighted triangle"], ["cycle", "Four-cycle"], ["star", "Star"]];
const covers = [["equal", "Equal costs"], ["weighted", "Costs 3,2,2"], ["missing", "Requirement 5 absent"]];
const assignments = [["reversal", "Reversal fixture"], ["missing", "Missing-edge fixture"]];
const setName = (mask, p) => members(mask, p.names.length).map((i) => p.names[i]).join(", ") || "\u2205";
function MatroidExchangeLab() {
  const [kind, setKind] = useState("intervals"), [first, setFirst] = useState(1), [second, setSecond] = useState(6), s = matroidExchangeState({ kind, smaller: first, larger: second }), candidates = members(second & ~first, s.preset.names.length);
  const edit = (v) => {
    setKind(v);
    setFirst(v === "graphic" ? 9 : 1);
    setSecond(v === "intervals" ? 6 : v === "graphic" ? 11 : 3);
  };
  const options = s.feasible.map((m) => [String(m), setName(m, s.preset)]);
  return <Figure id="C11" title="Which member can actually augment I?" caption="The test asks for independent I,J and strictly smaller |I|. A failed size premise has no augmentation obligation; the interval example satisfies the premise but has no legal witness."><Compare><div><Independence title={`I: ${setName(first, s.preset)}`} kind={kind} mask={first} /></div><div><Independence title={`J: ${setName(second, s.preset)}`} kind={kind} mask={second} /></div></Compare><div className="co-controls"><Select label="Independence rule" value={kind} options={kinds} onChange={edit} /><Select label="Feasible I" value={String(first)} options={options} onChange={(v) => setFirst(Number(v))} /><Select label="Feasible J" value={String(second)} options={options} onChange={(v) => setSecond(Number(v))} /><Reset action={() => {
    setKind("intervals");
    setFirst(1);
    setSecond(6);
  }} /></div><p className="co-readout">|I|={popcount(first)}, |J|={popcount(second)}. {s.applicable ? `${s.witness.length} legal augmentation witnesses.` : "Augmentation premise not satisfied."}</p>{s.applicable && <Compare>{candidates.map((i) => <div key={i}><Independence title={`${s.preset.names[i]}: ${s.witness.includes(i) ? "\u2713 legal addition" : "\xD7 infeasible addition"}`} kind={kind} mask={first | 1 << i} /></div>)}</Compare>}<Table label="Every J minus I candidate" headers={["Candidate", "Proposed selected set", "Independent?"]} rows={candidates.map((i) => [s.preset.names[i], setName(first | 1 << i, s.preset), s.feasible.includes(first | 1 << i) ? "yes" : "\xD7 no"])} /></Figure>;
}
function GreedyWeightLab() {
  const [kind, setKind] = useState("intervals"), [weight, setWeight] = useState(3), p = MATROID_PRESETS[kind], weights = p.weights.map((v, i) => i === 0 ? weight : v), s = matroidExchangeState({ kind, weights, smaller: 0, larger: 0 });
  return <Figure id="C13" title="Does descending weight give the best legal set?" caption="Only the first element's benefit changes. Nonpositive weights are skipped for the unrestricted objective, whose empty set is legal. The tiny exhaustive optimum is a verification oracle."><Compare><div><Independence title={`Greedy: benefit ${s.greedyValue}`} kind={kind} mask={s.greedy} weights={weights} /></div><div><Independence title={`Exact tiny reference: benefit ${s.optimumValue}`} kind={kind} mask={s.optimum} weights={weights} /></div></Compare><div className="co-controls"><Select label="Greedy rule" value={kind} options={kinds} onChange={(v) => {
    setKind(v);
    setWeight(MATROID_PRESETS[v].weights[0]);
  }} /><Slider label="First-element benefit" value={weight} min={-3} max={10} onChange={setWeight} /><Reset action={() => {
    setKind("intervals");
    setWeight(3);
  }} /></div><Table label="All considered weights and actual greedy decisions" headers={["Element", "Benefit", "Accepted?", "Selected benefit", "Reason"]} rows={s.trace.slice(1).map((t) => [p.names[t.element], weights[t.element], t.accepted ? "yes" : "no", t.value, t.action])} /><Ruler title="Same original-benefit comparison" max={Math.max(1, s.optimumValue)} unit="benefit units" marks={[{ value: s.greedyValue, label: "greedy" }, { value: s.optimumValue, label: "tiny optimum" }]} /></Figure>;
}
function KnapsackBoundLab() {
  const [capacity, setCapacity] = useState(10), [step, setStep] = useState(0), s = knapsackSearchTrace({ capacity }), at = Math.min(step, s.trace.length - 1), t = s.trace[at];
  return <Figure id="C19" title="What does the current search frontier certify?" caption="Each node is an actual processed prefix. The certificate uses the maximum over every open node and the feasible incumbent, even when the most recent node has a lower bound."><SearchTree state={t} /><Capacity title={`Incumbent: weight ${t.incumbent.weight}, benefit ${t.incumbent.value}`} items={KNAPSACK_ITEMS} capacity={capacity} amounts={members(t.incumbent.mask, 5).map((index) => ({ index }))} /><div className="co-controls"><Slider label="Knapsack capacity" value={capacity} max={15} onChange={(v) => {
    setCapacity(v);
    setStep(0);
  }} /><Slider label="Search trace step" value={at} max={s.trace.length - 1} onChange={setStep} /><Reset action={() => {
    setCapacity(10);
    setStep(0);
  }} /></div><Ruler title="Current certified interval" max={Math.max(1, t.upper)} unit="benefit units" marks={[{ value: t.incumbent.value, label: "feasible lower" }, { value: t.upper, label: "frontier upper" }, { value: s.oracle.value, label: "tiny optimum" }]} /><Table label="Entire exact search trace" headers={["Step", "Expanded node", "Incumbent", "Global upper", "Gap", "Open nodes", "Action"]} rows={s.trace.map((t2, i) => [i, t2.current, t2.incumbent.value, t2.upper, t2.gap, t2.frontier.map((n) => n.id).join(","), t2.action])} /></Figure>;
}
function AssignmentResidualLab() {
  const [preset, setPreset] = useState("reversal"), [step, setStep] = useState(0), probe = assignmentStage(preset, 0), at = Math.min(step, probe.complete.trace.length - 1), s = assignmentStage(preset, at);
  return <Figure id="C24" title="Which existing choice does the next residual path undo?" caption="The earlier-stage diagram uses its own current residual capacities. The latest augmentation is outlined, and the separate final certificate is taught later. Missing edges remain absent."><Assignment title={`Current matching: cardinality ${s.stage.flow}, cost ${s.stage.cost}`} costs={s.complete.costs} pairs={s.stage.pairs} /><Assignment title="Full current positive-capacity residual network" costs={s.complete.costs} residual={s.arcs} path={s.stage.path} /><div className="co-controls"><Select label="Assignment fixture" value={preset} options={assignments} onChange={(v) => {
    setPreset(v);
    setStep(0);
  }} /><Slider label="Augmentation step" value={at} max={s.complete.trace.length - 1} onChange={setStep} /><Reset action={() => {
    setPreset("reversal");
    setStep(0);
  }} /></div><p className="co-readout">Requested {s.complete.required}; currently attained {s.stage.flow}. {at === s.complete.trace.length - 1 ? s.complete.feasible ? "Full request feasible." : "Full request infeasible; optimum at attained size." : "Earlier partial flow; request not yet fulfilled."}</p><Table label="Every current arc capacity, including zero-capacity reverse arcs" headers={["From", "To", "c", "Residual", "Original direction?"]} rows={s.arcs.map((e) => [e.from, e.to, e.cost, e.residual, e.forward ? "yes" : "reverse"])} /><Table label="Latest actual path" headers={["From", "To", "Operation", "Cost"]} rows={s.stage.path.map((e) => [e.from, e.to, e.delta, e.cost])} /></Figure>;
}
function PotentialCertificateLab() {
  const [preset, setPreset] = useState("reversal"), [index, setIndex] = useState(0), s = assignmentStage(preset).complete, i = Math.min(index, s.residual.length - 1), e = s.residual[i];
  return <Figure id="C27" title="Inspect the final residual-cost certificate" caption="This is always the final flow, independently of the earlier augmentation lab. Supersource distances price every residual component; all positive-capacity arcs have nonnegative reduced cost."><Assignment title="Final residual arcs and actual prices" costs={s.costs} residual={s.residual} potentials={s.potentials} path={[e]} /><div className="co-controls"><Select label="Final certificate fixture" value={preset} options={assignments} onChange={(v) => {
    setPreset(v);
    setIndex(0);
  }} /><Slider label="Inspected final residual edge" value={i} max={s.residual.length - 1} onChange={setIndex} /><Reset action={() => {
    setPreset("reversal");
    setIndex(0);
  }} /></div><p className="co-readout">Edge {e.from}→{e.to}: {e.cost}+({s.potentials[e.from]})−({s.potentials[e.to]})={e.reducedCost}. {s.negativeCycle ? "Negative cycle: certificate fails." : "No negative residual cycle."} Attained {s.flow}/{s.required}; cost {s.cost}. {s.feasible ? "Required size feasible." : `Required size infeasible; sink unreachable: ${!s.reachable.includes(s.sink)}.`}</p><Table label="Every final residual inequality" headers={["Edge", "From", "To", "Residual", "Cost", "p(from)", "p(to)", "Reduced cost"]} rows={s.residual.map((e2, j) => [j, e2.from, e2.to, e2.residual, e2.cost, s.potentials[e2.from], s.potentials[e2.to], e2.reducedCost])} /><Table label="Every vertex price and source reachability" headers={["Vertex", "p", "Reachable from source?"]} rows={s.potentials.map((p, j) => [j, p, s.reachable.includes(j) ? "yes" : "no"])} /></Figure>;
}
function SetCoverChoiceLab() {
  const [preset, setPreset] = useState("equal"), [step, setStep] = useState(0), s = setCoverTrace({ sets: COVER_PRESETS[preset] }), at = Math.min(step, s.trace.length - 1), t = s.trace[at], choices = s.sets.map((c, i) => {
    const gain = c.elements.filter((e) => !(t.covered & 1 << e)).length;
    return [c.name, c.cost, gain, t.selected.includes(i) ? "already selected" : gain ? fmt(c.cost / gain) : "undefined; no new element"];
  });
  return <Figure id="C32" title="Which test buys the cheapest fresh requirement?" caption="The current cost is a full-cover upper bound only after every requirement is covered. Weighted B+C costs 4; the missing-data preset cannot cover requirement 5."><Incidence title="Current test selections and uncovered requirements" sets={s.sets} selected={t.selected} covered={t.covered} added={t.added} charges={t.charges} /><div className="co-controls"><Select label="Set-cover fixture" value={preset} options={covers} onChange={(v) => {
    setPreset(v);
    setStep(0);
  }} /><Slider label="Set-cover purchase step" value={at} max={s.trace.length - 1} onChange={setStep} /><Reset action={() => {
    setPreset("equal");
    setStep(0);
  }} /></div><p className="co-readout">Covered {popcount(t.covered)}/{s.universeSize}; selected cost {t.cost}. {t.covered === (1 << s.universeSize) - 1 ? "Feasible full-cover upper bound." : "Incomplete cover: selected cost is not a full-cover upper bound."}</p><Table label="All candidate prices at this exact stage" headers={["Test", "Cost", "Fresh gain", "Cost per new member"]} rows={choices} /><Table label="Entire cover purchase trace and charges" headers={["Step", "Chosen test", "Fresh IDs", "Selected cost", "Covered IDs", "All charges"]} rows={s.trace.map((r, i) => [i, r.chosen === null ? "\u2205" : s.sets[r.chosen].name, r.added.map((e) => e + 1).join(","), r.cost, members(r.covered, s.universeSize).map((e) => e + 1).join(","), r.charges.map(fmt).join(",")])} /></Figure>;
}
function coverState(kind, cost) {
  const p = VERTEX_COVER_PRESETS[kind];
  return vertexCoverState({ costs: p.costs.map((v, i) => i === 0 ? cost : v), edges: p.edges });
}
function VertexPicture({ s, values, selected = [], title, loads = null }) {
  return <Graph title={title} nodes={smallNodes(s.costs.length).map((n, i) => ({ ...n, detail: `c ${s.costs[i]}${values ? ` / x ${fmt(values[i])}` : ""}` }))} edges={s.edges.map(([a, b], i) => ({ a, b, label: loads ? `e${i}: y${fmt(loads[i])}` : values ? `sum ${fmt(values[a] + values[b])}` : void 0 }))} selectedNodes={selected} />;
}
function LpRoundingLab() {
  const [kind, setKind] = useState("triangle"), [cost, setCost] = useState(2), s = coverState(kind, cost);
  return <Figure id="C36" title="Which half purchases cross the rounding threshold?" caption="The complete 3ⁿ half-integral enumeration is a bounded exponential oracle, not a general LP solver. Zero costs and ties remain valid inputs."><Compare><div><VertexPicture s={s} values={s.fractional} title={`Fractional optimum ${s.fractionalCost}`} /></div><div><VertexPicture s={s} values={s.costs.map((_, i) => Number(s.rounded.includes(i)))} selected={s.rounded} title={`Threshold-rounded cost ${s.roundedCost}`} /></div></Compare><div className="co-controls"><Select label="LP-cover graph" value={kind} options={graphKinds} onChange={(v) => {
    setKind(v);
    setCost(VERTEX_COVER_PRESETS[v].costs[0]);
  }} /><Slider label="LP-cover A cost" value={cost} max={10} onChange={setCost} /><Reset action={() => {
    setKind("triangle");
    setCost(2);
  }} /></div><Ruler title="Same-input original cost certificates" max={Math.max(1, s.roundedCost, s.exactCost)} unit="cost units" marks={[{ value: s.fractionalCost, label: "LP lower" }, { value: s.exactCost, label: "tiny integer optimum" }, { value: s.roundedCost, label: "rounded feasible" }]} /><Table label="All fractional edge constraints" headers={["Edge", "x_A", "x_B", "Sum \u22651", "Rounded covered?"]} rows={s.edges.map(([a, b], i) => [i, s.fractional[a], s.fractional[b], s.fractional[a] + s.fractional[b], s.rounded.includes(a) || s.rounded.includes(b) ? "yes" : "\xD7 no"])} /></Figure>;
}
function VertexCoverBudgetLab() {
  const [kind, setKind] = useState("triangle"), [cost, setCost] = useState(2), [step, setStep] = useState(0), s = coverState(kind, cost), at = Math.min(step, s.trace.length - 1), t = s.trace[at];
  return <Figure id="C38" title="Grow a shared load until an endpoint becomes tight" caption="Each edge load debits both endpoint budgets. Cost-zero vertices are selected initially; edits restart the load growth. A partially uncovered graph has no feasible upper bound yet."><VertexPicture s={s} selected={t.selected} loads={t.loads} title="Current edge loads and selected vertices" /><BudgetLoads title="Actual endpoint budgets and consumed shares" costs={s.costs} edges={s.edges} loads={t.loads} selected={t.selected} /><div className="co-controls"><Select label="Primal-dual graph" value={kind} options={graphKinds} onChange={(v) => {
    setKind(v);
    setCost(VERTEX_COVER_PRESETS[v].costs[0]);
    setStep(0);
  }} /><Slider label="Primal-dual A cost" value={cost} max={10} onChange={(v) => {
    setCost(v);
    setStep(0);
  }} /><Slider label="Edge-load growth step" value={at} max={s.trace.length - 1} onChange={setStep} /><Reset action={() => {
    setKind("triangle");
    setCost(2);
    setStep(0);
  }} /></div><p className="co-readout">Dual lower {t.lower}; selected cost {t.cost}; uncovered edges {t.uncovered.join(",") || "none"}. {t.uncovered.length ? "Selected cost is not a feasible upper bound." : "Selected cost is a feasible upper bound."} Independent LP {s.fractionalCost}; tiny integer optimum {s.exactCost}.</p><Table label="Every actual load-growth state" headers={["Step", "Edge", "Increase", "Loads", "Budget usage", "Selected", "Lower", "Cost", "Uncovered"]} rows={s.trace.map((t2, i) => [i, t2.edge, t2.increment, t2.loads.map(fmt).join(","), t2.totals.map(fmt).join(","), t2.selected.map((v) => String.fromCharCode(65 + v)).join(","), t2.lower, t2.cost, t2.uncovered.join(",")])} /></Figure>;
}
function RecordedCoverDiagnosticLab() {
  const [method, setMethod] = useState("rounded"), [edge, setEdge] = useState(0), s = recordedCoverDiagnostic(method, edge), [a, b] = s.edges[edge];
  return <Figure id="C42" title="Recheck the returned cover on an original recorded tie" caption="This browser reads frozen actual offline results and recomputes every incidence; it does not solve a new LP or MILP. Node cost one is a constructed decision rule. Layout is illustrative."><RecordedCoverDrawing state={s} title={`Recorded support: ${method}; inspected tie ${edge}`} /><div className="co-controls"><Select label="Recorded cover method" value={method} options={[["lp", "LP fractions"], ["rounded", "LP rounding"], ["local_ratio", "Local ratio"], ["optimal", "MILP optimum"]]} onChange={setMethod} /><Slider label="Inspected recorded tie" value={edge} max={s.edges.length - 1} onChange={setEdge} /><Reset action={() => {
    setMethod("rounded");
    setEdge(0);
  }} /></div><p className="co-readout">Tie {edge}: node {a} value {fmt(s.values[a])} + node {b} value {fmt(s.values[b])} = {fmt(s.coverage[edge])}. Every one of {s.edges.length} inequalities passes: {s.feasible ? "yes" : "no"}. Cost {s.cost}; LP lower {s.lower}; {s.isIntegral ? `integer feasible upper ${s.upper}, same-input factor at most ${fmt(s.upper / s.lower)}` : "fractional result is a lower certificate, not an integer cover."}</p><Table label="Actual fixed-input solver/source provenance" headers={["Quantity", "Value"]} rows={[["Data SHA256", s.dataSha256], ["Programme SHA256", s.programmeSha256], ["Tolerance", s.tolerance], ["SciPy snapshot", s.executionSnapshot.scipy], ["MILP status", s.solver_status], ["MILP bound", s.mip_dual_bound], ["MILP reported gap", s.mip_gap]]} /></Figure>;
}
function MaximumCoverageLab() {
  const [preset, setPreset] = useState("equal"), [step, setStep] = useState(0), s = setCoverTrace({ sets: COVER_PRESETS[preset], maximumSelections: 2 }), at = Math.min(step, s.trace.length - 1), t = s.trace[at];
  return <Figure id="C44" title="Spend the two selection slots on new coverage" caption="The objective counts distinct requirements under a fixed two-test cardinality budget. Monetary test costs do not enter this objective. An unreachable requirement changes the attainable optimum instead of invalidating a partial-coverage plan."><Incidence title="Budgeted selected tests and distinct coverage" sets={s.sets} selected={t.selected} covered={t.covered} added={t.added} /><div className="co-controls"><Select label="Maximum-coverage incidence" value={preset} options={covers} onChange={(v) => {
    setPreset(v);
    setStep(0);
  }} /><Slider label="Maximum-coverage selection step" value={at} max={s.trace.length - 1} onChange={setStep} /><Reset action={() => {
    setPreset("equal");
    setStep(0);
  }} /></div><Ruler title="Same-input distinct coverage comparison" max={6} unit="requirements" marks={[{ value: popcount(t.covered), label: "current" }, { value: s.optimumCoverage, label: "tiny optimum" }]} /><Table label="Actual budget state" headers={["Selected count", "Budget", "Covered count", "Exact maximum", "Costs used?"]} rows={[[t.selected.length, 2, popcount(t.covered), s.optimumCoverage, "no; cardinality objective"]]} /><Table label="Every step and fresh gains" headers={["Step", "Chosen test", "Fresh requirements", "Coverage"]} rows={s.trace.map((r, i) => [i, r.chosen === null ? "\u2205" : s.sets[r.chosen].name, r.added.map((e) => e + 1).join(","), popcount(r.covered)])} /></Figure>;
}
function DpWitnessLab() {
  const [row, setRow] = useState(2), [score, setScore] = useState(20), w = dpWitness(row, score);
  return <Figure id="C50" title="Trace either predecessor of an actual DP cell" caption="This always uses the fixed original five items, capacity 10 and K=31/20 table. It does not follow the separate epsilon lab. Equal skip/take weights retain skip; ∞ means unreachable."><DpJoin witness={w} /><div className="co-controls"><Slider label="DP witness row" value={row} min={1} max={5} onChange={setRow} /><Slider label="DP witness score" value={score} max={70} onChange={setScore} /><Reset action={() => {
    setRow(2);
    setScore(20);
  }} /></div><DpTable state={w.state} focus={[row, score]} /><Table label="Actual reconstruction predecessor arrows" headers={["From cell", "To previous cell", "Decision", "Item"]} rows={w.reconstruction.map((r) => [r.from.join(","), r.to.join(","), r.decision, r.item])} /></Figure>;
}
function KnapsackScalingLab() {
  const [denominator, setDenominator] = useState(4), [capacity, setCapacity] = useState(10), s = scaledKnapsackState({ capacity, epsilonDenominator: denominator }), ymax = Math.max(15, ...s.rows.at(-1).filter(Number.isFinite)), Y = (v) => 285 - 235 * v / ymax;
  return <Figure id="C51" title="Which original subset survives the smaller score table?" caption="Floors use the preserved exact bounded integer products; the displayed scale is their rational ratio. Capacity zero admits no positive feasible item and leaves the scale undefined. The chosen subset is evaluated in original benefit/resource units."><Capacity title={`Chosen original subset: value ${s.value}, weight ${s.weight}`} items={KNAPSACK_ITEMS} capacity={capacity} amounts={s.selected.map((index) => ({ index }))} /><Scene title="Reachable minimum weights against integer rounded scores" width={620} height={365} description="Each plotted coordinate is one actual final DP cell: horizontal integer score, vertical minimum resource weight. Crossed-capacity dots remain reachable but infeasible."><path d="M75 285H530 M75 285V45" stroke="#7c8fa8" />{[0, capacity, ymax].filter((v, i, a) => a.indexOf(v) === i).map((v) => <Label key={v} x="58" y={Y(v) + 4} anchor="end">{v}</Label>)}{[0, Math.floor((s.columns - 1) / 2), s.columns - 1].filter((v, i, a) => a.indexOf(v) === i).map((v) => <Label key={v} x={75 + 455 * v / Math.max(1, s.columns - 1)} y="310">{v}</Label>)}<Label x="75" y="26" anchor="start">minimum weight · resource units · 0–{ymax}</Label><Label x="300" y="349">integer rounded score</Label><line x1="75" x2="530" y1={Y(capacity)} y2={Y(capacity)} stroke="#dbe0e9" strokeDasharray="4 4" />{s.rows.at(-1).map((v, i) => Number.isFinite(v) ? <circle key={i} cx={75 + 455 * i / Math.max(1, s.columns - 1)} cy={Y(v)} r="2.5" fill={v <= capacity ? ink[1] : ink[3]} /> : null)}</Scene><div className="co-controls"><Select label="Scaling epsilon" value={String(denominator)} options={[["2", "1/2"], ["4", "1/4"], ["10", "1/10"], ["20", "1/20"]]} onChange={(v) => setDenominator(Number(v))} /><Slider label="Scaling capacity" value={capacity} max={15} onChange={setCapacity} /><Reset action={() => {
    setDenominator(4);
    setCapacity(10);
  }} /></div><Table label="Every retained item's true operands and floor" headers={["Item", "Weight", "Original benefit", "Rounded score"]} rows={s.active.map((it) => [it.name, it.weight, it.value, it.rounded])} /><Table label="Actual original-objective guarantee and counted work" headers={["K", "Original value", "Weight", "Exact tiny OPT", "(1\u2212\u03B5)OPT", "Updated cells", "Full allocated cells"]} rows={[[s.active.length ? s.scale : null, s.value, s.weight, s.oracle.value, s.guarantee, s.operations, s.rows.length * s.columns]]} /><DpTable state={s} /></Figure>;
}
function RouteRepairLab() {
  const [method, setMethod] = useState("parity"), [phase, setPhase] = useState(0), s = routeConstruction(method), index = Math.min(phase, s.trace.length + 2), t = index >= 2 && index < s.trace.length + 2 ? s.trace[index - 2] : null;
  const title = index === 0 ? "Original MST" : index === 1 ? "Added edge copies" : index === s.trace.length + 2 ? "First-visit shortcut" : `Hierholzer step ${index - 2}`;
  return <Figure id="C58" title="Follow every edge copy before shortcutting a route" caption="The five points and tree stay fixed. Matching enumeration is only a tiny exact oracle; the complete maintained route uses general perfect matching. Distinct copy IDs survive traversal, including the repeated 0–3 edge.">{index === 0 ? <RouteGraph title={title} edges={s.tree} /> : index === s.trace.length + 2 ? <RouteGraph title={`${title}: cost ${s.shortcutCost}`} walk={s.shortcut} /> : <RouteGraph title={title} edges={s.copies.map((e) => ({ ...e, color: t?.used.includes(e.id) ? ink[1] : e.added ? ink[2] : ink[0] }))} degree={s.degree} />}<div className="co-controls"><Select label="Route repair family" value={method} options={[["double", "Double every tree edge"], ["parity", "Match odd vertices"]]} onChange={(v) => {
    setMethod(v);
    setPhase(0);
  }} /><Slider label="Route construction phase" value={index} max={s.trace.length + 2} onChange={setPhase} /><Reset action={() => {
    setMethod("parity");
    setPhase(0);
  }} /></div>{t && <p className="co-readout">{t.action}; edge copy {fmt(t.edge)}. Stack [{t.stack.join("\u2192")}]; popped circuit [{t.circuit.join("\u2192")}]; consumed copies [{t.used.join(",")}].</p>}<Table label="All preserved original and added edge copies" headers={["Copy ID", "A", "B", "Manhattan distance", "Added?"]} rows={s.copies.map((e) => [e.id, e.a, e.b, e.cost, e.added ? "yes" : "tree"])} /><Table label="Entire Euler stack/circuit trace" headers={["Step", "Action", "Copy", "Stack", "Popped circuit", "Consumed IDs"]} rows={s.trace.map((t2, i) => [i, t2.action, t2.edge, t2.stack.join("\u2192"), t2.circuit.join("\u2192"), t2.used.join(",")])} /><Table label="Every final Euler and shortcut visit" headers={["Euler walk", "Shortcut", "Tree cost", "Added cost", "Euler cost", "Shortcut cost"]} rows={[[s.euler.join("\u2192"), s.shortcut.join("\u2192"), s.treeCost, s.addedCost, s.eulerCost, s.shortcutCost]]} /></Figure>;
}
export {
  AssignmentResidualLab,
  DpWitnessLab,
  GreedyWeightLab,
  KnapsackBoundLab,
  KnapsackScalingLab,
  LpRoundingLab,
  MatroidExchangeLab,
  MaximumCoverageLab,
  PotentialCertificateLab,
  RecordedCoverDiagnosticLab,
  RouteRepairLab,
  SetCoverChoiceLab,
  VertexCoverBudgetLab
};
