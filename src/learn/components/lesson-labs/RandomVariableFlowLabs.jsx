import { useState } from 'react';
import { outcomeState, meanLossState, jointState, sharedNoiseState, conditionalState, squaredUniformState, sampleMeanState, cdfAt, lossCurve } from '../../data/random-variable-visual-models.js';
import { Figure, Compare, Values, Table, Plane, Point, MappingDrawing, LawDrawing, CdfDrawing, ResidualSquares, JointGrid, CovarianceDrawing, GroupDrawing, NoiseDrawing, SquaredUniformDrawing, ConditionalRectangles, fmt } from './RandomVariableDrawings.jsx';
function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  units = ''
}) {
  return <label>{label}: {value}{units}<input type="range" aria-label={label} value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} /></label>;
}
function Select({
  label,
  value,
  onChange,
  options
}) {
  return <label>{label}<select value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
function Controls({
  children,
  reset
}) {
  return <div className="rv-controls">{children}<button type="button" onClick={reset}>Reset</button></div>;
}
const jointPresets = [['matching', 'Matching Y=X'], ['opposite', 'Opposite Y=−X'], ['independent', 'Independent coordinates'], ['nonlinear', 'Nonlinear Y=X²']];
export function OutcomeMappingLab() {
  const [first, setFirst] = useState(50),
    [second, setSecond] = useState(50),
    [rule, setRule] = useState('heads');
  const state = outcomeState(first, second, rule);
  return <Figure job="C01" caption="Changing a rule changes the numerical question. Changing a coin probability changes the stipulated experiment's weights; every outcome keeps its identity, including a zero-probability outcome." controls={<Controls reset={() => {
    setFirst(50);
    setSecond(50);
    setRule('heads');
  }}><Range label="First coin head chance" value={first} onChange={setFirst} min={0} max={100} units="%" /><Range label="Second coin head chance" value={second} onChange={setSecond} min={0} max={100} units="%" /><Select label="Numerical rule" value={rule} onChange={setRule} options={[['heads', 'Count both heads'], ['first', 'First coin is heads'], ['equal', 'Coins agree']]} /></Controls>}><MappingDrawing rows={state.outcomes} /><Table label="Probability collected at each numerical value" headers={['Value', 'Probability']} rows={state.distribution.map(r => [r.value, fmt(r.mass)])} /></Figure>;
}
export function DistributionCdfLab() {
  const [first, setFirst] = useState(50),
    [second, setSecond] = useState(50),
    [threshold, setThreshold] = useState(1);
  const law = outcomeState(first, second).distribution;
  return <Figure job="C06" caption={`The amber threshold includes atoms at its own coordinate: F(${threshold})=${fmt(cdfAt(law, threshold))}. Open cyan points show the left limit, filled cyan points the attained right-continuous value. A zero jump leaves the same two levels.`} controls={<Controls reset={() => {
    setFirst(50);
    setSecond(50);
    setThreshold(1);
  }}><Range label="First coin head chance" value={first} onChange={setFirst} min={0} max={100} units="%" /><Range label="Second coin head chance" value={second} onChange={setSecond} min={0} max={100} units="%" /><Range label="CDF threshold" value={threshold} onChange={setThreshold} min={-.5} max={2.5} step={.25} /></Controls>}><Compare><div><LawDrawing law={law} threshold={threshold} /></div><div><CdfDrawing law={law} threshold={threshold} /></div></Compare><Table label="Point masses and attained CDF levels" headers={['Value', 'Mass', 'F(value)']} rows={law.map(r => [r.value, fmt(r.mass), fmt(r.cumulative)])} /></Figure>;
}
export function MeanSquaredLossLab() {
  const [candidate, setCandidate] = useState(0),
    [preset, setPreset] = useState('asymmetric');
  const state = meanLossState(candidate, preset);
  return <Figure job="C15" caption="Squares are actual probability-weighted errors, not signed residual bars. The common risk scale 0..30 covers every admitted candidate and preset. The dashed mean marks the minimum of the whole curve." controls={<Controls reset={() => {
    setCandidate(0);
    setPreset('asymmetric');
  }}><Select label="Population law" value={preset} onChange={setPreset} options={[['asymmetric', '−2, 0, 3; weights ¼, ½, ¼'], ['symmetric', '−1, 1; weights ½, ½'], ['constant', 'Constant 2']]} /><Range label="Constant prediction c" value={candidate} onChange={setCandidate} min={-3} max={4} step={.25} /></Controls>}><Compare><div><ResidualSquares pieces={state.pieces} center={candidate} /></div><div><Plane label="Expected squared error as prediction varies" xRange={[-3, 4]} yRange={[0, 30]} xTicks={[-3, 0, 4]} yTicks={[0, 15, 30]} xLabel="prediction c" yLabel="squared-error risk" curves={[{
          fn: c => lossCurve(c, preset)
        }]}>{({
            X,
            Y,
            top,
            bottom
          }) => <><line x1={X(state.mean)} x2={X(state.mean)} y1={top} y2={bottom} className="rv-reference" /><Point x={candidate} y={state.loss} X={X} Y={Y} tone="blue" /></>}</Plane><Values><span>mean {fmt(state.mean)}</span><span>variance {fmt(state.variance)}</span><span>risk {fmt(state.loss)}</span><span>excess {fmt(state.excess)}</span></Values></div></Compare></Figure>;
}
export function JointLawLab() {
  const [preset, setPreset] = useState('matching'),
    [row, setRow] = useState(-1),
    state = jointState(preset);
  return <Figure job="C18" caption="A joint cell answers a paired event. Row and column sums answer different marginal events; dividing the selected row by its total gives its conditional law." controls={<Controls reset={() => {
    setPreset('matching');
    setRow(-1);
  }}><Select label="Paired population" value={preset} onChange={setPreset} options={jointPresets} /><Range label="Selected X row" value={row} onChange={setRow} min={-1} max={1} /></Controls>}><JointGrid state={state} selectedX={row} /></Figure>;
}
export function CenteredCovarianceLab() {
  const [preset, setPreset] = useState('matching'),
    [scale, setScale] = useState(1),
    [shift, setShift] = useState(0),
    [selected, setSelected] = useState(0);
  const state = jointState(preset, scale, shift),
    safeSelected = Math.min(selected, state.rows.length - 1);
  return <Figure job="C21" caption="The white ring selects one paired outcome. Its centered rectangle uses √p on both sides, so magnitude is the weighted product. Rose plus an explicit negative sign means negative covariance contribution. Collapsing Y gives zero variance and undefined correlation." controls={<Controls reset={() => {
    setPreset('matching');
    setScale(1);
    setShift(0);
    setSelected(0);
  }}><Select label="Paired population" value={preset} onChange={value => {
      setPreset(value);
      setSelected(0);
    }} options={jointPresets} /><Range label="Y scale" value={scale} onChange={setScale} min={-2} max={2} /><Range label="Y shift" value={shift} onChange={setShift} min={-3} max={3} /><Range label="Selected paired outcome index" value={safeSelected} onChange={setSelected} min={0} max={state.rows.length - 1} /></Controls>}><CovarianceDrawing state={state} selected={safeSelected} /><Table label="Every weighted centered product" headers={['X', 'Y', 'p', 'p(X−μX)(Y−μY)']} rows={state.cells.filter(c => c.mass > 0).map(c => [c.x, c.y, fmt(c.mass), fmt(c.contribution)])} /><Values><span>Cov(X,Y) {fmt(state.covariance)}</span><span>correlation {fmt(state.correlation)}</span><span>Var(X) {fmt(state.x.variance)}</span><span>Var(Y) {fmt(state.y.variance)}</span></Values></Figure>;
}
export function SharedNoiseLab() {
  const [common, setCommon] = useState(2),
    [local, setLocal] = useState(1),
    [a, setA] = useState(.5),
    [b, setB] = useState(.5);
  return <Figure job="C26" caption="All eight sign choices have probability 1/8. The same shared sign feeds both channels; local signs vary independently. The output law keeps a fixed −41..41 mV frame, covering every control combination." controls={<Controls reset={() => {
    setCommon(2);
    setLocal(1);
    setA(.5);
    setB(.5);
  }}><Range label="Common amplitude" value={common} onChange={setCommon} min={0} max={3} step={.5} units=" mV" /><Range label="Local amplitude" value={local} onChange={setLocal} min={0} max={2} step={.5} units=" mV" /><Range label="A coefficient" value={a} onChange={setA} min={-1} max={1} step={.25} /><Range label="B coefficient" value={b} onChange={setB} min={-1} max={1} step={.25} /></Controls>}><NoiseDrawing state={sharedNoiseState(common, local, a, b)} /></Figure>;
}
export function GroupPredictionLab() {
  const [percent, setPercent] = useState(50);
  return <Figure job="C32" caption="Group marks are population conditional means. At a zero-probability group, the mark is absent and its conditional mean is undefined; the hollow outcomes retain the model's identities." controls={<Controls reset={() => setPercent(50)}><Range label="Positive group probability" value={percent} onChange={setPercent} min={0} max={100} units="%" /></Controls>}><GroupDrawing state={conditionalState(percent)} /></Figure>;
}
export function ConditionalDecompositionLab() {
  const [percent, setPercent] = useState(50),
    state = conditionalState(percent);
  return <Figure job="C35" caption="Both channels share G and carry opposite U. Within covariance is −1; between covariance is 16p(1−p), while both variance pieces are nonnegative. Rows with zero probability contribute zero without inventing a conditional law." controls={<Controls reset={() => setPercent(50)}><Range label="Positive group probability" value={percent} onChange={setPercent} min={0} max={100} units="%" /></Controls>}><GroupDrawing state={state} decomposition /><ConditionalRectangles state={state} /><Compare><div><Plane label="Nonnegative variance pieces" xRange={[0, 3]} yRange={[0, 5]} xTicks={[.5, 1.5, 2.5]} yTicks={[0, 2.5, 5]} xLabel="within / between / total" yLabel="variance (units²)">{({
            X,
            Y
          }) => [state.withinVariance, state.betweenVariance, state.y.variance].map((v, i) => <g key={i}><rect x={X(i + .25)} y={Y(v)} width={X(.75) - X(.25)} height={Y(0) - Y(v)} className="rv-area rv-gold" /><Point x={i + .5} y={v} X={X} Y={Y} /></g>)}</Plane></div><div><Plane label="Signed covariance pieces" xRange={[0, 3]} yRange={[-1.5, 4.5]} xTicks={[.5, 1.5, 2.5]} yTicks={[-1, 0, 4]} xLabel="within / between / total" yLabel="covariance (units²)">{({
            X,
            Y
          }) => [state.withinCovariance, state.betweenCovariance, state.covariance].map((v, i) => <g key={i}><rect x={X(i + .25)} y={Y(Math.max(v, 0))} width={X(.75) - X(.25)} height={Math.abs(Y(v) - Y(0))} className={`rv-area rv-${v < 0 ? 'rose' : 'blue'}`} /><Point x={i + .5} y={v} X={X} Y={Y} tone={v < 0 ? 'rose' : 'blue'} /></g>)}</Plane></div></Compare></Figure>;
}
export function SquaredUniformLab() {
  const [lower, setLower] = useState(25),
    [upper, setUpper] = useState(81);
  let state, error;
  try {
    state = squaredUniformState(lower, upper);
  } catch (problem) {
    error = problem.message;
  }
  return <Figure job="C40" caption="Gold intervals belong to the input U; the cyan band belongs to the output Y. Both branches contribute probability. Crossing endpoints clears the affected drawing until the interval is valid." controls={<Controls reset={() => {
    setLower(25);
    setUpper(81);
  }}><Range label="Lower Y endpoint" value={lower} onChange={setLower} min={0} max={100} units="/100" /><Range label="Upper Y endpoint" value={upper} onChange={setUpper} min={0} max={100} units="/100" /></Controls>}>{error ? <p className="rv-error" role="alert">{error}</p> : <SquaredUniformDrawing state={state} />}</Figure>;
}
export function SampleMeanLawLab() {
  const [count, setCount] = useState(8),
    [percent, setPercent] = useState(50),
    state = sampleMeanState(count, percent);
  return <Figure job="C45" caption="These are exact population laws of the statistic, not simulated histograms. Independent readings have n+1 possible averages; one copied bit has only the endpoints. Both panels use the same probability scale." controls={<Controls reset={() => {
    setCount(8);
    setPercent(50);
  }}><Range label="Number of readings" value={count} onChange={setCount} min={1} max={16} /><Range label="Success probability" value={percent} onChange={setPercent} min={0} max={100} units="%" /></Controls>}><Compare><div><LawDrawing law={state.independent} range={[-.05, 1.05]} ticks={[0, .5, 1]} xLabel="independent sample average" /><p>Mean {fmt(state.mean)}; variance {fmt(state.independentVariance)}.</p></div><div><LawDrawing law={state.copied} range={[-.05, 1.05]} ticks={[0, .5, 1]} tone="blue" xLabel="fully copied sample average" /><p>Mean {fmt(state.mean)}; variance {fmt(state.copiedVariance)}.</p></div></Compare><Table label="Every independent average and its exact-model mass" headers={['Average k/n', 'Probability']} rows={state.independent.map(r => [fmt(r.value), fmt(r.mass, 8)])} /></Figure>;
}
