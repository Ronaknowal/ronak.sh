import { finiteProof, inclusionDesignState, jointInclusion, replacementState, calibration } from "../../data/sampling-measurement-flow-models.js";
import { Figure, Compare, Table, Scene, Label, Arrow, Unit, UnitArray, NumberLine, Contributions, tones, fmt } from "./SamplingMeasurementDrawings.jsx";
const population = finiteProof(),
  weighted = inclusionDesignState(),
  joint = jointInclusion();
export function CollectionTraceFigure() {
  const stages = [["Target", [1, 2, 3, 4, 5, 6, 7, 8]], ["Frame", [1, 2, 3, 4, 5, 6]], ["Sample", [1, 3, 4, 6]]];
  return <Figure job="C01" caption="The same IDs move through selection and assignment. U7/U8 have no route from this frame; the drawing specifies a process, not sample probabilities."><Scene label="Target, frame, sample, assigned conditions and records" height={620}>{stages.map(([name, ids], s) => <g key={name}><Label x={20} y={24 + s * 155} anchor="start">{name}</Label>{ids.map(i => <Unit key={i} x={42 + (i - 1) % 4 * 82} y={57 + s * 155 + Math.floor((i - 1) / 4) * 58} id={`U${i}`} r={17} tone={tones[(i - 1) % 4]} selected={s === 2} />)}{s < 2 && <Arrow x1={170} y1={128 + s * 155} x2={170} y2={145 + s * 155} />}</g>)}<Arrow x1={170} y1={450} x2={80} y2={462} /><Arrow x1={170} y1={450} x2={260} y2={462} tone="cyan" /><Label x={80} y={490} tone="gold">A: U1, U4</Label><Label x={260} y={490} tone="cyan">B: U3, U6</Label><Arrow x1={80} y1={507} x2={80} y2={546} /><Arrow x1={260} y1={507} x2={260} y2={546} tone="cyan" /><Label x={80} y={574}>Recorded IDs</Label><Label x={260} y={574}>Recorded IDs</Label></Scene></Figure>;
}
export function UnitRolesFigure() {
  return <Figure job="C02" caption="A class can be selected and assigned once while its students supply several readings. The hierarchy identifies the operation; it does not make its leaves independent."><Scene label="Class, student and reading hierarchy" height={370}><Unit x={170} y={43} id="C1" r={25} /><Label x={170} y={92}>Class selection / assignment</Label>{[80, 260].map((x, i) => <g key={x}><Arrow x1={170} y1={111} x2={x} y2={143} tone={i ? "cyan" : "gold"} /><Unit x={x} y={172} id={`S${i + 1}`} tone={i ? "cyan" : "gold"} /><Label x={x} y={217}>Student</Label>{[-35, 35].map((dx, j) => <g key={dx}><Arrow x1={x} y1={230} x2={x + dx} y2={271} tone={i ? "cyan" : "gold"} /><circle cx={x + dx} cy={282} r={6} className={`sm-${i ? "cyan" : "gold"}`} /><Label x={x + dx} y={318}>t{j + 1}</Label></g>)}</g>)}<Label x={170} y={363}>Reading at a stated time</Label></Scene></Figure>;
}
export function SelectionAssignmentFigure() {
  return <Figure job="C03" caption="The two separate random mechanisms protect different comparisons. Volunteer assignment and randomly selected observation occupy different cells."><Compare><Scene label="Selection and assignment are separate chance mechanisms" height={300}>{[0, 1].map(i => <g key={i}><circle cx={75} cy={65 + i * 135} r={24} className={`sm-unit sm-${i ? "cyan" : "gold"}`} /><Label x={75} y={70 + i * 135}>{i ? "Z" : "I"}</Label><Arrow x1={105} y1={65 + i * 135} x2={180} y2={65 + i * 135} tone={i ? "cyan" : "gold"} /><Label x={245} y={60 + i * 135}>{i ? "Condition" : "Enrollment"}</Label><Label x={245} y={85 + i * 135}>{i ? "A or B" : "In or out"}</Label></g>)}</Scene><Table label="Four operation combinations" headers={["Sampling", "Assignment", "Example"]} rows={[["Chance", "Chance", "Selected experiment"], ["Chosen", "Chance", "Volunteer experiment"], ["Chance", "Observed", "Selected observation"], ["Chosen", "Observed", "Convenience observation"]]} /></Compare></Figure>;
}
export function EstimandWeightsFigure() {
  return <Figure job="C05" caption="Equal-student weights give 56/8=7. Equal-class weights give each class one half, and hence (4+8)/2=6."><Compare><Scene label="Two and six students: class and student weights" height={355}>{[[2, 4], [6, 8]].map(([n, v], g) => <g key={g}><Label x={20} y={25 + g * 160} anchor="start">Class {g + 1}: mean {v}</Label>{Array.from({
            length: n
          }, (_, i) => <Unit key={i} x={42 + i % 4 * 82} y={62 + g * 160 + Math.floor(i / 4) * 62} id={`S${i + 1}`} r={16} tone={g ? "cyan" : "gold"} />)}<Label x={320} y={145 + g * 160} anchor="end">Class mass 1/2</Label></g>)}</Scene><Table label="Weight attached to each student" headers={["Class", "Students", "Student target", "Class target"]} rows={[[1, 2, "1/8", "1/4"], [2, 6, "1/8", "1/12"]]} /></Compare></Figure>;
}
export function RecordIdentityFigure() {
  return <Figure job="C06" caption="Both records refer to one student in one assigned class; time and assessment version distinguish observations without inventing new assignment units."><Compare><Scene label="One identity connected to multiple records" height={330}><Unit x={170} y={43} id="C1" /><Arrow x1={170} y1={67} x2={170} y2={104} /><Unit x={170} y={133} id="S1" tone="cyan" />{[75, 265].map((x, i) => <g key={x}><Arrow x1={170} y1={162} x2={x} y2={230} tone="cyan" /><circle cx={x} cy={248} r={8} className="sm-cyan" /><Label x={x} y={286}>Record {i + 1}</Label></g>)}</Scene><Table label="Record fields retain the unit key" headers={["Class", "Student", "Method", "Time", "Rubric", "Value"]} rows={[["C1", "S1", "A", "t1", "v1", "r1"], ["C1", "S1", "A", "t2", "v1", "r2"]]} /></Compare></Figure>;
}
export function OperationalQuantityFigure() {
  return <Figure job="C07" caption="The same learner can supply three different operational measurements. These are defined tasks and times; no observed scores are supplied."><Scene label="Immediate quiz, delayed retention and transfer measurements" height={430}><Unit x={170} y={42} id="S1" tone="cyan" />{["Immediate quiz", "Delayed retention", "New transfer task"].map((name, i) => <g key={name}><Arrow x1={170} y1={68 + i * 110} x2={170} y2={103 + i * 110} tone="cyan" /><path d={`M90 ${115 + i * 110}h160v36H90Z`} className="sm-unit sm-cyan" /><Label x={170} y={139 + i * 110}>{name}</Label></g>)}</Scene></Figure>;
}
export function MeasurementTraceFigure() {
  const s = calibration(0);
  return <Figure job="C08" caption="Six constructed readings sum to 72 mV. Their realized mean 12 mV is 2 mV above the 10 mV reference."><NumberLine label="Declared instrument readings" values={s.original} range={[8, 14]} ticks={[8, 10, 12, 14]} target={10} mean={12} units="mV" height={250} /></Figure>;
}
export function SharedCorrectionFigure() {
  return <Figure job="C10" caption="One correction error enters every adjusted reading. Its coefficient in the mean stays 1; independent reading errors have coefficients 1/n."><Compare><Scene label="Shared correction versus independent reading errors" height={320}><circle cx={170} cy={44} r={23} className="sm-unit sm-rose" /><Label x={170} y={49} tone="rose">C</Label>{[70, 170, 270].map((x, i) => <g key={x}><Arrow x1={170} y1={75} x2={x} y2={135} tone="rose" /><Unit x={x} y={163} id={`r${i + 1}`} tone="cyan" /><Arrow x1={x} y1={190} x2={170} y2={246} tone="cyan" /></g>)}<Label x={170} y={280}>Mean: shared C survives</Label></Scene><Contributions label="Variance of a corrected mean" rows={[{
        label: "Shared",
        value: 1,
        tone: "rose"
      }, {
        label: "Reading",
        value: 1 / 3,
        tone: "cyan"
      }]} range={[0, 1]} units="Shown for u²=σ²=1, n=3" /></Compare></Figure>;
}
export function UncertaintyRolesFigure() {
  return <Figure job="C11" caption="Type A and Type B name evaluation methods. Both can express components as variances; neither is a synonym for random or systematic error."><Scene label="Two evaluation routes feeding variance components" height={350}><Label x={85} y={25}>Repeated data</Label><Label x={255} y={25}>Other information</Label>{[85, 255].map((x, i) => <g key={x}><circle cx={x} cy={83} r={27} className={`sm-unit sm-${i ? "cyan" : "gold"}`} /><Label x={x} y={88}>{i ? "B" : "A"}</Label><Arrow x1={x} y1={117} x2={x} y2={180} tone={i ? "cyan" : "gold"} /><Label x={x} y={208}>{i ? "Reference u²" : "Repeated s²"}</Label><Arrow x1={x} y1={224} x2={170} y2={282} tone={i ? "cyan" : "gold"} /></g>)}<Label x={170} y={320}>Uncertainty components</Label></Scene></Figure>;
}
export function RubricAgreementFigure() {
  return <Figure job="C12" caption="Two blinded scorers judge the same response under one rubric. Agreement on that rubric and measurement of the intended construct are separate relationships."><Scene label="Same response to two scorers, with a separate construct link" height={360}><Unit x={170} y={40} id="R1" tone="violet" /><Label x={170} y={91}>Same response / rubric</Label>{[80, 260].map((x, i) => <g key={x}><Arrow x1={170} y1={108} x2={x} y2={154} tone={i ? "cyan" : "gold"} /><circle cx={x} cy={181} r={24} className={`sm-unit sm-${i ? "cyan" : "gold"}`} /><Label x={x} y={186}>S{i + 1}</Label></g>)}<line x1={106} x2={234} y1={181} y2={181} className="sm-line sm-violet" /><Label x={170} y={237}>Scorer agreement</Label><Arrow x1={170} y1={260} x2={170} y2={300} tone="rose" dashed /><Label x={170} y={335}>Intended ability?</Label></Scene></Figure>;
}
export function FixedPopulationFigure() {
  return <Figure job="C13" caption="All eight population values stay fixed. Total 72 divided by 8 gives target 9; randomness will enter only through selection."><UnitArray values={population.state.population} /></Figure>;
}
export function SampleStatisticFigure() {
  return <Figure job="C14" caption="The selected U1/U2 supply values 2/4: sum 6, divide by 2, realized mean 3. The full-population target remains 9."><Compare><UnitArray values={population.state.population} selected={[0, 1]} /><Scene label="Realized sample arithmetic" height={260}><Unit x={65} y={47} id="U1" value="2" /><Unit x={265} y={47} id="U2" value="4" tone="cyan" /><Arrow x1={65} y1={95} x2={170} y2={136} /><Arrow x1={265} y1={95} x2={170} y2={136} tone="cyan" /><Label x={170} y={173}>2+4 = 6</Label><Arrow x1={170} y1={186} x2={170} y2={213} /><Label x={170} y={246}>6/2 = 3</Label></Scene></Compare></Figure>;
}
export function InclusionIndicatorFigure() {
  return <Figure job="C16" caption="Only the two selected membership entries equal 1. Multiplying each entry by its fixed population value reconstructs the selected sum."><Table label="Membership and contribution" headers={["Unit", "Fixed y", "Indicator I", "Iy"]} rows={population.state.population.map((v, i) => [`U${i + 1}`, v, i < 2 ? 1 : 0, i < 2 ? v : 0])} /></Figure>;
}
export function MeanExpectationFigure() {
  return <Figure job="C17" caption="Each unit appears in 7 of 28 permitted subsets. Every fixed value therefore has expectation coefficient (7/28)/2=1/8; the contributions sum to 9."><Compare><Scene label="Seven included samples for U1" height={365}>{population.state.samples.filter(s => s.indices.includes(0)).map((s, i) => <g key={i}><Unit x={70} y={34 + i * 44} id="U1" r={15} /><Arrow x1={94} y1={34 + i * 44} x2={207} y2={34 + i * 44} /><Unit x={235} y={34 + i * 44} id={`U${s.indices[1] + 1}`} tone={tones[s.indices[1] % 4]} r={15} /></g>)}<Label x={170} y={360}>7 included /28 allowed</Label></Scene><Table label="Expectation contributions" headers={["Unit", "y", "Included", "y/8"]} rows={population.state.population.map((v, i) => [`U${i + 1}`, v, population.inclusionCounts[i], fmt(v / 8)])} /></Compare></Figure>;
}
export function IndicatorDependenceFigure() {
  return <Figure job="C18" caption="At fixed sample size 2, learning that U1 is selected leaves one slot among seven other units. Joint chance 1/28 differs from the independent product 1/16."><Scene label="Fixed-size inclusion changes the second chance" height={340}><Unit x={75} y={54} id="U1" /><Label x={252} y={60}>P=2/8</Label><Arrow x1={75} y1={86} x2={75} y2={145} /><Unit x={75} y={179} id="U2" tone="cyan" /><Label x={250} y={185}>P(U2|U1)=1/7</Label><Arrow x1={75} y1={215} x2={170} y2={272} tone="cyan" /><Label x={170} y={301}>Joint: (2/8)(1/7)=1/28</Label><Label x={170} y={330} tone="rose">Cov = −3/112</Label></Scene></Figure>;
}
export function FiniteVarianceFigure() {
  return <Figure job="C19" caption="The centered cross-product sum is −168. Multiplying it by negative indicator covariance produces +4.5; (31.5+4.5)/4=9."><Compare><Table label="Centered fixed-population ledger" headers={["Unit", "y−9", "(y−9)²"]} rows={population.residuals.map((v, i) => [`U${i + 1}`, v, population.squares[i]])} /><Contributions label="Variance of selected sum" rows={[{
        label: "Diagonal",
        value: population.diagonal
      }, {
        label: "Cross",
        value: population.cross,
        tone: "cyan"
      }, {
        label: "Total",
        value: population.diagonal + population.cross,
        tone: "violet"
      }]} range={[0, 40]} units="Divide total 36 by n²=4" /></Compare></Figure>;
}
export function FrameBiasFigure() {
  return <Figure job="C20" caption="The incomplete-frame census fixes the estimate at 5. Variance 0 cannot remove its −4 discrepancy from target 9; MSE is 16."><Compare><NumberLine label="Census of the wrong frame" values={[5]} range={[0, 18]} target={9} mean={5} height={250} /><Contributions label="MSE decomposition" rows={[{
        label: "Variance",
        value: 0,
        tone: "cyan"
      }, {
        label: "Bias²",
        value: 16,
        tone: "rose"
      }]} range={[0, 18]} /></Compare></Figure>;
}
export function SubsetLawFigure() {
  return <Figure job="C21" caption="The six sample probabilities sum to 1. Summing rows that contain a given ID gives its marginal inclusion chance; sample chance and marginal chance are different."><Compare><Table label="Complete two-unit sample law" headers={["Subset", "Probability", "Membership"]} rows={weighted.samples.map(s => [s.indices.map(i => `U${i + 1}`).join(" + "), fmt(s.probability), [0, 1, 2, 3].map(i => s.indices.includes(i) ? 1 : 0).join(" ")])} /><Table label="Unit inclusion probabilities" headers={["Unit", "π"]} rows={weighted.inclusion.map((p, i) => [`U${i + 1}`, fmt(p)])} /></Compare></Figure>;
}
export function InclusionCancellationFigure() {
  return <Figure job="C23" caption="For U1, 0.7×(2/0.7)+0.3×0=2. Summing the same cancellation across all units recovers total 24 without assuming independent inclusion."><Scene label="Included or absent contribution for U1" height={330}><Unit x={170} y={44} id="U1" value="y=2" />{[75, 265].map((x, i) => <g key={x}><Arrow x1={170} y1={103} x2={x} y2={160} tone={i ? "cyan" : "gold"} /><Label x={x} y={181}>p {i ? "0.3" : "0.7"}</Label><Label x={x} y={201}>{i ? "0" : "2/0.7"}</Label><Arrow x1={x} y1={222} x2={170} y2={275} tone={i ? "cyan" : "gold"} /></g>)}<Label x={170} y={314}>Expected contribution 2</Label></Scene></Figure>;
}
export function DenominatorTargetFigure() {
  return <Figure job="C24" caption="One expanded numerator 200/21 takes two distinct paths: a fixed denominator 4 or a selected-weight denominator 65/21."><Scene label="Fixed denominator versus realized normalized denominator" height={355}><Label x={170} y={35}>Expanded numerator 200/21</Label>{[85, 255].map((x, i) => <g key={x}><Arrow x1={170} y1={62} x2={x} y2={126} tone={i ? "cyan" : "gold"} /><Label x={x} y={166}>{i ? "÷65/21" : "÷4"}</Label><Arrow x1={x} y1={190} x2={x} y2={241} tone={i ? "cyan" : "gold"} /><Label x={x} y={278} tone={i ? "cyan" : "gold"}>{i ? "40/13" : "50/21"}</Label><Label x={x} y={320}>{i ? "Ratio mean" : "Fixed-N HT"}</Label></g>)}</Scene></Figure>;
}
export function JointInclusionVarianceFigure() {
  return <Figure job="C25" caption="Known-law variance uses all sixteen ordered terms; the selected-pair estimator uses its four observed terms divided by joint inclusion. They share an expectation, while a realized estimate may be negative."><Compare><Table label="Complete joint-inclusion matrix πij" headers={["i / j", "U1", "U2", "U3", "U4"]} rows={joint.pair.map((r, i) => [`U${i + 1}`, ...r.map(v => fmt(v))])} /><Table label="Complete covariance-weighted contributions" headers={["i / j", "U1", "U2", "U3", "U4"]} rows={joint.terms.map((r, i) => [`U${i + 1}`, ...r.map(v => fmt(v))])} /></Compare><Compare><Table label="Observed U1/U2: four ordered selected terms" headers={["i", "j", "Term / πij"]} rows={joint.selectedTerms.map(r => [`U${r.i + 1}`, `U${r.j + 1}`, fmt(r.value)])} /><Table label="Whole-design observed-pair variance estimates" headers={["Subset", "p", "Estimated total variance"]} rows={joint.selected.map(r => [r.indices.map(i => `U${i + 1}`).join("+"), fmt(r.probability), fmt(r.estimate)])} /></Compare><p className="sm-caption">Known total variance {fmt(joint.known)}; mean variance {fmt(joint.meanVariance)}. First observed-pair estimate 8080/441. These are rounded views of the exact Fraction calculation below.</p></Figure>;
}
export function ReplacementHistoriesFigure() {
  const s = replacementState();
  return <Figure job="C26" caption="HH counts every draw; HT counts distinct selected units. Draw probabilities 3/4, 1/4 imply distinct-unit chances 15/16, 7/16. Both full expectations are 10."><Compare><Scene label="Two draws with replacement" height={310}><Label x={170} y={25}>First draw</Label>{[75, 265].map((x, i) => <g key={i}><Unit x={x} y={66} id={i ? "B" : "A"} value={i ? "p=1/4" : "p=3/4"} tone={i ? "cyan" : "gold"} />{[-35, 35].map((dx, j) => <g key={dx}><Arrow x1={x} y1={115} x2={x + dx} y2={180} tone={j ? "cyan" : "gold"} /><Unit x={x + dx} y={208} id={j ? "B" : "A"} tone={j ? "cyan" : "gold"} r={16} /></g>)}</g>)}<Label x={170} y={289}>Repeated IDs remain repeated draws</Label></Scene><Table label="Complete ordered histories" headers={["Draws", "Probability", "HH total", "HT total"]} rows={s.histories.map(r => [r.ids.map(i => i ? "B" : "A").join(""), fmt(r.probability), fmt(r.hh), fmt(r.ht)])} /></Compare></Figure>;
}
export function ResponsePathFigure() {
  return <Figure job="C27" caption="Selection and usable-outcome gates act successively. A response adjustment requires its own assumptions; a zero-chance target unit has no selectable path."><Scene label="Selected ID can still have a missing outcome" height={380}><Unit x={170} y={40} id="U1" />{[0, 1].map(i => <g key={i}><Arrow x1={170} y1={70 + i * 120} x2={170} y2={108 + i * 120} /><circle cx={170} cy={142 + i * 120} r={30} className={`sm-unit sm-${i ? "rose" : "gold"}`} /><Label x={170} y={147 + i * 120}>{i ? "R" : "I"}</Label><Label x={300} y={146 + i * 120} anchor="end">{i ? "Usable?" : "Selected?"}</Label></g>)}<Arrow x1={170} y1={298} x2={170} y2={327} tone="cyan" /><Label x={170} y={359}>Recorded only if I=R=1</Label></Scene></Figure>;
}
