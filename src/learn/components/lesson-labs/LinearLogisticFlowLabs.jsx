import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { LessonTable } from './LessonElements.jsx';
import { residualReport, gradientTrace, logisticReport, sigmoid, binaryScoreLoss, thresholdReport, separationReport, separationOptimum, uncertaintyReport, featureMapReport } from '../../data/linear-logistic-models.js';
import { BinaryLikelihoodDrawing, RegressionAnatomyDrawing, RegressionPath, RegressionPlot, RegressionSeriesLabel, ShipmentResidualDrawing } from './LinearLogisticDrawings.jsx';
import './linear-logistic-flow.css';
import { weightedParcelReport, leveragedParcelReport } from '../../data/linear-logistic-flow-models.js';
import { WeightedRowDrawing } from './RegressionGeometryDrawings.jsx';
const number = (value, digits = 6) => flowNumber(value, digits);
function Reset({
  onReset
}) {
  return <div className="regression-flow-actions">
    <button type="button" onClick={onReset}>Reset to this example's starting values</button>
  </div>;
}
export function RegressionSelect({
  name,
  value,
  onChange,
  options
}) {
  return <label className="regression-flow-select">
    <span>{name}</span>
    <select aria-label={name} value={value} onChange={event => onChange(Number(event.target.value))}>
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </label>;
}
export function LeverageLab() {
  const [selected, setSelected] = useState(3);
  const [change, setChange] = useState(1);
  const report = leveragedParcelReport(selected, change);
  return <FlowLab id="regression-leverage" label="One changed target and its influence on the fitted line">
    <RegressionPlot name="regression-leverage-response" description="Changing one of the original four observed targets recomputes the shared line; four arrows show how that one target changes every fitted prediction" xDomain={[-.2, 3.2]} yDomain={[-1, 7]} xLabel="Original distance x (100 km)" yLabel="Elapsed hours" caption="A fresh copy of the original four shipments. Dashed gray is the original fit; solid violet is the changed fit. Orange arrows connect each original estimate to its changed estimate; the white outlined observation is the edited row.">
      {({
        xScale,
        yScale,
        left
      }) => <>
        <RegressionPath points={[[0, .9], [3, 3.6]]} xScale={xScale} yScale={yScale} color="#969b9f" dashed />
        <RegressionPath points={report.rows.map(row => [row.distance, row.predicted])} xScale={xScale} yScale={yScale} />
        {report.rows.map((row, index) => <g key={row.id}>
          <circle cx={xScale(row.distance)} cy={yScale(row.hours)} r={index === selected ? 7 : 4} fill="#090909" stroke="#eeeae3" strokeWidth={index === selected ? 3 : 1} />
          <line x1={xScale(row.distance)} x2={xScale(row.distance)} y1={yScale(.9 + .9 * row.distance)} y2={yScale(row.predicted)} stroke="#e99a61" strokeWidth={3} />
          <text x={xScale(row.distance)} y={yScale(row.hours) - 14} textAnchor="middle" fill="#eeeae3">{row.id}</text>
        </g>)}
        <RegressionSeriesLabel target={[xScale(2.8), yScale(report.intercept + 2.8 * report.slope)]} position={[left + 4, 46]}>changed fit</RegressionSeriesLabel>
        <RegressionSeriesLabel target={[xScale(.4), yScale(1.26)]} position={[left + 4, 223]} color="#969b9f">original fit</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <FlowControls>
      <RegressionSelect name="Changed shipment" value={selected} onChange={setSelected} options={[[0, 'A'], [1, 'B'], [2, 'C'], [3, 'D']]} />
      <FlowSlider name="Change to that observed target (hours)" value={change} onChange={setChange} min={-2} max={2} step={.1} />
    </FlowControls>
    <Reset onReset={() => {
      setSelected(3);
      setChange(1);
    }} />
    <FlowReadout>Shipment {report.rows[selected].id} has leverage <strong>{number(report.leverage)}</strong>. Its target moves by {number(change)} hours and its own fitted estimate moves by <strong>{number(report.leverage * change)}</strong> hours; the other predictions move too.</FlowReadout>
    <LessonTable caption="One edited target, four prediction responses" headers={['Row', 'Edited observed hours', 'Changed estimate', 'Estimate change', 'Leverage']} rows={report.rows.map((row, index) => [row.id, number(row.hours), number(row.predicted), number(row.predictionChange), number(.25 + (index - 1.5) ** 2 / 5)])} />
  </FlowLab>;
}
export function ResidualGeometryLab() {
  const [intercept, setIntercept] = useState(0);
  const [slope, setSlope] = useState(1);
  const report = residualReport(intercept, slope);
  return <FlowLab id="regression-residuals" label="Delivery-time line and its residuals">
    <ShipmentResidualDrawing report={report} />
    <FlowControls>
      <FlowSlider name="Intercept b (hours)" value={intercept} onChange={setIntercept} min={-1} max={4} step={.05} />
      <FlowSlider name="Slope w (hours per 100 km)" value={slope} onChange={setSlope} min={-1} max={3} step={.05} />
    </FlowControls>
    <Reset onReset={() => {
      setIntercept(0);
      setSlope(1);
    }} />
    <FlowReadout>The line {number(intercept)} + {number(slope)}x has mean squared error <strong>{number(report.mse)} hours²</strong>. Each square's area is its row's squared vertical error.</FlowReadout>
    <LessonTable caption="Four original shipments and the current shared line" headers={['Shipment / distance', 'Observed hours', 'Estimated hours', 'Residual', 'Squared residual']} rows={report.rows.map(row => [`${row.id} / ${row.distance}`, row.hours, number(row.predicted), number(row.residual), number(row.squared)])} />
  </FlowLab>;
}
export function ChangedEvidenceLab() {
  const [lastHours, setLastHours] = useState(4);
  const originalRule = residualReport(.9, .9, lastHours);
  const refit = residualReport(originalRule.bestIntercept, originalRule.bestSlope, lastHours);
  return <FlowLab id="regression-changed-evidence" label="Changed shipment D, fixed rule and recomputed rule">
    <RegressionPlot name="regression-changed-data" description="Shipment D moves vertically; two distinct lines compare the original fixed coefficients with the newly calculated least-squares coefficients" xDomain={[-.2, 3.2]} yDomain={[0, 9]} xLabel="Distance x (100 km)" yLabel="Elapsed hours" caption="Solid violet: newly fitted line. Dashed gray: original 0.9 + 0.9x. White circles: the current observations; only D changes.">
      {({
        xScale,
        yScale,
        left
      }) => <>
        <RegressionPath points={originalRule.rows.map(row => [row.distance, row.predicted])} xScale={xScale} yScale={yScale} color="#969b9f" dashed />
        <RegressionPath points={refit.rows.map(row => [row.distance, row.predicted])} xScale={xScale} yScale={yScale} />
        {refit.rows.map(row => <g key={row.id}>
          <circle cx={xScale(row.distance)} cy={yScale(row.hours)} r={5} fill="#eeeae3" />
          <text x={xScale(row.distance) - 8} y={yScale(row.hours) - 12} textAnchor="end" fill="#eeeae3">{row.id}</text>
        </g>)}
        <RegressionSeriesLabel target={[xScale(2.8), yScale(refit.bestIntercept + 2.8 * refit.bestSlope)]} position={[left + 4, 46]}>current fit</RegressionSeriesLabel>
        <RegressionSeriesLabel target={[xScale(.4), yScale(1.26)]} position={[left + 4, 244]} color="#969b9f">original fit</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <FlowControls>
      <FlowSlider name="Shipment D observed hours" value={lastHours} onChange={setLastHours} min={4} max={8} step={.25} />
    </FlowControls>
    <Reset onReset={() => setLastHours(4)} />
    <FlowReadout>D now takes {number(lastHours)} hours. Recomputing gives b=<strong>{number(refit.bestIntercept)}</strong>, w=<strong>{number(refit.bestSlope)}</strong>, MSE {number(refit.mse)}; the original fixed rule's MSE is {number(originalRule.mse)}.</FlowReadout>
    <LessonTable caption="Both rules evaluated on the same currently edited data" headers={['Rule', 'Intercept', 'Slope', 'MSE']} rows={[['Original fixed fit', .9, .9, number(originalRule.mse)], ['Recomputed current fit', number(refit.bestIntercept), number(refit.bestSlope), number(refit.mse)]]} />
  </FlowLab>;
}
export function LogisticScoreLab() {
  const [intercept, setIntercept] = useState(-1);
  const [weight, setWeight] = useState(1);
  const [feature, setFeature] = useState(2);
  const report = logisticReport({
    intercept,
    weight,
    feature,
    label: 1
  });
  return <FlowLab id="regression-logistic-score" label="Centered distance to score to probability">
    <RegressionAnatomyDrawing binary feature={feature} weight={weight} intercept={intercept} />
    <FlowControls>
      <FlowSlider name="Intercept b" value={intercept} onChange={setIntercept} min={-3} max={3} step={.25} />
      <FlowSlider name="Weight w" value={weight} onChange={setWeight} min={-2} max={2} step={.25} />
      <FlowSlider name="Centered distance x" value={feature} onChange={setFeature} min={-2} max={2} step={.25} />
    </FlowControls>
    <Reset onReset={() => {
      setIntercept(-1);
      setWeight(1);
      setFeature(2);
    }} />
    <FlowReadout>This parcel is {number((feature + 2) * 100)} km away: score <strong>{number(report.score)}</strong> gives probability <strong>{number(report.probability)}</strong> and odds {number(report.odds)}.</FlowReadout>
  </FlowLab>;
}
export function SigmoidDrawing() {
  return <RegressionPlot name="regression-sigmoid" description="Sigmoid turns a real score into a probability; its zero score maps to one half" xDomain={[-7, 7]} yDomain={[0, 1]} xLabel="Score z (log odds)" yLabel="Probability of label 1" caption="Violet is calculated probability. The white point is (score 0, probability 0.5); no decision threshold is applied here.">
    {({
      xScale,
      yScale,
      left
    }) => <>
      <RegressionPath points={Array.from({
        length: 113
      }, (_, index) => {
        const score = -7 + index / 8;
        return [score, sigmoid(score)];
      })} xScale={xScale} yScale={yScale} />
      <circle cx={xScale(0)} cy={yScale(.5)} r={5} fill="#eeeae3" />
      <RegressionSeriesLabel target={[xScale(3), yScale(sigmoid(3))]} position={[left + 4, 62]}>sigmoid p(z)</RegressionSeriesLabel>
    </>}
  </RegressionPlot>;
}
export function LogisticLossLab() {
  const [score, setScore] = useState(1);
  const [label, setLabel] = useState(1);
  const probability = sigmoid(score);
  const loss = binaryScoreLoss(score, label);
  return <FlowLab id="regression-logistic-loss" label="Observed binary label selects probability mass and loss">
    <BinaryLikelihoodDrawing score={score} label={label} />
    <FlowControls>
      <FlowSlider name="Score z" value={score} onChange={setScore} min={-6} max={6} step={.25} />
      <RegressionSelect name="Observed label y" value={label} onChange={setLabel} options={[[0, '0: met the deadline'], [1, '1: missed the deadline']]} />
    </FlowControls>
    <Reset onReset={() => {
      setScore(1);
      setLabel(1);
    }} />
    <FlowReadout>Label {label} receives probability <strong>{number(label ? probability : 1 - probability)}</strong> and loss <strong>{number(loss)}</strong>. Increasing its assigned probability lowers that loss.</FlowReadout>
  </FlowLab>;
}
export function GradientGeometryLab() {
  const [rate, setRate] = useState(.05);
  const [step, setStep] = useState(0);
  const states = gradientTrace(rate, 16);
  const current = states[step];
  const path = states.slice(0, step + 1).map(state => [state.intercept, state.slope]);
  const outside = path.some(([b, w]) => b < -.5 || b > 2.5 || w < -.5 || w > 2.5);
  const domains = [0, 1].map(axis => {
    const values = states.map(state => axis ? state.slope : state.intercept);
    const low = Math.min(-.5, ...values);
    const high = Math.max(2.5, ...values);
    const margin = (high - low) * .08;
    return [low - margin, high + margin];
  });
  const contours = [.05, .2, .8, 3].map(level => {
    const radius = Math.sqrt(14 * level / 5);
    const branch = sign => Array.from({
      length: 81
    }, (_, index) => {
      const deltaB = -radius + 2 * radius * index / 80;
      const deltaW = (-3 * deltaB + sign * Math.sqrt(Math.max(0, 14 * level - 5 * deltaB ** 2))) / 7;
      return [.9 + deltaB, .9 + deltaW];
    });
    return [...branch(1), ...branch(-1).reverse()];
  });
  const markers = ({
    xScale,
    yScale,
    left,
    bottom
  }) => <>
    <RegressionPath points={path} xScale={xScale} yScale={yScale} />
    <text x={xScale(.9)} y={yScale(.9) + 5} textAnchor="middle" fill="#eeeae3">×</text>
    <circle cx={xScale(current.intercept)} cy={yScale(current.slope)} r={5} fill="#090909" stroke="#eeeae3" strokeWidth={2} />
    <RegressionSeriesLabel target={[xScale(0), yScale(0)]} position={[left + 4, bottom - 14]}>updates from zero</RegressionSeriesLabel>
  </>;
  return <FlowLab id="regression-gradient" label="Same-old-state gradient updates in the parameter plane">
    <RegressionPlot name="regression-parameter-contours" description="Equal-loss ellipses and the actual parameter path; this fixed window magnifies the optimum" xDomain={[-.5, 2.5]} yDomain={[-.5, 2.5]} xLabel="Intercept b (hours)" yLabel="Slope w (hours per 100 km)" clipMarks caption="Fixed close view. Gray ellipses are equal-MSE contours; × is the optimum (0.9,0.9); violet joins updates; the outlined circle is the selected step. This view clips excursions at its axes.">
      {scales => <>
        {contours.map((points, index) => <RegressionPath key={index} points={points} {...scales} color="#676b70" />)}
        {markers(scales)}
      </>}
    </RegressionPlot>
    {outside && <RegressionPlot name="regression-full-gradient-path" description="An unclipped overview contains every one of the sixteen computed parameter updates at the selected learning rate" xDomain={domains[0]} yDomain={domains[1]} xLabel="Intercept b: full trajectory range" yLabel="Slope w: full trajectory range" caption="Full overview. Its domains depend on the selected rate's complete sixteen-step trace, then stay fixed as the step moves. The large excursion is actual divergence, not a displaced or clamped marker.">{markers}</RegressionPlot>}
    <FlowControls>
      <RegressionSelect name="Learning rate η" value={rate} onChange={value => {
        setRate(value);
        setStep(0);
      }} options={[[.05, '0.05'], [.2, '0.2'], [.3, '0.3']]} />
      <FlowSlider name="Number of updates" value={step} onChange={setStep} min={0} max={16} step={1} />
    </FlowControls>
    <Reset onReset={() => {
      setRate(.05);
      setStep(0);
    }} />
    <FlowReadout>Step {step} gives b={number(current.intercept)}, w={number(current.slope)}, MSE <strong>{number(current.mse)}</strong>; the current gradient is ({number(current.gradient[0])}, {number(current.gradient[1])}). {outside ? 'The full overview shows the excursion outside the close view.' : 'The selected path remains in the close view.'}</FlowReadout>
  </FlowLab>;
}
export function WeightedEvidenceLab() {
  const [importance, setImportance] = useState(.25);
  const report = weightedParcelReport(importance);
  return <FlowLab id="regression-weighted-evidence" label="Fixed shipment observations with changing observation importance">
    <WeightedRowDrawing importance={importance} />
    <RegressionPlot name="regression-weighted-line" description="Changing only shipment D importance changes the best weighted line; its target remains4hours" xDomain={[-.2, 3.2]} yDomain={[0, 5]} xLabel="Distance x (100 km)" yLabel="Elapsed hours" caption="Violet is the current weighted fit; white circles are the unchanged original observations. At αD=0, D contributes no training loss but remains visible as evidence.">
      {({
        xScale,
        yScale,
        left
      }) => <>
        <RegressionPath points={report.rows.map(row => [row.distance, row.predicted])} xScale={xScale} yScale={yScale} />
        <RegressionSeriesLabel target={[xScale(2), yScale(report.intercept + 2 * report.slope)]} position={[left + 4, 55]}>weighted fit</RegressionSeriesLabel>
        {report.rows.map(row => <g key={row.id}>
          <circle cx={xScale(row.distance)} cy={yScale(row.hours)} r={5} fill="#eeeae3" />
          <text x={xScale(row.distance) - 8} y={yScale(row.hours) - 12} textAnchor="end" fill="#eeeae3">{row.id}</text>
        </g>)}
      </>}
    </RegressionPlot>
    <FlowControls>
      <FlowSlider name="Shipment D importance αD" value={importance} onChange={setImportance} min={0} max={1} step={.05} />
    </FlowControls>
    <Reset onReset={() => setImportance(.25)} />
    <FlowReadout>With fixed targets and αD={number(importance)}, the weighted fit gives b=<strong>{number(report.intercept)}</strong>, w=<strong>{number(report.slope)}</strong> and weighted mean squared error {number(report.mse)}. Total importance is {number(report.total)}.</FlowReadout>
  </FlowLab>;
}
export function ThresholdDecisionsLab() {
  const [threshold, setThreshold] = useState(.5);
  const [missedCost, setMissedCost] = useState(4);
  const report = thresholdReport(threshold, missedCost);
  return <FlowLab id="regression-threshold" label="Fixed probabilities with changing warning gate and miss cost">
    <RegressionPlot name="regression-warning-gate" description="Six fixed probabilities retain their positions while the warning threshold moves; each row's supplied observed label stays fixed" xDomain={[0, 7]} yDomain={[0, 1]} xLabel="Validation row (V1 to V6)" yLabel="Fixed probability of missed deadline" caption="Violet points are model probabilities, with the observed label printed beside each. The orange dashed horizontal gate issues warnings at or above τ; the current decisions appear in the table.">
      {({
        xScale,
        yScale,
        left,
        right
      }) => <>
        <line x1={left} x2={right} y1={yScale(threshold)} y2={yScale(threshold)} stroke="#e99a61" strokeDasharray="5 4" />
        <RegressionSeriesLabel target={[right - 5, yScale(threshold)]} position={[left + 4, 22]} color="#e99a61">warning gate τ</RegressionSeriesLabel>
        {report.rows.map((row, index) => <g key={row.id}>
          <circle cx={xScale(index + 1)} cy={yScale(row.probability)} r={5} fill="#bb9aec" stroke={row.prediction ? '#eeeae3' : '#090909'} strokeWidth={2} />
          <text x={xScale(index + 1)} y={yScale(row.probability) - 15} textAnchor="middle" fill="#eeeae3">y={row.label}</text>
        </g>)}
      </>}
    </RegressionPlot>
    <FlowControls>
      <FlowSlider name="Warning threshold τ" value={threshold} onChange={setThreshold} min={0} max={1} step={.05} />
      <RegressionSelect name="Cost of a missed warning" value={missedCost} onChange={setMissedCost} options={[[1, '1'], [4, '4'], [10, '10']]} />
    </FlowControls>
    <Reset onReset={() => {
      setThreshold(.5);
      setMissedCost(4);
    }} />
    <FlowReadout>At τ={number(threshold)}, false warnings {report.fp} plus miss cost {missedCost} × missed deadlines {report.fn} give total cost <strong>{report.cost}</strong>. Precision is {number(report.precision)}; recall is {number(report.recall)}.</FlowReadout>
    <LessonTable caption="Truth versus the current fixed-score decision" headers={['Truth', 'No warning', 'Warning']} rows={[['0: met deadline', `${report.tn} true negatives`, `${report.fp} false positives`], ['1: missed deadline', `${report.fn} false negatives`, `${report.tp} true positives`]]} />
    <LessonTable caption="The probabilities remain fixed as the gate moves" headers={['Row', 'Probability', 'Observed label', 'Decision']} rows={report.rows.map(row => [row.id, row.probability, row.label, row.prediction ? 'Warn' : 'Stay quiet'])} />
  </FlowLab>;
}
export function SeparationPenaltyLab() {
  const [weight, setWeight] = useState(2);
  const [penalty, setPenalty] = useState(0);
  const report = separationReport(weight, penalty);
  const optimum = separationOptimum(penalty);
  const allPoints = Array.from({
    length: 97
  }, (_, index) => {
    const currentWeight = index / 8;
    return [currentWeight, separationReport(currentWeight, penalty).objective];
  });
  const marks = ({
    xScale,
    yScale,
    left,
    top,
    bottom
  }) => <>
    <RegressionPath points={allPoints} xScale={xScale} yScale={yScale} />
    <circle cx={xScale(weight)} cy={yScale(report.objective)} r={5} fill="#090909" stroke="#eeeae3" strokeWidth={2} />
    {optimum !== null && <line x1={xScale(optimum)} x2={xScale(optimum)} y1={top} y2={bottom} stroke="#e99a61" strokeDasharray="4 4" />}
    <RegressionSeriesLabel target={[xScale(1), yScale(separationReport(1, penalty).objective)]} position={[left + 4, 54]}>objective J</RegressionSeriesLabel>
  </>;
  return <FlowLab id="regression-separation" label="Loss infimum versus a finite penalized optimum">
    <RegressionPlot name="regression-separation-score" description="Two fixed labelled inputs at minus one and plus one receive opposite scores from the same slope; positive slopes classify both correctly while greater magnitudes change their probabilities" xDomain={[-1.5, 1.5]} yDomain={[-13, 13]} xLabel="Standardized feature x" yLabel="Score wx, intercept fixed at zero" caption="White labels give observed classes. Violet is the computed score line; the dashed gray score-zero line is the probability-0.5 decision boundary. The scores move symmetrically as w changes. At w=0 both probabilities are 0.5; every strictly positive w classifies both rows correctly.">
      {({
        xScale,
        yScale,
        left,
        right
      }) => <>
        <line x1={left} x2={right} y1={yScale(0)} y2={yScale(0)} stroke="#969b9f" strokeDasharray="4 4" />
        <RegressionPath points={[[-1, -weight], [1, weight]]} xScale={xScale} yScale={yScale} />
        {[-1, 1].map((input, index) => <g key={input}>
          <circle cx={xScale(input)} cy={yScale(input * weight)} r={5} fill="#bb9aec" />
          <text x={xScale(input)} y={yScale(input * weight) - 14} textAnchor="middle" fill="#eeeae3">y={index}</text>
          <line x1={xScale(input)} x2={xScale(input)} y1={yScale(0)} y2={yScale(input * weight)} stroke="#969b9f" />
        </g>)}
        <RegressionSeriesLabel target={[xScale(.4), yScale(.4 * weight)]} position={[left + 4, 48]}>score wx</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <p>The two loss views share the current coefficients and penalty, with fixed close and full scales.</p>
    <RegressionPlot name="regression-separation-close" description="The beginning of the exact objective curve reveals a finite minimum when the penalty is positive" xDomain={[0, 4]} yDomain={[0, .8]} xLabel="Weight w: close view 0 to 4" yLabel="Mean loss plus penalty" clipMarks caption="Fixed close view. Violet is the exact objective; white outline marks the current weight; orange dashed line marks a finite optimum. Higher weights or losses leave this view rather than being clamped.">{marks}</RegressionPlot>
    <RegressionPlot name="regression-separation-full" description="The same curve's full permitted weight and loss ranges include the selected point without clipping" xDomain={[0, 12]} yDomain={[0, 15]} xLabel="Weight w: full range 0 to 12" yLabel="Mean loss plus penalty" caption="Full view uses the same fixed axes for every penalty. At λ=0.2, the penalty reaches 14.4 at w=12; the close view above keeps the lower-loss geometry perceptible.">{marks}</RegressionPlot>
    <FlowControls>
      <FlowSlider name="Weight w" value={weight} onChange={setWeight} min={0} max={12} step={.25} />
      <RegressionSelect name="Penalty strength λ" value={penalty} onChange={setPenalty} options={[[0, '0'], [.02, '0.02'], [.2, '0.2']]} />
    </FlowControls>
    <Reset onReset={() => {
      setWeight(2);
      setPenalty(0);
    }} />
    <FlowReadout>Data loss {number(report.dataLoss)} + penalty {number(report.penaltyLoss)} = <strong>{number(report.objective)}</strong>. {optimum === null ? 'No finite unpenalized minimizer exists; zero loss is approached as w increases without bound.' : `The finite optimum is w=${number(optimum)}.`}</FlowReadout>
  </FlowLab>;
}
export function FeatureMapFigure() {
  const rows = featureMapReport();
  return <>
    <RegressionPlot name="regression-square-feature" description="Each signed sensor reading becomes a point on the parabola in the two-feature plane; the linear feature-space boundary is square equals one" xDomain={[-2.2, 2.2]} yDomain={[-.2, 4.5]} xLabel="Original sensor x" yLabel="Supplied second feature x²" caption="Cyan parabola maps x to the feature point (x,x²). Violet horizontal line x²=1 is the score-zero boundary for score x²−1. Its two intersections correspond to raw inputs −1 and +1.">
      {({
        xScale,
        yScale,
        left,
        right
      }) => <>
        <RegressionPath points={Array.from({
          length: 81
        }, (_, index) => {
          const x = -2 + index / 20;
          return [x, x * x];
        })} xScale={xScale} yScale={yScale} color="#67cbd9" />
        <line x1={left} x2={right} y1={yScale(1)} y2={yScale(1)} stroke="#bb9aec" />
        {[-1, 1].map(x => <circle key={x} cx={xScale(x)} cy={yScale(1)} r={5} fill="#eeeae3" />)}
        <RegressionSeriesLabel target={[xScale(-1.5), yScale(2.25)]} position={[left + 4, 58]} color="#67cbd9">feature map</RegressionSeriesLabel>
        <RegressionSeriesLabel target={[xScale(1.5), yScale(1)]} position={[left + 4, 242]}>boundary x²=1</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <LessonTable caption="The same five inputs traced through the feature map" headers={['Original x', 'New x²', 'Score x²−1', 'Probability']} rows={rows.map(row => [row.input, row.square, row.score, number(row.probability)])} />
  </>;
}
export function UncertaintyFigure() {
  const [query, setQuery] = useState(2.5);
  const current = uncertaintyReport(query);
  const rows = Array.from({
    length: 101
  }, (_, index) => uncertaintyReport(-1 + index / 10));
  const polygon = (key, xScale, yScale) => [...rows.map(row => [row.input, row.predicted + row[key]]), ...rows.toReversed().map(row => [row.input, row.predicted - row[key]])].map(([x, y]) => `${xScale(x)},${yScale(y)}`).join(' ');
  return <FlowLab id="regression-uncertainty" label="Mean and future-individual intervals at a chosen input">
    <RegressionPlot name="regression-pointwise-intervals" description="Two calculated pointwise 95 percent t intervals share the same fitted line and data; a new outcome has an additional noise term" xDomain={[-1, 9]} yDomain={[-3, 14]} xLabel="Input x (observed only from 0 to 5)" yLabel="Numerical outcome" caption="Inner violet region: fitted-mean interval. Outer cyan region: independent-new-outcome interval. White circles: six observed rows. Orange dashed line marks the query. These are pointwise model-based 95% intervals, not a simultaneous band or a guarantee of extrapolation.">
      {({
        xScale,
        yScale,
        left,
        top,
        bottom
      }) => <>
        <polygon points={polygon('individualHalfWidth', xScale, yScale)} fill="#67cbd9" fillOpacity={.12} stroke="#67cbd9" />
        <polygon points={polygon('meanHalfWidth', xScale, yScale)} fill="#bb9aec" fillOpacity={.22} stroke="#bb9aec" />
        <RegressionPath points={rows.map(row => [row.input, row.predicted])} xScale={xScale} yScale={yScale} />
        {current.observations.map((y, x) => <circle key={x} cx={xScale(x)} cy={yScale(y)} r={5} fill="#eeeae3" />)}
        <line x1={xScale(query)} x2={xScale(query)} y1={top} y2={bottom} stroke="#e99a61" strokeDasharray="5 4" />
        <RegressionSeriesLabel target={[xScale(7), yScale(uncertaintyReport(7).predicted + uncertaintyReport(7).individualHalfWidth)]} position={[left + 4, 46]} color="#67cbd9">new outcome</RegressionSeriesLabel>
        <RegressionSeriesLabel target={[xScale(6), yScale(uncertaintyReport(6).predicted + uncertaintyReport(6).meanHalfWidth)]} position={[left + 4, 77]}>mean interval</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <FlowControls>
      <FlowSlider name="Query input x" value={query} onChange={setQuery} min={-1} max={9} step={.1} />
    </FlowControls>
    <Reset onReset={() => setQuery(2.5)} />
    <FlowReadout>At x={number(query)}, fitted mean <strong>{number(current.predicted)}</strong> has mean half-width {number(current.meanHalfWidth)}; a new individual outcome has wider half-width <strong>{number(current.individualHalfWidth)}</strong>. {query < 0 || query > 5 ? 'This input extrapolates beyond the observed range.' : 'This input lies within the observed range.'}</FlowReadout>
    <LessonTable caption="Both interval questions on the same model" headers={['Input', 'Mean', 'Mean half-width', 'Individual half-width']} rows={[2.5, 8].map(input => {
      const report = uncertaintyReport(input);
      return [input, number(report.predicted, 4), number(report.meanHalfWidth, 4), number(report.individualHalfWidth, 4)];
    })} />
  </FlowLab>;
}
