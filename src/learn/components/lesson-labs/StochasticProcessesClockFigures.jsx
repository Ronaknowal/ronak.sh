import { poissonMass, splitCountLaw, jumpClockState } from "../../data/stochastic-processes-models.js";
import { Figure, Canvas, Label, Arrow, Dot, Compare, Plot, Table, Matrix, fmt } from "./StochasticProcessesDrawings.jsx";
const literalArrivals = [0.2, 0.4, 1.1, 1.5, 2.2, 2.8];
function EventStream({ events = literalArrivals.map((time, i) => ({ time, index: i + 1, mark: i % 2 })), horizon = 3, marked = false, selected, onSelect }) {
  const x = (time) => 52 + time / horizon * 280;
  const height = marked ? 305 : 195;
  return <Canvas title={marked ? "The same identified events routed to A or B at their original times" : "Event times on a common exposure clock"} height={height}>
    <line x1="52" x2="332" y1="72" y2="72" className="sp-grid" />
    {marked && [151, 232].map((y) => <line key={y} x1="52" x2="332" y1={y} y2={y} className="sp-grid" />)}
    <Label x="27" y="77">All</Label>{marked && <><Label x="27" y="156">A</Label><Label x="27" y="237">B</Label></>}
    {events.map((event, i) => <g key={event.index} className={selected === i ? "sp-selected" : ""} role={onSelect ? "button" : void 0} tabIndex={onSelect ? 0 : void 0} aria-label={`Event ${event.index} at ${fmt(event.time)}`} onClick={() => onSelect?.(i)} onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(i);
    }
  }}>
      <circle cx={x(event.time)} cy="72" r="4" className="sp-bit" />
      {marked && <><Arrow from={[x(event.time), 79]} to={[x(event.time), event.mark === 0 ? 145 : 226]} className={event.mark === 0 ? "" : "sp-secondary"} /><circle cx={x(event.time)} cy={event.mark === 0 ? 151 : 232} r="4" className="sp-bit" /></>}
      <Label x={x(event.time)} y={i % 2 === 0 ? 42 : 25}>{event.index}</Label>
    </g>)}
    {[0, horizon / 2, horizon].map((t) => <Label key={t} x={x(t)} y={height - 45}>{fmt(t)}</Label>)}
    <Label x="192" y={height - 12}>Elapsed minutes</Label>
  </Canvas>;
}
function CountStairs({ events, horizon = 3 }) {
  const points = [[0, 0]];
  events.forEach((event, i) => points.push([event.time, i], [event.time, i + 1]));
  points.push([horizon, events.length]);
  return <Plot title="Right-continuous cumulative count" xDomain={[0, horizon]} yDomain={[0, Math.max(1, events.length + 1)]} xLabel="Elapsed minutes" yLabel="N(t), events" series={[{ points }]}>{({ x, y }) => events.map((event, i) => <g key={i}><circle cx={x(event.time)} cy={y(i)} r="3" fill="#171717" stroke="#edc267" /><circle cx={x(event.time)} cy={y(i + 1)} r="3" fill="#edc267" /></g>)}</Plot>;
}
function CountMass({ mean, limit = 16, highlight = () => false }) {
  const values = Array.from({ length: limit + 1 }, (_, k) => poissonMass(mean, k));
  const top = Math.max(0.01, ...values) * 1.15;
  return <Plot title={`Poisson count probabilities, mean ${fmt(mean)}`} xDomain={[-0.5, limit + 0.5]} yDomain={[0, top]} xLabel="Integer count k" yLabel="Probability mass">{({ x, y }) => values.map((p, k) => <g key={k} className={highlight(k) ? "sp-selected" : ""}><line x1={x(k)} x2={x(k)} y1={y(0)} y2={y(p)} className="sp-line" /><circle cx={x(k)} cy={y(p)} r={highlight(k) ? 4 : 2.5} className="sp-bit" /></g>)}</Plot>;
}
function RateClock({ rates = [1, 4], switchTime = 2, horizon = 3 }) {
  const mean = rates[0] * switchTime + rates[1] * (horizon - switchTime);
  return <Compare><Plot title="Accumulated rate is literal rectangle area" xDomain={[0, horizon]} yDomain={[0, Math.max(1, ...rates) * 1.25]} xLabel="Minutes" yLabel="Events / minute">{({ x, y }) => <>{[[0, switchTime, rates[0]], [switchTime, horizon, rates[1]]].map(([left, right, rate], i) => <rect key={i} x={x(left)} y={y(rate)} width={x(right) - x(left)} height={y(0) - y(rate)} className="sp-area" />)}</>}</Plot><Plot title="Operational clock, the same accumulated rate" xDomain={[0, horizon]} yDomain={[0, Math.max(1, mean)]} xLabel="Minutes" yLabel="Λ(t), expected events" series={[{ points: [[0, 0], [switchTime, rates[0] * switchTime], [horizon, mean]] }]} /></Compare>;
}
function ArrivalCoordinatesFigure(props) {
  const events = literalArrivals.map((time, i) => ({ time, index: i + 1 }));
  return <Figure {...props} title="Arrival dots, waits and count stairs describe one event stream" caption="The selected (0,1] window contains events 1 and 2. The final .2 minute from event 6 to the exposure end is a censored wait, not a seventh complete interarrival time.">
    <EventStream events={events} /><CountStairs events={events} />
    <Table title="Elapsed waits keep event index distinct from time" headers={["Event", "Time (minutes)", "Wait (minutes)"]} rows={events.map((event, i) => [event.index, event.time, event.time - (events[i - 1]?.time ?? 0)])} />
  </Figure>;
}
function CountClockLawFigure(props) {
  const lambda = 2.5;
  return <Figure {...props} title="Count mass and waiting survival use the same physical rate" caption="A constant 2.5 events/minute over 3 minutes has mean count 7.5. P(N(3)=0)=exp(−7.5). A next wait has survival exp(−2.5t), with mean .4 minute. Count probabilities are masses; the waiting curve is a survival probability.">
    <RateClock rates={[lambda, lambda]} />
    <Compare><CountMass mean={7.5} /><Plot title="Waiting-time survival" xDomain={[0, 2]} yDomain={[0, 1]} xLabel="Waiting minutes" yLabel="P(wait > t)" series={[{ points: Array.from({ length: 81 }, (_, i) => [i / 40, Math.exp(-lambda * i / 40)]) }]} /></Compare>
    <Table title="Rate × duration has count units" headers={["Quantity", "Value"]} rows={[["Mean count over 3 minutes", 7.5], ["Zero-count probability", Math.exp(-7.5)], ["Mean wait, minutes", 0.4]]} />
  </Figure>;
}
function KthArrivalFigure(props) {
  const probability = 1 - [0, 1, 2].reduce((sum, k) => sum + poissonMass(2.5, k), 0);
  return <Figure {...props} title="The third arrival by a deadline is a count-tail event" caption={`S\u2083\u22641 minute is exactly N(1)\u22653, probability ${fmt(probability, 9)}. The mean third wait is 3/2.5=1.2 minutes. The literal .2,.4,1.1 stream misses the deadline for its third event; that realization differs from the population probability.`}>
    <Canvas title="Three positive waits end at the third arrival" height={180}>
      <line x1="50" x2="330" y1="82" y2="82" className="sp-grid" />
      {[0, 0.2, 0.4, 1.1].map((t, i) => <g key={i}><circle cx={50 + t / 1.5 * 280} cy="82" r="4" className="sp-bit" /><Label x={50 + t / 1.5 * 280} y={i % 2 ? 48 : 30}>{t}</Label></g>)}
      {[0.2, 0.2, 0.7].map((wait, i) => <Label key={i} x={50 + [0.1, 0.3, 0.75][i] / 1.5 * 280} y="111">{wait}</Label>)}
      <line x1={50 + 280 / 1.5} x2={50 + 280 / 1.5} y1="20" y2="126" className="sp-line sp-secondary" /><Label x="190" y="161">Deadline = 1 minute</Label>
    </Canvas><CountMass mean={2.5} highlight={(k) => k >= 3} />
  </Figure>;
}
function IncrementOverlapFigure(props) {
  return <Figure {...props} title="Disjoint event intervals are independent; cumulative levels share the past" caption="N(1) uses the first interval. N(2) uses both, so their covariance equals the shared first-interval variance λ. Increment windows (0,1] and (1,2] share no events; overlapping windows share a middle interval.">
    <Canvas title="Actual shared and disjoint exposure segments" height={320}>
      {[[0, 1, "N(1)", 65], [0, 2, "N(2)", 125], [0, 1.5, "Window A", 195], [1, 2, "Window B", 255]].map(([a, b, name, y], i) => <g key={name}><Label x="18" y={y - 16} anchor="start">{name}</Label><rect x={55 + a * 137} y={y} width={(b - a) * 137} height="15" className="sp-area" />{i === 3 && <rect x={192} y={y} width="68.5" height="15" fill="#97bfca" fillOpacity=".4" />}</g>)}
      {[0, 1, 2].map((t) => <Label key={t} x={55 + 137 * t} y="305">{t} min</Label>)}
    </Canvas>
  </Figure>;
}
function MarkedJointFigure(props) {
  const result = splitCountLaw(3, 1, 2, 0.4);
  return <Figure {...props} title="Each event is routed once, and joint counts retain both factors" caption="Mean total count is 3. Independent A marking with probability .4 gives means 1.2 and 1.8. Cell (1,2) has conditional marking mass .432 and joint mass approximately .096786061; the joint law factors into two Poisson count laws.">
    <EventStream marked />
    <Table title="Joint count grid, independent routing" headers={["A count / B count", 0, 1, 2, 3]} rows={Array.from({ length: 4 }, (_, a) => [a, ...Array.from({ length: 4 }, (_2, b) => splitCountLaw(3, a, b, 0.4).joint)])} />
    <Table title="One selected joint cell" headers={["Factor", "Value"]} rows={[["P(total = 3)", poissonMass(3, 3)], ["P(A=1 | total=3)", result.conditional], ["Joint P(A=1,B=2)", result.joint], ["Poisson(1.2) \xD7 Poisson(1.8)", result.product]]} />
  </Figure>;
}
function ConditionalCountFigure(props) {
  const binomial = (k) => splitCountLaw(4, k, 4 - k, 0.3).markKernel;
  return <Figure {...props} title="A fixed total restricts the joint counts to an anti-diagonal" caption="Conditioning on total 4 makes B=4−A, so the counts move in opposite directions and have covariance −.84 at r=.3. Without fixing the total, independently marked Poisson counts have means 1.2 and 2.8 and a product joint grid.">
    <Plot title="Conditional outcomes are only A+B=4" xDomain={[-0.5, 4.5]} yDomain={[-0.5, 4.5]} xLabel="A count" yLabel="B count">{({ x, y }) => Array.from({ length: 5 }, (_, a) => <g key={a}><circle cx={x(a)} cy={y(4 - a)} r={5 + 18 * Math.sqrt(binomial(a))} className="sp-area" /><Label x={x(a)} y={y(4 - a) + (a === 0 ? 36 : -24)}>{fmt(binomial(a), 3)}</Label></g>)}</Plot>
    <Table title="Unconditioned product-Poisson masses" headers={["A / B", 0, 1, 2, 3, 4]} rows={Array.from({ length: 5 }, (_, a) => [a, ...Array.from({ length: 5 }, (_2, b) => splitCountLaw(4, a, b, 0.3).joint)])} />
  </Figure>;
}
function ArrivalAlternativesFigure(props) {
  return <Figure {...props} title="Alternation, independent merging and copied events have different clocks" caption="Alternating marks make a return to A wait for two original arrivals. Independent thinning instead produces an exponential A wait. Independent streams merge by rate addition; copied timestamps produce coincident pairs and violate the independent simple-Poisson premise.">
    <EventStream marked />
    <Canvas title="A-to-A wait contains two complete original waiting intervals" height={180}><Dot at={[50, 73]} label="A" /><Dot at={[180, 73]} label="B" /><Dot at={[310, 73]} label="A" /><Arrow from={[68, 73]} to={[162, 73]} label="Wait 1" /><Arrow from={[198, 73]} to={[292, 73]} label="Wait 2" /><path d="M50 108 V128 H310 V108" className="sp-line" /><Label x="180" y="159">A return: Wait 1 + Wait 2</Label></Canvas>
    <Compare><EventStream events={[0.2, 0.4, 1.1, 1.5].map((time, i) => ({ time, index: i + 1 }))} /><EventStream events={[0.2, 0.2, 1.1, 1.1].map((time, i) => ({ time, index: i + 1 }))} /></Compare>
    <Table title="Merge assumptions" headers={["Left stream", "Right stream"]} rows={[["Distinct independent source events", "Copied timestamps, double records"], ["Rates add under independence", "Pairs coincide; independence fails"]]} />
  </Figure>;
}
function OperationalClockFigure(props) {
  return <Figure {...props} title="The inverse accumulated clock maps operational waits to physical time" caption="Rates 1 then 4 over 2+1 minutes accumulate intensity 6. Under a zero first rate followed by 3/minute, operational time 1.5 maps to physical 2.5 minutes. No event can lie in the zero-rate plateau.">
    <RateClock />
    <Plot title="Zero-rate prefix with an explicitly selected inverse point" xDomain={[0, 4]} yDomain={[0, 6]} xLabel="Physical minutes" yLabel="Operational time" series={[{ points: [[0, 0], [2, 0], [4, 6]] }]}>{({ x, y }) => <><line x1={x(0)} x2={x(2.5)} y1={y(1.5)} y2={y(1.5)} className="sp-line sp-secondary" /><line x1={x(2.5)} x2={x(2.5)} y1={y(0)} y2={y(1.5)} className="sp-line sp-secondary" /><circle cx={x(2.5)} cy={y(1.5)} r="5" className="sp-bit" /></>}</Plot>
  </Figure>;
}
function HoldingClockFigure(props) {
  return <Figure {...props} title="The state chooses the holding rate; competing clocks choose the destination" caption="On departs at .5/hour, mean 2 hours; Off departs at 2/hour, mean .5 hour. Two independent outgoing clocks of rates 1 and 2/hour have minimum rate 3/hour, with destination probabilities ⅓ and ⅔.">
    <Canvas title="Two state-specific holding clocks and their directed rate edges" height={240}><Dot at={[70, 115]} label="On" below="Mean 2 h" /><Dot at={[285, 115]} label="Off" below="Mean .5 h" /><Arrow from={[88, 105]} to={[267, 105]} bend={-50} label=".5 / h" labelAt={[180, 51]} /><Arrow from={[267, 129]} to={[88, 129]} bend={-50} label="2 / h" labelAt={[180, 206]} className="sp-secondary" /></Canvas>
    <Compare><Plot title="Survival of two competing clocks" xDomain={[0, 2]} yDomain={[0, 1]} xLabel="Hours" yLabel="P(clock > t)" series={[{ points: Array.from({ length: 81 }, (_, i) => [i / 40, Math.exp(-i / 40)]) }, { points: Array.from({ length: 81 }, (_, i) => [i / 40, Math.exp(-2 * i / 40)]), className: "sp-secondary" }]} /><Plot title="Survival of their minimum" xDomain={[0, 2]} yDomain={[0, 1]} xLabel="Hours" yLabel="P(minimum > t)" series={[{ points: Array.from({ length: 81 }, (_, i) => [i / 40, Math.exp(-3 * i / 40)]) }]} /></Compare>
  </Figure>;
}
function GeneratorSemigroupFigure(props) {
  const state = jumpClockState();
  const on = (t) => 0.8 + 0.2 * Math.exp(-2.5 * t);
  return <Figure {...props} title="Generator entries are rates; exponential transition entries are probabilities" caption="Rows of G sum to zero. At current law (.8,.2), the opposing fluxes are .4/hour. Matrix exponentials propagate a probability law across intervals; exp(Gt) is not entrywise exponentiation. The first-order Off row at t=1 is (2,−1), visibly inadmissible as probabilities.">
    <Matrix title="G, rates per hour; order On,Off" values={state.generator} rowNames={["On", "Off"]} columnNames={["On", "Off"]} />
    <MassFlowClock />
    <Table title="The same exact On-start law at successive times" headers={["Hours", "On probability", "Off probability"]} rows={[0, 0.5, 1].map((t) => [t, on(t), 1 - on(t)])} />
    <Canvas title="First-order approximation from Off has a negative component" height={160}><line x1="180" x2="180" y1="30" y2="120" className="sp-grid" /><rect x="180" y="44" width="132" height="23" className="sp-area" /><rect x="114" y="89" width="66" height="23" fill="#97bfca" fillOpacity=".25" stroke="#97bfca" /><Label x="245" y="39">On: 2</Label><Label x="101" y="133">Off: −1</Label><Label x="180" y="20">0</Label></Canvas>
  </Figure>;
}
function MassFlowClock() {
  return <Canvas title="Generator flux .8×.5 = .2×2 = .4 per hour" height={200}><Dot at={[65, 100]} label="On" below=".8 mass" /><Dot at={[295, 100]} label="Off" below=".2 mass" /><Arrow from={[83, 90]} to={[277, 90]} bend={-45} label=".4 / h" labelAt={[180, 40]} /><Arrow from={[277, 113]} to={[83, 113]} bend={-45} label=".4 / h" labelAt={[180, 181]} className="sp-secondary" /></Canvas>;
}
function UniformizationFigure(props) {
  const weights = Array.from({ length: 9 }, (_, k) => poissonMass(2, k));
  return <Figure {...props} title="A common Poisson clock includes virtual stays" caption="With ν=2/hour, R=I+G/ν has On stay .75 and switch .25; Off always switches. Virtual On ticks do not create a physical departure. Poisson-weighted Rᵏ sums retain their truncation tail; they are not renormalized. Zero generator gives the identity directly.">
    <Matrix title="R at a common 2/hour clock" values={[[0.75, 0.25], [1, 0]]} rowNames={["On", "Off"]} columnNames={["On", "Off"]} />
    <Canvas title="Tick sequence with a virtual On self transition" height={240}>{["On", "On", "Off", "On"].map((name, i) => <g key={i}><Dot at={[42 + 91 * i, 90]} label={name} /><Label x={42 + 91 * i} y="32">Tick {i}</Label>{i < 3 && <Arrow from={[59 + 91 * i, 90]} to={[115 + 91 * i, 90]} label={i === 0 ? ".75" : i === 1 ? ".25" : "1"} />}</g>)}<Label x="180" y="171">First tick: no physical state change</Label></Canvas>
    <Table title="Actual mixture weights at one hour" headers={["Power k", "Poisson weight; mean 2"]} rows={weights.map((value, k) => [k, value])} />
    <Compare><Matrix title="R⁰, current state counted before any ticks" values={[[1, 0], [0, 1]]} rowNames={["On", "Off"]} columnNames={["On", "Off"]} /><Matrix title="R², two conditional tick transitions" values={[[0.8125, 0.1875], [0.75, 0.25]]} rowNames={["On", "Off"]} columnNames={["On", "Off"]} /></Compare>
    <Matrix title="Unrenormalized first three terms w₀I + w₁R + w₂R²" values={[[1 + 2 * 0.75 + 2 * 0.8125, 2 * 0.25 + 2 * 0.1875], [2 + 2 * 0.75, 1 + 2 * 0.25]].map((row) => row.map((value) => value * Math.exp(-2)))} rowNames={["On", "Off"]} columnNames={["On", "Off"]} />
    <p>Each row of this three-term prefix sums to {fmt(5 * Math.exp(-2))}. The missing tick-count mass {fmt(1 - 5 * Math.exp(-2))} is retained as a remainder; it is not divided away.</p>
    <p>Terms beyond the displayed k=8 are still required. The full route sums through k=40 and reports the remaining Poisson tail separately.</p>
    <Canvas title="Pure-birth rates grow quadratically while expected holding times shrink" height={325}>{[1, 2, 3, 4].map((state, i) => <g key={state}><Label x="28" y={43 + i * 65}>{state}</Label><rect x="72" y={25 + i * 65} width={240 / (state * state)} height="22" className="sp-area" /><Label x="190" y={65 + i * 65}>Rate {state * state}; mean 1/{state * state}</Label></g>)}<Label x="180" y="313">Mean waits: Σ 1/i² &lt; ∞</Label></Canvas>
    <p>The shrinking strips are expected waits, not a realized deterministic path. Their summable infinite total explains why a pure-birth process with rate i² can explode; a finite uniformization clock with bounded rates supplies a different nonexplosion argument.</p>
  </Figure>;
}
function DurationStationarityFigure(props) {
  return <Figure {...props} title="The jump sequence and elapsed occupation weight states differently" caption="Embedded visits alternate, mass ½ each. Dividing by departure rates .5 and 2/hour gives duration weights 1 and .25 hours; normalization yields .8 On and .2 Off. Aggregate incoming balance can also hold on a directed cycle without detailed balance.">
    <Canvas title="Expected duration strips from equal visit masses" height={220}><Label x="28" y="53" anchor="start">On</Label><rect x="70" y="35" width="240" height="28" className="sp-area" /><Label x="190" y="91">½ / .5 = 1 hour weight</Label><Label x="28" y="145" anchor="start">Off</Label><rect x="70" y="127" width="60" height="28" fill="#97bfca" fillOpacity=".3" stroke="#97bfca" /><Label x="190" y="183">½ / 2 = .25 hour weight</Label></Canvas>
    <Table title="Visits → duration-weighted stationary mass" headers={["State", "Visit mass", "Departure / h", "Weight (h)", "Time mass"]} rows={[["On", 0.5, 0.5, 1, 0.8], ["Off", 0.5, 2, 0.25, 0.2]]} />
    <Canvas title="Equal total incoming and outgoing flux does not require pairwise reversals" height={220}><Dot at={[180, 40]} label="A" /><Dot at={[65, 165]} label="B" /><Dot at={[295, 165]} label="C" /><Arrow from={[165, 55]} to={[78, 149]} label="⅓" labelAt={[91, 95]} /><Arrow from={[83, 165]} to={[277, 165]} label="⅓" labelAt={[180, 149]} /><Arrow from={[282, 149]} to={[195, 55]} label="⅓" labelAt={[269, 95]} /><Label x="180" y="209">One-way cycle: reverse pair fluxes are 0</Label></Canvas>
  </Figure>;
}
export {
  ArrivalAlternativesFigure,
  ArrivalCoordinatesFigure,
  ConditionalCountFigure,
  CountClockLawFigure,
  CountMass,
  CountStairs,
  DurationStationarityFigure,
  EventStream,
  GeneratorSemigroupFigure,
  HoldingClockFigure,
  IncrementOverlapFigure,
  KthArrivalFigure,
  MarkedJointFigure,
  OperationalClockFigure,
  RateClock,
  UniformizationFigure,
  literalArrivals
};
