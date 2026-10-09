import { useState } from "react";
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from "./LessonFlow.jsx";
import { targetWeights, calibration, finiteSampleState, inclusionDesignState, stratifiedState, systematicState, groupedMeasurementState, assignmentState, factorialState, budgetState, missingState } from "../../data/sampling-measurement-flow-models.js";
import { Figure, Compare, Table, Scene, Label, Unit, UnitArray, NumberLine, Law, Contributions, GroupTree, AssignmentDrawing, FactorialDrawing, fmt } from "./SamplingMeasurementDrawings.jsx";
function Reset({
  onClick
}) {
  return <button className="sm-reset" type="button" onClick={onClick}>Reset</button>;
}
function Slider({
  name,
  value,
  onChange,
  min,
  max,
  step = 1
}) {
  return <FlowSlider name={name} value={value} onChange={onChange} min={min} max={max} step={step} />;
}
function SampleLedger({
  samples,
  label = "Complete permitted sample law",
  probability = null
}) {
  return <Table label={label} headers={["Sample", "Selected units", "Estimate", "Probability"]} rows={samples.map((s, i) => [i + 1, s.indices.map(j => `U${j + 1}`).join(" + "), fmt(s.mean ?? s.difference), fmt(probability ? probability[i] : 1 / samples.length)])} />;
}
export function TargetWeightsLab() {
  const [a, A] = useState(2),
    [b, B] = useState(6),
    s = targetWeights(a, b);
  return <FlowLab id="lab-target-weights" label="Compare class and student targets"><Figure job="C04" caption="Two fixed class means, 4 and 8. Sizes change the uniformly selected student's target while the uniformly selected class target stays 6."><Compare><Scene label="Class membership counts" height={370}>{[a, b].map((n, g) => <g key={g}><Label x={20} y={25 + g * 170} anchor="start">Class {g + 1}: {n} students</Label>{Array.from({
              length: n
            }, (_, i) => <Unit key={i} x={42 + i % 4 * 82} y={65 + g * 170 + Math.floor(i / 4) * 62} id={`S${i + 1}`} r={17} tone={g ? "cyan" : "gold"} />)}</g>)}</Scene><Contributions label="Two targets on one score scale" rows={[{
          label: "Class",
          value: s.classMean
        }, {
          label: "Student",
          value: s.studentMean,
          tone: "cyan"
        }]} range={[0, 8]} units="Score" /></Compare><FlowControls><Slider name="Class 1 students" value={a} onChange={A} min={1} max={8} /><Slider name="Class 2 students" value={b} onChange={B} min={1} max={8} /><Reset onClick={() => {
          A(2);
          B(6);
        }} /></FlowControls><FlowReadout>Equal-class mean {fmt(s.classMean)}. Equal-student mean ({a}×4+{b}×8)/{s.studentCount} = <strong>{fmt(s.studentMean)}</strong>.</FlowReadout></Figure></FlowLab>;
}
export function CalibrationLab() {
  const [c, C] = useState(2),
    s = calibration(c);
  return <FlowLab id="lab-calibration" label="Subtract a known correction"><Figure job="C09" caption="Both panels keep the fixed 7–14 mV axis, which contains every allowed adjusted point. This subtracts a stated correction; its uncertainty is a later model."><Compare><NumberLine label="Original readings" values={s.original} range={[7, 14]} ticks={[7, 10, 12, 14]} target={10} mean={12} units="mV" height={250} /><NumberLine label="Adjusted readings" values={s.adjusted} range={[7, 14]} ticks={[7, 10, 12, 14]} target={10} mean={s.mean} units="mV" height={250} /></Compare><FlowControls><Slider name="Known correction (mV)" value={c} onChange={C} min={0} max={4} step={.5} /><Reset onClick={() => C(2)} /></FlowControls><FlowReadout>Adjusted realized mean 12−{fmt(c)} = <strong>{fmt(s.mean)} mV</strong>; reference gap {fmt(s.gap)} mV.</FlowReadout></Figure></FlowLab>;
}
export function FiniteSamplingLab() {
  const [frame, F] = useState("complete"),
    [n, N] = useState(2),
    [index, I] = useState(0),
    s = finiteSampleState(undefined, frame === "complete" ? null : [0, 1, 2, 3], n),
    r = s.samples[index];
  return <FlowLab id="lab-finite-sampling" label="Enumerate finite sampling"><Figure job="C15" caption="White rings mark the inspected sample; dashed unit outlines mark absence from the frame. All permitted subsets have equal probability; values remain fixed."><UnitArray values={s.population} selected={r.indices} eligible={s.eligible} /><Compare><Law label="Fixed population values" values={s.population} range={[0, 18]} target={s.target} /><Law label="Exact sample-mean law" values={s.samples.map(v => v.mean)} range={[0, 18]} target={s.target} selected={r.mean} /></Compare><FlowControls><FlowChoice label="Available frame" value={frame} options={[["complete", "U1–U8"], ["partial", "U1–U4"]]} onChange={v => {
          F(v);
          N(Math.min(n, v === "complete" ? 8 : 4));
          I(0);
        }} /><Slider name="Sample size n" value={n} onChange={v => {
          N(v);
          I(0);
        }} min={1} max={s.eligible.length} /><Slider name="Inspected subset" value={index + 1} onChange={v => I(v - 1)} min={1} max={s.samples.length} /><Reset onClick={() => {
          F("complete");
          N(2);
          I(0);
        }} /></FlowControls><FlowReadout>Selected mean <strong>{fmt(r.mean)}</strong>; design expectation {fmt(s.expectation)}, target {fmt(s.target)}, variance {fmt(s.variance)}, bias {fmt(s.bias)}, MSE {fmt(s.mse)}.</FlowReadout><SampleLedger samples={s.samples} /></Figure></FlowLab>;
}
export function InclusionWeightsLab() {
  const [mode, M] = useState("unequal"),
    [index, I] = useState(0),
    s = inclusionDesignState(mode),
    possible = s.samples.filter(r => r.probability > 0),
    r = possible[index];
  return <FlowLab id="lab-inclusion-weights" label="Inspect actual inclusion denominators"><Figure job="C22" caption="A zero marginal chance blocks the displayed complete-target HT and ratio contract. The constructed target is shown for teaching, not recovered from an uncovered sample."><Compare><Table label="Unit chances and selected contributions" headers={["Unit", "y", "π", "Selected?", "y/π"]} rows={s.values.map((v, i) => [`U${i + 1}`, v, fmt(s.inclusion[i]), r.indices.includes(i) ? "Yes" : "No", s.inclusion[i] > 0 && r.indices.includes(i) ? fmt(r.contributions[r.indices.indexOf(i)]) : "—"])} /><Table label="All six subset probabilities" headers={["Units", "Probability"]} rows={s.samples.map(x => [x.indices.map(i => `U${i + 1}`).join("+"), fmt(x.probability)])} /></Compare><FlowControls><FlowChoice label="Selection law" value={mode} options={[["unequal", "Unequal chances"], ["equal", "Equal chances"], ["uncovered", "Only U1/U2"]]} onChange={v => {
          M(v);
          I(0);
        }} /><Slider name="Inspected possible pair" value={index + 1} onChange={v => I(v - 1)} min={1} max={possible.length} /><Reset onClick={() => {
          M("unequal");
          I(0);
        }} /></FlowControls><FlowReadout>Selected raw mean {fmt(r.raw)}. {s.covered ? <>Fixed-N HT mean <strong>{fmt(r.ht)}</strong>; normalized ratio mean <strong>{fmt(r.ratio)}</strong>; target 6.</> : <>U3/U4 are uncovered: complete-target HT and ratio results are undefined under this contract.</>}</FlowReadout>{s.covered && <Table label="Expectations over this whole design" headers={["Estimator", "Expectation", "Variance"]} rows={[["Raw", fmt(s.raw.mean), fmt(s.raw.variance)], ["Fixed-N HT", fmt(s.ht.mean), fmt(s.ht.variance)], ["Normalized ratio", fmt(s.ratio.mean), fmt(s.ratio.variance)]]} />}</Figure></FlowLab>;
}
export function StratifiedDesignLab() {
  const [mode, M] = useState("ordered"),
    [a, A] = useState(2),
    [b, B] = useState(2),
    s = stratifiedState(mode, a, b);
  return <FlowLab id="lab-stratified-design" label="Compare stratification at matched sample size"><Figure job="C29" caption="The two strata supply independent selections. Their true variance contributions use population weights squared; comparison SRS uses the same total n."><Table label="Fixed partition" headers={["Stratum", "Original IDs", "Population values", "Selected count"]} rows={s.groups.map((g, i) => [i + 1, g.map(j => `U${j + 1}`).join(","), g.map(j => s.srs.population[j]).join(","), i ? b : a])} /><Compare><Law label="Stratified mean" values={s.samples.map(r => r.mean)} range={[0, 18]} target={9} /><Law label="Matched-n SRS mean" values={s.srs.samples.map(r => r.mean)} range={[0, 18]} target={9} /></Compare><FlowControls><FlowChoice label="Fixed population partition" value={mode} options={[["ordered", "Similar within strata"], ["mixed", "Mixed within strata"]]} onChange={M} /><Slider name="Stratum 1 sample size" value={a} onChange={A} min={1} max={4} /><Slider name="Stratum 2 sample size" value={b} onChange={B} min={1} max={4} /><Reset onClick={() => {
          M("ordered");
          A(2);
          B(2);
        }} /></FlowControls><FlowReadout>Known stratum variance components {fmt(s.components[0])}+{fmt(s.components[1])} = <strong>{fmt(s.variance)}</strong>; matched SRS variance {fmt(s.srs.variance)}. At nₕ=1 this uses known population variance, not an estimated within-stratum sample variance.</FlowReadout><SampleLedger samples={s.samples} label="Complete product sampling law" /></Figure></FlowLab>;
}
export function SystematicDesignLab() {
  const [mode, M] = useState("alternating"),
    [start, S] = useState(0),
    s = systematicState(mode, start),
    r = s.samples[start];
  return <FlowLab id="lab-systematic-design" label="Compare random-start systematic samples"><Figure job="C31" caption="Only the first or second start is randomized; every second position then follows deterministically. Both designs share n=4 and inclusion 1/2."><UnitArray values={s.population} selected={r.indices} /><Compare><Law label="Random-start systematic mean" values={s.samples.map(x => x.mean)} range={[0, 10]} target={5} selected={r.mean} /><Law label="SRS mean" values={s.srs.samples.map(x => x.mean)} range={[0, 10]} target={5} /></Compare><FlowControls><FlowChoice label="Fixed order" value={mode} options={[["alternating", "Alternating 0/10"], ["grouped", "Grouped 0 then 10"]]} onChange={v => {
          M(v);
          S(0);
        }} /><FlowChoice label="Inspected start" value={start} options={[[0, "First position"], [1, "Second position"]]} onChange={S} /><Reset onClick={() => {
          M("alternating");
          S(0);
        }} /></FlowControls><FlowReadout>Inspected estimate <strong>{fmt(r.mean)}</strong>; exact systematic variance {fmt(s.variance)} versus SRS {fmt(s.srs.variance)}. Both expectations 5.</FlowReadout><SampleLedger samples={s.samples} /></Figure></FlowLab>;
}
export function UnitsRepeatsLab() {
  const [g, G] = useState(4),
    [m, M] = useState(4),
    [preset, P] = useState("unit"),
    pairs = {
      unit: [4, 1],
      reading: [1, 4],
      zero: [0, 0]
    },
    v = pairs[preset],
    s = groupedMeasurementState(g, m, ...v);
  return <FlowLab id="lab-units-repeats" label="Separate independent units from repeated readings"><Figure job="C35" caption="Each leaf is a reading, not an observed value. The declared presets compare unit-heavy (4, 1), reading-heavy (1, 4) and exactly zero (0, 0) component variances; bias stays 0."><Compare><GroupTree groups={g} repeats={m} /><Contributions label="Variance of balanced mean" rows={[{
          label: "Unit",
          value: s.unitComponent
        }, {
          label: "Reading",
          value: s.readingComponent,
          tone: "cyan"
        }]} range={[0, 9]} /></Compare><FlowControls><Slider name="Independent units G" value={g} onChange={G} min={1} max={16} /><Slider name="Readings per unit m" value={m} onChange={M} min={1} max={16} /><FlowChoice label="Declared component variances" value={preset} options={[["unit", "Unit-heavy 4, 1"], ["reading", "Reading-heavy 1, 4"], ["zero", "Zero 0, 0"]]} onChange={P} /><Reset onClick={() => {
          G(4);
          M(4);
          P("unit");
        }} /></FlowControls><FlowReadout>{s.readings} reading rows from {g} independent units. Variance <strong>{fmt(s.variance)}</strong> = {v[0]}/{g}+{v[1]}/({g}×{m}); SD {fmt(s.standardError)}. {preset === "zero" ? "Both components vanish exactly." : ""}</FlowReadout></Figure></FlowLab>;
}
export function BiasPrecisionLab() {
  const [g, G] = useState(4),
    [b, B] = useState(0),
    s = groupedMeasurementState(g, 4, 4, 1, b);
  return <FlowLab id="lab-bias-precision" label="Change precision without erasing fixed bias"><Figure job="C37" caption="The declared variance model fixes m=4, σU²=4, σe²=1. The mean is θ+b; no bell-curve distribution is assumed."><Compare><NumberLine label="Mean displacement from θ" values={[b]} range={[-3, 3]} target={0} mean={b} height={250} units="Relative score" unitsY={220} /><Contributions label="MSE components" rows={[{
          label: "Variance",
          value: s.variance
        }, {
          label: "Bias²",
          value: b * b,
          tone: "rose"
        }, {
          label: "MSE",
          value: s.mse,
          tone: "violet"
        }]} range={[0, 14]} /></Compare><FlowControls><Slider name="Independent units G" value={g} onChange={G} min={1} max={16} /><Slider name="Fixed bias b" value={b} onChange={B} min={-3} max={3} step={.5} /><Reset onClick={() => {
          G(4);
          B(0);
        }} /></FlowControls><FlowReadout>Variance {fmt(s.variance)}, fixed bias {fmt(b)}, MSE <strong>{fmt(s.mse)}</strong>. Adding units reduces model variance while the fixed offset remains.</FlowReadout></Figure></FlowLab>;
}
export function CompleteAssignmentLab() {
  const [effect, E] = useState("constant"),
    [index, I] = useState(0),
    s = assignmentState("complete", effect),
    r = s.states[index];
  return <FlowLab id="lab-complete-assignment" label="Change assignment while outcomes remain stipulated"><Figure job="C43" caption="Every 3-of 6 allocation has probability 1/20. The full constructed science columns remain visible, separately from the observed projection; no reveal gate."><AssignmentDrawing state={s} index={index} /><Law label="Exact assigned contrast" values={s.states.map(x => x.difference)} range={[-14, 18]} target={s.target} selected={r.difference} /><FlowControls><FlowChoice label="Constructed individual effects" value={effect} options={[["constant", "All effects 2"], ["heterogeneous", "Effects 0, 2, 4, 0, 2, 4"]]} onChange={v => {
          E(v);
          I(0);
        }} /><Slider name="Inspected allocation" value={index + 1} onChange={v => I(v - 1)} min={1} max={20} /><Reset onClick={() => {
          E("constant");
          I(0);
        }} /></FlowControls><FlowReadout>Observed treated mean {fmt(r.treatedMean)}, control mean {fmt(r.controlMean)}, contrast <strong>{fmt(r.difference)}</strong>. Fixed enrolled target {fmt(s.target)}, design expectation {fmt(s.expectation)}, variance {fmt(s.variance)}.</FlowReadout><SampleLedger samples={s.states} label="All 20 equally likely allocations" /></Figure></FlowLab>;
}
export function BlockAssignmentLab() {
  const [mode, M] = useState("prognostic"),
    [index, I] = useState(0),
    s = assignmentState(mode),
    r = s.states[index],
    complete = assignmentState();
  return <FlowLab id="lab-block-assignment" label="Compare useful and harmful pairs"><Figure job="C49" caption="The three fixed pairs independently choose one treated member each, giving eight equally likely allocations. Both contrast laws keep the −14..18/0..1 axes."><Table label="Actual within-pair comparisons" headers={["Pair", "Treated ID", "Control ID", "Treated value", "Control value", "Difference"]} rows={s.blocks.map((pair, i) => {
        const t = pair.find(j => r.indices.includes(j)),
          c = pair.find(j => !r.indices.includes(j));
        return [i + 1, `U${t + 1}`, `U${c + 1}`, s.treated[t], s.baseline[c], s.treated[t] - s.baseline[c]];
      })} /><Compare><Law label="Blocked contrast" values={s.states.map(x => x.difference)} range={[-14, 18]} target={2} selected={r.difference} /><Law label="Complete-randomization contrast" values={complete.states.map(x => x.difference)} range={[-14, 18]} target={2} /></Compare><FlowControls><FlowChoice label="Pretreatment fixed pairs" value={mode} options={[["prognostic", "Similar baselines"], ["mixed", "Unlike baselines"]]} onChange={v => {
          M(v);
          I(0);
        }} /><Slider name="Inspected allocation" value={index + 1} onChange={v => I(v - 1)} min={1} max={8} /><Reset onClick={() => {
          M("prognostic");
          I(0);
        }} /></FlowControls><FlowReadout>Realized pair-average contrast <strong>{fmt(r.difference)}</strong>; blocked variance {fmt(s.variance)}, complete variance {fmt(complete.variance)}. Both design expectations 2.</FlowReadout><SampleLedger samples={s.states} label="All 8 blocked assignments" /></Figure></FlowLab>;
}
export function FactorialInteractionLab() {
  const [i, I] = useState(4),
    [share, S] = useState(.5),
    s = factorialState(i, share);
  return <FlowLab id="lab-factorial-interaction" label="Inspect effects at a fixed B and in a target mixture"><Figure job="C52" caption="Four declared means in score units. Conditional A effects hold B fixed; changing target B shares weights those effects without changing any cell."><FactorialDrawing state={s} /><FlowControls><Slider name="Interaction contrast" value={i} onChange={I} min={-6} max={6} /><Slider name="Target share at B1" value={share} onChange={S} min={0} max={1} step={.25} /><Reset onClick={() => {
          I(4);
          S(.5);
        }} /></FlowControls><FlowReadout>A effect at B0: {fmt(s.lowBEffect)}; at B1: {fmt(s.highBEffect)}. Interaction {fmt(s.interaction)}. Target mixture effect <strong>{fmt(s.averageAEffect)}</strong>.</FlowReadout></Figure></FlowLab>;
}
export function BudgetAllocationLab() {
  const [b, B] = useState(32),
    [c, C] = useState(4),
    s = budgetState(b, c),
    X = g => 55 + (g - 1) * 16,
    Y = m => 265 - (m - 1) * 13;
  return <FlowLab id="lab-budget-allocation" label="Compare all feasible integer collection plans"><Figure job="C56" caption="Feasible plans satisfy G(c+m)≤budget, with G and m from 1 to 16 and per-reading cost 1. Minimum variance wins, then lower cost, fewer units, fewer repeats."><Compare><Scene label="Feasible independent-unit and reading plans" height={325}>{[1, 8, 16].map(v => <g key={v}><line x1={55} x2={295} y1={Y(v)} y2={Y(v)} className="sm-grid" /><Label x={40} y={Y(v) + 5} anchor="end">{v}</Label><Label x={X(v)} y={294}>{v}</Label></g>)}<path d="M55 70V265H295" className="sm-axis" />{s.plans.map((r, j) => <circle key={`${r.units}/${r.repeats}`} cx={X(r.units)} cy={Y(r.repeats)} r={j === 0 ? 6 : 3} className={`sm-${j === 0 ? "gold" : "cyan"}`} />)}<Label x={20} y={29} anchor="start">Readings/unit m</Label><Label x={170} y={321}>Independent units G</Label></Scene><Contributions label="Best declared plan variance" rows={[{
          label: "Unit",
          value: 4 / s.best.units
        }, {
          label: "Reading",
          value: 1 / (s.best.units * s.best.repeats),
          tone: "cyan"
        }]} range={[0, 5]} /></Compare><FlowControls><Slider name="Budget" value={b} onChange={B} min={16} max={64} /><Slider name="New-unit cost c" value={c} onChange={C} min={0} max={8} /><Reset onClick={() => {
          B(32);
          C(4);
        }} /></FlowControls><FlowReadout>Best declared plan G {s.best.units}, m {s.best.repeats}; cost {s.best.cost}; variance <strong>{fmt(s.best.variance)}</strong>. {s.plans.length} feasible plans. Changing the assumed costs/model can change the answer.</FlowReadout><Table label="Every feasible plan, ranked by the declared tie rule" headers={["G", "m", "Cost", "Variance"]} rows={s.plans.map(r => [r.units, r.repeats, r.cost, fmt(r.variance)])} /></Figure></FlowLab>;
}
export function MissingOutcomeLab() {
  const [a, A] = useState(0),
    [b, B] = useState(10),
    s = missingState(a, b);
  return <FlowLab id="lab-missing-outcome" label="Inspect possible completions without imputing observations"><Figure job="C57" caption="Hollow entries are hypothetical completions for two missing assigned A outcomes. Full denominators remain 4; the complete contrast bounds stay −1.25..3.75."><Compare><Scene label="Known and hypothetical assigned outcomes" height={290}>{[s.completion, [4, 5, 6, 7]].map((r, g) => <g key={g}><Label x={20} y={25 + g * 137} anchor="start">Assigned {g ? "B" : "A"}</Label>{r.map((v, i) => <Unit key={i} x={43 + i * 82} y={65 + g * 137} id={`${g ? "B" : "A"}${i + 1}`} value={fmt(v)} tone={g ? "cyan" : "gold"} missing={!g && i >= 2} r={18} />)}</g>)}</Scene><NumberLine label="Full contrast completion" values={[s.contrast]} range={[-2, 4]} ticks={[-2, 0, 2, 4]} target={0} mean={s.contrast} height={250} units="Score" /></Compare><FlowControls><Slider name="Hypothetical A3 score" value={a} onChange={A} min={0} max={10} /><Slider name="Hypothetical A4 score" value={b} onChange={B} min={0} max={10} /><Reset onClick={() => {
          A(0);
          B(10);
        }} /></FlowControls><FlowReadout>This possible completion gives contrast <strong>{fmt(s.contrast)}</strong>. Full bounds {fmt(s.lower)}..{fmt(s.upper)}; observed-only contrast {s.observedOnly}. These values do not discover the missing outcomes.</FlowReadout></Figure></FlowLab>;
}
