import { useId, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { LessonTable } from './LessonElements.jsx';
import { residualReport, gradientTrace, logisticReport, sigmoid, thresholdReport, separationReport, separationOptimum, featureMapReport, uncertaintyReport } from '../../data/linear-logistic-models.js';
import './linear-logistic-labs.css';

const WIDTH = 560;
const HEIGHT = 260;
const LEFT = 58;
const RIGHT = 532;
const TOP = 22;
const BOTTOM = 212;
const fixed = (value, places = 3) => value === null ? 'undefined' : value.toFixed(places);

function Chart({ title, description, xDomain, yDomain, xLabel, yLabel, children }) {
  const xScale = value => LEFT + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * (RIGHT - LEFT);
  const yScale = value => BOTTOM - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * (BOTTOM - TOP);
  const clipId = useId().replaceAll(':', '');
  return <figure className="regression-figure">
    <div className="regression-chart-scroll" tabIndex={0} role="region" aria-label={`${title}; scroll horizontally if needed`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
        <title>{title}</title><desc>{description}</desc>
        <defs><clipPath id={clipId}><rect x={LEFT - 3} y={TOP - 3} width={RIGHT - LEFT + 6} height={BOTTOM - TOP + 6} /></clipPath></defs>
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
          const x = LEFT + fraction * (RIGHT - LEFT);
          const y = BOTTOM - fraction * (BOTTOM - TOP);
          return <g key={fraction}>
            <line x1={LEFT} x2={RIGHT} y1={y} y2={y} className="regression-grid" />
            <text x={LEFT - 10} y={y + 4} textAnchor="end">{fixed(yDomain[0] + fraction * (yDomain[1] - yDomain[0]), 1)}</text>
            <text x={x} y={BOTTOM + 19} textAnchor="middle">{fixed(xDomain[0] + fraction * (xDomain[1] - xDomain[0]), 1)}</text>
          </g>;
        })}
        <line x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} className="regression-axis" />
        <line x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} className="regression-axis" />
        <text x={(LEFT + RIGHT) / 2} y={HEIGHT - 7} textAnchor="middle">{xLabel}</text>
        <text x={14} y={(TOP + BOTTOM) / 2} transform={`rotate(-90 14 ${(TOP + BOTTOM) / 2})`} textAnchor="middle">{yLabel}</text>
        <g clipPath={`url(#${clipId})`}>{children({ xScale, yScale })}</g>
      </svg>
    </div>
    <figcaption>{description}</figcaption>
  </figure>;
}

function Polyline({ points, xScale, yScale, className = 'regression-line' }) {
  return <polyline points={points.map(([x, y]) => `${xScale(x)},${yScale(y)}`).join(' ')} fill="none" className={className} />;
}

export function PredictionProtocolFigure() {
  return <figure className="regression-protocol">
    <div><strong>Before dispatch</strong><span>distance, service, departure time</span><span className="regression-arrow">↓ frozen feature row x</span><strong>Fitted rule → prediction</strong></div>
    <div><strong>After arrival</strong><span>elapsed hours y, deadline outcome</span><span className="regression-arrow">↓ later evaluation</span><strong>Compare with stored prediction</strong></div>
    <figcaption>Training uses past completed shipments. A new prediction cannot use its own eventual arrival time or post-delivery complaint. The arrows encode when the information becomes available.</figcaption>
  </figure>;
}

