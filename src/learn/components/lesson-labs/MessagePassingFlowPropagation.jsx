import { useState } from 'react';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import { usePropagation } from './MessagePassingFlowPropagationState.jsx';
import { Drawing, Arrow, num, compactNumber, centerText, Operation, NodeRow, Pattern, VectorOperation, PropagationSelect, ExactRows, Trajectory, NumericLegend, paperHues, roleHues } from './MessagePassingFlowPropagationElements.jsx';
import { polynomialTrace, chebyshevTrace, renormalizationTrace, propagationFixture, propagationTrace } from '../../data/message-propagation-flow-models.js';
import './message-propagation-flow.css';
import './message-aggregation-flow.css';
export { MessagePassingPropagationProvider } from './MessagePassingFlowPropagationState.jsx';
export { MessagePassingBottleneckLab, MessagePassingInitialResidualLab, MessagePassingOrdinaryResidual, MessagePassingJumpingKnowledge, MessagePassingCompensationLab, MessagePassingScaleLab, MessagePassingWhiteningLab, MessagePassingRoutingLab, MessagePassingDepthReadoutLab } from './MessagePassingFlowPropagationRemedies.jsx';
function CurrentGraph({
  selected = null
}) {
  const {
      graph,
      trace
    } = usePropagation(),
    count = graph.features.length,
    width = Math.max(288, count * 96);
  return <Drawing width={width} height={231} label={`Current ${count}-node undirected graph, paired directions; degrees ${trace.degree.join(', ')}`}>
    {centerText(25, 'Current undirected support', '#eee', width / 2)}
    {graph.adjacency.flatMap((row, i) => row.flatMap((weight, j) => j > i && weight > 0 ? [<g key={`${i}-${j}`}>
      <path d={`M${(i + .5) * width / count},71 Q${(i + j + 1) * width / count / 2},${5 + (j - i) * 14} ${(j + .5) * width / count},71`} stroke="#888" fill="none" />
      <text x={(i + j + 1) * width / count / 2} y={39 + (j - i) * 10} textAnchor="middle">
        {compactNumber(weight)}
      </text>
    </g>] : []))}
    {graph.features.map((value, i) => {
      const x = (i + .5) * width / count;
      return <g key={i}>
      <circle cx={x} cy="101" r="25" fill="#111" stroke={selected === i ? '#fff' : paperHues[i]} strokeWidth={selected === i ? 3 : 2} />
      <text x={x} y="107" textAnchor="middle" fill={paperHues[i]}>
        {i}
      </text>
      <text x={x} y="151" textAnchor="middle" fill={paperHues[i]}>x={compactNumber(value)}</text>
      <text x={x} y="182" textAnchor="middle">d={compactNumber(trace.degree[i])}</text>
    </g>;
    })}
    {centerText(218, graph.loops ? 'Unit own loops included in d' : 'No own loops', '#bbb', width / 2)}
  </Drawing>;
}
function CoordinatePair({
  focus = null
}) {
  const {
      trace,
      round
    } = usePropagation(),
    raw = trace.history[round],
    divided = trace.divided[round],
    finite = [...raw, ...divided].filter(value => value !== null),
    max = Math.max(1, ...finite.map(Math.abs));
  // Values can be huge in divided coordinates near d=0; explicit rows remain exact.
  const barDomain = max <= 32 ? Math.ceil(max) : max;
  return <div className="mp-propagation-grid">
    <div className={focus === 'raw' ? 'mp-propagation-focus' : ''}>
      <Pattern values={raw} title={`Raw S · round ${round}`} domain={barDomain} />
    </div>
    <div className={focus === 'divided' ? 'mp-propagation-focus' : ''}>
      <Pattern values={divided} title={`Divide by √d · round ${round}`} domain={barDomain} />
    </div>
  </div>;
}
function CurrentRows() {
  const {
    graph,
    trace,
    round
  } = usePropagation();
  return <ExactRows caption={`Current graph · round ${round}; null means undefined, not zero`} headers={['Node', 'Degree', 'Initial', 'Raw', 'Raw / √d', 'Looped limit', 'Limit / √d']} rows={graph.features.map((value, node) => [String(node), trace.degree[node], value, trace.history[round][node], trace.divided[round][node], trace.limit ? trace.limit[node] : 'not asserted', trace.dividedLimit ? trace.dividedLimit[node] : 'not asserted'])} />;
}
export function MessagePassingPropagationModesLab() {
  const {
      graph,
      trace,
      modeRound,
      setModeRound,
      mode,
      setMode,
      revision,
      resetModes
    } = usePropagation(),
    current = trace.modes[mode],
    scaled = current.vector.map(value => value * current.gain ** modeRound),
    coefficient = current.coefficient * current.gain ** modeRound;
  return <FlowLab id="propagation-current-modes" label="Inspect actual node patterns and repeated gains">
    <figure data-mp-drawing="D30">
      <div className="mp-propagation-grid">
        {[0, 1, 2].map(round => <NodeRow key={round} values={trace.history[round]} title={`Current graph · round ${round}`} />)}
      </div>
      <div className="mp-propagation-grid">
        {trace.modes.map(entry => <div key={entry.index}>
          <Pattern values={entry.vector} title={`Mode ${entry.index} · gain ${num(entry.gain, 3)}`} domain={1} />
          <p>Its current input coefficient is {num(entry.coefficient, 9)}.{entry.repeated && ' This repeated gain defines a subspace; its individual basis is not intrinsic.'}</p>
        </div>)}
      </div>
      <div className="mp-propagation-grid">
        <Pattern values={current.vector} title={`Mode ${mode} · original unit pattern`} domain={1} />
        <Pattern values={scaled} title={`Mode ${mode} · after ${modeRound} rounds`} domain={1} />
      </div>
      <figcaption>First follow actual node rows, then these patterns. Each mode is unit-length and mutually perpendicular; S rescales it by its gain. Gains are sorted descending. The largest absolute entry is positive, with lowest node ID breaking a numerical tie. Repeated gains have no unique basis; edited graphs recompute the whole decomposition. Signed bars share range −1…1; negative gains flip a pattern.</figcaption>
      <NumericLegend />
    </figure>
    <FlowControls>
      <AggregationQuantity label="Mode rounds" value={modeRound} onChange={setModeRound} min={0} max={12} integer revision={revision.modes} />
      <PropagationSelect label="Current mode" value={mode} onChange={value => setMode(Number(value))} options={trace.modes.map(entry => [entry.index, `Mode ${entry.index}; gain ${num(entry.gain, 6)}`])} />
      <button type="button" onClick={resetModes}>Reset mode inspection</button>
    </FlowControls>
    <FlowReadout data-current-mode-gain={current.gain} data-current-mode-coefficient={coefficient}>On this actual {graph.features.length}-node operator, mode {mode} has gain {num(current.gain, 9)}. Its coefficient {num(current.coefficient, 9)} becomes {num(coefficient, 9)} after {modeRound} rounds. The coefficient is a signed projection, not a probability. This inspection round is separate from the coordinate trajectory's 0–40 round control.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPropagationFeatureLab() {
  const context = usePropagation(),
    {
      graph,
      node,
      setNode,
      editFeature,
      revision,
      resetFeatures
    } = context;
  return <FlowLab id="propagation-initial-feature" label="Edit one initial node value">
    <figure data-mp-drawing="D30a">
      <CurrentGraph selected={node} />
      <NodeRow values={graph.features} title="Initial row · node identities" selected={node} />
    </figure>
    <FlowControls>
      <PropagationSelect label="Initial node" value={node} onChange={value => setNode(Number(value))} options={graph.features.map((_, i) => [i, `Node ${i}`])} />
      <AggregationQuantity label={`Initial node ${node} value`} value={graph.features[node]} onChange={editFeature} min={-8} max={8} revision={`${revision.features}:${node}`} />
      <button type="button" onClick={resetFeatures}>Reset initial values</button>
    </FlowControls>
    <FlowReadout>Node {node} starts at {num(graph.features[node], 12)}. Every current mode coefficient, trajectory and permitted component limit uses this same initial row. Reset restores this fixture's initial values and preserves weights, loops and inspection rounds.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPropagationEdgeLab() {
  const {
      graph,
      trace,
      left,
      selectLeft,
      right,
      setRight,
      editEdge,
      revision,
      resetEdges
    } = usePropagation(),
    weight = graph.adjacency[left][right],
    factor = trace.symmetric[left][right];
  return <FlowLab id="propagation-current-edge" label="Edit one paired relationship and recalculate degrees">
    <figure data-mp-drawing="D30b">
      <div className="mp-propagation-grid">
        <CurrentGraph selected={left} />
        <Drawing width={288} height={320} label={`Source ${right} to receiver ${left}: weight ${weight}, degrees ${trace.degree[right]} and ${trace.degree[left]}, coefficient ${factor}`}>
          {centerText(25, `Source ${right} → receiver ${left}`)}
          {centerText(70, `Relationship w = ${num(weight, 9)}`, roleHues.parameter)}
          {centerText(111, `Sender degree = ${num(trace.degree[right], 9)}`)}
          {centerText(152, `Receiver degree = ${num(trace.degree[left], 9)}`)}
          <Arrow x1={144} y1={169} x2={144} y2={195} />
          <Operation y={202} text="w × inv√dᵣ × inv√dₛ" width={270} />
          {centerText(291, `coefficient = ${num(factor, 9)}`, roleHues.computed)}
        </Drawing>
      </div>
      <figcaption>Weights are nonnegative and each edit changes both directions. Every distinct endpoint pair is editable, including an absent edge. Zero removes that relationship. Separate inverse-degree factors preserve valid tiny positive weights without multiplying their degrees into an underflowing intermediate.</figcaption>
    </figure>
    <FlowControls>
      <PropagationSelect label="First endpoint" value={left} onChange={value => selectLeft(Number(value))} options={graph.features.map((_, i) => [i, `Node ${i}`])} />
      <PropagationSelect label="Other endpoint" value={right} onChange={value => setRight(Number(value))} options={graph.features.flatMap((_, i) => i === left ? [] : [[i, `Node ${i}`]])} />
      <AggregationQuantity label={`Relationship ${left}–${right} weight`} value={weight} onChange={editEdge} min={0} max={4} revision={`${revision.edges}:${left}:${right}`} />
      <button type="button" onClick={resetEdges}>Reset relationship weights</button>
    </FlowControls>
    <FlowReadout data-current-edge-factor={factor}>The current degree row is [{trace.degree.map(value => num(value, 9)).join(', ')}]. This directed contribution uses coefficient {num(factor, 12)}. Reset restores this fixture's support/weights and retains current features, loops and rounds.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPropagationCoordinates() {
  const {
      trace,
      round
    } = usePropagation(),
    domain = Math.max(1, ...[...trace.history.flat(), ...trace.divided.flat()].filter(value => value !== null).map(Math.abs));
  return <figure data-mp-drawing="D31">
    <CoordinatePair />
    <div className="mp-propagation-pair">
      <Trajectory history={trace.history} round={round} domain={domain} title="Current graph · raw S trajectory" />
      <Trajectory history={trace.divided} round={round} domain={domain} title="Same graph · divided trajectory" />
    </div>
    <div className="mp-propagation-legend">
      {trace.features.map((_, node) => <span key={node} style={{
        color: paperHues[node]
      }}>Node {node}</span>)}
    </div>
    <details>
      <summary>Inspect every computed round</summary>
      <ExactRows caption="All current graph rounds; degree-zero divisions are undefined" headers={['Round', 'Raw S row', 'Divided row']} rows={trace.history.map((row, step) => [String(step), row.map(value => num(value, 12)).join(', '), trace.divided[step].map(value => num(value, 12)).join(', ')])} />
    </details>
    <CurrentRows />
    <div className="mp-propagation-grid">
      <NodeRow values={trace.limit ?? trace.features.map(() => null)} title="Raw component limit" />
      <NodeRow values={trace.dividedLimit ?? trace.features.map(() => null)} title="Degree-divided component limit" />
    </div>
    <figcaption>Both coordinate systems describe the same current round {round}, using the current graph's degrees. Paired signed bars have the same labelled numeric range. The two complete trajectories also share their explicitly labelled value scale; at extreme degree-divided magnitudes it becomes signed log(1+|value|). Lines join computed integer rounds, without asserting a continuous-time process. White markers name the selected round. With positive loops, each connected component has its own stationary projection; raw values follow √degree and divided limits are constant within that component. No limit is asserted for a loop-free graph; — means undefined or not asserted and is explained in the table.</figcaption>
  </figure>;
}
export function MessagePassingPropagationRoundsLab() {
  const {
    graph,
    trace,
    round,
    setRound,
    setLoops,
    revision,
    resetRounds
  } = usePropagation();
  return <FlowLab id="propagation-coordinate-rounds" label="Advance the shared synchronous trajectory">
    <figure data-mp-drawing="D31a">
      <CurrentGraph />
      <CoordinatePair />
    </figure>
    <FlowControls>
      <AggregationQuantity label="Coordinate rounds" value={round} onChange={setRound} min={0} max={40} integer revision={revision.rounds} />
      <label><input type="checkbox" checked={graph.loops} onChange={event => setLoops(event.target.checked)} /> Positive unit own loops</label>
      <button type="button" onClick={resetRounds}>Reset rounds and loops</button>
    </FlowControls>
    <FlowReadout data-propagation-current={trace.history[round].join(',')} data-propagation-divided={JSON.stringify(trace.divided[round])}>Round {round} reads the preceding complete row synchronously. Raw=[{trace.history[round].map(value => num(value, 9)).join(', ')}]; divided=[{trace.divided[round].map(value => num(value, 9)).join(', ')}]. {graph.loops ? 'A finite nonnegative undirected graph with these positive loops has a stationary limit for each connected component.' : 'Without loops, periodic modes may remain; degree-zero propagated rows are zero, while their divided coordinates are undefined.'} Reset restores this fixture's loop choice and round 4, preserving feature and weight edits.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPropagationCoordinateLab() {
  const {
    trace,
    round,
    coordinate,
    setCoordinate
  } = usePropagation();
  const f = trace.convertedInitial,
    safeF = f.map(value => value ?? 0),
    pNext = trace.mean.map(row => row.reduce((total, factor, i) => total + factor * safeF[i], 0));
  return <FlowLab id="propagation-coordinate-change" label="Highlight raw or degree-divided coordinates without hiding either">
    <figure data-mp-drawing="D31b">
      <CoordinatePair focus={coordinate} />
      <div className="mp-propagation-grid">
        <VectorOperation input={trace.history[0]} output={trace.divided[1]} title="Raw x → S → /√d" operation="Same graph: S then / √d" />
        <VectorOperation input={f} output={pNext.map((value, i) => trace.degree[i] ? value : null)} title="Converted f → receiver average P" operation="Same graph: P f" />
      </div>
      <figcaption>The two one-round routes start in different coordinates: f=x/√d. They end together when all degrees are positive. A degree-zero port shows — because its coordinate conversion is undefined, as the exact row table states. No invertible similarity claim includes such a node.</figcaption>
    </figure>
    <FlowControls>
      <FlowChoice label="Emphasize coordinates" value={coordinate} onChange={setCoordinate} options={[['raw', 'Raw S row'], ['divided', 'Divide by √d']]} />
      <button type="button" onClick={() => setCoordinate('raw')}>Reset coordinate emphasis</button>
    </FlowControls>
    <FlowReadout>Both named round {round} results remain visible. P(x/√d) equals (Sx)/√d at positive-degree nodes; P on unchanged raw x is a different calculation. {trace.degree.some(value => value === 0) && 'The current graph contains degree 0, so this change of coordinates is not invertible.'}</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPropagationCounterexamplesLab() {
  const {
      graph,
      trace,
      choose
    } = usePropagation(),
    periodic = propagationTrace([[0, 1], [1, 0]], [1, 4], false, 2),
    disconnected = propagationFixture('disconnected');
  return <FlowLab id="propagation-counterexamples" label="Inspect periodic and componentwise limits">
    <figure data-mp-drawing="D31c">
      <div className="mp-propagation-grid">
        <VectorOperation input={periodic.history[0]} output={periodic.history[1]} title="No loops · swap once" operation="S swaps the two rows" />
        <VectorOperation input={periodic.history[1]} output={periodic.history[2]} title="No loops · swap again" operation="Gain −1 does not shrink" />
        <VectorOperation input={disconnected.features} output={[2, 2, 6, 6]} title="Two looped components" operation="Each component averages" />
      </div>
      <CurrentGraph />
      <figcaption>These counterexamples stay visible. The actions below replace the current fixture, including its named initial values; all endpoint/value editors still work within its 2/3/4-node domain. Removing every relationship without loops exposes degree 0. Adding an edge between the two components merges their stationary directions.</figcaption>
    </figure>
    <FlowControls>
      <button type="button" onClick={() => choose('periodic')}>Two-node no-loop swap</button>
      <button type="button" onClick={() => choose('disconnected')}>Two looped components</button>
      <button type="button" onClick={() => choose('path')}>Restore original path</button>
    </FlowControls>
    <FlowReadout data-propagation-fixture={graph.fixture}>The current fixture has {graph.features.length} nodes and {trace.groups.length} connected components. {graph.loops ? 'Its current component projections use its edited weights and values.' : 'The no-loop example has a persistent alternating mode; a long trajectory does not prove convergence.'} These fixture actions reset their source rows and inspections; smaller scoped resets above preserve the other current edits.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingFrequencyLab() {
  const [power, setPower] = useState(1),
    [revision, setRevision] = useState(0),
    mode = [-Math.sqrt(3 / 14), 2 / Math.sqrt(7), -Math.sqrt(3 / 14)],
    frequencies = [0, .5, 7 / 6, 2];
  const x = value => 55 + value * 180,
    y = value => 208 - value * 112,
    samples = Array.from({
      length: 161
    }, (_, i) => i / 80),
    points = absolute => samples.map(value => `${x(value)},${y(absolute ? Math.abs(1 - value) ** power : (1 - value) ** power)}`).join(' ');
  return <FlowLab id="propagation-frequency-gain" label="Compare signed frequency gain with its magnitude">
    <figure data-mp-drawing="D32">
      <Pattern values={mode} title="Original path · sign-changing mode" domain={1} />
      <Drawing width={480} height={390} label={`Frequency 0 to 2, dimensionless signed and magnitude gains after ${power} rounds`}>
        {centerText(25, 'Signed gain and magnitude · same axes', '#eee', 240)}
        <path d="M55,70V325H425 M55,208H425" stroke="#777" fill="none" />
        {[0, .5, 1, 1.5, 2].map(value => <g key={value}>
          <path d={`M${x(value)},325v6`} stroke="#aaa" />
          <text x={x(value)} y="353" textAnchor="middle">
            {num(value, 2)}
          </text>
        </g>)}
        {[-1, 0, 1].map(value => <text key={value} x="42" y={y(value) + 6} textAnchor="end">
          {value}
        </text>)}
        <polyline points={points(true)} stroke="#82d3ed" fill="none" strokeWidth="3" strokeDasharray="7 4" />
        <polyline points={points(false)} stroke="#e4b752" fill="none" strokeWidth="2" />
        {frequencies.map(value => <circle key={value} cx={x(value)} cy={y((1 - value) ** power)} r="4" fill="#e4b752" />)}
        {centerText(382, 'Graph frequency λ · dimensionless', '#bbb', 240)}
      </Drawing>
      <div className="mp-propagation-legend">
        <span style={{
          color: '#e4b752'
        }}>Solid amber: signed(1−λ)ᵖ</span>
        <span style={{
          color: '#82d3ed'
        }}>Dashed cyan: magnitude|1−λ|ᵖ</span>
      </div>
      <ExactRows caption="Actual path frequencies and the loop-free boundary" headers={['λ', 'Signed gain', 'Magnitude']} rows={frequencies.map(value => [num(value, 9), (1 - value) ** power, Math.abs(1 - value) ** power])} />
      <figcaption>This constructed frequency response uses the original unit-weight looped path's λ=0,.5,7/6 and the λ=2 boundary. It is separate from the edited operator above. An even power makes the two curves coincide; the labelled gain table records that null contrast. The magnitude rises again beyond λ=1.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Frequency power" value={power} onChange={setPower} min={1} max={6} integer revision={revision} />
      <button type="button" onClick={() => {
        setPower(1);
        setRevision(value => value + 1);
      }}>Reset frequency power</button>
    </FlowControls>
    <FlowReadout data-frequency-sign={(1 - 7 / 6) ** power}>The path's λ=7/6 pattern has signed gain {num((1 - 7 / 6) ** power, 12)} and magnitude {num(Math.abs(1 - 7 / 6) ** power, 12)}. At λ=2 the magnitude stays 1; its sign is {power % 2 ? 'negative' : 'positive'}. Higher frequency does not mean monotonically smaller magnitude over [0,2].</FlowReadout>
  </FlowLab>;
}
export function MessagePassingPolynomialLab() {
  const [degree, setDegree] = useState(2),
    [revision, setRevision] = useState(0),
    path = propagationFixture(),
    worked = polynomialTrace(path.adjacency, path.features, 2),
    chain = [[0, 1, 0, 0], [1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0]],
    input = [0, 0, 0, 1],
    trace = polynomialTrace(chain, input, degree);
  return <FlowLab id="propagation-polynomial-ranges" label="Combine powers and inspect a genuine third-hop route">
    <figure data-mp-drawing="D33">
      <div className="mp-propagation-grid">
        {worked.powers.map((row, k) => <VectorOperation key={k} input={row} output={worked.terms[k].values} title={`Worked path · S${k === 0 ? '⁰=I' : k === 1 ? '' : '²'}`} operation={`Multiply by coefficient ${worked.terms[k].coefficient}`} factor={worked.terms[k].coefficient} />)}
        <NodeRow values={worked.output} title="Worked quadratic · add the three rows" />
      </div>
      <Drawing width={384} height={212} label="Changed four-node chain 0–1–2–3; a signal starts only at 3; each relationship permits both directions">
        {centerText(25, 'Changed fixture · 0—1—2—3', '#eee', 192)}
        {[0, 1, 2].map(node => <Arrow key={node} x1={72 + node * 96} y1={97} x2={120 + node * 96} y2={97} both />)}
        {input.map((value, node) => <g key={node}>
          <circle cx={48 + node * 96} cy="97" r="24" fill="#111" stroke={paperHues[node]} />
          <text x={48 + node * 96} y="103" textAnchor="middle" fill={paperHues[node]}>
            {node}
          </text>
          <text x={48 + node * 96} y="149" textAnchor="middle">x={value}</text>
        </g>)}
        {centerText(194, 'Closed degrees [2,3,3,2]', '#bbb', 192)}
      </Drawing>
      <div className="mp-propagation-grid">
        {trace.powers.map((row, k) => <NodeRow key={k} values={row} title={`Chain · power ${k}`} />)}
        <NodeRow values={trace.output} title={`Chain · weighted sum degree ${degree}`} />
      </div>
      <ExactRows caption="Declared coefficient family and node 0's actual terms" headers={['Power', 'Coefficient', 'Sᵏx at node 0', 'Product']} rows={trace.terms.map((term, k) => [String(k), term.coefficient, trace.powers[k][0], term.values[0]])} />
      <figcaption>The worked path quadratic is fixed. The four-node chain uses the same family 1,1/2,1/4,1/8 truncated by the degree control. I/S/S² cannot deliver node 3's signal to node 0; S³ follows 3→2→1→0 and gives 1/18 before its 1/8 coefficient. A degree r has r+1 terms and at most r hops; cancellation can reduce actual support.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Chain filter degree" value={degree} onChange={setDegree} min={0} max={3} integer revision={revision} />
      <button type="button" onClick={() => {
        setDegree(2);
        setRevision(value => value + 1);
      }}>Reset filter degree</button>
    </FlowControls>
    <FlowReadout data-chain-filter-node-zero={trace.output[0]}>The current chain filter has {degree + 1} terms, maximum degree {degree}, and node 0 output {num(trace.output[0], 12)}. {degree < 3 ? 'The source is outside this degree’s possible support.' : 'Its three-edge contribution is (1/8)×(1/18)=1/144.'} Sparse repeated products execute this route; the explanatory eigensystem is unnecessary.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingChebyshev() {
  const trace = chebyshevTrace();
  return <figure data-mp-drawing="D33-chebyshev">
    <div className="mp-propagation-grid">
      {trace.basis.map((row, k) => <VectorOperation key={k} input={row} output={trace.terms[k]} title={['Z0 = X', 'Z1 = −S X', 'Z2 = 2S²X − X'][k]} operation={`Multiply c${k} = ${trace.coefficients[k]}`} factor={trace.coefficients[k]} />)}
      <NodeRow values={trace.output} title="Add terms · same worked quadratic" />
    </div>
    <figcaption>These actual original-path basis rows use the valid bound b=2, so L̃=2(I−S)/2−I=−S. Z2=2L̃Z1−Z0. Coefficients 1.125,−.5,.125 recover I+.5S+.25S². The bound is not the path's largest frequency; the recurrence uses local multiplication, not eigenvectors.</figcaption>
  </figure>;
}
export function MessagePassingRenormalization() {
  const trace = renormalizationTrace();
  return <figure data-mp-drawing="D33-renormalization">
    <div className="mp-propagation-pair">
      <div>
        <NodeRow values={trace.features} degree={trace.open.degree} title="Open path · own plus neighbors" />
        <VectorOperation input={trace.features} output={trace.neighbor} title="Open normalized neighbor route R" operation="Each edge factor1/√2" />
        <VectorOperation input={trace.neighbor} output={trace.ownPlusOpen} title="Add own row · coefficient 1" operation="x + R x" />
      </div>
      <div>
        <NodeRow values={trace.features} degree={trace.closed.degree} title="Own edges before degrees" />
        <VectorOperation input={trace.features} output={trace.closedOutput} title="Closed normalized route S" operation="Edge1/√6; own1/d" />
      </div>
    </div>
    <ExactRows caption="Every receiving coefficient in the two paths" headers={['Receiver←source', 'I + open R', 'Closed S']} rows={trace.open.symmetric.flatMap((row, receiver) => row.flatMap((factor, source) => factor || receiver === source ? [[`${receiver}←${source}`, factor + Number(receiver === source), trace.closed.symmetric[receiver][source]]] : []))} />
    <figcaption>The same original input goes through two different operators. Open degrees are [1,2,1]; closed degrees are [2,3,2]. Own coefficients change 1→1/d; edge coefficients change 1/√2→1/√6. The outputs differ, so renormalization is a model choice. The stationary mode doubles under I+R; bounded S alone does not bound arbitrary learned maps.</figcaption>
  </figure>;
}
