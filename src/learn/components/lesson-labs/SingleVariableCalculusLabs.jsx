import { useState } from "react";
import { FlowControls } from "./LessonFlow.jsx";
import { compositionChange, exponentialRate, improperPowerIntegral, limitGuarantee, motionAccumulation, motionRate, taylorApproximation, motionPosition } from "../../data/single-variable-calculus-models.js";
import { AccumulationDrawing, Area, Arrow, CalculusFigure, CandidatesDrawing, ChainDrawing, Compare, ExponentialDrawing, LimitDrawing, MotionDrawing, Plane, Point, SignedDrawing, fmt } from "./SingleVariableCalculusDrawings.jsx";
function Select({ label, value, options, onChange, numeric = false }) {
  return <label className="sc-select"><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(numeric ? Number(event.target.value) : event.target.value)}>{options.map((option) => {
    const [key, text] = Array.isArray(option) ? option : [option, String(option)];
    return <option key={key} value={key}>{text}</option>;
  })}</select></label>;
}
function Controls({ children, reset, label }) {
  return <FlowControls>{children}<button type="button" onClick={reset}>Reset {label}</button></FlowControls>;
}
function Live({ children, caption, controls }) {
  return <CalculusFigure live controls={controls} caption={<span aria-live="polite">{caption}</span>}>{children}</CalculusFigure>;
}
const increments = [-0.5, -0.25, -0.125, 0.125, 0.25, 0.5];
function MotionRateLab() {
  const [time, setTime] = useState(2), [h, setH] = useState(0.5), state = motionRate(time, h);
  return <Live
    controls={<Controls label="motion rate" reset={() => {
      setTime(2);
      setH(0.5);
    }}><Select label="Base time (s)" value={time} options={[1, 2, 3]} numeric onChange={setTime} /><Select label="Signed increment h (s)" value={h} options={increments} numeric onChange={setH} /></Controls>}
    caption={<>Actual change {fmt(state.exactChange)} m; tangent prediction {fmt(state.predictedChange)} m; remainder {fmt(state.remainder)} m. Divide that remainder by h to get the secant’s discrepancy from the tangent, {fmt(state.secant - state.velocity)} m/s.</>}
  >
    <MotionDrawing base={time} increment={h} />
  </Live>;
}
function LimitGateLab() {
  const [kind, setKind] = useState("smooth"), [epsilon, setEpsilon] = useState(0.5), [delta, setDelta] = useState(0.1), state = limitGuarantee(kind, epsilon, delta);
  return <Live
    controls={<Controls label="nearby accuracy" reset={() => {
      setKind("smooth");
      setEpsilon(0.5);
      setDelta(0.1);
    }}><Select label="Nearby function" value={kind} options={[["smooth", "Smooth square"], ["hole", "Square with reassigned center"], ["jump", "Square with right jump"]]} onChange={setKind} /><Select label="Requested output accuracy ε" value={epsilon} options={[0.1, 0.5, 1]} numeric onChange={setEpsilon} /><Select label="Input radius δ" value={delta} options={[0.02, 0.1, 0.25, 0.5]} numeric onChange={setDelta} /></Controls>}
    caption={<>Nearby-error supremum {fmt(state.supremum)}; requested accuracy {fmt(epsilon)}. {state.guaranteed ? "Every punctured input in this open radius stays strictly inside the requested output band." : "This radius does not give that guarantee."} The assigned center value {state.centerValue} is excluded from this limit test.</>}
  >
    <LimitDrawing kind={kind} epsilon={epsilon} delta={delta} bands witness={state.witness} />
    {state.witness && <p>One certified interior counterexample: displacement {state.witness.displacementExact} &lt; δ, input {state.witness.inputExact}, error {state.witness.errorExact} ≥ ε. Its displayed point is drawn from these quantities.</p>}
  </Live>;
}
function ChainLocalChangeLab() {
  const [input, setInput] = useState(1), [h, setH] = useState(0.1), state = compositionChange(input, h);
  return <Live
    controls={<Controls label="chain changes" reset={() => {
      setInput(1);
      setH(0.1);
    }}><Select label="Input x" value={input} options={[-1, -1 / 3, 0, 1]} numeric onChange={setInput} /><Select label="Signed input change h" value={h} options={[-0.25, -0.1, 0.1, 0.25]} numeric onChange={setH} /></Controls>}
    caption={<>Inner multiplier 3; outer multiplier {fmt(state.outerDerivative)}; their product {fmt(state.derivative)}. The actual output change {fmt(state.exactChange)} differs from its local prediction {fmt(state.predictedChange)} by {fmt(state.remainder)} = 9h².</>}
  >
    <ChainDrawing input={input} increment={h} />
  </Live>;
}
const intervals = { full: [0, 4], middle: [1.5, 2.5], turns: [1, 3] };
function ExtremaCandidatesLab() {
  const [kind, setKind] = useState("motion"), [interval, setInterval] = useState("full"), [left, right] = intervals[interval];
  return <Live
    controls={<Controls label="extrema candidates" reset={() => {
      setKind("motion");
      setInterval("full");
    }}><Select label="Function" value={kind} options={[["motion", "Position cubic"], ["inflection", "Stationary inflection (t\u22122)\xB3"], ["cusp", "Corner |t\u22122|"]]} onChange={setKind} /><Select label="Closed interval" value={interval} options={[["full", "[0,4]"], ["middle", "[1.5,2.5]"], ["turns", "[1,3]"]]} onChange={setInterval} /></Controls>}
    caption={<>The table compares every endpoint, stationary point and corner that lies in [{left},{right}]. A derivative-zero candidate can be neither a maximum nor a minimum; tied values remain tied.</>}
  >
    <CandidatesDrawing kind={kind} left={left} right={right} />
  </Live>;
}
function SignedAccumulationLab() {
  const [upper, setUpper] = useState(4), [panels, setPanels] = useState(8), [method, setMethod] = useState("midpoint"), state = motionAccumulation(upper, panels, method);
  return <Live
    controls={<Controls label="signed accumulation" reset={() => {
      setUpper(4);
      setPanels(8);
      setMethod("midpoint");
    }}><Select label="Upper time (s)" value={upper} options={[1, 2, 3, 4]} numeric onChange={setUpper} /><Select label="Rectangle count" value={panels} options={[4, 8, 16, 32]} numeric onChange={setPanels} /><Select label="Tag in each panel" value={method} options={[["left", "Left endpoint"], ["midpoint", "Midpoint"], ["right", "Right endpoint"]]} onChange={setMethod} /></Controls>}
    caption={<>Exact displacement {fmt(state.exactDisplacement)} m; exact distance {fmt(state.exactDistance)} m. Finite signed error {fmt(state.signedError)} m. {upper === 4 && method === "midpoint" && (panels === 4 || panels === 8) ? "Here the finite magnitude sum happens to equal 12; that equality does not certify a general exact quadrature rule." : ""}</>}
  >
    <Compare><SignedDrawing upper={upper} panelCount={panels} method={method} rectangles /><SignedDrawing upper={upper} panelCount={panels} method={method} rectangles absolute /></Compare>
    <Plane label={`Actual signed accumulation curve s(t) and selected upper${upper}`} xRange={[0, 4]} yRange={[-0.5, 4.5]} xLabel="upper time (s)" yLabel="displacement (m)" curves={[{ fn: motionPosition }]}>{({ X, Y }) => <Point x={upper} y={state.exactDisplacement} X={X} Y={Y} />}</Plane>
  </Live>;
}
function AccumulationStripLab() {
  const [h, setH] = useState(0.5);
  return <Live
    controls={<Controls label="accumulation strip" reset={() => setH(0.5)}><Select label="Signed endpoint change h" value={h} options={increments} numeric onChange={setH} /></Controls>}
    caption={<>The strip average is 2+h+h²/3 = {fmt(2 + h + h * h / 3)}. Its difference from the local height 2 tends to zero from either endpoint direction.</>}
  >
    <AccumulationDrawing h={h} />
  </Live>;
}
function ExponentialRateLab() {
  const [rate, setRate] = useState(0.2), [period, setPeriod] = useState(1), state = exponentialRate(rate, period);
  return <Live
    controls={<Controls label="exponential rate" reset={() => {
      setRate(0.2);
      setPeriod(1);
    }}><Select label="Continuous rate k (per time unit)" value={rate} options={[-0.5, 0, 0.2, 0.5]} numeric onChange={setRate} /><Select label="Future period Δt" value={period} options={[0.5, 1, 2]} numeric onChange={setPeriod} /></Controls>}
    caption={<>At t=2, amount {fmt(state.currentAmount)}, instantaneous rate {fmt(state.instantaneousRate)} amount/time. Over Δt={period}, exact fraction {fmt(state.perPeriodFraction)}, interval-average rate {fmt(state.intervalAverageRate)} amount/time; future amount {fmt(state.futureAmount)} versus tangent prediction {fmt(state.tangentPrediction)}. {rate > 0 ? `Positive doubling time ln2/k = ${fmt(Math.LN2 / rate)}.` : rate === 0 ? "The amount is constant; there is no finite positive doubling time." : "The amount decays; there is no positive doubling time."}</>}
  >
    <ExponentialDrawing rate={rate} period={period} />
  </Live>;
}
function TaylorErrorLab() {
  const [kind, setKind] = useState("exp"), [degree, setDegree] = useState(3), [input, setInput] = useState(0.5), state = taylorApproximation(kind, degree, input), truth = kind === "exp" ? Math.exp : Math.log1p;
  const polynomial = (x) => taylorApproximation(kind, degree, x).polynomial;
  return <Live
    controls={<Controls label="Taylor approximation" reset={() => {
      setKind("exp");
      setDegree(3);
      setInput(0.5);
    }}><Select label="Function to approximate" value={kind} options={[["exp", "exp(x)"], ["log", "ln(1+x)"]]} onChange={setKind} /><Select label="Polynomial degree" value={degree} options={[1, 2, 3, 4, 5, 6, 7, 8]} numeric onChange={setDegree} /><Select label="Evaluation input x" value={input} options={[-0.5, 0.5, 1, 1.5]} numeric onChange={setInput} /></Controls>}
    caption={<>Actual value {fmt(state.exactValue, 8)}, polynomial {fmt(state.polynomial, 8)}, signed error {fmt(state.signedError, 8)}. Finite Taylor theorem bound {fmt(state.remainderBound, 8)}. {kind === "log" ? Math.abs(input) < 1 ? "This input is inside the open logarithm-series radius." : input === 1 ? "This endpoint needs its separate alternating-series argument." : "The logarithm exists here, but its Taylor series about zero does not converge here. Higher degree can worsen the approximation." : "The exponential series converges at each fixed real input."}</>}
  >
    <Plane label={`${kind}, degree${degree}; actual function and polynomial at${input}`} xRange={[-0.75, 1.5]} yRange={[-4, 5]} xLabel="input x" yLabel="function / polynomial" curves={[{ fn: truth }, { fn: polynomial, tone: "blue" }]}>{({ X, Y }) => <><Point x={input} y={state.exactValue} X={X} Y={Y} /><Point x={input} y={state.polynomial} X={X} Y={Y} tone="blue" /><line x1={X(input)} x2={X(input)} y1={Y(state.exactValue)} y2={Y(state.polynomial)} className="sc-reference blue" /></>}</Plane>
  </Live>;
}
function ImproperIntegralLab() {
  const [kind, setKind] = useState("tail"), [power, setPower] = useState(1.5), [exponent, setExponent] = useState(2), state = improperPowerIntegral(kind, power, exponent), fn = (x) => x ** -power, endpoint = kind === "endpoint", a = endpoint ? state.cutoff : 1, b = endpoint ? 1 : state.cutoff;
  return <Live
    controls={<Controls label="improper integral" reset={() => {
      setKind("tail");
      setPower(1.5);
      setExponent(2);
    }}><Select label="Boundary being approached" value={kind} options={[["tail", "Infinity: [1,B]"], ["endpoint", "Origin: [\u03B4,1]"]]} onChange={setKind} /><Select label="Power p" value={power} options={[0.5, 1, 1.5, 2]} numeric onChange={setPower} /><Select label="Cutoff exponent m" value={exponent} options={[1, 2, 3, 4]} numeric onChange={setExponent} /></Controls>}
    caption={<>Cutoff {endpoint ? "\u03B4=10^(\u2212m)" : "B=10^m"} = {fmt(state.cutoff)}; finite truncated integral {fmt(state.truncated, 8)}. {state.converges ? <>Finite limit {fmt(state.total)}, exact omitted amount {fmt(state.missing, 8)}.</> : <>The {endpoint ? "origin" : "tail"} limit diverges for p={power}; a finite cutoff value is not its improper total.</>}</>}
  >
    <Plane label={`Actual positive x^(-${power}) on[${a},${b}], finite truncation`} xRange={endpoint ? [0, 1] : [1, b]} yRange={endpoint ? [0, 8] : [0, 1.1]} xTicks={endpoint ? [0, 0.5, 1] : [1, (1 + b) / 2, b]} xLabel="original positive input x" yLabel={`height x^(\u2212${power})`} curves={[{ fn, domain: [a, b], spacing: "log" }]}>{({ X, Y, top, bottom }) => <><Area fn={fn} a={a} b={b} X={X} Y={Y} spacing="log" /><line x1={X(endpoint ? a : b)} x2={X(endpoint ? a : b)} y1={top} y2={bottom} className="sc-reference blue" />{endpoint && fn(a) > 8 && <Arrow x1={X(7 ** (-1 / power))} y1={Y(7)} x2={X(8 ** (-1 / power))} y2={Y(8)} />}</>}</Plane>
    {endpoint ? <p>The x=0 boundary is excluded. Heights above 8 continue beyond the plotted window; the numerical truncated integral includes their actual finite contribution.</p> : b > 8 && <><Plane label="Near-start detail1to8; same power and original coordinates, partial region only" xRange={[1, 8]} yRange={[0, 1.1]} xLabel="near-start x detail" yLabel={`height x^(\u2212${power})`} curves={[{ fn }]}>{({ X, Y }) => <Area fn={fn} a={1} b={8} X={X} Y={Y} />}</Plane><p>This second picture enlarges only x∈[1,8], a part of the full [1,{fmt(b)}] domain above. Its area is not the full truncated total.</p></>}
  </Live>;
}
export {
  AccumulationStripLab,
  ChainLocalChangeLab,
  ExponentialRateLab,
  ExtremaCandidatesLab,
  ImproperIntegralLab,
  LimitGateLab,
  MotionRateLab,
  SignedAccumulationLab,
  TaylorErrorLab
};