export function ResidualGeometryLab() {
  const [intercept, setIntercept] = useState(0);
  const [slope, setSlope] = useState(1);
  const report = residualReport(intercept, slope);
  return <FlowLab id="regression-residuals" label="Delivery-time line and its residuals">
    <Chart title="Shipment predictions and vertical residuals" description="Cyan circles: observed hours. Violet line: predicted hours. Labelled vertical segments: observed minus predicted. A–D are the four shipments in the table." xDomain={[0, 3]} yDomain={[-4, 14]} xLabel="Distance (100 km)" yLabel="Elapsed hours">
      {({ xScale, yScale }) => <><Polyline points={[[0, intercept], [3, intercept + 3 * slope]]} xScale={xScale} yScale={yScale} />{report.rows.map(row => <g key={row.id}><line x1={xScale(row.distance)} x2={xScale(row.distance)} y1={yScale(row.hours)} y2={yScale(row.predicted)} className="regression-residual" /><circle cx={xScale(row.distance)} cy={yScale(row.hours)} r={5} className="regression-point" /><text x={xScale(row.distance) + (row.distance === 3 ? -10 : 10)} y={yScale(row.hours)-8} textAnchor={row.distance === 3 ? 'end' : 'start'}>{row.id}</text></g>)}<text x={xScale(1.5)} y={yScale(intercept+1.5*slope)-12} textAnchor="middle">predicted line</text></>}
    </Chart>
    <FlowControls><FlowSlider name="Intercept b (hours)" value={intercept} onChange={setIntercept} min={-1} max={4} step={0.05}/><FlowSlider name="Slope w (hours per 100 km)" value={slope} onChange={setSlope} min={-1} max={3} step={0.05}/></FlowControls>
    <FlowReadout>The current line is {flowNumber(intercept)} + {flowNumber(slope)}x; its mean squared error is <strong>{flowNumber(report.mse)} hours²</strong>. The calculated best line is 0.9 + 0.9x, with error 0.175 hours².</FlowReadout>
    <LessonTable caption="Four shipments, one line, each error" headers={['Shipment / distance', 'Observed hours', 'Predicted hours', 'Residual y − ŷ', 'Squared residual']} rows={report.rows.map(row => [row.id+' / '+row.distance, fixed(row.hours), fixed(row.predicted), fixed(row.residual), fixed(row.squared)])}/>
  </FlowLab>;
}

export function ChangedEvidenceLab() {
  const [lastHours, setLastHours] = useState(4);
  const fixedFit = residualReport(0.9,0.9,lastHours);
  const refit = residualReport(fixedFit.bestIntercept,fixedFit.bestSlope,lastHours);
  return <FlowLab id="regression-changed-evidence" label="Changed data compared with a recomputed least-squares fit">
    <LessonTable caption="Observed data change; the reference rule stays fixed" headers={['Rule', 'Intercept', 'Slope', 'MSE on current data']} rows={[
      ['Original-data fit', 0.9, 0.9, fixed(fixedFit.mse)],
      ['Recomputed fit', fixed(refit.bestIntercept), fixed(refit.bestSlope), fixed(refit.mse)],
    ]}/>
    <FlowControls><FlowSlider name="Shipment D observed hours" value={lastHours} onChange={setLastHours} min={4} max={8} step={0.25}/></FlowControls>
    <FlowReadout>D now takes {flowNumber(lastHours)} hours. The new best slope is <strong>{flowNumber(refit.bestSlope)}</strong> and intercept <strong>{flowNumber(refit.bestIntercept)}</strong>; recomputing parameters is a separate calculation from editing the observation.</FlowReadout>
  </FlowLab>;
}

