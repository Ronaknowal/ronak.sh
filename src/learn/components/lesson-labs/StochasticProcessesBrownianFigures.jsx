import { bridgeState } from "../../data/stochastic-processes-models.js";
import { stoppedCoinHistories } from "../../data/stochastic-processes-flow-models.js";
import { Figure, Canvas, Label, Arrow, Dot, Compare, Plot, Table, Matrix, fmt } from "./StochasticProcessesDrawings.jsx";
const normalDensity = (value, mean, variance) => Math.exp(-((value - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
function BridgeDistribution({ result }) {
  const standardDeviation = Math.sqrt(result.variance);
  const extent = Math.max(1, Math.abs(result.left), Math.abs(result.right), Math.abs(result.mean) + 3 * standardDeviation, Math.abs(result.barrier)) + 0.25;
  return <div><Plot title="Known endpoints, conditional mean and a distribution at the selected time" xDomain={[0, result.duration]} yDomain={[-extent, extent]} xLabel="Elapsed time" yLabel="Position" series={[{ points: [[0, result.left], [result.duration, result.right]], className: "sp-secondary" }]}>{({ x, y }) => <>
    <circle cx={x(0)} cy={y(result.left)} r="5" className="sp-bit" /><circle cx={x(result.duration)} cy={y(result.right)} r="5" className="sp-bit" />
    <line x1={x(0)} x2={x(result.duration)} y1={y(result.barrier)} y2={y(result.barrier)} className="sp-line" />
    <line x1={x(result.duration * result.fraction)} x2={x(result.duration * result.fraction)} y1={y(result.mean - 1.95996398454 * standardDeviation)} y2={y(result.mean + 1.95996398454 * standardDeviation)} className="sp-line sp-secondary" />
    <circle cx={x(result.duration * result.fraction)} cy={y(result.mean)} r="4" className="sp-bit" />
  </>}</Plot>
  {result.variance > 0 ? <Plot title="The conditional density is not a realized connecting line" xDomain={[result.mean - 4 * standardDeviation, result.mean + 4 * standardDeviation]} yDomain={[0, normalDensity(result.mean, result.mean, result.variance) * 1.1]} xLabel="Position at selected time" yLabel="Density / position unit" series={[{ points: Array.from({ length: 121 }, (_, i) => {
    const value = result.mean + standardDeviation * (i / 15 - 4);
    return [value, normalDensity(value, result.mean, result.variance)];
  }) }]} /> : <p>The selected time is an observed endpoint: a point mass at {fmt(result.mean)}, not a density with zero standard deviation.</p>}
  <Table title="Endpoint conditioning and barrier event are separate" headers={["Quantity", "Value"]} rows={[["Selected elapsed time", result.duration * result.fraction], ["Conditional mean", result.mean], ["Conditional variance", result.variance], ["Conditional standard deviation", standardDeviation], ["Lower pointwise 95% endpoint", result.mean - 1.95996398454 * standardDeviation], ["Upper pointwise 95% endpoint", result.mean + 1.95996398454 * standardDeviation], ["Barrier", result.barrier], ["Conditional crossing probability", result.crossingProbability], ["Log crossing probability", result.logCrossing]]} /></div>;
}
function Squares({ values, title, multiplier = 100 }) {
  const slot = Math.max(140, Math.max(...values.map(Math.abs)) * multiplier + 30);
  const width = Math.max(360, values.length * slot + 40);
  return <Canvas title={title} width={width} height={210}>
    {values.map((value, i) => {
    const side = Math.abs(value) * multiplier;
    return <g key={i}><rect x={30 + i * slot} y={132 - side} width={side} height={side} className="sp-area" /><Label x={30 + slot / 2 + i * slot} y="159">Δ = {fmt(value, 3)}</Label><Label x={30 + slot / 2 + i * slot} y="188">Area {fmt(value * value, 4)}</Label></g>;
  })}
  </Canvas>;
}
function RandomWalkScalingFigure(props) {
  const signs = [1, -1, 1, 1, -1, -1, 1, -1];
  const values = [0];
  const wrong = [0];
  signs.forEach((sign) => {
    values.push(values.at(-1) + sign / Math.sqrt(8));
    wrong.push(wrong.at(-1) + sign / 8);
  });
  return <Figure {...props} title="Square-root mesh increments preserve total variance" caption="Eight fair sign increments have squared amplitude 1/8, so their variance sum is 1. Scaling by Δt instead makes the variance sum 1/8. The same signs isolate the scaling change. This finite picture motivates, but does not prove, functional convergence.">
    <Plot title="The same literal signs, two step scalings" xDomain={[0, 1]} yDomain={[-1, 1]} xLabel="Time" yLabel="Position" series={[{ points: values.map((value, i) => [i / 8, value]) }, { points: wrong.map((value, i) => [i / 8, value]), className: "sp-secondary" }]} />
    <Compare><Squares values={Array(8).fill(1 / Math.sqrt(8))} title="Eight equal variance squares, total 1" /><Squares values={Array(8).fill(1 / 8)} title="Eight smaller variance squares, total 1/8" /></Compare>
  </Figure>;
}
function BrownianIncrementFigure(props) {
  return <Figure {...props} title="A normal draw is scaled by square root of duration" caption="With Δt=.25 and σ=2, the noise standard deviation is 1 position unit. For the literal Z=.8 draw, the noise increment is .8. If μ=.2, drift adds .05 and the realized total is .85. The dashed σΔt rule would give the wrong standard deviation .5.">
    <Canvas title="One actual normal draw, drift and noise displacement operands" height={230}>
      <line x1="45" x2="330" y1="150" y2="150" className="sp-grid" />
      <Dot at={[60, 150]} label="0" /><Arrow from={[76, 150]} to={[282, 150]} label="Noise .8" labelAt={[180, 132]} /><Dot at={[300, 150]} label=".8" />
      <line x1="60" x2="75" y1="72" y2="72" className="sp-line sp-secondary" /><Label x="180" y="53">Drift .2 × .25 = .05</Label>
      <Label x="180" y="207">Total .05 + .8 = .85</Label>
    </Canvas>
    <Plot title="Correct and incorrect population increment densities" xDomain={[-3, 3]} yDomain={[0, 0.9]} xLabel="Noise displacement" yLabel="Density / position unit" series={[{ points: Array.from({ length: 121 }, (_, i) => {
    const x = i / 20 - 3;
    return [x, normalDensity(x, 0, 1)];
  }) }, { points: Array.from({ length: 121 }, (_, i) => {
    const x = i / 20 - 3;
    return [x, normalDensity(x, 0, 0.25)];
  }), className: "sp-secondary" }]} />
    <Table title="Variance distinguishes the two scaling rules" headers={["Rule", "Standard deviation", "Variance"]} rows={[["\u03C3\u221A\u0394t", 1, 1], ["Incorrect \u03C3\u0394t", 0.5, 0.25]]} />
  </Figure>;
}
function SharedNoiseCovarianceFigure(props) {
  const times = [0, 0.25, 0.5, 1];
  return <Figure {...props} title="Shared increment intervals wire the covariance matrix" caption="W(.25) and W(1) share noise only on [0,.25]. Their covariance is .25 and correlation .5. The remaining (.25,1] increment is independent of that prefix. Every matrix entry is the length of the shared interval.">
    <Canvas title="Shared quarter-time noise and independent continuation" height={220}>
      <Label x="20" y="32" anchor="start">W(.25)</Label><rect x="60" y="49" width="68" height="26" className="sp-area" />
      <Label x="20" y="108" anchor="start">W(1)</Label><rect x="60" y="125" width="68" height="26" className="sp-area" /><rect x="128" y="125" width="204" height="26" fill="#97bfca" fillOpacity=".3" stroke="#97bfca" />
      <Arrow from={[94, 77]} to={[94, 121]} /><Label x="60" y="190">0</Label><Label x="128" y="190">.25</Label><Label x="332" y="190">1</Label>
    </Canvas><Matrix title="Cov(W(s),W(t)); time order 0,.25,.5,1" values={times.map((s) => times.map((t) => Math.min(s, t)))} rowNames={times.map(String)} columnNames={times.map(String)} />
  </Figure>;
}
function CommonGridFigure(props) {
  const fine = [0, 0.3, 0.2, 0.4, 0];
  return <Figure {...props} title="Coarse increments sum the same fine increments" caption="The fine increments .3,−.1,.2,−.4 sum in adjacent pairs to .2,−.2. Both resolutions start and end at zero. Independently drawing new noise could change the endpoint and confound a resolution comparison.">
    <Plot title="Fine and coarse observations of one fixed realization" xDomain={[0, 1]} yDomain={[-0.1, 0.5]} xLabel="Time" yLabel="Position" series={[{ points: fine.map((value, i) => [i / 4, value]) }, { points: [[0, 0], [0.5, 0.2], [1, 0]], className: "sp-secondary" }]} />
    <Canvas title="Actual adjacent increment sums" height={180}><Label x="78" y="37">.3 + (−.1)</Label><Label x="280" y="37">.2 + (−.4)</Label><Arrow from={[78, 54]} to={[78, 103]} /><Arrow from={[280, 54]} to={[280, 103]} /><Dot at={[78, 125]} label=".2" /><Dot at={[280, 125]} label="−.2" /></Canvas>
  </Figure>;
}
function ObservationNoiseFigure(props) {
  return <Figure {...props} title="One measurement error enters neighbouring increments with opposite signs" caption="Observed Yᵢ=Xᵢ+εᵢ. The shared middle error ε₁ enters ΔY₁ positively and ΔY₂ negatively, creating negative adjacent covariance even when latent increments are independent. These labelled values are synthetic mechanism operands, not a measured finance series.">
    <Canvas title="A shared error wired to both observed differences" height={270}>
      {[0, 1, 2].map((i) => <g key={i}><Dot at={[55 + 125 * i, 53]} label={`\u03B5${i}`} /><Dot at={[55 + 125 * i, 135]} label={`Y${i}`} /><Arrow from={[55 + 125 * i, 70]} to={[55 + 125 * i, 117]} /></g>)}
      <Arrow from={[163, 58]} to={[102, 217]} label="+ε₁" labelAt={[102, 185]} /><Arrow from={[197, 58]} to={[263, 217]} label="−ε₁" labelAt={[262, 185]} className="sp-secondary" />
      <Label x="100" y="249">ΔY₁</Label><Label x="265" y="249">ΔY₂</Label>
    </Canvas>
    <Plot title="Literal latent observations and their added measurement errors" xDomain={[0, 1]} yDomain={[-0.1, 0.5]} xLabel="Observation time" yLabel="Position" series={[{ points: [[0, 0], [0.5, 0.3], [1, 0.2]] }, { points: [[0, 0.1], [0.5, 0.25], [1, 0.4]], className: "sp-secondary" }]}>{({ x, y }) => [[0, 0, 0.1], [0.5, 0.3, 0.25], [1, 0.2, 0.4]].map(([time, latent, observed], i) => <g key={i}><line x1={x(time)} x2={x(time)} y1={y(latent)} y2={y(observed)} className="sp-grid" /><circle cx={x(time)} cy={y(observed)} r="4" className="sp-bit" /></g>)}</Plot>
    <Table title="Synthetic literal operands; no recorded measurement claim" headers={["Time", "Latent X", "Error \u03B5", "Observed Y"]} rows={[[0, 0, 0.1, 0.1], [0.5, 0.3, -0.05, 0.25], [1, 0.2, 0.2, 0.4]]} />
  </Figure>;
}
function ConditionalBridgeFigure(props) {
  const result = bridgeState({ left: 0.2, right: -0.1, duration: 0.5, scale: 0.8, fraction: 0.25, barrier: 0.7 });
  return <Figure {...props} title="A conditional distribution fills the unobserved interval" caption="At one quarter of the interval, mean .125 and variance .06 give the conditional pointwise 95% interval [−.35509117,.60509117]. The dashed line is the mean, not an observed exact path. Conditioning on either endpoint collapses the law to a point mass."><BridgeDistribution result={result} /></Figure>;
}
function FirstHitReflectionFigure(props) {
  const trace = [[0, 0], [0.15, 0.4], [0.3, 1], [0.45, 0.7], [0.65, 1.15], [0.85, 0.45], [1, 0]];
  const reflected = trace.map(([t, value]) => [t, t <= 0.3 ? value : 2 - value]);
  return <Figure {...props} title="Reflect only the tail after the first barrier hit" caption="The conceptual crossing trace first hits barrier 1 at τ=.3 and ends at 0. Reflecting its tail through height 1 preserves the prefix and ends at 2. The Gaussian density ratio gives conditional crossing exp(−2); the unconditional maximum tail is a different event, approximately .317310508.">
    <Plot title="Original and reflected tails share the same first-hit prefix" xDomain={[0, 1]} yDomain={[-0.2, 2.2]} xLabel="Time" yLabel="Position" series={[{ points: trace }, { points: reflected, className: "sp-secondary" }]}>{({ x, y }) => <><line x1={x(0)} x2={x(1)} y1={y(1)} y2={y(1)} className="sp-grid" /><circle cx={x(0.3)} cy={y(1)} r="5" className="sp-bit" /></>}</Plot>
  </Figure>;
}
function SquaredIncrementFigure(props) {
  return <Figure {...props} title="Signed increments cancel but their squared areas remain" caption="For .3,−.1,.2,−.4, the endpoint change is 0, total absolute movement 1, and sum of squared increments .30. The four squares share one physical length scale. The Gaussian fourth moment then supplies the stated expectation and variance for random partitions.">
    <Squares title="Four actual increment squares on a common length scale" values={[0.3, -0.1, 0.2, -0.4]} />
    <Table title="Different functionals of the same four increments" headers={["Functional", "Value"]} rows={[["Signed sum", 0], ["Absolute sum", 1], ["Squared sum", 0.3]]} />
  </Figure>;
}
function DriftSquareFigure(props) {
  return <Figure {...props} title="A finite squared increment contains drift, cross and noise pieces" caption="At μ=.2,h=.25,σ=1,ΔW=.3, the increment is .35. Its square .1225 contains .0025 drift square, .03 cross term and .09 noise square. Centering removes the same .05 drift from that increment; a realized cross term need not be zero.">
    <Canvas title="A .35 by .35 square partitioned into the actual algebraic terms" height={285}>
      <rect x="72" y="35" width="210" height="210" className="sp-area" />
      <rect x="72" y="35" width="30" height="30" fill="#ded5bf" fillOpacity=".4" />
      <rect x="102" y="35" width="180" height="30" fill="#97bfca" fillOpacity=".4" />
      <rect x="72" y="65" width="30" height="180" fill="#97bfca" fillOpacity=".4" />
      <Label x="192" y="156">.3² = .09</Label><Label x="190" y="25">.05 + .3 = .35</Label><Label x="192" y="271">Cross strips: 2 × .05 × .3</Label>
    </Canvas><Table title="Finite expansion retains the cross term" headers={["Piece", "Squared position units"]} rows={[["Drift square", 25e-4], ["Two cross strips", 0.03], ["Noise square", 0.09], ["Whole square", 0.1225]]} />
  </Figure>;
}
function LeftRightIntegralFigure(props) {
  const values = [0, 0.3, 0.2, 0.4, 0];
  const increments = values.slice(1).map((value, i) => value - values[i]);
  const left = increments.map((increment, i) => increment * values[i]);
  const right = increments.map((increment, i) => increment * values[i + 1]);
  return <Figure {...props} title="Changing tags changes the signed interval products" caption="On the same observed values, left products sum to −.15 and right products to +.15. Their difference is Q=.30. Averaging endpoint values gives sum 0; it does not claim that an actual Brownian midpoint was observed.">
    <Compare>{[[0.4, "Last left tag: .4"], [0, "Last right tag: 0"]].map(([tag, title]) => <Canvas key={title} title={title} height={260}><Label x="180" y="25">{title}</Label><line x1="100" x2="300" y1="180" y2="180" className="sp-grid" /><line x1="200" x2="200" y1="80" y2="195" className="sp-grid" /><rect x="120" y={180 - tag * 200} width="80" height={tag * 200} className="sp-area" /><Label x="160" y="207">ΔW = −.4</Label><Label x="251" y="104">Tag {tag}</Label><Label x="180" y="241">Signed product {fmt(-0.4 * tag)}</Label><Label x="200" y="175">0</Label></Canvas>)}</Compare>
    <Compare>{[[left, "Left tags"], [right, "Right tags"]].map(([products, title]) => <Plot key={title} title={title} xDomain={[0, 4]} yDomain={[-0.2, 0.2]} xLabel="Interval index" yLabel="Signed product">{({ x, y }) => products.map((product, i) => <rect key={i} x={x(i + 0.1)} y={y(Math.max(0, product))} width={x(i + 0.9) - x(i + 0.1)} height={Math.abs(y(product) - y(0))} className="sp-area" />)}</Plot>)}</Compare>
    <Table title="Every product uses the identical increment" headers={["Interval", "\u0394W", "Left tag", "Right tag", "Left product", "Right product"]} rows={increments.map((value, i) => [i, value, values[i], values[i + 1], left[i], right[i]])} />
  </Figure>;
}
function AdaptedInformationFigure(props) {
  const histories = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return <Figure {...props} title="A past-selected stake cannot use the next coin" caption="Each two-coin history has probability ¼. Choosing the next stake from the first sign gives gains +1,−1,−1,+1, mean zero. Choosing it from the still-unseen next sign gives gain +1 on every history and uses unavailable information.">
    <Canvas title="A prefix ends before the next fair branch" height={230}><Dot at={[55, 108]} label="Past" /><Dot at={[290, 54]} label="−1" /><Dot at={[290, 173]} label="+1" /><Arrow from={[72, 99]} to={[272, 60]} label="½" labelAt={[180, 64]} /><Arrow from={[72, 119]} to={[272, 165]} label="½" labelAt={[180, 171]} /><line x1="116" x2="116" y1="25" y2="205" className="sp-line sp-secondary" /><Label x="180" y="218">Only the prefix is known at the cut</Label></Canvas>
    <Table title="Actual four-history payoff comparison" headers={["First sign", "Next sign", "Past stake \xD7 next", "Future stake \xD7 next"]} rows={histories.map(([a, b]) => [a, b, a * b, b * b])} />
  </Figure>;
}
function CompensatedProcessFigure(props) {
  const path = [[0, 0], [0.25, 0.3], [0.5, 0.2], [0.75, 0.4], [1, 0]];
  const drifted = path.map(([t, value]) => [t, 0.2 * t + value]);
  return <Figure {...props} title="Removing predictable accumulation leaves conditional zero drift" caption="Subtract μt from X(t)=μt+W(t), or λt from the Poisson count. The residual remains random. Compensation changes a conditional mean, not the actual path into a constant.">
    <Compare><Plot title="Position and its predictable .2t trend" xDomain={[0, 1]} yDomain={[-0.5, 1]} xLabel="Time" yLabel="Position" series={[{ points: drifted }, { points: [[0, 0], [1, 0.2]], className: "sp-secondary" }]} /><Plot title="The same position after trend removal" xDomain={[0, 1]} yDomain={[-0.5, 1]} xLabel="Time" yLabel="X(t) − .2t" series={[{ points: path }]} /></Compare>
    <Plot title="Count stairs and the predictable mean 2t before subtraction" xDomain={[0, 3]} yDomain={[0, 7]} xLabel="Minutes" yLabel="Count or expected count" series={[{ points: [[0, 0], [0.2, 0], [0.2, 1], [0.4, 1], [0.4, 2], [1.1, 2], [1.1, 3], [1.5, 3], [1.5, 4], [2.2, 4], [2.2, 5], [2.8, 5], [2.8, 6], [3, 6]] }, { points: [[0, 0], [3, 6]], className: "sp-secondary" }]} />
    <Plot title="Count minus predictable accumulated intensity" xDomain={[0, 3]} yDomain={[-2, 2]} xLabel="Minutes" yLabel="N(t) − 2t" series={[{ points: [[0, 0], [0.2, -0.4], [0.2, 0.6], [0.4, 0.2], [0.4, 1.2], [1.1, -0.2], [1.1, 0.8], [1.5, 0], [1.5, 1], [2.2, -0.4], [2.2, 0.6], [2.8, -0.6], [2.8, 0.4], [3, 0]] }]} />
  </Figure>;
}
function BoundedStoppingFigure(props) {
  const rows = stoppedCoinHistories();
  return <Figure {...props} title="Stopping discards future coins without changing history masses" caption="All 16 original four-coin histories retain mass 1/16. Stop at first hit of ±2 or at step 4. Stopped masses at −2,0,+2 are 3/8,1/4,3/8; τ=2 or 4 each has mass ½. The stopped mean is zero and Eτ=3.">
    <Canvas title="Every complete history and its retained stopping prefix" height={730}>{rows.map((row, i) => <g key={i}><Label x="25" y={41 + 42 * i}>{i + 1}</Label>{row.signs.map((sign, j) => <g key={j} opacity={j >= row.stop ? 0.3 : 1}><Dot at={[70 + 58 * j, 35 + 42 * i]} label={sign === 1 ? "+" : "\u2212"} /></g>)}<Label x="326" y={40 + 42 * i}>{row.final}</Label></g>)}</Canvas>
    <Table title="Stopped-value distribution" headers={["Value", "Mass"]} rows={[-2, 0, 2].map((value) => [value, rows.filter((row) => row.final === value).length / 16])} />
  </Figure>;
}
function UncertaintyEventsFigure(props) {
  return <Figure {...props} title="A pointwise interval and a maximum event are different subsets" caption="Known bridge endpoints have zero uncertainty. An interior conditional interval covers one selected time. A pointwise Brownian envelope also concerns one time at a time; the event that the whole path stays below a barrier requires a maximum law.">
    <BridgeDistribution result={bridgeState()} />
    <Plot title="Pointwise envelope and a separate fixed maximum barrier" xDomain={[0, 1]} yDomain={[-2.2, 2.2]} xLabel="Time" yLabel="Position" series={[{ points: Array.from({ length: 81 }, (_, i) => [i / 80, 1.95996398454 * Math.sqrt(i / 80)]), className: "sp-secondary" }, { points: Array.from({ length: 81 }, (_, i) => [i / 80, -1.95996398454 * Math.sqrt(i / 80)]), className: "sp-secondary" }, { points: [[0, 1], [1, 1]] }]} />
  </Figure>;
}
export {
  AdaptedInformationFigure,
  BoundedStoppingFigure,
  BridgeDistribution,
  BrownianIncrementFigure,
  CommonGridFigure,
  CompensatedProcessFigure,
  ConditionalBridgeFigure,
  DriftSquareFigure,
  FirstHitReflectionFigure,
  LeftRightIntegralFigure,
  ObservationNoiseFigure,
  RandomWalkScalingFigure,
  SharedNoiseCovarianceFigure,
  SquaredIncrementFigure,
  Squares,
  UncertaintyEventsFigure
};
