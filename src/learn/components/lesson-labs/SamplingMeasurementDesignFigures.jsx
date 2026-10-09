import { samplingPopulation, targetWeights, systematicState, groupedMeasurementState, sharedNoiseState, pairedState, assignmentState, neymanLedger, factorialState, precisionRows, protocolState } from "../../data/sampling-measurement-flow-models.js";
import { Figure, Compare, Table, Scene, Label, Arrow, Unit, UnitArray, NumberLine, Contributions, GroupTree, AssignmentDrawing, FactorialDrawing, tones, fmt } from "./SamplingMeasurementDrawings.jsx";
export function StrataClusterFigure() {
  return <Figure job="C28" caption="Selection rings identify the same four rows under two distinct operations: some units from each group, or every unit in one selected group."><Compare>{[[0, 2, 5, 7], [0, 1, 2, 3]].map((selected, k) => <Scene key={k} label={k ? "One whole cluster" : "Some units in both strata"} height={285}><Label x={170} y={25}>{k ? "Whole selected cluster" : "Sample within both strata"}</Label>{[0, 1].map(g => <g key={g}><path d={`M16 ${42 + g * 108}h310v87H16Z`} className={`sm-unit sm-${g ? "cyan" : "gold"}`} />{[0, 1, 2, 3].map(i => <Unit key={i} x={48 + i * 81} y={85 + g * 108} id={`U${g * 4 + i + 1}`} tone={tones[i]} selected={selected.includes(g * 4 + i)} r={18} />)}</g>)}</Scene>)}</Compare></Figure>;
}
export function StratumWeightFigure() {
  const s = targetWeights();
  return <Figure job="C30" caption="Changing the population group sizes to 2 and 6 changes target shares to 1/4 and 3/4. Equal realized sample counts do not change those shares."><Compare><Contributions label="Population-weighted target" rows={[{
        label: "Class 1",
        value: 1
      }, {
        label: "Class 2",
        value: 6,
        tone: "cyan"
      }, {
        label: "Mean",
        value: s.studentMean,
        tone: "violet"
      }]} range={[0, 8]} units="Score contributions: (2/8)4, (6/8)8" /><Table label="Different target weights" headers={["Group", "N", "Mean", "Population weight"]} rows={[[1, 2, 4, "1/4"], [2, 6, 8, "3/4"]]} /></Compare></Figure>;
}
export function EqualMarginalFigure() {
  const s = systematicState();
  return <Figure job="C32" caption="Each U has marginal inclusion 1/2 in both designs. Systematic sampling has two permitted subsets, while SRS has 70; their pair dependence and variance differ."><Compare><Scene label="Only two systematic subsets" height={300}>{s.samples.map((r, j) => <g key={j}><Label x={170} y={25 + j * 132}>Start {j + 1}; probability 1/2</Label>{r.indices.map((i, k) => <Unit key={i} x={44 + k * 82} y={65 + j * 132} id={`U${i + 1}`} value={s.population[i]} tone={j ? "cyan" : "gold"} r={18} />)}</g>)}</Scene><Table label="Same marginal; different sample space" headers={["Rule", "Subsets", "π", "Variance"]} rows={[["Systematic", 2, "1/2", 25], ["SRS", 70, "1/2", "25/7"]]} /></Compare></Figure>;
}
export function MultistageProbabilityFigure() {
  return <Figure job="C33" caption="School selection is shared by its student branches. A student's chance is (10/100)(30/60)=1/20; two student marginals do not imply independent selection."><Scene label="Shared school gate then conditional student gate" height={365}><Unit x={170} y={43} id="School" r={31} /><Label x={170} y={100}>P(school)=10/100</Label>{[80, 260].map((x, i) => <g key={i}><Arrow x1={170} y1={123} x2={x} y2={188} tone={i ? "cyan" : "gold"} /><Unit x={x} y={219} id={`S${i + 1}`} tone={i ? "cyan" : "gold"} /><Label x={x} y={277}>P(S|school)</Label><Label x={x} y={305}>=30/60</Label></g>)}<Label x={170} y={355}>One shared first-stage event</Label></Scene></Figure>;
}
export function SharedReadingsFigure() {
  return <Figure job="C34" caption="Each unit effect feeds all readings in its own branch. Distinct unit effects and all reading noises are independent under the declared new-unit model."><GroupTree groups={3} repeats={4} /></Figure>;
}
export function VarianceAggregationFigure() {
  return <Figure job="C36" caption="Four copies of one Ug carry coefficient 4/(G×4)=1/G. Independent reading noises each carry 1/(Gm); squared coefficients produce the two variance terms."><Compare><Scene label="Repeated shared coefficient before averaging" height={305}><Unit x={170} y={42} id="Ug" tone="rose" />{[45, 128, 212, 295].map(x => <g key={x}><Arrow x1={170} y1={74} x2={x} y2={123} tone="rose" /><Label x={x} y={149}>Ug</Label><Arrow x1={x} y1={173} x2={170} y2={224} tone="rose" /></g>)}<Label x={170} y={260}>4Ug/(4G) = Ug/G</Label><Label x={170} y={293}>Shared copies add before squaring</Label></Scene><Table label="Independent component coefficients" headers={["Family", "Terms", "Coefficient", "Variance"]} rows={[["Unit effects", "G", "1/G", "σU²/G"], ["Reading errors", "Gm", "1/(Gm)", "σe²/(Gm)"]]} /></Compare></Figure>;
}
export function DesignEffectFigure() {
  const s = groupedMeasurementState();
  return <Figure job="C38" caption="For G=m=4, shared variance 4 and reading variance 1, the balanced mean has variance 17/16; sixteen independent readings with marginal variance 5 have 5/16. Their ratio is 17/5."><Compare><Contributions label="Matched variance comparison" rows={[{
        label: "Grouped",
        value: s.variance
      }, {
        label: "Independent",
        value: s.independentVariance,
        tone: "cyan"
      }]} range={[0, 1.25]} /><Table label="Model-specific covariance relation" headers={["Quantity", "Value"]} rows={[["Covariance", 4], ["Marginal variance", 5], ["ρ", "4/5"], ["1+(m−1)ρ", "17/5"]]} /></Compare></Figure>;
}
export function PairedSharedNoiseFigure() {
  const s = sharedNoiseState();
  return <Figure job="C39" caption="Shared S enters both channels with the same sign. Averaging retains S; subtracting B−A cancels it. All eight equally likely outcomes are retained below."><Compare><Scene label="Shared-noise fork and two target combinations" height={370}><Unit x={170} y={40} id="S" tone="rose" />{[75, 265].map((x, i) => <g key={i}><Arrow x1={170} y1={72} x2={x} y2={137} tone="rose" /><Label x={x} y={166} tone={i ? "cyan" : "gold"}>{i ? "20+S+eB" : "10+S+eA"}</Label><Arrow x1={x} y1={189} x2={170} y2={230} tone={i ? "cyan" : "gold"} /></g>)}<Label x={170} y={270}>(A+B)/2: retains S</Label><Label x={170} y={307}>B−A: cancels S</Label><Label x={170} y={350}>Mean/variance:15, 4.5 /10, 2</Label></Scene><Table label="Eight constructed joint outcomes, mV" headers={["S", "A", "B", "Average", "B−A"]} rows={s.rows.map(r => [r.shared, r.A, r.B, r.average, r.difference])} /></Compare></Figure>;
}
export function SignalPreservationFigure() {
  return <Figure job="C40" caption="The average has θ coefficient 1/2+1/2=1. The difference has coefficient −1+1=0; it removes the common signal as well as a shared disturbance."><Scene label="Weights determine target sensitivity" height={375}><Unit x={170} y={42} id="θ" r={25} tone="violet" />{[80, 260].map((x, i) => <g key={i}><Arrow x1={170} y1={77} x2={x} y2={133} tone="violet" /><Label x={x} y={169}>{i ? "B−20" : "A−10"}</Label><Label x={x} y={205}>Contains θ</Label><Arrow x1={x} y1={230} x2={170} y2={280} tone={i ? "cyan" : "gold"} /></g>)}<Label x={170} y={317}>Average: (1/2+1/2)θ=θ</Label><Label x={170} y={355} tone="rose">Difference: (−1+1)θ=0</Label></Scene></Figure>;
}
export function PairedObservedDataFigure() {
  const s = pairedState(),
    X = v => 70 + (v + 2) / 8 * 235;
  return <Figure job="C41" caption="All ten recorded people retain their IDs. The horizontal segments join two recorded quantities, not randomized causal effects. Observed mean difference 1.58 h; iid-pair model SE≈0.388959 h."><Compare><Scene label="Ten keyed paired drug measurements" height={540}><Label x={170} y={25}>Drug 1 gold → drug 2 cyan</Label>{s.rows.map((r, i) => {
          const y = 55 + i * 40;
          return <g key={r.id}><Label x={18} y={y + 5} anchor="start">{r.id}</Label><line x1={X(r.a)} x2={X(r.b)} y1={y} y2={y} className="sm-axis" /><circle cx={X(r.a)} cy={y} r={5} className="sm-gold" /><circle cx={X(r.b)} cy={y} r={5} className="sm-cyan" /></g>;
        })}<line x1={70} x2={305} y1={465} y2={465} className="sm-axis" />{[-2, 0, 2, 4, 6].map(v => <Label key={v} x={X(v)} y={492}>{v}</Label>)}<Label x={170} y={531}>Extra hours relative to control</Label></Scene><Table label="Complete observed paired records" headers={["Person", "Drug 1 h", "Drug 2 h", "Difference h"]} rows={s.rows.map((r, i) => [r.id, fmt(r.a), fmt(r.b), fmt(s.differences[i])])} /></Compare></Figure>;
}
export function PotentialOutcomeAnatomyFigure() {
  return <Figure job="C42" caption="Both columns are stipulated for the constructed population. A white ring identifies the one entry observed under the shown first-three-treated assignment."><AssignmentDrawing state={assignmentState()} /></Figure>;
}
export function AssignmentExpectationFigure() {
  return <Figure job="C44" caption="Assignment probability cancels each fixed arm denominator. Linearity of expectation yields the enrolled difference of means, even though the two assignments compete for slots."><Scene label="Treatment and control probability cancellation" height={345}>{[80, 260].map((x, i) => <g key={i}><Label x={x} y={35}>{i ? "Control" : "Treatment"}</Label><Unit x={x} y={77} id={i ? "1−Zi" : "Zi"} r={27} tone={i ? "cyan" : "gold"} /><Label x={x} y={138}>{i ? "E=n0/N" : "E=n1/N"}</Label><Arrow x1={x} y1={157} x2={x} y2={205} tone={i ? "cyan" : "gold"} /><Label x={x} y={239}>{i ? "(n0/N)/n0" : "(n1/N)/n1"}</Label><Label x={x} y={275}>=1/N</Label></g>)}<Label x={170} y={331}>Average Y(1) − average Y(0)</Label></Scene></Figure>;
}
export function RandomizationVarianceFigure() {
  return <Figure job="C45" caption="The complete-randomization variance retains the negative individual-effect term. It is zero for constant effects, and nonzero for the heterogeneous fixture."><Compare>{["constant", "heterogeneous"].map(effect => {
        const s = neymanLedger(effect);
        return <div key={effect}><Contributions label={effect === "constant" ? "Constant individual effects" : "Heterogeneous effects"} rows={[{
            label: "S1²/3",
            value: s.s1 / 3
          }, {
            label: "S0²/3",
            value: s.s0 / 3,
            tone: "cyan"
          }, {
            label: "−Sτ²/6",
            value: -s.st / 6,
            tone: "rose"
          }, {
            label: "Variance",
            value: s.neymanVariance,
            tone: "violet"
          }]} range={[-2, 20]} /><p className="sm-caption">Exact enumerated variance {effect === "constant" ? "203/15" : "251/15"} = {fmt(s.variance)}.</p></div>;
      })}</Compare></Figure>;
}
export function MissingCounterfactualFigure() {
  const s = assignmentState(),
    a = s.states[0];
  return <Figure job="C46" caption="Both completions produce the same observed records. Only unobserved control entries change: the enrolled effect changes from 2 to 1 and effect variance from 0 to 6/5."><Compare><Table label="Same observed first-three-treated records" headers={["Unit", "Assigned", "Observed"]} rows={a.observed.map((v, i) => [`U${i + 1}`, i < 3 ? "A" : "B", v])} /><Table label="Two possible complete science tables" headers={["Unit", "Y0 A", "Y0 B", "Y1 both", "Unobserved change"]} rows={s.baseline.map((v, i) => [`U${i + 1}`, v, i < 3 ? s.treated[i] : v, s.treated[i], i < 3 ? "Y(0) only" : "None"])} /></Compare></Figure>;
}
export function DesignScopeFigure() {
  return <Figure job="C47" caption="Random assignment addresses the enrolled comparison. Crossing to a wider population requires a selection and effect-transfer argument."><Scene label="Enrolled population within wider target" height={330}><ellipse cx={170} cy={155} rx={150} ry={110} className="sm-unit sm-violet" /><Label x={170} y={35}>Wider target population</Label><ellipse cx={115} cy={155} rx={70} ry={62} className="sm-unit sm-gold" /><Label x={115} y={143}>Enrolled</Label><Label x={115} y={174}>τ target</Label><Arrow x1={192} y1={155} x2={280} y2={155} tone="rose" dashed /><Label x={170} y={300}>Selection + transfer information</Label></Scene></Figure>;
}
export function ProtectionTraceFigure() {
  return <Figure job="C48" caption="Concealment blocks advance assignment information from recruitment decisions; blinding blocks condition information from behavior or scoring. A saved seed documents the procedure."><Scene label="Recruitment, assignment, measurement and information paths" height={380}>{["Recruit", "Assign", "Measure"].map((s, i) => <g key={s}><circle cx={170} cy={45 + i * 125} r={30} className={`sm-unit sm-${tones[i]}`} /><Label x={170} y={50 + i * 125}>{s}</Label>{i < 2 && <Arrow x1={170} y1={82 + i * 125} x2={170} y2={130 + i * 125} tone={tones[i]} />}</g>)}<path d="M214 170H290V45H215" className="sm-line sm-rose" strokeDasharray="4 3" /><path d="M207 295H260V170H213" className="sm-line sm-rose" strokeDasharray="4 3" /><Label x={20} y={105} anchor="start" tone="rose">Conceal</Label><Label x={20} y={231} anchor="start" tone="rose">Blind</Label><Label x={170} y={375}>Block information at its decision</Label></Scene></Figure>;
}
export function BlockContrastFigure() {
  return <Figure job="C50" caption="Each independently randomized pair has mean effect 2. Similar-pair fluctuations ±1 give variance 3/9=1/3; unlike-pair fluctuations ±11, ±9, ±1 give 203/9."><Compare><Scene label="Within-pair differences remove between-pair levels" height={300}>{[[0, 1], [5, 6], [10, 11]].map(([a, b], i) => <g key={i}><Unit x={70} y={45 + i * 85} id={`P${i + 1}`} value={a} tone={tones[i]} r={17} /><Arrow x1={95} y1={45 + i * 85} x2={230} y2={45 + i * 85} tone={tones[i]} /><Label x={170} y={31 + i * 85}>Gap 1</Label><Unit x={260} y={45 + i * 85} id={`P${i + 1}`} value={b} tone={tones[i]} r={17} /></g>)}</Scene><Table label="Coefficient-squared variance ledger" headers={["Pairs", "Fluctuations", "Squared sum", "Divide by 3²"]} rows={[["Similar", "±1, ±1, ±1", 3, "1/3"], ["Unlike", "±11, ±9, ±1", 203, "203/9"]]} /></Compare></Figure>;
}
export function AssignmentHierarchyFigure() {
  return <Figure job="C51" caption="The whole class or furnace run receives one factor; students or subplots receive another. Reading leaves retain their original assignment ancestor."><Scene label="Whole-unit and subunit assignment levels" height={390}><Unit x={170} y={44} id="C1" r={28} /><Label x={170} y={97}>Whole unit: factor A</Label>{[80, 260].map((x, i) => <g key={i}><Arrow x1={170} y1={112} x2={x} y2={160} tone={i ? "cyan" : "gold"} /><Unit x={x} y={188} id={`S${i + 1}`} tone={i ? "cyan" : "gold"} /><Label x={x} y={237}>Factor B={i}</Label>{[-24, 24].map(dx => <g key={dx}><Arrow x1={x} y1={255} x2={x + dx} y2={298} tone={i ? "cyan" : "gold"} /><circle cx={x + dx} cy={312} r={5} className={`sm-${i ? "cyan" : "gold"}`} /></g>)}</g>)}<Label x={170} y={375}>Repeated readings / same ancestor</Label></Scene></Figure>;
}
export function MissingFactorialCellFigure() {
  return <Figure job="C53" caption="The three reached cells 10, 12, 9 leave the fourth unconstrained. Both 11 and 15 fit those observations; the high-B A effect can therefore be 2 or 6."><Compare><Scene label="Three visited factorial corners and one unvisited corner" height={300}>{[[75, 75, 10], [265, 75, 12], [75, 215, 9], [265, 215, "?"]].map(([x, y, v], i) => <g key={i}><circle cx={x} cy={y} r={24} className={`sm-unit sm-${i === 3 ? "rose" : "gold"} ${i === 3 ? "sm-open" : ""}`} /><Label x={x} y={y + 5}>{v}</Label></g>)}<Arrow x1={106} y1={75} x2={230} y2={75} /><Arrow x1={75} y1={105} x2={75} y2={180} /><Label x={170} y={276}>Dashed corner unvisited</Label></Scene><Table label="Compatible fourth-cell possibilities" headers={["Fourth mean", "A at B0", "A at B1", "Interaction"]} rows={[[11, 2, 2, 0], [15, 2, 6, 4]]} /></Compare></Figure>;
}
export function MixtureEffectFigure() {
  return <Figure job="C54" caption="Conditional effects 2 and 6 stay fixed. Shares 3/4, 1/4 give contributions 1.5+1.5=3, while a uniform target gives 4."><Compare><Contributions label="Declared target mixture" rows={[{
        label: "B0:3/4",
        value: 1.5
      }, {
        label: "B1:1/4",
        value: 1.5,
        tone: "cyan"
      }, {
        label: "Total",
        value: 3,
        tone: "violet"
      }]} range={[0, 6]} units="A-effect score contributions" /><Table label="Same effects; different target population" headers={["B1 share", "Effect at B0", "Effect at B1", "Weighted effect"]} rows={[[.25, 2, 6, 3], [.5, 2, 6, 4]]} /></Compare></Figure>;
}
export function PrecisionPlanningFigure() {
  const X = n => 55 + (n - 1) * 35,
    Y = v => 242 - v * 8;
  return <Figure job="C55" caption="The known finite-population variance 24/n−3 first reaches the declared variance target 1 at n 6. A census at n 8 has design variance 0."><Compare><Scene label="Exact finite variance versus integer sample size" height={320}>{[0, 1, 10, 21].map(v => <g key={v}><line x1={55} x2={300} y1={Y(v)} y2={Y(v)} className={`sm-${v === 1 ? "rose" : "grid"} sm-line`} /><Label x={40} y={Y(v) + 5} anchor="end">{v}</Label></g>)}<path d="M55 74V242H300" className="sm-axis" />{precisionRows.map(r => <g key={r.n}><circle cx={X(r.n)} cy={Y(r.variance)} r={5} className={`sm-${r.n === 6 ? "gold" : "cyan"}`} /><Label x={X(r.n)} y={270}>{r.n}</Label></g>)}<Label x={170} y={308}>Sample size n; squared score units</Label></Scene><Table label="Complete integer precision plans" headers={["n", "Variance", "SD≤1?"]} rows={precisionRows.map(r => [r.n, fmt(r.variance), r.variance <= 1 ? "Yes" : "No"])} /></Compare></Figure>;
}
export function ProtocolTraceFigure() {
  const s = protocolState();
  return <Figure job="C58" caption="The seed 49 synthetic record trail has six assigned classes, twelve reading rows and three independently randomized pairs. Class contrasts 1, 5, 5 average to 11/3."><Compare><Table label="Exact class identity and reading trail" headers={["Class", "Method", "Reading 1", "Reading 2", "Class mean"]} rows={s.rows.map(r => [r.id, r.method, ...r.readings, r.mean])} /><Scene label="Class means become three within-pair contrasts" height={360}>{s.contrasts.map((v, i) => <g key={i}><Unit x={70} y={50 + i * 92} id={`P${i + 1}`} tone={tones[i]} /><Arrow x1={99} y1={50 + i * 92} x2={213} y2={50 + i * 92} tone={tones[i]} /><Label x={260} y={55 + i * 92}>Δ {v}</Label></g>)}<Label x={170} y={340}>(1+5+5)/3 = 11/3</Label></Scene></Compare></Figure>;
}
export function ProtocolTargetFigure() {
  return <Figure job="C59" caption="Frame, class assignment, outcome definition and target weighting remain connected. Equal-class contrasts and student-weighted contrasts need distinct population-weight contracts."><Scene label="Collection and target-weight contract" height={400}><Unit x={170} y={43} id="Class" r={31} /><Label x={170} y={104}>Frame + fixed pair</Label>{[80, 260].map((x, i) => <g key={i}><Arrow x1={170} y1={127} x2={x} y2={184} tone={i ? "cyan" : "gold"} /><Label x={x} y={215}>{i ? "Student target" : "Class target"}</Label><Label x={x} y={250}>{i ? "Known shares" : "Equal 1/3"}</Label><Arrow x1={x} y1={275} x2={170} y2={330} tone={i ? "cyan" : "gold"} /></g>)}<Label x={170} y={368}>Same declared outcome protocol</Label></Scene></Figure>;
}