export function GradientGeometryLab() {
  const [rate, setRate] = useState(0.05);
  const [step, setStep] = useState(0);
  const states = gradientTrace(rate, 16);
  const current = states[step];
  const outside = states.slice(0, step + 1).some(state => state.intercept < -0.5 || state.intercept > 2.5 || state.slope < -0.5 || state.slope > 2.5);
  const contours = [0.05, 0.2, 0.8, 3].map(level => {
    const radius = Math.sqrt(14 * level / 5);
    const branch = sign => Array.from({ length: 81 }, (_, index) => {
      const deltaIntercept = -radius + 2 * radius * index / 80;
      const deltaSlope = (-3 * deltaIntercept + sign * Math.sqrt(Math.max(0, 14 * level - 5 * deltaIntercept ** 2))) / 7;
      return [0.9 + deltaIntercept, 0.9 + deltaSlope];
    });
    return [...branch(1), ...branch(-1).reverse()];
  });
  return <FlowLab id="regression-gradient" label="Full-batch gradient descent">


    <Chart title="Actual full-batch gradient path" description="Horizontal position is intercept b; vertical position is slope w. Gray ellipses are exact equal-MSE contours, not shipment coordinates. The × marks the least-squares optimum (0.9, 0.9)." xDomain={[-0.5, 2.5]} yDomain={[-0.5, 2.5]} xLabel="Intercept b (hours)" yLabel="Slope w (hours per 100 km)">
      {({ xScale, yScale }) => <>{contours.map((points, index) => <Polyline key={index} points={points} xScale={xScale} yScale={yScale} className="regression-contour" />)}<Polyline points={states.slice(0, step + 1).map(state => [state.intercept, state.slope])} xScale={xScale} yScale={yScale} /><text x={xScale(0.9)} y={yScale(0.9) + 5} textAnchor="middle" className="regression-optimum">×</text><circle cx={xScale(current.intercept)} cy={yScale(current.slope)} r={6} className="regression-point" /></>}
    </Chart>
    <FlowControls><FlowChoice label="Learning rate η" value={rate} onChange={value => {setRate(value);setStep(0);}} options={[[0.05,"0.05"],[0.2,"0.2"],[0.3,"0.3"]]}/><FlowSlider name="Number of updates" value={step} onChange={setStep} min={0} max={16} step={1}/></FlowControls>
    <FlowReadout>Iteration {step}: b={fixed(current.intercept, 6)}, w={fixed(current.slope, 6)}, MSE={fixed(current.mse, 6)}. Gradient=({fixed(current.gradient[0], 6)}, {fixed(current.gradient[1], 6)}). {outside && <strong>The path has left the displayed parameter window; read the actual values here.</strong>}</FlowReadout>
  </FlowLab>;
}

export function LogisticScoreLab() {
  const [intercept, setIntercept] = useState(-1);
  const [weight, setWeight] = useState(1);
  const [feature, setFeature] = useState(2);
  const report = logisticReport({intercept,weight,feature,label:1});
  return <FlowLab id="regression-logistic-score" label="A score converted to a probability">
    <Chart title="Sigmoid score to probability" description="Violet curve: sigmoid probability. White outlined point: this shipment's current score and probability. The grey vertical line locates its score." xDomain={[-7,7]} yDomain={[0,1]} xLabel="Score z (log odds)" yLabel="Probability of missed deadline">
      {({xScale,yScale}) => <><Polyline points={Array.from({length:113},(_,index)=>{const score=-7+index/8;return [score,sigmoid(score)];})} xScale={xScale} yScale={yScale}/><line x1={xScale(report.score)} x2={xScale(report.score)} y1={yScale(0)} y2={yScale(report.probability)} className="regression-residual"/><circle cx={xScale(report.score)} cy={yScale(report.probability)} r={6} className="regression-selected"/><text x={xScale(3)} y={yScale(sigmoid(3))-10}>sigmoid</text></>}
    </Chart>
    <FlowControls><FlowSlider name="Intercept b" value={intercept} onChange={setIntercept} min={-3} max={3} step={0.25}/><FlowSlider name="Weight w" value={weight} onChange={setWeight} min={-2} max={2} step={0.25}/><FlowSlider name="Distance x (100 km)" value={feature} onChange={setFeature} min={-2} max={2} step={0.25}/></FlowControls>
    <FlowReadout>The score is {flowNumber(intercept)} + {flowNumber(weight)} × {flowNumber(feature)} = <strong>{flowNumber(report.score)}</strong>; probability is <strong>{flowNumber(report.probability)}</strong> and odds are {flowNumber(report.odds)}. Changing a parameter moves the score; sigmoid converts that new score to the probability.</FlowReadout>
  </FlowLab>;
}

