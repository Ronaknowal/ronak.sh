import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import { usePropagation } from './MessagePassingFlowPropagationState.jsx';
import { Drawing, Arrow, num, centerText, Operation, NodeRow, ColumnGrid, ChannelMatrix, NodeOperator, VectorOperation, ExactRows, paperHues, channelHues, roleHues } from './MessagePassingFlowPropagationElements.jsx';
import { bottleneckTrace, residualTrace, compensationTrace, scaleTrace, whiteningTrace, routedTrace, depthReadoutTrace } from '../../data/message-propagation-flow-models.js';
function ScalarProduct({
  first,
  second,
  labels,
  title,
  output
}) {
  return <Drawing width={288} height={246} label={`${title}; ${labels[0]}=${first}, ${labels[1]}=${second}, product ${output}`}>
    {[first, second].map((value, i) => <g key={i}>
      <text x={64 + i * 160} y="26" textAnchor="middle">
        {labels[i]}
      </text>
      <circle cx={64 + i * 160} cy="78" r="34" fill="#111" stroke={i ? roleHues.parameter : roleHues.input} />
      <text x={64 + i * 160} y="84" textAnchor="middle" fill={i ? roleHues.parameter : roleHues.input}>
        {num(value, 4)}
      </text>
    </g>)}
    <Arrow x1={64} y1={118} x2={120} y2={160} />
    <Arrow x1={224} y1={118} x2={168} y2={160} />
    <circle cx="144" cy="178" r="24" fill="#111" stroke="#aaa" />
    <text x="144" y="184" textAnchor="middle">×</text>
    {centerText(236, `${title} = ${num(output, 6)}`, roleHues.computed)}
  </Drawing>;
}
function NodeSum({
  first,
  second,
  result,
  title
}) {
  return <Drawing width={288} height={285} label={`${title}; pair each node's contributions before adding`}>
    {centerText(25, title)}
    {result.map((value, node) => <g key={node}>
      <text x="27" y={76 + node * 65} textAnchor="middle" fill={paperHues[node]}>n{node}</text>
      <text x="65" y={76 + node * 65} fill={paperHues[node]}>{num(first[node], 3)} + {num(second[node], 3)}</text>
      <Arrow x1={186} y1={70 + node * 65} x2={215} y2={70 + node * 65} />
      <text x="246" y={76 + node * 65} textAnchor="middle" fill={paperHues[node]}>
        {num(value, 3)}
      </text>
    </g>)}
    {centerText(277, 'Matching node IDs meet at each +', '#bbb')}
  </Drawing>;
}
export function MessagePassingBottleneckLab() {
  const [delta, setDelta] = useState(1),
    [revision, setRevision] = useState(0),
    trace = bottleneckTrace(delta),
    positions = [[256, 70], [112, 198], [400, 198], [48, 326], [184, 326], [328, 326], [464, 326]];
  return <FlowLab id="propagation-tree-bottleneck" label="Trace a distant leaf into a one-channel root">
    <figure data-mp-drawing="D34">
      <Drawing width={512} height={434} label="Seven-node undirected tree; root 0, children 1/2, leaves 3–6; initial nonzero only at 3">
        {centerText(25, 'Tree · initial one-channel values', '#eee', 256)}
        {[[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].map(([a, b]) => {
          const [x1, y1] = positions[a],
            [x2, y2] = positions[b],
            dx = x2 - x1,
            dy = y2 - y1,
            length = Math.hypot(dx, dy);
          return <Arrow key={`${a}-${b}`} x1={x1 + dx / length * 27} y1={y1 + dy / length * 27} x2={x2 - dx / length * 27} y2={y2 - dy / length * 27} both hue={b === 3 || a === 0 && b === 1 ? paperHues[3] : '#888'} />;
        })}
        {positions.map(([x, y], node) => <g key={node}>
          <circle cx={x} cy={y} r="25" fill="#111" stroke={node === 3 ? '#fff' : paperHues[node % 6]} strokeWidth={node === 3 ? 3 : 2} />
          <text x={x} y={y + 6} textAnchor="middle" fill={paperHues[node % 6]}>
            {node}
          </text>
          <text x={x} y={y + 46} textAnchor="middle">d={trace.degree[node]}</text>
        </g>)}
        {centerText(407, `Only leaf 3 starts at δ = ${num(delta, 9)}`, roleHues.input, 256)}
      </Drawing>
      <div className="mp-propagation-grid">
        {trace.routes.map(route => <Drawing key={route.leaf} width={288} height={399} label={`Leaf ${route.leaf} via ${route.parent} to 0; two factors ${route.firstFactor} and ${route.secondFactor}`}>
          {centerText(25, `Leaf ${route.leaf} → ${route.parent} → root 0`, paperHues[route.leaf % 6])}
          {centerText(67, `Leaf input = ${num(route.value, 9)}`)}
          <Arrow x1={144} y1={83} x2={144} y2={111} />
          <Operation y={118} text="× 1/√8" />
          {centerText(198, `At parent = ${num(route.intermediate, 9)}`, roleHues.computed)}
          <Arrow x1={144} y1={213} x2={144} y2={241} />
          <Operation y={248} text="× 1/√12" />
          {centerText(329, `At root = ${num(route.contribution, 9)}`, roleHues.computed)}
          {centerText(381, 'Sensitivity = 1/(4√6)', '#bbb')}
        </Drawing>)}
        <NodeRow values={[trace.root]} title="Root 0 · merged scalar" />
      </div>
      <ExactRows caption="Arrival and sensitivity remain different" headers={['Quantity', 'Value']} rows={[['Root after one round', trace.first[0]], ['Root after two rounds', trace.root], ['Leaf 3→root coefficient', trace.routes[0].sensitivity]]} />
      <figcaption>Unit own loops give degrees [3,4,4,2,2,2,2]. All four leaf routes end in root 0's one channel, so different allocations can share the same sum. One round has no leaf→root route; two rounds carries leaf 3 through 1/√8 then 1/√12. This is fixed linear attenuation and compression, separate from oversmoothing.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Leaf 3 value δ" value={delta} onChange={setDelta} min={-2} max={2} revision={revision} />
      <button type="button" onClick={() => {
        setDelta(1);
        setRevision(value => value + 1);
      }}>Reset leaf value</button>
    </FlowControls>
    <FlowReadout data-tree-root={trace.root}>Changing leaf 3 by δ={num(delta, 12)} gives root 0 contribution {num(trace.root, 12)} after two rounds. Change in root per unit leaf change is {num(trace.routes[0].sensitivity, 12)}. Other initial values remain 0; no learned amplification is included.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingInitialResidualLab() {
  const [alpha, setAlpha] = useState(.2),
    [revision, setRevision] = useState(0),
    trace = residualTrace(alpha);
  return <FlowLab id="propagation-initial-residual" label="Inject the same original input at every round">
    <figure data-mp-drawing="D35">
      <NodeRow values={trace.features} title="Original x · retained reference" />
      {trace.stages.map((stage, round) => <div className="mp-propagation-grid" key={round}>
        <VectorOperation input={stage.old} output={stage.mixed} title={`Round ${round + 1} · current h → S h`} operation="S mixes current complete row" />
        <VectorOperation input={stage.mixed} output={stage.currentTerm} title={`Round ${round + 1} · propagated branch`} operation="Multiply by 1−α" factor={1 - alpha} />
        <VectorOperation input={trace.features} output={stage.originalTerm} title={`Round ${round + 1} · original bypass`} operation="Multiply original x by α" factor={alpha} />
        <NodeSum first={stage.currentTerm} second={stage.originalTerm} result={stage.next} title={`Round ${round + 1} · add at each node`} />
      </div>)}
      <figcaption>The same original x enters both rounds through the α branch; it is never replaced by the current h. The propagated branch reads the previous complete row. These values use the original looped unit path and are independent of the earlier graph editor.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Original injection α" value={alpha} onChange={setAlpha} min={0} max={1} revision={revision} />
      <button type="button" onClick={() => {
        setAlpha(.2);
        setRevision(value => value + 1);
      }}>Reset original injection</button>
    </FlowControls>
    <FlowReadout data-initial-residual={trace.states[2].join(',')}>After two rounds the row is [{trace.states[2].map(value => num(value, 9)).join(', ')}]. α=0 follows plain S mixing; α=1 keeps the original row. For each fixed mode g and 0&lt;α≤1, its limiting factor isα/[1−(1−α)g]; this does not select an optimal supervised setting.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingOrdinaryResidual() {
  const trace = residualTrace();
  return <figure data-mp-drawing="D35-ordinary">
    <div className="mp-propagation-grid">
      <VectorOperation input={trace.features} output={trace.plain[1]} title="Current h → S h" operation="One fixed mixing step" />
      <NodeSum first={trace.features} second={trace.plain[1]} result={trace.ordinary} title="Ordinary residual · h + S h" />
    </div>
    <figcaption>This bypass adds the current representation, giving mode gain 1+g. It is different from repeatedly injecting the original x and can increase scale. The original path's one-step values are shown; a shortcut supplies a route without guaranteeing easier optimization.</figcaption>
  </figure>;
}
export function MessagePassingJumpingKnowledge() {
  const trace = residualTrace();
  return <figure data-mp-drawing="D35-JK">
    <div className="mp-propagation-grid">
      {trace.plain.map((row, depth) => <NodeRow key={depth} values={row} title={`Keep depth h${depth} · one channel`} />)}
    </div>
    <Drawing width={288} height={153} label="Concatenate matching node rows across three depths, increasing width 1 to 3">
      {centerText(25, 'Match the same node across depths')}
      <Arrow x1={64} y1={57} x2={120} y2={97} />
      <Arrow x1={144} y1={57} x2={144} y2={97} />
      <Arrow x1={224} y1={57} x2={168} y2={97} />
      {centerText(144, 'Concatenate [h0,h1,h2]')}
    </Drawing>
    <ColumnGrid table={trace.jk} columns={['depth0', 'depth1', 'depth2']} columnHues={['#82d3ed', '#e7a6da', '#bda4ee']} title="Read three retained depths" />
    <figcaption>Each row still belongs to the same node; each output channel names a different retained depth. Three d-channel states create 3d channels. This pictured Jumping Knowledge readout is concatenation, rather than the additive residual or a weighted depth mixture.</figcaption>
  </figure>;
}
export function MessagePassingCompensationLab() {
  const [gain, setGain] = useState(2),
    [revision, setRevision] = useState(0),
    trace = compensationTrace(gain);
  return <FlowLab id="propagation-channel-compensation" label="Compensate one retained mode with a channel map">
    <figure data-mp-drawing="D36">
      <div className="mp-propagation-grid">
        <ColumnGrid table={trace.input} title="X · two node-pattern columns" />
        <Drawing width={288} height={175} label="S mixes node rows inside each channel; mode gains 1 and 0.5">
          {centerText(25, 'Mix node rows · left S')}
          <Operation y={58} text="mode gains [1, 0.5]" />
          {centerText(146, 'Channels stay c1 and c2', '#bbb')}
        </Drawing>
        <ColumnGrid table={trace.mixed} title="S X · second column halved" />
        <ChannelMatrix matrix={trace.channelMap} title="Right map · diag(1,w)" />
        <ColumnGrid table={trace.output} title="(S X) · channel map" />
      </div>
      <figcaption>Independent fixed fixture: the original path and X=[u_gain1,u_gain.5]. Node mixing acts on rows; the right-hand map acts on channel coordinates. Channel 1 stays cyan and channel 2 pink through all stages; parameter cells are amber. Gain 2 compensates the half-gain mode, 0 erases it, 3 amplifies it. This requires a retained nonzero invariant span and is an existence construction, not optimizer success. The manuscript's previously measured thirty-step float64 drift≈4.24×10⁻⁸ is retained evidence, not a fresh execution or exact constant.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Second channel gain w" value={gain} onChange={setGain} min={0} max={3} revision={revision} />
      <button type="button" onClick={() => {
        setGain(2);
        setRevision(value => value + 1);
      }}>Reset channel gain</button>
    </FlowControls>
    <FlowReadout data-compensated-second={trace.output.map(row => row[1]).join(',')}>The second pattern's net factor is 0.5×{num(gain, 12)}={num(.5 * gain, 12)}. A right channel map cannot restore a mode annihilated by S; it can also amplify unwanted contamination outside this chosen span.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingScaleLab() {
  const [depth, setDepth] = useState(0),
    [revision, setRevision] = useState(0),
    trace = scaleTrace(depth);
  return <FlowLab id="propagation-scale-diagnostics" label="Separate total scale from retained directions">
    <figure data-mp-drawing="D36-scale">
      <div className="mp-propagation-grid">
        <ColumnGrid table={trace.input} title="Original X · two unit columns" />
        <Drawing width={288} height={242} label="Per-round node gains 1/.5 followed by uniform channel gain 2 gives net 2/1">
          {centerText(25, 'Same channel map 2I')}
          <Operation y={58} text="Node mode gains [1, .5]" />
          <Arrow x1={144} y1={108} x2={144} y2={132} />
          <Operation y={139} text="Channel gains [2, 2]" />
          {centerText(224, 'Net factors per round [2, 1]', roleHues.computed)}
        </Drawing>
        <ColumnGrid table={trace.output} title={`Actual H · depth ${depth}`} />
      </div>
      <ExactRows caption="Four separate diagnostics · fixed original path" headers={['Diagnostic', 'Current value']} rows={[['Total squared size', trace.size], ['Raw graph variation', trace.variation], ['Variation / size', trace.relative], ['Singular values', trace.singular.map(value => num(value, 12)).join(', ')], ['Rank at absolute tolerance 1e−12', trace.rank], ['Smaller/larger singular ratio', 2 ** -depth]]} />
      <figcaption>The actual columns are [2ᵈu0,u1], with singular strengths 2ᵈ and 1. Total size grows while raw variation stays .5 and both directions remain nonzero. Variation relative to size can fall without erasing the second direction. This is uncentered graph variation, not mean-centered variance or degree division. For a separate all-zero table, size=0, variation=0 and their ratio is undefined; no epsilon converts that null into an exact score.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Uniform-gain depth" value={depth} onChange={setDepth} min={0} max={6} integer revision={revision} />
      <button type="button" onClick={() => {
        setDepth(0);
        setRevision(value => value + 1);
      }}>Reset diagnostic depth</button>
    </FlowControls>
    <FlowReadout data-scale-size={trace.size} data-scale-energy={trace.variation} data-scale-relative={trace.relative}>Depth {depth}: size {num(trace.size, 12)}, raw variation {num(trace.variation, 12)}, ratio {num(trace.relative, 12)}; singular values [{trace.singular.map(value => num(value, 9)).join(', ')}], rank {trace.rank} at absolute tolerance 10⁻¹². A tolerance relative to the largest value answers a different numerical question.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingWhiteningLab() {
  const [ridge, setRidge] = useState(0),
    [revision, setRevision] = useState(0),
    trace = whiteningTrace(ridge);
  return <FlowLab id="propagation-gram-whitening" label="Equalize retained channels and contrast erased rank">
    <figure data-mp-drawing="D37">
      <div className="mp-propagation-grid">
        <ColumnGrid table={trace.mixed} title="Y=S X · retained columns" />
        <ChannelMatrix matrix={trace.gram} title="Gram G=YᵀY" hue={roleHues.computed} />
        <Drawing width={288} height={319} label="Gram channel directions are the two coordinate axes, eigenvalues 1/.25; inverse-root factors from gamma plus ridge">
          {centerText(25, 'Channel eigendirections V=I')}
          <Operation y={57} text="γ1 = 1; γ2 = .25" />
          <Arrow x1={144} y1={108} x2={144} y2={138} />
          <Operation y={145} text="Divide by √(γ + ρ)" />
          {centerText(235, `c1 factor ${num(trace.inverse[0], 9)}`, channelHues[0])}
          {centerText(282, `c2 factor ${num(trace.inverse[1], 9)}`, channelHues[1])}
        </Drawing>
        <ChannelMatrix matrix={trace.channelMap} title="Right inverse-root map" />
        <ColumnGrid table={trace.output} title="Z · rescaled retained columns" />
        <ChannelMatrix matrix={trace.outputGram} title="Output Gram ZᵀZ" hue={roleHues.computed} />
      </div>
      <div className="mp-propagation-grid">
        <NodeOperator matrix={Array.from({
          length: 3
        }, () => [1 / 3, 1 / 3, 1 / 3])} title="Complete closed graph · node operator" />
        <ColumnGrid table={trace.lost} title="Complete graph · lost zero-mean c2" />
        <ChannelMatrix matrix={trace.lostGram} title="Singular Gram · γ2=0" hue={roleHues.computed} />
        <ChannelMatrix matrix={trace.lostMap} title="Map · zero left uninverted" />
        <ColumnGrid table={trace.lostOutput} title="Whiten retained subspace only" />
        <ChannelMatrix matrix={trace.lostOutputGram} title="Projection Gram · diag(1,0)" hue={roleHues.computed} />
      </div>
      <ExactRows caption="Exact output Gram diagonals and singular policy" headers={['Route', 'c1 diagonal', 'c2 diagonal']} rows={[['Current full-rank ridge', trace.outputGram[0][0], trace.outputGram[1][1]], ['Exact singular subspace', trace.lostOutputGram[0][0], trace.lostOutputGram[1][1]]]} />
      <figcaption>G contains uncentered column dot products. At ρ=0 full column rank gives identity; positive ridge uses G+ρI and gives γ/(γ+ρ), so it is not exact whitening. The complete three-node closed graph averages each column: its zero-mean c2 is gone before any right map. Its comparison stays fixed at exact subspace whitening with absolute tolerance 10⁻¹²; γ2=0 is never inverted. The complete 3×3 node operator has receiving-node rows and source-node columns, distinct from the 2×2 channel map. No right map can create a missing node direction: rank(YW)≤rank(Y). SVD implements the numerical inverse without squaring the condition number; reduced-SVD omitted directions need a policy before reuse on new tables.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Gram ridge ρ" value={ridge} onChange={setRidge} min={0} max={.05} step={.001} revision={revision} />
      <button type="button" onClick={() => {
        setRidge(0);
        setRevision(value => value + 1);
      }}>Reset Gram ridge</button>
    </FlowControls>
    <FlowReadout data-whitened-gram={JSON.stringify(trace.outputGram)}>Full-rank output Gram diagonals are {num(trace.outputGram[0][0], 12)} and {num(trace.outputGram[1][1], 12)}. {ridge === 0 ? 'They equal 1 in exact arithmetic.' : 'The ridge reduces amplification and moves both below 1.'} The singular case remains a rank-one projector, rather than recovery of c2.</FlowReadout>
  </FlowLab>;
}
function RoutingSupport() {
  return <Drawing width={384} height={293} label="Explicit directed edges 0→1,3→1,1→2; initial values 2,0,0,7">
    {centerText(25, 'Directed source/intermediate/target', '#eee', 192)}
    <Arrow x1={72} y1={83} x2={168} y2={146} hue={paperHues[0]} />
    <Arrow x1={72} y1={218} x2={168} y2={166} hue={paperHues[3]} />
    <Arrow x1={218} y1={156} x2={307} y2={156} hue={paperHues[1]} />
    {[[0, 48, 70, 2], [3, 48, 231, 7], [1, 192, 156, 0], [2, 336, 156, 0]].map(([node, x, y, value]) => <g key={node}>
      <circle cx={x} cy={y} r="25" fill="#111" stroke={paperHues[node]} />
      <text x={x} y={y + 6} textAnchor="middle" fill={paperHues[node]}>
        {node}
      </text>
      <text x={x} y={y + 47} textAnchor="middle">x={value}</text>
    </g>)}
  </Drawing>;
}
function RoutingSummary({
  route,
  title
}) {
  return <div>
    <NodeRow values={route.first} title={`${title} · round 1`} />
    <NodeRow values={route.second} title={`${title} · round 2`} />
  </div>;
}
export function MessagePassingRoutingLab() {
  const {
      epsilon,
      setEpsilon,
      routeRevision,
      resetRoute
    } = usePropagation(),
    trace = routedTrace(epsilon),
    ideal = routedTrace(0),
    plain = {
      first: trace.unrestrictedFirst,
      second: trace.unrestrictedSecond
    };
  return <FlowLab id="propagation-finite-routing" label="Keep a useful sender and reject its distraction">
    <figure data-mp-drawing="D38">
      <RoutingSupport />
      <div className="mp-propagation-grid">
        <RoutingSummary route={plain} title="Unrestricted sum" />
        <RoutingSummary route={ideal} title="Ideal binary limit" />
        <RoutingSummary route={trace} title="Current finite route" />
      </div>
      <div className="mp-propagation-grid">
        <ScalarProduct first={2} second={1 - epsilon} labels={['Sender 0 old row', 'Round 1 gate 0']} title="Useful product" output={trace.usefulFirst} />
        <ScalarProduct first={7} second={epsilon} labels={['Sender 3 old row', 'Round 1 gate 3']} title="Distractor product" output={trace.distractionFirst} />
        <Drawing width={288} height={265} label="Receiving node 1 sums the two sender-gated products">
          {centerText(25, 'Round 1 · receiver 1 sum')}
          {centerText(72, `${num(trace.usefulFirst, 9)} + ${num(trace.distractionFirst, 9)}`)}
          <Arrow x1={144} y1={89} x2={144} y2={118} />
          <Operation y={126} text="Add incoming products" />
          {centerText(237, `h1 = ${num(trace.first[1], 9)}`, roleHues.computed)}
        </Drawing>
        <ScalarProduct first={trace.first[1]} second={1 - epsilon} labels={['Sender 1 new row', 'Round 2 gate 1']} title="Target 2 row" output={trace.target} />
      </div>
      <ExactRows caption="Gates belong to sender and round; zero-valued senders still have named gates" headers={['Sender', 'Round 1 gate', 'Round 2 gate']} rows={trace.firstGates.map((value, source) => [String(source), value, trace.secondGates[source]])} />
      <figcaption>Each round reads its preceding complete row. Gates multiply the sender value before accumulation, never the receiver after reduction. Ideal binary gates deliver 2; unrestricted sums deliver 9. If useful sender 0 is denied while sender 3 is retained, the useful contribution is 0 and distraction 7 reaches the target: reachability alone does not identify task signal. ε=0 is an ideal limit, while 0&lt;ε&lt;1 describes finite sigmoid-compatible gates; no optimizer is run.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Routing leakage ε" value={epsilon} onChange={setEpsilon} min={0} max={.05} step={.001} revision={routeRevision} />
      <button type="button" onClick={resetRoute}>Reset routing leakage</button>
    </FlowControls>
    <FlowReadout data-routing-target={trace.target}>The target receives useful {num(trace.usefulTarget, 12)} plus distraction {num(trace.distractionTarget, 12)}={num(trace.target, 12)}. Its formula is 2(1−ε)²+7ε(1−ε). {epsilon === 0 ? 'This is the exact binary limit.' : 'The finite near-binary route is close, but not equal, to 2.'} Smaller sensitivity to irrelevant input can help this specified task.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingDepthReadoutLab() {
  const {
      epsilon
    } = usePropagation(),
    [weight, setWeight] = useState(.5),
    [revision, setRevision] = useState(0),
    trace = depthReadoutTrace(epsilon, weight);
  return <FlowLab id="propagation-depth-mixture" label="Mix existing computation depths with nonnegative weights">
    <figure data-mp-drawing="D38-depth">
      <div className="mp-propagation-grid">
        {trace.history.map((row, depth) => <VectorOperation key={depth} input={row} output={trace.terms[depth]} title={`Existing h${depth} · depth weight q${depth}`} operation={`Multiply q${depth} = ${num(trace.weights[depth], 6)}`} factor={trace.weights[depth]} />)}
        <NodeRow values={trace.output} title="Same-node sum across depths" />
      </div>
      <figcaption>This companion reads the current finite route's three already computed rows. q2 is controlled; q0=q1=(1−q2)/2, so all weights are nonnegative and sum to 1. Matching node IDs are added without changing width. These are weights of depths, distinct from concatenation, per-edge attention and sender gates; the full variational training objective is outside this local construction.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Final-depth weight q2" value={weight} onChange={setWeight} min={0} max={1} revision={revision} />
      <button type="button" onClick={() => {
        setWeight(.5);
        setRevision(value => value + 1);
      }}>Reset depth weights</button>
    </FlowControls>
    <FlowReadout data-depth-target={trace.output[2]}>Weights [{trace.weights.map(value => num(value, 12)).join(', ')}] sum to 1. At current ε={num(epsilon, 12)}, target 2's mixture is {num(trace.output[2], 12)}; only depth 2 has reached that target. All other node outputs are retained in the actual row above.</FlowReadout>
  </FlowLab>;
}
