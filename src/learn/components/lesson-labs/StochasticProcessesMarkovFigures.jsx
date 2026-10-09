import { finiteProcessLaw, markovState, absorptionState } from "../../data/stochastic-processes-models.js";
import { Figure, Canvas, Label, Arrow, Dot, Compare, Histories, Matrix, MassFlow, StepPath, Plot, Table, Bars, ReserveGraph, fmt } from "./StochasticProcessesDrawings.jsx";
function ProcessIndexFigure(props) {
  return <Figure {...props} title="A column is one random state; a row trace is a realization" caption="Dots are observations at integer times. Joining them tracks their order; it does not assert a measured state between observations. Amber realizes 0,1,1,0; the dashed comparison realizes 1,0,0,1.">
    <Plot title="Two discrete four-observation histories on the same axes" xDomain={[0, 3]} yDomain={[-0.25, 1.25]} xLabel="Observation time" yLabel="Binary state" series={[{ points: [[0, 0], [1, 1], [2, 1], [3, 0]] }, { points: [[0, 1], [1, 0], [2, 0], [3, 1]], className: "sp-secondary" }]}>
      {({ x, y }) => <><rect x={x(2) - 10} y="42" width="20" height="170" className="sp-area" />{[0, 1, 1, 0].map((bit, i) => <circle key={i} cx={x(i)} cy={y(bit)} r="4" className="sp-bit" />)}<Label x={x(2)} y="65">X₂</Label></>}
    </Plot>
  </Figure>;
}
function PathSupportFigure(props) {
  return <Figure {...props} title="Complete path supports with equal single-time marginals" caption="Every supported history is drawn, with its exact mass. The solid histories have equal first two bits. The equality-event probabilities differ even though each column has P(1)=½.">
    {["fresh", "frozen", "alternating"].map((kind) => <div key={kind}><p><strong>{kind}</strong>: adjacent equality = {fmt(finiteProcessLaw(kind).adjacentEqual)}; each single-time P(1) = ½.</p><Histories law={finiteProcessLaw(kind)} /></div>)}
  </Figure>;
}
function ConditionalHistoryFigure(props) {
  return <Figure {...props} title="Future branches given the observed prefix 1" caption="The observed prefix has probability ½ in both laws. Fresh continuations retain both alternatives; the frozen rule has only continuation 1.">
    <Compare>{["Fresh redraw", "Frozen initial bit"].map((title, k) => <Canvas key={title} title={title} height={230}>
      <Label x="180" y="22">{title}</Label><Dot at={[65, 110]} label="1" below="Observed" />
      <Dot at={[287, 65]} label="0" /><Dot at={[287, 170]} label="1" />
      <Arrow from={[82, 110]} to={[269, 65]} label={k === 0 ? "\xBD" : "0"} className={k === 1 ? "sp-zero" : ""} labelAt={[172, 55]} />
      <Arrow from={[82, 110]} to={[269, 170]} label={k === 0 ? "\xBD" : "1"} labelAt={[172, 180]} />
    </Canvas>)}</Compare>
  </Figure>;
}
function StationaryWindowFigure(props) {
  return <Figure {...props} title="Shifted frozen windows retain the law, while one path stays 0 or 1" caption="Each full constant history has mass ½ before and after shifting the observation window. A single path's running average is 0 or 1; the ensemble mean is ½.">
    <Canvas title="Two windows cut from each constant realization" height={260}>
      {[0, 1].map((bit, row) => <g key={bit}>
        <Label x="24" y={72 + row * 108}>½</Label>
        <line x1="58" x2="318" y1={65 + row * 108} y2={65 + row * 108} className={row === 0 ? "sp-line" : "sp-line sp-secondary"} />
        {[0, 1, 2, 3, 4].map((t) => <Dot key={t} at={[62 + 62 * t, 65 + row * 108]} label={bit} />)}
        <rect x="50" y={40 + row * 108} width="212" height="50" fill="none" stroke="#edc267" /><rect x="112" y={34 + row * 108} width="212" height="62" fill="none" stroke="#97bfca" strokeDasharray="4 4" />
        <Label x="180" y={113 + row * 108}>Running mean = {bit}</Label>
      </g>)}
    </Canvas>
  </Figure>;
}
function TransitionWiringFigure(props) {
  const state = markovState();
  return <Figure {...props} title="Four conditional entries connect departure states to recipients" caption="Each departure row is one distribution: Sunny splits .8/.2; Rainy splits .3/.7. The drawn self loops are real stays. Table row names are current states, column names next states.">
    <Canvas title="Weather transition graph with true self loops" height={240}>
      <Dot at={[80, 117]} label="S" below="Sunny" /><Dot at={[280, 117]} label="R" below="Rainy" />
      <Arrow from={[96, 109]} to={[264, 109]} bend={-65} label=".2" labelAt={[180, 65]} />
      <Arrow from={[264, 129]} to={[96, 129]} bend={-65} label=".3" labelAt={[180, 193]} className="sp-secondary" />
      <path d="M65 111 C12 112 12 29 72 51 L77 97" className="sp-arrow" /><Label x="50" y="26">.8</Label>
      <path d="M295 111 C348 112 348 29 288 51 L283 97" className="sp-arrow" /><Label x="310" y="26">.7</Label>
    </Canvas>
    <Matrix title="P: current row → next column" values={state.matrix} rowNames={["Sunny", "Rainy"]} columnNames={["Sunny", "Rainy"]} />
    <Canvas title="Every departure node wired to both cells in its actual matrix row" height={290}>
      <Label x="45" y="25">Now</Label><Label x="155" y="25">Next S</Label><Label x="285" y="25">Next R</Label>
      {state.matrix.map((row, i) => <g key={i}><Dot at={[45, 83 + i * 135]} label={i === 0 ? "S" : "R"} />{row.map((p, j) => <g key={j}><rect x={130 + j * 130} y={63 + i * 135} width="50" height="40" fill="none" stroke="#ded5bf" /><Label x={155 + j * 130} y={88 + i * 135}>{fmt(p)}</Label></g>)}<Arrow from={[62, 83 + i * 135]} to={[128, 83 + i * 135]} /><path d={i === 0 ? "M62 75 C110 36 285 36 285 61" : "M62 226 C110 265 285 265 285 240"} className="sp-arrow" /></g>)}
    </Canvas>
  </Figure>;
}
function EndpointRoutesFigure(props) {
  return <Figure {...props} title="Two disjoint histories end Sunny at day 2" caption="S→R→S contributes .06; S→S→S contributes .64. The Sunny endpoint event contains both histories, so its mass is .70. The remaining two histories end Rainy, total .30.">
    <Canvas title="Separate intermediate nodes preserve route identity" height={360}>
      {[0, 1, 2].map((t) => <Label key={t} x={45 + 133 * t} y="22">Day {t}</Label>)}
      <Dot at={[45, 172]} label="S" /><Dot at={[178, 88]} label="S" /><Dot at={[178, 254]} label="R" />
      <Dot at={[311, 88]} label="S" below=".70" /><Dot at={[311, 254]} label="R" below=".30" />
      <Arrow from={[62, 163]} to={[161, 94]} label=".8" labelAt={[105, 103]} /><Arrow from={[62, 181]} to={[161, 246]} label=".2" labelAt={[105, 242]} className="sp-secondary" />
      <Arrow from={[195, 82]} to={[293, 82]} bend={-20} label=".8" labelAt={[243, 57]} /><Arrow from={[195, 94]} to={[293, 246]} bend={-22} label=".2" labelAt={[278, 158]} />
      <Arrow from={[195, 246]} to={[293, 94]} bend={-22} label=".3" labelAt={[209, 166]} className="sp-secondary" /><Arrow from={[195, 262]} to={[293, 262]} bend={20} label=".7" labelAt={[243, 306]} className="sp-secondary" />
    </Canvas>
    <Table title="Complete two-step histories from Sunny" headers={["History", "Product", "Mass"]} rows={[["SSS", ".8 \xD7 .8", 0.64], ["SRS", ".2 \xD7 .3", 0.06], ["SSR", ".8 \xD7 .2", 0.16], ["SRR", ".2 \xD7 .7", 0.14]]} />
  </Figure>;
}
function MarkovFactorizationFigure(props) {
  return <Figure {...props} title="The same conditional rule factors a complete history" caption="For certain initial Sunny, this S,R,R,S history has mass 1 × .2 × .7 × .3 = .042. Each edge conditions on its current state; the observed prefix is available, but the homogeneous Markov rule needs only the last state.">
    <Canvas title="Four-layer S,R,R,S history with available prefixes" height={260}>
      {["S", "R", "R", "S"].map((state, i) => <g key={i}><Dot at={[39 + 94 * i, 84]} label={state} /><Label x={39 + 94 * i} y="34">t = {i}</Label>{i < 3 && <Arrow from={[56 + 94 * i, 84]} to={[116 + 94 * i, 84]} label={[".2", ".7", ".3"][i]} labelAt={[86 + 94 * i, 64]} />}</g>)}
      {[1, 2, 3].map((i) => <g key={i}><path d={`M39 ${132 + i * 30} H${39 + i * 94}`} className="sp-line sp-secondary" /><Label x="180" y={125 + i * 30}>{["Prefix S", "Prefix SR", "Prefix SRR"][i - 1]}</Label></g>)}
    </Canvas>
  </Figure>;
}
function StateCoarseningFigure(props) {
  return <Figure {...props} title="Two hidden zero states have different futures" caption="A,B,C cycle deterministically. Reporting A and B as 0 merges states with different next reports. The prefix 1,0 identifies A; the prefix 0,0 identifies B.">
    <Canvas title="True cycle and its many-to-one reporting map" height={300}>
      {["A", "B", "C"].map((state, i) => <g key={state}><Dot at={[65 + 115 * i, 90]} label={state} /><Arrow from={[65 + 115 * i, 108]} to={[65 + 115 * i, 177]} /><Dot at={[65 + 115 * i, 196]} label={i < 2 ? "0" : "1"} /></g>)}
      <Arrow from={[83, 90]} to={[161, 90]} /><Arrow from={[198, 90]} to={[276, 90]} /><path d="M295 70 V40 H65 V71" className="sp-arrow" />
      <Label x="180" y="25">True state cycle</Label><Label x="180" y="246">Reported values; A and B stay separate</Label>
    </Canvas>
    <Table title="Positive observed prefixes distinguish the zero states" headers={["Previous, current", "True current", "Next report"]} rows={[["1,0", "A", 0], ["0,0", "B", 1]]} />
  </Figure>;
}
function StationaryFluxFigure(props) {
  return <Figure {...props} title="Stationary masses send equal opposing weather flux" caption="Mass .6 sends .12 to Rainy; mass .4 sends .12 to Sunny. The unchanged law is (.6,.4). On the probability ruler, x−.6 is contracted by multiplier .5 at every weather step.">
    <MassFlow matrix={[[0.8, 0.2], [0.3, 0.7]]} source={[0.6, 0.4]} />
    <Plot title="Recurrence and fixed point on a probability coordinate" xDomain={[0, 1]} yDomain={[0, 1]} xLabel="Current Sunny probability x" yLabel="Next Sunny probability" series={[{ points: [[0, 0.3], [1, 0.8]] }, { points: [[0, 0], [1, 1]], className: "sp-secondary" }]}>{({ x, y }) => <circle cx={x(0.6)} cy={y(0.6)} r="5" className="sp-bit" />}</Plot>
  </Figure>;
}
function ClosedClassesFigure(props) {
  return <Figure {...props} title="Transient mass feeds separate closed classes" caption="The first graph has two absorbing singleton classes and many stationary mixtures. The second graph is reducible but has only the stationary point mass at B. Irreducibility is sufficient, not necessary, for uniqueness.">
    <Compare>
      <div><Canvas title="Transient T feeds absorbing A and B" height={240}><Dot at={[180, 52]} label="T" /><Dot at={[65, 170]} label="A" /><Dot at={[295, 170]} label="B" /><Arrow from={[165, 65]} to={[78, 154]} label=".4" labelAt={[91, 111]} /><Arrow from={[195, 65]} to={[282, 154]} label=".6" labelAt={[270, 111]} /><path d="M50 174 C8 188 18 115 57 143" className="sp-arrow" /><path d="M310 174 C352 188 342 115 303 143" className="sp-arrow" /><Label x="26" y="124">1</Label><Label x="334" y="124">1</Label></Canvas><Matrix title="Order T,A,B" values={[[0, 0.4, 0.6], [0, 1, 0], [0, 0, 1]]} rowNames={["T", "A", "B"]} columnNames={["T", "A", "B"]} /></div>
      <div><Canvas title="A feeds the only closed class B" height={240}><Dot at={[65, 130]} label="A" /><Dot at={[275, 130]} label="B" /><Arrow from={[83, 130]} to={[257, 130]} label="1" /><path d="M288 115 C345 102 336 50 281 72 L279 111" className="sp-arrow" /><Label x="314" y="49">1</Label></Canvas><Matrix title="Order A,B" values={[[0, 1], [0, 1]]} rowNames={["A", "B"]} columnNames={["A", "B"]} /></div>
    </Compare>
  </Figure>;
}
function PeriodLazyFigure(props) {
  return <Figure {...props} title="Laziness changes the path support but retains the invariant law" caption="The alternator started at A has marginal masses alternating forever. Adding half-probability stays gives the uniform marginal after one step. A directed three-cycle retains uniform circulation without pairwise detailed balance.">
    <Compare><StepPath title="Alternating point mass at A" values={[1, 0, 1, 0, 1]} yLabel="P(A)" /><StepPath title="Lazy alternator" values={[1, 0.5, 0.5, 0.5, 0.5]} yLabel="P(A)" /></Compare>
    <Canvas title="Lazy repair adds literal half-probability self loops" height={240}><Dot at={[75, 120]} label="A" /><Dot at={[285, 120]} label="B" /><Arrow from={[92, 108]} to={[268, 108]} bend={-55} label="½" labelAt={[180, 61]} /><Arrow from={[268, 133]} to={[92, 133]} bend={-55} label="½" labelAt={[180, 207]} className="sp-secondary" /><path d="M62 108 C15 84 20 35 64 58 L70 102" className="sp-arrow" /><path d="M298 108 C345 84 340 35 296 58 L290 102" className="sp-arrow" /><Label x="34" y="29">½</Label><Label x="326" y="29">½</Label></Canvas>
    <Matrix title="Half stay, half switch" values={[[0.5, 0.5], [0.5, 0.5]]} rowNames={["A", "B"]} columnNames={["A", "B"]} />
    <Canvas title="One-way three-cycle: uniform incoming equals outgoing mass" height={230}><Dot at={[180, 45]} label="A" /><Dot at={[65, 177]} label="B" /><Dot at={[295, 177]} label="C" /><Arrow from={[167, 59]} to={[78, 161]} label="⅓ flux" labelAt={[81, 102]} /><Arrow from={[83, 177]} to={[277, 177]} label="⅓ flux" labelAt={[180, 164]} /><Arrow from={[282, 161]} to={[193, 59]} label="⅓ flux" labelAt={[281, 102]} /></Canvas>
  </Figure>;
}
function CesaroContractionFigure(props) {
  return <Figure {...props} title="Averaging bounds the displacement; common row mass contracts differences" caption="At n=3 the alternator's averaged law is (⅔,⅓); one more application changes it by (−⅓,⅓). Weather rows share .2 in each destination, total common mass .4; their remaining portions total .6. Compactness and repeated common-mass contraction supply the proof after these objects.">
    <Plot title="Averaged probability laws on the two-state simplex" xDomain={[0, 1]} yDomain={[0, 1]} xLabel="Sunny mass" yLabel="Rainy mass" series={[{ points: [[0, 1], [1, 0]], className: "sp-secondary" }]}>{({ x, y }) => <><circle cx={x(2 / 3)} cy={y(1 / 3)} r="5" className="sp-bit" /><circle cx={x(1 / 3)} cy={y(2 / 3)} r="5" className="sp-bit" /><Arrow from={[x(2 / 3), y(1 / 3)]} to={[x(1 / 3), y(2 / 3)]} /></>}</Plot>
    <Canvas title="Actual common and remaining pieces of both transition rows" height={200}>
      {[[0.8, 0.2], [0.3, 0.7]].map((row, i) => <g key={i}><Label x="30" y={65 + 80 * i}>{i === 0 ? "S" : "R"}</Label>{row.map((mass, j) => <g key={j}><rect x={60 + j * 145} y={43 + 80 * i} width={mass * 120} height="26" className="sp-area" /><rect x={60 + j * 145} y={43 + 80 * i} width="24" height="26" fill="#97bfca" fillOpacity=".5" /><Label x={120 + j * 145} y={88 + 80 * i}>{mass} ({j === 0 ? "S" : "R"})</Label></g>)}</g>)}
    </Canvas>
  </Figure>;
}
function ReturnRewardFigure(props) {
  const path = ["A", "B", "B", "A", "A", "B", "A"];
  return <Figure {...props} title="Return cycles carry step lengths and visit rewards" caption="Cuts occur at returns to A. The three complete cycles have lengths 3,1,2 and B-visit rewards 2,0,1. This literal prefix has reward/length 3/6; the theorem uses expected cycle reward divided by expected cycle length, under the stated recurrence assumptions.">
    <Canvas title="Literal return-cycle cuts, with B visits marked" height={190}>
      {path.map((value, i) => <g key={i}><Dot at={[30 + 50 * i, 88]} label={value} className={value === "B" ? "sp-selected" : ""} /><Label x={30 + 50 * i} y="133">{i}</Label>{i < path.length - 1 && <Arrow from={[47 + 50 * i, 88]} to={[63 + 50 * i, 88]} />}</g>)}
      {[0, 3, 4, 6].map((i) => <line key={i} x1={30 + 50 * i} x2={30 + 50 * i} y1="35" y2="150" className="sp-grid" />)}
    </Canvas><Table title="Complete cycles in this realization" headers={["Steps", "Length", "B rewards"]} rows={[["0\u20133", 3, 2], ["3\u20134", 1, 0], ["4\u20136", 2, 1]]} />
  </Figure>;
}
function FirstHitPrefixFigure(props) {
  return <Figure {...props} title="A first hit ends the observed prefix; censoring is different" caption="The first realization hits upper boundary 4 at step 4 and stops. The dashed unfinished realization ends at reserve 3 before either target: it is censored, not an observed failure. Ghost marks beyond the hit are not part of the stopped path.">
    <Compare><StepPath title="Stop at first upper hit" values={[2, 1, 2, 3, 4]} yDomain={[0, 4]} yLabel="Reserve" /><StepPath title="Censored before either hit" values={[2, 3, 2, 3]} yDomain={[0, 4]} yLabel="Reserve" className="sp-secondary" /></Compare>
  </Figure>;
}
function FirstStepEquationFigure(props) {
  const result = absorptionState({ steps: 4 });
  return <Figure {...props} title="Neighbour success and one consumed step are different operands" caption="From reserve 2, neighbour success averages ¼ and ¾ to ½. Duration consumes one step before averaging neighbour durations 3 and 3, giving 4. At either boundary the remaining duration is zero.">
    <ReserveGraph result={result} />
    <Compare><Canvas title="Success probability branches" height={220}><Dot at={[180, 42]} label="2" /><Dot at={[65, 151]} label="1" below="h = ¼" /><Dot at={[295, 151]} label="3" below="h = ¾" /><Arrow from={[166, 57]} to={[78, 135]} label="½" labelAt={[90, 93]} /><Arrow from={[194, 57]} to={[282, 135]} label="½" labelAt={[270, 93]} /></Canvas><Canvas title="First consume one step, then ask remaining duration" height={260}><Dot at={[180, 40]} label="2" /><line x1="180" x2="180" y1="56" y2="108" className="sp-line" /><Label x="224" y="86">+1 step</Label><Dot at={[180, 122]} label="•" /><Dot at={[65, 200]} label="1" below="t = 3" /><Dot at={[295, 200]} label="3" below="t = 3" /><Arrow from={[164, 135]} to={[78, 185]} label="½" labelAt={[92, 151]} /><Arrow from={[196, 135]} to={[282, 185]} label="½" labelAt={[270, 151]} /></Canvas></Compare>
  </Figure>;
}
function TransientVisitBlocksFigure(props) {
  const result = absorptionState();
  return <Figure {...props} title="Transient blocks count visits before absorption" caption="Q wires reserves 1–3 to one another. R wires them to targets 0 and 4. The entry Fᵢⱼ adds visits at time 0,1,2,… before absorption. Directly solving (I−Q) avoids explicitly forming an inverse in the maintained programme.">
    <Compare><Matrix title="Q: transient → transient" values={result.q} rowNames={["1", "2", "3"]} columnNames={["1", "2", "3"]} /><Matrix title="R: transient → targets" values={[[0.5, 0], [0, 0], [0, 0.5]]} rowNames={["1", "2", "3"]} columnNames={["0", "4"]} /></Compare>
    <Matrix title="F: expected visits including the current state" values={result.visits} rowNames={["1", "2", "3"]} columnNames={["1", "2", "3"]} />
    <Canvas title="Actual transient return routes contribute to F₂₂" height={270}><Label x="43" y="25">Time 0</Label><Label x="172" y="25">Time 1</Label><Label x="310" y="25">Time 2</Label><Dot at={[43, 129]} label="2" below="Mass 1" /><Dot at={[172, 65]} label="1" /><Dot at={[172, 194]} label="3" /><Dot at={[310, 129]} label="2" below="Return .5" /><Arrow from={[60, 122]} to={[154, 71]} label=".5" labelAt={[91, 67]} /><Arrow from={[60, 137]} to={[154, 187]} label=".5" labelAt={[92, 195]} /><Arrow from={[189, 72]} to={[292, 123]} label=".5" labelAt={[269, 65]} /><Arrow from={[189, 187]} to={[292, 137]} label=".5" labelAt={[269, 195]} /><Label x="180" y="252">Visit contributions at 2: 1, 0, .5, 0, .25, …</Label></Canvas>
    <Canvas title="A closed class avoiding the target breaks finite all-state duration" height={170}><Dot at={[65, 90]} label="A" /><Dot at={[185, 90]} label="B" /><Dot at={[310, 90]} label="T" /><Arrow from={[82, 82]} to={[167, 82]} bend={-30} /><Arrow from={[167, 102]} to={[82, 102]} bend={-30} /><Label x="180" y="151">No path from A or B to target T</Label></Canvas>
  </Figure>;
}
function DurationTailFigure(props) {
  const state = absorptionState({ steps: 12 });
  const survival = state.history.map((row) => row.surviving);
  const partial = survival.slice(0, 12).reduce((a, b) => a + b, 0);
  return <Figure {...props} title="Mean hitting duration adds survival strips" caption={`Each width-one strip has area P(\u03C4>k). The first 12 strips total ${fmt(partial)}; the remaining tail contributes ${fmt(4 - partial)}. The exact finite solve gives E\u03C4=4, not merely the displayed prefix.`}>
    <Plot title="Survival at integer steps" xDomain={[0, 12]} yDomain={[0, 1]} xLabel="k (steps)" yLabel="P(τ > k)">{({ x, y }) => survival.slice(0, 12).map((value, k) => <rect key={k} x={x(k)} y={y(value)} width={x(k + 1) - x(k)} height={y(0) - y(value)} className="sp-area" />)}</Plot>
    <Table title="Partial survival sum and undisplayed remainder" headers={["Quantity", "Steps"]} rows={[["Displayed 12-strip sum", partial], ["Infinite remainder", 4 - partial], ["Exact mean", 4]]} />
  </Figure>;
}
export {
  CesaroContractionFigure,
  ClosedClassesFigure,
  ConditionalHistoryFigure,
  DurationTailFigure,
  EndpointRoutesFigure,
  FirstHitPrefixFigure,
  FirstStepEquationFigure,
  MarkovFactorizationFigure,
  PathSupportFigure,
  PeriodLazyFigure,
  ProcessIndexFigure,
  ReturnRewardFigure,
  StateCoarseningFigure,
  StationaryFluxFigure,
  StationaryWindowFigure,
  TransientVisitBlocksFigure,
  TransitionWiringFigure
};