export function LogisticLossLab() {
  const [score,setScore]=useState(1);
  const [label,setLabel]=useState(1);
  const probability=sigmoid(score);
  const report=logisticReport({intercept:score-2,weight:1,feature:2,label});
  return <FlowLab id="regression-logistic-loss" label="Probability of an observed label, loss and score derivative">
    <div className="regression-operation">
      <p className="regression-computed">Current score z<br/><strong>{flowNumber(score)}</strong></p><p className="regression-flow-arrow">→ sigmoid →</p>
      <p className="regression-computed">Probability of label 1<br/><strong>{flowNumber(probability)}</strong></p><p className="regression-flow-arrow">→ select observed label →</p>
      <p className="regression-input">Observed y = {label}<br/>assigned probability <strong>{flowNumber(label?probability:1-probability)}</strong></p><p className="regression-flow-arrow">→ negative log →</p>
      <p className="regression-computed">Loss ℓ<br/><strong>{flowNumber(report.loss)}</strong></p>
    </div>
    <FlowControls><FlowSlider name="Score z" value={score} onChange={setScore} min={-6} max={6} step={0.25}/><FlowChoice label="Observed deadline outcome y" value={label} onChange={setLabel} options={[[0,'0: met'],[1,'1: missed']]}/></FlowControls>
    <FlowReadout>Loss is <strong>{flowNumber(report.loss)}</strong>; score derivative p − y is <strong>{flowNumber(report.biasGradient)}</strong>, so increasing the score {report.biasGradient<0?'reduces':'increases'} this row's loss. With distance x = 2, the weight derivative is {flowNumber(report.weightGradient)}.</FlowReadout>
  </FlowLab>;
}

export function ThresholdDecisionsLab() {
  const [threshold, setThreshold] = useState(0.5);
  const [missedCost, setMissedCost] = useState(4);
  const report = thresholdReport(threshold, missedCost);
  return <FlowLab id="regression-threshold" label="Fixed probabilities and changing warning decisions">


    <Chart title="Six validation observations against a threshold" description="Each row is one fixed illustrative validation observation; its horizontal position is its supplied probability. A filled circle means true label 1, an empty square means true label 0. The dashed gate warns for p≥threshold. These supplied probabilities are not outputs of the earlier parcel fit." xDomain={[0, 1]} yDomain={[0.5, 6.5]} xLabel="Supplied model probability" yLabel="Validation row number">
      {({ xScale, yScale }) => <><line x1={xScale(threshold)} x2={xScale(threshold)} y1={TOP} y2={BOTTOM} className="regression-residual" />{report.rows.map((row, index) => row.label ? <circle key={row.id} cx={xScale(row.probability)} cy={yScale(index + 1)} r={6} className="regression-point" /> : <rect key={row.id} x={xScale(row.probability) - 5} y={yScale(index + 1) - 5} width={10} height={10} className="regression-negative" />)}</>}
    </Chart>
    <FlowControls><FlowSlider name="Warning threshold τ" value={threshold} onChange={setThreshold} min={0} max={1} step={0.05}/><FlowChoice label="Cost of a missed warning" value={missedCost} onChange={setMissedCost} options={[[1,"1"],[4,"4"],[10,"10"]]}/></FlowControls>
    <LessonTable caption="Observed counts; rows are truth, columns are decisions" headers={['Truth', 'No warning', 'Warning']} rows={[[0, `${report.tn} true negatives`, `${report.fp} false positives`], [1, `${report.fn} false negatives`, `${report.tp} true positives`]]} />
    <LessonTable caption="Read the exact values behind each point" headers={['Row', 'Fixed probability', 'Truth', 'Current decision']} rows={report.rows.map(row => [row.id, row.probability, row.label, row.prediction ? 'Warning' : 'No warning'])} />
    <FlowReadout>Total cost = FP + {missedCost}×FN = <strong>{report.cost}</strong>. Accuracy {fixed(report.accuracy)}, precision {fixed(report.precision)}, recall {fixed(report.recall)}.</FlowReadout>
    <p>The threshold uses “≥”; a score exactly on the gate gets a warning. A precision of “undefined” means no warning was issued, so its denominator is zero. Choosing a rule on these validation rows does not establish its future cost.</p>
  </FlowLab>;
}

export function SeparationPenaltyLab() {
  const [weight, setWeight] = useState(2);
  const [penalty, setPenalty] = useState(0);
  const report = separationReport(weight, penalty);
  const optimum = separationOptimum(penalty);
  const points = Array.from({ length: 97 }, (_, index) => { const currentWeight = index / 8; return [currentWeight, separationReport(currentWeight, penalty).objective]; });
  const maxLoss = Math.max(1, ...points.map(point => point[1]));
  return <FlowLab id="regression-separation" label="Separated labels and a weight penalty">


    <Chart title="Separated data: loss plus a stated weight penalty" description="Exact objective: log(1+exp(−w)) + λw²/2, with intercept fixed at zero. The vertical scale adapts to λ; compare numeric values across settings. The plotted finite window is not a search over all real weights." xDomain={[0, 12]} yDomain={[0, maxLoss]} xLabel="Weight w" yLabel="Penalized mean objective">
      {({ xScale, yScale }) => <><Polyline points={points} xScale={xScale} yScale={yScale} /><circle cx={xScale(weight)} cy={yScale(report.objective)} r={6} className="regression-point" />{optimum !== null && <line x1={xScale(optimum)} x2={xScale(optimum)} y1={TOP} y2={BOTTOM} className="regression-residual" />}</>}
    </Chart>
    <FlowControls><FlowSlider name="Weight w" value={weight} onChange={setWeight} min={0} max={12} step={0.25}/><FlowChoice label="Penalty strength λ" value={penalty} onChange={setPenalty} options={[[0,"0"],[0.02,"0.02"],[0.2,"0.2"]]}/></FlowControls>
    <FlowReadout>Data loss {fixed(report.dataLoss, 6)} + penalty {fixed(report.penaltyLoss, 6)} = {fixed(report.objective, 6)}. {optimum === null ? 'No finite unpenalized minimizer: the infimum 0 is approached as w→∞.' : `The finite minimizer is w≈${fixed(optimum, 6)} (dashed line).`}</FlowReadout>
    <p>For λ&gt;0 the penalty eventually dominates. This symmetric fixed-intercept example does not prove that penalizing only slopes cures an all-one-label dataset with a free, unpenalized intercept.</p>
  </FlowLab>;
}

export function FeatureMapFigure() {
  const rows = featureMapReport();
  return <figure className="regression-feature-map"><LessonTable caption="One feature map: x → (x, x²) → score x²−1 → probability" headers={['Original x', 'New feature x²', 'Score x²−1', 'Probability']} rows={rows.map(row => [row.input, row.square, row.score, fixed(row.probability)])} /><figcaption>The score is linear in the supplied features (1, x, x²), with coefficients (−1, 0, 1). At threshold 0.5, the score-zero boundary consists of the two input values −1 and +1. The prediction regions are intervals on a line.</figcaption></figure>;
}

export function UncertaintyFigure() {
  const rows = Array.from({ length: 81 }, (_, index) => uncertaintyReport(index / 10));
  const interval = (key, xScale, yScale) => [...rows.map(row => [row.input, row.predicted + row[key]]), ...[...rows].reverse().map(row => [row.input, row.predicted - row[key]])].map(([x, y]) => `${xScale(x)},${yScale(y)}`).join(' ');
  return <>
    <Chart title="Uncertainty about a mean and about one future outcome" description="Calculated pointwise 95% t intervals for the six observations in the program below: inner gold shading estimates the mean, outer blue shading predicts one independent outcome. These are not simultaneous 95% bands over every x. Vertical dashed line x=5 marks the last observed input; the assumed model continues beyond it, not the evidence." xDomain={[0, 8]} yDomain={[-1, 11]} xLabel="Input x (observed 0–5)" yLabel="Output y">
      {({ xScale, yScale }) => <><polygon points={interval('individualHalfWidth', xScale, yScale)} fill="#89c9e5" fillOpacity=".16" stroke="#89c9e5" /><polygon points={interval('meanHalfWidth', xScale, yScale)} fill="#eec26c" fillOpacity=".25" stroke="#eec26c" /><Polyline points={rows.map(row => [row.input, row.predicted])} xScale={xScale} yScale={yScale} /><line x1={xScale(5)} x2={xScale(5)} y1={TOP} y2={BOTTOM} className="regression-residual" />{rows[0].observations.map((value, index) => <circle key={index} cx={xScale(index)} cy={yScale(value)} r={5} className="regression-point" />)}</>}
    </Chart>
    <LessonTable caption="Same model, two different questions (half-widths rounded)" headers={['Input', 'Fitted mean', 'Mean half-width', 'Individual half-width']} rows={[2.5, 8].map(input => { const row = uncertaintyReport(input); return [input, fixed(row.predicted, 4), fixed(row.meanHalfWidth, 4), fixed(row.individualHalfWidth, 4)]; })} />
  </>;
}
